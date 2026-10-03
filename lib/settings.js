import z from 'schemastery';
import { ENDPOINT_DEFAULTS, normalizeSettingsEndpoint, PROVIDER_NAMES } from './config.js';
import { parseRecipientPolicies } from './recipient-policy.js';
/** Settings-document namespace this plugin owns (editable from the Web settings page). */
export const SETTINGS_NAMESPACE = 'dsh-email';
/**
 * The settings-page shape: the single default account plus shared policy.
 * The form edits the default/shorthand account; its advanced YAML area
 * edits named accounts through accountsYaml.
 */
export const EmailSettingsSchema = z.object({
    provider: z.string().default(''),
    user: z.string().default(''),
    password: z.string().role('secret').default(''),
    inboxFolder: z.string().default('INBOX'),
    sendApproval: z.boolean().default(true),
    trustedRecipientsYaml: z.string().default(''),
    maxBodyChars: z.number().default(20000),
    downloadDir: z.string().default(''),
    accountsYaml: z.string().role('secret').default(''),
    // Reusable IMAP/SMTP endpoints for the account cards. No credentials, so no
    // role('secret') — and deliberately not projected into EmailConfig, or
    // editing a preset would change the pool fingerprint and drop live sessions.
    serverPresets: z.string().default(''),
    imap: z.object({
        host: z.string().default(''),
        port: z.number().default(ENDPOINT_DEFAULTS.imap.port),
        secure: z.boolean().default(ENDPOINT_DEFAULTS.imap.secure),
    }),
    smtp: z.object({
        host: z.string().default(''),
        port: z.number().default(ENDPOINT_DEFAULTS.smtp.port),
        secure: z.boolean().default(ENDPOINT_DEFAULTS.smtp.secure),
    }),
});
/** Project the row config (cordis.patch.yml) into the settings-schema base shape. */
export function toSettingsBase(config) {
    return {
        ...(config.provider !== undefined ? { provider: config.provider } : {}),
        ...(config.user !== undefined && config.user !== '' ? { user: config.user } : {}),
        ...(config.password !== undefined && config.password !== '' ? { password: config.password } : {}),
        ...(config.inboxFolder !== undefined && config.inboxFolder !== '' ? { inboxFolder: config.inboxFolder } : {}),
        ...(config.sendApproval !== undefined ? { sendApproval: config.sendApproval } : {}),
        ...(config.trustedRecipientsYaml !== undefined ? { trustedRecipientsYaml: config.trustedRecipientsYaml } : {}),
        ...(config.maxBodyChars !== undefined ? { maxBodyChars: config.maxBodyChars } : {}),
        ...(config.downloadDir !== undefined && config.downloadDir !== '' ? { downloadDir: config.downloadDir } : {}),
        ...(config.serverPresets !== undefined && config.serverPresets !== '' ? { serverPresets: config.serverPresets } : {}),
        ...(config.imap !== undefined ? {
            imap: {
                host: config.imap.host ?? '',
                port: config.imap.port ?? ENDPOINT_DEFAULTS.imap.port,
                secure: config.imap.secure ?? ENDPOINT_DEFAULTS.imap.secure,
            },
        } : {}),
        ...(config.smtp !== undefined ? {
            smtp: {
                host: config.smtp.host ?? '',
                port: config.smtp.port ?? ENDPOINT_DEFAULTS.smtp.port,
                secure: config.smtp.secure ?? ENDPOINT_DEFAULTS.smtp.secure,
            },
        } : {}),
    };
}
/** True for a field the draft really carries: absent, undefined and null all mean 「未设置」. */
function isSet(field) {
    return field !== undefined && field !== null;
}
/**
 * The port an endpoint object carries, or undefined when the endpoint is absent
 * or carries no port key.
 */
function endpointPort(endpoint) {
    if (endpoint === null || typeof endpoint !== 'object' || Array.isArray(endpoint))
        return undefined;
    return endpoint.port;
}
/**
 * Is this port outside 1-65535? A missing port is not a violation (「未设置」),
 * but anything present is compared loosely — exactly the `<`/`>` coercion the
 * previous `value.imap.port < 1` used, so a numeric string is still judged
 * rather than waved through.
 */
function portOutOfRange(port) {
    if (!isSet(port))
        return false;
    const n = port;
    return n < 1 || n > 65535;
}
/**
 * Project a settings value back into EmailConfig shape.
 *
 * `user` is the raw stored user section: only fields the user actually set
 * are projected, so schema defaults never shadow the row config or the
 * provider presets (choosing outlook must NOT force smtp port 465 over the
 * preset's 587). Pass `null` to project every field (draft paths).
 *
 * The value may also be *partial*: the settings page posts a draft, and the card
 * editor posts its own control bundle, from which JSON.stringify drops every key
 * it does not model — `provider` above all. A field the draft does not carry
 * means 「未设置」 and must be left out entirely: assigning `out.provider =
 * undefined` is NOT the same as omitting it, because an own key holding undefined
 * still wins in `{ ...rowConfig, ...toEmailConfig(value, null) }` and would erase
 * the row's provider (that produced 「未知的邮件服务商 undefined」 on a card whose
 * provider was plainly selected). Same normalization as toSettingsBase.
 */
