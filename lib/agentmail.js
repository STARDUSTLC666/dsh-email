import { randomUUID } from 'node:crypto';
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
            throw new Error('AgentMail 账号不存在');
        return c;
    }
    async request(name, suffix = '', query = {}, body, signal, method = 'POST') {
        const cfg = this.account(name);
        if (!['https://api.agentmail.to', 'https://api.agentmail.eu'].includes(cfg.apiBase ?? ''))
            throw new Error('AgentMail API 区域无效');
        const url = new URL('/v0/inboxes/' + encodeURIComponent(cfg.user) + suffix, cfg.apiBase);
        for (const [key, value] of Object.entries(query))
            if (value !== undefined)
                for (const item of Array.isArray(value) ? value : [value])
                    url.searchParams.append(key, String(item));
        const serialized = body ? JSON.stringify(body) : undefined;
        if (serialized && Buffer.byteLength(serialized) > 6_000_000)
            throw new Error('AgentMail 单次发送内容超过 6 MB，请缩小附件或正文');
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
            throw new Error('AgentMail 请求失败（HTTP ' +
                res.status +
                '）' +
                ({
                    401: '：请检查 API Key 和区域',
                    403: '：请检查账号权限、发信限制或邮箱状态',
                    404: '：邮箱或邮件不存在',
                    429: '：请求过于频繁，请稍后重试',
                }[res.status] ?? ''));
        }
        let size = 0;
        const chunks = [];
        for await (const chunk of res.body) {
            size += chunk.length;
            if (size > 4 * 1024 * 1024)
                throw new Error('AgentMail 响应过大');
            chunks.push(chunk);
        }
        const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (result.inbox_id !== undefined &&
            String(result.inbox_id).toLowerCase() !== cfg.user.toLowerCase())
            throw new Error('AgentMail 返回了其他邮箱，已拒绝使用');
        return result;
    }
    async test(name, signal) {
        const value = await this.request(name, '', {}, undefined, signal);
        if (String(value.inbox_id).toLowerCase() !==
            this.account(name).user.toLowerCase())
            throw new Error('AgentMail 返回了其他邮箱，已拒绝使用');
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
            throw new Error('AgentMail 文件夹可选 INBOX、Sent、Starred、Archive、All');
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
                throw new Error('AgentMail 返回了无效邮件列表');
            for (const row of res.messages) {
                const id = row.message_id;
                if (typeof id !== 'string' || !id || seen.has(id))
                    continue;
                this.id(id);
                if (row.inbox_id !== undefined &&
                    String(row.inbox_id).toLowerCase() !==
                        this.account(name).user.toLowerCase())
                    throw new Error('AgentMail 返回了其他邮箱，已拒绝使用');
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
                throw new Error('AgentMail 分页游标重复，请重新加载');
            tokens.add(token);
            if (page === 200)
                throw new Error('AgentMail 查询范围过大，请缩小日期或搜索条件');
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
            throw new Error('AgentMail uid 必须使用列表返回的字符串 message_id');
        return uid;
    }
    async original(name, uid, signal) {
        const id = this.id(uid), m = await this.request(name, '/messages/' + encodeURIComponent(id), {}, undefined, signal);
        if (m.message_id !== id)
            throw new Error('AgentMail 邮件标识不匹配');
        return m;
    }
    async read(name, uid, folder, signal) {
        const m = await this.original(name, uid, signal), body = truncateText(m.text ?? m.extracted_text ?? stripHtml(m.html ?? ''), this.settings.maxBodyChars);
        return {
            account: name,
            uid: this.id(uid),
            folder,
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
                size: Number(a.size) || 0,
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
                throw new Error('AgentMail 仅支持把 INBOX 归档到 Archive，不映射为 IMAP 移动或删除');
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
    async send(name, to, subject, text, cc, attachments, signal, reply) {
        await assertRecipientsAllowed(to, cc, this.settings.recipientPolicies?.get(name));
        const normalized = await normalizeRecipients(to, cc);
        const toList = normalized
            .filter((row) => row.field === 'to')
            .map((row) => row.address), ccList = normalized
            .filter((row) => row.field === 'cc')
            .map((row) => row.address);
        if (!toList.length)
            throw new Error('请填写有效收件人');
        if (attachments.length > 10 ||
            attachments.reduce((n, a) => n + a.content.length, 0) >
                Math.min(this.settings.maxAttachmentBytes, 4 * 1024 * 1024))
            throw new Error('AgentMail 附件总量最多 4 MiB，且不超过设置上限');
        const r = await this.request(name, reply
            ? '/messages/' + encodeURIComponent(this.id(reply.uid)) + '/reply'
            : '/messages/send', {}, {
            to: toList,
            ...(ccList.length ? { cc: ccList } : {}),
            ...(!reply ? { subject } : {}),
            text,
            attachments: attachments.map((a) => ({
                filename: a.filename,
                content: a.content.toString('base64'),
            })),
        }, signal);
        if (typeof r.message_id !== 'string')
            throw new Error('AgentMail 未返回发送回执，请先核对已发送邮件再重试');
        return {
            account: name,
            messageId: r.message_id,
            accepted: normalized.map((row) => row.address),
            rejected: [],
            response: 'AgentMail 已接受提交；不表示收件方已投递成功',
        };
    }
    async downloadAttachment(name, folder, uid, index, workspace, signal) {
        const m = await this.original(name, uid, signal), attachment = m.attachments?.[index];
        if (!attachment || typeof attachment.attachment_id !== 'string')
            throw new Error('附件不存在，请重新打开邮件');
        const meta = await this.request(name, '/messages/' +
            encodeURIComponent(this.id(uid)) +
            '/attachments/' +
            encodeURIComponent(attachment.attachment_id), {}, undefined, signal);
        const cap = Math.min(this.settings.maxAttachmentBytes, 20 * 1024 * 1024);
        if (Number(meta.size) > cap)
            throw new Error('附件超过下载大小上限（AgentMail 最多 20 MiB）');
        const content = await this.downloader(String(meta.download_url), cap, signal);
        if (content.length > cap)
            throw new Error('附件超过下载大小上限（AgentMail 最多 20 MiB）');
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
    async sendPaths(name, to, subject, text, cc, paths, signal) {
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
                    throw new Error('AgentMail 附件总量最多 4 MiB');
                chunks.push(data);
            }
            attachments.push({
                filename: basename(path),
                content: Buffer.concat(chunks),
            });
        }
        return this.send(name, to, subject, text, cc, attachments, signal);
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
            throw new Error('AgentMail 文件夹无效');
        let token;
        for (let page = 0; page < 50; page++) {
            const result = await this.request(name, '/messages', { limit: 100, page_token: token, labels: label }, undefined, signal);
            if (!Array.isArray(result.messages))
                throw new Error('AgentMail 返回了无效邮件列表');
            for (const message of result.messages) {
                const id = this.id(message.message_id);
                if (message.inbox_id !== undefined &&
                    String(message.inbox_id).toLowerCase() !==
                        this.account(name).user.toLowerCase())
                    throw new Error('AgentMail 返回了其他邮箱，已拒绝使用');
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
                throw new Error('AgentMail 分页游标重复，请重新加载');
            tokens.add(token);
        }
        signal?.throwIfAborted();
        if (old && (old.anchor ? !ids.has(old.anchor) : !!token))
            throw new Error('AgentMail 新邮件基线已超出窗口或被移除，请手动核对邮箱后重新启用提醒');
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
