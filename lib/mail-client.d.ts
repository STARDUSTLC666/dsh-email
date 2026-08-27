import { ImapFlow } from 'imapflow';
import type { ResolvedEmailConfig, ResolvedEmailSettings } from './config.js';
import type { EmailAttachmentMeta, EmailAttachmentResult, EmailFoldersResult, EmailListResult, EmailReadResult, EmailSearchResult, EmailSendResult } from './types.js';
export declare class MailError extends Error {
    constructor(message: string);
}
export declare function messageOf(error: unknown, fallback: string): string;
interface AttachmentPart {
    part: string;
    filename: string;
    contentType: string;
    size: number;
}
/**
 * Map the index in the mailparser attachment list (what email_read showed the
 * model) onto a bodyStructure part. Name first, then type + tolerant size;
 * an inline image that our walk excludes simply fails instead of downloading
 * the wrong part.
 */
export declare function selectAttachmentPart(readAttachments: EmailAttachmentMeta[], parts: AttachmentPart[], index: number): AttachmentPart | undefined;
/** Case-insensitive match of a query against subject/from/body text. */
export declare function messageMatchesQuery(subject: string, fromText: string, body: string, query: string): boolean;
/**
 * One mailbox pool for the whole plugin: pooled IMAP connections per
 * account plus pooled SMTP transporters, with idle sweep and error eviction.
 */
export declare class EmailPool {
    private readonly settings;
    private readonly imaps;
    private readonly smtps;
    private readonly queues;
    private idleTimer;
    constructor(settings: ResolvedEmailSettings);
    account(name: string): ResolvedEmailConfig;
    resolveName(name?: string): string;
    /** Serialize operations per account: one IMAP connection serves one op at a time. */
    private enqueue;
    withImap<T>(accountName: string | undefined, folder: string | null, run: (client: ImapFlow) => Promise<T>): Promise<T>;
    private createImap;
    private imapRun;
    private normalizeImapError;
    private evictImap;
    /** Reap IMAP connections idle for longer than idleTimeoutMs. */
    startIdleSweep(): void;
    dispose(): void;
    private transporter;
    list(accountName: string | undefined, folder: string, limit: number, offset: number, unreadOnly: boolean, since?: Date, until?: Date): Promise<EmailListResult>;
    search(accountName: string | undefined, query: string, folder: string, limit: number, since?: Date, until?: Date): Promise<EmailSearchResult>;
    /** Client-side scan of the tail of the mailbox, newest first. */
    private searchBodies;
    private fetchListed;
    read(accountName: string | undefined, uid: number, folder: string): Promise<EmailReadResult>;
    folders(accountName: string | undefined, subscribedOnly: boolean): Promise<EmailFoldersResult>;
    downloadAttachment(accountName: string | undefined, folder: string, uid: number, index: number, workspaceHint?: string): Promise<EmailAttachmentResult>;
    send(accountName: string | undefined, to: string, subject: string, text: string | undefined, cc: string | undefined, attachmentPaths: string[] | undefined): Promise<EmailSendResult>;
}
/** Stat every attachment path up front; total size must stay under the cap. */
export declare function validateAttachmentPaths(paths: string[], maxBytes: number): Promise<Array<{
    path: string;
}>>;
export {};
