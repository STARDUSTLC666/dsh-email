import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { EmailSettingsBackend, installEmailSettingsWeb, SETTINGS_API_ROUTE, WHALE_API_ROUTE } from '../lib/web.js'
import { EmailSettingsSchema } from '../lib/settings.js'
import { parseAccountsYaml, resolveEmailSettings } from '../lib/config.js'

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

test('account cards fall back to the accounts map when no accountsYaml is stored', async () => {
  const value = EmailSettingsSchema({})
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async replace() {} } }
  const config = {
    defaultAccount: 'qq',
    sendApproval: true,
    accounts: {
      qq: { provider: 'qq', user: 'first@example.test', password: 'secret-one' },
      mail163: { provider: '163', user: 'second@example.test', password: 'secret-two' },
    },
  }
  const backend = new EmailSettingsBackend(ctx, { get: () => value, config }, undefined)
  const snapshot = await backend.snapshot()
  assert.deepEqual(snapshot.accountsDetail.list.map((card) => card.name), ['qq', 'mail163'])
  assert.equal(snapshot.accounts.filter((name) => name !== 'default').sort().join(','), 'mail163,qq')
  // The editable value must carry the synthesized text: the editor seeds its save buffer
  // from it and serializeCards() preserves the passwords that only live in that text.
  assert.match(snapshot.settings.value.accountsYaml, /secret-one/)
  assert.match(snapshot.settings.value.accountsYaml, /secret-two/)
  const reloaded = resolveEmailSettings({ ...config, accountsYaml: snapshot.settings.value.accountsYaml })
  assert.equal(reloaded.accounts.get('mail163').password, 'secret-two')
})

test('synthesized cards inherit the shared provider and endpoints', async () => {
  const value = EmailSettingsSchema({})
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async replace() {} } }
  const config = { provider: 'qq', accounts: { work: { user: 'w@example.test', password: 'p' } } }
  const backend = new EmailSettingsBackend(ctx, { get: () => value, config }, undefined)
  const [card] = (await backend.snapshot()).accountsDetail.list
  assert.equal(card.name, 'work');assert.equal(card.provider, 'qq');assert.equal(card.imap.host, 'imap.qq.com')
})

test('synthesized accounts keep provider-scoped credentials and transport', async () => {
  const value = EmailSettingsSchema({})
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async replace() {} } }
  // A shared QQ password must not leak into an AgentMail account, whose credential is
  // its own API key; a POP3 mailbox must keep its transport when the YAML is synthesized.
  const config = {
    provider: 'qq',
    password: 'qq-shared-secret',
    receiveProtocol: 'pop3',
    accounts: {
      work: { user: 'w@example.test' },
      bot: { provider: 'agentmail', user: 'bot@example.test', apiKey: 'agent-key' },
    },
  }
  const backend = new EmailSettingsBackend(ctx, { get: () => value, config }, undefined)
  const snapshot = await backend.snapshot()
  const parsed = parseAccountsYaml(snapshot.settings.value.accountsYaml).map
  // The shared mailbox password belongs to QQ only: the AgentMail entry keeps its key.
  assert.equal(parsed.work.password, 'qq-shared-secret')
  assert.equal(parsed.work.receiveProtocol, 'pop3')
  assert.equal(parsed.bot.password, undefined)
  assert.equal(parsed.bot.apiKey, 'agent-key')
  const cards = Object.fromEntries(snapshot.accountsDetail.list.map((card) => [card.name, card]))
  assert.equal(cards.work.receiveProtocol, 'pop3')
  assert.equal(cards.work.pop3.host, 'pop.qq.com')
  assert.equal(cards.bot.provider, 'agentmail')
})

test('a different client ID never inherits the shared OAuth client secret', async () => {
  const value = EmailSettingsSchema({})
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async replace() {} } }
  const config = {
    provider: 'gmail',
    clientId: 'shared-client',
    clientSecret: 'shared-secret',
    accounts: { other: { provider: 'gmail', user: 'o@example.test', clientId: 'other-client' } },
  }
  const backend = new EmailSettingsBackend(ctx, { get: () => value, config }, undefined)
  const yaml = (await backend.snapshot()).settings.value.accountsYaml
  assert.doesNotMatch(yaml, /shared-secret/)
})

