import { ImapFlow } from 'imapflow';
import type { ResolvedEmailConfig, ResolvedEmailSettings } from './config.js';
import type { AddressEntry, EmailAttachmentMeta, EmailAttachmentResult, EmailFoldersResult, EmailListResult, EmailMarkAction, EmailMarkResult, EmailReadResult, EmailReplyMode, EmailReplyResult, EmailSearchResult, EmailSendResult } from './types.js';
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
export interface OriginalDigest {
    from: AddressEntry[];
    to: AddressEntry[];
    cc: AddressEntry[];
    subject: string;
    date: string;
    text: string;
    /** Bare id without angle brackets, '' when absent. */
    messageId: string;
    /** Space-joined bare ids from the References header, '' when absent. */
    references: string;
}
export interface BuiltReply {
    to: string;
    cc?: string;
    subject: string;
    text: string;
    inReplyTo?: string;
    references?: string;
}
/** Pull Message-ID / References out of a raw RFC822 source (header section only). */
export declare function extractMessageIds(source: Buffer): {
    messageId: string;
    references: string;
};
/**
 * Compose the outgoing message for a reply/reply-all/forward. Pure so it can
 * be tested without a connection: recipients exclude the sending account,
 * subject prefixes never stack, the original text is quoted underneath.
 */
export declare function buildReplyMessage(original: OriginalDigest, mode: EmailReplyMode, selfAddress: string, text: string, forwardTo?: string): BuiltReply;
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
    withImap<T>(accountName: string | undefined, folder: string | null, run: (client: ImapFlow) => Promise<T>, readOnly?: boolean, signal?: AbortSignal): Promise<T>;
    private createImap;
    private imapRun;
    private normalizeImapError;
    private evictImap;
    /** Reap IMAP connections idle for longer than idleTimeoutMs. */
    startIdleSweep(): void;
    dispose(): void;
    private transporter;
    /** Send through the pooled transporter while making cancellation close it. */
    private sendMail;
    list(accountName: string | undefined, folder: string, limit: number, offset: number, unreadOnly: boolean, since?: Date, until?: Date, signal?: AbortSignal): Promise<EmailListResult>;
    search(accountName: string | undefined, query: string, folder: string, limit: number, since?: Date, until?: Date, signal?: AbortSignal): Promise<EmailSearchResult>;
    /** Client-side scan of the tail of the mailbox, newest first. */
    private searchBodies;
    private fetchListed;
    read(accountName: string | undefined, uid: number, folder: string, signal?: AbortSignal): Promise<EmailReadResult>;
    mark(accountName: string | undefined, folder: string, uid: number, action: EmailMarkAction, toFolder?: string, signal?: AbortSignal): Promise<EmailMarkResult>;
    folders(accountName: string | undefined, subscribedOnly: boolean, signal?: AbortSignal): Promise<EmailFoldersResult>;
    downloadAttachment(accountName: string | undefined, folder: string, uid: number, index: number, workspaceHint?: string, signal?: AbortSignal): Promise<EmailAttachmentResult>;
    send(accountName: string | undefined, to: string, subject: string, text: string | undefined, cc: string | undefined, attachmentPaths: string[] | undefined, signal?: AbortSignal): Promise<EmailSendResult>;
    reply(accountName: string | undefined, folder: string, uid: number, mode: EmailReplyMode, text: string, forwardTo: string, cc: string | undefined, signal?: AbortSignal): Promise<EmailReplyResult>;
}
/** Stat every attachment path up front; total size must stay under the cap. */
export declare function validateAttachmentPaths(paths: string[], maxBytes: number, signal?: AbortSignal): Promise<Array<{
    path: string;
}>>;
export {};
