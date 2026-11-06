/** Google native desktop OAuth: PKCE, loopback callback and issuer-bound tokens. */
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { OAuth2TokenEntry, OAuth2TokenStore } from './oauth2.js';
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
export const GOOGLE_MAIL_SCOPE = 'https://mail.google.com/';
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
interface Flow {
    binding: string;
    cfg: GoogleAccount;
    state: string;
    verifier: string;
    redirect: string;
    url: string;
    expires: number;
    server: Server;
    timer: ReturnType<typeof setTimeout>;
    status: 'pending' | 'processing' | 'ok' | 'failed';
    message?: string;
    current?: () => GoogleAccount | undefined;
}
export class GoogleOAuthError extends Error {
}
const binding = (cfg: GoogleAccount) => JSON.stringify([cfg.user.trim().toLowerCase(), cfg.clientId?.trim(), cfg.clientSecret || '']);
const client = (cfg: GoogleAccount) => {
    const id = cfg.clientId?.trim() || '';
    if (!/^[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(id))
        throw new GoogleOAuthError('请在 Google Cloud 创建 Desktop app 客户端，并填写 Google 客户端 ID / Enter a Google Desktop app client ID');
    return id;
};
const matches = (entry: OAuth2TokenEntry | undefined, cfg: GoogleAccount): entry is OAuth2TokenEntry => entry?.provider === 'google' && entry.clientId === cfg.clientId?.trim() && entry.user.trim().toLowerCase() === cfg.user.trim().toLowerCase();
const response = (res: ServerResponse, status: number, message: string) => { res.writeHead(status, { 'content-type': 'text/plain;charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; frame-ancestors 'none'", 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff' }); res.end(message); };
export class GoogleOAuth {
    private readonly flows = new Map<string, Flow>();
    private readonly starts = new Map<string, {
        binding: string;
        task: Promise<{
            url: string;
            expiresIn: number;
        }>;
    }>();
    private readonly refreshing = new Map<string, Promise<string>>();
    private readonly generation = new Map<string, number>();
    private readonly fetcher: typeof fetch;
    private now: () => number;
    constructor(private readonly repo: Repository, dependencies: Dependencies = {}) { this.fetcher = dependencies.fetch ?? ((input, init) => globalThis.fetch(input, init)); this.now = dependencies.now ?? Date.now; }
    private close(flow: Flow): void { clearTimeout(flow.timer); flow.server.close(); flow.server.closeIdleConnections?.(); }
    cancel(name: string): void {
        this.generation.set(name, (this.generation.get(name) || 0) + 1);
        const flow = this.flows.get(name);
        if (flow)
            this.close(flow);
        this.flows.delete(name);
    }
    dispose(): void {
        for (const name of this.flows.keys())
            this.cancel(name);
    }
    state(name: string, cfg: GoogleAccount): {
        state: 'none' | 'pending' | 'logged-in';
        user?: string;
    } {
        const flow = this.flows.get(name);
        if (flow && flow.binding === binding(cfg) && flow.expires > this.now() && ['pending', 'processing'].includes(flow.status))
            return { state: 'pending' };
        return matches(this.repo.read().accounts[name], cfg) ? { state: 'logged-in', user: cfg.user } : { state: 'none' };
    }
    async start(name: string, cfg: GoogleAccount, current?: () => GoogleAccount | undefined): Promise<{
        url: string;
        expiresIn: number;
    }> {
        client(cfg);
        const stamp = binding(cfg), starting = this.starts.get(name);
        if (starting) {
            if (starting.binding === stamp)
                return starting.task;
            await starting.task.catch(() => { });
            return this.start(name, cfg, current);
        }
        const old = this.flows.get(name);
        if (old && old.binding === stamp && old.expires > this.now() && old.status === 'pending')
            return { url: old.url, expiresIn: Math.ceil((old.expires - this.now()) / 1000) };
        this.cancel(name);
        const generation = this.generation.get(name);
        const task = (async () => {
            let flow: Flow;
            const server = createServer((req, res) => {
                void this.complete(name, flow, req, res).catch(() => {
                    if (!res.writableEnded)
                        response(res, 400, '登录未完成，请返回 DSH 重试 / Sign-in failed; return to DSH');
                });
            });
            await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => { server.off('error', reject); resolve(); }); });
            server.on('error', () => { });
            server.unref();
            const address = server.address();
            if (!address || typeof address === 'string') {
                server.close();
                throw new GoogleOAuthError('无法启动本地登录回调 / Local callback unavailable');
            }
            if (generation !== this.generation.get(name)) {
                server.close();
                throw new GoogleOAuthError('登录已取消 / Sign-in cancelled');
            }
            const state = randomBytes(32).toString('base64url'), verifier = randomBytes(32).toString('base64url'), redirect = 'http://127.0.0.1:' + address.port + '/oauth/google/callback';
            const url = new URL(GOOGLE_AUTH_URL);
            for (const [k, v] of Object.entries({ client_id: client(cfg), redirect_uri: redirect, response_type: 'code', scope: GOOGLE_MAIL_SCOPE + ' openid email', state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', access_type: 'offline', prompt: 'consent', login_hint: cfg.user }))
                url.searchParams.set(k, v);
            const timer = setTimeout(() => { flow.status = 'failed'; flow.message = '登录已过期，请重新开始 / Sign-in expired'; this.close(flow); }, 600000);
            timer.unref?.();
            flow = { binding: stamp, cfg: { ...cfg }, state, verifier, redirect, url: url.href, expires: this.now() + 600000, server, timer, status: 'pending', current };
            this.flows.set(name, flow);
            return { url: flow.url, expiresIn: 600 };
        })();
        this.starts.set(name, { binding: stamp, task });
        try {
            return await task;
        }
        finally {
            if (this.starts.get(name)?.task === task)
                this.starts.delete(name);
        }
    }
    private async json(url: string, init?: RequestInit): Promise<{
        response: Response;
        doc: Record<string, unknown>;
    }> {
        let result: Response;
        try {
            result = await this.fetcher(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(15000) });
        }
        catch {
            throw new GoogleOAuthError('无法连接 Google 登录服务，请检查网络后重试；已有登录数据保留 / Google connection failed; existing login data kept');
        }
        let bytes = 0, text = '';
        const reader = result.body?.getReader();
        if (reader)
            try {
                for (;;) {
                    const part = await reader.read();
                    if (part.done)
                        break;
                    bytes += part.value.length;
                    if (bytes > 65536) {
                        await reader.cancel();
                        throw new GoogleOAuthError('Google 响应过大 / Google response too large');
                    }
                    text += Buffer.from(part.value).toString('utf8');
                }
            }
            finally {
                reader.releaseLock();
            }
        let doc: Record<string, unknown>;
        try {
            doc = JSON.parse(text);
        }
        catch {
            throw new GoogleOAuthError('Google 返回了无效响应 / Invalid Google response');
        }
        if (!doc || typeof doc !== 'object' || Array.isArray(doc))
            throw new GoogleOAuthError('Google 返回了无效响应 / Invalid Google response');
        return { response: result, doc };
    }
    private validAccess(doc: Record<string, unknown>): string {
        if (typeof doc.access_token !== 'string' || !doc.access_token || doc.access_token.length > 8192)
            throw new GoogleOAuthError('Google 未返回有效访问令牌 / Google returned no usable access token');
        if (typeof doc.scope === 'string' && !doc.scope.split(/\s+/).includes(GOOGLE_MAIL_SCOPE))
            throw new GoogleOAuthError('授权缺少 Gmail IMAP/SMTP 权限 / Gmail mail scope was not granted');
        return doc.access_token;
    }
    private async complete(name: string, flow: Flow, req: IncomingMessage, res: ServerResponse): Promise<void> {
        if (!flow || this.flows.get(name) !== flow || req.method !== 'GET' || (req.url?.length || 0) > 8192) {
            response(res, 400, 'Invalid callback');
            return;
        }
        let url: URL;
        try {
            url = new URL(req.url || '', flow.redirect);
        }
        catch {
            response(res, 400, 'Invalid callback');
            return;
        }
        const authority = new URL(flow.redirect);
        const supplied = url.searchParams.get('state') || '';
        if (req.headers.host !== authority.host || url.origin !== authority.origin || url.pathname !== authority.pathname || url.searchParams.getAll('state').length !== 1 || Buffer.byteLength(supplied) !== Buffer.byteLength(flow.state) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(flow.state))) {
            response(res, 403, 'Invalid state or callback authority');
            return;
        }
        if (flow.status !== 'pending' || flow.expires <= this.now()) {
            response(res, 409, 'Sign-in already used or expired');
            return;
        }
        if (url.searchParams.has('error')) {
            flow.status = 'failed';
            flow.message = 'Google 授权未完成或已取消 / Google authorization was declined';
            response(res, 400, flow.message);
            this.close(flow);
            return;
        }
        const code = url.searchParams.get('code');
        if (!code || code.length > 4096 || url.searchParams.getAll('code').length !== 1) {
            response(res, 400, 'Missing authorization code');
            return;
        }
        flow.status = 'processing';
        try {
            const parameters = { grant_type: 'authorization_code', client_id: client(flow.cfg), code, redirect_uri: flow.redirect, code_verifier: flow.verifier, ...(flow.cfg.clientSecret ? { client_secret: flow.cfg.clientSecret } : {}) };
            const { response: result, doc } = await this.json(GOOGLE_TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(parameters) });
            if (!result.ok)
                throw new GoogleOAuthError('Google 授权码交换失败，请核对 Desktop app 客户端配置后重新登录 / Google code exchange failed; check Desktop app credentials');
            const accessToken = this.validAccess(doc), identity = await this.json(GOOGLE_USERINFO_URL, { headers: { authorization: 'Bearer ' + accessToken } });
            if (!identity.response.ok || identity.doc.email_verified !== true || typeof identity.doc.email !== 'string' || identity.doc.email.toLowerCase() !== flow.cfg.user.trim().toLowerCase())
                throw new GoogleOAuthError('登录邮箱与该账号不一致，未保存令牌 / Signed-in mailbox differs from this account; tokens were not saved');
            const current = flow.current?.();
            if (this.flows.get(name) !== flow || flow.current && (!current || binding(current) !== flow.binding))
                throw new GoogleOAuthError('登录期间账号配置已改变，未保存令牌 / Account changed while signing in');
            const store = this.repo.read(), previous = store.accounts[name], refreshToken = typeof doc.refresh_token === 'string' && doc.refresh_token ? doc.refresh_token : matches(previous, flow.cfg) ? previous.refreshToken : '';
            if (!refreshToken || refreshToken.length > 8192)
                throw new GoogleOAuthError('Google 未返回离线刷新令牌，请重新授权 / Google returned no offline refresh token; grant consent again');
            store.accounts[name] = { provider: 'google', user: flow.cfg.user.trim(), clientId: client(flow.cfg), accessToken, refreshToken, expiresAt: this.now() + Math.max(0, Math.min(Number(doc.expires_in) || 0, 86400)) * 1000 };
            this.repo.write(store);
            flow.status = 'ok';
            response(res, 200, 'Google 登录完成，请返回 DSH / Google sign-in complete; return to DSH');
        }
        catch (error) {
            flow.status = 'failed';
            flow.message = error instanceof GoogleOAuthError ? error.message : '无法安全保存 Google 登录数据，已有文件保留 / Could not safely save Google login';
            response(res, 400, flow.message);
        }
        finally {
            flow.verifier = '';
            flow.state = '';
            flow.cfg = { user: flow.cfg.user, clientId: flow.cfg.clientId };
            this.close(flow);
        }
    }
    poll(name: string, cfg: GoogleAccount): {
        status: 'pending' | 'ok';
        user?: string;
    } {
        const flow = this.flows.get(name);
        if (flow?.status === 'failed')
            throw new GoogleOAuthError(flow.message || 'Google 登录失败 / Google sign-in failed');
        const state = this.state(name, cfg);
        if (state.state === 'logged-in')
            return { status: 'ok', user: cfg.user };
        if (state.state === 'pending')
            return { status: 'pending' };
        throw new GoogleOAuthError('请先开始 Google 登录 / Start Google sign-in first');
    }
    async accessToken(name: string, cfg: GoogleAccount, force = false): Promise<string> {
        const entry = this.repo.read().accounts[name];
        if (!matches(entry, cfg))
            throw new GoogleOAuthError('尚未登录或 Google 账号/客户端已改变，请在设置中重新登录 / Sign in to this Google account in settings');
        if (!force && entry.accessToken && entry.expiresAt - this.now() > 120000)
            return entry.accessToken;
        const key = name + '|' + binding(cfg), running = this.refreshing.get(key);
        if (running)
            return running;
        const generation = this.generation.get(name), task = (async () => {
            const { response: result, doc } = await this.json(GOOGLE_TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', client_id: client(cfg), refresh_token: entry.refreshToken, ...(cfg.clientSecret ? { client_secret: cfg.clientSecret } : {}) }) });
            const store = this.repo.read(), current = store.accounts[name];
            if (generation !== this.generation.get(name) || !matches(current, cfg) || current.refreshToken !== entry.refreshToken)
                throw new GoogleOAuthError('Google 登录已改变，请重新操作 / Google login changed');
            if (!result.ok) {
                if (doc.error === 'invalid_grant') {
                    delete store.accounts[name];
                    this.repo.write(store);
                    throw new GoogleOAuthError('Google 登录已失效，请重新登录 / Google login expired; sign in again');
                }
                throw new GoogleOAuthError('Google 刷新失败，原登录数据保留，请稍后重试 / Google refresh failed; stored login was kept');
            }
            const accessToken = this.validAccess(doc);
            store.accounts[name] = { ...entry, accessToken, refreshToken: typeof doc.refresh_token === 'string' && doc.refresh_token ? doc.refresh_token : entry.refreshToken, expiresAt: this.now() + Math.max(0, Math.min(Number(doc.expires_in) || 0, 86400)) * 1000 };
            this.repo.write(store);
            return accessToken;
        })();
        this.refreshing.set(key, task);
        try {
            return await task;
        }
        finally {
            if (this.refreshing.get(key) === task)
                this.refreshing.delete(key);
        }
    }
}
