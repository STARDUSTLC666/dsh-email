import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply, EmailPool, SETTINGS_ROUTE } from '../lib/index.js'
import { OUTLOOK_OAUTH2_CLIENT_ID, parseAccountsYaml, parseServerPresets, PROVIDER_NAMES, PROVIDER_PRESETS, resolveEmailSettings, serializeAccountsYaml } from '../lib/config.js'
import { oauth2TokenFile, readTokenStore, writeTokenStore } from '../lib/oauth2.js'
import { hostVerdict, postVerdict } from '../lib/web.js'

const BASE = {
  provider: 'qq',
  user: 'me@qq.com',
  password: 'p',
  inboxFolder: 'INBOX',
  sendApproval: true,
  maxBodyChars: 20000,
  downloadDir: '',
  accountsYaml: '',
  serverPresets: '',
  imap: { host: '', port: 993, secure: true },
  smtp: { host: '', port: 465, secure: true },
}

/**
 * Mount the real route through apply() and drive it with fake req/res objects,
 * the same way plugin-lifecycle.test.mjs does. Returns { get, post } where
 * post resolves { status, body } for any action payload.
 */
function mount(t, options = {}) {
  const config = options.config ?? { provider: 'qq', user: 'me@qq.com', password: 'test-password' }
  const overrides = options.value ?? {}
  const stored = { ...BASE, ...overrides }
  let revision = options.revision ?? 3
  const routes = []
  const cleanups = []
  const effect = callback => cleanups.push(callback())
  const replace = async (ns, value, expectedRevision) => {
    if (expectedRevision !== revision) {
      const conflict = new Error('settings revision conflict')
      conflict.code = 'SETTINGS_CONFLICT'
      throw conflict
    }
    Object.assign(stored, value)
    revision++
    return stored
  }
  const ctx = {
    settings: {
      writable: options.writable,
      replace,
      register: () => ({ get: () => stored, replace }),
      // The real descriptor reports the *user-set* keys only; those are exactly
      // the overrides a test supplies, so projection must see them.
      describe: () => [{ ns: 'dsh-email', user: options.user ?? { ...overrides }, revision, applies: 'live' }],
    },
    tools: { register() {} },
    effect,
    on() {},
    get() { return undefined },
    logger: { warn() {} },
    inject(_services, callback) {
      callback({
        effect,
        webServer: {
          register(route) {
            routes.push(route)
            return () => {}
          },
        },
      })
    },
  }
  apply(ctx, config)
  t.after(() => cleanups.reverse().forEach(cleanup => cleanup()))
  const route = routes.find(candidate => candidate.path === SETTINGS_ROUTE)
  assert.ok(route, 'the settings route must be mounted')

  const call = async (payload, { method = 'POST', remoteAddress = '127.0.0.1', headers } = {}) => {
    const req = {
      method,
      socket: { remoteAddress },
      // What the settings panel actually sends: a same-origin JSON POST. Cases
      // that probe the Host/Origin/Content-Type guards override one header.
      headers: {
        host: '127.0.0.1:3080',
        'content-type': 'application/json',
        origin: 'http://127.0.0.1:3080',
        'sec-fetch-site': 'same-origin',
        ...headers,
      },
      async *[Symbol.asyncIterator]() {
        if (payload !== undefined) yield Buffer.from(JSON.stringify(payload))
      },
    }
    let status
    let body
    const res = {
      setHeader() {},
      writeHead(value) { status = value },
      end(bytes) { body = JSON.parse(bytes) },
    }
    await route.handler(req, res)
    return { status, body }
  }
  return {
    get: () => call(undefined, { method: 'GET' }),
    post: payload => call(payload),
    call,
    stored,
  }
}

// --- snapshot ---------------------------------------------------------------

test('snapshot carries accountsDetail (raw/list/defaultAccount) and the 8 builtin presets', async t => {
  const yaml = [
    '# 工作邮箱',
    'work:',
    '  provider: qq',
    '  user: w@qq.com',
    '  password: pw',
    'home:',
    '  provider: "163"',
    '  user: h@163.com',
    '',
  ].join('\n')
  const { get } = mount(t, { value: { accountsYaml: yaml } })
  const { status, body } = await get()
  assert.equal(status, 200)
  assert.equal(body.ok, true)
  const value = body.value

  // Existing fields stay untouched (backward compatibility).
  assert.equal(typeof value.writable, 'boolean')
  assert.equal(value.settings.revision, 3)
  assert.equal(value.settings.applies, 'live')
  assert.equal(value.settings.value.accountsYaml, yaml)
  assert.equal(typeof value.whale.url, 'string')
  // `accounts` is resolution-derived, so an unresolvable draft (two accounts,
  // no defaultAccount) legitimately yields nothing there. accountsDetail is
  // exactly the field that still describes the draft — that is its purpose.
  assert.deepEqual(value.accounts, [])

  // The draft is described by the cards, which project `hasPassword` instead of
  // the secret. There is deliberately no `raw` field: it would hand the parsed
  // mapping — plaintext 授权码 included — to the browser for nothing, since the
  // editor only ever reads list/defaultAccount/error.
  assert.deepEqual(value.accountsDetail.list.map(card => card.name).sort(), ['home', 'work'])
  const workCard = value.accountsDetail.list.find(card => card.name === 'work')
  assert.equal(workCard.user, 'w@qq.com')
  assert.equal(workCard.hasPassword, true)
  assert.equal('raw' in value.accountsDetail, false, 'the parsed mapping must not be echoed as a second copy of the secrets')
  // The cards are the only account projection the editor consumes, and they
  // carry `hasPassword` rather than the value. (settings.value.accountsYaml does
  // carry plaintext by design — the advanced editor edits that text, and the key
  // is declared secret in the settings schema.)
  for (const card of value.accountsDetail.list) {
    assert.equal('password' in card, false, `card ${card.name} must not carry a password value`)
    assert.equal(typeof card.hasPassword, 'boolean')
  }

  // A resolvable draft populates both fields consistently.
  const resolvable = mount(t, {
    value: { accountsYaml: 'work: { provider: qq, user: w@qq.com, password: pw }\nhome: { provider: "163", user: h@163.com, password: ph }\ndefaultAccount: work\n' },
  })
  const okValue = (await resolvable.get()).body.value
  assert.deepEqual(okValue.accounts.sort(), ['home', 'work'])
  assert.equal(okValue.accountsDetail.error, undefined)
  assert.equal(okValue.accountsDetail.list.length, 2)

  // Two accounts with no defaultAccount: the snapshot reports it, list still built.
  assert.equal(value.accountsDetail.list.length, 2)
  assert.match(value.accountsDetail.error, /请设置 defaultAccount/)
  const work = value.accountsDetail.list.find(card => card.name === 'work')
  assert.equal(work.provider, 'qq')
  assert.equal(work.user, 'w@qq.com')
  assert.equal(work.hasPassword, true)
  assert.equal(work.imap.host, 'imap.qq.com', 'builtin preset expands the endpoints')
  assert.equal(work.smtp.host, 'smtp.qq.com')
  assert.equal(work.smtp.port, 465)
  assert.equal(work.inboxFolder, 'INBOX')

  // presets: all 8 builtins, no custom ones configured.
  assert.deepEqual(Object.keys(value.presets.builtin).sort(), Object.keys(PROVIDER_PRESETS).sort())
  assert.equal(Object.keys(value.presets.builtin).length, 8)
  assert.equal(value.presets.builtin.outlook.smtp.port, 587)
  assert.equal(value.presets.builtin.icloud.smtp.secure, false)
  assert.deepEqual(value.presets.custom, {})
  assert.equal(value.presets.error, undefined)
})

test('snapshot reports the adjudicated defaultAccount and marks isDefault', async t => {
  const yaml = 'work: { provider: qq, user: w@qq.com }\nhome: { provider: "163", user: h@163.com }\ndefaultAccount: home\n'
  const { get } = mount(t, { value: { accountsYaml: yaml } })
  const value = (await get()).body.value
  assert.equal(value.accountsDetail.defaultAccount, 'home')
  assert.equal(value.accountsDetail.error, undefined)
  assert.deepEqual(value.accountsDetail.list.map(card => [card.name, card.isDefault]), [['work', false], ['home', true]])
})

test('snapshot exposes custom serverPresets and survives a broken preset list', async t => {
  const presets = 'corp:\n  label: 公司邮箱\n  imap: { host: imap.corp, port: 143, secure: false }\n  smtp: { host: smtp.corp, port: 25 }\n'
  const mounted = mount(t, {
    value: { accountsYaml: 'work: { provider: corp, user: w@corp.example }\n', serverPresets: presets },
  })
  const value = (await mounted.get()).body.value
  assert.deepEqual(Object.keys(value.presets.custom), ['corp'])
  assert.equal(value.presets.custom.corp.imap.host, 'imap.corp')
  assert.equal(value.presets.error, undefined)
  // The custom preset fills the card, label included.
  const work = value.accountsDetail.list.find(card => card.name === 'work')
  assert.equal(work.imap.host, 'imap.corp')
  assert.equal(work.imap.port, 143)
  assert.equal(work.imap.secure, false)
  assert.equal(work.smtp.host, 'smtp.corp')
  assert.equal(work.smtp.port, 25)
  assert.equal(work.smtp.secure, true, 'unset secure falls back to the placeholder')

  const broken = mount(t, { value: { accountsYaml: 'work: { user: w@corp.example }\n', serverPresets: 'corp: [unclosed' } })
  const degraded = (await broken.get()).body.value
  assert.deepEqual(degraded.presets.custom, {})
  assert.match(degraded.presets.error, /不是合法的 YAML/)
  assert.equal(degraded.presets.builtin.qq.imap.host, 'imap.qq.com', 'builtins survive a broken custom list')
  assert.equal(degraded.accountsDetail.list.length, 1, 'cards keep rendering so the user can fix the YAML')
})

test('snapshot: an unknown provider degrades one card, never the list', async t => {
  const yaml = 'work: { provider: hotdog, user: w@x.y, password: p }\nhome: { user: h@x.y }\n'
  const { get } = mount(t, { value: { accountsYaml: yaml } })
  const detail = (await get()).body.value.accountsDetail
  assert.equal(detail.list.length, 2, 'a bad card must not remove its neighbours')
  const work = detail.list.find(card => card.name === 'work')
  assert.equal(work.provider, 'hotdog')
  assert.equal(work.imap.host, '', 'no preset to expand -> placeholder host')
  assert.equal(work.imap.port, 993)
  assert.equal(work.smtp.port, 465)
  const home = detail.list.find(card => card.name === 'home')
  assert.equal(home.provider, undefined, 'no provider key means custom server')
  assert.equal(home.user, 'h@x.y')
  assert.equal(home.hasPassword, false)
})

test('snapshot: the card endpoints follow what actually connects (account overrides preset)', async t => {
  const yaml = [
    'work:',
    '  provider: qq',
    '  user: w@qq.com   # 主账号',
    '  imap:',
    '    host: imap.corp.example',
    '    socketTimeoutMs: 9000',
    '  smtp: { host: smtp.corp.example }',
    '',
  ].join('\n')
  const { get } = mount(t, { value: { accountsYaml: yaml } })
  const value = (await get()).body.value
  const detail = value.accountsDetail
  const work = detail.list[0]
  // Runtime resolution is `acc.imap?.host ?? common.imap?.host ?? preset.imap.host`
  // (src/config.ts), so a hand-written host is what actually connects. The card
  // has to show that host: showing the preset's instead would display an address
  // the plugin never dials, and saving would silently rewrite a working
  // self-hosted config into the preset's endpoints.
  assert.equal(work.imap.host, 'imap.corp.example', 'the host the account itself declares drives the connection')
  assert.equal(work.smtp.host, 'smtp.corp.example')
  // Fields the account does not override still come from the preset.
  assert.equal(work.imap.port, 993)
  assert.equal(work.smtp.port, 465)
  // The advanced key lives on in the YAML the advanced editor edits; the card
  // projection stays at the three connection fields and is not a second copy of
  // the account mapping.
  assert.match(value.settings.value.accountsYaml, /socketTimeoutMs: 9000/)
  assert.equal('socketTimeoutMs' in work.imap, false, 'a card carries host/port/secure only')
})

