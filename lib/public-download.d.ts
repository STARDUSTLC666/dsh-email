import type { IncomingMessage } from 'node:http';
import { type PublicAddress } from './public-address.js';
export { publicAddress } from './public-address.js';
export { PublicDownloadError } from './public-dns.js';
export interface PublicDownloadDependencies {
    resolve?: (host: string, signal: AbortSignal) => Promise<PublicAddress[]>;
    request?: (url: URL, records: readonly PublicAddress[], signal: AbortSignal) => Promise<IncomingMessage>;
}
/** New sockets only: a shared agent must not reuse a differently resolved peer. */
export declare function requestPinnedPublic(url: URL, records: readonly PublicAddress[], signal: AbortSignal): Promise<IncomingMessage>;
/** Dependency seams are for embedders/tests; HTTP callers cannot supply them. */
export declare function createPublicDownloader(dependencies?: PublicDownloadDependencies): (input: string, cap: number, signal?: AbortSignal) => Promise<Buffer>;
/** Download a signed public HTTPS URL without API credentials; pin the validated DNS answers. */
export declare function downloadPublicBytes(input: string, cap: number, signal?: AbortSignal): Promise<Buffer>;
