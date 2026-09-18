[English](README.en.md)

# dsh-email

> **让 agent 协助处理邮件**：收发、搜索、回复转发、附件、邮件整理与新邮件提醒，支持八种常见邮箱服务预设。

![npm version](https://img.shields.io/npm/v/dsh-email?label=npm&color=blue) ![npm downloads](https://img.shields.io/npm/dm/dsh-email) ![license](https://img.shields.io/npm/l/dsh-email) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-email?style=social)

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)


![dsh-email banner](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/banner.png)


DeepSeek Harness 邮件插件：通过标准 IMAP/SMTP 提供 **10 个工具**，覆盖邮件查收与搜索、发送与回复转发、附件处理、标记与移动、增量收件和健康检查。支持多个账号、发信审批、Web 设置页与新邮件弹窗；配置邮箱账号后即可使用。

IMAP/SMTP email tools for DeepSeek Harness, with replies, forwarding, mailbox organization and new-mail notifications. Presets: QQ / 163 / 126 / Sina / Aliyun / Gmail / Outlook / iCloud.

纯 Node 实现，**全平台通用**（Windows / macOS / Linux 同一份代码），不依赖 shell、无原生二进制。

## 工具一览

| 工具 | 作用 |
|---|---|
| `email_list` | 列出文件夹里最新的邮件（未读过滤、分页、只看摘要不带正文） |
| `email_read` | 按 uid 读取一封邮件的全文（HTML 邮件自动转纯文本，超长截断） |
| `email_search` | 按关键词搜索主题/发件人/收件人/抄送（服务器端 subject/from/to/cc；命中会先用信封复核，QQ 这种"什么都匹配"的响应会被判无效）；复核或服务器都没给出可信结果时，默认回退到最近 30 封的正文扫描（含 to/cc） |
| `email_send` | 代发邮件（支持带附件）。**默认发信前会弹确认**，显示收件人、主题和附件数，由你批准后才发出 |
| `email_folders` | 列出邮箱的文件夹（INBOX/已发送/垃圾邮件/自定义…），拿 path 喂给其他工具 |
| `email_attachment` | 按序号下载邮件附件（默认存到会话工作区，模型可直接读取；大小受 maxAttachmentBytes 限制） |
| `email_health` | 离线检查账号配置及 IMAP/SMTP 主机信息；不建立网络连接，实际 IMAP 连通性使用设置页的“测试连接” |
| `email_watch` | 增量检查新邮件：首次调用建立基线，之后每次只报告比上次多出来的未读邮件，适合定时任务做新邮件提醒 |
| `email_mark` | 修改邮件状态：标记已读/未读、加/取消星标，或移动到别的文件夹（归档、丢回收站），收发闭环的「收完之后」那一半 |
| `email_reply` | 回复/回复全部/转发已有邮件：自动带上 In-Reply-To/References 线程头与原文引文，收件人自动排除自己，主题不重复叠 Re:/Fwd:；同样走发信审批门 |

### 新邮件提醒（Web 端）

配置好账号后，主界面右下角会出现「鲸鱼娘递信」小弹窗：每 30 秒检查一次新邮件，有新邮件时弹出卡片（发件人 + 主题），12 秒自动消失。弹窗与 `email_watch` 工具共用同一套游标逻辑但各自独立计数，互不抢占。

