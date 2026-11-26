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
import { request as requestHttp } from 'node:http';
import { connect as connectTcp, isIP } from 'node:net';
import { Readable } from 'node:stream';
import { connect as connectTls } from 'node:tls';
import { SocksClient } from 'socks';
import { mailTlsOptions } from './mail-tls.js';
const NATIVE_FETCH = globalThis.fetch;
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
    if (text === '' || text.toLowerCase() === 'direct')
        return undefined;
    let url;
    try {
        url = new URL(text.includes('://') ? text : `http://${text}`);
    }
    catch {
        throw new Error('代理地址无效（示例：http://127.0.0.1:7897 或 socks5://127.0.0.1:1080）。代理凭据不会回显。');
    }
    const scheme = url.protocol.replace(/:$/, '');
    if (!PROXY_SCHEMES.includes(scheme)) {
        throw new Error(`不支持的代理协议 "${scheme}"：可用 ${PROXY_SCHEMES.join(' / ')}`);
    }
    if (url.hostname === '' || proxyPort(url) < 1 || url.search || url.hash || (url.pathname !== '' && url.pathname !== '/'))
        throw new Error('代理地址应只包含协议、登录凭据、主机与端口，不应包含路径或查询参数。');
    return url;
}
/**
 * A target that only exists on this machine. An env-configured proxy cannot
 * reach it: a CONNECT to 127.0.0.1 or ::1 would ask the *proxy host* for its own
 * loopback, which is wrong at best and blocked at worst. A local SMTP relay or
 * test fixture must therefore stay direct even when HTTPS_PROXY is set.
 *
 * An explicit per-account `proxy` still wins — resolveProxyUrl returns before
 * consulting this, so a user who really means to tunnel keeps that choice.
 */
function isLoopbackTarget(host) {
    const bare = host.trim().toLowerCase().replace(/^\[(.*)\]$/, '$1');
    if (bare === '')
        return false;
    if (bare === 'localhost' || bare.endsWith('.localhost'))
        return true;
    if (bare === '::1')
        return true;
    return /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(bare);
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
    if (explicit?.trim().toLowerCase() === 'direct')
        return undefined;
    const configured = parseProxyUrl(explicit);
    if (configured !== undefined)
        return configured.href;
    if (host !== undefined && isLoopbackTarget(host))
        return undefined;
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
function basicProxyAuthorization(url) {
    if (url.username === '' && url.password === '')
        return undefined;
    // URL userinfo is percent-encoded; the header needs the decoded value.
    const decode = (value) => { try {
        return decodeURIComponent(value);
    }
    catch {
        return value;
    } };
    return `Basic ${Buffer.from(`${decode(url.username)}:${decode(url.password)}`).toString('base64')}`;
}
/** Open the TCP (or proxy-TLS) leg to the proxy itself. */
function connectToProxy(url, timeoutMs, signal, tls) {
    const port = proxyPort(url);
    const host = url.hostname.replace(/^\[(.*)\]$/, '$1');
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(signal.reason);
            return;
        }
        const socket = url.protocol === 'https:'
            ? connectTls({ host, port, servername: isIP(host) === 0 ? host : undefined, ...mailTlsOptions(), ...tls })
            : connectTcp({ host, port });
        const event = url.protocol === 'https:' ? 'secureConnect' : 'connect';
        let settled = false;
        const timer = setTimeout(() => settle(proxyError(`连接代理 ${host}:${port} 超时`, 'PROXY_TIMEOUT')), timeoutMs);
        const settle = (error) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            socket.removeListener(event, onConnect);
            socket.removeListener('error', onError);
            socket.removeListener('close', onClose);
            signal?.removeEventListener('abort', onAbort);
            if (error === null)
                resolve(socket);
            else {
                socket.destroy();
                reject(error);
            }
        };
        const onConnect = () => settle(null);
        const onError = (error) => settle(proxyError(`无法连接代理 ${host}:${port}：${error.message}`, 'PROXY_UNREACHABLE'));
        const onClose = () => settle(proxyError('代理连接在协商前关闭', 'PROXY_CLOSED'));
        const onAbort = () => settle(signal?.reason instanceof Error ? signal.reason : new Error('代理连接已取消'));
        socket.once(event, onConnect);
        socket.once('error', onError);
        socket.once('close', onClose);
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}
/**
 * HTTP CONNECT: one request line, one status line, then the proxy stops talking
 * and the socket becomes a raw tunnel.
 */
