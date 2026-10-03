# 更新记录

[返回简介](README.md) · [使用说明](docs/USAGE.md) · [验证记录](docs/VALIDATION.md)

[历史英文记录](docs/CHANGELOG.en.md)

## 0.15.2 (2026-10-03)

- 修复语言切换后设置菜单滞后一轮；英文草稿、账号、发送失败引导不再回退中文，保留结果不明时禁止盲目重发的提示。
- 验收范围见 [中英文界面检查](docs/validation-language-2026-10-03.md)。

## 0.15.1 (2026-10-03)

- 修复 email_draft 使用宿主不支持的 JSON Schema maxItems，导致邮件工具注册失败的问题。附件最多 10 个的限制仍在执行前校验，并在工具说明中显示。
- 增加所有邮件工具的 schema 兼容回归和 11 个附件提前拒绝回归；实际使用官方 Harness 0.2.1-alpha.1 检查注册、输出和 PTC 工具声明。

## 0.15.0 (2026-10-03)

- 新增 email_draft 和本地草稿工作台，支持编辑 To/Cc、发件账号、正文、附件上传与预览下载，再明确确认发送。
- 发送使用已预览的附件字节；草稿版本冲突、账号或规则变化、重复确认均被拦截。结果不明时先核对邮箱，不自动重发；回执列明接受与拒绝的地址。
- 新增按账号保存的可信地址/域名规则和匹配预览。全部 To/Cc 匹配且主动启用后才跳过 email_send 的插件确认；回复、宿主权限和草稿手动确认保留。
- 关闭设置可恢复当前会话中未保存的编辑；修复窄屏侧栏挤压和自定义服务器账号被误标为未完成。
- 验证范围详见 [0.15.0 验收](docs/validation/0.15.0.md)。

## 0.14.7 (2026-10-02)

- Fix account cards displaying preset endpoints instead of explicitly configured servers; refresh the summary after saves and provider changes without persisting projections.
- Upgrade ImapFlow, Mailparser, Nodemailer and the transitive IP address parser; use Nodemailer's bundled types.
- Handle missing IMAP messages, empty searches and missing attachment streams with explicit recovery errors.
- Add regression coverage for endpoint display and empty IMAP responses. Windows: 304 tests; production dependency audit: 0 findings.

## 0.14.6 (2026-10-02)

