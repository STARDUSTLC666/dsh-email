import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, stat, rm, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { DraftStore, draftFields } from '../lib/draft-store.js'
import { EmailDraftBackend, EMAIL_DRAFT_ROUTE, installEmailDrafts } from '../lib/draft-web.js'
import { resolveEmailSettings } from '../lib/config.js'
import { buildEmailTools } from '../lib/tools.js'

async function setup(t, sender) {
  const home = await mkdtemp(join(import.meta.dirname, '.draft-fixture-'))
  t.after(async () => { assert.equal(dirname(home), import.meta.dirname); await rm(home, { recursive: true, force: true }) })
  const config = { user: 'sender@example.test', password: 'synthetic-secret', senderName: '合成测试', imap: { host: '127.0.0.1' }, smtp: { host: '127.0.0.1' } }, value = { sendApproval: true, trustedRecipientsYaml: '' }, sends = []
  let revision = 1
  const runtime = { getSettingsValue: () => value, getEffectiveSettings: () => resolveEmailSettings(config), getPool: () => ({ async sendPrepared(...args) { sends.push(args); if (sender) return sender(...args); return { account: args[0], messageId: '<synthetic@example.test>', accepted: ['alice@example.test'], rejected: [], response: '250 accepted' } } }) }
  const settings = { snapshot: async () => ({ accounts: [...runtime.getEffectiveSettings().accounts.keys()], settings: { value, revision }, writable: true }), saveRecipientRules: async (text, expected) => { if (expected !== revision) throw Object.assign(new Error('settings changed'), { code: 'SETTINGS_CONFLICT' }); value.trustedRecipientsYaml = text; revision++ } }
  let now = Date.now()
  const store = new DraftStore(home), backend = new EmailDraftBackend(runtime, settings, { store, now: () => now })
  return { home, store, backend, config, value, sends, runtime, tick: ms => { now += ms }, fields: { account: 'default', to: 'Alice <alice@example.test>', cc: 'bob@example.test', subject: '测试草稿', text: '纯文本内容' }, request: (body, headers = {}, signal) => backend.fetch(new Request('http://127.0.0.1' + EMAIL_DRAFT_ROUTE, { method: 'POST', headers: { 'content-type': 'application/json', 'x-dsh-email-draft': '1', ...headers }, body: JSON.stringify(body), signal })) }
}
test('drafts persist across backend restarts and remain usable before mailbox configuration', async t => {
  const x = await setup(t), draft = await x.store.create(x.fields)
  assert.equal((await new DraftStore(x.home).get(draft.id)).text, x.fields.text)
  const tool = buildEmailTools({ getPool() { throw Error('SMTP must not run') }, getEffectiveSettings() { throw Error('not configured') }, watch() {} }, { create: (body, signal) => x.backend.create(body, signal) }).find(def => def.name === 'email_draft')
  const result = await tool.execute({ to: 'a@example.test', subject: '只准备', text: '不发送' })
  assert.equal(result.state, 'draft'); assert.equal(x.sends.length, 0)
  assert.equal((await stat(join(x.home, 'data/dsh-email/drafts-v1.json'))).isFile(), true)
})
test('draft tool rejects eleven attachments before reading files or sending', async t => {
  const x = await setup(t)
  const tool = buildEmailTools({ getPool() { throw Error('SMTP must not run') }, getEffectiveSettings() { throw Error('not configured') }, watch() {} }, { create: (body, signal) => x.backend.create(body, signal) }).find(def => def.name === 'email_draft')
  await assert.rejects(tool.execute({ ...x.fields, attachments: Array.from({ length: 11 }, (_, i) => join(x.home, 'absent-' + i + '.txt')) }), /最多 10/)
  assert.equal((await x.store.list()).length, 0)
  assert.equal(x.sends.length, 0)
})
test('corrupt local data is preserved rather than silently replaced', async t => {
  const x = await setup(t), file = join(x.home, 'data/dsh-email/drafts-v1.json'); await mkdir(dirname(file), { recursive: true }); await writeFile(file, '{broken')
  await assert.rejects(x.store.create(x.fields), /已保留原文件/); assert.equal(await readFile(file, 'utf8'), '{broken')
})
test('separate stores serialize writes and stale revisions cannot overwrite user edits', async t => {
  const x = await setup(t), other = new DraftStore(x.home)
  const created = await Promise.all([x.store.create(x.fields), other.create({ ...x.fields, subject: '另一份' })]); assert.equal((await other.list()).length, 2)
  await x.store.change(created[0].id, 1, draft => { draft.subject = '已修改' })
  await assert.rejects(other.change(created[0].id, 1, draft => { draft.subject = '旧值' }), error => error.code === 'draft-conflict')
  assert.equal((await other.get(created[0].id)).subject, '已修改')
})
test('the draft tool persists recipients and the original reference together on creation', async t => {
  const x = await setup(t)
  const reply = { uid: 7, folder: 'INBOX', uidValidity: 11, mode: 'reply-all' }
  const pool = x.runtime.getPool()
  pool.prepareReply = async (...args) => {
    assert.equal(args[2], reply.uid)
    assert.equal(args[3], reply.mode)
    return { ...x.fields, subject: 'Re: 原邮件', reply }
  }
  x.runtime.getPool = () => pool
  const tool = buildEmailTools(x.runtime, x.backend).find(def => def.name === 'email_draft')
  const draft = await tool.execute({ account: 'default', text: '回复', reply })
  const saved = await new DraftStore(x.home).get(draft.id)
  assert.equal(saved.revision, 1)
  assert.equal(saved.cc, x.fields.cc)
  assert.deepEqual(saved.reply, reply)

  await assert.rejects(x.store.create(x.fields, [], undefined, { ...reply, uidValidity: 0 }), /原邮件编号/)
  assert.equal((await x.store.list()).length, 1, 'a rejected reference does not leave a standalone draft')
  assert.equal(x.sends.length, 0)
})
test('editing, cancellation and unconfirmed sends perform zero SMTP submissions', async t => {
  const x = await setup(t), draft = await x.backend.create(x.fields), edited = await x.backend.action({ ...x.fields, action: 'update', id: draft.id, revision: 1, text: '编辑后的正文' })
  const plan = await x.backend.action({ action: 'preview', id: draft.id, revision: edited.revision })
  await assert.rejects(x.backend.action({ action: 'send', id: draft.id, preview: plan.id }), /明确确认/)
  await x.backend.action({ action: 'cancelPreview', id: draft.id })
  await assert.rejects(x.backend.action({ action: 'send', id: draft.id, preview: plan.id, confirmed: true }), /预览已过期/)
  assert.equal(x.sends.length, 0); assert.equal((await x.store.get(draft.id)).state, 'draft')
})
test('blocked recipients remain visible in review and a confirmed API send leaves a draft with zero submissions', async t => {
  const x = await setup(t)
  x.value.sendApproval = false
  x.value.trustedRecipientsYaml = 'default: { domains: [example.test], skipApproval: true, denyAddresses: [bob@example.test] }'
  const draft = await x.backend.create(x.fields)
  const preview = await x.backend.action({ action: 'preview', id: draft.id, revision: 1 })
  assert.equal(preview.matching.blocked, true); assert.equal(preview.matching.skipsApproval, false)
  assert.equal(preview.matching.rows.find(row => row.field === 'cc').blocked, true)
  await assert.rejects(x.backend.action({ action: 'send', id: draft.id, preview: preview.id, confirmed: true }), { code: 'recipient-denied' })
  assert.equal(x.sends.length, 0); assert.equal((await x.store.get(draft.id)).state, 'draft')
})
test('the attachment downloaded in preview is exactly what is sent even if the original changes', async t => {
  const x = await setup(t), path = join(x.home, 'original.txt'); await writeFile(path, 'reviewed bytes')
  const draft = await x.backend.create({ ...x.fields, attachments: [path] }), preview = await x.backend.action({ action: 'preview', id: draft.id, revision: 1 })
  await writeFile(path, 'changed after review')
  const response = await x.backend.fetch(new Request('http://127.0.0.1' + EMAIL_DRAFT_ROUTE + '?preview=' + preview.id + '&attachment=' + preview.attachments[0].id))
  assert.equal(await response.text(), 'reviewed bytes'); assert.match(response.headers.get('content-disposition'), /^attachment;/)
  const result = await x.backend.action({ action: 'send', id: draft.id, preview: preview.id, confirmed: true })
  assert.equal(result.draft.state, 'sent'); assert.equal(x.sends[0][5][0].content.toString(), 'reviewed bytes'); assert.equal(x.sends[0][4], x.fields.cc)
  await assert.rejects(x.backend.action({ action: 'send', id: draft.id, preview: preview.id, confirmed: true })); assert.equal(x.sends.length, 1)
  await x.backend.action({ action: 'delete', id: draft.id, revision: result.draft.revision, confirmed: true }); assert.equal(await readFile(path, 'utf8'), 'changed after review')
})
test('draft, account and saved-policy edits invalidate a preview without sending', async t => {
  for (const kind of ['draft', 'account', 'policy', 'expiry']) {
    const x = await setup(t), draft = await x.backend.create(x.fields), plan = await x.backend.action({ action: 'preview', id: draft.id, revision: 1 })
    if (kind === 'draft') await x.store.change(draft.id, 1, draft => { draft.to = 'other@example.test' })
    if (kind === 'account') x.config.user = 'other-sender@example.test'
    if (kind === 'policy') x.value.trustedRecipientsYaml = 'default: { domains: [example.test] }'
    if (kind === 'expiry') x.tick(10 * 60 * 1000 + 1)
    await assert.rejects(x.backend.action({ action: 'send', id: draft.id, preview: plan.id, confirmed: true })); assert.equal(x.sends.length, 0)
  }
})
test('concurrent confirmations from separate backends submit at most one message', async t => {
  let release, entered
  const holding = new Promise(resolve => { release = resolve }), started = new Promise(resolve => { entered = resolve })
  const x = await setup(t, async () => { entered(); await holding; return { account: 'default', accepted: ['alice@example.test'], rejected: [], messageId: 'one', response: '250' } })
  const second = new EmailDraftBackend(x.runtime, { snapshot: async () => ({ accounts: ['default'], settings: { value: x.value, revision: 1 } }) }, { store: new DraftStore(x.home) })
  const draft = await x.backend.create(x.fields), a = await x.backend.action({ action: 'preview', id: draft.id, revision: 1 }), b = await second.action({ action: 'preview', id: draft.id, revision: 1 })
  const send = x.backend.action({ action: 'send', id: draft.id, preview: a.id, confirmed: true }); await started
  try {
    await assert.rejects(second.action({ action: 'send', id: draft.id, preview: b.id, confirmed: true }), error => ['draft-busy', 'draft-submitted'].includes(error.code))
    await second.action({ action: 'list' }); assert.equal((await x.store.get(draft.id)).state, 'sending', 'list must not recover another process active send')
    const other = await second.create({ ...x.fields, subject: '发送期间仍能新建' }); assert.equal(other.state, 'draft')
  } finally { release(); await send }
  assert.equal(x.sends.length, 1)
})
test('SMTP uncertainty is persisted, never auto-retried and recoverable only as an explicit new draft', async t => {
  const x = await setup(t, async () => { throw new Error('transport lost after DATA') }), draft = await x.backend.create(x.fields), plan = await x.backend.action({ action: 'preview', id: draft.id, revision: 1 })
  const result = await x.backend.action({ action: 'send', id: draft.id, preview: plan.id, confirmed: true })
  assert.equal(result.draft.state, 'uncertain'); await x.backend.action({ action: 'list' }); assert.equal(x.sends.length, 1)
  await assert.rejects(x.backend.action({ action: 'preview', id: draft.id, revision: result.draft.revision }), /不能再次发送/)
  await assert.rejects(x.backend.action({ action: 'copy', id: draft.id, revision: result.draft.revision }), /核对邮箱/)
  const copied = await x.backend.action({ action: 'copy', id: draft.id, revision: result.draft.revision, confirmed: true }); assert.notEqual(copied.id, draft.id); assert.equal(copied.state, 'draft'); assert.equal(x.sends.length, 1)
})
test('a process crash leaves an uncertain record after the lock is free, never a fresh sendable draft', async t => {
  const x = await setup(t), draft = await x.backend.create(x.fields); await x.store.change(draft.id, 1, d => { d.state = 'sending'; d.attemptAt = new Date().toISOString() })
  const list = await x.backend.action({ action: 'list' }); assert.equal(list.drafts[0].state, 'uncertain'); assert.equal(x.sends.length, 0)
})
test('aborting an in-flight submit persists uncertainty and does not prevent other drafts', async t => {
  let entered
  const started = new Promise(resolve => { entered = resolve }), controller = new AbortController()
  const x = await setup(t, async (...args) => { entered(); const signal = args.at(-1); await new Promise((_resolve, reject) => { signal.addEventListener('abort', () => reject(signal.reason), { once: true }) }) }), draft = await x.backend.create(x.fields), preview = await x.backend.action({ action: 'preview', id: draft.id, revision: 1 })
  const send = x.backend.action({ action: 'send', id: draft.id, preview: preview.id, confirmed: true }, controller.signal); await started; controller.abort(new Error('cancelled'))
  assert.equal((await send).draft.state, 'uncertain'); assert.equal((await x.store.get(draft.id)).state, 'uncertain')
  assert.equal((await x.backend.create(x.fields)).state, 'draft')
})
test('uploads are bounded, revision-checked and copied independently of deletion', async t => {
  const x = await setup(t), draft = await x.backend.create(x.fields)
  const upload = (revision, text) => x.backend.fetch(new Request('http://127.0.0.1' + EMAIL_DRAFT_ROUTE, { method: 'POST', headers: { 'content-type': 'application/octet-stream', 'x-dsh-email-draft': '1', 'x-dsh-draft-id': draft.id, 'x-dsh-draft-revision': String(revision), 'x-dsh-draft-filename': encodeURIComponent('中文说明.txt') }, body: text }))
  const response = await upload(1, 'owned bytes'); assert.equal(response.status, 200); const changed = (await response.json()).value
  assert.equal((await upload(1, 'stale')).status, 409)
  const stored = await x.store.get(draft.id); assert.equal(stored.attachments.length, 1); assert.equal(stored.attachments[0].owned, true)
  const copied = await x.backend.action({ action: 'copy', id: draft.id, revision: changed.revision, confirmed: true })
  await x.backend.action({ action: 'delete', id: draft.id, revision: changed.revision, confirmed: true })
  await assert.rejects(stat(stored.attachments[0].path), { code: 'ENOENT' })
  const preview = await x.backend.action({ action: 'preview', id: copied.id, revision: copied.revision }); assert.equal(preview.attachments[0].size, 11)
})
test('configured attachment caps and the 50-draft limit stop excessive data', async t => {
  const x = await setup(t), path = join(x.home, 'large.txt'); await writeFile(path, '1234567890'); x.config.maxAttachmentBytes = 5
  // The existing resolver clamps the cap to at least 1024 bytes.
  await writeFile(path, Buffer.alloc(2048)); x.config.maxAttachmentBytes = 1024
  await assert.rejects(x.backend.create({ ...x.fields, attachments: [path] }), /附件.*上限/)
  for (let i = 0; i < 50; i++) await x.store.create(x.fields)
  await assert.rejects(x.store.create(x.fields), /50 份草稿/)
})
test('the authenticated carrier route rejects CSRF, missing custom headers and unknown download handles', async t => {
  const x = await setup(t)
  assert.equal((await x.request({ action: 'list' }, { origin: 'https://untrusted.test' })).status, 403)
  assert.equal((await x.request({ action: 'list' }, { origin: 'dsh-app://app.evil' })).status, 403)
  assert.equal((await x.request({ action: 'list' }, { 'sec-fetch-site': 'cross-site' })).status, 403)
  assert.equal((await x.request({ action: 'list' }, { origin: 'dsh-app://app' })).status, 200)
  assert.equal((await x.request({ action: 'list' }, { origin: 'dsh-app://app', 'sec-fetch-site': 'cross-site' })).status, 200)
  assert.equal((await x.request({ action: 'list' }, { 'x-dsh-email-draft': '' })).status, 403)
  assert.equal((await x.backend.fetch(new Request('http://127.0.0.1' + EMAIL_DRAFT_ROUTE + '?preview=missing&attachment=../secret'))).status, 404)
  const routes = []; installEmailDrafts({ inject(_names, callback) { callback({ connection: { fetch: { register(value) { routes.push(value) } } } }) } }, x.backend)
  assert.equal(routes[0].path, EMAIL_DRAFT_ROUTE); assert.equal(routes[0].requestBody, 'buffered'); assert.deepEqual(routes[0].methods, ['POST', 'GET'])
  assert.equal(routes[1].path, EMAIL_DRAFT_ROUTE + '/upload'); assert.equal(routes[1].requestBody, 'streaming'); assert.deepEqual(routes[1].methods, ['POST'])
})
test('rules use optimistic concurrency, match all Cc addresses and never send while checking', async t => {
  const x = await setup(t), policy = { skipApproval: true, addresses: ['alice@example.test'], domains: [] }
  const saved = await x.backend.action({ action: 'saveRules', account: 'default', policy, revision: 1 }); assert.equal(saved.revision, 2)
  await assert.rejects(x.backend.action({ action: 'saveRules', account: 'default', policy, revision: 1 }), { code: 'SETTINGS_CONFLICT' })
  const result = await x.backend.action({ action: 'matchRules', account: 'default', policy, to: 'alice@example.test', cc: 'stranger@example.test' }); assert.equal(result.skipsApproval, false); assert.equal(result.rows.length, 2); assert.equal(x.sends.length, 0)
})
test('header newlines and oversized text never enter draft storage', () => {
  assert.throws(() => draftFields({ to: 'a@example.test\nBcc: b@example.test' }))
  assert.throws(() => draftFields({ text: '中'.repeat(35000) }), /100 KiB/)
})

