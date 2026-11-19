import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailService, resolveEmailSettings, toEmailConfig, toSettingsBase, validateSettingsValue } from '../lib/index.js'

const account = { provider: 'qq', user: 'mail@example.invalid', password: 'fixture-only' }

function resolvedReply(replyLocale, hostLocale) {
  const settings = resolveEmailSettings({ accounts: { default: { ...account, replyLocale } }, defaultAccount: 'default' })
  const service = new EmailService(settings, { replyLocale: () => hostLocale })
  try { return service.replyOptions('default').locale }
  finally { service.dispose() }
}

test('uiLocale is a settings-only preference and never projects into resolved mail accounts', () => {
  assert.equal(toSettingsBase({ uiLocale: 'zh' }).uiLocale, 'zh')
  assert.equal(toSettingsBase({ uiLocale: 'en' }).uiLocale, 'en')
  assert.equal(toSettingsBase({ uiLocale: 'auto' }).uiLocale, 'auto')
  assert.equal(Object.hasOwn(toEmailConfig({ uiLocale: 'zh', ...account }, null), 'uiLocale'), false)
  for (const uiLocale of ['auto', 'zh', 'en']) assert.doesNotThrow(() => validateSettingsValue({ uiLocale }))
  for (const uiLocale of ['fr', 'de', '', null, 1]) assert.throws(() => validateSettingsValue({ uiLocale }), /界面语言/)
})

test('reply quote locale is independent of uiLocale and only explicit replyLocale or locale selects it', () => {
  const hostLocales = [undefined, 'zh-CN', 'en-US']
  const replyLocales = ['auto', 'zh', 'en', 'fr']
  const expected = {
    auto: { undefined: 'zh', 'zh-CN': 'zh-CN', 'en-US': 'en-US' },
    zh: { undefined: 'zh', 'zh-CN': 'zh', 'en-US': 'zh' },
    en: { undefined: 'en', 'zh-CN': 'en', 'en-US': 'en' },
    fr: { undefined: 'fr', 'zh-CN': 'fr', 'en-US': 'fr' },
  }
  for (const uiLocale of ['auto', 'zh', 'en']) {
    for (const replyLocale of replyLocales) {
      for (const hostLocale of hostLocales) {
        assert.equal(resolvedReply(replyLocale, hostLocale), expected[replyLocale][String(hostLocale)],
          JSON.stringify({ uiLocale, replyLocale, hostLocale }))
      }
    }
  }
  const settings = resolveEmailSettings({ accounts: { default: { ...account, replyLocale: 'zh' } }, defaultAccount: 'default' })
  const service = new EmailService(settings, { replyLocale: () => 'en-US' })
  try {
    assert.equal(service.replyOptions('default', { locale: 'fr' }).locale, 'fr', 'explicit caller locale wins')
    assert.equal(service.replyOptions('default', { uiLocale: 'en' }).locale, 'zh', 'UI locale cannot override replyLocale')
    assert.equal(service.replyOptions('default').locale, 'zh', 'replyLocale wins over host locale')
  } finally { service.dispose() }
})
