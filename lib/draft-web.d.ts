import { DraftStore, type EmailDraft } from './draft-store.js';
import type { EmailRuntime } from './runtime.js';
import type { EmailSettingsBackend } from './web.js';
export declare const EMAIL_DRAFT_ROUTE = "/api/dsh-email/drafts";
interface Options {
    store?: DraftStore;
    now?: () => number;
}
/** All mutations use the host's authenticated fetch carrier and an explicit UI action. */
export declare class EmailDraftBackend {
    private readonly runtime;
    private readonly settings;
    private readonly options;
    readonly store: DraftStore;
    private readonly plans;
    private scheduleTimer?;
    private scheduleController?;
    private scheduleWork?;
    private scheduleGeneration;
    private scheduleActive;
    private scheduleError;
    constructor(runtime: Pick<EmailRuntime, 'getEffectiveSettings' | 'getSettingsValue' | 'getPool'>, settings: Pick<EmailSettingsBackend, 'snapshot' | 'saveRecipientRules'>, options?: Options);
    private now;
    private prune;
    private invalidate;
    private connection;
    private safe;
    private bytes;
    private attachments;
    create(input: Record<string, unknown>, signal?: AbortSignal): Promise<EmailDraft>;
    private recover;
    action(body: Record<string, unknown>, signal?: AbortSignal): Promise<unknown>;
    private sendPlan;
    runScheduled(signal?: AbortSignal): Promise<void>;
    private armSchedule;
    startScheduler(): Promise<void>;
    stopScheduler(): Promise<void>;
    private writeUpload;
    private upload;
    fetch(request: Request): Promise<Response>;
}
export declare function installEmailDrafts(ctx: any, backend: EmailDraftBackend): void;
export {};
