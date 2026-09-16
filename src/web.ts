import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isMap, parseDocument, type Document, type YAMLMap } from 'yaml'
import { SETTINGS_NAMESPACE, toEmailConfig, validateSettingsValue, type EmailSettingsValue } from './settings.js'
import {
  parseAccountsYaml,
  parseServerPresets,
  PROVIDER_PRESETS,
  resolveEmailSettings,
  serializeAccountsYaml,
  type EmailConfig,
  type ProviderPreset,
  type ServerPreset,
} from './config.js'
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

/** Credit shown with the bundled fallback artwork (community fan character). */
const FALLBACK_CREDIT = '鲸鱼娘：社区同人形象，版权归原作者，仅供个人非商业使用；如有异议请提 Issue 移除'

/**
 * One account as the settings page renders it: resolved connection parameters
 * plus whether a password exists. Passwords themselves never cross this
 * boundary — the card only needs to know if the field is filled.
 */
export interface AccountCardData {
  name: string
  /** undefined = 自定义服务器（无 provider 预设） */
  provider?: string
  user: string
  hasPassword: boolean
  imap: { host: string; port: number; secure: boolean }
  smtp: { host: string; port: number; secure: boolean }
  inboxFolder: string
  isDefault: boolean
}

interface WhaleAsset {
  file: string
  contentType: string
  /** true = 用户本地安装的 dsh-deep-whale 皮肤（CC BY-NC-SA 4.0，需署名）；false = 内置回退图 */
  skin: boolean
  credit: string
}

/** Endpoint defaults for a card whose account (and preset) names no host yet. */
const IMAP_FALLBACK = { host: '', port: 993, secure: true }
const SMTP_FALLBACK = { host: '', port: 465, secure: true }

interface Endpoint {
  host: string
  port: number
  secure: boolean
}

/** One account card as the editor sends it back; every field is optional. */
export interface AccountCardInput {
  name?: string
  provider?: string
  user?: string
  /**
   * 授权码，三态契约：undefined = 本卡片没提供（保留 YAML 里已存的 password 键），
   * '' = 明确清除（用户在 UI 里清空了密码框），非空 = 写入（数字/布尔先转字符串）。
   * 卡片永远拿不到明文（snapshot 只给 hasPassword），所以「没提供」绝不能当成
   * 「删除」：那会让每一次无关的卡片保存都静默清掉用户已存的授权码。
   */
  password?: string | number | boolean
  inboxFolder?: string
  imap?: { host?: string; port?: number; secure?: boolean }
  smtp?: { host?: string; port?: number; secure?: boolean }
}

/**
 * One endpoint for the card, resolved exactly like resolveAccount(): the
 * account's own fields win, the provider preset fills the gaps, and a
 * placeholder closes whatever is still missing. Empty is a legitimate value —
 * the card is the draft, not a validated config.
 */
function endpointOf(
  raw: unknown,
  preset: ProviderPreset['imap'] | ServerPreset['imap'] | undefined,
  fallback: Endpoint,
): Endpoint {
  const value = raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
  const host = typeof value.host === 'string' && value.host !== ''
    ? value.host
    : (typeof preset?.host === 'string' ? preset.host : fallback.host)
  const port = typeof value.port === 'number' && Number.isFinite(value.port)
    ? value.port
    : (typeof preset?.port === 'number' ? preset.port : fallback.port)
  const secure = typeof value.secure === 'boolean'
    ? value.secure
    : (typeof preset?.secure === 'boolean' ? preset.secure : fallback.secure)
  return { host, port, secure }
}

/**
 * Build the account cards for an accounts mapping. Parse-only by contract: a
 * half-filled account is exactly what the user is typing, so it must still
 * render as a card. Nothing here resolves, validates or touches the network —
 * an unknown provider degrades that one card's endpoints, never the list.
 */
