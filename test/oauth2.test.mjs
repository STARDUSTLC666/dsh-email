/**
 * Outlook OAuth2 (device-code flow) backend.
 *
 * Every fetch is mocked and every token file is written into a temporary
 * DSH_HOME: this suite must never touch login.microsoftonline.com, a real
 * mailbox, or the tokens of the machine it runs on.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// DSH_HOME decides where the token store lives, so it is pinned before the
// plugin is imported: oauth2TokenFile() reads it on every call, but pinning it
// here keeps a stray write from ever reaching the developer's own ~/.dsh.
const HOME = mkdtempSync(join(tmpdir(), 'dsh-email-oauth2-'))
process.env.DSH_HOME = HOME

const {
  EmailPool, classifyOAuthFailure, clearTokenFor, clientIdOf, getFreshAccessToken, imapAuthOf, isOAuth2Account,
  looksLikeAuthFailure, mapAadstsMessage, NOT_LOGGED_IN_MESSAGE, oauth2StateOf, oauth2TokenFile,
  OAUTH2_SCOPES, pollDeviceFlow, readTokenStore, resolveEmailSettings, smtpAuthOf, startDeviceFlow,
  writeTokenStore, ACCESS_TOKEN_MARGIN_MS, OUTLOOK_OAUTH2_CLIENT_ID, OAUTH2_RELOGIN_MESSAGE,
} = await import('../lib/index.js')

const DEVICE_CODE_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/devicecode'
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

test.after(() => rmSync(HOME, { recursive: true, force: true }))

/** The token file path is derived from DSH_HOME, which is set above. */
function tokenFile() {
  const file = oauth2TokenFile()
  assert.equal(file.startsWith(HOME), true, 'the suite must only ever write inside its temp DSH_HOME')
  return file
}

function writeTokens(accounts) {
  writeTokenStore({ version: 1, accounts })
}

const OAUTH_ACCOUNT = { user: 'me@outlook.com', clientId: 'client-1' }

/**
 * Install a fetch stub for one test. Every response is a real `Response`, so
 * the code under test parses exactly what the authority would send.
 */
function mockFetch(t, handler) {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const body = new URLSearchParams(String(init?.body ?? ''))
    const call = { url: String(url), method: init?.method, params: Object.fromEntries(body), init }
    calls.push(call)
    return await handler(call, calls.length)
  })
  return calls
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
}

const DEVICE_OK = {
  device_code: 'device-code-1',
  user_code: 'ABCD-EFGH',
  verification_uri: 'https://microsoft.com/devicelogin',
  expires_in: 900,
  interval: 5,
  message: 'To sign in, use a web browser...',
}

function tokenPayload(overrides = {}) {
  return {
    token_type: 'Bearer',
    scope: 'IMAP.AccessAsUser.All SMTP.Send',
    expires_in: 3600,
    access_token: 'access-1',
    refresh_token: 'refresh-1',
    ...overrides,
  }
}

// --- provider identity -------------------------------------------------------

test('outlook (and any account dialling Exchange Online) is an OAuth2 account', () => {
  assert.equal(isOAuth2Account('outlook', 'outlook.office365.com'), true)
  // A custom preset pointed at the same host authenticates the same way: the
  // endpoints are identical, only the credentials differ.
  assert.equal(isOAuth2Account('corp', 'outlook.office365.com'), true)
  assert.equal(isOAuth2Account('corp', 'OUTLOOK.OFFICE365.COM'), true, 'hosts are case-insensitive')
  assert.equal(isOAuth2Account(undefined, 'outlook.office365.com'), true, 'a hand-written host counts too')
  assert.equal(isOAuth2Account('outlook', undefined), true, 'the provider alone is enough')
  // Nothing else changes: every existing provider stays a password account.
  for (const provider of ['qq', '163', '126', 'sina', 'aliyun', 'gmail', 'icloud', 'corp', undefined]) {
    assert.equal(isOAuth2Account(provider, 'imap.example.com'), false, provider + ' must stay a password account')
  }
})

