/** The 8 built-in provider ids. A `provider` may also name a custom preset. */
export type ProviderName = 'qq' | '163' | '126' | 'sina' | 'aliyun' | 'gmail' | 'outlook' | 'icloud';
/**
 * A provider id as an account stores it: one of the built-in names, or the name
 * of a custom `serverPresets` entry. The union keeps autocomplete for the
 * built-ins while admitting a preset name the schema cannot know in advance.
 */
export type ProviderRef = ProviderName | (string & {});
/**
 * The provider that authenticates with OAuth2 instead of a password.
 *
 * Microsoft retired basic authentication for Exchange Online, so `outlook` is
 * not a password provider with different endpoints — it is the same endpoints
 * (imap/smtp.office365.com, straight out of PROVIDER_PRESETS) behind a
 * completely different authentication scheme. `authKind` below is that fact.
 */
export declare const OUTLOOK_PROVIDER = "outlook";
/** The Exchange Online IMAP host. Any account dialling it is an OAuth2 account. */
export declare const OUTLOOK_IMAP_HOST = "outlook.office365.com";
/**
 * The built-in client id for the device-code flow: a community registration.
 *
 * Requiring every Outlook user to register an application of their own puts a
 * setup wall in front of the one provider where OAuth2 cannot be avoided, so
 * the plugin ships one. The id below is the public-client registration
 * contributed by gurio-wine (PR #13) and used with their permission; the README
 * credits them and states the two things that follow from using somebody
 * else's application: the consent screen names *their* app, and the sign-in
 * logs land in *their* tenant along with the user's UPN.
 *
 * An account that wants neither — an enterprise that refuses third-party apps,
 * or a day when this registration is gone — sets its own `clientId` (a free
 * Entra public-client registration) and that value wins over this constant.
 * The settings card shows which application is in effect either way, so nobody
 * consents to an app they were not told about.
 *
 * Replacing this constant is the whole change a maintainer makes to ship the
 * project's own application instead. Tokens are bound to the id that issued
 * them, so such a release asks every built-in account to log in one more time.
 */
export declare const OUTLOOK_OAUTH2_CLIENT_ID = "15dcd5aa-00dd-487f-82d7-1d2b2c299e14";
/**
 * How an account proves who it is. `password` covers every existing provider
 * (an app password / 授权码) and is the default, so nothing about them changes.
 */
export type AuthKind = 'oauth2' | 'password';
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
    /**
     * Display name for the From header. The address stays `user` — recipients
     * must see the mailbox that owns the mail, not the login.
     */
    senderName?: string;
    /**
     * Login handed to IMAP/SMTP when it differs from `user`: the alias case,
     * where `user` is the address mail is sent *from* and the server only
     * authenticates the real account, or a relay whose login is not a mailbox
     * at all. Defaults to `user`.
     */
    authUser?: string;
    /** Password that goes with `authUser`. Defaults to `password`. */
    authPassword?: string;
    /**
     * Public-client id used by the OAuth2 device-code flow. Only read for an
     * OAuth2 account, where it overrides OUTLOOK_OAUTH2_CLIENT_ID.
     */
    clientId?: string;
    /**
     * Escape hatch over the derived authentication scheme. Left unset, an account
     * pointed at the `outlook` provider or the Exchange Online IMAP host is an
     * OAuth2 account and its password is dropped. Set `password` to keep using an
     * app password there — a tenant that still accepts basic auth (hybrid or
     * on-prem, SMTP AUTH left enabled), or a mailbox that worked before this
     * derivation existed, must not be told「尚未登录」after an upgrade. Set
     * `oauth2` to opt in from a custom host.
     */
    authKind?: AuthKind;
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
    /** Display name for the From header, '' when the account does not set one. */
    senderName: string;
    /** Login actually handed to IMAP/SMTP (== user unless authUser is set). */
    authUser: string;
    /** Password for authUser (== password unless authPassword is set). */
    authPassword: string;
    /**
     * The app password / 授权码. Empty for an OAuth2 account — that is the point:
     * nothing is stored, the token store holds the credential instead.
     */
    password: string;
    /**
     * How this account authenticates. Derived from `provider` / the IMAP host
     * unless the account pins it with an explicit `authKind`.
     */
    authKind: AuthKind;
    /** Public-client id for the device-code flow (OAuth2 accounts only). */
    clientId?: string;
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
/**
 * True when an account authenticates with OAuth2 rather than a password.
 *
 * Two ways in, and only these two: the built-in `outlook` provider, or an
 * account pointed at the Exchange Online IMAP host by hand (a custom preset or
 * an explicit `imap.host`). The host test is what keeps a custom preset to
 * outlook.office365.com from silently demanding a password Microsoft no longer
 * accepts — the endpoints are identical, only the credentials are not.
 */
export declare function isOAuth2Account(provider: string | undefined, imapHost: string | undefined): boolean;
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
