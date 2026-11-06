import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { mkdir, open, readFile, stat, rename, unlink } from 'node:fs/promises';
import lockfile from 'proper-lockfile';
import type { TaskRule } from './mail-task-rules.js';
export interface MailTaskConfig {
    prefix: string;
    enabled: boolean;
    account: string;
    folder: string;
    senders: string[];
    workspaces: Record<string, string>;
    rules: TaskRule[];
    autoReply: boolean;
    keyHash?: string;
    pollSeconds: number;
}
export type MailTaskState = 'dispatching' | 'running' | 'waiting' | 'completed' | 'attention' | 'replying' | 'replied' | 'uncertain';
export interface MailTaskRecord {
    id: string;
    mailKey: string;
    account: string;
    folder: string;
    uid: number | string;
    uidValidity?: number;
    sender: string;
    workspace: string;
    state: MailTaskState;
    createdAt: number;
    sessionId?: string;
    requestId: string;
    afterSeq?: number;
    message?: string;
    policy: string;
}
interface Cursor {
    binding: string;
    validity: number;
    uids: Array<string | number>;
    maxUid?: number;
    since: number;
}
export interface MailTaskDocument {
    version: 1;
    revision: number;
    config: MailTaskConfig;
    cursor?: Cursor;
    records: MailTaskRecord[];
    error?: string;
}
export const defaultMailTasks = (): MailTaskConfig => ({ prefix: 'dsh', enabled: false, account: '', folder: 'INBOX', senders: [], workspaces: {}, rules: [], autoReply: false, pollSeconds: 60 });
/** Separate bounded task ledger. No plaintext task key or incoming prompt is stored here. */
export class MailTaskStore {
    readonly root: string;
    readonly file: string;
    constructor(home = process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')) { this.root = resolve(home, 'data/dsh-email'); this.file = join(this.root, 'mail-tasks-v1.json'); }
    async read(): Promise<MailTaskDocument> {
        try {
            if ((await stat(this.file)).size > 2 * 1024 * 1024)
                throw new Error('large');
            const doc = JSON.parse(await readFile(this.file, 'utf8'));
            if (doc.version !== 1 || !Number.isSafeInteger(doc.revision) || !doc.config || !Array.isArray(doc.records) || doc.records.length > 200 || doc.records.some((r: MailTaskRecord) => !r || typeof r.id !== 'string' || typeof r.mailKey !== 'string' || !['dispatching', 'running', 'waiting', 'completed', 'attention', 'replying', 'replied', 'uncertain'].includes(r.state)))
                throw new Error('invalid');
            return doc;
        }
        catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT')
                return { version: 1, revision: 0, config: defaultMailTasks(), records: [] };
            throw new Error('任务存储无法读取，原文件已保留 / Task ledger unreadable; existing file kept');
        }
    }
    async lock<T>(name: string, action: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
        await mkdir(this.root, { recursive: true, mode: 0o700 });
        signal?.throwIfAborted();
        const compromised = new AbortController(), release = await lockfile.lock(join(this.root, name), { realpath: false, stale: 120000, update: 10000, retries: 0, onCompromised: e => compromised.abort(e) });
        try {
            const active = signal ? AbortSignal.any([signal, compromised.signal]) : compromised.signal;
            active.throwIfAborted();
            return await action(active);
        }
        finally {
            await release().catch(() => { });
        }
    }
    async mutate<T>(action: (doc: MailTaskDocument) => T, signal?: AbortSignal): Promise<T> {
        return this.lock('mail-tasks-write', async (current) => {
            const doc = await this.read(), result = action(doc), data = JSON.stringify(doc);
            if (Buffer.byteLength(data) > 2 * 1024 * 1024)
                throw new Error('Task ledger is full');
            const temp = join(this.root, '.mail-tasks-' + randomUUID() + '.json');
            try {
                const h = await open(temp, 'wx', 0o600);
                try {
                    await h.writeFile(data);
                    await h.sync();
                }
                finally {
                    await h.close();
                }
                current.throwIfAborted();
                await rename(temp, this.file);
            }
            finally {
                await unlink(temp).catch(() => { });
            }
            return result;
        }, signal);
    }
}
