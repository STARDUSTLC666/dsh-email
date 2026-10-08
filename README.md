# dsh-email

[English](README.en.md)

![dsh-email 鲸鱼娘插件封面](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/cover-whale-girl.png)

在 DSH 中收发、搜索和整理邮件，支持多个邮箱账号。

[![npm](https://img.shields.io/npm/v/dsh-email)](https://www.npmjs.com/package/dsh-email) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-downloads.svg)](https://www.npmjs.com/package/dsh-email)

欢迎使用，遇到问题或有改进建议，请提交 [issues](https://github.com/STARDUSTLC666/dsh-email/issues) 和 [PR](https://github.com/STARDUSTLC666/dsh-email/pulls)。

## 功能

- 通过 IMAP / SMTP 收发、回复和转发邮件。
- 管理附件、搜索结果与邮箱整理操作。
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

打开「设置 → 邮件」添加账号并测试连接。可说：“列出最近未读邮件，给这封邮件准备回复。”发送前核对收件人与内容。

要先编辑再发送，可说：“用 email_draft 准备一封邮件，先别发送。”在「草稿」页保存编辑、检查附件并确认。详见[草稿与收件人规则](docs/DRAFTS.md)。

## 依赖与配置

需要邮箱授权码、应用专用密码或对应 OAuth 授权。DSH 的模型 API Key 与邮箱登录是分别配置的。

详细配置、工具参数与排错见[使用说明](docs/USAGE.md)。从源码独立开发时，Node 要求以 [package.json](package.json) 为准。

## 文档

- [使用与排错](docs/USAGE.md)
- [更新记录](CHANGELOG.md)
- [验证范围与历史记录](docs/VALIDATION.md)
- [问题反馈与功能建议](https://github.com/STARDUSTLC666/dsh-email/issues)

## License

[MIT](LICENSE)
