import type { AddressEntry } from './types.js';
/**
 * One address-book entry. `manual` is what the user typed (it always wins when a
 * message names the same address); `auto` is a correspondent the plugin learned
 * from mail the user opened, and it is only a fallback until the user edits it.
 */
export interface EmailContact {
    id: string;
    /** Display name shown in readers and inserted by recipient autocomplete. */
    name: string;
    /** Lower-cased mailbox address; the identity of an entry. */
    address: string;
    note?: string;
    source: 'manual' | 'auto';
    /** How many messages this address appeared in (auto entries are ranked by it). */
    uses: number;
    /** Last time the address was seen in a message, ISO 8601. */
    lastSeenAt?: string;
    createdAt: string;
    updatedAt: string;
    /**
     * Search keys precomputed on write: lower-case latin words, the pinyin
     * syllables and initials of every Chinese run in the name, and the mailbox
     * local part (工号). The composer matches against this string, so typing
     * `zxm`, `zhangxiaoming`, `100123` or `张小` all reach the same person without
     * shipping a pinyin table to the browser.
     */
    keys?: string;
}
/** One contact candidate the caller harvested from message headers. */
export type ContactAddress = Pick<AddressEntry, 'name' | 'address'>;
export interface ContactSaveInput {
    id?: unknown;
    name?: unknown;
    address?: unknown;
    note?: unknown;
}
export interface ContactObserveResult {
    added: number;
    updated: number;
}
export declare class ContactsError extends Error {
    readonly code: string;
    constructor(message: string, code?: string);
}
/**
 * Upper bounds. The book is local, private data: a group account can legitimately
 * contribute tens of thousands of colleagues once a directory source is synced,
 * but an unbounded pool would still be a memory and payload risk — the composer
 * receives the whole book.
 */
export declare const MAX_CONTACTS = 50000;
export declare const MAX_AUTO_CONTACTS = 5000;
/**
 * A usable mailbox address: one `@` with something on both sides and none of the
 * characters that would break an address header. Deliberately permissive about
 * dots and dots-less domains — intranet mail servers exist and rejecting them
 * would silently drop real correspondents from the address book.
 */
export declare function normalizeAddress(raw: unknown): string;
/** Keep a display name safe to embed in a `Name <address>` header or a text node. */
export declare function normalizeContactName(raw: unknown): string;
/**
 * Search keys for one entry. Chinese names are the whole point of this index: the
 * same person must be reachable as 汉字, as full pinyin (`zhangxinyi`) and as
 * initials (`zxy`), and colleagues are usually reachable by their 工号 too.
 *
 * `surname: 'head'` is what keeps 曾/单/解/查/仇/区/朴/乐 usable as surnames: the
 * plain reading would index 曾伟 as `cengwei` and nobody searches like that.
 */
export declare function contactMatchKeys(name: string, address: string): string;
/**
 * Private local address book, backed by SQLite in the plugin's data directory.
 *
 * Why not the JSON document this used to be: a group account's directory is tens
 * of thousands of rows, and every lookup used to parse and re-validate the whole
 * file. SQLite gives an indexed store, atomic single-row writes and a stable file
 * per installation. The old `contacts-v1.json` is imported once and then left
 * untouched on disk, so a downgrade or a manual inspection still works.
 *
 * Each call opens and closes its own connection: the store is created per plugin
 * instance but must not pin a file handle in a process that may be long-lived, and
 * WAL keeps concurrent readers from blocking the writer.
 */
export declare class ContactsStore {
    readonly root: string;
    private readonly database;
    private ready;
    constructor(home?: string);
    list(): Promise<EmailContact[]>;
    /**
     * Ranked suggestions for one query. Chinese names, full pinyin and initials all
     * reach the same row (see {@link contactMatchKeys}); an empty query is the
     * ranked head of the book, which is what the composer shows on focus.
     */
    suggest(query: string, limit?: number): Promise<EmailContact[]>;
    save(input: ContactSaveInput, signal?: AbortSignal): Promise<EmailContact>;
    remove(id: unknown, signal?: AbortSignal): Promise<void>;
    /**
     * Learn correspondents from message headers. Accounts' own addresses and the
     * user's curated names are never overwritten; a refresh with nothing new writes
     * nothing, so polling the mailbox does not churn the book.
     */
    observe(entries: Iterable<ContactAddress | null | undefined>, options?: {
        self?: Iterable<string>;
        now?: string;
    }, signal?: AbortSignal): Promise<ContactObserveResult>;
    /**
     * The cursor a directory sync source left behind, or undefined when it never ran.
     * CardDAV/LDAP adapters keep their etag or modifyTimestamp here so a restart does
     * not force a full resync.
     */
    syncCursor(source: string): Promise<{
        cursor: string;
        syncedAt: string;
    } | undefined>;
    /** Record how far a directory sync got. Written in its own transaction. */
    setSyncCursor(source: string, cursor: string, syncedAt?: string): Promise<void>;
    private open;
    /**
     * Create the schema and import the retired JSON book exactly once. A damaged
     * legacy file aborts the import with its own error instead of quietly starting
     * an empty book: the file is preserved, so the user can repair or restore it.
     */
    private prepare;
    private initialize;
    private importLegacy;
    private withDb;
    private mutate;
}
