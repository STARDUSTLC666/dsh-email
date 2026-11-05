import { get } from 'node:https'
import { isIP } from 'node:net'
import type { IncomingMessage } from 'node:http'
import { publicAddress, validPublicRecords, type PublicAddress } from './public-address.js'
import { PublicDownloadError, resolvePublicAddresses, withAbort } from './public-dns.js'
export { publicAddress } from './public-address.js'
export { PublicDownloadError } from './public-dns.js'

export interface PublicDownloadDependencies {
  resolve?: (host: string, signal: AbortSignal) => Promise<PublicAddress[]>
  request?: (url: URL, records: readonly PublicAddress[], signal: AbortSignal) => Promise<IncomingMessage>
}

/** New sockets only: a shared agent must not reuse a differently resolved peer. */
export async function requestPinnedPublic(url: URL, records: readonly PublicAddress[], signal: AbortSignal): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const request = get(url, {
      agent: false,
      signal,
      lookup: ((_host: string, options: any, callback: any) => options.all
        ? callback(null, records) : callback(null, records[0].address, records[0].family)) as any,
    }, resolve)
    request.once('error', reject)
  })
}

/** Dependency seams are for embedders/tests; HTTP callers cannot supply them. */
export function createPublicDownloader(dependencies: PublicDownloadDependencies = {}) {
  return async (input: string, cap: number, signal?: AbortSignal): Promise<Buffer> => {
    if (!Number.isSafeInteger(cap) || cap < 1) throw new PublicDownloadError('DOWNLOAD_LIMIT', '下载大小上限无效 / Invalid download limit')
    const active = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(30000)])
    async function download(target: string, redirects: number): Promise<Buffer> {
      active.throwIfAborted()
      let url: URL
      try { url = new URL(target) } catch { throw new PublicDownloadError('DOWNLOAD_URL', '图片或附件下载地址无效 / Invalid public download URL') }
      if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || redirects > 2)
        throw new PublicDownloadError('DOWNLOAD_URL', '图片或附件下载地址不受支持 / Unsupported public download URL')
      const host = url.hostname.replace(/^\[|\]$/g, '')
      if (isIP(host) && !publicAddress(host)) throw new PublicDownloadError('PUBLIC_ADDRESS_REQUIRED', '图片或附件地址必须指向公网 HTTPS 服务 / A public HTTPS destination is required')
      const resolved = await withAbort((dependencies.resolve ?? resolvePublicAddresses)(host, active), active)
      if (!validPublicRecords(resolved)) throw new PublicDownloadError('PUBLIC_ADDRESS_REQUIRED', '图片或附件地址必须指向公网 HTTPS 服务 / A public HTTPS destination is required')
      const records = resolved.map(row => Object.freeze({ address: row.address, family: row.family }))
      let response: IncomingMessage
      try { response = await (dependencies.request ?? requestPinnedPublic)(url, records, active) }
      catch { active.throwIfAborted(); throw new PublicDownloadError('DOWNLOAD_NETWORK', '公网图片或附件连接失败，请稍后重试 / Could not connect to the public download') }
      try {
        if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0) && response.headers.location) {
          const next = new URL(response.headers.location, url).href
          response.destroy()
          return await download(next, redirects + 1)
        }
        if (response.statusCode !== 200) throw new PublicDownloadError('DOWNLOAD_RESPONSE', '图片或附件下载失败，请稍后重试 / Public download failed')
        if (Number(response.headers['content-length']) > cap) throw new PublicDownloadError('DOWNLOAD_TOO_LARGE', '图片或附件超过下载大小上限 / Public download exceeds the size limit')
        const chunks: Buffer[] = []; let size = 0
        for await (const chunk of response) {
          active.throwIfAborted()
          const bytes = Buffer.from(chunk); size += bytes.length
          if (size > cap) throw new PublicDownloadError('DOWNLOAD_TOO_LARGE', '图片或附件超过下载大小上限 / Public download exceeds the size limit')
          chunks.push(bytes)
        }
        return Buffer.concat(chunks)
      } catch (error) {
        active.throwIfAborted()
        if (error instanceof PublicDownloadError) throw error
        throw new PublicDownloadError('DOWNLOAD_NETWORK', '公网图片或附件连接中断，请稍后重试 / Public download connection was interrupted')
      } finally { response.destroy() }
    }
    return download(input, 0)
  }
}

const defaultDownloader = createPublicDownloader()

/** Download a signed public HTTPS URL without API credentials; pin the validated DNS answers. */
export async function downloadPublicBytes(
  input: string,
  cap: number,
  signal?: AbortSignal,
): Promise<Buffer> {
  return defaultDownloader(input, cap, signal)
}