// --- parseAccounts ----------------------------------------------------------

test('parseAccounts: valid YAML returns ok + list, and never 500s', async t => {
  const { post } = mount(t)
  const yaml = 'work: { provider: qq, user: w@qq.com, password: pw }\ndefaultAccount: work\n'
  const { status, body } = await post({ action: 'parseAccounts', value: { accountsYaml: yaml } })
  assert.equal(status, 200)
  assert.equal(body.ok, true)
  assert.equal(body.value.ok, true)
  assert.equal(body.value.error, undefined)
  assert.equal(body.value.defaultAccount, 'work')
  // No `raw`: the parsed mapping carries the plaintext 授权码, and the editor
  // only consumes the cards, which project `hasPassword` instead of the value.
  assert.equal('raw' in body.value, false, 'parseAccounts must not echo the parsed mapping')
  assert.equal(body.value.list.length, 1)
  assert.equal(body.value.list[0].hasPassword, true)
  assert.equal('password' in body.value.list[0], false)
  assert.equal(body.value.list[0].isDefault, true)
  assert.equal(body.value.list[0].imap.host, 'imap.qq.com')
})

test('parseAccounts: invalid YAML returns 200 with ok:false, a Chinese error and an empty list', async t => {
  const { post } = mount(t)
  const { status, body } = await post({ action: 'parseAccounts', value: { accountsYaml: 'work: [unclosed' } })
  assert.equal(status, 200, 'a half-typed draft is a normal state, not an HTTP error')
  assert.equal(body.ok, true)
  assert.equal(body.value.ok, false)
  assert.match(body.value.error, /不是合法的 YAML/)
  assert.deepEqual(body.value.list, [])
})

test('parseAccounts: a non-object document is reported, not thrown', async t => {
  const { post } = mount(t)
  const { status, body } = await post({ action: 'parseAccounts', value: { accountsYaml: '- a\n- b\n' } })
  assert.equal(status, 200)
  assert.equal(body.value.ok, false)
  assert.match(body.value.error, /对象映射/)
})

test('parseAccounts: a half-filled account still appears in the list', async t => {
  const { post } = mount(t)
  const { body } = await post({ action: 'parseAccounts', value: { accountsYaml: 'draft: { user: only@user.example }\n' } })
  assert.equal(body.value.ok, true)
  assert.equal(body.value.list.length, 1)
  const card = body.value.list[0]
  assert.equal(card.name, 'draft')
  assert.equal(card.user, 'only@user.example')
  assert.equal(card.provider, undefined)
  assert.equal(card.hasPassword, false)
  assert.equal(card.imap.host, '')
  assert.equal(card.imap.port, 993)
  assert.equal(card.smtp.port, 465)
  assert.equal(card.inboxFolder, 'INBOX')
  assert.equal(card.isDefault, true, 'a lone account is the default')
})

test('parseAccounts: blank text is an empty draft, not a syntax error', async t => {
  const { post } = mount(t)
  for (const text of ['', '   ', '\n', '# 只有注释\n']) {
    const { status, body } = await post({ action: 'parseAccounts', value: { accountsYaml: text } })
    assert.equal(status, 200)
    assert.equal(body.value.ok, true, `blank input ${JSON.stringify(text)} must not be an error`)
    assert.equal(body.value.error, undefined)
    assert.deepEqual(body.value.list, [])
  }
})

test('parseAccounts: multiple accounts without defaultAccount reports the adjudication error', async t => {
  const { post } = mount(t)
  const yaml = 'a: { provider: qq, user: a@x.y }\nb: { provider: qq, user: b@x.y }\n'
  const { body } = await post({ action: 'parseAccounts', value: { accountsYaml: yaml } })
  assert.equal(body.value.ok, false)
  assert.match(body.value.error, /请设置 defaultAccount/)
  assert.equal(body.value.list.length, 2, 'both cards are still returned so the user can pick one')
})

// --- serializeAccounts ------------------------------------------------------

test('serializeAccounts keeps comments (the step-1 writer cannot)', async t => {
  const { post } = mount(t)
  const source = [
    '# 工作邮箱',
    'work:',
    '  user: w@qq.com   # 主账号',
    '  provider: qq',
    '# 家庭邮箱',
    'home:',
    '  user: h@163.com',
    '',
  ].join('\n')
  const { status, body } = await post({
    action: 'serializeAccounts',
    accountsYaml: source,
    defaultAccount: 'work',
    accounts: [
      { name: 'work', provider: 'qq', user: 'w@qq.com', password: 'pw', inboxFolder: 'Archive' },
      { name: 'home', provider: '163', user: 'h@163.com' },
    ],
  })
  assert.equal(status, 200)
  assert.equal(body.ok, true)
  const out = body.value.accountsYaml
  assert.equal(body.value.commentsDropped, undefined, 'the comment-preserving path must have been used')
  assert.match(out, /# 工作邮箱/)
  assert.match(out, /# 家庭邮箱/)
  assert.match(out, /# 主账号/)
  // Comments surviving must not cost correctness.
  const parsed = parseAccountsYaml(out)
  assert.deepEqual(Object.keys(parsed.map).sort(), ['home', 'work'])
  assert.equal(parsed.map.work.password, 'pw')
  assert.equal(parsed.map.work.inboxFolder, 'Archive')
  assert.equal(parsed.defaultAccount, 'work')
})

test('serializeAccounts: a custom account writes no provider key; stored endpoints and unknown keys survive', async t => {
  const { post } = mount(t)
  const source = 'work:\n  user: w@x.y\n  imap:\n    socketTimeoutMs: 9000\n    host: imap.old\n'
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: source,
    defaultAccount: 'work',
    accounts: [{
      name: 'work',
      provider: '',
      user: 'w@x.y',
      password: 'pw',
      imap: { host: 'imap.new', port: 143, secure: false },
    }],
  })
  const out = body.value.accountsYaml
  assert.equal(/provider/.test(out), false, 'provider "" would resolve as 「provider "" 未知」')
  assert.match(out, /socketTimeoutMs: 9000/, 'an advanced key must survive in place')
  // A provider-less account has nothing but its stored endpoints to connect
  // with, and the provider did not change, so they are not stale and stay put.
  // The card never writes endpoints (they are edited through presets or the raw
  // YAML), so the posted imap.new is dropped rather than stored.
  assert.match(out, /host: imap\.old/, 'the endpoint that drives the connection survives')
  assert.equal(/imap\.new/.test(out), false, 'a card does not write endpoints')
  const parsed = parseAccountsYaml(out)
  assert.equal('provider' in parsed.map.work, false)
  assert.equal(parsed.map.work.imap.socketTimeoutMs, 9000)
  assert.equal(parsed.map.work.imap.host, 'imap.old')
  assert.equal('port' in parsed.map.work.imap, false, 'fields the account never declared are still not invented')
  assert.equal('secure' in parsed.map.work.imap, false)
})

test('serializeAccounts: no accounts serializes to "" (never "{}")', async t => {
  const { post } = mount(t)
  const { status, body } = await post({ action: 'serializeAccounts', accountsYaml: 'work: { user: w@x.y }\ndefaultAccount: work\n', accounts: [] })
  assert.equal(status, 200)
  assert.equal(body.value.accountsYaml, '')
  // '' must leave any row-level accounts authoritative; '{}' resolves as a
  // nonsense "multiple accounts ()" error instead.
  const withRow = resolveEmailSettings({ accountsYaml: body.value.accountsYaml, accounts: { a: { provider: 'qq', user: 'a@b.c', password: 'p' } } })
  assert.deepEqual([...withRow.accounts.keys()], ['a'])
})

test('serializeAccounts: renaming deletes the old key and writes every field on the new one', async t => {
  const { post } = mount(t)
  const source = 'work: { provider: qq, user: w@qq.com, password: pw }\n# 保留我\nhome: { user: h@163.com }\n'
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: source,
    defaultAccount: 'personal',
    accounts: [
      { name: 'personal', provider: 'qq', user: 'w@qq.com', password: 'pw', inboxFolder: 'Archive' },
      { name: 'home', user: 'h@163.com' },
    ],
  })
  const out = body.value.accountsYaml
  const parsed = parseAccountsYaml(out)
  assert.deepEqual(Object.keys(parsed.map).sort(), ['home', 'personal'])
  assert.equal(Object.keys(parsed.map).includes('work'), false, 'the old name must be gone')
  assert.equal(parsed.map.personal.provider, 'qq')
  assert.equal(parsed.map.personal.user, 'w@qq.com')
  assert.equal(parsed.map.personal.password, 'pw')
  assert.equal(parsed.map.personal.inboxFolder, 'Archive')
  assert.equal(parsed.map.home.user, 'h@163.com')
  assert.equal(parsed.defaultAccount, 'personal')
  assert.match(out, /# 保留我/, 'comments on surviving keys are untouched by the rename')
})

test('serializeAccounts: drops removed accounts and clears defaultAccount when empty', async t => {
  const { post } = mount(t)
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: 'work: { user: w@x.y }\nhome: { user: h@x.y }\ndefaultAccount: home\n',
    defaultAccount: '',
    accounts: [{ name: 'work', user: 'w@x.y' }],
  })
  const parsed = parseAccountsYaml(body.value.accountsYaml)
  assert.deepEqual(Object.keys(parsed.map), ['work'])
  assert.equal(parsed.defaultAccount, undefined, 'an empty default must delete the key, not store ""')
})

test('serializeAccounts: a numeric password is coerced to a quoted string', async t => {
  const { post } = mount(t)
  const source = 'work: { user: w@x.y }\n'
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: source,
    defaultAccount: 'work',
    accounts: [{ name: 'work', user: 'w@x.y', password: 123456 }],
  })
  const out = body.value.accountsYaml
  assert.equal(out.includes('password: "123456"'), true, 'YAML would read a bare 123456 back as a number')
  assert.equal(parseAccountsYaml(out).map.work.password, '123456')
})

test('serializeAccounts: a blank document seeds a fresh mapping', async t => {
  const { post } = mount(t)
  const { status, body } = await post({
    action: 'serializeAccounts',
    accountsYaml: '',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq', user: 'w@qq.com', password: 'pw' }],
  })
  assert.equal(status, 200)
  const parsed = parseAccountsYaml(body.value.accountsYaml)
  assert.deepEqual(Object.keys(parsed.map), ['work'])
  assert.equal(parsed.map.work.provider, 'qq')
  assert.equal(parsed.defaultAccount, 'work')
})

test('serializeAccounts: an unparseable draft degrades to the stringify path and says so', async t => {
  const { post } = mount(t)
  const { status, body } = await post({
    action: 'serializeAccounts',
    accountsYaml: 'work: [unclosed\n',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq', user: 'w@qq.com', password: 'pw' }],
  })
  assert.equal(status, 200)
  assert.equal(body.value.commentsDropped, true, 'the editor must be told the comments are gone')
  const parsed = parseAccountsYaml(body.value.accountsYaml)
  assert.deepEqual(Object.keys(parsed.map), ['work'], 'semantics are still preserved')
  assert.equal(parsed.map.work.user, 'w@qq.com')
})

// --- serializeAccounts: the password is three-state ------------------------
//
// The card list never carries a plaintext password (the snapshot exposes
// hasPassword only), so a card that omits `password` is the normal case on every
// save. Omitting it must mean "leave the stored secret alone" — treating it as
// "delete" silently wiped the user's 授权码 on any unrelated edit. An explicit
// '' is the only thing that clears the key.

