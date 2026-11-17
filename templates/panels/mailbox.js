const { mailbox: mailCss, ui: uiCss, drafts: draftCss, settings: settingsCss, clsx } = emailUi;

function moveMailSpotlight(event) {
  if (event.pointerType === 'touch') return;
  const row = event.target?.closest?.('[data-dsh-row]');
  if (!row || !event.currentTarget.contains(row)) return;
  const rect = row.getBoundingClientRect();
  row.style.setProperty('--mail-spot-x', (event.clientX - rect.left) + 'px');
  row.style.setProperty('--mail-spot-y', (event.clientY - rect.top) + 'px');
}

// The backend rechecks folder protection against the server on every mutation.
const systemFolderName = /^(?:inbox|sent(?: messages| items)?|drafts|trash|junk(?: e-mail)?|deleted(?: messages| items)?|all mail|archives?|收件箱|已发送|草稿箱?|垃圾邮件|垃圾箱|废纸篓|已删除)$/i;
const folderLeaf = row => row.path.split(row.delimiter || '/').at(-1);
const isSystemFolder = row => !!row.specialUse || systemFolderName.test(folderLeaf(row));
const isProtectedFolder = (row, folders) => folders.some(system => isSystemFolder(system) &&
  (system.path === row.path || !!system.delimiter && system.path.startsWith(row.path + system.delimiter)));

function folderLabel(row) {
  const leaf = folderLeaf(row);
  if (row.specialUse === '\Inbox' || /^(inbox|收件箱)$/i.test(leaf)) return dt('收件箱', 'Inbox');
  if (row.specialUse === '\Sent' || /^(sent(?: messages| items)?|已发送)$/i.test(leaf)) return dt('已发送', 'Sent');
  if (row.specialUse === '\Trash' || /^(trash|deleted(?: messages| items)?|垃圾箱|废纸篓|已删除)$/i.test(leaf)) return dt('废纸篓', 'Trash');
  if (row.specialUse === '\\Drafts' || /^drafts$/i.test(leaf)) return dt('草稿', 'Drafts');
  return row.name || row.path;
}

function MailFolderRail({ accounts, account, folder, folders, busy, loading, onAccount, onFolder, onManage }) {
  const current = accounts.find(row => row.name === account);
  const system = folders.filter(isSystemFolder);
  const custom = folders.filter(row => !isSystemFolder(row));
  const protocol = row => row.incoming === 'agentmail' ? 'AgentMail' : row.incoming === 'pop3' ? 'POP3' : 'IMAP';
  const renderFolder = row => h(W.Button, {
    key: row.path, className: mailCss.folder, variant: 'ghost',
    icon: row.specialUse === '\Trash' ? 'trash' : row.specialUse === '\Sent' ? 'send' : row.specialUse === '\Inbox' || row.path === 'INBOX' ? 'inbox' : 'folder',
    disabled: busy, title: row.path, 'aria-current': folder === row.path ? 'location' : undefined,
    onClick: () => onFolder(row.path),
  }, h('span', null, folderLabel(row)));

  return h('aside', { className: mailCss.rail, 'aria-label': dt('账号与文件夹','Accounts and folders') },
    h(W.ChoiceMenu, {
      label: dt('邮箱账号','Account') + (current ? ' · ' + current.name : ''),
      value: account, disabled: busy, onChange: onAccount,
      items: accounts.map(row => ({ id: row.name, label: row.name + ' · ' + row.user })),
    }, current ? h('span', { className: mailCss.account }, current.user || current.name,
      h('span', { className: mailCss.accountMeta }, protocol(current) + ' · ' + current.name)) : null),
    h('nav', { className: mailCss.railGroup, 'aria-label': dt('系统文件夹', 'System folders') },
      h('div', { className: mailCss.railHeading }, h('h2', null, dt('系统文件夹', 'System folders')), h(W.Icon, { name: 'lock', size: 13 })),
      system.map(renderFolder)),
    custom.length > 0 || current?.incoming === 'imap' ?
      h('nav', { className: mailCss.railGroup, 'aria-label': dt('自建文件夹', 'Custom folders') },
        h('div', { className: mailCss.railHeading }, h('h2', null, dt('自建文件夹', 'Custom folders')),
          current?.incoming === 'imap' ? h(W.IconButton, { icon: 'plus', label: dt('管理文件夹', 'Manage folders'), disabled: busy || loading, onClick: onManage }) : null),
        custom.map(renderFolder)) : null);
}

