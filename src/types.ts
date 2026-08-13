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

/** One fully read message body. */
export interface ReadMessageBody {
  date: string
  from: AddressEntry[]
  to: AddressEntry[]
  cc: AddressEntry[]
  subject: string
  /** Plain-text body; HTML mail is converted. Truncated at maxBodyChars. */
  text: string
  attachments: Array<{ filename: string; contentType: string; size: number }>
  truncated: boolean
}

export interface EmailListResult {
  count: number
  folder: string
  messages: ListedMessage[]
}

export interface EmailReadResult extends ReadMessageBody {
  uid: number
  folder: string
}

export interface EmailSearchResult {
  query: string
  count: number
  folder: string
  messages: ListedMessage[]
}

export interface EmailSendResult {
  messageId: string
  accepted: string[]
  rejected: string[]
  response: string
}

export interface EmailListArgs {
  folder?: string
  limit?: number
  offset?: number
  unreadOnly?: boolean
}

export interface EmailReadArgs {
  uid: number
  folder?: string
}

export interface EmailSearchArgs {
  query: string
  folder?: string
  limit?: number
}

export interface EmailSendArgs {
  to: string
  subject: string
  text?: string
  cc?: string
}
