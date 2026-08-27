import { type EmailConfig } from './config.js';
export declare const name = "tool-email";
export declare const inject: string[];
export type Config = EmailConfig;
/**
 * 解析天级日期参数为 Date。接受 YYYY-MM-DD 或完整 ISO 时间。
 * endInclusive=true 时返回“该日结束”（次日零点），用于 until 语义（IMAP BEFORE 是不含当天的）。
 */
export declare function parseEmailDay(input: string, label: string, endInclusive?: boolean): Date;
export declare function apply(ctx: any, config?: Config): void;
export { PROVIDER_NAMES, EMAIL_PASSWORD_ENV } from './config.js';
export { resolveEmailConfig, resolveEmailSettings, parseAccountsYaml, clampInt, defaultDownloadDir } from './config.js';
export { stripHtml, truncateText, flattenAddresses, sanitizeFilename, parseRawMessage } from './parse.js';
export { EmailPool, MailError, messageOf, validateAttachmentPaths, selectAttachmentPart, messageMatchesQuery } from './mail-client.js';
export { SETTINGS_NAMESPACE, EmailSettingsSchema, toSettingsBase, toEmailConfig, validateSettingsValue } from './settings.js';
export { SETTINGS_ROUTE, EmailSettingsBackend, installEmailSettingsWeb } from './web.js';
