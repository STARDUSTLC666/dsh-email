import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailPool, buildReplyMessage, imapAuthOf, resolveEmailSettings, serializeAccountsYaml, smtpAuthOf, parseAccountsYaml } from '../lib/index.js'

const ALIAS_YAML = 'work: { provider: qq, user: alias@qq.com, password: pw, authUser: login@qq.com, authPassword: realpw, senderName: 别名 }\n'

test('别名账号：登录名、密码与 From 地址彼此独立', () => {
  const cfg = resolveEmailSettings({ accountsYaml: ALIAS_YAML }).accounts.get('work')
  assert.equal(cfg.user, 'alias@qq.com')
  assert.equal(cfg.senderName, '别名')
  assert.equal(cfg.authUser, 'login@qq.com')
  assert.equal(cfg.authPassword, 'realpw')
  assert.deepEqual(imapAuthOf(cfg), { user: 'login@qq.com', pass: 'realpw' })
  assert.deepEqual(smtpAuthOf(cfg), { user: 'login@qq.com', pass: 'realpw' })
})

test('没写 authUser/authPassword 时就还是 user/password（老配置零变化）', () => {
  const cfg = resolveEmailSettings({ provider: 'qq', user: 'me@qq.com', password: 'secret' }).accounts.get('default')
  assert.equal(cfg.authUser, 'me@qq.com')
  assert.equal(cfg.authPassword, 'secret')
  assert.equal(cfg.senderName, '')
  assert.deepEqual(smtpAuthOf(cfg), { user: 'me@qq.com', pass: 'secret' })
})

test('别名账号漏填 authPassword 时报的是 authPassword', () => {
  // authPassword falls back to password, so only an account with neither is incomplete
  const missing = 'work: { provider: qq, user: alias@qq.com, authUser: login@qq.com }\n'
  assert.throws(() => resolveEmailSettings({ accountsYaml: missing }), /authPassword 未填写/)
})

test('发送时 From 用 user，senderName 只做显示名', async () => {
  const settings = resolveEmailSettings({ accountsYaml: ALIAS_YAML })
  const pool = new EmailPool(settings)
  let mail = null
  pool.transporter = () => ({
    async sendMail(options) {
      mail = options
      return { messageId: '<x@qq.com>', accepted: ['to@x.y'], rejected: [], response: '250 OK' }
    },
    close() {},
  })
  await pool.send('work', 'to@x.y', 'subject', 'body', undefined, [])
  assert.deepEqual(mail.from, { name: '别名', address: 'alias@qq.com' })
})

test('没有 senderName 时 From 就是裸地址', async () => {
  const settings = resolveEmailSettings({ provider: 'qq', user: 'me@qq.com', password: 'pw' })
  const pool = new EmailPool(settings)
  let mail = null
  pool.transporter = () => ({
    async sendMail(options) { mail = options; return { messageId: '<y@qq.com>', accepted: [], rejected: [], response: '250 OK' } },
    close() {},
  })
  await pool.send(undefined, 'to@x.y', 'subject', 'body', undefined, [])
  assert.equal(mail.from, 'me@qq.com')
})

test('回复全部时两个身份都不收自己的信', () => {
  const original = {
    from: [{ address: 'alias@qq.com' }],
    to: [{ address: 'other@x.y' }, { address: 'login@qq.com' }],
    cc: [],
    subject: 'hi',
    date: '',
    text: 'body',
    messageId: '<m@x.y>',
    references: '',
  }
  const built = buildReplyMessage(original, 'reply-all', ['alias@qq.com', 'login@qq.com'], 'ok')
  assert.equal(built.to, 'other@x.y')
})

test('accountsYaml 往返保留三个新字段', () => {
  const parsed = parseAccountsYaml(ALIAS_YAML)
  const again = serializeAccountsYaml(parsed.map, parsed.defaultAccount)
  const reparsed = parseAccountsYaml(again).map.work
  assert.equal(reparsed.authUser, 'login@qq.com')
  assert.equal(reparsed.authPassword, 'realpw')
  assert.equal(reparsed.senderName, '别名')
})
