/** Outgoing-mail approval is independent of tool execution. */
import type { EmailRuntime } from './runtime.js'
import type { EmailReplyArgs, EmailSendArgs } from './types.js'
import { matchRecipients, parseRecipientPolicies } from './recipient-policy.js'
import { createHash } from 'node:crypto'
import type { EmailService } from './mail-service.js'
import { folderPath, type FolderMutationSnapshot } from './imap-folders.js'

type Runtime = Pick<EmailRuntime, 'getSettingsValue' | 'getEffectiveSettings'> & Partial<Pick<EmailRuntime, 'getPool'>>
type PreparedReply = Awaited<ReturnType<EmailService['prepareReply']>>
const approvedReplies = new WeakMap<object, { prepared: PreparedReply; stamp: string; expires: number }>()
interface FolderAuthorization { account: string; path: string; newName?: string; snapshot?: FolderMutationSnapshot; stamp: string; expires: number }
const approvedFolders = new WeakMap<object, FolderAuthorization>()
const folderTools = new Set(['email_folder_create', 'email_folder_rename', 'email_folder_delete', 'email_folder_purge'])
const folderStamp = (runtime: Pick<EmailRuntime, 'getEffectiveSettings'>, args: unknown, account: string) => createHash('sha256').update(JSON.stringify({ args, account: runtime.getEffectiveSettings().accounts.get(account) })).digest('hex')
export function takeFolderAuthorization(args: unknown, runtime: Pick<EmailRuntime, 'getEffectiveSettings'>): FolderAuthorization {
  const permit = args && typeof args === 'object' ? approvedFolders.get(args) : undefined
  if (!permit) throw new Error('Folder changes require separate confirmation; use the mailbox panel')
  approvedFolders.delete(args as object)
  if (permit.expires < Date.now() || permit.stamp !== folderStamp(runtime, args, permit.account)) throw new Error('Account or confirmation changed; confirm again')
  return permit
}
function replyStamp(runtime: Runtime, prepared: PreparedReply, args: unknown): string {
  const config=runtime.getEffectiveSettings().accounts.get(prepared.account), value=runtime.getSettingsValue()
  return createHash('sha256').update(JSON.stringify({config,rules:value.trustedRecipientsYaml,allowTrustedReply:value.allowTrustedReply,args})).digest('hex')
}
/** The official pipeline passes the same frozen argument object to gate and body. */
export function takeReplyAuthorization(args: unknown, runtime: Runtime): PreparedReply | undefined {
  if (!args || typeof args !== 'object') return
  const plan=approvedReplies.get(args);if(!plan)return
  approvedReplies.delete(args)
  if(plan.expires<Date.now()||plan.stamp!==replyStamp(runtime,plan.prepared,args))throw new Error('The reply account or rules changed, or the confirmation expired; confirm again. No email was sent.')
  return plan.prepared
}

type ApprovalDecision = { kind: 'allow' } | { kind: 'deny'; reason: string } | { kind: 'ask'; reason?: string }
interface PendingExecution {
  name: string
  arguments?: unknown
  agent?: unknown
  callId?: string
  signal?: AbortSignal
}
interface ApprovalContext {
  on(event: 'tools/pre-execute', listener: (exec: PendingExecution, next: () => Promise<ApprovalDecision>) => Promise<ApprovalDecision>, options: { prepend: boolean }): unknown
  get(name: 'approval'): {
    request(input: { agent?: unknown; toolName: string; callId?: string; reason: string; signal?: AbortSignal }): Promise<string>
  } | undefined
}