test('a named provider inherits the row password, and AgentMail keeps its own key', async () => {
  const value = EmailSettingsSchema({})
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async replace() {} } }
  // The row names no provider but does carry the password: resolveEmailSettings() still
  // inherits it for a mailbox that names qq, so the synthesized YAML must keep it.
  const config = { password: 'row-secret', accounts: { work: { provider: 'qq', user: 'w@example.test' } } }
  const backend = new EmailSettingsBackend(ctx, { get: () => value, config }, undefined)
  const parsed = parseAccountsYaml((await backend.snapshot()).settings.value.accountsYaml).map
  assert.equal(parsed.work.password, 'row-secret')
})

test('AgentMail keeps its own API key over a shared AgentMail password', async () => {
  const value = EmailSettingsSchema({})
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async replace() {} } }
  const config = { provider: 'agentmail', password: 'shared-key', accounts: { bot: { apiKey: 'bot-key', user: 'bot@example.test' } } }
  const backend = new EmailSettingsBackend(ctx, { get: () => value, config }, undefined)
  const parsed = parseAccountsYaml((await backend.snapshot()).settings.value.accountsYaml).map
  assert.equal(parsed.bot.apiKey, 'bot-key')
  assert.equal(parsed.bot.password, undefined)
})

test('a blank AgentMail entry key inherits the shared AgentMail credential', async () => {
  const value = EmailSettingsSchema({})
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async replace() {} } }
  const config = { provider: 'agentmail', password: 'shared-key', accounts: { bot: { user: 'bot@example.test', apiKey: '' } } }
  const backend = new EmailSettingsBackend(ctx, { get: () => value, config }, undefined)
  const parsed = parseAccountsYaml((await backend.snapshot()).settings.value.accountsYaml).map
  assert.equal(parsed.bot.apiKey, 'shared-key')
  assert.equal(parsed.bot.password, undefined)
})

test('a nullish account password inherits the row password', async () => {
  const value = EmailSettingsSchema({})
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async replace() {} } }
  const config = { provider: 'qq', password: 'row-secret', accounts: { work: { user: 'w@example.test', password: null } } }
  const backend = new EmailSettingsBackend(ctx, { get: () => value, config }, undefined)
  const parsed = parseAccountsYaml((await backend.snapshot()).settings.value.accountsYaml).map
  assert.equal(parsed.work.password, 'row-secret')
})

test('a blank account provider inherits the row provider', async () => {
  const value = EmailSettingsSchema({})
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async replace() {} } }
  const config = { provider: 'qq', accounts: { work: { provider: '', user: 'w@example.test', password: 'p' } } }
  const backend = new EmailSettingsBackend(ctx, { get: () => value, config }, undefined)
  const [card] = (await backend.snapshot()).accountsDetail.list
  assert.equal(card.provider, 'qq');assert.equal(card.imap.host, 'imap.qq.com')
})

test('AgentMail keeps password-first precedence and nullish identity inherits the row', async () => {
  const value = EmailSettingsSchema({})
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async replace() {} } }
  const config = {
    provider: 'qq', user: 'row@example.test', password: 'row-password',
    accounts: { work: { user: null } },
  }
  const backend = new EmailSettingsBackend(ctx, { get: () => value, config }, undefined)
  const parsed = parseAccountsYaml((await backend.snapshot()).settings.value.accountsYaml).map
  assert.equal(parsed.work.user, 'row@example.test')
  assert.equal(parsed.work.password, 'row-password')

  const mail = { provider: 'agentmail', accounts: { bot: { user: 'bot@example.test', password: 'current-key', apiKey: 'old-key' } } }
  const mailBackend = new EmailSettingsBackend(ctx, { get: () => value, config: mail }, undefined)
  const bot = parseAccountsYaml((await mailBackend.snapshot()).settings.value.accountsYaml).map.bot
  assert.equal(bot.apiKey, 'current-key')
  assert.equal(bot.password, undefined)
})

test('nullish provider inherits the row, and AgentMail stays password-authenticated', async () => {
  const value = EmailSettingsSchema({})
  const ctx = { settings: { writable: true, describe: () => [{ ns: 'dsh-email', revision: 0, user: value }], async replace() {} } }
  const config = { provider: 'qq', accounts: { work: { provider: null, user: 'w@example.test', password: 'p' } } }
  const [card] = (await new EmailSettingsBackend(ctx, { get: () => value, config }, undefined).snapshot()).accountsDetail.list
  assert.equal(card.provider, 'qq')

  const mail = { provider: 'agentmail', authKind: 'oauth2', accounts: { bot: { user: 'bot@example.test', apiKey: 'k' } } }
  const [bot] = (await new EmailSettingsBackend(ctx, { get: () => value, config: mail }, undefined).snapshot()).accountsDetail.list
  assert.equal(bot.authKind, 'password')
})
