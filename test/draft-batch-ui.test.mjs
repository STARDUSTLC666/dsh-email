import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

function mountDraftWorkbench({ initialDrafts, onDeleteMany, cached = null } = {}) {
  const source = readFileSync(new URL('../templates/panels/drafts.js', import.meta.url), 'utf8')
    .replace('let draftUiCache = null;', `let draftUiCache = ${cached ? JSON.stringify(cached) : 'null'};`)
    .replace('async function draftApi(', 'async function _unusedDraftApi(') + '\nthis.DraftWorkbench = DraftWorkbench;'

  let drafts = structuredClone(initialDrafts)
  const slots = []
  const pendingUpdates = []
  const effects = []
  const calls = []
  let cursor = 0
  let dirty = false
  let view = null
  const selectAllInput = { indeterminate: false }

  const h = (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) })
  const useState = initial => {
    const index = cursor++
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
    return [slots[index], value => {
      pendingUpdates.push({ index, value })
      dirty = true
    }]
  }
  const useRef = initial => {
    const index = cursor++
    return slots[index] ??= { current: initial }
  }
  const useEffect = (fn, deps) => {
    const index = cursor++
    const previous = slots[index]
    if (!previous || !deps || deps.some((value, n) => !Object.is(value, previous.deps?.[n]))) {
      previous?.cleanup?.()
      slots[index] = { deps }
      effects.push(() => { slots[index].cleanup = fn() })
    }
  }
  const W = new Proxy({}, { get: (_target, key) => String(key) })
  const css = new Proxy({}, { get: (_target, key) => String(key) })

  const sandbox = {
    h,
    W,
    React: { Fragment: 'Fragment', useId: () => 'draft-id', useMemo: fn => fn() },
    useState,
    useRef,
    useEffect,
    AbortController,
    setTimeout: fn => ({ fn }),
    clearTimeout() {},
    window: { addEventListener() {}, removeEventListener() {} },
    __stardustUpdatesGuard() {},
    useContactBook() {},
    contactLabelOf: value => value,
    formatDate: value => value,
    emailUi: { richEmailBody: () => ({ nodes: [], images: [] }) },
    renderMailNodes: () => null,
    RecipientField: 'RecipientField',
    dt: (_zh, en) => en,
    t: key => key,
    emailError: err => err instanceof Error ? err.message : String(err),
    clsx: (...values) => values.filter(Boolean).join(' '),
    draftCss: css,
    mailCss: css,
    uiCss: css,
    async draftApi(action, payload = {}) {
      calls.push({ action, payload })
      if (action === 'list') return { drafts: structuredClone(drafts), accounts: ['default'], attachmentLimits: {}, attachmentLimit: 20 * 1024 * 1024 }
      if (action === 'rules') return { accounts: ['default'], revision: 1, policies: {} }
      if (action === 'deleteMany') {
        if (onDeleteMany) {
          const result = await onDeleteMany(payload, next => { drafts = next }, drafts)
          return result
        }
        const removed = payload.items.map(item => item.id)
        const removedSet = new Set(removed)
        drafts = drafts.filter(d => !removedSet.has(d.id))
        return { removed, skipped: [] }
      }
      throw new Error('Unexpected action: ' + action)
    },
  }
  runInNewContext(source, sandbox)

  function findAll(node, predicate, out = []) {
    if (!node || typeof node !== 'object') return out
    if (predicate(node)) out.push(node)
    if (node.props?.footer) findAll(node.props.footer, predicate, out)
    for (const child of node.children || []) findAll(child, predicate, out)
    return out
  }

  function textOf(node) {
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (!node || typeof node !== 'object') return ''
    return (node.children || []).map(textOf).join('')
  }

  function render() {
    while (pendingUpdates.length > 0) {
      const { index, value } = pendingUpdates.shift()
      slots[index] = typeof value === 'function' ? value(slots[index]) : value
    }
    cursor = 0
    dirty = false
    view = sandbox.DraftWorkbench({ active: true, defaultAccount: 'default', composeRequest: null, onComposeFinished() {} })
    // Attach the simulated DOM node to the selectAllRef span so indeterminate updates run.
    const refHost = findAll(view, n => n.type === 'span' && n.props.ref)[0]
    if (refHost) refHost.props.ref.current = { querySelector: () => selectAllInput }
  }

  async function flush() {
    for (let round = 0; round < 12; round++) {
      const queued = effects.splice(0)
      for (const fn of queued) fn()
      await new Promise(resolve => setImmediate(resolve))
      if (dirty) render()
      if (!effects.length && !dirty) break
    }
  }

  render()
  return {
    flush,
    render,
    calls,
    selectAllInput,
    getView: () => view,
    findAll: predicate => findAll(view, predicate),
    textOf,
  }
}

