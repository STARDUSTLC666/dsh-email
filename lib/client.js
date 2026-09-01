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
  imap: { host: "", port: 993, secure: true },
  smtp: { host: "", port: 465, secure: true },
};

const CSS = [
  ".dshe-settings{display:grid;gap:14px;max-width:900px;padding:8px 2px 32px;color:var(--dsw-alias-fg-primary,#26231f);color-scheme:light dark}",
  ".dshe-header{display:grid;gap:4px;padding:8px 2px}",
  ".dshe-header h2{font-size:22px;letter-spacing:-.02em;margin:0}",
  ".dshe-header p{max-width:640px;margin:4px 0 0;color:var(--dsw-alias-fg-muted,#77736d);font-size:13px;line-height:1.55}",
  ".dshe-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#0b6c9f;font-weight:700}",
  ".dshe-panel{display:grid;gap:12px;padding:15px;border:1px solid var(--dsw-alias-border-subtle,#dedbd5);border-radius:14px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 1px 1px rgba(0,0,0,.02)}",
  ".dshe-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
  ".dshe-field{display:grid;gap:6px}",
  ".dshe-field label{font-size:12px;font-weight:600;color:var(--dsw-alias-fg-primary,#26231f)}",
  ".dshe-field input[type=text],.dshe-field input[type=password],.dshe-field input[type=number],.dshe-field select,.dshe-field textarea{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--dsw-alias-border-subtle,#dedbd5);border-radius:9px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-fg-primary,#26231f);font:inherit;font-size:13px}",
  ".dshe-field select option{background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-fg-primary,#26231f)}",
  ".dshe-check{display:flex;gap:8px;align-items:center;font-size:13px}",
  ".dshe-actions{display:flex;gap:8px;flex-wrap:wrap}",
  ".dshe-btn{display:inline-flex;align-items:center;height:32px;padding:0 14px;border-radius:999px;border:1px solid var(--dsw-alias-border-subtle,#dedbd5);background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font-size:13px;font-weight:600;cursor:pointer}",
  ".dshe-btn.primary{background:#0b6c9f;border-color:#0b6c9f;color:#fff}",
  ".dshe-btn:disabled{opacity:.55;cursor:default}",
  ".dshe-alert{padding:10px 12px;border-radius:10px;font-size:12px;line-height:1.5}",
  ".dshe-alert.error{background:rgba(205,72,72,.1);color:#aa3939}",
  ".dshe-alert.success{background:rgba(48,154,100,.1);color:#267d52}",
  ".dshe-alert.info{background:rgba(11,108,159,.08);color:#0b5c86}",
  ".dshe-details summary{font-size:12px;font-weight:600;cursor:pointer;color:var(--dsw-alias-fg-muted,#77736d)}",
  ".dshe-hint{font-size:12px;color:var(--dsw-alias-fg-muted,#77736d);line-height:1.5}",
  ".dshe-whale-root{position:fixed;right:20px;bottom:20px;z-index:2147483000;pointer-events:none}",
  ".dshe-whale-card{pointer-events:auto;position:relative;width:300px;border:1px solid var(--dsw-alias-border-subtle,#dedbd5);border-radius:14px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 10px 30px rgba(0,0,0,.18);overflow:hidden;animation:dshe-whale-in .35s ease-out;font-size:13px;color:var(--dsw-alias-fg-primary,#26231f);color-scheme:light dark}",
  "@keyframes dshe-whale-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}",
  ".dshe-whale-img{display:block;width:100%;height:120px;object-fit:cover;object-position:center top;background:#eaf3f8}",
  ".dshe-whale-body{padding:10px 12px 12px;display:grid;gap:6px}",
  ".dshe-whale-title{font-weight:700;font-size:13px}",
  ".dshe-whale-item{color:var(--dsw-alias-fg-muted,#77736d);font-size:12px;line-height:1.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".dshe-whale-credit{font-size:10px;color:var(--dsw-alias-fg-muted,#77736d);opacity:.8;line-height:1.4}",
  ".dshe-whale-close{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;border:none;background:rgba(0,0,0,.35);color:#fff;cursor:pointer;font-size:12px;line-height:1}",
].join("\n");

function fieldInput(type, value, onChange, placeholder) {
  return h("input", {
    type,
    value: value === undefined || value === null ? "" : String(value),
    placeholder,
    onChange: (e) => onChange(e.target.value),
  });
}

function EmailSettingsSection() {
  const [draft, setDraft] = useState(null);
  const [snapshot, setSnapshot] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(undefined);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  const doSave = async () => {
    setBusy(true); setError(""); setMessage(""); setTestResult(undefined);
    try {
      const rev = snapshot && snapshot.settings ? snapshot.settings.revision : 0;
      const value = {
        ...draft,
        maxBodyChars: typeof draft.maxBodyChars === "number" ? draft.maxBodyChars : 20000,
        imap: { ...draft.imap, port: Number(draft.imap.port) || 993 },
        smtp: { ...draft.smtp, port: Number(draft.smtp.port) || 465 },
      };
      const snap = await api("save", { value, expectedRevision: rev });
      setSnapshot(snap);
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
      h("p", null, "在这里填写邮箱账号，六个 email_* 工具立即生效，无需手写 YAML。密码字段标记为 secret，不会出现在任何导出里。"),
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
      h("details", { className: "dshe-details" }, [
        h("summary", null, "多账号（高级，YAML）"),
        h("div", { className: "dshe-field", style: { marginTop: 10 } }, [
          h("textarea", {
            rows: 7,
            value: draft.accountsYaml || "",
            placeholder: "work: { provider: qq, user: work@qq.com, password: 授权码1 }\nhome: { provider: '163', user: home@163.com, password: 授权码2 }\ndefaultAccount: work",
            onChange: (e) => update({ accountsYaml: e.target.value }),
          }),
          h("div", { className: "dshe-hint" }, "账号名 -> 配置的映射，可含 defaultAccount 键。填了这里会覆盖 cordis.patch.yml 里的 accounts 映射；工具调用时用 account 参数选账号。"),
        ]),
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
      ? h("div", { className: "dshe-hint" }, "当前生效账号：" + accounts.join("、") + "（多账号 accounts 映射仍走 cordis.patch.yml）")
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