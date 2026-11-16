# dsh-email 工作台 / Workbench

邮件主工作台，账号文件夹、列表与阅读分栏；草稿切页保留输入，发送仍需预览和确认。

Email workbench with folders, list and reader; drafts keep edits across tabs and sending still requires explicit review and confirmation.

## 使用 / Use

更新插件并重启 DSH，在原生左侧栏打开工作台；没有固定时可在“更多”中找到。原有“设置”入口继续可用。侧栏排序和固定由 DSH 管理。

Update the plugin, restart DSH and open its native sidebar panel (or More if it is not pinned). The existing Settings entry remains available. DSH owns sidebar order and pinning.

界面跟随宿主语言和深浅色。窄窗口先显示列表，打开邮件后可返回列表。邮件头面板展示读信接口返回的已解析信封字段。外链图片默认拦截，可为当前邮件单独允许。

The workbench follows the host language and theme. On narrow screens, open a message from the list and use Back to return. The header panel shows the parsed envelope fields supplied by the read API. External images are blocked by default and can be allowed for the open message.

写信和回复在原生弹窗中打开草稿。切换 HTML、纯文本和安全预览，保存后核对发件人、收件人、附件与发送时间，再确认发送。

Compose and reply open a draft in a native dialog. Switch between HTML, plain text and safe preview, then save and review the sender, recipients, attachments and any scheduled time before confirming.

## 源码 / Source

编辑 templates 下的工作台源码与 CSS Modules，运行 pnpm run build，并随源码提交生成的 lib/client.js。按钮、菜单与弹窗来自 DSH 0.2.2-rc.3 起提供的 ui-primitives。

Edit the workbench sources and CSS Modules in templates, run pnpm run build, and commit the generated lib/client.js with the sources. Buttons, menus and dialogs use the ui-primitives provided by DSH 0.2.2-rc.3 and later.

## 验收范围 / Validation boundary

2026-10-25：Windows、官方 DSH 0.2.1-rc.3 Web，后台 Chrome/Playwright 实际点击和输入；覆盖中英文、浅深色、1536px 与 390px、状态读回与控制台。Browser plugin 不可用，因此使用本地 Playwright。

邮件使用受控 AgentMail HTTP 服务，日历使用受控 CalDAV 协议传输；插件处理器、存储、校验和原生宿主均实际运行。未使用真实邮箱、真实日历账号或付费模型。RSS 访问 Node.js 官方公开来源。PPT 实际生成并渲染 PPTX、下载 ZIP；两个视频插件实际运行官方引擎并播放 MP4。

这些是 Web 共用界面的验收结果，不代表已验收 Electron 专属菜单、系统权限、真实账号、全部外部来源或所有可选模型/引擎。Docker、Slack、钉钉继续按用户约定搁置。
