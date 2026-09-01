import { ImapFlow } from 'imapflow'
import nodemailer, { type Transporter } from 'nodemailer'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import type { ResolvedEmailConfig, ResolvedEmailSettings } from './config.js'
import { flattenAddresses, parseRawMessage, sanitizeFilename } from './parse.js'
import type {
  AddressEntry,
  EmailAttachmentMeta,
  EmailAttachmentResult,
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

function dedupeAddresses(entries: AddressEntry[], exclude: string): AddressEntry[] {
  const seen = new Set<string>()
  const out: AddressEntry[] = []
  for (const entry of entries) {
    const addr = (entry.address ?? '').toLowerCase()
    if (addr === '' || addr === exclude || seen.has(addr)) continue
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
export function buildReplyMessage(original: OriginalDigest, mode: EmailReplyMode, selfAddress: string, text: string, forwardTo = ''): BuiltReply {
  const fromText = original.from.map(a => a.name ?? a.address).filter(Boolean).join(', ') || '(未知发件人)'
  const self = selfAddress.toLowerCase()
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
  private enqueue<T>(name: string, task: () => Promise<T>): Promise<T> {
    const prev = this.queues.get(name) ?? Promise.resolve()
    const next = prev.then(task, task)
    this.queues.set(name, next.then(() => undefined, () => undefined))
    return next
  }

  async withImap<T>(accountName: string | undefined, folder: string | null, run: (client: ImapFlow) => Promise<T>, readOnly = true): Promise<T> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    return this.enqueue(name, () => this.imapRun(name, cfg, folder, readOnly, run))
  }

  private createImap(cfg: ResolvedEmailConfig): ImapFlow {
    const client = new ImapFlow({
      host: cfg.imap.host,
      port: cfg.imap.port,
      secure: cfg.imap.secure,
      auth: { user: cfg.user, pass: cfg.password },
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

  private async imapRun<T>(name: string, cfg: ResolvedEmailConfig, folder: string | null, readOnly: boolean, run: (client: ImapFlow) => Promise<T>): Promise<T> {
    let entry = this.imaps.get(name)
    try {
      if (entry === undefined || !entry.client.usable) {
        if (entry !== undefined) await this.evictImap(name)
        const client = this.createImap(cfg)
        await client.connect()
        entry = { client, selected: null, selectedReadOnly: true, lastUsed: Date.now(), inUse: 0 }
        this.imaps.set(name, entry)
      }
      entry.lastUsed = Date.now()
      entry.inUse += 1
      // Reopen when the folder changes or when the caller needs a different
      // access mode (email_mark writes flags / moves messages).
      if (folder !== null && (entry.selected !== folder || entry.selectedReadOnly !== readOnly)) {
        await entry.client.mailboxOpen(folder, { readOnly })
        entry.selected = folder
        entry.selectedReadOnly = readOnly
      }
      const result = await run(entry.client)
      entry.lastUsed = Date.now()
      return result
    } catch (error) {
      await this.evictImap(name)
      throw this.normalizeImapError(error, folder);
    } finally {
      if (entry !== undefined) entry.inUse = Math.max(0, entry.inUse - 1)
    }
  }

  private normalizeImapError(error: unknown, folder: string | null): Error {
    const raw = messageOf(error, 'IMAP 操作失败')
    const lower = raw.toLowerCase()
    if (lower.includes('authentication') || lower.includes('login')) {
      return new MailError('邮箱登录失败：' + raw + '（请检查 user 与授权码）')
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

  private transporter(name: string, cfg: ResolvedEmailConfig): Transporter {
    let t = this.smtps.get(name)
    if (t === undefined) {
      t = nodemailer.createTransport({
        pool: true,
        host: cfg.smtp.host,
        port: cfg.smtp.port,
        secure: cfg.smtp.secure,
        auth: { user: cfg.user, pass: cfg.password },
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

  async list(accountName: string | undefined, folder: string, limit: number, offset: number, unreadOnly: boolean, since?: Date, until?: Date): Promise<EmailListResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      const mailbox = client.mailbox
      const total = mailbox === false ? 0 : mailbox.exists
      let scopeCount = total
      let uids: number[] = []
      const hasDateFilter = since !== undefined || until !== undefined
      if (unreadOnly || hasDateFilter) {
        const query: Record<string, unknown> = {}
        if (unreadOnly) query.seen = false
        if (since !== undefined) query.since = since
        if (until !== undefined) query.before = until
        const found = await client.search(query, { uid: true })
        uids = found === false ? [] : found
        scopeCount = uids.length
      } else if (total > 0) {
        const start = Math.max(1, total - (limit + offset) + 1)
        const fetched = await client.fetchAll(start + ':*', { uid: true })
        uids = fetched.map(message => message.uid)
      }
      uids.reverse()
      const window = uids.slice(offset, offset + limit)
      const messages = await this.fetchListed(client, window)
      return { account: name, count: scopeCount, folder: folderName, messages }
    })
  }

  async search(accountName: string | undefined, query: string, folder: string, limit: number, since?: Date, until?: Date): Promise<EmailSearchResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      // No nested OR and no TEXT search: several servers (QQ among them)
      // silently answer those with empty or match-everything results.
      // subject/from/to/cc searches unioned client-side behave well everywhere.
      const dateRange: Record<string, unknown> = {}
      if (since !== undefined) dateRange.since = since
      if (until !== undefined) dateRange.before = until
      const found = await Promise.all([
        client.search({ subject: query, ...dateRange }, { uid: true }),
        client.search({ from: query, ...dateRange }, { uid: true }),
        client.search({ to: query, ...dateRange }, { uid: true }),
          client.search({ cc: query, ...dateRange }, { uid: true }),
      ])
      const uids = [...new Set(found.flatMap(result => result === false ? [] : result))].sort((a, b) => a - b)
      uids.reverse()
      if (uids.length === 0 && this.settings.bodySearchFallback) {
        // Server-side search found nothing: fall back to a client-side scan of
        // the most recent messages (subject/from/body), capped for time.
        const messages = await this.searchBodies(client, query, folderName, limit)
        return { account: name, query, count: messages.length, folder: folderName, messages }
      }
      const messages = await this.fetchListed(client, uids.slice(0, limit))
      return { account: name, query, count: uids.length, folder: folderName, messages }
    })
  }

  /** Client-side scan of the tail of the mailbox, newest first. */
  private async searchBodies(client: ImapFlow, query: string, folder: string, limit: number): Promise<ListedMessage[]> {
    const mailbox = client.mailbox
    const total = mailbox === false ? 0 : mailbox.exists
    if (total === 0) return []
    const start = Math.max(1, total - this.settings.bodySearchLimit + 1)
    const fetched = await client.fetchAll(
      start + ':*',
      { uid: true, envelope: true, flags: true, size: true, bodyStructure: true, source: true },
    )
    const out: ListedMessage[] = []
    for (const message of [...fetched].reverse()) {
      if (out.length >= limit) break
      const subject = message.envelope?.subject ?? ''
      
          const recipientSearchText = [message.envelope?.from, message.envelope?.to, message.envelope?.cc]
          .map(flattenAddressText).join(' ')
        
          
        
          
      let body = ''
      if (message.source !== undefined) {
        try {
            const parsed = await parseRawMessage(message.source, 4096)
              body = parsed.text
    
  
          } catch {
            // 单封邮件解析失败不应中断整批回退扫描，继续用 subject/from/to/cc 匹配。
          }
        
      }
      if (messageMatchesQuery(subject, recipientSearchText, body, query)) {
        out.push(listedFrom(message, message.size, structureHasAttachment(message.bodyStructure)))
      }
    }
    return out
  }

  private async fetchListed(client: ImapFlow, uids: number[]): Promise<ListedMessage[]> {
    if (uids.length === 0) return []
    const fetched = await client.fetchAll(
      uids,
      { uid: true, envelope: true, flags: true, size: true, bodyStructure: true },
      { uid: true },
    )
    return fetched
        .map(message => listedFrom(message, message.size, structureHasAttachment(message.bodyStructure)))
        .sort((a, b) => b.uid - a.uid)
  }

  async read(accountName: string | undefined, uid: number, folder: string): Promise<EmailReadResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      const message = await client.fetchOne(uid, { uid: true, source: true }, { uid: true })
      if (message === false || message.source === undefined) {
        throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"；可用 email_list 重新获取 uid）')
      }
      const body = await parseRawMessage(message.source, this.settings.maxBodyChars)
      return { account: name, uid, folder: folderName, ...body }
    })
  }

  async mark(accountName: string | undefined, folder: string, uid: number, action: EmailMarkAction, toFolder?: string): Promise<EmailMarkResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      const before = await client.fetchOne(uid, { uid: true, flags: true }, { uid: true })
      if (before === false) {
        throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"；可用 email_list 重新获取 uid）')
      }
      let seen = before.flags?.has('\\Seen') === true
      let flagged = before.flags?.has('\\Flagged') === true
      if (action === 'read' && !seen) {
        await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true })
        seen = true
      } else if (action === 'unread' && seen) {
        await client.messageFlagsRemove(uid, ['\\Seen'], { uid: true })
        seen = false
      } else if (action === 'star' && !flagged) {
        await client.messageFlagsAdd(uid, ['\\Flagged'], { uid: true })
        flagged = true
      } else if (action === 'unstar' && flagged) {
        await client.messageFlagsRemove(uid, ['\\Flagged'], { uid: true })
        flagged = false
      } else if (action === 'move') {
        const target = (toFolder ?? '').trim()
        if (target === '') throw new MailError('move 操作需要 toFolder 参数（用 email_folders 查看可用文件夹）')
        if (target === folderName) throw new MailError('邮件已在文件夹 "' + folderName + '" 中，无需移动')
        const folders = await client.list()
        if (!folders.some(row => row.path === target)) {
          throw new MailError('找不到目标文件夹 "' + target + '"，可用：' + folders.map(row => row.path).join('、'))
        }
        const moved = await client.messageMove(uid, target, { uid: true })
        if (moved === false) throw new MailError('移动 uid=' + uid + ' 到 "' + target + '" 失败（服务器拒绝了 MOVE/COPY）')
        const result: EmailMarkResult = { account: name, uid, folder: folderName, action, seen, flagged, movedTo: target }
        const destUid = (moved as { destinationUid?: unknown })?.destinationUid
        if (typeof destUid === 'number') result.movedUid = destUid
        return result
      }
      return { account: name, uid, folder: folderName, action, seen, flagged }
    }, false)
  }

  async folders(accountName: string | undefined, subscribedOnly: boolean): Promise<EmailFoldersResult> {
    const name = this.resolveName(accountName)
    return this.withImap(name, null, async (client) => {
      const list = await client.list()
      const folders = list
        .filter(row => !subscribedOnly || row.subscribed !== false)
        .map(row => ({
          name: row.name ?? row.path,
          path: row.path,
          specialUse: row.specialUse ?? '',
          subscribed: row.subscribed !== false,
        }))
      return { account: name, folders }
    })
  }

  async downloadAttachment(accountName: string | undefined, folder: string, uid: number, index: number, workspaceHint?: string): Promise<EmailAttachmentResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      const message = await client.fetchOne(uid, { uid: true, bodyStructure: true, source: true }, { uid: true })
      if (message === false || message.source === undefined) {
        throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"）')
      }
      // The mailparser list is authoritative for the index email_read showed;
      // the bodyStructure walk supplies the IMAP part to download.
      const body = await parseRawMessage(message.source, this.settings.maxBodyChars)
      const parts = collectAttachmentParts(message.bodyStructure)
      if (body.attachments.length === 0) throw new MailError('该邮件没有附件')
      if (body.attachments[index] === undefined) {
        throw new MailError('附件序号 ' + index + ' 越界：共 ' + body.attachments.length + ' 个附件（序号从 0 开始，与 email_read 返回的 attachments 顺序一致）')
      }
      const att = selectAttachmentPart(body.attachments, parts, index)
      if (att === undefined) {
        throw new MailError('附件 #' + index + '（' + body.attachments[index].filename + '）无法在邮件结构中定位（可能是内嵌图片，暂不支持下载）')
      }
      if (att.size > this.settings.maxAttachmentBytes) {
        throw new MailError('附件 "' + att.filename + '" 大小 ' + att.size + ' 字节，超过上限 maxAttachmentBytes=' + this.settings.maxAttachmentBytes)
      }
      const dl = await client.download(uid, att.part, { uid: true, maxBytes: this.settings.maxAttachmentBytes })
      const buf = await collectStream(dl.content, this.settings.maxAttachmentBytes)
      const safeName = sanitizeFilename(dl.meta.filename ?? att.filename ?? body.attachments[index].filename)
      // Default the destination to the session workspace so the model can
      // read the file back; an explicit downloadDir always wins.
      const dir = this.settings.downloadDirExplicit
        ? this.settings.downloadDir
        : (typeof workspaceHint === 'string' && workspaceHint !== ''
          ? join(workspaceHint, '.dsh-email-downloads')
          : this.settings.downloadDir)
      await mkdir(dir, { recursive: true })
      const dest = await uniquePath(join(dir, safeName))
      await writeFile(dest, buf)
      return { account: name, uid, filename: safeName, contentType: att.contentType, size: buf.length, path: dest }
    })
  }

  async send(accountName: string | undefined, to: string, subject: string, text: string | undefined, cc: string | undefined, attachmentPaths: string[] | undefined): Promise<EmailSendResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const attachments = await validateAttachmentPaths(attachmentPaths ?? [], this.settings.maxAttachmentBytes)
    const info = await this.transporter(name, cfg).sendMail({
      from: cfg.user,
      to,
      cc,
      subject,
      text: text ?? '',
      attachments,
    })
    return {
      account: name,
      messageId: info.messageId,
      accepted: info.accepted.map(String),
      rejected: info.rejected.map(String),
      response: info.response,
    }
  }

  async reply(accountName: string | undefined, folder: string, uid: number, mode: EmailReplyMode, text: string, forwardTo: string, cc: string | undefined): Promise<EmailReplyResult> {
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
      return buildReplyMessage(
        { from: body.from, to: body.to, cc: body.cc, subject: body.subject, date: body.date, text: body.text, messageId: ids.messageId, references: ids.references },
        mode,
        cfg.user,
        text,
        forwardTo,
      )
    })
    const info = await this.transporter(name, cfg).sendMail({
      from: cfg.user,
      to: built.to,
      cc,
      subject: built.subject,
      text: built.text,
      ...(built.inReplyTo !== undefined ? { inReplyTo: '<' + built.inReplyTo + '>' } : {}),
      ...(built.references !== undefined ? { references: built.references.split(' ').map(id => '<' + id + '>') } : {}),
    })
    return {
      account: name,
      mode,
      originalUid: uid,
      messageId: info.messageId,
      accepted: info.accepted.map(String),
      rejected: info.rejected.map(String),
      response: info.response,
      to: built.to.split(',').map(part => part.trim()).filter(part => part !== ''),
      subject: built.subject,
    }
  }
}

/** Stat every attachment path up front; total size must stay under the cap. */
export async function validateAttachmentPaths(paths: string[], maxBytes: number): Promise<Array<{ path: string }>> {
  const out: Array<{ path: string }> = []
  let total = 0
  for (const rawPath of paths) {
      if (typeof rawPath !== 'string' || rawPath.trim() === '') {
        throw new MailError('附件路径无效：' + String(rawPath))
      }
      const path = rawPath.trim()
    let info;
    try { info = await stat(path) } catch {
      throw new MailError('附件路径不存在或不可读：' + path)
    }
    if (!info.isFile()) throw new MailError('附件路径不是文件：' + path)
    total += info.size;
    if (total > maxBytes) {
      throw new MailError('附件总大小超过上限 maxAttachmentBytes=' + maxBytes + ' 字节')
    }
    out.push({ path })
  }
  return out
}

/** Drain a download stream into a Buffer with a hard byte cap. */
async function collectStream(stream: Readable, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buf.length
    if (total > maxBytes) throw new MailError('附件超过上限 maxAttachmentBytes=' + maxBytes + ' 字节，下载中止')
    chunks.push(buf)
  }
  return Buffer.concat(chunks)
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