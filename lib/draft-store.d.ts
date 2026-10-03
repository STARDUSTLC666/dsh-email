import type { EmailSendResult } from './types.js';
export type DraftState = 'draft' | 'sending' | 'sent' | 'uncertain';
export interface DraftAttachment {
    id: string;
    path: string;
    filename: string;
    owned: boolean;
}
export interface EmailDraft {
    id: string;
    revision: number;
    account: string;
    to: string;
    cc: string;
    subject: string;
    text: string;
    attachments: DraftAttachment[];
    state: DraftState;
    createdAt: string;
    updatedAt: string;
    attemptAt?: string;
    receipt?: EmailSendResult;
    error?: string;
}
export interface DraftFields {
    account: string;
    to: string;
    cc: string;
    subject: string;
    text: string;
}
export declare class DraftError extends Error {
    readonly code: string;
    constructor(message: string, code?: string);
}
export declare function draftFields(input: unknown): DraftFields;
/** Private, bounded local drafts. File locks protect separate DSH processes and atomic replacement preserves old data on failure. */
export declare class DraftStore {
    readonly root: string;
    private readonly file;
    constructor(home?: string);
    list(): Promise<EmailDraft[]>;
    private load;
    private write;
    private withLock;
    private mutate;
    get(id: string): Promise<EmailDraft>;
    create(fields: DraftFields, attachments?: DraftAttachment[], signal?: AbortSignal): Promise<EmailDraft>;
    change(id: string, expectedRevision: unknown, action: (draft: EmailDraft) => void, signal?: AbortSignal): Promise<EmailDraft>;
    remove(id: string, revision: unknown, signal?: AbortSignal): Promise<void>;
    removeOwnedFile(id: string, file: DraftAttachment): Promise<void>;
    sendLock<T>(id: string, action: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T>;
    uploadPath(id: string, filename: string): {
        path: string;
        filename: string;
    };
}
