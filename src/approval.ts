/** Outgoing-mail approval is independent of tool execution. */
import type { EmailRuntime } from './runtime.js'
import type { EmailReplyArgs, EmailSendArgs } from './types.js'
import { matchRecipients, parseRecipientPolicies } from './recipient-policy.js'

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

export function installSendApproval(ctx: ApprovalContext, runtime: Pick<EmailRuntime, 'getSettingsValue' | 'getEffectiveSettings'>): void {
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
    if (value.sendApproval === false) return next()
    let reason: string
    if (exec.name === 'email_send') {
      const args = (exec.arguments ?? {}) as EmailSendArgs
      const attachCount = Array.isArray(args.attachments) ? args.attachments.length : 0
      reason = '发送邮件给 ' + args.to + (args.cc ? '，抄送 ' + args.cc : '') + '，主题「' + args.subject + '」' + (attachCount > 0 ? '，附件 ' + attachCount + ' 个' : '')
    } else {
      const args = (exec.arguments ?? {}) as EmailReplyArgs
      const mode = typeof args.mode === 'string' && args.mode.trim() !== '' ? args.mode.trim().toLowerCase() : 'reply'
      const modeLabel = mode === 'forward' ? '转发' : mode === 'reply-all' ? '回复全部' : '回复'
      reason = modeLabel + '邮件（原邮件 uid=' + args.uid + '）' + (mode === 'forward' && typeof args.to === 'string' && args.to.trim() !== '' ? '，收件人 ' + args.to : '')
    }
    // Gate-owned approval: we run the approval round-trip ourselves so the
    // denial reason is always honest and actionable — including the Full
    // Access case where the harness policy answers 'rejected' without ever
    // showing a dialog.
    const approval = ctx.get('approval')
    if (approval === undefined) {
      return {
        kind: 'deny',
        reason: 'email_send 需要确认，但当前环境没有审批通道（如 headless）。如确定安全，可在配置中设置 sendApproval: false 后直接发送。',
      }
    }
    const outcome = await approval.request({
      agent: exec.agent,
      toolName: exec.name,
      callId: exec.callId,
      reason,
      signal: exec.signal,
    })
    if (outcome === 'allowed-once') return next()
    if (outcome === 'cancelled') return { kind: 'deny', reason: '发信确认被取消，邮件未发送。' }
    if (outcome === 'unavailable') return { kind: 'deny', reason: '发信确认不可用（没有可用的审批界面），邮件未发送。' }
    return {
      kind: 'deny',
      reason: '发信未获批准：要么你拒绝了，要么当前会话处于 Full Access（审批策略 never，不会弹框）。若在 Full Access：切到 Read Only / Write 再发，或关闭 sendApproval（自行承担风险）。',
    }
  }, { prepend: true })
}
