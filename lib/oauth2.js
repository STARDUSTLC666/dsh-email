/**
 * Outlook / Microsoft 365 OAuth2 authentication (device-code flow) for the
 * `outlook` provider.
 *
 * Microsoft retired basic (password) authentication for IMAP/SMTP on Exchange
 * Online, so an outlook account authenticates with an OAuth2 access token
 * instead of a password. This module owns three things and nothing else:
 *
 *  1. the device-code login (`startDeviceFlow` / `pollDeviceFlow`), which is
 *     what the settings page drives with「登录」and「我已完成登录」;
 *  2. the on-disk token store (`~/.dsh/data/dsh-email/oauth2-tokens.json`,
 *     i.e. `$DSH_HOME/data/dsh-email/oauth2-tokens.json` when DSH_HOME is set);
 *  3. `getFreshAccessToken`, which hands the connection code a usable access
 *     token: reuse while it is comfortably fresh, refresh otherwise, single
 *     flight per account so concurrent callers share one token request.
 *
 * Tokens deliberately never touch the settings YAML, never enter the pool
 * fingerprint and are never logged. Every message that leaves this module is
 * the text the user reads in Chinese, without any token material in it.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { clampInt, OUTLOOK_OAUTH2_CLIENT_ID } from './config.js';
import { isLegacyOAuth2Document, OAuth2StorageError, readOAuth2Document, writeOAuth2Document } from './oauth2-storage.js';
import { GoogleOAuth } from './google-oauth.js';
/** The authority that serves both endpoints. `common` accepts any work/school/personal tenant. */
export const OAUTH2_TENANT = 'common';
export const DEVICE_CODE_URL = 'https://login.microsoftonline.com/' + OAUTH2_TENANT + '/oauth2/v2.0/devicecode';
export const TOKEN_URL = 'https://login.microsoftonline.com/' + OAUTH2_TENANT + '/oauth2/v2.0/token';
/**
 * The delegated permissions the plugin needs: offline_access (a refresh token),
 * IMAP.AccessAsUser.All and SMTP.Send. All three must be granted on the app
 * registration, otherwise the token request answers AADSTS65001.
 */
export const OAUTH2_SCOPES = [
    'offline_access',
    'https://outlook.office.com/IMAP.AccessAsUser.All',
    'https://outlook.office.com/SMTP.Send',
];
export const OAUTH2_SCOPE_TEXT = OAUTH2_SCOPES.join(' ');
/** Reuse an access token only while this much of its life is left. */
export const ACCESS_TOKEN_MARGIN_MS = 2 * 60 * 1000;
/** Every request to the authority is bounded: a hung login must not hang a mail tool. */
export const OAUTH2_REQUEST_TIMEOUT_MS = 15000;
/** The one message every「no token yet」path reports, so the fix is always the same. */
export const NOT_LOGGED_IN_MESSAGE = 'Not signed in: complete device-code sign-in in Settings first';
/**
 * Reported when an OAuth2 account has nothing to log in through. The packaged
 * build carries a community registration (OUTLOOK_OAUTH2_CLIENT_ID), so this
 * only surfaces in a build that blanks it, or on an account whose own id was
 * cleared while the built-in one is gone — it still says what to type.
 */
export const NO_CLIENT_ID_MESSAGE = 'No OAuth2 app is configured: this build has no built-in public client ID. Enter one in the App (client) ID field for this account in Settings (free to register; see the Outlook OAuth2 section of the README), otherwise device-code sign-in cannot start.';
/** Where the refresh/access tokens live. Kept out of the settings namespace on purpose. */
export function oauth2TokenFile() {
    const home = process.env.DSH_HOME ?? join(homedir(), '.dsh');
    return join(home, 'data', 'dsh-email', 'oauth2-tokens.json');
}
const google = new GoogleOAuth({ read: readTokenStore, write: writeTokenStore });
export const startGoogleFlow = (name, cfg, current) => google.start(name, cfg, current);
export const pollGoogleFlow = (name, cfg) => google.poll(name, cfg);
export const disposeOAuthFlows = () => google.dispose();
export function cancelOAuthFlow(name) { google.cancel(name); pending.delete(name); }
/** Raised for every expected OAuth2 failure; the message is already user-facing Chinese. */
export class OAuth2Error extends Error {
    constructor(message) {
        super(message);
        this.name = 'OAuth2Error';
    }
}
const pending = new Map();
const starting = new Map();
const refreshing = new Map();
// --- AADSTS / OAuth error mapping -------------------------------------------
/**
 * Actionable English for the AADSTS codes a device-code login actually runs
 * into. Anything not listed falls back to the authority's own description.
 */
