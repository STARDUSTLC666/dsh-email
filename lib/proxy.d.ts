/**
 * Proxy dialling for the mail transports.
 *
 * IMAP does not come through here: ImapFlow already negotiates HTTP CONNECT and
 * SOCKS through its own `proxy` option, so `createImap` hands the URL over and
 * lets that implementation do the work.
 *
 * SMTP does not have that luxury — nodemailer ships no proxy support at all —
 * but the plugin already owns the SMTP socket through its `getSocket` hook, so
 * this module supplies the one thing that hook is missing: a socket that
 * reaches the mail host *through* the proxy. The caller keeps doing its own TLS
 * upgrade, which is why the returned socket is the raw tunnel and never a TLS
 * one: the SMTP layer starts TLS on it with `servername` set to the real mail
 * host, so certificate validation still checks the host the user configured
 * rather than the proxy they happen to use.
 *
 * Where the proxy comes from: the account's `proxy` field first, then the
 * conventional environment variables. The fallback matters because a desktop
 * app started from Explorer inherits the machine's environment, and on a
 * machine whose traffic is already routed (Clash, a corporate MITM, a SOCKS
 * gateway) the account should not have to repeat the endpoint by hand.
 */
import { type Socket } from 'node:net';
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
}): Promise<Socket>;
