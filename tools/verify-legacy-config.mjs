/**
 * Backward-compatibility check: the v0.1 single-account shape
 * (`user` + `password` + `imap` + `smtp`) must keep behaving exactly as before —
 * login as the configured address and send the bare address in the From header.
 *
 * Usage: node tools/verify-legacy-config.mjs [path/to/lib/index.js]
 */
import net from 'node:net'
import { simpleParser } from 'mailparser'

const library = process.argv[2] ?? '../lib/index.js'
const { EmailPool, resolveEmailSettings } = await import(library)

function startSmtpServer() {
  const seen = { auth: [], from: null, data: '' }
  const server = net.createServer(socket => {
    socket.setEncoding('utf8')
    socket.write('220 local.test ESMTP verify\r\n')
    let mode = 'command'
    let buffer = ''
    socket.on('data', chunk => {
      buffer += chunk
      let index
      while ((index = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, index)
        buffer = buffer.slice(index + 2)
        if (mode === 'data') {
          if (line === '.') { mode = 'command'; socket.write('250 2.0.0 queued\r\n'); continue }
          seen.data += line + '\n'
          continue
        }
        const upper = line.toUpperCase()
        if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
          socket.write('250-local.test\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n')
        } else if (upper.startsWith('AUTH PLAIN')) {
          const payload = line.split(/\s+/)[2] ?? ''
          const decoded = Buffer.from(payload, 'base64').toString('utf8').split('\0')
          seen.auth.push({ user: decoded[1], pass: decoded[2] })
          socket.write('235 2.7.0 accepted\r\n')
        } else if (upper.startsWith('MAIL FROM')) { seen.from = line; socket.write('250 2.1.0 ok\r\n') }
        else if (upper.startsWith('RCPT TO')) { socket.write('250 2.1.5 ok\r\n') }
        else if (upper === 'DATA') { mode = 'data'; socket.write('354 end with .\r\n') }
        else if (upper === 'QUIT') { socket.write('221 2.0.0 bye\r\n'); socket.end() }
        else { socket.write('250 2.0.0 ok\r\n') }
      }
    })
  })
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, seen, port: server.address().port })))
}

const { server, seen, port } = await startSmtpServer()
try {
  // Exactly the documented v0.1 shape: no senderName, no authUser, no authPassword.
  const settings = resolveEmailSettings({
    user: 'legacy@fake.test',
    password: 'legacy-secret',
    imap: { host: '127.0.0.1', port: 1, secure: false },
    smtp: { host: '127.0.0.1', port, secure: false },
    sendApproval: false,
  })
  const account = settings.accounts.get(settings.defaultAccount)
  const pool = new EmailPool(settings)
  await pool.send(undefined, 'dest@fake.test', 'legacy shape probe', 'body')
  pool.dispose()
  const parsed = await simpleParser(seen.data)
  console.log(JSON.stringify({
    sender: account.sender,
    authUser: account.authUser,
    authPassword: account.authPassword,
    observedAuth: seen.auth[0],
    observedFrom: seen.from,
    decodedFromText: parsed.from?.text,
    decodedName: parsed.from?.value?.[0]?.name ?? '',
  }, null, 2))
} finally {
  server.close()
}
