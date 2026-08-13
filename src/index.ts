import { clampInt, resolveEmailConfig, type EmailConfig, PROVIDER_NAMES } from './config.js'
import { MailClient, messageOf } from './mail-client.js'
import type {
  EmailListArgs,
  EmailListResult,
  EmailReadArgs,
  EmailReadResult,
  EmailSearchArgs,
  EmailSearchResult,
  EmailSendArgs,
  EmailSendResult,
} from './types.js'

export const name = 'tool-email'
export const inject = ['tools']
export type Config = EmailConfig

const MAX_LIMIT = 100

/** Loose-but-typed output schema; values below carry every declared field. */
const listSchema = {
  type: 'object',
  properties: {
    count: { type: 'integer' },
    folder: { type: 'string' },
    messages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          uid: { type: 'integer' },
          date: { type: 'string' },
          from: { type: 'array', items: { type: 'object', additionalProperties: true } },
          subject: { type: 'string' },
          seen: { type: 'boolean' },
          flagged: { type: 'boolean' },
          size: { type: 'integer' },
          hasAttachments: { type: 'boolean' },
        },
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
}

const readSchema = {
  type: 'object',
  properties: {
    uid: { type: 'integer' },
    folder: { type: 'string' },
    date: { type: 'string' },
    from: { type: 'array', items: { type: 'object', additionalProperties: true } },
    to: { type: 'array', items: { type: 'object', additionalProperties: true } },
    cc: { type: 'array', items: { type: 'object', additionalProperties: true } },
    subject: { type: 'string' },
    text: { type: 'string' },
    attachments: { type: 'array', items: { type: 'object', additionalProperties: true } },
    truncated: { type: 'boolean' },
  },
  additionalProperties: true,
}

const sendSchema = {
  type: 'object',
  properties: {
    messageId: { type: 'string' },
    accepted: { type: 'array', items: { type: 'string' } },
    rejected: { type: 'array', items: { type: 'string' } },
    response: { type: 'string' },
  },
  additionalProperties: true,
}

function oneText(text: string): Array<{ type: 'text'; text: string }> {
  return [{ type: 'text', text }]
}

function describeMessage(message: EmailListResult['messages'][number]): string {
  const from = message.from.map(a => a.name ?? a.address).filter(Boolean).join(', ') || '(未知)'
  const flags = [
    message.seen ? '' : '未读',
    message.flagged ? '已标星' : '',
    message.hasAttachments ? '含附件' : '',
  ].filter(Boolean)
  const parts = [`uid=${message.uid}`, from, message.date]
  if (flags.length > 0) parts.push(flags.join('、'))
  return `${message.subject || '(无主题)'} [${parts.join(' | ')}]`
}

function renderList(value: EmailListResult): Array<{ type: 'text'; text: string }> {
  if (value.messages.length === 0) {
    return oneText(`文件夹 "${value.folder}" 共 ${value.count} 封邮件，本次没有要列出的邮件。`)
  }
  const lines = value.messages.map((m, i) => `#${i + 1} ${describeMessage(m)}`)
  return oneText(`文件夹 "${value.folder}" 共 ${value.count} 封邮件，最新 ${value.messages.length} 封：\n\n${lines.join('\n')}\n\n用 email_read 配合 uid 阅读全文。`)
}

function renderRead(value: EmailReadResult): Array<{ type: 'text'; text: string }> {
  const from = value.from.map(a => a.name ?? a.address).filter(Boolean).join(', ') || '(未知)'
  const attach = value.attachments.length > 0
    ? `\n附件：${value.attachments.map(a => `${a.filename}（${a.contentType}，${a.size} 字节）`).join('；')}`
    : ''
  return oneText(`主题：${value.subject || '(无主题)'}\n来自：${from}\n时间：${value.date || '(未知)'}${attach}\n\n${value.text}`)
}

function renderSearch(value: EmailSearchResult): Array<{ type: 'text'; text: string }> {
  if (value.messages.length === 0) {
    return oneText(`在文件夹 "${value.folder}" 中搜索 "${value.query}"：共 ${value.count} 条匹配，本次没有列出。`)
  }
  const lines = value.messages.map((m, i) => `#${i + 1} ${describeMessage(m)}`)
  return oneText(`在文件夹 "${value.folder}" 中搜索 "${value.query}"：共 ${value.count} 条匹配，展示最新 ${value.messages.length} 条：\n\n${lines.join('\n')}`)
}

function renderSend(value: EmailSendResult): Array<{ type: 'text'; text: string }> {
  const rejected = value.rejected.length > 0 ? `；被拒：${value.rejected.join(', ')}` : ''
  return oneText(`邮件已发送，messageId: ${value.messageId}；成功送达：${value.accepted.join(', ')}${rejected}；服务器响应：${value.response}`)
}

