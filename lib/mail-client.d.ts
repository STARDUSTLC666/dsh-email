import { ImapFlow } from 'imapflow';
import type { ResolvedEmailConfig, ResolvedEmailSettings } from './config.js';
import type { AddressEntry, EmailAttachmentMeta, EmailAttachmentResult, EmailFoldersResult, EmailListResult, EmailMarkAction, EmailMarkResult, EmailReadResult, EmailReplyMode, EmailReplyResult, EmailSearchResult, EmailSendResult, ListedMessage } from './types.js';
export declare class MailError extends Error {
    constructor(message: string);
}
export declare function messageOf(error: unknown, fallback: string): string;
/**
 * Replace anything credential-shaped in a server's own error text before it
 * reaches a user.
 *
 * IMAP and SMTP servers routinely quote back the authentication string they
 * rejected. For XOAUTH2 that string is `user=…\x01auth=Bearer <token>\x01\x01`,
 * usually base64'd — so the raw message carries a live access token, and these
 * messages are rendered in the settings panel, returned by the mail tools, and
 * pasted into bug reports.
 *
 * Two shapes are masked: a JWT (three base64url segments, which is what every
 * OAuth2 access token looks like) and a long base64 run (the quoted XOAUTH2
 * blob). The replacement keeps the length so a report still says how big the
 * thing was, without saying what it was.
 */
export declare function redactCredentials(text: string): string;
/** The IMAP auth shape imapflow accepts: a password, or an OAuth2 access token. */
export interface ImapAuth {
    user: string;
    pass?: string;
    accessToken?: string;
}
/**
 * The SMTP auth shape nodemailer accepts. `type` is the literal union
 * nodemailer's typings model, not a loose string: anything wider makes the
 * whole transport options object fail to match and silently degrades the type.
 */
export type SmtpAuth = {
    user: string;
    pass: string;
} | {
    type: 'OAuth2';
    user: string;
    accessToken: string;
};
/**
 * The IMAP `auth` block for one account. Pure so the shape the library
 * receives is testable without a socket: an OAuth2 account authenticates with
 * `accessToken` (imapflow then runs AUTHENTICATE XOAUTH2) and a password
 * account with `pass`, exactly as before.
 */
export declare function imapAuthOf(cfg: Pick<ResolvedEmailConfig, 'authUser' | 'authPassword' | 'authKind'>, accessToken?: string): ImapAuth;
/**
 * Nodemailer consumes an OAuth2 token through accessToken, not pass.
 * Refresh remains owned by this plugin; no refresh credentials leave here.
 */
export declare function smtpAuthOf(cfg: Pick<ResolvedEmailConfig, 'authUser' | 'authPassword' | 'authKind'>, accessToken?: string): SmtpAuth;
/** The message an OAuth2 account gets when the mailbox has to be logged into again. */
export declare const OAUTH2_RELOGIN_MESSAGE = "\u90AE\u7BB1\u767B\u5F55\u5931\u8D25\uFF1A\u8BF7\u5230\u8BBE\u7F6E\u9875\u91CD\u65B0\u767B\u5F55\uFF08Microsoft \u8D26\u53F7\u4F7F\u7528\u8BBE\u5907\u7801\u767B\u5F55\uFF0C\u4E0D\u4F7F\u7528\u6388\u6743\u7801\uFF09";
/**
 * True for the errors both libraries report when the server rejects the
 * credentials. An expired access token is indistinguishable from a wrong
 * password at this level, so the connection retries once with a forced refresh
 * before it believes the token is really dead.
 */
export declare function looksLikeAuthFailure(error: unknown): boolean;
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
export declare function buildReplyMessage(original: OriginalDigest, mode: EmailReplyMode, selfAddress: string | readonly string[], text: string, forwardTo?: string): BuiltReply;
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
    private readonly readCache;
    private readonly folderCache;
    /** UIDVALIDITY 变了以后同一 uid 可能指向另一封邮件，缓存键必须带上它。 */
    private uidValidityOf;
    /** Remember a parsed attachment index so email_attachment can skip the refetch. */
    private rememberRead;
    /**
     * The attachment index for one message: the cached one when email_read already
     * produced it, otherwise a fresh parse of the full source plus its bodyStructure.
     */
    private attachmentIndexOf;
    private recallRead;
    withImap<T>(accountName: string | undefined, folder: string | null, run: (client: ImapFlow) => Promise<T>, readOnly?: boolean, signal?: AbortSignal): Promise<T>;
    private createImap;
    /**
     * Dial and authenticate one fresh IMAP connection.
     *
     * A password account connects once. An OAuth2 account connects with a fresh
     * access token and, when the server rejects it, refreshes once and tries
     * again: a token that expired between the freshness check and the dial is
     * indistinguishable from a wrong password at the socket, and guessing wrong
     * would send the user through a browser login for nothing.
     */
    private connectImap;
    /** The token store's own errors are already actionable; never dress them as IMAP failures. */
    private oauth2ErrorOf;
    private imapRun;
    private normalizeImapError;
    private evictImap;
    /** Reap IMAP connections idle for longer than idleTimeoutMs. */
    startIdleSweep(): void;
    dispose(): void;
    /**
     * A pooled transporter for one account. The token is captured when the
     * transporter is built; an OAuth2 token that turns out to be stale is
     * re-minted in sendMail, which rebuilds the transporter.
     */
    private transporter;
    private dropTransporter;
    /**
     * Send through the pooled transporter while making cancellation close it.
     *
     * An OAuth2 transporter carries a token that was minted when it was built,
     * so a rejection is retried once against a freshly built one (and a fresh
     * form of whatever stored token state exists). Password accounts keep the
     * single attempt they always had.
     */
    private sendMail;
    /**
     * Download one MIME part through imapflow's decode pipeline: transfer
     * encoding and charset are handled there, maxBytes caps what is fetched.
     */
    private downloadPartText;
    /**
     * The message body without its attachments. undefined when the structure has
     * no usable text part or the server refuses the part fetch, so the caller can
     * fall back to the full-source path for that one message.
     */
    private bodyTextFromParts;
    list(accountName: string | undefined, folder: string, limit: number, offset: number, unreadOnly: boolean, since?: Date, until?: Date, signal?: AbortSignal): Promise<EmailListResult>;
    /**
     * The uid index behind email_watch: SEARCH UNSEEN only, no envelopes and no
     * bodies. The caller decides which uids it actually needs to report.
     */
    unseenUids(accountName: string | undefined, folder: string, signal?: AbortSignal): Promise<{
        account: string;
        folder: string;
        uidValidity: number;
        count: number;
        uids: number[];
    }>;
    /** Fetch the envelopes for one uid batch: the rows email_watch will report. */
    fetchByUids(accountName: string | undefined, folder: string, uids: number[], signal?: AbortSignal): Promise<ListedMessage[]>;
    search(accountName: string | undefined, query: string, folder: string, limit: number, offset: number, since?: Date, until?: Date, signal?: AbortSignal): Promise<EmailSearchResult>;
    /**
     * Confirm server-side hits against the mailbox itself: fetch the envelopes
     * of the newest candidates — the same window the body-scan fallback looks at
     * — and keep only those that really carry the query in subject/from/to/cc,
     * the four fields the server was asked about. No body is downloaded here,
     * and uids the server made up simply return nothing.
     */
    private searchHits;
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
