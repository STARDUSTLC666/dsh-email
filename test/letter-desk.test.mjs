import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const BUNDLE_URL = new URL('../lib/client.js', import.meta.url)

const settle = async () => {
  for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve))
}

function createStatefulHarness({
  reducedMotion = false,
  withViewTransition = true,
  accounts = [{ name: 'work', user: 'me@example.test', incoming: 'imap', trashSupported: true }],
  folders = [
    { name: 'INBOX', path: 'INBOX', specialUse: '\\Inbox', subscribed: true },
    { name: 'Archive', path: 'Archive', specialUse: '', subscribed: true },
  ],
  messages = [
    {
      uid: 101,
      date: '2026-11-20T09:30:00.000Z',
      from: [{ name: 'Alice Lin', address: 'alice@example.test' }],
      subject: '第一封：Q4 设计评审纪要',
      preview: '请查收最新的实体书信桌交互方案与评审清单。',
      seen: false,
      flagged: true,
      size: 18432,
      hasAttachments: true,
    },
    {
      uid: 102,
      date: '2026-11-19T14:15:00.000Z',
      from: [{ name: 'Bob Zhang', address: 'bob@example.test' }],
      subject: '第二封：发行日历确认',
      seen: true,
      flagged: false,
      size: 6144,
      hasAttachments: false,
    },
    {
      uid: 103,
      date: '2026-11-18T08:00:00.000Z',
      from: [{ name: 'Carol Wu', address: 'carol@example.test' }],
      subject: '第三封：测试环境凭证',
      seen: false,
      flagged: false,
      size: 4096,
      hasAttachments: false,
    },
  ],
  readDetails = {
    101: {
      account: 'work',
      folder: 'INBOX',
      uid: 101,
      date: '2026-11-20T09:30:00.000Z',
      from: [{ name: 'Alice Lin', address: 'alice@example.test' }],
      to: [{ name: 'Me', address: 'me@example.test' }],
      cc: [{ name: 'Design Team', address: 'design@example.test' }],
      subject: '第一封：Q4 设计评审纪要',
      text: '完整正文：实体书信分拣桌已就绪，请审阅附件中的 PDF。',
      rawHeaders: 'From: Alice Lin <alice@example.test>\nTo: Me <me@example.test>\nMessage-ID: <101@example.test>',
      attachments: [{ filename: 'letter-desk-spec.pdf', contentType: 'application/pdf', size: 24576, part: '2' }],
      truncated: false,
    },
    102: {
      account: 'work',
      folder: 'INBOX',
      uid: 102,
      date: '2026-11-19T14:15:00.000Z',
      from: [{ name: 'Bob Zhang', address: 'bob@example.test' }],
      to: [{ name: 'Me', address: 'me@example.test' }],
      cc: [],
      subject: '第二封：发行日历确认',
      text: '完整正文：周五上午同步最终日程。',
      attachments: [],
      truncated: false,
    },
  },
} = {}) {
  const storage = new Map()
  const focusLog = []
  const viewTransitions = []
  const rpcLog = []
  const createdDrafts = []
  const rafQueue = []

  // Minimal per-instance React hooks runtime keyed by component tree path.
  const hookTable = new Map()
  const mountedPaths = new Set()
  const pendingEffects = []
  let activePath = ''
  let hookCursor = 0
  let idCounter = 0

  function getSlot(path, idx, init) {
    let list = hookTable.get(path)
    if (!list) {
      list = []
      hookTable.set(path, list)
    }
    if (idx >= list.length) list.push(init())
    return list[idx]
  }

  function depsChanged(prev, next) {
    if (!prev || !next) return true
    if (prev.length !== next.length) return true
    for (let i = 0; i < prev.length; i++) {
      if (!Object.is(prev[i], next[i])) return true
    }
    return false
  }

  const React = {
    Fragment: Symbol.for('react.fragment'),
    createElement(type, props, ...children) {
      const flat = children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false)
      return { type, props: props || {}, children: flat }
    },
    Children: {
      toArray(items) {
        return Array.isArray(items) ? items : items ? [items] : []
      },
    },
    useState(initial) {
      const idx = hookCursor++
      const path = activePath
      const slot = getSlot(path, idx, () => ({
        value: typeof initial === 'function' ? initial() : initial,
      }))
      const setState = next => {
        slot.value = typeof next === 'function' ? next(slot.value) : next
      }
      return [slot.value, setState]
    },
    useRef(initial) {
      const idx = hookCursor++
      return getSlot(activePath, idx, () => ({ current: initial }))
    },
    useMemo(factory, deps) {
      const idx = hookCursor++
      const slot = getSlot(activePath, idx, () => ({ deps: null, value: undefined }))
      if (depsChanged(slot.deps, deps)) {
        slot.value = factory()
        slot.deps = deps
      }
      return slot.value
    },
    useCallback(fn, deps) {
      return React.useMemo(() => fn, deps)
    },
    useId() {
      const idx = hookCursor++
      return getSlot(activePath, idx, () => ':r' + (++idCounter) + ':')
    },
    useEffect(fn, deps) {
      const idx = hookCursor++
      const slot = getSlot(activePath, idx, () => ({ deps: null, cleanup: null }))
      if (depsChanged(slot.deps, deps)) {
        slot.deps = deps
        pendingEffects.push({ slot, fn })
      }
    },
    useLayoutEffect(fn, deps) {
      React.useEffect(fn, deps)
    },
  }

  function makeDomStub(tag, props) {
    const label = props['data-email-fold-back'] ? 'fold-back-btn'
      : props['data-letter-card'] === 'active' ? 'active-letter-card:' + props['data-letter-uid']
      : props['data-letter-sheet'] ? 'stationery-sheet'
      : tag
    return {
      tagName: String(tag).toUpperCase(),
      label,
      props,
      focused: false,
      capturedPointers: [],
      releasedPointers: [],
      focus(opts) {
        this.focused = true
        focusLog.push({ label, opts })
      },
      setPointerCapture(id) {
        this.capturedPointers.push(id)
      },
      releasePointerCapture(id) {
        this.releasedPointers.push(id)
      },
      getClientRects() { return [] },
      querySelector() { return null },
    }
  }

  const fakeDocument = {
    querySelectorAll() { return [] },
    ...(withViewTransition ? {
      startViewTransition(cb) {
        viewTransitions.push(Date.now())
        cb()
        return { finished: Promise.resolve() }
      },
    } : {}),
  }

  const fakeWindow = {
    CustomEvent: class { constructor(type, init = {}) { this.type = type; this.detail = init.detail } },
    localStorage: {
      getItem: k => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, String(v)),
    },
    matchMedia: q => ({
      matches: reducedMotion && String(q).includes('prefers-reduced-motion: reduce'),
      addEventListener() {},
      removeEventListener() {},
    }),
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true },
    document: fakeDocument,
  }

  const source = readFileSync(BUNDLE_URL, 'utf8').replace(
    'return module.exports;',
    'module.exports.__deskProbe = { MailboxWorkbench, EMAIL_CSS, W, mailCss }; return module.exports;',
  )

  let client
  runInNewContext(source, {
    window: Object.assign(fakeWindow, {
      __ModuleLoader__: {
        load({ factory }) {
          client = factory(name => {
            if (name === 'react') return React
            throw new Error('Unexpected module: ' + name)
          })
        },
      },
    }),
    document: fakeDocument,
    AbortController,
    setTimeout,
    clearTimeout,
    requestAnimationFrame(fn) {
      rafQueue.push(fn)
      return rafQueue.length
    },
    cancelAnimationFrame() {},
    async fetch(_url, options) {
      const payload = JSON.parse(options.body)
      rpcLog.push(payload)
      let value
      if (payload.action === 'accounts') {
        value = { accounts, defaultAccount: accounts[0]?.name || '' }
      } else if (payload.action === 'folders') {
        value = { account: payload.account, folders }
      } else if (payload.action === 'list') {
        value = { account: payload.account, folder: payload.folder, uidValidity: 42, count: messages.length, hasMore: false, messages }
      } else if (payload.action === 'read') {
        value = readDetails[payload.uid] || {
          account: payload.account,
          folder: payload.folder,
          uid: payload.uid,
          date: '2026-11-18T08:00:00.000Z',
          from: [{ name: 'Sender', address: 's@example.test' }],
          to: [{ name: 'Me', address: 'me@example.test' }],
          cc: [],
          subject: 'Fallback detail',
          text: 'Body text for ' + payload.uid,
          attachments: [],
          truncated: false,
        }
      } else if (payload.action === 'replyDraft') {
        value = { id: 'draft-' + payload.uid + (payload.replyAll ? '-all' : '') }
      } else if (payload.action === 'mark') {
        value = { ok: true }
      } else if (payload.action === 'contacts') {
        value = { contacts: [] }
      } else {
        throw new Error('Unhandled RPC: ' + payload.action)
      }
      return { ok: true, json: async () => ({ ok: true, value }) }
    },
  })

  const { MailboxWorkbench, EMAIL_CSS, W, mailCss } = client.__deskProbe
  let rootTree = null

  function renderNode(node, path) {
    if (node === null || node === undefined || typeof node !== 'object') return node
    if (node.type === React.Fragment) {
      return {
        type: React.Fragment,
        props: {},
        children: (node.children || []).map((child, idx) => renderNode(child, path + '.f' + idx)),
      }
    }
    if (typeof node.type === 'function') {
      const key = node.props?.key !== undefined ? String(node.props.key) : ''
      const compPath = path + '/' + (node.type.name || 'fn') + (key ? '#' + key : '')
      mountedPaths.add(compPath)
      const prevPath = activePath
      const prevCursor = hookCursor
      activePath = compPath
      hookCursor = 0
      const out = node.type({
        ...node.props,
        children: node.children.length === 0 ? undefined : node.children.length === 1 ? node.children[0] : node.children,
      })
      activePath = prevPath
      hookCursor = prevCursor
      return renderNode(out, compPath)
    }
    const stub = makeDomStub(node.type, node.props)
    if (node.props?.ref) {
      if (typeof node.props.ref === 'function') node.props.ref(stub)
      else if (typeof node.props.ref === 'object') node.props.ref.current = stub
    }
    return {
      type: node.type,
      props: node.props,
      dom: stub,
      children: (node.children || []).map((child, idx) => renderNode(child, path + '.' + idx)),
    }
  }

  function renderOnce() {
    mountedPaths.clear()
    pendingEffects.length = 0
    rootTree = renderNode(
      React.createElement(MailboxWorkbench, {
        active: true,
        onConfigure() {},
        onDraft: id => createdDrafts.push(id),
        onAccountChange() {},
      }),
      'root',
    )
    // Cleanup unmounted component hooks
    for (const path of [...hookTable.keys()]) {
      if (!mountedPaths.has(path)) {
        for (const slot of hookTable.get(path)) {
          if (typeof slot?.cleanup === 'function') slot.cleanup()
        }
        hookTable.delete(path)
      }
    }
    const effectsToRun = pendingEffects.splice(0)
    for (const { slot, fn } of effectsToRun) {
      if (typeof slot.cleanup === 'function') slot.cleanup()
      const ret = fn()
      slot.cleanup = typeof ret === 'function' ? ret : null
    }
    while (rafQueue.length) {
      const cb = rafQueue.shift()
      cb()
    }
    return rootTree
  }

  async function flush(rounds = 4) {
    for (let i = 0; i < rounds; i++) {
      renderOnce()
      await settle()
    }
    return renderOnce()
  }

  function findAll(predicate, node = rootTree, acc = []) {
    if (!node || typeof node !== 'object') return acc
    if (predicate(node)) acc.push(node)
    for (const child of node.children || []) findAll(predicate, child, acc)
    return acc
  }

  function textOf(node) {
    if (node === null || node === undefined) return ''
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    return (node.children || []).map(textOf).join('')
  }

  return {
    EMAIL_CSS,
    mailCss,
    W,
    focusLog,
    viewTransitions,
    rpcLog,
    createdDrafts,
    renderOnce,
    flush,
    findAll,
    textOf,
    get tree() { return rootTree },
  }
}

