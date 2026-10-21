# AgentMail 账号与收发邮件

[简介](../README.md) · [English](AGENTMAIL.en.md) · [验收范围](validation/0.18.0.md)

## 添加账号

1. 在 AgentMail 控制台创建或选择邮箱，取得该区域的 API Key。
2. 打开 DSH「设置 → 邮件 → 邮箱账号」，选择 `AgentMail (US API)` 或 `AgentMail (EU API)`，填写邮箱地址与 API Key。
3. 点击「测试连接」。通过后在「收发邮件」选择账号，浏览 INBOX 与 Sent。测试只读取该邮箱，不发送邮件。

US 固定使用 `https://api.agentmail.to`，EU 固定使用 `https://api.agentmail.eu`。不能自填代理 API 地址；区域与账号不匹配时请修正服务商选择。API Key 保存在本机账号配置中，与模型密钥、其他邮箱密码相互独立。账号卡片留空密钥表示保留已存值；切换普通邮箱与 API 服务商会清除旧认证信息，需要重新填写。

也可在账号 YAML 中使用：

```yaml
bot:
  provider: agentmail
  user: assistant@agentmail.to
  apiKey: YOUR_AGENTMAIL_API_KEY
defaultAccount: bot
```

单账号的环境变量回退为 `DSH_AGENTMAIL_API_KEY`，命名多账号不共享此回退。普通 IMAP / SMTP 账号保留原配置与数字 UID；AgentMail 的 `uid` 是 API 返回的字符串 `message_id`，请原样传递，不要转成数字。发件显示名由 AgentMail 邮箱自身管理。

## 浏览、回复与发送

工作台提供 INBOX、Sent、Starred、Archive、All 视图，正文按纯文本显示，不执行邮件 HTML / 脚本。下载附件会保存到浏览器选择的位置；模型工具 `email_attachment` 仍返回本地文件路径。

「写邮件」「回复到草稿」「回复全部到草稿」只创建本地草稿。保存编辑、检查发送预览、核对全部收件人与附件后，再点击「确认发送」。回复草稿固定原账号和主题以保留线程；需要改主题或发件账号时请新建邮件。取消预览不提交，已保存服务端回执的草稿不会再次发送。模型的发送工具仍遵守现有审批规则与宿主权限；禁止收件人始终生效。

## 已知边界

- AgentMail 搜索由 API 按相关性返回，不执行 IMAP 本地信封/正文兜底；API 搜索排除垃圾、回收站、被阻止及未认证邮件。使用 `offset` 翻页，不使用 `headerScanOffset`。页数和 `count` 不能当成整个邮箱总量，查看 `hasMore` / `countExact`。
- 列表与搜索最多扫描 201 个 API 页；过大范围会明确报错，请缩小日期/查询。实时邮箱变化可能改变分页内容。
- 本插件发送最多 10 个附件，原始附件合计不超过 4 MiB，且受更小的用户上限约束；完整 API JSON 请求上限 6 MB。下载单附件最多 20 MiB，且不超过用户配置。超限应在上传或预览时处理。
- API 归档仅支持 `INBOX → Archive`，通过标签实现；不映射任意 IMAP 移动、删除或 EXPUNGE。
- 提醒第一次调用只建立基线；积压按批报告，独立工具/网页游标互不抢占。一次最多向前检查 5000 封；基线丢失会明确报错，需核对邮箱并重新启用提醒。`totalUnreadExact:false` 只表示扫描范围内的未读数下界。
- 超时或丢失回执不自动重发，请先在 Sent 核对。接受提交与收件方投递成功不同。
- 本版按用户确认完成实现与模拟验收，尚无真实 AgentMail 账号；实际区域权限、额度、投递与远端附件服务仍需真实账号验收。

实现对照 AgentMail 官方[收件箱](https://docs.agentmail.to/inboxes)、[消息](https://docs.agentmail.to/messages)、[搜索](https://docs.agentmail.to/api-reference/inboxes/messages/search)、[回复](https://docs.agentmail.to/api-reference/inboxes/messages/reply)和[附件](https://docs.agentmail.to/api-reference/inboxes/messages/get-attachment)文档。
