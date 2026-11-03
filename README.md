**简体中文** · [English](README.en.md)

# Email

**在 DSH 里处理邮件，确认后再发出回复。**

[![npm](https://img.shields.io/npm/v/dsh-email)](https://www.npmjs.com/package/dsh-email) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-downloads.svg)](https://www.npmjs.com/package/dsh-email) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-total-downloads.svg)](https://www.npmjs.com/package/dsh-email)

**[安装使用](#安装) · [使用流程](#开始使用) · [完整说明](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/REFERENCE.zh.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-light.svg" alt="在 DSH 里处理邮件，确认后再发出回复。 · 流程示意" width="100%">
</picture>

## 功能

- 使用 IMAP / POP3 / SMTP、Outlook OAuth 或 AgentMail 账号。
- 在工作台浏览邮件、搜索并下载附件。
- 核对发件账号、To/Cc、正文和附件后确认发送。

<details>
<summary>查看实际示例</summary>

![workbench example](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/screen-zh.webp)

图片来自验证环境的真实界面或示例 PPTX 渲染，使用示例数据。

</details>

## 安装

在 DSH 桌面版「插件」面板安装 `dsh-email`。已配置命令行时也可使用：

```bash
dsh plugin --profile desktop add dsh-email
```

网页版把 `desktop` 改为 `web`；安装后重启对应的 DSH。宿主要求以包声明 `>=0.2.1-rc.3` 为准。

## 开始使用

1. 打开“邮件”的账号设置，选择自己的 IMAP/SMTP、OAuth 或 AgentMail 账号并填写授权信息。
2. 测试连接，选择要使用的账号，再从“收发邮件”读取收件箱和已发送。
3. 搜索并打开邮件，核对正文与附件；可让助手“准备回复，先不要发送”。
4. 到“草稿”编辑、保存和检查预览，核对 To/Cc、附件和发信账号后再确认发送。
5. 在已发送或原邮件线程中核对结果；收件人禁止规则始终优先。

可以这样说：

> 读取这封邮件，准备一封回复草稿，先不要发送。

## 开始前要知道

需要自己的邮箱授权或 AgentMail API Key；POP3 的状态与搜索范围按协议说明。

配置、完整工具与排错见[详细使用说明](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/REFERENCE.zh.md)。

## 插件更新

在工作台或原生插件详情页底部检查更新。默认自动检查，**默认不自动安装**；是否安装、何时重启由你决定。Suite 管理的组件随整包更新。[查看更新规则](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/REFERENCE.zh.md)。

## 文档

- [详细使用、配置与边界](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/REFERENCE.zh.md)
- [更新记录](https://github.com/STARDUSTLC666/dsh-email/blob/main/CHANGELOG.md)
- [验证范围与历史](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/VALIDATION.md)

## 反馈与贡献

如果插件帮到了你，欢迎 Star，让更多人发现它。问题和建议请提交 [Issues](https://github.com/STARDUSTLC666/dsh-email/issues)，也欢迎代码与文档 [PR](https://github.com/STARDUSTLC666/dsh-email/pulls)。反馈时附上版本与复现步骤，并移除凭据。

## License

[MIT](https://github.com/STARDUSTLC666/dsh-email/blob/main/LICENSE)

<a id="依赖与配置"></a>
