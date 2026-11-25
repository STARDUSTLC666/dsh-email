import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { EmailSettingsBackend, SETTINGS_API_ROUTE } from '../lib/web.js'
import { EmailSettingsSchema } from '../lib/settings.js'
import { parseAccountsYaml } from '../lib/config.js'
import { openSettingsText } from '../lib/settings-secrets.js'

const secrets = ['synthetic-mail-password', 'synthetic-auth-password', 'synthetic-client-secret', 'synthetic-api-key', 'synthetic-proxy-password', 'synthetic-refresh-token']
function request(body) {
  return new Request('http://127.0.0.1:3080' + SETTINGS_API_ROUTE, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { host: '127.0.0.1:3080', origin: 'http://127.0.0.1:3080', 'x-dsh-email-settings': '1', 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}
function fixture(initial = {}, apiFetch) {
  let stored = { ...EmailSettingsSchema({}), ...initial }, revision = 0
  const writes = []
  const ctx = { settings: { describe: () => [{ ns: 'dsh-email', user: stored, revision }], async replace(_ns, next, expected) {
    assert.equal(expected, revision)
    stored = structuredClone(next); writes.push(stored); revision++
  } } }
  const backend = () => new EmailSettingsBackend(ctx, { get: () => stored }, {}, apiFetch)
  return { backend: backend(), reopen: backend, stored: () => stored, writes }
}
const yaml = '# preserved comment containing synthetic-refresh-token\nwork:\n  provider: qq\n  user: work@example.test\n  password: synthetic-mail-password\n  authPassword: synthetic-auth-password\n  clientSecret: synthetic-client-secret\n  apiKey: synthetic-api-key\n  refreshToken: synthetic-refresh-token\n  proxy: http://proxy-user:synthetic-proxy-password@127.0.0.1:7897\n'
function assertConfidential(value, additional = []) {
  const wire = JSON.stringify(value)
  for (const secret of [...secrets, ...additional]) assert.equal(wire.includes(secret), false, 'wire response exposed a synthetic secret')
}

test('raw snapshot and unrelated saves keep all credentials server-side, including YAML comments', async () => {
  const f = fixture({ accountsYaml: yaml, password: secrets[0], authPassword: secrets[1], clientSecret: secrets[2], apiKey: secrets[3], proxy: 'http://u:' + secrets[4] + '@127.0.0.1:7897' })
  const snapshot = (await (await f.backend.fetch(request())).json()).value
  assertConfidential(snapshot)
  assert.equal(snapshot.accountsDetail.list[0].hasPassword, true)
  assert.equal(snapshot.accountsDetail.list[0].hasProxy, true)
  // A plugin backend can be recreated in the same host process without losing
  // a form already open in the browser.
  const response = await f.reopen().fetch(request({ action: 'save', value: { ...snapshot.settings.value, uiLocale: 'en' }, expectedRevision: 0 }))
  assert.equal(response.status, 200)
  assertConfidential(await response.json())
  assert.equal(f.stored().accountsYaml, yaml)
  assert.equal(f.stored().password, secrets[0])
  assert.equal(f.stored().authPassword, secrets[1])
  assert.equal(f.stored().clientSecret, secrets[2])
  assert.equal(f.stored().apiKey, secrets[3])
  assert.equal(f.stored().proxy, 'http://u:' + secrets[4] + '@127.0.0.1:7897')
  assert.equal(JSON.stringify(f.stored()).includes('dsh-email-sealed:'), false)
})

test('serialize, parse, save and clear use opaque account drafts without echoing new or stored passwords', async () => {
  const f = fixture({ accountsYaml: yaml })
  const snapshot = (await (await f.backend.fetch(request())).json()).value
  const serialized = await f.backend.fetch(request({ action: 'serializeAccounts', accountsYaml: snapshot.settings.value.accountsYaml,
    accounts: [{ name: 'work', provider: 'qq', user: 'work@example.test', password: 'replacement-synthetic-password' }], defaultAccount: 'work' }))
  assert.equal(serialized.status, 200)
  const draft = (await serialized.json()).value
  assertConfidential(draft, ['replacement-synthetic-password'])
  const parsed = await f.backend.fetch(request({ action: 'parseAccounts', value: { accountsYaml: draft.accountsYaml } }))
  const cards = (await parsed.json()).value
  assert.equal(cards.list[0].hasPassword, true); assertConfidential(cards)
  const saved = await f.backend.fetch(request({ action: 'save', value: { ...snapshot.settings.value, accountsYaml: draft.accountsYaml }, expectedRevision: 0 }))
  assert.equal(saved.status, 200); assertConfidential(await saved.json(), ['replacement-synthetic-password'])
  const account = parseAccountsYaml(f.stored().accountsYaml).map.work
  assert.equal(account.password, 'replacement-synthetic-password')
  assert.equal(account.authPassword, secrets[1]); assert.equal(account.clientSecret, secrets[2])
  assert.match(f.stored().accountsYaml, /^# preserved comment containing synthetic-refresh-token/m)
  const cleared = await f.backend.fetch(request({ action: 'serializeAccounts', accountsYaml: draft.accountsYaml,
    accounts: [{ name: 'work', provider: 'qq', user: 'work@example.test', password: '' }], defaultAccount: 'work' }))
  const next = (await cleared.json()).value.accountsYaml
  assert.equal(parseAccountsYaml(openSettingsText('accountsYaml', next)).map.work.password, undefined)
})

test('legacy partial replacement retains omitted credential fields while explicit clearing still works', async () => {
  const f = fixture({ accountsYaml: yaml, password: secrets[0], proxy: 'http://u:' + secrets[4] + '@127.0.0.1:7897' })
  const response = await f.backend.fetch(request({ action: 'save', value: { uiLocale: 'en' }, expectedRevision: 0 }))
  assert.equal(response.status, 200); assertConfidential(await response.json())
  assert.equal(f.stored().accountsYaml, yaml); assert.equal(f.stored().password, secrets[0])
  assert.equal(f.stored().proxy, 'http://u:' + secrets[4] + '@127.0.0.1:7897')
  const cleared = await f.backend.fetch(request({ action: 'save', value: { accountsYaml: '', password: '', proxy: '' }, expectedRevision: 1 }))
  assert.equal(cleared.status, 200)
  assert.equal(f.stored().accountsYaml, ''); assert.equal(f.stored().password, ''); assert.equal(f.stored().proxy, '')
})

test('tampered, wrong-field and previous-host references require reload and never reach storage', async () => {
  const f = fixture({ accountsYaml: yaml, password: secrets[0] })
  const snapshot = (await (await f.backend.fetch(request())).json()).value
  const ref = snapshot.settings.value.accountsYaml
  for (const value of [{ accountsYaml: ref.slice(0, -8) + 'AAAAAAAA' }, { password: ref }, { accountsYaml: ref.replace(':v1:', ':v0:') }]) {
    const response = await f.backend.fetch(request({ action: 'save', value, expectedRevision: 0 }))
    assert.equal(response.status, 409)
    const body = await response.json()
    assert.equal(body.error.code, 'settings-reload-required'); assertConfidential(body)
  }
  assert.equal(f.writes.length, 0)
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `import { openSettingsText } from './lib/settings-secrets.js';
    let text = ''; for await (const part of process.stdin) text += part;
    try { openSettingsText('accountsYaml', text); process.exitCode = 1 }
    catch (error) { if (error.code !== 'SETTINGS_RELOAD_REQUIRED') throw error }`], { cwd: new URL('..', import.meta.url), input: ref, encoding: 'utf8', windowsHide: true })
  assert.equal(child.status, 0, child.stderr)
})

test('sealed draft connection tests use the original server-side API key', async () => {
  let calls = 0
  const f = fixture({ provider: 'agentmail', user: 'inbox@example.test', password: secrets[3] }, async (_url, options) => {
    calls++
    assert.equal(options.headers.authorization, 'Bearer ' + secrets[3])
    return new Response(JSON.stringify({ inbox_id: 'inbox@example.test' }), { headers: { 'content-type': 'application/json' } })
  })
  const snapshot = (await (await f.backend.fetch(request())).json()).value
  const response = await f.backend.fetch(request({ action: 'test', value: snapshot.settings.value }))
  assert.equal(response.status, 200)
  const body = await response.json(); assert.equal(body.ok, true); assertConfidential(body)
  assert.equal(calls, 1)
})

test('malformed successful AgentMail responses do not expose bare API keys in JSON diagnostics', async () => {
  const apiKey = 'ui-key7'
  const f = fixture({ provider: 'agentmail', user: 'inbox@example.test', password: apiKey }, async () =>
    new Response(apiKey, { headers: { 'content-type': 'application/json' } }))
  const snapshot = (await (await f.backend.fetch(request())).json()).value
  const response = await f.backend.fetch(request({ action: 'test', value: snapshot.settings.value }))
  assert.equal(response.status, 400)
  const body = await response.json()
  assertConfidential(body, [apiKey])
  assert.match(body.error.message, /AgentMail.*JSON/)
})

test('sealed wire overhead fits while the original decoded settings limit remains enforced', async () => {
  const f = fixture({ accountsYaml: '#' + 'a'.repeat(200_000) + '\nwork: {provider: qq, user: work@example.test, password: synthetic-mail-password}\n' })
  const snapshot = (await (await f.backend.fetch(request())).json()).value
  const body = { action: 'save', value: snapshot.settings.value, expectedRevision: 0 }
  assert.ok(Buffer.byteLength(JSON.stringify(body)) > 256 * 1024)
  assert.equal((await f.backend.fetch(request(body))).status, 200)
  const tooLarge = await f.backend.fetch(request({ action: 'save', value: { accountsYaml: 'a'.repeat(256 * 1024) }, expectedRevision: 1 }))
  assert.equal(tooLarge.status, 400)
  assert.equal(f.writes.length, 1)
})

test('malformed stored YAML and JSON diagnostics never echo quoted or multiline credentials', async () => {
  for (const bad of ['work:\n  password: "synthetic-mail-password with spaces\n', 'work:\n  password: |\n    synthetic-mail-password\n  broken: [\n']) {
    const f = fixture({ accountsYaml: bad })
    const snapshot = (await (await f.backend.fetch(request())).json()).value
    assertConfidential(snapshot)
    for (const body of [
      { action: 'parseAccounts', value: snapshot.settings.value },
      { action: 'test', value: snapshot.settings.value, account: 'work' },
      { action: 'oauthLogin', account: 'work' }, { action: 'oauthPoll', account: 'work' },
    ]) assertConfidential(await (await f.backend.fetch(request(body))).json())
  }
  const f = fixture()
  const original = request({ action: 'save' })
  const invalid = new Request(original.url, { method: 'POST', headers: original.headers, body: '{"password":"synthetic-mail-password" oops}' })
  const response = await f.backend.fetch(invalid)
  assert.equal(response.status, 400); assertConfidential(await response.json())
})