test('Letter Desk (信桌) is the default landing mode with 3-deep physical stack, ribbon, counter, and no 3-pane rail', async () => {
  const h = createStatefulHarness()
  await h.flush()

  // Default mode is desk (信桌)
  assert.equal(h.tree.props['data-email-view'], 'desk')
  const desk = h.findAll(n => n.props?.['data-email-desk'] === 'true')[0]
  assert.ok(desk, 'Letter Desk canvas mounts by default')
  assert.equal(h.findAll(n => n.type === 'aside').length, 0, 'No Outlook 3-pane left rail in 信桌 mode')

  // Compact top ribbon keeps [data-tour="mail-filter"], counter, and segmented toggle; active card & stage expose tour anchors
  assert.equal(h.findAll(n => n.props?.['data-tour'] === 'mail-filter').length, 1)
  assert.equal(h.findAll(n => n.props?.['data-tour'] === 'mail-desk-stage').length, 1)
  assert.equal(h.findAll(n => n.props?.['data-tour'] === 'mail-letter-card').length, 1)
  const counter = h.findAll(n => n.props?.['data-desk-counter'] === 'true')[0]
  assert.ok(counter)
  assert.equal(h.textOf(counter), '待阅 3 封')

  const toggle = h.findAll(n => n.props?.['data-email-view-toggle'] === 'true')[0]
  assert.ok(toggle, 'Segmented view toggle renders in 信桌 mode')
  const deskBtn = h.findAll(n => n.props?.['data-view-option'] === 'desk', toggle)[0]
  const paneBtn = h.findAll(n => n.props?.['data-view-option'] === '3pane', toggle)[0]
  assert.equal(deskBtn.props['aria-pressed'], true)
  assert.equal(paneBtn.props['aria-pressed'], false)

  // Physical 3-deep stack: active layer 0 + 2 peeking layers behind
  const activeCard = h.findAll(n => n.props?.['data-letter-card'] === 'active')[0]
  const layer1 = h.findAll(n => n.props?.['data-letter-layer'] === '1')[0]
  const layer2 = h.findAll(n => n.props?.['data-letter-layer'] === '2')[0]
  assert.ok(activeCard && layer1 && layer2, '3 stacked letter card layers render')
  assert.equal(activeCard.props['data-letter-uid'], '101')
  assert.equal(layer1.props['data-letter-uid'], '102')
  assert.equal(layer2.props['data-letter-uid'], '103')

  // Subject uses editorial serif marker, snippet and attachment chip render
  const subjectNode = h.findAll(n => n.type === 'h2' && Object.hasOwn(n.props, 'data-dsh-serif'), activeCard)[0]
  assert.ok(subjectNode)
  assert.match(h.textOf(subjectNode), /第一封：Q4 设计评审纪要/)
  assert.match(h.textOf(activeCard), /实体书信桌交互方案/)
  assert.equal(h.findAll(n => n.props?.['data-letter-attachments'] === 'true', activeCard).length, 1)
})

