import type { OAuth2TokenStore } from './oauth2.js';
export declare const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export declare const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export declare const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
export declare const GOOGLE_MAIL_SCOPE = "https://mail.google.com/";
export interface GoogleAccount {
    user: string;
    clientId?: string;
    clientSecret?: string;
    oauthProvider?: 'google' | 'microsoft';
}
interface Repository {
    read(): OAuth2TokenStore;
    write(value: OAuth2TokenStore): void;
}
interface Dependencies {
    fetch?: typeof fetch;
    now?: () => number;
}
export declare class GoogleOAuthError extends Error {
}
export declare class GoogleOAuth {
    private readonly repo;
    private readonly flows;
    private readonly starts;
    private readonly refreshing;
    private readonly generation;
    private readonly fetcher;
    private now;
    constructor(repo: Repository, dependencies?: Dependencies);
    private close;
    cancel(name: string): void;
    dispose(): void;
    state(name: string, cfg: GoogleAccount): {
        state: 'none' | 'pending' | 'logged-in';
        user?: string;
    };
    start(name: string, cfg: GoogleAccount, current?: () => GoogleAccount | undefined): Promise<{
        url: string;
        expiresIn: number;
    }>;
    private json;
    private validAccess;
    private complete;
    poll(name: string, cfg: GoogleAccount): {
        status: 'pending' | 'ok';
        user?: string;
    };
    accessToken(name: string, cfg: GoogleAccount, force?: boolean): Promise<string>;
}
export {};