function buildAccountCards(
  raw: Record<string, unknown>,
  defaultAccount: string | undefined,
  presets: Record<string, ServerPreset>,
): AccountCardData[] {
  const list: AccountCardData[] = []
  for (const [name, value] of Object.entries(raw)) {
    const account = value !== null && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {}
    const providerName = typeof account.provider === 'string' && account.provider !== '' ? account.provider : undefined
    const builtin = providerName === undefined ? undefined : PROVIDER_PRESETS[providerName]
    const custom = providerName === undefined ? undefined : presets[providerName]
    list.push({
      name,
      provider: providerName,
      user: typeof account.user === 'string' ? account.user : '',
      hasPassword: typeof account.password === 'string' && account.password !== '',
      imap: endpointOf(account.imap, builtin?.imap ?? custom?.imap, IMAP_FALLBACK),
      smtp: endpointOf(account.smtp, builtin?.smtp ?? custom?.smtp, SMTP_FALLBACK),
      inboxFolder: typeof account.inboxFolder === 'string' && account.inboxFolder !== '' ? account.inboxFolder : 'INBOX',
      isDefault: name === defaultAccount,
    })
  }
  return list
}

/** The 8 built-in presets plus whatever the user defined in serverPresets. */
function presetsSnapshot(serverPresets: string | undefined) {
  const builtin: Record<string, ProviderPreset> = {}
  for (const [name, preset] of Object.entries(PROVIDER_PRESETS)) {
    builtin[name] = { imap: { ...preset.imap }, smtp: { ...preset.smtp } }
  }
  try {
    return { builtin, custom: parseServerPresets(serverPresets ?? '') as Record<string, ServerPreset> }
  } catch (error) {
    // A broken preset list degrades to "no custom presets" and reports why:
    // the account cards must keep rendering so the user can fix the YAML.
    return { builtin, custom: {} as Record<string, ServerPreset>, error: messageOf(error, 'serverPresets 解析失败') }
  }
}

/**
 * Decide which account is the default, mirroring resolveEmailSettings' order
 * (explicit default, then a lone account, then the YAML's own defaultAccount,
 * then an account literally named "default"). Returns the overall error for a
 * mapping that cannot be adjudicated at all.
 */
function adjudicateAccounts(
  raw: Record<string, unknown>,
  yamlDefault: string | undefined,
  rowDefault: string | undefined,
): { defaultAccount?: string; error?: string } {
  const names = Object.keys(raw)
  if (names.length === 0) {
    // No accounts in the YAML: nothing to adjudicate, but a row-level default
    // is still worth reporting.
    const row = (rowDefault ?? '').trim()
    return row === '' ? {} : { defaultAccount: row }
  }
  const explicit = (rowDefault ?? '').trim()
  if (explicit !== '') {
    if (!names.includes(explicit)) {
      return { error: `defaultAccount "${explicit}" 不存在，可用账号：${names.join('、')}` }
    }
    return { defaultAccount: explicit }
  }
  if (names.length === 1) return { defaultAccount: names[0] }
  if (yamlDefault !== undefined && names.includes(yamlDefault)) return { defaultAccount: yamlDefault }
  if (names.includes('default')) return { defaultAccount: 'default' }
  return { error: `配置了多个账号（${names.join('、')}），请设置 defaultAccount 指定默认账号` }
}

/**
 * True for a document that carries no mapping at all: blank text, or nothing
 * but comments. parseAccountsYaml rejects both, but for the editor "empty" is
 * a legitimate state ("no accounts yet"), not a syntax error.
 */
function isBlankAccountsText(text: string): boolean {
  return text.split('\n').every(line => {
    const trimmed = line.trim()
    return trimmed === '' || trimmed.startsWith('#')
  })
}

interface AccountsDraft {
  raw: Record<string, unknown>
  defaultAccount?: string
  error?: string
  list: AccountCardData[]
}

/**
 * Parse accountsYaml text into cards. Never throws: the editor calls this on
 * every keystroke, so a half-typed document is the normal case and comes back
 * as an error field rather than as an HTTP failure.
 */
