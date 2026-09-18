import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { EmailPool, resolveEmailSettings } from '../lib/index.js'

const QQ = { provider: 'qq', user: 'a@b.c', password: 'p' }

/** RFC822 source the fallback scanner can parse. */
function raw(subject, from, body) {
  return Buffer.from([
    'From: ' + from,
    'To: me@qq.com',
    'Subject: ' + subject,
    'Date: Wed, 17 Sep 2026 10:00:00 +0800',
    '',
    body,
  ].join('\r\n'), 'utf8')
}

function message(uid, { subject = '', from = 'someone@example.com', body = '' } = {}) {
  return {
    uid,
    envelope: {
      subject,
      from: [{ name: '', address: from }],
      to: [{ name: '', address: 'me@qq.com' }],
      cc: [],
      date: new Date('2026-09-17T02:00:00Z'),
    },
    flags: new Set(),
    size: 1024,
    bodyStructure: { childNodes: [] },
    source: raw(subject, from, body),
    internalDate: new Date('2026-09-17T02:00:00Z'),
  }
}

/**
 * QQ-style server: every subject/from/to/cc search answers with the same uid
 * list no matter what was asked (issue #15 — an impossible keyword still
 * 「matches」the whole folder).
 */
function poolWithServer({ hits, messages, settings = {} }) {
  const pool = new EmailPool(resolveEmailSettings({ ...QQ, ...settings }))
  const calls = []
  const byUid = new Map(messages.map(m => [m.uid, m]))
  const fakeClient = {
    mailbox: { exists: messages.length },
    async search(query) { calls.push(['search', query]); return hits },
    async fetchAll(seq) {
      calls.push(['fetchAll', seq])
      const wanted = Array.isArray(seq) ? seq : messages.map(m => m.uid)
      return wanted.map(uid => byUid.get(uid)).filter(Boolean)
    },
  }
  pool.withImap = async (_account, _folder, run) => run(fakeClient)
  return { pool, calls }
}

test('QQ 式乱答服务器：无关 uid 不再被当成命中（issue #15）', async () => {
  const messages = [message(14, { subject: '账单', body: '生日蛋糕券已到账' })]
  const { pool, calls } = poolWithServer({ hits: [40, 39, 38, 14], messages })
  const result = await pool.search(undefined, '生日', '', 10, 0)
  assert.equal(result.count, 1)
  assert.deepEqual(result.messages.map(m => m.uid), [14])
  assert.ok(calls.some(([kind]) => kind === 'fetchAll'), '应先向服务器复核命中，再回退扫描')
})

test('不存在的关键词：乱答服务器上返回 0 条，而不是服务器声称的 40 条', async () => {
  const messages = [message(40, { subject: '账单' }), message(39, { subject: '发票' })]
  const { pool } = poolWithServer({ hits: [40, 39, 38], messages })
  const result = await pool.search(undefined, 'zzzznonexistentkeyword', '', 10, 0)
  assert.equal(result.count, 0)
  assert.deepEqual(result.messages, [])
})

test('服务器混着无关 uid 时，列出的每一行都真的带关键词', async () => {
  const messages = [message(40, { subject: '账单' }), message(39, { subject: '发票' }), message(38, { subject: '生日蛋糕券' })]
  const { pool } = poolWithServer({ hits: [40, 39, 38], messages })
  const result = await pool.search(undefined, '生日', '', 10, 0)
  assert.deepEqual(result.messages.map(m => m.uid), [38])
  assert.equal(result.count, 3, 'count 仍是服务器列表的大小')
})

test('老实服务器（命中确实带着关键词）行为不变', async () => {
  const messages = [message(7, { subject: '生日聚会邀请' }), message(6, { subject: '周报' })]
  const { pool } = poolWithServer({ hits: [7], messages })
  const result = await pool.search(undefined, '生日', '', 10, 0)
  assert.equal(result.count, 1)
  assert.deepEqual(result.messages.map(m => m.uid), [7])
})

test('只出现在正文里的关键词仍由回退扫描找到', async () => {
  const messages = [message(9, { subject: '无聊的标题', body: '合同续签提醒' }), message(8, { subject: '周报' })]
  const { pool } = poolWithServer({ hits: [9, 8], messages })
  const result = await pool.search(undefined, '合同', '', 10, 0)
  assert.equal(result.count, 1)
  assert.equal(result.messages[0].uid, 9)
})

test('关掉 bodySearchFallback 时，乱答服务器得到诚实的 0 条', async () => {
  const messages = [message(5, { subject: '周报' })]
  const { pool } = poolWithServer({ hits: [5, 4, 3], messages, settings: { bodySearchFallback: false } })
  const result = await pool.search(undefined, '生日', '', 10, 0)
  assert.equal(result.count, 0)
  assert.deepEqual(result.messages, [])
})

