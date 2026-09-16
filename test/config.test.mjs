import test from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { resolveEmailSettings, resolveEmailConfig, PROVIDER_NAMES, EMAIL_PASSWORD_ENV, clampInt, defaultDownloadDir } from '../lib/index.js'
import { toEmailConfig } from '../lib/settings.js'

test('empty imap/smtp host in the settings page never shadows the provider preset (issues #3/#6)', () => {
  const value = {
    provider: 'qq', user: 'me@qq.com', password: 'p', inboxFolder: 'INBOX',
    sendApproval: true, maxBodyChars: 20000, downloadDir: '', accountsYaml: '',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 465, secure: true },
  }
  const cfg = toEmailConfig(value, { imap: value.imap, smtp: value.smtp })
  assert.equal(cfg.imap.host, undefined, 'empty host must not be projected')
  assert.equal(cfg.smtp.host, undefined, 'empty host must not be projected')
  assert.equal(cfg.imap.port, 993)
  const merged = resolveEmailSettings({ provider: 'qq', user: 'me@qq.com', password: 'p', ...cfg })
  assert.equal(merged.accounts.get('default').imap.host, 'imap.qq.com')
  assert.equal(merged.accounts.get('default').smtp.host, 'smtp.qq.com')
})

test('single-account shorthand resolves as account "default"', () => {
  const s = resolveEmailSettings({ provider: 'qq', user: 'me@qq.com', password: 'secret' })
  assert.deepEqual([...s.accounts.keys()], ['default'])
  assert.equal(s.defaultAccount, 'default')
  const cfg = s.accounts.get('default')
  assert.equal(cfg.imap.host, 'imap.qq.com')
  assert.equal(cfg.imap.port, 993)
  assert.equal(cfg.imap.secure, true)
  assert.equal(cfg.smtp.host, 'smtp.qq.com')
  assert.equal(cfg.smtp.port, 465)
  assert.equal(cfg.smtp.secure, true)
  assert.equal(cfg.inboxFolder, 'INBOX')
  assert.equal(s.sendApproval, true)
  assert.equal(s.maxBodyChars, 20000)
  assert.equal(s.maxAttachmentBytes, 20 * 1024 * 1024)
})

test('resolveEmailConfig wrapper still returns the default account', () => {
  const cfg = resolveEmailConfig({ provider: 'outlook', user: 'me@outlook.com', password: 'p' })
  assert.equal(cfg.smtp.port, 587)
  assert.equal(cfg.smtp.secure, false)
})

test('unknown provider fails loud with the supported list', () => {
  assert.throws(() => resolveEmailSettings({ provider: 'hotdog', user: 'x', password: 'y' }), /未知/)
  assert.ok(PROVIDER_NAMES.includes('qq'))
})

test('missing user / password / hosts each produce an actionable error', () => {
  assert.throws(() => resolveEmailSettings({}), /user（邮箱地址）未填写/)
  assert.throws(() => resolveEmailSettings({ provider: 'qq', user: 'a@b.c' }), /password 未填写/)
  assert.throws(() => resolveEmailSettings({ user: 'a@b.c', password: 'p' }), /imap.host 未填写/)
})

test('password falls back to the environment variable (single account only)', () => {
  const old = process.env[EMAIL_PASSWORD_ENV]
  process.env[EMAIL_PASSWORD_ENV] = 'env-secret'
  try {
    const s = resolveEmailSettings({ provider: 'qq', user: 'a@b.c' })
    assert.equal(s.accounts.get('default').password, 'env-secret')
  } finally {
    if (old === undefined) delete process.env[EMAIL_PASSWORD_ENV]
    else process.env[EMAIL_PASSWORD_ENV] = old
  }
})