test('Pointer drag (±90px) uses setPointerCapture, skips interactive descendants, fades stamps, skips left and unfolds right', async () => {
  const h = createStatefulHarness()
  await h.flush()

  let card = h.findAll(n => n.props?.['data-letter-card'] === 'active')[0]

  // Interactive descendant click must NOT initiate drag or capture pointer
  card.props.onPointerDown({
    pointerId: 7,
    pointerType: 'mouse',
    button: 0,
    clientX: 200,
    clientY: 100,
    target: { closest: sel => (String(sel).includes('button') ? {} : null) },
    currentTarget: card.dom,
  })
  h.renderOnce()
  assert.deepEqual(card.dom.capturedPointers, [], 'Dragging on interactive button is skipped')

  // Sub-threshold left drag (-50px) fades left stamp in, then snaps back on release
  const cardTarget = { closest: () => null }
  card.props.onPointerDown({ pointerId: 11, pointerType: 'mouse', button: 0, clientX: 200, clientY: 100, target: cardTarget, currentTarget: card.dom })
  card.props.onPointerMove({ pointerId: 11, clientX: 150, clientY: 106, currentTarget: card.dom })
  h.renderOnce()
  assert.deepEqual(card.dom.capturedPointers, [11])
  card = h.findAll(n => n.props?.['data-letter-card'] === 'active')[0]
  const leftStampMid = h.findAll(n => n.props?.['data-drag-stamp'] === 'left', card)[0]
  assert.ok(leftStampMid.props.style.opacity > 0 && leftStampMid.props.style.opacity < 1)
  assert.equal(leftStampMid.props['data-ready'], 'false')

  card.props.onPointerUp({ pointerId: 11, clientX: 150, clientY: 106, currentTarget: card.dom })
  h.renderOnce()
  assert.equal(h.findAll(n => n.props?.['data-letter-card'] === 'active')[0].props['data-letter-uid'], '101', 'Sub-90px drag springs back')

  // Past -90px left drag (-115px) marks ready and skips to next letter (UID 102)
  card = h.findAll(n => n.props?.['data-letter-card'] === 'active')[0]
  card.props.onPointerDown({ pointerId: 12, pointerType: 'mouse', button: 0, clientX: 260, clientY: 120, target: cardTarget, currentTarget: card.dom })
  card.props.onPointerMove({ pointerId: 12, clientX: 145, clientY: 125, currentTarget: card.dom })
  h.renderOnce()
  card = h.findAll(n => n.props?.['data-letter-card'] === 'active')[0]
  assert.equal(h.findAll(n => n.props?.['data-drag-stamp'] === 'left', card)[0].props['data-ready'], 'true')
  card.props.onPointerUp({ pointerId: 12, clientX: 145, clientY: 125, currentTarget: card.dom })
  h.renderOnce()
  assert.equal(h.findAll(n => n.props?.['data-letter-card'] === 'active')[0].props['data-letter-uid'], '102')
  assert.equal(h.textOf(h.findAll(n => n.props?.['data-desk-counter'] === 'true')[0]), '待阅 2 封')

  // Past +90px right drag (+110px) marks right stamp ready and unfolds letter 102 into centered stationery sheet
  card = h.findAll(n => n.props?.['data-letter-card'] === 'active')[0]
  card.props.onPointerDown({ pointerId: 13, pointerType: 'mouse', button: 0, clientX: 100, clientY: 120, target: cardTarget, currentTarget: card.dom })
  card.props.onPointerMove({ pointerId: 13, clientX: 210, clientY: 120, currentTarget: card.dom })
  h.renderOnce()
  card = h.findAll(n => n.props?.['data-letter-card'] === 'active')[0]
  assert.equal(h.findAll(n => n.props?.['data-drag-stamp'] === 'right', card)[0].props['data-ready'], 'true')
  card.props.onPointerUp({ pointerId: 13, clientX: 210, clientY: 120, currentTarget: card.dom })
  await h.flush()

  assert.equal(h.viewTransitions.length, 1, 'Right flick unfold uses document.startViewTransition()')
  const sheet = h.findAll(n => n.props?.['data-letter-sheet'] === 'true')[0]
  assert.ok(sheet, 'Centered stationery sheet unfolds on right flick')
  assert.match(h.textOf(sheet), /周五上午同步最终日程/)
})

