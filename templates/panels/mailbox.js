function MailFoldersDialog({ account, folders, busy, onClose, onChanged }) {
  const [newName, setNewName] = React.useState('');
  const [renameOf, setRenameOf] = React.useState(null), [renameValue, setRenameValue] = React.useState('');
  const [error, setError] = React.useState(''), [working, setWorking] = React.useState(false);
  const system = path => /^(INBOX|Sent Messages|Deleted Messages|Drafts|Junk)$/i.test(path);
  async function act(name, payload, confirmText, done) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(''); setWorking(true);
    try {
      await mailboxApi(name, { account, ...payload });
      setWorking(false); setNewName(''); setRenameOf(null); setRenameValue('');
      if (done) done();
      if (onChanged) onChanged();
    } catch (e) { setWorking(false); setError(emailError(e)); }
  }
  return h(W.Dialog, { title: dt('管理文件夹', 'Manage folders'), closeLabel: dt('关闭', 'Close'), busy: working || busy, onClose },
    h('p', { className: 'dshe-hint' }, dt('新建、重命名、清空或删除邮箱文件夹（仅 IMAP 账号支持）。删除/清空不可恢复。', 'Create, rename, empty or delete mailbox folders (IMAP accounts only). Delete and empty cannot be undone.')),
    h(W.Status, { tone: 'error' }, error),
    h('label', { className: 'dshe-field' }, dt('新建文件夹', 'New folder'), h('div', { style: { display: 'flex', gap: 8 } }, h('input', { value: newName, placeholder: dt('例如：招标文件', 'e.g. Tenders'), onChange: e => setNewName(e.target.value) }), h(W.Button, { disabled: !newName.trim() || working || busy, variant: 'primary', onClick: () => act('folderCreate', { path: newName.trim() }) }, dt('创建', 'Create')))),
    h('ul', { style: { listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: 6 } }, folders.map(f => h('li', { key: f.path, style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', border: '1px solid var(--w-border)', borderRadius: 8, padding: '6px 10px', fontSize: 13 } },
      renameOf === f.path ? h(React.Fragment, null,
        h('input', { value: renameValue, onChange: e => setRenameValue(e.target.value), style: { flex: 1, minWidth: 120 } }),
        h(W.Button, { disabled: !renameValue.trim() || working || busy, variant: 'primary', onClick: () => act('folderRename', { path: f.path, newName: renameValue.trim() }, null, () => setRenameOf(null)) }, dt('保存', 'Save')),
        h(W.Button, { disabled: working || busy, onClick: () => { setRenameOf(null); setRenameValue(''); } }, dt('取消', 'Cancel')))
      : h(React.Fragment, null,
        h('span', { style: { flex: 1, minWidth: 120, overflowWrap: 'anywhere' }, title: f.path }, f.path),
        working || busy || system(f.path) ? h('span', { className: 'dshe-hint' }, dt('（系统文件夹）', '(System folder)'))
        : h('span', { style: { display: 'flex', gap: 6 } }, h(W.Button, { variant: 'ghost', onClick: () => { setRenameOf(f.path); setRenameValue(f.path); } }, dt('重命名', 'Rename')), h(W.Button, { variant: 'ghost', onClick: () => act('folderPurge', { path: f.path }, dt('清空将永久删除该文件夹内的全部邮件，确定继续？', 'Empty permanently deletes every message in this folder. Continue?')) }, dt('清空', 'Empty')), h(W.Button, { variant: 'ghost', onClick: () => act('folderDelete', { path: f.path }, dt('删除将移除文件夹及其全部邮件，且不可恢复，确定继续？', 'Delete removes the folder and all its messages forever. Continue?')) }, dt('删除', 'Delete'))))))));
}

