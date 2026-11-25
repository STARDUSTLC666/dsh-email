import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import fs from 'node:fs/promises'
import path, { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { readFileSync } from 'node:fs'
import {
  ContactsError,
  ContactsStore,
  EmailMailboxBackend,
  MAX_AUTO_CONTACTS,
  contactMatchKeys,
  resolveEmailSettings,
} from '../lib/index.js'

async function tempHome(t) {
  const root = await mkdtemp(join(import.meta.dirname, '.contacts-fixture-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  return root
}

async function storedContactRows(store) {
  const { DatabaseSync } = await import('node:sqlite')
  const db = new DatabaseSync(join(store.root, 'contacts-v2.sqlite3'), { readOnly: true })
  try {
    return db.prepare('SELECT * FROM contact ORDER BY id').all()
  } finally {
    db.close()
  }
}

test('the address book stores curated contacts, sanitizes input and dedupes by address', async (t) => {
  const store = new ContactsStore(await tempHome(t))
  assert.deepEqual(await store.list(), [])

  const alice = await store.save({ name: '  Alice   Zhang ', address: 'Alice@Example.INVALID' })
  assert.equal(alice.address, 'alice@example.invalid')
  assert.equal(alice.name, 'Alice Zhang', 'runs of whitespace collapse')
  assert.equal(alice.source, 'manual')
  assert.match(alice.id, /^[0-9a-f-]{36}$/)

  // Saving the same address again edits the entry instead of duplicating it.
  const renamed = await store.save({ name: 'Alice Z.', address: 'alice@example.invalid' })
  assert.equal(renamed.id, alice.id)
  assert.equal((await store.list()).length, 1)
  assert.equal((await store.list())[0].name, 'Alice Z.')

  const bob = await store.save({ name: 'Bob', address: 'bob@example.invalid', note: ' 供应商 ' })
  assert.equal(bob.note, '供应商')
  assert.deepEqual((await store.list()).map(row => row.name), ['Alice Z.', 'Bob'], 'curated entries sort by name')

  // Header-unsafe characters never reach a rendered name or a composed header.
  const risky = await store.save({ name: 'Mallory <ceo@evil.example>, "x"', address: 'mallory@example.invalid' })
  assert.doesNotMatch(risky.name, /[<>",;]/)

  await assert.rejects(() => store.save({ name: 'x', address: 'not-an-address' }), ContactsError)
  await assert.rejects(() => store.save({ name: 'x', address: 'a@b@c' }), ContactsError)
  await assert.rejects(() => store.save({ name: 'x', address: '' }), ContactsError)

  // Editing by id keeps the identity even when the address changes.
  const moved = await store.save({ id: bob.id, name: 'Bob', address: 'bob2@example.invalid' })
  assert.equal(moved.id, bob.id)
  assert.equal(moved.address, 'bob2@example.invalid')

  await store.remove(moved.id)
  assert.deepEqual((await store.list()).map(row => row.address).sort(), ['alice@example.invalid', 'mallory@example.invalid'])
  await assert.rejects(() => store.remove(moved.id), ContactsError)
})

test('editing a manual contact cannot merge away another manual contact', async (t) => {
  const home = await tempHome(t), store = new ContactsStore(home)
  const alice = await store.save({ name: 'Alice', address: 'alice@example.invalid', note: 'Alice note' })
  const bob = await store.save({ name: 'Bob', address: 'bob@example.invalid', note: 'Bob note' })
  const before = await store.list()
  const storedBefore = await storedContactRows(store)

  await assert.rejects(
    () => store.save({ id: alice.id, name: 'Alice changed', address: ' BOB@EXAMPLE.INVALID ', note: 'Overwrite attempt' }),
    error => error instanceof ContactsError && error.code === 'contact-conflict' && /另一位手工联系人/.test(error.message),
  )

  assert.equal(before.length, 2)
  assert.ok(before.some(row => row.id === bob.id))
  assert.deepEqual(await store.list(), before, 'both complete records remain unchanged after rejection')
  assert.deepEqual(await new ContactsStore(home).list(), before, 'reopening the book still has both curated records')
  assert.deepEqual(await storedContactRows(store), storedBefore, 'the SQLite rows, including names and notes, are unchanged')
})

test('editing can clear name and note while omitted fields preserve existing values', async (t) => {
  const home = await tempHome(t), store = new ContactsStore(home)
  const contact = await store.save({ name: 'Alice', address: 'alice@example.invalid', note: 'Keep this note' })

  const omitted = await store.save({ id: contact.id, address: contact.address })
  assert.equal(omitted.name, 'Alice')
  assert.equal(omitted.note, 'Keep this note')
  assert.equal((await new ContactsStore(home).list())[0].note, 'Keep this note')

  const clearedName = await store.save({ id: contact.id, address: contact.address, name: '' })
  assert.equal(clearedName.name, '')
  assert.equal(clearedName.note, 'Keep this note', 'clearing name does not clear an omitted note')

  const restoredName = await store.save({ id: contact.id, address: contact.address, name: 'Alice' })
  assert.equal(restoredName.note, 'Keep this note')
  const clearedNote = await store.save({ id: contact.id, address: contact.address, note: '' })
  assert.equal(clearedNote.name, 'Alice', 'clearing note does not clear an omitted name')
  assert.equal(Object.hasOwn(clearedNote, 'note'), false, 'the response omits a cleared optional note')

  const cleared = await store.save({ id: contact.id, address: contact.address, name: '', note: '' })
  assert.equal(cleared.name, '')
  assert.equal(Object.hasOwn(cleared, 'note'), false)

  const reopened = await new ContactsStore(home).list()
  assert.equal(reopened.length, 1)
  assert.equal(reopened[0].name, '')
  assert.equal(reopened[0].note, undefined)
  const [stored] = await storedContactRows(store)
  assert.equal(stored.name, '')
  assert.equal(stored.note, '', 'SQLite persists the explicit clear instead of the previous note')
  assert.equal(stored.keys, 'alice', 'cleared names no longer contribute search keys')
})

test('editing a manual contact may safely absorb its duplicate auto-collected row', async (t) => {
  const home = await tempHome(t), store = new ContactsStore(home)
  const alice = await store.save({ name: 'Alice', address: 'alice@example.invalid', note: 'Curated note' })
  await store.observe([{ name: 'Alice From Header', address: 'colleague@example.invalid' }])
  const learned = (await store.list()).find(row => row.address === 'colleague@example.invalid')
  assert.ok(learned)

  const updated = await store.save({ id: alice.id, name: 'Alice', address: learned.address })
  assert.equal(updated.id, alice.id)
  assert.equal(updated.source, 'manual')
  assert.equal(updated.note, 'Curated note', 'an omitted note remains curated')
  const rows = await store.list()
  assert.equal(rows.length, 1)
  assert.equal(rows[0].id, alice.id)
  assert.equal(rows[0].address, learned.address)
  assert.equal(rows[0].note, 'Curated note')
  assert.equal(rows[0].uses, learned.uses)
  assert.deepEqual(await new ContactsStore(home).list(), rows)
  assert.equal((await storedContactRows(store)).length, 1)
})

test('suggestions rank exact and prefix matches, then curated entries before learned ones', async (t) => {
  const store = new ContactsStore(await tempHome(t))
  await store.save({ name: 'Alice Zhang', address: 'alice@example.invalid' })
  await store.save({ name: 'Zhang Wei', address: 'zhang@example.invalid' })
  await store.observe([
    { name: 'Zhang Support', address: 'support@zhang.example.invalid' },
    { name: 'Alice Team', address: 'team@alice.example.invalid' },
  ], { now: '2026-11-19T00:00:00.000Z' })

  assert.deepEqual((await store.suggest('alice@example.invalid')).map(row => row.address), ['alice@example.invalid'])
  const zhang = await store.suggest('zhang')
  assert.deepEqual(zhang.map(row => row.address), ['zhang@example.invalid', 'support@zhang.example.invalid', 'alice@example.invalid'])
  assert.equal(zhang[0].address, 'zhang@example.invalid', 'name prefix beats a domain match')
  assert.equal((await store.suggest('')).length, 4)
  assert.equal((await store.suggest('', 2)).length, 2)
  assert.deepEqual(await store.suggest('nothing-matches'), [])
})

test('harvesting learns correspondents without overwriting curated names or self addresses', async (t) => {
  const home = await tempHome(t)
  const store = new ContactsStore(home)
  const curated = await store.save({ name: 'Alice Zhang', address: 'alice@example.invalid' })
  const first = await store.observe([
    { name: 'Alice Header', address: 'alice@example.invalid' },
    { name: 'Bob', address: 'bob@example.invalid' },
    { name: 'Owner', address: 'me@example.invalid' },
    { address: 'ME@example.invalid' },
    { address: 'not-an-address' },
    null,
  ], { self: ['me@example.invalid'], now: '2026-11-19T00:00:00.000Z' })
  assert.deepEqual(first, { added: 1, updated: 1 })

  const rows = await store.list()
  assert.deepEqual(rows.map(row => row.address).sort(), ['alice@example.invalid', 'bob@example.invalid'])
  assert.equal(rows.find(row => row.address === 'alice@example.invalid').name, 'Alice Zhang', 'a curated name always wins')
  assert.equal(rows.find(row => row.address === 'alice@example.invalid').id, curated.id)

  // A learned entry keeps the first real header name but still counts usage.
  await store.observe([{ name: 'Bob Different', address: 'bob@example.invalid' }], { now: '2026-11-20T00:00:00.000Z' })
  const bob = (await store.list()).find(row => row.address === 'bob@example.invalid')
  assert.equal(bob.name, 'Bob')
  assert.equal(bob.uses, 2)
  assert.equal(bob.lastSeenAt, '2026-11-20T00:00:00.000Z')

  // A nameless learned entry is completed by the first name the header carries.
  await store.observe([{ address: 'nobody@example.invalid' }], { now: '2026-11-20T00:00:00.000Z' })
  await store.observe([{ name: 'Nobody Real', address: 'nobody@example.invalid' }], { now: '2026-11-20T01:00:00.000Z' })
  assert.equal((await store.list()).find(row => row.address === 'nobody@example.invalid').name, 'Nobody Real')

  // Repeating the same headers updates usage, and the book survives a restart:
  // the SQLite file is the store, and it is reopened on every operation.
  assert.ok(await stat(join(store.root, 'contacts-v2.sqlite3')).then(row => row.size > 0))
  const reopened = new ContactsStore(home)
  const persisted = await reopened.list()
  assert.equal(persisted.find(row => row.address === 'bob@example.invalid').uses, 2)
})

test('the learned pool is bounded, keeping the most used correspondents', async (t) => {
  const home = await tempHome(t)
  const store = new ContactsStore(home)
  await mkdir(store.root, { recursive: true })
  const rows = Array.from({ length: MAX_AUTO_CONTACTS }, (_, index) => ({
    id: '00000000-0000-4000-8000-' + String(index).padStart(12, '0'),
    name: 'Auto ' + index,
    address: 'auto' + index + '@example.invalid',
    source: 'auto',
    uses: index,
    lastSeenAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }))
  await writeFile(join(store.root, 'contacts-v1.json'), JSON.stringify({ version: 1, contacts: rows }))
  assert.equal((await store.list()).length, MAX_AUTO_CONTACTS)

  const result = await store.observe([{ name: 'Newest', address: 'newest@example.invalid' }], { now: '2026-11-19T00:00:00.000Z' })
  assert.equal(result.added, 1)
  const after = await store.list()
  assert.equal(after.length, MAX_AUTO_CONTACTS, 'the pool never grows past its cap')
  assert.ok(after.some(row => row.address === 'newest@example.invalid'))
  assert.ok(!after.some(row => row.address === 'auto0@example.invalid'), 'the least-used entry is evicted')
})

test('Chinese names are reachable by 汉字, full pinyin, initials and 工号', async (t) => {
  const store = new ContactsStore(await tempHome(t))
  await store.save({ name: '张小明(技术二部)', address: '100123@example.invalid' })
  await store.save({ name: '曾伟', address: 'zeng@example.invalid' })
  await store.save({ name: 'Alice Zhang', address: 'alice@example.invalid' })

  const addresses = async query => (await store.suggest(query)).map(row => row.address)
  assert.deepEqual(await addresses('张小'), ['100123@example.invalid'], '汉字前缀')
  assert.deepEqual(await addresses('zhangxiaoming'), ['100123@example.invalid'], '全拼')
  assert.deepEqual(await addresses('zhangxiao'), ['100123@example.invalid'], '全拼前缀')
  assert.deepEqual(await addresses('zxm'), ['100123@example.invalid'], '首字母')
  assert.deepEqual(await addresses('100123'), ['100123@example.invalid'], '工号')
  assert.deepEqual(await addresses('jseb'), ['100123@example.invalid'], '部门首字母')

  // 曾 is only searchable as zeng here: `ceng` is the plain reading of a surname
  // nobody types, so the surname reading must win.
  assert.deepEqual(await addresses('zeng'), ['zeng@example.invalid'])
  assert.ok((await store.suggest('zengwei')).some(row => row.address === 'zeng@example.invalid'))

  // A latin name keeps working, and its keys never shadow an address prefix.
  assert.deepEqual(await addresses('alice'), ['alice@example.invalid'])
  assert.deepEqual((await addresses('zhang')).sort(), ['100123@example.invalid', 'alice@example.invalid'])
})

test('stored keys cover the mailbox local part and the pinyin of every Chinese run', () => {
  assert.equal(contactMatchKeys('张小明(技术二部)', '100123@example.invalid'),
    'zhangxiaoming zxm jishuerbu jseb 100123')
  assert.equal(contactMatchKeys('', 'jdoe@example.invalid'), 'jdoe')
  assert.equal(contactMatchKeys('Alice Zhang', 'alice.zhang@example.invalid'), 'alice zhang alice.zhang')
})

test('a damaged address book is reported instead of silently replaced', async (t) => {
  const store = new ContactsStore(await tempHome(t))
  await mkdir(store.root, { recursive: true })
  await writeFile(join(store.root, 'contacts-v1.json'), '{not json')
  await assert.rejects(() => store.list(), error => error instanceof ContactsError && error.code === 'contact-storage')
  assert.equal(await readFile(join(store.root, 'contacts-v1.json'), 'utf8'), '{not json', 'the original file is preserved')
})

test('legacy contacts migration rejects an external file substituted at the open boundary', async t => {
  const home = await tempHome(t), store = new ContactsStore(home)
  await mkdir(store.root, { recursive: true })
  const legacy = join(store.root, 'contacts-v1.json'), outside = join(home, 'outside-contacts.json')
  await writeFile(legacy, JSON.stringify({ version: 1, contacts: [] }))
  await writeFile(outside, JSON.stringify({ version: 1, contacts: [] }))
  const originalOpen = fs.open
  let replaced = false
  fs.open = async (file, ...args) => {
    if (!replaced && path.resolve(String(file)) === path.resolve(legacy)) {
      replaced = true
      await fs.rename(legacy, legacy + '.checked')
      if (process.platform === 'win32') await fs.link(outside, legacy)
      else await fs.symlink(outside, legacy)
    }
    return originalOpen.call(fs, file, ...args)
  }
  try {
    await assert.rejects(store.list(), error => error instanceof ContactsError && error.code === 'contact-storage')
    assert.equal(replaced, true)
  } finally {
    fs.open = originalOpen
  }
})

/** Mailbox backend fixture: one account, one message, a real private address book. */
async function mailboxFixture(t) {
  const root = await tempHome(t)
  const config = { provider: 'agentmail', user: 'me@example.invalid', apiKey: 'synthetic-secret' }
  const settings = resolveEmailSettings(config)
  const message = {
    account: 'default', uid: 7, folder: 'INBOX', date: '2026-11-19T00:00:00.000Z',
    from: [{ name: 'Alice', address: 'alice@example.invalid' }],
    to: [{ address: 'me@example.invalid' }],
    cc: [{ name: 'Bob', address: 'bob@example.invalid' }],
    subject: 'hello', text: 'body', attachments: [], truncated: false,
  }
  const pool = {
    list: async () => ({
      account: 'default', folder: 'INBOX', count: 1, uidValidity: 0,
      messages: [{ uid: 7, date: message.date, from: message.from, subject: message.subject, seen: false, flagged: false, size: 10, hasAttachments: false }],
    }),
    read: async () => message,
  }
  const contacts = new ContactsStore(root)
  const runtime = { getPool: () => pool, getEffectiveSettings: () => settings }
  const backend = new EmailMailboxBackend(runtime, {}, undefined, contacts)
  const request = (body, headers = {}) => backend.fetch(new Request('http://127.0.0.1/api/dsh-email/mailbox', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-dsh-email-mailbox': '1', ...headers },
    body: JSON.stringify(body),
  }))
  return { backend, contacts, request, settings }
}

test('the mailbox route exposes address-book actions without requiring a mail account', async (t) => {
  const noAccounts = { accounts: new Map(), defaultAccount: '' }
  const backend = new EmailMailboxBackend(
    { getPool: () => { throw new Error('no pool') }, getEffectiveSettings: () => noAccounts },
    {},
    undefined,
    new ContactsStore(await tempHome(t)),
  )
  const request = (body, headers = {}) => backend.fetch(new Request('http://127.0.0.1/api/dsh-email/mailbox', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-dsh-email-mailbox': '1', ...headers },
    body: JSON.stringify(body),
  }))

  const saved = await (await request({ action: 'contactSave', name: 'Alice', address: 'alice@example.invalid' })).json()
  assert.equal(saved.ok, true)
  assert.equal(saved.value.address, 'alice@example.invalid')

  const listed = await (await request({ action: 'contacts' })).json()
  assert.deepEqual(listed.value.contacts.map(row => row.name), ['Alice'])

  const removed = await (await request({ action: 'contactDelete', id: saved.value.id })).json()
  assert.equal(removed.ok, true)
  const after = await (await request({ action: 'contacts' })).json()
  assert.deepEqual(after.value.contacts, [])

  // Invalid input is a client error, and the route still refuses unmarked calls.
  const bad = await request({ action: 'contactSave', name: 'x', address: 'nope' })
  assert.equal(bad.status, 400)
  assert.equal((await request({ action: 'contacts' }, { 'x-dsh-email-mailbox': '' })).status, 403)
})

test('the mailbox route reports a manual address conflict and keeps both contacts', async (t) => {
  const f = await mailboxFixture(t)
  const alice = await f.contacts.save({ name: 'Alice', address: 'alice@example.invalid', note: 'Alice note' })
  const bob = await f.contacts.save({ name: 'Bob', address: 'bob@example.invalid', note: 'Bob note' })
  const before = await f.contacts.list()

  const conflict = await f.request({
    action: 'contactSave', id: alice.id, name: 'Alice changed', address: bob.address, note: 'Overwrite attempt',
  })
  assert.equal(conflict.status, 400)
  const result = await conflict.json()
  assert.equal(result.ok, false)
  assert.match(result.error.message, /另一位手工联系人.*未保存任何更改/)
  assert.deepEqual(await f.contacts.list(), before)
  assert.equal((await storedContactRows(f.contacts)).length, 2)
})

test('listing and reading mail teaches the address book the whole conversation', async (t) => {
  const f = await mailboxFixture(t)
  const listed = await (await f.request({ action: 'list', account: 'default', folder: 'INBOX' })).json()
  assert.equal(listed.ok, true)
  assert.deepEqual((await f.contacts.list()).map(row => row.address), ['alice@example.invalid'])

  const read = await (await f.request({ action: 'read', account: 'default', folder: 'INBOX', uid: 7 })).json()
  assert.equal(read.ok, true)
  assert.equal(read.value.subject, 'hello')
  const rows = await f.contacts.list()
  assert.deepEqual(rows.map(row => row.address).sort(), ['alice@example.invalid', 'bob@example.invalid'])
  assert.ok(!rows.some(row => row.address === 'me@example.invalid'), 'own account addresses are never collected')
})

test('a broken or missing address book never breaks mailbox listing', async (t) => {
  const f = await mailboxFixture(t)
  await mkdir(f.contacts.root, { recursive: true })
  await writeFile(join(f.contacts.root, 'contacts-v1.json'), '{broken')
  const listed = await (await f.request({ action: 'list', account: 'default', folder: 'INBOX' })).json()
  assert.equal(listed.ok, true)
  assert.equal(listed.value.messages.length, 1)

  // Without an injected store the mailbox still works and contacts report why.
  const backend = new EmailMailboxBackend(
    { getPool: () => ({ list: async () => ({ account: 'default', folder: 'INBOX', count: 0, uidValidity: 0, messages: [] }) }), getEffectiveSettings: () => f.settings },
    {},
  )
  const response = await backend.fetch(new Request('http://127.0.0.1/api/dsh-email/mailbox', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-dsh-email-mailbox': '1' },
    body: JSON.stringify({ action: 'contacts' }),
  }))
  assert.equal(response.status, 400)
  assert.match((await response.json()).error.message, /通讯录/)
})

/** The client bundle shares one scope; probe the pure address-book helpers in it. */
function loadClientProbe() {
  let client
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
    .replace('return module.exports;', 'module.exports.probe = { adoptContactRows, contactDisplayName, formatAddressList, contactLabelOf, contactMatches, contactRecipientToken, contactCompleteRecipient, contactExactMatch, contactAddressError, contactAddressValue, reset: () => adoptContactRows([]) }; return module.exports;')
  runInNewContext(source, {
    window: { __ModuleLoader__: { load({ factory }) { client = factory(() => ({})) } } },
    Intl, Date, AbortController,
  })
  return client.probe
}

test('the composer reaches 汉字, pinyin, initials and 工号 through the stored keys', () => {
  const probe = loadClientProbe()
  probe.adoptContactRows([
    { id: 'a', name: '张小明(技术二部)', address: '100123@example.invalid', source: 'auto', uses: 2, keys: 'zhangxiaoming zxm jishuerbu jseb 100123' },
    { id: 'b', name: '曾伟', address: 'zeng@example.invalid', source: 'auto', uses: 1, keys: 'zengwei zw' },
  ])
  const hit = query => Array.from(probe.contactMatches(query), row => row.address)
  assert.deepEqual(hit('张小'), ['100123@example.invalid'], '汉字前缀')
  assert.deepEqual(hit('zxm'), ['100123@example.invalid'], '首字母')
  assert.deepEqual(hit('zhangxiaoming'), ['100123@example.invalid'], '全拼')
  assert.deepEqual(hit('100123'), ['100123@example.invalid'], '工号')
  assert.deepEqual(hit('zeng'), ['zeng@example.invalid'], '姓氏读音')
  assert.deepEqual(hit('ceng'), [], 'the plain reading of a surname is not indexed')
  probe.reset()
})

test('the composer resolves names with curated entries first and completes one recipient at a time', () => {
  const probe = loadClientProbe()
  probe.adoptContactRows([
    { id: 'a', name: 'Alice Zhang', address: 'alice@example.invalid', source: 'manual', uses: 1 },
    { id: 'b', name: 'Bob Learned', address: 'bob@example.invalid', source: 'auto', uses: 9 },
    { id: 'c', name: '', address: 'nameless@example.invalid', source: 'auto', uses: 2 },
  ])

  assert.equal(probe.contactDisplayName({ name: 'Alice Header', address: 'alice@example.invalid' }), 'Alice Zhang')
  assert.equal(probe.contactDisplayName({ name: 'Bob Header', address: 'bob@example.invalid' }), 'Bob Header', 'a header name beats a learned name')
  assert.equal(probe.contactDisplayName({ address: 'bob@example.invalid' }), 'Bob Learned', 'a learned name fills a nameless sender')
  assert.equal(probe.contactDisplayName({ name: 'Stranger', address: 'other@example.invalid' }), 'Stranger')
  assert.equal(probe.contactDisplayName({ address: 'unknown@example.invalid' }), '')

  assert.deepEqual(probe.formatAddressList([{ address: 'alice@example.invalid' }, { name: 'Bob', address: 'bob@example.invalid' }]),
    'Alice Zhang <alice@example.invalid>, Bob <bob@example.invalid>')
  assert.equal(probe.contactLabelOf('nameless@example.invalid'), 'nameless@example.invalid')
  assert.equal(probe.contactLabelOf('nobody@example.invalid'), 'nobody@example.invalid')

  assert.deepEqual(Array.from(probe.contactMatches('alice'), row => row.address), ['alice@example.invalid'])
  assert.equal(probe.contactMatches('').length, 3)
  assert.equal(probe.contactMatches('nothing').length, 0)

  const first = probe.contactRecipientToken('alice@example.invalid, bob@exa', 34)
  assert.equal(first.text, ' bob@exa')
  assert.equal(first.left, 22)
  assert.equal(first.right, 30)
  const second = probe.contactRecipientToken('a@b.c; jo', 10)
  assert.equal(second.text, ' jo')
  assert.equal(second.left, 6)
  assert.equal(second.right, 9)

  const contact = { name: 'Alice Zhang', address: 'alice@example.invalid' }
  const filled = probe.contactCompleteRecipient('alice@exa', 9, contact)
  assert.equal(filled.value, 'Alice Zhang <alice@example.invalid>')
  assert.equal(filled.caret, filled.value.length)

  // Completing the second recipient keeps the first one and the separators.
  const appended = probe.contactCompleteRecipient('x@y.com, al', 12, contact)
  assert.equal(appended.value, 'x@y.com, Alice Zhang <alice@example.invalid>')
  assert.equal(appended.caret, appended.value.length)

  // Completing a recipient in the middle leaves the following one untouched.
  const middle = probe.contactCompleteRecipient('a@b.com, zz, c@d.com', 11, contact)
  assert.equal(middle.value, 'a@b.com, Alice Zhang <alice@example.invalid>, c@d.com')

  // A fully typed address is completed on Enter/Tab without picking a row.
  const rows = Array.from(probe.contactMatches(''))
  assert.equal(probe.contactExactMatch(rows, 'alice@example.invalid'), 0)
  assert.equal(probe.contactExactMatch(rows, ' ALICE@example.invalid '), 0)
  assert.equal(probe.contactExactMatch(rows, 'alice@exa'), -1)
  assert.equal(probe.contactExactMatch(rows, ''), -1)

  // Trailing separators are normalized instead of producing a double comma.
  const messy = probe.contactCompleteRecipient('a@b.com,  , ', 11, contact)
  assert.equal(messy.value, 'a@b.com, Alice Zhang <alice@example.invalid>')
  assert.equal(messy.caret, messy.value.length)
  assert.equal(probe.contactAddressValue({ name: 'Alice', address: 'alice@example.invalid' }), 'Alice <alice@example.invalid>')
  assert.equal(probe.contactAddressValue({ name: '', address: 'a@b.c' }), 'a@b.c')
  assert.equal(probe.contactAddressError('a@b.c'), false)
  assert.equal(probe.contactAddressError('a b@c.d'), true)
  probe.reset()
})