test('serializeAccounts: an omitted password keeps the stored one, an empty string clears it', async t => {
  const { post } = mount(t)
  const source = [
    'work:',
    '  provider: qq',
    '  user: w@qq.com',
    '  # 授权码这行别动',
    '  password: super-secret',
    '  inboxFolder: INBOX',
    '',
  ].join('\n')
  // Exactly what the editor sends back for an untouched card: no password key.
  const kept = await post({
    action: 'serializeAccounts',
    accountsYaml: source,
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq', user: 'w@qq.com', inboxFolder: 'INBOX' }],
  })
  assert.equal(kept.status, 200)
  const out = kept.body.value.accountsYaml
  assert.equal(kept.body.value.passwordsDropped, undefined, 'the main path always preserved it')
  assert.equal(parseAccountsYaml(out).map.work.password, 'super-secret')
  // Untouched means untouched: the value, its comment and its position survive.
  assert.match(out, /# 授权码这行别动\n {2}password: super-secret\n/, 'value, comment and position are all unchanged')

  // '' is the user emptying the password box: an explicit clear.
  const cleared = await post({
    action: 'serializeAccounts',
    accountsYaml: source,
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq', user: 'w@qq.com', password: '', inboxFolder: 'INBOX' }],
  })
  const clearedText = cleared.body.value.accountsYaml
  assert.equal(/password/.test(clearedText), false, 'an explicit empty password deletes the key')
  assert.equal('password' in parseAccountsYaml(clearedText).map.work, false)
  assert.match(clearedText, /user: w@qq\.com/, 'the rest of the account is still written')
})

test('serializeAccounts: an omitted password leaves a stored number a number', async t => {
  const { post } = mount(t)
  const source = 'work:\n  user: w@x.y\n  password: 123456\n'
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: source,
    defaultAccount: 'work',
    accounts: [{ name: 'work', user: 'w@x.y' }],
  })
  const out = body.value.accountsYaml
  assert.match(out, /password: 123456/, 'the stored node is not rewritten')
  assert.equal(/"123456"/.test(out), false, 'preserving means preserving the type too')
  assert.equal(parseAccountsYaml(out).map.work.password, 123456)
})

test('serializeAccounts: an unreadable draft reports passwordsDropped, an explicit write does not', async t => {
  const { post } = mount(t)
  // The degraded path is reached only when the source itself is broken, so the
  // old passwords cannot be read back: a silent card may be losing a secret.
  const lost = await post({
    action: 'serializeAccounts',
    accountsYaml: 'work: [unclosed\n',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq', user: 'w@qq.com' }],
  })
  assert.equal(lost.status, 200)
  assert.equal(lost.body.value.commentsDropped, true)
  assert.equal(lost.body.value.passwordsDropped, true, 'the editor must be told a password may be gone')

  // A card that does carry a password drops nothing, so no signal.
  const written = await post({
    action: 'serializeAccounts',
    accountsYaml: 'work: [unclosed\n',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq', user: 'w@qq.com', password: 'fresh-pw' }],
  })
  assert.equal(written.body.value.passwordsDropped, undefined)
  assert.equal(parseAccountsYaml(written.body.value.accountsYaml).map.work.password, 'fresh-pw')

  // An explicit clear is a decision, not a loss: no signal either.
  const cleared = await post({
    action: 'serializeAccounts',
    accountsYaml: 'work: [unclosed\n',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq', user: 'w@qq.com', password: '' }],
  })
  assert.equal(cleared.body.value.passwordsDropped, undefined)
  assert.equal('password' in parseAccountsYaml(cleared.body.value.accountsYaml).map.work, false)
})

test('serializeAccounts: a rename is a new account and carries no password over', async t => {
  const { post } = mount(t)
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: 'work: { provider: qq, user: w@qq.com, password: pw-secret }\n',
    defaultAccount: 'personal',
    accounts: [{ name: 'personal', provider: 'qq', user: 'w@qq.com' }],
  })
  const out = body.value.accountsYaml
  const parsed = parseAccountsYaml(out)
  assert.deepEqual(Object.keys(parsed.map), ['personal'])
  // Renaming = a new account, so the old secret must not follow it. Locked in
  // deliberately: "helpfully" carrying it over would send one account's
  // 授权码 to whatever the new name resolves to.
  assert.equal('password' in parsed.map.personal, false)
  assert.equal(out.includes('pw-secret'), false, 'the old password must not survive the rename')
})

test('serializeAccounts: output round-trips back through parseAccounts', async t => {
  const { post } = mount(t)
  const cards = [
    { name: 'work', provider: 'outlook', user: 'w@outlook.com', password: 'pw', inboxFolder: 'Archive' },
    { name: 'corp', provider: 'corp', user: 'c@corp.example', password: 'pw' },
  ]
  const written = await post({ action: 'serializeAccounts', serverPresets: CORP_PRESETS, accountsYaml: '', defaultAccount: 'corp', accounts: cards })
  const reread = await post({ action: 'parseAccounts', serverPresets: CORP_PRESETS, value: { accountsYaml: written.body.value.accountsYaml } })
  assert.equal(reread.body.value.ok, true)
  assert.equal(reread.body.value.error, undefined)
  assert.deepEqual(reread.body.value.list.map(card => card.name).sort(), ['corp', 'work'])
  assert.equal(reread.body.value.defaultAccount, 'corp')
  const corp = reread.body.value.list.find(card => card.name === 'corp')
  assert.equal(corp.provider, 'corp', 'the custom preset name round-trips as the provider id')
  assert.equal(corp.imap.host, 'imap.corp', 'and the endpoints come back from the preset table')
  assert.equal(corp.imap.port, 143)
  assert.equal(corp.imap.secure, false)
  assert.equal(corp.smtp.port, 587)
  const work = reread.body.value.list.find(card => card.name === 'work')
  assert.equal(work.provider, 'outlook')
  assert.equal(work.smtp.port, 587, 'the outlook preset still expands')
})

test('serializeAccounts rejects a malformed card list with 400, not a corrupted document', async t => {
  const { post } = mount(t)
  for (const accounts of [[{ name: '' }], [{ user: 'x@y.z' }], ['nope'], [null]]) {
    const { status, body } = await post({ action: 'serializeAccounts', accountsYaml: '', accounts })
    assert.equal(status, 400, `input ${JSON.stringify(accounts)} must be rejected`)
    assert.equal(body.ok, false)
    assert.match(body.error.message, /账号|name|数组|对象/)
  }
  const reserved = await post({ action: 'serializeAccounts', accountsYaml: '', accounts: [{ name: 'defaultAccount' }] })
  assert.equal(reserved.status, 400)
  assert.match(reserved.body.error.message, /defaultAccount/)
})

// --- test action ------------------------------------------------------------

test('test action: an unknown account name is a 400 that lists the available accounts', async t => {
  const { post } = mount(t)
  const { status, body } = await post({
    action: 'test',
    account: 'nope',
    value: { ...BASE, accountsYaml: 'work: { provider: qq, user: w@qq.com, password: pw }\nhome: { provider: "163", user: h@163.com, password: ph }\ndefaultAccount: work\n' },
  })
  assert.equal(status, 400)
  assert.equal(body.ok, false)
  assert.match(body.error.message, /未知账号 "nope"/)
  assert.match(body.error.message, /work/)
  assert.match(body.error.message, /home/)
})

test('test action: the requested account is validated before any connection is attempted', async t => {
  // offline by construction: an unknown name fails in account lookup, so the
  // pool never dials. A known name would reach the network, so only the
  // rejection path is asserted here.
  const { post } = mount(t)
  const { status, body } = await post({
    action: 'test',
    account: 'ghost',
    value: { ...BASE, accountsYaml: 'solo: { provider: qq, user: s@qq.com, password: ps }\n' },
  })
  assert.equal(status, 400)
  assert.match(body.error.message, /未知账号 "ghost"/)
  assert.match(body.error.message, /solo/)
})

test('test action: the reply shape carries account/imapHost/imapPort on success', async t => {
  // Stub the dial so the assertion is about the reply shape, not the network.
  t.mock.method(EmailPool.prototype, 'withImap', async function (name) {
    // Return the resolved account name the backend asked for.
    return name
  })
  const { post } = mount(t)
  const value = {
    ...BASE,
    accountsYaml: 'work: { provider: qq, user: w@qq.com, password: pw }\ncorp: { user: c@corp.example, password: pc, imap: { host: imap.corp, port: 143, secure: false }, smtp: { host: smtp.corp } }\ndefaultAccount: work\n',
  }
  const picked = await post({ action: 'test', account: 'corp', value })
  assert.equal(picked.status, 200, JSON.stringify(picked.body))
  assert.equal(picked.body.value.ok, true)
  assert.equal(picked.body.value.account, 'corp')
  assert.equal(picked.body.value.imapHost, 'imap.corp')
  assert.equal(picked.body.value.imapPort, 143)
  assert.equal(typeof picked.body.value.ms, 'number')

  // No account argument: the draft's default account is tested.
  const fallback = await post({ action: 'test', value })
  assert.equal(fallback.status, 200)
  assert.equal(fallback.body.value.account, 'work')
  assert.equal(fallback.body.value.imapHost, 'imap.qq.com', 'the qq preset expands')
  assert.equal(fallback.body.value.imapPort, 993)

  // A blank/whitespace account name means "default", not "unknown account".
  const blank = await post({ action: 'test', account: '   ', value })
  assert.equal(blank.status, 200)
  assert.equal(blank.body.value.account, 'work')
})

test('test action: the reply shape carries account/imapHost/imapPort even on failure', async t => {
  // A failing dial must still tell the panel which endpoint was tried.
  t.mock.method(EmailPool.prototype, 'withImap', async function () {
    throw new Error('邮箱登录失败：请检查邮箱地址与授权码（Command failed）')
  })
  const { post } = mount(t)
  const value = { ...BASE, accountsYaml: 'corp: { user: c@corp.example, password: pc, imap: { host: imap.corp, port: 143 }, smtp: { host: smtp.corp } }\n' }
  const { status, body } = await post({ action: 'test', account: 'corp', value })
  assert.equal(status, 400)
  assert.equal(body.ok, false)
  assert.match(body.error.message, /邮箱登录失败/)
  // Failed dials surface through the error envelope, so the endpoint is named
  // in the message the panel shows.
  const direct = await (async () => {
    const { EmailSettingsBackend } = await import('../lib/web.js')
    const backend = new EmailSettingsBackend(
      { settings: { writable: true, describe: () => [{ ns: 'dsh-email', user: {}, revision: 1, applies: 'live' }] } },
      { get: () => value },
      {},
    )
    try {
      await backend.test(value, 'corp')
      return null
    } catch (error) {
      return error.message
    }
  })()
  assert.match(direct, /邮箱登录失败/)
})

// --- test action: a partial value is a draft, not a validation failure ------
//
// The per-card 「测试连接」 button posts the card editor's own control bundle
// ({ accountsYaml, onChangeAccountsYaml }); JSON.stringify drops the function, so
// the body arrives as { accountsYaml } — no provider key at all, and none of the
// other form fields either. 「Missing」 has to mean 「未设置」: it is not an unknown
// provider, and an undefined must never be projected over the row config (an own
// key holding undefined still wins in `{ ...rowConfig, ...toEmailConfig(...) }`).

const NO_PROVIDER_VALUE = 'work: { provider: qq, user: w@qq.com, password: pw }\n'

test('test action: a value with no provider key is unset, not an unknown provider', async t => {
  // Stub the dial: the bug is a validation failure, which happens before the pool.
  t.mock.method(EmailPool.prototype, 'withImap', async function (name) { return name })
  const { post } = mount(t)
  // Exactly what client.js sends for one card's 「测试连接」: provider absent.
  const { status, body } = await post({ action: 'test', account: 'work', value: { accountsYaml: NO_PROVIDER_VALUE } })
  assert.equal(status, 200, JSON.stringify(body))
  assert.equal(body.value.ok, true)
  assert.equal(body.value.account, 'work')
  assert.equal(body.value.imapHost, 'imap.qq.com')
  assert.equal(body.value.imapPort, 993)
})

