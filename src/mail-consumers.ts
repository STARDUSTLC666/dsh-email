import { createHash } from 'node:crypto'
import type { EmailRuntime } from './runtime.js'
import type { AddressEntry, ListedMessage } from './types.js'

export interface MailConsumerConfig {
  id: string
  account: string
  folder: string
  senders: string[]
  subject?: string
  enabled?: boolean
}

export interface EmailArrivalEvent {
  eventId: string
  consumerId: string
  account: string
  folder: string
  uid: number | string
  uidValidity: number
  sender: string
  subject?: string
  date?: string
  /** Consumers should stop work when this signal is aborted. */
  signal?: AbortSignal
}

export type EmailArrivalHandler = (event: EmailArrivalEvent) => unknown | Promise<unknown>
export interface EmailTasksStatus {
  enabled: boolean
  configured: number
  registered: string[]
  running: boolean
  inFlight: number
  lastScanAt?: string
  lastError?: string
  droppedEvents: number
  handlerFailures: number
  handlerTimeouts: number
}

interface Subscription {
  handler: EmailArrivalHandler
  active: boolean
  inFlight: number
  pending: number
  controllers: Set<AbortController>
}
interface Cursor {
  binding: string
  uidValidity: number
  ids: Set<string>
  maxNumericUid: number
  /** Opaque transports have no ordered cursor; use a strict date watermark. */
  maxDateMs: number
  dateReliable: boolean
}

const MAX_CONSUMERS = 20
const MAX_SENDERS = 50
const MAX_HANDLER_CONCURRENCY = 4
const HANDLER_TIMEOUT_MS = 10_000
const SCAN_LIMIT = 100
const keyOf = (uid: number | string) => typeof uid + ':' + String(uid)
const messageKey = (account: string, folder: string, uidValidity: number, uid: number | string) =>
  createHash('sha256').update(JSON.stringify([account, folder, uidValidity, uid])).digest('hex')

export function normalizeMailConsumers(raw: unknown): MailConsumerConfig[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw) || raw.length > MAX_CONSUMERS) throw new Error('consumers must contain at most 20 entries')
  const ids = new Set<string>()
  return raw.map((value, index) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`consumer ${index + 1} must be an object`)
    const row = value as Record<string, unknown>
    const id = typeof row.id === 'string' ? row.id.trim() : ''
    const account = typeof row.account === 'string' ? row.account.trim() : ''
    const folder = typeof row.folder === 'string' && row.folder.trim() ? row.folder.trim() : 'INBOX'
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new Error(`consumer ${index + 1} has an invalid id`)
    if (ids.has(id)) throw new Error(`consumer id ${id} is duplicated`)
    ids.add(id)
    if (!account || account.length > 128 || /[\r\n\0]/.test(account)) throw new Error(`consumer ${id} has an invalid account`)
    if (folder.length > 200 || /[\r\n\0]/.test(folder)) throw new Error(`consumer ${id} has an invalid folder`)
    if (row.enabled !== undefined && typeof row.enabled !== 'boolean') throw new Error(`consumer ${id} enabled must be boolean`)
    const rawSenders = row.senders ?? []
    if (!Array.isArray(rawSenders) || rawSenders.length > MAX_SENDERS || rawSenders.some((sender: unknown) => typeof sender !== 'string' || sender.length > 254 || /[\r\n\0]/.test(sender)))
      throw new Error(`consumer ${id} senders must be an address list of at most ${MAX_SENDERS}`)
    if (row.subject !== undefined && (typeof row.subject !== 'string' || row.subject.length > 512 || /[\r\n\0]/.test(row.subject)))
      throw new Error(`consumer ${id} subject must be a string of at most 512 characters`)
    return {
      id,
      account,
      folder,
      senders: [...new Set(((row.senders ?? []) as string[]).map(sender => sender.trim().toLowerCase()).filter(Boolean))],
      ...(typeof row.subject === 'string' && row.subject !== '' ? { subject: row.subject } : {}),
      enabled: row.enabled !== false,
    }
  })
}

function addressOf(value: AddressEntry): string {
  return typeof value.address === 'string' ? value.address.trim() : ''
}

function bindingFor(account: unknown, accountName: string, folder: string, consumers: MailConsumerConfig[]): string {
  return createHash('sha256').update(JSON.stringify([accountName, folder, account, consumers])).digest('hex')
}

