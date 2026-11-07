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
