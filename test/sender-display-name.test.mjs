import test from 'node:test'
import assert from 'node:assert/strict'
import nodemailer from 'nodemailer'
import { simpleParser } from 'mailparser'
import { formatSender } from '../lib/config.js'

test('parentheses and brackets in a sender display name survive MIME encoding', async () => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' })
  try {
    for (const name of ['Support (Sales)', 'Team [East]']) {
      const message = await transport.sendMail({
        from: formatSender(name, 'alias@example.invalid'),
        to: 'recipient@example.invalid', subject: 'display name', text: 'local fixture',
      })
      const parsed = await simpleParser(message.message)
      assert.deepEqual(parsed.from.value, [{ address: 'alias@example.invalid', name }])
    }
  } finally {
    transport.close()
  }
})