test('test action: undefined fields never shadow the row config', async t => {
  t.mock.method(EmailPool.prototype, 'withImap', async function (name) { return name })
  const { post } = mount(t)
  // This account carries no provider and no endpoints of its own, so only the row
  // config (provider qq + user + password) can resolve it. A projection carrying
  // `provider: undefined` would clobber the row provider and the account would
  // come back 「imap.host 未填写」 instead of dialling the qq preset.
  const { status, body } = await post({
    action: 'test',
    account: 'custom',
    value: { accountsYaml: 'custom: { user: c@qq.com, password: cp }\n' },
  })
  assert.equal(status, 200, JSON.stringify(body))
  assert.equal(body.value.imapHost, 'imap.qq.com', 'the row provider preset still expands')
  assert.equal(body.value.imapPort, 993)
})

test('test action: undefined scalars and nested objects are all treated as unset', async t => {
  t.mock.method(EmailPool.prototype, 'withImap', async function (name) { return name })
  const { post } = mount(t)
  const partials = [
    { provider: undefined, user: undefined, password: undefined, inboxFolder: undefined, sendApproval: undefined, maxBodyChars: undefined, downloadDir: undefined, serverPresets: undefined },
    { provider: null, imap: null, smtp: null },
    { imap: undefined, smtp: undefined },
  ]
  for (const partial of partials) {
    const value = { accountsYaml: NO_PROVIDER_VALUE, ...partial }
    const { status, body } = await post({ action: 'test', account: 'work', value })
    assert.equal(status, 200, `${Object.keys(partial).join(',')} -> ${JSON.stringify(body)}`)
    assert.equal(body.value.imapHost, 'imap.qq.com', `unset keys must not disturb resolution: ${Object.keys(partial).join(',')}`)
  }
  // An unset accountsYaml is not an error either: it just means "no YAML draft",
  // so the row config's own account is what gets tested.
  const noYaml = await post({ action: 'test', value: { accountsYaml: undefined } })
  assert.equal(noYaml.status, 200, JSON.stringify(noYaml.body))
  assert.equal(noYaml.body.value.account, 'default')
  assert.equal(noYaml.body.value.imapHost, 'imap.qq.com', 'the row provider preset still expands')
})

test('a genuinely unknown provider still fails loud, with the value JSON-quoted', async t => {
  t.mock.method(EmailPool.prototype, 'withImap', async function (name) { return name })
  const { post } = mount(t)
  const value = account => ({ ...BASE, provider: account, accountsYaml: NO_PROVIDER_VALUE })

  const word = await post({ action: 'test', account: 'work', value: value('hotdog') })
  assert.equal(word.status, 400)
  assert.match(word.body.error.message, /未知的邮箱服务商 "hotdog"/, 'a string is still quoted')

  // A non-string is reported as its JSON form, never concatenated into the sentence.
  const numbered = await post({ action: 'test', account: 'work', value: value(123) })
  assert.equal(numbered.status, 400)
  assert.match(numbered.body.error.message, /未知的邮箱服务商 123/)
  assert.equal(/服务商"?undefined/.test(numbered.body.error.message), false)

  const empty = await post({ action: 'test', account: 'work', value: value('') })
  assert.equal(empty.status, 200, 'provider "" is 「自定义服务器」, not an unknown provider')
})

test('save action: a value without provider saves as 「未设置」 instead of erroring', async t => {
  const mounted = mount(t, { revision: 7 })
  const value = { ...BASE }
  delete value.provider
  const { status, body } = await mounted.post({ action: 'save', expectedRevision: 7, value })
  assert.equal(status, 200, JSON.stringify(body))
  assert.equal(body.value.settings.revision, 8)
})

test('unset is unset: validateSettingsValue tolerates it and toEmailConfig omits it', async t => {
  const { validateSettingsValue, toEmailConfig } = await import('../lib/settings.js')
  for (const provider of [undefined, null, '']) {
    assert.doesNotThrow(
      () => validateSettingsValue({ ...BASE, provider }),
      `provider ${String(provider)} must count as 「未设置」`,
    )
  }
  assert.doesNotThrow(() => validateSettingsValue({ ...BASE, imap: null }), 'a missing endpoint is not a port violation')
  assert.doesNotThrow(() => validateSettingsValue({ accountsYaml: NO_PROVIDER_VALUE }), 'a partial draft is a legal draft')
  assert.throws(() => validateSettingsValue({ ...BASE, provider: 'hotdog' }), /未知的邮箱服务商 "hotdog"/)
  assert.throws(() => validateSettingsValue({ ...BASE, provider: 123 }), /未知的邮箱服务商 123/)
  assert.throws(() => validateSettingsValue({ ...BASE, imap: { ...BASE.imap, port: 0 } }), /IMAP 端口必须在 1-65535 之间/)

  // The projection is what actually spreads over the row config, so an absent
  // field must not appear as a key at all — `{...row, ...{provider: undefined}}`
  // keeps undefined and loses the row's provider.
  const projected = toEmailConfig({ accountsYaml: NO_PROVIDER_VALUE }, null)
  assert.deepEqual(Object.keys(projected), ['accountsYaml'], 'absent fields are not projected')
  assert.equal('provider' in projected, false)
  // '' is the explicit 「自定义服务器」: clearing the row provider is still the point.
  const cleared = toEmailConfig({ ...BASE, provider: '' }, null)
  assert.equal('provider' in cleared, true)
  assert.equal(cleared.provider, undefined)
  assert.equal(toEmailConfig({ ...BASE, provider: 'qq' }, null).provider, 'qq')
})

// --- housekeeping -----------------------------------------------------------

test('existing actions still behave (save conflict, watch, unsupported action)', async t => {
  const mounted = mount(t, { revision: 5 })
  const stale = await mounted.post({ action: 'save', expectedRevision: 4, value: { ...BASE } })
  assert.equal(stale.status, 409)
  assert.equal(stale.body.error.code, 'settings-conflict')

  const fresh = await mounted.post({ action: 'save', expectedRevision: 5, value: { ...BASE, user: 'new@qq.com' } })
  assert.equal(fresh.status, 200)
  assert.equal(fresh.body.value.settings.revision, 6)

  const unsupported = await mounted.post({ action: 'nonsense' })
  assert.equal(unsupported.status, 400)
  assert.equal(unsupported.body.error.message, 'unsupported action')

  // parseAccounts/serializeAccounts are pure: no revision, no conflict.
  const pure = await mounted.post({ action: 'parseAccounts', value: { accountsYaml: 'a: { user: a@x.y }\n' } })
  assert.equal(pure.status, 200)
  assert.equal(pure.body.value.ok, true)
})

test('the new actions stay localhost-only like the rest of the route', async t => {
  const { call } = mount(t)
  const { status } = await call({ action: 'parseAccounts', value: { accountsYaml: '' } }, { remoteAddress: '10.0.0.7' })
  assert.equal(status, 403)
})

test('a cross-origin simple request cannot write settings', async t => {
  const { call } = mount(t)
  // text/plain is a「simple request」content type: a page the user visits can
  // POST it here with no preflight, which is exactly why it is refused.
  const simple = await call({ action: 'save', value: BASE }, {
    headers: { 'content-type': 'text/plain;charset=UTF-8', origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' },
  })
  assert.equal(simple.status, 415)
  assert.equal(simple.body.error.code, 'unsupported-media-type')
})

test('a foreign Origin on a JSON POST is refused', async t => {
  const { call } = mount(t)
  const { status, body } = await call({ action: 'parseAccounts', value: { accountsYaml: '' } }, {
    headers: { origin: 'https://evil.example' },
  })
  assert.equal(status, 403)
  assert.equal(body.error.code, 'forbidden')
  assert.match(body.error.message, /evil\.example/)
})

test('Sec-Fetch-Site catches an opaque Origin, and same-origin is let through', async t => {
  const { call } = mount(t)
  // A sandboxed iframe sends `Origin: null`; the site header is what names it.
  const sandboxed = await call({ action: 'parseAccounts', value: { accountsYaml: '' } }, {
    headers: { origin: 'null', 'sec-fetch-site': 'cross-site' },
  })
  assert.equal(sandboxed.status, 403)

  const sameOrigin = await call({ action: 'parseAccounts', value: { accountsYaml: 'a: { user: a@x.y }\n' } })
  assert.equal(sameOrigin.status, 200)
  assert.equal(sameOrigin.body.ok, true)
})

test('a rebound Host cannot read the snapshot, whatever the method', async t => {
  const { call } = mount(t)
  // The socket is still 127.0.0.1 — that is the whole point of rebinding — but
  // the name the browser used is not ours, and the snapshot carries accountsYaml
  // with the plaintext 授权码 in it.
  const get = await call(undefined, { method: 'GET', headers: { host: 'attacker.example' } })
  assert.equal(get.status, 403)
  assert.match(get.body.error.message, /attacker\.example/)
  const post = await call({ action: 'parseAccounts', value: { accountsYaml: '' } }, { headers: { host: 'attacker.example' } })
  assert.equal(post.status, 403)
})

test('a non-browser client on localhost still works, and localhost Hosts pass', async t => {
  const { call } = mount(t)
  // No Origin, no Sec-Fetch-Site: a script or curl on the same machine. Page
  // script cannot omit these headers, so this stays open.
  const scripted = await call({ action: 'parseAccounts', value: { accountsYaml: 'a: { user: a@x.y }\n' } }, {
    headers: { host: undefined, origin: undefined, 'sec-fetch-site': undefined },
  })
  assert.equal(scripted.status, 200)
  for (const host of ['localhost:3080', '127.0.0.1:3080', '[::1]:3080']) {
    const { status } = await call({ action: 'parseAccounts', value: { accountsYaml: '' } }, { headers: { host } })
    assert.equal(status, 200, `Host ${host} is a legitimate way to reach the panel`)
  }
})

test('hostVerdict and postVerdict: the guard rules on their own', () => {
  assert.equal(hostVerdict(undefined), undefined, 'no Host header is not a browser request')
  assert.equal(hostVerdict('localhost:3080'), undefined)
  assert.equal(hostVerdict('[::1]:3080'), undefined)
  assert.match(hostVerdict('attacker.example') ?? '', /not a localhost name/)

  assert.equal(postVerdict({ 'content-type': 'application/json' }), undefined, 'json with no browser headers passes')
  assert.equal(postVerdict({ 'content-type': 'application/json; charset=utf-8', origin: 'http://localhost:3080', 'sec-fetch-site': 'same-origin' }), undefined)
  assert.equal(postVerdict({ 'content-type': 'application/json', origin: 'app://dsh', 'sec-fetch-site': 'same-origin' }), undefined,
    'the host may load its UI through a custom protocol')
  assert.equal(postVerdict({}).status, 415, 'a missing content type is not a panel request')
  assert.equal(postVerdict({ 'content-type': 'application/x-www-form-urlencoded' }).status, 415)
  assert.equal(postVerdict({ 'content-type': 'application/json', origin: 'https://evil.example' }).status, 403)
  assert.equal(postVerdict({ 'content-type': 'application/json', 'sec-fetch-site': 'same-site' }).status, 403)
  assert.equal(postVerdict({ 'content-type': 'application/json', 'sec-fetch-site': 'none' }), undefined,
    'a user-initiated navigation carries no referrer')
})

test('snapshot never leaks a password through the card list', async t => {
  const yaml = 'work: { provider: qq, user: w@qq.com, password: super-secret }\n'
  const { get } = mount(t, { value: { accountsYaml: yaml } })
  const serialized = JSON.stringify((await get()).body)
  assert.equal(serialized.includes('super-secret'), true, 'the raw mapping is what the editor edits, so it carries the password')
  const card = (await get()).body.value.accountsDetail.list[0]
  // authKind/oauthState are the OAuth2 login projection; oauthUser stays absent
  // for a password account, where there is no login to describe.
  assert.deepEqual(
    Object.keys(card).sort(),
    ['authKind', 'hasPassword', 'imap', 'inboxFolder', 'isDefault', 'name', 'oauthState', 'provider', 'smtp', 'user'],
  )
  assert.equal(card.authKind, 'password')
  assert.equal(card.oauthState, 'none')
  assert.equal('oauthUser' in card, false)
  assert.equal(card.hasPassword, true, 'the card only reports whether a password exists')
  assert.equal(JSON.stringify(card).includes('super-secret'), false)
})

test('parseAccounts and serializeAccounts agree with the step-1 config helpers', async t => {
  const { post } = mount(t)
  const yaml = 'work: { provider: qq, user: w@qq.com, password: pw }\n'
  const parsed = await post({ action: 'parseAccounts', value: { accountsYaml: yaml } })
  // `raw` is gone — it echoed the parsed mapping, plaintext 授权码 included — so
  // agreement with the pure helper is asserted through the projection both sides
  // can see: the account names, and each card's identity fields.
  assert.equal('raw' in parsed.body.value, false)
  const helperMap = parseAccountsYaml(yaml).map
  assert.deepEqual(Object.keys(helperMap), ['work'])
  assert.equal(parsed.body.value.list.length, 1)
  assert.equal(parsed.body.value.list[0].name, 'work')
  assert.equal(parsed.body.value.list[0].provider, helperMap.work.provider)
  assert.equal(parsed.body.value.list[0].user, helperMap.work.user)
  assert.equal(parsed.body.value.defaultAccount, 'work')

  // The degrade path must match the pure stringify writer exactly.
  const written = await post({
    action: 'serializeAccounts',
    accountsYaml: 'work: [unclosed\n',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq', user: 'w@qq.com', password: 'pw' }],
  })
  assert.equal(
    written.body.value.accountsYaml,
    serializeAccountsYaml({ work: { provider: 'qq', user: 'w@qq.com', password: 'pw' } }, 'work'),
  )
})

test('serializeAccounts keeps an account that only inherits, and its preset survives resolution', async t => {
  const { post } = mount(t)
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: '',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq' }],
  })
  const out = body.value.accountsYaml
  const parsed = parseAccountsYaml(out)
  assert.deepEqual(Object.keys(parsed.map), ['work'])
  assert.equal(parsed.map.work.provider, 'qq')
  const resolved = resolveEmailSettings({ user: 'shared@qq.com', password: 'p', accountsYaml: out })
  assert.equal(resolved.accounts.get('work').imap.host, 'imap.qq.com')
  assert.equal(resolved.defaultAccount, 'work')
})

