import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { EmailSettingsSchema, toSettingsBase, validateSettingsValue } from '../lib/settings.js'
import { createEmailRuntime } from '../lib/runtime.js'
import { EmailSettingsBackend, WHALE_API_ROUTE } from '../lib/web.js'

const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)) }
function widgetFixture(enabled = true, whale = {}) {
  const timers = new Map(), roots = [], events = new Map()
  let serial = 0, client, pendingWatch, hold = false, watches = 0
  const element = tag => ({ tag, attributes: new Map(), children: [],
    setAttribute(name, value) { this.attributes.set(name, String(value)) },
    getAttribute(name) { return this.attributes.get(name) ?? null },
    appendChild(child) { this.children.push(child) },
    replaceChildren() { this.children = [] }, remove() { this.removed = true },
    get childElementCount() { return this.children.length } })
  const document = { hidden: false, createElement: element, querySelector: () => null,
    body: { appendChild(root) { roots.push(root) } }, addEventListener(name, cb) { events.set(name, cb) }, removeEventListener(name) { events.delete(name) } }
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8').replace('return module.exports;',
    'module.exports.probe = { startWhaleWidget, settingsCss, EMAIL_CSS, preference: value => updateWhalePreference(value) }; return module.exports;')
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
        ? { newCount: 4, messages: [
          { subject: 'New message 1', from: [{ address: 'sender1@example.test' }] },
          { subject: 'New message 2', from: [{ name: 'Alice', address: 'alice@example.test' }] },
          { subject: 'New message 3', from: [{ address: 'sender3@example.test' }] },
        ] }
        : { settings: { value: { newMailPopup: enabled } }, accounts: ['default'], whale } }) }
    },
  })
  const dispose = client.probe.startWhaleWidget()
  return { dispose, roots, timers, events, probe: client.probe, get watches() { return watches },
    setSaved(value) { enabled = value }, setWhale(value) { whale = value },
    hold() { hold = true }, release() { hold = false; pendingWatch?.() },
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

test('whale popup fits portrait fallback and skin artwork without cropping, exposes data-whale hooks, and pauses dismiss on focus/hover (#55)', async t => {
  const f = widgetFixture(true, { url: WHALE_API_ROUTE, skin: false, credit: 'community credit' })
  t.after(f.dispose)
  const { EMAIL_CSS: css, settingsCss } = f.probe
  const rule = selector => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = css.match(new RegExp(`${escaped}\\{([^}]+)\\}`))
    assert.ok(match, `missing CSS rule for ${selector}`)
    return match[1]
  }
  const cardCss = rule('.' + settingsCss.whaleCard)
  const imgCss = rule('.' + settingsCss.whaleImg)
  const fallbackImgCss = rule('.' + settingsCss.whaleImg + '[data-whale-skin=false]')
  assert.match(cardCss, /display:flex/)
  assert.match(cardCss, /flex-direction:column/)
  assert.match(cardCss, /max-height:calc\(100dvh - 32px\)/)
  assert.match(imgCss, /height:auto/)
  assert.match(imgCss, /max-height:min\(52dvh,340px\)/)
  assert.match(imgCss, /object-fit:contain/)
  assert.match(imgCss, /object-position:center/)
  assert.doesNotMatch(imgCss, /object-fit:cover/)
  assert.doesNotMatch(imgCss, /(?:^|;)height:120px(?:;|$)/)
  assert.match(fallbackImgCss, /background:#fcfaf2/)

  await settle() // Baseline poll.
  await f.poll() // Second poll surfaces the popup.
  const root = f.roots[0]
  assert.equal(root.getAttribute('data-whale'), 'root')
  assert.equal(root.getAttribute('aria-live'), 'polite')
  assert.equal(root.childElementCount, 1)

  const card = root.children[0]
  assert.equal(card.getAttribute('data-whale'), 'card')
  assert.equal(card.getAttribute('data-whale-skin'), 'false')
  assert.equal(card.getAttribute('role'), 'region')
  assert.equal(card.getAttribute('aria-labelledby'), 'dsh-email-whale-title')

  const [img, body, closeBtn] = card.children
  assert.equal(img.tag, 'img')
  assert.equal(img.getAttribute('data-whale'), 'image')
  assert.equal(img.getAttribute('data-whale-skin'), 'false')
  assert.equal(img.getAttribute('width'), '800')
  assert.equal(img.getAttribute('height'), '597')
  assert.equal(img.src, WHALE_API_ROUTE.replace(/^\/+/, ''))

  assert.equal(body.getAttribute('data-whale'), 'body')
  assert.deepEqual(
    body.children.map(node => node.getAttribute('data-whale')),
    ['title', 'item', 'item', 'item', 'more', 'credit'],
  )
  assert.equal(body.children[0].id, 'dsh-email-whale-title')

  assert.equal(closeBtn.tag, 'button')
  assert.equal(closeBtn.type, 'button')
  assert.equal(closeBtn.getAttribute('data-whale'), 'close')

  // Pause auto-dismiss while focused or hovered, then dismiss once idle.
  let active = true
  card.matches = selector => {
    assert.equal(selector, ':hover, :focus-within')
    return active
  }
  const firstDismiss = [...f.timers.entries()].find(([, timer]) => timer.delay === 12000)
  assert.ok(firstDismiss)
  f.timers.delete(firstDismiss[0])
  firstDismiss[1].fn()
  assert.equal(root.childElementCount, 1, 'focused/hovered toast stays open')

  active = false
  const secondDismiss = [...f.timers.entries()].find(([, timer]) => timer.delay === 12000)
  assert.ok(secondDismiss)
  f.timers.delete(secondDismiss[0])
  secondDismiss[1].fn()
  assert.equal(root.childElementCount, 0, 'idle toast closes on the next timer tick')

  // Skin artwork of arbitrary aspect ratio omits fallback-only dimensions.
  f.setWhale({ url: WHALE_API_ROUTE, skin: true, credit: 'skin credit' })
  await f.poll()
  const skinCard = root.children[0]
  const skinImg = skinCard.children[0]
  assert.equal(skinCard.getAttribute('data-whale-skin'), 'true')
  assert.equal(skinImg.getAttribute('data-whale-skin'), 'true')
  assert.equal(skinImg.getAttribute('width'), null)
  assert.equal(skinImg.getAttribute('height'), null)
})
