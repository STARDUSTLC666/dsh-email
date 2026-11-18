const SYSTEM_NAME = /^(?:inbox|sent(?: messages| items)?|drafts|trash|junk(?: e-mail)?|deleted(?: messages| items)?|all mail|archives?|收件箱|已发送|草稿箱?|垃圾邮件|垃圾箱|废纸篓|已删除)$/i;
export function folderPath(value) {
    if (typeof value !== 'string' || !value.trim() || value.length > 1024 || /[\x00-\x1f\x7f]/.test(value))
        throw new Error('Invalid folder name');
    return value;
}
export function assertCustomFolder(path, rows, leaf = false) {
    folderPath(path);
    if (!rows.some(row => row.path === path))
        throw new Error('Folder no longer exists; refresh');
    const protectedRow = (row) => !!row.specialUse || SYSTEM_NAME.test(row.path.split(row.delimiter || '/').at(-1) || '');
    if (rows.some(row => protectedRow(row) && (row.path === path || !!row.delimiter && row.path.startsWith(path + row.delimiter))))
        throw new Error('System folders and their parents cannot be renamed, deleted or purged');
    if (leaf && rows.some(row => !!row.delimiter && row.path.startsWith(path + row.delimiter)))
        throw new Error('Handle child folders first');
}
export async function previewFolderMutation(client, account, path, action, signal) {
    assertCustomFolder(path, await client.list(), action === 'delete');
    signal?.throwIfAborted();
    const mailbox = client.mailbox;
    if (!mailbox || mailbox.path !== path || !Number.isSafeInteger(Number(mailbox.uidValidity)) || Number(mailbox.uidValidity) <= 0)
        throw new Error('Cannot verify mailbox identity; refresh');
    if (mailbox.exists > 2000)
        throw new Error('Use your mail client for folders with more than 2000 messages');
    const found = mailbox.exists ? await client.search({ all: true }, { uid: true }) : [];
    signal?.throwIfAborted();
    if (!Array.isArray(found) || found.length > 2000 || found.some(uid => !Number.isSafeInteger(uid) || uid < 1 || uid > 0xffffffff))
        throw new Error('Cannot verify the message list');
    const uids = [...new Set(found)].sort((a, b) => a - b);
    if (action === 'delete' && (mailbox.exists || uids.length))
        throw new Error('Only empty custom folders can be deleted; check the folder and purge it first');
    if (action === 'purge' && uids.length && !client.capabilities?.has('UIDPLUS'))
        throw new Error('Server lacks UIDPLUS; purge was cancelled and no messages changed');
    return { account, path, action, uidValidity: Number(mailbox.uidValidity), uids, count: uids.length };
}
export async function purgeConfirmedFolder(client, expected, signal) {
    const current = await previewFolderMutation(client, expected.account, expected.path, 'purge', signal);
    if (expected.action !== 'purge' || current.uidValidity !== expected.uidValidity)
        throw new Error('Mailbox changed; confirm again');
    const existing = new Set(current.uids), uids = expected.uids.filter(uid => existing.has(uid));
    if (!uids.length)
        return { count: 0 };
    signal?.throwIfAborted();
    try {
        if (!await client.messageDelete(uids, { uid: true }))
            throw new Error('delete refused');
    }
    catch {
        throw new Error('Purge outcome is uncertain; refresh and check the folder before trying again');
    }
    return { count: uids.length };
}
