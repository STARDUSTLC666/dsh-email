import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { EmailSettingsBackend, installEmailSettingsWeb, SETTINGS_API_ROUTE, WHALE_API_ROUTE } from '../lib/web.js'
import { EmailSettingsSchema } from '../lib/settings.js'

const host = '192.168.36.49:3080'
function fixture() {
  let value = EmailSettingsSchema({}), revision = 0, writes = 0
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision, user: value }], async replace(_ns, next, expected) {
    assert.equal(expected, revision)
    value = structuredClone(next); revision++; writes++
  } } }
  return { backend: new EmailSettingsBackend(ctx, { get: () => value }, {}), value: () => value, writes: () => writes }
}
function request(method = 'GET', extra = {}, body) {
  return new Request('http://internal' + SETTINGS_API_ROUTE, { method,
    headers: { host, origin: 'http://' + host, 'x-dsh-email-settings': '1', ...(method === 'POST' ? { 'content-type': 'application/json' } : {}), ...extra },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
}

test('authenticated carrier accepts LAN hosts despite internal URL reconstruction and persists a full form', async () => {
  const f = fixture(), value = { ...f.value(), newMailPopup: false, accountsYaml: 'work: {provider: qq, user: ui@example.test, password: fixture-only}\n' }
  const result = await f.backend.fetch(request('POST', {}, { action: 'save', value, expectedRevision: 0 }))
  assert.equal(result.status, 200);assert.equal(result.headers.get('cache-control'), 'no-store')
  const snapshot = (await result.json()).value
  assert.equal(snapshot.accountsDetail.list[0].name, 'work');assert.equal(snapshot.settings.value.newMailPopup, false);assert.equal(f.writes(), 1)
  const loaded = await (await f.backend.fetch(request())).json()
  assert.equal(loaded.value.accountsDetail.list[0].hasPassword, true)
  if (loaded.value.whale.url) assert.equal(loaded.value.whale.url, WHALE_API_ROUTE)
})

for (const headers of [{ origin: 'http://attacker.example' }, { origin: 'null' }, { origin: 'dsh-app://app.evil' }, { 'sec-fetch-site': 'cross-site' }, { 'x-dsh-email-settings': '0' }]) {
  test('carrier rejects a foreign or unmarked request: ' + JSON.stringify(headers), async () => {
    const f = fixture(), result = await f.backend.fetch(request('POST', headers, { action: 'save', value: f.value(), expectedRevision: 0 }))
    assert.equal(result.status, 403);assert.equal(f.writes(), 0)
  })
}
test('carrier supports HTTPS, native desktop and absent Origin with its explicit marker', async () => {
  const f = fixture()
  for (const origin of ['https://' + host, 'dsh-app://app']) assert.equal((await f.backend.fetch(request('GET', { origin }))).status, 200)
  const req = request();req.headers.delete('origin');assert.equal((await f.backend.fetch(req)).status, 200)
})
test('carrier rejects simple forms, missing markers, invalid methods and oversized saves', async () => {
  const f = fixture(), unmarked = request();unmarked.headers.delete('x-dsh-email-settings')
  assert.equal((await f.backend.fetch(unmarked)).status, 403)
  assert.equal((await f.backend.fetch(request('POST', { 'content-type': 'text/plain' }, {}))).status, 415)
  assert.equal((await f.backend.fetch(request('PUT', {}, {}))).status, 405)
  assert.equal((await f.backend.fetch(request('POST', {}, { action: 'save', value: { accountsYaml: 'x'.repeat(256 * 1024) }, expectedRevision: 0 }))).status, 400)
  assert.equal(f.writes(), 0)
})
test('carrier never weakens the old raw route and a forged header or symbol cannot authorize LAN reads', async () => {
  const f = fixture(), req = Readable.from([]);req.method = 'GET';req.socket = { remoteAddress: '192.168.36.12' };req.headers = { host, 'x-dsh-email-settings': '1', 'x-dsh-authenticated': '1' }
  let status, body
  await f.backend.handle(req, { setHeader() {}, writeHead(v) { status = v }, end(v) { body = JSON.parse(v) } }, Symbol('DSH authenticated connection'))
  assert.equal(status, 403);assert.equal(body.ok, false)
})
test('aborted carrier requests do not modify settings', async () => {
  const f = fixture(), controller = new AbortController();controller.abort()
  const original = request('POST', {}, { action: 'save', value: f.value(), expectedRevision: 0 }), req = new Request(original, { signal: controller.signal })
  await assert.rejects(f.backend.fetch(req), { name: 'AbortError' });assert.equal(f.writes(), 0)
})
test('settings and static courier routes register through the authenticated connection service and retain raw routes', () => {
  const { backend } = fixture(), carrier = [], raw = []
  const ctx = { inject(deps, cb) { if (deps[0] === 'connection') cb({ connection: { fetch: { register(row) { carrier.push(row) } } } });else cb({ effect(cb) { cb() }, webServer: { register(row) { raw.push(row);return () => {} } } }) } }
  installEmailSettingsWeb(ctx, backend)
  assert.deepEqual(carrier.map(v => [v.path, v.methods]), [[SETTINGS_API_ROUTE, ['GET', 'POST']], [WHALE_API_ROUTE, ['GET']]])
  assert.equal(carrier[0].requestBody, 'buffered');assert.equal(carrier[1].requestBody, 'buffered');assert.equal(raw.length, 2)
})

function mapBackedFixture() {
  const value = EmailSettingsSchema({})
  const writes = []
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async update(_ns, next, expected) {
    assert.equal(expected, 0); writes.push(structuredClone(next))
  }, async replace(_ns, next) { writes.push(structuredClone(next)) } } }
  const config = { defaultAccount: 'qq', accounts: { qq: { provider: 'qq', user: 'a@example.test', password: 'p1' } }, sendApproval: true }
  return { backend: new EmailSettingsBackend(ctx, { get: () => value, config }, undefined), writes }
}

test('an empty account form never erases mailboxes stored as an accounts map', async () => {
  const f = mapBackedFixture(), value = { ...EmailSettingsSchema({}), accountsYaml: '', newMailPopup: false }
  await f.backend.save(value, 0)
  const section = f.writes[0]
  assert.equal(Object.hasOwn(section, 'accounts'), false)
  assert.equal(Object.hasOwn(section, 'password'), false)
  assert.equal(section.newMailPopup, false)
})

test('a saved account list still migrates the map away', async () => {
  const f = mapBackedFixture(), value = { ...EmailSettingsSchema({}), accountsYaml: 'work: {provider: qq, user: w@example.test, password: p2}\n' }
  await f.backend.save(value, 0)
  const section = f.writes[0]
  assert.equal(section.accounts && Object.keys(section.accounts).length, 0)
  assert.equal(section.user, '')
})
