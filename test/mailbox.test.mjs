import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  EmailMailboxBackend,
  EmailDraftBackend,
  DraftStore,
  resolveEmailSettings,
  EmailPool,
} from '../lib/index.js'

async function fixture(t) {
  const root = await mkdtemp(join(import.meta.dirname, '.mailbox-fixture-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const config = {
      provider: 'agentmail',
      user: 'assistant@agentmail.to',
      apiKey: 'synthetic-secret',
    },
    settings = resolveEmailSettings(config),
    value = { sendApproval: true, trustedRecipientsYaml: '' },
    calls = []
  const original = {
    account: 'default',
    folder: 'INBOX',
    uid: '<original@agent.test>',
    date: '2026-10-21T00:00:00Z',
    from: [{ address: 'human@example.invalid' }],
    to: [{ address: config.user }],
    cc: [],
    subject: '报价单',
    text: '<script>untrusted text</script>',
    attachments: [],
    truncated: false,
  }
  const pool = {
    read: async () => original,
    list: async (...args) => {
      calls.push(args)
      return {
        account: 'default',
        folder: 'INBOX',
        count: 1,
        messages: [original],
      }
    },
    folders: async () => ({ folders: [] }),
    sendPrepared: async (...args) => {
      calls.push(args)
      return {
        account: 'default',
        messageId: '<reply@agent.test>',
        accepted: ['human@example.invalid'],
        rejected: [],
        response: 'accepted',
      }
    },
  }
  const runtime = {
      getPool: () => pool,
      getEffectiveSettings: () => settings,
      getSettingsValue: () => value,
    },
    store = new DraftStore(root),
    drafts = new EmailDraftBackend(
      runtime,
      {
        snapshot: async () => ({
          accounts: ['default'],
          settings: { value, revision: 1 },
          writable: true,
        }),
      },
      { store },
    ),
    backend = new EmailMailboxBackend(runtime, drafts)
  return {
    backend,
    drafts,
    store,
    calls,
    original,
    request: (body, headers = {}) =>
      backend.fetch(
        new Request('http://127.0.0.1/api/dsh-email/mailbox', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-dsh-email-mailbox': '1',
            ...headers,
          },
          body: JSON.stringify(body),
        }),
      ),
  }
}
test('mailbox routes reject cross-origin and unmarked operations and never expose API keys', async (t) => {
  const f = await fixture(t)
  assert.equal(
    (
      await f.request(
        { action: 'accounts' },
        { origin: 'https://attacker.invalid' },
      )
    ).status,
    403,
  )
  assert.equal(
    (await f.request({ action: 'accounts' }, { 'x-dsh-email-mailbox': '' }))
      .status,
    403,
  )
  assert.equal(
    (
      await f.request(
        { action: 'accounts' },
        { origin: 'http://browser.test', host: 'browser.test' },
      )
    ).status,
    200,
    'authenticated DSH carrier retains the original Host',
  )
  const response = await f.request({ action: 'accounts' }),
    text = await response.text()
  assert.equal(response.status, 200)
  assert.ok(!text.includes('synthetic-secret'))
  assert.match(text, /assistant@agentmail.to/)
})
test('reply buttons create editable drafts without sending; confirmation retains the opaque thread reference', async (t) => {
  const f = await fixture(t),
    draft = await f.backend.action({
      action: 'replyDraft',
      account: 'default',
      folder: 'INBOX',
      uid: f.original.uid,
    })
  assert.deepEqual(draft.reply, { uid: f.original.uid, folder: 'INBOX' })
  assert.equal(draft.to, 'human@example.invalid')
  assert.equal(f.calls.length, 0)
  assert.equal(
    (
      await new DraftStore(
        f.store.root.replace(/[\\/]data[\\/]dsh-email$/, ''),
      ).get(draft.id)
    ).reply.uid,
    f.original.uid,
  )
  await assert.rejects(
    f.drafts.action({
      action: 'update',
      id: draft.id,
      revision: draft.revision,
      ...draft,
      account: 'other',
    }),
    /原发件账号/,
  )
  const preview = await f.drafts.action({
    action: 'preview',
    id: draft.id,
    revision: draft.revision,
  })
  assert.equal(f.calls.length, 0)
  await f.drafts.action({
    action: 'send',
    id: draft.id,
    preview: preview.id,
    confirmed: true,
  })
  assert.deepEqual(f.calls[0][7], draft.reply)
  assert.equal(f.calls.length, 1)
})
test('mailbox list preserves explicit account, folder and match pagination without mutating message content', async (t) => {
  const f = await fixture(t),
    response = await f.request({
      action: 'list',
      account: 'default',
      folder: 'Sent',
      offset: 20,
    })
  assert.equal(response.status, 200)
  assert.deepEqual(f.calls[0].slice(0, 5), ['default', 'Sent', 20, 20, false])
  const read = await (
    await f.request({ action: 'read', uid: f.original.uid })
  ).json()
  assert.equal(read.value.text, f.original.text)
})

test('AgentMail draft attachments fail before preview or submission at the API limit', async (t) => {
  const f = await fixture(t)
  const draft = await f.drafts.create({
    account: 'default',
    to: 'human@example.invalid',
    subject: 'Limit',
    text: 'Body',
  })
  const file = join(f.store.root, 'too-large.bin')
  await writeFile(file, Buffer.alloc(4 * 1024 * 1024 + 1))
  const listing = await f.drafts.action({ action: 'list' })
  assert.equal(listing.attachmentLimits.default, 4 * 1024 * 1024)
  await assert.rejects(
    f.drafts.create({ ...draft, attachments: [file] }),
    /附件/,
  )
  assert.equal(f.calls.length, 0)
})

test('IMAP reviewed replies retain thread headers and reject a renumbered mailbox before sending', async () => {
  const pool = new EmailPool(
    resolveEmailSettings({
      provider: 'qq',
      user: 'a@qq.com',
      password: 'synthetic',
    }),
  )
  let sent = [],
    currentValidity = 8
  pool.withImap = async (account, folder, run) => {
    assert.equal(folder, 'INBOX')
    return run({
      mailbox: { uidValidity: currentValidity },
      fetchOne: async (uid, options) => {
        assert.equal(uid, 51)
        assert.deepEqual(options.headers, ['message-id', 'references'])
        return {
          headers: Buffer.from(
            'Message-ID: <original@example.invalid>\r\nReferences: <earlier@example.invalid>\r\n\r\n',
          ),
        }
      },
    })
  }
  pool.sendMail = async (name, cfg, message) => {
    sent.push(message)
    return {
      messageId: '<reply@example.invalid>',
      accepted: ['other@example.invalid'],
      rejected: [],
    }
  }
  try {
    await pool.sendPrepared(
      'default',
      'other@example.invalid',
      'Re: Hello',
      'Reviewed text',
      '',
      [],
      undefined,
      { uid: 51, folder: 'INBOX', uidValidity: 8 },
    )
    assert.equal(sent[0].text, 'Reviewed text')
    assert.equal(sent[0].inReplyTo, '<original@example.invalid>')
    assert.deepEqual(sent[0].references, [
      '<earlier@example.invalid>',
      '<original@example.invalid>',
    ])
    currentValidity = 9
    await assert.rejects(
      pool.sendPrepared(
        'default',
        'other@example.invalid',
        'Re: Hello',
        'Reviewed text',
        '',
        [],
        undefined,
        { uid: 51, folder: 'INBOX', uidValidity: 8 },
      ),
      /UIDVALIDITY/,
    )
    assert.equal(sent.length, 1)
  } finally {
    pool.dispose()
  }
})
