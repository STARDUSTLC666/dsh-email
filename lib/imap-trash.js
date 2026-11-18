export function moveUids(input) {
    if (!Array.isArray(input) || !input.length || input.length > 20)
        throw new Error('Select 1–20 messages per operation');
    const uids = input.map(uid => typeof uid === 'string' && /^\d+$/.test(uid) ? Number(uid) : uid);
    if (uids.some(uid => !Number.isSafeInteger(uid) || uid <= 0 || uid > 0xffffffff) || new Set(uids).size !== uids.length)
        throw new Error('Invalid UIDs; refresh the list');
    return uids;
}
function validity(client) {
    const value = client.mailbox && Number(client.mailbox.uidValidity);
    if (!value || !Number.isSafeInteger(value))
        throw new Error('Server did not provide UIDVALIDITY; message identity cannot be verified');
    return value;
}
async function targetFolder(client, folder, requested) {
    if (!client.capabilities?.has('MOVE') && !client.capabilities?.has('UIDPLUS'))
        throw new Error('Server lacks MOVE and UIDPLUS; messages cannot be moved to Trash safely');
    const rows = (await client.list()).filter(row => !row.flags?.has('\\Noselect'));
    const target = requested || rows.find(row => row.specialUse === '\\Trash')?.path;
    if (!target)
        throw new Error('No Trash folder found; choose an existing target folder');
    if (target.length > 1024 || /[\r\n\0]/.test(target) || !rows.some(row => row.path === target))
        throw new Error('Target folder does not exist');
    if (target === folder)
        throw new Error('Messages are already in this folder');
    return target;
}
export async function previewImapTrash(client, account, folder, input, requested, signal) {
    const uids = moveUids(input), uidValidity = validity(client), target = await targetFolder(client, folder, requested), messages = [];
    for (const uid of uids) {
        signal?.throwIfAborted();
        const message = await client.fetchOne(uid, { uid: true, envelope: true }, { uid: true });
        if (!message || message.uid !== uid)
            throw new Error('Some messages no longer exist; refresh the list');
        messages.push({ uid, subject: (message.envelope?.subject || '').slice(0, 500) });
    }
    return { account, folder, target, uidValidity, messages };
}
export async function moveImapMessages(client, folder, input, target, expected, signal) {
    const uids = moveUids(input);
    if (validity(client) !== expected)
        throw new Error('UIDVALIDITY changed; refresh and confirm again');
    await targetFolder(client, folder, target);
    for (const uid of uids) {
        signal?.throwIfAborted();
        const message = await client.fetchOne(uid, { uid: true }, { uid: true });
        if (!message || message.uid !== uid)
            throw new Error('Some messages changed and nothing was moved; refresh and retry');
    }
    signal?.throwIfAborted();
    let moved;
    try {
        moved = await client.messageMove(uids, target, { uid: true });
        if (!moved)
            throw new Error('MOVE refused');
    }
    catch {
        throw new Error('Move outcome is uncertain; refresh both folders and check before retrying');
    }
    const destinationUids = moved.uidMap ? uids.map(uid => moved.uidMap.get(uid)) : [], destinationValidity = Number(moved.uidValidity);
    const mapped = destinationUids.length === uids.length && destinationUids.every(uid => uid && Number.isSafeInteger(uid)) && new Set(destinationUids).size === uids.length;
    return { count: uids.length, ...(mapped && Number.isSafeInteger(destinationValidity) && destinationValidity > 0 ? { destinationUids: destinationUids, destinationValidity } : {}) };
}
