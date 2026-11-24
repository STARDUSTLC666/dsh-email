/**
 * Layered email server autodiscovery (offline-first, zero-credential, SSRF-hardened).
 *
 * Discovery order:
 * 1. Built-in provider domains (instant, offline)
 * 2. Curated offline extended provider database (instant, offline)
 * 3. DNS MX reverse-lookup for hosted corporate/custom-domain mailboxes
 * 4. DNS SRV (RFC 6186 / RFC 8314)
 * 5. Domain HTTPS Autoconfig XML (public domains only, via pinned public downloader)
 * 6. Mozilla Thunderbird ISPDB (public domains only, via pinned public downloader)
 *
 * Security boundaries:
 * - Never accepts or touches passwords, authorization codes, or OAuth tokens.
 * - Immediately strips everything before `@`; only the domain ever leaves the function.
 * - Private/internal/reserved domains (`!publicDnsName(domain)`) never trigger
 *   public HTTPS requests (domain autoconfig or Thunderbird ISPDB).
 * - Rejects plaintext (`socketType: plain`) endpoints and POP3 STARTTLS (`dsh-email`
 *   POP3 treats `secure: false` as plaintext, not STLS).
 * - Public discovery sources may only return public hostnames (never IP literals,
 *   loopback, or private/internal names).
 */
import type { MxRecord, SrvRecord } from 'node:dns'
import { resolveMx as dnsResolveMx, resolveSrv as dnsResolveSrv } from 'node:dns/promises'
import { get as httpsGet } from 'node:https'
import { isIP } from 'node:net'
import { parseDocument } from 'htmlparser2'
import { mailHostProblem, POP3_PRESETS, PROVIDER_PRESETS, type ProviderName } from './config.js'
import { publicDnsName, withAbort } from './public-dns.js'
import { downloadPublicBytes } from './public-download.js'

export type AutodiscoverSource =
  | 'builtin-domain'
  | 'offline-db'
  | 'mx'
  | 'srv'
  | 'domain-autoconfig'
  | 'ispdb'

export type DiscoveredProvider = ProviderName | 'agentmail' | 'agentmail-eu'

export interface DiscoveredEndpoint {
  host: string
  port: number
  secure: boolean
}

export interface AutodiscoverResult {
  domain: string
  source: AutodiscoverSource
  /** Built-in provider ID when matched directly, via MX, or via known hostnames. */
  provider?: DiscoveredProvider
  labelZh: string
  labelEn: string
  authKind: 'oauth2' | 'password'
  oauthProvider?: 'google' | 'microsoft'
  imap?: DiscoveredEndpoint
  smtp?: DiscoveredEndpoint
  pop3?: DiscoveredEndpoint
  hintZh?: string
  hintEn?: string
  /** Layers attempted in order (source names only, no secrets or full addresses). */
  checked: AutodiscoverSource[]
}

export interface AutodiscoverDependencies {
  resolveMx?: (domain: string) => Promise<MxRecord[]>
  resolveSrv?: (name: string) => Promise<SrvRecord[]>
  queryPublicDnsJson?: (name: string, type: 15 | 33, signal: AbortSignal) => Promise<unknown>
  fetchPublicXml?: (url: string, signal: AbortSignal) => Promise<string | undefined>
}

export interface AutodiscoverOptions {
  signal?: AbortSignal
  /** Allow HTTPS lookup against domain autoconfig & Thunderbird ISPDB for public domains. Default true. */
  allowOnlineLookup?: boolean
  /** Per-step timeout in ms (clamped to 500–8000, default 4000). */
  stepTimeoutMs?: number
  dependencies?: AutodiscoverDependencies
}

const AUTOCONFIG_MAX_BYTES = 64 * 1024
const DEFAULT_STEP_TIMEOUT_MS = 4000
const OVERALL_TIMEOUT_MS = 12000

interface ProviderTemplate {
  provider?: DiscoveredProvider
  labelZh: string
  labelEn: string
  authKind?: 'oauth2' | 'password'
  oauthProvider?: 'google' | 'microsoft'
  imap?: DiscoveredEndpoint
  smtp?: DiscoveredEndpoint
  pop3?: DiscoveredEndpoint
  hintZh?: string
  hintEn?: string
}

const BUILTIN_META: Record<ProviderName, { labelZh: string; labelEn: string; authKind?: 'oauth2' | 'password'; oauthProvider?: 'google' | 'microsoft'; hintZh?: string; hintEn?: string }> = {
  qq: {
    labelZh: 'QQ 邮箱',
    labelEn: 'QQ Mail',
    hintZh: '请在 QQ 邮箱「设置 → 账户」开启 IMAP/SMTP 服务并填入授权码。',
    hintEn: 'Enable IMAP/SMTP in QQ Mail settings and use an authorization code.',
  },
  exmail: {
    labelZh: '腾讯企业邮箱 / 企业微信邮箱',
    labelEn: 'Tencent Exmail / WeCom Mail',
    hintZh: '请填写完整企业邮箱地址及管理员/网页端生成的客户端专用密码。',
    hintEn: 'Use your full corporate address and a client-specific password/authorization code.',
  },
  '163': {
    labelZh: '163 邮箱',
    labelEn: '163 Mail',
    hintZh: '请在网易邮箱「设置 → POP3/SMTP/IMAP」开启服务并生成授权码。',
    hintEn: 'Enable IMAP/SMTP in NetEase Mail settings and use an authorization code.',
  },
  '126': {
    labelZh: '126 邮箱',
    labelEn: '126 Mail',
    hintZh: '请在网易邮箱「设置 → POP3/SMTP/IMAP」开启服务并生成授权码。',
    hintEn: 'Enable IMAP/SMTP in NetEase Mail settings and use an authorization code.',
  },
  sina: {
    labelZh: '新浪邮箱',
    labelEn: 'Sina Mail',
    hintZh: '请在新浪邮箱网页端开启 IMAP/SMTP 服务并使用授权码。',
    hintEn: 'Enable IMAP/SMTP in Sina Mail web settings and use an authorization code.',
  },
  aliyun: {
    labelZh: '阿里邮箱',
    labelEn: 'Alibaba Mail',
    hintZh: '请在阿里邮箱设置中开启 IMAP/SMTP 服务（如开启三方安全密码请填专用密码）。',
    hintEn: 'Enable IMAP/SMTP in Alibaba Mail settings (use an app password if required).',
  },
  gmail: {
    labelZh: 'Gmail / Google Workspace',
    labelEn: 'Gmail / Google Workspace',
    authKind: 'password',
    oauthProvider: 'google',
    hintZh: '可使用 Google 应用专用密码，或在下方将认证方式切换为 OAuth2（需自建 Desktop app 客户端）。',
    hintEn: 'Use a Google app password, or switch Authentication to OAuth2 with your own Google Desktop app client.',
  },
  outlook: {
    labelZh: 'Outlook / Microsoft 365',
    labelEn: 'Outlook / Microsoft 365',
    authKind: 'oauth2',
    oauthProvider: 'microsoft',
    hintZh: '默认使用 Microsoft OAuth2 设备码登录（免密码）；仍允许基础认证的混合租户可切换为密码。',
    hintEn: 'Uses Microsoft OAuth2 device-code sign-in by default; tenants that still allow basic auth can switch to password.',
  },
  icloud: {
    labelZh: 'iCloud 邮箱',
    labelEn: 'iCloud Mail',
    hintZh: '请在 Apple 账户安全设置中生成「App 专用密码」填入。',
    hintEn: 'Generate an App-Specific Password in your Apple Account security settings.',
  },
}

