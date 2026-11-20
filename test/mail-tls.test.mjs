import test from 'node:test'
import assert from 'node:assert/strict'
import { mailCaCertificates, mailTlsOptions } from '../lib/mail-tls.js'

test('mail TLS trust anchors combine Node roots with the OS store', () => {
  const ca = mailCaCertificates()
  assert.ok(Array.isArray(ca) && ca.length > 0, 'the bundled roots always give a usable list')
  assert.ok(ca.every(cert => cert.startsWith('-----BEGIN CERTIFICATE-----')), 'every anchor is PEM')
  assert.equal(new Set(ca).size, ca.length, 'duplicates are removed')
  assert.deepEqual(mailTlsOptions(), { ca })
})

test('the trust anchors are computed once', () => {
  assert.equal(mailCaCertificates(), mailCaCertificates())
})