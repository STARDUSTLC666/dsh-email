import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const ROOT_URL = new URL('../', import.meta.url)
const PKG = JSON.parse(readFileSync(new URL('package.json', ROOT_URL), 'utf8'))
const BUNDLE = readFileSync(new URL('lib/client.js', ROOT_URL), 'utf8')

function loadClient({ withPrimitives = false, throwStorage = false } = {}) {
  const storage = new Map()
  const listeners = new Map()
  const dispatched = []
  const syncedNodes = []

  class FakeCustomEvent {
    constructor(type, init = {}) {
      this.type = type
      this.detail = init.detail
    }
  }

  const fakeWindow = {
    CustomEvent: FakeCustomEvent,
    localStorage: {
      getItem(key) {
        if (throwStorage) throw new Error('storage blocked')
        return storage.get(key) ?? null
      },
      setItem(key, value) {
        if (throwStorage) throw new Error('storage blocked')
        storage.set(key, String(value))
      },
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(fn)
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn)
    },
    dispatchEvent(event) {
      dispatched.push(event)
      for (const fn of listeners.get(event.type) || []) fn(event)
      return true
    },
    document: {
      querySelectorAll(selector) {
        return String(selector).includes('[data-dsh-portal-synced]') ? syncedNodes : []
      },
    },
  }

  const react = {
    Fragment: Symbol.for('react.fragment'),
    createElement(type, props, ...children) {
      const flat = children.flat(Infinity).filter(child => child !== null && child !== undefined && child !== false)
      return { type, props: props || {}, children: flat }
    },
    Children: {
      toArray(items) {
        return Array.isArray(items) ? items : items ? [items] : []
      },
    },
    useState(initial) {
      const val = typeof initial === 'function' ? initial() : initial
      return [val, () => {}]
    },
    useEffect() {},
    useLayoutEffect() {},
    useId: () => 'test-id',
    useMemo: fn => fn(),
    useRef: initial => ({ current: initial }),
    useCallback: fn => fn,
  }

  let lastClipboardText = ''
  const fakeNavigator = {
    clipboard: {
      async writeText(text) {
        lastClipboardText = String(text)
      },
    },
  }

  const probeSource = BUNDLE.replace(
    'return module.exports;',
    'module.exports.__uiProbe = { W, EMAIL_CSS, uiCss, mailCss, draftCss, settingsCss, MailWorkflowBar }; return module.exports;',
  )

  let client
  runInNewContext(probeSource, {
    window: Object.assign(fakeWindow, {
      navigator: fakeNavigator,
      __ModuleLoader__: {
        load({ factory }) {
          client = factory(name => {
            if (name === 'react') return react
            if (name === '@deepseek-ai/dsh-client-ui-primitives' && withPrimitives) {
              return {
                Button: props => ({ type: 'HostButton', props }),
                Modal: props => ({ type: 'HostModal', props }),
              }
            }
            throw new Error('Module not mounted in standalone test: ' + name)
          })
        },
      },
    }),
    navigator: fakeNavigator,
    document: fakeWindow.document,
    CustomEvent: FakeCustomEvent,
    setTimeout,
    clearTimeout,
  })

  return {
    react,
    storage,
    listeners,
    dispatched,
    syncedNodes,
    fakeWindow,
    getCopiedText: () => lastClipboardText,
    ...client.__uiProbe,
  }
}

function renderTree(node) {
  if (!node || typeof node !== 'object') return node
  if (typeof node.type === 'function') {
    return renderTree(node.type({ ...node.props, children: node.children.length <= 1 ? node.children[0] : node.children }))
  }
  return {
    ...node,
    children: (node.children || []).map(renderTree),
  }
}

function findNodes(node, predicate, acc = []) {
  if (!node || typeof node !== 'object') return acc
  if (predicate(node)) acc.push(node)
  for (const child of node.children || []) findNodes(child, predicate, acc)
  return acc
}

