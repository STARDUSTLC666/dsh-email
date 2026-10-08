import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

test('host labels update before plugin subscribers and error guidance follows UI language', () => {
  let client, definition, active = 'zh'
  const subscribers = new Set()
  const locale = { getSnapshot: () => ({ active }), subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn) } }
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
    .replace('return module.exports;', 'module.exports.probe = { emailError }; return module.exports;')
  runInNewContext(source, {
    window: { __ModuleLoader__: { load({factory}) { client = factory(() => ({})) } } },
  })
  client.apply({
    locale, get: () => locale,
    effect(fn, label) { if (label.endsWith(': locale')) return fn() },
    slots: { inject(_name, fn) { fn() }, register(meta) { definition = meta } },
  })
  assert.equal(definition.label(), "邮件 (dsh-email)")
  active = 'en-US'
  // Host settings renders before the plugin's locale callback.
  assert.equal(definition.label(), "Email (dsh-email)")
  for (const notify of subscribers) notify()
  const guidance = client.probe.emailError({message:'发送结果不明，请先检查已发送邮件，不要重发'})
  assert.ok(guidance); assert.doesNotMatch(guidance, /[\u3400-\u9fff]/)
  assert.match(guidance, /resend|send again|check/i)
  assert.match(client.probe.emailError('账号 "default" 的邮箱地址未填写'), /Account settings/)
  assert.match(client.probe.emailError({message:'HTTP 401', status:401}), /session expired/)
  const locked = client.probe.emailError('无法读取或解锁 OAuth2 登录数据：Windows 加密文件需原 Windows 账号；原文件未被覆盖。')
  assert.doesNotMatch(locked, /[\u3400-\u9fff]/)
  assert.match(locked, /original Windows user/)
  assert.match(locked, /Preserve and move aside oauth2-tokens.json/)
  assert.match(locked, /not overwritten/)
  const unavailable = client.probe.emailError('无法安全保存 OAuth2 登录数据：未写入明文令牌。')
  assert.match(unavailable, /PowerShell \/ DPAPI/)
  assert.match(unavailable, /No plaintext tokens were written/)
  assert.match(client.probe.emailError('无法读取 OAuth2 登录数据，请检查文件访问权限。原文件未被覆盖。'), /access permissions/)
  active = 'zh'; assert.equal(definition.label(), "邮件 (dsh-email)")
  for (const notify of subscribers) notify()
  assert.match(client.probe.emailError({message:'发送结果不明，请先检查已发送邮件，不要重发'}), /[\u3400-\u9fff]|HTTP 401/)
})
