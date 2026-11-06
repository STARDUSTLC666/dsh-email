import type { EmailRuntime } from './runtime.js';
import { MailTaskStore, type MailTaskRecord } from './mail-task-store.js';
import { type MailTaskNative } from './mail-task-native.js';
export declare const MAIL_TASK_ROUTE = "/api/dsh-email/tasks";
export declare class MailTaskBackend {
    private runtime;
    readonly store: MailTaskStore;
    private native;
    private timer;
    private abort;
    private running;
    private started;
    constructor(runtime: EmailRuntime, options?: {
        store?: MailTaskStore;
        native?: MailTaskNative;
        now?: () => number;
    });
    private now;
    bind(ctx: any): void;
    private connection;
    private normalize;
    snapshot(): Promise<{
        revision: number;
        config: {
            keyHash: undefined;
            prefix: string;
            enabled: boolean;
            account: string;
            folder: string;
            senders: string[];
            workspaces: Record<string, string>;
            rules: import("./mail-task-rules.js").TaskRule[];
            autoReply: boolean;
            pollSeconds: number;
        };
        hasKey: boolean;
        available: boolean;
        running: boolean;
        records: MailTaskRecord[];
        error: string | undefined;
    }>;
    action(body: Record<string, unknown>, signal?: AbortSignal): Promise<unknown>;
    private change;
    private route;
    private dispatch;
    private currentRevision;
    private track;
    tick(signal?: AbortSignal): Promise<void>;
    start(): Promise<void>;
    private wake;
    stop(): Promise<void>;
    fetch(request: Request): Promise<Response>;
}
export declare function installMailTasks(ctx: any, backend: MailTaskBackend): void;
