/** Model-facing parameters, input normalization, output schemas and text rendering. */
export const MAX_LIMIT = 100;
export const ACCOUNT_HINT = '账号名（配置了 accounts 多个账号时选择），省略时用 defaultAccount。可用账号见 email_folders 的报错或插件 README';
/** Parse date-only or ISO input; an inclusive end date maps to the next UTC day. */
export function parseEmailDay(input, label, endInclusive = false) {
    const text = input.trim();
    let date = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        date = new Date(text + 'T00:00:00Z');
    }
    else {
        const parsed = new Date(text);
        if (!Number.isNaN(parsed.getTime()))
            date = parsed;
    }
    if (date === null || Number.isNaN(date.getTime())) {
        throw new Error(label + ' 不是有效日期，请给形如 2026-08-01 或 2026-08-01T00:00:00Z 的值');
    }
    if (endInclusive)
        return new Date(date.getTime() + 24 * 3600 * 1000);
    return date;
}
export function executionSignal(exec) {
    if (typeof exec !== 'object' || exec === null)
        return undefined;
    const signal = exec.signal;
    return signal instanceof AbortSignal ? signal : undefined;
}
export function compileParameters(spec) {
    const properties = {};
    const required = [];
    for (const [key, prop] of Object.entries(spec)) {
        if (prop?.required === true)
            required.push(key);
        const node = {};
        if (typeof prop?.type === 'string')
            node.type = prop.type;
        if (typeof prop?.description === 'string')
            node.description = prop.description;
        if (prop?.type === 'array' && prop.items !== null && typeof prop.items === 'object') {
            const items = { type: 'string' };
            if (prop.items.type === 'object')
                items.additionalProperties = true;
            node.items = items;
        }
        properties[key] = node;
    }
    return { type: 'object', properties, ...(required.length > 0 ? { required } : {}) };
}
export function normalizeAttachmentPaths(value) {
    if (value === undefined || value === null)
        return undefined;
    if (!Array.isArray(value) || value.some(path => typeof path !== 'string' || path.trim() === '')) {
        throw new Error('attachments 必须是文件路径字符串数组（且不能包含空字符串）');
    }
    return value.map(path => path.trim());
}
export const strArray = { type: 'array', items: { type: 'string' } };
export const addrArray = { type: 'array', items: { type: 'object', additionalProperties: true } };
export const messageShape = {
    uid: { type: 'integer' },
    date: { type: 'string' },
    from: addrArray,
    subject: { type: 'string' },
    seen: { type: 'boolean' },
    flagged: { type: 'boolean' },
    size: { type: 'integer' },
    hasAttachments: { type: 'boolean' },
};
export const listSchema = {
    type: 'object',
    properties: {
        account: { type: 'string' },
        count: { type: 'integer' },
        folder: { type: 'string' },
        messages: { type: 'array', items: { type: 'object', properties: messageShape, additionalProperties: true } },
    },
    additionalProperties: true,
};
export const readSchema = {
    type: 'object',
    properties: {
        account: { type: 'string' },
        uid: { type: 'integer' },
        folder: { type: 'string' },
        date: { type: 'string' },
        from: addrArray,
        to: addrArray,
        cc: addrArray,
        subject: { type: 'string' },
        text: { type: 'string' },
        attachments: { type: 'array', items: { type: 'object', additionalProperties: true } },
        truncated: { type: 'boolean' },
    },
    additionalProperties: true,
};
export const sendSchema = {
    type: 'object',
    properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        accepted: strArray,
        rejected: strArray,
        response: { type: 'string' },
    },
    additionalProperties: true,
};
export const foldersSchema = {
    type: 'object',
    properties: {
        account: { type: 'string' },
        folders: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    path: { type: 'string' },
                    specialUse: { type: 'string' },
                    subscribed: { type: 'boolean' },
                },
                additionalProperties: true,
            },
        },
    },
    additionalProperties: true,
};
export const attachmentSchema = {
    type: 'object',
    properties: {
        account: { type: 'string' },
        uid: { type: 'integer' },
        filename: { type: 'string' },
        contentType: { type: 'string' },
        size: { type: 'integer' },
        path: { type: 'string' },
    },
    additionalProperties: true,
};
export const markSchema = {
    type: 'object',
    properties: {
        account: { type: 'string' },
        uid: { type: 'integer' },
        folder: { type: 'string' },
        action: { type: 'string' },
        seen: { type: 'boolean' },
        flagged: { type: 'boolean' },
        movedTo: { type: 'string' },
        movedUid: { type: 'integer' },
    },
    additionalProperties: true,
};
export const MARK_ACTIONS = ['read', 'unread', 'star', 'unstar', 'move'];
export const REPLY_MODES = ['reply', 'reply-all', 'forward'];
export const MARK_LABELS = {
    read: '标记为已读',
    unread: '标记为未读',
    star: '加星标',
    unstar: '取消星标',
    move: '移动',
};
export const REPLY_LABELS = {
    reply: '回复',
    'reply-all': '回复全部',
    forward: '转发',
};
export function oneText(text) {
    return [{ type: 'text', text }];
}
export function describeMessage(message) {
    const from = message.from.map(a => a.name ?? a.address).filter(Boolean).join(', ') || '(未知)';
    const flags = [
        message.seen ? '' : '未读',
        message.flagged ? '已标星' : '',
        message.hasAttachments ? '含附件' : '',
    ].filter(Boolean);
    const parts = ['uid=' + message.uid, from, message.date];
    if (flags.length > 0)
        parts.push(flags.join('、'));
    return (message.subject || '(无主题)') + ' [' + parts.join(' | ') + ']';
}
export function renderList(value) {
    if (value.messages.length === 0) {
        return oneText('账号 ' + value.account + '，文件夹 "' + value.folder + '" 共 ' + value.count + ' 封邮件，本次没有要列出的邮件。');
    }
    const lines = value.messages.map((m, i) => '#' + (i + 1) + ' ' + describeMessage(m));
    return oneText('账号 ' + value.account + '，文件夹 "' + value.folder + '" 共 ' + value.count + ' 封邮件，最新 ' + value.messages.length + ' 封：\n\n' + lines.join('\n') + '\n\n用 email_read 配合 uid 阅读全文。');
}
export function renderRead(value) {
    const from = value.from.map(a => a.name ?? a.address).filter(Boolean).join(', ') || '(未知)';
    const attach = value.attachments.length > 0
        ? '\n附件：' + value.attachments.map((a, i) => '#' + i + ' ' + a.filename + '（' + a.contentType + '，' + a.size + ' 字节）').join('；') + '\n（用 email_attachment 配合 uid 与序号下载）'
        : '';
    return oneText('账号 ' + value.account + '，主题：' + (value.subject || '(无主题)') + '\n来自：' + from + '\n时间：' + (value.date || '(未知)') + attach + '\n\n' + value.text);
}
export function renderSearch(value) {
    if (value.messages.length === 0) {
        return oneText('账号 ' + value.account + '，在文件夹 "' + value.folder + '" 中搜索 "' + value.query + '"：共 ' + value.count + ' 条匹配，本次没有列出。');
    }
    const lines = value.messages.map((m, i) => '#' + (i + 1) + ' ' + describeMessage(m));
    return oneText('账号 ' + value.account + '，在文件夹 "' + value.folder + '" 中搜索 "' + value.query + '"：共 ' + value.count + ' 条匹配，展示最新 ' + value.messages.length + ' 条：\n\n' + lines.join('\n'));
}
export function renderSend(value) {
    const rejected = value.rejected.length > 0 ? '；被拒：' + value.rejected.join(', ') : '';
    return oneText('账号 ' + value.account + ' 邮件已发送，messageId: ' + value.messageId + '；成功送达：' + value.accepted.join(', ') + rejected + '；服务器响应：' + value.response);
}
export function renderFolders(value) {
    if (value.folders.length === 0)
        return oneText('账号 ' + value.account + '：未列出任何文件夹。');
    const lines = value.folders.map((f, i) => '#' + (i + 1) + ' ' + f.path + (f.specialUse !== '' ? ' [' + f.specialUse + ']' : '') + (f.subscribed ? '' : '（未订阅）'));
    return oneText('账号 ' + value.account + ' 的文件夹（' + value.folders.length + ' 个）：\n\n' + lines.join('\n') + '\n\n把 folder 参数填成其中的 path 即可。');
}
export function renderAttachment(value) {
    return oneText('账号 ' + value.account + ' 已下载附件 "' + value.filename + '"（' + value.contentType + '，' + value.size + ' 字节）到：\n' + value.path + '\n可用 read 工具读取该文件。');
}
export function renderMark(value) {
    let text = '账号 ' + value.account + '：文件夹 "' + value.folder + '" 中 uid=' + value.uid + ' 已' + (MARK_LABELS[value.action] ?? value.action);
    if (value.action === 'move') {
        text += '到 "' + (value.movedTo ?? '') + '"' + (typeof value.movedUid === 'number' ? '（新 uid=' + value.movedUid + '）' : '');
    }
    else {
        text += '（当前：' + (value.seen ? '已读' : '未读') + (value.flagged ? '、已标星' : '') + '）';
    }
    return oneText(text);
}
export function renderReply(value) {
    const rejected = value.rejected.length > 0 ? '；被拒：' + value.rejected.join(', ') : '';
    return oneText('账号 ' + value.account + ' 已' + REPLY_LABELS[value.mode] + ' uid=' + value.originalUid + ' 的邮件：收件人 ' + value.to.join(', ') + '，主题「' + value.subject + '」，messageId: ' + value.messageId + rejected);
}
export function renderWatch(value) {
    if (value.firstRun) {
        return oneText('账号 ' + value.account + '：已建立新邮件监视基线（当前未读 ' + value.totalUnread + ' 封）。之后调用 email_watch 只会报告新到的邮件。');
    }
    if (value.newCount === 0) {
        return oneText('账号 ' + value.account + '：没有新邮件（当前未读 ' + value.totalUnread + ' 封）。');
    }
    const lines = value.messages.map((m, i) => '#' + (i + 1) + ' ' + describeMessage(m));
    return oneText('账号 ' + value.account + ' 有 ' + value.newCount + ' 封新邮件：\n\n' + lines.join('\n') + '\n\n用 email_read 配合 uid 阅读全文。');
}
export const renderHealth = (_args, value) => {
    const rec = (value ?? {});
    const rawChecks = Array.isArray(rec.checks) ? rec.checks : [];
    const lines = ['dsh-email 自检' + (rec.ok === true ? '：正常。' : '：发现问题。')];
    for (const item of rawChecks) {
        const c = (item ?? {});
        lines.push('- ' + String(c.name) + '：' + (c.ok === true ? '✅ ' + String(c.detail ?? '') : '❌ ' + String(c.detail ?? '')));
    }
    return [{ type: 'text', text: lines.join('\n') }];
};
export const replySchema = {
    type: 'object',
    properties: {
        account: { type: 'string' },
        mode: { type: 'string' },
        originalUid: { type: 'integer' },
        messageId: { type: 'string' },
        accepted: strArray,
        rejected: strArray,
        response: { type: 'string' },
        to: strArray,
        subject: { type: 'string' },
    },
    additionalProperties: true,
};
export const watchSchema = {
    type: 'object',
    properties: {
        account: { type: 'string' },
        folder: { type: 'string' },
        firstRun: { type: 'boolean' },
        newCount: { type: 'integer' },
        totalUnread: { type: 'integer' },
        messages: { type: 'array', items: { type: 'object', properties: messageShape, additionalProperties: true } },
    },
    additionalProperties: true,
};
export const descriptions = {
    "email_list": 'List recent emails in a mailbox folder (newest first). Returns uid, date, sender, subject and flags without message bodies; use email_read with a uid to fetch the full text. Optional since/until (dates like 2026-08-01) filter by received date.',
    "email_read": 'Read one full email message by its uid (from email_list or email_search). Returns the plain-text body (HTML mail is converted; oversized bodies are truncated) plus attachment metadata; use email_attachment to download one.',
    "email_mark": 'Change an existing message: mark it read/unread, star/unstar it, or move it to another folder. Use after email_list/email_search when the user wants to tidy the mailbox (archive, clear unread, flag important mail). Moving uses the server MOVE/COPY so the uid changes; the new uid is reported when the server provides it.',
    "email_search": 'Search emails by a keyword. The server first searches sender, recipients and subject; when that finds nothing and bodySearchFallback is enabled, recent messages are scanned locally including their body. since/until still constrain both paths. Returns the same compact rows as email_list.',
    "email_send": 'Send an email from a configured account, optionally with file attachments (absolute paths, or relative to the dsh process cwd). Sending asks the user for approval (recipient, subject and attachment count are shown) unless sendApproval is disabled; in Full Access mode the approval policy never asks, so the send is refused with an explanation instead. Never invent recipients or content without the user\'s instruction.',
    "email_reply": 'Reply to, reply-all to, or forward an existing message (mode: reply | reply-all | forward). Recipients come from the original message (your own address is excluded automatically), the subject gets a single Re:/Fwd: prefix, the original text is quoted underneath, and In-Reply-To/References headers keep mail clients threading correctly. mode=forward needs the to parameter. Like email_send, this asks the user for approval before sending. Never invent recipients or content without the user\'s instruction.',
    "email_folders": 'List the mailbox folders of an account (INBOX, Sent, Trash, custom folders, ...). Use the returned path values as the folder argument of the other email tools.',
    "email_health": 'Self-check for dsh-email: summarizes configured accounts (provider / IMAP / SMTP hosts) without any network connection and never shows passwords. Run this first when troubleshooting.',
    "email_attachment": 'Download one attachment of a message to a local file (size capped by maxAttachmentBytes). The index matches the attachments array of email_read. Returns the absolute path of the written file.',
    "email_watch": 'Check for NEW unread emails since the last check (cursor-based). The first call per account+folder sets the baseline and reports nothing as new; every later call returns only unseen unread messages. Call this periodically (e.g. via a scheduled task) to notify the user about new mail. Returns newCount, the new messages, and totalUnread.'
};
export const parameters = {
    "email_list": compileParameters({
        folder: { type: 'string', description: 'IMAP folder path (see email_folders); defaults to the account inboxFolder' },
        limit: { type: 'integer', description: 'How many messages to return, 1-100, default 20' },
        offset: { type: 'integer', description: 'Skip this many newest messages first, default 0' },
        unreadOnly: { type: 'boolean', description: 'Only list unread messages, default false' },
        since: { type: 'string', description: 'Only list messages received on or after this date, e.g. 2026-08-01 (optional)' },
        until: { type: 'string', description: 'Only list messages received on or before this date, e.g. 2026-08-26 (optional)' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_read": compileParameters({
        uid: { type: 'integer', required: true, description: 'Message uid from email_list or email_search' },
        folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_mark": compileParameters({
        uid: { type: 'integer', required: true, description: 'Message uid from email_list or email_search' },
        action: { type: 'string', required: true, description: 'What to do: read, unread, star, unstar, or move' },
        toFolder: { type: 'string', description: 'Destination folder path for action=move (see email_folders for valid paths)' },
        folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_search": compileParameters({
        query: { type: 'string', required: true, description: 'Keyword to search for' },
        folder: { type: 'string', description: 'IMAP folder to search in; defaults to the account inboxFolder' },
        limit: { type: 'integer', description: 'How many matches to return, 1-100, default 10' },
        since: { type: 'string', description: 'Only search messages received on or after this date, e.g. 2026-08-01 (optional)' },
        until: { type: 'string', description: 'Only search messages received on or before this date, e.g. 2026-08-26 (optional)' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_send": compileParameters({
        to: { type: 'string', required: true, description: 'Recipient(s), comma-separated' },
        subject: { type: 'string', required: true, description: 'Email subject' },
        text: { type: 'string', description: 'Plain-text body' },
        cc: { type: 'string', description: 'CC recipient(s), comma-separated' },
        attachments: { type: 'array', items: { type: 'string' }, description: 'File paths to attach (absolute, or relative to the dsh process cwd)' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_reply": compileParameters({
        uid: { type: 'integer', required: true, description: 'Message uid to answer/forward, from email_list or email_search' },
        text: { type: 'string', required: true, description: 'The new text to write; the original is quoted below it automatically' },
        mode: { type: 'string', description: 'reply (default), reply-all, or forward' },
        to: { type: 'string', description: 'Recipient(s) for mode=forward, comma-separated' },
        cc: { type: 'string', description: 'Extra CC recipient(s), comma-separated (optional)' },
        folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_folders": compileParameters({
        subscribedOnly: { type: 'boolean', description: 'Only subscribed folders, default false' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_health": compileParameters({}),
    "email_attachment": compileParameters({
        uid: { type: 'integer', required: true, description: 'Message uid from email_list or email_search' },
        index: { type: 'integer', description: '0-based attachment index, as listed by email_read; default 0' },
        folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_watch": compileParameters({
        folder: { type: 'string', description: 'IMAP folder path (see email_folders); defaults to the account inboxFolder' },
        limit: { type: 'integer', description: 'Max number of new messages to return, 1-100, default 20' },
        account: { type: 'string', description: ACCOUNT_HINT },
    })
};
