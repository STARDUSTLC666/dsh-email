import test from 'node:test'
import assert from 'node:assert/strict'
import {
  autodiscoverEmailServer,
  EmailSettingsBackend,
  extractDiscoveryDomain,
  parseAccountsYaml,
  parseAutoconfigXml,
  parsePublicDnsMxAnswer,
  parsePublicDnsSrvAnswer,
  SETTINGS_NAMESPACE,
} from '../lib/index.js'
import { SETTINGS_API_ROUTE } from '../lib/web.js'

const VALID_AUTOCONFIG_XML = `<?xml version="1.0" encoding="UTF-8"?>
<clientConfig version="1.1">
  <emailProvider id="acme-mail.example">
    <displayName>Acme Cloud Mail</displayName>
    <incomingServer type="imap">
      <hostname>imap.acme-mail.org</hostname>
      <port>143</port>
      <socketType>STARTTLS</socketType>
      <authentication>password-cleartext</authentication>
    </incomingServer>
    <incomingServer type="imap">
      <hostname>imap.acme-mail.org</hostname>
      <port>993</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
    </incomingServer>
    <incomingServer type="pop3">
      <hostname>pop.acme-mail.org</hostname>
      <port>995</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
    </incomingServer>
    <outgoingServer type="smtp">
      <hostname>smtp.acme-mail.org</hostname>
      <port>465</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
    </outgoingServer>
  </emailProvider>
</clientConfig>`

test('extractDiscoveryDomain strips local-part, normalizes case/IDN, and rejects malformed/IP inputs', () => {
  assert.equal(extractDiscoveryDomain('secret.user+tag@EXAMPLE.COM.'), 'example.com')
  assert.equal(extractDiscoveryDomain('  corp.example.org  '), 'corp.example.org')
  assert.equal(extractDiscoveryDomain('alice@例子.中国'), 'xn--fsqu00a.xn--fiqs8s')
  for (const bad of ['', '   ', 'localhost', 'user@localhost', '127.0.0.1', 'user@10.0.0.1', 'user@[::1]', 'https://mail.example.com/imap', 'a b@example.com', 'user@example.com:993', 'user@\nexample.com']) {
    assert.throws(() => extractDiscoveryDomain(bad), /邮箱地址|valid email/i)
  }
})

test('Layer 1 matches built-in domains offline without touching DNS or HTTP', async () => {
  let networkCalls = 0
  const deps = {
    resolveMx: async () => { networkCalls++; return [] },
    resolveSrv: async () => { networkCalls++; return [] },
    fetchPublicXml: async () => { networkCalls++; return undefined },
  }
  const qq = await autodiscoverEmailServer('alice@foxmail.com', { dependencies: deps })
  assert.equal(qq?.source, 'builtin-domain')
  assert.equal(qq?.provider, 'qq')
  assert.equal(qq?.imap?.host, 'imap.qq.com')
  assert.equal(qq?.pop3?.host, 'pop.qq.com')

  const outlook = await autodiscoverEmailServer('bob@hotmail.com', { dependencies: deps })
  assert.equal(outlook?.provider, 'outlook')
  assert.equal(outlook?.authKind, 'oauth2')
  assert.equal(outlook?.oauthProvider, 'microsoft')

  const agentmail = await autodiscoverEmailServer('bot@agentmail.to', { dependencies: deps })
  assert.equal(agentmail?.provider, 'agentmail')
  assert.equal(networkCalls, 0)
})

test('Layer 2 matches curated offline extended providers without touching DNS or HTTP', async () => {
  let networkCalls = 0
  const deps = {
    resolveMx: async () => { networkCalls++; return [] },
    resolveSrv: async () => { networkCalls++; return [] },
    fetchPublicXml: async () => { networkCalls++; return undefined },
  }
  const cases = [
    ['u@yeah.net', 'imap.yeah.net', 993, 'smtp.yeah.net', 465, true],
    ['u@139.com', 'imap.139.com', 993, 'smtp.139.com', 465, true],
    ['u@feishu.cn', 'imap.feishu.cn', 993, 'smtp.feishu.cn', 465, true],
    ['u@yahoo.co.jp', 'imap.mail.yahoo.co.jp', 993, 'smtp.mail.yahoo.co.jp', 465, true],
    ['u@fastmail.com', 'imap.fastmail.com', 993, 'smtp.fastmail.com', 465, true],
    ['u@gmx.de', 'imap.gmx.net', 993, 'mail.gmx.net', 587, false],
  ]
  for (const [email, imapHost, imapPort, smtpHost, smtpPort, smtpSecure] of cases) {
    const res = await autodiscoverEmailServer(email, { dependencies: deps })
    assert.equal(res?.source, 'offline-db', email)
    assert.equal(res?.provider, undefined, email)
    assert.equal(res?.imap?.host, imapHost, email)
    assert.equal(res?.imap?.port, imapPort, email)
    assert.equal(res?.smtp?.host, smtpHost, email)
    assert.equal(res?.smtp?.port, smtpPort, email)
    assert.equal(res?.smtp?.secure, smtpSecure, email)
  }
  assert.equal(networkCalls, 0)
})

