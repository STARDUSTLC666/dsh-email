import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const NAMESPACE = 'dsh-email'

/**
 * A stand-in for the DSH locale runtime: language catalogue, namespace
 * dictionaries, `bind()` with fallback, and change notification. It mirrors the
 * official contract closely enough that a regression in the plugin's wiring
 * (missing addLanguage, wrong namespace, unbound translator) fails here.
 */
function createLocaleRuntime(active, hostLanguages = ['zh', 'en']) {
  let current = active
  let revision = 0
  const languages = hostLanguages.map(id => ({ id }))
  const dictionaries = new Map()
  const subscribers = new Set()
  const calls = { addLanguage: [], register: [], bind: [] }

  const notify = () => { revision += 1; for (const fn of subscribers) fn() }

  const service = {
    getSnapshot: () => ({ active: current, locales: languages.map(row => ({ ...row })), revision }),
    subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn) },
    addLanguage(language) {
      calls.addLanguage.push(language)
      if (!language || typeof language.id !== 'string' || language.id === '') throw new Error('addLanguage requires an id')
      if (languages.some(row => row.id === language.id)) throw new Error('duplicated language ' + language.id)
      languages.push({ ...language })
      notify()
      return () => {
        const index = languages.findIndex(row => row.id === language.id)
        if (index >= 0) languages.splice(index, 1)
        notify()
      }
    },
    register(namespace, locale, dictionary) {
      calls.register.push(namespace)
      if (typeof namespace !== 'string' || namespace === '') throw new Error('register requires a namespace')
      if (typeof locale !== 'string' || locale === '') throw new Error('register requires a locale id')
      if (!dictionary || typeof dictionary !== 'object') throw new Error('register requires a dictionary')
      const byLocale = dictionaries.get(namespace) ?? new Map()
      const owned = { ...dictionary }
      byLocale.set(locale, owned)
      dictionaries.set(namespace, byLocale)
      notify()
      return () => {
        const table = dictionaries.get(namespace)
        if (table?.get(locale) === owned) table.delete(locale)
      }
    },
    bind(namespace) {
      calls.bind.push(namespace)
      const table = dictionaries.get(namespace)
      if (!table) throw new Error('unknown namespace ' + namespace)
      // A regional tag resolves to the language it belongs to: ja-JP -> ja.
      const resolve = tag => {
        const wanted = String(tag ?? '').toLowerCase()
        if (table.has(wanted)) return wanted
        const prefix = [...table.keys()].find(id => wanted.startsWith(id.toLowerCase()))
        return prefix ?? 'en'
      }
      return key => {
        const direct = table.get(resolve(current))
        if (direct && Object.prototype.hasOwnProperty.call(direct, key)) return direct[key]
        const fallbackId = languages.find(row => row.id === resolve(current))?.fallback
        const fallback = fallbackId ? table.get(fallbackId) : undefined
        if (fallback && Object.prototype.hasOwnProperty.call(fallback, key)) return fallback[key]
        const english = table.get('en')
        if (english && Object.prototype.hasOwnProperty.call(english, key)) return english[key]
        return key
      }
    },
  }

  return {
    service,
    calls,
    get active() { return current },
    switchTo(locale) { current = locale; notify() },
    languages: () => languages.map(row => row.id),
    dictionary: (locale) => dictionaries.get(NAMESPACE)?.get(locale),
    namespaceCount: () => dictionaries.get(NAMESPACE)?.size ?? 0,
  }
}

function loadClient({ locale = 'zh-CN', hostLanguages = ['zh', 'en'], withLocale = true } = {}) {
  let client, definition
  const runtime = createLocaleRuntime(locale, hostLanguages)
  const disposers = []
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
    .replace(
      'return module.exports;',
      'module.exports.probe = { emailError, localeToLang, t, dt, formatDate, subscribeLocale, uiLanguage }; return module.exports;',
    )
  runInNewContext(source, {
    window: { __ModuleLoader__: { load({ factory }) { client = factory(() => ({})) } } },
    Intl,
    Date,
    AbortController,
  })
  const ctx = {
    ...(withLocale ? { get: () => runtime.service, locale: runtime.service } : { get: () => undefined }),
    effect(fn, label) {
      // The plugin wires locale via ctx.effect(..., 'dsh-email: locale'); other
      // effects touch DOM-backed widgets this harness does not model.
      if (typeof label === 'string' && label.endsWith(': locale')) disposers.push(fn())
    },
    slots: { inject(_name, fn) { fn() }, register(meta) { definition = meta } },
  }
  client.apply(ctx)
  return {
    client,
    definition,
    runtime,
    dispose() { for (const disposer of disposers) disposer() },
  }
}

