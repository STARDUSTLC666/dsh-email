/** No scripts, remote resources, file URLs or active attributes are sent or previewed. */
export declare function sanitizeOutgoingHtml(value: unknown): string;
export declare function prepareMailBody(text: unknown, html?: unknown): {
    text: string;
    html?: string;
};
