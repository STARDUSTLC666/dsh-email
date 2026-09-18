import { ImapFlow } from 'imapflow'
import nodemailer, { type Transporter } from 'nodemailer'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import type { AuthKind, ResolvedEmailConfig, ResolvedEmailSettings } from './config.js'
import { getFreshAccessToken, OAuth2Error } from './oauth2.js'
import { flattenAddresses, parseRawMessage, sanitizeFilename, stripHtml, truncateText } from './parse.js'
import type {
  AddressEntry,
  EmailAttachmentMeta,
  EmailAttachmentResult,
  EmailFolderRow,
  EmailFoldersResult,
  EmailListResult,
  EmailMarkAction,
  EmailMarkResult,
  EmailReadResult,
  EmailReplyMode,
  EmailReplyResult,
  EmailSearchResult,
  EmailSendResult,
  ListedMessage,
} from './types.js'

export class MailError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MailError'
  }
}

export function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message !== '' ? error.message : fallback
}

/**
 * Replace anything credential-shaped in a server's own error text before it
 * reaches a user.
 *
 * IMAP and SMTP servers routinely quote back the authentication string they
 * rejected. For XOAUTH2 that string is `user=…\x01auth=Bearer <token>\x01\x01`,
 * usually base64'd — so the raw message carries a live access token, and these
 * messages are rendered in the settings panel, returned by the mail tools, and
 * pasted into bug reports.
 *
 * Two shapes are masked: a JWT (three base64url segments, which is what every
 * OAuth2 access token looks like) and a long base64 run (the quoted XOAUTH2
 * blob). The replacement keeps the length so a report still says how big the
 * thing was, without saying what it was.
 */
