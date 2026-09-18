import test from 'node:test'
import assert from 'node:assert/strict'
import { createEmailRuntime } from '../lib/runtime.js'
import { buildEmailTools } from '../lib/tools.js'
import { installSendApproval } from '../lib/approval.js'

const account = { provider: 'qq', user: 'row@example.com', password: 'test-password' }

function fixture(t, row = account) {
  const state = { user: {}, rows: [], operations: [], warnings: [], pools: [], effects: [], registered: [] }
  let base = {}
  const defaults = {
    provider: '', user: '', password: '', inboxFolder: 'INBOX', sendApproval: true,
    maxBodyChars: 20000, downloadDir: '', accountsYaml: '', serverPresets: '',
    imap: { host: '', port: 993, secure: true }, smtp: { host: '', port: 465, secure: true },
  }
  const ctx = {
    settings: {
      register(ns, schema, options) {
        state.registered.push({ ns, options })
        base = options.base
        return { get: () => ({
          ...defaults, ...base, ...state.user,
          imap: { ...defaults.imap, ...base.imap, ...state.user.imap },
          smtp: { ...defaults.smtp, ...base.smtp, ...state.user.smtp },
        }) }
      },
      describe: () => [{ ns: 'dsh-email', user: state.user }],
    },
    logger: { warn: (message) => state.warnings.push(message) },
    effect: (effect) => state.effects.push(effect()),
  }
  const createPool = (settings) => {
    const pool = {
      settings, starts: 0, disposals: 0,
      startIdleSweep() { this.starts++ },
      dispose() { this.disposals++ },
      async list(name, folder, ...args) {
        args.at(-1)?.throwIfAborted()
        state.operations.push({ method: 'list', args: [name, folder, ...args] })
        return { account: name || settings.defaultAccount, folder: folder || 'INBOX', count: state.rows.length, uidValidity: state.uidValidity ?? 0, messages: state.rows }
      },
      async unseenUids(name, folder, ...args) {
        args.at(-1)?.throwIfAborted()
        state.operations.push({ method: 'unseenUids', args: [name, folder, ...args] })
        const uids = state.rows.map(row => row.uid).sort((a, b) => b - a)
        return { account: name || settings.defaultAccount, folder: folder || 'INBOX', count: uids.length, uidValidity: state.uidValidity ?? 0, uids }
      },
      async fetchByUids(name, folder, uids, ...args) {
        args.at(-1)?.throwIfAborted()
        state.operations.push({ method: 'fetchByUids', args: [name, folder, uids, ...args] })
        const byUid = new Map(state.rows.map(row => [row.uid, row]))
        return uids.map(uid => byUid.get(uid)).filter(Boolean)
      },
    }
    for (const method of ['read', 'mark', 'search', 'send', 'reply', 'folders', 'downloadAttachment']) {
      pool[method] = async (...args) => {
        state.operations.push({ method, args })
        return { method, account: settings.defaultAccount }
      }
    }
    state.pools.push(pool)
    return pool
  }
  const runtime = createEmailRuntime(ctx, row, createPool)
  t.after(() => runtime.dispose())
  return { state, runtime, tools: buildEmailTools(runtime), ctx }
}

test('live settings reuse the current pool, replace it on changes, and release it once at unload', (t) => {
  const { runtime, state } = fixture(t)
  const first = runtime.getPool()
  assert.equal(state.pools.length, 1)
  assert.equal(first.starts, 1)
  assert.equal(runtime.getPool(), first)
  assert.equal(state.registered[0].options.applies, 'live')

  // Empty form host fields still mean the provider preset, so no reconnect.
  state.user = { imap: { host: '' }, smtp: { host: '' } }
  assert.equal(runtime.getPool(), first)
  state.user = { user: 'updated@example.com', password: 'new-test-password' }
  const second = runtime.getPool()
  assert.notEqual(second, first)
  assert.equal(first.disposals, 1)
  assert.equal(second.starts, 1)
  assert.equal(second.settings.accounts.get('default').user, 'updated@example.com')
  assert.equal(runtime.getPool(), second)

  state.effects.forEach(dispose => dispose())
  runtime.dispose()
  assert.equal(first.disposals, 1)
  assert.equal(second.disposals, 1)
  assert.throws(() => runtime.getPool(), /已卸载/)
  assert.equal(state.pools.length, 2)
})

test('a plugin loaded without an account becomes usable through live settings', async (t) => {
  const { runtime, state, tools } = fixture(t, {})
  assert.equal(state.pools.length, 0)
  assert.equal(state.warnings.length, 1)
  assert.equal((await tools.find(tool => tool.name === 'email_health').execute({})).ok, false)
  state.user = { ...account }
  const result = await tools.find(tool => tool.name === 'email_folders').execute({})
  assert.equal(result.method, 'folders')
  assert.equal(state.pools.length, 1)
  assert.equal(runtime.getEffectiveSettings().accounts.get('default').user, account.user)
})