test('offset 跳过最新的若干条命中', async () => {
  const messages = [
    message(7, { subject: '生日聚会邀请' }),
    message(6, { subject: '生日蛋糕券' }),
    message(5, { subject: '周报' }),
  ]
  const { pool } = poolWithServer({ hits: [7, 6], messages })
  const first = await pool.search(undefined, '生日', '', 1, 0)
  const second = await pool.search(undefined, '生日', '', 1, 1)
  assert.deepEqual(first.messages.map(m => m.uid), [7])
  assert.deepEqual(second.messages.map(m => m.uid), [6])
  assert.equal(first.count, 2)
  assert.equal(second.offset, 1)
})

test('渲染时说明跳过了多少条', async () => {
  const { renderSearch } = await import('../lib/tool-contract.js')
  const block = { uid: 5, date: '', from: [], subject: 'x', seen: false, flagged: false, size: 1, hasAttachments: false }
  const paged = renderSearch({ account: 'a', query: '生日', count: 9, folder: 'INBOX', offset: 2, messages: [block] }).map(b => b.text).join('')
  assert.match(paged, /跳过最新 2 条后展示 1 条/)
  const fresh = renderSearch({ account: 'a', query: '生日', count: 9, folder: 'INBOX', offset: 0, messages: [block] }).map(b => b.text).join('')
  assert.match(fresh, /展示最新 1 条/)
})

/** 信封 + bodyStructure + download 的假客户端：服务器只发请求过的东西，不再附带 source。 */
function poolWithPartServer({ hits, messages, settings = {} }) {
  const pool = new EmailPool(resolveEmailSettings({ ...QQ, ...settings }))
  const calls = []
  const byUid = new Map(messages.map(m => [m.uid, m]))
  const bodyByUid = new Map(messages.map(m => [m.uid, m.__body ?? '']))
  const fakeClient = {
    mailbox: { exists: messages.length },
    async search(query) { calls.push(['search', query]); return hits },
    async fetchAll(seq, query) {
      calls.push(['fetchAll', seq, query])
      // 序列号区间在真实 IMAP 里按升序返回，和 searchBodies 的 [...fetched].reverse() 对应。
      const wanted = Array.isArray(seq) ? seq : messages.map(m => m.uid).sort((a, b) => a - b)
      return wanted.map(uid => byUid.get(uid)).filter(Boolean)
    },
    async download(uid, part) {
      calls.push(['download', uid, part])
      return { meta: { contentType: 'text/plain' }, content: Readable.from([Buffer.from(bodyByUid.get(uid) ?? '')]) }
    },
  }
  pool.withImap = async (_account, _folder, run) => run(fakeClient)
  return { pool, calls }
}

/** 只有 bodyStructure、没有 source 的邮件，正文要单独按分段下载。 */
function partMessage(uid, { subject = '', from = 'someone@example.com', body = '' } = {}) {
  return {
    uid,
    envelope: {
      subject,
      from: [{ name: '', address: from }],
      to: [{ name: '', address: 'me@qq.com' }],
      cc: [],
      date: new Date('2026-09-17T02:00:00Z'),
    },
    flags: new Set(),
    size: 1024,
    bodyStructure: { childNodes: [{ part: '1', type: 'text/plain', size: Buffer.byteLength(body) }] },
    internalDate: new Date('2026-09-17T02:00:00Z'),
    __body: body,
  }
}

test('30 封全命中、limit=10 时，渲染不得把本页条数说成总匹配数', async () => {
  const { renderSearch } = await import('../lib/tool-contract.js')
  const messages = Array.from({ length: 30 }, (_, i) => message(30 - i, { subject: '生日提醒 ' + i, body: '正文' }))
  const { pool } = poolWithServer({ hits: [], messages })
  const result = await pool.search(undefined, '生日', '', 10, 0)
  assert.equal(result.countKind, 'scanned', '回退扫描必须标明这是扫描口径')
  assert.equal(result.scannedLimit, 30, '渲染需要知道只扫描了最近多少封')
  const text = renderSearch(result).map(block => block.text).join('')
  assert.doesNotMatch(text, /共 10 条匹配/)
  assert.match(text, /本页 10 条/)
  assert.match(text, /最近 30 封/)
})

test('正文回退扫描只下载 text/* 分段，不再整封拉取（20MiB 附件也不下）', async () => {
  const messages = [
    partMessage(3, { subject: '会议纪要', body: '合同续签提醒：请本周处理' }),
    partMessage(2, { subject: '周报', body: '本周进展' }),
    partMessage(1, { subject: '账单', body: '发票已开' }),
  ]
  const { pool, calls } = poolWithPartServer({ hits: [], messages })
  const result = await pool.search(undefined, '合同', '', 1, 0)
  assert.deepEqual(result.messages.map(m => m.uid), [3])
  const fetchAll = calls.find(call => call[0] === 'fetchAll')
  assert.ok(fetchAll, '先取窗口内邮件的信封')
  assert.equal(fetchAll[2].source, undefined, '不再请求 source（否则附件也会被拉下来）')
  assert.deepEqual(calls.filter(call => call[0] === 'download').map(call => call[1]), [3], '只为要报告的那封下载正文分段')
})
