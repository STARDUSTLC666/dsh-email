import nodemailer from 'nodemailer';
import { domainToASCII } from 'node:url';
import { parse, stringify } from 'yaml';
export class RecipientPolicyError extends Error {
    code = 'recipient-denied';
    constructor(addresses) { super('Recipients blocked by a deny rule; no email sent: ' + addresses.join(', ')); this.name = 'RecipientPolicyError'; }
}
const normalizer = nodemailer.createTransport({ jsonTransport: true, disableFileAccess: true, disableUrlAccess: true });
export function canonicalDomain(value) {
    const domain = domainToASCII(value.trim().replace(/\.$/, '')).toLowerCase();
    if (!domain || domain.length > 253 || domain.split('.').some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))
        throw new Error('Enter a valid full domain such as example.com; wildcards and URLs are not supported');
    return domain;
}
export function canonicalAddress(value) {
    const address = value.trim(), at = address.lastIndexOf('@'), local = address.slice(0, at);
    if (at <= 0 || Buffer.byteLength(local) > 64 || /[\r\n\u0000-\u001f\u007f]/.test(local)
        || (!/^"(?:[^"\\]|\\.)*"$/.test(local) && (/[^\S\r\n]|[@<>()\[\],;:\\"]/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..'))))
        throw new Error('Enter a full email address such as name@example.com');
    return local + '@' + canonicalDomain(address.slice(at + 1));
}
/** The public Nodemailer JSON transport compiles the same recipient envelope without delivery. */
export async function normalizeRecipients(to, cc = '') {
    const rows = [];
    for (const [field, value] of [['to', to], ['cc', cc]]) {
        if (typeof value !== 'string' || value.length > 4096 || /[\r\n\u0000]/.test(value))
            throw new Error('The recipient field must not contain line breaks and may be at most 4096 characters');
        if (!value.trim()) {
            if (field === 'to')
                throw new Error('Enter a recipient');
            continue;
        }
        const info = await normalizer.sendMail({ from: 'preview@example.invalid', to: value, text: '' });
        const envelope = info.envelope.to;
        if (!Array.isArray(envelope) || !envelope.length)
            throw new Error('The recipients contain no complete deliverable email address');
        for (const raw of envelope) {
            const address = canonicalAddress(String(raw));
            if (!rows.some(row => row.field === field && row.address === address))
                rows.push({ field, address });
        }
    }
    if (rows.length > 100)
        throw new Error('A single draft may have at most 100 To/Cc addresses');
    return rows;
}
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
export function parseRecipientPolicies(text) {
    if (!text?.trim())
        return new Map();
    if (Buffer.byteLength(text) > 64 * 1024)
        throw new Error('Trusted recipient rules exceed 64 KiB');
    let data;
    try {
        data = parse(text, { maxAliasCount: 0, uniqueKeys: true });
    }
    catch {
        throw new Error('Trusted recipient rules are not valid YAML; check duplicate accounts, indentation or references');
    }
    if (!plain(data) || Object.keys(data).length > 50)
        throw new Error('Rules are keyed by account name, at most 50 accounts');
    const policies = new Map();
    for (const [account, raw] of Object.entries(data)) {
        if (!account.trim() || account.length > 200 || !plain(raw) || Object.keys(raw).some(key => !['skipApproval', 'addresses', 'domains', 'denyAddresses', 'denyDomains'].includes(key)))
            throw new Error('Account rules only support skipApproval, addresses, domains, denyAddresses and denyDomains');
        if (raw.skipApproval !== undefined && typeof raw.skipApproval !== 'boolean')
            throw new Error('skipApproval must be true or false');
        const list = (key, convert) => {
            const values = raw[key] ?? [];
            if (!Array.isArray(values) || values.length > 100 || values.some(value => typeof value !== 'string'))
                throw new Error(key + ' must be a list of strings, at most 100 items');
            return [...new Set(values.map(value => convert(value)))];
        };
        policies.set(account, { skipApproval: raw.skipApproval === true, addresses: list('addresses', canonicalAddress), domains: list('domains', canonicalDomain), denyAddresses: list('denyAddresses', canonicalAddress), denyDomains: list('denyDomains', canonicalDomain) });
    }
    return policies;
}
export function serializeRecipientPolicies(policies) {
    return policies.size ? stringify(Object.fromEntries(policies)) : '';
}
export async function matchRecipients(to, cc, policy) {
    const rows = (await normalizeRecipients(to, cc)).map(row => {
        const domain = row.address.slice(row.address.lastIndexOf('@') + 1);
        if (policy?.denyAddresses?.includes(row.address))
            return { ...row, matched: false, blocked: true, rule: 'address', value: row.address };
        if (policy?.denyDomains?.includes(domain))
            return { ...row, matched: false, blocked: true, rule: 'domain', value: domain };
        if (policy?.addresses.includes(row.address))
            return { ...row, matched: true, blocked: false, rule: 'address', value: row.address };
        if (policy?.domains.includes(domain))
            return { ...row, matched: true, blocked: false, rule: 'domain', value: domain };
        return { ...row, matched: false, blocked: false, rule: '', value: '' };
    });
    const allTrusted = rows.length > 0 && rows.every(row => row.matched);
    return { rows, allTrusted, skipsApproval: policy?.skipApproval === true && allTrusted, blocked: rows.some(row => row.blocked) };
}
export async function assertRecipientsAllowed(to, cc, policy) {
    if (!policy?.denyAddresses?.length && !policy?.denyDomains?.length)
        return;
    const matching = await matchRecipients(to, cc, policy);
    if (matching.blocked)
        throw new RecipientPolicyError(matching.rows.filter(row => row.blocked).map(row => row.address));
}
