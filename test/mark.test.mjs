import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailPool, MailError, resolveEmailSettings } from '../lib/index.js'

const QQ = { provider: 'qq', user: 'a@b.c', password: 'p' }

/** EmailPool with withImap stubbed to run against an in-memory fake server. */
function poolWithFakeImap() {
  const pool = new EmailPool(resolveEmailSettings(QQ))
  const state = {
    flags: new Set(),
    calls: [],
    folders: [{ path: 'INBOX' }, { path: 'Archive' }, { path: 'Deleted Messages' }],
    exists: true,
    moveResult: { sourceUid: 5, destinationUid: 999 },
  }
  const fakeClient = {
    async fetchOne(uid) {
      state.calls.push(['fetchOne', uid])
      if (!state.exists) return false
      return { uid, flags: new Set(state.flags) }
    },
    async messageFlagsAdd(uid, flags) {
      state.calls.push(['flagsAdd', ...flags])
      for (const flag of flags) state.flags.add(flag)
      return true
    },
    async messageFlagsRemove(uid, flags) {
      state.calls.push(['flagsRemove', ...flags])
      for (const flag of flags) state.flags.delete(flag)
      return true
    },
    async list() {
      state.calls.push(['list'])
      return state.folders
    },
    async messageMove(uid, target) {
      state.calls.push(['move', uid, target])
      return state.moveResult
    },
  }
  pool.withImap = async (_account, _folder, run, _readOnly) => run(fakeClient)
  return { pool, state }
}

test('mark read/unread toggles \\Seen and reports the resulting state', async () => {
  const { pool, state } = poolWithFakeImap()
  let result = await pool.mark(undefined, '', 5, 'read')
  assert.equal(result.seen, true)
  assert.equal(result.flagged, false)
  assert.equal(result.account, 'default')
  assert.deepEqual(state.flags, new Set(['\\Seen']))
  result = await pool.mark(undefined, '', 5, 'unread')
  assert.equal(result.seen, false)
  assert.deepEqual(state.flags, new Set())
})

test('mark is idempotent: already-satisfied flags issue no IMAP write', async () => {
  const { pool, state } = poolWithFakeImap()
  await pool.mark(undefined, '', 5, 'read')
  state.calls.length = 0
  const result = await pool.mark(undefined, '', 5, 'read')
  assert.equal(result.seen, true)
  assert.deepEqual(state.calls.filter(c => c[0] !== 'fetchOne'), [])
})

test('mark star/unstar toggles \\Flagged', async () => {
  const { pool, state } = poolWithFakeImap()
  let result = await pool.mark(undefined, '', 5, 'star')
  assert.equal(result.flagged, true)
  assert.deepEqual(state.flags, new Set(['\\Flagged']))
  result = await pool.mark(undefined, '', 5, 'unstar')
  assert.equal(result.flagged, false)
  assert.deepEqual(state.flags, new Set())
})

test('mark move validates the target folder and reports the new uid', async () => {
  const { pool, state } = poolWithFakeImap()
  const moved = await pool.mark(undefined, '', 5, 'move', 'Archive')
  assert.equal(moved.movedTo, 'Archive')
  assert.equal(moved.movedUid, 999)
  assert.deepEqual(state.calls.at(-1), ['move', 5, 'Archive'])
  await assert.rejects(
    () => pool.mark(undefined, '', 5, 'move', 'Nope'),
    err => err instanceof MailError && /找不到目标文件夹/.test(err.message) && /Archive/.test(err.message),
  )
  await assert.rejects(
    () => pool.mark(undefined, '', 5, 'move', '  '),
    err => err instanceof MailError && /toFolder/.test(err.message),
  )
})

test('mark move to the current folder is rejected without server traffic', async () => {
  const { pool, state } = poolWithFakeImap()
  await assert.rejects(
    () => pool.mark(undefined, '', 5, 'move', 'INBOX'),
    err => err instanceof MailError && /无需移动/.test(err.message),
  )
  assert.equal(state.calls.some(c => c[0] === 'move'), false)
})

test('mark move tolerates servers that omit the destination uid', async () => {
  const { pool, state } = poolWithFakeImap()
  state.moveResult = true
  const moved = await pool.mark(undefined, '', 5, 'move', 'Deleted Messages')
  assert.equal(moved.movedTo, 'Deleted Messages')
  assert.equal(moved.movedUid, undefined)
})

test('mark move failure surfaces as MailError', async () => {
  const { pool, state } = poolWithFakeImap()
  state.moveResult = false
  await assert.rejects(
    () => pool.mark(undefined, '', 5, 'move', 'Archive'),
    err => err instanceof MailError && /MOVE\/COPY/.test(err.message),
  )
})

test('mark on a missing uid reports the actionable hint', async () => {
  const { pool, state } = poolWithFakeImap()
  state.exists = false
  await assert.rejects(
    () => pool.mark(undefined, '', 5, 'read'),
    err => err instanceof MailError && /找不到 uid=5/.test(err.message),
  )
})