test('batch delete removes dozens of drafts atomically, cleans owned uploads, keeps originals and invalidates previews', async t => {
  const x = await setup(t)
  const originalPath = join(x.home, 'keep-original.txt')
  await writeFile(originalPath, 'must stay intact')

  const created = []
  for (let i = 0; i < 30; i++) {
    const draft = await x.backend.create({ ...x.fields, subject: `批量草稿 #${i + 1}`, ...(i === 0 ? { attachments: [originalPath] } : {}) })
    created.push(draft)
  }

  // Upload an owned attachment on draft #1 (to be deleted) and draft #29 (to be kept).
  const uploadFor = async (draft, text) => {
    const res = await x.backend.fetch(new Request('http://127.0.0.1' + EMAIL_DRAFT_ROUTE, {
      method: 'POST',
      headers: {
        'content-type': 'application/octet-stream',
        'x-dsh-email-draft': '1',
        'x-dsh-draft-id': draft.id,
        'x-dsh-draft-revision': String(draft.revision),
        'x-dsh-draft-filename': encodeURIComponent('copy.txt'),
      },
      body: text,
    }))
    assert.equal(res.status, 200)
    return (await res.json()).value
  }
  created[1] = await uploadFor(created[1], 'delete-me-copy')
  created[29] = await uploadFor(created[29], 'keep-me-copy')
  const ownedDeletePath = (await x.store.get(created[1].id)).attachments[0].path
  const ownedKeepPath = (await x.store.get(created[29].id)).attachments[0].path

  // Schedule draft #2 so batch delete also verifies scheduled drafts are cancelled and never fire.
  const sendAt = new Date(Date.now() + 600_000).toISOString()
  created[2] = await x.backend.action({ ...x.fields, action: 'update', id: created[2].id, revision: created[2].revision, sendAt })
  const schedPreview = await x.backend.action({ action: 'preview', id: created[2].id, revision: created[2].revision })
  created[2] = (await x.backend.action({ action: 'schedule', id: created[2].id, preview: schedPreview.id, confirmed: true, sendAt })).draft
  assert.equal(created[2].state, 'scheduled')

  // Create a live preview for draft #3 that must be invalidated by batch deletion.
  const livePreview = await x.backend.action({ action: 'preview', id: created[3].id, revision: created[3].revision })

  const toDelete = created.slice(0, 25)
  const response = await x.request({
    action: 'deleteMany',
    confirmed: true,
    items: toDelete.map(d => ({ id: d.id, revision: d.revision })),
  })
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.ok, true)
  assert.equal(payload.value.removed.length, 25)
  assert.deepEqual(payload.value.skipped, [])

  // Only the 5 untouched drafts remain.
  const remaining = await x.store.list()
  assert.equal(remaining.length, 5)
  assert.deepEqual(new Set(remaining.map(d => d.id)), new Set(created.slice(25).map(d => d.id)))

  // Owned upload of deleted draft (and its now-empty upload folder) is gone; referenced original and kept draft upload remain.
  await assert.rejects(stat(ownedDeletePath), { code: 'ENOENT' })
  await assert.rejects(stat(join(x.store.root, 'draft-uploads', created[1].id)), { code: 'ENOENT' })
  assert.equal(await readFile(originalPath, 'utf8'), 'must stay intact')
  assert.equal(await readFile(ownedKeepPath, 'utf8'), 'keep-me-copy')

  // Invalidated preview cannot download or send.
  assert.equal((await x.backend.fetch(new Request('http://127.0.0.1' + EMAIL_DRAFT_ROUTE + '?preview=' + livePreview.id + '&attachment=any'))).status, 404)
  await assert.rejects(x.backend.action({ action: 'send', id: created[3].id, preview: livePreview.id, confirmed: true }))

  // Fast-forward past scheduled sendAt: deleted scheduled draft must never submit.
  x.tick(700_000)
  await x.backend.runScheduled()
  assert.equal(x.sends.length, 0)
})

