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
    maxBodyChars: 20000, downloadDir: '', accountsYaml: '',
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
        return { account: name || settings.defaultAccount, folder: folder || 'INBOX', count: state.rows.length, messages: state.rows }
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
  assert.equal(tool.newCount, 2)
  assert.deepEqual(tool.messages.map(message => message.uid), [12])
  assert.equal(web.newCount, 2)
  assert.deepEqual(web.messages.map(message => message.uid), [12, 11])
  assert.equal((await runtime.watch('', '', 20, 'tool')).newCount, 0)
  assert.equal((await runtime.watch('', 'Archive', 20, 'tool')).firstRun, true)
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
