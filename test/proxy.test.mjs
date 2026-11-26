import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer as httpServer } from 'node:http'
import { createServer as httpsServer } from 'node:https'
import { createServer } from 'node:net'
import { createServer as tlsServer } from 'node:tls'
import { readFileSync } from 'node:fs'
import { resolveEmailSettings } from '../lib/index.js'
import { fetchWithProxy, openProxiedSocket, parseProxyUrl, resolveProxyUrl } from '../lib/proxy.js'
import { startHttpProxy, startSocks5Proxy } from './helpers/proxy-peer.mjs'

/** A CONNECT proxy that answers with `status`, then echoes whatever it tunnels. */
async function stubProxy(status = 200) {
  const seen = []
  const server = createServer(socket => {
    let buffered = ''
    socket.on('data', chunk => {
      buffered += chunk.toString('latin1')
      const end = buffered.indexOf('\r\n\r\n')
      if (end < 0) return
      const head = buffered.slice(0, end)
      seen.push(head)
      const lines = head.split('\r\n')
      socket.write(`HTTP/1.1 ${status} ${status === 200 ? 'Connection established' : 'Proxy Authentication Required'}\r\n\r\n`, 'latin1')
      // Whatever the client writes after the handshake comes back, which proves
      // the socket really became a tunnel rather than a plain connection.
      socket.removeAllListeners('data')
      socket.on('data', data => socket.write(data))
      if (status !== 200) socket.end()
    })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return { url: `http://127.0.0.1:${port}`, seen, close: () => new Promise(resolve => server.close(resolve)) }
}

test('a bare host:port is read as an HTTP proxy, and bad input is rejected with the scheme list', () => {
  assert.equal(parseProxyUrl('127.0.0.1:7897').href, 'http://127.0.0.1:7897/')
  assert.equal(parseProxyUrl('socks5://127.0.0.1:1080').protocol, 'socks5:')
  assert.equal(parseProxyUrl('   '), undefined)
  assert.throws(() => parseProxyUrl('ftp://127.0.0.1:21'), /不支持的代理协议/)
  assert.throws(() => parseProxyUrl('http://'), /代理地址/)
})

test('the account proxy wins over the environment, which wins over a direct connection', () => {
  assert.equal(resolveProxyUrl('http://127.0.0.1:7897', { HTTPS_PROXY: 'http://env.test:8080' }), 'http://127.0.0.1:7897/')
  assert.equal(resolveProxyUrl('', { HTTPS_PROXY: 'http://env.test:8080' }), 'http://env.test:8080/')
  assert.equal(resolveProxyUrl(undefined, { https_proxy: 'socks5://env.test:1080' }), 'socks5://env.test:1080')
  assert.equal(resolveProxyUrl(undefined, {}), undefined)
  // NO_PROXY bypasses the environment, but never an address the user typed.
  assert.equal(resolveProxyUrl(undefined, { HTTPS_PROXY: 'http://env.test:8080', NO_PROXY: 'gmail.com' }, 'imap.gmail.com'), undefined)
  assert.equal(resolveProxyUrl('http://127.0.0.1:7897', { NO_PROXY: '*' }, 'imap.gmail.com'), 'http://127.0.0.1:7897/')
})

test('a loopback mail host ignores an environment proxy but still honours an explicit one', () => {
  const env = { HTTPS_PROXY: 'http://env.test:8080', ALL_PROXY: 'socks5://env.test:1080' }
  // A CONNECT to 127.0.0.1 through an external proxy would target the proxy's own
  // loopback, so a local relay or test fixture must stay direct.
  for (const host of ['127.0.0.1', '127.1.2.3', 'localhost', 'LOCALHOST', 'smtp.localhost', '::1', '[::1]']) {
    assert.equal(resolveProxyUrl(undefined, env, host), undefined, host)
  }
  // The escape hatch stays: an explicitly typed proxy is the user's decision.
  assert.equal(resolveProxyUrl('http://127.0.0.1:7897', env, 'localhost'), 'http://127.0.0.1:7897/')
  // Non-loopback hosts keep inheriting the environment.
  assert.equal(resolveProxyUrl(undefined, env, 'smtp.qq.com'), 'http://env.test:8080/')
  assert.equal(resolveProxyUrl(undefined, env, '10.0.0.5'), 'http://env.test:8080/')
})

test('openProxiedSocket tunnels through an HTTP CONNECT proxy', async () => {
  const proxy = await stubProxy()
  try {
    const socket = await openProxiedSocket(proxy.url, 'smtp.example.test', 465)
    assert.equal(proxy.seen.length, 1)
    assert.match(proxy.seen[0], /^CONNECT smtp\.example\.test:465 HTTP\/1\.1/)
    socket.write('ping')
    const echoed = await new Promise(resolve => socket.once('data', data => resolve(data.toString('latin1'))))
    assert.equal(echoed, 'ping')
    socket.destroy()
  } finally {
    await proxy.close()
  }
})

test('a CONNECT proxy that refuses the tunnel fails with the proxy status, not a bare timeout', async () => {
  const proxy = await stubProxy(407)
  try {
    await assert.rejects(openProxiedSocket(proxy.url, 'smtp.example.test', 465), /HTTP 407/)
  } finally {
    await proxy.close()
  }
})

test('an unreachable proxy reports itself instead of the mail host', async () => {
  await assert.rejects(openProxiedSocket('http://127.0.0.1:1', 'smtp.example.test', 465), /无法连接代理/)
})

test('the proxy survives config resolution and is validated there', () => {
  const base = { provider: 'gmail', user: 'user@gmail.com', password: 'fixture-only' }
  const settings = resolveEmailSettings({ ...base, proxy: '127.0.0.1:7897' })
  assert.equal(settings.accounts.get('default').proxy, '127.0.0.1:7897')
  // Named accounts inherit it from the shared section, and may override it.
  const named = resolveEmailSettings({ ...base, proxy: 'http://127.0.0.1:7897', accounts: { work: { user: 'work@gmail.com', password: 'fixture-only', provider: 'gmail' } } })
  assert.equal(named.accounts.get('work').proxy, 'http://127.0.0.1:7897')
  const overridden = resolveEmailSettings({ ...base, proxy: 'http://127.0.0.1:7897', accounts: { work: { user: 'work@gmail.com', password: 'fixture-only', provider: 'gmail', proxy: 'socks5://127.0.0.1:1080' } } })
  assert.equal(overridden.accounts.get('work').proxy, 'socks5://127.0.0.1:1080')
  assert.throws(() => resolveEmailSettings({ ...base, proxy: 'ftp://127.0.0.1:21' }), /代理地址无效/)
  assert.equal(resolveEmailSettings(base).accounts.get('default').proxy, undefined)
})

test('an HTTPS proxy must pass TLS certificate validation before CONNECT credentials are sent',async t=>{
  const sockets=new Set(),received=[]
  const server=tlsServer({key:readFileSync(new URL('./fixtures/smtp-test-key.pem',import.meta.url)),cert:readFileSync(new URL('./fixtures/smtp-test-ca.pem',import.meta.url))},socket=>socket.on('data',data=>received.push(data.toString())))
  server.on('connection',socket=>{sockets.add(socket);socket.on('error',()=>{});socket.on('close',()=>sockets.delete(socket))});server.on('tlsClientError',()=>{})
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>{for(const socket of sockets)socket.destroy();server.close()})
  await assert.rejects(openProxiedSocket('https://fixture-user:fixture-password@127.0.0.1:'+server.address().port,'smtp.example.test',465),/certificate|self.signed|verify|证书/i)
  assert.equal(received.length,0)
})

test('direct mode ignores inherited environment proxies and proxy parse failures hide URL credentials', () => {
  assert.equal(resolveProxyUrl('direct',{HTTPS_PROXY:'http://env.test:8080'}),undefined);
  assert.throws(()=>parseProxyUrl('http://fixture-user:do-not-echo@bad host'),error=>!error.message.includes('fixture-user')&&!error.message.includes('do-not-echo'));
  assert.throws(()=>parseProxyUrl('http://proxy.test:8080/unsupported-path'),/路径/);
  assert.throws(()=>parseProxyUrl('http://proxy.test:0'),/端口/);
  const cfg=resolveEmailSettings({provider:'gmail',user:'user@gmail.com',password:'fixture-only',proxy:'direct'});
  assert.equal(cfg.accounts.get('default').proxy,'direct');
});
test('cancelling a pending CONNECT closes the proxy socket before its timeout',async t=>{
  const sockets=new Set();let accepted;
  const read=new Promise(resolve=>{accepted=resolve});
  const server=createServer(socket=>{sockets.add(socket);socket.on('error',()=>{});socket.once('data',accepted);socket.on('close',()=>sockets.delete(socket))});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{for(const socket of sockets)socket.destroy();server.close()});
  const controller=new AbortController(),pending=openProxiedSocket('http://127.0.0.1:'+server.address().port,'smtp.example.test',465,{signal:controller.signal});
  await read;controller.abort(new Error('fixture cancel'));await assert.rejects(pending,/fixture cancel/);
  for(let i=0;i<100&&sockets.size;i++)await new Promise(r=>setTimeout(r,10));
  assert.equal(sockets.size,0);
});

