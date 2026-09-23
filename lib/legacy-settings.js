/** Import only this plugin's retired settings section, preserving profile overrides. */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
function plain(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function missing(legacy, current) {
    const patch = {};
    for (const [key, value] of Object.entries(legacy)) {
        if (current[key] === undefined)
            patch[key] = value;
        else if (plain(value) && plain(current[key])) {
            const nested = missing(value, current[key]);
            if (Object.keys(nested).length)
                patch[key] = nested;
        }
    }
    return patch;
}
/** No backup is edited or deleted; the completion marker lives beside imported values. */
export async function importLegacySettings(ctx, config, namespace, entryId, fields, home) {
    if (typeof ctx.settings.register === 'function' || config.legacySettingsImported === true)
        return false;
    // Old namespaces were global. Do not copy credentials into unrelated custom instances.
    if (ctx.fiber?.entry?.options.id !== entryId)
        return false;
    let base = home ?? (process.env.DSH_HOME?.trim() || join(homedir(), '.dsh'));
    if (base === '~')
        base = homedir();
    else if (base.startsWith('~/') || base.startsWith('~\\'))
        base = join(homedir(), base.slice(2));
    let document;
    for (const file of ['settings.yaml.imported', 'settings.yaml']) {
        try {
            document = parse(readFileSync(resolve(base, file), 'utf8'));
            break;
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                throw new Error('Cannot read legacy settings; original file preserved');
        }
    }
    if (!plain(document) || !plain(document[namespace]))
        return false;
    const section = Object.fromEntries(fields.filter(key => Object.hasOwn(document[namespace], key)).map(key => [key, document[namespace][key]]));
    if (Object.keys(section).length === 0)
        return false;
    await ctx.settings.update(entryId, { ...missing(section, { ...config }), legacySettingsImported: true });
    return true;
}
/** Defer persistence until the entry and settings provider are active. */
export function installLegacySettingsImport(ctx, config, namespace, entryId, fields) {
    if (typeof ctx.settings.register === 'function' || typeof ctx.inject !== 'function')
        return;
    ctx.inject(['appReady'], (readyCtx) => {
        readyCtx.effect(() => readyCtx.appReady.onReady(() => {
            void importLegacySettings(ctx, config, namespace, entryId, fields).catch(() => {
                ctx.logger?.warn?.(namespace + ': legacy settings could not be imported; the original settings file is preserved.');
            });
        }));
    });
}