export function installSendApproval(ctx: ApprovalContext, runtime: Runtime): void {
  ctx.on('tools/pre-execute', async (exec, next) => {
    if (folderTools.has(exec?.name)) {
      try {
        const args = exec.arguments as Record<string, unknown> | undefined
        if (!args || typeof args !== 'object') throw new Error('Invalid folder arguments')
        const settings = runtime.getEffectiveSettings(), account = typeof args.account === 'string' && args.account.trim() ? args.account.trim() : settings.defaultAccount
        const config = settings.accounts.get(account), path = folderPath(args.path)
        if (!config || config.transport) throw new Error('Folder management requires an IMAP account')
        const newName = exec.name === 'email_folder_rename' ? folderPath(args.newName) : undefined
        const destructive = exec.name === 'email_folder_delete' || exec.name === 'email_folder_purge'
        const snapshot = destructive ? await runtime.getPool!().previewFolderMutation(account, path, exec.name === 'email_folder_delete' ? 'delete' : 'purge', exec.signal) : undefined
        const approval = ctx.get('approval')
        if (!approval) return { kind: 'deny', reason: 'Folder changes need a confirmation UI; use the mailbox panel' }
        const stamp = folderStamp(runtime, args, account)
        const result = await approval.request({ agent: exec.agent, toolName: exec.name, callId: exec.callId, signal: exec.signal,
          reason: `${exec.name} · ${account} · ${path}${newName ? ' → ' + newName : ''}${snapshot ? ' · ' + snapshot.count + ' messages; permanent operation' : ''}` })
        if (result !== 'allowed-once') return { kind: 'deny', reason: 'Folder change was not confirmed; no changes made' }
        exec.signal?.throwIfAborted()
        if (stamp !== folderStamp(runtime, args, account)) return { kind: 'deny', reason: 'Account changed; confirm again' }
        approvedFolders.set(args, { account, path, newName, snapshot, stamp, expires: Date.now() + 60000 })
        return next()
      } catch (error) { return { kind: 'deny', reason: error instanceof Error ? error.message : 'Folder operation refused' } }
    }
    if (exec?.name !== 'email_send' && exec?.name !== 'email_reply') return next()
    const value = runtime.getSettingsValue()
    try {
      runtime.getEffectiveSettings()
    } catch {
      return next() // unconfigured: let the tool report the actionable hint
    }
    if (exec.name === 'email_send') {
      const args = (exec.arguments ?? {}) as EmailSendArgs
      try {
        const settings = runtime.getEffectiveSettings(), account = typeof args.account === 'string' && args.account.trim() ? args.account.trim() : settings.defaultAccount
        if (settings.accounts.has(account) && typeof args.to === 'string' && (args.cc === undefined || typeof args.cc === 'string')) {
          const policy = parseRecipientPolicies(value.trustedRecipientsYaml).get(account)
          if (policy) {
            const matching = await matchRecipients(args.to, args.cc ?? '', policy)
            if (matching.blocked) return { kind: 'deny', reason: 'Recipients blocked by a deny rule; no email sent: ' + matching.rows.filter(row => row.blocked).map(row => row.address).join(', ') }
            if (matching.skipsApproval) return next()
          }
        }
      } catch { /* Invalid rules or addresses keep the usual approval; never grant trust on a parse failure. */ }
    }
    let prepared: PreparedReply | undefined
    const args = (exec.arguments ?? {}) as EmailReplyArgs
    const validReply = exec.name==='email_reply' && args.uid!==undefined && ['reply','reply-all','forward'].includes(args.mode||'reply') && (typeof args.text==='string'&&!!args.text.trim()||typeof args.html==='string'&&!!args.html.trim())
    if(validReply && runtime.getPool && value.sendApproval!==false){
      try {
        const pool=runtime.getPool()
        if(typeof pool.prepareReply==='function') prepared=await pool.prepareReply(args.account,args.folder||'',args.uid,args.mode||'reply',args.text||'',args.to||'',args.cc,exec.signal,{html:args.html,locale:args.locale,timeZone:args.timeZone})
      }catch{return {kind:'deny',reason:'Cannot read the original message to verify the actual recipients; reopen the message and try again. No email was sent.'}}
    }
    const rememberReply = () => { if(prepared && exec.arguments && typeof exec.arguments==='object')approvedReplies.set(exec.arguments,{prepared,stamp:replyStamp(runtime,prepared,exec.arguments),expires:Date.now()+60000}) }
    if(prepared && value.allowTrustedReply===true){
      try {
        const policy=parseRecipientPolicies(value.trustedRecipientsYaml).get(prepared.account)
        if(policy){
          const matching=await matchRecipients(prepared.to,prepared.cc,policy)
          if(matching.blocked)return {kind:'deny',reason:'The actual reply recipients are blocked by a deny rule; no email was sent.'}
          if(matching.skipsApproval){rememberReply();return next()}
        }
      }catch{/* Invalid rules never grant trusted reply. */}
    }
    if (value.sendApproval === false) return next()
    const replyHint = exec.name === 'email_reply' ? value.allowTrustedReply===true ? ' This reply does not meet the trusted-To/Cc conditions, so approval is still required.' : ' Trusted-reply skip is off by default; enable it in Settings, or preview the recipients on the Drafts page and send manually.' : ''
    let reason: string
    if (exec.name === 'email_send') {
      const args = (exec.arguments ?? {}) as EmailSendArgs
      const attachCount = Array.isArray(args.attachments) ? args.attachments.length : 0
      reason = 'Send email to ' + args.to + (args.cc ? ', cc ' + args.cc : '') + ', subject "' + args.subject + '"' + (attachCount > 0 ? ', attachments: ' + attachCount : '')
    } else {
      const args = (exec.arguments ?? {}) as EmailReplyArgs
      const mode = typeof args.mode === 'string' && args.mode.trim() !== '' ? args.mode.trim().toLowerCase() : 'reply'
      const modeLabel = mode === 'forward' ? 'Forward' : mode === 'reply-all' ? 'Reply all' : 'Reply'
      reason = modeLabel + ' email (original uid=' + args.uid + ')' + (prepared ? ', account '+prepared.account+', to '+prepared.to+(prepared.cc?', cc '+prepared.cc:'')+', subject "'+prepared.subject+'"' : mode === 'forward' && typeof args.to === 'string' && args.to.trim() !== '' ? ', to ' + args.to : '')
    }
    // Gate-owned approval: we run the approval round-trip ourselves so the
    // denial reason is always honest and actionable — including the Full
    // Access case where the harness policy answers 'rejected' without ever
    // showing a dialog.
    const approval = ctx.get('approval')
    if (approval === undefined) {
      return {
        kind: 'deny',
        reason: exec.name + ' needs approval, but this environment has no approval channel (headless, for example).' + replyHint,
      }
    }
    const outcome = await approval.request({
      agent: exec.agent,
      toolName: exec.name,
      callId: exec.callId,
      reason,
      signal: exec.signal,
    })
    if (outcome === 'allowed-once') { rememberReply(); return next() }
    if (outcome === 'cancelled') return { kind: 'deny', reason: 'Send approval was cancelled; no email was sent.' }
    if (outcome === 'unavailable') return { kind: 'deny', reason: 'Send approval is unavailable (no approval UI); no email was sent.' + replyHint }
    return {
      kind: 'deny',
      reason: 'Send was not approved: either you rejected it, or this session runs in Full Access (approval policy never, so no prompt appears). Switch to a permission mode that supports confirmation, or preview and send manually from the Drafts page.' + replyHint,
    }
  }, { prepend: true })
}
