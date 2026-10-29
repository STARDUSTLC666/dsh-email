# dsh-email

[English](README.en.md)

![dsh-email 鲸鱼娘插件封面](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/cover-whale-girl.png)

在 DSH 邮件工作台管理 IMAP / POP3 / SMTP 与 AgentMail 多账号。查看收件箱和已发送、搜索邮件、下载附件，并先保存与检查草稿，再明确确认发送。

[![npm](https://img.shields.io/npm/v/dsh-email)](https://www.npmjs.com/package/dsh-email) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-downloads.svg)](https://www.npmjs.com/package/dsh-email) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-total-downloads.svg)](https://www.npmjs.com/package/dsh-email)

[下载统计说明](https://github.com/STARDUSTLC666/dsh-suite/blob/npm-downloads/README.md)

欢迎使用，遇到问题或有改进建议，请提交 [issues](https://github.com/STARDUSTLC666/dsh-email/issues) 和 [PR](https://github.com/STARDUSTLC666/dsh-email/pulls)。

从 DSH 原生侧栏打开工作台；配置与操作边界见[工作台说明](docs/WORKBENCH.md)。

## 功能

- 通过 IMAP / SMTP 收发、回复和转发邮件。
- 通过邮箱地址与 API Key 添加 AgentMail US / EU 账号，无需配置 IMAP / SMTP。
- 在「收发邮件」页浏览收件箱与已发送，搜索、翻页、阅读正文、下载附件、标记已读和星标。
- 管理附件、搜索结果与邮箱整理操作。
- 搜索无可信服务端结果时，分批检查邮件信封，并说明覆盖范围；可继续查更早邮件。
- 多账号设置，支持 Outlook OAuth2、Windows 登录令牌加密和发信审批。
- 新邮件弹窗可在设置中关闭，保存后重启仍生效。
- 准备和编辑本地草稿，核对发件人、To/Cc、正文与附件预览后再确认发送。
- 按账号管理可信与禁止收件人，预览规则如何匹配地址、地址组和抄送。

## 安装

桌面版可在「插件」面板按包名 `dsh-email` 安装。已配置 dsh 命令时也可使用：

```bash
dsh plugin --profile desktop add dsh-email
```

网页版把命令中的 `desktop` 改为 `web`。安装后重启 DSH。

## 开始使用

需要 POP3 的账号，可在「邮箱设置」选择收信协议并测试连接。支持读信、范围明确的本地搜索、附件和 SMTP 回复草稿；服务器状态与协议限制见 [POP3 使用流程](docs/POP3.md)。

1. 打开“邮件”的账号设置，选择自己的 IMAP/SMTP、OAuth 或 AgentMail 账号并填写授权信息。
2. 测试连接，选择要使用的账号，再从“收发邮件”读取收件箱和已发送。
3. 搜索并打开邮件，核对正文与附件；可让助手“准备回复，先不要发送”。
4. 到“草稿”编辑、保存和检查预览，核对 To/Cc、附件和发信账号后再确认发送。
5. 在已发送或原邮件线程中核对结果；收件人禁止规则始终优先。

## 依赖与配置

普通邮箱需要授权码、应用专用密码或对应 OAuth 授权；AgentMail 需要对应区域的邮箱与 API Key，见 [AgentMail 配置](docs/AGENTMAIL.md)。DSH 的模型 API Key 与邮箱登录分别配置。

详细配置、工具参数与排错见[使用说明](docs/USAGE.md)。从源码独立开发时，Node 要求以 [package.json](package.json) 为准。

## 文档

- [使用与排错](docs/USAGE.md)
- [更新记录](CHANGELOG.md)
- [验证范围与历史记录](docs/VALIDATION.md)
- [问题反馈与功能建议](https://github.com/STARDUSTLC666/dsh-email/issues)

## 插件更新

需要 DSH 0.2.1-rc.3 或更新版本。更新控件直接位于原有工作台内容末尾；没有工作台的插件，位于原生插件详情页底部。检查、更新记录和偏好在原地展开，不增加独立更新页面或设置菜单。自动检查默认开启；**自动安装默认关闭**，明确授权后才会在空闲且没有未保存修改时安装兼容的稳定补丁。开关按插件独立保存，可关闭、推迟或忽略提醒；不会强制重启 DSH、升级 DSH 本体或替换本地源码安装。Suite 组件在当前页面底部明确说明并操作 Suite 整包更新。

旧版用户先在官方插件管理中手动更新一次，之后才会获得此入口。发布到 npm 不会直接替换用户已经安装的版本。

## License

[MIT](LICENSE)
