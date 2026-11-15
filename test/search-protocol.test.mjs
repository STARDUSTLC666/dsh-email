import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailPool, resolveEmailSettings } from '../lib/index.js'
import { createSearchPeer } from './helpers/imap-search-peer.mjs'

test('real ImapFlow finds older headers despite empty server SEARCH, without fetching message bodies', { timeout: 15000 }, async t => {
  const peer = await createSearchPeer()
  const pool = new EmailPool(resolveEmailSettings({ user: 'local@example.invalid', password: 'synthetic', bodySearchFallback: false, imap: { host: '127.0.0.1', port: peer.port, secure: false }, smtp: { host: '127.0.0.1', port: 25, secure: false } }))
  t.after(async () => { pool.dispose(); await peer.close() })
  for (const [query, uid] of [['github', 2303], ['chenxin', 2211]]) {
    const result = await pool.search(undefined, query, 'INBOX', 10, 0)
    assert.deepEqual(result.messages.map(message => message.uid), [uid])
    assert.equal(result.headerScan.scanned, 2268)
    assert.equal(result.headerScan.complete, true)
  }
  const first = await pool.search(undefined, 'github', 'INBOX', 10, 0, undefined, undefined, undefined, { headerScanLimit: 30 })
  assert.equal(first.count, 0)
  assert.equal(first.headerScan.nextScanOffset, 30)
  const beforeOlder = peer.commands.length
  const older = await pool.search(undefined, 'github', 'INBOX', 10, 0, undefined, undefined, undefined, { headerScanLimit: 30, headerScanOffset: 60 })
  assert.deepEqual(older.messages.map(message => message.uid), [2303])
  assert.equal(older.serverMatchCount, undefined)
  assert.ok(!peer.commands.slice(beforeOlder).some(command => /^(?:UID )?SEARCH /i.test(command)))
  assert.ok(peer.commands.some(command => /^EXAMINE /i.test(command)), 'search uses a read-only mailbox')
  assert.equal(peer.commands.some(command => /\b(?:BODY(?:\.PEEK)?\[|RFC822(?:\.TEXT)?\b(?!\.SIZE))/.test(command)), false)
})

test('IMAP list issues exactly one bounded FETCH for a deep page', { timeout: 15000 }, async t => {
  const peer = await createSearchPeer()
  const pool = new EmailPool(resolveEmailSettings({
    user: 'local@example.invalid', password: 'synthetic',
    imap: { host: '127.0.0.1', port: peer.port, secure: false },
    smtp: { host: '127.0.0.1', port: 25, secure: false },
  }))
  t.after(async () => { pool.dispose(); await peer.close() })
  const page = await pool.list(undefined, 'INBOX', 3, 1900, false)
  assert.equal(page.count, 2268)
  assert.equal(page.uidValidity, 1)
  assert.deepEqual(page.messages.map(row => row.uid), [474, 473, 472])
  const fetches = peer.commands.filter(command => /^(?:UID )?FETCH /i.test(command))
  assert.equal(fetches.length, 1)
  assert.match(fetches[0], /^FETCH 366:368 \(/)
  assert.match(fetches[0], /\bENVELOPE\b/)
  assert.doesNotMatch(fetches[0], /BODY(?:\.PEEK)?\[/)
  const beyond = await pool.list(undefined, 'INBOX', 3, 2268, false)
  assert.deepEqual(beyond.messages, [])
  assert.equal(peer.commands.filter(command => /^(?:UID )?FETCH /i.test(command)).length, 1)
})
