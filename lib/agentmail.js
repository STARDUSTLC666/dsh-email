import { randomUUID } from 'node:crypto';
import { prepareMailBody } from './outgoing-body.js';
import { richEmailBody } from './rich-body.js';
import { createReadStream } from 'node:fs';
import { mkdir, open, unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import addressParser from 'nodemailer/lib/addressparser/index.js';
import { flattenAddresses, sanitizeFilename, stripHtml, truncateText, } from './parse.js';
import { downloadPublicBytes } from './public-download.js';
import { assertRecipientsAllowed, normalizeRecipients, } from './recipient-policy.js';
const labels = (m) => (Array.isArray(m.labels) ? m.labels : []);
const parsedAddresses = (value) => flattenAddresses(addressParser(value, { flatten: true }));
const listRow = (m) => ({
    uid: String(m.message_id),
    date: m.timestamp ?? '',
    from: parsedAddresses(m.from ?? ''),
    subject: m.subject ?? '',
    seen: !labels(m).includes('unread'),
    flagged: labels(m).includes('starred'),
    size: Number(m.size) || 0,
    hasAttachments: Array.isArray(m.attachments) && m.attachments.length > 0,
});
/** API transport. Endpoint hosts are fixed; redirects never carry credentials elsewhere. */
export class AgentMailClient {
    settings;
    fetcher;
    downloader;
    watches = new Map();
    constructor(settings, fetcher = globalThis.fetch, downloader = downloadPublicBytes) {
        this.settings = settings;
        this.fetcher = fetcher;
        this.downloader = downloader;
    }
    account(name) {
        const c = this.settings.accounts.get(name);
        if (c?.transport !== 'agentmail')
            throw new Error('AgentMail account does not exist');
        return c;
    }
    async request(name, suffix = '', query = {}, body, signal, method = 'POST') {
        const cfg = this.account(name);
        if (!['https://api.agentmail.to', 'https://api.agentmail.eu'].includes(cfg.apiBase ?? ''))
            throw new Error('AgentMail API region is invalid');
        const url = new URL('/v0/inboxes/' + encodeURIComponent(cfg.user) + suffix, cfg.apiBase);
        for (const [key, value] of Object.entries(query))
            if (value !== undefined)
                for (const item of Array.isArray(value) ? value : [value])
                    url.searchParams.append(key, String(item));
        const serialized = body ? JSON.stringify(body) : undefined;
        if (serialized && Buffer.byteLength(serialized) > 6_000_000)
            throw new Error('AgentMail payload exceeds 6 MB; reduce attachments or body text');
        const res = await this.fetcher(url, {
            method: body ? method : 'GET',
            redirect: 'error',
            signal: AbortSignal.any([
                ...(signal ? [signal] : []),
                AbortSignal.timeout(30000),
            ]),
            headers: {
                authorization: 'Bearer ' + cfg.password,
                ...(body
                    ? {
                        'content-type': 'application/json',
                        'Idempotency-Key': randomUUID(),
                    }
                    : {}),
            },
            body: serialized,
        });
        if (!res.ok) {
            await res.body?.cancel();
            throw new Error('AgentMail request failed (HTTP ' +
                res.status +
                ')' +
                ({
                    401: ': check the API key and region',
                    403: ': check account permissions, sending limits or mailbox status',
                    404: ': mailbox or message not found',
                    429: ': too many requests; retry later',
                }[res.status] ?? ''));
        }
        let size = 0;
        const chunks = [];
        for await (const chunk of res.body) {
            size += chunk.length;
            if (size > 4 * 1024 * 1024)
                throw new Error('AgentMail response is too large');
            chunks.push(chunk);
        }
        const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (result.inbox_id !== undefined &&
            String(result.inbox_id).toLowerCase() !== cfg.user.toLowerCase())
            throw new Error('AgentMail returned a different mailbox; refusing to use it');
        return result;
    }
    async test(name, signal) {
        const value = await this.request(name, '', {}, undefined, signal);
        if (String(value.inbox_id).toLowerCase() !==
            this.account(name).user.toLowerCase())
            throw new Error('AgentMail returned a different mailbox; refusing to use it');
        return value;
    }
    folderLabel(folder) {
        return {
            INBOX: 'received',
            Sent: 'sent',
            Starred: 'starred',
            Archive: 'archived',
        }[folder];
    }
    async list(name, folder, limit, offset, unread, since, until, signal, query) {
        if (!['INBOX', 'Sent', 'Starred', 'Archive', 'All'].includes(folder))
            throw new Error('AgentMail folder must be INBOX, Sent, Starred, Archive or All');
        const rows = [];
        let token;
        let hasMore = false;
        const seen = new Set(), tokens = new Set();
        // Offset compatibility is bounded; API page counts are never presented as mailbox totals.
        for (let page = 0; page < 201; page++) {
            const label = this.folderLabel(folder);
            const filters = [...(label ? [label] : []), ...(unread ? ['unread'] : [])];
            const res = await this.request(name, query ? '/messages/search' : '/messages', {
                limit: 100,
                page_token: token,
                q: query,
                after: since?.toISOString(),
                before: until?.toISOString(),
                ...(!query && filters.length ? { labels: filters } : {}),
            }, undefined, signal);
            if (!Array.isArray(res.messages))
                throw new Error('AgentMail returned an invalid message list');
            for (const row of res.messages) {
                const id = row.message_id;
                if (typeof id !== 'string' || !id || seen.has(id))
                    continue;
                this.id(id);
                if (row.inbox_id !== undefined &&
                    String(row.inbox_id).toLowerCase() !==
                        this.account(name).user.toLowerCase())
                    throw new Error('AgentMail returned a different mailbox; refusing to use it');
                seen.add(id);
                if (query && label && !labels(row).includes(label))
                    continue;
                if (unread && !labels(row).includes('unread'))
                    continue;
                rows.push(row);
            }
            token =
                typeof res.next_page_token === 'string' && res.next_page_token
                    ? res.next_page_token
                    : undefined;
            hasMore = !!token || rows.length > offset + limit;
            if (rows.length > offset + limit || !token)
                break;
            if (tokens.has(token))
                throw new Error('AgentMail repeated a page cursor; reload the list');
            tokens.add(token);
            if (page === 200)
                throw new Error('AgentMail query is too broad; narrow the date range or search terms');
        }
        return {
            account: name,
            folder,
            uidValidity: 0,
            count: rows.length,
            countExact: !token,
            hasMore,
            messages: rows.slice(offset, offset + limit).map(listRow),
            ...(query ? { order: 'relevance' } : {}),
        };
    }
    async search(name, query, folder, limit, offset, since, until, signal) {
        const r = await this.list(name, folder, limit, offset, false, since, until, signal, query);
        return { ...r, query, offset, searchSource: 'api', order: 'relevance' };
    }
    id(uid) {
        if (typeof uid !== 'string' ||
            !uid ||
            uid === '.' ||
            uid === '..' ||
            uid.length > 998 ||
            /[\x00-\x1f\x7f]/.test(uid))
            throw new Error('AgentMail uid must be the string message_id returned by the list');
        return uid;
    }
    async original(name, uid, signal) {
        const id = this.id(uid), m = await this.request(name, '/messages/' + encodeURIComponent(id), {}, undefined, signal);
        if (m.message_id !== id)
            throw new Error('AgentMail message id does not match');
        return m;
    }
    async read(name, uid, folder, signal) {
        const m = await this.original(name, uid, signal), rich = richEmailBody(m.html), body = truncateText(m.text ?? m.extracted_text ?? stripHtml(m.html ?? ''), this.settings.maxBodyChars);
        return {
            account: name,
            uid: this.id(uid),
            folder,
            ...(rich ? { rich } : {}),
            date: m.timestamp ?? '',
            from: parsedAddresses(m.from ?? ''),
            to: parsedAddresses((m.to ?? []).join(', ')),
            cc: parsedAddresses((m.cc ?? []).join(', ')),
            subject: m.subject ?? '',
            text: body.text,
            truncated: body.truncated,
            attachments: (m.attachments ?? []).map((a) => ({
                filename: a.filename ?? 'attachment',
                contentType: a.content_type ?? 'application/octet-stream',
                size: Number.isFinite(Number(a.size)) && Number(a.size) >= 0 ? Number(a.size) : 0,
                part: String(a.attachment_id),
            })),
        };
    }
    async mark(name, folder, uid, action, target, signal) {
        const changes = {
            read: { remove_labels: ['unread'] },
            unread: { add_labels: ['unread'] },
            star: { add_labels: ['starred'] },
            unstar: { remove_labels: ['starred'] },
        };
        if (action === 'move') {
            if (target !== 'Archive' || folder !== 'INBOX')
                throw new Error('AgentMail can only archive INBOX to Archive; it does not map to IMAP move or delete');
            changes.move = { add_labels: ['archived'], remove_labels: ['received'] };
        }
        const r = await this.request(name, '/messages/' + encodeURIComponent(this.id(uid)), {}, changes[action], signal, 'PATCH');
        return {
            account: name,
            folder,
            uid,
            action,
            seen: !labels(r).includes('unread'),
            flagged: labels(r).includes('starred'),
            ...(action === 'move' ? { movedTo: 'Archive' } : {}),
        };
    }
    async send(name, to, subject, text, cc, attachments, signal, reply, html) {
        await assertRecipientsAllowed(to, cc, this.settings.recipientPolicies?.get(name));
        const normalized = await normalizeRecipients(to, cc);
        const toList = normalized
            .filter((row) => row.field === 'to')
            .map((row) => row.address), ccList = normalized
            .filter((row) => row.field === 'cc')
            .map((row) => row.address);
        if (!toList.length)
            throw new Error('Enter a valid recipient');
        if (attachments.length > 10 ||
            attachments.reduce((n, a) => n + a.content.length, 0) >
                Math.min(this.settings.maxAttachmentBytes, 4 * 1024 * 1024))
            throw new Error('AgentMail attachments may total at most 4 MiB and must stay under the configured limit');
        const r = await this.request(name, reply
            ? '/messages/' + encodeURIComponent(this.id(reply.uid)) + '/reply'
            : '/messages/send', {}, {
            to: toList,
            ...(ccList.length ? { cc: ccList } : {}),
            ...(!reply ? { subject } : {}),
            ...prepareMailBody(text, html),
            attachments: attachments.map((a) => ({
                filename: a.filename,
                content: a.content.toString('base64'),
            })),
        }, signal);
        if (typeof r.message_id !== 'string')
            throw new Error('AgentMail returned no send receipt; check Sent mail before retrying');
        return {
            account: name,
            messageId: r.message_id,
            accepted: normalized.map((row) => row.address),
            rejected: [],
            response: 'AgentMail accepted the submission; this does not mean the recipient received it',
        };
    }
    async downloadAttachment(name, folder, uid, index, workspace, signal, byteLimit) {
        const m = await this.original(name, uid, signal), attachment = m.attachments?.[index];
        if (!attachment || typeof attachment.attachment_id !== 'string')
            throw new Error('Attachment no longer exists; reopen the message');
        const meta = await this.request(name, '/messages/' +
            encodeURIComponent(this.id(uid)) +
            '/attachments/' +
            encodeURIComponent(attachment.attachment_id), {}, undefined, signal);
        const cap = Math.min(this.settings.maxAttachmentBytes, 20 * 1024 * 1024, byteLimit ?? this.settings.maxAttachmentBytes);
        if (Number(meta.size) > cap)
            throw new Error('Attachment exceeds the download size limit (AgentMail allows at most 20 MiB)');
        const content = await this.downloader(String(meta.download_url), cap, signal);
        if (content.length > cap)
            throw new Error('Attachment exceeds the download size limit (AgentMail allows at most 20 MiB)');
        const filename = sanitizeFilename(attachment.filename ?? meta.filename ?? 'attachment'), dir = this.settings.downloadDirExplicit
            ? this.settings.downloadDir
            : workspace
                ? join(workspace, '.dsh-email-downloads')
                : this.settings.downloadDir;
        await mkdir(dir, { recursive: true });
        const path = join(dir, randomUUID() + '-' + filename), handle = await open(path, 'wx', 0o600);
        try {
            signal?.throwIfAborted();
            await handle.writeFile(content);
            signal?.throwIfAborted();
        }
        catch (error) {
            await handle.close();
            await unlink(path).catch(() => { });
            throw error;
        }
        finally {
            await handle.close();
        }
        return {
            account: name,
            uid,
            filename,
            contentType: attachment.content_type ?? 'application/octet-stream',
            size: content.length,
            path,
        };
    }
    async sendPaths(name, to, subject, text, cc, paths, signal, html) {
        await assertRecipientsAllowed(to, cc, this.settings.recipientPolicies?.get(name));
        const attachments = [];
        let bytes = 0;
        for (const path of paths) {
            const chunks = [];
            signal?.throwIfAborted();
            for await (const chunk of createReadStream(path, { signal })) {
                const data = Buffer.from(chunk);
                bytes += data.length;
                if (bytes > Math.min(this.settings.maxAttachmentBytes, 4 * 1024 * 1024))
                    throw new Error('AgentMail attachments may total at most 4 MiB');
                chunks.push(data);
            }
            attachments.push({
                filename: basename(path),
                content: Buffer.concat(chunks),
            });
        }
        return this.send(name, to, subject, text, cc, attachments, signal, undefined, html);
    }
    async watch(name, folder, limit, scope, signal) {
        signal?.throwIfAborted();
        const key = JSON.stringify([name, folder, scope]), old = this.watches.get(key);
        if (old?.pending.length) {
            const batch = old.pending.splice(0, limit);
            return {
                account: name,
                folder,
                firstRun: false,
                newCount: batch.length,
                messages: batch,
                totalUnread: old.totalUnread,
                totalUnreadExact: old.totalUnreadExact,
            };
        }
        // Follow opaque API cursors directly, without re-reading earlier pages.
        const label = this.folderLabel(folder), rows = [], ids = new Set(), tokens = new Set();
        if (!['INBOX', 'Sent', 'Starred', 'Archive', 'All'].includes(folder))
            throw new Error('Invalid AgentMail folder');
        let token;
        for (let page = 0; page < 50; page++) {
            const result = await this.request(name, '/messages', { limit: 100, page_token: token, labels: label }, undefined, signal);
            if (!Array.isArray(result.messages))
                throw new Error('AgentMail returned an invalid message list');
            for (const message of result.messages) {
                const id = this.id(message.message_id);
                if (message.inbox_id !== undefined &&
                    String(message.inbox_id).toLowerCase() !==
                        this.account(name).user.toLowerCase())
                    throw new Error('AgentMail returned a different mailbox; refusing to use it');
                if (!ids.has(id)) {
                    ids.add(id);
                    rows.push(listRow(message));
                }
            }
            token =
                typeof result.next_page_token === 'string' && result.next_page_token
                    ? result.next_page_token
                    : undefined;
            if (!old || (old.anchor && ids.has(old.anchor)) || !token)
                break;
            if (tokens.has(token))
                throw new Error('AgentMail repeated a page cursor; reload the list');
            tokens.add(token);
        }
        signal?.throwIfAborted();
        if (old && (old.anchor ? !ids.has(old.anchor) : !!token))
            throw new Error('AgentMail new-mail baseline fell outside the window or was removed; check the mailbox and re-enable the watch');
        const totalUnread = rows.filter((m) => !m.seen).length, totalUnreadExact = !token, anchor = String(rows[0]?.uid ?? '');
        const before = old?.anchor
            ? rows.findIndex((m) => m.uid === old.anchor)
            : rows.length;
        const pending = old
            ? rows
                .slice(0, before)
                .filter((m) => !m.seen)
                .reverse()
            : [];
        this.watches.set(key, { anchor, pending, totalUnread, totalUnreadExact });
        const batch = pending.splice(0, limit);
        return {
            account: name,
            folder,
            firstRun: !old,
            newCount: batch.length,
            messages: batch,
            totalUnread,
            totalUnreadExact,
        };
    }
    clear() {
        this.watches.clear();
    }
}
