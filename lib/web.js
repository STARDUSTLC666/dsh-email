import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMap, parseDocument } from 'yaml';
import { SETTINGS_NAMESPACE, toEmailConfig, validateSettingsValue } from './settings.js';
import { isOAuth2Account, OUTLOOK_OAUTH2_CLIENT_ID, parseAccountsYaml, parseServerPresets, presetNamesIn, PROVIDER_PRESETS, resolveEmailSettings, serializeAccountsYaml, } from './config.js';
import { clearTokenFor, getFreshAccessToken, oauth2StateOf, pollDeviceFlow, startDeviceFlow, } from './oauth2.js';
import { EmailPool, messageOf, redactCredentials } from './mail-client.js';
/** Same-origin route the browser settings section talks to. */
export const SETTINGS_ROUTE = '/_dsh/dsh-email/settings';
/** Same-origin route serving the whale-girl courier image to the widget. */
export const WHALE_ASSET_ROUTE = '/_dsh/dsh-email/assets/whale';
const SKIN_PACKAGES = [
    '@dsh-external/dsh-client-ui-skin-orca-link',
    '@dsh-external/dsh-client-ui-skin-maid-atelier',
];
const WHALE_CREDIT = '鲸鱼娘：一创 上善（pixiv 62155430）· 二创 Small-tailqwq / dsh-deep-whale · CC BY-NC-SA 4.0（非商业）';
/** Credit shown with the bundled fallback artwork (community fan character). */
const FALLBACK_CREDIT = '鲸鱼娘：社区同人形象，版权归原作者，仅供个人非商业使用；如有异议请提 Issue 移除';
/** Endpoint defaults for a card whose account (and preset) names no host yet. */
const IMAP_FALLBACK = { host: '', port: 993, secure: true };
const SMTP_FALLBACK = { host: '', port: 465, secure: true };
/**
 * One endpoint for the card, resolved from the provider preset: a preset value
 * wins where it has one, and a placeholder closes whatever is still missing.
 * Empty is a legitimate value — the card is the draft, not a validated config.
 */
function endpointOf(preset, fallback) {
    const host = typeof preset?.host === 'string' ? preset.host : fallback.host;
    const port = typeof preset?.port === 'number' ? preset.port : fallback.port;
    const secure = typeof preset?.secure === 'boolean' ? preset.secure : fallback.secure;
    return { host, port, secure };
}
/**
 * The endpoints a card shows, merged the way config resolution merges them: the
 * account's own `host`/`port`/`secure` win over the preset's, because those are
 * what the pool actually dials. A card that showed only the preset would name a
 * host the plugin never connects to.
 *
 * The account mapping comes straight from user YAML, so every value is narrowed
 * by type before it is merged — spreading a stray string or array would produce
 * index keys rather than endpoints. A field of the wrong type is ignored here
 * exactly as `endpointOf` ignores one in a preset.
 */
function accountEndpoint(preset, own, fallback) {
    const declared = own !== null && typeof own === 'object' && !Array.isArray(own) ? own : {};
    return endpointOf({
        host: typeof declared.host === 'string' && declared.host !== '' ? declared.host : preset?.host,
        port: typeof declared.port === 'number' ? declared.port : preset?.port,
        secure: typeof declared.secure === 'boolean' ? declared.secure : preset?.secure,
    }, fallback);
}
/**
 * Build the account cards for an accounts mapping. Parse-only by contract: a
 * half-filled account is exactly what the user is typing, so it must still
 * render as a card. Nothing here resolves, validates or touches the network —
 * an unknown provider degrades that one card's endpoints, never the list.
 *
 * The endpoints are read from the *preset* only: an account stores a provider
 * id, so a stale hand-written `imap.host` in an existing YAML must not show up
 * in the editor as if it still drove the connection.
 *
 * `tokens` is the OAuth2 login state, looked up once per snapshot rather than
 * per card: the token file is read from disk, and a card is rendered on every
 * keystroke of the settings editor.
 */
function buildAccountCards(raw, defaultAccount, presets, tokens = () => ({ state: 'none' })) {
    const list = [];
    for (const [name, value] of Object.entries(raw)) {
        const account = value !== null && typeof value === 'object' && !Array.isArray(value)
            ? value
            : {};
        const providerName = typeof account.provider === 'string' && account.provider !== '' ? account.provider : undefined;
        const preset = providerName === undefined ? undefined : providerOf(providerName, presets);
        const imap = accountEndpoint(preset?.imap, account.imap, IMAP_FALLBACK);
        // The same verdict resolution reaches: the provider, or the Exchange Online
        // host a custom preset or a hand-written endpoint points at. An account that
        // pins `authKind` in its YAML outranks the derivation, exactly as it does in
        // config resolution — a card that disagreed with the pool would offer an
        // OAuth2 login for a mailbox that authenticates with a password.
        const pinned = typeof account.authKind === 'string' ? account.authKind.trim().toLowerCase() : '';
        const authKind = pinned === 'oauth2' || pinned === 'password'
            ? pinned
            : isOAuth2Account(providerName, imap.host) ? 'oauth2' : 'password';
        const user = typeof account.user === 'string' ? account.user : '';
        // A public-client id is not a secret, so unlike the password it is handed
        // back for the editor to prefill: an account that names no application logs
        // in with the built-in one, and the card has to say which that is.
        const clientId = typeof account.clientId === 'string' ? account.clientId.trim() : '';
        const oauthDefaultClientId = authKind === 'oauth2' && clientId === '' ? OUTLOOK_OAUTH2_CLIENT_ID : '';
        // The display name and the login user are not secrets, so — like clientId —
        // the card hands them back for the editor to prefill. A separate login
        // password is a secret and only ever reported as a boolean.
        const senderName = typeof account.senderName === 'string' ? account.senderName.trim() : '';
        const authUser = typeof account.authUser === 'string' ? account.authUser.trim() : '';
        const oauth = authKind === 'oauth2' ? tokens(name, user) : { state: 'none' };
        list.push({
            name,
            provider: providerName,
            ...(preset?.label !== undefined && preset.label !== '' ? { providerLabel: preset.label } : {}),
            user,
            hasPassword: typeof account.password === 'string' && account.password !== '',
            authKind,
            ...(pinned === 'oauth2' || pinned === 'password' ? { authKindDeclared: pinned } : {}),
            ...(clientId !== '' ? { clientId } : {}),
            ...(oauthDefaultClientId !== '' ? { oauthDefaultClientId } : {}),
            ...(senderName !== '' ? { senderName } : {}),
            ...(authUser !== '' ? { authUser } : {}),
            ...(typeof account.authPassword === 'string' && account.authPassword !== '' ? { hasAuthPassword: true } : {}),
            oauthState: oauth.state,
            ...(oauth.user !== undefined ? { oauthUser: oauth.user } : {}),
            imap,
            smtp: accountEndpoint(preset?.smtp, account.smtp, SMTP_FALLBACK),
            inboxFolder: typeof account.inboxFolder === 'string' && account.inboxFolder !== '' ? account.inboxFolder : 'INBOX',
            isDefault: name === defaultAccount,
        });
    }
    return list;
}
/**
 * Parse the custom preset table. A broken text degrades to "no custom presets"
 * and reports why: the account cards must keep rendering so the user can fix
 * the YAML, and the writer must reach the same verdict as the reader — a name
 * that exists only in an unparseable table is not a name.
 */