function consumerMatches(config: MailConsumerConfig, message: ListedMessage): boolean {
  if (config.subject && !message.subject.toLocaleLowerCase().includes(config.subject.toLocaleLowerCase())) return false
  if (!config.senders.length) return true
  const allowed = new Set(config.senders)
  return message.from.some(from => {
    const address = addressOf(from)
    return address !== '' && allowed.has(address.toLowerCase())
  })
}

/** Best-effort, process-local email arrival notifications. It never reads bodies or invokes DSH sessions. */
export class MailConsumerBackend {
  private readonly subscriptions = new Map<string, Subscription>()
  private readonly cursors = new Map<string, Cursor>()
  private readonly handlerPromises = new Set<Promise<void>>()
  private readonly handlerControllers = new Set<AbortController>()
  private readonly mailboxErrors = new Map<string, string>()
  private readonly configBinding = new Map<string, string>()
  private timer: ReturnType<typeof setTimeout> | undefined
  private running: Promise<void> | undefined
  private started = false
  private lastScanAt: string | undefined
  private lastError: string | undefined
  private droppedEvents = 0
  private handlerFailures = 0
  private handlerTimeouts = 0
  private appReady = false
  constructor(
    private readonly runtime: EmailRuntime,
    private readonly config: { consumers?: unknown; consumerPollSeconds?: number },
    private readonly handlerTimeoutMs = HANDLER_TIMEOUT_MS,
  ) {}

  markAppReady(): void {
    this.appReady = true
    this.syncPolling()
  }

  private syncPolling(): void {
    let enabled = false
    try { enabled = this.configs().some(item => item.enabled) } catch { /* tick will expose invalid config */ }
    if (enabled && this.appReady && !this.started) {
      try {
        this.pollInterval()
        this.started = true
        this.schedule(0)
      } catch (error) { this.lastError = error instanceof Error ? error.message : 'Invalid email consumer configuration' }
      return
    }
    if (!enabled && this.started) {
      this.started = false
      if (this.timer) clearTimeout(this.timer)
      this.timer = undefined
      this.cursors.clear()
    }
  }

  private configs(): MailConsumerConfig[] { return normalizeMailConsumers(this.config.consumers) }
  private pollInterval(): number {
    const value = Number(this.config.consumerPollSeconds ?? 60)
    if (!Number.isInteger(value) || value < 30 || value > 3600) throw new Error('consumerPollSeconds must be between 30 and 3600')
    return value * 1000
  }

  subscribe(consumerId: string, handler: EmailArrivalHandler): () => void {
    if (typeof handler !== 'function') throw new TypeError('emailTasks.subscribe requires a handler')
    const config = this.configs().find(item => item.id === consumerId && item.enabled)
    if (!config) throw new Error(`Email consumer ${consumerId} is not configured and enabled`)
    const current = this.subscriptions.get(consumerId)
    if (current?.active) throw new Error(`Email consumer ${consumerId} already has a handler`)
    const subscription: Subscription = { handler, active: true, inFlight: 0, pending: 0, controllers: new Set() }
    this.subscriptions.set(consumerId, subscription)
    this.syncPolling()
    return () => {
      subscription.active = false
      for (const controller of subscription.controllers) controller.abort(new Error('email consumer unsubscribed'))
      if (this.subscriptions.get(consumerId) === subscription) this.subscriptions.delete(consumerId)
    }
  }

  status(): EmailTasksStatus {
    this.syncPolling()
    let configured = 0
    try { configured = this.configs().filter(item => item.enabled).length } catch { /* surfaced on the next scan */ }
    return {
      enabled: configured > 0,
      configured,
      registered: [...this.subscriptions].filter(([, value]) => value.active).map(([id]) => id).sort(),
      running: this.started || this.running !== undefined,
      inFlight: [...this.subscriptions.values()].reduce((count, item) => count + item.pending, 0),
      ...(this.lastScanAt ? { lastScanAt: this.lastScanAt } : {}),
      ...(this.lastError ? { lastError: this.lastError } : {}),
      droppedEvents: this.droppedEvents,
      handlerFailures: this.handlerFailures,
      handlerTimeouts: this.handlerTimeouts,
    }
  }