export function redactCredentials(text: string): string {
  return text
    .replace(/[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{8,}/g, match => `<已隐去 ${match.length} 字符的令牌>`)
    .replace(/[A-Za-z0-9+/]{40,}={0,2}/g, match => `<已隐去 ${match.length} 字符的凭据>`)
}

/** The IMAP auth shape imapflow accepts: a password, or an OAuth2 access token. */
export interface ImapAuth {
  user: string
  pass?: string
  accessToken?: string
}

/**
 * The SMTP auth shape nodemailer accepts. `type` is the literal union
 * nodemailer's typings model, not a loose string: anything wider makes the
 * whole transport options object fail to match and silently degrades the type.
 */
export type SmtpAuth =
  | { user: string; pass: string }
  | { type: 'OAuth2'; user: string; accessToken: string }

/**
 * The IMAP `auth` block for one account. Pure so the shape the library
 * receives is testable without a socket: an OAuth2 account authenticates with
 * `accessToken` (imapflow then runs AUTHENTICATE XOAUTH2) and a password
 * account with `pass`, exactly as before.
 */
export function imapAuthOf(cfg: Pick<ResolvedEmailConfig, 'authUser' | 'authPassword' | 'authKind'>, accessToken?: string): ImapAuth {
  return cfg.authKind === 'oauth2'
    ? { user: cfg.authUser, accessToken: accessToken ?? '' }
    : { user: cfg.authUser, pass: cfg.authPassword }
}

/**
 * Nodemailer consumes an OAuth2 token through accessToken, not pass.
 * Refresh remains owned by this plugin; no refresh credentials leave here.
 */
export function smtpAuthOf(cfg: Pick<ResolvedEmailConfig, 'authUser' | 'authPassword' | 'authKind'>, accessToken?: string): SmtpAuth {
  return cfg.authKind === 'oauth2'
    ? { type: 'OAuth2', user: cfg.authUser, accessToken: accessToken ?? '' }
    : { user: cfg.authUser, pass: cfg.authPassword }
}

/** The message an OAuth2 account gets when the mailbox has to be logged into again. */
export const OAUTH2_RELOGIN_MESSAGE = '邮箱登录失败：请到设置页重新登录（Microsoft 账号使用设备码登录，不使用授权码）'

/**
 * True for the errors both libraries report when the server rejects the
 * credentials. An expired access token is indistinguishable from a wrong
 * password at this level, so the connection retries once with a forced refresh
 * before it believes the token is really dead.
 */
export function looksLikeAuthFailure(error: unknown): boolean {
  const raw = messageOf(error, '').toLowerCase()
  if (raw === '') return false
  return raw.includes('authentication')
    || raw.includes('authenticate')
    || raw.includes('auth failed')
    || raw.includes('login')
    || raw.includes('command failed')
    || raw.includes('invalid credentials')
    || raw.includes('xoauth2')
}

/** True when any bodyStructure node declares an attachment disposition. */
function structureHasAttachment(node: any): boolean {
  if (node === null || node === undefined || typeof node !== 'object') return false
  if (node.disposition === 'attachment') return true
  const children = Array.isArray(node.childNodes) ? node.childNodes : []
  return children.some(structureHasAttachment)
}

interface AttachmentPart {
  part: string
  filename: string
  contentType: string
  size: number
}

/** Walk a bodyStructure tree collecting attachment parts (DFS, same order as mailparser). */
function collectAttachmentParts(node: any, out: AttachmentPart[] = []): AttachmentPart[] {
  if (node === null || node === undefined || typeof node !== 'object') return out
  const isEmbedded = typeof node.type === 'string' && node.type.startsWith('message/rfc822')
  if (node.part !== undefined && (node.disposition === 'attachment' || (isEmbedded && node.disposition !== 'inline'))) {
    const filename = node.dispositionParameters?.filename ?? node.parameters?.name ?? 'part-' + node.part
    out.push({
      part: String(node.part),
      filename: String(filename),
      contentType: typeof node.type === 'string' ? node.type : 'application/octet-stream',
      size: typeof node.size === 'number' ? node.size : 0,
    })
  }
  const children = Array.isArray(node.childNodes) ? node.childNodes : []
  for (const child of children) collectAttachmentParts(child, out)
  return out
}

/**
 * Map the index in the mailparser attachment list (what email_read showed the
 * model) onto a bodyStructure part. Name first, then type + tolerant size;
 * an inline image that our walk excludes simply fails instead of downloading
 * the wrong part.
 */
export function selectAttachmentPart(
  readAttachments: EmailAttachmentMeta[],
  parts: AttachmentPart[],
  index: number,
): AttachmentPart | undefined {
  const meta = readAttachments[index]
  if (meta === undefined) return undefined
  const byName = parts.find(part => part.filename === meta.filename || sanitizeFilename(part.filename) === meta.filename)
  if (byName !== undefined) return byName
  const tolerance = Math.max(64, Math.ceil(meta.size * 0.5))
  const byTypeAndSize = parts.find(part =>
    part.contentType === meta.contentType && Math.abs(part.size - meta.size) <= tolerance)
  return byTypeAndSize
}

interface TextBodyPart {
  /** IMAP section id; a single-part message has no part number and uses "1". */
  key: string
  type: string
}

/**
 * Leaf text/* parts that can carry the message body, attachment parts excluded.
 * This is what email_read / the search fallback fetch instead of the whole
 * source: a 20 MiB attachment must not be downloaded just to read the text.
 */
function collectTextParts(node: any, out: TextBodyPart[] = []): TextBodyPart[] {
  if (node === null || node === undefined || typeof node !== 'object') return out
  // message/rfc822 整段是一封内嵌邮件（附件），它的正文分段不是本封的正文。
  if (typeof node.type === 'string' && node.type.toLowerCase().startsWith('message/rfc822')) return out
  const children = Array.isArray(node.childNodes) ? node.childNodes : []
  if (children.length === 0) {
    const type = typeof node.type === 'string' ? node.type.toLowerCase() : ''
    if (type.startsWith('text/') && node.disposition !== 'attachment') {
      out.push({ key: node.part === undefined || node.part === null ? '1' : String(node.part), type })
    }
    return out
  }
  for (const child of children) collectTextParts(child, out)
  return out
}

/** The body parts worth fetching: text/plain first, text/html as the fallback. */
function selectBodyParts(node: any): { plain?: TextBodyPart; html?: TextBodyPart } {
  const parts = collectTextParts(node)
  const plain = parts.find(part => part.type === 'text/plain')
  const html = parts.find(part => part.type === 'text/html')
  return {
    ...(plain !== undefined ? { plain } : {}),
    ...(html !== undefined ? { html } : {}),
  }
}

/** The From header: `user` is the visible address, `senderName` only labels it. */
function senderOf(cfg: Pick<ResolvedEmailConfig, 'user' | 'senderName'>): string | { name: string; address: string } {
  return cfg.senderName === '' ? cfg.user : { name: cfg.senderName, address: cfg.user }
}

/** Case-insensitive match of a query against subject/from/body text. */
export function messageMatchesQuery(subject: string, fromText: string, body: string, query: string): boolean {
  const q = query.toLowerCase()
  return subject.toLowerCase().includes(q)
    || fromText.toLowerCase().includes(q)
    || body.toLowerCase().includes(q)
}

export interface OriginalDigest {
  from: AddressEntry[]
  to: AddressEntry[]
  cc: AddressEntry[]
  subject: string
  date: string
  text: string
  /** Bare id without angle brackets, '' when absent. */
  messageId: string
  /** Space-joined bare ids from the References header, '' when absent. */
  references: string
}

export interface BuiltReply {
  to: string
  cc?: string
  subject: string
  text: string
  inReplyTo?: string
  references?: string
}

/** Pull Message-ID / References out of a raw RFC822 source (header section only). */
export function extractMessageIds(source: Buffer): { messageId: string; references: string } {
  const headerEnd = source.indexOf('\r\n\r\n')
  const head = source.slice(0, headerEnd === -1 ? Math.min(source.length, 32768) : headerEnd).toString('latin1')
  const idMatch = head.match(/^message-id:\s*<([^>]+)>/im)
  // References can fold across continuation lines; collect every <id> token up to the next header.
  const refBlock = head.match(/^references:((?:[^\r\n]|\r?\n[ \t])*)/im)
  const refs = refBlock === null ? [] : [...refBlock[1].matchAll(/<([^>]+)>/g)].map(m => m[1])
  return { messageId: idMatch === null ? '' : idMatch[1], references: refs.join(' ') }
}

function formatAddress(entry: AddressEntry): string {
  if (entry.address === undefined) return entry.name ?? ''
  return entry.name !== undefined && entry.name !== '' ? entry.name + ' <' + entry.address + '>' : entry.address
}

function dedupeAddresses(entries: AddressEntry[], exclude: string | readonly string[]): AddressEntry[] {
  const seen = new Set<string>()
  const excluded = new Set((Array.isArray(exclude) ? exclude : [exclude]).map(a => a.trim().toLowerCase()).filter(a => a !== ''))
  const out: AddressEntry[] = []
  for (const entry of entries) {
    const addr = (entry.address ?? '').toLowerCase()
    if (addr === '' || excluded.has(addr) || seen.has(addr)) continue
    seen.add(addr)
    out.push(entry)
  }
  return out
}

function stripReplyPrefix(subject: string, prefix: RegExp): string {
  return subject.replace(new RegExp('^(?:' + prefix.source + '\\s*)+', 'i'), '').trim()
}

const QUOTE_MAX_CHARS = 2000
const FORWARD_MAX_CHARS = 4000

/**
 * Compose the outgoing message for a reply/reply-all/forward. Pure so it can
 * be tested without a connection: recipients exclude the sending account,
 * subject prefixes never stack, the original text is quoted underneath.
 */
export function buildReplyMessage(original: OriginalDigest, mode: EmailReplyMode, selfAddress: string | readonly string[], text: string, forwardTo = ''): BuiltReply {
  const fromText = original.from.map(a => a.name ?? a.address).filter(Boolean).join(', ') || '(未知发件人)'
  const self = (Array.isArray(selfAddress) ? selfAddress : [selfAddress]).filter(a => a.trim() !== '')
  if (mode === 'forward') {
    const to = forwardTo.trim()
    if (to === '') throw new MailError('forward 模式需要 to 参数指定转发收件人')
    const fwdBody = original.text.length > FORWARD_MAX_CHARS
      ? original.text.slice(0, FORWARD_MAX_CHARS) + '\n…[原文过长，已截断]'
      : original.text
    const header = '---------- 转发的邮件 ----------\n发件人: ' + fromText
      + (original.date !== '' ? '\n时间: ' + original.date : '')
      + '\n主题: ' + (original.subject || '(无主题)')
      + (original.to.length > 0 ? '\n收件人: ' + original.to.map(a => a.address).filter(Boolean).join(', ') : '')
    return {
      to,
      subject: 'Fwd: ' + stripReplyPrefix(original.subject, /fwd:|fw:|re:/),
      text: text + '\n\n' + header + '\n\n' + fwdBody,
      ...(original.messageId !== '' ? { references: (original.references !== '' ? original.references + ' ' : '') + original.messageId } : {}),
    }
  }
  let recipients: AddressEntry[]
  if (mode === 'reply-all') {
    recipients = dedupeAddresses([...original.from, ...original.to, ...original.cc], self)
    if (recipients.length === 0) recipients = dedupeAddresses(original.from, '')
  } else {
    recipients = dedupeAddresses(original.from, '')
  }
  if (recipients.length === 0) {
    throw new MailError('原邮件没有可用的发件人地址，无法回复；可用 email_send 手动发送')
  }
  const quoteText = original.text.length > QUOTE_MAX_CHARS
    ? original.text.slice(0, QUOTE_MAX_CHARS) + '\n…[原文过长，已截断]'
    : original.text
  const quote = '在 ' + (original.date || '未知时间') + '，' + fromText + ' 写道：\n'
    + quoteText.split('\n').map(line => '> ' + line).join('\n')
  const built: BuiltReply = {
    to: recipients.map(formatAddress).join(', '),
    subject: 'Re: ' + stripReplyPrefix(original.subject, /re:/),
    text: text + '\n\n' + quote,
  }
  if (original.messageId !== '') {
    built.inReplyTo = original.messageId
    built.references = (original.references !== '' ? original.references + ' ' : '') + original.messageId
  }
  return built
}

function flattenAddressText(value: unknown): string {
  return flattenAddresses(value)
    .map(a => (a.name ?? '') + ' ' + (a.address ?? ''))
    .join(' ')
}

function toIso(date: Date | null | undefined): string {
  return date instanceof Date ? date.toISOString() : ''
}

function listedFrom(envelope: any, size: number | undefined, hasAttachments: boolean): ListedMessage {
  return {
    uid: envelope.uid as number,
    date: toIso(envelope.envelope?.date),
    from: flattenAddresses(envelope.envelope?.from),
    subject: envelope.envelope?.subject ?? '',
    seen: envelope.flags?.has('\\Seen') === true,
    flagged: envelope.flags?.has('\\Flagged') === true,
    size: size ?? 0,
    hasAttachments,
  }
}

interface ImapEntry {
  client: ImapFlow
  selected: string | null
  /** Access mode the selected mailbox was opened with. */
  selectedReadOnly: boolean
  lastUsed: number
  inUse: number
}

/** email_attachment reuses the MIME index email_read already parsed; keep a few. */
const READ_CACHE_MAX = 16
const READ_CACHE_TTL_MS = 10 * 60 * 1000

/** Folder names change rarely; a short TTL keeps email_folders off the wire. */
const FOLDER_CACHE_TTL_MS = 60 * 1000

interface CachedAttachmentIndex {
  attachments: Array<{ filename: string; contentType: string; size: number; part: string }>
  parts: AttachmentPart[]
  at: number
}

/**
 * One mailbox pool for the whole plugin: pooled IMAP connections per
 * account plus pooled SMTP transporters, with idle sweep and error eviction.
 */
export class EmailPool {
  private readonly imaps = new Map<string, ImapEntry>()
  private readonly smtps = new Map<string, Transporter>()
  private readonly queues = new Map<string, Promise<unknown>>()
  private idleTimer: NodeJS.Timeout | undefined

  constructor(private readonly settings: ResolvedEmailSettings) {}

  account(name: string): ResolvedEmailConfig {
    const cfg = this.settings.accounts.get(name)
    if (cfg === undefined) {
      throw new MailError('未知账号 "' + name + '"，可用：' + [...this.settings.accounts.keys()].join('、'))
    }
    return cfg
  }

  resolveName(name?: string): string {
    return name?.trim() || this.settings.defaultAccount
  }

  /** Serialize operations per account: one IMAP connection serves one op at a time. */
  private enqueue<T>(name: string, task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    const prev = this.queues.get(name) ?? Promise.resolve()
    const run = async (): Promise<T> => {
      signal?.throwIfAborted()
      return task()
    }
    const next = prev.then(run, run)
    this.queues.set(name, next.then(() => undefined, () => undefined))
    return next
  }

  private readonly readCache = new Map<string, CachedAttachmentIndex>()
  private readonly folderCache = new Map<string, { at: number; folders: EmailFolderRow[] }>()

  /** UIDVALIDITY 变了以后同一 uid 可能指向另一封邮件，缓存键必须带上它。 */
  private uidValidityOf(client: ImapFlow): number {
    const mailbox = client.mailbox
    return mailbox === false ? 0 : Number(mailbox.uidValidity ?? 0)
  }

  /** Remember a parsed attachment index so email_attachment can skip the refetch. */
  private rememberRead(account: string, folder: string, uidValidity: number, uid: number, parsed: Omit<CachedAttachmentIndex, 'at'>): void {
    const key = account + '\u0000' + folder + '\u0000' + uidValidity + '\u0000' + uid
    this.readCache.delete(key)
    this.readCache.set(key, { ...parsed, at: Date.now() })
    while (this.readCache.size > READ_CACHE_MAX) {
      const oldest = this.readCache.keys().next()
      if (oldest.done === true) break
      this.readCache.delete(oldest.value)
    }
  }

  /**
   * The attachment index for one message: the cached one when email_read already
   * produced it, otherwise a fresh parse of the full source plus its bodyStructure.
   */
  private async attachmentIndexOf(client: ImapFlow, account: string, folder: string, uid: number, signal?: AbortSignal): Promise<Omit<CachedAttachmentIndex, 'at'>> {
    const uidValidity = this.uidValidityOf(client)
    const cached = this.recallRead(account, folder, uidValidity, uid)
    if (cached !== undefined) return cached
    // 附件索引只需要 MIME 结构：bodyStructure 已经给出每个附件的 part/名称/大小，
    // 不必为了拿它先拉整封 source（第一次就下载附件的邮件也一样）。
    const message = await client.fetchOne(uid, { uid: true, bodyStructure: true }, { uid: true })
    if (message === false) {
      throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folder + '"）')
    }
    signal?.throwIfAborted()
    if (message.bodyStructure !== undefined) {
      const parts = collectAttachmentParts(message.bodyStructure)
      const attachments = parts.map(part => ({ filename: part.filename, contentType: part.contentType, size: part.size, part: part.part }))
      const parsed = { attachments, parts }
      this.rememberRead(account, folder, uidValidity, uid, parsed)
      return parsed
    }
    // 服务器没给 bodyStructure：退回整封解析，行为和以前一样。
    const full = message.source !== undefined
      ? message
      : await client.fetchOne(uid, { uid: true, source: true, bodyStructure: true }, { uid: true })
    if (full === false || full.source === undefined) {
      throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folder + '"）')
    }
    const body = await parseRawMessage(full.source, this.settings.maxBodyChars)
    signal?.throwIfAborted()
    const parsed = { attachments: body.attachments, parts: collectAttachmentParts(full.bodyStructure) }
    this.rememberRead(account, folder, uidValidity, uid, parsed)
    return parsed
  }

  private recallRead(account: string, folder: string, uidValidity: number, uid: number): CachedAttachmentIndex | undefined {
    const key = account + '\u0000' + folder + '\u0000' + uidValidity + '\u0000' + uid
    const hit = this.readCache.get(key)
    if (hit === undefined) return undefined
    if (Date.now() - hit.at > READ_CACHE_TTL_MS) {
      this.readCache.delete(key)
      return undefined
    }
    return hit
  }

  async withImap<T>(
    accountName: string | undefined,
    folder: string | null,
    run: (client: ImapFlow) => Promise<T>,
    readOnly = true,
    signal?: AbortSignal,
  ): Promise<T> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    return this.enqueue(name, () => this.imapRun(name, cfg, folder, readOnly, run, signal), signal)
  }

  private createImap(auth: ImapAuth, cfg: ResolvedEmailConfig): ImapFlow {
    const client = new ImapFlow({
      host: cfg.imap.host,
      port: cfg.imap.port,
      secure: cfg.imap.secure,
      auth,
      logger: false,
      connectionTimeout: cfg.imap.connectionTimeoutMs ?? 30000,
      greetingTimeout: 30000,
      socketTimeout: cfg.imap.socketTimeoutMs ?? 60000,
    })
    // ImapFlow emits 'error' on socket timeouts/drops; without a listener Node
    // escalates it to an uncaught exception and kills the whole DSH process
    // (issue #4). Swallow it here and reap the dead connection when idle —
    // in-flight calls fail through their own promise paths instead.
    client.on('error', () => {
      for (const [name, entry] of this.imaps) {
        if (entry.client === client && entry.inUse === 0) {
          void this.evictImap(name)
          return
        }
      }
    })
    return client
  }

  /**
   * Dial and authenticate one fresh IMAP connection.
   *
   * A password account connects once. An OAuth2 account connects with a fresh
   * access token and, when the server rejects it, refreshes once and tries
   * again: a token that expired between the freshness check and the dial is
   * indistinguishable from a wrong password at the socket, and guessing wrong
   * would send the user through a browser login for nothing.
   */
  private async connectImap(name: string, cfg: ResolvedEmailConfig, forceToken = false): Promise<ImapFlow> {
    const oauth2 = cfg.authKind === 'oauth2'
    const attempt = async (token: string | undefined): Promise<ImapFlow> => {
      const client = this.createImap(imapAuthOf(cfg, token), cfg)
      await client.connect()
      return client
    }
    let token: string | undefined
    if (oauth2) {
      try {
        token = await getFreshAccessToken(name, cfg, { force: forceToken })
      } catch (error) {
        throw this.oauth2ErrorOf(error)
      }
    }
    try {
      return await attempt(token)
    } catch (error) {
      if (!oauth2 || !looksLikeAuthFailure(error)) throw error
      try {
        token = await getFreshAccessToken(name, cfg, { force: true })
      } catch (refreshError) {
        throw this.oauth2ErrorOf(refreshError)
      }
      return await attempt(token)
    }
  }

  /** The token store's own errors are already actionable; never dress them as IMAP failures. */
  private oauth2ErrorOf(error: unknown): Error {
    if (error instanceof OAuth2Error) return new MailError(error.message)
    if (error instanceof MailError) return error
    return new MailError(OAUTH2_RELOGIN_MESSAGE + '（' + redactCredentials(messageOf(error, '未知错误')) + '）')
  }

  private async imapRun<T>(
    name: string,
    cfg: ResolvedEmailConfig,
    folder: string | null,
    readOnly: boolean,
    run: (client: ImapFlow) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    let entry = this.imaps.get(name)
    let activeClient = entry?.client
    const onAbort = (): void => {
      // ImapFlow has no per-command AbortSignal option. Closing the owned
      // connection is its cooperative cancellation mechanism and makes the
      // in-flight command settle before this method returns.
      try { activeClient?.close() } catch { /* already closed */ }
    }
    signal?.throwIfAborted()
    signal?.addEventListener('abort', onAbort, { once: true })
    try {
      if (entry === undefined || !entry.client.usable) {
        if (entry !== undefined) await this.evictImap(name)
        const client = await this.connectImap(name, cfg)
        activeClient = client
        signal?.throwIfAborted()
        entry = { client, selected: null, selectedReadOnly: true, lastUsed: Date.now(), inUse: 0 }
        this.imaps.set(name, entry)
      }
      activeClient = entry.client
      entry.lastUsed = Date.now()
      entry.inUse += 1
      // Reopen when the folder changes or when the caller needs a different
      // access mode (email_mark writes flags / moves messages).
      if (folder !== null && (entry.selected !== folder || entry.selectedReadOnly !== readOnly)) {
        await entry.client.mailboxOpen(folder, { readOnly })
        signal?.throwIfAborted()
        entry.selected = folder
        entry.selectedReadOnly = readOnly
      }
      const result = await run(entry.client)
      signal?.throwIfAborted()
      entry.lastUsed = Date.now()
      return result
    } catch (error) {
      await this.evictImap(name)
      signal?.throwIfAborted()
      throw this.normalizeImapError(error, folder, cfg.authKind)
    } finally {
      signal?.removeEventListener('abort', onAbort)
      if (entry !== undefined) entry.inUse = Math.max(0, entry.inUse - 1)
    }
  }

  private normalizeImapError(error: unknown, folder: string | null, authKind: AuthKind = 'password'): Error {
    const raw = messageOf(error, 'IMAP 操作失败')
    const lower = raw.toLowerCase()
    if (lower.includes('authentication') || lower.includes('login')) {
      // An OAuth2 account has no 授权码 to check: the only fix is a new login.
      return new MailError(authKind === 'oauth2'
        ? OAUTH2_RELOGIN_MESSAGE + '（' + raw + '）'
        : '邮箱登录失败：' + raw + '（请检查 user 与授权码）')
    }
    if (lower.includes('nonselect') || lower.includes('does not exist') || lower.includes('nonexistent')) {
      return new MailError('找不到邮箱文件夹 "' + (folder ?? '') + '"：' + raw)
    }
    return new MailError(raw)
  }

  private async evictImap(name: string): Promise<void> {
    const entry = this.imaps.get(name)
    if (entry === undefined) return
    this.imaps.delete(name)
    try { await entry.client.logout() } catch { /* already closed */ }
  }

  /** Reap IMAP connections idle for longer than idleTimeoutMs. */
  startIdleSweep(): void {
    if (this.idleTimer !== undefined) return
    const intervalMs = Math.max(5000, Math.min(this.settings.idleTimeoutMs / 2, 30000))
    this.idleTimer = setInterval(() => {
      const now = Date.now()
      for (const [name, entry] of this.imaps) {
        if (entry.inUse === 0 && now - entry.lastUsed > this.settings.idleTimeoutMs) {
          void this.evictImap(name)
        }
      }
    }, intervalMs)
    this.idleTimer.unref()
  }

  dispose(): void {
    if (this.idleTimer !== undefined) clearInterval(this.idleTimer)
    this.idleTimer = undefined
    for (const name of [...this.imaps.keys()]) void this.evictImap(name)
    for (const transporter of this.smtps.values()) transporter.close()
    this.smtps.clear()
  }

  /**
   * A pooled transporter for one account. The token is captured when the
   * transporter is built; an OAuth2 token that turns out to be stale is
   * re-minted in sendMail, which rebuilds the transporter.
   */
  private transporter(name: string, cfg: ResolvedEmailConfig, accessToken?: string): Transporter {
    let t = this.smtps.get(name)
    if (t === undefined) {
      t = nodemailer.createTransport({
        pool: true,
        host: cfg.smtp.host,
        port: cfg.smtp.port,
        secure: cfg.smtp.secure,
        auth: smtpAuthOf(cfg, accessToken),
        connectionTimeout: 30000,
        greetingTimeout: 10000,
        socketTimeout: 60000,
        maxConnections: 2,
        maxMessages: 50,
      })
      this.smtps.set(name, t)
    }
    return t
  }

  private dropTransporter(name: string, transporter: Transporter): void {
    if (this.smtps.get(name) === transporter) this.smtps.delete(name)
    transporter.close()
  }

  /**
   * Send through the pooled transporter while making cancellation close it.
   *
   * An OAuth2 transporter carries a token that was minted when it was built,
   * so a rejection is retried once against a freshly built one (and a fresh
   * form of whatever stored token state exists). Password accounts keep the
   * single attempt they always had.
   */
  private async sendMail(name: string, cfg: ResolvedEmailConfig, message: any, signal?: AbortSignal): Promise<any> {
    signal?.throwIfAborted()
    const attempt = async (forceToken: boolean): Promise<any> => {
      const token = cfg.authKind === 'oauth2' ? await getFreshAccessToken(name, cfg, { force: forceToken }) : undefined
      const transporter = this.transporter(name, cfg, token)
      const onAbort = (): void => {
        this.dropTransporter(name, transporter)
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      try {
        const info = await transporter.sendMail(message)
        signal?.throwIfAborted()
        return info
      } finally {
        signal?.removeEventListener('abort', onAbort)
      }
    }
    try {
      return await attempt(false)
    } catch (error) {
      signal?.throwIfAborted()
      if (cfg.authKind !== 'oauth2') throw error
      // A pooled connection that already authenticated can fail for reasons no
      // token can fix (a rejected recipient, a full mailbox). Only a credential
      // rejection is worth a second, freshly-tokened attempt — and a token
      // store that refused outright is reported as itself.
      if (!looksLikeAuthFailure(error)) throw this.oauth2ErrorOf(error)
      // The cached transporter holds the old token: it has to go, or the retry
      // would reuse the very credential that was just refused.
      const stale = this.smtps.get(name)
      if (stale !== undefined) this.dropTransporter(name, stale)
      try {
        return await attempt(true)
      } catch (retryError) {
        signal?.throwIfAborted()
        throw this.oauth2ErrorOf(retryError)
      }
    }
  }

  /**
   * Download one MIME part through imapflow's decode pipeline: transfer
   * encoding and charset are handled there, maxBytes caps what is fetched.
   */
  private async downloadPartText(client: ImapFlow, uid: number, part: TextBodyPart, maxBytes: number, signal?: AbortSignal): Promise<string> {
    const dl = await client.download(uid, part.key, { uid: true, maxBytes })
    signal?.throwIfAborted()
    const buf = await collectStream(dl.content, maxBytes, signal)
    signal?.throwIfAborted()
    return buf.toString('utf8')
  }

  /**
   * The message body without its attachments. undefined when the structure has
   * no usable text part or the server refuses the part fetch, so the caller can
   * fall back to the full-source path for that one message.
   */
  private async bodyTextFromParts(client: ImapFlow, uid: number, structure: any, maxBytes: number, signal?: AbortSignal): Promise<string | undefined> {
    const { plain, html } = selectBodyParts(structure)
    if (plain !== undefined) {
      const text = await this.downloadPartText(client, uid, plain, maxBytes, signal)
      if (text.trim() !== '' || html === undefined) return text
    }
    if (html !== undefined) return stripHtml(await this.downloadPartText(client, uid, html, maxBytes, signal))
    return undefined
  }

  async list(accountName: string | undefined, folder: string, limit: number, offset: number, unreadOnly: boolean, since?: Date, until?: Date, signal?: AbortSignal): Promise<EmailListResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      const mailbox = client.mailbox
      const total = mailbox === false ? 0 : mailbox.exists
      // imapflow types uidValidity as number | bigint; the wire format is 32-bit.
      const uidValidity = mailbox === false ? 0 : Number(mailbox.uidValidity ?? 0)
      let scopeCount = total
      let uids: number[] = []
      const hasDateFilter = since !== undefined || until !== undefined
      if (unreadOnly || hasDateFilter) {
        const query: Record<string, unknown> = {}
        if (unreadOnly) query.seen = false
        if (since !== undefined) query.since = since
        if (until !== undefined) query.before = until
        const found = await client.search(query, { uid: true })
        signal?.throwIfAborted()
        uids = found === false ? [] : found
        scopeCount = uids.length
      } else if (total > 0) {
        const start = Math.max(1, total - (limit + offset) + 1)
        const fetched = await client.fetchAll(start + ':*', { uid: true })
        signal?.throwIfAborted()
        uids = fetched.map(message => message.uid)
      }
      uids.reverse()
      const window = uids.slice(offset, offset + limit)
      const messages = await this.fetchListed(client, window, signal)
      return { account: name, count: scopeCount, folder: folderName, uidValidity, messages }
    }, true, signal)
  }

  /**
   * The uid index behind email_watch: SEARCH UNSEEN only, no envelopes and no
   * bodies. The caller decides which uids it actually needs to report.
   */
  async unseenUids(accountName: string | undefined, folder: string, signal?: AbortSignal): Promise<{ account: string; folder: string; uidValidity: number; count: number; uids: number[] }> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      const mailbox = client.mailbox
      const uidValidity = mailbox === false ? 0 : Number(mailbox.uidValidity ?? 0)
      const found = await client.search({ seen: false }, { uid: true })
      signal?.throwIfAborted()
      const uids = (found === false ? [] : found).slice().sort((a, b) => b - a)
      return { account: name, folder: folderName, uidValidity, count: uids.length, uids }
    }, true, signal)
  }

  /** Fetch the envelopes for one uid batch: the rows email_watch will report. */
  async fetchByUids(accountName: string | undefined, folder: string, uids: number[], signal?: AbortSignal): Promise<ListedMessage[]> {
    if (uids.length === 0) return []
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, (client) => this.fetchListed(client, uids, signal), true, signal)
  }

  async search(accountName: string | undefined, query: string, folder: string, limit: number, offset: number, since?: Date, until?: Date, signal?: AbortSignal): Promise<EmailSearchResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      // No nested OR and no TEXT search: several servers (QQ among them)
      // silently answer those with empty results, and some answer with a
      // non-empty list that has nothing to do with the query at all (QQ again:
      // an impossible keyword still「matches」every uid in the folder). The
      // server's hit list is therefore a hint, not an answer: confirm it
      // against the envelopes before reporting anything, otherwise scan
      // locally.
      const dateRange: Record<string, unknown> = {}
      if (since !== undefined) dateRange.since = since
      if (until !== undefined) dateRange.before = until
      const found = await Promise.all([
        client.search({ subject: query, ...dateRange }, { uid: true }),
        client.search({ from: query, ...dateRange }, { uid: true }),
        client.search({ to: query, ...dateRange }, { uid: true }),
        client.search({ cc: query, ...dateRange }, { uid: true }),
      ])
      signal?.throwIfAborted()
      const uids = [...new Set(found.flatMap(result => result === false ? [] : result))].sort((a, b) => b - a)
      if (uids.length > 0) {
        // The sample has to cover the requested page (offset + limit) — the same
        // window the fallback scan looks at — so one FETCH serves both the
        // verification and the rows that are handed out.
        const confirmed = await this.searchHits(client, uids, query, offset + limit, signal)
        if (confirmed.length > 0) {
          // The server's list holds up, so its size is reported as the match
          // count; only rows that were confirmed are ever handed out.
          return { account: name, query, count: uids.length, folder: folderName, offset, messages: confirmed.slice(offset, offset + limit) }
        }
      }
      // Nothing believable came back (empty answer, or hits that did not
      // survive verification): scan the newest messages locally instead.
      if (this.settings.bodySearchFallback) {
        const messages = await this.searchBodies(client, query, folderName, limit, offset, since, until, signal)
        // 本地扫描不知道全文件夹有多少匹配，count 只是本页条数：用 countKind
        // 让渲染说「本页 N 条（仅扫描最近 bodySearchLimit 封）」，不能说「共 N 条」。
        return {
          account: name, query, count: messages.length, folder: folderName, offset, messages,
          countKind: 'scanned', scannedLimit: this.settings.bodySearchLimit,
        }
      }
      return { account: name, query, count: 0, folder: folderName, offset, messages: [] }
    }, true, signal)
  }

  /**
   * Confirm server-side hits against the mailbox itself: fetch the envelopes
   * of the newest candidates — the same window the body-scan fallback looks at
   * — and keep only those that really carry the query in subject/from/to/cc,
   * the four fields the server was asked about. No body is downloaded here,
   * and uids the server made up simply return nothing.
   */
  private async searchHits(client: ImapFlow, uids: number[], query: string, need: number, signal?: AbortSignal): Promise<ListedMessage[]> {
    const sample = uids.slice(0, Math.min(uids.length, Math.max(this.settings.bodySearchLimit, need)))
    signal?.throwIfAborted()
    const fetched = await client.fetchAll(sample, { uid: true, envelope: true, flags: true, size: true, bodyStructure: true }, { uid: true })
    signal?.throwIfAborted()
    return fetched
      .filter(message => {
        const envelope = message.envelope
        const addressText = [envelope?.from, envelope?.to, envelope?.cc].map(flattenAddressText).join(' ')
        return messageMatchesQuery(envelope?.subject ?? '', addressText, '', query)
      })
      .map(message => listedFrom(message, message.size, structureHasAttachment(message.bodyStructure)))
      .sort((a, b) => b.uid - a.uid)
  }

  /** Client-side scan of the tail of the mailbox, newest first. */
  private async searchBodies(client: ImapFlow, query: string, folder: string, limit: number, offset: number, since?: Date, until?: Date, signal?: AbortSignal): Promise<ListedMessage[]> {
    signal?.throwIfAborted()
    const mailbox = client.mailbox
    const total = mailbox === false ? 0 : mailbox.exists
    if (total === 0) return []
    const start = Math.max(1, total - this.settings.bodySearchLimit + 1)
    // 只取信封与 MIME 结构；正文在下面按 text/* 分段下载，附件不进正文匹配。
    const fetched = await client.fetchAll(
      start + ':*',
      { uid: true, envelope: true, flags: true, size: true, bodyStructure: true, internalDate: true },
    )
    const out: ListedMessage[] = []
    for (const message of [...fetched].reverse()) {
      signal?.throwIfAborted()
      if (out.length >= offset + limit) break
      const receivedAt = message.internalDate ?? message.envelope?.date
      if (since !== undefined && (receivedAt === undefined || receivedAt < since)) continue
      if (until !== undefined && (receivedAt === undefined || receivedAt >= until)) continue
      const subject = message.envelope?.subject ?? ''
      const recipientSearchText = [message.envelope?.from, message.envelope?.to, message.envelope?.cc]
        .map(flattenAddressText).join(' ')
      let body = ''
      if (message.source !== undefined) {
        // 服务器多送了整封 source（测试/旧行为）：直接解析，不必再多一次往返。
        try {
          const parsed = await parseRawMessage(message.source, 4096)
          signal?.throwIfAborted()
          body = parsed.text
        } catch (error) {
          signal?.throwIfAborted()
          // 单封邮件解析失败不应中断整批回退扫描，继续用 subject/from/to/cc 匹配。
        }
      } else if (message.bodyStructure !== undefined) {
        try {
          body = await this.bodyTextFromParts(client, message.uid, message.bodyStructure, 4096 * 4, signal) ?? ''
        } catch (error) {
          signal?.throwIfAborted()
          // 单封邮件分段下载失败不应中断整批回退扫描，继续用 subject/from/to/cc 匹配。
        }
      }
      if (messageMatchesQuery(subject, recipientSearchText, body, query)) {
        out.push(listedFrom(message, message.size, structureHasAttachment(message.bodyStructure)))
      }
    }
    return out.slice(offset, offset + limit)
  }

  private async fetchListed(client: ImapFlow, uids: number[], signal?: AbortSignal): Promise<ListedMessage[]> {
    signal?.throwIfAborted()
    if (uids.length === 0) return []
    const fetched = await client.fetchAll(
      uids,
      { uid: true, envelope: true, flags: true, size: true, bodyStructure: true },
      { uid: true },
    )
    signal?.throwIfAborted()
    return fetched
        .map(message => listedFrom(message, message.size, structureHasAttachment(message.bodyStructure)))
        .sort((a, b) => b.uid - a.uid)
  }

  async read(accountName: string | undefined, uid: number, folder: string, signal?: AbortSignal): Promise<EmailReadResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      // 先只要信封与 MIME 结构，正文按 text/* 分段下载：带 20 MiB 附件的邮件
      // 只为看正文时不再整封拉下来，附件元数据直接复用 bodyStructure。
      const message = await client.fetchOne(uid, { uid: true, envelope: true, bodyStructure: true }, { uid: true })
      if (message === false) {
        throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"；可用 email_list 重新获取 uid）')
      }
      signal?.throwIfAborted()
      if (message.source === undefined && message.envelope !== undefined && message.bodyStructure !== undefined) {
        try {
          const text = await this.bodyTextFromParts(client, uid, message.bodyStructure, this.settings.maxBodyChars * 4 + 4096, signal)
          if (text !== undefined) {
            const limited = truncateText(text, this.settings.maxBodyChars)
            const parts = collectAttachmentParts(message.bodyStructure)
            const attachments: EmailAttachmentMeta[] = parts.map(part => ({
              filename: part.filename,
              contentType: part.contentType,
              size: part.size,
              part: part.part,
            }))
            this.rememberRead(name, folderName, this.uidValidityOf(client), uid, { attachments, parts })
            const envelopeDate = message.envelope.date
            return {
              account: name,
              uid,
              folder: folderName,
              date: envelopeDate instanceof Date ? envelopeDate.toISOString() : '',
              from: flattenAddresses(message.envelope.from),
              to: flattenAddresses(message.envelope.to),
              cc: flattenAddresses(message.envelope.cc),
              subject: message.envelope.subject ?? '',
              text: limited.text,
              attachments,
              truncated: limited.truncated,
            }
          }
        } catch (error) {
          signal?.throwIfAborted()
          // 分段读取失败（服务器拒绝该分段或结构异常）：这一封退回整封解析。
        }
      }
      const full = message.source !== undefined
        ? message
        : await client.fetchOne(uid, { uid: true, source: true, bodyStructure: true }, { uid: true })
      if (full === false || full.source === undefined) {
        throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"；可用 email_list 重新获取 uid）')
      }
      const body = await parseRawMessage(full.source, this.settings.maxBodyChars)
      signal?.throwIfAborted()
      this.rememberRead(name, folderName, this.uidValidityOf(client), uid, { attachments: body.attachments, parts: collectAttachmentParts(full.bodyStructure) })
      return { account: name, uid, folder: folderName, ...body }
    }, true, signal)
  }

  async mark(accountName: string | undefined, folder: string, uid: number, action: EmailMarkAction, toFolder?: string, signal?: AbortSignal): Promise<EmailMarkResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      const before = await client.fetchOne(uid, { uid: true, flags: true }, { uid: true })
      signal?.throwIfAborted()
      if (before === false) {
        throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"；可用 email_list 重新获取 uid）')
      }
      let seen = before.flags?.has('\\Seen') === true
      let flagged = before.flags?.has('\\Flagged') === true
      if (action === 'read' && !seen) {
        await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true })
        signal?.throwIfAborted()
        seen = true
      } else if (action === 'unread' && seen) {
        await client.messageFlagsRemove(uid, ['\\Seen'], { uid: true })
        signal?.throwIfAborted()
        seen = false
      } else if (action === 'star' && !flagged) {
        await client.messageFlagsAdd(uid, ['\\Flagged'], { uid: true })
        signal?.throwIfAborted()
        flagged = true
      } else if (action === 'unstar' && flagged) {
        await client.messageFlagsRemove(uid, ['\\Flagged'], { uid: true })
        signal?.throwIfAborted()
        flagged = false
      } else if (action === 'move') {
        const target = (toFolder ?? '').trim()
        if (target === '') throw new MailError('move 操作需要 toFolder 参数（用 email_folders 查看可用文件夹）')
        if (target === folderName) throw new MailError('邮件已在文件夹 "' + folderName + '" 中，无需移动')
        const folders = await client.list()
        signal?.throwIfAborted()
        if (!folders.some(row => row.path === target)) {
          throw new MailError('找不到目标文件夹 "' + target + '"，可用：' + folders.map(row => row.path).join('、'))
        }
        const moved = await client.messageMove(uid, target, { uid: true })
        signal?.throwIfAborted()
        if (moved === false) throw new MailError('移动 uid=' + uid + ' 到 "' + target + '" 失败（服务器拒绝了 MOVE/COPY）')
        const result: EmailMarkResult = { account: name, uid, folder: folderName, action, seen, flagged, movedTo: target }
        const destUid = (moved as { destinationUid?: unknown })?.destinationUid
        if (typeof destUid === 'number') result.movedUid = destUid
        return result
      }
      return { account: name, uid, folder: folderName, action, seen, flagged }
    }, false, signal)
  }

  async folders(accountName: string | undefined, subscribedOnly: boolean, signal?: AbortSignal): Promise<EmailFoldersResult> {
    const name = this.resolveName(accountName)
    return this.withImap(name, null, async (client) => {
      const cached = this.folderCache.get(name)
      let rows: EmailFolderRow[]
      if (cached !== undefined && Date.now() - cached.at < FOLDER_CACHE_TTL_MS) {
        rows = cached.folders
      } else {
        const list = await client.list()
        signal?.throwIfAborted()
        rows = list.map(row => ({
          name: row.name ?? row.path,
          path: row.path,
          specialUse: row.specialUse ?? '',
          subscribed: row.subscribed !== false,
        }))
        this.folderCache.set(name, { at: Date.now(), folders: rows })
      }
      return { account: name, folders: rows.filter(row => !subscribedOnly || row.subscribed !== false) }
    }, true, signal)
  }

  async downloadAttachment(accountName: string | undefined, folder: string, uid: number, index: number, workspaceHint?: string, signal?: AbortSignal): Promise<EmailAttachmentResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      // The mailparser list is authoritative for the index email_read showed and
      // the bodyStructure walk supplies the IMAP part to download. email_read
      // already produced both in the usual read-then-download flow, so reuse that
      // instead of pulling the whole message — attachments included — again.
      const { attachments, parts } = await this.attachmentIndexOf(client, name, folderName, uid, signal)
      if (attachments.length === 0) throw new MailError('该邮件没有附件')
      if (attachments[index] === undefined) {
        throw new MailError('附件序号 ' + index + ' 越界：共 ' + attachments.length + ' 个附件（序号从 0 开始，与 email_read 返回的 attachments 顺序一致）')
      }
      const att = selectAttachmentPart(attachments, parts, index)
      if (att === undefined) {
        throw new MailError('附件 #' + index + '（' + attachments[index].filename + '）无法在邮件结构中定位（可能是内嵌图片，暂不支持下载）')
      }
      if (att.size > this.settings.maxAttachmentBytes) {
        throw new MailError('附件 "' + att.filename + '" 大小 ' + att.size + ' 字节，超过上限 maxAttachmentBytes=' + this.settings.maxAttachmentBytes)
      }
      const dl = await client.download(uid, att.part, { uid: true, maxBytes: this.settings.maxAttachmentBytes })
      signal?.throwIfAborted()
      const buf = await collectStream(dl.content, this.settings.maxAttachmentBytes, signal)
      const safeName = sanitizeFilename(dl.meta.filename ?? att.filename ?? attachments[index].filename)
      // Default the destination to the session workspace so the model can
      // read the file back; an explicit downloadDir always wins.
      const dir = this.settings.downloadDirExplicit
        ? this.settings.downloadDir
        : (typeof workspaceHint === 'string' && workspaceHint !== ''
          ? join(workspaceHint, '.dsh-email-downloads')
          : this.settings.downloadDir)
      await mkdir(dir, { recursive: true })
      signal?.throwIfAborted()
      const dest = await uniquePath(join(dir, safeName))
      signal?.throwIfAborted()
      await writeFile(dest, buf, signal === undefined ? undefined : { signal })
      return { account: name, uid, filename: safeName, contentType: att.contentType, size: buf.length, path: dest }
    }, true, signal)
  }

  async send(accountName: string | undefined, to: string, subject: string, text: string | undefined, cc: string | undefined, attachmentPaths: string[] | undefined, signal?: AbortSignal): Promise<EmailSendResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const attachments = await validateAttachmentPaths(attachmentPaths ?? [], this.settings.maxAttachmentBytes, signal)
    const info = await this.sendMail(name, cfg, {
      from: senderOf(cfg),
      to,
      cc,
      subject,
      text: text ?? '',
      attachments,
    }, signal)
    return {
      account: name,
      messageId: typeof info.messageId === 'string' ? info.messageId : String(info.messageId ?? ''),
      accepted: Array.isArray(info.accepted) ? info.accepted.map(String) : [],
      rejected: Array.isArray(info.rejected) ? info.rejected.map(String) : [],
      response: typeof info.response === 'string' ? info.response : String(info.response ?? ''),
    }
  }

  async reply(accountName: string | undefined, folder: string, uid: number, mode: EmailReplyMode, text: string, forwardTo: string, cc: string | undefined, signal?: AbortSignal): Promise<EmailReplyResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    // Read the original first (read-only), send second: a failed compose never
    // leaves a half-written mailbox state behind.
    const built = await this.withImap(name, folderName, async (client) => {
      const message = await client.fetchOne(uid, { uid: true, source: true }, { uid: true })
      if (message === false || message.source === undefined) {
        throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"；可用 email_list 重新获取 uid）')
      }
      const ids = extractMessageIds(message.source)
      const body = await parseRawMessage(message.source, this.settings.maxBodyChars)
      signal?.throwIfAborted()
      return buildReplyMessage(
        { from: body.from, to: body.to, cc: body.cc, subject: body.subject, date: body.date, text: body.text, messageId: ids.messageId, references: ids.references },
        mode,
        // Both the visible address and the login are "me": a reply-all that
        // keeps either of them would mail the sender his own message.
        cfg.authUser === cfg.user ? cfg.user : [cfg.user, cfg.authUser],
        text,
        forwardTo,
      )
    }, true, signal)
    const info = await this.sendMail(name, cfg, {
      from: senderOf(cfg),
      to: built.to,
      cc,
      subject: built.subject,
      text: built.text,
      ...(built.inReplyTo !== undefined ? { inReplyTo: '<' + built.inReplyTo + '>' } : {}),
      ...(built.references !== undefined ? { references: built.references.split(' ').map(id => '<' + id + '>') } : {}),
    }, signal)
    return {
      account: name,
      mode,
      originalUid: uid,
      messageId: typeof info.messageId === 'string' ? info.messageId : String(info.messageId ?? ''),
      accepted: Array.isArray(info.accepted) ? info.accepted.map(String) : [],
      rejected: Array.isArray(info.rejected) ? info.rejected.map(String) : [],
      response: typeof info.response === 'string' ? info.response : String(info.response ?? ''),
      to: built.to.split(',').map(part => part.trim()).filter(part => part !== ''),
      subject: built.subject,
    }
  }
}

