import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply, validateAttachmentPaths, MailError } from '../lib/index.js'

function fakeCtx(scopeValue = {}) {
  const ctx = {
    approval: { request: async () => 'allowed-once' },
    get(name) { if (name === 'approval') return this.approval; return undefined },
    tools: { register(def) { this.defs.push(def) }, defs: [] },
    listeners: [],
    on(event, fn, opts) { this.listeners.push({ event, fn, opts }) },
    effect(fn) { this.effects.push(fn()) },
    effects: [],
    inject() {},
    logger: { warn() {} },
    settings: {
      registered: [],
      register(ns, schema, opts) {
        this.registered.push({ ns, opts })
        const defaults = {
          provider: '', user: '', password: '', inboxFolder: 'INBOX', sendApproval: true,
          maxBodyChars: 20000, downloadDir: '',
          imap: { host: '', port: 993, secure: true },
          smtp: { host: '', port: 465, secure: true },
        }
        return {
          get: () => ({ ...defaults, ...scopeValue }),
          replace: async () => {},
        }
      },
      writable: true,
    },
  }
  return ctx
}

const QQ = { provider: 'qq', user: 'a@b.c', password: 'p' }

test('every registered tool parameters value is a compiled JSON Schema (native wire contract)', () => {
  const ctx = fakeCtx()
  apply(ctx, {})
  for (const def of ctx.tools.defs) {
    assert.equal(def.parameters.type, 'object', def.name + ' parameters root must be type object')
    assert.ok(def.parameters.properties && typeof def.parameters.properties === 'object', def.name + ' must have properties')
    for (const [key, node] of Object.entries(def.parameters.properties)) {
      assert.ok(typeof node.type === 'string', def.name + '.' + key + ' must declare a type')
    }
  }
  const read = ctx.tools.defs.find(def => def.name === 'email_read')
  assert.deepEqual(read.parameters.required, ['uid'])
  const send = ctx.tools.defs.find(def => def.name === 'email_send')
  assert.deepEqual(send.parameters.properties.attachments.items, { type: 'string' })
})

test('apply registers the eight email tools even without config', () => {
  const ctx = fakeCtx()
  apply(ctx, {})
  const names = ctx.tools.defs.map(def => def.name).sort()
  assert.deepEqual(names, ['email_attachment', 'email_folders', 'email_health', 'email_list', 'email_read', 'email_search', 'email_send', 'email_watch'])
})

test('every tool returns a config hint instead of throwing when unconfigured', async () => {
  const ctx = fakeCtx()
  apply(ctx, {})
  const list = ctx.tools.defs.find(def => def.name === 'email_list')
  await assert.rejects(() => list.execute({}), /dsh-email 未配置/)
  const folders = ctx.tools.defs.find(def => def.name === 'email_folders')
  await assert.rejects(() => folders.execute({}), /dsh-email 未配置/)
  const watch = ctx.tools.defs.find(def => def.name === 'email_watch')
  await assert.rejects(() => watch.execute({}), /dsh-email 未配置/)
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

test('email_send runs the approval round-trip with recipient, subject and attachment count', async () => {
  const ctx = fakeCtx()
  const seen = []
  ctx.approval.request = async (req) => { seen.push(req); return 'allowed-once' }
  apply(ctx, QQ)
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  assert.ok(gate)
  assert.equal(gate.opts.prepend, true)
  const out = await gate.fn(
    { name: 'email_send', args: { to: 'boss@corp.com', subject: '周报', attachments: ['a.txt', 'b.txt'] } },
    async () => 'PASSED-THROUGH',
  )
  assert.equal(out, 'PASSED-THROUGH')
  assert.equal(seen.length, 1)
  assert.equal(seen[0].toolName, 'email_send')
  assert.equal(seen[0].reason, '发送邮件给 boss@corp.com，主题「周报」，附件 2 个')
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

test('sendApproval: false in the live settings skips the ask', async () => {
  const ctx = fakeCtx({ sendApproval: false })
  apply(ctx, QQ)
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  const out = await gate.fn({ name: 'email_send', args: { to: 'x@y.z', subject: 's' } }, async () => 'PASSED-THROUGH')
  assert.equal(out, 'PASSED-THROUGH')
})

test('gate passes through when the account is not configured', async () => {
  const ctx = fakeCtx()
  apply(ctx, {})
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  const out = await gate.fn({ name: 'email_send', args: { to: 'x@y.z', subject: 's' } }, async () => 'PASSED-THROUGH')
  assert.equal(out, 'PASSED-THROUGH')
})

test('settings namespace is registered with the row config as base', () => {
  const ctx = fakeCtx()
  apply(ctx, QQ)
  const registration = ctx.settings.registered.find(r => r.ns === 'dsh-email')
  assert.ok(registration)
  assert.equal(registration.opts.applies, 'live')
  assert.equal(registration.opts.base.user, 'a@b.c')
})

test('configured accounts can come from the live settings value instead of the row', () => {
  const ctx = fakeCtx({ provider: 'qq', user: 'from@settings.com', password: 's', sendApproval: true })
  apply(ctx, {}) // row config empty; apply-time nudge must not throw
  const list = ctx.tools.defs.find(def => def.name === 'email_list')
  assert.ok(list) // getPool built from the live value without throwing
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
      await assert.rejects(
        () => validateAttachmentPaths([42], 1000),
        err => err instanceof MailError && /附件路径无效/.test(err.message),
      )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('approval "rejected" denies with an actionable message covering Full Access', async () => {
  const ctx = fakeCtx()
  ctx.approval.request = async () => 'rejected'
  apply(ctx, QQ)
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  const decision = await gate.fn(
    { name: 'email_send', args: { to: 'boss@corp.com', subject: 's' } },
    async () => 'PASSED-THROUGH',
  )
  assert.equal(decision.kind, 'deny')
  assert.match(decision.reason, /Full Access/)
  assert.match(decision.reason, /sendApproval/)
})

test('approval "allowed-once" proceeds to the tool', async () => {
  const ctx = fakeCtx()
  ctx.approval.request = async () => 'allowed-once'
  apply(ctx, QQ)
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  const out = await gate.fn({ name: 'email_send', args: { to: 'x@y.z', subject: 's' } }, async () => 'PASSED-THROUGH')
  assert.equal(out, 'PASSED-THROUGH')
})

test('sendApproval: false bypasses the approval round-trip entirely', async () => {
  const ctx = fakeCtx({ sendApproval: false })
  ctx.approval.request = async () => { throw new Error('must not be called') }
  apply(ctx, QQ)
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  const out = await gate.fn({ name: 'email_send', args: { to: 'x@y.z', subject: 's' } }, async () => 'PASSED-THROUGH')
  assert.equal(out, 'PASSED-THROUGH')
})

test('no approval channel denies with the headless hint', async () => {
  const ctx = fakeCtx()
  ctx.approval = undefined
  apply(ctx, QQ)
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  const decision = await gate.fn({ name: 'email_send', args: { to: 'x@y.z', subject: 's' } }, async () => 'PASSED-THROUGH')
  assert.equal(decision.kind, 'deny')
  assert.match(decision.reason, /headless|审批通道/)
})
