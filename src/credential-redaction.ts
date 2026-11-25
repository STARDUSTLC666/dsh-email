/**
 * Remove credential syntax from provider/transport diagnostics before display.
 * OAuth credentials may be opaque rather than JWTs or long base64 strings.
 * JWT/base64 replacements retain their length for diagnostics.
 */
export function redactCredentials(text: string): string {
  return text
    // Network libraries may quote a proxy or transport URL verbatim in an
    // error. Both the user and password may be credentials. Match the last @
    // inside the authority (a password may itself contain an unescaped @),
    // without consuming an @ that belongs to a path, query or fragment.
    .replace(/\b([a-z][a-z0-9+.-]*:\/\/)[^\/\s?#]+@/gi, '$1<已隐去的凭据>@')
    .replace(/\b(Bearer)([ \t]+)[A-Za-z0-9._~+\/-]+=*/gi, '$1$2<已隐去的令牌>')
    .replace(/(["']?(?:password|passwd|auth[_-]?password|client[_-]?secret|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token)["']?)(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s;,)]+)/gi, '$1$2<已隐去的凭据>')
    .replace(/[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{8,}/g, match => `<已隐去 ${match.length} 字符的令牌>`)
    .replace(/[A-Za-z0-9+/]{40,}={0,2}/g, match => `<已隐去 ${match.length} 字符的凭据>`)
}
