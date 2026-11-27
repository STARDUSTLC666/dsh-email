**简体中文** · [English](README.en.md)

# Email

> **在 DeepSeek Harness 中安全收发多账号邮件，核对草稿后再立即或定时发送。**

默认进入 **「信桌」实体航空书信分拣台**（1 键切回经典三栏），支持全协议多账号、本地 SQLite 通讯录拼音补全、互动鲸鱼娘「信使」与 13 套风格 / 8 套双层字体。

[![npm](https://img.shields.io/npm/v/dsh-email)](https://www.npmjs.com/package/dsh-email) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-downloads.svg)](https://www.npmjs.com/package/dsh-email) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-total-downloads.svg)](https://www.npmjs.com/package/dsh-email)

**[宣传片](#宣传片) · [核心能力](#核心能力) · [界面与风格预览](#界面与风格预览) · [安装](#安装) · [快速上手](#开始使用) · [完整说明](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/REFERENCE.zh.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-zh-light.svg" alt="在 DSH 里处理邮件，确认后再发出回复。 · 流程示意" width="100%">
</picture>

## 宣传片

<p align="center">
  <a href="https://github.com/STARDUSTLC666/dsh-email/blob/main/assets/promo/dsh-email-v1.0.0-promo-1080p.mp4" title="点击观看完整 1080p 有声宣传片（81.6s）">
    <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/promo/dsh-email-v1.0.0-teaser.webp" alt="dsh-email v1.0.0 官方宣传片高光动图预览：点击观看完整 1080p 有声版" width="100%">
  </a>
</p>

<p align="center">
  <strong><a href="https://github.com/STARDUSTLC666/dsh-email/blob/main/assets/promo/dsh-email-v1.0.0-promo-1080p.mp4">▶ 观看完整 1080p 有声宣传片（81.6s · MP4）</a></strong>
  &nbsp;·&nbsp;
  <a href="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/promo/dsh-email-v1.0.0-cover.webp">查看高清封面海报</a>
  <br>
  <sub>全片实景演示「信桌」3 层航空书信叠卡与 3D 翻面、6 层零凭据自动识服、1 键切经典「三栏」、<code>tools/pre-execute</code> 发信审批闸门、本地 SQLite 5 万拼音通讯录与 13 套主题 × 8 套字体切换。BGM: <em>Lights</em> by Sappheiros (<a href="https://www.free-stock-music.com/">Free Stock Music</a>, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>, 经剪辑适配片长)</sub>
</p>

## 核心能力

| 模块 | 核心特性 |
| :--- | :--- |
| **全协议多账号** | 支持 IMAP / POP3 / SMTP、Google / Outlook OAuth、AgentMail、腾讯企业邮预设、**按域名一键自动识别服务器**（离线库 / MX 反查 / SRV / Autoconfig / ISPDB）与内网自定义端点 |
| **「信桌」叠卡分拣** | 3 层航空信纸叠卡（左滑跳过、右滑展开全文、`Space`/`F` 3D 翻面看信封头）；1 键切回经典「三栏」并保留层级未读角标，另可切到 Gmail 式「列表」单行视图（无第三栏，点开邮件整块阅读） |
| **安全读信与草稿发送** | 默认拦截外部追踪图，支持 HTML/纯文本草稿核对后立即发送或定时发送，收件人禁止规则优先；支持 IMAP 文件夹管理与撤销删信 |
| **本地拼音通讯录** | 读信自动收集往来地址，写信 To/Cc 支持姓名、邮箱、全拼、拼音首字母与工号补全，数据仅保存在本机 SQLite |
| **信使互动与扩展能力** | 顶栏可召唤互动鲸鱼娘「信使」一键查新信；支持 8 种界面语言、13 套风格 × 8 套字体、进程内 `emailTasks` 订阅与可选「邮件任务」（默认关闭） |

## 界面与风格预览

以下 9 张实机截屏均采自 DSH Web 本地受控 IMAP/SMTP 验证环境（覆盖「信桌」叠卡、3D 翻面、经典三栏、自动识服、审批规则、SQLite 拼音补全与多套焕新主题，使用脱敏示例数据），点击查看大图。

<table>
<tr>
  <th>「信桌」航空书信叠卡（晴空水晶）</th>
  <th>3D 翻面直视原始信封头（Headers）</th>
  <th>经典「三栏」目录 · 追踪拦截 · 内嵌图表</th>
</tr>
<tr>
  <td width="33%"><a href="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-desk-frutiger-zh.webp"><img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-desk-frutiger-zh.webp" alt="dsh-email 信桌航空书信叠卡工作台，晴空水晶主题" width="100%"></a></td>
  <td width="33%"><a href="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-desk-flipped-zh.webp"><img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-desk-flipped-zh.webp" alt="dsh-email 信桌卡片 3D 翻面查看原始信封头与 MIME 协议元数据" width="100%"></a></td>
  <td width="33%"><a href="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-threepane-imap-zh.webp"><img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-threepane-imap-zh.webp" alt="dsh-email 经典三栏视图，含层级文件夹未读角标、外链追踪图拦截横幅与离线内嵌柱状图" width="100%"></a></td>
</tr>
<tr>
  <th>全协议多账号与 6 层零凭据自动识服</th>
  <th>收件人禁止优先规则与发信审批边界</th>
  <th>本地 SQLite 拼音 / 首字母 / 工号补全</th>
</tr>
<tr>
  <td width="33%"><a href="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-accounts-autodiscover-zh.webp"><img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-accounts-autodiscover-zh.webp" alt="dsh-email 邮箱账号面板，支持多账号管理、腾讯企业邮与 Gmail OAuth、按域名一键自动识别与测试连接" width="100%"></a></td>
  <td width="33%"><a href="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-policy-approval-zh.webp"><img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-policy-approval-zh.webp" alt="dsh-email 收件人规则配置页，支持可信与禁止域名/地址列表及免发送模拟检查" width="100%"></a></td>
  <td width="33%"><a href="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-compose-pinyin-zh.webp"><img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-compose-pinyin-zh.webp" alt="dsh-email 写邮件弹窗，键入拼音首字母实时补全本地 SQLite 通讯录中的联系人与工号邮箱" width="100%"></a></td>
</tr>
<tr>
  <th>主题风格：晴空薄荷（Airy Mint）</th>
  <th>主题风格：宋韵朱砂（Songhui）</th>
  <th>主题风格：工程晒图（Blueprint）</th>
</tr>
<tr>
  <td width="33%"><a href="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-skin-mint-zh.webp"><img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-skin-mint-zh.webp" alt="dsh-email 晴空薄荷主题与专属字体实机效果" width="100%"></a></td>
  <td width="33%"><a href="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-skin-songhui-zh.webp"><img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-skin-songhui-zh.webp" alt="dsh-email 宋韵朱砂主题与专属字体实机效果" width="100%"></a></td>
  <td width="33%"><a href="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-skin-blueprint-zh.webp"><img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/gallery/v100-skin-blueprint-zh.webp" alt="dsh-email 工程晒图主题与专属等宽字体实机效果" width="100%"></a></td>
</tr>
</table>

## 安装

在 DSH 桌面版「插件」面板安装 `dsh-email`，或使用命令行：

```bash
dsh plugin --profile desktop add dsh-email
```

网页版将 `desktop` 改为 `web`，安装后重启 DSH。宿主要求：`>=0.2.2-rc.3`。

## 开始使用

1. **连接邮箱**：打开「邮件 → 邮箱账号」，选择内置服务商、OAuth、AgentMail 或自定义服务器，先「测试连接」再保存启用。
2. **「信桌」分拣与读信**：切到「收发邮件」按账号/文件夹/未读/附件筛选；左滑跳过、右滑展开全文，按 `Space`/`F` 查看原始信封头，随时 1 键切回经典「三栏」。
3. **AI 协同起草**：点顶栏「信使」一键查新信，或在对话中让助手汇总未读与起草回复存入「草稿」（绝不越权直接发信）。
4. **核对与发送**：在「写邮件」或「草稿」中借助拼音通讯录补全收件人，核对正文与附件后确认**立即发送**或**定时发送**。

### 常用对话示例

- **汇总未读待办**：`汇总我工作邮箱里的未读重要邮件，按紧急程度列出待回复事项，先不要发送任何邮件。`
- **起草回复草稿**：`帮我针对刚才点开的这封邮件起草一封得体、简洁的回复草稿，存进草稿箱让我核对后再发。`

## 开始前要知道

- 需自备邮箱授权码、OAuth 客户端（Gmail 需自建 Desktop app）或 AgentMail API Key；如需代理可配账号 `proxy` 或 `HTTPS_PROXY`（见 [使用说明](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/USAGE.md)）。
- 定时发送需保持 DSH 运行；自动邮件任务与结果回复默认关闭。
- 详细边界见 [图文邮件、定时发送与邮件任务](docs/OUTGOING-AUTOMATION.md) 与 [邮箱操作流程](docs/MAILBOX.md)。

## 插件更新

在工作台或原生插件详情页底部检查更新。默认自动检查，**默认不自动安装**；Suite 管理的组件随整包更新。

## 文档与反馈

- [完整使用、配置与边界](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/REFERENCE.zh.md) · [更新记录](https://github.com/STARDUSTLC666/dsh-email/blob/main/CHANGELOG.md) · [验证历史](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/VALIDATION.md)
- 欢迎 Star、提交 [Issues](https://github.com/STARDUSTLC666/dsh-email/issues)（反馈请附版本与复现步骤，并移除凭据）。

## License

[MIT](https://github.com/STARDUSTLC666/dsh-email/blob/main/LICENSE)

<a id="依赖与配置"></a>
