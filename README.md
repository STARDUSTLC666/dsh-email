[English](README.en.md)

# dsh-email

> **给 agent 一个邮箱**：八个国内邮箱预设开箱即用，收发/搜索/附件下载全搞定。

![npm version](https://img.shields.io/npm/v/dsh-email?label=npm&color=blue) ![npm downloads](https://img.shields.io/npm/dm/dsh-email) ![license](https://img.shields.io/npm/l/dsh-email) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-email?style=social)

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)


![dsh-email banner](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/banner.png)


DeepSeek Harness 邮件工具插件：让 agent 能**查收件箱、读邮件、搜邮件、代发邮件、收发附件**。纯插件实现，零核心改动，安装即可用。

Email tools for DeepSeek Harness: list, read, search and send mail through standard IMAP/SMTP — with one-line presets for QQ / 163 / 126 / Sina / Aliyun / Gmail / Outlook / iCloud.

纯 Node 实现，**全平台通用**（Windows / macOS / Linux 同一份代码），不依赖 shell、无原生二进制。

## 工具一览

| 工具 | 作用 |
|---|---|
| `email_list` | 列出文件夹里最新的邮件（未读过滤、分页、只看摘要不带正文） |
| `email_read` | 按 uid 读取一封邮件的全文（HTML 邮件自动转纯文本，超长截断） |
| `email_search` | 按关键词搜索主题/发件人/收件人/抄送（服务器端 subject/from/to/cc）；无结果时默认回退到最近 30 封的正文扫描（含 to/cc） |
| `email_send` | 代发邮件（支持带附件）。**默认发信前会弹确认**，显示收件人、主题和附件数，由你批准后才发出 |
| `email_folders` | 列出邮箱的文件夹（INBOX/已发送/垃圾邮件/自定义…），拿 path 喂给其他工具 |
| `email_attachment` | 按序号下载邮件附件（默认存到会话工作区，模型可直接读取；大小受 maxAttachmentBytes 限制） |

示例对话：

> 帮我看下 QQ 邮箱最新的 10 封未读，把要回复的列出来。

### v0.6.2 优化

- 服务器端搜索补齐 `cc`，搜索范围真正覆盖主题 / 发件人 / 收件人 / 抄送。
- 正文回退扫描的匹配范围也加入 `to` / `cc`；单封邮件解析失败不会中断整批扫描。
- 邮件列表结果强制按 UID 降序，保证「最新在前」。
- `email_send` 的附件参数严格校验为路径字符串数组，并做 trim。


## 安装

```sh
dsh plugin --profile web add dsh-email
```

（或从 GitHub 安装：`dsh plugin --profile web add github:你的账号/dsh-email#<commit>`，随后按提示在 profile 的 `pnpm-workspace.yaml` 里授权 `prepare` 构建。）

装好后重启 `dsh web`。插件自带空配置，**不会弄崩启动**；配置前调用任何 email 工具都会返回明确的配置提示。

**配置方式有两种（任选其一）：**

1. **网页设置（推荐）**：重启后打开 **设置 → 邮件 (dsh-email)**，表单里填邮箱地址和授权码，点「保存并应用」，还带「测试连接」按钮。零 YAML、零重启。
2. **YAML**：按下面的 cordis.patch.yml 模板手写；设置页的「多账号（高级，YAML）」文本框也能填账号映射（覆盖 YAML 里的 accounts）。

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
| `accountsYaml` | 无 | 设置页「多账号（高级）」文本框的 YAML 文本；非空时覆盖 accounts |
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

## 已知限制

- **不支持 OAuth2**：强制 OAuth 的企业环境（部分 M365 / Google Workspace）暂不可用，只能使用邮箱服务商的应用专用密码 / 授权码。
- **正文搜索**：服务器端只搜 subject / from / to / cc；多数服务器（如 QQ）的 IMAP `TEXT` / `HEADER` 搜索不可靠，无结果时回退到最近 `bodySearchLimit` 封的正文扫描（较慢，可用 `bodySearchFallback` 关闭）。
- **附件**：内嵌图片暂不支持单独下载；附件定位失败会直接报错而不是下载错误文件（安全默认）。
- **密码落盘**：设置页保存的授权码以明文写在本机 `settings.yaml`（secret 标记只保证它不进日志 / 导出 / 诊断，不做磁盘加密）。请勿把 `settings.yaml` 交给不信任的人。

## 开发

```sh
pnpm install
pnpm run build   # tsc → lib/
pnpm test        # 构建 + node --test（配置/解析/注册与审批门，44 个用例，无需真实邮箱）
```

## 协议

MIT。这是一个社区插件，与 DeepSeek 官方无关；`@deepseek-ai/*` 为官方保留命名空间。

## 相关插件

- [dsh-slack](https://github.com/STARDUSTLC666/dsh-slack) — Slack 通知/收件箱
- [dsh-dingtalk](https://github.com/STARDUSTLC666/dsh-dingtalk) — 钉钉群通知（零依赖）
- [dsh-email](https://github.com/STARDUSTLC666/dsh-email) — 邮件六件套 + Web 设置页

