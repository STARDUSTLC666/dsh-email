import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

// Execute the workbench's actual hooks and callbacks without mounting the host
// chrome. Child components stay opaque so assertions concern state and requests.
function workbench({ refuseRead = false } = {}) {
  const template = readFileSync(new URL('../templates/panels/mailbox.js', import.meta.url), 'utf8')
  const source = template.slice(template.indexOf('function MailboxWorkbench(')) + '\nthis.Workbench = MailboxWorkbench;'
  const slots = [], effects = [], calls = []
  let cursor = 0, dirty = false, view, undo
  const folders = new Map([
    ['INBOX', [{ uid: 1, seen: false }]],
    ['Work', [{ uid: 7, seen: false }, { uid: 8, seen: false }]],
    ['Trash', []],
  ])
  const h = (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) })
  const state = initial => {
    const index = cursor++
    if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
    return [slots[index], value => {
      const next = typeof value === 'function' ? value(slots[index]) : value
      if (!Object.is(slots[index], next)) { slots[index] = next; dirty = true }
    }]
  }
  const W = new Proxy({ useResizableSplit: () => ({ size: 224, resizerProps: {} }) }, { get: (target, key) => target[key] || String(key) })
  const css = new Proxy({}, { get: (_target, key) => String(key) })
  const sandbox = {
    W, h, React: { Fragment: 'Fragment' }, useState: state,
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial } },
    useEffect(fn, deps) {
      const index = cursor++, previous = slots[index]
      if (!previous || deps.some((value, n) => !Object.is(value, previous.deps[n]))) {
        previous?.cleanup?.(); slots[index] = { deps }; effects.push(() => { slots[index].cleanup = fn() })
      }
    },
    AbortController, setTimeout: fn => ({ fn }), clearTimeout() {}, requestAnimationFrame: fn => fn(),
    __stardustUpdatesGuard() {}, dt: (_zh, en) => en, emailError: error => String(error), formatDate: () => '',
    clsx: (...values) => values.filter(Boolean).join(' '), mailCss: css, uiCss: css, moveMailSpotlight() {},
    MailFolderRail: 'MailFolderRail', MailMessage: 'MailMessage', MailWorkflowBar: 'MailWorkflowBar',
    MailTrashDialog: 'MailTrashDialog', MailFoldersDialog: 'MailFoldersDialog',
    async mailboxApi(action, payload = {}) {
      calls.push({ action, ...payload })
      if (action === 'accounts') return { accounts: [{ name: 'default', incoming: 'imap', trashSupported: true }], defaultAccount: 'default' }
      if (action === 'folders') return { folders: [...folders].map(([path, rows]) => ({
        name: path, path, specialUse: path === 'INBOX' ? '\\Inbox' : path === 'Trash' ? '\\Trash' : '', unseen: rows.filter(row => !row.seen).length,
      })) }
      if (action === 'list') return { count: folders.get(payload.folder).length,
        messages: folders.get(payload.folder).map(row => ({ ...row, from: [], date: '', subject: 'Message ' + row.uid })) }
      if (action === 'read') {
        const row = folders.get(payload.folder).find(row => row.uid === payload.uid)
        const markedRead = !refuseRead && !row.seen
        if (markedRead) row.seen = true
        return { uid: row.uid, seen: row.seen, ...(markedRead ? { markedRead: true } : {}), text: 'body' }
      }
      if (action === 'trashConfirm') {
        const rows = folders.get(payload.folder), row = rows.find(row => row.uid === 8)
        folders.set(payload.folder, rows.filter(candidate => candidate !== row)); folders.get('Trash').push(row)
        undo = { row, source: payload.folder }
        return { count: 1, target: 'Trash', undo: 'one-use-undo', undoExpires: Date.now() + 300000 }
      }
      if (action === 'undoTrash') {
        assert.equal(payload.folder, 'Trash')
        folders.set('Trash', []); folders.get(undo.source).push(undo.row)
        return { count: 1, target: undo.source }
      }
      throw new Error('Unexpected fixture action: ' + action)
    },
  }
  runInNewContext(source, sandbox)
  function findAll(node, predicate, out = []) {
    if (!node || typeof node !== 'object') return out
    if (predicate(node)) out.push(node)
    for (const child of node.children || []) findAll(child, predicate, out)
    return out
  }
  const find = predicate => {
    const node = findAll(view, predicate)[0]
    assert.ok(node, 'Expected workbench element was not rendered')
    return node
  }
  async function settle() {
    for (let n = 0; n < 30; n++) {
      cursor = 0; dirty = false; view = sandbox.Workbench({ active: true })
      while (effects.length) effects.shift()()
      await new Promise(resolve => setImmediate(resolve))
      if (!dirty && !effects.length) return
    }
    assert.fail('Workbench effects did not settle; possible request loop')
  }
  const rail = () => find(node => node.type === 'MailFolderRail').props
  return { settle, find, calls, folders, rail,
    count: action => calls.filter(call => call.action === action).length,
    unseen: path => rail().folders.find(row => row.path === path).unseen,
    open: uid => find(node => node.props.className === 'messageRow' && node.props.key === uid).children
      .find(node => node?.props?.className === 'messageButton').props.onClick({ currentTarget: { focus() {} } }),
    trash: uid => find(node => node.props.className === 'messageRow' && node.props.key === uid).children
      .flatMap(node => node?.children || []).find(node => node?.props?.label === 'Move to Trash').props.onClick(),
  }
}

