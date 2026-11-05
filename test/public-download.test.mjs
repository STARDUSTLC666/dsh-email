import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { publicAddress, createPublicDownloader } from '../lib/public-download.js'
import { resolvePublicAddresses, parsePublicDnsAnswer, publicDnsName } from '../lib/public-dns.js'

const active = () => AbortSignal.timeout(3000)
const publicRows = [{ address: '93.184.215.14', family: 4 }]
const fakeRows = [{ address: '198.18.0.20', family: 4 }]
const answer = (host, type, rows = []) => ({ Status: 0, Question: [{ name: host + '.', type }], Answer: rows })
const response = (body, statusCode = 200, headers = {}) => Object.assign(Readable.from([Buffer.from(body)]), { statusCode, headers })

test('ordinary public DNS keeps the system path and never contacts an extra resolver', async () => {
  let queried = false
  const rows = await resolvePublicAddresses('images.example.com', active(), {
    lookup: async () => publicRows,
    query: async () => { queried = true; return publicRows },
  })
  assert.deepEqual(rows, publicRows)
  assert.equal(queried, false)
})
test('Fake-IP answers are replaced with verified public records, never connected as virtual addresses', async () => {
  const requested = []
  const rows = await resolvePublicAddresses('images.example.com', active(), {
    lookup: async () => fakeRows,
    query: async (host) => { requested.push(host); return publicRows },
  })
  assert.deepEqual(rows, publicRows)
  assert.deepEqual(requested, ['images.example.com'])
  assert.equal(rows.some(row => row.address.startsWith('198.18.')), false)
})
test('private, local, metadata and mixed DNS responses never trigger the public fallback', async () => {
  for (const addresses of [['127.0.0.1'], ['10.0.0.2'], ['169.254.169.254'], ['100.100.100.200'], ['::1'], ['::ffff:127.0.0.1'], ['198.18.0.20', '10.0.0.2'], ['198.18.0.20', '93.184.215.14']]) {
    let queries = 0
    await assert.rejects(resolvePublicAddresses('images.example.com', active(), {
      lookup: async () => addresses.map(address => ({ address, family: address.includes(':') ? 6 : 4 })),
      query: async () => { queries++; return publicRows },
    }), error => error.code === 'PUBLIC_ADDRESS_REQUIRED')
    assert.equal(queries, 0)
  }
})
test('virtual IP literals and private names cannot use the encrypted resolver as a bypass', async () => {
  for (const host of ['198.18.0.20', 'localhost', 'metadata.google.internal', 'printer.local', 'intranet', 'images.example.invalid', 'home.arpa', 'printer.home.arpa']) {
    let calls = 0
    await assert.rejects(resolvePublicAddresses(host, active(), { lookup: async () => fakeRows, query: async () => { calls++; return publicRows } }))
    assert.equal(calls, 0)
  }
  assert.equal(publicDnsName('images.example.com.'), true)
  assert.equal(publicDnsName('bad_name.example.com'), false)
})
test('public fallback fails closed for private, mixed, empty and malformed destination records', async () => {
  for (const rows of [[], [{ address: '10.0.0.2', family: 4 }], [...publicRows, { address: '::1', family: 6 }], [{ address: '93.184.215.14', family: 6 }], [{ address: '2001:4860::1%eth0', family: 6 }]]) {
    await assert.rejects(resolvePublicAddresses('images.example.com', active(), { lookup: async () => fakeRows, query: async () => rows }), error => error.code === 'PUBLIC_ADDRESS_REQUIRED')
  }
})
test('resolver response must match the question and never trusts a private A or AAAA record', () => {
  const host = 'images.example.com'
  assert.deepEqual(parsePublicDnsAnswer(answer(host, 1, [{ type: 5, data: 'cdn.example.com' }, { type: 1, data: '93.184.215.14' }]), host, 1), publicRows)
  assert.deepEqual(parsePublicDnsAnswer(answer(host, 28), host, 28), [])
  for (const value of [null, { ...answer(host, 1), Status: 3 }, { ...answer(host, 1), TC: true }, answer('other.example.com', 1), answer(host, 28), { ...answer(host, 1), Answer: 'not an array' }]) assert.throws(() => parsePublicDnsAnswer(value, host, 1))
  for (const row of [{ type: 1, data: '169.254.169.254' }, { type: 28, data: '::ffff:127.0.0.1' }, { type: 1, data: 'not-an-ip' }]) assert.throws(() => parsePublicDnsAnswer(answer(host, 1, [row]), host, 1))
})
test('DNS work and fallback respect cancellation, including a pending resolver', async () => {
  const controller = new AbortController(), pending = resolvePublicAddresses('images.example.com', controller.signal, { lookup: () => new Promise(() => {}) })
  controller.abort(new Error('cancelled'))
  await assert.rejects(pending, /cancelled/)
  const next = new AbortController(), queried = resolvePublicAddresses('images.example.com', next.signal, { lookup: async () => fakeRows, query: () => new Promise(() => {}) })
  await Promise.resolve(); await Promise.resolve(); next.abort(new Error('cancelled query'))
  await assert.rejects(queried, /cancelled query/)
})
test('a DNS failure does not silently switch a normal or private name to a public resolver', async () => {
  let queries = 0
  await assert.rejects(resolvePublicAddresses('images.example.com', active(), { lookup: async () => { throw Error('dns failed') }, query: async () => { queries++; return publicRows } }), error => error.code === 'PUBLIC_DNS_FAILED')
  assert.equal(queries, 0)
})
test('download pins verified records, supplies no credentials and validates every redirect', async () => {
  const calls = [], download = createPublicDownloader({
    resolve: async host => { calls.push(['resolve', host]); return publicRows },
    request: async (url, records) => { calls.push(['request', url.href, records]); return calls.filter(c => c[0] === 'request').length === 1 ? response('', 302, { location: 'https://cdn.example.com/a.png' }) : response('image') },
  })
  assert.equal((await download('https://images.example.com/a.png', 10)).toString(), 'image')
  assert.deepEqual(calls.filter(c => c[0] === 'resolve').map(c => c[1]), ['images.example.com', 'cdn.example.com'])
  for (const call of calls.filter(c => c[0] === 'request')) assert.deepEqual(call[2], publicRows)
})
test('redirects to private destinations, credentials, HTTP and alternate ports stop before connection', async () => {
  for (const location of ['https://127.0.0.1/a', 'https://user:secret@example.com/a', 'http://example.com/a', 'https://example.com:8443/a']) {
    let connections = 0
    const download = createPublicDownloader({
      resolve: async host => host === '127.0.0.1' ? [{ address: host, family: 4 }] : publicRows,
      request: async () => { connections++; return response('', 302, { location }) },
    })
    await assert.rejects(download('https://images.example.com/a', 10))
    assert.equal(connections, 1)
  }
})
test('redirect limit, declared size and streamed size are bounded and response streams close', async () => {
  let connections = 0
  const loop = createPublicDownloader({ resolve: async () => publicRows, request: async () => { connections++; return response('', 302, { location: '/again' }) } })
  await assert.rejects(loop('https://images.example.com/a', 10), error => error.code === 'DOWNLOAD_URL')
  assert.equal(connections, 3)
  for (const headers of [{ 'content-length': '100' }, {}]) {
    const stream = response('too much', 200, headers), download = createPublicDownloader({ resolve: async () => publicRows, request: async () => stream })
    await assert.rejects(download('https://images.example.com/a', 4), error => error.code === 'DOWNLOAD_TOO_LARGE')
    assert.equal(stream.destroyed, true)
  }
})
test('unsafe inputs and transport errors do not expose URLs or credentials in messages', async () => {
  const download = createPublicDownloader({ resolve: async () => publicRows, request: async () => { throw Error('secret transport https://user:private@example.com/?token=secret') } })
  for (const input of ['not a URL with secret', 'https://user:private@example.com/a', 'http://example.com/a', 'https://example.com:8443/a', 'https://images.example.com/a']) {
    await assert.rejects(download(input, 10), error => !/private|token=secret|secret transport/.test(error.message))
  }
  await assert.rejects(download('https://images.example.com/a', 0))
  assert.equal(publicAddress('198.18.0.1'), false)
})
