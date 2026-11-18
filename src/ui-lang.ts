/**
 * Host-side UI language for this plugin's own text (tool output and the
 * configuration errors that reach the model).
 *
 * The host only knows one persisted language preference: the reply locale
 * (`auto` means "follow the interface", otherwise zh/en/fr). English is the
 * default rather than Chinese, so host messages match the client UI, which also
 * defaults to English.
 * @param settings - effective plugin settings, when the caller has them.
 * @returns 'zh' for an explicit Chinese preference, 'en' otherwise.
 */
export function uiLanguageOf(settings?: { replyLocale?: string } | undefined): 'zh' | 'en' {
  return /^zh(?:-|$)/i.test(String(settings?.replyLocale ?? '').trim()) ? 'zh' : 'en'
}

/** Pick the copy that matches the resolved UI language. */
export function uiText(settings: { replyLocale?: string } | undefined, zh: string, en: string): string {
  return uiLanguageOf(settings) === 'zh' ? zh : en
}
