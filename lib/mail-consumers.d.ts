import type { EmailRuntime } from './runtime.js';
export interface MailConsumerConfig {
    id: string;
    account: string;
    folder: string;
    senders: string[];
    subject?: string;
    enabled?: boolean;
}
export interface EmailArrivalEvent {
    eventId: string;
    consumerId: string;
    account: string;
    folder: string;
    uid: number | string;
    uidValidity: number;
    sender: string;
    subject?: string;
    date?: string;
    /** Consumers should stop work when this signal is aborted. */
    signal?: AbortSignal;
}
export type EmailArrivalHandler = (event: EmailArrivalEvent) => unknown | Promise<unknown>;
export interface EmailTasksStatus {
    enabled: boolean;
    configured: number;
    registered: string[];
    running: boolean;
    inFlight: number;
    lastScanAt?: string;
    lastError?: string;
    droppedEvents: number;
    handlerFailures: number;
    handlerTimeouts: number;
}
export declare function normalizeMailConsumers(raw: unknown): MailConsumerConfig[];
/** One mailbox's scan position as written to disk: hashes, UIDs and watermarks only. */
export interface PersistedConsumerCursor {
    configBinding: string;
    binding: string;
    uidValidity: number;
    ids: string[];
    maxNumericUid: number;
    maxDateMs: number;
    dateReliable: boolean;
}
export interface MailConsumerCursorStore {
    load(): Promise<Record<string, PersistedConsumerCursor>>;
    save(cursors: Record<string, PersistedConsumerCursor>): Promise<void>;
}
/**
 * Scan positions for email consumers, kept so a restart compares against the last
 * scan instead of re-baselining. Stores no subjects, senders or credentials.
 */
export declare class FileMailConsumerCursorStore implements MailConsumerCursorStore {
    readonly root: string;
    readonly file: string;
    constructor(home?: string);
    load(): Promise<Record<string, PersistedConsumerCursor>>;
    save(cursors: Record<string, PersistedConsumerCursor>): Promise<void>;
}
/** Best-effort, process-local email arrival notifications. It never reads bodies or invokes DSH sessions. */
export declare class MailConsumerBackend {
    private readonly runtime;
    private readonly config;
    private readonly handlerTimeoutMs;
    private readonly store;
    private readonly subscriptions;
    private readonly cursors;
    private readonly handlerPromises;
    private readonly handlerControllers;
    private readonly mailboxErrors;
    private readonly configBinding;
    private timer;
    private running;
    private started;
    private lastScanAt;
    private lastError;
    private droppedEvents;
    private handlerFailures;
    private handlerTimeouts;
    private appReady;
    /** Persisted cursors are read once per start, before the first scan. */
    private loaded;
    /** Mailboxes restored from disk whose catch-up scan has not run yet. */
    private readonly restored;
    private readyAt;
    private savedSnapshot;
    private saving;
    private persistError;
    constructor(runtime: EmailRuntime, config: {
        consumers?: unknown;
        consumerPollSeconds?: number;
    }, handlerTimeoutMs?: number, store?: MailConsumerCursorStore | null);
    markAppReady(): void;
    private loadCursors;
    private snapshot;
    /** Writes are serialized and skipped when nothing changed since the last write. */
    private persist;
    private syncPolling;
    private configs;
    private pollInterval;
    subscribe(consumerId: string, handler: EmailArrivalHandler): () => void;
    status(): EmailTasksStatus;
    private deliver;
    private scanMailbox;
    tick(): Promise<void>;
    private schedule;
    start(): void;
    stop(): Promise<void>;
}
export declare function installMailConsumers(ctx: any, backend: MailConsumerBackend): void;
