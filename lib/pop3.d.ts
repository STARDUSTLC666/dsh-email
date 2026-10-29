import type { ResolvedEmailSettings } from './config.js';
import { type OriginalDigest } from './mail-client.js';
import { type Pop3WireOptions } from './pop3-wire.js';
import type { EmailAttachmentResult, EmailListResult, EmailReadResult, EmailSearchOptions, EmailSearchResult, EmailWatchResult } from './types.js';
/** Read-only maildrop. Stable UIDL identities are re-resolved in every transaction. */
export declare class Pop3Client {
    private settings;
    private options;
    private active;
    private queues;
    private headers;
    private watches;
    private closed;
    constructor(settings: ResolvedEmailSettings, options?: Pop3WireOptions);
    private account;
    private folder;
    private session;
    private index;
    private entry;
    private raw;
    private parsed;
    private header;
    private message;
    test(name: string, signal?: AbortSignal): Promise<{
        messages: number;
    }>;
    list(name: string, folder: string, limit: number, offset: number, unread: boolean, since?: Date, until?: Date, signal?: AbortSignal): Promise<EmailListResult>;
    read(name: string, uid: number | string, folder: string, signal?: AbortSignal): Promise<EmailReadResult>;
    original(name: string, uid: number | string, folder: string, signal?: AbortSignal): Promise<OriginalDigest>;
    search(name: string, query: string, folder: string, limit: number, offset: number, since?: Date, until?: Date, signal?: AbortSignal, options?: EmailSearchOptions): Promise<EmailSearchResult>;
    downloadAttachment(name: string, folder: string, uid: number | string, index: number, workspace?: string, signal?: AbortSignal): Promise<EmailAttachmentResult>;
    watch(name: string, folder: string, limit: number, scope: string, signal?: AbortSignal): Promise<EmailWatchResult>;
    clear(): void;
}
