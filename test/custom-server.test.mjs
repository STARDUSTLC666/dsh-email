import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { EmailSettingsBackend, SETTINGS_API_ROUTE } from '../lib/web.js'
import { EmailSettingsSchema } from '../lib/settings.js'
import { parseAccountsYaml, parseServerPresets, resolveEmailSettings } from '../lib/index.js'

// ---------------------------------------------------------------------------
// Client editor harness: the shipped card handlers rendered with a minimal React
// stand-in, exactly like test/editor-save-state.test.mjs.
// ---------------------------------------------------------------------------
function editor(props) {
  const slots = []
  let cursor = 0
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) }),
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial } },
    useEffect() {},
  }
  let client
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
    .replace('return module.exports;', 'module.exports.editors = { AccountCardsEditor, ServerPresetsEditor }; return module.exports;')
  runInNewContext(source, {
    console,
    window: { __ModuleLoader__: { load({ factory }) { client = factory(() => react) } } },
  })
  const render = () => { cursor = 0; return client.editors.AccountCardsEditor(props) }
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return undefined
    if (predicate(node)) return node
    for (const child of node.children ?? []) { const found = find(child, predicate); if (found) return found }
  }
  return { render, find }
}

const strings = node => {
  const out = []
  const walk = value => {
    if (typeof value === 'string') out.push(value)
    else if (value && typeof value === 'object') for (const child of value.children ?? []) walk(child)
  }
  walk(node)
  return out.join(' ')
}
const providerSelect = view => view.find(view.render(), node => node.type === 'select'
  && (node.children ?? []).some(option => option?.props?.value === '__custom__'))
const textInput = (view, aria) => view.find(view.render(), node => node.type === 'input'
  && node.props?.type === 'text' && node.props?.['aria-label'] === aria)
const numberInputs = view => {
  const out = []
  const walk = node => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'input' && node.props?.type === 'number' && node.props?.['aria-label'] === '端口') out.push(node)
    for (const child of node.children ?? []) walk(child)
  }
  walk(view.render())
  return out
}

test('the provider dropdown always offers the custom-server entry', () => {
  const view = editor({ detail: { list: [] }, presets: { builtin: {}, custom: {} }, onAutoSave() {} })
  view.find(view.render(), node => node.type === 'button' && node.children.includes('+ 添加账号')).props.onClick()
  const select = providerSelect(view)
  assert.ok(select, 'the provider select lists the custom-server option')
  assert.equal(select.props.value, '', 'an unconfigured card keeps the placeholder until a provider is chosen')
})

test('selecting the custom server reveals incoming/outgoing endpoint fields and blocks the save until filled', () => {
  const states = []
  const saves = []
  const view = editor({
    detail: { list: [] },
    presets: { builtin: {}, custom: {} },
    onAutoSave: (...args) => saves.push(args),
    onDraftStatus: blocked => states.push(blocked),
  })
  view.find(view.render(), node => node.type === 'button' && node.children.includes('+ 添加账号')).props.onClick()
  providerSelect(view).props.onChange({ target: { value: '__custom__' } })

  assert.equal(states.at(-1), true, 'an empty custom-server account is an unsaved draft')
  assert.equal(saves.length, 0, 'nothing is written while the endpoints are missing')
  assert.ok(textInput(view, 'IMAP 收信服务器'), 'the card renders an IMAP incoming-server field')
  assert.ok(textInput(view, 'SMTP 发信服务器（留空沿用收信服务器）'), 'the card renders an SMTP outgoing-server field')
  assert.match(strings(view.render()), /内网或自建邮件服务器/)

  textInput(view, 'IMAP 收信服务器').props.onChange({ target: { value: 'imap.corp.example' } })
  assert.equal(states.at(-1), false, 'filling the incoming server completes the card')
  assert.equal(saves.length, 1)
  const [cards] = saves[0]
  const plain = JSON.parse(JSON.stringify(cards[0]))
  assert.equal(plain.provider, undefined, 'a custom-server account writes no provider key')
  assert.deepEqual(plain.imap, { host: 'imap.corp.example', port: 993, secure: true })
  assert.deepEqual(plain.smtp, { host: 'imap.corp.example', port: 465, secure: true },
    'the outgoing server follows the incoming server until it is overridden')
  assert.ok(saves[1] === undefined, 'the draft is complete after filling the incoming server')
})

