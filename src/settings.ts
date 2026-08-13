import z from 'schemastery'
import { PROVIDER_NAMES, type EmailConfig } from './config.js'

/** Settings-document namespace this plugin owns (editable from the Web settings page). */
export const SETTINGS_NAMESPACE = 'dsh-email'

/**
 * The settings-page shape: the single default account plus shared policy.
 * Multi-account (`accounts` map) stays YAML-only; the page edits the
 * default/shorthand account.
 */
export const EmailSettingsSchema = z.object({
  provider: z.string().default(''),
  user: z.string().default(''),
  password: z.string().role('secret').default(''),
  inboxFolder: z.string().default('INBOX'),
  sendApproval: z.boolean().default(true),
  maxBodyChars: z.number().default(20000),
  downloadDir: z.string().default(''),
  imap: z.object({
    host: z.string().default(''),
    port: z.number().default(993),
    secure: z.boolean().default(true),
  }),
  smtp: z.object({
    host: z.string().default(''),
    port: z.number().default(465),
    secure: z.boolean().default(true),
  }),
})

export interface EmailSettingsValue {
  provider: string
  user: string
  password: string
  inboxFolder: string
  sendApproval: boolean
  maxBodyChars: number
  downloadDir: string
  imap: { host: string; port: number; secure: boolean }
  smtp: { host: string; port: number; secure: boolean }
}

/** Project the row config (cordis.patch.yml) into the settings-schema base shape. */
export function toSettingsBase(config: EmailConfig): Partial<EmailSettingsValue> {
  return {
    ...(config.provider !== undefined ? { provider: config.provider } : {}),
    ...(config.user !== undefined && config.user !== '' ? { user: config.user } : {}),
    ...(config.password !== undefined && config.password !== '' ? { password: config.password } : {}),
    ...(config.inboxFolder !== undefined && config.inboxFolder !== '' ? { inboxFolder: config.inboxFolder } : {}),
    ...(config.sendApproval !== undefined ? { sendApproval: config.sendApproval } : {}),
    ...(config.maxBodyChars !== undefined ? { maxBodyChars: config.maxBodyChars } : {}),
    ...(config.downloadDir !== undefined && config.downloadDir !== '' ? { downloadDir: config.downloadDir } : {}),
    ...(config.imap !== undefined ? {
      imap: {
        host: config.imap.host ?? '',
        port: config.imap.port ?? 993,
        secure: config.imap.secure ?? true,
      },
    } : {}),
    ...(config.smtp !== undefined ? {
      smtp: {
        host: config.smtp.host ?? '',
        port: config.smtp.port ?? 465,
        secure: config.smtp.secure ?? true,
      },
    } : {}),
  }
}

/**
 * Project a settings value back into EmailConfig shape.
 *
 * `user` is the raw stored user section: only fields the user actually set
 * are projected, so schema defaults never shadow the row config or the
 * provider presets (choosing outlook must NOT force smtp port 465 over the
 * preset's 587). Pass `null` to project every field (draft paths).
 */
export function toEmailConfig(value: EmailSettingsValue, user?: Partial<EmailSettingsValue> | null): EmailConfig {
  const has = (key: keyof EmailSettingsValue): boolean => user === null || user?.[key] !== undefined
  const out: EmailConfig = {}
  if (has('provider')) out.provider = value.provider === '' ? undefined : value.provider as EmailConfig['provider']
  if (has('user')) out.user = value.user
  if (has('password')) out.password = value.password
  if (has('inboxFolder')) out.inboxFolder = value.inboxFolder
  if (has('sendApproval')) out.sendApproval = value.sendApproval
  if (has('maxBodyChars')) out.maxBodyChars = value.maxBodyChars
  if (has('downloadDir')) out.downloadDir = value.downloadDir
  if (user === null || user?.imap !== undefined) {
    const fields: Partial<EmailSettingsValue['imap']> = user === null ? value.imap : (user.imap ?? {})
    const imap: EmailConfig['imap'] = {}
    if (fields.host !== undefined) imap.host = value.imap.host
    if (fields.port !== undefined) imap.port = value.imap.port
    if (fields.secure !== undefined) imap.secure = value.imap.secure
    out.imap = imap
  }
  if (user === null || user?.smtp !== undefined) {
    const fields: Partial<EmailSettingsValue['smtp']> = user === null ? value.smtp : (user.smtp ?? {})
    const smtp: EmailConfig['smtp'] = {}
    if (fields.host !== undefined) smtp.host = value.smtp.host
    if (fields.port !== undefined) smtp.port = value.smtp.port
    if (fields.secure !== undefined) smtp.secure = value.smtp.secure
    out.smtp = smtp
  }
  return out
}

/**
 * Gentle write-path validation: structural mistakes fail loudly, but an
 * incomplete account is allowed (tools report the actionable hint at call
 * time, so an unconfigured install never breaks boot).
 */
export function validateSettingsValue(value: EmailSettingsValue): void {
  if (value.provider !== '' && !PROVIDER_NAMES.includes(value.provider)) {
    throw new Error('未知的邮箱服务商 "' + value.provider + '"，可选：' + PROVIDER_NAMES.join('/') + '（或留空手填 IMAP/SMTP 主机）')
  }
  if (value.imap.port < 1 || value.imap.port > 65535) throw new Error('IMAP 端口必须在 1-65535 之间')
  if (value.smtp.port < 1 || value.smtp.port > 65535) throw new Error('SMTP 端口必须在 1-65535 之间')
  if (value.maxBodyChars < 1000 || value.maxBodyChars > 200000) throw new Error('正文截断上限必须在 1000-200000 之间')
}