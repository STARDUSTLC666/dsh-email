import nodemailer from 'nodemailer';
import { domainToASCII } from 'node:url';
import { parse, stringify } from 'yaml';
const normalizer = nodemailer.createTransport({ jsonTransport: true, disableFileAccess: true, disableUrlAccess: true });
export function canonicalDomain(value) {
    const domain = domainToASCII(value.trim().replace(/\.$/, '')).toLowerCase();
    if (!domain || domain.length > 253 || domain.split('.').some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))
        throw new Error('请填写有效的完整域名，如 example.com；不支持通配符或网址');
    return domain;
}
export function canonicalAddress(value) {
    const address = value.trim(), at = address.lastIndexOf('@'), local = address.slice(0, at);
    if (at <= 0 || Buffer.byteLength(local) > 64 || /[\r\n\u0000-\u001f\u007f]/.test(local)
        || (!/^"(?:[^"\\]|\\.)*"$/.test(local) && (/[^\S\r\n]|[@<>()\[\],;:\\"]/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..'))))
        throw new Error('请填写完整邮箱地址，如 name@example.com');
    return local + '@' + canonicalDomain(address.slice(at + 1));
}
/** The public Nodemailer JSON transport compiles the same recipient envelope without delivery. */
export async function normalizeRecipients(to, cc = '') {
    const rows = [];
    for (const [field, value] of [['to', to], ['cc', cc]]) {
        if (typeof value !== 'string' || value.length > 4096 || /[\r\n\u0000]/.test(value))
            throw new Error('收件人字段不能含换行，且最多 4096 字符');
        if (!value.trim()) {
            if (field === 'to')
                throw new Error('请填写收件人');
            continue;
        }
        const info = await normalizer.sendMail({ from: 'preview@example.invalid', to: value, text: '' });
        const envelope = info.envelope.to;
        if (!Array.isArray(envelope) || !envelope.length)
            throw new Error('收件人没有可投递的完整邮箱地址');
        for (const raw of envelope) {
            const address = canonicalAddress(String(raw));
            if (!rows.some(row => row.field === field && row.address === address))
                rows.push({ field, address });
        }
    }
    if (rows.length > 100)
        throw new Error('单封草稿最多 100 个 To/Cc 收件地址');
    return rows;
}
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
export function parseRecipientPolicies(text) {
    if (!text?.trim())
        return new Map();
    if (Buffer.byteLength(text) > 64 * 1024)
        throw new Error('可信收件人规则超过 64 KiB');
    let data;
    try {
        data = parse(text, { maxAliasCount: 0, uniqueKeys: true });
    }
    catch {
        throw new Error('可信收件人规则不是有效 YAML，请检查重复账号、缩进或引用');
    }
    if (!plain(data) || Object.keys(data).length > 50)
        throw new Error('规则应按账号名填写，最多 50 个账号');
    const policies = new Map();
    for (const [account, raw] of Object.entries(data)) {
        if (!account.trim() || account.length > 200 || !plain(raw) || Object.keys(raw).some(key => !['skipApproval', 'addresses', 'domains'].includes(key)))
            throw new Error('账号规则只支持 skipApproval、addresses 与 domains');
        if (raw.skipApproval !== undefined && typeof raw.skipApproval !== 'boolean')
            throw new Error('skipApproval 必须是布尔值');
        const list = (key, convert) => {
            const values = raw[key] ?? [];
            if (!Array.isArray(values) || values.length > 100 || values.some(value => typeof value !== 'string'))
                throw new Error(key + ' 必须为字符串数组，最多 100 项');
            return [...new Set(values.map(value => convert(value)))];
        };
        policies.set(account, { skipApproval: raw.skipApproval === true, addresses: list('addresses', canonicalAddress), domains: list('domains', canonicalDomain) });
    }
    return policies;
}
export function serializeRecipientPolicies(policies) {
    return policies.size ? stringify(Object.fromEntries(policies)) : '';
}
export async function matchRecipients(to, cc, policy) {
    const rows = (await normalizeRecipients(to, cc)).map(row => {
        if (policy?.addresses.includes(row.address))
            return { ...row, matched: true, rule: 'address', value: row.address };
        const domain = row.address.slice(row.address.lastIndexOf('@') + 1);
        if (policy?.domains.includes(domain))
            return { ...row, matched: true, rule: 'domain', value: domain };
        return { ...row, matched: false, rule: '', value: '' };
    });
    const allTrusted = rows.length > 0 && rows.every(row => row.matched);
    return { rows, allTrusted, skipsApproval: policy?.skipApproval === true && allTrusted };
}
