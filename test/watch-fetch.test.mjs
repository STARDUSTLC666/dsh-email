import test from 'node:test'
import assert from 'node:assert/strict'
import { createEmailRuntime } from '../lib/runtime.js'

const CONFIG = { provider: 'qq', user: 'watch@example.com', password: 'fixture-password' }

function runtimeFixture(t) {
  const ctx = {
    settings: {
      register() { return { get: () => ({ ...CONFIG, inboxFolder: 'INBOX' }) } },
      describe: () => [],
    },
    effect(fn) { return fn() },
    logger: { warn() {} },
  }
  const runtime = createEmailRuntime(ctx, CONFIG)
  t.after(() => runtime.dispose())
  return runtime
}

function listedMessage(uid) {
  return {
    uid,
    envelope: { subject: 's' + uid, from: [], to: [], cc: [], date: new Date('2026-09-17T00:00:00Z') },
    flags: new Set(),
    size: 1,
    bodyStructure: { childNodes: [] },
  }
}

test('watch 只为要报告的 ≤limit 封邮件发 FETCH，未读很多时也一样', async (t) => {
  const runtime = runtimeFixture(t)
  const pool = runtime.getPool()
  const searches = []
  const fetches = []
  let unseen = []
  const fakeClient = {
    mailbox: { exists: 0, uidValidity: 1 },
    async search(query, options) { searches.push({ query, options }); return unseen },
    async fetchAll(seq, query, options) {
      fetches.push({ seq, query, options })
      return seq.map(listedMessage)
    },
  }
  pool.withImap = async (_account, _folder, run) => run(fakeClient)

  // 首次调用只建立基线：SEARCH 一次，不 FETCH 信封。
  const baseline = await runtime.watch(undefined, '', 3, 'tool')
  assert.equal(baseline.firstRun, true)
  assert.equal(baseline.totalUnread, 0)
  assert.equal(fetches.length, 0, '首次只建立基线，不该 FETCH 信封')

  // 100 封未读、limit=3：本轮会报告最旧的 3 封，就只为这 3 封取信封。
  unseen = Array.from({ length: 100 }, (_, i) => i + 1) // IMAP SEARCH 升序返回，和真实服务器一致
  const first = await runtime.watch(undefined, '', 3, 'tool')
  assert.equal(first.totalUnread, 100)
  assert.equal(first.newCount, 3)
  assert.deepEqual(first.messages.map(message => message.uid), [3, 2, 1])
  assert.equal(fetches.length, 1, '一轮 watch 只发一次 FETCH')
  assert.equal(fetches[0].seq.length, 3, 'FETCH 的 uid 数必须等于本轮实际返回条数')
  assert.deepEqual([...fetches[0].seq].sort((a, b) => a - b), [1, 2, 3])

  // 游标只推进到本轮最大值，下一轮继续取下一批，不重不漏。
  const second = await runtime.watch(undefined, '', 3, 'tool')
  assert.equal(second.totalUnread, 100)
  assert.deepEqual(second.messages.map(message => message.uid), [6, 5, 4])
  assert.equal(fetches.length, 2)
  assert.equal(fetches[1].seq.length, 3)
  assert.equal(searches.length, 3, '每一轮 watch 恰好一次 UNSEEN SEARCH')
})