test('3D flip (翻面看信封头) toggles envelope & protocol metadata cleanly (including POP3 metadata)', async () => {
  const h = createStatefulHarness({
    accounts: [{ name: 'popbox', user: 'pop@example.test', incoming: 'pop3', trashSupported: false }],
    messages: [{
      uid: 'pop3:abc123',
      date: '2026-11-21T10:00:00.000Z',
      from: [{ name: 'Postmaster', address: 'post@example.test' }],
      subject: 'POP3 信封头检查',
      seen: false,
      flagged: false,
      flagsSupported: false,
      size: 2048,
      hasAttachments: false,
    }],
  })
  await h.flush()

  let card = h.findAll(n => n.props?.['data-letter-card'] === 'active')[0]
  assert.equal(card.props['data-flipped'], 'false')

  const flipBtn = h.findAll(n => n.props?.['data-email-flip'] === 'true')[0]
  assert.ok(flipBtn)
  flipBtn.props.onClick()
  h.renderOnce()

  card = h.findAll(n => n.props?.['data-letter-card'] === 'active')[0]
  assert.equal(card.props['data-flipped'], 'true')
  const frontFace = h.findAll(n => n.props?.['data-letter-face'] === 'front', card)[0]
  const backFace = h.findAll(n => n.props?.['data-letter-face'] === 'back', card)[0]
  assert.equal(frontFace.props['aria-hidden'], 'true')
  assert.equal(backFace.props['aria-hidden'], undefined)
  const backText = h.textOf(backFace)
  assert.match(backText, /post@example\.test/)
  assert.match(backText, /pop@example\.test/)
  assert.match(backText, /pop3:abc123/)
  assert.match(backText, /POP3/)
  assert.match(backText, /POP3 不提供服务器已读/)

  // Flip back to front
  h.findAll(n => n.props?.['data-email-flip'] === 'true')[0].props.onClick()
  h.renderOnce()
  assert.equal(h.findAll(n => n.props?.['data-letter-card'] === 'active')[0].props['data-flipped'], 'false')
})

