import { homedir } from 'node:os'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { join } from 'node:path'

/** The 8 built-in provider ids. A `provider` may also name a custom preset. */
export type ProviderName = 'qq' | '163' | '126' | 'sina' | 'aliyun' | 'gmail' | 'outlook' | 'icloud'

/**
 * A provider id as an account stores it: one of the built-in names, or the name
 * of a custom `serverPresets` entry. The union keeps autocomplete for the
 * built-ins while admitting a preset name the schema cannot know in advance.
 */
export type ProviderRef = ProviderName | (string & {})

export interface ImapConfig {
  host?: string
  port?: number
  secure?: boolean
  connectionTimeoutMs?: number
  socketTimeoutMs?: number
}

export interface SmtpConfig {
  host?: string
  port?: number
  secure?: boolean
}

/** One mailbox account. Top-level shorthand fields act as shared defaults. */
export interface AccountConfig {
  /** Built-in provider name, or a custom serverPresets name. */
  provider?: ProviderRef
  user?: string
  password?: string
  imap?: ImapConfig
  smtp?: SmtpConfig
  inboxFolder?: string
}

export interface EmailConfig extends AccountConfig {
  /** Ask the user for approval before email_send. Default true. */
  sendApproval?: boolean
  /** Plain-text body cap for email_read. Default 20000. */
  maxBodyChars?: number
  /** Named accounts. Account-level fields override the top-level shorthand. */
  accounts?: Record<string, AccountConfig>
  /** YAML text of the accounts map, editable from the settings page. Wins over accounts when non-empty. */
  accountsYaml?: string
  /**
   * YAML text of the reusable server presets (connection endpoints only).
   * Deliberately never part of ResolvedEmailSettings: editing a preset must not
   * change the pool fingerprint and tear down live IMAP connections.
   */
  serverPresets?: string
  /** Which account tools use when the call omits account. Required with 2+ accounts. */
  defaultAccount?: string
  /** Directory email_attachment writes into. Default: the session workspace's .dsh-email-downloads (falls back to $DSH_HOME/email-downloads). */
  downloadDir?: string
  /** Client-side body scan when server search finds nothing. Default true. */
  bodySearchFallback?: boolean
  /** How many recent messages the body-search fallback parses. Default 30. */
  bodySearchLimit?: number
  /** Per-attachment and total-attachment byte cap. Default 20 MiB. */
  maxAttachmentBytes?: number
  /** Unused IMAP connections close after this many ms. Default 60000. */
  idleTimeoutMs?: number
}

export interface ProviderPreset {
  imap: { host: string; port: number; secure: boolean }
  smtp: { host: string; port: number; secure: boolean }
}

/**
 * Anything that can stand in for a provider: a built-in preset, or a custom
 * `serverPresets` entry (whose port/secure are optional and whose label is
 * editor-facing only). Both are looked up the same way.
 */
export interface EndpointPreset {
  imap: { host: string; port?: number; secure?: boolean }
  smtp: { host: string; port?: number; secure?: boolean }
  label?: string
}

export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  qq: { imap: { host: 'imap.qq.com', port: 993, secure: true }, smtp: { host: 'smtp.qq.com', port: 465, secure: true } },
  '163': { imap: { host: 'imap.163.com', port: 993, secure: true }, smtp: { host: 'smtp.163.com', port: 465, secure: true } },
  '126': { imap: { host: 'imap.126.com', port: 993, secure: true }, smtp: { host: 'smtp.126.com', port: 465, secure: true } },
  sina: { imap: { host: 'imap.sina.com', port: 993, secure: true }, smtp: { host: 'smtp.sina.com', port: 465, secure: true } },
  aliyun: { imap: { host: 'imap.aliyun.com', port: 993, secure: true }, smtp: { host: 'smtp.aliyun.com', port: 465, secure: true } },
  gmail: { imap: { host: 'imap.gmail.com', port: 993, secure: true }, smtp: { host: 'smtp.gmail.com', port: 465, secure: true } },
  outlook: { imap: { host: 'outlook.office365.com', port: 993, secure: true }, smtp: { host: 'smtp.office365.com', port: 587, secure: false } },
  icloud: { imap: { host: 'imap.mail.me.com', port: 993, secure: true }, smtp: { host: 'smtp.mail.me.com', port: 587, secure: false } },
}

