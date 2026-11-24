/**
 * Layered email server autodiscovery (offline-first, zero-credential, SSRF-hardened).
 *
 * Discovery order:
 * 1. Built-in provider domains (instant, offline)
 * 2. Curated offline extended provider database (instant, offline)
 * 3. DNS MX reverse-lookup for hosted corporate/custom-domain mailboxes
 * 4. DNS SRV (RFC 6186 / RFC 8314)
 * 5. Domain HTTPS Autoconfig XML (public domains only, via pinned public downloader)
 * 6. Mozilla Thunderbird ISPDB (public domains only, via pinned public downloader)
 *
 * Security boundaries:
 * - Never accepts or touches passwords, authorization codes, or OAuth tokens.
 * - Immediately strips everything before `@`; only the domain ever leaves the function.
 * - Private/internal/reserved domains (`!publicDnsName(domain)`) never trigger
 *   public HTTPS requests (domain autoconfig or Thunderbird ISPDB).
 * - Rejects plaintext (`socketType: plain`) endpoints and POP3 STARTTLS (`dsh-email`
 *   POP3 treats `secure: false` as plaintext, not STLS).
 * - Public discovery sources may only return public hostnames (never IP literals,
 *   loopback, or private/internal names).
 */
import type { MxRecord, SrvRecord } from 'node:dns';
import { type ProviderName } from './config.js';
export type AutodiscoverSource = 'builtin-domain' | 'offline-db' | 'mx' | 'srv' | 'domain-autoconfig' | 'ispdb';
export type DiscoveredProvider = ProviderName | 'agentmail' | 'agentmail-eu';
export interface DiscoveredEndpoint {
    host: string;
    port: number;
    secure: boolean;
}
export interface AutodiscoverResult {
    domain: string;
    source: AutodiscoverSource;
    /** Built-in provider ID when matched directly, via MX, or via known hostnames. */
    provider?: DiscoveredProvider;
    labelZh: string;
    labelEn: string;
    authKind: 'oauth2' | 'password';
    oauthProvider?: 'google' | 'microsoft';
    imap?: DiscoveredEndpoint;
    smtp?: DiscoveredEndpoint;
    pop3?: DiscoveredEndpoint;
    hintZh?: string;
    hintEn?: string;
    /** Layers attempted in order (source names only, no secrets or full addresses). */
    checked: AutodiscoverSource[];
}
export interface AutodiscoverDependencies {
    resolveMx?: (domain: string) => Promise<MxRecord[]>;
    resolveSrv?: (name: string) => Promise<SrvRecord[]>;
    queryPublicDnsJson?: (name: string, type: 15 | 33, signal: AbortSignal) => Promise<unknown>;
    fetchPublicXml?: (url: string, signal: AbortSignal) => Promise<string | undefined>;
}
export interface AutodiscoverOptions {
    signal?: AbortSignal;
    /** Allow HTTPS lookup against domain autoconfig & Thunderbird ISPDB for public domains. Default true. */
    allowOnlineLookup?: boolean;
    /** Per-step timeout in ms (clamped to 500–8000, default 4000). */
    stepTimeoutMs?: number;
    dependencies?: AutodiscoverDependencies;
}
interface ProviderTemplate {
    provider?: DiscoveredProvider;
    labelZh: string;
    labelEn: string;
    authKind?: 'oauth2' | 'password';
    oauthProvider?: 'google' | 'microsoft';
    imap?: DiscoveredEndpoint;
    smtp?: DiscoveredEndpoint;
    pop3?: DiscoveredEndpoint;
    hintZh?: string;
    hintEn?: string;
}
/**
 * Extract and validate only the domain part from an email address or bare domain.
 * Everything before `@` is discarded immediately and never leaves this function.
 */
export declare function extractDiscoveryDomain(input: string): string;
export declare function matchBuiltInDomain(domain: string): ProviderTemplate | undefined;
export declare function matchOfflineProvider(domain: string): ProviderTemplate | undefined;
export declare function matchMxRecords(records: readonly MxRecord[]): ProviderTemplate | undefined;
/**
 * Parse a Thunderbird Autoconfig v1.1 XML document into safe, TLS-only mail endpoints.
 *
 * Security rules:
 * - Rejects `socketType: plain` and unknown socket types (never recommends cleartext auth).
 * - Rejects `STARTTLS` for POP3 (dsh-email POP3 treats `secure: false` as plaintext).
 * - Rejects IP literals and non-public hostnames (prevents external XML from steering
 *   credentials toward localhost or intranet services).
 * - Prefers implicit TLS (`SSL`) over `STARTTLS`.
 */
export declare function parseAutoconfigXml(xml: string, domain: string): ProviderTemplate | undefined;
/** Parse bounded DoH JSON MX (type 15) answers; malformed records are ignored. */
export declare function parsePublicDnsMxAnswer(value: unknown, domain: string): MxRecord[];
/** Parse bounded DoH JSON SRV (type 33) answers; malformed records are ignored. */
export declare function parsePublicDnsSrvAnswer(value: unknown, name: string): SrvRecord[];
/**
 * Discover mail server configuration for an email address or domain.
 * Returns `null` when no layer produces a verified, TLS-encrypted endpoint.
 */
export declare function autodiscoverEmailServer(input: string, options?: AutodiscoverOptions): Promise<AutodiscoverResult | null>;
export {};
