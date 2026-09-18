import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { runInNewContext } from 'node:vm'
import nodemailer from 'nodemailer'
import { redactCredentials, smtpAuthOf } from '../lib/mail-client.js'
import { EmailSettingsBackend } from '../lib/web.js'
import { parseAccountsYaml, resolveEmailSettings } from '../lib/config.js'
import { getFreshAccessToken, writeTokenStore } from '../lib/oauth2.js'

// All credentials and mail messages in this file are invented fixtures.
process.env.DSH_HOME = mkdtempSync(join(tmpdir(), 'email-review-'))

async function serialize(accountsYaml, accounts) {
  const backend = new EmailSettingsBackend({ settings: {} }, { get: () => ({}) }, {})
  const payload = { action: 'serializeAccounts', accountsYaml, accounts }
  let result
  await backend.handle({
    method: 'POST', socket: { remoteAddress: '127.0.0.1' },
    headers: {
      host: '127.0.0.1:3080',
      'content-type': 'application/json',
      origin: 'http://127.0.0.1:3080',
      'sec-fetch-site': 'same-origin',
    },
    async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(payload)) },
  }, { setHeader() {}, writeHead() {}, end(bytes) { result = JSON.parse(bytes) } })
  assert.equal(result.ok, true, JSON.stringify(result))
  return result.value.accountsYaml
}

test('OAuth SMTP delivers a fixture over the actual Nodemailer XOAUTH2 transport', async t => {
  let auth = '', message = ''
  const sockets = new Set()
  const server = createServer(socket => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
    socket.write('220 localhost fixture\r\n')
    let buffer = '', data = false
    socket.on('data', chunk => {
      buffer += chunk.toString()
      while (buffer.includes('\r\n')) {
        const end = buffer.indexOf('\r\n')
        const line = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        if (data) {
          if (line === '.') { data = false; socket.write('250 accepted\r\n') }
          else message += line + '\n'
        } else if (line.startsWith('EHLO')) socket.write('250-localhost\r\n250 AUTH XOAUTH2\r\n')
        else if (line.startsWith('AUTH XOAUTH2 ')) { auth = Buffer.from(line.slice(13), 'base64').toString(); socket.write('235 authenticated\r\n') }
        else if (line === 'DATA') { data = true; socket.write('354 send data\r\n') }
        else if (line === 'QUIT') socket.end('221 bye\r\n')
        else socket.write('250 ok\r\n')
      }
    })
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const transport = nodemailer.createTransport({
    pool: true, host: '127.0.0.1', port: server.address().port, secure: false,
    auth: smtpAuthOf({ authUser: 'fixture@outlook.com', authPassword: '', authKind: 'oauth2' }, 'fixture-access-token'),
    connectionTimeout: 3000, socketTimeout: 3000,
  })
  t.after(async () => { transport.close(); for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)) })
  await transport.sendMail({ from: 'fixture@outlook.com', to: 'receiver@example.invalid', subject: 'fixture only', text: 'offline SMTP payload' })
  assert.equal(auth, 'user=fixture@outlook.com\x01auth=Bearer fixture-access-token\x01\x01')
  assert.match(message, /offline SMTP payload/)
})

test('saving a legacy custom account retains its connection endpoints', async () => {
  const source = 'work: { user: me@example.invalid, password: fixture, imap: { host: imap.example.invalid, port: 1993, secure: true }, smtp: { host: smtp.example.invalid, port: 1465, secure: true } }\n'
  const output = await serialize(source, [{ name: 'work', user: 'me@example.invalid', inboxFolder: 'Archive' }])
  const account = resolveEmailSettings({ accountsYaml: output }).accounts.get('work')
  assert.equal(account.imap.host, 'imap.example.invalid')
  assert.equal(account.imap.port, 1993)
  assert.equal(account.smtp.port, 1465)
})

test('renaming an account preserves its password and advanced fields', async () => {
  const source = 'work: { provider: qq, user: fixture@qq.com, password: fixture-secret, imap: { socketTimeoutMs: 12345 } }\n'
  const output = await serialize(source, [{ name: 'renamed', originalName: 'work', provider: 'qq', user: 'fixture@qq.com' }])
  const { map } = parseAccountsYaml(output)
  assert.equal(map.work, undefined)
  assert.equal(map.renamed.password, 'fixture-secret')
  assert.equal(map.renamed.imap.socketTimeoutMs, 12345)
})