test('blank settings passwords use the environment in both draft tests and saved settings', () => {
  const old = process.env[EMAIL_PASSWORD_ENV]
  process.env[EMAIL_PASSWORD_ENV] = 'env-secret'
  const draft = {
    provider: 'qq', user: 'me@qq.com', password: '', inboxFolder: 'INBOX',
    sendApproval: true, maxBodyChars: 20000, downloadDir: '', accountsYaml: '',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 465, secure: true },
  }
  try {
    for (const userSection of [null, draft]) {
      const config = { provider: 'qq', user: 'me@qq.com', password: 'old-row-secret', ...toEmailConfig(draft, userSection) }
      assert.equal(resolveEmailSettings(config).accounts.get('default').password, 'env-secret')
      assert.equal(config.password, '', 'the environment secret must not be copied into settings')
    }
    assert.equal(resolveEmailSettings({ provider: 'qq', user: 'me@qq.com', password: 'explicit-secret' }).accounts.get('default').password, 'explicit-secret')
    delete process.env[EMAIL_PASSWORD_ENV]
    assert.throws(() => resolveEmailSettings(toEmailConfig(draft, null)), /password 未填写/)
  } finally {
    if (old === undefined) delete process.env[EMAIL_PASSWORD_ENV]
    else process.env[EMAIL_PASSWORD_ENV] = old
  }
})

test('explicit host overrides beat the preset', () => {
  const s = resolveEmailSettings({
    provider: 'qq',
    user: 'a@b.c',
    password: 'p',
    imap: { host: 'imap.corp.example', port: 993, secure: true },
    smtp: { host: 'smtp.corp.example', port: 465, secure: true },
  })
  const cfg = s.accounts.get('default')
  assert.equal(cfg.imap.host, 'imap.corp.example')
  assert.equal(cfg.smtp.host, 'smtp.corp.example')
})

test('accounts map: per-account fields override the shared shorthand', () => {
  const s = resolveEmailSettings({
    provider: 'qq',
    imap: { socketTimeoutMs: 9000 },
    accounts: {
      work: { user: 'work@corp.example', password: 'w' },
      home: { user: 'home@qq.com', password: 'h', inboxFolder: 'MyInbox' },
    },
    defaultAccount: 'work',
  })
  assert.deepEqual([...s.accounts.keys()].sort(), ['home', 'work'])
  const work = s.accounts.get('work')
  assert.equal(work.user, 'work@corp.example')
  assert.equal(work.imap.host, 'imap.qq.com') // shared provider preset
  assert.equal(work.imap.socketTimeoutMs, 9000) // shared imap override
  const home = s.accounts.get('home')
  assert.equal(home.inboxFolder, 'MyInbox')
  assert.equal(s.defaultAccount, 'work')
})

test('multiple accounts without defaultAccount fail loud', () => {
  assert.throws(
    () => resolveEmailSettings({ accounts: { a: { user: 'a@x.y', password: '1', provider: 'qq' }, b: { user: 'b@x.y', password: '2', provider: 'qq' } } }),
    /请设置 defaultAccount/,
  )
})

test('defaultAccount must name an existing account', () => {
  assert.throws(
    () => resolveEmailSettings({ accounts: { a: { user: 'a@x.y', password: '1', provider: 'qq' } }, defaultAccount: 'nope' }),
    /不存在/,
  )
})

test('multi-account ignores the password env fallback', () => {
  const old = process.env[EMAIL_PASSWORD_ENV]
  process.env[EMAIL_PASSWORD_ENV] = 'env-secret'
  try {
    assert.throws(
      () => resolveEmailSettings({ provider: 'qq', accounts: { a: { user: 'a@x.y' } } }),
      /password 未填写/,
    )
    assert.throws(
      () => resolveEmailSettings({ provider: 'qq', password: 'shared-secret', accounts: { a: { user: 'a@x.y', password: '' } } }),
      /password 未填写/,
    )
  } finally {
    if (old === undefined) delete process.env[EMAIL_PASSWORD_ENV]
    else process.env[EMAIL_PASSWORD_ENV] = old
  }
})