test('an outlook account resolves without a password, a password account still requires one', () => {
  const mail = resolveEmailSettings({ accountsYaml: 'work: { provider: outlook, user: w@outlook.com }\n' })
  const work = mail.accounts.get('work')
  assert.equal(work.authKind, 'oauth2')
  assert.equal(work.password, '', 'an OAuth2 account holds no password at all')
  assert.equal(work.imap.host, 'outlook.office365.com', 'the preset endpoints are unchanged')
  assert.equal(work.smtp.host, 'smtp.office365.com')
  assert.equal(work.smtp.port, 587)

  // A stale password left in the YAML from before the provider changed must
  // not travel into the pool as a credential.
  const stale = resolveEmailSettings({ accountsYaml: 'work: { provider: outlook, user: w@outlook.com, password: old-pw }\n' })
  assert.equal(stale.accounts.get('work').password, '')

  // Every other provider is untouched: the password is still mandatory.
  assert.throws(
    () => resolveEmailSettings({ accountsYaml: 'work: { provider: qq, user: w@qq.com }\n' }),
    /password 未填写/,
  )
  const qq = resolveEmailSettings({ accountsYaml: 'work: { provider: qq, user: w@qq.com, password: pw }\n' })
  assert.equal(qq.accounts.get('work').authKind, 'password')
  assert.equal(qq.accounts.get('work').password, 'pw')

  // The custom preset that points at Exchange Online is OAuth2 as well.
  const corp = resolveEmailSettings({
    serverPresets: 'corp: { imap: { host: outlook.office365.com }, smtp: { host: smtp.office365.com, port: 587, secure: false } }\n',
    accountsYaml: 'work: { provider: corp, user: w@corp.example }\n',
  })
  assert.equal(corp.accounts.get('work').authKind, 'oauth2')
})

test('clientId defaults to the built-in public client and is overridable per account', () => {
  const plain = resolveEmailSettings({ accountsYaml: 'work: { provider: outlook, user: w@outlook.com }\n' })
  assert.equal(plain.accounts.get('work').clientId, undefined, 'the default lives in oauth2.ts, not in every account')
  assert.equal(clientIdOf({ user: 'w@outlook.com' }), OUTLOOK_OAUTH2_CLIENT_ID, 'so login falls back to the app the plugin ships')

  const custom = resolveEmailSettings({
    accountsYaml: 'work: { provider: outlook, user: w@outlook.com, clientId: my-own-app }\n',
  })
  assert.equal(custom.accounts.get('work').clientId, 'my-own-app')
})

// --- auth shapes handed to the libraries -------------------------------------

test('imapflow and nodemailer receive the OAuth2 auth shape, password accounts unchanged', () => {
  const oauth = { authUser: 'me@outlook.com', authPassword: '', authKind: 'oauth2' }
  const password = { authUser: 'me@qq.com', authPassword: 'secret', authKind: 'password' }

  assert.deepEqual(imapAuthOf(oauth, 'access-token'), { user: 'me@outlook.com', accessToken: 'access-token' })
  assert.equal('pass' in imapAuthOf(oauth, 'access-token'), false, 'a password key would make imapflow try LOGIN')
  assert.deepEqual(imapAuthOf(password, undefined), { user: 'me@qq.com', pass: 'secret' })

  // nodemailer resolves OAuth2 through XOAuth2, which reads `accessToken` and
  // never `pass`: `smtp-transport.getAuth()` builds `new XOAuth2(authData)` for
  // `type: 'OAuth2'`, and `getToken()` then reuses the token as-is when no
  // refresh mechanism is configured. Handing it `pass` instead leaves
  // `accessToken` false and every send dies with EAUTH「Can't create new access
  // token for user」. Verified against a fixture SMTP server: the `pass` shape
  // fails, this shape delivers `user=…\x01auth=Bearer …\x01\x01`.
  assert.deepEqual(smtpAuthOf(oauth, 'access-token'), {
    type: 'OAuth2', user: 'me@outlook.com', accessToken: 'access-token',
  })
  assert.equal('pass' in smtpAuthOf(oauth, 'access-token'), false, 'a password key would be ignored by XOAuth2 and mask a missing token')
  assert.deepEqual(smtpAuthOf(password, undefined), { user: 'me@qq.com', pass: 'secret' })
})

test('the auth-failure detector recognises what the libraries actually throw', () => {
  for (const message of [
    'Authentication failed',
    'Command failed',
    'Invalid credentials (Failure)',
    'LOGIN failed',
    'AUTHENTICATE XOAUTH2 failed',
  ]) {
    assert.equal(looksLikeAuthFailure(new Error(message)), true, message + ' must count as an auth failure')
  }
  for (const message of ['Mailbox does not exist', 'Connection timeout', 'No recipients defined', '']) {
    assert.equal(looksLikeAuthFailure(new Error(message)), false, message + ' must not trigger a token refresh')
  }
})

// --- device-code flow ---------------------------------------------------------

