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
export declare const defaultMailTasks: () => MailTaskConfig;
/** Separate bounded task ledger. No plaintext task key or incoming prompt is stored here. */
export declare class MailTaskStore {
    readonly root: string;
    readonly file: string;
    constructor(home?: string);
    read(): Promise<MailTaskDocument>;
    lock<T>(name: string, action: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T>;
    mutate<T>(action: (doc: MailTaskDocument) => T, signal?: AbortSignal): Promise<T>;
}
export {};
