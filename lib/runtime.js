/** Live settings, account-pool ownership, and independent tool/web watch cursors. */
import { clampInt, presetNamesIn, resolveEmailSettings } from './config.js';
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
        // The provider dropdown offers the custom preset names beside the built-ins,
        // so validation must accept whatever the table in effect defines.
        validate: value => validateSettingsValue(value, presetNamesIn(value?.serverPresets ?? config.serverPresets)),
    });
    const getSettingsValue = () => settingsScope.get();
    const getEffectiveSettings = () => {
        // Form defaults must not overwrite row settings or provider presets.
        const descriptor = (ctx.settings.describe?.() ?? []).find(row => row.ns === SETTINGS_NAMESPACE);
        const value = getSettingsValue();
        // serverPresets is a *lookup source* for provider ids, not part of the
        // resolved config: it is handed to resolution here and never stored on the
        // result, so editing a preset no account references cannot change the pool
        // fingerprint. toEmailConfig deliberately drops the field, so it is re-added
        // from the scope value — which already merges the row's text with the user's.
        const presets = value.serverPresets;
        return resolveEmailSettings({
            ...config,
            ...toEmailConfig(value, descriptor?.user),
            ...(typeof presets === 'string' ? { serverPresets: presets } : {}),
        });
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
        const pool = getPool();
        // 先只 SEARCH UNSEEN 拿 uid 列表与 totalUnread，再只为本轮要报告的最旧
        // limit 封取信封：网页弹窗每 30 秒轮询一次，不能因为未读多就整批 FETCH。
        const index = await pool.unseenUids(account, folder, signal);
        const key = scope + '\u0000' + index.account + '\u0000' + index.folder;
        const stored = watchCursors.get(key);
        const uidValidity = typeof index.uidValidity === 'number' ? index.uidValidity : 0;
        // A UIDVALIDITY change renumbers every message in the mailbox: keeping the
        // old cursor would either report the whole folder as new or miss everything
        // that renumbered below it. Re-seed the baseline instead and say so.
        const reset = stored !== undefined && stored.uidValidity !== 0 && uidValidity !== 0 && stored.uidValidity !== uidValidity;
        const isFirst = stored === undefined || reset;
        const cursor = stored === undefined || reset ? 0 : stored.uid;
        const fresh = isFirst ? [] : index.uids.filter(uid => uid > cursor);
        // 后续每次只返回 fresh 中最旧的 limit 条，游标也只推进到这批的最大 uid：
        // 窗口里更旧的新邮件留给下一轮，不能因为本次只返回 limit 条就被永久跳过。
        const batch = fresh.slice(Math.max(0, fresh.length - capped));
        const messages = batch.length > 0 ? await pool.fetchByUids(account, folder, batch, signal) : [];
        if (isFirst) {
            // 首次调用（或 UIDVALIDITY 重建）只落基线：游标取窗口最新一封，旧邮件不算新邮件。
            watchCursors.set(key, {
                uid: index.uids.length > 0 ? index.uids[0] : 0,
                uidValidity,
            });
        }
        else if (batch.length > 0) {
            watchCursors.set(key, { uid: Math.max(...batch), uidValidity });
        }
        return {
            account: index.account,
            folder: index.folder,
            firstRun: stored === undefined,
            ...(reset ? { reset: true } : {}),
            newCount: messages.length,
            messages,
            totalUnread: index.count,
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
