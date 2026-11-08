import { downloadPublicBytes } from './public-download.js';
import type { EmailRuntime } from './runtime.js';
import type { EmailDraftBackend } from './draft-web.js';
export declare const MAILBOX_ROUTE = "/api/dsh-email/mailbox";
export declare class EmailMailboxBackend {
    private runtime;
    private drafts;
    private download;
    private moves;
    private images;
    private folderTickets;
    constructor(runtime: Pick<EmailRuntime, 'getEffectiveSettings' | 'getPool'>, drafts: EmailDraftBackend, download?: typeof downloadPublicBytes);
    private fingerprint;
    private unchanged;
    private present;
    private imageBytes;
    action(body: Record<string, unknown>, signal?: AbortSignal): Promise<unknown>;
    fetch(request: Request): Promise<Response>;
}
export declare function installEmailMailbox(ctx: any, backend: EmailMailboxBackend): void;
