import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = path => readFileSync(join(root, path), 'utf8').replace(/\r\n/g, '\n')
const panels = readdirSync(join(root, 'templates/panels')).filter(name => name.endsWith('.js')).sort()
const client = read('templates/client.js')
const marker = 'const W = createWorkbenchUI(React, require);'
if (!client.includes(marker)) throw new Error('Workbench source marker missing')

// Harness loads a single registered client factory. Bundle only the CSS Modules and
// browser helpers here so React and ui-primitives are still owned by the host.
const assets = await build({
  absWorkingDir: root,
  stdin: {
    contents: [
      "export { default as clsx } from 'clsx'",
      "import './templates/themes-and-motion.css'",
      "export * as styleKit from './templates/style-switcher.js'",
      "export { default as ui } from './templates/workbench.module.css'",
      "export { default as settings } from './templates/settings.module.css'",
      "export { default as mailbox } from './templates/panels/mailbox.module.css'",
      "export { default as drafts } from './templates/panels/drafts.module.css'",
      "export { richEmailBody } from './src/rich-body.ts'",
    ].join('\n'),
    resolveDir: root,
  },
  bundle: true,
  format: 'iife',
  globalName: 'emailUi',
  outfile: 'email-ui.js',
  write: false,
  metafile: true,
  target: 'es2022',
  loader: { '.module.css': 'local-css' },
  define: { 'Buffer.byteLength': 'emailUtf8Length' },
  legalComments: 'inline',
  minifyWhitespace: true,
  minifyIdentifiers: true,
})
const javascript = assets.outputFiles.find(file => file.path.endsWith('.js')).text
const css = assets.outputFiles.find(file => file.path.endsWith('.css')).text
const bundledModules = new Set()
const jsOutput = Object.entries(assets.metafile.outputs).find(([path]) => path.endsWith('.js'))[1]
for (const [path, { bytesInOutput }] of Object.entries(jsOutput.inputs)) {
  const segments = path.split('/')
  const index = segments.lastIndexOf('node_modules')
  if (index < 0 || !bytesInOutput) continue
  const packageDepth = segments[index + 1].startsWith('@') ? 2 : 1
  bundledModules.add(segments.slice(0, index + 1 + packageDepth).join('/'))
}
const notices = [...bundledModules].map(directory => {
  const { name } = JSON.parse(read(join(directory, 'package.json')))
  const license = readdirSync(join(root, directory)).find(name => /^licen[cs]e(?:$|[.-])/i.test(name))
  if (!license) throw new Error('License file missing for bundled dependency ' + name)
  return name + '\n\n' + read(join(directory, license)).replace(/[ \t]+$/gm, '').trim()
}).sort().join('\n\n').replaceAll('*/', '* /')

const output = [
  '// Generated from templates and CSS Modules. Edit the sources.',
  '/* Bundled third-party license notices\n' + notices + '\n*/',
  '(function () {',
  'const emailUtf8Length = value => new TextEncoder().encode(value).byteLength;',
  javascript,
  'const EMAIL_CSS = ' + JSON.stringify(css) + ';',
  read('templates/workbench-ui.js'),
  client.replace(marker, () => marker + '\n' + panels.map(name => read('templates/panels/' + name)).join('\n')),
  '})();',
].join('\n')
mkdirSync(join(root, 'lib'), { recursive: true })
writeFileSync(join(root, 'lib/client.js'), output + '\n')
