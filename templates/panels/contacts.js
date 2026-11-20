// Local address book: recipient name resolution, compose autocomplete and the
// management panel. The book lives in the plugin's private data directory and is
// served by the same authenticated route as the mailbox actions.
const { contactBook: contactCss } = emailUi;
const CONTACT_REFRESH_INTERVAL_MS = 1500;
const CONTACT_RESULT_LIMIT = 8;
const contactBookState = { contacts: [], index: new Map(), loaded: false };
const contactSubscribers = new Set();
let contactRequestSeq = 0;
let contactRequestedAt = 0;

function contactKeyOf(address) {
  return String(address === undefined || address === null ? "" : address).trim().toLowerCase();
}
function contactRowKey(row) {
  return contactKeyOf(row && row.address);
}
function contactBookNotify() {
  for (const listener of [...contactSubscribers]) {
    try { listener(); } catch { /* one stale subscriber must not block the rest */ }
  }
}
function adoptContactRows(rows) {
  const clean = (Array.isArray(rows) ? rows : []).filter(row => row && typeof row === "object" && contactRowKey(row) !== "");
  const index = new Map();
  for (const row of clean) if (!index.has(contactRowKey(row))) index.set(contactRowKey(row), row);
  contactBookState.contacts = clean;
  contactBookState.index = index;
  contactBookState.loaded = true;
  contactBookNotify();
}
/** A mounted panel re-renders whenever the book changes; `active` triggers the load. */
function useContactBook(active) {
  const [, redraw] = useState(0);
  useEffect(() => {
    const listener = () => redraw(value => value + 1);
    contactSubscribers.add(listener);
    return () => { contactSubscribers.delete(listener); };
  }, []);
  useEffect(() => {
    if (active) void refreshContactBook();
  }, [!!active]);
  return contactBookState;
}
async function refreshContactBook(signal) {
  const seq = ++contactRequestSeq;
  try {
    const value = await mailboxApi("contacts", {}, signal);
    if (seq !== contactRequestSeq) return contactBookState;
    adoptContactRows(value && value.contacts);
  } catch {
    // Offline, an older host, or no configured account: names simply stay
    // unresolved. The reader must never fail because the address book did.
  }
  return contactBookState;
}
/** Mail pages learn new correspondents server-side; refresh names without a storm. */
function requestContactRefresh() {
  const now = Date.now();
  if (now - contactRequestedAt < CONTACT_REFRESH_INTERVAL_MS) return;
  contactRequestedAt = now;
  void refreshContactBook();
}

function contactEntryFor(address) {
  return contactBookState.index.get(contactKeyOf(address)) || null;
}
/**
 * Which name to show: a name the user curated always wins, because that is the
 * whole point of a private address book; otherwise the message header's own
 * display name is authoritative, and a learned name is only the last resort.
 */
function contactDisplayName(entry) {
  if (!entry) return "";
  const address = entry.address;
  const header = typeof entry.name === "string" ? entry.name.trim() : "";
  const contact = contactEntryFor(address);
  const curated = contact && contact.source === "manual" && contact.name ? String(contact.name).trim() : "";
  if (curated) return curated;
  if (header) return header;
  return contact && contact.name ? String(contact.name).trim() : "";
}
function formatAddressEntry(entry) {
  if (!entry) return "";
  const name = contactDisplayName(entry);
  const address = typeof entry.address === "string" ? entry.address : "";
  if (name && address) return name + " <" + address + ">";
  return address || name;
}
function formatAddressList(list) {
  return (Array.isArray(list) ? list : []).map(formatAddressEntry).filter(Boolean).join(", ");
}
function senderLabelOf(entry) {
  return contactDisplayName(entry) || (entry && typeof entry.address === "string" ? entry.address : "");
}
/** `Name <address>` for a bare address (draft reviews, rule hits, autocomplete). */
function contactLabelOf(address) {
  const raw = String(address === undefined || address === null ? "" : address);
  const contact = contactEntryFor(raw);
  const name = contact && contact.name ? String(contact.name).trim() : "";
  return name ? name + " <" + raw + ">" : raw;
}
/** One picked contact as an RFC 5322 address value. */
function contactAddressValue(contact) {
  const name = contact && contact.name ? String(contact.name).trim() : "";
  const address = contact && contact.address ? String(contact.address) : "";
  return name ? name + " <" + address + ">" : address;
}
/**
 * Does any precomputed key start with the typed token? Keys carry the pinyin
 * syllables, the initials, the latin words and the mailbox local part, so `zxm`,
 * `zhangxiaoming` and `100123` all reach 张小明 without a pinyin table in the browser.
 */
