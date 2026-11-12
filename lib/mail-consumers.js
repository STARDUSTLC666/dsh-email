import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, stat, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
const MAX_CONSUMERS = 20;
const MAX_SENDERS = 50;
const MAX_HANDLER_CONCURRENCY = 4;
const HANDLER_TIMEOUT_MS = 10_000;
const SCAN_LIMIT = 100;
const keyOf = (uid) => typeof uid + ':' + String(uid);
const messageKey = (account, folder, uidValidity, uid) => createHash('sha256').update(JSON.stringify([account, folder, uidValidity, uid])).digest('hex');
export function normalizeMailConsumers(raw) {
    if (raw === undefined || raw === null)
        return [];
    if (!Array.isArray(raw) || raw.length > MAX_CONSUMERS)
        throw new Error('consumers must contain at most 20 entries');
    const ids = new Set();
    return raw.map((value, index) => {
        if (!value || typeof value !== 'object' || Array.isArray(value))
            throw new Error(`consumer ${index + 1} must be an object`);
        const row = value;
        const id = typeof row.id === 'string' ? row.id.trim() : '';
        const account = typeof row.account === 'string' ? row.account.trim() : '';
        const folder = typeof row.folder === 'string' && row.folder.trim() ? row.folder.trim() : 'INBOX';
        if (!/^[A-Za-z0-9_-]{1,64}$/.test(id))
            throw new Error(`consumer ${index + 1} has an invalid id`);
        if (ids.has(id))
            throw new Error(`consumer id ${id} is duplicated`);
        ids.add(id);
        if (!account || account.length > 128 || /[\r\n\0]/.test(account))
            throw new Error(`consumer ${id} has an invalid account`);
        if (folder.length > 200 || /[\r\n\0]/.test(folder))
            throw new Error(`consumer ${id} has an invalid folder`);
        if (row.enabled !== undefined && typeof row.enabled !== 'boolean')
            throw new Error(`consumer ${id} enabled must be boolean`);
        const rawSenders = row.senders ?? [];
        if (!Array.isArray(rawSenders) || rawSenders.length > MAX_SENDERS || rawSenders.some((sender) => typeof sender !== 'string' || sender.length > 254 || /[\r\n\0]/.test(sender)))
            throw new Error(`consumer ${id} senders must be an address list of at most ${MAX_SENDERS}`);
        if (row.subject !== undefined && (typeof row.subject !== 'string' || row.subject.length > 512 || /[\r\n\0]/.test(row.subject)))
            throw new Error(`consumer ${id} subject must be a string of at most 512 characters`);
        return {
            id,
            account,
            folder,
            senders: [...new Set((row.senders ?? []).map(sender => sender.trim().toLowerCase()).filter(Boolean))],
            ...(typeof row.subject === 'string' && row.subject !== '' ? { subject: row.subject } : {}),
            enabled: row.enabled !== false,
        };
    });
}
function addressOf(value) {
    return typeof value.address === 'string' ? value.address.trim() : '';
}
const SECRET_FIELD = /pass(word)?|secret|token|api_?key|credential/i;
/** Drop credential fields so the persisted binding never hashes a secret. */
function withoutSecrets(value) {
    if (Array.isArray(value))
        return value.map(withoutSecrets);
    if (value instanceof Map)
        return withoutSecrets(Object.fromEntries(value));
    if (!value || typeof value !== 'object')
        return value;
    const out = {};
    for (const key of Object.keys(value).sort()) {
        if (!SECRET_FIELD.test(key))
            out[key] = withoutSecrets(value[key]);
    }
    return out;
}
function bindingFor(account, accountName, folder, consumers) {
    return createHash('sha256').update(JSON.stringify([accountName, folder, withoutSecrets(account), consumers])).digest('hex');
}
const MAX_CURSOR_FILE_BYTES = 1024 * 1024;
const HEX64 = /^[0-9a-f]{64}$/;
function validCursor(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const row = value;
    const nonNegative = (item) => typeof item === 'number' && Number.isFinite(item) && item >= 0;
    return typeof row.configBinding === 'string' && HEX64.test(row.configBinding)
        && typeof row.binding === 'string' && HEX64.test(row.binding)
        && Number.isSafeInteger(row.uidValidity) && row.uidValidity >= 0
        && Array.isArray(row.ids) && row.ids.length <= SCAN_LIMIT && row.ids.every(id => typeof id === 'string' && id.length <= 1024)
        && nonNegative(row.maxNumericUid) && nonNegative(row.maxDateMs)
        && typeof row.dateReliable === 'boolean';
}
/**
 * Scan positions for email consumers, kept so a restart compares against the last
 * scan instead of re-baselining. Stores no subjects, senders or credentials.
 */
