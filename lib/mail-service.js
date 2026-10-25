import { EmailPool, buildReplyMessage, validateAttachmentPaths, } from './mail-client.js';
import { AgentMailClient } from './agentmail.js';
/** Route accounts independently. IMAP's numeric UIDs retain their original meaning. */
export class EmailService {
    settings;
    imap;
    api;
    constructor(settings, dependencies = {}) {
        this.settings = settings;
        this.imap = new EmailPool(settings);
        this.api = new AgentMailClient(settings, dependencies.fetch, dependencies.download);
    }
    get withImap() {
        return this.imap.withImap.bind(this.imap);
    }
    set withImap(run) {
        this.imap.withImap = run;
    }
    name(account) {
        const name = account || this.settings.defaultAccount;
        if (!this.settings.accounts.has(name))
            throw new Error('未知邮件账号');
        return name;
    }
    usesApi(account) {
        return (this.settings.accounts.get(this.name(account))?.transport === 'agentmail');
    }
    number(uid) {
        // Tool/JSON callers can preserve an IMAP UID as a decimal string. Normalize
        // only after selecting IMAP, so AgentMail IDs remain opaque (including 001).
        const value = typeof uid === 'string' && /^[0-9]+$/.test(uid) ? Number(uid) : uid;
        if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0)
            throw new Error('IMAP uid 必须是正整数或纯数字字符串；AgentMail 字符串邮件标识仅适用于 AgentMail 账号');
        return value;
    }
    folder(account, folder) {
        return folder || this.settings.accounts.get(this.name(account)).inboxFolder;
    }
    list(account, folder, limit, offset, unread, since, until, signal) {
        return this.usesApi(account)
            ? this.api.list(this.name(account), this.folder(account, folder), limit, offset, unread, since, until, signal)
            : this.imap.list(account, folder, limit, offset, unread, since, until, signal);
    }
    read(account, uid, folder, signal) {
        return this.usesApi(account)
            ? this.api.read(this.name(account), uid, this.folder(account, folder), signal)
            : this.imap.read(account, this.number(uid), folder, signal);
    }
    search(account, query, folder, limit, offset, since, until, signal, options = {}) {
        if (this.usesApi(account) && options.headerScanOffset)
            throw new Error('AgentMail 搜索使用 offset 分页，不使用 IMAP headerScanOffset');
        return this.usesApi(account)
            ? this.api.search(this.name(account), query, this.folder(account, folder), limit, offset, since, until, signal)
            : this.imap.search(account, query, folder, limit, offset, since, until, signal, options);
    }
    mark(account, folder, uid, action, target, signal) {
        return this.usesApi(account)
            ? this.api.mark(this.name(account), this.folder(account, folder), uid, action, target, signal)
            : this.imap.mark(account, folder, this.number(uid), action, target, signal);
    }
    async folders(account, subscribed, signal) {
        if (!this.usesApi(account))
            return this.imap.folders(account, subscribed, signal);
        signal?.throwIfAborted();
        return {
            account: this.name(account),
            folders: [
                ['INBOX', '\\Inbox'],
                ['Sent', '\\Sent'],
                ['Starred', '\\Flagged'],
                ['Archive', '\\Archive'],
                ['All', '\\All'],
            ].map(([path, specialUse]) => ({
                name: path,
                path,
                specialUse,
                subscribed: true,
            })),
        };
    }
    downloadAttachment(account, folder, uid, index, workspace, signal) {
        return this.usesApi(account)
            ? this.api.downloadAttachment(this.name(account), folder, uid, index, workspace, signal)
            : this.imap.downloadAttachment(account, folder, this.number(uid), index, workspace, signal);
    }
    async send(account, to, subject, text, cc, paths, signal) {
        if (!this.usesApi(account))
            return this.imap.send(account, to, subject, text, cc, paths, signal);
        await validateAttachmentPaths(paths ?? [], Math.min(this.settings.maxAttachmentBytes, 4 * 1024 * 1024), signal);
        return this.api.sendPaths(this.name(account), to, subject, text ?? '', cc ?? '', paths ?? [], signal);
    }
    sendPrepared(account, to, subject, text, cc, attachments, signal, reply) {
        return this.usesApi(account)
            ? this.api.send(this.name(account), to, subject, text, cc, attachments, signal, reply)
            : this.imap.sendPrepared(account, to, subject, text, cc, attachments, signal, reply ? { ...reply, uid: this.number(reply.uid) } : undefined);
    }
    async reply(account, folder, uid, mode, text, to, cc, signal) {
        if (!this.usesApi(account))
            return this.imap.reply(account, folder, this.number(uid), mode, text, to, cc, signal);
        const name = this.name(account), cfg = this.settings.accounts.get(name), original = await this.api.read(name, uid, this.folder(account, folder), signal), built = buildReplyMessage({ ...original, messageId: String(uid), references: '' }, mode, cfg.user, text, to), sent = await this.api.send(name, built.to, built.subject, built.text, cc ?? '', [], signal, mode === 'forward' ? undefined : { uid, folder });
        return {
            ...sent,
            mode,
            originalUid: uid,
            to: built.to.split(','),
            subject: built.subject,
        };
    }
    unseenUids(...args) {
        if (this.usesApi(args[0]))
            throw new Error('AgentMail 使用独立的新邮件游标');
        return this.imap.unseenUids(...args);
    }
    fetchByUids(...args) {
        if (this.usesApi(args[0]))
            throw new Error('AgentMail 不支持 IMAP 数字 UID 批量读取，请使用列表中的 message_id');
        return this.imap.fetchByUids(...args);
    }
    async watchApi(account, folder, limit, scope, signal) {
        return this.usesApi(account)
            ? this.api.watch(this.name(account), this.folder(account, folder), limit, scope, signal)
            : undefined;
    }
    startIdleSweep() {
        this.imap.startIdleSweep();
    }
    dispose() {
        this.imap.dispose();
        this.api.clear();
    }
}
