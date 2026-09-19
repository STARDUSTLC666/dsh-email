// NOTE（维护者请看这里）：这个文件就是插件网页端的**源码**，不经过 tsc —— 仓库里没有
// src/client.ts，`pnpm run build` 也不会重写它。改设置面板 / 鲸鱼娘弹窗请直接改这里，
// 改完用 `node --check lib/client.js` 自检（CI 里也会跑这一步）。
window.__ModuleLoader__.load({ id: "dsh-email", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const React = require("react");
const { useState, useEffect, useCallback, useRef } = React;
const h = React.createElement;

const ROUTE = "/_dsh/dsh-email/settings";
/** 「编辑即保存」的防抖窗口：连续打字只落一次盘。 */
const SAVE_DEBOUNCE_MS = 800;

async function api(action, payload) {
  const init = action === undefined
    ? { credentials: "same-origin" }
    : {
        credentials: "same-origin",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ action }, payload)),
      };
  const res = await fetch(ROUTE, init);
  const body = await res.json();
  if (!res.ok || !body.ok) {
    const error = new Error((body && body.error && body.error.message) || ("request failed " + res.status));
    // Callers branch on these: a revision conflict is retryable after a rebase,
    // anything else is not, and the message alone cannot tell them apart.
    error.code = body && body.error ? body.error.code : undefined;
    error.status = res.status;
    throw error;
  }
  return body.value;
}

/**
 * 登录失败的文案：平铺的 message 优先，退回 error.message，再退回调用方给的兜底。
 */
function oauthErrorMessage(body, fallback) {
  if (body && typeof body.message === "string" && body.message !== "") return body.message;
  if (body && body.error && typeof body.error.message === "string" && body.error.message !== "") return body.error.message;
  return fallback;
}

/**
 * 只发请求、拆出 OAuth2 的契约体。
 *
 * 两个 action 的语义就在 { ok, status } 上，不是「成功即 value」，所以不能走那个
 * 会抛的 api()。而且信封有两种，必须都认：
 *   - 后端实际发的是和其它 action 一致的信封 { ok:true, value:{ status, url… } }；
 *     抛错时是 HTTP 400 + { ok:false, error:{ message } }。
 *   - 契约本身写成平铺的 { ok:true, status… } / { ok:false, message }。
 * 归一化成同一个平铺结构再交给调用方，调用方就不用管信封了。
 * 网络/非 JSON 响应仍照抛，由调用方兜成一条可重试的错误。
 */
async function apiOauth(action, payload) {
  const res = await fetch(ROUTE, {
    credentials: "same-origin",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.assign({ action }, payload)),
  });
  const body = await res.json();
  if (body === null || typeof body !== "object") return { ok: false, message: t("oauth.badResponse") };
  // 信封里的 value 才是契约体；平铺时就整个 body 当契约体（value 缺失即此情形）。
  const inner = body.value !== null && body.value !== undefined && typeof body.value === "object" ? body.value : body;
  if (body.ok === false) {
    return { ok: false, message: oauthErrorMessage(body) || oauthErrorMessage(inner) || t("oauth.loginFailed") };
  }
  // 契约体自己也可能说 ok:false（contract 的 { ok:false, message } 形态），它的字段优先。
  return Object.assign({ ok: true }, inner);
}

/**
 * 组装要落盘的完整 value：整份表单 + 当前有效的 accountsYaml，maxBodyChars 缺省
 * 20000。provider/user/password/inboxFolder 已经不在页面上编辑（账号都在卡片里、
 * 只存服务商 id），但它们仍随 value 原样带着 —— 后端 resolveEmailSettings 要拿它们
 * 做默认账号兜底。imap/smtp 同理只是随行，端点由预设展开，这里不再定型端口。
 */
function settingsValueOf(draft, accountsYaml) {
  if (draft === null || draft === undefined) return null;
  return {
    ...draft,
    accountsYaml: typeof accountsYaml === "string" ? accountsYaml : "",
    maxBodyChars: typeof draft.maxBodyChars === "number" ? draft.maxBodyChars : 20000,
  };
}

/**
 * 「这份草稿是否已经落过盘」的签名：和最近一次成功保存的签名比对，一样就跳过。
 * 加载完、保存成功后都会对齐，所以「编辑即保存」不会变成「一动就存」。
 */
function signatureOf(draft, accountsYaml) {
  const value = settingsValueOf(draft, accountsYaml);
  return value === null ? "" : JSON.stringify(value);
}

/**
 * 内置服务商：[值, 文案 key]。这里刻意存 key 而不是译文本体 —— 这张表在模块初始化
 * 时求值，那时 UI 字典还没建立；取文案一律走 t(entry[1])，只发生在渲染期。
 */
const PROVIDERS = [
  ["qq", "provider.qq"],
  ["163", "provider.163"],
  ["126", "provider.126"],
  ["sina", "provider.sina"],
  ["aliyun", "provider.aliyun"],
  ["gmail", "provider.gmail"],
  ["outlook", "provider.outlook"],
  ["icloud", "provider.icloud"],
];

const EMPTY = {
  provider: "",
  user: "",
  password: "",
  inboxFolder: "INBOX",
  sendApproval: true,
  downloadDir: "",
  accountsYaml: "",
  serverPresets: "",
  imap: { host: "", port: 993, secure: true },
  smtp: { host: "", port: 465, secure: true },
};

/**
 * 走 OAuth2 的服务商（后端 authKind === 'oauth2' 的同一份名单）。这张表只是
 * 「还没保存、卡片数据没回来」时的本地预判：新选一个 provider，快照要等下一次
 * reload 才会说它是不是 oauth2，本地按名字先切成登录区，免得先让用户看到一个
 * 密码框、存完再变成登录按钮。
 */
const OAUTH2_PROVIDERS = ["outlook"];
/** 兜底轮询间隔：后端没给 interval 时按 5 秒问一次。 */
const OAUTH_POLL_FALLBACK_MS = 5000;
/** 后端返回的 expires_in 缺省是秒；缺省值取 15 分钟（和设备的码同寿）。 */
const OAUTH_EXPIRES_FALLBACK_S = 900;



