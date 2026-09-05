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
