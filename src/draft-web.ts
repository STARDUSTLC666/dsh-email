import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, open, stat } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { draftAttachmentLimit, MAX_DRAFT_ATTACHMENT_BYTES, normalizeAttachmentLimit } from './config.js'
import { DraftError, DraftStore, draftFields, type DraftAttachment, type EmailDraft } from './draft-store.js'
import { assertRecipientsAllowed, matchRecipients, parseRecipientPolicies, serializeRecipientPolicies, RecipientPolicyError } from './recipient-policy.js'
import { messageOf, redactCredentials } from './mail-client.js'
import type { EmailRuntime } from './runtime.js'
import type { EmailSettingsBackend } from './web.js'
import type { EmailSendResult } from './types.js'
import { prepareMailBody } from './outgoing-body.js'
import { richEmailBody } from './rich-body.js'
import { scheduledTime } from './scheduled-time.js'

export const EMAIL_DRAFT_ROUTE = '/api/dsh-email/drafts'
const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const json = (status: number, value: unknown): Response => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
interface Options { store?: DraftStore; now?: () => number }
interface AttachmentSnapshot { id: string; filename: string; content: Buffer }
interface Plan { id: string; created: number; key: string; draft: EmailDraft; attachments: AttachmentSnapshot[] }
const editable = (draft: EmailDraft): void => { if (draft.state !== 'draft') throw new DraftError('A submitted email, or one with an uncertain result, cannot be sent again; check the mailbox first, and copy it to a new draft if needed', 'draft-submitted') }
const view = (draft: EmailDraft) => ({ ...draft, attachments: draft.attachments.map(({ id, filename }) => ({ id, filename })) })

function attachmentSizeError(cap: number): DraftError {
  const size = cap >= 1024 * 1024 ? (cap / 1024 / 1024) + ' MiB' : (cap / 1024) + ' KiB'
  return new DraftError('Total draft attachments may not exceed ' + size, 'draft-too-large')
}

async function* requestChunks(body: ReadableStream<Uint8Array>, limit: number, tooLarge: DraftError, signal: AbortSignal): AsyncGenerator<Uint8Array> {
  const reader = body.getReader()
  const cancel = () => { void reader.cancel().catch(() => {}) }
  signal.addEventListener('abort', cancel, { once: true })
  try {
    let size = 0
    for (;;) {
      signal.throwIfAborted()
      const { done, value } = await reader.read()
      signal.throwIfAborted()
      if (done) return
      size += value.byteLength
      if (size > limit) throw tooLarge
      yield value
    }
  } finally {
    signal.removeEventListener('abort', cancel)
    cancel()
    reader.releaseLock()
  }
}

