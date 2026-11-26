import { type Socket } from 'node:net';
import { type ConnectionOptions } from 'node:tls';
/** Schemes `parseProxyUrl` accepts, in the spelling the user writes them. */
export declare const PROXY_SCHEMES: readonly ["http", "https", "socks", "socks4", "socks4a", "socks5", "socks5h"];
/**
 * Read a proxy address the way a user writes one.
 *
 * `127.0.0.1:7897` is what people paste, so a missing scheme means `http` (the
 * CONNECT-flavoured HTTP proxy every desktop client ships) rather than a URL
 * parse failure. Credentials stay in the URL because both schemes authenticate
 * with them.
 */
export declare function parseProxyUrl(value: string | null | undefined): URL | undefined;
/**
 * The proxy this account should use, or undefined for a direct connection.
 *
 * An explicit `proxy` wins even when `NO_PROXY` matches: the user typed it for
 * this account, so the environment's bypass list must not quietly ignore it.
 */
export declare function resolveProxyUrl(explicit: string | null | undefined, env?: NodeJS.ProcessEnv, host?: string): string | undefined;
/**
 * A raw socket to `host:port` reached through `proxy`.
 *
 * The returned socket is not yet encrypted: an SMTP/POP3 caller upgrades it
 * itself (with `servername` set to `host`) when the endpoint is a TLS one.
 */
export declare function openProxiedSocket(proxy: string | URL, host: string, port: number, options?: {
    timeoutMs?: number;
    signal?: AbortSignal;
    tls?: Pick<ConnectionOptions, 'ca' | 'rejectUnauthorized'>;
}): Promise<Socket>;
export interface FetchWithProxyOptions {
    env?: NodeJS.ProcessEnv;
    directFetch?: typeof fetch;
    tls?: Pick<ConnectionOptions, 'ca' | 'rejectUnauthorized'>;
    timeoutMs?: number;
}
/**
 * Fetch an HTTP(S) URL while honouring the same proxy rules as IMAP/SMTP:
 * account/global `proxy` first, `'direct'` to bypass, then `HTTPS_PROXY` /
 * `HTTP_PROXY` / `ALL_PROXY` (respecting `NO_PROXY` and loopback targets).
 *
 * Uses Node's built-in `http`/`https`/`tls` over `openProxiedSocket` so HTTP,
 * HTTPS and SOCKS4/4a/5/5h proxies all work with zero extra dependencies and
 * full TLS certificate validation (including OS CA roots).
 */
export declare function fetchWithProxy(input: string | URL, init: RequestInit | undefined, explicitProxy?: string | null, options?: FetchWithProxyOptions): Promise<Response>;
