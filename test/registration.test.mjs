import test from 'node:test'
import assert from 'node:assert/strict'
import { apply } from '../lib/index.js'

function fakeCtx() {
  const ctx = {
    tools: { register(def) { this.defs.push(def) }, defs: [] },
    listeners: [],
    on(event, fn, opts) { this.listeners.push({ event, fn, opts }) },
    logger: { warn() {} },
  }
  return ctx
}

test('apply registers the four email tools even without config', () => {
  const ctx = fakeCtx()
  apply(ctx, {})
  const names = ctx.tools.defs.map(def => def.name).sort()
  assert.deepEqual(names, ['email_list', 'email_read', 'email_search', 'email_send'])
})

test('every tool returns a config hint instead of throwing when unconfigured', async () => {
  const ctx = fakeCtx()
  apply(ctx, {})
  const list = ctx.tools.defs.find(def => def.name === 'email_list')
  await assert.rejects(() => list.execute({}), /dsh-email 未配置/)
  const send = ctx.tools.defs.find(def => def.name === 'email_send')
  await assert.rejects(() => send.execute({ to: 'a@b.c', subject: 's' }), /dsh-email 未配置/)
})

test('execute validates uid and query without touching the network', async () => {
  const ctx = fakeCtx()
  apply(ctx, { provider: 'qq', user: 'a@b.c', password: 'p' })
  const read = ctx.tools.defs.find(def => def.name === 'email_read')
  await assert.rejects(() => read.execute({ uid: -1 }), /uid 必须是正整数/)
  const search = ctx.tools.defs.find(def => def.name === 'email_search')
  await assert.rejects(() => search.execute({ query: '  ' }), /query 不能为空/)
})

test('email_send asks for approval with recipient and subject in the reason', async () => {
  const ctx = fakeCtx()
  apply(ctx, { provider: 'qq', user: 'a@b.c', password: 'p' })
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  assert.ok(gate)
  assert.equal(gate.opts.prepend, true)
  const decision = await gate.fn(
    { name: 'email_send', args: { to: 'boss@corp.com', subject: '周报' } },
    async () => 'PASSED-THROUGH',
  )
  assert.deepEqual(decision, { kind: 'ask', reason: '发送邮件给 boss@corp.com，主题「周报」' })
})

test('other tools pass through the gate untouched', async () => {
  const ctx = fakeCtx()
  apply(ctx, { provider: 'qq', user: 'a@b.c', password: 'p' })
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  const out = await gate.fn({ name: 'email_list', args: {} }, async () => 'PASSED-THROUGH')
  assert.equal(out, 'PASSED-THROUGH')
})

test('sendApproval: false skips the ask', async () => {
  const ctx = fakeCtx()
  apply(ctx, { provider: 'qq', user: 'a@b.c', password: 'p', sendApproval: false })
  const gate = ctx.listeners.find(l => l.event === 'tools/pre-execute')
  const out = await gate.fn({ name: 'email_send', args: { to: 'x@y.z', subject: 's' } }, async () => 'PASSED-THROUGH')
  assert.equal(out, 'PASSED-THROUGH')
})
