import test from 'node:test'
import assert from 'node:assert/strict'
import { MailConsumerBackend, installMailConsumers, normalizeMailConsumers } from '../lib/mail-consumers.js'

const row = (uid, { sender = 'sender@example.test', subject = 'hello', date = '2026-01-01T00:00:00.000Z', hasAttachments = false } = {}) => ({
  uid,
  date,
  from: [{ address: sender }],
  subject,
  seen: false,
  flagged: false,
  size: 12,
  hasAttachments,
})

function fixture(config = {}) {
  let messages = config.messages ?? []
  let uidValidity = config.uidValidity ?? 7
  const calls = []
  const accounts = config.accounts ?? [['default', { user: 'me@example.test', provider: 'fixture' }]]
  const failing = new Set(config.failing ?? [])
  const runtime = {
    getEffectiveSettings: () => ({ accounts: new Map(accounts) }),
    getPool: () => ({
      list: async (account, folder) => {
        calls.push({ account, folder })
        if (failing.has(account)) throw new Error('fixture mailbox failure')
        return { account, folder, uidValidity, count: messages.length, messages: messages.slice(0, 100) }
      },
    }),
  }
  const backend = new MailConsumerBackend(runtime, {
    consumers: config.consumers ?? [{ id: 'default-consumer', account: 'default', folder: 'INBOX' }],
    consumerPollSeconds: 30,
  }, config.handlerTimeoutMs)
  return {
    backend,
    runtime,
    calls,
    setMessages(next) { messages = next },
    setUidValidity(next) { uidValidity = next },
  }
}

const tickWith = async (fixtureValue, messages) => {
  fixtureValue.setMessages(messages)
  await fixtureValue.backend.tick()
  await new Promise(resolve => setImmediate(resolve))
}

test('normalizes and validates consumer configuration', () => {
  assert.deepEqual(normalizeMailConsumers([{ id: 'work', account: 'default', senders: [' A@EXAMPLE.TEST ', 'a@example.test'], enabled: false }]), [
    { id: 'work', account: 'default', folder: 'INBOX', senders: ['a@example.test'], enabled: false },
  ])
  assert.throws(() => normalizeMailConsumers([{ id: 'bad id', account: 'default' }]), /invalid id/)
  assert.throws(() => normalizeMailConsumers([{ id: 'a', account: 'default' }, { id: 'a', account: 'default' }]), /duplicated/)
  assert.throws(() => normalizeMailConsumers([{ id: 'a', account: 'default', senders: ['x\ny'] }]), /address list/)
  assert.throws(() => normalizeMailConsumers({}), /at most 20/)
})

test('first scan establishes a baseline and later arrivals fan out to matching consumers', async () => {
  const f = fixture({ messages: [row(1, { sender: 'alice@example.test' })], consumers: [
    { id: 'alice', account: 'default', senders: ['alice@example.test'] },
    { id: 'subject', account: 'default', subject: 'hello' },
  ] })
  const events = { alice: [], subject: [] }
  const offAlice = f.backend.subscribe('alice', event => events.alice.push(event))
  const offSubject = f.backend.subscribe('subject', event => events.subject.push(event))
  await f.backend.tick()
  assert.deepEqual(events, { alice: [], subject: [] })
  await tickWith(f, [row(1, { sender: 'alice@example.test' }), row(2, { sender: 'alice@example.test', subject: 'hello again' })])
  assert.equal(events.alice.length, 1)
  assert.equal(events.subject.length, 1)
  assert.equal(events.alice[0].uid, 2)
  assert.equal(events.alice[0].sender, 'alice@example.test')
  assert.equal(events.alice[0].eventId, events.subject[0].eventId)
  offAlice(); offSubject(); await f.backend.stop()
})

test('events carry the listing attachment hint as a strict boolean', async () => {
  const f = fixture()
  const events = []
  const off = f.backend.subscribe('default-consumer', event => events.push(event))
  await tickWith(f, [row(1, { hasAttachments: true })])
  const withAttachment = row(2, { hasAttachments: true })
  const unknownFlag = { ...row(3), hasAttachments: undefined }
  await tickWith(f, [unknownFlag, withAttachment, row(1, { hasAttachments: true })])
  assert.deepEqual(events.map(event => [event.uid, event.hasAttachments]).sort(), [[2, true], [3, false]])
  off()
  await f.backend.stop()
})