async function connectHttpProxy(url, host, port, timeoutMs, signal, tls) {
    const socket = await connectToProxy(url, timeoutMs, signal, tls);
    if (signal?.aborted) {
        socket.destroy();
        throw signal.reason;
    }
    const headers = [`CONNECT ${authority(host, port)} HTTP/1.1`, `Host: ${authority(host, port)}`];
    const auth = basicProxyAuthorization(url);
    if (auth !== undefined)
        headers.push(`Proxy-Authorization: ${auth}`);
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
            signal?.removeEventListener('abort', onAbort);
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
        const onAbort = () => finish(signal?.reason instanceof Error ? signal.reason : new Error('代理连接已取消'));
        const onData = (chunk) => {
            buffered = Buffer.concat([buffered, chunk]);
            const end = buffered.indexOf('\r\n\r\n');
            if ((end < 0 ? buffered.length : end + 4) > MAX_HEADER_BYTES) {
                finish(proxyError('代理 CONNECT 响应头过长', 'PROXY_BAD_RESPONSE'));
                return;
            }
            if (end < 0)
                return;
            const head = buffered.subarray(0, end).toString('latin1');
            const status = Number(/^HTTP\/1\.[01] ([1-5]\d\d)(?:\s|$)/.exec(head)?.[1] ?? '0');
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
        signal?.addEventListener('abort', onAbort, { once: true });
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
    options.signal?.throwIfAborted();
    if (!host || /[\s\r\n\0]/.test(host) || !Number.isInteger(port) || port < 1 || port > 65535)
        throw proxyError('邮箱服务器或端口无效', 'PROXY_INVALID');
    const url = proxy instanceof URL ? proxy : parseProxyUrl(proxy);
    if (url === undefined)
        throw proxyError('代理地址为空', 'PROXY_INVALID');
    const timeoutMs = Math.max(1000, options.timeoutMs ?? 30000);
    const pending = url.protocol === 'http:' || url.protocol === 'https:'
        ? connectHttpProxy(url, host, port, timeoutMs, options.signal, options.tls)
        : connectSocksProxy(url, host, port, timeoutMs);
    const socket = options.signal ? await new Promise((resolve, reject) => {
        const signal = options.signal;
        let settled = false;
        const abort = () => { if (!settled) {
            settled = true;
            signal.removeEventListener('abort', abort);
            reject(signal.reason);
        } };
        signal.addEventListener('abort', abort, { once: true });
        pending.then(socket => { signal.removeEventListener('abort', abort); if (settled || signal.aborted) {
            socket.destroy();
            abort();
        }
        else {
            settled = true;
            resolve(socket);
        } }, error => { signal.removeEventListener('abort', abort); if (!settled) {
            settled = true;
            reject(error);
        } });
        if (signal.aborted)
            abort();
    }) : await pending;
    socket.setNoDelay(true);
    return socket;
}
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);
function upgradeProxiedTls(tunnel, host, timeoutMs, tls, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            tunnel.destroy();
            reject(signal.reason);
            return;
        }
        const socket = connectTls({
            socket: tunnel,
            servername: isIP(host) === 0 ? host : undefined,
            ...mailTlsOptions(),
            ...tls,
        });
        let settled = false;
        const timer = setTimeout(() => settle(proxyError(`通过代理与 ${host} 建立 TLS 超时`, 'PROXY_TLS_TIMEOUT')), timeoutMs);
        const settle = (error) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            socket.removeListener('secureConnect', onSecure);
            socket.removeListener('error', onError);
            socket.removeListener('close', onClose);
            signal?.removeEventListener('abort', onAbort);
            if (error === null)
                resolve(socket);
            else {
                socket.on('error', () => { });
                tunnel.on('error', () => { });
                socket.destroy();
                tunnel.destroy();
                reject(error);
            }
        };
        const onSecure = () => settle(null);
        const onError = (error) => settle(error);
        const onClose = () => settle(proxyError(`通过代理与 ${host} 建立 TLS 时连接关闭`, 'PROXY_TLS_CLOSED'));
        const onAbort = () => settle(signal?.reason instanceof Error ? signal.reason : new Error('代理 TLS 连接已取消'));
        socket.once('secureConnect', onSecure);
        socket.once('error', onError);
        socket.once('close', onClose);
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}
function serializeRequestBody(body) {
    if (body === undefined || body === null)
        return {};
    if (typeof body === 'string')
        return { buffer: Buffer.from(body, 'utf8'), contentType: 'text/plain;charset=UTF-8' };
    if (body instanceof URLSearchParams)
        return { buffer: Buffer.from(body.toString(), 'utf8'), contentType: 'application/x-www-form-urlencoded;charset=UTF-8' };
    if (body instanceof ArrayBuffer)
        return { buffer: Buffer.from(body) };
    if (ArrayBuffer.isView(body))
        return { buffer: Buffer.from(body.buffer, body.byteOffset, body.byteLength) };
    throw new TypeError('Unsupported proxied fetch request body type');
}
function normalizeRequestHeaders(input, defaultContentType, bodyLength, extra = {}) {
    const headers = new Headers(input);
    if (defaultContentType !== undefined && !headers.has('content-type'))
        headers.set('content-type', defaultContentType);
    if (bodyLength !== undefined && !headers.has('content-length'))
        headers.set('content-length', String(bodyLength));
    if (!headers.has('connection'))
        headers.set('connection', 'close');
    for (const [key, value] of Object.entries(extra))
        headers.set(key, value);
    const record = {};
    headers.forEach((value, key) => { record[key] = value; });
    return record;
}
function incomingToResponse(res, signal) {
    const status = res.statusCode ?? 0;
    const headers = new Headers();
    for (let i = 0; i + 1 < res.rawHeaders.length; i += 2) {
        headers.append(res.rawHeaders[i], res.rawHeaders[i + 1]);
    }
    if (NULL_BODY_STATUSES.has(status)) {
        res.resume();
        return new Response(null, { status, statusText: res.statusMessage ?? '', headers });
    }
    if (signal !== undefined) {
        const onAbort = () => { res.destroy(signal.reason instanceof Error ? signal.reason : new Error('Request aborted')); };
        const cleanup = () => { signal.removeEventListener('abort', onAbort); };
        signal.addEventListener('abort', onAbort, { once: true });
        res.once('end', cleanup);
        res.once('close', cleanup);
        res.once('error', cleanup);
    }
    const stream = Readable.toWeb(res);
    return new Response(stream, { status, statusText: res.statusMessage ?? '', headers });
}
async function sendSingleProxiedRequest(proxyHref, url, init, options) {
    if (url.protocol !== 'https:' && url.protocol !== 'http:')
        throw new TypeError(`Unsupported protocol: ${url.protocol}`);
    const signal = init?.signal ?? undefined;
    signal?.throwIfAborted();
    const timeoutMs = Math.max(1000, options.timeoutMs ?? 30000);
    const proxyUrl = parseProxyUrl(proxyHref);
    if (proxyUrl === undefined)
        throw proxyError('代理地址为空', 'PROXY_INVALID');
    const targetHost = url.hostname.replace(/^\[(.*)\]$/, '$1');
    const targetPort = url.port !== '' ? Number(url.port) : (url.protocol === 'https:' ? 443 : 80);
    const method = (init?.method ?? 'GET').toUpperCase();
    const { buffer, contentType } = serializeRequestBody(init?.body);
    const isHttpProxy = proxyUrl.protocol === 'http:' || proxyUrl.protocol === 'https:';
    let socket;
    let requestHost;
    let requestPort;
    let requestPath;
    const extraHeaders = { host: url.host };
    if (url.protocol === 'https:') {
        const tunnel = await openProxiedSocket(proxyUrl, targetHost, targetPort, { timeoutMs, signal, tls: options.tls });
        socket = await upgradeProxiedTls(tunnel, targetHost, timeoutMs, options.tls, signal);
        requestHost = targetHost;
        requestPort = targetPort;
        requestPath = url.pathname + url.search;
    }
    else if (isHttpProxy) {
        socket = await connectToProxy(proxyUrl, timeoutMs, signal, options.tls);
        requestHost = proxyUrl.hostname.replace(/^\[(.*)\]$/, '$1');
        requestPort = proxyPort(proxyUrl);
        requestPath = url.origin + url.pathname + url.search;
        const auth = basicProxyAuthorization(proxyUrl);
        if (auth !== undefined)
            extraHeaders['proxy-authorization'] = auth;
    }
    else {
        socket = await openProxiedSocket(proxyUrl, targetHost, targetPort, { timeoutMs, signal, tls: options.tls });
        requestHost = targetHost;
        requestPort = targetPort;
        requestPath = url.pathname + url.search;
    }
    const headers = normalizeRequestHeaders(init?.headers, contentType, buffer?.byteLength, extraHeaders);
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            socket.on('error', () => { });
            socket.destroy();
            reject(signal.reason);
            return;
        }
        let settled = false;
        // Always use http.request on the already-established socket (plain TCP or
        // already-upgraded TLSSocket) WITHOUT `agent: false`: passing `agent: false`
        // creates a default Agent whose own `createConnection` ignores our custom
        // `createConnection` callback and bypasses the proxy tunnel.
        const req = requestHttp({
            protocol: 'http:',
            hostname: requestHost,
            port: requestPort,
            path: requestPath,
            method,
            headers,
            createConnection: () => socket,
        });
        const cleanup = () => {
            signal?.removeEventListener('abort', onAbort);
            req.removeListener('response', onResponse);
            req.removeListener('error', onError);
        };
        const fail = (error) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            req.on('error', () => { });
            socket.on('error', () => { });
            req.destroy();
            socket.destroy();
            reject(error);
        };
        const onError = (error) => fail(error);
        const onAbort = () => fail(signal?.reason ?? new Error('Request aborted'));
        const onResponse = (res) => {
            if (settled) {
                res.destroy();
                return;
            }
            if (signal?.aborted) {
                res.destroy();
                fail(signal.reason);
                return;
            }
            const status = res.statusCode ?? 0;
            if (REDIRECT_STATUSES.has(status) && init?.redirect === 'error') {
                res.destroy();
                fail(new TypeError('Unexpected redirect'));
                return;
            }
            settled = true;
            cleanup();
            // Keep an error listener on the request after headers arrive so late socket errors cannot go unhandled.
            req.on('error', () => { });
            resolve(incomingToResponse(res, signal));
        };
        req.once('response', onResponse);
        req.once('error', onError);
        signal?.addEventListener('abort', onAbort, { once: true });
        if (buffer !== undefined)
            req.end(buffer);
        else
            req.end();
    });
}
/**
 * Fetch an HTTP(S) URL while honouring the same proxy rules as IMAP/SMTP:
 * account/global `proxy` first, `'direct'` to bypass, then `HTTPS_PROXY` /
 * `HTTP_PROXY` / `ALL_PROXY` (respecting `NO_PROXY` and loopback targets).
 *
 * Uses Node's built-in `http`/`https`/`tls` over `openProxiedSocket` so HTTP,
 * HTTPS and SOCKS4/4a/5/5h proxies all work with zero extra dependencies and
 * full TLS certificate validation (including OS CA roots).
 */
