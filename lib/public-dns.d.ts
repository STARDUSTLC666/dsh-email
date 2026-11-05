import { type PublicAddress } from './public-address.js';
export declare class PublicDownloadError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare function withAbort<T>(pending: Promise<T>, signal: AbortSignal): Promise<T>;
/** Do not send private, single-label or reserved names to a public resolver. */
export declare function publicDnsName(host: string): boolean;
/** A strict, bounded subset of the resolver's documented JSON response. */
export declare function parsePublicDnsAnswer(value: unknown, host: string, type: 1 | 28): PublicAddress[];
/** Fixed public bootstrap addresses avoid asking the Fake-IP resolver about itself. */
export declare function queryPublicDns(host: string, signal: AbortSignal): Promise<PublicAddress[]>;
export interface PublicDnsDependencies {
    lookup?: (host: string) => Promise<PublicAddress[]>;
    query?: (host: string, signal: AbortSignal) => Promise<PublicAddress[]>;
}
export declare function resolvePublicAddresses(host: string, signal: AbortSignal, dependencies?: PublicDnsDependencies): Promise<PublicAddress[]>;