test('Layer 3 reverse-maps custom corporate domains via DNS MX priority without HTTP', async () => {
  let httpCalls = 0
  const mxFixtures = [
    {
      mx: [{ priority: 10, exchange: 'mxbiz2.qq.com' }, { priority: 5, exchange: 'mxbiz1.qq.com' }],
      expect: { provider: 'exmail', imapHost: 'imap.exmail.qq.com', smtpPort: 465 },
    },
    {
      mx: [{ priority: 1, exchange: 'aspmx.l.google.com' }],
      expect: { provider: 'gmail', imapHost: 'imap.gmail.com', smtpPort: 465 },
    },
    {
      mx: [{ priority: 0, exchange: 'acme-com.mail.protection.outlook.com' }],
      expect: { provider: 'outlook', imapHost: 'outlook.office365.com', smtpPort: 587, authKind: 'oauth2' },
    },
    {
      mx: [{ priority: 5, exchange: 'mxn.mxhichina.com' }],
      expect: { provider: undefined, imapHost: 'imap.qiye.aliyun.com', smtpPort: 465 },
    },
    {
      mx: [{ priority: 5, exchange: 'mx.ym.163.com' }],
      expect: { provider: undefined, imapHost: 'imap.ym.163.com', smtpPort: 994 },
    },
    {
      mx: [{ priority: 5, exchange: 'mx1.feishu.cn' }],
      expect: { provider: undefined, imapHost: 'imap.feishu.cn', smtpPort: 465 },
    },
    {
      mx: [{ priority: 10, exchange: 'mx.zoho.com' }],
      expect: { provider: undefined, imapHost: 'imappro.zoho.com', smtpPort: 465 },
    },
    {
      mx: [{ priority: 20, exchange: 'mxbiz1.qq.com' }, { priority: 5, exchange: 'mx1.qiye.163.com' }],
      expect: { provider: undefined, imapHost: 'imap.qiye.163.com', smtpPort: 465 },
    },
  ]

  for (const fixture of mxFixtures) {
    const res = await autodiscoverEmailServer('alice@custom-corp.org', {
      dependencies: {
        resolveMx: async () => fixture.mx,
        resolveSrv: async () => [],
        fetchPublicXml: async () => { httpCalls++; return undefined },
      },
    })
    assert.equal(res?.source, 'mx')
    assert.equal(res?.provider, fixture.expect.provider)
    assert.equal(res?.imap?.host, fixture.expect.imapHost)
    assert.equal(res?.smtp?.port, fixture.expect.smtpPort)
    if (fixture.expect.authKind) assert.equal(res?.authKind, fixture.expect.authKind)
  }
  assert.equal(httpCalls, 0)
})

test('Layer 4 discovers RFC 6186 SRV endpoints and blocks public domains from targeting private hosts', async () => {
  const res = await autodiscoverEmailServer('alice@srv-corp.org', {
    dependencies: {
      resolveMx: async () => [{ priority: 10, exchange: 'mx.srv-corp.org' }],
      resolveSrv: async name => {
        if (name === '_imaps._tcp.srv-corp.org') return [{ priority: 10, weight: 5, port: 993, name: 'imap.srv-corp.org' }]
        if (name === '_submissions._tcp.srv-corp.org') return [{ priority: 10, weight: 5, port: 465, name: 'smtp.srv-corp.org' }]
        return []
      },
      fetchPublicXml: async () => { throw new Error('must not reach HTTP when SRV succeeded') },
    },
  })
  assert.equal(res?.source, 'srv')
  assert.deepEqual(res?.imap, { host: 'imap.srv-corp.org', port: 993, secure: true })
  assert.deepEqual(res?.smtp, { host: 'smtp.srv-corp.org', port: 465, secure: true })

  // A hostile public domain's SRV pointing to localhost / private host must be rejected.
  const hostile = await autodiscoverEmailServer('alice@hostile-public.org', {
    allowOnlineLookup: false,
    dependencies: {
      resolveMx: async () => [],
      resolveSrv: async name => {
        if (name === '_imaps._tcp.hostile-public.org') return [{ priority: 0, weight: 0, port: 993, name: '127.0.0.1' }]
        if (name === '_submissions._tcp.hostile-public.org') return [{ priority: 0, weight: 0, port: 465, name: 'smtp.corp.local' }]
        return []
      },
    },
  })
  assert.equal(hostile, null)
})

