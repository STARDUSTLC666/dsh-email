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
  const older = await pool.search(undefined, 'github', 'INBOX', 10, 0, undefined, undefined, undefined, { headerScanLimit: 30, headerScanOffset: 60 })
  assert.deepEqual(older.messages.map(message => message.uid), [2303])
  assert.ok(peer.commands.some(command => /^EXAMINE /i.test(command)), 'search uses a read-only mailbox')
  assert.equal(peer.commands.some(command => /\b(?:BODY(?:\.PEEK)?\[|RFC822(?:\.TEXT)?\b(?!\.SIZE))/.test(command)), false)
})
