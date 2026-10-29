import { randomUUID } from 'node:crypto'
import { mkdir, open, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { simpleParser } from 'mailparser'
import { compile as compileHtmlToText } from 'html-to-text'
import type { ResolvedEmailSettings } from './config.js'
import { clampInt } from './config.js'
import { extractMessageIds, messageMatchesQuery, type OriginalDigest } from './mail-client.js'
import { flattenAddresses, sanitizeFilename, truncateText } from './parse.js'
import { Pop3CommandError, Pop3WireError, withPop3, type Pop3Wire, type Pop3WireOptions } from './pop3-wire.js'
import type { EmailAttachmentResult, EmailListResult, EmailReadResult, EmailSearchOptions, EmailSearchResult, EmailWatchResult, ListedMessage } from './types.js'

const MESSAGE_LIMIT = 32 * 1024 * 1024
const HTML_CONVERSION_LIMIT = 2 * 1024 * 1024
const HTML_LIMIT_MARKER = '\u0000DSH_POP3_HTML_LIMIT\u0000'
const htmlToText = compileHtmlToText({ wordwrap: false, limits: { maxInputLength: HTML_CONVERSION_LIMIT, maxDepth: 128, maxChildNodes: 10000, ellipsis: HTML_LIMIT_MARKER } })
interface Entry { number: number; uid: string; size: number }
const opaque = (uid: string) => 'pop3:' + Buffer.from(uid, 'ascii').toString('base64url')
const lines = (bytes?: Buffer) => (bytes?.toString('ascii') ?? '').split('\r\n').filter(Boolean)
const noFlags = () => new Error('POP3 不提供服务器已读、星标或移动状态；请使用 IMAP 账号进行这些操作')

/** Read-only maildrop. Stable UIDL identities are re-resolved in every transaction. */
export class Pop3Client {
  private active = new Set<AbortController>()
  private queues = new Map<string, Promise<unknown>>()
  private headers = new Map<string, ListedMessage>()
  private watches = new Map<string, { known: Set<string>; pending: string[] }>()
  private closed = false
  constructor(private settings: ResolvedEmailSettings, private options: Pop3WireOptions = {}) {}
  private account(name: string) {
    const cfg = this.settings.accounts.get(name)
    if (cfg?.transport !== 'pop3') throw new Error('POP3 账号不存在')
    return cfg
  }
  private folder(folder: string) { if (folder !== 'INBOX') throw new Error('POP3 只提供 INBOX 收件箱；已发送、归档和其他文件夹请使用 IMAP') }
  private async session<T>(name: string, fn: (wire: Pop3Wire) => Promise<T>, signal?: AbortSignal): Promise<T> {
    const cfg = this.account(name), controller = new AbortController()
    const combined = AbortSignal.any([controller.signal, ...(signal ? [signal] : [])])
    if (this.closed) throw new Error('POP3 账号已关闭，请重试')
    combined.throwIfAborted(); this.active.add(controller)
    const previous = this.queues.get(name) ?? Promise.resolve()
    const next = previous.catch(() => {}).then(() => { combined.throwIfAborted(); return withPop3(cfg, fn, combined, this.options) })
    this.queues.set(name, next)
    let onAbort: () => void = () => {}
    try { return await Promise.race([next, new Promise<never>((_, reject) => { onAbort = () => reject(combined.reason); combined.addEventListener('abort', onAbort, { once: true }); if (combined.aborted) onAbort() })]) }
    finally { combined.removeEventListener('abort', onAbort); this.active.delete(controller); if (this.queues.get(name) === next) void next.catch(() => {}).finally(() => { if (this.queues.get(name) === next) this.queues.delete(name) }) }
  }
  private async index(wire: Pop3Wire): Promise<Entry[]> {
    let ids: string[]
    try { ids = lines((await wire.command('UIDL')).bytes) }
    catch (error) { if (error instanceof Pop3CommandError) throw new Pop3WireError('POP3 服务器未提供 UIDL，无法稳定定位邮件；请启用 UIDL 或改用 IMAP'); throw error }
    const sizes = new Map<number, number>(), seen = new Set<string>(), numbers = new Set<number>()
    for (const line of lines((await wire.command('LIST')).bytes)) {
      const match = /^(\d+) (\d+)$/.exec(line)
      if (!match || !Number.isSafeInteger(Number(match[1])) || Number(match[1]) < 1 || !Number.isSafeInteger(Number(match[2])) || sizes.has(Number(match[1]))) throw new Pop3WireError('POP3 邮件大小列表无效，请重试')
      sizes.set(Number(match[1]), Number(match[2]))
    }
    if (ids.length > 50000 || sizes.size !== ids.length) throw new Pop3WireError('POP3 邮箱过大或列表不一致；最多支持 50000 封，请整理邮箱或使用 IMAP')
    return ids.map(line => {
      const match = /^(\d+) ([\x21-\x7e]{1,70})$/.exec(line)
      if (!match) throw new Pop3WireError('POP3 UIDL 列表无效')
      const number = Number(match[1]), uid = opaque(match[2])
      if (!sizes.has(number) || seen.has(uid) || numbers.has(number)) throw new Pop3WireError('POP3 邮件标识重复或列表不一致，已停止读取')
      seen.add(uid); numbers.add(number); return { number, uid, size: sizes.get(number)! }
    }).sort((a, b) => b.number - a.number)
  }
  private entry(entries: Entry[], uid: number | string) {
    if (typeof uid !== 'string' || !/^pop3:[A-Za-z0-9_-]{1,94}$/.test(uid)) throw new Pop3WireError('请使用 POP3 列表中的完整 uid，不要使用邮件序号或 IMAP UID')
    const row = entries.find(e => e.uid === uid)
    if (!row) throw new Pop3WireError('POP3 原邮件已不存在，请刷新列表；不会按旧序号读取另一封邮件')
    return row
  }
  private async raw(wire: Pop3Wire, entry: Entry): Promise<Buffer> {
    if (entry.size > MESSAGE_LIMIT) throw new Pop3WireError('POP3 整封邮件超过 32 MiB，请使用邮箱客户端处理')
    const { bytes } = await wire.command('RETR', [entry.number], MESSAGE_LIMIT)
    if (!bytes) throw new Pop3WireError('POP3 未返回邮件正文')
    return bytes
  }
  private async parsed(bytes: Buffer) {
    try {
      return await simpleParser(bytes, { skipHtmlToText: true, skipTextToHtml: true, keepCidLinks: true })
    } catch {
      throw new Pop3WireError('POP3 邮件内容无法解析，请使用邮箱客户端查看')
    }
  }
  private async header(wire: Pop3Wire, name: string, entry: Entry): Promise<ListedMessage> {
    const key = name + '\0' + entry.uid, cached = this.headers.get(key)
    if (cached) return { ...cached, size: entry.size }
    let bytes: Buffer
    try { bytes = (await wire.command('TOP', [entry.number, 0], 256 * 1024)).bytes ?? Buffer.alloc(0) }
    catch (error) { if (!(error instanceof Pop3CommandError) || error.command !== 'TOP') throw error; bytes = await this.raw(wire, entry) }
    const parsed = await this.parsed(bytes)
    wire.signal.throwIfAborted()
    const row: ListedMessage = { uid: entry.uid, date: parsed.date instanceof Date ? parsed.date.toISOString() : '',
      subject: (parsed.subject ?? '').slice(0, 4096), from: flattenAddresses(parsed.from).slice(0, 20),
      seen: false, flagged: false, flagsSupported: false, size: entry.size, hasAttachments: (parsed.attachments?.length ?? 0) > 0 }
    this.headers.set(key, row); while (this.headers.size > 200) this.headers.delete(this.headers.keys().next().value!)
    return row
  }
  private async message(wire: Pop3Wire, entry: Entry) {
    const bytes = await this.raw(wire, entry), parsed = await this.parsed(bytes)
    wire.signal.throwIfAborted()
    const html = !parsed.text?.trim() && typeof parsed.html === 'string' ? parsed.html : ''
    const omitted = Buffer.byteLength(html, 'utf8') > HTML_CONVERSION_LIMIT
    // Explicitly convert nested HTML-only MIME too; mailparser does not always do so.
    const converted = omitted ? '' : html ? htmlToText(html) : parsed.text ?? ''
    const structureLimited = converted.includes(HTML_LIMIT_MARKER), text = converted.replaceAll(HTML_LIMIT_MARKER, '')
    const body = omitted
      ? { text: '[HTML 正文超过 2 MiB，未转换为文字；请使用邮箱客户端查看。附件仍可下载。]', truncated: true }
      : truncateText(text, this.settings.maxBodyChars)
    if (structureLimited) { body.text += '\n\n[HTML 结构超过转换上限，已省略部分内容；请使用邮箱客户端查看。]'; body.truncated = true }
    const value = { date: parsed.date instanceof Date ? parsed.date.toISOString() : '', from: flattenAddresses(parsed.from), to: flattenAddresses(parsed.to), cc: flattenAddresses(parsed.cc), subject: parsed.subject ?? '', text: body.text,
      truncated: body.truncated, attachments: (parsed.attachments ?? []).map((a, i) => ({ filename: a.filename ?? '(unnamed)', contentType: a.contentType, size: a.size, part: 'attachment-' + i })) }
    return { value, parsed, ids: extractMessageIds(bytes), searchText: text.slice(0, this.settings.maxBodyChars) }
  }
  test(name: string, signal?: AbortSignal) { return this.session(name, async wire => { const entries = await this.index(wire); return { messages: entries.length } }, signal) }
  list(name: string, folder: string, limit: number, offset: number, unread: boolean, since?: Date, until?: Date, signal?: AbortSignal): Promise<EmailListResult> {
    this.folder(folder); if (unread) throw noFlags()
    return this.session(name, async wire => {
      const entries = await this.index(wire), filtered: ListedMessage[] = []
      const scan = since || until ? entries.slice(0, 500) : entries.slice(offset, offset + limit)
      for (const entry of scan) { const row = await this.header(wire, name, entry), time = Date.parse(row.date); if ((!since || time >= since.getTime()) && (!until || time < until.getTime())) filtered.push(row) }
      const constrained = !!(since || until), rows = constrained ? filtered.slice(offset, offset + limit) : filtered
      return { transport: 'pop3', account: name, folder, uidValidity: 0, count: constrained ? filtered.length : entries.length, countExact: !constrained || scan.length === entries.length,
        messages: rows, hasMore: offset + limit < (constrained ? filtered.length : entries.length),
        ...(constrained ? { headerScan: { mailboxTotal: entries.length, scanned: scan.length, matched: filtered.length, scanOffset: 0, scanLimit: 500, complete: scan.length === entries.length } } : {}) }
    }, signal)
  }
  read(name: string, uid: number | string, folder: string, signal?: AbortSignal): Promise<EmailReadResult> {
    this.folder(folder); return this.session(name, async wire => ({ account: name, uid, folder, ...(await this.message(wire, this.entry(await this.index(wire), uid))).value }), signal)
  }
  original(name: string, uid: number | string, folder: string, signal?: AbortSignal): Promise<OriginalDigest> {
    this.folder(folder); return this.session(name, async wire => { const m = await this.message(wire, this.entry(await this.index(wire), uid)); return { ...m.value, ...m.ids } }, signal)
  }
  search(name: string, query: string, folder: string, limit: number, offset: number, since?: Date, until?: Date, signal?: AbortSignal, options: EmailSearchOptions = {}): Promise<EmailSearchResult> {
    this.folder(folder)
    return this.session(name, async wire => {
      const entries = await this.index(wire), start = clampInt(options.headerScanOffset, 0, 0, 1000000000), cap = clampInt(options.headerScanLimit, 100, 1, 500), slice = entries.slice(start, start + cap)
      const matches: ListedMessage[] = [], candidates: Array<{ entry: Entry; row: ListedMessage }> = []
      for (const entry of slice) {
        const row = await this.header(wire, name, entry), time = Date.parse(row.date)
        if ((since && !(time >= since.getTime())) || (until && !(time < until.getTime()))) continue
        candidates.push({ entry, row }); if (messageMatchesQuery(row.subject, row.from.map(a => (a.address ?? '') + ' ' + (a.name ?? '')).join(' '), '', query)) matches.push(row)
      }
      const headerMatched = matches.length; let bodyScanned = 0
      if (!matches.length && this.settings.bodySearchFallback) for (const { entry, row } of candidates.slice(0, this.settings.bodySearchLimit)) {
        const m = await this.message(wire, entry); bodyScanned++
        if (messageMatchesQuery(m.value.subject, row.from.map(a => a.address ?? '').join(' '), m.searchText, query)) matches.push(row)
      }
      const complete = start + slice.length >= entries.length
      return { account: name, folder, query, offset, count: matches.length, countExact: false, countKind: 'scanned', hasMore: offset + limit < matches.length,
        messages: matches.slice(offset, offset + limit), searchSource: bodyScanned ? 'local-body' : 'local-headers', scannedLimit: slice.length,
        headerScan: { mailboxTotal: entries.length, scanned: slice.length, matched: headerMatched, scanOffset: start, scanLimit: cap, complete, ...(!complete ? { nextScanOffset: start + slice.length } : {}) },
        ...(bodyScanned ? { bodyScan: { scanned: bodyScanned, scanLimit: this.settings.bodySearchLimit } } : {}) }
    }, signal)
  }
  downloadAttachment(name: string, folder: string, uid: number | string, index: number, workspace?: string, signal?: AbortSignal): Promise<EmailAttachmentResult> {
    this.folder(folder)
    return this.session(name, async wire => {
      const { parsed } = await this.message(wire, this.entry(await this.index(wire), uid)), attachment = parsed.attachments?.[index]
      if (!Number.isInteger(index) || index < 0 || !attachment) throw new Pop3WireError('附件序号无效，请重新读取邮件查看附件列表')
      const content = attachment.content
      if (!Buffer.isBuffer(content) || content.length > Math.min(this.settings.maxAttachmentBytes, 20 * 1024 * 1024)) throw new Pop3WireError('附件超过下载上限（POP3 最多 20 MiB，整封邮件最多 32 MiB）')
      const filename = sanitizeFilename(attachment.filename), dir = this.settings.downloadDirExplicit ? this.settings.downloadDir : workspace ? join(workspace, '.dsh-email-downloads') : this.settings.downloadDir
      wire.signal.throwIfAborted(); await mkdir(dir, { recursive: true }); const path = join(dir, randomUUID() + '-' + filename), handle = await open(path, 'wx', 0o600)
      try { wire.signal.throwIfAborted(); await handle.writeFile(content); wire.signal.throwIfAborted() }
      catch (error) { await handle.close(); await unlink(path).catch(() => {}); throw error }
      finally { await handle.close() }
      return { account: name, uid, filename, contentType: attachment.contentType, size: content.length, path }
    }, signal)
  }
  watch(name: string, folder: string, limit: number, scope: string, signal?: AbortSignal): Promise<EmailWatchResult> {
    this.folder(folder)
    return this.session(name, async wire => {
      const entries = await this.index(wire), known = new Set(entries.map(e => e.uid)), key = name + '\0' + scope, previous = this.watches.get(key)
      const result = { transport: 'pop3' as const, account: name, folder, totalUnread: 0, totalUnreadExact: false, firstRun: !previous, newCount: 0, messages: [] as ListedMessage[] }
      wire.signal.throwIfAborted()
      if (!previous) { this.watches.set(key, { known, pending: [] }); while (this.watches.size > 8) this.watches.delete(this.watches.keys().next().value!); return result }
      const pending = [...new Set([...previous.pending, ...entries.filter(e => !previous.known.has(e.uid)).map(e => e.uid)])].filter(uid => known.has(uid))
      for (const uid of pending.slice(0, limit)) result.messages.push(await this.header(wire, name, entries.find(e => e.uid === uid)!))
      wire.signal.throwIfAborted(); result.newCount = result.messages.length; this.watches.set(key, { known, pending: pending.slice(result.messages.length) }); return result
    }, signal)
  }
  clear() { this.closed = true; for (const c of this.active) c.abort(new Error('POP3 账号已更新或关闭')); this.headers.clear(); this.watches.clear() }
}
