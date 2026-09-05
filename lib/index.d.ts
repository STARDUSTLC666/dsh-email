import type { EmailConfig } from './config.js';
export declare const name = "tool-email";
export declare const inject: string[];
export type Config = EmailConfig;
/** Compose settings/pool lifecycle, tools, browser routes and the outgoing-mail gate. */
export declare function apply(ctx: any, config?: Config): void;
export { clampInt, defaultDownloadDir, EMAIL_PASSWORD_ENV, parseAccountsYaml, PROVIDER_NAMES, resolveEmailConfig, resolveEmailSettings } from './config.js';
export { buildReplyMessage, EmailPool, extractMessageIds, MailError, messageMatchesQuery, messageOf, selectAttachmentPart, validateAttachmentPaths } from './mail-client.js';
export { flattenAddresses, parseRawMessage, sanitizeFilename, stripHtml, truncateText } from './parse.js';
export { EmailSettingsSchema, SETTINGS_NAMESPACE, toEmailConfig, toSettingsBase, validateSettingsValue } from './settings.js';
export { parseEmailDay } from './tool-contract.js';
export { EmailSettingsBackend, installEmailSettingsWeb, SETTINGS_ROUTE } from './web.js';