const TEST_KEY = readFileSync(new URL('./fixtures/smtp-test-key.pem', import.meta.url))
const TEST_CERT = readFileSync(new URL('./fixtures/smtp-test-ca.pem', import.meta.url))

async function startHttpsTarget(t, handler) {
  const server = httpsServer({ key: TEST_KEY, cert: TEST_CERT }, handler)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  return { port: server.address().port, url: `https://localhost:${server.address().port}` }
}

test('fetchWithProxy tunnels HTTPS POST through HTTP CONNECT with Basic auth and validates TLS certificates', async t => {
  const received = []
  const target = await startHttpsTarget(t, (req, res) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      received.push({ method: req.method, url: req.url, contentType: req.headers['content-type'], body: Buffer.concat(chunks).toString('utf8') })
      res.writeHead(200, { 'content-type': 'application/json', 'x-multi': ['a', 'b'] })
      res.end(JSON.stringify({ ok: true, via: 'http-connect' }))
    })
  })
  const proxy = await startHttpProxy({ auth: { user: 'alice', pass: 'p@ss:word' } })
  t.after(() => proxy.close())

  const proxyUrl = `http://alice:${encodeURIComponent('p@ss:word')}@127.0.0.1:${proxy.port}`
  const response = await fetchWithProxy(
    `${target.url}/token`,
    { method: 'POST', redirect: 'error', body: new URLSearchParams({ grant_type: 'refresh_token', code: 'abc' }) },
    proxyUrl,
    { tls: { ca: TEST_CERT } },
  )
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true, via: 'http-connect' })
  assert.equal(proxy.seen.length, 1)
  assert.equal(proxy.seen[0].method, 'CONNECT')
  assert.equal(proxy.seen[0].target, `localhost:${target.port}`)
  assert.equal(received.length, 1)
  assert.equal(received[0].method, 'POST')
  assert.equal(received[0].url, '/token')
  assert.match(received[0].contentType, /application\/x-www-form-urlencoded/i)
  assert.equal(received[0].body, 'grant_type=refresh_token&code=abc')

  // Without trusting the test CA, TLS verification must reject before sending the POST body.
  await assert.rejects(
    fetchWithProxy(`${target.url}/token`, { method: 'POST', body: 'secret=1' }, proxyUrl),
    /certificate|self.signed|verify/i,
  )
  assert.equal(received.length, 1, 'untrusted TLS peer must never receive the request body')

  // Wrong proxy credentials must fail with HTTP 407.
  await assert.rejects(
    fetchWithProxy(`${target.url}/token`, { method: 'GET' }, `http://alice:wrong@127.0.0.1:${proxy.port}`, { tls: { ca: TEST_CERT } }),
    /HTTP 407/,
  )
})

