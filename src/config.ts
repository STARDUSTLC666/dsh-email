export interface ImapConfig {
  host?: string
  port?: number
  secure?: boolean
  connectionTimeoutMs?: number
  socketTimeoutMs?: number
}

export interface SmtpConfig {
  host?: string
  port?: number
  secure?: boolean
}

export interface EmailConfig {
  /** Built-in preset that fills imap/smtp host+port+secure. */
  provider?: 'qq' | '163' | '126' | 'sina' | 'aliyun' | 'gmail' | 'outlook' | 'icloud'
  /** Login address, e.g. you@qq.com. */
  user?: string
  /** App password / authorization code. Falls back to $DSH_EMAIL_PASSWORD. */
  password?: string
  imap?: ImapConfig
  smtp?: SmtpConfig
  /** Mailbox used by the read/search/list tools. Default 'INBOX'. */
  inboxFolder?: string
  /** Ask the user for approval before email_send. Default true. */
  sendApproval?: boolean
  /** Plain-text body cap for email_read. Default 20000. */
  maxBodyChars?: number
}

export interface ProviderPreset {
  imap: { host: string; port: number; secure: boolean }
  smtp: { host: string; port: number; secure: boolean }
}

export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  qq: { imap: { host: 'imap.qq.com', port: 993, secure: true }, smtp: { host: 'smtp.qq.com', port: 465, secure: true } },
  '163': { imap: { host: 'imap.163.com', port: 993, secure: true }, smtp: { host: 'smtp.163.com', port: 465, secure: true } },
  '126': { imap: { host: 'imap.126.com', port: 993, secure: true }, smtp: { host: 'smtp.126.com', port: 465, secure: true } },
  sina: { imap: { host: 'imap.sina.com', port: 993, secure: true }, smtp: { host: 'smtp.sina.com', port: 465, secure: true } },
  aliyun: { imap: { host: 'imap.aliyun.com', port: 993, secure: true }, smtp: { host: 'smtp.aliyun.com', port: 465, secure: true } },
  gmail: { imap: { host: 'imap.gmail.com', port: 993, secure: true }, smtp: { host: 'smtp.gmail.com', port: 465, secure: true } },
  outlook: { imap: { host: 'outlook.office365.com', port: 993, secure: true }, smtp: { host: 'smtp.office365.com', port: 587, secure: false } },
  icloud: { imap: { host: 'imap.mail.me.com', port: 993, secure: true }, smtp: { host: 'smtp.mail.me.com', port: 587, secure: false } },
}

export const PROVIDER_NAMES = Object.keys(PROVIDER_PRESETS)

export const EMAIL_PASSWORD_ENV = 'DSH_EMAIL_PASSWORD'

/** Fully resolved, validated configuration. */
export interface ResolvedEmailConfig {
  user: string
  password: string
  imap: ImapConfig & { host: string; port: number; secure: boolean }
  smtp: SmtpConfig & { host: string; port: number; secure: boolean }
  inboxFolder: string
  sendApproval: boolean
  maxBodyChars: number
  providerName: string | null
}

/**
 * Resolve and validate the raw row config. Throws with an actionable message
 * (in Chinese, since it is what the user and the model both read) when the
 * account is not fully specified.
 */
export function resolveEmailConfig(config: EmailConfig | undefined): ResolvedEmailConfig {
  const raw = config ?? {}
  const preset = raw.provider === undefined ? undefined : PROVIDER_PRESETS[raw.provider]
  if (raw.provider !== undefined && preset === undefined) {
    throw new Error(`dsh-email：未知的邮箱服务商 "${raw.provider}"，可选：${PROVIDER_NAMES.join('/')}；或省略 provider，直接填写 imap.host 与 smtp.host`)
  }
  const user = raw.user?.trim() ?? ''
  const password = raw.password ?? process.env[EMAIL_PASSWORD_ENV] ?? ''
  const imap = {
    host: raw.imap?.host ?? preset?.imap.host,
    port: raw.imap?.port ?? preset?.imap.port,
    secure: raw.imap?.secure ?? preset?.imap.secure,
    connectionTimeoutMs: raw.imap?.connectionTimeoutMs,
    socketTimeoutMs: raw.imap?.socketTimeoutMs,
  }
  const smtp = {
    host: raw.smtp?.host ?? preset?.smtp.host,
    port: raw.smtp?.port ?? preset?.smtp.port,
    secure: raw.smtp?.secure ?? preset?.smtp.secure,
  }
  const problems: string[] = []
  if (user === '') problems.push('user（邮箱地址）未填写')
  if (password === '') problems.push(`password 未填写（或用环境变量 ${EMAIL_PASSWORD_ENV}）`)
  if (imap.host === undefined || imap.host === '') problems.push(`imap.host 未填写（可填 provider 预设：${PROVIDER_NAMES.join('/')}）`)
  if (smtp.host === undefined || smtp.host === '') problems.push('smtp.host 未填写（同上）')
  if (problems.length > 0) {
    throw new Error(`dsh-email 未配置：${problems.join('；')}。请在 profile 的 cordis.patch.yml 中覆盖 tool-email 行并重启（见插件 README）`)
  }
  return {
    user,
    password,
    imap: { ...imap, host: imap.host!, port: imap.port!, secure: imap.secure! },
    smtp: { ...smtp, host: smtp.host!, port: smtp.port!, secure: smtp.secure! },
    inboxFolder: raw.inboxFolder?.trim() || 'INBOX',
    sendApproval: raw.sendApproval !== false,
    maxBodyChars: clampInt(raw.maxBodyChars, 20000, 1000, 200000),
    providerName: raw.provider ?? null,
  }
}

export function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? Math.trunc(value) : fallback
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}