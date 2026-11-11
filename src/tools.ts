import { resolve } from 'node:path'
import { clampInt, PROVIDER_PRESETS } from './config.js'
import { messageOf } from './mail-client.js'
import { NOT_LOGGED_IN_MESSAGE, oauth2StateOf } from './oauth2.js'
import type { EmailRuntime } from './runtime.js'
import type { EmailDraftBackend } from './draft-web.js'
import { takeReplyAuthorization, takeFolderAuthorization } from './approval.js'
import { scheduleTool } from './schedule-tool.js'
import {
  descriptions, parameters, MAX_LIMIT, MARK_ACTIONS, REPLY_MODES,
  executionSignal, normalizeAttachmentPaths, parseEmailDay,
  attachmentSchema, foldersSchema, listSchema, markSchema, readSchema, replySchema, sendSchema, watchSchema,
  renderAttachment, renderFolder, renderFolders, renderHealth, renderList, renderMark, renderRead, renderReply,
  renderSearch, renderSend, renderWatch, type TextBlock,
} from './tool-contract.js'
import type {
  EmailAttachmentArgs,
  EmailAttachmentResult,
  EmailFolderAction,
  EmailFolderArgs,
  EmailFolderResult,
  EmailFoldersArgs,
  EmailFoldersResult,
  EmailListArgs,
  EmailListResult,
  EmailMarkAction,
  EmailMarkArgs,
  EmailMarkResult,
  EmailReadArgs,
  EmailReadResult,
  EmailReplyArgs,
  EmailReplyMode,
  EmailReplyResult,
  EmailSearchArgs,
  EmailSearchResult,
  EmailSendArgs,
  EmailSendResult,
  EmailWatchArgs,
  EmailWatchResult,
} from './types.js'

/** 单次工具调用的 deadline：普通查询 60s，正文扫描/watch 这类整批操作 120s。 */
const QUERY_TIMEOUT_MS = 60000
const BATCH_TIMEOUT_MS = 120000
const DRAFT_PARAMETERS = { type: 'object', properties: {
  account: {type:'string',description:'Sending account; default when omitted'},to:{type:'string',description:'Recipients; forward destination when reply.mode is forward'},cc:{type:'string'},subject:{type:'string'},text:{type:'string',description:'Plain text; optional when html is supplied'},html:{type:'string',description:'Safe HTML body; reviewed in Drafts before sending'},locale:{type:'string',description:'Reply quote language override: zh, en or fr'},sendAt:{type:'string',description:'Optional proposed send time in ISO 8601 with timezone. Saving a draft does not schedule it; confirm in Drafts or use email_schedule.'},
  reply:{type:'object',properties:{uid:{oneOf:[{type:'integer'},{type:'string'}]},folder:{type:'string'},mode:{type:'string',enum:['reply','reply-all','forward']}},required:['uid'],additionalProperties:false},
  attachments:{type:'array',items:{type:'string'},description:'Up to ten local attachment paths, relative to this conversation workspace'}
},additionalProperties:false}
function validUid(uid: unknown): boolean { return typeof uid === 'number' ? Number.isSafeInteger(uid) && uid > 0 : typeof uid === 'string' && uid.length > 0 && uid.length <= 998 && !/[\r\n\0]/.test(uid) }

function attachmentPaths(value: unknown, exec?: unknown): string[] | undefined {
  const context = exec as { agent?: { session?: { header?: { cwd?: string } } } } | undefined
  const cwd = context?.agent?.session?.header?.cwd
  const base = typeof cwd === 'string' && cwd.trim() ? cwd : process.cwd()
  return normalizeAttachmentPaths(value)?.map(path => resolve(base, path))
}

export interface EmailToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  output: {
    schema: Record<string, unknown>
    render(args: unknown, value: unknown): TextBlock[]
  }
  execute(args: unknown, exec?: unknown): Promise<unknown>
  timeoutMs?: number
}

