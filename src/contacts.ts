import { randomUUID } from 'node:crypto'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { pinyin } from 'pinyin-pro'
import type { AddressEntry } from './types.js'

/**
 * One address-book entry. `manual` is what the user typed (it always wins when a
 * message names the same address); `auto` is a correspondent the plugin learned
 * from mail the user opened, and it is only a fallback until the user edits it.
 */
export interface EmailContact {
  id: string
  /** Display name shown in readers and inserted by recipient autocomplete. */
  name: string
  /** Lower-cased mailbox address; the identity of an entry. */
  address: string
  note?: string
  source: 'manual' | 'auto'
  /** How many messages this address appeared in (auto entries are ranked by it). */
  uses: number
  /** Last time the address was seen in a message, ISO 8601. */
  lastSeenAt?: string
  createdAt: string
  updatedAt: string
  /**
   * Search keys precomputed on write: lower-case latin words, the pinyin
   * syllables and initials of every Chinese run in the name, and the mailbox
   * local part (工号). The composer matches against this string, so typing
   * `zxm`, `zhangxiaoming`, `100123` or `张小` all reach the same person without
   * shipping a pinyin table to the browser.
   */
  keys?: string
}

/** One contact candidate the caller harvested from message headers. */
export type ContactAddress = Pick<AddressEntry, 'name' | 'address'>

export interface ContactSaveInput {
  id?: unknown
  name?: unknown
  address?: unknown
  note?: unknown
}

export interface ContactObserveResult {
  added: number
  updated: number
}

export class ContactsError extends Error {
  constructor(message: string, readonly code = 'contact-invalid') {
    super(message)
  }
}

/**
 * Upper bounds. The book is local, private data: a group account can legitimately
 * contribute tens of thousands of colleagues once a directory source is synced,
 * but an unbounded pool would still be a memory and payload risk — the composer
 * receives the whole book.
 */
export const MAX_CONTACTS = 50000
export const MAX_AUTO_CONTACTS = 5000
const MAX_LEGACY_BYTES = 4 * 1024 * 1024
const NAME_LIMIT = 120
const NOTE_LIMIT = 200
const ADDRESS_LIMIT = 254
/** Keys are local data too; a pathological name must not balloon every row. */
const KEY_LIMIT = 400
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const CJK_RUN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g
const WORD = /[a-z0-9]+/g

/**
 * A usable mailbox address: one `@` with something on both sides and none of the
 * characters that would break an address header. Deliberately permissive about
 * dots and dots-less domains — intranet mail servers exist and rejecting them
 * would silently drop real correspondents from the address book.
 */
