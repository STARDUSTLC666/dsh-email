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
export { clampInt, defaultDownloadDir, EMAIL_PASSWORD_ENV, parseAccountsYaml, PROVIDER_NAMES, resolveEmailConfig, resolveEmailSettings } from './config.js';
export { buildReplyMessage, EmailPool, extractMessageIds, MailError, messageMatchesQuery, messageOf, selectAttachmentPart, validateAttachmentPaths } from './mail-client.js';
export { flattenAddresses, parseRawMessage, sanitizeFilename, stripHtml, truncateText } from './parse.js';
export { EmailSettingsSchema, SETTINGS_NAMESPACE, toEmailConfig, toSettingsBase, validateSettingsValue } from './settings.js';
export { parseEmailDay } from './tool-contract.js';
export { EmailSettingsBackend, installEmailSettingsWeb, SETTINGS_ROUTE } from './web.js';