export const PROVIDER_NAMES = Object.keys(PROVIDER_PRESETS)

export const EMAIL_PASSWORD_ENV = 'DSH_EMAIL_PASSWORD'

const DEFAULT_MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024
const DEFAULT_IDLE_TIMEOUT_MS = 60000

/** Fully resolved, validated configuration for one account. */
export interface ResolvedEmailConfig {
  user: string
  password: string
  imap: ImapConfig & { host: string; port: number; secure: boolean }
  smtp: SmtpConfig & { host: string; port: number; secure: boolean }
  inboxFolder: string
}

/** Fully resolved plugin settings: the account map plus shared policy. */
export interface ResolvedEmailSettings {
  accounts: Map<string, ResolvedEmailConfig>
  defaultAccount: string
  sendApproval: boolean
  maxBodyChars: number
  downloadDir: string
  /** Whether downloadDir was set explicitly (vs. the default). */
  downloadDirExplicit: boolean
  maxAttachmentBytes: number
  idleTimeoutMs: number
  bodySearchFallback: boolean
  bodySearchLimit: number
}

export function defaultDownloadDir(): string {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'email-downloads')
}

/**
 * Parse the settings-page accounts YAML: an object map (name -> account),
 * optionally with a reserved string key defaultAccount that is extracted.
 */
export function parseAccountsYaml(text: string): { map: Record<string, AccountConfig>; defaultAccount?: string } {
  let doc: unknown
  try {
    doc = parseYaml(text)
  } catch (error) {
    throw new Error('dsh-email：accountsYaml 不是合法的 YAML：' + (error instanceof Error ? error.message : String(error)))
  }
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error('dsh-email：accountsYaml 必须是一个对象映射（账号名 -> 账号配置），例如 work: { provider: qq, user: a@b.c, password: xxx }')
  }
  const map: Record<string, AccountConfig> = {}
  let defaultAccount: string | undefined
  for (const [key, value] of Object.entries(doc as Record<string, unknown>)) {
    if (key === 'defaultAccount') {
      if (typeof value === 'string' && value !== '') defaultAccount = value
      continue
    }
    map[key] = value as AccountConfig
  }
  return { map, defaultAccount }
}

/** Reusable IMAP/SMTP endpoints. Credentials are never stored in a preset. */
export interface ServerPreset {
  label?: string
  imap: { host: string; port?: number; secure?: boolean }
  smtp: { host: string; port?: number; secure?: boolean }
}

/**
 * Parse the settings-page server presets: a name -> endpoints map, e.g.
 * `corp: { imap: { host: imap.corp }, smtp: { host: smtp.corp } }`.
 * Blank text means "no presets"; a malformed document fails loud, because a
 * silently dropped preset would only resurface later as an unresolvable
 * account reference.
 */
export function parseServerPresets(text: string): Record<string, ServerPreset> {
  if (text.trim() === '') return {}
  let doc: unknown
  try {
    doc = parseYaml(text)
  } catch (error) {
    throw new Error('dsh-email：serverPresets 不是合法的 YAML：' + (error instanceof Error ? error.message : String(error)))
  }
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error('dsh-email：serverPresets 不是合法的对象映射')
  }
  const presets: Record<string, ServerPreset> = {}
  for (const [name, value] of Object.entries(doc as Record<string, unknown>)) {
    presets[name] = parseServerPreset(name, value)
  }
  return presets
}

