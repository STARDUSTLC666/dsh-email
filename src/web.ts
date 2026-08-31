import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SETTINGS_NAMESPACE, toEmailConfig, validateSettingsValue, type EmailSettingsValue } from './settings.js'
import { resolveEmailSettings, type EmailConfig } from './config.js'
import { EmailPool, messageOf } from './mail-client.js'
import type { EmailWatchResult } from './types.js'

/** Same-origin route the browser settings section talks to. */
export const SETTINGS_ROUTE = '/_dsh/dsh-email/settings'

/** Same-origin route serving the whale-girl courier image to the widget. */
export const WHALE_ASSET_ROUTE = '/_dsh/dsh-email/assets/whale'

const SKIN_PACKAGES = [
  '@dsh-external/dsh-client-ui-skin-orca-link',
  '@dsh-external/dsh-client-ui-skin-maid-atelier',
]

const WHALE_CREDIT = '鲸鱼娘：一创 上善（pixiv 62155430）· 二创 Small-tailqwq / dsh-deep-whale · CC BY-NC-SA 4.0（非商业）'

interface WhaleAsset {
  file: string
  contentType: string
  /** true = 用户本地安装的 dsh-deep-whale 皮肤（CC BY-NC-SA 4.0，需署名）；false = 内置回退图 */
  skin: boolean
  credit: string
}

let whaleCache: WhaleAsset | null | undefined

function pickFromDir(dir: string): string | null {
  let names: string[] = []
  try {
    names = readdirSync(dir)
  } catch {
    return null
  }
  const images = names.filter(name => /\.(webp|png|jpe?g)$/i.test(name))
  if (images.length === 0) return null
  const preferred = images.find(name => /^light-hero/i.test(name)) ?? images.find(name => /^light-active/i.test(name))
  return join(dir, preferred ?? images[0])
}

function contentTypeOf(file: string): string {
  if (/\.webp$/i.test(file)) return 'image/webp'
  if (/\.jpe?g$/i.test(file)) return 'image/jpeg'
  return 'image/png'
}

/**
 * Locate the whale-girl artwork at runtime. It is never bundled: the skin art
 * is CC BY-NC-SA 4.0, so dsh-email only serves it from the user's own
 * installed dsh-deep-whale skin package (with the attribution chain shown in
 * the widget); otherwise the bundled MIT fallback is served.
 */
function findWhaleAsset(): WhaleAsset | null {
  if (whaleCache !== undefined) return whaleCache
  whaleCache = null
  const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
  const roots = [process.cwd(), dirname(packageDir)]
  for (const root of roots) {
    for (const pkg of SKIN_PACKAGES) {
      for (const base of [join(root, 'node_modules', pkg, 'assets'), join(root, pkg, 'assets')]) {
        const file = pickFromDir(base)
        if (file !== null) {
          whaleCache = { file, contentType: contentTypeOf(file), skin: true, credit: WHALE_CREDIT }
          return whaleCache
        }
      }
    }
  }
  const fallback = join(packageDir, 'assets', 'whale-fallback.png')
  if (existsSync(fallback)) {
    whaleCache = { file: fallback, contentType: 'image/png', skin: false, credit: '' }
    return whaleCache
  }
  return whaleCache
}

/**
 * Browser-facing backend: snapshot the settings namespace, save it with
 * optimistic concurrency, and test a draft account over a live IMAP login.
 */
export class EmailSettingsBackend {
  constructor(private readonly ctx: any, private readonly scope: any, private readonly rowConfig: EmailConfig) {}

  /** Wired by apply(): the email_watch core; 'web' keeps its own cursor scope. */
  watchImpl?: (account: string, folder: string, limit: number, scope: string) => Promise<EmailWatchResult>

  private userSection(): Partial<EmailSettingsValue> | undefined {
    const descriptor = (this.ctx.settings.describe?.() ?? []).find((row: any) => row.ns === SETTINGS_NAMESPACE)
    return descriptor?.user as Partial<EmailSettingsValue> | undefined
  }

  /** Effective config for the stored value (row + user-set fields only). */
  private effectiveStored(): EmailConfig {
    return { ...this.rowConfig, ...toEmailConfig(this.scope.get() as EmailSettingsValue, this.userSection()) }
  }

  async snapshot() {
    const descriptor = (this.ctx.settings.describe?.() ?? []).find((row: any) => row.ns === SETTINGS_NAMESPACE)
    const value = this.scope.get() as EmailSettingsValue
    const whale = findWhaleAsset()
    return {
      settings: {
        value,
        revision: descriptor?.revision ?? 0,
        applies: descriptor?.applies ?? 'live',
      },
      writable: this.ctx.settings.writable !== false,
      accounts: [...(this.effectiveAccounts().keys())],
      whale: whale === null
        ? { url: '', skin: false, credit: '' }
        : { url: WHALE_ASSET_ROUTE, skin: whale.skin, credit: whale.credit },
    }
  }

  private effectiveAccounts(): Map<string, unknown> {
    try {
      return resolveEmailSettings(this.effectiveStored()).accounts
    } catch {
      return new Map()
    }
  }