const CSS = [
  ".dshe-settings{display:grid;gap:14px;padding:8px 2px 32px;color:var(--dsw-alias-label-primary,#26231f);color-scheme:light dark}",
  ".dshe-header{display:grid;gap:4px;padding:8px 2px}",
  ".dshe-header h2{font-size:22px;letter-spacing:-.02em;margin:0}",
  ".dshe-header p{max-width:640px;margin:4px 0 0;color:var(--dsw-alias-label-tertiary,#77736d);font-size:13px;line-height:1.55}",
  ".dshe-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--dsw-alias-state-business-primary,#0b6c9f);font-weight:700}",
  ".dshe-panel{display:grid;gap:12px;padding:15px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);border-radius:14px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 1px 1px rgba(0,0,0,.02)}",
  ".dshe-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
  ".dshe-field{display:grid;gap:6px}",
  ".dshe-field label{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary,#26231f)}",
  ".dshe-field input[type=text],.dshe-field input[type=password],.dshe-field input[type=number],.dshe-field select,.dshe-field textarea{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);border-radius:9px;background:var(--dsw-specific-input-major,#fff);color:var(--dsw-alias-label-primary,#26231f);font:inherit;font-size:13px}",
  ".dshe-field select option{background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#26231f)}",
  ".dshe-check{display:flex;gap:8px;align-items:center;font-size:13px}",
  ".dshe-global{display:grid;gap:10px;padding:11px 12px;border:1px dashed var(--dsw-alias-border-l2,#dedbd5);border-radius:11px}",
  ".dshe-actions{display:flex;gap:8px;flex-wrap:wrap}",
  ".dshe-btn{display:inline-flex;align-items:center;height:32px;padding:0 14px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);background:var(--dsw-alias-button-elevated-fill,transparent);color:inherit;font-size:13px;font-weight:600;cursor:pointer}",
  ".dshe-btn.primary{background:var(--dsw-alias-button-primary-fill,#0b6c9f);border-color:var(--dsw-alias-button-primary-fill,#0b6c9f);color:var(--dsw-alias-label-primary-foreground,#fff)}",
  ".dshe-btn.primary:hover{background:var(--dsw-alias-button-primary-hover,#0b6c9f);border-color:var(--dsw-alias-button-primary-hover,#0b6c9f)}",
  ".dshe-btn:disabled{opacity:.55;cursor:default}",
  ".dshe-alert{padding:10px 12px;border-radius:10px;font-size:12px;line-height:1.5;border:1px solid transparent}",
  ".dshe-alert.error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 10%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 22%,transparent);color:var(--dsw-alias-state-error-primary,#aa3939)}",
  ".dshe-alert.success{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 10%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 22%,transparent);color:var(--dsw-alias-state-success-primary,#267d52)}",
  ".dshe-alert.info{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#0b5c86) 8%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#0b5c86) 20%,transparent);color:var(--dsw-alias-state-business-primary,#0b5c86)}",
  ".dshe-alert.warn{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#9a6700) 10%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#9a6700) 22%,transparent);color:var(--dsw-alias-state-warn-primary,#9a6700)}",
  ".dshe-details summary{font-size:12px;font-weight:600;cursor:pointer;color:var(--dsw-alias-label-tertiary,#77736d)}",
  ".dshe-hint{font-size:12px;color:var(--dsw-alias-label-tertiary,#77736d);line-height:1.5}",
  ".dshe-whale-root{position:fixed;right:20px;bottom:20px;z-index:2147483000;pointer-events:none}",
  ".dshe-whale-card{pointer-events:auto;position:relative;width:300px;border:1px solid var(--dsw-alias-border-l2,#e5e2db);border-radius:14px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:var(--dsw-elevation-prominent,0 8px 24px rgba(0,0,0,.18));overflow:hidden;animation:dshe-whale-in .35s ease-out;font-size:13px;color:var(--dsw-alias-label-primary,#26231f);color-scheme:light dark}",
  "@keyframes dshe-whale-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}",
  ".dshe-whale-img{display:block;width:100%;height:120px;object-fit:cover;object-position:center top;background:var(--dsw-alias-bg-layer-2,#eaf3f8)}",
  ".dshe-whale-body{padding:10px 12px 12px;display:grid;gap:6px}",
  ".dshe-whale-title{font-weight:700;font-size:13px}",
  ".dshe-whale-item{color:var(--dsw-alias-label-tertiary,#77736d);font-size:12px;line-height:1.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".dshe-whale-credit{font-size:10px;color:var(--dsw-alias-label-tertiary,#77736d);opacity:.8;line-height:1.4}",
  ".dshe-whale-close{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;border:none;background:var(--dsw-alias-bg-mask-3,rgba(0,0,0,.35));color:var(--dsw-alias-label-primary-inverted,#fff);cursor:pointer;font-size:12px;line-height:1}",
  ".dshe-acc-list{display:grid;gap:10px}",
  ".dshe-acc-card{display:grid;gap:9px;padding:11px 12px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);border-radius:11px;background:var(--dsw-alias-bg-layer-2,#f7f6f2)}",
  ".dshe-acc-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center}",
  ".dshe-acc-name{font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".dshe-acc-badge{display:inline-flex;align-items:center;height:18px;padding:0 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);font-size:10px;font-weight:700;color:var(--dsw-alias-state-business-primary,#0b5c86)}",
  ".dshe-acc-badge.todo{border-style:dashed;color:inherit;opacity:.75}",
  ".dshe-acc-badge.is-default{border-color:transparent;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 12%,transparent);color:var(--dsw-alias-state-success-primary,#267d52)}",
  ".dshe-acc-meta{font-size:12px;opacity:.72;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".dshe-acc-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-left:auto}",
  ".dshe-acc-danger{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 38%,transparent);color:var(--dsw-alias-state-error-primary,#aa3939)}",
  ".dshe-acc-body{display:grid;gap:12px;padding-top:2px}",
  ".dshe-acc-confirm{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 10px;border-radius:10px;font-size:12px;line-height:1.5;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 22%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 10%,transparent);color:var(--dsw-alias-state-error-primary,#aa3939)}",
  ".dshe-acc-empty{padding:12px;border:1px dashed var(--dsw-alias-border-l2,#dedbd5);border-radius:11px;font-size:12px;text-align:center;opacity:.72}",
  ".dshe-acc-warn{color:var(--dsw-alias-state-error-primary,#aa3939)}",
  ".dshe-prst-list{display:grid;gap:10px}",
  ".dshe-prst-card{display:grid;gap:9px;padding:11px 12px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);border-radius:11px;background:var(--dsw-alias-bg-layer-2,#f7f6f2)}",
  ".dshe-prst-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center}",
  ".dshe-prst-name{font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".dshe-prst-badge{display:inline-flex;align-items:center;height:18px;padding:0 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);font-size:10px;font-weight:700;color:var(--dsw-alias-state-business-primary,#0b5c86)}",
  ".dshe-prst-badge.todo{border-style:dashed;color:inherit;opacity:.75}",
  ".dshe-prst-badge.done{border-color:transparent;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 12%,transparent);color:var(--dsw-alias-state-success-primary,#267d52)}",
  ".dshe-prst-meta{font-size:12px;opacity:.72;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".dshe-prst-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-left:auto}",
  ".dshe-prst-danger{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 38%,transparent);color:var(--dsw-alias-state-error-primary,#aa3939)}",
  ".dshe-prst-body{display:grid;gap:12px;padding-top:2px}",
  ".dshe-prst-confirm{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 10px;border-radius:10px;font-size:12px;line-height:1.5;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 22%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 10%,transparent);color:var(--dsw-alias-state-error-primary,#aa3939)}",
  ".dshe-prst-empty{padding:12px;border:1px dashed var(--dsw-alias-border-l2,#dedbd5);border-radius:11px;font-size:12px;text-align:center;opacity:.72}",
  ".dshe-prst-warn{color:var(--dsw-alias-state-error-primary,#aa3939)}",
  ".dshe-prst-section{margin-top:4px}",
  ".dshe-auto-status{font-size:12px;font-weight:600;align-self:center;color:var(--dsw-alias-label-tertiary,#77736d)}",
  ".dshe-auto-status.is-saved{color:var(--dsw-alias-state-success-primary,#267d52)}",
  ".dshe-auto-status.is-error{color:var(--dsw-alias-state-error-primary,#aa3939)}",
  ".dshe-acc-badge.is-oauth{border-color:transparent;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 12%,transparent);color:var(--dsw-alias-state-success-primary,#267d52)}",
  ".dshe-oauth{display:grid;gap:8px;padding:10px 11px;border:1px dashed var(--dsw-alias-border-l2,#dedbd5);border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff)}",
  ".dshe-oauth.is-logged-in{border-style:solid;border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 34%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 8%,transparent)}",
  ".dshe-oauth-head{font-size:12px;font-weight:600;line-height:1.5}",
  ".dshe-oauth-ok{color:var(--dsw-alias-state-success-primary,#267d52)}",
  ".dshe-oauth-wait{font-size:12px;color:var(--dsw-alias-label-tertiary,#77736d)}",
  ".dshe-oauth-code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:20px;font-weight:700;letter-spacing:.14em;padding:8px 10px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);background:var(--dsw-alias-bg-layer-2,#f7f6f2);text-align:center;user-select:all;overflow-wrap:anywhere}",
  ".dshe-oauth-url{font-size:12px;line-height:1.5;overflow-wrap:anywhere}",
  ".dshe-oauth-url a{color:var(--dsw-alias-state-business-primary,#0b5c86)}",
  ".dshe-oauth-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}",
].join("\n");

// ---------------------------------------------------------------------------
// 界面文案字典。zh 是原文，en 是对照译文；两张表的 key 集必须逐键相同。
//
// 几条规矩，改文案时照做：
//   - key 是「区域.名字」的短标识，跟文案内容无关，改文案不动 key；
//   - 占位符写成 {name}，由 t() 做字面替换。**替换是字面量级的**，所以一条文案里
//     的 {x} 顺序由这条文案自己决定（中英文语序不同也不需要动调用点）；
//   - key 不存在时 t() 原样返回 key —— 界面上会直接露出 'card.add' 这样的字符串，
//     这是故意的：漏译要看得见，不能静默变成空字符串。
//   - 全角空格一律写成 \u3000，别在这份字典里直接敲。
// ---------------------------------------------------------------------------
var UI = {
  zh: {
    // 通用
    "common.cancel": "取消",
    "common.retry": "重试",
    "common.delete": "删除",
    "common.edit": "编辑",
    "common.collapse": "收起",
    "common.confirmDelete": "确认删除",
    "common.loading": "加载中…",
    "common.listSeparator": "、",

    // 导航 / 段标题
    "nav.title": "邮件 (dsh-email)",
    "section.title": "邮件",
    "section.intro": "在这里配置邮箱账号，即可使用 10 个 email_* 工具。每个账号只记服务商与凭证，端点在连接时从服务器预设展开；改动自动保存、立即生效。",
    "section.readonly": "当前 settings 存储是只读的，只能查看不能保存。",
    "section.activeAccounts": "当前生效账号：{accounts}",

    // 内置服务商名（PROVIDERS 里存的就是这些 key）
    "provider.qq": "QQ 邮箱",
    "provider.163": "163 邮箱",
    "provider.126": "126 邮箱",
    "provider.sina": "新浪邮箱",
    "provider.aliyun": "阿里邮箱",
    "provider.gmail": "Gmail",
    "provider.outlook": "Outlook",
    "provider.icloud": "iCloud",
    "provider.custom": "自定义",
    "provider.noneInYaml": "（YAML 未指定服务商）",
    "provider.undefinedPresetSuffix": "（未定义预设）",

    // 全局设置
    "global.sendApproval": "发信前弹确认（强烈建议保留；Full Access 模式下会被自动拒绝）",
    "global.downloadDirLabel": "附件下载目录（默认 $DSH_HOME/email-downloads）",
    "global.downloadDirPlaceholder": "留空使用默认",
    "global.hint": "以上两项对所有账号统一生效。",

    // 自动保存状态条
    "status.saved": "已保存",
    "status.saving": "保存中…",
    "status.saveFailed": "保存失败：{message}（点击重试）",

    // 账号卡片
    "card.add": "+ 添加账号",
    "card.empty": "还没有账号。点「+ 添加账号」新增一个。",
    "card.unnamed": "（未命名）",
    "card.noAddress": "（未填邮箱地址）",
    "card.meta": "{address} · {folder} · {provider}",
    "card.noProvider": "未选服务商",
    "card.defaultBadge": "默认",
    "card.defaultAccount": "默认账号",
    "card.setDefault": "设为默认",
    "card.setDefaultAs": "设为默认：{name}",
    "card.incomplete": "未完成",
    "card.renamedBadge": "改名 → 按新名保存",
    "card.notLoggedIn": "未登录",
    "card.loggedInAs": "已登录 {user}",
    "card.testConnect": "测试连接",
    "card.testing": "测试中…",
    "card.testOk": "连接成功（{ms} ms）· {host}:{port}",
    "card.testFailed": "连接失败：{message}",
    "card.pickDefault": "配置了多个账号，请设置默认账号：",
    "card.errNoName": "有账号还没填账号名，这份改动先不保存。",
    "card.errNoProvider": "有账号还没选服务商，这份改动先不保存。",
    "card.errDuplicateName": "已经有同名账号了，改名会覆盖掉它，这份改动先不保存。",
    "card.errReservedName": "账号名不能是 defaultAccount（该键保留给默认账号），这份改动先不保存。",
    "card.errNoDefault": "有多个账号还没指定默认账号，这份改动先不保存。",
    "card.yamlParseFailed": "accountsYaml 解析失败：{error}",
    "card.confirmDelete": "删除账号「{name}」会在保存后从 YAML 里移除，已存密码一并丢失。",
    "card.nameLabel": "账号名（工具调用的 account 参数）",
    "card.nameHint": "不能叫 defaultAccount（该键保留给默认账号）。改名会删旧键、建新键。",
    "card.reservedNameWarn": "defaultAccount 是保留键（表示默认账号），请换一个名字。",
    "card.providerLabel": "服务商",
    "card.addressLabel": "邮箱地址",
    "card.authKindLabel": "认证方式",
    "card.authKindAuto": "自动（按服务商判断）",
    "card.authKindOAuth2": "OAuth2 设备码登录",
    "card.authKindPassword": "密码 / 授权码",
    "card.authKindHint": "默认按服务商判断。仍能用应用密码连 Exchange Online 的租户（混合或本地部署、SMTP AUTH 未关闭）选「密码 / 授权码」；改动后请重新「测试连接」。",
    "card.passwordLabel": "授权码 / 应用专用密码",
    "card.passwordPlaceholder": "留空保持不变",
    "card.passwordSaved": "已存有授权码：留空保持不变，清空后填内容即覆盖。",
    "card.passwordHint": "留空即不写入 password 键。",
  "card.senderNameLabel": "发件显示名（可选）",
  "card.senderNamePlaceholder": "只影响收件人看到的名称",
  "card.senderNameHint": "只改收件人看到的显示名，发件地址仍是上面的邮箱地址。",
  "card.authUserLabel": "登录账号（与邮箱地址不同时填）",
  "card.authUserPlaceholder": "留空 = 用上面的邮箱地址登录",
  "card.authUserHint": "别名或中继场景：上面填信件发出的地址，这里填真正用于 IMAP/SMTP 登录的账号。留空即与邮箱地址相同。",
  "card.authPasswordLabel": "登录账号的密码（可选）",
  "card.authPasswordSaved": "已存有登录密码：留空保持不变，清空后填内容即覆盖。",
  "card.authPasswordHint": "留空即沿用上面那栏的授权码 / 应用专用密码；只有登录账号与邮箱地址不同、且密码也不一样时才需要单独填。",
    "card.inboxLabel": "收件文件夹（默认 INBOX）",
    "card.autoSaveHint": "改动会自动保存。",
    "card.autoSaveHintNoDefault": " 现在有多个账号但没有默认账号，必须先指定一个。",
    "card.builtinEndpoints": " · {imap} ｜ {smtp}",
    "card.customEndpoint": " · {endpoint}",

    // OAuth2 登录区
    "oauth.clientIdLabel": "应用（客户端）ID",
    "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "oauth.clientIdHint": "留空即用插件内置的社区应用（免费、开箱即用）：微软同意屏上显示的是贡献者的应用名，登录日志也归到对方租户。想换成自己的 Azure（Entra）公共客户端 ID（需勾选 IMAP/SMTP 委托权限并开启设备码流）就填进来，改动它需要重新登录。",
    "oauth.clientIdMissing": "当前构建没有内置应用（客户端）ID，设备码登录无法开始：按 README 的「Outlook OAuth2」一节注册一个，填进来即可。",
    "oauth.clientIdBuiltIn": "将使用插件内置的社区应用：{id}（贡献者 gurio-wine 注册并授权本项目内置使用）。企业策略不接受第三方应用时，请换成自己的。",
    "oauth.passwordless": "这个服务商使用 OAuth2 授权，不需要密码{label}。",
    "oauth.passwordlessLabel": "（{label}）",
    "oauth.signIn.outlook": "登录 Microsoft 账号",
    "oauth.signIn.generic": "登录 {provider} 账号",
    "oauth.requestingCode": "正在获取授权码…",
    "oauth.signingIn": "登录中…",
    "oauth.reLogin": "重新登录",
    "oauth.pendingHint": "在浏览器打开下面的地址，输入代码完成授权：",
    "oauth.noUrl": "（后端没有返回授权地址，请点取消后重试）",
    "oauth.polling": "轮询中…（每 {seconds} 秒检查一次，授权链接约 {minutes} 分钟内有效）",
    "oauth.loggedInAs": "已登录：{user}",
    "oauth.unknownUser": "（未知账号）",
    "oauth.loginOk": "登录成功。",
    "oauth.loginOkAs": "登录成功：{user}",
    "oauth.loginFailed": "登录失败",
    "oauth.badResponse": "服务端返回了无法识别的响应",

    // 服务器预设
    "preset.sectionTitle": "服务器预设（自定义服务商，高级）",
    "preset.add": "+ 添加预设",
    "preset.empty": "还没有自定义服务器预设。点「+ 添加预设」，账号卡片的服务商下拉里就会多出这个名字。",
    "preset.cleared": "卡片已清空：填完剩下的字段即会写回，删除全部 {count} 条预设。",
    "preset.badgeUnnamed": "未命名",
    "preset.badgeRenamed": "改名 → 删旧建新",
    "preset.badgeDuplicate": "重名",
    "preset.noHost": "（未填主机）",
    "preset.endpointMissing": "端点未填",
    "preset.metaImap": "imap {host}:{port}",
    "preset.metaSmtp": " ｜ smtp {host}:{port}",
    "preset.ssl": " · SSL",
    "preset.plain": " · 明文",
    "preset.confirmDelete": "删除预设「{name}」后，指向它的账号卡片会失去端点（服务商下拉里也不再列出它）。",
    "preset.nameLabel": "预设名（serverPresets 的键，也是账号 provider 的值）",
    "preset.nameHint": "不能和内置服务商同名（qq/163/126/sina/aliyun/gmail/outlook/icloud）—— 那会被内置预设挡住。改名会删旧键、建新键。",
    "preset.duplicateWarn": "已经有同名预设了：预设名是 YAML 的键，必须唯一。",
    "preset.labelLabel": "显示名 label（可选）",
    "preset.labelPlaceholder": "公司邮箱",
    "preset.imapHostLabel": "IMAP 主机",
    "preset.imapPortLabel": "IMAP 端口",
    "preset.imapPortHint": "留空即用默认 993。",
    "preset.imapSsl": "IMAP SSL",
    "preset.smtpHostLabel": "SMTP 主机",
    "preset.smtpPortLabel": "SMTP 端口",
    "preset.smtpPortHint": "留空即用默认 465。",
    "preset.smtpSsl": "SMTP SSL（587 端口请取消勾选）",
    "preset.portProblem": "{problem}。",
    "preset.yamlParseFailed": "serverPresets 解析失败：{error}",
    "preset.yamlParseFailedHint": "下面的卡片是从快照里的（空）预设表建的，不代表这份文本。可以直接改下面的 YAML 重新写一份。",
    "preset.footerHint": "预设不含邮箱地址和授权码，只记连接参数；账号只存服务商名，端点在连接时从预设展开。",
    "preset.portNumeric": "端口必须是数字",
    "preset.portRange": "端口必须在 1-65535 之间",
    "preset.errNoName": "有预设还没填名称（预设名就是 YAML 的键）。",
    "preset.errDuplicate": "有两张预设卡都叫「{name}」：预设名是 YAML 的键，不能重名。",
    "preset.errNoImapHost": "预设「{name}」还没填 IMAP 主机。",
    "preset.errNoSmtpHost": "预设「{name}」还没填 SMTP 主机。",
    "preset.errImapPort": "预设「{name}」的 IMAP {problem}。",
    "preset.errSmtpPort": "预设「{name}」的 SMTP {problem}。",

    // 卡片级提示
    "notice.commentsDropped": "原文档无法就地编辑，注释已丢失；",
    "notice.passwordsDropped": "有账号的已存密码无法保留，请在对应卡片重输；",
    "notice.restSaved": "其余改动已自动保存。",
    "notice.cardsNotWritten": "账号改动没能写进 YAML：{message}",

    // 鲸鱼娘弹窗
    "whale.title": "鲸鱼娘递信：有 {count} 封新邮件",
    "whale.unknownSender": "(未知)",
    "whale.noSubject": "(无主题)",
    "whale.row": "{who} · {subject}",
    "whale.more": "…其余 {count} 封，用 email_watch / email_read 查看",
    "whale.close": "关闭",
  },

  // 与 zh 逐键对照。技术名词（IMAP/SMTP/OAuth2/INBOX/SSL/YAML、键名与预设名）原样保留；
  // 占位符逐键与 zh 相同，语序按英文自己排。
  en: {
    // 通用
    "common.cancel": "Cancel",
    "common.retry": "Retry",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.collapse": "Collapse",
    "common.confirmDelete": "Confirm delete",
    "common.loading": "Loading…",
    "common.listSeparator": ", ",

    // 导航 / 段标题
    "nav.title": "Email (dsh-email)",
    "section.title": "Email",
    "section.intro": "Configure mailbox accounts here to use the ten email_* tools. An account stores only its provider and credentials; endpoints are expanded from the server preset at connect time. Changes save automatically and take effect at once.",
    "section.readonly": "The settings store is read-only right now: you can view the settings but not save them.",
    "section.activeAccounts": "Active accounts: {accounts}",

    // 内置服务商名（PROVIDERS 里存的就是这些 key）
    "provider.qq": "QQ Mail",
    "provider.163": "163 Mail",
    "provider.126": "126 Mail",
    "provider.sina": "Sina Mail",
    "provider.aliyun": "Alibaba Mail",
    "provider.gmail": "Gmail",
    "provider.outlook": "Outlook",
    "provider.icloud": "iCloud",
    "provider.custom": "Custom",
    "provider.noneInYaml": "(no provider in YAML)",
    "provider.undefinedPresetSuffix": "(undefined preset)",

    // 全局设置
    "global.sendApproval": "Ask for confirmation before sending (strongly recommended; auto-denied under Full Access)",
    "global.downloadDirLabel": "Attachment download directory (defaults to $DSH_HOME/email-downloads)",
    "global.downloadDirPlaceholder": "Leave empty for the default",
    "global.hint": "These two settings apply to every account.",

    // 自动保存状态条
    "status.saved": "Saved",
    "status.saving": "Saving…",
    "status.saveFailed": "Save failed: {message} (click to retry)",

    // 账号卡片
    "card.add": "+ Add account",
    "card.empty": "No accounts yet. Click “+ Add account” to create one.",
    "card.unnamed": "(unnamed)",
    "card.noAddress": "(no email address)",
    "card.meta": "{address} · {folder} · {provider}",
    "card.noProvider": "No provider",
    "card.defaultBadge": "Default",
    "card.defaultAccount": "Default account",
    "card.setDefault": "Set as default",
    "card.setDefaultAs": "Set as default: {name}",
    "card.incomplete": "Incomplete",
    "card.renamedBadge": "Renamed → saves under the new name",
    "card.notLoggedIn": "Not signed in",
    "card.loggedInAs": "Signed in as {user}",
    "card.testConnect": "Test connection",
    "card.testing": "Testing…",
    "card.testOk": "Connected ({ms} ms) · {host}:{port}",
    "card.testFailed": "Connection failed: {message}",
    "card.pickDefault": "Several accounts are configured; choose the default account:",
    "card.errNoName": "An account has no name yet; this change will not be saved.",
    "card.errNoProvider": "An account has no provider selected; this change will not be saved.",
    "card.errDuplicateName": "Another account already has that name; renaming would overwrite it, so this change will not be saved.",
    "card.errReservedName": "An account cannot be named defaultAccount (that key is reserved for the default account); this change will not be saved.",
    "card.errNoDefault": "Several accounts exist but no default account was chosen; this change will not be saved.",
    "card.yamlParseFailed": "accountsYaml failed to parse: {error}",
    "card.confirmDelete": "Deleting account “{name}” removes it from the YAML once saved, and its stored password is lost with it.",
    "card.nameLabel": "Account name (the account argument of tool calls)",
    "card.nameHint": "Cannot be defaultAccount (that key is reserved for the default account). Renaming deletes the old key and creates a new one.",
    "card.reservedNameWarn": "defaultAccount is a reserved key (it means the default account); pick another name.",
    "card.providerLabel": "Provider",
    "card.addressLabel": "Email address",
    "card.authKindLabel": "Authentication",
    "card.authKindAuto": "Automatic (decided by the provider)",
    "card.authKindOAuth2": "OAuth2 device-code login",
    "card.authKindPassword": "Password / app password",
    "card.authKindHint": "Decided by the provider by default. Choose「Password / app password」for a tenant that still accepts basic auth against Exchange Online (hybrid or on-premises, SMTP AUTH left enabled); re-run「Test connection」after changing it.",
    "card.passwordLabel": "Authorization code / app password",
    "card.passwordPlaceholder": "Leave empty to keep it",
    "card.passwordSaved": "A password is already stored: leave empty to keep it, or clear the field and type to overwrite.",
    "card.passwordHint": "Leave it empty and the password key is not written.",
  "card.senderNameLabel": "Sender display name (optional)",
  "card.senderNamePlaceholder": "Only the name recipients see",
  "card.senderNameHint": "Changes only the name recipients see; the address stays the one above.",
  "card.authUserLabel": "Login user (when it differs from the address)",
  "card.authUserPlaceholder": "Empty = log in with the address above",
  "card.authUserHint": "Alias or relay: the address above is what mail is sent from, this is the account IMAP/SMTP authenticates. Empty means they are the same.",
  "card.authPasswordLabel": "Password for the login user (optional)",
  "card.authPasswordSaved": "A login password is stored: leave it empty to keep it, or type to replace it.",
  "card.authPasswordHint": "Leave empty to reuse the authorization code / app password above; only needed when the login user has a password of its own.",
    "card.inboxLabel": "Inbox folder (default INBOX)",
    "card.autoSaveHint": "Changes save automatically.",
    "card.autoSaveHintNoDefault": " There are several accounts but no default account yet; you must pick one first.",
    "card.builtinEndpoints": " · {imap} | {smtp}",
    "card.customEndpoint": " · {endpoint}",

    // OAuth2 登录区
    "oauth.clientIdLabel": "Application (client) ID",
    "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "oauth.clientIdHint": "Leave this empty to log in with the plugin's built-in community application (free, nothing to set up): the Microsoft consent screen names the contributor's app and the sign-in logs land in their tenant. Paste your own Azure (Entra) public client ID here (with the IMAP/SMTP delegated permissions and the device-code flow enabled) to use that instead; changing it requires signing in again.",
    "oauth.clientIdMissing": "This build carries no built-in application (client) ID, so the device-code login cannot start: register one as described in the README's「Outlook OAuth2」section and paste it here.",
    "oauth.clientIdBuiltIn": "Signing in through the plugin's built-in community application: {id} (registered by contributor gurio-wine, used with permission). Use your own application if third-party apps are not allowed.",
    "oauth.passwordless": "This provider authorizes over OAuth2, so no password is needed{label}.",
    "oauth.passwordlessLabel": " ({label})",
    "oauth.signIn.outlook": "Sign in with Microsoft",
    "oauth.signIn.generic": "Sign in to {provider}",
    "oauth.requestingCode": "Requesting a code…",
    "oauth.signingIn": "Signing in…",
    "oauth.reLogin": "Sign in again",
    "oauth.pendingHint": "Open the address below in your browser and enter the code to finish authorizing:",
    "oauth.noUrl": "(the backend returned no authorization URL; cancel and try again)",
    "oauth.polling": "Waiting… (checking every {seconds} seconds; the authorization link stays valid for about {minutes} minutes)",
    "oauth.loggedInAs": "Signed in: {user}",
    "oauth.unknownUser": "(unknown account)",
    "oauth.loginOk": "Signed in.",
    "oauth.loginOkAs": "Signed in: {user}",
    "oauth.loginFailed": "Sign-in failed",
    "oauth.badResponse": "The server returned a response we do not recognize",

    // 服务器预设
    "preset.sectionTitle": "Server presets (custom providers, advanced)",
    "preset.add": "+ Add preset",
    "preset.empty": "No custom server presets yet. Click “+ Add preset” and the name shows up in the provider dropdown of the account cards.",
    "preset.cleared": "Cards cleared: finish the remaining fields and it is written back, deleting all {count} presets.",
    "preset.badgeUnnamed": "Unnamed",
    "preset.badgeRenamed": "Renamed → old key deleted, new one created",
    "preset.badgeDuplicate": "Duplicate",
    "preset.noHost": "(no host)",
    "preset.endpointMissing": "No endpoint",
    "preset.metaImap": "imap {host}:{port}",
    "preset.metaSmtp": " | smtp {host}:{port}",
    "preset.ssl": " · SSL",
    "preset.plain": " · plain",
    "preset.confirmDelete": "Deleting preset “{name}” leaves the account cards pointing at it without endpoints (and it is no longer listed in the provider dropdown).",
    "preset.nameLabel": "Preset name (the serverPresets key, also the account's provider value)",
    "preset.nameHint": "Cannot collide with a built-in provider (qq/163/126/sina/aliyun/gmail/outlook/icloud) — the built-in preset would shadow it. Renaming deletes the old key and creates a new one.",
    "preset.duplicateWarn": "A preset with this name already exists: preset names are YAML keys and must be unique.",
    "preset.labelLabel": "Display label (label key, optional)",
    "preset.labelPlaceholder": "Work email",
    "preset.imapHostLabel": "IMAP host",
    "preset.imapPortLabel": "IMAP port",
    "preset.imapPortHint": "Leave empty to use the default 993.",
    "preset.imapSsl": "IMAP SSL",
    "preset.smtpHostLabel": "SMTP host",
    "preset.smtpPortLabel": "SMTP port",
    "preset.smtpPortHint": "Leave empty to use the default 465.",
    "preset.smtpSsl": "SMTP SSL (uncheck it for port 587)",
    "preset.portProblem": "{problem}.",
    "preset.yamlParseFailed": "serverPresets failed to parse: {error}",
    "preset.yamlParseFailedHint": "The cards below were built from the (empty) preset table in the snapshot, not from this text. Edit the YAML below to write a new one from scratch.",
    "preset.footerHint": "A preset carries no email address and no password, only connection parameters; an account stores just the provider name and expands its endpoints from the preset when it connects.",
    "preset.portNumeric": "The port must be a number",
    "preset.portRange": "The port must be between 1 and 65535",
    "preset.errNoName": "A preset has no name yet (the preset name is the YAML key).",
    "preset.errDuplicate": "Two preset cards are both named “{name}”: preset names are YAML keys and must be unique.",
    "preset.errNoImapHost": "Preset “{name}” has no IMAP host yet.",
    "preset.errNoSmtpHost": "Preset “{name}” has no SMTP host yet.",
    "preset.errImapPort": "Preset “{name}” has an invalid IMAP port: {problem}.",
    "preset.errSmtpPort": "Preset “{name}” has an invalid SMTP port: {problem}.",

    // 卡片级提示
    "notice.commentsDropped": "Comments were dropped: the original document cannot be edited in place. ",
    "notice.passwordsDropped": "Some stored passwords could not be kept; re-enter them on the matching cards. ",
    "notice.restSaved": "Everything else was saved automatically.",
    "notice.cardsNotWritten": "The account changes could not be written to the YAML: {message}",

    // 鲸鱼娘弹窗
    "whale.title": "Whale courier: {count} new messages",
    "whale.unknownSender": "(unknown)",
    "whale.noSubject": "(no subject)",
    "whale.row": "{who} · {subject}",
    "whale.more": "…and {count} more; use email_watch / email_read to see them",
    "whale.close": "Close",
  },
};
/**
 * 当前界面语言（'zh' | 'en'）。初值 zh，挂载时由 locale 服务改写（见 subscribeLocale）。
 * 模块级变量而不是 React state：t() 是普通函数，调用点遍布组件树和命令式 DOM 代码
 * （鲸鱼娘弹窗）；React 组件靠各自的 setState 触发重渲染，弹窗由订阅回调直接重画。
 */
var UI_LANG = "zh";
/**
 * 语言决定：只认前缀。zh* 一律中文，en* 英文，其余（含空值、旧宿主的怪值）回退 zh ——
 * 本插件的原文就是中文，退回它最不容易读出错误的界面。
 */
function localeToLang(active) {
  const tag = String(active === undefined || active === null ? "" : active).toLowerCase();
  if (tag.indexOf("zh") === 0) return "zh";
  if (tag.indexOf("en") === 0) return "en";
  return "zh";
}

/**
 * 语言切换后的重绘钩子。React 那边由各自的 setState / 外壳的 locale 订阅兜底，
 * 命令式 DOM（鲸鱼娘弹窗）没有那一层，只能自己登记一个。同一时刻只有可能开着一个
 * 弹窗，所以这里是单槽而不是列表；弹窗销毁时它会把自己的钩子摘掉。
 */
var relocalize = null;

/**
 * 取 locale 服务。两条路都试，因为「服务在不在」和「ctx 长什么样」是两件事：
 *   - ctx.get('locale') 是可选服务的正规读法（服务缺席时返回 undefined）；
 *   - ctx.locale 直接读，留给没有 get() 的旧 ctx。
 * 两条都拿不到就返回 null —— 调用方按「没有 locale」处理。
 */
function localeServiceOf(ctx) {
  try {
    if (typeof ctx.get === "function") {
      const viaGet = ctx.get("locale");
      if (viaGet !== undefined && viaGet !== null) return viaGet;
    }
  } catch (e) { /* 落到下面那条路 */ }
  const direct = ctx.locale;
  return direct === undefined || direct === null ? null : direct;
}

/**
 * 挂上 locale 服务：读一次当前语言，再订阅后续切换。
 *
 * 服务缺失是**正常路径**，不是异常：旧宿主 / 没启用 locale 的 profile 里根本
 * 没有这个服务；就算有，getSnapshot / subscribe 也是别的包提供的，行为不可假定。
 * 所以每个入口都先查存在性再 try —— 任何一步失败都只是留在 zh，绝不把插件的挂载
 * 拖垮（这里抛出去，整个 settings 段和鲸鱼娘都会一起不出现）。
 *
 * 服务缺失时返回的也是一个函数（no-op），调用方不必再判空。
 */
function subscribeLocale(ctx) {
  const service = localeServiceOf(ctx);
  if (service === null) return () => {};
  const apply = () => {
    try {
      if (typeof service.getSnapshot === "function") {
        UI_LANG = localeToLang(service.getSnapshot().active);
      }
    } catch (e) {
      UI_LANG = "zh";
    }
    if (typeof relocalize === "function") {
      try { relocalize(); } catch (e) { /* 重绘失败不该让订阅链断掉 */ }
    }
  };
  apply();
  try {
    if (typeof service.subscribe !== "function") return () => {};
    const off = service.subscribe(apply);
    return typeof off === "function" ? off : () => {};
  } catch (e) {
    return () => {};
  }
}

/** 取一条界面文案。{name} 占位符按字面替换（不是正则、也不做 HTML 转义 ——
 * 这些文案全部进 DOM 文本节点或 textContent，从不拼成 HTML）。
 *
 * 回退只有一级：**语言表里没有 key、或整张语言表不存在，都返回 key 本身**。
 * 刻意不退回 zh —— 两张表理应逐键相同，真漏一条就露一条 'card.add'，漏译在界面
 * 上现形；静默退回中文会让「英文界面里混着中文」这种半成品看起来像做完了。
 */
function t(key, params) {
  const table = UI[UI_LANG];
  const raw = table && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : key;
  if (typeof raw !== "string" || params === undefined || params === null) return raw;
  return raw.replace(/\{(\w+)\}/g, (whole, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : whole);
}

function fieldInput(type, value, onChange, placeholder) {
  return h("input", {
    type,
    value: value === undefined || value === null ? "" : String(value),
    placeholder,
    onChange: (e) => onChange(e.target.value),
  });
}

// ---------------------------------------------------------------------------
// 多账户卡片编辑器 helper。纯函数，不认识 React state：卡片是「账号名 -> 草稿」
// 的扁平映射，任何字段都可能是半填状态。
// ---------------------------------------------------------------------------

/**
 * 卡片行的稳定内部 id。React key 只认它：账号名/预设名每敲一个字符都变，用名字
 * 当 key 会让整张卡重挂载、输入框失焦。id 只在「卡片集合来源变化」（加载 / 解析
 * YAML / 从快照重建）时重新分配，改名不动它。
 */
let nextCardId = 1;
let nextPresetId = 1;

/**
 * 卡片集合来源变化（加载 / 解析 YAML / 从快照重建）时重建顺序表：每行拿一个新 id。
 * 行 = { id, key }，key 是草稿映射的键（账号名 / 预设名，也就是 YAML 的键）。
 */
function cardRows(names) {
  return (names || []).map((key) => ({ id: nextCardId++, key }));
}

function presetRows(names) {
  return (names || []).map((key) => ({ id: nextPresetId++, key }));
}

/** 改名只换行的 key，id 不动 —— React key 不变，输入框不会重挂载失焦。 */
function rekeyRows(rows, oldKey, nextKey) {
  return rows.map((row) => (row.key === oldKey ? { id: row.id, key: nextKey } : row));
}

/** 新卡片的空草稿。账号只认服务商 + 凭证，端点由预设展开，草稿里不存端点。 */
function emptyAccountDraft(name) {
  return {
    name: name === undefined ? "" : name,
    provider: "",
    user: "",
    password: "",
    inboxFolder: "INBOX",
  };
}

/** 卡片上的 provider 名 -> 那个 provider 的登录方式。没有卡片数据时按本地名单预判。 */
function authKindOf(provider) {
  return OAUTH2_PROVIDERS.indexOf(String(provider === undefined || provider === null ? "" : provider)) >= 0
    ? "oauth2"
    : "password";
}

/** 这张卡片是不是走 OAuth2：服务端字段优先（它知道真实预设表），否则本地按名单判。 */
function isOauthDraft(draft) {
  if (draft === null || draft === undefined) return false;
  if (draft.authKind === "oauth2") return true;
  if (draft.authKind === "password") return false;
  return authKindOf(draft.provider) === "oauth2";
}

/**
 * 服务端卡片（永不含密码明文）-> 草稿。user 为空表示「就留空」，不是未加载。
 * 账号在 YAML 里只存 provider id：卡片带着的 imap/smtp 是「这个预设展开出来的
 * 端点」（快照算给你看的），不是账号自己的字段，所以一概不读 —— 读了就会在保存
 * 时把一份会过期的端点抄回 YAML。卡片上的端点显示改从 presets 查（providerMetaText）。
 * authKind/oauthState/oauthUser 是卡片的登录态投影，只用于显示与本地判定，
 * 不进 draftToInput（它们不是 YAML 的字段，后端认的是账号自己的 oauth 段）。
 */
function draftFromCard(card) {
  return {
    name: String(card.name || ""),
    originalName: String(card.name || ""),
    imap: card.imap,
    smtp: card.smtp,
    provider: card.provider === undefined || card.provider === null ? "" : String(card.provider),
    user: card.user === undefined || card.user === null ? "" : String(card.user),
    password: "",
    // 登录密码与 password 同一套三态契约：卡片永远拿不到明文，只有"是否已存"。
    authPassword: "",
    hasAuthPassword: card.hasAuthPassword === true,
    senderName: card.senderName === undefined || card.senderName === null ? "" : String(card.senderName),
    authUser: card.authUser === undefined || card.authUser === null ? "" : String(card.authUser),
    clientId: card.clientId === undefined || card.clientId === null ? "" : String(card.clientId),
    // 卡片只在账号自己的 clientId 为空时报内置值：它是「留空会用哪个应用」的答案，
    // 不是账号的字段，所以既不进 YAML，也不参与三态写入。
    defaultClientId: card.oauthDefaultClientId === undefined || card.oauthDefaultClientId === null
      ? ""
      : String(card.oauthDefaultClientId),
    // authKind 是生效裁决（决定显示登录区还是密码框），authKindSetting 是用户钉住
    // 了什么（'' = 自动）。两者必须分开：都从裁决读的话，「自动」与「显式密码」在
    // 编辑器里长得一样，那条给混合/本地租户留的退路就没法从面板操作。
    authKindSetting: card.authKindDeclared === "oauth2" || card.authKindDeclared === "password" ? card.authKindDeclared : "",
    inboxFolder: card.inboxFolder === undefined || card.inboxFolder === null ? "INBOX" : String(card.inboxFolder),
    authKind: card.authKind === "oauth2" || card.authKind === "password" ? card.authKind : undefined,
    oauthState: card.oauthState === "pending" || card.oauthState === "logged-in" ? card.oauthState : "none",
    oauthUser: card.oauthUser === undefined || card.oauthUser === null ? "" : String(card.oauthUser),
  };
}

/** 卡片列表 -> { 账号名: 草稿 }。同名重复只留第一个（账号名是映射键）。 */
function draftsFromCards(list) {
  const map = {};
  for (const card of list || []) {
    const name = String(card.name || "");
    if (name === "" || Object.prototype.hasOwnProperty.call(map, name)) continue;
    map[name] = draftFromCard(card);
  }
  return map;
}

/**
 * 下拉的选项集合：8 个内置 + serverPresets 里的自定义名。自定义项的显示文案取预设
 * 自己的 label（预设编辑器里那个「显示名」），没写 label 才退回预设名。
 */
function providerOptions(presets) {
  const out = PROVIDERS.map(([value, labelKey]) => ({ value, label: t(labelKey) }));
  const custom = (presets && presets.custom) || {};
  for (const name of Object.keys(custom)) {
    if (name === "") continue;
    if (out.some((option) => option.value === name)) continue;
    const entry = custom[name] || {};
    out.push({ value: name, label: presetLabelOf(name, entry) });
  }
  return out;
}

/** 预设的显示名：label 优先，没有就用预设名本身（label 只是显示名，不是键）。 */
function presetLabelOf(name, preset) {
  const label = preset && typeof preset.label === "string" ? preset.label.trim() : "";
  return label !== "" ? label : String(name);
}

/**
 * select 的 value 必须能在选项里找到：否则浏览器把选中项显示成空/错位，等于把
 * 真实值藏起来。YAML 里本来就没有 provider、或用了一个没写进 serverPresets 的
 * 名字时，补一条只代表「当前值」的占位项（不改变 provider 本身，也不新增端点编辑）。
 */
function providerOptionsFor(presets, current) {
  const out = providerOptions(presets);
  const value = current === undefined || current === null ? "" : String(current);
  if (out.some((option) => option.value === value)) return out;
  const placeholder = { value, label: value === "" ? t("provider.noneInYaml") : value + t("provider.undefinedPresetSuffix") };
  return value === "" ? [placeholder].concat(out) : out.concat([placeholder]);
}

/**
 * 选服务商：只把 provider 键写进草稿。端点一个都不展开 —— 账号在 YAML 里只记
 * provider id，host/port/secure 由后端在解析时从预设表展开，前端抄一份只会是
 * 一份会过期的副本（预设改了它不会跟着变，保存时还会把它写回 YAML）。
 * 预设名合不合法由后端裁定：它才是预设表的持有者。
 *
 * 换服务商 = 换一套凭证：旧服务商的密码留着毫无意义（后端也不会拿它去连新主机），
 * 而 oauth2 的服务商本来就不要密码。所以这里顺手清掉 password 和登录态投影，
 * 免得「qq 的授权码」被当成 outlook 的密码交上去。
 */
function applyPreset(draft, provider) {
  const next = provider === undefined || provider === null ? "" : String(provider);
  return Object.assign({}, draft, {
    provider: next,
    password: "",
    authKind: undefined,
    oauthState: "none",
    oauthUser: "",
  });
}

/**
 * 草稿 -> serializeAccounts 的输入。密码三态在这里定型：'' 或 untouched 都不带
 * password 键（继承已存密码），只有用户真的打了字才写进去。端点一概不带：账号只存
 * provider id，后端 resolveAccount() 在连接时从预设表展开（带上也会被后端洗掉）。
 *
 * OAuth2 账号没有密码可带：登录结果（refresh token）由后端 oauthLogin/oauthPoll
 * 自己落盘，前端一个字都不写。authKind/oauthState/oauthUser 是显示用的投影，
 * 不是 YAML 字段，一个都不进这份输入。
 */
function draftToInput(draft) {
  const input = {
    name: draft.name,
    originalName: draft.originalName,
    user: draft.user,
    inboxFolder: draft.inboxFolder,
  };
  if (draft.provider) input.provider = draft.provider;
  if (!isOauthDraft(draft) && draft.password) input.password = draft.password;
  // 显示名/登录名是普通三态字段（留空 = 清掉该键），密码与 password 同规：只有真打了字才写。
  if (draft.senderName !== undefined) input.senderName = String(draft.senderName || "").trim();
  if (!isOauthDraft(draft) && draft.authUser !== undefined) input.authUser = String(draft.authUser || "").trim();
  if (!isOauthDraft(draft) && draft.authPassword) input.authPassword = draft.authPassword;
  // Only an OAuth2 card models the application id; for any other account the
  // field stays undefined, which the backend reads as「没说」and leaves the
  // stored key alone. An empty string here is the user clearing it on purpose.
  if (isOauthDraft(draft)) input.clientId = String(draft.clientId || "").trim();
  // '' is a real value here, not an omission: it takes the pin off and returns
  // the account to the derivation. Only a draft that models the selector speaks.
  if (draft.authKindSetting !== undefined) input.authKind = String(draft.authKindSetting || "");
  return input;
}

/**
 * 半填账号：名字、邮箱地址、服务商三者缺一都算。服务商是账号的连接身份 —— 没有它
 * 就没有端点可展开，后端 persist 时会把这个键删掉，卡片上必须先把这件事说出来。
 * OAuth2 账号不要密码：有 (name, provider, user) 就算填完了。
 */
function accountIncomplete(draft) {
  return String(draft.name || "").trim() === ""
    || String(draft.user || "").trim() === ""
    || String(draft.provider || "").trim() === "";
}

/** 改过名字后草稿要跟着键走：旧键删掉，整份草稿（含 imap/smtp）搬到新键下。 */
function renameDrafts(drafts, oldName, nextName) {
  if (nextName !== oldName && Object.prototype.hasOwnProperty.call(drafts, nextName)) {
    throw new Error(t("card.errDuplicateName"));
  }
  const next = {};
  for (const key of Object.keys(drafts)) {
    if (key === oldName) continue;
    next[key] = drafts[key];
  }
  const entry = drafts[oldName];
  if (entry !== undefined) next[nextName] = Object.assign({}, entry, { name: nextName });
  return next;
}

/**
 * 卡片徽标：内置服务商用中文名，自定义预设用它自己的 label（没 label 用预设名），
 * 未知/未指定一律「自定义」。徽标只负责显示，provider 的键始终是预设名。
 * 「自定义」判据用 hasOwnProperty 而不是端点是否到位：刚存下的预设名会先一步进
 * presets.custom（值还是 undefined，端点要等下一次快照），它已经是合法预设了。
 */
function accountSummary(draft, presets) {
  const provider = draft.provider || "";
  const entry = PROVIDERS.filter(([value]) => value === provider)[0];
  if (entry) return { label: t(entry[1]), isCustom: false };
  const custom = (presets && presets.custom) || {};
  if (provider !== "" && Object.prototype.hasOwnProperty.call(custom, provider)) {
    return { label: presetLabelOf(provider, custom[provider]), isCustom: true };
  }
  return { label: t("provider.custom"), isCustom: true };
}

/** 预设端点写成 host:port；主机没填就说没填，端口缺省不装成合法值。 */
function presetEndpointText(endpoint) {
  const host = endpoint && typeof endpoint.host === "string" ? endpoint.host.trim() : "";
  if (host === "") return t("preset.endpointMissing");
  return host + ":" + portLabel(endpoint.port);
}

/**
 * 卡片 meta 行里的「连去哪」：账号只存 provider id，端点是预设展开的，所以这里
 * 一律回头查预设表，不读草稿自己的 imap/smtp（那份副本已经不存在了）。
 * 内置预设显示内置名 + 它的端点；自定义预设显示 label（没 label 用预设名）+ 端点；
 * 名字连预设都没定义时明说「未定义预设」；压根没选服务商就直说。
 */
function providerMetaText(draft, presets) {
  const provider = String(draft.provider || "").trim();
  if (provider === "") return t("card.noProvider");
  const entry = PROVIDERS.filter(([value]) => value === provider)[0];
  if (entry) {
    const builtin = (presets && presets.builtin && presets.builtin[provider]) || undefined;
    if (builtin === undefined) return t(entry[1]);
    return t(entry[1]) + t("card.builtinEndpoints", { imap: presetEndpointText(builtin.imap), smtp: presetEndpointText(builtin.smtp) });
  }
  const custom = (presets && presets.custom) || {};
  if (!Object.prototype.hasOwnProperty.call(custom, provider)) return provider + t("provider.undefinedPresetSuffix");
  const preset = custom[provider] || undefined;
  if (preset === undefined) return presetLabelOf(provider, undefined);
  return presetLabelOf(provider, preset) + t("card.customEndpoint", { endpoint: presetEndpointText(preset.imap) });
}

// ---------------------------------------------------------------------------
// 服务器预设 helper。同样是纯函数：预设是「预设名 -> 草稿」的扁平映射，端口在
// 草稿里保持用户输入的原文（可能半填），序列化时才定型。预设不含凭证。
// ---------------------------------------------------------------------------

/** 空预设草稿：端口默认对齐端点回退值（IMAP 993 / SMTP 465）。 */
function emptyPresetDraft(name) {
  return {
    name: name === undefined ? "" : name,
    label: "",
    imap: { host: "", port: "993", secure: true },
    smtp: { host: "", port: "465", secure: true },
  };
}

/**
 * 快照里的一个自定义预设 -> 草稿。缺省端口按端点回退值显示（993/465）：
 * 那正是它解析出来的端口，写回去只是把它显式化，语义不变。
 */
function draftFromPreset(name, preset) {
  const value = preset || {};
  const imap = value.imap || {};
  const smtp = value.smtp || {};
  return {
    name: String(name),
    label: value.label === undefined || value.label === null ? "" : String(value.label),
    imap: {
      host: imap.host === undefined || imap.host === null ? "" : String(imap.host),
      port: typeof imap.port === "number" ? String(imap.port) : "993",
      secure: imap.secure !== false,
    },
    smtp: {
      host: smtp.host === undefined || smtp.host === null ? "" : String(smtp.host),
      port: typeof smtp.port === "number" ? String(smtp.port) : "465",
      secure: smtp.secure !== false,
    },
  };
}

/** 快照的 presets.custom -> { 预设名: 草稿 }。 */
function presetDrafts(custom) {
  const map = {};
  for (const name of Object.keys(custom || {})) map[name] = draftFromPreset(name, custom[name]);
  return map;
}

/** 端口前端拦：空 = 用默认（序列化不写这个键）；否则必须是 1-65535 的整数。 */
function portTextProblem(value) {
  const text = String(value === undefined || value === null ? "" : value).trim();
  if (text === "") return "";
  if (!/^[0-9]+$/.test(text)) return t("preset.portNumeric");
  const n = Number(text);
  if (n < 1 || n > 65535) return t("preset.portRange");
  return "";
}

/** 端口原文 -> 写进 YAML 的整数文本（"0993" -> "993"）。 */
function portScalar(value) {
  return String(Number(String(value).trim()));
}

/** 卡片 meta 里的端口显示：空或非法一律「—」，不把半填状态装成合法值。 */
function portLabel(value) {
  const text = String(value === undefined || value === null ? "" : value).trim();
  return text !== "" && portTextProblem(text) === "" ? text : "—";
}

/**
 * YAML 标量。字段值都在我们控制范围内，只放行「字母开头、纯标识符样」的裸值；
 * 其余（含 : # { } [ ] , & * ' "、首尾空白、空串、YAML 保留字）一律走
 * JSON.stringify 的双引号形式 —— JSON 字符串转义是 YAML 双引号风格的子集。
 */
function yamlScalar(value) {
  const text = value === undefined || value === null ? "" : String(value);
  const plain = /^[A-Za-z_][A-Za-z0-9_.@+-]*$/;
  const reserved = /^(?:y|n|yes|no|true|false|on|off|null|none)$/i;
  if (text !== "" && plain.test(text) && !reserved.test(text)) return text;
  return JSON.stringify(text);
}

/**
 * 卡片态 -> serverPresets YAML 文本。空列表 -> ''（解析侧用 .trim() 判断「有没有
 * 预设」，空映射不能写成 '{}'）。返回 { text } 或 { error }：预设名缺失/重名、
 * host 缺失、端口非法都在这里拦下，报的是第一处问题。
 */
function serializePresetDrafts(names, drafts) {
  const lines = [];
  const seen = {};
  for (const key of names) {
    const draft = drafts[key];
    if (draft === undefined) continue;
    const name = String(draft.name === undefined || draft.name === null ? "" : draft.name).trim();
    if (name === "") return { error: t("preset.errNoName") };
    if (Object.prototype.hasOwnProperty.call(seen, name)) {
      return { error: t("preset.errDuplicate", { name }) };
    }
    seen[name] = true;
    const label = String(draft.label === undefined || draft.label === null ? "" : draft.label).trim();
    const imapHost = String(draft.imap.host || "").trim();
    const smtpHost = String(draft.smtp.host || "").trim();
    if (imapHost === "") return { error: t("preset.errNoImapHost", { name }) };
    if (smtpHost === "") return { error: t("preset.errNoSmtpHost", { name }) };
    const imapProblem = portTextProblem(draft.imap.port);
    if (imapProblem !== "") return { error: t("preset.errImapPort", { name, problem: imapProblem }) };
    const smtpProblem = portTextProblem(draft.smtp.port);
    if (smtpProblem !== "") return { error: t("preset.errSmtpPort", { name, problem: smtpProblem }) };
    const imapPort = String(draft.imap.port).trim();
    const smtpPort = String(draft.smtp.port).trim();

    lines.push(yamlScalar(name) + ":");
    if (label !== "") lines.push("  label: " + yamlScalar(label));
    lines.push("  imap:");
    lines.push("    host: " + yamlScalar(imapHost));
    if (imapPort !== "") lines.push("    port: " + portScalar(imapPort));
    lines.push("    secure: " + (draft.imap.secure === true ? "true" : "false"));
    lines.push("  smtp:");
    lines.push("    host: " + yamlScalar(smtpHost));
    if (smtpPort !== "") lines.push("    port: " + portScalar(smtpPort));
    lines.push("    secure: " + (draft.smtp.secure === true ? "true" : "false"));
  }
  if (lines.length === 0) return { text: "" };
  return { text: lines.join("\n") + "\n" };
}

/**
 * serverPresets 文本里的顶层键名（预设名）。不引 yaml 包：顶层键就是行首标识符，
 * 够用来在保存落地之前先把新预设名喂给账号卡片的服务商下拉。
 */
function presetNamesOf(text) {
  const names = [];
  const lines = String(text === undefined || text === null ? "" : text).split(/\r?\n/);
  for (const line of lines) {
    const match = /^([A-Za-z0-9_-]+):/.exec(line);
    if (match && names.indexOf(match[1]) < 0) names.push(match[1]);
  }
  return names;
}

/**
 * 快照 presets + 父级刚解析出的名字：名字先到、端点随后（保存成功后由快照补齐）。
 * 只有快照的 custom 里没有的名字才补一个空位 —— 端点永远以快照为准。
 */
function presetsWithNames(presets, names) {
  const base = presets || { builtin: {}, custom: {} };
  if (!names || names.length === 0) return base;
  const custom = Object.assign({}, base.custom || {});
  for (const name of names) {
    if (!Object.prototype.hasOwnProperty.call(custom, name)) custom[name] = undefined;
  }
  return Object.assign({}, base, { custom });
}

/** OAuth2 服务商的中文登录按钮文案；没登记的按 provider id 拼一个，不装成认识的。 */
const OAUTH2_SIGN_IN_LABELS = { outlook: "oauth.signIn.outlook" };
function oauthSignInLabel(provider) {
  const key = String(provider === undefined || provider === null ? "" : provider);
  const known = OAUTH2_SIGN_IN_LABELS[key];
  return known === undefined ? t("oauth.signIn.generic", { provider: key || "OAuth2" }) : t(known);
}

/**
 * 登录区该显示哪一态。这是一次纯投影，优先级写死在这里：
 * 进行中的会话 > 失败 > 卡片快照说已登录 > 未登录。
 * 「pending 优先」是必要的：点完登录之后卡片数据还是旧的（oauthState === 'none'），
 * 若先看卡片就会把刚弹出来的指引面板又按回去。
 */
function oauthLoginState(draft, session, view) {
  if (session && session.state === "pending") return "pending";
  if (session && session.state === "error") return "error";
  const loggedIn = view ? view.oauthState === "logged-in" : (draft && draft.oauthState === "logged-in");
  return loggedIn ? "logged-in" : "none";
}

/**
 * 卡片登录态的「当前事实」：草稿自己的 provider 和快照里那张卡一致时，服务端的
 * authKind / oauthState / oauthUser 才作数；不一致（刚在本地换了服务商、或名字刚改
 * 过）就按本地名单判 —— 服务端那三个字段描述的是**已保存的那个 provider**。
 *
 * 为什么不直接用草稿里的副本：卡片草稿只在 listKey 变化时从快照重建，而登录成功
 * 后的重拉快照账号名没变、listKey 也没变，草稿里那份就停在旧值上。这正是文件里
 * hasPassword 一律现查 cards 的原因，这里沿用同一条规矩。
 */
function oauthViewOf(draft, cards) {
  const live = (cards || []).filter((c) => String(c.name) === String(draft.name))[0] || null;
  const sameProvider = live !== null
    && String(live.provider === undefined || live.provider === null ? "" : live.provider) === String(draft.provider || "");
  const draftKind = draft.authKind === "oauth2" || draft.authKind === "password" ? draft.authKind : "";
  const liveKind = live && (live.authKind === "oauth2" || live.authKind === "password") ? live.authKind : "";
  const authKind = sameProvider && liveKind !== "" ? liveKind : (draftKind !== "" ? draftKind : authKindOf(draft.provider));
  const draftState = draft.oauthState === "logged-in" || draft.oauthState === "pending" ? draft.oauthState : "none";
  const liveState = live && (live.oauthState === "logged-in" || live.oauthState === "pending") ? live.oauthState : "";
  return {
    authKind,
    isOauth: authKind === "oauth2",
    oauthState: sameProvider && liveState !== "" ? liveState : draftState,
    oauthUser: sameProvider && live && typeof live.oauthUser === "string" ? live.oauthUser : String(draft.oauthUser || ""),
    hasPassword: live !== null && live.hasPassword === true,
  };
}

/**
 * 轮询间隔（秒）。后端给的 interval 就是权威值，**0 也是合法值**（表示不用等，
 * 每 0.5 秒问一次）—— 只有缺失、非数字、或负数才退回兜底 5 秒。
 */
function oauthIntervalSeconds(session) {
  const raw = session ? session.interval : undefined;
  if (typeof raw === "number") return isFinite(raw) && raw >= 0 ? raw : OAUTH_POLL_FALLBACK_MS / 1000;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (isFinite(n) && n >= 0) return n;
  }
  return OAUTH_POLL_FALLBACK_MS / 1000;
}

/** 授权链接的有效期（秒）：后端给了就用它的，没给按 15 分钟说。 */
function oauthExpiresSeconds(session) {
  const raw = session ? session.expiresIn : undefined;
  const n = typeof raw === "number" ? raw : Number(raw);
  return isFinite(n) && n > 0 ? n : OAUTH_EXPIRES_FALLBACK_S;
}

/**
 * OAuth2 卡片的登录区。设备码流程没有密码可填：这一块就是凭证本身，所以它
 * 和数据字段同级，但驱动它的状态（session）由卡片持有 —— 轮询是「这次点击」的
 * 生命周期，不是配置的一部分，快照回来不该把它打断。
 */
function OauthLoginPanel(props) {
  const draft = props.draft || {};
  const session = props.session || null;
  const view = props.view || { oauthState: "none", oauthUser: "" };
  const state = oauthLoginState(draft, session, view);
  const disabled = props.disabled === true;
  const label = props.providerLabel || draft.provider || "OAuth2";

  // 「用哪个应用登录」是账号自己的配置项，面板是用户唯一的常规入口。它不是机密
  // （公共客户端 ID 每次都随请求发出），因此可以直接回填、直接编辑。留空不是
  // 「没配置」：插件自带一份社区注册，所以这里必须说清生效的到底是哪个应用 ——
  // 同意屏上写的名字不是账号主人自己的，这件事不该等点了登录才发现。
  const builtInClientId = String(draft.defaultClientId || "").trim();
  const clientIdField = () => h("div", { className: "dshe-field dshe-oauth-client" }, [
    h("label", null, t("oauth.clientIdLabel")),
    h("input", {
      type: "text",
      value: String(draft.clientId || ""),
      disabled: disabled,
      spellcheck: "false",
      placeholder: builtInClientId !== "" ? builtInClientId : t("oauth.clientIdPlaceholder"),
      onChange: (e) => { if (props.onClientId) props.onClientId(e.target.value); },
    }),
    h("div", { className: "dshe-hint" }, t("oauth.clientIdHint")),
    String(draft.clientId || "").trim() === "" && builtInClientId !== ""
      ? h("div", { className: "dshe-hint dshe-oauth-builtin" }, t("oauth.clientIdBuiltIn", { id: builtInClientId }))
      : null,
  ]);

  if (state === "pending") {
    const url = String(session.url || "");
    const code = String(session.code || "");
    const seconds = oauthIntervalSeconds(session);
    return h("div", { className: "dshe-oauth" }, [
      h("div", { className: "dshe-oauth-head" }, t("oauth.pendingHint")),
      url === ""
        ? h("div", { className: "dshe-oauth-url" }, t("oauth.noUrl"))
        : h("div", { className: "dshe-oauth-url" }, h("a", { href: url, target: "_blank", rel: "noreferrer" }, url)),
      code === "" ? null : h("div", { className: "dshe-oauth-code" }, code),
      h("div", { className: "dshe-oauth-wait" },
        t("oauth.polling", {
          seconds,
          minutes: Math.max(1, Math.round(oauthExpiresSeconds(session) / 60)),
        })),
      h("div", { className: "dshe-oauth-actions" }, [
        h("button", {
          type: "button",
          className: "dshe-btn",
          disabled: disabled,
          onClick: () => props.onCancel(),
        }, t("common.cancel")),
      ]),
    ]);
  }

  if (state === "error") {
    return h("div", { className: "dshe-oauth" }, [
      h("div", { className: "dshe-alert error" }, String(session.message || t("oauth.loginFailed"))),
      clientIdField(),
      h("div", { className: "dshe-oauth-actions" }, [
        h("button", {
          type: "button",
          className: "dshe-btn primary",
          disabled: disabled,
          onClick: () => props.onStart(),
        }, t("common.retry")),
        h("button", {
          type: "button",
          className: "dshe-btn",
          disabled: disabled,
          onClick: () => props.onCancel(),
        }, t("common.cancel")),
      ]),
    ]);
  }

  if (state === "logged-in") {
    return h("div", { className: "dshe-oauth is-logged-in" }, [
      h("div", { className: "dshe-oauth-head dshe-oauth-ok" },
        t("oauth.loggedInAs", { user: view.oauthUser || String(draft.user || "") || t("oauth.unknownUser") })),
      clientIdField(),
      h("div", { className: "dshe-oauth-actions" }, [
        h("button", {
          type: "button",
          className: "dshe-btn",
          disabled: disabled,
          onClick: () => props.onStart(),
        }, props.restarting === true ? t("oauth.signingIn") : t("oauth.reLogin")),
      ]),
    ]);
  }

  return h("div", { className: "dshe-oauth" }, [
    h("div", { className: "dshe-oauth-head" },
      t("oauth.passwordless", { label: label ? t("oauth.passwordlessLabel", { label }) : "" })),
    clientIdField(),
    String(draft.clientId || "").trim() === "" && builtInClientId === ""
      ? h("div", { className: "dshe-alert warn" }, t("oauth.clientIdMissing"))
      : null,
    h("div", { className: "dshe-oauth-actions" }, [
      h("button", {
        type: "button",
        className: "dshe-btn primary",
        disabled: disabled,
        onClick: () => props.onStart(),
      }, props.starting === true ? t("oauth.requestingCode") : oauthSignInLabel(draft.provider)),
    ]),
  ]);
}

/**
 * 账号卡片编辑器。YAML 仍然是唯一的真相源，但改动是「编辑即保存」：每次改动都
 * 把 {卡片快照, 默认账号} 抛给父级，由父级统一 serializeAccounts + 防抖落盘。
 * 卡片自己不再写 YAML，也不再区分「已写入 / 未写入」。
 */
function AccountCardsEditor(props) {
  const presets = props.presets || { builtin: {}, custom: {} };
  const detail = props.detail || { raw: {}, list: [] };
  const cards = detail.list || [];

  const [drafts, setDrafts] = React.useState(() => draftsFromCards(cards));
  // order 是 [{ id, key }]：id 是 React key（稳定，只随卡片集合来源变化而重建），
  // key 是草稿映射的键（账号名，也就是 YAML 的键）。展开态/确认态一律按 id 记。
  const [order, setOrder] = React.useState(() => cardRows(cards.map((c) => String(c.name))));
  const [open, setOpen] = React.useState(0);
  const [defaultAccount, setDefaultAccount] = React.useState(detail.defaultAccount || "");
  const [confirming, setConfirming] = React.useState(0);
  const [busy, setBusy] = React.useState("");
  const [rowStatus, setRowStatus] = React.useState({});
  const [notice, setNotice] = React.useState(null);
  /**
   * OAuth2 的登录会话：{ [账号名]: { state:'pending'|'error', url, code, interval,
   * expiresIn, message, startedAt } }。它刻意和卡片草稿分开 —— 草稿是「要落盘的
   * 配置」，会话是「这次点击的进度」，一次性、不落盘、刷新即丢（码也就作废了）。
   * 取消 = 删掉这一项，轮询的 effect 跟着这一项存亡。
   */
  const [oauth, setOauth] = React.useState({});
  /** 每个账号的会话序号：取消 / 重启 / 换服务商都 +1，晚到的轮询结果据此作废。 */
  const oauthSeqRef = React.useRef({});

  const listKey = cards.map((c) => String(c.name) + ":" + c.isDefault).join("|") + "|" + (detail.defaultAccount || "");

  React.useEffect(() => {
    setDrafts(draftsFromCards(cards));
    setOrder(cardRows(cards.map((c) => String(c.name))));
    setOpen(0);
    setConfirming(0);
    setDefaultAccount(detail.defaultAccount || "");
    // 详情对象每次快照都是新的：只依赖它的投影，免得无谓重建草稿。
    // eslint-disable-next-line
  }, [listKey]);

  /**
   * 最新草稿/顺序的镜像。改动处理函数如果直接闭包 state，两次改动落在同一批次里
   * 时后一次会拿着旧快照算，把前一次改的字段抹掉（快速连填两个输入框就会）。
   * 一律从镜像读、算完再 setState，改动之间就不会互相丢。
   */
  const draftsRef = React.useRef(drafts);
  const orderRef = React.useRef(order);
  draftsRef.current = drafts;
  orderRef.current = order;

  /**
   * 卡片的当前快照 -> 父级。顺序来自 order，内容来自 drafts（键已随改名同步）。
   * 半填的账号照抛不误 —— 这正是草稿的意义；名字没填、重名、或「多账号却没指定
   * 默认账号」是「还不能写进 YAML」，只提示、不抛给父级（否则一次半填就会把
   * YAML 里的账号整片抹掉）。改名/删除这类中间态同理，等名字打完自然就存了。
   */
  const autoSave = (draftsNow, orderNow, defaultNow, immediate) => {
    if (typeof props.onAutoSave !== "function") return null;
    const names = orderNow.map((row) => row.key).filter((name) => Object.prototype.hasOwnProperty.call(draftsNow, name));
    let built;
    try {
      built = names.map((name) => draftToInput(draftsNow[name]));
    } catch (e) {
      console.error("[dsh-email] 卡片快照组装失败", e, names, draftsNow);
      return null;
    }
    if (built.some((card) => String(card.name || "").trim() === "")) {
      setNotice({ kind: "error", text: t("card.errNoName") });
      return null;
    }
    if (names.some((name) => !draftsNow[name].provider && !(draftsNow[name].imap?.host && draftsNow[name].smtp?.host))) {
      // 服务商就是账号的连接身份：没有它，后端写回时会把 provider 键删掉，这个账号
      // 永远连不上。名字和它都属于「这还是一张半填的卡」，一起拦在这里。
      setNotice({ kind: "error", text: t("card.errNoProvider") });
      return null;
    }
    if (built.some((card) => card.name === "defaultAccount")) {
      setNotice({ kind: "error", text: t("card.errReservedName") });
      return null;
    }
    if (built.length > 1 && String(defaultNow || "") === "") {
      setNotice({ kind: "error", text: t("card.errNoDefault") });
      return null;
    }
    setNotice(null);
    // 返回值只给 OAuth 登录用：它必须等这份配置真的落盘（后端按账号名去读 provider
    // 和端点）。其余调用方照旧忽略返回值。
    return props.onAutoSave(built, String(defaultNow || ""), immediate === true);
  };

  const patchDraft = (name, patch) => {
    const next = Object.assign({}, draftsRef.current, { [name]: Object.assign({}, draftsRef.current[name], patch) });
    draftsRef.current = next;
    setDrafts(next);
    autoSave(next, orderRef.current, defaultAccount);
  };

  // -------------------------------------------------------------------------
  // OAuth2 登录。会话只存在于内存（见 oauth state 的注释），三个动作：
  // startOauth 取设备码、pollOauth 轮询、cancelOauth 放弃。
  // -------------------------------------------------------------------------

  /** 会话的序号：取消/重启/换服务商都会 +1，晚到的轮询结果据此作废。 */
  const bumpOauth = (name) => {
    oauthSeqRef.current[name] = (oauthSeqRef.current[name] || 0) + 1;
    return oauthSeqRef.current[name];
  };
  const oauthCurrent = (name) => oauthSeqRef.current[name] || 0;

  const setOauthOf = (name, entry) => {
    setOauth((cur) => {
      const next = Object.assign({}, cur);
      if (entry === null) delete next[name];
      else next[name] = entry;
      return next;
    });
  };

  const cancelOauth = (name) => {
    bumpOauth(name);
    setOauthOf(name, null);
  };

  /**
   * 登录前先把这张卡片落盘：oauthLogin 只认账号名，后端要从已保存的配置里读这个
   * 账号的 provider 与端点。草稿没写进 YAML 就点登录的话，后端根本找不到它。
   * 等这次落盘真的结束（成功或失败），别让 oauthLogin 和后端的写盘抢。
   */
  const ensureSaved = async () => {
    const pending = autoSave(draftsRef.current, orderRef.current, defaultAccount, true);
    if (pending && typeof pending.then === "function") {
      try { await pending; } catch (e) { /* 保存失败由父级的状态条报，这里不重复说 */ }
    }
  };

  const startOauth = async (name) => {
    const draft = draftsRef.current[name];
    if (draft === undefined) return;
    const seq = bumpOauth(name);
    setRowStatus((cur) => Object.assign({}, cur, { [name]: { kind: "busy", text: t("oauth.requestingCode") } }));
    setOauthOf(name, { state: "starting" });
    await ensureSaved();
    if (seq !== oauthCurrent(name)) return;
    try {
      const body = await apiOauth("oauthLogin", { account: name });
      if (seq !== oauthCurrent(name)) return;
      if (!body.ok) {
        setOauthOf(name, { state: "error", message: oauthErrorMessage(body, t("oauth.loginFailed")) });
        setRowStatus((cur) => { const next = Object.assign({}, cur); delete next[name]; return next; });
        return;
      }
      setRowStatus((cur) => { const next = Object.assign({}, cur); delete next[name]; return next; });
      if (body.status === "pending") {
        setOauthOf(name, {
          state: "pending",
          url: String(body.url === undefined || body.url === null ? "" : body.url),
          code: String(body.code === undefined || body.code === null ? "" : body.code),
          // 后端给的是 interval（秒）与 expiresIn（秒）；契约文本里叫 expires_in。
          interval: body.interval,
          expiresIn: body.expires_in !== undefined ? body.expires_in : body.expiresIn,
        });
        return;
      }
      // status === 'already'：后端说这个账号已经登录过了，没有码可取。
      setOauthOf(name, null);
      await finishOauth(name, "");
    } catch (e) {
      if (seq !== oauthCurrent(name)) return;
      setRowStatus((cur) => { const next = Object.assign({}, cur); delete next[name]; return next; });
      setOauthOf(name, { state: "error", message: e && e.message ? e.message : String(e) });
    }
  };

  /** 轮询一次。pending 就等下一轮（定时器由 effect 按会话自己排），ok 就收尾。 */
  const pollOauth = async (name) => {
    const seq = oauthCurrent(name);
    let body;
    try {
      body = await apiOauth("oauthPoll", { account: name });
    } catch (e) {
      if (seq !== oauthCurrent(name)) return;
      setOauthOf(name, { state: "error", message: e && e.message ? e.message : String(e) });
      return;
    }
    if (seq !== oauthCurrent(name)) return;
    if (body.ok && body.status === "ok") {
      bumpOauth(name); // 会话结束：晚到的结果不再有意义
      setOauthOf(name, null);
      await finishOauth(name, String(body.user === undefined || body.user === null ? "" : body.user));
      return;
    }
    if (!body.ok) {
      bumpOauth(name);
      setOauthOf(name, { state: "error", message: oauthErrorMessage(body, t("oauth.loginFailed")) });
    }
  };

  /**
   * 登录成功：重新拉一次卡片快照（和加载/保存同一条路径），让卡片拿到
   * oauthState/oauthUser，再报一句成功。
   */
  const finishOauth = async (name, user) => {
    setNotice({ kind: "success", text: user === "" ? t("oauth.loginOk") : t("oauth.loginOkAs", { user }) });
    if (typeof props.onReload === "function") await props.onReload();
  };

  /** 每次渲染都刷新这个 ref：定时器回调永远拿到最新的 pollOauth，不会闭包旧 state。 */
  const pollOauthRef = React.useRef(pollOauth);
  pollOauthRef.current = pollOauth;

  /**
   * 轮询排期。签名里带账号名和它自己的间隔，所以「谁在 pending、间隔是多少」一变
   * 就重排一次定时器；取消或成功后签名变空，定时器全清。多个账号可以同时 pending，
   * 一个账号一个定时器。
   */
  const oauthPendingSig = Object.keys(oauth)
    .filter((name) => oauth[name] && oauth[name].state === "pending")
    .map((name) => name + "\t" + oauthIntervalSeconds(oauth[name]))
    .join("|");

  React.useEffect(() => {
    if (oauthPendingSig === "") return undefined;
    const timers = oauthPendingSig.split("|").map((entry) => {
      const cut = entry.lastIndexOf("\t");
      const name = entry.slice(0, cut);
      const delay = (Number(entry.slice(cut + 1)) + 0.5) * 1000;
      return setInterval(() => { pollOauthRef.current(name); }, delay);
    });
    return () => { timers.forEach((timer) => clearInterval(timer)); };
    // eslint-disable-next-line
  }, [oauthPendingSig]);

  /** 换服务商 = 换一套凭证：进行中的登录会话跟着作废。 */
  const changeProvider = (name, provider) => {
    cancelOauth(name);
    patchDraft(name, applyPreset(draftsRef.current[name], provider));
  };

  const renameDraft = (oldName, nextName) => {
    // 映射键必须立刻跟着名字走，否则改名会留下旧键的孤儿。
    // 行的 id 不动，所以改名不会让输入框重挂载失焦。
    let nextDrafts;
    try { nextDrafts = renameDrafts(draftsRef.current, oldName, nextName); }
    catch (error) { setNotice({ kind: "error", text: error.message }); return; }
    const nextOrder = rekeyRows(orderRef.current, oldName, nextName);
    const nextDefault = defaultAccount === oldName ? nextName : defaultAccount;
    draftsRef.current = nextDrafts;
    orderRef.current = nextOrder;
    setDrafts(nextDrafts);
    setOrder(nextOrder);
    setDefaultAccount(nextDefault);
    autoSave(nextDrafts, nextOrder, nextDefault);
  };

  const addAccount = () => {
    let n = Object.keys(draftsRef.current).length + 1;
    let name = "account" + n;
    while (Object.prototype.hasOwnProperty.call(draftsRef.current, name)) {
      n += 1;
      name = "account" + n;
    }
    const nextDrafts = Object.assign({}, draftsRef.current, { [name]: emptyAccountDraft(name) });
    const row = cardRows([name])[0];
    const nextOrder = orderRef.current.concat([row]);
    setDrafts(nextDrafts);
    setOrder(nextOrder);
    setOpen(row.id);
    autoSave(nextDrafts, nextOrder, defaultAccount);
  };

  const removeAccount = (id) => {
    const row = orderRef.current.filter((item) => item.id === id)[0];
    if (row === undefined) return;
    const name = row.key;
    const nextDrafts = Object.assign({}, draftsRef.current);
    delete nextDrafts[name];
    const nextOrder = orderRef.current.filter((item) => item.id !== id);
    const nextDefault = defaultAccount === name ? "" : defaultAccount;
    setDrafts(nextDrafts);
    setOrder(nextOrder);
    setDefaultAccount(nextDefault);
    setConfirming(0);
    setOpen((cur) => (cur === id ? 0 : cur));
    // 删除是明确动作：确认之后立刻落盘，不等防抖（用户可能马上就走）。
    autoSave(nextDrafts, nextOrder, nextDefault, true);
  };

  /** 默认账号也是配置的一部分：换一个就等于一次改动，同样立刻抛给父级保存。 */
  const setDefaultAccountAndSave = (name) => {
    setDefaultAccount(name);
    autoSave(draftsRef.current, orderRef.current, name);
  };

  /** 传的是卡片上的「当前账号名」（可能刚改过名），行内提示按它归类。 */
  const testCard = async (draftName) => {
    setBusy(draftName);
    setRowStatus((cur) => Object.assign({}, cur, { [draftName]: { kind: "busy", text: t("card.testing") } }));
    try {
      // 测试也要看到「你正在编辑的这份表单」，所以抛给父级组装完整 value。
      const cardsNow = orderRef.current.map((row) => row.key)
        .filter((name) => Object.prototype.hasOwnProperty.call(draftsRef.current, name))
        .map((name) => draftToInput(draftsRef.current[name]));
      const result = await props.onTest(draftName, cardsNow, defaultAccount);
      setRowStatus((cur) => Object.assign({}, cur, {
        [draftName]: {
          kind: "success",
          text: t("card.testOk", { ms: result.ms, host: result.imapHost, port: result.imapPort }),
        },
      }));
    } catch (e) {
      setRowStatus((cur) => Object.assign({}, cur, {
        [draftName]: { kind: "error", text: t("card.testFailed", { message: e && e.message ? e.message : String(e) }) },
      }));
    } finally {
      setBusy("");
    }
  };

  const defaultMissing = order.length > 1 && !defaultAccount;

  return h("div", { className: "dshe-acc-list" }, [
    detail.error
      ? h("div", { className: "dshe-alert error" }, t("card.yamlParseFailed", { error: detail.error }))
      : null,
    props.extraNotice
      ? h("div", { className: "dshe-alert " + props.extraNotice.kind }, props.extraNotice.text)
      : null,
    defaultMissing
      ? h("div", { className: "dshe-alert error" }, [
          t("card.pickDefault"),
          h("span", { className: "dshe-actions", style: { marginTop: 6 } },
            order.map((row) => h("button", {
              key: row.id,
              type: "button",
              className: "dshe-btn",
              onClick: () => setDefaultAccountAndSave(row.key),
            }, t("card.setDefaultAs", { name: drafts[row.key] ? drafts[row.key].name || row.key : row.key })))),
        ])
      : null,

    order.length === 0
      ? h("div", { className: "dshe-acc-empty" }, t("card.empty"))
      : null,

    order.map((row) => {
      const id = row.id;
      const name = row.key;
      const draft = drafts[name];
      if (draft === undefined) return null;
      const summary = accountSummary(draft, presets);
      const isDefault = defaultAccount !== "" && defaultAccount === draft.name;
      const expanded = open === id;
      const status = rowStatus[name];
      const renamed = draft.name !== name;
      const busyHere = busy === name;
      const view = oauthViewOf(draft, cards);
      const oauthCard = view.isOauth;
      const oauthSession = oauthCard ? (oauth[name] || null) : null;
      const oauthLive = oauthLoginState(draft, oauthSession, view);
      /** 卡片的登录态显示：服务端字段说了算，进行中的会话盖过它。 */
      const oauthLabel = oauthLive === "pending"
        ? t("oauth.signingIn")
        : (view.oauthState === "logged-in"
          ? t("card.loggedInAs", { user: view.oauthUser || draft.user || t("oauth.unknownUser") })
          : t("card.notLoggedIn"));
      const oauthBusy = oauthSession !== null && oauthSession.state === "starting";
      return h("div", { key: id, className: "dshe-acc-card" }, [
        h("div", { className: "dshe-acc-head" }, [
          h("span", { className: "dshe-acc-name" }, draft.name || t("card.unnamed")),
          h("span", { className: "dshe-acc-badge" + (summary.isCustom ? " todo" : "") }, summary.label),
          oauthCard
            ? h("span", { className: "dshe-acc-badge" + (view.oauthState === "logged-in" ? " is-oauth" : " todo") }, oauthLabel)
            : null,
          isDefault ? h("span", { className: "dshe-acc-badge is-default" }, t("card.defaultBadge")) : null,
          accountIncomplete(draft) ? h("span", { className: "dshe-acc-badge todo" }, t("card.incomplete")) : null,
          renamed ? h("span", { className: "dshe-acc-badge todo dshe-acc-warn" }, t("card.renamedBadge")) : null,
          h("span", { className: "dshe-acc-actions" }, [
            h("button", {
              type: "button",
              className: "dshe-btn",
              onClick: () => setOpen(expanded ? 0 : id),
            }, expanded ? t("common.collapse") : t("common.edit")),
            h("button", {
              type: "button",
              className: "dshe-btn",
              disabled: busy !== "" || draft.name === "",
              onClick: () => testCard(draft.name),
            }, busyHere ? t("card.testing") : t("card.testConnect")),
            h("button", {
              type: "button",
              className: "dshe-btn",
              disabled: isDefault || draft.name === "",
              onClick: () => setDefaultAccountAndSave(draft.name),
            }, isDefault ? t("card.defaultAccount") : t("card.setDefault")),
            h("button", {
              type: "button",
              className: "dshe-btn dshe-acc-danger",
              onClick: () => setConfirming(confirming === id ? 0 : id),
            }, t("common.delete")),
          ]),
        ]),
        h("div", { className: "dshe-acc-meta" },
          t("card.meta", {
            address: draft.user || t("card.noAddress"),
            folder: draft.inboxFolder || "INBOX",
            provider: providerMetaText(draft, presets),
          })),
        status
          ? h("div", { className: "dshe-hint" + (status.kind === "error" ? " dshe-acc-warn" : "") }, status.text)
          : null,
        confirming === id
          ? h("div", { className: "dshe-acc-confirm" }, [
              t("card.confirmDelete", { name: draft.name || t("card.unnamed") }),
              h("span", { className: "dshe-actions" }, [
                h("button", {
                  type: "button",
                  className: "dshe-btn dshe-acc-danger",
                  onClick: () => removeAccount(id),
                }, t("common.confirmDelete")),
                h("button", { type: "button", className: "dshe-btn", onClick: () => setConfirming(0) }, t("common.cancel")),
              ]),
            ])
          : null,
        expanded
          ? h("div", { className: "dshe-acc-body" }, [
              h("div", { className: "dshe-grid" }, [
                h("div", { className: "dshe-field" }, [
                  h("label", null, t("card.nameLabel")),
                  h("input", {
                    type: "text",
                    value: draft.name,
                    placeholder: "work",
                    onChange: (e) => renameDraft(name, e.target.value),
                  }),
                  h("div", { className: "dshe-hint" },
                    draft.name === "defaultAccount"
                      ? h("span", { className: "dshe-acc-warn" }, t("card.reservedNameWarn"))
                      : t("card.nameHint")),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, t("card.providerLabel")),
                  h("select", {
                    value: draft.provider || "",
                    onChange: (e) => changeProvider(name, e.target.value),
                  }, providerOptionsFor(presets, draft.provider).map((option) => h("option", { key: option.value, value: option.value }, option.label))),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, t("card.addressLabel")),
                  fieldInput("text", draft.user, (v) => patchDraft(name, { user: v }), "you@example.com"),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, t("card.senderNameLabel")),
                  fieldInput("text", draft.senderName, (v) => patchDraft(name, { senderName: v }), t("card.senderNamePlaceholder")),
                  h("div", { className: "dshe-hint" }, t("card.senderNameHint")),
                ]),
                // 认证方式只在「可能是 OAuth2」的账号上出现：给 QQ/163 用户多一个
                // 下拉框只是噪音。它是那条逃生舱的唯一面板入口——仍能用应用密码连
                // Exchange Online 的租户（混合/本地部署、SMTP AUTH 未关）靠它才不用
                // 去手改 YAML。
                (oauthCard || authKindOf(draft.provider) === "oauth2")
                  ? h("div", { className: "dshe-field" }, [
                      h("label", null, t("card.authKindLabel")),
                      h("select", {
                        value: draft.authKindSetting || "",
                        disabled: busy !== "",
                        onChange: (e) => patchDraft(name, {
                          authKindSetting: e.target.value,
                          // 「自动」= 不钉住：把裁决交回派生，isOauthDraft 会按
                          // provider 立刻切回对应的凭证区。
                          authKind: e.target.value === "" ? undefined : e.target.value,
                        }),
                      }, [
                        h("option", { key: "auto", value: "" }, t("card.authKindAuto")),
                        h("option", { key: "oauth2", value: "oauth2" }, t("card.authKindOAuth2")),
                        h("option", { key: "password", value: "password" }, t("card.authKindPassword")),
                      ]),
                      h("div", { className: "dshe-hint" }, t("card.authKindHint")),
                    ])
                  : null,
                // OAuth2 的服务商没有密码可填：这一格的凭证就是下面那块登录区。
                // 留着密码框只会让人以为「填了密码就能用」，而后端根本不会读它。
                oauthCard
                  ? h(OauthLoginPanel, {
                      draft: draft,
                      view: view,
                      session: oauthSession,
                      providerLabel: summary.label,
                      disabled: busy !== "" || oauthBusy,
                      starting: oauthBusy,
                      restarting: oauthBusy,
                      onStart: () => startOauth(name),
                      onCancel: () => cancelOauth(name),
                      onClientId: (v) => patchDraft(name, { clientId: v }),
                    })
                  : h(React.Fragment, null, [
                      h("div", { className: "dshe-field" }, [
                        h("label", null, t("card.passwordLabel")),
                        h("input", {
                          type: "password",
                          value: draft.password,
                          disabled: busy !== "",
                          placeholder: t("card.passwordPlaceholder"),
                          onChange: (e) => patchDraft(name, { password: e.target.value }),
                        }),
                        h("div", { className: "dshe-hint" },
                          view.hasPassword
                            ? t("card.passwordSaved")
                            : t("card.passwordHint")),
                      ]),
                      // 别名/中继：登录名与登录密码都只在密码类账号上有意义（OAuth2 用 token 登录）。
                      h("div", { className: "dshe-field" }, [
                        h("label", null, t("card.authUserLabel")),
                        fieldInput("text", draft.authUser, (v) => patchDraft(name, { authUser: v }), t("card.authUserPlaceholder")),
                        h("div", { className: "dshe-hint" }, t("card.authUserHint")),
                      ]),
                      h("div", { className: "dshe-field" }, [
                        h("label", null, t("card.authPasswordLabel")),
                        h("input", {
                          type: "password",
                          value: draft.authPassword,
                          disabled: busy !== "",
                          placeholder: t("card.passwordPlaceholder"),
                          onChange: (e) => patchDraft(name, { authPassword: e.target.value }),
                        }),
                        h("div", { className: "dshe-hint" },
                          view.hasAuthPassword
                            ? t("card.authPasswordSaved")
                            : t("card.authPasswordHint")),
                      ]),
                    ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, t("card.inboxLabel")),
                  fieldInput("text", draft.inboxFolder, (v) => patchDraft(name, { inboxFolder: v }), "INBOX"),
                ]),
              ]),
            ])
          : null,
      ]);
    }),

    h("div", { className: "dshe-actions" }, [
      h("button", { type: "button", className: "dshe-btn", onClick: addAccount, disabled: busy !== "" }, t("card.add")),
    ]),
    h("div", { className: "dshe-hint" },
      t("card.autoSaveHint") + (defaultMissing ? t("card.autoSaveHintNoDefault") : "")),
    notice
      ? h("div", { className: "dshe-alert " + notice.kind }, notice.text)
      : null,
  ]);
}

