import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailPool, EmailService, resolveEmailSettings } from '../lib/index.js'
import { createAgentMailPeer } from './helpers/agentmail-peer.mjs'
import { createMailboxPeer, messageSource } from './helpers/mailbox-peer.mjs'

const SOURCE = Buffer.from([
  'From: Alice <alice@example.com>',
  'To: me@example.com',
  'Subject: 打开即已读',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'body text',
].join('\r\n'))

/** EmailPool whose withImap runs against an in-memory fake mailbox. */
function poolWithMailbox({ flags = new Set(), storeFails = false, storeResult = true, writableValidity = 7, onStore } = {}) {
  const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' })),
    calls = []
  pool.withImap = async (_account, _folder, run, readOnly) => {
    calls.push(readOnly === true ? 'read-only' : 'read-write')
    return run({
      mailbox: { exists: 1, uidValidity: readOnly ? 7 : writableValidity },
      async fetchOne(uid) {
        return { uid, source: SOURCE, bodyStructure: { childNodes: [] }, flags: new Set(flags) }
      },
      async messageFlagsAdd(uid, values) {
        if (storeFails) throw new Error('mailbox is read-only')
        calls.push('flagsAdd')
        onStore?.()
        if (!storeResult) return storeResult
        for (const value of values) flags.add(value)
        return true
      },
    })
  }
  return { pool, calls, flags }
}

test('opening an unread message stores \\Seen once on a writable session', async () => {
  const { pool, calls, flags } = poolWithMailbox()
  const read = await pool.read(undefined, 42, '', undefined, { markRead: true })
  assert.equal(read.text, 'body text')
  // After the write the message really is read: the result reports the new state
  // together with the fact that this open changed it.
  assert.equal(read.seen, true)
  assert.equal(read.markedRead, true)
  assert.ok(flags.has('\\Seen'), '服务器标志位必须真的写进去')
  assert.deepEqual(calls, ['read-only', 'read-write', 'flagsAdd'])
})

test('opening does not touch a message that is already read', async () => {
  const { pool, calls } = poolWithMailbox({ flags: new Set(['\\Seen']) })
  const read = await pool.read(undefined, 42, '', undefined, { markRead: true })
  assert.equal(read.seen, true)
  assert.equal(read.markedRead, undefined)
  assert.deepEqual(calls, ['read-only'])
})

test('markRead off leaves the server state untouched', async () => {
  const { pool, calls, flags } = poolWithMailbox()
  const read = await pool.read(undefined, 42, '')
  assert.equal(read.markedRead, undefined)
  assert.equal(read.seen, false)
  assert.deepEqual(calls, ['read-only'])
  assert.deepEqual(flags, new Set())
})

test('a refused STORE never turns a successful read into an error', async () => {
  const { pool } = poolWithMailbox({ storeFails: true })
  const read = await pool.read(undefined, 42, '', undefined, { markRead: true })
  assert.equal(read.text, 'body text')
  assert.equal(read.markedRead, undefined)
  assert.equal(read.seen, false)
})

test('a false STORE result leaves the original unread state unchanged', async t => {
  const { pool, calls, flags } = poolWithMailbox({ storeResult: false })
  t.after(() => pool.dispose())
  const read = await pool.read(undefined, 42, 'INBOX', undefined, { markRead: true })
  assert.equal(read.text, 'body text')
  assert.equal(read.seen, false)
  assert.equal(read.markedRead, undefined)
  assert.deepEqual(calls, ['read-only', 'read-write', 'flagsAdd'])
  assert.deepEqual(flags, new Set())
})

test('a changed or unknown writable UIDVALIDITY never stores flags on a reused UID', async t => {
  for (const writableValidity of [8, 0]) {
    const { pool, calls, flags } = poolWithMailbox({ writableValidity })
    t.after(() => pool.dispose())
    const read = await pool.read(undefined, 42, 'INBOX', undefined, { markRead: true })
    assert.equal(read.uidValidity, 7)
    assert.equal(read.seen, false)
    assert.equal(read.markedRead, undefined)
    assert.deepEqual(calls, ['read-only', 'read-write'])
    assert.deepEqual(flags, new Set())
  }
})