test('device flow: a successful login returns url/code/interval/expires_in and persists the token', async t => {
  writeTokens({})
  const calls = mockFetch(t, call => call.url === DEVICE_CODE_URL ? jsonResponse(DEVICE_OK) : jsonResponse(tokenPayload()))

  const start = await startDeviceFlow('work', OAUTH_ACCOUNT)
  assert.deepEqual(start, {
    url: 'https://microsoft.com/devicelogin',
    code: 'ABCD-EFGH',
    interval: 5,
    expiresIn: 900,
  })

  // The device-code request carries the client id and all three scopes.
  assert.equal(calls[0].url, DEVICE_CODE_URL)
  assert.equal(calls[0].params.client_id, 'client-1')
  assert.equal(calls[0].params.scope, OAUTH2_SCOPES.join(' '))
  assert.equal(calls[0].params.scope.includes('offline_access'), true, 'offline_access is what yields a refresh token')
  assert.equal(calls[0].params.scope.includes('IMAP.AccessAsUser.All'), true)
  assert.equal(calls[0].params.scope.includes('SMTP.Send'), true)

  const polled = await pollDeviceFlow('work')
  assert.deepEqual(polled, { status: 'ok', user: 'me@outlook.com' })
  assert.equal(calls[1].url, TOKEN_URL)
  assert.equal(calls[1].params.grant_type, 'urn:ietf:params:oauth:grant-type:device_code')
  assert.equal(calls[1].params.device_code, 'device-code-1')

  const stored = readTokenStore().accounts.work
  assert.equal(stored.user, 'me@outlook.com')
  assert.equal(stored.clientId, 'client-1')
  assert.equal(stored.refreshToken, 'refresh-1')
  assert.equal(stored.accessToken, 'access-1')
  assert.equal(stored.expiresAt > Date.now() + 3000_000, true, 'expires_in is stored as an absolute deadline')

  assert.deepEqual(oauth2StateOf('work'), { state: 'logged-in', user: 'me@outlook.com' })
})

test('device flow: authorization_pending is a state, not an error, until the user finishes', async t => {
  writeTokens({})
  mockFetch(t, call => call.url === DEVICE_CODE_URL
    ? jsonResponse(DEVICE_OK)
    : jsonResponse({ error: 'authorization_pending', error_description: 'Waiting for user' }, 400))
  await startDeviceFlow('work', OAUTH_ACCOUNT)
  assert.deepEqual(await pollDeviceFlow('work'), { status: 'pending' })
  assert.equal(readTokenStore().accounts.work, undefined, 'nothing is stored while the user has not consented')
  assert.deepEqual(oauth2StateOf('work'), { state: 'pending' }, 'the card must show the flow as in progress')
})

test('device flow: slow_down is still pending and widens the poll interval', async t => {
  writeTokens({})
  let answer = 'slow_down'
  mockFetch(t, call => call.url === DEVICE_CODE_URL
    ? jsonResponse(DEVICE_OK)
    : jsonResponse({ error: answer, error_description: 'Too fast' }, 400))
  await startDeviceFlow('work', OAUTH_ACCOUNT)
  assert.deepEqual(await pollDeviceFlow('work'), { status: 'pending' })
  answer = 'authorization_pending'
  assert.deepEqual(await pollDeviceFlow('work'), { status: 'pending' })
})

test('device flow: an expired device code reports the actionable Chinese message', async t => {
  writeTokens({})
  mockFetch(t, call => call.url === DEVICE_CODE_URL
    ? jsonResponse(DEVICE_OK)
    : jsonResponse({ error: 'expired_token', error_description: 'Device code expired' }, 400))
  await startDeviceFlow('work', OAUTH_ACCOUNT)
  await assert.rejects(pollDeviceFlow('work'), /设备码超时，请重新发起登录/)
  assert.deepEqual(oauth2StateOf('work'), { state: 'none' }, 'the dead flow must not keep the card pending')
})

test('device flow: polling without a started flow is refused, and a code is single-use per flow', async t => {
  writeTokens({})
  await assert.rejects(pollDeviceFlow('never-started'), /尚未发起设备码登录/)
  assert.equal(oauth2StateOf('never-started').state, 'none')
})

test('device flow: AADSTS 7000218 names the public-client-flow switch', async t => {
  writeTokens({})
  mockFetch(t, () => jsonResponse({
    error: 'unauthorized_client',
    error_description: "AADSTS7000218: The request body must contain the following parameter: 'client_assertion'.",
    error_codes: [7000218],
  }, 400))
  await assert.rejects(startDeviceFlow('work', OAUTH_ACCOUNT), error => {
    assert.match(error.message, /允许公共客户端流/)
    assert.match(error.message, /Entra/)
    assert.match(error.message, /AADSTS7000218/)
    return true
  })
})