export async function fetchWithProxy(input, init, explicitProxy, options = {}) {
    const directFetch = options.directFetch ?? globalThis.fetch;
    const env = options.env ?? process.env;
    const explicitConfigured = explicitProxy !== undefined && explicitProxy !== null && explicitProxy.trim() !== '';
    const redirectMode = init?.redirect ?? 'follow';
    let currentUrl = input instanceof URL ? new URL(input.href) : new URL(input);
    let currentInit = init;
    for (let redirects = 0;; redirects++) {
        const proxy = resolveProxyUrl(explicitProxy, env, currentUrl.hostname);
        const bypassEnvForMock = !explicitConfigured && options.env === undefined && directFetch !== NATIVE_FETCH;
        if (proxy === undefined || bypassEnvForMock) {
            return directFetch(currentUrl.href, currentInit);
        }
        const response = await sendSingleProxiedRequest(proxy, currentUrl, currentInit, options);
        if (redirectMode !== 'follow' || !REDIRECT_STATUSES.has(response.status)) {
            return response;
        }
        const location = response.headers.get('location');
        if (!location)
            return response;
        await response.body?.cancel().catch(() => { });
        if (redirects >= 5)
            throw new TypeError('Too many redirects');
        const nextUrl = new URL(location, currentUrl);
        const nextHeaders = new Headers(currentInit?.headers);
        if (nextUrl.origin !== currentUrl.origin) {
            nextHeaders.delete('authorization');
            nextHeaders.delete('cookie');
            nextHeaders.delete('proxy-authorization');
        }
        const currentMethod = (currentInit?.method ?? 'GET').toUpperCase();
        const switchToGet = response.status === 303 || ((response.status === 301 || response.status === 302) && currentMethod === 'POST');
        currentUrl = nextUrl;
        currentInit = {
            ...currentInit,
            headers: nextHeaders,
            ...(switchToGet ? { method: 'GET', body: undefined } : {}),
        };
    }
}
