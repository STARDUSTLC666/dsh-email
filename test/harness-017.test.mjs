import test from 'node:test'
import assert from 'node:assert/strict'
import { createEmailRuntime } from '../lib/runtime.js'
import { EmailSettingsBackend } from '../lib/web.js'

test('rule saves preserve credentials, and an older account autosave cannot restore an old rule', async t => {
  let value = { provider: 'qq', user: 'me@example.test', password: 'fixture-secret', trustedRecipientsYaml: '', maxAttachmentBytes: 3145728 }, revision = 1
  const refs = Object.fromEntries(Object.keys(value).map(key => [key, { get: () => value[key] }]))
  const ctx = { fiber: { entry: { options: { id: 'email' } } }, settings: { describe: () => [{ ns: 'email', user: value, revision }], async update(_ns, patch, expected) { if (expected !== revision) throw Object.assign(new Error('conflict'), { code: 'SETTINGS_CONFLICT' }); value = { ...value, ...patch }; revision++ } }, effect: fn => fn(), logger: { warn() {} } }
  const runtime = createEmailRuntime(ctx, refs, () => ({ startIdleSweep() {}, dispose() {} })); t.after(() => runtime.dispose())
  const backend = new EmailSettingsBackend(ctx, runtime.settingsScope, refs), rule = 'default: { skipApproval: true, addresses: [friend@example.test] }'
  await backend.saveRecipientRules(rule, 1)
  assert.equal(value.password, 'fixture-secret'); assert.equal(value.maxAttachmentBytes, 3145728)
  await assert.rejects(backend.saveRecipientRules('', 1), { code: 'SETTINGS_CONFLICT' })
  await backend.save({ user: 'new@example.test', trustedRecipientsYaml: '' }, 2)
  assert.equal(value.trustedRecipientsYaml, rule); assert.equal(value.password, 'fixture-secret'); assert.equal(value.user, 'new@example.test')
})

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
