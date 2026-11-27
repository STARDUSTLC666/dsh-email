import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildEmailTools } from '../lib/tools.js'
import { installSendApproval } from '../lib/approval.js'

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

async function workspace(t) {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-email-body-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  return dir
}

const sendArgs = call => ({ account: call[0], to: call[1], subject: call[2], text: call[3], cc: call[4], attachments: call[5], html: call[7] })

test('textFile is read and sent as the plain-text body', async t => {
  const dir = await workspace(t)
  await writeFile(join(dir, 'body.txt'), '见正文\n', 'utf8')
  const sent = [], tool = toolFor(sent)
  await tool.execute({ to: 'a@example.test', subject: 'From file', textFile: join(dir, 'body.txt') }, {})
  assert.equal(sent.length, 1)
  assert.equal(sendArgs(sent[0]).text, '见正文\n')
  assert.equal(sendArgs(sent[0]).html, undefined)
})

test('htmlFile is read and sent as the HTML body', async t => {
  const dir = await workspace(t)
  await writeFile(join(dir, 'body.html'), '<p>hi</p>', 'utf8')
  const sent = [], tool = toolFor(sent)
  await tool.execute({ to: 'a@example.test', subject: 'From file', htmlFile: join(dir, 'body.html') }, {})
  assert.equal(sendArgs(sent[0]).html, '<p>hi</p>')
  assert.equal(sendArgs(sent[0]).text, undefined)
})

