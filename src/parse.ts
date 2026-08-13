import { simpleParser } from 'mailparser'
import type { AddressEntry, ReadMessageBody } from './types.js'

export function flattenAddresses(input: unknown): AddressEntry[] {
  if (input === null || input === undefined) return []
  const list = Array.isArray(input) ? input : (input as { value?: unknown }).value
  if (!Array.isArray(list)) return []
  return list
    .filter(entry => entry !== null && typeof entry === 'object')
    .map(entry => {
      const { name, address } = entry as { name?: string; address?: string }
      const out: AddressEntry = {}
      if (typeof name === 'string' && name !== '') out.name = name
      if (typeof address === 'string' && address !== '') out.address = address
      return out
    })
    .filter(entry => entry.address !== undefined || entry.name !== undefined)
}

/** Minimal, dependency-free HTML-to-text: block tags become newlines, tags are dropped, common entities decoded. */
export function stripHtml(html: string): string {
  let out = html
    .replace(/<(script|style|head|title)[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<\/(p|div|tr|li|h[1-6]|table|blockquote|ul|ol|section|article|header|footer)[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
  out = out.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n')
  return out.trim()
}

export function truncateText(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false }
  const cut = text.slice(0, maxChars)
  const lastBreak = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf(' '), 0)
  return { text: cut.slice(0, lastBreak) + `\n\n…[正文过长，已截断，共 ${text.length} 字符]`, truncated: true }
}

/** Parse a raw RFC822 message source into the read-result body. */
export async function parseRawMessage(source: Buffer, maxBodyChars: number): Promise<ReadMessageBody> {
  const parsed = await simpleParser(source)
  let text = parsed.text ?? ''
  if (text.trim() === '' && typeof parsed.html === 'string' && parsed.html.trim() !== '') {
    text = stripHtml(parsed.html)
  }
  const limited = truncateText(text, maxBodyChars)
  return {
    date: parsed.date instanceof Date ? parsed.date.toISOString() : '',
    from: flattenAddresses(parsed.from),
    to: flattenAddresses(parsed.to),
    cc: flattenAddresses(parsed.cc),
    subject: parsed.subject ?? '',
    text: limited.text,
    attachments: (parsed.attachments ?? []).map(att => ({
      filename: att.filename ?? '(unnamed)',
      contentType: att.contentType,
      size: att.size,
    })),
    truncated: limited.truncated,
  }
}