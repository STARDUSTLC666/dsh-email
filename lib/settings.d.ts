import z from 'schemastery';
import { type EmailConfig } from './config.js';
/** Settings-document namespace this plugin owns (editable from the Web settings page). */
export declare const SETTINGS_NAMESPACE = "dsh-email";
/**
 * The settings-page shape: the single default account plus shared policy.
 * Multi-account (`accounts` map) stays YAML-only; the page edits the
 * default/shorthand account.
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
 */
export declare function toEmailConfig(value: EmailSettingsValue, user?: Partial<EmailSettingsValue> | null): EmailConfig;
/**
 * Gentle write-path validation: structural mistakes fail loudly, but an
 * incomplete account is allowed (tools report the actionable hint at call
 * time, so an unconfigured install never breaks boot).
 */
export declare function validateSettingsValue(value: EmailSettingsValue): void;
