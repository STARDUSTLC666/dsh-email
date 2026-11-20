/**
 * Remove credential syntax from provider/transport diagnostics before display.
 * OAuth credentials may be opaque rather than JWTs or long base64 strings.
 * JWT/base64 replacements retain their length for diagnostics.
 */
export declare function redactCredentials(text: string): string;