test('batch delete preserves sending and concurrently modified drafts while removing unchanged ones', async t => {
  const x = await setup(t)
  const a = await x.backend.create({ ...x.fields, subject: '可删 A' })
  const b = await x.backend.create({ ...x.fields, subject: '发送中 B' })
  const c = await x.backend.create({ ...x.fields, subject: '已修改 C' })
  const d = await x.backend.create({ ...x.fields, subject: '可删 D' })

  await x.store.change(b.id, b.revision, draft => { draft.state = 'sending'; draft.attemptAt = new Date().toISOString() })
  await x.store.change(c.id, c.revision, draft => { draft.subject = '别处已改' })
  const missingId = '11111111-1111-4111-8111-111111111111'

  const result = await x.backend.action({
    action: 'deleteMany',
    confirmed: true,
    items: [
      { id: a.id, revision: a.revision },
      { id: b.id, revision: b.revision },
      { id: c.id, revision: c.revision },
      { id: d.id, revision: d.revision },
      { id: missingId, revision: 1 },
    ],
  })
  assert.deepEqual(result.removed, [a.id, d.id])
  assert.deepEqual(result.skipped, [
    { id: b.id, reason: 'busy' },
    { id: c.id, reason: 'conflict' },
    { id: missingId, reason: 'missing' },
  ])
  assert.deepEqual((await x.store.list()).map(item => item.id).sort(), [b.id, c.id].sort())

  // An all-skipped batch makes no changes and reports every skipped item cleanly.
  const allSkipped = await x.backend.action({
    action: 'deleteMany',
    confirmed: true,
    items: [
      { id: b.id, revision: b.revision },
      { id: c.id, revision: c.revision },
    ],
  })
  assert.deepEqual(allSkipped.removed, [])
  assert.deepEqual(allSkipped.skipped, [
    { id: b.id, reason: 'busy' },
    { id: c.id, reason: 'conflict' },
  ])
  assert.equal((await x.store.list()).length, 2)
})