test('downloadDir defaults under DSH_HOME', () => {
  const old = process.env.DSH_HOME
  process.env.DSH_HOME = 'C:/tmp/dshhome'
  try {
    const s = resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' })
    assert.equal(s.downloadDir, join('C:/tmp/dshhome', 'email-downloads'))
    assert.ok(defaultDownloadDir().endsWith('email-downloads'))
  } finally {
    if (old === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = old
  }
})

test('clampInt clamps into bounds and rejects garbage', () => {
  assert.equal(clampInt(7, 20, 1, 100), 7)
  assert.equal(clampInt(9999, 20, 1, 100), 100)
  assert.equal(clampInt(-3, 20, 1, 100), 1)
  assert.equal(clampInt('nope', 20, 1, 100), 20)
  assert.equal(clampInt(2.9, 20, 1, 100), 2)
})
test('toEmailConfig projects only user-set fields (untouched UI never shadows row or preset)', async () => {
  const { toEmailConfig, resolveEmailSettings } = await import('../lib/index.js')
  const defaults = {
    provider: 'outlook', user: 'me@outlook.com', password: 'p', inboxFolder: 'INBOX',
    sendApproval: true, maxBodyChars: 20000, downloadDir: '',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 465, secure: true },
  }
  // untouched smtp.port must NOT project: the outlook preset keeps 587
  const gated = toEmailConfig(defaults, { provider: 'outlook', user: 'me@outlook.com', password: 'p' })
  assert.equal(gated.smtp, undefined)
  const resolved = resolveEmailSettings(gated)
  assert.equal(resolved.accounts.get('default').smtp.port, 587)
  assert.equal(resolved.accounts.get('default').smtp.secure, false)

  // user-set port wins over the preset (the merged value already carries 25)
  const mergedWithPort = { ...defaults, smtp: { ...defaults.smtp, port: 25 } }
  const explicit = toEmailConfig(mergedWithPort, { provider: 'outlook', user: 'me@outlook.com', password: 'p', smtp: { port: 25 } })
  assert.equal(resolveEmailSettings(explicit).accounts.get('default').smtp.port, 25)

  // row custom inboxFolder survives an untouched UI; an explicit UI value wins
  const untouched = toEmailConfig(defaults, { provider: 'outlook', user: 'me@outlook.com', password: 'p' })
  assert.equal(untouched.inboxFolder, undefined)
  const merged = resolveEmailSettings({ inboxFolder: 'Archive', ...untouched })
  assert.equal(merged.accounts.get('default').inboxFolder, 'Archive')
  const reset = toEmailConfig(defaults, { inboxFolder: 'INBOX' })
  assert.equal(reset.inboxFolder, 'INBOX')
})

test('toEmailConfig with null projects the full draft', async () => {
  const { toEmailConfig } = await import('../lib/index.js')
  const draft = {
    provider: 'qq', user: 'me@qq.com', password: 'p', inboxFolder: 'MyBox',
    sendApproval: false, maxBodyChars: 5000, downloadDir: 'D:/dl',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 465, secure: true },
  }
  const out = toEmailConfig(draft, null)
  assert.equal(out.sendApproval, false)
  assert.equal(out.inboxFolder, 'MyBox')
  assert.equal(out.maxBodyChars, 5000)
  assert.equal(out.imap.port, 993)
})

test('messageMatchesQuery matches subject, from and body case-insensitively', async () => {
  const { messageMatchesQuery } = await import('../lib/index.js')
  assert.equal(messageMatchesQuery('账号登录验证', '', '', '验证'), true)
  assert.equal(messageMatchesQuery('', 'Alice <a@x.com>', '', 'alice'), true)
  assert.equal(messageMatchesQuery('', '', '详见附件说明', '附件'), true)
  assert.equal(messageMatchesQuery('nothing', 'nothing', 'nothing', '验证'), false)
})

