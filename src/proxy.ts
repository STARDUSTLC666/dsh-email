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
import { connect as connectTcp, isIP, type Socket } from 'node:net'
import { connect as connectTls } from 'node:tls'
import { SocksClient } from 'socks'

/** The variable names git, curl and the Node ecosystem all agree on, in priority order. */
const PROXY_ENV_NAMES = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy'] as const

/** `NO_PROXY` is matched the way curl matches it: exact host, domain suffix, or `*`. */
const NO_PROXY_ENV_NAMES = ['NO_PROXY', 'no_proxy'] as const

const DEFAULT_PORTS: Record<string, number> = {
  'http:': 80,
  'https:': 443,
  'socks:': 1080,
  'socks4:': 1080,
  'socks4a:': 1080,
  'socks5:': 1080,
  'socks5h:': 1080,
}

/** Schemes `parseProxyUrl` accepts, in the spelling the user writes them. */
export const PROXY_SCHEMES = ['http', 'https', 'socks', 'socks4', 'socks4a', 'socks5', 'socks5h'] as const

function proxyPort(url: URL): number {
  if (url.port !== '') return Number(url.port)
  return DEFAULT_PORTS[url.protocol] ?? 1080
}

/**
 * Read a proxy address the way a user writes one.
 *
 * `127.0.0.1:7897` is what people paste, so a missing scheme means `http` (the
 * CONNECT-flavoured HTTP proxy every desktop client ships) rather than a URL
 * parse failure. Credentials stay in the URL because both schemes authenticate
 * with them.
 */
export function parseProxyUrl(value: string | null | undefined): URL | undefined {
  const text = (value ?? '').trim()
  if (text === '' || text.toLowerCase() === 'direct') return undefined
  let url: URL
  try {
    url = new URL(text.includes('://') ? text : `http://${text}`)
  } catch {
    throw new Error('代理地址无效（示例：http://127.0.0.1:7897 或 socks5://127.0.0.1:1080）。代理凭据不会回显。')
  }
  const scheme = url.protocol.replace(/:$/, '')
  if (!(PROXY_SCHEMES as readonly string[]).includes(scheme)) {
    throw new Error(`不支持的代理协议 "${scheme}"：可用 ${PROXY_SCHEMES.join(' / ')}`)
  }
  if (url.hostname === '' || proxyPort(url) < 1 || url.search || url.hash || (url.pathname !== '' && url.pathname !== '/')) throw new Error('代理地址应只包含协议、登录凭据、主机与端口，不应包含路径或查询参数。')
  return url
}

function noProxyBypassed(host: string, env: NodeJS.ProcessEnv): boolean {
  const raw = NO_PROXY_ENV_NAMES.map(name => env[name]).find(value => typeof value === 'string' && value.trim() !== '')
  if (raw === undefined) return false
  const target = host.toLowerCase()
  return raw.split(',').some(entry => {
    const pattern = entry.trim().toLowerCase()
    if (pattern === '') return false
    if (pattern === '*') return true
    // NO_PROXY entries are plain hosts, optional port, optional leading dot.
    const bare = pattern.replace(/^\./, '').replace(/:\d+$/, '')
    return target === bare || target.endsWith(`.${bare}`)
  })
}

/**
 * The proxy this account should use, or undefined for a direct connection.
 *
 * An explicit `proxy` wins even when `NO_PROXY` matches: the user typed it for
 * this account, so the environment's bypass list must not quietly ignore it.
 */
export function resolveProxyUrl(explicit: string | null | undefined, env: NodeJS.ProcessEnv = process.env, host?: string): string | undefined {
  if (explicit?.trim().toLowerCase() === 'direct') return undefined
  const configured = parseProxyUrl(explicit)
  if (configured !== undefined) return configured.href
  if (host !== undefined && noProxyBypassed(host, env)) return undefined
  for (const name of PROXY_ENV_NAMES) {
    const value = env[name]
    if (typeof value === 'string' && value.trim() !== '') {
      const fromEnv = parseProxyUrl(value)
      if (fromEnv !== undefined) return fromEnv.href
    }
  }
  return undefined
}