function MailTrashDialog({ account, folder, uids, uidValidity, folders, busy, onClose, onConfirm }) {
  const [target, setTarget] = React.useState(''), [preview, setPreview] = React.useState(null), [error, setError] = React.useState(''), [checking, setChecking] = React.useState(true);
  React.useEffect(() => {
    const ctrl = new AbortController(); setPreview(null); setError(''); setChecking(true);
    mailboxApi('trashPreview', { account, folder, uids, uidValidity, ...(target ? { target } : {}) }, ctrl.signal).then(value => { if (!ctrl.signal.aborted) setPreview(value); }).catch(error => { if (!ctrl.signal.aborted) setError(emailError(error)); }).finally(() => { if (!ctrl.signal.aborted) setChecking(false); });
    return () => ctrl.abort();
  }, [account, folder, uids, uidValidity, target]);
  return h(W.Dialog, { title: dt('移入废纸篓', 'Move to Trash'), closeLabel: dt('取消', 'Cancel'), onClose, busy },
    h('p', null, account + ' · ' + folder),
    h('p', null, dt('将选中的邮件移动到以下已有文件夹。不会永久删除。', 'Move the selected messages to the existing folder below. This does not permanently delete them.')),
    h('label', { className: 'dshe-field' }, dt('目标文件夹', 'Destination folder'), h('select', { value: target, disabled: busy || checking, onChange: event => setTarget(event.target.value) }, h('option', { value: '' }, dt('自动识别废纸篓', 'Detect Trash automatically')), folders.filter(row => row.path !== folder).map(row => h('option', { key: row.path, value: row.path }, row.path)))),
    checking ? h('p', { role: 'status' }, dt('正在核对邮件与文件夹…', 'Checking messages and folders…')) : null,
    h(W.Status, { tone: 'error' }, error),
    preview ? h('div', { className: 'email-trash-preview' }, h('p', null, dt('移动到：', 'Move to: ') + preview.target), h('ul', null, preview.messages.map(row => h('li', { key: row.uid }, row.subject || dt('（无主题）', '(No subject)')))), h('p', { className: 'dshe-hint' }, dt('确认有效期为 90 秒；邮件状态改变后需重新确认。服务器提供新编号时，移动后可在 5 分钟内撤销。', 'Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.'))) : null,
    h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: onClose, disabled: busy }, dt('取消', 'Cancel')), h(W.Button, { variant: 'primary', disabled: busy || checking || !preview, onClick: () => onConfirm(preview) }, busy ? dt('正在移动…', 'Moving…') : dt('确认移入 ', 'Confirm move: ') + uids.length + dt(' 封', ' messages'))));
}