test('body search fallback defaults and clamps', async () => {
  const { resolveEmailSettings } = await import('../lib/index.js')
  const s = resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' })
  assert.equal(s.bodySearchFallback, true)
  assert.equal(s.bodySearchLimit, 30)
  assert.equal(s.downloadDirExplicit, false)
  const t = resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p', bodySearchLimit: 5000, downloadDir: 'D:/dl' })
  assert.equal(t.bodySearchLimit, 200)
  assert.equal(t.downloadDirExplicit, true)
  assert.equal(t.downloadDir, 'D:/dl')
})
test('accountsYaml parses the map, extracts defaultAccount, and wins over accounts', async () => {
  const { resolveEmailSettings, parseAccountsYaml } = await import('../lib/index.js')
  const yaml = "work: { provider: qq, user: w@qq.com, password: p1 }\nhome: { provider: '163', user: h@163.com, password: p2 }\ndefaultAccount: work\n"
  const parsed = parseAccountsYaml(yaml)
  assert.deepEqual(Object.keys(parsed.map), ['work', 'home'])
  assert.equal(parsed.defaultAccount, 'work')
  const s = resolveEmailSettings({ accountsYaml: yaml, accounts: { legacy: { provider: 'qq', user: 'l@qq.com', password: 'x' } } })
  assert.deepEqual([...s.accounts.keys()].sort(), ['home', 'work'])
  assert.equal(s.defaultAccount, 'work')
})

test('accountsYaml rejects invalid YAML and non-object documents', async () => {
  const { resolveEmailSettings, parseAccountsYaml } = await import('../lib/index.js')
  assert.throws(() => parseAccountsYaml('work: [unclosed'), /不是合法的 YAML/)
  assert.throws(() => parseAccountsYaml('- a\n- b\n'), /对象映射/)
  assert.throws(() => resolveEmailSettings({ accountsYaml: 'x: { provider: qq, user: a@b.c, password: p }\ny: { provider: qq, user: b@c.d, password: p }' }), /请设置 defaultAccount/)
})

test('empty accountsYaml leaves the row accounts untouched', async () => {
  const { resolveEmailSettings } = await import('../lib/index.js')
  const s = resolveEmailSettings({ accountsYaml: '   ', accounts: { a: { provider: 'qq', user: 'a@b.c', password: 'p' } } })
  assert.deepEqual([...s.accounts.keys()], ['a'])
})

test('parseServerPresets: blank text means no presets', async () => {
  const { parseServerPresets } = await import('../lib/index.js')
  assert.deepEqual(parseServerPresets(''), {})
  assert.deepEqual(parseServerPresets('   \n'), {})
})

test('parseServerPresets: keeps host/port/secure/label and defaults the optional keys away', async () => {
  const { parseServerPresets } = await import('../lib/index.js')
  const presets = parseServerPresets([
    'corp:',
    '  label: 公司邮箱',
    '  imap:',
    '    host: imap.corp',
    '    port: 993',
    '    secure: true',
    '  smtp:',
    '    host: smtp.corp',
    '    port: 587',
    '    secure: false',
    'bare:',
    '  imap: { host: imap.bare }',
    '  smtp: { host: smtp.bare }',
    '',
  ].join('\n'))
  assert.deepEqual(presets.corp, {
    label: '公司邮箱',
    imap: { host: 'imap.corp', port: 993, secure: true },
    smtp: { host: 'smtp.corp', port: 587, secure: false },
  })
  assert.deepEqual(presets.bare, { imap: { host: 'imap.bare' }, smtp: { host: 'smtp.bare' } })
  assert.equal('port' in presets.bare.imap, false, 'unset port must stay unset, not default')
  assert.equal('secure' in presets.bare.smtp, false, 'unset secure must stay unset, not default')
})

test('parseServerPresets: a preset without both hosts names the offender', async () => {
  const { parseServerPresets } = await import('../lib/index.js')
  assert.throws(() => parseServerPresets('corp:\n  imap:\n    host: imap.corp\n'), /预设 "corp".*smtp/)
  assert.throws(() => parseServerPresets('corp:\n  imap:\n    host: imap.corp\n  smtp: {}\n'), /预设 "corp".*smtp\.host/)
  assert.throws(() => parseServerPresets('corp:\n  imap: { host: "" }\n  smtp: { host: smtp.corp }\n'), /预设 "corp".*imap\.host/)
  assert.throws(() => parseServerPresets('corp:\n  imap: { host: imap.corp, port: 993, secure: maybe }\n  smtp: { host: smtp.corp }\n'), /预设 "corp".*imap\.secure/)
})