test('tool execution forwards normalized arguments, caller signal, and session workspace', async (t) => {
  const { state, tools } = fixture(t)
  const signal = new AbortController().signal
  const exec = { signal, agent: { session: { header: { cwd: 'E:/task-workspace' } } } }
  await tools.find(tool => tool.name === 'email_list').execute({ limit: 200, offset: -3, folder: ' INBOX ', since: '2026-09-01', until: '2026-09-05' }, exec)
  assert.deepEqual(state.operations[0].args, [undefined, 'INBOX', 100, 0, false, new Date('2026-09-01T00:00:00Z'), new Date('2026-09-06T00:00:00Z'), signal])
  await tools.find(tool => tool.name === 'email_attachment').execute({ uid: 7, index: -1 }, exec)
  assert.deepEqual(state.operations[1], { method: 'downloadAttachment', args: [undefined, '', 7, 0, 'E:/task-workspace', signal] })
})

test('tool and web watches maintain independent baselines for each folder', async (t) => {
  const { runtime, state } = fixture(t)
  state.rows = [{ uid: 10 }]
  assert.equal((await runtime.watch('', '', 20, 'tool')).firstRun, true)
  assert.equal((await runtime.watch('', '', 20, 'web')).firstRun, true)
  state.rows = [{ uid: 12 }, { uid: 11 }, { uid: 10 }]
  const tool = await runtime.watch('', '', 1, 'tool')
  const web = await runtime.watch('', '', 20, 'web')
  assert.equal(tool.newCount, 1)
  assert.deepEqual(tool.messages.map(message => message.uid), [11]) // fresh 中最旧的 limit 条
  const toolNext = await runtime.watch('', '', 1, 'tool')
  assert.equal(toolNext.newCount, 1)
  assert.deepEqual(toolNext.messages.map(message => message.uid), [12])
  assert.equal(web.newCount, 2)
  assert.deepEqual(web.messages.map(message => message.uid), [12, 11])
  assert.equal((await runtime.watch('', '', 20, 'tool')).newCount, 0)
  assert.equal((await runtime.watch('', 'Archive', 20, 'tool')).firstRun, true)
})

test('limit 小于新邮件数时按最旧优先分批补齐，连续调用一封不漏', async (t) => {
  const { runtime, state } = fixture(t)
  state.rows = [{ uid: 9 }]
  assert.equal((await runtime.watch('', '', 20, 'tool')).firstRun, true)

  state.rows = [{ uid: 12 }, { uid: 11 }, { uid: 10 }]
  const seen = []
  for (let i = 0; i < 3; i++) {
    const batch = await runtime.watch('', '', 1, 'tool')
    assert.ok(batch.messages.length <= 1, 'limit=1 时每次最多返回一条')
    seen.push(...batch.messages.map(message => message.uid))
  }
  assert.deepEqual(seen, [10, 11, 12], '三封新邮件必须连续调用全部返回')
  const idle = await runtime.watch('', '', 1, 'tool')
  assert.equal(idle.newCount, 0)
  assert.deepEqual(idle.messages, [])
})

test('cancelled watch reads do not advance the next successful baseline', async (t) => {
  const { runtime, state } = fixture(t)
  const reason = new Error('cancelled watch')
  state.rows = [{ uid: 1 }]
  await assert.rejects(runtime.watch('', '', 20, 'tool', AbortSignal.abort(reason)), error => error === reason)
  assert.equal((await runtime.watch('', '', 20, 'tool')).firstRun, true)
})

test('approval controls tool execution and observes live changes to the send policy', async (t) => {
  const { runtime, state, tools } = fixture(t)
  let listener
  let outcome = 'rejected'
  const requests = []
  installSendApproval({
    on(event, handler, options) {
      assert.equal(event, 'tools/pre-execute')
      assert.equal(options.prepend, true)
      listener = handler
    },
    get: () => ({ request: async request => { requests.push(request); return outcome } }),
  }, runtime)
  const args = { to: ' recipient@example.com ', subject: ' test ', text: 'body' }
  const signal = new AbortController().signal
  const agent = { session: { header: { cwd: 'E:/task-workspace' } } }
  const exec = { name: 'email_send', arguments: args, signal, agent, callId: 'call-1' }
  const send = tools.find(tool => tool.name === 'email_send')
  const next = async () => { await send.execute(args, exec); return { kind: 'allow' } }
  assert.equal((await listener(exec, next)).kind, 'deny')
  assert.equal(state.operations.length, 0)
  outcome = 'allowed-once'
  assert.deepEqual(await listener(exec, next), { kind: 'allow' })
  assert.equal(state.operations[0].method, 'send')
  assert.deepEqual(state.operations[0].args, [undefined, 'recipient@example.com', 'test', 'body', undefined, undefined, signal])
  assert.equal(requests[1].signal, signal)
  assert.equal(requests[1].agent, agent)
  assert.equal(requests[1].callId, 'call-1')
  state.user = { sendApproval: false }
  assert.deepEqual(await listener(exec, next), { kind: 'allow' })
  assert.equal(requests.length, 2)
})

