import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
// Backends sharing this module instance share a key. Nothing is cached per
// edit; references from an earlier module or host process require a reload.
const key = randomBytes(32);
const PREFIX = 'dsh-email-sealed:v1:';
const fields = ['password', 'authPassword', 'apiKey', 'clientSecret', 'proxy', 'accountsYaml'];
function reloadRequired() {
    return Object.assign(new Error('邮件设置会话已更新，请重新加载邮件设置后再保存。 / Reload email settings before saving.'), { code: 'SETTINGS_RELOAD_REQUIRED' });
}
/** An opaque, authenticated reference; the browser never needs the YAML itself. */
export function sealSettingsText(field, text) {
    if (!text)
        return text;
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, nonce);
    cipher.setAAD(Buffer.from(field));
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return PREFIX + Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString('base64url');
}
/** Plain input remains accepted for existing callers and newly typed drafts. */
export function openSettingsText(field, text) {
    if (!text.startsWith('dsh-email-sealed:'))
        return text;
    if (!text.startsWith(PREFIX))
        throw reloadRequired();
    try {
        const bytes = Buffer.from(text.slice(PREFIX.length), 'base64url');
        if (bytes.length < 28)
            throw reloadRequired();
        const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
        decipher.setAAD(Buffer.from(field));
        decipher.setAuthTag(bytes.subarray(12, 28));
        return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
    }
    catch {
        throw reloadRequired();
    }
}
export function publicSettingsValue(value) {
    const projected = { ...value };
    for (const field of fields)
        if (typeof projected[field] === 'string')
            projected[field] = sealSettingsText(field, projected[field]);
    // Native runtimes project the legacy map into accountsYaml; this hidden copy
    // is neither an editor field nor something the client should receive.
    delete projected.accounts;
    return projected;
}
export function openSettingsValue(value, previous) {
    const restored = { ...value };
    for (const field of fields) {
        // Legacy replace providers require a complete credential section. Missing
        // fields retain their values; an explicit empty string still clears them.
        if (!Object.hasOwn(restored, field) && previous && Object.hasOwn(previous, field))
            restored[field] = previous[field];
        if (typeof restored[field] === 'string')
            restored[field] = openSettingsText(field, restored[field]);
    }
    return restored;
}
