import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { EmailSettingsBackend, WHALE_API_ROUTE, WHALE_ASSET_ROUTE, parseWhaleMood } from '../lib/web.js'

const settle = async () => { for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve)) }

function interactiveWidgetFixture({ enabled = true, accounts = ['default'], watchResult = { newCount: 0, messages: [] } } = {}) {
  const timers = new Map(), roots = [], events = new Map(), workspaces = []
  let serial = 0, client, watchCalls = 0, openedInbox = 0
  const element = tag => {
    const styleProps = new Map()
    return {
      tag,
      attributes: new Map(),
      children: [],
      style: {
        setProperty(k, v) { styleProps.set(k, String(v)) },
        getPropertyValue(k) { return styleProps.get(k) ?? '' },
      },
      setAttribute(name, value) { this.attributes.set(name, String(value)) },
      removeAttribute(name) { this.attributes.delete(name) },
      getAttribute(name) { return this.attributes.get(name) ?? null },
      appendChild(child) { this.children.push(child) },
      replaceChildren() { this.children = [] },
      remove() { this.removed = true },
      get childElementCount() { return this.children.length },
    }
  }
  const byWhale = (root, name) => {
    const out = []
    const walk = node => {
      if (node.getAttribute?.('data-whale') === name) out.push(node)
      for (const child of node.children || []) walk(child)
    }
    walk(root)
    return out
  }
  const document = {
    hidden: false,
    createElement: element,
    querySelector: () => null,
    body: { appendChild(root) { roots.push(root) } },
    addEventListener(name, cb) { events.set(name, cb) },
    removeEventListener(name) { events.delete(name) },
  }
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8').replace(
    'return module.exports;',
    'module.exports.probe = { startWhaleWidget, EMAIL_CSS, toggleWhaleWidget: () => toggleWhaleWidget?.(), setInboxOpener: fn => { openEmailInbox = fn }, setWorkspace: ws => { emailWorkspace = ws } }; return module.exports;',
  )
  runInNewContext(source, {
    window: { __ModuleLoader__: { load({ factory }) { client = factory(() => ({})) } } },
    document,
    AbortController,
    setTimeout(fn, delay) { const id = ++serial; timers.set(id, { fn, delay }); return id },
    clearTimeout(id) { timers.delete(id) },
    async fetch(_url, options) {
      const action = options.body && JSON.parse(options.body).action
      if (action === 'watch') watchCalls++
      const value = action === 'watch'
        ? (typeof watchResult === 'function' ? watchResult(watchCalls) : watchResult)
        : { settings: { value: { newMailPopup: enabled } }, accounts, whale: { url: WHALE_ASSET_ROUTE, skin: false, credit: '' } }
      return { ok: true, json: async () => ({ ok: true, value }) }
    },
  })
  client.probe.setInboxOpener(() => { openedInbox++ })
  client.probe.setWorkspace({ openPlugin(id) { workspaces.push(id) } })
  const dispose = client.probe.startWhaleWidget()
  return {
    dispose,
    roots,
    timers,
    byWhale: name => byWhale(roots[0], name),
    probe: client.probe,
    get watchCalls() { return watchCalls },
    get openedInbox() { return openedInbox },
    workspaces,
    setWatchResult(next) { watchResult = next },
  }
}

test('backend serves all 3 original whale-maid mood PNGs with empty FALLBACK_CREDIT and forwards ?mood over carrier', async () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(pkg.files.includes('assets/whale-fallback.png'))
  assert.ok(pkg.files.includes('assets/whale-happy.png'))
  assert.ok(pkg.files.includes('assets/whale-check.png'))

  assert.equal(parseWhaleMood('/_dsh/dsh-email/assets/whale'), 'deliver')
  assert.equal(parseWhaleMood('/_dsh/dsh-email/assets/whale?mood=happy'), 'happy')
  assert.equal(parseWhaleMood('/api/dsh-email/whale?mood=check'), 'check')
  assert.equal(parseWhaleMood('/api/dsh-email/whale?mood=unknown'), 'deliver')

  const ctx = { fiber: { entry: { options: { id: 'email' } } }, settings: { describe: () => [] } }
  const scope = { get: () => ({ newMailPopup: true }) }
  const backend = new EmailSettingsBackend(ctx, scope, {})
  const snap = await backend.snapshot()
  assert.equal(snap.whale.url, WHALE_ASSET_ROUTE)
  assert.equal(snap.whale.skin, false)
  assert.equal(snap.whale.credit, '')

  const readMood = async query => {
    const req = new Request(`https://localhost${WHALE_API_ROUTE}${query}`, { method: 'GET' })
    const res = await backend.fetch(req, true)
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('content-type'), 'image/png')
    return Buffer.from(await res.arrayBuffer())
  }
  const deliverBytes = await readMood('')
  const happyBytes = await readMood('?mood=happy')
  const checkBytes = await readMood('?mood=check')
  assert.notEqual(Buffer.compare(deliverBytes, happyBytes), 0)
  assert.notEqual(Buffer.compare(deliverBytes, checkBytes), 0)
  assert.notEqual(Buffer.compare(happyBytes, checkBytes), 0)
})