function builtinTemplate(provider: ProviderName, override?: Partial<ProviderTemplate>): ProviderTemplate {
  const preset = PROVIDER_PRESETS[provider]
  const popHost = POP3_PRESETS[provider]
  const meta = BUILTIN_META[provider]
  return {
    provider,
    labelZh: override?.labelZh ?? meta.labelZh,
    labelEn: override?.labelEn ?? meta.labelEn,
    authKind: override?.authKind ?? meta.authKind ?? 'password',
    ...(meta.oauthProvider ? { oauthProvider: meta.oauthProvider } : {}),
    imap: { ...preset.imap },
    smtp: { ...preset.smtp },
    ...(popHost ? { pop3: { host: popHost, port: 995, secure: true } } : {}),
    ...(override?.hintZh ?? meta.hintZh ? { hintZh: override?.hintZh ?? meta.hintZh } : {}),
    ...(override?.hintEn ?? meta.hintEn ? { hintEn: override?.hintEn ?? meta.hintEn } : {}),
  }
}

/** Layer 1: Exact public domains mapped directly to built-in providers. */
const BUILTIN_DOMAINS: Record<string, ProviderTemplate> = {
  'qq.com': builtinTemplate('qq'),
  'vip.qq.com': builtinTemplate('qq'),
  'foxmail.com': builtinTemplate('qq', { labelZh: 'Foxmail（QQ 邮箱）', labelEn: 'Foxmail (QQ Mail)' }),
  '163.com': builtinTemplate('163'),
  'vip.163.com': builtinTemplate('163'),
  '126.com': builtinTemplate('126'),
  'vip.126.com': builtinTemplate('126'),
  'sina.com': builtinTemplate('sina'),
  'sina.cn': builtinTemplate('sina'),
  'vip.sina.com': builtinTemplate('sina'),
  'aliyun.com': builtinTemplate('aliyun'),
  'gmail.com': builtinTemplate('gmail'),
  'googlemail.com': builtinTemplate('gmail'),
  'outlook.com': builtinTemplate('outlook'),
  'outlook.cn': builtinTemplate('outlook'),
  'hotmail.com': builtinTemplate('outlook'),
  'hotmail.co.uk': builtinTemplate('outlook'),
  'live.com': builtinTemplate('outlook'),
  'live.cn': builtinTemplate('outlook'),
  'msn.com': builtinTemplate('outlook'),
  'icloud.com': builtinTemplate('icloud'),
  'me.com': builtinTemplate('icloud'),
  'mac.com': builtinTemplate('icloud'),
  'agentmail.to': {
    provider: 'agentmail',
    labelZh: 'AgentMail (US API)',
    labelEn: 'AgentMail (US API)',
    authKind: 'password',
    hintZh: '无需配置 IMAP/SMTP，填入 AgentMail 控制台的 API Key 即可。',
    hintEn: 'No IMAP/SMTP needed; enter your API key from the AgentMail console.',
  },
}

