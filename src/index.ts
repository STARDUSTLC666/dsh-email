import { clampInt, resolveEmailSettings, type EmailConfig, PROVIDER_NAMES } from './config.js'
import { EmailPool, messageOf } from './mail-client.js'
import type {
  EmailAttachmentArgs,
  EmailAttachmentResult,
  EmailFoldersArgs,
  EmailFoldersResult,
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
const ACCOUNT_HINT = '账号名（配置了 accounts 多个账号时选择），省略时用 defaultAccount。可用账号见 email_folders 的报错或插件 README'

const strArray = { type: 'array', items: { type: 'string' } }
const addrArray = { type: 'array', items: { type: 'object', additionalProperties: true } }
const messageShape = {
  uid: { type: 'integer' },
  date: { type: 'string' },
  from: addrArray,
  subject: { type: 'string' },
  seen: { type: 'boolean' },
  flagged: { type: 'boolean' },
  size: { type: 'integer' },
  hasAttachments: { type: 'boolean' },
}

const listSchema = {
  type: 'object',
  properties: {
    account: { type: 'string' },
    count: { type: 'integer' },
    folder: { type: 'string' },
    messages: { type: 'array', items: { type: 'object', properties: messageShape, additionalProperties: true } },
  },
  additionalProperties: true,
}

const readSchema = {
  type: 'object',
  properties: {
    account: { type: 'string' },
    uid: { type: 'integer' },
    folder: { type: 'string' },
    date: { type: 'string' },
    from: addrArray,
    to: addrArray,
    cc: addrArray,
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
    account: { type: 'string' },
    messageId: { type: 'string' },
    accepted: strArray,
    rejected: strArray,
    response: { type: 'string' },
  },
  additionalProperties: true,
}

const foldersSchema = {
  type: 'object',
  properties: {
    account: { type: 'string' },
    folders: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          specialUse: { type: 'string' },
          subscribed: { type: 'boolean' },
        },
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
}

const attachmentSchema = {
  type: 'object',
  properties: {
    account: { type: 'string' },
    uid: { type: 'integer' },
    filename: { type: 'string' },
    contentType: { type: 'string' },
    size: { type: 'integer' },
    path: { type: 'string' },
  },
  additionalProperties: true,
}

type TextBlock = { type: 'text'; text: string }
function oneText(text: string): TextBlock[] {
  return [{ type: 'text', text }]
}

function describeMessage(message: EmailListResult['messages'][number]): string {
  const from = message.from.map(a => a.name ?? a.address).filter(Boolean).join(', ') || '(未知)'
  const flags = [
    message.seen ? '' : '未读',
    message.flagged ? '已标星' : '',
    message.hasAttachments ? '含附件' : '',
  ].filter(Boolean)
  const parts = ['uid=' + message.uid, from, message.date]
  if (flags.length > 0) parts.push(flags.join('、'))
  return (message.subject || '(无主题)') + ' [' + parts.join(' | ') + ']'
}

function renderList(value: EmailListResult): TextBlock[] {
  if (value.messages.length === 0) {
    return oneText('账号 ' + value.account + '，文件夹 "' + value.folder + '" 共 ' + value.count + ' 封邮件，本次没有要列出的邮件。')
  }
  const lines = value.messages.map((m, i) => '#' + (i + 1) + ' ' + describeMessage(m))
  return oneText('账号 ' + value.account + '，文件夹 "' + value.folder + '" 共 ' + value.count + ' 封邮件，最新 ' + value.messages.length + ' 封：\n\n' + lines.join('\n') + '\n\n用 email_read 配合 uid 阅读全文。')
}

function renderRead(value: EmailReadResult): TextBlock[] {
  const from = value.from.map(a => a.name ?? a.address).filter(Boolean).join(', ') || '(未知)'
  const attach = value.attachments.length > 0
    ? '\n附件：' + value.attachments.map((a, i) => '#' + i + ' ' + a.filename + '（' + a.contentType + '，' + a.size + ' 字节）').join('；') + '\n（用 email_attachment 配合 uid 与序号下载）'
    : ''
  return oneText('账号 ' + value.account + '，主题：' + (value.subject || '(无主题)') + '\n来自：' + from + '\n时间：' + (value.date || '(未知)') + attach + '\n\n' + value.text)
}

function renderSearch(value: EmailSearchResult): TextBlock[] {
  if (value.messages.length === 0) {
    return oneText('账号 ' + value.account + '，在文件夹 "' + value.folder + '" 中搜索 "' + value.query + '"：共 ' + value.count + ' 条匹配，本次没有列出。')
  }
  const lines = value.messages.map((m, i) => '#' + (i + 1) + ' ' + describeMessage(m))
  return oneText('账号 ' + value.account + '，在文件夹 "' + value.folder + '" 中搜索 "' + value.query + '"：共 ' + value.count + ' 条匹配，展示最新 ' + value.messages.length + ' 条：\n\n' + lines.join('\n'))
}

function renderSend(value: EmailSendResult): TextBlock[] {
  const rejected = value.rejected.length > 0 ? '；被拒：' + value.rejected.join(', ') : ''
  return oneText('账号 ' + value.account + ' 邮件已发送，messageId: ' + value.messageId + '；成功送达：' + value.accepted.join(', ') + rejected + '；服务器响应：' + value.response)
}

function renderFolders(value: EmailFoldersResult): TextBlock[] {
  if (value.folders.length === 0) return oneText('账号 ' + value.account + '：未列出任何文件夹。')
  const lines = value.folders.map((f, i) => '#' + (i + 1) + ' ' + f.path + (f.specialUse !== '' ? ' [' + f.specialUse + ']' : '') + (f.subscribed ? '' : '（未订阅）'))
  return oneText('账号 ' + value.account + ' 的文件夹（' + value.folders.length + ' 个）：\n\n' + lines.join('\n') + '\n\n把 folder 参数填成其中的 path 即可。')
}

function renderAttachment(value: EmailAttachmentResult): TextBlock[] {
  return oneText('账号 ' + value.account + ' 已下载附件 "' + value.filename + '"（' + value.contentType + '，' + value.size + ' 字节）到：\n' + value.path + '\n可用 read 工具读取该文件。')
}

export function apply(ctx: any, config: Config = {}): void {
  let settingsError = ''
  let settings: ReturnType<typeof resolveEmailSettings> | null = null
  try {
    settings = resolveEmailSettings(config)
  } catch (error) {
    settingsError = messageOf(error, 'dsh-email 配置无效')
    ctx.logger?.warn?.('[dsh-email] ' + settingsError)
  }
  let pool: EmailPool | null = null
  const getPool = (): EmailPool => {
    if (settingsError !== '') throw new Error(settingsError)
    if (pool === null) {
      pool = new EmailPool(settings!)
      pool.startIdleSweep()
    }
    return pool
  }
  ctx.effect(() => () => {
    pool?.dispose()
    pool = null
  })

  ctx.tools.register({
    name: 'email_list',
    description: 'List recent emails in a mailbox folder (newest first). Returns uid, date, sender, subject and flags without message bodies; use email_read with a uid to fetch the full text.'
,
    parameters: {
      folder: { type: 'string', description: 'IMAP folder path (see email_folders); defaults to the account inboxFolder' },
      limit: { type: 'integer', description: 'How many messages to return, 1-100, default 20' },
      offset: { type: 'integer', description: 'Skip this many newest messages first, default 0' },
      unreadOnly: { type: 'boolean', description: 'Only list unread messages, default false' },
      account: { type: 'string', description: ACCOUNT_HINT },
    },
    output: {
      schema: listSchema,
      render: (_args: unknown, value: unknown) => renderList(value as EmailListResult),
    },
    async execute(rawArgs: unknown) {
      const args = rawArgs as EmailListArgs
      const limit = clampInt(args.limit, 20, 1, MAX_LIMIT)
      const offset = clampInt(args.offset, 0, 0, 10000)
      return await getPool().list(args.account, args.folder?.trim() || '', limit, offset, args.unreadOnly === true)
    },
  })

  ctx.tools.register({
    name: 'email_read',
    description: 'Read one full email message by its uid (from email_list or email_search). Returns the plain-text body (HTML mail is converted; oversized bodies are truncated) plus attachment metadata; use email_attachment to download one.'
,
    parameters: {
      uid: { type: 'integer', required: true, description: 'Message uid from email_list or email_search' },
      folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
      account: { type: 'string', description: ACCOUNT_HINT },
    },
    output: {
      schema: readSchema,
      render: (_args: unknown, value: unknown) => renderRead(value as EmailReadResult),
    },
    async execute(rawArgs: unknown) {
      const args = rawArgs as EmailReadArgs
      if (typeof args.uid !== 'number' || !Number.isInteger(args.uid) || args.uid <= 0) {
        throw new Error('uid 必须是正整数（用 email_list 获取）')
      }
      return await getPool().read(args.account, args.uid, args.folder?.trim() || '')
    },
  })

  ctx.tools.register({
    name: 'email_search',
    description: 'Search emails by a keyword matched against sender, recipient and subject (server-side IMAP SEARCH). Body search is not supported by every server and is not attempted; returns the same compact rows as email_list.'
,
    parameters: {
      query: { type: 'string', required: true, description: 'Keyword to search for' },
      folder: { type: 'string', description: 'IMAP folder to search in; defaults to the account inboxFolder' },
      limit: { type: 'integer', description: 'How many matches to return, 1-100, default 10' },
      account: { type: 'string', description: ACCOUNT_HINT },
    },
    output: {
      schema: listSchema,
      render: (_args: unknown, value: unknown) => renderSearch(value as EmailSearchResult),
    },
    async execute(rawArgs: unknown) {
      const args = rawArgs as EmailSearchArgs
      if (typeof args.query !== 'string' || args.query.trim() === '') throw new Error('query 不能为空')
      const limit = clampInt(args.limit, 10, 1, MAX_LIMIT)
      return await getPool().search(args.account, args.query.trim(), args.folder?.trim() || '', limit)
    },
  })

  ctx.tools.register({
    name: 'email_send',
    description: 'Send an email from a configured account, optionally with file attachments (absolute paths, or relative to the dsh process cwd). Sending first asks the user for approval (recipient, subject and attachment count are shown) unless sendApproval is disabled; never invent recipients or content without the user\'s instruction.'
,
    parameters: {
      to: { type: 'string', required: true, description: 'Recipient(s), comma-separated' },
      subject: { type: 'string', required: true, description: 'Email subject' },
      text: { type: 'string', description: 'Plain-text body' },
      cc: { type: 'string', description: 'CC recipient(s), comma-separated' },
      attachments: { type: 'array', items: { type: 'string' }, description: 'File paths to attach (absolute, or relative to the dsh process cwd)' },
      account: { type: 'string', description: ACCOUNT_HINT },
    },
    output: {
      schema: sendSchema,
      render: (_args: unknown, value: unknown) => renderSend(value as EmailSendResult),
    },
    async execute(rawArgs: unknown) {
      const args = rawArgs as EmailSendArgs
      if (typeof args.to !== 'string' || args.to.trim() === '') throw new Error('to 不能为空')
      if (typeof args.subject !== 'string' || args.subject.trim() === '') throw new Error('subject 不能为空')
      return await getPool().send(
        args.account,
        args.to.trim(),
        args.subject.trim(),
        typeof args.text === 'string' ? args.text : undefined,
        typeof args.cc === 'string' && args.cc.trim() !== '' ? args.cc.trim() : undefined,
        Array.isArray(args.attachments) ? args.attachments : undefined,
      )
    },
  })

  ctx.tools.register({
    name: 'email_folders',
    description: 'List the mailbox folders of an account (INBOX, Sent, Trash, custom folders, ...). Use the returned path values as the folder argument of the other email tools.'
,
    parameters: {
      subscribedOnly: { type: 'boolean', description: 'Only subscribed folders, default false' },
      account: { type: 'string', description: ACCOUNT_HINT },
    },
    output: {
      schema: foldersSchema,
      render: (_args: unknown, value: unknown) => renderFolders(value as EmailFoldersResult),
    },
    async execute(rawArgs: unknown) {
      const args = rawArgs as EmailFoldersArgs
      return await getPool().folders(args.account, args.subscribedOnly === true)
    },
  })

  ctx.tools.register({
    name: 'email_attachment',
    description: 'Download one attachment of a message to a local file (size capped by maxAttachmentBytes). The index matches the attachments array of email_read. Returns the absolute path of the written file.'
,
    parameters: {
      uid: { type: 'integer', required: true, description: 'Message uid from email_list or email_search' },
      index: { type: 'integer', description: '0-based attachment index, as listed by email_read; default 0' },
      folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
      account: { type: 'string', description: ACCOUNT_HINT },
    },
    output: {
      schema: attachmentSchema,
      render: (_args: unknown, value: unknown) => renderAttachment(value as EmailAttachmentResult),
    },
    async execute(rawArgs: unknown) {
      const args = rawArgs as EmailAttachmentArgs
      if (typeof args.uid !== 'number' || !Number.isInteger(args.uid) || args.uid <= 0) {
        throw new Error('uid 必须是正整数（用 email_list 获取）')
      }
      const index = clampInt(args.index, 0, 0, 999)
      return await getPool().downloadAttachment(args.account, args.folder?.trim() || '', args.uid, index)
    },
  })

  // Approval gate: the user must confirm every send (recipient + subject).
  // Runs before other listeners; degrades to the tool-time failure only
  // when the account itself is not configured yet.
  ctx.on('tools/pre-execute', async (exec: any, next: () => Promise<any>) => {
    if (exec?.name !== 'email_send') return next()
    if (config.sendApproval === false) return next()
    if (settingsError !== '') return next()
    const args = (exec.args ?? {}) as EmailSendArgs
    const attachCount = Array.isArray(args.attachments) ? args.attachments.length : 0
    const reason = '发送邮件给 ' + args.to + '，主题「' + args.subject + '」' + (attachCount > 0 ? '，附件 ' + attachCount + ' 个' : '')
    return { kind: 'ask', reason }
  }, { prepend: true })
}

export { PROVIDER_NAMES, EMAIL_PASSWORD_ENV } from './config.js'
export { resolveEmailConfig, resolveEmailSettings, clampInt, defaultDownloadDir } from './config.js'
export { stripHtml, truncateText, flattenAddresses, sanitizeFilename, parseRawMessage } from './parse.js'
export { EmailPool, MailError, messageOf, validateAttachmentPaths } from './mail-client.js'
