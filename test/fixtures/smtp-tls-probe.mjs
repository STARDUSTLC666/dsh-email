import { createServer as createNetServer } from 'node:net'
import { createServer as createTlsServer, TLSSocket, createSecureContext } from 'node:tls'
import { readFileSync } from 'node:fs'
import { EmailPool, resolveEmailSettings } from '../../lib/index.js'

const certPath = process.argv[2]
const keyPath = process.argv[3]
const cert = readFileSync(certPath)
const key = readFileSync(keyPath)
const context = createSecureContext({ cert, key })

function fixture(mode, holdGreeting = false) {
  const messages = []
  const sockets = new Set()
  let connectedResolve
  const connected = new Promise(resolve => { connectedResolve = resolve })
  let releaseGreeting
  const greetingReady = new Promise(resolve => { releaseGreeting = resolve })
  const server = mode === 'implicit'
    ? createTlsServer({ cert, key }, socket => attach(socket, true))
    : createNetServer(socket => attach(socket, false))

  function attach(socket, encrypted) {
    sockets.add(socket)
    socket.on('error', () => {})
    socket.on('close', () => sockets.delete(socket))
    if (encrypted) connectedResolve()
    let input = ''
    let dataMode = false
    let lines = []
    const reply = response => { if (!socket.destroyed) socket.write(response + '\r\n') }
    const greetNow = () => reply('220 localhost ESMTP fixture')
    const greet = () => {
      if (holdGreeting) releaseGreeting.current = greetNow
      else greetNow()
    }
    socket.on('data', chunk => {
      input += chunk.toString()
      while (input.includes('\r\n')) {
        const end = input.indexOf('\r\n')
        const line = input.slice(0, end)
        input = input.slice(end + 2)
        if (dataMode) {
          if (line === '.') {
            messages.push(lines.join('\n'))
            dataMode = false
            lines = []
            reply('250 2.0.0 fixture accepted')
          } else lines.push(line)
        } else if (/^(EHLO|HELO) /.test(line)) {
          const capability = mode === 'starttls' && !encrypted
            ? '250-localhost\r\n250-STARTTLS\r\n250 AUTH PLAIN'
            : '250-localhost\r\n250 AUTH PLAIN'
          if (encrypted && holdGreeting) releaseGreeting.current = () => reply(capability)
          else reply(capability)
        } else if (line === 'STARTTLS' && mode === 'starttls' && !encrypted) {
          reply('220 2.0.0 begin TLS')
          socket.pause()
          socket.removeAllListeners('data')
          const secureSocket = new TLSSocket(socket, { isServer: true, secureContext: context })
          secureSocket.once('secure', () => attach(secureSocket, true))
          secureSocket.on('error', () => {})
        } else if (/^AUTH /.test(line)) reply('235 2.7.0 authenticated')
        else if (/^(MAIL FROM:|RCPT TO:)/.test(line)) reply('250 2.1.0 OK')
        else if (line === 'DATA') { dataMode = true; reply('354 send message') }
        else if (line === 'QUIT') socket.end('221 bye\r\n')
        else reply('500 unsupported')
      }
    })
    if (mode === 'implicit') {
      // 隐式 TLS：连接即问候；取消用例把问候压住，让发送停在「等问候」上。
      connectedResolve()
      if (!holdGreeting) greet()
    } else if (!encrypted) {
      // STARTTLS 明文阶段：必须立刻发 220 且不能被 hold，否则客户端等 greeting 到超时，
      // 也就永远走不到 TLS 升级（取消用例会停在 "no TLS connection"）。
      greetNow()
    } else {
      // STARTTLS 升级完成：不再重复问候（客户端已收到过明文阶段的 220）。
      connectedResolve()
    }
  }

  return {
    server, sockets, messages, connected, greetingReady,
    async listen() { await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)) },
    get port() { return server.address().port },
    release() {
      if (holdGreeting && typeof releaseGreeting.current === 'function') releaseGreeting.current()
    },
    async close() {
      for (const socket of sockets) socket.destroy()
      await new Promise(resolve => server.close(resolve))
    },
  }
}

async function sendCase(mode, cancel) {
  const smtp = fixture(mode, cancel)
  await smtp.listen()
  const pool = new EmailPool(resolveEmailSettings({
    provider: 'qq', user: 'fixture@example.com', password: 'fixture-only',
    smtp: { host: 'localhost', port: smtp.port, secure: mode === 'implicit' },
  }))
  const controller = new AbortController()
  const pending = pool.send(undefined, 'recipient@example.com', `${mode}-${cancel ? 'cancel' : 'success'}`, 'local tls fixture', undefined, [], controller.signal)
  try {
    if (cancel) {
      await Promise.race([smtp.connected, new Promise((_, reject) => setTimeout(() => reject(new Error(`${mode}: no TLS connection`)), 3000))])
      controller.abort(new Error('TLS cancellation fixture'))
      const result = await pending.then(() => ({ resolved: true }), error => ({ resolved: false, message: error.message }))
      await new Promise(resolve => setTimeout(resolve, 30))
      if (smtp.messages.length !== 0) throw new Error(`${mode}: canceled TLS send delivered a message`)
      if (result.resolved || !/取消|停止/.test(result.message)) throw new Error(`${mode}: cancellation did not reject clearly`)
      return { mode, cancel, socketCountAfter: smtp.sockets.size, messages: smtp.messages.length, result }
    }
    const result = await pending
    if (result.accepted.length !== 1 || smtp.messages.length !== 1) throw new Error(`${mode}: TLS fixture did not accept exactly one message`)
    return { mode, cancel, accepted: result.accepted.length, messages: smtp.messages.length }
  } finally {
    pool.dispose()
    controller.abort()
    await smtp.close()
  }
}

const results = []
for (const mode of ['implicit', 'starttls']) {
  results.push(await sendCase(mode, false))
  results.push(await sendCase(mode, true))
}
console.log(JSON.stringify({ pass: true, results }))
