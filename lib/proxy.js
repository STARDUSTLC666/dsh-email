/**
 * Proxy dialling for the mail transports.
 *
 * IMAP does not come through here: ImapFlow already negotiates HTTP CONNECT and
 * SOCKS through its own `proxy` option, so `createImap` hands the URL over and
 * lets that implementation do the work.
 *
 * SMTP does not have that luxury — nodemailer ships no proxy support at all —
 * but the plugin already owns the SMTP socket through its `getSocket` hook, so
 * this module supplies the one thing that hook is missing: a socket that
 * reaches the mail host *through* the proxy. The caller keeps doing its own TLS
 * upgrade, which is why the returned socket is the raw tunnel and never a TLS
 * one: the SMTP layer starts TLS on it with `servername` set to the real mail
 * host, so certificate validation still checks the host the user configured
 * rather than the proxy they happen to use.
 *
 * Where the proxy comes from: the account's `proxy` field first, then the
 * conventional environment variables. The fallback matters because a desktop
 * app started from Explorer inherits the machine's environment, and on a
 * machine whose traffic is already routed (Clash, a corporate MITM, a SOCKS
 * gateway) the account should not have to repeat the endpoint by hand.
 */
import { connect as connectTcp, isIP } from 'node:net';
import { connect as connectTls } from 'node:tls';
import { SocksClient } from 'socks';
/** The variable names git, curl and the Node ecosystem all agree on, in priority order. */
const PROXY_ENV_NAMES = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy'];
/** `NO_PROXY` is matched the way curl matches it: exact host, domain suffix, or `*`. */
const NO_PROXY_ENV_NAMES = ['NO_PROXY', 'no_proxy'];
const DEFAULT_PORTS = {
    'http:': 80,
    'https:': 443,
    'socks:': 1080,
    'socks4:': 1080,
    'socks4a:': 1080,
    'socks5:': 1080,
    'socks5h:': 1080,
};
/** Schemes `parseProxyUrl` accepts, in the spelling the user writes them. */
export const PROXY_SCHEMES = ['http', 'https', 'socks', 'socks4', 'socks4a', 'socks5', 'socks5h'];
function proxyPort(url) {
    if (url.port !== '')
        return Number(url.port);
    return DEFAULT_PORTS[url.protocol] ?? 1080;
}
/**
 * Read a proxy address the way a user writes one.
 *
 * `127.0.0.1:7897` is what people paste, so a missing scheme means `http` (the
 * CONNECT-flavoured HTTP proxy every desktop client ships) rather than a URL
 * parse failure. Credentials stay in the URL because both schemes authenticate
 * with them.
 */
export function parseProxyUrl(value) {
    const text = (value ?? '').trim();
    if (text === '')
        return undefined;
    let url;
    try {
        url = new URL(text.includes('://') ? text : `http://${text}`);
    }
    catch {
        throw new Error(`代理地址无效："${text}"（示例：http://127.0.0.1:7897 或 socks5://127.0.0.1:1080）`);
    }
    const scheme = url.protocol.replace(/:$/, '');
    if (!PROXY_SCHEMES.includes(scheme)) {
        throw new Error(`不支持的代理协议 "${scheme}"：可用 ${PROXY_SCHEMES.join(' / ')}`);
    }
    if (url.hostname === '')
        throw new Error(`代理地址缺少主机："${text}"`);
    return url;
}
function noProxyBypassed(host, env) {
    const raw = NO_PROXY_ENV_NAMES.map(name => env[name]).find(value => typeof value === 'string' && value.trim() !== '');
    if (raw === undefined)
        return false;
    const target = host.toLowerCase();
    return raw.split(',').some(entry => {
        const pattern = entry.trim().toLowerCase();
        if (pattern === '')
            return false;
        if (pattern === '*')
            return true;
        // NO_PROXY entries are plain hosts, optional port, optional leading dot.
        const bare = pattern.replace(/^\./, '').replace(/:\d+$/, '');
        return target === bare || target.endsWith(`.${bare}`);
    });
}
/**
 * The proxy this account should use, or undefined for a direct connection.
 *
 * An explicit `proxy` wins even when `NO_PROXY` matches: the user typed it for
 * this account, so the environment's bypass list must not quietly ignore it.
 */
export function resolveProxyUrl(explicit, env = process.env, host) {
    const configured = parseProxyUrl(explicit);
    if (configured !== undefined)
        return configured.href;
    if (host !== undefined && noProxyBypassed(host, env))
        return undefined;
    for (const name of PROXY_ENV_NAMES) {
        const value = env[name];
        if (typeof value === 'string' && value.trim() !== '') {
            const fromEnv = parseProxyUrl(value);
            if (fromEnv !== undefined)
                return fromEnv.href;
        }
    }
    return undefined;
}
/** Cap the CONNECT response header, so a silent proxy cannot grow memory forever. */
const MAX_HEADER_BYTES = 64 * 1024;
function authority(host, port) {
    return isIP(host) === 6 ? `[${host}]:${port}` : `${host}:${port}`;
}
function proxyError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}
/** Open the TCP (or proxy-TLS) leg to the proxy itself. */
function connectToProxy(url, timeoutMs) {
    const port = proxyPort(url);
    const host = url.hostname.replace(/^\[(.*)\]$/, '$1');
    return new Promise((resolve, reject) => {
        const socket = url.protocol === 'https:'
            ? connectTls({ host, port, servername: isIP(host) === 0 ? host : undefined })
            : connectTcp({ host, port });
        const timer = setTimeout(() => {
            socket.destroy();
            reject(proxyError(`连接代理 ${host}:${port} 超时`, 'PROXY_TIMEOUT'));
        }, timeoutMs);
        const settle = (error) => {
            clearTimeout(timer);
            socket.removeListener('connect', onConnect);
            socket.removeListener('error', onError);
            if (error === null)
                resolve(socket);
            else {
                socket.destroy();
                reject(error);
            }
        };
        const onConnect = () => settle(null);
        const onError = (error) => settle(proxyError(`无法连接代理 ${host}:${port}：${error.message}`, 'PROXY_UNREACHABLE'));
        socket.once('connect', onConnect);
        socket.once('error', onError);
    });
}
/**
 * HTTP CONNECT: one request line, one status line, then the proxy stops talking
 * and the socket becomes a raw tunnel.
 */
