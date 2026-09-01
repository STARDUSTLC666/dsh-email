/** One address entry as IMAP/MIME expose it. */
export interface AddressEntry {
  name?: string
  address?: string
}

/** One listed message: everything cheap to fetch without the body. */
export interface ListedMessage {
  uid: number
  /** ISO 8601 string, or '' when unknown. */
  date: string
  from: AddressEntry[]
  subject: string
  seen: boolean
  flagged: boolean
  size: number
  hasAttachments: boolean
}

/** One attachment of a read message (metadata only). */
export interface EmailAttachmentMeta {
  filename: string
  contentType: string
  size: number
  /** IMAP body part identifier used by email_attachment. */
  part: string
}

/** One fully read message body. */
export interface ReadMessageBody {
  date: string
  from: AddressEntry[]
  to: AddressEntry[]
  cc: AddressEntry[]
  subject: string
  /** Plain-text body; HTML mail is converted. Truncated at maxBodyChars. */
  text: string
  attachments: EmailAttachmentMeta[]
  truncated: boolean
}

export interface EmailListResult {
  account: string
  count: number
  folder: string
  messages: ListedMessage[]
}

export interface EmailReadResult extends ReadMessageBody {
  account: string
  uid: number
  folder: string
}

export interface EmailSearchResult {
  account: string
  query: string
  count: number
  folder: string
  messages: ListedMessage[]
}

export interface EmailSendResult {
  account: string
  messageId: string
  accepted: string[]
  rejected: string[]
  response: string
}

export interface EmailFolderRow {
  name: string
  path: string
  specialUse: string
  subscribed: boolean
}

export interface EmailFoldersResult {
  account: string
  folders: EmailFolderRow[]
}

export interface EmailAttachmentResult {
  account: string
  uid: number
  filename: string
  contentType: string
  size: number
  /** Absolute path the attachment was written to. */
  path: string
}

/** Every tool accepts an optional account selector. */
export interface AccountArg {
  account?: string
}

export interface EmailListArgs extends AccountArg {
  folder?: string
  limit?: number
  offset?: number
  unreadOnly?: boolean
  since?: string
  until?: string
}

export interface EmailReadArgs extends AccountArg {
  uid: number
  folder?: string
}

export interface EmailSearchArgs extends AccountArg {
  query: string
  folder?: string
  limit?: number
  since?: string
  until?: string
}

export interface EmailSendArgs extends AccountArg {
  to: string
  subject: string
  text?: string
  cc?: string
  /** Absolute paths (or paths relative to the dsh process cwd) to attach. */
  attachments?: string[]
}

export interface EmailFoldersArgs extends AccountArg {
  subscribedOnly?: boolean
}

export interface EmailAttachmentArgs extends AccountArg {
  uid: number
  /** 0-based index into the attachments of email_read. Default 0. */
  index?: number
  folder?: string
}

export interface EmailWatchArgs extends AccountArg {
  folder?: string
  /** Max number of new messages to return per call, default 20. */
  limit?: number
}

export type EmailMarkAction = 'read' | 'unread' | 'star' | 'unstar' | 'move'

export interface EmailMarkArgs extends AccountArg {
  uid: number
  action: EmailMarkAction
  /** Target folder path; only used (and required) when action is 'move'. */
  toFolder?: string
  folder?: string
}

export interface EmailMarkResult {
  account: string
  uid: number
  folder: string
  action: EmailMarkAction
  seen: boolean
  flagged: boolean
  /** Set after a successful move: the destination folder path. */
  movedTo?: string
  /** Set after a successful move: uid in the destination when the server reports it. */
  movedUid?: number
}

export type EmailReplyMode = 'reply' | 'reply-all' | 'forward'

export interface EmailReplyArgs extends AccountArg {
  uid: number
  /** The new text to write; the original is quoted below it automatically. */
  text: string
  mode?: EmailReplyMode
  /** Recipient(s) for mode=forward, comma-separated. */
  to?: string
  cc?: string
  folder?: string
}

export interface EmailReplyResult {
  account: string
  mode: EmailReplyMode
  /** uid of the original message that was answered/forwarded. */
  originalUid: number
  messageId: string
  accepted: string[]
  rejected: string[]
  response: string
  to: string[]
  subject: string
}

export interface EmailWatchResult {
  account: string
  folder: string
  /** True on the first call for this account+folder: it sets the baseline. */
  firstRun: boolean
  /** Unread messages never reported before (empty on firstRun). */
  newCount: number
  messages: ListedMessage[]
  /** Total unread in the folder right now. */
  totalUnread: number
}
