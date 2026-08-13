import { ImapFlow } from 'imapflow'
import nodemailer, { type Transporter } from 'nodemailer'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import type { ResolvedEmailConfig, ResolvedEmailSettings } from './config.js'
import { flattenAddresses, parseRawMessage, sanitizeFilename } from './parse.js'
import type {
  EmailAttachmentResult,
  EmailFoldersResult,
  EmailListResult,
  EmailReadResult,
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

  async withImap<T>(accountName: string | undefined, folder: string | null, run: (client: ImapFlow) => Promise<T>): Promise<T> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    return this.enqueue(name, () => this.imapRun(name, cfg, folder, run))
  }

  private createImap(cfg: ResolvedEmailConfig): ImapFlow {
    return new ImapFlow({
      host: cfg.imap.host,
      port: cfg.imap.port,
      secure: cfg.imap.secure,
      auth: { user: cfg.user, pass: cfg.password },
      logger: false,
      connectionTimeout: cfg.imap.connectionTimeoutMs ?? 30000,
      greetingTimeout: 30000,
      socketTimeout: cfg.imap.socketTimeoutMs ?? 60000,
    })
  }

  private async imapRun<T>(name: string, cfg: ResolvedEmailConfig, folder: string | null, run: (client: ImapFlow) => Promise<T>): Promise<T> {
    let entry = this.imaps.get(name)
    try {
      if (entry === undefined || !entry.client.usable) {
        if (entry !== undefined) await this.evictImap(name)
        const client = this.createImap(cfg)
        await client.connect()
        entry = { client, selected: null, lastUsed: Date.now(), inUse: 0 }
        this.imaps.set(name, entry)
      }
      entry.lastUsed = Date.now()
      entry.inUse += 1
      if (folder !== null && entry.selected !== folder) {
        await entry.client.mailboxOpen(folder, { readOnly: true })
        entry.selected = folder
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

  async list(accountName: string | undefined, folder: string, limit: number, offset: number, unreadOnly: boolean): Promise<EmailListResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      const mailbox = client.mailbox
      const total = mailbox === false ? 0 : mailbox.exists
      let scopeCount = total
      let uids: number[] = []
      if (unreadOnly) {
        const found = await client.search({ seen: false }, { uid: true })
        uids = found === false ? [] : found
        scopeCount = uids.length
      } else if (total > 0) {
        const start = Math.max(1, total - (limit + offset) + 1)
        const fetched = await client.fetchAll(start + ':*', { uid: true }, { uid: true })
        uids = fetched.map(message => message.uid)
      }
      uids.reverse()
      const window = uids.slice(offset, offset + limit)
      const messages = await this.fetchListed(client, window)
      return { account: name, count: scopeCount, folder: folderName, messages }
    })
  }

  async search(accountName: string | undefined, query: string, folder: string, limit: number): Promise<EmailSearchResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      // No nested OR and no TEXT search: several servers (QQ among them)
      // silently answer those with empty or match-everything results. Three
      // independent searches unioned client-side behave well everywhere.
      const found = await Promise.all([
        client.search({ subject: query }, { uid: true }),
        client.search({ from: query }, { uid: true }),
        client.search({ to: query }, { uid: true }),
      ])
      const uids = [...new Set(found.flatMap(result => result === false ? [] : result))].sort((a, b) => a - b)
      uids.reverse()
      const messages = await this.fetchListed(client, uids.slice(0, limit))
      return { account: name, query, count: uids.length, folder: folderName, messages }
    })
  }

  private async fetchListed(client: ImapFlow, uids: number[]): Promise<ListedMessage[]> {
    if (uids.length === 0) return []
    const fetched = await client.fetchAll(
      uids,
      { uid: true, envelope: true, flags: true, size: true, bodyStructure: true },
      { uid: true },
    )
    return fetched.map(message => listedFrom(message, message.size, structureHasAttachment(message.bodyStructure)))
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

  async downloadAttachment(accountName: string | undefined, folder: string, uid: number, index: number): Promise<EmailAttachmentResult> {
    const name = this.resolveName(accountName)
    const cfg = this.account(name)
    const folderName = folder || cfg.inboxFolder
    return this.withImap(name, folderName, async (client) => {
      const message = await client.fetchOne(uid, { uid: true, bodyStructure: true }, { uid: true })
      if (message === false) {
        throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"）')
      }
      const attachments = collectAttachmentParts(message.bodyStructure)
      if (attachments.length === 0) throw new MailError('该邮件没有附件')
      const att = attachments[index]
      if (att === undefined) {
        throw new MailError('附件序号 ' + index + ' 越界：共 ' + attachments.length + ' 个附件（序号从 0 开始，与 email_read 返回的 attachments 顺序一致）')
      }
      if (att.size > this.settings.maxAttachmentBytes) {
        throw new MailError('附件 "' + att.filename + '" 大小 ' + att.size + ' 字节，超过上限 maxAttachmentBytes=' + this.settings.maxAttachmentBytes)
      }
      const dl = await client.download(uid, att.part, { uid: true, maxBytes: this.settings.maxAttachmentBytes })
      const buf = await collectStream(dl.content, this.settings.maxAttachmentBytes)
      const safeName = sanitizeFilename(dl.meta.filename ?? att.filename)
      const dir = this.settings.downloadDir
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
}

/** Stat every attachment path up front; total size must stay under the cap. */
export async function validateAttachmentPaths(paths: string[], maxBytes: number): Promise<Array<{ path: string }>> {
  const out: Array<{ path: string }> = []
  let total = 0
  for (const path of paths) {
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
