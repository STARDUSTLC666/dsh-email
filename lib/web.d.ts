import { type EmailSettingsValue } from './settings.js';
import { type EmailConfig, type ProviderPreset, type ServerPreset } from './config.js';
import { type OAuth2State } from './oauth2.js';
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
    /**
     * How this account authenticates. An `oauth2` card shows the device-code
     * login button instead of a 授权码, because Microsoft no longer accepts one.
     */
    authKind: 'oauth2' | 'password';
    /**
     * The `authKind` the account itself pins, when it pins one. `authKind` above
     * is the effective verdict (which pane the editor shows); this is whether the
     * user chose it, which is what the three-way selector has to render back —
     * without it「自动」and「显式密码」look identical and the escape hatch is
     * unreachable from the panel.
     */
    authKindDeclared?: 'oauth2' | 'password';
    /**
     * The application (client) id this account logs in through. Unlike a password
     * this is not a secret — a public-client id travels in every device-code
     * request — so the card carries the value itself and the editor can prefill
     * it. Omitted when the account names none, which means the built-in
     * registration below is the application that will be used.
     */
    clientId?: string;
    /**
     * The application the login falls back to when the account names none: the
     * community registration the plugin ships. Carried on the card so the editor
     * can show which app the consent screen is about to name, instead of leaving
     * the user to guess — and so「no id of its own」stops looking like an error
     * that has to be fixed before a login can even start.
     */
    oauthDefaultClientId?: string;
    /** Display name for the From header, when the account sets one. */
    senderName?: string;
    /** Login user when it differs from the visible address (`user`). */
    authUser?: string;
    /** Whether a login password separate from `password` is stored. */
    hasAuthPassword?: boolean;
    /** Login state of an OAuth2 account: none / a device code in flight / logged in. */
    oauthState: OAuth2State;
    /** The mailbox address the stored token belongs to (OAuth2 accounts only). */
    oauthUser?: string;
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
    /** Persisted account key before a UI rename. */
    originalName?: string;
    provider?: string;
    user?: string;
    /**
     * 授权码，三态契约：undefined = 本卡片没提供（保留 YAML 里已存的 password 键），
     * '' = 明确清除（用户在 UI 里清空了密码框），非空 = 写入（数字/布尔先转字符串）。
     * 卡片永远拿不到明文（snapshot 只给 hasPassword），所以「没提供」绝不能当成
     * 「删除」：那会让每一次无关的卡片保存都静默清掉用户已存的授权码。
     */
    password?: string | number | boolean;
    /**
     * OAuth2 应用（客户端）ID，三态契约与 password 相同：undefined = 本卡片没提供
     * （保留 YAML 里已存的 clientId 键），'' = 明确清除（回到内置的社区应用），非空 =
     * 写入。留空不等于不能用：内置注册就是默认值，这一栏是把默认值换成自己的应用。
     */
    clientId?: string;
    /**
     * 发件显示名，三态契约同 clientId：undefined = 本卡片没提供（保留已存的
     * senderName 键），'' = 明确清除，非空 = 写入。只改收件人看到的名称，发件地址
     * 始终是 user。
     */
    senderName?: string;
    /**
     * 登录账号（IMAP/SMTP 认证用），三态契约同上：undefined = 保留，'' = 清除（回到
     * 用 user 登录），非空 = 写入。别名/中继场景下 user 是发件地址，它才是登录名。
     */
    authUser?: string;
    /**
     * 登录账号自己的密码，三态契约与 password 完全相同（undefined = 保留已存的值，
     * '' = 明确清除，非空 = 写入）。只有 authUser 与 user 不同、且密码也不一样时
     * 才需要。
     */
    authPassword?: string;
    /**
     * 认证方式覆盖，三态契约同上：undefined = 本卡片没提供（保留已存的 authKind 键），
     * '' = 明确恢复「自动」（删掉该键，回到按 provider/主机派生），非空 = 钉住。
     * 这是给仍能用应用密码连 Exchange Online 的租户（混合/本地部署、SMTP AUTH 未关）
     * 留的退路，没有它，这类账号升级后只会看到「尚未登录」且无处可改。
     */
    authKind?: string;
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
 * Verdict on the `Host` header: `undefined` to proceed, otherwise the reason to
 * refuse.
 *
 * The localhost gate on `socket.remoteAddress` proves where the packets came
 * from, not which name the browser believes it is talking to. A page the user
 * visits can point a domain at 127.0.0.1 (DNS rebinding); that request looks
 * same-origin to the browser, carries no `Origin`, and would make the snapshot
 * readable — and the snapshot carries `accountsYaml`, plaintext 授权码 included.
 * Requiring a localhost `Host` closes it.
 *
 * A request with no `Host` at all did not come from a browser (HTTP/1.0, curl,
 * the test harness), and the remote-address gate still applies to it.
 */
export declare function hostVerdict(host: unknown): string | undefined;
/**
 * Verdict on a state-changing POST: `undefined` to proceed, otherwise the status
 * and reason to refuse.
 *
 * Cross-origin writes are the hole the remote-address gate cannot see: a browser
 * page may POST here as a「simple request」(text/plain, no preflight) and change
 * settings or trigger a dial. Three independent checks close it:
 *
 * - `application/json` is not a simple-request content type, so a cross-origin
 *   caller is forced into a preflight, which this route never answers with
 *   `Access-Control-Allow-Origin`.
 * - `Origin`, when it names an http(s) page, must be a localhost origin. Other
 *   schemes are left to the next check: the host may load its UI through a
 *   custom protocol, and a hostile page cannot produce one.
 * - `Sec-Fetch-Site`, when present, must be `same-origin` (or `none`, a
 *   user-initiated navigation with no referrer). This is what catches an opaque
 *   `Origin: null` from a sandboxed iframe.
 *
 * Headers a non-browser client omits are not fabricatable by page script, so
 * their absence is allowed rather than treated as a rejection.
 */
export declare function postVerdict(headers: Record<string, unknown>): {
    status: number;
    message: string;
} | undefined;
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
    /**
     * Resolve one named account of the *stored* settings — the same accounts the
     * tools and the card list see. A login is not a draft operation: the settings
     * page saves the card before it starts one, so the account being logged into
     * is by definition already persisted.
     */
    private oauthAccount;
    /**
     * Start (or report) the device-code login for one OAuth2 account.
     *
     * An account that already holds a token answers `already` — the card shows
     * 「已登录」and there is no second code to hand out. Otherwise the authority's
     * device code is returned verbatim: url = verification_uri, code = user_code,
     * and both interval and expires_in in seconds, which is the unit the page
     * schedules its polling with.
     */
    oauthLogin(name: unknown): Promise<Record<string, unknown>>;
    /**
     * One poll of an in-flight device-code login.
     *
     * `authorization_pending` is the ordinary answer for as long as the user has
     * not finished in the browser, so it is reported as a state rather than an
     * error: only a refused or expired flow comes back as ok:false.
     */
    oauthPoll(name: unknown): Promise<Record<string, unknown>>;
    responseJson(res: any, status: number, body: unknown): void;
    handle(req: any, res: any): Promise<void>;
    /** GET-only localhost route serving the whale-girl courier image. */
    handleAsset(req: any, res: any): void;
}
/** Mount the same-origin routes when a webServer service is present. */
export declare function installEmailSettingsWeb(ctx: any, backend: EmailSettingsBackend): void;