test('host labels update before plugin subscribers and error guidance follows UI language', () => {
  const harness = loadClient({ locale: 'zh-CN' })
  assert.equal(harness.definition.label(), '邮件 (dsh-email)')
  harness.runtime.switchTo('en-US')
  assert.equal(harness.definition.label(), 'Email (dsh-email)')
  const guidance = harness.client.probe.emailError({ message: '发送结果不明，请先检查已发送邮件，不要重发' })
  assert.ok(guidance)
  assert.doesNotMatch(guidance, /[\u3400-\u9fff]/)
  assert.match(guidance, /resend|send again|check/i)
  assert.match(harness.client.probe.emailError('账号 "default" 的邮箱地址未填写'), /Account settings/)
  assert.match(harness.client.probe.emailError({ message: 'HTTP 401', status: 401 }), /session expired/)
  const locked = harness.client.probe.emailError('无法读取或解锁 OAuth2 登录数据：Windows 加密文件需原 Windows 账号；原文件未被覆盖。')
  assert.doesNotMatch(locked, /[\u3400-\u9fff]/)
  assert.match(locked, /original Windows user/)
  assert.match(locked, /Preserve and move aside oauth2-tokens.json/)
  assert.match(locked, /not overwritten/)
  const unavailable = harness.client.probe.emailError('无法安全保存 OAuth2 登录数据：未写入明文令牌。')
  assert.match(unavailable, /PowerShell \/ DPAPI/)
  assert.match(unavailable, /No plaintext tokens were written/)
  assert.match(harness.client.probe.emailError('无法读取 OAuth2 登录数据，请检查文件访问权限。原文件未被覆盖。'), /access permissions/)
  harness.runtime.switchTo('zh-CN')
  assert.equal(harness.definition.label(), '邮件 (dsh-email)')
  assert.match(harness.client.probe.emailError('发送结果不明，请先检查已发送邮件，不要重发'), /[\u3400-\u9fff]|HTTP 401/)
})

test('maps supported locales, regional tags and unknown locales safely', () => {
  const { client } = loadClient()
  const { localeToLang } = client.probe
  for (const [locale, expected] of [
    ['zh', 'zh'], ['zh-TW', 'zh'], ['en-US', 'en'], ['es', 'es'], ['es-MX', 'es'],
    ['fr-FR', 'fr'], ['de-DE', 'de'], ['ja-JP', 'ja'], ['pt-BR', 'pt'], ['ru-RU', 'ru'],
    ['it-IT', 'en'], ['', 'en'], [null, 'en'], [undefined, 'en'],
  ]) assert.equal(localeToLang(locale), expected, String(locale))
})

test('registers only the languages the host lacks, under the plugin namespace', () => {
  const harness = loadClient({ locale: 'en-US', hostLanguages: ['zh', 'en', 'ja'] })
  const added = harness.runtime.calls.addLanguage.map(row => row.id).sort()
  assert.deepEqual(added, ['de', 'es', 'fr', 'pt', 'ru'], 'ja is already provided by the host and must not be re-added')
  for (const language of harness.runtime.calls.addLanguage) {
    assert.equal(language.fallback, 'en', 'every added language falls back to English')
    assert.ok(language.label && language.label !== language.id, 'a display label ships with each language')
  }
  assert.deepEqual([...new Set(harness.runtime.calls.register)], [NAMESPACE])
  assert.deepEqual([...new Set(harness.runtime.calls.bind)], [NAMESPACE])
  assert.equal(harness.runtime.namespaceCount(), 8, 'all eight locales are registered in the namespace')
})

test('every supported locale ships a complete UI table with matching placeholders', () => {
  const harness = loadClient({ locale: 'en-US' })
  const english = harness.runtime.dictionary('en')
  const keys = Object.keys(english).filter(key => !key.startsWith('inline:'))
  assert.ok(keys.length >= 150, 'the UI dictionary covers the settings surface')

  const placeholders = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',')
  for (const language of ['zh', 'es', 'fr', 'de', 'ja', 'pt', 'ru']) {
    const table = harness.runtime.dictionary(language)
    assert.ok(table, `${language} must be registered`)
    const missing = keys.filter(key => !Object.prototype.hasOwnProperty.call(table, key))
    assert.deepEqual(missing, [], `${language} is missing UI keys: ${missing.join(', ')}`)
    const mismatched = keys.filter(key => placeholders(table[key]) !== placeholders(english[key]))
    assert.deepEqual(mismatched, [], `${language} changed placeholders in: ${mismatched.join(', ')}`)
  }
})

test('the completion layer really localizes the keys the first pass left in English', () => {
  const harness = loadClient({ locale: 'en-US' })
  const english = harness.runtime.dictionary('en')
  // Keys that were uncovered before the completion layer was added. They are the
  // regression signal: an English value here means the layer silently stopped
  // being merged, even though the table is still structurally complete.
  const sampled = ['card.nameHint', 'card.authKindHint', 'preset.footerHint', 'oauth.clientIdHint', 'global.hint', 'whale.more']
  for (const language of ['es', 'fr', 'de', 'ja', 'pt', 'ru']) {
    const table = harness.runtime.dictionary(language)
    const stillEnglish = sampled.filter(key => table[key] === english[key])
    assert.deepEqual(stillEnglish, [], `${language} still falls back to English for: ${stillEnglish.join(', ')}`)
  }
})

