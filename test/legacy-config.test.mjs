import test from 'node:test'
import assert from 'node:assert/strict'
import net from 'node:net'
import { EmailPool, resolveEmailSettings } from '../lib/index.js'

/**
 * The v0.1 single-account shape carries only user/password/imap/smtp. The
 * send-as alias fields must stay optional: with none of them set, the login and
 * the From header both come from `user`.
 */
const legacyConfig = {
  user: 'legacy@fake.test',
  password: 'legacy-secret',
  imap: { host: '127.0.0.1', port: 1, secure: false },
  smtp: { host: '127.0.0.1', port: 1, secure: false },
  sendApproval: false,
}

function startSmtpServer() {
  const seen = { auth: [], from: null, data: '' }
  const server = net.createServer(socket => {
    socket.setEncoding('utf8')
    socket.write('220 local.test ESMTP legacy\r\n')
    let inData = false
    let buffer = ''
    socket.on('data', chunk => {
      buffer += chunk
      let index
      while ((index = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, index)
        buffer = buffer.slice(index + 2)
        if (inData) {
          if (line === '.') { inData = false; socket.write('250 2.0.0 queued\r\n'); continue }
          seen.data += line + '\n'
          continue
        }
        const upper = line.toUpperCase()
        if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
          socket.write('250-local.test\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n')
        } else if (upper.startsWith('AUTH PLAIN')) {
          const decoded = Buffer.from(line.split(/\s+/)[2] ?? '', 'base64').toString('utf8').split('\0')
          seen.auth.push({ user: decoded[1], pass: decoded[2] })
          socket.write('235 2.7.0 accepted\r\n')
        } else if (upper.startsWith('MAIL FROM')) { seen.from = line; socket.write('250 2.1.0 ok\r\n') }
        else if (upper.startsWith('RCPT TO')) { socket.write('250 2.1.5 ok\r\n') }
        else if (upper === 'DATA') { inData = true; socket.write('354 end with .\r\n') }
        else if (upper === 'QUIT') { socket.write('221 2.0.0 bye\r\n'); socket.end() }
        else { socket.write('250 2.0.0 ok\r\n') }
      }
    })
  })
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, seen, port: server.address().port })))
}

test('legacy user/password shape authenticates and sends as the same address', async () => {
  const account = resolveEmailSettings(legacyConfig).accounts.get('default')
  assert.equal(account.sender, 'legacy@fake.test')
  assert.equal(account.authUser, 'legacy@fake.test')
  assert.equal(account.authPassword, 'legacy-secret')

  const { server, seen, port } = await startSmtpServer()
  try {
    const settings = resolveEmailSettings({ ...legacyConfig, smtp: { host: '127.0.0.1', port, secure: false } })
    const pool = new EmailPool(settings)
    await pool.send(undefined, 'dest@fake.test', 'legacy shape', 'body')
    pool.dispose()
    assert.equal(seen.auth[0].user, 'legacy@fake.test')
    assert.equal(seen.auth[0].pass, 'legacy-secret')
    assert.equal(seen.from, 'MAIL FROM:<legacy@fake.test>')
    assert.match(seen.data, /^From: legacy@fake\.test$/m)
  } finally {
    server.close()
  }
})

test('an account without senderName never grows a display name', () => {
  const settings = resolveEmailSettings({
    user: 'plain@fake.test',
    password: 'secret',
    imap: { host: 'imap.fake.test', port: 993, secure: true },
    smtp: { host: 'smtp.fake.test', port: 465, secure: true },
  })
  assert.equal(settings.accounts.get('default').sender, 'plain@fake.test')
})