/**
 * 服务器预设编辑器。快照的 presets.custom 是卡片的数据源，YAML 是真相源；改动
 * 「编辑即保存」：每次改动序列化后抛给父级，由父级防抖落盘。
 * 预设不含凭证；内置的 8 个服务商不在这里编辑（它们由 PROVIDERS 定义）。
 */
function ServerPresetsEditor(props) {
  const presets = props.presets || { builtin: {}, custom: {} };
  const custom = presets.custom || {};

  const [drafts, setDrafts] = React.useState(() => presetDrafts(custom));
  // 同账号卡片：行 = { id, key }，id 是 React key，key 是预设名（YAML 的键）。
  const [order, setOrder] = React.useState(() => presetRows(Object.keys(custom)));
  /** 同账号卡片：最新草稿/顺序的镜像，改动处理函数一律从它读（见那边的说明）。 */
  const draftsRef = React.useRef(drafts);
  const orderRef = React.useRef(order);
  draftsRef.current = drafts;
  orderRef.current = order;
  const [open, setOpen] = React.useState(0);
  const [confirming, setConfirming] = React.useState(0);
  const [notice, setNotice] = React.useState(null);

  // 预设列表每次快照都是一个新对象：只依赖它的投影重建卡片。
  const listKey = Object.keys(custom).map((name) => {
    const entry = custom[name] || {};
    const imap = entry.imap || {};
    const smtp = entry.smtp || {};
    return [name, entry.label || "", imap.host || "", imap.port, imap.secure, smtp.host || "", smtp.port, smtp.secure].join(":");
  }).join("|");

  React.useEffect(() => {
    setDrafts(presetDrafts(custom));
    setOrder(presetRows(Object.keys(custom)));
    setOpen(0);
    setConfirming(0);
    // eslint-disable-next-line
  }, [listKey]);

  /**
   * 序列化 + 抛给父级。预设名缺失/重名、主机缺失、端口非法都在这里被拦下：只提示，
   * 不动父级的文本（半填状态不该把已保存的预设整片清掉）。
   */
  const autoSave = (nextDrafts, nextOrder) => {
    if (typeof props.onAutoSave !== "function") return;
    const result = serializePresetDrafts(nextOrder.map((row) => row.key), nextDrafts);
    if (result.error !== undefined) {
      setNotice({ kind: "error", text: result.error });
      return;
    }
    setNotice(null);
    props.onAutoSave(result.text);
  };

  const patchDraft = (key, patch) => {
    const next = Object.assign({}, draftsRef.current, { [key]: Object.assign({}, draftsRef.current[key], patch) });
    setDrafts(next);
    autoSave(next, orderRef.current);
  };

  const renameDraft = (oldKey, nextName) => {
    // 预设名就是 YAML 的键：映射键必须立刻跟着走，否则改名会留下旧键的孤儿。
    const next = {};
    for (const key of Object.keys(draftsRef.current)) {
      if (key === oldKey) continue;
      next[key] = draftsRef.current[key];
    }
    const entry = draftsRef.current[oldKey];
    if (entry !== undefined) next[nextName] = Object.assign({}, entry, { name: nextName });
    const nextOrder = rekeyRows(orderRef.current, oldKey, nextName);
    setDrafts(next);
    setOrder(nextOrder);
    autoSave(next, nextOrder);
  };

  const addPreset = () => {
    let n = orderRef.current.length + 1;
    let name = "preset" + n;
    while (Object.prototype.hasOwnProperty.call(draftsRef.current, name)) {
      n += 1;
      name = "preset" + n;
    }
    const next = Object.assign({}, draftsRef.current, { [name]: emptyPresetDraft(name) });
    const row = presetRows([name])[0];
    const nextOrder = orderRef.current.concat([row]);
    setDrafts(next);
    setOrder(nextOrder);
    setOpen(row.id);
    setConfirming(0);
    // 新预设还没有主机，autoSave 只会提示「还没填 IMAP 主机」，不会动文本。
    autoSave(next, nextOrder);
  };

  const removePreset = (id) => {
    const row = orderRef.current.filter((item) => item.id === id)[0];
    if (row === undefined) return;
    const key = row.key;
    const next = Object.assign({}, draftsRef.current);
    delete next[key];
    const nextOrder = orderRef.current.filter((item) => item.id !== id);
    setDrafts(next);
    setOrder(nextOrder);
    setConfirming(0);
    setOpen((cur) => (cur === id ? 0 : cur));
    autoSave(next, nextOrder);
  };

  const rebuiltCount = Object.keys(custom).length;

  return h("div", { className: "dshe-prst-list" }, [
    presets.error
      ? h("div", { className: "dshe-alert error" }, [
          t("preset.yamlParseFailed", { error: presets.error }),
          h("div", { className: "dshe-hint", style: { marginTop: 4 } },
            t("preset.yamlParseFailedHint")),
        ])
      : null,

    order.length === 0
      ? h("div", { className: "dshe-prst-empty" },
          rebuiltCount === 0
            ? t("preset.empty")
            : t("preset.cleared", { count: rebuiltCount }))
      : null,

    order.map((row) => {
      const id = row.id;
      const key = row.key;
      const draft = drafts[key];
      if (draft === undefined) return null;
      const name = String(draft.name === undefined || draft.name === null ? "" : draft.name);
      const trimmed = name.trim();
      const expanded = open === id;
      const renamed = trimmed !== key;
      const duplicate = trimmed !== "" && order.some((other) => other.key !== key && String((drafts[other.key] || {}).name || "").trim() === trimmed);
      const empty = trimmed === "";
      const label = String(draft.label || "").trim();
      return h("div", { key: id, className: "dshe-prst-card" }, [
        h("div", { className: "dshe-prst-head" }, [
          h("span", { className: "dshe-prst-name" }, trimmed || t("card.unnamed")),
          label === "" ? null : h("span", { className: "dshe-prst-badge" }, label),
          empty ? h("span", { className: "dshe-prst-badge todo" }, t("preset.badgeUnnamed")) : null,
          renamed ? h("span", { className: "dshe-prst-badge todo dshe-prst-warn" }, t("preset.badgeRenamed")) : null,
          duplicate ? h("span", { className: "dshe-prst-badge todo dshe-prst-warn" }, t("preset.badgeDuplicate")) : null,
          h("span", { className: "dshe-prst-actions" }, [
            h("button", {
              type: "button",
              className: "dshe-btn",
              onClick: () => setOpen(expanded ? 0 : id),
            }, expanded ? t("common.collapse") : t("common.edit")),
            h("button", {
              type: "button",
              className: "dshe-btn dshe-prst-danger",
              onClick: () => setConfirming(confirming === id ? 0 : id),
            }, t("common.delete")),
          ]),
        ]),
        h("div", { className: "dshe-prst-meta" },
          t("preset.metaImap", { host: draft.imap.host || t("preset.noHost"), port: portLabel(draft.imap.port) })
          + (draft.imap.secure === true ? t("preset.ssl") : t("preset.plain"))
          + t("preset.metaSmtp", { host: draft.smtp.host || t("preset.noHost"), port: portLabel(draft.smtp.port) })
          + (draft.smtp.secure === true ? t("preset.ssl") : t("preset.plain"))),
        confirming === id
          ? h("div", { className: "dshe-prst-confirm" }, [
              t("preset.confirmDelete", { name: trimmed || t("card.unnamed") }),
              h("span", { className: "dshe-actions" }, [
                h("button", { type: "button", className: "dshe-btn dshe-prst-danger", onClick: () => removePreset(id) }, t("common.confirmDelete")),
                h("button", { type: "button", className: "dshe-btn", onClick: () => setConfirming(0) }, t("common.cancel")),
              ]),
            ])
          : null,
        expanded
          ? h("div", { className: "dshe-prst-body" }, [
              h("div", { className: "dshe-grid" }, [
                h("div", { className: "dshe-field" }, [
                  h("label", null, t("preset.nameLabel")),
                  h("input", {
                    type: "text",
                    value: name,
                    placeholder: "corp",
                    onChange: (e) => renameDraft(key, e.target.value),
                  }),
                  h("div", { className: "dshe-hint" },
                    duplicate
                      ? h("span", { className: "dshe-prst-warn" }, t("preset.duplicateWarn"))
                      : t("preset.nameHint")),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, t("preset.labelLabel")),
                  fieldInput("text", draft.label, (v) => patchDraft(key, { label: v }), t("preset.labelPlaceholder")),
                ]),
              ]),
              h("div", { className: "dshe-grid" }, [
                h("div", { className: "dshe-field" }, [
                  h("label", null, t("preset.imapHostLabel")),
                  fieldInput("text", draft.imap.host, (v) => patchDraft(key, { imap: Object.assign({}, draft.imap, { host: v }) }), "imap.corp.com"),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, t("preset.imapPortLabel")),
                  h("input", {
                    type: "text",
                    inputMode: "numeric",
                    value: draft.imap.port,
                    placeholder: "993",
                    onChange: (e) => patchDraft(key, { imap: Object.assign({}, draft.imap, { port: e.target.value }) }),
                  }),
                  portTextProblem(draft.imap.port) === ""
                    ? h("div", { className: "dshe-hint" }, t("preset.imapPortHint"))
                    : h("div", { className: "dshe-hint dshe-prst-warn" }, t("preset.portProblem", { problem: portTextProblem(draft.imap.port) })),
                ]),
                h("label", { className: "dshe-check" }, [
                  h("input", {
                    type: "checkbox",
                    checked: draft.imap.secure === true,
                    onChange: (e) => patchDraft(key, { imap: Object.assign({}, draft.imap, { secure: e.target.checked }) }),
                  }),
                  t("preset.imapSsl"),
                ]),
              ]),
              h("div", { className: "dshe-grid" }, [
                h("div", { className: "dshe-field" }, [
                  h("label", null, t("preset.smtpHostLabel")),
                  fieldInput("text", draft.smtp.host, (v) => patchDraft(key, { smtp: Object.assign({}, draft.smtp, { host: v }) }), "smtp.corp.com"),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, t("preset.smtpPortLabel")),
                  h("input", {
                    type: "text",
                    inputMode: "numeric",
                    value: draft.smtp.port,
                    placeholder: "465",
                    onChange: (e) => patchDraft(key, { smtp: Object.assign({}, draft.smtp, { port: e.target.value }) }),
                  }),
                  portTextProblem(draft.smtp.port) === ""
                    ? h("div", { className: "dshe-hint" }, t("preset.smtpPortHint"))
                    : h("div", { className: "dshe-hint dshe-prst-warn" }, t("preset.portProblem", { problem: portTextProblem(draft.smtp.port) })),
                ]),
                h("label", { className: "dshe-check" }, [
                  h("input", {
                    type: "checkbox",
                    checked: draft.smtp.secure === true,
                    onChange: (e) => patchDraft(key, { smtp: Object.assign({}, draft.smtp, { secure: e.target.checked }) }),
                  }),
                  t("preset.smtpSsl"),
                ]),
              ]),
            ])
          : null,
      ]);
    }),

    h("div", { className: "dshe-actions" }, [
      h("button", { type: "button", className: "dshe-btn", onClick: addPreset }, t("preset.add")),
    ]),
    h("div", { className: "dshe-hint" },
      t("preset.footerHint") + t("card.autoSaveHint")),

    notice ? h("div", { className: "dshe-alert " + notice.kind }, notice.text) : null,
  ]);
}

