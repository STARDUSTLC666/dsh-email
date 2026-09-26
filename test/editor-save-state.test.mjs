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