function customPresetsOf(serverPresets) {
    try {
        return { custom: parseServerPresets(serverPresets ?? '') };
    }
    catch (error) {
        return { custom: {}, error: messageOf(error, 'serverPresets 解析失败') };
    }
}
/** The 8 built-in presets plus whatever the user defined in serverPresets. */
function presetsSnapshot(serverPresets) {
    const builtin = {};
    for (const [name, preset] of Object.entries(PROVIDER_PRESETS)) {
        builtin[name] = { imap: { ...preset.imap }, smtp: { ...preset.smtp } };
    }
    return { builtin, ...customPresetsOf(serverPresets) };
}
/**
 * Resolve a provider name to its preset, in the same order resolveAccount()
 * uses: the 8 built-ins first, then the custom serverPresets. A name that
 * matches neither (or an inherited Object member) has no preset.
 */
function providerOf(name, custom) {
    if (Object.prototype.hasOwnProperty.call(PROVIDER_PRESETS, name))
        return PROVIDER_PRESETS[name];
    return Object.prototype.hasOwnProperty.call(custom, name) ? custom[name] : undefined;
}
/**
 * Decide which account is the default, mirroring resolveEmailSettings' order
 * (explicit default, then a lone account, then the YAML's own defaultAccount,
 * then an account literally named "default"). Returns the overall error for a
 * mapping that cannot be adjudicated at all.
 */
function adjudicateAccounts(raw, yamlDefault, rowDefault) {
    const names = Object.keys(raw);
    if (names.length === 0) {
        // No accounts in the YAML: nothing to adjudicate, but a row-level default
        // is still worth reporting.
        const row = (rowDefault ?? '').trim();
        return row === '' ? {} : { defaultAccount: row };
    }
    const explicit = (rowDefault ?? '').trim();
    if (explicit !== '') {
        if (!names.includes(explicit)) {
            return { error: `defaultAccount "${explicit}" 不存在，可用账号：${names.join('、')}` };
        }
        return { defaultAccount: explicit };
    }
    if (names.length === 1)
        return { defaultAccount: names[0] };
    if (yamlDefault !== undefined && names.includes(yamlDefault))
        return { defaultAccount: yamlDefault };
    if (names.includes('default'))
        return { defaultAccount: 'default' };
    return { error: `配置了多个账号（${names.join('、')}），请设置 defaultAccount 指定默认账号` };
}
/**
 * True for a document that carries no mapping at all: blank text, or nothing
 * but comments. parseAccountsYaml rejects both, but for the editor "empty" is
 * a legitimate state ("no accounts yet"), not a syntax error.
 */
function isBlankAccountsText(text) {
    return text.split('\n').every(line => {
        const trimmed = line.trim();
        return trimmed === '' || trimmed.startsWith('#');
    });
}
/**
 * Parse accountsYaml text into cards. Never throws: the editor calls this on
 * every keystroke, so a half-typed document is the normal case and comes back
 * as an error field rather than as an HTTP failure.
 *
 * The parsed mapping stays inside this function. It carries plaintext
 * passwords, and the editor only ever consumes the cards — which project
 * `hasPassword` instead of the secret — so no raw account leaves here.
 */
function readAccountsDraft(text, presets, rowDefault, tokens = () => ({ state: 'none' })) {
    if (isBlankAccountsText(text)) {
        const { defaultAccount, error } = adjudicateAccounts({}, undefined, rowDefault);
        return { ...(defaultAccount !== undefined ? { defaultAccount } : {}), list: [], ...(error !== undefined ? { error } : {}) };
    }
    let raw = {};
    let yamlDefault;
    try {
        const parsed = parseAccountsYaml(text);
        raw = parsed.map;
        yamlDefault = parsed.defaultAccount;
    }
    catch (caught) {
        // No mapping could be read: report it and hand back an empty draft.
        return { list: [], error: messageOf(caught, 'accountsYaml 解析失败') };
    }
    const verdict = adjudicateAccounts(raw, yamlDefault, rowDefault);
    return {
        ...(verdict.defaultAccount !== undefined ? { defaultAccount: verdict.defaultAccount } : {}),
        list: buildAccountCards(raw, verdict.defaultAccount, presets, tokens),
        ...(verdict.error !== undefined ? { error: verdict.error } : {}),
    };
}
/**
 * The OAuth2 login state lookup for a card list. The token file is read once
 * and answered from memory afterwards: the editor calls parseAccounts on every
 * keystroke, and one disk read per card would be paid on each of them.
 */
