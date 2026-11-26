import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildEmailTools } from '../lib/tools.js'

function toolFor(sent) {
  const runtime = {
    getPool() {
      return {
        async send(...args) {
          sent.push(args)
          return { account: 'default', messageId: '<x@example.test>', accepted: [], rejected: [], response: '250 OK' }
        },
      }
    },
    getEffectiveSettings() {
      return { accounts: new Map() }
    },
    getSettingsValue() {
      return {}
    },
    watch() {},
  }
  return buildEmailTools(runtime).find(def => def.name === 'email_send')
}

async function workspace() {
  return await mkdtemp(join(tmpdir(), 'dsh-email-body-'))
}

const sendArgs = call => ({ account: call[0], to: call[1], subject: call[2], text: call[3], cc: call[4], attachments: call[5], html: call[7] })

test('textFile is read and sent as the plain-text body', async () => {
  const dir = await workspace()
  await writeFile(join(dir, 'body.txt'), '见正文\n', 'utf8')
  const sent = [], tool = toolFor(sent)
  await tool.execute({ to: 'a@example.test', subject: 'From file', textFile: join(dir, 'body.txt') }, {})
  assert.equal(sent.length, 1)
  assert.equal(sendArgs(sent[0]).text, '见正文\n')
  assert.equal(sendArgs(sent[0]).html, undefined)
})

test('htmlFile is read and sent as the HTML body', async () => {
  const dir = await workspace()
  await writeFile(join(dir, 'body.html'), '<p>hi</p>', 'utf8')
  const sent = [], tool = toolFor(sent)
  await tool.execute({ to: 'a@example.test', subject: 'From file', htmlFile: join(dir, 'body.html') }, {})
  assert.equal(sendArgs(sent[0]).html, '<p>hi</p>')
  assert.equal(sendArgs(sent[0]).text, undefined)
})

test('explicit text/html wins over the files', async () => {
  const dir = await workspace()
  await writeFile(join(dir, 'body.html'), '<p>from file</p>', 'utf8')
  const sent = [], tool = toolFor(sent)
  await tool.execute({ to: 'a@example.test', subject: 'Both', text: 'inline text', htmlFile: join(dir, 'body.html') }, {})
  assert.equal(sendArgs(sent[0]).text, 'inline text')
  // text 给了、html 没给 → 仍读 htmlFile，两者可以各走各的来源
  assert.equal(sendArgs(sent[0]).html, '<p>from file</p>')

  const sent2 = [], tool2 = toolFor(sent2)
  await tool2.execute({ to: 'a@example.test', subject: 'Both', html: '<p>inline</p>', textFile: join(dir, 'body.html') }, {})
  assert.equal(sendArgs(sent2[0]).text, '<p>from file</p>')
  assert.equal(sendArgs(sent2[0]).html, '<p>inline</p>')
})

test('a relative path resolves against the session workspace, not the process cwd', async () => {
  const dir = await workspace()
  await writeFile(join(dir, 'rel.txt'), 'relative ok', 'utf8')
  const sent = [], tool = toolFor(sent)
  await tool.execute({ to: 'a@example.test', subject: 'Relative', textFile: 'rel.txt' }, { agent: { session: { header: { cwd: dir } } } })
  assert.equal(sendArgs(sent[0]).text, 'relative ok')
})

test('a missing body file fails loudly and sends nothing', async () => {
  const dir = await workspace()
  const sent = [], tool = toolFor(sent)
  await assert.rejects(
    () => tool.execute({ to: 'a@example.test', subject: 'Missing', textFile: join(dir, 'nope.txt') }, {}),
    /textFile 读取失败/,
  )
  assert.equal(sent.length, 0)
})

test('a body file over 512 KiB is refused', async () => {
  const dir = await workspace()
  await writeFile(join(dir, 'big.html'), '<p>' + 'x'.repeat(512 * 1024) + '</p>', 'utf8')
  const sent = [], tool = toolFor(sent)
  await assert.rejects(
    () => tool.execute({ to: 'a@example.test', subject: 'Big', htmlFile: join(dir, 'big.html') }, {}),
    /超过 512 KiB/,
  )
  assert.equal(sent.length, 0)
})

test('no inline body and no body file is still refused', async () => {
  const sent = [], tool = toolFor(sent)
  await assert.rejects(
    () => tool.execute({ to: 'a@example.test', subject: 'Empty', text: '  ', htmlFile: '' }, {}),
    /请填写 text\/html 正文，或用 textFile\/htmlFile 指向正文文件/,
  )
  assert.equal(sent.length, 0)
})
