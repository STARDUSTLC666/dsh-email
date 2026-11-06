export type ReplyLanguage = 'zh' | 'en' | 'fr';
export interface ReplyOptions {
    locale?: string;
    uiLocale?: string;
    timeZone?: string;
    html?: string;
}
export declare function replyLanguage(value?: string): ReplyLanguage;
export declare function replyWords(locale?: string): {
    from: string;
    date: string;
    subject: string;
    to: string;
    forward: string;
    unknownSender: string;
    unknownDate: string;
    noSubject: string;
    truncated: string;
} | {
    from: string;
    date: string;
    subject: string;
    to: string;
    forward: string;
    unknownSender: string;
    unknownDate: string;
    noSubject: string;
    truncated: string;
} | {
    from: string;
    date: string;
    subject: string;
    to: string;
    forward: string;
    unknownSender: string;
    unknownDate: string;
    noSubject: string;
    truncated: string;
};
export declare function replyDate(value: string, options?: ReplyOptions): string;
export declare function attribution(date: string, sender: string, options?: ReplyOptions): string;
