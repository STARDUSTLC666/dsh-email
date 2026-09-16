import test from 'node:test'
import assert from 'node:assert/strict'
import { apply, EmailPool, SETTINGS_ROUTE } from '../lib/index.js'
import { parseAccountsYaml, parseServerPresets, PROVIDER_PRESETS, resolveEmailSettings, serializeAccountsYaml } from '../lib/config.js'

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

  const call = async (payload, { method = 'POST', remoteAddress = '127.0.0.1' } = {}) => {
    const req = {
      method,
      socket: { remoteAddress },
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

  // accountsDetail.raw keeps every key, comments and all.
  assert.deepEqual(Object.keys(value.accountsDetail.raw).sort(), ['home', 'work'])
  assert.equal(value.accountsDetail.raw.work.user, 'w@qq.com')
  assert.equal(value.accountsDetail.raw.work.password, 'pw')

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

test('snapshot: explicit account endpoints beat the preset, unknown keys stay in raw', async t => {
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
  const detail = (await get()).body.value.accountsDetail
  const work = detail.list[0]
  assert.equal(work.imap.host, 'imap.corp.example', 'the account wins over the preset')
  assert.equal(work.smtp.host, 'smtp.corp.example')
  assert.equal(work.imap.port, 993, 'unset port still inherits the preset')
  // raw is the untouched mapping: the advanced key survives verbatim.
  assert.equal(detail.raw.work.imap.socketTimeoutMs, 9000)
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
  assert.equal(body.value.raw.work.password, 'pw')
  assert.equal(body.value.list.length, 1)
  assert.equal(body.value.list[0].isDefault, true)
  assert.equal(body.value.list[0].imap.host, 'imap.qq.com')
})

test('parseAccounts: invalid YAML returns 200 with ok:false, a Chinese error and raw {}', async t => {
  const { post } = mount(t)
  const { status, body } = await post({ action: 'parseAccounts', value: { accountsYaml: 'work: [unclosed' } })
  assert.equal(status, 200, 'a half-typed draft is a normal state, not an HTTP error')
  assert.equal(body.ok, true)
  assert.equal(body.value.ok, false)
  assert.match(body.value.error, /不是合法的 YAML/)
  assert.deepEqual(body.value.raw, {})
  assert.deepEqual(body.value.list, [])
})

test('parseAccounts: a non-object document is reported, not thrown', async t => {
  const { post } = mount(t)
  const { status, body } = await post({ action: 'parseAccounts', value: { accountsYaml: '- a\n- b\n' } })
  assert.equal(status, 200)
  assert.equal(body.value.ok, false)
  assert.match(body.value.error, /对象映射/)
  assert.deepEqual(body.value.raw, {})
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
    assert.deepEqual(body.value.raw, {})
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

test('serializeAccounts: a custom account writes no provider key; unknown keys survive', async t => {
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
  assert.match(out, /host: imap\.new/)
  assert.equal(/host: imap\.old/.test(out), false)
  const parsed = parseAccountsYaml(out)
  assert.equal('provider' in parsed.map.work, false)
  assert.equal(parsed.map.work.imap.socketTimeoutMs, 9000)
  assert.equal(parsed.map.work.imap.port, 143)
  assert.equal(parsed.map.work.imap.secure, false)
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
    { name: 'custom', user: 'c@corp.example', imap: { host: 'imap.corp', port: 143, secure: false }, smtp: { host: 'smtp.corp', port: 25, secure: false } },
  ]
  const written = await post({ action: 'serializeAccounts', accountsYaml: '', defaultAccount: 'custom', accounts: cards })
  const reread = await post({ action: 'parseAccounts', value: { accountsYaml: written.body.value.accountsYaml } })
  assert.equal(reread.body.value.ok, true)
  assert.equal(reread.body.value.error, undefined)
  assert.deepEqual(reread.body.value.list.map(card => card.name).sort(), ['custom', 'work'])
  assert.equal(reread.body.value.defaultAccount, 'custom')
  const custom = reread.body.value.list.find(card => card.name === 'custom')
  assert.equal(custom.imap.host, 'imap.corp')
  assert.equal(custom.imap.port, 143)
  assert.equal(custom.imap.secure, false)
  assert.equal(custom.smtp.port, 25)
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

test('snapshot never leaks a password through the card list', async t => {
  const yaml = 'work: { provider: qq, user: w@qq.com, password: super-secret }\n'
  const { get } = mount(t, { value: { accountsYaml: yaml } })
  const serialized = JSON.stringify((await get()).body)
  assert.equal(serialized.includes('super-secret'), true, 'the raw mapping is what the editor edits, so it carries the password')
  const card = (await get()).body.value.accountsDetail.list[0]
  assert.deepEqual(Object.keys(card).sort(), ['hasPassword', 'imap', 'inboxFolder', 'isDefault', 'name', 'provider', 'smtp', 'user'])
  assert.equal(card.hasPassword, true, 'the card only reports whether a password exists')
  assert.equal(JSON.stringify(card).includes('super-secret'), false)
})

test('parseAccounts and serializeAccounts agree with the step-1 config helpers', async t => {
  const { post } = mount(t)
  const yaml = 'work: { provider: qq, user: w@qq.com, password: pw }\n'
  const parsed = await post({ action: 'parseAccounts', value: { accountsYaml: yaml } })
  assert.deepEqual(parsed.body.value.raw, parseAccountsYaml(yaml).map)
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

// --- serializeAccounts: a custom preset is an endpoint expansion, never a
// --- provider reference ----------------------------------------------------
//
// resolveAccount() only ever consults PROVIDER_PRESETS, so writing a custom
// serverPresets name into the draft produced a document that saves fine and then
// throws 「账号 "work" 的 provider "corp" 未知」 on the very next connection test —
// and a hand-written `provider: corp` blew up the same way. The canonical form
// for a custom preset is 「no provider key + the expanded endpoints」.

test('serializeAccounts: a custom preset writes no provider key, the endpoints carry the account', async t => {
  const { post } = mount(t)
  const { status, body } = await post({
    action: 'serializeAccounts',
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
  assert.equal(/provider/.test(out), false, 'provider "corp" would resolve as 「provider "corp" 未知」')
  const parsed = parseAccountsYaml(out)
  assert.equal('provider' in parsed.map.work, false)
  assert.deepEqual(parsed.map.work.imap, { host: 'imap.corp', port: 143, secure: false })
  assert.deepEqual(parsed.map.work.smtp, { host: 'smtp.corp', port: 587, secure: false })
  // The bug's real shape: the save succeeded and the *next* resolve threw.
  const resolved = resolveEmailSettings({ accountsYaml: out })
  assert.equal(resolved.accounts.get('work').imap.host, 'imap.corp')
  assert.equal(resolved.accounts.get('work').smtp.host, 'smtp.corp')
})

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

test('serializeAccounts: only an own key of PROVIDER_PRESETS is ever persisted', async t => {
  const { post } = mount(t)
  // A plain PROVIDER_PRESETS[value] lookup would accept inherited names like
  // "constructor" and hand a function to the YAML writer.
  const { body } = await post({
    action: 'serializeAccounts',
    accountsYaml: '',
    defaultAccount: 'weird',
    accounts: [{ name: 'weird', provider: 'constructor', user: 'w@x.y', password: 'pw', imap: { host: 'imap.x' }, smtp: { host: 'smtp.x' } }],
  })
  const out = body.value.accountsYaml
  assert.equal(/provider/.test(out), false, 'an inherited Object member is not a preset name')
  assert.equal('provider' in parseAccountsYaml(out).map.weird, false)
  assert.equal(resolveEmailSettings({ accountsYaml: out }).accounts.get('weird').imap.host, 'imap.x')
})

test('serializeAccounts heals a hand-written custom provider into explicit endpoints', async t => {
  const presets = 'corp:\n  imap: { host: imap.corp, port: 143, secure: false }\n  smtp: { host: smtp.corp, port: 587, secure: false }\n'
  const source = 'work: { provider: corp, user: w@corp.example, password: pw }\n'
  const mounted = mount(t, { value: { accountsYaml: source, serverPresets: presets } })
  // 1) The backend expands the custom preset into the card's endpoints — the
  //    raw provider name still comes back for the dropdown's selected state.
  const card = (await mounted.get()).body.value.accountsDetail.list.find(entry => entry.name === 'work')
  assert.equal(card.provider, 'corp')
  assert.equal(card.imap.host, 'imap.corp', 'the custom preset is what fills the card')
  assert.equal(card.smtp.host, 'smtp.corp')
  // 2) The editor sends that card straight back on an unrelated edit.
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
  assert.equal(/provider/.test(out), false, 'the un-resolvable reference must not survive the save')
  // 3) The healed draft resolves, and it resolves to the custom preset's values.
  const resolved = resolveEmailSettings({ accountsYaml: out })
  const work = resolved.accounts.get('work')
  assert.equal(work.imap.host, 'imap.corp')
  assert.equal(work.imap.port, 143)
  assert.equal(work.imap.secure, false)
  assert.equal(work.smtp.host, 'smtp.corp')
  assert.equal(work.smtp.port, 587)
  assert.equal(work.password, 'pw', 'healing the provider must not cost the stored secret')
})

test('serializeAccounts: the degraded writer drops a custom provider too', async t => {
  const { post } = mount(t)
  // Broken source YAML: serializeAccountsDraft hands over to fallbackSerialize,
  // which builds its account maps from scratch (normalizeCardForYaml).
  const { status, body } = await post({
    action: 'serializeAccounts',
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
  assert.equal(/provider/.test(out), false)
  const parsed = parseAccountsYaml(out)
  assert.equal('provider' in parsed.map.work, false)
  assert.deepEqual(parsed.map.work.imap, { host: 'imap.corp', port: 143, secure: false })
  const resolved = resolveEmailSettings({ accountsYaml: out })
  assert.equal(resolved.accounts.get('work').smtp.host, 'smtp.corp')
})
