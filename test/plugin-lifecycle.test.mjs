import test from 'node:test'
import assert from 'node:assert/strict'
import { apply, EmailPool, SETTINGS_ROUTE } from '../lib/index.js'

test('apply shares watch behavior with the web route and releases owned resources', async (t) => {
  let rows = [{ uid: 1 }]
  let disposedPools = 0
  t.mock.method(EmailPool.prototype, 'startIdleSweep', () => {})
  t.mock.method(EmailPool.prototype, 'dispose', () => { disposedPools++ })
  t.mock.method(EmailPool.prototype, 'list', async () => ({ account: 'default', folder: 'INBOX', count: rows.length, messages: rows }))
  const definitions = []
  const routes = []
  const removedRoutes = []
  const cleanups = []
  const effect = (callback) => cleanups.push(callback())
  const config = { provider: 'qq', user: 'test@example.com', password: 'test-password' }
  const ctx = {
    settings: {
      register: () => ({ get: () => ({ ...config, sendApproval: true }) }),
      describe: () => [{ ns: 'dsh-email', user: {} }],
    },
    tools: { register: definition => definitions.push(definition) },
    effect,
    on() {},
    get() { return undefined },
    inject(_services, callback) {
      callback({ effect, webServer: { register(route) {
        routes.push(route)
        return () => removedRoutes.push(route.path)
      } } })
    },
  }
  apply(ctx, config)
  t.after(() => cleanups.reverse().forEach(cleanup => cleanup()))
  const watch = definitions.find(definition => definition.name === 'email_watch')
  const route = routes.find(route => route.path === SETTINGS_ROUTE)
  const webWatch = async () => {
    const req = {
      method: 'POST', socket: { remoteAddress: '127.0.0.1' },
      async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify({ action: 'watch' })) },
    }
    let status
    let body
    const res = { setHeader() {}, writeHead(value) { status = value }, end(bytes) { body = JSON.parse(bytes) } }
    await route.handler(req, res)
    assert.equal(status, 200)
    assert.equal(body.ok, true)
    return body.value
  }
  assert.equal((await watch.execute({})).firstRun, true)
  assert.equal((await webWatch()).firstRun, true)
  rows = [{ uid: 2 }, { uid: 1 }]
  assert.equal((await watch.execute({})).newCount, 1)
  assert.equal((await webWatch()).newCount, 1)
  cleanups.reverse().forEach(cleanup => cleanup())
  cleanups.length = 0
  assert.equal(disposedPools, 1)
  assert.deepEqual(removedRoutes.sort(), routes.map(route => route.path).sort())
})