/** All mutations use the host's authenticated fetch carrier and an explicit UI action. */
export class EmailDraftBackend {
  readonly store: DraftStore
  private readonly plans = new Map<string, Plan>()
  private scheduleTimer?: ReturnType<typeof setTimeout>
  private scheduleController?: AbortController
  private scheduleWork?: Promise<void>
  private scheduleGeneration = 0
  private scheduleActive = false
  private scheduleError = ''
  constructor(private readonly runtime: Pick<EmailRuntime, 'getEffectiveSettings' | 'getSettingsValue' | 'getPool'>, private readonly settings: Pick<EmailSettingsBackend, 'snapshot' | 'saveRecipientRules'>, private readonly options: Options = {}) { this.store = options.store ?? new DraftStore() }
  private now(): number { return this.options.now?.() ?? Date.now() }
  private prune(): void { for (const [id, plan] of this.plans) if (this.now() - plan.created > 10 * 60 * 1000) this.plans.delete(id) }
  private invalidate(id: string): void { for (const [key, plan] of this.plans) if (plan.draft.id === id) this.plans.delete(key) }
  private attachmentCap(account: string): number {
    try {
      const settings = this.runtime.getEffectiveSettings()
      return draftAttachmentLimit(settings.maxAttachmentBytes, settings.accounts.get(account || settings.defaultAccount)?.transport)
    } catch { // Local drafts can also have attachments before account setup.
      return draftAttachmentLimit(normalizeAttachmentLimit(this.runtime.getSettingsValue()?.maxAttachmentBytes))
    }
  }
  private connection(account: string) {
    const settings = this.runtime.getEffectiveSettings(), name = account || settings.defaultAccount, config = settings.accounts.get(name)
    if (!config) throw new DraftError('The sending account does not exist; choose another account')
    const value = this.runtime.getSettingsValue(), policies = parseRecipientPolicies(value.trustedRecipientsYaml)
    return { name, config, cap: draftAttachmentLimit(settings.maxAttachmentBytes, config.transport), policy: policies.get(name), key: hash({ name, config, cap: settings.maxAttachmentBytes, policies: value.trustedRecipientsYaml ?? '', approval: value.sendApproval }) }
  }
  private safe(error: unknown): string {
    let message = redactCredentials(messageOf(error, 'The operation failed; try again later'))
    try { for (const account of this.runtime.getEffectiveSettings().accounts.values()) for (const secret of [account.password, account.authPassword]) if (secret && secret.length >= 4) message = message.split(secret).join('[hidden]') } catch { /* Incomplete account errors are actionable. */ }
    return message.slice(0, 1200)
  }
  private async bytes(file: DraftAttachment, cap: number, signal?: AbortSignal): Promise<Buffer> {
    signal?.throwIfAborted()
    let stream: ReturnType<typeof createReadStream> | undefined
    try {
      const info = await stat(file.path)
      if (!info.isFile() || info.size > cap) throw new Error('size')
      stream = createReadStream(file.path, { signal }); const parts: Buffer[] = []; let total = 0
      for await (const part of stream) { signal?.throwIfAborted(); const chunk = Buffer.from(part); total += chunk.length; if (total > cap) throw new Error('size'); parts.push(chunk) }
      return Buffer.concat(parts)
    } catch { signal?.throwIfAborted(); throw new DraftError('Attachment "' + file.filename + '" is unreadable or exceeds the draft attachment limit; remove it and add it again') }
    finally { stream?.destroy() }
  }
  private async attachments(draft: EmailDraft, cap: number, signal?: AbortSignal): Promise<AttachmentSnapshot[]> {
    const result: AttachmentSnapshot[] = []; let used = 0
    for (const file of draft.attachments) { const content = await this.bytes(file, cap - used, signal); used += content.length; result.push({ id: file.id, filename: file.filename, content }) }
    return result
  }
  private async attachmentSize(draft: EmailDraft): Promise<number> {
    let size = 0
    for (const file of draft.attachments) {
      const info = await stat(file.path).catch(() => null)
      if (info?.isFile()) size += info.size
    }
    return size
  }
  async create(input: Record<string, unknown>, signal?: AbortSignal): Promise<EmailDraft> {
    let fields = draftFields(input)
    if (!fields.account) { try { fields.account = this.runtime.getEffectiveSettings().defaultAccount } catch { /* A local draft is useful even before the mailbox is configured. */ } }
    const paths = input.attachments ?? []
    if (!Array.isArray(paths) || paths.length > 10 || paths.some(file => typeof file !== 'string' || !file.trim())) throw new DraftError('attachments must be a list of paths to at most 10 local files')
    const files: DraftAttachment[] = paths.map(path => ({ id: randomUUID(), path: resolve(path as string), filename: basename(path as string), owned: false }))
    if (files.length) {
      const cap = fields.account ? this.connection(fields.account).cap : this.attachmentCap('')
      await this.attachments({ attachments: files } as EmailDraft, cap, signal)
    }
    let reply: EmailDraft['reply']
    if (input.reply !== undefined) {
      const reference = input.reply as Record<string, unknown>
      if (!reference || typeof reference !== 'object' || Array.isArray(reference) || !(typeof reference.uid === 'number' && Number.isSafeInteger(reference.uid) && reference.uid > 0 || typeof reference.uid === 'string' && reference.uid.length > 0 && reference.uid.length <= 998 && !/[\r\n\0]/.test(reference.uid)) || reference.folder !== undefined && typeof reference.folder !== 'string' || reference.mode !== undefined && !['reply','reply-all','forward'].includes(String(reference.mode))) throw new DraftError('The reply draft has an invalid uid, folder or mode')
      const prepared = await this.runtime.getPool().prepareReply(fields.account || undefined, String(reference.folder || ''), reference.uid as number | string, (reference.mode || 'reply') as 'reply'|'reply-all'|'forward', fields.text, fields.to, fields.cc, signal, {html:fields.html,locale:typeof input.locale==='string'?input.locale:undefined})
      fields = draftFields({...fields,...prepared});reply = prepared.reply
    }
    return this.store.create(fields, files, signal, reply)
  }
  private async recover(signal?: AbortSignal): Promise<void> {
    for (const draft of await this.store.list()) if (draft.state === 'sending') {
      try { await this.store.sendLock(draft.id, async current => { await this.store.change(draft.id, draft.revision, value => { if (value.state === 'sending') { value.state = 'uncertain'; value.error = 'The last submission left no complete receipt; check the mailbox first. It will not be resent automatically.' } }, current) }, signal) }
      catch (error) { if (!(error instanceof DraftError) || !['draft-busy', 'draft-conflict', 'draft-missing'].includes(error.code)) throw error }
    }
  }
  async action(body: Record<string, unknown>, signal?: AbortSignal): Promise<unknown> {
    this.prune(); signal?.throwIfAborted()
    if (body.action === 'list') {
      await this.recover(signal)
      const snapshot = await this.settings.snapshot()
      let attachmentLimits: Record<string, number> = {}
      try {
        const settings = this.runtime.getEffectiveSettings()
        attachmentLimits = Object.fromEntries([...settings.accounts].map(([name, config]) => [name, draftAttachmentLimit(settings.maxAttachmentBytes, config.transport)]))
      } catch { /* Drafts remain usable before account setup. */ }
      return { drafts: (await this.store.list()).map(view), accounts: snapshot.accounts, attachmentLimits, attachmentLimit: this.attachmentCap(''), revision: snapshot.settings.revision, writable: snapshot.writable, schedulerActive:this.scheduleActive, ...(this.scheduleError?{scheduleError:this.scheduleError}:{}) }
    }
    if (body.action === 'rules') {
      const snapshot = await this.settings.snapshot()
      const policies = parseRecipientPolicies(snapshot.settings.value.trustedRecipientsYaml)
      return { accounts: snapshot.accounts, revision: snapshot.settings.revision, writable: snapshot.writable, sendApproval: snapshot.settings.value.sendApproval !== false, allowTrustedReply: snapshot.settings.value.allowTrustedReply === true, policies: Object.fromEntries(policies) }
    }
    if (body.action === 'saveRules' || body.action === 'matchRules') {
      if (typeof body.account !== 'string' || !body.account.trim()) throw new DraftError('Choose an account first')
      const snapshot = await this.settings.snapshot()
      if (!snapshot.accounts.includes(body.account)) throw new DraftError('Account changed; reload the rules')
      const single = parseRecipientPolicies(JSON.stringify({ [body.account]: body.policy })).get(body.account)!
      if (!single) throw new DraftError('Fill in the complete recipient rule')
      if (body.action === 'matchRules') return matchRecipients(String(body.to ?? ''), String(body.cc ?? ''), single)
      const all = parseRecipientPolicies(snapshot.settings.value.trustedRecipientsYaml); all.set(body.account, single)
      await this.settings.saveRecipientRules(serializeRecipientPolicies(all), body.revision as number)
      return this.action({ action: 'rules' }, signal)
    }
    if (body.action === 'create') return view(await this.create({ ...body, attachments: [] }, signal)) // Browser attachments only come from its file chooser.
    const id = typeof body.id === 'string' ? body.id : '', draft = await this.store.get(id)
    if(body.action==='cancelSchedule'){
      return this.store.sendLock(id,async current=>{
        const active=await this.store.get(id)
        if(active.state!=='scheduled'||body.revision!==undefined&&body.revision!==active.revision)throw new DraftError('The schedule changed or submission already started; refresh and check the mailbox','draft-conflict')
        const cancelled=await this.store.change(id,active.revision,value=>{value.state='draft';delete value.scheduleKey;delete value.scheduledAttachments;delete value.sendAt;value.error='Schedule cancelled; no email sent'},current)
        this.invalidate(id);void this.armSchedule();return view(cancelled)
      },signal)
    }
    if (body.action === 'get') {
      if (body.checkAttachments !== true) return view(draft)
      editable(draft)
      if (draft.revision !== body.revision) throw new DraftError('Draft changed; reopen it before adding attachments', 'draft-conflict')
      const used = await this.attachmentSize(draft)
      return { attachmentCount: draft.attachments.length, attachmentSize: used, attachmentLimit: this.attachmentCap(draft.account) }
    }
    if (body.action === 'cancelPreview') { this.invalidate(id); return { cancelled: true } }
    if (body.action === 'update') {
      editable(draft)
      const fields = draftFields(body), keep = body.attachments ?? draft.attachments.map(file => file.id)
      if (draft.reply && (fields.account !== draft.account || fields.subject !== draft.subject)) throw new DraftError('A reply draft must keep the original sending account and subject; start a new email to change them')
      if (!Array.isArray(keep) || keep.some(key => !draft.attachments.some(file => file.id === key)) || new Set(keep).size !== keep.length) throw new DraftError('Invalid attachment list; reopen the draft')
      const changed = await this.store.change(id, body.revision, value => { editable(value); Object.assign(value, fields); value.attachments = value.attachments.filter(file => keep.includes(file.id)) }, signal)
      this.invalidate(id); for (const file of draft.attachments) if (!changed.attachments.some(kept => kept.id === file.id)) await this.store.removeOwnedFile(id, file)
      return view(changed)
    }
    if (body.action === 'delete') {
      if (body.confirmed !== true) throw new DraftError('Confirm deleting the local draft and its uploaded copies first')
      await this.store.remove(id, body.revision, signal); this.invalidate(id); return { removed: true }
    }
    if (body.action === 'copy') {
      if (draft.revision !== body.revision) throw new DraftError('Draft changed; reopen it before copying', 'draft-conflict')
      if (draft.state === 'sending') throw new DraftError('The email is still being submitted; copy it after it finishes', 'draft-busy')
      if (body.confirmed !== true) throw new DraftError('Check the mailbox first, then confirm copying to a new draft')
      // A local copy can be edited even if the sender's limit was lowered after drafting.
      const contents = await this.attachments(draft, MAX_DRAFT_ATTACHMENT_BYTES, signal), created = await this.store.create(draftFields(draft), [], signal), files: DraftAttachment[] = []
      try {
        for (const file of contents) { const owned = this.store.uploadPath(created.id, file.filename), stored = { id: randomUUID(), ...owned, owned: true }; files.push(stored); await this.writeUpload(owned.path, file.content, signal) }
        const changed = await this.store.change(created.id, created.revision, value => { value.attachments = files; if (draft.reply) value.reply = { ...draft.reply } }, signal); return view(changed)
      } catch (error) { for (const file of files) await this.store.removeOwnedFile(created.id, file); await this.store.remove(created.id, created.revision).catch(() => {}); throw error }
    }
    if (body.action === 'preview') {
      editable(draft); if (draft.revision !== body.revision) throw new DraftError('Draft changed; save it and preview again', 'draft-conflict')
      if (!draft.subject) throw new DraftError('Fill in and save a subject first')
      const connection = this.connection(draft.account), matching = await matchRecipients(draft.to, draft.cc, connection.policy), attachments = await this.attachments(draft, connection.cap, signal)
      if (connection.config.transport === 'pop3' && !connection.config.smtp.host) throw new DraftError('This account is configured for POP3 receiving only; add SMTP sending settings first. The draft was not sent and is still editable.', 'smtp-missing')
      if (connection.key !== this.connection(draft.account).key || (await this.store.get(id)).revision !== draft.revision) throw new DraftError('Draft or account changed; preview again', 'draft-conflict')
      const rendered = prepareMailBody(draft.text, draft.html)
      this.invalidate(id); if (this.plans.size >= 3) this.plans.delete(this.plans.keys().next().value!)
      const plan: Plan = { id: randomUUID(), created: this.now(), key: connection.key, draft, attachments }; this.plans.set(plan.id, plan)
      return { id: plan.id, draft: view(draft), body: { ...rendered, rich: richEmailBody(rendered.html, [], true) }, from: { address: connection.config.user, name: connection.config.senderName }, matching, attachments: attachments.map(({ id, filename, content }) => ({ id, filename, size: content.length, sha256: createHash('sha256').update(content).digest('hex') })), expiresAt: plan.created + 10 * 60 * 1000 }
    }
    if(body.action==='schedule'){
      if(body.confirmed!==true)throw new DraftError('Check the body, recipients and time, then confirm scheduling')
      const plan=typeof body.preview==='string'?this.plans.get(body.preview):undefined
      if(!plan||plan.draft.id!==id)throw new DraftError('Preview expired or was already used; preview again','draft-preview-expired')
      const sendAt=scheduledTime(body.sendAt??draft.sendAt,this.now()),copies:DraftAttachment[]=[]
      try {
        for(const item of plan.attachments){const owned={id:item.id,...this.store.uploadPath(id,item.filename),owned:true};copies.push(owned);await this.writeUpload(owned.path,item.content,signal)}
        const queued=await this.store.sendLock(id,async current=>{
          const before=await this.store.get(id);editable(before)
          if(before.revision!==plan.draft.revision||plan.key!==this.connection(before.account).key)throw new DraftError('Draft, account or rules changed; preview again','draft-conflict')
          await assertRecipientsAllowed(before.to,before.cc,this.connection(before.account).policy)
          return this.store.change(id,before.revision,value=>{editable(value);value.state='scheduled';value.sendAt=sendAt;value.scheduleKey=plan.key;value.attachments=copies;value.scheduledAttachments=Object.fromEntries(plan.attachments.map(item=>[item.id,createHash('sha256').update(item.content).digest('hex')]));delete value.error},current)
        },signal)
        this.invalidate(id)
        for(const item of draft.attachments)await this.store.removeOwnedFile(id,item)
        void this.armSchedule();return{draft:view(queued)}
      }catch(error){for(const item of copies)await this.store.removeOwnedFile(id,item);throw error}
    }
    if (body.action === 'send') {
      if(draft.sendAt)throw new DraftError('This draft has a scheduled time; confirm the schedule, or clear the time to send now')
      if (body.confirmed !== true) throw new DraftError('Review the preview and confirm sending explicitly')
      const plan = typeof body.preview === 'string' ? this.plans.get(body.preview) : undefined
      if (!plan || plan.draft.id !== id) throw new DraftError('Preview expired or was already used; preview again', 'draft-preview-expired')
      return this.sendPlan(plan,signal)
    }
    throw new DraftError('Unsupported draft action')
  }
  private async sendPlan(plan:Plan,signal?:AbortSignal,scheduled=false):Promise<{draft:unknown}>{
    const id=plan.draft.id
    const canSend=(draft:EmailDraft)=>{if(scheduled){if(draft.state!=='scheduled'||Date.parse(draft.sendAt||'')>this.now())throw new DraftError('The schedule was cancelled, changed, or has not been reached yet','draft-conflict')}else editable(draft)}
    return this.store.sendLock(id,async current=>{
      const before=await this.store.get(id);canSend(before)
      if(before.revision!==plan.draft.revision||plan.key!==this.connection(before.account).key)throw new DraftError('Draft, account or rules changed; preview again','draft-conflict')
      await assertRecipientsAllowed(before.to,before.cc,this.connection(before.account).policy)
      const pool=this.runtime.getPool();current.throwIfAborted()
      const pending=await this.store.change(id,before.revision,value=>{canSend(value);value.state='sending';value.attemptAt=new Date(this.now()).toISOString()},current)
      this.invalidate(id)
      let unchanged=false;try{unchanged=plan.key===this.connection(before.account).key}catch{}
      if(!unchanged){await this.store.change(id,pending.revision,value=>{value.state='draft';delete value.attemptAt});throw new DraftError('Account or rules changed and the email was not submitted; preview again','draft-conflict')}
      let receipt:EmailSendResult
      try{receipt=await pool.sendPrepared(before.account,before.to,before.subject,before.text,before.cc,plan.attachments.map(({filename,content})=>({filename,content})),current,before.reply,before.html)}
      catch(error){
        if(error instanceof RecipientPolicyError){await this.store.change(id,pending.revision,value=>{value.state='draft';delete value.attemptAt});throw error}
        const failed=await this.store.change(id,pending.revision,value=>{value.state='uncertain';value.error='Submission result is uncertain; check the mailbox first. It will not be resent automatically. '+this.safe(error)}).catch(()=>null)
        if(!failed)throw new DraftError('Submission result is uncertain and the receipt could not be saved; check the mailbox first and do not resend directly','draft-storage')
        return{draft:view(failed)}
      }
      try{return{draft:view(await this.store.change(id,pending.revision,value=>{value.state='sent';value.receipt=receipt}))}}
      catch{throw new DraftError('The server returned a receipt but the local save failed; check the mailbox first and do not send again','draft-storage')}
    },signal)
  }
  async runScheduled(signal?:AbortSignal):Promise<void>{
    for(const draft of await this.store.list()){
      signal?.throwIfAborted()
      if(draft.state!=='scheduled'||Date.parse(draft.sendAt||'')>this.now())continue
      try{
        const attempt=AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(120000)])
        if(this.now()-Date.parse(draft.sendAt!)>300000)throw new DraftError('The scheduled time was missed by more than 5 minutes and nothing was sent automatically; confirm a new time')
        if(draft.scheduleKey!==this.connection(draft.account).key)throw new DraftError('Account or recipient rules changed and the schedule stopped; review again')
        const attachments=await this.attachments(draft,this.connection(draft.account).cap,attempt)
        if(attachments.some(file=>createHash('sha256').update(file.content).digest('hex')!==draft.scheduledAttachments?.[file.id]))throw new DraftError('A scheduled attachment changed; the email was not sent. Preview again.')
        await this.sendPlan({id:randomUUID(),created:this.now(),key:draft.scheduleKey!,draft,attachments},attempt,true)
      }catch(error){
        if(error instanceof DraftError&&error.code==='draft-busy')continue
        const latest=await this.store.get(draft.id).catch(()=>null)
        if(latest?.state==='scheduled')await this.store.change(latest.id,latest.revision,value=>{if(value.state==='scheduled'){value.state='draft';value.error=this.safe(error);delete value.scheduleKey;delete value.scheduledAttachments}}).catch(()=>{})
      }
    }
  }
  private async armSchedule():Promise<void>{
    if(!this.scheduleActive)return
    const generation=++this.scheduleGeneration;if(this.scheduleTimer)clearTimeout(this.scheduleTimer)
    try{
      const times=(await this.store.list()).filter(d=>d.state==='scheduled').map(d=>Date.parse(d.sendAt!))
      if(!this.scheduleActive||generation!==this.scheduleGeneration)return
      const delay=times.length?Math.max(500,Math.min(60000,Math.min(...times)-this.now())):60000
      this.scheduleTimer=setTimeout(()=>{this.scheduleWork=this.runScheduled(this.scheduleController?.signal).catch(error=>{if(!this.scheduleController?.signal.aborted)this.scheduleError=this.safe(error)}).finally(()=>{this.scheduleWork=undefined;void this.armSchedule()})},delay);this.scheduleTimer.unref?.()
    }catch(error){this.scheduleError=this.safe(error)}
  }
  async startScheduler():Promise<void>{
    if(this.scheduleActive)return
    this.scheduleActive=true;this.scheduleController=new AbortController()
    try{
      await this.recover()
      // A closed app cannot deliver at the chosen time. Reopening asks for review.
      for(const draft of await this.store.list())if(draft.state==='scheduled'&&Date.parse(draft.sendAt!)<=this.now())await this.store.sendLock(draft.id,async current=>{
        const latest=await this.store.get(draft.id)
        if(latest.state==='scheduled')await this.store.change(latest.id,latest.revision,value=>{value.state='draft';value.error='DSH was closed during the scheduled time and nothing was sent automatically; confirm a new send time';delete value.scheduleKey;delete value.scheduledAttachments},current)
      }).catch(()=>{})
      await this.armSchedule()
    }catch(error){this.scheduleError=this.safe(error)}
  }
  async stopScheduler():Promise<void>{this.scheduleActive=false;this.scheduleGeneration++;if(this.scheduleTimer)clearTimeout(this.scheduleTimer);this.scheduleController?.abort();await this.scheduleWork}
  private async writeUpload(path: string, content: Buffer | AsyncIterable<Uint8Array>, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted(); await mkdir(dirname(path), { recursive: true, mode: 0o700 })
    const file = await open(path, 'wx', 0o600)
    try { await file.writeFile(content); signal?.throwIfAborted(); await file.sync() } finally { await file.close() }
  }
  private async upload(request: Request, body: ReadableStream<Uint8Array>, signal: AbortSignal): Promise<unknown> {
    const id = request.headers.get('x-dsh-draft-id') ?? '', revision = Number(request.headers.get('x-dsh-draft-revision')), draft = await this.store.get(id); editable(draft)
    if (draft.revision !== revision || draft.attachments.length >= 10) throw new DraftError('Draft changed or already has 10 attachments; save, reopen, then add', 'draft-conflict')
    let filename: string
    try { filename = decodeURIComponent(request.headers.get('x-dsh-draft-filename') ?? '') } catch { throw new DraftError('Invalid attachment name') }
    if (!filename || filename.length > 500) throw new DraftError('Attachment name is empty or too long')
    const existingSize = await this.attachmentSize(draft)
    const cap = this.attachmentCap(draft.account), remaining = cap - existingSize
    const tooLarge = attachmentSizeError(cap)
    if (remaining < 0 || Number(request.headers.get('content-length')) > remaining) throw tooLarge
    const owned = { id: randomUUID(), ...this.store.uploadPath(id, filename), owned: true }
    try {
      await this.writeUpload(owned.path, requestChunks(body, remaining, tooLarge, signal), signal)
      const total = existingSize + (await stat(owned.path)).size
      const changed = await this.store.change(id, revision, value => {
        editable(value)
        const currentCap = this.attachmentCap(value.account)
        if (total > currentCap) throw attachmentSizeError(currentCap)
        value.attachments.push(owned)
      }, signal)
      this.invalidate(id)
      return view(changed)
    } catch (error) { await this.store.removeOwnedFile(id, owned); throw error }
  }
  async fetch(request: Request): Promise<Response> {
    const site = request.headers.get('sec-fetch-site'), origin = request.headers.get('origin')
    const fail = (status: number, error: unknown) => json(status, { ok: false, error: { code: error instanceof DraftError ? error.code : (error as { code?: string })?.code === 'SETTINGS_CONFLICT' ? 'settings-conflict' : 'draft-invalid', message: this.safe(error) } })
    if (site && !['same-origin', 'none'].includes(site)) return fail(403, new DraftError('Use the email drafts panel'))
    if (origin) { try { const url = new URL(origin); if (!['http:', 'https:'].includes(url.protocol) || url.host !== (request.headers.get('host') || new URL(request.url).host)) return fail(403, new DraftError('Cross-origin request rejected')) } catch { return fail(403, new DraftError('Invalid origin')) } }
    try {
      this.prune()
      if (request.method === 'GET') {
        const url = new URL(request.url), plan = this.plans.get(url.searchParams.get('preview') ?? ''), file = plan?.attachments.find(file => file.id === url.searchParams.get('attachment'))
        if (!plan || !file || plan.key !== this.connection(plan.draft.account).key) return fail(404, new DraftError('Attachment preview expired; preview again'))
        return new Response(new Uint8Array(file.content), { headers: { 'content-type': 'application/octet-stream', 'content-disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(file.filename), 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' } })
      }
      if (request.method !== 'POST') return fail(405, new DraftError('Use an action the drafts panel supports'))
      const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
      if (request.headers.get('x-dsh-email-draft') !== '1' || !['application/json', 'application/octet-stream'].includes(type ?? '')) return fail(403, new DraftError('Use the email drafts panel'))
      if (!request.body) throw new DraftError('Request body is empty')
      const signal = AbortSignal.any([request.signal, AbortSignal.timeout(120000)])
      if (type === 'application/octet-stream') return json(200, { ok: true, value: await this.upload(request, request.body, signal) })
      const chunks: Uint8Array[] = []
      for await (const chunk of requestChunks(request.body, 256 * 1024, new DraftError('Request exceeds the size limit', 'draft-too-large'), signal)) chunks.push(chunk)
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DraftError('Request body must be an object')
      return json(200, { ok: true, value: await this.action(body, signal) })
    } catch (error) {
      if (error instanceof DraftError && error.code === 'draft-too-large') return fail(413, error)
      return fail(error instanceof DraftError && ['draft-conflict', 'draft-busy', 'draft-submitted'].includes(error.code) || (error as { code?: string })?.code === 'SETTINGS_CONFLICT' ? 409 : 400, error)
    }
  }
}
export function installEmailDrafts(ctx: any, backend: EmailDraftBackend): void {
  ctx.inject?.(['connection'], (host: any) => {
    host.connection?.fetch?.register?.({ path: EMAIL_DRAFT_ROUTE, methods: ['POST', 'GET'], requestBody: 'buffered', fetch: (request: Request) => backend.fetch(request) })
    host.connection?.fetch?.register?.({ path: EMAIL_DRAFT_ROUTE + '/upload', methods: ['POST'], requestBody: 'streaming', fetch: (request: Request) => backend.fetch(request) })
  })
}
