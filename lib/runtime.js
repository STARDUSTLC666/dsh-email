/** Live settings, account-pool ownership, and independent tool/web watch cursors. */
import { clampInt, resolveEmailSettings } from './config.js';
import { EmailPool, messageOf } from './mail-client.js';
import { EmailSettingsSchema, SETTINGS_NAMESPACE, toEmailConfig, toSettingsBase, validateSettingsValue } from './settings.js';
function fingerprintSettings(settings) {
    return JSON.stringify({
        accounts: [...settings.accounts.entries()].map(([name, account]) => [name, account]),
        defaultAccount: settings.defaultAccount,
        sendApproval: settings.sendApproval,
        maxBodyChars: settings.maxBodyChars,
        downloadDir: settings.downloadDir,
        downloadDirExplicit: settings.downloadDirExplicit,
        maxAttachmentBytes: settings.maxAttachmentBytes,
        bodySearchFallback: settings.bodySearchFallback,
        bodySearchLimit: settings.bodySearchLimit,
        idleTimeoutMs: settings.idleTimeoutMs,
    });
}
/** Register live settings and own exactly one pool for their effective value. */
export function createEmailRuntime(ctx, config, createPool = settings => new EmailPool(settings)) {
    const settingsScope = ctx.settings.register(SETTINGS_NAMESPACE, EmailSettingsSchema, {
        base: toSettingsBase(config),
        applies: 'live',
        validate: value => validateSettingsValue(value),
    });
    const getSettingsValue = () => settingsScope.get();
    const getEffectiveSettings = () => {
        // Form defaults must not overwrite row settings or provider presets.
        const descriptor = (ctx.settings.describe?.() ?? []).find(row => row.ns === SETTINGS_NAMESPACE);
        return resolveEmailSettings({ ...config, ...toEmailConfig(getSettingsValue(), descriptor?.user) });
    };
    let pool = null;
    let poolFingerprint = '';
    let disposed = false;
    const getPool = () => {
        if (disposed)
            throw new Error('dsh-email 已卸载，不能继续使用邮箱连接池。');
        const effective = getEffectiveSettings();
        const fingerprint = fingerprintSettings(effective);
        if (pool === null || fingerprint !== poolFingerprint) {
            pool?.dispose();
            pool = createPool(effective);
            pool.startIdleSweep();
            poolFingerprint = fingerprint;
        }
        return pool;
    };
    // Tool and browser watches share the implementation but never consume each
    // other's cursor. The first call per scope/account/folder seeds a baseline.
    const watchCursors = new Map();
    const watch = async (account, folder, limit, scope, signal) => {
        const capped = clampInt(limit, 20, 1, 100);
        const result = await getPool().list(account, folder, 100, 0, true, undefined, undefined, signal);
        const key = scope + '\u0000' + result.account + '\u0000' + result.folder;
        const isFirst = !watchCursors.has(key);
        const cursor = watchCursors.get(key) ?? 0;
        const fresh = result.messages.filter(message => message.uid > cursor);
        if (result.messages.length > 0) {
            watchCursors.set(key, Math.max(cursor, ...result.messages.map(message => message.uid)));
        }
        else if (isFirst) {
            watchCursors.set(key, 0);
        }
        return {
            account: result.account,
            folder: result.folder,
            firstRun: isFirst,
            newCount: isFirst ? 0 : fresh.length,
            messages: (isFirst ? [] : fresh).slice(0, capped),
            totalUnread: result.count,
        };
    };
    const dispose = () => {
        if (disposed)
            return;
        disposed = true;
        pool?.dispose();
        pool = null;
        poolFingerprint = '';
        watchCursors.clear();
    };
    // Missing credentials never prevent plugin registration. Account tools and
    // email_health provide the configuration details when invoked.
    try {
        getPool();
    }
    catch (error) {
        ctx.logger?.warn?.('[dsh-email] ' + messageOf(error, '未配置邮箱账号'));
    }
    ctx.effect(() => dispose);
    return { settingsScope, getSettingsValue, getEffectiveSettings, getPool, watch, dispose };
}
