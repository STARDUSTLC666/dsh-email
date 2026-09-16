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
    throw new Error((body && body.error && body.error.message) || ("request failed " + res.status));
  }
  return body.value;
}

/**
 * 组装要落盘的完整 value：整份表单 + 当前有效的 accountsYaml。端口一律定型成数字
 * （空的走默认 993/465），maxBodyChars 缺省 20000 —— 和以前那次手动保存完全一致。
 */
function settingsValueOf(draft, accountsYaml) {
  if (draft === null || draft === undefined) return null;
  return {
    ...draft,
    accountsYaml: typeof accountsYaml === "string" ? accountsYaml : "",
    maxBodyChars: typeof draft.maxBodyChars === "number" ? draft.maxBodyChars : 20000,
    imap: { ...draft.imap, port: Number(draft.imap.port) || 993 },
    smtp: { ...draft.smtp, port: Number(draft.smtp.port) || 465 },
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

const PROVIDERS = [
  ["qq", "QQ 邮箱"],
  ["163", "163 邮箱"],
  ["126", "126 邮箱"],
  ["sina", "新浪邮箱"],
  ["aliyun", "阿里邮箱"],
  ["gmail", "Gmail"],
  ["outlook", "Outlook"],
  ["icloud", "iCloud"],
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

/** 下拉的选项集合：8 个内置 + serverPresets 里的自定义名。 */
function providerOptions(presets) {
  const out = PROVIDERS.map(([value, label]) => ({ value, label }));
  const custom = (presets && presets.custom) || {};
  for (const name of Object.keys(custom)) {
    if (name === "") continue;
    if (out.some((option) => option.value === name)) continue;
    out.push({ value: name, label: name + "（自定义预设）" });
  }
  return out;
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
  const placeholder = { value, label: value === "" ? "（YAML 未指定服务商）" : value + "（未定义预设）" };
  return value === "" ? [placeholder].concat(out) : out.concat([placeholder]);
}

/** 预设名 -> 端点；内置预设在前端就是权威定义，自定义预设取快照里的。 */
function providerPreset(presets, provider) {
  if (provider === undefined || provider === null || provider === "") return undefined;
  const builtin = PROVIDERS.map(([value]) => value);
  const custom = (presets && presets.custom && presets.custom[provider]) || undefined;
  if (custom) return custom;
  return builtin.indexOf(provider) >= 0 ? { builtin: true } : undefined;
}

/**
 * 选中预设后填端点。内置预设的具体 host 由后端补（卡片上没填 take 预设值），
 * 这里只把端口/SSL 调成预设的样子；用户手填过 host 就保留，预设只是脚手架。
 * 空值（占位项 / 未指定）只改 provider，端点原样留着。
 */
const BUILTIN_PORTS = {
  qq: [993, 465], "163": [993, 465], "126": [993, 465], sina: [993, 465],
  aliyun: [993, 465], gmail: [993, 465], outlook: [993, 587], icloud: [993, 587],
};

function applyPreset(draft, presets, provider) {
  if (provider === "") return Object.assign({}, draft, { provider: "" });
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
  const entry = PROVIDERS.filter(([value]) => value === provider)[0];
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
    if (typeof props.onAutoSave !== "function") return;
    const names = orderNow.map((row) => row.key).filter((name) => Object.prototype.hasOwnProperty.call(draftsNow, name));
    let built;
    try {
      built = names.map((name) => draftToInput(draftsNow[name]));
    } catch (e) {
      console.error("[dsh-email] 卡片快照组装失败", e, names, draftsNow);
      return;
    }
    if (built.some((card) => String(card.name || "").trim() === "")) {
      setNotice({ kind: "error", text: "有账号还没填账号名，这份改动先不保存。" });
      return;
    }
    if (built.some((card) => card.name === "defaultAccount")) {
      setNotice({ kind: "error", text: "账号名不能是 defaultAccount（该键保留给默认账号），这份改动先不保存。" });
      return;
    }
    if (built.length > 1 && String(defaultNow || "") === "") {
      setNotice({ kind: "error", text: "有多个账号还没指定默认账号，这份改动先不保存。" });
      return;
    }
    setNotice(null);
    props.onAutoSave(built, String(defaultNow || ""), immediate === true);
  };

  const patchDraft = (name, patch) => {
    const next = Object.assign({}, draftsRef.current, { [name]: Object.assign({}, draftsRef.current[name], patch) });
    setDrafts(next);
    autoSave(next, orderRef.current, defaultAccount);
  };

  const renameDraft = (oldName, nextName) => {
    // 映射键必须立刻跟着名字走，否则改名会留下旧键的孤儿。
    // 行的 id 不动，所以改名不会让输入框重挂载失焦。
    const nextDrafts = renameDrafts(draftsRef.current, oldName, nextName);
    const nextOrder = rekeyRows(orderRef.current, oldName, nextName);
    const nextDefault = defaultAccount === oldName ? nextName : defaultAccount;
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
    setRowStatus((cur) => Object.assign({}, cur, { [draftName]: { kind: "busy", text: "测试中…" } }));
    try {
      // 测试也要看到「你正在编辑的这份表单」，所以抛给父级组装完整 value。
      const cardsNow = orderRef.current.map((row) => row.key)
        .filter((name) => Object.prototype.hasOwnProperty.call(draftsRef.current, name))
        .map((name) => draftToInput(draftsRef.current[name]));
      const result = await props.onTest(draftName, cardsNow, defaultAccount);
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

  const defaultMissing = order.length > 1 && !defaultAccount;

  return h("div", { className: "dshe-acc-list" }, [
    detail.error
      ? h("div", { className: "dshe-alert error" }, "accountsYaml 解析失败：" + detail.error)
      : null,
    props.extraNotice
      ? h("div", { className: "dshe-alert " + props.extraNotice.kind }, props.extraNotice.text)
      : null,
    defaultMissing
      ? h("div", { className: "dshe-alert error" }, [
          "配置了多个账号，请设置默认账号：",
          h("span", { className: "dshe-actions", style: { marginTop: 6 } },
            order.map((row) => h("button", {
              key: row.id,
              type: "button",
              className: "dshe-btn",
              onClick: () => setDefaultAccountAndSave(row.key),
            }, "设为默认：" + (drafts[row.key] ? drafts[row.key].name || row.key : row.key)))),
        ])
      : null,

    order.length === 0
      ? h("div", { className: "dshe-acc-empty" }, "还没有账号。点「+ 添加账号」新增一个。")
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
      return h("div", { key: id, className: "dshe-acc-card" }, [
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
              onClick: () => setOpen(expanded ? 0 : id),
            }, expanded ? "收起" : "编辑"),
            h("button", {
              type: "button",
              className: "dshe-btn",
              disabled: busy !== "" || draft.name === "",
              onClick: () => testCard(draft.name),
            }, busyHere ? "测试中…" : "测试连接"),
            h("button", {
              type: "button",
              className: "dshe-btn",
              disabled: isDefault || draft.name === "",
              onClick: () => setDefaultAccountAndSave(draft.name),
            }, isDefault ? "默认账号" : "设为默认"),
            h("button", {
              type: "button",
              className: "dshe-btn dshe-acc-danger",
              onClick: () => setConfirming(confirming === id ? 0 : id),
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
        confirming === id
          ? h("div", { className: "dshe-acc-confirm" }, [
              "删除账号「" + (draft.name || "（未命名）") + "」会在保存后从 YAML 里移除，已存密码一并丢失。",
              h("span", { className: "dshe-actions" }, [
                h("button", {
                  type: "button",
                  className: "dshe-btn dshe-acc-danger",
                  onClick: () => removeAccount(id),
                }, "确认删除"),
                h("button", { type: "button", className: "dshe-btn", onClick: () => setConfirming(0) }, "取消"),
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
                    value: draft.provider || "",
                    onChange: (e) => patchDraft(name, applyPreset(draft, presets, e.target.value)),
                  }, providerOptionsFor(presets, draft.provider).map((option) => h("option", { key: option.value, value: option.value }, option.label))),
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
                    disabled: busy !== "",
                    placeholder: "留空保持不变",
                    onChange: (e) => patchDraft(name, { password: e.target.value }),
                  }),
                  h("div", { className: "dshe-hint" },
                    (cards.filter((c) => String(c.name) === draft.name)[0] || {}).hasPassword
                      ? "已存有授权码：留空保持不变，清空后填内容即覆盖。"
                      : "留空即不写入 password 键。"),
                ]),
                h("div", { className: "dshe-field" }, [
                  h("label", null, "收件文件夹（默认 INBOX）"),
                  fieldInput("text", draft.inboxFolder, (v) => patchDraft(name, { inboxFolder: v }), "INBOX"),
                ]),
              ]),
            ])
          : null,
      ]);
    }),

    h("div", { className: "dshe-actions" }, [
      h("button", { type: "button", className: "dshe-btn", onClick: addAccount, disabled: busy !== "" }, "+ 添加账号"),
    ]),
    h("div", { className: "dshe-hint" },
      "改动会自动保存。"
      + (defaultMissing ? " 现在有多个账号但没有默认账号，必须先指定一个。" : "")),
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
          "serverPresets 解析失败：" + presets.error,
          h("div", { className: "dshe-hint", style: { marginTop: 4 } },
            "下面的卡片是从快照里的（空）预设表建的，不代表这份文本。可以直接改下面的 YAML 重新写一份。"),
        ])
      : null,

    order.length === 0
      ? h("div", { className: "dshe-prst-empty" },
          rebuiltCount === 0
            ? "还没有自定义服务器预设。点「+ 添加预设」，账号卡片的服务商下拉里就会多出这个名字。"
            : "卡片已清空：填完剩下的字段即会写回，删除全部 " + rebuiltCount + " 条预设。")
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
          h("span", { className: "dshe-prst-name" }, trimmed || "（未命名）"),
          label === "" ? null : h("span", { className: "dshe-prst-badge" }, label),
          empty ? h("span", { className: "dshe-prst-badge todo" }, "未命名") : null,
          renamed ? h("span", { className: "dshe-prst-badge todo dshe-prst-warn" }, "改名 → 删旧建新") : null,
          duplicate ? h("span", { className: "dshe-prst-badge todo dshe-prst-warn" }, "重名") : null,
          h("span", { className: "dshe-prst-actions" }, [
            h("button", {
              type: "button",
              className: "dshe-btn",
              onClick: () => setOpen(expanded ? 0 : id),
            }, expanded ? "收起" : "编辑"),
            h("button", {
              type: "button",
              className: "dshe-btn dshe-prst-danger",
              onClick: () => setConfirming(confirming === id ? 0 : id),
            }, "删除"),
          ]),
        ]),
        h("div", { className: "dshe-prst-meta" },
          "imap " + (draft.imap.host || "（未填主机）") + ":" + portLabel(draft.imap.port)
          + (draft.imap.secure === true ? " · SSL" : " · 明文")
          + " ｜ smtp " + (draft.smtp.host || "（未填主机）") + ":" + portLabel(draft.smtp.port)
          + (draft.smtp.secure === true ? " · SSL" : " · 明文")),
        confirming === id
          ? h("div", { className: "dshe-prst-confirm" }, [
              "删除预设「" + (trimmed || "（未命名）") + "」后，指向它的账号卡片会失去端点（服务商下拉里也不再列出它）。",
              h("span", { className: "dshe-actions" }, [
                h("button", { type: "button", className: "dshe-btn dshe-prst-danger", onClick: () => removePreset(id) }, "确认删除"),
                h("button", { type: "button", className: "dshe-btn", onClick: () => setConfirming(0) }, "取消"),
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
      h("button", { type: "button", className: "dshe-btn", onClick: addPreset }, "+ 添加预设"),
    ]),
    h("div", { className: "dshe-hint" },
      "预设不含邮箱地址和授权码，只记连接参数；账号卡片选了这个预设，就把端点填进账号。"
      + "改动会自动保存。"),

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
   * 选服务商 -> 填端点：内置预设走 BUILTIN_PORTS，自定义预设取快照里的端点。
   * 和账号卡片共用 applyPreset，两处的预填规则不会漂移。
   */
  const onProvider = (value) => {
    setDraft((cur) => applyPreset(cur, presetsMerged, value));
  };

  /** 防抖排期。immediate = 明确动作（确认删除），立刻落盘、不等那 800ms。 */
  const scheduleSave = (immediate) => {
    // 用户又改了：还在飞的那次保存结果就作废，别拿旧结果盖住新状态。
    seqRef.current += 1;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (immediate === true) {
      saveTimerRef.current = 0;
      flushSave();
      return;
    }
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = 0;
      flushSave();
    }, SAVE_DEBOUNCE_MS);
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
      const snap = await api("save", { value, expectedRevision: rev });
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

  /** 卡片快照 -> YAML 文本。种子用最近一次落盘的原文，注释能保就保。 */
  const serializeCards = async (cards, defaultAccount) => {
    const seed = savedYamlRef.current === null
      ? (draftRef.current ? draftRef.current.accountsYaml || "" : "")
      : savedYamlRef.current;
    return api("serializeAccounts", { accountsYaml: seed, accounts: cards, defaultAccount: defaultAccount || "" });
  };

  /** 卡片改动：先序列化，再交给同一条防抖管道保存（immediate = 删除这类明确动作）。 */
  const onCardsAutoSave = async (cards, defaultAccount, immediate) => {
    const seq = ++cardsSeqRef.current;
    try {
      const result = await serializeCards(cards, defaultAccount);
      if (seq !== cardsSeqRef.current) return; // 更晚的一次已经在路上，别用旧结果盖新状态
      const text = result && typeof result.accountsYaml === "string" ? result.accountsYaml : "";
      accountsYamlRef.current = text;
      update({ accountsYaml: text });
      setCardsNotice(
        result.commentsDropped || result.passwordsDropped
          ? {
            kind: "info",
            text: (result.commentsDropped ? "原文档无法就地编辑，注释已丢失；" : "")
              + (result.passwordsDropped ? "有账号的已存密码无法保留，请在对应卡片重输；" : "")
              + "其余改动已自动保存。",
          }
          : null,
      );
      scheduleSave(immediate === true);
    } catch (e) {
      setCardsNotice({ kind: "error", text: "账号改动没能写进 YAML：" + (e && e.message ? e.message : String(e)) });
    }
  };

  /**
   * 卡片「测试连接」：先把卡片序列化成 YAML，再用整份表单（含表单字段）去测。
   * 历史 bug 是这里只送了 accountsYaml —— 表单里的 provider/邮箱地址根本没进请求。
   */
  const onCardTest = async (accountName, cards, defaultAccount) => {
    const result = await serializeCards(cards, defaultAccount);
    const text = result && typeof result.accountsYaml === "string" ? result.accountsYaml : "";
    const value = settingsValueOf(draftRef.current, text);
    return api("test", { value, account: accountName });
  };

  const doTest = async () => {
    setTesting(true); setTestResult(undefined);
    try {
      const value = settingsValueOf(draftRef.current, accountsYamlRef.current === null ? "" : accountsYamlRef.current);
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
  const presetsMerged = presetsWithNames((snapshot && snapshot.presets) || undefined, customNames);
  const statusText = saveState === null
    ? "已保存"
    : saveState.kind === "busy"
      ? "保存中…"
      : saveState.kind === "saved"
        ? "已保存"
        : "保存失败：" + saveState.text + "（点击重试）";
  const status = h("span", {
    className: "dshe-auto-status" + (saveState === null ? "" : " is-" + saveState.kind),
    onClick: saveState !== null && saveState.kind === "error" ? () => flushSave() : undefined,
    style: saveState !== null && saveState.kind === "error" ? { cursor: "pointer" } : undefined,
  }, statusText);

  return h("div", { className: "dshe-settings" }, [
    h("header", { className: "dshe-header" }, [
      h("span", { className: "dshe-kicker" }, "dsh-email · IMAP/SMTP"),
      h("h2", null, "邮件"),
      h("p", null, "在这里配置邮箱账号，即可使用 10 个 email_* 工具。支持表单和多账号 YAML，改动自动保存、立即生效。"),
    ]),
    status,
    h("section", { className: "dshe-panel" }, [
      h("div", { className: "dshe-grid" }, [
        h("div", { className: "dshe-field" }, [
          h("label", null, "邮箱服务商"),
          h("select", { value: draft.provider || "", onChange: (e) => onProvider(e.target.value) },
            providerOptionsFor(presetsMerged, draft.provider)
              .map((option) => h("option", { key: option.value, value: option.value }, option.label))),
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
      h(AccountCardsEditor, {
        detail: cardsDetail,
        presets: presetsMerged,
        extraNotice: cardsNotice,
        onAutoSave: onCardsAutoSave,
        onTest: onCardTest,
      }),
      h("details", { className: "dshe-details dshe-prst-section" }, [
        h("summary", null, "服务器预设（自定义服务商，高级）"),
        h(ServerPresetsEditor, {
          presets: presetsAtLoad,
          onAutoSave: (text) => update({ serverPresets: typeof text === "string" ? text : "" }),
        }),
      ]),
      h("div", { className: "dshe-actions" }, [
        h("button", { className: "dshe-btn", disabled: busy || testing, onClick: doTest }, testing ? "测试中…" : "测试连接"),
      ]),
      snapshot && snapshot.writable === false
        ? h("div", { className: "dshe-alert info" }, "当前 settings 存储是只读的，只能查看不能保存。")
        : null,
    ]),
    error ? h("div", { className: "dshe-alert error" }, error) : null,
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
