window.__ModuleLoader__.load({ id: "dsh-email", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const React = require("react");
const { useState, useEffect, useCallback } = React;
const h = React.createElement;

const ROUTE = "/_dsh/dsh-email/settings";

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
    throw new Error((body && body.error && body.error.message) || ("request failed " + res.status));
  }
  return body.value;
}

const PROVIDERS = [
  ["qq", "QQ 邮箱"],
  ["163", "163 邮箱"],
  ["126", "126 邮箱"],
  ["sina", "新浪邮箱"],
  ["aliyun", "阿里邮箱"],
  ["gmail", "Gmail"],
  ["outlook", "Outlook"],
  ["icloud", "iCloud"],
  ["", "自定义（手填 IMAP/SMTP）"],
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
  ".dshe-actions{display:flex;gap:8px;flex-wrap:wrap}",
  ".dshe-btn{display:inline-flex;align-items:center;height:32px;padding:0 14px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,#dedbd5);background:var(--dsw-alias-button-elevated-fill,transparent);color:inherit;font-size:13px;font-weight:600;cursor:pointer}",
  ".dshe-btn.primary{background:var(--dsw-alias-button-primary-fill,#0b6c9f);border-color:var(--dsw-alias-button-primary-fill,#0b6c9f);color:var(--dsw-alias-label-primary-foreground,#fff)}",
  ".dshe-btn.primary:hover{background:var(--dsw-alias-button-primary-hover,#0b6c9f);border-color:var(--dsw-alias-button-primary-hover,#0b6c9f)}",
  ".dshe-btn:disabled{opacity:.55;cursor:default}",
  ".dshe-alert{padding:10px 12px;border-radius:10px;font-size:12px;line-height:1.5;border:1px solid transparent}",
  ".dshe-alert.error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 10%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#aa3939) 22%,transparent);color:var(--dsw-alias-state-error-primary,#aa3939)}",
  ".dshe-alert.success{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 10%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#267d52) 22%,transparent);color:var(--dsw-alias-state-success-primary,#267d52)}",
  ".dshe-alert.info{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#0b5c86) 8%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#0b5c86) 20%,transparent);color:var(--dsw-alias-state-business-primary,#0b5c86)}",
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
  ".dshe-acc-adv{margin-top:2px}",
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
].join("\n");

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

/** 「自定义（手填 IMAP/SMTP）」在下拉里的哨兵值：它不是一个真的 provider 名。 */
const CUSTOM_PROVIDER = "__dshe_custom__";

/** 新卡片的空草稿；imap/smtp 用空 host，等用户选预设或手填。 */
function emptyAccountDraft(name) {
  return {
    name: name === undefined ? "" : name,
    provider: "",
    user: "",
    password: "",
    inboxFolder: "INBOX",
    imap: { host: "", port: 993, secure: true },
    smtp: { host: "", port: 465, secure: true },
  };
}