/** Validate one preset entry. Both endpoints are required; port/secure optional. */
function parseServerPreset(name: string, value: unknown): ServerPreset {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`dsh-email：服务器预设 "${name}" 必须是含 imap 与 smtp 的对象`)
  }
  const raw = value as Record<string, unknown>
  if (raw.label !== undefined && typeof raw.label !== 'string') {
    throw new Error(`dsh-email：服务器预设 "${name}" 的 label 必须是字符串`)
  }
  return {
    ...(raw.label !== undefined ? { label: raw.label as string } : {}),
    imap: parseServerPresetEndpoint(name, 'imap', raw.imap),
    smtp: parseServerPresetEndpoint(name, 'smtp', raw.smtp),
  }
}

function parseServerPresetEndpoint(name: string, kind: 'imap' | 'smtp', value: unknown): ServerPreset['imap'] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`dsh-email：服务器预设 "${name}" 缺少 ${kind}（需为含 host 的对象）`)
  }
  const raw = value as Record<string, unknown>
  const host = typeof raw.host === 'string' ? raw.host.trim() : ''
  if (host === '') throw new Error(`dsh-email：服务器预设 "${name}" 的 ${kind}.host 未填写`)
  if (raw.port !== undefined && (typeof raw.port !== 'number' || !Number.isFinite(raw.port))) {
    throw new Error(`dsh-email：服务器预设 "${name}" 的 ${kind}.port 必须是数字`)
  }
  if (raw.secure !== undefined && typeof raw.secure !== 'boolean') {
    throw new Error(`dsh-email：服务器预设 "${name}" 的 ${kind}.secure 必须是布尔值`)
  }
  return {
    host,
    ...(raw.port !== undefined ? { port: raw.port as number } : {}),
    ...(raw.secure !== undefined ? { secure: raw.secure as boolean } : {}),
  }
}

/**
 * Serialize a raw accounts mapping (account name -> account config, optionally
 * carrying a defaultAccount key) back into accountsYaml text.
 *
 * Returns '' when no account is left: resolveEmailSettings decides "is the YAML
 * authoritative" with `.trim()`, so an empty list must never become '{}'.
 */
export function serializeAccountsYaml(raw: unknown, defaultAccount?: string): string {
  const doc = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
  const accounts: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(doc)) {
    if (name === 'defaultAccount') continue
    accounts[name] = normalizeAccountForYaml(value)
  }
  if (Object.keys(accounts).length === 0) return ''
  const stored = typeof doc.defaultAccount === 'string' ? doc.defaultAccount.trim() : ''
  const chosen = (defaultAccount ?? '').trim() || stored
  const out: Record<string, unknown> = { ...accounts }
  if (chosen !== '') out.defaultAccount = chosen
  return stringifyYaml(out, { aliasDuplicateObjects: false, lineWidth: 0 })
}

/**
 * Prepare one account entry for the YAML writer.
 *
 * `provider` disappears when unset or '' — the settings page uses '' for
 * "custom server", and writing it back would make resolution throw
 * 「provider "" 未知」 (same normalization as toEmailConfig). A numeric
 * password is coerced to a string so the writer quotes it: YAML would
 * otherwise read `password: 123456` back as a number.
 */
function normalizeAccountForYaml(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value ?? {}
  const account = { ...(value as Record<string, unknown>) }
  if (account.provider === undefined || account.provider === '') delete account.provider
  if (typeof account.password === 'number' || typeof account.password === 'boolean') account.password = String(account.password)
  return account
}

/**
 * Resolve and validate the raw row config. Throws with an actionable message
 * (in Chinese, since it is what the user and the model both read) when the
 * account is not fully specified.
 */
