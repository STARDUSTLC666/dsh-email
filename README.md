# dsh-email

DeepSeek Harness 邮件工具插件：让 agent 能**查收件箱、读邮件、搜邮件、代发邮件**。纯插件实现，零核心改动，安装即可用。

Email tools for DeepSeek Harness: list, read, search and send mail through standard IMAP/SMTP — with one-line presets for QQ / 163 / 126 / Sina / Aliyun / Gmail / Outlook / iCloud.

## 工具一览

| 工具 | 作用 |
|---|---|
| `email_list` | 列出文件夹里最新的邮件（未读过滤、分页、只看摘要不带正文） |
| `email_read` | 按 uid 读取一封邮件的全文（HTML 邮件自动转纯文本，超长截断） |
| `email_search` | 按关键词搜索发件人/收件人/主题（服务器端 IMAP SEARCH，不搜正文） |
| `email_send` | 代发邮件。**默认发信前会弹确认**，显示收件人和主题，由你批准后才发出 |

示例对话：

> 帮我看下 QQ 邮箱最新的 10 封未读，把要回复的列出来。

## 安装

```sh
dsh plugin --profile web add dsh-email
```

（或从 GitHub 安装：`dsh plugin --profile web add github:你的账号/dsh-email#<commit>`，随后按提示在 profile 的 `pnpm-workspace.yaml` 里授权 `prepare` 构建。）

装好后重启 `dsh web`。插件自带空配置，**不会弄崩启动**；配置前调用任何 email 工具都会返回明确的配置提示。

## 配置

在你 profile 的 `cordis.patch.yml` 里覆盖 `tool-email` 行（在 `$DSH_HOME/profiles/<name>/` 下），然后重启：

```yaml
- id: tool-email
  config:
    provider: qq          # qq | 163 | 126 | sina | aliyun | gmail | outlook | icloud
    user: you@qq.com
    password: 你的授权码   # 强烈建议改用环境变量 DSH_EMAIL_PASSWORD，见下
```

不需要预设？手填任意 IMAP/SMTP 服务器即可：

```yaml
- id: tool-email
  config:
    user: you@corp.example
    password: 你的授权码
    imap: { host: imap.corp.example, port: 993, secure: true }
    smtp: { host: smtp.corp.example, port: 465, secure: true }
    inboxFolder: INBOX
```

### 常用邮箱预设

| provider | IMAP | SMTP |
|---|---|---|
| `qq` | imap.qq.com:993 (SSL) | smtp.qq.com:465 (SSL) |
| `163` | imap.163.com:993 | smtp.163.com:465 |
| `126` | imap.126.com:993 | smtp.126.com:465 |
| `sina` | imap.sina.com:993 | smtp.sina.com:465 |
| `aliyun` | imap.aliyun.com:993 | smtp.aliyun.com:465 |
| `gmail` | imap.gmail.com:993 | smtp.gmail.com:465 |
| `outlook` | outlook.office365.com:993 | smtp.office365.com:587 (STARTTLS) |
| `icloud` | imap.mail.me.com:993 | smtp.mail.me.com:587 (STARTTLS) |

### 完整配置项

| 字段 | 默认 | 说明 |
|---|---|---|
| `provider` | 无 | 预设名，自动填 imap/smtp 地址；显式写的 host/port/secure 优先 |
| `user` | 必填 | 登录邮箱地址 |
| `password` | 必填* | 授权码/应用专用密码；*也可用环境变量 `DSH_EMAIL_PASSWORD` |
| `imap.host/port/secure` | 按预设 | 收信服务器 |
| `smtp.host/port/secure` | 按预设 | 发信服务器 |
| `inboxFolder` | `INBOX` | 收发工具默认使用的文件夹 |
| `sendApproval` | `true` | 发信前弹确认（强烈建议保留） |
| `maxBodyChars` | `20000` | email_read 正文截断上限（1000–200000） |

## 第一步：拿到授权码

各邮箱都要求用「授权码/应用专用密码」而不是登录密码：

- **QQ 邮箱**：设置 → 账户 → 开启 IMAP/SMTP 服务 → 生成授权码
- **163/126**：设置 → POP3/SMTP/IMAP → 开启 → 新增授权码
- **Gmail**：开启两步验证 → 安全 → 应用专用密码
- **Outlook**：Microsoft 账户安全 → 应用密码（部分账号需先开两步验证）

## 安全须知

- **授权码就是你的邮箱钥匙**。它写在 profile 的 `cordis.patch.yml` 里，请勿把它提交到任何 Git 仓库；更推荐用环境变量 `DSH_EMAIL_PASSWORD`。
- `email_send` 默认走 DSH 审批通道：每次发信都显示「发送邮件给 xx，主题「xx」」，你批准才发出。没有审批通道的环境（如无 UI 的 headless）会**直接拒绝发信**，这是安全默认。
- 注意：会话处于 **Full Access（完全访问）** 模式时，harness 会把审批策略置为 never，`email_send` 会被**静默拒绝**（不弹框）。想发信请把访问模式切回 Read Only 或 Write。
- 本插件不做任何联网上报，凭证只在内存中用于连接你的邮箱服务器。

## 已知限制（v0.1）

- **每个工具调用独立建立/关闭连接**：正确、无状态，但连续读多封会比常驻连接慢一点。
- **单账号**：一个 `tool-email` 行对应一个邮箱；多账号可复制多行（改 id 即可）。
- **附件只给元数据**（文件名/类型/大小），不下载内容；下载附件列入后续版本。
- **不支持 OAuth2**：强制 OAuth 的企业环境（部分 M365/Google Workspace）暂不可用。
- 正文搜索不提供：多数服务器（如 QQ）的 IMAP `TEXT`/`HEADER` 搜索要么全量匹配要么不支持，所以 v0.1 只搜主题/发件人/收件人；正文搜索列入后续版本（需客户端下载解析，较慢）。

## 开发

```sh
pnpm install
pnpm run build   # tsc → lib/
pnpm test        # 构建 + node --test（配置/解析/注册与审批门，19 个用例，无需真实邮箱）
```

## 协议

MIT。这是一个社区插件，与 DeepSeek 官方无关；`@deepseek-ai/*` 为官方保留命名空间。
