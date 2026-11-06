import { parseDocument } from 'htmlparser2';
import { stripHtml } from './parse.js';
import { safeMailLink } from './rich-body.js';
import { escapeMailHtml, mailStyles } from './mail-html.js';
const allowed = new Set('p div span br hr strong b em i u s del blockquote pre code ul ol li h1 h2 h3 h4 h5 h6 table thead tbody tfoot tr td th a'.split(' '));
const discard = new Set('script style head title iframe frame frameset object embed svg math form input button textarea select option template noscript audio video source link meta base'.split(' '));
/** No scripts, remote resources, file URLs or active attributes are sent or previewed. */
export function sanitizeOutgoingHtml(value) {
    if (typeof value !== 'string' || Buffer.byteLength(value) > 256 * 1024)
        throw new Error('HTML 正文必须是文本，最多 256 KiB / HTML must be text, at most 256 KiB');
    let count = 0;
    function visit(nodes, depth) {
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
            if (tag === 'img')
                return escapeMailHtml(String(node.attribs?.alt || ''));
            const childNodes = node.children || [];
            let children;
            if (tag === 'table') {
                const parts = [], rows = [];
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
            const attrs = [], styles = mailStyles(node.attribs?.style);
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
export function prepareMailBody(text, html) {
    if (text !== undefined && typeof text !== 'string')
        throw new Error('text 必须是文本 / text must be a string');
    if (html === undefined || html === '')
        return { text: text || '' };
    const safe = sanitizeOutgoingHtml(html);
    const plain = typeof text === 'string' && text.trim() ? text : stripHtml(safe);
    if (!safe.trim() && !plain.trim())
        throw new Error('邮件正文为空 / The message body is empty');
    return { text: plain, ...(safe.trim() ? { html: safe } : {}) };
}