// --- serverPresets as a provider lookup source ------------------------------
//
// The settings page lets the user name a custom preset as an account's
// provider. Resolution therefore needs the preset text — but toEmailConfig
// deliberately drops it, since projecting it would put it in the pool
// fingerprint and tear down live connections on every preset edit. These tests
// pin both halves of that contract: the runtime must *hand presets to*
// resolution, and resolution must stay *blind to* an unreferenced preset.

const CORP = 'corp: { imap: { host: imap.corp, port: 143, secure: false }, smtp: { host: smtp.corp } }\n'

test('runtime resolution expands a custom preset named by a user-set provider', (t) => {
  const { runtime, state } = fixture(t)
  state.user = { accountsYaml: 'work: { provider: corp, user: w@corp.example, password: pw }\n', serverPresets: CORP }
  const settings = runtime.getEffectiveSettings()
  const work = settings.accounts.get('work')
  assert.equal(work.imap.host, 'imap.corp', 'the preset text must reach resolution')
  assert.equal(work.imap.port, 143)
  assert.equal(work.imap.secure, false)
  assert.equal(work.smtp.host, 'smtp.corp')
  assert.equal('serverPresets' in settings, false, 'never stored on the resolved settings')
})

test('a custom preset as the shared shorthand provider resolves too', (t) => {
  const { runtime, state } = fixture(t, { provider: 'corp', user: 'row@corp.example', password: 'p' })
  state.user = { serverPresets: CORP }
  assert.equal(runtime.getEffectiveSettings().accounts.get('default').imap.host, 'imap.corp')
})

test('editing a preset no account references never changes the fingerprint', (t) => {
  const { runtime, state } = fixture(t)
  const yaml = 'work: { provider: qq, user: w@qq.com, password: pw }\n'
  state.user = { accountsYaml: yaml, serverPresets: CORP }
  const first = runtime.getEffectiveSettings()
  const pool = runtime.getPool()
  // The referenced provider is the built-in qq, so a preset edit is inert: the
  // same pool must survive, or every keystroke in the preset textarea would drop
  // live IMAP sessions.
  state.user = { accountsYaml: yaml, serverPresets: 'corp: { imap: { host: imap.moved }, smtp: { host: smtp.moved } }\n' }
  assert.deepEqual(runtime.getEffectiveSettings(), first)
  assert.equal(runtime.getPool(), pool, 'an unreferenced preset edit must not dispose the pool')
})

test('a preset edit that an account does reference does reconnect it', (t) => {
  const { runtime, state } = fixture(t)
  state.user = { accountsYaml: 'work: { provider: corp, user: w@corp.example, password: pw }\n', serverPresets: CORP }
  const pool = runtime.getPool()
  assert.equal(pool.settings.accounts.get('work').imap.host, 'imap.corp')
  state.user = { accountsYaml: 'work: { provider: corp, user: w@corp.example, password: pw }\n', serverPresets: 'corp: { imap: { host: imap.moved }, smtp: { host: smtp.moved } }\n' }
  const next = runtime.getPool()
  assert.notEqual(next, pool, 'the endpoint really changed, so a new pool is correct')
  assert.equal(next.settings.accounts.get('work').imap.host, 'imap.moved')
})

test('validateSettingsValue accepts the custom preset names in effect', async (t) => {
  const { validateSettingsValue } = await import('../lib/settings.js')
  const value = { ...account, provider: 'corp', serverPresets: CORP }
  assert.throws(() => validateSettingsValue(value), /未知的邮箱服务商 "corp"/, 'without the table it is unknown')
  assert.doesNotThrow(() => validateSettingsValue(value, ['corp']))
  // The message still names everything that would be accepted.
  assert.throws(() => validateSettingsValue({ ...account, provider: 'nope' }, ['corp']), /corp/)
})

test('UIDVALIDITY 变化时重建基线，而不是把重编号的 uid 当成新邮件', async (t) => {
  const { runtime, state } = fixture(t)
  state.uidValidity = 111
  state.rows = [{ uid: 10 }]
  assert.equal((await runtime.watch('', '', 20, 'tool')).firstRun, true)

  state.rows = [{ uid: 12 }, { uid: 11 }, { uid: 10 }]
  assert.equal((await runtime.watch('', '', 20, 'tool')).newCount, 2)

  // The server renumbered the mailbox: uids restart below the stored cursor.
  state.uidValidity = 222
  state.rows = [{ uid: 3 }, { uid: 2 }]
  const reset = await runtime.watch('', '', 20, 'tool')
  assert.equal(reset.reset, true)
  assert.equal(reset.firstRun, false)
  assert.equal(reset.newCount, 0)
  assert.deepEqual(reset.messages, [])

  // The reseeded baseline still spots the next arrival.
  state.rows = [{ uid: 4 }, { uid: 3 }, { uid: 2 }]
  const after = await runtime.watch('', '', 20, 'tool')
  assert.equal(after.reset, undefined)
  assert.equal(after.newCount, 1)
  assert.deepEqual(after.messages.map((m) => m.uid), [4])
})