const AADSTS_MESSAGES = {
    '7000218': 'The app registration must allow public client flows (Entra → App registrations → Authentication → Advanced settings → Allow public client flows = Yes)',
    '65001': 'Permission not granted: in Entra → App registrations → API permissions, grant admin consent for IMAP.AccessAsUser.All and SMTP.Send',
    '700016': 'App registration not found: the clientId may be wrong',
    '700011': 'Invalid app registration identifier: in Entra, confirm the app still exists and allows multitenant/personal accounts',
    '700022': 'Device code is invalid or already used; start sign-in again',
    '70008': 'Refresh token expired; sign in again in Settings',
    '700082': 'Sign-in session expired; sign in again in Settings',
    '700003': 'Sign-in session is no longer valid; start sign-in again',
    '7000215': 'Invalid client secret: this plugin uses a public client with the device-code flow, so do not set a client secret in the app registration',
    '50034': 'User does not exist: check the mailbox address in the account',
    '53003': 'A conditional access policy blocked sign-in: adjust this user\'s access policy in Entra',
    '50076': 'Multi-factor authentication required: finish MFA on the browser sign-in page and try again',
    '90002': 'This account has no mailbox in this tenant, or the user has no Exchange mailbox',
};
/** The guidance for an AADSTS code, or undefined when it is not mapped. */
export function mapAadstsMessage(code) {
    return AADSTS_MESSAGES[String(code).trim()];
}
/** Extract `error`, `error_description` and the AADSTS number from an error payload. */
function aadstsOf(doc, description) {
    const codes = Array.isArray(doc.error_codes) ? doc.error_codes : [];
    for (const candidate of codes) {
        if (typeof candidate === 'number' || (typeof candidate === 'string' && candidate !== ''))
            return String(candidate);
    }
    const match = description.match(/AADSTS(\d+)/);
    return match === null ? '' : match[1];
}
/**
 * Turn one failed token/device-code response into a verdict. `pending` is a
 * normal state, not an error: the user simply has not finished in the browser.
 */
