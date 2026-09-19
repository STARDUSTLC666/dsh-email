import type { EmailConfig } from './config.js';
export declare const name = "tool-email";
export declare const inject: string[];
export type Config = EmailConfig;
/** Compose settings/pool lifecycle, tools, browser routes and the outgoing-mail gate. */
export declare function apply(ctx: any, config?: Config): void;
export { clampInt, defaultDownloadDir, EMAIL_PASSWORD_ENV, isOAuth2Account, OUTLOOK_OAUTH2_CLIENT_ID, OUTLOOK_PROVIDER, parseAccountsYaml, parseServerPresets, presetNamesIn, providerNames, PROVIDER_NAMES, resolveEmailConfig, resolveEmailSettings, serializeAccountsYaml } from './config.js';
export type { AuthKind, ResolvedEmailConfig } from './config.js';
export { ACCESS_TOKEN_MARGIN_MS, classifyOAuthFailure, clearTokenFor, clientIdOf, DEVICE_CODE_URL, getFreshAccessToken, mapAadstsMessage, NO_CLIENT_ID_MESSAGE, NOT_LOGGED_IN_MESSAGE, oauth2StateOf, oauth2TokenFile, OAUTH2_SCOPES, OAuth2Error, pollDeviceFlow, readTokenStore, startDeviceFlow, TOKEN_URL, writeTokenStore, } from './oauth2.js';
export type { DeviceFlowStart, OAuth2PollResult, OAuth2State, OAuth2TokenEntry, OAuth2TokenStore } from './oauth2.js';
export { buildReplyMessage, EmailPool, extractMessageIds, imapAuthOf, looksLikeAuthFailure, MailError, messageMatchesQuery, messageOf, OAUTH2_RELOGIN_MESSAGE, redactCredentials, selectAttachmentPart, smtpAuthOf, validateAttachmentPaths } from './mail-client.js';
export { flattenAddresses, parseRawMessage, sanitizeFilename, stripHtml, truncateText } from './parse.js';
export { EmailSettingsSchema, SETTINGS_NAMESPACE, toEmailConfig, toSettingsBase, validateSettingsValue } from './settings.js';
export { parseEmailDay } from './tool-contract.js';
export { EmailSettingsBackend, installEmailSettingsWeb, SETTINGS_ROUTE } from './web.js';
export type { AccountCardData, AccountCardInput } from './web.js';
