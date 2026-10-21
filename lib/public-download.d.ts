export declare function publicAddress(address: string): boolean;
/** Download a signed public HTTPS URL without API credentials; pin the validated DNS answers. */
export declare function downloadPublicBytes(input: string, cap: number, signal?: AbortSignal, redirects?: number): Promise<Buffer>;