test('a stored custom-server account loads back into the custom-server editor', () => {
  const view = editor({
    detail: {
      list: [{
        name: 'corp', user: 'me@corp.example', hasPassword: true,
        imap: { host: 'imap.corp.example', port: 1993, secure: false },
        smtp: { host: 'smtp.corp.example', port: 2465, secure: true },
      }],
    },
    presets: { builtin: {}, custom: {} },
    onAutoSave() {},
  })
  view.find(view.render(), node => node.type === 'button' && node.children.includes('编辑')).props.onClick()
  const select = providerSelect(view)
  assert.equal(select.props.value, '__custom__', 'no provider + explicit endpoints selects the custom-server option')
  assert.equal(textInput(view, 'IMAP 收信服务器').props.value, 'imap.corp.example')
  assert.equal(textInput(view, 'SMTP 发信服务器（留空沿用收信服务器）').props.value, 'smtp.corp.example')
  assert.equal(view.find(view.render(), node => node.type === 'span' && node.children.includes('未完成')), undefined,
    'both endpoints are stored, so the card is complete')
})

test('an outgoing host may stay blank and blank ports fall back to 993/465', () => {
  const saves = []
  const states = []
  const view = editor({
    detail: { list: [] },
    presets: { builtin: {}, custom: {} },
    onAutoSave: (...args) => saves.push(args),
    onDraftStatus: blocked => states.push(blocked),
  })
  view.find(view.render(), node => node.type === 'button' && node.children.includes('+ 添加账号')).props.onClick()
  providerSelect(view).props.onChange({ target: { value: '__custom__' } })
  textInput(view, 'IMAP 收信服务器').props.onChange({ target: { value: 'imap.corp.example' } })
  assert.equal(states.at(-1), false)
  assert.equal(saves.length, 1)

  // Clearing both port fields still saves: blank falls back to 993 (IMAP) / 465 (SMTP),
  // and the defaults are written explicitly so the stored account is unambiguous.
  numberInputs(view)[0].props.onChange({ target: { value: '' } })
  numberInputs(view)[1].props.onChange({ target: { value: '' } })
  assert.equal(states.at(-1), false)
  const portDefaulted = JSON.parse(JSON.stringify(saves.at(-1)[0][0]))
  assert.deepEqual(portDefaulted.imap, { host: 'imap.corp.example', port: 993, secure: true })
  assert.deepEqual(portDefaulted.smtp, { host: 'imap.corp.example', port: 465, secure: true })

  // The outgoing host is explicitly documented as optional: clearing it must not
  // mark the account incomplete, and the saved card reuses the incoming host.
  textInput(view, 'SMTP 发信服务器（留空沿用收信服务器）').props.onChange({ target: { value: '' } })
  assert.equal(states.at(-1), false, 'a blank outgoing host keeps the account complete')
  const outgoingBlank = JSON.parse(JSON.stringify(saves.at(-1)[0][0]))
  assert.equal(outgoingBlank.smtp.host, 'imap.corp.example')
})

test('a custom POP3 account shows its POP3 endpoint in the card meta', () => {
  const view = editor({
    detail: {
      list: [{
        name: 'pop', user: 'me@corp.example', hasPassword: true, receiveProtocol: 'pop3',
        pop3: { host: 'pop.corp.example', port: 1995, secure: true },
        smtp: { host: 'smtp.corp.example', port: 465, secure: true },
      }],
    },
    presets: { builtin: {}, custom: {} },
    onAutoSave() {},
  })
  assert.match(strings(view.render()), /自定义 · POP3 pop\.corp\.example:1995/)
})

test('the reserved custom-server name cannot be used as a preset name', () => {
  assert.throws(() => parseServerPresets('__custom__:\n  imap: { host: imap.corp }\n  smtp: { host: smtp.corp }\n'), /保留名/)
})

