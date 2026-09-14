/**
 * Local-only verification for the send-as alias support (senderName / authUser /
 * authPassword). Starts a throwaway SMTP server on 127.0.0.1 so the outgoing
 * envelope can be inspected without touching a real mailbox, then prints what
 * the pool actually authenticated as and what From header it sent.
 *
 * Usage: node tools/verify-sender-identity.mjs
 */
import net from 'node:net'
import { simpleParser } from 'mailparser'
import { EmailPool, resolveEmailSettings } from '../lib/index.js'

function startSmtpServer() {
  const seen = { auth: [], from: null, rcpt: [], data: '', greeted: false }
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
          if (line === '.') {
            seen.data += '\n'
            mode = 'command'
            socket.write('250 2.0.0 queued\r\n')
            continue
          }
          seen.data += line + '\n'
          continue
        }
        const upper = line.toUpperCase()
        if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
          seen.greeted = true
          socket.write('250-local.test\r\n250-AUTH PLAIN LOGIN\r\n250-SIZE 10485760\r\n250 8BITMIME\r\n')
        } else if (upper.startsWith('AUTH PLAIN')) {
          const payload = line.split(/\s+/)[2] ?? ''
          const decoded = Buffer.from(payload, 'base64').toString('utf8').split('\0')
          seen.auth.push({ mechanism: 'PLAIN', user: decoded[1], pass: decoded[2] })
          socket.write('235 2.7.0 accepted\r\n')
        } else if (upper.startsWith('MAIL FROM')) {
          seen.from = line
          socket.write('250 2.1.0 ok\r\n')
        } else if (upper.startsWith('RCPT TO')) {
          seen.rcpt.push(line)
          socket.write('250 2.1.5 ok\r\n')
        } else if (upper === 'DATA') {
          mode = 'data'
          socket.write('354 end with .\r\n')
        } else if (upper === 'QUIT') {
          socket.write('221 2.0.0 bye\r\n')
          socket.end()
        } else {
          socket.write('250 2.0.0 ok\r\n')
        }
      }
    })
  })
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve({ server, seen, port: server.address().port }))
  })
}

const { server, seen, port } = await startSmtpServer()
try {
  const settings = resolveEmailSettings({
    user: 'alias@fake.test',
    password: 'sender-secret',
    senderName: '鲸鱼小姐',
    authUser: 'owner@fake.test',
    authPassword: 'owner-secret',
    imap: { host: '127.0.0.1', port: 1, secure: false },
    smtp: { host: '127.0.0.1', port, secure: false },
    sendApproval: false,
  })
  const account = settings.accounts.get(settings.defaultAccount)
  const pool = new EmailPool(settings)
  const result = await pool.send(undefined, 'dest@fake.test', 'sender identity probe', 'body')
  pool.dispose()

  const fromHeader = /^From: (.*)$/m.exec(seen.data)?.[1] ?? '(missing)'
  // The raw header carries an RFC 2047 encoded-word for the CJK display name;
  // parse it the way a receiving client would before asserting on the text.
  const parsedFrom = await simpleParser(seen.data)
  const decodedFrom = parsedFrom.from?.text ?? '(unparsed)'
  const decodedName = parsedFrom.from?.value?.[0]?.name ?? ''

  console.log('resolved sender      :', account.sender)
  console.log('resolved authUser    :', account.authUser)
  console.log('SMTP AUTH (observed) :', JSON.stringify(seen.auth))
  console.log('MAIL FROM (observed) :', seen.from)
  console.log('From header (raw)    :', fromHeader)
  console.log('From header (decoded):', decodedFrom)
  console.log('accepted             :', JSON.stringify(result.accepted))

  const checks = [
    ['login uses authUser', seen.auth[0]?.user === 'owner@fake.test'],
    ['login uses authPassword', seen.auth[0]?.pass === 'owner-secret'],
    ['From header carries the alias address', decodedFrom.includes('alias@fake.test')],
    ['From header carries the display name', decodedName === '鲸鱼小姐'],
    ['envelope sender is the alias', String(seen.from).includes('alias@fake.test')],
  ]
  let failures = 0
  for (const [label, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
    if (!ok) failures += 1
  }
  process.exitCode = failures === 0 ? 0 : 1
} finally {
  server.close()
}