function tokenLookup() {
    const cache = new Map();
    return (name, user) => {
        const key = name + '\u0000' + user;
        const hit = cache.get(key);
        if (hit !== undefined)
            return hit;
        const fresh = oauth2StateOf(name, user);
        cache.set(key, fresh);
        return fresh;
    };
}
/** The raw key a Pair is stored under (an unquoted `163:` parses as a number). */
function rawKeyOf(pair) {
    const key = pair.key;
    return key !== null && typeof key === 'object' && 'value' in key ? key.value : key;
}
/** A Pair's key as text, so lookups match `163:` and `"163":` alike. */
function keyTextOf(pair) {
    return String(rawKeyOf(pair));
}
/**
 * Write one known account field: an empty or absent value deletes the key
 * instead of storing '' (a stored provider: '' resolves as 「provider "" 未知」).
 */
function writeField(node, key, value) {
    if (value === undefined || value === '') {
        node.delete(key);
        return;
    }
    node.set(key, value);
}
/** A scalar/sequence value cannot carry account fields; swap in a map. */
function ensureMap(doc, node, key) {
    const existing = node.get(key, true);
    if (isMap(existing))
        return existing;
    const fresh = doc.createNode({});
    // Set under the *stored* key, not its text form: `163:` parses as the number
    // 163, and set('163', …) would add a second, quoted key beside it.
    node.set(key, fresh);
    return fresh;
}
/**
 * Wash the endpoint fields out of one stored imap/smtp node.
 *
 * An account stores a provider id; host/port/secure are expanded from the
 * preset at resolution time, so a hand-written copy is stale by definition and
 * must not survive an edit. Only those three keys go: an advanced key the card
 * does not model (socketTimeoutMs, connectionTimeoutMs) is not an endpoint and
 * stays exactly where it was. An endpoint map left with nothing in it is
 * removed, so the account keeps only the fields that still mean something.
 */
function washEndpoint(account, key) {
    const target = account.get(key, true);
    if (!isMap(target))
        return;
    for (const field of ['host', 'port', 'secure'])
        target.delete(field);
    if (target.items.length === 0)
        account.delete(key);
}
/**
 * The `provider` value that may be written back to accountsYaml.
 *
 * The account stores a provider *id* and nothing else, so a name the provider
 * table can resolve is exactly what belongs in the document: a built-in preset,
 * or a custom `serverPresets` entry (resolveAccount() consults built-ins first
 * and then the custom table). Anything else — a name the user typed that no
 * preset defines, '' — is dropped, because persisting it would only produce
 * 「账号 "work" 的 provider "corp" 未知」 on the very next connection.
 *
 * `customNames` is the set of preset names in effect for this request. The card
 * editor posts its own control bundle, and an older front end sends no
 * serverPresets at all: the empty set then reproduces the previous
 * "built-ins only" behaviour rather than inventing names.
 *
 * hasOwnProperty, not a plain lookup: `constructor`/`toString` must not be
 * mistaken for preset names through the prototype chain.
 */
function persistedProvider(provider, customNames) {
    if (typeof provider !== 'string' || provider === '')
        return undefined;
    if (Object.prototype.hasOwnProperty.call(PROVIDER_PRESETS, provider))
        return provider;
    return customNames.has(provider) ? provider : undefined;
}
/**
 * Mirror of config.ts' normalizeAccountForYaml for the card shape: provider ''
 * disappears (writing it back resolves as 「provider "" 未知」) and a numeric
 * password becomes a string (YAML would otherwise read back a number).
 *
 * The card's `imap`/`smtp` are deliberately *not* written: an account stores a
 * provider id, and the endpoints are expanded from the preset table at
 * resolution time. Writing them back would freeze a stale copy of a preset the
 * user may later edit.
 *
 * `inheritedPassword` is the value stored in the source YAML for this account.
 * It is used only when the card carries no password at all — see the three-state
 * contract on AccountCardInput: the card omits the field whenever the editor has
 * nothing to say about it, which must leave the stored secret untouched.
 */
function normalizeCardForYaml(card, customNames, inheritedPassword, inheritedAuthPassword) {
    const out = {};
    const provider = persistedProvider(card.provider, customNames);
    if (provider !== undefined)
        out.provider = provider;
    if (card.user !== undefined)
        out.user = card.user;
    if (card.password === undefined) {
        // 未提供 = 保持原样，且原样包括「原来是什么类型」：数字密码原样留下数字。
        if (inheritedPassword !== undefined)
            out.password = inheritedPassword;
    }
    else if (card.password === '') {
        // '' = 明确清除：不写 password 键。
    }
    else {
        out.password = typeof card.password === 'number' || typeof card.password === 'boolean'
            ? String(card.password)
            : card.password;
    }
    // Same three-state contract as the in-place writer: a card that does not
    // model the field says nothing about it, '' clears it, a value is written
    // trimmed. Losing this on the degraded path would silently log the account
    // out of its application.
    if (card.clientId !== undefined) {
        const clientId = String(card.clientId).trim();
        if (clientId !== '')
            out.clientId = clientId;
    }
    // '' means「back to automatic」, which is the absence of the key.
    if (card.authKind !== undefined) {
        const authKind = String(card.authKind).trim().toLowerCase();
        if (authKind !== '')
            out.authKind = authKind;
    }
    if (card.inboxFolder !== undefined)
        out.inboxFolder = card.inboxFolder;
    if (card.senderName !== undefined) {
        const senderName = String(card.senderName).trim();
        if (senderName !== '')
            out.senderName = senderName;
    }
    if (card.authUser !== undefined) {
        const authUser = String(card.authUser).trim();
        if (authUser !== '')
            out.authUser = authUser;
    }
    if (card.authPassword === undefined) {
        // Same contract as password: a card that says nothing must not delete it.
        if (inheritedAuthPassword !== undefined)
            out.authPassword = inheritedAuthPassword;
    }
    else if (card.authPassword !== '') {
        out.authPassword = String(card.authPassword);
    }
    return out;
}
/** One secret key stored in the source YAML for one account, if it is there. */
function storedSecretOf(raw, name, key) {
    const account = raw[name];
    if (account === null || typeof account !== 'object' || Array.isArray(account))
        return { present: false, value: undefined };
    if (!Object.prototype.hasOwnProperty.call(account, key))
        return { present: false, value: undefined };
    return { present: true, value: account[key] };
}
function storedPasswordOf(raw, name) {
    return storedSecretOf(raw, name, 'password');
}
function storedAuthPasswordOf(raw, name) {
    return storedSecretOf(raw, name, 'authPassword');
}
/**
 * Fallback writer: loses comments but keeps the semantics the cards describe.
 *
 * `source` is the draft being replaced, re-read only to recover passwords the
 * cards do not carry — a card never holds a plaintext password, so without this
 * every degraded save would silently drop the stored secrets. The read is
 * best-effort by nature: this path is reached precisely when the document could
 * not be edited in place, and an unparseable document cannot lend its passwords
 * back. When that happens and a card has nothing to say about its password, the
 * secret is gone and `passwordsDropped` says so.
 */
