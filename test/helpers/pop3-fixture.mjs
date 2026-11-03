import { readFileSync } from 'node:fs'
import { Pop3Client, resolveEmailSettings } from '../../lib/index.js'
import { createPop3Peer } from './pop3-peer.mjs'

export async function fixture(t, options = {}) {
  const peer = await createPop3Peer(options)
  t.after(() => peer.close())
  const config = { receiveProtocol: 'pop3', user: 'user@example.invalid', password: 'fixture-secret', pop3: { host: '127.0.0.1', port: peer.port, secure: !!options.tls }, smtp: { host: 'smtp.example.invalid', port: 465, secure: true } }
  const settings = resolveEmailSettings(config)
  const wireOptions = { timeoutMs: options.deadline ?? 3000, ...(options.tls ? { tlsOptions: { ca: readFileSync(new URL('../fixtures/smtp-test-ca.pem', import.meta.url)) } } : {}) }
  const client = new Pop3Client(settings, wireOptions)
  t.after(() => client.clear())
  return { peer, client, config, settings, wireOptions }
}
