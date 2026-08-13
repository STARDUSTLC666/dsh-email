# dsh-email

DeepSeek Harness 邮件工具插件：让 agent 能**查收件箱、读邮件、搜邮件、代发邮件、收发附件**。纯插件实现，零核心改动，安装即可用。

Email tools for DeepSeek Harness: list, read, search and send mail through standard IMAP/SMTP — with one-line presets for QQ / 163 / 126 / Sina / Aliyun / Gmail / Outlook / iCloud.

纯 Node 实现，**全平台通用**（Windows / macOS / Linux 同一份代码），不依赖 shell、无原生二进制。

## 工具一览

| 工具 | 作用 |
|---|---|
| `email_list` | 列出文件夹里最新的邮件（未读过滤、分页、只看摘要不带正文） |
| `email_read` | 按 uid 读取一封邮件的全文（HTML 邮件自动转纯文本，超长截断） |
| `email_search` | 按关键词搜索发件人/收件人/主题（服务器端）；无结果时默认回退到最近 30 封的正文扫描 |
| `email_send` | 代发邮件（支持带附件）。**默认发信前会弹确认**，显示收件人、主题和附件数，由你批准后才发出 |
| `email_folders` | 列出邮箱的文件夹（INBOX/已发送/垃圾邮件/自定义…），拿 path 喂给其他工具 |
| `email_attachment` | 按序号下载邮件附件（默认存到会话工作区，模型可直接读取；大小受 maxAttachmentBytes 限制） |

示例对话：

> 帮我看下 QQ 邮箱最新的 10 封未读，把要回复的列出来。

## 安装

```sh
dsh plugin --profile web add dsh-email
```

（或从 GitHub 安装：`dsh plugin --profile web add github:你的账号/dsh-email#<commit>`，随后按提示在 profile 的 `pnpm-workspace.yaml` 里授权 `prepare` 构建。）

装好后重启 `dsh web`。插件自带空配置，**不会弄崩启动**；配置前调用任何 email 工具都会返回明确的配置提示。

**配置方式有两种（任选其一）：**

1. **网页设置（推荐）**：重启后打开 **设置 → 邮件 (dsh-email)**，表单里填邮箱地址和授权码，点「保存并应用」，还带「测试连接」按钮。零 YAML、零重启。
2. **YAML**：按下面的 cordis.patch.yml 模板手写（多账号 accounts 映射目前只支持这种方式）。

设置页保存的值存在 `settings.yaml` 的 `dsh-email` 命名空间里，覆盖 YAML 的默认账号配置；密码字段标记为 secret（不会出现在任何导出/诊断里）。

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

多账号：一个 `tool-email` 行可以配多个邮箱，工具调用时用 `account` 参数选择：

```yaml
- id: tool-email
  config:
    accounts:
      work: { provider: qq, user: work@qq.com, password: 授权码1 }
      home: { provider: '163', user: home@163.com, password: 授权码2 }
    defaultAccount: work        # 省略 account 参数时用这个
    downloadDir: E:/attachments # 可选，默认 $DSH_HOME/email-downloads
```

顶层的 `provider`/`user`/`password`/`imap`/`smtp`/`inboxFolder` 仍然可用，作为各账号的共享默认值（v0.1 单账号写法完全兼容）。

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
| `imap.host/port/secure` | 按预设 | 收信服务器（另有 connectionTimeoutMs/socketTimeoutMs 可调超时） |
| `smtp.host/port/secure` | 按预设 | 发信服务器 |
| `inboxFolder` | `INBOX` | 收发工具默认使用的文件夹 |
| `sendApproval` | `true` | 发信前弹确认（强烈建议保留） |
| `maxBodyChars` | `20000` | email_read 正文截断上限（1000–200000） |
| `accounts` | 无 | 具名账号表；账号级字段覆盖顶层简写 |
| `defaultAccount` | 单账号时自动 | 工具省略 account 参数时使用的账号（多账号必填） |
| `downloadDir` | 会话工作区下 .dsh-email-downloads（回退 $DSH_HOME/email-downloads） | email_attachment 的落盘目录；显式设置后固定 |
| `maxAttachmentBytes` | 20 MiB | 单个附件与附件总大小上限（1024–512 MiB） |
| `idleTimeoutMs` | `60000` | IMAP 空闲连接回收时间（连接复用，连续操作更快） |
| `bodySearchFallback` | `true` | 服务器搜索无结果时，回退到客户端扫描最近邮件的正文 |
| `bodySearchLimit` | `30` | 正文回退扫描的邮件数量（5-200） |

