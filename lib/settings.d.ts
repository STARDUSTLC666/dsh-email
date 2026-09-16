import z from 'schemastery';
import { type EmailConfig } from './config.js';
/** Settings-document namespace this plugin owns (editable from the Web settings page). */
export declare const SETTINGS_NAMESPACE = "dsh-email";
/**
 * The settings-page shape: the single default account plus shared policy.
 * The form edits the default/shorthand account; its advanced YAML area
 * edits named accounts through accountsYaml.
 */
export declare const EmailSettingsSchema: z<Schemastery.ObjectS<{
    provider: z<string, string>;
    user: z<string, string>;
    password: z<string, string>;
    inboxFolder: z<string, string>;
    sendApproval: z<boolean, boolean>;
    maxBodyChars: z<number, number>;
    downloadDir: z<string, string>;
    accountsYaml: z<string, string>;
    serverPresets: z<string, string>;
    imap: z<Schemastery.ObjectS<{
        host: z<string, string>;
        port: z<number, number>;
        secure: z<boolean, boolean>;
    }>, Schemastery.ObjectT<{
        host: z<string, string>;
        port: z<number, number>;
        secure: z<boolean, boolean>;
    }>>;
    smtp: z<Schemastery.ObjectS<{
        host: z<string, string>;
        port: z<number, number>;
        secure: z<boolean, boolean>;
    }>, Schemastery.ObjectT<{
        host: z<string, string>;
        port: z<number, number>;
        secure: z<boolean, boolean>;
    }>>;
}>, Schemastery.ObjectT<{
    provider: z<string, string>;
    user: z<string, string>;
    password: z<string, string>;
    inboxFolder: z<string, string>;
    sendApproval: z<boolean, boolean>;
    maxBodyChars: z<number, number>;
    downloadDir: z<string, string>;
    accountsYaml: z<string, string>;
    serverPresets: z<string, string>;
    imap: z<Schemastery.ObjectS<{
        host: z<string, string>;
        port: z<number, number>;
        secure: z<boolean, boolean>;
    }>, Schemastery.ObjectT<{
        host: z<string, string>;
        port: z<number, number>;
        secure: z<boolean, boolean>;
    }>>;
    smtp: z<Schemastery.ObjectS<{
        host: z<string, string>;
        port: z<number, number>;
        secure: z<boolean, boolean>;
    }>, Schemastery.ObjectT<{
        host: z<string, string>;
        port: z<number, number>;
        secure: z<boolean, boolean>;
    }>>;
}>>;
export interface EmailSettingsValue {
    provider: string;
    user: string;
    password: string;
    inboxFolder: string;
    sendApproval: boolean;
    maxBodyChars: number;
    downloadDir: string;
    accountsYaml: string;
    serverPresets?: string;
    imap: {
        host: string;
        port: number;
        secure: boolean;
    };
    smtp: {
        host: string;
        port: number;
        secure: boolean;
    };
}
/** Project the row config (cordis.patch.yml) into the settings-schema base shape. */
export declare function toSettingsBase(config: EmailConfig): Partial<EmailSettingsValue>;
/**
 * Project a settings value back into EmailConfig shape.
 *
 * `user` is the raw stored user section: only fields the user actually set
 * are projected, so schema defaults never shadow the row config or the
 * provider presets (choosing outlook must NOT force smtp port 465 over the
 * preset's 587). Pass `null` to project every field (draft paths).
 *
 * The value may also be *partial*: the settings page posts a draft, and the card
 * editor posts its own control bundle, from which JSON.stringify drops every key
 * it does not model — `provider` above all. A field the draft does not carry
 * means 「未设置」 and must be left out entirely: assigning `out.provider =
 * undefined` is NOT the same as omitting it, because an own key holding undefined
 * still wins in `{ ...rowConfig, ...toEmailConfig(value, null) }` and would erase
 * the row's provider (that produced 「未知的邮件服务商 undefined」 on a card whose
 * provider was plainly selected). Same normalization as toSettingsBase.
 */
export declare function toEmailConfig(value: EmailSettingsValue, user?: Partial<EmailSettingsValue> | null): EmailConfig;
/**
 * Gentle write-path validation: structural mistakes fail loudly, but an
 * incomplete account is allowed (tools report the actionable hint at call
 * time, so an unconfigured install never breaks boot).
 *
 * The value may be partial — the web route validates whatever the page posted,
 * and the card editor's own POST never carries the form fields. 「Missing」 is
 * 「未设置」 for every one of them, exactly as toEmailConfig projects them, so a
 * partial draft is validated only for the fields it actually has.
 *
 * `extraProviders` are the custom preset names in effect: the settings page's
 * provider dropdown offers them beside the 8 built-ins, so a value naming one
 * is a legal choice, not an unknown provider.
 */
export declare function validateSettingsValue(value: EmailSettingsValue, extraProviders?: readonly string[]): void;
