const DRAFT_ROUTE = "api/dsh-email/drafts";
const draftAttachmentSize = bytes => bytes >= 1024 * 1024 ? (bytes / 1024 / 1024) + " MiB" : (bytes / 1024) + " KiB";
// Retain edits for the current browser session when the host closes settings.
let draftUiCache = null;
async function draftApi(action, payload, upload, signal) {
  const init = { credentials: "same-origin", method: "POST", headers: { "x-dsh-email-draft": "1", "Content-Type": upload ? "application/octet-stream" : "application/json" }, signal };
  if (upload) {
    Object.assign(init.headers, { "x-dsh-draft-id": payload.id, "x-dsh-draft-revision": String(payload.revision), "x-dsh-draft-filename": encodeURIComponent(upload.name) });
    init.body = upload;
  } else {
    init.body = JSON.stringify({ ...payload, action });
  }
  const response = await fetch(upload ? DRAFT_ROUTE + "/upload" : DRAFT_ROUTE, init);
  const result = await response.json();
  if (!response.ok || !result.ok) {
    const error = new Error(result.error && result.error.message || dt("邮件操作失败", "Email action failed"));
    error.code = result.error && result.error.code;
    error.status = response.status;
    error.message = emailError(error);
    throw error;
  }
  return result.value;
}

const draftForm = draft => ({
  account: draft.account || "", to: draft.to || "", cc: draft.cc || "", subject: draft.subject || "",
  text: draft.text || "", html: draft.html || "", sendAt: draft.sendAt || "", attachments: draft.attachments.map(file => file.id),
});
const draftState = state => ({
  draft: dt("未发送", "Not sent"),
  scheduled: dt('等待定时发送','Scheduled'),
  sending: dt("正在提交 / 待核对", "Submitting / check mailbox"),
  sent: dt("已保存服务端回执", "Server receipt saved"),
  uncertain: dt("结果未确定，请核对邮箱", "Outcome uncertain, check mailbox"),
})[state] || state;
const emptyRecipientPolicy = { skipApproval: false, addresses: [], domains: [], denyAddresses: [], denyDomains: [] };

function useDraftRecipientCheck(open, account, to, cc) {
  const [rules, setRules] = useState(null);
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!open) { setRules(null); setResult(null); return; }
    const ctrl = new AbortController();
    draftApi('rules', {}, undefined, ctrl.signal).then(value => {
      if (!ctrl.signal.aborted) setRules(value);
    }).catch(() => {
      // The saved-draft review still performs the authoritative policy check.
    });
    return () => ctrl.abort();
  }, [open]);

  const checkKey = open && account && to.trim() && rules?.accounts.includes(account) ? JSON.stringify([account, to, cc, rules.revision]) : null;
  useEffect(() => {
    if (!checkKey) return;
    const ctrl = new AbortController();
    const policy = Object.hasOwn(rules.policies, account) ? rules.policies[account] : emptyRecipientPolicy;
    const timer = setTimeout(() => {
      draftApi('matchRules', { account, to, cc, policy }, undefined, ctrl.signal)
        .then(matching => { if (!ctrl.signal.aborted) setResult({ key: checkKey, matching }); })
        .catch(error => { if (!ctrl.signal.aborted) setResult({ key: checkKey, error: emailError(error) }); });
    }, 300);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [checkKey, rules]);

  return result?.key === checkKey ? result : null;
}

function DraftSafeBody({ rich, text }) {
  return h('div', { className: draftCss.previewBody }, rich?.nodes?.length
    ? h('div', { className: mailCss.rich }, renderMailNodes(rich.nodes, {
      styled: true, image: ({ image }, key) => rich.images[image]?.alt ? h('span', { key }, rich.images[image].alt) : null,
    }))
    : h('pre', null, text || dt('（空正文）', '(Empty body)')));
}