test('fetchWithProxy tunnels HTTPS through SOCKS5 and authenticated SOCKS5h with remote hostname resolution', async t => {
  const target = await startHttpsTarget(t, (req, res) => {
    if (req.url === '/empty') { res.writeHead(204); res.end(); return }
    if (req.url === '/redirect') { res.writeHead(302, { location: '/token' }); res.end(); return }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ host: req.headers.host, path: req.url, auth: req.headers.authorization || '' }))
  })

  const openSocks = await startSocks5Proxy()
  t.after(() => openSocks.close())
  const res1 = await fetchWithProxy(
    `${target.url}/v1/userinfo`,
    { headers: { authorization: 'Bearer tok-1' }, redirect: 'error' },
    openSocks.url,
    { tls: { ca: TEST_CERT } },
  )
  assert.equal(res1.status, 200)
  assert.deepEqual(await res1.json(), { host: `localhost:${target.port}`, path: '/v1/userinfo', auth: 'Bearer tok-1' })
  assert.equal(openSocks.seen[0].host, 'localhost')
  assert.equal(openSocks.seen[0].atyp, 0x03, 'domain name must be handed to SOCKS5 for remote resolution')

  // 204 No Content must produce a valid Response without throwing on null body.
  const empty = await fetchWithProxy(`${target.url}/empty`, { method: 'GET' }, openSocks.url, { tls: { ca: TEST_CERT } })
  assert.equal(empty.status, 204)

  // redirect: 'error' must block 3xx redirects through the proxy.
  await assert.rejects(
    fetchWithProxy(`${target.url}/redirect`, { redirect: 'error' }, openSocks.url, { tls: { ca: TEST_CERT } }),
    /redirect/i,
  )

  const authSocks = await startSocks5Proxy({ auth: { user: 'socks-u', pass: 'socks-p' } })
  t.after(() => authSocks.close())
  const res2 = await fetchWithProxy(
    `${target.url}/auth-ok`,
    { method: 'GET' },
    `socks5h://socks-u:socks-p@127.0.0.1:${authSocks.port}`,
    { tls: { ca: TEST_CERT } },
  )
  assert.equal(res2.status, 200)
  assert.equal(authSocks.seen[0].authUser, 'socks-u')
})