function EmailSettingsSection() {
  const [draft, setDraft] = useState(null);
  const [snapshot, setSnapshot] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** 自动保存的可见状态：null 视同「已保存」（刚加载完、什么都没改）。 */
  const [saveState, setSaveState] = useState(null);
  /** 卡片级提示（注释丢失、序列化失败…）：走卡片自己的 notice 位，不打断顶部状态。 */
  const [cardsNotice, setCardsNotice] = useState(null);
  /**
   * 账号卡片的初始快照。只在 load 时取一次，保存之后**故意不刷新**：自动保存的
   * 往返若按新快照重建卡片，正在输入的密码框会被清空（用户接着打的就成了半截
   * 密码）。编辑期的卡片状态由卡片自己持有，要按 YAML 重建就点那个按钮。
   */
  const [cardsDetail, setCardsDetail] = useState(undefined);
  /**
   * 服务器预设的初始快照（同样只在 load 时取一次）。预设编辑器的卡片列表由它派生：
   * 自动保存的往返若让列表跟着快照重建，用户正在填的那张卡会被收起、未提交的字段
   * 会被旧值盖掉。账号卡片要的是「最新端点」，所以它们另走 live 快照 + customNames。
   */
  const [presetsAtLoad, setPresetsAtLoad] = useState(undefined);
  /**
   * 刚保存成功的预设名。端点仍以快照为准，这里只让「新预设名」先一步出现在账号卡片
   * 的服务商下拉里 —— 不然要等下一次 GET 才看得到自己刚加的名字。
   */
  const [customNames, setCustomNames] = useState([]);

  /** 最近一次成功保存/序列化后的 accountsYaml 原文：serializeAccounts 的种子（注释保留链）。 */
  const savedYamlRef = useRef(null);
  /** 当前该写进 value.accountsYaml 的文本（卡片序列化产物优先）。 */
  const accountsYamlRef = useRef(null);
  /** 已落盘的 value 签名：和当前值一样就不重复提交（加载完不会立刻白存一次）。 */
  const savedSignatureRef = useRef(null);
  /** 已排队/正在飞的签名：防止「刚 flush 完，effect 又排一次同样的值」。 */
  const pendingSignatureRef = useRef(null);
  const saveTimerRef = useRef(0);
  /** 每次「改动 / 开始保存」都 +1：结果回来时对不上就说明用户又改过了。 */
  const seqRef = useRef(0);
  const draftRef = useRef(null);
  const snapshotRef = useRef(undefined);
  draftRef.current = draft;
  snapshotRef.current = snapshot;

  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const snap = await api();
      setSnapshot(snap);
      const value = (snap && snap.settings && snap.settings.value) || EMPTY;
      const next = {
        ...EMPTY,
        ...value,
        imap: { ...EMPTY.imap, ...(value.imap || {}) },
        smtp: { ...EMPTY.smtp, ...(value.smtp || {}) },
      };
      setDraft(next);
      // 新快照 = 新的 accountsYaml 基线：卡片产物作废，签名对齐，免得回存一次。
      savedYamlRef.current = next.accountsYaml || "";
      accountsYamlRef.current = next.accountsYaml || "";
      savedSignatureRef.current = signatureOf(next, next.accountsYaml || "");
      setSaveState(null);
      setCardsNotice(null);
      setCustomNames(presetNamesOf(next.serverPresets));
      setCardsDetail(snap.accountsDetail);
      setPresetsAtLoad(snap.presets);
    } catch (e) {
      setError(e && e.message ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (patch) => setDraft((cur) => Object.assign({}, cur, patch));

  /**
   * 防抖排期。immediate = 明确动作（确认删除 / 登录前落盘），立刻落盘、不等那 800ms。
   * immediate 时把落盘的 promise 交出去，调用方要等「真的写完了」可以先 await 它；
   * 防抖那条路交不出 promise（定时器还没到点），返回 null。
   */
  const scheduleSave = (immediate) => {
    // 用户又改了：还在飞的那次保存结果就作废，别拿旧结果盖住新状态。
    seqRef.current += 1;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (immediate === true) {
      saveTimerRef.current = 0;
      return flushSave();
    }
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = 0;
      flushSave();
    }, SAVE_DEBOUNCE_MS);
    return null;
  };

  /**
   * 落盘。读到的是 ref 里的最新值，所以「最后一次防抖周期」写的一定是用户最新的字。
   */
  const flushSave = async () => {
    const cur = draftRef.current;
    if (cur === null) return;
    if (snapshotRef.current && snapshotRef.current.writable === false) return;
    const seq = ++seqRef.current;
    const value = settingsValueOf(cur, accountsYamlRef.current === null ? (cur.accountsYaml || "") : accountsYamlRef.current);
    pendingSignatureRef.current = signatureOf(cur, value.accountsYaml);
    setSaveState({ kind: "busy" });
    try {
      const rev = snapshotRef.current && snapshotRef.current.settings ? snapshotRef.current.settings.revision : 0;
      let snap;
      try {
        snap = await api("save", { value, expectedRevision: rev });
      } catch (e) {
        // Another writer moved the revision. Re-read it — and only it: the
        // snapshot's draft fields are somebody else's truth, while the keystrokes
        // in `value` are the user's. Retrying with the stale revision, which is
        // what a bare retry button does, would conflict forever.
        if (!e || e.code !== "settings-conflict") throw e;
        const fresh = await api();
        const rebased = fresh && fresh.settings ? fresh.settings.revision : rev;
        snap = await api("save", { value, expectedRevision: rebased });
      }
      savedYamlRef.current = value.accountsYaml;
      savedSignatureRef.current = signatureOf(cur, value.accountsYaml);
      pendingSignatureRef.current = savedSignatureRef.current;
      if (seq !== seqRef.current) {
        // 保存期间又改过：只吸收新 revision（否则下一次保存会拿旧 revision 撞车），
        // 其余一律不动 —— 快照里的 accountsDetail / presets 是「上一次的值」，
        // 用它重建会把用户正在打的字盖掉。状态指示交给新一轮防抖周期。
        setSnapshot((old) => Object.assign({}, old, {
          settings: snap.settings,
          writable: snap.writable,
        }));
        return;
      }
      setSnapshot(snap);
      setSaveState({ kind: "saved" });
      const nextNames = presetNamesOf(value.serverPresets);
      setCustomNames((old) => (old.join("|") === nextNames.join("|") ? old : nextNames));
    } catch (e) {
      if (seq !== seqRef.current) return;
      // 失败时清掉「正在飞」的签名，否则同一个值再也不会被重排（点重试即可再存）。
      pendingSignatureRef.current = null;
      setSaveState({ kind: "error", text: e && e.message ? e.message : String(e) });
    }
  };

  // 唯一的自动保存触发点：draft 变了就排一次防抖（不含 revision，不会自激）。
  useEffect(() => {
    if (draft === null) return undefined;
    if (snapshotRef.current && snapshotRef.current.writable === false) return undefined;
    const text = accountsYamlRef.current === null ? (draft.accountsYaml || "") : accountsYamlRef.current;
    const signature = signatureOf(draft, text);
    // 已落盘、或正在飞的就是这份值 → 不重复提交。
    if (signature === savedSignatureRef.current) return undefined;
    if (signature === pendingSignatureRef.current) return undefined;
    scheduleSave(false);
    return undefined;
    // eslint-disable-next-line
  }, [draft]);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  // 有没落盘的内容（保存中或保存失败）才拦离开：这正是「编辑即保存」剩下的窗口。
  useEffect(() => {
    const guard = (e) => {
      if (saveState === null || saveState.kind === "saved") return undefined;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [saveState]);

  /** 卡片序列化的往返序号：打字快时多个 serializeAccounts 会并发，只认最后一个。 */
  const cardsSeqRef = useRef(0);

  /**
   * 卡片快照 -> YAML 文本。种子用最近一次落盘的原文，注释能保就保。
   *
   * serverPresets 必须随行：账号只存 provider id，后端要认「这个自定义预设名是不是
   * 合法名字」只能查预设表。不带的话，一个刚定义、还没落盘的自定义预设名会被当成
   * 未知名字丢掉，账号的 provider 键就白选了。这里发的是「当前正在编辑的这份文本」，
   * 而不是已落盘的那份。
   */
  const serializeCards = async (cards, defaultAccount) => {
    const seed = savedYamlRef.current === null
      ? (draftRef.current ? draftRef.current.accountsYaml || "" : "")
      : savedYamlRef.current;
    const serverPresets = draftRef.current && typeof draftRef.current.serverPresets === "string"
      ? draftRef.current.serverPresets
      : "";
    return api("serializeAccounts", {
      accountsYaml: seed,
      accounts: cards,
      defaultAccount: defaultAccount || "",
      serverPresets,
    });
  };

  /**
   * 卡片改动：先序列化，再交给同一条防抖管道保存（immediate = 删除这类明确动作）。
   * 返回 { ok } 而不是抛：调用方大多忽略它，只有 OAuth 登录前那次要等「真的写完了」，
   * 而又没有任何地方需要为一个后台保存失败去 catch（失败由状态条 / 卡片提示说）。
   */
  const onCardsAutoSave = async (cards, defaultAccount, immediate) => {
    const seq = ++cardsSeqRef.current;
    try {
      const result = await serializeCards(cards, defaultAccount);
      if (seq !== cardsSeqRef.current) return { ok: false, reason: "superseded" }; // 更晚的一次已经在路上，别用旧结果盖新状态
      const text = result && typeof result.accountsYaml === "string" ? result.accountsYaml : "";
      accountsYamlRef.current = text;
      update({ accountsYaml: text });
      setCardsNotice(
        result.commentsDropped || result.passwordsDropped
          ? {
            kind: "info",
            text: (result.commentsDropped ? t("notice.commentsDropped") : "")
              + (result.passwordsDropped ? t("notice.passwordsDropped") : "")
              + t("notice.restSaved"),
          }
          : null,
      );
      // immediate 时 scheduleSave 把落盘的 promise 交出来，等它才算「写完了」。
      const flushed = scheduleSave(immediate === true);
      if (flushed && typeof flushed.then === "function") await flushed;
      return { ok: true };
    } catch (e) {
      const message = e && e.message ? e.message : String(e);
      setCardsNotice({ kind: "error", text: t("notice.cardsNotWritten", { message }) });
      return { ok: false, reason: message };
    }
  };

  /**
   * 卡片「测试连接」：先把卡片序列化成 YAML，再用整份表单去测。
   * 历史 bug 是这里只送了 accountsYaml —— 表单里的 provider/邮箱地址根本没进请求。
   * 现在唯一的 test 入口就是卡片上的按钮：单账户表单没了，顶部那个「测试连接」
   * 也就没有「测哪个账号」可言，一并去掉。
   */
  const onCardTest = async (accountName, cards, defaultAccount) => {
    const result = await serializeCards(cards, defaultAccount);
    const text = result && typeof result.accountsYaml === "string" ? result.accountsYaml : "";
    const value = settingsValueOf(draftRef.current, text);
    return api("test", { value, account: accountName });
  };

  if (draft === null) {
    return h("div", { className: "dshe-settings" }, [
      h("div", { className: "dshe-alert info" }, busy ? t("common.loading") : (error || t("common.loading"))),
    ]);
  }

  const accounts = snapshot && snapshot.accounts ? snapshot.accounts : [];
  const presetsMerged = presetsWithNames((snapshot && snapshot.presets) || undefined, customNames);
  const statusText = saveState === null
    ? t("status.saved")
    : saveState.kind === "busy"
      ? t("status.saving")
      : saveState.kind === "saved"
        ? t("status.saved")
        : t("status.saveFailed", { message: saveState.text });
  const status = h("span", {
    className: "dshe-auto-status" + (saveState === null ? "" : " is-" + saveState.kind),
    onClick: saveState !== null && saveState.kind === "error" ? () => flushSave() : undefined,
    style: saveState !== null && saveState.kind === "error" ? { cursor: "pointer" } : undefined,
  }, statusText);

  return h("div", { className: "dshe-settings" }, [
    h("header", { className: "dshe-header" }, [
      h("span", { className: "dshe-kicker" }, "dsh-email · IMAP/SMTP"),
      h("h2", null, t("section.title")),
      h("p", null, t("section.intro")),
    ]),
    status,
    h("section", { className: "dshe-panel" }, [
      // 全局设置：发信确认和下载目录对所有账号一视同仁，不属于任何一张卡片，
      // 所以摆在卡片列表上方，而不是塞进某一张卡里。
      h("div", { className: "dshe-global" }, [
        h("label", { className: "dshe-check" }, [
          h("input", {
            type: "checkbox",
            checked: draft.sendApproval === true,
            onChange: (e) => update({ sendApproval: e.target.checked }),
          }),
          t("global.sendApproval"),
        ]),
        h("div", { className: "dshe-field" }, [
          h("label", null, t("global.downloadDirLabel")),
          fieldInput("text", draft.downloadDir, (v) => update({ downloadDir: v }), t("global.downloadDirPlaceholder")),
        ]),
        h("div", { className: "dshe-hint" }, t("global.hint")),
      ]),
      h(AccountCardsEditor, {
        detail: cardsDetail,
        presets: presetsMerged,
        extraNotice: cardsNotice,
        onAutoSave: onCardsAutoSave,
        onTest: onCardTest,
        // OAuth2 登录成功后重拉整份快照：卡片的 authKind/oauthState/oauthUser 是
        // 服务端算出来的，只有新快照才拿得到（和加载走同一条路径）。
        onReload: load,
      }),
      h("details", { className: "dshe-details dshe-prst-section" }, [
        h("summary", null, t("preset.sectionTitle")),
        h(ServerPresetsEditor, {
          presets: presetsAtLoad,
          onAutoSave: (text) => update({ serverPresets: typeof text === "string" ? text : "" }),
        }),
      ]),
      snapshot && snapshot.writable === false
        ? h("div", { className: "dshe-alert info" }, t("section.readonly"))
        : null,
    ]),
    error ? h("div", { className: "dshe-alert error" }, error) : null,
    accounts.length > 0
      ? h("div", { className: "dshe-hint" }, t("section.activeAccounts", { accounts: accounts.join(t("common.listSeparator")) }))
      : null,
  ]);
}

// Whale-girl courier popup: polls the same-origin watch route every 30s.
// The first poll seeds the baseline silently; later polls pop a card only
// when newCount > 0. The artwork URL/credit come from the settings snapshot
// (skin artwork is served from the user's local dsh-deep-whale install with
// its CC BY-NC-SA attribution chain; otherwise a built-in fallback is used).
function startWhaleWidget() {
  if (document.querySelector("#dsh-email-whale-root")) return () => {};
  const root = document.createElement("div");
  root.id = "dsh-email-whale-root";
  root.className = "dshe-whale-root";
  document.body.appendChild(root);
  let pollTimer = 0;
  let hideTimer = 0;
  let whaleUrl = "";
  let whaleCredit = "";
  /** 当前弹窗的数据。语言切了就靠它原样重画一遍，无需再拉一次接口。 */
  let current = null;

  const closePopup = () => {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = 0; }
    root.replaceChildren();
  };

  const showPopup = (value) => {
    current = value;
    closePopup();
    const card = document.createElement("div");
    card.className = "dshe-whale-card";
    if (whaleUrl) {
      const img = document.createElement("img");
      img.className = "dshe-whale-img";
      img.src = whaleUrl;
      img.alt = "";
      img.onerror = () => { img.remove(); };
      card.appendChild(img);
    }
    const body = document.createElement("div");
    body.className = "dshe-whale-body";
    const title = document.createElement("div");
    title.className = "dshe-whale-title";
    title.textContent = t("whale.title", { count: value.newCount });
    body.appendChild(title);
    (value.messages || []).slice(0, 3).forEach((m) => {
      const row = document.createElement("div");
      row.className = "dshe-whale-item";
      const who = (m.from || []).map((a) => a.name || a.address).filter(Boolean).join(", ") || t("whale.unknownSender");
      row.textContent = t("whale.row", { who, subject: m.subject || t("whale.noSubject") });
      body.appendChild(row);
    });
    if (value.newCount > 3) {
      const more = document.createElement("div");
      more.className = "dshe-whale-item";
      more.textContent = t("whale.more", { count: value.newCount - 3 });
      body.appendChild(more);
    }
    if (whaleCredit) {
      const credit = document.createElement("div");
      credit.className = "dshe-whale-credit";
      credit.textContent = whaleCredit;
      body.appendChild(credit);
    }
    card.appendChild(body);
    const closeBtn = document.createElement("button");
    closeBtn.className = "dshe-whale-close";
    closeBtn.textContent = "\u2715";
    closeBtn.setAttribute("aria-label", t("whale.close"));
    closeBtn.onclick = closePopup;
    card.appendChild(closeBtn);
    root.appendChild(card);
    hideTimer = setTimeout(closePopup, 12000);
  };

  // 轮询策略：页面不可见时完全不打扰邮箱服务器；失败指数退避（上限 10 分钟），
  // 成功立刻回到 30s；快照（皮肤 / 账号列表）变化很慢，最多 10 分钟刷新一次。
  const POLL_MS = 30000;
  const SNAPSHOT_MS = 600000;
  const MAX_BACKOFF_MS = 600000;
  let failures = 0;
  let lastSnapshot = 0;
  let hasAccounts = true;

  const tick = async () => {
    if (document.hidden) return;
    try {
      if (!hasAccounts || Date.now() - lastSnapshot > SNAPSHOT_MS) {
        const snap = await api();
        lastSnapshot = Date.now();
        if (snap && snap.whale) {
          whaleUrl = snap.whale.url || "";
          whaleCredit = snap.whale.credit || "";
        }
        hasAccounts = !!(snap && snap.accounts && snap.accounts.length > 0);
      }
      if (!hasAccounts) return;
      const value = await api("watch", { limit: 5 });
      if (value && value.newCount > 0) showPopup(value);
      failures = 0;
    } catch (e) {
      // Not configured or transient error: stay silent and back off.
      failures = Math.min(failures + 1, 8);
    }
  };

  const schedule = () => {
    clearTimeout(pollTimer);
    if (document.hidden) return; // 回到前台时 onVisibility 会立刻补一次
    const delay = failures === 0 ? POLL_MS : Math.min(POLL_MS * Math.pow(2, failures - 1), MAX_BACKOFF_MS);
    pollTimer = setTimeout(() => { void tick().then(schedule); }, delay);
  };

  const onVisibility = () => {
    clearTimeout(pollTimer);
    if (document.hidden) return;
    failures = 0;
    void tick().then(schedule);
  };
  document.addEventListener("visibilitychange", onVisibility);
  void tick().then(schedule);
  // 弹窗是命令式 DOM，没有 React 那层重渲染：语言切换后自己重画一次（开着的才重画）。
  relocalize = () => { if (current !== null && root.childElementCount > 0) showPopup(current); };
  return () => {
    clearTimeout(pollTimer);
    document.removeEventListener("visibilitychange", onVisibility);
    if (hideTimer) clearTimeout(hideTimer);
    relocalize = null;
    root.remove();
  };
}

