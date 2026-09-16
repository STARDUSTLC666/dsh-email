/** The 8 built-in provider ids. A `provider` may also name a custom preset. */
export type ProviderName = 'qq' | '163' | '126' | 'sina' | 'aliyun' | 'gmail' | 'outlook' | 'icloud';
/**
 * A provider id as an account stores it: one of the built-in names, or the name
 * of a custom `serverPresets` entry. The union keeps autocomplete for the
 * built-ins while admitting a preset name the schema cannot know in advance.
 */
export type ProviderRef = ProviderName | (string & {});
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
    /** Built-in provider name, or a custom serverPresets name. */
    provider?: ProviderRef;
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
    /**
     * YAML text of the reusable server presets (connection endpoints only).
     * Deliberately never part of ResolvedEmailSettings: editing a preset must not
     * change the pool fingerprint and tear down live IMAP connections.
     */
    serverPresets?: string;
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
/**
 * Anything that can stand in for a provider: a built-in preset, or a custom
 * `serverPresets` entry (whose port/secure are optional and whose label is
 * editor-facing only). Both are looked up the same way.
 */
export interface EndpointPreset {
    imap: {
        host: string;
        port?: number;
        secure?: boolean;
    };
    smtp: {
        host: string;
        port?: number;
        secure?: boolean;
    };
    label?: string;
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
/** Reusable IMAP/SMTP endpoints. Credentials are never stored in a preset. */
export interface ServerPreset {
    label?: string;
    imap: {
        host: string;
        port?: number;
        secure?: boolean;
    };
    smtp: {
        host: string;
        port?: number;
        secure?: boolean;
    };
}
/**
 * Parse the settings-page server presets: a name -> endpoints map, e.g.
 * `corp: { imap: { host: imap.corp }, smtp: { host: smtp.corp } }`.
 * Blank text means "no presets"; a malformed document fails loud, because a
 * silently dropped preset would only resurface later as an unresolvable
 * account reference.
 */
export declare function parseServerPresets(text: string): Record<string, ServerPreset>;
/**
 * Serialize a raw accounts mapping (account name -> account config, optionally
 * carrying a defaultAccount key) back into accountsYaml text.
 *
 * Returns '' when no account is left: resolveEmailSettings decides "is the YAML
 * authoritative" with `.trim()`, so an empty list must never become '{}'.
 */
export declare function serializeAccountsYaml(raw: unknown, defaultAccount?: string): string;
/**
 * Resolve and validate the raw row config. Throws with an actionable message
 * (in Chinese, since it is what the user and the model both read) when the
 * account is not fully specified.
 */
export declare function resolveEmailSettings(config: EmailConfig | undefined): ResolvedEmailSettings;
/** Every name a `provider:` may legally use, built-ins first. */
export declare function providerNames(custom?: Record<string, ServerPreset>): string[];
/**
 * The custom preset names in a serverPresets text, best-effort: a malformed
 * text yields no names instead of throwing. Callers use this to answer "may
 * this provider name be written?", where a broken table can only mean "no".
 */
export declare function presetNamesIn(text: string | undefined): string[];
/** v0.1-compatible wrapper: resolve the single (or default) account. */
export declare function resolveEmailConfig(config: EmailConfig | undefined): ResolvedEmailConfig;
export declare function clampInt(value: unknown, fallback: number, min: number, max: number): number;
