import test from 'node:test'
import assert from 'node:assert/strict'
import { apply } from '../lib/index.js'

function fakeCtx() {
  return {
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
      register() { return { get: () => ({ provider: '', user: '', password: '', inboxFolder: 'INBOX', sendApproval: true, maxBodyChars: 20000, downloadDir: '', imap: { host: '', port: 993, secure: true }, smtp: { host: '', port: 465, secure: true } }), replace: async () => {} } },
      writable: true,
    },
  }
}

test('email_health 账号配置完整时 ok=true', async () => {
  const ctx = fakeCtx()
  apply(ctx, { accounts: { work: { provider: 'qq', user: 'a@b.c', password: 'p' } } })
  const health = ctx.tools.defs.find((d) => d.name === 'email_health')
  const value = await health.execute({})
  assert.equal(value.ok, true)
  assert.equal(value.accountCount, 1)
  assert.match(String(value.checks[0].detail), /qq/)
})

test('email_health 无账号时 ok=false 且有配置指引', async () => {
  const ctx = fakeCtx()
  apply(ctx, {})
  const health = ctx.tools.defs.find((d) => d.name === 'email_health')
  const value = await health.execute({})
  assert.equal(value.ok, false)
  assert.match(String(value.checks[0].detail), /未配置/)
  assert.match(String(value.checks[0].detail), /user.*password.*cordis\.patch\.yml/)
})