  private deliver(subscription: Subscription, event: EmailArrivalEvent): void {
    if (!subscription.active) return
    if (subscription.inFlight >= MAX_HANDLER_CONCURRENCY) {
      this.droppedEvents++
      this.lastError = `consumer ${event.consumerId} concurrency limit reached; event dropped`
      return
    }
    subscription.inFlight++
    subscription.pending++
    const controller = new AbortController()
    subscription.controllers.add(controller)
    this.handlerControllers.add(controller)
    let slotReleased = false
    let settled = false
    const releaseSlot = () => {
      if (slotReleased) return
      slotReleased = true
      subscription.inFlight = Math.max(0, subscription.inFlight - 1)
    }
    const settle = () => {
      if (settled) return
      settled = true
      releaseSlot()
      subscription.pending = Math.max(0, subscription.pending - 1)
      subscription.controllers.delete(controller)
      this.handlerControllers.delete(controller)
    }
    const work = Promise.resolve().then(() => subscription.handler({ ...event, signal: controller.signal })).then(
      () => { settle() },
      () => { this.handlerFailures++; this.lastError = `consumer ${event.consumerId} handler failed`; settle() },
    )
    const timed = new Promise<void>(resolve => {
      const timer = setTimeout(() => {
        if (!settled) {
          this.handlerTimeouts++
          this.lastError = `consumer ${event.consumerId} handler timed out after ${this.handlerTimeoutMs} ms`
          controller.abort(new Error('email consumer handler timed out'))
          releaseSlot()
        }
        resolve()
      }, this.handlerTimeoutMs)
      timer.unref?.()
      void work.finally(() => clearTimeout(timer))
    })
    const tracked: Promise<void> = work.finally(() => this.handlerPromises.delete(tracked))
    this.handlerPromises.add(tracked)
  }

  private async scanMailbox(account: string, folder: string, consumers: MailConsumerConfig[]): Promise<void> {
    const settings = this.runtime.getEffectiveSettings()
    const accountConfig = settings.accounts.get(account)
    if (!accountConfig) throw new Error('configured account is unavailable')
    const binding = bindingFor(accountConfig, account, folder, consumers)
    const page = await this.runtime.getPool().list(account, folder, SCAN_LIMIT, 0, false)
    const key = account + '\0' + folder
    const previous = this.cursors.get(key)
    const validity = Number.isSafeInteger(page.uidValidity) && page.uidValidity >= 0 ? page.uidValidity : 0
    const ids = new Set(page.messages.map(message => keyOf(message.uid)))
    const numericUids = page.messages.map(message => message.uid).filter((uid): uid is number => typeof uid === 'number' && Number.isSafeInteger(uid))
    const dateValues = page.messages.map(message => Date.parse(message.date)).filter(value => Number.isFinite(value))
    const maxDateMs = Math.max(previous?.maxDateMs ?? 0, ...dateValues)
    const orderedNumeric = page.messages.length === 0 || numericUids.length === page.messages.length
    const reliableDate = page.messages.length === 0 || dateValues.length === page.messages.length
    const maxNumericUid = Math.max(previous?.maxNumericUid ?? 0, ...numericUids)

    if (!previous || previous.binding !== binding || previous.uidValidity !== validity) {
      this.cursors.set(key, { binding, uidValidity: validity, ids, maxNumericUid: Math.max(0, ...numericUids), maxDateMs: Math.max(0, ...dateValues), dateReliable: reliableDate })
      return
    }

    const overlap = page.messages.some(message => previous.ids.has(keyOf(message.uid)))
    if (page.messages.length >= SCAN_LIMIT && previous.ids.size > 0 && !overlap) {
      this.lastError = `mail window exceeded ${SCAN_LIMIT} messages for ${account}/${folder}; cursor reset without dispatch`
      this.cursors.set(key, { binding, uidValidity: validity, ids, maxNumericUid: Math.max(0, ...numericUids), maxDateMs: Math.max(0, ...dateValues), dateReliable: reliableDate })
      return
    }

    const useNumericCursor = orderedNumeric && page.messages.length > 0
    const useDateCursor = !useNumericCursor && reliableDate && previous.dateReliable
    if (!useNumericCursor && !useDateCursor && page.messages.length > 0) {
      this.lastError = `opaque mail identifiers for ${account}/${folder} have no reliable date cursor; arrivals skipped`
      this.cursors.set(key, { binding, uidValidity: validity, ids, maxNumericUid, maxDateMs: previous.maxDateMs, dateReliable: previous.dateReliable && reliableDate })
      return
    }
    const fresh = page.messages.filter(message => !previous.ids.has(keyOf(message.uid)) && (
      useNumericCursor && typeof message.uid === 'number' ? message.uid > previous.maxNumericUid
        : useDateCursor && Date.parse(message.date) > previous.maxDateMs
    ))
    for (const message of fresh) {
      const sender = addressOf(message.from[0] ?? {})
      const eventId = messageKey(account, folder, validity, message.uid)
      for (const config of consumers) {
        if (!consumerMatches(config, message)) continue
        const subscription = this.subscriptions.get(config.id)
        if (!subscription?.active) {
          this.droppedEvents++
          this.lastError = `consumer ${config.id} has no registered handler; event dropped`
          continue
        }
        this.deliver(subscription, {
          eventId,
          consumerId: config.id,
          account,
          folder,
          uid: message.uid,
          uidValidity: validity,
          sender,
          ...(message.subject ? { subject: message.subject } : {}),
          ...(message.date ? { date: message.date } : {}),
        })
      }
    }
    this.cursors.set(key, { binding, uidValidity: validity, ids, maxNumericUid, maxDateMs, dateReliable: previous.dateReliable && reliableDate })
  }