export function toEmailConfig(value, user) {
    const draft = (value ?? {});
    const has = (key) => user === null || user?.[key] !== undefined;
    const out = {};
    const set = (key, field) => {
        if (isSet(field))
            out[key] = field;
    };
    // provider is the one field where '' is a *value* rather than an absence: the
    // settings page uses it for 「自定义服务器」, so it must still clear the row
    // provider even though every other unset field is now omitted.
    if (has('provider') && isSet(draft.provider)) {
        out.provider = draft.provider === '' ? undefined : draft.provider;
    }
    if (has('user'))
        set('user', draft.user);
    if (has('password'))
        set('password', draft.password);
    if (has('inboxFolder'))
        set('inboxFolder', draft.inboxFolder);
    if (has('sendApproval'))
        set('sendApproval', draft.sendApproval);
    if (has('trustedRecipientsYaml'))
        set('trustedRecipientsYaml', draft.trustedRecipientsYaml);
    if (has('maxBodyChars'))
        set('maxBodyChars', draft.maxBodyChars);
    if (has('downloadDir'))
        set('downloadDir', draft.downloadDir);
    if (has('accountsYaml'))
        set('accountsYaml', draft.accountsYaml);
    // serverPresets is intentionally NOT projected: it is UI-side metadata that
    // resolution never reads, and projecting it would put it into the resolved
    // fingerprint, so saving a preset would dispose every live IMAP connection.
    // Only a persisted blank host signals a placeholder. A schema-added blank
    // host must not erase an explicit port-only override from the raw document.
    const imapValue = user?.imap?.host !== undefined && draft.imap ? normalizeSettingsEndpoint(draft.imap, 'imap') : draft.imap;
    const imapKeys = user === null ? imapValue : user?.imap;
    if (isSet(imapKeys) && isSet(imapValue)) {
        const imap = {};
        // Empty host means "use the provider preset" — never project it, or the
        // preset gets shadowed by '' (issues #3 / #6).
        if (isSet(imapKeys.host) && isSet(imapValue.host) && imapValue.host !== '')
            imap.host = imapValue.host;
        if (isSet(imapKeys.port) && isSet(imapValue.port))
            imap.port = imapValue.port;
        if (isSet(imapKeys.secure) && isSet(imapValue.secure))
            imap.secure = imapValue.secure;
        // An empty endpoint must not erase the row's configured server during merge.
        if (Object.keys(imap).length > 0)
            out.imap = imap;
    }
    const smtpValue = user?.smtp?.host !== undefined && draft.smtp ? normalizeSettingsEndpoint(draft.smtp, 'smtp') : draft.smtp;
    const smtpKeys = user === null ? smtpValue : user?.smtp;
    if (isSet(smtpKeys) && isSet(smtpValue)) {
        const smtp = {};
        if (isSet(smtpKeys.host) && isSet(smtpValue.host) && smtpValue.host !== '')
            smtp.host = smtpValue.host;
        if (isSet(smtpKeys.port) && isSet(smtpValue.port))
            smtp.port = smtpValue.port;
        if (isSet(smtpKeys.secure) && isSet(smtpValue.secure))
            smtp.secure = smtpValue.secure;
        if (Object.keys(smtp).length > 0)
            out.smtp = smtp;
    }
    return out;
}
/**
 * Render a rejected value for an error message. The old code concatenated the
 * raw value into the sentence, which turned an absent field into the baffling
 * 「未知的邮件服务商undefined」 — a JSON form at least admits that no value was
 * there.
 */
function describeValue(value) {
    if (typeof value === 'string')
        return '"' + value + '"';
    if (value === undefined)
        return 'undefined';
    try {
        return JSON.stringify(value) ?? String(value);
    }
    catch {
        return String(value);
    }
}
/**
 * Gentle write-path validation: structural mistakes fail loudly, but an
 * incomplete account is allowed (tools report the actionable hint at call
 * time, so an unconfigured install never breaks boot).
 *
 * The value may be partial — the web route validates whatever the page posted,
 * and the card editor's own POST never carries the form fields. 「Missing」 is
 * 「未设置」 for every one of them, exactly as toEmailConfig projects them, so a
 * partial draft is validated only for the fields it actually has.
 *
 * `extraProviders` are the custom preset names in effect: the settings page's
 * provider dropdown offers them beside the 8 built-ins, so a value naming one
 * is a legal choice, not an unknown provider.
 */
export function validateSettingsValue(value, extraProviders = []) {
    const draft = (value ?? {});
    if (draft.trustedRecipientsYaml !== undefined) {
        if (typeof draft.trustedRecipientsYaml !== 'string')
            throw new Error('可信收件人规则必须为文本');
        parseRecipientPolicies(draft.trustedRecipientsYaml);
    }
    const provider = draft.provider;
    if (isSet(provider) && provider !== '' && !PROVIDER_NAMES.includes(provider) && !extraProviders.includes(provider)) {
        const names = [...PROVIDER_NAMES, ...extraProviders];
        throw new Error('未知的邮箱服务商 ' + describeValue(provider) + '，可选：' + names.join('/') + '（或留空手填 IMAP/SMTP 主机）');
    }
    const imapPort = endpointPort(draft.imap);
    if (portOutOfRange(imapPort)) {
        throw new Error('IMAP 端口必须在 1-65535 之间，收到 ' + describeValue(imapPort));
    }
    const smtpPort = endpointPort(draft.smtp);
    if (portOutOfRange(smtpPort)) {
        throw new Error('SMTP 端口必须在 1-65535 之间，收到 ' + describeValue(smtpPort));
    }
    if (isSet(draft.maxBodyChars) && (draft.maxBodyChars < 1000 || draft.maxBodyChars > 200000)) {
        throw new Error('正文截断上限必须在 1000-200000 之间，收到 ' + describeValue(draft.maxBodyChars));
    }
}
