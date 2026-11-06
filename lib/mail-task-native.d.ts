export interface TaskObservation {
    cwd: string;
    cursor: number;
    events: any[];
}
export interface MailTaskNative {
    available(): boolean;
    create(cwd: string): Promise<string>;
    observe(sessionId: string, afterSeq: number, signal: AbortSignal): Promise<TaskObservation>;
    state(sessionId: string, signal: AbortSignal): Promise<{
        running: boolean;
        pendingInput: string[];
        queue?: unknown;
    }>;
    prompt(sessionId: string, requestId: string, text: string, signal: AbortSignal): Promise<void>;
}
/** Public DSH services only: ordinary preset, user prompt admission, passive reads. */
export declare function nativeMailTasks(ctx: any): MailTaskNative;
