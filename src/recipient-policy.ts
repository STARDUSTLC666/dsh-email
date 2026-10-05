import nodemailer from 'nodemailer'
import { domainToASCII } from 'node:url'
import { parse, stringify } from 'yaml'

export interface RecipientPolicy { skipApproval: boolean; addresses: string[]; domains: string[]; denyAddresses?: string[]; denyDomains?: string[] }
export interface RecipientMatch { field: 'to' | 'cc'; address: string; matched: boolean; blocked: boolean; rule: 'address' | 'domain' | ''; value: string }
export class RecipientPolicyError extends Error {
  readonly code = 'recipient-denied'
  constructor(addresses: string[]) { super('收件人被禁止规则拦截，邮件未发送 / Recipients blocked; no email sent: ' + addresses.join(', ')); this.name = 'RecipientPolicyError' }
}
const normalizer = nodemailer.createTransport({ jsonTransport: true, disableFileAccess: true, disableUrlAccess: true })
export function canonicalDomain(value: string): string {
  const domain = domainToASCII(value.trim().replace(/\.$/, '')).toLowerCase()
  if (!domain || domain.length > 253 || domain.split('.').some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) throw new Error('请填写有效的完整域名，如 example.com；不支持通配符或网址')
  return domain
}
export function canonicalAddress(value: string): string {
  const address = value.trim(), at = address.lastIndexOf('@'), local = address.slice(0, at)
  if (at <= 0 || Buffer.byteLength(local) > 64 || /[\r\n\u0000-\u001f\u007f]/.test(local)
    || (!/^"(?:[^"\\]|\\.)*"$/.test(local) && (/[^\S\r\n]|[@<>()\[\],;:\\"]/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')))) throw new Error('请填写完整邮箱地址，如 name@example.com')
  return local + '@' + canonicalDomain(address.slice(at + 1))
}

/** The public Nodemailer JSON transport compiles the same recipient envelope without delivery. */
export async function normalizeRecipients(to: string, cc = ''): Promise<Array<{ field: 'to' | 'cc'; address: string }>> {
  const rows: Array<{ field: 'to' | 'cc'; address: string }> = []
  for (const [field, value] of [['to', to], ['cc', cc]] as const) {
    if (typeof value !== 'string' || value.length > 4096 || /[\r\n\u0000]/.test(value)) throw new Error('收件人字段不能含换行，且最多 4096 字符')
    if (!value.trim()) { if (field === 'to') throw new Error('请填写收件人'); continue }
    const info = await normalizer.sendMail({ from: 'preview@example.invalid', to: value, text: '' })
    const envelope = info.envelope.to
    if (!Array.isArray(envelope) || !envelope.length) throw new Error('收件人没有可投递的完整邮箱地址')
    for (const raw of envelope) {
      const address = canonicalAddress(String(raw))
      if (!rows.some(row => row.field === field && row.address === address)) rows.push({ field, address })
    }
  }
  if (rows.length > 100) throw new Error('单封草稿最多 100 个 To/Cc 收件地址')
  return rows
}

const plain = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value)
export function parseRecipientPolicies(text?: string): Map<string, RecipientPolicy> {
  if (!text?.trim()) return new Map()
  if (Buffer.byteLength(text) > 64 * 1024) throw new Error('可信收件人规则超过 64 KiB')
  let data: unknown
  try { data = parse(text, { maxAliasCount: 0, uniqueKeys: true }) } catch { throw new Error('可信收件人规则不是有效 YAML，请检查重复账号、缩进或引用') }
  if (!plain(data) || Object.keys(data).length > 50) throw new Error('规则应按账号名填写，最多 50 个账号')
  const policies = new Map<string, RecipientPolicy>()
  for (const [account, raw] of Object.entries(data)) {
    if (!account.trim() || account.length > 200 || !plain(raw) || Object.keys(raw).some(key => !['skipApproval', 'addresses', 'domains', 'denyAddresses', 'denyDomains'].includes(key))) throw new Error('账号规则只支持 skipApproval、addresses、domains、denyAddresses 与 denyDomains')
    if (raw.skipApproval !== undefined && typeof raw.skipApproval !== 'boolean') throw new Error('skipApproval 必须是布尔值')
    const list = (key: string, convert: (s: string) => string): string[] => {
      const values = raw[key] ?? []
      if (!Array.isArray(values) || values.length > 100 || values.some(value => typeof value !== 'string')) throw new Error(key + ' 必须为字符串数组，最多 100 项')
      return [...new Set(values.map(value => convert(value as string)))]
    }
    policies.set(account, { skipApproval: raw.skipApproval === true, addresses: list('addresses', canonicalAddress), domains: list('domains', canonicalDomain), denyAddresses: list('denyAddresses', canonicalAddress), denyDomains: list('denyDomains', canonicalDomain) })
  }
  return policies
}
export function serializeRecipientPolicies(policies: Map<string, RecipientPolicy>): string {
  return policies.size ? stringify(Object.fromEntries(policies)) : ''
}
export async function matchRecipients(to: string, cc: string, policy?: RecipientPolicy): Promise<{ rows: RecipientMatch[]; allTrusted: boolean; skipsApproval: boolean; blocked: boolean }> {
  const rows: RecipientMatch[] = (await normalizeRecipients(to, cc)).map(row => {
    const domain = row.address.slice(row.address.lastIndexOf('@') + 1)
    if (policy?.denyAddresses?.includes(row.address)) return { ...row, matched: false, blocked: true, rule: 'address', value: row.address }
    if (policy?.denyDomains?.includes(domain)) return { ...row, matched: false, blocked: true, rule: 'domain', value: domain }
    if (policy?.addresses.includes(row.address)) return { ...row, matched: true, blocked: false, rule: 'address', value: row.address }
    if (policy?.domains.includes(domain)) return { ...row, matched: true, blocked: false, rule: 'domain', value: domain }
    return { ...row, matched: false, blocked: false, rule: '', value: '' }
  })
  const allTrusted = rows.length > 0 && rows.every(row => row.matched)
  return { rows, allTrusted, skipsApproval: policy?.skipApproval === true && allTrusted, blocked: rows.some(row => row.blocked) }
}
export async function assertRecipientsAllowed(to: string, cc: string, policy?: RecipientPolicy): Promise<void> {
  if (!policy?.denyAddresses?.length && !policy?.denyDomains?.length) return
  const matching = await matchRecipients(to, cc, policy)
  if (matching.blocked) throw new RecipientPolicyError(matching.rows.filter(row => row.blocked).map(row => row.address))
}
