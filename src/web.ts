import { SETTINGS_NAMESPACE, toEmailConfig, validateSettingsValue, type EmailSettingsValue } from './settings.js'
import { resolveEmailSettings, type EmailConfig } from './config.js'
import { EmailPool, messageOf } from './mail-client.js'

/** Same-origin route the browser settings section talks to. */
export const SETTINGS_ROUTE = '/_dsh/dsh-email/settings'

/**
 * Browser-facing backend: snapshot the settings namespace, save it with
 * optimistic concurrency, and test a draft account over a live IMAP login.
 */
export class EmailSettingsBackend {
  constructor(private readonly ctx: any, private readonly scope: any, private readonly rowConfig: EmailConfig) {}

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
    return {
      settings: {
        value,
        revision: descriptor?.revision ?? 0,
        applies: descriptor?.applies ?? 'live',
      },
      writable: this.ctx.settings.writable !== false,
      accounts: [...(this.effectiveAccounts().keys())],
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
}

/** Mount the same-origin route when a webServer service is present. */
export function installEmailSettingsWeb(ctx: any, backend: EmailSettingsBackend): void {
  ctx.inject(['webServer'], (webCtx: any) => {
    webCtx.effect(() => {
      const dispose = webCtx.webServer.register({
        kind: 'exact',
        path: SETTINGS_ROUTE,
        handler: (req: any, res: any) => backend.handle(req, res),
      })
      return () => dispose()
    }, 'dsh-email: web route')
  })
}