test('cached OAuth tokens from a different application require a new login', async () => {
  writeTokenStore({ version: 1, accounts: { work: { user: 'fixture@outlook.com', clientId: 'old-client', accessToken: 'old-access', refreshToken: 'old-refresh', expiresAt: Date.now() + 3600000 } } })
  await assert.rejects(() => getFreshAccessToken('work', { user: 'fixture@outlook.com', clientId: 'new-client' }), /登录|clientId/)
})

test('renaming a card to an existing name cannot silently replace the other account', () => {
  let client
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8').replace('return module.exports;', 'module.exports.renameDrafts = renameDrafts; return module.exports;')
  runInNewContext(source, { window: { __ModuleLoader__: { load({ factory }) { client = factory(() => ({})) } } } })
  const drafts = { work: { name: 'work', user: 'one@example.invalid' }, home: { name: 'home', user: 'two@example.invalid' } }
  assert.throws(() => client.renameDrafts(drafts, 'work', 'home'), /同名|重名|already has that name|exists/i)
})

test('an Outlook account pinned to authKind: password keeps its app password', () => {
  // Without the escape hatch every outlook account became an OAuth2 account and
  // lost its password on resolution: a hybrid or on-prem tenant that still
  // accepts basic auth, and any mailbox that worked before the derivation
  // existed, would have been told「尚未登录」by an upgrade alone.
  const pinned = resolveEmailSettings({
    accountsYaml: 'work: { provider: outlook, user: fixture@outlook.com, password: fixture-secret, authKind: password }\n',
  })
  const account = pinned.accounts.get('work')
  assert.equal(account.authKind, 'password')
  assert.equal(account.password, 'fixture-secret', 'the credential survives instead of being dropped')
  assert.equal(account.imap.host, 'outlook.office365.com', 'the endpoints still come from the provider')

  // Nothing pinned means nothing changed: the derivation is untouched.
  const derived = resolveEmailSettings({ accountsYaml: 'work: { provider: outlook, user: fixture@outlook.com }\n' })
  assert.equal(derived.accounts.get('work').authKind, 'oauth2')
  assert.equal(derived.accounts.get('work').password, '')
})

test('authKind can opt a custom host in, and an unknown value is reported', () => {
  const opted = resolveEmailSettings({
    accountsYaml: 'work: { user: fixture@corp.example, authKind: oauth2, imap: { host: mail.corp.example }, smtp: { host: smtp.corp.example } }\n',
  })
  assert.equal(opted.accounts.get('work').authKind, 'oauth2', 'a custom Exchange host can opt into the device-code flow')

  assert.throws(
    () => resolveEmailSettings({ accountsYaml: 'work: { provider: qq, user: w@qq.com, password: pw, authKind: magic }\n' }),
    /authKind 只能是 oauth2 或 password/,
    'a typo must name the allowed values rather than silently deriving',
  )
})

test('a server error quoted back to the user never carries the credential', () => {
  // Servers commonly echo the authentication string they refused; for XOAUTH2
  // that blob contains a live access token, and this text ends up in the panel,
  // in tool output, and in bug reports.
  const jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIwMDAwMDAwMi0wMDAwLTAwMDA4ZmYxIn0.SIGPARTSIGPARTSIGPART1'
  const blob = Buffer.from(`user=fixture@outlook.com\x01auth=Bearer ${jwt}\x01\x01`).toString('base64')
  const clean = redactCredentials(`Command failed; AUTHENTICATE XOAUTH2 ${blob}`)
  assert.equal(clean.includes(jwt), false, 'the access token must not survive')
  assert.equal(clean.includes(blob), false, 'nor the quoted authentication string')
  assert.match(clean, /已隐去/)
  assert.match(clean, /Command failed/, 'the diagnosable part is kept')

  // Ordinary text is left alone, or the message stops being useful.
  assert.equal(redactCredentials('Mailbox does not exist: INBOX'), 'Mailbox does not exist: INBOX')
  assert.equal(redactCredentials('LOGIN failed for outlook.office365.com'), 'LOGIN failed for outlook.office365.com')
})

test('the top-level authKind shorthand reaches every account, and an account may override it', () => {
  const settings = resolveEmailSettings({
    authKind: 'password',
    accountsYaml: [
      'work: { provider: outlook, user: a@outlook.com, password: pa }',
      'home: { provider: outlook, user: b@outlook.com, authKind: oauth2 }',
      'defaultAccount: work',
      '',
    ].join('\n'),
  })
  assert.equal(settings.accounts.get('work').authKind, 'password', 'inherited from the shorthand')
  assert.equal(settings.accounts.get('work').password, 'pa')
  assert.equal(settings.accounts.get('home').authKind, 'oauth2', 'the account-level value wins')
})
