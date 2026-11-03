import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * 邮箱工作台的错误恢复守卫（结构级）。
 *
 * 这类问题用户最难受：请求挂了，界面却说「当前页没有邮件」；错误条只给一句
 * 「检查账号设置」，没有重试；分页按钮还是手写 <button>，跟旁边共享控件长得不一样。
 * 本仓库没有 jsdom（也不为测试新增依赖），所以把这些契约锁在发布产物上：
 * 出错与空必须是两条路，重试必须存在且四个请求都能重取。
 */
const BUNDLE = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

test('a failed mailbox request is never rendered as an empty folder', () => {
  assert.ok(
    BUNDLE.includes("title:error && !result?dt('邮件列表没有读出来','Messages could not be loaded')"),
    '列表失败要有自己的标题，不能复用「当前页没有邮件」',
  )
  assert.ok(
    BUNDLE.includes("title:dt('这封邮件没有读出来','This message could not be loaded')"),
    '正文读不出来时不能显示「选择一封邮件」',
  )
  // 空状态的三种正常文案仍然保留（加载中 / 无搜索结果 / 本页没有）
  for (const copy of ["dt('正在读取邮件…','Loading messages…')", "dt('当前检索范围内没有结果。','No results in the current search window.')", "dt('当前页没有邮件。','No messages on this page.')"]) {
    assert.ok(BUNDLE.includes(copy), copy + ' 丢掉了')
  }
})

test('every failure offers a real retry that refetches accounts, folders, list and body', () => {
  assert.ok(BUNDLE.includes('const retry = () => { setAccountReload(n => n + 1); setRefresh(n => n + 1); setReadToken(n => n + 1); };'), '重试要覆盖四类请求')
  assert.ok(BUNDLE.includes("dt('重试','Retry')"), '错误条要有重试按钮')
  assert.ok(BUNDLE.includes('}, [active, account, folder, selected, readToken]);'), '正文重读要能被触发')
  const banner = BUNDLE.slice(BUNDLE.indexOf("h(W.Status,{tone:'error'}"), BUNDLE.indexOf("h(W.Status,{tone:'error'}") + 700)
  assert.match(banner, /onClick:retry/, '错误条上的重试必须真的重取')
  assert.match(banner, /检查账号设置|Check account settings/, '仍然保留去账号设置排查的入口')
})

test('mailbox pagination uses the shared workbench Button', () => {
  assert.ok(!/className: "dshe-btn", disabled: loading \|\| busy/.test(BUNDLE), '分页仍是手写按钮')
  assert.match(BUNDLE, /h\(W\.Button, \{ icon: 'left', disabled: loading \|\| busy \|\| offset === 0/, '上一页要用 W.Button')
  assert.match(BUNDLE, /h\(W\.Button, \{ icon: 'right', disabled: loading \|\| busy \|\| !hasMore/, '下一页要用 W.Button')
  assert.match(BUNDLE, /h\(W\.Button, \{ icon: 'search', disabled: loading \|\| busy, onClick: \(\) => \{ setOffset\(0\); setScanOffset/, '继续搜索更早邮件要用 W.Button')
})