function MailContent({ detail, account, folder, selected }) {
  const rich = detail.rich, [plain, setPlain] = React.useState(!rich?.nodes?.length), [remote, setRemote] = React.useState(false), [images, setImages] = React.useState({}), [retry, setRetry] = React.useState(0), [loading, setLoading] = React.useState(false);
  __stardustUpdatesGuard(React, 'dsh-email.images', { busy: loading });
  React.useEffect(() => {
    if (plain || !rich?.images?.length) { setLoading(false); return; }
    const ctrl = new AbortController(), urls = [], queue = rich.images.filter(image => image.kind === 'inline' || remote);
    setImages({}); setLoading(queue.length > 0);
    async function worker() {
      while (queue.length && !ctrl.signal.aborted) {
        const image = queue.shift();
        try {
          const blob = await mailboxApi('image', { account, folder, uid: selected, image: image.id, allowRemote: remote }, ctrl.signal);
          if (ctrl.signal.aborted) return;
          const url = URL.createObjectURL(blob); urls.push(url); setImages(old => ({ ...old, [image.id]: { url } }));
        } catch (error) { if (!ctrl.signal.aborted) setImages(old => ({ ...old, [image.id]: { error: true, message: emailError(error) } })); }
      }
    }
    Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker)).finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => { ctrl.abort(); for (const url of urls) URL.revokeObjectURL(url); };
  }, [rich, account, folder, selected, plain, remote, retry]);
  function nodes(values, path = 'r') {
    return (values || []).map((node, index) => {
      if (typeof node === 'string') return node;
      const key = path + '.' + index;
      if (node.tag === 'img') {
        const image = rich.images[node.image]; if (!image) return null;
        const loaded = images[image.id];
        return loaded?.url && !loaded.error ? h('img', { key, src: loaded.url, alt: image.alt || dt('邮件图片', 'Email image'), className: 'email-rich-image', onError: () => setImages(old => ({ ...old, [image.id]: { ...old[image.id], error: true } })) }) : h('span', { key, className: 'email-image-placeholder', role: 'status' }, image.alt || dt('邮件图片', 'Email image'), ' · ', loaded?.error ? dt('加载失败，可重试', 'Failed to load; retry available') : image.kind === 'remote' && !remote ? dt('外部图片已阻止', 'External image blocked') : dt('正在加载…', 'Loading…'), loaded?.message ? h('span', { className: 'email-image-error' }, loaded.message) : null);
      }
      const props = { key };
      if (node.tag === 'a' && node.href) Object.assign(props, { href: node.href, target: '_blank', rel: 'noopener noreferrer', referrerPolicy: 'no-referrer' });
      if (node.span) props.colSpan = node.span;
      return h(node.tag, props, ['br', 'hr'].includes(node.tag) ? undefined : nodes(node.children, key));
    });
  }
  const external = rich?.images?.filter(image => image.kind === 'remote').length || 0;
  return h('section', { className: 'w-section email-body' },
    rich?.nodes?.length ? h('div', { className: 'email-content-toolbar' }, h(W.Button, { variant: 'ghost', onClick: () => setPlain(!plain) }, plain ? dt('查看图文', 'View formatted message') : dt('查看纯文本', 'View plain text')),
      !plain && external > 0 ? h(W.Button, { disabled: remote, onClick: () => setRemote(true) }, remote ? dt('已允许本封外部图片', 'External images allowed for this message') : dt('加载外部图片（', 'Load external images (') + external + dt('）', ')')) : null,
      !plain && Object.values(images).some(image => image.error) ? h(W.Button, { onClick: () => setRetry(n => n + 1) }, dt('重试图片', 'Retry images')) : null) : null,
    !plain && external > 0 && !remote ? h('p', { className: 'dshe-hint' }, dt('外部图片默认不加载，加载后可能向发件人透露阅读时间与网络地址。仅对当前邮件生效。', 'External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.')) : null,
    plain ? h('pre', null, detail.text || dt('（空正文）', '(Empty body)')) : h('div', { className: 'email-rich-body' }, nodes(rich.nodes)),
    detail.truncated || rich?.limited ? h(W.Status, null, dt('正文或图文结构超过显示上限，部分内容已省略。可切换纯文本或用邮箱客户端查看。', 'Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.')) : null);
}

