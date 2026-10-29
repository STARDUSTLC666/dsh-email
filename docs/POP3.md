# POP3 收信 / POP3 receiving

## 开始使用

1. 打开 DSH 侧栏「邮件 → 邮箱设置」，编辑或添加账号。
2. 选择「收信协议 → POP3」。QQ、163、126、Gmail 提供默认 POP 主机；其他服务商按其官方说明填写，不能直接把 IMAP 主机当作 POP 主机。
3. 填邮箱地址及服务商提供的授权码 / 应用密码。默认使用 995 端口和 TLS，并校验服务器证书。关闭 TLS 表示明文连接，不是 STARTTLS；不要用该选项代替服务商要求的 STARTTLS。本版暂不提供 POP3 OAuth2 或 STLS，Outlook OAuth2 继续使用 IMAP。
4. 点击该账号的「测试连接」。成功只代表 POP3 登录及邮件列表可读取，不代表 SMTP 已通过测试。
5. 返回「收发邮件」查看收件箱、搜索和打开正文，按需下载附件。「回复到草稿」会保留原信引用，编辑、保存并预览后，需勾选核对内容再确认发送。

只收信时可以不填 SMTP；需要发送、回复或转发时再补全 SMTP 主机与端口。POP3 的授权码通常也用于对应 SMTP 服务，具体以服务商要求为准。

## 与 IMAP 的区别

- POP3 只提供收件箱，不提供服务器已读 / 未读、星标、移动或已发送文件夹。界面隐藏这些操作，不把「状态未知」显示成真实未读数。
- 发信仍使用 SMTP，沿用草稿预览、明确确认、禁止收件人规则和宿主权限。成功提交 SMTP 不等于邮件已投递。发出的邮件可在本地草稿中查看提交回执；本插件不伪造服务器「已发送」文件夹。
- 用 UIDL 稳定标识定位原信，每次重新连接都重新核对列表。邮件序号变化不会使旧回复或附件请求指向邻近邮件；服务器没有 UIDL 或返回重复标识时会明确拒绝。
- 本插件不发送 `DELE`。服务商的保留策略及其他客户端仍可能改变邮件，请在服务商设置中确认是否保留服务器副本。

## 搜索、通知与限制

- 列表按 POP 邮箱序号从新到旧排列，不按信件 Date 头排序。普通列表分页读取当前页；日期筛选最多核对最近 500 封的 Date 头，并报告实际范围。这不是服务端收到邮件的时间。
- 搜索默认扫描最近 100 封的主题和发件人，单个窗口最多 500 封。「继续搜索更早邮件」进入下一窗口；普通上一页 / 下一页只在当前窗口匹配结果中分页。
- 当前信封窗口没有匹配时，可按现有 `bodySearchFallback` 设置扫描正文（默认最近 30 封，受 `bodySearchLimit` 和正文显示上限限制）。界面和工具同时给出信封、正文扫描数量；无结果不代表整个邮箱没有匹配。
- `TOP` 不可用时会回退到有大小限制的 `RETR`，因此列出主题也可能下载整封邮件。POP3 下载附件必须先取得整封原信：单封最多 32 MiB，单附件最多 20 MiB 或更低的配置值；一轮操作累计最多 64 MiB，单行最多 1 MiB，邮箱列表最多 50,000 封。HTML 转文字由 html-to-text 处理，HTML 超过 2 MiB 时明确提示省略正文，保留附件下载；转换深度最多 128 层，每节点最多 10,000 个子节点，超限时报告部分省略。被省略的正文和提示文字不会冒充正文搜索结果。
- 同一账号的收信操作串行执行，支持取消和期限限制。关闭或修改账号会关闭本次 POP3 连接。登录失败的服务端原文不会回显到界面，避免夹带凭据。
- 新邮件提醒比较新出现的 UIDL，第一次调用只建立基线。它不表示「新未读」，不提供服务器未读总量；重启或修改账号后会重新建立基线，不把全部历史邮件当新邮件。

源码配置示例：

