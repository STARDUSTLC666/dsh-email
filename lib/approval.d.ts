/** Outgoing-mail approval is independent of tool execution. */
import type { EmailRuntime } from './runtime.js';
import type { EmailService } from './mail-service.js';
import { type FolderMutationSnapshot } from './imap-folders.js';
type Runtime = Pick<EmailRuntime, 'getSettingsValue' | 'getEffectiveSettings'> & Partial<Pick<EmailRuntime, 'getPool'>>;
type PreparedReply = Awaited<ReturnType<EmailService['prepareReply']>>;
interface FolderAuthorization {
    account: string;
    path: string;
    newName?: string;
    snapshot?: FolderMutationSnapshot;
    stamp: string;
    expires: number;
}
export declare function takeFolderAuthorization(args: unknown, runtime: Pick<EmailRuntime, 'getEffectiveSettings'>): FolderAuthorization;
/** The official pipeline passes the same frozen argument object to gate and body. */
export declare function takeReplyAuthorization(args: unknown, runtime: Runtime): PreparedReply | undefined;
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
export declare function installSendApproval(ctx: ApprovalContext, runtime: Runtime): void;
export {};