/** Layer 2: Curated offline extended provider database (Chinese + global mainstream providers). */
const OFFLINE_PROVIDERS: Record<string, ProviderTemplate> = {
  'yeah.net': {
    labelZh: '网易 Yeah 邮箱',
    labelEn: 'NetEase Yeah Mail',
    imap: { host: 'imap.yeah.net', port: 993, secure: true },
    smtp: { host: 'smtp.yeah.net', port: 465, secure: true },
    pop3: { host: 'pop.yeah.net', port: 995, secure: true },
    hintZh: '请在网页端「设置 → POP3/SMTP/IMAP」开启服务并生成授权码。',
    hintEn: 'Enable IMAP/SMTP in webmail settings and generate an authorization code.',
  },
  '188.com': {
    labelZh: '网易 188 财富邮',
    labelEn: 'NetEase 188 Mail',
    imap: { host: 'imap.188.com', port: 993, secure: true },
    smtp: { host: 'smtp.188.com', port: 465, secure: true },
    pop3: { host: 'pop.188.com', port: 995, secure: true },
    hintZh: '请在网页端开启 IMAP/SMTP 服务并生成授权码。',
    hintEn: 'Enable IMAP/SMTP in webmail settings and generate an authorization code.',
  },
  'sohu.com': {
    labelZh: '搜狐邮箱',
    labelEn: 'Sohu Mail',
    imap: { host: 'imap.sohu.com', port: 993, secure: true },
    smtp: { host: 'smtp.sohu.com', port: 465, secure: true },
    pop3: { host: 'pop3.sohu.com', port: 995, secure: true },
    hintZh: '请在搜狐邮箱设置中开启 IMAP/SMTP 并使用独立密码/授权码。',
    hintEn: 'Enable IMAP/SMTP in Sohu Mail settings and use an authorization code.',
  },
  '139.com': {
    labelZh: '中国移动 139 邮箱',
    labelEn: 'China Mobile 139 Mail',
    imap: { host: 'imap.139.com', port: 993, secure: true },
    smtp: { host: 'smtp.139.com', port: 465, secure: true },
    pop3: { host: 'pop.139.com', port: 995, secure: true },
    hintZh: '请在 139 邮箱「设置 → 客户端设置」开启 IMAP/SMTP 并获取授权码。',
    hintEn: 'Enable IMAP/SMTP in 139 Mail client settings and generate an authorization code.',
  },
  '189.cn': {
    labelZh: '中国电信 189 邮箱',
    labelEn: 'China Telecom 189 Mail',
    imap: { host: 'imap.189.cn', port: 993, secure: true },
    smtp: { host: 'smtp.189.cn', port: 465, secure: true },
    pop3: { host: 'pop.189.cn', port: 995, secure: true },
    hintZh: '请在 189 邮箱设置中开启客户端收发并使用客户端授权码。',
    hintEn: 'Enable client access in 189 Mail settings and use a client authorization code.',
  },
  'wo.cn': {
    labelZh: '中国联通沃邮箱',
    labelEn: 'China Unicom Wo Mail',
    imap: { host: 'imap.wo.cn', port: 993, secure: true },
    smtp: { host: 'smtp.wo.cn', port: 465, secure: true },
    pop3: { host: 'pop.wo.cn', port: 995, secure: true },
    hintZh: '请在沃邮箱设置中开启 IMAP/SMTP 服务并获取客户端授权码。',
    hintEn: 'Enable IMAP/SMTP in Wo Mail settings and use a client authorization code.',
  },
  '21cn.com': {
    labelZh: '21CN 邮箱',
    labelEn: '21CN Mail',
    imap: { host: 'imap.21cn.com', port: 993, secure: true },
    smtp: { host: 'smtp.21cn.com', port: 465, secure: true },
  },
  'tom.com': {
    labelZh: 'TOM 邮箱',
    labelEn: 'TOM Mail',
    imap: { host: 'imap.tom.com', port: 993, secure: true },
    smtp: { host: 'smtp.tom.com', port: 465, secure: true },
  },
  'feishu.cn': {
    labelZh: '飞书邮箱',
    labelEn: 'Feishu Mail',
    imap: { host: 'imap.feishu.cn', port: 993, secure: true },
    smtp: { host: 'smtp.feishu.cn', port: 465, secure: true },
    hintZh: '请在飞书邮箱「设置 → 第三方邮箱客户端登录」生成专用密码。',
    hintEn: 'Generate a dedicated third-party client password in Feishu Mail settings.',
  },
  'larksuite.com': {
    labelZh: 'Lark Mail',
    labelEn: 'Lark Mail',
    imap: { host: 'imap.larksuite.com', port: 993, secure: true },
    smtp: { host: 'smtp.larksuite.com', port: 465, secure: true },
    hintZh: '请在 Lark Mail 第三方客户端设置中生成专用密码。',
    hintEn: 'Generate a dedicated third-party client password in Lark Mail settings.',
  },
  'yahoo.com': {
    labelZh: 'Yahoo Mail',
    labelEn: 'Yahoo Mail',
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
    hintZh: '请在 Yahoo 账户安全页生成应用专用密码（App Password）。',
    hintEn: 'Generate an App Password in your Yahoo Account Security settings.',
  },
  'ymail.com': {
    labelZh: 'Yahoo Mail',
    labelEn: 'Yahoo Mail',
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
    hintZh: '请在 Yahoo 账户安全页生成应用专用密码（App Password）。',
    hintEn: 'Generate an App Password in your Yahoo Account Security settings.',
  },
  'rocketmail.com': {
    labelZh: 'Yahoo Mail',
    labelEn: 'Yahoo Mail',
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
    hintZh: '请在 Yahoo 账户安全页生成应用专用密码（App Password）。',
    hintEn: 'Generate an App Password in your Yahoo Account Security settings.',
  },
  'yahoo.co.uk': {
    labelZh: 'Yahoo Mail',
    labelEn: 'Yahoo Mail',
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
    hintZh: '请在 Yahoo 账户安全页生成应用专用密码（App Password）。',
    hintEn: 'Generate an App Password in your Yahoo Account Security settings.',
  },
  'yahoo.co.jp': {
    labelZh: 'Yahoo! JAPAN Mail',
    labelEn: 'Yahoo! JAPAN Mail',
    imap: { host: 'imap.mail.yahoo.co.jp', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.co.jp', port: 465, secure: true },
  },
  'aol.com': {
    labelZh: 'AOL Mail',
    labelEn: 'AOL Mail',
    imap: { host: 'imap.aol.com', port: 993, secure: true },
    smtp: { host: 'smtp.aol.com', port: 465, secure: true },
    hintZh: '请在 AOL 账户安全页生成应用专用密码（App Password）。',
    hintEn: 'Generate an App Password in your AOL Account Security settings.',
  },
  'fastmail.com': {
    labelZh: 'Fastmail',
    labelEn: 'Fastmail',
    imap: { host: 'imap.fastmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.fastmail.com', port: 465, secure: true },
    hintZh: '请在 Fastmail「Privacy & Security → Integrations」创建 App Password。',
    hintEn: 'Create an App Password under Fastmail Privacy & Security → Integrations.',
  },
  'fastmail.fm': {
    labelZh: 'Fastmail',
    labelEn: 'Fastmail',
    imap: { host: 'imap.fastmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.fastmail.com', port: 465, secure: true },
    hintZh: '请在 Fastmail「Privacy & Security → Integrations」创建 App Password。',
    hintEn: 'Create an App Password under Fastmail Privacy & Security → Integrations.',
  },
  'zoho.com': {
    labelZh: 'Zoho Mail',
    labelEn: 'Zoho Mail',
    imap: { host: 'imap.zoho.com', port: 993, secure: true },
    smtp: { host: 'smtp.zoho.com', port: 465, secure: true },
    hintZh: '请在 Zoho Mail 设置中开启 IMAP，如开启两步验证请使用应用专用密码。',
    hintEn: 'Enable IMAP in Zoho Mail settings; use an App-Specific Password if 2FA is enabled.',
  },
  'zohomail.com': {
    labelZh: 'Zoho Mail',
    labelEn: 'Zoho Mail',
    imap: { host: 'imap.zoho.com', port: 993, secure: true },
    smtp: { host: 'smtp.zoho.com', port: 465, secure: true },
    hintZh: '请在 Zoho Mail 设置中开启 IMAP，如开启两步验证请使用应用专用密码。',
    hintEn: 'Enable IMAP in Zoho Mail settings; use an App-Specific Password if 2FA is enabled.',
  },
  'zoho.eu': {
    labelZh: 'Zoho Mail (EU)',
    labelEn: 'Zoho Mail (EU)',
    imap: { host: 'imap.zoho.eu', port: 993, secure: true },
    smtp: { host: 'smtp.zoho.eu', port: 465, secure: true },
  },
  'zoho.com.cn': {
    labelZh: 'Zoho Mail (中国)',
    labelEn: 'Zoho Mail (China)',
    imap: { host: 'imap.zoho.com.cn', port: 993, secure: true },
    smtp: { host: 'smtp.zoho.com.cn', port: 465, secure: true },
  },
  'yandex.com': {
    labelZh: 'Yandex Mail',
    labelEn: 'Yandex Mail',
    imap: { host: 'imap.yandex.com', port: 993, secure: true },
    smtp: { host: 'smtp.yandex.com', port: 465, secure: true },
    hintZh: '请在 Yandex 邮箱开启 IMAP 并使用应用密码（App Password）。',
    hintEn: 'Enable IMAP in Yandex Mail and use an App Password.',
  },
  'yandex.ru': {
    labelZh: 'Yandex Mail',
    labelEn: 'Yandex Mail',
    imap: { host: 'imap.yandex.ru', port: 993, secure: true },
    smtp: { host: 'smtp.yandex.ru', port: 465, secure: true },
    hintZh: '请在 Yandex 邮箱开启 IMAP 并使用应用密码（App Password）。',
    hintEn: 'Enable IMAP in Yandex Mail and use an App Password.',
  },
  'ya.ru': {
    labelZh: 'Yandex Mail',
    labelEn: 'Yandex Mail',
    imap: { host: 'imap.yandex.ru', port: 993, secure: true },
    smtp: { host: 'smtp.yandex.ru', port: 465, secure: true },
  },
  'gmx.com': {
    labelZh: 'GMX Mail',
    labelEn: 'GMX Mail',
    imap: { host: 'imap.gmx.com', port: 993, secure: true },
    smtp: { host: 'mail.gmx.com', port: 587, secure: false },
  },
  'gmx.net': {
    labelZh: 'GMX Mail',
    labelEn: 'GMX Mail',
    imap: { host: 'imap.gmx.net', port: 993, secure: true },
    smtp: { host: 'mail.gmx.net', port: 587, secure: false },
  },
  'gmx.de': {
    labelZh: 'GMX Mail',
    labelEn: 'GMX Mail',
    imap: { host: 'imap.gmx.net', port: 993, secure: true },
    smtp: { host: 'mail.gmx.net', port: 587, secure: false },
  },
  'web.de': {
    labelZh: 'WEB.DE Mail',
    labelEn: 'WEB.DE Mail',
    imap: { host: 'imap.web.de', port: 993, secure: true },
    smtp: { host: 'smtp.web.de', port: 587, secure: false },
  },
  'mail.ru': {
    labelZh: 'Mail.ru',
    labelEn: 'Mail.ru',
    imap: { host: 'imap.mail.ru', port: 993, secure: true },
    smtp: { host: 'smtp.mail.ru', port: 465, secure: true },
    hintZh: '请在 Mail.ru 安全设置中为外部应用生成专用密码。',
    hintEn: 'Generate an external app password in Mail.ru security settings.',
  },
  'bk.ru': {
    labelZh: 'Mail.ru',
    labelEn: 'Mail.ru',
    imap: { host: 'imap.mail.ru', port: 993, secure: true },
    smtp: { host: 'smtp.mail.ru', port: 465, secure: true },
  },
  'inbox.ru': {
    labelZh: 'Mail.ru',
    labelEn: 'Mail.ru',
    imap: { host: 'imap.mail.ru', port: 993, secure: true },
    smtp: { host: 'smtp.mail.ru', port: 465, secure: true },
  },
  'list.ru': {
    labelZh: 'Mail.ru',
    labelEn: 'Mail.ru',
    imap: { host: 'imap.mail.ru', port: 993, secure: true },
    smtp: { host: 'smtp.mail.ru', port: 465, secure: true },
  },
  'naver.com': {
    labelZh: 'Naver Mail',
    labelEn: 'Naver Mail',
    imap: { host: 'imap.naver.com', port: 993, secure: true },
    smtp: { host: 'smtp.naver.com', port: 587, secure: false },
  },
  'daum.net': {
    labelZh: 'Daum Mail',
    labelEn: 'Daum Mail',
    imap: { host: 'imap.daum.net', port: 993, secure: true },
    smtp: { host: 'smtp.daum.net', port: 465, secure: true },
  },
  'hanmail.net': {
    labelZh: 'Daum Mail',
    labelEn: 'Daum Mail',
    imap: { host: 'imap.daum.net', port: 993, secure: true },
    smtp: { host: 'smtp.daum.net', port: 465, secure: true },
  },
  'mailbox.org': {
    labelZh: 'mailbox.org',
    labelEn: 'mailbox.org',
    imap: { host: 'imap.mailbox.org', port: 993, secure: true },
    smtp: { host: 'smtp.mailbox.org', port: 465, secure: true },
  },
  'posteo.de': {
    labelZh: 'Posteo',
    labelEn: 'Posteo',
    imap: { host: 'posteo.de', port: 993, secure: true },
    smtp: { host: 'posteo.de', port: 465, secure: true },
  },
  'posteo.net': {
    labelZh: 'Posteo',
    labelEn: 'Posteo',
    imap: { host: 'posteo.de', port: 993, secure: true },
    smtp: { host: 'posteo.de', port: 465, secure: true },
  },
  'migadu.com': {
    labelZh: 'Migadu',
    labelEn: 'Migadu',
    imap: { host: 'imap.migadu.com', port: 993, secure: true },
    smtp: { host: 'smtp.migadu.com', port: 465, secure: true },
  },
  'runbox.com': {
    labelZh: 'Runbox',
    labelEn: 'Runbox',
    imap: { host: 'mail.runbox.com', port: 993, secure: true },
    smtp: { host: 'smtp.runbox.com', port: 465, secure: true },
  },
}

/** Layer 3: MX suffix table mapping custom-domain corporate/hosted mailboxes to real providers. */
interface MxRule {
  suffixes: readonly string[]
  template: ProviderTemplate
}

const MX_RULES: readonly MxRule[] = [
  {
    suffixes: ['.qq.com'],
    template: builtinTemplate('exmail'),
  },
  {
    suffixes: ['.google.com', '.googlemail.com', 'smtp.google.com'],
    template: builtinTemplate('gmail', {
      labelZh: 'Google Workspace (Gmail)',
      labelEn: 'Google Workspace (Gmail)',
    }),
  },
  {
    suffixes: ['.mail.protection.outlook.com', '.eo.outlook.com', '.olc.protection.outlook.com'],
    template: builtinTemplate('outlook', {
      labelZh: 'Microsoft 365 / Exchange Online',
      labelEn: 'Microsoft 365 / Exchange Online',
    }),
  },
  {
    suffixes: ['.mail.protection.partner.outlook.cn'],
    template: {
      labelZh: 'Microsoft 365（由世纪互联运营）',
      labelEn: 'Microsoft 365 operated by 21Vianet',
      authKind: 'password',
      imap: { host: 'partner.outlook.cn', port: 993, secure: true },
      smtp: { host: 'smtp.partner.outlook.cn', port: 587, secure: false },
      hintZh: '已识别为世纪互联版 Exchange Online；请确认租户已启用 IMAP/SMTP 权限。',
      hintEn: 'Detected 21Vianet Exchange Online; confirm IMAP/SMTP access is enabled for your tenant.',
    },
  },
  {
    suffixes: ['.mxhichina.com', '.qiye.aliyun.com'],
    template: {
      labelZh: '阿里企业邮箱',
      labelEn: 'Alibaba Enterprise Mail',
      imap: { host: 'imap.qiye.aliyun.com', port: 993, secure: true },
      smtp: { host: 'smtp.qiye.aliyun.com', port: 465, secure: true },
      pop3: { host: 'pop.qiye.aliyun.com', port: 995, secure: true },
      hintZh: '请填写完整企业邮箱地址，如开启三方客户端安全密码请填专用密码。',
      hintEn: 'Use your full corporate address and a client-specific password if required.',
    },
  },
  {
    suffixes: ['.ym.163.com'],
    template: {
      labelZh: '网易免费企业邮',
      labelEn: 'NetEase Free Enterprise Mail',
      imap: { host: 'imap.ym.163.com', port: 993, secure: true },
      smtp: { host: 'smtp.ym.163.com', port: 994, secure: true },
      pop3: { host: 'pop.ym.163.com', port: 995, secure: true },
      hintZh: '网易免费企业邮默认 SSL 发信端口为 994（如不通可改试 465）；如开启授权密码请填授权码。',
      hintEn: 'NetEase Free Enterprise Mail uses SSL SMTP port 994 by default (or 465); use an authorization code if enabled.',
    },
  },
  {
    suffixes: ['.qiye.163.com', '.mxmail.netease.com'],
    template: {
      labelZh: '网易企业邮箱',
      labelEn: 'NetEase Enterprise Mail',
      imap: { host: 'imap.qiye.163.com', port: 993, secure: true },
      smtp: { host: 'smtp.qiye.163.com', port: 465, secure: true },
      pop3: { host: 'pop.qiye.163.com', port: 995, secure: true },
      hintZh: '请在网易企业邮开启客户端授权码后填写；华东/海外节点如不同可手动微调主机名。',
      hintEn: 'Use a client authorization code from NetEase Enterprise Mail; adjust the host if your tenant uses a regional endpoint.',
    },
  },
  {
    suffixes: ['.feishu.cn'],
    template: {
      labelZh: '飞书企业邮箱',
      labelEn: 'Feishu Enterprise Mail',
      imap: { host: 'imap.feishu.cn', port: 993, secure: true },
      smtp: { host: 'smtp.feishu.cn', port: 465, secure: true },
      hintZh: '请在飞书邮箱「设置 → 第三方邮箱客户端登录」生成专用密码。',
      hintEn: 'Generate a dedicated third-party client password in Feishu Mail settings.',
    },
  },
  {
    suffixes: ['.larksuite.com'],
    template: {
      labelZh: 'Lark Enterprise Mail',
      labelEn: 'Lark Enterprise Mail',
      imap: { host: 'imap.larksuite.com', port: 993, secure: true },
      smtp: { host: 'smtp.larksuite.com', port: 465, secure: true },
      hintZh: '请在 Lark Mail 第三方客户端设置中生成专用密码。',
      hintEn: 'Generate a dedicated third-party client password in Lark Mail settings.',
    },
  },
  {
    suffixes: ['.263xmail.com', '.263.net'],
    template: {
      labelZh: '263 企业邮箱',
      labelEn: '263 Enterprise Mail',
      imap: { host: 'imap.263.net', port: 993, secure: true },
      smtp: { host: 'smtp.263.net', port: 465, secure: true },
    },
  },
  {
    suffixes: ['.zoho.com.cn'],
    template: {
      labelZh: 'Zoho 企业邮箱 (中国)',
      labelEn: 'Zoho Mail (China)',
      imap: { host: 'imappro.zoho.com.cn', port: 993, secure: true },
      smtp: { host: 'smtppro.zoho.com.cn', port: 465, secure: true },
    },
  },
  {
    suffixes: ['.zoho.eu'],
    template: {
      labelZh: 'Zoho 企业邮箱 (EU)',
      labelEn: 'Zoho Mail (EU)',
      imap: { host: 'imappro.zoho.eu', port: 993, secure: true },
      smtp: { host: 'smtppro.zoho.eu', port: 465, secure: true },
    },
  },
  {
    suffixes: ['.zoho.com'],
    template: {
      labelZh: 'Zoho 企业邮箱',
      labelEn: 'Zoho Mail',
      imap: { host: 'imappro.zoho.com', port: 993, secure: true },
      smtp: { host: 'smtppro.zoho.com', port: 465, secure: true },
    },
  },
  {
    suffixes: ['.messagingengine.com'],
    template: {
      labelZh: 'Fastmail（自定义域名）',
      labelEn: 'Fastmail (Custom Domain)',
      imap: { host: 'imap.fastmail.com', port: 993, secure: true },
      smtp: { host: 'smtp.fastmail.com', port: 465, secure: true },
      hintZh: '请在 Fastmail 安全设置中生成 App Password。',
      hintEn: 'Generate an App Password in Fastmail security settings.',
    },
  },
  {
    suffixes: ['.mail.icloud.com'],
    template: builtinTemplate('icloud', {
      labelZh: 'iCloud+ 自定义域名邮箱',
      labelEn: 'iCloud+ Custom Email Domain',
    }),
  },
  {
    suffixes: ['.yandex.net', 'mx.yandex.net'],
    template: {
      labelZh: 'Yandex 360 邮箱',
      labelEn: 'Yandex 360 Mail',
      imap: { host: 'imap.yandex.com', port: 993, secure: true },
      smtp: { host: 'smtp.yandex.com', port: 465, secure: true },
    },
  },
  {
    suffixes: ['.migadu.com'],
    template: {
      labelZh: 'Migadu',
      labelEn: 'Migadu',
      imap: { host: 'imap.migadu.com', port: 993, secure: true },
      smtp: { host: 'smtp.migadu.com', port: 465, secure: true },
    },
  },
  {
    suffixes: ['.mailbox.org'],
    template: {
      labelZh: 'mailbox.org',
      labelEn: 'mailbox.org',
      imap: { host: 'imap.mailbox.org', port: 993, secure: true },
      smtp: { host: 'smtp.mailbox.org', port: 465, secure: true },
    },
  },
]

const IMAP_HOST_TO_BUILTIN = new Map<string, ProviderName>(
  Object.entries(PROVIDER_PRESETS).map(([name, preset]) => [preset.imap.host.toLowerCase(), name as ProviderName]),
)

/**
 * Extract and validate only the domain part from an email address or bare domain.
 * Everything before `@` is discarded immediately and never leaves this function.
 */
export function extractDiscoveryDomain(input: string): string {
  const trimmed = String(input ?? '').trim()
  if (trimmed === '' || trimmed.length > 320 || /[\s\u0000-\u001f\u007f]/.test(trimmed)) {
    throw new Error('请输入有效的邮箱地址或域名 / Enter a valid email address or domain')
  }
  const at = trimmed.lastIndexOf('@')
  const rawDomain = (at >= 0 ? trimmed.slice(at + 1) : trimmed).replace(/\.$/, '').trim()
  if (rawDomain === '' || rawDomain.includes('@') || rawDomain.includes('/') || rawDomain.includes(':')) {
    throw new Error('请输入有效的邮箱地址或域名 / Enter a valid email address or domain')
  }
  // Normalize internationalized domain names to ASCII punycode via URL.
  let normalized: string
  try {
    const url = new URL('https://' + rawDomain)
    if (url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('invalid')
    }
    normalized = url.hostname.toLowerCase().replace(/\.$/, '')
  } catch {
    throw new Error('请输入有效的邮箱地址或域名 / Enter a valid email address or domain')
  }
  if (!normalized || !normalized.includes('.') || isIP(normalized) || mailHostProblem(normalized) !== undefined) {
    throw new Error('请输入有效的邮箱地址或域名（如 user@example.com） / Enter a valid email address or domain (e.g. user@example.com)')
  }
  return normalized
}

function buildResult(
  domain: string,
  source: AutodiscoverSource,
  template: ProviderTemplate,
  checked: AutodiscoverSource[],
): AutodiscoverResult {
  return {
    domain,
    source,
    ...(template.provider ? { provider: template.provider } : {}),
    labelZh: template.labelZh,
    labelEn: template.labelEn,
    authKind: template.authKind ?? 'password',
    ...(template.oauthProvider ? { oauthProvider: template.oauthProvider } : {}),
    ...(template.imap ? { imap: { ...template.imap } } : {}),
    ...(template.smtp ? { smtp: { ...template.smtp } } : {}),
    ...(template.pop3 ? { pop3: { ...template.pop3 } } : {}),
    ...(template.hintZh ? { hintZh: template.hintZh } : {}),
    ...(template.hintEn ? { hintEn: template.hintEn } : {}),
    checked: [...checked],
  }
}

export function matchBuiltInDomain(domain: string): ProviderTemplate | undefined {
  return Object.prototype.hasOwnProperty.call(BUILTIN_DOMAINS, domain) ? BUILTIN_DOMAINS[domain] : undefined
}

export function matchOfflineProvider(domain: string): ProviderTemplate | undefined {
  return Object.prototype.hasOwnProperty.call(OFFLINE_PROVIDERS, domain) ? OFFLINE_PROVIDERS[domain] : undefined
}

function suffixMatches(host: string, suffix: string): boolean {
  const normalized = host.toLowerCase().replace(/\.$/, '')
  if (suffix.startsWith('.')) {
    return normalized.endsWith(suffix) || normalized === suffix.slice(1)
  }
  return normalized === suffix || normalized.endsWith('.' + suffix)
}

export function matchMxRecords(records: readonly MxRecord[]): ProviderTemplate | undefined {
  const sorted = [...records]
    .filter(row => row && typeof row.exchange === 'string' && row.exchange.trim() !== '' && row.exchange.trim() !== '.')
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
  for (const row of sorted) {
    const exchange = row.exchange.trim().toLowerCase().replace(/\.$/, '')
    for (const rule of MX_RULES) {
      if (rule.suffixes.some(suffix => suffixMatches(exchange, suffix))) {
        return rule.template
      }
    }
  }
  return undefined
}

function validDiscoveredHost(host: string, requirePublic: boolean): string | undefined {
  const cleaned = host.trim().toLowerCase().replace(/\.$/, '')
  if (!cleaned || cleaned === '.' || isIP(cleaned) || mailHostProblem(cleaned) !== undefined) return undefined
  if (requirePublic && !publicDnsName(cleaned)) return undefined
  return cleaned
}

function validPort(port: unknown): number | undefined {
  const n = typeof port === 'number' ? port : Number.parseInt(String(port ?? '').trim(), 10)
  return Number.isSafeInteger(n) && n >= 1 && n <= 65535 ? n : undefined
}

function bestSrvRecord(records: readonly SrvRecord[], requirePublic: boolean): { host: string; port: number } | undefined {
  const valid = records
    .filter(row => row && typeof row.name === 'string' && row.name.trim() !== '' && row.name.trim() !== '.')
    .sort((a, b) => (a.priority - b.priority) || (b.weight - a.weight))
  for (const row of valid) {
    const host = validDiscoveredHost(row.name, requirePublic)
    const port = validPort(row.port)
    if (host && port) return { host, port }
  }
  return undefined
}

function nodeText(node: any): string {
  if (!node) return ''
  if (node.type === 'text') return String(node.data ?? '')
  if (!Array.isArray(node.children)) return ''
  return node.children.map(nodeText).join('')
}

function childElements(node: any, tagName?: string): any[] {
  if (!node || !Array.isArray(node.children)) return []
  const want = tagName?.toLowerCase()
  return node.children.filter((child: any) => child?.type === 'tag' && (!want || String(child.name || '').toLowerCase() === want))
}

function sanitizeDisplayName(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)
}

