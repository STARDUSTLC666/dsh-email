import test from 'node:test'
import assert from 'node:assert/strict'
import { apply, parseEmailDay } from '../lib/index.js'

function fakeCtx() {
  return {
    approval: { request: async () => 'allowed-once' },
    get(name) { if (name === 'approval') return this.approval; return undefined },
    tools: { register(def) { this.defs.push(def) }, defs: [] },
    listeners: [],
    on(event, fn, opts) { this.listeners.push({ event, fn, opts }) },
    effect(fn) { this.effects.push(fn()) },
    effects: [],
    inject() {},
    logger: { warn() {} },
    settings: {
      register(ns, schema, opts) {
        return {
          get: () => ({ provider: '', user: '', password: '', inboxFolder: 'INBOX', sendApproval: true, maxBodyChars: 20000, downloadDir: '', imap: { host: '', port: 993, secure: true }, smtp: { host: '', port: 465, secure: true } }),
          replace: async () => {},
        }
      },
      writable: true,
    },
  }
}

test('parseEmailDay 接受 YYYY-MM-DD 与完整 ISO', () => {
  assert.equal(parseEmailDay('2026-08-01', 'since').toISOString(), '2026-08-01T00:00:00.000Z')
  assert.equal(parseEmailDay('2026-08-01T12:30:00Z', 'since').toISOString(), '2026-08-01T12:30:00.000Z')
})

test('parseEmailDay endInclusive 返回次日零点（until 含当天）', () => {
  assert.equal(parseEmailDay('2026-08-26', 'until', true).toISOString(), '2026-08-27T00:00:00.000Z')
})

test('parseEmailDay 非法日期抛中文错误', () => {
  assert.throws(() => parseEmailDay('昨天', 'since'), /since 不是有效日期/)
  assert.throws(() => parseEmailDay('', 'until'), /until 不是有效日期/)
})

test('email_list / email_search 参数包含 since 与 until', () => {
  const ctx = fakeCtx()
  apply(ctx, {})
  const list = ctx.tools.defs.find((t) => t.name === 'email_list')
  const search = ctx.tools.defs.find((t) => t.name === 'email_search')
  assert.ok(list.parameters.properties.since)
  assert.ok(list.parameters.properties.until)
  assert.ok(search.parameters.properties.since)
  assert.ok(search.parameters.properties.until)
})
