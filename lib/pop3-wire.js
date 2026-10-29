import Pop3Command from 'node-pop3';
import { isIP } from 'node:net';
export class Pop3WireError extends Error {
}
export class Pop3CommandError extends Pop3WireError {
    command;
    constructor(command) {
        super('POP3 服务器不支持或拒绝了 ' + command);
        this.command = command;
    }
}
/** Pin node-pop3 0.15.3: retain its connection/command API, bound binary framing here. */
class BoundedPop3 extends Pop3Command {
    responseLimit = 8 * 1024 * 1024;
    parts = [];
    received = 0;
    totalReceived = 0;
    lineBytes = 0;
    _updateStream() {
        this.parts = [];
        this.received = 0;
        this.lineBytes = 0;
        const stream = super._updateStream();
        stream.on('error', () => { });
        return stream;
    }
    _pushStream(buffer) {
        this.received += buffer.length;
        this.totalReceived += buffer.length;
        if (this.received > this.responseLimit || this.totalReceived > 64 * 1024 * 1024) {
            this.emit('error', new Pop3WireError('POP3 响应超过大小上限'));
            this._socket?.destroy();
            return;
        }
        let start = 0;
        while (start < buffer.length) {
            const lf = buffer.indexOf(10, start);
            const piece = buffer.subarray(start, lf < 0 ? undefined : lf + 1);
            this.parts.push(piece);
            this.lineBytes += piece.length;
            if (this.lineBytes > 1024 * 1024 || this.parts.length > 8192) {
                this.emit('error', new Pop3WireError('POP3 单行过长或分片过多'));
                this._socket?.destroy();
                return;
            }
            if (lf < 0)
                return;
            const line = this.parts.length === 1 ? piece : Buffer.concat(this.parts);
            this.parts = [];
            this.lineBytes = 0;
            if (line.length < 2 || line.at(-2) !== 13) {
                this.emit('error', new Pop3WireError('POP3 响应格式无效'));
                this._socket?.destroy();
                return;
            }
            if (line.length === 3 && line[0] === 46) {
                this._endStream();
                return;
            }
            this._stream?.push(line[0] === 46 && line[1] === 46 ? line.subarray(1) : line);
            start = lf + 1;
        }
    }
}
/** One exclusive, bounded session. No model-generated command or server error is returned. */
export async function withPop3(cfg, task, signal, options = {}) {
    const endpoint = cfg.pop3;
    if (!endpoint || cfg.transport !== 'pop3')
        throw new Error('POP3 账号配置无效');
    if (/[\r\n\0]/.test(cfg.authUser + cfg.authPassword))
        throw new Error('POP3 登录凭据不能包含换行');
    const cancel = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(options.timeoutMs ?? 120000)]);
    cancel.throwIfAborted();
    const tlsOptions = { ...options.tlsOptions, servername: isIP(endpoint.host) ? undefined : endpoint.host, rejectUnauthorized: true, minVersion: 'TLSv1.2' };
    const client = new BoundedPop3({ host: endpoint.host, port: endpoint.port, tls: endpoint.secure,
        timeout: Math.min(60000, Math.max(1000, endpoint.socketTimeoutMs ?? 15000)),
        user: cfg.authUser, password: cfg.authPassword, parseStreamToString: false,
        tlsOptions });
    const ownedSocket = { current: null };
    const errors = (error) => { client._stream?.destroy(error); };
    client.on('error', errors);
    let rejectAbort = () => { };
    const aborted = new Promise((_, reject) => { rejectAbort = reject; });
    const stop = () => {
        const reason = cancel.reason instanceof Error ? cancel.reason : new Error('POP3 操作已取消');
        rejectAbort(reason);
        client.emit('error', reason);
        client._socket?.destroy();
    };
    cancel.addEventListener('abort', stop, { once: true });
    const wire = { signal: cancel, async command(name, args = [], limit = 8 * 1024 * 1024) {
            cancel.throwIfAborted();
            if (!['USER', 'PASS', 'STAT', 'UIDL', 'LIST', 'TOP', 'RETR', 'QUIT'].includes(name)
                || args.some(v => /[\r\n\0]/.test(String(v))))
                throw new Error('无效 POP3 命令');
            client.responseLimit = limit;
            let result;
            try {
                result = await client.command(name, ...args);
            }
            catch (error) {
                if (error instanceof Pop3WireError)
                    throw error;
                if (error !== null && typeof error === 'object' && 'command' in error && String(error.command).split(' ')[0] === name)
                    throw new Pop3CommandError(name);
                throw error;
            }
            const [info, stream] = result;
            if (!stream)
                return { info };
            const chunks = [];
            let size = 0;
            for await (const chunk of stream) {
                cancel.throwIfAborted();
                const data = Buffer.from(chunk);
                size += data.length;
                if (size > limit)
                    throw new Pop3WireError('POP3 响应超过大小上限');
                chunks.push(data);
            }
            cancel.throwIfAborted();
            return { info, bytes: Buffer.concat(chunks, size) };
        } };
    try {
        return await Promise.race([(async () => {
                const connecting = client.connect();
                ownedSocket.current = client._socket;
                client._socket?.once('close', () => client.emit('error', new Pop3WireError('POP3 连接已断开，请重试')));
                client._socket?.prependListener('data', (bytes) => {
                    const head = !client._stream ? Buffer.concat([client._pendingResponseBuffer, bytes.subarray(0, 16385)]) : Buffer.alloc(0);
                    const end = head.indexOf('\r\n');
                    if (!client._stream && (end > 16384 || end < 0 && head.length > 16384)) {
                        client.emit('error', new Pop3WireError('POP3 状态行过长'));
                        client._socket?.destroy();
                    }
                });
                let connectTimer;
                try {
                    await Promise.race([connecting, new Promise((_, reject) => {
                            connectTimer = setTimeout(() => reject(new Error('POP3 连接超时')), Math.min(60000, Math.max(1000, endpoint.connectionTimeoutMs ?? 10000)));
                        })]);
                }
                finally {
                    clearTimeout(connectTimer);
                }
                await wire.command('USER', [cfg.authUser]);
                await wire.command('PASS', [cfg.authPassword]);
                const value = await task(wire);
                cancel.throwIfAborted();
                let timer;
                try {
                    await Promise.race([wire.command('QUIT').catch(() => { }), new Promise(resolve => { timer = setTimeout(resolve, 500); })]);
                }
                finally {
                    clearTimeout(timer);
                }
                return value;
            })(), aborted]);
    }
    catch (error) {
        if (cancel.aborted)
            throw cancel.reason;
        // Authentication responses can quote passwords; only our actionable generic error leaves here.
        if (error instanceof Pop3WireError)
            throw error;
        throw new Error('POP3 连接或读取失败：请检查主机、TLS、授权码、服务是否开启，或稍后重试');
    }
    finally {
        cancel.removeEventListener('abort', stop);
        client._stream?.destroy();
        client.emit('error', new Error('POP3 会话已结束'));
        client._socket?.destroy();
        ownedSocket.current?.destroy();
    }
}
