export type ReplyLanguage = 'zh' | 'en' | 'fr';
export interface ReplyOptions {
    locale?: string;
    uiLocale?: string;
    timeZone?: string;
    html?: string;
}
export function replyLanguage(value?: string): ReplyLanguage { return /^zh(?:-|$)/i.test(value || '') ? 'zh' : /^fr(?:-|$)/i.test(value || '') ? 'fr' : 'en'; }
const words = {
    zh: { from: '发件人', date: '时间', subject: '主题', to: '收件人', forward: '转发的邮件', unknownSender: '未知发件人', unknownDate: '未知时间', noSubject: '无主题', truncated: '原文过长，已截断' },
    en: { from: 'From', date: 'Date', subject: 'Subject', to: 'To', forward: 'Forwarded message', unknownSender: 'Unknown sender', unknownDate: 'Unknown date', noSubject: 'No subject', truncated: 'Original message truncated' },
    fr: { from: 'De', date: 'Date', subject: 'Objet', to: 'À', forward: 'Message transféré', unknownSender: 'Expéditeur inconnu', unknownDate: 'Date inconnue', noSubject: 'Sans objet', truncated: 'Message original tronqué' },
};
export function replyWords(locale?: string) { return words[replyLanguage(locale)]; }
export function replyDate(value: string, options: ReplyOptions = {}): string {
    const date = new Date(value), language = replyLanguage(options.locale);
    if (!Number.isFinite(date.getTime()))
        return words[language].unknownDate;
    return new Intl.DateTimeFormat(({ zh: 'zh-CN', en: 'en-GB', fr: 'fr-FR' } as const)[language], { dateStyle: 'medium', timeStyle: 'short', ...(options.timeZone ? { timeZone: options.timeZone } : {}) }).format(date);
}
export function attribution(date: string, sender: string, options: ReplyOptions = {}): string {
    const formatted = replyDate(date, options);
    switch (replyLanguage(options.locale)) {
        case 'zh': return '在 ' + formatted + '，' + sender + ' 写道：';
        case 'fr': return 'Le ' + formatted + ', ' + sender + ' a écrit :';
        default: return 'On ' + formatted + ', ' + sender + ' wrote:';
    }
}
