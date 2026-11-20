import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailPool } from '../lib/mail-client.js'
import { renderFolders } from '../lib/tool-contract.js'
import { resolveEmailSettings } from '../lib/config.js'

const settings = () => resolveEmailSettings({ provider: 'qq', user: 'fixture@example.test', password: 'synthetic-only' })

const row = (path, extra = {}) => ({
  name: path.split('/').at(-1),
  path,
  parentPath: '',
  delimiter: '/',
  specialUse: '',
  subscribed: true,
  ...extra,
})

test('folder listing carries delimiter, parent path and STATUS unread counts', async () => {
  const pool = new EmailPool(settings())
  const calls = []
  const client = {
    list: async (options) => {
      calls.push(options)
      return [
        row('INBOX', { name: 'INBOX', specialUse: '\\Inbox', status: { unseen: 3, messages: 10 } }),
        row('INBOX/电控', { parentPath: 'INBOX', status: { unseen: 0 } }),
        row('No Status'),
      ]
    },
  }
  pool.withImap = async (_account, _folder, run) => run(client)
  const result = await pool.folders(undefined, false)
  pool.dispose()

  assert.deepEqual(calls, [{ statusQuery: { unseen: true } }])
  assert.deepEqual(result.folders[0], {
    name: 'INBOX', path: 'INBOX', specialUse: '\\Inbox', subscribed: true,
    delimiter: '/', parentPath: '', unseen: 3,
  })
  assert.equal(result.folders[1].parentPath, 'INBOX')
  assert.equal(result.folders[1].unseen, 0)
  // A missing STATUS is not "zero unread": leave the field out so the rail
  // simply shows no badge instead of inventing one.
  assert.equal('unseen' in result.folders[2], false)
  assert.equal(result.folders[2].delimiter, '/')
})

test('a server without LIST-STATUS still lists folders', async () => {
  const pool = new EmailPool(settings())
  const calls = []
  const client = {
    list: async (options) => {
      calls.push(options)
      if (options !== undefined) throw new Error('LIST-STATUS unknown')
      return [row('INBOX', { specialUse: '\\Inbox' })]
    },
  }
  pool.withImap = async (_account, _folder, run) => run(client)
  const result = await pool.folders(undefined, false)
  pool.dispose()

  assert.deepEqual(calls, [{ statusQuery: { unseen: true } }, undefined])
  assert.equal(result.folders.length, 1)
  assert.equal('unseen' in result.folders[0], false)
})

test('marking or opening mail invalidates the cached unread count', async () => {
  const pool = new EmailPool(settings())
  let lists = 0
  const client = {
    list: async () => {
      lists++
      return [row('INBOX', { specialUse: '\\Inbox', status: { unseen: 1 } })]
    },
    fetchOne: async () => ({ uid: 7, flags: new Set() }),
    messageFlagsAdd: async () => true,
  }
  pool.withImap = async (_account, _folder, run) => run(client)

  await pool.folders(undefined, false)
  await pool.folders(undefined, false)
  assert.equal(lists, 1, 'the 60s cache still serves repeated reads')

  await pool.mark(undefined, 'INBOX', 7, 'read')
  await pool.folders(undefined, false)
  assert.equal(lists, 2, 'a real flag change must not keep the old count')
  pool.dispose()
})

test('email_folders text reports unread counts next to the path', () => {
  const [block] = renderFolders({
    account: 'work',
    folders: [
      { name: 'INBOX', path: 'INBOX', specialUse: '\\Inbox', subscribed: true, delimiter: '/', parentPath: '', unseen: 2 },
      { name: 'Reports', path: 'INBOX/Reports', specialUse: '', subscribed: true, delimiter: '/', parentPath: 'INBOX' },
    ],
  })
  assert.match(block.text, /INBOX.*未读 2/)
  assert.doesNotMatch(block.text, /Reports.*未读/)
})