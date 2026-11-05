import { readFile, unlink } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { downloadPublicBytes, PublicDownloadError } from './public-download.js';
import { rasterMime } from './rich-body.js';
import { moveUids } from './imap-trash.js';
import { buildReplyMessage } from './mail-client.js';
import { draftFields } from './draft-store.js';
import { parseEmailDay } from './tool-contract.js';
import { clampInt } from './config.js';
function boundedSet(map, id, value, max) {
    for (const [key, row] of map)
        if (row.expires < Date.now())
            map.delete(key);
    while (map.size >= max)
        map.delete(map.keys().next().value);
    map.set(id, value);
}
export const MAILBOX_ROUTE = '/api/dsh-email/mailbox';
const json = (status, value) => new Response(JSON.stringify(value), {
    status,
    headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
    },
});
export class EmailMailboxBackend {
    runtime;
    drafts;
    download;
    moves = new Map();
    images = new Map();
    constructor(runtime, drafts, download = downloadPublicBytes) {
        this.runtime = runtime;
        this.drafts = drafts;
        this.download = download;
    }
    fingerprint(account) {
        return createHash('sha256').update(JSON.stringify(this.runtime.getEffectiveSettings().accounts.get(account))).digest('hex');
    }
    unchanged(account, fingerprint) {
        if (this.fingerprint(account) !== fingerprint)
            throw new Error('账号设置已改变，请刷新后重新操作 / Account changed; refresh before continuing');
    }
    present(message, fingerprint) {
        this.unchanged(message.account, fingerprint);
        if (!message.rich)
            return message;
        const images = message.rich.images.map(image => {
            const id = randomUUID();
            boundedSet(this.images, id, { account: message.account, folder: message.folder, uid: message.uid, uidValidity: message.uidValidity, image, fingerprint, expires: Date.now() + 10 * 60_000 }, 256);
            return { id, kind: image.kind, alt: image.alt };
        });
        return { ...message, rich: { nodes: message.rich.nodes, limited: message.rich.limited, images } };
    }
    async imageBytes(body, signal) {
        const ticket = typeof body.image === 'string' ? this.images.get(body.image) : undefined;
        if (!ticket || ticket.expires < Date.now() || ticket.account !== body.account || ticket.folder !== body.folder || ticket.uid !== body.uid || ticket.fingerprint !== this.fingerprint(ticket.account))
            throw new Error('图片已过期，请重新打开邮件 / Image expired; reopen the message');
        const { image } = ticket;
        let bytes;
        try {
            if (image.kind === 'remote') {
                if (body.allowRemote !== true)
                    throw new Error('consent required');
                bytes = await this.download(image.source, 2 * 1024 * 1024, signal);
            }
            else if (image.attachment !== undefined) {
                const pool = this.runtime.getPool(), current = await pool.read(ticket.account, ticket.uid, ticket.folder, signal);
                if (ticket.uidValidity && current.uidValidity !== ticket.uidValidity)
                    throw new Error('mailbox changed');
                const file = await pool.downloadAttachment(ticket.account, ticket.folder, ticket.uid, image.attachment, undefined, signal, 2 * 1024 * 1024, ticket.uidValidity);
                try {
                    bytes = await readFile(file.path);
                }
                finally {
                    await unlink(file.path).catch(() => { });
                }
            }
            else
                bytes = Buffer.from(image.source.slice(image.source.indexOf(',') + 1), 'base64');
            const mime = rasterMime(bytes);
            if (!mime)
                throw new Error('unsupported image');
            return new Response(new Uint8Array(bytes), { headers: { 'content-type': mime, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox" } });
        }
        catch (error) {
            if (error instanceof PublicDownloadError)
                throw error;
            throw new Error('图片未能显示：可能是连接失败、超过 2 MiB 或格式不支持。可重试或下载原附件 / Image unavailable: connection, size (2 MiB) or format; retry or download the attachment');
        }
    }
    async action(body, signal) {
        const settings = this.runtime.getEffectiveSettings(), account = typeof body.account === 'string' && body.account
            ? body.account
            : settings.defaultAccount, cfg = settings.accounts.get(account);
        if (!cfg)
            throw new Error('账号不存在，请重新选择');
        const accountFingerprint = this.fingerprint(account);
        if (body.action === 'accounts')
            return {
                accounts: [...settings.accounts].map(([name, c]) => ({
                    name,
                    user: c.user,
                    api: c.transport === 'agentmail',
                    incoming: c.transport ?? 'imap',
                    trashSupported: !c.transport,
                })),
                defaultAccount: settings.defaultAccount,
            };
        const pool = this.runtime.getPool(), folder = typeof body.folder === 'string' && body.folder
            ? body.folder
            : cfg.inboxFolder;
        if (folder.length > 1024 || /[\r\n\0]/.test(folder))
            throw new Error('无效文件夹');
        if (body.action === 'folders')
            return pool.folders(account, false, signal);
        if (body.action === 'trashPreview') {
            const preview = await pool.previewTrash(account, folder, moveUids(body.uids), typeof body.target === 'string' ? body.target : undefined, signal);
            this.unchanged(account, accountFingerprint);
            if (body.uidValidity && body.uidValidity !== preview.uidValidity)
                throw new Error('UIDVALIDITY 已改变，请刷新列表 / Mailbox changed; refresh the list');
            const id = randomUUID(), expires = Date.now() + 90_000;
            boundedSet(this.moves, id, { kind: 'trash', account, folder, target: preview.target, uids: preview.messages.map(m => m.uid), uidValidity: preview.uidValidity, fingerprint: accountFingerprint, expires }, 64);
            return { ...preview, id, expires };
        }
        if (body.action === 'trashConfirm' || body.action === 'undoTrash') {
            const id = String(body.receipt || ''), ticket = this.moves.get(id), kind = body.action === 'trashConfirm' ? 'trash' : 'undo';
            if (!ticket || ticket.kind !== kind || ticket.account !== account || ticket.folder !== folder || ticket.expires < Date.now() || body.confirmed !== true || ticket.fingerprint !== this.fingerprint(account))
                throw new Error('确认已过期或账号已改变，请刷新后重新确认 / Confirmation expired or account changed; refresh');
            this.moves.delete(id);
            const moved = await pool.moveMessages(account, folder, ticket.uids, ticket.target, ticket.uidValidity, signal);
            if (kind === 'trash' && moved.destinationUids && moved.destinationValidity) {
                const undo = randomUUID(), undoExpires = Date.now() + 5 * 60_000;
                boundedSet(this.moves, undo, { kind: 'undo', account, folder: ticket.target, target: folder, uids: moved.destinationUids, uidValidity: moved.destinationValidity, fingerprint: ticket.fingerprint, expires: undoExpires }, 64);
                return { count: moved.count, target: ticket.target, undo, undoExpires };
            }
            return { count: moved.count, target: ticket.target };
        }
        if (body.action === 'list') {
            const limit = clampInt(body.limit, 20, 1, 100), offset = clampInt(body.offset, 0, 0, 10000);
            const since = typeof body.since === 'string' && body.since
                ? parseEmailDay(body.since, 'since')
                : undefined, until = typeof body.until === 'string' && body.until
                ? parseEmailDay(body.until, 'until', true)
                : undefined;
            const query = typeof body.query === 'string' ? body.query.trim() : '';
            if (query.length > 500)
                throw new Error('搜索词过长');
            return query
                ? pool.search(account, query, folder, limit, offset, since, until, signal, {
                    headerScanOffset: clampInt(body.headerScanOffset, 0, 0, 1_000_000_000),
                })
                : pool.list(account, folder, limit, offset, body.unreadOnly === true, since, until, signal);
        }
        const uid = body.uid;
        if (!((typeof uid === 'number' && Number.isSafeInteger(uid) && uid > 0) ||
            (typeof uid === 'string' &&
                uid.length > 0 &&
                uid.length <= 998 &&
                !/[\r\n\0]/.test(uid))))
            throw new Error('请从邮件列表重新选择邮件');
        if (body.action === 'read')
            return this.present(await pool.read(account, uid, folder, signal), accountFingerprint);
        if (body.action === 'mark') {
            if (!['read', 'unread', 'star', 'unstar'].includes(String(body.mark)))
                throw new Error('不支持的邮件状态操作');
            return pool.mark(account, folder, uid, body.mark, undefined, signal);
        }
        if (body.action === 'replyDraft') {
            const original = await pool.read(account, uid, folder, signal), mode = body.replyAll === true ? 'reply-all' : 'reply';
            this.unchanged(account, accountFingerprint);
            const built = buildReplyMessage({ ...original, messageId: '', references: '' }, mode, [cfg.user, cfg.authUser], '');
            const created = await this.drafts.store.create(draftFields({
                account,
                to: built.to,
                cc: '',
                subject: built.subject,
                text: built.text,
            }), [], signal);
            return this.drafts.store.change(created.id, created.revision, (draft) => {
                draft.reply = {
                    uid,
                    folder,
                    ...(original.uidValidity
                        ? { uidValidity: original.uidValidity }
                        : {}),
                };
            }, signal);
        }
        throw new Error('不支持的邮箱操作');
    }
    async fetch(request) {
        const fail = (status) => json(status, {
            ok: false,
            error: {
                message: '邮件操作失败，请检查账号、连接或稍后重试 / Email action failed; check the account and connection',
            },
        });
        const origin = request.headers.get('origin'), site = request.headers.get('sec-fetch-site');
        if (request.method !== 'POST' ||
            request.headers.get('x-dsh-email-mailbox') !== '1' ||
            request.headers.get('content-type')?.split(';')[0] !==
                'application/json' ||
            (site && !['same-origin', 'none'].includes(site)))
            return fail(403);
        // DSH's authenticated connection carrier reconstructs the URL internally;
        // the original Host header identifies the browser-facing origin.
        if (origin) {
            try {
                const source = new URL(origin);
                if (origin !== 'dsh-app://app' && (!['http:', 'https:'].includes(source.protocol) ||
                    source.host !==
                        (request.headers.get('host') || new URL(request.url).host)))
                    return fail(403);
            }
            catch {
                return fail(403);
            }
        }
        const reader = request.body?.getReader();
        if (!reader)
            return fail(400);
        try {
            const chunks = [];
            let size = 0;
            for (;;) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                size += value.length;
                if (size > 16384) {
                    await reader.cancel();
                    return fail(413);
                }
                chunks.push(value);
            }
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (!body || typeof body !== 'object' || Array.isArray(body))
                return fail(400);
            const signal = AbortSignal.any([
                request.signal,
                AbortSignal.timeout(120000),
            ]);
            if (body.action === 'image')
                return await this.imageBytes(body, signal);
            if (body.action === 'download') {
                // The authenticated file action owns only the copy created by this call.
                const settings = this.runtime.getEffectiveSettings(), account = typeof body.account === 'string' && body.account
                    ? body.account
                    : settings.defaultAccount, cfg = settings.accounts.get(account), folder = typeof body.folder === 'string' && body.folder
                    ? body.folder
                    : (cfg?.inboxFolder ?? '');
                if (!cfg ||
                    folder.length > 1024 ||
                    /[\r\n\0]/.test(folder) ||
                    !Number.isSafeInteger(body.index) ||
                    body.index < 0 ||
                    body.index > 999)
                    return fail(400);
                if (!((typeof body.uid === 'number' &&
                    Number.isSafeInteger(body.uid) &&
                    body.uid > 0) ||
                    (typeof body.uid === 'string' &&
                        body.uid.length > 0 &&
                        body.uid.length <= 998 &&
                        !/[\r\n\0]/.test(body.uid))))
                    return fail(400);
                const file = await this.runtime
                    .getPool()
                    .downloadAttachment(account, folder, body.uid, clampInt(body.index, 0, 0, 999), undefined, signal);
                try {
                    const bytes = await readFile(file.path);
                    if (bytes.length >
                        this.runtime.getEffectiveSettings().maxAttachmentBytes)
                        return fail(413);
                    return new Response(new Uint8Array(bytes), {
                        headers: {
                            'content-type': 'application/octet-stream',
                            'content-disposition': "attachment; filename*=UTF-8''" +
                                encodeURIComponent(file.filename),
                            'x-content-type-options': 'nosniff',
                            'cache-control': 'no-store',
                        },
                    });
                }
                finally {
                    await unlink(file.path).catch(() => { });
                }
            }
            return json(200, { ok: true, value: await this.action(body, signal) });
        }
        catch (error) {
            let message = error instanceof Error ? error.message : '邮件操作失败';
            try {
                for (const cfg of this.runtime.getEffectiveSettings().accounts.values())
                    for (const key of [cfg.password, cfg.authPassword])
                        if (key)
                            message = message.split(key).join('[已隐藏]');
            }
            catch { }
            return json(400, {
                ok: false,
                error: { message: message.slice(0, 1000) },
            });
        }
        finally {
            reader.releaseLock();
        }
    }
}
export function installEmailMailbox(ctx, backend) {
    ctx.inject?.(['connection'], (host) => host.connection?.fetch?.register?.({
        path: MAILBOX_ROUTE,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: (request) => backend.fetch(request),
    }));
}