function MailFoldersDialog({ account, folders, busy, onClose, onChanged }) {
  const [newName, setNewName] = useState('');
  const [renameOf, setRenameOf] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const blocked = busy || working;

  async function act(action, payload) {
    setError('');
    setWorking(true);
    try {
      await mailboxApi(action, { account, ...payload });
      setNewName('');
      setRenameOf(null);
      setRenameValue('');
      onChanged();
    } catch (error) {
      setError(emailError(error));
    } finally {
      setConfirmation(null);
      setWorking(false);
    }
  }

  async function verify(row, operation) {
    setError('');
    setWorking(true);
    try {
      const preview = await mailboxApi('folderPreview', { account, path: row.path, operation });
      setConfirmation({ ...preview, operation, path: row.path });
    } catch (error) {
      setError(emailError(error));
    } finally {
      setWorking(false);
    }
  }

  const isDelete = confirmation?.operation === 'delete';
  const cancel = () => setConfirmation(null);
  return h(W.Dialog, {
    title: confirmation ? isDelete ? dt('删除', 'Delete') : dt('清空', 'Empty') : dt('管理文件夹', 'Manage folders'),
    closeLabel: dt('关闭', 'Close'), busy: blocked, onClose: confirmation ? cancel : onClose,
    footer: confirmation ? h(React.Fragment, null,
      h(W.Button, { disabled: blocked, onClick: cancel }, dt('取消', 'Cancel')),
      h(W.Button, { variant: 'danger', disabled: blocked, onClick: () => act(isDelete ? 'folderDelete' : 'folderPurge', { path: confirmation.path, receipt: confirmation.receipt, confirmed: true }) },
        isDelete ? dt('确认删除', 'Confirm delete') : dt('确认清空', 'Confirm empty'))) : null,
  }, h('div', { className: mailCss.modalFlow },
    h(W.Status, { tone: 'error' }, error),
    confirmation ? h(React.Fragment, null,
      h('p', null, account + ' · ' + confirmation.path + ' · ' + confirmation.count + dt(' 封邮件', ' messages')),
      h('p', null, isDelete
        ? dt('删除将移除文件夹及其全部邮件，且不可恢复，确定继续？', 'Delete removes the folder and all its messages forever. Continue?')
        : dt('清空将永久删除该文件夹内的全部邮件，确定继续？', 'Empty permanently deletes every message in this folder. Continue?'))) :
      h(React.Fragment, null,
        h('p', { className: mailCss.listNote }, dt('仅管理 IMAP 自建文件夹。清空先预览再确认，只处理已确认邮件；最多 2000 封并要求 UIDPLUS。只能删除空文件夹，永久删除不可恢复。', 'Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.')),
        h('form', { className: mailCss.folderForm, onSubmit: event => { event.preventDefault(); if (!blocked && newName.trim()) void act('folderCreate', { path: newName.trim() }); } },
          h(W.Input, { value: newName, 'aria-label': dt('新建文件夹', 'New folder'), placeholder: dt('新建文件夹', 'New folder'), 'data-modal-autofocus': true, disabled: blocked, onChange: event => setNewName(event.target.value) }),
          h(W.Button, { type: 'submit', variant: 'primary', disabled: blocked || !newName.trim() }, dt('创建', 'Create'))),
        h('ul', { className: mailCss.folderList }, folders.map(row => h('li', { key: row.path, className: mailCss.folderRow },
          renameOf === row.path ? h(React.Fragment, null,
            h(W.Input, { value: renameValue, 'aria-label': dt('重命名', 'Rename'), disabled: blocked, onChange: event => setRenameValue(event.target.value) }),
            h(W.Button, { variant: 'primary', disabled: blocked || !renameValue.trim(), onClick: () => act('folderRename', { path: row.path, newName: renameValue.trim() }) }, dt('保存', 'Save')),
            h(W.Button, { disabled: blocked, onClick: () => setRenameOf(null) }, dt('取消', 'Cancel'))) :
            h(React.Fragment, null,
              h('span', { title: row.path }, row.path),
              isProtectedFolder(row, folders) ? h('span', { className: mailCss.listNote }, dt('受保护', 'Protected')) : h(React.Fragment, null,
                h(W.Button, { variant: 'ghost', disabled: blocked, onClick: () => { setRenameOf(row.path); setRenameValue(row.path); } }, dt('重命名', 'Rename')),
                h(W.Button, { variant: 'danger', disabled: blocked, onClick: () => verify(row, 'purge') }, dt('清空', 'Empty')),
                h(W.Button, { variant: 'danger', disabled: blocked, onClick: () => verify(row, 'delete') }, dt('删除', 'Delete'))))))))));
}