function DraftBodyEditor({ id, mode, setMode, form, locked, busy, onChange }) {
  const control = id + '-body';
  const rich = React.useMemo(() => mode === 'preview' ? emailUi.richEmailBody(form.html, [], true) : null, [mode, form.html]);
  const modes = [
    { value: 'text', label: dt('纯文本','Plain text') },
    { value: 'html', label: dt('HTML 排版','Formatted HTML') },
    { value: 'preview', label: dt('安全预览','Safe preview') },
  ];
  function textarea(key, label, rows) {
    const fieldId = control + '-' + mode + '-' + key;
    return h('div', { className: draftCss.field },
      h('label', { htmlFor: fieldId }, label),
      h('textarea', { id: fieldId, className: key === 'html' ? draftCss.source : undefined,
        value: form[key], rows, disabled: busy || locked, maxLength: 102400, onChange: event => onChange(key, event.target.value) }));
  }
  return h(React.Fragment, null,
    h(W.primitives().SegmentedControl, { id: control, className: draftCss.modes, value: mode, options: modes, onChange: setMode, label: dt('正文格式','Body format'), disabled: busy }),
    h('div', { className: draftCss.modePanel, role: 'tabpanel', id: control + '-' + mode + '-panel', 'aria-labelledby': control + '-' + mode },
      mode === 'preview' ? h(React.Fragment, null, h(DraftSafeBody, { rich, text: form.text }),
        rich?.limited ? h(W.Status, null, dt('正文或图文结构超过显示上限，部分内容已省略。可切换纯文本或用邮箱客户端查看。', 'Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.')) : null)
        : mode === 'html' ? h(React.Fragment, null,
          textarea('html', dt('HTML 正文','HTML body'), 6),
          textarea('text', dt('纯文本备选（可选）','Plain-text alternative (optional)'), 2),
          h('p', { className: draftCss.hint }, dt('预览并发送安全排版；未填写纯文本时自动生成。脚本和外部图片会移除。','Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.')))
          : textarea('text', dt('正文','Message'), 6)));
}

function DraftSendReview({ preview, busy, acknowledged, onAcknowledge }) {
  const from = preview.from.name ? preview.from.name + " <" + preview.from.address + ">" : preview.from.address;
  return h('div', { className: draftCss.review },
    h('dl', { className: draftCss.reviewFacts, 'data-dsh-card': '' },
      h('div', null, h('dt', null, dt('发件账号', 'Sending account')), h('dd', null, from)),
      h('div', null, h('dt', null, dt('主题', 'Subject')), h('dd', null, preview.draft.subject)),
      preview.draft.sendAt ? h('div', null, h('dt', null, dt('定时发送时间', 'Scheduled send time')), h('dd', null, formatDate(preview.draft.sendAt))) : null),
    preview.matching.blocked ? h(W.Status, { tone: 'error' }, dt('有收件人命中禁止规则，无法发送。请修改草稿或收件人规则。', 'A recipient is blocked. Change the draft or recipient rules before sending.')) : null,
    h('ul', { className: draftCss.recipients }, preview.matching.rows.map((row, index) => h('li', { key: index, 'data-blocked': row.blocked },
      (row.field === 'cc' ? 'Cc: ' : 'To: ') + contactLabelOf(row.address) + ' · ' + (row.blocked ? dt('禁止发送：', 'Blocked: ') + row.value : row.matched ? dt('匹配可信规则', 'Matches a trusted rule') : dt('需要确认', 'Needs confirmation'))))),
    h(DraftSafeBody, { rich: preview.body?.rich, text: preview.body?.text || preview.draft.text }),
    preview.body?.rich?.nodes?.length ? h('details', { className: draftCss.plainAlternative },
      h('summary', null, dt('查看纯文本备选','View plain-text alternative')), h('pre', null, preview.body.text)) : null,
    preview.attachments.length ? h('ul', { className: draftCss.fileList }, preview.attachments.map(file => h('li', { key: file.id, className: draftCss.fileRow },
      h('span', null, file.filename + ' · ' + Math.ceil(file.size / 1024) + ' KiB'),
      h('a', { href: DRAFT_ROUTE + '?preview=' + encodeURIComponent(preview.id) + '&attachment=' + encodeURIComponent(file.id), download: file.filename }, dt('下载检查', 'Download to check')))))
      : h('p', { className: draftCss.hint }, dt('没有附件', 'No attachments')),
    h('p', { className: draftCss.hint }, dt('附件已固定为本次预览快照。10 分钟后需重新预览；修改草稿、账号或规则也会使预览失效。', 'Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.')),
    h(W.Checkbox, { label: dt('我已核对发件人、所有收件人、正文和附件', 'I checked the sender, all recipients, content and attachments'), checked: acknowledged, disabled: busy, onChange: onAcknowledge, modalAutofocus: true }));
}

