import { parseDocument } from 'htmlparser2';
const allowed = new Set('p div span br hr strong b em i u s del blockquote pre code ul ol li h1 h2 h3 h4 h5 h6 table thead tbody tfoot tr td th a'.split(' '));
const discard = new Set('script style head title iframe frame frameset object embed svg math form input button textarea select option template noscript audio video source link meta base'.split(' '));
const cid = (value) => value.trim().replace(/^<|>$/g, '');
export function safeMailLink(value) {
    try {
        const url = new URL(value);
        if (!['https:', 'http:', 'mailto:'].includes(url.protocol) || url.username || url.password || /[\u0000-\u001f\u007f]/.test(value))
            return;
        return url.href.slice(0, 4096);
    }
    catch {
        return;
    }
}
/** Parse into React data, never sanitized HTML or an executable DOM. */
export function richEmailBody(html, attachments = []) {
    if (typeof html !== 'string' || !html.trim())
        return;
    if (Buffer.byteLength(html, 'utf8') > 256 * 1024)
        return { nodes: [], images: [], limited: true };
    const result = { nodes: [], images: [], limited: false };
    let count = 0, chars = 0;
    function visit(nodes, depth) {
        const out = [];
        if (depth > 32) {
            result.limited = true;
            return out;
        }
        for (const node of nodes) {
            if (++count > 5000 || chars >= 100000) {
                result.limited = true;
                break;
            }
            if (node.type === 'text') {
                const text = String(node.data).slice(0, 100000 - chars);
                chars += text.length;
                out.push(text);
                continue;
            }
            const tag = String(node.name || '').toLowerCase();
            if (discard.has(tag) || node.type === 'comment')
                continue;
            if (tag === 'img') {
                const src = String(node.attribs?.src || '').trim(), alt = String(node.attribs?.alt || '').slice(0, 300);
                if (result.images.length >= 40) {
                    result.limited = true;
                    continue;
                }
                let image;
                if (/^cid:/i.test(src)) {
                    let id = src.slice(4);
                    try {
                        id = decodeURIComponent(id);
                    }
                    catch { }
                    const index = attachments.findIndex(a => a.contentId && cid(a.contentId) === cid(id));
                    if (index >= 0)
                        image = { kind: 'inline', alt, source: '', attachment: index };
                }
                else if (/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=\r\n]+$/i.test(src))
                    image = { kind: 'inline', alt, source: src };
                else {
                    try {
                        const url = new URL(src);
                        if (url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && src.length <= 4096)
                            image = { kind: 'remote', alt, source: url.href };
                    }
                    catch { }
                }
                if (image) {
                    out.push({ tag: 'img', image: result.images.length });
                    result.images.push(image);
                }
                else
                    out.push(alt ? '[' + alt + ']' : '[图片不可用 / Image unavailable]');
                continue;
            }
            const children = visit(node.children || [], depth + 1);
            if (!allowed.has(tag)) {
                out.push(...children);
                continue;
            }
            const safe = { tag, children };
            if (tag === 'a')
                safe.href = safeMailLink(String(node.attribs?.href || ''));
            if (tag === 'td' || tag === 'th') {
                const span = Number(node.attribs?.colspan);
                if (Number.isInteger(span) && span > 1 && span <= 20)
                    safe.span = span;
            }
            out.push(safe);
        }
        return out;
    }
    try {
        result.nodes = visit(parseDocument(html).children, 0);
        return result;
    }
    catch {
        return { nodes: [], images: [], limited: true };
    }
}
/** Only raster formats are displayable; SVG and HTML remain download-only. */
export function rasterMime(bytes) {
    if (bytes.length < 12 || bytes.length > 2 * 1024 * 1024)
        return;
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
        return 'image/png';
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
        return 'image/jpeg';
    if (['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6)))
        return 'image/gif';
    if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP')
        return 'image/webp';
}