test('serializeAccounts does not disturb an unrelated account untouched by the cards', async t => {
  const { post } = mount(t)
  const source = [
    '# 顶部说明',
    'work:',
    '  provider: qq',
    '  user: w@qq.com',
    '  password: old-pw',
    'home:',
    '  provider: "163"',
    '  user: h@163.com',
    '  password: home-pw',
    '  imap: { socketTimeoutMs: 1234, host: imap.163.com }',
    'defaultAccount: home',
    '',
  ].join('\n')
  // Edit only "work"; "home" is sent back verbatim.
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: source,
    defaultAccount: 'home',
    accounts: [
      { name: 'work', provider: 'qq', user: 'w@qq.com', password: 'new-pw' },
      { name: 'home', provider: '163', user: 'h@163.com', password: 'home-pw', imap: { host: 'imap.163.com', socketTimeoutMs: 1234 } },
    ],
  })
  const out = body.value.accountsYaml
  assert.match(out, /# 顶部说明/)
  assert.match(out, /socketTimeoutMs: 1234/)
  const parsed = parseAccountsYaml(out)
  assert.equal(parsed.map.work.password, 'new-pw')
  assert.equal(parsed.map.home.imap.socketTimeoutMs, 1234)
  assert.equal(parsed.defaultAccount, 'home')
  // The file stays resolvable end to end.
  const resolved = resolveEmailSettings({ accountsYaml: out })
  assert.deepEqual([...resolved.accounts.keys()].sort(), ['home', 'work'])
  assert.equal(resolved.defaultAccount, 'home')
})

test('presets from serverPresets never reach the pool fingerprint', async t => {
  const presets = 'corp:\n  imap: { host: imap.corp }\n  smtp: { host: smtp.corp }\n'
  const { get } = mount(t, { value: { accountsYaml: 'work: { provider: corp, user: w@corp.example }\n', serverPresets: presets } })
  const value = (await get()).body.value
  // snapshotting presets must not project them into the settings value that
  // resolution reads.
  const { toEmailConfig } = await import('../lib/settings.js')
  assert.equal('serverPresets' in toEmailConfig(value.settings.value, null), false)
  assert.deepEqual(parseServerPresets(presets).corp.imap, { host: 'imap.corp' })
})

// --- serializeAccounts: a provider name is a reference, not an expansion -----
//
// An account stores a provider id; resolveAccount() consults the built-in
// presets and then the custom serverPresets, so a name the table defines is
// what belongs in the document. The tests for that contract live above, next to
// the CORP_PRESETS fixture.

test('serializeAccounts: a built-in provider keeps its shorthand', async t => {
  const { post } = mount(t)
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: '',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq', user: 'w@qq.com', password: 'pw' }],
  })
  const out = body.value.accountsYaml
  assert.match(out, /provider: qq/, 'builtins stay a one-word shorthand')
  assert.equal(parseAccountsYaml(out).map.work.provider, 'qq')
  // Only the shorthand is stored, so the preset still supplies the endpoints.
  const resolved = resolveEmailSettings({ accountsYaml: out })
  assert.equal(resolved.accounts.get('work').imap.host, 'imap.qq.com')
  assert.equal(resolved.accounts.get('work').smtp.host, 'smtp.qq.com')
})

test('serializeAccounts: only an own key of the provider table is ever persisted', async t => {
  const { post } = mount(t)
  // A plain table lookup would accept inherited names like "constructor" and
  // hand a function to the YAML writer (or blow up on its .imap.host).
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: '',
    defaultAccount: 'weird',
    accounts: [{ name: 'weird', provider: 'constructor', user: 'w@x.y', password: 'pw', imap: { host: 'imap.x' }, smtp: { host: 'smtp.x' } }],
  })
  const out = body.value.accountsYaml
  assert.equal(/provider/.test(out), false, 'an inherited Object member is not a preset name')
  assert.equal('provider' in parseAccountsYaml(out).map.weird, false)
  // With no provider and no stored endpoint there is nothing left to resolve —
  // and that is the honest outcome: the card named no provider the table knows.
  assert.throws(() => resolveEmailSettings({ accountsYaml: out }), /imap\.host 未填写/)
})

test('serializeAccounts keeps a hand-written custom provider as the provider id', async t => {
  const presets = 'corp:\n  imap: { host: imap.corp, port: 143, secure: false }\n  smtp: { host: smtp.corp, port: 587, secure: false }\n'
  const source = 'work: { provider: corp, user: w@corp.example, password: pw }\n'
  const mounted = mount(t, { value: { accountsYaml: source, serverPresets: presets } })
  // 1) The custom preset expands into the card — the provider name is the id.
  const card = (await mounted.get()).body.value.accountsDetail.list.find(entry => entry.name === 'work')
  assert.equal(card.provider, 'corp')
  assert.equal(card.imap.host, 'imap.corp', 'the custom preset is what fills the card')
  assert.equal(card.smtp.host, 'smtp.corp')
  // 2) The editor sends that card straight back on an unrelated edit. The body
  //    carries no serverPresets, so the stored table is what the route consults.
  const { status, body } = await mounted.post({
    action: 'serializeAccounts',
    accountsYaml: source,
    defaultAccount: 'work',
    accounts: [{
      name: card.name,
      provider: card.provider,
      user: card.user,
      inboxFolder: card.inboxFolder,
      imap: card.imap,
      smtp: card.smtp,
    }],
  })
  assert.equal(status, 200)
  const out = body.value.accountsYaml
  assert.match(out, /provider: corp/, 'the reference resolves, so it is what gets stored')
  // 3) The saved draft resolves through the preset table, secret intact.
  const resolved = resolveEmailSettings({ accountsYaml: out, serverPresets: presets })
  const work = resolved.accounts.get('work')
  assert.equal(work.imap.host, 'imap.corp')
  assert.equal(work.imap.port, 143)
  assert.equal(work.imap.secure, false)
  assert.equal(work.smtp.host, 'smtp.corp')
  assert.equal(work.smtp.port, 587)
  assert.equal(work.password, 'pw', 'keeping the provider must not cost the stored secret')
})

test('serializeAccounts: the degraded writer keeps a resolvable custom provider and drops endpoints', async t => {
  const { post } = mount(t)
  // Broken source YAML: serializeAccountsDraft hands over to fallbackSerialize,
  // which builds its account maps from scratch (normalizeCardForYaml).
  const { status, body } = await post({
    action: 'serializeAccounts',
    serverPresets: CORP_PRESETS,
    accountsYaml: 'work: [unclosed\n',
    defaultAccount: 'work',
    accounts: [{
      name: 'work',
      provider: 'corp',
      user: 'w@corp.example',
      password: 'pw',
      imap: { host: 'imap.corp', port: 143, secure: false },
      smtp: { host: 'smtp.corp', port: 587, secure: false },
    }],
  })
  assert.equal(status, 200)
  assert.equal(body.value.commentsDropped, true, 'this is the stringify path')
  const out = body.value.accountsYaml
  assert.match(out, /provider: corp/)
  const parsed = parseAccountsYaml(out)
  assert.equal(parsed.map.work.provider, 'corp')
  assert.equal('imap' in parsed.map.work, false, 'the degraded writer drops endpoints too')
  assert.equal('smtp' in parsed.map.work, false)
  const resolved = resolveEmailSettings({ accountsYaml: out, serverPresets: CORP_PRESETS })
  assert.equal(resolved.accounts.get('work').smtp.host, 'smtp.corp')
})

// --- accounts store a provider id; the endpoints come from the preset table --
//
// A preset name is now a *provider reference*, so it must survive the round trip
// as a one-word shorthand. Endpoints never belong in the account document: they
// are derived from the preset at resolution time, and a hand-written endpoint on
// an existing YAML is washed out on the next save.

const CORP_PRESETS = [
  'corp:',
  '  label: 公司邮箱',
  '  imap: { host: imap.corp, port: 143, secure: false }',
  '  smtp: { host: smtp.corp, port: 587, secure: false }',
  '',
].join('\n')

test('serializeAccounts: a custom preset name is persisted as the provider, with no endpoint keys', async t => {
  const { post } = mount(t)
  const { status, body } = await post({
    action: 'serializeAccounts',
    serverPresets: CORP_PRESETS,
    accountsYaml: '',
    defaultAccount: 'work',
    accounts: [{
      name: 'work',
      provider: 'corp',
      user: 'w@corp.example',
      password: 'pw',
      imap: { host: 'imap.corp', port: 143, secure: false },
      smtp: { host: 'smtp.corp', port: 587, secure: false },
    }],
  })
  assert.equal(status, 200)
  const out = body.value.accountsYaml
  assert.match(out, /provider: corp/, 'the preset name is the account is the provider id')
  const parsed = parseAccountsYaml(out)
  assert.equal(parsed.map.work.provider, 'corp')
  assert.equal('imap' in parsed.map.work, false, 'endpoints never belong in the account document')
  assert.equal('smtp' in parsed.map.work, false)
  assert.equal(/imap\.corp|smtp\.corp/.test(out), false, 'the expanded endpoints are not written either')
  // The saved document resolves entirely through the preset table.
  const resolved = resolveEmailSettings({ accountsYaml: out, serverPresets: CORP_PRESETS })
  const work = resolved.accounts.get('work')
  assert.equal(work.imap.host, 'imap.corp')
  assert.equal(work.imap.port, 143)
  assert.equal(work.smtp.host, 'smtp.corp')
  assert.equal(work.password, 'pw')
})

test('serializeAccounts: without serverPresets in the body an unknown preset name is still dropped', async t => {
  const { post } = mount(t)
  // Backward compatibility: a front end that has not been updated yet sends no
  // serverPresets, so the old "built-ins only" verdict stands.
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: '',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'corp', user: 'w@corp.example', password: 'pw' }],
  })
  const out = body.value.accountsYaml
  assert.equal(/provider/.test(out), false)
  assert.equal('provider' in parseAccountsYaml(out).map.work, false)
})

