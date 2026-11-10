import test from 'node:test'
import assert from 'node:assert/strict'
import { publicAddress, syntheticAddress, syntheticAddress6 } from '../lib/public-address.js'
import { resolvePublicAddresses } from '../lib/public-dns.js'

const active = () => AbortSignal.timeout(3000)
const publicRows = [{ address: '93.184.215.14', family: 4 }, { address: '2404:2280:2a6:0:3::c', family: 6 }]
const fakeV4 = { address: '198.18.0.20', family: 4 }
const fakeV6 = { address: '2001:2::29', family: 6 }

test('only reserved Fake-IP IPv6 ranges are treated as placeholders', () => {
  for (const address of ['2001:2::29', '2001:2:0:0:0:0:0:1', 'fdfe:dcba:9876::5', 'FDFE:DCBA:9876:0:0:0:0:5']) {
    assert.equal(syntheticAddress6(address), true, address)
  }
  for (const address of ['2404:2280:2a6:0:3::c', '2001:db8::1', 'fd12:3456::1', 'fc00::1', '::1', '198.18.0.20']) {
    assert.equal(syntheticAddress6(address), false, address)
  }
  // A virtual IPv6 answer is never a usable public destination.
  assert.equal(publicAddress('2001:2::29'), false)
  assert.equal(publicAddress('fdfe:dcba:9876::5'), false)
  assert.equal(publicAddress('2404:2280:2a6:0:3::c'), true)
  assert.equal(syntheticAddress('198.18.0.20'), true)
})
test('a Fake-IP response mixing virtual IPv4 and virtual IPv6 still falls back to the encrypted resolver', async () => {
  const requested = []
  const rows = await resolvePublicAddresses('images.example.com', active(), {
    lookup: async () => [fakeV4, fakeV6],
    query: async host => { requested.push(host); return publicRows },
  })
  assert.deepEqual(rows, publicRows)
  assert.deepEqual(requested, ['images.example.com'])
})
test('a virtual IPv6 answer alone also falls back instead of connecting to the placeholder', async () => {
  const rows = await resolvePublicAddresses('images.example.com', active(), {
    lookup: async () => [fakeV6],
    query: async () => publicRows,
  })
  assert.deepEqual(rows, publicRows)
})
test('private and unverifiable answers still never reach the encrypted resolver', async () => {
  for (const addresses of [['::1'], ['fd12:3456::1'], ['2001:2::29', '10.0.0.2'], ['198.18.0.20', '93.184.215.14']]) {
    let queries = 0
    await assert.rejects(resolvePublicAddresses('images.example.com', active(), {
      lookup: async () => addresses.map(address => ({ address, family: address.includes(':') ? 6 : 4 })),
      query: async () => { queries++; return publicRows },
    }), error => error.code === 'PUBLIC_ADDRESS_REQUIRED')
    assert.equal(queries, 0)
  }
  for (const host of ['2001:2::29', 'fdfe:dcba:9876::5', 'localhost']) {
    let calls = 0
    await assert.rejects(resolvePublicAddresses(host, active(), { lookup: async () => [fakeV4], query: async () => { calls++; return publicRows } }))
    assert.equal(calls, 0)
  }
})
