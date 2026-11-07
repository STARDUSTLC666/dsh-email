import { randomUUID, createHash } from 'node:crypto'
import type { EmailRuntime } from './runtime.js'

/** Excerpt cap for the seeded first message; the full body stays reachable via email_read. */
export const TASK_SESSION_PROMPT_LIMIT = 4000

/**
 * Stable identity for one message across folders: prefer the Message-ID header so the
 * same mail clicked from INBOX and from a moved folder resolves to one task session.
 */
export function taskSessionKey(messageId: string, account: string, folder: string, uid: string | number): string {
  const mid = String(messageId || '').trim().toLowerCase()
  return mid ? `mid:${mid}` : `alt:${account}|${folder}|${uid}`
}

/** Session identity derived from the stable key; reusing it on re-click is the whole dedupe rule. */
export function taskSessionId(key: string): string {
  return `session-email-${createHash('sha256').update(key).digest('hex')}`
}

export function taskSessionTitle(subject: string): string {
  const s = String(subject || '').replace(/\s+/g, ' ').trim().slice(0, 60)
  return `邮件处理：${s || '(无主题)'}`
}

export function taskSessionPrompt(info: {
  account: string
  folder: string
  uid: string | number
  subject: string
  from: string
  date: string
  text: string
}, requirement?: string): string {
  const body = String(info.text || '')
  const lines = [
    '【邮件任务】以下邮件由邮箱页面的「在会话中处理」发起，请按下述处理需求执行。',
    `- 账号：${info.account}`,
    `- 文件夹：${info.folder}`,
    `- UID：${info.uid}（可用 email_read 按账号/文件夹/UID 重读全文与附件）`,
    `- 发件人：${info.from || '(未知)'}`,
    `- 时间：${info.date || '(未知)'}`,
    `- 主题：${info.subject || '(无主题)'}`,
    '',
    '处理需求：',
    String(requirement || '').trim() || '(用户未填写额外需求，请自行判断处理)',
    '',
    '正文节选：',
    body ? body.slice(0, TASK_SESSION_PROMPT_LIMIT) : '(无正文)',
  ]
  if (body.length > TASK_SESSION_PROMPT_LIMIT) lines.push(`……（正文已截断，全文共 ${body.length} 字符，请按需重读）`)
  lines.push('', '请给出处理结论或下一步建议；需要回复邮件或执行其他动作时，先说明再等确认。')
  return lines.join('\n')
}

/**
 * Create (or reuse) a task session for one message and seed it with the approved
 * summary + handling brief. Host services arrive through the plugin ctx.
 */
export async function runEmailTaskSession(opts: {
  ctx?: any
  runtime: Pick<EmailRuntime, 'getEffectiveSettings' | 'getPool'>
  account: string
  folder: string
  uid: string | number
  requirement?: string
  signal?: AbortSignal
}): Promise<{ sessionId: string; created: boolean; title: string }> {
  const read = (await opts.runtime.getPool().read(opts.account, opts.uid, opts.folder, opts.signal)) as any
  const first = Array.isArray(read.from) ? read.from[0] : undefined
  const info = {
    account: opts.account,
    folder: opts.folder,
    uid: opts.uid,
    subject: String(read.subject || ''),
    from: String(first?.address || first?.name || ''),
    date: typeof read.date === 'string' ? read.date : read.date instanceof Date ? read.date.toISOString() : '',
    text: String(read.text || ''),
  }
  const sessionId = taskSessionId(taskSessionKey(String(read.messageId || ''), opts.account, opts.folder, opts.uid))
  const controller = opts.ctx?.sessionController
  if (!controller) throw new Error('当前 Host 不支持任务会话 / this host cannot create task sessions')
  // 任务会话默认工作区：settings 的 taskSessionWorkspace（空 = 跟随 Host 全局默认）。
  const workspace = String(opts.runtime.getEffectiveSettings().taskSessionWorkspace || '').trim()
  try {
    await controller.create({ sessionId, ...(workspace ? { cwd: workspace } : {}) })
  } catch (e) {
    const err = e as { message?: unknown }
    const msg = String(err?.message ?? e)
    if (msg.includes('already exists') || msg.includes('SESSION_ALREADY_EXISTS')) {
      return { sessionId, created: false, title: taskSessionTitle(info.subject) }
    }
    throw e
  }
  // 固定标题「邮件处理：<主题>」并 pin 住（user 源，覆盖引擎自动生成的标题）。
  // rename 失败仅静默降级：不阻塞会话创建，回落引擎默认标题。
  try {
    await controller.rename({ sessionId, title: taskSessionTitle(info.subject) })
  } catch (e) {
    const err = e as { message?: unknown }
    if (!String(err?.message ?? e).includes('already exists')) {
      // 标题设置是可选的增强；任何失败（无 session-title 服务等）都不应终止任务会话。
      console.warn(`[dsh-email] task session title rename skipped: ${String(err?.message ?? e)}`)
    }
  }
  // sessionController.prompt(request, signal) — signal is REQUIRED (non-optional throwIfAborted)
  await controller.prompt({
    sessionId,
    requestId: randomUUID(),
    content: [{ type: 'text', text: taskSessionPrompt(info, opts.requirement) }],
  }, opts.signal)
  return { sessionId, created: true, title: taskSessionTitle(info.subject) }
}