function fallbackSerialize(cards, defaultAccount, source, customNames) {
    let stored;
    try {
        stored = parseAccountsYaml(source).map;
    }
    catch {
        stored = undefined;
    }
    let passwordsDropped = false;
    const raw = {};
    for (const card of cards) {
        const name = card.name;
        let inherited;
        let inheritedAuthPassword;
        if (stored === undefined) {
            // Nothing could be read back: a silent card may be losing a real secret.
            if (card.password === undefined)
                passwordsDropped = true;
        }
        else {
            const { present, value } = storedPasswordOf(stored, name);
            if (present)
                inherited = value;
            const auth = storedAuthPasswordOf(stored, name);
            if (auth.present)
                inheritedAuthPassword = auth.value;
        }
        raw[name] = normalizeCardForYaml(card, customNames, inherited, inheritedAuthPassword);
    }
    return {
        accountsYaml: serializeAccountsYaml(raw, defaultAccount),
        ...(passwordsDropped ? { passwordsDropped: true } : {}),
    };
}
/**
 * Rewrite the accountsYaml draft from the card list.
 *
 * The card list is the complete desired set: an account key the cards do not
 * name is removed, a name the document does not have is created, and a renamed
 * card therefore deletes the old key and adds the new one. Editing happens on
 * the parsed Document so comments survive and unknown keys (socketTimeoutMs,
 * …) stay exactly where they were.
 */
function serializeAccountsDraft(source, cards, defaultAccount, customNames) {
    const doc = parseDocument(source);
    // parseDocument never throws — a broken document surfaces as doc.errors, and
    // String(doc) then refuses to run at all. Degrade to the stringify path.
    if (doc.errors.length > 0)
        return { ...fallbackSerialize(cards, defaultAccount, source, customNames), commentsDropped: true };
    let root;
    if (doc.contents === null) {
        root = doc.createNode({});
        doc.contents = root;
    }
    else if (isMap(doc.contents)) {
        root = doc.contents;
    }
    else {
        // A sequence or scalar document cannot carry accounts at all.
        return { ...fallbackSerialize(cards, defaultAccount, source, customNames), commentsDropped: true };
    }
    const desired = new Set(cards.map(card => card.name));
    if (desired.size !== cards.length)
        throw new Error('账号名重复，不能覆盖已有账号');
    // Rename the YAML node before filtering, retaining secrets and advanced keys.
    // originalName may already have been renamed by a preceding auto-save.
    const renameTargets = new Set();
    for (const card of cards) {
        const from = card.originalName;
        const to = card.name;
        if (!from || from === to || !root.has(from))
            continue;
        if (root.has(to) || renameTargets.has(from))
            throw new Error('账号名已存在，不能覆盖已有账号');
        const pair = root.items.find(item => keyTextOf(item) === from);
        if (pair !== undefined) {
            pair.key = doc.createNode(to);
            renameTargets.add(from);
        }
    }
    const seen = new Set();
    for (const pair of [...root.items]) {
        const name = keyTextOf(pair);
        if (name === 'defaultAccount')
            continue;
        // Remove accounts the cards dropped, and collapse a duplicate spelling
        // (`163:` and `"163":`) onto a single key.
        if (!desired.has(name) || seen.has(name)) {
            root.delete(rawKeyOf(pair));
            continue;
        }
        seen.add(name);
    }
    for (const card of cards) {
        const name = card.name;
        const pair = root.items.find(item => keyTextOf(item) === name);
        let account;
        if (pair === undefined) {
            account = doc.createNode({});
            root.set(name, account);
        }
        else {
            // Reuse the stored key node (163 vs "163") so the name keeps its spelling.
            account = ensureMap(doc, root, rawKeyOf(pair));
        }
        // The provider is the account's whole connection identity: a resolvable
        // preset name is written, anything else deletes the key. Endpoints are
        // never written — a stored copy is washed out below instead.
        const previousProvider = account.get('provider');
        const nextProvider = persistedProvider(card.provider, customNames);
        writeField(account, 'provider', nextProvider);
        writeField(account, 'user', card.user);
        // senderName / authUser are plain three-state fields (undefined = 保持原样,
        // '' = 清除, 非空 = 写入) — writeField already implements exactly that.
        // An undefined field means "this card says nothing" — writeField would read
        // that as「delete」, so the guard has to live here, not inside it.
        if (card.senderName !== undefined)
            writeField(account, 'senderName', String(card.senderName).trim());
        if (card.authUser !== undefined)
            writeField(account, 'authUser', String(card.authUser).trim());
        // authPassword is a secret and follows the password contract verbatim: the
        // card never carries the plaintext, so an omitted field must leave the
        // stored key — value, position and comment — untouched.
        if (card.authPassword === undefined) {
            // 未提供 = 保持原样：什么都不写。
        }
        else if (card.authPassword === '') {
            account.delete('authPassword');
        }
        else {
            account.set('authPassword', String(card.authPassword));
        }
        // Password is three-state, unlike every other field: the card is never given
        // the plaintext (snapshot exposes hasPassword only), so an omitted password
        // means "the editor has nothing to say" and the stored key must survive
        // untouched — value, position and comment. Only an explicit '' clears it.
        if (card.password === undefined) {
            // 未提供 = 保持原样：什么都不写。
        }
        else if (card.password === '') {
            account.delete('password');
        }
        else {
            // Same coercion as normalizeAccountForYaml: a numeric password must be
            // written as a string, or YAML reads it back as a number.
            account.set('password', typeof card.password === 'number' || typeof card.password === 'boolean'
                ? String(card.password)
                : card.password);
        }
        // clientId is three-state for the same reason: a card that does not model
        // the field — a password account, an older editor — has nothing to say about
        // it, and a value the user typed into the YAML must survive an unrelated
        // save. Only an explicit '' clears it.
        if (card.clientId === undefined) {
            // 未提供 = 保持原样：什么都不写。
        }
        else {
            writeField(account, 'clientId', String(card.clientId).trim());
        }
        // Same three states, and here '' is meaningful rather than merely empty: it
        // takes the pin back off, returning the account to the derivation.
        if (card.authKind !== undefined) {
            writeField(account, 'authKind', String(card.authKind).trim().toLowerCase());
        }
        writeField(account, 'inboxFolder', card.inboxFolder);
        // Endpoints are never written by a card: they come from the preset, or from
        // what the account already stores. They are washed only when the provider
        // actually changed, because that is the one case where the stored copy is
        // stale by definition — it belongs to the previous provider. Washing on
        // every save would repoint a self-hosted account at the preset merely
        // because the user opened this panel.
        if (nextProvider !== undefined && nextProvider !== previousProvider) {
            washEndpoint(account, 'imap');
            washEndpoint(account, 'smtp');
        }
    }
    if (defaultAccount !== '')
        root.set('defaultAccount', defaultAccount);
    else
        root.delete('defaultAccount');
    // No accounts left: '' (never '{}'). resolveEmailSettings decides "is the
    // YAML authoritative" with .trim(), so an empty mapping must stay empty.
    const accountKeys = root.items.filter(pair => keyTextOf(pair) !== 'defaultAccount').length;
    if (accountKeys === 0)
        return { accountsYaml: '' };
    return { accountsYaml: String(doc) };
}
let whaleCache;
function pickFromDir(dir) {
    let names = [];
    try {
        names = readdirSync(dir);
    }
    catch {
        return null;
    }
    const images = names.filter(name => /\.(webp|png|jpe?g)$/i.test(name));
    if (images.length === 0)
        return null;
    const preferred = images.find(name => /^light-hero/i.test(name)) ?? images.find(name => /^light-active/i.test(name));
    return join(dir, preferred ?? images[0]);
}
function contentTypeOf(file) {
    if (/\.webp$/i.test(file))
        return 'image/webp';
    if (/\.jpe?g$/i.test(file))
        return 'image/jpeg';
    return 'image/png';
}
/**
 * Locate the whale-girl artwork at runtime. Skin art is never bundled: it is
 * CC BY-NC-SA 4.0, so dsh-email only serves it from the user's own installed
 * dsh-deep-whale skin package (with the attribution chain shown in the
 * widget). Without the skin, a bundled community whale-girl artwork is
 * served with its own credit line (copyright stays with the original author;
 * personal non-commercial use, removed on request via issue).
 */
