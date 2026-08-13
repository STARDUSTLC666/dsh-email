import { ImapFlow } from 'imapflow'
import nodemailer from 'nodemailer'
import type { ResolvedEmailConfig } from './config.js'
import { flattenAddresses } from './parse.js'
import { parseRawMessage } from './parse.js'
import type {
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

/** One IMAP account; every operation opens its own short-lived connection. */
export class MailClient {
  constructor(private readonly config: ResolvedEmailConfig) {}

  private createImap(): ImapFlow {
    return new ImapFlow({
      host: this.config.imap.host,
      port: this.config.imap.port,
      secure: this.config.imap.secure,
      auth: { user: this.config.user, pass: this.config.password },
      logger: false,
      connectionTimeout: this.config.imap.connectionTimeoutMs ?? 30000,
      greetingTimeout: 30000,
      socketTimeout: this.config.imap.socketTimeoutMs ?? 60000,
    })
  }

  /** Open the mailbox read-only, run the operation, always close. */
  private async withImap<T>(folder: string, run: (client: ImapFlow) => Promise<T>): Promise<T> {
    const client = this.createImap()
    try {
      await client.connect()
      await client.mailboxOpen(folder, { readOnly: true })
      return await run(client)
    } catch (error) {
      const raw = messageOf(error, 'IMAP 操作失败')
      if (raw.toLowerCase().includes('authentication') || raw.toLowerCase().includes('login')) {
        throw new MailError(`邮箱登录失败：${raw}（请检查 user 与授权码）`)
      }
      if (raw.toLowerCase().includes('nonselect') || raw.toLowerCase().includes('does not exist')) {
        throw new MailError(`找不到邮箱文件夹 "${folder}"：${raw}`)
      }
      throw new MailError(raw)
    } finally {
      try { await client.logout() } catch { /* already closed */ }
    }
  }

  private static fetchQuery = { uid: true, envelope: true, flags: true, size: true, bodyStructure: true } as const

  async list(folder: string, limit: number, offset: number, unreadOnly: boolean): Promise<EmailListResult> {
    return this.withImap(folder, async (client) => {
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
        const fetched = await client.fetchAll(`${start}:*`, { uid: true }, { uid: true })
        uids = fetched.map(message => message.uid)
      }
      // newest first, then the requested window
      uids.reverse()
      const window = uids.slice(offset, offset + limit)
      const messages = await this.fetchListed(client, window)
      return { count: scopeCount, folder, messages }
    })
  }

  async search(query: string, folder: string, limit: number): Promise<EmailSearchResult> {
    return this.withImap(folder, async (client) => {
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
      return { query, count: uids.length, folder, messages }
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

  async read(uid: number, folder: string): Promise<EmailReadResult> {
    return this.withImap(folder, async (client) => {
      const message = await client.fetchOne(uid, { uid: true, source: true }, { uid: true })
      if (message === false || message.source === undefined) {
        throw new MailError(`找不到 uid=${uid} 的邮件（可能已被删除，或不在文件夹 "${folder}"；可用 email_list 重新获取 uid）`)
      }
      const body = await parseRawMessage(message.source, this.config.maxBodyChars)
      return { uid, folder, ...body }
    })
  }

  async send(to: string, subject: string, text: string | undefined, cc: string | undefined): Promise<EmailSendResult> {
    const transporter = nodemailer.createTransport({
      host: this.config.smtp.host,
      port: this.config.smtp.port,
      secure: this.config.smtp.secure,
      auth: { user: this.config.user, pass: this.config.password },
      connectionTimeout: 30000,
      greetingTimeout: 10000,
      socketTimeout: 60000,
    })
    try {
      const info = await transporter.sendMail({
        from: this.config.user,
        to,
        cc,
        subject,
        text: text ?? '',
      })
      return {
        messageId: info.messageId,
        accepted: info.accepted.map(String),
        rejected: info.rejected.map(String),
        response: info.response,
      }
    } catch (error) {
      const raw = messageOf(error, 'SMTP 发送失败')
      throw new MailError(raw.toLowerCase().includes('auth') ? `SMTP 登录失败：${raw}（请检查 user 与授权码）` : raw)
    } finally {
      transporter.close()
    }
  }
}