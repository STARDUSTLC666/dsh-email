import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { EmailPool, resolveEmailSettings } from '../lib/index.js'

const RAW = [
  'From: someone@example.com',
  'To: me@qq.com',
  'Subject: with attachment',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="B"',
  '',
  '--B',
  'Content-Type: text/plain',
  '',
  'hello body',
  '--B',
  'Content-Type: application/pdf; name="a.pdf"',
  'Content-Disposition: attachment; filename="a.pdf"',
  'Content-Transfer-Encoding: base64',
  '',
  'aGVsbG8=',
  '--B--',
  '',
].join('\r\n')

function fakeServer(calls) {
  return {
    mailbox: { exists: 1, uidValidity: 1 },
    async fetchOne(uid, query) {
      calls.push(['fetchOne', JSON.stringify(query)])
      return {
        uid,
        source: Buffer.from(RAW, 'utf8'),
        bodyStructure: {
          childNodes: [
            { part: '1', type: 'text/plain', size: 10 },
            { part: '2', type: 'application/pdf', size: 5, disposition: 'attachment', dispositionParameters: { filename: 'a.pdf' }, parameters: { name: 'a.pdf' } },
          ],
        },
      }
    },
    async download(uid, part) {
      calls.push(['download', part])
      return { meta: { filename: 'a.pdf' }, content: Readable.from([Buffer.from('hello')]) }
    },
  }
}

