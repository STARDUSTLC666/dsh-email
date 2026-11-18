import {
  EmailPool,
  buildReplyMessage,
  replyCc,
  validateAttachmentPaths,
} from './mail-client.js'
import { AgentMailClient, type MessageRef } from './agentmail.js'
import { Pop3Client } from './pop3.js'
import type { Pop3WireOptions } from './pop3-wire.js'
import type { ResolvedEmailSettings } from './config.js'
import type {
  EmailFoldersResult,
  EmailReplyMode,
  EmailReplyResult,
  EmailMarkAction,
  EmailSearchOptions,
  InlineAttachmentRef,
} from './types.js'
import type { downloadPublicBytes } from './public-download.js'
import type { ReplyOptions } from './reply-locale.js'
import { prepareMailBody } from './outgoing-body.js'
import type { FolderMutationSnapshot } from './imap-folders.js'

export interface ReplyReference {
  uid: MessageRef
  folder: string
  uidValidity?: number
  mode?: EmailReplyMode
}
export interface MailDependencies {
  replyLocale?: () => string | undefined
  pop3?: Pop3WireOptions
  fetch?: typeof fetch
  download?: typeof downloadPublicBytes
}
/** Route accounts independently. IMAP's numeric UIDs retain their original meaning. */
export class EmailService {
  private readonly locale: () => string | undefined
  private imap: EmailPool
  private api: AgentMailClient
  private pop3: Pop3Client
  constructor(
    private settings: ResolvedEmailSettings,
    dependencies: MailDependencies = {},
  ) {
    this.locale = dependencies.replyLocale ?? (() => undefined)
    this.imap = new EmailPool(settings)
    this.pop3 = new Pop3Client(settings, dependencies.pop3)
    this.api = new AgentMailClient(
      settings,
      dependencies.fetch,
      dependencies.download,
    )
  }
  get withImap(): EmailPool['withImap'] {
    return this.imap.withImap.bind(this.imap)
  }
  previewTrash(account: string, folder: string, uids: number[], target?: string, signal?: AbortSignal) {
    if (this.settings.accounts.get(account)?.transport) throw new Error('Trash is available for IMAP accounts only')
    return this.imap.previewTrash(account, folder, uids, target, signal)
  }
  moveMessages(account: string, folder: string, uids: number[], target: string, uidValidity: number, signal?: AbortSignal) {
    if (this.settings.accounts.get(account)?.transport) throw new Error('Trash is available for IMAP accounts only')
    return this.imap.moveMessages(account, folder, uids, target, uidValidity, signal)
  }
  createFolder(account: string, path: string, signal?: AbortSignal) {
    account = this.name(account)
    if (this.settings.accounts.get(account)?.transport) throw new Error('Folders are available for IMAP accounts only')
    return this.imap.createFolder(account, path, signal)
  }
  previewFolderMutation(account: string, path: string, action: 'delete' | 'purge', signal?: AbortSignal) {
    account = this.name(account)
    if (this.settings.accounts.get(account)?.transport) throw new Error('Folder management is available for IMAP accounts only')
    return this.imap.previewFolderMutation(account, path, action, signal)
  }
  deleteFolder(account: string, path: string, expected: FolderMutationSnapshot, signal?: AbortSignal) {
    account = this.name(account)
    if (this.settings.accounts.get(account)?.transport) throw new Error('Deleting folders is available for IMAP accounts only')
    return this.imap.deleteFolder(account, path, expected, signal)
  }
  renameFolder(account: string, path: string, newPath: string, signal?: AbortSignal) {
    account = this.name(account)
    if (this.settings.accounts.get(account)?.transport) throw new Error('Renaming folders is available for IMAP accounts only')
    return this.imap.renameFolder(account, path, newPath, signal)
  }
  purgeFolder(account: string, path: string, expected: FolderMutationSnapshot, signal?: AbortSignal) {
    account = this.name(account)
    if (this.settings.accounts.get(account)?.transport) throw new Error('Purging folders is available for IMAP accounts only')
    return this.imap.purgeFolder(account, path, expected, signal)
  }
  set withImap(run: EmailPool['withImap']) {
    this.imap.withImap = run
  }
  private name(account?: string) {
    const name = account || this.settings.defaultAccount
    if (!this.settings.accounts.has(name)) throw new Error('Unknown mail account')
    return name
  }
  private usesApi(account?: string) {
    return (
      this.settings.accounts.get(this.name(account))?.transport === 'agentmail'
    )
  }
  private usesPop3(account?: string) { return this.settings.accounts.get(this.name(account))?.transport === 'pop3' }
  private number(uid: MessageRef) {
    // Tool/JSON callers can preserve an IMAP UID as a decimal string. Normalize
    // only after selecting IMAP, so AgentMail IDs remain opaque (including 001).
    const value = typeof uid === 'string' && /^[0-9]+$/.test(uid) ? Number(uid) : uid
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0)
      throw new Error('IMAP uid must be a positive integer or a digits-only string; AgentMail string message ids only work for AgentMail accounts')
    return value
  }
  private folder(account: string | undefined, folder: string) {
    return folder || this.settings.accounts.get(this.name(account))!.inboxFolder
  }
  replyOptions(account?: string, options: ReplyOptions = {}): ReplyOptions {
    const cfg = this.settings.accounts.get(this.name(account))!
    const configured = cfg.replyLocale && cfg.replyLocale !== 'auto' ? cfg.replyLocale : undefined
    return { ...options, locale: options.locale || configured || options.uiLocale || this.locale() || 'en', timeZone: options.timeZone || cfg.replyTimeZone || undefined }
  }
  async prepareReply(account: string | undefined, folder: string, uid: MessageRef, mode: EmailReplyMode, text: string, to: string, cc?: string, signal?: AbortSignal, options: ReplyOptions = {}) {
    const name = this.name(account), cfg = this.settings.accounts.get(name)!, original = await this.read(name, uid, folder, signal)
    const built = buildReplyMessage({ ...original, messageId: '', references: '' }, mode, [cfg.user, cfg.authUser], text, to, this.replyOptions(name, options))
    return { ...built, account: name, cc: replyCc(built, cc), reply: { uid, folder: original.folder, ...(original.uidValidity ? { uidValidity: original.uidValidity } : {}), mode } }
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
    if (this.usesPop3(account)) return this.pop3.list(this.name(account), this.folder(account, folder), limit, offset, unread, since, until, signal)
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
    if (this.usesPop3(account)) return this.pop3.read(this.name(account), uid, this.folder(account, folder), signal)
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
    if (this.usesPop3(account)) return this.pop3.search(this.name(account), query, this.folder(account, folder), limit, offset, since, until, signal, options)
    if (this.usesApi(account) && options.headerScanOffset)
      throw new Error(
        'AgentMail search pages with offset; IMAP headerScanOffset does not apply',
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
    if (this.usesPop3(account)) throw new Error('POP3 provides no server-side read, star or move state; use an IMAP account for these actions')
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
    if (this.usesPop3(account)) { signal?.throwIfAborted(); return { account: this.name(account), folders: [{ name: 'INBOX', path: 'INBOX', specialUse: '\\Inbox', subscribed: true }] } }
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
  readInlineAttachment(ref: InlineAttachmentRef, byteLimit: number, signal?: AbortSignal): Promise<Buffer> {
    const { account, folder, uid, uidValidity, index, attachment } = ref
    if (this.usesPop3(account)) return this.pop3.readInlineAttachment(account, folder, uid, index, attachment.contentId, byteLimit, signal)
    if (this.usesApi(account)) throw new Error('This mail service does not provide Content-ID for inline attachments')
    return this.imap.readInlineAttachment(account, folder, this.number(uid), attachment, uidValidity, byteLimit, signal)
  }
  downloadAttachment(
    account: string | undefined,
    folder: string,
    uid: MessageRef,
    index: number,
    workspace?: string,
    signal?: AbortSignal,
    byteLimit?: number,
    expectedValidity?: number,
  ) {
    if (this.usesPop3(account)) return this.pop3.downloadAttachment(this.name(account), this.folder(account, folder), uid, index, workspace, signal, byteLimit)
    return this.usesApi(account)
      ? this.api.downloadAttachment(
          this.name(account),
          folder,
          uid,
          index,
          workspace,
          signal,
          byteLimit,
        )
      : this.imap.downloadAttachment(
          account,
          folder,
          this.number(uid),
          index,
          workspace,
          signal,
          byteLimit,
          expectedValidity,
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
    html?: string,
  ) {
    if (!this.usesApi(account))
      return this.imap.send(account, to, subject, text, cc, paths, signal, html)
    const body = prepareMailBody(text, html)
    await validateAttachmentPaths(
      paths ?? [],
      Math.min(this.settings.maxAttachmentBytes, 4 * 1024 * 1024),
      signal,
    )
    return this.api.sendPaths(
      this.name(account),
      to,
      subject,
      body.text,
      cc ?? '',
      paths ?? [],
      signal,
      body.html,
    )
  }
  async sendPrepared(
    account: string,
    to: string,
    subject: string,
    text: string,
    cc: string,
    attachments: Array<{ filename: string; content: Buffer }>,
    signal?: AbortSignal,
    reply?: ReplyReference,
    html?: string,
  ) {
    const body = prepareMailBody(text, html)
    if (this.usesPop3(account) && reply) {
      const original = await this.pop3.original(this.name(account), reply.uid, this.folder(account, reply.folder), signal)
      if (!original.messageId) throw new Error('The original message has no Message-ID, so the reply draft cannot be linked; create a new draft instead')
      return this.imap.sendPrepared(account, to, subject, text, cc, attachments, signal, undefined, {
        ...(reply.mode === 'forward' ? {} : { inReplyTo: original.messageId }), references: [original.references, original.messageId].filter(Boolean).join(' '),
      }, html)
    }
    return this.usesApi(account)
      ? this.api.send(
          this.name(account),
          to,
          subject,
          body.text,
          cc,
          attachments,
          signal,
          reply?.mode === 'forward' ? undefined : reply,
          body.html,
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
          undefined,
          html,
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
    options: ReplyOptions = {},
  ): Promise<EmailReplyResult> {
    if (this.usesPop3(account)) {
      const name = this.name(account), cfg = this.settings.accounts.get(name)!
      const original = await this.pop3.original(name, uid, this.folder(account, folder), signal)
      const built = buildReplyMessage(original, mode, [cfg.user, cfg.authUser], text, to, this.replyOptions(account, options))
      const copy = replyCc(built, cc)
      const sent = await this.imap.sendPrepared(name, built.to, built.subject, built.text, copy, [], signal, undefined, built, built.html)
      return { ...sent, mode, originalUid: uid, to: built.to.split(','), ...(copy ? { cc: copy } : {}), subject: built.subject }
    }
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
        this.replyOptions(account, options),
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
        [cfg.user, cfg.authUser],
        text,
        to,
        this.replyOptions(account, options),
      ),
      copy = replyCc(built, cc),
      sent = await this.api.send(
        name,
        built.to,
        built.subject,
        built.text,
        copy,
        [],
        signal,
        mode === 'forward' ? undefined : { uid, folder },
        built.html,
      )
    return {
      ...sent,
      mode,
      originalUid: uid,
      to: built.to.split(','),
      ...(copy ? { cc: copy } : {}),
      subject: built.subject,
    }
  }
  unseenUids(...args: Parameters<EmailPool['unseenUids']>) {
    if (this.usesPop3(args[0])) throw new Error('POP3 uses its own UIDL new-mail cursor and provides no server unread state')
    if (this.usesApi(args[0])) throw new Error('AgentMail uses its own new-mail cursor')
    return this.imap.unseenUids(...args)
  }
  fetchByUids(...args: Parameters<EmailPool['fetchByUids']>) {
    if (this.usesPop3(args[0])) throw new Error('For POP3 use the full uid from the list, not an IMAP numeric UID')
    if (this.usesApi(args[0]))
      throw new Error(
        'AgentMail does not support IMAP numeric UID batch reads; use the message_id from the list',
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
    if (this.usesPop3(account)) return this.pop3.watch(this.name(account), this.folder(account, folder), limit, scope, signal)
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
    this.pop3.clear()
  }
}