test('serializeAccounts: a custom preset in the body still leaves an unknown name alone', async t => {
  const { post } = mount(t)
  const { body } = await post({
    action: 'serializeAccounts',
    serverPresets: CORP_PRESETS,
    accountsYaml: '',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'hotdog', user: 'w@x.y', password: 'pw' }],
  })
  assert.equal(/provider/.test(body.value.accountsYaml), false, 'only real preset names are persisted')
})

test('serializeAccounts: a built-in name wins over a custom preset that shadows it', async t => {
  const { post } = mount(t)
  const { body } = await post({
    action: 'serializeAccounts',
    serverPresets: 'qq: { imap: { host: imap.evil }, smtp: { host: smtp.evil } }\n',
    accountsYaml: '',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq', user: 'w@qq.com', password: 'pw' }],
  })
  const out = body.value.accountsYaml
  assert.match(out, /provider: qq/)
  // Resolution consults PROVIDER_PRESETS first, so the shadowing entry never wins.
  const resolved = resolveEmailSettings({ accountsYaml: out, serverPresets: 'qq: { imap: { host: imap.evil }, smtp: { host: smtp.evil } }\n' })
  assert.equal(resolved.accounts.get('work').imap.host, 'imap.qq.com', 'built-ins are looked up first')
})

test('serializeAccounts keeps hand-written endpoints while the provider is unchanged, and washes them on a provider switch', async t => {
  const { post } = mount(t)
  const source = [
    'work:',
    '  provider: qq',
    '  user: w@qq.com',
    '  password: pw',
    '  imap:',
    '    host: imap.old.example',
    '    port: 143',
    '    socketTimeoutMs: 9000',
    '  smtp: { host: smtp.old.example }',
    '',
  ].join('\n')

  // Saving without touching the provider must not move the connection target.
  // Runtime resolution prefers the account's own host, so washing here would
  // silently repoint a working self-hosted account at the preset merely because
  // the user opened the settings panel.
  const kept = await post({
    action: 'serializeAccounts',
    accountsYaml: source,
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'qq', user: 'w@qq.com' }],
  })
  assert.equal(kept.status, 200)
  const unchanged = kept.body.value.accountsYaml
  assert.match(unchanged, /imap\.old\.example/, 'the endpoints that drive the connection survive an unrelated save')
  assert.match(unchanged, /smtp\.old\.example/)
  const keptParsed = parseAccountsYaml(unchanged)
  assert.equal(keptParsed.map.work.provider, 'qq')
  assert.equal(keptParsed.map.work.password, 'pw', 'preserving endpoints must not cost the stored secret')
  assert.equal(keptParsed.map.work.imap.socketTimeoutMs, 9000, 'advanced keys ride along')
  const keptResolved = resolveEmailSettings({ accountsYaml: unchanged })
  assert.equal(keptResolved.accounts.get('work').imap.host, 'imap.old.example')
  assert.equal(keptResolved.accounts.get('work').imap.port, 143)

  // Switching the provider is the one case where the stored endpoints are stale
  // by definition: they belong to the previous provider, so they are washed and
  // the new preset decides.
  const switched = await post({
    action: 'serializeAccounts',
    accountsYaml: unchanged,
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: '163', user: 'w@qq.com' }],
  })
  assert.equal(switched.status, 200)
  const washed = switched.body.value.accountsYaml
  assert.equal(/imap\.old\.example|smtp\.old\.example/.test(washed), false, 'a provider switch washes the previous provider\'s endpoints')
  const washedParsed = parseAccountsYaml(washed)
  assert.equal(washedParsed.map.work.password, 'pw', 'washing endpoints must not cost the stored secret')
  const washedResolved = resolveEmailSettings({ accountsYaml: washed })
  assert.equal(washedResolved.accounts.get('work').imap.host, 'imap.163.com')
  assert.equal(washedResolved.accounts.get('work').imap.port, 993)
})

test('snapshot: a custom preset fills the card and reports its label', async t => {
  const { get } = mount(t, {
    value: { accountsYaml: 'work: { provider: corp, user: w@corp.example, password: pw }\n', serverPresets: CORP_PRESETS },
  })
  const card = (await get()).body.value.accountsDetail.list.find(entry => entry.name === 'work')
  assert.equal(card.provider, 'corp')
  assert.equal(card.providerLabel, '公司邮箱', 'the preset label rides along for the dropdown')
  assert.equal(card.imap.host, 'imap.corp')
  assert.equal(card.imap.port, 143)
  assert.equal(card.smtp.host, 'smtp.corp')
})

test('snapshot: a built-in preset has no label, an unknown provider has neither endpoints nor label', async t => {
  const { get } = mount(t, {
    value: { accountsYaml: 'work: { provider: qq, user: w@qq.com }\nweird: { provider: hotdog, user: w@x.y }\n', serverPresets: CORP_PRESETS },
  })
  const list = (await get()).body.value.accountsDetail.list
  const work = list.find(entry => entry.name === 'work')
  assert.equal(work.providerLabel, undefined, 'a built-in carries no label of its own')
  const weird = list.find(entry => entry.name === 'weird')
  assert.equal(weird.providerLabel, undefined)
  assert.equal(weird.imap.host, '', 'no preset to expand -> placeholder host')
  assert.equal(weird.imap.port, 993)
  assert.equal(weird.smtp.port, 465)
})

test('parseAccounts: a custom preset in the body expands the card', async t => {
  const { post } = mount(t)
  const { body } = await post({
    action: 'parseAccounts',
    serverPresets: CORP_PRESETS,
    value: { accountsYaml: 'work: { provider: corp, user: w@corp.example }\n' },
  })
  assert.equal(body.value.ok, true)
  const card = body.value.list[0]
  assert.equal(card.provider, 'corp')
  assert.equal(card.providerLabel, '公司邮箱')
  assert.equal(card.imap.host, 'imap.corp')
  assert.equal(card.smtp.host, 'smtp.corp')
})

test('a preset deleted after saving makes the error name the built-ins and the remaining presets', async t => {
  const { post } = mount(t)
  // Saved while "corp" existed; the preset is gone from the body that follows.
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: 'work: { provider: corp, user: w@corp.example, password: pw }\n',
    serverPresets: CORP_PRESETS,
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'corp', user: 'w@corp.example' }],
  })
  const out = body.value.accountsYaml
  assert.match(out, /provider: corp/)
  // Resolution with the preset list no longer carrying "corp" must still be plain
  // about what is wrong and what would be accepted.
  let message = ''
  try {
    resolveEmailSettings({ accountsYaml: out, serverPresets: 'home: { imap: { host: imap.home }, smtp: { host: smtp.home } }\n' })
  } catch (error) {
    message = error.message
  }
  assert.match(message, /账号 "work" 的 provider "corp" 未知/)
  for (const name of [...PROVIDER_NAMES, 'home']) assert.equal(message.includes(name), true, `must name ${name}`)
})

test('test action: a custom preset provider resolves (the stored table is consulted)', async t => {
  // Stub the dial: this test is about which host gets dialled, not the network.
  t.mock.method(EmailPool.prototype, 'withImap', async function (name) { return name })
  const mounted = mount(t, {
    value: { accountsYaml: 'work: { provider: corp, user: w@corp.example, password: pw }\n', serverPresets: CORP_PRESETS },
  })
  // The card's 「测试连接」 posts only accountsYaml; serverPresets is absent from
  // the body, so the route must fall back to the stored table.
  const { status, body } = await mounted.post({ action: 'test', account: 'work', value: { accountsYaml: 'work: { provider: corp, user: w@corp.example, password: pw }\n' } })
  assert.equal(status, 200, JSON.stringify(body))
  assert.equal(body.value.imapHost, 'imap.corp')
  assert.equal(body.value.imapPort, 143)
})

test('test action: a custom preset posted in the body resolves before it is saved', async t => {
  t.mock.method(EmailPool.prototype, 'withImap', async function (name) { return name })
  // Nothing stored yet: the user typed the preset and the card in one draft.
  const { post } = mount(t)
  const { status, body } = await post({
    action: 'test',
    account: 'work',
    value: { accountsYaml: 'work: { provider: corp, user: w@corp.example, password: pw }\n', serverPresets: CORP_PRESETS },
  })
  assert.equal(status, 200, JSON.stringify(body))
  assert.equal(body.value.imapHost, 'imap.corp')
  assert.equal(body.value.imapPort, 143)
})

test('save action: a value naming a custom preset in effect is accepted', async t => {
  const mounted = mount(t, { revision: 7, value: { serverPresets: CORP_PRESETS } })
  const value = { ...BASE, provider: 'corp', serverPresets: CORP_PRESETS }
  const { status, body } = await mounted.post({ action: 'save', expectedRevision: 7, value })
  assert.equal(status, 200, JSON.stringify(body))
  assert.equal(body.value.settings.revision, 8)

  // Without the preset table the same name is still an unknown provider.
  const strict = mount(t, { revision: 7 })
  const rejected = await strict.post({ action: 'save', expectedRevision: 7, value: { ...BASE, provider: 'corp' } })
  assert.equal(rejected.status, 400)
  assert.match(rejected.body.error.message, /未知的邮箱服务商 "corp"/)
})

test('a provider-less custom-server account keeps its hand-written endpoints on save', async t => {
  const { post } = mount(t)
  // 「自定义服务器」 is a supported shape, not a degenerate one: the unknown
  // provider error in src/config.ts tells users to「省略 provider 直接填
  // imap.host 与 smtp.host」. Its endpoints live only in the YAML, so washing
  // them would break the account the first time the user saved the panel —
  // provider is unchanged (absent before and after), so nothing is stale here.
  const source = 'work: { user: w@corp.example, password: pw, imap: { host: imap.corp, port: 143 }, smtp: { host: smtp.corp } }\n'
  const { status, body } = await post({
    action: 'serializeAccounts',
    accountsYaml: source,
    defaultAccount: 'work',
    accounts: [{
      name: 'work',
      provider: '',
      user: 'w@corp.example',
      imap: { host: 'imap.corp', port: 143 },
      smtp: { host: 'smtp.corp' },
    }],
  })
  assert.equal(status, 200)
  const out = body.value.accountsYaml
  assert.match(out, /imap\.corp/, 'the hand-written IMAP host survives')
  assert.match(out, /smtp\.corp/, 'the hand-written SMTP host survives')
  const parsed = parseAccountsYaml(out)
  assert.equal(parsed.map.work.user, 'w@corp.example')
  assert.equal(parsed.map.work.password, 'pw')
  assert.equal(parsed.map.work.provider, undefined, 'still no provider key: the account stays custom')
  const resolved = resolveEmailSettings({ accountsYaml: out })
  assert.equal(resolved.accounts.get('work').imap.host, 'imap.corp', 'and it still resolves and connects')
  assert.equal(resolved.accounts.get('work').imap.port, 143)
})

// --- OAuth2: the frozen web action contract ----------------------------------
//
// The settings page drives the device-code login through two actions and reads
// the login state off the account card. The shapes below are the contract the
// front end is written against, so they are pinned here rather than left to the
// implementation: url/code/interval/expires_in for the login, and the flat
// { ok, status } / { ok:false, message } pair for both actions.

const OAUTH_HOME = mkdtempSync(join(tmpdir(), 'dsh-email-web-oauth2-'))
process.env.DSH_HOME = OAUTH_HOME

// An invented registration id. The plugin ships no built-in client id — a
// third-party registration must not travel to everyone who installs it — so an
// OAuth2 account fixture has to bring its own.
const FIXTURE_CLIENT_ID = '00000000-0000-4000-8000-000000000000'
const OUTLOOK_YAML = `work: { provider: outlook, user: w@outlook.com, clientId: ${FIXTURE_CLIENT_ID} }\n`
const OAUTH_DEVICE_OK = {
  device_code: 'dev-1',
  user_code: 'WXYZ-1234',
  verification_uri: 'https://microsoft.com/devicelogin',
  expires_in: 900,
  interval: 5,
}

