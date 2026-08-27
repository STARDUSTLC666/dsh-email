import type { AddressEntry, ReadMessageBody } from './types.js';
export declare function flattenAddresses(input: unknown): AddressEntry[];
/** Minimal, dependency-free HTML-to-text: block tags become newlines, tags are dropped, common entities decoded. */
export declare function stripHtml(html: string): string;
export declare function truncateText(text: string, maxChars: number): {
    text: string;
    truncated: boolean;
};
/**
 * Turn an untrusted attachment filename into a safe basename: no directory
 * separators, no traversal, no control characters, bounded length.
 */
export declare function sanitizeFilename(raw: unknown, fallback?: string): string;
/** Parse a raw RFC822 message source into the read-result body. */
export declare function parseRawMessage(source: Buffer, maxBodyChars: number): Promise<ReadMessageBody>;
