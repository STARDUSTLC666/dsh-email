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
  if (row.specialUse === '\\Inbox' || /^(inbox|收件箱)$/i.test(leaf)) return dt('收件箱', 'Inbox');
  if (row.specialUse === '\\Sent' || /^(sent(?: messages| items)?|已发送)$/i.test(leaf)) return dt('已发送', 'Sent');
  if (row.specialUse === '\\Trash' || /^(trash|deleted(?: messages| items)?|垃圾箱|废纸篓|已删除)$/i.test(leaf)) return dt('废纸篓', 'Trash');
  if (row.specialUse === '\\Drafts' || /^drafts$/i.test(leaf)) return dt('草稿', 'Drafts');
  return row.name || row.path;
}

// Machines report flat LIST rows; the rail is a tree. Keep the ordering local
// and deterministic: system folders first, then names, children under parents.
function folderSystemRank(row) {
  const special = String(row.specialUse || '');
  if (special === '\\Inbox' || /^(inbox|收件箱)$/i.test(folderLeaf(row))) return 0;
  if (special === '\\Sent' || /^(sent(?: messages| items)?|已发送)$/i.test(folderLeaf(row))) return 1;
  if (special === '\\Drafts' || /^drafts$/i.test(folderLeaf(row))) return 2;
  if (special === '\\Junk' || /^(junk(?: e-mail)?|垃圾邮件)$/i.test(folderLeaf(row))) return 3;
  if (special === '\\Trash' || /^(trash|deleted(?: messages| items)?|垃圾箱|废纸篓|已删除)$/i.test(folderLeaf(row))) return 4;
  if (special !== '') return 5;
  return 6;
}

function buildFolderTree(folders) {
  const nodes = new Map();
  for (const row of Array.isArray(folders) ? folders : []) {
    if (!row || typeof row.path !== 'string' || row.path === '') continue;
    nodes.set(row.path, { row, depth: 0, orphan: false, children: [] });
  }
  const roots = [];
  for (const node of nodes.values()) {
    const row = node.row;
    let parentPath = typeof row.parentPath === 'string' ? row.parentPath : '';
    if (!parentPath) {
      const delimiter = row.delimiter || '/';
      const index = row.path.lastIndexOf(delimiter);
      if (index > 0) parentPath = row.path.slice(0, index);
    }
    const parent = parentPath ? nodes.get(parentPath) : undefined;
    if (parent && parent !== node) {
      parent.children.push(node);
    } else {
      // A parent the server did not list (or a path outside the namespace):
      // keep the row reachable as a root and show its full path.
      node.orphan = Boolean(parentPath);
      roots.push(node);
    }
  }
  const compare = (left, right) => {
    const rank = folderSystemRank(left.row) - folderSystemRank(right.row);
    if (rank !== 0) return rank;
    return String(left.orphan ? left.row.path : folderLabel(left.row))
      .localeCompare(String(right.orphan ? right.row.path : folderLabel(right.row)), undefined, { numeric: true, sensitivity: 'base' });
  };
  const sort = list => {
    list.sort(compare);
    for (const node of list) sort(node.children);
  };
  sort(roots);
  // LIST order is not guaranteed to put a parent before its children, so the
  // indentation level is assigned from the finished forest, not row order.
  const assignDepth = (list, depth) => {
    for (const node of list) {
      node.depth = depth;
      assignDepth(node.children, depth + 1);
    }
  };
  assignDepth(roots, 0);
  return roots;
}

function flattenFolderTree(nodes, depth = 0, acc = []) {
  for (const node of nodes) {
    acc.push({ row: node.row, depth, orphan: node.orphan });
    flattenFolderTree(node.children, depth + 1, acc);
  }
  return acc;
}

