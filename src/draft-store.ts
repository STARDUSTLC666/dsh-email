import { randomUUID } from 'node:crypto'
import { mkdir, open, readFile, realpath, rename, stat, unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path'
import lockfile from 'proper-lockfile'
import type { EmailSendResult } from './types.js'
import { scheduledTime } from './scheduled-time.js'

export type DraftState = 'draft' | 'scheduled' | 'sending' | 'sent' | 'uncertain'
export interface DraftAttachment { id: string; path: string; filename: string; owned: boolean }
export interface EmailDraft {
  id: string; revision: number; account: string; to: string; cc: string; subject: string; text: string
  html?: string
  sendAt?: string
  scheduleKey?: string
  scheduledAttachments?: Record<string, string>
  attachments: DraftAttachment[]; state: DraftState; createdAt: string; updatedAt: string
  attemptAt?: string; receipt?: EmailSendResult; error?: string
  reply?: { uid: number | string; folder: string; uidValidity?: number; mode?: 'reply' | 'reply-all' | 'forward' }
}
export interface DraftFields { account: string; to: string; cc: string; subject: string; text: string; html?: string; sendAt?: string }
interface Document { version: 1; drafts: EmailDraft[] }
export class DraftError extends Error { constructor(message: string, readonly code = 'draft-invalid') { super(message) } }
const isId = (id: unknown): id is string => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)

function validReplyReference(reply: NonNullable<EmailDraft['reply']>): boolean {
  const { uid, folder, uidValidity } = reply
  const validUid = typeof uid === 'number' ? Number.isSafeInteger(uid) && uid > 0
    : typeof uid === 'string' && uid.length > 0 && uid.length <= 998 && !/[\r\n\0]/.test(uid)
  return validUid && typeof folder === 'string' && folder.length <= 1024
    && (uidValidity === undefined || Number.isSafeInteger(uidValidity) && uidValidity > 0)
}

export function draftFields(input: unknown): DraftFields {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new DraftError('Draft content must be an object')
  const raw = input as Record<string, unknown>, fields = {} as DraftFields
  for (const [key, cap] of [['account', 200], ['to', 4096], ['cc', 4096], ['subject', 500], ['text', 100 * 1024]] as const) {
    const value = raw[key] ?? ''
    if (typeof value !== 'string' || Buffer.byteLength(value) > cap || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) || (key !== 'text' && /[\r\n]/.test(value))) throw new DraftError(key === 'text' ? 'Body text may be at most 100 KiB and must not contain non-text control characters' : key + ' is too long or contains line breaks or control characters')
    fields[key] = key === 'text' ? value : value.trim()
  }
  if (Object.hasOwn(raw, 'html')) {
    if (raw.html !== undefined && (typeof raw.html !== 'string' || Buffer.byteLength(raw.html) > 256 * 1024 || raw.html.includes('\0'))) throw new DraftError('HTML body must be text, at most 256 KiB')
    fields.html = typeof raw.html === 'string' && raw.html.trim() ? raw.html : undefined
  }
  if(Object.hasOwn(raw,'sendAt'))fields.sendAt=raw.sendAt?scheduledTime(raw.sendAt):undefined
  return fields
}