test('filters sender and subject without reading message bodies', async () => {
  const f = fixture({ consumers: [{ id: 'filtered', account: 'default', senders: ['ok@example.test'], subject: 'invoice' }] })
  const events = []
  const off = f.backend.subscribe('filtered', event => events.push(event))
  await f.backend.tick()
  await tickWith(f, [
    row(1, { sender: 'wrong@example.test', subject: 'invoice' }),
    row(2, { sender: 'ok@example.test', subject: 'other' }),
    row(3, { sender: 'ok@example.test', subject: 'Invoice for April' }),
  ])
  assert.deepEqual(events.map(event => event.uid), [3])
  assert.equal(Object.hasOwn(events[0], 'text'), false)
  assert.equal(Object.hasOwn(events[0], 'attachments'), false)
  off(); await f.backend.stop()
})

test('resets baseline on UIDVALIDITY and consumer configuration changes', async () => {
  const consumers = [{ id: 'c', account: 'default' }]
  const f = fixture({ consumers, messages: [row(10)] })
  const events = []
  const off = f.backend.subscribe('c', event => events.push(event))
  await f.backend.tick()
  f.setUidValidity(8)
  await tickWith(f, [row(1, { date: '2026-01-02T00:00:00.000Z' })])
  assert.equal(events.length, 0)
  consumers[0].subject = 'changed'
  await tickWith(f, [row(1), row(2)])
  assert.equal(events.length, 0)
  off(); await f.backend.stop()
})

test('opaque IDs use a strict date watermark and never report shifted old mail', async () => {
  const baseTime = Date.parse('2026-01-01T00:00:00.000Z')
  const initial = Array.from({ length: 100 }, (_, index) => row(`old-${index}`, {
    date: new Date(baseTime + index * 60_000).toISOString(),
  }))
  const f = fixture({ messages: initial })
  const events = []
  const off = f.backend.subscribe('default-consumer', event => events.push(event))
  await f.backend.tick()
  const shifted = initial.slice(1)
  shifted.push(row('old-100', { date: '2025-12-31T23:59:00.000Z' }))
  await tickWith(f, shifted)
  assert.deepEqual(events, [])
  shifted[99] = row('new-100', { date: '2026-01-01T02:00:00.000Z' })
  await tickWith(f, shifted)
  assert.deepEqual(events.map(event => event.uid), ['new-100'])
  off(); await f.backend.stop()
})

test('empty scans do not leave status permanently running', async () => {
  const config = { consumers: [] }
  const f = fixture(config)
  await f.backend.tick()
  assert.equal(f.backend.status().running, false)
  config.consumers.push({ id: 'late', account: 'default' })
  f.backend
  await f.backend.stop()
})

test('handler failures are isolated and cancellation allows a fresh subscription', async () => {
  const f = fixture({ messages: [row(1)] })
  let calls = 0
  const off = f.backend.subscribe('default-consumer', () => { calls++; throw new Error('fixture failure') })
  await f.backend.tick()
  await tickWith(f, [row(1), row(2)])
  assert.equal(calls, 1)
  assert.equal(f.backend.status().handlerFailures, 1)
  off()
  const events = []
  const off2 = f.backend.subscribe('default-consumer', event => events.push(event))
  await tickWith(f, [row(1), row(2), row(3)])
  assert.deepEqual(events.map(event => event.uid), [3])
  off2(); await f.backend.stop()
})

test('app-ready polling starts when an enabled consumer is added later', async () => {
  const config = { consumers: [] }
  const f = fixture(config)
  f.backend.start()
  assert.equal(f.backend.status().running, false)
  config.consumers.push({ id: 'late', account: 'default' })
  const off = f.backend.subscribe('late', () => {})
  assert.equal(f.backend.status().running, true)
  off(); await f.backend.stop()
})

test('handler timeout frees a concurrency slot while keeping in-flight state honest', async () => {
  const f = fixture({ messages: [row(1)] })
  let resolveFirst
  const events = []
  const backend = new MailConsumerBackend(f.backend.runtime, { consumers: [{ id: 'default-consumer', account: 'default' }], consumerPollSeconds: 30 }, 10)
  const off = backend.subscribe('default-consumer', event => {
    events.push(event.uid)
    return new Promise(resolve => { resolveFirst = resolve })
  })
  await backend.tick()
  f.setMessages([row(1), row(2)])
  await backend.tick()
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(backend.status().handlerTimeouts, 1)
  assert.equal(backend.status().inFlight, 1)
  resolveFirst()
  await new Promise(resolve => setImmediate(resolve))
  off(); await backend.stop()
})