function MailTrashDialog({ account, folder, uids, uidValidity, folders, busy, onClose, onConfirm }) {
  const [target, setTarget] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const ctrl = new AbortController();
    mailboxApi('trashPreview', { account, folder, uids, uidValidity, ...(target ? { target } : {}) }, ctrl.signal)
      .then(value => { if (!ctrl.signal.aborted) setPreview(value); })
      .catch(error => { if (!ctrl.signal.aborted) setError(emailError(error)); })
      .finally(() => { if (!ctrl.signal.aborted) setChecking(false); });
    return () => ctrl.abort();
  }, [account, folder, uids, uidValidity, target]);

  return h(W.Dialog, {
    title: dt('移入废纸篓', 'Move to Trash'), closeLabel: dt('取消', 'Cancel'), onClose, busy,
    footer: h(React.Fragment, null,
      h(W.Button, { onClick: onClose, disabled: busy }, dt('取消', 'Cancel')),
      h(W.Button, { variant: 'primary', disabled: busy || checking || !preview, onClick: () => onConfirm(preview) },
        busy ? dt('正在移动…', 'Moving…') : dt('确认移入 ', 'Confirm move: ') + uids.length + dt(' 封', ' messages'))),
  }, h('div', { className: mailCss.modalFlow },
    h('p', null, account + ' · ' + folder),
    h('p', null, dt('将选中的邮件移动到以下已有文件夹。不会永久删除。', 'Move the selected messages to the existing folder below. This does not permanently delete them.')),
    h(W.ChoiceMenu, {
      label: dt('目标文件夹', 'Destination folder'), value: target, disabled: busy,
      items: [{ id: '', label: dt('自动识别废纸篓', 'Detect Trash automatically') }, ...folders.filter(row => row.path !== folder).map(row => ({ id: row.path, label: row.path }))],
      onChange: value => { setPreview(null); setError(''); setChecking(true); setTarget(value); },
    }),
    checking ? h('p', { role: 'status' }, dt('正在核对邮件与文件夹…', 'Checking messages and folders…')) : null,
    h(W.Status, { tone: 'error' }, error),
    preview ? h(React.Fragment, null, h('p', null, dt('移动到：', 'Move to: ') + preview.target),
      h('ul', null, preview.messages.map(row => h('li', { key: row.uid }, row.subject || dt('（无主题）', '(No subject)')))),
      h('p', { className: mailCss.listNote }, dt('确认有效期为 90 秒；邮件状态改变后需重新确认。服务器提供新编号时，移动后可在 5 分钟内撤销。', 'Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.'))) : null));
}

// The read RPC and the shared draft parser both produce inert, allowlisted nodes.
function renderMailNodes(nodes, { styled = false, image } = {}, path = 'mail') {
  return (nodes || []).map((node, index) => {
    if (typeof node === 'string') return node;
    const key = path + '.' + index;
    if (node.tag === 'img') return image?.(node, key) ?? null;

    const props = { key, ...(styled ? { style: node.style } : {}) };
    if (node.tag === 'a' && node.href) {
      Object.assign(props, { href: node.href, target: '_blank', rel: 'noopener noreferrer', referrerPolicy: 'no-referrer' });
    }
    if (node.span) props.colSpan = node.span;
    if (node.tag === 'br' || node.tag === 'hr') return h(node.tag, props);
    const options = { styled, image };
    const children = renderMailNodes(node.children, options, key);
    if (node.tag === 'table' && node.children?.some(child => child?.tag === 'tr')) {
      // htmlparser2 does not insert the implicit tbody that browsers require.
      const tableChildren = [];
      let rows = [];
      function flushRows() {
        if (rows.length) tableChildren.push(h('tbody', { key: key + '.body.' + tableChildren.length }, rows));
        rows = [];
      }
      node.children.forEach((child, position) => {
        if (child?.tag === 'tr') rows.push(children[position]);
        else if (typeof child !== 'string' || child.trim()) {
          flushRows();
          tableChildren.push(children[position]);
        }
      });
      flushRows();
      return h('table', props, tableChildren);
    }
    return h(node.tag, props, children);
  });
}

function MailContent({ detail, account, folder, selected, plain }) {
  const rich = detail.rich;
  const [remote, setRemote] = useState(false);
  const [imageState, setImageState] = useState(null);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(false);
  const imageLoad = React.useMemo(() => ({}), [rich, account, folder, selected, plain, remote, retry]);
  const images = imageState?.load === imageLoad ? imageState.values : {};

  __stardustUpdatesGuard(React, 'dsh-email.images', { busy: loading });
  useEffect(() => {
    if (plain || !rich?.images?.length) { setLoading(false); return; }
    const ctrl = new AbortController();
    const urls = [];
    const queue = rich.images.filter(image => image.kind === 'inline' || remote);
    const updateImage = (id, value) => setImageState(old => ({
      load: imageLoad, values: { ...(old?.load === imageLoad ? old.values : {}), [id]: value },
    }));
    setLoading(queue.length > 0);

    async function worker() {
      while (queue.length && !ctrl.signal.aborted) {
        const image = queue.shift();
        try {
          const blob = await mailboxApi('image', { account, folder, uid: selected, image: image.id, allowRemote: remote }, ctrl.signal);
          if (ctrl.signal.aborted) return;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          updateImage(image.id, { url });
        } catch (error) {
          if (!ctrl.signal.aborted) updateImage(image.id, { error: true, message: emailError(error) });
        }
      }
    }

    Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker))
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => { ctrl.abort(); for (const url of urls) URL.revokeObjectURL(url); };
  }, [imageLoad]);

  const external = rich?.images?.filter(image => image.kind === 'remote').length || 0;
  function renderImage(node, key) {
    const image = rich.images[node.image];
    if (!image) return null;
    const loaded = images[image.id];
    const alt = image.alt || dt('邮件图片', 'Email image');
    if (loaded?.url && !loaded.error) return h('img', {
      key, src: loaded.url, alt, className: mailCss.richImage,
      onError: () => setImageState(old => old?.load === imageLoad
        ? { ...old, values: { ...old.values, [image.id]: { error: true } } } : old),
    });

    const state = loaded?.error ? dt('加载失败，可重试', 'Failed to load; retry available')
      : image.kind === 'remote' && !remote ? dt('外部图片已阻止', 'External image blocked') : dt('正在加载…', 'Loading…');
    return h('span', { key, className: mailCss.imagePlaceholder, role: 'status' }, alt + ' · ' + state,
      loaded?.message ? h('span', { className: mailCss.imageError }, loaded.message) : null);
  }

  return h('section', { className: mailCss.body },
    !plain && external > 0 && !remote ? h('div', { className: mailCss.privacy },
      h(W.Icon, { name: 'image' }),
      h('span', null, dt('外部图片默认不加载，加载后可能向发件人透露阅读时间与网络地址。仅对当前邮件生效。', 'External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.')),
      h(W.Button, { onClick: () => setRemote(true) }, dt('加载外部图片（', 'Load external images (') + external + dt('）', ')'))) : null,
    !plain && Object.values(images).some(image => image.error) ? h('div', { className: mailCss.bodyTools },
      h(W.Button, { onClick: () => setRetry(n => n + 1) }, dt('重试图片', 'Retry images'))) : null,
    plain ? h('pre', { className: mailCss.plain }, detail.text || dt('（空正文）', '(Empty body)'))
      : h('div', { className: mailCss.rich }, renderMailNodes(rich.nodes, { image: renderImage })),
    detail.truncated || rich?.limited ? h(W.Status, null, dt('正文或图文结构超过显示上限，部分内容已省略。可切换纯文本或用邮箱客户端查看。', 'Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.')) : null);
}