function readAccountsDraft(
  text: string,
  presets: Record<string, ServerPreset>,
  rowDefault?: string,
): AccountsDraft {
  if (isBlankAccountsText(text)) {
    const { defaultAccount, error } = adjudicateAccounts({}, undefined, rowDefault)
    return { raw: {}, ...(defaultAccount !== undefined ? { defaultAccount } : {}), list: [], ...(error !== undefined ? { error } : {}) }
  }
  let raw: Record<string, unknown> = {}
  let yamlDefault: string | undefined
  try {
    const parsed = parseAccountsYaml(text)
    raw = parsed.map as unknown as Record<string, unknown>
    yamlDefault = parsed.defaultAccount
  } catch (caught) {
    // No mapping could be read: report it and hand back an empty draft.
    return { raw: {}, list: [], error: messageOf(caught, 'accountsYaml 解析失败') }
  }
  const verdict = adjudicateAccounts(raw, yamlDefault, rowDefault)
  return {
    raw,
    ...(verdict.defaultAccount !== undefined ? { defaultAccount: verdict.defaultAccount } : {}),
    list: buildAccountCards(raw, verdict.defaultAccount, presets),
    ...(verdict.error !== undefined ? { error: verdict.error } : {}),
  }
}

/** The raw key a Pair is stored under (an unquoted `163:` parses as a number). */
function rawKeyOf(pair: { key: unknown }): unknown {
  const key = pair.key
  return key !== null && typeof key === 'object' && 'value' in key ? (key as { value: unknown }).value : key
}

/** A Pair's key as text, so lookups match `163:` and `"163":` alike. */
function keyTextOf(pair: { key: unknown }): string {
  return String(rawKeyOf(pair))
}

/**
 * Write one known account field: an empty or absent value deletes the key
 * instead of storing '' (a stored provider: '' resolves as 「provider "" 未知」).
 */
function writeField(node: YAMLMap, key: string, value: unknown): void {
  if (value === undefined || value === '') {
    node.delete(key)
    return
  }
  node.set(key, value)
}

/** A scalar/sequence value cannot carry account fields; swap in a map. */
function ensureMap(doc: Document, node: YAMLMap, key: unknown): YAMLMap {
  const existing = node.get(key, true)
  if (isMap(existing)) return existing
  const fresh = doc.createNode({}) as unknown as YAMLMap
  // Set under the *stored* key, not its text form: `163:` parses as the number
  // 163, and set('163', …) would add a second, quoted key beside it.
  node.set(key, fresh)
  return fresh
}

function writeEndpoint(doc: Document, account: YAMLMap, key: 'imap' | 'smtp', endpoint: unknown): void {
  if (endpoint === undefined) return
  const raw = endpoint !== null && typeof endpoint === 'object' && !Array.isArray(endpoint)
    ? endpoint as Record<string, unknown>
    : {}
  // Only the three known keys are touched, so an advanced key the card does
  // not model (socketTimeoutMs, connectionTimeoutMs) survives in place.
  const target = ensureMap(doc, account, key)
  writeField(target, 'host', typeof raw.host === 'string' ? raw.host : undefined)
  writeField(target, 'port', typeof raw.port === 'number' && Number.isFinite(raw.port) ? raw.port : undefined)
  writeField(target, 'secure', typeof raw.secure === 'boolean' ? raw.secure : undefined)
}

/**
 * The `provider` value that may be written back to accountsYaml: a built-in
 * preset name, or nothing at all.
 *
 * A custom `serverPresets` entry is an *endpoint expansion*, not a provider
 * reference. resolveAccount() only ever consults PROVIDER_PRESETS, so persisting
 * the custom name makes resolution throw 「账号 "work" 的 provider "corp" 未知」
 * the moment the draft is saved — the card already carries the expanded
 * endpoints, so "no provider key + explicit endpoints" is the canonical form for
 * a custom preset. Any other unknown name is dropped for exactly the same
 * reason, as is '' (which writeField/delete already treats as "no key").
 *
 * hasOwnProperty, not a plain lookup: `constructor`/`toString` must not be
 * mistaken for preset names through the prototype chain.
 */
function persistedProvider(provider: unknown): string | undefined {
  return typeof provider === 'string' && Object.prototype.hasOwnProperty.call(PROVIDER_PRESETS, provider)
    ? provider
    : undefined
}

/**
 * Mirror of config.ts' normalizeAccountForYaml for the card shape: provider ''
 * disappears (writing it back resolves as 「provider "" 未知」) and a numeric
 * password becomes a string (YAML would otherwise read back a number).
 *
 * `inheritedPassword` is the value stored in the source YAML for this account.
 * It is used only when the card carries no password at all — see the three-state
 * contract on AccountCardInput: the card omits the field whenever the editor has
 * nothing to say about it, which must leave the stored secret untouched.
 */
