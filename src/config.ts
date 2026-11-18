import { homedir } from 'node:os'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { join } from 'node:path'
import { parseRecipientPolicies, type RecipientPolicy } from './recipient-policy.js'
import { parseProxyUrl } from './proxy.js'
import { uiText } from './ui-lang.js'

/** The 8 built-in provider ids. A `provider` may also name a custom preset. */
export type ProviderName = 'qq' | 'exmail' | '163' | '126' | 'sina' | 'aliyun' | 'gmail' | 'outlook' | 'icloud'

/**
 * A provider id as an account stores it: one of the built-in names, or the name
 * of a custom `serverPresets` entry. The union keeps autocomplete for the
 * built-ins while admitting a preset name the schema cannot know in advance.
 */
export type ProviderRef = ProviderName | (string & {})

/**
 * The provider that authenticates with OAuth2 instead of a password.
 *
 * Microsoft retired basic authentication for Exchange Online, so `outlook` is
 * not a password provider with different endpoints — it is the same endpoints
 * (imap/smtp.office365.com, straight out of PROVIDER_PRESETS) behind a
 * completely different authentication scheme. `authKind` below is that fact.
 */
export const OUTLOOK_PROVIDER = 'outlook'

/** The Exchange Online IMAP host. Any account dialling it is an OAuth2 account. */
export const OUTLOOK_IMAP_HOST = 'outlook.office365.com'

/**
 * The built-in client id for the device-code flow: a community registration.
 *
 * Requiring every Outlook user to register an application of their own puts a
 * setup wall in front of the one provider where OAuth2 cannot be avoided, so
 * the plugin ships one. The id below is the public-client registration
 * contributed by gurio-wine (PR #13) and used with their permission; the README
 * credits them and states the two things that follow from using somebody
 * else's application: the consent screen names *their* app, and the sign-in
 * logs land in *their* tenant along with the user's UPN.
 *
 * An account that wants neither — an enterprise that refuses third-party apps,
 * or a day when this registration is gone — sets its own `clientId` (a free
 * Entra public-client registration) and that value wins over this constant.
 * The settings card shows which application is in effect either way, so nobody
 * consents to an app they were not told about.
 *
 * Replacing this constant is the whole change a maintainer makes to ship the
 * project's own application instead. Tokens are bound to the id that issued
 * them, so such a release asks every built-in account to log in one more time.
 */
export const OUTLOOK_OAUTH2_CLIENT_ID = '15dcd5aa-00dd-487f-82d7-1d2b2c299e14'

/**
 * How an account proves who it is. `password` covers every existing provider
 * (an app password / 授权码) and is the default, so nothing about them changes.
 */
export type AuthKind = 'oauth2' | 'password'

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

/** Legacy form placeholders; an untouched blank-host endpoint delegates to its provider. */
export const ENDPOINT_DEFAULTS = {
  imap: { port: 993, secure: true }, smtp: { port: 465, secure: true },
} as const

export function normalizeSettingsEndpoint<T extends SmtpConfig>(value: T, kind: keyof typeof ENDPOINT_DEFAULTS): Omit<T, 'host' | 'port' | 'secure'> & SmtpConfig {
  if (typeof value.host !== 'string' || value.host.trim() !== '') return value
  const normalized = { ...value }
  delete normalized.host
  const defaults = ENDPOINT_DEFAULTS[kind]
  // A changed port or TLS choice is intentional; preserve that whole combination.
  if ((value.port === undefined || value.port === defaults.port)
    && (value.secure === undefined || value.secure === defaults.secure)) {
    delete normalized.port
    delete normalized.secure
  }
  return normalized
}

