import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { isAbsolute, join } from 'node:path';
import { realpath, stat } from 'node:fs/promises';
import type { EmailRuntime } from './runtime.js';
import { canonicalAddress, assertRecipientsAllowed, parseRecipientPolicies } from './recipient-policy.js';
import { MailTaskStore, defaultMailTasks, type MailTaskConfig, type MailTaskRecord } from './mail-task-store.js';
import { matchTaskRules, validateTaskRules, type TaskMatch } from './mail-task-rules.js';
import { nativeMailTasks, type MailTaskNative } from './mail-task-native.js';
import { escapeMailHtml } from './mail-html.js';
import { prepareMailBody } from './outgoing-body.js';
export const MAIL_TASK_ROUTE = '/api/dsh-email/tasks';
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const generic = '任务未完成，请在 DSH 中查看。不会自动重试或发送邮件 / Task stopped; review in DSH. No automatic retry or email.';
class TaskBoundary extends Error {
}
const samePath = (a: string, b: string) => process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
const active = (r: MailTaskRecord) => r.state === 'running' || r.state === 'waiting';
const json = (status: number, value: unknown) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json;charset=utf-8', 'cache-control': 'no-store' } });
export class MailTaskBackend {
    readonly store: MailTaskStore;
    private native: MailTaskNative | undefined;
    private timer: ReturnType<typeof setTimeout> | undefined;
    private abort: AbortController | undefined;
    private running: Promise<void> | undefined;
    private started = false;
    constructor(private runtime: EmailRuntime, options: {
        store?: MailTaskStore;
        native?: MailTaskNative;
        now?: () => number;
    } = {}) { this.store = options.store ?? new MailTaskStore(); this.native = options.native; this.now = options.now ?? Date.now; }
    private now: () => number;
    bind(ctx: any): void { this.native = nativeMailTasks(ctx); }
    private connection(c: MailTaskConfig) {
        const settings = this.runtime.getEffectiveSettings(), cfg = settings.accounts.get(c.account);
        if (!cfg)
            throw new Error('请先选择已配置的邮箱账号 / Choose a configured mail account');
        return { cfg, binding: digest([c.account, c.folder, cfg]), policy: digest([c, settings.accounts.get(c.account), this.runtime.getSettingsValue().trustedRecipientsYaml]) };
    }
    private async normalize(raw: unknown, keyHash?: string): Promise<MailTaskConfig> {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
            throw new Error('Invalid task configuration');
        const v = raw as Record<string, unknown>, out = defaultMailTasks();
        if (v.prefix !== undefined && (typeof v.prefix !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(v.prefix)))
            throw new Error('任务前缀须为 1–32 位字母数字 / Task prefix must be 1–32 simple characters');
        out.prefix = typeof v.prefix === 'string' ? v.prefix : 'dsh';
        for (const k of ['enabled', 'autoReply'] as const) {
            if (v[k] !== undefined && typeof v[k] !== 'boolean')
                throw new Error('Invalid task switch');
            out[k] = v[k] === true;
        }
        for (const k of ['account', 'folder'] as const) {
            if (typeof v[k] !== 'string' || !v[k].trim() || v[k].length > 200 || /[\r\n\0]/.test(v[k]))
                throw new Error('请选择邮箱账号和文件夹 / Choose account and folder');
            out[k] = v[k].trim();
        }
        if (!Array.isArray(v.senders) || v.senders.length > 20 || v.senders.some(x => typeof x !== 'string'))
            throw new Error('发件人必须是邮箱地址数组 / Sender whitelist must be an address list');
        out.senders = [...new Set(v.senders.map(x => canonicalAddress(x as string).toLowerCase()))];
        if (!v.workspaces || typeof v.workspaces !== 'object' || Array.isArray(v.workspaces) || Object.keys(v.workspaces).length > 20)
            throw new Error('Invalid workspace aliases');
        for (const [alias, path] of Object.entries(v.workspaces)) {
            if (!/^[a-zA-Z0-9_-]{1,64}$/.test(alias) || typeof path !== 'string' || !isAbsolute(path))
                throw new Error('工作区别名须为字母数字，路径须为绝对路径 / Use simple aliases and absolute paths');
            const canonical = await realpath(path);
            if (!(await stat(canonical)).isDirectory())
                throw new Error('工作区路径必须是现有目录 / Workspace must be an existing directory');
            out.workspaces[alias] = canonical;
        }
        out.rules = validateTaskRules(v.rules ?? []);
        const n = Number(v.pollSeconds ?? 60);
        if (!Number.isInteger(n) || n < 30 || n > 3600)
            throw new Error('检查间隔需为 30–3600 秒 / Poll interval: 30–3600 seconds');
        out.pollSeconds = n;
        out.keyHash = keyHash;
        this.connection(out);
        if (out.enabled && (!keyHash || !Object.keys(out.workspaces).length))
            throw new Error('启用前请生成任务口令并配置工作区别名 / Generate a task key and add a workspace before enabling');
        return out;
    }
    async snapshot() { const doc = await this.store.read(); return { revision: doc.revision, config: { ...doc.config, keyHash: undefined }, hasKey: !!doc.config.keyHash, available: this.native?.available() === true, running: this.started, records: doc.records, error: doc.error }; }
    async action(body: Record<string, unknown>, signal = AbortSignal.timeout(30000)): Promise<unknown> {
        if (body.action === 'list')
            return this.snapshot();
        if (body.action === 'save') {
            const before = await this.store.read(), config = await this.normalize(body.config, before.config.keyHash);
            await this.store.mutate(doc => {
                if (doc.revision !== body.revision)
                    throw new Error('配置已改变，请重新加载 / Configuration changed; reload');
                doc.config = config;
                doc.revision++;
                doc.cursor = undefined;
                delete doc.error;
                for (const r of doc.records)
                    if (active(r)) {
                        r.state = 'attention';
                        r.message = '配置已改变，已停止自动追踪；会话可在 DSH 中继续 / Configuration changed; continue in DSH';
                    }
            }, signal);
            this.wake();
            return this.snapshot();
        }
        if (body.action === 'rotateKey') {
            const key = randomBytes(32).toString('base64url');
            await this.store.mutate(doc => {
                if (doc.revision !== body.revision)
                    throw new Error('配置已改变，请重新加载 / Configuration changed; reload');
                doc.config.keyHash = digest(key);
                doc.config.enabled = false;
                doc.revision++;
                doc.cursor = undefined;
                for (const r of doc.records)
                    if (active(r)) {
                        r.state = 'attention';
                        r.message = '任务口令已轮换 / Task key rotated';
                    }
            }, signal);
            return { ...await this.snapshot(), key };
        }
        if (body.action === 'check') {
            await this.tick(signal);
            return this.snapshot();
        }
        if (body.action === 'archive') {
            await this.store.mutate(doc => {
                if (doc.revision !== body.revision)
                    throw new Error('配置已改变，请重新加载 / Configuration changed; reload');
                doc.records = doc.records.filter(r => active(r) || r.state === 'dispatching' || r.state === 'replying');
                doc.revision++;
            }, signal);
            return this.snapshot();
        }
        throw new Error('Unknown mail-task action');
    }
    private async change(id: string, action: (row: MailTaskRecord) => void, signal?: AbortSignal) {
        await this.store.mutate(doc => {
            const row = doc.records.find(r => r.id === id);
            if (row)
                action(row);
        }, signal);
    }
    private async route(c: MailTaskConfig, mail: any, signal: AbortSignal): Promise<{
        match: TaskMatch;
        sender: string;
    } | undefined> {
        if (mail.truncated || typeof mail.text !== 'string' || mail.text.length > 20000 || !Array.isArray(mail.from) || mail.from.length !== 1)
            return;
        let sender: string;
        try {
            sender = canonicalAddress(mail.from[0].address || '').toLowerCase();
        }
        catch {
            return;
        }
        const self = this.connection(c).cfg.user.toLowerCase(), allowed = c.senders.length ? c.senders : [self];
        if (!allowed.includes(sender))
            return;
        const lines = String(mail.text).replace(/\r\n/g, '\n').trimStart().split('\n'), first = lines.shift() || '', key = /^DSH-Key:\s*([A-Za-z0-9_-]{43})\s*$/.exec(first)?.[1];
        if (!key || !c.keyHash || c.keyHash.length !== 64 || !timingSafeEqual(Buffer.from(digest(key), 'hex'), Buffer.from(c.keyHash, 'hex')))
            return;
        // Quoted copies of an old command do not enter the prompt. Remove known key
        // material as well, even when a message accidentally repeats it in a sentence.
        const quote = lines.findIndex(line => /^\s*>|^-{2,}\s*(?:original|原始|forwarded)|^On .+wrote:|^Le .+écrit\s*:/i.test(line));
        let text = (quote < 0 ? lines : lines.slice(0, quote)).join('\n').split(key).join('[task key removed]').replace(/^.*DSH-Key:.*$/gim, '').trim();
        if (!text || text.length > 16000)
            return;
        const subject = String(mail.subject || '').replace(/^(?:(?:re|fw|fwd)\s*:\s*)+/ig, '').trim();
        let match: TaskMatch | undefined;
        const defaultRoute = new RegExp('^' + (c.prefix || 'dsh') + ':([A-Za-z0-9_-]{1,64})(?::([A-Za-z0-9_-]{1,128}))?$', 'i').exec(subject);
        if (defaultRoute)
            match = { workspace: defaultRoute[1], sessionId: defaultRoute[2], prompt: text };
        else
            match = await matchTaskRules(c.rules, { subject, body: text, from: sender, to: (mail.to || []).map((x: any) => x.address || '').join(', '), cc: (mail.cc || []).map((x: any) => x.address || '').join(', ') }, signal);
        if (!match || !Object.hasOwn(c.workspaces, match.workspace) || !match.prompt.trim() || match.prompt.length > 16000 || match.sessionId && !/^[A-Za-z0-9_-]{1,128}$/.test(match.sessionId))
            return;
        return { match, sender };
    }
    private async dispatch(c: MailTaskConfig, mail: any, mailKey: string, signal: AbortSignal) {
        const routed = await this.route(c, mail, signal);
        if (!routed)
            return;
        const { match, sender } = routed, { policy } = this.connection(c);
        const row: MailTaskRecord = { id: randomUUID(), mailKey, account: c.account, folder: c.folder, uid: mail.uid, uidValidity: mail.uidValidity, sender, workspace: match.workspace, state: 'dispatching', createdAt: this.now(), requestId: 'email-' + randomUUID(), policy };
        const reserved = await this.store.mutate(doc => {
            if (doc.records.some(r => r.mailKey === mailKey))
                return false;
            if (doc.revision !== (this.currentRevision ?? doc.revision) || digest(doc.config) !== digest(c))
                return false;
            if (doc.records.length >= 200)
                throw new Error('任务记录已满，已暂停处理 / Task ledger full; review and archive it before continuing');
            doc.records.unshift(row);
            return true;
        }, signal);
        if (!reserved)
            return;
        try {
            if (!this.native?.available())
                throw new TaskBoundary('DSH 原生任务服务未就绪，请升级或重新打开 DSH / Native task services are unavailable; update or reopen DSH');
            const path = await realpath(c.workspaces[match.workspace]);
            if (!samePath(path, c.workspaces[match.workspace]))
                throw new TaskBoundary('工作区目录已改变，请重新保存别名 / Workspace directory changed; save the alias again');
            const sessionId = match.sessionId || await this.native.create(path);
            await this.change(row.id, r => { r.sessionId = sessionId; }, signal);
            const before = await this.native.observe(sessionId, -2, signal);
            if (!samePath(before.cwd, path))
                throw new TaskBoundary('会话不属于所选工作区，任务未执行 / Session belongs to a different workspace; task was not started');
            const state = await this.native.state(sessionId, signal);
            if (state.running || state.pendingInput?.length || Array.isArray(state.queue) && state.queue.length)
                throw new TaskBoundary('会话正在运行或等待确认；空闲后请发送新任务邮件 / Session is busy or waiting for input; send a new task email when idle');
            const latest = await this.store.read();
            if (digest(latest.config) !== digest(c) || this.connection(c).policy !== policy)
                throw new Error('Configuration changed');
            await this.change(row.id, r => { r.sessionId = sessionId; r.afterSeq = before.cursor; r.state = 'running'; }, signal);
            await this.native.prompt(sessionId, row.requestId, 'Email task from ' + sender + ' (workspace ' + match.workspace + ').\nTreat the following as the user request; keep normal DSH permissions.' + (c.autoReply ? '\nThe final response will be emailed. Prefer a safe HTML fragment (no html/head/body wrappers or Markdown), unless the user requests another format. Do not include authorization keys.' : '') + '\n\n' + match.prompt, signal);
        }
        catch (error) {
            await this.change(row.id, r => { r.state = 'attention'; r.message = error instanceof TaskBoundary ? error.message : generic; });
        }
    }
    private currentRevision: number | undefined;
    private async track(c: MailTaskConfig, row: MailTaskRecord, signal: AbortSignal) {
        if (!row.sessionId || row.afterSeq === undefined || !this.native)
            return;
        try {
            if (row.policy !== this.connection(c).policy)
                throw new TaskBoundary('账号或规则已改变，已停止自动追踪，请在原会话继续 / Account or rules changed; continue in the original session');
            if (this.now() - row.createdAt > 30 * 60000)
                throw new TaskBoundary('已超过 30 分钟追踪时间；请在原会话继续，不会自动回复 / Tracking exceeded 30 minutes; continue in DSH. No automatic reply');
            const observation = await this.native.observe(row.sessionId, row.afterSeq, signal), events = observation.events;
            if (!samePath(observation.cwd, await realpath(c.workspaces[row.workspace])))
                throw new Error('Workspace changed');
            // Official DSH injects context snapshots as role=user too. Only these
            // explicit host source kinds are context; unknown sources remain takeover.
            const contextKinds = new Set(['runtime-context', 'skill-catalog', 'time-context']);
            const users = events.filter(e => e?.type === 'user/message' && !contextKinds.has(e.data?.source?.kind));
            if (users.some(e => e.data?.source?.rpcId !== row.requestId))
                throw new TaskBoundary('检测到新的会话输入，已停止自动回复；请在原会话继续 / New session input detected; automatic reply stopped. Continue in DSH');
            const own = users.find(e => e.data?.source?.rpcId === row.requestId), end = own && events.find(e => e.type === 'turn/end' && e.seq > own.seq);
            if (!end) {
                const state = await this.native.state(row.sessionId, signal);
                await this.change(row.id, r => { r.state = state.pendingInput?.length ? 'waiting' : 'running'; r.message = state.pendingInput?.length ? '请在 DSH 会话中确认权限或回答问题 / Respond in the DSH session' : undefined; }, signal);
                return;
            }
            if (end.data?.reason?.kind !== 'completed')
                throw new TaskBoundary('会话未正常完成，请在原会话查看原因；不会自动重试 / Session did not complete; inspect it in DSH. No automatic retry');
            const output = events.filter(e => e.type === 'assistant/message' && e.seq > own.seq && e.seq < end.seq).at(-1)?.data?.message;
            const answer = (Array.isArray(output?.content) ? output.content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n') : '').trim();
            if (!answer)
                throw new TaskBoundary('会话没有可回复的最终文本，请在 DSH 查看结果 / No final text to email; inspect the result in DSH');
            if (!c.autoReply) {
                await this.change(row.id, r => { r.state = 'completed'; r.message = '已完成，请打开 DSH 会话查看结果 / Completed; open the DSH session'; }, signal);
                return;
            }
            const latest = await this.store.read();
            if (!latest.config.enabled || row.policy !== this.connection(latest.config).policy)
                throw new Error('Configuration changed');
            const pool = this.runtime.getPool(), original = await pool.read(row.account, row.uid, row.folder, signal);
            if (row.uidValidity && row.uidValidity !== original.uidValidity || original.from.length !== 1 || canonicalAddress(original.from[0].address || '').toLowerCase() !== row.sender)
                throw new Error('Original mail changed');
            await assertRecipientsAllowed(row.sender, '', parseRecipientPolicies(this.runtime.getSettingsValue().trustedRecipientsYaml).get(row.account));
            // A self-addressed command is the default. Ordinary reply composition
            // removes one's own address, so pin only the verified thread reference here
            // and deliver explicitly to the authorized sender without quoting the key.
            const reply = { uid: row.uid, folder: row.folder, ...(row.uidValidity ? { uidValidity: row.uidValidity } : {}), mode: 'reply' as const };
            if (/DSH-Key:\s*[A-Za-z0-9_-]{43}/i.test(answer))
                throw new Error('Task secret found in output');
            const continuation=(c.prefix||'dsh')+':'+row.workspace+':'+row.sessionId;
            const limited = answer.slice(0, 20000), rich = /<(?:p|div|h[1-6]|table|ul|ol|b|strong|em|a|blockquote)(?:\s|>)/i.test(limited), body = prepareMailBody(rich ? '' : limited, rich ? limited : undefined), replyText = body.text + '\n\nDSH session: ' + row.sessionId+'\nContinue subject: '+continuation, replyHtml = (body.html || '<div>' + escapeMailHtml(body.text).replace(/\n/g, '<br>') + '</div>') + '<p>DSH session: ' + escapeMailHtml(row.sessionId) + '</p><p>Continue subject: <code>'+escapeMailHtml(continuation)+'</code></p>';
            await this.change(row.id, r => { r.state = 'replying'; }, signal);
            if (row.policy !== this.connection((await this.store.read()).config).policy)
                throw new Error('Configuration changed before reply');
            try {
                const receipt = await pool.sendPrepared(row.account, row.sender, 'Re: ' + (c.prefix || 'dsh') + ':' + row.workspace + ':' + row.sessionId, replyText, '', [], signal, reply, replyHtml);
                if (receipt.rejected?.length || !receipt.accepted?.length)
                    throw new Error('No acceptance');
                await this.change(row.id, r => { r.state = 'replied'; r.message = '结果已回复授权发件人 / Result replied to the authorized sender'; });
            }
            catch {
                await this.change(row.id, r => { r.state = 'uncertain'; r.message = '邮件提交结果不确定；请核对发件箱，不会自动重发 / Mail outcome uncertain; check sent mail. No automatic retry'; });
            }
        }
        catch (error) {
            await this.change(row.id, r => { r.state = 'attention'; r.message = error instanceof TaskBoundary ? error.message : generic; });
        }
    }
    async tick(signal = AbortSignal.timeout(90000)): Promise<void> {
        try {
            await this.store.lock('mail-tasks-worker', async (activeSignal) => {
                const doc = await this.store.read(), c = doc.config;
                this.currentRevision = doc.revision;
                if (!c.enabled)
                    return;
                if (!this.native?.available())
                    throw new Error('DSH 原生任务服务不可用；请升级 DSH / Native task services unavailable; update DSH');
                for (const row of doc.records.filter(active))
                    await this.track(c, row, activeSignal);
                const { binding } = this.connection(c), pool = this.runtime.getPool(), page = await pool.list(c.account, c.folder, 100, 0, false, undefined, undefined, activeSignal), ids = page.messages.map(m => m.uid), maxUid = ids.every(id => typeof id === 'number') ? Math.max(0, ...ids as number[]) : undefined;
                const cursor = doc.cursor;
                if (!cursor || cursor.binding !== binding || cursor.validity !== page.uidValidity) {
                    await this.store.mutate(value => {
                        if (value.revision === doc.revision) {
                            value.cursor = { binding, validity: page.uidValidity, uids: ids, maxUid, since: this.now() };
                            delete value.error;
                        }
                    }, activeSignal);
                    return;
                }
                const previous = new Set(cursor.uids), news = page.messages.filter(m => !previous.has(m.uid));
                if (cursor.uids.length && ids.length === 100 && !ids.some(id => previous.has(id)))
                    throw new Error('新邮件超过检查窗口，已暂停以避免漏执行；请重新保存配置建立起点 / Mail gap exceeds 100-message window; save settings to establish a new baseline');
                for (const item of news.reverse()) {
                    if (typeof item.uid === 'number' && cursor.maxUid !== undefined && item.uid <= cursor.maxUid)
                        continue;
                    if (typeof item.uid !== 'number' && (!Number.isFinite(Date.parse(item.date)) || Date.parse(item.date) < cursor.since))
                        continue;
                    const key = digest([binding, page.uidValidity, item.uid]);
                    if (doc.records.some(r => r.mailKey === key))
                        continue;
                    const mail = await pool.read(c.account, item.uid, c.folder, activeSignal);
                    if (page.uidValidity && mail.uidValidity !== page.uidValidity)
                        throw new Error('Mailbox changed during task scan');
                    await this.dispatch(c, mail, key, activeSignal);
                }
                await this.store.mutate(value => {
                    if (value.revision === doc.revision) {
                        value.cursor = { binding, validity: page.uidValidity, uids: ids, maxUid: maxUid === undefined ? cursor.maxUid : Math.max(maxUid, cursor.maxUid || 0), since: cursor.since };
                        delete value.error;
                    }
                }, activeSignal);
            }, signal);
        }
        catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ELOCKED')
                return;
            await this.store.mutate(doc => {
                doc.error = error instanceof Error && /Native task|DSH 原生|Mail gap|新邮件超过|ledger full|任务记录已满/.test(error.message) ? error.message : generic;
                if (error instanceof Error && /Mail gap|新邮件超过|ledger full|任务记录已满/.test(error.message)) {
                    doc.config.enabled = false;
                    doc.revision++;
                }
            }).catch(() => { });
        }
    }
    async start() {
        if (this.started)
            return;
        this.started = true;
        await this.store.mutate(doc => {
            for (const r of doc.records)
                if (['dispatching', 'running', 'waiting', 'replying'].includes(r.state)) {
                    r.state = r.state === 'replying' ? 'uncertain' : 'attention';
                    r.message = 'DSH 已重启；请查看原会话或发件箱，不会重复执行 / DSH restarted; inspect the original session or sent mail. No automatic retry';
                }
        });
        this.wake();
    }
    private wake() {
        if (!this.started)
            return;
        if (this.timer)
            clearTimeout(this.timer);
        if (this.running)
            return;
        this.timer = setTimeout(() => {
            this.abort = new AbortController();
            this.running = this.tick(AbortSignal.any([this.abort.signal, AbortSignal.timeout(90000)])).finally(async () => {
                this.running = undefined;
                if (this.started) {
                    const c = (await this.store.read().catch(() => undefined))?.config;
                    this.timer = setTimeout(() => this.wake(), (c?.pollSeconds || 60) * 1000);
                    this.timer.unref?.();
                }
            });
        }, 10);
        this.timer.unref?.();
    }
    async stop() {
        this.started = false;
        if (this.timer)
            clearTimeout(this.timer);
        this.abort?.abort();
        await this.running;
    }
    async fetch(request: Request): Promise<Response> {
        const site = request.headers.get('sec-fetch-site'), origin = request.headers.get('origin');
        if (request.method !== 'POST' || request.headers.get('x-dsh-email-tasks') !== '1' || request.headers.get('content-type')?.split(';')[0] !== 'application/json' || site && !['same-origin', 'none'].includes(site))
            return json(403, { ok: false, message: 'Open mail tasks in DSH' });
        if (origin) {
            try {
                const u = new URL(origin);
                if (!['http:', 'https:'].includes(u.protocol) || u.host !== (request.headers.get('host') || new URL(request.url).host))
                    throw new Error();
            }
            catch {
                return json(403, { ok: false, message: 'Same DSH origin required' });
            }
        }
        try {
            const bytes = [];
            let size = 0;
            for await (const chunk of request.body as any) {
                size += chunk.length;
                if (size > 65536)
                    throw new Error('Task request too large');
                bytes.push(chunk);
            }
            const body = JSON.parse(Buffer.concat(bytes).toString('utf8'));
            return json(200, { ok: true, value: await this.action(body, request.signal) });
        }
        catch (error) {
            return json(400, { ok: false, message: error instanceof Error ? error.message : 'Mail task request failed' });
        }
    }
}
export function installMailTasks(ctx: any, backend: MailTaskBackend) {
    ctx.inject?.(['connection'], (host: any) => host.connection?.fetch?.register?.({ path: MAIL_TASK_ROUTE, methods: ['POST'], requestBody: 'buffered', fetch: (r: Request) => backend.fetch(r) }));
    ctx.inject?.(['sessionController', 'sessionQuery'], (host: any) => backend.bind(host));
    ctx.inject?.(['appReady'], (host: any) => host.appReady?.onReady?.(() => backend.start()));
    ctx.on?.('dispose', () => backend.stop());
}
