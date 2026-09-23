/** Harness 0.1.7 keeps editable fields in the profile and supplies live references. */
import z from '@deepseek-ai/schemastery'
import type { EmailConfig } from './config.js'

const endpoint = () => z.object({
  host: z.string(), port: z.number().min(1).max(65535), secure: z.boolean(),
  connectionTimeoutMs: z.number(), socketTimeoutMs: z.number(),
})
export const Config: z = z.object({
  provider: z.string().volatile(), user: z.string().volatile(),
  password: z.string().role('secret').volatile(),
  senderName: z.string().volatile(), authUser: z.string().volatile(),
  authPassword: z.string().role('secret').volatile(),
  clientId: z.string().volatile(), authKind: z.union(['password', 'oauth2']).volatile(),
  imap: endpoint().volatile(), smtp: endpoint().volatile(),
  inboxFolder: z.string().volatile(), sendApproval: z.boolean().volatile(),
  maxBodyChars: z.number().volatile(), downloadDir: z.string().volatile(),
  accounts: z.dict(z.any()).role('secret').volatile(), defaultAccount: z.string().volatile(),
  accountsYaml: z.string().role('secret').volatile(), serverPresets: z.string().volatile(),
  maxAttachmentBytes: z.number().volatile(), bodySearchFallback: z.boolean().volatile(),
  bodySearchLimit: z.number().volatile(), idleTimeoutMs: z.number().volatile(),
  legacySettingsImported: z.boolean().volatile(),
})

/** A live view also accepts ordinary values from older hosts and direct callers. */
export function liveConfig(config: object): EmailConfig {
  return new Proxy(config, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      return value !== null && typeof value === 'object' && typeof value.get === 'function' ? value.get() : value
    },
  }) as EmailConfig
}