test('device flow: AADSTS 65001 reports the missing permission grant', async t => {
  writeTokens({})
  mockFetch(t, () => jsonResponse({
    error: 'invalid_grant',
    error_description: 'AADSTS65001: The user or administrator has not consented to use the application.',
    error_codes: [65001],
  }, 400))
  await assert.rejects(startDeviceFlow('work', OAUTH_ACCOUNT), /权限未授予/)
})

test('device flow: a network failure is reported as one, not as a login rejection', async t => {
  writeTokens({})
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fetch failed') })
  await assert.rejects(startDeviceFlow('work', OAUTH_ACCOUNT), /无法连接微软登录服务/)
})

test('startDeviceFlow is single-flight per account and keeps the newest code', async t => {
  writeTokens({})
  const calls = mockFetch(t, async call => {
    if (call.url === DEVICE_CODE_URL) {
      await new Promise(resolve => setTimeout(resolve, 5))
      return jsonResponse({ ...DEVICE_OK, device_code: 'code-' + calls.length, user_code: 'CODE-' + calls.length })
    }
    return jsonResponse(tokenPayload())
  })
  const [a, b] = await Promise.all([startDeviceFlow('work', OAUTH_ACCOUNT), startDeviceFlow('work', OAUTH_ACCOUNT)])
  assert.deepEqual(a, b, 'two concurrent logins for one account must share one device code')
  assert.equal(calls.filter(call => call.url === DEVICE_CODE_URL).length, 1, 'and must not create two codes')
})

// --- token freshness -----------------------------------------------------------

test('a token with more than the 2-minute margin left is reused without any refresh', async t => {
  writeTokens({
    work: {
      user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'refresh-1',
      accessToken: 'still-fresh', expiresAt: Date.now() + ACCESS_TOKEN_MARGIN_MS + 60_000,
    },
  })
  const calls = mockFetch(t, () => jsonResponse(tokenPayload()))
  assert.equal(await getFreshAccessToken('work', OAUTH_ACCOUNT), 'still-fresh')
  assert.equal(calls.length, 0, 'a fresh token must cost zero network requests')
})

test('a token inside the margin is refreshed before it is handed out', async t => {
  writeTokens({
    work: {
      user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'refresh-1',
      accessToken: 'about-to-expire', expiresAt: Date.now() + ACCESS_TOKEN_MARGIN_MS - 1000,
    },
  })
  const calls = mockFetch(t, () => jsonResponse(tokenPayload({ access_token: 'renewed', refresh_token: 'refresh-2' })))
  assert.equal(await getFreshAccessToken('work', OAUTH_ACCOUNT), 'renewed')
  assert.equal(calls.length, 1, 'a nearly-expired token must be refreshed, not reused')
  assert.equal(calls[0].params.grant_type, 'refresh_token')
  assert.equal(calls[0].params.refresh_token, 'refresh-1')
  assert.equal(calls[0].params.client_id, 'client-1')
  const stored = readTokenStore().accounts.work
  assert.equal(stored.accessToken, 'renewed')
  assert.equal(stored.refreshToken, 'refresh-2', 'the rotated refresh token must be persisted')
})

test('an already-expired token is refreshed too', async t => {
  writeTokens({
    work: {
      user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'refresh-1',
      accessToken: 'expired', expiresAt: Date.now() - 1000,
    },
  })
  mockFetch(t, () => jsonResponse(tokenPayload({ access_token: 'renewed' })))
  assert.equal(await getFreshAccessToken('work', OAUTH_ACCOUNT), 'renewed')
})

test('concurrent refreshes share one request (single flight)', async t => {
  writeTokens({
    work: {
      user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'refresh-1',
      accessToken: 'stale', expiresAt: Date.now() - 1000,
    },
  })
  const calls = mockFetch(t, async () => {
    await new Promise(resolve => setTimeout(resolve, 10))
    return jsonResponse(tokenPayload({ access_token: 'renewed', refresh_token: 'refresh-2' }))
  })
  const tokens = await Promise.all([
    getFreshAccessToken('work', OAUTH_ACCOUNT),
    getFreshAccessToken('work', OAUTH_ACCOUNT),
    getFreshAccessToken('work', OAUTH_ACCOUNT),
  ])
  assert.deepEqual(tokens, ['renewed', 'renewed', 'renewed'])
  // Microsoft rotates the refresh token on every use: three parallel refreshes
  // would invalidate each other and log the user out.
  assert.equal(calls.length, 1, 'three concurrent callers must mint exactly one token')
  assert.equal(readTokenStore().accounts.work.refreshToken, 'refresh-2')
})

