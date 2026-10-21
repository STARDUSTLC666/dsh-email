import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailPool, resolveEmailSettings } from '../lib/index.js'
import { renderSearch } from '../lib/tool-contract.js'

function mailbox(total = 2268) {
  return Array.from({ length: total }, (_, index) => ({
    seq: index + 1, uid: index + 107, flags: new Set(), size: 100,
    envelope: { subject: 'Imported old message', from: [{ address: 'other@example.invalid' }], to: [], cc: [], date: new Date('2022-01-01T00:00:00Z') },
    internalDate: new Date('2026-10-20T01:00:00Z'),
  }))
}
function fixture(messages, options = {}) {
  const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'local@example.invalid', password: 'synthetic', ...options }))
  const calls = []
  const client = {
    mailbox: { exists: messages.length },
    search: async () => [],
    async fetchAll(range, fields, config) {
      calls.push({ range, fields, config })
      if (Array.isArray(range)) return messages.filter(message => range.includes(message.uid))
      const [from, to] = range.split(':').map(value => value === '*' ? messages.length : Number(value))
      return messages.filter(message => message.seq >= from && message.seq <= to)
    },
    async download() { assert.fail('Header search must not download bodies or attachments') },
  }
  pool.withImap = async (_account, _folder, run) => run(client)
  return { pool, calls, client }
}

test('QQ empty SEARCH still finds header matches beyond the last 30 and 71 imported messages', async () => {
  const messages = mailbox()
  const github = messages.find(message => message.uid === 2303)
  github.envelope.from = [{ address: 'notifications@github.com' }]
  messages.find(message => message.uid === 2211).envelope.subject = '[project/chenxin] CI failed'
  const { pool, calls } = fixture(messages)
  for (const [query, uid] of [['github', 2303], ['chenxin', 2211]]) {
    const result = await pool.search(undefined, query, 'INBOX', 10, 0)
    assert.deepEqual(result.messages.map(message => message.uid), [uid])
    assert.equal(result.searchSource, 'local-headers')
    assert.equal(result.serverMatchCount, 0)
    assert.equal(result.headerScan.scanned, 2268)
    assert.equal(result.headerScan.complete, true)
    assert.equal(result.headerScan.mailboxTotal, 2268)
    assert.match(renderSearch(result)[0].text, /信封/)
    assert.equal(result.bodyScan, undefined)
  }
  assert.ok(calls.filter(call => typeof call.range === 'string').length > 1, 'headers must be fetched in bounded batches')
  assert.ok(calls.every(call => call.fields.source === undefined))
})

test('bounded local search returns a continuation and never calls an unsearched mailbox empty', async () => {
  const messages = mailbox(100)
  messages[20].envelope.subject = 'Needle'
  const { pool } = fixture(messages, { bodySearchFallback: false })
  const first = await pool.search(undefined, 'Needle', 'INBOX', 10, 0, undefined, undefined, undefined, { headerScanLimit: 30 })
  assert.equal(first.messages.length, 0)
  assert.equal(first.headerScan.complete, false)
  assert.equal(first.headerScan.nextScanOffset, 30)
  assert.match(renderSearch(first)[0].text, /未覆盖全文件夹|未扫描完/)
  const older = await pool.search(undefined, 'Needle', 'INBOX', 10, 0, undefined, undefined, undefined, { headerScanLimit: 30, headerScanOffset: 60 })
  assert.deepEqual(older.messages.map(message => message.uid), [127])
  assert.equal(older.headerScan.scanOffset, 60)
  assert.equal(older.headerScan.nextScanOffset, 90)
})

test('header date filters use arrival/internal date even when imported mail has an old Date header', async () => {
  const messages = mailbox(2); messages.forEach(message => { message.envelope.subject = 'Needle' })
  messages[0].internalDate = new Date('2026-10-01T00:00:00Z')
  const { pool } = fixture(messages, { bodySearchFallback: false })
  const result = await pool.search(undefined, 'Needle', 'INBOX', 10, 0, new Date('2026-10-19T00:00:00Z'))
  assert.deepEqual(result.messages.map(message => message.uid), [108])
})

test('abort during a header batch rejects without silently returning zero matches', async () => {
  const controller = new AbortController(), { pool } = fixture(mailbox(600))
  pool.withImap = async (_account, _folder, run) => run({
    mailbox: { exists: 600 }, search: async () => [],
    async fetchAll() { controller.abort(new Error('cancel header scan')); return [] },
  })
  await assert.rejects(pool.search(undefined, 'Needle', 'INBOX', 10, 0, undefined, undefined, controller.signal), /cancel header scan/)
})

test('SEARCH rejection still permits a local header scan and reports the server failure', async () => {
  const messages = mailbox(1); messages[0].envelope.subject = 'Needle'
  const { pool, client } = fixture(messages)
  client.search = async () => { throw new Error('SEARCH unsupported') }
  const result = await pool.search(undefined, 'Needle', 'INBOX', 10, 0)
  assert.equal(result.messages.length, 1)
  assert.equal(result.serverSearchFailed, true)
  assert.equal(result.searchSource, 'local-headers')
})

test('server candidates are also checked against internal dates before being returned', async () => {
  const messages = mailbox(2); messages.forEach(message => { message.envelope.subject = 'Needle' })
  messages[0].internalDate = new Date('2026-10-01T00:00:00Z')
  const { pool, client } = fixture(messages)
  client.search = async () => messages.map(message => message.uid)
  const result = await pool.search(undefined, 'Needle', 'INBOX', 10, 0, new Date('2026-10-19T00:00:00Z'))
  assert.deepEqual(result.messages.map(message => message.uid), [108])
  assert.equal(result.searchSource, 'server')
})
