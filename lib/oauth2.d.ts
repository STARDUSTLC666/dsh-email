import { type ResolvedEmailConfig } from './config.js';
/** The authority that serves both endpoints. `common` accepts any work/school/personal tenant. */
export declare const OAUTH2_TENANT = "common";
export declare const DEVICE_CODE_URL: string;
export declare const TOKEN_URL: string;
/**
 * The delegated permissions the plugin needs: offline_access (a refresh token),
 * IMAP.AccessAsUser.All and SMTP.Send. All three must be granted on the app
 * registration, otherwise the token request answers AADSTS65001.
 */
export declare const OAUTH2_SCOPES: string[];
export declare const OAUTH2_SCOPE_TEXT: string;
/** Reuse an access token only while this much of its life is left. */
export declare const ACCESS_TOKEN_MARGIN_MS: number;
/** Every request to the authority is bounded: a hung login must not hang a mail tool. */
export declare const OAUTH2_REQUEST_TIMEOUT_MS = 15000;
/** The one message every「no token yet」path reports, so the fix is always the same. */
export declare const NOT_LOGGED_IN_MESSAGE = "\u5C1A\u672A\u767B\u5F55\uFF1A\u8BF7\u5148\u5728\u8BBE\u7F6E\u9875\u5B8C\u6210\u8BBE\u5907\u7801\u767B\u5F55";
/**
 * Reported when an OAuth2 account has nothing to log in through. The packaged
 * build carries a community registration (OUTLOOK_OAUTH2_CLIENT_ID), so this
 * only surfaces in a build that blanks it, or on an account whose own id was
 * cleared while the built-in one is gone — it still says what to type.
 */
export declare const NO_CLIENT_ID_MESSAGE = "\u5C1A\u672A\u914D\u7F6E OAuth2 \u5E94\u7528\uFF1A\u5F53\u524D\u6784\u5EFA\u6CA1\u6709\u5185\u7F6E\u516C\u5171\u5BA2\u6237\u7AEF ID\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u9875\u8BE5\u8D26\u53F7\u7684\u300C\u5E94\u7528\uFF08\u5BA2\u6237\u7AEF\uFF09ID\u300D\u91CC\u586B\u5165\u4E00\u4E2A\uFF08\u514D\u8D39\u6CE8\u518C\uFF0C\u6B65\u9AA4\u89C1 README \u7684\u300COutlook OAuth2\u300D\u4E00\u8282\uFF09\uFF0C\u5426\u5219\u65E0\u6CD5\u5F00\u59CB\u8BBE\u5907\u7801\u767B\u5F55";
/** Where the refresh/access tokens live. Kept out of the settings namespace on purpose. */
export declare function oauth2TokenFile(): string;
export interface OAuth2TokenEntry {
    /** The mailbox address the token was issued for. */
    user: string;
    clientId: string;
    refreshToken: string;
    accessToken: string;
    /** Absolute ms timestamp; 0 means「unknown, treat as expired」. */
    expiresAt: number;
}
export interface OAuth2TokenStore {
    version: 1;
    accounts: Record<string, OAuth2TokenEntry>;
}
/** The part of a resolved account this module needs. */
export type OAuth2AccountConfig = Pick<ResolvedEmailConfig, 'user' | 'clientId'>;
/** Raised for every expected OAuth2 failure; the message is already user-facing Chinese. */
export declare class OAuth2Error extends Error {
    constructor(message: string);
}
export interface DeviceFlowStart {
    /** verification_uri: the page the user opens. */
    url: string;
    /** user_code: what the user types there. */
    code: string;
    /** Seconds between two polls, as the authority asked. */
    interval: number;
    /** Seconds until the device code itself expires. */
    expiresIn: number;
}
/** The Chinese guidance for an AADSTS code, or undefined when it is not mapped. */
export declare function mapAadstsMessage(code: string | number): string | undefined;
interface OAuthFailure {
    /** authorization_pending / slow_down: keep polling. */
    pending: boolean;
    /** slow_down: the poll interval must grow. */
    slowDown: boolean;
    /** invalid_grant: the stored refresh token is dead and must be dropped. */
    clearToken: boolean;
    message: string;
    code: string;
}
/**
 * Turn one failed token/device-code response into a verdict. `pending` is a
 * normal state, not an error: the user simply has not finished in the browser.
 */
export declare function classifyOAuthFailure(payload: unknown, httpStatus?: number): OAuthFailure;
/** Read the store. A missing or unreadable file is 「no tokens」, never a crash. */
export declare function readTokenStore(): OAuth2TokenStore;
/** Persist the store. Owner-only where the platform honours the mode; utf8, no BOM. */
export declare function writeTokenStore(store: OAuth2TokenStore): void;
/** Drop one account's tokens (a dead refresh token, or a mailbox that moved). */
export declare function clearTokenFor(name: string): boolean;
export type OAuth2State = 'none' | 'pending' | 'logged-in';
/**
 * What the settings card shows for one account: logged-in wins over a flow
 * that is merely in progress, and an expired flow is not「pending」any more.
 *
 * `configuredUser` is the address the account is configured with right now.
 * A token issued for a *different* mailbox is not a login for this account —
 * reporting it as one would show 「已登录」 on a card whose tools all fail, so
 * the verdict is「none」and the user is sent through the flow again. An empty
 * configured address cannot disagree with anything and keeps the token.
 */
export declare function oauth2StateOf(name: string, configuredUser?: string, configuredClientId?: string): {
    state: OAuth2State;
    user?: string;
};
export declare function isDeviceFlowPending(name: string): boolean;
export declare function clientIdOf(cfg: OAuth2AccountConfig): string;
/**
 * Step 1: ask for a device code. One flow per account is kept in memory; two
 * concurrent calls share the same request instead of creating two codes.
 */
export declare function startDeviceFlow(name: string, cfg: OAuth2AccountConfig): Promise<DeviceFlowStart>;
export type OAuth2PollResult = {
    status: 'ok';
    user: string;
} | {
    status: 'pending';
};
/**
 * Step 2: one poll. `pending` is the ordinary answer until the user finishes in
 * the browser; on success the token is persisted before this returns.
 */
export declare function pollDeviceFlow(name: string): Promise<OAuth2PollResult>;
/**
 * A usable access token for one account: the cached one while more than two
 * minutes of its life are left, otherwise a refresh. Concurrent callers share a
 * single refresh request, so a burst of tool calls never mints several tokens
 * (Microsoft rotates the refresh token, and losing that race logs the user out).
 *
 * `force` re-mints even a token that still looks fresh: the only way to tell a
 * revoked token from a network failure after a server-side rejection.
 */
export declare function getFreshAccessToken(name: string, cfg: OAuth2AccountConfig, options?: {
    force?: boolean;
}): Promise<string>;
export {};