function ScheduleDraftField({ value, disabled, onChange }) {
  const [show, setShow] = useState(!!value);
  const enabled = show || !!value;
  const date = value ? new Date(value) : null;
  const local = date && Number.isFinite(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
  const label = dt('定时发送（可选，当前设备时区）','Schedule (optional, this device’s timezone)');
  return h('div', { className: draftCss.schedule },
    h('div', { className: draftCss.scheduleToggle },
      h('span', { className: draftCss.fieldLabel }, label),
      h(W.primitives().Switch, { label, checked: enabled, disabled, onChange: next => { setShow(next); if (!next) onChange(''); } })),
    enabled ? h(React.Fragment, null,
      h('label', { className: draftCss.field }, h('span', { className: draftCss.fieldLabel }, dt('定时发送时间','Scheduled send time')),
        h('input', { type: 'datetime-local', value: local, disabled, onInput: event => {
          const value = event.target.value;
          onChange(value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : '');
        } })),
      h('p', { className: draftCss.hint }, dt('需保持 DSH 运行。关闭期间错过的时间不会自动补发；提交结果不确定时也不会自动重试。','Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.'))) : null);
}

function DraftWorkbench({ active, defaultAccount, composeRequest, onComposeFinished }) {
  const id = React.useId();
  // Recipient autocomplete and the review list read the shared address book.
  useContactBook(active);
  const [data, setData] = useState({ drafts: [], accounts: [] });
  const [selected, setSelected] = useState(() => draftUiCache?.selected || null);
  const [form, setForm] = useState(() => draftUiCache?.form || null);
  const [mode, setMode] = useState(() => draftUiCache?.form?.html ? 'html' : 'text');
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [pending, setPending] = useState(null);
  const [localAction, setLocalAction] = useState(null);
  const operation = useRef(false);
  const handledRequest = useRef(null);
  const dirty = !!selected && !!form && JSON.stringify(form) !== JSON.stringify(draftForm(selected));
  const locked = !selected || selected.state !== 'draft';
  const sender = form?.account || defaultAccount;
  const live = useDraftRecipientCheck(editorOpen && !locked, sender, form?.to || '', form?.cc || '');
  const denied = live?.matching?.rows.filter(row => row.blocked) || [];
  const attachmentCap = data.attachmentLimits?.[sender] ?? data.attachmentLimit ?? 20 * 1024 * 1024;
  const capLabel = draftAttachmentSize(attachmentCap);

  __stardustUpdatesGuard(React, "dsh-email.draft", { dirty, busy, retainOnClose: true });
  useEffect(() => { draftUiCache = { selected, form }; }, [selected, form]);
  useEffect(() => { if (active) void run(reload); }, [active]);
  useEffect(() => {
    if (!dirty) return;
    const guard = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  useEffect(() => {
    if (!composeRequest || handledRequest.current === composeRequest.id || busy || operation.current) return;
    handledRequest.current = composeRequest.id;
    requestSwitch(composeRequest.draftId ? { kind: 'open', id: composeRequest.draftId } : { kind: 'new', account: composeRequest.account });
    onComposeFinished();
  }, [composeRequest, busy, onComposeFinished]);

  async function reload() {
    const value = await draftApi('list');
    setData(value);
    return value;
  }

  async function run(action) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (error) {
      setError(emailError(error));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  function adopt(draft, resetMode = true) {
    setSelected(draft);
    setForm(draftForm(draft));
    if (resetMode) setMode(draft.html ? 'html' : 'text');
    setPreview(null);
    setAcknowledged(false);
    setLocalAction(null);
    setNotice('');
  }

  async function save() {
    const value = await draftApi('update', { ...form, id: selected.id, revision: selected.revision });
    adopt(value, false);
    await reload();
    setNotice(dt('草稿已保存，邮件未发送。', 'Draft saved. No email was sent.'));
  }

  async function switchTo(target) {
    if (target.kind === 'close') {
      setForm(draftForm(selected));
      setEditorOpen(false);
      setLocalAction(null);
      setPending(null);
      return;
    }

    const draft = target.kind === 'new'
      ? await draftApi('create', { account: target.account || '', to: '', cc: '', subject: '', text: '' })
      : await draftApi('get', { id: target.id });
    adopt(draft);
    setEditorOpen(true);
    setPending(null);
    await reload();
  }

  function requestSwitch(target) {
    if (target.kind === 'open' && target.id === selected?.id && dirty) {
      setEditorOpen(true);
      return;
    }
    if (dirty) setPending(target);
    else if (target.kind === 'close') { setEditorOpen(false); setLocalAction(null); }
    else void run(() => switchTo(target));
  }

  function change(field, value) {
    setForm(old => ({ ...old, [field]: value }));
    setPreview(null);
    setAcknowledged(false);
    setNotice('');
  }

  function changeMode(next) {
    setMode(next);
    if (next === 'preview' || locked) return;
    setForm(old => {
      if (next === 'html' && !old.html && old.text) return {
        ...old, html: '<p>' + old.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>',
      };
      if (next === 'text' && old.html) return { ...old, html: '', text: old.text || old.html.replace(/<[^>]*>/g, ' ') };
      return old;
    });
    setNotice('');
  }

  function cancelReview() {
    return run(async () => {
      await draftApi('cancelPreview', { id: selected.id });
      setPreview(null);
      setAcknowledged(false);
      setNotice(dt('预览已取消，邮件未发送。', 'Review cancelled. No email was sent.'));
    });
  }

  function confirmSend() {
    return run(async () => {
      try {
        const sendAt = preview.draft.sendAt;
        const value = await draftApi(sendAt ? 'schedule' : 'send', { id: selected.id, preview: preview.id, confirmed: true, ...(sendAt ? { sendAt } : {}) });
        adopt(value.draft);
      } finally {
        setPreview(null);
        setAcknowledged(false);
        const fresh = await reload();
        const current = fresh.drafts.find(draft => draft.id === selected.id);
        if (current && current.state !== 'draft') adopt(current);
      }
    });
  }

  function upload(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    return run(async () => {
      const fresh = await draftApi('get', { id: selected.id, revision: selected.revision, checkAttachments: true });
      setData(old => ({ ...old, attachmentLimits: { ...old.attachmentLimits, [sender]: fresh.attachmentLimit } }));
      if (fresh.attachmentCount + files.length > 10) throw new Error(t("draft.attachmentCount"));
      const total = files.reduce((bytes, file) => bytes + file.size, fresh.attachmentSize);
      if (total > fresh.attachmentLimit) throw new Error(t("draft.attachmentTotal", { size: draftAttachmentSize(fresh.attachmentLimit) }));
      let current = selected;
      for (const file of files) {
        current = await draftApi('upload', { id: current.id, revision: current.revision }, file);
        adopt(current, false);
      }
      await reload();
      setNotice(dt('附件已添加，尚未发送。请检查预览。', 'Attachments added. Review before sending.'));
    });
  }

  function confirmLocalAction() {
    return run(async () => {
      if (localAction === 'copy') {
        adopt(await draftApi('copy', { id: selected.id, revision: selected.revision, confirmed: true }));
      } else {
        await draftApi('delete', { id: selected.id, revision: selected.revision, confirmed: true });
        setSelected(null);
        setForm(null);
        setEditorOpen(false);
        setLocalAction(null);
      }
      await reload();
    });
  }

  function field(key, label, invalid) {
    const fieldId = id + '-' + key;
    return h('div', { className: draftCss.field },
      h('label', { htmlFor: fieldId }, label),
      h(W.Input, { id: fieldId, type: 'text', value: form[key], maxLength: key === 'subject' ? 500 : 4096,
        disabled: busy || locked || !!selected.reply && key === 'subject',
        'data-modal-autofocus': key === 'to' && !locked || undefined, 'aria-invalid': invalid || undefined,
        onChange: event => change(key, event.target.value) }));
  }

  /**
   * To/Cc keep the plain address string the backend already parses, but gain a
   * contact suggestion list: picking one completes the address and carries its
   * name into the header, so recipients see a person instead of a mailbox.
   */
  function recipientField(key, label, invalid) {
    const fieldId = id + '-' + key;
    return h('div', { className: draftCss.field },
      h('label', { htmlFor: fieldId }, label),
      h(RecipientField, {
        id: fieldId, label, value: form[key], invalid,
        disabled: busy || locked,
        modalAutofocus: key === 'to' && !locked,
        onChange: value => change(key, value),
      }));
  }

  const closeLabel = dt('关闭', 'Close');
  const reviewTitle = dt('发送前预览', 'Review before sending');
  const composeTitle = dt('写邮件', 'Compose');
  const files = selected?.attachments.filter(file => form?.attachments.includes(file.id)) || [];

  const editor = editorOpen && selected && form ? h(W.Dialog, {
    key: preview ? 'send-review' : 'draft-editor',
    title: preview ? reviewTitle : locked ? dt('草稿', 'Drafts') : composeTitle,
    className: draftCss.composer, closeLabel, busy,
    onClose: preview ? cancelReview : () => requestSwitch({ kind: 'close' }),
    footer: preview ? h(React.Fragment, null,
      h(W.Button, { disabled: busy, onClick: cancelReview }, dt('取消预览', 'Cancel review')),
      h(W.Button, { variant: 'primary', icon: preview.draft.sendAt ? 'clock' : 'send', disabled: busy || !acknowledged || dirty || preview.matching.blocked, onClick: confirmSend },
        busy ? dt('正在提交…', 'Submitting…') : preview.draft.sendAt ? dt('确认定时发送', 'Confirm scheduled send') : dt('确认发送', 'Confirm send')))
      : !locked ? h(React.Fragment, null,
        h(W.Button, { disabled: busy || !dirty, onClick: () => run(save) }, dt('保存草稿', 'Save draft')),
        h(W.Button, { variant: 'primary', disabled: busy || dirty || !!denied.length, onClick: () => run(async () => {
          setPreview(await draftApi('preview', { id: selected.id, revision: selected.revision }));
          setAcknowledged(false);
          setNotice('');
        }) }, dt('检查发送预览', 'Review before sending'))) : null,
  },
  preview ? h(React.Fragment, null, h(W.Status, { tone: 'error' }, error),
    h(DraftSendReview, { preview, busy, acknowledged, onAcknowledge: setAcknowledged })) :
    h('div', { className: draftCss.form },
      h(W.Status, { tone: 'error' }, error ? h(React.Fragment, null, error,
        h('div', { className: uiCss.actions }, h(W.Button, { disabled: busy, onClick: () => {
          const target = { kind: 'open', id: selected.id };
          if (dirty) setPending(target);
          else void run(() => switchTo(target));
        } }, dt('重新打开服务器版本', 'Reopen saved version')))) : null),
      h(W.Status, { tone: 'success' }, notice),
      h('p', { className: draftCss.hint, role: 'status' }, dirty ? dt('有未保存的编辑', 'Unsaved edits') : draftState(selected.state)),
      selected.reply ? h(W.Status, null, dt('此草稿回复原邮件，保留会话关联与原文引用。请在引用上方填写回复，预览后再确认发送。', 'This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.')) : null,
      selected.error ? h(W.Status, { tone: 'warn' }, selected.error) : null,
      h('div', { className: draftCss.fields },
        h('div', { className: draftCss.field },
          h('label', { htmlFor: id + '-account' }, dt('发件账号', 'Sending account')),
          h(W.ChoiceMenu, { id: id + '-account', value: form.account, disabled: busy || locked || !!selected.reply,
            label: dt('发件账号', 'Sending account') + (sender ? ' · ' + sender : ''),
            items: [...(form.account ? [] : [{ id: '', label: sender || dt('请选择已配置账号', 'Choose a configured account'), disabled: true }]),
              ...data.accounts.map(name => ({ id: name, label: name }))],
            onChange: value => change('account', value) })),
        recipientField('to', dt('收件人 To', 'Recipients To'), denied.some(row => row.field === 'to')),
        recipientField('cc', dt('抄送 Cc', 'Copy Cc'), denied.some(row => row.field === 'cc')),
        field('subject', dt('主题', 'Subject'))),
      denied.length ? h(W.Status, { tone: 'error' },
        dt('有收件人命中禁止规则，无法发送。请修改草稿或收件人规则。', 'A recipient is blocked. Change the draft or recipient rules before sending.'),
        h('ul', { className: draftCss.recipients }, denied.map(row => h('li', { key: row.field + row.address },
          (row.field === 'to' ? 'To: ' : 'Cc: ') + contactLabelOf(row.address) + ' · ' + row.value)))) : live?.error ? h(W.Status, { tone: 'warn' }, live.error) : null,
      h(DraftBodyEditor, { id, mode, setMode: changeMode, form, locked, busy, onChange: change }),
      !locked || selected.sendAt ? h(ScheduleDraftField, { key: selected.id, value: form.sendAt, disabled: locked || busy, onChange: value => change('sendAt', value) }) : null,
      selected.state === 'scheduled' ? h(W.Button, { disabled: busy, onClick: () => run(async () => {
        adopt(await draftApi('cancelSchedule', { id: selected.id, revision: selected.revision }));
        await reload();
      }) }, dt('取消定时并返回草稿','Cancel schedule and return to draft')) : null,
      files.length ? h('ul', { className: draftCss.fileList }, files.map(file => h('li', { key: file.id, className: draftCss.fileRow },
        h(W.Icon, { name: 'clip' }), h('span', null, file.filename),
        !locked ? h(W.Button, { variant: 'ghost', disabled: busy, 'aria-label': dt('移除附件 ', 'Remove attachment ') + file.filename,
          onClick: () => change('attachments', form.attachments.filter(id => id !== file.id)) }, dt('移除', 'Remove')) : null))) : null,
      !locked ? h('label', { className: draftCss.upload },
        h('span', { className: draftCss.hint }, dt('添加附件（先保存编辑，最多 10 个 / 合计 ', 'Add attachments (save edits first; up to 10 files / ') + capLabel + dt('）', ' total)')),
        h('input', { type: 'file', multiple: true, disabled: busy || dirty, 'aria-label': dt('添加附件', 'Add attachments'), onChange: upload })) : null,
      selected.receipt ? h(W.Status, { tone: selected.receipt.rejected.length ? 'warn' : 'success' },
        (selected.receipt.rejected.length ? dt('部分地址被服务器拒绝，邮件不会自动重发。服务器接受：', 'Some addresses were rejected. This email will not retry automatically. Server accepted: ')
          : dt('服务器已返回回执，邮件不会再次发送。服务器接受：', 'Server receipt saved. This draft will not send again. Server accepted: ')) +
          (selected.receipt.accepted.join(', ') || dt('无', 'none')),
        h('div', null, dt('服务器拒绝：', 'Server rejected: ') + (selected.receipt.rejected.join(', ') || dt('无', 'none'))),
        h('div', null, dt('这是服务器提交结果，不代表已送达收件人的收件箱。', 'This confirms the server response, not delivery to the recipient inbox.'))) : null,
      selected.state === 'uncertain' || selected.state === 'sending' ? h(W.Status, { tone: 'warn' },
        selected.error || dt('提交尚未留下回执。先核对邮箱，再刷新列表；不要重复发送。', 'No receipt yet. Check your mailbox, then refresh the list. Do not send again.')) : null,
      h('div', { className: uiCss.actions },
        h(W.Button, { variant: 'ghost', disabled: busy || selected.state === 'sending' || dirty, onClick: () => setLocalAction('copy') }, dt('复制为新草稿', 'Copy to a new draft')),
        h(W.Button, { variant: 'danger', disabled: busy || selected.state === 'sending', onClick: () => setLocalAction('delete') }, dt('删除本地草稿', 'Delete local draft'))))) : null;

  const closing = pending?.kind === 'close';
  const pendingDialog = pending ? h(W.Dialog, {
    title: dt('有未保存的编辑', 'Unsaved edits'), closeLabel, busy, onClose: () => setPending(null),
    footer: h(React.Fragment, null,
      h(W.Button, { disabled: busy, onClick: () => setPending(null) }, dt('保留编辑', 'Keep editing')),
      h(W.Button, { variant: 'danger', disabled: busy, onClick: () => run(() => switchTo(pending)) },
        closing ? dt('放弃编辑并关闭', 'Discard edits and close') : dt('放弃编辑并切换', 'Discard edits and switch')),
      h(W.Button, { variant: 'primary', disabled: busy || locked, onClick: () => run(async () => { await save(); await switchTo(pending); }) },
        closing ? dt('保存并关闭', 'Save and close') : dt('保存并切换', 'Save and switch'))),
  }, h(W.Status, { tone: 'error' }, error), dt('当前草稿有未保存的编辑。', 'The current draft has unsaved edits.')) : null;

  const copy = localAction === 'copy';
  const localDialog = localAction ? h(W.Dialog, {
    title: copy ? dt('复制为新草稿', 'Copy to a new draft') : dt('删除本地草稿', 'Delete local draft'),
    closeLabel, busy, onClose: () => setLocalAction(null),
    footer: h(React.Fragment, null,
      h(W.Button, { disabled: busy, onClick: () => setLocalAction(null) }, dt('取消', 'Cancel')),
      h(W.Button, { variant: copy ? 'primary' : 'danger', disabled: busy, onClick: confirmLocalAction },
        copy ? dt('确认复制', 'Confirm copy') : dt('确认删除', 'Confirm delete'))),
  }, h(W.Status, { tone: 'error' }, error),
  copy ? dt('会复制内容及附件为一份新的未发送草稿。若上次已提交或结果不明，请先核对邮箱，避免重复投递。', 'Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.')
    : dt('只删除本地草稿与插件上传的附件副本；引用的原文件和邮箱中的邮件不会删除。', 'Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.')) : null;

  return h(React.Fragment, null,
    active ? h('section', { className: draftCss.drafts, 'aria-label': dt('邮件草稿', 'Email drafts') },
      h('header', { className: draftCss.toolbar },
        h('h2', { 'data-dsh-serif': '' }, dt('本地草稿', 'Local drafts') + ' · ' + data.drafts.length),
        h(W.Button, { icon: 'refresh', 'aria-busy': busy || undefined, disabled: busy, onClick: () => run(reload) }, dt('刷新列表', 'Refresh list'))),
      h('p', { className: draftCss.hint }, dt('草稿只保存在本机。模型可用 email_draft 准备内容，你在这里编辑、保存和确认发送。', 'Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.')),
      !editorOpen ? h(W.Status, { tone: 'error' }, error) : null,
      data.drafts.length ? h('div', { className: draftCss.draftList, 'data-dsh-card': '' }, data.drafts.map(draft =>
        h(W.Button, { key: draft.id, variant: 'ghost', className: draftCss.draftRow, 'data-dsh-row': '', 'data-active': selected?.id === draft.id ? 'true' : 'false', disabled: busy, onClick: () => requestSwitch({ kind: 'open', id: draft.id }) },
          h('span', null, h('strong', null, draft.subject || dt('未命名草稿', 'Untitled draft')), h('small', { className: draftCss.hint }, draft.account || dt('尚未选择账号', 'No account selected'))),
          h('small', { className: clsx(draftCss.hint, draftCss.draftState) }, selected?.id === draft.id && dirty ? dt('未保存', 'Unsaved') : draftState(draft.state)))))
        : h(W.Empty, { title: dt('还没有草稿', 'No drafts yet'), icon: 'mail' }, dt('点击上方“写邮件”开始。', 'Choose Compose above to begin.'))) :
      !editorOpen && error && !pending ? h(W.Dialog, { title: composeTitle, closeLabel, onClose: () => setError('') }, h(W.Status, { tone: 'error' }, error)) : null,
    editor, pendingDialog, localDialog);
}