function workspace(t) {
  const dir = mkdtempSync(join(tmpdir(), 'dshe-att-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

test('email_attachment 复用 email_read 的解析结果，不再整封重下', async (t) => {
  const ws = workspace(t)
  const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' }))
  const calls = []
  pool.withImap = async (_account, _folder, run) => run(fakeServer(calls))

  const read = await pool.read(undefined, 7, '')
  assert.equal(read.attachments.length, 1)
  assert.equal(read.attachments[0].filename, 'a.pdf')

  const dl = await pool.downloadAttachment(undefined, '', 7, 0, ws)
  assert.equal(dl.size, 5)
  assert.equal(dl.filename, 'a.pdf')

  assert.equal(calls.filter(([kind]) => kind === 'fetchOne').length, 1, 'read 之后下载不该再整封 FETCH')
  assert.deepEqual(calls.filter(([kind]) => kind === 'download').map(([, part]) => part), ['2'])
})

test('没有 email_read 打底时（缓存未命中）自己解析一次，行为不变', async (t) => {
  const ws = workspace(t)
  const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' }))
  const calls = []
  pool.withImap = async (_account, _folder, run) => run(fakeServer(calls))

  const dl = await pool.downloadAttachment(undefined, '', 9, 0, ws)
  assert.equal(dl.size, 5)
  assert.equal(calls.filter(([kind]) => kind === 'fetchOne').length, 1)
  assert.equal(JSON.parse(calls.find(([kind]) => kind === 'fetchOne')[1]).source, undefined, '缓存未命中时附件索引也只读 bodyStructure，不整封拉取')
})

test('UIDVALIDITY 变化后同一 uid 不再复用旧附件索引', async (t) => {
  const ws = workspace(t)
  const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' }))
  const calls = []
  const server = fakeServer(calls)
  server.mailbox = { exists: 1, uidValidity: 111 }
  pool.withImap = async (_account, _folder, run) => run(server)

  const read = await pool.read(undefined, 7, '')
  assert.equal(read.attachments.length, 1)

  // 服务器重编号：同一个 uid=7 现在是另一封没有附件的纯文本邮件，
  // 旧索引（a.pdf -> IMAP part 2）绝不能拿来下载。
  const plain = [
    'From: other@example.com',
    'To: me@example.com',
    'Subject: renumbered',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    'plain text mail',
  ].join('\r\n')
  server.mailbox = { exists: 1, uidValidity: 222 }
  server.fetchOne = async (uid, query) => {
    calls.push(['fetchOne', JSON.stringify(query)])
    return { uid, source: Buffer.from(plain, 'utf8'), bodyStructure: { childNodes: [{ part: '1', type: 'text/plain', size: 15 }] } }
  }

  await assert.rejects(pool.downloadAttachment(undefined, '', 7, 0, ws), /该邮件没有附件/)
  assert.equal(calls.filter(([kind]) => kind === 'fetchOne').length, 2, 'UIDVALIDITY 变了必须重新解析')
  assert.equal(calls.filter(([kind]) => kind === 'download').length, 0, '不能拿旧索引去下载')
})

test('缓存按账号+文件夹+uid 命中，换 uid 会重新解析', async (t) => {
  const ws = workspace(t)
  const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' }))
  const calls = []
  pool.withImap = async (_account, _folder, run) => run(fakeServer(calls))

  await pool.read(undefined, 7, '')
  await pool.downloadAttachment(undefined, '', 8, 0, ws) // 另一个 uid：必须自己解析
  assert.equal(calls.filter(([kind]) => kind === 'fetchOne').length, 2)
})

test('email_read 只下载 text/* 分段，附件元数据复用 bodyStructure（不再整封 FETCH）', async () => {
  const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' }))
  const calls = []
  const fakeClient = {
    mailbox: { exists: 1, uidValidity: 1 },
    async fetchOne(uid, query) {
      calls.push(['fetchOne', query])
      return {
        uid,
        envelope: {
          subject: 'with attachment',
          from: [{ name: '', address: 'someone@example.com' }],
          to: [{ name: '', address: 'me@qq.com' }],
          cc: [],
          date: new Date('2026-09-17T02:00:00Z'),
        },
        bodyStructure: {
          childNodes: [
            { part: '1', type: 'text/plain', size: 10 },
            { part: '2', type: 'application/pdf', size: 5, disposition: 'attachment', dispositionParameters: { filename: 'a.pdf' }, parameters: { name: 'a.pdf' } },
          ],
        },
      }
    },
    async download(uid, part) {
      calls.push(['download', part])
      return { meta: { contentType: 'text/plain' }, content: Readable.from([Buffer.from('hello body')]) }
    },
  }
  pool.withImap = async (_account, _folder, run) => run(fakeClient)

  const read = await pool.read(undefined, 7, '')
  assert.equal(read.text, 'hello body')
  assert.equal(read.attachments.length, 1)
  assert.equal(read.attachments[0].filename, 'a.pdf')
  const fetches = calls.filter(call => call[0] === 'fetchOne')
  assert.equal(fetches.length, 1, '一封正文只需要一次 FETCH')
  assert.equal(fetches[0][1].source, undefined, '不再请求 source')
  assert.deepEqual(calls.filter(call => call[0] === 'download').map(call => call[1]), ['1'], '只下载 text/plain 分段')
})

test('email_read 的 HTML-only 邮件只下载 text/html 分段并转纯文本', async () => {
  const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' }))
  const calls = []
  const fakeClient = {
    mailbox: { exists: 1, uidValidity: 1 },
    async fetchOne(uid, query) {
      calls.push(['fetchOne', query])
      return {
        uid,
        envelope: { subject: 'html only', from: [], to: [], cc: [], date: new Date('2026-09-17T02:00:00Z') },
        bodyStructure: { type: 'text/html', size: 24 },
      }
    },
    async download(uid, part) {
      calls.push(['download', part])
      return { meta: { contentType: 'text/html' }, content: Readable.from([Buffer.from('<p>你好 <b>世界</b></p>')]) }
    },
  }
  pool.withImap = async (_account, _folder, run) => run(fakeClient)

  const read = await pool.read(undefined, 7, '')
  assert.equal(read.text, '你好 世界')
  assert.equal(read.attachments.length, 0)
  assert.deepEqual(calls.filter(call => call[0] === 'download').map(call => call[1]), ['1'])
})

test('email_read 不把内嵌 message/rfc822 的正文当成主正文', async () => {
  const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' }))
  const calls = []
  const fakeClient = {
    mailbox: { exists: 1, uidValidity: 1 },
    async fetchOne(uid, query) {
      calls.push(['fetchOne', query])
      return {
        uid,
        envelope: { subject: 'forwarded mail', from: [], to: [], cc: [], date: new Date('2026-09-17T02:00:00Z') },
        bodyStructure: {
          childNodes: [
            { part: '1', type: 'message/rfc822', size: 100, disposition: 'attachment', childNodes: [{ part: '1', type: 'text/plain', size: 20 }] },
            { part: '2', type: 'text/plain', size: 9 },
          ],
        },
      }
    },
    async download(uid, part) {
      calls.push(['download', part])
      return {
        meta: { contentType: 'text/plain' },
        content: Readable.from([Buffer.from(part === '1' ? 'embedded body' : 'main body')]),
      }
    },
  }
  pool.withImap = async (_account, _folder, run) => run(fakeClient)

  const read = await pool.read(undefined, 7, '')
  assert.equal(read.text, 'main body')
  assert.deepEqual(calls.filter(call => call[0] === 'download').map(call => call[1]), ['2'], '只下载真正的主正文分段')
})