test('展开信纸全文 & ← 收拢回信桌 run startViewTransition, route programmatic focus, and support Reply-to-Draft', async () => {
  const h = createStatefulHarness({ withViewTransition: true, reducedMotion: false })
  await h.flush()

  // Unfold active letter (UID 101)
  const unfoldBtn = h.findAll(n => n.props?.['data-email-unfold'] === 'true')[0]
  assert.ok(unfoldBtn)
  unfoldBtn.props.onClick()
  await h.flush()

  assert.equal(h.viewTransitions.length, 1)
  const sheet = h.findAll(n => n.props?.['data-letter-sheet'] === 'true')[0]
  assert.ok(sheet)
  assert.match(h.textOf(sheet), /完整正文：实体书信分拣桌已就绪/)
  assert.match(h.textOf(sheet), /letter-desk-spec\.pdf/)
  assert.equal(h.focusLog.at(-1)?.label, 'fold-back-btn', 'Focus routes into stationery sheet fold-back control on unfold')

  // Reply to draft inside unfolded stationery sheet works end-to-end
  const replyBtn = h.findAll(n => n.type === 'button' && h.textOf(n).includes('回复到草稿'), sheet)[0]
  assert.ok(replyBtn)
  await replyBtn.props.onClick()
  await h.flush()
  assert.deepEqual(h.createdDrafts, ['draft-101'])

  // Fold back to Letter Desk
  const foldBackBtn = h.findAll(n => n.props?.['data-email-fold-back'] === 'true')[0]
  assert.ok(foldBackBtn)
  foldBackBtn.props.onClick()
  await h.flush()

  assert.equal(h.viewTransitions.length, 2, 'Fold back also uses document.startViewTransition()')
  assert.equal(h.findAll(n => n.props?.['data-letter-sheet'] === 'true').length, 0)
  assert.equal(h.findAll(n => n.props?.['data-letter-card'] === 'active')[0].props['data-letter-uid'], '101')
  assert.equal(h.focusLog.at(-1)?.label, 'active-letter-card:101', 'Focus routes back to active Letter Card on fold back')

  // Reduced motion bypasses startViewTransition while preserving unfold + focus routing
  const reduced = createStatefulHarness({ withViewTransition: true, reducedMotion: true })
  await reduced.flush()
  reduced.findAll(n => n.props?.['data-email-unfold'] === 'true')[0].props.onClick()
  await reduced.flush()
  assert.equal(reduced.viewTransitions.length, 0, 'prefers-reduced-motion: reduce bypasses startViewTransition')
  assert.equal(reduced.findAll(n => n.props?.['data-letter-sheet'] === 'true').length, 1)
  assert.equal(reduced.focusLog.at(-1)?.label, 'fold-back-btn')
})