function MailMessage({ detail, currentRow, account, folder, selected, busy, run, who, date, onDraft, onMark, onTrash, canTrash }) {
  const [taskNote, setTaskNote] = React.useState('');
  const [taskRequest, setTaskRequest] = React.useState(null);
  const [taskValue, setTaskValue] = React.useState('');
  const [taskWorkspaces, setTaskWorkspaces] = React.useState(null); // null = 未加载
  const [taskWorkspace, setTaskWorkspace] = React.useState('');
  async function reply(all) {
    return run(async valid => {
      const draft = await mailboxApi('replyDraft', { account, folder, uid: selected, replyAll: all });
      if (valid()) onDraft(draft.id);
    });
  }
  async function mark(value) {
    return run(async valid => {
      await mailboxApi('mark', { account, folder, uid: selected, mark: value });
      if (valid()) onMark(value);
    });
  }
  async function taskSession() {
    setTaskValue(''); setTaskRequest({ account, folder, uid: selected, subject: detail.subject }); setTaskWorkspaces(null); setTaskWorkspace('');
    try {
      const rows = await mailboxApi('workspaces', { account });
      if (rows && Array.isArray(rows.workspaces)) {
        setTaskWorkspaces(rows.workspaces);
        const def = String(rows.defaultWorkspace || '');
        setTaskWorkspace(def || (rows.workspaces[0]?.path || ''));
      }
    } catch (e) { setTaskWorkspaces([]); /* workspaces 列表是增强，失败不阻塞会话创建 */ }
  }
  async function submitTaskSession() {
    const requirement = taskValue.trim();
    if (!requirement) return;
    const req = taskRequest; setTaskRequest(null); setTaskValue('');
    return run(async valid => {
      const result = await mailboxApi('taskSession', { account: req.account, folder: req.folder, uid: req.uid, requirement, workspace: taskWorkspace });
      if (valid() && result) setTaskNote(result.created
        ? dt('已创建任务会话 ', 'Task session created ') + (result.title || result.sessionId)
        : dt('此邮件已有任务会话 ', 'This message already has a task session ') + (result.title || result.sessionId));
    });
  }
  return h('article', { className: 'email-message', 'aria-label': dt('邮件详情', 'Message details') },
    currentRow?.flagsSupported !== false && h('div', { className: 'email-reader-tools' },
      h(W.Button, { variant: 'ghost', icon: 'mail', disabled: busy, onClick: () => mark(currentRow?.seen ? 'unread' : 'read') }, currentRow?.seen ? dt('标记未读', 'Mark unread') : dt('标记已读', 'Mark read')),
      h(W.Button, { variant: 'ghost', icon: 'star', disabled: busy, 'aria-pressed': !!currentRow?.flagged, onClick: () => mark(currentRow?.flagged ? 'unstar' : 'star') }, currentRow?.flagged ? dt('取消星标', 'Unstar') : dt('添加星标', 'Star')),
      canTrash ? h(W.Button, { variant: 'ghost', disabled: busy, onClick: () => onTrash([selected]) }, dt('移入废纸篓', 'Move to Trash')) : null,
      h(W.Button, { variant: 'ghost', icon: 'link', disabled: busy, onClick: () => taskSession() }, dt('在会话中处理', 'Handle in a session'))),
    taskNote ? h('p', { className: 'dshe-alert success email-task-note' }, taskNote) : null,
    taskRequest ? h(W.Dialog, { title: dt('在会话中处理', 'Handle in a session'), closeLabel: dt('取消', 'Cancel'), busy, onClose: () => setTaskRequest(null) },
      h('p', { className: 'dshe-hint' }, dt('请输入对邮件「' + (taskRequest.subject || dt('（无主题）', '(No subject)')) + '」的处理需求。新任务会话将以你输入的需求作为第一条指令（工作区可选，默认 mail）。', 'Enter the handling requirement for "' + (taskRequest.subject || '(No subject)') + '". A new task session starts with your requirement as the first instruction (workspace is optional, defaults to mail).')),
      h('label', { className: 'dshe-field' }, dt('处理需求', 'Requirement'), h('textarea', { value: taskValue, rows: 4, placeholder: dt('例如：识别告警设备并查库存，输出处理建议', 'e.g. Identify the alerting device and check inventory, then suggest actions'), onChange: event => setTaskValue(event.target.value) })),
      taskWorkspaces !== null ? h('label', { className: 'dshe-field' }, dt('工作区（可选）', 'Workspace (optional)'), h('select', { value: taskWorkspace, disabled: busy, onChange: event => setTaskWorkspace(event.target.value) },
        h('option', { value: '' }, dt('跟随默认', 'Use default')), taskWorkspaces.map(row => h('option', { key: row.id || row.path, value: row.path }, row.title && row.title !== row.path ? row.title + ' · ' + row.path : row.path)))) : null,
      h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setTaskRequest(null), disabled: busy }, dt('取消', 'Cancel')), h(W.Button, { variant: 'primary', disabled: busy || !taskValue.trim(), onClick: submitTaskSession }, busy ? dt('正在创建…', 'Creating…') : dt('创建并进入会话', 'Create & open session')))) : null,
    h('h2', { className: 'w-detail-title' }, detail.subject || dt('（无主题）', '(No subject)')),
    h('div', { className: 'email-envelope' }, h('p', null, dt('发件人：', 'From: ') + who(detail.from)), h('p', null, dt('收件人：', 'To: ') + who(detail.to)), detail.cc?.length ? h('p', null, 'Cc: ' + who(detail.cc)) : null, h('p', { className: 'w-muted' }, date(detail.date))),
    h(MailContent, { detail, account, folder, selected }),
    detail.attachments?.length ? h('section', { className: 'w-section' }, h('h3', null, dt('附件', 'Attachments')), h('ul', { className: 'email-attachments' }, detail.attachments.map((file, index) => h('li', { key: index },
      h(W.Icon, { name: 'file', size: 22 }), h('div', null, h('strong', null, file.filename), h('p', { className: 'w-muted' }, Math.ceil(file.size / 1024) + ' KiB')),
      h(W.Button, { disabled: busy, icon: 'download', onClick: () => run(async valid => {
        const blob = await mailboxApi('download', { account, folder, uid: selected, index });
        if (!valid()) return;
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = file.filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      }) }, dt('下载附件', 'Download attachment')))))) : null,
    h('footer', { className: 'w-detail-footer' }, h(W.Button, { icon: 'reply', variant: 'primary', disabled: busy, onClick: () => reply(false) }, dt('回复到草稿', 'Reply in drafts')), h(W.Button, { disabled: busy, onClick: () => reply(true) }, dt('回复全部到草稿', 'Reply all in drafts')), h('p', { className: 'w-muted' }, dt('点击后进入草稿编辑，发送前需预览并确认。', 'Edit the reply in Drafts. Review and confirm before sending.'))));
}