```yaml
work:
  receiveProtocol: pop3
  user: you@example.com
  password: your-app-password
  pop3: { host: pop.example.com, port: 995, secure: true }
  smtp: { host: smtp.example.com, port: 465, secure: true }
defaultAccount: work
```

复用 MIT 许可的 [node-pop3 0.15.3](https://github.com/node-pop3/node-pop3)，锁定版本并增加字节流边界、大小、超时和取消保护；MIME 内容仍由现有 mailparser 解析，HTML 正文使用已有依赖链中的 [html-to-text 10.0.1](https://github.com/html-to-text/node-html-to-text/tree/master/packages/html-to-text)，现作为显式依赖锁定。协议语义参考 [RFC 1939](https://www.rfc-editor.org/rfc/rfc1939.html)。

## 验证范围

使用 Windows 上的真实 TCP / TLS POP3 模拟服务器及只在本机接收、不转发邮件的 SMTP 接收器验证协议。官方 DSH 0.2.1-rc.4、0.2.1-rc.5、0.2.2-alpha.2 Web profile 覆盖中英文、桌面与窄屏的读信、搜索范围、账号连接测试、草稿确认发送及线程头，并验证协议切换保存后凭据保留。最终窄屏单列布局另经 RC.5 和 alpha.2 操作验收。附件的服务端落盘字节及浏览器收到的字节已核对。本机 Chrome 连独立页面的普通文本下载也会取消，浏览器最终文件保存单独标记为环境受限，不能记为通过。没有真实服务商账号验收，也没有重新验证 Electron 原生窗口。

## English

Open **Email → Account settings**, edit an account and choose **Incoming protocol → POP3**. Enter the provider's POP host and app password, keep TLS enabled (normally port 995), then test the connection. This tests incoming POP3 only. SMTP may remain empty for a receive-only account; configure it before sending. Read messages, download attachments or choose **Reply in drafts**, edit/save, review the preview, acknowledge the contents and confirm sending.

POP3 exposes only INBOX. Server read/unread/star flags, move and a Sent folder are unavailable, and their controls are hidden. Replies use SMTP with existing recipient policy, preview and permission checks. No `DELE` command is issued; provider retention rules and other clients can still remove messages. Stable UIDLs are checked in each transaction, so shifted message numbers cannot select a different message. Missing or duplicate UIDLs are rejected. Implicit TLS validates certificates; turning it off means plaintext, not STARTTLS. POP3 OAuth2 and STLS are not supported in this release; Outlook OAuth2 remains on IMAP.

Search scans local headers (100 newest by default, at most 500 per window); **Search older headers** advances the scan window. Result pagination stays within that window. If no header matches, optional body fallback scans the configured recent messages (30 by default) within the body-display limit. Date filters use sender Date headers, not server receipt dates, and list-only date filters cover at most 500 newest messages. Inspect reported header/body coverage: empty or partial results do not prove a mailbox-wide absence.

`TOP` can fall back to downloading the full message through `RETR`. Limits: 32 MiB per message, 20 MiB per attachment or the configured lower maximum, 64 MiB per active operation, 1 MiB per line and 50,000 mailbox entries. The maintained html-to-text converter processes HTML; HTML over 2 MiB is explicitly omitted while attachments remain available. Conversion limits depth to 128 and children per node to 10,000, explicitly reporting any structural omission. Omitted bodies and the omission notice are not searched as real message content. Operations are serialized per account and support cancellation and deadlines. New-mail watches compare newly appearing UIDLs, seed a quiet baseline on first use/restart/configuration changes, and never claim a server unread total. Network protocol and UI fixtures use loopback servers; they do not prove compatibility with a real provider account.

Validation uses real loopback TCP/TLS POP3 and a non-forwarding SMTP sink on Windows, plus official DSH RC.4 / RC.5 / alpha.2 Web profiles in Chinese/English at desktop/narrow widths. Protocol changes preserve saved credentials. The final single-column narrow layout was checked on RC.5 and alpha.2. Attachment bytes match at backend-file and browser-payload boundaries. Final browser-file saving is explicitly skipped: the installed Chrome also cancels a standalone plain-text download outside DSH. Real provider accounts and the Electron window were not tested.