  async tick(): Promise<void> {
    if (this.running) return this.running
    const running = (async () => {
      try {
        const configs = this.configs().filter(item => item.enabled)
        const activeKeys = new Set<string>()
        const mailboxes = new Map<string, MailConsumerConfig[]>()
        for (const config of configs) {
          const key = config.account + '\0' + config.folder
          activeKeys.add(key)
          const rows = mailboxes.get(key) ?? []
          rows.push(config)
          mailboxes.set(key, rows)
        }
        for (const key of this.cursors.keys()) if (!activeKeys.has(key)) { this.cursors.delete(key); this.configBinding.delete(key) }
        for (const [key, rows] of mailboxes) {
          const binding = createHash('sha256').update(JSON.stringify(rows)).digest('hex')
          if (this.configBinding.get(key) !== binding) {
            this.cursors.delete(key)
            this.configBinding.set(key, binding)
          }
          try {
            await this.scanMailbox(rows[0].account, rows[0].folder, rows)
            this.mailboxErrors.delete(key)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'unknown error'
            this.mailboxErrors.set(key, `email consumer scan failed for ${rows[0].account}/${rows[0].folder}: ${message}`)
          }
        }
        this.lastScanAt = new Date().toISOString()
        // Mailbox failures win over per-delivery noise, but a successful scan must
        // not erase a delivery error recorded during this very tick (concurrency
        // drop, handler failure or timeout): those are the only signal that an
        // event was lost, and the next scan reporting "no error" would hide it.
        const mailboxError = [...this.mailboxErrors.values()].at(-1)
        if (mailboxError !== undefined) this.lastError = mailboxError
        else if (this.lastError?.startsWith('email consumer scan failed for ')) this.lastError = undefined
      } catch {
        this.lastError = 'email consumer scan failed; check account settings and DSH logs'
      }
    })()
    this.running = running
    try { await running } finally { if (this.running === running) this.running = undefined }
  }

  private schedule(delay: number): void {
    if (!this.started) return
    this.timer = setTimeout(() => {
      void this.tick().finally(() => {
        if (this.started) {
          let interval = 60_000
          try { interval = this.pollInterval() } catch { this.lastError = 'consumerPollSeconds must be between 30 and 3600' }
          this.schedule(interval)
        }
      })
    }, delay)
    this.timer.unref?.()
  }

  start(): void {
    if (this.started) return
    this.appReady = true
    this.syncPolling()
  }

  async stop(): Promise<void> {
    this.started = false
    this.appReady = false
    if (this.timer) clearTimeout(this.timer)
    this.timer = undefined
    await this.running
    for (const subscription of this.subscriptions.values()) subscription.active = false
    for (const controller of this.handlerControllers) controller.abort(new Error('email consumer stopped'))
    this.subscriptions.clear()
    this.cursors.clear()
    this.configBinding.clear()
    await Promise.race([
      Promise.all([...this.handlerPromises]),
      new Promise(resolve => {
        const timer = setTimeout(resolve, this.handlerTimeoutMs)
        timer.unref?.()
      }),
    ])
  }
}

export function installMailConsumers(ctx: any, backend: MailConsumerBackend): void {
  ctx.provide?.('emailTasks', { subscribe: backend.subscribe.bind(backend), status: backend.status.bind(backend) })
  ctx.inject?.(['appReady'], (host: any) => host.appReady?.onReady?.(() => backend.markAppReady()))
  ctx.on?.('dispose', () => backend.stop())
}
