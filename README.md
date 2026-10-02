# dsh-email

[English](README.en.md)

在 DSH 中收发、搜索和整理邮件，支持多个邮箱账号。

[![npm](https://img.shields.io/npm/v/dsh-email)](https://www.npmjs.com/package/dsh-email) [![downloads](https://img.shields.io/npm/dm/dsh-email)](https://www.npmjs.com/package/dsh-email)

## 功能

- 通过 IMAP / SMTP 收发、回复和转发邮件。
- 管理附件、搜索结果与邮箱整理操作。
- 多账号设置，支持 Outlook OAuth2 和发信审批。

## 安装

桌面版可在「插件」面板按包名 `dsh-email` 安装。已配置 dsh 命令时也可使用：

```bash
dsh plugin --profile desktop add dsh-email
```

网页版把命令中的 `desktop` 改为 `web`。安装后重启 DSH。

## 开始使用

打开「设置 → 邮件」添加账号并测试连接。可说：“列出最近未读邮件，给这封邮件准备回复。”发送前核对收件人与内容。

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
