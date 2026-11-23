import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

// Exercise the shipped browser request functions with the browser's base-URL rule.
for (const base of ['https://dsh.example/', 'https://dsh.example/tools/dsh/']) {
  test('settings requests stay inside the application mount: ' + base, async () => {
    let client
    const requests = []
    const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
      .replace('return module.exports;', 'module.exports.probe = { api, apiOauth, mailTaskApi, startWhaleWidget, toggleWhaleWidget: () => toggleWhaleWidget?.() }; return module.exports;')
    runInNewContext(source, {
      window: { __ModuleLoader__: { load({ factory }) { client = factory(() => ({})) } } },
      fetch: async (path, init) => {
        requests.push({ url: new URL(path, base).href, init })
        return { ok: true, json: async () => ({ ok: true, value: { saved: true } }) }
      },
    })
    await client.probe.api('save', { value: {}, expectedRevision: 2 })
    await client.probe.api(); await client.probe.apiOauth('oauth2/start', { account: 'fixture' })
    for (const request of requests) {
      assert.equal(request.url, base + 'api/dsh-email/settings')
      assert.equal(request.init.credentials, 'same-origin')
      assert.equal(request.init.headers['x-dsh-email-settings'], '1')
    }
    assert.equal(JSON.parse(requests[0].init.body).expectedRevision, 2)
    requests.length = 0
    await client.probe.mailTaskApi('list')
    assert.equal(requests.length, 1)
    assert.equal(requests[0].url, base + 'api/dsh-email/tasks')
    assert.equal(requests[0].init.credentials, 'same-origin')
    assert.equal(requests[0].init.headers['x-dsh-email-tasks'], '1')
  })

  for (const rawWhaleUrl of ['/api/dsh-email/whale', '/_dsh/dsh-email/assets/whale']) {
    test(`whale courier image stays inside mount (${base}, ${rawWhaleUrl})`, async t => {
      let client
      const roots = []
      const makeEl = tag => ({
        tag,
        attributes: new Map(),
        children: [],
        style: { setProperty() {} },
        setAttribute(k, v) { this.attributes.set(k, String(v)) },
        removeAttribute(k) { this.attributes.delete(k) },
        getAttribute(k) { return this.attributes.get(k) ?? null },
        appendChild(child) { this.children.push(child) },
        replaceChildren() { this.children = [] },
        remove() {},
        get childElementCount() { return this.children.length },
      })
      const document = {
        hidden: false,
        createElement: makeEl,
        querySelector: () => null,
        body: { appendChild(root) { roots.push(root) } },
        addEventListener() {},
        removeEventListener() {},
      }
      const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
        .replace('return module.exports;', 'module.exports.probe = { startWhaleWidget, toggleWhaleWidget: () => toggleWhaleWidget?.() }; return module.exports;')
      runInNewContext(source, {
        window: { __ModuleLoader__: { load({ factory }) { client = factory(() => ({})) } } },
        document,
        AbortController,
        setTimeout() { return 1 },
        clearTimeout() {},
        async fetch() {
          return {
            ok: true,
            json: async () => ({
              ok: true,
              value: { settings: { value: { newMailPopup: false } }, accounts: ['default'], whale: { url: rawWhaleUrl, skin: false, credit: '' } },
            }),
          }
        },
      })
      const dispose = client.probe.startWhaleWidget()
      t.after(dispose)
      await client.probe.toggleWhaleWidget()
      const findImg = node => {
        if (!node) return null
        if (node.getAttribute?.('data-whale') === 'image') return node
        for (const child of node.children || []) {
          const hit = findImg(child)
          if (hit) return hit
        }
        return null
      }
      const img = findImg(roots[0])
      assert.ok(img, 'expected whale image element')
      assert.equal(img.src.startsWith('/'), false, 'whale img.src must be relative')
      assert.equal(new URL(img.src, base).href, base + rawWhaleUrl.replace(/^\/+/, ''))
    })
  }
}
