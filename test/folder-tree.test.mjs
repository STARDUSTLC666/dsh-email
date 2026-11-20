import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const BUNDLE = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

/**
 * The folder rail is pure client code inside the published bundle. Load only
 * that factory so the tree ordering can be checked without jsdom or React.
 */
function loadFolderHelpers() {
  let client
  const source = BUNDLE.replace(
    'return module.exports;',
    'module.exports.__folderProbe = { buildFolderTree, flattenFolderTree, folderLabel }; return module.exports;',
  )
  runInNewContext(source, {
    window: { __ModuleLoader__: { load({ factory }) { client = factory(() => ({})) } } },
    Intl,
    Date,
    AbortController,
  })
  return client.__folderProbe
}

const row = (path, extra = {}) => ({
  name: path.split('/').at(-1),
  path,
  specialUse: '',
  subscribed: true,
  delimiter: '/',
  parentPath: '',
  ...extra,
})

test('flat LIST rows become an ordered, nested folder forest', () => {
  const { buildFolderTree, flattenFolderTree } = loadFolderHelpers()
  const forest = buildFolderTree([
    row('INBOX', { name: 'INBOX', specialUse: '\\Inbox', unseen: 1 }),
    // LIST order is not guaranteed: a child may arrive before its parent.
    row('INBOX/电控/测试室', { parentPath: 'INBOX/电控', unseen: 88 }),
    row('INBOX/电控', { parentPath: 'INBOX', unseen: 0 }),
    row('Sent Items', { name: 'Sent Items', specialUse: '\\Sent' }),
    row('Drafts', { specialUse: '\\Drafts' }),
    row('Alpha'),
    row('Work'),
    row('Work/2026', { parentPath: 'Work' }),
    row('Orphan/Child', { parentPath: 'Orphan' }),
  ])

  assert.deepEqual([...forest].map(node => node.row.path), ['INBOX', 'Sent Items', 'Drafts', 'Alpha', 'Orphan/Child', 'Work'])
  assert.deepEqual([...forest[0].children].map(node => node.row.path), ['INBOX/电控'])
  assert.equal(forest[0].children[0].depth, 1)
  assert.equal(forest[0].children[0].children[0].row.path, 'INBOX/电控/测试室')
  assert.equal(forest[0].children[0].children[0].depth, 2)
  assert.deepEqual([...forest[5].children].map(node => node.row.path), ['Work/2026'])

  // A parent the server never listed stays reachable as a root; the rail then
  // shows the full path instead of a bare leaf name.
  assert.equal(forest[4].orphan, true)
  assert.equal(forest[4].depth, 0)

  const flat = [...flattenFolderTree(forest)].map(entry => [entry.row.path, entry.depth])
  assert.deepEqual(flat.slice(0, 3), [['INBOX', 0], ['INBOX/电控', 1], ['INBOX/电控/测试室', 2]])
  assert.deepEqual(flat.at(-2), ['Work', 0])
  assert.deepEqual(flat.at(-1), ['Work/2026', 1])
})

test('parentPath may be absent when the path itself carries the hierarchy', () => {
  const { buildFolderTree } = loadFolderHelpers()
  const forest = buildFolderTree([
    row('INBOX', { specialUse: '\\Inbox' }),
    row('INBOX/Reports'),
    row('INBOX/Reports/2026'),
  ])
  assert.equal(forest.length, 1)
  assert.equal(forest[0].children[0].row.path, 'INBOX/Reports')
  assert.equal(forest[0].children[0].children[0].row.path, 'INBOX/Reports/2026')
})

test('unread counts are rendered as a badge and announced with the folder name', () => {
  // The rail markup is generated inside the bundle; keep the wiring visible to
  // reviewers even though the render itself needs a browser.
  for (const marker of ['className: mailCss.folderUnread', "dt('未读', 'Unread')", 'node.children.map(renderNode)', 'mailCss.folderNode']) {
    assert.ok(BUNDLE.includes(marker), 'folder rail is missing ' + marker)
  }
  assert.match(BUNDLE, /count > 999 \? '999\+' : String\(count\)/)
  assert.match(BUNDLE, /'aria-expanded': !isCollapsed/)
})