test('private/internal domains use local DNS SRV safely and NEVER leak to public HTTPS or Thunderbird ISPDB', async () => {
  const fetchedUrls = []
  const intranet = await autodiscoverEmailServer('alice@corp.local', {
    dependencies: {
      resolveMx: async () => [],
      resolveSrv: async name => {
        if (name === '_imaps._tcp.corp.local') return [{ priority: 0, weight: 0, port: 993, name: 'mail.corp.local' }]
        if (name === '_submissions._tcp.corp.local') return [{ priority: 0, weight: 0, port: 465, name: 'mail.corp.local' }]
        return []
      },
      fetchPublicXml: async url => { fetchedUrls.push(url); return VALID_AUTOCONFIG_XML },
    },
  })
  assert.equal(intranet?.source, 'srv')
  assert.equal(intranet?.imap?.host, 'mail.corp.local')
  assert.deepEqual(fetchedUrls, [])

  // Even when SRV fails, private/internal domains must NEVER call public HTTPS autoconfig or ISPDB.
  for (const domain of ['corp.local', 'office.internal', 'router.home.arpa', 'dev.lan']) {
    const res = await autodiscoverEmailServer('alice@' + domain, {
      dependencies: {
        resolveMx: async () => [],
        resolveSrv: async () => [],
        fetchPublicXml: async url => { fetchedUrls.push(url); return VALID_AUTOCONFIG_XML },
      },
    })
    assert.equal(res, null)
  }
  assert.deepEqual(fetchedUrls, [])
})

test('Layers 5 & 6 fetch HTTPS autoconfig & Thunderbird ISPDB without leaking email username and prefer SSL', async () => {
  const requestedUrls = []
  const ispdbHit = await autodiscoverEmailServer('super.secret.user@regional-isp.org', {
    dependencies: {
      resolveMx: async () => [],
      resolveSrv: async () => [],
      fetchPublicXml: async url => {
        requestedUrls.push(url)
        if (url === 'https://autoconfig.thunderbird.net/v1.1/regional-isp.org') return VALID_AUTOCONFIG_XML
        return undefined
      },
    },
  })
  assert.deepEqual(requestedUrls, [
    'https://autoconfig.regional-isp.org/mail/config-v1.1.xml',
    'https://regional-isp.org/.well-known/autoconfig/mail/config-v1.1.xml',
    'https://autoconfig.thunderbird.net/v1.1/regional-isp.org',
  ])
  for (const url of requestedUrls) {
    assert.ok(url.startsWith('https://'))
    assert.ok(!url.includes('secret'))
    assert.ok(!url.includes('emailaddress'))
  }
  assert.equal(ispdbHit?.source, 'ispdb')
  assert.equal(ispdbHit?.labelEn, 'Acme Cloud Mail')
  assert.deepEqual(ispdbHit?.imap, { host: 'imap.acme-mail.org', port: 993, secure: true })
  assert.deepEqual(ispdbHit?.smtp, { host: 'smtp.acme-mail.org', port: 465, secure: true })
  assert.deepEqual(ispdbHit?.pop3, { host: 'pop.acme-mail.org', port: 995, secure: true })
})

