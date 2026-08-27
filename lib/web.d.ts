import { type EmailSettingsValue } from './settings.js';
import { type EmailConfig } from './config.js';
/** Same-origin route the browser settings section talks to. */
export declare const SETTINGS_ROUTE = "/_dsh/dsh-email/settings";
/**
 * Browser-facing backend: snapshot the settings namespace, save it with
 * optimistic concurrency, and test a draft account over a live IMAP login.
 */
export declare class EmailSettingsBackend {
    private readonly ctx;
    private readonly scope;
    private readonly rowConfig;
    constructor(ctx: any, scope: any, rowConfig: EmailConfig);
    private userSection;
    /** Effective config for the stored value (row + user-set fields only). */
    private effectiveStored;
    snapshot(): Promise<{
        settings: {
            value: EmailSettingsValue;
            revision: any;
            applies: any;
        };
        writable: boolean;
        accounts: string[];
    }>;
    private effectiveAccounts;
    save(value: EmailSettingsValue, expectedRevision: number): Promise<{
        settings: {
            value: EmailSettingsValue;
            revision: any;
            applies: any;
        };
        writable: boolean;
        accounts: string[];
    }>;
    test(value: EmailSettingsValue): Promise<{
        ok: boolean;
        ms: number;
    }>;
    responseJson(res: any, status: number, body: unknown): void;
    handle(req: any, res: any): Promise<void>;
}
/** Mount the same-origin route when a webServer service is present. */
export declare function installEmailSettingsWeb(ctx: any, backend: EmailSettingsBackend): void;
