import test from 'node:test'
import assert from 'node:assert/strict'
import { Config } from '../lib/host-config.js'
import { createEmailRuntime } from '../lib/runtime.js'
import { EmailSettingsBackend } from '../lib/web.js'

test('a complete account form can persist through the native volatile config contract and reload', async t => {
  const raw = {}
  let revision = 0
  const ctx = {
    fiber: { entry: { options: { id: 'tool-email' } } },
    settings: { writable: true, describe: () => [{ ns: 'tool-email', revision }], async update(ns, section, expected) {
      assert.equal(ns, 'tool-email')
      assert.equal(expected, revision)
      // The current host rejects the entire save if even one submitted field
      // is missing from the volatile schema, including default-valued fields.
      for (const key of Object.keys(section)) assert.equal(Config.dict[key]?.meta.volatile, true, key + ' is not editable')
      Object.assign(raw, section)
      revision++
    } },
    effect() {},
  }
  const pool = () => ({ startIdleSweep() {}, dispose() {} })
  const runtime = createEmailRuntime(ctx, raw, pool)
  t.after(() => runtime.dispose())
  const backend = new EmailSettingsBackend(ctx, runtime.settingsScope, raw)
  const value = { ...runtime.getSettingsValue(), newMailPopup: false,
    accountsYaml: 'work: {provider: qq, user: fixture@example.test, password: fixture-only, proxy: direct}\n' }
  await backend.save(value, 0)
  const reloaded = createEmailRuntime(ctx, raw, pool)
  t.after(() => reloaded.dispose())
  const snapshot = await new EmailSettingsBackend(ctx, reloaded.settingsScope, raw).snapshot()
  assert.equal(snapshot.accountsDetail.list[0].proxyMode, 'direct')
  assert.equal(snapshot.settings.value.newMailPopup, false)
  assert.equal(reloaded.getEffectiveSettings().accounts.get('work').proxy, 'direct')
  assert.equal(Config.dict.proxy.meta.role, 'secret')
})

test('consumer configuration survives the same volatile contract and reloads intact', async t => {
  const raw = {}
  let revision = 0
  const ctx = {
    fiber: { entry: { options: { id: 'tool-email' } } },
    settings: { writable: true, describe: () => [{ ns: 'tool-email', revision }], async update(ns, section, expected) {
      assert.equal(ns, 'tool-email')
      assert.equal(expected, revision)
      for (const key of Object.keys(section)) assert.equal(Config.dict[key]?.meta.volatile, true, key + ' is not editable')
      Object.assign(raw, section)
      revision++
    } },
    effect() {},
  }
  const pool = () => ({ startIdleSweep() {}, dispose() {} })
  const runtime = createEmailRuntime(ctx, raw, pool)
  t.after(() => runtime.dispose())
  const backend = new EmailSettingsBackend(ctx, runtime.settingsScope, raw)
  const consumers = [{ id: 'alice', account: 'work', folder: 'INBOX', senders: ['alice@example.test'], subject: 'invoice', enabled: true }]
  const value = {
    ...runtime.getSettingsValue(),
    accountsYaml: 'work: {provider: qq, user: fixture@example.test, password: fixture-only}\n',
    consumers,
    consumerPollSeconds: 45,
  }
  await backend.save(value, 0)
  const reloaded = createEmailRuntime(ctx, raw, pool)
  t.after(() => reloaded.dispose())
  const stored = reloaded.getSettingsValue()
  assert.deepEqual(stored.consumers, consumers)
  assert.equal(stored.consumerPollSeconds, 45)

  // A second save must keep the values rather than resetting them to schema defaults.
  const second = new EmailSettingsBackend(ctx, reloaded.settingsScope, raw)
  await second.save({ ...stored, consumerPollSeconds: 90 }, 1)
  const again = createEmailRuntime(ctx, raw, pool)
  t.after(() => again.dispose())
  assert.deepEqual(again.getSettingsValue().consumers, consumers)
  assert.equal(again.getSettingsValue().consumerPollSeconds, 90)
})

test('invalid consumer configuration is rejected before it reaches the settings store', async t => {
  const raw = {}
  const ctx = {
    fiber: { entry: { options: { id: 'tool-email' } } },
    settings: { writable: true, describe: () => [{ ns: 'tool-email', revision: 0 }], async update() { throw new Error('must not be called') } },
    effect() {},
  }
  const runtime = createEmailRuntime(ctx, raw, () => ({ startIdleSweep() {}, dispose() {} }))
  t.after(() => runtime.dispose())
  const backend = new EmailSettingsBackend(ctx, runtime.settingsScope, raw)
  const base = runtime.getSettingsValue()
  await assert.rejects(backend.save({ ...base, consumers: [{ id: 'bad id', account: 'work' }] }, 0), /invalid id/)
  await assert.rejects(backend.save({ ...base, consumerPollSeconds: 5 }, 0), /between 30 and 3600/)
})
