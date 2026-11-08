import test from 'node:test'
import assert from 'node:assert/strict'
import { folderPath, assertCustomFolder, previewFolderMutation, purgeConfirmedFolder } from '../lib/imap-folders.js'
import { EmailPool } from '../lib/mail-client.js'
import { EmailService } from '../lib/mail-service.js'
import { resolveEmailSettings } from '../lib/config.js'
import { EmailMailboxBackend } from '../lib/mailbox-web.js'
import { installSendApproval } from '../lib/approval.js'
import { buildEmailTools } from '../lib/tools.js'

const config = { provider: 'qq', user: 'fixture@example.test', password: process.env.FOLDER_TEST_SECRET || 'synthetic-only' }
const settings = () => resolveEmailSettings(config)
function imap(uids = [1, 2]) {
  const calls = [], rows = [{ path: 'INBOX', specialUse: '\\Inbox', delimiter: '/' }, { path: 'Work', delimiter: '/' }]
  const client = { mailbox: { path: 'Work', exists: uids.length, uidValidity: 12n }, capabilities: new Set(['UIDPLUS']),
    list: async () => rows, search: async () => [...uids], messageDelete: async (ids, options) => { calls.push({ ids, options }); return true },
    mailboxOpen: async path => { client.mailbox = { path, exists: 0, uidValidity: 99n }; calls.push({ open: path }); return client.mailbox },
    status: async () => ({ messages: 0, uidValidity: 12n }), mailboxDelete: async path => { calls.push({ delete: path }); return { path } } }
  return { client, calls, uids, rows }
}
test('folder path and server special-use/ancestor protection apply below UI and tools', () => {
  for (const path of ['', ' ', 'a\r\nb', 'a\0b', 'a\tb', 'a'.repeat(1025)]) assert.throws(() => folderPath(path))
  const rows = [{ path: '[Gmail]', delimiter: '/' }, { path: '[Gmail]/Archive', specialUse: '\\All', delimiter: '/' }, { path: 'Custom' }]
  for (const path of ['[Gmail]', '[Gmail]/Archive']) assert.throws(() => assertCustomFolder(path, rows), /protected/)
  assertCustomFolder('Custom', rows)
  assert.throws(() => assertCustomFolder('Unknown', rows), /no longer exists/)
})
test('purge refuses absent UIDPLUS before any mutation', async () => {
  const f = imap(); f.client.capabilities.clear()
  await assert.rejects(previewFolderMutation(f.client, 'default', 'Work', 'purge'), /UIDPLUS/)
  assert.deepEqual(f.calls, [])
})
test('purge pins reviewed UIDs and excludes mail arriving during confirmation', async () => {
  const f = imap(), preview = await previewFolderMutation(f.client, 'default', 'Work', 'purge')
  f.uids.push(3); f.client.mailbox.exists++
  assert.deepEqual(await purgeConfirmedFolder(f.client, preview), { count: 2 })
  assert.deepEqual(f.calls, [{ ids: [1, 2], options: { uid: true } }])
})
test('changed UIDVALIDITY, cancellation and uncertain server results fail closed', async () => {
  const f = imap(), preview = await previewFolderMutation(f.client, 'default', 'Work', 'purge')
  f.client.mailbox.uidValidity = 13n
  await assert.rejects(purgeConfirmedFolder(f.client, preview), /changed/); assert.deepEqual(f.calls, [])
  const ctrl = new AbortController(); ctrl.abort()
  await assert.rejects(previewFolderMutation(f.client, 'default', 'Work', 'purge', ctrl.signal), { name: 'AbortError' })
  f.client.mailbox.uidValidity = 12n; f.client.messageDelete = async () => false
  await assert.rejects(purgeConfirmedFolder(f.client, preview), /outcome uncertain/)
})
test('only an empty leaf custom folder can be deleted; no implicit CLOSE expunge', async () => {
  const nonempty = imap()
  await assert.rejects(previewFolderMutation(nonempty.client, 'default', 'Work', 'delete'), /Only empty/)
  const f = imap([]), preview = await previewFolderMutation(f.client, 'default', 'Work', 'delete'), pool = new EmailPool(settings())
  pool.withImap = async (_account, _folder, run) => run(f.client)
  await pool.deleteFolder('default', 'Work', preview)
  assert.deepEqual(f.calls, [{ open: 'INBOX' }, { delete: 'Work' }])
  f.rows.push({ path: 'Work/Child', delimiter: '/' })
  await assert.rejects(pool.deleteFolder('default', 'Work', preview), /child folders/)
  pool.dispose()
})
test('POP3/AgentMail default accounts cannot fall through to IMAP mutations', async () => {
  const service = new EmailService(resolveEmailSettings({ accounts: { api: { provider: 'agentmail', apiKey: 'fixture-key', user: 'fixture@agentmail.to' } }, defaultAccount: 'api' }))
  await assert.rejects(async () => service.createFolder('', 'Work'), /only available for IMAP/)
  service.dispose()
})
function runtimeFixture() {
  const s = settings(), calls = [], snapshot = { account: 'default', path: 'Work', action: 'purge', count: 2, uids: [1, 2], uidValidity: 12 }
  const pool = { previewFolderMutation: async (_a, _p, action) => ({ ...snapshot, action }), purgeFolder: async (...args) => { calls.push(args); return { count: 2 } }, createFolder: async (...args) => calls.push(args) }
  return { calls, s, runtime: { getPool: () => pool, getEffectiveSettings: () => s, getSettingsValue: () => ({ sendApproval: false }) } }
}
test('folder tools require independent one-use approval even with sendApproval disabled', async () => {
  const f = runtimeFixture(); let gate
  installSendApproval({ on(_event, fn) { gate = fn }, get: () => ({ request: async () => 'allowed-once' }) }, f.runtime)
  const tool = buildEmailTools(f.runtime).find(t => t.name === 'email_folder_purge'), args = Object.freeze({ path: 'Work' })
  await assert.rejects(tool.execute(args), /separate confirmation/)
  assert.equal((await gate({ name: tool.name, arguments: args }, async () => ({ kind: 'allow' }))).kind, 'allow')
  await tool.execute(args); assert.equal(f.calls.length, 1); assert.deepEqual(f.calls[0][2].uids, [1, 2])
  await assert.rejects(tool.execute(args), /separate confirmation/)
})
test('folder approval rejection and account changes cannot execute a mutation', async () => {
  const f = runtimeFixture(); let gate, allowed = false
  installSendApproval({ on(_event, fn) { gate = fn }, get: () => ({ request: async () => allowed ? 'allowed-once' : 'rejected' }) }, f.runtime)
  const tool = buildEmailTools(f.runtime).find(t => t.name === 'email_folder_create'), args = Object.freeze({ path: 'New' })
  assert.equal((await gate({ name: tool.name, arguments: args }, async () => ({ kind: 'allow' }))).kind, 'deny')
  allowed = true; await gate({ name: tool.name, arguments: args }, async () => ({ kind: 'allow' }))
  f.s.accounts.get('default').user = 'changed@example.test'
  await assert.rejects(tool.execute(args), /Account or confirmation changed/); assert.equal(f.calls.length, 0)
})
test('web destructive actions need a matching, current, one-use preview receipt', async () => {
  const f = runtimeFixture(), backend = new EmailMailboxBackend(f.runtime, {})
  const body = { account: 'default', path: 'Work', action: 'folderPurge', confirmed: true }
  await assert.rejects(backend.action(body), /preview again/)
  const preview = await backend.action({ ...body, action: 'folderPreview', operation: 'purge' })
  await assert.rejects(backend.action({ ...body, path: 'Other', receipt: preview.receipt }), /preview again/)
  await backend.action({ ...body, receipt: preview.receipt }); assert.equal(f.calls.length, 1)
  await assert.rejects(backend.action({ ...body, receipt: preview.receipt }), /preview again/)
  const next = await backend.action({ ...body, action: 'folderPreview', operation: 'purge' })
  f.s.accounts.get('default').user = 'changed@example.test'
  await assert.rejects(backend.action({ ...body, receipt: next.receipt }), /preview again/)
})