function MailFolderRail({ accounts, account, folder, folders, busy, loading, onAccount, onFolder, onManage }) {
  const current = accounts.find(row => row.name === account);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const forest = buildFolderTree(folders);
  const protocol = row => row.incoming === 'agentmail' ? 'AgentMail' : row.incoming === 'pop3' ? 'POP3' : 'IMAP';
  const unseenOf = row => Number.isSafeInteger(row.unseen) && row.unseen > 0 ? row.unseen : 0;
  const toggle = path => setCollapsed(previous => {
    const next = new Set(previous);
    const key = account + '\u0000' + path;
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const renderNode = node => {
    const row = node.row, count = unseenOf(row), key = account + '\u0000' + row.path;
    const isCollapsed = collapsed.has(key), hasChildren = node.children.length > 0;
    const label = node.orphan ? row.path : folderLabel(row);
    return h(React.Fragment, { key: row.path },
      h('div', { className: mailCss.folderNode, style: { '--mail-folder-depth': String(node.depth) } },
        hasChildren
          ? h(W.IconButton, {
              className: mailCss.folderToggle, icon: isCollapsed ? 'right' : 'down',
              label: isCollapsed ? dt('展开子文件夹', 'Expand subfolders') : dt('收起子文件夹', 'Collapse subfolders'),
              'aria-expanded': !isCollapsed, onClick: () => toggle(row.path),
            })
          : h('span', { className: mailCss.folderToggleSpacer, 'aria-hidden': 'true' }),
        h(W.Button, {
          className: mailCss.folder, variant: 'ghost',
          icon: row.specialUse === '\\Trash' ? 'trash' : row.specialUse === '\\Sent' ? 'send' : row.specialUse === '\\Inbox' || row.path === 'INBOX' ? 'inbox' : 'folder',
          disabled: busy, title: row.path, 'aria-current': folder === row.path ? 'location' : undefined,
          ...(count > 0 ? { 'aria-label': label + ' · ' + count + ' ' + dt('未读', 'Unread') } : {}),
          onClick: () => onFolder(row.path),
        },
          h('span', { className: mailCss.folderName }, label),
          count > 0 ? h('span', { className: mailCss.folderUnread, 'aria-hidden': 'true' }, count > 999 ? '999+' : String(count)) : null)),
      hasChildren && !isCollapsed ? node.children.map(renderNode) : null);
  };

  return h('aside', { className: mailCss.rail, 'aria-label': dt('账号与文件夹','Accounts and folders') },
    h(W.ChoiceMenu, {
      label: dt('邮箱账号','Account') + (current ? ' · ' + current.name : ''),
      value: account, disabled: busy, onChange: onAccount,
      items: accounts.map(row => ({ id: row.name, label: row.name + ' · ' + row.user })),
    }, current ? h('span', { className: mailCss.account }, current.user || current.name,
      h('span', { className: mailCss.accountMeta }, protocol(current) + ' · ' + current.name)) : null),
    h('nav', { className: mailCss.railGroup, 'aria-label': dt('文件夹', 'Folders') },
      h('div', { className: mailCss.railHeading }, h('h2', null, dt('文件夹', 'Folders')),
        current?.incoming === 'imap' ? h(W.IconButton, { icon: 'plus', label: dt('管理文件夹', 'Manage folders'), disabled: busy || loading, onClick: onManage }) : null),
      forest.map(renderNode)));
}

function MailFoldersDialog({ account, folders, busy, onClose, onChanged }) {
  const [newName, setNewName] = useState('');
  const [renameOf, setRenameOf] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const blocked = busy || working;
  const ordered = flattenFolderTree(buildFolderTree(folders));

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
        h('ul', { className: mailCss.folderList }, ordered.map(({ row, depth }) => h('li', { key: row.path, className: mailCss.folderRow, style: { paddingInlineStart: (8 + depth * 14) + 'px' } },
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
  const initials = Array.from((contactDisplayName(detail.from?.[0]) || detail.from?.[0]?.address || '?').trim()).slice(0, 2).join('').toUpperCase();
  const rawHeaders = typeof detail.rawHeaders === 'string' ? detail.rawHeaders : '';
  const headerText = rawHeaders || [
    ['From', from], ['To', to], ['Cc', cc], ['Subject', detail.subject], ['Date', detail.date],
  ].filter(([, value]) => value).map(([name, value]) => name + ': ' + value).join('\n');
  const headerLabel = rawHeaders ? dt('原始邮件头', 'Raw headers') : dt('邮件头字段', 'Header fields');

  function reply(all) {
    return run(async valid => {
      const draft = await mailboxApi('replyDraft', { account, folder, uid: selected, replyAll: all });
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
      h('h2', { 'data-dsh-serif': '' }, subject),
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

async function writeClipboardText(text) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to synchronous textarea selection when Clipboard API is blocked.
  }
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return false;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0;pointer-events:none';
  document.body?.appendChild?.(field);
  field.select?.();
  try {
    return typeof document.execCommand === 'function' && document.execCommand('copy');
  } catch {
    return false;
  } finally {
    field.remove?.();
  }
}

function MailWorkflowBar({ account, folder, selected, detail, currentRow, who }) {
  const [copiedId, setCopiedId] = useState('');
  const [failedId, setFailedId] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const timerRef = useRef(0);
  const lastAnnouncedRef = useRef('');

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const hasSelection = selected !== null && Boolean(detail || currentRow);
  const activeSubject = (detail?.subject ?? currentRow?.subject) || dt('（无主题）', '(No subject)');
  const activeSender = who(detail?.from ?? currentRow?.from);
  const scopePrefix = account ? '[' + dt('账号', 'Account') + ': ' + account + (folder ? ' / ' + folder : '') + '] ' : '';
  const selectedContext = hasSelection
    ? '\n' + dt('目标邮件：', 'Selected mail: ') + dt('主题：', 'Subject: ') + activeSubject +
      (activeSender ? ' · ' + dt('发件人：', 'From: ') + activeSender : '') +
      ' (UID: ' + selected + (account ? ', ' + account + (folder ? '/' + folder : '') : '') + ')'
    : '';

  const chips = [
    {
      id: 'unread-summary',
      label: dt('汇总未读与待办', 'Summarize unread & tasks'),
      prompt: scopePrefix + dt('汇总未读重要邮件并列出待回复事项，先不要发送任何邮件。', 'Summarize important unread mail and list replies needed (do not send).'),
    },
    {
      id: 'polite-reply',
      label: dt('起草得体回复草稿', 'Draft a polite reply'),
      prompt: hasSelection
        ? dt('帮我针对当前选中的邮件起草一封得体的回复草稿，保存在草稿箱让我核对，先不要发送。', 'Draft a polite reply to the selected email in Drafts without sending.') + selectedContext
        : scopePrefix + dt('帮我查看最新待处理的邮件并起草一封得体的回复草稿，先不要发送。', 'Check the latest email needing a reply and save a polite draft only.'),
    },
    {
      id: 'extract-asks',
      label: dt('提炼要点与待确认项', 'Extract key points & asks'),
      prompt: hasSelection
        ? dt('帮我提炼这封邮件的核心诉求、截止时间与待确认事项。', 'Extract the core requests, deadlines, and open questions from this mail.') + selectedContext
        : scopePrefix + dt('帮我梳理当前文件夹近期邮件的核心事项与截止时间。', 'Summarize key requests and deadlines from recent mail in this folder.'),
    },
  ];

  async function handleCopy(id, promptText) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopiedId('');
    setFailedId('');
    const ok = await writeClipboardText(promptText);
    let message = ok
      ? dt('已复制指令，粘贴到对话即可运行', 'Prompt copied — paste in Chat')
      : dt('复制失败，请检查剪贴板权限', 'Copy failed — check clipboard');
    if (message === lastAnnouncedRef.current) message += '\u00A0';
    lastAnnouncedRef.current = message;
    setCopiedId(ok ? id : '');
    setFailedId(ok ? '' : id);
    setAnnouncement(message);
    timerRef.current = setTimeout(() => {
      setCopiedId('');
      setFailedId('');
      setAnnouncement('');
    }, 2200);
  }

  return h('details', { className: mailCss.workflow },
    h('summary', { className: mailCss.workflowSummary },
      h(W.Icon, { name: 'sparkles', size: 14 }),
      h('span', { className: mailCss.workflowTitle }, dt('AI 邮件助手工作流与快捷指令', 'AI mail workflow & quick prompts')),
      h('span', { className: mailCss.workflowBadge, 'data-linked': hasSelection ? 'true' : undefined },
        hasSelection
          ? dt('已关联当前打开邮件', 'Linked to open message') + ' · ' + activeSubject
          : dt('点开一键复制对话指令', 'Expand for 1-click chat prompts'))),
    h('div', { className: mailCss.workflowBody },
      h('p', { className: mailCss.workflowSteps },
        dt('1. 连接账号 → 2. 筛选点开邮件 → 3. 复制下方指令发给助手 → 4. 在草稿页核对后发送', '1. Connect → 2. Filter mail → 3. Copy prompt → 4. Review & send')),
      h('div', { className: mailCss.workflowChips },
        chips.map(chip => h(W.Button, {
          key: chip.id,
          type: 'button',
          variant: 'outline',
          icon: copiedId === chip.id ? 'check' : 'copy',
          className: mailCss.workflowChip,
          'data-copied': copiedId === chip.id ? 'true' : undefined,
          'data-failed': failedId === chip.id ? 'true' : undefined,
          onClick: () => { void handleCopy(chip.id, chip.prompt); },
        }, chip.label)),
        h('span', {
          className: mailCss.workflowStatus,
          role: 'status',
          'aria-live': 'polite',
          'data-visible': announcement ? 'true' : undefined,
          'data-tone': failedId ? 'error' : undefined,
        }, announcement))));
}

const LETTER_DRAG_THRESHOLD = 90;

function prefersReducedMotion() {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function runViewTransition(update) {
  if (!prefersReducedMotion() && typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
    try {
      return document.startViewTransition(update);
    } catch {
      // Fall back cleanly when view transitions are unavailable or interrupted.
    }
  }
  update();
  return null;
}

function scheduleFocus(fn) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(fn);
  } else {
    fn();
  }
}

function protocolLabel(accountRow) {
  return accountRow?.incoming === 'agentmail' ? 'AgentMail' : accountRow?.incoming === 'pop3' ? 'POP3' : 'IMAP';
}

function senderInitials(from) {
  const raw = (contactDisplayName(from?.[0]) || from?.[0]?.name || from?.[0]?.address || '?').trim();
  if (!raw) return '?';
  const parts = raw.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2 && /^[A-Za-z0-9]/.test(parts[0]) && /^[A-Za-z0-9]/.test(parts[1])) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return Array.from(raw).slice(0, 2).join('').toUpperCase();
}

function formatLetterBytes(size) {
  const value = Number(size);
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value < 1024) return value + ' B';
  if (value < 1024 * 1024) return Math.max(1, Math.round(value / 1024)) + ' KiB';
  return (value / (1024 * 1024)).toFixed(1) + ' MiB';
}

function postmarkStamp(value) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return { monthDay: '--.--', year: '', full: value || dt('时间未知', 'Unknown date') };
  }
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return {
    monthDay: month + '.' + day,
    year: String(parsed.getFullYear()),
    full: formatDate(value),
  };
}

function letterSnippet(row, cached) {
  const raw = row?.preview || row?.snippet || row?.excerpt || cached?.text || row?.text || '';
  if (typeof raw !== 'string' || !raw.trim()) return '';
  const compact = raw.replace(/\s+/g, ' ').trim();
  return compact.length > 220 ? compact.slice(0, 220).trimEnd() + '…' : compact;
}

function isInteractiveTarget(target) {
  return Boolean(target?.closest?.('button, a, input, select, textarea, summary, [role="button"], [role="menuitem"], [data-no-drag]'));
}

function MailViewToggle({ viewMode, onChange, disabled }) {
  return h('div', {
    className: mailCss.viewToggle,
    role: 'group',
    'aria-label': dt('视图模式', 'View mode'),
    'data-email-view-toggle': 'true',
    'data-view-mode': viewMode,
    'data-no-drag': 'true',
  },
    h('button', {
      type: 'button',
      className: mailCss.viewToggleBtn,
      'aria-pressed': viewMode === 'desk',
      'data-view-option': 'desk',
      disabled,
      onClick: () => { if (viewMode !== 'desk') onChange('desk'); },
    }, h(W.Icon, { name: 'layers', size: 13 }), h('span', null, dt('信桌', 'Desk'))),
    h('button', {
      type: 'button',
      className: mailCss.viewToggleBtn,
      'aria-pressed': viewMode === '3pane',
      'data-view-option': '3pane',
      disabled,
      onClick: () => { if (viewMode !== '3pane') onChange('3pane'); },
    }, h(W.Icon, { name: 'columns', size: 13 }), h('span', null, dt('三栏', '3-Pane'))),
    h('button', {
      type: 'button',
      className: mailCss.viewToggleBtn,
      'aria-pressed': viewMode === 'list',
      'data-view-option': 'list',
      disabled,
      onClick: () => { if (viewMode !== 'list') onChange('list'); },
    }, h(W.Icon, { name: 'list', size: 13 }), h('span', null, dt('列表', 'List'))));
}

function MailDeskRibbon({
  accounts, account, activeAccount, folder, folders, folderName,
  busy, listLoading, foldersLoading, isPop3,
  input, query, unread, withAttachments, remainingCount, viewMode,
  onAccount, onFolder, onManageFolders, onInput, onSearch, onRefresh,
  onToggleUnread, onToggleAttachments, onClearSearch, onViewMode,
}) {
  const proto = protocolLabel(activeAccount);
  const orderedFolders = flattenFolderTree(buildFolderTree(folders));
  const folderIcon = folders.find(row => row.path === folder);
  const folderUnseen = Number.isSafeInteger(folderIcon?.unseen) && folderIcon.unseen > 0 ? folderIcon.unseen : 0;
  const folderGlyph = folderIcon?.specialUse === '\\Trash' ? 'trash'
    : folderIcon?.specialUse === '\\Sent' ? 'send'
    : folderIcon?.specialUse === '\\Inbox' || folder === 'INBOX' ? 'inbox' : 'folder';

  return h('div', { className: mailCss.deskRibbon, 'data-desk-ribbon': 'true', 'data-tour': 'mail-filter' },
    h('div', { className: mailCss.deskScope },
      h('div', { className: mailCss.deskPillWrap },
        h(W.ChoiceMenu, {
          className: mailCss.deskPillMenu,
          label: dt('邮箱账号', 'Account') + (activeAccount ? ' · ' + activeAccount.name : ''),
          value: account,
          disabled: busy,
          onChange: onAccount,
          items: accounts.map(row => ({ id: row.name, label: row.name + ' · ' + (row.user || protocolLabel(row)) })),
        }, activeAccount ? h('span', { className: mailCss.deskAccountPill },
          h(W.Icon, { name: 'mail', size: 13 }),
          h('span', { className: mailCss.deskPillText }, activeAccount.user || activeAccount.name),
          h('span', { className: mailCss.deskProtoTag }, proto)) : null)),
      h('div', { className: mailCss.deskPillWrap },
        h(W.ChoiceMenu, {
          className: mailCss.deskPillMenu,
          label: dt('文件夹', 'Folder') + (folderName ? ' · ' + folderName : ''),
          value: folder,
          disabled: busy || foldersLoading || folders.length === 0,
          onChange: onFolder,
          items: orderedFolders.map(({ row, depth, orphan }) => {
            const base = orphan ? row.path : folderLabel(row);
            const prefix = depth > 0 ? '\u00A0\u00A0'.repeat(depth) + '↳ ' : '';
            const count = Number.isSafeInteger(row.unseen) && row.unseen > 0 ? ' (' + (row.unseen > 999 ? '999+' : String(row.unseen)) + ')' : '';
            return { id: row.path, label: prefix + base + count };
          }),
        }, h('span', { className: mailCss.deskFolderPill },
          h(W.Icon, { name: folderGlyph, size: 13 }),
          h('span', { className: mailCss.deskPillText }, folderName || dt('收件箱', 'Inbox')),
          folderUnseen > 0 ? h('span', { className: mailCss.folderUnread, 'aria-hidden': 'true' }, folderUnseen > 999 ? '999+' : String(folderUnseen)) : null))),
      activeAccount?.incoming === 'imap'
        ? h(W.IconButton, { icon: 'plus', label: dt('管理文件夹', 'Manage folders'), disabled: busy || foldersLoading, onClick: onManageFolders })
        : null),
    h('div', { className: mailCss.deskSearchGroup },
      h('form', { className: mailCss.deskSearchForm, onSubmit: onSearch },
        h(W.Input, {
          icon: 'search',
          type: 'search',
          className: mailCss.deskSearchInput,
          'aria-label': dt('搜索当前文件夹', 'Search current folder'),
          placeholder: dt('搜索当前文件夹', 'Search current folder'),
          value: input,
          maxLength: 500,
          disabled: busy,
          onChange: event => onInput(event.target.value),
        }),
        h(W.IconButton, { icon: 'search', label: dt('搜索', 'Search'), type: 'submit', disabled: listLoading || busy || !folder }),
        h(W.IconButton, { icon: 'refresh', label: dt('刷新邮件', 'Refresh mail'), 'aria-busy': listLoading || undefined, disabled: listLoading || busy || !folder, onClick: onRefresh })),
      h('div', { className: mailCss.deskFilterPills },
        !isPop3 ? h(W.Button, {
          variant: unread ? 'primary' : 'outline',
          className: mailCss.deskFilterBtn,
          disabled: busy || !!query,
          'aria-pressed': unread,
          onClick: onToggleUnread,
        }, dt('只看未读', 'Unread only')) : null,
        h(W.Button, {
          variant: withAttachments ? 'primary' : 'outline',
          className: mailCss.deskFilterBtn,
          disabled: busy,
          'aria-pressed': withAttachments,
          onClick: onToggleAttachments,
        }, dt('本页有附件', 'With attachments')),
        query ? h(W.Button, {
          variant: 'ghost',
          className: mailCss.deskFilterBtn,
          disabled: busy,
          onClick: onClearSearch,
        }, dt('清除搜索', 'Clear search')) : null)),
    h('div', { className: mailCss.deskMetaGroup },
      h('span', {
        className: mailCss.deskCounter,
        'data-desk-counter': 'true',
        role: 'status',
      }, dt('待阅 ', '') + remainingCount + dt(' 封', ' to read')),
      h(MailViewToggle, { viewMode, onChange: onViewMode, disabled: busy })));
}

function MailLetterStackCard({ row, layer, who, dragProgress = 0, exiting = false }) {
  const subject = row.subject || dt('（无主题）', '(No subject)');
  const sender = senderLabelOf(row.from?.[0]) || who(row.from) || dt('未知发件人', 'Unknown sender');
  const initials = senderInitials(row.from);
  const stamp = postmarkStamp(row.date);
  let style;
  if (!exiting) {
    if (layer === 1) {
      const scale = (0.95 + dragProgress * 0.035).toFixed(3);
      const tilt = (2.2 - dragProgress * 1.4).toFixed(2);
      const ty = Math.round(16 - dragProgress * 8);
      const tx = Math.round(10 - dragProgress * 6);
      style = { transform: 'translate3d(' + tx + 'px, ' + ty + 'px, 0px) scale(' + scale + ') rotate(' + tilt + 'deg)' };
    } else if (layer === 2) {
      const scale = (0.90 + dragProgress * 0.03).toFixed(3);
      const tilt = (-2.6 + dragProgress * 0.6).toFixed(2);
      const ty = Math.round(28 - dragProgress * 6);
      style = { transform: 'translate3d(-12px, ' + ty + 'px, 0px) scale(' + scale + ') rotate(' + tilt + 'deg)' };
    }
  }
  return h('div', {
    className: clsx(mailCss.letterCardShell, exiting ? mailCss.letterCardExiting : mailCss.letterCardLayer),
    'data-letter-card': exiting ? 'exiting' : 'stack',
    'data-letter-layer': exiting ? 'exit' : String(layer),
    'data-letter-uid': String(row.uid),
    'aria-hidden': 'true',
    style,
  },
    h('div', { className: mailCss.letterPaper },
      h('div', { className: mailCss.letterTrim }),
      h('div', { className: mailCss.letterTopRow },
        h('div', { className: mailCss.letterSenderGroup },
          h('span', { className: mailCss.waxSeal }, initials),
          h('div', { className: mailCss.letterSenderInfo },
            h('strong', { className: mailCss.letterSenderName }, sender),
            h('span', { className: mailCss.letterSenderAddr }, who(row.from)))),
        h('span', { className: mailCss.postmark },
          h('strong', null, stamp.monthDay),
          stamp.year ? h('small', null, stamp.year) : null)),
      h('h2', { className: mailCss.letterSubject, 'data-dsh-serif': '' }, subject)));
}

function MailLetterCard({
  row, cached, account, activeAccount, folder, folderName, uidValidity,
  flipped, drag, busy, who, cardRef, pointerHandlers, onKeyDown,
  onToggleFlip, onUnfold, onQuickReply, onLoadHeaders, loadingHeaders,
}) {
  const subject = row.subject || dt('（无主题）', '(No subject)');
  const fromList = cached?.from || row.from;
  const fromFull = who(fromList) || dt('未知发件人', 'Unknown sender');
  const senderDisplay = senderLabelOf(fromList?.[0]) || fromFull;
  const toFull = who(cached?.to || row.to) || (activeAccount?.user ? activeAccount.user + ' (' + dt('当前账号', 'Current account') + ')' : account);
  const ccFull = who(cached?.cc || row.cc);
  const initials = senderInitials(fromList);
  const stamp = postmarkStamp(row.date);
  const proto = protocolLabel(activeAccount);
  const unseen = row.flagsSupported !== false && !row.seen;
  const sizeLabel = formatLetterBytes(row.size);
  const snippet = letterSnippet(row, cached);
  const attachments = cached?.attachments || row.attachments || [];
  const hasAttachments = attachments.length > 0 || Boolean(row.hasAttachments);
  const rawHeaders = typeof cached?.rawHeaders === 'string' && cached.rawHeaders ? cached.rawHeaders : '';
  const synthesizedHeaders = [
    ['From', fromFull],
    ['To', toFull],
    ['Cc', ccFull],
    ['Subject', row.subject || dt('（无主题）', '(No subject)')],
    ['Date', row.date || stamp.full],
    ['X-DSH-Account', account],
    ['X-DSH-Folder', folder],
    ['X-DSH-Protocol', proto],
    ['X-DSH-UID', String(row.uid) + (uidValidity ? ' (UIDVALIDITY ' + uidValidity + ')' : '')],
    ['X-DSH-Flags', row.flagsSupported === false ? 'unsupported (POP3)' : [row.seen ? 'Seen' : 'Unseen', row.flagged ? 'Flagged' : ''].filter(Boolean).join(', ')],
  ].filter(([, value]) => value).map(([k, v]) => k + ': ' + v).join('\n');
  const headerText = rawHeaders || synthesizedHeaders;

  const leftOpacity = drag.x < -14 ? Math.min(1, (-drag.x - 14) / (LETTER_DRAG_THRESHOLD - 14)) : 0;
  const rightOpacity = drag.x > 14 ? Math.min(1, (drag.x - 14) / (LETTER_DRAG_THRESHOLD - 14)) : 0;
  const rot = Math.max(-13, Math.min(13, drag.x * 0.055));
  const dragStyle = drag.active || drag.x !== 0 || drag.y !== 0
    ? { transform: 'translate3d(' + Math.round(drag.x) + 'px, ' + Math.round(drag.y * 0.16) + 'px, 0px) rotate(' + rot.toFixed(2) + 'deg)' }
    : undefined;

  return h('div', {
    ref: cardRef,
    tabIndex: 0,
    role: 'region',
    'aria-label': dt('当前书信卡片：', 'Current letter card: ') + subject,
    className: clsx(mailCss.letterCardShell, mailCss.letterCardActive),
    'data-letter-card': 'active',
    'data-tour': 'mail-letter-card',
    'data-letter-layer': '0',
    'data-letter-uid': String(row.uid),
    'data-flipped': flipped ? 'true' : 'false',
    'data-dragging': drag.active ? 'true' : 'false',
    'data-unread': unseen ? 'true' : 'false',
    style: dragStyle,
    onPointerDown: pointerHandlers.onPointerDown,
    onPointerMove: pointerHandlers.onPointerMove,
    onPointerUp: pointerHandlers.onPointerUp,
    onPointerCancel: pointerHandlers.onPointerCancel,
    onKeyDown,
  },
    h('div', {
      className: mailCss.dragStampLeft,
      'data-drag-stamp': 'left',
      'data-ready': drag.x <= -LETTER_DRAG_THRESHOLD ? 'true' : 'false',
      'aria-hidden': 'true',
      style: { opacity: leftOpacity },
    }, dt('← 跳过 / 下一封', '← Skip / Next')),
    h('div', {
      className: mailCss.dragStampRight,
      'data-drag-stamp': 'right',
      'data-ready': drag.x >= LETTER_DRAG_THRESHOLD ? 'true' : 'false',
      'aria-hidden': 'true',
      style: { opacity: rightOpacity },
    }, dt('→ 快捷回复 / 展开', '→ Quick Reply / Open')),
    h('div', { className: mailCss.letterFlipper, 'data-flipped': flipped ? 'true' : 'false' },
      h('article', {
        className: clsx(mailCss.letterPaper, mailCss.letterFaceFront),
        'data-letter-face': 'front',
        'aria-hidden': flipped ? 'true' : undefined,
      },
        h('div', { className: mailCss.letterTrim }),
        h('div', { className: mailCss.letterTopRow },
          h('div', { className: mailCss.letterSenderGroup },
            h('span', { className: mailCss.waxSeal, 'aria-hidden': 'true' }, initials),
            h('div', { className: mailCss.letterSenderInfo },
              h('div', { className: mailCss.letterSenderLine },
                unseen ? h('span', { className: mailCss.unreadDot, role: 'img', 'aria-label': dt('未读', 'Unread') }) : null,
                h('strong', { className: mailCss.letterSenderName, title: fromFull }, senderDisplay),
                row.flagged ? h(W.Icon, { name: 'star', size: 13, className: mailCss.letterStar }) : null),
              h('span', { className: mailCss.letterSenderAddr, title: fromFull }, fromFull))),
          h('div', { className: mailCss.postmark, title: stamp.full },
            h('span', { className: mailCss.postmarkTag }, proto),
            h('strong', null, stamp.monthDay),
            h('small', null, stamp.year || stamp.full))),
        h('div', { className: mailCss.letterBadgeRow },
          h('span', { className: mailCss.letterMetaChip, 'data-tone': unseen ? 'accent' : undefined },
            unseen ? dt('未读来信', 'Unread') : row.flagsSupported === false ? dt('POP3 来信', 'POP3 mail') : dt('已阅', 'Read')),
          h('span', { className: mailCss.letterMetaChip }, folderName),
          sizeLabel ? h('span', { className: mailCss.letterMetaChip }, sizeLabel) : null,
          h('time', { className: mailCss.letterFullDate, dateTime: row.date }, stamp.full)),
        h('h2', { className: mailCss.letterSubject, 'data-dsh-serif': '' }, subject),
        h('div', { className: mailCss.letterExcerptBox },
          snippet
            ? h('p', { className: mailCss.letterExcerpt }, snippet)
            : h('div', { className: mailCss.letterEnvelopeNote },
                h('p', null, dt('发件地址：', 'From: ') + fromFull),
                h('p', null, dt('投递箱：', 'Mailbox: ') + account + ' · ' + folderName + ' (' + proto + ')' + (sizeLabel ? ' · ' + sizeLabel : '')),
                h('p', { className: mailCss.letterExcerptHint }, dt('点击下方「展开信纸全文」或向右拖出即可阅读完整图文正文与附件。', 'Click "Unfold full letter" or drag right to read the full body & attachments.')))),
        hasAttachments ? h('div', { className: mailCss.letterAttachments, 'data-letter-attachments': 'true' },
          attachments.length > 0
            ? h(React.Fragment, null,
                attachments.slice(0, 3).map((file, idx) => h('span', { key: idx, className: mailCss.attachmentChip },
                  h(W.Icon, { name: 'clip', size: 12 }),
                  h('span', null, file.filename),
                  file.size ? h('small', null, formatLetterBytes(file.size)) : null)),
                attachments.length > 3 ? h('span', { className: mailCss.attachmentChip }, '+' + (attachments.length - 3)) : null)
            : h('span', { className: mailCss.attachmentChip },
                h(W.Icon, { name: 'clip', size: 12 }),
                h('span', null, dt('包含附件 · 展开信纸查看与下载', 'Has attachments · Unfold to download')))) : null,
        h('div', { className: mailCss.letterCardFoot },
          h('span', { className: mailCss.letterDragCue }, 'UID #' + row.uid + ' · ' + dt('← 左滑跳过 · 右滑展开 →', '← Drag left skip · Drag right open →')),
          h('button', {
            type: 'button',
            className: mailCss.inlineFlipBtn,
            'data-email-flip': 'true',
            'data-no-drag': 'true',
            'aria-pressed': flipped,
            disabled: busy,
            tabIndex: flipped ? -1 : 0,
            onClick: onToggleFlip,
          }, h(W.Icon, { name: 'flip', size: 13 }), h('span', null, dt('翻面看信封头', 'Envelope header'))))),
      h('section', {
        className: clsx(mailCss.letterPaper, mailCss.letterFaceBack),
        'data-letter-face': 'back',
        'aria-hidden': !flipped ? 'true' : undefined,
      },
        h('div', { className: mailCss.letterTrim }),
        h('div', { className: mailCss.letterBackHead },
          h('div', { className: mailCss.letterBackTitle },
            h('h3', { 'data-dsh-serif': '' }, dt('信封头与投递元数据', 'Envelope & Server Metadata')),
            h('span', { className: mailCss.deskProtoTag }, proto)),
          h('button', {
            type: 'button',
            className: mailCss.inlineFlipBtn,
            'data-email-flip': 'true',
            'data-no-drag': 'true',
            'aria-pressed': flipped,
            tabIndex: flipped ? 0 : -1,
            onClick: onToggleFlip,
          }, h(W.Icon, { name: 'flip', size: 13 }), h('span', null, dt('翻回信纸正面', 'Back to front')))),
        h('dl', { className: mailCss.envelopeMetaGrid },
          h('dt', null, dt('发件人 (From)', 'From')),
          h('dd', null, fromFull),
          h('dt', null, dt('收件人 (To)', 'To')),
          h('dd', null, toFull),
          ccFull ? h(React.Fragment, null, h('dt', null, dt('抄送 (Cc)', 'Cc')), h('dd', null, ccFull)) : null,
          h('dt', null, dt('时间 (Date)', 'Date')),
          h('dd', null, stamp.full + (row.date && row.date !== stamp.full ? ' (' + row.date + ')' : '')),
          h('dt', null, dt('编号与协议', 'UID & Protocol')),
          h('dd', null, 'UID ' + row.uid + (uidValidity ? ' · VALIDITY ' + uidValidity : '') + ' · ' + proto + ' · ' + account + ' / ' + folder),
          h('dt', null, dt('状态标记', 'Flags')),
          h('dd', null, row.flagsSupported === false
            ? dt('POP3 不提供服务器已读 / 星标标记', 'POP3 does not expose server read/star flags')
            : (row.seen ? dt('已读', 'Seen') : dt('未读', 'Unseen')) + (row.flagged ? ' · ★ ' + dt('已星标', 'Starred') : '')),
          h('dt', null, dt('体积与附件', 'Size & Attachments')),
          h('dd', null, (sizeLabel || dt('未知', 'Unknown')) + ' · ' + (attachments.length
            ? attachments.map(a => a.filename).join(', ')
            : hasAttachments ? dt('包含附件（展开信纸可下载）', 'Has attachments (unfold to download)') : dt('无附件', 'None')))),
        h('div', { className: mailCss.letterRawBlock, 'data-no-drag': 'true' },
          h('div', { className: mailCss.letterRawBar },
            h('span', null, rawHeaders ? dt('原始邮件头', 'Raw headers') : dt('信封与服务器字段', 'Envelope & server fields')),
            !cached && onLoadHeaders ? h(W.Button, {
              variant: 'ghost',
              className: mailCss.letterRawFetchBtn,
              disabled: busy || loadingHeaders,
              tabIndex: flipped ? 0 : -1,
              onClick: () => onLoadHeaders(row.uid),
            }, loadingHeaders ? dt('读取中…', 'Fetching…') : dt('读取完整信封头', 'Fetch full headers')) : null),
          h('pre', { className: mailCss.letterRawPre }, headerText)),
        h('div', { className: mailCss.letterBackFoot, 'data-no-drag': 'true' },
          h(W.Button, { variant: 'primary', icon: 'expand', disabled: busy, tabIndex: flipped ? 0 : -1, onClick: () => onUnfold(row) }, dt('展开信纸全文', 'Unfold full letter')),
          h(W.Button, { variant: 'outline', icon: 'reply', disabled: busy, tabIndex: flipped ? 0 : -1, onClick: () => onQuickReply(row) }, dt('回复到草稿', 'Reply in drafts'))))));
}

function MailStationerySheet({
  row, activePos, totalCount, folderName, account, folder, selected,
  detail, reading, readError, busy, run, who, canTrash,
  onFoldBack, onPrev, onNext, onRetryRead, onDraft, onTrash, onMark,
  sheetRef, sheetBackRef,
}) {
  return h('div', {
    ref: sheetRef,
    className: mailCss.stationeryStage,
    'data-letter-sheet': 'true',
    tabIndex: -1,
    onKeyDown: event => {
      if (event.key === 'Escape' && !event.isComposing) {
        event.preventDefault();
        onFoldBack();
      }
    },
  },
    h('div', { className: mailCss.stationerySheet },
      h('div', { className: mailCss.letterTrim }),
      h('div', { className: mailCss.stationeryBar },
        h('button', {
          ref: sheetBackRef,
          type: 'button',
          className: clsx('dsh-btn', uiCss.button, uiCss.outline, mailCss.foldBackBtn),
          'data-email-fold-back': 'true',
          disabled: busy,
          onClick: onFoldBack,
        }, h(W.Icon, { name: 'left', size: 14 }), h('span', null, dt('收拢回信桌', 'Fold back to desk'))),
        h('div', { className: mailCss.stationeryPos },
          h('span', { className: mailCss.letterMetaChip }, folderName),
          totalCount > 0 ? h('span', { className: mailCss.stationeryCount }, dt('第 ', 'Letter ') + (activePos + 1) + ' / ' + totalCount + dt(' 封', '')) : null),
        h('div', { className: mailCss.stationeryNav },
          h(W.IconButton, { icon: 'left', label: dt('上一封', 'Previous letter'), disabled: busy || activePos <= 0, onClick: onPrev }),
          h(W.IconButton, { icon: 'right', label: dt('下一封', 'Next letter'), disabled: busy || activePos < 0 || activePos >= totalCount - 1, onClick: onNext }))),
      h('div', { className: mailCss.stationeryBody, 'aria-busy': reading || undefined },
        reading && selected !== null
          ? h('div', { className: mailCss.readerSkeleton, role: 'status', 'aria-busy': 'true', 'aria-label': dt('正在读取正文…', 'Loading message…') },
              h(W.Skeleton, { variant: 'text', lines: 1, width: '62%', height: '22px' }),
              h(W.Skeleton, { variant: 'card' }),
              h(W.Skeleton, { variant: 'text', lines: 5 }))
          : readError && selected !== null
            ? h(W.Empty, {
                title: dt('这封邮件没有读出来', 'This message could not be loaded'),
                action: h(W.Button, { icon: 'refresh', disabled: busy, onClick: onRetryRead }, dt('重试', 'Retry')),
              }, readError)
            : detail
              ? h(MailMessage, {
                  key: JSON.stringify([account, folder, selected, detail.rich?.images?.[0]?.id]),
                  detail, currentRow: row, account, folder, selected, busy, run, who, date: formatDate, onDraft, canTrash, onTrash, onMark,
                })
              : null)));
}

function MailboxWorkbench({ active, onConfigure, onDraft, onAccountChange }) {
  const [viewMode, setViewMode] = useState('desk');
  const [deckIndex, setDeckIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [flyingOut, setFlyingOut] = useState(null);
  const [envelopeCache, setEnvelopeCache] = useState({});
  const [headersLoadingUid, setHeadersLoadingUid] = useState(null);
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
  const deskCardRef = useRef(null);
  const sheetRef = useRef(null);
  const sheetBackRef = useRef(null);
  const wasSheetOpenRef = useRef(false);
  const dragRef = useRef(null);
  const flyTimerRef = useRef(0);
  const activeAccount = accounts.find(row => row.name === account);
  const isPop3 = activeAccount?.incoming === 'pop3';
  const canTrash = activeAccount?.trashSupported === true;
  const railSplit = W.useResizableSplit({ key: 'dsh-email:rail-width', initial: 224, min: 168, max: 320 });
  const listSplit = W.useResizableSplit({ key: 'dsh-email:list-width', initial: 336, min: 256, max: 520 });
  // Address book names need to re-render the reader and the list once they land.
  useContactBook(active);

  __stardustUpdatesGuard(React, 'dsh-email.mailbox', { busy: !!trash || foldersOpen });
  __stardustUpdatesGuard(React, 'dsh-email.mailbox-operation', { busy });
  useEffect(() => () => { if (flyTimerRef.current) clearTimeout(flyTimerRef.current); }, []);
  useEffect(() => { setFoldersOpen(false); setMoved(null); setEnvelopeCache({}); }, [active, account]);
  useEffect(() => { onAccountChange?.(account); }, [account, onAccountChange]);
  useEffect(() => {
    setChecked([]);
    setTrash(null);
    setDeckIndex(0);
    setFlipped(false);
    setSheetOpen(false);
    setDrag({ x: 0, y: 0, active: false });
    dragRef.current = null;
  }, [active, account, folder, query, offset, scanOffset, unread, withAttachments, refresh]);
  useEffect(() => {
    if (viewMode !== '3pane' || selected === null || !readerBack.current?.getClientRects?.().length) return;
    readerBack.current.querySelector('button')?.focus({ preventScroll: true });
  }, [selected, viewMode]);
  useEffect(() => {
    if (viewMode !== 'desk') {
      wasSheetOpenRef.current = false;
      return;
    }
    if (sheetOpen && !wasSheetOpenRef.current) {
      wasSheetOpenRef.current = true;
      scheduleFocus(() => {
        (sheetBackRef.current || sheetRef.current)?.focus?.({ preventScroll: true });
      });
    } else if (!sheetOpen && wasSheetOpenRef.current) {
      wasSheetOpenRef.current = false;
      scheduleFocus(() => {
        deskCardRef.current?.focus?.({ preventScroll: true });
      });
    }
  }, [viewMode, sheetOpen]);
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
  }, [active, account]);

  useEffect(() => {
    if (!active || !account) { setFoldersLoading(false); return; }
    const ctrl = new AbortController();
    setFoldersLoading(true);
    mailboxApi("folders", { account, refresh: true }, ctrl.signal).then(value => {
      if (ctrl.signal.aborted) return;
      setFolders(value.folders);
      setFolder(old => value.folders.some(row => row.path === old) ? old :
        value.folders.find(row => row.specialUse === '\\Inbox')?.path ||
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
      .then(value => {
        if (ctrl.signal.aborted) return;
        setResult(value);
        // The server harvests senders from this page; pull the names it learned so
        // addresses that carry no display name render as people too.
        requestContactRefresh();
      })
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
      .then(value => {
        if (ctrl.signal.aborted) return;
        setDetail(value);
        setEnvelopeCache(old => ({ ...old, [account + '\0' + folder + '\0' + selected]: value }));
        // 打开即已读：后端确实改了服务器状态才把这一行的未读点点掉，否则列表会
        // 一直说这封还没读，而邮箱里已经读过了。
        if (value && value.markedRead === true) {
          const uid = selected;
          adjustUnread(folder, -1);
          setResult(old => old && {
            ...old,
            messages: old.messages.map(row => row.uid === uid ? { ...row, seen: true } : row),
          });
        }
        // Reading also teaches the address book the whole conversation, so pull
        // the resolved names for the sender and recipient lines behind it.
        requestContactRefresh();
      })
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

  function adjustUnread(path, delta) {
    if (!path || !delta) return;
    setFolders(rows => rows.map(row => row.path === path && typeof row.unseen === 'number'
      ? { ...row, unseen: Math.max(0, row.unseen + delta) }
      : row));
  }

  const retry = () => { setAccountReload(n => n + 1); setRefresh(n => n + 1); setReadToken(n => n + 1); };
  function refreshMailbox() {
    setFolderReload(n => n + 1);
    setRefresh(n => n + 1);
  }
  function reset() {
    setChecked([]);
    setOffset(0);
    setScanOffset(0);
    setSelected(null);
    setDetail(null);
    setReadError("");
    setDeckIndex(0);
    setFlipped(false);
    setSheetOpen(false);
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
        setSheetOpen(false);
        setOffset(0);
        refreshMailbox();
      }
    }
  });
  const undoTrash = () => run(async valid => {
    const operation = moved;
    setMoved(null);
    try {
      await mailboxApi('undoTrash', { account: operation.account, folder: operation.target, receipt: operation.undo, confirmed: true });
    } finally {
      if (valid()) { setOffset(0); refreshMailbox(); }
    }
  });

  const who = list => formatAddressList(list);
  const rows = result?.messages || [];
  const visibleRows = withAttachments ? rows.filter(row => row.hasAttachments) : rows;
  const currentRow = rows.find(row => row.uid === selected);
  const hasMore = result?.hasMore ?? (result?.bodyScan ? rows.length === 20 : offset + rows.length < (result?.count || 0));
  const listLoading = loading || foldersLoading;
  const pageLimit = 20;
  const currentFolderRow = folders.find(row => row.path === folder);
  const activeFolderName = currentFolderRow ? folderLabel(currentFolderRow) : (folder || dt('收件箱', 'Inbox'));
  const safeDeckIndex = visibleRows.length === 0 ? 0 : Math.min(deckIndex, visibleRows.length);
  const activeDeskRow = visibleRows[safeDeckIndex] || null;
  const remainingCount = Math.max(0, visibleRows.length - safeDeckIndex);
  const activeDeskCacheKey = activeDeskRow ? account + '\0' + folder + '\0' + activeDeskRow.uid : '';
  const activeDeskCached = activeDeskCacheKey ? envelopeCache[activeDeskCacheKey] || (selected === activeDeskRow?.uid ? detail : null) : null;

  function switchViewMode(nextMode) {
    if (nextMode === viewMode) return;
    runViewTransition(() => {
      setFlipped(false);
      setDrag({ x: 0, y: 0, active: false });
      dragRef.current = null;
      if (nextMode === 'desk' && selected !== null) {
        const idx = visibleRows.findIndex(row => row.uid === selected);
        if (idx >= 0) setDeckIndex(idx);
      }
      setSheetOpen(false);
      setViewMode(nextMode);
    });
  }

  function unfoldLetter(row) {
    if (!row) return;
    runViewTransition(() => {
      setFlipped(false);
      setDrag({ x: 0, y: 0, active: false });
      dragRef.current = null;
      if (selected !== row.uid) {
        setDetail(null);
        setReadError("");
        setReading(true);
        setSelected(row.uid);
      } else if (!detail && !reading) {
        setReadToken(n => n + 1);
      }
      setSheetOpen(true);
    });
  }

  function foldBackToDesk() {
    runViewTransition(() => {
      setSheetOpen(false);
    });
  }

  function skipCard() {
    if (!activeDeskRow) return;
    const leaving = activeDeskRow;
    setFlipped(false);
    setDrag({ x: 0, y: 0, active: false });
    dragRef.current = null;
    if (!prefersReducedMotion()) {
      if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
      setFlyingOut({ key: String(leaving.uid) + '-' + Date.now(), row: leaving });
      flyTimerRef.current = setTimeout(() => { setFlyingOut(null); }, 220);
    }
    setDeckIndex(i => Math.min(visibleRows.length, i + 1));
  }

  function prevCard() {
    if (safeDeckIndex <= 0) return;
    setFlipped(false);
    setDrag({ x: 0, y: 0, active: false });
    dragRef.current = null;
    setDeckIndex(i => Math.max(0, Math.min(visibleRows.length, i) - 1));
  }

  function stepSheet(delta) {
    const nextIdx = Math.max(0, Math.min(visibleRows.length - 1, safeDeckIndex + delta));
    const nextRow = visibleRows[nextIdx];
    if (!nextRow || nextIdx === safeDeckIndex) return;
    setDeckIndex(nextIdx);
    setFlipped(false);
    setDetail(null);
    setReadError("");
    setReading(true);
    setSelected(nextRow.uid);
  }

  function applyMarkState(uid, value) {
    if (value === 'read' || value === 'unread') adjustUnread(folder, value === 'read' ? -1 : 1);
    setResult(old => old && {
      ...old,
      messages: old.messages.map(m => m.uid === uid
        ? { ...m, ...(value === 'read' || value === 'unread' ? { seen: value === 'read' } : { flagged: value === 'star' }) }
        : m),
    });
  }

  function markMessage(uid, value) {
    return run(async valid => {
      await mailboxApi('mark', { account, folder, uid, mark: value });
      if (valid()) applyMarkState(uid, value);
    });
  }

  function quickReply(row, replyAll = false) {
    if (!row) return;
    return run(async valid => {
      const draft = await mailboxApi('replyDraft', { account, folder, uid: row.uid, replyAll });
      if (valid()) onDraft(draft.id);
    });
  }

  async function loadEnvelopeHeaders(uid) {
    if (!account || !folder || headersLoadingUid === uid) return;
    const key = account + '\0' + folder + '\0' + uid;
    if (envelopeCache[key]) return;
    const generation = context.current;
    setHeadersLoadingUid(uid);
    try {
      const value = await mailboxApi('read', { account, folder, uid });
      if (generation === context.current) {
        setEnvelopeCache(old => ({ ...old, [key]: value }));
        if (value && value.markedRead === true) {
          adjustUnread(folder, -1);
          setResult(old => old && {
            ...old,
            messages: old.messages.map(row => row.uid === uid ? { ...row, seen: true } : row),
          });
        }
        requestContactRefresh();
      }
    } catch {
      // Back-face metadata already shows full list envelope; keep silent on optional header fetch error.
    } finally {
      setHeadersLoadingUid(current => current === uid ? null : current);
    }
  }

  const deskPointerHandlers = {
    onPointerDown(event) {
      if (busy || flipped || !activeDeskRow) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;
      try { event.currentTarget?.setPointerCapture?.(event.pointerId); } catch { /* ignore */ }
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dx: 0,
        dy: 0,
        active: true,
      };
      setDrag({ x: 0, y: 0, active: true });
    },
    onPointerMove(event) {
      const state = dragRef.current;
      if (!state || !state.active) return;
      if (state.pointerId !== undefined && event.pointerId !== undefined && state.pointerId !== event.pointerId) return;
      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      state.dx = dx;
      state.dy = dy;
      setDrag({ x: dx, y: dy, active: true });
    },
    onPointerUp(event) {
      const state = dragRef.current;
      if (!state || !state.active) return;
      if (state.pointerId !== undefined && event?.pointerId !== undefined && state.pointerId !== event.pointerId) return;
      try { event?.currentTarget?.releasePointerCapture?.(event.pointerId); } catch { /* ignore */ }
      const dx = typeof event?.clientX === 'number' ? event.clientX - state.startX : state.dx;
      dragRef.current = null;
      setDrag({ x: 0, y: 0, active: false });
      if (!activeDeskRow) return;
      if (dx <= -LETTER_DRAG_THRESHOLD) {
        skipCard();
      } else if (dx >= LETTER_DRAG_THRESHOLD) {
        if (event?.shiftKey) {
          void quickReply(activeDeskRow, false);
        } else {
          unfoldLetter(activeDeskRow);
        }
      }
    },
    onPointerCancel(event) {
      const state = dragRef.current;
      if (!state || !state.active) return;
      try { event?.currentTarget?.releasePointerCapture?.(event.pointerId); } catch { /* ignore */ }
      dragRef.current = null;
      setDrag({ x: 0, y: 0, active: false });
    },
  };

  function onDeskCardKeyDown(event) {
    if (event.isComposing || event.nativeEvent?.isComposing || !activeDeskRow) return;
    if (isInteractiveTarget(event.target) && event.target !== event.currentTarget) return;
    if (event.key === ' ' || event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      setFlipped(value => !value);
    } else if (event.key === 'Enter' || event.key === 'ArrowRight') {
      event.preventDefault();
      unfoldLetter(activeDeskRow);
    } else if (event.key === 'ArrowLeft' || event.key === 'j' || event.key === 'J') {
      event.preventDefault();
      skipCard();
    } else if (event.key === 'k' || event.key === 'K') {
      event.preventDefault();
      prevCard();
    } else if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      void quickReply(activeDeskRow, false);
    }
  }

  const errorBanner = h(W.Status,{tone:'error'},error ? h(React.Fragment, null, error,
    h('div', { className: uiCss.actions },
      h(W.Button, { icon: 'refresh', variant: 'primary', disabled: busy || accountsLoading, onClick:retry }, dt('重试','Retry')),
      h(W.Button, { variant: 'ghost', onClick: onConfigure }, dt('检查账号设置','Check account settings')))) : null);

  if (accountsLoading || !accounts.length) {
    return h('section', { className: mailCss.mailbox, 'aria-label': dt('邮箱工作台','Mailbox workbench') },
      h('div', { className: mailCss.alert, hidden: !error }, errorBanner),
      accountsLoading ? h('div', { className: mailCss.skeletonWrap, role: 'status', 'aria-busy': 'true', 'aria-label': dt('正在读取邮箱账号…','Loading accounts…') },
        h(W.Skeleton, { variant: 'card' }),
        h(W.Skeleton, { variant: 'row' }),
        h(W.Skeleton, { variant: 'row' }),
        h(W.Skeleton, { variant: 'row' })) :
        h(W.Empty, { title: error ? dt('暂时无法读取邮箱','Mailbox unavailable') : dt('连接你的邮箱','Connect your mailbox'),
          action: h(W.Button, { variant: 'primary', onClick: onConfigure }, dt('邮箱设置','Account settings')),
        }, dt('添加并测试邮箱账号后，即可在这里阅读和回复邮件。','Add and test an email account to read and reply here.')));
  }

  const submitSearch = event => {
    event.preventDefault();
    if (!folder || busy || listLoading) return;
    reset();
    setUnread(false);
    setQuery(input.trim());
    setRefresh(n => n + 1);
  };
  const dragProgress = Math.min(1, Math.abs(drag.x) / 110);
  const stackTail = visibleRows.slice(safeDeckIndex + 1, safeDeckIndex + 3);
  const deskProtocolNote = isPop3
    ? dt('POP3 收件箱 · 不提供服务器已读、星标或已发送文件夹。回复会进入本地草稿，确认后通过 SMTP 发送。', 'POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.')
    : !canTrash
      ? dt('此协议暂不支持移入废纸篓，请使用邮箱原生客户端删除。', 'Trash is unavailable for this protocol; delete in your mail client.')
      : '';

  const deskView = h('div', {
    className: mailCss.letterDesk,
    'data-email-desk': 'true',
    'data-sheet-open': sheetOpen ? 'true' : 'false',
  },
    h(MailDeskRibbon, {
      accounts, account, activeAccount, folder, folders, folderName: activeFolderName,
      busy, listLoading, foldersLoading, isPop3,
      input, query, unread, withAttachments, remainingCount, viewMode,
      onAccount: changeAccount,
      onFolder: changeFolder,
      onManageFolders: () => setFoldersOpen(true),
      onInput: setInput,
      onSearch: submitSearch,
      onRefresh: refreshMailbox,
      onToggleUnread: () => { reset(); setUnread(value => !value); },
      onToggleAttachments: () => { setChecked([]); setWithAttachments(value => !value); },
      onClearSearch: () => { reset(); setInput(''); setQuery(''); },
      onViewMode: switchViewMode,
    }),
    sheetOpen && selected !== null
      ? h(MailStationerySheet, {
          row: currentRow || activeDeskRow,
          activePos: safeDeckIndex < visibleRows.length ? safeDeckIndex : Math.max(0, visibleRows.findIndex(r => r.uid === selected)),
          totalCount: visibleRows.length,
          folderName: activeFolderName,
          account, folder, selected,
          detail, reading, readError, busy, run, who, canTrash,
          onFoldBack: foldBackToDesk,
          onPrev: () => stepSheet(-1),
          onNext: () => stepSheet(1),
          onRetryRead: () => setReadToken(n => n + 1),
          onDraft,
          onTrash: requestTrash,
          onMark: value => applyMarkState(selected, value),
          sheetRef,
          sheetBackRef,
        })
      : h('div', { className: mailCss.deskMain, 'aria-busy': listLoading || undefined },
          h('div', { className: mailCss.deskStage, 'data-tour': 'mail-desk-stage' },
            listLoading && !(error && !result)
              ? h('div', { className: mailCss.deskSkeletonCard, role: 'status', 'aria-busy': 'true', 'aria-label': dt('正在读取邮件…', 'Loading messages…') },
                  h(W.Skeleton, { variant: 'text', lines: 1, width: '48%', height: '16px' }),
                  h(W.Skeleton, { variant: 'text', lines: 1, width: '76%', height: '24px' }),
                  h(W.Skeleton, { variant: 'card' }),
                  h(W.Skeleton, { variant: 'text', lines: 2 }))
              : visibleRows.length === 0
                ? h('div', { className: mailCss.deskEmptyCard, 'data-dsh-card': '' },
                    h(W.Empty, {
                      title: error && !result ? dt('邮件列表没有读出来', 'Messages could not be loaded')
                        : rows.length && withAttachments ? dt('本页没有附件邮件', 'No messages with attachments on this page')
                        : query ? dt('当前检索范围内没有结果。', 'No results in the current search window.')
                        : dt('当前页没有邮件。', 'No messages on this page.'),
                      action: error && !result
                        ? h(W.Button, { icon: 'refresh', disabled: busy || listLoading, onClick: retry }, dt('重试', 'Retry'))
                        : (withAttachments || query || unread)
                          ? h(W.Button, { variant: 'outline', disabled: busy, onClick: () => { reset(); setInput(''); setQuery(''); setUnread(false); setWithAttachments(false); } }, dt('清除筛选', 'Clear filters'))
                          : h(W.Button, { icon: 'refresh', variant: 'outline', disabled: busy || listLoading, onClick: refreshMailbox }, dt('刷新收件箱', 'Refresh mailbox')),
                    }))
                : !activeDeskRow
                  ? h('div', { className: mailCss.deskCompleteCard, 'data-dsh-card': '', 'data-desk-complete': 'true' },
                      h('div', { className: mailCss.letterTrim }),
                      h(W.Empty, {
                        icon: 'check',
                        title: dt('本页书信已分拣完毕', 'All letters on this page reviewed'),
                        action: h(React.Fragment, null,
                          h(W.Button, { variant: 'primary', icon: 'left', disabled: busy, onClick: () => { setDeckIndex(0); setFlipped(false); } }, dt('从第一封重新浏览', 'Review from first')),
                          hasMore ? h(W.Button, { variant: 'outline', icon: 'right', disabled: loading || busy, onClick: () => setOffset(n => n + pageLimit) }, dt('加载下一页书信', 'Load next page')) : null,
                          h(W.Button, { variant: 'ghost', icon: 'refresh', disabled: loading || busy, onClick: refreshMailbox }, dt('刷新', 'Refresh'))),
                      }, dt('已整理本页 ', 'Reviewed ') + visibleRows.length + dt(' 封书信。可重看、翻页或切换到三栏总览。', ' letters on this page. Revisit, paginate, or switch to 3-Pane.')))
                  : h('div', { className: mailCss.letterStack, 'data-letter-stack': 'true' },
                      stackTail.slice().reverse().map((row, revIdx) => {
                        const layer = stackTail.length - revIdx;
                        return h(MailLetterStackCard, { key: row.uid, row, layer, who, dragProgress });
                      }),
                      h(MailLetterCard, {
                        key: activeDeskRow.uid,
                        row: activeDeskRow,
                        cached: activeDeskCached,
                        account, activeAccount, folder, folderName: activeFolderName,
                        uidValidity: result?.uidValidity,
                        flipped, drag, busy, who,
                        cardRef: deskCardRef,
                        pointerHandlers: deskPointerHandlers,
                        onKeyDown: onDeskCardKeyDown,
                        onToggleFlip: () => setFlipped(value => !value),
                        onUnfold: unfoldLetter,
                        onQuickReply: row => void quickReply(row, false),
                        onLoadHeaders: loadEnvelopeHeaders,
                        loadingHeaders: headersLoadingUid === activeDeskRow.uid,
                      }),
                      flyingOut ? h(MailLetterStackCard, { key: flyingOut.key, row: flyingOut.row, layer: 0, who, exiting: true }) : null)),
          activeDeskRow ? h('div', { className: mailCss.deskDock, role: 'toolbar', 'aria-label': dt('书信操作栏', 'Letter actions'), 'data-desk-dock': 'true' },
            h(W.IconButton, { icon: 'left', label: dt('上一封', 'Previous letter'), disabled: busy || safeDeckIndex === 0, onClick: prevCard }),
            h(W.Button, { variant: 'outline', disabled: busy, 'data-desk-action': 'skip', onClick: skipCard }, dt('← 下一封 / 跳过', '← Next / Skip')),
            h(W.Button, { variant: 'outline', icon: 'flip', disabled: busy, 'data-email-flip': 'true', 'aria-pressed': flipped, onClick: () => setFlipped(value => !value) }, flipped ? dt('翻回正面', 'Front face') : dt('翻面看信封头', 'Flip header')),
            h(W.Button, { variant: 'primary', icon: 'expand', disabled: busy, 'data-email-unfold': 'true', onClick: () => unfoldLetter(activeDeskRow) }, dt('展开信纸全文', 'Unfold full letter')),
            h(W.Button, { variant: 'outline', icon: 'reply', disabled: busy, 'data-desk-action': 'reply', onClick: () => { void quickReply(activeDeskRow, false); } }, dt('回复到草稿', 'Reply in drafts')),
            activeDeskRow.flagsSupported !== false ? h(React.Fragment, null,
              h(W.IconButton, {
                icon: 'mail',
                disabled: busy,
                label: activeDeskRow.seen ? dt('标记未读', 'Mark unread') : dt('标记已读', 'Mark read'),
                onClick: () => { void markMessage(activeDeskRow.uid, activeDeskRow.seen ? 'unread' : 'read'); },
              }),
              h(W.IconButton, {
                icon: 'star',
                disabled: busy,
                'aria-pressed': !!activeDeskRow.flagged,
                label: activeDeskRow.flagged ? dt('取消星标', 'Unstar') : dt('添加星标', 'Star'),
                onClick: () => { void markMessage(activeDeskRow.uid, activeDeskRow.flagged ? 'unstar' : 'star'); },
              })) : null,
            canTrash ? h(W.IconButton, {
              icon: 'trash',
              variant: 'danger',
              disabled: busy,
              label: dt('移入废纸篓', 'Move to Trash'),
              onClick: () => requestTrash([activeDeskRow.uid]),
            }) : null) : null,
          h('footer', { className: mailCss.deskFooter },
            h('div', { className: mailCss.deskFooterLeft },
              h('span', { className: mailCss.listNote, role: 'status' },
                result ? (visibleRows.length
                  ? dt('第 ', '') + Math.min(safeDeckIndex + 1, visibleRows.length) + ' / ' + visibleRows.length + dt(' 封 · ', ' · ')
                  : '') + dt('第 ', 'Page ') + (Math.floor(offset / pageLimit) + 1) + dt(' 页', '') +
                  (result.order === 'relevance' ? dt(' · 按相关性排序', ' · Ranked by relevance') : '') : null),
              deskProtocolNote ? h('span', { className: mailCss.listNote }, deskProtocolNote) : null,
              result?.headerScan ? h('span', { className: mailCss.listNote }, dt('信封实际扫描：', 'Headers scanned: ') + result.headerScan.scanned + ' / ' + result.headerScan.mailboxTotal) : null),
            h('div', { className: mailCss.deskFooterPages },
              offset > 0 || hasMore ? h(React.Fragment, null,
                h(W.Button, { variant: 'ghost', icon: 'left', disabled: loading || busy || offset === 0, onClick: () => setOffset(n => Math.max(0, n - pageLimit)) }, dt('上一页', 'Previous page')),
                h(W.Button, { variant: 'ghost', icon: 'right', disabled: loading || busy || !hasMore, onClick: () => setOffset(n => n + pageLimit) }, dt('下一页', 'Next page'))) : null,
              result?.headerScan?.nextScanOffset !== undefined
                ? h(W.Button, { variant: 'ghost', icon: 'search', disabled: loading || busy, onClick: () => { setOffset(0); setScanOffset(result.headerScan.nextScanOffset); } }, dt('继续搜索更早邮件', 'Search older headers'))
                : null))));

  const threePaneView = h('div', {
    className: mailCss.columns,
    'data-reading': selected !== null,
    'data-view': viewMode,
    style: { '--mail-rail-width': railSplit.size + 'px', '--mail-list-width': listSplit.size + 'px' },
  },
    h(MailFolderRail, { accounts, account, folder, folders, busy, loading: foldersLoading,
      onAccount: changeAccount, onFolder: changeFolder, onManage: () => setFoldersOpen(true) }),
    h(W.SplitResizer, { ...railSplit.resizerProps, label: dt('调整文件夹栏宽度', 'Resize folders pane') }),
    h('section', { className: mailCss.list, 'aria-label': dt('邮件列表', 'Message list'), 'aria-busy': listLoading || undefined },
      h('div', { className: mailCss.listHeader, 'data-tour': 'mail-filter' },
        h('div', { className: mailCss.listModeRow },
          h('span', { className: mailCss.listFolderTitle }, activeFolderName,
            h('span', { className: mailCss.listFolderCount }, dt(' · 待阅 ', ' · ') + visibleRows.length + dt(' 封', ''))),
          h(MailViewToggle, { viewMode, onChange: switchViewMode, disabled: busy })),
        h('form', { className: mailCss.search, onSubmit: submitSearch },
          h(W.Input, { icon: 'search', type: 'search', 'aria-label': dt('搜索当前文件夹','Search current folder'), placeholder: dt('搜索当前文件夹','Search current folder'), value: input, maxLength: 500, disabled: busy, onChange: event => setInput(event.target.value) }),
          h(W.IconButton, { icon: 'search', label: dt('搜索','Search'), type: 'submit', disabled: listLoading || busy || !folder }),
          h(W.IconButton, { icon: 'refresh', label: dt('刷新邮件','Refresh mail'), 'aria-busy': listLoading || undefined, disabled: listLoading || busy || !folder, onClick: refreshMailbox })),
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
          const isSelected = selected === row.uid;
          const compact = viewMode === 'list';
          return h('div', { key: row.uid, className: mailCss.messageRow, 'data-dsh-row': '', 'data-selected': isSelected, 'data-active': isSelected ? 'true' : 'false', 'data-unread': unseen },
            canTrash ? h(W.Checkbox, { hiddenLabel: true, label: dt('选择邮件：', 'Select message: ') + subject,
              checked: checked.includes(row.uid), disabled: busy || listLoading,
              onChange: value => setChecked(old => value ? [...old, row.uid] : old.filter(uid => uid !== row.uid)) }) : null,
            h('span', { className: 'dsh-pixel-cursor', 'aria-hidden': 'true' }, '▶'),
            h(W.Button, { variant: 'ghost', className: clsx(mailCss.messageButton, compact && mailCss.messageButtonCompact), disabled: busy, 'aria-pressed': isSelected,
              onClick: event => openMessage(row.uid, event.currentTarget) },
              compact
                ? h('span', { className: clsx(mailCss.messageLine, mailCss.compactLine) },
                    unseen ? h('span', { className: mailCss.unreadDot, role: 'img', 'aria-label': dt('未读','Unread') }) : null,
                    row.flagged ? h(W.Icon, { name: 'star', size: 13 }) : null,
                    h('strong', { className: clsx(mailCss.sender, mailCss.compactSender), title: from }, senderLabelOf(row.from?.[0]) || from),
                    h('span', { className: clsx(mailCss.subject, mailCss.compactSubject), title: subject }, subject),
                    row.hasAttachments ? h(W.Icon, { name: 'clip', size: 13, role: 'img', 'aria-hidden': undefined, 'aria-label': dt('附件', 'Attachments') }) : null,
                    h('time', { className: mailCss.timestamp, dateTime: row.date }, formatDate(row.date)))
                : h(React.Fragment, null,
                    h('span', { className: mailCss.messageLine },
                      unseen ? h('span', { className: mailCss.unreadDot, role: 'img', 'aria-label': dt('未读','Unread') }) : null,
                      h('strong', { className: mailCss.sender, title: from }, senderLabelOf(row.from?.[0]) || from),
                      row.flagged ? h(W.Icon, { name: 'star', size: 13 }) : null,
                      h('time', { className: mailCss.timestamp, dateTime: row.date }, formatDate(row.date))),
                    h('span', { className: mailCss.messageLine }, h('span', { className: mailCss.subject, title: subject }, subject),
                      row.hasAttachments ? h(W.Icon, { name: 'clip', size: 13, role: 'img', 'aria-hidden': undefined, 'aria-label': dt('附件', 'Attachments') }) : null))),
            h('div', { className: clsx('dsh-row-actions', mailCss.rowActions) },
              row.flagsSupported !== false ? h(React.Fragment, null,
                h(W.IconButton, {
                  icon: 'mail',
                  disabled: busy,
                  label: row.seen ? dt('标记未读', 'Mark unread') : dt('标记已读', 'Mark read'),
                  onClick: () => { void markMessage(row.uid, row.seen ? 'unread' : 'read'); },
                }),
                h(W.IconButton, {
                  icon: 'star',
                  disabled: busy,
                  'aria-pressed': !!row.flagged,
                  label: row.flagged ? dt('取消星标', 'Unstar') : dt('添加星标', 'Star'),
                  onClick: () => { void markMessage(row.uid, row.flagged ? 'unstar' : 'star'); },
                })) : null,
              h(W.IconButton, {
                icon: 'reply',
                disabled: busy,
                label: dt('回复到草稿', 'Reply in drafts'),
                onClick: () => { void quickReply(row, false); },
              }),
              canTrash ? h(W.IconButton, {
                icon: 'trash',
                variant: 'danger',
                disabled: busy,
                label: dt('移入废纸篓', 'Move to Trash'),
                onClick: () => requestTrash([row.uid]),
              }) : null));
        }) : listLoading && !(error && !result)
          ? h('div', { className: mailCss.skeletonList, role: 'status', 'aria-busy': 'true', 'aria-label': dt('正在读取邮件…','Loading messages…') },
              Array.from({ length: 5 }, (_, idx) => h(W.Skeleton, { key: idx, variant: 'row' })))
          : h(W.Empty, {
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
    h(W.SplitResizer, { ...listSplit.resizerProps, className: mailCss.listSplit, label: dt('调整邮件列表宽度', 'Resize message list pane') }),
    h('section', { className: mailCss.reader, 'aria-label': dt('邮件详情', 'Message details'), 'aria-busy': reading || undefined },
      selected !== null ? h('div', { className: mailCss.readerBack, ref: readerBack },
        h(W.Button, { variant: 'ghost', icon: 'left', disabled: busy, onClick: backToList }, dt('返回邮件列表','Back to messages'))) : null,
      reading && selected !== null ? h('div', { className: mailCss.readerSkeleton, role: 'status', 'aria-busy': 'true', 'aria-label': dt('正在读取正文…','Loading message…') },
        h(W.Skeleton, { variant: 'text', lines: 1, width: '62%', height: '22px' }),
        h(W.Skeleton, { variant: 'card' }),
        h(W.Skeleton, { variant: 'text', lines: 5 })) :
        readError && selected !== null ? h(W.Empty, { title:dt('这封邮件没有读出来','This message could not be loaded'),
          action: h(W.Button, { icon: 'refresh', disabled: busy, onClick: () => setReadToken(n => n + 1) }, dt('重试','Retry')),
        }, readError) : detail ? h(MailMessage, {
          key: JSON.stringify([account, folder, selected, detail.rich?.images?.[0]?.id]),
          detail, currentRow, account, folder, selected, busy, run, who, date: formatDate, onDraft, canTrash, onTrash: requestTrash,
          onMark: value => applyMarkState(selected, value),
        }) : h(W.Empty, { title: dt('选择一封邮件','Select a message') }, dt('打开正文后，可以回复到草稿、标记状态或下载附件。','Open a message to reply in drafts, mark its state or download attachments.'))));

  return h('section', { className: mailCss.mailbox, 'aria-label': dt('邮箱工作台','Mailbox workbench'), 'data-email-view': viewMode },
    error ? h('div', { className: mailCss.alert }, errorBanner) : null,
    moved ? h('div', { className: mailCss.moveNotice, role: 'status', 'data-window-drag-exclude': '' },
      h('span', null, dt('已移动 ', 'Moved ') + moved.count + dt(' 封至 ', ' messages to ') + moved.target,
        !moved.undo ? h('p', { className: mailCss.listNote }, dt('如需恢复，请在邮箱客户端移回原文件夹。', 'To restore, move the messages back in your mail client.')) : null),
      moved.undo ? h(W.Button, { disabled: busy, onClick: undoTrash }, dt('撤销移动', 'Undo move')) : null,
      h(W.IconButton, { icon: 'close', onClick: () => setMoved(null), label: dt('关闭提示', 'Dismiss') })) : null,
    viewMode === 'desk' ? deskView : threePaneView,
    trash ? h(MailTrashDialog, { account, folder, uids: trash, uidValidity: result?.uidValidity, folders, busy, onClose: () => setTrash(null), onConfirm: confirmTrash }) : null,
    foldersOpen ? h(MailFoldersDialog, { account, folders, busy, onClose: () => setFoldersOpen(false), onChanged: () => setFolderReload(n => n + 1) }) : null);
}