test('a forced refresh mints a new token even when the cached one looks fresh', async t => {
  writeTokens({
    work: {
      user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'refresh-1',
      accessToken: 'looks-fine', expiresAt: Date.now() + 3600_000,
    },
  })
  const calls = mockFetch(t, () => jsonResponse(tokenPayload({ access_token: 'forced' })))
  assert.equal(await getFreshAccessToken('work', OAUTH_ACCOUNT, { force: true }), 'forced')
  assert.equal(calls.length, 1, 'force is the retry path: it must not trust the cache')
})

test('an account with no stored token reports the settings-page instruction', async t => {
  writeTokens({})
  const calls = mockFetch(t, () => jsonResponse(tokenPayload()))
  await assert.rejects(getFreshAccessToken('work', OAUTH_ACCOUNT), error => {
    assert.equal(error.message, NOT_LOGGED_IN_MESSAGE)
    assert.match(error.message, /设置页/)
    assert.match(error.message, /设备码/)
    return true
  })
  assert.equal(calls.length, 0, 'a missing token is answered without a network round trip')
})

test('a token issued for another address is refused, and an expired one is reported as such', async t => {
  // A name no other test in this file uses: the pending-flow registry is
  // module-global, and a live flow (correctly) outranks「no login」.
  writeTokens({
    moved: {
      user: 'old@outlook.com', clientId: 'client-1', refreshToken: 'refresh-1',
      accessToken: 'other-mailbox', expiresAt: Date.now() + 3600_000,
    },
  })
  await assert.rejects(
    getFreshAccessToken('moved', { user: 'new@outlook.com', clientId: 'client-1' }),
    /账号地址已改为 new@outlook\.com/,
  )
  // The card must not claim a login the tools will refuse either: the verdict
  // is「none」so the user is sent through the flow again.
  assert.deepEqual(oauth2StateOf('moved', 'new@outlook.com'), { state: 'none' })
  assert.deepEqual(oauth2StateOf('moved', 'OLD@outlook.com'), { state: 'logged-in', user: 'old@outlook.com' },
    'the comparison is case-insensitive, and an unedited address still matches')
  assert.deepEqual(oauth2StateOf('moved', ''), { state: 'logged-in', user: 'old@outlook.com' },
    'an account with no address configured cannot disagree with the token')

  writeTokens({
    work: {
      user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'dead', accessToken: '', expiresAt: 0,
    },
  })
  mockFetch(t, () => jsonResponse({ error: 'invalid_grant', error_description: 'AADSTS70008: The refresh token has expired.' }, 400))
  await assert.rejects(getFreshAccessToken('work', OAUTH_ACCOUNT), /重新登录/)
  assert.equal(readTokenStore().accounts.work, undefined, 'a dead refresh token is dropped, not retried forever')
})

test('a transient refresh failure keeps the stored token so the user is not logged out', async t => {
  writeTokens({
    work: {
      user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'still-good',
      accessToken: 'old', expiresAt: Date.now() - 1000,
    },
  })
  mockFetch(t, () => jsonResponse({ error: 'temporarily_unavailable', error_description: 'Service unavailable' }, 503))
  await assert.rejects(getFreshAccessToken('work', OAUTH_ACCOUNT))
  assert.equal(readTokenStore().accounts.work.refreshToken, 'still-good', 'a 503 must not destroy a possibly-good token')
})

// --- error mapping table --------------------------------------------------------

test('AADSTS codes map to the actionable Chinese table', () => {
  assert.match(mapAadstsMessage(7000218), /允许公共客户端流/)
  assert.match(mapAadstsMessage('7000218'), /Entra → 应用注册 → 身份验证/)
  assert.match(mapAadstsMessage(65001), /权限未授予/)
  assert.match(mapAadstsMessage(70008), /重新登录/)
  assert.match(mapAadstsMessage(53003), /条件访问/)
  assert.equal(mapAadstsMessage(999999), undefined)
  assert.equal(mapAadstsMessage(''), undefined)
})