test('parseAutoconfigXml rejects cleartext plain endpoints, POP3 STARTTLS, private hosts, and oversized XML', () => {
  const plainXml = `<clientConfig version="1.1"><emailProvider id="x"><displayName>Plain</displayName>
    <incomingServer type="imap"><hostname>imap.plain.org</hostname><port>143</port><socketType>plain</socketType></incomingServer>
    <outgoingServer type="smtp"><hostname>smtp.plain.org</hostname><port>25</port><socketType>plain</socketType></outgoingServer>
  </emailProvider></clientConfig>`
  assert.equal(parseAutoconfigXml(plainXml, 'plain.org'), undefined)

  const pop3StarttlsXml = `<clientConfig version="1.1"><emailProvider id="x"><displayName>Pop</displayName>
    <incomingServer type="pop3"><hostname>pop.poponly.org</hostname><port>110</port><socketType>STARTTLS</socketType></incomingServer>
  </emailProvider></clientConfig>`
  assert.equal(parseAutoconfigXml(pop3StarttlsXml, 'poponly.org'), undefined)

  const privateHostXml = `<clientConfig version="1.1"><emailProvider id="x"><displayName>Evil</displayName>
    <incomingServer type="imap"><hostname>127.0.0.1</hostname><port>993</port><socketType>SSL</socketType></incomingServer>
    <outgoingServer type="smtp"><hostname>smtp.corp.local</hostname><port>465</port><socketType>SSL</socketType></outgoingServer>
  </emailProvider></clientConfig>`
  assert.equal(parseAutoconfigXml(privateHostXml, 'evil.org'), undefined)

  const oversized = '<clientConfig version="1.1">' + 'a'.repeat(70 * 1024) + '</clientConfig>'
  assert.equal(parseAutoconfigXml(oversized, 'big.org'), undefined)

  // Known built-in host in XML maps cleanly back to built-in provider with verified preset endpoints.
  const gmailXml = `<clientConfig version="1.1"><emailProvider id="g"><displayName>Campus Mail</displayName>
    <incomingServer type="imap"><hostname>imap.gmail.com</hostname><port>993</port><socketType>SSL</socketType></incomingServer>
    <outgoingServer type="smtp"><hostname>attacker-smtp.evil.org</hostname><port>465</port><socketType>SSL</socketType></outgoingServer>
  </emailProvider></clientConfig>`
  const mapped = parseAutoconfigXml(gmailXml, 'campus.edu')
  assert.equal(mapped?.provider, 'gmail')
  assert.equal(mapped?.smtp?.host, 'smtp.gmail.com')
})

test('authenticated settings route exposes autodiscover action safely without touching credentials', async () => {
  const stored = { provider: 'qq', user: 'a@qq.com', password: 'stored-secret', accountsYaml: 'work:\n  provider: qq\n  user: a@qq.com\n  password: stored-secret\n' }
  const scope = { namespace: SETTINGS_NAMESPACE, get: () => stored }
  const ctx = { settings: { writable: true, describe: () => [{ ns: SETTINGS_NAMESPACE, revision: 1, applies: 'live', user: stored }], replace: async () => {} } }
  const backend = new EmailSettingsBackend(ctx, scope, {})
  const observedDomains = []
  backend.autodiscoverDeps = {
    resolveMx: async domain => { observedDomains.push(domain); return [{ priority: 5, exchange: 'mx1.feishu.cn' }] },
    resolveSrv: async () => [],
    fetchPublicXml: async () => undefined,
  }

  const req = (body, origin = 'http://127.0.0.1:3000', site = 'same-origin') => new Request('http://127.0.0.1:3000' + SETTINGS_API_ROUTE, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-dsh-email-settings': '1', origin, 'sec-fetch-site': site },
    body: JSON.stringify(body),
  })

  const okRes = await backend.fetch(req({ action: 'autodiscover', email: 'private-user@mycorp.org', password: 'should-be-ignored' }))
  assert.equal(okRes.status, 200)
  const okBody = await okRes.json()
  assert.equal(okBody.ok, true)
  assert.equal(okBody.value.found, true)
  assert.equal(okBody.value.result.source, 'mx')
  assert.equal(okBody.value.result.imap.host, 'imap.feishu.cn')
  assert.deepEqual(observedDomains, ['mycorp.org'])
  assert.ok(!JSON.stringify(okBody).includes('private-user'))
  assert.ok(!JSON.stringify(okBody).includes('stored-secret'))
  assert.ok(!JSON.stringify(okBody).includes('should-be-ignored'))

  // DSH Desktop origin is also allowed on autodiscover.
  const desktopRes = await backend.fetch(req({ action: 'autodiscover', domain: 'qq.com' }, 'dsh-app://app', 'cross-site'))
  assert.equal(desktopRes.status, 200)
  assert.equal((await desktopRes.json()).value.result.provider, 'qq')

  // Cross-origin request is rejected by the existing settings carrier guard.
  const crossOrigin = await backend.fetch(new Request('http://127.0.0.1:3000' + SETTINGS_API_ROUTE, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-dsh-email-settings': '1', origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' },
    body: JSON.stringify({ action: 'autodiscover', domain: 'qq.com' }),
  }))
  assert.equal(crossOrigin.status, 403)

  // Invalid domain returns 400.
  const badRes = await backend.fetch(req({ action: 'autodiscover', domain: 'not-a-domain' }))
  assert.equal(badRes.status, 400)

  // Clearing password when switching to a newly discovered server removes stored password from YAML.
  const clearRes = await backend.fetch(req({
    action: 'serializeAccounts',
    accountsYaml: stored.accountsYaml,
    defaultAccount: 'work',
    accounts: [{
      name: 'work',
      user: 'a@mycorp.org',
      password: '',
      authPassword: '',
      imap: { host: 'imap.feishu.cn', port: 993, secure: true },
      smtp: { host: 'smtp.feishu.cn', port: 465, secure: true },
      inboxFolder: 'INBOX',
    }],
  }))
  assert.equal(clearRes.status, 200)
  const clearedYaml = (await clearRes.json()).value.accountsYaml
  const parsed = parseAccountsYaml(clearedYaml).map.work
  assert.equal(parsed.password, undefined)
  assert.equal(parsed.imap.host, 'imap.feishu.cn')
})