test('fetchWithProxy forwards plain HTTP through HTTP proxy, honours env/NO_PROXY/direct, and supports AbortSignal', async t => {
  let holdRes
  const plainTarget = httpServer((req, res) => {
    if (req.url === '/slow') { holdRes = res; return }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ url: req.url, host: req.headers.host, proxyAuth: req.headers['proxy-authorization'] || null }))
  })
  await new Promise(resolve => plainTarget.listen(0, '127.0.0.1', resolve))
  const targetPort = plainTarget.address().port
  t.after(() => { holdRes?.destroy(); return new Promise(resolve => plainTarget.close(resolve)) })

  const proxy = await startHttpProxy({
    auth: { user: 'u', pass: 'p' },
    rewriteTarget: () => ({ host: '127.0.0.1', port: targetPort }),
  })
  t.after(() => proxy.close())

  // Inherited HTTPS_PROXY routes non-loopback hosts through the proxy, stripping Proxy-Authorization before origin.
  const envProxy = `http://u:p@127.0.0.1:${proxy.port}`
  const viaEnv = await fetchWithProxy(
    'http://oauth-fixture.example/check?x=1',
    { method: 'GET' },
    undefined,
    { env: { HTTPS_PROXY: envProxy } },
  )
  assert.equal(viaEnv.status, 200)
  assert.deepEqual(await viaEnv.json(), { url: '/check?x=1', host: 'oauth-fixture.example', proxyAuth: null })
  assert.equal(proxy.seen[0].target, 'http://oauth-fixture.example/check?x=1')

  // NO_PROXY and explicit 'direct' both bypass the environment proxy and invoke directFetch.
  let directCalls = 0
  const directFetch = async () => { directCalls++; return new Response('direct') }
  assert.equal(await (await fetchWithProxy('http://oauth-fixture.example/a', {}, 'direct', { env: { HTTPS_PROXY: envProxy }, directFetch })).text(), 'direct')
  assert.equal(await (await fetchWithProxy('http://oauth-fixture.example/b', {}, undefined, { env: { HTTPS_PROXY: envProxy, NO_PROXY: 'oauth-fixture.example' }, directFetch })).text(), 'direct')
  assert.equal(directCalls, 2)

  // AbortSignal cancels an in-flight proxied request cleanly.
  const ctrl = new AbortController()
  const slowReq = fetchWithProxy('http://oauth-fixture.example/slow', { signal: ctrl.signal }, envProxy)
  for (let i = 0; i < 100 && !holdRes; i++) await new Promise(r => setTimeout(r, 10))
  ctrl.abort(new Error('abort-proxied-fetch'))
  await assert.rejects(slowReq, /abort-proxied-fetch/)
})