export function normalizeAddress(raw: unknown): string {
  if (typeof raw !== 'string') throw new ContactsError('邮箱格式不正确 / Check the email address')
  const trimmed = raw.trim().toLowerCase()
  if (trimmed === '' || trimmed.length > ADDRESS_LIMIT) throw new ContactsError('邮箱格式不正确 / Check the email address')
  const at = trimmed.indexOf('@')
  if (at <= 0 || at !== trimmed.lastIndexOf('@') || at === trimmed.length - 1) throw new ContactsError('邮箱格式不正确 / Check the email address')
  if (/[\s<>",;:\\/\u0000-\u001f\u007f]/.test(trimmed)) throw new ContactsError('邮箱格式不正确 / Check the email address')
  return trimmed
}

/** Keep a display name safe to embed in a `Name <address>` header or a text node. */
export function normalizeContactName(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[<>",;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_LIMIT)
}

function normalizeNote(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, NOTE_LIMIT)
}

/**
 * Search keys for one entry. Chinese names are the whole point of this index: the
 * same person must be reachable as 汉字, as full pinyin (`zhangxinyi`) and as
 * initials (`zxy`), and colleagues are usually reachable by their 工号 too.
 *
 * `surname: 'head'` is what keeps 曾/单/解/查/仇/区/朴/乐 usable as surnames: the
 * plain reading would index 曾伟 as `cengwei` and nobody searches like that.
 */
export function contactMatchKeys(name: string, address: string): string {
  const tokens = new Set<string>()
  const text = normalizeContactName(name)
  for (const run of text.match(CJK_RUN) ?? []) {
    tokens.add(pinyin(run, { toneType: 'none', type: 'array', surname: 'head' }).join(''))
    tokens.add(pinyin(run, { pattern: 'first', toneType: 'none', type: 'array', surname: 'head' }).join(''))
  }
  for (const word of text.toLowerCase().match(WORD) ?? []) tokens.add(word)
  const local = address.split('@')[0] ?? ''
  tokens.add(local)
  for (const word of local.match(WORD) ?? []) tokens.add(word)
  return [...tokens]
    .map(token => token.trim())
    .filter(token => token !== '')
    .join(' ')
    .slice(0, KEY_LIMIT)
}

/** Manual entries first, then most-used correspondents; ties fall back to the name. */
function compareContacts(a: EmailContact, b: EmailContact): number {
  if (a.source !== b.source) return a.source === 'manual' ? -1 : 1
  if (b.uses !== a.uses) return b.uses - a.uses
  const seenA = a.lastSeenAt ?? '', seenB = b.lastSeenAt ?? ''
  if (seenA !== seenB) return seenB.localeCompare(seenA)
  const byName = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  return byName !== 0 ? byName : a.address.localeCompare(b.address)
}

/**
 * How well one entry answers `needle`, or -1. Deliberately the same ladder the
 * composer uses client-side: an address the user is typing, then a name prefix,
 * then the pinyin/initials/工号 keys, then substring hits.
 */
function scoreContact(contact: EmailContact, needle: string): number {
  const name = contact.name.toLowerCase()
  if (contact.address === needle) return 0
  if (contact.address.startsWith(needle)) return 1
  if (name !== '' && name.startsWith(needle)) return 2
  const keys = (contact.keys ?? '').toLowerCase()
  if (keys !== '') {
    for (const token of keys.split(' ')) if (token.startsWith(needle)) return 3
  }
  if (contact.address.includes(needle)) return 4
  if (name.includes(needle)) return 5
  if (keys !== '' && keys.includes(needle)) return 6
  return -1
}

function validLegacyContact(raw: unknown): EmailContact | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const row = raw as Record<string, unknown>
  if (typeof row.id !== 'string' || !ID_PATTERN.test(row.id)) return undefined
  if (row.source !== 'manual' && row.source !== 'auto') return undefined
  let address: string
  try {
    address = normalizeAddress(row.address)
  } catch {
    return undefined
  }
  if (typeof row.name !== 'string' || row.name.length > NAME_LIMIT) return undefined
  if (row.note !== undefined && (typeof row.note !== 'string' || row.note.length > NOTE_LIMIT)) return undefined
  if (row.uses !== undefined && (!Number.isSafeInteger(row.uses) || (row.uses as number) < 0)) return undefined
  for (const key of ['createdAt', 'updatedAt', 'lastSeenAt'] as const) {
    if (row[key] !== undefined && typeof row[key] !== 'string') return undefined
  }
  const name = normalizeContactName(row.name)
  return {
    id: row.id,
    name,
    address,
    ...(typeof row.note === 'string' && row.note !== '' ? { note: row.note } : {}),
    source: row.source,
    uses: typeof row.uses === 'number' ? row.uses : 0,
    ...(typeof row.lastSeenAt === 'string' && row.lastSeenAt !== '' ? { lastSeenAt: row.lastSeenAt } : {}),
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : new Date().toISOString(),
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date().toISOString(),
    keys: contactMatchKeys(name, address),
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS contact (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  name TEXT NOT NULL,
  note TEXT NOT NULL,
  source TEXT NOT NULL,
  keys TEXT NOT NULL,
  uses INTEGER NOT NULL,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS contact_address ON contact(address);
CREATE INDEX IF NOT EXISTS contact_rank ON contact(source, uses);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sync_state (source TEXT PRIMARY KEY, cursor TEXT NOT NULL, synced_at TEXT NOT NULL);
`

/** Column order every SELECT below relies on. */
const COLUMNS = 'id, address, name, note, source, keys, uses, last_seen_at, created_at, updated_at'

interface ContactRow {
  id: string
  address: string
  name: string
  note: string
  source: string
  keys: string
  uses: number
  last_seen_at: string
  created_at: string
  updated_at: string
}

function toContact(row: ContactRow): EmailContact {
  return {
    id: row.id,
    address: row.address,
    name: row.name,
    ...(row.note !== '' ? { note: row.note } : {}),
    source: row.source === 'manual' ? 'manual' : 'auto',
    uses: Number(row.uses) || 0,
    ...(row.last_seen_at !== '' ? { lastSeenAt: row.last_seen_at } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    keys: row.keys,
  }
}

/** `node:sqlite` is loaded lazily so a runtime without it fails one feature, not the plugin. */
let sqliteModule: Promise<typeof import('node:sqlite')> | null = null
function sqlite(): Promise<typeof import('node:sqlite')> {
  sqliteModule ??= import('node:sqlite')
  return sqliteModule
}

function storageError(error: unknown): ContactsError {
  if (error instanceof ContactsError) return error
  return new ContactsError('本地通讯录数据库无法读写，已保留原数据；请检查存储位置或从备份恢复', 'contact-storage')
}

/**
 * Private local address book, backed by SQLite in the plugin's data directory.
 *
 * Why not the JSON document this used to be: a group account's directory is tens
 * of thousands of rows, and every lookup used to parse and re-validate the whole
 * file. SQLite gives an indexed store, atomic single-row writes and a stable file
 * per installation. The old `contacts-v1.json` is imported once and then left
 * untouched on disk, so a downgrade or a manual inspection still works.
 *
 * Each call opens and closes its own connection: the store is created per plugin
 * instance but must not pin a file handle in a process that may be long-lived, and
 * WAL keeps concurrent readers from blocking the writer.
 */
export class ContactsStore {
  readonly root: string
  private readonly database: string
  private ready: Promise<void> | null = null
  constructor(home = process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')) {
    this.root = resolve(home, 'data/dsh-email')
    this.database = join(this.root, 'contacts-v2.sqlite3')
  }

  async list(): Promise<EmailContact[]> {
    return this.withDb(db => {
      const rows = db.prepare(`SELECT ${COLUMNS} FROM contact ORDER BY
        CASE source WHEN 'manual' THEN 0 ELSE 1 END, uses DESC, last_seen_at DESC, name, address`).all() as unknown as ContactRow[]
      return rows.map(toContact).sort(compareContacts)
    })
  }

  /**
   * Ranked suggestions for one query. Chinese names, full pinyin and initials all
   * reach the same row (see {@link contactMatchKeys}); an empty query is the
   * ranked head of the book, which is what the composer shows on focus.
   */
  async suggest(query: string, limit = 8): Promise<EmailContact[]> {
    const needle = String(query ?? '').trim().toLowerCase()
    const capped = Math.max(1, Math.min(50, Math.trunc(limit) || 8))
    const rows = await this.list()
    if (needle === '') return rows.slice(0, capped)
    const scored: { contact: EmailContact; score: number }[] = []
    for (const contact of rows) {
      const score = scoreContact(contact, needle)
      if (score >= 0) scored.push({ contact, score })
    }
    return scored
      .sort((a, b) => a.score - b.score || compareContacts(a.contact, b.contact))
      .slice(0, capped)
      .map(row => row.contact)
  }

  async save(input: ContactSaveInput, signal?: AbortSignal): Promise<EmailContact> {
    const address = normalizeAddress(input.address)
    const name = normalizeContactName(input.name)
    const note = normalizeNote(input.note)
    const wantedId = typeof input.id === 'string' && input.id !== '' ? input.id : null
    if (wantedId !== null && !ID_PATTERN.test(wantedId)) throw new ContactsError('联系人编号不合法')
    return this.mutate(db => {
      const now = new Date().toISOString()
      const byAddress = (db.prepare(`SELECT ${COLUMNS} FROM contact WHERE address = ?`).get(address) as ContactRow | undefined)
      let target = wantedId === null
        ? byAddress
        : (db.prepare(`SELECT ${COLUMNS} FROM contact WHERE id = ?`).get(wantedId) as ContactRow | undefined)
      if (wantedId !== null && !target) throw new ContactsError('联系人不存在或已被移除', 'contact-missing')
      if (target && byAddress && byAddress.id !== target.id) {
        // The user typed an address that is already collected under its automatic
        // entry: fold that row into the edited one instead of leaving a duplicate.
        db.prepare('UPDATE contact SET uses = MAX(uses, ?), last_seen_at = ? WHERE id = ?')
          .run(byAddress.uses, target.last_seen_at || byAddress.last_seen_at, target.id)
        db.prepare('DELETE FROM contact WHERE id = ?').run(byAddress.id)
      }
      if (!target) {
        const total = Number((db.prepare('SELECT COUNT(*) AS n FROM contact').get() as { n: number }).n) || 0
        if (total >= MAX_CONTACTS) throw new ContactsError('通讯录已满（' + MAX_CONTACTS + ' 条），请先删除不再需要的联系人')
        const row: ContactRow = {
          id: randomUUID(), address, name, note, source: 'manual',
          keys: contactMatchKeys(name, address), uses: 0,
          last_seen_at: '', created_at: now, updated_at: now,
        }
        db.prepare(`INSERT INTO contact (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          row.id, row.address, row.name, row.note, row.source, row.keys, row.uses,
          row.last_seen_at, row.created_at, row.updated_at,
        )
        return toContact(row)
      }
      const nextName = name !== '' ? name : target.name
      db.prepare(`UPDATE contact SET source = 'manual', name = ?, address = ?, note = ?, keys = ?, updated_at = ? WHERE id = ?`).run(
        nextName, address, note !== '' ? note : target.note, contactMatchKeys(nextName, address), now, target.id,
      )
      return {
        ...toContact(target),
        name: nextName,
        address,
        ...(note !== '' ? { note } : {}),
        source: 'manual',
        updatedAt: now,
        keys: contactMatchKeys(nextName, address),
      }
    }, signal)
  }

  async remove(id: unknown, signal?: AbortSignal): Promise<void> {
    const wanted = typeof id === 'string' ? id : ''
    if (!ID_PATTERN.test(wanted)) throw new ContactsError('联系人编号不合法')
    await this.mutate(db => {
      const result = db.prepare('DELETE FROM contact WHERE id = ?').run(wanted)
      if (Number(result.changes) === 0) throw new ContactsError('联系人不存在或已被移除', 'contact-missing')
      return true
    }, signal)
  }

  /**
   * Learn correspondents from message headers. Accounts' own addresses and the
   * user's curated names are never overwritten; a refresh with nothing new writes
   * nothing, so polling the mailbox does not churn the book.
   */
  async observe(
    entries: Iterable<ContactAddress | null | undefined>,
    options: { self?: Iterable<string>; now?: string } = {},
    signal?: AbortSignal,
  ): Promise<ContactObserveResult> {
    const self = new Set<string>()
    for (const address of options.self ?? []) {
      try { self.add(normalizeAddress(address)) } catch { /* an invalid own address is not a filter */ }
    }
    const seen = new Map<string, string>()
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue
      let address: string
      try { address = normalizeAddress(entry.address) } catch { continue }
      if (self.has(address) || seen.has(address)) continue
      const name = normalizeContactName(entry.name)
      seen.set(address, name !== address ? name : '')
    }
    if (seen.size === 0) return { added: 0, updated: 0 }
    const now = options.now ?? new Date().toISOString()
    return this.mutate(db => {
      let added = 0, updated = 0
      const find = db.prepare(`SELECT ${COLUMNS} FROM contact WHERE address = ?`)
      const grow = db.prepare('UPDATE contact SET uses = uses + 1, last_seen_at = ? WHERE id = ?')
      const complete = db.prepare('UPDATE contact SET name = ?, keys = ?, updated_at = ? WHERE id = ?')
      const insert = db.prepare(`INSERT INTO contact (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      for (const [address, name] of seen) {
        const existing = find.get(address) as ContactRow | undefined
        if (existing) {
          // A curated name always wins; an automatic entry keeps the first real
          // header name it saw and only fills a name it never had.
          if (existing.source === 'auto' && existing.name === '' && name !== '') {
            complete.run(name, contactMatchKeys(name, address), now, existing.id)
          }
          grow.run(now, existing.id)
          updated += 1
          continue
        }
        const row: ContactRow = {
          id: randomUUID(), address, name, note: '', source: 'auto',
          keys: contactMatchKeys(name, address), uses: 1,
          last_seen_at: now, created_at: now, updated_at: now,
        }
        insert.run(row.id, row.address, row.name, row.note, row.source, row.keys, row.uses,
          row.last_seen_at, row.created_at, row.updated_at)
        added += 1
      }
      if (added > 0) {
        const auto = Number((db.prepare(`SELECT COUNT(*) AS n FROM contact WHERE source = 'auto'`).get() as { n: number }).n) || 0
        if (auto > MAX_AUTO_CONTACTS) {
          // Forget the least-used correspondents first; curated rows never go.
          db.prepare(`DELETE FROM contact WHERE id IN (
            SELECT id FROM contact WHERE source = 'auto'
            ORDER BY uses ASC, last_seen_at ASC, name, address
            LIMIT ?)`).run(auto - MAX_AUTO_CONTACTS)
        }
      }
      return { added, updated }
    }, signal)
  }

  /**
   * The cursor a directory sync source left behind, or undefined when it never ran.
   * CardDAV/LDAP adapters keep their etag or modifyTimestamp here so a restart does
   * not force a full resync.
   */
  async syncCursor(source: string): Promise<{ cursor: string; syncedAt: string } | undefined> {
    return this.withDb(db => {
      const row = db.prepare('SELECT cursor, synced_at FROM sync_state WHERE source = ?').get(source) as
        { cursor: string; synced_at: string } | undefined
      return row ? { cursor: row.cursor, syncedAt: row.synced_at } : undefined
    })
  }

  /** Record how far a directory sync got. Written in its own transaction. */
  async setSyncCursor(source: string, cursor: string, syncedAt = new Date().toISOString()): Promise<void> {
    await this.mutate(db => {
      db.prepare(`INSERT INTO sync_state (source, cursor, synced_at) VALUES (?, ?, ?)
        ON CONFLICT(source) DO UPDATE SET cursor = excluded.cursor, synced_at = excluded.synced_at`).run(source, cursor, syncedAt)
      return true
    })
  }

  private async open(signal?: AbortSignal): Promise<DatabaseSync> {
    await this.prepare()
    signal?.throwIfAborted()
    const { DatabaseSync } = await sqlite()
    const db = new DatabaseSync(this.database)
    try {
      db.exec('PRAGMA busy_timeout = 5000')
      db.exec('PRAGMA journal_mode = WAL')
      db.exec('PRAGMA synchronous = NORMAL')
    } catch {
      db.close()
      throw new ContactsError('本地通讯录数据库无法打开，请检查存储位置或从备份恢复', 'contact-storage')
    }
    return db
  }

  /**
   * Create the schema and import the retired JSON book exactly once. A damaged
   * legacy file aborts the import with its own error instead of quietly starting
   * an empty book: the file is preserved, so the user can repair or restore it.
   */
  private prepare(): Promise<void> {
    this.ready ??= this.initialize().catch(error => {
      // A transient failure (a locked file, a half-migrated home) must stay
      // retryable: a store instance outlives many calls.
      this.ready = null
      throw storageError(error)
    })
    return this.ready
  }

  private async initialize(): Promise<void> {
    await mkdir(this.root, { recursive: true, mode: 0o700 })
    const { DatabaseSync } = await sqlite()
    const db = new DatabaseSync(this.database)
    try {
      db.exec('PRAGMA busy_timeout = 5000')
      db.exec('PRAGMA journal_mode = WAL')
      db.exec(SCHEMA)
      await this.importLegacy(db)
    } finally {
      db.close()
    }
  }

  private async importLegacy(db: DatabaseSync): Promise<void> {
    const done = db.prepare(`SELECT value FROM meta WHERE key = 'migrated_v1'`).get()
    if (done) return
    const legacy = join(this.root, 'contacts-v1.json')
    let raw: string
    try {
      if ((await stat(legacy)).size > MAX_LEGACY_BYTES) throw new Error('too large')
      raw = await readFile(legacy, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return
      throw new ContactsError('本地通讯录文件无法读取，已保留原文件；请检查存储位置或从备份恢复', 'contact-storage')
    }
    let document: unknown
    try {
      document = JSON.parse(raw)
    } catch {
      throw new ContactsError('本地通讯录文件无法读取，已保留原文件；请检查存储位置或从备份恢复', 'contact-storage')
    }
    const rows = (document as { version?: unknown; contacts?: unknown }).version === 1
      ? (document as { contacts: unknown[] }).contacts
      : undefined
    if (!Array.isArray(rows) || rows.length > MAX_CONTACTS) {
      throw new ContactsError('本地通讯录文件无法读取，已保留原文件；请检查存储位置或从备份恢复', 'contact-storage')
    }
    const contacts: EmailContact[] = []
    const addresses = new Set<string>(), ids = new Set<string>()
    for (const item of rows) {
      const contact = validLegacyContact(item)
      if (!contact || addresses.has(contact.address) || ids.has(contact.id)) {
        throw new ContactsError('本地通讯录文件无法读取，已保留原文件；请检查存储位置或从备份恢复', 'contact-storage')
      }
      addresses.add(contact.address)
      ids.add(contact.id)
      contacts.push(contact)
    }
    db.exec('BEGIN IMMEDIATE')
    try {
      const insert = db.prepare(`INSERT OR IGNORE INTO contact (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      for (const contact of contacts) {
        insert.run(contact.id, contact.address, contact.name, contact.note ?? '', contact.source,
          contact.keys ?? '', contact.uses, contact.lastSeenAt ?? '', contact.createdAt, contact.updatedAt)
      }
      db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('migrated_v1', ?)`).run(new Date().toISOString())
      db.exec('COMMIT')
    } catch (error) {
      try { db.exec('ROLLBACK') } catch { /* the transaction is already gone */ }
      throw error
    }
  }

  private async withDb<T>(action: (db: DatabaseSync) => T, signal?: AbortSignal): Promise<T> {
    signal?.throwIfAborted()
    const db = await this.open(signal)
    try {
      signal?.throwIfAborted()
      return action(db)
    } finally {
      try { db.close() } catch { /* closing an already closed handle is not a failure */ }
    }
  }

  private async mutate<T>(action: (db: DatabaseSync) => T, signal?: AbortSignal): Promise<T> {
    return this.withDb(db => {
      db.exec('BEGIN IMMEDIATE')
      try {
        const result = action(db)
        db.exec('COMMIT')
        return result
      } catch (error) {
        try { db.exec('ROLLBACK') } catch { /* the transaction is already gone */ }
        throw error
      }
    }, signal)
  }
}