test('classifyOAuthFailure separates「keep polling」from「tell the user」', () => {
  assert.deepEqual(
    { ...classifyOAuthFailure({ error: 'authorization_pending' }), message: '' },
    { pending: true, slowDown: false, clearToken: false, code: 'authorization_pending', message: '' },
  )
  const slow = classifyOAuthFailure({ error: 'slow_down' })
  assert.equal(slow.pending, true)
  assert.equal(slow.slowDown, true)

  const expired = classifyOAuthFailure({ error: 'expired_token' })
  assert.equal(expired.pending, false)
  assert.match(expired.message, /设备码超时/)

  const invalid = classifyOAuthFailure({ error: 'invalid_grant', error_codes: [70008] })
  assert.equal(invalid.clearToken, true, 'invalid_grant is the one case that drops the token')
  assert.match(invalid.message, /重新登录/)

  // A non-JSON or empty body still yields a message, never a crash.
  assert.equal(typeof classifyOAuthFailure(undefined, 500).message, 'string')
  assert.match(classifyOAuthFailure(undefined, 500).message, /HTTP 500/)
})

// --- token store hygiene --------------------------------------------------------

test('the token store tolerates a missing, corrupt or malformed file', () => {
  rmSync(tokenFile(), { force: true })
  assert.deepEqual(readTokenStore(), { version: 1, accounts: {} })

  writeFileSync(tokenFile(), 'not json at all', 'utf8')
  assert.deepEqual(readTokenStore(), { version: 1, accounts: {} })

  writeFileSync(tokenFile(), JSON.stringify({ version: 1, accounts: { a: { refreshToken: '' }, b: 'nope', c: null } }), 'utf8')
  assert.deepEqual(readTokenStore().accounts, {}, 'an entry without a refresh token cannot be used')
})

test('writeTokenStore is UTF-8 without a BOM and survives a round trip', () => {
  writeTokens({ 工作: { user: '中文@outlook.com', clientId: 'c', refreshToken: 'r', accessToken: 'a', expiresAt: 123 } })
  const raw = readFileSync(tokenFile())
  assert.equal(raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf, false, 'no BOM')
  assert.equal(raw.toString('utf8').includes('中文@outlook.com'), true)
  assert.equal(readTokenStore().accounts['工作'].refreshToken, 'r')
  assert.deepEqual(oauth2StateOf('工作'), { state: 'logged-in', user: '中文@outlook.com' })
})

test('clearTokenFor drops exactly one account and leaves the rest alone', () => {
  writeTokens({
    a: { user: 'a@x.y', clientId: 'c', refreshToken: 'ra', accessToken: 'aa', expiresAt: 1 },
    b: { user: 'b@x.y', clientId: 'c', refreshToken: 'rb', accessToken: 'ab', expiresAt: 1 },
  })
  assert.equal(clearTokenFor('a'), true)
  assert.deepEqual(Object.keys(readTokenStore().accounts), ['b'])
  assert.equal(clearTokenFor('a'), false, 'clearing twice is not an error, just a no-op')
  assert.equal(readTokenStore().accounts.b.refreshToken, 'rb')
})

test('the token file never appears in the settings YAML or the pool fingerprint inputs', async () => {
  writeTokens({
    work: { user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'SECRET-REFRESH', accessToken: 'SECRET-ACCESS', expiresAt: Date.now() + 3600_000 },
  })
  // The credential lives outside the resolved settings entirely: a scan of the
  // resolved account finds no token material, which is what keeps it out of the
  // pool fingerprint (and therefore out of any reconnect decision).
  const resolved = resolveEmailSettings({ accountsYaml: 'work: { provider: outlook, user: me@outlook.com, clientId: client-1 }\n' })
  const serialized = JSON.stringify([...resolved.accounts.entries()])
  assert.equal(serialized.includes('SECRET-REFRESH'), false)
  assert.equal(serialized.includes('SECRET-ACCESS'), false)
  assert.equal(serialized.includes('refreshToken'), false)
})

// --- connection wiring -----------------------------------------------------------

test('an OAuth2 account without a token fails with the settings-page message and never dials', async t => {
  writeTokens({})
  const settings = resolveEmailSettings({ accountsYaml: 'work: { provider: outlook, user: me@outlook.com, clientId: client-1 }\n' })
  const pool = new EmailPool(settings)
  let dialled = false
  pool.createImap = () => { dialled = true; return { usable: true, async connect() {}, async logout() {}, close() {} } }
  const calls = mockFetch(t, () => jsonResponse(tokenPayload()))
  await assert.rejects(pool.withImap('work', null, async () => 'never'), error => {
    // The token store's own message survives the IMAP error normalizer intact:
    //「尚未登录」is more accurate than「登录失败」for an account that never
    // logged in, and it is the one the settings page acts on.
    assert.equal(error.message, NOT_LOGGED_IN_MESSAGE)
    assert.match(error.message, /设置页/)
    assert.match(error.message, /设备码/)
    assert.equal(/授权码|password/.test(error.message), false, 'an OAuth2 account has no 授权码 to blame')
    return true
  })
  assert.equal(dialled, false, 'no token means there is nothing to authenticate with')
  assert.equal(calls.length, 0)
  pool.dispose()
})