/**
 * Parse a Thunderbird Autoconfig v1.1 XML document into safe, TLS-only mail endpoints.
 *
 * Security rules:
 * - Rejects `socketType: plain` and unknown socket types (never recommends cleartext auth).
 * - Rejects `STARTTLS` for POP3 (dsh-email POP3 treats `secure: false` as plaintext).
 * - Rejects IP literals and non-public hostnames (prevents external XML from steering
 *   credentials toward localhost or intranet services).
 * - Prefers implicit TLS (`SSL`) over `STARTTLS`.
 */
export function parseAutoconfigXml(xml: string, domain: string): ProviderTemplate | undefined {
  if (typeof xml !== 'string' || xml.trim() === '' || Buffer.byteLength(xml, 'utf8') > AUTOCONFIG_MAX_BYTES) {
    return undefined
  }
  const doc = parseDocument(xml, { xmlMode: true, decodeEntities: true })
  const clientConfig = childElements(doc, 'clientconfig')[0]
  if (!clientConfig) return undefined
  const emailProvider = childElements(clientConfig, 'emailprovider')[0]
  if (!emailProvider) return undefined

  const rawDisplay = sanitizeDisplayName(
    nodeText(childElements(emailProvider, 'displayname')[0])
    || nodeText(childElements(emailProvider, 'displayshortname')[0])
    || domain,
  )

  type ParsedServer = DiscoveredEndpoint & { oauth2: boolean; passwordAuth: boolean }
  const pickBest = (list: ParsedServer[]): ParsedServer | undefined => {
    if (!list.length) return undefined
    // Prefer implicit SSL/TLS over STARTTLS; preserve provider ordering within same TLS tier.
    return list.find(item => item.secure) ?? list[0]
  }

  const parseServer = (node: any, kind: 'imap' | 'pop3' | 'smtp'): ParsedServer | undefined => {
    const host = validDiscoveredHost(nodeText(childElements(node, 'hostname')[0]), true)
    const port = validPort(nodeText(childElements(node, 'port')[0]))
    if (!host || !port) return undefined
    const socket = nodeText(childElements(node, 'sockettype')[0]).trim().toUpperCase()
    let secure: boolean
    if (socket === 'SSL') {
      secure = true
    } else if (socket === 'STARTTLS' && kind !== 'pop3') {
      // Never accept STARTTLS for POP3: dsh-email POP3 does not implement STLS.
      secure = false
    } else {
      // Reject `plain` and any unrecognized socketType.
      return undefined
    }
    const authModes = childElements(node, 'authentication').map(el => nodeText(el).trim().toLowerCase())
    const oauth2 = authModes.includes('oauth2')
    const passwordAuth = authModes.length === 0 || authModes.some(mode => mode !== 'oauth2' && mode !== 'none')
    return { host, port, secure, oauth2, passwordAuth }
  }

  const imaps: ParsedServer[] = []
  const pop3s: ParsedServer[] = []
  const smtps: ParsedServer[] = []

  for (const node of childElements(emailProvider, 'incomingserver')) {
    const type = String(node.attribs?.type ?? '').trim().toLowerCase()
    if (type === 'imap') {
      const parsed = parseServer(node, 'imap')
      if (parsed) imaps.push(parsed)
    } else if (type === 'pop3') {
      const parsed = parseServer(node, 'pop3')
      if (parsed) pop3s.push(parsed)
    }
  }
  for (const node of childElements(emailProvider, 'outgoingserver')) {
    const type = String(node.attribs?.type ?? '').trim().toLowerCase()
    if (type === 'smtp') {
      const parsed = parseServer(node, 'smtp')
      if (parsed) smtps.push(parsed)
    }
  }

  const bestImap = pickBest(imaps)
  const bestSmtp = pickBest(smtps)
  const bestPop3 = pickBest(pop3s)

  if (!bestImap && !bestPop3) return undefined
  // An IMAP-only XML without SMTP cannot satisfy dsh-email's IMAP account contract.
  if (bestImap && !bestSmtp && !bestPop3) return undefined

  const mappedBuiltin = bestImap ? IMAP_HOST_TO_BUILTIN.get(bestImap.host) : undefined
  if (mappedBuiltin) {
    return builtinTemplate(mappedBuiltin, {
      ...(rawDisplay ? { labelZh: rawDisplay, labelEn: rawDisplay } : {}),
    })
  }

  const onlyOauth = bestImap?.oauth2 === true && bestImap.passwordAuth === false
  return {
    labelZh: rawDisplay || domain,
    labelEn: rawDisplay || domain,
    authKind: 'password',
    ...(bestImap && bestSmtp ? {
      imap: { host: bestImap.host, port: bestImap.port, secure: bestImap.secure },
      smtp: { host: bestSmtp.host, port: bestSmtp.port, secure: bestSmtp.secure },
    } : {}),
    ...(bestPop3 ? { pop3: { host: bestPop3.host, port: bestPop3.port, secure: bestPop3.secure } } : {}),
    ...(bestSmtp && !bestImap ? { smtp: { host: bestSmtp.host, port: bestSmtp.port, secure: bestSmtp.secure } } : {}),
    ...(onlyOauth ? {
      hintZh: '该服务商配置优先推荐 OAuth2；若支持应用专用密码请直接填写，否则请核对服务商认证要求。',
      hintEn: 'This provider prefers OAuth2; use an app password if supported, or check your provider authentication policy.',
    } : {}),
  }
}

