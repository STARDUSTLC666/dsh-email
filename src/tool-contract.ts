/** Model-facing parameters, input normalization, output schemas and text rendering. */

import type {
  EmailAttachmentResult,
  EmailFolderAction,
  EmailFolderResult,
  EmailFoldersResult,
  EmailListResult,
  EmailMarkAction,
  EmailMarkResult,
  EmailReadResult,
  EmailReplyMode,
  EmailReplyResult,
  EmailSearchResult,
  EmailSendResult,
  EmailWatchResult
} from './types.js'

export type TextBlock = { type: 'text'; text: string }

export const MAX_LIMIT = 100

export const ACCOUNT_HINT = 'Account name (choose one when accounts has several); omit it to use defaultAccount. Available accounts appear in the email_folders error or the plugin README'

/** Parse date-only or ISO input; an inclusive end date maps to the next UTC day. */
export function parseEmailDay(input: string, label: string, endInclusive = false): Date {
  const text = input.trim()
  let date: Date | null = null
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    date = new Date(text + 'T00:00:00Z')
  } else {
    const parsed = new Date(text)
    if (!Number.isNaN(parsed.getTime())) date = parsed
  }
  if (date === null || Number.isNaN(date.getTime())) {
    throw new Error(label + ' is not a valid date; use a value like 2026-08-01 or 2026-08-01T00:00:00Z')
  }
  if (endInclusive) return new Date(date.getTime() + 24 * 3600 * 1000)
  return date
}

export function executionSignal(exec: unknown): AbortSignal | undefined {
  if (typeof exec !== 'object' || exec === null) return undefined
  const signal = (exec as { signal?: unknown }).signal
  return signal instanceof AbortSignal ? signal : undefined
}

interface ParameterProperty {
  type?: string | string[]
  required?: boolean
  description?: string
  items?: { type?: string } | null
}

export function compileParameters(spec: Record<string, ParameterProperty>): Record<string, unknown> {
  const properties: Record<string, unknown> = {}
  const required: string[] = []
  for (const [key, prop] of Object.entries(spec)) {
    if (prop?.required === true) required.push(key)
    const node: Record<string, unknown> = {}
    if (typeof prop?.type === 'string') node.type = prop.type
    else if (Array.isArray(prop?.type)) node.oneOf = prop.type.map(type => ({ type }))
    if (typeof prop?.description === 'string') node.description = prop.description
    if (prop?.type === 'array' && prop.items !== null && typeof prop.items === 'object') {
      const items: Record<string, unknown> = { type: 'string' }
      if (prop.items.type === 'object') items.additionalProperties = true
      node.items = items
    }
    properties[key] = node
  }
  return { type: 'object', properties, ...(required.length > 0 ? { required } : {}) }
}

export function normalizeAttachmentPaths(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined
  if (!Array.isArray(value) || value.some(path => typeof path !== 'string' || path.trim() === '')) {
    throw new Error('attachments must be an array of file path strings (no empty strings)')
  }
  return value.map(path => path.trim())
}

export const strArray = { type: 'array', items: { type: 'string' } }

export const addrArray = { type: 'array', items: { type: 'object', additionalProperties: true } }

export const messageShape = {
  uid: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
  date: { type: 'string' },
  from: addrArray,
  subject: { type: 'string' },
  seen: { type: 'boolean' },
  flagged: { type: 'boolean' },
  size: { type: 'integer' },
  hasAttachments: { type: 'boolean' },
}

export const listSchema = {
  type: 'object',
  properties: {
    account: { type: 'string' },
    count: { type: 'integer' },
    countExact: { type: 'boolean' },
    hasMore: { type: 'boolean' },
    order: { type: 'string' },
    searchSource: { type: 'string' },
    folder: { type: 'string' },
    messages: { type: 'array', items: { type: 'object', properties: messageShape, additionalProperties: true } },
  },
  additionalProperties: true,
}