function normalizeCardForYaml(card: AccountCardInput, inheritedPassword?: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const provider = persistedProvider(card.provider)
  if (provider !== undefined) out.provider = provider
  if (card.user !== undefined) out.user = card.user
  if (card.password === undefined) {
    // 未提供 = 保持原样，且原样包括「原来是什么类型」：数字密码原样留下数字。
    if (inheritedPassword !== undefined) out.password = inheritedPassword
  } else if (card.password === '') {
    // '' = 明确清除：不写 password 键。
  } else {
    out.password = typeof card.password === 'number' || typeof card.password === 'boolean'
      ? String(card.password)
      : card.password
  }
  if (card.inboxFolder !== undefined) out.inboxFolder = card.inboxFolder
  if (card.imap !== undefined) out.imap = { ...card.imap }
  if (card.smtp !== undefined) out.smtp = { ...card.smtp }
  return out
}

/** The `password` stored in the source YAML for one account, if the key is there. */
function storedPasswordOf(raw: Record<string, unknown>, name: string): { present: boolean; value: unknown } {
  const account = raw[name]
  if (account === null || typeof account !== 'object' || Array.isArray(account)) return { present: false, value: undefined }
  if (!Object.prototype.hasOwnProperty.call(account, 'password')) return { present: false, value: undefined }
  return { present: true, value: (account as Record<string, unknown>).password }
}

/**
 * Fallback writer: loses comments but keeps the semantics the cards describe.
 *
 * `source` is the draft being replaced, re-read only to recover passwords the
 * cards do not carry — a card never holds a plaintext password, so without this
 * every degraded save would silently drop the stored secrets. The read is
 * best-effort by nature: this path is reached precisely when the document could
 * not be edited in place, and an unparseable document cannot lend its passwords
 * back. When that happens and a card has nothing to say about its password, the
 * secret is gone and `passwordsDropped` says so.
 */
function fallbackSerialize(
  cards: AccountCardInput[],
  defaultAccount: string,
  source: string,
): { accountsYaml: string; passwordsDropped?: boolean } {
  let stored: Record<string, unknown> | undefined
  try {
    stored = parseAccountsYaml(source).map as unknown as Record<string, unknown>
  } catch {
    stored = undefined
  }
  let passwordsDropped = false
  const raw: Record<string, unknown> = {}
  for (const card of cards) {
    const name = card.name as string
    let inherited: unknown
    if (stored === undefined) {
      // Nothing could be read back: a silent card may be losing a real secret.
      if (card.password === undefined) passwordsDropped = true
    } else {
      const { present, value } = storedPasswordOf(stored, name)
      if (present) inherited = value
    }
    raw[name] = normalizeCardForYaml(card, inherited)
  }
  return {
    accountsYaml: serializeAccountsYaml(raw, defaultAccount),
    ...(passwordsDropped ? { passwordsDropped: true } : {}),
  }
}

/**
 * Rewrite the accountsYaml draft from the card list.
 *
 * The card list is the complete desired set: an account key the cards do not
 * name is removed, a name the document does not have is created, and a renamed
 * card therefore deletes the old key and adds the new one. Editing happens on
 * the parsed Document so comments survive and unknown keys (socketTimeoutMs,
 * …) stay exactly where they were.
 */