/** 服务端卡片（永不含密码明文）-> 草稿。user 为空表示「就留空」，不是未加载。 */
function draftFromCard(card) {
  return {
    name: String(card.name || ""),
    provider: card.provider === undefined || card.provider === null ? "" : String(card.provider),
    user: card.user === undefined || card.user === null ? "" : String(card.user),
    password: "",
    inboxFolder: card.inboxFolder === undefined || card.inboxFolder === null ? "INBOX" : String(card.inboxFolder),
    imap: {
      host: (card.imap && card.imap.host) || "",
      port: card.imap && card.imap.port ? card.imap.port : 993,
      secure: !card.imap || card.imap.secure !== false,
    },
    smtp: {
      host: (card.smtp && card.smtp.host) || "",
      port: card.smtp && card.smtp.port ? card.smtp.port : 465,
      secure: !card.smtp || card.smtp.secure !== false,
    },
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

/** 下拉的选项集合：8 个内置 + serverPresets 里的自定义名 + 自定义哨兵。 */
function providerOptions(presets) {
  // PROVIDERS 的最后一项是空串的「自定义」，它的选项在这里由哨兵代替。
  const out = PROVIDERS.filter(([value]) => value !== "").map(([value, label]) => ({ value, label }));
  const custom = (presets && presets.custom) || {};
  for (const name of Object.keys(custom)) {
    if (name === "") continue;
    out.push({ value: name, label: name + "（自定义预设）" });
  }
  out.push({ value: CUSTOM_PROVIDER, label: "自定义（手填 IMAP/SMTP）" });
  return out;
}

/** 预设名 -> 端点；内置预设在前端就是权威定义，自定义预设取快照里的。 */
function providerPreset(presets, provider) {
  if (provider === undefined || provider === null || provider === "") return undefined;
  const builtin = PROVIDERS.filter(([value]) => value !== "").map(([value]) => value);
  const custom = (presets && presets.custom && presets.custom[provider]) || undefined;
  if (custom) return custom;
  return builtin.indexOf(provider) >= 0 ? { builtin: true } : undefined;
}

/**
 * 选中预设后填端点。内置预设的具体 host 由后端补（卡片上没填 take 预设值），
 * 这里只把端口/SSL 调成预设的样子；用户手填过 host 就保留，预设只是脚手架。
 */
const BUILTIN_PORTS = {
  qq: [993, 465], "163": [993, 465], "126": [993, 465], sina: [993, 465],
  aliyun: [993, 465], gmail: [993, 465], outlook: [993, 587], icloud: [993, 587],
};

function applyPreset(draft, presets, provider) {
  if (provider === "" || provider === CUSTOM_PROVIDER) {
    return Object.assign({}, draft, { provider: provider === CUSTOM_PROVIDER ? "" : provider });
  }
  const ports = BUILTIN_PORTS[provider];
  const custom = providerPreset(presets, provider);
  let imap = draft.imap;
  let smtp = draft.smtp;
  if (ports) {
    imap = Object.assign({}, imap, { port: ports[0], secure: true });
    smtp = Object.assign({}, smtp, { port: ports[1], secure: ports[1] === 465 });
  }
  if (custom && !custom.builtin && custom.imap) {
    imap = Object.assign({}, imap, {
      host: imap.host || custom.imap.host || "",
      port: typeof custom.imap.port === "number" ? custom.imap.port : imap.port,
      secure: typeof custom.imap.secure === "boolean" ? custom.imap.secure : imap.secure,
    });
  }
  if (custom && !custom.builtin && custom.smtp) {
    smtp = Object.assign({}, smtp, {
      host: smtp.host || custom.smtp.host || "",
      port: typeof custom.smtp.port === "number" ? custom.smtp.port : smtp.port,
      secure: typeof custom.smtp.secure === "boolean" ? custom.smtp.secure : smtp.secure,
    });
  }
  return Object.assign({}, draft, { provider, imap, smtp });
}

/**
 * 草稿 -> serializeAccounts 的输入。密码三态在这里定型：'' 或 untouched 都不带
 * password 键（继承已存密码），只有用户真的打了字才写进去。
 */
function draftToInput(draft) {
  const input = {
    name: draft.name,
    user: draft.user,
    inboxFolder: draft.inboxFolder,
    imap: {
      host: draft.imap.host || "",
      port: Number(draft.imap.port) || 0,
      secure: draft.imap.secure === true,
    },
    smtp: {
      host: draft.smtp.host || "",
      port: Number(draft.smtp.port) || 0,
      secure: draft.smtp.secure === true,
    },
  };
  if (draft.provider) input.provider = draft.provider;
  if (draft.password) input.password = draft.password;
  return input;
}

/** 半填账号不阻断保存：只把「还没填这件事」标出来。 */
function accountIncomplete(draft) {
  return String(draft.name || "").trim() === "" || String(draft.user || "").trim() === "";
}

/** 改过名字后草稿要跟着键走：旧键删掉，整份草稿（含 imap/smtp）搬到新键下。 */
function renameDrafts(drafts, oldName, nextName) {
  const next = {};
  for (const key of Object.keys(drafts)) {
    if (key === oldName) continue;
    next[key] = drafts[key];
  }
  const entry = drafts[oldName];
  if (entry !== undefined) next[nextName] = Object.assign({}, entry, { name: nextName });
  return next;
}

/** 卡片徽标：内置服务商用中文名，自定义/未知一律「自定义」。 */
function accountSummary(draft, presets) {
  const provider = draft.provider || "";
  const entry = PROVIDERS.filter(([value]) => value !== "").filter(([value]) => value === provider)[0];
  if (entry) return { label: entry[1], isCustom: false };
  if (provider !== "" && providerPreset(presets, provider) !== undefined) {
    return { label: provider, isCustom: true };
  }
  return { label: "自定义", isCustom: true };
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
  if (!/^[0-9]+$/.test(text)) return "端口必须是数字";
  const n = Number(text);
  if (n < 1 || n > 65535) return "端口必须在 1-65535 之间";
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
    if (name === "") return { error: "有预设还没填名称（预设名就是 YAML 的键）。" };
    if (Object.prototype.hasOwnProperty.call(seen, name)) {
      return { error: "有两张预设卡都叫「" + name + "」：预设名是 YAML 的键，不能重名。" };
    }
    seen[name] = true;
    const label = String(draft.label === undefined || draft.label === null ? "" : draft.label).trim();
    const imapHost = String(draft.imap.host || "").trim();
    const smtpHost = String(draft.smtp.host || "").trim();
    if (imapHost === "") return { error: "预设「" + name + "」还没填 IMAP 主机。" };
    if (smtpHost === "") return { error: "预设「" + name + "」还没填 SMTP 主机。" };
    const imapProblem = portTextProblem(draft.imap.port);
    if (imapProblem !== "") return { error: "预设「" + name + "」的 IMAP " + imapProblem + "。" };
    const smtpProblem = portTextProblem(draft.smtp.port);
    if (smtpProblem !== "") return { error: "预设「" + name + "」的 SMTP " + smtpProblem + "。" };
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
 * 卡片编辑器。YAML 是唯一的真相源：卡片列表只在「加载 / 解析 YAML」时从
 * accountsDetail 重建，保存时 serializeAccounts 的结果再写回 textarea。
 * 不做实时双向同步 —— 手改 YAML 后要点「从 YAML 解析」才刷新卡片。
 */
function AccountCardsEditor(props) {
  const value = props.value;
  const presets = props.presets || { builtin: {}, custom: {} };
  const detail = props.detail || { raw: {}, list: [] };
  const cards = detail.list || [];

  const [drafts, setDrafts] = React.useState(() => draftsFromCards(cards));
  const [order, setOrder] = React.useState(() => cards.map((c) => String(c.name)));
  const [open, setOpen] = React.useState("");
  const [defaultAccount, setDefaultAccount] = React.useState(detail.defaultAccount || "");
  const [confirming, setConfirming] = React.useState("");
  const [yamlOpen, setYamlOpen] = React.useState(false);
  const [busy, setBusy] = React.useState("");
  const [rowStatus, setRowStatus] = React.useState({});
  const [notice, setNotice] = React.useState(null);

  const listKey = cards.map((c) => String(c.name) + ":" + c.isDefault).join("|") + "|" + (detail.defaultAccount || "");

  React.useEffect(() => {
    setDrafts(draftsFromCards(cards));
    setOrder(cards.map((c) => String(c.name)));
    setOpen("");
    setConfirming("");
    setDefaultAccount(detail.defaultAccount || "");
    // 详情对象每次快照都是新的：只依赖它的投影，免得无谓重建草稿。
    // eslint-disable-next-line
  }, [listKey]);

  const seed = value.accountsYaml || "";
  const dirtyRef = React.useRef(false);
  React.useEffect(() => {
    if (detail.error) setYamlOpen(true);
  }, [detail.error]);

  // 卡片改动在「写入 YAML」之前只活在 React state 里，刷新页面就没了：留一道确认。
  React.useEffect(() => {
    const guard = (e) => {
      if (!dirtyRef.current) return undefined;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);

  const patchDraft = (name, patch) => {
    dirtyRef.current = true;
    setDrafts((cur) => Object.assign({}, cur, { [name]: Object.assign({}, cur[name], patch) }));
  };

  const renameDraft = (oldName, nextName) => {
    // 映射键必须立刻跟着名字走，否则「改名 → 保存」会在 YAML 里留下旧键的孤儿。
    dirtyRef.current = true;
    setDrafts((cur) => renameDrafts(cur, oldName, nextName));
    setOrder((cur) => cur.map((name) => (name === oldName ? nextName : name)));
    setDefaultAccount((cur) => (cur === oldName ? nextName : cur));
    setOpen((cur) => (cur === oldName ? nextName : cur));
    setConfirming((cur) => (cur === oldName ? "" : cur));
  };

  const addAccount = () => {
    dirtyRef.current = true;
    let n = Object.keys(drafts).length + 1;
    let name = "account" + n;
    while (Object.prototype.hasOwnProperty.call(drafts, name)) {
      n += 1;
      name = "account" + n;
    }
    setDrafts((cur) => Object.assign({}, cur, { [name]: emptyAccountDraft(name) }));
    setOrder((cur) => cur.concat([name]));
    setOpen(name);
    setYamlOpen(false);
  };

  const removeAccount = (name) => {
    dirtyRef.current = true;
    setDrafts((cur) => {
      const next = Object.assign({}, cur);
      delete next[name];
      return next;
    });
    setOrder((cur) => cur.filter((item) => item !== name));
    setDefaultAccount((cur) => (cur === name ? "" : cur));
    setConfirming("");
    setOpen((cur) => (cur === name ? "" : cur));
  };

  const resetFromDetail = (clearDirty) => {
    if (clearDirty !== false) dirtyRef.current = false;
    setDrafts(draftsFromCards(cards));
    setOrder(cards.map((c) => String(c.name)));
    setDefaultAccount(detail.defaultAccount || "");
    setOpen("");
    setConfirming("");
    setRowStatus({});
  };

  const fromYaml = async () => {
    setBusy("parse");
    try {
      const result = await api("parseAccounts", { value: { accountsYaml: value.accountsYaml || "" } });
      const list = result.list || [];
      setDrafts(draftsFromCards(list));
      setOrder(list.map((card) => String(card.name)));
      setDefaultAccount(result.defaultAccount || "");
      setOpen("");
      setConfirming("");
      setRowStatus({});
      // 卡片现在精确对应 textarea 里的 YAML，不再有「未写入」的改动。
      dirtyRef.current = false;
      setNotice(result.error ? { kind: "error", text: result.error } : { kind: "success", text: "已按 YAML 重建 " + list.length + " 张账号卡片。" });
    } catch (e) {
      setNotice({ kind: "error", text: "解析失败：" + (e && e.message ? e.message : String(e)) });
    } finally {
      setBusy("");
    }
  };

  /** 传的是卡片上的「当前账号名」（可能刚改过名），行内提示按它归类。 */
  const testCard = async (draftName) => {
    setBusy(draftName);
    setRowStatus((cur) => Object.assign({}, cur, { [draftName]: { kind: "busy", text: "测试中…" } }));
    try {
      const result = await api("test", {
        value: { ...value, accountsYaml: seed },
        account: draftName,
      });
      setRowStatus((cur) => Object.assign({}, cur, {
        [draftName]: { kind: "success", text: "连接成功（" + result.ms + " ms）· " + result.imapHost + ":" + result.imapPort },
      }));
    } catch (e) {
      setRowStatus((cur) => Object.assign({}, cur, {
        [draftName]: { kind: "error", text: "连接失败：" + (e && e.message ? e.message : String(e)) },
      }));
    } finally {
      setBusy("");
    }
  };

  const writeYaml = async () => {
    setBusy("save");
    setNotice(null);
    try {
      // 卡片列表就是用户想要的完整集合：顺序来自 order，内容来自 drafts（键已
      // 随改名同步）。半填的账号照写不误 —— 这正是草稿的意义。
      const names = order.filter((name) => Object.prototype.hasOwnProperty.call(drafts, name));
      const built = names.map((name) => draftToInput(drafts[name]));
      if (built.some((card) => String(card.name || "").trim() === "")) {
        throw new Error("有账号还没填账号名。");
      }
      if (built.some((card) => card.name === "defaultAccount")) {
        throw new Error("账号名不能是 defaultAccount（该键保留给默认账号）。");
      }
      const result = await api("serializeAccounts", {
        accountsYaml: seed,
        accounts: built,
        defaultAccount: defaultAccount || "",
      });
      await props.onApply(result, names);
      setNotice({
        kind: "success",
        text: "已把 " + built.length + " 个账号写回 YAML"
          + (result.commentsDropped ? "（原文档无法就地编辑，注释已丢失）" : "")
          + (result.passwordsDropped ? "；有账号的已存密码无法保留，请在对应卡片重输" : "")
          + "。",
      });
    } catch (e) {
      setNotice({ kind: "error", text: "写入失败：" + (e && e.message ? e.message : String(e)) });
    } finally {
      setBusy("");
    }
  };

  const defaultMissing = order.length > 1 && !defaultAccount;
  // 父级（保存/测试整份表单）在忙时，卡片的改动类操作一律锁住。
  const locked = props.editing === true;
  // 写入之后 textarea 已等于待保存的文本，此时不该再说「有未写入的改动」。
  const pendingText = props.pendingYaml !== undefined && props.pendingYaml !== null && props.pendingYaml !== seed;

  return h("div", { className: "dshe-acc-list" }, [
    detail.error
      ? h("div", { className: "dshe-alert error" }, "accountsYaml 解析失败：" + detail.error)
      : null,
    defaultMissing
      ? h("div", { className: "dshe-alert error" }, [
          "配置了多个账号，请设置默认账号：",
          h("span", { className: "dshe-actions", style: { marginTop: 6 } },
            order.map((name, index) => h("button", {
              key: name + index,
              type: "button",
              className: "dshe-btn",
              onClick: () => setDefaultAccount(name),
            }, "设为默认：" + (drafts[name] ? drafts[name].name || name : name)))),
        ])
      : null,

    order.length === 0
      ? h("div", { className: "dshe-acc-empty" }, "还没有账号。点「+ 添加账号」，或在下面的 YAML 里直接写。")
      : null,

    order.map((name, index) => {
      const draft = drafts[name];
      if (draft === undefined) return null;
      const summary = accountSummary(draft, presets);
      const isDefault = defaultAccount !== "" && defaultAccount === draft.name;
      const expanded = open === name;
      const status = rowStatus[name];
      const renamed = draft.name !== name;
      const editing = locked || props.editing === draft.name;
      const busyHere = busy === name;
      return h("div", { key: name + index, className: "dshe-acc-card" }, [
        h("div", { className: "dshe-acc-head" }, [
          h("span", { className: "dshe-acc-name" }, draft.name || "（未命名）"),
          h("span", { className: "dshe-acc-badge" + (summary.isCustom ? " todo" : "") }, summary.label),
          isDefault ? h("span", { className: "dshe-acc-badge is-default" }, "默认") : null,
          accountIncomplete(draft) ? h("span", { className: "dshe-acc-badge todo" }, "未完成") : null,
          renamed ? h("span", { className: "dshe-acc-badge todo dshe-acc-warn" }, "改名 → 按新名保存") : null,
          h("span", { className: "dshe-acc-actions" }, [
            h("button", {
              type: "button",
              className: "dshe-btn",
              onClick: () => setOpen(expanded ? "" : name),
            }, expanded ? "收起" : (editing ? "编辑中" : "编辑")),
            h("button", {
              type: "button",
              className: "dshe-btn",
              disabled: busy !== "" || editing || draft.name === "",
              onClick: () => testCard(draft.name),
            }, busyHere ? "测试中…" : "测试连接"),
            h("button", {
              type: "button",
              className: "dshe-btn",
              disabled: isDefault || editing || draft.name === "",
              onClick: () => setDefaultAccount(draft.name),
            }, isDefault ? "默认账号" : "设为默认"),
            h("button", {
              type: "button",
              className: "dshe-btn dshe-acc-danger",
              disabled: editing,
              onClick: () => setConfirming(confirming === name ? "" : name),
            }, "删除"),
          ]),
        ]),
        h("div", { className: "dshe-acc-meta" },
          (draft.user || "（未填邮箱地址）")
          + " · " + (draft.inboxFolder || "INBOX")
          + " · " + (draft.imap.host || "预设主机")
          + ":" + (Number(draft.imap.port) || "—")
          + " · " + (draft.smtp.host || "预设主机")
          + ":" + (Number(draft.smtp.port) || "—")),
        status
          ? h("div", { className: "dshe-hint" + (status.kind === "error" ? " dshe-acc-warn" : "") }, status.text)
          : null,
        confirming === name
          ? h("div", { className: "dshe-acc-confirm" }, [
              "删除账号「" + (draft.name || "（未命名）") + "」会在保存后从 YAML 里移除，已存密码一并丢失。",
              h("span", { className: "dshe-actions" }, [
                h("button", {
                  type: "button",
                  className: "dshe-btn dshe-acc-danger",
                  onClick: () => removeAccount(name),
                }, "确认删除"),
                h("button", { type: "button", className: "dshe-btn", onClick: () => setConfirming("") }, "取消"),
              ]),
            ])
          : null,
        expanded
          ? h("div", { className: "dshe-acc-body" }, [
              h("div", { className: "dshe-grid" }, [
                h("div", { className: "dshe-field" }, [
                  h("label", null, "账号名（工具调用的 account 参数）"),
                  h("input", {
                    type: "text",
                    value: draft.name,
                    placeholder: "work",
                    disabled: editing,
                    onChange: (e) => renameDraft(name, e.target.value),
                  }),
                  h("div", { className: "dshe-hint" },
                    draft.name === "defaultAccount"
                      ? h("span", { className: "dshe-acc-warn" }, "defaultAccount 是保留键（表示默认账号），请换一个名字。")
                      : "不能叫 defaultAccount（该键保留给默认账号）。改名会删旧键、建新键。"),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, "服务商"),
                  h("select", {
                    value: summary.isCustom && draft.provider === "" ? CUSTOM_PROVIDER : draft.provider || "",
                    disabled: editing,
                    onChange: (e) => patchDraft(name, applyPreset(draft, presets, e.target.value)),
                  }, providerOptions(presets).map((option) => h("option", { key: option.value, value: option.value }, option.label))),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, "邮箱地址"),
                  fieldInput("text", draft.user, (v) => patchDraft(name, { user: v }), "you@example.com"),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, "授权码 / 应用专用密码"),
                  h("input", {
                    type: "password",
                    value: draft.password,
                    disabled: editing,
                    placeholder: "留空保持不变",
                    onChange: (e) => patchDraft(name, { password: e.target.value }),
                  }),
                  h("div", { className: "dshe-hint" },
                    editing
                      ? "编辑该账号时密码栏不可用：原密码是加密展示的，留空即保持不变。"
                      : (props.detail.list.filter((c) => String(c.name) === draft.name)[0] || {}).hasPassword
                        ? "已存有授权码：留空保持不变，清空后填内容即覆盖。"
                        : "留空即不写入 password 键。"),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, "收件文件夹（默认 INBOX）"),
                  fieldInput("text", draft.inboxFolder, (v) => patchDraft(name, { inboxFolder: v }), "INBOX"),
                ]),
              ]),
              h("details", { className: "dshe-details dshe-acc-adv" }, [
                h("summary", null, "高级：IMAP / SMTP 端点（选了预设可留空）"),
                h("div", { className: "dshe-grid", style: { marginTop: 10 } }, [
                  h("div", { className: "dshe-field" }, [
                    h("label", null, "IMAP 主机"),
                    fieldInput("text", draft.imap.host, (v) => patchDraft(name, { imap: Object.assign({}, draft.imap, { host: v }) }), "留空用预设"),
                  ]),
                  h("div", { className: "dshe-field" }, [
                    h("label", null, "IMAP 端口"),
                    fieldInput("number", draft.imap.port, (v) => patchDraft(name, { imap: Object.assign({}, draft.imap, { port: Number(v) }) }), "993"),
                  ]),
                  h("label", { className: "dshe-check" }, [
                    h("input", {
                      type: "checkbox",
                      checked: draft.imap.secure === true,
                      onChange: (e) => patchDraft(name, { imap: Object.assign({}, draft.imap, { secure: e.target.checked }) }),
                    }),
                    "IMAP SSL",
                  ]),
                  h("div", { className: "dshe-field" }, [
                    h("label", null, "SMTP 主机"),
                    fieldInput("text", draft.smtp.host, (v) => patchDraft(name, { smtp: Object.assign({}, draft.smtp, { host: v }) }), "留空用预设"),
                  ]),
                  h("div", { className: "dshe-field" }, [
                    h("label", null, "SMTP 端口"),
                    fieldInput("number", draft.smtp.port, (v) => patchDraft(name, { smtp: Object.assign({}, draft.smtp, { port: Number(v) }) }), "465"),
                  ]),
                  h("label", { className: "dshe-check" }, [
                    h("input", {
                      type: "checkbox",
                      checked: draft.smtp.secure === true,
                      onChange: (e) => patchDraft(name, { smtp: Object.assign({}, draft.smtp, { secure: e.target.checked }) }),
                    }),
                    "SMTP SSL（Outlook/iCloud 587 端口请取消勾选）",
                  ]),
                ]),
              ]),
            ])
          : null,
      ]);
    }),

    h("div", { className: "dshe-actions" }, [
      h("button", { type: "button", className: "dshe-btn", onClick: addAccount, disabled: busy !== "" }, "+ 添加账号"),
      h("button", { type: "button", className: "dshe-btn primary", disabled: busy !== "" || locked, onClick: writeYaml }, busy === "save" ? "写入中…" : "写入 YAML"),
      props.onDiscard
        ? h("button", { type: "button", className: "dshe-btn", disabled: busy !== "" || locked, onClick: () => {
            resetFromDetail();
            setNotice({ kind: "info", text: "已从服务器快照重建卡片，未写入的改动已丢弃。" });
          } }, "放弃改动")
        : null,
      pendingText
        ? h("span", { className: "dshe-acc-badge todo dshe-acc-warn" }, "有未写入的改动")
        : null,
    ]),
    h("div", { className: "dshe-hint" },
      "卡片改动先落到下面的 YAML，再和整份表单一起「保存并应用」才算生效。"
      + (defaultMissing ? " 现在有多个账号但没有默认账号，必须先指定一个。" : "")),
    notice
      ? h("div", { className: "dshe-alert " + notice.kind }, notice.text)
      : null,

    h("details", {
      className: "dshe-details",
      open: yamlOpen,
      onToggle: (e) => setYamlOpen(e.target.open),
    }, [
      h("summary", null, "多账号 YAML（高级，卡片的真相源）"),
      h("div", { className: "dshe-field", style: { marginTop: 10 } }, [
        h("textarea", {
          rows: 8,
          value: value.accountsYaml || "",
          placeholder: "work: { provider: qq, user: work@qq.com, password: 授权码1 }\nhome: { provider: '163', user: home@163.com, password: 授权码2 }\ndefaultAccount: work",
          onChange: (e) => value.onChangeAccountsYaml(e.target.value),
        }),
        h("div", { className: "dshe-hint" }, "账号名 -> 配置的映射，可含 defaultAccount 键。手改这里之后点「从 YAML 解析」才会刷新上面的卡片。"),
        h("div", { className: "dshe-actions" }, [
          h("button", { type: "button", className: "dshe-btn", disabled: busy !== "" || locked, onClick: fromYaml }, busy === "parse" ? "解析中…" : "从 YAML 解析"),
        ]),
        detail.error ? h("div", { className: "dshe-hint dshe-acc-warn" }, "当前 YAML 有错，解析按钮能拿到具体原因。") : null,
      ]),
    ]),
  ]);
}

/**
 * 服务器预设编辑器。和账号卡片同款：快照的 presets.custom 是卡片的数据源，
 * YAML 是真相源，卡片改动要靠「写入预设 YAML」落到文本、再随整份表单保存。
 * 预设不含凭证；内置的 8 个服务商不在这里编辑（它们由 PROVIDERS 定义）。
 */
function ServerPresetsEditor(props) {
  const value = props.value;
  const presets = props.presets || { builtin: {}, custom: {} };
  const custom = presets.custom || {};

  const [drafts, setDrafts] = React.useState(() => presetDrafts(custom));
  const [order, setOrder] = React.useState(() => Object.keys(custom));
  const [open, setOpen] = React.useState("");
  const [confirming, setConfirming] = React.useState("");
  const [yamlOpen, setYamlOpen] = React.useState(false);
  const [notice, setNotice] = React.useState(null);
  const dirtyRef = React.useRef(false);

  // 预设列表每次快照都是一个新对象：只依赖它的投影重建卡片。
  const listKey = Object.keys(custom).map((name) => {
    const entry = custom[name] || {};
    const imap = entry.imap || {};
    const smtp = entry.smtp || {};
    return [name, entry.label || "", imap.host || "", imap.port, imap.secure, smtp.host || "", smtp.port, smtp.secure].join(":");
  }).join("|");

  React.useEffect(() => {
    setDrafts(presetDrafts(custom));
    setOrder(Object.keys(custom));
    setOpen("");
    setConfirming("");
    // eslint-disable-next-line
  }, [listKey]);

  const seed = value.serverPresets || "";
  const locked = props.editing === true;
  const pendingText = props.pendingYaml !== undefined && props.pendingYaml !== null && props.pendingYaml !== seed;

  React.useEffect(() => {
    const guard = (e) => {
      if (!dirtyRef.current) return undefined;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);

  const patchDraft = (key, patch) => {
    dirtyRef.current = true;
    setDrafts((cur) => Object.assign({}, cur, { [key]: Object.assign({}, cur[key], patch) }));
  };

  const renameDraft = (oldKey, nextName) => {
    // 预设名就是 YAML 的键：映射键必须立刻跟着走，否则改名会留下旧键的孤儿。
    dirtyRef.current = true;
    setDrafts((cur) => {
      const next = {};
      for (const key of Object.keys(cur)) {
        if (key === oldKey) continue;
        next[key] = cur[key];
      }
      const entry = cur[oldKey];
      if (entry !== undefined) next[nextName] = Object.assign({}, entry, { name: nextName });
      return next;
    });
    setOrder((cur) => cur.map((key) => (key === oldKey ? nextName : key)));
    setOpen((cur) => (cur === oldKey ? nextName : cur));
    setConfirming((cur) => (cur === oldKey ? "" : cur));
  };

  const addPreset = () => {
    dirtyRef.current = true;
    let n = order.length + 1;
    let name = "preset" + n;
    while (Object.prototype.hasOwnProperty.call(drafts, name)) {
      n += 1;
      name = "preset" + n;
    }
    setDrafts((cur) => Object.assign({}, cur, { [name]: emptyPresetDraft(name) }));
    setOrder((cur) => cur.concat([name]));
    setOpen(name);
    setConfirming("");
    setYamlOpen(false);
  };

  const removePreset = (key) => {
    dirtyRef.current = true;
    setDrafts((cur) => {
      const next = Object.assign({}, cur);
      delete next[key];
      return next;
    });
    setOrder((cur) => cur.filter((item) => item !== key));
    setConfirming("");
    setOpen((cur) => (cur === key ? "" : cur));
  };

  /**
   * 卡片重建只认快照（最后一次保存的预设表）。这里刻意不重载整份表单：预设和
   * 账号共处一张表单，动一个不该悄悄丢掉另一个还没保存的改动。
   */
  const rebuildFromSnapshot = () => {
    setDrafts(presetDrafts(custom));
    setOrder(Object.keys(custom));
    setOpen("");
    setConfirming("");
    dirtyRef.current = false;
    setNotice({ kind: "info", text: "已从最后一次保存的预设表重建卡片（未写入的卡片改动已丢弃）。" });
  };

  /** 预设序列化在前端做，没有后端往返，所以这里同步返回、直接给个提示。 */
  const writeYaml = () => {
    const result = serializePresetDrafts(order, drafts);
    if (result.error !== undefined) {
      setNotice({ kind: "error", text: result.error });
      return;
    }
    dirtyRef.current = false;
    props.onApply(result.text);
    setNotice({
      kind: "success",
      text: result.text === ""
        ? "已把 serverPresets 清空（写入空文本，不是 '{}'）。"
        : "已把 " + order.length + " 条预设写回 serverPresets 文本；再点下面的「保存并应用」才会生效。",
    });
  };

  /**
   * YAML 逃生口的「应用」：textarea 本来就直连 draft，这里显式再塞一次，并丢掉
   * 卡片产物 —— 手改过文本之后，卡片那一次「写入」不再代表用户想要的文本。
   */
  const applyYaml = () => {
    dirtyRef.current = false;
    props.onApply(value.serverPresets || "");
    setNotice({ kind: "info", text: "已把 textarea 里的 serverPresets 文本应用为待保存内容（卡片未重建）。" });
  };

  const rebuiltCount = Object.keys(custom).length;

  return h("div", { className: "dshe-prst-list" }, [
    presets.error
      ? h("div", { className: "dshe-alert error" }, [
          "serverPresets 解析失败：" + presets.error,
          h("div", { className: "dshe-hint", style: { marginTop: 4 } },
            "下面的卡片是从快照里的（空）预设表建的，不代表这份文本。可以在下面的 YAML 逃生口里改，或点「写入预设 YAML」用卡片整段覆盖原来的文本。"),
        ])
      : null,

    order.length === 0
      ? h("div", { className: "dshe-prst-empty" },
          rebuiltCount === 0
            ? "还没有自定义服务器预设。点「+ 添加预设」，账号卡片的服务商下拉里就会多出这个名字。"
            : "卡片已清空：点「写入预设 YAML」即删除全部 " + rebuiltCount + " 条预设。")
      : null,

    order.map((key, index) => {
      const draft = drafts[key];
      if (draft === undefined) return null;
      const name = String(draft.name === undefined || draft.name === null ? "" : draft.name);
      const trimmed = name.trim();
      const expanded = open === key;
      const renamed = trimmed !== key;
      const duplicate = trimmed !== "" && order.some((other) => other !== key && String((drafts[other] || {}).name || "").trim() === trimmed);
      const empty = trimmed === "";
      const label = String(draft.label || "").trim();
      return h("div", { key: key + index, className: "dshe-prst-card" }, [
        h("div", { className: "dshe-prst-head" }, [
          h("span", { className: "dshe-prst-name" }, trimmed || "（未命名）"),
          label === "" ? null : h("span", { className: "dshe-prst-badge" }, label),
          empty ? h("span", { className: "dshe-prst-badge todo" }, "未命名") : null,
          renamed ? h("span", { className: "dshe-prst-badge todo dshe-prst-warn" }, "改名 → 删旧建新") : null,
          duplicate ? h("span", { className: "dshe-prst-badge todo dshe-prst-warn" }, "重名") : null,
          h("span", { className: "dshe-prst-actions" }, [
            h("button", {
              type: "button",
              className: "dshe-btn",
              onClick: () => setOpen(expanded ? "" : key),
            }, expanded ? "收起" : "编辑"),
            h("button", {
              type: "button",
              className: "dshe-btn dshe-prst-danger",
              disabled: locked,
              onClick: () => setConfirming(confirming === key ? "" : key),
            }, "删除"),
          ]),
        ]),
        h("div", { className: "dshe-prst-meta" },
          "imap " + (draft.imap.host || "（未填主机）") + ":" + portLabel(draft.imap.port)
          + (draft.imap.secure === true ? " · SSL" : " · 明文")
          + " ｜ smtp " + (draft.smtp.host || "（未填主机）") + ":" + portLabel(draft.smtp.port)
          + (draft.smtp.secure === true ? " · SSL" : " · 明文")),
        confirming === key
          ? h("div", { className: "dshe-prst-confirm" }, [
              "删除预设「" + (trimmed || "（未命名）") + "」后，指向它的账号卡片会在保存后失去端点（仍可手填，服务商下拉里也不再列出它）。",
              h("span", { className: "dshe-actions" }, [
                h("button", { type: "button", className: "dshe-btn dshe-prst-danger", onClick: () => removePreset(key) }, "确认删除"),
                h("button", { type: "button", className: "dshe-btn", onClick: () => setConfirming("") }, "取消"),
              ]),
            ])
          : null,
        expanded
          ? h("div", { className: "dshe-prst-body" }, [
              h("div", { className: "dshe-grid" }, [
                h("div", { className: "dshe-field" }, [
                  h("label", null, "预设名（serverPresets 的键，也是账号 provider 的值）"),
                  h("input", {
                    type: "text",
                    value: name,
                    placeholder: "corp",
                    disabled: locked,
                    onChange: (e) => renameDraft(key, e.target.value),
                  }),
                  h("div", { className: "dshe-hint" },
                    duplicate
                      ? h("span", { className: "dshe-prst-warn" }, "已经有同名预设了：预设名是 YAML 的键，必须唯一。")
                      : "不能和内置服务商同名（qq/163/126/sina/aliyun/gmail/outlook/icloud）—— 那会被内置预设挡住。改名会删旧键、建新键。"),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, "显示名 label（可选）"),
                  fieldInput("text", draft.label, (v) => patchDraft(key, { label: v }), "公司邮箱"),
                ]),
              ]),
              h("div", { className: "dshe-grid" }, [
                h("div", { className: "dshe-field" }, [
                  h("label", null, "IMAP 主机"),
                  fieldInput("text", draft.imap.host, (v) => patchDraft(key, { imap: Object.assign({}, draft.imap, { host: v }) }), "imap.corp.com"),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, "IMAP 端口"),
                  h("input", {
                    type: "text",
                    inputMode: "numeric",
                    value: draft.imap.port,
                    placeholder: "993",
                    disabled: locked,
                    onChange: (e) => patchDraft(key, { imap: Object.assign({}, draft.imap, { port: e.target.value }) }),
                  }),
                  portTextProblem(draft.imap.port) === ""
                    ? h("div", { className: "dshe-hint" }, "留空即用默认 993。")
                    : h("div", { className: "dshe-hint dshe-prst-warn" }, portTextProblem(draft.imap.port) + "。"),
                ]),
                h("label", { className: "dshe-check" }, [
                  h("input", {
                    type: "checkbox",
                    checked: draft.imap.secure === true,
                    disabled: locked,
                    onChange: (e) => patchDraft(key, { imap: Object.assign({}, draft.imap, { secure: e.target.checked }) }),
                  }),
                  "IMAP SSL",
                ]),
              ]),
              h("div", { className: "dshe-grid" }, [
                h("div", { className: "dshe-field" }, [
                  h("label", null, "SMTP 主机"),
                  fieldInput("text", draft.smtp.host, (v) => patchDraft(key, { smtp: Object.assign({}, draft.smtp, { host: v }) }), "smtp.corp.com"),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, "SMTP 端口"),
                  h("input", {
                    type: "text",
                    inputMode: "numeric",
                    value: draft.smtp.port,
                    placeholder: "465",
                    disabled: locked,
                    onChange: (e) => patchDraft(key, { smtp: Object.assign({}, draft.smtp, { port: e.target.value }) }),
                  }),
                  portTextProblem(draft.smtp.port) === ""
                    ? h("div", { className: "dshe-hint" }, "留空即用默认 465。")
                    : h("div", { className: "dshe-hint dshe-prst-warn" }, portTextProblem(draft.smtp.port) + "。"),
                ]),
                h("label", { className: "dshe-check" }, [
                  h("input", {
                    type: "checkbox",
                    checked: draft.smtp.secure === true,
                    disabled: locked,
                    onChange: (e) => patchDraft(key, { smtp: Object.assign({}, draft.smtp, { secure: e.target.checked }) }),
                  }),
                  "SMTP SSL（587 端口请取消勾选）",
                ]),
              ]),
            ])
          : null,
      ]);
    }),

    h("div", { className: "dshe-actions" }, [
      h("button", { type: "button", className: "dshe-btn", disabled: locked, onClick: addPreset }, "+ 添加预设"),
      h("button", { type: "button", className: "dshe-btn primary", disabled: locked, onClick: writeYaml }, "写入预设 YAML"),
      h("button", { type: "button", className: "dshe-btn", disabled: locked, onClick: rebuildFromSnapshot }, "放弃改动"),
      pendingText
        ? h("span", { className: "dshe-prst-badge todo dshe-prst-warn" }, "有未写入的改动")
        : null,
    ]),
    h("div", { className: "dshe-hint" },
      "预设不含邮箱地址和授权码，只记连接参数；账号卡片选了这个预设，就把端点填进账号。"
      + "卡片改动先落到下面的文本，再和整份表单一起「保存并应用」才算生效。"),

    h("details", {
      className: "dshe-details",
      open: yamlOpen,
      onToggle: (e) => setYamlOpen(e.target.open),
    }, [
      h("summary", null, "serverPresets YAML（高级，卡片的真相源）"),
      h("div", { className: "dshe-field", style: { marginTop: 10 } }, [
        h("textarea", {
          rows: 8,
          value: value.serverPresets || "",
          placeholder: "corp:\n  label: 公司邮箱\n  imap: { host: imap.corp.com, port: 993, secure: true }\n  smtp: { host: smtp.corp.com, port: 465, secure: true }",
          onChange: (e) => value.onChangeServerPresets(e.target.value),
        }),
        h("div", { className: "dshe-hint" },
          "预设名 -> 端点映射，没有凭证。手改这里之后点「应用」把文本定为待保存内容，"
          + "或点「从快照重建卡片」回到已保存的预设表；空文本表示没有预设（不是 '{}'）。"),
        h("div", { className: "dshe-actions" }, [
          h("button", {
            type: "button",
            className: "dshe-btn",
            disabled: locked,
            onClick: applyYaml,
          }, "应用"),
          h("button", {
            type: "button",
            className: "dshe-btn",
            disabled: locked,
            onClick: rebuildFromSnapshot,
          }, "从快照重建卡片"),
        ]),
      ]),
    ]),

    notice ? h("div", { className: "dshe-alert " + notice.kind }, notice.text) : null,
  ]);
}

