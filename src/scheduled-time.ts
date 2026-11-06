/** Require an explicit offset, avoiding host/browser timezone guesses. */
export function scheduledTime(value: unknown, now?: number): string {
    if (typeof value !== 'string' || value.length > 40 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))
        throw new Error('定时时间须包含时区，例如 2026-11-10T09:00:00+08:00 / Scheduled time needs an explicit timezone');
    const [year, month, day] = value.slice(0, 10).split('-').map(Number), time = Date.parse(value);
    if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate() || !Number.isFinite(time))
        throw new Error('定时时间无效 / Invalid scheduled time');
    if (now !== undefined && (time < now + 30000 || time > now + 365 * 86400000))
        throw new Error('请选择至少 30 秒后、365 天内的发送时间 / Choose a time 30 seconds to 365 days ahead');
    return new Date(time).toISOString();
}