test('whale courier supports header summon toggle, headpat expressions/particles, live check-mail, and jump-to-inbox', async t => {
  const f = interactiveWidgetFixture({ enabled: false, watchResult: { newCount: 0, messages: [] } })
  t.after(f.dispose)
  await settle()

  assert.match(f.probe.EMAIL_CSS, /prefers-reduced-motion:\s*reduce/)
  assert.equal(f.roots[0].childElementCount, 0)

  // Manual summon works even when auto-popups are disabled.
  await f.probe.toggleWhaleWidget()
  await settle()
  assert.equal(f.roots[0].childElementCount, 1)

  const card = f.byWhale('card')[0]
  const img = f.byWhale('image')[0]
  const bubble = f.byWhale('bubble')[0]
  const patBtn = f.byWhale('pat')[0]
  const checkBtn = f.byWhale('check')[0]
  const openBtn = f.byWhale('open')[0]
  const patBadge = f.byWhale('pat-badge')[0]

  assert.equal(card.getAttribute('data-whale-mood'), 'deliver')
  assert.match(bubble.textContent, /摸摸头/)
  assert.equal(patBadge.getAttribute('hidden'), '')

  // First headpat via clicking image: switches to ?mood=happy, spawns particles, updates counter & dialogue.
  img.onclick()
  assert.equal(card.getAttribute('data-whale-mood'), 'happy')
  assert.equal(card.getAttribute('data-whale-patting'), 'true')
  assert.match(img.src, /\?mood=happy$/)
  assert.equal(patBadge.getAttribute('hidden'), null)
  assert.equal(patBadge.textContent, '♥ 摸头 ×1')
  assert.equal(f.byWhale('particle').length, 5)
  const firstLine = bubble.textContent
  assert.ok(firstLine.length > 0)

  // Second headpat via Pat button advances dialogue and increments count.
  patBtn.onclick()
  assert.equal(patBadge.textContent, '♥ 摸头 ×2')
  assert.notEqual(bubble.textContent, firstLine)

  // Fast-forward happy mood timer (2800ms) -> restores deliver expression.
  const happyTimer = [...f.timers.entries()].find(([, timer]) => timer.delay === 2800)
  assert.ok(happyTimer)
  f.timers.delete(happyTimer[0])
  happyTimer[1].fn()
  assert.equal(card.getAttribute('data-whale-mood'), 'deliver')
  assert.equal(img.src, '_dsh/dsh-email/assets/whale')

  // Check Mail with no new messages -> switches to ?mood=check and reports empty inbox.
  await checkBtn.onclick()
  await settle()
  assert.equal(f.watchCalls, 1)
  assert.match(bubble.textContent, /暂无新邮件/)

  // Check Mail when new mail arrives -> updates card with new messages.
  f.setWatchResult({
    newCount: 1,
    messages: [{ subject: 'Stage 5 Ready', from: [{ name: 'Courier', address: 'c@example.test' }] }],
  })
  await f.byWhale('check')[0].onclick()
  await settle()
  assert.equal(f.watchCalls, 2)
  assert.equal(f.byWhale('item').length, 1)
  assert.match(f.byWhale('item')[0].textContent, /Stage 5 Ready/)
  assert.match(f.byWhale('bubble')[0].textContent, /1 封新邮件/)

  // Open Mailbox jumps to inbox tab and workspace.
  f.byWhale('open')[0].onclick()
  assert.equal(f.openedInbox, 1)
  assert.deepEqual(f.workspaces, ['dsh-email.workbench'])

  // Summon toggle again closes the open card.
  await f.probe.toggleWhaleWidget()
  assert.equal(f.roots[0].childElementCount, 0)
})
