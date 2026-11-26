import test from 'node:test'
import assert from 'node:assert/strict'
import { installSendApproval } from '../lib/approval.js'

function fixture(args) {
  let gate, asks = 0
  const settings = { accounts: new Map([['work', { user: 'self@example.test' }]]), defaultAccount: 'work' }
  const runtime = { getSettingsValue: () => ({ sendApproval: true }), getEffectiveSettings: () => settings, getPool: () => ({}), watch: async () => {} }
  installSendApproval({ on(_event, fn) { gate = fn }, get() { return { request: async () => { asks++; return 'allowed-once' } } } }, runtime)
  const exec = { name: 'email_send', arguments: Object.freeze(args) }
  return { exec, ask: () => gate(exec, async () => ({ kind: 'allow' })), counts: () => ({ asks }) }
}

test('空正文的 email_send 在弹确认框之前就被拒绝', async () => {
  const empty = fixture({ to: 'to@example.test', subject: '主题', account: 'work' })
  const outcome = await empty.ask()
  assert.equal(outcome.kind, 'deny')
  assert.match(outcome.reason, /正文为空|body is empty/)
  assert.equal(empty.counts().asks, 0, '不应先弹确认框')
})

test('只有空白的 text / html 同样视为空正文', async () => {
  for (const args of [{ text: '   ' }, { html: '\n\t' }, { text: '', html: '' }]) {
    const blank = fixture({ to: 'to@example.test', subject: '主题', account: 'work', ...args })
    assert.equal((await blank.ask()).kind, 'deny')
    assert.equal(blank.counts().asks, 0)
  }
})

test('有正文时照常进入审批', async () => {
  for (const body of [{ text: '正文' }, { html: '<p>正文</p>' }, { text: '正文', html: '<p>正文</p>' }]) {
    const ok = fixture({ to: 'to@example.test', subject: '主题', account: 'work', ...body })
    assert.equal((await ok.ask()).kind, 'allow')
    assert.equal(ok.counts().asks, 1)
  }
})

test('email_reply 不受影响', async () => {
  const reply = fixture({ to: 'to@example.test', subject: '主题', account: 'work', text: '回答' })
  reply.exec.name = 'email_reply'
  assert.equal((await reply.ask()).kind, 'allow')
})