test('stop aborts an in-flight handler and waits for its cooperative completion', async () => {
  const f = fixture({ messages: [row(1)] })
  let started = false
  let stopped = false
  const off = f.backend.subscribe('default-consumer', event => new Promise(resolve => {
    started = true
    event.signal.addEventListener('abort', () => { stopped = true; resolve() }, { once: true })
  }))
  await f.backend.tick()
  f.setMessages([row(1), row(2)])
  await f.backend.tick()
  await new Promise(resolve => setImmediate(resolve))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(started, true)
  await f.backend.stop()
  assert.equal(stopped, true)
  assert.equal(f.backend.status().inFlight, 0)
  off()
})

test('one unreachable mailbox does not stop deliveries from a healthy one', async () => {
  const f = fixture({
    accounts: [['work', { user: 'work@example.test', provider: 'fixture' }], ['broken', { user: 'broken@example.test', provider: 'fixture' }]],
    failing: ['broken'],
    messages: [row(1)],
    consumers: [
      { id: 'work', account: 'work', folder: 'INBOX' },
      { id: 'broken', account: 'broken', folder: 'INBOX' },
    ],
  })
  const events = []
  const offWork = f.backend.subscribe('work', event => events.push(event))
  const offBroken = f.backend.subscribe('broken', event => events.push(event))
  await f.backend.tick()
  f.setMessages([row(1), row(2)])
  await f.backend.tick()
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(events.map(event => event.consumerId), ['work'])
  assert.match(f.backend.status().lastError, /broken\/INBOX/)
  offWork(); offBroken(); await f.backend.stop()
})

test('the per-consumer concurrency cap drops excess events instead of queueing forever', async t => {
  const f = fixture({ handlerTimeoutMs: 60_000 })
  const backend = new MailConsumerBackend(f.runtime, {
    consumers: [{ id: 'busy', account: 'default', folder: 'INBOX' }],
    consumerPollSeconds: 30,
  }, 60_000)
  let release
  const started = []
  const resolvers = []
  const off = backend.subscribe('busy', event => new Promise(resolve => {
    started.push(event.uid)
    resolvers.push(resolve)
    release = resolve
  }))
  await backend.tick()
  f.setMessages(Array.from({ length: 6 }, (_, index) => row(index + 1)))
  await backend.tick()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(started.length, 4, 'only four handlers may run at once')
  assert.equal(backend.status().inFlight, 4)
  assert.equal(backend.status().droppedEvents, 2)
  assert.match(backend.status().lastError, /concurrency limit/)
  for (const resolve of resolvers) resolve()
  await new Promise(resolve => setImmediate(resolve))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(backend.status().inFlight, 0)
  off(); await backend.stop()
})

test('install registers the emailTasks service, starts on appReady and stops on dispose', async () => {
  const f = fixture({ messages: [row(1)] })
  const provided = new Map()
  const readyHooks = []
  const disposeHooks = []
  const ctx = {
    provide(name, value) { provided.set(name, value) },
    inject(name, fn) { assert.deepEqual(name, ['appReady'], 'only the appReady service is injected'); fn({ appReady: { onReady(fn) { readyHooks.push(fn) } } }) },
    on(name, fn) { if (name === 'dispose') disposeHooks.push(fn) },
  }
  installMailConsumers(ctx, f.backend)
  const service = provided.get('emailTasks')
  assert.equal(typeof service.subscribe, 'function')
  assert.equal(typeof service.status, 'function')
  assert.equal(service.status().running, false)

  const events = []
  const off = service.subscribe('default-consumer', event => events.push(event))
  assert.equal(service.status().running, false, 'subscription alone must not start polling before appReady')
  readyHooks[0]()
  assert.equal(service.status().running, true)
  // appReady schedules the first scan immediately; let it establish the baseline
  // before publishing a new arrival, or the baseline would swallow it.
  await new Promise(resolve => setTimeout(resolve, 0))
  f.setMessages([row(1), row(2)])
  await f.backend.tick()
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(events.map(event => event.uid), [2])

  for (const hook of disposeHooks) await hook()
  assert.equal(service.status().running, false)
  assert.deepEqual(service.status().registered, [])
  // Disposal clears live subscriptions but leaves the configuration intact, so a
  // consumer may subscribe again — it just must not poll until appReady fires.
  const again = []
  const offAgain = service.subscribe('default-consumer', event => again.push(event))
  assert.equal(service.status().running, false)
  assert.deepEqual(service.status().registered, ['default-consumer'])
  offAgain()
  off()
})