test('parseServerPresets: non-object documents fail loud in Chinese', async () => {
  const { parseServerPresets } = await import('../lib/index.js')
  for (const text of ['- a\n- b\n', 'just a scalar', 'null', '42']) {
    assert.throws(() => parseServerPresets(text), /serverPresets 不是合法的对象映射/, `input: ${JSON.stringify(text)}`)
  }
  assert.throws(() => parseServerPresets('corp: [unclosed'), /不是合法的 YAML/)
  assert.throws(() => parseServerPresets('corp: 公司\n'), /必须是含 imap 与 smtp 的对象/)
})

test('serializeAccountsYaml: no accounts serializes to "", never "{}"', async () => {
  const { serializeAccountsYaml, resolveEmailSettings } = await import('../lib/index.js')
  assert.equal(serializeAccountsYaml({}), '')
  assert.equal(serializeAccountsYaml({ defaultAccount: 'work' }), '')
  // '' must leave the row accounts authoritative; '{}' parses to an empty map
  // and then fails resolution with a nonsense "multiple accounts ()" error.
  const s = resolveEmailSettings({ accountsYaml: serializeAccountsYaml({}), accounts: { a: { provider: 'qq', user: 'a@b.c', password: 'p' } } })
  assert.deepEqual([...s.accounts.keys()], ['a'])
  assert.throws(() => resolveEmailSettings({ accountsYaml: '{}' }), /配置了多个账号/)
})

test('serializeAccountsYaml: an account that only inherits the shared shorthand survives', async () => {
  const { serializeAccountsYaml, resolveEmailSettings } = await import('../lib/index.js')
  // `work: {}` is legitimate — it inherits the top-level shorthand — so the
  // serializer must not silently delete it (losing an account is worse than
  // writing back a broken one).
  const text = serializeAccountsYaml({ work: {} }, 'work')
  assert.match(text, /^work: \{\}$/m)
  const s = resolveEmailSettings({ provider: 'qq', user: 'shared@qq.com', password: 'p', accountsYaml: text })
  assert.equal(s.accounts.get('work').user, 'shared@qq.com')
  assert.equal(s.defaultAccount, 'work')
})

test('serializeAccountsYaml: round-trips an account and omits an empty provider', async () => {
  const { serializeAccountsYaml, parseAccountsYaml } = await import('../lib/index.js')
  const text = serializeAccountsYaml({ work: { provider: '', user: 'a@b.c', password: 'p' } })
  assert.equal(text.includes('provider'), false, 'provider "" would resolve as 「provider "" 未知」')
  const parsed = parseAccountsYaml(text)
  assert.deepEqual(Object.keys(parsed.map), ['work'])
  assert.equal(parsed.map.work.user, 'a@b.c')
  assert.equal(parsed.map.work.password, 'p')
  assert.equal('provider' in parsed.map.work, false)
})

test('serializeAccountsYaml: writes defaultAccount and quotes a numeric password', async () => {
  const { serializeAccountsYaml } = await import('../lib/index.js')
  const text = serializeAccountsYaml({ work: { user: 'a@b.c', password: 123456 } }, 'work')
  assert.match(text, /^defaultAccount: work$/m)
  assert.equal(text.includes('password: "123456"'), true, 'YAML would read a bare 123456 back as a number')
  // The chosen default wins over whatever the raw mapping carried.
  assert.match(serializeAccountsYaml({ work: { user: 'a@b.c' }, defaultAccount: 'old' }, 'work'), /^defaultAccount: work$/m)
  assert.match(serializeAccountsYaml({ work: { user: 'a@b.c' }, defaultAccount: 'old' }), /^defaultAccount: old$/m)
})

