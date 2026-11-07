import test from 'node:test'
import assert from 'node:assert/strict'
import { taskSessionKey, taskSessionId, taskSessionTitle, taskSessionPrompt, TASK_SESSION_PROMPT_LIMIT } from '../lib/task-session.js'
import { resolveEmailSettings } from '../lib/config.js'

test('stable identity prefers the Message-ID header over account/folder/uid', () => {
  const key = taskSessionKey('<abc@mail.test>', 'default', 'INBOX', 42)
  assert.equal(key, key.toLowerCase()) // normalized so the same Message-ID always maps to one session
  assert.ok(key.includes('abc@mail.test'))
  const fallback = taskSessionKey('', 'default', 'INBOX', 42)
  assert.ok(fallback.includes('42'))
  assert.notEqual(taskSessionId(key), taskSessionId(fallback))
})

test('session ids are deterministic 64-hex derivations of the stable key', () => {
  const id = taskSessionId(taskSessionKey('<x@y>', 'default', 'INBOX', 1))
  assert.match(id, /^session-email-[0-9a-f]{64}$/)
  assert.equal(id, taskSessionId(taskSessionKey('<x@y>', 'default', 'INBOX', 1)))
})

test('the seeded prompt carries the pointers needed to re-read the mail and honors the excerpt cap', () => {
  const long = 'x'.repeat(TASK_SESSION_PROMPT_LIMIT + 500)
  const text = taskSessionPrompt({ account: 'default', folder: 'INBOX', uid: 7, subject: '测试主题', from: 'a@b.c', date: '2026-11-06T08:00:00Z', text: long })
  for (const needle of ['default', 'INBOX', '7', '测试主题', 'a@b.c', '2026-11-06T08:00:00Z']) assert.ok(text.includes(needle))
  assert.ok(text.length < long.length + 400)
  assert.ok(text.includes('正文已截断'))
  assert.equal(taskSessionPrompt({ account: 'a', folder: 'f', uid: 1, subject: '', from: '', date: '', text: '' }).includes('(无主题)'), true)
})

test('the workspace setting defaults to empty so sessions follow the global default', () => {
  const manual = { user: 'a@b.test', password: 'p', imap: { host: 'imap.b.test', port: 993, secure: true }, smtp: { host: 'smtp.b.test', port: 465, secure: true } }
  assert.equal(resolveEmailSettings({ provider: '', ...manual }).taskSessionWorkspace, '')
  assert.equal(resolveEmailSettings({ provider: '', ...manual, taskSessionWorkspace: '/srv/dsh-default' }).taskSessionWorkspace, '/srv/dsh-default')
})

test('the seeded prompt carries the explicit user requirement when one is given', () => {
  const text = taskSessionPrompt({ account: 'default', folder: 'INBOX', uid: 7, subject: '测试主题', from: 'a@b.c', date: '2026-11-06T08:00:00Z', text: '正文' }, '识别告警设备并查库存，输出处理建议')
  assert.ok(text.includes('处理需求：'))
  assert.ok(text.includes('识别告警设备并查库存，输出处理建议'))
  const fallback = taskSessionPrompt({ account: 'a', folder: 'f', uid: 1, subject: '', from: '', date: '', text: '' })
  assert.ok(fallback.includes('(用户未填写额外需求，请自行判断处理)'))
})

