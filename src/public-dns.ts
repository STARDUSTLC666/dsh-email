import { lookup } from 'node:dns/promises'
import { get } from 'node:https'
import { isIP } from 'node:net'
import { publicAddress, syntheticAddress, validPublicRecords, type PublicAddress } from './public-address.js'

export class PublicDownloadError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = 'PublicDownloadError' }
}
const blocked = () => new PublicDownloadError('PUBLIC_ADDRESS_REQUIRED', '图片或附件地址必须指向公网 HTTPS 服务 / A public HTTPS destination is required')
const dnsFailure = () => new PublicDownloadError('PUBLIC_DNS_UNAVAILABLE', '当前网络使用虚拟地址，但未能确认真实公网目标；请稍后重试 / The network uses virtual DNS addresses; the public destination could not be verified')

export async function withAbort<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted()
  return new Promise<T>((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(signal.reason) }
    signal.addEventListener('abort', abort, { once: true })
    pending.then(value => { signal.removeEventListener('abort', abort); if (signal.aborted) reject(signal.reason); else resolve(value) }, error => { signal.removeEventListener('abort', abort); reject(error) })
    if (signal.aborted) abort()
  })
}

/** Do not send private, single-label or reserved names to a public resolver. */
export function publicDnsName(host: string): boolean {
  const name = host.toLowerCase().replace(/\.$/, '')
  if (name.length > 253 || !name.includes('.') || isIP(name)) return false
  const labels = name.split('.')
  if (labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return false
  if (name === 'home.arpa' || name.endsWith('.home.arpa')) return false
  return !/^(?:localhost|local|internal|invalid|test|example|home|lan|onion)$/.test(labels.at(-1)!)
}

/** A strict, bounded subset of the resolver's documented JSON response. */
export function parsePublicDnsAnswer(value: unknown, host: string, type: 1 | 28): PublicAddress[] {
  const doc = value as any, name = host.toLowerCase().replace(/\.$/, '')
  if (!doc || doc.Status !== 0 || doc.TC === true || !Array.isArray(doc.Question) ||
      doc.Question.length !== 1 || doc.Question[0]?.type !== type ||
      String(doc.Question[0]?.name).toLowerCase().replace(/\.$/, '') !== name ||
      (doc.Answer !== undefined && !Array.isArray(doc.Answer))) throw dnsFailure()
  const answers = doc.Answer ?? []
  if (answers.length > 64) throw dnsFailure()
  const rows: PublicAddress[] = []
  for (const row of answers) {
    if (row?.type !== 1 && row?.type !== 28) continue
    if (typeof row.data !== 'string' || !publicAddress(row.data) || isIP(row.data) !== (row.type === 1 ? 4 : 6)) throw blocked()
    rows.push({ address: row.data, family: row.type === 1 ? 4 : 6 })
  }
  return rows
}

/** Fixed public bootstrap addresses avoid asking the Fake-IP resolver about itself. */
export async function queryPublicDns(host: string, signal: AbortSignal): Promise<PublicAddress[]> {
  for (const bootstrap of ['1.1.1.1', '1.0.0.1']) {
    signal.throwIfAborted()
    const attempt = new AbortController()
    try {
      const rows = (await Promise.all(([1, 28] as const).map(async type => {
        const active = AbortSignal.any([signal, attempt.signal, AbortSignal.timeout(5000)])
        const response = await new Promise<import('node:http').IncomingMessage>((resolve, reject) => {
          const request = get(new URL('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(host) + '&type=' + type), {
            agent: false,
            signal: active,
            headers: { accept: 'application/dns-json' },
            lookup: ((_name: string, options: any, callback: any) => options.all
              ? callback(null, [{ address: bootstrap, family: 4 }]) : callback(null, bootstrap, 4)) as any,
          }, resolve)
          request.once('error', reject)
        })
        try {
          if (response.statusCode !== 200 || response.headers['content-type']?.split(';')[0] !== 'application/dns-json') throw dnsFailure()
          const chunks: Buffer[] = []; let size = 0
          for await (const chunk of response) {
            active.throwIfAborted()
            const bytes = Buffer.from(chunk); size += bytes.length
            if (size > 65536) throw dnsFailure()
            chunks.push(bytes)
          }
          return parsePublicDnsAnswer(JSON.parse(Buffer.concat(chunks).toString('utf8')), host, type)
        } finally { response.destroy() }
      }))).flat()
      const unique = [...new Map(rows.map(row => [row.address, row])).values()]
      if (!validPublicRecords(unique)) throw blocked()
      return unique.sort((a, b) => a.family - b.family)
    } catch (error) {
      signal.throwIfAborted()
      // A private or malformed destination is a final rejection, never an
      // invitation to ask a different resolver for a more convenient answer.
      if (error instanceof PublicDownloadError && error.code === 'PUBLIC_ADDRESS_REQUIRED') throw error
    } finally { attempt.abort() }
  }
  throw dnsFailure()
}

export interface PublicDnsDependencies {
  lookup?: (host: string) => Promise<PublicAddress[]>
  query?: (host: string, signal: AbortSignal) => Promise<PublicAddress[]>
}
export async function resolvePublicAddresses(host: string, signal: AbortSignal, dependencies: PublicDnsDependencies = {}): Promise<PublicAddress[]> {
  signal.throwIfAborted()
  if (isIP(host)) {
    if (!publicAddress(host)) throw blocked()
    return [{ address: host, family: isIP(host) }]
  }
  let rows: PublicAddress[]
  try { rows = await withAbort((dependencies.lookup ?? (name => lookup(name, { all: true })))(host), signal) }
  catch { signal.throwIfAborted(); throw new PublicDownloadError('PUBLIC_DNS_FAILED', '无法解析图片或附件域名，请稍后重试 / Cannot resolve the public download host') }
  if (validPublicRecords(rows)) return rows
  if (!rows.length || rows.length > 32 || !rows.every(row => row.family === 4 && syntheticAddress(row.address)) || !publicDnsName(host)) throw blocked()
  const real = await withAbort((dependencies.query ?? queryPublicDns)(host, signal), signal)
  if (!validPublicRecords(real)) throw blocked()
  return real
}
