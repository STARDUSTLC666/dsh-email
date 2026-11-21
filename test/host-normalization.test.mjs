import test from 'node:test'
import assert from 'node:assert/strict'
import { parseServerPresets, resolveEmailSettings } from '../lib/index.js'
import { mailHostProblem, splitMailHost } from '../lib/config.js'

const DEFAULT_LIMITS = { sendApproval: true, maxBodyChars: 20000 }

test('a pasted URL host is reduced to the hostname the socket dials', () => {
  const settings = resolveEmailSettings({
    ...DEFAULT_LIMITS,
    user: 'me@corp.example', password: 'fixture-only',
    imap: { host: 'https://mail.corp.example', port: 993, secure: true },
    smtp: { host: 'https://mail.corp.example', port: 465, secure: true },
  })
  const cfg = settings.accounts.get('default')
  assert.equal(cfg.imap.host, 'mail.corp.example')
  assert.equal(cfg.smtp.host, 'mail.corp.example')
  assert.equal(cfg.imap.port, 993)
  assert.equal(cfg.smtp.port, 465)
})

test('scheme, path, credentials and port suffix are stripped', () => {
  assert.deepEqual(splitMailHost('https://user:pass@mail.corp.example:1993/imap?x=1'), { host: 'mail.corp.example', port: 1993 })
  assert.deepEqual(splitMailHost('  imap.corp.example  '), { host: 'imap.corp.example' })
  assert.deepEqual(splitMailHost('//mail.corp.example'), { host: 'mail.corp.example' })
  assert.deepEqual(splitMailHost('::1'), { host: '::1' })
  assert.deepEqual(splitMailHost('2001:db8::1'), { host: '2001:db8::1' })
  assert.deepEqual(splitMailHost('[2001:db8::1]:993'), { host: '[2001:db8::1]', port: 993 })
  assert.deepEqual(splitMailHost(''), { host: '' })
})

test('a port embedded in the host is used only when the endpoint has none of its own', () => {
  const derived = resolveEmailSettings({
    ...DEFAULT_LIMITS,
    user: 'me@corp.example', password: 'fixture-only',
    imap: { host: 'https://mail.corp.example:1993' },
    smtp: { host: 'smtp.corp.example' },
  }).accounts.get('default')
  assert.equal(derived.imap.host, 'mail.corp.example')
  assert.equal(derived.imap.port, 1993)

  const explicit = resolveEmailSettings({
    ...DEFAULT_LIMITS,
    user: 'me@corp.example', password: 'fixture-only',
    imap: { host: 'https://mail.corp.example:1993', port: 143 },
    smtp: { host: 'smtp.corp.example' },
  }).accounts.get('default')
  assert.equal(explicit.imap.port, 143, 'the explicit port field wins')
})

test('an unusable host fails with an actionable account error, not a DNS failure', () => {
  assert.throws(() => resolveEmailSettings({
    ...DEFAULT_LIMITS,
    user: 'me@corp.example', password: 'fixture-only',
    imap: { host: 'imap corp.example' },
    smtp: { host: 'smtp.corp.example' },
  }), /imap\.host 不是有效主机名.*包含空格/)
  assert.equal(mailHostProblem('mail.corp.example'), undefined)
  assert.equal(mailHostProblem('::1'), undefined)
  assert.equal(mailHostProblem('2001:db8::1'), undefined)
  assert.equal(mailHostProblem('[2001:db8::1]'), undefined)
  assert.equal(mailHostProblem('[192.0.2.1]'), 'IPv6 地址无效')
  assert.equal(mailHostProblem('2001:db8::not-an-ip'), 'IPv6 地址无效')
  assert.equal(mailHostProblem('mail:993'), 'IPv6 地址无效')
})

test('valid bare and bracketed IPv6 literals resolve without changing their stored host', () => {
  for (const host of ['::1', '[::1]', '2001:db8::1', '[2001:db8::1]']) {
    const cfg = resolveEmailSettings({
      ...DEFAULT_LIMITS,
      user: 'me@corp.example', password: 'fixture-only',
      imap: { host, port: 993, secure: true },
      smtp: { host, port: 465, secure: true },
    }).accounts.get('default')
    assert.equal(cfg.imap.host, host)
    assert.equal(cfg.smtp.host, host)
  }
})

test('server presets are normalized when parsed, including an embedded port', () => {
  const presets = parseServerPresets([
    'corp:',
    '  imap: { host: "https://imap.corp.example:1993" }',
    '  smtp: { host: "smtp.corp.example" }',
  ].join('\n'))
  assert.deepEqual(presets.corp.imap, { host: 'imap.corp.example', port: 1993 })
  assert.deepEqual(presets.corp.smtp, { host: 'smtp.corp.example' })

  const settings = resolveEmailSettings({
    ...DEFAULT_LIMITS,
    provider: 'corp', user: 'me@corp.example', password: 'fixture-only',
    serverPresets: 'corp:\n  imap: { host: "https://imap.corp.example:1993" }\n  smtp: { host: "smtp.corp.example" }\n',
  })
  const cfg = settings.accounts.get('default')
  assert.equal(cfg.imap.host, 'imap.corp.example')
  assert.equal(cfg.imap.port, 1993)
  assert.equal(cfg.smtp.host, 'smtp.corp.example')
  assert.equal(cfg.smtp.port, 465, 'an omitted SMTP port keeps the documented default')
})

test('an Exchange host pasted as a URL still derives OAuth2 from the real hostname', () => {
  const cfg = resolveEmailSettings({
    ...DEFAULT_LIMITS,
    user: 'me@outlook.com',
    imap: { host: 'https://outlook.office365.com' },
    smtp: { host: 'smtp.office365.com' },
  }).accounts.get('default')
  assert.equal(cfg.imap.host, 'outlook.office365.com')
  assert.equal(cfg.authKind, 'oauth2')
})
