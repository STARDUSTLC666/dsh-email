import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EmailPool, resolveEmailSettings } from '../lib/index.js'

const settings = resolveEmailSettings({ provider: 'qq', user: 'test@example.com', password: 'test' })

test('pre-aborted email calls never start IMAP or SMTP', async () => {
  const pool = new EmailPool(settings)
  pool.createImap = () => { assert.fail('IMAP must not connect') }
  pool.transporter = () => { assert.fail('SMTP must not connect') }
  const reason = new Error('cancel before email')
  const signal = AbortSignal.abort(reason)
  await assert.rejects(pool.withImap(undefined, null, async () => { assert.fail('no operation') }, true, signal), (error) => error === reason)
  await assert.rejects(pool.send(undefined, 'to@example.com', 'test', 'body', undefined, [], signal), (error) => error === reason)
  pool.dispose()
})

test('cancelling an active IMAP operation closes its connection and preserves the reason', async () => {
  const pool = new EmailPool(settings)
  const controller = new AbortController()
  const reason = new Error('cancel active IMAP')
  let closeCount = 0
  let rejectPending
  pool.createImap = () => ({
    usable: true,
    async connect() {},
    async logout() {},
    close() {
      closeCount++
      this.usable = false
      rejectPending(new Error('connection closed'))
    },
  })
  const operation = pool.withImap(undefined, null, () => new Promise((_resolve, reject) => {
    rejectPending = reject
    queueMicrotask(() => controller.abort(reason))
  }), true, controller.signal)
  await assert.rejects(operation, (error) => error === reason)
  assert.equal(closeCount, 1)
  assert.equal(pool.imaps.size, 0)
  pool.dispose()
})

test('cancelling an active SMTP connection stops the local delivery', async t => {
  const { createServer } = await import('node:net')
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  t.after(() => new Promise(resolve => server.close(resolve)))

  const controller = new AbortController()
  const reason = new Error('cancel local SMTP send')
  let socket
  let resolveSocketClosed
  const socketClosed = new Promise(resolve => { resolveSocketClosed = resolve })
  let resolveConnected
  const connected = new Promise(resolve => { resolveConnected = resolve })
  server.on('connection', incoming => {
    socket = incoming
    incoming.on('close', resolveSocketClosed)
    resolveConnected()
  })

  const localSettings = resolveEmailSettings({
    provider: 'qq', user: 'fixture@example.com', password: 'fixture-only',
    smtp: { host: '127.0.0.1', port: server.address().port, secure: false },
  })
  const pool = new EmailPool(localSettings)
  t.after(() => pool.dispose())
  const pending = pool.send(undefined, 'recipient@example.com', 'fixture', 'local only', undefined, [], controller.signal)
  await connected
  controller.abort(reason)
  await assert.rejects(pending, /SMTP发送已取消/)
  await Promise.race([socketClosed, new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP socket remained open')), 1000))])
  assert.equal(socket.destroyed, true, 'cancelled SMTP socket must be closed')
})

test('implicit TLS and STARTTLS keep certificate validation and support cancellation', async () => {
  const { spawn } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const { dirname, join } = await import('node:path')
  const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
  const certPath = join(fixtureDir, 'smtp-test-ca.pem')
  const keyPath = join(fixtureDir, 'smtp-test-key.pem')
  const probePath = join(fixtureDir, 'smtp-tls-probe.mjs')
  const child = spawn(process.execPath, [probePath, certPath, keyPath], {
    env: { ...process.env, NODE_EXTRA_CA_CERTS: certPath },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk })
  child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk })
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', resolve)
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error('TLS SMTP fixture exceeded 12 seconds'))
    }, 12000)
    child.once('close', () => clearTimeout(timer))
  })
  assert.equal(code, 0, `TLS SMTP fixture failed: ${stderr}\n${stdout}`)
  assert.match(stdout, /"pass":true/)
})
