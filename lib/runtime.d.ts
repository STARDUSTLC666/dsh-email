/** Live settings, account-pool ownership, and independent tool/web watch cursors. */
import { type EmailConfig, type ResolvedEmailSettings } from './config.js';
import { EmailPool } from './mail-client.js';
import { type EmailSettingsValue } from './settings.js';
import type { EmailWatchResult } from './types.js';
export type EmailClient = Pick<EmailPool, 'list' | 'read' | 'mark' | 'search' | 'send' | 'reply' | 'folders' | 'downloadAttachment' | 'startIdleSweep' | 'dispose'>;
export interface EmailSettingsScope {
    get(): unknown;
}
export interface EmailRuntimeContext {
    settings: {
        register(namespace: string, schema: unknown, options: {
            base: Partial<EmailSettingsValue>;
            applies: 'live';
            validate(value: unknown): void;
        }): EmailSettingsScope;
        describe?(): Array<{
            ns: string;
            user?: Partial<EmailSettingsValue>;
        }>;
    };
    effect(effect: () => () => void): unknown;
    logger?: {
        warn?(message: string): void;
    };
}
export interface EmailRuntime {
    readonly settingsScope: EmailSettingsScope;
    getSettingsValue(): EmailSettingsValue;
    getEffectiveSettings(): ResolvedEmailSettings;
    getPool(): EmailClient;
    watch(account: string, folder: string, limit: number, scope: string, signal?: AbortSignal): Promise<EmailWatchResult>;
    dispose(): void;
}
/** Register live settings and own exactly one pool for their effective value. */
export declare function createEmailRuntime(ctx: EmailRuntimeContext, config: EmailConfig, createPool?: (settings: ResolvedEmailSettings) => EmailClient): EmailRuntime;
