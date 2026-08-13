import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply, validateAttachmentPaths, MailError } from '../lib/index.js'

function fakeCtx() {
  const ctx = {
    tools: { register(def) { this.defs.push(def) }, defs: [] },
    listeners: [],
    on(event, fn, opts) { this.listeners.push({ event, fn, opts }) },
    effect(fn) { this.effects.push(fn()) },
    effects: [],
    logger: { warn() {} },
  }
  return ctx
}

const QQ = { provider: 'qq', user: 'a@b.c', password: 'p' }

test('apply registers the six email tools even without config', () => {
  const ctx = fakeCtx()
  apply(ctx, {})
  const names = ctx.tools.defs.map(def => def.name).sort()
  assert.deepEqual(names, ['email_attachment', 'email_folders', 'email_list', 'email_read', 'email_search', 'email_send'])
})

test('every tool returns a config hint instead of throwing when unconfigured', async () => {
  const ctx = fakeCtx()
  apply(ctx, {})
  const list = ctx.tools.defs.find(def => def.name === 'email_list')
  await assert.rejects(() => list.execute({}), /dsh-email 未配置/)
  const folders = ctx.tools.defs.find(def => def.name === 'email_folders')
  await assert.rejects(() => folders.execute({}), /dsh-email 未配置/)
})

test('execute validates args without touching the network', async () => {
  const ctx = fakeCtx()
  apply(ctx, QQ)
  const read = ctx.tools.defs.find(def => def.name === 'email_read')
  await assert.rejects(() => read.execute({ uid: -1 }), /uid 必须是正整数/)
  const search = ctx.tools.defs.find(def => def.name === 'email_search')
  await assert.rejects(() => search.execute({ query: '  ' }), /query 不能为空/)
  const attach = ctx.tools.defs.find(def => def.name === 'email_attachment')
  await assert.rejects(() => attach.execute({ uid: 0 }), /uid 必须是正整数/)
})

test('email_send asks for approval with recipient, subject and attachment count', async () => {
  const ctx = fakeCtx()
  apply(ctx, QQ)
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  assert.ok(gate)
  assert.equal(gate.opts.prepend, true)
  const decision = await gate.fn(
    { name: 'email_send', args: { to: 'boss@corp.com', subject: '周报', attachments: ['a.txt', 'b.txt'] } },
    async () => 'PASSED-THROUGH',
  )
  assert.deepEqual(decision, { kind: 'ask', reason: '发送邮件给 boss@corp.com，主题「周报」，附件 2 个' })
})

test('other tools pass through the gate untouched', async () => {
  const ctx = fakeCtx()
  apply(ctx, QQ)
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  for (const tool of ['email_list', 'email_attachment', 'email_folders']) {
    const out = await gate.fn({ name: tool, args: {} }, async () => 'PASSED-THROUGH')
    assert.equal(out, 'PASSED-THROUGH')
  }
})

test('sendApproval: false skips the ask', async () => {
  const ctx = fakeCtx()
  apply(ctx, { ...QQ, sendApproval: false })
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  const out = await gate.fn({ name: 'email_send', args: { to: 'x@y.z', subject: 's' } }, async () => 'PASSED-THROUGH')
  assert.equal(out, 'PASSED-THROUGH')
})

test('validateAttachmentPaths stats files and enforces the total cap', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-email-test-'))
  try {
    await writeFile(join(dir, 'a.txt'), 'hello')
    await writeFile(join(dir, 'b.bin'), Buffer.alloc(100))
    const ok = await validateAttachmentPaths([join(dir, 'a.txt'), join(dir, 'b.bin')], 1000)
    assert.equal(ok.length, 2)
    await assert.rejects(
      () => validateAttachmentPaths([join(dir, 'a.txt'), join(dir, 'b.bin')], 10),
      err => err instanceof MailError && /总大小超过上限/.test(err.message),
    )
    await assert.rejects(
      () => validateAttachmentPaths([join(dir, 'missing.txt')], 1000),
      err => err instanceof MailError && /不存在或不可读/.test(err.message),
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