test('automatic read updates the selected folder count once without a folder/list request loop', async () => {
  const ui = workbench()
  await ui.settle()
  ui.rail().onFolder('Work'); await ui.settle()
  assert.equal(ui.unseen('Work'), 2)
  const before = { folders: ui.count('folders'), list: ui.count('list') }
  ui.open(7); await ui.settle()
  assert.equal(ui.unseen('Work'), 1)
  assert.equal(ui.unseen('INBOX'), 1)
  assert.equal(ui.rail().folder, 'Work')
  assert.equal(ui.count('folders'), before.folders)
  assert.equal(ui.count('list'), before.list)
  assert.equal(ui.count('read'), 1)
  assert.equal(ui.find(node => node.props.className === 'messageRow' && node.props.key === 7).props['data-unread'], false)
  assert.equal(ui.find(node => node.type === 'MailMessage').props.selected, 7)
})

test('a refused read mutation keeps the unread dot and selected folder badge', async () => {
  const ui = workbench({ refuseRead: true })
  await ui.settle(); ui.rail().onFolder('Work'); await ui.settle()
  ui.open(7); await ui.settle()
  assert.equal(ui.unseen('Work'), 2)
  assert.equal(ui.find(node => node.props.className === 'messageRow' && node.props.key === 7).props['data-unread'], true)
  assert.equal(ui.find(node => node.type === 'MailMessage').props.detail.text, 'body')
})

test('move, undo and explicit refresh each reload folder counts once and preserve the selected folder', async () => {
  const ui = workbench()
  await ui.settle(); ui.rail().onFolder('Work'); await ui.settle()
  const before = { folders: ui.count('folders'), list: ui.count('list') }
  ui.trash(8); await ui.settle()
  await ui.find(node => node.type === 'MailTrashDialog').props.onConfirm({ id: 'preview' })
  await ui.settle()
  assert.equal(ui.unseen('Work'), 1); assert.equal(ui.unseen('Trash'), 1)
  assert.equal(ui.rail().folder, 'Work')
  assert.equal(ui.count('folders'), before.folders + 1); assert.equal(ui.count('list'), before.list + 1)
  await ui.find(node => node.type === 'Button' && node.children.includes('Undo move')).props.onClick()
  await ui.settle()
  assert.equal(ui.unseen('Work'), 2); assert.equal(ui.unseen('Trash'), 0)
  assert.equal(ui.rail().folder, 'Work')
  assert.equal(ui.count('folders'), before.folders + 2); assert.equal(ui.count('list'), before.list + 2)
  ui.folders.get('Work')[0].seen = true
  ui.find(node => node.props.label === 'Refresh mail').props.onClick(); await ui.settle()
  assert.equal(ui.unseen('Work'), 1)
  assert.equal(ui.rail().folder, 'Work')
  assert.equal(ui.count('folders'), before.folders + 3); assert.equal(ui.count('list'), before.list + 3)
  assert.ok(ui.calls.filter(call => call.action === 'folders').every(call => call.refresh === true))
})

test('folder management reload retains an existing selection and falls back only when it disappears', async () => {
  const ui = workbench()
  await ui.settle(); ui.rail().onFolder('Work'); await ui.settle()
  ui.rail().onManage(); await ui.settle()
  ui.find(node => node.type === 'MailFoldersDialog').props.onChanged(); await ui.settle()
  assert.equal(ui.rail().folder, 'Work')
  const before = ui.count('list')
  ui.folders.delete('Work')
  ui.find(node => node.type === 'MailFoldersDialog').props.onChanged(); await ui.settle()
  assert.equal(ui.rail().folder, 'INBOX')
  assert.equal(ui.count('list'), before + 1)
})
