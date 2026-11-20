import { downloadPublicBytes } from './public-download.js';
import type { EmailRuntime } from './runtime.js';
import type { EmailDraftBackend } from './draft-web.js';
import type { ContactsStore } from './contacts.js';
export declare const MAILBOX_ROUTE = "/api/dsh-email/mailbox";
export declare class EmailMailboxBackend {
    private runtime;
    private drafts;
    private download;
    /**
     * Local address book. Omitted by embedders and protocol fixtures that do not
     * want a browser-only, filesystem-backed side effect; the contacts actions
     * then answer with a clear error and message harvesting is skipped.
     */
    private contacts?;
    private moves;
    private images;
    private folderTickets;
    constructor(runtime: Pick<EmailRuntime, 'getEffectiveSettings' | 'getPool'>, drafts: EmailDraftBackend, download?: typeof downloadPublicBytes, 
    /**
     * Local address book. Omitted by embedders and protocol fixtures that do not
     * want a browser-only, filesystem-backed side effect; the contacts actions
     * then answer with a clear error and message harvesting is skipped.
     */
    contacts?: ContactsStore | undefined);
    /** The browser actions the address book needs; independent of any mail account. */
    private addressBook;
    /** Every address this installation owns, so reading own mail never self-adds. */
    private selfAddresses;
    /**
     * Harvest correspondents for the address book. Best effort by design: an
     * unreadable address book must never turn a successful mailbox page into an
     * error, and opening a message should not wait on a second disk write.
     */
    private observe;
    private fingerprint;
    private unchanged;
    private present;
    private imageBytes;
    action(body: Record<string, unknown>, signal?: AbortSignal): Promise<unknown>;
    fetch(request: Request): Promise<Response>;
}
export declare function installEmailMailbox(ctx: any, backend: EmailMailboxBackend): void;
