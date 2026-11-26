import { parseDocument } from 'htmlparser2';
import { stripHtml } from './parse.js';
import { safeMailLink } from './rich-body.js';
import { escapeMailHtml, mailStyles } from './mail-html.js';
const allowed = new Set('p div span br hr strong b em i u s del blockquote pre code ul ol li h1 h2 h3 h4 h5 h6 table thead tbody tfoot tr td th a'.split(' '));
const discard = new Set('script style head title iframe frame frameset object embed svg math form input button textarea select option template noscript audio video source link meta base'.split(' '));

const inlineCidPattern = /^cid:(.+)$/i;
function fileNameOf(value: string): string {
    const parts = value.split(/[\\/]/);
    return parts[parts.length - 1] || value;
}
/**
 * Resolve an inline-image reference against the attachments the caller passed in.
 * Only a file name (or path suffix) listed in `cids`, or `imgN` for the Nth attachment, is
 * accepted, so untrusted HTML can never point at data:, file: or remote resources.
 */
export function resolveInlineCid(source: unknown, cids: string[]): string | undefined {
    if (typeof source !== 'string' || cids.length === 0)
        return undefined;
    const match = inlineCidPattern.exec(source.trim());
    if (!match)
        return undefined;
    let raw = match[1].trim().replace(/^<|>$/g, '');
    if (!raw)
        return undefined;
    try {
        raw = decodeURIComponent(raw);
    }
    catch {
        /* keep the literal reference */
    }
    const indexed = /^img(\d+)$/i.exec(raw);
    if (indexed) {
        const index = Number(indexed[1]);
        return index >= 1 && index <= cids.length ? 'img' + index : undefined;
    }
    const wanted = [raw, fileNameOf(raw)].map(value => value.toLowerCase());
    const found = cids.findIndex(name => wanted.includes(name.toLowerCase()));
    return found === -1 ? undefined : 'img' + (found + 1);
}

export interface OutgoingHtmlOptions {
    /** File names of the attachments this message carries, in attachment order. */
    cids?: string[];
}
/** No scripts, remote resources, file URLs or active attributes are sent or previewed. */
export function sanitizeOutgoingHtml(value: unknown, options: OutgoingHtmlOptions = {}): string {
    if (typeof value !== 'string' || Buffer.byteLength(value) > 256 * 1024)
        throw new Error('HTML 正文必须是文本，最多 256 KiB / HTML must be text, at most 256 KiB');
    let count = 0;
    function visit(nodes: any[], depth: number): string {
        if (depth > 32)
            throw new Error('HTML 嵌套过深 / HTML nesting is too deep');
        return nodes.map(node => {
            if (++count > 5000)
                throw new Error('HTML 元素过多 / Too many HTML elements');
            if (node.type === 'text')
                return escapeMailHtml(String(node.data));
            const tag = String(node.name || '').toLowerCase();
            if (node.type === 'comment' || discard.has(tag))
                return '';
            if (tag === 'img') {
                const cid = resolveInlineCid(node.attribs?.src, (options.cids ?? []).slice());
                if (!cid)
                    return escapeMailHtml(String(node.attribs?.alt || ''));
                const imageAttrs = ['src="cid:' + cid + '"'];
                // Fall back to the attachment name so a client without HTML still learns what the
                // picture was, even when the caller wrote <img src="cid:x.png"> with no alt.
                const name = options.cids?.[Number(cid.slice(3)) - 1] ?? '';
                const alt = String(node.attribs?.alt || '') || name;
                if (alt)
                    imageAttrs.push('alt="' + escapeMailHtml(alt) + '"');
                for (const key of ['width', 'height']) {
                    const size = Number(node.attribs?.[key]);
                    if (Number.isInteger(size) && size >= 2 && size <= 2000)
                        imageAttrs.push(key + '="' + size + '"');
                }
                return '<img ' + imageAttrs.join(' ') + '>';
            }
            const childNodes = node.children || [];
            let children: string;
            if (tag === 'table') {
                const parts: string[] = [], rows: any[] = [];
                const flush = () => {
                    if (rows.length) {
                        parts.push('<tbody>' + visit(rows.splice(0), depth + 1) + '</tbody>');
                    }
                };
                for (const child of childNodes) {
                    if (child.name === 'tr' || rows.length && child.type === 'text' && !String(child.data).trim())
                        rows.push(child);
                    else {
                        flush();
                        parts.push(visit([child], depth + 1));
                    }
                }
                flush();
                children = parts.join('');
            }
            else
                children = visit(childNodes, depth + 1);
            if (!allowed.has(tag))
                return children;
            const attrs: string[] = [], styles = mailStyles(node.attribs?.style);
            if (Object.keys(styles).length)
                attrs.push('style="' + escapeMailHtml(Object.entries(styles).map(([name, val]) => name.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) + ':' + val).join(';')) + '"');
            if (tag === 'a') {
                const href = safeMailLink(String(node.attribs?.href || ''));
                if (href)
                    attrs.push('href="' + escapeMailHtml(href) + '" rel="noopener noreferrer"');
            }
            if (tag === 'th' || tag === 'td')
                for (const key of ['colspan', 'rowspan']) {
                    const n = Number(node.attribs?.[key]);
                    if (Number.isInteger(n) && n > 1 && n <= 20)
                        attrs.push(key + '="' + n + '"');
                }
            return '<' + tag + (attrs.length ? ' ' + attrs.join(' ') : '') + '>' + (['br', 'hr'].includes(tag) ? '' : children + '</' + tag + '>');
        }).join('');
    }
    return visit(parseDocument(value).children, 0);
}
/**
 * Plain-text alternative for a body that is only markup (typically a lone inline image).
 * Without it a text-only client would show an empty message and `text` would be ''.
 */
function plainFallback(safe: string, options: OutgoingHtmlOptions): string {
    const stripped = stripHtml(safe);
    if (stripped.trim())
        return stripped;
    const names = [...safe.matchAll(/src="cid:img(\d+)"/g)]
        .map(match => options.cids?.[Number(match[1]) - 1])
        .filter((name): name is string => typeof name === 'string' && name !== '');
    if (names.length)
        return names.map(name => '[' + name + ']').join(' ');
    return safe.trim() ? '（本邮件为 HTML 正文，请用支持 HTML 的客户端查看）' : '';
}

export function prepareMailBody(text: unknown, html?: unknown, options: OutgoingHtmlOptions = {}): {
    text: string;
    html?: string;
} {
    if (text !== undefined && typeof text !== 'string')
        throw new Error('text 必须是文本 / text must be a string');
    if (html === undefined || html === '')
        return { text: text as string || '' };
    const safe = sanitizeOutgoingHtml(html, options);
    const plain = typeof text === 'string' && text.trim() ? text : plainFallback(safe, options);
    if (!safe.trim() && !plain.trim())
        throw new Error('邮件正文为空 / The message body is empty');
    return { text: plain, ...(safe.trim() ? { html: safe } : {}) };
}