function contactKeyPrefix(keys, needle) {
  if (keys === "") return false;
  for (const token of keys.split(" ")) if (token.startsWith(needle)) return true;
  return false;
}
function contactMatches(query) {
  const needle = String(query === undefined || query === null ? "" : query).trim().toLowerCase();
  const rows = contactBookState.contacts;
  if (needle === "") return rows.slice(0, CONTACT_RESULT_LIMIT);
  const ranked = [];
  for (const contact of rows) {
    const name = String(contact.name || "").toLowerCase();
    const address = String(contact.address || "");
    const keys = String(contact.keys || "").toLowerCase();
    let score = -1;
    if (address === needle) score = 0;
    else if (address.startsWith(needle)) score = 1;
    else if (name !== "" && name.startsWith(needle)) score = 2;
    else if (contactKeyPrefix(keys, needle)) score = 3;
    else if (address.includes(needle)) score = 4;
    else if (name.includes(needle)) score = 5;
    else if (keys !== "" && keys.includes(needle)) score = 6;
    if (score >= 0) ranked.push({ contact, score });
  }
  ranked.sort((a, b) => a.score - b.score
    || (a.contact.source === "manual" ? 0 : 1) - (b.contact.source === "manual" ? 0 : 1)
    || (b.contact.uses || 0) - (a.contact.uses || 0)
    || String(a.contact.name || a.contact.address).localeCompare(String(b.contact.name || b.contact.address)));
  return ranked.slice(0, CONTACT_RESULT_LIMIT).map(row => row.contact);
}
function contactAddressError(address) {
  const value = String(address === undefined || address === null ? "" : address).trim();
  if (value === "" || value.length > 254) return true;
  const at = value.indexOf("@");
  return at <= 0 || at !== value.lastIndexOf("@") || at === value.length - 1 || /[\s<>",;:\\/]/.test(value);
}

/**
 * The token under the caret: everything between two recipient separators. It is
 * what autocomplete replaces, so completing the second or third recipient of a
 * list never eats the ones around it.
 */
function contactRecipientToken(value, caret) {
  const text = String(value === undefined || value === null ? "" : value);
  const at = Math.max(0, Math.min(text.length, Number.isFinite(caret) ? caret : text.length));
  const left = Math.max(text.lastIndexOf(",", at - 1), text.lastIndexOf(";", at - 1)) + 1;
  const tail = text.slice(at);
  const separator = /[,;]/.exec(tail);
  const right = separator ? at + separator.index : text.length;
  return { text: text.slice(left, at), left, right };
}

/**
 * Replace the recipient under the caret with `Name <address>` and keep the
 * neighbouring recipients (and their separators) exactly as they were. Kept pure
 * so the composer's completion rule is testable without a DOM.
 */
function contactCompleteRecipient(value, caret, contact) {
  const text = String(value === undefined || value === null ? "" : value);
  const token = contactRecipientToken(text, caret);
  const formatted = contactAddressValue(contact);
  const prefix = text.slice(0, token.left).replace(/[\s,;]+$/, "");
  const suffix = text.slice(token.right);
  return {
    value: (prefix === "" ? "" : prefix + ", ") + formatted + suffix,
    caret: (prefix === "" ? 0 : prefix.length + 2) + formatted.length,
  };
}

/**
 * Index of the suggestion whose address is exactly the typed token, or -1.
 * Completing a fully typed address on Enter/Tab is what brings the contact's
 * name along even when the user never opened the suggestion list.
 */
function contactExactMatch(suggestions, text) {
  const needle = String(text === undefined || text === null ? "" : text).trim().toLowerCase();
  if (needle === "") return -1;
  for (let index = 0; index < suggestions.length; index += 1) {
    if (String(suggestions[index] && suggestions[index].address || "").toLowerCase() === needle) return index;
  }
  return -1;
}

function RecipientField({ id, label, value, disabled, invalid, modalAutofocus, onChange }) {
  const listId = id + "-suggestions";
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [caret, setCaret] = useState(String(value === undefined || value === null ? "" : value).length);
  const [active, setActive] = useState(-1);
  const book = useContactBook(true);
  const token = contactRecipientToken(value, caret);
  const suggestions = open ? contactMatches(token.text) : [];
  const showList = open && suggestions.length > 0;
  const showEmpty = open && !showList && book.loaded && token.text.trim() !== "";

  function accept(index) {
    const contact = suggestions[index];
    if (!contact) return;
    const text = String(value === undefined || value === null ? "" : value);
    const next = contactCompleteRecipient(text, caret, contact);
    const position = next.caret;
    setOpen(false);
    setActive(-1);
    onChange(next.value);
    setCaret(position);
    // The dialog re-renders synchronously; place the caret after the inserted
    // address once React has committed the new value.
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      try { input.focus(); input.setSelectionRange(position, position); } catch { /* jsdom and old browsers */ }
    });
  }

  function onKeyDown(event) {
    if (event.isComposing || (event.nativeEvent && event.nativeEvent.isComposing)) return;
    if (event.key === "ArrowDown") {
      if (!suggestions.length) return;
      event.preventDefault();
      setOpen(true);
      setActive(index => (index + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp") {
      if (!suggestions.length) return;
      event.preventDefault();
      setActive(index => (index <= 0 ? suggestions.length - 1 : index - 1));
      return;
    }
    if (event.key === "Enter" && open && active >= 0 && suggestions[active]) {
      event.preventDefault();
      event.stopPropagation?.();
      accept(active);
      return;
    }
    if (event.key === "Tab" && open && active >= 0 && suggestions[active]) {
      event.preventDefault();
      accept(active);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation?.();
      setOpen(false);
      setActive(-1);
      return;
    }
    if ((event.key === "Enter" || event.key === "Tab") && open) {
      // A fully typed address is completed too: Tab/Enter brings the contact's
      // display name without requiring the user to pick from the list.
      const exact = contactExactMatch(suggestions, token.text);
      if (exact >= 0) {
        event.preventDefault();
        accept(exact);
        return;
      }
      setOpen(false);
    }
  }

  return h("div", { className: contactCss.recipient },
    h("input", {
      id, ref: inputRef, type: "text", value, maxLength: 4096,
      className: contactCss.recipientInput,
      role: "combobox", "aria-autocomplete": "list", "aria-expanded": showList ? "true" : "false",
      "aria-controls": listId, "aria-activedescendant": showList && active >= 0 ? listId + "-" + active : undefined,
      "aria-invalid": invalid ? "true" : undefined,
      "aria-label": label, placeholder: dt("输入姓名或邮箱", "Type a name or address"),
      autoComplete: "off", spellCheck: false, disabled,
      "data-modal-autofocus": modalAutofocus ? "" : undefined,
      onChange: event => {
        const input = event.target;
        setCaret(input.selectionStart === null || input.selectionStart === undefined ? input.value.length : input.selectionStart);
        setActive(-1);
        setOpen(true);
        onChange(input.value);
      },
      onKeyDown,
      onKeyUp: event => {
        if (!["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(event.key)) {
          const input = event.currentTarget;
          setCaret(input.selectionStart === null || input.selectionStart === undefined ? input.value.length : input.selectionStart);
        }
      },
      onClick: event => {
        const input = event.currentTarget;
        setCaret(input.selectionStart === null || input.selectionStart === undefined ? input.value.length : input.selectionStart);
      },
      onFocus: event => {
        const input = event.currentTarget;
        setCaret(input.selectionStart === null || input.selectionStart === undefined ? input.value.length : input.selectionStart);
        setActive(-1);
        setOpen(true);
      },
      onBlur: () => { setOpen(false); setActive(-1); },
    }),
    showList ? h("ul", { id: listId, className: contactCss.suggestions, role: "listbox", "aria-label": dt("联系人建议", "Contact suggestions") },
      suggestions.map((contact, index) => h("li", {
        key: contact.id, id: listId + "-" + index, role: "option",
        "aria-selected": index === active ? "true" : "false",
        className: contactCss.suggestion, "data-active": index === active ? "true" : "false",
        title: contact.address,
        // mousedown keeps focus in the input, so picking never races the blur handler.
        onMouseDown: event => { event.preventDefault(); accept(index); },
      },
        h("span", { className: contactCss.suggestionName }, contact.name || contact.address),
        contact.name ? h("span", { className: contactCss.suggestionAddress }, contact.address) : null)))
      : showEmpty ? h("div", { className: contactCss.suggestionEmpty, role: "status" }, dt("没有匹配的联系人", "No matching contacts")) : null);
}

function ContactWorkbench({ active }) {
  const [rows, setRows] = useState([]);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", address: "", note: "" });
  const [removing, setRemoving] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const running = useRef(false);

  useEffect(() => {
    if (!active) return undefined;
    const ctrl = new AbortController();
    setPhase("loading");
    setError("");
    mailboxApi("contacts", {}, ctrl.signal)
      .then(value => {
        if (ctrl.signal.aborted) return;
        const list = value && Array.isArray(value.contacts) ? value.contacts : [];
        setRows(list);
        adoptContactRows(list);
        setPhase("ready");
      })
      .catch(cause => {
        if (ctrl.signal.aborted) return;
        setPhase("error");
        setError(emailError(cause));
      });
    return () => ctrl.abort();
  }, [active, reloadToken]);

  function run(action) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    Promise.resolve()
      .then(action)
      .catch(cause => setError(emailError(cause)))
      .finally(() => { running.current = false; setBusy(false); });
  }

  function reload() {
    setReloadToken(token => token + 1);
  }

  function edit(row) {
    setForm({ id: row.id, name: row.name || "", address: row.address || "", note: row.note || "" });
    setNotice("");
    setError("");
  }

  function resetForm() {
    setForm({ id: "", name: "", address: "", note: "" });
    setError("");
  }

  function save() {
    if (busy) return;
    if (contactAddressError(form.address)) { setError(dt("邮箱格式不正确", "Check the email address")); return; }
    run(async () => {
      await mailboxApi("contactSave", { id: form.id || undefined, name: form.name, address: form.address, note: form.note });
      setForm({ id: "", name: "", address: "", note: "" });
      setNotice(dt("联系人已保存", "Contact saved"));
      reload();
    });
  }

  function remove(row) {
    return run(async () => {
      await mailboxApi("contactDelete", { id: row.id });
      setRemoving(null);
      setNotice(dt("联系人已删除", "Contact deleted"));
      reload();
    });
  }

  const needle = query.trim().toLowerCase();
  const visible = needle === "" ? rows : rows.filter(row =>
    String(row.name || "").toLowerCase().includes(needle) || String(row.address || "").toLowerCase().includes(needle));

  const editor = h("div", { className: contactCss.editor },
    h("div", { className: contactCss.fields },
      h("label", { className: contactCss.field }, h("span", null, dt("姓名", "Name")),
        h("input", {
          type: "text", value: form.name, maxLength: 120, disabled: busy,
          placeholder: dt("姓名", "Name"),
          onChange: event => setForm(old => ({ ...old, name: event.target.value })),
        })),
      h("label", { className: contactCss.field }, h("span", null, dt("邮箱地址", "Email address")),
        h("input", {
          type: "email", value: form.address, maxLength: 254, disabled: busy,
          "aria-invalid": form.address !== "" && contactAddressError(form.address) ? "true" : undefined,
          placeholder: "name@example.com",
          onChange: event => setForm(old => ({ ...old, address: event.target.value })),
        })),
      h("label", { className: contactCss.field }, h("span", null, dt("备注（可选）", "Note (optional)")),
        h("input", {
          type: "text", value: form.note, maxLength: 200, disabled: busy,
          onChange: event => setForm(old => ({ ...old, note: event.target.value })),
        }))),
    h("div", { className: contactCss.actions },
      h(W.Button, { variant: "primary", icon: form.id ? "check" : "plus", disabled: busy || form.address.trim() === "", onClick: save },
        form.id ? dt("保存联系人", "Save contact") : dt("添加联系人", "Add contact")),
      form.id ? h(W.Button, { disabled: busy, onClick: resetForm }, dt("取消", "Cancel")) : null,
      form.id ? h("span", { className: contactCss.hint }, dt("编辑联系人", "Edit contact") + " · " + form.address) : null));

  return h("section", { className: contactCss.contacts, "aria-label": dt("通讯录", "Contacts") },
    h("div", { className: contactCss.book },
      h("header", { className: contactCss.toolbar },
        h("h2", { "data-dsh-serif": "" }, dt("通讯录", "Contacts") + " · " + rows.length),
        h(W.Button, { icon: "refresh", "aria-busy": busy || undefined, disabled: busy, onClick: reload }, dt("刷新", "Refresh"))),
      h("p", { className: contactCss.hint }, dt("读过的邮件会自动收集往来地址，也可以在这里手动添加。", "Addresses from messages you open are collected automatically; you can also add one here.")),
      h(W.Status, { tone: "error" }, error),
      h(W.Status, { tone: "success" }, notice),
      editor,
      h("label", { className: contactCss.search },
        h("input", {
          type: "search", value: query, maxLength: 200, disabled: busy,
          "aria-label": dt("搜索联系人或邮箱", "Search contacts or addresses"),
          placeholder: dt("搜索联系人或邮箱", "Search contacts or addresses"),
          onChange: event => setQuery(event.target.value),
        })),
      phase === "loading" && rows.length === 0 ? h("div", { role: "status", "aria-busy": "true" },
        h(W.Skeleton, { variant: "row" }), h(W.Skeleton, { variant: "row" })) : null,
      phase === "error" && rows.length === 0
        ? h(W.Empty, {
          title: dt("通讯录暂时无法读取", "Contacts are unavailable"), icon: "info",
          action: h(W.Button, { disabled: busy, onClick: reload }, dt("重试", "Retry")),
        })
        : visible.length
          ? h("ul", { className: contactCss.rows },
            visible.map(row => h("li", { key: row.id, className: contactCss.row, "data-active": form.id === row.id ? "true" : undefined },
              h("div", { className: contactCss.identity },
                h("strong", { className: contactCss.name }, row.name || row.address),
                row.name ? h("span", { className: contactCss.address }, row.address) : null,
                h("span", { className: contactCss.meta },
                  h("span", { className: contactCss.badge, "data-source": row.source === "manual" ? "manual" : "auto" },
                    row.source === "manual" ? dt("手动添加", "Added manually") : dt("自动收集", "Auto-collected")),
                  row.note ? h("span", null, row.note) : null)),
              h("div", { className: contactCss.rowActions },
                h(W.Button, { disabled: busy, onClick: () => edit(row) }, dt("编辑", "Edit")),
                h(W.IconButton, { icon: "trash", variant: "danger", label: dt("删除联系人", "Delete contact"), disabled: busy, onClick: () => setRemoving(row) })))))
          : h(W.Empty, { title: dt("还没有联系人", "No contacts yet"), icon: "mail" },
            dt("读过的邮件会自动收集往来地址，也可以在这里手动添加。", "Addresses from messages you open are collected automatically; you can also add one here."))),
    removing ? h(W.Dialog, {
      title: dt("删除联系人", "Delete contact"),
      closeLabel: dt("关闭", "Close"), busy,
      onClose: () => setRemoving(null),
      footer: h(React.Fragment, null,
        h(W.Button, { disabled: busy, onClick: () => setRemoving(null) }, dt("取消", "Cancel")),
        h(W.Button, { variant: "danger", disabled: busy, onClick: () => remove(removing) }, dt("确认删除", "Confirm delete"))),
    },
      h(W.Status, { tone: "error" }, error),
      h("p", null, dt("只删除本地通讯录条目，不会影响邮箱中的邮件。", "Deletes only this local contact; messages stay untouched.")),
      h("p", { className: contactCss.hint }, (removing.name || removing.address) + (removing.name ? " <" + removing.address + ">" : ""))) : null);
}