/** One mailbox account. Top-level shorthand fields act as shared defaults. */
export interface AccountConfig {
  /** Incoming protocol only; outgoing messages still use SMTP. */
  receiveProtocol?: 'imap' | 'pop3'
  pop3?: ImapConfig
  /** AgentMail credential; the account editor also accepts it through its secret field. */
  apiKey?: string
  /** Built-in provider name, or a custom serverPresets name. */
  provider?: ProviderRef
  user?: string
  password?: string
  /**
   * Display name for the From header. The address stays `user` — recipients
   * must see the mailbox that owns the mail, not the login.
   */
  senderName?: string
  /**
   * Login handed to IMAP/SMTP when it differs from `user`: the alias case,
   * where `user` is the address mail is sent *from* and the server only
   * authenticates the real account, or a relay whose login is not a mailbox
   * at all. Defaults to `user`.
   */
  authUser?: string
  /** Password that goes with `authUser`. Defaults to `password`. */
  authPassword?: string
  /**
   * Public-client id used by the OAuth2 device-code flow. Only read for an
   * OAuth2 account, where it overrides OUTLOOK_OAUTH2_CLIENT_ID.
   */
  clientId?: string
  clientSecret?: string
  oauthProvider?: 'google' | 'microsoft'
  /**
   * Escape hatch over the derived authentication scheme. Left unset, an account
   * pointed at the `outlook` provider or the Exchange Online IMAP host is an
   * OAuth2 account and its password is dropped. Set `password` to keep using an
   * app password there — a tenant that still accepts basic auth (hybrid or
   * on-prem, SMTP AUTH left enabled), or a mailbox that worked before this
   * derivation existed, must not be told「尚未登录」after an upgrade. Set
   * `oauth2` to opt in from a custom host.
   */
  authKind?: AuthKind
  imap?: ImapConfig
  smtp?: SmtpConfig
  /**
   * Proxy every IMAP/SMTP connection of this account goes through, e.g.
   * `http://127.0.0.1:7897` or `socks5://127.0.0.1:1080`. Left empty, the
   * conventional `HTTPS_PROXY` / `ALL_PROXY` variables are consulted, so a
   * machine whose traffic is already routed needs no per-account setup.
   */
  proxy?: string
  inboxFolder?: string
  replyLocale?: string
  replyTimeZone?: string
}

export interface EmailConfig extends AccountConfig {
  /** Show browser new-mail notifications. UI policy only; default true. */
  newMailPopup?: boolean
  /** Per-account recipient rules, independent of IMAP/SMTP connection settings. */
  trustedRecipientsYaml?: string
  /** Ask the user for approval before email_send. Default true. */
  sendApproval?: boolean
  allowTrustedReply?: boolean
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
  /** Opt-in local email arrival consumers; empty by default. */
  consumers?: Array<{ id: string; account: string; folder?: string; senders?: string[]; subject?: string; enabled?: boolean }>
  /** Consumer scan interval in seconds. Default 60. */
  consumerPollSeconds?: number
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
  exmail: { imap: { host: 'imap.exmail.qq.com', port: 993, secure: true }, smtp: { host: 'smtp.exmail.qq.com', port: 465, secure: true } },
  '163': { imap: { host: 'imap.163.com', port: 993, secure: true }, smtp: { host: 'smtp.163.com', port: 465, secure: true } },
  '126': { imap: { host: 'imap.126.com', port: 993, secure: true }, smtp: { host: 'smtp.126.com', port: 465, secure: true } },
  sina: { imap: { host: 'imap.sina.com', port: 993, secure: true }, smtp: { host: 'smtp.sina.com', port: 465, secure: true } },
  aliyun: { imap: { host: 'imap.aliyun.com', port: 993, secure: true }, smtp: { host: 'smtp.aliyun.com', port: 465, secure: true } },
  gmail: { imap: { host: 'imap.gmail.com', port: 993, secure: true }, smtp: { host: 'smtp.gmail.com', port: 465, secure: true } },
  outlook: { imap: { host: 'outlook.office365.com', port: 993, secure: true }, smtp: { host: 'smtp.office365.com', port: 587, secure: false } },
  icloud: { imap: { host: 'imap.mail.me.com', port: 993, secure: true }, smtp: { host: 'smtp.mail.me.com', port: 587, secure: false } },
}

export const PROVIDER_NAMES = Object.keys(PROVIDER_PRESETS)

/** Documented POP endpoints; unsupported providers require an explicit host. */
export const POP3_PRESETS: Record<string, string> = {
  qq: 'pop.qq.com', exmail: 'pop.exmail.qq.com', '163': 'pop.163.com', '126': 'pop.126.com', gmail: 'pop.gmail.com',
}

export const EMAIL_PASSWORD_ENV = 'DSH_EMAIL_PASSWORD'

export const DEFAULT_MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024
export const MIN_ATTACHMENT_BYTES = 1024
export const MAX_ATTACHMENT_BYTES = 512 * 1024 * 1024
// Draft reviews retain immutable attachment bytes until confirmation.
export const MAX_DRAFT_ATTACHMENT_BYTES = 40 * 1024 * 1024
const DEFAULT_IDLE_TIMEOUT_MS = 60000

