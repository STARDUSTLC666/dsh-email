import test from 'node:test'
import assert from 'node:assert/strict'
import { createEmailRuntime } from '../lib/runtime.js'
import { EmailSettingsBackend } from '../lib/web.js'

test('0.1.7 reads live Config references and writes the owning entry without resetting advanced fields', async t => {
  let value = { provider: 'outlook', user: 'me@example.com', authKind: 'password', password: 'fixture', maxAttachmentBytes: 3145728, accountsYaml: undefined, accounts: {} }
  let revision = 4
  const refs = Object.fromEntries(Object.keys(value).map(key => [key, { get: () => value[key] }]))
  const calls = []
  const ctx = {
    fiber: { entry: { options: { id: 'work-mail' } } },
    settings: {
      describe: () => [{ ns: 'work-mail', value, user: value, revision, applies: 'live' }],
      async update(ns, patch, expected) {
        assert.equal(ns, 'work-mail')
        if (expected !== revision) throw new Error('settings conflict')
        calls.push(patch); value = { ...value, ...patch }; revision++
      },
    },
    effect: fn => fn(), logger: { warn() {} },
  }
  const runtime = createEmailRuntime(ctx, refs, () => ({ startIdleSweep() {}, dispose() {} }))
  t.after(() => runtime.dispose())
  assert.equal(runtime.getEffectiveSettings().accounts.get('default').smtp.port, 587, 'UI defaults must not override Outlook')
  value = { ...value, user: 'changed@example.com' }
  assert.equal(runtime.getEffectiveSettings().accounts.get('default').user, 'changed@example.com')
  const backend = new EmailSettingsBackend(ctx, runtime.settingsScope, refs)
  const snapshot = await backend.snapshot()
  assert.equal(snapshot.settings.revision, 4)
  assert.equal(snapshot.settings.value.smtp.port, 587)
  assert.equal(snapshot.accountsDetail.list.length, 1, 'legacy shorthand must appear as an editable card')
  await backend.save({ user: 'saved@example.com' }, 4)
  assert.equal(value.maxAttachmentBytes, 3145728)
  assert.equal(value.password, 'fixture')
  assert.equal(calls.length, 1)
  await assert.rejects(backend.save({ user: 'stale@example.com' }, 4), /conflict/)
  await backend.save({ accountsYaml: '' }, 5)
  assert.equal((await backend.snapshot()).accountsDetail.list.length, 0)
  assert.equal(value.password, '')
  assert.throws(() => runtime.getEffectiveSettings(), /未配置|user|账号/)
})