弹窗形象优先使用本地安装的 [dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale) 鲸鱼娘皮肤素材（**不打包分发**，运行时从你自己的安装目录读取）：该素材为一创 [上善](https://www.pixiv.net/users/62155430) 鲸鱼娘形象的衍生创作（二创 Small-tailqwq），以 CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享）发布，弹窗内附完整署名链。未安装皮肤时使用内置的社区鲸鱼娘形象（版权归原作者，仅供个人非商业使用；如有异议请提 Issue，会立即移除）。

示例对话：

> 帮我看下 QQ 邮箱最新的 10 封未读，把要回复的列出来。

### 版本记录

- **0.11.0（2026-09-18）**：合入 gurio-wine 的设置页四连（[PR #11](https://github.com/STARDUSTLC666/dsh-email/pull/11)–[#14](https://github.com/STARDUSTLC666/dsh-email/pull/14)），并在评审后修掉其中若干问题。**新增**：①多账号卡片编辑器（增删改 / 改名 / 设默认 / 按账号单独测试连接，编辑即保存，不再需要点「保存并应用」）与服务器预设管理（`serverPresets`，自定义服务商端点，不含凭证）；②Outlook / Exchange Online 的 OAuth2 设备码登录（IMAP 与 SMTP 双端，access token 自动刷新，密码认证账号完全不受影响）；③设置面板文案中英双语，跟随宿主 Settings → General 的语言实时切换；④账号可显式钉住 `authKind`（自动 / oauth2 / password），给仍能用应用密码连 Exchange Online 的混合或本地租户留退路。**评审修复**：SMTP 的 OAuth2 认证形状原本一封也发不出去（nodemailer 的 `XOAuth2` 只读 `accessToken`、从不读 `pass`，实测报 `EAUTH`）；保存面板不再无条件抹掉账号手写的 imap/smtp 端点（运行时解析以账号自己的值优先，原行为会把自建服务器账号静默改指预设，无 provider 的账号则直接失去连接信息）；改名保留授权码与高级键，且不允许顶掉同名账号；设置路由增加 Host / Origin / Content-Type 同源校验（此前任意网页都能跨源改设置，DNS rebinding 还能读走含明文授权码的快照）；响应不再回显解析后的账号映射（那是一份含明文密码、前端从不读取的副本）；服务器原始报错经凭据脱敏后才展示（IMAP/SMTP 会回显被拒的认证串，其中含 access token）；删除账号即清理其 token，未提交的保存不清；版本冲突自动重基，而不是拿旧 revision 反复重试。**不内置任何第三方 OAuth2 应用注册**：OAuth2 账号需自带 `clientId`，见下文「Outlook OAuth2」。测试 81 → 237 项。**修复 `email_search`**：QQ 这类服务器会对任意关键词返回同一批无关 UID，现在服务器命中会先用 envelope 复核（subject/from/to/cc），核实不到就回退本地正文扫描，不会再出现「不存在的关键词也匹配 40 条」（[#15](https://github.com/STARDUSTLC666/dsh-email/issues/15)）。
- **0.10.8（2026-09-16）**：合入 GUODnuli 的 [PR #9](https://github.com/STARDUSTLC666/dsh-email/pull/9)，将设置页及新邮件弹窗的文字、边框引用改为官方主题变量，修复深色主题文字不可读；复验官方 Harness 0.1.5-rc.2 和 0.1.6-alpha.1。
- **0.10.7（2026-09-11）**：复验官方 Harness 0.1.5-rc.1，更新整套同载与真实服务验证记录；运行时代码未变。
- **0.10.6（2026-09-10）**：修复单账号设置页授权码留空时，空字符串遮蔽 `DSH_EMAIL_PASSWORD`，导致“测试连接”和保存后工具调用报未配置的问题；显式密码仍优先，多账号不会借用该环境变量。更新设置页工具数量、多账号说明，并补充真实 QQ 邮箱验证结果。
- **0.10.5（2026-09-08）**：补充官方 Harness 0.1.3-alpha.2 的安装、工具注册及 Web 设置接口验证，更新 Node 版本要求，明确 `email_health` 只检查配置；运行时代码与 0.10.4 相同。
- **0.10.4（2026-09-07）**：将 `mailparser` 最低版本提升到 `3.9.22` 并更新锁文件，使用 `html-to-text 10.0.1 → deepmerge-ts 8.0.2` 的修复链处理 [CVE-2026-40345](https://github.com/RebeccaStevens/deepmerge-ts/security/advisories/GHSA-ggr8-5vv4-36mx)。不依赖插件作为下游依赖安装时不生效的根级 `pnpm.overrides`；新增真实依赖链与 HTML 邮件解析回归测试。依赖告警不等于已证实邮件输入可触发该漏洞。
- **0.10.1**：补发制品——已发布的 0.10.0 打包时只含 `email_mark`，本版同时包含 `email_mark` 与 `email_reply`，代码与 0.10.0 的 main 一致。
- **0.10.0**：新增 `email_mark`（已读/未读/星标/移动文件夹，补齐收发闭环的整理侧）与 `email_reply`（回复/回复全部/转发，自动线程头+引文，走发信审批门）；连接池按读/写模式分别管理邮箱打开状态。
- **0.9.1**：修复设置页空主机遮蔽 provider 预设（#3/#6）；IMAP 连接超时不再杀死整个 DSH 进程（#4）；暗色模式输入控件可见（#2）；密码栏提示环境变量 `DSH_EMAIL_PASSWORD` 免明文方案（#5）。
- **0.9.0**：新增 `email_watch` 增量新邮件检查工具（游标式，适合定时提醒）；Web 端新增「鲸鱼娘递信」新邮件弹窗（本地皮肤素材运行时读取 + 内置回退图）。
- **0.8.2**：`since` / `until` 参数描述与其余参数统一为英文，方便多语言 agent 理解。
- **0.8.0/0.8.1**：`email_list` / `email_search` 新增 `since` / `until` 日期范围过滤；新增 `email_health` 账号配置自检；适配 harness 0.1.2（清理已删除的客户端注入声明）。
- **0.6.2**：服务器端搜索补齐 `cc`，搜索范围真正覆盖主题 / 发件人 / 收件人 / 抄送；正文回退扫描也匹配 `to` / `cc`，单封解析失败不中断整批；列表强制 UID 降序「最新在前」；`email_send` 附件参数严格校验。


## 兼容性

2026-09-16 曾在官方源码构建的 Harness `0.1.5-rc.2` 和 `0.1.6-alpha.1` 上完成同载验证：18 个组件与 ModLens 同载，工具 schema、技能注册及离线只读调用检查通过。

**0.11.0 的同载验证（2026-09-18，本地构建的 Harness `0.1.5-rc.2`，`web` profile）**：插件挂载无报错；设置路由 GET 返回 200 且响应中已无 `raw` 字段；用 `text/plain` 发 POST 被 **415** 拒绝（同源守卫在真实宿主下生效）；`application/json` 的 POST 下卡片投影正确，账号钉住 `authKind: password` 后 `authKindDeclared` 与 `authKind` 均为 `password`；设置面板实际渲染出账号卡片、8 个服务商预设的中文下拉、「认证方式」三态选择器、「应用（客户端）ID」输入格与提示、未填 ID 时的警示条（说明 `--dsw-alias-state-warn-primary` 在真实宿主下确有定义）与「登录 Microsoft 账号」按钮；浏览器控制台无报错；save 全链路可用，验证结束后已把 `accountsYaml` 还原为空、原有账号恢复。离线测试 231 项全绿。**仍未做**：真实 Outlook 租户的 OAuth2 端到端（设备码流程要真人在浏览器完成授权）与真实发信未测，`clientId` 相关路径目前只有假 authority 的用例覆盖。采用 `cordis.patch.yml` + `dsh.bundle.patch` 组合包模型。Node 要求为 22.19 及以上的 22.x，或 24 及以上。外部服务的实际业务操作需按各组件配置单独验证。

2026-09-10，npm `dsh-email@0.10.6` 曾通过真实 QQ 邮箱目录、列表、读取和搜索，以及设置页“测试连接”“保存并应用”检查；授权码留空时能继续使用 `DSH_EMAIL_PASSWORD`。独立 SMTP 登录认证也已通过。此次复验未连接真实邮箱，未发送、修改或删除邮件。

遵循官方[插件打包与安装要求](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)：ESM 入口、预构建 `lib/`、`dsh.bundle.patch` 和 `cordis.patch.yml` 配置层；显式注入所需服务，提供 JSON Schema 参数、规范化输出和渲染函数，运行时不 import `@deepseek-ai/*` 内部模块。使用 Node 22.19 及以上的 22.x 或 Node 24 及以上版本；Harness 仍在快速迭代，上述版本是实测基线。

## 安装

```sh
dsh plugin --profile web add dsh-email
```

（或从 GitHub 安装：`dsh plugin --profile web add github:你的账号/dsh-email#<commit>`，随后按提示在 profile 的 `pnpm-workspace.yaml` 里授权 `prepare` 构建。）

装好后重启 `dsh web`。插件自带空配置，**不会弄崩启动**；配置前调用任何 email 工具都会返回明确的配置提示。

**配置方式有两种（任选其一）：**

1. **网页设置（推荐）**：重启后打开 **设置 → 邮件 (dsh-email)**，在账号卡片里填邮箱地址和授权码——改动即自动保存，无需再点按钮；每张卡片还能单独「测试连接」。零 YAML、零重启。
2. **YAML**：按下面的 cordis.patch.yml 模板手写 `accounts` 映射。设置页的 `accountsYaml` 由卡片编辑器写入（非空时覆盖 `accounts`），面板本身不再提供 YAML 原文文本框；卡片不建模的字段（如 `socketTimeoutMs`、`connectionTimeoutMs`）仍可在 YAML 里手写，保存卡片时会原地保留。认证方式（`authKind`）已在卡片上提供选择器，无需手写。

设置页整体跟随 DSH 的深浅主题：面板样式全部引用官方 `--dsw-alias-*` 设计变量、不写死颜色，切换浅色/深色即时生效（0.10.8 曾引用一个并不存在的边框变量，暗色下会出现刺眼的浅灰边框，已修掉）。

多账号可以在设置页可视化编辑：账号卡片支持增删改账号、改名、设默认、按账号名单独「测试连接」；没填完的账号不阻断保存，只标一个「未完成」。卡片改动即时防抖落盘，不再有"先写 YAML 文本、再点一次保存"这一步；版本冲突（别处也改了设置）会自动重基后重存一次，而不是拿旧版本号反复失败。保存卡片时，已存的授权码默认保持（密码栏留空 = 不变，填内容 = 覆盖）；YAML 里的注释尽量原地保留，实在保不住时会明确提示。改名走的是原地改键，授权码与高级键一并保留，且不允许改成已有账号名（那会顶掉另一个账号）。账号自己手写的 imap/smtp 端点只在**服务商真的换了**时才清洗——运行时以账号自己的 host 优先，普通保存不会悄悄改动连接目标。

设置页保存的值存在 `settings.yaml` 的 `dsh-email` 命名空间里，覆盖 YAML 的默认账号配置。授权码字段标记为 secret，但填写后保存仍会写入本机配置文件。单账号如需避免保存授权码，可设置 `DSH_EMAIL_PASSWORD` 并将授权码栏留空；环境变量不会被复制进设置文件。

## 卸载

```bash
dsh plugin --profile web remove dsh-email
```

卸载后重启 Web 服务。如需彻底清理，可再手动删除自己 profile `cordis.patch.yml` 中覆盖的插件行。


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

想在多个账号之间复用同一套连接端点，可以用 `serverPresets` 自定义服务商预设（YAML 映射，键 = 预设名，值含可选的 `label` 与 `imap`/`smtp`）：

```yaml
- id: tool-email
  config:
    serverPresets: |
      corp:
        label: 公司邮箱
        imap: { host: imap.corp.example, port: 993, secure: true }
        smtp: { host: smtp.corp.example, port: 465, secure: true }
```

设置页的「服务器预设」折叠区能可视化增删改这些预设，账号卡片的服务商下拉里会自动多出预设名，选中即把端点预填进账号。预设只记连接参数，**不含邮箱地址和授权码**；`port`/`secure` 可省略（默认 993/465 与 SSL）。

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
| `accountsYaml` | 无 | 账号映射的 YAML 文本，由设置页的卡片编辑器写入；非空时覆盖 accounts |
| `clientId` | 无 | OAuth2 账号的应用（客户端）ID；账号级可覆盖顶层简写。插件不内置任何第三方注册，Outlook / Exchange Online 走 OAuth2 时必填（见「Outlook OAuth2」） |
| `authKind` | 按 provider 派生 | 认证方式覆盖，取值 `oauth2` / `password`。缺省时按 provider 与 IMAP 主机派生；仍能用应用密码连 Exchange Online 的混合或本地租户可钉 `password`。设置页卡片的「认证方式」选择器即写此键 |
| `serverPresets` | 无 | 自定义服务商预设的 YAML 文本（键=预设名，值含 `label?`/`imap`/`smtp`）；只存端点、不含凭证，设置页下拉会列出预设名并把端点预填进账号卡片，改预设不会重连已建立的连接 |
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

## Outlook OAuth2（设备码登录）

微软已经对 Exchange Online 关闭了用户名+密码的 basic auth：个人 outlook.com 与绝大多数租户现在只能用 OAuth2。本插件支持设备码（device code）流程，IMAP 与 SMTP 双端共用同一份 token，过期自动刷新。

**为什么不内置一个应用 ID**：客户端 ID 是"某个人的应用注册"。如果插件自带一个，微软同意屏上显示的会是别人的应用名（企业安全团队通常直接拒授权），登录日志与 telemetry 会归到对方租户（含你的 UPN），而对方哪天删掉这个应用，所有用户的登录会同时失败——报出来的还只是一句"clientId 可能填错了"。所以本插件**不携带任何第三方注册**，请用自己的（免费，约 10 分钟）。

**注册一个公共客户端**：

1. 打开 [Entra 管理中心](https://entra.microsoft.com/) → **应用注册（App registrations）** → **新注册**。
2. **受支持的账户类型**选「任何组织目录中的账户 **以及** 个人 Microsoft 账户」——这一项决定了个人 outlook.com 能不能登录，选错会报 `AADSTS700016` 或 `AADSTS50020`。
3. **重定向 URI** 留空（设备码流程不需要）。点注册。
4. 在概览页复制 **应用程序(客户端) ID**，这就是要填的 `clientId`。
5. 左侧 **身份验证** → 页面最下方 **允许公共客户端流** 设为 **是** 并保存。不开这一项，登录会报 `AADSTS700028` 之类的"未开启设备码流"错误。
6. 左侧 **API 权限** → 添加权限 → Microsoft Graph → **委托的权限**，勾上 `IMAP.AccessAsUser.All`、`SMTP.Send`、`offline_access`（最后这个是拿到 refresh token 的关键，少了它每次过期都要重新登录）。个人租户一般无需管理员同意；企业租户可能需要管理员点一次「授予同意」。

**填进插件**：设置页 → 邮件 (dsh-email) → 该账号卡片的「应用（客户端）ID」栏；或者写在 YAML 里（账号级 `clientId`，也可写在顶层作为所有账号的默认）。

**登录**：卡片上点「登录 Microsoft 账号」→ 面板给出一个 `microsoft.com/devicelogin` 链接和一段代码 → 在浏览器打开链接、输入代码、完成授权 → 面板轮询到成功后即显示「已登录：你的地址」。之后收信与发信都用这份 token。

**注意事项**：

- 企业租户可能还需要管理员在 Exchange 管理中心开启该邮箱的 **IMAP** 与 **SMTP AUTH**。没开 SMTP AUTH 时的典型症状是：收信一切正常，发信被拒。
- token 与签发它的应用 ID 绑定：换了 `clientId` 会被判为"换了应用"，需要重新登录（这是有意的，避免拿旧应用的凭据去撞新应用）。
- 如果你的租户是混合或本地部署、SMTP AUTH 仍然开着，用应用密码也能连：在卡片的「认证方式」里选「密码 / 授权码」即可，不必走 OAuth2。

## 已知限制

- **OAuth2 仅覆盖 Outlook / Exchange Online，且需自带应用 ID**：设备码登录已支持 IMAP 与 SMTP 双端，但插件**不内置任何第三方应用注册**，OAuth2 账号必须填自己的 `clientId`（免费注册，见上文「Outlook OAuth2」）。Google Workspace 等其它强制 OAuth 的环境仍不可用，只能用服务商的应用专用密码 / 授权码。
- **正文搜索**：服务器端只搜 subject / from / to / cc；多数服务器（如 QQ）的 IMAP `TEXT` / `HEADER` 搜索不可靠，无结果时回退到最近 `bodySearchLimit` 封的正文扫描（较慢，可用 `bodySearchFallback` 关闭）。
- **附件**：内嵌图片暂不支持单独下载；附件定位失败会直接报错而不是下载错误文件（安全默认）。
- **密码落盘**：设置页保存的授权码以明文写在本机 `settings.yaml`（secret 标记只保证它不进日志 / 导出 / 诊断，不做磁盘加密）。请勿把 `settings.yaml` 交给不信任的人。
- **OAuth2 token 落盘**：access / refresh token 以明文 JSON 存在 `$DSH_HOME/data/dsh-email/oauth2-tokens.json`（刻意不放进 `settings.yaml`，因此不会随设置导出）。写入时带了 `mode: 0o600`，但这个权限位只在**文件创建那一刻**生效，且**在 Windows 上等于无效**——请勿把该文件交给不信任的人。token 与签发它的应用 ID 绑定，换了 `clientId` 需要重新登录；删除账号会清理它的 token。
- **本地改动会被 `pnpm install` 还原**：如果你是直接改 `node_modules/dsh-email/` 里的文件做本地部署，任何一次 `pnpm install` 都会把它还原成 registry 上的版本（例如 0.10.7）；要长期保留请改成从本地路径或 Git 提交安装。

## 开发

```sh
pnpm install
pnpm run build   # tsc → lib/
pnpm test        # 构建 + 离线测试，无需真实邮箱
```

`src/index.ts` 只负责组合插件。`runtime.ts` 管理动态设置、账号连接池和网页/工具各自的监视游标；`tools.ts` 接线十个工具的执行逻辑；`tool-contract.ts` 集中维护参数、输出 schema 和中文渲染；`approval.ts` 管理发信审批。IMAP/SMTP 传输仍由 `mail-client.ts` 负责，网页路由由 `web.ts` 负责——设置页的账号卡片编辑器要的解析、序列化（保留注释、保住已存授权码）和自定义预设快照也在这里。

测试覆盖动态配置换池、卸载释放、取消信号与工作区透传、工具/网页游标隔离、账号卡片序列化与预设解析，以及审批拒绝时不会进入发送执行。测试用内存客户端替代邮箱连接。

## 协议

MIT。这是一个社区插件，与 DeepSeek 官方无关；`@deepseek-ai/*` 为官方保留命名空间。

## 相关插件

- [dsh-slack](https://github.com/STARDUSTLC666/dsh-slack) — Slack 通知/收件箱
- [dsh-dingtalk](https://github.com/STARDUSTLC666/dsh-dingtalk) — 钉钉群通知（零依赖）
- [dsh-email](https://github.com/STARDUSTLC666/dsh-email) — 邮件八件套 + Web 设置页 + 新邮件弹窗
