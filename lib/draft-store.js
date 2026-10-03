import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, realpath, rename, stat, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path';
import lockfile from 'proper-lockfile';
export class DraftError extends Error {
    code;
    constructor(message, code = 'draft-invalid') {
        super(message);
        this.code = code;
    }
}
const isId = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
export function draftFields(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input))
        throw new DraftError('草稿内容必须是对象');
    const raw = input, fields = {};
    for (const [key, cap] of [['account', 200], ['to', 4096], ['cc', 4096], ['subject', 500], ['text', 100 * 1024]]) {
        const value = raw[key] ?? '';
        if (typeof value !== 'string' || Buffer.byteLength(value) > cap || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) || (key !== 'text' && /[\r\n]/.test(value)))
            throw new DraftError(key === 'text' ? '正文最多 100 KiB，且不能包含非文本控制字符' : key + ' 内容过长或包含换行/控制字符');
        fields[key] = key === 'text' ? value : value.trim();
    }
    return fields;
}
/** Private, bounded local drafts. File locks protect separate DSH processes and atomic replacement preserves old data on failure. */
export class DraftStore {
    root;
    file;
    constructor(home = process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')) {
        this.root = resolve(home, 'data/dsh-email');
        this.file = join(this.root, 'drafts-v1.json');
    }
    async list() { return (await this.load()).drafts; }
    async load() {
        try {
            if ((await stat(this.file)).size > 16 * 1024 * 1024)
                throw new Error('too large');
            const doc = JSON.parse(await readFile(this.file, 'utf8'));
            if (doc.version !== 1 || !Array.isArray(doc.drafts) || doc.drafts.length > 50 || new Set(doc.drafts.map(d => d.id)).size !== doc.drafts.length)
                throw new Error('invalid document');
            for (const draft of doc.drafts) {
                if (!isId(draft.id) || !Number.isSafeInteger(draft.revision) || draft.revision < 1 || !['draft', 'sending', 'sent', 'uncertain'].includes(draft.state))
                    throw new Error('invalid draft');
                draftFields(draft);
                if (!Array.isArray(draft.attachments) || draft.attachments.length > 10 || draft.attachments.some(file => !isId(file.id) || !isAbsolute(file.path) || typeof file.filename !== 'string' || typeof file.owned !== 'boolean'))
                    throw new Error('invalid attachments');
            }
            return doc;
        }
        catch (error) {
            if (error?.code === 'ENOENT')
                return { version: 1, drafts: [] };
            throw new DraftError('本地草稿文件无法读取，已保留原文件；请检查存储位置或从备份恢复', 'draft-storage');
        }
    }
    async write(doc) {
        const data = JSON.stringify(doc, null, 2);
        if (Buffer.byteLength(data) > 16 * 1024 * 1024)
            throw new DraftError('草稿总量过大，请先删除不再需要的草稿');
        const temporary = join(this.root, '.drafts-' + randomUUID() + '.json');
        try {
            const handle = await open(temporary, 'wx', 0o600);
            try {
                await handle.writeFile(data);
                await handle.sync();
            }
            finally {
                await handle.close();
            }
            await rename(temporary, this.file);
        }
        finally {
            await unlink(temporary).catch(() => { });
        }
    }
    async withLock(file, action, signal, wait = true) {
        signal?.throwIfAborted();
        await mkdir(this.root, { recursive: true, mode: 0o700 });
        const compromised = new AbortController();
        let release;
        try {
            release = await lockfile.lock(file, { realpath: false, stale: 120000, update: 10000, retries: wait ? { retries: 10, factor: 1, minTimeout: 50, maxTimeout: 50 } : 0, onCompromised: error => compromised.abort(error) });
        }
        catch (error) {
            if (error?.code === 'ELOCKED')
                throw new DraftError('另一处 DSH 正在保存或发送这份草稿，请稍后重试', 'draft-busy');
            throw new DraftError('无法锁定草稿存储，请检查目录权限', 'draft-storage');
        }
        try {
            const current = signal ? AbortSignal.any([signal, compromised.signal]) : compromised.signal;
            current.throwIfAborted();
            return await action(current);
        }
        finally {
            await release().catch(() => { });
        }
    }
    async mutate(action, signal) {
        return this.withLock(this.file, async (current) => { const doc = await this.load(); current.throwIfAborted(); const result = action(doc); current.throwIfAborted(); await this.write(doc); return result; }, signal);
    }
    async get(id) {
        const draft = (await this.list()).find(d => d.id === id);
        if (!draft)
            throw new DraftError('草稿不存在或已被移除', 'draft-missing');
        return draft;
    }
    async create(fields, attachments = [], signal) {
        if (attachments.length > 10 || attachments.some(file => !isId(file.id) || !isAbsolute(file.path) || typeof file.filename !== 'string' || typeof file.owned !== 'boolean'))
            throw new DraftError('草稿最多 10 个有效本地附件');
        return this.mutate(doc => {
            if (doc.drafts.length >= 50)
                throw new DraftError('已有 50 份草稿，请先删除不再需要的草稿');
            const now = new Date().toISOString(), draft = { ...draftFields(fields), id: randomUUID(), revision: 1, attachments, state: 'draft', createdAt: now, updatedAt: now };
            doc.drafts.unshift(draft);
            return draft;
        }, signal);
    }
    async change(id, expectedRevision, action, signal) {
        return this.mutate(doc => {
            const draft = doc.drafts.find(d => d.id === id);
            if (!draft)
                throw new DraftError('草稿不存在或已被移除', 'draft-missing');
            if (draft.revision !== expectedRevision)
                throw new DraftError('草稿已在另一处修改，请重新打开；当前编辑内容尚未覆盖服务器', 'draft-conflict');
            action(draft);
            draft.revision++;
            draft.updatedAt = new Date().toISOString();
            return draft;
        }, signal);
    }
    async remove(id, revision, signal) {
        const removed = await this.mutate(doc => {
            const draft = doc.drafts.find(d => d.id === id);
            if (!draft)
                throw new DraftError('草稿已被移除', 'draft-missing');
            if (draft.revision !== revision)
                throw new DraftError('草稿已改变，请重新打开后删除', 'draft-conflict');
            if (draft.state === 'sending')
                throw new DraftError('邮件正在提交，请结束后再移除草稿', 'draft-busy');
            doc.drafts = doc.drafts.filter(d => d.id !== id);
            return draft;
        }, signal);
        for (const file of removed.attachments)
            await this.removeOwnedFile(id, file);
    }
    async removeOwnedFile(id, file) {
        if (!file.owned || !isId(id))
            return;
        try {
            const root = await realpath(join(this.root, 'draft-uploads', id)), target = await realpath(file.path);
            const comparable = (path) => process.platform === 'win32' ? path.toLowerCase() : path;
            if (comparable(target).startsWith(comparable(root + sep)) && comparable(dirname(target)) === comparable(root))
                await unlink(file.path);
        }
        catch { /* Never remove a referenced original or a path outside this draft's owned upload directory. */ }
    }
    async sendLock(id, action, signal) {
        if (!isId(id))
            throw new DraftError('草稿编号不合法');
        return this.withLock(join(this.root, 'send-' + id), action, signal, false);
    }
    uploadPath(id, filename) {
        if (!isId(id))
            throw new DraftError('草稿编号不合法');
        const safe = basename(filename).replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, '_').slice(0, 160).replace(/[. ]+$/, '') || 'attachment';
        return { path: join(this.root, 'draft-uploads', id, randomUUID() + '-' + safe), filename: safe };
    }
}
