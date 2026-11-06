import type { EmailRuntime } from './runtime.js';
/** Excerpt cap for the seeded first message; the full body stays reachable via email_read. */
export declare const TASK_SESSION_PROMPT_LIMIT = 4000;
/**
 * Stable identity for one message across folders: prefer the Message-ID header so the
 * same mail clicked from INBOX and from a moved folder resolves to one task session.
 */
export declare function taskSessionKey(messageId: string, account: string, folder: string, uid: string | number): string;
/** Session identity derived from the stable key; reusing it on re-click is the whole dedupe rule. */
export declare function taskSessionId(key: string): string;
export declare function taskSessionTitle(subject: string): string;
export declare function taskSessionPrompt(info: {
    account: string;
    folder: string;
    uid: string | number;
    subject: string;
    from: string;
    date: string;
    text: string;
}): string;
/**
 * Create (or reuse) a task session for one message and seed it with the approved
 * summary + handling brief. Host services arrive through the plugin ctx.
 */
export declare function runEmailTaskSession(opts: {
    ctx?: any;
    runtime: Pick<EmailRuntime, 'getEffectiveSettings' | 'getPool'>;
    account: string;
    folder: string;
    uid: string | number;
    signal?: AbortSignal;
}): Promise<{
    sessionId: string;
    created: boolean;
    title: string;
}>;
