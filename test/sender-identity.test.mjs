import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEmailSettings } from '../lib/index.js'

const base = {
  provider: 'gmail',
  user: 'alias@example.com',
  password: 'alias-secret',
  imap: { host: 'imap.gmail.com', port: 993, secure: true },
  smtp: { host: 'smtp.gmail.com', port: 465, secure: true },
}

function acct(overrides = {}) {
  const settings = resolveEmailSettings({ ...base, ...overrides })
  return settings.accounts.get('default')
}

test('sender keeps the bare address when senderName is absent', () => {
  assert.equal(acct().sender, 'alias@example.com')
})

test('sender carries the display name when senderName is set', () => {
  assert.equal(acct({ senderName: '鲸鱼小姐' }).sender, '鲸鱼小姐 <alias@example.com>')
})

test('senderName is trimmed and blank values are ignored', () => {
  assert.equal(acct({ senderName: '  鲸鱼小姐  ' }).sender, '鲸鱼小姐 <alias@example.com>')
  assert.equal(acct({ senderName: '   ' }).sender, 'alias@example.com')
})

test('a display name needing quoting is quoted and escaped', () => {
  assert.equal(acct({ senderName: 'Doe, John' }).sender, '"Doe, John" <alias@example.com>')
  assert.equal(acct({ senderName: '"Quoted"' }).sender, '"Quoted" <alias@example.com>')
})

test('authUser and authPassword default to the sender credentials', () => {
  const account = acct()
  assert.equal(account.authUser, 'alias@example.com')
  assert.equal(account.authPassword, 'alias-secret')
})

test('authUser overrides the login while the sender address stays the alias', () => {
  const account = acct({ senderName: '鲸鱼小姐', authUser: 'owner@example.com', authPassword: 'owner-secret' })
  assert.equal(account.user, 'alias@example.com')
  assert.equal(account.sender, '鲸鱼小姐 <alias@example.com>')
  assert.equal(account.authUser, 'owner@example.com')
  assert.equal(account.authPassword, 'owner-secret')
})

test('authPassword alone keeps the sender address as the login', () => {
  const account = acct({ authPassword: 'other-secret' })
  assert.equal(account.authUser, 'alias@example.com')
  assert.equal(account.authPassword, 'other-secret')
})

test('an empty authUser falls back to the sender address', () => {
  assert.equal(acct({ authUser: '' }).authUser, 'alias@example.com')
})

test('authPassword alone satisfies the password requirement', () => {
  const account = acct({ password: '', authPassword: 'owner-secret' })
  assert.equal(account.password, 'owner-secret')
  assert.equal(account.authPassword, 'owner-secret')
  assert.equal(account.authUser, 'alias@example.com')
})

test('named accounts inherit the shorthand and override it per account', () => {
  const settings = resolveEmailSettings({
    ...base,
    senderName: 'Shared Name',
    accounts: {
      shared: {},
      alias: { user: 'other@example.com', senderName: 'Other', authUser: 'owner@example.com' },
    },
    defaultAccount: 'shared',
  })
  const shared = settings.accounts.get('shared')
  const alias = settings.accounts.get('alias')
  assert.equal(shared.sender, 'Shared Name <alias@example.com>')
  assert.equal(shared.authUser, 'alias@example.com')
  assert.equal(alias.sender, 'Other <other@example.com>')
  assert.equal(alias.authUser, 'owner@example.com')
  assert.equal(alias.authPassword, 'alias-secret')
})
