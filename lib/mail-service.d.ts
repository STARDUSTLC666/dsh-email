import { EmailPool } from './mail-client.js';
import { type MessageRef } from './agentmail.js';
import type { Pop3WireOptions } from './pop3-wire.js';
import type { ResolvedEmailSettings } from './config.js';
import type { EmailFoldersResult, EmailReplyMode, EmailReplyResult, EmailMarkAction, EmailSearchOptions } from './types.js';
import type { downloadPublicBytes } from './public-download.js';
export interface ReplyReference {
    uid: MessageRef;
    folder: string;
    uidValidity?: number;
}
export interface MailDependencies {
    pop3?: Pop3WireOptions;
    fetch?: typeof fetch;
    download?: typeof downloadPublicBytes;
}
/** Route accounts independently. IMAP's numeric UIDs retain their original meaning. */
export declare class EmailService {
    private settings;
    private imap;
    private api;
    private pop3;
    constructor(settings: ResolvedEmailSettings, dependencies?: MailDependencies);
    get withImap(): EmailPool['withImap'];
    set withImap(run: EmailPool['withImap']);
    private name;
    private usesApi;
    private usesPop3;
    private number;
    private folder;
    list(account: string | undefined, folder: string, limit: number, offset: number, unread: boolean, since?: Date, until?: Date, signal?: AbortSignal): Promise<import("./types.js").EmailListResult>;
    read(account: string | undefined, uid: MessageRef, folder: string, signal?: AbortSignal): Promise<import("./types.js").EmailReadResult>;
    search(account: string | undefined, query: string, folder: string, limit: number, offset: number, since?: Date, until?: Date, signal?: AbortSignal, options?: EmailSearchOptions): Promise<import("./types.js").EmailSearchResult>;
    mark(account: string | undefined, folder: string, uid: MessageRef, action: EmailMarkAction, target?: string, signal?: AbortSignal): Promise<import("./types.js").EmailMarkResult>;
    folders(account: string | undefined, subscribed: boolean, signal?: AbortSignal): Promise<EmailFoldersResult>;
    downloadAttachment(account: string | undefined, folder: string, uid: MessageRef, index: number, workspace?: string, signal?: AbortSignal): Promise<import("./types.js").EmailAttachmentResult>;
    send(account: string | undefined, to: string, subject: string, text: string | undefined, cc: string | undefined, paths: string[] | undefined, signal?: AbortSignal): Promise<import("./types.js").EmailSendResult>;
    sendPrepared(account: string, to: string, subject: string, text: string, cc: string, attachments: Array<{
        filename: string;
        content: Buffer;
    }>, signal?: AbortSignal, reply?: ReplyReference): Promise<import("./types.js").EmailSendResult>;
    reply(account: string | undefined, folder: string, uid: MessageRef, mode: EmailReplyMode, text: string, to: string, cc: string | undefined, signal?: AbortSignal): Promise<EmailReplyResult>;
    unseenUids(...args: Parameters<EmailPool['unseenUids']>): Promise<{
        account: string;
        folder: string;
        uidValidity: number;
        count: number;
        uids: number[];
    }>;
    fetchByUids(...args: Parameters<EmailPool['fetchByUids']>): Promise<import("./types.js").ListedMessage[]>;
    watchApi(account: string, folder: string, limit: number, scope: string, signal?: AbortSignal): Promise<import("./types.js").EmailWatchResult | undefined>;
    startIdleSweep(): void;
    dispose(): void;
}