test('DSH >=0.2.2-rc.3 manifest, window clearances, and dsh-updates footer are preserved', () => {
  assert.equal(PKG.engines?.dsh, '>=0.2.2-rc.3')
  assert.deepEqual(PKG.dsh?.client?.inject, [
    '@deepseek-ai/dsh-client-ui-settings',
    '@deepseek-ai/dsh-client-ui-layout',
    '@deepseek-ai/dsh-client-ui-sidebar',
  ])
  assert.match(BUNDLE, /data-plugin-update-footer/)
  const { EMAIL_CSS } = loadClient()
  assert.match(EMAIL_CSS, /--dsh-frame-top-clearance/)
  assert.match(EMAIL_CSS, /--dsh-frame-leading-clearance/)
  assert.match(EMAIL_CSS, /\[data-window-drag-exclude\]\{-webkit-app-region:no-drag\}/)
})

test('never-too-dark slate adaptation and all 13 [data-dsh-style] palettes + 8 DSH_FONTS are present in EMAIL_CSS', () => {
  const { EMAIL_CSS, W } = loadClient()
  assert.deepEqual(
    Array.from(W.styles, item => item.id),
    ['harness', 'cream', 'claude', 'pixel8bit', 'mint', 'glass', 'eink', 'blueprint', 'risograph', 'win98', 'songhui', 'frutiger', 'gazette'],
  )
  assert.equal(W.defaultFont, 'arcade')
  assert.deepEqual(
    Array.from(W.fonts, item => item.id),
    ['arcade', 'auto', 'songkai', 'fangsong', 'poster', 'retro98', 'serif', 'modern'],
  )
  // Soft breathable slate in host dark mode under harness (never pitch black).
  assert.match(EMAIL_CSS, /body\[data-ds-dark-theme\] \[data-dsh-style=harness\][\s\S]*?#1f232b/i)
  assert.match(EMAIL_CSS, /#272c36/i)
  assert.match(EMAIL_CSS, /#ececec[\s\S]*#1b4f9c/i, 'win98 platinum toolbar contrast rule present')
  assert.doesNotMatch(EMAIL_CSS, /--dsw-alias-bg-base:#000(?:000)?[;}]/i)
  assert.doesNotMatch(EMAIL_CSS, /#090a0f|#0b0d13/i)
  // All 12 custom daylight presets define their bright base surfaces.
  for (const [id, hex] of [
    ['cream', '#faf7f0'],
    ['claude', '#f5f4ed'],
    ['pixel8bit', '#f4f6e8'],
    ['mint', '#f5fafb'],
    ['glass', '#f3f7ff'],
    ['eink', '#f2f1ec'],
    ['blueprint', '#eaf3fb'],
    ['risograph', '#faf6ee'],
    ['win98', '#dcdcdc'],
    ['songhui', '#f7f3e8'],
    ['frutiger', '#eaf7ff'],
    ['gazette', '#f6f3ec'],
  ]) {
    assert.ok(
      EMAIL_CSS.includes(`[data-dsh-style=${id}]`) || EMAIL_CSS.includes(`[data-dsh-style="${id}"]`),
      `missing preset selector for ${id}`,
    )
    assert.ok(EMAIL_CSS.toLowerCase().includes(hex), `missing bright surface ${hex} for ${id}`)
  }
  for (const fontId of ['arcade', 'songkai', 'fangsong', 'poster', 'retro98', 'serif', 'modern']) {
    assert.ok(
      EMAIL_CSS.includes(`[data-dsh-font=${fontId}]`) || EMAIL_CSS.includes(`[data-dsh-font="${fontId}"]`),
      `missing font selector for ${fontId}`,
    )
  }
})

test('style & font switchers sync via localStorage, custom events, and portaled overlays', () => {
  const env = loadClient()
  const { W, storage, dispatched, syncedNodes } = env
  const attrs = new Map()
  syncedNodes.push({
    setAttribute: (k, v) => attrs.set(k, v),
    hasAttribute: k => attrs.has(k),
  })

  assert.equal(W.readStyle(), 'harness')
  assert.equal(W.readFont(), 'arcade')
  for (const preset of ['cream', 'claude', 'pixel8bit', 'mint', 'gazette', 'harness']) {
    assert.equal(W.writeStyle(preset), preset)
    assert.equal(storage.get('dsh-stardust:ui-style'), preset)
    assert.equal(attrs.get('data-dsh-style'), preset)
    assert.equal(attrs.get('data-window-drag-exclude'), '')
  }
  assert.equal(dispatched.some(ev => ev.type === 'dsh-stardust-style' && ev.detail?.style === 'pixel8bit'), true)
  assert.equal(W.writeStyle('unknown-theme'), 'harness', 'invalid preset falls back to harness')

  for (const fontId of ['songkai', 'fangsong', 'auto', 'arcade']) {
    assert.equal(W.writeFont(fontId), fontId)
    assert.equal(storage.get('dsh-stardust:ui-font'), fontId)
    assert.equal(attrs.get('data-dsh-font'), fontId)
  }
  assert.equal(dispatched.some(ev => ev.type === 'dsh-stardust-font' && ev.detail?.font === 'songkai'), true)
  assert.equal(W.writeFont('unknown-font'), 'arcade', 'invalid font falls back to arcade')

  // Restricted storage sandbox must not throw.
  const restricted = loadClient({ throwStorage: true })
  assert.equal(restricted.W.readStyle(), 'harness')
  assert.equal(restricted.W.writeStyle('mint'), 'mint')
  assert.equal(restricted.W.readFont(), 'arcade')
  assert.equal(restricted.W.writeFont('songkai'), 'songkai')
})

test('standalone fallbacks render semantic controls, FontSwitcher, stamp data-dsh-icon, and sync portaled Dialog frames', () => {
  const { react, W } = loadClient({ withPrimitives: false })
  W.writeStyle('claude')
  W.writeFont('songkai')

  const pageTree = renderTree(
    react.createElement(
      W.Page,
      { workbench: true, lang: 'zh', title: '邮件', actions: react.createElement(W.Button, { variant: 'primary', icon: 'edit' }, '写邮件') },
      react.createElement(W.Input, { icon: 'search', placeholder: '搜索' }),
      react.createElement(W.Checkbox, { label: '全选', checked: true, modalAutofocus: true, onChange() {} }),
      react.createElement(W.primitives().SegmentedControl, { id: 'fmt', label: '格式', value: 'text', options: [{ value: 'text', label: '纯文本' }], onChange() {} }),
      react.createElement(W.primitives().Switch, { label: '定时', checked: false, onChange() {} }),
    ),
  )

  assert.equal(pageTree.type, 'section')
  assert.equal(pageTree.props['data-dsh-style'], 'claude')
  assert.equal(pageTree.props['data-dsh-font'], 'songkai')
  const styleTrigger = findNodes(pageTree, n => String(n.props?.className || '').includes('dsh-style-trigger'))[0]
  const fontTrigger = findNodes(pageTree, n => String(n.props?.className || '').includes('dsh-font-trigger'))[0]
  assert.ok(styleTrigger, 'StyleSwitcher trigger renders in unified header')
  assert.ok(fontTrigger, 'FontSwitcher trigger renders beside StyleSwitcher')
  const svgs = findNodes(pageTree, n => n.type === 'svg')
  assert.ok(svgs.some(n => n.props['data-dsh-icon'] === 'mail'))
  assert.ok(svgs.some(n => n.props['data-dsh-icon'] === 'down'))
  assert.ok(svgs.some(n => n.props['data-dsh-icon'] === 'edit'))
  assert.ok(svgs.some(n => n.props['data-dsh-icon'] === 'search'))

  const checkboxes = findNodes(pageTree, n => n.type === 'input' && n.props.type === 'checkbox')
  assert.equal(checkboxes.length, 1)
  assert.equal(checkboxes[0].props['data-modal-autofocus'], '')
  assert.equal(Object.hasOwn(checkboxes[0].props, 'modalAutofocus'), false)

  // Verify Dialog stamps data-dsh-style, data-dsh-font, and data-window-drag-exclude onto portaled [role="dialog"] ancestor via ref.
  const dialogTree = renderTree(
    react.createElement(W.Dialog, { title: '写邮件', closeLabel: '关闭', onClose() {} }, '正文'),
  )
  const dialogs = findNodes(dialogTree, n => n.props?.role === 'dialog')
  assert.equal(dialogs.length, 1)
  const syncedFrames = findNodes(dialogTree, n => typeof n.props?.ref === 'function')
  assert.equal(syncedFrames.length, 1)

  const outerAttrs = new Map()
  const innerAttrs = new Map()
  syncedFrames[0].props.ref({
    setAttribute: (k, v) => innerAttrs.set(k, v),
    closest(selector) {
      assert.match(selector, /\[role="dialog"\]/)
      return { setAttribute: (k, v) => outerAttrs.set(k, v) }
    },
  })
  assert.equal(innerAttrs.get('data-dsh-style'), 'claude')
  assert.equal(innerAttrs.get('data-dsh-font'), 'songkai')
  assert.equal(outerAttrs.get('data-dsh-style'), 'claude')
  assert.equal(outerAttrs.get('data-dsh-font'), 'songkai')
  assert.equal(outerAttrs.get('data-window-drag-exclude'), '')
})

test('interactive button press physics, icon micro-animations, and prefers-reduced-motion rules exist in EMAIL_CSS', () => {
  const { EMAIL_CSS } = loadClient()
  // Stepped 8-bit press & tactile standard press
  assert.match(EMAIL_CSS, /steps\(2,\s*end\)/)
  assert.match(EMAIL_CSS, /scale:0\.965/)
  // Icon micro-animations
  for (const token of ['dsh-icon-spin', 'dsh-icon-wiggle', 'dsh-icon-pop', 'dsh-icon-bounce', 'data-dsh-icon=refresh', 'data-dsh-icon=trash', 'data-dsh-icon=down']) {
    assert.ok(
      EMAIL_CSS.includes(token) || EMAIL_CSS.includes(token.replace('=', '="')),
      `missing motion token ${token}`,
    )
  }
  // Dialog @starting-style & reduced-motion compliance
  assert.match(EMAIL_CSS, /@starting-style/)
  assert.match(EMAIL_CSS, /@media\s*\(prefers-reduced-motion:\s*reduce\)/)
})

test('collapsible MailWorkflowBar uses accessible <details>/<summary> and copies context-aware AI prompts', async () => {
  const { react, MailWorkflowBar, EMAIL_CSS, getCopiedText } = loadClient()
  assert.match(EMAIL_CSS, /content:\s*"(?:▸|\\25b8)";\s*content:\s*"(?:▸|\\25b8)"\s*\/\s*""/i)
  assert.match(EMAIL_CSS, /@media\s*\(prefers-reduced-motion:\s*no-preference\)/)

  const who = list => (list || []).map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(', ')
  const tree = renderTree(
    react.createElement(MailWorkflowBar, {
      account: 'work',
      folder: 'INBOX',
      selected: 42,
      detail: {
        subject: 'Q4 合同评审确认',
        from: [{ name: 'Alice', address: 'alice@example.com' }],
      },
      currentRow: null,
      who,
    }),
  )

  assert.equal(tree.type, 'details')
  const summaries = findNodes(tree, n => n.type === 'summary')
  assert.equal(summaries.length, 1)
  const headingsInSummary = findNodes(summaries[0], n => /^h[1-6]$/.test(String(n.type)))
  assert.equal(headingsInSummary.length, 0, '<summary> must never wrap heading elements')

  const buttons = findNodes(tree, n => n.type === 'button')
  assert.equal(buttons.length, 3)
  // Second chip drafts a polite reply with selected message subject, sender, and UID
  await buttons[1].props.onClick()
  const copied = getCopiedText()
  assert.match(copied, /Q4 合同评审确认/)
  assert.match(copied, /Alice <alice@example\.com>/)
  assert.match(copied, /UID: 42/)

  // Live status region is outside buttons
  const liveRegions = findNodes(tree, n => n.props?.role === 'status')
  assert.equal(liveRegions.length, 1)
})

test('interactive CoachmarkTour renders tethered popover card, directional arrow, step dots, and 1-click prompt copy', async () => {
  const { react, W, EMAIL_CSS } = loadClient()
  assert.match(EMAIL_CSS, /:popover-open/)
  assert.match(EMAIL_CSS, /\[data-side=["']?bottom["']?\]/)

  let activeStep = 2
  let closed = false
  let copiedPrompt = ''
  const steps = [
    { id: 'accounts', selector: '#acc', side: 'bottom', title: '连接邮箱账号', desc: '测试连接' },
    { id: 'filter', selector: '#flt', side: 'bottom', title: '筛选来信', desc: '只看未读' },
    { id: 'ai-draft', selector: '#drf', side: 'bottom', title: '让 AI 汇总未读', desc: '先存草稿', prompt: '汇总未读重要邮件', promptLabel: '复制汇总指令' },
    { id: 'compose', selector: '#cmp', side: 'bottom', title: '核对发送', desc: '收件规则' },
  ]
  const tree = renderTree(
    react.createElement(W.CoachmarkTour, {
      steps,
      step: activeStep,
      manual: true,
      style: 'mint',
      lang: 'zh',
      onStep: next => { activeStep = next },
      onClose: () => { closed = true },
      onCopyPrompt: async val => { copiedPrompt = val; return true },
    }),
  )

  assert.equal(tree.props['data-dsh-style'], 'mint')
  const card = findNodes(tree, n => n.props?.role === 'dialog')[0]
  assert.ok(card, 'coachmark card exposes role="dialog"')
  assert.equal(card.props['aria-modal'], 'false')
  const arrow = findNodes(card, n => n.props?.['data-tour-arrow'])[0]
  assert.ok(arrow, 'coachmark card renders directional arrow')

  const copyBtn = findNodes(card, n => n.props?.['data-copy-prompt'] === '汇总未读重要邮件')[0]
  assert.ok(copyBtn, 'Step 3 renders inline prompt copy button')
  await copyBtn.props.onClick()
  assert.equal(copiedPrompt, '汇总未读重要邮件')

  const nextBtn = findNodes(card, n => Object.hasOwn(n.props || {}, 'data-tour-next'))[0]
  assert.ok(nextBtn)
  nextBtn.props.onClick()
  assert.equal(activeStep, 3)

  const skipBtn = findNodes(card, n => n.type === 'button' && n.children?.includes('跳过'))[0]
  assert.ok(skipBtn)
  skipBtn.props.onClick()
  assert.equal(closed, true)
})

test('v3 header, sliding tab indicator, resizable split panes, shimmer skeletons, and row hover actions are wired', () => {
  const { react, W, EMAIL_CSS } = loadClient()
  for (const token of ['dsh-header', 'dsh-tab-indicator', 'dsh-split-resizer', 'dsh-skeleton', 'dsh-row-actions', 'dsh-pixel-cursor']) {
    assert.ok(EMAIL_CSS.includes(token), `missing v3 CSS token ${token}`)
  }

  const tabsTree = renderTree(
    react.createElement(W.Tabs, {
      id: 't',
      label: 'Features',
      value: 'mailbox',
      items: [{ id: 'mailbox', label: 'Mailbox' }, { id: 'drafts', label: 'Drafts' }],
      onChange() {},
    }),
  )
  assert.equal(tabsTree.props.role, 'tablist')
  assert.ok(String(tabsTree.props.className).includes('dsh-tablist-pill'))
  const indicator = findNodes(tabsTree, n => String(n.props?.className || '').includes('dsh-tab-indicator'))[0]
  assert.ok(indicator, 'W.Tabs renders sliding tab indicator span')

  let resized = 300
  const resizerTree = renderTree(
    react.createElement(W.SplitResizer, {
      value: resized,
      initial: 336,
      min: 200,
      max: 500,
      label: 'Resize list',
      onChange: next => { resized = next },
      onReset: () => { resized = 336 },
    }),
  )
  assert.equal(resizerTree.props.role, 'separator')
  assert.equal(resizerTree.props['aria-orientation'], 'vertical')
  assert.equal(resizerTree.props['data-window-drag-exclude'], '')
  resizerTree.props.onKeyDown({ key: 'ArrowRight', preventDefault() {} })
  assert.equal(resized, 316)
  resizerTree.props.onDoubleClick()
  assert.equal(resized, 336)

  const skelTree = renderTree(react.createElement(W.Skeleton, { variant: 'card', label: 'Loading' }))
  assert.equal(skelTree.props.role, 'status')
  assert.equal(skelTree.props['aria-label'], 'Loading')
  assert.ok(String(skelTree.props.className).includes('dsh-skeleton-card'))

  assert.match(BUNDLE, /dsh-row-actions/)
  assert.match(BUNDLE, /dsh-pixel-cursor/)
  assert.match(BUNDLE, /dsh-email:rail-width/)
  assert.match(BUNDLE, /dsh-email:list-width/)
})

test('EmailSettingsSection calls all hooks before early return and CoachmarkTour safely queries React useId() selectors', () => {
  const clientTpl = readFileSync(new URL('templates/client.js', ROOT_URL), 'utf8')
  const fnStart = clientTpl.indexOf('function EmailSettingsSection(')
  const earlyReturn = clientTpl.indexOf('if (draft === null) {', fnStart)
  const fnEnd = clientTpl.indexOf('function startWhaleWidget(', earlyReturn)
  assert.ok(fnStart > 0 && earlyReturn > fnStart && fnEnd > earlyReturn)
  const afterEarlyReturn = clientTpl.slice(earlyReturn, fnEnd)
  assert.doesNotMatch(
    afterEarlyReturn,
    /\b(?:React\.)?(?:useState|useEffect|useLayoutEffect|useMemo|useCallback|useRef|useId)\s*\(/,
    'No React hooks may be called after `if (draft === null)` early return in EmailSettingsSection',
  )

  const effects = []
  const { react, W } = loadClient()
  react.useEffect = fn => { effects.push(fn) }
  const queried = []
  const rootRef = {
    current: {
      querySelector(sel) {
        queried.push(sel)
        if (sel.startsWith('#:')) throw new SyntaxError('Invalid selector: ' + sel)
        return sel === '[id=":r12:-tab-accounts"]' ? { getBoundingClientRect: () => ({ left: 10, top: 10, width: 80, height: 28 }) } : null
      },
    },
  }
  let measuredLayout = null
  renderTree(
    react.createElement(W.CoachmarkTour, {
      rootRef,
      steps: [{ id: 'accounts', selector: '#:r12:-tab-accounts', side: 'bottom', title: 'Accounts', desc: 'Desc' }],
      step: 0,
      setLayout: next => { measuredLayout = next },
    }),
  )
  for (const fn of effects) fn?.()
  assert.ok(queried.includes('[id=":r12:-tab-accounts"]'), 'CoachmarkTour rewrites #:id to safe [id="..."] selector')
  assert.ok(measuredLayout?.spotlight, 'CoachmarkTour computes spotlight for useId() selector without SyntaxError')

  // Verify the 5-step bespoke Letter Desk tour steps and anchors exist in templates/client.js
  for (const anchor of ['data-tour="mail-filter"', 'data-tour="mail-letter-card"', 'data-tour="mail-courier"', 'data-tour="mail-style"', 'data-tour="mail-compose"']) {
    assert.ok(clientTpl.includes(anchor), 'Expected CoachmarkTour selector anchor in templates/client.js: ' + anchor)
  }
  for (const stepId of ['desk-ribbon', 'letter-card', 'whale-courier', 'style-font', 'compose-drafts']) {
    assert.ok(clientTpl.includes('id: "' + stepId + '"'), 'Expected bespoke tour step id in templates/client.js: ' + stepId)
  }
})