test('batch delete enforces confirmation, bounds, unique valid ids and carrier CSRF checks', async t => {
  const x = await setup(t)
  const draft = await x.backend.create(x.fields)
  const validItem = { id: draft.id, revision: draft.revision }

  await assert.rejects(x.backend.action({ action: 'deleteMany', items: [validItem] }), /请先确认/)
  await assert.rejects(x.backend.action({ action: 'deleteMany', confirmed: true, items: [] }), /1 到 50/)
  await assert.rejects(
    x.backend.action({ action: 'deleteMany', confirmed: true, items: Array.from({ length: 51 }, (_, i) => ({ id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, revision: 1 })) }),
    /1 到 50/,
  )
  await assert.rejects(x.backend.action({ action: 'deleteMany', confirmed: true, items: [validItem, validItem] }), /无效/)
  await assert.rejects(x.backend.action({ action: 'deleteMany', confirmed: true, items: [{ id: 'not-a-uuid', revision: 1 }] }), /无效/)
  await assert.rejects(x.backend.action({ action: 'deleteMany', confirmed: true, items: [{ id: draft.id, revision: 0 }] }), /无效/)
  assert.equal((await x.request({ action: 'deleteMany', confirmed: true, items: [validItem] }, { origin: 'https://evil.test' })).status, 403)
  assert.equal((await x.request({ action: 'deleteMany', confirmed: true, items: [validItem] }, { 'x-dsh-email-draft': '' })).status, 403)
  assert.equal((await x.store.list()).length, 1, 'rejected requests never delete drafts')
})