test('explicit text/html wins over the files', async t => {
  const dir = await workspace(t)
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

test('a relative path resolves against the session workspace, not the process cwd', async t => {
  const dir = await workspace(t)
  await writeFile(join(dir, 'rel.txt'), 'relative ok', 'utf8')
  const sent = [], tool = toolFor(sent)
  await tool.execute({ to: 'a@example.test', subject: 'Relative', textFile: 'rel.txt' }, { agent: { session: { header: { cwd: dir } } } })
  assert.equal(sendArgs(sent[0]).text, 'relative ok')
})

test('a missing body file fails loudly and sends nothing', async t => {
  const dir = await workspace(t)
  const sent = [], tool = toolFor(sent)
  await assert.rejects(
    () => tool.execute({ to: 'a@example.test', subject: 'Missing', textFile: join(dir, 'nope.txt') }, {}),
    /textFile 读取失败/,
  )
  assert.equal(sent.length, 0)
})

test('a body file over 256 KiB is refused, matching the HTML sanitizer cap', async t => {
  const dir = await workspace(t)
  await writeFile(join(dir, 'big.html'), '<p>' + 'x'.repeat(256 * 1024) + '</p>', 'utf8')
  const sent = [], tool = toolFor(sent)
  await assert.rejects(
    () => tool.execute({ to: 'a@example.test', subject: 'Big', htmlFile: join(dir, 'big.html') }, {}),
    /超过 256 KiB/,
  )
  assert.equal(sent.length, 0)
})

test('a directory is refused instead of being read', async t => {
  const dir = await workspace(t)
  const sent = [], tool = toolFor(sent)
  await assert.rejects(
    () => tool.execute({ to: 'a@example.test', subject: 'Dir', textFile: dir }, {}),
    /不是普通文件/,
  )
  assert.equal(sent.length, 0)
})

test('a body file that is not valid UTF-8 is refused instead of being sent as mojibake', async t => {
  const dir = await workspace(t)
  await writeFile(join(dir, 'bad.html'), Buffer.from([0x3c, 0x70, 0x3e, 0xc3, 0x28, 0x3c, 0x2f, 0x70, 0x3e]))
  const sent = [], tool = toolFor(sent)
  await assert.rejects(
    () => tool.execute({ to: 'a@example.test', subject: 'Bad utf8', htmlFile: join(dir, 'bad.html') }, {}),
    /UTF-8 文本/,
  )
  assert.equal(sent.length, 0)
})

test('reading stops when the execution is cancelled', async t => {
  const dir = await workspace(t)
  await writeFile(join(dir, 'body.txt'), 'body', 'utf8')
  const sent = [], tool = toolFor(sent)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(
    () => tool.execute({ to: 'a@example.test', subject: 'Cancelled', textFile: join(dir, 'body.txt') }, { signal: controller.signal }),
    /abort/i,
  )
  assert.equal(sent.length, 0)
})

test('no inline body and no body file is still refused', async t => {
  const sent = [], tool = toolFor(sent)
  await assert.rejects(
    () => tool.execute({ to: 'a@example.test', subject: 'Empty', text: '  ', htmlFile: '' }, {}),
    /请填写 text\/html 正文，或用 textFile\/htmlFile 指向正文文件/,
  )
  assert.equal(sent.length, 0)
})

test('NUL bytes and custom abort reasons are handled properly', async t => {
  const dir = await workspace(t)
  await writeFile(join(dir, 'nul.txt'), Buffer.from('hello\0world'))
  const sent = [], tool = toolFor(sent)
  await assert.rejects(
    () => tool.execute({ to: 'a@example.test', subject: 'NUL', textFile: join(dir, 'nul.txt') }, {}),
    /UTF-8 文本/,
  )
  const controller = new AbortController()
  controller.abort(new Error('custom-cancel-reason'))
  await assert.rejects(
    () => tool.execute({ to: 'a@example.test', subject: 'Abort', textFile: join(dir, 'missing-never-touched.txt') }, { signal: controller.signal }),
    /custom-cancel-reason/,
  )
  assert.equal(sent.length, 0)
})

test('approval dialog lists active body files, flags outside/symlink escapes, and ignores ..foo false positives', async t => {
  const root = await workspace(t)
  const ws = join(root, 'ws')
  const outsideDir = join(root, 'outside')
  await mkdir(ws)
  await mkdir(outsideDir)
  await writeFile(join(ws, 'report.txt'), 'ok', 'utf8')
  await writeFile(join(ws, '..notes.txt'), 'leading dots inside ws', 'utf8')
  await writeFile(join(outsideDir, 'secret.env'), 'SECRET=1', 'utf8')
  await symlink(outsideDir, join(ws, 'escape'), process.platform === 'win32' ? 'junction' : 'dir')

  function askReason(args) {
    let gate, captured = ''
    const settings = { accounts: new Map([['work', { user: 'self@example.test' }]]), defaultAccount: 'work' }
    const runtime = { getSettingsValue: () => ({ sendApproval: true }), getEffectiveSettings: () => settings, getPool: () => ({}), watch: async () => {} }
    installSendApproval({
      on(_event, fn) { gate = fn },
      get() { return { request: async req => { captured = req.reason; return 'allowed-once' } } },
    }, runtime)
    return gate({ name: 'email_send', arguments: args, agent: { session: { header: { cwd: ws } } } }, async () => ({ kind: 'allow' }))
      .then(decision => ({ decision, reason: captured }))
  }

  // Inside workspace (including filename starting with `..`): listed, NOT flagged as outside
  const inside = await askReason({ to: 'a@example.test', subject: 'Inside', textFile: '..notes.txt' })
  assert.equal(inside.decision.kind, 'allow')
  assert.match(inside.reason, /正文来自文件 \.\.notes\.txt/)
  assert.match(inside.reason, /审批通过后才读取/)
  assert.doesNotMatch(inside.reason, /会话工作区之外/)

  // Explicit outside path: flagged as outside workspace
  const outside = await askReason({ to: 'a@example.test', subject: 'Outside', textFile: '../outside/secret.env' })
  assert.equal(outside.decision.kind, 'allow')
  assert.match(outside.reason, /会话工作区之外.*secret\.env/)

  // Symlink / junction inside workspace pointing outside: realpath catches the escape
  const viaLink = await askReason({ to: 'a@example.test', subject: 'Symlink', htmlFile: 'escape/secret.env' })
  assert.equal(viaLink.decision.kind, 'allow')
  assert.match(viaLink.reason, /会话工作区之外.*escape\/secret\.env/)

  // When inline text wins over textFile, unused textFile is not disclosed as read
  const overridden = await askReason({ to: 'a@example.test', subject: 'Inline wins', text: 'inline', textFile: '../outside/secret.env' })
  assert.equal(overridden.decision.kind, 'allow')
  assert.doesNotMatch(overridden.reason, /正文来自文件/)
})

test('end-to-end: approval gate + htmlFile + non-raster prefix + inline PNG over real local SMTP', async t => {
  const { simpleParser } = await import('mailparser')
  const { EmailPool, resolveEmailSettings } = await import('../lib/index.js')
  const { createSmtpPeer } = await import('./helpers/smtp-peer.mjs')
  const smtp = await createSmtpPeer()
  t.after(() => smtp.close())
  const ws = await workspace(t)
  const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6300010000050001', 'hex')
  await writeFile(join(ws, 'report.html'), '<h2>Weekly</h2><img src="cid:chart.png" width="400">', 'utf8')
  await writeFile(join(ws, 'summary.txt'), 'attached summary', 'utf8')
  await writeFile(join(ws, 'chart.png'), PNG)
  const settings = resolveEmailSettings({
    user: 'me@example.test',
    password: 'synthetic-smtp-fixture',
    proxy: 'direct',
    imap: { host: '127.0.0.1', port: 993, secure: true },
    smtp: { host: '127.0.0.1', port: smtp.port, secure: false },
  })
  const pool = new EmailPool(settings)
  t.after(() => pool.dispose())
  const runtime = {
    getPool: () => pool,
    getEffectiveSettings: () => settings,
    getSettingsValue: () => ({ sendApproval: true }),
    watch: async () => {},
  }
  const sendTool = buildEmailTools(runtime).find(def => def.name === 'email_send')
  let gate, reason = ''
  installSendApproval({
    on(_event, fn) { gate = fn },
    get() { return { request: async req => { reason = req.reason; return 'allowed-once' } } },
  }, runtime)
  const exec = {
    name: 'email_send',
    arguments: { to: 'team@example.test', subject: 'Weekly Report', htmlFile: 'report.html', attachments: ['summary.txt', 'chart.png'] },
    agent: { session: { header: { cwd: ws } } },
  }
  const decision = await gate(exec, async () => {
    await sendTool.execute(exec.arguments, exec)
    return { kind: 'allow' }
  })
  assert.equal(decision.kind, 'allow')
  assert.match(reason, /正文来自文件 report\.html/)
  assert.doesNotMatch(reason, /会话工作区之外/)
  assert.equal(smtp.messages.length, 1)
  const parsed = await simpleParser(smtp.messages[0], { keepCidLinks: true })
  assert.match(parsed.html, /<h2>Weekly<\/h2>/)
  assert.match(parsed.html, /src="cid:img2"/)
  const inlineImg = parsed.attachments.find(a => a.filename === 'chart.png')
  const plainFile = parsed.attachments.find(a => a.filename === 'summary.txt')
  assert.equal(inlineImg.cid, 'img2')
  assert.equal(inlineImg.contentDisposition, 'inline')
  assert.equal(plainFile.cid, undefined)
})