test('信桌 <-> 三栏 segmented toggle works 1-click both ways and preserves full 3-pane mailbox view', async () => {
  const h = createStatefulHarness()
  await h.flush()

  // Switch 信桌 -> 三栏
  const to3Pane = h.findAll(n => n.props?.['data-view-option'] === '3pane')[0]
  assert.ok(to3Pane)
  to3Pane.props.onClick()
  await h.flush()

  assert.equal(h.tree.props['data-email-view'], '3pane')
  assert.equal(h.findAll(n => n.type === 'aside').length, 1, '3-pane MailFolderRail renders')
  assert.equal(h.findAll(n => n.props?.role === 'separator').length, 2, '3-pane SplitResizers render')
  assert.equal(h.findAll(n => n.props?.['data-tour'] === 'mail-filter').length, 1)
  const toggleIn3Pane = h.findAll(n => n.props?.['data-email-view-toggle'] === 'true')[0]
  assert.ok(toggleIn3Pane, 'Segmented toggle remains mounted in 3-pane mode')
  assert.equal(h.findAll(n => n.props?.['data-view-option'] === '3pane', toggleIn3Pane)[0].props['aria-pressed'], true)

  // Open second message in 3-pane reader
  const rows = h.findAll(n => Object.hasOwn(n.props || {}, 'data-dsh-row'))
  assert.equal(rows.length, 3)
  const secondMsgBtn = h.findAll(n => n.type === 'button' && h.textOf(n).includes('第二封：发行日历确认'), rows[1])[0]
  assert.ok(secondMsgBtn)
  secondMsgBtn.props.onClick({ currentTarget: secondMsgBtn.dom })
  await h.flush()
  assert.match(h.textOf(h.tree), /周五上午同步最终日程/)

  // Switch 三栏 -> 信桌 aligns top letter card to selected message (UID 102)
  h.findAll(n => n.props?.['data-view-option'] === 'desk')[0].props.onClick()
  await h.flush()
  assert.equal(h.tree.props['data-email-view'], 'desk')
  assert.equal(h.findAll(n => n.props?.['data-letter-card'] === 'active')[0].props['data-letter-uid'], '102')
})