- 完成 [PR #18](https://github.com/STARDUSTLC666/dsh-email/pull/18) 的兼容合并：未修改的表单端点不再产出空对象，避免旧设置和不完整草稿覆盖配置文件里手动填写的 IMAP/SMTP 服务器。
- 保留 0.14.2 的共享端点归一化规则：Outlook 使用 587/STARTTLS；不含占位 host 的显式 465/TLS 设置、已修改的端口组合和新版 Harness 配置保持有效。
- 新增旧设置运行时和不完整草稿的服务器保留回归，感谢 SenkjM 提供修复方向。
- Windows / Node 24.16.0 下 297 项邮件测试通过；两项新增回归在修复前失败、修复后通过。未进行真实邮箱授权或 SMTP 投递验收。

## 0.14.5 (2026-10-01)

- 修复 [#20](https://github.com/STARDUSTLC666/dsh-email/issues/20)：具名账号的服务商预设不再被顶层共享服务器遮蔽；Gmail 不再因继承 Outlook 端点被误判为 OAuth2。保留账号显式端点、传输超时和旧单账号继承规则。
- 账号映射转换为卡片时沿用相同端点规则；新版设置服务保存卡片时排除表单派生的共享 imap/smtp，避免修改 Outlook 后改变其他账号的连接。
- 连接失败显示账号、实际 IMAP 主机与端口；密码赋值及服务端回显的已知密码会脱敏，短密码不会破坏普通错误文字。
- 修复顶层 senderName / authUser / authPassword 未传入单账号解析的问题。
- 空地址卡片点击测试时先提示填写邮箱地址，不再测试隐藏表单中的旧凭据；保存后及时更新 Outlook 内置应用 ID 和独立登录密码的提示。
- Windows 下新增十项行为回归，整套邮件 295 项通过；官方 Harness 0.2.0-rc.2 源码构建及 18 插件同载检查通过。原生桌面已实测新增卡片、服务商切换、自动保存与删除；最后的字段提示修正有组件行为回归，尚未再次实机操作。未验证真实邮箱登录、OAuth2 授权或发信成功。

## 0.14.4 (2026-09-29)

- 修复：SMTP 发送改为**每次发送独占连接**，取消（AbortSignal）时只销毁本次连接的 socket 并立即拒绝，不再影响同账号的其它发送，也不会在取消后仍把邮件发出去。
- 修复：OAuth2 令牌刷新与取消的竞态——取消后即使令牌刷新成功也不再继续发送。
- 测试：修正 TLS fixture 的两处握手缺陷（STARTTLS 明文阶段未发送 220；取消用例把 greeting 压住导致走不到 TLS 升级），TLS 与取消回归现可稳定通过（285 项）。

## 0.14.3 (2026-09-28)

- 兼容验证更新到 Harness 0.2.0-rc.1：282 项邮件测试与 18 插件共同加载检查通过。
- 运行时代码未变；同步中英文兼容性声明。

## 0.14.2 (2026-09-28)

- 修复 [#17](https://github.com/STARDUSTLC666/dsh-email/issues/17)：空主机配合未修改的表单默认端口/TLS 不再覆盖服务商预设；Outlook 恢复 587/STARTTLS。旧设置转换和 Harness 0.1.7 已迁移配置共用归一化规则，保留自定义主机、非默认组合和不含占位 host 的显式端口覆盖。
- 感谢 [SenkjM 的 PR #18](https://github.com/STARDUSTLC666/dsh-email/pull/18) 提供复现与修复方向。本次补齐新版运行时路径并避免误删明确的端口设置；282 项邮件测试通过。配置和界面验证不代表真实 SMTP 投递已验证。

## 0.14.1 (2026-09-27)

- 未补全的账号和服务器预设会显示未保存提示；避免草稿丢失和错误的“已保存”状态。测试连接只校验所选账号，错误直接指向设置页中的对应字段。

## 0.14.0 (2026-09-23)

- 适配 Harness 0.1.7 设置接口；自动导入旧版邮箱设置，旧账号直接显示为可编辑卡片。编辑即时保存，刷新后保留；保留高级参数与已有密码，清空账号后不再重新出现。

## 0.13.2 (2026-09-21)

- 同名附件优先按真实 MIME 分段编号下载；旧解析元数据按一对一匹配，避免多个序号都取到第一个同名文件。保留正文分段下载和附件索引缓存，新增文件字节级回归，268 项测试通过。

## 0.13.1 (2026-09-19)

- **新增**：内置一份公共客户端注册（`15dcd5aa-…`，贡献者 [gurio-wine](https://github.com/gurio-wine) 在 [PR #13](https://github.com/STARDUSTLC666/dsh-email/pull/13) 注册，并授权本项目内置使用，特此致谢）——Outlook / Exchange Online 的 OAuth2 登录**开箱即用**，不再需要每个用户自己注册应用。设置页卡片会显示当前生效的应用 ID：留空即用内置的社区应用，填入自己的 `clientId` 即覆盖（账号级仍可覆盖顶层简写）。**文档**：README 说明内置应用来自谁、代价是什么、如何换成自己的；并说明 token 与签发它的应用 ID 绑定，将来替换内置注册需要这些账号重新登录一次。测试 262 → 264 项。

## 0.13.0 (2026-09-19)

- **修复**：①长正文截断会把整段正文丢成空（无断点时硬切，保留正文）；②`email_watch` / 网页弹窗的游标会永久漏报一次超过 `limit` 条的新邮件（改为最旧优先分批、游标只推进到实际返回那批）；③附件索引缓存未绑定 UIDVALIDITY，服务器重编号后可能按旧索引写出错误附件（缓存键并入 uidValidity）。**性能**：10 个工具声明 `timeoutMs`（search/watch 120s，其余 60s）；watch/弹窗轮询只 FETCH 本轮要报的条数（此前每轮最多 FETCH 100 封未读信封）；读信与正文搜索只下载 text/* 分段，不再把整封（含附件）拉下来。**口径**：搜索回退路径明确标注为扫描口径（「本页 N 条（仅扫描最近 X 封）」，不再冒充全文件夹匹配数）。**行为变化**：`email_read` 的 `attachments` 只列可下载的 `disposition=attachment`（内嵌图片不再列出）；回退扫描改为逐封下载文本分段（省流量、往返略增）。测试 237 → 262 项。

## 0.12.0 (2026-09-18)

- **新增发送别名**（`senderName` / `authUser` / `authPassword`）：`user` 只作为发件地址与信箱身份，登录名与登录密码可以另填——Gmail / Workspace 的别名发信、以及「登录账号 ≠ From 地址」的 SMTP 中继不再被 `535 Username and Password not accepted` 拒绝，From 也能带显示名。设置页账号卡片新增「发件显示名 / 登录账号 / 登录账号的密码」三栏（与授权码同一套三态：留空保留已存值、清空即删除）。**新增** `email_search` 的 `offset`，命中多于一页时可翻页。**修复与优化**：文件夹 UIDVALIDITY 变化时重建 `email_watch` / 弹窗的增量基线（不再把重编号后的整箱当成新邮件）；搜索的命中复核与结果列表合并为一次 FETCH；`email_attachment` 复用 `email_read` 已解析的 MIME 索引，不再把整封邮件（含附件）重下一遍；`email_folders` 结果缓存 60 秒；网页端新邮件弹窗在标签页不可见时暂停轮询、失败指数退避、皮肤快照降频。**工程**：CI 增加「`lib/` 与 `src/` 不允许漂移」和客户端 bundle 语法检查。测试 237 → 252 项。发送别名的方向来自 [@TianLanDaoRen](https://github.com/TianLanDaoRen) 的 [PR #8](https://github.com/STARDUSTLC666/dsh-email/pull/8)（本实现按 0.11.0 之后的代码重写）。

## 0.11.0 (2026-09-18)

- 合入 gurio-wine 的设置页四连（[PR #11](https://github.com/STARDUSTLC666/dsh-email/pull/11)–[#14](https://github.com/STARDUSTLC666/dsh-email/pull/14)），并在评审后修掉其中若干问题。**新增**：①多账号卡片编辑器（增删改 / 改名 / 设默认 / 按账号单独测试连接，编辑即保存，不再需要点「保存并应用」）与服务器预设管理（`serverPresets`，自定义服务商端点，不含凭证）；②Outlook / Exchange Online 的 OAuth2 设备码登录（IMAP 与 SMTP 双端，access token 自动刷新，密码认证账号完全不受影响）；③设置面板文案中英双语，跟随宿主 Settings → General 的语言实时切换；④账号可显式钉住 `authKind`（自动 / oauth2 / password），给仍能用应用密码连 Exchange Online 的混合或本地租户留退路。**评审修复**：SMTP 的 OAuth2 认证形状原本一封也发不出去（nodemailer 的 `XOAuth2` 只读 `accessToken`、从不读 `pass`，实测报 `EAUTH`）；保存面板不再无条件抹掉账号手写的 imap/smtp 端点（运行时解析以账号自己的值优先，原行为会把自建服务器账号静默改指预设，无 provider 的账号则直接失去连接信息）；改名保留授权码与高级键，且不允许顶掉同名账号；设置路由增加 Host / Origin / Content-Type 同源校验（此前任意网页都能跨源改设置，DNS rebinding 还能读走含明文授权码的快照）；响应不再回显解析后的账号映射（那是一份含明文密码、前端从不读取的副本）；服务器原始报错经凭据脱敏后才展示（IMAP/SMTP 会回显被拒的认证串，其中含 access token）；删除账号即清理其 token，未提交的保存不清；版本冲突自动重基，而不是拿旧 revision 反复重试。**不内置任何第三方 OAuth2 应用注册**：OAuth2 账号需自带 `clientId`，见下文「Outlook OAuth2」。测试 81 → 237 项。**修复 `email_search`**：QQ 这类服务器会对任意关键词返回同一批无关 UID，现在服务器命中会先用 envelope 复核（subject/from/to/cc），核实不到就回退本地正文扫描，不会再出现「不存在的关键词也匹配 40 条」（[#15](https://github.com/STARDUSTLC666/dsh-email/issues/15)）。

## 0.10.8 (2026-09-16)

- 合入 GUODnuli 的 [PR #9](https://github.com/STARDUSTLC666/dsh-email/pull/9)，将设置页及新邮件弹窗的文字、边框引用改为官方主题变量，修复深色主题文字不可读；复验官方 Harness 0.1.5-rc.2 和 0.1.6-alpha.1。

## 0.10.7 (2026-09-12)

- 复验官方 Harness 0.1.5-rc.1，更新整套同载与真实服务验证记录；运行时代码未变。

## 0.10.6 (2026-09-10)

- 修复单账号设置页授权码留空时，空字符串遮蔽 `DSH_EMAIL_PASSWORD`，导致“测试连接”和保存后工具调用报未配置的问题；显式密码仍优先，多账号不会借用该环境变量。更新设置页工具数量、多账号说明，并补充真实 QQ 邮箱验证结果。

## 0.10.5 (2026-09-08)

- 补充官方 Harness 0.1.3-alpha.2 的安装、工具注册及 Web 设置接口验证，更新 Node 版本要求，明确 `email_health` 只检查配置；运行时代码与 0.10.4 相同。

## 0.10.4 (2026-09-07)

- 将 `mailparser` 最低版本提升到 `3.9.22` 并更新锁文件，使用 `html-to-text 10.0.1 → deepmerge-ts 8.0.2` 的修复链处理 [CVE-2026-40345](https://github.com/RebeccaStevens/deepmerge-ts/security/advisories/GHSA-ggr8-5vv4-36mx)。不依赖插件作为下游依赖安装时不生效的根级 `pnpm.overrides`；新增真实依赖链与 HTML 邮件解析回归测试。依赖告警不等于已证实邮件输入可触发该漏洞。

## 0.10.1 (2026-09-01)

- 补发制品——已发布的 0.10.0 打包时只含 `email_mark`，本版同时包含 `email_mark` 与 `email_reply`，代码与 0.10.0 的 main 一致。

## 0.10.0 (2026-09-01)

- 新增 `email_mark`（已读/未读/星标/移动文件夹，补齐收发闭环的整理侧）与 `email_reply`（回复/回复全部/转发，自动线程头+引文，走发信审批门）；连接池按读/写模式分别管理邮箱打开状态。

## 0.9.1 (2026-09-01)

- 修复设置页空主机遮蔽 provider 预设（#3/#6）；IMAP 连接超时不再杀死整个 DSH 进程（#4）；暗色模式输入控件可见（#2）；密码栏提示环境变量 `DSH_EMAIL_PASSWORD` 免明文方案（#5）。

## 0.9.0 (2026-08-31)

- 新增 `email_watch` 增量新邮件检查工具（游标式，适合定时提醒）；Web 端新增「鲸鱼娘递信」新邮件弹窗（本地皮肤素材运行时读取 + 内置回退图）。

## 0.8.2 (2026-08-31)

- `since` / `until` 参数描述与其余参数统一为英文，方便多语言 agent 理解。

## 0.8.0/0.8.1

- `email_list` / `email_search` 新增 `since` / `until` 日期范围过滤；新增 `email_health` 账号配置自检；适配 harness 0.1.2（清理已删除的客户端注入声明）。

## 0.6.2

- 服务器端搜索补齐 `cc`，搜索范围真正覆盖主题 / 发件人 / 收件人 / 抄送；正文回退扫描也匹配 `to` / `cc`，单封解析失败不中断整批；列表强制 UID 降序「最新在前」；`email_send` 附件参数严格校验。

## 更早的改动

完整历史可查阅 [GitHub 提交记录](https://github.com/STARDUSTLC666/dsh-email/commits/main)。
