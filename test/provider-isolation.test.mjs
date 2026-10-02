import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEmailSettings, parseAccountsYaml, serializeAccountsYaml } from '../lib/config.js'
import { createEmailRuntime } from '../lib/runtime.js'
import { EmailSettingsBackend } from '../lib/web.js'
import { EmailPool } from '../lib/mail-client.js'

const endpoints = {
  imap: { host: 'outlook.office365.com', port: 993, secure: true, socketTimeoutMs: 9000 },
  smtp: { host: 'smtp.office365.com', port: 587, secure: false },
}
const accounts = {
  outlook: { provider: 'outlook', user: 'fixture@outlook.com' },
  gmail: { provider: 'gmail', user: 'fixture@gmail.com', password: 'fixture-app-password' },
}

test('named providers use their own servers despite stale shared Outlook endpoints (#20)', () => {
  for (const accountSource of [{ accounts }, { accountsYaml: serializeAccountsYaml(accounts, 'outlook') }]) {
    const resolved = resolveEmailSettings({ ...endpoints, defaultAccount: 'outlook', ...accountSource })
    const gmail = resolved.accounts.get('gmail')
    assert.equal(gmail.imap.host, 'imap.gmail.com')
    assert.equal(gmail.smtp.host, 'smtp.gmail.com')
    assert.equal(gmail.smtp.port, 465)
    assert.equal(gmail.smtp.secure, true)
    assert.equal(gmail.authKind, 'password')
    assert.equal(gmail.imap.socketTimeoutMs, 9000, 'shared transport timeouts remain useful')
    assert.equal(resolved.accounts.get('outlook').authKind, 'oauth2')
  }
})

test('account endpoint overrides remain explicit, and legacy accounts retain shared servers', () => {
  const resolved = resolveEmailSettings({ ...endpoints, defaultAccount: 'gmail', accounts: {
    gmail: { ...accounts.gmail, smtp: { port: 2525, secure: false } },
    relay: { user: 'fixture@relay.example', password: 'fixture-relay-password', authKind: 'password', imap: { host: '', port: 993, secure: true }, smtp: { host: '', port: 465, secure: true } },
  } })
  const gmail = resolved.accounts.get('gmail')
  assert.equal(gmail.smtp.host, 'smtp.gmail.com')
  assert.equal(gmail.smtp.port, 2525)
  assert.equal(gmail.smtp.secure, false)
  assert.equal(resolved.accounts.get('relay').smtp.host, 'smtp.office365.com')
  assert.equal(resolved.accounts.get('relay').smtp.port, 587)
})

function modern(t, raw) {
  const writes = []
  const ctx = {
    fiber: { entry: { options: { id: 'tool-email' } } },
    settings: { writable: true, describe: () => [], update: async (_ns, section) => { writes.push(section); Object.assign(raw, section) } },
    effect: () => {}, logger: { warn() {} },
  }
  const runtime = createEmailRuntime(ctx, raw, () => ({ startIdleSweep() {}, dispose() {} }))
  t.after(() => runtime.dispose())
  return { runtime, writes, backend: new EmailSettingsBackend(ctx, runtime.settingsScope, raw) }
}

test('modern account cards never materialize a different provider shared server into named accounts', t => {
  const { runtime } = modern(t, { ...endpoints, accounts, defaultAccount: 'outlook' })
  const draft = parseAccountsYaml(runtime.getSettingsValue().accountsYaml).map.gmail
  const roundTrip = resolveEmailSettings({ accountsYaml: serializeAccountsYaml({ gmail: draft }) }).accounts.get('gmail')
  assert.equal(roundTrip.imap.host, 'imap.gmail.com')
  assert.equal(roundTrip.smtp.host, 'smtp.gmail.com')
  assert.equal(roundTrip.authKind, 'password')
})

test('saving an Outlook card does not persist form-derived shared endpoints or alter Gmail', async t => {
  const raw = { accountsYaml: serializeAccountsYaml(accounts, 'outlook') }
  const { runtime, backend, writes } = modern(t, raw)
  const value = runtime.getSettingsValue()
  assert.equal(value.imap.host, 'outlook.office365.com', 'form defaults are derived from the default card')
  await backend.save(value, 0)
  assert.equal(Object.hasOwn(writes[0], 'imap'), false)
  assert.equal(Object.hasOwn(writes[0], 'smtp'), false)
  assert.equal(runtime.getEffectiveSettings().accounts.get('gmail').imap.host, 'imap.gmail.com')
  assert.equal(runtime.getEffectiveSettings().accounts.get('gmail').authKind, 'password')
})

test('connection failures show the selected endpoint and scrub server-echoed credentials', async t => {
  let serverError = 'Command failed password=fixture-app-password'
  t.mock.method(EmailPool.prototype, 'withImap', async () => { throw new Error(serverError) })
  const { runtime, backend } = modern(t, { accountsYaml: serializeAccountsYaml({ gmail: accounts.gmail }) })
  await assert.rejects(backend.test(runtime.getSettingsValue(), 'gmail'), error => {
    assert.match(error.message, /gmail.*imap\.gmail\.com:993/)
    assert.match(error.message, /邮箱登录失败/)
    assert.doesNotMatch(error.message, /fixture-app-password/)
    return true
  })
  serverError = 'Connection closed unexpectedly password=p'
  const short = modern(t, { accountsYaml: serializeAccountsYaml({ gmail: { ...accounts.gmail, password: 'p' } }) })
  await assert.rejects(short.backend.test(short.runtime.getSettingsValue(), 'gmail'), error => {
    assert.match(error.message, /Connection closed unexpectedly/)
    assert.doesNotMatch(error.message, /password=p\b/)
    return true
  })
})

test('legacy shorthand retains its documented sender alias and SMTP login pair', () => {
  const account = resolveEmailSettings({ provider: 'qq', user: 'alias@example.com', password: 'mail-password', senderName: 'Fixture Sender', authUser: 'real@example.com', authPassword: 'login-password' }).accounts.get('default')
  assert.equal(account.senderName, 'Fixture Sender')
  assert.equal(account.authUser, 'real@example.com')
  assert.equal(account.authPassword, 'login-password')
})
