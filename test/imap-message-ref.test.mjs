import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { EmailPool, EmailService, resolveEmailSettings } from '../lib/index.js'
import { buildEmailTools } from '../lib/tools.js'
import { createAgentMailPeer } from './helpers/agentmail-peer.mjs'

const settings = () => resolveEmailSettings({ provider: 'qq', user: 'fixture@qq.com', password: 'synthetic-password' })

test('tool read, mark and attachment accept the same decimal-string IMAP UID as list returns', async t => {
  const root = await mkdtemp(join(import.meta.dirname, '.uid-fixture-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const config = settings(), service = new EmailService(config), calls = [], flags = new Set()
  service.withImap = async (_account, _folder, run) => run({
    mailbox: { exists: 1, uidValidity: 1 },
    async fetchOne(uid) {
      calls.push(['fetch', uid])
      return { uid, flags, envelope: { subject: 'String UID message', from: [], to: [], cc: [] }, bodyStructure: { childNodes: [
        { part: '1', type: 'text/plain', size: 4 },
        { part: '2', type: 'text/plain', size: 7, disposition: 'attachment', dispositionParameters: { filename: 'note.txt' } },
      ] } }
    },
    async download(uid, part) {
      calls.push(['download', uid])
      return { meta: { filename: 'note.txt' }, content: Readable.from([part === '1' ? 'body' : 'fixture']) }
    },
    async messageFlagsAdd(uid, values) { calls.push(['mark', uid]); values.forEach(value => flags.add(value)); return true },
  })
  const tools = buildEmailTools({ getPool: () => service, getEffectiveSettings: () => config })
  const read = await tools.find(tool => tool.name === 'email_read').execute({ uid: '2302' })
  assert.equal(read.uid, 2302)
  assert.equal(read.text, 'body')
  const marked = await tools.find(tool => tool.name === 'email_mark').execute({ uid: '002302', action: 'read' })
  assert.equal(marked.uid, 2302)
  assert.equal(marked.seen, true)
  const attachment = await service.downloadAttachment(undefined, 'INBOX', '2302', 0, root)
  assert.equal(await readFile(attachment.path, 'utf8'), 'fixture')
  assert.ok(calls.length >= 4)
  assert.ok(calls.every(([, uid]) => uid === 2302), JSON.stringify(calls))
  assert.equal((await service.read(undefined, 2302, 'INBOX')).uid, 2302)
})

test('IMAP replies and prepared draft replies normalize decimal-string UIDs at the transport boundary', async t => {
  const calls = []
  t.mock.method(EmailPool.prototype, 'reply', async (...args) => { calls.push(args[2]); return { originalUid: args[2] } })
  t.mock.method(EmailPool.prototype, 'sendPrepared', async (...args) => { calls.push(args[7].uid); return { messageId: 'synthetic' } })
  const service = new EmailService(settings())
  assert.equal((await service.reply(undefined, 'INBOX', '2302', 'reply', 'Body', '', '')).originalUid, 2302)
  await service.sendPrepared('default', 'human@example.invalid', 'Reply', 'Body', '', [], undefined, { uid: '2302', folder: 'INBOX', uidValidity: 1 })
  assert.deepEqual(calls, [2302, 2302])
})

test('invalid and unsafe IMAP identifiers fail before opening any connection', async () => {
  const service = new EmailService(settings())
  let calls = 0
  service.withImap = async () => { calls++; throw new Error('unexpected connection') }
  for (const uid of ['0', '-1', '+1', '1.5', '1e3', ' 2302', '2302 ', '2302\n', '<api-message>', '9007199254740993', '', 0, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    for (const operation of [
      () => service.read(undefined, uid, 'INBOX'),
      () => service.mark(undefined, 'INBOX', uid, 'read'),
      () => service.downloadAttachment(undefined, 'INBOX', uid, 0),
      () => service.reply(undefined, 'INBOX', uid, 'reply', 'Body', '', ''),
    ]) await assert.rejects(async () => operation(), /IMAP uid.*正整数/)
  }
  assert.equal(calls, 0)
})

test('AgentMail numeric-looking message IDs remain opaque and retain leading zeroes', async t => {
  const peer = await createAgentMailPeer()
  t.after(() => peer.close())
  peer.messages[0].message_id = '002302'
  const service = new EmailService(resolveEmailSettings({ provider: 'agentmail', user: 'assistant@agentmail.to', apiKey: 'synthetic-agentmail-key' }), { fetch: peer.fetcher })
  const message = await service.read('default', '002302', 'INBOX')
  assert.equal(message.uid, '002302')
})