test('cancellation during the after-open write preserves the original abort reason', async t => {
  const controller = new AbortController(), reason = new Error('cancel after-open STORE')
  const { pool } = poolWithMailbox({ storeResult: false, onStore: () => controller.abort(reason) })
  t.after(() => pool.dispose())
  await assert.rejects(pool.read(undefined, 42, 'INBOX', controller.signal, { markRead: true }), error => error === reason)
})

async function imapFixture(t, options = {}) {
  const peer = await createMailboxPeer(options)
  const pool = new EmailPool(resolveEmailSettings({
    user: 'fixture@example.test', password: 'synthetic-only',
    imap: { host: '127.0.0.1', port: peer.port, secure: false },
    smtp: { host: '127.0.0.1', port: peer.smtpPort, secure: false },
  }))
  t.after(async () => { pool.dispose(); await peer.close() })
  return { peer, pool }
}

test('real IMAP NO to STORE returns the parsed body without claiming it was marked read', { timeout: 20000 }, async t => {
  const { peer, pool } = await imapFixture(t, { refuseStore: true })
  const read = await pool.read(undefined, 7, 'INBOX', undefined, { markRead: true })
  assert.equal(read.subject, 'Quarterly report')
  assert.ok(read.text.length > 0)
  assert.equal(read.seen, false)
  assert.equal(read.markedRead, undefined)
  assert.equal(peer.folders.get('INBOX').messages[0].seen, false)
  assert.equal(peer.commands.filter(command => /^UID STORE /.test(command)).length, 1)
})

test('real IMAP replacement between EXAMINE and SELECT does not mark the new mailbox message', { timeout: 20000 }, async t => {
  const { peer, pool } = await imapFixture(t, { onOpen({ readOnly, mailbox }) {
    if (!readOnly) {
      mailbox.validity = 99
      mailbox.messages[0].subject = 'Replacement message'
      mailbox.messages[0].source = messageSource('Replacement message')
    }
  } })
  const read = await pool.read(undefined, 7, 'INBOX', undefined, { markRead: true })
  assert.equal(read.subject, 'Quarterly report')
  assert.equal(read.uidValidity, 11)
  assert.equal(read.seen, false)
  assert.equal(read.markedRead, undefined)
  assert.equal(peer.folders.get('INBOX').validity, 99)
  assert.equal(peer.folders.get('INBOX').messages[0].seen, false)
  assert.ok(peer.commands.some(command => /^SELECT /.test(command)))
  assert.ok(!peer.commands.some(command => /^UID STORE /.test(command)))
})

test('real IMAP successful open invalidates cached STATUS counts, while passive reads remain cached', { timeout: 20000 }, async t => {
  const { peer, pool } = await imapFixture(t)
  const unseen = result => result.folders.find(row => row.path === 'INBOX').unseen
  const statusRequests = () => peer.commands.filter(command => /^STATUS /.test(command)).length
  assert.equal(unseen(await pool.folders(undefined, false)), 2)
  const before = statusRequests()
  await pool.folders(undefined, false)
  assert.equal(statusRequests(), before)
  const read = await pool.read(undefined, 7, 'INBOX', undefined, { markRead: true })
  assert.equal(read.markedRead, true)
  assert.equal(peer.folders.get('INBOX').messages[0].seen, true)
  assert.equal(unseen(await pool.folders(undefined, false)), 1)
  assert.equal(statusRequests(), before + 2)
  peer.folders.get('INBOX').messages[1].seen = true
  assert.equal(unseen(await pool.folders(undefined, false)), 1)
  assert.equal(unseen(await pool.folders(undefined, false, undefined, { refresh: true })), 0)
  assert.equal(statusRequests(), before + 4)
})