function findWhaleAsset() {
    if (whaleCache !== undefined)
        return whaleCache;
    whaleCache = null;
    const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
    const roots = [process.cwd(), dirname(packageDir)];
    for (const root of roots) {
        for (const pkg of SKIN_PACKAGES) {
            for (const base of [join(root, 'node_modules', pkg, 'assets'), join(root, pkg, 'assets')]) {
                const file = pickFromDir(base);
                if (file !== null) {
                    whaleCache = { file, contentType: contentTypeOf(file), skin: true, credit: WHALE_CREDIT };
                    return whaleCache;
                }
            }
        }
    }
    const fallback = join(packageDir, 'assets', 'whale-fallback.png');
    if (existsSync(fallback)) {
        whaleCache = { file: fallback, contentType: 'image/png', skin: false, credit: FALLBACK_CREDIT };
        return whaleCache;
    }
    return whaleCache;
}
/**
 * The account names a settings value carries, or `undefined` when the document
 * could not be read.
 *
 * Three states on purpose. An empty text really does mean "no accounts", but an
 * unparseable one means "no idea" — and a caller that confused the two would
 * treat every account as deleted and wipe their stored OAuth2 tokens.
 */
function accountNamesOf(value) {
    const text = typeof value?.accountsYaml === 'string' ? value.accountsYaml : '';
    if (text.trim() === '')
        return new Set();
    try {
        return new Set(Object.keys(parseAccountsYaml(text).map));
    }
    catch {
        return undefined;
    }
}
/** Hostnames a browser may legitimately reach this route through. */
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
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
export function hostVerdict(host) {
    if (typeof host !== 'string' || host.trim() === '')
        return undefined;
    const text = host.trim().toLowerCase();
    // An IPv6 literal arrives bracketed — `[::1]:3080` — where splitting on the
    // colon would leave「[」and refuse a legitimate way to reach the panel.
    const name = text.startsWith('[') ? text.slice(0, text.indexOf(']') + 1) : text.split(':')[0];
    return LOCAL_HOSTNAMES.has(name) ? undefined : `host "${host}" is not a localhost name`;
}
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
export function postVerdict(headers) {
    const contentType = String(headers['content-type'] ?? '');
    if (!contentType.toLowerCase().includes('application/json')) {
        return { status: 415, message: 'dsh-email settings route accepts application/json only' };
    }
    const origin = headers.origin;
    if (typeof origin === 'string' && origin.trim() !== '') {
        let url;
        try {
            url = new URL(origin);
        }
        catch {
            url = undefined;
        }
        if (url !== undefined && (url.protocol === 'http:' || url.protocol === 'https:')
            && !LOCAL_HOSTNAMES.has(url.hostname.toLowerCase())) {
            return { status: 403, message: `origin "${origin}" is not allowed to write dsh-email settings` };
        }
    }
    const site = headers['sec-fetch-site'];
    if (typeof site === 'string' && site !== '' && site !== 'same-origin' && site !== 'none') {
        return { status: 403, message: `a ${site} request may not write dsh-email settings` };
    }
    return undefined;
}
/**
 * Browser-facing backend: snapshot the settings namespace, save it with
 * optimistic concurrency, and test a draft account over a live IMAP login.
 */
