import type { EmailAttachmentMeta, EmailRichBody } from './types.js';
export declare function safeMailLink(value: string): string | undefined;
/** Parse into React data, never sanitized HTML or an executable DOM. */
export declare function richEmailBody(html: unknown, attachments?: EmailAttachmentMeta[], styles?: boolean): EmailRichBody | undefined;
/** Only raster formats are displayable; SVG and HTML remain download-only. */
export declare function rasterMime(bytes: Buffer): string | undefined;
