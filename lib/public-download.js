import { lookup } from 'node:dns/promises';
import { get } from 'node:https';
import { isIP } from 'node:net';
export function publicAddress(address) {
    const lower = address.toLowerCase();
    if (isIP(lower) === 4) {
        const [a, b] = lower.split('.').map(Number);
        return !(a === 0 ||
            a === 10 ||
            a === 127 ||
            a >= 224 ||
            (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && (b === 168 || b === 0)) ||
            (a === 100 && b >= 64 && b <= 127) ||
            (a === 198 && (b === 18 || b === 19)));
    }
    // Global IPv6 unicast only. Mapped/compatible IPv4, loopback, local and multicast are rejected.
    return (isIP(lower) === 6 && /^[23]/.test(lower) && !lower.startsWith('2001:db8:'));
}
/** Download a signed public HTTPS URL without API credentials; pin the validated DNS answers. */
export async function downloadPublicBytes(input, cap, signal, redirects = 0) {
    const url = new URL(input);
    if (url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        (url.port && url.port !== '443') ||
        redirects > 2)
        throw new Error('附件下载地址不受支持');
    const host = url.hostname.replace(/^\[|\]$/g, ''), records = isIP(host)
        ? [{ address: host, family: isIP(host) }]
        : await lookup(host, { all: true });
    if (!records.length ||
        records.some((record) => !publicAddress(record.address)))
        throw new Error('附件下载地址必须指向公网 HTTPS 服务');
    const active = AbortSignal.any([
        ...(signal ? [signal] : []),
        AbortSignal.timeout(30000),
    ]);
    const res = await new Promise((resolve, reject) => {
        const req = get(url, {
            signal: active,
            lookup: ((_host, options, cb) => {
                if (options.all)
                    cb(null, records);
                else
                    cb(null, records[0].address, records[0].family);
            }),
        }, resolve);
        req.once('error', reject);
    });
    if ([301, 302, 303, 307, 308].includes(res.statusCode ?? 0) &&
        res.headers.location) {
        res.destroy();
        return downloadPublicBytes(new URL(res.headers.location, url).href, cap, active, redirects + 1);
    }
    if (res.statusCode !== 200) {
        res.destroy();
        throw new Error('附件下载失败，请稍后重试');
    }
    const chunks = [];
    let size = 0;
    try {
        for await (const chunk of res) {
            active.throwIfAborted();
            const bytes = Buffer.from(chunk);
            size += bytes.length;
            if (size > cap)
                throw new Error('附件超过下载大小上限');
            chunks.push(bytes);
        }
    }
    finally {
        res.destroy();
    }
    return Buffer.concat(chunks);
}