  async save(value: EmailSettingsValue, expectedRevision: number) {
    if (this.ctx.settings.writable === false) throw new Error('settings provider is read-only')
    validateSettingsValue(value)
    await this.ctx.settings.replace(SETTINGS_NAMESPACE, value, expectedRevision)
    return this.snapshot()
  }

  async test(value: EmailSettingsValue) {
    validateSettingsValue(value)
    // null projects the complete draft: test the form as the user typed it.
    const settings = resolveEmailSettings({ ...this.rowConfig, ...toEmailConfig(value, null) })
    const pool = new EmailPool(settings)
    try {
      const started = Date.now()
      await pool.withImap(settings.defaultAccount, null, async () => 'connected')
      return { ok: true, ms: Date.now() - started }
    } finally {
      pool.dispose()
    }
  }

  responseJson(res: any, status: number, body: unknown) {
    const bytes = Buffer.from(JSON.stringify(body))
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Length', String(bytes.length))
    res.setHeader('Cache-Control', 'no-store')
    res.writeHead(status)
    res.end(bytes)
  }

  async handle(req: any, res: any) {
    // Localhost-only: the snapshot carries the stored authorization code. If a
    // deployment binds the webserver to 0.0.0.0, this route must never leak it
    // to the LAN.
    const remote = String(req.socket?.remoteAddress ?? '')
    if (remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1') {
      this.responseJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'dsh-email settings route is localhost-only' } })
      return
    }
    if (req.method === 'GET') {
      try {
        this.responseJson(res, 200, { ok: true, value: await this.snapshot() })
      } catch (error) {
        this.responseJson(res, 503, { ok: false, error: { code: 'unavailable', message: messageOf(error, 'unknown error') } })
      }
      return
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      this.responseJson(res, 405, { ok: false, error: { code: 'method-not-allowed', message: 'Use GET or POST' } })
      return
    }
    let body: any
    try {
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        if (chunks.reduce((n, c) => n + c.length, 0) + part.length > 256 * 1024) throw new RangeError('request body too large')
        chunks.push(part)
      }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch (error) {
      this.responseJson(res, 400, { ok: false, error: { code: 'invalid-request', message: messageOf(error, 'unknown error') } })
      return
    }
    try {
      if (body?.action === 'save') {
        if (!Number.isSafeInteger(body.expectedRevision)) throw new Error('expectedRevision must be a non-negative integer')
        this.responseJson(res, 200, { ok: true, value: await this.save(body.value, body.expectedRevision) })
      } else if (body?.action === 'test') {
        this.responseJson(res, 200, { ok: true, value: await this.test(body.value) })
      } else if (body?.action === 'watch') {
        if (typeof this.watchImpl !== 'function') throw new Error('email_watch 未就绪')
        const account = typeof body.account === 'string' ? body.account : ''
        const folder = typeof body.folder === 'string' ? body.folder : ''
        const limit = Number.isSafeInteger(body.limit) ? (body.limit as number) : 5
        this.responseJson(res, 200, { ok: true, value: await this.watchImpl(account, folder, limit, 'web') })
      } else {
        this.responseJson(res, 400, { ok: false, error: { code: 'invalid-request', message: 'unsupported action' } })
      }
    } catch (error) {
      const conflict = (error as any)?.code === 'SETTINGS_CONFLICT'
      this.responseJson(res, conflict ? 409 : 400, {
        ok: false,
        error: { code: conflict ? 'settings-conflict' : 'rejected', message: messageOf(error, 'unknown error') },
      })
    }
  }
  /** GET-only localhost route serving the whale-girl courier image. */
  handleAsset(req: any, res: any) {
    const remote = String(req.socket?.remoteAddress ?? '')
    if (remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1') {
      this.responseJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'dsh-email asset route is localhost-only' } })
      return
    }
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      this.responseJson(res, 405, { ok: false, error: { code: 'method-not-allowed', message: 'Use GET' } })
      return
    }
    const asset = findWhaleAsset()
    if (asset === null) {
      this.responseJson(res, 404, { ok: false, error: { code: 'not-found', message: 'no whale asset available' } })
      return
    }
    try {
      const bytes = readFileSync(asset.file)
      res.setHeader('Content-Type', asset.contentType)
      res.setHeader('Content-Length', String(bytes.length))
      res.setHeader('Cache-Control', 'no-store')
      if (asset.credit !== '') res.setHeader('X-Whale-Credit', asset.credit)
      res.writeHead(200)
      res.end(bytes)
    } catch (error) {
      this.responseJson(res, 503, { ok: false, error: { code: 'unavailable', message: messageOf(error, 'unknown error') } })
    }
  }
}

/** Mount the same-origin routes when a webServer service is present. */
export function installEmailSettingsWeb(ctx: any, backend: EmailSettingsBackend): void {
  ctx.inject(['webServer'], (webCtx: any) => {
    webCtx.effect(() => {
      const dispose = webCtx.webServer.register({
        kind: 'exact',
        path: SETTINGS_ROUTE,
        handler: (req: any, res: any) => backend.handle(req, res),
      })
      const disposeAsset = webCtx.webServer.register({
        kind: 'exact',
        path: WHALE_ASSET_ROUTE,
        handler: (req: any, res: any) => backend.handleAsset(req, res),
      })
      return () => {
        dispose()
        disposeAsset()
      }
    }, 'dsh-email: web routes')
  })
}