const makeDraft = (n, extra = {}) => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  revision: 1,
  account: 'default',
  to: `u${n}@example.test`,
  cc: '',
  subject: `Draft ${n}`,
  text: `Body ${n}`,
  attachments: [],
  state: 'draft',
  createdAt: '2026-11-26T00:00:00.000Z',
  updatedAt: '2026-11-26T00:00:00.000Z',
  ...extra,
})

test('DraftWorkbench supports indeterminate select-all, Shift+Click range selection, sending guard and full batch deletion', async () => {
  const initialDrafts = [
    makeDraft(1),
    makeDraft(2, { state: 'scheduled', sendAt: '2026-11-27T00:00:00.000Z' }),
    makeDraft(3, { state: 'sending' }),
    makeDraft(4),
    makeDraft(5),
    makeDraft(6),
    makeDraft(7),
  ]
  const ui = mountDraftWorkbench({ initialDrafts })
  await ui.flush()

  // Sending draft checkbox must be disabled; delete button disabled when nothing checked.
  const checkboxes = ui.findAll(n => n.type === 'Checkbox')
  assert.equal(checkboxes.length, 8, '1 select-all + 7 draft checkboxes')
  assert.equal(checkboxes[0].props.checked, false)
  assert.equal(checkboxes[3].props.disabled, true, 'sending draft #3 must not be selectable')
  assert.equal(ui.selectAllInput.indeterminate, false)

  // Check draft #1 -> select-all enters indeterminate state.
  checkboxes[1].props.onChange(true)
  await ui.flush()
  assert.equal(ui.selectAllInput.indeterminate, true)

  // Shift+Click draft #6 -> selects #1, #2, #4, #5, #6 while skipping sending draft #3.
  const rowSpans = ui.findAll(n => n.type === 'span' && typeof n.props.onClickCapture === 'function')
  rowSpans[5].props.onClickCapture({ shiftKey: true })
  ui.findAll(n => n.type === 'Checkbox')[6].props.onChange(true)
  await ui.flush()
  const checkedRows = ui.findAll(n => n.type === 'div' && n.props['data-checked'] === 'true')
  assert.equal(checkedRows.length, 5)

  // Select all selects all 6 deletable drafts and clears indeterminate.
  ui.findAll(n => n.type === 'Checkbox')[0].props.onChange(true)
  await ui.flush()
  assert.equal(ui.selectAllInput.indeterminate, false)
  assert.equal(ui.findAll(n => n.type === 'Checkbox')[0].props.checked, true)

  // Open batch delete confirmation dialog.
  const deleteBtn = ui.findAll(n => n.type === 'Button' && ui.textOf(n).includes('Delete selected (6)'))[0]
  assert.ok(deleteBtn)
  deleteBtn.props.onClick()
  await ui.flush()

  const dialog = ui.findAll(n => n.type === 'Dialog' && n.props.title === 'Delete selected local drafts')[0]
  assert.ok(dialog)
  const dialogText = ui.textOf(dialog)
  assert.match(dialogText, /Includes scheduled drafts/)
  assert.match(dialogText, /And 1 more drafts/, 'preview caps at 5 items and summarizes the rest')

  // Confirm deletion -> sends deleteMany with all 6 deletable items and updates list + success notice.
  const confirmBtn = ui.findAll(n => n.type === 'Button' && ui.textOf(n).includes('Confirm delete (6)'))[0]
  assert.ok(confirmBtn)
  await confirmBtn.props.onClick()
  await ui.flush()

  const batchCall = ui.calls.find(c => c.action === 'deleteMany')
  assert.ok(batchCall)
  assert.equal(batchCall.payload.confirmed, true)
  assert.equal(batchCall.payload.items.length, 6)
  assert.ok(!batchCall.payload.items.some(i => i.id === initialDrafts[2].id), 'sending draft excluded')

  const status = ui.findAll(n => n.type === 'Status' && n.props.tone === 'success')[0]
  assert.ok(status)
  assert.match(ui.textOf(status), /Deleted 6 local drafts/)
  assert.equal(ui.findAll(n => n.type === 'div' && n.props['data-dsh-row'] !== undefined).length, 1, 'only sending draft remains')
})

