import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { simpleParser } from 'mailparser'
import { EmailPool, prepareMailBody, resolveEmailSettings } from '../lib/index.js'
import { createSmtpPeer } from './helpers/smtp-peer.mjs'

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6300010000050001', 'hex')
const CIDS = ['近三周满意度.png', 'chart-2.png']

test('cid 只在附件清单里能找到时保留，找不到的仍降级成 alt 文本', () => {
  const html = '<p>a</p><img src="cid:近三周满意度.png" alt="满意度" width="520" height="300"><img src="cid:chart-2.png" alt="第二张"><img src="cid:nope.png" alt="缺失">'
  const body = prepareMailBody('说明', html, { cids: CIDS })
  assert.match(body.html, /<img src="cid:img1" alt="满意度" width="520" height="300">/)
  assert.match(body.html, /<img src="cid:img2" alt="第二张">/)
  assert.doesNotMatch(body.html, /cid:nope|src="cid:img3"/)
  assert.match(body.html, /缺失/)
})

test('远程图、data: 图与 file: 图仍然被剥掉，只有 cid 能存活', () => {
  const body = prepareMailBody(undefined, '<img src="https://example.test/track.png" alt="remote"><img src="data:image/png;base64,AAAA" alt="data"><img src="file:///C:/x.png" alt="file">', { cids: CIDS })
  assert.doesNotMatch(body.html, /<img|src=/)
  assert.match(body.html, /remote.*data.*file/s)
})

test('没给 cids 时行为与旧版一致：<img> 一律降级成 alt 文本', () => {
  const body = prepareMailBody(undefined, '<img src="cid:近三周满意度.png" alt="满意度">')
  assert.doesNotMatch(body.html, /<img/)
  assert.match(body.html, /满意度/)
})

test('imgN 按附件顺序解析，越界与非法尺寸被丢弃', () => {
  const body = prepareMailBody(undefined, '<img src="cid:img2" alt="第二" width="9999" height="1"><img src="cid:img9" alt="越界">', { cids: CIDS })
  assert.match(body.html, /<img src="cid:img2" alt="第二">/)
  assert.doesNotMatch(body.html, /width=|height=|cid:img9/)
  assert.match(body.html, /越界/)
})

test('email_send 真正发信时只给被引用的附件挂 cid，并把图改成 cid:imgN', async t => {
  const home = await mkdtemp(join(tmpdir(), 'email-cid-'))
  t.after(() => rm(home, { recursive: true, force: true }))
  const chart = join(home, 'chart.png'), extra = join(home, 'notes.txt')
  await writeFile(chart, PNG)
  await writeFile(extra, 'synthetic')
  const settings = resolveEmailSettings({ provider: 'exmail', user: 'me@example.test', password: 'synthetic' })
  const pool = new EmailPool(settings)
  let mail = null
  pool.transporter = () => ({
    async sendMail(options) {
      mail = options
      return { messageId: '<cid@example.test>', accepted: ['to@example.test'], rejected: [], response: '250 OK' }
    },
    close() {},
  })
  await pool.send(undefined, 'to@example.test', '内联图', '说明', undefined, [chart, extra], undefined, '<p>说明</p><img src="cid:chart.png" alt="满意度" width="520" height="300">')
  assert.match(mail.html, /<img src="cid:img1" alt="满意度" width="520" height="300">/)
  assert.equal(mail.attachments[0].filename, 'chart.png')
  assert.equal(mail.attachments[0].cid, 'img1')
  assert.equal(mail.attachments[1].cid, undefined)
  assert.equal(mail.text, '说明')
})

test('没有 alt 时用附件名兜底，纯图正文也给出纯文本替代', () => {
  const body = prepareMailBody(undefined, '<img src="cid:chart-2.png" width="520">', { cids: CIDS })
  assert.match(body.html, /<img src="cid:img2" alt="chart-2.png" width="520">/)
  assert.equal(body.text, '[chart-2.png]')
})

test('只有标记的正文不会留下空 text', () => {
  const body = prepareMailBody(undefined, '<table><tr><td style="border-top:1px solid #ccc"></td></tr></table>', { cids: CIDS })
  assert.equal(body.text, '（本邮件为 HTML 正文，请用支持 HTML 的客户端查看）')
})