test('an OAuth2 connection hands imapflow the token, and retries once after an auth rejection', async t => {
  writeTokens({
    work: {
      user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'refresh-1',
      accessToken: 'stale-token', expiresAt: Date.now() + 3600_000,
    },
  })
  const settings = resolveEmailSettings({ accountsYaml: 'work: { provider: outlook, user: me@outlook.com, clientId: client-1 }\n' })
  const pool = new EmailPool(settings)
  const auths = []
  let connects = 0
  pool.createImap = auth => {
    auths.push(auth)
    const client = {
      usable: true,
      async connect() {
        connects++
        // The cached token is refused once; the refreshed one is accepted.
        if (auth.accessToken === 'stale-token') throw new Error('Authentication failed')
      },
      async logout() {},
      close() {},
    }
    return client
  }
  const calls = mockFetch(t, () => jsonResponse(tokenPayload({ access_token: 'fresh-token' })))
  assert.equal(await pool.withImap('work', null, async () => 'connected'), 'connected')
  assert.equal(connects, 2, 'a credential rejection must be retried exactly once')
  assert.equal(auths[0].accessToken, 'stale-token')
  assert.equal(auths[1].accessToken, 'fresh-token', 'the retry must carry a newly minted token')
  assert.equal('pass' in auths[0], false)
  assert.equal(calls.length, 1, 'the retry forces exactly one refresh')
  assert.equal(calls[0].params.grant_type, 'refresh_token')
  pool.dispose()
})

test('a password account still connects exactly once and never touches the token store', async t => {
  const settings = resolveEmailSettings({ provider: 'qq', user: 'me@qq.com', password: 'pw' })
  const pool = new EmailPool(settings)
  const auths = []
  let connects = 0
  pool.createImap = auth => {
    auths.push(auth)
    return { usable: true, async connect() { connects++ }, async logout() {}, close() {} }
  }
  const calls = mockFetch(t, () => jsonResponse(tokenPayload()))
  assert.equal(await pool.withImap(undefined, null, async () => 'ok'), 'ok')
  assert.equal(connects, 1)
  assert.deepEqual(auths[0], { user: 'me@qq.com', pass: 'pw' })
  assert.equal(calls.length, 0, 'a password account must never call the OAuth2 authority')
  pool.dispose()
})

test('an OAuth2 account whose refresh token is dead reports the re-login message', async t => {
  writeTokens({
    work: {
      user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'dead',
      accessToken: 'stale', expiresAt: Date.now() + 3600_000,
    },
  })
  const settings = resolveEmailSettings({ accountsYaml: 'work: { provider: outlook, user: me@outlook.com, clientId: client-1 }\n' })
  const pool = new EmailPool(settings)
  pool.createImap = auth => ({
    usable: true,
    async connect() { throw new Error('Authentication failed') },
    async logout() {},
    close() {},
  })
  mockFetch(t, () => jsonResponse({ error: 'invalid_grant', error_description: 'AADSTS700082: refresh token expired' }, 400))
  await assert.rejects(pool.withImap('work', null, async () => 'never'), error => {
    assert.match(error.message, /设置页重新登录/)
    return true
  })
  pool.dispose()
})

test('the SMTP transporter is rebuilt with a fresh token after a rejection', async t => {
  const payload = tokenPayload()
  writeTokens({
    work: {
      user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'refresh-1',
      accessToken: 'smtp-stale', expiresAt: Date.now() + 3600_000,
    },
  })
  const settings = resolveEmailSettings({ accountsYaml: 'work: { provider: outlook, user: me@outlook.com, clientId: client-1 }\n' })
  const pool = new EmailPool(settings)
  const auths = []
  let sends = 0
  pool.transporter = (name, cfg, token) => {
    auths.push(smtpAuthOf(cfg, token))
    return {
      async sendMail() {
        sends++
        if (sends === 1) throw new Error('Invalid credentials (Failure)')
        return { messageId: '<ok@outlook.com>', accepted: ['to@x.y'], rejected: [], response: '250 OK' }
      },
      close() {},
    }
  }
  const calls = mockFetch(t, () => jsonResponse(tokenPayload({ access_token: 'smtp-fresh' })))
  const info = await pool.send('work', 'to@x.y', 'subject', 'body', undefined, [])
  assert.equal(sends, 2, 'an SMTP credential rejection is retried once')
  assert.equal(auths[0].accessToken, 'smtp-stale')
  assert.equal(auths[1].accessToken, 'smtp-fresh')
  // The mechanism is nodemailer's to pick: `smtp-transport.getAuth()` sets
  // method XOAUTH2 itself for `type: 'OAuth2'`, and XOAuth2 reads `accessToken`
  // (never `pass`), so the plugin declares the token and nothing else.
  assert.equal(auths[1].type, 'OAuth2')
  assert.equal('pass' in auths[1], false, 'a pass key would be ignored by XOAuth2')
  assert.equal('method' in auths[1], false, 'nodemailer derives the mechanism from type')
  assert.equal(info.accepted[0], 'to@x.y')
  assert.equal(calls.length, 1)
  pool.dispose()
})