export function classifyOAuthFailure(payload, httpStatus = 0) {
    const doc = (payload !== null && typeof payload === 'object' ? payload : {});
    const code = typeof doc.error === 'string' ? doc.error : '';
    const description = typeof doc.error_description === 'string' ? doc.error_description : '';
    const aadsts = aadstsOf(doc, description);
    const base = { pending: false, slowDown: false, clearToken: false, message: '', code };
    if (code === 'authorization_pending')
        return { ...base, pending: true };
    if (code === 'slow_down')
        return { ...base, pending: true, slowDown: true };
    if (code === 'expired_token')
        return { ...base, message: 'Device code timed out; start sign-in again' };
    if (code === 'authorization_declined')
        return { ...base, message: 'You declined authorization on the sign-in page; start sign-in again' };
    if (code === 'bad_verification_code')
        return { ...base, message: 'Device code is invalid or already used; start sign-in again' };
    if (code === 'invalid_grant') {
        const mapped = mapAadstsMessage(aadsts);
        return {
            ...base,
            clearToken: true,
            message: mapped !== undefined ? mapped + ' (AADSTS' + aadsts + ')' : 'Sign-in is no longer valid (the refresh token expired or was revoked); sign in again in Settings',
        };
    }
    if (code === 'invalid_client' || code === 'unauthorized_client') {
        const mapped = mapAadstsMessage(aadsts);
        return {
            ...base,
            message: mapped !== undefined
                ? mapped + ' (AADSTS' + aadsts + ')'
                : 'clientId is invalid, or the app registration does not allow the device-code flow (public client flows must be enabled)',
        };
    }
    const mapped = mapAadstsMessage(aadsts);
    if (mapped !== undefined)
        return { ...base, message: mapped + ' (AADSTS' + aadsts + ')' };
    const detail = description !== '' ? description : (code !== '' ? code : 'HTTP ' + httpStatus);
    return { ...base, message: 'Sign-in failed: ' + detail + (aadsts !== '' ? ' (AADSTS' + aadsts + ')' : '') };
}
// --- token store -------------------------------------------------------------
/** Missing/legacy malformed entries mean no tokens; unreadable or corrupt files fail closed. */
export function readTokenStore() {
    let doc;
    try {
        doc = readOAuth2Document(oauth2TokenFile());
    }
    catch (error) {
        if (error instanceof OAuth2StorageError)
            throw new OAuth2Error(error.message);
        if (error.code === 'ENOENT')
            return { version: 1, accounts: {} };
        throw new OAuth2Error('Cannot read the OAuth2 login data; check file access permissions. The original file was not overwritten.');
    }
    if (doc === null || typeof doc !== 'object' || Array.isArray(doc))
        return { version: 1, accounts: {} };
    const raw = doc.accounts;
    const accounts = {};
    if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
        for (const [name, value] of Object.entries(raw)) {
            const entry = tokenEntryOf(value);
            if (entry !== undefined)
                accounts[name] = entry;
        }
    }
    const store = { version: 1, accounts };
    if (process.platform === 'win32' && isLegacyOAuth2Document(doc) && Object.keys(accounts).length > 0)
        writeTokenStore(store);
    return store;
}
/** Keep only well-formed entries: a half-written file must not poison a login. */
function tokenEntryOf(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value))
        return undefined;
    const doc = value;
    if (doc.provider !== undefined && doc.provider !== 'google' && doc.provider !== 'microsoft')
        return undefined;
    if (typeof doc.refreshToken !== 'string' || doc.refreshToken === '')
        return undefined;
    return {
        ...(doc.provider === 'google' || doc.provider === 'microsoft' ? { provider: doc.provider } : {}),
        user: typeof doc.user === 'string' ? doc.user : '',
        clientId: typeof doc.clientId === 'string' ? doc.clientId : '',
        refreshToken: doc.refreshToken,
        accessToken: typeof doc.accessToken === 'string' ? doc.accessToken : '',
        expiresAt: typeof doc.expiresAt === 'number' && Number.isFinite(doc.expiresAt) ? doc.expiresAt : 0,
    };
}
/** Windows: current-user DPAPI. POSIX: private atomic file. Never write plaintext on Windows. */
export function writeTokenStore(store) {
    try {
        writeOAuth2Document(oauth2TokenFile(), store);
    }
    catch (error) {
        if (error instanceof OAuth2StorageError)
            throw new OAuth2Error(error.message);
        throw error;
    }
}
/** Drop one account's tokens (a dead refresh token, or a mailbox that moved). */
export function clearTokenFor(name) {
    google.cancel(name);
    pending.delete(name);
    const store = readTokenStore();
    if (!Object.prototype.hasOwnProperty.call(store.accounts, name))
        return false;
    delete store.accounts[name];
    writeTokenStore(store);
    return true;
}
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
export function oauth2StateOf(name, configuredUser, configuredClientId, provider = 'microsoft', clientSecret) {
    if (provider === 'google')
        return google.state(name, { user: configuredUser ?? '', clientId: configuredClientId, clientSecret });
    const entry = readTokenStore().accounts[name];
    if (entry !== undefined && entry.provider !== 'google') {
        const wanted = (configuredUser ?? '').trim();
        const hasToken = entry.user !== '' && wanted !== '' && entry.user.toLowerCase() !== wanted.toLowerCase();
        const clientMatches = configuredClientId === undefined || entry.clientId === clientIdOf({ clientId: configuredClientId, user: configuredUser ?? '' });
        if (!hasToken && clientMatches)
            return { state: 'logged-in', ...(entry.user !== '' ? { user: entry.user } : {}) };
    }
    const flow = pending.get(name);
    if (flow !== undefined) {
        if (Date.now() < flow.expiresAt)
            return { state: 'pending' };
        pending.delete(name);
    }
    return { state: 'none' };
}
export function isDeviceFlowPending(name) {
    return pending.get(name) !== undefined;
}
export function clientIdOf(cfg) {
    if (cfg.oauthProvider === 'google')
        return cfg.clientId?.trim() || '';
    return (cfg.clientId ?? '').trim() || OUTLOOK_OAUTH2_CLIENT_ID;
}
/** POST one form body to the authority, always with a timeout. */
async function postForm(url, params) {
    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(params).toString(),
            signal: AbortSignal.timeout(OAUTH2_REQUEST_TIMEOUT_MS),
        });
    }
    catch (error) {
        const raw = error instanceof Error ? error.message : String(error);
        throw new OAuth2Error('Cannot reach the Microsoft sign-in service (login.microsoftonline.com): ' + raw);
    }
    let payload;
    try {
        payload = await response.json();
    }
    catch {
        payload = undefined;
    }
    return { status: response.status, payload };
}
function expiresInMs(payload) {
    const seconds = typeof payload.expires_in === 'number' && Number.isFinite(payload.expires_in) ? payload.expires_in : 0;
    return Math.max(0, Math.trunc(seconds)) * 1000;
}
function storeToken(name, cfg, payload, fallbackRefresh) {
    const accessToken = typeof payload.access_token === 'string' ? payload.access_token : '';
    const refreshToken = typeof payload.refresh_token === 'string' && payload.refresh_token !== ''
        ? payload.refresh_token
        : fallbackRefresh;
    if (accessToken === '' || refreshToken === '') {
        throw new OAuth2Error('The sign-in response contained no usable token; start sign-in again');
    }
    const store = readTokenStore();
    store.accounts[name] = {
        user: (cfg.user ?? '').trim(),
        clientId: clientIdOf(cfg),
        refreshToken,
        accessToken,
        expiresAt: Date.now() + expiresInMs(payload),
    };
    writeTokenStore(store);
    return accessToken;
}
// --- device-code flow ---------------------------------------------------------
/**
 * Step 1: ask for a device code. One flow per account is kept in memory; two
 * concurrent calls share the same request instead of creating two codes.
 */
