import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailSettingsSchema, toEmailConfig } from '../lib/settings.js'
import { resolveEmailSettings } from '../lib/config.js'
import { createEmailRuntime } from '../lib/runtime.js'

test('saved blank-host defaults must not replace the Outlook SMTP preset (issue 17)', () => {
  const saved = { provider: 'outlook', user: 'fixture@outlook.com', authKind: 'oauth2',
    imap: { host: '', port: 993, secure: true }, smtp: { host: '', port: 465, secure: true } }
  const settings = resolveEmailSettings(toEmailConfig(saved, saved))
  const smtp = settings.accounts.get('default').smtp
  assert.equal(smtp.host, 'smtp.office365.com')
  assert.equal(smtp.port, 587)
  assert.equal(smtp.secure, false)
})

test('shared saved endpoint defaults must not leak into a named Outlook account', () => {
  const saved = { smtp: { host: '', port: 465, secure: true }, accountsYaml: 'work:\n  provider: outlook\n  user: fixture@outlook.com\n  authKind: oauth2\n' }
  const smtp = resolveEmailSettings(toEmailConfig(saved, saved)).accounts.get('work').smtp
  assert.equal(smtp.port, 587)
  assert.equal(smtp.secure, false)
})

test('explicit custom endpoints and non-default ports remain deliberate overrides', () => {
  const saved = { provider: 'outlook', user: 'fixture@outlook.com', smtp: { host: 'smtp.custom.example', port: 465, secure: true } }
  assert.deepEqual(resolveEmailSettings(toEmailConfig(saved, saved)).accounts.get('default').smtp, saved.smtp)
  const customPort = { ...saved, smtp: { host: '', port: 25, secure: false } }
  const resolved = resolveEmailSettings(toEmailConfig(customPort, customPort)).accounts.get('default').smtp
  assert.equal(resolved.port, 25)
  assert.equal(resolved.secure, false)
  const tlsPort = { ...saved, smtp: { host: '', port: 25, secure: true } }
  assert.equal(resolveEmailSettings(toEmailConfig(tlsPort, tlsPort)).accounts.get('default').smtp.secure, true)
  const explicit = resolveEmailSettings({ provider: 'outlook', user: 'fixture@outlook.com', smtp: { port: 465, secure: true } })
  assert.equal(explicit.accounts.get('default').smtp.port, 465, 'a config override without a placeholder host remains explicit')
  const explicitStored = { provider: 'outlook', user: 'fixture@outlook.com', smtp: { port: 465, secure: true } }
  assert.equal(resolveEmailSettings(toEmailConfig(EmailSettingsSchema(explicitStored), explicitStored)).accounts.get('default').smtp.port, 465,
    'an explicit stored port without a blank-host placeholder must survive settings projection')
})

test('current Harness configs containing migrated placeholder endpoints recover presets without mutation', () => {
  const config = { legacySettingsImported: true, accounts: { work: { provider: 'outlook', user: 'fixture@outlook.com' } },
    imap: { host: '', port: 993, secure: true, socketTimeoutMs: 12000 }, smtp: { host: '   ', port: 465, secure: true } }
  const before = structuredClone(config)
  const account = resolveEmailSettings(config).accounts.get('work')
  assert.equal(account.smtp.host, 'smtp.office365.com')
  assert.equal(account.smtp.port, 587)
  assert.equal(account.smtp.secure, false)
  assert.equal(account.imap.socketTimeoutMs, 12000)
  const runtime = createEmailRuntime({ settings: {}, fiber: { entry: { options: { id: 'tool-email' } } }, effect() {} }, config,
    () => ({ startIdleSweep() {}, dispose() {} }))
  try {
    assert.deepEqual(runtime.getEffectiveSettings().accounts.get('work').smtp, account.smtp,
      'Harness 0.1.7 reads the config directly, without legacy settings projection')
  } finally { runtime.dispose() }
  assert.deepEqual(config, before)
})
