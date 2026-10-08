import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { clearTokenFor, oauth2TokenFile, readTokenStore, writeTokenStore } from '../lib/oauth2.js'

const root = resolve(fileURLToPath(new URL('../', import.meta.url)))
const parent = join(root, 'test', '.oauth2-storage')
mkdirSync(parent, { recursive: true })
const home = mkdtempSync(join(parent, 'isolated-'))
process.env.DSH_HOME = home
const file = oauth2TokenFile()
const entry = name => ({ user: name + '@example.invalid', clientId: 'fixture-client', refreshToken: 'REFRESH-SYNTHETIC-' + name, accessToken: 'ACCESS-SYNTHETIC-' + name, expiresAt: 123456789 })
const store = { version: 1, accounts: { '工作': entry('work'), personal: entry('personal') } }
const windows = process.platform === 'win32'
test.after(() => {
  assert.equal(dirname(home), parent)
  rmSync(home, { recursive: true, force: true })
  try { rmdirSync(parent) } catch (error) { if (error.code !== 'ENOTEMPTY') throw error }
})
function seed(doc = store) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(doc) + '\n', { mode: 0o600 })
}

test('the real platform store round-trips in a separate process; Windows has no plaintext tokens', () => {
  seed(); writeTokenStore(store)
  const raw = readFileSync(file, 'utf8')
  if (windows) {
    const doc = JSON.parse(raw)
    assert.equal(doc.version, 2)
    assert.equal(doc.protection, 'windows-dpapi-current-user')
    for (const token of Object.values(store.accounts).flatMap(account => [account.refreshToken, account.accessToken, account.user])) assert.equal(raw.includes(token), false)
  } else assert.equal(statSync(file).mode & 0o777, 0o600)
  const probe = spawnSync(process.execPath, ['--input-type=module', '-e', 'import {readTokenStore} from "./lib/oauth2.js";process.stdout.write(JSON.stringify(readTokenStore()));'], { cwd: root, env: { ...process.env, DSH_HOME: home }, encoding: 'utf8', timeout: 20000, windowsHide: true })
  assert.equal(probe.status, 0, probe.stderr)
  assert.deepEqual(JSON.parse(probe.stdout), store)
})

test('reading a legacy Windows store migrates both accounts and keeps account removal precise', () => {
  seed()
  assert.deepEqual(readTokenStore(), store)
  if (windows) assert.equal(JSON.parse(readFileSync(file, 'utf8')).version, 2)
  assert.equal(clearTokenFor('工作'), true)
  assert.deepEqual(readTokenStore(), { version: 1, accounts: { personal: store.accounts.personal } })
})

test('damaged or unsupported protected stores cannot be mistaken for logged-out accounts or overwritten', () => {
  for (const doc of [{ version: 2, protection: 'windows-dpapi-current-user', ciphertext: 'AAAA' }, { version: 2, protection: 'unknown', ciphertext: 'AAAA' }, { version: 3, accounts: store.accounts }]) {
    seed(doc)
    const before = readFileSync(file)
    assert.throws(() => readTokenStore(), /原文件未被覆盖/)
    assert.throws(() => writeTokenStore(store), /原文件未被覆盖/)
    assert.deepEqual(readFileSync(file), before)
    assert.equal(readdirSync(dirname(file)).some(name => name.endsWith('.tmp')), false)
  }
})

test('truncated protected JSON is preserved on both read and write', () => {
  writeFileSync(file, '{"version":2,"protection":"windows-dpapi-current-user","ciphertext":', 'utf8')
  const before = readFileSync(file)
  assert.throws(() => readTokenStore(), /原文件未被覆盖/)
  assert.throws(() => writeTokenStore(store), /原文件未被覆盖/)
  assert.deepEqual(readFileSync(file), before)
})

test('tampering with actual Windows DPAPI ciphertext fails integrity checks even after a cached read', { skip: !windows }, () => {
  seed(); writeTokenStore(store)
  assert.deepEqual(readTokenStore(), store)
  const doc = JSON.parse(readFileSync(file, 'utf8'))
  const ciphertext = Buffer.from(doc.ciphertext, 'base64')
  ciphertext[ciphertext.length - 1] ^= 1
  doc.ciphertext = ciphertext.toString('base64')
  writeFileSync(file, JSON.stringify(doc), 'utf8')
  const before = readFileSync(file)
  assert.throws(() => readTokenStore(), /原文件未被覆盖/)
  assert.throws(() => writeTokenStore(store), /原文件未被覆盖/)
  assert.deepEqual(readFileSync(file), before)
})

test('unavailable Windows encryption fails without plaintext fallback or destroying legacy data', { skip: !windows }, () => {
  seed()
  const before = readFileSync(file)
  const rootBefore = process.env.SystemRoot, windirBefore = process.env.WINDIR
  try {
    process.env.SystemRoot = join(home, 'missing-system-root')
    process.env.WINDIR = process.env.SystemRoot
    assert.throws(() => writeTokenStore(store), /未写入明文令牌/)
    assert.throws(() => readTokenStore(), /未写入明文令牌/)
    assert.deepEqual(readFileSync(file), before)
    assert.equal(readdirSync(dirname(file)).some(name => name.endsWith('.tmp')), false)
  } finally {
    if (rootBefore === undefined) delete process.env.SystemRoot; else process.env.SystemRoot = rootBefore
    if (windirBefore === undefined) delete process.env.WINDIR; else process.env.WINDIR = windirBefore
  }
})
