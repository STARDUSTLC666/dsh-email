# dsh-email 验证记录

本页整理原 README 的历史验证说明，保留当时的版本、日期与范围。自动测试、启动检查、浏览器操作和真实服务验收分别记录，不能相互替代。更详细的版本验收文件仍保留在仓库中。

## 原中文记录

当前验证基线为官方发布标签源码构建的 Harness **0.2.0-rc.2**（2026-09-30）。18 个插件共同加载，99 个工具与 35 个技能的注册及输出检查通过；邮件新增多服务商隔离、卡片保存、端点错误提示、发送别名与编辑提示回归。桌面操作范围与尚未完成的真实服务验证见上文。

**0.11.0 的同载验证（2026-09-18，本地构建的 Harness `0.1.5-rc.2`，`web` profile）**：插件挂载无报错；设置路由 GET 返回 200 且响应中已无 `raw` 字段；用 `text/plain` 发 POST 被 **415** 拒绝（同源守卫在真实宿主下生效）；`application/json` 的 POST 下卡片投影正确，账号钉住 `authKind: password` 后 `authKindDeclared` 与 `authKind` 均为 `password`；设置面板实际渲染出账号卡片、8 个服务商预设的中文下拉、「认证方式」三态选择器、「应用（客户端）ID」输入格与提示、未填 ID 时的警示条（说明 `--dsw-alias-state-warn-primary` 在真实宿主下确有定义）与「登录 Microsoft 账号」按钮；浏览器控制台无报错；save 全链路可用，验证结束后已把 `accountsYaml` 还原为空、原有账号恢复。离线测试 231 项全绿。**仍未做**：真实 Outlook 租户的 OAuth2 端到端（设备码流程要真人在浏览器完成授权）与真实发信未测，`clientId` 相关路径目前只有假 authority 的用例覆盖。采用 `cordis.patch.yml` + `dsh.bundle.patch` 组合包模型。Node 要求为 22.19 及以上的 22.x，或 24 及以上。外部服务的实际业务操作需按各组件配置单独验证。

遵循官方[插件打包与安装要求](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)：ESM 入口、预构建 `lib/`、`dsh.bundle.patch` 和 `cordis.patch.yml` 配置层；显式注入所需服务，提供 JSON Schema 参数、规范化输出和渲染函数，运行时不导入宿主内部服务；配置声明使用官方 `@deepseek-ai/schemastery` 公共包。使用 Node 22.19 及以上的 22.x 或 Node 24 及以上版本；Harness 仍在快速迭代，上述版本是实测基线。

## Original English record

The current baseline is Harness **0.2.0-rc.2** built from its official release tag on 2026-09-30. All 18 plugins mount together with 99 tools and 35 skills; registration and output checks pass. New email regressions cover provider isolation, card saves, endpoint diagnostics, sender aliases and editor hints. The native UI scope and remaining live-service checks are described above.

**0.11.0 co-load verification (2026-09-18, locally built Harness `0.1.5-rc.2`, `web` profile)**: the plugin mounted without errors; the settings route answered GET with 200 and no `raw` field in the response; a `text/plain` POST was refused with **415**, proving the same-origin guard holds in the real host; under a `application/json` POST the card projection was correct, and an account pinning `authKind: password` reported both `authKindDeclared` and `authKind` as `password`; the panel actually rendered account cards, the eight provider presets with localized labels, the three-way authentication selector, the application (client) ID field with its hint, the missing-ID warning banner (so `--dsw-alias-state-warn-primary` is genuinely defined in the real host) and the Sign in with Microsoft button; the browser console was clean; save worked end to end, and afterwards `accountsYaml` was restored to empty with the original account intact. Offline tests: 231 green. **Still not done**: an end-to-end OAuth2 run against a real Outlook tenant (the device-code flow needs a human to authorize in a browser) and real sending; the `clientId` paths are covered only against a fake authority. Uses the `cordis.patch.yml` + `dsh.bundle.patch` bundle model. Node requirements are 22.19 or later within 22.x, or 24 or later. Live external-service workflows require separate configuration and validation.

On 2026-09-10, npm `dsh-email@0.10.6` passed real QQ mailbox folder/list/read/search calls, the settings page's connection test and Save & Apply, and separate SMTP authentication. An empty authorization-code field correctly used `DSH_EMAIL_PASSWORD`. This recheck did not connect to a real mailbox or send, modify or delete mail.

Follows the official [plugin packaging and installation requirements](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md): an ESM entry point, prebuilt `lib/`, `dsh.bundle.patch` and a `cordis.patch.yml` layer. The plugin explicitly injects its required services and supplies JSON Schema parameters, canonical output and rendering, without importing host-internal services; configuration uses the public `@deepseek-ai/schemastery` package. Use Node 22.19 or later within 22.x, or Node 24 or later. Harness is evolving rapidly; the version above is the tested baseline.