function MailMessage({ detail, currentRow, account, folder, selected, busy, run, who, date, onDraft, onMark, onTrash, canTrash }) {
  const formatted = !!detail.rich?.nodes?.length;
  const [plain, setPlain] = useState(!formatted);
  const [showHeaders, setShowHeaders] = useState(false);
  const headerId = React.useId();
  const from = who(detail.from);
  const to = who(detail.to);
  const cc = who(detail.cc);
  const subject = detail.subject || dt('（无主题）', '(No subject)');
  const dateText = date(detail.date);
  const initials = Array.from((detail.from?.[0]?.name || detail.from?.[0]?.address || '?').trim()).slice(0, 2).join('').toUpperCase();
  const rawHeaders = typeof detail.rawHeaders === 'string' ? detail.rawHeaders : '';
  const headerText = rawHeaders || [
    ['From', from], ['To', to], ['Cc', cc], ['Subject', detail.subject], ['Date', detail.date],
  ].filter(([, value]) => value).map(([name, value]) => name + ': ' + value).join('\n');
  const headerLabel = rawHeaders ? dt('原始邮件头', 'Raw headers') : dt('邮件头字段', 'Header fields');

  function reply(all) {
    return run(async valid => {
      const draft = await mailboxApi('replyDraft', { account, folder, uid: selected, replyAll: all, locale: UI_LANG === 'en' ? 'en' : 'zh' });
      if (valid()) onDraft(draft.id);
    });
  }

  function mark(value) {
    return run(async valid => {
      await mailboxApi('mark', { account, folder, uid: selected, mark: value });
      if (valid()) onMark(value);
    });
  }

  function download(file, index) {
    return run(async valid => {
      const blob = await mailboxApi('download', { account, folder, uid: selected, index });
      if (!valid()) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    });
  }

  return h('article', { className: mailCss.message, 'aria-label': dt('邮件详情', 'Message details') },
    h('div', { className: mailCss.readerTools },
      h(W.Button, { icon: 'reply', disabled: busy, onClick: () => reply(false) }, dt('回复到草稿', 'Reply in drafts')),
      h(W.Button, { disabled: busy, onClick: () => reply(true) }, dt('回复全部到草稿', 'Reply all in drafts')),
      formatted ? h(W.Button, { variant: 'ghost', onClick: () => setPlain(value => !value) }, plain ? dt('查看图文', 'View formatted message') : dt('查看纯文本', 'View plain text')) : null,
      h(W.Button, { variant: 'ghost', 'aria-expanded': showHeaders, 'aria-controls': headerId, onClick: () => setShowHeaders(value => !value) }, headerLabel, h(W.Icon, { name: 'down', size: 14 })),
      currentRow?.flagsSupported !== false ? h(React.Fragment, null,
        h(W.IconButton, { icon: 'mail', disabled: busy, onClick: () => mark(currentRow?.seen ? 'unread' : 'read'), label: currentRow?.seen ? dt('标记未读', 'Mark unread') : dt('标记已读', 'Mark read') }),
        h(W.IconButton, { icon: 'star', disabled: busy, 'aria-pressed': !!currentRow?.flagged, onClick: () => mark(currentRow?.flagged ? 'unstar' : 'star'), label: currentRow?.flagged ? dt('取消星标', 'Unstar') : dt('添加星标', 'Star') })) : null,
      canTrash ? h(W.IconButton, { icon: 'trash', variant: 'danger', disabled: busy, onClick: () => onTrash([selected]), label: dt('移入废纸篓', 'Move to Trash') }) : null),
    h('div', { className: mailCss.readerScroll },
      h('h2', null, subject),
      h('div', { className: mailCss.envelope, 'data-dsh-card': '' },
        h('span', { className: mailCss.avatar, 'aria-hidden': true }, initials),
        h('div', { className: mailCss.envelopeAddresses },
          h('p', null, h('strong', null, from)),
          h('p', { className: mailCss.recipients }, dt('收件人：', 'To: ') + to, cc ? ' · Cc: ' + cc : null)),
        dateText ? h('time', { className: mailCss.timestamp, dateTime: detail.date }, dateText) : null,
        h('div', { id: headerId, className: mailCss.headers, hidden: !showHeaders },
          !rawHeaders ? h('span', { className: mailCss.listNote }, dt('邮件服务提供的已解析字段', 'Parsed fields from the mail service')) : null,
          h('pre', null, headerText))),
      h(MailContent, { detail, account, folder, selected, plain })),
    detail.attachments?.length ? h('section', { className: mailCss.attachments },
        h('h3', null, dt('附件', 'Attachments')),
        h('ul', null, detail.attachments.map((file, index) => h('li', { key: index },
          h(W.Button, { disabled: busy, icon: 'download', title: dt('下载附件', 'Download attachment'), onClick: () => download(file, index) },
            h('span', { className: mailCss.attachmentTitle }, h('strong', null, file.filename), h('small', null, Math.ceil(file.size / 1024) + ' KiB'))))))) : null);
}