## 第一步：拿到授权码

各邮箱都要求用「授权码/应用专用密码」而不是登录密码：

- **QQ 邮箱**：设置 → 账户 → 开启 IMAP/SMTP 服务 → 生成授权码
- **163/126**：设置 → POP3/SMTP/IMAP → 开启 → 新增授权码
- **Gmail**：开启两步验证 → 安全 → 应用专用密码
- **Outlook**：Microsoft 账户安全 → 应用密码（部分账号需先开两步验证）

## 安全须知

- **授权码就是你的邮箱钥匙**。它写在本机（profile 的 `cordis.patch.yml` 或 `settings.yaml`），请勿提交到任何 Git 仓库；更推荐用环境变量 `DSH_EMAIL_PASSWORD`。
- `email_send` 默认走 DSH 审批通道：每次发信都显示「发送邮件给 xx，主题「xx」」，你批准才发出。没有审批通道的环境（如无 UI 的 headless）会**直接拒绝发信**，这是安全默认。
- 会话处于 **Full Access（完全访问）** 模式时，harness 的审批策略是 never（不弹任何确认框）——`email_send` 会**被拦截并给出明确提示**。两条出路：① 把访问模式切回 Read Only / Write；② 关闭 `sendApproval`（设置页勾掉「发信前确认」），即显式声明自行承担风险。
- 本插件不做任何联网上报，凭证只在内存中用于连接你的邮箱服务器。

## 已知限制（v0.3）

- **连接复用**：IMAP 按账号池化（空闲自动回收），SMTP 用 nodemailer 连接池；同一账号的并发调用会排队串行（一个连接一次只服务一个操作，这是有意的）。
- **多账号**：每个账号独立连接池；一个 `tool-email` 行可以配任意多个账号。设置页编辑的是默认账号；`accounts` 映射仍需写 cordis.patch.yml。
- **附件下载**：email_attachment 按 email_read 的附件列表定位（先按文件名、再按类型+大小匹配到 IMAP 部件，定位失败会报错而不是下载错文件）；内嵌图片暂不支持下载；文件名会被清洗防路径穿越，已有同名文件自动加后缀，大小受 maxAttachmentBytes 限制。
- **不支持 OAuth2**：强制 OAuth 的企业环境（部分 M365/Google Workspace）暂不可用。
- 正文搜索走客户端回退：多数服务器（如 QQ）的 IMAP `TEXT`/`HEADER` 搜索不可靠，所以服务器端只搜主题/发件人/收件人；无结果时回退到最近 `bodySearchLimit` 封的正文扫描（较慢，可关 `bodySearchFallback`）。
- **密码落盘形式**：设置页保存的授权码以明文写在本机 `settings.yaml`（schema 标记 secret 只是保证它不进日志/导出/诊断，不做磁盘加密）。请勿把 settings.yaml 交给不信任的人。
- **设置页与插件集变更**：设置页保存后工具**立即生效**（live），无需重启；但升级/增删插件（组合树变化）仍需重启 `dsh web`。

## 开发

```sh
pnpm install
pnpm run build   # tsc → lib/
pnpm test        # 构建 + node --test（配置/解析/注册与审批门，40 个用例，无需真实邮箱）
```

## 协议

MIT。这是一个社区插件，与 DeepSeek 官方无关；`@deepseek-ai/*` 为官方保留命名空间。