test('switching the host language re-translates UI keys and inline phrases', () => {
  const harness = loadClient({ locale: 'en-US', hostLanguages: ['zh', 'en', 'es', 'fr', 'de', 'ja', 'pt', 'ru'] })
  const { t, dt } = harness.client.probe

  assert.equal(t('common.cancel'), 'Cancel')
  assert.equal(dt('邮件', 'Email'), 'Email')

  harness.runtime.switchTo('ja-JP')
  assert.equal(t('common.cancel'), 'キャンセル')
  assert.equal(t('card.nameHint').includes('defaultAccount'), true)
  assert.notEqual(dt('邮件', 'Email'), 'Email')

  harness.runtime.switchTo('pt-BR')
  assert.equal(t('common.cancel'), 'Cancelar')
  harness.runtime.switchTo('zh-CN')
  assert.equal(t('common.cancel'), '取消')
  assert.equal(dt('邮件', 'Email'), '邮件')
})

test('inline phrases resolve through the bound namespace translator', () => {
  const harness = loadClient({ locale: 'de-DE', hostLanguages: ['zh', 'en', 'de'] })
  const { dt } = harness.client.probe
  const dictionary = harness.runtime.dictionary('de')
  const inlineKeys = Object.keys(dictionary).filter(key => key.startsWith('inline:'))
  assert.ok(inlineKeys.length >= 300, 'every dt() phrase is registered in the same namespace')
  // A translated phrase must come from the dictionary, not from the English source.
  const translated = inlineKeys.find(key => dictionary[key] !== key.slice('inline:'.length))
  assert.ok(translated, 'at least one inline phrase is translated')
  assert.equal(dt('原文', translated.slice('inline:'.length)), dictionary[translated])
})

test('every locale carries the same complete set of inline phrases', () => {
  const harness = loadClient({ locale: 'en-US' })
  const inlineKeys = locale => Object.keys(harness.runtime.dictionary(locale))
    .filter(key => key.startsWith('inline:'))
    .sort()
  const reference = inlineKeys('en')
  assert.ok(reference.length >= 300, 'the English table holds every phrase dt() can ask for')
  for (const language of ['es', 'fr', 'de', 'ja', 'pt', 'ru']) {
    assert.deepEqual(inlineKeys(language), reference, `${language} must cover the same inline phrases`)
  }
  // Chinese short-circuits before the translator and reads its source string, so
  // it deliberately carries no inline: keys.
  assert.deepEqual(inlineKeys('zh'), [])
  // Long sentences are the ones a partial first pass left in English; sampling
  // them catches a completion layer that stopped being merged.
  const english = harness.runtime.dictionary('en')
  const longKeys = reference.filter(key => key.length > 90)
  assert.ok(longKeys.length >= 20, 'the workbench has substantial prose to translate')
  for (const language of ['es', 'fr', 'de', 'ja', 'pt', 'ru']) {
    const table = harness.runtime.dictionary(language)
    const stillEnglish = longKeys.filter(key => table[key] === english[key])
    assert.deepEqual(stillEnglish, [], `${language} still returns English for ${stillEnglish.length} long phrases`)
  }
})

test('disposing the locale effect removes the registrations it created', () => {
  const harness = loadClient({ locale: 'en-US', hostLanguages: ['zh', 'en'] })
  assert.equal(harness.runtime.namespaceCount(), 8)
  harness.dispose()
  assert.equal(harness.runtime.namespaceCount(), 0, 'every namespace registration is disposed')
})

test('a host without a locale service keeps the built-in Chinese default', () => {
  const harness = loadClient({ withLocale: false, locale: 'en-US' })
  const { t, dt } = harness.client.probe
  assert.equal(t('common.cancel'), '取消')
  assert.equal(dt('邮件', 'Email'), '邮件')
  assert.equal(harness.runtime.calls.register.length, 0, 'no locale service means no registration attempt')
})

test('formats timestamps using the selected UI locale', () => {
  const harness = loadClient({ locale: 'en-US', hostLanguages: ['zh', 'en', 'es', 'fr', 'de', 'ja', 'pt', 'ru'] })
  const timestamp = '2026-06-01T13:45:00.000Z'
  const formatted = []
  for (const language of ['zh', 'en', 'es', 'fr', 'de', 'ja', 'pt', 'ru']) {
    harness.runtime.switchTo(language)
    formatted.push(harness.client.probe.formatDate(timestamp))
    assert.ok(harness.client.probe.formatDate(timestamp))
  }
  assert.ok(new Set(formatted).size > 1)
})
