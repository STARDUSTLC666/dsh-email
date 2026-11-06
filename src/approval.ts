/** Outgoing-mail approval is independent of tool execution. */
import type { EmailRuntime } from './runtime.js'
import type { EmailReplyArgs, EmailSendArgs } from './types.js'
import { matchRecipients, parseRecipientPolicies } from './recipient-policy.js'
import { createHash } from 'node:crypto'
import type { EmailService } from './mail-service.js'

type Runtime = Pick<EmailRuntime, 'getSettingsValue' | 'getEffectiveSettings'> & Partial<Pick<EmailRuntime, 'getPool'>>
type PreparedReply = Awaited<ReturnType<EmailService['prepareReply']>>
const approvedReplies = new WeakMap<object, { prepared: PreparedReply; stamp: string; expires: number }>()
function replyStamp(runtime: Runtime, prepared: PreparedReply, args: unknown): string {
  const config=runtime.getEffectiveSettings().accounts.get(prepared.account), value=runtime.getSettingsValue()
  return createHash('sha256').update(JSON.stringify({config,rules:value.trustedRecipientsYaml,allowTrustedReply:value.allowTrustedReply,args})).digest('hex')
}
/** The official pipeline passes the same frozen argument object to gate and body. */
export function takeReplyAuthorization(args: unknown, runtime: Runtime): PreparedReply | undefined {
  if (!args || typeof args !== 'object') return
  const plan=approvedReplies.get(args);if(!plan)return
  approvedReplies.delete(args)
  if(plan.expires<Date.now()||plan.stamp!==replyStamp(runtime,plan.prepared,args))throw new Error('回复的账号或规则已改变，或确认已过期；请重新确认，邮件未发送')
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
            if (matching.blocked) return { kind: 'deny', reason: '收件人被禁止规则拦截，邮件未发送：' + matching.rows.filter(row => row.blocked).map(row => row.address).join(', ') }
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
      }catch{return {kind:'deny',reason:'无法读取原邮件以核对实际收件人；请重新打开邮件后再试，邮件未发送。'}}
    }
    const rememberReply = () => { if(prepared && exec.arguments && typeof exec.arguments==='object')approvedReplies.set(exec.arguments,{prepared,stamp:replyStamp(runtime,prepared,exec.arguments),expires:Date.now()+60000}) }
    if(prepared && value.allowTrustedReply===true){
      try {
        const policy=parseRecipientPolicies(value.trustedRecipientsYaml).get(prepared.account)
        if(policy){
          const matching=await matchRecipients(prepared.to,prepared.cc,policy)
          if(matching.blocked)return {kind:'deny',reason:'回复的实际收件人被禁止规则拦截，邮件未发送。'}
          if(matching.skipsApproval){rememberReply();return next()}
        }
      }catch{/* Invalid rules never grant trusted reply. */}
    }
    if (value.sendApproval === false) return next()
    const replyHint = exec.name === 'email_reply' ? value.allowTrustedReply===true ? ' 本次回复未满足所有实际 To/Cc 都可信的条件，仍需确认。' : ' 可信回复免审默认关闭；可在设置页单独开启，或在草稿页预览收件人后手动发送。' : ''
    let reason: string
    if (exec.name === 'email_send') {
      const args = (exec.arguments ?? {}) as EmailSendArgs
      const attachCount = Array.isArray(args.attachments) ? args.attachments.length : 0
      reason = '发送邮件给 ' + args.to + (args.cc ? '，抄送 ' + args.cc : '') + '，主题「' + args.subject + '」' + (attachCount > 0 ? '，附件 ' + attachCount + ' 个' : '')
    } else {
      const args = (exec.arguments ?? {}) as EmailReplyArgs
      const mode = typeof args.mode === 'string' && args.mode.trim() !== '' ? args.mode.trim().toLowerCase() : 'reply'
      const modeLabel = mode === 'forward' ? '转发' : mode === 'reply-all' ? '回复全部' : '回复'
      reason = modeLabel + '邮件（原邮件 uid=' + args.uid + '）' + (prepared ? '，账号 '+prepared.account+'，收件人 '+prepared.to+(prepared.cc?'，抄送 '+prepared.cc:'')+'，主题「'+prepared.subject+'」' : mode === 'forward' && typeof args.to === 'string' && args.to.trim() !== '' ? '，收件人 ' + args.to : '')
    }
    // Gate-owned approval: we run the approval round-trip ourselves so the
    // denial reason is always honest and actionable — including the Full
    // Access case where the harness policy answers 'rejected' without ever
    // showing a dialog.
    const approval = ctx.get('approval')
    if (approval === undefined) {
      return {
        kind: 'deny',
        reason: exec.name + ' 需要确认，但当前环境没有审批通道（如 headless）。' + replyHint,
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
    if (outcome === 'cancelled') return { kind: 'deny', reason: '发信确认被取消，邮件未发送。' }
    if (outcome === 'unavailable') return { kind: 'deny', reason: '发信确认不可用（没有可用的审批界面），邮件未发送。' + replyHint }
    return {
      kind: 'deny',
      reason: '发信未获批准：要么你拒绝了，要么当前会话处于 Full Access（审批策略 never，不会弹框）。可切回支持确认的权限模式，或在草稿页预览并手动发送。' + replyHint,
    }
  }, { prepend: true })
}
