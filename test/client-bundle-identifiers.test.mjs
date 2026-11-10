import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = fileURLToPath(new URL('..', import.meta.url))
const bundle = path.join(root, 'lib', 'client.js')

/**
 * 客户端 bundle 是手写 JS，未声明的标识符不会在构建期报错，只会在渲染时抛
 * ReferenceError。0.24.0 的 MailContent 就是引用了来自另一个组件的
 * working/busy，点开任意邮件后整个 main 插槽被错误边界卸载（#46）。
 *
 * 这里用 TypeScript 对生成后的 lib/client.js 做一次语义检查，只取
 * TS2304（Cannot find name），把“未声明标识符”变成可回归的测试。
 */
test('客户端 bundle 不引用未声明的标识符（0.24.0 空屏回归）', () => {
  const options = {
    allowJs: true,
    checkJs: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.None,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    skipLibCheck: true,
  }
  const program = ts.createProgram([bundle], options)
  const undeclared = []
  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    if (diagnostic.code !== 2304) continue
    const line = diagnostic.file !== undefined && diagnostic.start !== undefined
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1
      : 0
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')
    undeclared.push(message + ' @lib/client.js:' + line)
  }
  assert.deepEqual(
    undeclared,
    [],
    'lib/client.js 引用了未声明的标识符；修好源头后请运行 node scripts/build-client.mjs 重新生成',
  )
})
