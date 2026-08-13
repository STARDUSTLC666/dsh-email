import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEmailConfig, PROVIDER_NAMES, EMAIL_PASSWORD_ENV, clampInt } from '../lib/index.js'

test('qq preset fills imap/smtp hosts and SSL ports', () => {
  const cfg = resolveEmailConfig({ provider: 'qq', user: 'me@qq.com', password: 'secret' })
  assert.equal(cfg.imap.host, 'imap.qq.com')
  assert.equal(cfg.imap.port, 993)
  assert.equal(cfg.imap.secure, true)
  assert.equal(cfg.smtp.host, 'smtp.qq.com')
  assert.equal(cfg.smtp.port, 465)
  assert.equal(cfg.smtp.secure, true)
  assert.equal(cfg.inboxFolder, 'INBOX')
  assert.equal(cfg.sendApproval, true)
  assert.equal(cfg.maxBodyChars, 20000)
})

test('outlook preset uses STARTTLS smtp port', () => {
  const cfg = resolveEmailConfig({ provider: 'outlook', user: 'me@outlook.com', password: 'secret' })
  assert.equal(cfg.smtp.port, 587)
  assert.equal(cfg.smtp.secure, false)
})

test('unknown provider fails loud with the supported list', () => {
  assert.throws(() => resolveEmailConfig({ provider: 'hotdog', user: 'x', password: 'y' }), /未知的邮箱服务商/)
  assert.ok(PROVIDER_NAMES.includes('qq'))
})

test('missing user / password / hosts each produce an actionable error', () => {
  assert.throws(() => resolveEmailConfig({}), /user（邮箱地址）未填写/)
  assert.throws(() => resolveEmailConfig({ provider: 'qq', user: 'a@b.c' }), /password 未填写/)
  assert.throws(() => resolveEmailConfig({ user: 'a@b.c', password: 'p' }), /imap.host 未填写/)
})

test('password falls back to the environment variable', () => {
  const old = process.env[EMAIL_PASSWORD_ENV]
  process.env[EMAIL_PASSWORD_ENV] = 'env-secret'
  try {
    const cfg = resolveEmailConfig({ provider: 'qq', user: 'a@b.c' })
    assert.equal(cfg.password, 'env-secret')
  } finally {
    if (old === undefined) delete process.env[EMAIL_PASSWORD_ENV]
    else process.env[EMAIL_PASSWORD_ENV] = old
  }
})

test('explicit host overrides beat the preset', () => {
  const cfg = resolveEmailConfig({
    provider: 'qq',
    user: 'a@b.c',
    password: 'p',
    imap: { host: 'imap.corp.example', port: 993, secure: true },
    smtp: { host: 'smtp.corp.example', port: 465, secure: true },
  })
  assert.equal(cfg.imap.host, 'imap.corp.example')
  assert.equal(cfg.smtp.host, 'smtp.corp.example')
})

test('clampInt clamps into bounds and rejects garbage', () => {
  assert.equal(clampInt(7, 20, 1, 100), 7)
  assert.equal(clampInt(9999, 20, 1, 100), 100)
  assert.equal(clampInt(-3, 20, 1, 100), 1)
  assert.equal(clampInt('nope', 20, 1, 100), 20)
  assert.equal(clampInt(2.9, 20, 1, 100), 2)
})
