import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailPool, resolveEmailSettings } from '../lib/index.js'

function withClient(client) {
  const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'fixture@example.invalid', password: 'fixture' }))
  pool.withImap = async (_name, _folder, operation) => operation(client)
  return pool
}

for (const missing of [false, undefined]) {
  test(`messages removed during an IMAP request give a useful error (${String(missing)})`, async () => {
    const pool = withClient({ mailbox: { exists: 0 }, fetchOne: async () => missing })
    await assert.rejects(pool.read(undefined, 42, 'INBOX'), /找不到 uid=42/)
    await assert.rejects(pool.mark(undefined, 'INBOX', 42, 'read'), /找不到 uid=42/)
    await assert.rejects(pool.reply(undefined, 'INBOX', 42, 'reply', 'fixture', '', undefined), /找不到 uid=42/)
    await assert.rejects(pool.downloadAttachment(undefined, 'INBOX', 42, 0), /找不到 uid=42/)
  })
  test(`empty IMAP search results remain an empty list (${String(missing)})`, async () => {
    const pool = withClient({ mailbox: { exists: 0 }, search: async () => missing, fetchAll: async () => [] })
    assert.deepEqual((await pool.unseenUids(undefined, 'INBOX')).uids, [])
    assert.deepEqual((await pool.list(undefined, 'INBOX', 10, 0, true)).messages, [])
    assert.deepEqual((await pool.search(undefined, 'fixture', 'INBOX', 10, 0)).messages, [])
  })
}

test('an attachment removed between listing and download reports recovery without writing a file', async () => {
  const pool = withClient({ download: async () => ({}) })
  pool.attachmentIndexOf = async () => ({ attachments: [{ filename: 'fixture.txt', contentType: 'text/plain', size: 4 }], parts: [{ part: '2', filename: 'fixture.txt', contentType: 'text/plain', size: 4 }] })
  await assert.rejects(pool.downloadAttachment(undefined, 'INBOX', 42, 0), /附件分段已不存在/)
})