export function normalizeAttachmentLimit(value: unknown): number {
  return clampInt(value, DEFAULT_MAX_ATTACHMENT_BYTES, MIN_ATTACHMENT_BYTES, MAX_ATTACHMENT_BYTES)
}

export function draftAttachmentLimit(configuredBytes: number, transport?: ResolvedEmailConfig['transport']): number {
  return Math.min(configuredBytes, transport === 'agentmail' ? 4 * 1024 * 1024 : MAX_DRAFT_ATTACHMENT_BYTES)
}

/** Fully resolved, validated configuration for one account. */
export interface ResolvedEmailConfig {
  replyLocale?: string
  replyTimeZone?: string
  transport?: 'agentmail' | 'pop3'
  pop3?: ImapConfig & { host: string; port: number; secure: boolean }
  apiBase?: 'https://api.agentmail.to' | 'https://api.agentmail.eu'
  user: string
  /** Display name for the From header, '' when the account does not set one. */
  senderName: string
  /** Login actually handed to IMAP/SMTP (== user unless authUser is set). */
  authUser: string
  /** Password for authUser (== password unless authPassword is set). */
  authPassword: string
  /**
   * The app password / 授权码. Empty for an OAuth2 account — that is the point:
   * nothing is stored, the token store holds the credential instead.
   */
  password: string
  /**
   * How this account authenticates. Derived from `provider` / the IMAP host
   * unless the account pins it with an explicit `authKind`.
   */
  authKind: AuthKind
  /** Public-client id for the device-code flow (OAuth2 accounts only). */
  clientId?: string
  clientSecret?: string
  oauthProvider?: 'google' | 'microsoft'
  imap: ImapConfig & { host: string; port: number; secure: boolean }
  smtp: SmtpConfig & { host: string; port: number; secure: boolean }
  /**
   * Resolved proxy URL for this account's IMAP/SMTP connections, or undefined
   * for a direct connection. Already validated here so the transports can hand
   * it straight to their dialers.
   */
  proxy?: string
  inboxFolder: string
}

/**
 * True when an account authenticates with OAuth2 rather than a password.
 *
 * Two ways in, and only these two: the built-in `outlook` provider, or an
 * account pointed at the Exchange Online IMAP host by hand (a custom preset or
 * an explicit `imap.host`). The host test is what keeps a custom preset to
 * outlook.office365.com from silently demanding a password Microsoft no longer
 * accepts — the endpoints are identical, only the credentials are not.
 */
export function isOAuth2Account(provider: string | undefined, imapHost: string | undefined): boolean {
  if (provider === OUTLOOK_PROVIDER) return true
  return (imapHost ?? '').trim().toLowerCase() === OUTLOOK_IMAP_HOST
}

/** Fully resolved plugin settings: the account map plus shared policy. */
export interface ResolvedEmailSettings {
  recipientPolicies?: Map<string, RecipientPolicy>
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
    throw new Error('dsh-email: accountsYaml is not valid YAML: ' + (error instanceof Error ? error.message : String(error)))
  }
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error('dsh-email: accountsYaml must be an object map (account name -> account config), for example work: { provider: qq, user: a@b.c, password: xxx }')
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
 * The provider value the settings page reserves for its「自定义服务器」entry.
 *
 * Such an account stores no `provider`; its endpoints live on the account
 * itself. A preset with the same name would be shadowed by that dropdown entry
 * (the page skips it), and hand-written YAML could otherwise copy preset
 * endpoints into the account on the next card save. Reject it here, exactly as
 * the presets editor does.
 */
export const CUSTOM_SERVER_PROVIDER = '__custom__'

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
    throw new Error('dsh-email: serverPresets is not valid YAML: ' + (error instanceof Error ? error.message : String(error)))
  }
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error('dsh-email: serverPresets must be an object map')
  }
  const presets: Record<string, ServerPreset> = {}
  for (const [name, value] of Object.entries(doc as Record<string, unknown>)) {
    if (name === CUSTOM_SERVER_PROVIDER) {
      throw new Error(`dsh-email: serverPresets cannot use the reserved name "${CUSTOM_SERVER_PROVIDER}" (the value behind the settings page Custom server dropdown entry)`)
    }
    presets[name] = parseServerPreset(name, value)
  }
  return presets
}

