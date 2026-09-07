import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parseRawMessage } from '../lib/index.js'

test('the actual mailparser -> html-to-text runtime path resolves a patched deepmerge-ts', () => {
  const require = createRequire(import.meta.url)
  const parserRequire = createRequire(require.resolve('mailparser'))
  const htmlRequire = createRequire(parserRequire.resolve('html-to-text'))
  const entry = htmlRequire.resolve('deepmerge-ts')
  const manifest = JSON.parse(readFileSync(resolve(dirname(entry), '../package.json'), 'utf8'))
  assert.equal(manifest.name, 'deepmerge-ts')
  assert.ok(Number(manifest.version.split('.')[0]) >= 8, 'CVE-2026-40345 requires deepmerge-ts >=8.0.0 on the mailparser dependency path')
})

test('the upgraded parser still converts HTML-only messages into readable text', async () => {
  const source = Buffer.from([
    'From: sender@example.com', 'To: recipient@example.com', 'Subject: HTML regression',
    'MIME-Version: 1.0', 'Content-Type: text/html; charset=utf-8', '',
    '<html><head><style>.hidden {color:red}</style></head><body><h1>中文标题</h1>',
    '<p>Hello &amp; welcome <a href="https://example.com/report">report link</a></p>',
    '<ul><li>First item</li><li>Second item</li></ul><script>doNotIncludeThis()</script></body></html>',
  ].join('\r\n'))
  const parsed = await parseRawMessage(source, 20000)
  assert.equal(parsed.subject, 'HTML regression')
  assert.match(parsed.text, /中文标题/)
  assert.match(parsed.text, /Hello & welcome/)
  assert.match(parsed.text, /First item/)
  assert.match(parsed.text, /https:\/\/example\.com\/report/)
  assert.doesNotMatch(parsed.text, /<p>|doNotIncludeThis|color:red/)
  assert.equal(parsed.truncated, false)
})