test('serializeAccountsYaml: output resolves back to the same accounts', async () => {
  const { serializeAccountsYaml, resolveEmailSettings } = await import('../lib/index.js')
  const raw = {
    work: { provider: 'qq', user: 'w@qq.com', password: 'p1', imap: { host: 'imap.corp', port: 143, secure: false } },
    home: { provider: '163', user: 'h@163.com', password: 'p2', inboxFolder: 'Archive' },
  }
  const text = serializeAccountsYaml(raw, 'home')
  const s = resolveEmailSettings({ accountsYaml: text })
  assert.deepEqual([...s.accounts.keys()].sort(), ['home', 'work'])
  assert.equal(s.defaultAccount, 'home')
  assert.equal(s.accounts.get('work').imap.host, 'imap.corp')
  assert.equal(s.accounts.get('work').imap.port, 143)
  assert.equal(s.accounts.get('work').imap.secure, false)
  assert.equal(s.accounts.get('home').inboxFolder, 'Archive')
  assert.equal(s.accounts.get('home').password, 'p2')
})

test('serverPresets never reaches EmailConfig (saving one must not drop live connections)', async () => {
  const { toEmailConfig, resolveEmailSettings } = await import('../lib/index.js')
  const value = {
    provider: 'qq', user: 'me@qq.com', password: 'p', inboxFolder: 'INBOX',
    sendApproval: true, maxBodyChars: 20000, downloadDir: '', accountsYaml: '',
    serverPresets: 'corp:\n  imap: { host: imap.corp }\n  smtp: { host: smtp.corp }\n',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 465, secure: true },
  }
  const out = toEmailConfig(value, { serverPresets: value.serverPresets })
  assert.equal('serverPresets' in out, false, 'projecting it would enter the pool fingerprint')
  assert.equal('serverPresets' in toEmailConfig(value, null), false)

  // The real red line: adding presets must not change what resolution produces,
  // because runtime.fingerprintSettings() is computed from exactly that — a
  // changed fingerprint disposes the pool and drops every live IMAP session.
  const base = { provider: 'qq', user: 'me@qq.com', password: 'p' }
  const withPresets = resolveEmailSettings({ ...base, serverPresets: value.serverPresets })
  const without = resolveEmailSettings(base)
  assert.equal('serverPresets' in withPresets, false, 'must not appear on ResolvedEmailSettings')
  assert.deepEqual(withPresets, without, 'the pool fingerprint must be blind to serverPresets')
})

// --- serverPresets as a provider namespace ----------------------------------
//
// An account stores a provider id and nothing else; every endpoint comes from
// the preset table. The lookup order is built-in PROVIDER_PRESETS first, then
// the custom serverPresets — so `provider: corp` resolves as long as the preset
// exists, and a preset name that was deleted afterwards still fails loud.

const CORP_PRESETS = [
  'corp:',
  '  label: 公司邮箱',
  '  imap: { host: imap.corp, port: 143, secure: false }',
  '  smtp: { host: smtp.corp, port: 587, secure: false }',
  '',
].join('\n')

test('serverPresets: a custom preset name resolves as a provider, endpoints included', async () => {
  const { resolveEmailSettings } = await import('../lib/index.js')
  const s = resolveEmailSettings({
    serverPresets: CORP_PRESETS,
    accountsYaml: 'work: { provider: corp, user: w@corp.example, password: pw }\n',
  })
  const work = s.accounts.get('work')
  assert.equal(work.imap.host, 'imap.corp')
  assert.equal(work.imap.port, 143)
  assert.equal(work.imap.secure, false)
  assert.equal(work.smtp.host, 'smtp.corp')
  assert.equal(work.smtp.port, 587)
  assert.equal(work.smtp.secure, false)
  assert.equal(work.user, 'w@corp.example')
  assert.equal(work.password, 'pw')
})

test('serverPresets: the shared shorthand can name a custom preset too', async () => {
  const { resolveEmailSettings } = await import('../lib/index.js')
  const s = resolveEmailSettings({ serverPresets: CORP_PRESETS, provider: 'corp', user: 'me@corp.example', password: 'p' })
  assert.equal(s.accounts.get('default').imap.host, 'imap.corp')
  assert.equal(s.accounts.get('default').smtp.host, 'smtp.corp')
})