/** Cap the CONNECT response header, so a silent proxy cannot grow memory forever. */
const MAX_HEADER_BYTES = 64 * 1024

function authority(host: string, port: number): string {
  return isIP(host) === 6 ? `[${host}]:${port}` : `${host}:${port}`
}

function proxyError(message: string, code: string): Error {
  const error = new Error(message)
  ;(error as NodeJS.ErrnoException).code = code
  return error
}

/** Open the TCP (or proxy-TLS) leg to the proxy itself. */
function connectToProxy(url: URL, timeoutMs: number, signal?: AbortSignal): Promise<Socket> {
  const port = proxyPort(url)
  const host = url.hostname.replace(/^\[(.*)\]$/, '$1')
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return }
    const socket = url.protocol === 'https:'
      ? connectTls({ host, port, servername: isIP(host) === 0 ? host : undefined })
      : connectTcp({ host, port })
    const event = url.protocol === 'https:' ? 'secureConnect' : 'connect'
    let settled = false
    const timer = setTimeout(() => settle(proxyError(`连接代理 ${host}:${port} 超时`, 'PROXY_TIMEOUT')), timeoutMs)
    const settle = (error: Error | null): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.removeListener(event, onConnect)
      socket.removeListener('error', onError)
      socket.removeListener('close', onClose)
      signal?.removeEventListener('abort', onAbort)
      if (error === null) resolve(socket)
      else { socket.destroy(); reject(error) }
    }
    const onConnect = (): void => settle(null)
    const onError = (error: Error): void => settle(proxyError(`无法连接代理 ${host}:${port}：${error.message}`, 'PROXY_UNREACHABLE'))
    const onClose = (): void => settle(proxyError('代理连接在协商前关闭', 'PROXY_CLOSED'))
    const onAbort = (): void => settle(signal?.reason instanceof Error ? signal.reason : new Error('代理连接已取消'))
    socket.once(event, onConnect)
    socket.once('error', onError)
    socket.once('close', onClose)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * HTTP CONNECT: one request line, one status line, then the proxy stops talking
 * and the socket becomes a raw tunnel.
 */
async function connectHttpProxy(url: URL, host: string, port: number, timeoutMs: number, signal?: AbortSignal): Promise<Socket> {
  const socket = await connectToProxy(url, timeoutMs, signal)
  if (signal?.aborted) { socket.destroy(); throw signal.reason }
  const headers = [`CONNECT ${authority(host, port)} HTTP/1.1`, `Host: ${authority(host, port)}`]
  if (url.username !== '' || url.password !== '') {
    // URL userinfo is percent-encoded; the header needs the decoded value.
    const decode = (value: string): string => { try { return decodeURIComponent(value) } catch { return value } }
    headers.push(`Proxy-Authorization: Basic ${Buffer.from(`${decode(url.username)}:${decode(url.password)}`).toString('base64')}`)
  }
  headers.push('Proxy-Connection: Keep-Alive', '', '')
  return new Promise((resolve, reject) => {
    let buffered = Buffer.alloc(0)
    let settled = false
    const finish = (error: Error | null): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.removeListener('data', onData)
      socket.removeListener('error', onError)
      socket.removeListener('close', onClose)
      signal?.removeEventListener('abort', onAbort)
      if (error !== null) { socket.destroy(); reject(error) } else resolve(socket)
    }
    const timer = setTimeout(() => finish(proxyError('代理 CONNECT 协商超时', 'PROXY_TIMEOUT')), timeoutMs)
    const onError = (error: Error): void => finish(proxyError(`代理连接中断：${error.message}`, 'PROXY_UNREACHABLE'))
    const onClose = (): void => finish(proxyError('代理在 CONNECT 响应前关闭了连接', 'PROXY_CLOSED'))
    const onAbort = (): void => finish(signal?.reason instanceof Error ? signal.reason : new Error('代理连接已取消'))
    const onData = (chunk: Buffer): void => {
      buffered = Buffer.concat([buffered, chunk])
      const end = buffered.indexOf('\r\n\r\n')
      if ((end < 0 ? buffered.length : end + 4) > MAX_HEADER_BYTES) { finish(proxyError('代理 CONNECT 响应头过长', 'PROXY_BAD_RESPONSE')); return }
      if (end < 0) return
      const head = buffered.subarray(0, end).toString('latin1')
      const status = Number(/^HTTP\/1\.[01] ([1-5]\d\d)(?:\s|$)/.exec(head)?.[1] ?? '0')
      const rest = buffered.subarray(end + 4)
      // Anything after the header block is the tunnel's own first bytes, so it
      // is handed back to the socket before the TLS layer starts reading.
      if (rest.length > 0) socket.unshift(rest)
      if (status < 200 || status >= 300) {
        const line = head.split('\r\n')[0] ?? ''
        finish(proxyError(`代理拒绝了 CONNECT ${authority(host, port)}：HTTP ${status} ${line}`.trim(), 'PROXY_CONNECT_REFUSED'))
        return
      }
      finish(null)
    }
    socket.on('data', onData)
    socket.once('error', onError)
    socket.once('close', onClose)
    signal?.addEventListener('abort', onAbort, { once: true })
    socket.write(headers.join('\r\n'), 'latin1')
  })
}