export class FileMailConsumerCursorStore {
    root;
    file;
    constructor(home = process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')) {
        this.root = resolve(home, 'data/dsh-email');
        this.file = join(this.root, 'mail-consumers-v1.json');
    }
    async load() {
        try {
            if ((await stat(this.file)).size > MAX_CURSOR_FILE_BYTES)
                throw new Error('too large');
            const doc = JSON.parse(await readFile(this.file, 'utf8'));
            if (!doc || doc.version !== 1 || !doc.mailboxes || typeof doc.mailboxes !== 'object' || Array.isArray(doc.mailboxes))
                throw new Error('invalid');
            const entries = Object.entries(doc.mailboxes);
            if (entries.length > MAX_CONSUMERS || entries.some(([, cursor]) => !validCursor(cursor)))
                throw new Error('invalid');
            return Object.fromEntries(entries);
        }
        catch (error) {
            if (error?.code === 'ENOENT')
                return {};
            throw new Error('email consumer cursor file is unreadable; baselines will be rebuilt');
        }
    }
    async save(cursors) {
        await mkdir(this.root, { recursive: true, mode: 0o700 });
        const temp = join(this.root, '.mail-consumers-' + randomUUID() + '.json');
        try {
            const handle = await open(temp, 'wx', 0o600);
            try {
                await handle.writeFile(JSON.stringify({ version: 1, mailboxes: cursors }));
                await handle.sync();
            }
            finally {
                await handle.close();
            }
            await rename(temp, this.file);
        }
        finally {
            await unlink(temp).catch(() => { });
        }
    }
}
function consumerMatches(config, message) {
    if (config.subject && !message.subject.toLocaleLowerCase().includes(config.subject.toLocaleLowerCase()))
        return false;
    if (!config.senders.length)
        return true;
    const allowed = new Set(config.senders);
    return message.from.some(from => {
        const address = addressOf(from);
        return address !== '' && allowed.has(address.toLowerCase());
    });
}
/** Best-effort, process-local email arrival notifications. It never reads bodies or invokes DSH sessions. */
export class MailConsumerBackend {
    runtime;
    config;
    handlerTimeoutMs;
    store;
    subscriptions = new Map();
    cursors = new Map();
    handlerPromises = new Set();
    handlerControllers = new Set();
    mailboxErrors = new Map();
    configBinding = new Map();
    timer;
    running;
    started = false;
    lastScanAt;
    lastError;
    droppedEvents = 0;
    handlerFailures = 0;
    handlerTimeouts = 0;
    appReady = false;
    /** Persisted cursors are read once per start, before the first scan. */
    loaded = false;
    /** Mailboxes restored from disk whose catch-up scan has not run yet. */
    restored = new Set();
    readyAt = 0;
    savedSnapshot = '';
    saving = Promise.resolve();
    persistError;
    constructor(runtime, config, handlerTimeoutMs = HANDLER_TIMEOUT_MS, store = new FileMailConsumerCursorStore()) {
        this.runtime = runtime;
        this.config = config;
        this.handlerTimeoutMs = handlerTimeoutMs;
        this.store = store;
    }
    markAppReady() {
        this.appReady = true;
        this.syncPolling();
    }
    async loadCursors() {
        if (this.loaded)
            return;
        this.loaded = true;
        if (!this.store)
            return;
        try {
            const saved = await this.store.load();
            for (const [key, cursor] of Object.entries(saved)) {
                this.cursors.set(key, {
                    binding: cursor.binding,
                    uidValidity: cursor.uidValidity,
                    ids: new Set(cursor.ids),
                    maxNumericUid: cursor.maxNumericUid,
                    maxDateMs: cursor.maxDateMs,
                    dateReliable: cursor.dateReliable,
                });
                this.configBinding.set(key, cursor.configBinding);
                this.restored.add(key);
            }
            this.savedSnapshot = this.snapshot();
        }
        catch (error) {
            // Reported once through lastError: the next successful write replaces the
            // file, so this is the only trace that a baseline was rebuilt.
            this.lastError = error instanceof Error ? error.message : 'email consumer cursor file is unreadable';
        }
    }
    snapshot() {
        const out = {};
        for (const [key, cursor] of [...this.cursors].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
            const configBinding = this.configBinding.get(key);
            if (configBinding === undefined)
                continue;
            out[key] = {
                configBinding,
                binding: cursor.binding,
                uidValidity: cursor.uidValidity,
                ids: [...cursor.ids],
                maxNumericUid: cursor.maxNumericUid,
                maxDateMs: cursor.maxDateMs,
                dateReliable: cursor.dateReliable,
            };
        }
        return JSON.stringify(out);
    }
    /** Writes are serialized and skipped when nothing changed since the last write. */
    persist() {
        const store = this.store;
        if (!store)
            return Promise.resolve();
        const next = this.snapshot();
        if (next === this.savedSnapshot)
            return this.saving;
        this.saving = this.saving.then(async () => {
            try {
                await store.save(JSON.parse(next));
                this.savedSnapshot = next;
                this.persistError = undefined;
            }
            catch {
                this.persistError = 'email consumer cursor could not be saved; a restart will rebuild baselines';
            }
        });
        return this.saving;
    }
    syncPolling() {
        let enabled = false;
        try {
            enabled = this.configs().some(item => item.enabled);
        }
        catch { /* tick will expose invalid config */ }
        if (enabled && this.appReady && !this.started) {
            try {
                this.pollInterval();
                this.started = true;
                this.readyAt = Date.now();
                this.schedule(0);
            }
            catch (error) {
                this.lastError = error instanceof Error ? error.message : 'Invalid email consumer configuration';
            }
            return;
        }
        if (!enabled && this.started) {
            this.started = false;
            if (this.timer)
                clearTimeout(this.timer);
            this.timer = undefined;
            this.cursors.clear();
            this.configBinding.clear();
            this.restored.clear();
            // Disabling is an explicit "stop watching": a later enable must start from a
            // fresh baseline rather than replay the disabled period.
            if (this.loaded)
                void this.persist();
        }
    }
    configs() { return normalizeMailConsumers(this.config.consumers); }
    pollInterval() {
        const value = Number(this.config.consumerPollSeconds ?? 60);
        if (!Number.isInteger(value) || value < 30 || value > 3600)
            throw new Error('consumerPollSeconds must be between 30 and 3600');
        return value * 1000;
    }
    subscribe(consumerId, handler) {
        if (typeof handler !== 'function')
            throw new TypeError('emailTasks.subscribe requires a handler');
        const config = this.configs().find(item => item.id === consumerId && item.enabled);
        if (!config)
            throw new Error(`Email consumer ${consumerId} is not configured and enabled`);
        const current = this.subscriptions.get(consumerId);
        if (current?.active)
            throw new Error(`Email consumer ${consumerId} already has a handler`);
        const subscription = { handler, active: true, inFlight: 0, pending: 0, controllers: new Set() };
        this.subscriptions.set(consumerId, subscription);
        this.syncPolling();
        return () => {
            subscription.active = false;
            for (const controller of subscription.controllers)
                controller.abort(new Error('email consumer unsubscribed'));
            if (this.subscriptions.get(consumerId) === subscription)
                this.subscriptions.delete(consumerId);
        };
    }
    status() {
        this.syncPolling();
        let configured = 0;
        try {
            configured = this.configs().filter(item => item.enabled).length;
        }
        catch { /* surfaced on the next scan */ }
        return {
            enabled: configured > 0,
            configured,
            registered: [...this.subscriptions].filter(([, value]) => value.active).map(([id]) => id).sort(),
            running: this.started || this.running !== undefined,
            inFlight: [...this.subscriptions.values()].reduce((count, item) => count + item.pending, 0),
            ...(this.lastScanAt ? { lastScanAt: this.lastScanAt } : {}),
            ...(this.lastError ?? this.persistError ? { lastError: this.lastError ?? this.persistError } : {}),
            droppedEvents: this.droppedEvents,
            handlerFailures: this.handlerFailures,
            handlerTimeouts: this.handlerTimeouts,
        };
    }
    deliver(subscription, event) {
        if (!subscription.active)
            return;
        if (subscription.inFlight >= MAX_HANDLER_CONCURRENCY) {
            this.droppedEvents++;
            this.lastError = `consumer ${event.consumerId} concurrency limit reached; event dropped`;
            return;
        }
        subscription.inFlight++;
        subscription.pending++;
        const controller = new AbortController();
        subscription.controllers.add(controller);
        this.handlerControllers.add(controller);
        let slotReleased = false;
        let settled = false;
        const releaseSlot = () => {
            if (slotReleased)
                return;
            slotReleased = true;
            subscription.inFlight = Math.max(0, subscription.inFlight - 1);
        };
        const settle = () => {
            if (settled)
                return;
            settled = true;
            releaseSlot();
            subscription.pending = Math.max(0, subscription.pending - 1);
            subscription.controllers.delete(controller);
            this.handlerControllers.delete(controller);
        };
        const work = Promise.resolve().then(() => subscription.handler({ ...event, signal: controller.signal })).then(() => { settle(); }, () => { this.handlerFailures++; this.lastError = `consumer ${event.consumerId} handler failed`; settle(); });
        const timed = new Promise(resolve => {
            const timer = setTimeout(() => {
                if (!settled) {
                    this.handlerTimeouts++;
                    this.lastError = `consumer ${event.consumerId} handler timed out after ${this.handlerTimeoutMs} ms`;
                    controller.abort(new Error('email consumer handler timed out'));
                    releaseSlot();
                }
                resolve();
            }, this.handlerTimeoutMs);
            timer.unref?.();
            void work.finally(() => clearTimeout(timer));
        });
        const tracked = work.finally(() => this.handlerPromises.delete(tracked));
        this.handlerPromises.add(tracked);
    }
    async scanMailbox(account, folder, consumers) {
        const settings = this.runtime.getEffectiveSettings();
        const accountConfig = settings.accounts.get(account);
        if (!accountConfig)
            throw new Error('configured account is unavailable');
        const binding = bindingFor(accountConfig, account, folder, consumers);
        const page = await this.runtime.getPool().list(account, folder, SCAN_LIMIT, 0, false);
        const key = account + '\0' + folder;
        const previous = this.cursors.get(key);
        const validity = Number.isSafeInteger(page.uidValidity) && page.uidValidity >= 0 ? page.uidValidity : 0;
        const ids = new Set(page.messages.map(message => keyOf(message.uid)));
        const numericUids = page.messages.map(message => message.uid).filter((uid) => typeof uid === 'number' && Number.isSafeInteger(uid));
        const dateValues = page.messages.map(message => Date.parse(message.date)).filter(value => Number.isFinite(value));
        const maxDateMs = Math.max(previous?.maxDateMs ?? 0, ...dateValues);
        const orderedNumeric = page.messages.length === 0 || numericUids.length === page.messages.length;
        const reliableDate = page.messages.length === 0 || dateValues.length === page.messages.length;
        const maxNumericUid = Math.max(previous?.maxNumericUid ?? 0, ...numericUids);
        if (!previous || previous.binding !== binding || previous.uidValidity !== validity) {
            this.cursors.set(key, { binding, uidValidity: validity, ids, maxNumericUid: Math.max(0, ...numericUids), maxDateMs: Math.max(0, ...dateValues), dateReliable: reliableDate });
            return;
        }
        const overlap = page.messages.some(message => previous.ids.has(keyOf(message.uid)));
        if (page.messages.length >= SCAN_LIMIT && previous.ids.size > 0 && !overlap) {
            this.lastError = `mail window exceeded ${SCAN_LIMIT} messages for ${account}/${folder}; cursor reset without dispatch`;
            this.cursors.set(key, { binding, uidValidity: validity, ids, maxNumericUid: Math.max(0, ...numericUids), maxDateMs: Math.max(0, ...dateValues), dateReliable: reliableDate });
            return;
        }
        const useNumericCursor = orderedNumeric && page.messages.length > 0;
        const useDateCursor = !useNumericCursor && reliableDate && previous.dateReliable;
        if (!useNumericCursor && !useDateCursor && page.messages.length > 0) {
            this.lastError = `opaque mail identifiers for ${account}/${folder} have no reliable date cursor; arrivals skipped`;
            this.cursors.set(key, { binding, uidValidity: validity, ids, maxNumericUid, maxDateMs: previous.maxDateMs, dateReliable: previous.dateReliable && reliableDate });
            return;
        }
        const fresh = page.messages.filter(message => !previous.ids.has(keyOf(message.uid)) && (useNumericCursor && typeof message.uid === 'number' ? message.uid > previous.maxNumericUid
            : useDateCursor && Date.parse(message.date) > previous.maxDateMs));
        for (const message of fresh) {
            const sender = addressOf(message.from[0] ?? {});
            const eventId = messageKey(account, folder, validity, message.uid);
            for (const config of consumers) {
                if (!consumerMatches(config, message))
                    continue;
                const subscription = this.subscriptions.get(config.id);
                if (!subscription?.active) {
                    this.droppedEvents++;
                    this.lastError = `consumer ${config.id} has no registered handler; event dropped`;
                    continue;
                }
                this.deliver(subscription, {
                    eventId,
                    consumerId: config.id,
                    account,
                    folder,
                    uid: message.uid,
                    uidValidity: validity,
                    sender,
                    ...(message.subject ? { subject: message.subject } : {}),
                    ...(message.date ? { date: message.date } : {}),
                });
            }
        }
        this.cursors.set(key, { binding, uidValidity: validity, ids, maxNumericUid, maxDateMs, dateReliable: previous.dateReliable && reliableDate });
    }
    async tick() {
        if (this.running)
            return this.running;
        const running = (async () => {
            try {
                await this.loadCursors();
                const configs = this.configs().filter(item => item.enabled);
                const activeKeys = new Set();
                const mailboxes = new Map();
                for (const config of configs) {
                    const key = config.account + '\0' + config.folder;
                    activeKeys.add(key);
                    const rows = mailboxes.get(key) ?? [];
                    rows.push(config);
                    mailboxes.set(key, rows);
                }
                for (const key of this.cursors.keys())
                    if (!activeKeys.has(key)) {
                        this.cursors.delete(key);
                        this.configBinding.delete(key);
                        this.restored.delete(key);
                    }
                for (const [key, rows] of mailboxes) {
                    const binding = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
                    if (this.configBinding.get(key) !== binding) {
                        this.cursors.delete(key);
                        this.configBinding.set(key, binding);
                        this.restored.delete(key);
                    }
                    // A restored cursor turns the first scan into a catch-up. Give consumer
                    // plugins one poll interval to register, so catch-up events are not
                    // dropped merely because the handler was not attached yet.
                    if (this.restored.has(key)) {
                        const waiting = rows.some(row => !this.subscriptions.get(row.id)?.active);
                        if (waiting && Date.now() - this.readyAt < this.pollInterval())
                            continue;
                        this.restored.delete(key);
                    }
                    try {
                        await this.scanMailbox(rows[0].account, rows[0].folder, rows);
                        this.mailboxErrors.delete(key);
                    }
                    catch (error) {
                        const message = error instanceof Error ? error.message : 'unknown error';
                        this.mailboxErrors.set(key, `email consumer scan failed for ${rows[0].account}/${rows[0].folder}: ${message}`);
                    }
                }
                this.lastScanAt = new Date().toISOString();
                // Mailbox failures win over per-delivery noise, but a successful scan must
                // not erase a delivery error recorded during this very tick (concurrency
                // drop, handler failure or timeout): those are the only signal that an
                // event was lost, and the next scan reporting "no error" would hide it.
                const mailboxError = [...this.mailboxErrors.values()].at(-1);
                if (mailboxError !== undefined)
                    this.lastError = mailboxError;
                else if (this.lastError?.startsWith('email consumer scan failed for '))
                    this.lastError = undefined;
                await this.persist();
            }
            catch {
                this.lastError = 'email consumer scan failed; check account settings and DSH logs';
            }
        })();
        this.running = running;
        try {
            await running;
        }
        finally {
            if (this.running === running)
                this.running = undefined;
        }
    }
    schedule(delay) {
        if (!this.started)
            return;
        this.timer = setTimeout(() => {
            void this.tick().finally(() => {
                if (this.started) {
                    let interval = 60_000;
                    try {
                        interval = this.pollInterval();
                    }
                    catch {
                        this.lastError = 'consumerPollSeconds must be between 30 and 3600';
                    }
                    this.schedule(interval);
                }
            });
        }, delay);
        this.timer.unref?.();
    }
    start() {
        if (this.started)
            return;
        this.appReady = true;
        this.syncPolling();
    }
    async stop() {
        this.started = false;
        this.appReady = false;
        if (this.timer)
            clearTimeout(this.timer);
        this.timer = undefined;
        await this.running;
        await this.saving;
        for (const subscription of this.subscriptions.values())
            subscription.active = false;
        for (const controller of this.handlerControllers)
            controller.abort(new Error('email consumer stopped'));
        this.subscriptions.clear();
        this.cursors.clear();
        this.configBinding.clear();
        this.restored.clear();
        this.loaded = false;
        this.savedSnapshot = '';
        await Promise.race([
            Promise.all([...this.handlerPromises]),
            new Promise(resolve => {
                const timer = setTimeout(resolve, this.handlerTimeoutMs);
                timer.unref?.();
            }),
        ]);
    }
}
export function installMailConsumers(ctx, backend) {
    ctx.provide?.('emailTasks', { subscribe: backend.subscribe.bind(backend), status: backend.status.bind(backend) });
    ctx.inject?.(['appReady'], (host) => host.appReady?.onReady?.(() => backend.markAppReady()));
    ctx.on?.('dispose', () => backend.stop());
}
