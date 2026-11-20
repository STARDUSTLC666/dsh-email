import { getCACertificates, rootCertificates } from 'node:tls'

/**
 * Trust anchors for the IMAP / SMTP / POP3 sockets, or undefined when the
 * runtime cannot hand out a usable list.
 *
 * Node validates TLS against its own bundled roots only. A corporate mail
 * gateway that serves a certificate from the company's private CA therefore
 * fails with `unable to verify the first certificate` even though every
 * browser and mail client on the same machine trusts it — the CA simply lives
 * in the OS store, which Node does not read by default. Merging the OS roots
 * with the bundled ones keeps certificate validation on (a certificate signed
 * by an OS-trusted CA is what the rest of the machine already accepts) while
 * letting an intranet Exchange / gateway work without a per-account escape
 * hatch.
 *
 * `getCACertificates` is Node 22.15+/24.2+; an older or hardened runtime
 * degrades to the previous bundled-roots-only behaviour instead of throwing.
 */
let cached: string[] | undefined | null = null
export function mailCaCertificates(): string[] | undefined {
  if (cached !== null) return cached
  try {
    // 'default' is Node's effective store — bundled roots plus anything added
    // through NODE_EXTRA_CA_CERTS — so an explicit `ca` list does not silently
    // drop the extra CA the runtime was started with.
    const defaults = typeof getCACertificates === 'function' ? getCACertificates('default') : rootCertificates
    const system = typeof getCACertificates === 'function' ? getCACertificates('system') : []
    const merged = [...defaults, ...system]
    cached = merged.length > 0 ? [...new Set(merged)] : undefined
  } catch {
    cached = undefined
  }
  return cached
}

/** The TLS option object accepted by imapflow, nodemailer and the POP3 socket. */
export function mailTlsOptions(): { ca?: string[] } {
  const ca = mailCaCertificates()
  return ca === undefined ? {} : { ca }
}