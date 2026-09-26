import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
  assert.match(String(value.checks[0].detail), /配置不完整/)
  assert.match(String(value.checks[0].detail), /邮箱地址.*授权码.*设置.*邮件/)
})

// --- OAuth2 accounts ---------------------------------------------------------
//
// An OAuth2 account with no token is *configured*, not broken: the missing
// piece is a browser login. Reporting it as an error would send the user
// hunting for a broken setting that is in fact fine.

test('email_health: an OAuth2 account with no token reports 需登录 rather than an error', async (t) => {
  const home = mkdtempSync(join(tmpdir(), 'dsh-email-health-oauth2-'))
  const previous = process.env.DSH_HOME
  process.env.DSH_HOME = home
  t.after(() => {
    if (previous === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previous
    rmSync(home, { recursive: true, force: true })
  })
  const { writeTokenStore } = await import('../lib/index.js')
  writeTokenStore({ version: 1, accounts: {} })

  const ctx = fakeCtx()
  apply(ctx, { accounts: { work: { provider: 'outlook', user: 'a@outlook.com' } } })
  const health = ctx.tools.defs.find((d) => d.name === 'email_health')
  const loggedOut = await health.execute({})
  assert.equal(loggedOut.ok, true, 'a missing token is not a configuration failure')
  assert.equal(loggedOut.accountCount, 1)
  assert.match(String(loggedOut.checks[0].detail), /outlook/)
  assert.match(String(loggedOut.checks[0].detail), /需登录|尚未登录/)
  assert.match(String(loggedOut.checks[0].detail), /设置页/)

  writeTokenStore({
    version: 1,
    accounts: {
      work: { user: 'a@outlook.com', clientId: 'c', refreshToken: 'r', accessToken: 'a', expiresAt: Date.now() + 3600_000 },
    },
  })
  const loggedIn = await health.execute({})
  assert.equal(loggedIn.ok, true)
  assert.match(String(loggedIn.checks[0].detail), /已登录/)
  assert.match(String(loggedIn.checks[0].detail), /a@outlook\.com/)
})
