import test from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { resolveEmailSettings, resolveEmailConfig, PROVIDER_NAMES, EMAIL_PASSWORD_ENV, clampInt, defaultDownloadDir } from '../lib/index.js'

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