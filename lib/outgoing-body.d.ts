/**
 * Resolve an inline-image reference against the attachments the caller passed in.
 * Only a file name (or path suffix) listed in `cids`, or `imgN` for the Nth attachment, is
 * accepted, so untrusted HTML can never point at data:, file: or remote resources.
 */
export declare function resolveInlineCid(source: unknown, cids: string[]): string | undefined;
export interface OutgoingHtmlOptions {
    /** File names of the attachments this message carries, in attachment order. */
    cids?: string[];
}
/** No scripts, remote resources, file URLs or active attributes are sent or previewed. */
export declare function sanitizeOutgoingHtml(value: unknown, options?: OutgoingHtmlOptions): string;
export declare function prepareMailBody(text: unknown, html?: unknown, options?: OutgoingHtmlOptions): {
    text: string;
    html?: string;
};