test('runEmailTaskSession passes the configured workspace as cwd and pins the title via rename', async () => {
  const { runEmailTaskSession } = await import('../lib/task-session.js')
  let createArgs, renameArgs, promptArgs, attached
  const controller = {
    create: async (req) => { createArgs = req },
    rename: async (req) => { renameArgs = req },
    prompt: async (req) => { promptArgs = req },
  }
  const registry = { resolveByPath: async (path) => { attached = path; return { attachSession: async () => {} } } }
  const runtime = {
    getEffectiveSettings: () => ({ taskSessionWorkspace: '/home/xajc/mail' }),
    getPool: () => ({ read: async () => ({ messageId: '<m@t>', subject: '磁盘告警 Disk-01 使用率 92%', from: [{ address: 'a@b.c' }], date: new Date('2026-11-07T08:00:00Z'), text: '正文' }) }),
  }
  const res = await runEmailTaskSession({ ctx: { sessionController: controller, get: () => registry }, runtime, account: 'default', folder: 'INBOX', uid: 9, requirement: '查库存' })
  assert.equal(res.created, true)
  assert.equal(createArgs.sessionId, taskSessionId(taskSessionKey('<m@t>', 'default', 'INBOX', 9)))
  assert.equal(createArgs.cwd, '/home/xajc/mail')
  assert.equal(attached, '/home/xajc/mail') // 会话必须 attach 进 mail 工作区（侧边栏分组）
  assert.equal(renameArgs.title, res.title)
  assert.ok(renameArgs.title.startsWith('邮件处理：磁盘'))
  assert.ok(promptArgs.content[0].text.includes('处理需求：'))
})

test('runEmailTaskSession prefers the explicit workspace argument over the configured default', async () => {
  const { runEmailTaskSession } = await import('../lib/task-session.js')
  let createArgs, attached
  const controller = {
    create: async (req) => { createArgs = req },
    rename: async () => {},
    prompt: async () => {},
  }
  const registry = { resolveByPath: async (path) => { attached = path; return { attachSession: async () => {} } } }
  const runtime = {
    getEffectiveSettings: () => ({ taskSessionWorkspace: '/home/xajc/mail' }),
    getPool: () => ({ read: async () => ({ messageId: '<o@t>', subject: '季度报告', from: [{ address: 'a@b.c' }], date: '2026-11-07T08:00:00Z', text: 'x' }) }),
  }
  const res = await runEmailTaskSession({ ctx: { sessionController: controller, get: () => registry }, runtime, account: 'default', folder: 'INBOX', uid: 11, workspace: '/home/xajc/mingdaoyun' })
  assert.equal(res.created, true)
  assert.equal(createArgs.cwd, '/home/xajc/mingdaoyun')
  assert.equal(attached, '/home/xajc/mingdaoyun')
})

test('runEmailTaskSession omits cwd when the workspace setting is empty and tolerates rename failure', async () => {
  const { runEmailTaskSession } = await import('../lib/task-session.js')
  let createArgs, renamed = false
  const controller = {
    create: async (req) => { createArgs = req },
    rename: async () => { renamed = true; throw new Error('gateway/internal renaming is unavailable') },
    prompt: async () => {},
  }
  const runtime = {
    getEffectiveSettings: () => ({ taskSessionWorkspace: '' }),
    getPool: () => ({ read: async () => ({ messageId: '<n@t>', subject: '周报', from: [{ address: 'a@b.c' }], date: '2026-11-07T08:00:00Z', text: 'x' }) }),
  }
  const res = await runEmailTaskSession({ ctx: { sessionController: controller }, runtime, account: 'default', folder: 'INBOX', uid: 10 })
  assert.equal(res.created, true)
  assert.equal(createArgs.cwd, undefined) // 空设置 = 不传 cwd，跟随 Host 默认
  assert.equal(renamed, true) // rename 被尝试过
})

test('runEmailTaskSession leaves the session in the default group when the registry has no workspace at the path', async () => {
  const { runEmailTaskSession } = await import('../lib/task-session.js')
  let attached = 0
  const controller = { create: async () => {}, rename: async () => {}, prompt: async () => {} }
  const registry = { resolveByPath: async () => undefined } // 目录存在但未注册 workspace
  const runtime = {
    getEffectiveSettings: () => ({ taskSessionWorkspace: '/unregistered/path' }),
    getPool: () => ({ read: async () => ({ messageId: '<p@t>', subject: '未注册工作区', from: [{ address: 'a@b.c' }], date: '2026-11-07T08:00:00Z', text: 'x' }) }),
  }
  const res = await runEmailTaskSession({ ctx: { sessionController: controller, get: () => registry }, runtime, account: 'default', folder: 'INBOX', uid: 12 })
  assert.equal(res.created, true)
  assert.equal(attached, 0) // resolveByPath 返回 undefined → 不 attach，会话跟随 Host 默认分组
})
