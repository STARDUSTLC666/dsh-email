import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, open, stat } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { DraftError, DraftStore, draftFields } from './draft-store.js';
import { assertRecipientsAllowed, matchRecipients, parseRecipientPolicies, serializeRecipientPolicies, RecipientPolicyError } from './recipient-policy.js';
import { messageOf, redactCredentials } from './mail-client.js';
export const EMAIL_DRAFT_ROUTE = '/api/dsh-email/drafts';
const MAX_BYTES = 20 * 1024 * 1024;
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const json = (status, value) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const editable = (draft) => { if (draft.state !== 'draft')
    throw new DraftError('已提交或结果未确定的邮件不能再次发送；请先去邮箱核对，必要时复制为新草稿', 'draft-submitted'); };
const view = (draft) => ({ ...draft, attachments: draft.attachments.map(({ id, filename }) => ({ id, filename })) });
/** All mutations use the host's authenticated fetch carrier and an explicit UI action. */
export class EmailDraftBackend {
    runtime;
    settings;
    options;
    store;
    plans = new Map();
    constructor(runtime, settings, options = {}) {
        this.runtime = runtime;
        this.settings = settings;
        this.options = options;
        this.store = options.store ?? new DraftStore();
    }
    now() { return this.options.now?.() ?? Date.now(); }
    prune() { for (const [id, plan] of this.plans)
        if (this.now() - plan.created > 10 * 60 * 1000)
            this.plans.delete(id); }
    invalidate(id) { for (const [key, plan] of this.plans)
        if (plan.draft.id === id)
            this.plans.delete(key); }
    connection(account) {
        const settings = this.runtime.getEffectiveSettings(), name = account || settings.defaultAccount, config = settings.accounts.get(name);
        if (!config)
            throw new DraftError('发件账号不存在，请重新选择账号');
        const value = this.runtime.getSettingsValue(), policies = parseRecipientPolicies(value.trustedRecipientsYaml);
        return { name, config, cap: Math.min(settings.maxAttachmentBytes, MAX_BYTES), policy: policies.get(name), key: hash({ name, config, cap: settings.maxAttachmentBytes, policies: value.trustedRecipientsYaml ?? '', approval: value.sendApproval }) };
    }
    safe(error) {
        let message = redactCredentials(messageOf(error, '操作失败，请稍后重试'));
        try {
            for (const account of this.runtime.getEffectiveSettings().accounts.values())
                for (const secret of [account.password, account.authPassword])
                    if (secret && secret.length >= 4)
                        message = message.split(secret).join('[已隐藏]');
        }
        catch { /* Incomplete account errors are actionable. */ }
        return message.slice(0, 1200);
    }
    async bytes(file, cap, signal) {
        signal?.throwIfAborted();
        let stream;
        try {
            const info = await stat(file.path);
            if (!info.isFile() || info.size > cap)
                throw new Error('size');
            stream = createReadStream(file.path, { signal });
            const parts = [];
            let total = 0;
            for await (const part of stream) {
                signal?.throwIfAborted();
                const chunk = Buffer.from(part);
                total += chunk.length;
                if (total > cap)
                    throw new Error('size');
                parts.push(chunk);
            }
            return Buffer.concat(parts);
        }
        catch {
            signal?.throwIfAborted();
            throw new DraftError('附件「' + file.filename + '」不可读或超过草稿附件上限，请移除后重新添加');
        }
        finally {
            stream?.destroy();
        }
    }
    async attachments(draft, cap, signal) {
        const result = [];
        let used = 0;
        for (const file of draft.attachments) {
            const content = await this.bytes(file, cap - used, signal);
            used += content.length;
            result.push({ id: file.id, filename: file.filename, content });
        }
        return result;
    }
    async create(input, signal) {
        const fields = draftFields(input);
        if (!fields.account) {
            try {
                fields.account = this.runtime.getEffectiveSettings().defaultAccount;
            }
            catch { /* A local draft is useful even before the mailbox is configured. */ }
        }
        const paths = input.attachments ?? [];
        if (!Array.isArray(paths) || paths.length > 10 || paths.some(file => typeof file !== 'string' || !file.trim()))
            throw new DraftError('附件应为最多 10 个本地文件路径');
        const files = paths.map(path => ({ id: randomUUID(), path: resolve(path), filename: basename(path), owned: false }));
        if (files.length) {
            const cap = fields.account ? this.connection(fields.account).cap : MAX_BYTES;
            await this.attachments({ attachments: files }, cap, signal);
        }
        return this.store.create(fields, files, signal);
    }
    async recover(signal) {
        for (const draft of await this.store.list())
            if (draft.state === 'sending') {
                try {
                    await this.store.sendLock(draft.id, async (current) => { await this.store.change(draft.id, draft.revision, value => { if (value.state === 'sending') {
                        value.state = 'uncertain';
                        value.error = '上次提交未留下完整回执；请先去邮箱核对，不会自动重发';
                    } }, current); }, signal);
                }
                catch (error) {
                    if (!(error instanceof DraftError) || !['draft-busy', 'draft-conflict', 'draft-missing'].includes(error.code))
                        throw error;
                }
            }
    }
    async action(body, signal) {
        this.prune();
        signal?.throwIfAborted();
        if (body.action === 'list') {
            await this.recover(signal);
            const snapshot = await this.settings.snapshot();
            return { drafts: (await this.store.list()).map(view), accounts: snapshot.accounts, revision: snapshot.settings.revision, writable: snapshot.writable };
        }
        if (body.action === 'rules') {
            const snapshot = await this.settings.snapshot();
            const policies = parseRecipientPolicies(snapshot.settings.value.trustedRecipientsYaml);
            return { accounts: snapshot.accounts, revision: snapshot.settings.revision, writable: snapshot.writable, sendApproval: snapshot.settings.value.sendApproval !== false, policies: Object.fromEntries(policies) };
        }
        if (body.action === 'saveRules' || body.action === 'matchRules') {
            if (typeof body.account !== 'string' || !body.account.trim())
                throw new DraftError('请先选择账号');
            const snapshot = await this.settings.snapshot();
            if (!snapshot.accounts.includes(body.account))
                throw new DraftError('账号已改变，请重新加载规则');
            const single = parseRecipientPolicies(JSON.stringify({ [body.account]: body.policy })).get(body.account);
            if (!single)
                throw new DraftError('请填写完整的收件人规则');
            if (body.action === 'matchRules')
                return matchRecipients(String(body.to ?? ''), String(body.cc ?? ''), single);
            const all = parseRecipientPolicies(snapshot.settings.value.trustedRecipientsYaml);
            all.set(body.account, single);
            await this.settings.saveRecipientRules(serializeRecipientPolicies(all), body.revision);
            return this.action({ action: 'rules' }, signal);
        }
        if (body.action === 'create')
            return view(await this.create({ ...body, attachments: [] }, signal)); // Browser attachments only come from its file chooser.
        const id = typeof body.id === 'string' ? body.id : '', draft = await this.store.get(id);
        if (body.action === 'get')
            return view(draft);
        if (body.action === 'cancelPreview') {
            this.invalidate(id);
            return { cancelled: true };
        }
        if (body.action === 'update') {
            editable(draft);
            const fields = draftFields(body), keep = body.attachments ?? draft.attachments.map(file => file.id);
            if (!Array.isArray(keep) || keep.some(key => !draft.attachments.some(file => file.id === key)) || new Set(keep).size !== keep.length)
                throw new DraftError('附件列表无效，请重新打开草稿');
            const changed = await this.store.change(id, body.revision, value => { editable(value); Object.assign(value, fields); value.attachments = value.attachments.filter(file => keep.includes(file.id)); }, signal);
            this.invalidate(id);
            for (const file of draft.attachments)
                if (!changed.attachments.some(kept => kept.id === file.id))
                    await this.store.removeOwnedFile(id, file);
            return view(changed);
        }
        if (body.action === 'delete') {
            if (body.confirmed !== true)
                throw new DraftError('请先确认删除本地草稿与上传副本');
            await this.store.remove(id, body.revision, signal);
            this.invalidate(id);
            return { removed: true };
        }
        if (body.action === 'copy') {
            if (draft.revision !== body.revision)
                throw new DraftError('草稿已改变，请重新打开后复制', 'draft-conflict');
            if (draft.state === 'sending')
                throw new DraftError('邮件还在提交，请结束后再复制', 'draft-busy');
            if (body.confirmed !== true)
                throw new DraftError('请先核对邮箱，再确认复制为新草稿');
            const contents = await this.attachments(draft, MAX_BYTES, signal), created = await this.store.create(draftFields(draft), [], signal), files = [];
            try {
                for (const file of contents) {
                    const owned = this.store.uploadPath(created.id, file.filename), stored = { id: randomUUID(), ...owned, owned: true };
                    files.push(stored);
                    await this.writeUpload(owned.path, file.content, signal);
                }
                const changed = await this.store.change(created.id, created.revision, value => { value.attachments = files; }, signal);
                return view(changed);
            }
            catch (error) {
                for (const file of files)
                    await this.store.removeOwnedFile(created.id, file);
                await this.store.remove(created.id, created.revision).catch(() => { });
                throw error;
            }
        }
        if (body.action === 'preview') {
            editable(draft);
            if (draft.revision !== body.revision)
                throw new DraftError('草稿已改变，请保存后重新预览', 'draft-conflict');
            if (!draft.subject)
                throw new DraftError('请先填写并保存邮件主题');
            const connection = this.connection(draft.account), matching = await matchRecipients(draft.to, draft.cc, connection.policy), attachments = await this.attachments(draft, connection.cap, signal);
            if (connection.key !== this.connection(draft.account).key || (await this.store.get(id)).revision !== draft.revision)
                throw new DraftError('草稿或账号已改变，请重新预览', 'draft-conflict');
            this.invalidate(id);
            if (this.plans.size >= 3)
                this.plans.delete(this.plans.keys().next().value);
            const plan = { id: randomUUID(), created: this.now(), key: connection.key, draft, attachments };
            this.plans.set(plan.id, plan);
            return { id: plan.id, draft: view(draft), from: { address: connection.config.user, name: connection.config.senderName }, matching, attachments: attachments.map(({ id, filename, content }) => ({ id, filename, size: content.length, sha256: createHash('sha256').update(content).digest('hex') })), expiresAt: plan.created + 10 * 60 * 1000 };
        }
        if (body.action === 'send') {
            if (body.confirmed !== true)
                throw new DraftError('请核对预览后明确确认发送');
            const plan = typeof body.preview === 'string' ? this.plans.get(body.preview) : undefined;
            if (!plan || plan.draft.id !== id)
                throw new DraftError('预览已过期或已用过，请重新预览', 'draft-preview-expired');
            return this.store.sendLock(id, async (current) => {
                const before = await this.store.get(id);
                editable(before);
                if (before.revision !== plan.draft.revision || plan.key !== this.connection(before.account).key)
                    throw new DraftError('草稿、账号或规则已改变，请重新预览', 'draft-conflict');
                await assertRecipientsAllowed(before.to, before.cc, this.connection(before.account).policy);
                const pool = this.runtime.getPool();
                current.throwIfAborted();
                const pending = await this.store.change(id, before.revision, value => { editable(value); value.state = 'sending'; value.attemptAt = new Date(this.now()).toISOString(); }, current);
                this.invalidate(id);
                let unchanged = false;
                try {
                    unchanged = plan.key === this.connection(before.account).key;
                }
                catch { /* A now-incomplete account also invalidates this review. */ }
                if (!unchanged) {
                    await this.store.change(id, pending.revision, value => { value.state = 'draft'; delete value.attemptAt; });
                    throw new DraftError('账号或规则已改变，邮件未提交；请重新预览', 'draft-conflict');
                }
                let receipt;
                try {
                    receipt = await pool.sendPrepared(before.account, before.to, before.subject, before.text, before.cc, plan.attachments.map(({ filename, content }) => ({ filename, content })), current);
                }
                catch (error) {
                    if (error instanceof RecipientPolicyError) {
                        await this.store.change(id, pending.revision, value => { value.state = 'draft'; delete value.attemptAt; });
                        throw error;
                    }
                    const failed = await this.store.change(id, pending.revision, value => { value.state = 'uncertain'; value.error = '提交结果未确定；请先去邮箱核对，不会自动重发。' + this.safe(error); }).catch(() => null);
                    if (!failed)
                        throw new DraftError('提交结果未确定，且回执未能保存；请先去邮箱核对，不要直接重发', 'draft-storage');
                    return { draft: view(failed) };
                }
                // Once SMTP acknowledges, a disconnected browser must not prevent the receipt from being persisted.
                try {
                    return { draft: view(await this.store.change(id, pending.revision, value => { value.state = 'sent'; value.receipt = receipt; })) };
                }
                catch {
                    throw new DraftError('SMTP 已返回回执，但本地保存失败；请先核对邮箱，不要再次发送', 'draft-storage');
                }
            }, signal);
        }
        throw new DraftError('不支持此草稿操作');
    }
    async writeUpload(path, content, signal) {
        signal?.throwIfAborted();
        await mkdir(dirname(path), { recursive: true, mode: 0o700 });
        const file = await open(path, 'wx', 0o600);
        try {
            await file.writeFile(content);
            signal?.throwIfAborted();
            await file.sync();
        }
        finally {
            await file.close();
        }
    }
    async upload(request, content, signal) {
        const id = request.headers.get('x-dsh-draft-id') ?? '', revision = Number(request.headers.get('x-dsh-draft-revision')), draft = await this.store.get(id);
        editable(draft);
        if (draft.revision !== revision || draft.attachments.length >= 10)
            throw new DraftError('草稿已改变或附件已达 10 个，请保存并重新打开后添加', 'draft-conflict');
        let filename;
        try {
            filename = decodeURIComponent(request.headers.get('x-dsh-draft-filename') ?? '');
        }
        catch {
            throw new DraftError('附件名称无效');
        }
        if (!filename || filename.length > 500)
            throw new DraftError('附件名称为空或过长');
        let existingSize = 0;
        for (const file of draft.attachments) {
            const info = await stat(file.path).catch(() => null);
            if (info?.isFile())
                existingSize += info.size;
        }
        const cap = (() => { try {
            return this.connection(draft.account).cap;
        }
        catch {
            return MAX_BYTES;
        } })();
        if (existingSize + content.length > cap)
            throw new DraftError('草稿附件总大小最多 ' + Math.floor(cap / 1024 / 1024) + ' MiB');
        const owned = { id: randomUUID(), ...this.store.uploadPath(id, filename), owned: true };
        try {
            await this.writeUpload(owned.path, content, signal);
            const changed = await this.store.change(id, revision, value => { editable(value); value.attachments.push(owned); }, signal);
            this.invalidate(id);
            return view(changed);
        }
        catch (error) {
            await this.store.removeOwnedFile(id, owned);
            throw error;
        }
    }
    async fetch(request) {
        const site = request.headers.get('sec-fetch-site'), origin = request.headers.get('origin');
        const fail = (status, error) => json(status, { ok: false, error: { code: error instanceof DraftError ? error.code : error?.code === 'SETTINGS_CONFLICT' ? 'settings-conflict' : 'draft-invalid', message: this.safe(error) } });
        if (site && !['same-origin', 'none'].includes(site))
            return fail(403, new DraftError('请从邮件草稿面板操作'));
        if (origin) {
            try {
                const url = new URL(origin);
                if (!['http:', 'https:'].includes(url.protocol) || url.host !== (request.headers.get('host') || new URL(request.url).host))
                    return fail(403, new DraftError('拒绝跨源操作'));
            }
            catch {
                return fail(403, new DraftError('无效来源'));
            }
        }
        try {
            this.prune();
            if (request.method === 'GET') {
                const url = new URL(request.url), plan = this.plans.get(url.searchParams.get('preview') ?? ''), file = plan?.attachments.find(file => file.id === url.searchParams.get('attachment'));
                if (!plan || !file || plan.key !== this.connection(plan.draft.account).key)
                    return fail(404, new DraftError('附件预览已失效，请重新预览'));
                return new Response(new Uint8Array(file.content), { headers: { 'content-type': 'application/octet-stream', 'content-disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(file.filename), 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' } });
            }
            if (request.method !== 'POST')
                return fail(405, new DraftError('请使用草稿面板支持的操作'));
            const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
            if (request.headers.get('x-dsh-email-draft') !== '1' || !['application/json', 'application/octet-stream'].includes(type ?? ''))
                return fail(403, new DraftError('请从邮件草稿面板操作'));
            const reader = request.body?.getReader();
            if (!reader)
                throw new DraftError('请求为空');
            const limit = type === 'application/octet-stream' ? MAX_BYTES : 256 * 1024, chunks = [];
            let size = 0;
            try {
                for (;;) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    size += value.length;
                    if (size > limit) {
                        await reader.cancel();
                        return fail(413, new DraftError('请求超过大小上限'));
                    }
                    chunks.push(value);
                }
            }
            finally {
                reader.releaseLock();
            }
            const content = Buffer.concat(chunks), signal = AbortSignal.any([request.signal, AbortSignal.timeout(120000)]);
            if (type === 'application/octet-stream')
                return json(200, { ok: true, value: await this.upload(request, content, signal) });
            const body = JSON.parse(content.toString('utf8'));
            if (!body || typeof body !== 'object' || Array.isArray(body))
                throw new DraftError('请求必须为对象');
            return json(200, { ok: true, value: await this.action(body, signal) });
        }
        catch (error) {
            return fail(error instanceof DraftError && ['draft-conflict', 'draft-busy', 'draft-submitted'].includes(error.code) || error?.code === 'SETTINGS_CONFLICT' ? 409 : 400, error);
        }
    }
}
export function installEmailDrafts(ctx, backend) {
    ctx.inject?.(['connection'], (host) => {
        host.connection?.fetch?.register?.({ path: EMAIL_DRAFT_ROUTE, methods: ['POST', 'GET'], requestBody: 'buffered', fetch: (request) => backend.fetch(request) });
        host.connection?.fetch?.register?.({ path: EMAIL_DRAFT_ROUTE + '/upload', methods: ['POST'], requestBody: 'streaming', fetch: (request) => backend.fetch(request) });
    });
}
