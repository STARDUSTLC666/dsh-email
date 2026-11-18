/** Require an explicit offset, avoiding host/browser timezone guesses. */
export function scheduledTime(value, now) {
    if (typeof value !== 'string' || value.length > 40 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))
        throw new Error('Scheduled time needs an explicit timezone, for example 2026-11-10T09:00:00+08:00');
    const [year, month, day] = value.slice(0, 10).split('-').map(Number), time = Date.parse(value);
    if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate() || !Number.isFinite(time))
        throw new Error('Invalid scheduled time');
    if (now !== undefined && (time < now + 30000 || time > now + 365 * 86400000))
        throw new Error('Choose a send time between 30 seconds and 365 days ahead');
    return new Date(time).toISOString();
}