function oauthFetch(t, handler) {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), params: Object.fromEntries(new URLSearchParams(String(init?.body ?? ''))) })
    return await handler(calls[calls.length - 1])
  })
  return calls
}

function oauthJson(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
}

function storeToken(name, entry) {
  const file = oauth2TokenFile()
  assert.equal(file.startsWith(OAUTH_HOME), true, 'the suite must only write inside its temp DSH_HOME')
  writeTokenStore({
    version: 1,
    accounts: {
      ...readTokenStore().accounts,
      [name]: {
        // The account fixtures log in through FIXTURE_CLIENT_ID, and a token is
        // bound to the application that minted it: a different id here would
        // (correctly) read as「换了应用，请重新登录」and mask what these cases assert.
        user: 'w@outlook.com', clientId: FIXTURE_CLIENT_ID, refreshToken: 'r', accessToken: 'a',
        expiresAt: Date.now() + 3600_000, ...entry,
      },
    },
  })
}

function clearTokens() {
  writeTokenStore({ version: 1, accounts: {} })
}

test.after(() => rmSync(OAUTH_HOME, { recursive: true, force: true }))

test('oauthLogin: an account that is already logged in answers already', async t => {
  clearTokens()
  storeToken('work')
  const calls = oauthFetch(t, () => oauthJson(OAUTH_DEVICE_OK))
  const { post } = mount(t, { value: { accountsYaml: OUTLOOK_YAML } })
  const { status, body } = await post({ action: 'oauthLogin', account: 'work' })
  assert.equal(status, 200)
  assert.deepEqual(body, { ok: true, status: 'already' })
  assert.equal(calls.length, 0, 'a logged-in account needs no new device code')
})

test('oauthLogin: an account with no token starts the device flow with the frozen field names', async t => {
  clearTokens()
  const calls = oauthFetch(t, () => oauthJson(OAUTH_DEVICE_OK))
  const { post } = mount(t, { value: { accountsYaml: OUTLOOK_YAML } })
  const { status, body } = await post({ action: 'oauthLogin', account: 'work' })
  assert.equal(status, 200)
  assert.deepEqual(body, {
    ok: true,
    status: 'pending',
    url: 'https://microsoft.com/devicelogin',
    code: 'WXYZ-1234',
    interval: 5,
    expires_in: 900,
  })
  assert.equal(calls[0].url, 'https://login.microsoftonline.com/common/oauth2/v2.0/devicecode')
  assert.match(calls[0].params.scope, /IMAP\.AccessAsUser\.All/)
})

test('oauthLogin: a failure is a flat { ok:false, message }, never an HTTP error', async t => {
  clearTokens()
  oauthFetch(t, () => oauthJson({
    error: 'unauthorized_client',
    error_description: 'AADSTS7000218: client_assertion required',
    error_codes: [7000218],
  }, 400))
  const { post } = mount(t, { value: { accountsYaml: OUTLOOK_YAML } })
  const { status, body } = await post({ action: 'oauthLogin', account: 'work' })
  assert.equal(status, 200, 'the page reads the message off the body, so this must not be an HTTP failure')
  assert.equal(body.ok, false)
  assert.match(body.message, /允许公共客户端流/)
  assert.equal(body.status, undefined, 'there is no state to describe a login that never started')
})

test('oauthLogin/oauthPoll: an unknown, missing or non-OAuth account is refused with a message', async t => {
  clearTokens()
  const yaml = OUTLOOK_YAML + 'home: { provider: qq, user: h@qq.com, password: p }\ndefaultAccount: work\n'
  const { post } = mount(t, { value: { accountsYaml: yaml } })
  const unknown = await post({ action: 'oauthLogin', account: 'nope' })
  assert.equal(unknown.status, 200)
  assert.equal(unknown.body.ok, false)
  assert.match(unknown.body.message, /未知账号 "nope"/)
  assert.match(unknown.body.message, /work/, 'the message names what would have worked')

  const missing = await post({ action: 'oauthLogin', account: '   ' })
  assert.equal(missing.body.ok, false)
  assert.match(missing.body.message, /account 参数/)

  // A password account has no device code to hand out: reaching this means the
  // page is stale or the provider was just changed.
  const password = await post({ action: 'oauthLogin', account: 'home' })
  assert.equal(password.body.ok, false)
  assert.match(password.body.message, /不需要设备码登录/)
  assert.match(password.body.message, /outlook/)
})

test('oauthPoll: pending / ok / failure follow the frozen contract', async t => {
  clearTokens()
  // The two endpoints answer differently: the device-code call must keep
  // succeeding while the token call reports the poll's own state.
  let tokenAnswer = { error: 'authorization_pending', error_description: 'waiting' }
  let tokenStatus = 400
  oauthFetch(t, call => call.url.endsWith('/devicecode')
    ? oauthJson(OAUTH_DEVICE_OK)
    : oauthJson(tokenAnswer, tokenStatus))
  const { post } = mount(t, { value: { accountsYaml: OUTLOOK_YAML } })

  await post({ action: 'oauthLogin', account: 'work' })
  const pending = await post({ action: 'oauthPoll', account: 'work' })
  assert.equal(pending.status, 200)
  assert.deepEqual(pending.body, { ok: true, status: 'pending' })

  tokenAnswer = { token_type: 'Bearer', expires_in: 3600, access_token: 'access-9', refresh_token: 'refresh-9' }
  tokenStatus = 200
  const done = await post({ action: 'oauthPoll', account: 'work' })
  assert.deepEqual(done.body, { ok: true, status: 'ok', user: 'w@outlook.com' })
  assert.equal(readTokenStore().accounts.work.refreshToken, 'refresh-9', 'the token is persisted by the poll')

  // A dead device code is reported as a failure, and the flow is dropped.
  clearTokens()
  tokenAnswer = { error: 'expired_token', error_description: 'expired' }
  tokenStatus = 400
  await post({ action: 'oauthLogin', account: 'work' })
  const expired = await post({ action: 'oauthPoll', account: 'work' })
  assert.equal(expired.body.ok, false)
  assert.match(expired.body.message, /设备码超时/)
  const after = await post({ action: 'oauthPoll', account: 'work' })
  assert.equal(after.body.ok, false)
  assert.match(after.body.message, /尚未发起设备码登录/)
})

test('the card carries authKind/oauthState/oauthUser for an OAuth2 account', async t => {
  clearTokens()
  const yaml = OUTLOOK_YAML + 'home: { provider: qq, user: h@qq.com, password: p }\ndefaultAccount: work\n'
  const mounted = mount(t, { value: { accountsYaml: yaml } })

  const loggedOut = (await mounted.get()).body.value.accountsDetail.list.find(card => card.name === 'work')
  assert.equal(loggedOut.authKind, 'oauth2')
  assert.equal(loggedOut.oauthState, 'none')
  assert.equal('oauthUser' in loggedOut, false, 'no login means nothing to name')
  assert.equal(loggedOut.hasPassword, false, 'an OAuth2 account stores no password')
  const home = (await mounted.get()).body.value.accountsDetail.list.find(card => card.name === 'home')
  assert.equal(home.authKind, 'password')
  assert.equal(home.oauthState, 'none')

  storeToken('work')
  const loggedIn = (await mounted.get()).body.value.accountsDetail.list.find(card => card.name === 'work')
  assert.equal(loggedIn.oauthState, 'logged-in')
  assert.equal(loggedIn.oauthUser, 'w@outlook.com')
})

test('editing the address of a logged-in OAuth2 account makes the card say 未登录 again', async t => {
  clearTokens()
  storeToken('work')
  // The token belongs to w@outlook.com; the user has just retyped the address.
  const edited = mount(t, { value: { accountsYaml: `work: { provider: outlook, user: someone-else@outlook.com, clientId: ${FIXTURE_CLIENT_ID} }\n` } })
  const card = (await edited.get()).body.value.accountsDetail.list.find(entry => entry.name === 'work')
  assert.equal(card.oauthState, 'none', 'a token for another mailbox is not a login for this account')
  assert.equal('oauthUser' in card, false)

  // And the login button does not answer「already」for it either: the two
  // verdicts have to agree, or the card would be stuck on a broken login.
  const calls = oauthFetch(t, () => oauthJson(OAUTH_DEVICE_OK))
  const { status, body } = await edited.post({ action: 'oauthLogin', account: 'work' })
  assert.equal(status, 200)
  assert.equal(body.ok, true)
  assert.equal(body.status, 'pending', 'a stale token must not satisfy the login request')
  assert.equal(calls.length, 1)
})

test('a card carries the application id, keeps it when silent, and clears it on an empty string', async t => {
  clearTokens()
  const { post } = mount(t)

  // A value the user typed lands in the YAML, where resolution picks it up.
  const written = await post({
    action: 'serializeAccounts',
    accountsYaml: '',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'outlook', user: 'w@outlook.com', clientId: ' own-app ' }],
  })
  const out = written.body.value.accountsYaml
  assert.match(out, /clientId: own-app/, 'the id is written trimmed')
  assert.equal(resolveEmailSettings({ accountsYaml: out }).accounts.get('work').clientId, 'own-app')

  // A card that does not model the field says nothing about it: an unrelated
  // save must not log the account out of its application.
  const kept = await post({
    action: 'serializeAccounts',
    accountsYaml: out,
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'outlook', user: 'w@outlook.com' }],
  })
  assert.match(kept.body.value.accountsYaml, /clientId: own-app/, 'an omitted field keeps the stored id')

  // An explicit empty string is the user clearing it on purpose.
  const cleared = await post({
    action: 'serializeAccounts',
    accountsYaml: out,
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'outlook', user: 'w@outlook.com', clientId: '' }],
  })
  assert.equal(/clientId/.test(cleared.body.value.accountsYaml), false, 'an empty string clears the key')

  // The snapshot hands the value back for the editor to prefill: a public client
  // id travels in every device-code request, so unlike a password it is not a
  // secret, and without it the panel cannot show why a login will not start.
  const { get } = mount(t, { value: { accountsYaml: out } })
  const card = (await get()).body.value.accountsDetail.list[0]
  assert.equal(card.clientId, 'own-app')
})

test('deleting an account clears its stored OAuth2 token, and a refused save does not', async t => {
  const two = [
    `work: { provider: outlook, user: w@outlook.com, clientId: ${FIXTURE_CLIENT_ID} }`,
    `home: { provider: outlook, user: h@outlook.com, clientId: ${FIXTURE_CLIENT_ID} }`,
    'defaultAccount: work',
    '',
  ].join('\n')
  const one = [`work: { provider: outlook, user: w@outlook.com, clientId: ${FIXTURE_CLIENT_ID} }`, 'defaultAccount: work', ''].join('\n')

  // A conflict must not cost anybody their login: the write never committed.
  clearTokens()
  storeToken('work')
  storeToken('home')
  const conflicted = mount(t, { value: { accountsYaml: two } })
  const rejected = await conflicted.post({ action: 'save', expectedRevision: 999, value: { ...BASE, accountsYaml: one } })
  assert.equal(rejected.status, 409)
  assert.notEqual(readTokenStore().accounts.home, undefined, 'a refused save leaves every token alone')

  // A committed deletion does: the store is keyed by account name, so a leftover
  // refresh token would be inherited by whatever account next takes that name.
  clearTokens()
  storeToken('work')
  storeToken('home')
  const { post } = mount(t, { value: { accountsYaml: two } })
  const saved = await post({ action: 'save', expectedRevision: 3, value: { ...BASE, accountsYaml: one } })
  assert.equal(saved.status, 200, JSON.stringify(saved.body))
  const store = readTokenStore().accounts
  assert.equal(store.home, undefined, 'the deleted account leaves no credential behind')
  assert.notEqual(store.work, undefined, 'an account that survives keeps its login')
})

