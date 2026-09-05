/** Outgoing-mail approval is independent of tool execution. */
import type { EmailRuntime } from './runtime.js';
type ApprovalDecision = {
    kind: 'allow';
} | {
    kind: 'deny';
    reason: string;
} | {
    kind: 'ask';
    reason?: string;
};
interface PendingExecution {
    name: string;
    arguments?: unknown;
    agent?: unknown;
    callId?: string;
    signal?: AbortSignal;
}
interface ApprovalContext {
    on(event: 'tools/pre-execute', listener: (exec: PendingExecution, next: () => Promise<ApprovalDecision>) => Promise<ApprovalDecision>, options: {
        prepend: boolean;
    }): unknown;
    get(name: 'approval'): {
        request(input: {
            agent?: unknown;
            toolName: string;
            callId?: string;
            reason: string;
            signal?: AbortSignal;
        }): Promise<string>;
    } | undefined;
}
export declare function installSendApproval(ctx: ApprovalContext, runtime: Pick<EmailRuntime, 'getSettingsValue' | 'getEffectiveSettings'>): void;
export {};
