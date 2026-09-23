import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { importLegacySettings } from '../lib/legacy-settings.js'

test('migrates retired settings once, preserves explicit profile overrides and never edits the backup', async t => {
  const home = mkdtempSync(join(tmpdir(), 'dsh-settings-migration-'))
  t.after(() => rmSync(home, { recursive: true, force: true }))
  const file = join(home, 'settings.yaml.imported')
  const content = 'old-plugin:\n  password: fixture-old\n  imap:\n    host: imap.example.com\n    port: 993\n  enabled: true\nunrelated:\n  password: must-not-copy\n'
  writeFileSync(file, content)
  const config = { imap: { port: 999 }, enabled: false }
  const writes = []
  const ctx = { fiber: { entry: { options: { id: 'plugin' } } }, settings: { async update(id, patch) {
    writes.push({id,patch})
    Object.assign(config, patch)
  } } }
  assert.equal(await importLegacySettings(ctx, config, 'old-plugin', 'plugin', ['password','imap','enabled'], home), true)
  assert.equal(writes[0].id, 'plugin')
  assert.equal(writes[0].patch.password, 'fixture-old')
  assert.deepEqual(writes[0].patch.imap, { host: 'imap.example.com' })
  assert.equal('enabled' in writes[0].patch, false)
  assert.equal(readFileSync(file,'utf8'), content)
  assert.equal(await importLegacySettings(ctx, config, 'old-plugin', 'plugin', ['password'], home), false)
  assert.equal(writes.length,1)
})

test('does not import old shared credentials into a renamed instance or swallow persistence failures', async t => {
  const home = mkdtempSync(join(tmpdir(), 'dsh-settings-migration-'))
  t.after(() => rmSync(home, { recursive:true, force:true }))
  writeFileSync(join(home,'settings.yaml.imported'), 'old-plugin:\n  password: fixture-old\n')
  const config = {}
  const ctx = { fiber: { entry: { options: { id: 'other' } } }, settings: { async update() { throw new Error('read-only') } } }
  assert.equal(await importLegacySettings(ctx, config, 'old-plugin', 'plugin', ['password'], home),false)
  ctx.fiber.entry.options.id = 'plugin'
  await assert.rejects(importLegacySettings(ctx, config, 'old-plugin', 'plugin', ['password'], home),/read-only/)
  assert.equal(config.legacySettingsImported,undefined)
})