export function resolveEmailSettings(config: EmailConfig | undefined): ResolvedEmailSettings {
  const raw = config ?? {}
  const common: AccountConfig = {
    provider: raw.provider,
    user: raw.user,
    password: raw.password,
    imap: raw.imap,
    smtp: raw.smtp,
    inboxFolder: raw.inboxFolder,
  }
  const parsedYaml = raw.accountsYaml?.trim() ? parseAccountsYaml(raw.accountsYaml) : undefined
  const entries = parsedYaml !== undefined
    ? parsedYaml.map
    : (raw.accounts === undefined || Object.keys(raw.accounts).length === 0 ? undefined : raw.accounts)
  // The custom preset table is read once, here, and never stored on the result:
  // it is a lookup source for provider names, not part of the resolved config.
  // A broken preset text degrades to "no custom presets" — the account-level
  // error below stays explicit about which name could not be resolved.
  let customPresets: Record<string, ServerPreset> = {}
  try {
    customPresets = parseServerPresets(raw.serverPresets ?? '')
  } catch {
    customPresets = {}
  }
  const providers = providerTable(customPresets)
  const known = providerNames(customPresets)
  const accounts = new Map<string, ResolvedEmailConfig>()
  if (entries === undefined) {
    accounts.set('default', resolveAccount('default', common, {}, true, providers, known))
  } else {
    for (const [name, acc] of Object.entries(entries)) {
      accounts.set(name, resolveAccount(name, common, acc ?? {}, false, providers, known))
    }
  }
  let defaultName: string
  if (raw.defaultAccount !== undefined && raw.defaultAccount !== '') {
    if (!accounts.has(raw.defaultAccount)) {
      throw new Error(`dsh-email：defaultAccount "${raw.defaultAccount}" 不存在，可用账号：${[...accounts.keys()].join('、')}`)
    }
    defaultName = raw.defaultAccount
  } else if (accounts.size === 1) {
    defaultName = [...accounts.keys()][0]
  } else if (parsedYaml?.defaultAccount !== undefined && accounts.has(parsedYaml.defaultAccount)) {
    defaultName = parsedYaml.defaultAccount
  } else if (accounts.has('default')) {
    defaultName = 'default'
  } else {
    throw new Error(`dsh-email：配置了多个账号（${[...accounts.keys()].join('、')}），请设置 defaultAccount 指定默认账号`)
  }
  return {
    accounts,
    defaultAccount: defaultName,
    sendApproval: raw.sendApproval !== false,
    maxBodyChars: clampInt(raw.maxBodyChars, 20000, 1000, 200000),
    downloadDir: raw.downloadDir?.trim() || defaultDownloadDir(),
    downloadDirExplicit: (raw.downloadDir?.trim() ?? '') !== '',
    maxAttachmentBytes: clampInt(raw.maxAttachmentBytes, DEFAULT_MAX_ATTACHMENT_BYTES, 1024, 512 * 1024 * 1024),
    idleTimeoutMs: clampInt(raw.idleTimeoutMs, DEFAULT_IDLE_TIMEOUT_MS, 5000, 600000),
    bodySearchFallback: raw.bodySearchFallback !== false,
    bodySearchLimit: clampInt(raw.bodySearchLimit, 30, 5, 200),
  }
}

/**
 * The provider lookup order: the 8 built-ins first, then the custom presets.
 * A built-in name always wins, so a custom preset cannot shadow `qq` — and an
 * inherited Object member (`constructor`, `toString`) is never a provider.
 *
 * The table has a null prototype on purpose: a plain `{}` answers
 * `table['constructor']` with Object's own constructor through the prototype
 * chain, which would be mistaken for a preset and then blow up on `.imap.host`.
 */
function providerTable(custom: Record<string, ServerPreset>): Record<string, EndpointPreset> {
  const table: Record<string, EndpointPreset> = Object.create(null)
  for (const [name, preset] of Object.entries(PROVIDER_PRESETS)) table[name] = preset
  for (const [name, preset] of Object.entries(custom)) {
    if (table[name] === undefined) table[name] = preset
  }
  return table
}

