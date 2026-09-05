import { clampInt, PROVIDER_PRESETS } from './config.js'
import { messageOf } from './mail-client.js'
import type { EmailRuntime } from './runtime.js'
import {
  descriptions, parameters, MAX_LIMIT, MARK_ACTIONS, REPLY_MODES,
  executionSignal, normalizeAttachmentPaths, parseEmailDay,
  attachmentSchema, foldersSchema, listSchema, markSchema, readSchema, replySchema, sendSchema, watchSchema,
  renderAttachment, renderFolders, renderHealth, renderList, renderMark, renderRead, renderReply,
  renderSearch, renderSend, renderWatch, type TextBlock,
} from './tool-contract.js'
import type {
  EmailAttachmentArgs,
  EmailAttachmentResult,
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

export interface EmailToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  output: {
    schema: Record<string, unknown>
    render(args: unknown, value: unknown): TextBlock[]
  }
  execute(args: unknown, exec?: unknown): Promise<unknown>
}

export function buildEmailTools(runtime: Pick<EmailRuntime, 'getPool' | 'getEffectiveSettings' | 'watch'>): EmailToolDefinition[] {
  const { getPool, getEffectiveSettings, watch: watchCore } = runtime

  return [
    {
      name: 'email_list',
      description: descriptions.email_list,
      parameters: parameters.email_list,
      output: {
        schema: listSchema,
        render: (_args: unknown, value: unknown) => renderList(value as EmailListResult),
      },
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
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailReadArgs
        if (typeof args.uid !== 'number' || !Number.isInteger(args.uid) || args.uid <= 0) {
          throw new Error('uid 必须是正整数（用 email_list 获取）')
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
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailMarkArgs
        if (typeof args.uid !== 'number' || !Number.isInteger(args.uid) || args.uid <= 0) {
          throw new Error('uid 必须是正整数（用 email_list 获取）')
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
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailSearchArgs
        if (typeof args.query !== 'string' || args.query.trim() === '') throw new Error('query 不能为空')
        const limit = clampInt(args.limit, 10, 1, MAX_LIMIT)
        const since = args.since?.trim() ? parseEmailDay(args.since, 'since') : undefined
        const until = args.until?.trim() ? parseEmailDay(args.until, 'until', true) : undefined
        return await getPool().search(args.account, args.query.trim(), args.folder?.trim() || '', limit, since, until, executionSignal(exec))
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
          normalizeAttachmentPaths(args.attachments),
          executionSignal(exec),
        )
      }
    },
    {
      name: 'email_reply',
      description: descriptions.email_reply,
      parameters: parameters.email_reply,
      output: { schema: replySchema, render: (_args: unknown, value: unknown) => renderReply(value as EmailReplyResult) },
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailReplyArgs
        if (typeof args.uid !== 'number' || !Number.isInteger(args.uid) || args.uid <= 0) {
          throw new Error('uid 必须是正整数（用 email_list 获取）')
        }
        if (typeof args.text !== 'string' || args.text.trim() === '') throw new Error('text 不能为空')
        const mode = ((typeof args.mode === 'string' && args.mode.trim() !== '' ? args.mode.trim().toLowerCase() : 'reply')) as EmailReplyMode
        if (!REPLY_MODES.includes(mode)) {
          throw new Error('mode 必须是 ' + REPLY_MODES.join('、') + ' 之一')
        }
        if (mode === 'forward' && (typeof args.to !== 'string' || args.to.trim() === '')) {
          throw new Error('mode=forward 时需要 to 参数指定转发收件人')
        }
        const cc = typeof args.cc === 'string' && args.cc.trim() !== '' ? args.cc.trim() : undefined
        return await getPool().reply(args.account, args.folder?.trim() || '', args.uid, mode, args.text, args.to?.trim() ?? '', cc, executionSignal(exec))
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
            checks.push({
              name: '账号 ' + accountName,
              ok: true,
              detail: provider + ' / ' + account.user + ' / IMAP ' + account.imap.host + ' / SMTP ' + account.smtp.host,
            })
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
      async execute(rawArgs: unknown, exec: any) {
        const args = rawArgs as EmailAttachmentArgs
        if (typeof args.uid !== 'number' || !Number.isInteger(args.uid) || args.uid <= 0) {
          throw new Error('uid 必须是正整数（用 email_list 获取）')
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
      async execute(rawArgs: unknown, exec: unknown) {
        const args = rawArgs as EmailWatchArgs
        const limit = clampInt(args.limit, 20, 1, MAX_LIMIT)
        return await watchCore(args.account?.trim() || '', args.folder?.trim() || '', limit, 'tool', executionSignal(exec))
      }
    }
  ]

}
