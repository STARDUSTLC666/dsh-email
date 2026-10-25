import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailService } from '../lib/mail-service.js'
import { resolveEmailSettings } from '../lib/config.js'

function service() { return new EmailService(resolveEmailSettings({ accounts: {
  qq: { provider: 'qq', user: 'synthetic@qq.com', password: 'SYNTHETIC_ONLY' },
  api: { provider: 'agentmail', user: 'synthetic@agentmail.to', apiKey: 'SYNTHETIC_ONLY' },
}, defaultAccount: 'qq' })) }
test('#26 decimal string UIDs normalize on read, mark, attachment, reply and prepared replies', async () => {
  const mail = service(), received = []
  try {
    mail.imap.read = async (_account, uid) => { received.push(uid); return { uid } }
    mail.imap.mark = async (_account, _folder, uid) => { received.push(uid); return {} }
    mail.imap.downloadAttachment = async (_account, _folder, uid) => { received.push(uid); return {} }
    mail.imap.reply = async (_account, _folder, uid) => { received.push(uid); return {} }
    mail.imap.sendPrepared = async (...args) => { received.push(args[7].uid); return {} }
    await mail.read('qq', '2302', 'INBOX')
    await mail.mark('qq', 'INBOX', '002302', 'read')
    await mail.downloadAttachment('qq', 'INBOX', '2302', 0)
    await mail.reply('qq', 'INBOX', '2302', 'reply', 'synthetic', '', undefined)
    await mail.sendPrepared('qq', 'recipient@example.invalid', 'Synthetic', 'text', '', [], undefined, { uid: '2302', folder: 'INBOX' })
    assert.deepEqual(received, [2302, 2302, 2302, 2302, 2302])
  } finally { mail.dispose() }
})
test('#26 non-decimal, unsafe and empty IMAP identifiers fail before touching transport; API IDs stay opaque', async () => {
  const mail = service()
  try {
    mail.imap.read = () => { throw new Error('transport must not run') }
    for (const id of ['', '0', '-1', '2.3', '1e3', '0x10', ' 23 ', '9007199254740992', '<api-id>']) assert.throws(() => mail.read('qq', id, 'INBOX'), /正整数/)
    mail.api.read = async (_account, uid) => ({ uid })
    assert.equal((await mail.read('api', '001', 'INBOX')).uid, '001')
    assert.equal((await mail.read('api', '<opaque@id>', 'INBOX')).uid, '<opaque@id>')
  } finally { mail.dispose() }
})
