import type { EmailRuntime } from './runtime.js';
import type { EmailDraftBackend } from './draft-web.js';
export declare const MAILBOX_ROUTE = "/api/dsh-email/mailbox";
export declare class EmailMailboxBackend {
    private runtime;
    private drafts;
    constructor(runtime: Pick<EmailRuntime, 'getEffectiveSettings' | 'getPool'>, drafts: EmailDraftBackend);
    action(body: Record<string, unknown>, signal?: AbortSignal): Promise<unknown>;
    fetch(request: Request): Promise<Response>;
}
export declare function installEmailMailbox(ctx: any, backend: EmailMailboxBackend): void;