// 'locale' 在这里是**硬依赖**（cordis 语义：inject 里列了就等于「缺它就不启动」，
// 服务缺席时 fiber 停在 pending，apply 根本不会被调用）。官方每个带 UI 文案的插件
// 都这么写，本插件照抄：Web profile 的 bundle 无条件提供 locale 这一行。
//
// 那下面为什么还要那一整套存在性判断？因为它挡的不是「服务没列进 compose」，而是
// 「服务在，但不是这个形状」——旧 ctx 没有 get()、getSnapshot/subscribe 由别的包
// 提供且行为不同、测试里塞进来的替身只有一半。这些是 subscribeLocale 真正兜住的东西，
// 兜不住也不会连带把 settings 段和鲸鱼娘一起拖垮。
const inject = ["slots", "locale"];

function apply(ctx) {
  // 语言要在任何 t() 之前定下来：槽位的 label thunk 和鲸鱼娘都在挂载时就取文案。
  ctx.effect(() => subscribeLocale(ctx), "dsh-email: locale");

  ctx.effect(() => {
    const id = "dsh-email/client";
    if (document.querySelector('style[data-plugin-css="' + id + '"]')) return () => {};
    const style = document.createElement("style");
    style.dataset.plugin = "dsh-email";
    style.dataset.pluginCss = id;
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, "dsh-email: styles");

  ctx.effect(() => startWhaleWidget(), "dsh-email: whale courier");

  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "dsh-email",
    order: 45,
    label: () => t("nav.title"),
    inject: () => ({}),
  }, EmailSettingsSection));
}

exports.apply = apply;
exports.inject = inject;

return module.exports;
}});