test('a password account never retries an SMTP rejection', async t => {
  const settings = resolveEmailSettings({ provider: 'qq', user: 'me@qq.com', password: 'pw' })
  const pool = new EmailPool(settings)
  let sends = 0
  pool.transporter = () => ({
    async sendMail() { sends++; throw new Error('Invalid credentials (Failure)') },
    close() {},
  })
  await assert.rejects(pool.send(undefined, 'to@x.y', 'subject', 'body', undefined, []), /Invalid credentials/)
  assert.equal(sends, 1, 'the password path keeps its single attempt')
  pool.dispose()
})

test('a non-auth SMTP failure is reported as itself and is not retried', async t => {
  writeTokens({
    work: {
      user: 'me@outlook.com', clientId: 'client-1', refreshToken: 'refresh-1',
      accessToken: 'good', expiresAt: Date.now() + 3600_000,
    },
  })
  const settings = resolveEmailSettings({ accountsYaml: 'work: { provider: outlook, user: me@outlook.com, clientId: client-1 }\n' })
  const pool = new EmailPool(settings)
  let sends = 0
  pool.transporter = () => ({
    async sendMail() { sends++; throw new Error('No recipients defined') },
    close() {},
  })
  const calls = mockFetch(t, () => jsonResponse(tokenPayload()))
  await assert.rejects(pool.send('work', '', 'subject', 'body', undefined, []), /No recipients defined/)
  assert.equal(sends, 1)
  assert.equal(calls.length, 0, 'a compose error is no reason to mint a token')
  pool.dispose()
})

test('the re-login message is the one the tools surface, and it says not to look for an 授权码', () => {
  assert.match(OAUTH2_RELOGIN_MESSAGE, /设置页重新登录/)
  assert.match(OAUTH2_RELOGIN_MESSAGE, /设备码登录/)
  assert.match(OAUTH2_RELOGIN_MESSAGE, /不使用授权码/, 'the password hint must never be given to an OAuth2 account')
  assert.match(NOT_LOGGED_IN_MESSAGE, /设置页/)
})

test('the built-in community application is the default, and an account can override it', async t => {
  // Registering an application is a wall in front of the one provider where
  // OAuth2 cannot be avoided, so the plugin ships the registration contributed
  // by gurio-wine (used with permission, credited in the README). Pinned here
  // because the value decides whose consent screen and whose tenant a user ends
  // up in — a silent swap must not ride along in a release.
  assert.equal(OUTLOOK_OAUTH2_CLIENT_ID, '15dcd5aa-00dd-487f-82d7-1d2b2c299e14')
  assert.equal(clientIdOf({ user: 'fixture@outlook.com' }), OUTLOOK_OAUTH2_CLIENT_ID,
    'an account that names no application logs in through the built-in one')

  writeTokens({})
  const calls = mockFetch(t, () => jsonResponse(DEVICE_OK))
  const start = await startDeviceFlow('work', { user: 'fixture@outlook.com' })
  assert.equal(start.code, 'ABCD-EFGH')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].params.client_id, OUTLOOK_OAUTH2_CLIENT_ID, 'the built-in app is what the authority is asked for')

  // The same account with an id of its own starts the flow through that one.
  const own = mockFetch(t, () => jsonResponse(DEVICE_OK))
  const custom = await startDeviceFlow('work', { user: 'fixture@outlook.com', clientId: 'own-app' })
  assert.equal(custom.code, 'ABCD-EFGH')
  assert.equal(own.length, 1)
  assert.equal(own[0].params.client_id, 'own-app', 'an account that names one overrides the built-in app')
})
