import { installSendApproval } from './approval.js';
import { createEmailRuntime } from './runtime.js';
import { buildEmailTools } from './tools.js';
import { EmailSettingsBackend, installEmailSettingsWeb } from './web.js';
export const name = 'tool-email';
export const inject = ['settings', 'tools'];
/** Compose settings/pool lifecycle, tools, browser routes and the outgoing-mail gate. */
export function apply(ctx, config = {}) {
    const runtime = createEmailRuntime(ctx, config);
    const backend = new EmailSettingsBackend(ctx, runtime.settingsScope, config);
    backend.watchImpl = runtime.watch;
    installEmailSettingsWeb(ctx, backend);
    for (const definition of buildEmailTools(runtime))
        ctx.tools.register(definition);
    installSendApproval(ctx, runtime);
}
export { clampInt, defaultDownloadDir, EMAIL_PASSWORD_ENV, isOAuth2Account, OUTLOOK_OAUTH2_CLIENT_ID, OUTLOOK_PROVIDER, parseAccountsYaml, parseServerPresets, presetNamesIn, providerNames, PROVIDER_NAMES, resolveEmailConfig, resolveEmailSettings, serializeAccountsYaml } from './config.js';
export { ACCESS_TOKEN_MARGIN_MS, classifyOAuthFailure, clearTokenFor, clientIdOf, DEVICE_CODE_URL, getFreshAccessToken, mapAadstsMessage, NO_CLIENT_ID_MESSAGE, NOT_LOGGED_IN_MESSAGE, oauth2StateOf, oauth2TokenFile, OAUTH2_SCOPES, OAuth2Error, pollDeviceFlow, readTokenStore, startDeviceFlow, TOKEN_URL, writeTokenStore, } from './oauth2.js';
export { buildReplyMessage, EmailPool, extractMessageIds, imapAuthOf, looksLikeAuthFailure, MailError, messageMatchesQuery, messageOf, OAUTH2_RELOGIN_MESSAGE, redactCredentials, selectAttachmentPart, smtpAuthOf, validateAttachmentPaths } from './mail-client.js';
export { flattenAddresses, parseRawMessage, sanitizeFilename, stripHtml, truncateText } from './parse.js';
export { EmailSettingsSchema, SETTINGS_NAMESPACE, toEmailConfig, toSettingsBase, validateSettingsValue } from './settings.js';
export { parseEmailDay } from './tool-contract.js';
export { EmailSettingsBackend, installEmailSettingsWeb, SETTINGS_ROUTE } from './web.js';
