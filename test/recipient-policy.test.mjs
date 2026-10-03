import test from 'node:test'
import assert from 'node:assert/strict'
import { canonicalAddress, canonicalDomain, normalizeRecipients, parseRecipientPolicies, matchRecipients } from '../lib/recipient-policy.js'
import { installSendApproval } from '../lib/approval.js'
const policy = { skipApproval: true, addresses: ['Alice@example.test'], domains: ['team.test'] }
test('display names, groups and Cc resolve to the Nodemailer recipient envelope', async () => {
  assert.deepEqual(await normalizeRecipients('Boss <Alice@EXAMPLE.test>, Team: bob@team.test, carol@team.test;', 'Extra <dave@else.test>'), [
    { field: 'to', address: 'Alice@example.test' }, { field: 'to', address: 'bob@team.test' }, { field: 'to', address: 'carol@team.test' }, { field: 'cc', address: 'dave@else.test' },
  ])
  assert.equal((await matchRecipients('Boss <Alice@example.test>', 'dave@else.test', policy)).skipsApproval, false)
  assert.equal((await matchRecipients('Boss <Alice@example.test>', 'dave@team.test', policy)).skipsApproval, true)
})
test('a trusted display name does not hide an untrusted mailbox; local case and subdomains remain distinct', async () => {
  for (const to of ['"Alice@example.test" <attacker@else.test>', 'alice@example.test', 'alice@sub.team.test']) assert.equal((await matchRecipients(to, '', policy)).skipsApproval, false)
})
test('IDN domains canonicalize consistently and rules do not imply trust without explicit opt-in', async () => {
  const domain = canonicalDomain('例子.测试'), address = canonicalAddress('Name@例子.测试')
  assert.equal(domain, 'xn--fsqu00a.xn--0zwm56d'); assert.equal(address, 'Name@' + domain)
  assert.equal((await matchRecipients(address, '', { domains: [domain], addresses: [], skipApproval: false })).allTrusted, true)
  assert.equal((await matchRecipients(address, '', { domains: [domain], addresses: [], skipApproval: false })).skipsApproval, false)
})
test('malformed recipients, newlines, oversized rules, wildcards and duplicate account keys fail closed', async () => {
  for (const value of ['', 'local-only', 'a@example.test\r\nBcc: attacker@else.test']) await assert.rejects(normalizeRecipients(value))
  for (const text of ['work: { skipApproval: yes }', 'work: { domains: ["*.team.test"] }', 'work: { addresses: ["Alice <a@example.test>"] }', 'work: {}\nwork: {}', 'work: &x {}\nother: *x', 'x'.repeat(65537)]) assert.throws(() => parseRecipientPolicies(text))
})
function gate(rules, configured = ['work', 'home']) {
  let handler, asks = 0, nexts = 0
  installSendApproval({ on(_event, fn) { handler = fn }, get() { return { request: async () => { asks++; return 'allowed-once' } } } }, {
    getSettingsValue: () => ({ sendApproval: true, trustedRecipientsYaml: rules }),
    getEffectiveSettings: () => ({ accounts: new Map(configured.map(name => [name, {}])), defaultAccount: 'work' }),
  })
  return { run: (name, args) => handler({ name, arguments: args }, async () => { nexts++; return { kind: 'allow' } }), counts: () => ({ asks, nexts }) }
}
test('saved trust skips only its account, includes Cc, leaves reply approval and delegates host permissions', async () => {
  const run = gate(JSON.stringify({ work: policy }))
  await run.run('email_send', { to: 'Alice@example.test', cc: 'bob@team.test' }); assert.deepEqual(run.counts(), { asks: 0, nexts: 1 })
  await run.run('email_send', { account: 'home', to: 'Alice@example.test' })
  await run.run('email_send', { account: 'work', to: 'Alice@example.test', cc: 'stranger@else.test' })
  await run.run('email_reply', { account: 'work', uid: 1 })
  assert.deepEqual(run.counts(), { asks: 3, nexts: 4 })
})
test('broken saved rules keep approval instead of granting access', async () => {
  const run = gate('work: { skipApproval: invalid }')
  await run.run('email_send', { to: 'Alice@example.test' }); assert.deepEqual(run.counts(), { asks: 1, nexts: 1 })
})
