import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailPool, resolveEmailSettings, stripHtml, truncateText, flattenAddresses, sanitizeFilename, parseRawMessage } from '../lib/index.js'

test('stripHtml drops tags, keeps text, turns block tags into newlines', () => {
  const html = '<html><head><style>x{}</style></head><body><p>第一段</p><p>第二<br>行</p><script>bad()</script>尾</body></html>'
  const text = stripHtml(html)
  assert.ok(text.includes('第一段'))
  assert.ok(text.includes('第二'))
  assert.ok(text.includes('行'))
  assert.ok(text.includes('尾'))
  assert.ok(!text.includes('<p>'))
  assert.ok(!text.includes('bad()'))
})

test('stripHtml decodes common entities', () => {
  assert.equal(stripHtml('<p>A&nbsp;&amp;&nbsp;B &lt;tag&gt; &quot;q&quot;</p>'), 'A & B <tag> "q"')
})

test('truncateText keeps short text and hard-cuts long text without a break', () => {
  assert.deepEqual(truncateText('short', 100), { text: 'short', truncated: false })
  const long = 'x'.repeat(500)
  const out = truncateText(long, 100)
  assert.equal(out.truncated, true)
  assert.equal(out.text.slice(0, 100), 'x'.repeat(100))
  assert.ok(out.text.includes('已截断'))
})

test('email_read 对无空格超长中文正文硬截断，正文可读且非空', async () => {
  const bodyText = '中'.repeat(21000)
  const source = Buffer.from([
    'From: Alice <alice@example.com>',
    'To: me@example.com',
    'Subject: 超长中文正文',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    bodyText,
  ].join('\r\n'))
  const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'a@b.c', password: 'p' }))
  pool.withImap = async (_account, _folder, run) => run({
    mailbox: { exists: 1, uidValidity: 1 },
    async fetchOne(uid) { return { uid, source, bodyStructure: { childNodes: [] } } },
  })
  const read = await pool.read(undefined, 42, '')
  assert.equal(read.truncated, true)
  assert.ok(read.text.startsWith('中'.repeat(20000)), '截断处必须保留正文，不能只剩截断提示')
  assert.ok(read.text.length > 20000)
  assert.ok(read.text.includes('已截断'))
})

test('flattenAddresses accepts both array and {value} shapes', () => {
  assert.deepEqual(flattenAddresses([{ name: 'A', address: 'a@x' }]), [{ name: 'A', address: 'a@x' }])
  assert.deepEqual(flattenAddresses({ value: [{ address: 'b@y' }] }), [{ address: 'b@y' }])
  assert.deepEqual(flattenAddresses(undefined), [])
})

test('sanitizeFilename blocks traversal and separators', () => {
  assert.equal(sanitizeFilename('../../etc/passwd'), 'passwd')
  assert.equal(sanitizeFilename('C:\\evil\\file.exe'), 'file.exe')
  assert.equal(sanitizeFilename('a/b/c.txt'), 'c.txt')
  assert.equal(sanitizeFilename('..'), 'attachment.bin')
  assert.equal(sanitizeFilename(''), 'attachment.bin')
  assert.equal(sanitizeFilename('  name with spaces.pdf  '), 'name with spaces.pdf')
})

test('sanitizeFilename strips control chars and bounds length', () => {
  assert.equal(sanitizeFilename('a\u0000b.txt'), 'ab.txt')
  const long = 'x'.repeat(300) + '.pdf'
  const out = sanitizeFilename(long)
  assert.ok(out.length <= 120)
  assert.ok(out.endsWith('.pdf'))
})

test('parseRawMessage extracts subject/from/text and attachment metadata', async () => {
  const source = Buffer.from([
    'From: Alice <alice@example.com>',
    'To: me@example.com',
    'Subject: 测试邮件',
    'Date: Tue, 1 Aug 2026 10:00:00 +0800',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="b"',
    '',
    '--b',
    'Content-Type: text/plain; charset=utf-8',
    '',
    '你好世界',
    '--b',
    'Content-Type: application/pdf; name="report.pdf"',
    'Content-Disposition: attachment; filename="report.pdf"',
    '',
    '%PDF-1.4 fake',
    '--b--',
  ].join('\r\n'))
  const body = await parseRawMessage(source, 20000)
  assert.equal(body.subject, '测试邮件')
  assert.equal(body.from[0].address, 'alice@example.com')
  assert.equal(body.text.trim(), '你好世界')
  assert.equal(body.attachments.length, 1)
  assert.equal(body.attachments[0].filename, 'report.pdf')
  assert.equal(body.attachments[0].part, 'attachment-0')
  assert.equal(body.truncated, false)
})

test('parseRawMessage truncates oversized bodies', async () => {
  const big = 'x'.repeat(3000)
  const source = Buffer.from('From: a@b.c\r\nSubject: big\r\nContent-Type: text/plain\r\n\r\n' + big)
  const body = await parseRawMessage(source, 500)
  assert.equal(body.truncated, true)
  assert.ok(body.text.length < 600)
})

test('selectAttachmentPart maps the mailparser list onto bodyStructure parts', async () => {
  const { selectAttachmentPart } = await import('../lib/index.js')
  const read = [
    { filename: 'img.png', contentType: 'image/png', size: 2048, part: 'attachment-0' },
    { filename: 'report.pdf', contentType: 'application/pdf', size: 100, part: 'attachment-1' },
  ]
  const parts = [
    { part: '2', filename: 'report.pdf', contentType: 'application/pdf', size: 104 },
  ]
  // name match beats index position (inline image shifted the list)
  assert.equal(selectAttachmentPart(read, parts, 1).part, '2')
  // no match for the inline image -> undefined, never the wrong file
  assert.equal(selectAttachmentPart(read, parts, 0), undefined)
  // out of range
  assert.equal(selectAttachmentPart(read, parts, 5), undefined)
  // type + tolerant size fallback when the name differs
  const renamed = [{ filename: 'renamed.bin', contentType: 'application/pdf', size: 95, part: 'attachment-0' }]
  assert.equal(selectAttachmentPart(renamed, parts, 0).part, '2')
})
