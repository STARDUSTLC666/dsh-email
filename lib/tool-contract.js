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
        else if (Array.isArray(prop?.type))
            node.oneOf = prop.type.map(type => ({ type }));
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
    uid: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
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
        countExact: { type: 'boolean' },
        hasMore: { type: 'boolean' },
        order: { type: 'string' },
        searchSource: { type: 'string' },
        folder: { type: 'string' },
        messages: { type: 'array', items: { type: 'object', properties: messageShape, additionalProperties: true } },
    },
    additionalProperties: true,
};
export const readSchema = {
    type: 'object',
    properties: {
        account: { type: 'string' },
        uid: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
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
        uid: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
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
        uid: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
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
        message.flagsSupported === false || message.seen ? '' : '未读',
        message.flagged ? '已标星' : '',
        message.hasAttachments ? '含附件' : '',
    ].filter(Boolean);
    const parts = ['uid=' + message.uid, from, message.date];
    if (flags.length > 0)
        parts.push(flags.join('、'));
    return (message.subject || '(无主题)') + ' [' + parts.join(' | ') + ']';
}
export function renderList(value) {
    if (value.transport === 'pop3')
        return oneText('账号 ' + value.account + '，POP3 收件箱：本页 ' + value.messages.length + ' 封，' + (value.countExact ? '邮箱共 ' : '当前扫描匹配 ') + value.count + ' 封。POP3 不提供服务器已读、星标或已发送文件夹。' + (value.headerScan ? ' 本次扫描 ' + value.headerScan.scanned + ' / ' + value.headerScan.mailboxTotal + ' 封的 Date 头；不是服务器接收时间。' : '') + '\n\n' + value.messages.map(describeMessage).join('\n'));
    if (value.countExact !== undefined)
        return oneText('账号 ' + value.account + '，文件夹 ' + value.folder + '：本页 ' + value.messages.length + ' 封' + (value.hasMore ? '，还有更多' : '') + '（不把 API 页数当作邮箱总数）\n\n' + value.messages.map(describeMessage).join('\n'));
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
    if (value.searchSource === 'api')
        return oneText('AgentMail 搜索（按相关性，服务排除垃圾箱等特殊邮件）：本页 ' + value.messages.length + ' 条' + (value.hasMore ? '，还有更多；可增加 offset 继续' : '') + '\n\n' + value.messages.map(describeMessage).join('\n'));
    if (value.headerScan) {
        const scan = value.headerScan;
        const window = scan.scanOffset === 0 ? '最近 ' + scan.scanned : '跳过最新 ' + scan.scanOffset + ' 封后的 ' + scan.scanned;
        const completeness = scan.complete ? '完整信封扫描' : '未覆盖全文件夹';
        const continuation = scan.nextScanOffset === undefined ? '' : '；继续更早信封可用 headerScanOffset=' + scan.nextScanOffset + '、headerScanLimit=' + scan.scanLimit;
        const body = value.bodyScan ? '；正文只检查 ' + value.bodyScan.scanned + ' 封（上限 ' + value.bodyScan.scanLimit + '），正文未覆盖全文件夹' : '；未扫描正文';
        const server = value.serverSearchFailed ? '服务端部分搜索失败' : '服务端候选 ' + (value.serverMatchCount ?? 0) + ' 条';
        const note = server + '；已扫描' + window + ' 封的信封（文件夹共 ' + scan.mailboxTotal + ' 封，' + completeness + '，窗口内信封命中 ' + scan.matched + ' 条）' + continuation + body;
        const summary = (value.messages.length ? '本页 ' + value.messages.length + ' 条' : '本页未命中，不能据此断言整个邮箱没有匹配') + (value.offset > 0 ? '，已跳过最新 ' + value.offset + ' 条匹配' : '');
        const rows = value.messages.map((message, i) => '#' + (i + 1) + ' ' + describeMessage(message));
        return oneText('账号 ' + value.account + '，在文件夹 "' + value.folder + '" 中搜索 "' + value.query + '"：' + summary + '。' + note + (rows.length ? '\n\n' + rows.join('\n') : ''));
    }
    if (value.searchSource === 'server') {
        const rows = value.messages.map((message, i) => '#' + (i + 1) + ' ' + describeMessage(message));
        return oneText('账号 ' + value.account + '，在文件夹 "' + value.folder + '" 中搜索 "' + value.query + '"：服务端报告 ' + value.count + ' 个候选；已核实本页 ' + value.messages.length + ' 条（跳过最新 ' + value.offset + ' 条）。' + (rows.length ? '\n\n' + rows.join('\n') : ''));
    }
    const scanned = value.countKind === 'scanned';
    // 回退扫描只看了最近 scannedLimit 封，不知道全文件夹匹配数：不能把本页条数说成「共 N 条」。
    const scannedNote = '仅扫描最近 ' + (value.scannedLimit ?? 0) + ' 封，未统计全文件夹匹配数';
    if (value.messages.length === 0) {
        if (scanned) {
            return oneText('账号 ' + value.account + '，在文件夹 "' + value.folder + '" 中搜索 "' + value.query + '"：本页没有匹配（' + scannedNote + '）。');
        }
        return oneText('账号 ' + value.account + '，在文件夹 "' + value.folder + '" 中搜索 "' + value.query + '"：共 ' + value.count + ' 条匹配，本次没有列出。');
    }
    const lines = value.messages.map((m, i) => '#' + (i + 1) + ' ' + describeMessage(m));
    const offset = value.offset ?? 0;
    const window = offset > 0
        ? '跳过最新 ' + offset + ' 条后展示 ' + value.messages.length + ' 条'
        : '展示最新 ' + value.messages.length + ' 条';
    const summary = scanned
        ? '本页 ' + value.messages.length + ' 条（' + scannedNote + '）' + (offset > 0 ? '，已被 offset 跳过最新 ' + offset + ' 条' : '')
        : '共 ' + value.count + ' 条匹配，' + window;
    return oneText('账号 ' + value.account + '，在文件夹 "' + value.folder + '" 中搜索 "' + value.query + '"：' + summary + '：\n\n' + lines.join('\n'));
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
    const unread = value.transport === 'pop3' ? 'POP3 不提供服务器未读总数' : (value.totalUnreadExact === false ? '本次扫描至少未读 ' : '当前未读 ') + value.totalUnread + ' 封';
    if (value.reset === true) {
        return oneText('账号 ' + value.account + '：文件夹 "' + value.folder + '" 的 UIDVALIDITY 已变化（服务器重新编号了邮件），已重新建立基线（当前未读 ' + value.totalUnread + ' 封）。这次不报告新邮件，之后照常。');
    }
    if (value.firstRun) {
        return oneText('账号 ' + value.account + '：已建立新邮件监视基线（' + unread + '）。之后调用 email_watch 只会报告新到的邮件。');
    }
    if (value.newCount === 0) {
        return oneText('账号 ' + value.account + '：没有新邮件（' + unread + '）。');
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
        originalUid: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
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
        reset: { type: 'boolean' },
        newCount: { type: 'integer' },
        totalUnread: { type: 'integer' },
        totalUnreadExact: { type: 'boolean' },
        messages: { type: 'array', items: { type: 'object', properties: messageShape, additionalProperties: true } },
    },
    additionalProperties: true,
};
export const descriptions = {
    "email_list": 'IMAP uid is a positive integer; AgentMail uid is an opaque string message_id. AgentMail returns page counts: inspect hasMore/countExact instead of assuming mailbox totals. List recent emails in a mailbox folder (newest first). Returns uid, date, sender, subject and flags without message bodies; use email_read with a uid to fetch the full text. Optional since/until (dates like 2026-08-01) filter by received date.',
    "email_read": 'Read one full email message by its uid (from email_list or email_search). Returns the plain-text body (HTML mail is converted; oversized bodies are truncated) plus attachment metadata; use email_attachment to download one.',
    "email_mark": 'AgentMail supports flags and only INBOX-to-Archive label archiving; arbitrary IMAP moves are not supported there. Change an existing message: mark it read/unread, star/unstar it, or move it to another folder. Use after email_list/email_search when the user wants to tidy the mailbox (archive, clear unread, flag important mail). Moving uses the server MOVE/COPY so the uid changes; the new uid is reported when the server provides it.',
    "email_search": 'AgentMail accounts use API relevance search (searchSource=api), exclude spam/trash/blocked/unauthenticated mail, and page with offset; headerScanOffset and IMAP fallbacks do not apply. For IMAP: Search sender, recipients and subject; verify server candidates against envelopes and arrival dates. If server SEARCH is empty, fails, or has no confirmed matches, scan local headers in batches without downloading bodies/attachments (default newest 5000, max 20000). headerScanOffset/Limit select an older header window; use headerScan.nextScanOffset to continue. offset pages MATCHES within that window. If no headers match and headerScanOffset=0, optional body fallback scans only bodySearchLimit recent arrivals. Inspect searchSource/headerScan/bodyScan: partial or zero results never prove the whole mailbox has no match. Results use descending mailbox UID arrival order, not Date-header or INTERNALDATE sorting. since/until filter INTERNALDATE (Date header only if unavailable).',
    "email_send": 'AgentMail has a plugin limit of 10 attachments / 4 MiB total and uses its inbox API; a receipt means submission, not delivery. Send an email from a configured account, optionally with file attachments (absolute paths, or relative to the current session workspace; process cwd is the fallback without a session). Saved blocked-address/domain rules reject To/Cc recipients even when sendApproval is off. Plugin confirmation is required by default, unless sendApproval is disabled or every To/Cc recipient matches saved trust rules with skipApproval enabled. Host permissions still apply. Full Access refuses a send that still requires plugin confirmation; use email_draft for human review and explicit sending. Never invent recipients or content without the user\'s instruction.',
    "email_reply": 'AgentMail reply/reply-all uses its thread-aware reply API; forwarding creates a new message. Reply to, reply-all to, or forward an existing message (mode: reply | reply-all | forward). Recipients come from the original message (your own address is excluded automatically), the subject gets a single Re:/Fwd: prefix, the original text is quoted underneath, and In-Reply-To/References headers keep mail clients threading correctly. mode=forward needs the to parameter. Plugin confirmation is required unless sendApproval is disabled; trusted-recipient skipping only applies to email_send. Blocked recipients still stop delivery before SMTP and host permissions remain in effect. Never invent recipients or content without the user\'s instruction.',
    "email_folders": 'List the mailbox folders of an account (INBOX, Sent, Trash, custom folders, ...). Use the returned path values as the folder argument of the other email tools.',
    "email_health": 'AgentMail accounts show fixed regional API endpoints instead of IMAP/SMTP servers. Self-check for dsh-email: summarizes configured accounts (provider / IMAP / SMTP hosts) without any network connection and never shows passwords. Run this first when troubleshooting.',
    "email_attachment": 'AgentMail downloads are limited to 20 MiB or the smaller configured maximum. Download one attachment of a message to a local file (size capped by maxAttachmentBytes). The index matches the attachments array of email_read. Returns the absolute path of the written file.',
    "email_watch": 'Check for NEW unread emails since the last check (cursor-based). The first call per account+folder sets the baseline and reports nothing as new; every later call returns only unseen unread messages. Call this periodically (e.g. via a scheduled task) to notify the user about new mail. Returns newCount, the new messages, and totalUnread.'
};
// Transport boundaries precede generic guidance so models do not request IMAP-only mutations.
const pop3Descriptions = {
    email_list: 'POP3 accounts use opaque pop3: UIDL references and INBOX only. They do not expose server unread/star flags. Date filters scan only the newest 500 Date headers and report coverage. TOP may fall back to bounded RETR. ',
    email_mark: 'POP3 does not support read/unread/star/move and rejects these operations without changing mail. ',
    email_search: 'POP3 performs local header search (default newest 100, max 500 per window), continues with headerScan.nextScanOffset, and optionally scans bodySearchLimit bodies when no header matches. Inspect actual scan coverage; it is not server SEARCH. POP3 since/until compare sender Date headers, not server receipt dates. ',
    email_reply: 'POP3 originals are read by stable UIDL; replies and forwards use the existing SMTP and confirmation flow. ',
    email_folders: 'POP3 exposes only INBOX; server Sent, Archive and flags are unavailable. ',
    email_health: 'POP3 accounts report POP3/SMTP configuration; a configuration check is not a network connectivity test. ',
    email_attachment: 'POP3 downloads the entire source message (max 32 MiB) to parse an attachment (max 20 MiB or configured lower limit). ',
    email_watch: 'POP3 watches newly appearing UIDLs, not unread flags. Its first call seeds a baseline, and totalUnreadExact=false with transport=pop3 means no server unread total is available. ',
};
for (const key of Object.keys(pop3Descriptions))
    descriptions[key] = pop3Descriptions[key] + descriptions[key];
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
        uid: { type: ['integer', 'string'], required: true, description: 'IMAP positive integer uid or unchanged AgentMail string message_id from email_list or email_search' },
        folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_mark": compileParameters({
        uid: { type: ['integer', 'string'], required: true, description: 'IMAP positive integer uid or unchanged AgentMail string message_id from email_list or email_search' },
        action: { type: 'string', required: true, description: 'What to do: read, unread, star, unstar, or move' },
        toFolder: { type: 'string', description: 'Destination folder path for action=move (see email_folders for valid paths)' },
        folder: { type: 'string', description: 'IMAP folder the uid belongs to; defaults to the account inboxFolder' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_search": compileParameters({
        query: { type: 'string', required: true, description: 'Keyword to search for' },
        folder: { type: 'string', description: 'IMAP folder to search in; defaults to the account inboxFolder' },
        limit: { type: 'integer', description: 'How many matches to return, 1-100, default 10' },
        offset: { type: 'integer', description: 'Skip this many newest matches first, default 0' },
        headerScanLimit: { type: 'integer', description: 'Local header fallback window size, 1-20000; default 5000. Headers only, no bodies or attachments.' },
        headerScanOffset: { type: 'integer', description: 'Skip this many newest arrivals for the local header window; default 0. Continue with headerScan.nextScanOffset. Independent of match offset; a nonzero value skips body fallback.' },
        since: { type: 'string', description: 'Only search messages received on or after this date, e.g. 2026-08-01 (optional)' },
        until: { type: 'string', description: 'Only search messages received on or before this date, e.g. 2026-08-26 (optional)' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_send": compileParameters({
        to: { type: 'string', required: true, description: 'Recipient(s), comma-separated' },
        subject: { type: 'string', required: true, description: 'Email subject' },
        text: { type: 'string', description: 'Plain-text body' },
        cc: { type: 'string', description: 'CC recipient(s), comma-separated' },
        attachments: { type: 'array', items: { type: 'string' }, description: 'File paths to attach (absolute, or relative to the current session workspace; process cwd is the fallback without a session)' },
        account: { type: 'string', description: ACCOUNT_HINT },
    }),
    "email_reply": compileParameters({
        uid: { type: ['integer', 'string'], required: true, description: 'IMAP positive integer uid or unchanged AgentMail string message_id to answer/forward, from email_list or email_search' },
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
        uid: { type: ['integer', 'string'], required: true, description: 'IMAP positive integer uid or unchanged AgentMail string message_id from email_list or email_search' },
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
