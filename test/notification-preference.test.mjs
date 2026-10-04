import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { EmailSettingsSchema, toSettingsBase, validateSettingsValue } from '../lib/settings.js'
import { createEmailRuntime } from '../lib/runtime.js'
import { EmailSettingsBackend } from '../lib/web.js'

const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)) }
function widgetFixture(enabled = true) {
  const timers = new Map(), roots = [], events = new Map()
  let serial = 0, client, pendingWatch, hold = false, watches = 0
  const element = () => ({ children: [], setAttribute() {}, appendChild(child) { this.children.push(child) },
    replaceChildren() { this.children = [] }, remove() { this.removed = true },
    get childElementCount() { return this.children.length } })
  const document = { hidden: false, createElement: element, querySelector: () => null,
    body: { appendChild(root) { roots.push(root) } }, addEventListener(name, cb) { events.set(name, cb) }, removeEventListener(name) { events.delete(name) } }
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8').replace('return module.exports;',
    'module.exports.probe = { startWhaleWidget, preference: value => updateWhalePreference(value) }; return module.exports;')
  runInNewContext(source, {
    window: { __ModuleLoader__: { load({ factory }) { client = factory(() => ({})) } } }, document, AbortController,
    setTimeout(fn, delay) { const id = ++serial; timers.set(id, { fn, delay }); return id }, clearTimeout(id) { timers.delete(id) },
    async fetch(_url, options) {
      const action = options.body && JSON.parse(options.body).action
      if (action === 'watch') {
        watches++
        if (hold) await new Promise(resolve => { pendingWatch = resolve }) // Deliberately ignore abort.
      }
      return { ok: true, json: async () => ({ ok: true, value: action === 'watch'
        ? { newCount: 1, messages: [{ subject: 'New message', from: [{ address: 'sender@example.test' }] }] }
        : { settings: { value: { newMailPopup: enabled } }, accounts: ['default'], whale: {} } }) }
    },
  })
  const dispose = client.probe.startWhaleWidget()
  return { dispose, roots, timers, events, probe: client.probe, get watches() { return watches },
    setSaved(value) { enabled = value }, hold() { hold = true }, release() { hold = false; pendingWatch?.() },
    async poll() { const item = [...timers.entries()].find(([, timer]) => timer.delay >= 30000); assert.ok(item); timers.delete(item[0]); item[1].fn(); await settle() } }
}

test('popup preference defaults on and persists without replacing credentials or IMAP sessions', async t => {
  assert.equal(EmailSettingsSchema({}).newMailPopup, true)
  assert.equal(EmailSettingsSchema(toSettingsBase({ newMailPopup: false })).newMailPopup, false)
  assert.throws(() => validateSettingsValue({ newMailPopup: 'false' }), /布尔/)
  let value = { provider: 'qq', user: 'me@example.test', password: 'fixture-secret', newMailPopup: true }, revision = 1
  const refs = Object.fromEntries(Object.keys(value).map(key => [key, { get: () => value[key] }]))
  const ctx = { fiber: { entry: { options: { id: 'email' } } }, settings: {
    describe: () => [{ ns: 'email', user: value, revision }],
    async update(_ns, patch, expected) { assert.equal(expected, revision); value = { ...value, ...patch }; revision++ },
  }, effect: fn => fn() }
  let created = 0
  const runtime = createEmailRuntime(ctx, refs, () => { created++; return { startIdleSweep() {}, dispose() {} } })
  t.after(() => runtime.dispose())
  const pool = runtime.getPool()
  await new EmailSettingsBackend(ctx, runtime.settingsScope, refs).save({ newMailPopup: false }, revision)
  assert.equal(value.newMailPopup, false)
  assert.equal(value.password, 'fixture-secret')
  assert.equal(runtime.getPool(), pool)
  assert.equal(created, 1)
  assert.equal((await new EmailSettingsBackend(ctx, runtime.settingsScope, refs).snapshot()).settings.value.newMailPopup, false)
})

test('disabled startup never checks mail; another tab can re-enable with a silent fresh baseline', async t => {
  const f = widgetFixture(false); t.after(f.dispose)
  await settle(); assert.equal(f.watches, 0)
  await f.poll(); assert.equal(f.watches, 0)
  f.setSaved(true)
  await f.poll(); assert.equal(f.watches, 1); assert.equal(f.roots[0].childElementCount, 0)
  await f.poll(); assert.equal(f.roots[0].childElementCount, 1)
  f.probe.preference(false)
  assert.equal(f.roots[0].childElementCount, 0)
  await f.poll(); assert.equal(f.watches, 2, 'editor preview beats the still-enabled saved value')
})

test('closing the preference or unloading suppresses late watch results even if transport ignores abort', async t => {
  const f = widgetFixture(); t.after(f.dispose)
  await settle()
  f.hold(); await f.poll(); assert.equal(f.watches, 2)
  f.probe.preference(false); f.release(); await settle()
  assert.equal(f.roots[0].childElementCount, 0)
  f.probe.preference(true); await f.poll()
  assert.equal(f.roots[0].childElementCount, 0, 're-enabling drops accumulated mail from the notification baseline')
  f.hold(); await f.poll(); f.dispose(); f.release(); await settle()
  assert.equal(f.roots[0].childElementCount, 0)
  assert.equal(f.roots[0].removed, true)
  assert.equal(f.timers.size, 0)
  assert.equal(f.events.size, 0)
})
