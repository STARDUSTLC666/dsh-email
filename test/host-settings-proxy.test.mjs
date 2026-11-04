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
