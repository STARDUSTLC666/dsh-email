import { downloadPublicBytes } from './public-download.js';
import type { ResolvedEmailSettings } from './config.js';
import type { EmailListResult, EmailReadResult, EmailSearchResult, EmailSendResult, EmailMarkAction, EmailMarkResult, EmailAttachmentResult, EmailWatchResult } from './types.js';
export type MessageRef = number | string;
/** API transport. Endpoint hosts are fixed; redirects never carry credentials elsewhere. */
export declare class AgentMailClient {
    private settings;
    private fetcher;
    private downloader;
    private watches;
    constructor(settings: ResolvedEmailSettings, fetcher?: typeof fetch, downloader?: typeof downloadPublicBytes);
    private account;
    private request;
    test(name: string, signal?: AbortSignal): Promise<any>;
    private folderLabel;
    list(name: string, folder: string, limit: number, offset: number, unread: boolean, since?: Date, until?: Date, signal?: AbortSignal, query?: string): Promise<EmailListResult>;
    search(name: string, query: string, folder: string, limit: number, offset: number, since?: Date, until?: Date, signal?: AbortSignal): Promise<EmailSearchResult>;
    private id;
    private original;
    read(name: string, uid: MessageRef, folder: string, signal?: AbortSignal): Promise<EmailReadResult>;
    mark(name: string, folder: string, uid: MessageRef, action: EmailMarkAction, target?: string, signal?: AbortSignal): Promise<EmailMarkResult>;
    send(name: string, to: string, subject: string, text: string, cc: string, attachments: Array<{
        filename: string;
        content: Buffer;
    }>, signal?: AbortSignal, reply?: {
        uid: MessageRef;
        folder: string;
    }): Promise<EmailSendResult>;
    downloadAttachment(name: string, folder: string, uid: MessageRef, index: number, workspace?: string, signal?: AbortSignal): Promise<EmailAttachmentResult>;
    sendPaths(name: string, to: string, subject: string, text: string, cc: string, paths: string[], signal?: AbortSignal): Promise<EmailSendResult>;
    watch(name: string, folder: string, limit: number, scope: string, signal?: AbortSignal): Promise<EmailWatchResult>;
    clear(): void;
}