test('非光栅附件（.svg/.html/.txt）不能被当作内联图发出', async t => {
  const home = await mkdtemp(join(tmpdir(), 'email-cid-raster-'))
  t.after(() => rm(home, { recursive: true, force: true }))
  const chart = join(home, 'chart.png'), vector = join(home, 'chart.svg'), page = join(home, 'page.html')
  await writeFile(chart, PNG)
  await writeFile(vector, '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>')
  await writeFile(page, '<p>hi</p>')
  const settings = resolveEmailSettings({ provider: 'exmail', user: 'me@example.test', password: 'synthetic' })
  const pool = new EmailPool(settings)
  let mail = null
  pool.transporter = () => ({
    async sendMail(options) {
      mail = options
      return { messageId: '<cid@example.test>', accepted: ['to@example.test'], rejected: [], response: '250 OK' }
    },
    close() {},
  })
  await pool.send(undefined, 'to@example.test', '内联图白名单', '说明', undefined, [chart, vector, page], undefined,
    '<p>说明</p><img src="cid:chart.png" alt="柱状图"><img src="cid:chart.svg" alt="矢量图"><img src="cid:page.html" alt="网页">')
  assert.match(mail.html, /<img src="cid:img1" alt="柱状图">/)
  assert.doesNotMatch(mail.html, /cid:img2|cid:img3|<img src="cid:chart/)
  assert.match(mail.html, /矢量图/)
  assert.match(mail.html, /网页/)
  assert.equal(mail.attachments[0].cid, 'img1')
  assert.equal(mail.attachments[0].contentDisposition, 'inline')
  assert.equal(mail.attachments[1].cid, undefined)
  assert.equal(mail.attachments[2].cid, undefined)
})

test('非光栅附件排在图片前面时，下标不偏移且不会误给非光栅文件挂 cid', async t => {
  const home = await mkdtemp(join(tmpdir(), 'email-cid-order-'))
  t.after(() => rm(home, { recursive: true, force: true }))
  const notes = join(home, 'notes.txt'), vector = join(home, 'evil.svg'), chart = join(home, 'chart.png')
  await writeFile(notes, 'plain attachment')
  await writeFile(vector, '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
  await writeFile(chart, PNG)
  const settings = resolveEmailSettings({ provider: 'exmail', user: 'me@example.test', password: 'synthetic' })
  const pool = new EmailPool(settings)
  let mail = null
  pool.transporter = () => ({
    async sendMail(options) {
      mail = options
      return { messageId: '<cid-order@example.test>', accepted: ['to@example.test'], rejected: [], response: '250 OK' }
    },
    close() {},
  })
  await pool.send(
    undefined,
    'to@example.test',
    '顺序校验',
    undefined,
    undefined,
    [notes, vector, chart],
    undefined,
    '<p>看图</p><img src="cid:chart.png" alt="真图"><img src="cid:img1" alt="非图1"><img src="cid:img2" alt="非图2"><img src="cid:img3" alt="索引3">',
  )
  assert.match(mail.html, /<img src="cid:img3" alt="真图">/)
  assert.match(mail.html, /<img src="cid:img3" alt="索引3">/)
  assert.doesNotMatch(mail.html, /cid:img1|cid:img2/)
  assert.match(mail.html, /非图1/)
  assert.match(mail.html, /非图2/)
  assert.equal(mail.attachments[0].cid, undefined)
  assert.equal(mail.attachments[0].contentDisposition, undefined)
  assert.equal(mail.attachments[1].cid, undefined)
  assert.equal(mail.attachments[1].contentDisposition, undefined)
  assert.equal(mail.attachments[2].filename, 'chart.png')
  assert.equal(mail.attachments[2].cid, 'img3')
  assert.equal(mail.attachments[2].contentDisposition, 'inline')
})

test('经真实本地 SMTP 发送时，非光栅附件前置仍生成正确的 multipart/related 内联图 MIME', async t => {
  const smtp = await createSmtpPeer()
  t.after(() => smtp.close())
  const home = await mkdtemp(join(tmpdir(), 'email-cid-smtp-'))
  t.after(() => rm(home, { recursive: true, force: true }))
  const notes = join(home, 'notes.txt'), chart = join(home, 'chart.png')
  await writeFile(notes, 'attached text')
  await writeFile(chart, PNG)
  const settings = resolveEmailSettings({
    user: 'me@example.test',
    password: 'synthetic-smtp-fixture',
    proxy: 'direct',
    imap: { host: '127.0.0.1', port: 993, secure: true },
    smtp: { host: '127.0.0.1', port: smtp.port, secure: false },
  })
  const pool = new EmailPool(settings)
  t.after(() => pool.dispose())
  await pool.send(undefined, 'to@example.test', 'MIME E2E', undefined, undefined, [notes, chart], undefined, '<p>周报</p><img src="cid:chart.png" width="320">')
  assert.equal(smtp.messages.length, 1)
  assert.match(smtp.messages[0], /multipart\/related/i)
  assert.match(smtp.messages[0], /Content-ID:\s*<img2>/i)
  const parsed = await simpleParser(smtp.messages[0], { keepCidLinks: true })
  assert.match(parsed.html, /cid:img2/)
  const resolved = await simpleParser(smtp.messages[0])
  assert.match(resolved.html, /src="data:image\/png;base64,/)
  const inlineImg = parsed.attachments.find(a => a.filename === 'chart.png')
  const plainFile = parsed.attachments.find(a => a.filename === 'notes.txt')
  assert.ok(inlineImg)
  assert.equal(inlineImg.cid, 'img2')
  assert.equal(inlineImg.contentDisposition, 'inline')
  assert.ok(plainFile)
  assert.equal(plainFile.cid, undefined)
  assert.equal(plainFile.contentDisposition, 'attachment')
})