test('Skipping all letters shows Desk Complete celebration card and CSS honors 3D flip, View Transitions, and reduced motion', async () => {
  const h = createStatefulHarness()
  await h.flush()

  for (let i = 0; i < 3; i++) {
    const skipBtn = h.findAll(n => n.props?.['data-desk-action'] === 'skip')[0]
    assert.ok(skipBtn)
    skipBtn.props.onClick()
    h.renderOnce()
  }

  const completeCard = h.findAll(n => n.props?.['data-desk-complete'] === 'true')[0]
  assert.ok(completeCard, 'Desk complete card appears after reviewing all letters on page')
  assert.match(h.textOf(completeCard), /本页书信已分拣完毕/)
  assert.equal(h.textOf(h.findAll(n => n.props?.['data-desk-counter'] === 'true')[0]), '待阅 0 封')

  // Clicking "从第一封重新浏览" resets deck back to letter 101
  const resetBtn = h.findAll(n => n.type === 'button' && h.textOf(n).includes('从第一封重新浏览'), completeCard)[0]
  assert.ok(resetBtn)
  resetBtn.props.onClick()
  h.renderOnce()
  assert.equal(h.findAll(n => n.props?.['data-letter-card'] === 'active')[0].props['data-letter-uid'], '101')

  // Verify bespoke CSS rules are compiled into EMAIL_CSS
  assert.match(h.EMAIL_CSS, /perspective:\s*1100px/)
  assert.match(h.EMAIL_CSS, /rotateY\(180deg\)/)
  assert.match(h.EMAIL_CSS, /backface-visibility:\s*hidden/)
  assert.match(h.EMAIL_CSS, /dsh-email-letter-sheet/)
  const layerPaperRe = new RegExp(`\\.${h.mailCss.letterCardLayer}>\\.${h.mailCss.letterPaper}\\{[^}]*height:100%`)
  assert.match(h.EMAIL_CSS, layerPaperRe, 'stacked background letter cards must stretch to 100% height to peek out cleanly')
  assert.match(h.EMAIL_CSS, /prefers-reduced-motion:\s*reduce/)
})