export function buildEmailTools(runtime: Pick<EmailRuntime, 'getPool' | 'getEffectiveSettings' | 'watch'>, drafts?: Pick<EmailDraftBackend, 'create'> & Partial<Pick<EmailDraftBackend,'action'|'store'>>): EmailToolDefinition[] {
  const { getPool, getEffectiveSettings, watch: watchCore } = runtime

  return [
    ...(drafts?.action&&drafts.store?[scheduleTool(drafts as EmailDraftBackend)]:[]),
    ...(drafts ? [{
      name: 'email_draft',
      description: 'Prepare an editable plain-text or HTML draft without delivering it. reply quotes the original message and keeps the reply/forward thread. The user reviews the body and attachments in Settings → Email → Drafts and sends only after confirming a preview.',
      parameters: DRAFT_PARAMETERS,
      output: { schema: { type: 'object', properties: { id: { type: 'string' }, state: { type: 'string' }, subject: { type: 'string' } }, required: ['id', 'state', 'subject'] }, render: (_args: unknown, value: unknown): TextBlock[] => [{ type: 'text', text: '本地草稿已保存，邮件未发送。请在设置 → 邮件 → 草稿中打开并检查。\n草稿编号：' + (value as { id: string }).id + '\n主题：' + (value as { subject: string }).subject }] },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(args: unknown, exec?: unknown) { const input = args as Record<string, unknown>; const draft = await drafts.create({ ...input, attachments: attachmentPaths(input.attachments, exec) }, executionSignal(exec)); return { id: draft.id, state: draft.state, subject: draft.subject } },
    } satisfies EmailToolDefinition] : []),
    {
      name: 'email_list',
      description: descriptions.email_list,
      parameters: parameters.email_list,
      output: {
        schema: listSchema,
        render: (_args: unknown, value: unknown) => renderList(value as EmailListResult),
      },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailListArgs
        const limit = clampInt(args.limit, 20, 1, MAX_LIMIT)
        const offset = clampInt(args.offset, 0, 0, 10000)
        const since = args.since?.trim() ? parseEmailDay(args.since, 'since') : undefined
        const until = args.until?.trim() ? parseEmailDay(args.until, 'until', true) : undefined
        return await getPool().list(args.account, args.folder?.trim() || '', limit, offset, args.unreadOnly === true, since, until, executionSignal(exec))
      }
    },
    {
      name: 'email_read',
      description: descriptions.email_read,
      parameters: parameters.email_read,
      output: {
        schema: readSchema,
        render: (_args: unknown, value: unknown) => renderRead(value as EmailReadResult),
      },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailReadArgs
        if (!validUid(args.uid)) {
          throw new Error('uid 必须是正整数（IMAP）或 email_list 返回的字符串邮件标识（AgentMail）')
        }
        return await getPool().read(args.account, args.uid, args.folder?.trim() || '', executionSignal(exec))
      }
    },
    {
      name: 'email_mark',
      description: descriptions.email_mark,
      parameters: parameters.email_mark,
      output: {
        schema: markSchema,
        render: (_args: unknown, value: unknown) => renderMark(value as EmailMarkResult),
      },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailMarkArgs
        if (!validUid(args.uid)) {
          throw new Error('uid 必须是正整数（IMAP）或 email_list 返回的字符串邮件标识（AgentMail）')
        }
        const action = (typeof args.action === 'string' ? args.action.trim().toLowerCase() : '') as EmailMarkAction
        if (!MARK_ACTIONS.includes(action)) {
          throw new Error('action 必须是 ' + MARK_ACTIONS.join('、') + ' 之一')
        }
        if (action === 'move' && (typeof args.toFolder !== 'string' || args.toFolder.trim() === '')) {
          throw new Error('action=move 时需要 toFolder 参数（用 email_folders 查看可用文件夹）')
        }
        return await getPool().mark(args.account, args.folder?.trim() || '', args.uid, action, args.toFolder, executionSignal(exec))
      }
    },
    {
      name: 'email_search',
      description: descriptions.email_search,
      parameters: parameters.email_search,
      output: {
        schema: listSchema,
        render: (_args: unknown, value: unknown) => renderSearch(value as EmailSearchResult),
      },
      timeoutMs: BATCH_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailSearchArgs
        if (typeof args.query !== 'string' || args.query.trim() === '') throw new Error('query 不能为空')
        const limit = clampInt(args.limit, 10, 1, MAX_LIMIT)
        const offset = clampInt(args.offset, 0, 0, 10000)
        const since = args.since?.trim() ? parseEmailDay(args.since, 'since') : undefined
        const until = args.until?.trim() ? parseEmailDay(args.until, 'until', true) : undefined
        return await getPool().search(args.account, args.query.trim(), args.folder?.trim() || '', limit, offset, since, until, executionSignal(exec), {
          headerScanLimit: clampInt(args.headerScanLimit, 5000, 1, 20000),
          headerScanOffset: clampInt(args.headerScanOffset, 0, 0, 1_000_000_000),
        })
      }
    },
    {
      name: 'email_send',
      description: descriptions.email_send,
      parameters: parameters.email_send,
      output: {
        schema: sendSchema,
        render: (_args: unknown, value: unknown) => renderSend(value as EmailSendResult),
      },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailSendArgs
        if (typeof args.to !== 'string' || args.to.trim() === '') throw new Error('to 不能为空')
        if (typeof args.subject !== 'string' || args.subject.trim() === '') throw new Error('subject 不能为空')
        return await getPool().send(
          args.account,
          args.to.trim(),
          args.subject.trim(),
          typeof args.text === 'string' ? args.text : undefined,
          typeof args.cc === 'string' && args.cc.trim() !== '' ? args.cc.trim() : undefined,
          attachmentPaths(args.attachments, exec),
          executionSignal(exec),
          args.html,
        )
      }
    },
    {
      name: 'email_reply',
      description: descriptions.email_reply,
      parameters: parameters.email_reply,
      output: { schema: replySchema, render: (_args: unknown, value: unknown) => renderReply(value as EmailReplyResult) },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailReplyArgs
        if (!validUid(args.uid)) {
          throw new Error('uid 必须是正整数（IMAP）或 email_list 返回的字符串邮件标识（AgentMail）')
        }
        if (!(typeof args.text === 'string' && args.text.trim()) && !(typeof args.html === 'string' && args.html.trim())) throw new Error('请填写 text 或 html 正文')
        const mode = ((typeof args.mode === 'string' && args.mode.trim() !== '' ? args.mode.trim().toLowerCase() : 'reply')) as EmailReplyMode
        if (!REPLY_MODES.includes(mode)) {
          throw new Error('mode 必须是 ' + REPLY_MODES.join('、') + ' 之一')
        }
        if (mode === 'forward' && (typeof args.to !== 'string' || args.to.trim() === '')) {
          throw new Error('mode=forward 时需要 to 参数指定转发收件人')
        }
        const cc = typeof args.cc === 'string' && args.cc.trim() !== '' ? args.cc.trim() : undefined
        const prepared=takeReplyAuthorization(rawArgs,runtime as any)
        if(prepared){
          const sent=await getPool().sendPrepared(prepared.account,prepared.to,prepared.subject,prepared.text,prepared.cc,[],executionSignal(exec),prepared.reply,prepared.html)
          return {...sent,mode,originalUid:args.uid,to:prepared.to.split(','),subject:prepared.subject}
        }
        return await getPool().reply(args.account, args.folder?.trim() || '', args.uid, mode, args.text || '', args.to?.trim() ?? '', cc, executionSignal(exec), { html: args.html, locale: args.locale, timeZone: args.timeZone })
      }
    },
    {
      name: 'email_folders',
      description: descriptions.email_folders,
      parameters: parameters.email_folders,
      output: {
        schema: foldersSchema,
        render: (_args: unknown, value: unknown) => renderFolders(value as EmailFoldersResult),
      },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailFoldersArgs
        return await getPool().folders(args.account, args.subscribedOnly === true, executionSignal(exec))
      }
    },
    {
      name: 'email_health',
      description: descriptions.email_health,
      parameters: parameters.email_health,
      output: { schema: { type: 'object', additionalProperties: true }, render: renderHealth },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(_rawArgs: unknown, exec: unknown) {
        executionSignal(exec)?.throwIfAborted()
        const checks: Array<Record<string, unknown>> = []
        try {
          const effective = getEffectiveSettings()
          const entries = [...effective.accounts.entries()]
          for (const [accountName, account] of entries.slice(0, 8)) {
            const provider = Object.entries(PROVIDER_PRESETS).find(([, preset]) => (
              preset.imap.host === account.imap.host && preset.smtp.host === account.smtp.host
            ))?.[0] ?? 'custom'
            const base = account.transport === 'agentmail' ? 'AgentMail / ' + account.user + ' / ' + account.apiBase : account.transport === 'pop3' ? account.user + ' / POP3 ' + account.pop3?.host + ':' + account.pop3?.port + ' / SMTP ' + (account.smtp.host || '尚未配置（只收信）') : provider + ' / ' + account.user + ' / IMAP ' + account.imap.host + ' / SMTP ' + account.smtp.host
            // An OAuth2 account with no token is configured, not broken: the
            // missing piece is a browser login, and saying so is the whole
            // point of this check.
            if (account.authKind === 'oauth2') {
              // The address is passed along so a token belonging to a different
              // mailbox is not reported as a working login.
              const state = oauth2StateOf(accountName, account.user)
              const loggedIn = state.state === 'logged-in'
              checks.push({
                name: '账号 ' + accountName,
                ok: true,
                detail: loggedIn
                  ? base + ' / OAuth2 已登录' + (state.user !== undefined ? '（' + state.user + '）' : '')
                  : base + ' / OAuth2 ' + NOT_LOGGED_IN_MESSAGE,
              })
              continue
            }
            checks.push({ name: '账号 ' + accountName, ok: true, detail: base })
          }
          return { ok: true, plugin: 'dsh-email', accountCount: entries.length, checks }
        } catch (error) {
          checks.push({ name: '邮箱配置', ok: false, detail: messageOf(error, '未配置邮箱账号') })
          return { ok: false, plugin: 'dsh-email', accountCount: 0, checks }
        }
      }
    },
    {
      name: 'email_attachment',
      description: descriptions.email_attachment,
      parameters: parameters.email_attachment,
      output: {
        schema: attachmentSchema,
        render: (_args: unknown, value: unknown) => renderAttachment(value as EmailAttachmentResult),
      },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: any) {
        const args = rawArgs as EmailAttachmentArgs
        if (!validUid(args.uid)) {
          throw new Error('uid 必须是正整数（IMAP）或 email_list 返回的字符串邮件标识（AgentMail）')
        }
        const index = clampInt(args.index, 0, 0, 999)
        const workspaceHint = typeof exec?.agent?.session?.header?.cwd === 'string' ? exec.agent.session.header.cwd : undefined
        return await getPool().downloadAttachment(args.account, args.folder?.trim() || '', args.uid, index, workspaceHint, executionSignal(exec))
      }
    },
    {
      name: 'email_watch',
      description: descriptions.email_watch,
      parameters: parameters.email_watch,
      output: { schema: watchSchema, render: (_args: unknown, value: unknown) => renderWatch(value as EmailWatchResult) },
      timeoutMs: BATCH_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailWatchArgs
        const limit = clampInt(args.limit, 20, 1, MAX_LIMIT)
        return await watchCore(args.account?.trim() || '', args.folder?.trim() || '', limit, 'tool', executionSignal(exec))
      }
    },
    {
      name: 'email_folder_create',
      description: descriptions.email_folder_create,
      parameters: parameters.email_folder_create,
      output: { schema: { type: 'object', properties: { account: { type: 'string' }, action: { type: 'string' }, path: { type: 'string' } }, required: ['account', 'action', 'path'] }, render: (_a: unknown, v: unknown) => renderFolder(v as EmailFolderResult) },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailFolderArgs
        if (!args.path?.trim()) throw new Error('path 参数不能为空')
        const permit = takeFolderAuthorization(rawArgs, runtime)
        await getPool().createFolder(permit.account, permit.path, executionSignal(exec))
        return { account: permit.account, action: 'create' as EmailFolderAction, path: permit.path }
      }
    },
    {
      name: 'email_folder_rename',
      description: descriptions.email_folder_rename,
      parameters: parameters.email_folder_rename,
      output: { schema: { type: 'object', properties: { account: { type: 'string' }, action: { type: 'string' }, path: { type: 'string' }, newName: { type: 'string' } }, required: ['account', 'action', 'path'] }, render: (_a: unknown, v: unknown) => renderFolder(v as EmailFolderResult) },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailFolderArgs
        if (!args.path?.trim()) throw new Error('path 参数不能为空')
        if (!args.newName?.trim()) throw new Error('newName 参数不能为空')
        const permit = takeFolderAuthorization(rawArgs, runtime)
        await getPool().renameFolder(permit.account, permit.path, permit.newName!, executionSignal(exec))
        return { account: permit.account, action: 'rename' as EmailFolderAction, path: permit.path, newName: permit.newName }
      }
    },
    {
      name: 'email_folder_delete',
      description: descriptions.email_folder_delete,
      parameters: parameters.email_folder_delete,
      output: { schema: { type: 'object', properties: { account: { type: 'string' }, action: { type: 'string' }, path: { type: 'string' } }, required: ['account', 'action', 'path'] }, render: (_a: unknown, v: unknown) => renderFolder(v as EmailFolderResult) },
      timeoutMs: QUERY_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailFolderArgs
        if (!args.path?.trim()) throw new Error('path 参数不能为空')
        const permit = takeFolderAuthorization(rawArgs, runtime)
        await getPool().deleteFolder(permit.account, permit.path, permit.snapshot!, executionSignal(exec))
        return { account: permit.account, action: 'delete' as EmailFolderAction, path: permit.path }
      }
    },
    {
      name: 'email_folder_purge',
      description: descriptions.email_folder_purge,
      parameters: parameters.email_folder_purge,
      output: { schema: { type: 'object', properties: { account: { type: 'string' }, action: { type: 'string' }, path: { type: 'string' }, count: { type: 'number' } }, required: ['account', 'action', 'path'] }, render: (_a: unknown, v: unknown) => renderFolder(v as EmailFolderResult) },
      timeoutMs: BATCH_TIMEOUT_MS,
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailFolderArgs
        if (!args.path?.trim()) throw new Error('path 参数不能为空')
        const permit = takeFolderAuthorization(rawArgs, runtime)
        const result = await getPool().purgeFolder(permit.account, permit.path, permit.snapshot!, executionSignal(exec))
        return { account: permit.account, action: 'purge' as EmailFolderAction, path: permit.path, count: result.count }
      }
    }
  ]

}
