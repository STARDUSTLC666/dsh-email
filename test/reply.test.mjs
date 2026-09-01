import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReplyMessage, extractMessageIds, MailError } from '../lib/index.js'

const original = {
  from: [{ name: '张三', address: 'zhangsan@example.com' }],
  to: [{ address: 'me@qq.com' }, { address: 'lisi@example.com' }],
  cc: [{ address: 'wangwu@example.com' }],
  subject: '项目进度',
  date: '2026-09-01T10:00:00.000Z',
  text: '第一行\n第二行',
  messageId: 'orig-1@example.com',
  references: 'root-0@example.com',
}

test('reply targets the original sender only, quotes the body, sets thread headers', () => {
  const built = buildReplyMessage(original, 'reply', 'me@qq.com', '收到了')
  assert.equal(built.to, '张三 <zhangsan@example.com>')
  assert.equal(built.subject, 'Re: 项目进度')
  assert.equal(built.inReplyTo, 'orig-1@example.com')
  assert.equal(built.references, 'root-0@example.com orig-1@example.com')
  assert.match(built.text, /^收到了/)
  assert.match(built.text, /> 第一行\n> 第二行/)
  assert.match(built.text, /张三 写道：/)
})

test('reply-all excludes self, dedupes, keeps from + to + cc', () => {
  const built = buildReplyMessage(original, 'reply-all', 'ME@qq.com', 'ok')
  const to = built.to
  assert.ok(to.includes('zhangsan@example.com'))
  assert.ok(to.includes('lisi@example.com'))
  assert.ok(to.includes('wangwu@example.com'))
  assert.ok(!to.toLowerCase().includes('me@qq.com'))
})

test('reply-all falling back to sender when everyone else is self', () => {
  const selfOnly = { ...original, from: [{ address: 'other@x.com' }], to: [{ address: 'me@qq.com' }], cc: [] }
  const built = buildReplyMessage(selfOnly, 'reply-all', 'me@qq.com', 'hi')
  assert.equal(built.to, 'other@x.com')
})

test('subject prefixes never stack', () => {
  const reRe = { ...original, subject: 'Re: Re: 项目进度' }
  assert.equal(buildReplyMessage(reRe, 'reply', 'me@qq.com', 'x').subject, 'Re: 项目进度')
  const fwd = { ...original, subject: 'Re: Fwd: 项目进度' }
  assert.equal(buildReplyMessage(fwd, 'forward', 'me@qq.com', 'x', 'b@y.z').subject, 'Fwd: 项目进度')
})

test('forward needs an explicit recipient and embeds the original', () => {
  assert.throws(
    () => buildReplyMessage(original, 'forward', 'me@qq.com', 'x', ''),
    err => err instanceof MailError && /to 参数/.test(err.message),
  )
  const built = buildReplyMessage(original, 'forward', 'me@qq.com', '看一下这个', 'boss@corp.com')
  assert.equal(built.to, 'boss@corp.com')
  assert.match(built.text, /转发的邮件/)
  assert.match(built.text, /发件人: 张三/)
  assert.match(built.text, /第一行/)
  assert.equal(built.inReplyTo, undefined)
  assert.equal(built.references, 'root-0@example.com orig-1@example.com')
})

test('reply without any sender address fails with an actionable message', () => {
  const noFrom = { ...original, from: [] }
  assert.throws(
    () => buildReplyMessage(noFrom, 'reply', 'me@qq.com', 'x'),
    err => err instanceof MailError && /email_send/.test(err.message),
  )
})

test('no Message-ID means no thread headers, still sends', () => {
  const noId = { ...original, messageId: '', references: '' }
  const built = buildReplyMessage(noId, 'reply', 'me@qq.com', 'x')
  assert.equal(built.inReplyTo, undefined)
  assert.equal(built.references, undefined)
})

test('long original bodies are truncated in the quote', () => {
  const long = { ...original, text: '字'.repeat(5000) }
  const built = buildReplyMessage(long, 'reply', 'me@qq.com', 'x')
  assert.match(built.text, /已截断/)
})

test('extractMessageIds parses folded References and ignores the body', () => {
  const source = Buffer.from(
    'From: a@b.c\r\n'
    + 'Message-ID: <abc@x.y>\r\n'
    + 'References: <one@x.y> <two@x.y>\r\n'
    + ' <three@x.y>\r\n'
    + 'Subject: t\r\n'
    + '\r\n'
    + 'Message-ID: <fake-in-body@x.y>\r\n',
  )
  const ids = extractMessageIds(source)
  assert.equal(ids.messageId, 'abc@x.y')
  assert.equal(ids.references, 'one@x.y two@x.y three@x.y')
})

test('extractMessageIds returns empties when headers are absent', () => {
  const ids = extractMessageIds(Buffer.from('Subject: hi\r\n\r\nbody'))
  assert.equal(ids.messageId, '')
  assert.equal(ids.references, '')
})