const DOH_MAX_BYTES = 32 * 1024

function dohQuestionMatches(value: unknown, name: string, type: 15 | 33): boolean {
  const doc = value as any
  if (!doc || doc.Status !== 0 || doc.TC === true) return false
  if (doc.Answer !== undefined && !Array.isArray(doc.Answer)) return false
  const expected = name.toLowerCase().replace(/\.$/, '')
  // Cloudflare returns Question as an array; AliDNS returns a single object.
  const questions = Array.isArray(doc.Question) ? doc.Question : (doc.Question && typeof doc.Question === 'object' ? [doc.Question] : [])
  if (questions.length !== 1) return false
  const q = questions[0]
  return q?.type === type && String(q?.name ?? '').toLowerCase().replace(/\.$/, '') === expected
}

/** Parse bounded DoH JSON MX (type 15) answers; malformed records are ignored. */
export function parsePublicDnsMxAnswer(value: unknown, domain: string): MxRecord[] {
  if (!dohQuestionMatches(value, domain, 15)) return []
  const answers = ((value as any).Answer ?? []).slice(0, 64)
  const out: MxRecord[] = []
  for (const row of answers) {
    if (row?.type !== 15 || typeof row.data !== 'string') continue
    const match = /^(\d{1,5})\s+([^\s]+)$/.exec(row.data.trim())
    if (!match) continue
    const priority = Number.parseInt(match[1], 10)
    const exchange = match[2].replace(/\.$/, '').toLowerCase()
    if (!Number.isSafeInteger(priority) || priority < 0 || priority > 65535 || !exchange) continue
    out.push({ priority, exchange })
  }
  return out
}