function serializeAccountsDraft(
  source: string,
  cards: AccountCardInput[],
  defaultAccount: string,
): { accountsYaml: string; commentsDropped?: boolean; passwordsDropped?: boolean } {
  const doc = parseDocument(source)
  // parseDocument never throws — a broken document surfaces as doc.errors, and
  // String(doc) then refuses to run at all. Degrade to the stringify path.
  if (doc.errors.length > 0) return { ...fallbackSerialize(cards, defaultAccount, source), commentsDropped: true }
  let root: YAMLMap
  if (doc.contents === null) {
    root = doc.createNode({}) as unknown as YAMLMap
    doc.contents = root as any
  } else if (isMap(doc.contents)) {
    root = doc.contents as YAMLMap
  } else {
    // A sequence or scalar document cannot carry accounts at all.
    return { ...fallbackSerialize(cards, defaultAccount, source), commentsDropped: true }
  }

  const desired = new Set(cards.map(card => card.name as string))
  const seen = new Set<string>()
  for (const pair of [...root.items]) {
    const name = keyTextOf(pair)
    if (name === 'defaultAccount') continue
    // Remove accounts the cards dropped, and collapse a duplicate spelling
    // (`163:` and `"163":`) onto a single key.
    if (!desired.has(name) || seen.has(name)) {
      root.delete(rawKeyOf(pair))
      continue
    }
    seen.add(name)
  }

  for (const card of cards) {
    const name = card.name as string
    const pair = root.items.find(item => keyTextOf(item) === name)
    let account: YAMLMap
    if (pair === undefined) {
      account = doc.createNode({}) as unknown as YAMLMap
      root.set(name, account)
    } else {
      // Reuse the stored key node (163 vs "163") so the name keeps its spelling.
      account = ensureMap(doc, root, rawKeyOf(pair))
    }
    // Only a built-in preset name may be persisted; a custom preset (or any
    // unknown name the user typed) is an endpoint expansion, so the key is
    // deleted and the expanded imap/smtp below carry the connection instead.
    writeField(account, 'provider', persistedProvider(card.provider))
    writeField(account, 'user', card.user)
    // Password is three-state, unlike every other field: the card is never given
    // the plaintext (snapshot exposes hasPassword only), so an omitted password
    // means "the editor has nothing to say" and the stored key must survive
    // untouched — value, position and comment. Only an explicit '' clears it.
    if (card.password === undefined) {
      // 未提供 = 保持原样：什么都不写。
    } else if (card.password === '') {
      account.delete('password')
    } else {
      // Same coercion as normalizeAccountForYaml: a numeric password must be
      // written as a string, or YAML reads it back as a number.
      account.set('password', typeof card.password === 'number' || typeof card.password === 'boolean'
        ? String(card.password)
        : card.password)
    }
    writeField(account, 'inboxFolder', card.inboxFolder)
    writeEndpoint(doc, account, 'imap', card.imap)
    writeEndpoint(doc, account, 'smtp', card.smtp)
  }

  if (defaultAccount !== '') root.set('defaultAccount', defaultAccount)
  else root.delete('defaultAccount')

  // No accounts left: '' (never '{}'). resolveEmailSettings decides "is the
  // YAML authoritative" with .trim(), so an empty mapping must stay empty.
  const accountKeys = root.items.filter(pair => keyTextOf(pair) !== 'defaultAccount').length
  if (accountKeys === 0) return { accountsYaml: '' }
  return { accountsYaml: String(doc) }
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
 * Locate the whale-girl artwork at runtime. Skin art is never bundled: it is
 * CC BY-NC-SA 4.0, so dsh-email only serves it from the user's own installed
 * dsh-deep-whale skin package (with the attribution chain shown in the
 * widget). Without the skin, a bundled community whale-girl artwork is
 * served with its own credit line (copyright stays with the original author;
 * personal non-commercial use, removed on request via issue).
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
    whaleCache = { file: fallback, contentType: 'image/png', skin: false, credit: FALLBACK_CREDIT }
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
    const presets = presetsSnapshot(value.serverPresets)
    // The cards describe the *effective* accountsYaml — the same text the
    // advanced editor shows, and the same source the accounts field reads.
    const effective = this.effectiveStored()
    const draft = readAccountsDraft(effective.accountsYaml ?? '', presets.custom, effective.defaultAccount)
    return {
      settings: {
        value,
        revision: descriptor?.revision ?? 0,
        applies: descriptor?.applies ?? 'live',
      },
      writable: this.ctx.settings.writable !== false,
      accounts: [...(this.effectiveAccounts().keys())],
      accountsDetail: {
        raw: draft.raw,
        ...(draft.defaultAccount !== undefined ? { defaultAccount: draft.defaultAccount } : {}),
        list: draft.list,
        ...(draft.error !== undefined ? { error: draft.error } : {}),
      },
      presets,
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

  /**
   * Test one account (by name, defaulting to the draft's default account) over
   * a live IMAP login. Returns the endpoint it dialled so the panel can show
   * what was actually tried — including on failure.
   */
  async test(value: EmailSettingsValue, accountName?: string) {
    validateSettingsValue(value)
    // null projects the complete draft: test the form as the user typed it.
    const settings = resolveEmailSettings({ ...this.rowConfig, ...toEmailConfig(value, null) })
    const requested = typeof accountName === 'string' && accountName.trim() !== '' ? accountName.trim() : ''
    const available = [...settings.accounts.keys()]
    const name = requested !== '' ? requested : settings.defaultAccount
    const cfg = settings.accounts.get(name)
    if (cfg === undefined) {
      throw new Error(`未知账号 "${name}"，可用：${available.join('、')}`)
    }
    const target = { account: name, imapHost: cfg.imap.host, imapPort: cfg.imap.port }
    const pool = new EmailPool(settings)
    try {
      const started = Date.now()
      await pool.withImap(name, null, async () => 'connected')
      return { ok: true, ms: Date.now() - started, ...target }
    } catch (error) {
      // imapflow reports failed LOGIN as a bare "Command failed"; surface an
      // actionable hint instead of the opaque message.
      const raw = messageOf(error, 'unknown error')
      const lower = raw.toLowerCase()
      if (lower.includes('command failed') || lower.includes('authentication') || lower.includes('login')) {
        throw new Error('邮箱登录失败：请检查邮箱地址与授权码（' + raw + '）')
      }
      throw error
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
        this.responseJson(res, 200, { ok: true, value: await this.test(body.value, body.account) })
      } else if (body?.action === 'watch') {
        if (typeof this.watchImpl !== 'function') throw new Error('email_watch 未就绪')
        const account = typeof body.account === 'string' ? body.account : ''
        const folder = typeof body.folder === 'string' ? body.folder : ''
        const limit = Number.isSafeInteger(body.limit) ? (body.limit as number) : 5
        this.responseJson(res, 200, { ok: true, value: await this.watchImpl(account, folder, limit, 'web') })
      } else if (body?.action === 'parseAccounts') {
        // Pure and always 200: the editor calls this on every keystroke, so a
        // half-typed document is the normal case, not an HTTP failure.
        const text = typeof body.value?.accountsYaml === 'string' ? body.value.accountsYaml : ''
        const presets = presetsSnapshot((this.scope.get() as EmailSettingsValue).serverPresets).custom
        const draft = readAccountsDraft(text, presets, this.rowConfig.defaultAccount)
        this.responseJson(res, 200, {
          ok: true,
          value: {
            ok: draft.error === undefined,
            ...(draft.error !== undefined ? { error: draft.error } : {}),
            raw: draft.raw,
            ...(draft.defaultAccount !== undefined ? { defaultAccount: draft.defaultAccount } : {}),
            list: draft.list,
          },
        })
      } else if (body?.action === 'serializeAccounts') {
        if (!Array.isArray(body.accounts)) throw new Error('accounts 必须是数组')
        const cards: AccountCardInput[] = []
        for (const entry of body.accounts) {
          if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('accounts 的每一项都必须是对象')
          const name = typeof entry.name === 'string' ? entry.name.trim() : ''
          if (name === '') throw new Error('accounts 的每一项都需要非空的 name')
          if (name === 'defaultAccount') throw new Error('账号名不能是 defaultAccount（该键保留给默认账号）')
          cards.push({ ...entry, name })
        }
        const source = typeof body.accountsYaml === 'string' ? body.accountsYaml : ''
        const chosen = typeof body.defaultAccount === 'string' ? body.defaultAccount.trim() : ''
        const written = serializeAccountsDraft(source, cards, chosen)
        this.responseJson(res, 200, {
          ok: true,
          value: {
            accountsYaml: written.accountsYaml,
            ...(written.commentsDropped === true ? { commentsDropped: true } : {}),
            // A card that says nothing about its password keeps the stored one;
            // this flag is the honest signal that it could not be kept because
            // the source document itself was unreadable.
            ...(written.passwordsDropped === true ? { passwordsDropped: true } : {}),
          },
        })
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
      // No credit header: HTTP header values must be latin-1, and the widget
      // already shows the credit from the snapshot JSON.
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