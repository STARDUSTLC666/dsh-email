import { readFile, unlink } from 'node:fs/promises';
import { buildReplyMessage } from './mail-client.js';
import { draftFields } from './draft-store.js';
import { parseEmailDay } from './tool-contract.js';
import { clampInt } from './config.js';
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
    constructor(runtime, drafts) {
        this.runtime = runtime;
        this.drafts = drafts;
    }
    async action(body, signal) {
        const settings = this.runtime.getEffectiveSettings(), account = typeof body.account === 'string' && body.account
            ? body.account
            : settings.defaultAccount, cfg = settings.accounts.get(account);
        if (!cfg)
            throw new Error('账号不存在，请重新选择');
        if (body.action === 'accounts')
            return {
                accounts: [...settings.accounts].map(([name, c]) => ({
                    name,
                    user: c.user,
                    api: c.transport === 'agentmail',
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
            return pool.read(account, uid, folder, signal);
        if (body.action === 'mark') {
            if (!['read', 'unread', 'star', 'unstar'].includes(String(body.mark)))
                throw new Error('不支持的邮件状态操作');
            return pool.mark(account, folder, uid, body.mark, undefined, signal);
        }
        if (body.action === 'replyDraft') {
            const original = await pool.read(account, uid, folder, signal), mode = body.replyAll === true ? 'reply-all' : 'reply';
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
                if (!['http:', 'https:'].includes(source.protocol) ||
                    source.host !==
                        (request.headers.get('host') || new URL(request.url).host))
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