/** Parse bounded DoH JSON SRV (type 33) answers; malformed records are ignored. */
export function parsePublicDnsSrvAnswer(value: unknown, name: string): SrvRecord[] {
  if (!dohQuestionMatches(value, name, 33)) return []
  const answers = ((value as any).Answer ?? []).slice(0, 64)
  const out: SrvRecord[] = []
  for (const row of answers) {
    if (row?.type !== 33 || typeof row.data !== 'string') continue
    const match = /^(\d{1,5})\s+(\d{1,5})\s+(\d{1,5})\s+([^\s]+)$/.exec(row.data.trim())
    if (!match) continue
    const priority = Number.parseInt(match[1], 10)
    const weight = Number.parseInt(match[2], 10)
    const port = Number.parseInt(match[3], 10)
    const target = match[4].replace(/\.$/, '').toLowerCase()
    if (!Number.isSafeInteger(priority) || !Number.isSafeInteger(weight) || !validPort(port) || !target) continue
    out.push({ priority, weight, port, name: target })
  }
  return out
}

const PUBLIC_DOH_ENDPOINTS: ReadonlyArray<{ url: (name: string, type: 15 | 33) => string; ip: string }> = [
  { url: (name, type) => `https://dns.alidns.com/resolve?name=${encodeURIComponent(name)}&type=${type}`, ip: '223.5.5.5' },
  { url: (name, type) => `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, ip: '1.1.1.1' },
]

/**
 * Fallback DoH lookup for public MX/SRV records when system c-ares DNS fails
 * (e.g. Fake-IP / local Windows DNS proxies that reject raw UDP MX/SRV).
 * Fixed bootstrap IPs avoid asking a Fake-IP resolver about itself.
 */
async function defaultQueryPublicDnsJson(name: string, type: 15 | 33, signal: AbortSignal): Promise<unknown> {
  for (const endpoint of PUBLIC_DOH_ENDPOINTS) {
    if (signal.aborted) return undefined
    try {
      const active = AbortSignal.any([signal, AbortSignal.timeout(3000)])
      const response = await new Promise<import('node:http').IncomingMessage>((resolve, reject) => {
        const req = httpsGet(new URL(endpoint.url(name, type)), {
          agent: false,
          signal: active,
          headers: { accept: 'application/dns-json, application/json' },
          lookup: ((_host: string, options: any, callback: any) => options.all
            ? callback(null, [{ address: endpoint.ip, family: 4 }]) : callback(null, endpoint.ip, 4)) as any,
        }, resolve)
        req.once('error', reject)
      })
      try {
        const contentType = String(response.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
        if (response.statusCode !== 200 || (contentType !== 'application/dns-json' && contentType !== 'application/json')) continue
        const chunks: Buffer[] = []
        let size = 0
        for await (const chunk of response) {
          active.throwIfAborted()
          const bytes = Buffer.from(chunk)
          size += bytes.length
          if (size > DOH_MAX_BYTES) throw new Error('response too large')
          chunks.push(bytes)
        }
        return JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } finally {
        response.destroy()
      }
    } catch {
      if (signal.aborted) return undefined
    }
  }
  return undefined
}

async function defaultFetchPublicXml(url: string, signal: AbortSignal): Promise<string | undefined> {
  try {
    const bytes = await downloadPublicBytes(url, AUTOCONFIG_MAX_BYTES, signal)
    return bytes.toString('utf8')
  } catch {
    return undefined
  }
}

async function runWithTimeout<T>(task: (signal: AbortSignal) => Promise<T>, parent: AbortSignal, ms: number): Promise<T> {
  const signal = AbortSignal.any([parent, AbortSignal.timeout(ms)])
  return withAbort(task(signal), signal)
}

/**
 * Discover mail server configuration for an email address or domain.
 * Returns `null` when no layer produces a verified, TLS-encrypted endpoint.
 */
export async function autodiscoverEmailServer(
  input: string,
  options: AutodiscoverOptions = {},
): Promise<AutodiscoverResult | null> {
  const domain = extractDiscoveryDomain(input)
  const callerSignal = options.signal
  callerSignal?.throwIfAborted()
  const deadline = AbortSignal.timeout(OVERALL_TIMEOUT_MS)
  const combined = callerSignal ? AbortSignal.any([callerSignal, deadline]) : deadline
  const stepMs = Math.min(8000, Math.max(500, Math.trunc(options.stepTimeoutMs ?? DEFAULT_STEP_TIMEOUT_MS)))
  const allowOnline = options.allowOnlineLookup !== false
  const isPublicDomain = publicDnsName(domain)
  const deps = options.dependencies ?? {}
  const checked: AutodiscoverSource[] = []

  // Layer 1: Built-in provider domain
  checked.push('builtin-domain')
  const builtin = matchBuiltInDomain(domain)
  if (builtin) return buildResult(domain, 'builtin-domain', builtin, checked)

  // Layer 2: Curated offline extended provider database
  checked.push('offline-db')
  const offline = matchOfflineProvider(domain)
  if (offline) return buildResult(domain, 'offline-db', offline, checked)

  const canUseDoh = allowOnline && isPublicDomain && (deps.queryPublicDnsJson !== undefined || (deps.resolveMx === undefined && deps.resolveSrv === undefined))
  const queryDoh = deps.queryPublicDnsJson ?? defaultQueryPublicDnsJson

  // Layer 3: DNS MX reverse-lookup (system DNS first, DoH fallback for public domains)
  callerSignal?.throwIfAborted()
  if (!deadline.aborted) {
    checked.push('mx')
    const resolveMx = deps.resolveMx ?? dnsResolveMx
    let mxRecords: MxRecord[] = []
    try {
      mxRecords = await runWithTimeout(() => resolveMx(domain), combined, stepMs)
    } catch {
      callerSignal?.throwIfAborted()
    }
    if (mxRecords.length === 0 && canUseDoh && !deadline.aborted) {
      try {
        const doc = await runWithTimeout(sig => queryDoh(domain, 15, sig), combined, stepMs)
        mxRecords = parsePublicDnsMxAnswer(doc, domain)
      } catch {
        callerSignal?.throwIfAborted()
      }
    }
    const mxMatch = matchMxRecords(mxRecords)
    if (mxMatch) return buildResult(domain, 'mx', mxMatch, checked)
  }

  // Layer 4: DNS SRV (RFC 6186 / RFC 8314)
  callerSignal?.throwIfAborted()
  let srvPop3: DiscoveredEndpoint | undefined
  let srvSmtp: DiscoveredEndpoint | undefined
  if (!deadline.aborted) {
    checked.push('srv')
    const resolveSrv = deps.resolveSrv ?? dnsResolveSrv
    const querySrv = async (name: string): Promise<{ host: string; port: number } | undefined> => {
      let records: SrvRecord[] = []
      try {
        records = await runWithTimeout(() => resolveSrv(name), combined, stepMs)
      } catch {
        callerSignal?.throwIfAborted()
      }
      if (records.length === 0 && canUseDoh && !deadline.aborted) {
        try {
          const doc = await runWithTimeout(sig => queryDoh(name, 33, sig), combined, stepMs)
          records = parsePublicDnsSrvAnswer(doc, name)
        } catch {
          callerSignal?.throwIfAborted()
        }
      }
      return bestSrvRecord(records, isPublicDomain)
    }
    const [imapsSrv, imapSrv, submissionsSrv, submissionSrv, pop3sSrv] = await Promise.all([
      querySrv('_imaps._tcp.' + domain),
      querySrv('_imap._tcp.' + domain),
      querySrv('_submissions._tcp.' + domain),
      querySrv('_submission._tcp.' + domain),
      querySrv('_pop3s._tcp.' + domain),
    ])
    callerSignal?.throwIfAborted()
    const srvImap: DiscoveredEndpoint | undefined = imapsSrv
      ? { host: imapsSrv.host, port: imapsSrv.port, secure: true }
      : imapSrv ? { host: imapSrv.host, port: imapSrv.port, secure: false } : undefined
    srvSmtp = submissionsSrv
      ? { host: submissionsSrv.host, port: submissionsSrv.port, secure: true }
      : submissionSrv ? { host: submissionSrv.host, port: submissionSrv.port, secure: false } : undefined
    srvPop3 = pop3sSrv
      ? { host: pop3sSrv.host, port: pop3sSrv.port, secure: true }
      : undefined

    if (srvImap && srvSmtp) {
      const mappedBuiltin = IMAP_HOST_TO_BUILTIN.get(srvImap.host)
      if (mappedBuiltin) {
        return buildResult(domain, 'srv', builtinTemplate(mappedBuiltin), checked)
      }
      return buildResult(domain, 'srv', {
        labelZh: domain + ' (DNS SRV)',
        labelEn: domain + ' (DNS SRV)',
        imap: srvImap,
        smtp: srvSmtp,
        ...(srvPop3 ? { pop3: srvPop3 } : {}),
      }, checked)
    }
  }

  // Layers 5 & 6: Public HTTPS Autoconfig XML & Thunderbird ISPDB.
  // Never leak private/internal/reserved domain names over public HTTPS.
  if (allowOnline && isPublicDomain && !deadline.aborted) {
    const fetchXml = deps.fetchPublicXml ?? defaultFetchPublicXml

    // Layer 5: Domain-hosted HTTPS Autoconfig XML in parallel (no ?emailaddress= query!)
    callerSignal?.throwIfAborted()
    checked.push('domain-autoconfig')
    const domainUrls = [
      `https://autoconfig.${domain}/mail/config-v1.1.xml`,
      `https://${domain}/.well-known/autoconfig/mail/config-v1.1.xml`,
    ]
    const domainXmls = await Promise.all(
      domainUrls.map(url => runWithTimeout(sig => fetchXml(url, sig), combined, stepMs).catch(() => undefined)),
    )
    callerSignal?.throwIfAborted()
    for (const xml of domainXmls) {
      if (!xml) continue
      const parsed = parseAutoconfigXml(xml, domain)
      if (parsed) return buildResult(domain, 'domain-autoconfig', parsed, checked)
    }

    // Layer 6: Mozilla Thunderbird ISPDB (free, open-source static XML)
    if (!deadline.aborted) {
      callerSignal?.throwIfAborted()
      checked.push('ispdb')
      const ispdbUrl = `https://autoconfig.thunderbird.net/v1.1/${encodeURIComponent(domain)}`
      const ispdbXml = await runWithTimeout(sig => fetchXml(ispdbUrl, sig), combined, stepMs).catch(() => undefined)
      callerSignal?.throwIfAborted()
      if (ispdbXml) {
        const parsed = parseAutoconfigXml(ispdbXml, domain)
        if (parsed) return buildResult(domain, 'ispdb', parsed, checked)
      }
    }
  }

  // Fallback to POP3-only SRV match if nothing richer was found.
  if (srvPop3) {
    return buildResult(domain, 'srv', {
      labelZh: domain + ' (DNS SRV POP3)',
      labelEn: domain + ' (DNS SRV POP3)',
      pop3: srvPop3,
      ...(srvSmtp ? { smtp: srvSmtp } : {}),
    }, checked)
  }

  return null
}
