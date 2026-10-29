import type { ConnectionOptions } from 'node:tls';
import type { ResolvedEmailConfig } from './config.js';
export declare class Pop3WireError extends Error {
}
export declare class Pop3CommandError extends Pop3WireError {
    readonly command: string;
    constructor(command: string);
}
export interface Pop3Wire {
    readonly signal: AbortSignal;
    command(name: string, args?: (string | number)[], limit?: number): Promise<{
        info: string;
        bytes?: Buffer;
    }>;
}
export interface Pop3WireOptions {
    tlsOptions?: Pick<ConnectionOptions, 'ca'>;
    timeoutMs?: number;
}
/** One exclusive, bounded session. No model-generated command or server error is returned. */
export declare function withPop3<T>(cfg: ResolvedEmailConfig, task: (wire: Pop3Wire) => Promise<T>, signal?: AbortSignal, options?: Pop3WireOptions): Promise<T>;
