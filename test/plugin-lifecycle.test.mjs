import test from 'node:test'
import assert from 'node:assert/strict'
import { apply, EmailPool } from '../lib/index.js'
import { SETTINGS_API_ROUTE } from '../lib/web.js'

test('apply shares watch behavior with the web route and releases owned resources', async (t) => {
  let rows = [{ uid: 1 }]
  let disposedPools = 0
  t.mock.method(EmailPool.prototype, 'startIdleSweep', () => {})
  t.mock.method(EmailPool.prototype, 'dispose', () => { disposedPools++ })
  t.mock.method(EmailPool.prototype, 'unseenUids', async () => ({ account: 'default', folder: 'INBOX', uidValidity: 0, count: rows.length, uids: rows.map(row => row.uid).sort((a, b) => b - a) }))
  t.mock.method(EmailPool.prototype, 'fetchByUids', async (_account, _folder, uids) => {
    const byUid = new Map(rows.map(row => [row.uid, row]))
    return uids.map(uid => byUid.get(uid)).filter(Boolean)
  })
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
      callback({ effect, connection: { fetch: { register(route) {
        routes.push(route)
        effect(() => () => removedRoutes.push(route.path))
      } } } })
    },
  }
  apply(ctx, config)
  t.after(() => cleanups.reverse().forEach(cleanup => cleanup()))
  const watch = definitions.find(definition => definition.name === 'email_watch')
  const route = routes.find(route => route.path === SETTINGS_API_ROUTE)
  const webWatch = async () => {
    const req = new Request('http://127.0.0.1:3080' + SETTINGS_API_ROUTE, {
      method: 'POST',
      headers: {
        host: '127.0.0.1:3080',
        'content-type': 'application/json',
        origin: 'http://127.0.0.1:3080',
        'sec-fetch-site': 'same-origin',
        'x-dsh-email-settings': '1',
      },
      body: JSON.stringify({ action: 'watch' }),
    })
    const response = await route.fetch(req)
    const body = await response.json()
    assert.equal(response.status, 200)
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
