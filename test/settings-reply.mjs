// Content-focused tests inspect the server-restorable draft after checking the
// HTTP status. Raw wire confidentiality is asserted separately in secrets tests.
import { openSettingsText, openSettingsValue } from '../lib/settings-secrets.js'

export function inspectSettingsReply(body) {
  const result = structuredClone(body)
  if (result.value?.settings?.value) result.value.settings.value = openSettingsValue(result.value.settings.value)
  if (typeof result.value?.accountsYaml === 'string') result.value.accountsYaml = openSettingsText('accountsYaml', result.value.accountsYaml)
  return result
}