test('a card can pin the authentication scheme, and take the pin back off', async t => {
  clearTokens()
  const yaml = `work: { provider: outlook, user: w@outlook.com, password: fixture-pw, clientId: ${FIXTURE_CLIENT_ID} }\ndefaultAccount: work\n`
  const { post, get } = mount(t, { value: { accountsYaml: yaml } })

  // The snapshot reports what is pinned separately from the effective verdict:
  // without that split「自动」and「显式密码」look identical in the editor and the
  // escape hatch cannot be driven from the panel at all.
  const before = (await get()).body.value.accountsDetail.list[0]
  assert.equal(before.authKind, 'oauth2')
  assert.equal('authKindDeclared' in before, false, 'nothing is pinned yet')

  const card = extra => ({ name: 'work', provider: 'outlook', user: 'w@outlook.com', clientId: FIXTURE_CLIENT_ID, ...extra })
  const save = (source, accounts) => post({ action: 'serializeAccounts', accountsYaml: source, defaultAccount: 'work', accounts })

  const pinned = await save(yaml, [card({ authKind: 'password' })])
  const pinnedYaml = pinned.body.value.accountsYaml
  assert.match(pinnedYaml, /authKind: password/)
  assert.equal(resolveEmailSettings({ accountsYaml: pinnedYaml }).accounts.get('work').authKind, 'password',
    'the pin is what resolution honors, so a tenant still on basic auth keeps working')

  const declared = mount(t, { value: { accountsYaml: pinnedYaml } })
  const declaredCard = (await declared.get()).body.value.accountsDetail.list[0]
  assert.equal(declaredCard.authKindDeclared, 'password', 'the editor can render the pin back')
  assert.equal(declaredCard.authKind, 'password', 'and the verdict follows it')

  const auto = await save(pinnedYaml, [card({ authKind: '' })])
  assert.equal(/authKind/.test(auto.body.value.accountsYaml), false, 'an empty string takes the pin off, it does not store one')

  const kept = await save(pinnedYaml, [card({})])
  assert.match(kept.body.value.accountsYaml, /authKind: password/, 'a card that does not model the field keeps the stored pin')
})

test('parseAccounts reports the same OAuth2 projection as the snapshot', async t => {
  clearTokens()
  storeToken('work')
  const { post } = mount(t, { value: { accountsYaml: '' } })
  const { body } = await post({ action: 'parseAccounts', value: { accountsYaml: OUTLOOK_YAML } })
  assert.equal(body.value.ok, true)
  const card = body.value.list[0]
  assert.equal(card.authKind, 'oauth2')
  assert.equal(card.oauthState, 'logged-in')
  assert.equal(card.oauthUser, 'w@outlook.com')
})

test('a card honors an authKind the account pins, so the panel and the pool agree', async t => {
  clearTokens()
  const yaml = [
    'pinned: { provider: outlook, user: p@outlook.com, password: app-pw, authKind: password }',
    'derived: { provider: outlook, user: d@outlook.com }',
    'typo: { provider: outlook, user: t@outlook.com, authKind: magic }',
    'defaultAccount: pinned',
    '',
  ].join('\n')
  const { get } = mount(t, { value: { accountsYaml: yaml } })
  const list = (await get()).body.value.accountsDetail.list
  const byName = Object.fromEntries(list.map(card => [card.name, card]))

  // Without this the card would claim oauth2 for a mailbox the pool connects
  // with a password: it would render「未登录」and offer a device-code login for
  // an account that never needs one.
  assert.equal(byName.pinned.authKind, 'password')
  assert.equal(byName.pinned.oauthState, 'none')
  assert.equal('oauthUser' in byName.pinned, false)
  assert.equal(byName.pinned.hasPassword, true, 'the app password is still there to report')

  assert.equal(byName.derived.authKind, 'oauth2', 'an unpinned account still derives')

  // A value config resolution will report as invalid must not take the card
  // down: it falls back to the derivation and the error surfaces on resolve.
  assert.equal(byName.typo.authKind, 'oauth2')
})

test('test action: an OAuth2 account with no token says to log in and never dials', async t => {
  clearTokens()
  // No pool stub: reaching the network here would be the bug, so the assertion
  // is that the route refuses before a connection is even attempted.
  t.mock.method(EmailPool.prototype, 'withImap', async function () {
    assert.fail('an OAuth2 account with no token must not dial')
  })
  const calls = oauthFetch(t, () => oauthJson({ token_type: 'Bearer', expires_in: 3600, access_token: 'a', refresh_token: 'r' }))
  const { post } = mount(t, { value: { accountsYaml: OUTLOOK_YAML } })
  const { status, body } = await post({ action: 'test', account: 'work', value: { ...BASE, accountsYaml: OUTLOOK_YAML } })
  assert.equal(status, 400)
  assert.equal(body.ok, false)
  assert.match(body.error.message, /尚未登录/)
  assert.match(body.error.message, /设置页/)
  assert.equal(calls.length, 0, 'no token is a local fact, not a server round trip')
})

test('test action: an OAuth2 account with a valid token does dial, and a broken one does not', async t => {
  clearTokens()
  t.mock.method(EmailPool.prototype, 'withImap', async function (name) { return name })
  const calls = oauthFetch(t, () => oauthJson({ token_type: 'Bearer', expires_in: 3600, access_token: 'fresh', refresh_token: 'r2' }))

  // Fresh token: the dial proceeds and nothing is refreshed.
  storeToken('work')
  const ok = await mount(t, { value: { accountsYaml: OUTLOOK_YAML } })
    .post({ action: 'test', account: 'work', value: { ...BASE, accountsYaml: OUTLOOK_YAML } })
  assert.equal(ok.status, 200, JSON.stringify(ok.body))
  assert.equal(ok.body.value.imapHost, 'outlook.office365.com')
  assert.equal(calls.length, 0, 'a fresh token is not refreshed just to test a connection')

  // Stale token: the route mints a new one before dialling.
  storeToken('work', { expiresAt: Date.now() - 1000 })
  const refreshed = await mount(t, { value: { accountsYaml: OUTLOOK_YAML } })
    .post({ action: 'test', account: 'work', value: { ...BASE, accountsYaml: OUTLOOK_YAML } })
  assert.equal(refreshed.status, 200, JSON.stringify(refreshed.body))
  assert.equal(calls.length, 1)
  assert.equal(calls[0].params.grant_type, 'refresh_token')
})

test('the OAuth2 actions stay localhost-only like the rest of the route', async t => {
  clearTokens()
  const { call } = mount(t, { value: { accountsYaml: OUTLOOK_YAML } })
  const login = await call({ action: 'oauthLogin', account: 'work' }, { remoteAddress: '10.0.0.7' })
  assert.equal(login.status, 403)
  const poll = await call({ action: 'oauthPoll', account: 'work' }, { remoteAddress: '10.0.0.7' })
  assert.equal(poll.status, 403)
})

test('an OAuth2 account round-trips through the card editor without a password', async t => {
  clearTokens()
  const { post } = mount(t)
  // The page saves the card before it starts a login, so this is the exact
  // document the device flow is then run against.
  const written = await post({
    action: 'serializeAccounts',
    accountsYaml: '',
    defaultAccount: 'work',
    accounts: [{ name: 'work', provider: 'outlook', user: 'w@outlook.com', inboxFolder: 'INBOX' }],
  })
  const out = written.body.value.accountsYaml
  assert.match(out, /provider: outlook/)
  assert.equal(/password/.test(out), false, 'an OAuth2 card never writes a credential')
  const resolved = resolveEmailSettings({ accountsYaml: out })
  assert.equal(resolved.accounts.get('work').authKind, 'oauth2')
  assert.equal(resolved.accounts.get('work').user, 'w@outlook.com')
})

test('serializeAccounts: 别名三件套（senderName/authUser/authPassword）遵循三态契约', async t => {
  const { post } = mount(t)
  const source = 'work: { provider: qq, user: alias@qq.com, password: pw, senderName: 别名, authUser: login@qq.com, authPassword: realpw }\ndefaultAccount: work\n'

  // 卡片什么都没说 = 原样保留（包括没被提及的 password）
  const kept = await post({ action: 'serializeAccounts', accountsYaml: source, defaultAccount: 'work', accounts: [{ name: 'work', provider: 'qq', user: 'alias@qq.com' }] })
  assert.equal(kept.body.ok, true)
  const keptWork = parseAccountsYaml(kept.body.value.accountsYaml).map.work
  assert.equal(keptWork.senderName, '别名')
  assert.equal(keptWork.authUser, 'login@qq.com')
  assert.equal(keptWork.authPassword, 'realpw')
  assert.equal(keptWork.password, 'pw')

  // '' = 明确清除
  const cleared = await post({ action: 'serializeAccounts', accountsYaml: source, defaultAccount: 'work', accounts: [{ name: 'work', provider: 'qq', user: 'alias@qq.com', senderName: '', authUser: '', authPassword: '' }] })
  const clearedWork = parseAccountsYaml(cleared.body.value.accountsYaml).map.work
  assert.equal('senderName' in clearedWork, false)
  assert.equal('authUser' in clearedWork, false)
  assert.equal('authPassword' in clearedWork, false)

  // 非空 = 写入
  const written = await post({ action: 'serializeAccounts', accountsYaml: source, defaultAccount: 'work', accounts: [{ name: 'work', provider: 'qq', user: 'alias@qq.com', senderName: '新别名', authUser: 'other@qq.com', authPassword: 'newpw' }] })
  const writtenWork = parseAccountsYaml(written.body.value.accountsYaml).map.work
  assert.equal(writtenWork.senderName, '新别名')
  assert.equal(writtenWork.authUser, 'other@qq.com')
  assert.equal(writtenWork.authPassword, 'newpw')

  // 卡片投影：显示名/登录名回给编辑器，登录密码只给布尔
  const snapshot = await post({ action: 'parseAccounts', value: { accountsYaml: source } })
  const card = snapshot.body.value.list.find(entry => entry.name === 'work')
  assert.equal(card.senderName, '别名')
  assert.equal(card.authUser, 'login@qq.com')
  assert.equal(card.hasAuthPassword, true)
  assert.equal('authPassword' in card, false)
})

test('an OAuth2 card with no clientId of its own reports the built-in application', async t => {
  clearTokens()
  const yaml = [
    'work: { provider: outlook, user: w@outlook.com }',
    'mail: { provider: qq, user: m@qq.com, password: pw }',
    'defaultAccount: work',
    '',
  ].join('\n')
  const { get } = mount(t, { value: { accountsYaml: yaml } })
  const list = (await get()).body.value.accountsDetail.list
  const work = list.find(card => card.name === 'work')
  const mail = list.find(card => card.name === 'mail')
  assert.equal(work.clientId, undefined, 'the account names no application of its own')
  assert.equal(work.oauthDefaultClientId, OUTLOOK_OAUTH2_CLIENT_ID,
    'so the card reports the application that will be used: the consent screen names it')
  assert.equal(mail.oauthDefaultClientId, undefined, 'a password account has no application to report')

  // An id of its own is the application that gets used, so the built-in
  // fallback drops out instead of being offered as an alternative.
  const own = mount(t, { value: { accountsYaml: 'work: { provider: outlook, user: w@outlook.com, clientId: own-app }\n' } })
  const card = (await own.get()).body.value.accountsDetail.list[0]
  assert.equal(card.clientId, 'own-app')
  assert.equal(card.oauthDefaultClientId, undefined)
})

test('the settings editor names the application an empty clientId falls back to', () => {
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  // Leave-empty must not read as「cannot log in」: the editor previews the app
  // that will actually be used, and keeps the「register one」warning for builds
  // that carry no built-in application at all.
  assert.match(source, /card\.oauthDefaultClientId/, 'the built-in id comes from the card')
  assert.equal((source.match(/"oauth\.clientIdBuiltIn":/g) ?? []).length, 2, 'zh + en both state which app is used')
  assert.match(source, /builtInClientId !== "" \? builtInClientId/, 'the field previews the app in effect')
  assert.match(source, /builtInClientId === ""\s*\n\s*\? h\("div", \{ className: "dshe-alert warn" \}/,
    'the「no application」warning is only for builds without a built-in app')
})
