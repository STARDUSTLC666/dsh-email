import {
  EmailPool,
  buildReplyMessage,
  validateAttachmentPaths,
} from './mail-client.js'
import { AgentMailClient, type MessageRef } from './agentmail.js'
import type { ResolvedEmailSettings } from './config.js'
import type {
  EmailFoldersResult,
  EmailReplyMode,
  EmailReplyResult,
  EmailMarkAction,
  EmailSearchOptions,
} from './types.js'
import type { downloadPublicBytes } from './public-download.js'

export interface ReplyReference {
  uid: MessageRef
  folder: string
  uidValidity?: number
}
export interface MailDependencies {
  fetch?: typeof fetch
  download?: typeof downloadPublicBytes
}
/** Route accounts independently. IMAP's numeric UIDs retain their original meaning. */
export class EmailService {
  private imap: EmailPool
  private api: AgentMailClient
  constructor(
    private settings: ResolvedEmailSettings,
    dependencies: MailDependencies = {},
  ) {
    this.imap = new EmailPool(settings)
    this.api = new AgentMailClient(
      settings,
      dependencies.fetch,
      dependencies.download,
    )
  }
  get withImap(): EmailPool['withImap'] {
    return this.imap.withImap.bind(this.imap)
  }
  set withImap(run: EmailPool['withImap']) {
    this.imap.withImap = run
  }
  private name(account?: string) {
    const name = account || this.settings.defaultAccount
    if (!this.settings.accounts.has(name)) throw new Error('未知邮件账号')
    return name
  }
  private usesApi(account?: string) {
    return (
      this.settings.accounts.get(this.name(account))?.transport === 'agentmail'
    )
  }
  private number(uid: MessageRef) {
    if (typeof uid !== 'number' || !Number.isSafeInteger(uid) || uid <= 0)
      throw new Error('IMAP uid 必须是正整数')
    return uid
  }
  private folder(account: string | undefined, folder: string) {
    return folder || this.settings.accounts.get(this.name(account))!.inboxFolder
  }
  list(
    account: string | undefined,
    folder: string,
    limit: number,
    offset: number,
    unread: boolean,
    since?: Date,
    until?: Date,
    signal?: AbortSignal,
  ) {
    return this.usesApi(account)
      ? this.api.list(
          this.name(account),
          this.folder(account, folder),
          limit,
          offset,
          unread,
          since,
          until,
          signal,
        )
      : this.imap.list(
          account,
          folder,
          limit,
          offset,
          unread,
          since,
          until,
          signal,
        )
  }
  read(
    account: string | undefined,
    uid: MessageRef,
    folder: string,
    signal?: AbortSignal,
  ) {
    return this.usesApi(account)
      ? this.api.read(
          this.name(account),
          uid,
          this.folder(account, folder),
          signal,
        )
      : this.imap.read(account, this.number(uid), folder, signal)
  }
  search(
    account: string | undefined,
    query: string,
    folder: string,
    limit: number,
    offset: number,
    since?: Date,
    until?: Date,
    signal?: AbortSignal,
    options: EmailSearchOptions = {},
  ) {
    if (this.usesApi(account) && options.headerScanOffset)
      throw new Error(
        'AgentMail 搜索使用 offset 分页，不使用 IMAP headerScanOffset',
      )
    return this.usesApi(account)
      ? this.api.search(
          this.name(account),
          query,
          this.folder(account, folder),
          limit,
          offset,
          since,
          until,
          signal,
        )
      : this.imap.search(
          account,
          query,
          folder,
          limit,
          offset,
          since,
          until,
          signal,
          options,
        )
  }
  mark(
    account: string | undefined,
    folder: string,
    uid: MessageRef,
    action: EmailMarkAction,
    target?: string,
    signal?: AbortSignal,
  ) {
    return this.usesApi(account)
      ? this.api.mark(
          this.name(account),
          this.folder(account, folder),
          uid,
          action,
          target,
          signal,
        )
      : this.imap.mark(
          account,
          folder,
          this.number(uid),
          action,
          target,
          signal,
        )
  }
  async folders(
    account: string | undefined,
    subscribed: boolean,
    signal?: AbortSignal,
  ): Promise<EmailFoldersResult> {
    if (!this.usesApi(account))
      return this.imap.folders(account, subscribed, signal)
    signal?.throwIfAborted()
    return {
      account: this.name(account),
      folders: [
        ['INBOX', '\\Inbox'],
        ['Sent', '\\Sent'],
        ['Starred', '\\Flagged'],
        ['Archive', '\\Archive'],
        ['All', '\\All'],
      ].map(([path, specialUse]) => ({
        name: path,
        path,
        specialUse,
        subscribed: true,
      })),
    }
  }
  downloadAttachment(
    account: string | undefined,
    folder: string,
    uid: MessageRef,
    index: number,
    workspace?: string,
    signal?: AbortSignal,
  ) {
    return this.usesApi(account)
      ? this.api.downloadAttachment(
          this.name(account),
          folder,
          uid,
          index,
          workspace,
          signal,
        )
      : this.imap.downloadAttachment(
          account,
          folder,
          this.number(uid),
          index,
          workspace,
          signal,
        )
  }
  async send(
    account: string | undefined,
    to: string,
    subject: string,
    text: string | undefined,
    cc: string | undefined,
    paths: string[] | undefined,
    signal?: AbortSignal,
  ) {
    if (!this.usesApi(account))
      return this.imap.send(account, to, subject, text, cc, paths, signal)
    await validateAttachmentPaths(
      paths ?? [],
      Math.min(this.settings.maxAttachmentBytes, 4 * 1024 * 1024),
      signal,
    )
    return this.api.sendPaths(
      this.name(account),
      to,
      subject,
      text ?? '',
      cc ?? '',
      paths ?? [],
      signal,
    )
  }
  sendPrepared(
    account: string,
    to: string,
    subject: string,
    text: string,
    cc: string,
    attachments: Array<{ filename: string; content: Buffer }>,
    signal?: AbortSignal,
    reply?: ReplyReference,
  ) {
    return this.usesApi(account)
      ? this.api.send(
          this.name(account),
          to,
          subject,
          text,
          cc,
          attachments,
          signal,
          reply,
        )
      : this.imap.sendPrepared(
          account,
          to,
          subject,
          text,
          cc,
          attachments,
          signal,
          reply ? { ...reply, uid: this.number(reply.uid) } : undefined,
        )
  }
  async reply(
    account: string | undefined,
    folder: string,
    uid: MessageRef,
    mode: EmailReplyMode,
    text: string,
    to: string,
    cc: string | undefined,
    signal?: AbortSignal,
  ): Promise<EmailReplyResult> {
    if (!this.usesApi(account))
      return this.imap.reply(
        account,
        folder,
        this.number(uid),
        mode,
        text,
        to,
        cc,
        signal,
      )
    const name = this.name(account),
      cfg = this.settings.accounts.get(name)!,
      original = await this.api.read(
        name,
        uid,
        this.folder(account, folder),
        signal,
      ),
      built = buildReplyMessage(
        { ...original, messageId: String(uid), references: '' },
        mode,
        cfg.user,
        text,
        to,
      ),
      sent = await this.api.send(
        name,
        built.to,
        built.subject,
        built.text,
        cc ?? '',
        [],
        signal,
        mode === 'forward' ? undefined : { uid, folder },
      )
    return {
      ...sent,
      mode,
      originalUid: uid,
      to: built.to.split(','),
      subject: built.subject,
    }
  }
  unseenUids(...args: Parameters<EmailPool['unseenUids']>) {
    if (this.usesApi(args[0])) throw new Error('AgentMail 使用独立的新邮件游标')
    return this.imap.unseenUids(...args)
  }
  fetchByUids(...args: Parameters<EmailPool['fetchByUids']>) {
    if (this.usesApi(args[0]))
      throw new Error(
        'AgentMail 不支持 IMAP 数字 UID 批量读取，请使用列表中的 message_id',
      )
    return this.imap.fetchByUids(...args)
  }
  async watchApi(
    account: string,
    folder: string,
    limit: number,
    scope: string,
    signal?: AbortSignal,
  ) {
    return this.usesApi(account)
      ? this.api.watch(
          this.name(account),
          this.folder(account, folder),
          limit,
          scope,
          signal,
        )
      : undefined
  }
  startIdleSweep() {
    this.imap.startIdleSweep()
  }
  dispose() {
    this.imap.dispose()
    this.api.clear()
  }
}
