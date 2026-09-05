import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { flattenAddresses, parseRawMessage, sanitizeFilename } from './parse.js';
export class MailError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MailError';
    }
}
export function messageOf(error, fallback) {
    return error instanceof Error && error.message !== '' ? error.message : fallback;
}
/** True when any bodyStructure node declares an attachment disposition. */
function structureHasAttachment(node) {
    if (node === null || node === undefined || typeof node !== 'object')
        return false;
    if (node.disposition === 'attachment')
        return true;
    const children = Array.isArray(node.childNodes) ? node.childNodes : [];
    return children.some(structureHasAttachment);
}
/** Walk a bodyStructure tree collecting attachment parts (DFS, same order as mailparser). */
function collectAttachmentParts(node, out = []) {
    if (node === null || node === undefined || typeof node !== 'object')
        return out;
    const isEmbedded = typeof node.type === 'string' && node.type.startsWith('message/rfc822');
    if (node.part !== undefined && (node.disposition === 'attachment' || (isEmbedded && node.disposition !== 'inline'))) {
        const filename = node.dispositionParameters?.filename ?? node.parameters?.name ?? 'part-' + node.part;
        out.push({
            part: String(node.part),
            filename: String(filename),
            contentType: typeof node.type === 'string' ? node.type : 'application/octet-stream',
            size: typeof node.size === 'number' ? node.size : 0,
        });
    }
    const children = Array.isArray(node.childNodes) ? node.childNodes : [];
    for (const child of children)
        collectAttachmentParts(child, out);
    return out;
}
/**
 * Map the index in the mailparser attachment list (what email_read showed the
 * model) onto a bodyStructure part. Name first, then type + tolerant size;
 * an inline image that our walk excludes simply fails instead of downloading
 * the wrong part.
 */
export function selectAttachmentPart(readAttachments, parts, index) {
    const meta = readAttachments[index];
    if (meta === undefined)
        return undefined;
    const byName = parts.find(part => part.filename === meta.filename || sanitizeFilename(part.filename) === meta.filename);
    if (byName !== undefined)
        return byName;
    const tolerance = Math.max(64, Math.ceil(meta.size * 0.5));
    const byTypeAndSize = parts.find(part => part.contentType === meta.contentType && Math.abs(part.size - meta.size) <= tolerance);
    return byTypeAndSize;
}
/** Case-insensitive match of a query against subject/from/body text. */
export function messageMatchesQuery(subject, fromText, body, query) {
    const q = query.toLowerCase();
    return subject.toLowerCase().includes(q)
        || fromText.toLowerCase().includes(q)
        || body.toLowerCase().includes(q);
}
/** Pull Message-ID / References out of a raw RFC822 source (header section only). */
export function extractMessageIds(source) {
    const headerEnd = source.indexOf('\r\n\r\n');
    const head = source.slice(0, headerEnd === -1 ? Math.min(source.length, 32768) : headerEnd).toString('latin1');
    const idMatch = head.match(/^message-id:\s*<([^>]+)>/im);
    // References can fold across continuation lines; collect every <id> token up to the next header.
    const refBlock = head.match(/^references:((?:[^\r\n]|\r?\n[ \t])*)/im);
    const refs = refBlock === null ? [] : [...refBlock[1].matchAll(/<([^>]+)>/g)].map(m => m[1]);
    return { messageId: idMatch === null ? '' : idMatch[1], references: refs.join(' ') };
}
function formatAddress(entry) {
    if (entry.address === undefined)
        return entry.name ?? '';
    return entry.name !== undefined && entry.name !== '' ? entry.name + ' <' + entry.address + '>' : entry.address;
}
function dedupeAddresses(entries, exclude) {
    const seen = new Set();
    const out = [];
    for (const entry of entries) {
        const addr = (entry.address ?? '').toLowerCase();
        if (addr === '' || addr === exclude || seen.has(addr))
            continue;
        seen.add(addr);
        out.push(entry);
    }
    return out;
}
function stripReplyPrefix(subject, prefix) {
    return subject.replace(new RegExp('^(?:' + prefix.source + '\\s*)+', 'i'), '').trim();
}
const QUOTE_MAX_CHARS = 2000;
const FORWARD_MAX_CHARS = 4000;
/**
 * Compose the outgoing message for a reply/reply-all/forward. Pure so it can
 * be tested without a connection: recipients exclude the sending account,
 * subject prefixes never stack, the original text is quoted underneath.
 */