test('batch delete skips a scheduled draft that transitions into sending concurrently while deleting other selected drafts', async t => {
  let enterSend
  const sendingStarted = new Promise(resolve => { enterSend = resolve })
  let releaseSend
  const allowFinish = new Promise(resolve => { releaseSend = resolve })
  const x = await setup(t, async (...args) => {
    enterSend()
    await allowFinish
    return { account: args[0], messageId: '<scheduled-race@example.test>', accepted: ['alice@example.test'], rejected: [], response: '250 accepted' }
  })

  const normal = await x.backend.create({ ...x.fields, subject: '普通草稿' })
  let scheduled = await x.backend.create({ ...x.fields, subject: '即将触发的定时草稿' })
  const sendAt = new Date(Date.now() + 600_000).toISOString()
  scheduled = await x.backend.action({ ...x.fields, action: 'update', id: scheduled.id, revision: scheduled.revision, sendAt })
  const preview = await x.backend.action({ action: 'preview', id: scheduled.id, revision: scheduled.revision })
  scheduled = (await x.backend.action({ action: 'schedule', id: scheduled.id, preview: preview.id, confirmed: true, sendAt })).draft
  assert.equal(scheduled.state, 'scheduled')

  // User opened the batch-delete dialog with the scheduled revision; before confirmation, scheduler starts sending it.
  x.tick(601_000)
  const runPromise = x.backend.runScheduled()
  await sendingStarted

  const outcome = await x.backend.action({
    action: 'deleteMany',
    confirmed: true,
    items: [
      { id: normal.id, revision: normal.revision },
      { id: scheduled.id, revision: scheduled.revision },
    ],
  })
  assert.deepEqual(outcome.removed, [normal.id])
  assert.deepEqual(outcome.skipped, [{ id: scheduled.id, reason: 'busy' }])

  // Let the scheduled delivery finish; it must land cleanly in 'sent' state with its receipt.
  releaseSend()
  await runPromise
  const finalList = await x.store.list()
  assert.equal(finalList.length, 1)
  assert.equal(finalList[0].id, scheduled.id)
  assert.equal(finalList[0].state, 'sent')
  assert.equal(finalList[0].receipt?.messageId, '<scheduled-race@example.test>')
})
