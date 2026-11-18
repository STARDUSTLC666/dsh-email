import test from 'node:test'
import assert from 'node:assert/strict'
import { Config } from '../lib/host-config.js'
import { EmailSettingsSchema, toEmailConfig, toSettingsBase, validateSettingsValue, UI_LOCALES } from '../lib/settings.js'

/**
 * The settings form always submits `uiLocale` now that the schema carries it.
 * The native save rejects the whole section when a submitted field is missing
 * from the plugin Config or is not `.volatile()`, so the two schemas and the
 * three projections have to stay in sync. This covers the round trip and the
 * rejection of a value the workbench cannot render.
 */
test('uiLocale round-trips through the settings helpers and stays volatile in the host config', () => {
  assert.equal(Config.dict.uiLocale.meta.volatile, true, 'uiLocale must stay a volatile Config field or every settings save fails')
  assert.equal(EmailSettingsSchema({}).uiLocale, 'en', 'a fresh install defaults to english')
  for (const locale of UI_LOCALES) {
    const base = toSettingsBase({ uiLocale: locale })
    assert.equal(base.uiLocale, locale)
    const draft = EmailSettingsSchema(base)
    assert.equal(draft.uiLocale, locale)
    assert.equal(toEmailConfig(draft, null).uiLocale, locale)
    validateSettingsValue({ uiLocale: locale })
  }
  // An absent field stays 「未设置」 instead of erasing the row value.
  assert.equal('uiLocale' in toEmailConfig({}, null), false)
  for (const bad of ['xx', 'EN-us', 7, null]) {
    assert.throws(() => validateSettingsValue({ uiLocale: bad }), /uiLocale must be one of/)
  }
})
