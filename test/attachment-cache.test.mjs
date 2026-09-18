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