test('DoH MX/SRV fallback parses both AliDNS object Question and Cloudflare array Question, and never runs on private domains', async () => {
  const aliDoc = {
    Status: 0,
    TC: false,
    Question: { name: 'deepseek.com.', type: 15 },
    Answer: [
      { type: 15, data: '10 hzmx02.mxmail.netease.com.' },
      { type: 15, data: '5 hzmx01.mxmail.netease.com.' },
    ],
  }
  assert.deepEqual(parsePublicDnsMxAnswer(aliDoc, 'deepseek.com'), [
    { priority: 10, exchange: 'hzmx02.mxmail.netease.com' },
    { priority: 5, exchange: 'hzmx01.mxmail.netease.com' },
  ])

  const cfSrvDoc = {
    Status: 0,
    TC: false,
    Question: [{ name: '_imaps._tcp.example.org', type: 33 }],
    Answer: [{ type: 33, data: '10 5 993 imap.example.org.' }],
  }
  assert.deepEqual(parsePublicDnsSrvAnswer(cfSrvDoc, '_imaps._tcp.example.org'), [
    { priority: 10, weight: 5, port: 993, name: 'imap.example.org' },
  ])

  // Mismatched question name is rejected.
  assert.deepEqual(parsePublicDnsMxAnswer(aliDoc, 'other.com'), [])

  // When system resolveMx fails on a public domain, DoH fallback recovers MX cleanly.
  const dohCalls = []
  const hit = await autodiscoverEmailServer('alice@deepseek.com', {
    dependencies: {
      resolveMx: async () => { throw new Error('ECONNREFUSED') },
      resolveSrv: async () => [],
      queryPublicDnsJson: async (name, type) => { dohCalls.push([name, type]); return aliDoc },
      fetchPublicXml: async () => undefined,
    },
  })
  assert.equal(hit?.source, 'mx')
  assert.equal(hit?.imap?.host, 'imap.qiye.163.com')
  assert.deepEqual(dohCalls, [['deepseek.com', 15]])

  // Private domain must NEVER hit DoH even when system DNS fails.
  const privateDoh = []
  const miss = await autodiscoverEmailServer('alice@corp.local', {
    dependencies: {
      resolveMx: async () => { throw new Error('ECONNREFUSED') },
      resolveSrv: async () => { throw new Error('ECONNREFUSED') },
      queryPublicDnsJson: async (name, type) => { privateDoh.push([name, type]); return aliDoc },
      fetchPublicXml: async () => undefined,
    },
  })
  assert.equal(miss, null)
  assert.deepEqual(privateDoh, [])
})

test('explicit caller cancellation aborts immediately, while unresponsive remote lookups degrade cleanly to null', async () => {
  const controller = new AbortController()
  const pending = autodiscoverEmailServer('alice@slow-domain.org', {
    signal: controller.signal,
    dependencies: {
      resolveMx: () => new Promise(() => {}),
      resolveSrv: async () => [],
      fetchPublicXml: async () => undefined,
    },
  })
  controller.abort(new Error('user-cancelled'))
  await assert.rejects(pending, /user-cancelled/)
})