/** SOCKS4/4a/5/5h through the `socks` package: it owns the handshake and its variants. */
async function connectSocksProxy(url: URL, host: string, port: number, timeoutMs: number): Promise<Socket> {
  const type = url.protocol.startsWith('socks4') ? 4 : 5
  const decode = (value: string): string => { try { return decodeURIComponent(value) } catch { return value } }
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
    })
    return socket
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw proxyError(`SOCKS 代理连接 ${authority(host, port)} 失败：${reason}`, 'PROXY_UNREACHABLE')
  }
}

/**
 * A raw socket to `host:port` reached through `proxy`.
 *
 * The returned socket is not yet encrypted: an SMTP/POP3 caller upgrades it
 * itself (with `servername` set to `host`) when the endpoint is a TLS one.
 */
export async function openProxiedSocket(proxy: string | URL, host: string, port: number, options: { timeoutMs?: number; signal?: AbortSignal } = {}): Promise<Socket> {
  options.signal?.throwIfAborted()
  if (!host || /[\s\r\n\0]/.test(host) || !Number.isInteger(port) || port < 1 || port > 65535) throw proxyError('邮箱服务器或端口无效', 'PROXY_INVALID')
  const url = proxy instanceof URL ? proxy : parseProxyUrl(proxy)
  if (url === undefined) throw proxyError('代理地址为空', 'PROXY_INVALID')
  const timeoutMs = Math.max(1000, options.timeoutMs ?? 30000)
  const pending = url.protocol === 'http:' || url.protocol === 'https:'
    ? connectHttpProxy(url, host, port, timeoutMs, options.signal)
    : connectSocksProxy(url, host, port, timeoutMs)
  const socket = options.signal ? await new Promise<Socket>((resolve, reject) => {
    const signal = options.signal!; let settled = false
    const abort = () => { if (!settled) { settled = true; signal.removeEventListener('abort', abort); reject(signal.reason) } }
    signal.addEventListener('abort', abort, { once: true })
    pending.then(socket => { signal.removeEventListener('abort', abort); if (settled || signal.aborted) { socket.destroy(); abort() } else { settled = true; resolve(socket) } }, error => { signal.removeEventListener('abort', abort); if (!settled) { settled = true; reject(error) } })
    if (signal.aborted) abort()
  }) : await pending
  socket.setNoDelay(true)
  return socket
}