export function apply(ctx: any, config: Config = {}): void {
  // Load-time nudge only: never break boot, tools report the details instead.
  try {
    resolveEmailConfig(config)
  } catch (error) {
    ctx.logger?.warn?.(`[dsh-email] ${messageOf(error, '未配置邮箱账号')}`)
  }

  const resolve = () => resolveEmailConfig(config)

  ctx.tools.register({
    name: 'email_list',
    description: 'List recent emails in a mailbox folder (newest first). Returns uid, date, sender, subject and flags without message bodies; use email_read with a uid to fetch the full text.',
    parameters: {
      folder: { type: 'string', description: `IMAP folder name, default "${resolveSafeFolder(config)}" (the configured inboxFolder)` },
      limit: { type: 'integer', description: 'How many messages to return, 1-100, default 20' },
      offset: { type: 'integer', description: 'Skip this many newest messages first, default 0' },
      unreadOnly: { type: 'boolean', description: 'Only list unread messages, default false' },
    },
    output: {
      schema: listSchema,
      render: (_args: unknown, value: unknown) => renderList(value as EmailListResult),
    },
    async execute(rawArgs: unknown) {
      const args = rawArgs as EmailListArgs
      const cfg = resolve()
      const limit = clampInt(args.limit, 20, 1, MAX_LIMIT)
      const offset = clampInt(args.offset, 0, 0, 10000)
      return await new MailClient(cfg).list(
        args.folder?.trim() || cfg.inboxFolder,
        limit,
        offset,
        args.unreadOnly === true,
      )
    },
  })

  ctx.tools.register({
    name: 'email_read',
    description: 'Read one full email message by its uid (from email_list or email_search). Returns the plain-text body (HTML mail is converted; oversized bodies are truncated) plus attachment metadata.',
    parameters: {
      uid: { type: 'integer', required: true, description: 'Message uid from email_list or email_search' },
      folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the configured inboxFolder' },
    },
    output: {
      schema: readSchema,
      render: (_args: unknown, value: unknown) => renderRead(value as EmailReadResult),
    },
    async execute(rawArgs: unknown) {
      const args = rawArgs as EmailReadArgs
      const cfg = resolve()
      if (typeof args.uid !== 'number' || !Number.isInteger(args.uid) || args.uid <= 0) {
        throw new Error('uid 必须是正整数（用 email_list 获取）')
      }
      return await new MailClient(cfg).read(args.uid, args.folder?.trim() || cfg.inboxFolder)
    },
  })

  ctx.tools.register({
    name: 'email_search',
    description: 'Search emails by a keyword matched against sender, recipient and subject (server-side IMAP SEARCH). Body search is not supported by every server and is not attempted; returns the same compact rows as email_list.',
    parameters: {
      query: { type: 'string', required: true, description: 'Keyword to search for' },
      folder: { type: 'string', description: 'IMAP folder to search in; defaults to the configured inboxFolder' },
      limit: { type: 'integer', description: 'How many matches to return, 1-100, default 10' },
    },
    output: {
      schema: listSchema,
      render: (_args: unknown, value: unknown) => renderSearch(value as EmailSearchResult),
    },
    async execute(rawArgs: unknown) {
      const args = rawArgs as EmailSearchArgs
      const cfg = resolve()
      if (typeof args.query !== 'string' || args.query.trim() === '') throw new Error('query 不能为空')
      const limit = clampInt(args.limit, 10, 1, MAX_LIMIT)
      return await new MailClient(cfg).search(args.query.trim(), args.folder?.trim() || cfg.inboxFolder, limit)
    },
  })

  ctx.tools.register({
    name: 'email_send',
    description: 'Send an email from the configured account. Sending first asks the user for approval (recipient and subject are shown) unless sendApproval is disabled; never invent recipients or content without the user\'s instruction.',
    parameters: {
      to: { type: 'string', required: true, description: 'Recipient(s), comma-separated' },
      subject: { type: 'string', required: true, description: 'Email subject' },
      text: { type: 'string', description: 'Plain-text body' },
      cc: { type: 'string', description: 'CC recipient(s), comma-separated' },
    },
    output: {
      schema: sendSchema,
      render: (_args: unknown, value: unknown) => renderSend(value as EmailSendResult),
    },
    async execute(rawArgs: unknown) {
      const args = rawArgs as EmailSendArgs
      const cfg = resolve()
      if (typeof args.to !== 'string' || args.to.trim() === '') throw new Error('to 不能为空')
      if (typeof args.subject !== 'string' || args.subject.trim() === '') throw new Error('subject 不能为空')
      return await new MailClient(cfg).send(
        args.to.trim(),
        args.subject.trim(),
        typeof args.text === 'string' ? args.text : undefined,
        typeof args.cc === 'string' && args.cc.trim() !== '' ? args.cc.trim() : undefined,
      )
    },
  })

  // Approval gate: the user must confirm every send (recipient + subject).
  // Runs before other listeners; degrades to "the tool fails at send time"
  // only when the account itself is not configured yet.
  ctx.on('tools/pre-execute', async (exec: any, next: () => Promise<any>) => {
    if (exec?.name !== 'email_send') return next()
    if (config.sendApproval === false) return next()
    try { resolve() } catch { return next() }
    const args = (exec.args ?? {}) as EmailSendArgs
    return { kind: 'ask', reason: `发送邮件给 ${args.to}，主题「${args.subject}」` }
  }, { prepend: true })
}

function resolveSafeFolder(config: EmailConfig): string {
  return config.inboxFolder?.trim() || 'INBOX'
}

export { PROVIDER_NAMES, EMAIL_PASSWORD_ENV } from './config.js'
export { resolveEmailConfig, clampInt } from './config.js'
export { stripHtml, truncateText, flattenAddresses, parseRawMessage } from './parse.js'
export { MailClient, MailError, messageOf } from './mail-client.js'