function EmailSettingsSection() {
  const [draft, setDraft] = useState(null);
  const [snapshot, setSnapshot] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(undefined);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  /** 卡片编辑器的「写入 YAML」：serializeAccounts 的结果挂在这里，保存时并进 draft。 */
  const [pending, setPending] = useState(null);
  /** 预设编辑器的「写入预设 YAML」：同上，但只有文本，没有后端 action。 */
  const [presetsPending, setPresetsPending] = useState(null);

  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const snap = await api();
      setSnapshot(snap);
      const value = (snap && snap.settings && snap.settings.value) || EMPTY;
      setDraft({
        ...EMPTY,
        ...value,
        imap: { ...EMPTY.imap, ...(value.imap || {}) },
        smtp: { ...EMPTY.smtp, ...(value.smtp || {}) },
      });
      // 新快照 = 新的 accountsYaml 基线，旧的卡片产物不再对应任何草稿。
      setPending(null);
      setPresetsPending(null);
    } catch (e) {
      setError(e && e.message ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (patch) => setDraft((cur) => Object.assign({}, cur, patch));

  const PORT_PRESETS = {
    qq: [993, 465], "163": [993, 465], "126": [993, 465], sina: [993, 465],
    aliyun: [993, 465], gmail: [993, 465], outlook: [993, 587], icloud: [993, 587],
  };

  const onProvider = (value) => {
    const preset = PORT_PRESETS[value];
    if (preset) {
      setDraft((cur) => Object.assign({}, cur, {
        provider: value,
        imap: Object.assign({}, cur.imap, { port: preset[0], secure: true }),
        smtp: Object.assign({}, cur.smtp, { port: preset[1], secure: preset[1] === 465 }),
      }));
    } else {
      update({ provider: value });
    }
  };
  const updateImap = (patch) => setDraft((cur) => Object.assign({}, cur, { imap: Object.assign({}, cur.imap, patch) }));
  const updateSmtp = (patch) => setDraft((cur) => Object.assign({}, cur, { smtp: Object.assign({}, cur.smtp, patch) }));

  /** 手改 YAML 后 pending 已过期：它的 textarea 值来自 draft，改动会覆盖 pending。 */
  const onAccountsYaml = (text) => {
    setPending(null);
    update({ accountsYaml: text });
  };

  /** 预设文本同理：手改之后卡片产物作废，保存用文本本身。 */
  const onServerPresets = (text) => {
    setPresetsPending(null);
    update({ serverPresets: text });
  };

  /** 保存时把卡片写入的 YAML 并进来（卡片编辑和表单编辑各自独立，后者优先）。 */
  const effectiveAccountsYaml = () => {
    if (pending !== null && draft.accountsYaml === pending.from) return pending.text;
    return draft.accountsYaml;
  };

  /** 同上，服务器预设这一份。 */
  const effectiveServerPresets = () => {
    if (presetsPending !== null && draft.serverPresets === presetsPending.from) return presetsPending.text;
    return draft.serverPresets;
  };

  const doSave = async () => {
    setBusy(true); setError(""); setMessage(""); setTestResult(undefined);
    try {
      const rev = snapshot && snapshot.settings ? snapshot.settings.revision : 0;
      const value = {
        ...draft,
        accountsYaml: effectiveAccountsYaml(),
        serverPresets: effectiveServerPresets(),
        maxBodyChars: typeof draft.maxBodyChars === "number" ? draft.maxBodyChars : 20000,
        imap: { ...draft.imap, port: Number(draft.imap.port) || 993 },
        smtp: { ...draft.smtp, port: Number(draft.smtp.port) || 465 },
      };
      const snap = await api("save", { value, expectedRevision: rev });
      setSnapshot(snap);
      setPending(null);
      setPresetsPending(null);
      setMessage(draft.user && draft.user.trim()
        ? "已保存并生效（下次请求即用新账号）。"
        : "已保存。注意：尚未填写邮箱地址，email_* 工具调用时会提示配置。");
    } catch (e) {
      setError(e && e.message ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const doTest = async () => {
    setTesting(true); setError(""); setMessage(""); setTestResult(undefined);
    try {
      const value = {
        ...draft,
        accountsYaml: effectiveAccountsYaml(),
        maxBodyChars: typeof draft.maxBodyChars === "number" ? draft.maxBodyChars : 20000,
        imap: { ...draft.imap, port: Number(draft.imap.port) || 993 },
        smtp: { ...draft.smtp, port: Number(draft.smtp.port) || 465 },
      };
      const result = await api("test", { value });
      setTestResult({ ok: true, text: "连接成功，IMAP 登录通过（" + result.ms + " ms）。" });
    } catch (e) {
      setTestResult({ ok: false, text: "连接失败：" + (e && e.message ? e.message : String(e)) });
    } finally {
      setTesting(false);
    }
  };

  if (draft === null) {
    return h("div", { className: "dshe-settings" }, [
      h("div", { className: "dshe-alert info" }, busy ? "加载中…" : (error || "加载中…")),
    ]);
  }

  const accounts = snapshot && snapshot.accounts ? snapshot.accounts : [];

  return h("div", { className: "dshe-settings" }, [
    h("header", { className: "dshe-header" }, [
      h("span", { className: "dshe-kicker" }, "dsh-email · IMAP/SMTP"),
      h("h2", null, "邮件"),
      h("p", null, "在这里配置邮箱账号，即可使用 10 个 email_* 工具。支持表单和多账号 YAML，保存后立即生效。"),
    ]),
    h("section", { className: "dshe-panel" }, [
      h("div", { className: "dshe-grid" }, [
        h("div", { className: "dshe-field" }, [
          h("label", null, "邮箱服务商"),
          h("select", { value: draft.provider, onChange: (e) => onProvider(e.target.value) },
            PROVIDERS.map(([value, label]) => h("option", { key: value, value }, label))),
        ]),
        h("div", { className: "dshe-field" }, [
          h("label", null, "邮箱地址"),
          fieldInput("text", draft.user, (v) => update({ user: v }), "you@example.com"),
        ]),
      ]),
      h("div", { className: "dshe-grid" }, [
        h("div", { className: "dshe-field" }, [
          h("label", null, "授权码 / 应用专用密码"),
          h("input", {
            type: "password",
            value: draft.password,
            placeholder: "不是登录密码；QQ/163 在邮箱设置里生成授权码",
            onChange: (e) => update({ password: e.target.value }),
          }),
          h("div", { className: "dshe-hint" }, "不想明文保存？此栏留空，改用环境变量 DSH_EMAIL_PASSWORD（仅单账号时生效）。"),
        ]),
        h("div", { className: "dshe-field" }, [
          h("label", null, "收件文件夹（默认 INBOX）"),
          fieldInput("text", draft.inboxFolder, (v) => update({ inboxFolder: v }), "INBOX"),
        ]),
      ]),
      h("label", { className: "dshe-check" }, [
        h("input", {
          type: "checkbox",
          checked: draft.sendApproval === true,
          onChange: (e) => update({ sendApproval: e.target.checked }),
        }),
        "发信前弹确认（强烈建议保留；Full Access 模式下会被自动拒绝）",
      ]),
      h("div", { className: "dshe-field" }, [
        h("label", null, "附件下载目录（默认 $DSH_HOME/email-downloads）"),
        fieldInput("text", draft.downloadDir, (v) => update({ downloadDir: v }), "留空使用默认"),
      ]),
      h("div", { className: "dshe-hint" },
        "「写入 YAML」只把卡片改动落到下面的 YAML 文本；再点下面的「保存并应用」才会真正生效。"),
      h(AccountCardsEditor, {
        value: { accountsYaml: draft.accountsYaml, onChangeAccountsYaml: onAccountsYaml },
        detail: (snapshot && snapshot.accountsDetail) || undefined,
        presets: (snapshot && snapshot.presets) || undefined,
        pendingYaml: pending === null ? undefined : pending.text,
        editing: busy || testing,
        onDiscard: () => load(),
        // 点「写入 YAML」时同步进 textarea，下次 GET 或「刷新」都从服务端重建卡片。
        onApply: async (result, names) => {
          const text = result && typeof result.accountsYaml === "string" ? result.accountsYaml : "";
          update({ accountsYaml: text });
          setPending({ from: text, text });
        },
      }),
      h("details", { className: "dshe-details dshe-prst-section" }, [
        h("summary", null, "服务器预设（自定义服务商，高级）"),
        h(ServerPresetsEditor, {
          value: { serverPresets: draft.serverPresets, onChangeServerPresets: onServerPresets },
          presets: (snapshot && snapshot.presets) || undefined,
          pendingYaml: presetsPending === null ? undefined : presetsPending.text,
          editing: busy || testing,
          // 预设序列化在前端做：塞进 draft 的文本即可，保存走同一套流程。
          onApply: (text) => {
            const next = typeof text === "string" ? text : "";
            update({ serverPresets: next });
            setPresetsPending({ from: next, text: next });
          },
        }),
      ]),
      h("details", { className: "dshe-details" }, [
        h("summary", null, "高级：自定义服务器（选了预设可留空）"),
        h("div", { className: "dshe-grid", style: { marginTop: 10 } }, [
          h("div", { className: "dshe-field" }, [
            h("label", null, "IMAP 主机"),
            fieldInput("text", draft.imap.host, (v) => updateImap({ host: v }), "imap.qq.com"),
          ]),
          h("div", { className: "dshe-field" }, [
            h("label", null, "IMAP 端口"),
            fieldInput("number", draft.imap.port, (v) => updateImap({ port: Number(v) }), "993"),
          ]),
          h("label", { className: "dshe-check" }, [
            h("input", {
              type: "checkbox",
              checked: draft.imap.secure === true,
              onChange: (e) => updateImap({ secure: e.target.checked }),
            }),
            "IMAP SSL",
          ]),
          h("div", { className: "dshe-field" }, [
            h("label", null, "SMTP 主机"),
            fieldInput("text", draft.smtp.host, (v) => updateSmtp({ host: v }), "smtp.qq.com"),
          ]),
          h("div", { className: "dshe-field" }, [
            h("label", null, "SMTP 端口"),
            fieldInput("number", draft.smtp.port, (v) => updateSmtp({ port: Number(v) }), "465"),
          ]),
          h("label", { className: "dshe-check" }, [
            h("input", {
              type: "checkbox",
              checked: draft.smtp.secure === true,
              onChange: (e) => updateSmtp({ secure: e.target.checked }),
            }),
            "SMTP SSL（Outlook/iCloud 587 端口请取消勾选）",
          ]),
        ]),
      ]),
      h("div", { className: "dshe-actions" }, [
        h("button", { className: "dshe-btn primary", disabled: busy || testing, onClick: doSave }, busy ? "处理中…" : "保存并应用"),
        h("button", { className: "dshe-btn", disabled: busy || testing, onClick: doTest }, testing ? "测试中…" : "测试连接"),
      ]),
      snapshot && snapshot.writable === false
        ? h("div", { className: "dshe-alert info" }, "当前 settings 存储是只读的，只能查看不能保存。")
        : null,
    ]),
    error ? h("div", { className: "dshe-alert error" }, error) : null,
    message ? h("div", { className: "dshe-alert success" }, message) : null,
    testResult
      ? h("div", { className: testResult.ok ? "dshe-alert success" : "dshe-alert error" }, testResult.text)
      : null,
    accounts.length > 0
      ? h("div", { className: "dshe-hint" }, "当前生效账号：" + accounts.join("、"))
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

  const closePopup = () => {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = 0; }
    root.replaceChildren();
  };

  const showPopup = (value) => {
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
    title.textContent = "鲸鱼娘递信：有 " + value.newCount + " 封新邮件";
    body.appendChild(title);
    (value.messages || []).slice(0, 3).forEach((m) => {
      const row = document.createElement("div");
      row.className = "dshe-whale-item";
      const who = (m.from || []).map((a) => a.name || a.address).filter(Boolean).join(", ") || "(未知)";
      row.textContent = who + " · " + (m.subject || "(无主题)");
      body.appendChild(row);
    });
    if (value.newCount > 3) {
      const more = document.createElement("div");
      more.className = "dshe-whale-item";
      more.textContent = "…其余 " + (value.newCount - 3) + " 封，用 email_watch / email_read 查看";
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
    closeBtn.setAttribute("aria-label", "关闭");
    closeBtn.onclick = closePopup;
    card.appendChild(closeBtn);
    root.appendChild(card);
    hideTimer = setTimeout(closePopup, 12000);
  };

  const tick = async () => {
    try {
      const snap = await api();
      if (snap && snap.whale) {
        whaleUrl = snap.whale.url || "";
        whaleCredit = snap.whale.credit || "";
      }
      if (!snap || !snap.accounts || snap.accounts.length === 0) return;
      const value = await api("watch", { limit: 5 });
      if (value && value.newCount > 0) showPopup(value);
    } catch (e) {
      // Not configured or transient error: stay silent, retry next tick.
    }
  };

  tick();
  pollTimer = setInterval(tick, 30000);
  return () => {
    clearInterval(pollTimer);
    if (hideTimer) clearTimeout(hideTimer);
    root.remove();
  };
}

const inject = ["slots"];

function apply(ctx) {
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
    label: () => "邮件 (dsh-email)",
    inject: () => ({}),
  }, EmailSettingsSection));
}

exports.apply = apply;
exports.inject = inject;

return module.exports;
}});
