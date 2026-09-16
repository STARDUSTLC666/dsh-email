import { type EmailSettingsValue } from './settings.js';
import { type EmailConfig, type ProviderPreset, type ServerPreset } from './config.js';
import type { EmailWatchResult } from './types.js';
/** Same-origin route the browser settings section talks to. */
export declare const SETTINGS_ROUTE = "/_dsh/dsh-email/settings";
/** Same-origin route serving the whale-girl courier image to the widget. */
export declare const WHALE_ASSET_ROUTE = "/_dsh/dsh-email/assets/whale";
/**
 * One account as the settings page renders it: resolved connection parameters
 * plus whether a password exists. Passwords themselves never cross this
 * boundary — the card only needs to know if the field is filled.
 */
export interface AccountCardData {
    name: string;
    /** undefined = 自定义服务器（无 provider 预设） */
    provider?: string;
    /** 预设自带的显示名；没有 label 时省略，前端回退显示 provider 名 */
    providerLabel?: string;
    user: string;
    hasPassword: boolean;
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
    inboxFolder: string;
    isDefault: boolean;
}
/** One account card as the editor sends it back; every field is optional. */
export interface AccountCardInput {
    name?: string;
    provider?: string;
    user?: string;
    /**
     * 授权码，三态契约：undefined = 本卡片没提供（保留 YAML 里已存的 password 键），
     * '' = 明确清除（用户在 UI 里清空了密码框），非空 = 写入（数字/布尔先转字符串）。
     * 卡片永远拿不到明文（snapshot 只给 hasPassword），所以「没提供」绝不能当成
     * 「删除」：那会让每一次无关的卡片保存都静默清掉用户已存的授权码。
     */
    password?: string | number | boolean;
    inboxFolder?: string;
    imap?: {
        host?: string;
        port?: number;
        secure?: boolean;
    };
    smtp?: {
        host?: string;
        port?: number;
        secure?: boolean;
    };
}
/**
 * Browser-facing backend: snapshot the settings namespace, save it with
 * optimistic concurrency, and test a draft account over a live IMAP login.
 */
export declare class EmailSettingsBackend {
    private readonly ctx;
    private readonly scope;
    private readonly rowConfig;
    constructor(ctx: any, scope: any, rowConfig: EmailConfig);
    /** Wired by apply(): the email_watch core; 'web' keeps its own cursor scope. */
    watchImpl?: (account: string, folder: string, limit: number, scope: string) => Promise<EmailWatchResult>;
    private userSection;
    /** Effective config for the stored value (row + user-set fields only). */
    private effectiveStored;
    snapshot(): Promise<{
        settings: {
            value: EmailSettingsValue;
            revision: any;
            applies: any;
        };
        writable: boolean;
        accounts: string[];
        accountsDetail: {
            error?: string | undefined;
            list: AccountCardData[];
            defaultAccount?: string | undefined;
            raw: Record<string, unknown>;
        };
        presets: {
            custom: Record<string, ServerPreset>;
            error?: string;
            builtin: Record<string, ProviderPreset>;
        };
        whale: {
            url: string;
            skin: boolean;
            credit: string;
        };
    }>;
    private effectiveAccounts;
    save(value: EmailSettingsValue, expectedRevision: number): Promise<{
        settings: {
            value: EmailSettingsValue;
            revision: any;
            applies: any;
        };
        writable: boolean;
        accounts: string[];
        accountsDetail: {
            error?: string | undefined;
            list: AccountCardData[];
            defaultAccount?: string | undefined;
            raw: Record<string, unknown>;
        };
        presets: {
            custom: Record<string, ServerPreset>;
            error?: string;
            builtin: Record<string, ProviderPreset>;
        };
        whale: {
            url: string;
            skin: boolean;
            credit: string;
        };
    }>;
    /**
     * Test one account (by name, defaulting to the draft's default account) over
     * a live IMAP login. Returns the endpoint it dialled so the panel can show
     * what was actually tried — including on failure.
     */
    test(value: EmailSettingsValue, accountName?: string): Promise<{
        account: string;
        imapHost: string;
        imapPort: number;
        ok: boolean;
        ms: number;
    }>;
    responseJson(res: any, status: number, body: unknown): void;
    handle(req: any, res: any): Promise<void>;
    /** GET-only localhost route serving the whale-girl courier image. */
    handleAsset(req: any, res: any): void;
}
/** Mount the same-origin routes when a webServer service is present. */
export declare function installEmailSettingsWeb(ctx: any, backend: EmailSettingsBackend): void;