export function buildReplyMessage(original, mode, selfAddress, text, forwardTo = '') {
    const fromText = original.from.map(a => a.name ?? a.address).filter(Boolean).join(', ') || '(未知发件人)';
    const self = selfAddress.toLowerCase();
    if (mode === 'forward') {
        const to = forwardTo.trim();
        if (to === '')
            throw new MailError('forward 模式需要 to 参数指定转发收件人');
        const fwdBody = original.text.length > FORWARD_MAX_CHARS
            ? original.text.slice(0, FORWARD_MAX_CHARS) + '\n…[原文过长，已截断]'
            : original.text;
        const header = '---------- 转发的邮件 ----------\n发件人: ' + fromText
            + (original.date !== '' ? '\n时间: ' + original.date : '')
            + '\n主题: ' + (original.subject || '(无主题)')
            + (original.to.length > 0 ? '\n收件人: ' + original.to.map(a => a.address).filter(Boolean).join(', ') : '');
        return {
            to,
            subject: 'Fwd: ' + stripReplyPrefix(original.subject, /fwd:|fw:|re:/),
            text: text + '\n\n' + header + '\n\n' + fwdBody,
            ...(original.messageId !== '' ? { references: (original.references !== '' ? original.references + ' ' : '') + original.messageId } : {}),
        };
    }
    let recipients;
    if (mode === 'reply-all') {
        recipients = dedupeAddresses([...original.from, ...original.to, ...original.cc], self);
        if (recipients.length === 0)
            recipients = dedupeAddresses(original.from, '');
    }
    else {
        recipients = dedupeAddresses(original.from, '');
    }
    if (recipients.length === 0) {
        throw new MailError('原邮件没有可用的发件人地址，无法回复；可用 email_send 手动发送');
    }
    const quoteText = original.text.length > QUOTE_MAX_CHARS
        ? original.text.slice(0, QUOTE_MAX_CHARS) + '\n…[原文过长，已截断]'
        : original.text;
    const quote = '在 ' + (original.date || '未知时间') + '，' + fromText + ' 写道：\n'
        + quoteText.split('\n').map(line => '> ' + line).join('\n');
    const built = {
        to: recipients.map(formatAddress).join(', '),
        subject: 'Re: ' + stripReplyPrefix(original.subject, /re:/),
        text: text + '\n\n' + quote,
    };
    if (original.messageId !== '') {
        built.inReplyTo = original.messageId;
        built.references = (original.references !== '' ? original.references + ' ' : '') + original.messageId;
    }
    return built;
}
function flattenAddressText(value) {
    return flattenAddresses(value)
        .map(a => (a.name ?? '') + ' ' + (a.address ?? ''))
        .join(' ');
}
function toIso(date) {
    return date instanceof Date ? date.toISOString() : '';
}
function listedFrom(envelope, size, hasAttachments) {
    return {
        uid: envelope.uid,
        date: toIso(envelope.envelope?.date),
        from: flattenAddresses(envelope.envelope?.from),
        subject: envelope.envelope?.subject ?? '',
        seen: envelope.flags?.has('\\Seen') === true,
        flagged: envelope.flags?.has('\\Flagged') === true,
        size: size ?? 0,
        hasAttachments,
    };
}
/**
 * One mailbox pool for the whole plugin: pooled IMAP connections per
 * account plus pooled SMTP transporters, with idle sweep and error eviction.
 */
