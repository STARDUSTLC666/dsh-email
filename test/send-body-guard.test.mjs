import test from 'node:test'
import assert from 'node:assert/strict'
import { buildEmailTools } from '../lib/tools.js'

function toolFor(sent) {
  const runtime = {
    getPool() {
      return {
        async send(...args) {
          sent.push(args)
          return { account: 'default', messageId: '<x@example.test>', accepted: [], rejected: [], response: '250 OK' }
        },
      }
    },
    getEffectiveSettings() {
      return { accounts: new Map() }
    },
    getSettingsValue() {
      return {}
    },
    watch() {},
  }
  return buildEmailTools(runtime).find(def => def.name === 'email_send')
}

test('email_send refuses a call with neither text nor html instead of delivering a blank message', async () => {
  const sent = [], tool = toolFor(sent)
  await assert.rejects(() => tool.execute({ to: 'a@example.test', subject: 'Blank' }, {}), /请填写 text\/html 正文，或用 textFile\/htmlFile 指向正文文件/)
  await assert.rejects(() => tool.execute({ to: 'a@example.test', subject: 'Blank', text: '   ', html: '' }, {}), /请填写 text\/html 正文，或用 textFile\/htmlFile 指向正文文件/)
  assert.equal(sent.length, 0)
})

test('email_send still accepts html-only, text-only and both', async () => {
  const sent = [], tool = toolFor(sent)
  await tool.execute({ to: 'a@example.test', subject: 'Html only', html: '<p>hi</p>' }, {})
  await tool.execute({ to: 'a@example.test', subject: 'Text only', text: 'hi' }, {})
  await tool.execute({ to: 'a@example.test', subject: 'Both', text: 'hi', html: '<p>hi</p>' }, {})
  assert.equal(sent.length, 3)
})
