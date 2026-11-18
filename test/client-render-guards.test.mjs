import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = fileURLToPath(new URL('..', import.meta.url))
const files = [
  'templates/client.js',
  'templates/workbench-ui.js',
  'templates/style-switcher.js',
  ...readdirSync(join(root, 'templates/panels')).filter(name => name.endsWith('.js')).map(name => 'templates/panels/' + name),
]

const HOOKS = new Set([
  'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useLayoutEffect', 'useReducer',
  'useId', 'useContext', 'useImperativeHandle', 'useSyncExternalStore', 'useTransition', 'useDeferredValue',
])

function hookName(node) {
  if (!ts.isCallExpression(node)) return ''
  const callee = node.expression
  const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : ''
  return HOOKS.has(name) ? name : ''
}

/** True when running this statement always leaves the enclosing function. */
function alwaysExits(node) {
  if (ts.isReturnStatement(node) || ts.isThrowStatement(node)) return true
  if (ts.isBlock(node)) return node.statements.some(alwaysExits)
  if (ts.isIfStatement(node)) return alwaysExits(node.thenStatement) || (node.elseStatement !== undefined && alwaysExits(node.elseStatement))
  return false
}

/**
 * 客户端 bundle 是手写 JS，React hook 顺序错误不会在构建期报错：0.28.7 的
 * EmailSettingsSection 在加载态的 return 之后声明 useEffect，快照到达的那一轮
 * hook 数量变多，React 抛 #310，设置页和侧边栏工作台整块空白（issue #56）。
 * 这里按源码文本顺序检查「组件里条件 return 之后还有 hook」的写法。
 */
test('组件不在条件 return 之后声明 hook（React #310 回归）', () => {
  const findings = []
  for (const file of files) {
    const source = ts.createSourceFile(file, readFileSync(join(root, file), 'utf8'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.JSX)
    const inspect = (fn, name) => {
      const body = fn.body
      if (!body || !ts.isBlock(body) || !/^[A-Z]/.test(name)) return
      let conditionalReturnSeen = false
      for (const statement of body.statements) {
        if (alwaysExits(statement)) conditionalReturnSeen = true
        const scan = node => {
          if (ts.isFunctionLike(node)) return
          if (hookName(node)) {
            if (conditionalReturnSeen) {
              const { line } = source.getLineAndCharacterOfPosition(node.getStart(source))
              findings.push(file + ':' + (line + 1) + ' ' + name + ' calls ' + hookName(node) + ' after a conditional return')
            }
            return
          }
          ts.forEachChild(node, scan)
        }
        scan(statement)
      }
    }
    const visit = node => {
      if (ts.isFunctionDeclaration(node) && node.name) inspect(node, node.name.text)
      else if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
        const parent = node.parent
        const name = ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name) ? parent.name.text
          : ts.isPropertyAssignment(parent) ? parent.name.getText(source) : ''
        inspect(node, name)
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  assert.deepEqual(findings, [], 'hook 必须无条件声明；把 hook 提到提前 return 之前')
})
