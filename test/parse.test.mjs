import test from 'node:test'
import assert from 'node:assert/strict'
import { stripHtml, truncateText, flattenAddresses, sanitizeFilename, parseRawMessage } from '../lib/index.js'

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

test('truncateText keeps short text and marks long text', () => {
  assert.deepEqual(truncateText('short', 100), { text: 'short', truncated: false })
  const long = 'x'.repeat(500)
  const out = truncateText(long, 100)
  assert.equal(out.truncated, true)
  assert.ok(out.text.length < 120)
  assert.ok(out.text.includes('已截断'))
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
