/** Minimal local typings for mailparser (the package ships none). */
declare module 'mailparser' {
  export interface EmailAddress {
    name?: string
    address?: string
  }

  export interface AddressObject {
    value: EmailAddress[]
  }

  export interface ParsedAttachment {
    filename?: string
    contentType: string
    size: number
  }

  export interface ParsedMail {
    subject?: string
    from?: AddressObject
    to?: AddressObject
    cc?: AddressObject
    date?: Date
    text?: string
    html?: string | false
    attachments?: ParsedAttachment[]
  }

  export function simpleParser(source: Buffer | string, options?: Record<string, unknown>): Promise<ParsedMail>
}