async function connectHttpProxy(url, host, port, timeoutMs) {
    const socket = await connectToProxy(url, timeoutMs);
    const headers = [`CONNECT ${authority(host, port)} HTTP/1.1`, `Host: ${authority(host, port)}`];
    if (url.username !== '' || url.password !== '') {
        // URL userinfo is percent-encoded; the header needs the decoded value.
        const decode = (value) => { try {
            return decodeURIComponent(value);
        }
        catch {
            return value;
        } };
        headers.push(`Proxy-Authorization: Basic ${Buffer.from(`${decode(url.username)}:${decode(url.password)}`).toString('base64')}`);
    }
    headers.push('Proxy-Connection: Keep-Alive', '', '');
    return new Promise((resolve, reject) => {
        let buffered = Buffer.alloc(0);
        let settled = false;
        const finish = (error) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            socket.removeListener('data', onData);
            socket.removeListener('error', onError);
            socket.removeListener('close', onClose);
            if (error !== null) {
                socket.destroy();
                reject(error);
            }
            else
                resolve(socket);
        };
        const timer = setTimeout(() => finish(proxyError('代理 CONNECT 协商超时', 'PROXY_TIMEOUT')), timeoutMs);
        const onError = (error) => finish(proxyError(`代理连接中断：${error.message}`, 'PROXY_UNREACHABLE'));
        const onClose = () => finish(proxyError('代理在 CONNECT 响应前关闭了连接', 'PROXY_CLOSED'));
        const onData = (chunk) => {
            buffered = Buffer.concat([buffered, chunk]);
            if (buffered.length > MAX_HEADER_BYTES) {
                finish(proxyError('代理 CONNECT 响应头过长', 'PROXY_BAD_RESPONSE'));
                return;
            }
            const end = buffered.indexOf('\r\n\r\n');
            if (end < 0)
                return;
            const head = buffered.subarray(0, end).toString('latin1');
            const status = Number(head.split(' ', 2)[1] ?? '0');
            const rest = buffered.subarray(end + 4);
            // Anything after the header block is the tunnel's own first bytes, so it
            // is handed back to the socket before the TLS layer starts reading.
            if (rest.length > 0)
                socket.unshift(rest);
            if (status < 200 || status >= 300) {
                const line = head.split('\r\n')[0] ?? '';
                finish(proxyError(`代理拒绝了 CONNECT ${authority(host, port)}：HTTP ${status} ${line}`.trim(), 'PROXY_CONNECT_REFUSED'));
                return;
            }
            finish(null);
        };
        socket.on('data', onData);
        socket.once('error', onError);
        socket.once('close', onClose);
        socket.write(headers.join('\r\n'), 'latin1');
    });
}
/** SOCKS4/4a/5/5h through the `socks` package: it owns the handshake and its variants. */
async function connectSocksProxy(url, host, port, timeoutMs) {
    const type = url.protocol.startsWith('socks4') ? 4 : 5;
    const decode = (value) => { try {
        return decodeURIComponent(value);
    }
    catch {
        return value;
    } };
    try {
        const { socket } = await SocksClient.createConnection({
            proxy: {
                host: url.hostname.replace(/^\[(.*)\]$/, '$1'),
                port: proxyPort(url),
                type,
                ...(url.username !== '' ? { userId: decode(url.username) } : {}),
                ...(url.password !== '' ? { password: decode(url.password) } : {}),
            },
            command: 'connect',
            // hostnames are resolved by the proxy (socks4a/5/5h) which is what makes
            // socks5h honest: the local resolver never sees the mail host.
            destination: { host, port },
            timeout: timeoutMs,
        });
        return socket;
    }
    catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw proxyError(`SOCKS 代理连接 ${authority(host, port)} 失败：${reason}`, 'PROXY_UNREACHABLE');
    }
}
/**
 * A raw socket to `host:port` reached through `proxy`.
 *
 * The returned socket is not yet encrypted: an SMTP/POP3 caller upgrades it
 * itself (with `servername` set to `host`) when the endpoint is a TLS one.
 */
export async function openProxiedSocket(proxy, host, port, options = {}) {
    const url = proxy instanceof URL ? proxy : parseProxyUrl(proxy);
    if (url === undefined)
        throw proxyError('代理地址为空', 'PROXY_INVALID');
    const timeoutMs = Math.max(1000, options.timeoutMs ?? 30000);
    const socket = url.protocol === 'http:' || url.protocol === 'https:'
        ? await connectHttpProxy(url, host, port, timeoutMs)
        : await connectSocksProxy(url, host, port, timeoutMs);
    socket.setNoDelay(true);
    return socket;
}
