import type { ImapFlow } from 'imapflow'
import type { EmailMovePreview, EmailMoveResult } from './types.js'

export function moveUids(input: unknown): number[] {
  if (!Array.isArray(input) || !input.length || input.length > 20) throw new Error('每次请选择 1–20 封邮件 / Select 1–20 messages')
  const uids = input.map(uid => typeof uid === 'string' && /^\d+$/.test(uid) ? Number(uid) : uid)
  if (uids.some(uid => !Number.isSafeInteger(uid) || uid <= 0 || uid > 0xffffffff) || new Set(uids).size !== uids.length) throw new Error('邮件编号无效，请刷新列表 / Invalid UIDs; refresh the list')
  return uids as number[]
}
function validity(client: ImapFlow) {
  const value = client.mailbox && Number(client.mailbox.uidValidity)
  if (!value || !Number.isSafeInteger(value)) throw new Error('服务器未提供 UIDVALIDITY，无法确认邮件身份 / UIDVALIDITY is required')
  return value
}
async function targetFolder(client: ImapFlow, folder: string, requested?: string) {
  if (!client.capabilities?.has('MOVE') && !client.capabilities?.has('UIDPLUS')) throw new Error('服务器缺少 MOVE/UIDPLUS，无法安全移入废纸篓 / Safe move requires MOVE or UIDPLUS')
  const rows = (await client.list()).filter(row => !row.flags?.has('\\Noselect'))
  const target = requested || rows.find(row => row.specialUse === '\\Trash')?.path
  if (!target) throw new Error('没有找到废纸篓，请选择已有目标文件夹 / Choose an existing Trash folder')
  if (target.length > 1024 || /[\r\n\0]/.test(target) || !rows.some(row => row.path === target)) throw new Error('目标文件夹不存在 / Target folder does not exist')
  if (target === folder) throw new Error('邮件已经在此文件夹中 / Messages are already in this folder')
  return target
}
export async function previewImapTrash(client: ImapFlow, account: string, folder: string, input: unknown, requested?: string, signal?: AbortSignal): Promise<EmailMovePreview> {
  const uids = moveUids(input), uidValidity = validity(client), target = await targetFolder(client, folder, requested), messages = []
  for (const uid of uids) {
    signal?.throwIfAborted()
    const message = await client.fetchOne(uid, { uid: true, envelope: true }, { uid: true })
    if (!message || message.uid !== uid) throw new Error('部分邮件已不存在，请刷新列表 / Some messages no longer exist; refresh')
    messages.push({ uid, subject: (message.envelope?.subject || '').slice(0, 500) })
  }
  return { account, folder, target, uidValidity, messages }
}
export async function moveImapMessages(client: ImapFlow, folder: string, input: unknown, target: string, expected: number, signal?: AbortSignal): Promise<EmailMoveResult> {
  const uids = moveUids(input)
  if (validity(client) !== expected) throw new Error('UIDVALIDITY 已改变，请刷新并重新确认 / Mailbox changed; refresh and confirm again')
  await targetFolder(client, folder, target)
  for (const uid of uids) {
    signal?.throwIfAborted()
    const message = await client.fetchOne(uid, { uid: true }, { uid: true })
    if (!message || message.uid !== uid) throw new Error('部分邮件已改变，尚未执行移动，请刷新 / Messages changed; refresh before moving')
  }
  signal?.throwIfAborted()
  let moved
  try {
    moved = await client.messageMove(uids, target, { uid: true })
    if (!moved) throw new Error('MOVE refused')
  } catch {
    throw new Error('未能确认移动结果，请刷新原文件夹和废纸篓后核对，不要直接重复操作 / Move result uncertain; refresh both folders before retrying')
  }
  const destinationUids = moved.uidMap ? uids.map(uid => moved.uidMap!.get(uid)) : [], destinationValidity = Number(moved.uidValidity)
  const mapped = destinationUids.length === uids.length && destinationUids.every(uid => uid && Number.isSafeInteger(uid)) && new Set(destinationUids).size === uids.length
  return { count: uids.length, ...(mapped && Number.isSafeInteger(destinationValidity) && destinationValidity > 0 ? { destinationUids: destinationUids as number[], destinationValidity } : {}) }
}