export async function startDeviceFlow(name, cfg) {
    const running = starting.get(name);
    if (running !== undefined)
        return await running;
    const task = (async () => {
        const clientId = clientIdOf(cfg);
        // Refuse locally rather than letting the authority answer AADSTS700011
        // (「application not found」), which tells the user nothing about the one
        // field they have to fill in.
        if (clientId === '')
            throw new OAuth2Error(NO_CLIENT_ID_MESSAGE);
        const { status, payload } = await postForm(DEVICE_CODE_URL, { client_id: clientId, scope: OAUTH2_SCOPE_TEXT });
        const doc = (payload !== null && typeof payload === 'object' ? payload : {});
        if (status !== 200 || typeof doc.device_code !== 'string' || typeof doc.user_code !== 'string') {
            throw new OAuth2Error(classifyOAuthFailure(payload, status).message);
        }
        const url = typeof doc.verification_uri === 'string' && doc.verification_uri !== ''
            ? doc.verification_uri
            : (typeof doc.verification_uri_complete === 'string' ? doc.verification_uri_complete : '');
        if (url === '')
            throw new OAuth2Error('Microsoft returned no sign-in URL; retry later');
        const expiresIn = typeof doc.expires_in === 'number' ? Math.max(0, Math.trunc(doc.expires_in)) : 900;
        const flow = {
            deviceCode: doc.device_code,
            userCode: doc.user_code,
            verificationUri: url,
            interval: clampInt(doc.interval, 5, 1, 60),
            expiresAt: Date.now() + expiresIn * 1000,
            clientId,
            user: (cfg.user ?? '').trim(),
        };
        // A fresh code replaces whatever was pending: the old one is dead anyway.
        pending.set(name, flow);
        return { url, code: flow.userCode, interval: flow.interval, expiresIn };
    })();
    starting.set(name, task);
    try {
        return await task;
    }
    finally {
        starting.delete(name);
    }
}
/**
 * Step 2: one poll. `pending` is the ordinary answer until the user finishes in
 * the browser; on success the token is persisted before this returns.
 */