/** Private, bounded local drafts. File locks protect separate DSH processes and atomic replacement preserves old data on failure. */
export class DraftStore {
  readonly root: string
  private readonly file: string
  constructor(home = process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')) {
    this.root = resolve(home, 'data/dsh-email'); this.file = join(this.root, 'drafts-v1.json')
  }
  async list(): Promise<EmailDraft[]> { return (await this.load()).drafts }
  private async load(): Promise<Document> {
    try {
      if ((await stat(this.file)).size > 16 * 1024 * 1024) throw new Error('too large')
      const doc = JSON.parse(await readFile(this.file, 'utf8')) as Document
      if (doc.version !== 1 || !Array.isArray(doc.drafts) || doc.drafts.length > 50 || new Set(doc.drafts.map(d => d.id)).size !== doc.drafts.length) throw new Error('invalid document')
      for (const draft of doc.drafts) {
        if (!isId(draft.id) || !Number.isSafeInteger(draft.revision) || draft.revision < 1 || !['draft', 'scheduled', 'sending', 'sent', 'uncertain'].includes(draft.state)) throw new Error('invalid draft')
        draftFields(draft)
        if(draft.state==='scheduled'&&(!draft.sendAt||!/^[a-f0-9]{64}$/.test(draft.scheduleKey||'')||!draft.scheduledAttachments||Array.isArray(draft.scheduledAttachments)||Object.values(draft.scheduledAttachments).some(x=>typeof x!=='string'||!/^[a-f0-9]{64}$/.test(x))))throw new Error('invalid scheduled draft')
        if (draft.reply && !validReplyReference(draft.reply)) throw new Error('invalid reply reference')
        if (!Array.isArray(draft.attachments) || draft.attachments.length > 10 || draft.attachments.some(file => !isId(file.id) || !isAbsolute(file.path) || typeof file.filename !== 'string' || typeof file.owned !== 'boolean')) throw new Error('invalid attachments')
        if(draft.state==='scheduled'&&(Object.keys(draft.scheduledAttachments!).length!==draft.attachments.length||draft.attachments.some(file=>!file.owned||!Object.hasOwn(draft.scheduledAttachments!,file.id))))throw new Error('invalid scheduled attachments')
      }
      return doc
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return { version: 1, drafts: [] }
      throw new DraftError('Cannot read the local drafts file; the original file was kept. Check the storage location or restore from a backup.', 'draft-storage')
    }
  }
  private async write(doc: Document): Promise<void> {
    const data = JSON.stringify(doc, null, 2)
    if (Buffer.byteLength(data) > 16 * 1024 * 1024) throw new DraftError('Draft storage is too large; delete drafts you no longer need')
    const temporary = join(this.root, '.drafts-' + randomUUID() + '.json')
    try {
      const handle = await open(temporary, 'wx', 0o600)
      try { await handle.writeFile(data); await handle.sync() } finally { await handle.close() }
      await rename(temporary, this.file)
    } finally { await unlink(temporary).catch(() => {}) }
  }
  private async withLock<T>(file: string, action: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal, wait = true): Promise<T> {
    signal?.throwIfAborted(); await mkdir(this.root, { recursive: true, mode: 0o700 })
    const compromised = new AbortController()
    let release: () => Promise<void>
    try {
      release = await lockfile.lock(file, { realpath: false, stale: 120000, update: 10000, retries: wait ? { retries: 10, factor: 1, minTimeout: 50, maxTimeout: 50 } : 0, onCompromised: error => compromised.abort(error) })
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ELOCKED') throw new DraftError('Another DSH instance is saving or sending this draft; retry shortly', 'draft-busy')
      throw new DraftError('Cannot lock draft storage; check directory permissions', 'draft-storage')
    }
    try { const current = signal ? AbortSignal.any([signal, compromised.signal]) : compromised.signal; current.throwIfAborted(); return await action(current) }
    finally { await release().catch(() => {}) }
  }
  private async mutate<T>(action: (doc: Document) => T, signal?: AbortSignal): Promise<T> {
    return this.withLock(this.file, async current => { const doc = await this.load(); current.throwIfAborted(); const result = action(doc); current.throwIfAborted(); await this.write(doc); return result }, signal)
  }
  async get(id: string): Promise<EmailDraft> {
    const draft = (await this.list()).find(d => d.id === id)
    if (!draft) throw new DraftError('Draft does not exist or was removed', 'draft-missing')
    return draft
  }
  async create(fields: DraftFields, attachments: DraftAttachment[] = [], signal?: AbortSignal, reply?: EmailDraft['reply']): Promise<EmailDraft> {
    if (attachments.length > 10 || attachments.some(file => !isId(file.id) || !isAbsolute(file.path) || typeof file.filename !== 'string' || typeof file.owned !== 'boolean')) throw new DraftError('A draft may have at most 10 valid local attachments')
    if (reply && !validReplyReference(reply)) throw new DraftError('The reply draft has an invalid original uid or folder')
    return this.mutate(doc => {
      if (doc.drafts.length >= 50) throw new DraftError('There are already 50 drafts; delete drafts you no longer need')
      const now = new Date().toISOString(), draft: EmailDraft = {
        ...draftFields(fields), id: randomUUID(), revision: 1, attachments, state: 'draft', createdAt: now, updatedAt: now,
        ...(reply ? { reply: { ...reply } } : {}),
      }
      doc.drafts.unshift(draft); return draft
    }, signal)
  }
  async change(id: string, expectedRevision: unknown, action: (draft: EmailDraft) => void, signal?: AbortSignal): Promise<EmailDraft> {
    return this.mutate(doc => {
      const draft = doc.drafts.find(d => d.id === id)
      if (!draft) throw new DraftError('Draft does not exist or was removed', 'draft-missing')
      if (draft.revision !== expectedRevision) throw new DraftError('The draft was changed elsewhere; reopen it. Your current edits have not overwritten the server copy yet.', 'draft-conflict')
      action(draft); draft.revision++; draft.updatedAt = new Date().toISOString(); return draft
    }, signal)
  }
  async remove(id: string, revision: unknown, signal?: AbortSignal): Promise<void> {
    const removed = await this.mutate(doc => {
      const draft = doc.drafts.find(d => d.id === id)
      if (!draft) throw new DraftError('Draft was removed', 'draft-missing')
      if (draft.revision !== revision) throw new DraftError('Draft changed; reopen it before deleting', 'draft-conflict')
      if (draft.state === 'sending') throw new DraftError('The email is being submitted; remove the draft after it finishes', 'draft-busy')
      doc.drafts = doc.drafts.filter(d => d.id !== id); return draft
    }, signal)
    for (const file of removed.attachments) await this.removeOwnedFile(id, file)
  }
  async removeOwnedFile(id: string, file: DraftAttachment): Promise<void> {
    if (!file.owned || !isId(id)) return
    try {
      const root = await realpath(join(this.root, 'draft-uploads', id)), target = await realpath(file.path)
      const comparable = (path: string): string => process.platform === 'win32' ? path.toLowerCase() : path
      if (comparable(target).startsWith(comparable(root + sep)) && comparable(dirname(target)) === comparable(root)) await unlink(file.path)
    } catch { /* Never remove a referenced original or a path outside this draft's owned upload directory. */ }
  }
  async sendLock<T>(id: string, action: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!isId(id)) throw new DraftError('Invalid draft id')
    return this.withLock(join(this.root, 'send-' + id), action, signal, false)
  }
  uploadPath(id: string, filename: string): { path: string; filename: string } {
    if (!isId(id)) throw new DraftError('Invalid draft id')
    const safe = basename(filename).replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, '_').slice(0, 160).replace(/[. ]+$/, '') || 'attachment'
    return { path: join(this.root, 'draft-uploads', id, randomUUID() + '-' + safe), filename: safe }
  }
}