/** Stat every attachment path up front; total size must stay under the cap. */
export async function validateAttachmentPaths(paths: string[], maxBytes: number, signal?: AbortSignal): Promise<Array<{ path: string }>> {
  const out: Array<{ path: string }> = []
  let total = 0
  for (const rawPath of paths) {
    signal?.throwIfAborted()
    if (typeof rawPath !== 'string' || rawPath.trim() === '') {
      throw new MailError('附件路径无效：' + String(rawPath))
    }
    const path = rawPath.trim()
    let info
    try { info = await stat(path) } catch {
      throw new MailError('附件路径不存在或不可读：' + path)
    }
    signal?.throwIfAborted()
    if (!info.isFile()) throw new MailError('附件路径不是文件：' + path)
    total += info.size
    if (total > maxBytes) {
      throw new MailError('附件总大小超过上限 maxAttachmentBytes=' + maxBytes + ' 字节')
    }
    out.push({ path })
  }
  return out
}

/** Drain a download stream into a Buffer with a hard byte cap. */
async function collectStream(stream: Readable, maxBytes: number, signal?: AbortSignal): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  const onAbort = (): void => {
    stream.destroy(signal?.reason instanceof Error ? signal.reason : new Error('邮件附件下载已取消'))
  }
  signal?.throwIfAborted()
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    for await (const chunk of stream) {
      signal?.throwIfAborted()
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      total += buf.length
      if (total > maxBytes) throw new MailError('附件超过上限 maxAttachmentBytes=' + maxBytes + ' 字节，下载中止')
      chunks.push(buf)
    }
    signal?.throwIfAborted()
    return Buffer.concat(chunks)
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }
}

/** Avoid overwriting: append -1, -2, ... before the extension. */
async function uniquePath(path: string): Promise<string> {
  try { await stat(path) } catch { return path }
  const dot = path.lastIndexOf('.')
  const base = dot > 0 ? path.slice(0, dot) : path
  const ext = dot > 0 ? path.slice(dot) : ''
  for (let i = 1; i < 1000; i++) {
    const candidate = base + '-' + i + ext
    try { await stat(candidate) } catch { return candidate }
  }
  return base + '-' + Date.now() + ext
}
