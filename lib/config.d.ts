export type ProviderName = 'qq' | '163' | '126' | 'sina' | 'aliyun' | 'gmail' | 'outlook' | 'icloud';
export interface ImapConfig {
    host?: string;
    port?: number;
    secure?: boolean;
    connectionTimeoutMs?: number;
    socketTimeoutMs?: number;
}
export interface SmtpConfig {
    host?: string;
    port?: number;
    secure?: boolean;
}
/** One mailbox account. Top-level shorthand fields act as shared defaults. */
export interface AccountConfig {
    provider?: ProviderName;
    user?: string;
    password?: string;
    imap?: ImapConfig;
    smtp?: SmtpConfig;
    inboxFolder?: string;
}
export interface EmailConfig extends AccountConfig {
    /** Ask the user for approval before email_send. Default true. */
    sendApproval?: boolean;
    /** Plain-text body cap for email_read. Default 20000. */
    maxBodyChars?: number;
    /** Named accounts. Account-level fields override the top-level shorthand. */
    accounts?: Record<string, AccountConfig>;
    /** YAML text of the accounts map, editable from the settings page. Wins over accounts when non-empty. */
    accountsYaml?: string;
    /** Which account tools use when the call omits account. Required with 2+ accounts. */
    defaultAccount?: string;
    /** Directory email_attachment writes into. Default: the session workspace's .dsh-email-downloads (falls back to $DSH_HOME/email-downloads). */
    downloadDir?: string;
    /** Client-side body scan when server search finds nothing. Default true. */
    bodySearchFallback?: boolean;
    /** How many recent messages the body-search fallback parses. Default 30. */
    bodySearchLimit?: number;
    /** Per-attachment and total-attachment byte cap. Default 20 MiB. */
    maxAttachmentBytes?: number;
    /** Unused IMAP connections close after this many ms. Default 60000. */
    idleTimeoutMs?: number;
}
export interface ProviderPreset {
    imap: {
        host: string;
        port: number;
        secure: boolean;
    };
    smtp: {
        host: string;
        port: number;
        secure: boolean;
    };
}
export declare const PROVIDER_PRESETS: Record<string, ProviderPreset>;
export declare const PROVIDER_NAMES: string[];
export declare const EMAIL_PASSWORD_ENV = "DSH_EMAIL_PASSWORD";
/** Fully resolved, validated configuration for one account. */
export interface ResolvedEmailConfig {
    user: string;
    password: string;
    imap: ImapConfig & {
        host: string;
        port: number;
        secure: boolean;
    };
    smtp: SmtpConfig & {
        host: string;
        port: number;
        secure: boolean;
    };
    inboxFolder: string;
}
/** Fully resolved plugin settings: the account map plus shared policy. */
export interface ResolvedEmailSettings {
    accounts: Map<string, ResolvedEmailConfig>;
    defaultAccount: string;
    sendApproval: boolean;
    maxBodyChars: number;
    downloadDir: string;
    /** Whether downloadDir was set explicitly (vs. the default). */
    downloadDirExplicit: boolean;
    maxAttachmentBytes: number;
    idleTimeoutMs: number;
    bodySearchFallback: boolean;
    bodySearchLimit: number;
}
export declare function defaultDownloadDir(): string;
/**
 * Parse the settings-page accounts YAML: an object map (name -> account),
 * optionally with a reserved string key defaultAccount that is extracted.
 */
export declare function parseAccountsYaml(text: string): {
    map: Record<string, AccountConfig>;
    defaultAccount?: string;
};
/**
 * Resolve and validate the raw row config. Throws with an actionable message
 * (in Chinese, since it is what the user and the model both read) when the
 * account is not fully specified.
 */
export declare function resolveEmailSettings(config: EmailConfig | undefined): ResolvedEmailSettings;
/** v0.1-compatible wrapper: resolve the single (or default) account. */
export declare function resolveEmailConfig(config: EmailConfig | undefined): ResolvedEmailConfig;
export declare function clampInt(value: unknown, fallback: number, min: number, max: number): number;