// ---------------------------------------------------------------------------
// Host settings backend: account cards -> accountsYaml round trip.
// ---------------------------------------------------------------------------
const host = '192.168.36.49:3080'
function fixture(accountsYaml = '') {
  let value = EmailSettingsSchema({ accountsYaml })
  const writes = []
  const ctx = {
    settings: {
      writable: true,
      describe: () => [{ ns: 'dsh-email', revision: 0, user: value }],
      async replace(_ns, next) { writes.push(structuredClone(next)); value = structuredClone(next) },
    },
  }
  return { backend: new EmailSettingsBackend(ctx, { get: () => value }, {}), writes }
}
function request(body) {
  return new Request('http://internal' + SETTINGS_API_ROUTE, {
    method: 'POST',
    headers: { host, origin: 'http://' + host, 'x-dsh-email-settings': '1', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}
const serialize = async (backend, accounts, accountsYaml = '') => {
  const response = await backend.fetch(request({ action: 'serializeAccounts', accounts, accountsYaml, defaultAccount: '' }))
  assert.equal(response.status, 200)
  return (await response.json()).value.accountsYaml
}

test('a custom-server card writes its endpoints into the account and no provider key', async () => {
  const { backend } = fixture()
  const yaml = await serialize(backend, [{
    name: 'corp', user: 'me@corp.example', password: 'fixture-only',
    receiveProtocol: 'imap',
    imap: { host: 'imap.corp.example', port: 1993, secure: false },
    smtp: { host: 'smtp.corp.example', port: 2465, secure: true },
  }])
  const parsed = parseAccountsYaml(yaml)
  assert.equal(parsed.map.corp.provider, undefined, 'a custom-server account stores no provider')
  assert.deepEqual(parsed.map.corp.imap, { host: 'imap.corp.example', port: 1993, secure: false })
  assert.deepEqual(parsed.map.corp.smtp, { host: 'smtp.corp.example', port: 2465, secure: true })
  const resolved = resolveEmailSettings({ accountsYaml: yaml }).accounts.get('corp')
  assert.equal(resolved.imap.host, 'imap.corp.example')
  assert.equal(resolved.imap.port, 1993)
  assert.equal(resolved.smtp.host, 'smtp.corp.example')
  assert.equal(resolved.authKind, 'password')
})

test('a provider-backed card never freezes the snapshot endpoints into YAML', async () => {
  const { backend } = fixture()
  const yaml = await serialize(backend, [{
    name: 'work', provider: 'qq', user: 'me@qq.com', password: 'fixture-only',
    receiveProtocol: 'imap',
    imap: { host: 'imap.qq.com', port: 993, secure: true },
    smtp: { host: 'smtp.qq.com', port: 465, secure: true },
  }])
  assert.doesNotMatch(yaml, /\bimap:/, 'the preset stays the source of truth')
  assert.doesNotMatch(yaml, /\bsmtp:/, 'the preset stays the source of truth')
  assert.match(yaml, /provider: qq/)
})

test('changing a preset account to a manual server drops credentials from the previous provider', async () => {
  const source = 'work: {provider: qq, user: me@example.test, password: old-fixture, authPassword: relay-fixture, clientId: old-app}\n'
  const { backend } = fixture(source)
  const yaml = await serialize(backend, [{
    name: 'work', user: 'me@example.test', receiveProtocol: 'imap',
    imap: { host: 'imap.corp.example' }, smtp: { host: 'smtp.corp.example' },
  }], source)
  const account = parseAccountsYaml(yaml).map.work
  assert.equal(account.password, undefined)
  assert.equal(account.authPassword, undefined)
  assert.equal(account.clientId, undefined)
  assert.equal(account.smtp.host, 'smtp.corp.example')
})

test('clearing a custom-server host removes the stored endpoint', async () => {
  const { backend } = fixture('corp: {user: me@corp.example, password: fixture-only, imap: {host: imap.old.example, port: 993, secure: true}}\n')
  const yaml = await serialize(backend, [{
    name: 'corp', user: 'me@corp.example', password: 'fixture-only',
    receiveProtocol: 'imap',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: 'smtp.new.example', port: 465, secure: true },
  }], 'corp: {user: me@corp.example, password: fixture-only, imap: {host: imap.old.example, port: 993, secure: true}}\n')
  const parsed = parseAccountsYaml(yaml).map.corp
  assert.equal(parsed.imap, undefined, 'a cleared host must not leave the old server behind')
  assert.deepEqual(parsed.smtp, { host: 'smtp.new.example', port: 465, secure: true })
})

test('a custom-server snapshot reports the stored endpoints as its card', async () => {
  const { backend } = fixture('corp: {user: me@corp.example, password: fixture-only, imap: {host: imap.corp.example, port: 1993, secure: false}, smtp: {host: smtp.corp.example, port: 2465, secure: true}}\n')
  const snapshot = await backend.snapshot()
  const card = snapshot.accountsDetail.list.find(row => row.name === 'corp')
  assert.ok(card)
  assert.equal(card.provider, undefined)
  assert.equal(card.imap.host, 'imap.corp.example')
  assert.equal(card.imap.port, 1993)
  assert.equal(card.imap.secure, false)
  assert.equal(card.smtp.host, 'smtp.corp.example')
  assert.equal(card.hasPassword, true)
})

test('a bad custom-server port is rejected before anything is written', async () => {
  const { backend } = fixture()
  const response = await backend.fetch(request({
    action: 'serializeAccounts',
    accounts: [{ name: 'corp', user: 'me@corp.example', receiveProtocol: 'imap', imap: { host: 'imap.corp.example', port: 70000 }, smtp: { host: 'smtp.corp.example' } }],
    accountsYaml: '', defaultAccount: '',
  }))
  assert.equal(response.status, 400)
  const body = await response.json()
  assert.equal(body.ok, false)
  assert.match(body.error.message, /端口/)
})
