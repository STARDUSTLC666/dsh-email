import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

// Run the shipped card handlers and preserve hook state across user edits.
function editor(name, props) {
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
  const render = () => { cursor = 0; return client.editors[name](props) }
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return undefined
    if (predicate(node)) return node
    for (const child of node.children ?? []) { const found = find(child, predicate); if (found) return found }
  }
  return { render, find }
}

test('account cards display explicitly configured servers instead of provider defaults', () => {
  const props = {
    detail: { list: [{ name: 'work', provider: 'gmail', user: 'fixture@example.invalid', imap: { host: 'imap.private.example', port: 1993 }, smtp: { host: 'smtp.private.example', port: 1465 } }] },
    presets: { builtin: { gmail: { imap: { host: 'imap.gmail.com', port: 993 }, smtp: { host: 'smtp.gmail.com', port: 465 } } } },
  }
  const view = editor('AccountCardsEditor', props)
  const meta = pattern => view.find(view.render(), node => node.children.some(value => typeof value === 'string' && pattern.test(value)))
  assert.ok(meta(/imap\.private\.example:1993.*smtp\.private\.example:1465/))
  assert.equal(meta(/imap\.gmail\.com:993/), undefined)
  props.detail.list[0].imap = { host: 'imap.updated.example', port: 2993 }
  assert.ok(meta(/imap\.updated\.example:2993/), 'a fresh snapshot updates only the displayed server, preserving edits')
})

test('switching providers clears the old projected servers before the next snapshot', () => {
  const props = {
    detail: { list: [{ name: 'work', provider: 'gmail', user: 'fixture@example.invalid', imap: { host: 'old.private.example', port: 993 }, smtp: { host: 'old.smtp.example', port: 465 } }] },
    presets: { builtin: { outlook: { imap: { host: 'outlook.office365.com', port: 993 }, smtp: { host: 'smtp.office365.com', port: 587 } } } },
    onAutoSave() {},
  }
  const view = editor('AccountCardsEditor', props)
  view.find(view.render(), node => node.type === 'button' && node.children.includes('编辑')).props.onClick()
  view.find(view.render(), node => node.type === 'select').props.onChange({ target: { value: 'outlook' } })
  assert.ok(view.find(view.render(), node => node.children.some(value => typeof value === 'string' && /outlook\.office365\.com:993.*smtp\.office365\.com:587/.test(value))))
  assert.equal(view.find(view.render(), node => node.children.some(value => typeof value === 'string' && /old\.private/.test(value))), undefined)
})

test('an incomplete new account reports unsaved edits until a provider is selected', () => {
  const states = [], saves = []
  const view = editor('AccountCardsEditor', {
    detail: { list: [] },
    onDraftStatus: blocked => states.push(blocked),
    onAutoSave: (...args) => saves.push(args),
  })
  view.find(view.render(), node => node.type === 'button' && node.children.includes('+ 添加账号')).props.onClick()
  assert.equal(states.at(-1), true, 'the header must know the newly added account has not been saved')
  assert.equal(saves.length, 0, 'an incomplete account must not overwrite the saved account list')
  const select = view.find(view.render(), node => node.type === 'select')
  select.props.onChange({ target: { value: 'qq' } })
  assert.equal(states.at(-1), false)
  assert.equal(saves.length, 1)
})

test('an incomplete server preset also reports unsaved edits', () => {
  const states = [], saves = []
  const view = editor('ServerPresetsEditor', {
    presets: { builtin: {}, custom: {} },
    onDraftStatus: blocked => states.push(blocked),
    onAutoSave: text => saves.push(text),
  })
  view.find(view.render(), node => node.type === 'button' && node.children.some(value => typeof value === 'string' && value.includes('添加预设'))).props.onClick()
  assert.equal(states.at(-1), true)
  assert.equal(saves.length, 0)
})

test('testing a card without its own email address asks for the field before calling the backend', async () => {
  for (const user of ['', '   ']) {
    const calls = []
    const view = editor('AccountCardsEditor', {
      detail: { list: [{ name: 'draft', provider: 'gmail', user }] },
      onTest: async (...args) => { calls.push(args); return { ms: 1, imapHost: 'imap.gmail.com', imapPort: 993 } },
    })
    const button = view.find(view.render(), node => node.type === 'button' && node.children.includes('测试连接'))
    await button.props.onClick()
    assert.equal(calls.length, 0, 'an empty card must not test inherited or stale form credentials')
    assert.ok(view.find(view.render(), node => node.children.some(value => typeof value === 'string' && /请先填写.*邮箱地址/.test(value))), 'the card identifies the field the user must fill')
  }
})

test('testing a filled card still delegates when its saved password is hidden from the editor', async () => {
  const calls = []
  const view = editor('AccountCardsEditor', {
    detail: { list: [{ name: 'work', provider: 'gmail', user: 'fixture@gmail.com', hasPassword: true }] },
    onTest: async (...args) => { calls.push(args); return { ms: 1, imapHost: 'imap.gmail.com', imapPort: 993 } },
  })
  const button = view.find(view.render(), node => node.type === 'button' && node.children.includes('测试连接'))
  await button.props.onClick()
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], 'work')
  assert.equal(calls[0][1][0].user, 'fixture@gmail.com')
  assert.ok(view.find(view.render(), node => node.children.some(value => typeof value === 'string' && /连接成功/.test(value))))
})

test('switching a card to Outlook shows the built-in application from the new snapshot', () => {
  const props = {
    detail: { list: [{ name: 'work', provider: 'gmail', user: 'fixture@gmail.com', hasPassword: true }] },
    onAutoSave() {},
  }
  const view = editor('AccountCardsEditor', props)
  view.find(view.render(), node => node.type === 'button' && node.children.includes('编辑')).props.onClick()
  view.find(view.render(), node => node.type === 'select').props.onChange({ target: { value: 'outlook' } })
  const application = 'fixture-public-client-id'
  props.detail = { list: [{ name: 'work', provider: 'outlook', user: 'fixture@gmail.com', authKind: 'oauth2', oauthDefaultClientId: application }] }
  const panel = view.find(view.render(), node => typeof node.type === 'function' && node.type.name === 'OauthLoginPanel')
  assert.ok(panel)
  const rendered = panel.type(panel.props)
  assert.ok(view.find(rendered, node => node.type === 'input' && node.props.placeholder === application))
  assert.equal(view.find(rendered, node => node.children.some(value => typeof value === 'string' && /当前构建没有内置/.test(value))), undefined, 'saving must refresh the login metadata without resetting user edits')
})

test('a stored separate login password is acknowledged without putting it in the input', () => {
  const view = editor('AccountCardsEditor', {
    detail: { list: [{ name: 'alias', provider: 'gmail', user: 'fixture@gmail.com', hasAuthPassword: true }] },
  })
  view.find(view.render(), node => node.type === 'button' && node.children.includes('编辑')).props.onClick()
  const rendered = view.render()
  assert.ok(view.find(rendered, node => node.children.some(value => typeof value === 'string' && /已存有登录密码/.test(value))))
  assert.equal(view.find(rendered, node => node.type === 'input' && node.props.type === 'password' && node.props.value !== ''), undefined)
})