export class EmailSettingsBackend {
    ctx;
    scope;
    rowConfig;
    constructor(ctx, scope, rowConfig) {
        this.ctx = ctx;
        this.scope = scope;
        this.rowConfig = rowConfig;
    }
    /** Wired by apply(): the email_watch core; 'web' keeps its own cursor scope. */
    watchImpl;
    userSection() {
        const descriptor = (this.ctx.settings.describe?.() ?? []).find((row) => row.ns === SETTINGS_NAMESPACE);
        return descriptor?.user;
    }
    /** Effective config for the stored value (row + user-set fields only). */
    effectiveStored() {
        const stored = this.scope.get();
        const merged = { ...this.rowConfig, ...toEmailConfig(stored, this.userSection()) };
        // toEmailConfig drops serverPresets — it must never enter the fingerprint —
        // but resolution needs it as a provider lookup source. The scope value
        // already resolves row-vs-user precedence for it, so it is re-added as-is.
        return { ...merged, ...(typeof stored?.serverPresets === 'string' ? { serverPresets: stored.serverPresets } : {}) };
    }
    async snapshot() {
        const descriptor = (this.ctx.settings.describe?.() ?? []).find((row) => row.ns === SETTINGS_NAMESPACE);
        const value = this.scope.get();
        const whale = findWhaleAsset();
        const presets = presetsSnapshot(value.serverPresets);
        // The cards describe the *effective* accountsYaml — the same text the
        // advanced editor shows, and the same source the accounts field reads.
        const effective = this.effectiveStored();
        const draft = readAccountsDraft(effective.accountsYaml ?? '', presets.custom, effective.defaultAccount, tokenLookup());
        return {
            settings: {
                value,
                revision: descriptor?.revision ?? 0,
                applies: descriptor?.applies ?? 'live',
            },
            writable: this.ctx.settings.writable !== false,
            accounts: [...(this.effectiveAccounts().keys())],
            accountsDetail: {
                ...(draft.defaultAccount !== undefined ? { defaultAccount: draft.defaultAccount } : {}),
                list: draft.list,
                ...(draft.error !== undefined ? { error: draft.error } : {}),
            },
            presets,
            whale: whale === null
                ? { url: '', skin: false, credit: '' }
                : { url: WHALE_ASSET_ROUTE, skin: whale.skin, credit: whale.credit },
        };
    }
    effectiveAccounts() {
        try {
            return resolveEmailSettings(this.effectiveStored()).accounts;
        }
        catch {
            return new Map();
        }
    }
    async save(value, expectedRevision) {
        if (this.ctx.settings.writable === false)
            throw new Error('settings provider is read-only');
        // The provider dropdown offers the custom preset names, so a value naming
        // one of them is a legal choice rather than an unknown provider.
        validateSettingsValue(value, presetNamesIn(value?.serverPresets ?? this.scope.get()?.serverPresets));
        const before = accountNamesOf(this.scope.get());
        await this.ctx.settings.replace(SETTINGS_NAMESPACE, value, expectedRevision);
        // A deleted account must not leave its refresh token behind: the store is
        // keyed by account name, so the credential of a mailbox that is no longer
        // configured would sit on disk, and a later account reusing that name would
        // inherit it. Only once the write has committed — a draft, or a 409, must
        // not cost anybody their login. And never on an unreadable document: not
        // knowing the new account list is not the same as knowing it is empty.
        const after = accountNamesOf(value);
        if (before !== undefined && after !== undefined) {
            for (const name of before) {
                if (!after.has(name))
                    clearTokenFor(name);
            }
        }
        return this.snapshot();
    }
    /**
     * Test one account (by name, defaulting to the draft's default account) over
     * a live IMAP login. Returns the endpoint it dialled so the panel can show
     * what was actually tried — including on failure.
     */
    async test(value, accountName) {
        validateSettingsValue(value, presetNamesIn(value?.serverPresets ?? this.scope.get()?.serverPresets));
        // null projects the complete draft: test the form as the user typed it.
        // serverPresets rides along as the provider lookup source, exactly as it
        // does for the stored settings (it never enters the resolved fingerprint).
        const draft = toEmailConfig(value, null);
        const presets = value?.serverPresets ?? this.scope.get()?.serverPresets;
        const settings = resolveEmailSettings({
            ...this.rowConfig,
            ...draft,
            ...(typeof presets === 'string' ? { serverPresets: presets } : {}),
        });
        const requested = typeof accountName === 'string' && accountName.trim() !== '' ? accountName.trim() : '';
        const available = [...settings.accounts.keys()];
        const name = requested !== '' ? requested : settings.defaultAccount;
        const cfg = settings.accounts.get(name);
        if (cfg === undefined) {
            throw new Error(`未知账号 "${name}"，可用：${available.join('、')}`);
        }
        const target = { account: name, imapHost: cfg.imap.host, imapPort: cfg.imap.port };
        // An OAuth2 account has no password to check: without a token there is
        // nothing to dial with, and a failed dial would only say so less clearly.
        if (cfg.authKind === 'oauth2') {
            try {
                await getFreshAccessToken(name, cfg);
            }
            catch (error) {
                throw new Error(messageOf(error, '尚未登录：请先在设置页完成设备码登录'));
            }
        }
        const pool = new EmailPool(settings);
        try {
            const started = Date.now();
            await pool.withImap(name, null, async () => 'connected');
            return { ok: true, ms: Date.now() - started, ...target };
        }
        catch (error) {
            // imapflow reports failed LOGIN as a bare "Command failed"; surface an
            // actionable hint instead of the opaque message. The server's own text is
            // redacted first: a refused authentication string is echoed verbatim by
            // many servers, and for XOAUTH2 that blob carries the access token.
            const raw = redactCredentials(messageOf(error, 'unknown error'));
            const lower = raw.toLowerCase();
            if (lower.includes('command failed') || lower.includes('authentication') || lower.includes('login')) {
                throw new Error(cfg.authKind === 'oauth2'
                    ? '邮箱登录失败：请在设置页重新完成设备码登录（' + raw + '）'
                    : '邮箱登录失败：请检查邮箱地址与授权码（' + raw + '）');
            }
            throw error;
        }
        finally {
            pool.dispose();
        }
    }
    /**
     * Resolve one named account of the *stored* settings — the same accounts the
     * tools and the card list see. A login is not a draft operation: the settings
     * page saves the card before it starts one, so the account being logged into
     * is by definition already persisted.
     */
    oauthAccount(name, action) {
        const wanted = typeof name === 'string' ? name.trim() : '';
        if (wanted === '')
            throw new Error(action + ' 需要 account 参数（账号名）');
        let settings;
        try {
            settings = resolveEmailSettings(this.effectiveStored());
        }
        catch (error) {
            throw new Error(messageOf(error, '邮箱账号未配置'));
        }
        const cfg = settings.accounts.get(wanted);
        if (cfg === undefined) {
            throw new Error('未知账号 "' + wanted + '"，可用：' + [...settings.accounts.keys()].join('、'));
        }
        if (cfg.authKind !== 'oauth2') {
            // The card only offers the login button on an OAuth2 account; reaching
            // here means the page is stale or the provider was just changed.
            throw new Error('账号 "' + wanted + '" 不需要设备码登录：只有 outlook（Exchange Online）账号使用 OAuth2');
        }
        return { name: wanted, cfg };
    }
    /**
     * Start (or report) the device-code login for one OAuth2 account.
     *
     * An account that already holds a token answers `already` — the card shows
     * 「已登录」and there is no second code to hand out. Otherwise the authority's
     * device code is returned verbatim: url = verification_uri, code = user_code,
     * and both interval and expires_in in seconds, which is the unit the page
     * schedules its polling with.
     */
    async oauthLogin(name) {
        try {
            const { name: account, cfg } = this.oauthAccount(name, 'oauthLogin');
            // Same verdict the card renders: a token belonging to a different
            // address is not a login for this account, so it starts a fresh flow.
            const state = oauth2StateOf(account, cfg.user, cfg.clientId ?? '');
            if (state.state === 'logged-in')
                return { ok: true, status: 'already' };
            const start = await startDeviceFlow(account, cfg);
            return {
                ok: true,
                status: 'pending',
                url: start.url,
                code: start.code,
                interval: start.interval,
                expires_in: start.expiresIn,
            };
        }
        catch (error) {
            return { ok: false, message: messageOf(error, '登录失败：请稍后重试') };
        }
    }
    /**
     * One poll of an in-flight device-code login.
     *
     * `authorization_pending` is the ordinary answer for as long as the user has
     * not finished in the browser, so it is reported as a state rather than an
     * error: only a refused or expired flow comes back as ok:false.
     */
    async oauthPoll(name) {
        try {
            const { name: account } = this.oauthAccount(name, 'oauthPoll');
            const result = await pollDeviceFlow(account);
            if (result.status === 'pending')
                return { ok: true, status: 'pending' };
            return { ok: true, status: 'ok', user: result.user };
        }
        catch (error) {
            // Every failure of a poll is a login failure the user has to see, so it
            // leaves as the flat { ok:false, message } the page renders.
            return { ok: false, message: messageOf(error, '登录失败：请稍后重试') };
        }
    }
    responseJson(res, status, body) {
        const bytes = Buffer.from(JSON.stringify(body));
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Length', String(bytes.length));
        res.setHeader('Cache-Control', 'no-store');
        res.writeHead(status);
        res.end(bytes);
    }
    async handle(req, res) {
        // Localhost-only: the snapshot carries the stored authorization code. If a
        // deployment binds the webserver to 0.0.0.0, this route must never leak it
        // to the LAN.
        const remote = String(req.socket?.remoteAddress ?? '');
        if (remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1') {
            this.responseJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'dsh-email settings route is localhost-only' } });
            return;
        }
        // Localhost is where the packets came from, not which name the browser thinks
        // it reached: a rebound domain resolves to 127.0.0.1 and would otherwise read
        // the snapshot, `accountsYaml` and its plaintext 授权码 included.
        const headers = (req.headers ?? {});
        const host = hostVerdict(headers.host);
        if (host !== undefined) {
            this.responseJson(res, 403, { ok: false, error: { code: 'forbidden', message: host } });
            return;
        }
        if (req.method === 'POST') {
            // A page the user visits can POST here cross-origin as a「simple request」
            // and change settings or trigger a dial; these headers are the part of that
            // a page script cannot forge away.
            const post = postVerdict(headers);
            if (post !== undefined) {
                this.responseJson(res, post.status, {
                    ok: false,
                    error: { code: post.status === 415 ? 'unsupported-media-type' : 'forbidden', message: post.message },
                });
                return;
            }
        }
        if (req.method === 'GET') {
            try {
                this.responseJson(res, 200, { ok: true, value: await this.snapshot() });
            }
            catch (error) {
                this.responseJson(res, 503, { ok: false, error: { code: 'unavailable', message: messageOf(error, 'unknown error') } });
            }
            return;
        }
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'GET, POST');
            this.responseJson(res, 405, { ok: false, error: { code: 'method-not-allowed', message: 'Use GET or POST' } });
            return;
        }
        let body;
        try {
            const chunks = [];
            for await (const chunk of req) {
                const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
                if (chunks.reduce((n, c) => n + c.length, 0) + part.length > 256 * 1024)
                    throw new RangeError('request body too large');
                chunks.push(part);
            }
            body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        }
        catch (error) {
            this.responseJson(res, 400, { ok: false, error: { code: 'invalid-request', message: messageOf(error, 'unknown error') } });
            return;
        }
        try {
            if (body?.action === 'oauthLogin' || body?.action === 'oauthPoll') {
                // The two login actions answer with the flat object itself, not the
                // { ok, value } envelope the other actions use: their whole meaning is
                // { ok, status }, and a failure is a flat { ok:false, message } rather
                // than the error envelope. The page reads them straight off the body.
                const answer = body.action === 'oauthLogin'
                    ? await this.oauthLogin(body.account)
                    : await this.oauthPoll(body.account);
                this.responseJson(res, 200, answer);
            }
            else if (body?.action === 'save') {
                if (!Number.isSafeInteger(body.expectedRevision))
                    throw new Error('expectedRevision must be a non-negative integer');
                this.responseJson(res, 200, { ok: true, value: await this.save(body.value, body.expectedRevision) });
            }
            else if (body?.action === 'test') {
                this.responseJson(res, 200, { ok: true, value: await this.test(body.value, body.account) });
            }
            else if (body?.action === 'watch') {
                if (typeof this.watchImpl !== 'function')
                    throw new Error('email_watch 未就绪');
                const account = typeof body.account === 'string' ? body.account : '';
                const folder = typeof body.folder === 'string' ? body.folder : '';
                const limit = Number.isSafeInteger(body.limit) ? body.limit : 5;
                this.responseJson(res, 200, { ok: true, value: await this.watchImpl(account, folder, limit, 'web') });
            }
            else if (body?.action === 'parseAccounts') {
                // Pure and always 200: the editor calls this on every keystroke, so a
                // half-typed document is the normal case, not an HTTP failure.
                const text = typeof body.value?.accountsYaml === 'string' ? body.value.accountsYaml : '';
                const presets = typeof body.serverPresets === 'string'
                    ? customPresetsOf(body.serverPresets).custom
                    : customPresetsOf(this.scope.get().serverPresets).custom;
                const draft = readAccountsDraft(text, presets, this.rowConfig.defaultAccount, tokenLookup());
                this.responseJson(res, 200, {
                    ok: true,
                    value: {
                        ok: draft.error === undefined,
                        ...(draft.error !== undefined ? { error: draft.error } : {}),
                        ...(draft.defaultAccount !== undefined ? { defaultAccount: draft.defaultAccount } : {}),
                        list: draft.list,
                    },
                });
            }
            else if (body?.action === 'serializeAccounts') {
                if (!Array.isArray(body.accounts))
                    throw new Error('accounts 必须是数组');
                const cards = [];
                for (const entry of body.accounts) {
                    if (entry === null || typeof entry !== 'object' || Array.isArray(entry))
                        throw new Error('accounts 的每一项都必须是对象');
                    const name = typeof entry.name === 'string' ? entry.name.trim() : '';
                    if (name === '')
                        throw new Error('accounts 的每一项都需要非空的 name');
                    if (name === 'defaultAccount')
                        throw new Error('账号名不能是 defaultAccount（该键保留给默认账号）');
                    cards.push({ ...entry, name });
                }
                const source = typeof body.accountsYaml === 'string' ? body.accountsYaml : '';
                const chosen = typeof body.defaultAccount === 'string' ? body.defaultAccount.trim() : '';
                // The body may carry the preset table the page is editing: a custom
                // preset name is only persistable when the table in effect defines it.
                // An older front end sends none, which reproduces "built-ins only".
                const bodyPresets = typeof body.serverPresets === 'string'
                    ? customPresetsOf(body.serverPresets).custom
                    : customPresetsOf(this.scope.get().serverPresets).custom;
                const written = serializeAccountsDraft(source, cards, chosen, new Set(Object.keys(bodyPresets)));
                this.responseJson(res, 200, {
                    ok: true,
                    value: {
                        accountsYaml: written.accountsYaml,
                        ...(written.commentsDropped === true ? { commentsDropped: true } : {}),
                        // A card that says nothing about its password keeps the stored one;
                        // this flag is the honest signal that it could not be kept because
                        // the source document itself was unreadable.
                        ...(written.passwordsDropped === true ? { passwordsDropped: true } : {}),
                    },
                });
            }
            else {
                this.responseJson(res, 400, { ok: false, error: { code: 'invalid-request', message: 'unsupported action' } });
            }
        }
        catch (error) {
            const conflict = error?.code === 'SETTINGS_CONFLICT';
            this.responseJson(res, conflict ? 409 : 400, {
                ok: false,
                error: { code: conflict ? 'settings-conflict' : 'rejected', message: messageOf(error, 'unknown error') },
            });
        }
    }
    /** GET-only localhost route serving the whale-girl courier image. */
    handleAsset(req, res) {
        const remote = String(req.socket?.remoteAddress ?? '');
        if (remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1') {
            this.responseJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'dsh-email asset route is localhost-only' } });
            return;
        }
        if (req.method !== 'GET') {
            res.setHeader('Allow', 'GET');
            this.responseJson(res, 405, { ok: false, error: { code: 'method-not-allowed', message: 'Use GET' } });
            return;
        }
        const asset = findWhaleAsset();
        if (asset === null) {
            this.responseJson(res, 404, { ok: false, error: { code: 'not-found', message: 'no whale asset available' } });
            return;
        }
        try {
            const bytes = readFileSync(asset.file);
            res.setHeader('Content-Type', asset.contentType);
            res.setHeader('Content-Length', String(bytes.length));
            res.setHeader('Cache-Control', 'no-store');
            // No credit header: HTTP header values must be latin-1, and the widget
            // already shows the credit from the snapshot JSON.
            res.writeHead(200);
            res.end(bytes);
        }
        catch (error) {
            this.responseJson(res, 503, { ok: false, error: { code: 'unavailable', message: messageOf(error, 'unknown error') } });
        }
    }
}
/** Mount the same-origin routes when a webServer service is present. */
export function installEmailSettingsWeb(ctx, backend) {
    ctx.inject(['webServer'], (webCtx) => {
        webCtx.effect(() => {
            const dispose = webCtx.webServer.register({
                kind: 'exact',
                path: SETTINGS_ROUTE,
                handler: (req, res) => backend.handle(req, res),
            });
            const disposeAsset = webCtx.webServer.register({
                kind: 'exact',
                path: WHALE_ASSET_ROUTE,
                handler: (req, res) => backend.handleAsset(req, res),
            });
            return () => {
                dispose();
                disposeAsset();
            };
        }, 'dsh-email: web routes');
    });
}