test('DraftWorkbench warns on unsaved edits, handles partial skip and keeps dialog open on error', async () => {
  const d1 = makeDraft(1)
  const d2 = makeDraft(2)
  let failOnce = true
  const ui = mountDraftWorkbench({
    initialDrafts: [d1, d2],
    cached: {
      selected: d1,
      form: { account: 'default', to: d1.to, cc: '', subject: 'Unsaved subject change', text: d1.text, html: '', sendAt: '', attachments: [] },
    },
    async onDeleteMany(payload, setDrafts, current) {
      if (failOnce) { failOnce = false; throw new Error('disk temporarily busy') }
      // Simulate d1 deleted, d2 skipped due to conflict.
      setDrafts(current.filter(d => d.id !== d1.id))
      return { removed: [d1.id], skipped: [{ id: d2.id, reason: 'conflict' }] }
    },
  })
  await ui.flush()

  // Select both and open dialog -> unsaved edits warning must appear.
  ui.findAll(n => n.type === 'Checkbox')[0].props.onChange(true)
  await ui.flush()
  ui.findAll(n => n.type === 'Button' && ui.textOf(n).includes('Delete selected (2)'))[0].props.onClick()
  await ui.flush()

  let dialog = ui.findAll(n => n.type === 'Dialog' && n.props.title === 'Delete selected local drafts')[0]
  assert.match(ui.textOf(dialog), /unsaved edits/)

  // First attempt fails -> dialog stays open with error banner and selection preserved.
  await ui.findAll(n => n.type === 'Button' && ui.textOf(n).includes('Confirm delete (2)'))[0].props.onClick()
  await ui.flush()
  dialog = ui.findAll(n => n.type === 'Dialog' && n.props.title === 'Delete selected local drafts')[0]
  assert.ok(dialog, 'dialog stays open on request failure')
  assert.match(ui.textOf(dialog), /disk temporarily busy/)

  // Retry succeeds partially -> dialog closes, warning banner explains partial skip, deleted dirty draft is cleared.
  await ui.findAll(n => n.type === 'Button' && ui.textOf(n).includes('Confirm delete (2)'))[0].props.onClick()
  await ui.flush()
  assert.equal(ui.findAll(n => n.type === 'Dialog' && n.props.title === 'Delete selected local drafts').length, 0)
  const warn = ui.findAll(n => n.type === 'Status' && n.props.tone === 'warn')[0]
  assert.ok(warn)
  assert.match(ui.textOf(warn), /Deleted 1 local drafts; 1 skipped/)
  // Deleted dirty draft #1 was cleared, so remaining draft #2 is not marked Unsaved.
  assert.doesNotMatch(ui.textOf(ui.getView()), /Unsaved/)
})
