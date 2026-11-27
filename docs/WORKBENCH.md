# dsh-email 工作台 / Workbench

邮件主工作台，默认「信桌」实体航空书信分拣台（1 键切回经典「三栏」文件夹树 / 列表 / 阅读分栏）；草稿切页保留输入，本地通讯录支持拼音与工号补全，发送仍需预览和确认。

Email workbench with default tactile Letter Desk (`Desk`, 1-click toggle back to classic `3-Pane` folder tree, list and reader); drafts keep edits across tabs, local Contacts supports pinyin/ID autocomplete, and sending still requires explicit review and confirmation.

## 使用 / Use

更新插件并重启 DSH，在原生左侧栏打开工作台；没有固定时可在“更多”中找到。原有“设置”入口继续可用。侧栏排序和固定由 DSH 管理。

Update the plugin, restart DSH and open its native sidebar panel (or More if it is not pinned). The existing Settings entry remains available. DSH owns sidebar order and pinning.

界面跟随宿主语言和深浅色，顶栏支持实时切换 **13 套明亮/柔和风格**与 **8 套中英双层字体（`字`，默认「跟随风格专属字」）**（跨插件自动同步），点击 **`? 引导`** 可交互式体验全部核心功能，点击 **「信使」** 可随时召唤互动鲸鱼娘（摸摸头三表情、查收新信与直达收件箱）。

「收发邮件」默认进入**「信桌」**视图：顶部检索条集成账号、带未读计数的文件夹树下拉、搜索、未读/附件筛选、「待阅」计数与「信桌 / 三栏」1 键切换；中间为 3 层堆叠航空信纸卡片，左滑跳过下一封、右滑展开信纸全文，点「翻面看信封头」（或按 `Space`/`F`）3D 翻转查看原始信封与服务器元数据，点「展开信纸全文」进入沉浸信纸阅读并支持回复与下载附件。切回「三栏」可浏览完整左侧折叠文件夹树与未读角标、拖动分隔线调宽及批量移入废纸篓。还可在切换器中选「列表」：保留左侧文件夹栏，中间是一行一封的 Gmail 式列表（发件人 / 主题 / 时间），没有第三栏；点开邮件后列表区域整块换成阅读页，点顶部「返回邮件列表」回到列表。切换器会记住你上次选中的视图，下次打开邮件工作台时沿用。外链图片默认拦截，可为当前邮件单独允许。

写信和回复在原生弹窗中打开草稿，To/Cc 支持本地通讯录姓名/全拼/首字母/工号补全。切换 HTML、纯文本和安全预览，保存后核对发件人、收件人、附件与发送时间，再确认发送。

The workbench follows the host language and light/dark theme, with **13 bright/soft styles** and **8 dual-layer font pairings (default: style-matched font)** synced across plugins, an interactive **`? Tour`** walkthrough, and a topbar **Courier** trigger to summon the interactive whale-girl courier anytime.

**Mailbox** opens in **Letter Desk (`Desk`)** by default: the compact top ribbon combines account & folder-tree selection (with unread counts), search, Unread/Attachments filters, remaining count, and the 1-click **Desk / 3-Pane** toggle. Drag stacked airmail Letter Cards left to skip or right to unfold full stationery, click **Envelope header** (`Space`/`F`) to 3D-flip to raw server metadata, or click **Unfold full letter** for formatted reading, replies, and attachment downloads. Switch to **3-Pane** anytime for the collapsible folder tree with unread badges, resizable split panes, and bulk Trash. The segmented toggle also offers a Gmail-style **List** view: the folder rail stays, every message is one line (sender / subject / time), there is no third pane, and opening a message replaces the list with a full-width reader plus **Back to messages**. The segmented toggle remembers the last view you picked and restores it the next time the workbench opens. External images stay blocked by default and can be allowed per message.

Compose and reply open a draft in a native dialog with local Contacts pinyin/ID autocomplete. Switch between HTML, plain text and safe preview, then save and review the sender, recipients, attachments and any scheduled time before confirming.

## 源码 / Source

编辑 templates 下的工作台源码与 CSS Modules，运行 pnpm run build，并随源码提交生成的 lib/client.js。按钮、菜单与弹窗来自 DSH 0.2.2-rc.3 起提供的 ui-primitives。

Edit the workbench sources and CSS Modules in templates, run pnpm run build, and commit the generated lib/client.js with the sources. Buttons, menus and dialogs use the ui-primitives provided by DSH 0.2.2-rc.3 and later.

## 验收范围 / Validation boundary

2026-10-25：Windows、官方 DSH 0.2.1-rc.3 Web，后台 Chrome/Playwright 实际点击和输入；覆盖中英文、浅深色、1536px 与 390px、状态读回与控制台。Browser plugin 不可用，因此使用本地 Playwright。

邮件使用受控 AgentMail HTTP 服务，日历使用受控 CalDAV 协议传输；插件处理器、存储、校验和原生宿主均实际运行。未使用真实邮箱、真实日历账号或付费模型。RSS 访问 Node.js 官方公开来源。PPT 实际生成并渲染 PPTX、下载 ZIP；两个视频插件实际运行官方引擎并播放 MP4。

这些是 Web 共用界面的验收结果，不代表已验收 Electron 专属菜单、系统权限、真实账号、全部外部来源或所有可选模型/引擎。Docker、Slack、钉钉继续按用户约定搁置。
