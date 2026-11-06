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
}): string {
  const body = String(info.text || '')
  const lines = [
    '【邮件任务】以下邮件由邮箱页面的「在会话中处理」发起，请分析并按需要处理。',
    `- 账号：${info.account}`,
    `- 文件夹：${info.folder}`,
    `- UID：${info.uid}（可用 email_read 按账号/文件夹/UID 重读全文与附件）`,
    `- 发件人：${info.from || '(未知)'}`,
    `- 时间：${info.date || '(未知)'}`,
    `- 主题：${info.subject || '(无主题)'}`,
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
  signal?: AbortSignal
}): Promise<{ sessionId: string; created: boolean; title: string }> {
  const read = (await opts.runtime.getPool().read(opts.account, opts.uid, opts.folder, opts.signal)) as any
  const settings = opts.runtime.getEffectiveSettings() as any
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
  const agents = opts.ctx?.agents, sessions = opts.ctx?.sessions
  if (!agents || !sessions) throw new Error('当前 Host 不支持任务会话 / this host cannot create task sessions')
  const existing = agents.get(sessionId)
  if (existing) return { sessionId, created: false, title: taskSessionTitle(info.subject) }
  const controller = typeof opts.ctx?.get === 'function' ? opts.ctx.get('sessionController') : undefined
  if (!controller) throw new Error('任务会话需要 Web Host 的 sessionController 服务 / task sessions need the web host sessionController service')
  const workspace = typeof settings.taskSessionWorkspace === 'string' ? settings.taskSessionWorkspace.trim() : ''
  await controller.create({ sessionId, ...(workspace ? { cwd: workspace } : {}) })
  const agent = agents.get(sessionId)
  if (!agent) throw new Error('会话已创建但未能解析，请稍后重试 / the session was created but could not be resolved; retry')
  agent.followup({
    id: randomUUID(),
    role: 'user',
    content: [{ type: 'text', text: taskSessionPrompt(info) }],
    source: { kind: 'plugin' },
  })
  await sessions.flush(agent.session)
  const titles = typeof opts.ctx?.get === 'function' ? opts.ctx.get('sessionTitle') : undefined
  if (titles && titles.get(agent.session) === undefined) {
    try {
      titles.rename(agent.session, taskSessionTitle(info.subject))
    } catch {}
  }
  return { sessionId, created: true, title: taskSessionTitle(info.subject) }
}