/** Validate one preset entry. Both endpoints are required; port/secure optional. */
function parseServerPreset(name: string, value: unknown): ServerPreset {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`dsh-email: server preset "${name}" must be an object with imap and smtp`)
  }
  const raw = value as Record<string, unknown>
  if (raw.label !== undefined && typeof raw.label !== 'string') {
    throw new Error(`dsh-email: server preset "${name}" label must be a string`)
  }
  return {
    ...(raw.label !== undefined ? { label: raw.label as string } : {}),
    imap: parseServerPresetEndpoint(name, 'imap', raw.imap),
    smtp: parseServerPresetEndpoint(name, 'smtp', raw.smtp),
  }
}

function parseServerPresetEndpoint(name: string, kind: 'imap' | 'smtp', value: unknown): ServerPreset['imap'] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`dsh-email: server preset "${name}" is missing ${kind} (an object with host)`)
  }
  const raw = value as Record<string, unknown>
  const host = typeof raw.host === 'string' ? raw.host.trim() : ''
  if (host === '') throw new Error(`dsh-email: server preset "${name}" has no ${kind}.host`)
  if (raw.port !== undefined && (typeof raw.port !== 'number' || !Number.isFinite(raw.port))) {
    throw new Error(`dsh-email: server preset "${name}" ${kind}.port must be a number`)
  }
  if (raw.secure !== undefined && typeof raw.secure !== 'boolean') {
    throw new Error(`dsh-email: server preset "${name}" ${kind}.secure must be true or false`)
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
 * An explicit account resolves only that card for connection tests, without
 * making named accounts eligible for the single-account environment password.
 */
export function resolveEmailSettings(config: EmailConfig | undefined, onlyAccount?: string): ResolvedEmailSettings {
  const raw = config ?? {}
  const common: AccountConfig = {
    receiveProtocol: raw.receiveProtocol,
    pop3: raw.pop3,
    provider: raw.provider,
    user: raw.user,
    password: raw.password, apiKey: raw.apiKey,
    senderName: raw.senderName,
    authUser: raw.authUser,
    authPassword: raw.authPassword,
    clientId: raw.clientId,
    clientSecret: raw.clientSecret,
    oauthProvider: raw.oauthProvider,
    authKind: raw.authKind,
    imap: raw.imap,
    smtp: raw.smtp,
    proxy: raw.proxy,
    inboxFolder: raw.inboxFolder,
    replyLocale: raw.replyLocale,
    replyTimeZone: raw.replyTimeZone,
  }
  const parsedYaml = raw.accountsYaml?.trim() ? parseAccountsYaml(raw.accountsYaml) : undefined
  const entries = parsedYaml !== undefined
    ? parsedYaml.map
    : (raw.accounts === undefined || Object.keys(raw.accounts).length === 0 ? undefined : raw.accounts)
  const available = entries === undefined ? ['default'] : Object.keys(entries)
  if (onlyAccount !== undefined && !available.includes(onlyAccount)) {
    throw new Error(`Unknown account "${onlyAccount}"; available: ${available.join(', ')}`)
  }
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
      if (onlyAccount !== undefined && name !== onlyAccount) continue
      accounts.set(name, resolveAccount(name, common, acc ?? {}, false, providers, known))
    }
  }
  let defaultName: string
  if (onlyAccount !== undefined) {
    defaultName = onlyAccount
  } else if (raw.defaultAccount !== undefined && raw.defaultAccount !== '') {
    if (!accounts.has(raw.defaultAccount)) {
      throw new Error(`dsh-email: defaultAccount "${raw.defaultAccount}" does not exist; available accounts: ${[...accounts.keys()].join(', ')}`)
    }
    defaultName = raw.defaultAccount
  } else if (accounts.size === 1) {
    defaultName = [...accounts.keys()][0]
  } else if (parsedYaml?.defaultAccount !== undefined && accounts.has(parsedYaml.defaultAccount)) {
    defaultName = parsedYaml.defaultAccount
  } else if (accounts.has('default')) {
    defaultName = 'default'
  } else {
    throw new Error(`dsh-email: several accounts are configured (${[...accounts.keys()].join(', ')}); set defaultAccount to choose the default`)
  }
  return {
    accounts,
    recipientPolicies: parseRecipientPolicies(raw.trustedRecipientsYaml),
    defaultAccount: defaultName,
    sendApproval: raw.sendApproval !== false,
    maxBodyChars: clampInt(raw.maxBodyChars, 20000, 1000, 200000),
    downloadDir: raw.downloadDir?.trim() || defaultDownloadDir(),
    downloadDirExplicit: (raw.downloadDir?.trim() ?? '') !== '',
    maxAttachmentBytes: normalizeAttachmentLimit(raw.maxAttachmentBytes),
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
  const names: string[] = [...PROVIDER_NAMES, 'agentmail', 'agentmail-eu']
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

/** Materialize shared account defaults without replacing a named provider's servers. */
export function mergeAccountDefaults(common: AccountConfig, account: AccountConfig = {}): AccountConfig {
  const acc = account ?? {}
  const ownProvider = acc.provider !== undefined && acc.provider !== ''
  // A named provider selects its own servers; shared connection budgets still apply.
  const sharedImap = ownProvider ? {
    ...(common.imap?.connectionTimeoutMs !== undefined ? { connectionTimeoutMs: common.imap.connectionTimeoutMs } : {}),
    ...(common.imap?.socketTimeoutMs !== undefined ? { socketTimeoutMs: common.imap.socketTimeoutMs } : {}),
  } : common.imap && normalizeSettingsEndpoint(common.imap, 'imap')
  const sharedSmtp = !ownProvider && common.smtp ? normalizeSettingsEndpoint(common.smtp, 'smtp') : undefined
  const imap = { ...sharedImap, ...(acc.imap && normalizeSettingsEndpoint(acc.imap, 'imap')) }
  const smtp = { ...sharedSmtp, ...(acc.smtp && normalizeSettingsEndpoint(acc.smtp, 'smtp')) }
  const pop3 = { ...(!ownProvider ? common.pop3 : undefined), ...acc.pop3 }
  return { ...common, ...acc,
    pop3: Object.keys(pop3).length > 0 ? pop3 : undefined,
    imap: Object.keys(imap).length > 0 ? imap : undefined,
    smtp: Object.keys(smtp).length > 0 ? smtp : undefined,
  }
}

/** Merge one account over shared defaults and its selected provider, then validate it. */
function resolveAccount(
  name: string,
  common: AccountConfig,
  acc: AccountConfig,
  allowEnvPassword: boolean,
  providers: Record<string, EndpointPreset>,
  known: string[],
): ResolvedEmailConfig {
  /** Host-side language selector: replyLocale is the only preference the host stores. */
  const T = (zh: string, en: string): string => uiText({ replyLocale: acc.replyLocale ?? common.replyLocale }, zh, en)
  // Public settings persist the form's empty custom-server selection directly.
  // Normalize it like the legacy projection and YAML writer before preset lookup.
  const requested = (acc.provider === '' ? undefined : acc.provider) ?? (common.provider === '' ? undefined : common.provider)
  const preset = requested === undefined ? undefined : providers[requested]
  if (requested === 'agentmail' || requested === 'agentmail-eu') {
    const user = String(acc.user ?? common.user ?? '').trim()
    const sharedApi = common.provider === requested
    const key = String(acc.password || acc.apiKey || (sharedApi ? common.password || common.apiKey : '') || (allowEnvPassword ? process.env.DSH_AGENTMAIL_API_KEY ?? '' : '')).trim()
    if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(user) || !key || key.length > 4096 || /[^\x21-\x7e]/.test(key)) throw new Error(T('AgentMail 账号需要有效邮箱地址和 API Key，请在「设置 → 邮件」补全后测试连接。', 'An AgentMail account needs a valid mailbox address and API key. Fill them in under Settings → Email, then test the connection.'))
    return { transport: 'agentmail', apiBase: requested === 'agentmail-eu' ? 'https://api.agentmail.eu' : 'https://api.agentmail.to', user,
      senderName: '', authUser: user, authPassword: key, password: key, authKind: 'password',
      imap: { host: '', port: 993, secure: true }, smtp: { host: '', port: 465, secure: true }, inboxFolder: 'INBOX',
      ...(acc.replyLocale ?? common.replyLocale ? {replyLocale:acc.replyLocale ?? common.replyLocale}:{}),
      ...(acc.replyTimeZone ?? common.replyTimeZone ? {replyTimeZone:acc.replyTimeZone ?? common.replyTimeZone}:{}) }
  }
  if (requested !== undefined && preset === undefined) {
    throw new Error(T(`dsh-email：账号 "${name}" 的 provider "${requested}" 未知，可选：${known.join('/')}；或省略 provider 直接填 imap.host 与 smtp.host`, `dsh-email: account "${name}" has unknown provider "${requested}"; choose one of ${known.join('/')}, or omit provider and fill in imap.host and smtp.host directly`))
  }
  const user = (acc.user ?? common.user ?? '').trim()
  // The settings form uses '' for an empty password. In single-account mode
  // that explicitly selects the environment fallback; named accounts stay isolated.
  const password = (acc.password ?? common.password) || (allowEnvPassword ? process.env[EMAIL_PASSWORD_ENV] ?? '' : '')
  // An alias account sends from `user` but authenticates as somebody else, and a
  // relay may use a different password than the mailbox it delivers for. Both
  // default to the single-account pair so nothing changes for existing setups.
  const authUser = (acc.authUser ?? common.authUser ?? '').trim() || user
  const authPassword = (acc.authPassword ?? common.authPassword) || password
  const senderName = (acc.senderName ?? common.senderName ?? '').trim()
  const merged = mergeAccountDefaults(common, acc)
  const accountImap = merged.imap && normalizeSettingsEndpoint(merged.imap, 'imap')
  const accountSmtp = merged.smtp && normalizeSettingsEndpoint(merged.smtp, 'smtp')
  const imap = {
    host: accountImap?.host ?? preset?.imap.host,
    port: accountImap?.port ?? preset?.imap.port,
    secure: accountImap?.secure ?? preset?.imap.secure,
    connectionTimeoutMs: accountImap?.connectionTimeoutMs,
    socketTimeoutMs: accountImap?.socketTimeoutMs,
  }
  const smtp = {
    host: accountSmtp?.host ?? preset?.smtp.host,
    port: accountSmtp?.port ?? preset?.smtp.port,
    secure: accountSmtp?.secure ?? preset?.smtp.secure,
  }
  const problems: string[] = []
  const receiveProtocol = acc.receiveProtocol ?? common.receiveProtocol ?? 'imap'
  if (!['imap', 'pop3'].includes(receiveProtocol)) problems.push(T('receiveProtocol 只能是 imap 或 pop3', 'receiveProtocol must be imap or pop3'))
  const pop3 = { host: merged.pop3?.host?.trim() || POP3_PRESETS[requested ?? ''] || '',
    port: merged.pop3?.port ?? 995, secure: merged.pop3?.secure ?? true,
    connectionTimeoutMs: merged.pop3?.connectionTimeoutMs, socketTimeoutMs: merged.pop3?.socketTimeoutMs }
  if (user === '') problems.push(T(`账号 "${name}" 的邮箱地址未填写`, `Account "${name}" has no mailbox address`))
  // An explicit `authKind` outranks the derivation: a tenant that still accepts
  // an app password for Exchange Online, or a mailbox that worked before the
  // derivation existed, keeps working instead of being told「尚未登录」.
  const forcedAuthKind = String(acc.authKind ?? common.authKind ?? '').trim().toLowerCase()
  if (forcedAuthKind !== '' && forcedAuthKind !== 'oauth2' && forcedAuthKind !== 'password') {
    problems.push(T(`账号 "${name}" 的 authKind 只能是 oauth2 或 password，当前是 "${forcedAuthKind}"`, `Account "${name}" authKind must be oauth2 or password, got "${forcedAuthKind}"`))
  }
  const oauth2 = forcedAuthKind === 'password'
    ? false
    : forcedAuthKind === 'oauth2' || isOAuth2Account(requested, imap.host)
  // An OAuth2 account has no password on purpose: its credential is the token
  // in the OAuth2 store, and requiring a password would demand a secret
  // Microsoft no longer accepts for Exchange Online.
  if (!oauth2 && authPassword === '') {
    problems.push(T(`账号 "${name}" 的${authUser === user ? '授权码 / 应用专用密码' : '登录账号的密码'}未填写`, `Account "${name}" has no ${authUser === user ? 'app password' : 'login password'}`))
  }
  if (receiveProtocol === 'pop3') {
    if (!pop3.host || /[\s\0]/.test(pop3.host)) problems.push(T('POP3 主机未填写或无效，请使用服务商提供的 POP3 主机', 'POP3 host is missing or invalid; use the POP3 host from your provider'))
    if (!Number.isInteger(pop3.port) || pop3.port < 1 || pop3.port > 65535) problems.push(T('POP3 端口必须在 1-65535 之间', 'POP3 port must be between 1 and 65535'))
    if (typeof pop3.secure !== 'boolean') problems.push(T('POP3 secure 必须为布尔值', 'POP3 secure must be a boolean'))
    if (oauth2) problems.push(T('POP3 暂支持授权码 / 应用密码；OAuth2 账号请继续使用 IMAP', 'POP3 only supports app passwords; an OAuth2 account has to keep using IMAP'))
    if (/[\r\n\0]/.test(authUser + authPassword)) problems.push(T('POP3 登录凭据不能包含换行或空字符', 'POP3 credentials must not contain line breaks or null characters'))
    if ((acc.inboxFolder ?? common.inboxFolder ?? 'INBOX').trim() !== 'INBOX') problems.push(T('POP3 只提供 INBOX 收件箱，不支持自定义文件夹', 'POP3 only exposes the INBOX; custom folders are not supported'))
  } else if (imap.host === undefined || imap.host === '') problems.push(T(`账号 "${name}" 的 imap.host 未填写（可填 provider 预设：${known.join(', ')}）`, `Account "${name}" has no imap.host (provider presets: ${known.join(', ')})`))
  if (receiveProtocol !== 'pop3' && (smtp.host === undefined || smtp.host === '')) problems.push(T(`账号 "${name}" 的 smtp.host 未填写（同上）`, `Account "${name}" has no smtp.host (same as above)`))
  // A proxy typo should read as a settings error here, not as an opaque connect
  // failure minutes later when the account is first used.
  const proxyValue = String(acc.proxy ?? common.proxy ?? '').trim()
  if (proxyValue !== '') {
    try {
      parseProxyUrl(proxyValue)
    } catch (error) {
      problems.push(T(`账号 "${name}" 的代理地址无效：${error instanceof Error ? error.message : String(error)}`, `Account "${name}" has an invalid proxy address: ${error instanceof Error ? error.message : String(error)}`))
    }
  }
  if (problems.length > 0) {
    throw new Error(T(`邮件账号配置不完整：${problems.join('；')}。请在「设置 → 邮件」补全对应账号，再点击「测试连接」。修改会自动保存并立即生效。`, `Mailbox account configuration is incomplete: ${problems.join('; ')}. Fill in the account under Settings → Email, then use Test connection. Changes save automatically and take effect immediately.`))
  }
  const clientId = (acc.clientId ?? common.clientId ?? '').trim()
  const oauthProvider = acc.oauthProvider ?? common.oauthProvider ?? (requested === 'gmail' || imap.host?.toLowerCase() === 'imap.gmail.com' ? 'google' : 'microsoft')
  if (!['google','microsoft'].includes(oauthProvider)) throw new Error(T('oauthProvider 只能是 google 或 microsoft', 'oauthProvider must be google or microsoft'))
  // Application secrets belong to one registration; a different account-level
  // client ID must not silently inherit the shared registration's secret.
  const clientSecret = acc.clientSecret ?? (acc.clientId && acc.clientId.trim() !== (common.clientId ?? '').trim() ? '' : common.clientSecret ?? '')
  return {
    ...(receiveProtocol === 'pop3' ? { transport: 'pop3' as const, pop3 } : {}),
    user,
    senderName,
    // OAuth2 logs in with the token's own account, so the alias login pair only
    // exists for password accounts; and an OAuth2 account never carries a
    // password at all — a stale one left in the YAML from before the provider
    // changed must not travel into the pool.
    authUser: oauth2 ? user : authUser,
    authPassword: oauth2 ? '' : authPassword,
    password: oauth2 ? '' : password,
    authKind: oauth2 ? 'oauth2' : 'password',
    ...(clientId !== '' ? { clientId } : {}),
    ...(oauth2 ? { oauthProvider, ...(clientSecret ? { clientSecret } : {}) } : {}),
    ...(proxyValue !== '' ? { proxy: proxyValue } : {}),
    imap: { ...imap, host: imap.host!, port: imap.port!, secure: imap.secure! },
    smtp: { ...smtp, host: smtp.host ?? '', port: smtp.port ?? 465, secure: smtp.secure ?? true },
    inboxFolder: (acc.inboxFolder ?? common.inboxFolder ?? '').trim() || 'INBOX',
    ...(acc.replyLocale ?? common.replyLocale ? { replyLocale: (acc.replyLocale ?? common.replyLocale)!.trim() } : {}),
    ...(acc.replyTimeZone ?? common.replyTimeZone ? { replyTimeZone: (acc.replyTimeZone ?? common.replyTimeZone)!.trim() } : {}),
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
