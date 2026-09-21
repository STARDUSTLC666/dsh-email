import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { EmailPool, resolveEmailSettings, selectAttachmentPart } from '../lib/index.js'

const parts = [
  { part: '2', filename: 'report.pdf', contentType: 'application/pdf', size: 5 },
  { part: '3', filename: 'report.pdf', contentType: 'application/pdf', size: 6 },
]

test('real MIME section identity wins over duplicate filenames and list order', () => {
  assert.equal(selectAttachmentPart([parts[1], parts[0]], parts, 0)?.part, '3')
  assert.equal(selectAttachmentPart(parts, parts, 1)?.part, '3')
  assert.equal(selectAttachmentPart([{ ...parts[1], part: '9' }], parts, 0), undefined, 'a missing section must not fall back to a namesake')
})

test('legacy mailparser indexes consume each matching MIME section only once', () => {
  const read = [{ filename: 'inline.png', contentType: 'image/png', size: 900, part: 'attachment-0' },
    ...parts.map((part, i) => ({ ...part, part: 'attachment-' + (i + 1) }))]
  assert.equal(selectAttachmentPart(read, parts, 0), undefined)
  assert.equal(selectAttachmentPart(read, parts, 1)?.part, '2')
  assert.equal(selectAttachmentPart(read, parts, 2)?.part, '3')
})

for (const readFirst of [true, false]) {
  test('downloading duplicate-named attachments preserves their bytes, readFirst=' + readFirst, async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-email-identity-'))
    t.after(() => rmSync(dir, { recursive: true, force: true }))
    const calls = []
    const pool = new EmailPool(resolveEmailSettings({ provider: 'qq', user: 'test@example.com', password: 'fixture' }))
    pool.withImap = async (_account, _folder, run) => run({
      mailbox: { exists: 1, uidValidity: 1 },
      async fetchOne(uid, query) {
        calls.push(['fetch', query])
        return { uid, envelope: { subject: 'Reports', from: [], to: [], cc: [] }, bodyStructure: { childNodes: [
          { part: '1', type: 'text/plain', size: 4 },
          ...parts.map(part => ({ ...part, type: part.contentType, disposition: 'attachment', dispositionParameters: { filename: part.filename } })),
        ] } }
      },
      async download(_uid, part) {
        calls.push(['download', part])
        const data = { '1': 'body', '2': 'first', '3': 'second' }[part]
        return { meta: { filename: 'report.pdf' }, content: Readable.from([Buffer.from(data)]) }
      },
    })
    if (readFirst) assert.deepEqual((await pool.read(undefined, 7, '')).attachments.map(part => part.part), ['2', '3'])
    const second = await pool.downloadAttachment(undefined, '', 7, 1, dir)
    const first = await pool.downloadAttachment(undefined, '', 7, 0, dir)
    assert.equal(readFileSync(second.path, 'utf8'), 'second')
    assert.equal(readFileSync(first.path, 'utf8'), 'first')
    assert.notEqual(first.path, second.path, 'same-named downloads must not overwrite each other')
    assert.deepEqual(calls.filter(call => call[0] === 'download').map(call => call[1]), readFirst ? ['1', '3', '2'] : ['3', '2'])
    const fetches = calls.filter(call => call[0] === 'fetch')
    assert.equal(fetches.length, 1, 'preserve the attachment-index cache')
    assert.equal(fetches[0][1].source, undefined, 'do not download the entire message')
  })
}