const EMAIL_WORKBENCH_CSS = `
.email-workbench .email-image-error{display:block;margin-top:6px;font-size:12px;line-height:1.6;overflow-wrap:anywhere}
.email-workbench .email-content-toolbar,.email-workbench .email-batch-tools,.email-workbench .email-move-notice{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 0}.email-workbench .email-batch-tools{padding:10px 14px;border-bottom:1px solid var(--w-border);font-size:12px}.email-workbench .email-batch-tools label{display:flex;gap:6px;align-items:center}.email-workbench .email-batch-tools input,.email-workbench .w-row-select input{width:16px;height:16px}.email-workbench .email-move-notice{background:var(--w-soft);border:1px solid var(--w-border);border-radius:8px;padding:12px;overflow-wrap:anywhere}.email-workbench .email-rich-body{font:14px/1.8 var(--dsh-font-family-content,system-ui,sans-serif);overflow-wrap:anywhere;overflow-x:auto;max-width:100%;padding:8px 0}.email-workbench .email-rich-body p{margin:0 0 14px}.email-workbench .email-rich-body blockquote{margin:16px 0;padding:4px 16px;border-inline-start:3px solid var(--w-border);color:var(--w-muted)}.email-workbench .email-rich-body table{border-collapse:collapse;max-width:100%;margin-block:12px}.email-workbench .email-rich-body td,.email-workbench .email-rich-body th{border:1px solid var(--w-border);padding:8px}.email-workbench .email-rich-body a{color:var(--w-accent);text-decoration:underline}.email-workbench .email-rich-image{display:block;max-width:100%;height:auto;max-height:600px;object-fit:contain;margin:12px 0}.email-workbench .email-image-placeholder{display:block;border:1px dashed var(--w-border);border-radius:8px;background:var(--w-soft);padding:18px;margin:12px 0;color:var(--w-muted);font-size:13px}.email-trash-preview{max-height:260px;overflow:auto;margin-block:16px}.email-trash-preview li{overflow-wrap:anywhere}

.email-workbench>.w-body{display:block}
.email-workbench .dshe-acc-body .dshe-field{align-content:start}
@container dsh-workbench (max-width:760px){.email-workbench .dshe-acc-body .dshe-grid{grid-template-columns:minmax(0,1fr)}}
.email-workbench.dshe-settings{display:flex;gap:0;padding:0;color:var(--w-text)}.email-workbench.dshe-settings[data-main=true]{padding:calc(24px + var(--dsh-frame-top-clearance,0px)) 28px 0 max(28px,var(--dsh-frame-leading-clearance,0px))}.email-workbench .dshe-section-hidden:not([hidden]){display:flex;flex-direction:column;min-height:0;flex:1}.email-workbench .dshe-section-hidden[hidden]{display:none!important}.email-workbench .email-mailbox{display:flex;flex-direction:column;flex:1;min-height:0}.email-workbench .email-mailbox-columns{display:grid;grid-template-columns:180px minmax(0,1fr);flex:1;min-height:480px}.email-workbench .email-folder-rail{border-inline-end:1px solid var(--w-border);padding:24px 14px 24px 0;min-width:0}.email-workbench .email-folder-rail>label{display:grid;gap:6px;font-size:12px;margin-bottom:18px}.email-workbench .email-folder-rail select{width:100%}.email-workbench .email-folder-rail nav{display:flex;flex-direction:column;gap:4px}.email-workbench .email-folder-button{width:100%;justify-content:flex-start;border:0;background:transparent;text-align:start}.email-workbench .email-folder-button[aria-pressed=true]{background:var(--w-selected);color:var(--w-accent)}.email-workbench .email-mailbox .w-split{min-height:480px}.email-workbench .email-search{padding:18px 14px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}.email-workbench .email-search .w-search{flex-basis:100%;width:100%}.email-workbench .email-search .email-unread-filter{display:flex;align-items:center;gap:6px;font-size:12px;margin-inline-start:auto;white-space:nowrap}.email-workbench .email-unread-filter input{margin:0}.email-workbench .email-list-note{padding:12px 16px;font-size:12px;color:var(--w-muted)}.email-workbench .email-search-coverage{padding:0 16px 12px;font-size:12px;color:var(--w-muted)}.email-workbench .email-search-coverage summary{font-size:12px}.email-workbench .email-search-coverage p{margin-top:8px}.email-workbench .email-unread-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--w-accent);margin-inline-end:6px;vertical-align:middle}.email-workbench .email-message .w-detail-title{font-size:24px;line-height:1.4;margin:18px 0!important}.email-workbench .email-reader-tools{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-bottom:20px}.email-workbench .email-task-note{margin-bottom:14px}.email-workbench .email-envelope{font-size:13px;color:var(--w-muted);display:grid;gap:5px}.email-workbench .email-body{padding:24px 0;margin-top:20px}.email-workbench .email-body pre{font:14px/1.8 var(--dsh-font-family-content,system-ui,sans-serif);background:transparent;padding:0;border:0;border-radius:0;margin:0;white-space:pre-wrap;overflow-wrap:anywhere;max-height:none}.email-workbench .email-message{display:flex;flex-direction:column;min-height:100%;min-width:0}.email-workbench .email-attachments{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:10px}.email-workbench .email-attachments li{display:flex;align-items:center;gap:12px;border:1px solid var(--w-border);border-radius:8px;padding:14px;min-width:0}.email-workbench .email-attachments li>div{min-width:0;overflow-wrap:anywhere;flex:1;font-size:13px}.email-workbench .email-attachments li>svg{flex-shrink:0;color:var(--w-muted)}.email-workbench .email-attachments p{margin-top:4px}.email-workbench .email-attachments .w-button{font-size:12px;flex-shrink:0}.email-workbench .dshe-mail-footer{padding:14px 16px;border-top:1px solid var(--w-border);display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px}.email-workbench .dshe-mail-footer button{font-size:12px;min-height:32px}.email-workbench .email-drafts{display:flex;flex-direction:column;flex:1;min-height:0}.email-workbench .email-draft-toolbar{padding:16px 0;display:flex;align-items:center;gap:12px;justify-content:space-between}.email-workbench .dshe-panel{display:block;container-type:normal;border:0;border-radius:0;background:transparent;padding:24px 0;box-shadow:none;min-width:0}.email-workbench .dshe-btn{font-size:14px;min-height:36px;padding:8px 12px;background:var(--w-bg);color:var(--w-text);border:1px solid var(--w-border);border-radius:8px;box-shadow:none}.email-workbench .dshe-btn.primary{background:var(--w-primary);color:var(--w-on-primary);border-color:var(--w-primary)}.email-workbench .dshe-field{margin:0 0 16px;display:grid;gap:6px;min-width:0}.email-workbench .dshe-field>label{font-size:13px;color:var(--w-muted)}.email-workbench .dshe-field input,.email-workbench .dshe-field select,.email-workbench .dshe-field textarea{width:100%;font-size:14px}.email-workbench .dshe-hint{font-size:12px;line-height:1.7;color:var(--w-muted)}.email-workbench .dshe-draft-editor{display:grid;gap:16px;min-width:0}.email-workbench .dshe-draft-editor .dshe-field{margin:0}.email-workbench .dshe-alert{border:1px solid var(--w-border);border-radius:8px;padding:12px 14px;background:var(--w-soft);color:var(--w-text);font-size:13px;overflow-wrap:anywhere}.email-workbench .dshe-alert.error{color:var(--dsw-alias-state-error-primary,#ad3636)}.email-workbench .dshe-alert.success{color:var(--dsw-alias-state-success-primary,#24794a)}.email-workbench .dshe-review{background:var(--w-soft);border:1px solid var(--w-border);border-radius:8px;padding:18px}.email-workbench .dshe-rule-panel{max-width:800px}.email-workbench .dshe-rule-panel>.dshe-hint+.dshe-hint{margin-top:12px}.email-workbench .dshe-rule-panel .dshe-field{margin-top:20px}.email-workbench .dshe-global{padding:0 0 24px;border:0;border-bottom:1px solid var(--w-border);border-radius:0;box-shadow:none;background:transparent}.email-workbench .dshe-acc-card{border:0;border-bottom:1px solid var(--w-border);border-radius:0;box-shadow:none;background:transparent;padding:20px 0;margin:0}.email-workbench .dshe-acc-card[open]{background:transparent}.email-workbench .dshe-prst-section{padding:24px 0;border:0;border-bottom:1px solid var(--w-border);border-radius:0}.email-workbench .dshe-auto-status{font-size:12px;color:var(--w-muted)}.email-workbench .w-tab-panel{position:relative}.email-workbench .email-account-status{position:absolute;top:6px;inset-inline-end:8px;z-index:3;display:flex;align-items:center;gap:8px;margin:0;padding:2px 9px;border:1px solid var(--w-border);border-radius:999px;background:var(--w-bg);box-shadow:0 2px 10px #00000026;pointer-events:none;animation:dshe-status-in .18s ease-out}.email-workbench .email-account-status button{pointer-events:auto}@keyframes dshe-status-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}@keyframes dshe-status-out{to{opacity:0;visibility:hidden}}.email-workbench .email-account-status[data-kind=saved]{animation:dshe-status-in .18s ease-out,dshe-status-out .4s ease-in 2.6s forwards}.email-workbench .w-detail .dshe-local-actions{border-top:1px solid var(--w-border);padding-top:20px;margin-top:10px}.email-workbench .dshe-match-list{font-size:13px;line-height:1.8}
@container dsh-workbench (max-width:1050px){.email-workbench .email-mailbox-columns{grid-template-columns:minmax(0,1fr)}.email-workbench .email-folder-rail{border-inline-end:0;border-bottom:1px solid var(--w-border);padding:14px 0;display:flex;gap:14px;align-items:center;flex-wrap:wrap}.email-workbench .email-folder-rail>label{margin:0;max-width:260px;flex:1 1 200px}.email-workbench .email-folder-rail nav{flex-direction:row;flex-wrap:wrap;gap:4px}.email-workbench .email-folder-button{width:auto}.email-workbench .email-folder-rail .email-custom-folder{max-width:180px;flex:1 1 140px}}
@container dsh-workbench (max-width:760px){.email-workbench .email-search{padding-inline:0}.email-workbench .email-reader-tools{justify-content:flex-start;gap:4px}.email-workbench .email-attachments li{flex-wrap:wrap}.email-workbench .email-attachments li>div{min-width:150px}.email-workbench .email-draft-toolbar{flex-wrap:wrap}.email-workbench .dshe-review{padding:14px}.email-workbench .email-mailbox-columns{min-height:320px}.email-workbench .email-folder-rail .email-custom-folder{max-width:100%}}
@media(max-width:700px){.email-workbench.dshe-settings[data-main=true]{padding:calc(16px + var(--dsh-frame-top-clearance,0px)) 16px 0 max(16px,var(--dsh-frame-leading-clearance,0px))}}
`;

