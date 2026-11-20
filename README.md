**简体中文** · [English](README.en.md)

# Email

**DeepSeek Harness 邮件工作台：收发邮件、编辑图文草稿、核对后再定时或立即发送，支持五种界面主题实时切换。**

[![npm](https://img.shields.io/npm/v/dsh-email)](https://www.npmjs.com/package/dsh-email) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-downloads.svg)](https://www.npmjs.com/package/dsh-email) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-total-downloads.svg)](https://www.npmjs.com/package/dsh-email)

**[安装使用](#安装) · [使用流程](#开始使用) · [完整说明](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/REFERENCE.zh.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-light.svg" alt="在 DSH 里处理邮件，确认后再发出回复。 · 流程示意" width="100%">
</picture>

## 功能

- 使用 IMAP / POP3 / SMTP、Google / Outlook OAuth 或 AgentMail 账号，提供腾讯企业邮预设。
- 内置服务商与「服务器预设」之外，服务商下拉还提供「自定义服务器（手动填写）」：内网 / 自建邮件服务器可直接填 IMAP/SMTP 端点，发信主机留空沿用收信主机，端口留空按 993/465 处理。
- 在工作台浏览邮件、搜索并下载附件，并支持五种界面风格切换（原生清透 / 米白纸感 / Claude 暖书卷 / 8-Bit 像素 / 晴空薄荷）与全套微动效反馈。
- 本地通讯录：读信时自动收集往来地址，发件人 / 收件人按通讯录姓名渲染；写信时 To/Cc 支持姓名、邮箱、全拼、拼音首字母与工号自动补全并带出姓名（例如 `张小` / `zxm` / `zhangxiaoming` / `100123` 都能找到同一个人），数据只保存在本机 SQLite 文件里。
- 管理 IMAP 自建文件夹：创建、重命名，预览并单独确认清空，只删除空文件夹；系统目录受保护。
- 界面跟随 DSH 语言：简体中文、英语、西班牙语、法语、德语、日语、巴西葡萄牙语和俄语。
- 其他插件可在进程内用 `emailTasks` 订阅新邮件到达，不读取正文、不创建会话。
- 编辑 HTML 或纯文本回复与草稿，核对发件账号、To/Cc、正文和附件后立即发送或定时发送。
- 可选「邮件任务」：从授权邮箱给允许的工作区发起 DSH 任务，并接续原会话；默认关闭。

新增功能的完整流程和边界见[图文邮件、定时发送与邮件任务](docs/OUTGOING-AUTOMATION.md)。Gmail OAuth 需自行创建 Google Desktop app 客户端；应用密码是否可用仍取决于账号策略。定时发送需保持 DSH 运行；自动邮件任务与结果回复均须主动启用。

<details>
<summary>查看实际示例</summary>

![workbench example](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/screen-zh.webp)

图片来自验证环境的真实界面或示例 PPTX 渲染，使用示例数据。

</details>

图文阅读、长原文回复，以及 IMAP 单封 / 批量移入废纸篓与撤销，见[邮箱操作流程](docs/MAILBOX.md)。外部图片由你选择加载，邮件整理先预览确认。

## 安装

在 DSH 桌面版「插件」面板安装 `dsh-email`。已配置命令行时也可使用：

```bash
dsh plugin --profile desktop add dsh-email
```

网页版把 `desktop` 改为 `web`；安装后重启对应的 DSH。宿主要求以包声明 `>=0.2.2-rc.3` 为准。

## 开始使用

**核心协作闭环：连接邮箱 → 面板收信筛选 → 一键复制指令让助手写回信 / 做摘要 → 确认后发送**

1. **连接邮箱**：打开「邮件 → 邮箱账号」，选择内置服务商（QQ、163、腾讯企业邮、Gmail、Outlook OAuth、AgentMail 或自定义服务器），填写授权码或完成 OAuth 登录后点击「测试连接」。
2. **面板收信筛选**：切到「收发邮件」，按文件夹、「只看未读」、「本页有附件」或关键词快速定位目标邮件，安全阅读图文正文与下载附件（外部追踪图片默认拦截，由你按需放行）。
3. **一键复制指令让助手写回信 / 做摘要**：展开邮件列表顶部的 **「AI 邮件助手工作流与快捷指令」** 折叠栏，点选 **「汇总未读与待办」**、**「起草得体回复草稿」** 或 **「提炼要点与待确认项」**——若已点开某封邮件，复制的指令会自动附带该邮件的账号、UID、主题与发件人上下文，粘贴到 DSH 对话即可让助手精准生成草稿或摘要（绝不越权直接发出）。
4. **确认后发送**：切到「草稿」核对收件人（To/Cc）、图文预览、附件与发件账号，确认无误后选择**立即发送**或**定时发送**；收件人禁止规则始终优先。

也可以直接在对话里这样对助手说：

- > 汇总我工作邮箱里的未读重要邮件，按紧急程度列出待回复事项，先不要发送任何邮件。
- > 帮我针对刚才点开的这封邮件起草一封得体、简洁的回复草稿，存进草稿箱让我核对后再发。

## 开始前要知道

需要自己的邮箱授权或 AgentMail API Key；POP3 的状态与搜索范围按协议说明。网络必须经代理才能连上邮箱服务器时，给账号加 `proxy`（或用 `HTTPS_PROXY`），见[使用说明](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/USAGE.md)。

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