test('EmailService honours markReadOnOpen: on by default, off when configured', async () => {
  const mailbox = () => {
    const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' }))
    const calls = []
    pool.withImap = async (_account, _folder, run, readOnly) => {
      calls.push(readOnly === true ? 'read-only' : 'read-write')
      return run({
        mailbox: { exists: 1, uidValidity: 7 },
        async fetchOne(uid) {
          return { uid, source: SOURCE, bodyStructure: { childNodes: [] }, flags: new Set() }
        },
        async messageFlagsAdd() { calls.push('flagsAdd'); return true },
      })
    }
    return { pool, calls }
  }

  const on = mailbox()
  const serviceOn = new EmailService(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' }))
  serviceOn.withImap = on.pool.withImap
  try {
    const read = await serviceOn.read(undefined, 42, 'INBOX')
    assert.equal(read.markedRead, true)
    assert.ok(on.calls.includes('flagsAdd'), '默认设置必须读后置已读')
  } finally {
    serviceOn.dispose()
  }

  const off = mailbox()
  const serviceOff = new EmailService(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p', markReadOnOpen: false }))
  serviceOff.withImap = off.pool.withImap
  try {
    const read = await serviceOff.read(undefined, 42, 'INBOX')
    assert.equal(read.markedRead, undefined)
    assert.equal(off.calls.includes('flagsAdd'), false)
  } finally {
    serviceOff.dispose()
  }
})

test('preparing a reply draft never marks the original read', async () => {
  // approval prepares the reply *before* the user approves it and the user can
  // still deny it, and a draft made from the reader is not a fresh open either
  // (opening the message already stored \Seen). Reading the original to quote
  // it must therefore stay read-only, or a denied reply would silently clear
  // the unread state, the email_watch count and the new-mail popup.
  const calls = []
  const service = new EmailService(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' }))
  service.withImap = async (_account, _folder, run, readOnly) => {
    calls.push(readOnly === true ? 'read-only' : 'read-write')
    return run({
      mailbox: { exists: 1, uidValidity: 7 },
      async fetchOne(uid) {
        return { uid, source: SOURCE, bodyStructure: { childNodes: [] }, flags: new Set() }
      },
      async messageFlagsAdd() { calls.push('flagsAdd'); return true },
    })
  }
  try {
    const prepared = await service.prepareReply(undefined, 'INBOX', 42, 'reply', '收到', 'bob@example.com')
    assert.equal(prepared.reply.uid, 42)
    assert.equal(prepared.reply.folder, 'INBOX')
    assert.equal(calls.includes('flagsAdd'), false, '组回复草稿不能替用户把未读清掉')
    assert.deepEqual(calls, ['read-only'])
  } finally {
    service.dispose()
  }
})

test('AgentMail read drops the unread label only when markReadOnOpen is on', async (t) => {
  const peer = await createAgentMailPeer()
  t.after(() => peer.close())
  const on = new EmailService(
    resolveEmailSettings({ provider: 'agentmail', user: peer.inbox, apiKey: 'synthetic-agentmail-key' }),
    { fetch: peer.fetcher },
  )
  t.after(() => on.dispose())
  const unread = peer.messages[1]
  const read = await on.read('default', unread.message_id, 'INBOX')
  assert.equal(read.markedRead, true)
  assert.equal(read.seen, true)
  assert.ok(!unread.labels.includes('unread'))

  const off = new EmailService(
    resolveEmailSettings({ provider: 'agentmail', user: peer.inbox, apiKey: 'synthetic-agentmail-key', markReadOnOpen: false }),
    { fetch: peer.fetcher },
  )
  t.after(() => off.dispose())
  const untouched = peer.messages[2]
  const plain = await off.read('default', untouched.message_id, 'INBOX')
  assert.equal(plain.markedRead, undefined)
  assert.equal(plain.seen, false)
  assert.ok(untouched.labels.includes('unread'))
})
