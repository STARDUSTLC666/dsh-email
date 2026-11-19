import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveHostPrimitives } from '../templates/style-switcher.js'

const react = () => ({ createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) })

// React reconciles by component type. Changing Modal's wrapper function on a
// draft edit unmounts its input subtree and runs the host's initial autofocus.
test('draft edits retain the same host Modal and Menu component types', () => {
  const React = react()
  const host = { Modal() {}, Menu() {}, Input() {}, Button() {} }
  let lookups = 0
  const requireHost = name => {
    assert.equal(name, '@deepseek-ai/dsh-client-ui-primitives')
    lookups++
    return host
  }
  const initial = resolveHostPrimitives(React, requireHost)
  for (let edit = 0; edit < 5; edit++) {
    const next = resolveHostPrimitives(React, requireHost)
    assert.equal(next.Modal, initial.Modal, 'an edited draft must not remount its modal or reset focus')
    assert.equal(next.Menu, initial.Menu)
    assert.equal(next.Input, initial.Input)
  }
  assert.equal(lookups, 6, 'host lookup stays lazy and runs on the render path')
})

test('fallback controls retain component identity between renders', () => {
  const React = react()
  const initial = resolveHostPrimitives(React, () => { throw new Error('host not loaded') })
  const next = resolveHostPrimitives(React, () => undefined)
  assert.equal(initial.isFallback, true)
  for (const name of ['Modal', 'Menu', 'Input', 'Button', 'Checkbox', 'Switch', 'SegmentedControl']) {
    assert.equal(next[name], initial[name], `${name} must not remount on a form update`)
  }
})

test('a late or replaced host remains discoverable and React runtimes stay isolated', () => {
  const React = react()
  let host
  const requireHost = () => host
  const fallback = resolveHostPrimitives(React, requireHost)
  host = { Modal() {}, Menu() {} }
  const mounted = resolveHostPrimitives(React, requireHost)
  assert.equal(mounted.isFallback, false)
  assert.notEqual(mounted.Modal, fallback.Modal)
  assert.equal(mounted.Modal, resolveHostPrimitives(React, requireHost).Modal)
  const originalHost = host
  const previous = mounted.Modal
  host = undefined
  assert.equal(resolveHostPrimitives(React, requireHost).Modal, fallback.Modal, 'unload restores the fallback')
  host = originalHost
  assert.equal(resolveHostPrimitives(React, requireHost).Modal, previous, 'remount reuses the matching host adapter')
  host = { Modal() {}, Menu() {} }
  assert.notEqual(resolveHostPrimitives(React, requireHost).Modal, previous)
  assert.notEqual(resolveHostPrimitives(react(), requireHost).Modal, resolveHostPrimitives(React, requireHost).Modal)
})
