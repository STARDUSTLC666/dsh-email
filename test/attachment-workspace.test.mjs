import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { EmailPool, resolveEmailSettings } from '../lib/index.js'
import { EmailDraftBackend } from '../lib/draft-web.js'
import { DraftStore } from '../lib/draft-store.js'
import { buildEmailTools } from '../lib/tools.js'

async function setup(t) {
  const previous = process.cwd(), home = await mkdtemp(join(import.meta.dirname, '.attachment-workspace-'))
  const startup = join(home, 'startup'), workspace = join(home, 'session')
  await mkdir(startup); await mkdir(workspace)
  await writeFile(join(startup, 'report.txt'), 'startup directory: wrong attachment')
  await writeFile(join(workspace, 'report.txt'), 'session workspace: intended attachment')
  process.chdir(startup)
  t.after(async () => { process.chdir(previous); assert.equal(dirname(home), import.meta.dirname); await rm(home, { recursive: true, force: true }) })
  const settings = resolveEmailSettings({ user: 'sender@example.test', password: 'synthetic', imap: { host: '127.0.0.1' }, smtp: { host: '127.0.0.1' } })
  const pool = new EmailPool(settings), deliveries = []
  pool.transporter = () => ({ async sendMail(message) {
    deliveries.push(await Promise.all(message.attachments.map(file => readFile(file.path, 'utf8'))))
    return { messageId: '<local-only@example.test>', accepted: ['to@example.test'], rejected: [], response: '250 local test' }
  }, close() {} })
  t.after(() => pool.dispose())
  const runtime = { getPool: () => pool, getEffectiveSettings: () => settings, getSettingsValue: () => ({ sendApproval: true }), watch() {} }
  const backend = new EmailDraftBackend(runtime, {}, { store: new DraftStore(home) })
  const tools = buildEmailTools(runtime, { create: (input, signal) => backend.create(input, signal) })
  return { home, startup, workspace, deliveries, backend, send: tools.find(tool => tool.name === 'email_send'), draft: tools.find(tool => tool.name === 'email_draft'), exec: { agent: { session: { header: { cwd: workspace } } } }, input: { to: 'to@example.test', subject: 'Workspace attachment', text: 'Synthetic only', attachments: ['report.txt'] } }
}

test('email_send reads the session attachment when the startup directory contains a different same-name file', async t => {
  const x = await setup(t)
  await x.send.execute(x.input, x.exec)
  assert.deepEqual(x.deliveries, [['session workspace: intended attachment']])
  assert.equal(await readFile(join(x.startup, 'report.txt'), 'utf8'), 'startup directory: wrong attachment')
})

test('email_draft resolves a relative attachment in its session and previews those exact bytes without sending', async t => {
  const x = await setup(t), draft = await x.draft.execute(x.input, x.exec)
  const stored = await x.backend.store.get(draft.id)
  assert.equal(stored.attachments[0].path, join(x.workspace, 'report.txt'))
  const preview = await x.backend.action({ action: 'preview', id: draft.id, revision: 1 })
  const response = await x.backend.fetch(new Request('http://127.0.0.1/api/dsh-email/drafts?preview=' + preview.id + '&attachment=' + preview.attachments[0].id))
  assert.equal(await response.text(), 'session workspace: intended attachment')
  assert.equal(x.deliveries.length, 0)
})

test('absolute attachment paths remain exact and calls without a session retain startup-directory fallback', async t => {
  const x = await setup(t)
  await x.send.execute({ ...x.input, attachments: [join(x.startup, 'report.txt')] }, x.exec)
  await x.send.execute(x.input)
  assert.deepEqual(x.deliveries, [['startup directory: wrong attachment'], ['startup directory: wrong attachment']])
  const draft = await x.draft.execute(x.input)
  assert.equal((await x.backend.store.get(draft.id)).attachments[0].path, join(x.startup, 'report.txt'))
})