export const readSchema = {
  type: 'object',
  properties: {
    account: { type: 'string' },
    uid: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
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

export const sendSchema = {
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

export const foldersSchema = {
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

export const attachmentSchema = {
  type: 'object',
  properties: {
    account: { type: 'string' },
    uid: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
    filename: { type: 'string' },
    contentType: { type: 'string' },
    size: { type: 'integer' },
    path: { type: 'string' },
  },
  additionalProperties: true,
}

export const markSchema = {
  type: 'object',
  properties: {
    account: { type: 'string' },
    uid: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
    folder: { type: 'string' },
    action: { type: 'string' },
    seen: { type: 'boolean' },
    flagged: { type: 'boolean' },
    movedTo: { type: 'string' },
    movedUid: { type: 'integer' },
  },
  additionalProperties: true,
}

export const MARK_ACTIONS: EmailMarkAction[] = ['read', 'unread', 'star', 'unstar', 'move']

export const REPLY_MODES: EmailReplyMode[] = ['reply', 'reply-all', 'forward']

export const MARK_LABELS: Record<EmailMarkAction, string> = {
  read: 'marked as read',
  unread: 'marked as unread',
  star: 'starred',
  unstar: 'unstarred',
  move: 'moved',
}

export const REPLY_LABELS: Record<EmailReplyMode, string> = {
  reply: 'replied to',
  'reply-all': 'replied to all recipients of',
  forward: 'forwarded',
}

export function oneText(text: string): TextBlock[] {
  return [{ type: 'text', text }]
}

export function describeMessage(message: EmailListResult['messages'][number]): string {
  const from = message.from.map(a => a.name ?? a.address).filter(Boolean).join(', ') || '(unknown)'
  const flags = [
    message.flagsSupported === false || message.seen ? '' : 'unread',
    message.flagged ? 'starred' : '',
    message.hasAttachments ? 'has attachments' : '',
  ].filter(Boolean)
  const parts = ['uid=' + message.uid, from, message.date]
  if (flags.length > 0) parts.push(flags.join(', '))
  return (message.subject || '(no subject)') + ' [' + parts.join(' | ') + ']'
}

export function renderList(value: EmailListResult): TextBlock[] {
  if (value.transport === 'pop3') return oneText('Account ' + value.account + ', POP3 inbox: ' + value.messages.length + ' on this page, ' + (value.countExact ? 'mailbox total ' : 'matches in this scan ') + value.count + '. POP3 provides no server read, star or Sent folder state.' + (value.headerScan ? ' This scan read Date headers of ' + value.headerScan.scanned + ' / ' + value.headerScan.mailboxTotal + ' messages; these are not server receipt times.' : '') + '\n\n' + value.messages.map(describeMessage).join('\n'))
  if (value.countExact !== undefined) return oneText('Account ' + value.account + ', folder ' + value.folder + ': ' + value.messages.length + ' on this page' + (value.hasMore ? ', more available' : '') + ' (API page counts are not mailbox totals)\n\n' + value.messages.map(describeMessage).join('\n'))
  if (value.messages.length === 0) {
    return oneText('Account ' + value.account + ', folder "' + value.folder + '": ' + value.count + ' messages in total, none to list this time.')
  }
  const lines = value.messages.map((m, i) => '#' + (i + 1) + ' ' + describeMessage(m))
  return oneText('Account ' + value.account + ', folder "' + value.folder + '": ' + value.count + ' messages in total, newest ' + value.messages.length + ':\n\n' + lines.join('\n') + '\n\nUse email_read with a uid for the full message.')
}

export function renderRead(value: EmailReadResult): TextBlock[] {
  const from = value.from.map(a => a.name ?? a.address).filter(Boolean).join(', ') || '(unknown)'
  const attach = value.attachments.length > 0
    ? '\nAttachments: ' + value.attachments.map((a, i) => '#' + i + ' ' + a.filename + ' (' + a.contentType + ', ' + a.size + ' bytes)').join('; ') + '\n(use email_attachment with uid and index to download)'
    : ''
  return oneText('Account ' + value.account + ', subject: ' + (value.subject || '(no subject)') + '\nFrom: ' + from + '\nDate: ' + (value.date || '(unknown)') + attach + '\n\n' + value.text)
}

export function renderSearch(value: EmailSearchResult): TextBlock[] {
  if (value.searchSource === 'api') return oneText('AgentMail search (by relevance; the service excludes Spam and similar folders): ' + value.messages.length + ' on this page' + (value.hasMore ? ', more available; increase offset to continue' : '') + '\n\n' + value.messages.map(describeMessage).join('\n'))
  if (value.headerScan) {
    const scan = value.headerScan
    const window = scan.scanOffset === 0 ? 'the newest ' + scan.scanned : scan.scanned + ' after skipping the newest ' + scan.scanOffset
    const completeness = scan.complete ? 'complete envelope scan' : 'did not cover the whole folder'
    const continuation = scan.nextScanOffset === undefined ? '' : '; for older envelopes use headerScanOffset=' + scan.nextScanOffset + ' and headerScanLimit=' + scan.scanLimit
    const body = value.bodyScan ? '; bodies checked in ' + value.bodyScan.scanned + ' messages (within the newest ' + value.bodyScan.scanLimit + ')'
      + (value.hasMore ? ', that window has more matches; increase offset to continue' : '') : '; bodies were not scanned'
    const server = value.serverSearchFailed ? 'server-side search partly failed'
      : value.serverMatchCount === undefined ? 'scanned the given window directly' : 'server reported ' + value.serverMatchCount + ' candidates'
    const note = server + '; scanned envelopes of ' + window + ' messages (folder has ' + scan.mailboxTotal + ', ' + completeness + ', ' + scan.matched + ' envelope matches in the window)' + continuation + body
    const summary = (value.messages.length ? value.messages.length + ' on this page' : 'no matches on this page, which does not prove the whole mailbox has none') + (value.offset > 0 ? ', skipped the newest ' + value.offset + ' matches' : '')
    const rows = value.messages.map((message, i) => '#' + (i + 1) + ' ' + describeMessage(message))
    return oneText('Account ' + value.account + ', search for "' + value.query + '" in folder "' + value.folder + '": ' + summary + '. ' + note + (rows.length ? '\n\n' + rows.join('\n') : ''))
  }
  if (value.searchSource === 'server') {
    const rows = value.messages.map((message, i) => '#' + (i + 1) + ' ' + describeMessage(message))
    const next = value.hasMore === true ? 'More verified matches exist; increase offset to continue.'
      : value.hasMore === false ? 'All server candidates were verified.' : 'Not all server candidates were verified.'
    return oneText('Account ' + value.account + ', search for "' + value.query + '" in folder "' + value.folder + '": server reported ' + value.count + ' candidates; verified ' + value.messages.length + ' on this page (skipped the newest ' + value.offset + ').' + next + (rows.length ? '\n\n' + rows.join('\n') : ''))
  }
  const scanned = value.countKind === 'scanned'
  // 回退扫描只看了最近 scannedLimit 封，不知道全文件夹匹配数：不能把本页条数说成「共 N 条」。
  const scannedNote = 'only the newest ' + (value.scannedLimit ?? 0) + ' were scanned; the folder-wide match count is unknown'
  if (value.messages.length === 0) {
    if (scanned) {
      return oneText('Account ' + value.account + ', search for "' + value.query + '" in folder "' + value.folder + '": no matches on this page (' + scannedNote + ').')
    }
    return oneText('Account ' + value.account + ', search for "' + value.query + '" in folder "' + value.folder + '": ' + value.count + ' matches in total, none listed this time.')
  }
  const lines = value.messages.map((m, i) => '#' + (i + 1) + ' ' + describeMessage(m))
  const offset = value.offset ?? 0
  const window = offset > 0
    ? 'newest ' + offset + ' skipped, showing ' + value.messages.length
    : 'showing the newest ' + value.messages.length
  const summary = scanned
    ? value.messages.length + ' on this page (' + scannedNote + ')' + (offset > 0 ? '; offset skipped the newest ' + offset : '')
    : value.count + ' matches in total, ' + window
  return oneText('Account ' + value.account + ', search for "' + value.query + '" in folder "' + value.folder + '": ' + summary + ':\n\n' + lines.join('\n'))
}

export function renderSend(value: EmailSendResult): TextBlock[] {
  const rejected = value.rejected.length > 0 ? '; rejected: ' + value.rejected.join(', ') : ''
  return oneText('Account ' + value.account + ': email sent, messageId: ' + value.messageId + '; accepted: ' + value.accepted.join(', ') + rejected + '; server response: ' + value.response)
}

export function renderFolders(value: EmailFoldersResult): TextBlock[] {
  if (value.folders.length === 0) return oneText('Account ' + value.account + ': no folders listed.')
  const lines = value.folders.map((f, i) => '#' + (i + 1) + ' ' + f.path + (f.specialUse !== '' ? ' [' + f.specialUse + ']' : '') + (f.subscribed ? '' : ' (not subscribed)'))
  return oneText('Folders of account ' + value.account + ' (' + value.folders.length + '):\n\n' + lines.join('\n') + '\n\nSet folder to one of these paths.')
}

export function renderFolder(value: EmailFolderResult): TextBlock[] {
  let msg = 'Mailbox account ' + value.account + ': ran "' + value.action + '" on folder "' + value.path + '"'
  if (value.newName) msg += ', new name "' + value.newName + '"'
  if (value.count !== undefined) msg += ', removed ' + value.count + ' messages'
  return oneText(msg)
}

export function renderAttachment(value: EmailAttachmentResult): TextBlock[] {
  return oneText('Account ' + value.account + ' downloaded attachment "' + value.filename + '" (' + value.contentType + ', ' + value.size + ' bytes) to:\n' + value.path + '\nUse the read tool to open the file.')
}

export function renderMark(value: EmailMarkResult): TextBlock[] {
  let text = 'Account ' + value.account + ': folder "' + value.folder + '" uid=' + value.uid + ' ' + (MARK_LABELS[value.action] ?? value.action)
  if (value.action === 'move') {
    text += ' to "' + (value.movedTo ?? '') + '"' + (typeof value.movedUid === 'number' ? ' (new uid=' + value.movedUid + ')' : '')
  } else {
    text += ' (now: ' + (value.seen ? 'read' : 'unread') + (value.flagged ? ', starred' : '') + ')'
  }
  return oneText(text)
}

export function renderReply(value: EmailReplyResult): TextBlock[] {
  const rejected = value.rejected.length > 0 ? '; rejected: ' + value.rejected.join(', ') : ''
  const cc = value.cc ? ', cc ' + value.cc : ''
  return oneText('Account ' + value.account + ': ' + REPLY_LABELS[value.mode] + ' message uid=' + value.originalUid + '; to: ' + value.to.join(', ') + cc + ', subject: "' + value.subject + '", messageId: ' + value.messageId + rejected)
}

export function renderWatch(value: EmailWatchResult): TextBlock[] {
  const unread = value.transport === 'pop3' ? 'POP3 provides no server unread total' : (value.totalUnreadExact === false ? 'at least unread in this scan: ' : 'currently unread: ') + value.totalUnread
  if (value.reset === true) {
    return oneText('Account ' + value.account + ': UIDVALIDITY of folder "' + value.folder + '" changed (the server renumbered messages); the baseline was rebuilt (currently unread: ' + value.totalUnread + '). No new mail is reported this time; later calls behave normally.')
  }
  if (value.firstRun) {
    return oneText('Account ' + value.account + ': new-mail watch baseline created (' + unread + '). Later email_watch calls report only newly arrived mail.')
  }
  if (value.newCount === 0) {
    return oneText('Account ' + value.account + ': no new mail (' + unread + ').')
  }
  const lines = value.messages.map((m, i) => '#' + (i + 1) + ' ' + describeMessage(m))
  return oneText('Account ' + value.account + ' has ' + value.newCount + ' new messages:\n\n' + lines.join('\n') + '\n\nUse email_read with a uid for the full message.')
}

export const renderHealth = (_args: unknown, value: unknown): TextBlock[] => {
  const rec = (value ?? {}) as Record<string, unknown>
  const rawChecks = Array.isArray(rec.checks) ? rec.checks : []
  const zh = rec.lang === 'zh'
  const lines = [zh
    ? 'dsh-email 自检' + (rec.ok === true ? '：正常。' : '：发现问题。')
    : 'dsh-email self-check' + (rec.ok === true ? ': ok.' : ': problems found.')]
  for (const item of rawChecks) {
    const c = (item ?? {}) as Record<string, unknown>
    lines.push('- ' + String(c.name) + (zh ? '：' : ': ') + (c.ok === true ? '✅ ' + String(c.detail ?? '') : '❌ ' + String(c.detail ?? '')))
  }
  return [{ type: 'text', text: lines.join('\n') }]
}

export const replySchema = {
  type: 'object',
  properties: {
    account: { type: 'string' },
    mode: { type: 'string' },
    originalUid: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
    messageId: { type: 'string' },
    accepted: strArray,
    rejected: strArray,
    response: { type: 'string' },
    to: strArray,
    cc: { type: 'string' },
    subject: { type: 'string' },
  },
  additionalProperties: true,
}

export const watchSchema = {
  type: 'object',
  properties: {
    account: { type: 'string' },
    folder: { type: 'string' },
    firstRun: { type: 'boolean' },
    reset: { type: 'boolean' },
    newCount: { type: 'integer' },
    totalUnread: { type: 'integer' },
    totalUnreadExact: { type: 'boolean' },
    messages: { type: 'array', items: { type: 'object', properties: messageShape, additionalProperties: true } },
  },
  additionalProperties: true,
}

export const descriptions = {
  "email_list": 'IMAP uid is a positive integer; AgentMail uid is an opaque string message_id. AgentMail returns page counts: inspect hasMore/countExact instead of assuming mailbox totals. List recent emails in a mailbox folder (newest first). Returns uid, date, sender, subject and flags without message bodies; use email_read with a uid to fetch the full text. Optional since/until (dates like 2026-08-01) filter by received date.',
  "email_read": 'Read one full email message by its uid (from email_list or email_search). Returns the plain-text body (HTML mail is converted; oversized bodies are truncated) plus attachment metadata; use email_attachment to download one.',
  "email_mark": 'AgentMail supports flags and only INBOX-to-Archive label archiving; arbitrary IMAP moves are not supported there. Change an existing message: mark it read/unread, star/unstar it, or move it to another folder. Use after email_list/email_search when the user wants to tidy the mailbox (archive, clear unread, flag important mail). Moving uses the server MOVE/COPY so the uid changes; the new uid is reported when the server provides it.',
  "email_search": 'AgentMail accounts use API relevance search (searchSource=api), exclude spam/trash/blocked/unauthenticated mail, and page with offset; headerScanOffset and IMAP fallbacks do not apply. For IMAP: Search sender, recipients and subject; verify server candidates against envelopes and arrival dates. In server results count is the number of candidates, not verified matches. hasMore is true when there is a verified match beyond this page, false when candidates are exhausted, and omitted when verification stopped at its limit. If server SEARCH is empty, fails, or has no confirmed matches, scan local headers in batches without downloading bodies/attachments (default newest 5000, max 20000). headerScanOffset/Limit select an older header window; use headerScan.nextScanOffset to continue. offset pages MATCHES within that window. If no headers match and headerScanOffset=0, optional body fallback scans only bodySearchLimit recent arrivals. Inspect searchSource/headerScan/bodyScan: partial or zero results never prove the whole mailbox has no match. Results use descending mailbox UID arrival order, not Date-header or INTERNALDATE sorting. since/until filter INTERNALDATE (Date header only if unavailable).',
  "email_send": 'AgentMail has a plugin limit of 10 attachments / 4 MiB total and uses its inbox API; a receipt means submission, not delivery. Send an email from a configured account, optionally with file attachments (absolute paths, or relative to the current session workspace; process cwd is the fallback without a session). Saved blocked-address/domain rules reject To/Cc recipients even when sendApproval is off. Plugin confirmation is required by default, unless sendApproval is disabled or every To/Cc recipient matches saved trust rules with skipApproval enabled. Host permissions still apply. Full Access refuses a send that still requires plugin confirmation; use email_draft for human review and explicit sending. Never invent recipients or content without the user\'s instruction.',
  "email_reply": 'AgentMail reply/reply-all uses its thread-aware reply API; forwarding creates a new message. Reply to, reply-all to, or forward an existing message (mode: reply | reply-all | forward). Reply-all preserves original Cc recipients, excludes your own addresses and deduplicates original recipients. The optional cc field adds recipients. The subject gets a single Re:/Fwd: prefix, the original text is quoted underneath, and In-Reply-To/References headers keep mail clients threading correctly. mode=forward needs the to parameter. Plugin confirmation is required unless sendApproval is disabled or allowTrustedReply is explicitly enabled and every actual To/Cc matches saved trusted skipApproval rules. Reply envelopes are pinned after approval. HTML and optional locale/timeZone overrides are supported. Blocked recipients still stop delivery before SMTP and host permissions remain in effect. Never invent recipients or content without the user\'s instruction.',
  "email_folders": 'List the mailbox folders of an account (INBOX, Sent, Trash, custom folders, ...). Use the returned path values as the folder argument of the other email tools.',
  "email_health": 'AgentMail accounts show fixed regional API endpoints instead of IMAP/SMTP servers. Self-check for dsh-email: summarizes configured accounts (provider / IMAP / SMTP hosts) without any network connection and never shows passwords. Run this first when troubleshooting.',
  "email_attachment": 'AgentMail downloads are limited to 20 MiB or the smaller configured maximum. Download one attachment of a message to a local file (size capped by maxAttachmentBytes). The index matches the attachments array of email_read. Returns the absolute path of the written file.',
  "email_watch": 'Check for NEW unread emails since the last check (cursor-based). The first call per account+folder sets the baseline and reports nothing as new; every later call returns only unseen unread messages. Call this periodically (e.g. via a scheduled task) to notify the user about new mail. Returns newCount, the new messages, and totalUnread.',
  "email_folder_create": 'Create a new IMAP folder under the mailbox. The path can be a simple name or a hierarchical path. Returns the created folder info.',
  "email_folder_rename": 'Rename an existing IMAP folder. Pass the current path as `path` and the desired new name as `newName`. Returns the renamed folder info.',
  "email_folder_delete": 'Delete an existing IMAP folder and ALL its messages. This operation is irreversible: the folder and every message inside it are removed from the server.',
  "email_folder_purge": 'Remove every message inside a folder (purge / empty the folder) without deleting the folder itself. The returned count is the number of messages removed.',
}

// Transport boundaries precede generic guidance so models do not request IMAP-only mutations.
const pop3Descriptions: Partial<Record<keyof typeof descriptions, string>> = {
  email_list: 'POP3 accounts use opaque pop3: UIDL references and INBOX only. They do not expose server unread/star flags. Date filters scan only the newest 500 Date headers and report coverage. TOP may fall back to bounded RETR. ',
  email_mark: 'POP3 does not support read/unread/star/move and rejects these operations without changing mail. ',
  email_search: 'POP3 performs local header search (default newest 100, max 500 per window), continues with headerScan.nextScanOffset, and optionally scans bodySearchLimit bodies when no header matches. Inspect actual scan coverage; it is not server SEARCH. POP3 since/until compare sender Date headers, not server receipt dates. ',
  email_reply: 'POP3 originals are read by stable UIDL; replies and forwards use the existing SMTP and confirmation flow. ',
  email_folders: 'POP3 exposes only INBOX; server Sent, Archive and flags are unavailable. ',
  email_health: 'POP3 accounts report POP3/SMTP configuration; a configuration check is not a network connectivity test. ',
  email_attachment: 'POP3 downloads the entire source message (max 32 MiB) to parse an attachment (max 20 MiB or configured lower limit). ',
  email_watch: 'POP3 watches newly appearing UIDLs, not unread flags. Its first call seeds a baseline, and totalUnreadExact=false with transport=pop3 means no server unread total is available. ',
  email_folder_create: '',
  email_folder_rename: '',
  email_folder_delete: '',
  email_folder_purge: '',
}
for (const key of Object.keys(pop3Descriptions) as Array<keyof typeof descriptions>) descriptions[key] = pop3Descriptions[key] + descriptions[key]

export const parameters = {
  "email_list": compileParameters({
    folder: { type: 'string', description: 'IMAP folder path (see email_folders); defaults to the account inboxFolder' },
    limit: { type: 'integer', description: 'How many messages to return, 1-100, default 20' },
    offset: { type: 'integer', description: 'Skip this many newest messages first, default 0' },
    unreadOnly: { type: 'boolean', description: 'Only list unread messages, default false' },
    since: { type: 'string', description: 'Only list messages received on or after this date, e.g. 2026-08-01 (optional)' },
    until: { type: 'string', description: 'Only list messages received on or before this date, e.g. 2026-08-26 (optional)' },
    account: { type: 'string', description: ACCOUNT_HINT },
  }),
  "email_read": compileParameters({
    uid: { type: ['integer', 'string'], required: true, description: 'IMAP positive integer uid or unchanged AgentMail string message_id from email_list or email_search' },
    folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
    account: { type: 'string', description: ACCOUNT_HINT },
  }),
  "email_mark": compileParameters({
    uid: { type: ['integer', 'string'], required: true, description: 'IMAP positive integer uid or unchanged AgentMail string message_id from email_list or email_search' },
    action: { type: 'string', required: true, description: 'What to do: read, unread, star, unstar, or move' },
    toFolder: { type: 'string', description: 'Destination folder path for action=move (see email_folders for valid paths)' },
    folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
    account: { type: 'string', description: ACCOUNT_HINT },
  }),
  "email_search": compileParameters({
    query: { type: 'string', required: true, description: 'Keyword to search for' },
    folder: { type: 'string', description: 'IMAP folder to search in; defaults to the account inboxFolder' },
    limit: { type: 'integer', description: 'How many matches to return, 1-100, default 10' },
    offset: { type: 'integer', description: 'Skip this many newest matches first, default 0' },
    headerScanLimit: { type: 'integer', description: 'Local header fallback window size, 1-20000; default 5000. Headers only, no bodies or attachments.' },
    headerScanOffset: { type: 'integer', description: 'Skip this many newest arrivals for the local header window; default 0. Continue with headerScan.nextScanOffset. Independent of match offset; a nonzero value skips body fallback.' },
    since: { type: 'string', description: 'Only search messages received on or after this date, e.g. 2026-08-01 (optional)' },
    until: { type: 'string', description: 'Only search messages received on or before this date, e.g. 2026-08-26 (optional)' },
    account: { type: 'string', description: ACCOUNT_HINT },
  }),
  "email_send": compileParameters({
    to: { type: 'string', required: true, description: 'Recipient(s), comma-separated' },
    subject: { type: 'string', required: true, description: 'Email subject' },
    text: { type: 'string', description: 'Plain-text body' },
    html: { type: 'string', description: 'Optional HTML body. Safe headings, tables, links and inline formatting; plain text is derived when omitted. Active content and remote images are removed.' },
    cc: { type: 'string', description: 'CC recipient(s), comma-separated' },
    attachments: { type: 'array', items: { type: 'string' }, description: 'File paths to attach (absolute, or relative to the current session workspace; process cwd is the fallback without a session)' },
    account: { type: 'string', description: ACCOUNT_HINT },
  }),
  "email_reply": compileParameters({
    uid: { type: ['integer', 'string'], required: true, description: 'IMAP positive integer uid or unchanged AgentMail string message_id to answer/forward, from email_list or email_search' },
    text: { type: 'string', description: 'The new text to write; the original is quoted below it automatically. Provide text or html.' },
    html: { type: 'string', description: 'Optional HTML body; a safe original quote is appended automatically. Preserves thread headers.' },
    locale: { type: 'string', description: 'Quote language override: zh, en, fr (BCP 47 regional tags accepted). Defaults to account preference, otherwise English.' },
    timeZone: { type: 'string', description: 'Optional IANA timezone for the original date, e.g. Europe/Paris; default account preference or local timezone.' },
    mode: { type: 'string', description: 'reply (default), reply-all, or forward' },
    to: { type: 'string', description: 'Recipient(s) for mode=forward, comma-separated' },
    cc: { type: 'string', description: 'Extra CC recipient(s), comma-separated (optional)' },
    folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
    account: { type: 'string', description: ACCOUNT_HINT },
  }),
  "email_folders": compileParameters({
    subscribedOnly: { type: 'boolean', description: 'Only subscribed folders, default false' },
    account: { type: 'string', description: ACCOUNT_HINT },
  }),
  "email_health": compileParameters({}),
  "email_attachment": compileParameters({
    uid: { type: ['integer', 'string'], required: true, description: 'IMAP positive integer uid or unchanged AgentMail string message_id from email_list or email_search' },
    index: { type: 'integer', description: '0-based attachment index, as listed by email_read; default 0' },
    folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
    account: { type: 'string', description: ACCOUNT_HINT },
  }),
  "email_watch": compileParameters({
    folder: { type: 'string', description: 'IMAP folder path (see email_folders); defaults to the account inboxFolder' },
    limit: { type: 'integer', description: 'Max number of new messages to return, 1-100, default 20' },
    account: { type: 'string', description: ACCOUNT_HINT },
  })
  ,"email_folder_create": compileParameters({
    path: { type: 'string', required: true, description: 'Folder path to create. Use email_folders to see existing folders. Can be hierarchical: "Parent/Child".' },
    account: { type: 'string', description: ACCOUNT_HINT },
  })
  ,"email_folder_rename": compileParameters({
    path: { type: 'string', required: true, description: 'Current folder path, as shown by email_folders.' },
    newName: { type: 'string', required: true, description: 'New name (or full path) for the folder.' },
    account: { type: 'string', description: ACCOUNT_HINT },
  })
  ,"email_folder_delete": compileParameters({
    path: { type: 'string', required: true, description: 'Folder path to delete. WARNING: this removes the folder and ALL its messages permanently.' },
    account: { type: 'string', description: ACCOUNT_HINT },
  })
  ,"email_folder_purge": compileParameters({
    path: { type: 'string', required: true, description: 'Folder path to purge (delete all messages but keep the folder).' },
    account: { type: 'string', description: ACCOUNT_HINT },
  })
}