/** Every name a `provider:` may legally use, built-ins first. */
export function providerNames(custom: Record<string, ServerPreset> = {}): string[] {
  const names = [...PROVIDER_NAMES]
  for (const name of Object.keys(custom)) if (!names.includes(name)) names.push(name)
  return names
}

/**
 * The custom preset names in a serverPresets text, best-effort: a malformed
 * text yields no names instead of throwing. Callers use this to answer "may
 * this provider name be written?", where a broken table can only mean "no".
 */
export function presetNamesIn(text: string | undefined): string[] {
  try {
    return Object.keys(parseServerPresets(text ?? ''))
  } catch {
    return []
  }
}

/** Merge one account over the shared shorthand and validate it. */
function resolveAccount(
  name: string,
  common: AccountConfig,
  acc: AccountConfig,
  allowEnvPassword: boolean,
  providers: Record<string, EndpointPreset>,
  known: string[],
): ResolvedEmailConfig {
  const requested = acc.provider ?? common.provider
  const preset = requested === undefined ? undefined : providers[requested]
  if (requested !== undefined && preset === undefined) {
    throw new Error(`dsh-email：账号 "${name}" 的 provider "${requested}" 未知，可选：${known.join('/')}；或省略 provider 直接填 imap.host 与 smtp.host`)
  }
  const user = (acc.user ?? common.user ?? '').trim()
  // The settings form uses '' for an empty password. In single-account mode
  // that explicitly selects the environment fallback; named accounts stay isolated.
  const password = (acc.password ?? common.password) || (allowEnvPassword ? process.env[EMAIL_PASSWORD_ENV] ?? '' : '')
  const imap = {
    host: acc.imap?.host ?? common.imap?.host ?? preset?.imap.host,
    port: acc.imap?.port ?? common.imap?.port ?? preset?.imap.port,
    secure: acc.imap?.secure ?? common.imap?.secure ?? preset?.imap.secure,
    connectionTimeoutMs: acc.imap?.connectionTimeoutMs ?? common.imap?.connectionTimeoutMs,
    socketTimeoutMs: acc.imap?.socketTimeoutMs ?? common.imap?.socketTimeoutMs,
  }
  const smtp = {
    host: acc.smtp?.host ?? common.smtp?.host ?? preset?.smtp.host,
    port: acc.smtp?.port ?? common.smtp?.port ?? preset?.smtp.port,
    secure: acc.smtp?.secure ?? common.smtp?.secure ?? preset?.smtp.secure,
  }
  const problems: string[] = []
  if (user === '') problems.push(`账号 "${name}" 的 user（邮箱地址）未填写`)
  if (password === '') problems.push(`账号 "${name}" 的 password 未填写（单账号可用环境变量 ${EMAIL_PASSWORD_ENV}）`)
  if (imap.host === undefined || imap.host === '') problems.push(`账号 "${name}" 的 imap.host 未填写（可填 provider 预设：${known.join('/')}）`)
  if (smtp.host === undefined || smtp.host === '') problems.push(`账号 "${name}" 的 smtp.host 未填写（同上）`)
  if (problems.length > 0) {
    throw new Error(`dsh-email 未配置：${problems.join('；')}。请在 profile 的 cordis.patch.yml 中覆盖 tool-email 行并重启（见插件 README）`)
  }
  return {
    user,
    password,
    imap: { ...imap, host: imap.host!, port: imap.port!, secure: imap.secure! },
    smtp: { ...smtp, host: smtp.host!, port: smtp.port!, secure: smtp.secure! },
    inboxFolder: (acc.inboxFolder ?? common.inboxFolder ?? '').trim() || 'INBOX',
  }
}

/** v0.1-compatible wrapper: resolve the single (or default) account. */
export function resolveEmailConfig(config: EmailConfig | undefined): ResolvedEmailConfig {
  const settings = resolveEmailSettings(config)
  return settings.accounts.get(settings.defaultAccount)!
}

export function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? Math.trunc(value) : fallback
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}
