import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AgentMailClient,
  EmailService,
  resolveEmailSettings,
  EmailSettingsBackend,
} from '../lib/index.js'
import { downloadPublicBytes } from '../lib/public-download.js'
import { createAgentMailPeer } from './helpers/agentmail-peer.mjs'

function settings(extra = {}) {
  return resolveEmailSettings({
    provider: 'agentmail',
    user: 'assistant@agentmail.to',
    apiKey: 'synthetic-agentmail-key',
    ...extra,
  })
}
test('AgentMail uses separate credentials, fixed US/EU endpoints and never inherits a QQ password', () => {
  assert.equal(
    settings().accounts.get('default').apiBase,
    'https://api.agentmail.to',
  )
  assert.equal(
    settings({ provider: 'agentmail-eu' }).accounts.get('default').apiBase,
    'https://api.agentmail.eu',
  )
  assert.equal(
    settings({ senderName: 'Ignored by API' }).accounts.get('default')
      .senderName,
    '',
  )
  assert.throws(() => settings({ apiKey: 'bad\tkey' }), /API Key/)
  assert.throws(
    () =>
      resolveEmailSettings({
        provider: 'qq',
        user: 'personal@qq.com',
        password: 'qq-secret',
        accounts: { bot: { provider: 'agentmail', user: 'bot@agentmail.to' } },
      }),
    /API Key/,
  )
})
test(
  'real HTTP API transport supports opaque IDs, search, page metadata, read, labels, send and thread reply',
  { timeout: 15000 },
  async (t) => {
    const peer = await createAgentMailPeer()
    t.after(() => peer.close())
    const api = new AgentMailClient(settings(), peer.fetcher)
    await api.test('default')
    const first = await api.list('default', 'INBOX', 20, 0, false)
    assert.equal(first.messages.length, 20)
    assert.equal(first.hasMore, true)
    assert.equal(first.messages[0].uid, peer.messages[0].message_id)
    const second = await api.list('default', 'INBOX', 20, 20, false)
    assert.notEqual(first.messages[0].uid, second.messages[0].uid)
    const found = await api.search('default', '报价单 31', 'INBOX', 20, 0)
    assert.equal(found.messages[0].uid, peer.messages[31].message_id)
    assert.equal(found.searchSource, 'api')
    const message = await api.read('default', first.messages[0].uid, 'INBOX')
    assert.match(message.text, /untrusted mail/)
    assert.equal(message.attachments[0].part, 'attachment-1')
    await api.mark('default', 'INBOX', message.uid, 'read')
  assert.ok(!peer.messages[0].labels.includes('unread'))
    const unread = await api.list('default', 'INBOX', 20, 0, true)
    assert.ok(unread.messages.every((m) => m.uid !== message.uid))
    await api.send(
      'default',
      'Human <human@example.invalid>',
      'Hello',
      'Body',
      '',
      [],
      undefined,
      { uid: message.uid, folder: 'INBOX' },
    )
    assert.ok(peer.sent[0].path.endsWith('/reply'))
    assert.deepEqual(peer.sent[0].body.to, ['human@example.invalid'])
    await api.send('default', 'human@example.invalid', 'Hello', 'Body', '', [])
    assert.equal(peer.sent[1].body.subject, 'Hello')
    assert.ok(
      peer.requests.every(
        (r) => r.authorization === 'Bearer synthetic-agentmail-key',
      ),
    )
  },
)
test('API identities cannot cross accounts or normalize path segments', async () => {
  let calls = 0
  const malformed = new AgentMailClient(settings(), async () => {
    calls++
    return Response.json({
      inbox_id: 'another@agentmail.to',
      message_id: '<id>',
    })
  })
  await assert.rejects(malformed.read('default', '..', 'INBOX'), /message_id/)
  assert.equal(calls, 0)
  await assert.rejects(malformed.read('default', '<id>', 'INBOX'), /其他邮箱/)
  const config = settings()
  config.accounts.get('default').apiBase = 'https://untrusted.invalid'
  await assert.rejects(
    new AgentMailClient(config, async () => {
      calls++
      throw Error('must not call')
    }).test('default'),
    /区域/,
  )
  assert.equal(calls, 1)
})
test('AgentMail blocks denied recipients before POST, never retries a send and does not echo API credentials', async () => {
  let calls = 0
  const config = settings()
  config.recipientPolicies = new Map([
    [
      'default',
      {
        skipApproval: false,
        addresses: [],
        domains: [],
        denyDomains: ['blocked.invalid'],
      },
    ],
  ])
  const api = new AgentMailClient(config, async () => {
    calls++
    throw new Error('network failure')
  })
  await assert.rejects(
    api.send('default', 'x@blocked.invalid', 'Hi', 'Body', '', []),
    /禁止/,
  )
  assert.equal(calls, 0)
  await assert.rejects(
    api.send('default', 'x@example.invalid', 'Hi', 'Body', '', []),
    /network failure/,
  )
  assert.equal(calls, 1)
  const rejected = new AgentMailClient(
    settings(),
    async () => new Response('synthetic-agentmail-key', { status: 401 }),
  )
  await assert.rejects(
    rejected.test('default'),
    (e) =>
      !e.message.includes('synthetic-agentmail-key') &&
      e.message.includes('401'),
  )
})
test('AgentMail attachment bytes are bounded, filenames stay inside the owned download directory', async (t) => {
  const peer = await createAgentMailPeer()
  t.after(() => peer.close())
  const base = fileURLToPath(new URL('../.test-output/', import.meta.url))
  await mkdir(base, { recursive: true })
  const root = await mkdtemp(join(base, 'agentmail-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const api = new AgentMailClient(
    settings({ downloadDir: root }),
    peer.fetcher,
    async () => Buffer.from('quote'),
  )
  const result = await api.downloadAttachment(
    'default',
    'INBOX',
    peer.messages[0].message_id,
    0,
  )
  assert.equal((await readFile(result.path)).toString(), 'quote')
  assert.ok(result.path.startsWith(resolve(root)))
  const capped = new AgentMailClient(
    settings({ maxAttachmentBytes: 1024 }),
    peer.fetcher,
    async () => Buffer.alloc(2048),
  )
  await assert.rejects(
    capped.downloadAttachment(
      'default',
      'INBOX',
      peer.messages[0].message_id,
      0,
    ),
    /上限/,
  )
  await assert.rejects(
    downloadPublicBytes('https://127.0.0.1/private', 1024),
    /公网/,
  )
  await assert.rejects(
    downloadPublicBytes('http://example.com/file', 1024),
    /不受支持/,
  )
})
test('new-mail polling drains a backlog without repeats; first call only establishes the baseline', async (t) => {
  const peer = await createAgentMailPeer()
  t.after(() => peer.close())
  const api = new AgentMailClient(settings(), peer.fetcher)
  assert.equal((await api.watch('default', 'INBOX', 20, 'web')).newCount, 0)
  peer.messages.unshift(
    ...Array.from({ length: 25 }, (_, i) => peer.make(100 + i)),
  )
  const a = await api.watch('default', 'INBOX', 20, 'web')
  await assert.rejects(
    api.watch('default', 'INBOX', 20, 'web', AbortSignal.abort()),
  )
  const b = await api.watch('default', 'INBOX', 20, 'web'),
    c = await api.watch('default', 'INBOX', 20, 'web')
  assert.equal(a.newCount, 20)
  assert.equal(b.newCount, 5)
  assert.equal(c.newCount, 0)
  assert.equal(
    new Set([...a.messages, ...b.messages].map((m) => m.uid)).size,
    25,
  )
})
test('API polling follows opaque pages once and reports partial unread counts honestly', async (t) => {
  const peer = await createAgentMailPeer()
  t.after(() => peer.close())
  const api = new AgentMailClient(settings(), peer.fetcher)
  await api.watch('default', 'INBOX', 20, 'web')
  peer.messages.unshift(
    ...Array.from({ length: 250 }, (_, i) => peer.make(1000 + i)),
  )
  peer.requests.length = 0
  const result = await api.watch('default', 'INBOX', 20, 'web')
  assert.equal(result.newCount, 20)
  assert.equal(result.totalUnreadExact, true)
  assert.equal(peer.requests.length, 3)
  const separate = await api.watch('default', 'INBOX', 20, 'tool')
  assert.equal(separate.totalUnreadExact, false)
  assert.equal(separate.newCount, 0)
})
test('the mixed-account service preserves numeric IMAP UIDs and refuses API identifiers on an IMAP account', async () => {
  const config = resolveEmailSettings({
    accounts: {
      qq: { provider: 'qq', user: 'a@qq.com', password: 'synthetic' },
      bot: {
        provider: 'agentmail',
        user: 'assistant@agentmail.to',
        apiKey: 'synthetic-agentmail-key',
      },
    },
    defaultAccount: 'qq',
  })
  const service = new EmailService(config)
  try {
    assert.throws(() => service.read('qq', '<opaque@id>', 'INBOX'), /正整数/)
    let received
    service.imap.read = async (...args) => {
      received = args[1]
      return { uid: args[1] }
    }
    await service.read('qq', 42, 'INBOX')
    assert.equal(received, 42)
  } finally {
    service.dispose()
  }
})