export class EmailPool {
    settings;
    imaps = new Map();
    smtps = new Map();
    queues = new Map();
    idleTimer;
    constructor(settings) {
        this.settings = settings;
    }
    account(name) {
        const cfg = this.settings.accounts.get(name);
        if (cfg === undefined) {
            throw new MailError('未知账号 "' + name + '"，可用：' + [...this.settings.accounts.keys()].join('、'));
        }
        return cfg;
    }
    resolveName(name) {
        return name?.trim() || this.settings.defaultAccount;
    }
    /** Serialize operations per account: one IMAP connection serves one op at a time. */
    enqueue(name, task, signal) {
        const prev = this.queues.get(name) ?? Promise.resolve();
        const run = async () => {
            signal?.throwIfAborted();
            return task();
        };
        const next = prev.then(run, run);
        this.queues.set(name, next.then(() => undefined, () => undefined));
        return next;
    }
    async withImap(accountName, folder, run, readOnly = true, signal) {
        const name = this.resolveName(accountName);
        const cfg = this.account(name);
        return this.enqueue(name, () => this.imapRun(name, cfg, folder, readOnly, run, signal), signal);
    }
    createImap(cfg) {
        const client = new ImapFlow({
            host: cfg.imap.host,
            port: cfg.imap.port,
            secure: cfg.imap.secure,
            auth: { user: cfg.user, pass: cfg.password },
            logger: false,
            connectionTimeout: cfg.imap.connectionTimeoutMs ?? 30000,
            greetingTimeout: 30000,
            socketTimeout: cfg.imap.socketTimeoutMs ?? 60000,
        });
        // ImapFlow emits 'error' on socket timeouts/drops; without a listener Node
        // escalates it to an uncaught exception and kills the whole DSH process
        // (issue #4). Swallow it here and reap the dead connection when idle —
        // in-flight calls fail through their own promise paths instead.
        client.on('error', () => {
            for (const [name, entry] of this.imaps) {
                if (entry.client === client && entry.inUse === 0) {
                    void this.evictImap(name);
                    return;
                }
            }
        });
        return client;
    }
    async imapRun(name, cfg, folder, readOnly, run, signal) {
        let entry = this.imaps.get(name);
        let activeClient = entry?.client;
        const onAbort = () => {
            // ImapFlow has no per-command AbortSignal option. Closing the owned
            // connection is its cooperative cancellation mechanism and makes the
            // in-flight command settle before this method returns.
            try {
                activeClient?.close();
            }
            catch { /* already closed */ }
        };
        signal?.throwIfAborted();
        signal?.addEventListener('abort', onAbort, { once: true });
        try {
            if (entry === undefined || !entry.client.usable) {
                if (entry !== undefined)
                    await this.evictImap(name);
                const client = this.createImap(cfg);
                activeClient = client;
                signal?.throwIfAborted();
                await client.connect();
                signal?.throwIfAborted();
                entry = { client, selected: null, selectedReadOnly: true, lastUsed: Date.now(), inUse: 0 };
                this.imaps.set(name, entry);
            }
            activeClient = entry.client;
            entry.lastUsed = Date.now();
            entry.inUse += 1;
            // Reopen when the folder changes or when the caller needs a different
            // access mode (email_mark writes flags / moves messages).
            if (folder !== null && (entry.selected !== folder || entry.selectedReadOnly !== readOnly)) {
                await entry.client.mailboxOpen(folder, { readOnly });
                signal?.throwIfAborted();
                entry.selected = folder;
                entry.selectedReadOnly = readOnly;
            }
            const result = await run(entry.client);
            signal?.throwIfAborted();
            entry.lastUsed = Date.now();
            return result;
        }
        catch (error) {
            await this.evictImap(name);
            signal?.throwIfAborted();
            throw this.normalizeImapError(error, folder);
        }
        finally {
            signal?.removeEventListener('abort', onAbort);
            if (entry !== undefined)
                entry.inUse = Math.max(0, entry.inUse - 1);
        }
    }
    normalizeImapError(error, folder) {
        const raw = messageOf(error, 'IMAP 操作失败');
        const lower = raw.toLowerCase();
        if (lower.includes('authentication') || lower.includes('login')) {
            return new MailError('邮箱登录失败：' + raw + '（请检查 user 与授权码）');
        }
        if (lower.includes('nonselect') || lower.includes('does not exist') || lower.includes('nonexistent')) {
            return new MailError('找不到邮箱文件夹 "' + (folder ?? '') + '"：' + raw);
        }
        return new MailError(raw);
    }
    async evictImap(name) {
        const entry = this.imaps.get(name);
        if (entry === undefined)
            return;
        this.imaps.delete(name);
        try {
            await entry.client.logout();
        }
        catch { /* already closed */ }
    }
    /** Reap IMAP connections idle for longer than idleTimeoutMs. */
    startIdleSweep() {
        if (this.idleTimer !== undefined)
            return;
        const intervalMs = Math.max(5000, Math.min(this.settings.idleTimeoutMs / 2, 30000));
        this.idleTimer = setInterval(() => {
            const now = Date.now();
            for (const [name, entry] of this.imaps) {
                if (entry.inUse === 0 && now - entry.lastUsed > this.settings.idleTimeoutMs) {
                    void this.evictImap(name);
                }
            }
        }, intervalMs);
        this.idleTimer.unref();
    }
    dispose() {
        if (this.idleTimer !== undefined)
            clearInterval(this.idleTimer);
        this.idleTimer = undefined;
        for (const name of [...this.imaps.keys()])
            void this.evictImap(name);
        for (const transporter of this.smtps.values())
            transporter.close();
        this.smtps.clear();
    }
    transporter(name, cfg) {
        let t = this.smtps.get(name);
        if (t === undefined) {
            t = nodemailer.createTransport({
                pool: true,
                host: cfg.smtp.host,
                port: cfg.smtp.port,
                secure: cfg.smtp.secure,
                auth: { user: cfg.user, pass: cfg.password },
                connectionTimeout: 30000,
                greetingTimeout: 10000,
                socketTimeout: 60000,
                maxConnections: 2,
                maxMessages: 50,
            });
            this.smtps.set(name, t);
        }
        return t;
    }
    /** Send through the pooled transporter while making cancellation close it. */
    async sendMail(name, cfg, message, signal) {
        signal?.throwIfAborted();
        const transporter = this.transporter(name, cfg);
        const onAbort = () => {
            if (this.smtps.get(name) === transporter)
                this.smtps.delete(name);
            transporter.close();
        };
        signal?.addEventListener('abort', onAbort, { once: true });
        try {
            const info = await transporter.sendMail(message);
            signal?.throwIfAborted();
            return info;
        }
        catch (error) {
            signal?.throwIfAborted();
            throw error;
        }
        finally {
            signal?.removeEventListener('abort', onAbort);
        }
    }
    async list(accountName, folder, limit, offset, unreadOnly, since, until, signal) {
        const name = this.resolveName(accountName);
        const cfg = this.account(name);
        const folderName = folder || cfg.inboxFolder;
        return this.withImap(name, folderName, async (client) => {
            const mailbox = client.mailbox;
            const total = mailbox === false ? 0 : mailbox.exists;
            let scopeCount = total;
            let uids = [];
            const hasDateFilter = since !== undefined || until !== undefined;
            if (unreadOnly || hasDateFilter) {
                const query = {};
                if (unreadOnly)
                    query.seen = false;
                if (since !== undefined)
                    query.since = since;
                if (until !== undefined)
                    query.before = until;
                const found = await client.search(query, { uid: true });
                signal?.throwIfAborted();
                uids = found === false ? [] : found;
                scopeCount = uids.length;
            }
            else if (total > 0) {
                const start = Math.max(1, total - (limit + offset) + 1);
                const fetched = await client.fetchAll(start + ':*', { uid: true });
                signal?.throwIfAborted();
                uids = fetched.map(message => message.uid);
            }
            uids.reverse();
            const window = uids.slice(offset, offset + limit);
            const messages = await this.fetchListed(client, window, signal);
            return { account: name, count: scopeCount, folder: folderName, messages };
        }, true, signal);
    }
    async search(accountName, query, folder, limit, since, until, signal) {
        const name = this.resolveName(accountName);
        const cfg = this.account(name);
        const folderName = folder || cfg.inboxFolder;
        return this.withImap(name, folderName, async (client) => {
            // No nested OR and no TEXT search: several servers (QQ among them)
            // silently answer those with empty or match-everything results.
            // subject/from/to/cc searches unioned client-side behave well everywhere.
            const dateRange = {};
            if (since !== undefined)
                dateRange.since = since;
            if (until !== undefined)
                dateRange.before = until;
            const found = await Promise.all([
                client.search({ subject: query, ...dateRange }, { uid: true }),
                client.search({ from: query, ...dateRange }, { uid: true }),
                client.search({ to: query, ...dateRange }, { uid: true }),
                client.search({ cc: query, ...dateRange }, { uid: true }),
            ]);
            signal?.throwIfAborted();
            const uids = [...new Set(found.flatMap(result => result === false ? [] : result))].sort((a, b) => a - b);
            uids.reverse();
            if (uids.length === 0 && this.settings.bodySearchFallback) {
                // Server-side search found nothing: fall back to a client-side scan of
                // the most recent messages (subject/from/body), capped for time.
                const messages = await this.searchBodies(client, query, folderName, limit, since, until, signal);
                return { account: name, query, count: messages.length, folder: folderName, messages };
            }
            const messages = await this.fetchListed(client, uids.slice(0, limit), signal);
            return { account: name, query, count: uids.length, folder: folderName, messages };
        }, true, signal);
    }
    /** Client-side scan of the tail of the mailbox, newest first. */
    async searchBodies(client, query, folder, limit, since, until, signal) {
        signal?.throwIfAborted();
        const mailbox = client.mailbox;
        const total = mailbox === false ? 0 : mailbox.exists;
        if (total === 0)
            return [];
        const start = Math.max(1, total - this.settings.bodySearchLimit + 1);
        const fetched = await client.fetchAll(start + ':*', { uid: true, envelope: true, flags: true, size: true, bodyStructure: true, source: true, internalDate: true });
        const out = [];
        for (const message of [...fetched].reverse()) {
            signal?.throwIfAborted();
            if (out.length >= limit)
                break;
            const receivedAt = message.internalDate ?? message.envelope?.date;
            if (since !== undefined && (receivedAt === undefined || receivedAt < since))
                continue;
            if (until !== undefined && (receivedAt === undefined || receivedAt >= until))
                continue;
            const subject = message.envelope?.subject ?? '';
            const recipientSearchText = [message.envelope?.from, message.envelope?.to, message.envelope?.cc]
                .map(flattenAddressText).join(' ');
            let body = '';
            if (message.source !== undefined) {
                try {
                    const parsed = await parseRawMessage(message.source, 4096);
                    signal?.throwIfAborted();
                    body = parsed.text;
                }
                catch (error) {
                    signal?.throwIfAborted();
                    // 单封邮件解析失败不应中断整批回退扫描，继续用 subject/from/to/cc 匹配。
                }
            }
            if (messageMatchesQuery(subject, recipientSearchText, body, query)) {
                out.push(listedFrom(message, message.size, structureHasAttachment(message.bodyStructure)));
            }
        }
        return out;
    }
    async fetchListed(client, uids, signal) {
        signal?.throwIfAborted();
        if (uids.length === 0)
            return [];
        const fetched = await client.fetchAll(uids, { uid: true, envelope: true, flags: true, size: true, bodyStructure: true }, { uid: true });
        signal?.throwIfAborted();
        return fetched
            .map(message => listedFrom(message, message.size, structureHasAttachment(message.bodyStructure)))
            .sort((a, b) => b.uid - a.uid);
    }
    async read(accountName, uid, folder, signal) {
        const name = this.resolveName(accountName);
        const cfg = this.account(name);
        const folderName = folder || cfg.inboxFolder;
        return this.withImap(name, folderName, async (client) => {
            const message = await client.fetchOne(uid, { uid: true, source: true }, { uid: true });
            if (message === false || message.source === undefined) {
                throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"；可用 email_list 重新获取 uid）');
            }
            const body = await parseRawMessage(message.source, this.settings.maxBodyChars);
            signal?.throwIfAborted();
            return { account: name, uid, folder: folderName, ...body };
        }, true, signal);
    }
    async mark(accountName, folder, uid, action, toFolder, signal) {
        const name = this.resolveName(accountName);
        const cfg = this.account(name);
        const folderName = folder || cfg.inboxFolder;
        return this.withImap(name, folderName, async (client) => {
            const before = await client.fetchOne(uid, { uid: true, flags: true }, { uid: true });
            signal?.throwIfAborted();
            if (before === false) {
                throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"；可用 email_list 重新获取 uid）');
            }
            let seen = before.flags?.has('\\Seen') === true;
            let flagged = before.flags?.has('\\Flagged') === true;
            if (action === 'read' && !seen) {
                await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
                signal?.throwIfAborted();
                seen = true;
            }
            else if (action === 'unread' && seen) {
                await client.messageFlagsRemove(uid, ['\\Seen'], { uid: true });
                signal?.throwIfAborted();
                seen = false;
            }
            else if (action === 'star' && !flagged) {
                await client.messageFlagsAdd(uid, ['\\Flagged'], { uid: true });
                signal?.throwIfAborted();
                flagged = true;
            }
            else if (action === 'unstar' && flagged) {
                await client.messageFlagsRemove(uid, ['\\Flagged'], { uid: true });
                signal?.throwIfAborted();
                flagged = false;
            }
            else if (action === 'move') {
                const target = (toFolder ?? '').trim();
                if (target === '')
                    throw new MailError('move 操作需要 toFolder 参数（用 email_folders 查看可用文件夹）');
                if (target === folderName)
                    throw new MailError('邮件已在文件夹 "' + folderName + '" 中，无需移动');
                const folders = await client.list();
                signal?.throwIfAborted();
                if (!folders.some(row => row.path === target)) {
                    throw new MailError('找不到目标文件夹 "' + target + '"，可用：' + folders.map(row => row.path).join('、'));
                }
                const moved = await client.messageMove(uid, target, { uid: true });
                signal?.throwIfAborted();
                if (moved === false)
                    throw new MailError('移动 uid=' + uid + ' 到 "' + target + '" 失败（服务器拒绝了 MOVE/COPY）');
                const result = { account: name, uid, folder: folderName, action, seen, flagged, movedTo: target };
                const destUid = moved?.destinationUid;
                if (typeof destUid === 'number')
                    result.movedUid = destUid;
                return result;
            }
            return { account: name, uid, folder: folderName, action, seen, flagged };
        }, false, signal);
    }
    async folders(accountName, subscribedOnly, signal) {
        const name = this.resolveName(accountName);
        return this.withImap(name, null, async (client) => {
            const list = await client.list();
            signal?.throwIfAborted();
            const folders = list
                .filter(row => !subscribedOnly || row.subscribed !== false)
                .map(row => ({
                name: row.name ?? row.path,
                path: row.path,
                specialUse: row.specialUse ?? '',
                subscribed: row.subscribed !== false,
            }));
            return { account: name, folders };
        }, true, signal);
    }
    async downloadAttachment(accountName, folder, uid, index, workspaceHint, signal) {
        const name = this.resolveName(accountName);
        const cfg = this.account(name);
        const folderName = folder || cfg.inboxFolder;
        return this.withImap(name, folderName, async (client) => {
            const message = await client.fetchOne(uid, { uid: true, bodyStructure: true, source: true }, { uid: true });
            if (message === false || message.source === undefined) {
                throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"）');
            }
            // The mailparser list is authoritative for the index email_read showed;
            // the bodyStructure walk supplies the IMAP part to download.
            const body = await parseRawMessage(message.source, this.settings.maxBodyChars);
            signal?.throwIfAborted();
            const parts = collectAttachmentParts(message.bodyStructure);
            if (body.attachments.length === 0)
                throw new MailError('该邮件没有附件');
            if (body.attachments[index] === undefined) {
                throw new MailError('附件序号 ' + index + ' 越界：共 ' + body.attachments.length + ' 个附件（序号从 0 开始，与 email_read 返回的 attachments 顺序一致）');
            }
            const att = selectAttachmentPart(body.attachments, parts, index);
            if (att === undefined) {
                throw new MailError('附件 #' + index + '（' + body.attachments[index].filename + '）无法在邮件结构中定位（可能是内嵌图片，暂不支持下载）');
            }
            if (att.size > this.settings.maxAttachmentBytes) {
                throw new MailError('附件 "' + att.filename + '" 大小 ' + att.size + ' 字节，超过上限 maxAttachmentBytes=' + this.settings.maxAttachmentBytes);
            }
            const dl = await client.download(uid, att.part, { uid: true, maxBytes: this.settings.maxAttachmentBytes });
            signal?.throwIfAborted();
            const buf = await collectStream(dl.content, this.settings.maxAttachmentBytes, signal);
            const safeName = sanitizeFilename(dl.meta.filename ?? att.filename ?? body.attachments[index].filename);
            // Default the destination to the session workspace so the model can
            // read the file back; an explicit downloadDir always wins.
            const dir = this.settings.downloadDirExplicit
                ? this.settings.downloadDir
                : (typeof workspaceHint === 'string' && workspaceHint !== ''
                    ? join(workspaceHint, '.dsh-email-downloads')
                    : this.settings.downloadDir);
            await mkdir(dir, { recursive: true });
            signal?.throwIfAborted();
            const dest = await uniquePath(join(dir, safeName));
            signal?.throwIfAborted();
            await writeFile(dest, buf, signal === undefined ? undefined : { signal });
            return { account: name, uid, filename: safeName, contentType: att.contentType, size: buf.length, path: dest };
        }, true, signal);
    }
    async send(accountName, to, subject, text, cc, attachmentPaths, signal) {
        const name = this.resolveName(accountName);
        const cfg = this.account(name);
        const attachments = await validateAttachmentPaths(attachmentPaths ?? [], this.settings.maxAttachmentBytes, signal);
        const info = await this.sendMail(name, cfg, {
            from: cfg.user,
            to,
            cc,
            subject,
            text: text ?? '',
            attachments,
        }, signal);
        return {
            account: name,
            messageId: typeof info.messageId === 'string' ? info.messageId : String(info.messageId ?? ''),
            accepted: Array.isArray(info.accepted) ? info.accepted.map(String) : [],
            rejected: Array.isArray(info.rejected) ? info.rejected.map(String) : [],
            response: typeof info.response === 'string' ? info.response : String(info.response ?? ''),
        };
    }
    async reply(accountName, folder, uid, mode, text, forwardTo, cc, signal) {
        const name = this.resolveName(accountName);
        const cfg = this.account(name);
        const folderName = folder || cfg.inboxFolder;
        // Read the original first (read-only), send second: a failed compose never
        // leaves a half-written mailbox state behind.
        const built = await this.withImap(name, folderName, async (client) => {
            const message = await client.fetchOne(uid, { uid: true, source: true }, { uid: true });
            if (message === false || message.source === undefined) {
                throw new MailError('找不到 uid=' + uid + ' 的邮件（可能已被删除，或不在文件夹 "' + folderName + '"；可用 email_list 重新获取 uid）');
            }
            const ids = extractMessageIds(message.source);
            const body = await parseRawMessage(message.source, this.settings.maxBodyChars);
            signal?.throwIfAborted();
            return buildReplyMessage({ from: body.from, to: body.to, cc: body.cc, subject: body.subject, date: body.date, text: body.text, messageId: ids.messageId, references: ids.references }, mode, cfg.user, text, forwardTo);
        }, true, signal);
        const info = await this.sendMail(name, cfg, {
            from: cfg.user,
            to: built.to,
            cc,
            subject: built.subject,
            text: built.text,
            ...(built.inReplyTo !== undefined ? { inReplyTo: '<' + built.inReplyTo + '>' } : {}),
            ...(built.references !== undefined ? { references: built.references.split(' ').map(id => '<' + id + '>') } : {}),
        }, signal);
        return {
            account: name,
            mode,
            originalUid: uid,
            messageId: typeof info.messageId === 'string' ? info.messageId : String(info.messageId ?? ''),
            accepted: Array.isArray(info.accepted) ? info.accepted.map(String) : [],
            rejected: Array.isArray(info.rejected) ? info.rejected.map(String) : [],
            response: typeof info.response === 'string' ? info.response : String(info.response ?? ''),
            to: built.to.split(',').map(part => part.trim()).filter(part => part !== ''),
            subject: built.subject,
        };
    }
}
/** Stat every attachment path up front; total size must stay under the cap. */
export async function validateAttachmentPaths(paths, maxBytes, signal) {
    const out = [];
    let total = 0;
    for (const rawPath of paths) {
        signal?.throwIfAborted();
        if (typeof rawPath !== 'string' || rawPath.trim() === '') {
            throw new MailError('附件路径无效：' + String(rawPath));
        }
        const path = rawPath.trim();
        let info;
        try {
            info = await stat(path);
        }
        catch {
            throw new MailError('附件路径不存在或不可读：' + path);
        }
        signal?.throwIfAborted();
        if (!info.isFile())
            throw new MailError('附件路径不是文件：' + path);
        total += info.size;
        if (total > maxBytes) {
            throw new MailError('附件总大小超过上限 maxAttachmentBytes=' + maxBytes + ' 字节');
        }
        out.push({ path });
    }
    return out;
}
/** Drain a download stream into a Buffer with a hard byte cap. */
async function collectStream(stream, maxBytes, signal) {
    const chunks = [];
    let total = 0;
    const onAbort = () => {
        stream.destroy(signal?.reason instanceof Error ? signal.reason : new Error('邮件附件下载已取消'));
    };
    signal?.throwIfAborted();
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
        for await (const chunk of stream) {
            signal?.throwIfAborted();
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            total += buf.length;
            if (total > maxBytes)
                throw new MailError('附件超过上限 maxAttachmentBytes=' + maxBytes + ' 字节，下载中止');
            chunks.push(buf);
        }
        signal?.throwIfAborted();
        return Buffer.concat(chunks);
    }
    finally {
        signal?.removeEventListener('abort', onAbort);
    }
}
/** Avoid overwriting: append -1, -2, ... before the extension. */
async function uniquePath(path) {
    try {
        await stat(path);
    }
    catch {
        return path;
    }
    const dot = path.lastIndexOf('.');
    const base = dot > 0 ? path.slice(0, dot) : path;
    const ext = dot > 0 ? path.slice(dot) : '';
    for (let i = 1; i < 1000; i++) {
        const candidate = base + '-' + i + ext;
        try {
            await stat(candidate);
        }
        catch {
            return candidate;
        }
    }
    return base + '-' + Date.now() + ext;
}