const MAILBOX_ROUTE = "api/dsh-email/mailbox";
async function mailboxApi(action, payload = {}, signal) {
  const response = await fetch(MAILBOX_ROUTE, { credentials: "same-origin", method: "POST", headers: { "Content-Type": "application/json", "x-dsh-email-mailbox": "1" }, body: JSON.stringify({ ...payload, action }), signal });
  if ((action === "download" || action === "image") && response.ok)
    return response.blob();
  const result = await response.json();
  if (!response.ok || !result.ok)
    throw new Error(result.error?.message || dt("邮箱操作失败", "Mailbox action failed"));
  return result.value;
}

function MailboxWorkbench({ active, onConfigure, onDraft, onAccountChange }) {
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountReload, setAccountReload] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState("");
  const [folders, setFolders] = useState([]);
  const [folder, setFolder] = useState("");
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [folderReload, setFolderReload] = useState(0);
  const [checked, setChecked] = useState([]);
  const [trash, setTrash] = useState(null);
  const [moved, setMoved] = useState(null);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [scanOffset, setScanOffset] = useState(0);
  const [unread, setUnread] = useState(false);
  const [withAttachments, setWithAttachments] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [readError, setReadError] = useState("");
  const [readToken, setReadToken] = useState(0);
  const busyRef = useRef(false);
  const context = useRef(0);
  const readerBack = useRef(null);
  const openedRow = useRef(null);
  const activeAccount = accounts.find(row => row.name === account);
  const isPop3 = activeAccount?.incoming === 'pop3';
  const canTrash = activeAccount?.trashSupported === true;

  __stardustUpdatesGuard(React, 'dsh-email.mailbox', { busy: !!trash || foldersOpen });
  __stardustUpdatesGuard(React, 'dsh-email.mailbox-operation', { busy });
  useEffect(() => { setFoldersOpen(false); setMoved(null); }, [active, account]);
  useEffect(() => { onAccountChange?.(account); }, [account, onAccountChange]);
  useEffect(() => { setChecked([]); setTrash(null); }, [active, account, folder, query, offset, scanOffset, unread, refresh]);
  useEffect(() => {
    if (selected === null || !readerBack.current?.getClientRects().length) return;
    readerBack.current.querySelector('button')?.focus({ preventScroll: true });
  }, [selected]);
  useEffect(() => {
    if (!moved?.undo) return;
    const timer = setTimeout(() => setMoved(old => old === moved ? { ...old, undo: null } : old), Math.max(0, moved.undoExpires - Date.now()));
    return () => clearTimeout(timer);
  }, [moved]);

  useEffect(() => {
    if (!active) return;
    const ctrl = new AbortController();
    setAccountsLoading(true);
    setError("");
    mailboxApi("accounts", {}, ctrl.signal).then(value => {
      if (ctrl.signal.aborted) return;
      setAccounts(value.accounts);
      setAccount(old => value.accounts.some(row => row.name === old) ? old : value.defaultAccount);
    }).catch(error => {
      if (!ctrl.signal.aborted) setError(emailError(error));
    }).finally(() => {
      if (!ctrl.signal.aborted) setAccountsLoading(false);
    });
    return () => ctrl.abort();
  }, [active, accountReload]);

  useEffect(() => {
    context.current++;
    setSelected(null);
    setDetail(null);
    setResult(null);
    setFolder("");
    setFolders([]);
    setOffset(0);
    setScanOffset(0);
    if (!active || !account) { setFoldersLoading(false); return; }
    const ctrl = new AbortController();
    setFoldersLoading(true);
    mailboxApi("folders", { account }, ctrl.signal).then(value => {
      if (ctrl.signal.aborted) return;
      setFolders(value.folders);
      setFolder(value.folders.find(row => row.specialUse === '\Inbox')?.path ||
        value.folders.find(row => row.path === 'INBOX')?.path || value.folders[0]?.path || "");
    }).catch(error => {
      if (!ctrl.signal.aborted) setError(emailError(error));
    }).finally(() => {
      if (!ctrl.signal.aborted) setFoldersLoading(false);
    });
    return () => ctrl.abort();
  }, [active, account, folderReload, accountReload]);

  useEffect(() => {
    context.current++;
    setSelected(null);
    setDetail(null);
    setResult(null);
    if (!active || !account || !folder) { setLoading(false); return; }
    const ctrl = new AbortController();
    setLoading(true);
    setError("");
    mailboxApi("list", { account, folder, query, offset, unreadOnly: unread, headerScanOffset: scanOffset }, ctrl.signal)
      .then(value => { if (!ctrl.signal.aborted) setResult(value); })
      .catch(error => { if (!ctrl.signal.aborted) setError(emailError(error)); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [active, account, folder, query, offset, scanOffset, unread, refresh]);

  useEffect(() => {
    setDetail(null);
    setReadError("");
    if (!active || selected === null) { setReading(false); return; }
    const ctrl = new AbortController();
    setReading(true);
    mailboxApi("read", { account, folder, uid: selected }, ctrl.signal)
      .then(value => { if (!ctrl.signal.aborted) setDetail(value); })
      .catch(error => { if (!ctrl.signal.aborted) setReadError(emailError(error)); })
      .finally(() => { if (!ctrl.signal.aborted) setReading(false); });
    return () => ctrl.abort();
        }, [active, account, folder, selected, readToken]);

  async function run(task) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    const generation = context.current;
    const valid = () => generation === context.current;
    try {
      await task(valid);
    } catch (error) {
      if (valid()) setError(emailError(error));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const retry = () => { setAccountReload(n => n + 1); setRefresh(n => n + 1); setReadToken(n => n + 1); };
  function reset() {
    setChecked([]);
    setOffset(0);
    setScanOffset(0);
    setSelected(null);
    setDetail(null);
    setReadError("");
  }
  function changeAccount(value) {
    reset();
    setFolder("");
    setFolders([]);
    setResult(null);
    setInput("");
    setQuery("");
    setUnread(false);
    setAccount(value);
  }
  function changeFolder(value) {
    if (folder === value) return;
    reset();
    setResult(null);
    setFolder(value);
  }
  function openMessage(uid, button) {
    if (selected === uid) return;
    openedRow.current = button;
    setDetail(null);
    setReadError("");
    setReading(true);
    setSelected(uid);
  }
  function backToList() {
    setSelected(null);
    setDetail(null);
    requestAnimationFrame(() => openedRow.current?.focus({ preventScroll: true }));
  }

  const requestTrash = uids => { setMoved(null); setTrash(uids); };
  const confirmTrash = preview => run(async valid => {
    try {
      const value = await mailboxApi('trashConfirm', { account, folder, receipt: preview.id, confirmed: true });
      if (valid()) setMoved({ ...value, account });
    } finally {
      if (valid()) {
        setTrash(null);
        setChecked([]);
        setOffset(0);
        setRefresh(n => n + 1);
      }
    }
  });
  const undoTrash = () => run(async valid => {
    const operation = moved;
    setMoved(null);
    try {
      await mailboxApi('undoTrash', { account: operation.account, folder: operation.target, receipt: operation.undo, confirmed: true });
    } finally {
      if (valid()) { setOffset(0); setRefresh(n => n + 1); }
    }
  });

  const who = list => (list || []).map(a => a.name && a.address ? a.name + " <" + a.address + ">" : a.address || a.name).filter(Boolean).join(", ");
  const rows = result?.messages || [];
  const visibleRows = withAttachments ? rows.filter(row => row.hasAttachments) : rows;
  const currentRow = rows.find(row => row.uid === selected);
  const hasMore = result?.hasMore ?? (result?.bodyScan ? rows.length === 20 : offset + rows.length < (result?.count || 0));
  const listLoading = loading || foldersLoading;
  const pageLimit = 20;

  const errorBanner = h(W.Status,{tone:'error'},error ? h(React.Fragment, null, error,
    h('div', { className: uiCss.actions },
      h(W.Button, { icon: 'refresh', variant: 'primary', disabled: busy || accountsLoading, onClick:retry }, dt('重试','Retry')),
      h(W.Button, { variant: 'ghost', onClick: onConfigure }, dt('检查账号设置','Check account settings')))) : null);

  if (accountsLoading || !accounts.length) {
    return h('section', { className: mailCss.mailbox, 'aria-label': dt('邮箱工作台','Mailbox workbench') },
      h('div', { className: mailCss.alert, hidden: !error }, errorBanner),
      accountsLoading ? h(W.Empty, { title: dt('正在读取邮箱账号…','Loading accounts…') }) :
        h(W.Empty, { title: error ? dt('暂时无法读取邮箱','Mailbox unavailable') : dt('连接你的邮箱','Connect your mailbox'),
          action: h(W.Button, { variant: 'primary', onClick: onConfigure }, dt('邮箱设置','Account settings')),
        }, dt('添加并测试邮箱账号后，即可在这里阅读和回复邮件。','Add and test an email account to read and reply here.')));
  }

  return h('section', { className: mailCss.mailbox, 'aria-label': dt('邮箱工作台','Mailbox workbench') },
    error ? h('div', { className: mailCss.alert }, errorBanner) : null,
    moved ? h('div', { className: mailCss.moveNotice, role: 'status', 'data-window-drag-exclude': '' },
      h('span', null, dt('已移动 ', 'Moved ') + moved.count + dt(' 封至 ', ' messages to ') + moved.target,
        !moved.undo ? h('p', { className: mailCss.listNote }, dt('如需恢复，请在邮箱客户端移回原文件夹。', 'To restore, move the messages back in your mail client.')) : null),
      moved.undo ? h(W.Button, { disabled: busy, onClick: undoTrash }, dt('撤销移动', 'Undo move')) : null,
      h(W.IconButton, { icon: 'close', onClick: () => setMoved(null), label: dt('关闭提示', 'Dismiss') })) : null,
    h('div', { className: mailCss.columns, 'data-reading': selected !== null },
      h(MailFolderRail, { accounts, account, folder, folders, busy, loading: foldersLoading,
        onAccount: changeAccount, onFolder: changeFolder, onManage: () => setFoldersOpen(true) }),
      h('section', { className: mailCss.list, 'aria-label': dt('邮件列表', 'Message list'), 'aria-busy': listLoading || undefined },
        h('div', { className: mailCss.listHeader },
          h('form', { className: mailCss.search, onSubmit: event => { event.preventDefault(); if (!folder || busy || listLoading) return; reset(); setUnread(false); setQuery(input.trim()); setRefresh(n => n + 1); } },
            h(W.Input, { icon: 'search', type: 'search', 'aria-label': dt('搜索当前文件夹','Search current folder'), placeholder: dt('搜索当前文件夹','Search current folder'), value: input, maxLength: 500, disabled: busy, onChange: event => setInput(event.target.value) }),
            h(W.IconButton, { icon: 'search', label: dt('搜索','Search'), type: 'submit', disabled: listLoading || busy || !folder }),
            h(W.IconButton, { icon: 'refresh', label: dt('刷新邮件','Refresh mail'), 'aria-busy': listLoading || undefined, disabled: listLoading || busy || !folder, onClick: () => setRefresh(n => n + 1) })),
          h('div', { className: mailCss.filters },
            !isPop3 ? h(W.Button, { variant: unread ? 'primary' : 'outline', disabled: busy || !!query, 'aria-pressed': unread,
              onClick: () => { reset(); setUnread(value => !value); } }, dt('只看未读','Unread only')) : null,
            h(W.Button, { variant: withAttachments ? 'primary' : 'outline', disabled: busy, 'aria-pressed': withAttachments,
              onClick: () => { setChecked([]); setWithAttachments(value => !value); } }, dt('本页有附件', 'With attachments on this page')),
            query ? h(W.Button, { variant: 'ghost', disabled: busy, onClick: () => { reset(); setInput(''); setQuery(''); } }, dt('清除搜索','Clear search')) : null)),
        canTrash && visibleRows.length ? h('div', { className: mailCss.batch },
          h(W.Checkbox, { label: dt('选择本页', 'Select page'), disabled: busy || listLoading,
            checked: checked.length === visibleRows.length, onChange: value => setChecked(value ? visibleRows.map(row => row.uid) : []) }),
          checked.length ? h(W.Button, { variant: 'danger', icon: 'trash', disabled: busy || listLoading, onClick: () => requestTrash(checked) },
            dt('移入废纸篓（', 'Move to Trash (') + checked.length + dt('）', ')')) : null) : null,
        h('div', { className: mailCss.listScroll, onPointerMove: moveMailSpotlight },
          visibleRows.length ? visibleRows.map(row => {
            const unseen = row.flagsSupported !== false && !row.seen;
            const subject = row.subject || dt('（无主题）','(No subject)');
            const from = who(row.from);
            return h('div', { key: row.uid, className: mailCss.messageRow, 'data-dsh-row': '', 'data-selected': selected === row.uid, 'data-unread': unseen },
              canTrash ? h(W.Checkbox, { hiddenLabel: true, label: dt('选择邮件：', 'Select message: ') + subject,
                checked: checked.includes(row.uid), disabled: busy || listLoading,
                onChange: value => setChecked(old => value ? [...old, row.uid] : old.filter(uid => uid !== row.uid)) }) : null,
              h(W.Button, { variant: 'ghost', className: mailCss.messageButton, disabled: busy, 'aria-pressed': selected === row.uid,
                onClick: event => openMessage(row.uid, event.currentTarget) },
                h('span', { className: mailCss.messageLine },
                  unseen ? h('span', { className: mailCss.unreadDot, role: 'img', 'aria-label': dt('未读','Unread') }) : null,
                  h('strong', { className: mailCss.sender, title: from }, row.from?.[0]?.name || from),
                  row.flagged ? h(W.Icon, { name: 'star', size: 13 }) : null,
                  h('time', { className: mailCss.timestamp, dateTime: row.date }, formatDate(row.date))),
                h('span', { className: mailCss.messageLine }, h('span', { className: mailCss.subject, title: subject }, subject),
                  row.hasAttachments ? h(W.Icon, { name: 'clip', size: 13, role: 'img', 'aria-hidden': undefined, 'aria-label': dt('附件', 'Attachments') }) : null)));
          }) : h(W.Empty, {
            title:error && !result?dt('邮件列表没有读出来','Messages could not be loaded')
              : listLoading ? dt('正在读取邮件…','Loading messages…') : rows.length && withAttachments ? dt('本页没有附件邮件', 'No messages with attachments on this page')
              : query ? dt('当前检索范围内没有结果。','No results in the current search window.') : dt('当前页没有邮件。','No messages on this page.'),
            action: error && !result ? h(W.Button, { icon: 'refresh', disabled: busy || listLoading, onClick: retry }, dt('重试','Retry')) : undefined,
          })),
        h('footer', { className: mailCss.listFooter },
          h('p', { className: mailCss.listNote, role: 'status' }, result ? dt("本页 ", "This page: ") + rows.length + dt(" 封", " messages") +
            (result.order === 'relevance' ? dt(' · 按相关性排序', ' · Ranked by relevance') : dt(' · 按邮箱到达序排列', ' · Mailbox arrival order')) : null),
          result?.headerScan ? h('p', { className: mailCss.listNote }, dt('信封实际扫描：', 'Headers scanned: ') + result.headerScan.scanned + ' / ' + result.headerScan.mailboxTotal +
            (result.headerScan.complete ? dt('，信封覆盖完整；正文另有限制。', '; headers fully covered; body search has a separate limit.') : dt('，尚未覆盖全文件夹。', '; folder coverage is partial.'))) : null,
          result?.bodyScan ? h('p', { className: mailCss.listNote }, dt('正文实际扫描：','Bodies scanned: ') + result.bodyScan.scanned + dt(' 封；最多 ',' messages; limit ') + result.bodyScan.scanLimit + dt(' 封，受正文显示上限限制。','; bounded by the body display limit.')) : null,
          result?.searchSource === 'api' ? h('p', { className: mailCss.listNote }, dt('AgentMail 搜索由服务按相关性返回，垃圾箱等特殊邮件不在其搜索范围。','AgentMail ranks results by relevance and excludes spam, trash and other protected mail.')) : null,
          isPop3 ? h('p', { className: mailCss.listNote }, dt('POP3 收件箱 · 不提供服务器已读、星标或已发送文件夹。回复会进入本地草稿，确认后通过 SMTP 发送。','POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.'))
            : !canTrash ? h('p', { className: mailCss.listNote }, dt('此协议暂不支持移入废纸篓，请使用邮箱原生客户端删除。','Trash is unavailable for this protocol; delete in your mail client.')) : null,
          h('div', { className: mailCss.pages },
            h(W.Button, { icon: 'left', disabled: loading || busy || offset === 0, onClick: () => setOffset(n => Math.max(0, n - pageLimit)) }, dt('上一页', 'Previous page')),
            h('span', { className: mailCss.listNote }, dt('第 ', 'Page ') + (Math.floor(offset / pageLimit) + 1) + dt(' 页', '')),
            h(W.Button, { icon: 'right', disabled: loading || busy || !hasMore, onClick: () => setOffset(n => n + pageLimit) }, dt('下一页', 'Next page'))),
          result?.headerScan?.nextScanOffset !== undefined ? h(W.Button, { icon: 'search', disabled: loading || busy, onClick: () => { setOffset(0); setScanOffset(result.headerScan.nextScanOffset); } }, dt('继续搜索更早邮件', 'Search older headers')) : null)),
      h('section', { className: mailCss.reader, 'aria-label': dt('邮件详情', 'Message details'), 'aria-busy': reading || undefined },
        selected !== null ? h('div', { className: mailCss.readerBack, ref: readerBack },
          h(W.Button, { variant: 'ghost', icon: 'left', disabled: busy, onClick: backToList }, dt('返回邮件列表','Back to messages'))) : null,
        reading && selected !== null ? h(W.Empty, { title: dt('正在读取正文…','Loading message…') }) :
          readError && selected !== null ? h(W.Empty, { title:dt('这封邮件没有读出来','This message could not be loaded'),
            action: h(W.Button, { icon: 'refresh', disabled: busy, onClick: () => setReadToken(n => n + 1) }, dt('重试','Retry')),
          }, readError) : detail ? h(MailMessage, {
            key: JSON.stringify([account, folder, selected, detail.rich?.images?.[0]?.id]),
            detail, currentRow, account, folder, selected, busy, run, who, date: formatDate, onDraft, canTrash, onTrash: requestTrash,
            onMark: value => setResult(old => old && { ...old, messages: old.messages.map(row => row.uid === selected ? {
              ...row, ...(value === 'read' || value === 'unread' ? { seen: value === 'read' } : { flagged: value === 'star' }),
            } : row) }),
          }) : h(W.Empty, { title: dt('选择一封邮件','Select a message') }, dt('打开正文后，可以回复到草稿、标记状态或下载附件。','Open a message to reply in drafts, mark its state or download attachments.')))),
    trash ? h(MailTrashDialog, { account, folder, uids: trash, uidValidity: result?.uidValidity, folders, busy, onClose: () => setTrash(null), onConfirm: confirmTrash }) : null,
    foldersOpen ? h(MailFoldersDialog, { account, folders, busy, onClose: () => setFoldersOpen(false), onChanged: () => setFolderReload(n => n + 1) }) : null);
}