export async function pollDeviceFlow(name) {
    const flow = pending.get(name);
    if (flow === undefined)
        throw new OAuth2Error('Device-code sign-in has not started; click Sign in on the Settings page first');
    if (Date.now() >= flow.expiresAt) {
        pending.delete(name);
        throw new OAuth2Error('Device code timed out; start sign-in again');
    }
    const { status, payload } = await postForm(TOKEN_URL, {
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: flow.clientId,
        device_code: flow.deviceCode,
    });
    const doc = (payload !== null && typeof payload === 'object' ? payload : {});
    if (pending.get(name) !== flow)
        throw new OAuth2Error('Sign-in was cancelled or replaced; sign in again');
    if (status === 200 && typeof doc.access_token === 'string') {
        pending.delete(name);
        storeToken(name, { user: flow.user, clientId: flow.clientId }, doc, '');
        return { status: 'ok', user: flow.user };
    }
    const verdict = classifyOAuthFailure(payload, status);
    if (verdict.pending) {
        if (verdict.slowDown)
            flow.interval += 5;
        return { status: 'pending' };
    }
    pending.delete(name);
    throw new OAuth2Error(verdict.message);
}
// --- access tokens -------------------------------------------------------------
/**
 * A usable access token for one account: the cached one while more than two
 * minutes of its life are left, otherwise a refresh. Concurrent callers share a
 * single refresh request, so a burst of tool calls never mints several tokens
 * (Microsoft rotates the refresh token, and losing that race logs the user out).
 *
 * `force` re-mints even a token that still looks fresh: the only way to tell a
 * revoked token from a network failure after a server-side rejection.
 */
export async function getFreshAccessToken(name, cfg, options = {}) {
    if (cfg.oauthProvider === 'google')
        return google.accessToken(name, cfg, options.force);
    const entry = readTokenStore().accounts[name];
    if (entry === undefined || entry.provider === 'google')
        throw new OAuth2Error(NOT_LOGGED_IN_MESSAGE);
    const wanted = (cfg.user ?? '').trim();
    const clientId = clientIdOf(cfg);
    if (clientId === '')
        throw new OAuth2Error(NO_CLIENT_ID_MESSAGE);
    if (entry.clientId !== clientId) {
        throw new OAuth2Error('Not signed in: clientId changed; complete device-code sign-in in Settings again');
    }
    if (entry.user !== '' && wanted !== '' && entry.user.toLowerCase() !== wanted.toLowerCase()) {
        throw new OAuth2Error('Not signed in: the account address changed to ' + wanted + '; complete device-code sign-in in Settings');
    }
    if (options.force !== true && entry.accessToken !== '' && entry.expiresAt - Date.now() > ACCESS_TOKEN_MARGIN_MS) {
        return entry.accessToken;
    }
    return await refreshAccessToken(name, cfg, entry);
}
/** One refresh request per account at a time. */
function refreshAccessToken(name, cfg, entry) {
    const running = refreshing.get(name);
    if (running !== undefined)
        return running;
    const task = (async () => {
        const { status, payload } = await postForm(TOKEN_URL, {
            grant_type: 'refresh_token',
            client_id: clientIdOf(cfg),
            refresh_token: entry.refreshToken,
            scope: OAUTH2_SCOPE_TEXT,
        });
        const doc = (payload !== null && typeof payload === 'object' ? payload : {});
        const current = readTokenStore().accounts[name];
        if (!current || current.provider === 'google' || current.refreshToken !== entry.refreshToken || current.clientId !== entry.clientId || current.user !== entry.user)
            throw new OAuth2Error('Login data changed; try again');
        if (status === 200 && typeof doc.access_token === 'string') {
            return storeToken(name, cfg, doc, entry.refreshToken);
        }
        const verdict = classifyOAuthFailure(payload, status);
        // Only a dead refresh token is dropped. A timeout or a 5xx must leave the
        // stored token alone: it may well still be good, and losing it would force
        // the user through a browser login for nothing.
        if (verdict.clearToken) {
            try {
                clearTokenFor(name);
            }
            catch { /* the message below is what matters */ }
        }
        throw new OAuth2Error(verdict.message);
    })();
    const tracked = task.then(token => { refreshing.delete(name); return token; }, error => { refreshing.delete(name); throw error; });
    refreshing.set(name, tracked);
    return tracked;
}