test('serverPresets: an explicit account endpoint still beats the custom preset', async () => {
  const { resolveEmailSettings } = await import('../lib/index.js')
  const s = resolveEmailSettings({
    serverPresets: CORP_PRESETS,
    accountsYaml: 'work: { provider: corp, user: w@corp.example, password: pw, imap: { host: imap.override, port: 993, secure: true } }\n',
  })
  assert.equal(s.accounts.get('work').imap.host, 'imap.override', 'the account still wins over the preset')
  assert.equal(s.accounts.get('work').imap.port, 993)
  assert.equal(s.accounts.get('work').smtp.host, 'smtp.corp', 'the untouched endpoint still comes from the preset')
})

test('serverPresets: a broken preset list degrades to "no custom presets" without breaking a usable account', async () => {
  const { resolveEmailSettings } = await import('../lib/index.js')
  const broken = 'corp: [unclosed'
  // A built-in account is untouched: a broken preset text must never take the
  // whole resolution down with it.
  const ok = resolveEmailSettings({ serverPresets: broken, provider: 'qq', user: 'a@qq.com', password: 'p' })
  assert.equal(ok.accounts.get('default').imap.host, 'imap.qq.com')
  // The account-level reference still fails loud — the preset silently missing
  // would only resurface as a baffling "imap.host 未填写".
  assert.throws(
    () => resolveEmailSettings({ serverPresets: broken, provider: 'corp', user: 'a@b.c', password: 'p' }),
    /账号 "default" 的 provider "corp" 未知/,
  )
})

test('an unknown provider lists the 8 built-ins plus the custom preset names that do exist', async () => {
  const { resolveEmailSettings } = await import('../lib/index.js')
  const presets = 'corp: { imap: { host: imap.corp }, smtp: { host: smtp.corp } }\nhome: { imap: { host: imap.home }, smtp: { host: smtp.home } }\n'
  let message = ''
  try {
    resolveEmailSettings({ serverPresets: presets, provider: 'nope', user: 'a@b.c', password: 'p' })
  } catch (error) {
    message = error.message
  }
  assert.match(message, /provider "nope" 未知/)
  for (const name of [...PROVIDER_NAMES, 'corp', 'home']) {
    assert.equal(message.includes(name), true, `the error must name ${name}`)
  }
  // Inherited Object members are not preset names.
  let inherited = ''
  try {
    resolveEmailSettings({ provider: 'constructor', user: 'a@b.c', password: 'p' })
  } catch (error) {
    inherited = error.message
  }
  assert.match(inherited, /provider "constructor" 未知/)
})

test('serverPresets: editing an unreferenced preset never changes resolved settings', async () => {
  const { resolveEmailSettings } = await import('../lib/index.js')
  const base = { provider: 'qq', user: 'me@qq.com', password: 'p' }
  const first = resolveEmailSettings({ ...base, serverPresets: CORP_PRESETS })
  const second = resolveEmailSettings({ ...base, serverPresets: 'corp:\n  imap: { host: imap.moved }\n  smtp: { host: smtp.moved }\n' })
  assert.equal('serverPresets' in first, false, 'must not appear on ResolvedEmailSettings')
  assert.deepEqual(first, second, 'the pool fingerprint must stay blind to an unreferenced preset')
})

test('serverPresets: a preset may be bare — its endpoints are copied verbatim', async () => {
  const { resolveEmailSettings } = await import('../lib/index.js')
  const s = resolveEmailSettings({
    serverPresets: 'bare: { imap: { host: imap.bare }, smtp: { host: smtp.bare } }\n',
    provider: 'bare',
    user: 'a@bare.example',
    password: 'p',
  })
  const bare = s.accounts.get('default')
  assert.equal(bare.imap.host, 'imap.bare')
  assert.equal(bare.imap.port, undefined, 'an omitted port stays omitted — the preset is copied, not guessed')
  assert.equal(bare.smtp.host, 'smtp.bare')
})

