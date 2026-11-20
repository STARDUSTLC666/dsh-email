// Generated: shared optional update controls; edit the original client templates.
(function(){
/* DSH workbench UI v1. MIT. Canonical source: dsh-suite/ui/workbench-ui.js.
 * Vendored into each plugin: no Suite or extra runtime dependency is required.
 * Styles are scoped to .dshw and never replace the host chrome or theme.
 */
function createWorkbenchUI(React) {
  const h = React.createElement;
  const { useEffect, useId, useRef } = React;
  const cx = (...values) => values.filter(Boolean).join(' ');
  const paths = {
    book: ['M4 4h6a3 3 0 0 1 2 2v15a4 4 0 0 0-4-2H4z', 'M20 4h-6a3 3 0 0 0-2 2v15a4 4 0 0 1 4-2h4z'],
    calendar: ['M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z', 'M7 3v4M17 3v4M3 10h18'],
    mail: ['M3 5h18v14H3z', 'm3 6 9 7 9-7'],
    rss: ['M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16', 'M4 19h.01'],
    slides: ['M3 4h18v13H3z', 'M12 17v4M8 21h8'],
    shield: ['m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6z', 'm8 12 3 3 5-6'],
    layers: ['M5 3h16v16H5z', 'M2 7v15h15'],
    play: ['m9 6 9 6-9 6Z'],
    video: ['M3 5h12v14H3z', 'm15 10 6-4v12l-6-4'],
    search: ['M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z', 'm16 16 5 5'],
    plus: ['M12 5v14M5 12h14'],
    refresh: ['M20 7a9 9 0 1 0 1 8', 'M20 2v5h-5'],
    settings: ['m9 3-.7 2.4-2 .9L4 5.8 2.5 8.4l1.7 1.8v2.3L2.5 14 4 17l2.5-.4 1.9 1L9 20h3l.8-2.4 2-1 2.5.4 1.5-2.7-1.7-1.9v-2.2l1.7-1.8-1.5-2.6-2.5.4-2-1L12 3Z', 'M14 11.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z'],
    close: ['m6 6 12 12M18 6 6 18'],
    left: ['m14 5-7 7 7 7'],
    right: ['m10 5 7 7-7 7'],
    down: ['m5 9 7 7 7-7'],
    filter: ['M4 5h16M7 12h10M10 19h4'],
    download: ['M12 3v12m-5-5 5 5 5-5', 'M4 16v5h16v-5'],
    upload: ['M12 16V4m-5 5 5-5 5 5', 'M4 16v5h16v-5'],
    copy: ['M8 8h13v13H8z', 'M16 8V3H3v13h5'],
    external: ['M14 3h7v7m0-7L10 14', 'M10 3H3v18h18v-7'],
    file: ['M4 3h10l6 6v12H4z', 'M14 3v6h6M8 13h8M8 17h6'],
    folder: ['M3 5h7l2 3h9v12H3z'],
    edit: ['m15 4 5 5-10 10-6 1 1-6Z', 'm13 6 5 5'],
    trash: ['M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'],
    more: ['M5 12h.01M12 12h.01M19 12h.01'],
    info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 11v6M12 7h.01'],
    check: ['m5 12 4 4L19 6'],
    quote: ['M4 12h6v7H3v-7c0-4 2-6 5-7M15 12h6v7h-7v-7c0-4 2-6 5-7'],
    star: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z'],
    reply: ['m9 5-7 7 7 7v-5h6c3 0 5 2 6 5 0-8-4-11-12-11Z'],
    link: ['m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0', 'm14 8 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0'],
  };
  function Icon({ name = 'file', size = 20, ...props }) {
    return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false, ...props },
      (paths[name] || paths.file).map((d, index) => h('path', { key: index, d })));
  }
  function Button({ children, icon, variant, className, ...props }) {
    return h('button', { type: 'button', ...props, className: cx('w-button', variant && 'w-' + variant, className) }, icon ? h(Icon, { name: icon, size: 18 }) : null, children);
  }
  function IconButton({ label, icon, ...props }) {
    return h(Button, { ...props, icon, className: cx('w-icon-button', props.className), 'aria-label': label, title: label });
  }
  function Page({ title, subtitle, actions, children, workbench = false, className, rootRef, ...props }) {
    return h('section', { ...props, ref: rootRef, className: cx('dshw', 'w-page', className), 'data-main': workbench ? 'true' : 'false' },
      h(Styles, { key: 'styles' }),
      h('header', { className: 'w-page-header' }, h('div', { className: 'w-heading' }, h('h1', null, title), subtitle ? h('p', { className: 'w-subtitle' }, subtitle) : null), actions ? h('div', { className: 'w-header-actions' }, actions) : null),
      h('div', { className: 'w-body' }, children));
  }
  function Tabs({ items, value, onChange, label, children }) {
    const id = useId();
    const active = items.some(item => item.id === value) ? value : items[0]?.id;
    function keys(event, index) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
      const node = event.currentTarget.parentElement?.querySelectorAll('[role=tab]')[next];
      if (node) { onChange(items[next].id); node.focus(); }
    }
    return h('div', { className: 'w-tabs-layout' },
      h('div', { className: 'w-tabs', role: 'tablist', 'aria-label': label }, items.map((item, index) => h('button', {
        type: 'button', role: 'tab', key: item.id, id: id + '-' + item.id, 'aria-controls': id + '-panel', 'aria-selected': active === item.id, tabIndex: active === item.id ? 0 : -1,
        onClick: () => onChange(item.id), onKeyDown: event => keys(event, index),
      }, item.label, item.count !== undefined ? h('span', { className: 'w-count' }, item.count) : null))),
      h('div', { className: 'w-tab-panel', id: id + '-panel', role: 'tabpanel', 'aria-labelledby': id + '-' + active }, children));
  }
  function Status({ children, tone = 'info', className }) {
    if (!children) return null;
    return h('div', { className: cx('dshw', 'w-status', 'w-status-' + tone, className), role: tone === 'error' ? 'alert' : 'status', 'aria-live': tone === 'error' ? 'assertive' : 'polite' }, h(Icon, { name: tone === 'success' ? 'check' : 'info', size: 18 }), h('div', null, children));
  }
  function Empty({ title, children, action, icon = 'file' }) {
    return h('div', { className: 'dshw w-empty' }, h(Styles, { key: 'styles' }), h(Icon, { name: icon, size: 32 }), h('h2', null, title), children ? h('div', { className: 'w-muted' }, children) : null, action ? h('div', { className: 'w-toolbar' }, action) : null);
  }
  function Split({ list, detail, selected, onBack, backLabel, className, listWidth = 360 }) {
    const ref = useRef(null);
    useEffect(() => {
      if (!selected || !ref.current || ref.current.clientWidth > 760) return;
      const heading = ref.current.querySelector('.w-detail h2');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }, [selected]);
    return h('div', { ref, className: cx('w-split', className), 'data-selected': selected ? 'true' : 'false', style: { '--w-list-width': listWidth + 'px' } },
      h('div', { className: 'w-master' }, list),
      h('div', { className: 'w-detail' }, selected ? h(Button, { className: 'w-back', icon: 'left', variant: 'ghost', onClick: onBack }, backLabel) : null, detail));
  }
  function Row({ title, meta, description, active, onClick, children, status, className, disabled }) {
    return h('div', { className: cx('w-row', active && 'w-selected', className) },
      children ? h('div', { className: 'w-row-select' }, children) : null,
      h('button', { type: 'button', className: 'w-row-button', onClick, disabled, 'aria-pressed': !!active },
        h('span', { className: 'w-row-head' }, h('strong', null, title), status ? h('span', { className: 'w-tag' }, status) : null),
        meta ? h('span', { className: 'w-row-meta' }, meta) : null,
        description ? h('span', { className: 'w-row-description' }, description) : null));
  }
  function Search({ label, value, onChange, ...props }) {
    const id = useId();
    return h('div', { className: 'w-search' }, h(Icon, { name: 'search', size: 18 }), h('input', { type: 'search', id, 'aria-label': label, placeholder: label, value, onChange, ...props }));
  }
  function Switch({ label, checked, onChange, disabled }) {
    return h('label', { className: 'w-switch-label' }, h('span', null, label), h('input', { type: 'checkbox', role: 'switch', checked, disabled, onChange, 'aria-label': label }), h('span', { className: 'w-switch-track', 'aria-hidden': true }));
  }
  function Dialog({ title, children, onClose, closeLabel, className, busy = false }) {
    const id = useId(), panel = useRef(null);
    useEffect(() => {
      const previous = document.activeElement;
      panel.current?.querySelector('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')?.focus();
      return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
    }, []);
    function keydown(event) {
      if (event.key === 'Escape' && !event.isComposing) { event.preventDefault(); event.stopPropagation(); if (!busy) onClose(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(node => node.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (!controls.length) { event.preventDefault(); panel.current.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    return h('div', { className: 'dshw w-overlay', onClick: event => { if (!busy && event.target === event.currentTarget) onClose(); } },
      h(Styles, { key: 'styles' }),
      h('section', { ref: panel, className: cx('w-dialog', className), role: 'dialog', 'aria-modal': true, 'aria-labelledby': id, tabIndex: -1, onKeyDown: keydown },
        h('header', { className: 'w-dialog-header' }, h('h2', { id }, title), h(IconButton, { icon: 'close', label: closeLabel, disabled: busy, onClick: onClose })), h('div', { className: 'w-dialog-body' }, children)));
  }
  function register(ctx, { id, label, icon, component, inject, order = 50 }) {
    // The two slots are optional. Existing settings and manual tools still load
    // in hosts without a workbench, while RC.3 owns navigation/pinning itself.
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: id, inject: () => ({ ...(inject?.() || {}), workbench: true }) }, component));
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id, order, label }, function WorkbenchIcon({ size }) { return h(Icon, { name: icon, size }); }));
  }
  const styles = `
.dshw{--w-bg:var(--dsw-alias-bg-layer-1,#fff);--w-soft:var(--dsw-alias-bg-layer-2,#f7f8fa);--w-text:var(--dsw-alias-label-primary,#18202c);--w-muted:var(--dsw-alias-label-secondary,#667085);--w-border:var(--dsw-alias-border-l3,#e7e9ef);--w-accent:var(--dsh-plugin-workbench-accent,#4f6bdb);--w-selected:color-mix(in srgb,var(--w-accent) 10%,var(--w-bg));--w-primary:var(--w-text);--w-on-primary:var(--w-bg);container-type:inline-size;container-name:dsh-workbench;color:var(--w-text);font:14px/1.65 var(--dsh-font-family-content,system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif);min-width:0;max-width:100%;box-sizing:border-box;text-align:start;color-scheme:inherit}
.dshw *,.dshw *:before,.dshw *:after{box-sizing:border-box}.dshw h1,.dshw h2,.dshw h3,.dshw h4,.dshw p{margin:0}.dshw h1{font-size:30px;line-height:1.25;letter-spacing:-.025em;font-weight:650}.dshw h2{font-size:24px;line-height:1.35;font-weight:650;letter-spacing:-.015em;overflow-wrap:anywhere}.dshw h3,.dshw h4{font-size:16px;line-height:1.4;font-weight:600}.dshw a{color:var(--w-accent);text-underline-offset:3px;overflow-wrap:anywhere}.dshw button,.dshw input,.dshw select,.dshw textarea{font:inherit;color:inherit;max-width:100%}.dshw input:not([type=checkbox]):not([type=radio]):not([type=file]),.dshw select,.dshw textarea{background:var(--dsw-specific-input-major,var(--w-bg));border:1px solid var(--w-border);border-radius:8px;padding:8px 11px;min-width:0;line-height:1.5}.dshw input:not([type=checkbox]):not([type=radio]):not([type=file]),.dshw select{min-height:38px}.dshw textarea{resize:vertical}.dshw input[type=checkbox],.dshw input[type=radio]{width:16px;height:16px;flex-shrink:0;accent-color:var(--w-accent)}.dshw :focus-visible{outline:2px solid var(--w-accent);outline-offset:3px}.dshw button:disabled,.dshw input:disabled,.dshw select:disabled,.dshw textarea:disabled{opacity:.5;cursor:not-allowed}.dshw label{font-size:13px}.dshw fieldset{min-width:0;border:1px solid var(--w-border);border-radius:8px}.dshw summary{cursor:pointer;font-weight:550;list-style:none;display:flex;align-items:center;gap:8px}.dshw summary::-webkit-details-marker{display:none}.dshw summary:after{content:'';display:block;margin-inline-start:auto;width:7px;height:7px;border-inline-end:1.75px solid currentColor;border-bottom:1.75px solid currentColor;transform:rotate(45deg);flex-shrink:0}.dshw details[open]>summary:after{transform:rotate(225deg)}.dshw details>summary+*{margin-top:12px}.dshw pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace;max-width:100%;background:var(--w-soft);border-radius:6px;padding:14px}.dshw img,.dshw video,.dshw iframe{max-width:100%}
.w-page{display:flex;flex-direction:column;position:relative;padding:0;min-height:540px;gap:0}.w-page[data-main=true]{height:100%;min-height:0;padding:calc(24px + var(--dsh-frame-top-clearance,0px)) 28px 0 max(28px,var(--dsh-frame-leading-clearance,0px));overflow:auto}.dshw[data-main=true]{background:var(--w-bg)}.dshw.w-page,.dshw .w-body,.dshw .w-tab-panel{overflow-x:clip}.w-page-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-bottom:22px;flex-shrink:0}.w-heading{min-width:0}.w-subtitle{margin-top:8px!important;font-size:14px;color:var(--w-muted);line-height:1.6}.w-header-actions,.w-toolbar,.w-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-width:0}.w-header-actions{justify-content:flex-end}.w-body,.w-tabs-layout{display:flex;flex-direction:column;flex:1;min-height:0;min-width:0}.w-body{overflow:auto}.w-tab-panel{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:auto}.w-tabs{display:flex;align-items:stretch;gap:20px;border-bottom:1px solid var(--w-border);flex-shrink:0;overflow-x:auto;scrollbar-width:thin}.dshw .w-tabs>button{border:0;border-bottom:2px solid transparent;background:transparent;padding:11px 8px 13px;white-space:nowrap;font-size:14px;font-weight:550;cursor:pointer;color:var(--w-muted);display:flex;align-items:center;gap:7px}.dshw .w-tabs>button[aria-selected=true]{border-bottom-color:var(--w-accent);color:var(--w-accent)}.w-count,.w-tag{font-size:12px;line-height:1.5;display:inline-flex;align-items:center;flex-shrink:0;background:var(--w-soft);border-radius:5px;padding:1px 6px;color:var(--w-muted)}.w-tabs [aria-selected=true] .w-count,.w-selected .w-tag{color:var(--w-accent);background:var(--w-selected)}
.dshw .w-button{display:inline-flex;justify-content:center;align-items:center;gap:7px;background:var(--w-bg);border:1px solid var(--w-border);border-radius:8px;padding:8px 12px;min-height:36px;line-height:1.4;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none;white-space:normal}.dshw .w-button:not(:disabled):hover{background:var(--w-soft)}.dshw .w-primary{background:var(--w-primary);border-color:var(--w-primary);color:var(--w-on-primary)}.dshw .w-primary:not(:disabled):hover{background:var(--w-primary);opacity:.9}.dshw .w-ghost{background:transparent;border-color:transparent}.dshw .w-danger{color:var(--dsw-alias-state-error-primary,#b43c3c)}.dshw .w-icon-button{width:36px;min-width:36px;padding:8px}.dshw .w-button svg{flex-shrink:0}.w-muted{color:var(--w-muted);font-size:12px;line-height:1.6}.w-section{padding:24px 0;border-bottom:1px solid var(--w-border);min-width:0}.w-section>h3{margin-bottom:12px}.w-section>p+p{margin-top:8px}.w-fields{display:grid;gap:16px;min-width:0}.w-field{display:grid;gap:6px;min-width:0}.w-field>input,.w-field>select,.w-field>textarea{width:100%}.w-status{display:flex;align-items:flex-start;gap:8px;padding:11px 13px;margin:12px 0;border:1px solid var(--w-border);border-radius:8px;background:var(--w-soft);font-size:13px;overflow-wrap:anywhere;flex-shrink:0}.w-status>svg{flex-shrink:0;margin-top:2px}.w-status-error{color:var(--dsw-alias-state-error-primary,#ad3636)}.w-status-success{color:var(--dsw-alias-state-success-primary,#24794a)}.w-status-warn{color:var(--dsw-alias-state-warning-primary,#8a5a00)}.w-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;width:100%;max-width:580px;padding:48px 24px;margin:auto;min-height:280px;overflow-wrap:anywhere}.w-empty>svg{color:var(--w-muted)}.w-empty h2{font-size:20px}.w-empty .w-muted{font-size:14px}.w-empty .w-toolbar{justify-content:center}
.w-split{display:grid;grid-template-columns:minmax(240px,var(--w-list-width)) minmax(0,1fr);min-height:460px;flex:1;min-width:0}.w-master{min-width:0;border-inline-end:1px solid var(--w-border);overflow:auto;padding-bottom:24px}.w-detail{min-width:0;padding:26px 28px;overflow:auto;overflow-wrap:anywhere;display:flex;flex-direction:column}.w-master-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:20px 16px}.w-search{display:flex;align-items:center;gap:8px;border:1px solid var(--w-border);border-radius:8px;padding:0 10px;min-width:0;flex:1;background:var(--w-bg)}.w-search>svg{color:var(--w-muted);flex-shrink:0}.dshw .w-search>input{border:0!important;background:transparent!important;padding:8px 0!important;width:100%;outline-offset:0}.w-row{display:flex;gap:0;min-width:0;position:relative;border-bottom:1px solid var(--w-border);border-inline-start:3px solid transparent}.w-row-select{display:flex;align-items:flex-start;padding:21px 0 0 14px}.dshw .w-row-button{display:flex;flex-direction:column;align-items:stretch;gap:7px;text-align:start;width:100%;padding:18px 18px 18px 16px;border:0;background:transparent;color:inherit;min-width:0;cursor:pointer;line-height:1.5}.dshw .w-row-button:hover{background:var(--w-soft)}.w-row-head{display:flex;align-items:flex-start;gap:10px;justify-content:space-between;min-width:0}.w-row-head>strong{font-size:14px;line-height:1.5;font-weight:600;overflow-wrap:anywhere}.w-row-meta,.w-row-description{color:var(--w-muted);font-size:12px;line-height:1.6;overflow-wrap:anywhere}.w-row-description{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.w-selected{background:var(--w-selected);border-inline-start-color:var(--w-accent)}.w-back{display:none!important}.w-detail-title{margin-bottom:12px!important}.w-detail-meta{color:var(--w-muted);font-size:13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.w-detail-footer{padding:24px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:auto;border-top:1px solid var(--w-border)}.w-detail-footer .w-muted{flex:1;min-width:160px}.w-definition{display:grid;grid-template-columns:minmax(80px,120px) minmax(0,1fr);gap:8px 16px;font-size:14px;margin:20px 0}.w-definition dt{color:var(--w-muted)}.w-definition dd{margin:0;min-width:0;overflow-wrap:anywhere}
.w-switch-label{display:inline-flex;align-items:center;gap:8px;font-size:13px;position:relative;cursor:pointer}.w-switch-label>input{position:absolute;opacity:0;inset-inline-end:0;width:36px!important;height:22px!important;margin:0;cursor:pointer}.w-switch-track{width:36px;height:22px;border-radius:12px;display:block;background:var(--w-border);border:1px solid var(--w-border);pointer-events:none;padding:2px;transition:background .15s}.w-switch-track:before{content:'';display:block;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px #0002;transition:transform .15s}.w-switch-label>input:checked+.w-switch-track{background:var(--w-accent);border-color:var(--w-accent)}.w-switch-label>input:checked+.w-switch-track:before{transform:translateX(14px)}.w-switch-label>input:focus-visible+.w-switch-track{outline:2px solid var(--w-accent);outline-offset:3px}.w-switch-label:has(>input:disabled){opacity:.5;cursor:not-allowed}
.w-overlay{position:fixed;inset:0;background:#0005;display:flex;justify-content:flex-end;z-index:1000;padding:12px;overflow:auto}.w-dialog{width:min(620px,100%);max-height:100%;display:flex;flex-direction:column;min-height:0;background:var(--w-bg);color:var(--w-text);border:1px solid var(--w-border);border-radius:12px;box-shadow:0 18px 70px #0003}.w-dialog-header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px;border-bottom:1px solid var(--w-border);flex-shrink:0}.w-dialog-header>h2{font-size:20px}.w-dialog-body{overflow:auto;padding:20px 24px;min-height:0}.w-editor-grid{display:grid;grid-template-columns:210px minmax(0,1fr) 300px;min-height:500px;flex:1}.w-editor-list{padding:20px 12px;border-inline-end:1px solid var(--w-border);min-width:0}.w-editor-canvas{background:var(--w-soft);padding:20px;min-width:0;display:flex;flex-direction:column;gap:14px}.w-editor-inspector{padding:24px;border-inline-start:1px solid var(--w-border);min-width:0;overflow:auto}.w-editor-inspector h3{margin-bottom:18px}.w-preview-empty{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:12px;aspect-ratio:16/9;min-height:180px;background:var(--w-soft);border:1px solid var(--w-border);border-radius:8px;padding:24px;color:var(--w-muted)}.w-content-pad{padding:24px 0}.w-stack{display:flex;flex-direction:column;gap:16px;min-width:0}.w-scroll-x{overflow:auto;max-width:100%}
@container dsh-workbench (max-width:1000px){.w-editor-grid{grid-template-columns:160px minmax(0,1fr)}.w-editor-inspector{grid-column:1/-1;border-inline-start:0;border-top:1px solid var(--w-border)}.w-header-actions{max-width:60%}.w-split{grid-template-columns:minmax(240px,32%) minmax(0,1fr)}}
@container dsh-workbench (max-width:760px){.w-page-header{gap:14px;flex-wrap:wrap;padding-bottom:18px}.w-heading{flex:1;min-width:170px}.dshw h1{font-size:24px}.w-header-actions{max-width:100%;justify-content:flex-start}.w-subtitle{font-size:13px}.w-tabs{gap:12px}.dshw .w-tabs>button{padding:10px 4px 12px}.w-split{display:block;min-height:360px}.w-split[data-selected=false]>.w-detail{display:none}.w-split[data-selected=true]>.w-master{display:none}.w-master{border-inline-end:0}.w-detail{padding:20px 0}.w-back{display:inline-flex!important;align-self:flex-start;margin:0 0 16px!important}.w-detail h2{font-size:22px}.w-master-toolbar{padding:16px 0}.dshw .w-row-button{padding:16px 10px}.w-detail-footer{position:static}.w-detail-footer .w-muted{flex-basis:100%}.w-editor-grid{display:flex;flex-direction:column}.w-editor-list{border-inline-end:0;border-bottom:1px solid var(--w-border);padding:16px 0}.w-editor-canvas{padding:16px 0;background:var(--w-bg)}.w-editor-inspector{padding:20px 0}.w-dialog-header,.w-dialog-body{padding:16px}.w-button{min-height:40px}.w-definition{grid-template-columns:80px minmax(0,1fr)}}
@media(max-width:700px){.w-page[data-main=true]{padding:calc(16px + var(--dsh-frame-top-clearance,0px)) 16px 0 max(16px,var(--dsh-frame-leading-clearance,0px))}.w-overlay{padding:8px}.w-dialog{width:100%}}
@media(prefers-reduced-motion:reduce){.dshw *,.dshw *:before{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;
  function Styles() { return h('style', null, styles); }
  return { Icon, Button, IconButton, Page, Tabs, Status, Empty, Split, Row, Search, Switch, Dialog, Styles, register, styles };
}

/* One update control per plugin. Only transport, idle guards and installation
 * coordination are shared; no global update page or update-all action exists. */
function __stardustUpdatesGuards() {
  const key = Symbol.for('stardustlc.plugin-updates.guards.v1');
  return globalThis[key] ||= { values: new Map(), listeners: new Set(), viewListeners: new Set(), clients: new Set() };
}
function __stardustUpdatesGuard(React, name, { dirty = false, busy = false, retainOnClose = false } = {}) {
  const token = React.useRef(null);
  if (!token.current) token.current = {};
  React.useLayoutEffect(() => {
    const pool = __stardustUpdatesGuards();
    if (!dirty && !busy) for (const [key, value] of pool.values) if (value.name === name && value.orphan) pool.values.delete(key);
    pool.values.set(token.current, { name, dirty: !!dirty, busy: !!busy, retainOnClose, orphan: false });
    for (const listener of pool.listeners) listener();
  }, [name, !!dirty, !!busy, retainOnClose]);
  React.useEffect(() => () => {
    const pool = __stardustUpdatesGuards(), value = pool.values.get(token.current);
    if (value?.retainOnClose && (value.dirty || value.busy)) value.orphan = true;
    else pool.values.delete(token.current);
    for (const listener of pool.listeners) listener();
  }, []);
}
function __StardustPluginUpdatesFooter({ React, name }) {
  const [, render] = React.useState(0), pool = __stardustUpdatesGuards();
  React.useEffect(() => { const fn = () => render(value => value + 1); pool.viewListeners.add(fn); return () => pool.viewListeners.delete(fn); }, []);
  const client = [...pool.clients].find(client => typeof client.Footer === 'function' && client.has(name));
  if (!client) return null;
  return React.createElement(client.Footer, { name });
}
function __stardustUpdatesFooter(React, name) {
  return React.createElement(__StardustPluginUpdatesFooter, { key: 'plugin-updates', React, name });
}
function __stardustUpdatesInlinePage(React, element, name) {
  return React.cloneElement(element, null, element.props.children, __stardustUpdatesFooter(React, name));
}
function __stardustUpdatesDetailName(subject, rows) {
  if (!subject || !['bundle', 'row'].includes(subject.kind)) return null;
  if (subject.kind === 'row' && subject.pkg?.name === '@stardustlc/dsh-suite') {
    const component = rows.find(row => row.bundledBy === subject.pkg.name && (subject.row?.moduleName === row.name || subject.row?.moduleName?.startsWith(row.name + '/')));
    if (component) return component.name;
  }
  return rows.some(row => row.name === subject.pkg?.name) ? subject.pkg.name : null;
}
function __stardustUpdatesNativeFormState(document) {
  let dirty = false, busy = false;
  for (const scope of document.querySelectorAll('[data-plugin-detail],[data-plugin-row-detail]')) for (const button of scope.querySelectorAll('button')) {
    if (!button.getClientRects().length || button.closest('.plugin-updates-footer')) continue;
    const label = (button.getAttribute('aria-label') || button.textContent || '').trim();
    if (/^(?:正在保存|保存中|Saving)(?:[.…\s]|$)/i.test(label) || button.getAttribute('aria-busy') === 'true') busy = true;
    if (!button.disabled && button.getAttribute('aria-disabled') !== 'true' && /^(?:保存(?:更改|设置|配置)?|Save(?: changes| settings| configuration)?)(?:\s+(?:Ctrl|⌘|Enter|↵).*)?$/i.test(label)) dirty = true;
  }
  return { dirty, busy };
}
function __stardustUpdatesDisplayRows(next, known) {
  for (const row of next.rows) known.set(row.name, row);
  if (!['verifying', 'installing', 'cancelling', 'unknown', 'restore-failed'].includes(next.job?.state)) return next;
  const rows = [...next.rows];
  for (const row of known.values()) if ((row.name === next.job.name || row.bundledBy === next.job.name) && !rows.some(item => item.name === row.name)) rows.push({ ...row, updating: true });
  return { ...next, rows };
}
function __stardustUpdatesSuiteRows(next, participants) {
  // The official manager lists top-level dependencies, not Suite's transitive
  // components. Project active, build-identified clients for display only.
  // Installation and preferences still use the real Suite row from the host.
  const suiteUpdating = next.job?.name === '@stardustlc/dsh-suite' && ['verifying', 'installing', 'cancelling', 'unknown', 'restore-failed'].includes(next.job?.state);
  const suite = next.rows.find(row => row.name === '@stardustlc/dsh-suite' && (row.enabled || suiteUpdating));
  if (!suite) return next;
  const rows = [...next.rows], names = new Set(rows.map(row => row.name));
  for (const item of participants) if (item.suiteComponent && item.packageVersion && item.label && !names.has(item.name)) {
    names.add(item.name);
    rows.push({ name: item.name, version: item.packageVersion, enabled: true, sourceKind: 'suite', loadError: false, label: item.label, labelEn: item.labelEn, bundledBy: suite.name });
  }
  return { ...next, rows };
}
function __stardustUpdatesWrap(definition, participant) {
  return { ...definition, factory(require) {
    const original = definition.factory(require);
    if (!original || typeof original !== 'object') return original;
    const React = require('react');
    return { ...original, apply(ctx, ...args) {
      const result = original.apply?.call(this, ctx, ...args);
      // The optional alpha.3 slot stays dormant in older hosts; its scoped
      // injection unregisters naturally when the plugin is unloaded.
      if (participant.iconData && participant.sectionIds?.length && typeof ctx.inject === 'function') ctx.inject(['slots'], host => {
        for (const id of new Set(participant.sectionIds)) host.slots.inject('settings.section.icon', () => host.slots.register({ name: 'settings.section.icon', id }, function PluginSettingsIcon({ size = 20 }) {
          return React.createElement('img', { src: participant.iconData, alt: '', 'aria-hidden': true, width: size, height: size, style: { objectFit: 'contain', display: 'block', flexShrink: 0 } });
        }));
      });
      if (typeof ctx.inject === 'function') ctx.inject(['slots', 'locale', 'remote', 'remote.pluginManager'], host => __stardustUpdatesJoin(host, React, require, participant));
      return result;
    } };
  } };
}
function __stardustUpdatesJoin(host, React, require, participant) {
  const key = Symbol.for('stardustlc.plugin-updates.client.v1'), pools = globalThis[key] ||= new WeakMap(), root = host.root || host;
  if (typeof root.plugin !== 'function') return;
  let record = pools.get(root);
  if (!record) {
    record = { refs: new Map(), timer: null, version: participant.version, alive: true, hold: false, uiRevision: 11, migration: Promise.resolve() };
    pools.set(root, record);
    __stardustUpdatesActivate(record, pools, root, React, require);
  } else if ((record.uiRevision || 0) < 11 && !record.upgrading) {
    // An earlier loaded participant may still own an older client revision. Keep
    // its references and draft guards, wait for any admitted install, then
    // replace that one client fiber instead of running two window heartbeats.
    const shared = record;
    const previousMigration = record.migration;
    record.upgrading = record.migration = Promise.resolve(previousMigration).then(async () => {
      while (shared.alive && shared.hold) await new Promise(resolve => setTimeout(resolve, 500));
      if (!shared.alive || !shared.refs.size) return;
      await shared.fiber?.dispose?.();
      if (!shared.refs.size) return;
      shared.alive = true; shared.uiRevision = 11; pools.set(root, shared);
      __stardustUpdatesActivate(shared, pools, root, React, require);
    }).catch(() => { /* The original page remains usable if host disposal fails. */ });
  }
  clearTimeout(record.timer);
  const ref = {}; record.refs.set(ref, participant);
  host.effect(() => () => {
    record.refs.delete(ref);
    const stop = () => {
      if (record.refs.size || !record.alive) return;
      if (record.hold) { record.timer = setTimeout(stop, 1000); return; }
      record.alive = false; Promise.resolve(record.fiber?.dispose?.()).catch(() => {});
    };
    if (!record.refs.size) record.timer = setTimeout(stop, 1000);
  });
}
function __stardustUpdatesActivate(shared, pools, root, React, require) {
  shared.fiber = root.plugin({ name: 'stardustlc-plugin-updates-client', inject: ['slots', 'locale', 'remote', 'remote.pluginManager'], apply(ctx) {
    const client = __stardustUpdatesClient(ctx, React, require, shared);
    ctx.effect(() => () => { shared.alive = false; client.dispose(); if (pools.get(root) === shared) pools.delete(root); });
  } });
  Promise.resolve(shared.fiber).catch(() => { shared.alive = false; if (pools.get(root) === shared) pools.delete(root); });
}
function __stardustUpdatesClient(ctx, React, require, shared) {
  const h = React.createElement, W = createWorkbenchUI(React), route = new URL('api/stardustlc/plugin-updates', document.baseURI);
  const { useState, useEffect, useRef } = React, id = crypto.randomUUID(), listeners = new Set(), pool = __stardustUpdatesGuards(), requests = new Set(), knownRows = new Map();
  let alive = true, registered = false, state = null, lastInteraction = Date.now(), inPoll = false, manualOperation = false;
  const language = () => String(ctx.locale?.getSnapshot?.().active || '').startsWith('en') ? 'en' : 'zh';
  const t = (zh, en) => language() === 'en' ? en : zh;
  const REPOS = { 'dsh-calendar': 'dsh-calendar', 'dsh-cite': 'dsh-cite', 'dsh-code-security': 'dsh-code-security', 'dsh-codex-port': 'dsh-codex-port', 'deepseek-computer-use': 'deepseek-computer-use', 'dsh-dingtalk': 'dsh-dingtalk', '@stardustlc/dsh-docker': 'dsh-docker', '@stardustlc/dsh-dream': 'dsh-dream', 'dsh-email': 'dsh-email', 'dsh-ffmpeg': 'dsh-ffmpeg', 'dsh-flakefinder': 'dsh-flakefinder', 'dsh-hyperframes': 'dsh-hyperframes', 'dsh-minimal-ptc': 'dsh-minimal-ptc', 'dsh-ppt': 'dsh-ppt', 'dsh-remotion': 'dsh-remotion', '@stardustlc/dsh-review': 'dsh-review', 'dsh-rss': 'dsh-rss', 'dsh-slack': 'dsh-slack', 'dsh-sql': 'dsh-sql', '@stardustlc/dsh-suite': 'dsh-suite', 'dsh-voice': 'dsh-voice' };
  const repoUrl = pkg => Object.hasOwn(REPOS, pkg) ? 'https://github.com/STARDUSTLC666/' + REPOS[pkg] : null;
  const preferences = name => state?.preferences.packages[name] || { checkEnabled: true, autoInstall: false, autoScope: 'compatible', deferredUntil: 0, ignoredVersion: null };
  const originalRow = name => state?.rows.find(row => row.name === name);
  const rowFor = name => { const row = originalRow(name); return row?.bundledBy ? originalRow(row.bundledBy) : row; };
  const activeJob = () => ['verifying', 'installing', 'cancelling'].includes(state?.job?.state);
  function notify() { shared.hold = manualOperation || activeJob(); for (const listener of listeners) listener(); for (const listener of pool.viewListeners) listener(); }
  async function api(body = { action: 'state' }) {
    const controller = new AbortController(); requests.add(controller);
    const timeout = setTimeout(() => controller.abort(), body.action === 'check' ? 95000 : 45000);
    try {
      const response = await fetch(route, { method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.signal, headers: { 'content-type': 'application/json', 'x-stardustlc-updates': '1' }, body: JSON.stringify(body) });
      let data; try { data = await response.json(); } catch { throw new Error('service-unavailable'); }
      if (!response.ok || !data.ok) throw new Error(response.status === 403 ? 'owner-required' : data.code || 'service-unavailable');
      return data.value;
    } catch (error) { if (error?.name === 'AbortError') throw new Error('service-unavailable'); throw error; }
    finally { clearTimeout(timeout); requests.delete(controller); }
  }
  function pageState(manual = manualOperation) {
    const values = [...pool.values.values()], nativeForm = __stardustUpdatesNativeFormState(document);
    const dialog = [...document.querySelectorAll('[role="dialog"],dialog[open]')].some(node => node.getClientRects().length && !(manual && (node.closest('.plugin-updates-footer') || node.querySelector('.plugin-updates-footer'))));
    return { action: 'heartbeat', id, dirty: nativeForm.dirty || values.some(value => value.dirty), busy: nativeForm.busy || values.some(value => value.busy) || dialog, idleForMs: Math.min(86400000, Math.max(0, Date.now() - lastInteraction)) };
  }
  const heartbeat = () => api(pageState());
  function interaction() { lastInteraction = Date.now(); if (registered && alive) void heartbeat().catch(() => {}); }
  const guardChanged = () => { if (registered && alive) void heartbeat().catch(() => {}); };
  for (const event of ['pointerdown', 'keydown', 'input']) document.addEventListener(event, interaction, { capture: true, passive: true });
  pool.listeners.add(guardChanged);
  const close = () => { void fetch(route, { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'content-type': 'application/json', 'x-stardustlc-updates': '1' }, body: JSON.stringify({ action: 'client-close', id }) }).catch(() => {}); };
  window.addEventListener('pagehide', close);
  async function refresh() { const next = await api(); if (alive) { state = __stardustUpdatesDisplayRows(__stardustUpdatesSuiteRows(next, shared.refs.values()), knownRows); notify(); } return next; }
  const STALE_CHECK_MS = 30 * 60 * 1000, STALE_RETRY_MS = 5 * 60 * 1000, staleChecks = new Map(), staleInFlight = new Set();
  function refreshIfStale(row) {
    if (!alive || !row || row.sourceKind !== 'registry' || row.bundledBy || !row.available || row.updating) return;
    const now = Date.now();
    if (row.checkedAt && now - row.checkedAt <= STALE_CHECK_MS) return;
    if (staleInFlight.has(row.name) || now - (staleChecks.get(row.name) ?? -Infinity) < STALE_RETRY_MS) return;
    staleChecks.set(row.name, now);
    staleInFlight.add(row.name);
    void (async () => {
      try { await api({ action: 'check', name: row.name }); await refresh(); }
      catch { /* Offline or transient errors stay silent and throttled by staleChecks. */ }
      finally { staleInFlight.delete(row.name); }
    })();
  }
  function useSnapshot() {
    const [, render] = useState(0);
    useEffect(() => { const fn = () => render(value => value + 1); listeners.add(fn); const stop = ctx.locale?.subscribe?.(fn); return () => { listeners.delete(fn); stop?.(); }; }, []);
    return state;
  }
  function message(code) {
    return ({
      'page-dirty': t('有未保存的修改。请先保存或放弃修改，再更新。', 'Save or discard unsaved changes before updating.'),
      'page-busy': t('有页面操作或对话框尚未结束，请完成后再试。', 'Finish the active page operation or close its dialog, then retry.'),
      'page-not-ready': t('还有窗口状态未确认，或旧版插件尚未提供状态保护。请刷新相关窗口，必要时先手动更新旧版插件。', 'A window state is unknown or an older plugin lacks state protection. Refresh the affected windows and manually update legacy plugins if needed.'),
      busy: t('DSH 正在执行任务或安装，请等操作结束。', 'DSH is running a task or installation. Wait for it to finish.'),
      'activity-unknown': t('无法确认任务是否空闲，已暂停安装。', 'Installation paused because task activity is unknown.'),
      'restart-required': t('更新服务需要重启后继续。请在方便时手动重启 DSH。', 'The updater needs a restart. Restart DSH manually when convenient.'),
      'operation-unconfirmed': t('上次安装未确认或恢复失败。请在官方插件管理中检查并修复，之后手动重启 DSH。', 'The last installation is unconfirmed or recovery failed. Check and repair it in native plugin management, then restart DSH manually.'),
      'check-first': t('检查结果已过期，请重新检查。', 'This check expired. Check again.'),
      'release-changed': t('发现更新的发布版本（或发布信息已更新），已刷新至最新状态，请再次确认安装。', 'A newer release or updated metadata was found and refreshed; confirm again to install.'),
      'preferences-conflict': t('另一个窗口修改了偏好，已刷新，请重试。', 'Preferences changed in another window. They have been refreshed; retry.'),
      'preferences-unreadable': t('更新偏好文件无法读取，自动安装已关闭。请检查当前 profile 的 stardustlc-plugin-updates.json。', 'Preferences could not be read. Automatic installation is off. Check stardustlc-plugin-updates.json in this profile.'),
      'no-update': t('版本已变化或暂不兼容，请重新检查。', 'The version changed or is incompatible. Check again.'),
      'source-not-registry': t('本地源码、Git 等安装，请通过原安装方式更新。', 'Update local, Git and other external sources through their original installation method.'),
      'managed-by-suite': t('这个插件随 Suite 安装，通过 Suite 更新。', 'This plugin was installed through Suite and is updated through Suite.'),
      'owner-required': t('只有 profile 拥有者能管理更新。', 'Only the profile owner can manage updates.'),
      'version-mismatch': t('宿主装入的版本与目标不同。请重新检查版本和软件源策略。', 'The installed version differs from the target. Check the release and registry policy.'),
      'unexpected-package': t('宿主装入的包或版本与目标不同。请检查版本和软件源策略。', 'The installed package or version differed from the target. Check the release and registry policy.'),
      'version-unconfirmed': t('尚未确认新版已加载，请在插件详情中检查当前版本。', 'The new version could not be confirmed. Check the installed version in plugin details.'),
      'build-blocked': t('构建脚本等待批准。请查看原生插件管理中的安装提示。', 'Build scripts await approval. Review the install details in native plugin management.'),
      'bundle-in-use': t('宿主暂时无法热卸载旧版（通常因本轮刚更新过其他共用底层依赖的插件，内存路径待刷新；或同时启用了包含此组件的组合包）：直接手动重启一次 DSH 即可继续更新，无需逐个停用插件。', 'The host cannot hot-unload the previous version right now (usually because another plugin sharing dependencies was updated earlier in this session, or a bundle containing this component is also active): restart DSH once and retry without disabling plugins one by one.'),
      'already-installed': t('该包已在当前配置中，请刷新或重启 DSH 后查看当前版本。', 'This package is already present in the profile; refresh or restart DSH to inspect its version.'),
      'incompatible-version': t('目标版本与当前运行的 DSH 版本不兼容。', 'The target version is incompatible with the running DSH version.'),
      'stop-profile': t('当前配置未启用热重载，需关闭 DSH 后再通过命令行更新。', 'This profile runs without hot reload; stop DSH and update via CLI.'),
      'not-removable': t('此内置或受保护插件不支持在此处移除替换。', 'This built-in or protected bundle cannot be replaced here.'),
      'pkg-network': t('连接 npm 源时网络中断，请稍后重试。', 'Network error reaching the package registry. Retry shortly.'),
      'pkg-timeout': t('包管理器请求超时，请检查网络后重试。', 'Package manager request timed out. Check your connection and retry.'),
      'pkg-not-found': t('未找到目标版本或已被源撤回，请重新检查更新。', 'Target release was not found on the registry. Check again.'),
      'pkg-no-matching-version': t('没有匹配当前兼容性要求的已发布版本。', 'No published version matches the compatibility constraints.'),
      'pkg-integrity': t('下载包的完整性校验未通过，已放弃安装，请重试。', 'Package integrity verification failed. Installation aborted; retry.'),
      'pkg-disk-full': t('磁盘空间不足，请清理后重试。', 'Disk space is full. Free disk space and retry.'),
      'pkg-permission': t('无权写入当前 profile 目录，请检查文件权限。', 'Permission denied writing to this profile directory.'),
      'pkg-pnpm-missing': t('未检测到可用的 pnpm，请在环境或宿主插件设置中检查。', 'pnpm is unavailable to the host package manager.'),
      'operation-error': t('宿主包管理器未能完成操作，可在原生「插件」详情页点击更新查看完整日志。', 'Host package manager did not complete the operation. Retry from native plugin details to inspect logs.'),
    })[code] || t('操作未完成，请刷新后重试。DSH 不会因此自动重启。', 'The operation could not be completed. Refresh and retry. DSH will not restart automatically.');
  }
  function reasonOf(job) {
    if (!job) return null;
    if (job.reason) return job.reason;
    const res = job.outcome?.result;
    if (res?.pendingBuilds || res?.failureKind === 'build-blocked') return 'build-blocked';
    if (res?.failureKind && ['network', 'timeout', 'not-found', 'no-matching-version', 'integrity', 'pnpm-missing', 'disk-full', 'permission'].includes(res.failureKind)) return 'pkg-' + res.failureKind;
    return res?.error?.code || null;
  }
  // releaseOf() keeps the failing engine/peer range check as a stable code; say which
  // environment has to change instead of only reporting that the release is incompatible.
  function requirement(release) {
    return ({
      'dsh-version': t('需要换成与该版本匹配的 DSH 本体', 'it needs a different DSH version'),
      'node-version': t('需要换成与该版本匹配的 Node.js', 'it needs a different Node.js version'),
      deprecated: t('作者已把这个版本标记为弃用', 'the author marked this release as deprecated'),
      'not-bundle': t('这个版本不是可加载的 DSH 插件包', 'this release is not a loadable DSH plugin bundle'),
    })[release?.reason] || t('发布元数据的兼容范围与当前环境不符', 'its published compatibility range does not match this environment');
  }
  function jobLabel(job) {
    if (job.state === 'installing') {
      const phase = ({
        checking: t('宿主正在检查版本', 'Host checking release'),
        removing: t('正在卸载旧版', 'Unloading the previous version'),
        applying: t('正在加载新版', 'Loading the new version'),
        restoring: t('正在恢复旧版', 'Restoring the previous version'),
      })[job.phase];
      if (phase) return phase;
    }
    return ({ verifying: t('正在核对版本', 'Verifying release'), installing: t('正在安装', 'Installing'), cancelling: t('正在请求取消', 'Requesting cancellation'), complete: t('已更新', 'Updated'), 'restart-required': t('已安装，等待你手动重启', 'Installed; manual restart needed'), restored: t('更新未成功，已恢复原版本', 'Update failed; previous version restored'), 'restore-failed': t('恢复未成功，请检查官方插件管理', 'Recovery failed; check native plugin management'), unknown: t('结果未确认，请检查官方插件管理', 'Result unconfirmed; check native plugin management'), cancelled: t('已取消', 'Cancelled'), failed: t('更新未成功', 'Update failed') })[job.state] || job.state;
  }
  const FOOTER_CSS = '.plugin-updates-footer{box-sizing:border-box;flex-shrink:0;margin-top:16px;padding-top:14px;border-top:var(--dsh-control-border-width,0.5px) solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l3,#e5e7eb));min-width:0;max-width:100%;color:var(--dsw-alias-label-primary,#202124)}'
    + '.dshw.plugin-updates-footer.is-inline{display:block!important;width:100%!important;max-width:100%!important;margin-block:auto 0!important;margin-inline:0!important;padding:6px 14px!important;border-top:var(--dsh-control-border-width,0.5px) solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l3,#e5e7eb));background:var(--dsw-alias-bg-layer-1,var(--w-soft,#f7f8fa));font-size:12px;line-height:1.45}'
    + '.plugin-updates-footer .updates-bar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px 12px;min-block-size:28px;min-width:0}'
    + '.plugin-updates-footer .updates-bar-info,.plugin-updates-footer .updates-bar-actions,.plugin-updates-footer .updates-head-actions,.plugin-updates-footer .updates-title-row{display:flex;align-items:center;flex-wrap:wrap;gap:6px 8px;min-width:0}'
    + '.plugin-updates-footer .updates-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px 12px}'
    + '.plugin-updates-footer .updates-compact-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px 12px}'
    + '.plugin-updates-footer .updates-compact-bar>.updates-options{margin-top:0;min-width:0}'
    + '.plugin-updates-footer .updates-compact-bar>.updates-options[open]{flex:1 1 100%}'
    + '.plugin-updates-footer h2{font-size:13.5px;line-height:1.4;margin:0;font-weight:600}'
    + '.plugin-updates-footer .updates-pill{display:inline-flex;align-items:center;padding:1px 7px;border-radius:999px;font-size:11px;font-weight:600;line-height:1.5;background:var(--dsw-alias-bg-layer-2,var(--w-soft,#eef1f6));color:var(--dsw-alias-label-secondary,#657080)}'
    + '.plugin-updates-footer .updates-pill.is-accent{background:color-mix(in srgb,var(--w-accent,#4f6bdb) 14%,transparent);color:var(--w-accent,#4f6bdb)}'
    + '.plugin-updates-footer .updates-pill.is-error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ad3636) 14%,transparent);color:var(--dsw-alias-state-error-primary,#ad3636)}'
    + '.plugin-updates-footer .updates-mono,.plugin-updates-footer .updates-subtitle,.plugin-updates-footer .updates-version{font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere;margin:0}'
    + '.plugin-updates-footer .updates-badge{padding:1px 6px;border-radius:5px;background:var(--dsw-alias-bg-layer-2,var(--w-soft,#eef1f6));color:var(--dsw-alias-label-secondary,#657080)}'
    + '.plugin-updates-footer .updates-meta-line,.plugin-updates-footer .updates-note{margin:3px 0 0;font-size:12px;line-height:1.55}'
    + '.plugin-updates-footer .updates-inline-msg.is-error{color:var(--dsw-alias-state-error-primary,#ad3636);font-size:12px}'
    + '.plugin-updates-footer .w-button.is-sm{min-block-size:26px;min-inline-size:26px;min-height:26px;padding:3px 9px;font-size:12px;gap:5px;border-radius:6px}'
    + '.plugin-updates-footer .updates-options{margin-top:8px}'
    + '.plugin-updates-footer .updates-options>summary{cursor:pointer;display:inline-flex;align-items:center;gap:0.55ch;min-block-size:24px;font-size:12px;line-height:1.5;font-weight:500;color:var(--dsw-alias-label-secondary,#657080);list-style:none}'
    + '.plugin-updates-footer .updates-options>summary:after{display:none}'
    + '.plugin-updates-footer .updates-options>summary::before{content:"";inline-size:6px;block-size:6px;flex-shrink:0;border-inline-end:1.5px solid currentColor;border-block-end:1.5px solid currentColor;rotate:-45deg}'
    + '.plugin-updates-footer .updates-options>summary:dir(rtl)::before{rotate:135deg}'
    + '.plugin-updates-footer .updates-options[open]>summary::before{rotate:45deg}'
    + '.plugin-updates-footer .updates-options>summary:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#6b79df);outline-offset:3px;border-radius:4px}'
    + '.plugin-updates-footer details::details-content{interpolate-size:allow-keywords;overflow:clip;contain:layout}'
    + '.plugin-updates-footer details:not([open])::details-content{block-size:0}'
    + '.plugin-updates-footer .updates-settings{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:14px;padding:10px 0 2px}'
    + '.plugin-updates-footer>.w-section{margin:8px 0 0;padding:0;border:0}'
    + '.plugin-updates-footer .w-toolbar{margin-top:8px!important}'
    + '.plugin-updates-footer .w-switch-label{max-width:100%;gap:12px;align-items:flex-start}'
    + '.plugin-updates-footer .w-switch-track{flex-shrink:0}'
    + '.plugin-updates-footer .updates-notes{margin-top:8px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l3,#e5e7eb);border-radius:8px;background:var(--dsw-alias-bg-base,var(--w-bg,#fff))}'
    + '.plugin-updates-footer .updates-notes pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto;margin:6px 0;padding:10px;font:12px/1.65 ui-monospace,monospace}'
    + '.plugin-updates-footer .updates-notes pre code{font:inherit;background:transparent;padding:0}'
    + '.plugin-updates-footer .updates-links{display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px;margin-top:10px;padding-top:8px;border-top:1px dashed var(--dsw-alias-border-l3,#e5e7eb);font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary,#657080)}'
    + '.plugin-updates-footer .updates-links a{color:inherit;text-decoration:none;display:inline-flex;align-items:center;min-block-size:24px;gap:4px}'
    + '.plugin-updates-footer .updates-links a:hover{color:var(--dsw-alias-label-primary,#202124);text-decoration:underline}'
    + '.plugin-updates-footer .updates-links a:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#6b79df);outline-offset:3px;border-radius:4px}'
    + '.plugin-updates-footer .w-overlay{z-index:1002}'
    + '.plugin-updates-footer .updates-auto-nudge{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;margin-top:6px;font-size:12px;color:var(--dsw-alias-label-secondary,#657080)}'
    + '@media(pointer:coarse){.plugin-updates-footer .w-button.is-sm{min-block-size:32px;min-height:32px;padding:5px 11px}}'
    + '@media(prefers-reduced-motion:no-preference){.plugin-updates-footer .updates-options>summary::before{transition:rotate .18s ease}.plugin-updates-footer details::details-content{transition:block-size .22s ease,content-visibility .22s ease allow-discrete}}'
    + '@media(max-width:600px){.plugin-updates-footer .updates-head{gap:8px}.plugin-updates-footer .w-toolbar{gap:6px;flex-wrap:wrap}.plugin-updates-footer .w-button{max-width:100%}}';
  function FooterFrame({ name, label, inline = false, supplement = false, head, children }) {
    return h('section', { className: 'dshw plugin-updates-footer' + (inline ? ' is-inline' : ''), 'data-plugin-update-footer': name, 'aria-label': label + (supplement ? t(' · 自动更新与反馈', ' · Auto-update and feedback') : t(' · 版本与更新', ' · Version and updates')) },
      h('style', null, W.styles),
      h('style', null, FOOTER_CSS),
      head, children);
  }
  function Panel({ name, inline = false }) {
    const snapshot = useSnapshot(), [error, setError] = useState(''), [working, setWorking] = useState(false), [checking, setChecking] = useState(false), [dialog, setDialog] = useState(null), [selectedVersion, setSelectedVersion] = useState(null), [notes, setNotes] = useState(null), [notesOpen, setNotesOpen] = useState(false), [loadingNotes, setLoadingNotes] = useState(false), [dismissedJobId, setDismissedJobId] = useState(null);
    const seenActiveJob = useRef ? useRef(null) : { current: null };
    const row = rowFor(name), original = originalRow(name), target = row?.name || name, prefs = preferences(target), job = snapshot?.job?.name === target ? snapshot.job : null;
    if (job && ['verifying', 'installing', 'cancelling'].includes(job.state)) seenActiveJob.current = job.id;
    const panelStaleTarget = !!snapshot && !!row && !!original && (!inline || (row.sourceKind === 'registry' && row.available && prefs.deferredUntil <= Date.now() && prefs.ignoredVersion !== row.release?.version));
    useEffect(() => { if (panelStaleTarget && !activeJob()) refreshIfStale(row); }, [panelStaleTarget, row?.name, row?.available, row?.checkedAt]);
    async function perform(callback) { setError(''); setWorking(true); try { await callback(); await refresh(); } catch (error) { setError(error.message); await refresh().catch(() => {}); } finally { setWorking(false); } }
    async function save(changes, consent) { await api({ action: 'preferences', name: target, revision: state.preferences.revision, changes, consent }); }
    async function check() { setError(''); setChecking(true); try { staleChecks.set(target, Date.now()); await api({ action: 'check', name: target }); await refresh(); } catch (error) { setError(error.message); } finally { setChecking(false); } }
    async function runOperation(request) {
      setDialog(null); manualOperation = true; notify();
      setError(''); setWorking(true);
      try {
        try {
          await heartbeat();
          const started = await api(request);
          seenActiveJob.current = started.id;
          while (alive) {
            await new Promise(resolve => setTimeout(resolve, 800)); await heartbeat(); await refresh();
            if (state.job?.id !== started.id) throw new Error('operation-unconfirmed');
            if (!activeJob()) break;
          }
          await refresh();
        } finally { manualOperation = false; notify(); }
      } catch (err) {
        setError(err.message);
        if (request.action === 'install' && ['check-first', 'release-changed'].includes(err?.message)) {
          staleChecks.set(target, Date.now());
          await api({ action: 'check', name: target }).catch(() => {});
        }
        await refresh().catch(() => {});
      } finally { setWorking(false); }
    }
    async function showNotes() {
      if (notesOpen) { setNotesOpen(false); return; }
      setNotesOpen(true); setNotes(null); setLoadingNotes(true); setError('');
      try { setNotes(await api({ action: 'notes', name: target, version: row.release.version })); } catch (error) { setError(error.message); } finally { setLoadingNotes(false); }
    }
    if (inline && (!snapshot || !row || !original)) return null;
    if (!snapshot) return h('p', { className: 'dshw w-muted' }, t('正在读取更新状态…', 'Loading update status…'));
    if (!row || !original) return h(W.Status, null, t('此插件尚未安装或已从当前 profile 移除。', 'This plugin is not installed in the current profile.'));
    const title = language() === 'en' ? original.labelEn : original.label;
    const ownPage = pageState(true), unconfirmed = ['unknown', 'restore-failed'].includes(snapshot.job?.state);
    const staleWindows = (snapshot.pages.clients || []).some(client => !client.fresh);
    const pageBusy = ownPage.busy || (snapshot.pages.clients || []).some(client => client.id !== id && client.busy);
    const installLocked = working || activeJob() || unconfirmed || snapshot.updaterRestart || snapshot.preferenceError || !snapshot.activity.known
      || snapshot.activity.busy || snapshot.pages.dirty || ownPage.dirty || pageBusy || !snapshot.pages.known;
    const checkingThis = checking || snapshot.checkingNames?.includes(target);
    const managed = row.sourceKind === 'registry';
    const showUpdate = managed && row.available;
    const deferred = prefs.deferredUntil > Date.now();
    const ignored = !!row.release?.version && prefs.ignoredVersion === row.release.version;
    const actionableUpdate = showUpdate && !deferred && !ignored;
    const canConfirm = showUpdate && row.release?.version === selectedVersion && !installLocked && !row.loadError;
    const isSuite = target === '@stardustlc/dsh-suite';
    const jobResult = job?.outcome?.result;
    const jobReason = reasonOf(job);
    const jobActiveThis = !!job && ['verifying', 'installing', 'cancelling'].includes(job.state);
    const canCancel = jobActiveThis && !['applying', 'restoring'].includes(job.phase);
    const jobAttentionThis = !!job && ['restart-required', 'restored', 'restore-failed', 'unknown', 'failed'].includes(job.state) && (unconfirmed || dismissedJobId !== job.id);
    const jobJustCompleted = !!job && job.state === 'complete' && seenActiveJob.current === job.id && dismissedJobId !== job.id;
    const canSuggestAuto = !!job && job.state === 'complete' && !jobReason && job.mode !== 'automatic' && (!prefs.autoInstall || prefs.autoScope !== 'compatible') && managed && !snapshot.preferenceError && dismissedJobId !== job.id;
    const inlineJobVisible = jobActiveThis || jobAttentionThis || jobJustCompleted;
    if (inline && !actionableUpdate && !inlineJobVisible && !working && !checking && !error && !dialog && !notesOpen) return null;
    const notesSection = notesOpen && h('section', { className: 'updates-notes', 'aria-label': t('更新记录', 'Release notes') },
      h('strong', null, target + ' · ' + (notes?.version || row.release?.version || '')),
      loadingNotes ? h('p', { className: 'w-muted updates-note' }, t('正在读取…', 'Loading…'))
        : notes?.text ? h('pre', { tabIndex: 0, role: 'region', 'aria-label': t('更新记录内容', 'Release notes content') }, h('code', null, notes.text))
        : h('p', { className: 'w-muted updates-note' }, t('未找到此版本的独立更新记录。', 'No separate notes were found for this version.')),
      notes?.url && h('a', { href: notes.url, target: '_blank', rel: 'noreferrer noopener' }, t('查看仓库更新记录', 'View repository changelog')));
    const windowsDialog = dialog === 'windows' && h(W.Dialog, { title: t('断开的窗口都已关闭？', 'Are the disconnected windows closed?'), closeLabel: t('关闭', 'Close'), onClose: () => setDialog(null) },
      h('div', { className: 'w-stack' }, h('p', null, t('只清除超过 45 秒未回应的其他窗口记录。请先确认它们已经关闭；仍在使用的窗口请保存修改并刷新。当前或仍在回应的窗口保护会保留。', 'Only other windows silent for over 45 seconds are cleared. Confirm that they are closed; save and refresh windows still in use. Current and responsive windows remain protected.')), h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('取消', 'Cancel')), h(W.Button, { onClick: () => { setDialog(null); void perform(() => api({ ...pageState(true), action: 'reconfirm-windows', confirmation: 'other-stale-windows-are-closed' })); } }, t('已关闭，重新确认状态', 'They are closed; reconfirm')))));
    const confirmDialog = ['automatic', 'install'].includes(dialog) && h(W.Dialog, { title: dialog === 'automatic' ? (isSuite ? t('允许 Suite 空闲时自动热更新？', 'Allow idle automatic updates for Suite?') : t('允许这个插件空闲时自动热更新？', 'Allow idle automatic updates for this plugin?')) : (isSuite ? t('确认更新 Suite 整包', 'Confirm Suite bundle update') : t('确认更新此插件', 'Confirm this plugin update')), closeLabel: t('关闭', 'Close'), onClose: () => setDialog(null) },
      dialog === 'automatic' ? h('div', { className: 'w-stack' }, h('p', null, (language() === 'en' ? row.labelEn : row.label) + ' · ' + target), isSuite && h('p', null, t('此处设置作用于 Suite 整包（包含 18 个组件）。独立安装的其他插件不受影响。', 'This setting applies to the whole Suite (including its 18 components). Other independently installed plugins are unaffected.')), h('p', null, t('你正在主动启用自动安装。只处理通过当前 DSH 与 Node 兼容性校验的稳定版本（含功能小版本与补丁，跨主版本仍需手动确认）；有任务、未保存修改、未知窗口或等待重启时暂停。', 'You are explicitly enabling automatic installation for compatible stable releases (minor and patch updates matching this DSH and Node runtime; major upgrades still require manual confirmation). Running tasks, unsaved changes, unknown windows or a pending restart pause it.')), h('p', null, t('支持热更新时原地重载，不会自动重启 DSH；其他插件不会跟着开启，可随时关闭。', 'Hot-reloads in place when supported and never restarts DSH automatically. Other plugins remain unchanged; turn it off anytime.')), h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('保持关闭', 'Keep off')), h(W.Button, { variant: 'primary', onClick: () => { setDialog(null); void perform(() => save({ checkEnabled: true, autoInstall: true, autoScope: 'compatible' }, 'enable-idle-compatible-updates')); } }, t('允许空闲自动热更新', 'Allow idle automatic updates')))) :
      h('div', { className: 'w-stack' },
        isSuite && h('p', null, t('此处操作的是 Suite 整包，包含 18 个组件。独立安装的其他插件不受影响。', 'This action applies to the whole Suite, including its 18 components. Other independently installed plugins are unaffected.')),
        h('p', { className: 'updates-version' }, target + ' · ' + row.version + ' → ' + selectedVersion),
        h('p', null, selectedVersion === row.release?.version ? t('Harness 会热更新并重新加载；需要手动重启时，更新区会显示宿主结果，停用状态会保留。', 'Harness hot-updates and reloads in place. If a manual restart is needed, it appears in the update result; disabled status is preserved.') : (showUpdate && row.release?.version ? message('release-changed') : message('check-first'))),
        h('div', { className: 'w-toolbar' }, h(W.Button, { onClick: () => setDialog(null) }, t('取消', 'Cancel')),
          showUpdate && row.release?.version && row.release.version !== selectedVersion
            ? h(W.Button, { variant: 'primary', disabled: installLocked || row.loadError, onClick: () => { setError(''); setSelectedVersion(row.release.version); } }, t('更新为 v', 'Use v') + row.release.version)
            : h(W.Button, { variant: 'primary', disabled: !canConfirm, onClick: () => runOperation({ action: 'install', name: target, version: selectedVersion, confirmation: 'update-installed-plugin' }) }, t('安装此版本', 'Install this version')))));
    const checkButton = variant => h(W.Button, { variant, className: 'is-sm', icon: 'refresh', disabled: checkingThis || !managed, onClick: check }, checkingThis ? t('正在检查…', 'Checking…') : isSuite ? t('检查整包更新', 'Check Suite updates') : t('检查更新', 'Check for updates'));
    const recheckButton = variant => h(W.Button, { variant, className: 'is-sm', icon: 'refresh', disabled: checkingThis || !managed, onClick: check }, checkingThis ? t('正在检查…', 'Checking…') : t('重新检查', 'Check again'));
    const primary = showUpdate
      ? h(W.Button, { variant: 'primary', className: 'is-sm', icon: 'download', disabled: installLocked || row.loadError, onClick: () => { setError(''); if (job && !jobActiveThis && !unconfirmed) setDismissedJobId(job.id); setSelectedVersion(row.release.version); setDialog('install'); } }, (isSuite ? t('更新 Suite 至 v', 'Update Suite to v') : t('更新至 v', 'Update to v')) + row.release.version)
      : managed ? checkButton() : null;
    if (inline) {
      const lockHint = unconfirmed ? message('operation-unconfirmed')
        : snapshot.updaterRestart ? message('restart-required')
        : snapshot.preferenceError ? message('preferences-unreadable')
        : (snapshot.pages.dirty || ownPage.dirty) ? t('请先保存修改后再更新', 'Save changes before updating')
        : (snapshot.activity.busy || pageBusy) ? t('当前任务或对话框结束后可更新', 'Finish active task or dialog to update')
        : (!snapshot.activity.known || !snapshot.pages.known) ? t('等待窗口状态确认', 'Waiting for window confirmation')
        : '';
      return h(FooterFrame, { name, label: title, inline: true, head: h('div', { className: 'updates-bar' },
        h('div', { className: 'updates-bar-info' },
          inlineJobVisible
            ? h(React.Fragment, null,
              h('span', { className: 'updates-pill' + (jobActiveThis ? ' is-accent' : ['failed', 'restore-failed', 'unknown', 'restored'].includes(job.state) ? ' is-error' : '') }, jobLabel(job)),
              job.to && h('span', { className: 'updates-mono' }, (isSuite ? 'dsh-suite ' : '') + job.from + ' → ' + job.to),
              jobReason && h('span', { className: 'updates-inline-msg is-error' }, message(jobReason)))
            : actionableUpdate ? h(React.Fragment, null,
              h('span', { className: 'updates-pill is-accent' }, isSuite ? t('Suite 新版本', 'Suite update') : t('有新版本', 'Update available')),
              h('span', { className: 'updates-mono' }, (isSuite ? 'dsh-suite ' : '') + 'v' + row.version + ' → v' + row.release.version),
              lockHint && h('span', { className: 'w-muted' }, '· ' + lockHint)) : null,
          error && h('span', { className: 'updates-inline-msg is-error', role: 'alert' }, message(error))),
        h('div', { className: 'updates-bar-actions' },
          staleWindows && actionableUpdate && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => setDialog('windows') }, t('确认已关闭窗口', 'Confirm closed windows')),
          canCancel && h(W.Button, { className: 'is-sm', disabled: job?.state === 'cancelling', onClick: () => perform(() => api({ action: 'cancel', id: job.id })) }, t('取消更新', 'Cancel update')),
          !jobActiveThis && error === 'check-first' && managed && recheckButton(actionableUpdate ? 'ghost' : 'primary'),
          !jobActiveThis && actionableUpdate && row.release && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: showNotes, 'aria-expanded': notesOpen }, t('更新记录', 'Release notes')),
          !jobActiveThis && actionableUpdate && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'later', name: target, revision: state.preferences.revision })) }, t('明天再提醒', 'Remind me tomorrow')),
          !jobActiveThis && actionableUpdate && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'ignore', name: target, revision: state.preferences.revision, version: row.release.version })) }, t('忽略此版', 'Ignore')),
          !jobActiveThis && actionableUpdate && primary,
          !jobActiveThis && !actionableUpdate && canSuggestAuto && h(W.Button, { variant: 'primary', className: 'is-sm', disabled: working, onClick: () => { setError(''); setDialog('automatic'); } }, t('开启空闲自动热更新', 'Enable idle auto-updates')),
          !jobActiveThis && !actionableUpdate && !unconfirmed && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => { setError(''); setNotesOpen(false); if (job) setDismissedJobId(job.id); } }, t('关闭', 'Dismiss')))) },
        notesSection, windowsDialog, confirmDialog);
    }
    function progress() {
      if (!job || (!jobActiveThis && !unconfirmed && dismissedJobId === job.id)) return null;
      if (job.state === 'complete' && !jobReason) {
        return job.to ? h('div', null,
          h('p', { className: 'w-muted updates-note' }, '✓ ' + jobLabel(job) + ' · ' + job.from + ' → ' + job.to + (job.mode === 'automatic' ? t(' · 自动更新', ' · Automatic update') : '')),
          canSuggestAuto && h('div', { className: 'updates-auto-nudge' },
            h('span', null, t('以后有兼容新版本时，需要空闲自动热更新吗？', 'Auto-install future compatible updates while idle?')),
            h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => { setError(''); setDialog('automatic'); } }, t('开启空闲自动热更新', 'Enable idle auto-updates')),
            h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => setDismissedJobId(job.id) }, t('关闭', 'Dismiss')))) : null;
      }
      return h('section', { className: 'w-section', role: 'status', 'aria-label': t('更新进度', 'Update progress') },
        h('h3', null, jobLabel(job)),
        job.to && h('p', { className: 'w-muted' }, job.from + ' → ' + job.to + (job.mode === 'automatic' ? t(' · 自动更新', ' · Automatic update') : '')),
        job.state === 'restart-required' && jobResult?.restartReason === 'package-moved' && h('p', { className: 'w-muted updates-note' }, t('新版已就绪；因多个独立插件共用底层依赖，请先手动重启一次 DSH 生效后再继续更新其他插件。', 'Installed; because standalone plugins share dependencies, restart DSH once before updating additional plugins.')),
        jobReason && h(W.Status, { tone: 'error' }, message(jobReason)),
        h('div', { className: 'updates-bar-actions', style: { marginTop: '6px' } },
          canCancel && h(W.Button, { className: 'is-sm', disabled: job.state === 'cancelling', onClick: () => perform(() => api({ action: 'cancel', id: job.id })) }, t('取消更新', 'Cancel update')),
          !jobActiveThis && !unconfirmed && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: () => setDismissedJobId(job.id) }, t('关闭提示', 'Dismiss'))));
    }
    function windowControls() {
      if (!staleWindows) return null;
      return h(W.Status, null, h('p', null, t('有窗口已断开，无法确认是否还有未保存修改。仍在使用的窗口请先保存并刷新；已关闭的窗口可以手动重新确认。', 'A disconnected window may contain unsaved changes. Save and refresh windows still in use. If they are closed, you can confirm that manually.')), h(W.Button, { className: 'is-sm', onClick: () => setDialog('windows') }, t('重新确认已关闭的窗口', 'Confirm closed windows')));
    }
    const incompatibleText = row.release && !row.release.compatible ? t('新版本暂不兼容当前环境：', 'Latest release is incompatible with this environment: ') + requirement(row.release) + (row.release.required ? ' (' + row.release.required + ')' : '') : '';
    const optionsSection = h('details', { className: 'updates-options' },
      h('summary', null, !original.bundledBy ? t('自动更新与提醒', 'Auto-update & reminders') : t('更新选项', 'Update options'), ' · ', prefs.checkEnabled ? t('自动检查：开', 'Checks: on') : t('自动检查：关', 'Checks: off'), ' · ', prefs.autoInstall ? (prefs.autoScope === 'compatible' ? t('空闲自动热更新：兼容版', 'Idle auto-update: compatible') : t('空闲自动热更新：仅补丁', 'Idle auto-update: patches')) : t('空闲自动热更新：关', 'Idle auto-update: off')),
      h('section', { className: 'updates-settings', 'aria-label': t('这个插件的更新偏好', 'Update preferences for this plugin') },
        h('div', null, h(W.Switch, { label: isSuite ? t('自动检查 Suite 整包更新', 'Automatically check Suite updates') : t('自动检查这个插件的更新', 'Automatically check this plugin'), checked: prefs.checkEnabled, disabled: working || !!snapshot.preferenceError || !managed, onChange: event => perform(() => save({ checkEnabled: event.target.checked })) }), h('p', { className: 'w-muted updates-note' }, t('默认开启，每 6 小时最多一次。只影响这个安装包，关闭后仍可手动检查。', 'On by default, at most every 6 hours. This affects only this bundle; manual checks remain available.'))),
        h('div', null, h(W.Switch, { label: isSuite ? t('空闲时自动热更新 Suite 兼容版本', 'Auto-install compatible Suite updates while idle') : t('空闲时自动热更新兼容版本', 'Auto-install compatible updates while idle'), checked: prefs.autoInstall, disabled: working || !!snapshot.preferenceError || !managed, onChange: event => event.target.checked ? (setError(''), setDialog('automatic')) : perform(() => save({ autoInstall: false })) }), h('p', { className: 'w-muted updates-note' }, t('默认关闭。明确开启后，仅在空闲且无未保存修改时热更新兼容稳定版（含功能小版本与补丁，不含跨主版本）。其他插件的开关不变。', 'Off by default. Explicitly enable compatible stable updates (minor and patch, excluding major) while idle with no unsaved changes. Other plugins’ settings stay unchanged.')), prefs.autoInstall && prefs.autoScope !== 'compatible' && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => { setError(''); setDialog('automatic'); } }, t('升级为包含兼容功能小版本', 'Include compatible minor updates')))));
    const errorStatus = error && h(W.Status, { tone: 'error' }, error === 'check-first' && managed ? h('div', { className: 'updates-bar-actions' }, h('span', null, message(error)), recheckButton('ghost')) : message(error));
    const linksNav = (() => {
      const ownRepo = repoUrl(original.name), suiteRepo = repoUrl('@stardustlc/dsh-suite'), starRepo = isSuite ? suiteRepo : ownRepo;
      if (!ownRepo && !starRepo) return null;
      return h('nav', { className: 'updates-links', 'aria-label': t('开源仓库与反馈', 'Repository and feedback') },
        starRepo && h('a', { href: starRepo, target: '_blank', rel: 'noreferrer noopener' }, isSuite ? t('★ 觉得好用？在 GitHub 给 dsh-suite 点个 Star', '★ Useful? Star dsh-suite on GitHub') : t('★ 觉得好用？在 GitHub 点个 Star', '★ Useful? Star on GitHub')),
        ownRepo && h('a', { href: ownRepo + '/issues', target: '_blank', rel: 'noreferrer noopener' }, t('提交建议 / 问题反馈', 'Feedback & issues')),
        isSuite && original.name !== '@stardustlc/dsh-suite' && ownRepo && h('a', { href: ownRepo, target: '_blank', rel: 'noreferrer noopener' }, t('组件仓库', 'Component repo')),
        !isSuite && suiteRepo && h('a', { href: suiteRepo, target: '_blank', rel: 'noreferrer noopener' }, t('了解 dsh-suite（18 合 1 组合包）', 'Explore dsh-suite (18-in-1 bundle)')));
    })();
    if (!original.bundledBy) {
      // Native bundle detail pages in DSH already render their own Version & Source sections
      // ("重新检查", version list & "更新" button). Keep only non-duplicative auto-update preferences,
      // inline changelog notes, compatibility/error diagnostics, and GitHub feedback links here.
      return h(FooterFrame, { name, label: title, supplement: true, head: h('div', { className: 'updates-compact-bar' },
        optionsSection,
        (row.release || (showUpdate && (!deferred || !ignored))) && h('div', { className: 'updates-head-actions' },
          row.release && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: showNotes, 'aria-expanded': notesOpen }, t('更新记录', 'Release notes')),
          showUpdate && !deferred && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'later', name: target, revision: state.preferences.revision })) }, t('推迟提醒 24h', 'Snooze 24h')),
          showUpdate && !ignored && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'ignore', name: target, revision: state.preferences.revision, version: row.release.version })) }, t('忽略此版提醒', 'Mute reminder')))) },
        notesSection,
        incompatibleText && h(W.Status, null, incompatibleText),
        errorStatus, snapshot.preferenceError && h(W.Status, { tone: 'error' }, message('preferences-unreadable')),
        snapshot.pendingRestart && h(W.Status, null, snapshot.updaterRestart ? message('restart-required') : t('已有插件更新等待手动重启后生效；空闲自动热更新已暂停，建议先重启一次 DSH 再继续更新其他共用依赖的插件。', 'An update awaits a manual restart; idle auto-updates are paused. Restart DSH once before updating other plugins that share dependencies.')),
        prefs.autoInstall && snapshot.autoReady === false && h(W.Status, null, message('page-not-ready')),
        (prefs.autoInstall || jobActiveThis) && windowControls(),
        jobActiveThis && (snapshot.pages.dirty || ownPage.dirty) && h(W.Status, null, message('page-dirty')),
        jobActiveThis && (snapshot.activity.busy || pageBusy) && h(W.Status, null, message(snapshot.activity.busy ? 'busy' : 'page-busy')),
        deferred && h('p', { className: 'w-muted updates-note' }, t('已推迟此插件的工作台更新提示 24 小时。', 'Workbench update notices for this plugin are snoozed for 24 hours.')),
        unconfirmed && h(W.Status, { tone: 'error' }, message('operation-unconfirmed')),
        progress(),
        linksNav,
        windowsDialog, confirmDialog
      );
    }
    const status = !managed ? t('本地 / 外部来源，保留原安装方式', 'Local / external source; keep original install method') : row.loadError ? t('加载异常，请先检查原生插件管理', 'Loading error; check native plugin management') : row.error ? t('检查失败，可以重试', 'Check failed; retry available') : incompatibleText || (row.available ? (ignored ? t('已忽略提醒，仍可手动更新', 'Reminder ignored; manual update available') : t('有兼容的新版本', 'Compatible update available')) : row.checkedAt ? t('当前已是最新稳定版', 'Latest stable version') : t('尚未检查', 'Not checked yet'));
    return h(FooterFrame, { name, label: title, head: h('div', { className: 'updates-head' },
      h('div', null,
        h('div', { className: 'updates-title-row' }, h('h2', null, t('随 Suite 整包管理', 'Managed via Suite bundle')), h('span', { className: 'updates-mono updates-badge' }, original.name + ' · v' + original.version)),
        h('p', { className: 'w-muted updates-meta-line' }, status, row.checkedAt ? ' · ' + t('上次检查：', 'Last checked: ') + new Date(row.checkedAt).toLocaleString(language() === 'en' ? 'en-US' : 'zh-CN') : ''),
        h('p', { className: 'updates-version updates-note' }, target + ' · v' + row.version, row.release?.version && row.release.version !== row.version ? ' → v' + row.release.version : '')),
      h('div', { className: 'updates-head-actions' },
        showUpdate && checkButton('ghost'),
        row.release && h(W.Button, { variant: 'ghost', className: 'is-sm', onClick: showNotes, 'aria-expanded': notesOpen }, t('更新记录', 'Release notes')),
        showUpdate && !deferred && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'later', name: target, revision: state.preferences.revision })) }, t('明天再提醒', 'Remind me tomorrow')),
        showUpdate && !ignored && h(W.Button, { variant: 'ghost', className: 'is-sm', disabled: working, onClick: () => perform(() => api({ action: 'ignore', name: target, revision: state.preferences.revision, version: row.release.version })) }, t('忽略此版本提醒', 'Ignore this reminder')),
        primary)) },
      notesSection,
      optionsSection,
      errorStatus, snapshot.preferenceError && h(W.Status, { tone: 'error' }, message('preferences-unreadable')),
      snapshot.pendingRestart && h(W.Status, null, snapshot.updaterRestart ? message('restart-required') : t('已有插件更新等待手动重启后生效；空闲自动热更新已暂停。', 'An update awaits a manual restart; idle auto-updates are paused.')),
      prefs.autoInstall && snapshot.autoReady === false && h(W.Status, null, message('page-not-ready')),
      windowControls(),
      (showUpdate || jobActiveThis) && (snapshot.pages.dirty || ownPage.dirty) && h(W.Status, null, message('page-dirty')),
      (showUpdate || jobActiveThis) && (snapshot.activity.busy || pageBusy) && h(W.Status, null, message(snapshot.activity.busy ? 'busy' : 'page-busy')),
      deferred && h(W.Status, null, t('已推迟 Suite 提醒和自动安装 24 小时，仍可手动更新。', 'Suite reminders and automatic installation are deferred for 24 hours. Manual updates remain available.')),
      unconfirmed && h(W.Status, { tone: 'error' }, message('operation-unconfirmed')),
      progress(),
      linksNav,
      windowsDialog, confirmDialog
    );
  }
  function InlineFooter({ name }) { return h(Panel, { name, inline: true }); }
  function NativeFooter({ subject }) {
    const snapshot = useSnapshot(), name = __stardustUpdatesDetailName(subject, snapshot?.rows || []);
    return name ? h(Panel, { name, inline: false }) : null;
  }
  function register() {
    if (!alive) return;
    if (!registered) {
      registered = true; pool.clients.add(client);
      ctx.slots.inject('plugins.detail.section', () => ctx.slots.register({ name: 'plugins.detail.section', id: 'stardustlc.plugin-update-footer', order: 1000 }, NativeFooter));
      notify();
    }
  }
  async function poll() {
    if (inPoll || !alive || !shared.refs.size) return;
    inPoll = true;
    try { await refresh(); register(); await heartbeat(); }
    catch { /* Owner-only controls stay absent for guests and unsupported hosts. */ }
    finally { inPoll = false; }
  }
  const timer = setInterval(() => { void poll(); }, 15000), first = setTimeout(() => { void poll(); }, 100);
  const client = { t, Footer: InlineFooter, NativeFooter, Button: W.Button, open(name) { const footer = [...document.querySelectorAll('[data-plugin-update-footer]')].find(node => node.getAttribute('data-plugin-update-footer') === name); if (!footer) return false; footer.scrollIntoView({ block: 'end', behavior: 'smooth' }); return true; }, has: name => registered && !!originalRow(name), row: rowFor, dispose() {
    close(); alive = false; clearTimeout(first); clearInterval(timer); pool.clients.delete(client);
    pool.listeners.delete(guardChanged); listeners.clear();
    for (const event of ['pointerdown', 'keydown', 'input']) document.removeEventListener(event, interaction, true);
    window.removeEventListener('pagehide', close);
    for (const controller of requests) controller.abort();
    for (const listener of pool.viewListeners) listener();
  } };
  return client;
}

/* STARDUSTLC_UPDATE_CLIENT_BODY_START */
// Generated from templates and CSS Modules. Edit the sources.
/* Bundled third-party license notices
clsx

MIT License

Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

domelementtype

Copyright (c) Felix Böhm
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

domhandler

Copyright (c) Felix Böhm
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

entities

Copyright (c) Felix Böhm
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

htmlparser2

Copyright 2010, 2011, Chris Winberry <chris@winberry.net>. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/
(function () {
const emailUtf8Length = value => new TextEncoder().encode(value).byteLength;
var emailUi=(()=>{var Le=Object.defineProperty;var Na=Object.getOwnPropertyDescriptor;var za=Object.getOwnPropertyNames;var Ia=Object.prototype.hasOwnProperty;var Xe=(a,e)=>{for(var t in e)Le(a,t,{get:e[t],enumerable:true})};var Ea=(a,e,t,s)=>{if(e&&typeof e==="object"||typeof e==="function"){for(let r of za(e))if(!Ia.call(a,r)&&r!==t)Le(a,r,{get:()=>e[r],enumerable:!(s=Na(e,r))||s.enumerable})}return a};var Ba=a=>Ea(Le({},"__esModule",{value:true}),a);var bt={};Xe(bt,{clsx:()=>Ke,drafts:()=>da,mailbox:()=>na,richEmailBody:()=>Ta,settings:()=>oa,styleKit:()=>Oe,ui:()=>ia});function Ze(a){var e,t,s="";if("string"==typeof a||"number"==typeof a)s+=a;else if("object"==typeof a)if(Array.isArray(a)){var r=a.length;for(e=0;e<r;e++)a[e]&&(t=Ze(a[e]))&&(s&&(s+=" "),s+=t)}else for(t in a)a[t]&&(s&&(s+=" "),s+=t);return s}function Da(){for(var a,e,t=0,s="",r=arguments.length;t<r;t++)(a=arguments[t])&&(e=Ze(a))&&(s&&(s+=" "),s+=e);return s}var Ke=Da;var Oe={};Xe(Oe,{DSH_DEFAULT_FONT:()=>Ce,DSH_DEFAULT_STYLE:()=>Re,DSH_FONTS:()=>he,DSH_FONT_EVENT:()=>le,DSH_FONT_STORAGE_KEY:()=>ze,DSH_ICON_PATHS:()=>Se,DSH_STYLES:()=>ce,DSH_STYLE_EVENT:()=>de,DSH_STYLE_STORAGE_KEY:()=>Ne,DshSkeleton:()=>Ua,DshSplitResizer:()=>Ja,createFontSwitcherComponent:()=>ra,createOverlaySyncRef:()=>sa,createSkeletonComponent:()=>Fa,createSplitResizerComponent:()=>ja,createStyleSwitcherComponent:()=>Ya,getDshFontPreset:()=>ea,getDshStylePreset:()=>je,normalizeDshFont:()=>W,normalizeDshStyle:()=>P,readDshFont:()=>Y,readDshStyle:()=>K,renderDshIcon:()=>Ue,renderDshSkeleton:()=>We,renderDshSplitResizer:()=>Ye,resolveHostPrimitives:()=>Pe,subscribeDshFont:()=>ta,subscribeDshStyle:()=>aa,syncPortaledFont:()=>ue,syncPortaledOverlays:()=>pe,useDshFont:()=>Fe,useDshStyle:()=>Je,useResizableSplit:()=>La,useSlidingTabIndicator:()=>qa,writeDshFont:()=>Te,writeDshStyle:()=>Ae});var Ne="dsh-stardust:ui-style";var de="dsh-stardust-style";var Re="harness";var ze="dsh-stardust:ui-font";var le="dsh-stardust-font";var Ce="arcade";var he=Object.freeze([Object.freeze({id:"arcade",zh:"\u5E7C\u5706\u7B49\u5BBD\uFF08\u9ED8\u8BA4\uFF09",zhShort:"\u5E7C\u5706",en:"YouYuan Mono (Default)",enShort:"YouYuan"}),Object.freeze({id:"auto",zh:"\u8DDF\u968F\u98CE\u683C\u4E13\u5C5E\u5B57",zhShort:"\u4E13\u5C5E\u5B57",en:"Match Style Font",enShort:"Style Font"}),Object.freeze({id:"songkai",zh:"\u4E2D\u5B8B+\u6977\u4E66",zhShort:"\u4E2D\u5B8B\u6977",en:"Song + Kai",enShort:"Song+Kai"}),Object.freeze({id:"fangsong",zh:"\u5DE5\u7A0B\u4EFF\u5B8B",zhShort:"\u4EFF\u5B8B",en:"Blueprint FangSong",enShort:"FangSong"}),Object.freeze({id:"poster",zh:"\u91CD\u78C5\u753B\u62A5\u9ED1",zhShort:"\u753B\u62A5\u9ED1",en:"Poster Sans",enShort:"Poster"}),Object.freeze({id:"retro98",zh:"\u5343\u79A7\u65B0\u5B8B",zhShort:"\u65B0\u5B8B98",en:"Retro 98 SimSun",enShort:"Retro 98"}),Object.freeze({id:"serif",zh:"\u601D\u6E90\u4E66\u5B8B",zhShort:"\u4E66\u5B8B",en:"Book Serif",enShort:"Serif"}),Object.freeze({id:"modern",zh:"\u73B0\u4EE3\u601D\u6E90\u9ED1",zhShort:"\u601D\u6E90\u9ED1",en:"Modern Sans",enShort:"Modern"})]);var ce=Object.freeze([Object.freeze({id:"harness",zh:"\u539F\u751F\u6E05\u900F",zhShort:"\u539F\u751F",en:"Native Airy",enShort:"Native",swatch:"#4176e6",surface:"#f8fafc"}),Object.freeze({id:"cream",zh:"\u7C73\u767D\u7EB8\u611F",zhShort:"\u7C73\u767D\u8272",en:"Warm Cream",enShort:"Cream",swatch:"#9e5829",surface:"#faf7f0"}),Object.freeze({id:"claude",zh:"Claude \u6696\u4E66\u5377",zhShort:"Claude\u98CE",en:"Claude Warmth",enShort:"Claude",swatch:"#c96442",surface:"#f5f4ed"}),Object.freeze({id:"pixel8bit",zh:"8-Bit \u638C\u673A",zhShort:"8-Bit",en:"Bright 8-Bit",enShort:"8-Bit",swatch:"#2e7d5b",surface:"#f4f6e8"}),Object.freeze({id:"mint",zh:"\u6674\u7A7A\u8584\u8377",zhShort:"\u8584\u8377",en:"Airy Mint",enShort:"Mint",swatch:"#0f766e",surface:"#f5fafb"}),Object.freeze({id:"glass",zh:"\u6674\u663C\u7409\u7483",zhShort:"\u7409\u7483",en:"Daylight Glass",enShort:"Glass",swatch:"#4f6df5",surface:"#f3f7ff"}),Object.freeze({id:"eink",zh:"\u62A4\u773C\u58A8\u6C34\u5C4F",zhShort:"\u58A8\u6C34\u5C4F",en:"E-Ink Paper",enShort:"E-Ink",swatch:"#171716",surface:"#f2f1ec"}),Object.freeze({id:"blueprint",zh:"\u5DE5\u7A0B\u6652\u56FE",zhShort:"\u6652\u56FE",en:"Blueprint",enShort:"Blueprint",swatch:"#0d3b66",surface:"#eaf3fb"}),Object.freeze({id:"risograph",zh:"\u6CE2\u666E\u5B54\u7248",zhShort:"\u5B54\u7248",en:"Riso Zine",enShort:"Riso",swatch:"#ff3e7f",surface:"#faf6ee"}),Object.freeze({id:"win98",zh:"\u5343\u79A7\u590D\u53E4",zhShort:"\u590D\u53E498",en:"Retro 98",enShort:"Retro 98",swatch:"#1b4f9c",surface:"#dcdcdc"}),Object.freeze({id:"songhui",zh:"\u5B8B\u97F5\u6731\u7802",zhShort:"\u5B8B\u97F5",en:"Song Xuan",enShort:"Song",swatch:"#b83b2a",surface:"#f7f3e8"}),Object.freeze({id:"frutiger",zh:"\u6674\u7A7A\u6C34\u6676",zhShort:"\u6C34\u6676",en:"Aqua Gloss",enShort:"Aqua",swatch:"#0ea5e9",surface:"#eaf7ff"}),Object.freeze({id:"gazette",zh:"\u94C5\u5B57\u6668\u62A5",zhShort:"\u6668\u62A5",en:"Gazette",enShort:"Gazette",swatch:"#9b1c1c",surface:"#f6f3ec"})]);var $e=new Set(ce.map(a=>a.id));var Ma=new Set(he.map(a=>a.id));function _(a){if(a&&typeof a==="object")return a;return typeof window!=="undefined"?window:null}function Ie(a){if(a&&typeof a.createElement==="function")return a;if(typeof globalThis!=="undefined"&&globalThis.React&&typeof globalThis.React.createElement==="function"){return globalThis.React}return null}function $(a,e,t){const s=Number.isFinite(e)?e:0;const r=Number.isFinite(t)?Math.max(s,t):s;const i=Number(a);if(!Number.isFinite(i))return s;return Math.min(r,Math.max(s,i))}function P(a){const e=typeof a==="string"?a.trim():"";return $e.has(e)?e:Re}function je(a){const e=P(a);return ce.find(t=>t.id===e)||ce[0]}function K(a){const e=_(a);if(!e)return Re;try{const t=e.localStorage?.getItem(Ne);return P(t)}catch{return Re}}function W(a){const e=typeof a==="string"?a.trim():"";return Ma.has(e)?e:Ce}function ea(a){const e=W(a);return he.find(t=>t.id===e)||he[0]}function Y(a){const e=_(a);if(!e)return Ce;try{const t=e.localStorage?.getItem(ze);return W(t)}catch{return Ce}}function pe(a,e,t){const s=P(a);const r=W(t??Y());const i=e||(typeof document!=="undefined"?document:null);if(!i)return;if(i.documentElement&&typeof i.documentElement.setAttribute==="function"){i.documentElement.setAttribute("data-dsh-font",r)}if(typeof i.querySelectorAll!=="function")return;for(const n of i.querySelectorAll("[data-dsh-portal-synced]")){n.setAttribute("data-dsh-style",s);n.setAttribute("data-dsh-font",r);if(!n.hasAttribute("data-window-drag-exclude")){n.setAttribute("data-window-drag-exclude","")}}}function ue(a,e){const t=W(a);const s=e||(typeof document!=="undefined"?document:null);if(!s)return;if(s.documentElement&&typeof s.documentElement.setAttribute==="function"){s.documentElement.setAttribute("data-dsh-font",t)}if(typeof s.querySelectorAll!=="function")return;for(const r of s.querySelectorAll("[data-dsh-portal-synced], [data-dsh-style]")){r.setAttribute("data-dsh-font",t)}}function Ae(a,e){const t=P(a);const s=_(e);if(s){try{s.localStorage?.setItem(Ne,t)}catch{}pe(t,s.document,Y(s));if(typeof s.dispatchEvent==="function"){try{const r=s.CustomEvent||(typeof CustomEvent==="function"?CustomEvent:null);if(r){s.dispatchEvent(new r(de,{detail:{style:t}}))}else if(typeof Event==="function"){const i=new Event(de);i.detail={style:t};s.dispatchEvent(i)}}catch{}}}return t}function Te(a,e){const t=W(a);const s=_(e);if(s){try{s.localStorage?.setItem(ze,t)}catch{}ue(t,s.document);if(typeof s.dispatchEvent==="function"){try{const r=s.CustomEvent||(typeof CustomEvent==="function"?CustomEvent:null);if(r){s.dispatchEvent(new r(le,{detail:{font:t}}))}else if(typeof Event==="function"){const i=new Event(le);i.detail={font:t};s.dispatchEvent(i)}}catch{}}}return t}function aa(a,e){const t=_(e);if(!t||typeof t.addEventListener!=="function"||typeof a!=="function"){return()=>{}}const s=i=>{const n=P(i?.detail?.style??K(t));pe(n,t.document,Y(t));a(n)};const r=i=>{if(i&&i.key!==null&&i.key!==void 0&&i.key!==Ne){return}const n=P(i?.newValue??K(t));pe(n,t.document,Y(t));a(n)};t.addEventListener(de,s);t.addEventListener("storage",r);return()=>{t.removeEventListener(de,s);t.removeEventListener("storage",r)}}function ta(a,e){const t=_(e);if(!t||typeof t.addEventListener!=="function"||typeof a!=="function"){return()=>{}}const s=i=>{const n=W(i?.detail?.font??Y(t));ue(n,t.document);a(n)};const r=i=>{if(i&&i.key!==null&&i.key!==void 0&&i.key!==ze){return}const n=W(i?.newValue??Y(t));ue(n,t.document);a(n)};t.addEventListener(le,s);t.addEventListener("storage",r);return()=>{t.removeEventListener(le,s);t.removeEventListener("storage",r)}}function Je(a,e){if(!a||typeof a.useState!=="function"){return[K(e),i=>Ae(i,e)]}const[t,s]=a.useState(()=>K(e));if(typeof a.useEffect==="function"){a.useEffect(()=>{const i=K(e);s(n=>n===i?n:i);pe(i,_(e)?.document,Y(e));return aa(n=>{s(c=>c===n?c:n)},e)},[e])}const r=i=>{const n=typeof i==="function"?i(t):i;const c=Ae(n,e);s(c);return c};return[t,r]}function Fe(a,e){if(!a||typeof a.useState!=="function"){return[Y(e),i=>Te(i,e)]}const[t,s]=a.useState(()=>Y(e));if(typeof a.useEffect==="function"){a.useEffect(()=>{const i=Y(e);s(n=>n===i?n:i);ue(i,_(e)?.document);return ta(n=>{s(c=>c===n?c:n)},e)},[e])}const r=i=>{const n=typeof i==="function"?i(t):i;const c=Te(n,e);s(c);return c};return[t,r]}function sa(a,e){const t=P(a);const s=W(e??Y());return r=>{if(!r||typeof r.setAttribute!=="function")return;r.setAttribute("data-dsh-style",t);r.setAttribute("data-dsh-font",s);r.setAttribute("data-window-drag-exclude","");r.setAttribute("data-dsh-portal-synced","true");if(typeof r.closest==="function"){const i=r.closest('[role="dialog"], [role="alertdialog"], [role="menu"], dialog');if(i){i.setAttribute("data-dsh-style",t);i.setAttribute("data-dsh-font",s);i.setAttribute("data-window-drag-exclude","");i.setAttribute("data-dsh-portal-synced","true")}}}}var Se=Object.freeze({mail:["M3 5h18v14H3z","m3 6 9 7 9-7"],inbox:["M4 13 6 5h12l2 8v6H4z","M4 13h5l1 3h4l1-3h5"],send:["m22 2-7 20-4-9-9-4Z","M22 2 11 13"],search:["M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z","m16 16 5 5"],plus:["M12 5v14M5 12h14"],refresh:["M20 7a9 9 0 1 0 1 8","M20 2v5h-5"],close:["m6 6 12 12M18 6 6 18"],left:["m14 5-7 7 7 7"],right:["m10 5 7 7-7 7"],down:["m5 9 7 7 7-7"],download:["M12 3v12m-5-5 5 5 5-5","M4 16v5h16v-5"],file:["M4 3h10l6 6v12H4z","M14 3v6h6M8 13h8M8 17h6"],folder:["M3 5h7l2 3h9v12H3z"],edit:["m15 4 5 5-10 10-6 1 1-6Z","m13 6 5 5"],trash:["M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"],info:["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z","M12 11v6M12 7h.01"],check:["m5 12 4 4L19 6"],star:["m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"],reply:["m9 5-7 7 7 7v-5h6c3 0 5 2 6 5 0-8-4-11-12-11Z"],lock:["M5 10h14v11H5z","M8 10V7a4 4 0 0 1 8 0v3M12 14v3"],clip:["m8 13 6-6a2.5 2.5 0 0 1 3.5 3.5l-7 7a4 4 0 0 1-5.7-5.7l8-8a5 5 0 0 1 7.1 7.1l-8 8"],clock:["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z","M12 6v6l4 2"],image:["M3 4h18v16H3z","m3 17 6-6 5 5 2-2 5 5M16 8h.01"],copy:["M9 9h10v11H9z","M5 15H4V4h10v1"],external:["M14 4h6v6","M10 14 20 4","M18 13v6H5V6h6"],link:["M10 13a5 5 0 0 0 7.1 0l2.8-2.8a5 5 0 0 0-7.1-7.1L11 4.9","M14 11a5 5 0 0 0-7.1 0l-2.8 2.8a5 5 0 0 0 7.1 7.1L13 19.1"],play:["m7 5 12 7-12 7Z"],palette:["M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1 0-4h4a5 5 0 0 0 5-5c0-2.2-4-4-9-4Z","M7.5 10.5h.01M10.5 7.5h.01M14.5 7.5h.01"],sparkles:["m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z","M19 15v4M17 17h4"],calendar:["M4 6h16v14H4z","M8 3v4M16 3v4M4 10h16"],shield:["M12 3 5 6v6c0 5 3.4 8.3 7 9 3.6-.7 7-4 7-9V6Z"],rss:["M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z","M4 11a9 9 0 0 1 9 9","M4 5a15 15 0 0 1 15 15"],grip:["M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01"]});function Ue(a,{name:e="file",size:t=16,paths:s=Se,...r}={}){const i=a.createElement;const n=s[e]||Se[e]||Se.file;return i("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.65,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",focusable:"false","data-dsh-icon":e,...r},n.map((c,w)=>i("path",{key:w,d:c})))}function qa(a,e,t={}){const s=typeof a?.useRef==="function"?a.useRef(null):{current:null};const[r,i]=typeof a?.useState==="function"?a.useState({x:0,width:0,ready:false}):[{x:0,width:0,ready:false},()=>{}];const n=()=>{const d=s.current;if(!d||typeof d.querySelector!=="function")return;const u=d.querySelector('[role="tab"][aria-selected="true"]');if(!u){d.setAttribute?.("data-indicator-ready","false");i(h=>h.ready?{x:0,width:0,ready:false}:h);return}let y=typeof u.offsetLeft==="number"?u.offsetLeft:0;let S=typeof u.offsetWidth==="number"?u.offsetWidth:0;if(!S&&typeof u.getBoundingClientRect==="function"&&typeof d.getBoundingClientRect==="function"){const h=u.getBoundingClientRect();const v=d.getBoundingClientRect();if(h&&v&&h.width>0){S=h.width;y=h.left-v.left+(d.scrollLeft||0)}}const x=S>0;if(d.style&&typeof d.style.setProperty==="function"){d.style.setProperty("--dsh-tab-x",`${Math.round(y)}px`);d.style.setProperty("--dsh-tab-w",`${Math.round(S)}px`)}d.setAttribute?.("data-indicator-ready",x?"true":"false");i(h=>h.x===Math.round(y)&&h.width===Math.round(S)&&h.ready===x?h:{x:Math.round(y),width:Math.round(S),ready:x})};const c=typeof a?.useLayoutEffect==="function"?a.useLayoutEffect:typeof a?.useEffect==="function"?a.useEffect:null;if(c){const d=Array.isArray(t?.deps)?[e,...t.deps]:[e];c(()=>{n();const u=s.current;const y=_(t?.win);let S=null;if(u&&typeof y?.ResizeObserver==="function"){try{S=new y.ResizeObserver(()=>n());S.observe(u)}catch{S=null}}if(y&&typeof y.addEventListener==="function"){y.addEventListener("resize",n)}return()=>{S?.disconnect?.();if(y&&typeof y.removeEventListener==="function"){y.removeEventListener("resize",n)}}},d)}const w={"--dsh-tab-x":`${r.x}px`,"--dsh-tab-w":`${r.width}px`};return{tablistRef:s,ready:r.ready,indicatorStyle:w,tablistProps:{ref:s,"data-dsh-tablist":"","data-indicator-ready":r.ready?"true":"false"},indicatorProps:{className:"dsh-tab-indicator","aria-hidden":"true",style:w},syncIndicator:n}}function La(a,{key:e,initial:t=320,min:s=220,max:r=560,orientation:i="vertical",reverse:n=false,win:c}={}){const w=$(t,s,r);const d=()=>{const f=_(c);if(!e||!f)return w;try{const g=f.localStorage?.getItem(e);if(g==null||g==="")return w;const m=Number(g);return Number.isFinite(m)?$(m,s,r):w}catch{return w}};const u=f=>{const g=Math.round($(f,s,r));const m=_(c);if(e&&m){try{m.localStorage?.setItem(e,String(g))}catch{}}return g};const y=Boolean(a&&typeof a.useState==="function");const[S,x]=y?a.useState(()=>d()):[d(),()=>{}];const[h,v]=y?a.useState(false):[false,()=>{}];const R=f=>{const g=typeof f==="function"?f(S):f;const m=u(g);x(m);return m};const l=()=>{const f=u(w);x(f);return f};return{size:S,width:S,setSize:R,reset:l,isDragging:h,setIsDragging:v,paneStyle:{"--dsh-split-size":`${S}px`},resizerProps:{value:S,initial:w,min:s,max:r,orientation:i,reverse:n,onChange:R,onReset:l,onDraggingChange:v}}}function Ye(a,{value:e=320,initial:t,min:s=220,max:r=560,orientation:i="vertical",reverse:n=false,step:c=16,label:w="Resize pane",onChange:d,onReset:u,onDraggingChange:y,className:S,style:x,...h}={}){const v=Ie(a);if(!v)return null;const R=v.createElement;const l=typeof v.useRef==="function"?v.useRef(null):{current:null};const[f,g]=typeof v.useState==="function"?v.useState(false):[false,()=>{}];const m=i==="horizontal";const T=Math.round($(e,s,r));const D=b=>{g(b);y?.(b)};const z=()=>{const b=l.current;if(b?.cleanup){b.cleanup()}l.current=null};if(typeof v.useEffect==="function"){v.useEffect(()=>z,[])}const q=(b,k)=>{const N=l.current;if(!N)return;const X=m?k-N.startY:b-N.startX;const Z=n?-X:X;const ae=Math.round($(N.startValue+Z,s,r));d?.(ae)};const A=b=>{if(b?.button!==void 0&&b.button!==0)return;b?.preventDefault?.();const k=b?.currentTarget;const N=b?.pointerId;const X=Number(b?.clientX??0);const Z=Number(b?.clientY??0);z();let ae=false;if(k&&typeof k.setPointerCapture==="function"&&N!==void 0){try{k.setPointerCapture(N);ae=true}catch{ae=false}}const O=_();let Ge=null;if(!ae&&O&&typeof O.addEventListener==="function"){const ke=Ve=>q(Number(Ve.clientX??0),Number(Ve.clientY??0));const te=()=>{z();D(false)};O.addEventListener("pointermove",ke);O.addEventListener("mousemove",ke);O.addEventListener("pointerup",te);O.addEventListener("mouseup",te);O.addEventListener("pointercancel",te);Ge=()=>{O.removeEventListener("pointermove",ke);O.removeEventListener("mousemove",ke);O.removeEventListener("pointerup",te);O.removeEventListener("mouseup",te);O.removeEventListener("pointercancel",te)}}l.current={startX:X,startY:Z,startValue:T,pointerId:N,captured:ae,cleanup:Ge};D(true)};const B=b=>{if(!l.current)return;q(Number(b?.clientX??0),Number(b?.clientY??0))};const I=b=>{const k=l.current;if(!k)return;if(k.captured&&b?.currentTarget&&typeof b.currentTarget.releasePointerCapture==="function"&&k.pointerId!==void 0){try{b.currentTarget.releasePointerCapture(k.pointerId)}catch{}}z();D(false)};const M=b=>{const k=b?.key;const N=b?.shiftKey?c*2:c;const X=n?-1:1;let Z=null;if(!m&&k==="ArrowLeft"||m&&k==="ArrowUp"){Z=$(T-N*X,s,r)}else if(!m&&k==="ArrowRight"||m&&k==="ArrowDown"){Z=$(T+N*X,s,r)}else if(k==="Home"){Z=s}else if(k==="End"){Z=r}if(Z!==null){b?.preventDefault?.();d?.(Math.round(Z))}};const j=()=>{if(typeof u==="function"){u()}else if(t!==void 0){d?.(Math.round($(t,s,r)))}};return R("div",{...h,role:"separator",tabIndex:0,"aria-orientation":i,"aria-label":w,"aria-valuemin":s,"aria-valuemax":r,"aria-valuenow":T,"data-dsh-resizer":"","data-dragging":f?"true":"false","data-window-drag-exclude":"",className:["dsh-split-resizer",S].filter(Boolean).join(" "),style:x,onPointerDown:A,onPointerMove:B,onPointerUp:I,onPointerCancel:I,onLostPointerCapture:I,onKeyDown:M,onDoubleClick:j})}function ja(a){return function e(t){return Ye(a,t)}}function Ja(a={}){const{React:e,...t}=a;return Ye(Ie(e),t)}function We(a,{variant:e="text",lines:t=3,width:s,height:r,radius:i,animated:n=true,label:c,className:w,style:d,...u}={}){const y=Ie(a);if(!y)return null;const S=y.createElement;const x=c?{role:"status","aria-busy":"true","aria-label":c}:{"aria-hidden":"true"};const h=(l,f,g)=>S("span",{key:g,className:"dsh-skeleton","data-dsh-skeleton":e,"data-animated":n?"true":"false",style:{width:l??s,height:f??r,borderRadius:i}});if(e==="circle"){return S("span",{...x,...u,className:["dsh-skeleton","dsh-skeleton-circle",w].filter(Boolean).join(" "),"data-dsh-skeleton":"circle","data-animated":n?"true":"false",style:{width:s,height:r,...d}})}if(e==="rect"){return S("span",{...x,...u,className:["dsh-skeleton",w].filter(Boolean).join(" "),"data-dsh-skeleton":"rect","data-animated":n?"true":"false",style:{width:s,height:r??"80px",borderRadius:i,...d}})}if(e==="row"){return S("div",{...x,...u,className:["dsh-skeleton-row",w].filter(Boolean).join(" "),style:d},S("span",{className:"dsh-skeleton dsh-skeleton-circle","data-dsh-skeleton":"circle","data-animated":n?"true":"false"}),S("div",{className:"dsh-skeleton-group"},h("58%","12px","r1"),h("84%","10px","r2")))}if(e==="card"){return S("div",{...x,...u,className:["dsh-skeleton-card",w].filter(Boolean).join(" "),style:d},h("46%","14px","c1"),h("100%","11px","c2"),h("74%","11px","c3"))}const v=Math.max(1,Math.round(Number(t)||1));if(v===1){return S("span",{...x,...u,className:["dsh-skeleton",w].filter(Boolean).join(" "),"data-dsh-skeleton":"text","data-animated":n?"true":"false",style:{width:s,height:r,borderRadius:i,...d}})}const R=[];for(let l=0;l<v;l+=1){const f=l===v-1;R.push(h(f?"68%":"100%",r,`l-${l}`))}return S("div",{...x,...u,className:["dsh-skeleton-group",w].filter(Boolean).join(" "),style:d},R)}function Fa(a){return function e(t){return We(a,t)}}function Ua(a={}){const{React:e,...t}=a;return We(Ie(e),t)}var Qe=new WeakMap;function Pe(a,e){const t=a.createElement;let s=null;if(typeof e==="function"){try{s=e("@deepseek-ai/dsh-client-ui-primitives")||null}catch{s=null}}let r=Qe.get(a);if(!r){r=new Map;Qe.set(a,r)}if(r.has(s))return r.get(s);function i({variant:R="ghost",size:l="md",icon:f,className:g,children:m,type:T="button",...D}){const z=["dsh-btn",`dsh-btn-${R}`,`dsh-btn-${l}`,g].filter(Boolean).join(" ");return t("button",{type:T,className:z,...D},f!=null?t("span",{className:"dsh-fallback-btn-icon"},f):null,m)}function n({icon:R,className:l,...f}){const g=["dsh-fallback-input-wrap",l].filter(Boolean).join(" ");return t("span",{className:g},R!=null?t("span",{className:"dsh-fallback-input-icon"},R):null,t("input",f))}function c({checked:R=false,onChange:l,label:f,disabled:g=false,title:m,className:T,...D}){return t("label",{className:T,title:m},t("input",{type:"checkbox",checked:Boolean(R),disabled:g,onChange:z=>l?.(Boolean(z?.target?.checked)),...D}),t("span",null,f))}function w({checked:R=false,onChange:l,label:f,disabled:g=false,title:m,className:T}){return t("button",{type:"button",role:"switch","aria-checked":Boolean(R),"aria-label":f,title:m,disabled:g,className:T,onClick:()=>l?.(!R)},t("span",null))}function d({id:R,value:l,options:f=[],onChange:g,label:m,disabled:T=false,className:D}){return t("div",{role:"tablist","aria-label":m,className:D},f.map(z=>{const q=z.value===l;return t("button",{key:z.value,id:R?`${R}-${z.value}`:void 0,type:"button",role:"tab","aria-selected":q,tabIndex:q?0:-1,disabled:T||Boolean(z.disabled),onClick:()=>{if(!T&&!z.disabled&&z.value!==l)g?.(z.value)}},z.label)}))}function u(R,l){const f=P(R??K());const g=W(l??Y());return t("span",{key:"__dsh_portal_sync__",ref:sa(f,g),hidden:true,"aria-hidden":"true","data-dsh-style":f,"data-dsh-font":g})}function y({open:R=false,anchor:l,items:f=[],children:g,selectedId:m,onSelect:T,onClose:D,footer:z,className:q,listClassName:A,dshStyle:B,dshFont:I}){const M=P(B??K());const j=W(I??Y());return t("div",{className:["dsh-style-fallback-wrap",q].filter(Boolean).join(" ")},l,R?t("div",{role:"menu","data-dsh-style":M,"data-dsh-font":j,"data-window-drag-exclude":"","data-dsh-portal-synced":"true",className:["dsh-style-fallback-menu",A].filter(Boolean).join(" "),onKeyDown:b=>{if(b?.key==="Escape"){b.stopPropagation?.();D?.()}}},f.map(b=>{const k=$e.has(b.id)?je(b.id):null;return t("button",{key:b.id,type:"button",role:"menuitemradio","aria-checked":b.id===m,disabled:Boolean(b.disabled),className:"dsh-style-fallback-item",onClick:()=>{if(!b.disabled){T?.(b.id);D?.()}}},t("span",{className:"dsh-style-fallback-item-leading"},k?t("span",{className:"dsh-style-swatch","aria-hidden":"true",style:{"--dsh-swatch-color":k.swatch}}):null,t("span",null,b.label)),b.id===m?t("span",{"aria-hidden":"true"},"\u2713"):null)}),g,z):null)}function S({open:R=true,onClose:l,title:f,closeLabel:g="Close",children:m,footer:T,className:D,contentClassName:z,onKeyDownCapture:q,headless:A=false,dshStyle:B,dshFont:I}){if(!R)return null;const M=P(B??K());const j=W(I??Y());return t("div",{className:"dsh-fallback-modal-root",role:"presentation","data-dsh-style":M,"data-dsh-font":j,"data-window-drag-exclude":"","data-dsh-portal-synced":"true",onKeyDownCapture:q,onKeyDown:b=>{if(!b?.defaultPrevented&&b?.key==="Escape"){b.stopPropagation?.();l?.()}}},t("div",{className:"dsh-fallback-modal-mask","aria-hidden":"true",onClick:l}),t("div",{role:"dialog","aria-modal":"true","aria-label":f,tabIndex:-1,"data-dsh-style":M,"data-dsh-font":j,"data-window-drag-exclude":"","data-dsh-portal-synced":"true",className:["dsh-fallback-modal-dialog",D].filter(Boolean).join(" ")},A?m:t(a.Fragment||"div",null,t("header",null,t("h2",null,f),t("button",{type:"button","aria-label":g,onClick:l},"\xD7")),t("div",{className:z},m),T?t("footer",null,T):null)))}const x=s?.Menu?function R({dshStyle:l,dshFont:f,children:g,...m}){if(!m.open){return g!==void 0?t(s.Menu,m,g):t(s.Menu,m)}const T=u(l,f);return g!==void 0&&g!==null?t(s.Menu,m,g,T):t(s.Menu,m,T)}:y;const h=s?.Modal?function R({dshStyle:l,dshFont:f,children:g,...m}){if(!m.open){return g!==void 0?t(s.Modal,m,g):t(s.Modal,m)}const T=u(l,f);return g!==void 0&&g!==null?t(s.Modal,m,g,T):t(s.Modal,m,T)}:S;const v={...s||{},isFallback:!s,Button:s?.Button||i,Input:s?.Input||n,Checkbox:s?.Checkbox||c,Switch:s?.Switch||w,SegmentedControl:s?.SegmentedControl||d,Menu:x,Modal:h};r.set(s,v);return v}function ra(a,e){const t=a.createElement;return function s({font:r,style:i,onChange:n,lang:c="zh",id:w="dsh-font-switcher",compact:d=true,disabled:u=false,align:y="end",className:S,open:x,onOpenChange:h}={}){const[v,R]=Fe(a);const[l]=Je(a);const f=W(r??v);const g=P(i??l);const[m,T]=typeof a.useState==="function"?a.useState(false):[false,()=>{}];const D=x!==void 0?Boolean(x):m;const z=k=>{const N=typeof k==="function"?k(D):Boolean(k);if(x===void 0)T(N);h?.(N)};const q=String(c||"").toLowerCase().startsWith("zh");const A=ea(f);const B=Pe(a,e);const I=q?`\u5B57\u4F53\u642D\u914D\uFF1A${A.zh}`:`Font pairing: ${A.en}`;const M=d?q?A.zhShort:A.enShort:q?A.zh:A.en;const j=he.map(k=>({id:k.id,label:q?`${k.zh} (${k.enShort})`:`${k.en}`}));const b=k=>{const N=Te(k);R(N);n?.(N);z(false)};return t(B.Menu,{open:D&&!u,selectedId:f,dshStyle:g,dshFont:f,items:j,align:y,portal:!B.isFallback,autoFocus:true,minWidthFromAnchor:true,className:S,onClose:()=>z(false),onSelect:b,anchor:t(B.Button,{id:w,variant:"outline",size:"sm",disabled:u,className:"dsh-font-trigger","aria-label":I,"aria-haspopup":"menu","aria-expanded":Boolean(D&&!u),title:I,onClick:()=>z(k=>!k),onKeyDown:k=>{if(!D&&(k.key==="ArrowDown"||k.key==="ArrowUp")){k.preventDefault?.();z(true)}}},t("span",{className:"dsh-font-glyph","aria-hidden":"true"},q?"\u5B57":"Aa"),t("span",{className:"dsh-font-label"},M),Ue(a,{name:"down",size:13}))})}}function Ya(a,e){const t=a.createElement;const s=ra(a,e);return function r({style:i,font:n,onChange:c,onFontChange:w,showFontSwitcher:d=true,lang:u="zh",id:y="dsh-style-switcher",compact:S=false,disabled:x=false,align:h="end",className:v}={}){const[R,l]=Je(a);const[f]=Fe(a);const g=P(i??R);const m=W(n??f);const[T,D]=typeof a.useState==="function"?a.useState(false):[false,()=>{}];const[z,q]=typeof a.useState==="function"?a.useState(false):[false,()=>{}];const A=String(u||"").toLowerCase().startsWith("zh");const B=je(g);const I=Pe(a,e);const M=A?`\u754C\u9762\u98CE\u683C\uFF1A${B.zh}`:`UI style: ${B.en}`;const j=S?A?B.zhShort:B.enShort:A?B.zh:B.en;const b=ce.map(N=>({id:N.id,label:A?`${N.zh} (${N.enShort})`:`${N.en}`}));const k=N=>{const X=Ae(N);l(X);c?.(X);D(false)};return t("div",{className:["dsh-style-switcher",v].filter(Boolean).join(" "),"data-window-drag-exclude":""},t(I.Menu,{open:T&&!x,selectedId:g,dshStyle:g,dshFont:m,items:b,align:h,portal:!I.isFallback,autoFocus:true,minWidthFromAnchor:true,onClose:()=>D(false),onSelect:k,anchor:t(I.Button,{id:y,variant:"outline",size:"sm",disabled:x,className:"dsh-style-trigger","aria-label":M,"aria-haspopup":"menu","aria-expanded":Boolean(T&&!x),title:M,onClick:()=>{q(false);D(N=>!N)},onKeyDown:N=>{if(!T&&(N.key==="ArrowDown"||N.key==="ArrowUp")){N.preventDefault?.();q(false);D(true)}}},t("span",{className:"dsh-style-swatch","aria-hidden":"true",style:{"--dsh-swatch-color":B.swatch}}),t("span",{className:"dsh-style-label"},j),Ue(a,{name:"down",size:14}))}),d?t(s,{id:`${y}-font`,font:n,style:g,onChange:w,lang:u,compact:true,disabled:x,align:h,open:z&&!x,onOpenChange:N=>{if(N)D(false);q(N)}}):null)}}var ia={page:"H",dialog:"u",embedded:"_a",pageHeader:"ta",title:"ae",brand:"ia",emptyIcon:"oa",headerActions:"ee",pageBody:"p",panel:"G",tabs:"y",tab:"I",button:"e",primary:"la",outline:"se",danger:"na",iconButton:"re",input:"h",checkbox:"Z",checkboxIcon:"de",actions:"pa",status:"b",statusText:"ha",empty:"U",menu:"ba",menuButton:"ca",menuValue:"te",dialogFrame:"ie",dialogHeader:"v",dialogFooter:"ga",dialogBody:"oe",tourTrigger:"le",tourLayer:"k",tourSpotlight:"wa",tourBackdropFallback:"ne",tourCard:"d",tourArrow:"l",tourHead:"pe",tourStepMeta:"he",tourStepBadge:"be",tourDots:"ce",tourDot:"q",tourSkip:"L",tourTitle:"ge",tourDesc:"we",tourInlineAction:"xe",tourFooter:"fe",tourNav:"me"};var oa={content:"xa",root:"a",accountStatus:"ue",tasks:"S",whaleRoot:"ye",whaleCard:"C",whaleCardIn:"fa",whaleImg:"c",whaleFloat:"ma",whalePatBounce:"ua",whaleCheckBob:"ya",whaleBubble:"va",whaleBubblePop:"ka",whaleBody:"ve",whaleTitle:"ke",whaleItem:"P",whaleCredit:"Sa",whaleControls:"Se",whaleAction:"g",whalePatBadge:"Ce",whaleParticles:"ze",whaleParticle:"Ca",whaleParticleFloat:"za",whaleClose:"Ya"};var na={mailbox:"Na",columns:"t",rail:"w",list:"K",reader:"X",workflow:"x",workflowSummary:"n",workflowTitle:"Ye",workflowBadge:"Ma",workflowBody:"Ne",workflowSteps:"Me",workflowChips:"Te",workflowChip:"Ta",workflowStatus:"z",account:"je",accountMeta:"Be",railGroup:"ja",railHeading:"A",folder:"D",listHeader:"Fe",search:"Ba",filters:"Fa",batch:"Y",pages:"E",readerTools:"N",bodyTools:"Ha",folderForm:"Ga",folderRow:"M",moveNotice:"i",listFooter:"Ia",listScroll:"He",readerScroll:"T",listNote:"Ge",messageRow:"s",rowActions:"Za",skeletonWrap:"Ie",skeletonList:"Ua",readerSkeleton:"Ze",messageButton:"qa",messageLine:"La",unreadDot:"Pa",sender:"j",subject:"B",timestamp:"Ue",message:"J",readerBack:"O",envelope:"qe",avatar:"Le",envelopeAddresses:"Ka",recipients:"Pe",headers:"Q",plain:"Xa",body:"Ke",privacy:"R",rich:"r",richImage:"Xe",imagePlaceholder:"Ae",imageError:"De",attachments:"F",folderList:"Aa",attachmentTitle:"V",alert:"Ee",modalFlow:"Da"};var da={drafts:"W",toolbar:"_",draftList:"Ea",form:"Ja",fields:"aa",field:"o",review:"ea",schedule:"Oa",fileList:"Qa",hint:"Je",draftRow:"f",draftState:"Oe",composer:"Ra",fieldLabel:"Qe",source:"Re",modes:"Ve",modePanel:"We",previewBody:"Va",plainAlternative:"sa",scheduleToggle:"_e",fileRow:"ra",reviewFacts:"m",upload:"da",recipients:"Wa",receipt:"as"};var Ha=[8364,0,8218,402,8222,8230,8224,8225,710,8240,352,8249,338,0,381,0,0,8216,8217,8220,8221,8226,8211,8212,732,8482,353,8250,339,0,382,376];function la(a){return a===0||a>=55296&&a<=57343||a>1114111}function ha(a){if(la(a)){return 65533}if(a>=128&&a<=159){return Ha[a-128]||a}return a}function ca(a){return la(a)?65533:a}var H=(()=>{const a=new Uint8Array(127);let e=0;for(let t=33;t<=126;t++){if(t!==34&&t!==36&&t!==92){a[t]=e++}}return a})();function pa(a,e,t,s,r,i){const n=91;const c=a.length;const w=i*(n-1);let d=0;const u=()=>{const A=H[a.charCodeAt(d++)];return A<i?A:A*n-w+H[a.charCodeAt(d++)]};const y=t-s;const S=t+r;const x=new Int32Array(S);x.fill(-1,s,i);x.fill(-1,i+y,S);const h=new Int32Array(S);const v=new Int32Array(S);function R(A,B){let I=0;let M=B;const j=B+A;while(M<j){const b=H[a.charCodeAt(d++)];if(b<89){I+=b;x[M++]=I}else if(b===89){let k=H[a.charCodeAt(d++)]+2;while(k--)x[M++]=++I}else{const k=H[a.charCodeAt(d++)];I+=89+(k<90?k*n+H[a.charCodeAt(d++)]:H[a.charCodeAt(d++)]*8281+H[a.charCodeAt(d++)]*n+H[a.charCodeAt(d++)]);x[M++]=I}}}R(s,0);R(y,i);const l=new Int32Array(r*2);let f=0;let g=0;function m(A,B){for(let I=0;I<A;I++){const M=B+I;const j=u();const b=u();l[g*2]=j;l[g*2+1]=b;g+=1;h[M]=f;const k=(x[j]<0?v[j]:1)+(x[b]<0?v[b]:1);v[M]=k;f+=k}}m(r-i+s,i+y);m(i-s,s);const T=new Uint16Array(f);let D=0;for(let A=0;A<g;A++){for(let B=0;B<2;B++){const I=l[A*2+B];const M=x[I];if(M<0){let j=h[I];const b=j+v[I];while(j<b)T[D++]=T[j++]}else{T[D++]=M}}}const z=new Uint16Array(e);let q=0;while(d<c){let A=H[a.charCodeAt(d++)];if(A>=i){A=A*n-w+H[a.charCodeAt(d++)]}const B=x[A];if(B<0){let I=h[A];const M=I+v[A];while(I<M)z[q++]=T[I++]}else{z[q++]=B}}return z}var _e=pa("!}.&u%}'&}*'~!6*)%&,~!J~!J~%L~y<~!R,~~%Lu~~#GD~~#|)1#%}^%}2%+#.##%##%}&%##%'#%##&%#%#'%#&#%#&#'#%%#&#%##%#)%''%&%#%#'%#%%#%%}%%%#%#&(23#%%#&-%0%('1#(##%#'##+%'*.:1}#%#6-+(%'%%#%%%}#L'2351&('%}&/N'(0(/*-%(%%}#'+&T%7.2}#&%&#%#36/5##%&%%#&#%%#))2%%##%&&'0~!#*+&'%1~!%).'3q?&%'1~!.##%6(~!+%%%(Gw'rT~!E#<nA%#jZ~!H%(~!42##~!*31&~!G%U~#)5~#`3~!J~!Z~%]~%Y~%C~!q~!u~#kz~%#~!6'~!D~!U~!?~#T~!c%~!G#'~%7|~!G~!J~!G&~#pb~(Df}#%}*&}#%##%##%##&#-}&'#'&%#.++}%mI,#,@&(}*%}*'%&##&#%##%}&0}#.},U},%}+%}&%}#%##&}B%(}(%}+%)})%##%#&}&%##%&}<%}>%#%&}*%}(%}9%}/%})%}*%}*%}?&}&%}3%}&*#%})%#%#)}#&#-#+*%E%%'%'#%}#*V##&##I}#&&##%&%#&&Qf%%))w/0+&%#(#.%-''''++++7}>%4'',##1,#%#&%##&#'##&#*#9)%&%}#*}%,#+P(%A&%#'&##wSD',9E00#y#@}(+}&%&>~!#~!X}#*}(&&}(&}(,%}%&#+&}#&}I%#%}%)#(},'%#*}4%%#%}(''}#/##(##),%-##%%)#&}(.}&%#&}%%}*&#%},&&}&%}#%*'#%})%}D&}&%}-&}6&#&}-,%}#%})-(~+`~,=?~I9'9%~!,#%})%})%}@%}?%}(~!?~#<~#pP~#BG~#=1#%K+~#?#~%;)~#A~#mF1~#A'~'X%'~#lR~#N~'N~#r~#m#-~#i'?%#'%~#B%##%,%#~#_%#0%~#]732~,w~2+#:&#%&'0%&>%}#>##F+)#%&&#(+_}4&}-%}(&}@&}O7Fdf0@+/v4}&WU##&/0#&'('B#%}.%}'+#%}#%%&#&%#%##+#&#)#6#'#.},%}c%},%#%##%&#&%#&~#>'*-.%##%##%}#%%}%'~#)D1}#%*&~#_%%'(~#S2%'.}#~#=##*'*-%}&'%'##&&~'E%.#&~#M4}%%##&'%#~#O1##%&#'+~#<B%##%%'%+~#;#@%}#&%#&&%#(~#H1}'%'##&&~#?A}&'~#D#%32}'&&&&~#[}'(#%}'~#;C})&}%%#%~#=&%,3}%'(#%%~#^'#&&)#%'~#Y%-~#d-%'~#^%%&#&&&}#~#b~2t*&'~&(~&@~0%~e~3}%*''0})&}+~!9##-}#%-hD*)1fC#%/&/fB#40~!+#)*4~!+~!K'&:~!/*7~!.#~!H~!L':~%x&~!H#~!*~%1~!I#~!+A~#p'~!F~~#-#~,,(~.Z~!V~%;'B'mq-W~!N~%I%#&&#&}#%},%%}'%}+X#%}#&}(%}'%}<%}#%}%%'}'%}:~![)9@~%>~#UA%-%##&~!C%~!-.9:~!1~!-^2/:a~!y,D*J#-5)/4~%23,~#G~!L1~!0X3`~!2+~!!0-~&E~!W~!o,>Y&]~%cZx_&~#O*9#A#'#+I'%#)~!0B*-5A+-((F&*M#)(-7-5+'-3a5Vi~!Y~!?+[)%3),ERHm~!+:D,VG.+)?fB%%*(%)'(#&80%1'8`K8?`+'Z#&O&'H5#*9)A%%5&3))0%39+.*7#()&&*=4@**L)<'_&*+..;(#*+)./&0#3)%')-8(4ixD(&.}%,('aI:,)%,k2231T)I'#/-W7,/'Q#.'Y24+h')37</31&83##&0#),H(?'&?/1##%#&&#%''-%&&&#(&''&#.-'%#%%(,')*'&#&#'##%(%(#%('#&##%%%%('%#%#%%#%#&%##h>w+v<ayvyvcg.uuhKr}g/v|g>u9i[~>g5uI~=RvdwEg;v/g;uk!!TTSx]@RT!U!#!@VBRUU!'UTe-d0c`e&gSdicedFcrdTaqb.kYcAohdYd@a3e+d}dMdtd.aJ#bqcK`dle/e.e'dwdPdodddjbEb}ogd^ofdpduc6j?l%d{drdqc)d7bacOdQ%T#Y)X.sR[yH>6Vyv3[xwLu>vo'!*.[yBacahoj>6Rew3[xqdZa#!a&#^(X-[yG>6Vyu3[xvg3sEr|g.u/Ri9db0T#^(Xa)!-[y;>6Vylg4wKs{JwNZt3@3r=c4Z([xlg;wKt!cpq's@v7A'*a(a+!-a#[y<3Dt?3Dt'>6Vym3[xmg9rxsNJwLZt4~?r?db1T#`-!(Xa,!0[yS>6Vz%NuQs.g4wKtnJwNZtS@3r>c4Z([y%g;wKtrdga8!a(!#&T*Y-Xa#!a0<or[yc3Dtq>6Vz43[y3JwNZtf@3s!Ju}!%Dti:pm3c_%X#tjB5pkd6q!r]u?voC'*-a.a2!0a&a+[yI3DtI3Ds~3DtH>6Vyw3[xx;:s#~<5pKJwNZtE@3r~d`a)!a2T#a.(!+U.X1[yT3Dt`3Dtv>6Vz&3[y&g9rxwzcxstPu.<rAJwLZtT~?r@dZa%!a.&^*Za(/Reu[ya>6Vz23[y1g3sEr}wkg{NuQRg{ci(U#5@b`~,cg#U(2WnH5wugcRh7dX#T(Y,a'Ta!!a,[yZ<]mj>6Vz,3[y+Pv#5ReZKu+=,%!H}7ABwkaS?Rh:BcW(X#<]mrj:ubv/ARekdg%!(!a.*Ta(Y.X1!#sP>Rl*Dt6[y>>6Vyo3Wf*jOvuumvuRgRJuq*!:9<B@bX~3jVv&v@s@5Re[d/rQt{uAvo&a&a*)a2!,0Wf!3Dt0=Bs'>6Re}3[xy~<5s%JwJZt1~Gs)c;&!#2sJkNuXvzq7rxu,Re8dka4!a8(aEZ+a@Y.X1Xa)[yd=Bs(3DtP>6Vz53[y4cX#X&Re:avRe9~<5s&JwJZtQ~Gs*i^rzvdRg+Jv{%!2sbB@bX}kdga,!Za?&^*T1/!a'Dt+[y6>6Vyf3Wf%g/u;s4hGu6?Rh-JvZ,!c%#&RoX54Rivj7uyvf8RgTKvZB%*!2sGh<vu5Rgq<=C::9bb~#dZ#T&Ta6Y.X*Dt>[y93Wf)coZ(T,6VyifluvRgC@95@B@bX~/hFu34cC#T,k/unq8w8Q5RkUklwQuzunq8w8Q5Rk8d/rJu?v8w9)-&!a0a;a&aIWejg3sEr/h1s<DtDJvyZqY5aws3Jvy!&Wei~Hr1:au5@Bag>23E~5c:Z&bX};kKv?w&unuVu5Rjc;>bs)#~@:Rh.=ay<a]C;b`}Vd6s/t{uAvoaxa()!a,a7%-a#a2Dt,[yF2Wo[>6Vyt3[xuNuPRi&NuPwpi#RoWh?vf8Ri%Jv]!%Ri:KvxD!.'2WeAjZu`q9rxu,Re7woeAg-unLq(qA_/*2Wg_g3u5q^9:4E}/jTrxrzv=Wkkd~0UX#^^Xa-a1a5T&a=U1a'*aEa]!a*aPaA-adok[y54Rn>;:p3~Dp5g9rpsFNvZqjg3uJp4~<5p0Pw;5qlJwNZt*@3p1Pw:5p/Ou!5p2JvG'!6Vye=<qnJvh_[xhg3v,Rh3kOwOw-sDuev/Re^dha[a%!%!a+#Ta7)-5TaCaO!aka!a)sf[yb2>Rl!9ARiq5E}Qg=ucRkBE|oJrJ_@Wk~@Wk{JrJ_@Wk|@WkyJrJ_@Wk}@WkzJvO_[y2g-vMRmiKuYC!)&>Ri;>Ri<@3RkNc](X#@9Rk=g5vuRmhKvDB!+'=]meg3u4Rmgd)#Y'Vz3CARmfd`a+!%T'!+#Ta1Ta6TaM-sTDt9[yA9sYd'%Y#s[[xpj:ueunaXRgEjRq,v-vuqdd2'`#6Rev<32@5>:2<E}5xIo9a*X#Y(;5RePJvD_g>vyRgNj8w)v8<wggs:RgXiZt|vjx,hSq3ah!-(~@:Ro/Ou!5RhWj^v(pyw8unRhUdx-UY#^Ua.a3a70!)%UX1TaDa)'omRiRRhE[y:3Dsz=Br,>6Vyj3[xkg6ruwjcqsrPw;5r*Ku]D'Zt-@3r(~?r.i[vwv]dU1a--U#`a4(g/vsRhPOu!5RhLj:rmu9Wo!~@:wdh@g/vsRiTjXuvvNr}:RhBj^v(pyw8unRn]dz1UYa'a+^Y(!aETZalaRY.Ta?a4[yDJw1!#qLsW>6Vyrfzq-pLflpwRe|Js>%!Dt@3Dt&Jvy_[xs~HrnjMuwpsw'RecKu+D#'!t<~Grl~?rjg5u-x,gwp{ah!-(~@:Rg~Ou!5Rh'jXuvvNr}:Rh#cW#X/c;&!#2sLi[v7u7RgpJv)(!iLrxu,Re6j7v@s@5Se[e7d`aW!Za(a`T.a#!a3!&aDa-!9)Dt_=6s+3[x~~DR|h~DS6avhGun5RkZj3w)v-]mkKunB!&*]kb97R|i<ARk<c:Z(6Vy}Juh'!wziMRoS:F|vkLuauJv5vtvQRh1d='T+Y#VyO~DR|jcF#T'7R|g97R|kJv3'!ay<Rj,Jvh&!:ReXcsa6*a+#a#_aIRf9aLRf?c,Z&Rf5Rf7c.Z&Rf;Rf>cQ#%T'p-Rf8Rf=ct#%'(*!,p,Rf4p+Rf6Rf:Rf<d~'Ua%U*^UYa(!a,-!#a4YaTalaEX0a8a<Weo3Dt/3Dsx=Br93Wen~Dr;~<5p<JwNZt2@3p=Pw:5p;Ou!5r3c7&!#:p>3Ds}KvGB)_6Vyk2sM=<r7x'eovA(!hFu1ARf}cV#X&@r5j6rvwQa^Rf3c=Za'wkghJv__g;unRggA53B9=b^}%j6uduo5Jq;!(hIv%2Re`Ou4ARe_e%a#^^^Xa&!a*a2!&a6YaP!*ad!#a:aE/5Rn?[y@>6Vyp;:pE~DrY~<5pBJwNZt8@3pCh=rt3rWPw:5pAJup_[xoNuPpF9c!#'45pD5ARn)d8#X'X*3@rU72s]h>v<<sSjJpqvewOJq/(!hNw'5ReBk0s2u3w/w'5ReE5@Jq.!a+JQ!&WeU23d(#Y&RjG5]jBk!u7w&u0udARjEe#+^^^Ub#!a2/a`Z(agT1!a-a;|@TaG!aS[yV=Re~fow'RguNuPRe?bz#'>RoUWeL>:Cbb|?JwPZtVg6ruRmzJvD'!6Vz(g/vmRh~Jvy_[y(g9voRgyx*cy(#2>Ri2B9b]~9kIw9u7rluJu3Rg]dI#a%UY'@=p%CAx.gQZ&RhwwygtRm{x5g_Z'+ABqR9Woa=Bp&dV#^*Xa'!&@o{g4v]Rk;Jv{!%Rk[wkkiA5RkiwwfUB=x,fUuqC&*!>RfTg8v0RfV~ARfSd;rJsAuAv9wR'ae+/aO!a@aza/a#[yQ@Wg!2Wemg3sEr0JvB_g>uvReWg2v+Re=KupB_+[y!2AbY~-~Hr2AJwD!(h<~El>h<~El?Kun@+_:9b`}Kg-v/Ri3g;vtwyk_9]k_d=&T#*U.6qh@Ab`|K9:H|CJv[!&3Dtex'fDwC%!Rf[9WlMd[(^X,!a%Z06Vz!@WgBg=v~Rgvg,QRe@awd,#Y+jTv|Q~EfWj]uNr|~FRfXdy#Y&^Ua%!aO.!(a)Ua;=!a@aKap!a-,a!Ta]a[rSa]p?[y82sK=Bq~;:p:~<5p8Pw:5p7d'#Y'Wf(;RnRi[u4w&RgJJvG'!6Vyh=<r#ijuuv/sIKuYD'ZtG@3p9~Gr&d2#`(g<vtRgFj`u5w&rqpxRf2CJuY!+:wfnTOu!5Rg}jNs1ucv&RfwJvA!&3@q|BDcC#T,k/unq8w8Q5RkTklwQuzunq8w8Q5Rk9dga#!a'!a=#a0!:+Tb*b@aO.a4!aba8aFJv^}?!VyR~Dr<g;u%Rn.~<5p[x'e`wNZtR@3p]Pw:5pZhNvjBp.woe_g5u-r4JwF!%DtO3:ooc7&!#:p^3DtpLuGw(!+%)Dtk6Vz#2sd=<r8d'#Y([y#<x3gJt`w@!)%}MRiowzikRij=]ilxAf3,U(#B2Rf#g0v-Rm[ck{`U#]giKv3>)!&6Ri154s,KuGB_%@r68r:dJ|t`#X(9<E|u2@H|rx3gJu?w'!+'1Nu7Reg4=H~+9<wxgY95Rm]xLggZ-`(X}U2:Ri4h<uOawRmsJv__5@bb{jbV~3dka#a'a]!,#a+U=a>b6a3b%!/aKa/)!arwve^VyJ;:pR~DpTg3uJpS~<5pOPw;5qmPw:5pNOu!5pQJvG'!6Vyx=<qoJvA!{~Jup!%@qk7Rn/KvyD!}''[xz;>wkh'?Rh,x8gyt`w5D!&),(SgyccRgztJ@3pPB5p#d'(Y#<]mmifubw&RgoJvE&!82s^JvF&!8Rf,ADb]~;x=h'rNu]vK!,%'*0RnORh)4Rh*AqQg-vaRnNg;wHwkh'ba~4cE#Ta*x3gctyw@'!+%RnFRnD<4Rn@hFvK5RnCxWg[#`&a0Ua()`1Rm75Rg[c]%X#qi8Rg^NvdRj>BwzgZauwji7Rm6A4wgg]d1#&(*,.0a#Rm;Rm<Rm=Rm>Rm?Rm@RmARmBe%#^^^Xaea?aC/b+(,!a+a#!a/!>a&Ta<aKbD!2wphBRnk[yPw}hE|.=Br-3Dtm>6Vy~g6urRf.x,hPrNav!%'RnqRo%Ro#Nu;q[Pw;5r+JwNZtM@3r)d'#Y'Weh;xChL#`&RnmRnoKu}>%(!Rne~Bs-;2wjcussJv+'!aYSO}6@B<5?ba~8LrNvj!.%*ROwungw~ng~:9;Ri^>wtnig;wHRnixDh@|(UZ.x1h@|)!#:2<H|*xHn]#-UX'3Ro)z=iT}6ARns=Bwsn_wpnaRncw]aR(#UXa&Ua*a/=]iPd'#Y&Ro'WnXf{QRm2hNvj]nZd`'T~&1`{|`#9b]{}c:'!#Wl{>@=be}]?cl{{U#:5Abb}Jds#^YaF!a*b4a#a3aPa>&Tb!bH!*a_!Eau?/a&RjY<]gj>6Vz*;:pe~DrZg,QRj1JwNZtX@wihspcJvZ&!VyX9WmOJu|!|N2WmHJvh&!]ht~Bpbcn&T(!#RmQ<s7Nu;padH#X'`+WmJ@>RmKCARhnKup=!)&Wf+:RhqNuPpf9c!#'45pd5AwghpARn(Ls@w!%,)!RmP@Wfe<E|IJva!&WmNg8vsRmLd`*.`#Y'Xa!axRn*]hrA8Rhug5s@rXg8u!RmMd8#X'X*3@rV72smdI*#UY&RmICARho~GsgxVgd)Ta'U-Y&Xa!T#RnEWnA@Wffg1uDRi0hFvK5RnBxGnG&#`%owp)@wsf+bX}Ze-*1!a*^^^Ua|!#a.aq&Ya2!a>.a6!a:aO`aJDtL[y`@Wg#>6Vz12@wzoYRoZNuPRi!NuPRhzg=ucRi,@=b`{Yg=ucRi-ACJvB!&Sh[ebSh]ebi`wUuFRm4Jw2_[y0JvB!.<Ju(!&SoG}6Shd}6<Ju(!&SoH}6She}6Kur@._g5vHRieJvx!{L2G{Kx6gd'T#?Rh82Wi5cZ#X(g1w)Rm5dW-Y(Ta#!a)!#aYa=wnfE=su2>>bU{0j9udv:<svj8uQv-7RgHdE%#^'sq9sp=>Bb_{TJv`!&g/r|snj6v(us5d,#Y(56H}[978H}]Jw5!&g1rushJvB!+j;v{u5?zDhd}6}bj;v{u5?zDhe}6}ce*#`(^^^a[aea!=!a6a*aoXb1a.!aAbL!b>,b'aL!aV@Wf|2Wlg3[y/JwNZt^@3piPw:5pgJunZou3@rsJva&!Vy_g<v~Rm#JvG'!6Vz0=<r{Ju{%!:pj@WfsiXuJu3Rm:JvZ&!WfA~Bph@c4Z&Dtwax5rubx(#:awRk1@d,#Y&RfjRfid1#,Y(@Wfp2Wlrg5s@ryKu[@!,'=]ig9wlk?Rk>g5u-rqJvy'!@9RkQcH(T#=>Ri~@<wkj(Wj(KuZB*!&<7rw@9RkRcH(T#=>Ri}@<wkj)Wj)dg(Ta2Xa9X#`-!a*CARhg@@=I}d9x;c~#X%so=<sj>2@@=aybb}XjWv0Q~EfEj3vLv;<d,#Y(56H}`978H}_dgaPaFa'a/!#a3Y0a_a;a|!1(a7-[yE3[xt;:pJNvZrrg3uJrvJwNZt=@3pIh=rt3rxPw:5pGOu!5rpJvG'!6Vys=<rz@c4Z&Dt(ax5rtJvZ!&~BpH@wsfNg-vaRlNci*U#=<wei<F}a5@Jq.!a*JQ!%@qZ23d(#Y&RjH5]jCk!u7w&u0udARjFd/prq=tyvpaEa(a:.!a1aZ(@@=I}:9wpd%=<sX55w_h}@@=I{t=ay<aU@@=I}T=ay<2@@=I})?C9:9au@9Cb]}DP~=x-fAZ(2Wl1=ay<aU@@=I}>5@d##Y+jTv|vV~EfFj]uNpn~FRfGdgaK!Z2&!a8a-Tb({E!acTbM*!a(DtY[yYd'%Y#sl[y*hHvh>Re5x2c{Z}.j4uCvcawRiMd+#X+_x&d!},<5RkX;2Hzw@x,gavfB-!{CcF&T#Roe;RodwWbBg5urRgaKvHC*_6Vz+<4opieuew&Rmq@d]&Y)X,T#X0Rh}<BqP=4qS9:ReMg/ujReNJw0!/<Jui%!bd{kawwnemRelAxUa?a3#*.&UX(Ya+a/RhvRnQ<o}9Wmtd-#Y&RgSRmw9;Rmxay=Rmyg-vaRmuxEhSrNu,v-voC!%(aR.a(a7+1Ro1>Ro5CE{A9b]{@;5x#eO{:g;urRi+KrNA!%(Ro3>Ro79;Ri_Ku@>{;&!x%gX|{KunA_+g5QRj/g3u5Rj#g>uERj%wio/xRhS&!,!#^1U}wba{8>>@=be}qC@:D5ba{7Ku+A&!}x?ba}t>>@=be}se(aA^^^Uat!b0#{pa+awUazbGa#aLb9bgaWac'a5TbS=Br!d1#`%scp_Jvl!#rT>Re0JvX&!VyN=H{Fcm#U&:pY=ReaJv2&!]h0=]nUJvG'!6Vy|=<r%JrM_=]h2@Wlud'#)U'Wf'b]{i=]h/Jvh!&~BpWg=v]RnMx+ny#'Nu;pVwjnu=]nwxJnx,T#`&Reqwjnt=]nvieu9vrRjLLuYwP(#+!th@wih5pX~Gr'g5v/Rh4KunA'!-CARnP@wwiN:Rm_9x'cvw>!|l=<saKvAA!0&3@q}>w^e1bp#&Re2Re3BDx7gH#T|f5H|eKuZ>!%(:qNAH{]Jv6!+3B2B9=b^{X<5<B92:E{ZLvhwA(a;a%!igQuyRmad+#Y}m@3Rh5d8#X'X*:AqUAHzmaxwbh<aXRnVcF}RT#Nw&cj#U(BWnug/vsRntdka)(a3+.Zb7aYYan1!bVa@Xa}[y^@b[{G=H{+hFu73Rj&Pv#5ReQcK%T#sig1v{Rj'Ku+D#'!t]~Grm~?rkKuMB!01d5#`'Vy.ta3Dtu~Hroc8#'{^45s85AwZbP&!#Rn!wghxWn#KvEA!)&2RlA2RlBx:h|#(T,=]j09Wobz>x]z/@awRoTd+#Y(az]hFhCrm4d,#Y+jTv|Q~EfMj]uNr|~FRfOdCa!Xa9_X#@<plJvf!%b`{(9;Rgwc;.!#2x7cw#T|UDb]|T5Ju={(!=@E{&Jv)&!Ab`{'awJvf!~*>>@=be{#KuY>!+&4Ezyi[ugv&RjIdea+T)#UXa&T-T&a!Rh9auRmW=]kLg5vuRn+g3u4Rn-Ow6ARn,hHus5xNk?#UX(U~)/g8v0RkD~AwkkF?Ri.OuNBwkkA?Ri/d|a2`a*^UYa.!aBTZaTa'Xa;!(!2!-a#b2[yC>6Vyq3[xr2Wi?g1rusVh%s?DtF~<5rbJs;%!DtBfswKtCj[uvuSsEu3RgVx3o:u+wN'*Zt;@3rd~Grh~?rfg8w)Lq)qE&-a%!>bI|`jWv0vV~EfCjTv|vV~Ef@j]uNpn~FRfBcK#T']gWNu7x,k7q4ai(0!hHv8<RhmkMu9vrsBuev/RhlCJvB!,g<v{wchh~@:Rhji[vrv{wchi~@:RhkdS&a5UY#Ta!RgPwwiI5BwciI~@:Rh`x'iJvj'!5]iJPu8Bwch]~@:Rhach)U#h3rp]gLh@t|Ax,hTq3ah!-(~@:Ro0Ou!5RhXj^v(pyw8unRhVd|)`,^UYas!a?/a2Z'a^Ta{Tb7Ta(a#!a,Wf&9sZ3DtAadamov=Bqt3[xig8vsRm~>waiL2b`{QJv*_Ouv2qgj<v]v2BqfdR'X*X#Y-@3qr~Gqv~?p6hHv-]glPup5Lq+q?_%*b_{qF{n9b^{rOu4ARhpKvCD!+&~Bqp:5Dbb}nwoiKl&unuTuBv]v+ueunaXRf0=Jvh!0nKufu8v1w&w7q%w&uHrz:Rgnj5w,uxDJq/(!hNw'5ReCk0s2u3w/w'5ReFd>Za&!*UaA=<wkgsRnSJv^!%Refifw3vyRgOKu_B'!,<]gkiiu:w&Rh<=C@a^<B57@2F{[<B5@aW:=3away9A5aW=<B=C@a^<B57@2F{Ie-#`(^^^bCara.b8aza6!/bZ,!adTbnTbOb+aFaS!aAT9@Wf~2Wli3Dtl2@d,#Y&RfnRfmJwJZtN~GqyJva&!VyMg<v~Rm%iXuJu3Rm9Jv[_=]ih9wlkDRkCd1#`(@Wg>2Wls3cH#T(@<Rj*=>Ri|b~'#23s9h<~El.d'#Y&Dtxi^rzvdRl#d*#U%(o|B2s`hJwSaxRmDKv4B&!1:Rmdd5#`'Vx}to~Hq{x'f1v3(!BA5ba|bJv_&!Wfug1v]ReIdO+U/Y#&G}-8wze=Rh{g1v]ReHg/uQRf/by#)ibQwERl/cH#T(@<Rj+=>Ri{cNu+vlax-!(#a0qa9<Rii2;;bU{H;x<i=&X#Rk`<4wwi=C9H~8xAI(Y#<azRi@45wXI<B9;5bb~7dL(X#Xa(+!aL6Vy{g5QqOau:5au2@ay547EzbxOcU(UX-T#Ta#:Cbb|A?wjh/b_|SOw6ARgtihr}u7Rhy<d1#T)X1@@=I|~=ay<2@@=aybb}Sj3vLv;<d,#Y(56H}A978H}@dGpvs@uAu`vcw9*!aFa+ai%(b!aXa8.a?a[ozWey=sU2@G}Nch&U#Rf_WexKu+D#'!t:~Gr`~?r^j]uNr|~FRg*j^psurwJt|RmcKv)@&!)7Rkv~Br[@wxfO:Rl3co#U'6Rezj_q#vIuavjRltwzeyh@vr5JqD0!>aY?C9:9au@9Cb]}9cl#U*5;5<H||jbuus1ucv&Rfvg1v~d/pppzqFr^a--a~!aMat1(hFv;Wiz@@=Izoj5uuv-7Rix~Cw`fk2WlVcZ#X,k)u3vWs@u2]ktg;wEx'fBq(_2Wg/jTv|vV~EfoJv]!15x'hzqG!(P~EfU~CRl_j6v(us5x4i-#T(2WmZ?C2F|d>Kq<aj1!*jTqIsBv=Wl`~Cw`fi2WlWj`v0u*~>RlR=c>Z,k#u3vWs@u2]kr<c1Z+jTqIsBv=Wla~Cw`fm2WlXdmb3!a{(arZa`bkTa%TbQTa-a9+c'!aM!/[yL=Bqug.w'RifhFvyDRj.g>vgwyk^9]k^Jv3_@WfbAARkhJw2_[x|JvB_wkoIRoKwkoJRoLd'(Y#<]gm=<9<H|yd'%_X#skDtb3awwqkgNulRkgdB#^',9:p'hJwSaxRmEBwVb8@4=H|qLu+w50&!)@3qs~?pU>Awwn;;Rn=c:Z'ARn<=<qwKvC@!/&~BqqJv6!&]eVb^z^xRge'/a%+^`#Sge}6<4Rn3=]n0Pw2>Rn8Jw0!&>Rn:>Rn6cY#a7+!a&=<wkaNw~h3z_c5Z{=wjh#=]nLKv^D!&)Vyz=bW|swYb<WetcG#T(2wxa@qVx@gD#Y&b^|V5JwG&!5bb|pg/w&RgD@x=kHs=uAvn!a%%/'+RmSRh694Ro`g-vaRmRhHv-]mlxCcS#`&ba~.5cD#Ta)P~=d,#Y(56H{>978H{Dd_#{2^Y%_+qbbb{6g3sERhsbU{?dfa.,`a(Xa<!aiX#(55RiG54RiHcI#T'WiU3RiVNvdwtfcRlKNvdd,#Y&RlHRlExQgf.1*^T'X#Sgf}6Wn4=]hfPrk>Rn7Jw0!&>Rn5>Rn9Lunw?&a2!,5<oq@@wqfdRlJj5Q~=d,#Y(~ARfcOuN]fdDKw;ay(}i!547E}j?cI#T(@5bV}iCbV}hdv(^^Tb?a40,b##Tbo!a*bR!a<b|a/!aKai!aU[yK=]o^g:v>ReGJwPZtK<7Rh+h<~El,Pv#5ReR@awwxjCg,ulRjDJv6&!]j!z?aQeeg>w=Sh<eeJw;!&axEzOg,Qosc!#*:wkeJ]eJ>x'h-u(!%Ro.w~h.zPdNZ(X,Ya![x{;9ReY;wkgxRiF:x?ap#Y&RmUg<s2Rkod]+UY0TZ'!a&A9sw<=bczLNvuw{gqzNhJwSaxRmCKuLay!#&s_Rf-55b^{uJvZa!!c%#(55Ri654wmiu5RiuawLu,vp!+}^%b_}Y9;wkgxba}o>A9:=b^}zKuh=a''!3awRk3c*'!#aHRk6c+Z&Rk5Rk4Jv)&!awRjSawd9*`#0?C2@EzMj8u<uJ5RmbjQrquJu3x,k>uq@_+=ayb^|W~ARkEOuN]k@7dhzV^X/X&a-#zRzSb`zXcJzTT#2WkVKvDBzW!%FzY9;5bbzWjQrquJu3Jw3%!b`zU=ayb^zQd:#X(T-a!6Vyywxh}=b]{Jg=u1RiAdGp~qHtzv!w(wA+a+a;<!aJaYai'anasb(=azRmV:Cbb{MLq2vb!%')RjuRjrRjtRjqx3jnqCw3!%')Rk(Rk+Rk&Rk)Lq2vb!%')Rj{RjxRjzRjwLq2vb!%')RjsRjpRjfRjex3jcqCw3!%')Rk'Rk*RjkRjl9<CbbzfOu4ARhxLq2vb!%')RjyRjvRjhRjgx=joq*uKvb!%')+-Rk.Rk%Rj~Rk-Rk#Rj}x=jdq*uKvb!%')+-Rk,Rk!Rj|RjmRjjRjidAq&qKs@uAv8Aa.'*-a@a&0!aM@a5[y73Dsy3Ds|3Dt):wxgI2sHJwJZt.~Gqxwsf0ikrzt}Rl0Jvy_[xj~HqzKv_A|D!&WfP8axRoVcf,U#k(v]v+ueunaXRf1Ju}'!g8u#Ri=jQw!sCunLprq>!,')~<5qeGzq9F{W=c##%s5au:5aU3CBE|;d4#X(D!a&6Vygx(b;#(=]ed?C2F{N<capoq2r[a&!aPa9,'Pw;5s:@@=I|,55w_h|@@=IzcP~=x'fCqB_2Wl2>aU@@=I|1OuNBc1Z+jTqIsBv=Wlc~Cw`fl2WlZ~AcTa%!Z+jTqIsBv=Wlb~Cw`fh2WlYk+uNqJsBv=WlSg,u3dca3#UXaMYa)TaB-=cM|7T#<bI}l5@B932:aV2G{BOuNBJq:|M!5Ezt=<B=C@a^<B57@2F{v>cB{/T#=ay<bI{3Jv6!a.6BKq0ah&+!5E}HP~Ef{978BaU@@=Iza<7d#.Y#978BaU@@=IzH~AJq0!(@@=IzG978BaU@@=IzFe,aU*Y&^^^bvJb,b:bFad!a,c2Ta>aL.bo6!a#CbTa'T#Re{2Wlh2@G{yg6t~Ro_NvdRfticuRQRllJv3&!x&c|zs@Jw3!%RflwpfkRlpKuL;%(!Re<@G|C2GzdhIvuBwgjAg-u0RjAKQB%!(GzZ@G|5NuuRl7d='T+Y#Vy[g<v~Rm!==G|>JvA!)@wma=]m1ifuaw&RmnLs@vT'!|/+[y,g:v>ReTJw1!#qX=x!eC{bLu+wT&)ZtZauq_~Graci&U#F|89:r_Lupvq!.)&2RlG8RfaC=x!eF{_h?rpWlmd&'!#X|&]k::xJey#`'T|+<E|&2@H|%dE#(^,g;u.RiEg6vjRiC9xCkA{O|zY#g=ucRmXKs0@!&*@G|m@awRknJuh!,3d(}gY}eJvj!%Rm):Jw3!%Rm+Rm-Ls0w(&!a(a#@b[|6cZ#X'7RkxWgAOu4ARn'dH'U#Y*Vz-Wm'CARm}d]*#a%^a*T'aK!a<9bV{PC=p*Jw4!&SgxcbB5r]idw(wBRmF7xFkt#&`(Rm/Rm8E|!JuY_9:Rl5=wrgr2:bbxd@xXfB(a*#T+!.X0X1Ta/a'T&RlDRfL>RlyARl9b[z[>RfZ:RlL:RfRwlg/ARl;9;RlxKv,A/!%7s69<74=BA5ba{-8Bde#`a<XaKYa1,a'P~=wxfB2bZ}}?C972@@=I}r8@55B9;5bb}G978B2@@=aybb}3j3vLv;<Jw3&!>Rfk=ayb^}4~Ad1#`*@@=aybb{w2@>==<bbz]dx+UY#^UaF!a9!bB'Ya1.!ajXa#%olRhD[y=3Dt#Ov5BrHKuMB%!(Rf^Wep~HrJwkiQjKr|~FRg)Ku+D#'!t5~GrF~?rDdV)UY,Z/_7RkuG{<~BrBg,rlsO:235B@bX}|d?a1!#`(6Vyn5@d##Y+jTv|vV~EfIj]uNpn~FRfH7Lq2vb1!a9-978BaU@@=Iz9978BbU}#~AJq0!(@@=Iz8978BaU@@=Iz7~AJQ|}!978BbU}!JvkaK!AdUa21-U#`a+(g/vsRn~Ou!5RPj:rmu9WhOjXuvvNr}:RhAj^v(pyw8unRn[kPr}p|u7vwv]RiSBd;pppzq@qHQa?(b.!a.a`@.|xa(hFv;Wiyj5uuv-7Riw~Cw`fg2WlU978BbU|wOuNBJqG!(P~EfD~CRlQcZ#X,k)u3vWs@u2]ksg;wEx'f@q1_2Wg.j]uNpn~FRfqJv]!15x'h{qG!(@@=IzK~CRl^j6v(us5x4i,#T(2WmY?C2F{1>Kq<aj1!*jTqIsBv=Wld~Cw`fj2Wl[j`v0u*~>RlT=c>Z,k#u3vWs@u2]kq<c1Z+jTqIsBv=Wle~Cw`fn2Wl]dn1#c(a(b^a2!b/bAT(bj!aDa7bu,a_a{c0!2T0g:v>ReD2@G{42@G{5~DpM~<5rc=Bx6i>{RT#RnI@zCx]y]z:2Jv[!zr5Awyk]9]k]dD(Y+X#6Vz.g=wKtgwhaCwgmTWj2Lu,w%_+/[y-B;b^xeg3u3Rj-2@bX{*KrJ<!+'@Wg(g?QRlC@Jv`!%b[zIwsfII}8JQ_@w|kW|=Jv(%!AqcOuNBJvEzh!bYzjLs@wP#(0!oy@>RkdJwMZtc3Dtd@BcG#T'9bWxg2@2Fznd*#Y+;2x'c}w<zizixNgwa#Z'U+!/!a'!a+w~g~z6wcn{Rn}wcnzRn|5Rh%=]nJg5vuRmvNvdRlvcprJu}w*az*a#!%.a.'Bot9qT]kj@Wg'ay2Gzv@Jv`!%b[zEwsfHI}1;ck#Ux`<Cbbx_Lu+w!a&0*!wko*wwo,So,}6Juqxf!E}PigQuyRm`d3(`#8>Rn%:A5B;bZ~%KvhCa!a2!x>k7#Uxb@b{#xaRk7Jw0!)>wwhlShl}6>wwhmShm}6CJvB!.x'hhvj{!!5Bwkhhbaz}x'hivjz~!5Bwkhibaz|xEhTrNu,v-vpD!a%&/)a3a.,%Ro2t[CE{)@3re9b]{%wjo09:rgc:Z&Ro6=<riifuaw&RmoKrNA!%(Ro4>Ro89;Ri`dSaL'UYzxZb)7Rka3xRhT&!,!#^1U}vbaz{>>@=be}yC@:D5bazzKu+A&!}{?ba}y>>@=be}wxBh[t`u~vJvr!%a!a()a,a0a4RoC=]o;Ju(!%RoGRhdwjh`=]oAg>w#Ro?g5vuRo=NvdRl|Ku]C.!&;RoEJvB!%RoORoMBx'h[v+_?w~h`}~5?w~hd~!xKh]oiptu-utv.vp!#%&a30a@a'a+(a/aOp(o~p!RoDJu(!%RoHRhewjha=]oBNvdRl}g>w#Ro@g5vuRo>c[#X']o<CauRoRAd-#Y':RkpauRoQKu]C.!&;RoFJvB!%RoNRoPBx'h]v+_?w~ha}t5?w~he}ue!/UbhYacXaW^Tc&a;b:a-c/#b&aja1(!cL+!bKbt!bmcRc9aIc?8[yW3Dtt94Rg`Jv}!&SiRMzBhEebShEMNuPRe>x7gL#TzuwjirRipc<Z&>on;>z=h-MSh.Mwqczx'a7vj&!>Re4@=ResJt__NuPRi*NuPRi)j]uNr|~FRfzKrJ>_+@Wfy@Wf]2WocKrJ<!+'@Wg%g/QRl@@Jv`!&awRl<wsfFIzgLu(w*!.*&ShBMwvhIRhI9;RhNx1hK'!#Sn]Mx1hK~0!#:2<H~7cNu+w7D*'1ZtW>Rn1~?rOc:Z&Rn2=<rQ<7wjh&=BSnLMc]#X(6Vz)w[b=a!U#9wzgMc3#&(RgMRitRis<x,gKt`ax!&+SioM=BSilMc3#&(RgKRinRimKurB,!&SiQMzBhDebShDM6BJQ!(P~Efx978B2@@=I}WLrJw!!,a*&@G}O@9wkibRid@@x'fKwC!&SlDMSfLMjUv~Q~EfKKv3@a+!(hFv-]mpx/hYZ(C5RiWz<o/MwkhY?So/M@x,gbvfB*&!SgEM:SoeeehFu3:Rgbda(,^TZa)X/7Sg[eb:2RgI~BrMC@wgkc:wwkcRerx3h(uUvK!&*,SnOM4Sh*MArRg;wHRh(x=h;rJvPwI!a4',a'0@Wg&=BSh/Mg>w=Rh=g3w*wwgGRgGcW(X#;Sg}M2Gzk@Jv`!&awRl=wsfGIz`dKZ*T'Y-:RhR7RhQg5u-p`j6v(us5d,#Y+~Awkia?RicOuNBwkibba}Ld6p~tyu_vbAa'a+!a/'a3aEa8a!>Sh,ebJv{!&Sh@ebSaReb9;SgwebNuPRi(NvdRl)NuPRi'hHu^<Rm^Jvv_@Wl(g;u1Si/ebKu'B&!*Sh?eb@Wl'z@aPeb95Si.ebcpputyvjB)!,&a+0a%ShAMWeK@G}C@WfJ9;RhMwvhH9w{ia}ix,hJvRA1(!zAn[MRhHx1hJ~*!#hFv(BSn[MBJQ!(@@=I~'978B2@@=I}2db.Ua<'X}+T#a0XaG2G}E;wkg|wuh!Rh!x,hZu,@)!&So0MVy)C5RiXACJvB!&5RiY5RiZg8w)cG}*T#2@bU}=KsA>(!a.3wkhZba~(x,h^u(A!&(SoCMRhb5Bz=h[eb?w~hb~6x,h_u(A!&(SoDMRhc5Bz=h]eb?w~hc~6e)aA1T#T,^^^c-bMb&blcPaP(a/!0!bA=b5c@a(!bfbrc#2afwmhARnjwchORnp2Wlf3DtsNvdRl-2@wpa<]m0bx(#:awRk2@Jw3!%RfhwpfgRlnKQB%!(G{V@G|'NuuRl6d='T+Y#VyUg<v~Rl~==G|<Jv+'!aYShC}6@B<5?ba~8@Jw3'!g2QRljhLrpWlOd+#Y'g.w'rIg>w*wgj@g-u0Rj@Lu+wT&)ZtUauq]~GrGci&U#F|39:rELrNvj!.%*RhCwunfw~nf~:9;Ri]>wtnhg;wHRnhx3hDs@v~!/+'@Wfr@9RkSNu&Rlo=@<5GzoKs0@_+@Wl+@awRkmJuh!-3d(}pY#qWJvj!%Rm(:Jw3!%Rm,Rm*de&!1U-U#`)Re;@G|.@9Ri82@wjfvRlq=@<5GzpLvOvr!).&2RlF8Rf`C=x!eE{.Jw3_g2QRlkhLrpWlPde(!#U{s,UXa*Ta'[y'g:v>ReS;x0PZ&RnlRnn~HrKJw1}f!=x!eB|2w]aP(#Xa&a*Ta.Ua2a7=]iOd'#Y&Ro&WnWg;u.RiDg6vjRiBNvdRlzhNvj]nYJuW_2Wm3x)kFze{9d])!a.!,Y01!#&aC!a3RndC=ox~BrC@2b^{pg,rlse7x'ksuq!%Rm.E{xidw(wBRmGx9o+)X#wwo-So-}69:Rl4@xSf@a#XZ'X)X,Ta(/ARl8b[xc>RfY:RlI:RfQwlg.ARl:9;Rlwdn'#^XafaQa1X1TaHTa)@b[{zcZ#X'7RkwWg@Ou4ARn&x)kG#{,g7u/RkGdH'U#Y*Vz'Wm&CARm|bx#(A]gUbUzJj9Q~=d,#Y(56H}l978H{U7d,0#U*2>ABb_xZ978BbU{e~AJQ{g!978BbU{hxMh?ad{oUYZ.x1h?{l!#:2<H{mx3n[t{vl!,&a%3Ro(z=iS}6ARnr=Bwsn^wvn`Rnbd`*T}B0!#^X'BG{c9b]{a>>@=be}F?JvS!&BG{d7BG}(Bde#`a1X,Ya@!a'P~=wxf@2bZ}I56B2@@=aybb}08@55B9;5bb}<j3vLv;<Jw3&!>Rfg=ayb^}&OuNBKuLA!)a!P~=x#fD{f2@>==<bbzl?C972@@=Ix^d6rSu,v7w*C(0a)a6#B+a%!sQ[y?3Dt%3[xn~<5rLOu!5p@Ku+D#'!t7~GrP~?rNKvlaya7'!h+v-5qMg=t|cd,U#5AAaa5Abb{S@52B5@a[@52B5Gx[iXueu;d<#`a(!/549C;ag>23ExY5@Dah89b^~689Jv)!~2b[~1Lv'w(%*!a#bX|aPrmawRe]keu7uhv-q6rxu,q`xTo]/a5aU!bNaDXbi!b-!ao!b<bwA!#5@B932:aV2G|:d-)Y#hJrL>RhG<7@C5<H|_=Cau:5aj5@B932:bJ|ng>vIbs)#?C2F|9jPv0w.vISh-MKvUaz(.!9ABbb|[5;5<H|Eg>unwfh;9:4E|YjQsBt|vjx'hYq3!(?C2F|J:2<BaY?C2F|GOu!5x,g|p{ah!-(?C2F|c9:4E|OjXuvvNr}:Rh&i[w*t|cd+U#jJvsu)vsSn~Mkfrmu9p}u7vwv]So!McW#Xa!ax5@A5aY:5;5<H|>kJv~vYrquJu3x4ib#T)2@SmZM?C2F|Bj:rmu9@xPhI(a*a#U#`a3-5Abb|L~@:RhK9:4E|0@52B5G|#C::aY?C2F|-:2<BaY?C2F|.5Jvk!a)javYrquJu3x4ia#T)2@SmYM?C2F|HAxPhH(!a#U#`a*-5Abb|4~@:RhJ9:4E|R@52B5G|F:2<BaY?C2F|Sc^#Xa2j=Qq5CJvB!-g<v{z;hhM?C2F|Zi[vrv{z;hiM?C2F|XKsA>!a)-g<v{z;h[eb?C2F|]i[vrv{z;h]eb?C2F|^iZu.vix,hZq3ah!.(?C2F|QOu!5ShXM:2<BaY?C2F|P",13494,2713,49,25,61);var be=new Uint16Array([512,26465,29036,7,0,2,4,116,24638,116,24636,8693,29807,24610,621,1,0,0,3,112,24614,111,115,24615]);var J;(function(a){a[a["VALUE_LENGTH"]=49152]="VALUE_LENGTH";a[a["FLAG13"]=8192]="FLAG13";a[a["BRANCH_LENGTH"]=8064]="BRANCH_LENGTH";a[a["JUMP_TABLE"]=127]="JUMP_TABLE";a[a["VALUE_MASK"]=8191]="VALUE_MASK"})(J||(J={}));var U;(function(a){a[a["AMP"]=38]="AMP";a[a["NUM"]=35]="NUM";a[a["SEMI"]=59]="SEMI";a[a["EQUALS"]=61]="EQUALS";a[a["ZERO"]=48]="ZERO";a[a["NINE"]=57]="NINE";a[a["LOWER_A"]=97]="LOWER_A";a[a["LOWER_X"]=120]="LOWER_X"})(U||(U={}));var Ee=32;function ua(a){return a-U.ZERO>>>0<=9}function Ga(a){return(a|Ee)-U.LOWER_A>>>0<=5}function Va(a){return(a|Ee)-U.LOWER_A>>>0<=25}function Xa(a){return a===U.EQUALS||Va(a)||ua(a)}var F;(function(a){a[a["EntityStart"]=0]="EntityStart";a[a["NumericStart"]=1]="NumericStart";a[a["NumericDecimal"]=2]="NumericDecimal";a[a["NumericHex"]=3]="NumericHex";a[a["NamedEntity"]=4]="NamedEntity"})(F||(F={}));var G;(function(a){a[a["Legacy"]=0]="Legacy";a[a["Strict"]=1]="Strict";a[a["Attribute"]=2]="Attribute"})(G||(G={}));var Be=class{decodeTree;emitCodePoint;errors;state=F.EntityStart;consumed=1;result=0;treeIndex=0;excess=1;decodeMode=G.Strict;runConsumed=0;constructor(e,t,s){this.decodeTree=e;this.emitCodePoint=t;this.errors=s}startEntity(e){this.decodeMode=e;this.state=F.EntityStart;this.result=0;this.treeIndex=0;this.excess=1;this.consumed=1;this.runConsumed=0}write(e,t){switch(this.state){case F.EntityStart:{if(e.charCodeAt(t)===U.NUM){this.state=F.NumericStart;this.consumed+=1;return this.stateNumericStart(e,t+1)}this.state=F.NamedEntity;return this.stateNamedEntity(e,t)}case F.NumericStart:{return this.stateNumericStart(e,t)}case F.NumericDecimal:{return this.stateNumericDecimal(e,t)}case F.NumericHex:{return this.stateNumericHex(e,t)}default:{return this.stateNamedEntity(e,t)}}}stateNumericStart(e,t){if(t>=e.length){return-1}if((e.charCodeAt(t)|Ee)===U.LOWER_X){this.state=F.NumericHex;this.consumed+=1;return this.stateNumericHex(e,t+1)}this.state=F.NumericDecimal;return this.stateNumericDecimal(e,t)}stateNumericHex(e,t){const s=e.length;let{result:r}=this;let{consumed:i}=this;while(t<s){const n=e.charCodeAt(t);if(ua(n)||Ga(n)){const c=n<=U.NINE?n-U.ZERO:(n|Ee)-U.LOWER_A+10;r=r*16+c;i+=1;t+=1}else{this.result=r;this.consumed=i;return this.emitNumericEntity(n,3)}}this.result=r;this.consumed=i;return-1}stateNumericDecimal(e,t){const s=e.length;let{result:r}=this;let{consumed:i}=this;while(t<s){const n=e.charCodeAt(t)-U.ZERO;if(n>>>0>9){this.result=r;this.consumed=i;return this.emitNumericEntity(n+U.ZERO,2)}r=r*10+n;i+=1;t+=1}this.result=r;this.consumed=i;return-1}emitNumericEntity(e,t){if(this.consumed<=t){this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed);return 0}if(e===U.SEMI){this.consumed+=1}else if(this.decodeMode===G.Strict){return 0}this.emitCodePoint((this.decodeTree===be?ca:ha)(this.result),this.consumed);if(this.errors){if(e!==U.SEMI){this.errors.missingSemicolonAfterCharacterReference()}this.errors.validateNumericCharacterReference(this.result)}return this.consumed}flushAndEmitLegacyOrReject(e,t,s,r){this.consumed=e;this.excess=t;return this.result===0||this.decodeMode===G.Attribute&&(r===0||t>1||Xa(s))?0:this.emitNotTerminatedNamedEntity()}stateNamedEntity(e,t){const{decodeTree:s}=this;const r=e.length;const i=this.decodeMode===G.Strict;let{treeIndex:n}=this;let{excess:c}=this;let{consumed:w}=this;let d=s[n];while(t<r){while((d&(J.VALUE_LENGTH|J.FLAG13))===0&&(d&J.JUMP_TABLE)!==0){const x=e.charCodeAt(t);const h=d&J.JUMP_TABLE;const v=(d&J.BRANCH_LENGTH)>>7;if(v===0){if(x!==h){return this.flushAndEmitLegacyOrReject(w,c,x,0)}n+=1}else{const R=x-h;if(R>>>0>=v){return this.flushAndEmitLegacyOrReject(w,c,x,0)}const l=s[n+1+R];if(l===0){return this.flushAndEmitLegacyOrReject(w,c,x,0)}n=n+v+l&65535}d=s[n];t+=1;c+=1;if(t>=r)break}if(t>=r)break;if((d&(J.VALUE_LENGTH|J.FLAG13))===J.FLAG13){const x=(d&J.BRANCH_LENGTH)>>7;let{runConsumed:h}=this;if(h===0){const v=e.charCodeAt(t);if(v!==(d&J.JUMP_TABLE)){return this.flushAndEmitLegacyOrReject(w,c,v,0)}t+=1;c+=1;h=1}while(h<x){if(t>=r){this.treeIndex=n;this.excess=c;this.consumed=w;this.runConsumed=h;return-1}const v=h-1;const R=s[n+1+(v>>1)];const l=R>>((v&1)<<3)&255;const f=e.charCodeAt(t);if(f!==l){this.runConsumed=0;return this.flushAndEmitLegacyOrReject(w,c,f,0)}t+=1;c+=1;h+=1}this.runConsumed=0;n+=1+(x>>1);d=s[n];continue}const u=d>>>14;const y=e.charCodeAt(t);if(u!==0){if(!i&&(d&J.FLAG13)===0){this.result=n;w+=c-1;c=1}if(y===U.SEMI){return this.emitNamedEntityData(n,u,w+c)}if(u===1){return this.flushAndEmitLegacyOrReject(w,c,y,u)}}const S=Za(s,d,n+(u||1),y);if(S<0){return this.flushAndEmitLegacyOrReject(w,c,y,u)}n=S;d=s[n];t+=1;c+=1}if(!i&&d>>>14!==0&&(d&J.FLAG13)===0){this.result=n;w+=c-1;c=1}this.treeIndex=n;this.excess=c;this.consumed=w;return-1}emitNotTerminatedNamedEntity(){const{result:e,decodeTree:t}=this;const s=t[e]>>>14;this.emitNamedEntityData(e,s,this.consumed);this.errors?.missingSemicolonAfterCharacterReference();return this.consumed}emitNamedEntityData(e,t,s){const{decodeTree:r}=this;this.emitCodePoint(t===1?r[e]&J.VALUE_MASK:r[e+1],s);if(t===3){this.emitCodePoint(r[e+2],s)}return s}end(){switch(this.state){case F.NamedEntity:{return this.result!==0&&(this.decodeMode!==G.Attribute||this.result===this.treeIndex)?this.emitNotTerminatedNamedEntity():0}case F.NumericDecimal:{return this.emitNumericEntity(0,2)}case F.NumericHex:{return this.emitNumericEntity(0,3)}case F.NumericStart:{this.errors?.absenceOfDigitsInNumericCharacterReference(this.consumed);return 0}default:{return 0}}}};function Za(a,e,t,s){const r=(e&J.BRANCH_LENGTH)>>7;const i=e&J.JUMP_TABLE;if(i){if(r===0){return s===i?t:-1}const w=s-i;if(w>>>0>=r)return-1;const d=a[t+w];return d===0?-1:t+r+d-1&65535}if(r===0)return-1;const n=r+1>>1;const c=t+n+r;for(let w=0;w<r;w++){const d=a[t+(w>>1)];const u=d>>((w&1)<<3)&255;if(u===s){const y=t+n+w;return c+a[y]&65535}if(u>s)return-1}return-1}var p;(function(a){a[a["Tab"]=9]="Tab";a[a["NewLine"]=10]="NewLine";a[a["FormFeed"]=12]="FormFeed";a[a["CarriageReturn"]=13]="CarriageReturn";a[a["Space"]=32]="Space";a[a["ExclamationMark"]=33]="ExclamationMark";a[a["Number"]=35]="Number";a[a["Amp"]=38]="Amp";a[a["SingleQuote"]=39]="SingleQuote";a[a["DoubleQuote"]=34]="DoubleQuote";a[a["Dash"]=45]="Dash";a[a["Slash"]=47]="Slash";a[a["Zero"]=48]="Zero";a[a["Nine"]=57]="Nine";a[a["Semi"]=59]="Semi";a[a["Lt"]=60]="Lt";a[a["Eq"]=61]="Eq";a[a["Gt"]=62]="Gt";a[a["Questionmark"]=63]="Questionmark";a[a["UpperA"]=65]="UpperA";a[a["LowerA"]=97]="LowerA";a[a["UpperF"]=70]="UpperF";a[a["LowerF"]=102]="LowerF";a[a["UpperZ"]=90]="UpperZ";a[a["LowerZ"]=122]="LowerZ";a[a["LowerX"]=120]="LowerX";a[a["OpeningSquareBracket"]=91]="OpeningSquareBracket"})(p||(p={}));var o;(function(a){a[a["Text"]=1]="Text";a[a["BeforeTagName"]=2]="BeforeTagName";a[a["InTagName"]=3]="InTagName";a[a["InSelfClosingTag"]=4]="InSelfClosingTag";a[a["BeforeClosingTagName"]=5]="BeforeClosingTagName";a[a["InClosingTagName"]=6]="InClosingTagName";a[a["AfterClosingTagName"]=7]="AfterClosingTagName";a[a["BeforeAttributeName"]=8]="BeforeAttributeName";a[a["InAttributeName"]=9]="InAttributeName";a[a["AfterAttributeName"]=10]="AfterAttributeName";a[a["BeforeAttributeValue"]=11]="BeforeAttributeValue";a[a["InAttributeValueDq"]=12]="InAttributeValueDq";a[a["InAttributeValueSq"]=13]="InAttributeValueSq";a[a["InAttributeValueNq"]=14]="InAttributeValueNq";a[a["BeforeDeclaration"]=15]="BeforeDeclaration";a[a["InDeclaration"]=16]="InDeclaration";a[a["InProcessingInstruction"]=17]="InProcessingInstruction";a[a["BeforeComment"]=18]="BeforeComment";a[a["CDATASequence"]=19]="CDATASequence";a[a["DeclarationSequence"]=20]="DeclarationSequence";a[a["InSpecialComment"]=21]="InSpecialComment";a[a["InCommentLike"]=22]="InCommentLike";a[a["SpecialStartSequence"]=23]="SpecialStartSequence";a[a["InSpecialTag"]=24]="InSpecialTag";a[a["InPlainText"]=25]="InPlainText";a[a["InEntity"]=26]="InEntity"})(o||(o={}));function ee(a){return a===p.Space||a===p.NewLine||a===p.Tab||a===p.FormFeed||a===p.CarriageReturn}function se(a){return a===p.Slash||a===p.Gt||ee(a)}function Ka(a){return a>=p.LowerA&&a<=p.LowerZ||a>=p.UpperA&&a<=p.UpperZ}var V;(function(a){a[a["NoValue"]=0]="NoValue";a[a["Unquoted"]=1]="Unquoted";a[a["Single"]=2]="Single";a[a["Double"]=3]="Double"})(V||(V={}));var C={Empty:new Uint8Array(0),Cdata:new Uint8Array([67,68,65,84,65,91]),CdataEnd:new Uint8Array([93,93,62]),CommentEnd:new Uint8Array([45,45,33,62]),Doctype:new Uint8Array([100,111,99,116,121,112,101]),IframeEnd:new Uint8Array([60,47,105,102,114,97,109,101]),NoembedEnd:new Uint8Array([60,47,110,111,101,109,98,101,100]),NoframesEnd:new Uint8Array([60,47,110,111,102,114,97,109,101,115]),Plaintext:new Uint8Array([60,47,112,108,97,105,110,116,101,120,116]),ScriptEnd:new Uint8Array([60,47,115,99,114,105,112,116]),StyleEnd:new Uint8Array([60,47,115,116,121,108,101]),TitleEnd:new Uint8Array([60,47,116,105,116,108,101]),TextareaEnd:new Uint8Array([60,47,116,101,120,116,97,114,101,97]),XmpEnd:new Uint8Array([60,47,120,109,112])};var Qa=new Map([[C.IframeEnd[2],C.IframeEnd],[C.NoembedEnd[2],C.NoembedEnd],[C.Plaintext[2],C.Plaintext],[C.ScriptEnd[2],C.ScriptEnd],[C.TitleEnd[2],C.TitleEnd],[C.XmpEnd[2],C.XmpEnd]]);var fe=class{cbs;state=o.Text;buffer="";sectionStart=0;index=0;entityStart=0;baseState=o.Text;isSpecial=false;running=true;offset=0;xmlMode;decodeEntities;recognizeSelfClosing;entityDecoder;constructor({xmlMode:e=false,decodeEntities:t=true,recognizeSelfClosing:s=e},r){this.cbs=r;this.xmlMode=e;this.decodeEntities=t;this.recognizeSelfClosing=s;this.entityDecoder=new Be(e?be:_e,(i,n)=>this.emitCodePoint(i,n))}reset(){this.state=o.Text;this.buffer="";this.sectionStart=0;this.index=0;this.baseState=o.Text;this.isSpecial=false;this.currentSequence=C.Empty;this.sequenceIndex=0;this.running=true;this.offset=0}write(e){this.offset+=this.buffer.length;this.buffer=e;this.parse()}end(){if(this.running)this.finish()}pause(){this.running=false}resume(){this.running=true;if(this.index<this.buffer.length+this.offset){this.parse()}}stateText(e){if(e===p.Lt||!this.decodeEntities&&this.fastForwardTo(p.Lt)){if(this.index>this.sectionStart){this.cbs.ontext(this.sectionStart,this.index)}this.state=o.BeforeTagName;this.sectionStart=this.index}else if(this.decodeEntities&&e===p.Amp){this.startEntity()}}currentSequence=C.Empty;sequenceIndex=0;enterTagBody(){if(this.currentSequence===C.Plaintext){this.currentSequence=C.Empty;this.state=o.InPlainText}else if(this.isSpecial){this.state=o.InSpecialTag;this.sequenceIndex=0}else{this.state=o.Text}}stateSpecialStartSequence(e){const t=e|32;if(this.sequenceIndex<this.currentSequence.length){if(t===this.currentSequence[this.sequenceIndex]){this.sequenceIndex++;return}if(this.sequenceIndex===3){if(this.currentSequence===C.ScriptEnd&&t===C.StyleEnd[3]){this.currentSequence=C.StyleEnd;this.sequenceIndex=4;return}if(this.currentSequence===C.TitleEnd&&t===C.TextareaEnd[3]){this.currentSequence=C.TextareaEnd;this.sequenceIndex=4;return}}else if(this.sequenceIndex===4&&this.currentSequence===C.NoembedEnd&&t===C.NoframesEnd[4]){this.currentSequence=C.NoframesEnd;this.sequenceIndex=5;return}}else if(se(e)){this.sequenceIndex=0;this.state=o.InTagName;this.stateInTagName(e);return}this.isSpecial=false;this.currentSequence=C.Empty;this.sequenceIndex=0;this.state=o.InTagName;this.stateInTagName(e)}stateCDATASequence(e){if(e===C.Cdata[this.sequenceIndex]){if(++this.sequenceIndex===C.Cdata.length){this.state=o.InCommentLike;this.currentSequence=C.CdataEnd;this.sequenceIndex=0;this.sectionStart=this.index+1}}else{this.sequenceIndex=0;if(this.xmlMode){this.state=o.InDeclaration;this.stateInDeclaration(e)}else{this.state=o.InSpecialComment;this.stateInSpecialComment(e)}}}fastForwardTo(e){while(++this.index<this.buffer.length+this.offset){if(this.buffer.charCodeAt(this.index-this.offset)===e){return true}}this.index=this.buffer.length+this.offset-1;return false}emitComment(e){this.cbs.oncomment(this.sectionStart,this.index,e);this.sequenceIndex=0;this.sectionStart=this.index+1;this.state=o.Text}stateInCommentLike(e){if(!this.xmlMode&&this.currentSequence===C.CommentEnd&&this.sequenceIndex<=1&&this.index===this.sectionStart+this.sequenceIndex&&e===p.Gt){this.emitComment(this.sequenceIndex)}else if(this.currentSequence===C.CommentEnd&&this.sequenceIndex===2&&e===p.Gt){this.emitComment(2)}else if(this.currentSequence===C.CommentEnd&&this.sequenceIndex===this.currentSequence.length-1&&e!==p.Gt){this.sequenceIndex=Number(e===p.Dash)}else if(e===this.currentSequence[this.sequenceIndex]){if(++this.sequenceIndex===this.currentSequence.length){if(this.currentSequence===C.CdataEnd){this.cbs.oncdata(this.sectionStart,this.index,2)}else{this.cbs.oncomment(this.sectionStart,this.index,3)}this.sequenceIndex=0;this.sectionStart=this.index+1;this.state=o.Text}}else if(this.sequenceIndex===0){if(this.fastForwardTo(this.currentSequence[0])){this.sequenceIndex=1}}else if(e!==this.currentSequence[this.sequenceIndex-1]){this.sequenceIndex=0}}isTagStartChar(e){return this.xmlMode?!se(e):Ka(e)}stateInSpecialTag(e){if(this.sequenceIndex===this.currentSequence.length){if(se(e)){const t=this.index-this.currentSequence.length;if(this.sectionStart<t){const s=this.index;this.index=t;this.cbs.ontext(this.sectionStart,t);this.index=s}this.isSpecial=false;this.sectionStart=t+2;this.stateInClosingTagName(e);return}this.sequenceIndex=0}if((e|32)===this.currentSequence[this.sequenceIndex]){this.sequenceIndex+=1}else if(this.sequenceIndex===0){if(this.currentSequence===C.TitleEnd||this.currentSequence===C.TextareaEnd){if(this.decodeEntities&&e===p.Amp){this.startEntity()}}else if(this.fastForwardTo(p.Lt)){this.sequenceIndex=1}}else{this.sequenceIndex=Number(e===p.Lt)}}stateBeforeTagName(e){if(e===p.ExclamationMark){this.state=o.BeforeDeclaration;this.sectionStart=this.index+1}else if(e===p.Questionmark){if(this.xmlMode){this.state=o.InProcessingInstruction;this.sequenceIndex=0;this.sectionStart=this.index+1}else{this.state=o.InSpecialComment;this.sectionStart=this.index}}else if(this.isTagStartChar(e)){this.sectionStart=this.index;const t=this.xmlMode||this.cbs.isInForeignContext?.()?void 0:Qa.get(e|32);if(t===void 0){this.state=o.InTagName}else{this.isSpecial=true;this.currentSequence=t;this.sequenceIndex=3;this.state=o.SpecialStartSequence}}else if(e===p.Slash){this.state=o.BeforeClosingTagName}else{this.state=o.Text;this.stateText(e)}}stateInTagName(e){if(se(e)){this.cbs.onopentagname(this.sectionStart,this.index);this.sectionStart=-1;this.state=o.BeforeAttributeName;this.stateBeforeAttributeName(e)}}stateBeforeClosingTagName(e){if(ee(e)){if(this.xmlMode){}else{this.state=o.InSpecialComment;this.sectionStart=this.index}}else if(e===p.Gt){this.state=o.Text;if(!this.xmlMode){this.sectionStart=this.index+1}}else{this.state=this.isTagStartChar(e)?o.InClosingTagName:o.InSpecialComment;this.sectionStart=this.index}}stateInClosingTagName(e){if(se(e)){this.cbs.onclosetag(this.sectionStart,this.index);this.sectionStart=-1;this.state=o.AfterClosingTagName;this.stateAfterClosingTagName(e)}}stateAfterClosingTagName(e){if(e===p.Gt||this.fastForwardTo(p.Gt)){this.state=o.Text;this.sectionStart=this.index+1}}stateBeforeAttributeName(e){if(e===p.Gt){this.cbs.onopentagend(this.index);this.enterTagBody();this.sectionStart=this.index+1}else if(e===p.Slash){this.state=o.InSelfClosingTag}else if(!ee(e)){this.state=o.InAttributeName;this.sectionStart=this.index}}stateInSelfClosingTag(e){if(e===p.Gt){this.cbs.onselfclosingtag(this.index);this.sectionStart=this.index+1;if(!this.recognizeSelfClosing){this.enterTagBody();return}this.state=o.Text;this.isSpecial=false;this.currentSequence=C.Empty}else if(!ee(e)){this.state=o.BeforeAttributeName;this.stateBeforeAttributeName(e)}}stateInAttributeName(e){if(e===p.Eq||se(e)){this.cbs.onattribname(this.sectionStart,this.index);this.sectionStart=this.index;this.state=o.AfterAttributeName;this.stateAfterAttributeName(e)}}stateAfterAttributeName(e){if(e===p.Eq){this.state=o.BeforeAttributeValue}else if(e===p.Slash||e===p.Gt){this.cbs.onattribend(V.NoValue,this.sectionStart);this.sectionStart=-1;this.state=o.BeforeAttributeName;this.stateBeforeAttributeName(e)}else if(!ee(e)){this.cbs.onattribend(V.NoValue,this.sectionStart);this.state=o.InAttributeName;this.sectionStart=this.index}}stateBeforeAttributeValue(e){if(e===p.DoubleQuote){this.state=o.InAttributeValueDq;this.sectionStart=this.index+1}else if(e===p.SingleQuote){this.state=o.InAttributeValueSq;this.sectionStart=this.index+1}else if(!ee(e)){this.sectionStart=this.index;this.state=o.InAttributeValueNq;this.stateInAttributeValueNoQuotes(e)}}handleInAttributeValue(e,t){if(e===t||!this.decodeEntities&&this.fastForwardTo(t)){this.cbs.onattribdata(this.sectionStart,this.index);this.sectionStart=-1;this.cbs.onattribend(t===p.DoubleQuote?V.Double:V.Single,this.index+1);this.state=o.BeforeAttributeName}else if(this.decodeEntities&&e===p.Amp){this.startEntity()}}stateInAttributeValueDoubleQuotes(e){this.handleInAttributeValue(e,p.DoubleQuote)}stateInAttributeValueSingleQuotes(e){this.handleInAttributeValue(e,p.SingleQuote)}stateInAttributeValueNoQuotes(e){if(ee(e)||e===p.Gt){this.cbs.onattribdata(this.sectionStart,this.index);this.sectionStart=-1;this.cbs.onattribend(V.Unquoted,this.index);this.state=o.BeforeAttributeName;this.stateBeforeAttributeName(e)}else if(this.decodeEntities&&e===p.Amp){this.startEntity()}}stateBeforeDeclaration(e){if(e===p.OpeningSquareBracket){this.state=o.CDATASequence;this.sequenceIndex=0}else if(this.xmlMode){this.state=e===p.Dash?o.BeforeComment:o.InDeclaration}else if((e|32)===C.Doctype[0]){this.state=o.DeclarationSequence;this.currentSequence=C.Doctype;this.sequenceIndex=1}else if(e===p.Gt){this.cbs.oncomment(this.sectionStart,this.index,0);this.state=o.Text;this.sectionStart=this.index+1}else if(e===p.Dash){this.state=o.BeforeComment}else{this.state=o.InSpecialComment}}stateDeclarationSequence(e){if(this.sequenceIndex===this.currentSequence.length){this.state=o.InDeclaration;this.stateInDeclaration(e)}else if((e|32)===this.currentSequence[this.sequenceIndex]){this.sequenceIndex+=1}else if(e===p.Gt){this.cbs.oncomment(this.sectionStart,this.index,0);this.state=o.Text;this.sectionStart=this.index+1}else{this.state=o.InSpecialComment}}stateInDeclaration(e){if(e===p.Gt||this.fastForwardTo(p.Gt)){this.cbs.ondeclaration(this.sectionStart,this.index);this.state=o.Text;this.sectionStart=this.index+1}}stateInProcessingInstruction(e){if(e===p.Questionmark){this.sequenceIndex=1}else if(e===p.Gt&&this.sequenceIndex===1){this.cbs.onprocessinginstruction(this.sectionStart,this.index-1);this.sequenceIndex=0;this.state=o.Text;this.sectionStart=this.index+1}else{this.sequenceIndex=Number(this.fastForwardTo(p.Questionmark))}}stateBeforeComment(e){if(e===p.Dash){this.state=o.InCommentLike;this.currentSequence=C.CommentEnd;this.sequenceIndex=0;this.sectionStart=this.index+1}else if(this.xmlMode){this.state=o.InDeclaration}else if(e===p.Gt){this.cbs.oncomment(this.sectionStart,this.index,0);this.state=o.Text;this.sectionStart=this.index+1}else{this.state=o.InSpecialComment}}stateInSpecialComment(e){if(e===p.Gt||this.fastForwardTo(p.Gt)){this.cbs.oncomment(this.sectionStart,this.index,0);this.state=o.Text;this.sectionStart=this.index+1}}startEntity(){this.baseState=this.state;this.state=o.InEntity;this.entityStart=this.index;this.entityDecoder.startEntity(this.xmlMode?G.Strict:this.baseState===o.Text||this.baseState===o.InSpecialTag?G.Legacy:G.Attribute)}stateInEntity(){const e=this.index-this.offset;const t=this.entityDecoder.write(this.buffer,e);if(t>=0){this.state=this.baseState;if(t===0){this.index-=1}}else{if(e<this.buffer.length&&this.buffer.charCodeAt(e)===p.Amp){this.state=this.baseState;this.index-=1;return}this.index=this.offset+this.buffer.length-1}}cleanup(){if(this.running&&this.sectionStart!==this.index){if(this.state===o.Text||this.state===o.InPlainText||this.state===o.InSpecialTag&&this.sequenceIndex===0){this.cbs.ontext(this.sectionStart,this.index);this.sectionStart=this.index}else if(this.state===o.InAttributeValueDq||this.state===o.InAttributeValueSq||this.state===o.InAttributeValueNq){this.cbs.onattribdata(this.sectionStart,this.index);this.sectionStart=this.index}}}shouldContinue(){return this.index<this.buffer.length+this.offset&&this.running}parse(){while(this.shouldContinue()){const e=this.buffer.charCodeAt(this.index-this.offset);switch(this.state){case o.Text:{this.stateText(e);break}case o.InPlainText:{this.index=this.buffer.length+this.offset-1;break}case o.SpecialStartSequence:{this.stateSpecialStartSequence(e);break}case o.InSpecialTag:{this.stateInSpecialTag(e);break}case o.CDATASequence:{this.stateCDATASequence(e);break}case o.DeclarationSequence:{this.stateDeclarationSequence(e);break}case o.InAttributeValueDq:{this.stateInAttributeValueDoubleQuotes(e);break}case o.InAttributeName:{this.stateInAttributeName(e);break}case o.InCommentLike:{this.stateInCommentLike(e);break}case o.InSpecialComment:{this.stateInSpecialComment(e);break}case o.BeforeAttributeName:{this.stateBeforeAttributeName(e);break}case o.InTagName:{this.stateInTagName(e);break}case o.InClosingTagName:{this.stateInClosingTagName(e);break}case o.BeforeTagName:{this.stateBeforeTagName(e);break}case o.AfterAttributeName:{this.stateAfterAttributeName(e);break}case o.InAttributeValueSq:{this.stateInAttributeValueSingleQuotes(e);break}case o.BeforeAttributeValue:{this.stateBeforeAttributeValue(e);break}case o.BeforeClosingTagName:{this.stateBeforeClosingTagName(e);break}case o.AfterClosingTagName:{this.stateAfterClosingTagName(e);break}case o.InAttributeValueNq:{this.stateInAttributeValueNoQuotes(e);break}case o.InSelfClosingTag:{this.stateInSelfClosingTag(e);break}case o.InDeclaration:{this.stateInDeclaration(e);break}case o.BeforeDeclaration:{this.stateBeforeDeclaration(e);break}case o.BeforeComment:{this.stateBeforeComment(e);break}case o.InProcessingInstruction:{this.stateInProcessingInstruction(e);break}case o.InEntity:{this.stateInEntity();break}}this.index++}this.cleanup()}finish(){if(this.state===o.InEntity){this.entityDecoder.end();this.state=this.baseState}this.handleTrailingData();this.cbs.onend()}handleTrailingCommentLikeData(e){if(this.state!==o.InCommentLike){return false}if(this.currentSequence===C.CdataEnd){if(this.xmlMode){if(this.sectionStart<e){this.cbs.oncdata(this.sectionStart,e,0)}}else{const t=this.sectionStart-C.Cdata.length-1;this.cbs.oncomment(t,e,0)}}else{const t=this.xmlMode?0:Math.min(this.sequenceIndex,C.CommentEnd.length-1);this.cbs.oncomment(this.sectionStart,e,t)}return true}handleTrailingMarkupDeclaration(e){if(this.xmlMode){switch(this.state){case o.InSpecialComment:case o.BeforeComment:case o.CDATASequence:case o.DeclarationSequence:case o.InDeclaration:{this.cbs.ontext(this.sectionStart,e);return true}default:{return false}}}switch(this.state){case o.BeforeDeclaration:case o.InSpecialComment:case o.BeforeComment:case o.CDATASequence:{this.cbs.oncomment(this.sectionStart,e,0);return true}case o.DeclarationSequence:{if(this.sequenceIndex!==C.Doctype.length){this.cbs.oncomment(this.sectionStart,e,0)}return true}case o.InDeclaration:{return true}default:{return false}}}handleTrailingData(){const e=this.buffer.length+this.offset;if(this.handleTrailingCommentLikeData(e)||this.handleTrailingMarkupDeclaration(e)){return}if(this.sectionStart>=e){return}switch(this.state){case o.InTagName:case o.BeforeAttributeName:case o.BeforeAttributeValue:case o.AfterAttributeName:case o.InAttributeName:case o.InAttributeValueSq:case o.InAttributeValueDq:case o.InAttributeValueNq:case o.InClosingTagName:{break}default:{this.cbs.ontext(this.sectionStart,e)}}}emitCodePoint(e,t){if(this.baseState!==o.Text&&this.baseState!==o.InSpecialTag){if(this.sectionStart<this.entityStart){this.cbs.onattribdata(this.sectionStart,this.entityStart)}this.sectionStart=this.entityStart+t;this.index=this.sectionStart-1;this.cbs.onattribentity(e)}else{if(this.sectionStart<this.entityStart){this.cbs.ontext(this.sectionStart,this.entityStart)}this.sectionStart=this.entityStart+t;this.index=this.sectionStart-1;this.cbs.ontextentity(e,this.sectionStart)}}};var{fromCodePoint:ba}=String;var re=new Set(["input","option","optgroup","select","button","datalist","textarea"]);var L=new Set(["p"]);var ie=new Set(["h1","h2","h3","h4","h5","h6","p"]);var fa=new Set(["thead","tbody"]);var ga=new Set(["dd","dt"]);var wa=new Set(["rt","rp"]);var $a=new Map([["tr",new Set(["tr","th","td"])],["th",new Set(["th"])],["td",new Set(["thead","th","td"])],["body",new Set(["head","link","script"])],["a",new Set(["a"])],["li",new Set(["li"])],["p",L],["h1",ie],["h2",ie],["h3",ie],["h4",ie],["h5",ie],["h6",ie],["select",re],["input",re],["output",re],["button",re],["datalist",re],["textarea",re],["option",new Set(["option"])],["optgroup",new Set(["optgroup","option"])],["dd",ga],["dt",ga],["address",L],["article",L],["aside",L],["blockquote",L],["details",L],["div",L],["dl",L],["fieldset",L],["figcaption",L],["figure",L],["footer",L],["form",L],["header",L],["hr",L],["main",L],["nav",L],["ol",L],["pre",L],["section",L],["table",L],["ul",L],["rt",wa],["rp",wa],["tbody",fa],["tfoot",fa]]);var xa="doctype";var et=new Set(["area","base","basefont","br","col","command","embed","frame","hr","img","input","isindex","keygen","link","meta","param","source","track","wbr"]);var at=new Set(["math","svg"]);var ma=new Set(["mi","mo","mn","ms","mtext","annotation-xml","foreignObject","desc","title"]);var ya=new Map([["altglyph","altGlyph"],["altglyphdef","altGlyphDef"],["altglyphitem","altGlyphItem"],["animatecolor","animateColor"],["animatemotion","animateMotion"],["animatetransform","animateTransform"],["clippath","clipPath"],["feblend","feBlend"],["fecolormatrix","feColorMatrix"],["fecomponenttransfer","feComponentTransfer"],["fecomposite","feComposite"],["feconvolvematrix","feConvolveMatrix"],["fediffuselighting","feDiffuseLighting"],["fedisplacementmap","feDisplacementMap"],["fedistantlight","feDistantLight"],["fedropshadow","feDropShadow"],["feflood","feFlood"],["fefunca","feFuncA"],["fefuncb","feFuncB"],["fefuncg","feFuncG"],["fefuncr","feFuncR"],["fegaussianblur","feGaussianBlur"],["feimage","feImage"],["femerge","feMerge"],["femergenode","feMergeNode"],["femorphology","feMorphology"],["feoffset","feOffset"],["fepointlight","fePointLight"],["fespecularlighting","feSpecularLighting"],["fespotlight","feSpotLight"],["fetile","feTile"],["feturbulence","feTurbulence"],["foreignobject","foreignObject"],["glyphref","glyphRef"],["lineargradient","linearGradient"],["radialgradient","radialGradient"],["textpath","textPath"]]);var Q;(function(a){a[a["None"]=0]="None";a[a["Svg"]=1]="Svg";a[a["MathML"]=2]="MathML"})(Q||(Q={}));var tt=/\s|\//;var De=class{options;startIndex=0;endIndex=0;openTagStart=0;tagname="";attribname="";attribvalue="";attribs=null;stack=[];foreignContext;cbs;lowerCaseTagNames;lowerCaseAttributeNames;recognizeSelfClosing;htmlMode;tokenizer;buffers=[];bufferOffset=0;writeIndex=0;ended=false;constructor(e,t={}){this.options=t;this.cbs=e??{};this.htmlMode=!this.options.xmlMode;this.lowerCaseTagNames=t.lowerCaseTags??this.htmlMode;this.lowerCaseAttributeNames=t.lowerCaseAttributeNames??this.htmlMode;this.recognizeSelfClosing=t.recognizeSelfClosing??!this.htmlMode;this.tokenizer=new(t.Tokenizer??fe)(this.options,this);this.foreignContext=[Q.None];this.cbs.onparserinit?.(this)}ontext(e,t){const s=this.getSlice(e,t);this.endIndex=t-1;this.cbs.ontext?.(s);this.startIndex=t}ontextentity(e,t){this.endIndex=t-1;this.cbs.ontext?.(ba(e));this.startIndex=t}isInForeignContext(){return this.foreignContext[0]!==Q.None}isVoidElement(e){return this.htmlMode&&et.has(e)}readTagName(e,t){const s=this.lowerCaseTagNames?this.getSlice(e,t).toLowerCase():this.getSlice(e,t);if(!(this.lowerCaseTagNames&&this.htmlMode)){return s}if(this.foreignContext[0]===Q.Svg){return ya.get(s)??s}if(this.foreignContext.length>1){const r=ya.get(s);if(r!==void 0&&this.stack.includes(r)){return r}}if(!this.isInForeignContext()){return s==="image"?"img":s}return s}onopentagname(e,t){this.endIndex=t;this.emitOpenTag(this.readTagName(e,t))}emitOpenTag(e){this.openTagStart=this.startIndex;this.tagname=e;if(this.htmlMode&&e==="form"&&this.stack.includes("form")){this.tagname="";return}const t=this.htmlMode&&$a.get(e);if(t){while(this.stack.length>0&&t.has(this.stack[0])){this.popElement(true)}}if(!this.isVoidElement(e)){this.stack.unshift(e);if(this.htmlMode){if(e==="svg"){this.foreignContext.unshift(Q.Svg)}else if(e==="math"){this.foreignContext.unshift(Q.MathML)}else if(ma.has(e)){this.foreignContext.unshift(Q.None)}}}this.cbs.onopentagname?.(e);if(this.cbs.onopentag)this.attribs={}}endOpenTag(e){this.startIndex=this.openTagStart;if(this.attribs){this.cbs.onopentag?.(this.tagname,this.attribs,e);this.attribs=null}if(this.cbs.onclosetag&&this.isVoidElement(this.tagname)){this.cbs.onclosetag(this.tagname,true)}this.tagname=""}onopentagend(e){this.endIndex=e;this.endOpenTag(false);this.startIndex=e+1}onclosetag(e,t){this.endIndex=t;const s=this.readTagName(e,t);if(!this.isVoidElement(s)){const r=this.stack.indexOf(s);if(r!==-1){for(let i=0;i<r;i++){this.popElement(true)}this.popElement(false)}else if(this.htmlMode&&s==="p"){this.emitOpenTag("p");this.closeCurrentTag(true)}}else if(this.htmlMode&&s==="br"){this.cbs.onopentagname?.("br");this.cbs.onopentag?.("br",{},true);this.cbs.onclosetag?.("br",false)}this.startIndex=t+1}onselfclosingtag(e){this.endIndex=e;if(this.recognizeSelfClosing||this.isInForeignContext()){this.closeCurrentTag(false);this.startIndex=e+1}else{this.onopentagend(e)}}popElement(e){const t=this.stack.shift();if(this.htmlMode&&(at.has(t)||ma.has(t))){this.foreignContext.shift()}this.cbs.onclosetag?.(t,e)}closeCurrentTag(e){const t=this.tagname;this.endOpenTag(e);if(this.stack[0]===t){this.popElement(!e)}}onattribname(e,t){this.startIndex=e;const s=this.getSlice(e,t);this.attribname=this.lowerCaseAttributeNames?s.toLowerCase():s}onattribdata(e,t){this.attribvalue+=this.getSlice(e,t)}onattribentity(e){this.attribvalue+=ba(e)}onattribend(e,t){this.endIndex=t;this.cbs.onattribute?.(this.attribname,this.attribvalue,e===V.Double?'"':e===V.Single?"'":e===V.NoValue?void 0:null);if(this.attribs&&!Object.hasOwn(this.attribs,this.attribname)){this.attribs[this.attribname]=this.attribvalue}this.attribvalue=""}getInstructionName(e){const t=e.search(tt);let s=t<0?e:e.substr(0,t);if(this.lowerCaseTagNames){s=s.toLowerCase()}return s}ondeclaration(e,t){this.endIndex=t;const s=this.getSlice(e,t);if(this.cbs.onprocessinginstruction){const r=this.htmlMode?this.lowerCaseTagNames?xa:s.slice(0,xa.length):this.getInstructionName(s);this.cbs.onprocessinginstruction(`!${r}`,`!${s}`)}this.startIndex=t+1}onprocessinginstruction(e,t){this.endIndex=t;const s=this.getSlice(e,t);if(this.cbs.onprocessinginstruction){const r=this.getInstructionName(s);this.cbs.onprocessinginstruction(`?${r}`,`?${s}`)}this.startIndex=t+1}oncomment(e,t,s){this.endIndex=t;this.cbs.oncomment?.(this.getSlice(e,t-s));this.cbs.oncommentend?.();this.startIndex=t+1}oncdata(e,t,s){this.endIndex=t;const r=this.getSlice(e,t-s);if(!this.htmlMode||this.options.recognizeCDATA){this.cbs.oncdatastart?.();this.cbs.ontext?.(r);this.cbs.oncdataend?.()}else if(this.isInForeignContext()){this.cbs.ontext?.(r)}else{this.cbs.oncomment?.(`[CDATA[${r}]]`);this.cbs.oncommentend?.()}this.startIndex=t+1}onend(){if(this.cbs.onclosetag){this.endIndex=this.startIndex;for(let e=0;e<this.stack.length;e++){this.cbs.onclosetag(this.stack[e],true)}}this.cbs.onend?.()}reset(){this.cbs.onreset?.();this.tokenizer.reset();this.tagname="";this.attribname="";this.attribvalue="";this.attribs=null;this.stack.length=0;this.startIndex=0;this.endIndex=0;this.cbs.onparserinit?.(this);this.buffers.length=0;this.foreignContext.length=0;this.foreignContext.unshift(Q.None);this.bufferOffset=0;this.writeIndex=0;this.ended=false}parseComplete(e){this.reset();this.end(e)}getSlice(e,t){if(e===t){return""}while(e-this.bufferOffset>=this.buffers[0].length){this.shiftBuffer()}let s=this.buffers[0].slice(e-this.bufferOffset,t-this.bufferOffset);while(t-this.bufferOffset>this.buffers[0].length){this.shiftBuffer();s+=this.buffers[0].slice(0,t-this.bufferOffset)}return s}shiftBuffer(){this.bufferOffset+=this.buffers[0].length;this.writeIndex--;this.buffers.shift()}write(e){if(this.ended){this.cbs.onerror?.(new Error(".write() after done!"));return}this.buffers.push(e);if(this.tokenizer.running){this.tokenizer.write(e);this.writeIndex++}}end(e){if(this.ended){this.cbs.onerror?.(new Error(".end() after done!"));return}if(e)this.write(e);this.ended=true;this.tokenizer.end()}pause(){this.tokenizer.pause()}resume(){this.tokenizer.resume();while(this.tokenizer.running&&this.writeIndex<this.buffers.length){this.tokenizer.write(this.buffers[this.writeIndex++])}if(this.ended)this.tokenizer.end()}};var E;(function(a){a["Root"]="root";a["Text"]="text";a["Directive"]="directive";a["Comment"]="comment";a["Script"]="script";a["Style"]="style";a["Tag"]="tag";a["CDATA"]="cdata";a["Doctype"]="doctype"})(E||(E={}));function va(a){return a.type===E.Tag||a.type===E.Script||a.type===E.Style}var Ut=E.Root;var Yt=E.Text;var Wt=E.Directive;var Pt=E.Comment;var Ot=E.Script;var _t=E.Style;var Ht=E.Tag;var Gt=E.CDATA;var Vt=E.Doctype;var Me=class{parent=null;prev=null;next=null;startIndex=null;endIndex=null;get parentNode(){return this.parent}set parentNode(e){this.parent=e}get previousSibling(){return this.prev}set previousSibling(e){this.prev=e}get nextSibling(){return this.next}set nextSibling(e){this.next=e}cloneNode(e=false){return ka(this,e)}};var ge=class extends Me{data;constructor(e){super();this.data=e}get nodeValue(){return this.data}set nodeValue(e){this.data=e}};var oe=class extends ge{type=E.Text;get nodeType(){return 3}};var we=class extends ge{type=E.Comment;get nodeType(){return 8}};var xe=class extends ge{type=E.Directive;name;constructor(e,t){super(t);this.name=e}get nodeType(){return 1}"x-name";"x-publicId";"x-systemId"};var me=class extends Me{children;constructor(e){super();this.children=e}get firstChild(){return this.children[0]??null}get lastChild(){return this.children.length>0?this.children[this.children.length-1]:null}get childNodes(){return this.children}set childNodes(e){this.children=e}};var ye=class extends me{type=E.CDATA;get nodeType(){return 4}};var ne=class extends me{type=E.Root;get nodeType(){return 9}};var ve=class extends me{name;attribs;type;constructor(e,t,s=[],r=e==="script"?E.Script:e==="style"?E.Style:E.Tag){super(s);this.name=e;this.attribs=t;this.type=r}get nodeType(){return 1}get tagName(){return this.name}set tagName(e){this.name=e}get attributes(){return Object.keys(this.attribs).map(e=>({name:e,value:this.attribs[e],namespace:this["x-attribsNamespace"]?.[e],prefix:this["x-attribsPrefix"]?.[e]}))}namespace;"x-attribsNamespace";"x-attribsPrefix"};function rt(a){return va(a)}function it(a){return a.type===E.CDATA}function ot(a){return a.type===E.Text}function nt(a){return a.type===E.Comment}function dt(a){return a.type===E.Directive}function lt(a){return a.type===E.Root}function ka(a,e=false){let t;if(ot(a)){t=new oe(a.data)}else if(nt(a)){t=new we(a.data)}else if(rt(a)){const s=e?He(a.children):[];const r=new ve(a.name,{...a.attribs},s);for(const i of s){i.parent=r}if(a.namespace!=null){r.namespace=a.namespace}if(a["x-attribsNamespace"]){r["x-attribsNamespace"]={...a["x-attribsNamespace"]}}if(a["x-attribsPrefix"]){r["x-attribsPrefix"]={...a["x-attribsPrefix"]}}t=r}else if(it(a)){const s=e?He(a.children):[];const r=new ye(s);for(const i of s){i.parent=r}t=r}else if(lt(a)){const s=e?He(a.children):[];const r=new ne(s);for(const i of s){i.parent=r}if(a["x-mode"]){r["x-mode"]=a["x-mode"]}t=r}else if(dt(a)){const s=new xe(a.name,a.data);if(a["x-name"]!=null){s["x-name"]=a["x-name"];s["x-publicId"]=a["x-publicId"];s["x-systemId"]=a["x-systemId"]}t=s}else{throw new Error(`Not implemented yet: ${a.type}`)}t.startIndex=a.startIndex;t.endIndex=a.endIndex;if(a.sourceCodeLocation!=null){t.sourceCodeLocation=a.sourceCodeLocation}return t}function He(a){const e=a.map(t=>ka(t,true));for(let t=1;t<e.length;t++){e[t].prev=e[t-1];e[t-1].next=e[t]}return e}var Sa={withStartIndices:false,withEndIndices:false,xmlMode:false};var qe=class{dom=[];root=new ne(this.dom);callback;options;elementCB;done=false;tagStack=[this.root];lastNode=null;parser=null;constructor(e,t,s){if(typeof t==="function"){s=t;t=Sa}if(typeof e==="object"){t=e;e=void 0}this.callback=e??null;this.options=t??Sa;this.elementCB=s??null}onparserinit(e){this.parser=e}onreset(){this.dom=[];this.root=new ne(this.dom);this.done=false;this.tagStack=[this.root];this.lastNode=null;this.parser=null}onend(){if(this.done)return;this.done=true;this.parser=null;this.handleCallback(null)}onerror(e){this.handleCallback(e)}onclosetag(){this.lastNode=null;const e=this.tagStack.pop();if(this.options.withEndIndices&&this.parser){e.endIndex=this.parser.endIndex}if(this.elementCB)this.elementCB(e)}onopentag(e,t){const s=this.options.xmlMode?E.Tag:void 0;const r=new ve(e,t,void 0,s);this.addNode(r);this.tagStack.push(r)}ontext(e){const{lastNode:t}=this;if(t&&t.type===E.Text){t.data+=e;if(this.options.withEndIndices&&this.parser){t.endIndex=this.parser.endIndex}}else{const s=new oe(e);this.addNode(s);this.lastNode=s}}oncomment(e){if(this.lastNode&&this.lastNode.type===E.Comment){this.lastNode.data+=e;return}const t=new we(e);this.addNode(t);this.lastNode=t}oncommentend(){this.lastNode=null}oncdatastart(){const e=new oe("");const t=new ye([e]);this.addNode(t);e.parent=t;this.lastNode=e}oncdataend(){this.lastNode=null}onprocessinginstruction(e,t){const s=new xe(e,t);this.addNode(s)}handleCallback(e){if(typeof this.callback==="function"){this.callback(e,this.dom)}else if(e){throw e}}addNode(e){const t=this.tagStack[this.tagStack.length-1];const s=t.children[t.children.length-1];if(this.options.withStartIndices&&this.parser){e.startIndex=this.parser.startIndex}if(this.options.withEndIndices&&this.parser){e.endIndex=this.parser.endIndex}t.children.push(e);if(s){e.prev=s;s.next=e}e.parent=t;this.lastNode=null}};function Ra(a,e){const t=new qe(void 0,e);new De(t,e).end(a);return t.root}var ht=new Set("color background-color font-family font-size font-weight font-style text-decoration text-align line-height width max-width height padding padding-top padding-right padding-bottom padding-left margin margin-top margin-right margin-bottom margin-left border border-top border-right border-bottom border-left border-collapse vertical-align white-space".split(" "));function Ca(a){const e={};if(typeof a!=="string"||a.length>4096)return e;for(const t of a.split(";")){const s=t.indexOf(":"),r=t.slice(0,s).trim().toLowerCase(),i=t.slice(s+1).trim();if(s<1||!ht.has(r)||!i||i.length>120||!/^[a-z0-9#.,%() +/"-]+$/i.test(i)||/url|expression|behavior|javascript|var\s*\(|!important/i.test(i))continue;if(/^(?:width|max-width|height|padding|margin|font-size)/.test(r)&&[...i.matchAll(/\d+(?:\.\d+)?/g)].some(n=>Number(n[0])>2e3))continue;if(/font-size|padding|margin/.test(r)&&[...i.matchAll(/\d+(?:\.\d+)?/g)].some(n=>Number(n[0])>64))continue;e[r.replace(/-([a-z])/g,(n,c)=>c.toUpperCase())]=i}return e}var ct=new Set("p div span br hr strong b em i u s del blockquote pre code ul ol li h1 h2 h3 h4 h5 h6 table thead tbody tfoot tr td th a".split(" "));var pt=new Set("script style head title iframe frame frameset object embed svg math form input button textarea select option template noscript audio video source link meta base".split(" "));var Aa=a=>a?.trim().replace(/^<|>$/g,"")??"";function ut(a){try{const e=new URL(a);if(!["https:","http:","mailto:"].includes(e.protocol)||e.username||e.password||/[\u0000-\u001f\u007f]/.test(a))return;return e.href.slice(0,4096)}catch{return}}function Ta(a,e=[],t=false){if(typeof a!=="string"||!a.trim())return;if(emailUtf8Length(a,"utf8")>256*1024)return{nodes:[],images:[],limited:true};const s={nodes:[],images:[],limited:false};let r=0,i=0;function n(c,w){const d=[];if(w>32){s.limited=true;return d}for(const u of c){if(++r>5e3||i>=1e5){s.limited=true;break}if(u.type==="text"){const h=String(u.data).slice(0,1e5-i);i+=h.length;d.push(h);continue}const y=String(u.name||"").toLowerCase();if(pt.has(y)||u.type==="comment")continue;if(y==="img"){const h=String(u.attribs?.src||"").trim(),v=String(u.attribs?.alt||"").slice(0,300);if(s.images.length>=40){s.limited=true;continue}let R;if(/^cid:/i.test(h)){let l=h.slice(4);try{l=decodeURIComponent(l)}catch{}const f=Aa(l);const g=f?e.findIndex(m=>Aa(m.contentId)===f):-1;if(g>=0)R={kind:"inline",alt:v,source:"",attachment:g}}else if(/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=\r\n]+$/i.test(h))R={kind:"inline",alt:v,source:h};else{try{const l=new URL(h);if(l.protocol==="https:"&&!l.username&&!l.password&&(!l.port||l.port==="443")&&h.length<=4096)R={kind:"remote",alt:v,source:l.href}}catch{}}if(R){d.push({tag:"img",image:s.images.length});s.images.push(R)}else d.push(v?"["+v+"]":"[\u56FE\u7247\u4E0D\u53EF\u7528 / Image unavailable]");continue}const S=n(u.children||[],w+1);if(!ct.has(y)){d.push(...S);continue}const x={tag:y,children:S};if(t)x.style=Ca(u.attribs?.style);if(y==="a"){const h=ut(String(u.attribs?.href||""));if(h)x.href=h}if(y==="td"||y==="th"){const h=Number(u.attribs?.colspan);if(Number.isInteger(h)&&h>1&&h<=20)x.span=h}d.push(x)}return d}try{s.nodes=n(Ra(a).children,0);return s}catch{return{nodes:[],images:[],limited:true}}}return Ba(bt);})();

const EMAIL_CSS = ":where([data-dsh-style]),:where([data-dsh-portal-synced]),:where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]){--dsh-ease-out: cubic-bezier(0.22, 1, 0.36, 1);--dsh-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);--dsh-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);--dsh-motion-fast: 140ms;--dsh-motion-base: 200ms;--dsh-motion-dialog: 220ms;--dsh-control-border-width: 0.5px;--dsh-button-shadow: none;--dsh-button-hover-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);--dsh-card-shadow: none;--dsh-card-hover-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);--dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", Consolas, monospace;--dsh-display-weight: 700;--dsh-display-tracking: 0.015em;--dsh-body-tracking: normal;--dsh-serif-font: \"Palatino Linotype\", Georgia, \"Noto Serif SC\", \"STZhongsong\", \"\\534e\\6587\\4e2d\\5b8b\", \"STSong\", \"\\534e\\6587\\5b8b\\4f53\", serif;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}@supports (transition-timing-function: linear(0,1)){:where([data-dsh-style]),:where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]){--dsh-ease-spring: linear( 0, 0.402 7.4%, 0.711 15.3%, 0.929 23.7%, 1.008 28.2%, 1.067 33%, 1.099 36.9%, 1.12 41%, 1.13 45.4%, 1.13 50.1%, 1.111 58.5%, 1.019 83.2%, 1.004 91.3%, 1 )}}[data-window-drag-exclude]{-webkit-app-region:no-drag}[data-dsh-style=harness],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=harness],:has([data-dsh-style=harness])){--dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", Consolas, monospace;--dsh-display-weight: 700;--dsh-display-tracking: 0.015em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}:where(body:not([data-ds-dark-theme])) [data-dsh-style=harness],:where(body:not([data-ds-dark-theme])) :where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style=harness]){color-scheme:light;accent-color:var(--dsw-alias-state-business-primary, #4176e6)}:root:not([data-dsh-host-tokens]) [data-dsh-style=harness]{--dsw-radius-xs: 6px;--dsw-radius-sm: 8px;--dsw-radius-md: 12px;--dsw-radius-lg: 16px;--dsw-radius-xl: 20px}body:not([data-ds-dark-theme]) [data-dsh-style=harness]{--dsh-surface-spotlight: rgba(65, 118, 230, 0.06)}body[data-ds-dark-theme] [data-dsh-style=harness],body[data-ds-dark-theme] :where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=harness],:has([data-dsh-style=harness])){color-scheme:dark;accent-color:#7aaaff;--dsw-alias-bg-base: #1f232b;--dsw-alias-bg-layer-1: #272c36;--dsw-alias-bg-layer-2: #2f3542;--dsw-alias-bg-layer-3: #373e4d;--dsw-alias-bg-overlay: #2a303c;--dsw-alias-bg-module-platform: #2c323e;--dsw-alias-settings-card-fill: #262b35;--dsw-alias-settings-card-stroke: rgba(226, 232, 240, 0.12);--dsw-specific-menu: rgba(39, 44, 54, 0.96);--dsw-alias-border-l1: rgba(226, 232, 240, 0.09);--dsw-alias-border-l2: rgba(226, 232, 240, 0.15);--dsw-alias-border-l3: rgba(226, 232, 240, 0.22);--dsw-alias-border-l4: rgba(226, 232, 240, 0.28);--dsw-alias-label-primary: #eef2f7;--dsw-alias-label-secondary: #b6c0cf;--dsw-alias-label-tertiary: #8d98ab;--dsw-alias-label-dimmed: #737e91;--dsw-alias-brand-primary: #7aaaff;--dsw-alias-brand-text: #eef2f7;--dsw-alias-state-business-primary: #7aaaff;--dsw-alias-state-business-tertiary: rgba(122, 170, 255, 0.16);--dsw-alias-link: #8bb6ff;--dsw-alias-button-primary-fill: #5b8def;--dsw-alias-button-primary-hover: #6f9cf4;--dsw-alias-button-primary-ink: #ffffff;--dsw-alias-interactive-bg-hover: rgba(226, 232, 240, 0.07);--dsw-alias-interactive-bg-active: rgba(226, 232, 240, 0.13);--dsw-alias-interactive-bg-hover-accent: rgba(122, 170, 255, 0.15);--dsw-alias-interactive-bg-hover-danger: rgba(248, 113, 113, 0.16);--dsw-alias-state-error-primary: #f87171;--dsw-alias-state-warn-primary: #fbbf24;--dsw-alias-state-warn-label: #fcd34d;--dsw-alias-state-warn-tertiary: rgba(251, 191, 36, 0.15);--dsw-alias-state-success-primary: #4ade80;--dsw-elevation-panel: 0 4px 16px rgba(10, 14, 22, 0.28), 0 0 0 1px rgba(226, 232, 240, 0.12);--dsw-elevation-prominent: 0 14px 38px rgba(10, 14, 22, 0.42), 0 0 0 1px rgba(226, 232, 240, 0.16);--dsh-button-hover-shadow: 0 2px 8px rgba(10, 14, 22, 0.25);--dsh-card-hover-shadow: 0 8px 22px rgba(10, 14, 22, 0.32);--dsh-surface-spotlight: rgba(122, 170, 255, 0.10)}[data-dsh-style=cream],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=cream],:has([data-dsh-style=cream])){color-scheme:light;accent-color:#9e5829;--dsw-alias-bg-base: #faf7f0;--dsw-alias-bg-layer-1: #f3efe4;--dsw-alias-bg-layer-2: #eae3d3;--dsw-alias-bg-layer-3: #e0d7c3;--dsw-alias-bg-overlay: #fcfaf4;--dsw-alias-bg-module-platform: #efe9da;--dsw-alias-settings-card-fill: #fdfbf6;--dsw-alias-settings-card-stroke: #d4c8ae;--dsw-specific-menu: rgba(252, 250, 244, 0.97);--dsw-alias-border-l1: #e6dec8;--dsw-alias-border-l2: #d4c8ae;--dsw-alias-border-l3: #c0b193;--dsw-alias-border-l4: #ad9c7c;--dsw-alias-label-primary: #2b2620;--dsw-alias-label-secondary: #655b4e;--dsw-alias-label-tertiary: #857968;--dsw-alias-label-dimmed: #9c907f;--dsw-alias-brand-primary: #9e5829;--dsw-alias-brand-text: #2b2620;--dsw-alias-state-business-primary: #a65e2e;--dsw-alias-state-business-tertiary: rgba(166, 94, 46, 0.13);--dsw-alias-link: #934e20;--dsw-alias-button-primary-fill: #9e5829;--dsw-alias-button-primary-hover: #86481e;--dsw-alias-button-primary-ink: #fffdf9;--dsw-alias-interactive-bg-hover: rgba(108, 84, 50, 0.075);--dsw-alias-interactive-bg-active: rgba(166, 94, 46, 0.14);--dsw-alias-interactive-bg-hover-accent: rgba(166, 94, 46, 0.12);--dsw-alias-interactive-bg-hover-danger: rgba(185, 56, 44, 0.11);--dsw-alias-state-error-primary: #b9382c;--dsw-alias-state-warn-primary: #b45309;--dsw-alias-state-warn-label: #8c3d08;--dsw-alias-state-warn-tertiary: #fdefd6;--dsw-alias-state-success-primary: #2a6f4e;--dsw-radius-xs: 6px;--dsw-radius-sm: 9px;--dsw-radius-md: 13px;--dsw-radius-lg: 16px;--dsw-radius-xl: 20px;--dsw-elevation-panel: 0 1px 2px rgba(68, 52, 32, 0.06), 3px 3px 0 #ebe3d1, 0 0 0 1px rgba(180, 164, 138, 0.42);--dsw-elevation-prominent: 0 14px 34px rgba(68, 52, 32, 0.14), 3px 3px 0 #ebe3d1, 0 0 0 1px rgba(180, 164, 138, 0.48);--dsh-control-border-width: 1px;--dsh-button-hover-shadow: 0 2px 6px rgba(84, 62, 34, 0.09);--dsh-card-shadow: 0 1px 2px rgba(68, 52, 32, 0.06), 3px 3px 0 #ebe3d1;--dsh-card-hover-shadow: 0 4px 10px rgba(68, 52, 32, 0.10), 4px 4px 0 #e2d7be;--dsh-surface-spotlight: rgba(166, 94, 46, 0.08);--dsh-font-display: \"Trebuchet MS\", \"STKaiti\", \"\\534e\\6587\\6977\\4f53\", \"Noto Serif SC SemiBold\", serif;--dsh-font-body: \"Source Sans 3\", \"Noto Sans SC\", \"Microsoft YaHei UI\", sans-serif;--dsh-font-mono: \"Cascadia Mono\", Consolas, monospace;--dsh-display-weight: 700;--dsh-display-tracking: normal;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=cream] :where([data-dsh-card],.dsh-card){border-color:var(--dsw-alias-border-l2);box-shadow:var(--dsh-card-shadow)}[data-dsh-style=cream] :where([data-dsh-row],.dsh-row){border-block-end:1px dashed var(--dsw-alias-border-l2)}[data-dsh-style=cream] [role=tab][aria-selected=true]{background:rgba(158,88,41,0.10);color:#7d4119;box-shadow:inset 0 2px 0 rgba(158,88,41,0.22)}[data-dsh-style=cream] [role=tab][aria-selected=true]::after{border-block-end-color:#9e5829;border-block-end-width:2.5px}[data-dsh-style=claude],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=claude],:has([data-dsh-style=claude])){color-scheme:light;accent-color:#c96442;--dsw-alias-bg-base: #f5f4ed;--dsw-alias-bg-layer-1: #ece9df;--dsw-alias-bg-layer-2: #e3dfd2;--dsw-alias-bg-layer-3: #d8d3c3;--dsw-alias-bg-overlay: #faf9f4;--dsw-alias-bg-module-platform: #e7e3d6;--dsw-alias-settings-card-fill: #faf9f4;--dsw-alias-settings-card-stroke: transparent;--dsw-specific-menu: rgba(250, 249, 244, 0.97);--dsw-alias-border-l1: #e4e0d3;--dsw-alias-border-l2: #d5d0c3;--dsw-alias-border-l3: #c1bbb0;--dsw-alias-border-l4: #aba495;--dsw-alias-label-primary: #1f1e1b;--dsw-alias-label-secondary: #5d5a51;--dsw-alias-label-tertiary: #7b776c;--dsw-alias-label-dimmed: #948f83;--dsw-alias-brand-primary: #c96442;--dsw-alias-brand-text: #1f1e1b;--dsw-alias-state-business-primary: #c96442;--dsw-alias-state-business-tertiary: rgba(201, 100, 66, 0.14);--dsw-alias-link: #b35030;--dsw-alias-button-primary-fill: #c96442;--dsw-alias-button-primary-hover: #b25232;--dsw-alias-button-primary-ink: #faf9f5;--dsw-alias-interactive-bg-hover: rgba(31, 30, 27, 0.055);--dsw-alias-interactive-bg-active: rgba(201, 100, 66, 0.14);--dsw-alias-interactive-bg-hover-accent: rgba(201, 100, 66, 0.11);--dsw-alias-interactive-bg-hover-danger: rgba(180, 48, 42, 0.11);--dsw-alias-state-error-primary: #b4302a;--dsw-alias-state-warn-primary: #b85d19;--dsw-alias-state-warn-label: #8c430c;--dsw-alias-state-warn-tertiary: #f7e8d6;--dsw-alias-state-success-primary: #2d6a4f;--dsw-radius-xs: 7px;--dsw-radius-sm: 10px;--dsw-radius-md: 14px;--dsw-radius-lg: 18px;--dsw-radius-xl: 22px;--dsw-elevation-panel: 0 2px 12px rgba(31, 30, 27, 0.05), 0 0 0 1px rgba(145, 139, 126, 0.18);--dsw-elevation-prominent: 0 16px 38px rgba(31, 30, 27, 0.13), 0 2px 8px rgba(31, 30, 27, 0.05), 0 0 0 1px rgba(145, 139, 126, 0.24);--dsh-control-border-width: 1px;--dsh-button-hover-shadow: 0 2px 7px rgba(31, 30, 27, 0.08);--dsh-card-shadow: 0 1px 3px rgba(31, 30, 27, 0.05), 0 0 0 1px rgba(145, 139, 126, 0.13);--dsh-card-hover-shadow: 0 8px 22px rgba(31, 30, 27, 0.08), 0 0 0 1px rgba(145, 139, 126, 0.20);--dsh-surface-spotlight: rgba(201, 100, 66, 0.08);--dsh-font-display: \"Palatino Linotype\", Georgia, \"Noto Serif SC SemiBold\", \"Noto Serif SC\", \"STZhongsong\", \"\\534e\\6587\\4e2d\\5b8b\", serif;--dsh-font-body: Georgia, \"Noto Serif SC\", \"STSong\", \"\\534e\\6587\\5b8b\\4f53\", serif;--dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, monospace;--dsh-display-weight: 700;--dsh-display-tracking: -0.01em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=claude]{background-color:var(--dsw-alias-bg-base);background-image:radial-gradient(rgba(31,30,27,0.024) 0.75px,transparent 0),linear-gradient(180deg,rgba(255,253,247,0.45),rgba(236,233,223,0.25));background-size:16px 16px,100% 100%}[data-dsh-style=claude] :where([data-dsh-card],.dsh-card){background:var(--dsw-alias-settings-card-fill);border-color:transparent;box-shadow:var(--dsh-card-shadow)}[data-dsh-style=claude] :where(header h1,[data-dsh-editorial-heading],[data-dsh-serif],[data-dsh-card] :is(h2,h3,.dsh-card-title),.dsh-card :is(h2,h3,.dsh-card-title),[data-dsh-reader] :is(h1,h2),.dsh-reader :is(h1,h2)),:where([role=dialog],dialog):where([data-dsh-style=claude],:has([data-dsh-style=claude])) header h2{font-family:var(--dsh-font-display);font-weight:var(--dsh-display-weight, 700);letter-spacing:var(--dsh-display-tracking, -0.01em)}[data-dsh-style=pixel8bit],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=pixel8bit],:has([data-dsh-style=pixel8bit])){color-scheme:light;accent-color:#2e7d5b;--dsw-alias-bg-base: #f4f6e8;--dsw-alias-bg-layer-1: #e7eed2;--dsw-alias-bg-layer-2: #dbe5c0;--dsw-alias-bg-layer-3: #cedaad;--dsw-alias-bg-overlay: #f9fbf0;--dsw-alias-bg-module-platform: #e2ebc9;--dsw-alias-settings-card-fill: #edf2dc;--dsw-alias-settings-card-stroke: #1e2826;--dsw-specific-menu: #f9fbf0;--dsw-alias-border-l1: #7e9478;--dsw-alias-border-l2: #1e2826;--dsw-alias-border-l3: #1e2826;--dsw-alias-border-l4: #1e2826;--dsw-alias-label-primary: #1e2826;--dsw-alias-label-secondary: #3d514c;--dsw-alias-label-tertiary: #58706a;--dsw-alias-label-dimmed: #6e857f;--dsw-alias-brand-primary: #2e7d5b;--dsw-alias-brand-text: #1e2826;--dsw-alias-state-business-primary: #2e7d5b;--dsw-alias-state-business-tertiary: rgba(46, 125, 91, 0.18);--dsw-alias-link: #226448;--dsw-alias-button-primary-fill: #2e7d5b;--dsw-alias-button-primary-hover: #24674a;--dsw-alias-button-primary-ink: #f4f6e8;--dsw-alias-interactive-bg-hover: #dfe9c4;--dsw-alias-interactive-bg-active: #cfe0ad;--dsw-alias-interactive-bg-hover-accent: rgba(46, 125, 91, 0.16);--dsw-alias-interactive-bg-hover-danger: rgba(217, 91, 67, 0.18);--dsw-alias-state-error-primary: #d95b43;--dsw-alias-state-warn-primary: #c47614;--dsw-alias-state-warn-label: #7a4808;--dsw-alias-state-warn-tertiary: #f6e7b4;--dsw-alias-state-success-primary: #2e7d5b;--dsh-pixel-accent-secondary: #d95b43;--dsw-radius-xs: 0px;--dsw-radius-sm: 0px;--dsw-radius-md: 0px;--dsw-radius-lg: 0px;--dsw-radius-xl: 0px;--dsw-corner-shape: square;--dsw-elevation-panel: 2px 2px 0px #1e2826;--dsw-elevation-prominent: 4px 4px 0px #1e2826;--dsh-control-border-width: 2px;--dsh-button-shadow: 2px 2px 0px #1e2826;--dsh-button-hover-shadow: 3px 3px 0px #1e2826;--dsh-card-shadow: 2px 2px 0px #1e2826;--dsh-card-hover-shadow: 4px 4px 0px #1e2826;--dsh-surface-spotlight: rgba(46, 125, 91, 0.12);--dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", Consolas, monospace;--dsh-display-weight: 700;--dsh-display-tracking: 0.03em;--dsh-body-tracking: 0.03em;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=pixel8bit] :where(.dsh-header,[data-dsh-header],.dsh-wb-header){background-color:var(--dsw-alias-bg-layer-1);background-image:radial-gradient(rgba(30,40,38,0.14) 1px,transparent 0);background-size:6px 6px;border-block-end:2px solid #1e2826}[data-dsh-style=pixel8bit] :where(button,input,select,textarea,[role=button],[role=tab],[role=menuitem],[role=menuitemradio],[data-dsh-card],.dsh-card,[data-dsh-panel],.dsh-panel),:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=pixel8bit],:has([data-dsh-style=pixel8bit])),:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=pixel8bit],:has([data-dsh-style=pixel8bit])) :where(button,input,select,textarea,[role=menuitem],[role=menuitemradio]){border-radius:0px!important;corner-shape:square}[data-dsh-style=pixel8bit] :where(button:not([role=tab]),.dsh-btn),:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style=pixel8bit],:has([data-dsh-style=pixel8bit])) :where(button:not([role=tab]),.dsh-btn){border:2px solid #1e2826;box-shadow:2px 2px 0px #1e2826}[data-dsh-style=pixel8bit] :where([data-dsh-card],.dsh-card,[data-dsh-panel],.dsh-panel){border:2px solid #1e2826;box-shadow:2px 2px 0px #1e2826}[data-dsh-style=pixel8bit] :where(input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea),:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style=pixel8bit],:has([data-dsh-style=pixel8bit])) :where(input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea){border-width:2px;border-color:#1e2826}:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=pixel8bit],:has([data-dsh-style=pixel8bit])){border:2px solid #1e2826!important;box-shadow:4px 4px 0px #1e2826!important;backdrop-filter:none}[data-dsh-style=pixel8bit] [role=tab][aria-selected=true]::after,[data-dsh-style=pixel8bit] .dsh-tab-indicator{border-block-end-color:#d95b43;border-block-end-width:3px}.dsh-pixel-cursor{display:none;flex:none;font-size:10px;line-height:1;color:var(--dsh-pixel-accent-secondary, #d95b43)}@keyframes dsh-pixel-cursor-nudge{0%,100%{translate:0px 0px}50%{translate:2px 0px}}[data-dsh-style=pixel8bit] :where([data-dsh-row],.dsh-row):where([data-active=true],[data-selected=true],[aria-selected=true]){background-color:var(--dsw-alias-interactive-bg-active);box-shadow:inset 3px 0 0 #d95b43}[data-dsh-style=pixel8bit] :where([data-dsh-row],.dsh-row):where([data-active=true],[data-selected=true],[aria-selected=true]):not(:has(.dsh-pixel-cursor))::before{content:\"\\25b6\";display:inline-block;flex:none;margin-inline-end:6px;font-size:10px;line-height:1;color:#d95b43}[data-dsh-style=pixel8bit] :where([data-active=true],[data-selected=true],[aria-selected=true]) .dsh-pixel-cursor{display:inline-flex;align-items:center}@media(prefers-reduced-motion:no-preference){[data-dsh-style=pixel8bit] :where([data-dsh-row],.dsh-row):where([data-active=true],[data-selected=true],[aria-selected=true]):not(:has(.dsh-pixel-cursor))::before,[data-dsh-style=pixel8bit] :where([data-active=true],[data-selected=true],[aria-selected=true]) .dsh-pixel-cursor{animation:dsh-pixel-cursor-nudge 760ms steps(2,end) infinite}}[data-dsh-style=mint],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=mint],:has([data-dsh-style=mint])){color-scheme:light;accent-color:#0f766e;--dsw-alias-bg-base: #f5fafb;--dsw-alias-bg-layer-1: #eaf3f6;--dsw-alias-bg-layer-2: #dcebf0;--dsw-alias-bg-layer-3: #cce1e8;--dsw-alias-bg-overlay: #fafdff;--dsw-alias-bg-module-platform: #e3eff3;--dsw-alias-settings-card-fill: #eef6f8;--dsw-alias-settings-card-stroke: #c7dde5;--dsw-specific-menu: rgba(250, 253, 255, 0.97);--dsw-alias-border-l1: #d5e6ec;--dsw-alias-border-l2: #bdd5de;--dsw-alias-border-l3: #9ec0cd;--dsw-alias-border-l4: #7faab9;--dsw-alias-label-primary: #132a2e;--dsw-alias-label-secondary: #426067;--dsw-alias-label-tertiary: #628088;--dsw-alias-label-dimmed: #7c98a0;--dsw-alias-brand-primary: #0f766e;--dsw-alias-brand-text: #132a2e;--dsw-alias-state-business-primary: #0f766e;--dsw-alias-state-business-tertiary: rgba(15, 118, 110, 0.13);--dsw-alias-link: #0284c7;--dsw-alias-button-primary-fill: #0f766e;--dsw-alias-button-primary-hover: #0d635c;--dsw-alias-button-primary-ink: #f5fafb;--dsw-alias-interactive-bg-hover: rgba(15, 118, 110, 0.07);--dsw-alias-interactive-bg-active: rgba(15, 118, 110, 0.13);--dsw-alias-interactive-bg-hover-accent: rgba(2, 132, 199, 0.11);--dsw-alias-interactive-bg-hover-danger: rgba(200, 50, 64, 0.11);--dsw-alias-state-error-primary: #c83240;--dsw-alias-state-warn-primary: #b4690e;--dsw-alias-state-warn-label: #864c07;--dsw-alias-state-warn-tertiary: #fdf1d6;--dsw-alias-state-success-primary: #0f766e;--dsh-mint-sky-accent: #0284c7;--dsw-radius-xs: 6px;--dsw-radius-sm: 9px;--dsw-radius-md: 12px;--dsw-radius-lg: 16px;--dsw-radius-xl: 20px;--dsw-elevation-panel: 0 3px 12px rgba(15, 76, 92, 0.07), 0 0 0 1px rgba(127, 170, 185, 0.28);--dsw-elevation-prominent: 0 14px 34px rgba(15, 76, 92, 0.13), 0 2px 6px rgba(15, 76, 92, 0.05), 0 0 0 1px rgba(127, 170, 185, 0.34);--dsh-control-border-width: 1px;--dsh-button-hover-shadow: 0 2px 7px rgba(15, 118, 110, 0.11);--dsh-card-hover-shadow: 0 8px 22px rgba(2, 132, 199, 0.10);--dsh-surface-spotlight: rgba(2, 132, 199, 0.08);--dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", Consolas, monospace;--dsh-display-weight: 700;--dsh-display-tracking: 0.015em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=glass],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=glass],:has([data-dsh-style=glass])){color-scheme:light;accent-color:#4f6df5;--dsw-alias-bg-base: #f3f7ff;--dsw-alias-bg-layer-1: rgba(255, 255, 255, 0.70);--dsw-alias-bg-layer-2: rgba(240, 245, 255, 0.78);--dsw-alias-bg-layer-3: rgba(226, 236, 255, 0.84);--dsw-alias-bg-overlay: rgba(255, 255, 255, 0.84);--dsw-alias-bg-module-platform: rgba(244, 248, 255, 0.76);--dsw-alias-settings-card-fill: rgba(255, 255, 255, 0.70);--dsw-alias-settings-card-stroke: rgba(255, 255, 255, 0.82);--dsw-specific-menu: rgba(255, 255, 255, 0.86);--dsw-alias-border-l1: rgba(148, 173, 219, 0.24);--dsw-alias-border-l2: rgba(132, 159, 212, 0.34);--dsw-alias-border-l3: rgba(114, 144, 204, 0.46);--dsw-alias-border-l4: rgba(96, 128, 196, 0.56);--dsw-alias-label-primary: #172033;--dsw-alias-label-secondary: #4b5973;--dsw-alias-label-tertiary: #6b7994;--dsw-alias-label-dimmed: #8895ae;--dsw-alias-brand-primary: #4f6df5;--dsw-alias-brand-text: #172033;--dsw-alias-state-business-primary: #4f6df5;--dsw-alias-state-business-tertiary: rgba(79, 109, 245, 0.14);--dsw-alias-link: #3b59e2;--dsw-alias-button-primary-fill: #4f6df5;--dsw-alias-button-primary-hover: #3f5de3;--dsw-alias-button-primary-ink: #ffffff;--dsw-alias-interactive-bg-hover: rgba(79, 109, 245, 0.08);--dsw-alias-interactive-bg-active: rgba(79, 109, 245, 0.14);--dsw-alias-interactive-bg-hover-accent: rgba(14, 165, 233, 0.12);--dsw-alias-interactive-bg-hover-danger: rgba(220, 56, 82, 0.12);--dsw-alias-state-error-primary: #d13850;--dsw-alias-state-warn-primary: #c06a12;--dsw-alias-state-warn-label: #8a4a09;--dsw-alias-state-warn-tertiary: rgba(251, 191, 36, 0.18);--dsw-alias-state-success-primary: #15805d;--dsw-radius-xs: 8px;--dsw-radius-sm: 11px;--dsw-radius-md: 15px;--dsw-radius-lg: 18px;--dsw-radius-xl: 22px;--dsw-elevation-panel: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 18px rgba(59, 92, 168, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.72);--dsw-elevation-prominent: inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 16px 40px rgba(59, 92, 168, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.80);--dsh-control-border-width: 1px;--dsh-button-hover-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92), 0 3px 10px rgba(79, 109, 245, 0.12);--dsh-card-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 16px rgba(59, 92, 168, 0.07);--dsh-card-hover-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.96), 0 10px 26px rgba(59, 92, 168, 0.12);--dsh-surface-spotlight: rgba(79, 109, 245, 0.08);--dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", Consolas, monospace;--dsh-display-weight: 700;--dsh-display-tracking: 0.015em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=glass]{background-color:#f3f7ff;background-image:radial-gradient(64% 58% at 12% 8%,rgba(125,211,252,0.30) 0%,transparent 65%),radial-gradient(58% 52% at 88% 14%,rgba(196,181,253,0.28) 0%,transparent 65%),radial-gradient(60% 55% at 52% 96%,rgba(153,246,228,0.24) 0%,transparent 68%)}[data-dsh-style=glass] :where([data-dsh-card],.dsh-card,[data-dsh-panel],.dsh-panel,.dsh-header,[data-dsh-header]),:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=glass],:has([data-dsh-style=glass])){background:rgba(255,255,255,0.70);-webkit-backdrop-filter:blur(14px) saturate(140%);backdrop-filter:blur(14px) saturate(140%);box-shadow:inset 0 1px 0 rgba(255,255,255,0.9),0 4px 16px rgba(59,92,168,0.07)}@supports not (backdrop-filter: blur(1px)){[data-dsh-style=glass] :where([data-dsh-card],.dsh-card,[data-dsh-panel],.dsh-panel,.dsh-header,[data-dsh-header]),:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=glass],:has([data-dsh-style=glass])){background:rgba(255,255,255,0.92)}}[data-dsh-style=eink],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=eink],:has([data-dsh-style=eink])){color-scheme:light;accent-color:#171716;--dsw-alias-bg-base: #f2f1ec;--dsw-alias-bg-layer-1: #eae8e1;--dsw-alias-bg-layer-2: #e1dfd6;--dsw-alias-bg-layer-3: #d6d3c9;--dsw-alias-bg-overlay: #f7f6f2;--dsw-alias-bg-module-platform: #eae8e1;--dsw-alias-settings-card-fill: #f7f6f2;--dsw-alias-settings-card-stroke: #9e9c93;--dsw-specific-menu: #f7f6f2;--dsw-alias-border-l1: #c5c2b8;--dsw-alias-border-l2: #9e9c93;--dsw-alias-border-l3: #78766e;--dsw-alias-border-l4: #54534d;--dsw-alias-label-primary: #171716;--dsw-alias-label-secondary: #484742;--dsw-alias-label-tertiary: #66645d;--dsw-alias-label-dimmed: #807e76;--dsw-alias-brand-primary: #171716;--dsw-alias-brand-text: #171716;--dsw-alias-state-business-primary: #171716;--dsw-alias-state-business-tertiary: rgba(23, 23, 22, 0.10);--dsw-alias-link: #171716;--dsw-alias-button-primary-fill: #171716;--dsw-alias-button-primary-hover: #2f2f2c;--dsw-alias-button-primary-ink: #f7f6f2;--dsw-alias-interactive-bg-hover: rgba(23, 23, 22, 0.06);--dsw-alias-interactive-bg-active: rgba(23, 23, 22, 0.12);--dsw-alias-interactive-bg-hover-accent: rgba(23, 23, 22, 0.08);--dsw-alias-interactive-bg-hover-danger: rgba(23, 23, 22, 0.10);--dsw-alias-state-error-primary: #2d2c28;--dsw-alias-state-warn-primary: #45443e;--dsw-alias-state-warn-label: #171716;--dsw-alias-state-warn-tertiary: #e6e4db;--dsw-alias-state-success-primary: #242422;--dsw-radius-xs: 2px;--dsw-radius-sm: 3px;--dsw-radius-md: 4px;--dsw-radius-lg: 4px;--dsw-radius-xl: 4px;--dsw-elevation-panel: 0 0 0 1px #9e9c93;--dsw-elevation-prominent: 0 2px 0 #9e9c93, 0 0 0 1px #78766e;--dsh-control-border-width: 1px;--dsh-motion-fast: 60ms;--dsh-motion-base: 60ms;--dsh-motion-dialog: 60ms;--dsh-button-shadow: none;--dsh-button-hover-shadow: none;--dsh-card-shadow: none;--dsh-card-hover-shadow: none;--dsh-surface-spotlight: rgba(23, 23, 22, 0.06);--dsh-font-display: \"Palatino Linotype\", Georgia, \"Noto Serif SC SemiBold\", \"Noto Serif SC\", \"STZhongsong\", \"\\534e\\6587\\4e2d\\5b8b\", serif;--dsh-font-body: Georgia, \"Noto Serif SC\", \"STSong\", \"\\534e\\6587\\5b8b\\4f53\", serif;--dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, monospace;--dsh-display-weight: 700;--dsh-display-tracking: normal;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=eink] :where([data-dsh-card],.dsh-card,[data-dsh-panel],.dsh-panel){border:1px solid #9e9c93;box-shadow:none}[data-dsh-style=eink] :where([data-dsh-row],.dsh-row){border-block-end:1px solid #c5c2b8}[data-dsh-style=eink] :where(button,[role=button],[data-dsh-card],.dsh-card,[data-dsh-row],.dsh-row){translate:none!important;scale:none!important;transition-duration:60ms}[data-dsh-style=blueprint],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=blueprint],:has([data-dsh-style=blueprint])){color-scheme:light;accent-color:#e05a2b;--dsw-alias-bg-base: #eaf3fb;--dsw-alias-bg-layer-1: #f4f9fe;--dsw-alias-bg-layer-2: #dfeef9;--dsw-alias-bg-layer-3: #cfe3f4;--dsw-alias-bg-overlay: #f7fbff;--dsw-alias-bg-module-platform: #e3f0fa;--dsw-alias-settings-card-fill: rgba(244, 249, 254, 0.92);--dsw-alias-settings-card-stroke: #1b5e8a;--dsw-specific-menu: rgba(247, 251, 255, 0.98);--dsw-alias-border-l1: rgba(27, 94, 138, 0.28);--dsw-alias-border-l2: #1b5e8a;--dsw-alias-border-l3: #0d3b66;--dsw-alias-border-l4: #092b4c;--dsw-alias-label-primary: #0d3b66;--dsw-alias-label-secondary: #1d4e78;--dsw-alias-label-tertiary: #3b6f99;--dsw-alias-label-dimmed: #5b89ad;--dsw-alias-brand-primary: #e05a2b;--dsw-alias-brand-text: #0d3b66;--dsw-alias-state-business-primary: #e05a2b;--dsw-alias-state-business-tertiary: rgba(224, 90, 43, 0.14);--dsw-alias-link: #0d3b66;--dsw-alias-button-primary-fill: #e05a2b;--dsw-alias-button-primary-hover: #c94b20;--dsw-alias-button-primary-ink: #ffffff;--dsw-alias-interactive-bg-hover: rgba(27, 94, 138, 0.08);--dsw-alias-interactive-bg-active: rgba(224, 90, 43, 0.13);--dsw-alias-interactive-bg-hover-accent: rgba(224, 90, 43, 0.12);--dsw-alias-interactive-bg-hover-danger: rgba(185, 45, 38, 0.12);--dsw-alias-state-error-primary: #b92d26;--dsw-alias-state-warn-primary: #c05614;--dsw-alias-state-warn-label: #7c3408;--dsw-alias-state-warn-tertiary: #fce9d8;--dsw-alias-state-success-primary: #156d5b;--dsw-radius-xs: 2px;--dsw-radius-sm: 2px;--dsw-radius-md: 3px;--dsw-radius-lg: 4px;--dsw-radius-xl: 4px;--dsw-elevation-panel: 0 0 0 1px #1b5e8a;--dsw-elevation-prominent: 0 8px 24px rgba(13, 59, 102, 0.14), 0 0 0 1px #1b5e8a;--dsh-control-border-width: 1px;--dsh-button-shadow: none;--dsh-button-hover-shadow: 0 2px 0 #1b5e8a;--dsh-card-shadow: 0 0 0 1px #1b5e8a;--dsh-card-hover-shadow: 0 3px 0 #1b5e8a;--dsh-surface-spotlight: rgba(27, 94, 138, 0.09);--dsh-font-display: \"Cascadia Mono SemiBold\", \"Cascadia Mono\", \"STZhongsong\", \"\\534e\\6587\\4e2d\\5b8b\", \"FangSong\", \"\\4eff\\5b8b\", monospace;--dsh-font-body: \"Cascadia Mono\", \"STFangsong\", \"\\534e\\6587\\4eff\\5b8b\", \"FangSong\", \"\\4eff\\5b8b\", monospace;--dsh-font-mono: \"Cascadia Mono\", \"STFangsong\", \"\\534e\\6587\\4eff\\5b8b\", \"FangSong\", \"\\4eff\\5b8b\", monospace;--dsh-display-weight: 700;--dsh-display-tracking: 0.02em;--dsh-body-tracking: 0.02em;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=blueprint]{background-color:#eaf3fb;background-image:linear-gradient(to right,rgba(18,78,120,0.09) 1px,transparent 1px),linear-gradient(to bottom,rgba(18,78,120,0.09) 1px,transparent 1px),linear-gradient(to right,rgba(18,78,120,0.045) 1px,transparent 1px),linear-gradient(to bottom,rgba(18,78,120,0.045) 1px,transparent 1px);background-size:24px 24px,24px 24px,6px 6px,6px 6px}[data-dsh-style=blueprint] :where(.dsh-header,[data-dsh-header],.dsh-wb-header){background:rgba(244,249,254,0.90);border-block-end:1px solid #1b5e8a}[data-dsh-style=blueprint] :where([data-dsh-card],.dsh-card){position:relative;border:1px solid #1b5e8a;background:rgba(244,249,254,0.92)}[data-dsh-style=blueprint] :where([data-dsh-card],.dsh-card):not([role=tab])::after{content:\"+\";position:absolute;inset-block-start:4px;inset-inline-end:6px;font-family:ui-monospace,\"Cascadia Mono\",Menlo,Consolas,monospace;font-size:11px;line-height:1;color:#e05a2b;opacity:0.78;pointer-events:none}[data-dsh-style=blueprint] :where(button:not([role=tab]),.dsh-btn){border:1px solid #1b5e8a}[data-dsh-style=risograph],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=risograph],:has([data-dsh-style=risograph])){color-scheme:light;accent-color:#ff3e7f;--dsw-alias-bg-base: #faf6ee;--dsw-alias-bg-layer-1: #f5efe2;--dsw-alias-bg-layer-2: #ede4d1;--dsw-alias-bg-layer-3: #e3d7be;--dsw-alias-bg-overlay: #fffdf7;--dsw-alias-bg-module-platform: #f5efe2;--dsw-alias-settings-card-fill: #fffdf7;--dsw-alias-settings-card-stroke: #18181b;--dsw-specific-menu: #fffdf7;--dsw-alias-border-l1: #d4cbb8;--dsw-alias-border-l2: #18181b;--dsw-alias-border-l3: #18181b;--dsw-alias-border-l4: #18181b;--dsw-alias-label-primary: #18181b;--dsw-alias-label-secondary: #3f3f46;--dsw-alias-label-tertiary: #52525b;--dsw-alias-label-dimmed: #71717a;--dsw-alias-brand-primary: #ff3e7f;--dsw-alias-brand-text: #18181b;--dsw-alias-state-business-primary: #ff3e7f;--dsw-alias-state-business-tertiary: rgba(255, 62, 127, 0.14);--dsw-alias-link: #2563eb;--dsw-alias-button-primary-fill: #ff3e7f;--dsw-alias-button-primary-hover: #e62e6d;--dsw-alias-button-primary-ink: #ffffff;--dsw-alias-interactive-bg-hover: rgba(253, 224, 71, 0.38);--dsw-alias-interactive-bg-active: #fde047;--dsw-alias-interactive-bg-hover-accent: rgba(37, 99, 235, 0.14);--dsw-alias-interactive-bg-hover-danger: rgba(255, 62, 127, 0.18);--dsw-alias-state-error-primary: #dc2626;--dsw-alias-state-warn-primary: #ca8a04;--dsw-alias-state-warn-label: #713f12;--dsw-alias-state-warn-tertiary: #fef08a;--dsw-alias-state-success-primary: #15803d;--dsw-radius-xs: 3px;--dsw-radius-sm: 4px;--dsw-radius-md: 6px;--dsw-radius-lg: 8px;--dsw-radius-xl: 10px;--dsw-elevation-panel: 4px 4px 0px #2563eb;--dsw-elevation-prominent: 4px 4px 0px #ff3e7f;--dsh-control-border-width: 2px;--dsh-button-shadow: 3px 3px 0px #18181b;--dsh-button-hover-shadow: 4px 4px 0px #2563eb;--dsh-card-shadow: 4px 4px 0px #2563eb;--dsh-card-hover-shadow: 5px 5px 0px #ff3e7f;--dsh-surface-spotlight: rgba(253, 224, 71, 0.35);--dsh-font-display: Impact, \"Arial Black\", \"Noto Sans SC Black\", \"SimHei\", \"\\9ed1\\4f53\", sans-serif;--dsh-font-body: \"Source Sans 3\", \"Noto Sans SC Medium\", \"Noto Sans SC\", sans-serif;--dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, monospace;--dsh-display-weight: 900;--dsh-display-tracking: -0.02em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=risograph] :where(.dsh-header,[data-dsh-header],.dsh-wb-header){background-color:#fffdf7;background-image:radial-gradient(rgba(255,62,127,0.15) 1px,transparent 0);background-size:7px 7px;border-block-end:2px solid #18181b}[data-dsh-style=risograph] :where(button:not([role=tab]),.dsh-btn),:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style=risograph],:has([data-dsh-style=risograph])) :where(button:not([role=tab]),.dsh-btn){border:2px solid #18181b;box-shadow:3px 3px 0px #18181b}[data-dsh-style=risograph] :where([data-dsh-card],.dsh-card,[data-dsh-panel],.dsh-panel){border:2px solid #18181b;box-shadow:4px 4px 0px #2563eb}:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=risograph],:has([data-dsh-style=risograph])){border:2px solid #18181b!important;box-shadow:4px 4px 0px #ff3e7f!important}[data-dsh-style=risograph] [role=tab][aria-selected=true]{background:#fde047;color:#18181b;font-weight:700}[data-dsh-style=risograph] [role=tab][aria-selected=true]::after,[data-dsh-style=risograph] .dsh-tab-indicator{border-block-end-color:#ff3e7f;border-block-end-width:3px}[data-dsh-style=win98],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=win98],:has([data-dsh-style=win98])){color-scheme:light;accent-color:#1b4f9c;--dsw-alias-bg-base: #dcdcdc;--dsw-alias-bg-layer-1: #e4e4e4;--dsw-alias-bg-layer-2: #d0d0d0;--dsw-alias-bg-layer-3: #c0c0c0;--dsw-alias-bg-overlay: #e4e4e4;--dsw-alias-bg-module-platform: #d4d4d4;--dsw-alias-settings-card-fill: #ffffff;--dsw-alias-settings-card-stroke: #808080;--dsw-specific-menu: #dcdcdc;--dsw-alias-border-l1: #b8b8b8;--dsw-alias-border-l2: #808080;--dsw-alias-border-l3: #5a5a5a;--dsw-alias-border-l4: #222222;--dsw-alias-label-primary: #111111;--dsw-alias-label-secondary: #333333;--dsw-alias-label-tertiary: #555555;--dsw-alias-label-dimmed: #767676;--dsw-alias-brand-primary: #1b4f9c;--dsw-alias-brand-text: #111111;--dsw-alias-state-business-primary: #1b4f9c;--dsw-alias-state-business-tertiary: rgba(27, 79, 156, 0.14);--dsw-alias-link: #0b3c88;--dsw-alias-button-primary-fill: #1b4f9c;--dsw-alias-button-primary-hover: #245cb0;--dsw-alias-button-primary-ink: #ffffff;--dsw-alias-interactive-bg-hover: rgba(27, 79, 156, 0.09);--dsw-alias-interactive-bg-active: rgba(27, 79, 156, 0.16);--dsw-alias-interactive-bg-hover-accent: rgba(59, 130, 196, 0.15);--dsw-alias-interactive-bg-hover-danger: rgba(185, 28, 28, 0.13);--dsw-alias-state-error-primary: #b91c1c;--dsw-alias-state-warn-primary: #9a5b08;--dsw-alias-state-warn-label: #6e3f04;--dsw-alias-state-warn-tertiary: #fef3c7;--dsw-alias-state-success-primary: #166534;--dsw-radius-xs: 0px;--dsw-radius-sm: 0px;--dsw-radius-md: 0px;--dsw-radius-lg: 0px;--dsw-radius-xl: 0px;--dsw-corner-shape: square;--dsw-elevation-panel: inset 1.5px 1.5px 0 #ffffff, inset -1.5px -1.5px 0 #5a5a5a, inset 2.5px 2.5px 0 #f4f4f4, inset -2.5px -2.5px 0 #9a9a9a;--dsw-elevation-prominent: inset 1.5px 1.5px 0 #ffffff, inset -1.5px -1.5px 0 #5a5a5a, inset 2.5px 2.5px 0 #f4f4f4, inset -2.5px -2.5px 0 #9a9a9a, 4px 4px 12px rgba(0, 0, 0, 0.18);--dsh-control-border-width: 1px;--dsh-button-shadow: inset 1.5px 1.5px 0 #ffffff, inset -1.5px -1.5px 0 #5a5a5a, inset 2.5px 2.5px 0 #f4f4f4, inset -2.5px -2.5px 0 #9a9a9a;--dsh-button-hover-shadow: inset 1.5px 1.5px 0 #ffffff, inset -1.5px -1.5px 0 #5a5a5a, inset 2.5px 2.5px 0 #f4f4f4, inset -2.5px -2.5px 0 #9a9a9a;--dsh-card-shadow: inset 1.5px 1.5px 0 #808080, inset -1.5px -1.5px 0 #ffffff, inset 2.5px 2.5px 0 #5a5a5a, inset -2.5px -2.5px 0 #dcdcdc;--dsh-card-hover-shadow: inset 1.5px 1.5px 0 #808080, inset -1.5px -1.5px 0 #ffffff, inset 2.5px 2.5px 0 #5a5a5a, inset -2.5px -2.5px 0 #dcdcdc;--dsh-surface-spotlight: rgba(27, 79, 156, 0.10);--dsh-font-display: Tahoma, \"SimSun\", \"NSimSun\", \"\\5b8b\\4f53\", \"\\65b0\\5b8b\\4f53\", sans-serif;--dsh-font-body: Tahoma, \"SimSun\", \"NSimSun\", \"\\5b8b\\4f53\", \"\\65b0\\5b8b\\4f53\", sans-serif;--dsh-font-mono: \"Fixedsys\", Consolas, \"Courier New\", \"SimSun\", \"\\5b8b\\4f53\", monospace;--dsh-display-weight: 700;--dsh-display-tracking: normal;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=win98] :where(button,input,select,textarea,[role=button],[role=tab],[role=menuitem],[role=menuitemradio],[data-dsh-card],.dsh-card,[data-dsh-panel],.dsh-panel),:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=win98],:has([data-dsh-style=win98])),:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=win98],:has([data-dsh-style=win98])) :where(button,input,select,textarea,[role=menuitem],[role=menuitemradio]){border-radius:0px!important;corner-shape:square}[data-dsh-style=win98] :where(button:not([role=tab]),.dsh-btn),:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style=win98],:has([data-dsh-style=win98])) :where(button:not([role=tab]),.dsh-btn){border:0;background-color:#dcdcdc;box-shadow:inset 1.5px 1.5px 0 #ffffff,inset -1.5px -1.5px 0 #5a5a5a,inset 2.5px 2.5px 0 #f4f4f4,inset -2.5px -2.5px 0 #9a9a9a}[data-dsh-style=win98] :where(.dsh-wb-btn-primary,.dsh-btn-primary){background-color:#1b4f9c;color:#ffffff;box-shadow:inset 1.5px 1.5px 0 #6ca0e8,inset -1.5px -1.5px 0 #0d2b57,inset 2.5px 2.5px 0 #4a82d1,inset -2.5px -2.5px 0 #143c78}[data-dsh-style=win98] :where(button,[role=button]):is(:active,[aria-pressed=true],[aria-expanded=true]):not(:disabled):not([aria-disabled=true]),[data-dsh-style=win98] [role=tab][aria-selected=true],:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style=win98],:has([data-dsh-style=win98])) :where(button,[role=button]):is(:active,[aria-pressed=true]):not(:disabled):not([aria-disabled=true]){translate:0px 0px!important;scale:1!important;background-color:#e4e4e4;box-shadow:inset 1.5px 1.5px 0 #5a5a5a,inset -1.5px -1.5px 0 #ffffff,inset 2.5px 2.5px 0 #9a9a9a,inset -2.5px -2.5px 0 #f4f4f4!important}[data-dsh-style=win98] :where([data-dsh-card],.dsh-card,input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea){border:0;background:#ffffff;box-shadow:inset 1.5px 1.5px 0 #808080,inset -1.5px -1.5px 0 #ffffff,inset 2.5px 2.5px 0 #5a5a5a,inset -2.5px -2.5px 0 #dcdcdc}[data-dsh-style=win98] :where(.dsh-header,[data-dsh-header],.pageHeader,.dsh-wb-header,.topbar){background:linear-gradient(180deg,#ececec 0%,#dcdcdc 100%)!important;color:#111111;border-block-start:3px solid #1b4f9c!important;border-block-end:2px solid #808080;box-shadow:inset 0 1px 0 #ffffff,inset 0 -1px 0 #808080}[data-dsh-style=win98] .dsh-header-badge{background:linear-gradient(90deg,#1b4f9c 0%,#3b82c4 100%);color:#ffffff}:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style=win98],:has([data-dsh-style=win98])) header{background:linear-gradient(90deg,#1b4f9c 0%,#3b82c4 100%);color:#ffffff}:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style=win98],:has([data-dsh-style=win98])) header h2{color:#ffffff}[data-dsh-style=songhui],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=songhui],:has([data-dsh-style=songhui])){color-scheme:light;accent-color:#b83b2a;--dsw-alias-bg-base: #f7f3e8;--dsw-alias-bg-layer-1: #f0ead9;--dsw-alias-bg-layer-2: #e7dec8;--dsw-alias-bg-layer-3: #dcd0b4;--dsw-alias-bg-overlay: #fbf9f2;--dsw-alias-bg-module-platform: #ede6d4;--dsw-alias-settings-card-fill: #fbf9f2;--dsw-alias-settings-card-stroke: #d4c4a2;--dsw-specific-menu: #fbf9f2;--dsw-alias-border-l1: #e4dac2;--dsw-alias-border-l2: #cfbda0;--dsw-alias-border-l3: #b8a382;--dsw-alias-border-l4: #9d8765;--dsw-alias-label-primary: #252019;--dsw-alias-label-secondary: #5c5142;--dsw-alias-label-tertiary: #7d705e;--dsw-alias-label-dimmed: #998c79;--dsw-alias-brand-primary: #b83b2a;--dsw-alias-brand-text: #252019;--dsw-alias-state-business-primary: #b83b2a;--dsw-alias-state-business-tertiary: rgba(184, 59, 42, 0.12);--dsw-alias-link: #9e2f20;--dsw-alias-button-primary-fill: #b83b2a;--dsw-alias-button-primary-hover: #9f3021;--dsw-alias-button-primary-ink: #fbf9f2;--dsw-alias-interactive-bg-hover: rgba(184, 59, 42, 0.065);--dsw-alias-interactive-bg-active: rgba(184, 59, 42, 0.13);--dsw-alias-interactive-bg-hover-accent: rgba(184, 59, 42, 0.11);--dsw-alias-interactive-bg-hover-danger: rgba(184, 59, 42, 0.15);--dsw-alias-state-error-primary: #a62b1c;--dsw-alias-state-warn-primary: #9c6216;--dsw-alias-state-warn-label: #704309;--dsw-alias-state-warn-tertiary: #f7ecd1;--dsw-alias-state-success-primary: #2e664b;--dsw-radius-xs: 2px;--dsw-radius-sm: 2px;--dsw-radius-md: 3px;--dsw-radius-lg: 4px;--dsw-radius-xl: 4px;--dsw-elevation-panel: 0 2px 10px rgba(66, 52, 32, 0.06), 0 0 0 1px #cfbda0;--dsw-elevation-prominent: 0 12px 30px rgba(66, 52, 32, 0.14), 0 0 0 1px #b8a382;--dsh-control-border-width: 1px;--dsh-button-hover-shadow: 0 2px 6px rgba(184, 59, 42, 0.12);--dsh-card-shadow: 0 1px 2px rgba(66, 52, 32, 0.05);--dsh-card-hover-shadow: 0 6px 16px rgba(66, 52, 32, 0.09);--dsh-surface-spotlight: rgba(184, 59, 42, 0.07);--dsh-font-display: \"STZhongsong\", \"\\534e\\6587\\4e2d\\5b8b\", \"Noto Serif SC Black\", \"SimSun\", \"\\5b8b\\4f53\", serif;--dsh-font-body: \"Palatino Linotype\", \"STKaiti\", \"\\534e\\6587\\6977\\4f53\", \"KaiTi\", \"\\6977\\4f53\", \"Noto Serif SC\", serif;--dsh-font-mono: \"Cascadia Mono\", Consolas, \"STFangsong\", \"\\534e\\6587\\4eff\\5b8b\", monospace;--dsh-display-weight: 700;--dsh-display-tracking: 0.04em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=songhui]{background-color:#f7f3e8;background-image:radial-gradient(rgba(196,152,64,0.18) 1px,transparent 0),radial-gradient(rgba(196,152,64,0.11) 0.75px,transparent 0);background-size:18px 18px,29px 29px;background-position:0 0,9px 7px}[data-dsh-style=songhui] :where(.pageHeader,.dsh-header,[data-dsh-header],.dsh-wb-header){background:rgba(251,249,242,0.90);border-block-end:3px double #b83b2a}[data-dsh-style=songhui] :where(.dsh-wb-btn-primary,.dsh-btn-primary,.dsh-header-badge){background:#b83b2a;color:#fbf9f2;border-color:#9e2f20;border-radius:2px;box-shadow:inset 0 0 0 1px rgba(251,249,242,0.28)}[data-dsh-style=frutiger],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=frutiger],:has([data-dsh-style=frutiger])){color-scheme:light;accent-color:#0284c7;--dsw-alias-bg-base: #eaf7ff;--dsw-alias-bg-layer-1: rgba(255, 255, 255, 0.78);--dsw-alias-bg-layer-2: rgba(232, 246, 255, 0.86);--dsw-alias-bg-layer-3: rgba(209, 236, 255, 0.90);--dsw-alias-bg-overlay: rgba(248, 253, 255, 0.93);--dsw-alias-bg-module-platform: rgba(232, 246, 255, 0.84);--dsw-alias-settings-card-fill: rgba(255, 255, 255, 0.82);--dsw-alias-settings-card-stroke: rgba(56, 189, 248, 0.44);--dsw-specific-menu: rgba(248, 253, 255, 0.95);--dsw-alias-border-l1: rgba(56, 189, 248, 0.26);--dsw-alias-border-l2: rgba(14, 165, 233, 0.36);--dsw-alias-border-l3: rgba(2, 132, 199, 0.48);--dsw-alias-border-l4: rgba(3, 105, 161, 0.58);--dsw-alias-label-primary: #0c2b45;--dsw-alias-label-secondary: #275373;--dsw-alias-label-tertiary: #487596;--dsw-alias-label-dimmed: #6c96b5;--dsw-alias-brand-primary: #0284c7;--dsw-alias-brand-text: #0c2b45;--dsw-alias-state-business-primary: #0284c7;--dsw-alias-state-business-tertiary: rgba(14, 165, 233, 0.16);--dsw-alias-link: #0369a1;--dsw-alias-button-primary-fill: #0284c7;--dsw-alias-button-primary-hover: #0369a1;--dsw-alias-button-primary-ink: #ffffff;--dsw-alias-interactive-bg-hover: rgba(14, 165, 233, 0.10);--dsw-alias-interactive-bg-active: rgba(14, 165, 233, 0.18);--dsw-alias-interactive-bg-hover-accent: rgba(56, 189, 248, 0.16);--dsw-alias-interactive-bg-hover-danger: rgba(220, 56, 82, 0.13);--dsw-alias-state-error-primary: #c83244;--dsw-alias-state-warn-primary: #c06a12;--dsw-alias-state-warn-label: #8a4a09;--dsw-alias-state-warn-tertiary: #fef0d6;--dsw-alias-state-success-primary: #0f766e;--dsw-radius-xs: 10px;--dsw-radius-sm: 999px;--dsw-radius-md: 18px;--dsw-radius-lg: 22px;--dsw-radius-xl: 26px;--dsw-elevation-panel: inset 0 1.5px 0 rgba(255, 255, 255, 0.92), 0 6px 20px rgba(14, 165, 233, 0.12), 0 0 0 1px rgba(56, 189, 248, 0.36);--dsw-elevation-prominent: inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 0 16px 38px rgba(14, 165, 233, 0.18), 0 0 0 1px rgba(56, 189, 248, 0.44);--dsh-control-border-width: 1px;--dsh-button-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.92), 0 2px 6px rgba(14, 165, 233, 0.12);--dsh-button-hover-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.96), 0 4px 12px rgba(2, 132, 199, 0.22);--dsh-card-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.92), 0 6px 20px rgba(14, 165, 233, 0.10);--dsh-card-hover-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.98), 0 10px 26px rgba(2, 132, 199, 0.16);--dsh-surface-spotlight: rgba(14, 165, 233, 0.10);--dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", Consolas, monospace;--dsh-display-weight: 700;--dsh-display-tracking: 0.015em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=frutiger]{background-color:#eaf7ff;background-image:radial-gradient(60% 48% at 15% 6%,rgba(125,211,252,0.34) 0%,transparent 65%),linear-gradient(180deg,#eaf7ff 0%,#f4fbff 55%,#e5f5fe 100%)}[data-dsh-style=frutiger] :where(button:not([role=tab]),.dsh-btn),:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style=frutiger],:has([data-dsh-style=frutiger])) :where(button:not([role=tab]),.dsh-btn){border-radius:999px;border:1px solid rgba(14,165,233,0.42);background:linear-gradient(180deg,rgba(255,255,255,0.95) 0%,rgba(224,244,255,0.88) 49%,rgba(204,236,255,0.92) 51%,rgba(235,249,255,0.96) 100%);box-shadow:inset 0 1.5px 0 rgba(255,255,255,0.92),0 2px 6px rgba(14,165,233,0.12)}[data-dsh-style=frutiger] :where(.dsh-wb-btn-primary,.dsh-btn-primary,.dsh-header-badge){border-radius:999px;border:1px solid #0284c7;color:#ffffff;background:linear-gradient(180deg,#7dd3fc 0%,#0ea5e9 48%,#0284c7 52%,#38bdf8 100%);box-shadow:inset 0 1.5px 0 rgba(255,255,255,0.88),0 3px 10px rgba(2,132,199,0.24)}[data-dsh-style=frutiger] :where([data-dsh-card],.dsh-card,[data-dsh-panel],.dsh-panel,.dsh-header,[data-dsh-header]){background:linear-gradient(180deg,rgba(255,255,255,0.88) 0%,rgba(240,250,255,0.78) 100%);-webkit-backdrop-filter:blur(10px) saturate(130%);backdrop-filter:blur(10px) saturate(130%);box-shadow:var(--dsh-card-shadow)}[data-dsh-style=gazette],:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=gazette],:has([data-dsh-style=gazette])){color-scheme:light;accent-color:#9b1c1c;--dsw-alias-bg-base: #f6f3ec;--dsw-alias-bg-layer-1: #ede8dd;--dsw-alias-bg-layer-2: #e3dccd;--dsw-alias-bg-layer-3: #d6cebc;--dsw-alias-bg-overlay: #faf8f3;--dsw-alias-bg-module-platform: #ebe5d8;--dsw-alias-settings-card-fill: #faf8f3;--dsw-alias-settings-card-stroke: #161514;--dsw-specific-menu: #faf8f3;--dsw-alias-border-l1: #cec6b6;--dsw-alias-border-l2: #161514;--dsw-alias-border-l3: #161514;--dsw-alias-border-l4: #161514;--dsw-alias-label-primary: #161514;--dsw-alias-label-secondary: #43403c;--dsw-alias-label-tertiary: #635f59;--dsw-alias-label-dimmed: #827d75;--dsw-alias-brand-primary: #9b1c1c;--dsw-alias-brand-text: #161514;--dsw-alias-state-business-primary: #9b1c1c;--dsw-alias-state-business-tertiary: rgba(155, 28, 28, 0.12);--dsw-alias-link: #9b1c1c;--dsw-alias-button-primary-fill: #161514;--dsw-alias-button-primary-hover: #2d2b28;--dsw-alias-button-primary-ink: #faf8f3;--dsw-alias-interactive-bg-hover: rgba(22, 21, 20, 0.06);--dsw-alias-interactive-bg-active: rgba(155, 28, 28, 0.11);--dsw-alias-interactive-bg-hover-accent: rgba(155, 28, 28, 0.10);--dsw-alias-interactive-bg-hover-danger: rgba(155, 28, 28, 0.14);--dsw-alias-state-error-primary: #9b1c1c;--dsw-alias-state-warn-primary: #9a5b08;--dsw-alias-state-warn-label: #6e3f04;--dsw-alias-state-warn-tertiary: #f6ead2;--dsw-alias-state-success-primary: #1f5c3a;--dsw-radius-xs: 0px;--dsw-radius-sm: 1px;--dsw-radius-md: 2px;--dsw-radius-lg: 2px;--dsw-radius-xl: 2px;--dsw-elevation-panel: 0 1px 0 #161514, 0 0 0 1px #161514;--dsw-elevation-prominent: 3px 3px 0 #161514, 0 0 0 1px #161514;--dsh-control-border-width: 1px;--dsh-button-shadow: none;--dsh-button-hover-shadow: 0 2px 0 #161514;--dsh-card-shadow: none;--dsh-card-hover-shadow: 2px 2px 0 #161514;--dsh-surface-spotlight: rgba(155, 28, 28, 0.06);--dsh-font-display: Garamond, Georgia, \"STZhongsong\", \"\\534e\\6587\\4e2d\\5b8b\", \"Noto Serif SC Black\", serif;--dsh-font-body: Georgia, \"Noto Serif SC\", \"STSong\", \"\\534e\\6587\\5b8b\\4f53\", serif;--dsh-font-mono: \"Cascadia Mono\", Consolas, \"Courier New\", monospace;--dsh-display-weight: 700;--dsh-display-tracking: -0.01em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}[data-dsh-style=gazette]{background-color:#f6f3ec}[data-dsh-style=gazette] :where(.pageHeader,.dsh-header,[data-dsh-header],.dsh-wb-header){background:#faf8f3;border-block-end:4px double #161514}[data-dsh-style=gazette] :where([data-dsh-card],.dsh-card,[data-dsh-panel],.dsh-panel){background:#faf8f3;border:1px solid #161514;border-radius:2px;box-shadow:none}[data-dsh-style=gazette] :where([data-dsh-row],.dsh-row){border-block-end:1px solid #161514}[data-dsh-style=gazette] .dsh-split-leading{border-inline-end:1px solid #161514}[data-dsh-style=gazette] .dsh-split-resizer::before{background:#161514}[data-dsh-style=gazette] :where(button:not([role=tab]),.dsh-btn),:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style=gazette],:has([data-dsh-style=gazette])) :where(button:not([role=tab]),.dsh-btn){border:1px solid #161514;border-radius:1px}[data-dsh-style=gazette] :where(.dsh-wb-btn-primary,.dsh-btn-primary){background:#161514;color:#faf8f3;border-color:#161514}[data-dsh-style=gazette] :where(.dsh-wb-btn-primary,.dsh-btn-primary):hover:not(:disabled){background:#9b1c1c;border-color:#9b1c1c}[data-dsh-style=gazette] .dsh-header-badge{background:#9b1c1c;color:#faf8f3;border-radius:1px}[data-dsh-style=gazette] [role=tab][aria-selected=true]::after,[data-dsh-style=gazette] .dsh-tab-indicator{border-block-end-color:#9b1c1c;border-block-end-width:2.5px}:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=gazette],:has([data-dsh-style=gazette])){border:1px solid #161514!important;border-radius:2px!important}:root[data-dsh-font=songkai] [data-dsh-style],:root[data-dsh-font=songkai] [data-dsh-portal-synced],:root[data-dsh-font=songkai] :where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]),[data-dsh-style][data-dsh-font=songkai],[data-dsh-portal-synced][data-dsh-font=songkai]{--dsh-font-display: \"STZhongsong\", \"\\534e\\6587\\4e2d\\5b8b\", \"Noto Serif SC Black\", \"SimSun\", \"\\5b8b\\4f53\", serif;--dsh-font-body: \"Palatino Linotype\", \"STKaiti\", \"\\534e\\6587\\6977\\4f53\", \"KaiTi\", \"\\6977\\4f53\", \"Noto Serif SC\", serif;--dsh-font-mono: \"Cascadia Mono\", Consolas, \"STFangsong\", \"\\534e\\6587\\4eff\\5b8b\", monospace;--dsh-display-weight: 700;--dsh-display-tracking: 0.04em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}:root[data-dsh-font=fangsong] [data-dsh-style],:root[data-dsh-font=fangsong] [data-dsh-portal-synced],:root[data-dsh-font=fangsong] :where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]),[data-dsh-style][data-dsh-font=fangsong],[data-dsh-portal-synced][data-dsh-font=fangsong]{--dsh-font-display: \"Cascadia Mono SemiBold\", \"Cascadia Mono\", \"STZhongsong\", \"\\534e\\6587\\4e2d\\5b8b\", \"FangSong\", \"\\4eff\\5b8b\", monospace;--dsh-font-body: \"Cascadia Mono\", \"STFangsong\", \"\\534e\\6587\\4eff\\5b8b\", \"FangSong\", \"\\4eff\\5b8b\", monospace;--dsh-font-mono: \"Cascadia Mono\", \"STFangsong\", \"\\534e\\6587\\4eff\\5b8b\", \"FangSong\", \"\\4eff\\5b8b\", monospace;--dsh-display-weight: 700;--dsh-display-tracking: 0.02em;--dsh-body-tracking: 0.02em;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}:root[data-dsh-font=poster] [data-dsh-style],:root[data-dsh-font=poster] [data-dsh-portal-synced],:root[data-dsh-font=poster] :where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]),[data-dsh-style][data-dsh-font=poster],[data-dsh-portal-synced][data-dsh-font=poster]{--dsh-font-display: Impact, \"Arial Black\", \"Noto Sans SC Black\", \"SimHei\", \"\\9ed1\\4f53\", sans-serif;--dsh-font-body: \"Source Sans 3\", \"Noto Sans SC Medium\", \"Noto Sans SC\", sans-serif;--dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, monospace;--dsh-display-weight: 900;--dsh-display-tracking: -0.02em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}:root[data-dsh-font=retro98] [data-dsh-style],:root[data-dsh-font=retro98] [data-dsh-portal-synced],:root[data-dsh-font=retro98] :where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]),[data-dsh-style][data-dsh-font=retro98],[data-dsh-portal-synced][data-dsh-font=retro98]{--dsh-font-display: Tahoma, \"SimSun\", \"NSimSun\", \"\\5b8b\\4f53\", \"\\65b0\\5b8b\\4f53\", sans-serif;--dsh-font-body: Tahoma, \"SimSun\", \"NSimSun\", \"\\5b8b\\4f53\", \"\\65b0\\5b8b\\4f53\", sans-serif;--dsh-font-mono: \"Fixedsys\", Consolas, \"Courier New\", \"SimSun\", \"\\5b8b\\4f53\", monospace;--dsh-display-weight: 700;--dsh-display-tracking: normal;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}:root[data-dsh-font=serif] [data-dsh-style],:root[data-dsh-font=serif] [data-dsh-portal-synced],:root[data-dsh-font=serif] :where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]),[data-dsh-style][data-dsh-font=serif],[data-dsh-portal-synced][data-dsh-font=serif]{--dsh-font-display: \"Palatino Linotype\", Georgia, \"Noto Serif SC SemiBold\", \"Noto Serif SC\", \"STZhongsong\", \"\\534e\\6587\\4e2d\\5b8b\", serif;--dsh-font-body: Georgia, \"Noto Serif SC\", \"STSong\", \"\\534e\\6587\\5b8b\\4f53\", serif;--dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, monospace;--dsh-display-weight: 700;--dsh-display-tracking: -0.01em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}:root[data-dsh-font=arcade] [data-dsh-style],:root[data-dsh-font=arcade] [data-dsh-portal-synced],:root[data-dsh-font=arcade] :where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]),[data-dsh-style][data-dsh-font=arcade],[data-dsh-portal-synced][data-dsh-font=arcade]{--dsh-font-display: \"Cascadia Code SemiBold\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-body: \"Cascadia Code\", \"Cascadia Mono\", \"YouYuan\", \"\\5e7c\\5706\", \"Noto Sans SC\", monospace;--dsh-font-mono: \"Cascadia Mono\", \"Cascadia Code\", \"YouYuan\", \"\\5e7c\\5706\", Consolas, monospace;--dsh-display-weight: 700;--dsh-display-tracking: 0.015em;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}:root[data-dsh-font=modern] [data-dsh-style],:root[data-dsh-font=modern] [data-dsh-portal-synced],:root[data-dsh-font=modern] :where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]),[data-dsh-style][data-dsh-font=modern],[data-dsh-portal-synced][data-dsh-font=modern]{--dsh-font-display: \"Source Sans 3\", \"Segoe UI\", \"Noto Sans SC\", \"Microsoft YaHei UI\", sans-serif;--dsh-font-body: \"Source Sans 3\", \"Segoe UI\", \"Noto Sans SC\", \"Microsoft YaHei UI\", sans-serif;--dsh-font-mono: \"Cascadia Code\", \"Cascadia Mono\", Consolas, \"Microsoft YaHei UI\", monospace;--dsh-display-weight: 650;--dsh-display-tracking: normal;--dsh-body-tracking: normal;--dsw-font-family: var(--dsh-font-body);--dsw-font-markdown-base: var(--dsh-font-body)}:where([data-dsh-style],[data-dsh-portal-synced]),:where([data-dsh-style],[data-dsh-portal-synced]) :where(button,input,select,textarea),:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style],[data-dsh-portal-synced],:has([data-dsh-style])),:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style],[data-dsh-portal-synced],:has([data-dsh-style])) :where(button,input,select,textarea){font-family:var(--dsh-font-body);letter-spacing:var(--dsh-body-tracking, normal)}:where([data-dsh-style],[data-dsh-portal-synced]) :where(h1,h2,h3,[role=tab],.dsh-header-title,[data-dsh-serif],[data-dsh-editorial-heading],[data-dsh-card] :is(h2,h3,.dsh-card-title),.dsh-card :is(h2,h3,.dsh-card-title),[data-dsh-reader] :is(h1,h2),.dsh-reader :is(h1,h2)),:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style],[data-dsh-portal-synced],:has([data-dsh-style])) :where(h1,h2,h3,header h2,[role=tab],[data-dsh-serif]){font-family:var(--dsh-font-display);font-weight:var(--dsh-display-weight, 700);letter-spacing:var(--dsh-display-tracking, normal)}:where([data-dsh-style],[data-dsh-portal-synced]) :where(code,pre,kbd,samp),:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style],[data-dsh-portal-synced],:has([data-dsh-style])) :where(code,pre,kbd,samp){font-family:var(--dsh-font-mono)}:where([data-dsh-style]) :where(button,[role=button]),:where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]) :where(button,[role=button]){translate:0px 0px;scale:1;transition-property:background-color,border-color,color,box-shadow,opacity,translate,scale;transition-duration:var(--dsh-motion-fast);transition-timing-function:var(--dsh-ease-out)}:where([data-dsh-style]) :where(button,[role=button])[aria-expanded=true]:not(:disabled):not([aria-disabled=true]),:where([role=dialog],[role=alertdialog],dialog):has([data-dsh-style]) :where(button,[role=button])[aria-expanded=true]:not(:disabled):not([aria-disabled=true]){background-color:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}@media(prefers-reduced-motion:no-preference){@media(hover:hover){:where([data-dsh-style]:not([data-dsh-style=pixel8bit]):not([data-dsh-style=eink]):not([data-dsh-style=win98]):not([data-dsh-style=risograph])) :where(button:not([role=tab]):not([role=menuitem]):not([role=menuitemradio]):not([role=switch]),.dsh-btn):hover:not(:disabled):not([aria-disabled=true]),:where([role=dialog],[role=alertdialog],dialog):has([data-dsh-style]:not([data-dsh-style=pixel8bit]):not([data-dsh-style=eink]):not([data-dsh-style=win98]):not([data-dsh-style=risograph])) :where(button:not([role=tab]):not([role=menuitem]):not([role=menuitemradio]):not([role=switch]),.dsh-btn):hover:not(:disabled):not([aria-disabled=true]){translate:0px -0.5px}[data-dsh-style=pixel8bit] :where(button:not([role=tab]):not([role=menuitem]):not([role=menuitemradio]),.dsh-btn):hover:not(:disabled):not([aria-disabled=true]),:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style=pixel8bit],:has([data-dsh-style=pixel8bit])) :where(button:not([role=tab]):not([role=menuitem]):not([role=menuitemradio]),.dsh-btn):hover:not(:disabled):not([aria-disabled=true]){translate:-1px -1px;box-shadow:3px 3px 0px #1e2826;transition-timing-function:steps(2,end);transition-duration:70ms}[data-dsh-style=risograph] :where(button:not([role=tab]):not([role=menuitem]):not([role=menuitemradio]),.dsh-btn):hover:not(:disabled):not([aria-disabled=true]),:where([role=dialog],[role=alertdialog],dialog):where([data-dsh-style=risograph],:has([data-dsh-style=risograph])) :where(button:not([role=tab]):not([role=menuitem]):not([role=menuitemradio]),.dsh-btn):hover:not(:disabled):not([aria-disabled=true]){translate:-1px -1px;box-shadow:4px 4px 0px #2563eb}}:where([data-dsh-style]:not([data-dsh-style=pixel8bit]):not([data-dsh-style=eink]):not([data-dsh-style=win98]):not([data-dsh-style=risograph])) :where(button:not([role=switch]),[role=button]):active:not(:disabled):not([aria-disabled=true]),:where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]:not([data-dsh-style=pixel8bit]):not([data-dsh-style=eink]):not([data-dsh-style=win98]):not([data-dsh-style=risograph])) :where(button:not([role=switch]),[role=button]):active:not(:disabled):not([aria-disabled=true]){scale:0.965;translate:0px 0.5px;transition-duration:80ms}[data-dsh-style=pixel8bit] :where(button:not([role=tab]):not([role=switch]),.dsh-btn):active:not(:disabled):not([aria-disabled=true]),:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=pixel8bit],:has([data-dsh-style=pixel8bit])) :where(button:not([role=tab]):not([role=switch]),.dsh-btn):active:not(:disabled):not([aria-disabled=true]){translate:1px 1px!important;scale:1!important;box-shadow:1px 1px 0px #1e2826!important;transition-timing-function:steps(2,end);transition-duration:50ms}[data-dsh-style=risograph] :where(button:not([role=tab]):not([role=switch]),.dsh-btn):active:not(:disabled):not([aria-disabled=true]),:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style=risograph],:has([data-dsh-style=risograph])) :where(button:not([role=tab]):not([role=switch]),.dsh-btn):active:not(:disabled):not([aria-disabled=true]){translate:2px 2px!important;scale:1!important;box-shadow:1px 1px 0px #18181b!important;transition-duration:60ms}}:where([data-dsh-style]) :where(button,[role=button],summary) svg,:where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]) :where(button,[role=button],summary) svg{translate:0px 0px;rotate:0deg;scale:1;transform-origin:center}@keyframes dsh-icon-spin{to{rotate:360deg}}@keyframes dsh-icon-wiggle{0%{rotate:0deg}25%{rotate:-12deg}55%{rotate:10deg}80%{rotate:-5deg}100%{rotate:0deg}}@keyframes dsh-icon-pop{0%{scale:1}45%{scale:1.26}75%{scale:0.94}100%{scale:1}}@keyframes dsh-icon-bounce{0%,100%{translate:0px 0px}45%{translate:0px 2.5px}75%{translate:0px -1px}}@media(prefers-reduced-motion:no-preference){:where([data-dsh-style]) :where(button,[role=button],summary) svg,:where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]) :where(button,[role=button],summary) svg{transition:translate var(--dsh-motion-base) var(--dsh-ease-spring),rotate 240ms var(--dsh-ease-spring),scale var(--dsh-motion-base) var(--dsh-ease-spring)}:where([data-dsh-style]) :where([aria-expanded=true],[data-open=true],details[open]>summary) :is(svg[data-dsh-icon=down],svg[data-dsh-icon=chevron-down],svg[data-icon=down],svg[data-icon=chevron-down]),:where([role=dialog],[role=alertdialog],dialog):has([data-dsh-style]) :where([aria-expanded=true],[data-open=true]) :is(svg[data-dsh-icon=down],svg[data-dsh-icon=chevron-down],svg[data-icon=down],svg[data-icon=chevron-down]){rotate:180deg}:where([data-dsh-style]) :where(button,[role=button])[aria-busy=true] :is(svg[data-dsh-icon=refresh],svg[data-dsh-icon=sync],svg[data-icon=refresh],svg[data-icon=sync]),:where([data-dsh-style]) :is(svg[data-dsh-icon=refresh],svg[data-icon=refresh])[data-spinning=true]{animation:dsh-icon-spin 0.85s linear infinite}@media(hover:hover){:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button]):hover:not(:disabled):not([aria-disabled=true]) :is(svg[data-dsh-icon=refresh],svg[data-dsh-icon=sync],svg[data-dsh-icon=reload],svg[data-icon=refresh],svg[data-icon=sync],svg[data-icon=reload]){rotate:180deg}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button]):hover:not(:disabled):not([aria-disabled=true]) :is(svg[data-dsh-icon=plus],svg[data-dsh-icon=add],svg[data-dsh-icon=close],svg[data-dsh-icon=x],svg[data-icon=plus],svg[data-icon=add],svg[data-icon=close],svg[data-icon=x]){rotate:90deg}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button],a):hover:not(:disabled):not([aria-disabled=true]) :is(svg[data-dsh-icon=send],svg[data-dsh-icon=external],svg[data-dsh-icon=link],svg[data-icon=send],svg[data-icon=external],svg[data-icon=link]){translate:2px -1.5px}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button]):hover:not(:disabled):not([aria-disabled=true]) :is(svg[data-dsh-icon=reply],svg[data-dsh-icon=left],svg[data-dsh-icon=undo],svg[data-icon=reply],svg[data-icon=left],svg[data-icon=undo]){translate:-2px 0px}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button]):hover:not(:disabled):not([aria-disabled=true]) :is(svg[data-dsh-icon=right],svg[data-icon=right]){translate:2px 0px}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button]):hover:not(:disabled):not([aria-disabled=true]) :is(svg[data-dsh-icon=play],svg[data-icon=play]){translate:1.5px 0px;scale:1.14}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button]):hover:not(:disabled):not([aria-disabled=true]) :is(svg[data-dsh-icon=trash],svg[data-dsh-icon=delete],svg[data-icon=trash],svg[data-icon=delete]){animation:dsh-icon-wiggle 360ms var(--dsh-ease-in-out)}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button]):hover:not(:disabled):not([aria-disabled=true]) :is(svg[data-dsh-icon=star],svg[data-dsh-icon=check],svg[data-dsh-icon=copy],svg[data-dsh-icon=bookmark],svg[data-icon=star],svg[data-icon=check],svg[data-icon=copy],svg[data-icon=bookmark]){scale:1.18}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button]):hover:not(:disabled):not([aria-disabled=true]) :is(svg[data-dsh-icon=download],svg[data-dsh-icon=export],svg[data-icon=download],svg[data-icon=export]){animation:dsh-icon-bounce 420ms var(--dsh-ease-out)}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button]):hover:not(:disabled):not([aria-disabled=true]) :is(svg[data-dsh-icon=palette],svg[data-dsh-icon=sparkles],svg[data-dsh-icon=edit],svg[data-icon=palette],svg[data-icon=sparkles],svg[data-icon=edit]){rotate:-12deg;scale:1.08}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button])[aria-expanded=false]:hover:not(:disabled):not([aria-disabled=true]) :is(svg[data-dsh-icon=down],svg[data-dsh-icon=chevron-down],svg[data-icon=down],svg[data-icon=chevron-down]){translate:0px 1.5px}}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where([aria-pressed=true],[aria-checked=true],[data-active=true],[data-copied=true]) :is(svg[data-dsh-icon=star],svg[data-dsh-icon=check],svg[data-dsh-icon=copy],svg[data-icon=star],svg[data-icon=check],svg[data-icon=copy]){animation:dsh-icon-pop 300ms var(--dsh-ease-spring)}}:where([data-dsh-style]) :where(.dsh-header,[data-dsh-header]){display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;padding:6px 14px;flex:none;min-width:0;background:var(--dsw-alias-bg-base);border-block-end:var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2)}.dsh-header-leading{display:flex;align-items:center;gap:10px;min-width:0;flex:1 1 auto}.dsh-header-brand{display:inline-flex;align-items:center;gap:8px;min-width:0;flex:none;white-space:nowrap}.dsh-header-badge{display:inline-flex;align-items:center;justify-content:center;flex:none;width:24px;height:24px;border-radius:var(--dsw-radius-xs, 6px);background:var(--dsw-alias-button-primary-fill, #4176e6);color:var(--dsw-alias-button-primary-ink, #ffffff)}.dsh-header-title{margin:0;font-size:13.5px;font-weight:var(--dsh-display-weight, 650);line-height:1.25;color:var(--dsw-alias-label-primary);white-space:nowrap}.dsh-header-tabs{display:flex;align-items:center;min-width:0;flex:1 1 auto}.dsh-header-actions{display:inline-flex;align-items:center;gap:6px;flex:none;white-space:nowrap}@container (max-width: 759px){:where([data-dsh-style]) :where(.dsh-header,[data-dsh-header]){flex-wrap:wrap;padding-block:6px}.dsh-header-leading{flex-wrap:wrap;gap:6px 10px}}:where([data-dsh-style]) :where([role=tablist],.dsh-tablist){position:relative;display:flex;align-items:center;gap:2px;min-width:0;overflow-x:auto;scrollbar-width:thin}:where([data-dsh-style]) [role=tab]{position:relative;flex:none;white-space:nowrap}:where([data-dsh-style]) [role=tab][aria-selected=true]::after{content:\"\";position:absolute;inset-inline:6px;inset-block-end:0;border-block-end:2px solid var(--dsw-alias-state-business-primary);pointer-events:none}[data-dsh-style] :where([data-dsh-tablist][data-indicator-ready=true],.dsh-tablist[data-indicator-ready=true]) [role=tab][aria-selected=true]::after{opacity:0}.dsh-tab-indicator{position:absolute;inset-inline-start:0;inset-block-end:0;height:2px;width:var(--dsh-tab-w, 0px);translate:var(--dsh-tab-x, 0px) 0px;border-block-end:2px solid var(--dsw-alias-state-business-primary);border-radius:2px 2px 0 0;pointer-events:none;opacity:0;transition:translate 180ms var(--dsh-ease-out),width 180ms var(--dsh-ease-out),opacity 120ms ease-out}[data-indicator-ready=true]>.dsh-tab-indicator{opacity:1}.dsh-tablist-pill>.dsh-tab-indicator{inset-block:3px;height:auto;border-block-end:2px solid var(--dsw-alias-state-business-primary);border-radius:var(--dsw-radius-xs, 6px);background:var(--dsw-alias-interactive-bg-active);z-index:0}.dsh-tablist-pill>[role=tab]{z-index:1}[data-dsh-style=eink] .dsh-tab-indicator{transition-duration:60ms}[data-dsh-style=pixel8bit] .dsh-tab-indicator{border-radius:0px!important;transition-timing-function:steps(4,end)}@keyframes dsh-tab-panel-enter{from{opacity:0;translate:0px 4px}to{opacity:1;translate:0px 0px}}:where([data-dsh-style]) :where(.dsh-tab-panel,[data-dsh-tab-panel]):not([hidden]){opacity:1;translate:0px 0px;transition:opacity 140ms var(--dsh-ease-out),translate 140ms var(--dsh-ease-out);animation:dsh-tab-panel-enter 140ms var(--dsh-ease-out)}@starting-style{:where([data-dsh-style]) :where(.dsh-tab-panel,[data-dsh-tab-panel]):not([hidden]){opacity:0;translate:0px 4px}}.dsh-split-pane{display:flex;flex:1 1 auto;min-width:0;min-height:0;width:100%}.dsh-split-leading{flex:none;min-width:0;min-height:0;width:var(--dsh-split-size, 320px)}.dsh-split-trailing{flex:1 1 auto;min-width:0;min-height:0}.dsh-split-resizer{position:relative;flex:none;width:9px;min-height:24px;display:flex;align-items:center;justify-content:center;cursor:col-resize;touch-action:none;user-select:none;background:transparent;outline:none}.dsh-split-resizer[aria-orientation=horizontal]{width:100%;height:9px;min-height:9px;cursor:row-resize}.dsh-split-resizer::before{content:\"\";width:1px;height:100%;background:var(--dsw-alias-border-l2);transition:width 120ms var(--dsh-ease-out),background-color 120ms var(--dsh-ease-out)}.dsh-split-resizer[aria-orientation=horizontal]::before{width:100%;height:1px}.dsh-split-resizer::after{content:\"\";position:absolute;width:3px;height:28px;border-radius:999px;background:var(--dsw-alias-border-l3);opacity:0;transition:opacity 120ms var(--dsh-ease-out),background-color 120ms var(--dsh-ease-out)}.dsh-split-resizer[aria-orientation=horizontal]::after{width:28px;height:3px}.dsh-split-resizer:hover::before,.dsh-split-resizer:focus-visible::before,.dsh-split-resizer[data-dragging=true]::before{width:2px;background:var(--dsw-alias-state-business-primary)}.dsh-split-resizer[aria-orientation=horizontal]:is(:hover,:focus-visible,[data-dragging=true])::before{width:100%;height:2px}.dsh-split-resizer:is(:hover,:focus-visible,[data-dragging=true])::after{opacity:1;background:var(--dsw-alias-state-business-primary)}.dsh-split-resizer:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}[data-dsh-style=pixel8bit] .dsh-split-resizer::before{width:2px;background:#1e2826}[data-dsh-style=pixel8bit] .dsh-split-resizer::after{border-radius:0px}@container (max-width: 759px){.dsh-split-pane{flex-direction:column;overflow-y:auto}.dsh-split-leading{width:100%!important;max-width:100%;flex:none}.dsh-split-resizer{display:none}}@media(max-width:759px){.dsh-split-pane{flex-direction:column;overflow-y:auto}.dsh-split-leading{width:100%!important;max-width:100%;flex:none}.dsh-split-resizer{display:none}}@keyframes dsh-skeleton-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}.dsh-skeleton-group{display:flex;flex-direction:column;gap:8px;width:100%}.dsh-skeleton{display:block;width:100%;height:12px;border-radius:var(--dsw-radius-xs, 6px);background-color:var(--dsw-alias-bg-layer-2, #e5e7eb);background-image:linear-gradient(90deg,var(--dsw-alias-bg-layer-2, #e5e7eb) 0%,color-mix(in oklab,var(--dsw-alias-bg-overlay, #ffffff) 82%,var(--dsw-alias-state-business-primary, #4176e6) 18%) 48%,var(--dsw-alias-bg-layer-2, #e5e7eb) 100%);background-size:220% 100%;background-position:100% 0}.dsh-skeleton-circle{width:32px;height:32px;border-radius:50%;flex:none}.dsh-skeleton-card{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border-radius:var(--dsw-radius-md, 12px);border:var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}.dsh-skeleton-row{display:flex;align-items:center;gap:10px;padding:8px 10px}@media(prefers-reduced-motion:no-preference){:where([data-dsh-style]:not([data-dsh-style=eink])) .dsh-skeleton[data-animated=true]{animation:dsh-skeleton-shimmer 1.35s var(--dsh-ease-in-out) infinite}[data-dsh-style=pixel8bit] .dsh-skeleton[data-animated=true]{border-radius:0px!important;border:1px solid #1e2826;animation-timing-function:steps(4,end)}}[data-dsh-style=eink] .dsh-skeleton{background-image:none;border:1px solid #c5c2b8}.dsh-progress{position:relative;width:100%;height:6px;overflow:clip;border-radius:999px;background:var(--dsw-alias-bg-layer-2)}.dsh-progress-bar{height:100%;width:var(--dsh-progress-value, 0%);border-radius:inherit;background:var(--dsw-alias-state-business-primary);transition:width 200ms var(--dsh-ease-out)}[data-dsh-style=pixel8bit] .dsh-progress{height:10px;border-radius:0px!important;border:2px solid #1e2826;background:var(--dsw-alias-bg-layer-1);box-shadow:2px 2px 0px #1e2826}[data-dsh-style=pixel8bit] .dsh-progress-bar{border-radius:0px!important;background:repeating-linear-gradient(90deg,#2e7d5b 0px,#2e7d5b 6px,#24674a 6px,#24674a 8px);transition-timing-function:steps(8,end)}:where([data-dsh-style]) :where([data-dsh-card],.dsh-card,[data-dsh-row],.dsh-row){translate:0px 0px;transition:background-color var(--dsh-motion-fast) var(--dsh-ease-out),border-color var(--dsh-motion-fast) var(--dsh-ease-out),box-shadow var(--dsh-motion-base) var(--dsh-ease-out),translate var(--dsh-motion-base) var(--dsh-ease-out)}.dsh-row-actions{display:inline-flex;align-items:center;gap:4px;flex:none;translate:0px 0px;transition:opacity var(--dsh-motion-fast) var(--dsh-ease-out),translate var(--dsh-motion-fast) var(--dsh-ease-out)}@media(hover:hover){:where([data-dsh-row],.dsh-row) .dsh-row-actions:not([data-always-visible=true]){opacity:0;translate:4px 0px;pointer-events:none}:where([data-dsh-row],.dsh-row):is(:hover,:focus-within,[data-active=true],[data-selected=true],[aria-selected=true]) .dsh-row-actions{opacity:1;translate:0px 0px;pointer-events:auto}}@media(hover:hover)and (prefers-reduced-motion:no-preference){:where([data-dsh-style]:not([data-dsh-style=pixel8bit]):not([data-dsh-style=eink]):not([data-dsh-style=win98]):not([data-dsh-style=risograph])) :where([data-dsh-card],.dsh-card):hover{translate:0px -1.5px;box-shadow:var(--dsh-card-hover-shadow)}[data-dsh-style=pixel8bit] :where([data-dsh-card],.dsh-card):hover{translate:-1px -1px;box-shadow:4px 4px 0px #1e2826}[data-dsh-style=risograph] :where([data-dsh-card],.dsh-card):hover{translate:-1px -1px;box-shadow:5px 5px 0px #ff3e7f}:where([data-dsh-style]) :where([data-dsh-row],.dsh-row):hover:not([data-selected=true]):not([aria-selected=true]):not([data-active=true]){background-color:var(--dsh-surface-spotlight, var(--dsw-alias-interactive-bg-hover))}}:where([role=dialog],[role=alertdialog],dialog[open]):where([data-dsh-style],:has([data-dsh-style])){overscroll-behavior:contain;opacity:1;transition-property:opacity,scale,translate,display,overlay;transition-duration:var(--dsh-motion-dialog);transition-timing-function:var(--dsh-ease-out);transition-behavior:allow-discrete}@starting-style{:where([role=dialog],[role=alertdialog],dialog[open]):where([data-dsh-style],:has([data-dsh-style])){opacity:0}}@media(prefers-reduced-motion:no-preference){:where([role=dialog],[role=alertdialog],dialog[open]):where([data-dsh-style],:has([data-dsh-style])){scale:1;translate:0px 0px}@starting-style{:where([role=dialog],[role=alertdialog],dialog[open]):where([data-dsh-style],:has([data-dsh-style])){scale:0.965;translate:0px 6px}}}dialog[open]::backdrop{overflow:hidden;overscroll-behavior:contain}:where([data-dsh-style]) [data-plugin-update-footer]{flex:none;box-sizing:border-box;width:100%;min-height:32px;margin:0;padding:6px 14px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 12px;font-size:12px;line-height:1.4;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border-block-start:var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2)}:where([data-dsh-style]) [data-plugin-update-footer] :where(button,a){min-height:24px;font-size:11.5px}:where([data-dsh-style]) [data-show-updates=false] [data-plugin-update-footer]{display:none}.dsh-style-switcher{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;flex:none;white-space:nowrap}.dsh-style-trigger.dsh-style-trigger,.dsh-font-trigger.dsh-font-trigger{display:inline-flex;align-items:center;gap:6px;min-height:28px;height:28px;padding-inline:8px;width:auto;flex-shrink:0;font-size:12px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border:var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px);cursor:pointer;white-space:nowrap}.dsh-font-trigger.dsh-font-trigger{gap:5px;padding-inline:7px}.dsh-font-glyph{display:inline-flex;align-items:center;justify-content:center;flex:none;min-width:16px;height:16px;padding-inline:3px;border-radius:var(--dsw-radius-xs, 4px);background:var(--dsw-alias-state-business-tertiary, rgba(65, 118, 230, 0.12));color:var(--dsw-alias-state-business-primary, var(--dsw-alias-label-primary));font-family:var(--dsh-font-display);font-size:10.5px;font-weight:700;line-height:1}.dsh-style-label,.dsh-font-label{white-space:nowrap;line-height:1}@media(hover:hover){.dsh-style-trigger.dsh-style-trigger:hover:not(:disabled),.dsh-font-trigger.dsh-font-trigger:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}}.dsh-style-swatch{display:inline-block;flex:none;width:10px;height:10px;border-radius:50%;corner-shape:round;background:var(--dsh-swatch-color, var(--dsw-alias-state-business-primary));box-shadow:inset 0 0 0 1px rgba(0,0,0,0.16)}[data-dsh-style=pixel8bit] .dsh-style-swatch{border-radius:0px!important;corner-shape:square;box-shadow:1px 1px 0px #1e2826}.dsh-style-fallback-wrap{position:relative;display:inline-flex}.dsh-style-fallback-menu{position:absolute;inset-block-start:calc(100% + 4px);inset-inline-end:0;z-index:2147483001;display:grid;gap:2px;min-width:186px;max-height:min(420px,70dvh);overflow-y:auto;overscroll-behavior:contain;padding:4px;background:var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-base));border:var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md, 12px);box-shadow:var(--dsw-elevation-prominent)}.dsh-style-fallback-item{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:28px;padding:4px 8px;border:0;border-radius:var(--dsw-radius-xs, 6px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;text-align:start;cursor:pointer}.dsh-style-fallback-item-leading{display:inline-flex;align-items:center;gap:7px;min-width:0}.dsh-style-fallback-item[aria-checked=true]{background:var(--dsw-alias-interactive-bg-active);font-weight:600}@media(hover:hover){.dsh-style-fallback-item:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}}.dsh-fallback-modal-root{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px}.dsh-fallback-modal-mask{position:fixed;inset:0;background:rgba(15,23,42,0.36)}.dsh-fallback-modal-dialog{position:relative;z-index:1;max-width:min(560px,calc(100dvw - 32px));max-height:calc(100dvh - 32px);overflow:clip;display:flex;flex-direction:column;border-radius:var(--dsw-radius-md, 12px);background:var(--dsw-alias-bg-layer-1, #f8fafc);color:var(--dsw-alias-label-primary, #1f232b);box-shadow:var(--dsw-elevation-prominent)}@media(prefers-reduced-motion:reduce){:where([data-dsh-style]) :where(button,[role=button],[data-dsh-card],.dsh-card,[data-dsh-row],.dsh-row,.dsh-row-actions,.dsh-tab-panel,[data-dsh-tab-panel]),:where([role=dialog],[role=alertdialog],[role=menu],dialog):has([data-dsh-style]) :where(button,[role=button]){translate:none!important;scale:none!important;animation:none!important;transition-property:background-color,border-color,color,opacity;transition-duration:90ms}:where([data-dsh-style],[role=dialog],[role=alertdialog],dialog) :where(button,[role=button],summary) svg,[data-dsh-style=pixel8bit] :where([data-dsh-row],.dsh-row)::before,[data-dsh-style=pixel8bit] .dsh-pixel-cursor{animation:none!important;transition:none!important;translate:none!important;scale:none!important}.dsh-tab-indicator{transition-property:opacity;transition-duration:90ms}.dsh-skeleton{animation:none!important;background-image:none}:where([role=dialog],[role=alertdialog],dialog[open]):where([data-dsh-style],:has([data-dsh-style])){scale:none!important;translate:none!important;transition-duration:100ms}}@media(forced-colors:active){:where([data-dsh-style]) :where(button,input,select,textarea,[data-dsh-card],.dsh-card),:where([role=dialog],[role=alertdialog],[role=menu],dialog):where([data-dsh-style],:has([data-dsh-style])){border:1px solid ButtonText}:where([data-dsh-style]) [role=tab][aria-selected=true]::after{opacity:1!important;border-block-end:3px solid Highlight}.dsh-tab-indicator{background:transparent!important;border-block-end:3px solid Highlight}.dsh-split-resizer::before,.dsh-split-resizer::after{background:ButtonText}.dsh-skeleton{border:1px solid GrayText;background:Canvas}}.H,.u{color:var(--dsw-alias-label-primary, #1b1b1c);font-size:13px;line-height:20px}.H{box-sizing:border-box;display:flex;flex-direction:column;height:100%;min-height:0;min-width:0;padding-block-start:var(--dsh-frame-top-clearance, 0px);padding-inline-start:var(--dsh-frame-leading-clearance, 0px);background-color:var(--dsw-alias-bg-base, #ffffff);container-type:inline-size}._a{height:min(720px,80dvh);padding:0}.ta{display:flex;flex:none;min-height:48px;align-items:center;gap:12px;padding:8px 16px}.ae{display:flex;align-items:center;gap:8px;flex:none;margin:0;font-size:14px;line-height:20px;font-weight:650}.ia,.oa{display:grid;place-items:center;color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover-accent);border-radius:var(--dsw-radius-sm, 8px)}.ia{width:26px;height:26px}.ee{display:flex;align-items:center;gap:8px;margin-inline-start:auto;flex:none}.p,.G{display:flex;flex:1;flex-direction:column;min-width:0;min-height:0}.p{overflow:auto}.p>[data-plugin-update-footer=dsh-email]{box-sizing:border-box;width:min(100%,900px);margin:0 auto;padding:12px 20px 20px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}.p[data-show-updates=false]>[data-plugin-update-footer=dsh-email]{display:none}.p[data-show-updates=true]>.G{flex:none}.G[hidden]{display:none}.y{position:relative;display:flex;align-items:center;gap:2px;min-width:0;overflow-x:auto;padding:2px;scrollbar-width:thin}.I{flex:none;white-space:nowrap}.y .I[aria-selected=true]{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary);font-weight:600}.y[data-indicator-ready=true] .I[aria-selected=true]{background:transparent}.e.e{height:auto;min-height:28px;padding-block:3px;text-align:center;white-space:normal}.e.la{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-button-primary-ink, var(--dsw-alias-bg-base))}.e.se{border:0.5px solid var(--dsw-alias-border-l2);box-shadow:none}.e.na{color:var(--dsw-alias-state-error-primary)}.e.re{flex:none;width:28px;padding-inline:0}.h.h{min-width:0;height:auto;min-height:30px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px);background:var(--dsw-alias-bg-base);box-shadow:none}.h>input{min-width:0;font-size:13px;line-height:20px}.Z.Z{min-width:0;padding:0;color:inherit}.Z input{accent-color:var(--dsw-alias-state-business-primary)}.de>span{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.pa{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}.b{display:flex;flex:none;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:var(--dsw-radius-sm, 8px);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.b>svg{flex:none;margin-block-start:1px}.ha{min-width:0;overflow-wrap:anywhere}.ha>.pa{margin-block-start:8px}.b[data-tone=error]{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}.b[data-tone=warn]{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label)}.b[data-tone=success]{color:var(--dsw-alias-state-success-primary)}.U{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:100%;min-height:140px;height:100%;padding:24px 16px;text-align:center;overflow-wrap:anywhere}.oa{width:42px;height:42px;margin-block-end:4px}.U>h2{margin:0;font-size:14px;line-height:20px;font-weight:600}.U>p{margin:0;max-width:40ch;color:var(--dsw-alias-label-secondary)}.ba.ba{display:block;min-width:0}.e.ca{width:100%;min-height:30px;justify-content:space-between;gap:8px;padding:4px 8px;text-align:start}.te{display:block;min-width:0;overflow-wrap:anywhere}.ca>svg{flex:none}.u.u{box-sizing:border-box;display:flex;flex-direction:column;width:min(560px,100%);max-height:100%;min-height:0;padding:0;gap:0;border:0;background:var(--dsw-alias-bg-layer-1, #f8fafc);box-shadow:var(--dsw-elevation-prominent)}.ie{box-sizing:border-box;display:flex;flex:1;flex-direction:column;min-width:0;min-height:0;max-height:100%;overflow:clip;background:var(--dsw-alias-bg-layer-1, #f8fafc);color:var(--dsw-alias-label-primary, #1b1b1c)}.dsh-btn.e{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding-inline:10px;border:0;border-radius:var(--dsw-radius-sm, 8px);background:transparent;color:var(--dsw-alias-label-primary, #1b1b1c);font:inherit;cursor:pointer}.dsh-btn.e:disabled{opacity:0.5;cursor:not-allowed}.dsh-fallback-input-wrap.h{display:inline-flex;align-items:center;gap:6px;padding-inline:8px}.dsh-fallback-input-wrap.h>input{flex:1;border:0;background:transparent;color:inherit;outline:none}.v,.ga{display:flex;align-items:center;justify-content:space-between;flex:none;gap:8px;padding:10px 16px;background:var(--dsw-alias-bg-base)}.v{border-block-end:0.5px solid var(--dsw-alias-border-l2)}.v>h2{margin:0;font-size:15px;line-height:22px;font-weight:600}.v>h2[data-tone=warn]{color:var(--dsw-alias-state-warn-primary)}.oe{min-height:0;min-width:0;overflow:auto;overscroll-behavior:contain;padding:16px}.ga{flex-wrap:wrap;justify-content:flex-end;border-block-start:0.5px solid var(--dsw-alias-border-l2)}.H :focus-visible,.u :focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}@media(hover:hover){.e.la:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.e.na:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger)}}@container (max-width: 650px){.ta{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 8px;padding:8px 12px 4px}.y{grid-area:2 / 1 / auto / -1;margin-inline:-2px}}.le{font-weight:600}.k{--tour-accent: var(--dsw-alias-state-business-primary, #4176e6);--tour-bg: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-base, #ffffff));--tour-ink: var(--dsw-alias-label-primary, #1b2230);--tour-muted: var(--dsw-alias-label-secondary, #5b667a);--tour-border: var(--dsw-alias-border-l2, #d8e0ec);--tour-radius: var(--dsw-radius-md, 12px);position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;overflow:visible;pointer-events:none;z-index:2147483000;color:var(--tour-ink);font:13px/1.55 var(--dsh-font-body, var(--ds-font-family-ui, system-ui, -apple-system, \"Segoe UI\", \"Microsoft YaHei\", sans-serif))}.k[popover]:popover-open{display:block}.k[data-dsh-style=pixel8bit]{--tour-radius: 0px}.wa{position:fixed;pointer-events:none;border-radius:calc(var(--tour-radius) * 0.75 + 2px);box-shadow:0 0 0 2px var(--tour-accent),0 0 0 5px color-mix(in oklab,var(--tour-accent) 22%,transparent),0 0 0 9999px rgba(15,23,42,0.26)}.ne{position:fixed;inset:0;pointer-events:none;background:rgba(15,23,42,0.24)}.d{position:fixed;inset:auto;margin:0;width:min(324px,calc(100vw - 24px));max-block-size:calc(100dvh - 24px);padding:13px 15px 12px;border:1px solid var(--tour-border);border-radius:var(--tour-radius);background:var(--tour-bg);color:var(--tour-ink);box-shadow:var(--dsw-elevation-prominent, 0 16px 40px rgba(15, 23, 42, 0.18));pointer-events:auto;display:flex;flex-direction:column;gap:8px}.k[data-dsh-style=pixel8bit] .d{border-width:2px;box-shadow:4px 4px 0px #1e2826}.l{position:absolute;width:10px;height:10px;background:var(--tour-bg);transform:rotate(45deg);pointer-events:none}.d[data-side=bottom]>.l{top:-6px;left:calc(var(--arrow-x, 28px) - 5px);border-top:1px solid var(--tour-border);border-left:1px solid var(--tour-border)}.d[data-side=top]>.l{bottom:-6px;left:calc(var(--arrow-x, 28px) - 5px);border-bottom:1px solid var(--tour-border);border-right:1px solid var(--tour-border)}.d[data-side=right]>.l{left:-6px;top:calc(var(--arrow-y, 24px) - 5px);border-bottom:1px solid var(--tour-border);border-left:1px solid var(--tour-border)}.d[data-side=left]>.l{right:-6px;top:calc(var(--arrow-y, 24px) - 5px);border-top:1px solid var(--tour-border);border-right:1px solid var(--tour-border)}.d[data-side=center]>.l{display:none}.pe{display:flex;align-items:center;justify-content:space-between;gap:8px}.he{display:inline-flex;align-items:center;gap:8px}.be{display:inline-flex;align-items:center;padding:1px 7px;border-radius:999px;font-size:11px;font-weight:650;font-variant-numeric:tabular-nums;background:color-mix(in oklab,var(--tour-accent) 14%,transparent);color:var(--tour-accent)}.ce{display:inline-flex;align-items:center;gap:4px}.q{width:6px;height:6px;border-radius:999px;background:var(--tour-border)}.q[data-active=true]{width:14px;background:var(--tour-accent)}.L{min-block-size:24px;min-inline-size:24px;padding:2px 6px;border:0;border-radius:var(--dsw-radius-xs, 6px);background:transparent;color:var(--tour-muted);font:inherit;font-size:11.5px;cursor:pointer}.L:hover{color:var(--tour-ink);background:var(--dsw-alias-interactive-bg-hover, rgba(15, 23, 42, 0.05))}.ge{margin:0;font-size:14px;line-height:1.38;font-weight:650}.we{margin:0;font-size:12.5px;line-height:1.55;color:var(--tour-muted)}.xe{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding-block-start:2px}.fe{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-block-start:2px;padding-block-start:8px;border-block-start:0.5px solid var(--tour-border)}.me{display:inline-flex;align-items:center;gap:6px;margin-inline-start:auto}@media(pointer:coarse){.L{min-block-size:32px;padding:4px 10px}}@media(prefers-reduced-motion:no-preference){.wa{transition:top 0.24s cubic-bezier(0.22,1,0.36,1),left 0.24s cubic-bezier(0.22,1,0.36,1),width 0.24s cubic-bezier(0.22,1,0.36,1),height 0.24s cubic-bezier(0.22,1,0.36,1)}.d{transition:top 0.22s cubic-bezier(0.22,1,0.36,1),left 0.22s cubic-bezier(0.22,1,0.36,1)}.q{transition:width 0.18s ease,background-color 0.18s ease}}.xa{box-sizing:border-box;width:min(100%,900px);min-width:0;margin-inline:auto;padding:16px 20px}.a .dshe-panel,.a .dshe-global,.a .dshe-review,.a .dshe-acc-card,.a .dshe-prst-card,.a .dshe-oauth{display:grid;min-width:0;gap:10px;padding:12px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md, 12px);background:var(--dsw-alias-bg-layer-1)}.a .dshe-acc-card,.a .dshe-prst-card{background:var(--dsw-alias-bg-base)}.a .dshe-field,.a .dshe-acc-list,.a .dshe-prst-list,.a .dshe-acc-body,.a .dshe-prst-body{display:grid;min-width:0;gap:6px}.a .dshe-field>label{font-size:12px;font-weight:550;color:var(--dsw-alias-label-secondary)}.a .dshe-field :is(input:not([type=checkbox]),textarea){box-sizing:border-box;min-width:0;max-width:100%;width:100%;padding:6px 8px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit}.a .dshe-field textarea{resize:vertical}.a .dshe-field :is(input,textarea):disabled{opacity:0.55}.a .dshe-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.a .dshe-endpoint-row>input{flex:1 1 120px}.a .dshe-check,.a .dshe-actions,.a .dshe-acc-head,.a .dshe-acc-actions,.a .dshe-prst-head,.a .dshe-prst-actions,.a .dshe-oauth-actions,.a .dshe-endpoint-row,.a .dshe-acc-confirm,.a .dshe-prst-confirm{display:flex;align-items:center;flex-wrap:wrap;gap:6px 8px;min-width:0}.a .dshe-check>input{accent-color:var(--dsw-alias-state-business-primary)}.a .dshe-acc-actions,.a .dshe-prst-actions{margin-inline-start:auto}.a .dshe-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:4px 10px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px);color:var(--dsw-alias-label-primary);background:transparent;font:inherit;cursor:pointer}.a .dshe-btn.primary{border-color:transparent;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-button-primary-ink, var(--dsw-alias-bg-base))}.a .dshe-btn:disabled{cursor:not-allowed;opacity:0.5}.a .dshe-alert,.a .dshe-acc-confirm,.a .dshe-prst-confirm,.a .dshe-acc-empty,.a .dshe-prst-empty{min-width:0;padding:8px 10px;border-radius:var(--dsw-radius-sm, 8px);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;font-size:12px;line-height:18px}.a .dshe-alert.error,.a .dshe-acc-confirm,.a .dshe-prst-confirm{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}.a .dshe-alert.warn,.a .dshe-auto-status.is-draft,.a .dshe-prst-warn{color:var(--dsw-alias-state-warn-label)}.a .dshe-alert.warn{background:var(--dsw-alias-state-warn-tertiary)}.a .dshe-alert.success,.a .dshe-auto-status.is-saved,.a .dshe-oauth-ok{color:var(--dsw-alias-state-success-primary)}.a .dshe-auto-status.is-error,.a .dshe-acc-warn,.a .dshe-acc-danger,.a .dshe-prst-danger{color:var(--dsw-alias-state-error-primary)}.a .dshe-acc-name,.a .dshe-prst-name,.a .dshe-oauth-head{min-width:0;overflow-wrap:anywhere;font-weight:600}.a .dshe-hint,.a .dshe-acc-meta,.a .dshe-prst-meta,.a .dshe-oauth-wait{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}.a .dshe-acc-badge,.a .dshe-prst-badge{padding:0 6px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px}.a .dshe-acc-badge.is-default,.a .dshe-acc-badge.is-oauth,.a .dshe-prst-badge.done{color:var(--dsw-alias-state-success-primary)}.a .dshe-oauth-code{padding:8px 10px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px);font:650 18px/24px var(--ds-font-family-code, ui-monospace);text-align:center;letter-spacing:0.12em;user-select:all}.a a{color:var(--dsw-alias-link);overflow-wrap:anywhere;font-weight:500}.a .dshe-details>summary{cursor:pointer;font-weight:600}.a .dshe-details[open]>summary{margin-block-end:8px}.a .dshe-match-list{margin:0;padding-inline-start:20px;overflow-wrap:anywhere;font-size:12px;line-height:20px}.ue{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-block-end:8px;color:var(--dsw-alias-label-secondary);font-size:12px}.S{display:grid;align-content:start;gap:10px}.S h3,.S h4,.S p{margin:0}.ye{position:fixed;inset-inline-end:16px;inset-block-end:16px;z-index:2147483000;pointer-events:none}.C{display:flex;flex-direction:column;position:relative;pointer-events:auto;width:min(300px,calc(100vw - 32px));width:min(300px,calc(100dvw - 32px));max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md, 12px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);overflow:clip;box-shadow:var(--dsw-elevation-prominent);transform:perspective(720px) rotateX(var(--whale-rx, 0deg)) rotateY(var(--whale-ry, 0deg));transition:transform 220ms cubic-bezier(0.22,1,0.36,1),box-shadow 220ms ease;animation:fa 260ms cubic-bezier(0.22,1,0.36,1);will-change:transform}.c{order:1;display:block;flex:0 1 auto;min-height:0;width:100%;height:auto;max-height:min(52vh,340px);max-height:min(52dvh,340px);object-fit:contain;object-position:center;border-block-end:0.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;user-select:none;transform-origin:center 75%;animation:ma 4.2s ease-in-out infinite;transition:filter 180ms ease}.c[data-whale-skin=false]{background:#fcfaf2}.C[data-whale-patting=true] .c{animation:ua 560ms cubic-bezier(0.34,1.56,0.64,1)}.C[data-whale-mood=check] .c{animation:ya 1.4s ease-in-out infinite}.va{order:2;margin:8px 10px 0;padding:6px 10px;border-radius:var(--dsw-radius-sm, 8px);border:0.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px;line-height:17px;overflow-wrap:anywhere;animation:ka 200ms cubic-bezier(0.22,1,0.36,1)}.ve{order:3;flex:0 0 auto;display:grid;min-width:0;gap:5px;padding:10px 12px}.ke{font-weight:650;font-size:13px;line-height:20px;overflow-wrap:anywhere}.P,.Sa{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:17px}.P[data-whale-clickable=true]{cursor:pointer;border-radius:6px;padding:1px 4px;margin-inline:-4px;transition:background-color 140ms ease,color 140ms ease}.P[data-whale-clickable=true]:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.Sa{font-size:10px;line-height:14px}.Se{order:4;display:flex;flex-wrap:wrap;gap:6px;padding:0 10px 10px}.g{flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:26px;padding:3px 9px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:11.5px;font-weight:550;line-height:16px;cursor:pointer;transition:transform 140ms cubic-bezier(0.22,1,0.36,1),background-color 140ms ease,border-color 140ms ease}.g:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);transform:translateY(-1px)}.g:active:not(:disabled){transform:scale(0.95)}.g:disabled{opacity:0.65;cursor:wait}.Ce{position:absolute;inset-block-start:8px;inset-inline-start:8px;z-index:2;padding:2px 8px;border-radius:999px;border:0.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:11px;font-weight:600;line-height:16px;pointer-events:none;box-shadow:var(--dsw-elevation-subtle, 0 1px 3px rgb(0 0 0 / 0.08))}.ze{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}.Ca{position:absolute;font-size:14px;line-height:1;user-select:none;animation:za 920ms cubic-bezier(0.22,1,0.36,1) forwards}.Ya{position:absolute;inset-block-start:6px;inset-inline-end:6px;z-index:4;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0.5px solid var(--dsw-alias-border-l2);border-radius:50%;corner-shape:round;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);line-height:1;cursor:pointer}@keyframes fa{from{opacity:0;transform:translateY(10px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes ma{0%,100%{transform:translateY(0px)}50%{transform:translateY(-2.5px)}}@keyframes ua{0%{transform:scale(1) rotate(0deg)}25%{transform:scale(1.045,0.945) rotate(-2.2deg)}55%{transform:scale(0.98,1.035) rotate(2deg)}80%{transform:scale(1.015,0.99) rotate(-0.8deg)}100%{transform:scale(1) rotate(0deg)}}@keyframes ya{0%,100%{transform:translateX(0) rotate(0deg)}35%{transform:translateX(-2px) rotate(-1.2deg)}70%{transform:translateX(2px) rotate(1.2deg)}}@keyframes ka{from{opacity:0;transform:translateY(4px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes za{0%{opacity:0;transform:translate3d(0,6px,0) scale(0.6)}20%{opacity:1;transform:translate3d(0,0,0) scale(1.08)}100%{opacity:0;transform:translate3d(var(--wp-dx, 8px),-34px,0) scale(0.85)}}@media(prefers-reduced-motion:reduce){.C,.c,.va,.g,.Ca{animation:none!important;transition:none!important;transform:none!important}}@media(hover:hover){.a .dshe-btn:hover:not(:disabled),.Ya:hover{background:var(--dsw-alias-interactive-bg-hover)}.a .dshe-btn.primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}}@container (max-width: 600px){.xa{padding-inline:12px}.a .dshe-grid{grid-template-columns:minmax(0,1fr)}.a .dshe-acc-actions,.a .dshe-prst-actions{margin-inline-start:0}}.Na,.t,.w,.K,.X{display:flex;flex-direction:column;flex:1;min-width:0;min-height:0}.t{display:grid;grid-template-columns:var(--mail-rail-width, 224px) 9px var(--mail-list-width, 336px) 9px minmax(0,1fr)}.x{flex:none;border-block-end:0.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1)}.x::details-content{overflow:clip;contain:layout}.n{list-style:none;display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;min-block-size:32px;padding:5px 14px;cursor:pointer;user-select:none;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.n::-webkit-details-marker{display:none}.n:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}.n::before{content:\"\\25b8\";content:\"\\25b8\" / \"\";flex:none;display:inline-block;color:var(--dsw-alias-state-business-primary);rotate:0deg}.x[open]>.n::before{rotate:90deg}.Ye{color:var(--dsw-alias-label-primary);font-weight:600}.Ma{margin-inline-start:auto;padding:1px 8px;border-radius:var(--dsw-radius-sm, 8px);border:0.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;max-inline-size:min(46ch,100%);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.Ma[data-linked=true]{color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover-accent)}.Ne{display:grid;gap:8px;padding:2px 14px 10px}.Me{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.Te{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-inline-size:0}.Ta[data-copied=true]{border-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary)}.Ta[data-failed=true]{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}.z{font-size:11px;line-height:16px;color:var(--dsw-alias-state-business-primary);opacity:0;pointer-events:none}.z[data-visible=true]{opacity:1}.z[data-tone=error]{color:var(--dsw-alias-state-error-primary)}.w{background:var(--dsw-alias-bg-layer-1);overflow:auto;padding:10px;gap:14px}.je{line-height:18px;font-weight:600}.Be{display:block;color:var(--dsw-alias-label-secondary);font:11px/16px var(--ds-font-family-code, ui-monospace);font-weight:400}.ja{display:grid;gap:2px;min-width:0}.A{display:flex;align-items:center;justify-content:space-between;min-height:28px;gap:4px;padding-inline:6px 0;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;font-weight:600}.A>h2{margin:0;font:inherit}.A>svg{margin-inline-end:5px}.w .D{justify-content:flex-start;gap:8px;min-width:0;text-align:start;color:var(--dsw-alias-label-secondary)}.D[aria-current=location]{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary);font-weight:600}.D>span:last-child{overflow-wrap:anywhere}.Fe{flex:none;display:grid;gap:8px;padding:10px 12px;border-block-end:0.5px solid var(--dsw-alias-border-l2)}.Ba,.Fa,.Y,.E,.N,.Ha,.Ga,.M,.i{display:flex;align-items:center;min-width:0;gap:6px}.Ba>:first-child{flex:1}.Fa,.Y,.E,.N,.Ha,.M,.i{flex-wrap:wrap}.Y,.Ia{padding:8px 12px}.Y{justify-content:space-between;background:var(--dsw-alias-bg-layer-1);border-block-end:0.5px solid var(--dsw-alias-border-l2)}.He,.T{flex:1;min-height:0;min-width:0;overflow:auto;overscroll-behavior:contain}.Ia{flex:none;display:grid;gap:6px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}.Ge{margin:0;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;overflow-wrap:anywhere}.E{justify-content:space-between}.s{position:relative;display:flex;align-items:center;min-width:0;padding-inline-start:10px;border-block-end:var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2)}.s[data-selected=true]{background:var(--dsw-alias-interactive-bg-hover-accent)}.s[data-selected=true]:not([data-dsh-style=pixel8bit] .s)::before{content:\"\";position:absolute;inset-block:0;inset-inline-start:0;width:2.5px;background:var(--dsw-alias-state-business-primary)}.Za{position:absolute;inset-block-start:50%;inset-inline-end:8px;z-index:2;transform:translateY(-50%);padding:2px;border-radius:var(--dsw-radius-sm, 8px);border:var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-base));box-shadow:var(--dsw-elevation-panel)}@media(hover:none){.Za{position:static;transform:none;margin-inline-end:8px}}.Ie,.Ua,.Ze{display:flex;flex-direction:column;gap:10px;padding:16px}.Ua{padding:10px 12px;gap:8px}.Na .qa{flex:1;display:grid;gap:2px;align-items:start;justify-content:stretch;min-height:62px;min-width:0;padding:8px 12px 8px 8px;border:0;box-shadow:none;text-align:start}.La{display:flex;align-items:center;min-width:0;gap:6px}.La>svg,.Pa{flex:none;color:var(--dsw-alias-state-business-primary)}.Pa{width:6px;height:6px;border-radius:50%;corner-shape:round;background:var(--dsw-alias-state-business-primary)}.j,.B{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.j{flex:1}.j,.B{font-size:13px;line-height:18px}.s[data-unread=true] .j,.s[data-unread=true] .B{color:var(--dsw-alias-label-primary);font-weight:650}.s[data-unread=false] .B{color:var(--dsw-alias-label-secondary)}.Ue{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;font-variant-numeric:tabular-nums}.X{background:var(--dsw-alias-bg-base)}.J{display:flex;flex-direction:column;min-height:0;flex:1;min-width:0}.N,.O{flex:none;min-height:44px;padding:7px 14px;border-block-end:0.5px solid var(--dsw-alias-border-l2)}.O{display:none}.T{padding:20px 24px}.T>h2{margin:0 0 12px;font-size:22px;line-height:28px;letter-spacing:-0.015em;font-weight:650;overflow-wrap:anywhere}.qe{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:flex-start;padding:10px 12px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md, 12px);background:var(--dsw-alias-bg-layer-1)}.Le{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:50%;corner-shape:round;background:var(--dsw-alias-interactive-bg-hover-accent);color:var(--dsw-alias-state-business-primary);font-size:12px;font-weight:650}.Ka{flex:1 1 150px;min-width:0;overflow-wrap:anywhere}.Ka p{margin:0}.Pe{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.Q{flex-basis:100%;padding-block-start:8px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}.Q>pre,.Xa{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.65 var(--ds-font-family-code, ui-monospace)}.Q>pre{margin-block-start:4px;color:var(--dsw-alias-label-secondary)}.Ke{display:grid;gap:12px;padding-block:16px;min-width:0;overflow-wrap:anywhere}.R{display:flex;align-items:flex-start;flex-wrap:wrap;gap:8px 12px;padding:8px 10px;border-radius:var(--dsw-radius-sm, 8px);background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label);font-size:12px;line-height:18px}.R>svg{flex:none;margin-block-start:2px}.R>span{flex:1 1 170px}.r,.Xa{overflow:auto;overflow-wrap:anywhere;max-width:100%}.r{font-size:14px;line-height:1.65}.r p{margin-block:0 0.75em}.r a{color:var(--dsw-alias-link);font-weight:500}.r blockquote{margin:10px 0;padding:6px 10px;border-inline-start:0.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary)}.r table{border-collapse:collapse}.r :is(th,td){border:0.5px solid var(--dsw-alias-border-l2);padding:4px 6px}.r hr{border:0;border-block-start:0.5px solid var(--dsw-alias-border-l2)}.r pre{white-space:pre-wrap}.Xe{display:block;max-width:100%;height:auto;margin-block:8px}.Ae{display:block;width:fit-content;padding:8px 10px;margin-block:8px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:12px}.De{display:block;color:var(--dsw-alias-state-error-primary)}.F{flex:none;max-block-size:112px;min-width:0;overflow:auto;padding:8px 14px 10px;background:var(--dsw-alias-bg-base);border-block-start:0.5px solid var(--dsw-alias-border-l2)}.F>h3{margin:0 0 8px;font-size:13px;line-height:20px}.F>ul,.Aa{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:0}.F li{max-width:100%;min-width:0}.V{display:grid;min-width:0;text-align:start;overflow-wrap:anywhere}.V>strong{font-weight:500}.V>small{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px}.Ee,.i{margin:8px 12px}.i{align-self:flex-end;border:0;border-radius:var(--dsw-radius-md, 12px);background:var(--dsw-alias-bg-layer-1);padding:6px 8px 6px 12px;box-shadow:var(--dsw-elevation-panel)}.i>span{flex:1;overflow-wrap:anywhere}.Aa{display:grid}.Ga>:first-child,.M>:first-child{flex:1;min-width:0}.M{padding:6px 8px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px);overflow-wrap:anywhere}.Da{display:grid;gap:12px;min-width:0}.Da>p{margin:0}@media(hover:hover){.s::after{content:\"\";position:absolute;inset:0;pointer-events:none;background:radial-gradient(220px circle at var(--mail-spot-x, -999px) var(--mail-spot-y, -999px),var(--dsh-surface-spotlight, rgba(65, 118, 230, 0.06)),transparent 70%);opacity:0}.s:hover::after{opacity:1}}@media(prefers-reduced-motion:no-preference){.n::before{transition:rotate 180ms var(--dsh-ease-out, ease-out)}.x::details-content{interpolate-size:allow-keywords;transition:block-size 180ms var(--dsh-ease-out, ease-out),content-visibility 180ms var(--dsh-ease-out, ease-out);transition-behavior:allow-discrete}.x:not([open])::details-content{block-size:0}.z{transition:opacity 140ms ease-out}.J,.i{opacity:1;translate:0px 0px;transition:opacity 180ms var(--dsh-ease-out, ease-out),translate 180ms var(--dsh-ease-out, ease-out)}@starting-style{.J,.i{opacity:0;translate:0px 4px}}@media(hover:hover){.s::after{transition:opacity 200ms ease}.s:hover:not([data-selected=true]) .qa{translate:1.5px 0px}}}@container (max-width: 1050px){.t{grid-template-columns:minmax(168px,var(--mail-rail-width, 188px)) 9px minmax(256px,var(--mail-list-width, 286px)) 9px minmax(0,1fr)}.T{padding-inline:16px}}@container (max-width: 760px){.t{display:flex;overflow:auto}.t .dsh-split-resizer{display:none}.w{flex:none;max-height:174px;gap:6px;border-inline-end:0;border-block-end:0.5px solid var(--dsw-alias-border-l2)}.ja{display:flex;flex-wrap:wrap;align-items:center}.K{border:0}.t[data-reading=false] .X,.t[data-reading=true] :is(.w,.K){display:none}.O{display:flex;align-items:center}.N{min-height:0}}.W{box-sizing:border-box;width:min(100%,900px);min-width:0;margin-inline:auto;padding:16px 20px}._,.Ea,.Ja,.aa,.o,.ea,.Oa,.Qa{display:grid;gap:10px;min-width:0}._{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 12px;margin-block-end:12px}._>h2{margin:0;font-size:16px;line-height:22px}.Je{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}.Ea{margin-block-start:12px;gap:0;border:var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md, 12px);background:var(--dsw-alias-bg-layer-1);overflow:clip}.W .f{display:grid;align-items:center;grid-template-columns:minmax(0,1fr) minmax(68px,auto);justify-content:stretch;gap:8px;padding:10px 12px;text-align:start;border:0;box-shadow:none;border-radius:0}.f+.f{border-block-start:var(--dsh-control-border-width, 0.5px) solid var(--dsw-alias-border-l2)}.f>span:first-child{display:grid;min-width:0;gap:2px;overflow-wrap:anywhere}.f strong{font-size:13px;line-height:18px;font-weight:600}.Oe{justify-self:end;text-align:end}.Ra.Ra{width:min(664px,100%)}.Ja,.ea{gap:12px}.aa{grid-template-columns:repeat(2,minmax(0,1fr))}.o{gap:4px}.o>label,.Qe{font-size:12px;font-weight:550;color:var(--dsw-alias-label-secondary)}.o textarea,.o input[type=datetime-local]{box-sizing:border-box;width:100%;min-width:0;padding:6px 9px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit}.o textarea{min-height:96px;resize:vertical}.o .Re{font:12px/18px var(--ds-font-family-code, ui-monospace)}.Ve{width:min(100%,390px)}.We{display:grid;gap:8px;min-width:0}.Va{min-height:96px;max-height:320px;overflow:auto;padding:10px 12px;background:var(--dsw-alias-bg-base);border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px)}.Va>pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/18px var(--ds-font-family-code, ui-monospace)}.sa{margin-block-start:8px;color:var(--dsw-alias-label-secondary)}.sa summary{cursor:pointer}.sa>pre{white-space:pre-wrap;overflow-wrap:anywhere}.Oa{padding:8px 10px;border-radius:var(--dsw-radius-sm, 8px);border:0.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base)}._e,.ra,.m>div{display:flex;align-items:center;justify-content:space-between;min-width:0;gap:8px}.da{display:grid;gap:4px;width:fit-content;max-width:100%}.da input{max-width:100%;font:inherit}.da input::file-selector-button{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px);padding:3px 8px;margin-inline-end:6px;font:inherit}.Qa{margin:0;padding:0;list-style:none}.ra{justify-content:flex-start;flex-wrap:wrap;overflow-wrap:anywhere}.ra>span{flex:1 1 140px;min-width:0}.ea a{color:var(--dsw-alias-link);font-weight:500}.m{margin:0;padding:8px 10px;background:var(--dsw-alias-bg-base);border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm, 8px)}.m>div{justify-content:flex-start;align-items:baseline}.m dt{min-width:80px;color:var(--dsw-alias-label-secondary)}.m dd{margin:0;min-width:0;overflow-wrap:anywhere}.Wa,.as{margin:0;padding-inline-start:16px;overflow-wrap:anywhere}.Wa [data-blocked=true]{color:var(--dsw-alias-state-error-primary)}@media(max-width:520px){.aa{grid-template-columns:minmax(0,1fr)}.W{padding-inline:12px}}\n";
// Email-specific layout around the primitives shared by the Harness Web shell.
function createWorkbenchUI(React, require) {
  const h = React.createElement;
  const { useId, useState } = React;
  const { clsx, ui, styleKit } = emailUi;
  const {
    DSH_STYLES,
    DSH_STYLE_STORAGE_KEY,
    DSH_STYLE_EVENT,
    DSH_FONTS,
    DSH_DEFAULT_FONT,
    DSH_FONT_STORAGE_KEY,
    DSH_FONT_EVENT,
    DSH_ICON_PATHS,
    useDshStyle,
    readDshStyle,
    writeDshStyle,
    subscribeDshStyle,
    useDshFont,
    readDshFont,
    writeDshFont,
    subscribeDshFont,
    createOverlaySyncRef,
    resolveHostPrimitives,
    createStyleSwitcherComponent,
  } = styleKit;
  // Keep host controls on the render path with safe standalone/jsdom fallbacks.
  const primitives = () => resolveHostPrimitives(React, require);
  const StyleSwitcher = createStyleSwitcherComponent(React, require);
  const paths = {
    ...DSH_ICON_PATHS,
    mail: ['M3 5h18v14H3z', 'm3 6 9 7 9-7'],
    inbox: ['M4 13 6 5h12l2 8v6H4z', 'M4 13h5l1 3h4l1-3h5'],
    send: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
    search: ['M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z', 'm16 16 5 5'],
    plus: ['M12 5v14M5 12h14'],
    refresh: ['M20 7a9 9 0 1 0 1 8', 'M20 2v5h-5'],
    close: ['m6 6 12 12M18 6 6 18'],
    left: ['m14 5-7 7 7 7'],
    right: ['m10 5 7 7-7 7'],
    down: ['m5 9 7 7 7-7'],
    download: ['M12 3v12m-5-5 5 5 5-5', 'M4 16v5h16v-5'],
    file: ['M4 3h10l6 6v12H4z', 'M14 3v6h6M8 13h8M8 17h6'],
    folder: ['M3 5h7l2 3h9v12H3z'],
    edit: ['m15 4 5 5-10 10-6 1 1-6Z', 'm13 6 5 5'],
    trash: ['M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7'],
    info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 11v6M12 7h.01'],
    check: ['m5 12 4 4L19 6'],
    star: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z'],
    reply: ['m9 5-7 7 7 7v-5h6c3 0 5 2 6 5 0-8-4-11-12-11Z'],
    lock: ['M5 10h14v11H5z', 'M8 10V7a4 4 0 0 1 8 0v3M12 14v3'],
    clip: ['m8 13 6-6a2.5 2.5 0 0 1 3.5 3.5l-7 7a4 4 0 0 1-5.7-5.7l8-8a5 5 0 0 1 7.1 7.1l-8 8'],
    clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
    image: ['M3 4h18v16H3z', 'm3 17 6-6 5 5 2-2 5 5M16 8h.01'],
  };
  function Icon({ name = 'file', size = 16, ...props }) {
    return h('svg', {
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: 1.65, strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': true, focusable: false, 'data-dsh-icon': name, ...props,
    }, (paths[name] || paths.file).map((d, index) => h('path', { key: index, d })));
  }
  function Button({ children, icon, variant = 'outline', className, size = 'sm', ...props }) {
    return h(primitives().Button, {
      variant: variant === 'danger' ? 'ghost' : variant, size, ...props,
      className: clsx(ui.button, variant === 'primary' && clsx(ui.primary, 'dsh-btn-primary'), variant === 'outline' && ui.outline, variant === 'danger' && ui.danger, className),
      icon: icon ? h(Icon, { name: icon }) : undefined,
    }, children);
  }
  function IconButton({ label, icon, className, variant = 'ghost', ...props }) {
    return h(Button, { ...props, icon, variant, className: clsx(ui.iconButton, className), 'aria-label': label, title: label });
  }
  function Input({ icon, className, ...props }) {
    return h(primitives().Input, { ...props, icon: icon ? h(Icon, { name: icon }) : undefined, className: clsx(ui.input, className) });
  }
  function Checkbox({ label, hiddenLabel = false, className, modalAutofocus, ...props }) {
    const P = primitives();
    const autofocusProps = P.isFallback
      ? (modalAutofocus ? { 'data-modal-autofocus': '' } : {})
      : (modalAutofocus !== undefined ? { modalAutofocus } : {});
    return h(P.Checkbox, { ...props, ...autofocusProps, label, className: clsx(ui.checkbox, hiddenLabel && ui.checkboxIcon, className) });
  }
  let emailTourSessionDone = false;
  function readEmailTourDone(storageKey) {
    if (emailTourSessionDone) return true;
    try {
      return typeof window !== 'undefined' && window.localStorage?.getItem(storageKey) === 'done';
    } catch {
      return false;
    }
  }
  function writeEmailTourDone(storageKey) {
    emailTourSessionDone = true;
    try {
      if (typeof window !== 'undefined') window.localStorage?.setItem(storageKey, 'done');
    } catch { /* ignore */ }
  }
  function computeTourLayout(target, preferredSide, cardEl) {
    const vw = (typeof window !== 'undefined' && window.innerWidth) || 1280;
    const vh = (typeof window !== 'undefined' && window.innerHeight) || 800;
    const cw = cardEl?.offsetWidth || 320;
    const ch = cardEl?.offsetHeight || 196;
    const pad = 5;
    const gap = 12;
    const raw = target?.getBoundingClientRect?.();
    if (!target) {
      return {
        spotlight: null,
        side: 'center',
        left: Math.max(12, Math.round((vw - cw) / 2)),
        top: Math.max(12, Math.round((vh - ch) / 2)),
        arrowX: 28,
        arrowY: 24,
      };
    }
    const hasBox = Boolean(raw && (raw.width > 0 || raw.height > 0));
    const rect = hasBox ? raw : { left: 120, top: 72, width: 140, height: 32 };
    const spotlight = {
      left: Math.round(rect.left - pad),
      top: Math.round(rect.top - pad),
      width: Math.round(rect.width + pad * 2),
      height: Math.round(rect.height + pad * 2),
    };
    const spaceBottom = vh - spotlight.top - spotlight.height;
    const spaceTop = spotlight.top;
    const spaceRight = vw - spotlight.left - spotlight.width;
    const spaceLeft = spotlight.left;
    let side = preferredSide || 'bottom';
    if (side === 'right' && spaceRight < cw + gap + 12) {
      side = spaceBottom >= ch + gap + 12 ? 'bottom' : spaceLeft >= cw + gap + 12 ? 'left' : 'top';
    } else if (side === 'left' && spaceLeft < cw + gap + 12) {
      side = spaceRight >= cw + gap + 12 ? 'right' : 'bottom';
    } else if (side === 'bottom' && spaceBottom < ch + gap + 12 && spaceTop > spaceBottom) {
      side = 'top';
    } else if (side === 'top' && spaceTop < ch + gap + 12 && spaceBottom > spaceTop) {
      side = 'bottom';
    }
    let left = spotlight.left;
    let top = spotlight.top + spotlight.height + gap;
    if (side === 'top') top = spotlight.top - ch - gap;
    else if (side === 'right') { left = spotlight.left + spotlight.width + gap; top = spotlight.top; }
    else if (side === 'left') { left = spotlight.left - cw - gap; top = spotlight.top; }
    left = Math.round(Math.max(12, Math.min(vw - cw - 12, left)));
    top = Math.round(Math.max(12, Math.min(vh - ch - 12, top)));
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return {
      spotlight,
      side,
      left,
      top,
      arrowX: Math.round(Math.max(18, Math.min(cw - 18, centerX - left))),
      arrowY: Math.round(Math.max(18, Math.min(ch - 18, centerY - top))),
    };
  }
  function CoachmarkTour({ rootRef, steps = [], step = 0, manual = false, style = 'harness', font = DSH_DEFAULT_FONT, lang = 'zh', layout: rawLayout, setLayout, onStep, onClose, onCopyPrompt }) {
    const layerRef = React.useRef ? React.useRef(null) : { current: null };
    const cardRef = React.useRef ? React.useRef(null) : { current: null };
    const nextBtnRef = React.useRef ? React.useRef(null) : { current: null };
    const [copied, setCopied] = useState(false);
    const titleId = (typeof useId === 'function' ? useId() : 'dsh-email-tour') + '-title';
    const isEn = String(lang).startsWith('en');
    const l = (zh, en) => (isEn ? en : zh);
    const current = steps[Math.max(0, Math.min(steps.length - 1, step))] || {};
    const layout = rawLayout && typeof rawLayout === 'object' && rawLayout.side
      ? rawLayout
      : { spotlight: null, side: current.side || 'bottom', left: 24, top: 76, arrowX: 28, arrowY: 24 };

    React.useEffect?.(() => {
      const node = layerRef.current;
      if (!node) return undefined;
      try {
        node.setAttribute?.('popover', 'manual');
        node.showPopover?.();
      } catch { /* ignore */ }
      return () => { try { node.hidePopover?.(); } catch { /* ignore */ } };
    }, []);

    React.useEffect?.(() => {
      function safeQuery(scope, selector) {
        if (!selector || typeof scope.querySelector !== 'function') return null;
        if (selector.startsWith('#') && !/[\s>+~[\].,()]/.test(selector.slice(1))) {
          const id = selector.slice(1).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          try { return scope.querySelector('[id="' + id + '"]'); } catch { /* ignore */ }
        }
        try { return scope.querySelector(selector); } catch { return null; }
      }
      function measure() {
        const scope = rootRef?.current || (typeof document !== 'undefined' ? document : null);
        if (!scope || typeof scope.querySelector !== 'function') return;
        const target = safeQuery(scope, current.selector) || safeQuery(scope, current.fallback) || null;
        setLayout?.(computeTourLayout(target, current.side, cardRef.current));
      }
      measure();
      const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(measure) : null;
      if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
        return () => { if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf); };
      }
      window.addEventListener('resize', measure, { passive: true });
      window.addEventListener('scroll', measure, true);
      return () => {
        if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
        window.removeEventListener('resize', measure);
        window.removeEventListener('scroll', measure, true);
      };
    }, [step, current.selector, current.fallback, current.side]);

    React.useEffect?.(() => {
      if (manual) nextBtnRef.current?.focus?.();
    }, [manual, step]);

    async function handleCopy() {
      if (!current.prompt || !onCopyPrompt) return;
      const ok = await onCopyPrompt(current.prompt);
      if (ok !== false) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    }

    const isLast = step >= steps.length - 1;
    function finish() { onClose?.(manual); }
    function onKeyDown(event) {
      if (event.isComposing || event.nativeEvent?.isComposing) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(); }
      else if (event.key === 'ArrowRight' && !isLast) { event.preventDefault(); onStep?.(step + 1, true); }
      else if (event.key === 'ArrowLeft' && step > 0) { event.preventDefault(); onStep?.(step - 1, true); }
    }

    return h('div', {
      ref: layerRef,
      className: ui.tourLayer,
      'data-dsh-style': style,
      'data-dsh-font': font,
      'data-email-tour': current.id || String(step),
      'data-window-drag-exclude': '',
    },
      layout.spotlight
        ? h('div', {
            className: ui.tourSpotlight,
            'data-tour-spotlight': current.id || String(step),
            'aria-hidden': 'true',
            style: {
              left: layout.spotlight.left + 'px',
              top: layout.spotlight.top + 'px',
              width: layout.spotlight.width + 'px',
              height: layout.spotlight.height + 'px',
            },
          })
        : h('div', { className: ui.tourBackdropFallback, 'aria-hidden': 'true' }),
      h('div', {
        ref: cardRef,
        role: 'dialog',
        'aria-modal': 'false',
        'aria-labelledby': titleId,
        tabIndex: -1,
        onKeyDown,
        className: ui.tourCard,
        'data-side': layout.side,
        'data-tour-card': current.id || String(step),
        style: {
          left: layout.left + 'px',
          top: layout.top + 'px',
          '--arrow-x': layout.arrowX + 'px',
          '--arrow-y': layout.arrowY + 'px',
        },
      },
        h('span', { className: ui.tourArrow, 'data-tour-arrow': layout.side, 'aria-hidden': 'true' }),
        h('div', { className: ui.tourHead },
          h('div', { className: ui.tourStepMeta },
            h('span', { className: ui.tourStepBadge }, (step + 1) + ' / ' + steps.length),
            h('span', { className: ui.tourDots, 'aria-hidden': 'true' },
              steps.map((item, idx) => h('span', { key: item.id || idx, className: ui.tourDot, 'data-active': idx === step ? 'true' : undefined })))),
          h('button', { type: 'button', className: ui.tourSkip, onClick: finish }, l('跳过', 'Skip'))),
        h('h2', { id: titleId, className: ui.tourTitle }, current.title),
        h('p', { className: ui.tourDesc }, current.desc),
        current.prompt ? h('div', { className: ui.tourInlineAction },
          h(Button, {
            variant: 'outline',
            icon: copied ? 'check' : 'copy',
            'data-copy-prompt': current.prompt,
            'data-copied': copied ? 'true' : undefined,
            onClick: () => { void handleCopy(); },
          }, copied ? l('已复制', 'Copied') : (current.promptLabel || l('复制对话指令', 'Copy prompt')))) : null,
        h('div', { className: ui.tourFooter },
          step > 0
            ? h(Button, { variant: 'ghost', onClick: () => onStep?.(step - 1, true), 'data-tour-prev': '' }, l('上一步', 'Back'))
            : h('span', null),
          h('div', { className: ui.tourNav },
            h(Button, {
              ref: nextBtnRef,
              variant: 'primary',
              'data-tour-next': '',
              onClick: () => (isLast ? finish() : onStep?.(step + 1, true)),
            }, isLast ? l('完成引导', 'Done') : l('下一步', 'Next'))))));
  }
  function Page({ title, navigation, actions, children, workbench = false, showUpdates = false, className, lang = 'zh', tourSteps = null, tourStorageKey = 'dsh-email.tour.v1', onTourCopyPrompt }) {
    const [style, setStyle] = useDshStyle(React);
    const [font, setFont] = useDshFont(React);
    const rootRef = React.useRef ? React.useRef(null) : { current: null };
    const triggerRef = React.useRef ? React.useRef(null) : { current: null };
    const [tour, setTour] = useState({ open: false, step: 0, manual: false });
    const [tourLayout, setTourLayout] = useState(null);
    const hasTour = Array.isArray(tourSteps) && tourSteps.length > 0;
    const isEn = String(lang).startsWith('en');

    React.useEffect?.(() => {
      if (!workbench || !hasTour || readEmailTourDone(tourStorageKey)) return undefined;
      const timer = setTimeout(() => {
        if (!readEmailTourDone(tourStorageKey)) {
          setTour({ open: true, step: 0, manual: false });
        }
      }, 280);
      return () => clearTimeout(timer);
    }, [workbench, hasTour, tourStorageKey]);

    function closeTour(restoreFocus = false) {
      writeEmailTourDone(tourStorageKey);
      setTour(prev => ({ ...prev, open: false }));
      if (restoreFocus) setTimeout(() => triggerRef.current?.focus?.(), 0);
    }

    return h('section', { ref: rootRef, className: clsx(ui.page, !workbench && ui.embedded, className), 'data-dsh-style': style, 'data-dsh-font': font },
      h('header', { className: clsx(ui.pageHeader, 'dsh-header'), 'data-dsh-header': '' },
        h('div', { className: 'dsh-header-leading' },
          h('div', { className: 'dsh-header-brand' },
            h('h1', { className: clsx(ui.title, 'dsh-header-title') }, h('span', { className: clsx(ui.brand, 'dsh-header-badge') }, h(Icon, { name: 'mail', size: 15 })), title)),
          navigation ? h('div', { className: 'dsh-header-tabs' }, navigation) : null),
        h('div', { className: clsx(ui.headerActions, 'dsh-header-actions') },
          hasTour ? h(Button, {
            ref: triggerRef,
            variant: 'ghost',
            className: ui.tourTrigger,
            'data-email-tour-trigger': '',
            'aria-label': isEn ? 'Interactive guide' : '使用引导',
            'aria-expanded': tour.open,
            title: isEn ? 'Interactive guide' : '使用引导',
            onClick: () => setTour({ open: true, step: 0, manual: true }),
          }, isEn ? '? Tour' : '? 引导') : null,
          h(StyleSwitcher, { style, font, onChange: setStyle, onFontChange: setFont, lang, compact: true }),
          actions)),
      h('div', { className: ui.pageBody, 'data-show-updates': showUpdates }, children),
      hasTour && tour.open ? h(CoachmarkTour, {
        rootRef,
        steps: tourSteps,
        step: tour.step,
        manual: tour.manual,
        style,
        font,
        lang,
        layout: tourLayout,
        setLayout: setTourLayout,
        onStep: (next, isManual) => setTour({ open: true, step: next, manual: Boolean(isManual) }),
        onClose: closeTour,
        onCopyPrompt: onTourCopyPrompt,
      }) : null);
  }
  function Tabs({ items, value, onChange, label, id }) {
    const indicator = styleKit.useSlidingTabIndicator(React, value, { deps: [items.length] });
    function onKeyDown(event, index) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + step + items.length) % items.length;
      onChange(items[next].id);
      event.currentTarget.parentElement?.querySelectorAll('[role=tab]')[next]?.focus();
    }
    return h('div', { className: clsx(ui.tabs, 'dsh-tablist', 'dsh-tablist-pill'), role: 'tablist', 'aria-label': label, ...indicator.tablistProps },
      items.map((item, index) =>
        h(Button, { variant: 'ghost', key: item.id, className: ui.tab, role: 'tab', id: id + '-tab-' + item.id,
          'aria-controls': id + '-panel-' + item.id, 'aria-selected': item.id === value, tabIndex: item.id === value ? 0 : -1,
          onClick: () => onChange(item.id), onKeyDown: event => onKeyDown(event, index) }, item.label)),
      h('span', indicator.indicatorProps));
  }
  function Status({ children, tone = 'info', className }) {
    if (!children) return null;
    return h('div', { className: clsx(ui.status, className), 'data-tone': tone, role: tone === 'error' ? 'alert' : 'status' },
      h(Icon, { name: tone === 'success' ? 'check' : 'info' }), h('div', { className: ui.statusText }, children));
  }
  function Empty({ title, children, action, icon = 'mail' }) {
    return h('div', { className: ui.empty },
      h('span', { className: ui.emptyIcon }, h(Icon, { name: icon, size: 22 })),
      h('h2', null, title),
      children ? h('p', null, children) : null,
      action ? h('div', { className: ui.actions }, action) : null);
  }
  function ChoiceMenu({ label, id, value, items, onChange, disabled, children, className, align }) {
    const [open, setOpen] = useState(false);
    const [style] = useDshStyle(React);
    const [font] = useDshFont(React);
    const P = primitives();
    const selected = items.find(item => item.id === value);
    return h(P.Menu, {
      open: open && !disabled, selectedId: value, dshStyle: style, dshFont: font, items, align, portal: !P.isFallback, autoFocus: true, minWidthFromAnchor: true,
      className: clsx(ui.menu, className),
      onClose: () => setOpen(false),
      onSelect: next => { setOpen(false); if (next !== value) onChange(next); },
      anchor: h(Button, { id, className: ui.menuButton, disabled: disabled || items.length === 0,
        'aria-label': label, 'aria-haspopup': 'menu', 'aria-expanded': open && !disabled,
        onClick: () => setOpen(previous => !previous),
        onKeyDown: event => { if (!open && ['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true); } },
      }, h('span', { className: ui.menuValue }, children ?? selected?.label ?? label), h(Icon, { name: 'down' })),
    });
  }
  // Adapt the existing settings field definitions to a host menu. Their
  // option values and input handlers remain shared with the settings editor.
  function SettingsChoice({ children }) {
    const { value, id, disabled, onChange, children: options } = children.props;
    const items = React.Children.toArray(options).map(option => ({
      id: String(option.props.value ?? ""), label: option.props.children, disabled: option.props.disabled,
    }));
    const label = children.props["aria-label"] || items.find(item => item.id === String(value))?.label || items[0]?.label;
    return h(ChoiceMenu, { id, label, value: String(value ?? ""), disabled, items,
      onChange: value => onChange({ target: { value } }),
    });
  }
  function Dialog({ title, children, onClose, closeLabel, className, busy = false, footer, tone }) {
    const [style] = useDshStyle(React);
    const [font] = useDshFont(React);
    const titleId = typeof useId === 'function' ? useId() : 'dsh-email-dialog-title';
    const P = primitives();
    const close = () => { if (!busy) onClose(); };
    return h(P.Modal, { open: true, headless: true, title, onClose: close, backdropBlur: false, dshStyle: style, dshFont: font, className: clsx(ui.dialog, className) },
      h('div', { ref: createOverlaySyncRef(style, font), className: ui.dialogFrame, 'data-dsh-style': style, 'data-dsh-font': font, 'data-window-drag-exclude': '' },
        h('header', { className: ui.dialogHeader }, h('h2', { id: titleId, 'data-tone': tone }, title), h(IconButton, { icon: 'close', label: closeLabel, disabled: busy, onClick: close })),
        h('div', { className: ui.dialogBody, 'aria-busy': busy || undefined }, children),
        footer ? h('footer', { className: ui.dialogFooter }, footer) : null));
  }
  function register(ctx, { id, label, icon, component, order = 50 }) {
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: id, inject: () => ({ workbench: true }) }, component));
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id, order, label }, function WorkbenchIcon({ size }) {
      return h(Icon, { name: icon, size });
    }));
  }
  const SplitResizer = styleKit.createSplitResizerComponent(React);
  const Skeleton = styleKit.createSkeletonComponent(React);
  const useResizableSplit = (options) => styleKit.useResizableSplit(React, options);
  return {
    Button, IconButton, Input, Checkbox, Icon, Page, Tabs, Status, Empty,
    ChoiceMenu, SettingsChoice, Dialog, StyleSwitcher, CoachmarkTour,
    SplitResizer, Skeleton, useResizableSplit, register, primitives,
    styles: DSH_STYLES, styleKey: DSH_STYLE_STORAGE_KEY, styleEvent: DSH_STYLE_EVENT,
    useStyle: () => useDshStyle(React), readStyle: readDshStyle, writeStyle: writeDshStyle, subscribeStyle: subscribeDshStyle,
    fonts: DSH_FONTS, defaultFont: DSH_DEFAULT_FONT, fontKey: DSH_FONT_STORAGE_KEY, fontEvent: DSH_FONT_EVENT,
    useFont: () => useDshFont(React), readFont: readDshFont, writeFont: writeDshFont, subscribeFont: subscribeDshFont,
  };
}

// Editable browser entry. Build with node scripts/build-client.mjs.
window.__ModuleLoader__.load(__stardustUpdatesWrap({ id: "dsh-email", factory: (require) => {
        var module = { exports: {} };
        var exports = module.exports;
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const React = require("react");
        const W = createWorkbenchUI(React, require);
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
      (row.field === 'cc' ? 'Cc: ' : 'To: ') + row.address + ' · ' + (row.blocked ? dt('禁止发送：', 'Blocked: ') + row.value : row.matched ? dt('匹配可信规则', 'Matches a trusted rule') : dt('需要确认', 'Needs confirmation'))))),
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
        field('to', dt('收件人 To', 'Recipients To'), denied.some(row => row.field === 'to')),
        field('cc', dt('抄送 Cc', 'Copy Cc'), denied.some(row => row.field === 'cc')),
        field('subject', dt('主题', 'Subject'))),
      denied.length ? h(W.Status, { tone: 'error' },
        dt('有收件人命中禁止规则，无法发送。请修改草稿或收件人规则。', 'A recipient is blocked. Change the draft or recipient rules before sending.'),
        h('ul', { className: draftCss.recipients }, denied.map(row => h('li', { key: row.field + row.address },
          (row.field === 'to' ? 'To: ' : 'Cc: ') + row.address + ' · ' + row.value)))) : live?.error ? h(W.Status, { tone: 'warn' }, live.error) : null,
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
  const railSplit = W.useResizableSplit({ key: 'dsh-email:rail-width', initial: 224, min: 168, max: 320 });
  const listSplit = W.useResizableSplit({ key: 'dsh-email:list-width', initial: 336, min: 256, max: 520 });

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
      accountsLoading ? h('div', { className: mailCss.skeletonWrap, role: 'status', 'aria-busy': 'true', 'aria-label': dt('正在读取邮箱账号…','Loading accounts…') },
        h(W.Skeleton, { variant: 'card' }),
        h(W.Skeleton, { variant: 'row' }),
        h(W.Skeleton, { variant: 'row' }),
        h(W.Skeleton, { variant: 'row' })) :
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
    h('div', {
      className: mailCss.columns,
      'data-reading': selected !== null,
      style: { '--mail-rail-width': railSplit.size + 'px', '--mail-list-width': listSplit.size + 'px' },
    },
      h(MailFolderRail, { accounts, account, folder, folders, busy, loading: foldersLoading,
        onAccount: changeAccount, onFolder: changeFolder, onManage: () => setFoldersOpen(true) }),
      h(W.SplitResizer, { ...railSplit.resizerProps, label: dt('调整文件夹栏宽度', 'Resize folders pane') }),
      h('section', { className: mailCss.list, 'aria-label': dt('邮件列表', 'Message list'), 'aria-busy': listLoading || undefined },
        h('div', { className: mailCss.listHeader, 'data-tour': 'mail-filter' },
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
            const isSelected = selected === row.uid;
            return h('div', { key: row.uid, className: mailCss.messageRow, 'data-dsh-row': '', 'data-selected': isSelected, 'data-active': isSelected ? 'true' : 'false', 'data-unread': unseen },
              canTrash ? h(W.Checkbox, { hiddenLabel: true, label: dt('选择邮件：', 'Select message: ') + subject,
                checked: checked.includes(row.uid), disabled: busy || listLoading,
                onChange: value => setChecked(old => value ? [...old, row.uid] : old.filter(uid => uid !== row.uid)) }) : null,
              h('span', { className: 'dsh-pixel-cursor', 'aria-hidden': 'true' }, '▶'),
              h(W.Button, { variant: 'ghost', className: mailCss.messageButton, disabled: busy, 'aria-pressed': isSelected,
                onClick: event => openMessage(row.uid, event.currentTarget) },
                h('span', { className: mailCss.messageLine },
                  unseen ? h('span', { className: mailCss.unreadDot, role: 'img', 'aria-label': dt('未读','Unread') }) : null,
                  h('strong', { className: mailCss.sender, title: from }, row.from?.[0]?.name || from),
                  row.flagged ? h(W.Icon, { name: 'star', size: 13 }) : null,
                  h('time', { className: mailCss.timestamp, dateTime: row.date }, formatDate(row.date))),
                h('span', { className: mailCss.messageLine }, h('span', { className: mailCss.subject, title: subject }, subject),
                  row.hasAttachments ? h(W.Icon, { name: 'clip', size: 13, role: 'img', 'aria-hidden': undefined, 'aria-label': dt('附件', 'Attachments') }) : null)),
              h('div', { className: clsx('dsh-row-actions', mailCss.rowActions) },
                row.flagsSupported !== false ? h(React.Fragment, null,
                  h(W.IconButton, {
                    icon: 'mail',
                    disabled: busy,
                    label: row.seen ? dt('标记未读', 'Mark unread') : dt('标记已读', 'Mark read'),
                    onClick: () => run(async valid => {
                      await mailboxApi('mark', { account, folder, uid: row.uid, mark: row.seen ? 'unread' : 'read' });
                      if (valid()) setResult(old => old && { ...old, messages: old.messages.map(m => m.uid === row.uid ? { ...m, seen: !row.seen } : m) });
                    }),
                  }),
                  h(W.IconButton, {
                    icon: 'star',
                    disabled: busy,
                    'aria-pressed': !!row.flagged,
                    label: row.flagged ? dt('取消星标', 'Unstar') : dt('添加星标', 'Star'),
                    onClick: () => run(async valid => {
                      await mailboxApi('mark', { account, folder, uid: row.uid, mark: row.flagged ? 'unstar' : 'star' });
                      if (valid()) setResult(old => old && { ...old, messages: old.messages.map(m => m.uid === row.uid ? { ...m, flagged: !row.flagged } : m) });
                    }),
                  })) : null,
                h(W.IconButton, {
                  icon: 'reply',
                  disabled: busy,
                  label: dt('回复到草稿', 'Reply in drafts'),
                  onClick: () => run(async valid => {
                    const draft = await mailboxApi('replyDraft', { account, folder, uid: row.uid, replyAll: false });
                    if (valid()) onDraft(draft.id);
                  }),
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
      h(W.SplitResizer, { ...listSplit.resizerProps, label: dt('调整邮件列表宽度', 'Resize message list pane') }),
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
            onMark: value => setResult(old => old && { ...old, messages: old.messages.map(row => row.uid === selected ? {
              ...row, ...(value === 'read' || value === 'unread' ? { seen: value === 'read' } : { flagged: value === 'star' }),
            } : row) }),
          }) : h(W.Empty, { title: dt('选择一封邮件','Select a message') }, dt('打开正文后，可以回复到草稿、标记状态或下载附件。','Open a message to reply in drafts, mark its state or download attachments.')))),
    trash ? h(MailTrashDialog, { account, folder, uids: trash, uidValidity: result?.uidValidity, folders, busy, onClose: () => setTrash(null), onConfirm: confirmTrash }) : null,
    foldersOpen ? h(MailFoldersDialog, { account, folders, busy, onClose: () => setFoldersOpen(false), onChanged: () => setFolderReload(n => n + 1) }) : null);
}

        const { useState, useEffect, useCallback, useRef } = React;
        const h = React.createElement;
        // Harness supplies document.baseURI for reverse-proxy mounts and in-page navigation.
        const ROUTE = "api/dsh-email/settings";
        function translateError(message) {
            const common = {
                es: ['La cuenta seleccionada no está configurada o no ha iniciado sesión. Revisa la configuración de la cuenta.', 'No se pudo guardar de forma segura la credencial OAuth2. No se escribió ningún token en texto sin cifrar.', 'No se pudo leer el archivo de inicio de sesión OAuth2. Comprueba los permisos; el archivo original no se modificó.', 'El resultado del envío no está claro. Comprueba el buzón antes de volver a enviar para evitar duplicados.', 'La operación de correo ha fallado. Revisa la cuenta y los registros de DSH.'],
                fr: ['Le compte sélectionné n’est pas configuré ou connecté. Vérifiez ses paramètres.', 'Impossible d’enregistrer les identifiants OAuth2 en toute sécurité. Aucun jeton en clair n’a été écrit.', 'Impossible de lire le fichier de connexion OAuth2. Vérifiez les droits ; le fichier original n’a pas été modifié.', 'Le résultat de l’envoi est incertain. Vérifiez la boîte aux lettres avant de réessayer afin d’éviter les doublons.', 'L’opération de messagerie a échoué. Vérifiez le compte et les journaux DSH.'],
                de: ['Das ausgewählte Konto ist nicht eingerichtet oder angemeldet. Prüfe die Kontoeinstellungen.', 'OAuth2-Zugangsdaten konnten nicht sicher gespeichert werden. Es wurden keine Klartext-Token geschrieben.', 'Die OAuth2-Anmeldedatei konnte nicht gelesen werden. Prüfe die Zugriffsrechte; die Originaldatei blieb unverändert.', 'Das Ergebnis des Versands ist unklar. Prüfe das Postfach vor einem erneuten Versuch, um Duplikate zu vermeiden.', 'Der E-Mail-Vorgang ist fehlgeschlagen. Prüfe Kontoeinstellungen und DSH-Protokolle.'],
                ja: ['選択したアカウントが未設定または未ログインです。アカウント設定を確認してください。', 'OAuth2 認証情報を安全に保存できませんでした。平文トークンは書き込まれていません。', 'OAuth2 ログインファイルを読み取れません。アクセス権を確認してください。元のファイルは変更されていません。', '送信結果が不明です。重複を避けるため、再送信前にメールボックスを確認してください。', 'メール操作に失敗しました。アカウント設定と DSH ログを確認してください。'],
                pt: ['A conta selecionada não está configurada ou conectada. Verifique as configurações da conta.', 'Não foi possível salvar as credenciais OAuth2 com segurança. Nenhum token em texto simples foi gravado.', 'Não foi possível ler o arquivo de login OAuth2. Verifique as permissões; o arquivo original não foi alterado.', 'O resultado do envio é incerto. Verifique a caixa de correio antes de tentar novamente para evitar duplicatas.', 'A operação de e-mail falhou. Verifique a conta e os registros do DSH.'],
                ru: ['Выбранный аккаунт не настроен или не авторизован. Проверьте настройки аккаунта.', 'Не удалось безопасно сохранить данные OAuth2. Токены в открытом виде не записывались.', 'Не удалось прочитать файл входа OAuth2. Проверьте права доступа; исходный файл не изменён.', 'Результат отправки неизвестен. Проверьте почту перед повторной отправкой, чтобы избежать дубликатов.', 'Не удалось выполнить почтовую операцию. Проверьте настройки аккаунта и журналы DSH.'],
            }[uiLanguage()];
            if (!common) return message;
            if (/未写入明文令牌/.test(message)) return common[1];
            if (/无法读取 OAuth2 登录数据/.test(message)) return common[2];
            if (/结果.*未|不要.*重发|不要.*发送|本地保存失败|回执未能保存/.test(message)) return common[3];
            if (/账号|配置不完整|尚未登录|OAuth|设备码/.test(message)) return common[0];
            if (/邮件操作失败|邮箱操作失败/.test(message)) return common[4];
            return message;
        }
        function emailError(error) {
            const message = typeof error === 'string' ? error : error?.message || String(error || '');
            if(message.includes(' / ') && /[\u3400-\u9fff]/.test(message)){const split=message.indexOf(' / ');return uiLanguage()==='zh'?message.slice(0,split):message.slice(split+3);}
            if (/^(?:图片或附件|公网图片或附件|当前网络使用虚拟地址|无法解析图片或附件|下载大小上限)/.test(message) && message.includes(' / ')) {
                const split = message.indexOf(' / ');
                return uiLanguage() === 'zh' ? message.slice(0, split) : message.slice(split + 3);
            }
            if (uiLanguage() !== 'en')
                return translateError(message);
            if (error?.status === 401)
                return 'Your DSH session expired. Reopen DSH and try again.';
            if (!/[\u3400-\u9fff]/.test(message))
                return message;
            if (/未写入明文令牌/.test(message))
                return 'Windows credential encryption is unavailable. Check system PowerShell / DPAPI and retry. No plaintext tokens were written.';
            if (/无法读取或解锁 OAuth2 登录数据/.test(message))
                return 'The OAuth login file could not be read or unlocked. Windows encrypted files require the original Windows user. Preserve and move aside oauth2-tokens.json before signing in again on a new device or recovering damaged data. The original file was not overwritten.';
            if (/无法读取 OAuth2 登录数据/.test(message))
                return 'The OAuth login file could not be read. Check file access permissions; the original file was not overwritten.';
            if (/OAuth2 登录数据过大/.test(message))
                return 'The OAuth login data exceeds the storage limit. The original file was not overwritten.';
            if (/结果.*未|不要.*重发|不要.*发送|本地保存失败|回执未能保存/.test(message))
                return 'The send outcome is uncertain or its receipt could not be saved. Check the mailbox before sending again to avoid duplicate delivery.';
            if (/已提交|不能再次发送/.test(message))
                return 'This draft was submitted or its outcome is uncertain. Check the mailbox before copying it to a new draft.';
            if (/预览已过期|draft-preview-expired/.test(message + ' ' + (error?.code || '')))
                return 'The send review expired or was already used. Review the current draft again.';
            if (/改变|已更新|冲突|重新加载/.test(message))
                return 'The draft, account or rules changed. Reload the latest version and review your input before retrying.';
            if (/请先填写并保存邮件主题/.test(message))
                return 'Fill in and save the email subject first.';
            if (/附件/.test(message))
                return 'Check the attachments and the selected sender’s limit. Save first, use at most 10 files, and remove unreadable or oversized files.';
            if (/AgentMail/.test(message)) {
                const status = message.match(/HTTP \d+/)?.[0];
                return 'AgentMail request failed' + (status ? ' (' + status + ')' : '') + '. Check the API region, key, inbox and service status. For sending, check Sent before trying again.';
            }
            if (/账号|配置不完整|尚未登录|OAuth|设备码/.test(message))
                return 'Check the selected email account. Complete its credentials or OAuth sign-in in Account settings, then test the connection.';
            if (/收件人|邮箱地址/.test(message))
                return 'Check the recipient addresses and trusted-recipient rules before reviewing the draft again.';
            return 'The email operation failed. Check the account settings and DSH logs, then retry. For a send operation, check the mailbox before retrying.';
        }
        /** 「编辑即保存」的防抖窗口：连续打字只落一次盘。 */
        const SAVE_DEBOUNCE_MS = 800;
        async function api(action, payload, signal) {
            const init = action === undefined
                ? { credentials: "same-origin", headers: { "x-dsh-email-settings": "1" } }
                : {
                    credentials: "same-origin",
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-dsh-email-settings": "1" },
                    body: JSON.stringify(Object.assign({ action }, payload)),
                };
            const res = await fetch(ROUTE, { ...init, signal });
            const body = await res.json();
            if (!res.ok || !body.ok) {
                const error = new Error((body && body.error && body.error.message) || ("request failed " + res.status));
                // Callers branch on these: a revision conflict is retryable after a rebase,
                // anything else is not, and the message alone cannot tell them apart.
                error.code = body && body.error ? body.error.code : undefined;
                error.status = res.status;
                error.message = emailError(error);
                throw error;
            }
            return body.value;
        }
        /**
         * 登录失败的文案：平铺的 message 优先，退回 error.message，再退回调用方给的兜底。
         */
        function oauthErrorMessage(body, fallback) {
            if (body && typeof body.message === "string" && body.message !== "")
                return emailError(body.message);
            if (body && body.error && typeof body.error.message === "string" && body.error.message !== "")
                return emailError(body.error);
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
                headers: { "Content-Type": "application/json", "x-dsh-email-settings": "1" },
                body: JSON.stringify(Object.assign({ action }, payload)),
            });
            const body = await res.json();
            if (body === null || typeof body !== "object")
                return { ok: false, message: t("oauth.badResponse") };
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
            if (draft === null || draft === undefined)
                return null;
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
            ["exmail", "provider.exmail"],
            ["163", "provider.163"],
            ["126", "provider.126"],
            ["sina", "provider.sina"],
            ["aliyun", "provider.aliyun"],
            ["gmail", "provider.gmail"],
            ["outlook", "provider.outlook"],
            ["icloud", "provider.icloud"],
        ];
        /**
         * 「自定义服务器」在服务商下拉里的哨兵值。这种账号在 YAML 里不写 provider，而是把
         * host/port/secure 直接写在账号自己的 imap/smtp 段里 —— 后端 resolveAccount() 原生
         * 支持这种账号（它的错误信息一直写着「或省略 provider 直接填 imap.host 与
         * smtp.host」），这里只是给这种账号一个可以点选的下拉项。
         * 双下划线包起来，避免和 serverPresets 里的预设名撞车（预设编辑器会拒绝同名）。
         */
        const CUSTOM_SERVER_PROVIDER = "__custom__";
        const EMPTY = {
            provider: "",
            user: "",
            password: "",
            inboxFolder: "INBOX",
            sendApproval: true,
            allowTrustedReply: false,
            replyLocale: "auto",
            uiLocale: "auto",
            replyTimeZone: "",
            newMailPopup: true,
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
                "section.intro": "添加邮箱后，就可以让助手帮你查收、搜索和回复邮件。选择服务商并填写邮箱地址与授权码，修改会自动保存。",
                "section.readonly": "当前配置为只读，可以查看，但无法保存修改。",
                "section.activeAccounts": "当前生效账号：{accounts}",
                // 内置服务商名（PROVIDERS 里存的就是这些 key）
                "provider.qq": "QQ 邮箱",
                "provider.163": "163 邮箱",
                "provider.126": "126 邮箱",
                "provider.sina": "新浪邮箱",
                "provider.aliyun": "阿里邮箱",
                "provider.gmail": "Gmail",
                "provider.exmail": "腾讯企业邮箱 / 企业微信邮箱",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "自定义",
                "provider.noneInYaml": "请选择邮箱服务商",
                "provider.undefinedPresetSuffix": "（未定义预设）",
                // 全局设置
                "global.sendApproval": "模型发信前确认（建议保留；可信规则可按账号跳过）",
                "global.sendApprovalRisk": "关闭后，所有账号的模型发信、回复和转发将不再逐次询问，未列入可信名单的收件人也可能直接收到邮件。禁止收件人规则和宿主权限继续生效；草稿页仍需手动确认发送。",
                "global.downloadDirLabel": "附件下载目录（默认保存在当前工作区）",
                "global.downloadDirPlaceholder": "留空使用默认",
                "global.attachmentLimit": "附件大小上限",
                "global.attachmentCustom": "自定义（MiB）",
                "global.attachmentHint": "默认 20 MiB。每封草稿按原始附件合计，最多 40 MiB，AgentMail 最多 4 MiB。邮箱服务器可能另有整封邮件大小限制。",
                "global.attachmentRange": "请输入 1 KiB（0.0009765625 MiB）至 512 MiB 之间的值。",
                "draft.attachmentCount": "每份草稿最多添加 10 个附件。",
                "draft.attachmentTotal": "草稿附件总大小最多 {size}。",
                "global.hint": "以上设置对所有账号统一生效。需要插件确认的工具发信在 Full Access 下不会弹框；可改用草稿页手动核对并确认。禁止收件人规则始终生效。",
                // 自动保存状态条
                "status.saved": "已保存",
                "status.saving": "保存中…",
                "status.draft": "还有未保存的内容，请补全下方标记的字段。",
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
                "card.testMissingAddress": "请先填写这个账号的邮箱地址，再测试连接。",
                "card.pickDefault": "配置了多个账号，请设置默认账号：",
                "card.errNoName": "有账号还没填账号名，这份改动先不保存。",
                "card.errNoProvider": "有账号还没选服务商，这份改动先不保存。",
                "card.errDuplicateName": "已经有同名账号了，改名会覆盖掉它，这份改动先不保存。",
                "card.errReservedName": "账号名不能是 defaultAccount（该键保留给默认账号），这份改动先不保存。",
                "card.errNoDefault": "有多个账号还没指定默认账号，这份改动先不保存。",
                "card.yamlParseFailed": "accountsYaml 解析失败：{error}",
                "card.confirmDelete": "删除账号「{name}」会同时移除已保存的登录信息，不会删除邮箱里的邮件。",
                "card.nameLabel": "账号名称",
                "card.nameHint": "用来区分多个邮箱，例如「工作邮箱」。修改名称会保留原有设置；名称不能为 defaultAccount。",
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
                "card.passwordHint": "请填写邮箱服务商提供的授权码或应用专用密码，然后点击「测试连接」。",
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
                "provider.customServer": "自定义服务器（手动填写）",
                "card.customServerHint": "内网或自建邮件服务器：填收信服务器地址即可；发信服务器留空时沿用收信服务器。端口留空按默认值处理（IMAP 993 / SMTP 465）。",
                "card.imapServerLabel": "IMAP 收信服务器",
                "card.smtpServerLabel": "SMTP 发信服务器（留空沿用收信服务器）",
                "card.portLabel": "端口",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "自定义服务器账号还没填收信服务器地址，这份改动先不保存。",
                "preset.errReservedName": "预设名不能是「{name}」：这个值保留给「自定义服务器」下拉项，请换一个名字。",
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
                "whale.summon": "信使",
                "whale.pat": "摸摸头",
                "whale.check": "查收新信",
                "whale.checking": "正在查信…",
                "whale.open": "打开邮箱",
                "whale.summonedTitle": "鲸鱼娘随时待命 ♪",
                "whale.idleSubtitle": "点击头像摸摸头，或随时点下方按钮查收新邮件。",
                "whale.checkEmpty": "暂无新邮件，信箱一切正常 ♪",
                "whale.checkFound": "刚刚发现 {count} 封新邮件！",
                "whale.checkError": "暂时没连上邮箱：{message}",
                "whale.checkNoAccount": "还没有配置邮箱账号，先去「邮箱账号」页设置吧。",
                "whale.patCount": "摸头 ×{count}",
                "whale.imageAlt": "鲸鱼娘信使（点击摸摸头）",
                "whale.pat1": "呜哇～好温暖！谢谢主人的摸摸头 ♪",
                "whale.pat2": "海风带来新信件啦，请查收！",
                "whale.pat3": "今天也在认真守望你的收件箱哦～",
                "whale.pat4": "诶嘿嘿，尾巴都要摇起来了 ✨",
                "whale.pat5": "有重要的邮件时，我会第一时间飞奔过来的！",
                "whale.pat6": "要来一杯热茶，再一起整理邮件吗？",
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
                "section.intro": "Add a mailbox so your assistant can read, search and reply to mail. Choose a provider and enter your email address and app password. Changes save automatically.",
                "section.readonly": "The settings store is read-only right now: you can view the settings but not save them.",
                "section.activeAccounts": "Active accounts: {accounts}",
                // 内置服务商名（PROVIDERS 里存的就是这些 key）
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Custom",
                "provider.noneInYaml": "Choose your email provider",
                "provider.undefinedPresetSuffix": "(undefined preset)",
                // 全局设置
                "global.sendApproval": "Confirm model-initiated sends (recommended; saved trust can skip per account)",
                "global.sendApprovalRisk": "With this off, model-initiated sends, replies and forwards skip this plugin's confirmation for every account, including recipients outside the trusted list. Blocked-recipient rules and host permissions still apply. Drafts still require manual send confirmation.",
                "global.downloadDirLabel": "Attachment download directory (defaults to the current workspace)",
                "global.downloadDirPlaceholder": "Leave empty for the default",
                "global.attachmentLimit": "Attachment size limit",
                "global.attachmentCustom": "Custom (MiB)",
                "global.attachmentHint": "Defaults to 20 MiB. Drafts allow up to 40 MiB of original attachments in total, or 4 MiB for AgentMail. Mail servers may also limit the encoded message size.",
                "global.attachmentRange": "Enter a value from 1 KiB (0.0009765625 MiB) to 512 MiB.",
                "draft.attachmentCount": "A draft can have up to 10 attachments.",
                "draft.attachmentTotal": "Total draft attachments may not exceed {size}.",
                "global.hint": "These settings apply to every account. Tool sends that still require plugin confirmation cannot show a dialog under Full Access; use the Drafts tab to review and confirm manually. Blocked-recipient rules always apply.",
                // 自动保存状态条
                "status.saved": "Saved",
                "status.saving": "Saving…",
                "status.draft": "Some edits are not saved yet. Complete the highlighted fields below.",
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
                "card.testMissingAddress": "Enter this account's email address before testing the connection.",
                "card.pickDefault": "Several accounts are configured; choose the default account:",
                "card.errNoName": "An account has no name yet; this change will not be saved.",
                "card.errNoProvider": "An account has no provider selected; this change will not be saved.",
                "card.errDuplicateName": "Another account already has that name; renaming would overwrite it, so this change will not be saved.",
                "card.errReservedName": "An account cannot be named defaultAccount (that key is reserved for the default account); this change will not be saved.",
                "card.errNoDefault": "Several accounts exist but no default account was chosen; this change will not be saved.",
                "card.yamlParseFailed": "accountsYaml failed to parse: {error}",
                "card.confirmDelete": "Deleting account “{name}” also removes its saved login details. Messages in the mailbox are not deleted.",
                "card.nameLabel": "Account name",
                "card.nameHint": "Use a name such as “Work” to distinguish your mailboxes. Renaming keeps the existing settings; defaultAccount is reserved.",
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
                "card.passwordHint": "Enter the authorization code or app password from your email provider, then click “Test connection”.",
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
                "card.autoSaveHint": " Changes save automatically.",
                "card.autoSaveHintNoDefault": " There are several accounts but no default account yet; you must pick one first.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Custom server (enter details)",
                "card.customServerHint": "For an intranet or self-hosted mail server: enter the incoming server. The outgoing server follows it when left blank. Empty ports fall back to the defaults (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "IMAP incoming server",
                "card.smtpServerLabel": "SMTP outgoing server (blank = incoming server)",
                "card.portLabel": "Port",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "A custom-server account has no incoming server yet, so this change is not saved.",
                "preset.errReservedName": "A preset cannot be named “{name}”: that value is reserved for the custom-server option. Pick another name.",
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
                "whale.summon": "Courier",
                "whale.pat": "Pat",
                "whale.check": "Check mail",
                "whale.checking": "Checking…",
                "whale.open": "Open mailbox",
                "whale.summonedTitle": "Whale courier at your service ♪",
                "whale.idleSubtitle": "Click to pat her head, or check for new mail anytime.",
                "whale.checkEmpty": "No new mail — inbox is all clear ♪",
                "whale.checkFound": "Found {count} new message(s)!",
                "whale.checkError": "Couldn't check mail: {message}",
                "whale.checkNoAccount": "No mailbox configured yet — set one up in Accounts.",
                "whale.patCount": "Pats ×{count}",
                "whale.imageAlt": "Whale-girl courier (click to pat)",
                "whale.pat1": "Whoa~ so warm! Thank you for the headpat ♪",
                "whale.pat2": "Fresh mail carried in on the ocean breeze!",
                "whale.pat3": "Keeping close watch on your inbox today too~",
                "whale.pat4": "Hehe, my tail is practically wagging ✨",
                "whale.pat5": "Whenever important mail arrives, I'll dash right over!",
                "whale.pat6": "Care for warm tea while we sort your inbox together?",
            },
        };
        // Supported host locales receive a complete table. Overrides keep the most
        // visible controls native; newly added keys remain readable in English.
        const UI_LOCALE_OVERRIDES = {
            es: {
                "common.cancel": "Cancelar", "common.retry": "Reintentar", "common.delete": "Eliminar", "common.edit": "Editar", "common.collapse": "Contraer", "common.loading": "Cargando…",
                "nav.title": "Correo (dsh-email)", "section.title": "Correo", "section.intro": "Añade un buzón para que tu asistente pueda leer, buscar y responder correos. Elige un proveedor e introduce tu dirección y contraseña de aplicación. Los cambios se guardan automáticamente.",
                "global.sendApproval": "Confirmar envíos iniciados por el modelo", "global.downloadDirLabel": "Directorio de descargas de adjuntos", "status.saved": "Guardado", "status.saving": "Guardando…", "status.draft": "Hay cambios sin guardar.", "status.saveFailed": "No se pudo guardar: {message}",
                "card.add": "+ Añadir cuenta", "card.empty": "Todavía no hay cuentas.", "card.defaultBadge": "Predeterminada", "card.defaultAccount": "Cuenta predeterminada", "card.setDefault": "Establecer como predeterminada", "card.incomplete": "Incompleta", "card.notLoggedIn": "No has iniciado sesión", "card.loggedInAs": "Sesión iniciada como {user}", "card.testConnect": "Probar conexión", "card.testing": "Probando…", "card.testOk": "Conectado ({ms} ms) · {host}:{port}", "card.testFailed": "Error de conexión: {message}", "card.providerLabel": "Proveedor", "card.addressLabel": "Dirección de correo", "card.passwordLabel": "Código de autorización / contraseña de aplicación", "card.passwordPlaceholder": "Déjalo vacío para conservarlo",
                "oauth.signIn.outlook": "Iniciar sesión con Microsoft", "oauth.signIn.generic": "Iniciar sesión en {provider}", "oauth.requestingCode": "Solicitando código…", "oauth.signingIn": "Iniciando sesión…", "oauth.reLogin": "Iniciar sesión de nuevo", "oauth.pendingHint": "Abre la dirección en el navegador e introduce el código:", "oauth.loggedInAs": "Sesión iniciada: {user}", "oauth.loginOk": "Sesión iniciada.", "oauth.loginFailed": "Error al iniciar sesión",
                "preset.sectionTitle": "Preajustes de servidor", "preset.add": "+ Añadir preajuste", "preset.empty": "Todavía no hay preajustes personalizados.", "preset.nameLabel": "Nombre del preajuste", "preset.imapHostLabel": "Servidor IMAP", "preset.imapPortLabel": "Puerto IMAP", "preset.smtpHostLabel": "Servidor SMTP", "preset.smtpPortLabel": "Puerto SMTP", "preset.imapSsl": "SSL de IMAP", "preset.smtpSsl": "SSL de SMTP", "preset.yamlParseFailed": "No se pudo analizar serverPresets: {error}",
                "whale.title": "Mensajero: {count} mensajes nuevos", "whale.unknownSender": "(desconocido)", "whale.noSubject": "(sin asunto)", "whale.close": "Cerrar",
                "whale.summon": "Mensajera", "whale.pat": "Acariciar", "whale.check": "Buscar correo", "whale.checking": "Comprobando…", "whale.open": "Abrir buzón",
                "whale.summonedTitle": "Mensajera lista para ayudar ♪", "whale.idleSubtitle": "Haz clic en ella para acariciarla o busca correo nuevo.",
                "whale.checkEmpty": "No hay correo nuevo — todo al día ♪", "whale.checkFound": "¡Se encontraron {count} mensaje(s) nuevos!",
                "whale.checkError": "No se pudo comprobar el correo: {message}", "whale.checkNoAccount": "Configura primero una cuenta en Cuentas.",
                "whale.patCount": "Caricias ×{count}", "whale.imageAlt": "Mensajera ballena (clic para acariciar)",
                "whale.pat1": "¡Qué cálido! Gracias por la caricia ♪", "whale.pat2": "¡La brisa marina trae cartas nuevas!",
                "whale.pat3": "Vigilando tu bandeja de entrada hoy también~", "whale.pat4": "Jeje, mi cola casi no deja de moverse ✨",
                "whale.pat5": "Si llega algo importante, vendré corriendo!", "whale.pat6": "¿Tomamos un té caliente mientras ordenamos el buzón?",
            },
            fr: {
                "common.cancel": "Annuler", "common.retry": "Réessayer", "common.delete": "Supprimer", "common.edit": "Modifier", "common.collapse": "Réduire", "common.loading": "Chargement…",
                "nav.title": "E-mail (dsh-email)", "section.title": "E-mail", "section.intro": "Ajoutez une boîte aux lettres pour que votre assistant puisse lire, rechercher et répondre aux messages. Choisissez un fournisseur et saisissez votre adresse ainsi que votre mot de passe d’application. Les changements sont enregistrés automatiquement.",
                "global.sendApproval": "Confirmer les envois lancés par le modèle", "global.downloadDirLabel": "Dossier de téléchargement des pièces jointes", "status.saved": "Enregistré", "status.saving": "Enregistrement…", "status.draft": "Certains changements ne sont pas enregistrés.", "status.saveFailed": "Échec de l’enregistrement : {message}",
                "card.add": "+ Ajouter un compte", "card.empty": "Aucun compte pour le moment.", "card.defaultBadge": "Par défaut", "card.defaultAccount": "Compte par défaut", "card.setDefault": "Définir par défaut", "card.incomplete": "Incomplet", "card.notLoggedIn": "Non connecté", "card.loggedInAs": "Connecté en tant que {user}", "card.testConnect": "Tester la connexion", "card.testing": "Test en cours…", "card.testOk": "Connecté ({ms} ms) · {host}:{port}", "card.testFailed": "Échec de la connexion : {message}", "card.providerLabel": "Fournisseur", "card.addressLabel": "Adresse e-mail", "card.passwordLabel": "Code d’autorisation / mot de passe d’application", "card.passwordPlaceholder": "Laisser vide pour conserver",
                "oauth.signIn.outlook": "Se connecter avec Microsoft", "oauth.signIn.generic": "Se connecter à {provider}", "oauth.requestingCode": "Demande de code…", "oauth.signingIn": "Connexion…", "oauth.reLogin": "Se reconnecter", "oauth.pendingHint": "Ouvrez l’adresse dans votre navigateur et saisissez le code :", "oauth.loggedInAs": "Connecté : {user}", "oauth.loginOk": "Connecté.", "oauth.loginFailed": "Échec de la connexion",
                "preset.sectionTitle": "Préréglages serveur", "preset.add": "+ Ajouter un préréglage", "preset.empty": "Aucun préréglage personnalisé.", "preset.nameLabel": "Nom du préréglage", "preset.imapHostLabel": "Serveur IMAP", "preset.imapPortLabel": "Port IMAP", "preset.smtpHostLabel": "Serveur SMTP", "preset.smtpPortLabel": "Port SMTP", "preset.imapSsl": "SSL IMAP", "preset.smtpSsl": "SSL SMTP", "preset.yamlParseFailed": "Échec de l’analyse de serverPresets : {error}",
                "whale.title": "Courrier : {count} nouveaux messages", "whale.unknownSender": "(inconnu)", "whale.noSubject": "(sans objet)", "whale.close": "Fermer",
                "whale.summon": "Messagère", "whale.pat": "Caresser", "whale.check": "Vérifier", "whale.checking": "Vérification…", "whale.open": "Ouvrir la boîte",
                "whale.summonedTitle": "Messagère prête à vous aider ♪", "whale.idleSubtitle": "Cliquez pour la caresser ou vérifiez les nouveaux messages.",
                "whale.checkEmpty": "Aucun nouveau message — tout est calme ♪", "whale.checkFound": "{count} nouveau(x) message(s) trouvé(s) !",
                "whale.checkError": "Impossible de vérifier : {message}", "whale.checkNoAccount": "Configurez d’abord un compte dans Comptes.",
                "whale.patCount": "Caresses ×{count}", "whale.imageAlt": "Messagère baleine (cliquer pour caresser)",
                "whale.pat1": "Oh~ c’est tout doux ! Merci pour la caresse ♪", "whale.pat2": "La brise marine apporte du courrier frais !",
                "whale.pat3": "Je veille attentivement sur votre boîte aujourd’hui~", "whale.pat4": "Héhé, ma queue remue toute seule ✨",
                "whale.pat5": "Dès qu’un message important arrive, j’accours !", "whale.pat6": "Un thé chaud pendant qu’on trie les messages ?",
            },
            de: {
                "common.cancel": "Abbrechen", "common.retry": "Erneut versuchen", "common.delete": "Löschen", "common.edit": "Bearbeiten", "common.collapse": "Einklappen", "common.loading": "Wird geladen…",
                "nav.title": "E-Mail (dsh-email)", "section.title": "E-Mail", "section.intro": "Füge ein Postfach hinzu, damit dein Assistent E-Mails lesen, suchen und beantworten kann. Wähle einen Anbieter und gib deine E-Mail-Adresse sowie das App-Passwort ein. Änderungen werden automatisch gespeichert.",
                "global.sendApproval": "Vom Modell gestartete Sendungen bestätigen", "global.downloadDirLabel": "Downloadordner für Anhänge", "status.saved": "Gespeichert", "status.saving": "Wird gespeichert…", "status.draft": "Einige Änderungen sind noch nicht gespeichert.", "status.saveFailed": "Speichern fehlgeschlagen: {message}",
                "card.add": "+ Konto hinzufügen", "card.empty": "Noch keine Konten vorhanden.", "card.defaultBadge": "Standard", "card.defaultAccount": "Standardkonto", "card.setDefault": "Als Standard festlegen", "card.incomplete": "Unvollständig", "card.notLoggedIn": "Nicht angemeldet", "card.loggedInAs": "Angemeldet als {user}", "card.testConnect": "Verbindung testen", "card.testing": "Wird getestet…", "card.testOk": "Verbunden ({ms} ms) · {host}:{port}", "card.testFailed": "Verbindung fehlgeschlagen: {message}", "card.providerLabel": "Anbieter", "card.addressLabel": "E-Mail-Adresse", "card.passwordLabel": "Autorisierungscode / App-Passwort", "card.passwordPlaceholder": "Leer lassen, um es zu behalten",
                "oauth.signIn.outlook": "Mit Microsoft anmelden", "oauth.signIn.generic": "Bei {provider} anmelden", "oauth.requestingCode": "Code wird angefordert…", "oauth.signingIn": "Anmeldung…", "oauth.reLogin": "Erneut anmelden", "oauth.pendingHint": "Öffne die Adresse im Browser und gib den Code ein:", "oauth.loggedInAs": "Angemeldet: {user}", "oauth.loginOk": "Angemeldet.", "oauth.loginFailed": "Anmeldung fehlgeschlagen",
                "preset.sectionTitle": "Servervoreinstellungen", "preset.add": "+ Voreinstellung hinzufügen", "preset.empty": "Noch keine benutzerdefinierten Servervoreinstellungen.", "preset.nameLabel": "Name der Voreinstellung", "preset.imapHostLabel": "IMAP-Server", "preset.imapPortLabel": "IMAP-Port", "preset.smtpHostLabel": "SMTP-Server", "preset.smtpPortLabel": "SMTP-Port", "preset.imapSsl": "IMAP-SSL", "preset.smtpSsl": "SMTP-SSL", "preset.yamlParseFailed": "serverPresets konnte nicht gelesen werden: {error}",
                "whale.title": "Briefdienst: {count} neue Nachrichten", "whale.unknownSender": "(unbekannt)", "whale.noSubject": "(kein Betreff)", "whale.close": "Schließen",
                "whale.summon": "Botin", "whale.pat": "Streicheln", "whale.check": "Prüfen", "whale.checking": "Prüfe…", "whale.open": "Postfach öffnen",
                "whale.summonedTitle": "Wal-Botin jederzeit bereit ♪", "whale.idleSubtitle": "Klicke zum Streicheln oder prüfe jederzeit auf neue Mails.",
                "whale.checkEmpty": "Keine neuen Nachrichten — alles ruhig ♪", "whale.checkFound": "{count} neue Nachricht(en) gefunden!",
                "whale.checkError": "Prüfung fehlgeschlagen: {message}", "whale.checkNoAccount": "Bitte zuerst unter Konten ein Postfach einrichten.",
                "whale.patCount": "Streichler ×{count}", "whale.imageAlt": "Wal-Botin (klicken zum Streicheln)",
                "whale.pat1": "Oh~ wie schön warm! Danke fürs Streicheln ♪", "whale.pat2": "Frische Post mit der Meeresbrise!",
                "whale.pat3": "Ich passe heute auch gut auf dein Postfach auf~", "whale.pat4": "Hihi, meine Flosse wedelt schon ✨",
                "whale.pat5": "Bei wichtigen Mails sause ich sofort herbei!", "whale.pat6": "Eine Tasse Tee, während wir die Mails sortieren?",
            },
            ja: {
                "common.cancel": "キャンセル", "common.retry": "再試行", "common.delete": "削除", "common.edit": "編集", "common.collapse": "折りたたむ", "common.loading": "読み込み中…",
                "nav.title": "メール (dsh-email)", "section.title": "メール", "section.intro": "メールボックスを追加すると、アシスタントがメールの読み取り、検索、返信を行えます。プロバイダーを選び、メールアドレスとアプリパスワードを入力してください。変更は自動保存されます。",
                "global.sendApproval": "モデルによる送信を確認する", "global.downloadDirLabel": "添付ファイルのダウンロード先", "status.saved": "保存済み", "status.saving": "保存中…", "status.draft": "未保存の変更があります。", "status.saveFailed": "保存に失敗しました: {message}",
                "card.add": "+ アカウントを追加", "card.empty": "アカウントはまだありません。", "card.defaultBadge": "既定", "card.defaultAccount": "既定のアカウント", "card.setDefault": "既定に設定", "card.incomplete": "未完了", "card.notLoggedIn": "未ログイン", "card.loggedInAs": "{user} としてログイン中", "card.testConnect": "接続をテスト", "card.testing": "テスト中…", "card.testOk": "接続済み ({ms} ms) · {host}:{port}", "card.testFailed": "接続に失敗しました: {message}", "card.providerLabel": "プロバイダー", "card.addressLabel": "メールアドレス", "card.passwordLabel": "認証コード / アプリパスワード", "card.passwordPlaceholder": "保持する場合は空欄",
                "oauth.signIn.outlook": "Microsoft でログイン", "oauth.signIn.generic": "{provider} にログイン", "oauth.requestingCode": "コードを取得中…", "oauth.signingIn": "ログイン中…", "oauth.reLogin": "再ログイン", "oauth.pendingHint": "ブラウザーでアドレスを開き、コードを入力してください:", "oauth.loggedInAs": "ログイン済み: {user}", "oauth.loginOk": "ログインしました。", "oauth.loginFailed": "ログインに失敗しました",
                "preset.sectionTitle": "サーバープリセット", "preset.add": "+ プリセットを追加", "preset.empty": "カスタムプリセットはまだありません。", "preset.nameLabel": "プリセット名", "preset.imapHostLabel": "IMAP ホスト", "preset.imapPortLabel": "IMAP ポート", "preset.smtpHostLabel": "SMTP ホスト", "preset.smtpPortLabel": "SMTP ポート", "preset.imapSsl": "IMAP SSL", "preset.smtpSsl": "SMTP SSL", "preset.yamlParseFailed": "serverPresets の解析に失敗しました: {error}",
                "whale.title": "メール便: 新着 {count} 件", "whale.unknownSender": "(不明)", "whale.noSubject": "(件名なし)", "whale.close": "閉じる",
                "whale.summon": "メッセンジャー", "whale.pat": "なでなで", "whale.check": "新着確認", "whale.checking": "確認中…", "whale.open": "受信トレイ",
                "whale.summonedTitle": "くじらちゃん待機中 ♪", "whale.idleSubtitle": "タップしてなでるか、下のボタンで新着メールを確認できます。",
                "whale.checkEmpty": "新着メールはありません ♪", "whale.checkFound": "{count} 件の新着メールが見つかりました！",
                "whale.checkError": "確認に失敗しました：{message}", "whale.checkNoAccount": "まず「アカウント」でメールを設定してください。",
                "whale.patCount": "なでなで ×{count}", "whale.imageAlt": "くじらメッセンジャー（クリックでなでる）",
                "whale.pat1": "わぁ〜あったかい！なでなでありがとう ♪", "whale.pat2": "海風と一緒に新しいお便りが届いたよ！",
                "whale.pat3": "今日も受信トレイをしっかり見守ってるよ〜", "whale.pat4": "えへへ、しっぽまで揺れちゃう ✨",
                "whale.pat5": "大事なメールが来たら、いちばんに駆けつけるね！", "whale.pat6": "温かいお茶でも飲みながらメール整理する？",
            },
            pt: {
                "common.cancel": "Cancelar", "common.retry": "Tentar novamente", "common.delete": "Excluir", "common.edit": "Editar", "common.collapse": "Recolher", "common.loading": "Carregando…",
                "nav.title": "E-mail (dsh-email)", "section.title": "E-mail", "section.intro": "Adicione uma caixa de correio para que o assistente possa ler, pesquisar e responder mensagens. Escolha um provedor e informe seu endereço e senha de aplicativo. As alterações são salvas automaticamente.",
                "global.sendApproval": "Confirmar envios iniciados pelo modelo", "global.downloadDirLabel": "Pasta de download de anexos", "status.saved": "Salvo", "status.saving": "Salvando…", "status.draft": "Há alterações não salvas.", "status.saveFailed": "Falha ao salvar: {message}",
                "card.add": "+ Adicionar conta", "card.empty": "Ainda não há contas.", "card.defaultBadge": "Padrão", "card.defaultAccount": "Conta padrão", "card.setDefault": "Definir como padrão", "card.incomplete": "Incompleta", "card.notLoggedIn": "Não conectado", "card.loggedInAs": "Conectado como {user}", "card.testConnect": "Testar conexão", "card.testing": "Testando…", "card.testOk": "Conectado ({ms} ms) · {host}:{port}", "card.testFailed": "Falha na conexão: {message}", "card.providerLabel": "Provedor", "card.addressLabel": "Endereço de e-mail", "card.passwordLabel": "Código de autorização / senha de aplicativo", "card.passwordPlaceholder": "Deixe vazio para manter",
                "oauth.signIn.outlook": "Entrar com a Microsoft", "oauth.signIn.generic": "Entrar em {provider}", "oauth.requestingCode": "Solicitando código…", "oauth.signingIn": "Entrando…", "oauth.reLogin": "Entrar novamente", "oauth.pendingHint": "Abra o endereço no navegador e informe o código:", "oauth.loggedInAs": "Conectado: {user}", "oauth.loginOk": "Conectado.", "oauth.loginFailed": "Falha ao entrar",
                "preset.sectionTitle": "Predefinições de servidor", "preset.add": "+ Adicionar predefinição", "preset.empty": "Ainda não há predefinições personalizadas.", "preset.nameLabel": "Nome da predefinição", "preset.imapHostLabel": "Servidor IMAP", "preset.imapPortLabel": "Porta IMAP", "preset.smtpHostLabel": "Servidor SMTP", "preset.smtpPortLabel": "Porta SMTP", "preset.imapSsl": "SSL do IMAP", "preset.smtpSsl": "SSL do SMTP", "preset.yamlParseFailed": "Falha ao analisar serverPresets: {error}",
                "whale.title": "Correio: {count} novas mensagens", "whale.unknownSender": "(desconhecido)", "whale.noSubject": "(sem assunto)", "whale.close": "Fechar",
                "whale.summon": "Mensageira", "whale.pat": "Carinho", "whale.check": "Verificar", "whale.checking": "Verificando…", "whale.open": "Abrir caixa",
                "whale.summonedTitle": "Mensageira baleia pronta ♪", "whale.idleSubtitle": "Clique nela para fazer carinho ou confira novas mensagens.",
                "whale.checkEmpty": "Nenhuma nova mensagem — tudo em ordem ♪", "whale.checkFound": "{count} nova(s) mensagem(ns) encontrada(s)!",
                "whale.checkError": "Erro ao verificar: {message}", "whale.checkNoAccount": "Configure primeiro uma conta em Contas.",
                "whale.patCount": "Carinhos ×{count}", "whale.imageAlt": "Mensageira baleia (clique para fazer carinho)",
                "whale.pat1": "Ah~ que quentinho! Obrigada pelo carinho ♪", "whale.pat2": "A brisa do mar trouxe novas cartas!",
                "whale.pat3": "Cuidando da sua caixa de entrada hoje também~", "whale.pat4": "Hehe, minha cauda até balança ✨",
                "whale.pat5": "Se chegar algo importante, venho correndo!", "whale.pat6": "Que tal um chá quentinho enquanto organizamos tudo?",
            },
            ru: {
                "common.cancel": "Отмена", "common.retry": "Повторить", "common.delete": "Удалить", "common.edit": "Изменить", "common.collapse": "Свернуть", "common.loading": "Загрузка…",
                "nav.title": "Почта (dsh-email)", "section.title": "Почта", "section.intro": "Добавьте почтовый ящик, чтобы помощник мог читать, искать и отвечать на письма. Выберите провайдера и укажите адрес и пароль приложения. Изменения сохраняются автоматически.",
                "global.sendApproval": "Подтверждать отправку по запросу модели", "global.downloadDirLabel": "Папка загрузки вложений", "status.saved": "Сохранено", "status.saving": "Сохранение…", "status.draft": "Есть несохранённые изменения.", "status.saveFailed": "Не удалось сохранить: {message}",
                "card.add": "+ Добавить аккаунт", "card.empty": "Аккаунтов пока нет.", "card.defaultBadge": "По умолчанию", "card.defaultAccount": "Аккаунт по умолчанию", "card.setDefault": "Сделать основным", "card.incomplete": "Не заполнено", "card.notLoggedIn": "Не выполнен вход", "card.loggedInAs": "Выполнен вход: {user}", "card.testConnect": "Проверить соединение", "card.testing": "Проверка…", "card.testOk": "Подключено ({ms} мс) · {host}:{port}", "card.testFailed": "Ошибка соединения: {message}", "card.providerLabel": "Провайдер", "card.addressLabel": "Адрес электронной почты", "card.passwordLabel": "Код авторизации / пароль приложения", "card.passwordPlaceholder": "Оставьте пустым, чтобы сохранить",
                "oauth.signIn.outlook": "Войти через Microsoft", "oauth.signIn.generic": "Войти в {provider}", "oauth.requestingCode": "Запрос кода…", "oauth.signingIn": "Выполняется вход…", "oauth.reLogin": "Войти снова", "oauth.pendingHint": "Откройте адрес в браузере и введите код:", "oauth.loggedInAs": "Выполнен вход: {user}", "oauth.loginOk": "Вход выполнен.", "oauth.loginFailed": "Не удалось войти",
                "preset.sectionTitle": "Предустановки сервера", "preset.add": "+ Добавить предустановку", "preset.empty": "Пользовательских предустановок пока нет.", "preset.nameLabel": "Название предустановки", "preset.imapHostLabel": "Сервер IMAP", "preset.imapPortLabel": "Порт IMAP", "preset.smtpHostLabel": "Сервер SMTP", "preset.smtpPortLabel": "Порт SMTP", "preset.imapSsl": "SSL IMAP", "preset.smtpSsl": "SSL SMTP", "preset.yamlParseFailed": "Не удалось разобрать serverPresets: {error}",
                "whale.title": "Почтовый курьер: новых сообщений — {count}", "whale.unknownSender": "(неизвестно)", "whale.noSubject": "(без темы)", "whale.close": "Закрыть",
                "whale.summon": "Курьер", "whale.pat": "Погладить", "whale.check": "Проверить", "whale.checking": "Проверка…", "whale.open": "Открыть почту",
                "whale.summonedTitle": "Китёнок-курьер на связи ♪", "whale.idleSubtitle": "Нажмите, чтобы погладить, или проверьте новые письма.",
                "whale.checkEmpty": "Новых писем нет — во входящих спокойно ♪", "whale.checkFound": "Найдено новых писем: {count}!",
                "whale.checkError": "Не удалось проверить: {message}", "whale.checkNoAccount": "Сначала настройте аккаунт во вкладке «Аккаунты».",
                "whale.patCount": "Погладили ×{count}", "whale.imageAlt": "Китёнок-курьер (нажмите, чтобы погладить)",
                "whale.pat1": "Ух ты~ как тепло! Спасибо за поглаживание ♪", "whale.pat2": "Морской бриз принёс свежую почту!",
                "whale.pat3": "Сегодня тоже внимательно слежу за входящими~", "whale.pat4": "Хе-хе, хвостик сам виляет ✨",
                "whale.pat5": "Как только придёт важное письмо, сразу примчусь!", "whale.pat6": "Может, выпьем тёплого чаю, пока разбираем почту?",
            },
        };
        // The 104 keys the first-pass override tables did not cover, reviewed per
        // language. Splitting them out keeps the visible-control translations above
        // readable while guaranteeing no supported locale falls back to English.
        // Placeholders and the leading/trailing spaces that join concatenated
        // fragments are preserved exactly as in UI.en.
        const UI_LOCALE_COMPLETION = {
            es: {
                // common
                "common.confirmDelete": "Confirmar eliminación",
                "common.listSeparator": ", ",
                // section
                "section.readonly": "La configuración es de solo lectura: puedes consultarla, pero no guardar cambios.",
                "section.activeAccounts": "Cuentas activas: {accounts}",
                // provider
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Personalizado",
                "provider.noneInYaml": "Elige tu proveedor de correo",
                "provider.undefinedPresetSuffix": "(ajuste no definido)",
                // global
                "global.sendApprovalRisk": "Si se desactiva, los envíos, respuestas y reenvíos iniciados por el modelo omiten la confirmación del complemento en todas las cuentas, incluso para destinatarios no incluidos en la lista de confianza. Las reglas de destinatarios bloqueados y los permisos del host siguen aplicándose. Los borradores aún requieren confirmación manual para enviar.",
                "global.downloadDirPlaceholder": "Déjalo vacío para usar el valor predeterminado",
                "global.attachmentLimit": "Límite de tamaño de los adjuntos",
                "global.attachmentCustom": "Personalizado (MiB)",
                "global.attachmentHint": "El valor predeterminado es 20 MiB. Cada borrador admite hasta 40 MiB de adjuntos originales en total, o 4 MiB con AgentMail. El servidor también puede limitar el tamaño del correo codificado.",
                "global.attachmentRange": "Introduce un valor de 1 KiB (0,0009765625 MiB) a 512 MiB.",
                "draft.attachmentCount": "Un borrador admite hasta 10 adjuntos.",
                "draft.attachmentTotal": "El tamaño total de los adjuntos del borrador no puede superar {size}.",
                "global.hint": "Estos ajustes se aplican a todas las cuentas. En Full Access no se mostrarán diálogos para los envíos desde herramientas que aún requieran confirmación del complemento; usa la pestaña Borradores para revisar y confirmar manualmente. Las reglas de destinatarios bloqueados siempre se aplican.",
                // card
                "card.unnamed": "(sin nombre)",
                "card.noAddress": "(sin dirección de correo)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "Sin proveedor",
                "card.setDefaultAs": "Establecer como predeterminada: {name}",
                "card.renamedBadge": "Renombrada → se guardará con el nombre nuevo",
                "card.testMissingAddress": "Introduce la dirección de correo de esta cuenta antes de probar la conexión.",
                "card.pickDefault": "Hay varias cuentas configuradas; elige la cuenta predeterminada:",
                "card.errNoName": "Hay una cuenta sin nombre; no se guardarán estos cambios.",
                "card.errNoProvider": "Hay una cuenta sin proveedor seleccionado; no se guardarán estos cambios.",
                "card.errDuplicateName": "Ya existe otra cuenta con ese nombre; renombrarla la sobrescribiría, así que no se guardarán estos cambios.",
                "card.errReservedName": "Una cuenta no puede llamarse defaultAccount (esa clave está reservada para la cuenta predeterminada); no se guardarán estos cambios.",
                "card.errNoDefault": "Hay varias cuentas y no se eligió una predeterminada; no se guardarán estos cambios.",
                "card.yamlParseFailed": "No se pudo analizar accountsYaml: {error}",
                "card.confirmDelete": "Al eliminar la cuenta «{name}», también se borrarán sus datos de inicio de sesión guardados. Los mensajes del buzón no se eliminarán.",
                "card.nameLabel": "Nombre de la cuenta",
                "card.nameHint": "Usa un nombre como «Trabajo» para distinguir tus buzones. Al cambiar el nombre se conservan los ajustes existentes; defaultAccount está reservado.",
                "card.reservedNameWarn": "defaultAccount es una clave reservada (indica la cuenta predeterminada); elige otro nombre.",
                "card.authKindLabel": "Autenticación",
                "card.authKindAuto": "Automática (según el proveedor)",
                "card.authKindOAuth2": "Inicio de sesión OAuth2 con código de dispositivo",
                "card.authKindPassword": "Contraseña / contraseña de aplicación",
                "card.authKindHint": "El proveedor determina el método de forma predeterminada. Elige «Contraseña / contraseña de aplicación» para un tenant que aún acepte autenticación básica con Exchange Online (híbrido o local, con SMTP AUTH habilitado); vuelve a probar la conexión después de cambiarlo.",
                "card.passwordSaved": "Ya hay una contraseña guardada: déjalo vacío para conservarla o borra el campo y escribe otra para sustituirla.",
                "card.passwordHint": "Introduce el código de autorización o la contraseña de aplicación proporcionados por tu proveedor de correo y haz clic en «Probar conexión».",
                "card.senderNameLabel": "Nombre del remitente (opcional)",
                "card.senderNamePlaceholder": "Solo el nombre que ven los destinatarios",
                "card.senderNameHint": "Solo cambia el nombre que ven los destinatarios; la dirección sigue siendo la indicada arriba.",
                "card.authUserLabel": "Usuario de inicio de sesión (si es distinto de la dirección)",
                "card.authUserPlaceholder": "Vacío = iniciar sesión con la dirección anterior",
                "card.authUserHint": "Alias o retransmisión: arriba va la dirección desde la que se envía el correo; aquí, la cuenta usada para autenticarse en IMAP/SMTP. Si se deja vacío, ambas son iguales.",
                "card.authPasswordLabel": "Contraseña del usuario de inicio de sesión (opcional)",
                "card.authPasswordSaved": "Hay una contraseña de inicio de sesión guardada: déjala vacía para conservarla o escribe otra para sustituirla.",
                "card.authPasswordHint": "Déjalo vacío para reutilizar el código de autorización o la contraseña de aplicación de arriba; solo hace falta si el usuario de inicio de sesión tiene una contraseña propia.",
                "card.inboxLabel": "Carpeta de entrada (predeterminada: INBOX)",
                "card.autoSaveHint": " Los cambios se guardan automáticamente.",
                "card.autoSaveHintNoDefault": " Hay varias cuentas, pero aún no hay una predeterminada; primero debes elegir una.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Servidor personalizado (introducir datos)",
                "card.customServerHint": "Para un servidor de correo interno o propio: introduce el servidor de entrada. El de salida usará el mismo si se deja vacío. Los puertos vacíos usan los valores predeterminados (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "Servidor IMAP de entrada",
                "card.smtpServerLabel": "Servidor SMTP de salida (vacío = servidor de entrada)",
                "card.portLabel": "Puerto",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "La cuenta de servidor personalizado aún no tiene servidor de entrada; este cambio no se guarda.",
                "preset.errReservedName": "El preajuste no puede llamarse «{name}»: ese valor está reservado para la opción de servidor personalizado. Elige otro nombre.",
                // oauth
                "oauth.clientIdLabel": "ID de aplicación (cliente)",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "Déjalo vacío para iniciar sesión con la aplicación comunitaria integrada del complemento (gratuita y lista para usar): la pantalla de consentimiento de Microsoft mostrará el nombre de la aplicación del colaborador y los registros de inicio de sesión aparecerán en su tenant. Para usar tu propio ID de cliente público de Azure (Entra), con permisos delegados IMAP/SMTP y el flujo de código de dispositivo habilitado, pégalo aquí; cambiarlo requiere iniciar sesión de nuevo.",
                "oauth.clientIdMissing": "Esta compilación no incluye un ID de aplicación (cliente), por lo que no se puede iniciar el acceso con código de dispositivo. Registra uno según la sección «Outlook OAuth2» del README y pégalo aquí.",
                "oauth.clientIdBuiltIn": "Se iniciará sesión con la aplicación comunitaria integrada del complemento: {id} (registrada por el colaborador gurio-wine y autorizada para el uso integrado en este proyecto). Si las políticas de la empresa no permiten aplicaciones de terceros, usa la tuya.",
                "oauth.passwordless": "Este proveedor usa autorización OAuth2, por lo que no se necesita contraseña{label}.",
                "oauth.passwordlessLabel": " ({label})",
                "oauth.noUrl": "(el servidor no devolvió una URL de autorización; cancela y vuelve a intentarlo)",
                "oauth.polling": "Esperando… (se comprueba cada {seconds} segundos; el enlace de autorización es válido durante unos {minutes} minutos)",
                "oauth.unknownUser": "(cuenta desconocida)",
                "oauth.loginOkAs": "Sesión iniciada: {user}",
                "oauth.badResponse": "El servidor devolvió una respuesta que no se reconoce",
                // preset
                "preset.cleared": "Tarjetas borradas: completa los campos restantes para volver a guardarlas; se eliminarán los {count} preajustes.",
                "preset.badgeUnnamed": "Sin nombre",
                "preset.badgeRenamed": "Renombrado → se elimina la clave antigua y se crea una nueva",
                "preset.badgeDuplicate": "Duplicado",
                "preset.noHost": "(sin host)",
                "preset.endpointMissing": "Falta el endpoint",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " | smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · sin cifrar",
                "preset.confirmDelete": "Al eliminar el preajuste «{name}», las cuentas que lo usan se quedarán sin endpoints (y dejará de aparecer en el selector de proveedores).",
                "preset.nameHint": "No puede coincidir con un proveedor integrado (qq/163/126/sina/aliyun/gmail/outlook/icloud), ya que el preajuste integrado lo ocultaría. Al cambiar el nombre se elimina la clave antigua y se crea una nueva.",
                "preset.duplicateWarn": "Ya existe un preajuste con este nombre: los nombres son claves YAML y deben ser únicos.",
                "preset.labelLabel": "Etiqueta visible (clave label, opcional)",
                "preset.labelPlaceholder": "Correo de trabajo",
                "preset.imapPortHint": "Déjalo vacío para usar el valor predeterminado 993.",
                "preset.smtpPortHint": "Déjalo vacío para usar el valor predeterminado 465.",
                "preset.portProblem": "{problem}.",
                "preset.yamlParseFailedHint": "Las tarjetas se crearon a partir de la tabla de preajustes (vacía) de la instantánea, no de este texto. Edita el YAML de abajo para escribir uno nuevo desde cero.",
                "preset.footerHint": "Un preajuste no contiene dirección de correo ni contraseña, solo parámetros de conexión; una cuenta guarda únicamente el nombre del proveedor y expande sus endpoints desde el preajuste al conectarse.",
                "preset.portNumeric": "El puerto debe ser un número",
                "preset.portRange": "El puerto debe estar entre 1 y 65535",
                "preset.errNoName": "Hay un preajuste sin nombre (el nombre es la clave YAML).",
                "preset.errDuplicate": "Dos tarjetas tienen el nombre «{name}»: los nombres son claves YAML y deben ser únicos.",
                "preset.errNoImapHost": "El preajuste «{name}» aún no tiene host IMAP.",
                "preset.errNoSmtpHost": "El preajuste «{name}» aún no tiene host SMTP.",
                "preset.errImapPort": "El preajuste «{name}» tiene un puerto IMAP no válido: {problem}.",
                "preset.errSmtpPort": "El preajuste «{name}» tiene un puerto SMTP no válido: {problem}.",
                // notice
                "notice.commentsDropped": "Se han eliminado los comentarios: el documento original no se puede editar in situ. ",
                "notice.passwordsDropped": "No se han podido conservar algunas contraseñas guardadas; vuelve a introducirlas en las tarjetas correspondientes. ",
                "notice.restSaved": "Todo lo demás se ha guardado automáticamente.",
                "notice.cardsNotWritten": "No se pudieron escribir los cambios de las cuentas en YAML: {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…y {count} más; usa email_watch / email_read para verlos",
            },
            fr: {
                // common
                "common.confirmDelete": "Confirmer la suppression",
                "common.listSeparator": ", ",
                // section
                "section.readonly": "Le stockage des paramètres est en lecture seule : vous pouvez les consulter, mais pas les enregistrer.",
                "section.activeAccounts": "Comptes actifs : {accounts}",
                // provider
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Personnalisé",
                "provider.noneInYaml": "Choisissez votre fournisseur de messagerie",
                "provider.undefinedPresetSuffix": "(préréglage non défini)",
                // global
                "global.sendApprovalRisk": "Si cette option est désactivée, les envois, réponses et transferts lancés par le modèle ne demandent plus la confirmation de ce module pour aucun compte, y compris pour les destinataires hors liste de confiance. Les règles de blocage des destinataires et les autorisations de l’hôte restent appliquées. L’envoi des brouillons nécessite toujours une confirmation manuelle.",
                "global.downloadDirPlaceholder": "Laissez vide pour utiliser la valeur par défaut",
                "global.attachmentLimit": "Taille maximale des pièces jointes",
                "global.attachmentCustom": "Personnalisée (MiB)",
                "global.attachmentHint": "La valeur par défaut est de 20 MiB. Un brouillon accepte jusqu’à 40 MiB de pièces jointes d’origine au total, ou 4 MiB avec AgentMail. Le serveur peut aussi limiter la taille du message encodé.",
                "global.attachmentRange": "Saisissez une valeur comprise entre 1 KiB (0,0009765625 MiB) et 512 MiB.",
                "draft.attachmentCount": "Un brouillon peut contenir jusqu’à 10 pièces jointes.",
                "draft.attachmentTotal": "La taille totale des pièces jointes du brouillon est limitée à {size}.",
                "global.hint": "Ces paramètres s’appliquent à tous les comptes. Sous Full Access, les envois depuis les outils qui nécessitent encore la confirmation du module ne peuvent pas afficher de boîte de dialogue ; utilisez l’onglet Brouillons pour vérifier et confirmer manuellement. Les règles de blocage des destinataires s’appliquent toujours.",
                // card
                "card.unnamed": "(sans nom)",
                "card.noAddress": "(aucune adresse e-mail)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "Aucun fournisseur",
                "card.setDefaultAs": "Définir comme compte par défaut : {name}",
                "card.renamedBadge": "Renommé → sera enregistré sous le nouveau nom",
                "card.testMissingAddress": "Saisissez l’adresse e-mail de ce compte avant de tester la connexion.",
                "card.pickDefault": "Plusieurs comptes sont configurés ; choisissez le compte par défaut :",
                "card.errNoName": "Un compte n’a pas encore de nom ; cette modification ne sera pas enregistrée.",
                "card.errNoProvider": "Aucun fournisseur n’est sélectionné pour un compte ; cette modification ne sera pas enregistrée.",
                "card.errDuplicateName": "Un autre compte porte déjà ce nom ; le renommage l’écraserait, cette modification ne sera donc pas enregistrée.",
                "card.errReservedName": "Un compte ne peut pas s’appeler defaultAccount (cette clé est réservée au compte par défaut) ; cette modification ne sera pas enregistrée.",
                "card.errNoDefault": "Plusieurs comptes existent, mais aucun compte par défaut n’a été choisi ; cette modification ne sera pas enregistrée.",
                "card.yamlParseFailed": "Échec de l’analyse de accountsYaml : {error}",
                "card.confirmDelete": "La suppression du compte « {name} » supprime également ses identifiants enregistrés. Les messages de la boîte aux lettres ne sont pas supprimés.",
                "card.nameLabel": "Nom du compte",
                "card.nameHint": "Utilisez un nom comme « Travail » pour distinguer vos boîtes aux lettres. Le renommage conserve les paramètres existants ; defaultAccount est réservé.",
                "card.reservedNameWarn": "defaultAccount est une clé réservée (elle désigne le compte par défaut) ; choisissez un autre nom.",
                "card.authKindLabel": "Authentification",
                "card.authKindAuto": "Automatique (déterminée par le fournisseur)",
                "card.authKindOAuth2": "Connexion OAuth2 par code d’appareil",
                "card.authKindPassword": "Mot de passe / mot de passe d’application",
                "card.authKindHint": "Le fournisseur détermine le mode par défaut. Choisissez « Mot de passe / mot de passe d’application » pour un tenant qui accepte encore l’authentification de base avec Exchange Online (hybride ou local, avec SMTP AUTH activé) ; testez à nouveau la connexion après modification.",
                "card.passwordSaved": "Un mot de passe est déjà enregistré : laissez le champ vide pour le conserver, ou effacez-le puis saisissez-en un autre pour le remplacer.",
                "card.passwordHint": "Saisissez le code d’autorisation ou le mot de passe d’application fourni par votre fournisseur de messagerie, puis cliquez sur « Tester la connexion ».",
                "card.senderNameLabel": "Nom d’expéditeur (facultatif)",
                "card.senderNamePlaceholder": "Uniquement le nom visible par les destinataires",
                "card.senderNameHint": "Seul le nom visible par les destinataires change ; l’adresse reste celle indiquée ci-dessus.",
                "card.authUserLabel": "Identifiant de connexion (s’il diffère de l’adresse)",
                "card.authUserPlaceholder": "Vide = connexion avec l’adresse ci-dessus",
                "card.authUserHint": "Alias ou relais : indiquez ci-dessus l’adresse d’envoi, et ici le compte utilisé pour s’authentifier auprès d’IMAP/SMTP. Si ce champ est vide, les deux sont identiques.",
                "card.authPasswordLabel": "Mot de passe de l’identifiant de connexion (facultatif)",
                "card.authPasswordSaved": "Un mot de passe de connexion est enregistré : laissez le champ vide pour le conserver, ou saisissez-en un autre pour le remplacer.",
                "card.authPasswordHint": "Laissez vide pour réutiliser le code d’autorisation ou le mot de passe d’application ci-dessus ; ce champ n’est nécessaire que si l’identifiant de connexion possède son propre mot de passe.",
                "card.inboxLabel": "Dossier de réception (par défaut : INBOX)",
                "card.autoSaveHint": " Les changements sont enregistrés automatiquement.",
                "card.autoSaveHintNoDefault": " Plusieurs comptes sont configurés, mais aucun n’est défini par défaut ; vous devez d’abord en choisir un.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Serveur personnalisé (saisie manuelle)",
                "card.customServerHint": "Pour un serveur de messagerie interne ou auto-hébergé : saisissez le serveur d’entrée. Le serveur de sortie reprend celui d’entrée s’il est laissé vide. Les ports vides utilisent les valeurs par défaut (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "Serveur IMAP d’entrée",
                "card.smtpServerLabel": "Serveur SMTP de sortie (vide = serveur d’entrée)",
                "card.portLabel": "Port",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "Le compte à serveur personnalisé n’a pas encore de serveur d’entrée ; cette modification n’est pas enregistrée.",
                "preset.errReservedName": "Un préréglage ne peut pas s’appeler « {name} » : cette valeur est réservée à l’option de serveur personnalisé. Choisissez un autre nom.",
                // oauth
                "oauth.clientIdLabel": "ID d’application (client)",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "Laissez ce champ vide pour utiliser l’application communautaire intégrée au module (gratuite, sans configuration) : l’écran de consentement Microsoft affiche le nom de l’application du contributeur et les journaux de connexion sont associés à son tenant. Pour utiliser votre propre ID client public Azure (Entra), avec les autorisations déléguées IMAP/SMTP et le flux de code d’appareil activés, collez-le ici ; toute modification nécessite une nouvelle connexion.",
                "oauth.clientIdMissing": "Cette version ne contient aucun ID d’application (client) intégré ; la connexion par code d’appareil ne peut donc pas démarrer. Enregistrez-en un comme indiqué dans la section « Outlook OAuth2 » du README, puis collez-le ici.",
                "oauth.clientIdBuiltIn": "Connexion via l’application communautaire intégrée au module : {id} (enregistrée par le contributeur gurio-wine, qui a autorisé son intégration à ce projet). Si les règles de votre entreprise interdisent les applications tierces, utilisez la vôtre.",
                "oauth.passwordless": "Ce fournisseur utilise l’autorisation OAuth2 ; aucun mot de passe n’est donc nécessaire{label}.",
                "oauth.passwordlessLabel": " ({label})",
                "oauth.noUrl": "(le serveur n’a renvoyé aucune URL d’autorisation ; annulez et réessayez)",
                "oauth.polling": "En attente… (vérification toutes les {seconds} secondes ; le lien d’autorisation reste valable environ {minutes} minutes)",
                "oauth.unknownUser": "(compte inconnu)",
                "oauth.loginOkAs": "Connecté : {user}",
                "oauth.badResponse": "Le serveur a renvoyé une réponse non reconnue",
                // preset
                "preset.cleared": "Cartes effacées : complétez les champs restants pour les réenregistrer ; les {count} préréglages seront supprimés.",
                "preset.badgeUnnamed": "Sans nom",
                "preset.badgeRenamed": "Renommé → ancienne clé supprimée, nouvelle créée",
                "preset.badgeDuplicate": "Doublon",
                "preset.noHost": "(aucun hôte)",
                "preset.endpointMissing": "Point de terminaison manquant",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " | smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · non chiffré",
                "preset.confirmDelete": "La suppression du préréglage « {name} » laissera les comptes qui l’utilisent sans points de terminaison (et il ne sera plus proposé dans la liste des fournisseurs).",
                "preset.nameHint": "Ne peut pas être identique à un fournisseur intégré (qq/163/126/sina/aliyun/gmail/outlook/icloud) : le préréglage intégré le masquerait. Le renommage supprime l’ancienne clé et en crée une nouvelle.",
                "preset.duplicateWarn": "Un préréglage portant ce nom existe déjà : les noms sont des clés YAML et doivent être uniques.",
                "preset.labelLabel": "Libellé affiché (clé label, facultatif)",
                "preset.labelPlaceholder": "E-mail professionnel",
                "preset.imapPortHint": "Laissez vide pour utiliser la valeur par défaut 993.",
                "preset.smtpPortHint": "Laissez vide pour utiliser la valeur par défaut 465.",
                "preset.portProblem": "{problem}.",
                "preset.yamlParseFailedHint": "Les cartes ci-dessous ont été créées à partir de la table des préréglages (vide) de l’instantané, et non de ce texte. Modifiez le YAML ci-dessous pour en créer un nouveau depuis zéro.",
                "preset.footerHint": "Un préréglage ne contient ni adresse e-mail ni mot de passe, uniquement des paramètres de connexion ; un compte ne conserve que le nom du fournisseur et développe ses points de terminaison depuis le préréglage lors de la connexion.",
                "preset.portNumeric": "Le port doit être un nombre",
                "preset.portRange": "Le port doit être compris entre 1 et 65535",
                "preset.errNoName": "Un préréglage n’a pas encore de nom (le nom est la clé YAML).",
                "preset.errDuplicate": "Deux cartes portent le nom « {name} » : les noms sont des clés YAML et doivent être uniques.",
                "preset.errNoImapHost": "Le préréglage « {name} » n’a pas encore d’hôte IMAP.",
                "preset.errNoSmtpHost": "Le préréglage « {name} » n’a pas encore d’hôte SMTP.",
                "preset.errImapPort": "Le préréglage « {name} » possède un port IMAP non valide : {problem}.",
                "preset.errSmtpPort": "Le préréglage « {name} » possède un port SMTP non valide : {problem}.",
                // notice
                "notice.commentsDropped": "Commentaires supprimés : le document d’origine ne peut pas être modifié sur place. ",
                "notice.passwordsDropped": "Certains mots de passe enregistrés n’ont pas pu être conservés ; saisissez-les à nouveau dans les cartes correspondantes. ",
                "notice.restSaved": "Tout le reste a été enregistré automatiquement.",
                "notice.cardsNotWritten": "Les modifications des comptes n’ont pas pu être écrites dans le YAML : {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…et {count} autres ; utilisez email_watch / email_read pour les consulter",
            },
            de: {
                // common
                "common.confirmDelete": "Löschen bestätigen",
                "common.listSeparator": ", ",
                // section
                "section.readonly": "Der Einstellungsspeicher ist schreibgeschützt: Einstellungen können angezeigt, aber nicht gespeichert werden.",
                "section.activeAccounts": "Aktive Konten: {accounts}",
                // provider
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Benutzerdefiniert",
                "provider.noneInYaml": "E-Mail-Anbieter auswählen",
                "provider.undefinedPresetSuffix": "(nicht definierte Voreinstellung)",
                // global
                "global.sendApprovalRisk": "Ist diese Option deaktiviert, überspringen vom Modell gestartete Sendungen, Antworten und Weiterleitungen in allen Konten die Bestätigung dieses Plugins, auch bei Empfängern außerhalb der Vertrauensliste. Regeln für gesperrte Empfänger und Host-Berechtigungen gelten weiterhin. Entwürfe müssen weiterhin manuell zum Senden bestätigt werden.",
                "global.downloadDirPlaceholder": "Leer lassen, um den Standard zu verwenden",
                "global.attachmentLimit": "Größenlimit für Anhänge",
                "global.attachmentCustom": "Benutzerdefiniert (MiB)",
                "global.attachmentHint": "Standardmäßig 20 MiB. Pro Entwurf sind insgesamt bis zu 40 MiB an Originalanhängen möglich, bei AgentMail bis zu 4 MiB. Der Mailserver kann die Größe der kodierten Nachricht zusätzlich begrenzen.",
                "global.attachmentRange": "Gib einen Wert zwischen 1 KiB (0,0009765625 MiB) und 512 MiB ein.",
                "draft.attachmentCount": "Ein Entwurf kann bis zu 10 Anhänge enthalten.",
                "draft.attachmentTotal": "Die Anhänge dieses Entwurfs dürfen zusammen höchstens {size} groß sein.",
                "global.hint": "Diese Einstellungen gelten für alle Konten. Unter Full Access können Werkzeug-Sendungen, für die weiterhin eine Plugin-Bestätigung erforderlich ist, keinen Dialog anzeigen. Prüfen und bestätigen Sie sie manuell im Tab „Entwürfe“. Regeln für gesperrte Empfänger gelten immer.",
                // card
                "card.unnamed": "(unbenannt)",
                "card.noAddress": "(keine E-Mail-Adresse)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "Kein Anbieter",
                "card.setDefaultAs": "Als Standard festlegen: {name}",
                "card.renamedBadge": "Umbenannt → wird unter dem neuen Namen gespeichert",
                "card.testMissingAddress": "Geben Sie vor dem Verbindungstest die E-Mail-Adresse dieses Kontos ein.",
                "card.pickDefault": "Mehrere Konten sind eingerichtet. Wählen Sie das Standardkonto aus:",
                "card.errNoName": "Ein Konto hat noch keinen Namen. Diese Änderung wird nicht gespeichert.",
                "card.errNoProvider": "Für ein Konto ist kein Anbieter ausgewählt. Diese Änderung wird nicht gespeichert.",
                "card.errDuplicateName": "Ein anderes Konto hat bereits diesen Namen. Beim Umbenennen würde es überschrieben; diese Änderung wird daher nicht gespeichert.",
                "card.errReservedName": "Ein Konto darf nicht defaultAccount heißen (dieser Schlüssel ist für das Standardkonto reserviert). Diese Änderung wird nicht gespeichert.",
                "card.errNoDefault": "Es gibt mehrere Konten, aber kein Standardkonto. Diese Änderung wird nicht gespeichert.",
                "card.yamlParseFailed": "accountsYaml konnte nicht gelesen werden: {error}",
                "card.confirmDelete": "Beim Löschen des Kontos „{name}“ werden auch die gespeicherten Anmeldedaten entfernt. Nachrichten im Postfach werden nicht gelöscht.",
                "card.nameLabel": "Kontoname",
                "card.nameHint": "Verwenden Sie einen Namen wie „Arbeit“, um Ihre Postfächer zu unterscheiden. Beim Umbenennen bleiben die Einstellungen erhalten; defaultAccount ist reserviert.",
                "card.reservedNameWarn": "defaultAccount ist ein reservierter Schlüssel (für das Standardkonto). Wählen Sie einen anderen Namen.",
                "card.authKindLabel": "Authentifizierung",
                "card.authKindAuto": "Automatisch (vom Anbieter festgelegt)",
                "card.authKindOAuth2": "OAuth2-Anmeldung mit Gerätecode",
                "card.authKindPassword": "Passwort / App-Passwort",
                "card.authKindHint": "Standardmäßig legt der Anbieter die Methode fest. Wählen Sie „Passwort / App-Passwort“ für einen Mandanten, der bei Exchange Online noch Basisauthentifizierung akzeptiert (Hybrid- oder lokale Bereitstellung, SMTP AUTH aktiviert). Testen Sie die Verbindung nach der Änderung erneut.",
                "card.passwordSaved": "Ein Passwort ist bereits gespeichert: Leer lassen, um es beizubehalten, oder das Feld leeren und einen neuen Wert eingeben.",
                "card.passwordHint": "Geben Sie den vom E-Mail-Anbieter bereitgestellten Autorisierungscode oder das App-Passwort ein und klicken Sie auf „Verbindung testen“.",
                "card.senderNameLabel": "Anzeigename des Absenders (optional)",
                "card.senderNamePlaceholder": "Nur der für Empfänger sichtbare Name",
                "card.senderNameHint": "Geändert wird nur der für Empfänger sichtbare Name; die Adresse bleibt die oben angegebene.",
                "card.authUserLabel": "Anmeldebenutzer (wenn abweichend von der Adresse)",
                "card.authUserPlaceholder": "Leer = mit der obigen Adresse anmelden",
                "card.authUserHint": "Alias oder Relay: Oben steht die Absenderadresse, hier das Konto für die IMAP-/SMTP-Anmeldung. Leer lassen, wenn beide identisch sind.",
                "card.authPasswordLabel": "Passwort des Anmeldebenutzers (optional)",
                "card.authPasswordSaved": "Ein Anmeldepasswort ist gespeichert: Leer lassen, um es beizubehalten, oder einen neuen Wert eingeben.",
                "card.authPasswordHint": "Leer lassen, um den obigen Autorisierungscode bzw. das App-Passwort wiederzuverwenden. Nur erforderlich, wenn der Anmeldebenutzer ein eigenes Passwort hat.",
                "card.inboxLabel": "Posteingangsordner (Standard: INBOX)",
                "card.autoSaveHint": " Änderungen werden automatisch gespeichert.",
                "card.autoSaveHintNoDefault": " Es gibt mehrere Konten, aber noch kein Standardkonto. Wählen Sie zuerst eines aus.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Benutzerdefinierter Server (manuelle Eingabe)",
                "card.customServerHint": "Für einen internen oder selbst gehosteten Mailserver: Trage den eingehenden Server ein. Der ausgehende Server übernimmt ihn, wenn er leer bleibt. Leere Ports nutzen die Standardwerte (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "IMAP-Eingangsserver",
                "card.smtpServerLabel": "SMTP-Ausgangsserver (leer = Eingangsserver)",
                "card.portLabel": "Port",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "Beim Konto mit benutzerdefiniertem Server fehlt noch der Eingangsserver; diese Änderung wird nicht gespeichert.",
                "preset.errReservedName": "Eine Voreinstellung darf nicht „{name}“ heißen: Dieser Wert ist für die Option „benutzerdefinierter Server“ reserviert. Wähle einen anderen Namen.",
                // oauth
                "oauth.clientIdLabel": "Anwendungs- (Client-) ID",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "Leer lassen, um sich mit der integrierten Community-Anwendung des Plugins anzumelden (kostenlos, ohne Einrichtung): Auf dem Microsoft-Zustimmungsbildschirm wird der Name der App des Beitragenden angezeigt, und die Anmeldeprotokolle werden dessen Tenant zugeordnet. Für Ihre eigene öffentliche Azure-(Entra-)Client-ID mit delegierten IMAP-/SMTP-Berechtigungen und aktiviertem Gerätecodeflow fügen Sie diese hier ein; bei einer Änderung ist eine erneute Anmeldung erforderlich.",
                "oauth.clientIdMissing": "Dieser Build enthält keine integrierte Anwendungs- (Client-) ID; die Gerätecode-Anmeldung kann daher nicht starten. Registrieren Sie eine gemäß dem Abschnitt „Outlook OAuth2“ in der README und fügen Sie sie hier ein.",
                "oauth.clientIdBuiltIn": "Anmeldung über die integrierte Community-Anwendung des Plugins: {id} (vom Beitragenden gurio-wine registriert und zur integrierten Nutzung in diesem Projekt freigegeben). Falls Unternehmensrichtlinien Drittanbieter-Apps nicht zulassen, verwenden Sie Ihre eigene.",
                "oauth.passwordless": "Dieser Anbieter verwendet OAuth2-Autorisierung, daher ist kein Passwort erforderlich{label}.",
                "oauth.passwordlessLabel": " ({label})",
                "oauth.noUrl": "(Backend hat keine Autorisierungs-URL zurückgegeben; abbrechen und erneut versuchen)",
                "oauth.polling": "Warten… (Prüfung alle {seconds} Sekunden; der Autorisierungslink ist etwa {minutes} Minuten gültig)",
                "oauth.unknownUser": "(unbekanntes Konto)",
                "oauth.loginOkAs": "Angemeldet: {user}",
                "oauth.badResponse": "Der Server hat eine unbekannte Antwort zurückgegeben",
                // preset
                "preset.cleared": "Karten gelöscht: Füllen Sie die restlichen Felder aus, um sie zurückzuschreiben; alle {count} Voreinstellungen werden gelöscht.",
                "preset.badgeUnnamed": "Unbenannt",
                "preset.badgeRenamed": "Umbenannt → alter Schlüssel gelöscht, neuer erstellt",
                "preset.badgeDuplicate": "Doppelt",
                "preset.noHost": "(kein Host)",
                "preset.endpointMissing": "Endpunkt fehlt",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " | smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · unverschlüsselt",
                "preset.confirmDelete": "Beim Löschen der Voreinstellung „{name}“ fehlen den darauf verweisenden Konten die Endpunkte (und sie wird nicht mehr im Anbietermenü angezeigt).",
                "preset.nameHint": "Darf nicht mit einem integrierten Anbieter (qq/163/126/sina/aliyun/gmail/outlook/icloud) kollidieren, da die integrierte Voreinstellung ihn überdecken würde. Beim Umbenennen wird der alte Schlüssel gelöscht und ein neuer erstellt.",
                "preset.duplicateWarn": "Eine Voreinstellung mit diesem Namen existiert bereits: Voreinstellungsnamen sind YAML-Schlüssel und müssen eindeutig sein.",
                "preset.labelLabel": "Anzeigename (Schlüssel label, optional)",
                "preset.labelPlaceholder": "Arbeits-E-Mail",
                "preset.imapPortHint": "Leer lassen, um den Standardwert 993 zu verwenden.",
                "preset.smtpPortHint": "Leer lassen, um den Standardwert 465 zu verwenden.",
                "preset.portProblem": "{problem}.",
                "preset.yamlParseFailedHint": "Die Karten unten wurden aus der (leeren) Voreinstellungstabelle des Snapshots erstellt, nicht aus diesem Text. Bearbeiten Sie das YAML unten, um von Grund auf eine neue Tabelle zu schreiben.",
                "preset.footerHint": "Eine Voreinstellung enthält weder E-Mail-Adresse noch Passwort, sondern nur Verbindungsparameter; ein Konto speichert nur den Anbieternamen und ermittelt beim Verbinden die Endpunkte aus der Voreinstellung.",
                "preset.portNumeric": "Der Port muss eine Zahl sein",
                "preset.portRange": "Der Port muss zwischen 1 und 65535 liegen",
                "preset.errNoName": "Eine Voreinstellung hat noch keinen Namen (der Name ist der YAML-Schlüssel).",
                "preset.errDuplicate": "Zwei Karten heißen „{name}“: Voreinstellungsnamen sind YAML-Schlüssel und müssen eindeutig sein.",
                "preset.errNoImapHost": "Bei der Voreinstellung „{name}“ fehlt der IMAP-Host.",
                "preset.errNoSmtpHost": "Bei der Voreinstellung „{name}“ fehlt der SMTP-Host.",
                "preset.errImapPort": "Die Voreinstellung „{name}“ hat einen ungültigen IMAP-Port: {problem}.",
                "preset.errSmtpPort": "Die Voreinstellung „{name}“ hat einen ungültigen SMTP-Port: {problem}.",
                // notice
                "notice.commentsDropped": "Kommentare wurden entfernt: Das Originaldokument kann nicht direkt bearbeitet werden. ",
                "notice.passwordsDropped": "Einige gespeicherte Passwörter konnten nicht beibehalten werden; geben Sie sie in den entsprechenden Karten erneut ein. ",
                "notice.restSaved": "Alles andere wurde automatisch gespeichert.",
                "notice.cardsNotWritten": "Die Kontoänderungen konnten nicht in YAML geschrieben werden: {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…und {count} weitere; verwenden Sie email_watch / email_read, um sie anzuzeigen",
            },
            ja: {
                // common
                "common.confirmDelete": "削除を確認",
                "common.listSeparator": "、",
                // section
                "section.readonly": "設定ストアは読み取り専用です。設定を確認できますが、変更は保存できません。",
                "section.activeAccounts": "有効なアカウント: {accounts}",
                // provider
                "provider.qq": "QQメール",
                "provider.163": "163メール",
                "provider.126": "126メール",
                "provider.sina": "Sinaメール",
                "provider.aliyun": "Alibabaメール",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent企業メール / WeComメール",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "カスタム",
                "provider.noneInYaml": "メールプロバイダーを選択",
                "provider.undefinedPresetSuffix": "(未定義のプリセット)",
                // global
                "global.sendApprovalRisk": "オフにすると、モデルによる送信・返信・転送は、信頼リストにない宛先を含め、すべてのアカウントでこのプラグインの確認を省略します。禁止宛先ルールとホスト権限は引き続き適用されます。下書きの送信には引き続き手動確認が必要です。",
                "global.downloadDirPlaceholder": "空欄でデフォルトを使用",
                "global.attachmentLimit": "添付ファイルのサイズ上限",
                "global.attachmentCustom": "カスタム（MiB）",
                "global.attachmentHint": "既定値は 20 MiB です。下書き 1 通あたり、元の添付ファイルの合計は最大 40 MiB、AgentMail では 4 MiB です。メールサーバー側でエンコード後のサイズが制限される場合があります。",
                "global.attachmentRange": "1 KiB（0.0009765625 MiB）から 512 MiB までの値を入力してください。",
                "draft.attachmentCount": "下書き 1 通に最大 10 個のファイルを添付できます。",
                "draft.attachmentTotal": "下書きに添付できるファイルの合計サイズは {size} までです。",
                "global.hint": "これらの設定はすべてのアカウントに適用されます。Full Access では、プラグインの確認が必要なツール送信でダイアログを表示できません。「下書き」タブで確認して手動承認してください。禁止宛先ルールは常に適用されます。",
                // card
                "card.unnamed": "(名前なし)",
                "card.noAddress": "(メールアドレス未入力)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "プロバイダー未選択",
                "card.setDefaultAs": "デフォルトに設定: {name}",
                "card.renamedBadge": "名前変更済み → 新しい名前で保存",
                "card.testMissingAddress": "接続テストの前に、このアカウントのメールアドレスを入力してください。",
                "card.pickDefault": "複数のアカウントが設定されています。デフォルトアカウントを選択してください:",
                "card.errNoName": "名前が未入力のアカウントがあります。この変更は保存されません。",
                "card.errNoProvider": "プロバイダーが選択されていないアカウントがあります。この変更は保存されません。",
                "card.errDuplicateName": "同じ名前のアカウントがすでにあります。名前を変更すると上書きされるため、この変更は保存されません。",
                "card.errReservedName": "アカウント名に defaultAccount は使えません（デフォルトアカウント用の予約キーです）。この変更は保存されません。",
                "card.errNoDefault": "複数のアカウントがありますが、デフォルトアカウントが指定されていません。この変更は保存されません。",
                "card.yamlParseFailed": "accountsYaml を解析できませんでした: {error}",
                "card.confirmDelete": "アカウント「{name}」を削除すると、保存済みのログイン情報も削除されます。メールボックス内のメッセージは削除されません。",
                "card.nameLabel": "アカウント名",
                "card.nameHint": "「仕事用」などの名前を付けてメールボックスを区別できます。名前を変更しても既存の設定は保持されます。defaultAccount は予約されています。",
                "card.reservedNameWarn": "defaultAccount は予約キー（デフォルトアカウントを表す）です。別の名前を指定してください。",
                "card.authKindLabel": "認証方式",
                "card.authKindAuto": "自動（プロバイダーに応じて判定）",
                "card.authKindOAuth2": "OAuth2 デバイスコードログイン",
                "card.authKindPassword": "パスワード / アプリパスワード",
                "card.authKindHint": "既定ではプロバイダーに応じて認証方式を判定します。Exchange Online で基本認証をまだ利用できるテナント（ハイブリッドまたはオンプレミス、SMTP AUTH が有効）では「パスワード / アプリパスワード」を選択し、変更後に接続を再テストしてください。",
                "card.passwordSaved": "パスワードはすでに保存されています。保持する場合は空欄のままにし、置き換える場合は入力欄を消去して新しい値を入力してください。",
                "card.passwordHint": "メールプロバイダーから提供された認証コードまたはアプリパスワードを入力し、「接続をテスト」をクリックしてください。",
                "card.senderNameLabel": "差出人の表示名（任意）",
                "card.senderNamePlaceholder": "受信者に表示される名前のみ",
                "card.senderNameHint": "受信者に表示される名前だけが変わり、差出人アドレスは上記のままです。",
                "card.authUserLabel": "ログインユーザー（メールアドレスと異なる場合）",
                "card.authUserPlaceholder": "空欄 = 上記のアドレスでログイン",
                "card.authUserHint": "エイリアスまたはリレーの場合、上には送信元アドレス、ここには IMAP/SMTP ログインに使うアカウントを入力します。空欄なら同じアドレスを使います。",
                "card.authPasswordLabel": "ログインユーザーのパスワード（任意）",
                "card.authPasswordSaved": "ログインパスワードはすでに保存されています。保持する場合は空欄にし、置き換える場合は新しい値を入力してください。",
                "card.authPasswordHint": "上の認証コード / アプリパスワードを使う場合は空欄にしてください。ログインユーザーに別のパスワードがある場合のみ入力します。",
                "card.inboxLabel": "受信フォルダー（デフォルト: INBOX）",
                "card.autoSaveHint": " 変更は自動的に保存されます。",
                "card.autoSaveHintNoDefault": " 複数のアカウントがありますが、デフォルトが未設定です。先に1つ選択してください。",
                "card.builtinEndpoints": " · {imap} ｜ {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "カスタムサーバー（手動入力）",
                "card.customServerHint": "社内または自前のメールサーバー向け: 受信サーバーを入力してください。送信サーバーが空欄の場合は受信サーバーを使用します。ポートが空欄の場合は既定値（IMAP 993 / SMTP 465）を使用します。",
                "card.imapServerLabel": "IMAP 受信サーバー",
                "card.smtpServerLabel": "SMTP 送信サーバー（空欄＝受信サーバー）",
                "card.portLabel": "ポート",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "カスタムサーバーのアカウントに受信サーバーが未入力のため、この変更は保存されません。",
                "preset.errReservedName": "プリセット名に「{name}」は使えません。この値は「カスタムサーバー」オプション用に予約されています。別の名前を指定してください。",
                // oauth
                "oauth.clientIdLabel": "アプリケーション（クライアント）ID",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "空欄にすると、プラグイン内蔵のコミュニティアプリ（無料・設定不要）でログインします。Microsoft の同意画面にはコントリビューターのアプリ名が表示され、ログイン記録もそのテナントに記録されます。独自の Azure (Entra) パブリッククライアント ID（IMAP/SMTP の委任アクセス許可とデバイスコードフローを有効化済み）を使う場合はここに貼り付けてください。変更後は再ログインが必要です。",
                "oauth.clientIdMissing": "このビルドにはアプリケーション（クライアント）ID が組み込まれていないため、デバイスコードログインを開始できません。README の「Outlook OAuth2」節に従って登録し、ここに入力してください。",
                "oauth.clientIdBuiltIn": "プラグイン内蔵のコミュニティアプリ {id} でログインします（コントリビューターの gurio-wine が登録し、本プロジェクトでの内蔵利用を許可）。組織のポリシーでサードパーティアプリが禁止されている場合は、独自のアプリを使用してください。",
                "oauth.passwordless": "このプロバイダーは OAuth2 認証を使用するため、パスワードは不要です{label}。",
                "oauth.passwordlessLabel": "（{label}）",
                "oauth.noUrl": "(サーバーから認証 URL が返されませんでした。キャンセルして再試行してください)",
                "oauth.polling": "待機中…（{seconds} 秒ごとに確認します。認証リンクの有効期限は約 {minutes} 分です）",
                "oauth.unknownUser": "(不明なアカウント)",
                "oauth.loginOkAs": "ログインしました: {user}",
                "oauth.badResponse": "サーバーから認識できない応答が返されました",
                // preset
                "preset.cleared": "カードをクリアしました。残りの項目を入力すると書き戻され、{count} 件のプリセットがすべて削除されます。",
                "preset.badgeUnnamed": "名前なし",
                "preset.badgeRenamed": "名前変更済み → 古いキーを削除し、新しいキーを作成",
                "preset.badgeDuplicate": "重複",
                "preset.noHost": "(ホスト未入力)",
                "preset.endpointMissing": "エンドポイント未入力",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " ｜ smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · 平文",
                "preset.confirmDelete": "プリセット「{name}」を削除すると、それを指すアカウントカードからエンドポイントが失われ、プロバイダー選択にも表示されなくなります。",
                "preset.nameHint": "組み込みプロバイダー（qq/163/126/sina/aliyun/gmail/outlook/icloud）とは同名にできません。組み込みプリセットに隠されます。名前変更では古いキーを削除し、新しいキーを作成します。",
                "preset.duplicateWarn": "この名前のプリセットはすでに存在します。プリセット名は YAML キーのため、一意である必要があります。",
                "preset.labelLabel": "表示ラベル（label キー、任意）",
                "preset.labelPlaceholder": "仕事用メール",
                "preset.imapPortHint": "空欄でデフォルトの 993 を使用",
                "preset.smtpPortHint": "空欄でデフォルトの 465 を使用",
                "preset.portProblem": "{problem}。",
                "preset.yamlParseFailedHint": "下のカードは、このテキストではなくスナップショットの（空の）プリセット表から作成されています。下の YAML を直接編集して新しく書き直せます。",
                "preset.footerHint": "プリセットにはメールアドレスやパスワードは含まれず、接続パラメーターだけが保存されます。アカウントはプロバイダー名だけを保持し、接続時にプリセットからエンドポイントを展開します。",
                "preset.portNumeric": "ポートは数字で指定してください",
                "preset.portRange": "ポートは 1～65535 の範囲で指定してください",
                "preset.errNoName": "名前が未入力のプリセットがあります（プリセット名は YAML キーです）。",
                "preset.errDuplicate": "2 枚のプリセットカードが「{name}」という名前です。プリセット名は YAML キーのため、一意である必要があります。",
                "preset.errNoImapHost": "プリセット「{name}」に IMAP ホストが未入力です。",
                "preset.errNoSmtpHost": "プリセット「{name}」に SMTP ホストが未入力です。",
                "preset.errImapPort": "プリセット「{name}」の IMAP ポートが無効です: {problem}。",
                "preset.errSmtpPort": "プリセット「{name}」の SMTP ポートが無効です: {problem}。",
                // notice
                "notice.commentsDropped": "コメントを削除しました。元のドキュメントはその場で編集できません。 ",
                "notice.passwordsDropped": "保存済みパスワードの一部を保持できませんでした。該当するカードで再入力してください。",
                "notice.restSaved": "その他の変更は自動保存されました。",
                "notice.cardsNotWritten": "アカウントの変更を YAML に書き込めませんでした: {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…ほか {count} 件。email_watch / email_read で確認してください",
            },
            pt: {
                // common
                "common.confirmDelete": "Confirmar exclusão",
                "common.listSeparator": ", ",
                // section
                "section.readonly": "O armazenamento de configurações está somente para leitura: você pode consultá-las, mas não salvá-las.",
                "section.activeAccounts": "Contas ativas: {accounts}",
                // provider
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Personalizado",
                "provider.noneInYaml": "Escolha seu provedor de e-mail",
                "provider.undefinedPresetSuffix": "(predefinição não definida)",
                // global
                "global.sendApprovalRisk": "Se desativada, esta extensão não solicitará confirmação para envios, respostas e encaminhamentos iniciados pelo modelo em nenhuma conta, inclusive para destinatários fora da lista de confiança. As regras de destinatários bloqueados e as permissões do host continuam valendo. Rascunhos ainda exigem confirmação manual para envio.",
                "global.downloadDirPlaceholder": "Deixe vazio para usar o padrão",
                "global.attachmentLimit": "Limite de tamanho dos anexos",
                "global.attachmentCustom": "Personalizado (MiB)",
                "global.attachmentHint": "O padrão é 20 MiB. Cada rascunho permite até 40 MiB de anexos originais no total, ou 4 MiB com AgentMail. O servidor também pode limitar o tamanho da mensagem codificada.",
                "global.attachmentRange": "Insira um valor entre 1 KiB (0,0009765625 MiB) e 512 MiB.",
                "draft.attachmentCount": "Cada rascunho permite até 10 anexos.",
                "draft.attachmentTotal": "O tamanho total dos anexos do rascunho é limitado a {size}.",
                "global.hint": "Estas configurações valem para todas as contas. No Full Access, envios por ferramentas que ainda exigem confirmação da extensão não exibem uma caixa de diálogo; use a aba Rascunhos para revisar e confirmar manualmente. As regras de destinatários bloqueados sempre se aplicam.",
                // card
                "card.unnamed": "(sem nome)",
                "card.noAddress": "(sem endereço de e-mail)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "Nenhum provedor",
                "card.setDefaultAs": "Definir como padrão: {name}",
                "card.renamedBadge": "Renomeada → será salva com o novo nome",
                "card.testMissingAddress": "Informe o endereço de e-mail desta conta antes de testar a conexão.",
                "card.pickDefault": "Há várias contas configuradas; escolha a conta padrão:",
                "card.errNoName": "Há uma conta sem nome; esta alteração não será salva.",
                "card.errNoProvider": "Há uma conta sem provedor selecionado; esta alteração não será salva.",
                "card.errDuplicateName": "Já existe outra conta com esse nome; renomeá-la a substituiria, então esta alteração não será salva.",
                "card.errReservedName": "Uma conta não pode se chamar defaultAccount (essa chave é reservada para a conta padrão); esta alteração não será salva.",
                "card.errNoDefault": "Há várias contas, mas nenhuma foi definida como padrão; esta alteração não será salva.",
                "card.yamlParseFailed": "Falha ao analisar accountsYaml: {error}",
                "card.confirmDelete": "Excluir a conta “{name}” também remove os dados de login salvos. As mensagens da caixa de correio não serão excluídas.",
                "card.nameLabel": "Nome da conta",
                "card.nameHint": "Use um nome como “Trabalho” para distinguir suas caixas de correio. A renomeação mantém as configurações existentes; defaultAccount é reservado.",
                "card.reservedNameWarn": "defaultAccount é uma chave reservada (indica a conta padrão); escolha outro nome.",
                "card.authKindLabel": "Autenticação",
                "card.authKindAuto": "Automática (definida pelo provedor)",
                "card.authKindOAuth2": "Login OAuth2 por código do dispositivo",
                "card.authKindPassword": "Senha / senha de aplicativo",
                "card.authKindHint": "Por padrão, o provedor determina o método. Escolha “Senha / senha de aplicativo” para um tenant que ainda aceite autenticação básica no Exchange Online (híbrido ou local, com SMTP AUTH habilitado); teste a conexão novamente após alterar.",
                "card.passwordSaved": "Já há uma senha salva: deixe o campo vazio para mantê-la ou apague-o e digite outra para substituí-la.",
                "card.passwordHint": "Informe o código de autorização ou a senha de aplicativo fornecida pelo provedor de e-mail e clique em “Testar conexão”.",
                "card.senderNameLabel": "Nome de exibição do remetente (opcional)",
                "card.senderNamePlaceholder": "Apenas o nome visto pelos destinatários",
                "card.senderNameHint": "Altera apenas o nome exibido aos destinatários; o endereço continua sendo o informado acima.",
                "card.authUserLabel": "Usuário de login (se diferente do endereço)",
                "card.authUserPlaceholder": "Vazio = entrar usando o endereço acima",
                "card.authUserHint": "Alias ou retransmissão: acima fica o endereço de envio; aqui, a conta usada para autenticação IMAP/SMTP. Deixe vazio se forem iguais.",
                "card.authPasswordLabel": "Senha do usuário de login (opcional)",
                "card.authPasswordSaved": "Há uma senha de login salva: deixe o campo vazio para mantê-la ou digite outra para substituí-la.",
                "card.authPasswordHint": "Deixe vazio para reutilizar o código de autorização ou a senha de aplicativo acima; só é necessário se o usuário de login tiver uma senha própria.",
                "card.inboxLabel": "Pasta de entrada (padrão: INBOX)",
                "card.autoSaveHint": " As alterações são salvas automaticamente.",
                "card.autoSaveHintNoDefault": " Há várias contas, mas nenhuma está definida como padrão; escolha uma primeiro.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Servidor personalizado (preenchimento manual)",
                "card.customServerHint": "Para um servidor de e-mail interno ou próprio: informe o servidor de entrada. O de saída usa o mesmo quando deixado em branco. Portas em branco usam os padrões (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "Servidor IMAP de entrada",
                "card.smtpServerLabel": "Servidor SMTP de saída (em branco = servidor de entrada)",
                "card.portLabel": "Porta",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "A conta de servidor personalizado ainda não tem servidor de entrada; esta alteração não será salva.",
                "preset.errReservedName": "Uma predefinição não pode se chamar “{name}”: esse valor é reservado para a opção de servidor personalizado. Escolha outro nome.",
                // oauth
                "oauth.clientIdLabel": "ID do aplicativo (cliente)",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "Deixe vazio para entrar com o aplicativo comunitário integrado à extensão (gratuito e pronto para usar): a tela de consentimento da Microsoft exibirá o nome do aplicativo do colaborador, e os registros de login ficarão no tenant dele. Para usar seu próprio ID de cliente público do Azure (Entra), com permissões delegadas IMAP/SMTP e fluxo de código do dispositivo habilitados, cole-o aqui; alterá-lo exige um novo login.",
                "oauth.clientIdMissing": "Esta versão não inclui um ID de aplicativo (cliente) integrado, então o login por código do dispositivo não pode ser iniciado. Registre um conforme a seção “Outlook OAuth2” do README e cole-o aqui.",
                "oauth.clientIdBuiltIn": "Login pela aplicação comunitária integrada à extensão: {id} (registrada pelo colaborador gurio-wine, que autorizou o uso integrado neste projeto). Se as políticas da empresa não permitirem aplicativos de terceiros, use o seu próprio.",
                "oauth.passwordless": "Este provedor usa autorização OAuth2, portanto não é necessária uma senha{label}.",
                "oauth.passwordlessLabel": " ({label})",
                "oauth.noUrl": "(o servidor não retornou uma URL de autorização; cancele e tente novamente)",
                "oauth.polling": "Aguardando… (verificação a cada {seconds} segundos; o link de autorização é válido por cerca de {minutes} minutos)",
                "oauth.unknownUser": "(conta desconhecida)",
                "oauth.loginOkAs": "Conectado: {user}",
                "oauth.badResponse": "O servidor retornou uma resposta não reconhecida",
                // preset
                "preset.cleared": "Cartões limpos: preencha os campos restantes para gravá-los novamente; os {count} predefinições serão excluídos.",
                "preset.badgeUnnamed": "Sem nome",
                "preset.badgeRenamed": "Renomeado → chave antiga excluída, nova criada",
                "preset.badgeDuplicate": "Duplicado",
                "preset.noHost": "(sem host)",
                "preset.endpointMissing": "Endpoint ausente",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " | smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · sem criptografia",
                "preset.confirmDelete": "Excluir a predefinição “{name}” deixará sem endpoints os cartões de conta que apontam para ela (e ela não será mais listada no seletor de provedores).",
                "preset.nameHint": "Não pode coincidir com um provedor integrado (qq/163/126/sina/aliyun/gmail/outlook/icloud), pois a predefinição integrada o ocultaria. Renomear exclui a chave antiga e cria uma nova.",
                "preset.duplicateWarn": "Já existe uma predefinição com esse nome: nomes de predefinições são chaves YAML e devem ser exclusivos.",
                "preset.labelLabel": "Rótulo exibido (chave label, opcional)",
                "preset.labelPlaceholder": "E-mail de trabalho",
                "preset.imapPortHint": "Deixe vazio para usar o padrão 993.",
                "preset.smtpPortHint": "Deixe vazio para usar o padrão 465.",
                "preset.portProblem": "{problem}.",
                "preset.yamlParseFailedHint": "Os cartões abaixo foram criados a partir da tabela de predefinições (vazia) do instantâneo, não deste texto. Edite o YAML abaixo para criar uma nova do zero.",
                "preset.footerHint": "Uma predefinição não contém endereço de e-mail nem senha, apenas parâmetros de conexão; uma conta armazena só o nome do provedor e expande os endpoints da predefinição ao conectar.",
                "preset.portNumeric": "A porta deve ser um número",
                "preset.portRange": "A porta deve estar entre 1 e 65535",
                "preset.errNoName": "Há uma predefinição sem nome (o nome é a chave YAML).",
                "preset.errDuplicate": "Dois cartões de predefinição têm o nome “{name}”: nomes de predefinições são chaves YAML e devem ser exclusivos.",
                "preset.errNoImapHost": "A predefinição “{name}” ainda não tem host IMAP.",
                "preset.errNoSmtpHost": "A predefinição “{name}” ainda não tem host SMTP.",
                "preset.errImapPort": "A predefinição “{name}” tem uma porta IMAP inválida: {problem}.",
                "preset.errSmtpPort": "A predefinição “{name}” tem uma porta SMTP inválida: {problem}.",
                // notice
                "notice.commentsDropped": "Os comentários foram removidos: o documento original não pode ser editado no local. ",
                "notice.passwordsDropped": "Algumas senhas salvas não puderam ser mantidas; digite-as novamente nos cartões correspondentes. ",
                "notice.restSaved": "Todo o restante foi salvo automaticamente.",
                "notice.cardsNotWritten": "Não foi possível gravar as alterações das contas no YAML: {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…e mais {count}; use email_watch / email_read para vê-los",
            },
            ru: {
                // common
                "common.confirmDelete": "Подтвердить удаление",
                "common.listSeparator": ", ",
                // section
                "section.readonly": "Хранилище настроек доступно только для чтения: настройки можно просматривать, но нельзя сохранять.",
                "section.activeAccounts": "Активные аккаунты: {accounts}",
                // provider
                "provider.qq": "QQ Mail",
                "provider.163": "163 Mail",
                "provider.126": "126 Mail",
                "provider.sina": "Sina Mail",
                "provider.aliyun": "Alibaba Mail",
                "provider.gmail": "Gmail",
                "provider.exmail": "Tencent Enterprise / WeCom Mail",
                "provider.outlook": "Outlook",
                "provider.icloud": "iCloud",
                "provider.custom": "Другой",
                "provider.noneInYaml": "Выберите почтового провайдера",
                "provider.undefinedPresetSuffix": "(неопределённая настройка)",
                // global
                "global.sendApprovalRisk": "При отключении отправка, ответы и пересылка по инициативе модели во всех аккаунтах будут обходить подтверждение этого плагина, в том числе для адресатов вне списка доверенных. Правила блокировки получателей и разрешения хоста продолжают действовать. Отправку черновиков по-прежнему нужно подтверждать вручную.",
                "global.downloadDirPlaceholder": "Оставьте пустым, чтобы использовать значение по умолчанию",
                "global.attachmentLimit": "Максимальный размер вложений",
                "global.attachmentCustom": "Свой лимит (MiB)",
                "global.attachmentHint": "По умолчанию 20 MiB. Общий размер исходных вложений в черновике может достигать 40 MiB, а в AgentMail — 4 MiB. Почтовый сервер может отдельно ограничивать размер закодированного письма.",
                "global.attachmentRange": "Введите значение от 1 KiB (0,0009765625 MiB) до 512 MiB.",
                "draft.attachmentCount": "В черновик можно добавить до 10 вложений.",
                "draft.attachmentTotal": "Общий размер вложений черновика не может превышать {size}.",
                "global.hint": "Эти настройки применяются ко всем аккаунтам. В режиме Full Access для отправок инструментами, которым всё ещё требуется подтверждение плагина, нельзя показать диалог; проверяйте и подтверждайте их вручную на вкладке «Черновики». Правила блокировки получателей действуют всегда.",
                // card
                "card.unnamed": "(без имени)",
                "card.noAddress": "(адрес электронной почты не указан)",
                "card.meta": "{address} · {folder} · {provider}",
                "card.noProvider": "Провайдер не выбран",
                "card.setDefaultAs": "Сделать аккаунт основным: {name}",
                "card.renamedBadge": "Переименован → будет сохранён под новым именем",
                "card.testMissingAddress": "Перед проверкой подключения укажите адрес электронной почты этого аккаунта.",
                "card.pickDefault": "Настроено несколько аккаунтов. Выберите аккаунт по умолчанию:",
                "card.errNoName": "У одного из аккаунтов не указано имя; изменения не будут сохранены.",
                "card.errNoProvider": "Для одного из аккаунтов не выбран провайдер; изменения не будут сохранены.",
                "card.errDuplicateName": "Аккаунт с таким именем уже существует. Переименование приведёт к перезаписи, поэтому изменения не будут сохранены.",
                "card.errReservedName": "Аккаунт не может называться defaultAccount (этот ключ зарезервирован для аккаунта по умолчанию); изменения не будут сохранены.",
                "card.errNoDefault": "Есть несколько аккаунтов, но аккаунт по умолчанию не выбран; изменения не будут сохранены.",
                "card.yamlParseFailed": "Не удалось разобрать accountsYaml: {error}",
                "card.confirmDelete": "При удалении аккаунта «{name}» также будут удалены сохранённые данные для входа. Письма в почтовом ящике не удаляются.",
                "card.nameLabel": "Имя аккаунта",
                "card.nameHint": "Используйте, например, имя «Рабочий», чтобы различать почтовые ящики. При переименовании настройки сохраняются; defaultAccount зарезервирован.",
                "card.reservedNameWarn": "defaultAccount — зарезервированный ключ (обозначает аккаунт по умолчанию); выберите другое имя.",
                "card.authKindLabel": "Способ аутентификации",
                "card.authKindAuto": "Автоматически (определяется провайдером)",
                "card.authKindOAuth2": "Вход OAuth2 с кодом устройства",
                "card.authKindPassword": "Пароль / пароль приложения",
                "card.authKindHint": "По умолчанию способ определяется провайдером. Выберите «Пароль / пароль приложения» для арендатора, который ещё принимает базовую аутентификацию в Exchange Online (гибридная или локальная среда, SMTP AUTH включён); после изменения повторно проверьте подключение.",
                "card.passwordSaved": "Пароль уже сохранён: оставьте поле пустым, чтобы сохранить его, или очистите поле и введите новый.",
                "card.passwordHint": "Введите код авторизации или пароль приложения, предоставленный почтовым провайдером, затем нажмите «Проверить соединение».",
                "card.senderNameLabel": "Отображаемое имя отправителя (необязательно)",
                "card.senderNamePlaceholder": "Только имя, которое видят получатели",
                "card.senderNameHint": "Изменится только имя, видимое получателям; адрес останется таким, как указан выше.",
                "card.authUserLabel": "Имя пользователя для входа (если отличается от адреса)",
                "card.authUserPlaceholder": "Пусто = вход с указанным выше адресом",
                "card.authUserHint": "Для псевдонима или ретрансляции: выше указывается адрес отправителя, здесь — аккаунт для аутентификации IMAP/SMTP. Если оставить поле пустым, адреса считаются одинаковыми.",
                "card.authPasswordLabel": "Пароль пользователя для входа (необязательно)",
                "card.authPasswordSaved": "Пароль для входа уже сохранён: оставьте поле пустым, чтобы сохранить его, или введите новый.",
                "card.authPasswordHint": "Оставьте поле пустым, чтобы использовать указанный выше код авторизации или пароль приложения. Заполняйте только если у пользователя для входа есть отдельный пароль.",
                "card.inboxLabel": "Папка входящих (по умолчанию INBOX)",
                "card.autoSaveHint": " Изменения сохраняются автоматически.",
                "card.autoSaveHintNoDefault": " Настроено несколько аккаунтов, но основной не выбран; сначала выберите его.",
                "card.builtinEndpoints": " · {imap} | {smtp}",
                "card.customEndpoint": " · {endpoint}",
                "provider.customServer": "Свой сервер (ручной ввод)",
                "card.customServerHint": "Для внутреннего или собственного почтового сервера: укажите сервер входящей почты. Сервер исходящей почты будет тем же, если оставить поле пустым. Пустые порты используют значения по умолчанию (IMAP 993 / SMTP 465).",
                "card.imapServerLabel": "IMAP-сервер входящей почты",
                "card.smtpServerLabel": "SMTP-сервер исходящей почты (пусто = сервер входящей)",
                "card.portLabel": "Порт",
                "card.tlsLabel": "SSL / TLS",
                "card.errNoCustomHost": "У аккаунта со своим сервером ещё не указан сервер входящей почты; изменение не сохраняется.",
                "preset.errReservedName": "Предустановка не может называться «{name}»: это значение зарезервировано для варианта «свой сервер». Укажите другое имя.",
                // oauth
                "oauth.clientIdLabel": "Идентификатор приложения (клиента)",
                "oauth.clientIdPlaceholder": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                "oauth.clientIdHint": "Оставьте поле пустым, чтобы войти через встроенное приложение сообщества (бесплатно, настройка не требуется): на экране согласия Microsoft будет указано приложение участника, а журналы входа попадут в его tenant. Чтобы использовать собственный общедоступный идентификатор клиента Azure (Entra) с делегированными разрешениями IMAP/SMTP и включённым потоком кода устройства, вставьте его сюда; после изменения потребуется войти заново.",
                "oauth.clientIdMissing": "В этой сборке нет встроенного идентификатора приложения (клиента), поэтому вход с кодом устройства невозможен. Зарегистрируйте его по инструкции в разделе «Outlook OAuth2» файла README и вставьте сюда.",
                "oauth.clientIdBuiltIn": "Вход через встроенное приложение сообщества: {id} (зарегистрировано участником gurio-wine, который разрешил встроенное использование в этом проекте). Если политика организации запрещает сторонние приложения, используйте собственное.",
                "oauth.passwordless": "Этот провайдер использует авторизацию OAuth2, поэтому пароль не требуется{label}.",
                "oauth.passwordlessLabel": " ({label})",
                "oauth.noUrl": "(сервер не вернул URL авторизации; отмените операцию и попробуйте снова)",
                "oauth.polling": "Ожидание… (проверка каждые {seconds} сек.; ссылка авторизации действительна около {minutes} мин.)",
                "oauth.unknownUser": "(неизвестный аккаунт)",
                "oauth.loginOkAs": "Вход выполнен: {user}",
                "oauth.badResponse": "Сервер вернул нераспознанный ответ",
                // preset
                "preset.cleared": "Карточки очищены: заполните оставшиеся поля, чтобы записать их заново; все настройки ({count}) будут удалены.",
                "preset.badgeUnnamed": "Без имени",
                "preset.badgeRenamed": "Переименовано → старый ключ удалён, создан новый",
                "preset.badgeDuplicate": "Дубликат",
                "preset.noHost": "(хост не указан)",
                "preset.endpointMissing": "Конечная точка не указана",
                "preset.metaImap": "imap {host}:{port}",
                "preset.metaSmtp": " | smtp {host}:{port}",
                "preset.ssl": " · SSL",
                "preset.plain": " · без шифрования",
                "preset.confirmDelete": "После удаления настройки «{name}» у связанных аккаунтов не будет конечных точек (и она исчезнет из списка провайдеров).",
                "preset.nameHint": "Имя не может совпадать со встроенным провайдером (qq/163/126/sina/aliyun/gmail/outlook/icloud), иначе встроенная настройка скроет его. При переименовании старый ключ удаляется и создаётся новый.",
                "preset.duplicateWarn": "Настройка с таким именем уже существует: имена настроек являются ключами YAML и должны быть уникальными.",
                "preset.labelLabel": "Отображаемая метка (ключ label, необязательно)",
                "preset.labelPlaceholder": "Рабочая почта",
                "preset.imapPortHint": "Оставьте пустым, чтобы использовать значение по умолчанию 993.",
                "preset.smtpPortHint": "Оставьте пустым, чтобы использовать значение по умолчанию 465.",
                "preset.portProblem": "{problem}.",
                "preset.yamlParseFailedHint": "Карточки ниже созданы из (пустой) таблицы настроек в снимке, а не из этого текста. Отредактируйте YAML ниже, чтобы создать новую таблицу с нуля.",
                "preset.footerHint": "Настройка не содержит адреса почты и пароля, только параметры подключения; аккаунт хранит лишь имя провайдера и при подключении получает конечные точки из настройки.",
                "preset.portNumeric": "Порт должен быть числом",
                "preset.portRange": "Порт должен быть от 1 до 65535",
                "preset.errNoName": "У настройки не указано имя (имя настройки — ключ YAML).",
                "preset.errDuplicate": "Две карточки настроек имеют имя «{name}»: имена настроек — ключи YAML и должны быть уникальными.",
                "preset.errNoImapHost": "В настройке «{name}» не указан хост IMAP.",
                "preset.errNoSmtpHost": "В настройке «{name}» не указан хост SMTP.",
                "preset.errImapPort": "В настройке «{name}» указан недопустимый порт IMAP: {problem}.",
                "preset.errSmtpPort": "В настройке «{name}» указан недопустимый порт SMTP: {problem}.",
                // notice
                "notice.commentsDropped": "Комментарии удалены: исходный документ нельзя редактировать на месте. ",
                "notice.passwordsDropped": "Некоторые сохранённые пароли не удалось сохранить; введите их заново в соответствующих карточках. ",
                "notice.restSaved": "Остальные изменения сохранены автоматически.",
                "notice.cardsNotWritten": "Не удалось записать изменения аккаунтов в YAML: {message}",
                // whale
                "whale.row": "{who} · {subject}",
                "whale.more": "…и ещё {count}; используйте email_watch / email_read для просмотра",
            },
        };
        // Every supported locale ships a complete table: the primary overrides plus
        // this completion layer. Any key that still has no translation deliberately
        // falls back to English instead of surfacing a missing-key identifier, and
        // test/client-locale.test.mjs fails if the completion layer falls behind UI.en.
        for (const language of ["es", "fr", "de", "ja", "pt", "ru"]) {
            const overrides = Object.assign({}, UI_LOCALE_OVERRIDES[language], UI_LOCALE_COMPLETION[language]);
            for (const key of Object.keys(UI.en))
                if (!Object.prototype.hasOwnProperty.call(overrides, key)) overrides[key] = UI.en[key];
            UI[language] = Object.assign({}, UI.en, overrides);
        }
        const INLINE_LOCALE_OVERRIDES = {
            es: { "Cancel": "Cancelar", "Retry": "Reintentar", "Delete": "Eliminar", "Close": "Cerrar", "Search": "Buscar", "Refresh mail": "Actualizar correo", "Clear search": "Borrar búsqueda", "Unread only": "Solo no leídos", "Inbox": "Bandeja de entrada", "Sent": "Enviados", "Trash": "Papelera", "All folders": "Todas las carpetas", "Manage folders": "Administrar carpetas", "Account": "Cuenta", "Mail folders": "Carpetas de correo", "Back to messages": "Volver a los mensajes", "Loading messages…": "Cargando mensajes…", "Loading message…": "Cargando mensaje…", "Select a message": "Selecciona un mensaje", "No messages on this page.": "No hay mensajes en esta página.", "Previous page": "Página anterior", "Next page": "Página siguiente", "Email drafts": "Borradores de correo", "Local drafts": "Borradores locales", "Refresh list": "Actualizar lista", "Save draft": "Guardar borrador", "Confirm send": "Confirmar envío", "Cancel review": "Cancelar revisión", "Email features": "Funciones de correo", "Mailbox": "Buzón", "Drafts": "Borradores", "Accounts": "Cuentas", "Recipient rules": "Reglas de destinatarios", "Mail tasks": "Tareas de correo", "Compose": "Redactar", "Email": "Correo", "Read, reply and manage drafts.": "Lee, responde y administra borradores.", "From: ": "De: ", "Subject: ": "Asunto: ", "To: ": "Para: ", "Attachments": "Adjuntos", "Download attachment": "Descargar adjunto", "Reply in drafts": "Responder en borradores", "Reply all in drafts": "Responder a todos en borradores", "Not sent": "No enviado", "Scheduled": "Programado", "Submitting…": "Enviando…", "Confirm scheduled send": "Confirmar envío programado", "No attachments": "Sin adjuntos", "Review before sending": "Revisar antes de enviar", "Needs confirmation": "Requiere confirmación", "No match": "Sin coincidencia", "Check matches (no email sent)": "Comprobar coincidencias (no se envía correo)", "Mail-triggered tasks": "Tareas activadas por correo", "Receiving account": "Cuenta receptora", "Receiving folder": "Carpeta receptora", "Enable mail tasks": "Activar tareas de correo", "Save task settings": "Guardar configuración de tareas", "Check now": "Comprobar ahora", "Task records": "Registros de tareas" },
            fr: { "Cancel": "Annuler", "Retry": "Réessayer", "Delete": "Supprimer", "Close": "Fermer", "Search": "Rechercher", "Refresh mail": "Actualiser les e-mails", "Clear search": "Effacer la recherche", "Unread only": "Non lus uniquement", "Inbox": "Boîte de réception", "Sent": "Envoyés", "Trash": "Corbeille", "All folders": "Tous les dossiers", "Manage folders": "Gérer les dossiers", "Account": "Compte", "Mail folders": "Dossiers de messagerie", "Back to messages": "Retour aux messages", "Loading messages…": "Chargement des messages…", "Loading message…": "Chargement du message…", "Select a message": "Sélectionnez un message", "No messages on this page.": "Aucun message sur cette page.", "Previous page": "Page précédente", "Next page": "Page suivante", "Email drafts": "Brouillons d’e-mails", "Local drafts": "Brouillons locaux", "Refresh list": "Actualiser la liste", "Save draft": "Enregistrer le brouillon", "Confirm send": "Confirmer l’envoi", "Cancel review": "Annuler la vérification", "Email features": "Fonctions e-mail", "Mailbox": "Boîte aux lettres", "Drafts": "Brouillons", "Accounts": "Comptes", "Recipient rules": "Règles de destinataires", "Mail tasks": "Tâches de messagerie", "Compose": "Rédiger", "Email": "E-mail", "Read, reply and manage drafts.": "Lisez, répondez et gérez les brouillons.", "From: ": "De : ", "Subject: ": "Objet : ", "To: ": "À : ", "Attachments": "Pièces jointes", "Download attachment": "Télécharger la pièce jointe", "Reply in drafts": "Répondre dans les brouillons", "Reply all in drafts": "Répondre à tous dans les brouillons", "Not sent": "Non envoyé", "Scheduled": "Planifié", "Submitting…": "Envoi…", "Confirm scheduled send": "Confirmer l’envoi planifié", "No attachments": "Aucune pièce jointe", "Review before sending": "Vérifier avant l’envoi", "Needs confirmation": "Confirmation requise", "No match": "Aucune correspondance", "Check matches (no email sent)": "Vérifier les correspondances (aucun envoi)", "Mail-triggered tasks": "Tâches déclenchées par e-mail", "Receiving account": "Compte de réception", "Receiving folder": "Dossier de réception", "Enable mail tasks": "Activer les tâches de messagerie", "Save task settings": "Enregistrer les paramètres", "Check now": "Vérifier maintenant", "Task records": "Historique des tâches" },
            de: { "Cancel": "Abbrechen", "Retry": "Erneut versuchen", "Delete": "Löschen", "Close": "Schließen", "Search": "Suchen", "Refresh mail": "E-Mail aktualisieren", "Clear search": "Suche löschen", "Unread only": "Nur ungelesene", "Inbox": "Posteingang", "Sent": "Gesendet", "Trash": "Papierkorb", "All folders": "Alle Ordner", "Manage folders": "Ordner verwalten", "Account": "Konto", "Mail folders": "E-Mail-Ordner", "Back to messages": "Zurück zu Nachrichten", "Loading messages…": "Nachrichten werden geladen…", "Loading message…": "Nachricht wird geladen…", "Select a message": "Nachricht auswählen", "No messages on this page.": "Keine Nachrichten auf dieser Seite.", "Previous page": "Vorherige Seite", "Next page": "Nächste Seite", "Email drafts": "E-Mail-Entwürfe", "Local drafts": "Lokale Entwürfe", "Refresh list": "Liste aktualisieren", "Save draft": "Entwurf speichern", "Confirm send": "Senden bestätigen", "Cancel review": "Prüfung abbrechen", "Email features": "E-Mail-Funktionen", "Mailbox": "Postfach", "Drafts": "Entwürfe", "Accounts": "Konten", "Recipient rules": "Empfängerregeln", "Mail tasks": "E-Mail-Aufgaben", "Compose": "Verfassen", "Email": "E-Mail", "Read, reply and manage drafts.": "E-Mails lesen, beantworten und Entwürfe verwalten.", "From: ": "Von: ", "Subject: ": "Betreff: ", "To: ": "An: ", "Attachments": "Anhänge", "Download attachment": "Anhang herunterladen", "Reply in drafts": "In Entwürfen antworten", "Reply all in drafts": "Allen in Entwürfen antworten", "Not sent": "Nicht gesendet", "Scheduled": "Geplant", "Submitting…": "Wird gesendet…", "Confirm scheduled send": "Geplantes Senden bestätigen", "No attachments": "Keine Anhänge", "Review before sending": "Vor dem Senden prüfen", "Needs confirmation": "Bestätigung erforderlich", "No match": "Keine Übereinstimmung", "Check matches (no email sent)": "Übereinstimmungen prüfen (keine E-Mail)", "Mail-triggered tasks": "E-Mail-Aufgaben", "Receiving account": "Empfangskonto", "Receiving folder": "Empfangsordner", "Enable mail tasks": "E-Mail-Aufgaben aktivieren", "Save task settings": "Aufgabeneinstellungen speichern", "Check now": "Jetzt prüfen", "Task records": "Aufgabenprotokoll" },
            ja: { "Cancel": "キャンセル", "Retry": "再試行", "Delete": "削除", "Close": "閉じる", "Search": "検索", "Refresh mail": "メールを更新", "Clear search": "検索をクリア", "Unread only": "未読のみ", "Inbox": "受信トレイ", "Sent": "送信済み", "Trash": "ゴミ箱", "All folders": "すべてのフォルダー", "Manage folders": "フォルダーを管理", "Account": "アカウント", "Mail folders": "メールフォルダー", "Back to messages": "メッセージに戻る", "Loading messages…": "メッセージを読み込み中…", "Loading message…": "メッセージを読み込み中…", "Select a message": "メッセージを選択", "No messages on this page.": "このページにメッセージはありません。", "Previous page": "前のページ", "Next page": "次のページ", "Email drafts": "メール下書き", "Local drafts": "ローカル下書き", "Refresh list": "一覧を更新", "Save draft": "下書きを保存", "Confirm send": "送信を確認", "Cancel review": "確認をキャンセル", "Email features": "メール機能", "Mailbox": "メールボックス", "Drafts": "下書き", "Accounts": "アカウント", "Recipient rules": "宛先ルール", "Mail tasks": "メールタスク", "Compose": "作成", "Email": "メール", "Read, reply and manage drafts.": "メールを読み、返信し、下書きを管理します。", "From: ": "差出人: ", "Subject: ": "件名: ", "To: ": "宛先: ", "Attachments": "添付ファイル", "Download attachment": "添付ファイルをダウンロード", "Reply in drafts": "下書きで返信", "Reply all in drafts": "下書きで全員に返信", "Not sent": "未送信", "Scheduled": "予約済み", "Submitting…": "送信中…", "Confirm scheduled send": "予約送信を確認", "No attachments": "添付ファイルなし", "Review before sending": "送信前に確認", "Needs confirmation": "確認が必要", "No match": "一致なし", "Check matches (no email sent)": "一致を確認（送信なし）", "Mail-triggered tasks": "メール起動タスク", "Receiving account": "受信アカウント", "Receiving folder": "受信フォルダー", "Enable mail tasks": "メールタスクを有効化", "Save task settings": "タスク設定を保存", "Check now": "今すぐ確認", "Task records": "タスク記録" },
            pt: { "Cancel": "Cancelar", "Retry": "Tentar novamente", "Delete": "Excluir", "Close": "Fechar", "Search": "Pesquisar", "Refresh mail": "Atualizar e-mail", "Clear search": "Limpar pesquisa", "Unread only": "Apenas não lidos", "Inbox": "Caixa de entrada", "Sent": "Enviados", "Trash": "Lixeira", "All folders": "Todas as pastas", "Manage folders": "Gerenciar pastas", "Account": "Conta", "Mail folders": "Pastas de e-mail", "Back to messages": "Voltar às mensagens", "Loading messages…": "Carregando mensagens…", "Loading message…": "Carregando mensagem…", "Select a message": "Selecione uma mensagem", "No messages on this page.": "Não há mensagens nesta página.", "Previous page": "Página anterior", "Next page": "Próxima página", "Email drafts": "Rascunhos de e-mail", "Local drafts": "Rascunhos locais", "Refresh list": "Atualizar lista", "Save draft": "Salvar rascunho", "Confirm send": "Confirmar envio", "Cancel review": "Cancelar revisão", "Email features": "Funções de e-mail", "Mailbox": "Caixa de correio", "Drafts": "Rascunhos", "Accounts": "Contas", "Recipient rules": "Regras de destinatários", "Mail tasks": "Tarefas de e-mail", "Compose": "Redigir", "Email": "E-mail", "Read, reply and manage drafts.": "Leia, responda e gerencie rascunhos.", "From: ": "De: ", "Subject: ": "Assunto: ", "To: ": "Para: ", "Attachments": "Anexos", "Download attachment": "Baixar anexo", "Reply in drafts": "Responder nos rascunhos", "Reply all in drafts": "Responder a todos nos rascunhos", "Not sent": "Não enviado", "Scheduled": "Agendado", "Submitting…": "Enviando…", "Confirm scheduled send": "Confirmar envio agendado", "No attachments": "Sem anexos", "Review before sending": "Revisar antes de enviar", "Needs confirmation": "Requer confirmação", "No match": "Sem correspondência", "Check matches (no email sent)": "Verificar correspondências (nenhum e-mail)", "Mail-triggered tasks": "Tarefas acionadas por e-mail", "Receiving account": "Conta de recebimento", "Receiving folder": "Pasta de recebimento", "Enable mail tasks": "Ativar tarefas de e-mail", "Save task settings": "Salvar configurações", "Check now": "Verificar agora", "Task records": "Registros de tarefas" },
            ru: { "Cancel": "Отмена", "Retry": "Повторить", "Delete": "Удалить", "Close": "Закрыть", "Search": "Поиск", "Refresh mail": "Обновить почту", "Clear search": "Очистить поиск", "Unread only": "Только непрочитанные", "Inbox": "Входящие", "Sent": "Отправленные", "Trash": "Корзина", "All folders": "Все папки", "Manage folders": "Управление папками", "Account": "Аккаунт", "Mail folders": "Почтовые папки", "Back to messages": "Назад к письмам", "Loading messages…": "Загрузка писем…", "Loading message…": "Загрузка письма…", "Select a message": "Выберите письмо", "No messages on this page.": "На этой странице нет писем.", "Previous page": "Предыдущая страница", "Next page": "Следующая страница", "Email drafts": "Черновики писем", "Local drafts": "Локальные черновики", "Refresh list": "Обновить список", "Save draft": "Сохранить черновик", "Confirm send": "Подтвердить отправку", "Cancel review": "Отменить проверку", "Email features": "Возможности почты", "Mailbox": "Почтовый ящик", "Drafts": "Черновики", "Accounts": "Аккаунты", "Recipient rules": "Правила получателей", "Mail tasks": "Почтовые задачи", "Compose": "Написать", "Email": "Почта", "Read, reply and manage drafts.": "Читайте, отвечайте и управляйте черновиками.", "From: ": "От: ", "Subject: ": "Тема: ", "To: ": "Кому: ", "Attachments": "Вложения", "Download attachment": "Скачать вложение", "Reply in drafts": "Ответить в черновике", "Reply all in drafts": "Ответить всем в черновике", "Not sent": "Не отправлено", "Scheduled": "Запланировано", "Submitting…": "Отправка…", "Confirm scheduled send": "Подтвердить запланированную отправку", "No attachments": "Нет вложений", "Review before sending": "Проверить перед отправкой", "Needs confirmation": "Требуется подтверждение", "No match": "Нет совпадений", "Check matches (no email sent)": "Проверить совпадения (без отправки)", "Mail-triggered tasks": "Задачи, запущенные письмом", "Receiving account": "Аккаунт получения", "Receiving folder": "Папка получения", "Enable mail tasks": "Включить почтовые задачи", "Save task settings": "Сохранить настройки задач", "Check now": "Проверить сейчас", "Task records": "Журнал задач" },
        };
        // The inline phrases that the first-pass table did not cover. dt() texts are
        // the mailbox workbench's own copy, so a translated UI would still fall back
        // to English without this layer. Keys are the exact English source strings:
        // leading/trailing spaces join concatenated fragments and must not move.
        const INLINE_LOCALE_COMPLETION = {
            es: {
                "System folders": "Carpetas del sistema",
                "Custom folders": "Carpetas personalizadas",
                "Confirm empty": "Confirmar vaciado",
                "Protected": "Protegida",
                "Raw headers": "Cabeceras originales",
                "Header fields": "Campos de cabecera",
                "Parsed fields from the mail service": "Campos interpretados por el servicio de correo",
                "Message list": "Lista de mensajes",
                "With attachments on this page": "Adjuntos en esta página",
                "No messages with attachments on this page": "No hay mensajes con adjuntos en esta página",
                "Safe preview": "Vista previa segura",
                "HTML body": "Cuerpo HTML",
                "Plain-text alternative (optional)": "Versión en texto plano (opcional)",
                "Message": "Mensaje",
                "Subject": "Asunto",
                "Recipients To": "Destinatarios (Para)",
                "Copy Cc": "Copia (Cc)",
                "Discard edits and close": "Descartar cambios y cerrar",
                "Save and close": "Guardar y cerrar",
                "Enter the custom proxy URL.": "Escribe la dirección del proxy personalizado.",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Crea un cliente OAuth de tipo «Desktop app» en Google Cloud, habilita el consentimiento de Gmail y añade tu cuenta como usuario de prueba. El inicio de sesión se completa en el navegador; no hace falta la contraseña del buzón.",
                "Google client secret (if issued)": "Secreto de cliente de Google (si se emitió)",
                "Saved; leave unchanged to keep": "Guardado; déjalo igual para conservarlo",
                "Open Google authorization; this panel updates after sign-in.": "Abre la autorización de Google; este panel se actualiza al iniciar sesión.",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Introduce el ID de cliente de tu aplicación de escritorio de Google. Las contraseñas de aplicación siguen disponibles si la política de tu cuenta lo permite.",
                "Sign in with Google": "Iniciar sesión con Google",
                "API connected · ": "API conectada · ",
                "POP3 connected · ": "POP3 conectado · ",
                "; SMTP sending was not tested": "; no se probó el envío por SMTP",
                "Incoming protocol": "Protocolo de recepción",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "POP3 lee la bandeja de entrada y usa SMTP para enviar. No hay marcas de leído/destacado ni carpeta de Enviados en el servidor; la búsqueda indica su cobertura.",
                "POP3 incoming server": "Servidor de entrada POP3",
                "SMTP outgoing server (optional for receiving)": "Servidor de salida SMTP (opcional para recibir)",
                "POP3 host": "Host POP3",
                "SMTP host": "Host SMTP",
                "POP3 port": "Puerto POP3",
                "SMTP port": "Puerto SMTP",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "TLS está desactivado: el inicio de sesión y el contenido POP3 viajan sin cifrar. Úsalo solo con un servidor de confianza donde el texto plano sea intencionado. Esto no es STARTTLS.",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "Google OAuth requiere tu propio cliente de aplicación de escritorio; la disponibilidad de contraseñas de aplicación depende de la política de la cuenta.",
                "Connection routing": "Enrutamiento de la conexión",
                "Follow global or environment settings": "Seguir la configuración global o del entorno",
                "Connect directly (ignore proxies)": "Conectar directamente (ignorar proxies)",
                "Custom proxy": "Proxy personalizado",
                "Custom proxy URL": "Dirección del proxy personalizado",
                "Saved; leave blank to retain": "Guardado; déjalo vacío para conservarlo",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "Se aplica a IMAP y SMTP. Compatible con HTTP CONNECT, HTTPS y SOCKS. Las direcciones guardadas pueden contener contraseñas y no se muestran. La recepción POP3 sigue conectando directamente.",
                "API key; leave blank to retain saved key": "Clave de API; déjala vacía para conservar la guardada",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "Usa una clave de API de la consola de AgentMail. La clave se guarda en la configuración local de la cuenta; el backend de DSH llama a la región seleccionada.",
                "Mailbox action failed": "La operación del buzón ha fallado",
                "Mailbox workbench": "Área de trabajo del buzón",
                "Moved ": "Se han movido ",
                " messages to ": " mensajes a ",
                "Undo move": "Deshacer el movimiento",
                "To restore, move the messages back in your mail client.": "Para restaurarlos, vuelve a mover los mensajes en tu cliente de correo.",
                "Dismiss": "Descartar",
                "Check account settings": "Revisar la configuración de la cuenta",
                "Loading accounts…": "Cargando cuentas…",
                "Mailbox unavailable": "Buzón no disponible",
                "Connect your mailbox": "Conecta tu buzón",
                "Account settings": "Configuración de la cuenta",
                "Add and test an email account to read and reply here.": "Añade y prueba una cuenta de correo para leer y responder aquí.",
                "Accounts and folders": "Cuentas y carpetas",
                "Search current folder": "Buscar en la carpeta actual",
                "Trash is unavailable for this protocol; delete in your mail client.": "La papelera no está disponible con este protocolo; elimina los mensajes en tu cliente de correo.",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "Bandeja POP3 · No hay marcas de leído/destacado ni carpeta de Enviados. Las respuestas se abren en Borradores locales y se envían por SMTP tras confirmarlas.",
                "Select page": "Seleccionar página",
                "Move to Trash (": "Mover a la papelera (",
                ")": ")",
                "Select message: ": "Seleccionar mensaje: ",
                "Unread": "No leído",
                "(No subject)": "(Sin asunto)",
                "Messages could not be loaded": "No se pudieron cargar los mensajes",
                "No results in the current search window.": "No hay resultados en el rango de búsqueda actual.",
                "This page: ": "Esta página: ",
                " messages": " mensajes",
                " · Ranked by relevance": " · Ordenado por relevancia",
                " · Mailbox arrival order": " · Orden de llegada al buzón",
                "Add and test an account in settings to browse mail.": "Añade y prueba una cuenta en la configuración para explorar el correo.",
                "Headers scanned: ": "Encabezados escaneados: ",
                "; headers fully covered; body search has a separate limit.": "; los encabezados están completos; la búsqueda en el cuerpo tiene otro límite.",
                "; folder coverage is partial.": "; la cobertura de la carpeta es parcial.",
                "Bodies scanned: ": "Cuerpos escaneados: ",
                " messages; limit ": " mensajes; límite ",
                "; bounded by the body display limit.": "; limitado por el máximo de visualización del cuerpo.",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "AgentMail ordena los resultados por relevancia y excluye el spam, la papelera y otros correos protegidos.",
                "Page ": "Página ",
                "": "",
                "Search older headers": "Buscar encabezados más antiguos",
                "This message could not be loaded": "No se pudo cargar este mensaje",
                "Open a message to reply in drafts, mark its state or download attachments.": "Abre un mensaje para responder desde borradores, marcar su estado o descargar adjuntos.",
                "Email action failed": "La operación de correo ha fallado",
                "View plain-text alternative": "Ver la alternativa en texto plano",
                "Submitting / check mailbox": "Enviando / comprueba el buzón",
                "Server receipt saved": "Recibo del servidor guardado",
                "Outcome uncertain, check mailbox": "Resultado incierto, comprueba el buzón",
                "Draft saved. No email was sent.": "Borrador guardado. No se envió ningún correo.",
                "Scheduled for: ": "Programado para: ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "Hay un destinatario bloqueado. Cambia el borrador o las reglas de destinatarios antes de enviar.",
                "Blocked: ": "Bloqueado: ",
                "Matches a trusted rule": "Coincide con una regla de confianza",
                "(Empty body)": "(Cuerpo vacío)",
                "Download to check": "Descargar para comprobar",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "Los adjuntos quedan fijados a esta vista previa. Vuelve a revisar tras 10 minutos o si cambian el borrador, la cuenta o las reglas.",
                "I checked the sender, all recipients, content and attachments": "He revisado el remitente, todos los destinatarios, el contenido y los adjuntos",
                "Review cancelled. No email was sent.": "Revisión cancelada. No se envió ningún correo.",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "Los borradores se quedan en este dispositivo. Pide al modelo que prepare uno con email_draft y luego edítalo, guárdalo y confírmalo aquí.",
                "The current draft has unsaved edits.": "El borrador actual tiene cambios sin guardar.",
                "Save and switch": "Guardar y cambiar",
                "Discard edits and switch": "Descartar cambios y cambiar",
                "Keep editing": "Seguir editando",
                "Reopen saved version": "Reabrir la versión guardada",
                "Back to drafts": "Volver a los borradores",
                "Untitled draft": "Borrador sin título",
                "No account selected": "Ninguna cuenta seleccionada",
                "Unsaved": "Sin guardar",
                "No drafts yet": "Todavía no hay borradores",
                "Choose Compose above to begin.": "Pulsa «Redactar» arriba para empezar.",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "Este borrador responde en el hilo original e incluye una copia citada. Escribe encima de la cita, revisa y confirma antes de enviar.",
                "Unsaved edits": "Cambios sin guardar",
                "Send time: ": "Hora de envío: ",
                "Cancel schedule and return to draft": "Cancelar la programación y volver al borrador",
                "Sending account": "Cuenta de envío",
                "Choose an account": "Elige una cuenta",
                "Schedule (optional, this device’s timezone)": "Programar (opcional, zona horaria de este dispositivo)",
                "Scheduled send time": "Hora de envío programada",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "Mantén DSH en ejecución. Las horas perdidas mientras está cerrado no se envían al reiniciar; los envíos inciertos nunca se reintentan automáticamente.",
                "Body format": "Formato del cuerpo",
                "Plain text": "Texto plano",
                "Formatted HTML": "HTML con formato",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "Previsualiza y envía formato seguro. Si omites el texto plano, se genera. Se eliminan scripts e imágenes externas.",
                "Remove attachment ": "Quitar el adjunto ",
                "Remove": "Quitar",
                "Add attachments (save edits first; up to 10 files / ": "Añadir adjuntos (guarda antes los cambios; hasta 10 archivos / ",
                " total)": " en total)",
                "Add attachments": "Añadir adjuntos",
                "Attachment exceeds ": "El adjunto supera ",
                "Attachments added. Review before sending.": "Adjuntos añadidos. Revísalos antes de enviar.",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "El servidor rechazó algunas direcciones. Este correo no se reintentará automáticamente. Aceptados por el servidor: ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "Recibo del servidor guardado. Este borrador no se enviará de nuevo. Aceptados por el servidor: ",
                "none": "ninguno",
                "Server rejected: ": "El servidor rechazó: ",
                "This confirms the server response, not delivery to the recipient inbox.": "Esto confirma la respuesta del servidor, no la entrega en la bandeja del destinatario.",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "Aún no hay recibo. Comprueba tu buzón y luego actualiza la lista. No lo envíes otra vez.",
                "Copy to a new draft": "Copiar a un borrador nuevo",
                "Delete local draft": "Eliminar el borrador local",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "Copia el contenido y los adjuntos en un borrador nuevo sin enviar. Si el original se envió o su resultado es incierto, comprueba antes el buzón.",
                "Confirm copy": "Confirmar copia",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "Elimina este borrador local y las copias subidas por el complemento. Los archivos originales y los mensajes del buzón no se modifican.",
                "Confirm delete": "Confirmar eliminación",
                "Select a draft or create one to start editing.": "Selecciona un borrador o crea uno para empezar a editar.",
                "Rules saved for this account.": "Reglas guardadas para esta cuenta.",
                "Trusted recipients": "Destinatarios de confianza",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "La confirmación es lo predeterminado. Si se activa, email_send omite la confirmación del complemento solo cuando todas las direcciones To/Cc coinciden con las reglas de esta cuenta. Los permisos del host siguen aplicándose y los borradores requieren confirmación manual. Las reglas de dominio excluyen los subdominios.",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "Los destinatarios bloqueados prevalecen sobre las reglas de confianza, incluso con la confirmación desactivada. Los bloqueos también se aplican a borradores, respuestas y reenvíos. Los dominios bloqueados coinciden exactamente y excluyen los subdominios.",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "La omisión en respuestas de confianza está desactivada por defecto y se activa en los ajustes de conexión. Comprueba todos los To/Cc reales en respuestas, responder a todos y reenvíos; cualquier destinatario no coincidente sigue necesitando confirmación. Si Full Access no puede mostrar un aviso, usa Borradores para revisar manualmente.",
                "Global send approval is off; blocked-recipient rules still apply.": "La confirmación global de envío está desactivada; las reglas de destinatarios bloqueados siguen aplicándose.",
                "Account for these rules": "Cuenta de estas reglas",
                "Choose a configured account": "Elige una cuenta configurada",
                "Rules have unsaved edits.": "Las reglas tienen cambios sin guardar.",
                "Trusted email addresses (one per line)": "Direcciones de correo de confianza (una por línea)",
                "Trusted domains (one per line, all mailboxes in that domain)": "Dominios de confianza (uno por línea, todos los buzones del dominio)",
                "Blocked email addresses (one per line)": "Direcciones de correo bloqueadas (una por línea)",
                "Blocked domains (one per line)": "Dominios bloqueados (uno por línea)",
                "Skip plugin approval for email_send when all addresses match": "Omitir la confirmación del complemento para email_send cuando todas las direcciones coincidan",
                "Save rules for this account": "Guardar las reglas de esta cuenta",
                "Reload rules": "Recargar las reglas",
                "Unsaved; matching uses the rules you are editing.": "Sin guardar; la comprobación usa las reglas que estás editando.",
                "Only saved rules affect model-initiated sends.": "Solo las reglas guardadas afectan a los envíos iniciados por el modelo.",
                "Try recipients To": "Probar destinatarios To",
                "Try copy Cc": "Probar copia Cc",
                "A recipient is blocked; sending is refused.": "Hay un destinatario bloqueado; se rechaza el envío.",
                "All To/Cc match; plugin approval can be skipped.": "Todos los To/Cc coinciden; se puede omitir la confirmación del complemento.",
                "Plugin approval will remain.": "La confirmación del complemento se mantendrá.",
                "Match: ": "Coincidencia: ",
                "Task operation failed": "La operación de la tarea ha fallado",
                "Loading mail tasks…": "Cargando tareas de correo…",
                "Each line: alias = absolute path to an existing folder": "Cada línea: alias = ruta absoluta a una carpeta existente",
                "Duplicate workspace alias": "Alias de espacio de trabajo duplicado",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "Guardado. La primera comprobación solo crea un punto de partida; solo el correo posterior puede activar tareas.",
                "Starting": "Iniciando",
                "Running": "En ejecución",
                "Waiting for your input in DSH": "Esperando tu confirmación en DSH",
                "Completed": "Completada",
                "Needs attention": "Requiere atención",
                "Submitting reply": "Enviando la respuesta",
                "Replied": "Respondida",
                "Mail outcome uncertain; check sent mail": "Resultado del envío incierto; revisa los enviados",
                "Turn email into a DSH task": "Convierte el correo en una tarea de DSH",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "Envía una tarea desde un buzón autorizado a un espacio de trabajo aprobado y continúa la misma sesión por correo. Desactivado por defecto. Las tareas usan tu modelo y pueden generar consumo; los permisos de DSH siguen requiriendo tu confirmación.",
                "Native task services are unavailable; update DSH to use this feature.": "Los servicios de tareas nativos no están disponibles; actualiza DSH para usar esta función.",
                "Task subject prefix": "Prefijo del asunto de la tarea",
                "Allowed senders (one per line; empty means the mailbox itself)": "Remitentes permitidos (uno por línea; vacío significa el propio buzón)",
                "Workspace aliases (each line: alias = absolute folder path)": "Alias de espacios de trabajo (cada línea: alias = ruta absoluta de carpeta)",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "Las tareas solo pueden usar los alias guardados. Las sesiones existentes deben pertenecer a ese espacio de trabajo.",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "La nueva clave se muestra una sola vez; la anterior ya no es válida. Guarda la configuración antes de activar.",
                "Rotate task key (pauses tasks)": "Rotar la clave de tareas (pausa las tareas)",
                "Generate task key": "Generar clave de tareas",
                "Copy this email template and keep the key private": "Copia esta plantilla de correo y guarda la clave en privado",
                "Write your task here": "Escribe aquí tu tarea",
                "Hide key": "Ocultar la clave",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "Asunto: dsh:alias o dsh:alias:sessionId. Empieza el cuerpo con DSH-Key: tu-clave-de-tarea y luego escribe la tarea. La clave autoriza a los remitentes de la lista blanca a iniciar tareas en tu espacio aprobado; mantenla en privado.",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "Enviar automáticamente el resultado final al remitente autorizado (sin Cc; se aplican los bloqueos de destinatarios)",
                "Poll interval (seconds)": "Intervalo de comprobación (segundos)",
                "Advanced matching and extraction": "Coincidencia y extracción avanzadas",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "Las reglas se ejecutan tras comprobar el remitente y la clave. Usa all / any, campos subject / body / from / to / cc y operadores contains / equals / regex. Las capturas con nombre funcionan como ${name} en workspace, session y prompt; ${body} es el cuerpo sin la clave ni el historial citado. El resultado del espacio de trabajo debe coincidir con un alias permitido.",
                "Rules (JSON array)": "Reglas (array JSON)",
                "Check finished; see task records below.": "Comprobación terminada; consulta los registros de tareas abajo.",
                "Clear finished task records": "Borrar los registros de tareas terminadas",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "Mantén DSH en ejecución. Las tareas en curso no se repiten al reiniciar. Gestiona aprobaciones, tiempos de espera o la toma manual en la sesión original.",
                "Session ID": "ID de sesión",
                "Open DSH session": "Abrir la sesión de DSH",
                "No tasks yet. The first check establishes a baseline.": "Todavía no hay tareas. La primera comprobación solo crea un punto de partida.",
                "Retry save": "Reintentar guardado",
                "Show new-mail popups": "Mostrar avisos de correo nuevo",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "Al desactivarlo se oculta el aviso y se detienen las comprobaciones automáticas. Aún puedes revisar el correo en una conversación. Al reactivarlo se empieza con un punto de partida nuevo.",
                "Reply quote language": "Idioma de la cita en respuestas",
                "Follow interface; English if unknown": "Seguir la interfaz; inglés si se desconoce",
                "Allow trusted replies without confirmation (off by default)": "Permitir respuestas de confianza sin confirmación (desactivado por defecto)",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "Si se activa, todos los To/Cc reales de una respuesta, respuesta a todos o reenvío deben coincidir con las reglas de confianza de esa cuenta. Las reglas de bloqueo y los permisos del host siguen aplicándose.",
                "Quote date timezone (optional)": "Zona horaria de la fecha citada (opcional)",
                "These accounts are managed in the configuration file: ": "Estas cuentas se gestionan en el archivo de configuración: ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "Aquí puedes guardar los ajustes generales. Las cuentas y credenciales se conservan; añade o edita cuentas en el mapa accounts de la configuración.",
                " messages\n": " mensajes\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "Gestiona carpetas IMAP personalizadas. El vaciado requiere vista previa y confirmación, afecta solo a los mensajes revisados y necesita UIDPLUS (hasta 2000 mensajes). Solo se pueden eliminar carpetas vacías. El borrado permanente no se puede deshacer.",
                "New folder": "Nueva carpeta",
                "e.g. Tenders": "p. ej. Licitaciones",
                "Create": "Crear",
                "Save": "Guardar",
                "(System folder)": "(Carpeta del sistema)",
                "Rename": "Renombrar",
                "Empty permanently deletes every message in this folder. Continue?": "Vaciar elimina permanentemente todos los mensajes de esta carpeta. ¿Continuar?",
                "Empty": "Vaciar",
                "Delete removes the folder and all its messages forever. Continue?": "Eliminar quita la carpeta y todos sus mensajes para siempre. ¿Continuar?",
                "Move to Trash": "Mover a la papelera",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "Mueve los mensajes seleccionados a la carpeta existente de abajo. Esto no los elimina permanentemente.",
                "Destination folder": "Carpeta de destino",
                "Detect Trash automatically": "Detectar la papelera automáticamente",
                "Checking messages and folders…": "Comprobando mensajes y carpetas…",
                "Move to: ": "Mover a: ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "La confirmación caduca en 90 segundos y debe renovarse si el buzón cambia. Se ofrece deshacer durante 5 minutos cuando el servidor devuelve los UID de destino.",
                "Moving…": "Moviendo…",
                "Confirm move: ": "Confirmar movimiento: ",
                "Email image": "Imagen del correo",
                "Failed to load; retry available": "No se pudo cargar; puedes reintentar",
                "External image blocked": "Imagen externa bloqueada",
                "Loading…": "Cargando…",
                "View formatted message": "Ver el mensaje con formato",
                "View plain text": "Ver texto plano",
                "External images allowed for this message": "Imágenes externas permitidas para este mensaje",
                "Load external images (": "Cargar imágenes externas (",
                "Retry images": "Reintentar las imágenes",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "Las imágenes externas se bloquean por defecto. Cargarlas puede revelar al remitente tu hora de lectura y tu dirección de red. El consentimiento solo afecta a este mensaje.",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "El cuerpo o el formato supera el límite de visualización. Se omitió parte del contenido; prueba el texto plano o tu cliente de correo.",
                "Message details": "Detalles del mensaje",
                "Mark unread": "Marcar como no leído",
                "Mark read": "Marcar como leído",
                "Unstar": "Quitar la estrella",
                "Star": "Destacar",
                "Edit the reply in Drafts. Review and confirm before sending.": "Edita la respuesta en Borradores. Revísala y confírmala antes de enviar.",
                "AI mail workflow & quick prompts": "Flujo de correo con IA y comandos rápidos",
                "Linked to open message": "Vinculado al mensaje abierto",
                "Expand for 1-click chat prompts": "Despliega para copiar comandos al chat",
                "1. Connect → 2. Filter mail → 3. Copy prompt → 4. Review & send": "1. Conectar → 2. Filtrar correo → 3. Copiar comando → 4. Revisar y enviar",
                "Summarize unread & tasks": "Resumir no leídos y tareas",
                "Summarize important unread mail and list replies needed (do not send).": "Resume los correos no leídos importantes y lista las respuestas pendientes (sin enviar).",
                "Draft a polite reply": "Redactar respuesta cortés",
                "Draft a polite reply to the selected email in Drafts without sending.": "Redacta una respuesta cortés al correo seleccionado en Borradores sin enviarla.",
                "Check the latest email needing a reply and save a polite draft only.": "Revisa el último correo pendiente de respuesta y guarda solo un borrador cortés.",
                "Extract key points & asks": "Extraer puntos clave y peticiones",
                "Extract the core requests, deadlines, and open questions from this mail.": "Extrae las peticiones clave, fechas límite y dudas abiertas de este correo.",
                "Summarize key requests and deadlines from recent mail in this folder.": "Resume las peticiones clave y fechas límite de los correos recientes en esta carpeta.",
                "Selected mail: ": "Correo seleccionado: ",
                "Prompt copied — paste in Chat": "Comando copiado — pégalo en el chat",
                "Copy failed — check clipboard": "Error al copiar — revisa el portapapeles",
            },
            fr: {
                "System folders": "Dossiers système",
                "Custom folders": "Dossiers personnalisés",
                "Confirm empty": "Confirmer le vidage",
                "Protected": "Protégé",
                "Raw headers": "En-têtes bruts",
                "Header fields": "Champs d’en-tête",
                "Parsed fields from the mail service": "Champs analysés par le service de messagerie",
                "Message list": "Liste des messages",
                "With attachments on this page": "Avec pièces jointes sur cette page",
                "No messages with attachments on this page": "Aucun message avec pièce jointe sur cette page",
                "Safe preview": "Aperçu sécurisé",
                "HTML body": "Corps HTML",
                "Plain-text alternative (optional)": "Version en texte brut (facultative)",
                "Message": "Message",
                "Subject": "Objet",
                "Recipients To": "Destinataires (À)",
                "Copy Cc": "Copie (Cc)",
                "Discard edits and close": "Ignorer les modifications et fermer",
                "Save and close": "Enregistrer et fermer",
                "Enter the custom proxy URL.": "Saisissez l’adresse du proxy personnalisé.",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Créez un client OAuth « Desktop app » dans Google Cloud, activez le consentement Gmail et ajoutez votre compte comme utilisateur de test. La connexion se termine dans le navigateur ; aucun mot de passe de boîte aux lettres n’est nécessaire.",
                "Google client secret (if issued)": "Secret client Google (si fourni)",
                "Saved; leave unchanged to keep": "Enregistré ; laissez tel quel pour conserver",
                "Open Google authorization; this panel updates after sign-in.": "Ouvrez l’autorisation Google ; ce panneau se met à jour après la connexion.",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Saisissez l’ID client de votre application de bureau Google. Les mots de passe d’application restent disponibles si la stratégie de votre compte le permet.",
                "Sign in with Google": "Se connecter avec Google",
                "API connected · ": "API connectée · ",
                "POP3 connected · ": "POP3 connecté · ",
                "; SMTP sending was not tested": " ; l’envoi SMTP n’a pas été testé",
                "Incoming protocol": "Protocole de réception",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "POP3 lit la boîte de réception et utilise SMTP pour l’envoi. Les indicateurs lu/favori et le dossier Envoyés sont indisponibles ; la recherche indique sa couverture.",
                "POP3 incoming server": "Serveur de réception POP3",
                "SMTP outgoing server (optional for receiving)": "Serveur d’envoi SMTP (facultatif pour la réception)",
                "POP3 host": "Hôte POP3",
                "SMTP host": "Hôte SMTP",
                "POP3 port": "Port POP3",
                "SMTP port": "Port SMTP",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "TLS est désactivé : l’authentification et le contenu POP3 circulent en clair. À réserver à un serveur de confiance où le clair est voulu. Ce n’est pas STARTTLS.",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "Google OAuth nécessite votre propre client d’application de bureau ; la disponibilité des mots de passe d’application dépend de la stratégie du compte.",
                "Connection routing": "Routage de la connexion",
                "Follow global or environment settings": "Suivre les paramètres globaux ou d’environnement",
                "Connect directly (ignore proxies)": "Se connecter directement (ignorer les proxys)",
                "Custom proxy": "Proxy personnalisé",
                "Custom proxy URL": "Adresse du proxy personnalisé",
                "Saved; leave blank to retain": "Enregistré ; laissez vide pour conserver",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "S’applique à IMAP et SMTP. Prend en charge HTTP CONNECT, HTTPS et SOCKS. Les adresses enregistrées peuvent contenir des mots de passe et ne sont pas affichées. La réception POP3 reste directe.",
                "API key; leave blank to retain saved key": "Clé d’API ; laissez vide pour conserver la clé enregistrée",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "Utilisez une clé d’API de la console AgentMail. La clé est stockée dans la configuration locale du compte ; le backend DSH appelle la région choisie.",
                "Mailbox action failed": "L’opération sur la boîte aux lettres a échoué",
                "Mailbox workbench": "Espace de travail de la boîte aux lettres",
                "Moved ": "Déplacé ",
                " messages to ": " messages vers ",
                "Undo move": "Annuler le déplacement",
                "To restore, move the messages back in your mail client.": "Pour les restaurer, replacez les messages dans votre client de messagerie.",
                "Dismiss": "Ignorer",
                "Check account settings": "Vérifier les paramètres du compte",
                "Loading accounts…": "Chargement des comptes…",
                "Mailbox unavailable": "Boîte aux lettres indisponible",
                "Connect your mailbox": "Connectez votre boîte aux lettres",
                "Account settings": "Paramètres du compte",
                "Add and test an email account to read and reply here.": "Ajoutez et testez un compte de messagerie pour lire et répondre ici.",
                "Accounts and folders": "Comptes et dossiers",
                "Search current folder": "Rechercher dans le dossier actuel",
                "Trash is unavailable for this protocol; delete in your mail client.": "La corbeille n’est pas disponible avec ce protocole ; supprimez les messages dans votre client de messagerie.",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "Boîte de réception POP3 · Les indicateurs lu/favori et le dossier Envoyés sont indisponibles. Les réponses s’ouvrent dans les brouillons locaux et partent en SMTP après confirmation.",
                "Select page": "Sélectionner la page",
                "Move to Trash (": "Mettre à la corbeille (",
                ")": ")",
                "Select message: ": "Sélectionner le message : ",
                "Unread": "Non lu",
                "(No subject)": "(Sans objet)",
                "Messages could not be loaded": "Les messages n’ont pas pu être chargés",
                "No results in the current search window.": "Aucun résultat dans la fenêtre de recherche actuelle.",
                "This page: ": "Cette page : ",
                " messages": " messages",
                " · Ranked by relevance": " · Classé par pertinence",
                " · Mailbox arrival order": " · Ordre d’arrivée dans la boîte",
                "Add and test an account in settings to browse mail.": "Ajoutez et testez un compte dans les paramètres pour parcourir les messages.",
                "Headers scanned: ": "En-têtes analysés : ",
                "; headers fully covered; body search has a separate limit.": " ; les en-têtes sont couverts intégralement ; la recherche dans le corps a une limite distincte.",
                "; folder coverage is partial.": " ; la couverture du dossier est partielle.",
                "Bodies scanned: ": "Corps analysés : ",
                " messages; limit ": " messages ; limite ",
                "; bounded by the body display limit.": " ; limité par la taille d’affichage du corps.",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "AgentMail classe les résultats par pertinence et exclut le spam, la corbeille et les autres messages protégés.",
                "Page ": "Page ",
                "": "",
                "Search older headers": "Rechercher des en-têtes plus anciens",
                "This message could not be loaded": "Ce message n’a pas pu être chargé",
                "Open a message to reply in drafts, mark its state or download attachments.": "Ouvrez un message pour y répondre dans les brouillons, changer son état ou télécharger les pièces jointes.",
                "Email action failed": "L’opération de messagerie a échoué",
                "View plain-text alternative": "Voir la version en texte brut",
                "Submitting / check mailbox": "Envoi en cours / vérifiez la boîte",
                "Server receipt saved": "Accusé du serveur enregistré",
                "Outcome uncertain, check mailbox": "Résultat incertain, vérifiez la boîte",
                "Draft saved. No email was sent.": "Brouillon enregistré. Aucun e-mail n’a été envoyé.",
                "Scheduled for: ": "Programmé pour : ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "Un destinataire est bloqué. Modifiez le brouillon ou les règles de destinataires avant l’envoi.",
                "Blocked: ": "Bloqué : ",
                "Matches a trusted rule": "Correspond à une règle de confiance",
                "(Empty body)": "(Corps vide)",
                "Download to check": "Télécharger pour vérifier",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "Les pièces jointes sont figées dans cet aperçu. Vérifiez à nouveau après 10 minutes ou si le brouillon, le compte ou les règles changent.",
                "I checked the sender, all recipients, content and attachments": "J’ai vérifié l’expéditeur, tous les destinataires, le contenu et les pièces jointes",
                "Review cancelled. No email was sent.": "Vérification annulée. Aucun e-mail n’a été envoyé.",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "Les brouillons restent sur cet appareil. Demandez au modèle d’en préparer un avec email_draft, puis modifiez, enregistrez et confirmez ici.",
                "The current draft has unsaved edits.": "Le brouillon actuel contient des modifications non enregistrées.",
                "Save and switch": "Enregistrer et changer",
                "Discard edits and switch": "Abandonner les modifications et changer",
                "Keep editing": "Continuer la modification",
                "Reopen saved version": "Rouvrir la version enregistrée",
                "Back to drafts": "Retour aux brouillons",
                "Untitled draft": "Brouillon sans titre",
                "No account selected": "Aucun compte sélectionné",
                "Unsaved": "Non enregistré",
                "No drafts yet": "Aucun brouillon pour le moment",
                "Choose Compose above to begin.": "Cliquez sur « Rédiger » ci-dessus pour commencer.",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "Ce brouillon répond dans le fil d’origine et inclut une copie citée. Écrivez au-dessus de la citation, puis vérifiez et confirmez avant l’envoi.",
                "Unsaved edits": "Modifications non enregistrées",
                "Send time: ": "Heure d’envoi : ",
                "Cancel schedule and return to draft": "Annuler la programmation et revenir au brouillon",
                "Sending account": "Compte d’envoi",
                "Choose an account": "Choisissez un compte",
                "Schedule (optional, this device’s timezone)": "Programmer (facultatif, fuseau horaire de cet appareil)",
                "Scheduled send time": "Heure d’envoi programmée",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "Gardez DSH en cours d’exécution. Les heures manquées pendant l’arrêt ne sont pas rattrapées au redémarrage ; les envois incertains ne sont jamais réessayés automatiquement.",
                "Body format": "Format du corps",
                "Plain text": "Texte brut",
                "Formatted HTML": "HTML mis en forme",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "Prévisualisez et envoyez une mise en forme sûre. Le texte brut est généré s’il est omis. Les scripts et images externes sont supprimés.",
                "Remove attachment ": "Retirer la pièce jointe ",
                "Remove": "Retirer",
                "Add attachments (save edits first; up to 10 files / ": "Ajouter des pièces jointes (enregistrez d’abord ; jusqu’à 10 fichiers / ",
                " total)": " au total)",
                "Add attachments": "Ajouter des pièces jointes",
                "Attachment exceeds ": "La pièce jointe dépasse ",
                "Attachments added. Review before sending.": "Pièces jointes ajoutées. Vérifiez avant l’envoi.",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "Certaines adresses ont été refusées. Cet e-mail ne sera pas réessayé automatiquement. Acceptées par le serveur : ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "Accusé du serveur enregistré. Ce brouillon ne sera plus envoyé. Acceptées par le serveur : ",
                "none": "aucun",
                "Server rejected: ": "Refusés par le serveur : ",
                "This confirms the server response, not delivery to the recipient inbox.": "Cela confirme la réponse du serveur, pas la remise dans la boîte du destinataire.",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "Pas encore d’accusé. Vérifiez votre boîte, puis actualisez la liste. Ne renvoyez pas.",
                "Copy to a new draft": "Copier dans un nouveau brouillon",
                "Delete local draft": "Supprimer le brouillon local",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "Copie le contenu et les pièces jointes dans un nouveau brouillon non envoyé. Vérifiez d’abord la boîte si l’original a été soumis ou si son résultat est incertain.",
                "Confirm copy": "Confirmer la copie",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "Supprime ce brouillon local et les copies téléversées par le module. Les fichiers d’origine et les messages de la boîte restent intacts.",
                "Confirm delete": "Confirmer la suppression",
                "Select a draft or create one to start editing.": "Sélectionnez un brouillon ou créez-en un pour commencer.",
                "Rules saved for this account.": "Règles enregistrées pour ce compte.",
                "Trusted recipients": "Destinataires de confiance",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "La confirmation est le comportement par défaut. Une fois activée, email_send n’omet la confirmation du module que si toutes les adresses To/Cc correspondent aux règles de ce compte. Les autorisations de l’hôte s’appliquent toujours et les brouillons exigent une confirmation manuelle. Les règles de domaine excluent les sous-domaines.",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "Les destinataires bloqués priment sur les règles de confiance, même si la confirmation est désactivée. Les blocages s’appliquent aussi aux brouillons, réponses et transferts. Les domaines bloqués correspondent exactement et excluent les sous-domaines.",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "L’omission pour les réponses de confiance est désactivée par défaut et s’active dans les paramètres de connexion. Elle vérifie tous les To/Cc réels des réponses, réponses à tous et transferts ; tout destinataire non correspondant exige encore une confirmation. Si Full Access ne peut pas afficher d’invite, passez par Brouillons.",
                "Global send approval is off; blocked-recipient rules still apply.": "La confirmation globale d’envoi est désactivée ; les règles de blocage restent appliquées.",
                "Account for these rules": "Compte concerné par ces règles",
                "Choose a configured account": "Choisissez un compte configuré",
                "Rules have unsaved edits.": "Les règles contiennent des modifications non enregistrées.",
                "Trusted email addresses (one per line)": "Adresses e-mail de confiance (une par ligne)",
                "Trusted domains (one per line, all mailboxes in that domain)": "Domaines de confiance (un par ligne, toutes les boîtes du domaine)",
                "Blocked email addresses (one per line)": "Adresses e-mail bloquées (une par ligne)",
                "Blocked domains (one per line)": "Domaines bloqués (un par ligne)",
                "Skip plugin approval for email_send when all addresses match": "Omettre la confirmation du module pour email_send lorsque toutes les adresses correspondent",
                "Save rules for this account": "Enregistrer les règles de ce compte",
                "Reload rules": "Recharger les règles",
                "Unsaved; matching uses the rules you are editing.": "Non enregistré ; la vérification utilise les règles en cours d’édition.",
                "Only saved rules affect model-initiated sends.": "Seules les règles enregistrées s’appliquent aux envois lancés par le modèle.",
                "Try recipients To": "Tester les destinataires To",
                "Try copy Cc": "Tester la copie Cc",
                "A recipient is blocked; sending is refused.": "Un destinataire est bloqué ; l’envoi est refusé.",
                "All To/Cc match; plugin approval can be skipped.": "Tous les To/Cc correspondent ; la confirmation du module peut être omise.",
                "Plugin approval will remain.": "La confirmation du module reste requise.",
                "Match: ": "Correspondance : ",
                "Task operation failed": "L’opération de tâche a échoué",
                "Loading mail tasks…": "Chargement des tâches de messagerie…",
                "Each line: alias = absolute path to an existing folder": "Chaque ligne : alias = chemin absolu vers un dossier existant",
                "Duplicate workspace alias": "Alias d’espace de travail en double",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "Enregistré. La première vérification établit un point de départ ; seuls les messages ultérieurs peuvent déclencher des tâches.",
                "Starting": "Démarrage",
                "Running": "En cours",
                "Waiting for your input in DSH": "En attente de votre validation dans DSH",
                "Completed": "Terminée",
                "Needs attention": "Nécessite votre attention",
                "Submitting reply": "Envoi de la réponse",
                "Replied": "Répondu",
                "Mail outcome uncertain; check sent mail": "Résultat d’envoi incertain ; vérifiez les éléments envoyés",
                "Turn email into a DSH task": "Transformer un e-mail en tâche DSH",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "Envoyez une tâche depuis une boîte autorisée vers un espace de travail approuvé, puis poursuivez la même session par e-mail. Désactivé par défaut. Les tâches utilisent votre modèle et peuvent consommer des ressources ; les autorisations DSH demandent toujours votre validation.",
                "Native task services are unavailable; update DSH to use this feature.": "Les services de tâches natifs sont indisponibles ; mettez à jour DSH pour utiliser cette fonction.",
                "Task subject prefix": "Préfixe d’objet des tâches",
                "Allowed senders (one per line; empty means the mailbox itself)": "Expéditeurs autorisés (un par ligne ; vide = la boîte elle-même)",
                "Workspace aliases (each line: alias = absolute folder path)": "Alias d’espaces de travail (chaque ligne : alias = chemin absolu de dossier)",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "Les tâches ne peuvent utiliser que les alias enregistrés. Les sessions existantes doivent appartenir à cet espace de travail.",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "La nouvelle clé n’est affichée qu’une fois ; l’ancienne est invalide. Enregistrez la configuration avant d’activer.",
                "Rotate task key (pauses tasks)": "Renouveler la clé des tâches (met les tâches en pause)",
                "Generate task key": "Générer une clé de tâches",
                "Copy this email template and keep the key private": "Copiez ce modèle d’e-mail et gardez la clé confidentielle",
                "Write your task here": "Écrivez votre tâche ici",
                "Hide key": "Masquer la clé",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "Objet : dsh:alias ou dsh:alias:sessionId. Commencez le corps par DSH-Key: votre-clé-de-tâche, puis écrivez la tâche. La clé autorise les expéditeurs de la liste blanche à lancer des tâches dans votre espace approuvé ; gardez-la confidentielle.",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "Envoyer automatiquement le résultat final à l’expéditeur autorisé (sans Cc ; les blocages de destinataires s’appliquent)",
                "Poll interval (seconds)": "Intervalle de vérification (secondes)",
                "Advanced matching and extraction": "Correspondance et extraction avancées",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "Les règles s’exécutent après vérification de l’expéditeur et de la clé. Utilisez all / any, les champs subject / body / from / to / cc, les opérateurs contains / equals / regex. Les captures nommées s’utilisent comme ${name} dans workspace, session et prompt ; ${body} est le corps sans la clé ni l’historique cité. Le résultat d’espace de travail doit correspondre à un alias autorisé.",
                "Rules (JSON array)": "Règles (tableau JSON)",
                "Check finished; see task records below.": "Vérification terminée ; voir les enregistrements de tâches ci-dessous.",
                "Clear finished task records": "Effacer les enregistrements de tâches terminées",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "Gardez DSH en cours d’exécution. Les tâches en cours ne sont pas rejouées après redémarrage. Gérez les validations, délais ou reprises manuelles dans la session d’origine.",
                "Session ID": "ID de session",
                "Open DSH session": "Ouvrir la session DSH",
                "No tasks yet. The first check establishes a baseline.": "Aucune tâche pour le moment. La première vérification établit un point de départ.",
                "Retry save": "Réessayer l’enregistrement",
                "Show new-mail popups": "Afficher les notifications de nouveau message",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "La désactivation masque la notification et arrête les vérifications automatiques. Vous pouvez toujours consulter le courrier dans une conversation. La réactivation repart d’un nouveau point de départ.",
                "Reply quote language": "Langue de citation des réponses",
                "Follow interface; English if unknown": "Suivre l’interface ; anglais si inconnu",
                "Allow trusted replies without confirmation (off by default)": "Autoriser les réponses de confiance sans confirmation (désactivé par défaut)",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "Une fois activé, tous les To/Cc réels d’une réponse, réponse à tous ou transfert doivent correspondre aux règles de confiance de ce compte. Les règles de blocage et les autorisations de l’hôte s’appliquent toujours.",
                "Quote date timezone (optional)": "Fuseau horaire de la date citée (facultatif)",
                "These accounts are managed in the configuration file: ": "Ces comptes sont gérés dans le fichier de configuration : ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "Vous pouvez enregistrer les réglages généraux ici. Les comptes et identifiants sont préservés ; ajoutez ou modifiez des comptes dans la table accounts de la configuration.",
                " messages\n": " messages\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "Gérez les dossiers IMAP personnalisés. Le vidage exige un aperçu et une confirmation, ne touche qu’aux messages vérifiés et nécessite UIDPLUS (jusqu’à 2000 messages). Seuls les dossiers vides peuvent être supprimés. La suppression définitive est irréversible.",
                "New folder": "Nouveau dossier",
                "e.g. Tenders": "p. ex. Appels d’offres",
                "Create": "Créer",
                "Save": "Enregistrer",
                "(System folder)": "(Dossier système)",
                "Rename": "Renommer",
                "Empty permanently deletes every message in this folder. Continue?": "Vider supprime définitivement tous les messages de ce dossier. Continuer ?",
                "Empty": "Vider",
                "Delete removes the folder and all its messages forever. Continue?": "Supprimer retire le dossier et tous ses messages définitivement. Continuer ?",
                "Move to Trash": "Mettre à la corbeille",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "Déplace les messages sélectionnés vers le dossier existant ci-dessous. Cela ne les supprime pas définitivement.",
                "Destination folder": "Dossier de destination",
                "Detect Trash automatically": "Détecter automatiquement la corbeille",
                "Checking messages and folders…": "Vérification des messages et dossiers…",
                "Move to: ": "Déplacer vers : ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "La confirmation expire au bout de 90 secondes et doit être renouvelée si la boîte change. Une annulation de 5 minutes est proposée lorsque le serveur renvoie les UID de destination.",
                "Moving…": "Déplacement…",
                "Confirm move: ": "Confirmer le déplacement : ",
                "Email image": "Image de l’e-mail",
                "Failed to load; retry available": "Échec du chargement ; nouvelle tentative possible",
                "External image blocked": "Image externe bloquée",
                "Loading…": "Chargement…",
                "View formatted message": "Voir le message mis en forme",
                "View plain text": "Voir en texte brut",
                "External images allowed for this message": "Images externes autorisées pour ce message",
                "Load external images (": "Charger les images externes (",
                "Retry images": "Réessayer les images",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "Les images externes sont bloquées par défaut. Les charger peut révéler à l’expéditeur votre heure de lecture et votre adresse réseau. Le consentement ne vaut que pour ce message.",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "Le corps ou la mise en forme dépasse la limite d’affichage. Une partie du contenu a été omise ; essayez le texte brut ou votre client de messagerie.",
                "Message details": "Détails du message",
                "Mark unread": "Marquer comme non lu",
                "Mark read": "Marquer comme lu",
                "Unstar": "Retirer l’étoile",
                "Star": "Ajouter une étoile",
                "Edit the reply in Drafts. Review and confirm before sending.": "Modifiez la réponse dans Brouillons. Vérifiez et confirmez avant l’envoi.",
                "AI mail workflow & quick prompts": "Flux e-mail IA et invites rapides",
                "Linked to open message": "Lié au message ouvert",
                "Expand for 1-click chat prompts": "Déplier pour copier une invite en 1 clic",
                "1. Connect → 2. Filter mail → 3. Copy prompt → 4. Review & send": "1. Connecter → 2. Filtrer → 3. Copier l’invite → 4. Vérifier et envoyer",
                "Summarize unread & tasks": "Résumer non lus et actions",
                "Summarize important unread mail and list replies needed (do not send).": "Résume les e-mails non lus importants et liste les réponses à prévoir (sans envoyer).",
                "Draft a polite reply": "Rédiger une réponse courtoise",
                "Draft a polite reply to the selected email in Drafts without sending.": "Rédige une réponse courtoise à l’e-mail sélectionné dans Brouillons sans l’envoyer.",
                "Check the latest email needing a reply and save a polite draft only.": "Consulte le dernier e-mail en attente et enregistre uniquement un brouillon courtois.",
                "Extract key points & asks": "Extraire points clés et demandes",
                "Extract the core requests, deadlines, and open questions from this mail.": "Extrais les demandes principales, échéances et questions ouvertes de cet e-mail.",
                "Summarize key requests and deadlines from recent mail in this folder.": "Résume les demandes clés et échéances des e-mails récents de ce dossier.",
                "Selected mail: ": "E-mail sélectionné : ",
                "Prompt copied — paste in Chat": "Invite copiée — collez-la dans le chat",
                "Copy failed — check clipboard": "Échec de la copie — vérifiez le presse-papiers",
            },
            de: {
                "System folders": "Systemordner",
                "Custom folders": "Eigene Ordner",
                "Confirm empty": "Leeren bestätigen",
                "Protected": "Geschützt",
                "Raw headers": "Rohheader",
                "Header fields": "Kopfzeilenfelder",
                "Parsed fields from the mail service": "Vom Maildienst ausgewertete Felder",
                "Message list": "Nachrichtenliste",
                "With attachments on this page": "Mit Anhang auf dieser Seite",
                "No messages with attachments on this page": "Keine Nachrichten mit Anhang auf dieser Seite",
                "Safe preview": "Sichere Vorschau",
                "HTML body": "HTML-Text",
                "Plain-text alternative (optional)": "Nur-Text-Alternative (optional)",
                "Message": "Nachricht",
                "Subject": "Betreff",
                "Recipients To": "Empfänger (An)",
                "Copy Cc": "Kopie (Cc)",
                "Discard edits and close": "Änderungen verwerfen und schließen",
                "Save and close": "Speichern und schließen",
                "Enter the custom proxy URL.": "Gib die Adresse des benutzerdefinierten Proxys ein.",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Erstelle in Google Cloud einen OAuth-Client vom Typ „Desktop-App“, aktiviere die Gmail-Berechtigung und füge dein Konto als Testnutzer hinzu. Die Anmeldung erfolgt im Browser; ein Postfachpasswort ist nicht nötig.",
                "Google client secret (if issued)": "Google-Client-Secret (falls ausgestellt)",
                "Saved; leave unchanged to keep": "Gespeichert; unverändert lassen, um es zu behalten",
                "Open Google authorization; this panel updates after sign-in.": "Öffne die Google-Autorisierung; dieser Bereich aktualisiert sich nach der Anmeldung.",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Gib die Client-ID deiner Google-Desktop-App ein. App-Passwörter bleiben verfügbar, sofern die Kontorichtlinie es zulässt.",
                "Sign in with Google": "Mit Google anmelden",
                "API connected · ": "API verbunden · ",
                "POP3 connected · ": "POP3 verbunden · ",
                "; SMTP sending was not tested": "; SMTP-Versand wurde nicht getestet",
                "Incoming protocol": "Empfangsprotokoll",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "POP3 liest den Posteingang und sendet über SMTP. Gelesen-/Markierungsstatus und der Ordner „Gesendet“ fehlen; die Suche zeigt ihren Abdeckungsbereich.",
                "POP3 incoming server": "POP3-Eingangsserver",
                "SMTP outgoing server (optional for receiving)": "SMTP-Ausgangsserver (optional zum Empfangen)",
                "POP3 host": "POP3-Host",
                "SMTP host": "SMTP-Host",
                "POP3 port": "POP3-Port",
                "SMTP port": "SMTP-Port",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "TLS ist aus: POP3-Anmeldung und Inhalte laufen im Klartext. Nur bei einem vertrauenswürdigen Server verwenden, bei dem Klartext beabsichtigt ist. Das ist nicht STARTTLS.",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "Google OAuth erfordert einen eigenen Desktop-App-Client; ob App-Passwörter verfügbar sind, hängt von der Kontorichtlinie ab.",
                "Connection routing": "Verbindungsweg",
                "Follow global or environment settings": "Globalen oder Umgebungseinstellungen folgen",
                "Connect directly (ignore proxies)": "Direkt verbinden (Proxys ignorieren)",
                "Custom proxy": "Benutzerdefinierter Proxy",
                "Custom proxy URL": "Adresse des benutzerdefinierten Proxys",
                "Saved; leave blank to retain": "Gespeichert; leer lassen, um es zu behalten",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "Gilt für IMAP und SMTP. Unterstützt HTTP CONNECT, HTTPS und SOCKS. Gespeicherte Adressen können Passwörter enthalten und werden nicht angezeigt. POP3-Empfang verbindet weiterhin direkt.",
                "API key; leave blank to retain saved key": "API-Schlüssel; leer lassen, um den gespeicherten zu behalten",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "Verwende einen API-Schlüssel aus der AgentMail-Konsole. Der Schlüssel wird in der lokalen Kontokonfiguration gespeichert; das DSH-Backend ruft die gewählte Region auf.",
                "Mailbox action failed": "Postfachaktion fehlgeschlagen",
                "Mailbox workbench": "Postfach-Arbeitsbereich",
                "Moved ": "Verschoben: ",
                " messages to ": " Nachrichten nach ",
                "Undo move": "Verschieben rückgängig machen",
                "To restore, move the messages back in your mail client.": "Zum Wiederherstellen verschiebe die Nachrichten in deinem E-Mail-Client zurück.",
                "Dismiss": "Ausblenden",
                "Check account settings": "Kontoeinstellungen prüfen",
                "Loading accounts…": "Konten werden geladen…",
                "Mailbox unavailable": "Postfach nicht verfügbar",
                "Connect your mailbox": "Postfach verbinden",
                "Account settings": "Kontoeinstellungen",
                "Add and test an email account to read and reply here.": "Füge ein E-Mail-Konto hinzu und teste es, um hier zu lesen und zu antworten.",
                "Accounts and folders": "Konten und Ordner",
                "Search current folder": "Im aktuellen Ordner suchen",
                "Trash is unavailable for this protocol; delete in your mail client.": "Der Papierkorb ist mit diesem Protokoll nicht verfügbar; lösche Nachrichten in deinem E-Mail-Client.",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "POP3-Posteingang · Gelesen-/Markierungsstatus und der Ordner „Gesendet“ fehlen. Antworten öffnen sich in den lokalen Entwürfen und gehen nach Bestätigung per SMTP raus.",
                "Select page": "Seite auswählen",
                "Move to Trash (": "In den Papierkorb (",
                ")": ")",
                "Select message: ": "Nachricht auswählen: ",
                "Unread": "Ungelesen",
                "(No subject)": "(Kein Betreff)",
                "Messages could not be loaded": "Nachrichten konnten nicht geladen werden",
                "No results in the current search window.": "Keine Treffer im aktuellen Suchbereich.",
                "This page: ": "Diese Seite: ",
                " messages": " Nachrichten",
                " · Ranked by relevance": " · Nach Relevanz sortiert",
                " · Mailbox arrival order": " · Reihenfolge des Posteingangs",
                "Add and test an account in settings to browse mail.": "Füge in den Einstellungen ein Konto hinzu und teste es, um E-Mails zu durchsuchen.",
                "Headers scanned: ": "Scannte Kopfzeilen: ",
                "; headers fully covered; body search has a separate limit.": "; Kopfzeilen vollständig erfasst; die Textsuche hat eine eigene Grenze.",
                "; folder coverage is partial.": "; der Ordner ist nur teilweise erfasst.",
                "Bodies scanned: ": "Scannte Texte: ",
                " messages; limit ": " Nachrichten; Grenze ",
                "; bounded by the body display limit.": "; begrenzt durch die Anzeigegrenze des Textes.",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "AgentMail sortiert Treffer nach Relevanz und schließt Spam, Papierkorb und andere geschützte Nachrichten aus.",
                "Page ": "Seite ",
                "": "",
                "Search older headers": "Ältere Kopfzeilen durchsuchen",
                "This message could not be loaded": "Diese Nachricht konnte nicht geladen werden",
                "Open a message to reply in drafts, mark its state or download attachments.": "Öffne eine Nachricht, um in den Entwürfen zu antworten, ihren Status zu setzen oder Anhänge herunterzuladen.",
                "Email action failed": "E-Mail-Aktion fehlgeschlagen",
                "View plain-text alternative": "Nur-Text-Version anzeigen",
                "Submitting / check mailbox": "Wird gesendet / Postfach prüfen",
                "Server receipt saved": "Serverbeleg gespeichert",
                "Outcome uncertain, check mailbox": "Ergebnis unklar, Postfach prüfen",
                "Draft saved. No email was sent.": "Entwurf gespeichert. Es wurde keine E-Mail gesendet.",
                "Scheduled for: ": "Geplant für: ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "Ein Empfänger ist gesperrt. Ändere den Entwurf oder die Empfängerregeln vor dem Senden.",
                "Blocked: ": "Gesperrt: ",
                "Matches a trusted rule": "Entspricht einer Vertrauensregel",
                "(Empty body)": "(Leerer Text)",
                "Download to check": "Zum Prüfen herunterladen",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "Anhänge sind an diese Vorschau gebunden. Prüfe nach 10 Minuten oder bei Änderungen an Entwurf, Konto oder Regeln erneut.",
                "I checked the sender, all recipients, content and attachments": "Ich habe Absender, alle Empfänger, Inhalt und Anhänge geprüft",
                "Review cancelled. No email was sent.": "Prüfung abgebrochen. Es wurde keine E-Mail gesendet.",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "Entwürfe bleiben auf diesem Gerät. Lass das Modell mit email_draft einen vorbereiten und bearbeite, speichere und bestätige ihn hier.",
                "The current draft has unsaved edits.": "Der aktuelle Entwurf enthält ungespeicherte Änderungen.",
                "Save and switch": "Speichern und wechseln",
                "Discard edits and switch": "Änderungen verwerfen und wechseln",
                "Keep editing": "Weiter bearbeiten",
                "Reopen saved version": "Gespeicherte Version erneut öffnen",
                "Back to drafts": "Zurück zu den Entwürfen",
                "Untitled draft": "Unbenannter Entwurf",
                "No account selected": "Kein Konto ausgewählt",
                "Unsaved": "Ungespeichert",
                "No drafts yet": "Noch keine Entwürfe",
                "Choose Compose above to begin.": "Klicke oben auf „Verfassen“, um zu beginnen.",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "Dieser Entwurf antwortet im ursprünglichen Thread und enthält ein zitiertes Original. Schreibe über das Zitat, prüfe und bestätige vor dem Senden.",
                "Unsaved edits": "Ungespeicherte Änderungen",
                "Send time: ": "Sendezeit: ",
                "Cancel schedule and return to draft": "Planung abbrechen und zum Entwurf zurückkehren",
                "Sending account": "Sendekonto",
                "Choose an account": "Konto auswählen",
                "Schedule (optional, this device’s timezone)": "Planen (optional, Zeitzone dieses Geräts)",
                "Scheduled send time": "Geplante Sendezeit",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "DSH muss laufen. Während der Schließung verpasste Zeiten werden beim Neustart nicht nachgeholt; unklare Sendungen werden nie automatisch wiederholt.",
                "Body format": "Textformat",
                "Plain text": "Nur Text",
                "Formatted HTML": "Formatiertes HTML",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "Sichere Formatierung ansehen und senden. Fehlt der Nur-Text, wird er erzeugt. Skripte und externe Bilder werden entfernt.",
                "Remove attachment ": "Anhang entfernen: ",
                "Remove": "Entfernen",
                "Add attachments (save edits first; up to 10 files / ": "Anhänge hinzufügen (zuerst speichern; bis zu 10 Dateien / ",
                " total)": " gesamt)",
                "Add attachments": "Anhänge hinzufügen",
                "Attachment exceeds ": "Anhang überschreitet ",
                "Attachments added. Review before sending.": "Anhänge hinzugefügt. Vor dem Senden prüfen.",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "Einige Adressen wurden abgelehnt. Diese E-Mail wird nicht automatisch erneut gesendet. Vom Server angenommen: ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "Serverbeleg gespeichert. Dieser Entwurf wird nicht erneut gesendet. Vom Server angenommen: ",
                "none": "keine",
                "Server rejected: ": "Vom Server abgelehnt: ",
                "This confirms the server response, not delivery to the recipient inbox.": "Das bestätigt die Serverantwort, nicht die Zustellung in den Posteingang des Empfängers.",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "Noch kein Beleg. Prüfe dein Postfach und aktualisiere dann die Liste. Nicht erneut senden.",
                "Copy to a new draft": "In einen neuen Entwurf kopieren",
                "Delete local draft": "Lokalen Entwurf löschen",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "Kopiert Inhalt und Anhänge in einen neuen, ungesendeten Entwurf. Prüfe zuerst das Postfach, wenn das Original gesendet wurde oder das Ergebnis unklar ist.",
                "Confirm copy": "Kopieren bestätigen",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "Löscht diesen lokalen Entwurf und vom Plugin hochgeladene Kopien. Originaldateien und Postfachnachrichten bleiben erhalten.",
                "Confirm delete": "Löschen bestätigen",
                "Select a draft or create one to start editing.": "Wähle einen Entwurf aus oder erstelle einen, um zu beginnen.",
                "Rules saved for this account.": "Regeln für dieses Konto gespeichert.",
                "Trusted recipients": "Vertrauenswürdige Empfänger",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "Die Bestätigung ist der Standard. Wenn aktiviert, überspringt email_send die Plugin-Bestätigung nur, wenn alle To/Cc-Adressen den Regeln dieses Kontos entsprechen. Host-Berechtigungen gelten weiter, Entwürfe brauchen weiterhin eine manuelle Bestätigung. Domänenregeln schließen Subdomänen aus.",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "Gesperrte Empfänger haben Vorrang vor Vertrauensregeln, auch bei ausgeschalteter Sendebestätigung. Sperren gelten auch für Entwürfe, Antworten und Weiterleitungen. Gesperrte Domänen stimmen exakt überein und schließen Subdomänen aus.",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "Das Überspringen bei vertrauenswürdigen Antworten ist standardmäßig aus und lässt sich in den Verbindungseinstellungen aktivieren. Geprüft werden alle tatsächlichen To/Cc bei Antworten, Antworten an alle und Weiterleitungen; jeder nicht passende Empfänger braucht weiterhin eine Bestätigung. Kann Full Access keinen Dialog zeigen, nutze die Entwürfe.",
                "Global send approval is off; blocked-recipient rules still apply.": "Die globale Sendebestätigung ist aus; Regeln für gesperrte Empfänger gelten weiterhin.",
                "Account for these rules": "Konto für diese Regeln",
                "Choose a configured account": "Konfiguriertes Konto auswählen",
                "Rules have unsaved edits.": "Die Regeln enthalten ungespeicherte Änderungen.",
                "Trusted email addresses (one per line)": "Vertrauenswürdige E-Mail-Adressen (eine pro Zeile)",
                "Trusted domains (one per line, all mailboxes in that domain)": "Vertrauenswürdige Domänen (eine pro Zeile, alle Postfächer der Domäne)",
                "Blocked email addresses (one per line)": "Gesperrte E-Mail-Adressen (eine pro Zeile)",
                "Blocked domains (one per line)": "Gesperrte Domänen (eine pro Zeile)",
                "Skip plugin approval for email_send when all addresses match": "Plugin-Bestätigung für email_send überspringen, wenn alle Adressen passen",
                "Save rules for this account": "Regeln für dieses Konto speichern",
                "Reload rules": "Regeln neu laden",
                "Unsaved; matching uses the rules you are editing.": "Ungespeichert; die Prüfung nutzt die Regeln, die du gerade bearbeitest.",
                "Only saved rules affect model-initiated sends.": "Nur gespeicherte Regeln gelten für vom Modell gestartete Sendungen.",
                "Try recipients To": "Empfänger To testen",
                "Try copy Cc": "Kopie Cc testen",
                "A recipient is blocked; sending is refused.": "Ein Empfänger ist gesperrt; das Senden wird abgelehnt.",
                "All To/Cc match; plugin approval can be skipped.": "Alle To/Cc passen; die Plugin-Bestätigung kann entfallen.",
                "Plugin approval will remain.": "Die Plugin-Bestätigung bleibt bestehen.",
                "Match: ": "Treffer: ",
                "Task operation failed": "Aufgabenaktion fehlgeschlagen",
                "Loading mail tasks…": "E-Mail-Aufgaben werden geladen…",
                "Each line: alias = absolute path to an existing folder": "Jede Zeile: Alias = absoluter Pfad zu einem vorhandenen Ordner",
                "Duplicate workspace alias": "Doppelter Arbeitsbereichs-Alias",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "Gespeichert. Die erste Prüfung setzt nur einen Ausgangspunkt; nur spätere E-Mails können Aufgaben auslösen.",
                "Starting": "Wird gestartet",
                "Running": "Läuft",
                "Waiting for your input in DSH": "Wartet auf deine Bestätigung in DSH",
                "Completed": "Abgeschlossen",
                "Needs attention": "Prüfung nötig",
                "Submitting reply": "Antwort wird gesendet",
                "Replied": "Beantwortet",
                "Mail outcome uncertain; check sent mail": "Sendungsergebnis unklar; Gesendetes prüfen",
                "Turn email into a DSH task": "E-Mail in eine DSH-Aufgabe verwandeln",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "Sende eine Aufgabe aus einem autorisierten Postfach an einen freigegebenen Arbeitsbereich und führe dieselbe Sitzung per E-Mail fort. Standardmäßig aus. Aufgaben nutzen dein Modell und können Verbrauch erzeugen; DSH-Berechtigungen verlangen weiterhin deine Bestätigung.",
                "Native task services are unavailable; update DSH to use this feature.": "Native Aufgabendienste sind nicht verfügbar; aktualisiere DSH, um diese Funktion zu nutzen.",
                "Task subject prefix": "Betreff-Präfix für Aufgaben",
                "Allowed senders (one per line; empty means the mailbox itself)": "Erlaubte Absender (einer pro Zeile; leer = das Postfach selbst)",
                "Workspace aliases (each line: alias = absolute folder path)": "Arbeitsbereichs-Aliasnamen (je Zeile: Alias = absoluter Ordnerpfad)",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "Aufgaben können nur gespeicherte Aliasnamen nutzen. Bestehende Sitzungen müssen zu diesem Arbeitsbereich gehören.",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "Der neue Schlüssel wird nur einmal angezeigt; der alte ist ungültig. Speichere die Konfiguration vor dem Aktivieren.",
                "Rotate task key (pauses tasks)": "Aufgabenschlüssel erneuern (pausiert Aufgaben)",
                "Generate task key": "Aufgabenschlüssel erzeugen",
                "Copy this email template and keep the key private": "Kopiere diese E-Mail-Vorlage und halte den Schlüssel geheim",
                "Write your task here": "Schreibe deine Aufgabe hier",
                "Hide key": "Schlüssel ausblenden",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "Betreff: dsh:alias oder dsh:alias:sessionId. Beginne den Text mit DSH-Key: dein-aufgabenschlüssel und schreibe dann die Aufgabe. Der Schlüssel erlaubt Absendern auf der Positivliste, Aufgaben in deinem freigegebenen Arbeitsbereich zu starten; halte ihn geheim.",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "Das Endergebnis automatisch an den autorisierten Absender mailen (kein Cc; Empfängersperren gelten)",
                "Poll interval (seconds)": "Prüfintervall (Sekunden)",
                "Advanced matching and extraction": "Erweiterte Zuordnung und Extraktion",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "Regeln laufen nach Absender- und Schlüsselprüfung. Nutze all / any, Felder subject / body / from / to / cc, Operatoren contains / equals / regex. Benannte Gruppen wirken als ${name} in workspace, session und prompt; ${body} ist der Text ohne Schlüssel und zitierten Verlauf. Das Arbeitsbereichsergebnis muss einem erlaubten Alias entsprechen.",
                "Rules (JSON array)": "Regeln (JSON-Array)",
                "Check finished; see task records below.": "Prüfung abgeschlossen; siehe Aufgabenprotokolle unten.",
                "Clear finished task records": "Abgeschlossene Aufgabenprotokolle löschen",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "DSH muss laufen. Laufende Aufgaben werden nach einem Neustart nicht erneut ausgeführt. Bestätigungen, Zeitüberschreitungen oder manuelle Übernahme in der ursprünglichen Sitzung behandeln.",
                "Session ID": "Sitzungs-ID",
                "Open DSH session": "DSH-Sitzung öffnen",
                "No tasks yet. The first check establishes a baseline.": "Noch keine Aufgaben. Die erste Prüfung setzt nur einen Ausgangspunkt.",
                "Retry save": "Speichern erneut versuchen",
                "Show new-mail popups": "Popups für neue E-Mails anzeigen",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "Beim Ausschalten wird das Popup ausgeblendet und die automatische Prüfung beendet. In einem Gespräch kannst du weiterhin E-Mails prüfen. Beim Wiedereinschalten startet eine neue Ausgangsbasis.",
                "Reply quote language": "Sprache des Antwortzitats",
                "Follow interface; English if unknown": "Oberfläche folgen; Englisch, wenn unbekannt",
                "Allow trusted replies without confirmation (off by default)": "Vertrauenswürdige Antworten ohne Bestätigung zulassen (standardmäßig aus)",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "Wenn aktiviert, müssen alle tatsächlichen To/Cc einer Antwort, Antwort an alle oder Weiterleitung den Vertrauensregeln des Kontos entsprechen. Sperrregeln und Host-Berechtigungen gelten weiterhin.",
                "Quote date timezone (optional)": "Zeitzone des Zitatsdatums (optional)",
                "These accounts are managed in the configuration file: ": "Diese Konten werden in der Konfigurationsdatei verwaltet: ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "Hier kannst du allgemeine Einstellungen speichern. Konten und Zugangsdaten bleiben erhalten; Konten fügst du in der accounts-Map der Konfiguration hinzu oder bearbeitest sie dort.",
                " messages\n": " Nachrichten\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "Verwalte benutzerdefinierte IMAP-Ordner. Leeren erfordert Vorschau und Bestätigung, betrifft nur geprüfte Nachrichten und benötigt UIDPLUS (bis zu 2000 Nachrichten). Nur leere Ordner lassen sich löschen. Endgültiges Löschen ist nicht umkehrbar.",
                "New folder": "Neuer Ordner",
                "e.g. Tenders": "z. B. Ausschreibungen",
                "Create": "Erstellen",
                "Save": "Speichern",
                "(System folder)": "(Systemordner)",
                "Rename": "Umbenennen",
                "Empty permanently deletes every message in this folder. Continue?": "Leeren löscht alle Nachrichten in diesem Ordner endgültig. Fortfahren?",
                "Empty": "Leeren",
                "Delete removes the folder and all its messages forever. Continue?": "Löschen entfernt den Ordner und alle seine Nachrichten endgültig. Fortfahren?",
                "Move to Trash": "In den Papierkorb",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "Verschiebt die ausgewählten Nachrichten in den vorhandenen Ordner unten. Das löscht sie nicht endgültig.",
                "Destination folder": "Zielordner",
                "Detect Trash automatically": "Papierkorb automatisch erkennen",
                "Checking messages and folders…": "Nachrichten und Ordner werden geprüft…",
                "Move to: ": "Verschieben nach: ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "Die Bestätigung läuft nach 90 Sekunden ab und muss bei Änderungen im Postfach erneuert werden. Ein 5-minütiges Rückgängigmachen wird angeboten, wenn der Server Ziel-UIDs zurückgibt.",
                "Moving…": "Wird verschoben…",
                "Confirm move: ": "Verschieben bestätigen: ",
                "Email image": "E-Mail-Bild",
                "Failed to load; retry available": "Laden fehlgeschlagen; erneut versuchen möglich",
                "External image blocked": "Externes Bild blockiert",
                "Loading…": "Wird geladen…",
                "View formatted message": "Formatierte Nachricht anzeigen",
                "View plain text": "Nur-Text anzeigen",
                "External images allowed for this message": "Externe Bilder für diese Nachricht erlaubt",
                "Load external images (": "Externe Bilder laden (",
                "Retry images": "Bilder erneut laden",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "Externe Bilder sind standardmäßig blockiert. Das Laden kann dem Absender deine Lesezeit und Netzwerkadresse offenbaren. Die Zustimmung gilt nur für diese Nachricht.",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "Text oder Formatierung überschreiten die Anzeigegrenze. Ein Teil des Inhalts wurde weggelassen; nutze Nur-Text oder deinen E-Mail-Client.",
                "Message details": "Nachrichtendetails",
                "Mark unread": "Als ungelesen markieren",
                "Mark read": "Als gelesen markieren",
                "Unstar": "Markierung entfernen",
                "Star": "Markieren",
                "Edit the reply in Drafts. Review and confirm before sending.": "Bearbeite die Antwort in den Entwürfen. Prüfe und bestätige vor dem Senden.",
                "AI mail workflow & quick prompts": "KI-Mail-Workflow & Schnellbefehle",
                "Linked to open message": "Mit geöffneter Nachricht verknüpft",
                "Expand for 1-click chat prompts": "Aufklappen für 1-Klick-Chatbefehle",
                "1. Connect → 2. Filter mail → 3. Copy prompt → 4. Review & send": "1. Verbinden → 2. Filtern → 3. Befehl kopieren → 4. Prüfen & senden",
                "Summarize unread & tasks": "Ungelesene & Aufgaben zusammenfassen",
                "Summarize important unread mail and list replies needed (do not send).": "Fasse wichtige ungelesene E-Mails zusammen und liste nötige Antworten auf (nicht senden).",
                "Draft a polite reply": "Höflichen Antwortentwurf erstellen",
                "Draft a polite reply to the selected email in Drafts without sending.": "Erstelle in den Entwürfen eine höfliche Antwort auf die ausgewählte E-Mail, ohne sie zu senden.",
                "Check the latest email needing a reply and save a polite draft only.": "Prüfe die neueste unbeantwortete E-Mail und speichere nur einen höflichen Entwurf.",
                "Extract key points & asks": "Kernpunkte & Anliegen extrahieren",
                "Extract the core requests, deadlines, and open questions from this mail.": "Extrahiere Kernanliegen, Fristen und offene Fragen aus dieser E-Mail.",
                "Summarize key requests and deadlines from recent mail in this folder.": "Fasse wichtige Anliegen und Fristen aktueller E-Mails in diesem Ordner zusammen.",
                "Selected mail: ": "Ausgewählte E-Mail: ",
                "Prompt copied — paste in Chat": "Befehl kopiert — im Chat einfügen",
                "Copy failed — check clipboard": "Kopieren fehlgeschlagen — Zwischenablage prüfen",
            },
            ja: {
                "System folders": "システムフォルダー",
                "Custom folders": "カスタムフォルダー",
                "Confirm empty": "空にする",
                "Protected": "保護済み",
                "Raw headers": "元のヘッダー",
                "Header fields": "ヘッダーフィールド",
                "Parsed fields from the mail service": "メールサービスが解析したフィールド",
                "Message list": "メール一覧",
                "With attachments on this page": "このページの添付あり",
                "No messages with attachments on this page": "このページに添付付きメールはありません",
                "Safe preview": "安全なプレビュー",
                "HTML body": "HTML 本文",
                "Plain-text alternative (optional)": "代替のプレーンテキスト（任意）",
                "Message": "本文",
                "Subject": "件名",
                "Recipients To": "宛先 (To)",
                "Copy Cc": "Cc",
                "Discard edits and close": "変更を破棄して閉じる",
                "Save and close": "保存して閉じる",
                "Enter the custom proxy URL.": "カスタムプロキシのアドレスを入力してください。",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Google Cloud で「デスクトップアプリ」の OAuth クライアントを作成し、Gmail のメール許可を有効にして、自分のアカウントをテストユーザーに追加します。ログインはブラウザーで完了するため、メールボックスのパスワードは不要です。",
                "Google client secret (if issued)": "Google クライアントシークレット（発行された場合）",
                "Saved; leave unchanged to keep": "保存済み。変更しない場合はそのまま保持されます",
                "Open Google authorization; this panel updates after sign-in.": "Google の認証ページを開いてください。ログイン後にこのパネルが更新されます。",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Google デスクトップアプリのクライアント ID を入力してください。アカウント ポリシーで許可されている場合は、アプリパスワードも引き続き使用できます。",
                "Sign in with Google": "Google でログイン",
                "API connected · ": "API 接続成功 · ",
                "POP3 connected · ": "POP3 受信接続成功 · ",
                "; SMTP sending was not tested": "。SMTP 送信はテストしていません",
                "Incoming protocol": "受信プロトコル",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "POP3 は受信トレイのみを読み、送信には SMTP を使います。既読・スター状態や送信済みフォルダーはサーバーにありません。検索時は対象範囲を表示します。",
                "POP3 incoming server": "POP3 受信サーバー",
                "SMTP outgoing server (optional for receiving)": "SMTP 送信サーバー（受信のみなら任意）",
                "POP3 host": "POP3 ホスト",
                "SMTP host": "SMTP ホスト",
                "POP3 port": "POP3 ポート",
                "SMTP port": "SMTP ポート",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "TLS が無効です。POP3 のログインと内容は平文で送信されます。平文が意図されている信頼できるサーバーでのみ使用してください。これは STARTTLS ではありません。",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "Google OAuth には独自のデスクトップアプリクライアントが必要です。アプリパスワードが使えるかはアカウント ポリシーによります。",
                "Connection routing": "接続経路",
                "Follow global or environment settings": "グローバル設定または環境設定に従う",
                "Connect directly (ignore proxies)": "直接接続（プロキシを使用しない）",
                "Custom proxy": "カスタムプロキシ",
                "Custom proxy URL": "カスタムプロキシのアドレス",
                "Saved; leave blank to retain": "保存済み。空欄のままにすると保持されます",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "IMAP と SMTP に適用されます。HTTP CONNECT / HTTPS / SOCKS に対応。保存されたアドレスにはパスワードが含まれる場合があり、再表示されません。POP3 の受信は引き続き直接接続します。",
                "API key; leave blank to retain saved key": "API キー。空欄にすると保存済みのキーを保持します",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "AgentMail コンソールの API キーを使用します。キーはローカルのアカウント設定に保存され、DSH バックエンドが選択したリージョンの API を呼び出します。",
                "Mailbox action failed": "メールボックス操作に失敗しました",
                "Mailbox workbench": "メールボックス作業台",
                "Moved ": "移動しました: ",
                " messages to ": " 件 → ",
                "Undo move": "移動を元に戻す",
                "To restore, move the messages back in your mail client.": "元に戻すには、メールクライアントでメッセージを移動し直してください。",
                "Dismiss": "閉じる",
                "Check account settings": "アカウント設定を確認",
                "Loading accounts…": "アカウントを読み込み中…",
                "Mailbox unavailable": "メールボックスを利用できません",
                "Connect your mailbox": "メールボックスを接続",
                "Account settings": "アカウント設定",
                "Add and test an email account to read and reply here.": "メールアカウントを追加してテストすると、ここで読信と返信ができます。",
                "Accounts and folders": "アカウントとフォルダー",
                "Search current folder": "現在のフォルダーを検索",
                "Trash is unavailable for this protocol; delete in your mail client.": "このプロトコルではゴミ箱を利用できません。メールクライアントで削除してください。",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "POP3 受信トレイ · 既読・スター状態や送信済みフォルダーは利用できません。返信はローカル下書きで開き、確認後に SMTP で送信します。",
                "Select page": "ページを選択",
                "Move to Trash (": "ゴミ箱へ移動（",
                ")": "）",
                "Select message: ": "メッセージを選択: ",
                "Unread": "未読",
                "(No subject)": "（件名なし）",
                "Messages could not be loaded": "メッセージを読み込めませんでした",
                "No results in the current search window.": "現在の検索範囲に結果はありません。",
                "This page: ": "このページ: ",
                " messages": " 件",
                " · Ranked by relevance": " ｜ 関連度順",
                " · Mailbox arrival order": " ｜ メールボックス到着順",
                "Add and test an account in settings to browse mail.": "設定でアカウントを追加してテストすると、メールを閲覧できます。",
                "Headers scanned: ": "走査したヘッダー: ",
                "; headers fully covered; body search has a separate limit.": "。ヘッダーは全体を網羅しています。本文検索には別の上限があります。",
                "; folder coverage is partial.": "。フォルダーの走査は途中までです。",
                "Bodies scanned: ": "走査した本文: ",
                " messages; limit ": " 件（上限 ",
                "; bounded by the body display limit.": "）、本文表示の上限による制限です。",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "AgentMail は関連度順に結果を返し、迷惑メール・ゴミ箱などの保護されたメールは対象外です。",
                "Page ": "ページ ",
                "": "",
                "Search older headers": "さらに古いヘッダーを検索",
                "This message could not be loaded": "このメッセージを読み込めませんでした",
                "Open a message to reply in drafts, mark its state or download attachments.": "メッセージを開くと、下書きで返信したり、状態を変更したり、添付ファイルをダウンロードできます。",
                "Email action failed": "メール操作に失敗しました",
                "View plain-text alternative": "プレーンテキスト版を表示",
                "Submitting / check mailbox": "送信中 / メールボックスを確認",
                "Server receipt saved": "サーバー応答を保存済み",
                "Outcome uncertain, check mailbox": "結果不明。メールボックスを確認してください",
                "Draft saved. No email was sent.": "下書きを保存しました。メールは送信されていません。",
                "Scheduled for: ": "予約送信: ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "禁止された宛先が含まれています。送信前に下書きまたは宛先ルールを変更してください。",
                "Blocked: ": "送信禁止: ",
                "Matches a trusted rule": "信頼ルールに一致",
                "(Empty body)": "（本文なし）",
                "Download to check": "ダウンロードして確認",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "添付ファイルはこのプレビュー時点で固定されます。10 分後、または下書き・アカウント・ルールを変更した場合は再確認してください。",
                "I checked the sender, all recipients, content and attachments": "差出人・すべての宛先・本文・添付ファイルを確認しました",
                "Review cancelled. No email was sent.": "確認をキャンセルしました。メールは送信されていません。",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "下書きはこの端末にのみ保存されます。モデルに email_draft で作成させ、ここで編集・保存・確認してください。",
                "The current draft has unsaved edits.": "現在の下書きに未保存の編集があります。",
                "Save and switch": "保存して切り替え",
                "Discard edits and switch": "編集を破棄して切り替え",
                "Keep editing": "編集を続ける",
                "Reopen saved version": "保存済みの版を開き直す",
                "Back to drafts": "下書き一覧に戻る",
                "Untitled draft": "無題の下書き",
                "No account selected": "アカウント未選択",
                "Unsaved": "未保存",
                "No drafts yet": "下書きはまだありません",
                "Choose Compose above to begin.": "上の「作成」を押して開始してください。",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "この下書きは元のスレッドに返信し、引用文を含みます。引用の上に本文を書き、確認してから送信してください。",
                "Unsaved edits": "未保存の編集",
                "Send time: ": "送信日時: ",
                "Cancel schedule and return to draft": "予約を取り消して下書きに戻る",
                "Sending account": "送信アカウント",
                "Choose an account": "アカウントを選択",
                "Schedule (optional, this device’s timezone)": "予約送信（任意・この端末のタイムゾーン）",
                "Scheduled send time": "予約送信日時",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "DSH を起動したままにしてください。終了中に過ぎた時刻は再起動後も送信されません。結果不明の送信は自動再試行しません。",
                "Body format": "本文形式",
                "Plain text": "プレーンテキスト",
                "Formatted HTML": "HTML 整形",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "安全な整形のみをプレビューして送信します。プレーンテキストが未入力なら自動生成します。スクリプトと外部画像は削除されます。",
                "Remove attachment ": "添付ファイルを削除: ",
                "Remove": "削除",
                "Add attachments (save edits first; up to 10 files / ": "添付を追加（先に編集を保存。最大 10 ファイル / ",
                " total)": " 合計）",
                "Add attachments": "添付を追加",
                "Attachment exceeds ": "添付ファイルが上限を超えています: ",
                "Attachments added. Review before sending.": "添付ファイルを追加しました。送信前に確認してください。",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "一部のアドレスが拒否されました。このメールは自動再送しません。サーバーが受理: ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "サーバー応答を保存しました。この下書きは再送信しません。サーバーが受理: ",
                "none": "なし",
                "Server rejected: ": "サーバーが拒否: ",
                "This confirms the server response, not delivery to the recipient inbox.": "これはサーバーの応答であり、受信者の受信トレイへの到達を保証するものではありません。",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "まだ応答がありません。メールボックスを確認してから一覧を更新してください。再送信しないでください。",
                "Copy to a new draft": "新しい下書きにコピー",
                "Delete local draft": "ローカル下書きを削除",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "内容と添付ファイルを新しい未送信の下書きにコピーします。元のメールを送信済み、または結果が不明な場合は、先にメールボックスを確認してください。",
                "Confirm copy": "コピーを確認",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "このローカル下書きとプラグインがアップロードしたコピーを削除します。元のファイルとメールボックス内のメールは残ります。",
                "Confirm delete": "削除を確認",
                "Select a draft or create one to start editing.": "下書きを選択するか、新規作成して編集を始めてください。",
                "Rules saved for this account.": "このアカウントのルールを保存しました。",
                "Trusted recipients": "信頼できる宛先",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "既定では毎回確認します。有効にすると、このアカウントのルールにすべての To/Cc が一致した場合に限り、email_send はプラグイン確認を省略します。ホスト権限は引き続き適用され、下書きは手動確認が必要です。ドメインルールはサブドメインを含みません。",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "禁止された宛先は、送信確認がオフでも信頼ルールより優先されます。禁止は下書き・返信・転送にも適用されます。禁止ドメインは完全一致のみで、サブドメインは含みません。",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "信頼できる返信の省略は既定でオフで、接続設定から有効にできます。返信・全員に返信・転送の実際の To/Cc をすべて確認し、一致しない宛先が1つでもあれば確認が必要です。Full Access でダイアログを表示できない場合は、下書きで手動確認してください。",
                "Global send approval is off; blocked-recipient rules still apply.": "グローバル送信確認はオフです。禁止宛先ルールは引き続き適用されます。",
                "Account for these rules": "このルールの対象アカウント",
                "Choose a configured account": "設定済みのアカウントを選択",
                "Rules have unsaved edits.": "ルールに未保存の編集があります。",
                "Trusted email addresses (one per line)": "信頼できるメールアドレス（1 行に 1 件）",
                "Trusted domains (one per line, all mailboxes in that domain)": "信頼できるドメイン（1 行に 1 件、そのドメインの全メールボックス）",
                "Blocked email addresses (one per line)": "禁止するメールアドレス（1 行に 1 件）",
                "Blocked domains (one per line)": "禁止するドメイン（1 行に 1 件）",
                "Skip plugin approval for email_send when all addresses match": "すべての宛先が一致する場合に email_send のプラグイン確認を省略",
                "Save rules for this account": "このアカウントのルールを保存",
                "Reload rules": "ルールを再読み込み",
                "Unsaved; matching uses the rules you are editing.": "未保存。一致確認には編集中のルールが使われます。",
                "Only saved rules affect model-initiated sends.": "保存済みのルールだけがモデルからの送信に適用されます。",
                "Try recipients To": "宛先 To を試す",
                "Try copy Cc": "Cc を試す",
                "A recipient is blocked; sending is refused.": "禁止された宛先があるため送信できません。",
                "All To/Cc match; plugin approval can be skipped.": "すべての To/Cc が一致しています。プラグイン確認を省略できます。",
                "Plugin approval will remain.": "プラグイン確認は残ります。",
                "Match: ": "一致: ",
                "Task operation failed": "タスク操作に失敗しました",
                "Loading mail tasks…": "メールタスクを読み込み中…",
                "Each line: alias = absolute path to an existing folder": "各行: エイリアス = 既存フォルダーの絶対パス",
                "Duplicate workspace alias": "ワークスペースのエイリアスが重複しています",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "保存しました。初回チェックは基準点を作るだけで、その後届いたメールだけがタスクを起動します。",
                "Starting": "開始中",
                "Running": "実行中",
                "Waiting for your input in DSH": "DSH での確認待ち",
                "Completed": "完了",
                "Needs attention": "確認が必要",
                "Submitting reply": "返信を送信中",
                "Replied": "返信済み",
                "Mail outcome uncertain; check sent mail": "送信結果が不明です。送信済みを確認してください",
                "Turn email into a DSH task": "メールを DSH タスクにする",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "許可されたメールボックスから承認済みワークスペースへタスクを送り、同じセッションをメールで継続できます。既定ではオフです。タスクはモデルを使用し、利用量が発生する場合があります。DSH の権限確認は引き続き必要です。",
                "Native task services are unavailable; update DSH to use this feature.": "ネイティブのタスクサービスが利用できません。この機能を使うには DSH を更新してください。",
                "Task subject prefix": "タスク件名のプレフィックス",
                "Allowed senders (one per line; empty means the mailbox itself)": "許可する送信者（1 行に 1 件。空欄ならメールボックス本人のみ）",
                "Workspace aliases (each line: alias = absolute folder path)": "ワークスペースのエイリアス（各行: エイリアス = フォルダーの絶対パス）",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "タスクはここに保存したエイリアスのみ使用できます。既存のセッションも同じワークスペースに属している必要があります。",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "新しいキーは一度だけ表示されます。古いキーは無効になりました。有効にする前に設定を保存してください。",
                "Rotate task key (pauses tasks)": "タスクキーを更新（タスクは一時停止）",
                "Generate task key": "タスクキーを生成",
                "Copy this email template and keep the key private": "このメールテンプレートをコピーし、キーは大切に保管してください",
                "Write your task here": "ここにタスクを書いてください",
                "Hide key": "キーを隠す",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "件名: dsh:エイリアス または dsh:エイリアス:セッションID。本文の先頭行を DSH-Key: タスクキー とし、次の行からタスクを書きます。このキーは許可リストの送信者が承認済みワークスペースでタスクを開始する権限を与えます。他人に渡さないでください。",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "最終結果を承認済み送信者へ自動返信します（Cc なし。禁止宛先ルールを適用）",
                "Poll interval (seconds)": "確認間隔（秒）",
                "Advanced matching and extraction": "高度なマッチングと抽出",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "ルールは送信者とキーの確認後に実行されます。all / any、項目 subject / body / from / to / cc、演算子 contains / equals / regex を使用できます。名前付きキャプチャは workspace・session・prompt で ${name} として使え、${body} はキーと引用履歴を除いた本文です。ワークスペースの結果は許可されたエイリアスに一致する必要があります。",
                "Rules (JSON array)": "ルール（JSON 配列）",
                "Check finished; see task records below.": "確認が完了しました。下のタスク記録をご覧ください。",
                "Clear finished task records": "終了したタスク記録を消去",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "DSH を起動したままにしてください。再起動後、進行中のタスクは再実行されません。承認待ち・タイムアウト・手動引き継ぎは元のセッションで行ってください。",
                "Session ID": "セッション ID",
                "Open DSH session": "DSH セッションを開く",
                "No tasks yet. The first check establishes a baseline.": "タスクはまだありません。初回チェックは基準点を作るだけです。",
                "Retry save": "保存を再試行",
                "Show new-mail popups": "新着メールのポップアップを表示",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "オフにするとポップアップが非表示になり、自動チェックも停止します。会話内でのメール確認は引き続き可能です。再度オンにすると新しい基準点から始まります。",
                "Reply quote language": "返信の引用言語",
                "Follow interface; English if unknown": "インターフェースに従う（不明時は英語）",
                "Allow trusted replies without confirmation (off by default)": "信頼できる返信を確認なしで許可（既定ではオフ）",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "有効にすると、返信・全員に返信・転送の実際の To/Cc がすべてそのアカウントの信頼ルールに一致する必要があります。禁止ルールとホスト権限は引き続き適用されます。",
                "Quote date timezone (optional)": "引用日時のタイムゾーン（任意）",
                "These accounts are managed in the configuration file: ": "次のアカウントは設定ファイルで管理されています: ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "ここでは共通設定を保存できます。アカウントと認証情報はそのまま保持されます。追加や編集は設定ファイルの accounts で行ってください。",
                " messages\n": " 件\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "IMAP の自建フォルダーを管理します。空にする操作はプレビューと確認が必要で、確認したメールのみが対象、UIDPLUS が必要です（最大 2000 件）。削除できるのは空のフォルダーだけです。完全削除は元に戻せません。",
                "New folder": "新しいフォルダー",
                "e.g. Tenders": "例: 入札",
                "Create": "作成",
                "Save": "保存",
                "(System folder)": "（システムフォルダー）",
                "Rename": "名前を変更",
                "Empty permanently deletes every message in this folder. Continue?": "空にすると、このフォルダー内のすべてのメールが完全に削除されます。続行しますか？",
                "Empty": "空にする",
                "Delete removes the folder and all its messages forever. Continue?": "削除すると、フォルダーとそのすべてのメールが完全に削除されます。続行しますか？",
                "Move to Trash": "ゴミ箱へ移動",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "選択したメールを下の既存フォルダーへ移動します。完全削除は行いません。",
                "Destination folder": "移動先フォルダー",
                "Detect Trash automatically": "ゴミ箱を自動判定",
                "Checking messages and folders…": "メールとフォルダーを確認中…",
                "Move to: ": "移動先: ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "確認の有効期限は 90 秒で、メールボックスが変わるとやり直しが必要です。サーバーが移動先 UID を返した場合は 5 分間取り消せます。",
                "Moving…": "移動中…",
                "Confirm move: ": "移動を確認: ",
                "Email image": "メール画像",
                "Failed to load; retry available": "読み込みに失敗しました。再試行できます",
                "External image blocked": "外部画像をブロックしました",
                "Loading…": "読み込み中…",
                "View formatted message": "整形されたメールを表示",
                "View plain text": "プレーンテキストを表示",
                "External images allowed for this message": "このメールでは外部画像を許可しました",
                "Load external images (": "外部画像を読み込む（",
                "Retry images": "画像を再試行",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "外部画像は既定でブロックされます。読み込むと、閲覧時刻やネットワークアドレスが送信者に伝わる可能性があります。許可はこのメールにのみ適用されます。",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "本文または整形が表示上限を超えています。一部の内容は省略されました。プレーンテキストかメールクライアントで確認してください。",
                "Message details": "メッセージの詳細",
                "Mark unread": "未読にする",
                "Mark read": "既読にする",
                "Unstar": "スターを外す",
                "Star": "スターを付ける",
                "Edit the reply in Drafts. Review and confirm before sending.": "返信は下書きで編集します。送信前に確認してください。",
                "AI mail workflow & quick prompts": "AI メール連携フローと定型指示",
                "Linked to open message": "開いているメールと連携中",
                "Expand for 1-click chat prompts": "開いてチャット用指示を1クリックコピー",
                "1. Connect → 2. Filter mail → 3. Copy prompt → 4. Review & send": "1. 接続 → 2. 絞り込み・閲覧 → 3. 指示をコピー → 4. 下書き確認後に送信",
                "Summarize unread & tasks": "未読の要約と要返信リスト",
                "Summarize important unread mail and list replies needed (do not send).": "重要な未読メールを要約し、返信が必要な項目を一覧にしてください（送信はしない）。",
                "Draft a polite reply": "丁寧な返信下書きを作成",
                "Draft a polite reply to the selected email in Drafts without sending.": "選択中のメールに対する丁寧な返信案を下書きに保存してください（送信はしない）。",
                "Check the latest email needing a reply and save a polite draft only.": "返信が必要な最新メールを確認し、丁寧な返信下書きのみ保存してください。",
                "Extract key points & asks": "要点・期限・確認事項を抽出",
                "Extract the core requests, deadlines, and open questions from this mail.": "このメールの主な依頼内容、期限、確認が必要な事項を整理してください。",
                "Summarize key requests and deadlines from recent mail in this folder.": "このフォルダーの最近のメールから主な依頼と期限を整理してください。",
                "Selected mail: ": "対象メール: ",
                "Prompt copied — paste in Chat": "指示をコピーしました — チャットに貼り付け",
                "Copy failed — check clipboard": "コピー失敗 — クリップボード権限を確認",
            },
            pt: {
                "System folders": "Pastas do sistema",
                "Custom folders": "Pastas personalizadas",
                "Confirm empty": "Confirmar esvaziamento",
                "Protected": "Protegida",
                "Raw headers": "Cabeçalhos originais",
                "Header fields": "Campos do cabeçalho",
                "Parsed fields from the mail service": "Campos analisados pelo serviço de e-mail",
                "Message list": "Lista de mensagens",
                "With attachments on this page": "Com anexos nesta página",
                "No messages with attachments on this page": "Nenhuma mensagem com anexo nesta página",
                "Safe preview": "Prévia segura",
                "HTML body": "Corpo HTML",
                "Plain-text alternative (optional)": "Versão em texto simples (opcional)",
                "Message": "Mensagem",
                "Subject": "Assunto",
                "Recipients To": "Destinatários (Para)",
                "Copy Cc": "Cópia (Cc)",
                "Discard edits and close": "Descartar alterações e fechar",
                "Save and close": "Salvar e fechar",
                "Enter the custom proxy URL.": "Informe o endereço do proxy personalizado.",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Crie um cliente OAuth do tipo “Desktop app” no Google Cloud, ative o consentimento do Gmail e adicione sua conta como usuário de teste. O login é concluído no navegador; não é necessário informar a senha da caixa de correio.",
                "Google client secret (if issued)": "Segredo do cliente Google (se emitido)",
                "Saved; leave unchanged to keep": "Salvo; deixe como está para manter",
                "Open Google authorization; this panel updates after sign-in.": "Abra a autorização do Google; este painel é atualizado após o login.",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Informe o ID de cliente do seu aplicativo de desktop do Google. As senhas de aplicativo continuam disponíveis quando a política da conta permite.",
                "Sign in with Google": "Entrar com o Google",
                "API connected · ": "API conectada · ",
                "POP3 connected · ": "POP3 conectado · ",
                "; SMTP sending was not tested": "; o envio por SMTP não foi testado",
                "Incoming protocol": "Protocolo de recebimento",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "O POP3 lê a caixa de entrada e usa SMTP para enviar. Não há marcações de lido/favorito nem pasta Enviados no servidor; a pesquisa informa seu alcance.",
                "POP3 incoming server": "Servidor de entrada POP3",
                "SMTP outgoing server (optional for receiving)": "Servidor de saída SMTP (opcional para receber)",
                "POP3 host": "Host POP3",
                "SMTP host": "Host SMTP",
                "POP3 port": "Porta POP3",
                "SMTP port": "Porta SMTP",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "O TLS está desativado: o login e o conteúdo POP3 trafegam em texto simples. Use apenas com um servidor confiável em que o texto simples seja intencional. Isto não é STARTTLS.",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "O Google OAuth exige seu próprio cliente de aplicativo de desktop; a disponibilidade de senhas de aplicativo depende da política da conta.",
                "Connection routing": "Roteamento da conexão",
                "Follow global or environment settings": "Seguir as configurações globais ou de ambiente",
                "Connect directly (ignore proxies)": "Conectar diretamente (ignorar proxies)",
                "Custom proxy": "Proxy personalizado",
                "Custom proxy URL": "Endereço do proxy personalizado",
                "Saved; leave blank to retain": "Salvo; deixe em branco para manter",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "Aplica-se a IMAP e SMTP. Compatível com HTTP CONNECT, HTTPS e SOCKS. Os endereços salvos podem conter senhas e não são exibidos. O recebimento POP3 continua conectando diretamente.",
                "API key; leave blank to retain saved key": "Chave de API; deixe vazio para manter a chave salva",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "Use uma chave de API do console do AgentMail. A chave fica na configuração local da conta; o backend do DSH chama a região selecionada.",
                "Mailbox action failed": "A operação na caixa de correio falhou",
                "Mailbox workbench": "Área de trabalho da caixa de correio",
                "Moved ": "Movidas ",
                " messages to ": " mensagens para ",
                "Undo move": "Desfazer movimentação",
                "To restore, move the messages back in your mail client.": "Para restaurar, mova as mensagens de volta no seu cliente de e-mail.",
                "Dismiss": "Dispensar",
                "Check account settings": "Verificar as configurações da conta",
                "Loading accounts…": "Carregando contas…",
                "Mailbox unavailable": "Caixa de correio indisponível",
                "Connect your mailbox": "Conecte sua caixa de correio",
                "Account settings": "Configurações da conta",
                "Add and test an email account to read and reply here.": "Adicione e teste uma conta de e-mail para ler e responder aqui.",
                "Accounts and folders": "Contas e pastas",
                "Search current folder": "Pesquisar na pasta atual",
                "Trash is unavailable for this protocol; delete in your mail client.": "A lixeira não está disponível neste protocolo; exclua as mensagens no seu cliente de e-mail.",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "Caixa de entrada POP3 · Não há marcações de lido/favorito nem pasta Enviados. As respostas abrem nos rascunhos locais e saem por SMTP após confirmação.",
                "Select page": "Selecionar página",
                "Move to Trash (": "Mover para a lixeira (",
                ")": ")",
                "Select message: ": "Selecionar mensagem: ",
                "Unread": "Não lido",
                "(No subject)": "(Sem assunto)",
                "Messages could not be loaded": "Não foi possível carregar as mensagens",
                "No results in the current search window.": "Nenhum resultado no intervalo de pesquisa atual.",
                "This page: ": "Esta página: ",
                " messages": " mensagens",
                " · Ranked by relevance": " · Ordenado por relevância",
                " · Mailbox arrival order": " · Ordem de chegada na caixa",
                "Add and test an account in settings to browse mail.": "Adicione e teste uma conta nas configurações para navegar pelos e-mails.",
                "Headers scanned: ": "Cabeçalhos verificados: ",
                "; headers fully covered; body search has a separate limit.": "; os cabeçalhos estão completos; a pesquisa no corpo tem outro limite.",
                "; folder coverage is partial.": "; a cobertura da pasta é parcial.",
                "Bodies scanned: ": "Corpos verificados: ",
                " messages; limit ": " mensagens; limite ",
                "; bounded by the body display limit.": "; limitado pelo máximo de exibição do corpo.",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "O AgentMail ordena os resultados por relevância e exclui spam, lixeira e outros e-mails protegidos.",
                "Page ": "Página ",
                "": "",
                "Search older headers": "Pesquisar cabeçalhos mais antigos",
                "This message could not be loaded": "Não foi possível carregar esta mensagem",
                "Open a message to reply in drafts, mark its state or download attachments.": "Abra uma mensagem para responder nos rascunhos, marcar o estado ou baixar anexos.",
                "Email action failed": "A operação de e-mail falhou",
                "View plain-text alternative": "Ver a alternativa em texto simples",
                "Submitting / check mailbox": "Enviando / verifique a caixa",
                "Server receipt saved": "Recibo do servidor salvo",
                "Outcome uncertain, check mailbox": "Resultado incerto, verifique a caixa",
                "Draft saved. No email was sent.": "Rascunho salvo. Nenhum e-mail foi enviado.",
                "Scheduled for: ": "Agendado para: ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "Há um destinatário bloqueado. Altere o rascunho ou as regras de destinatários antes de enviar.",
                "Blocked: ": "Bloqueado: ",
                "Matches a trusted rule": "Corresponde a uma regra de confiança",
                "(Empty body)": "(Corpo vazio)",
                "Download to check": "Baixar para verificar",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "Os anexos ficam fixos nesta prévia. Revise novamente após 10 minutos ou se o rascunho, a conta ou as regras mudarem.",
                "I checked the sender, all recipients, content and attachments": "Revisei o remetente, todos os destinatários, o conteúdo e os anexos",
                "Review cancelled. No email was sent.": "Revisão cancelada. Nenhum e-mail foi enviado.",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "Os rascunhos ficam neste dispositivo. Peça ao modelo para preparar um com email_draft e depois edite, salve e confirme aqui.",
                "The current draft has unsaved edits.": "O rascunho atual tem alterações não salvas.",
                "Save and switch": "Salvar e trocar",
                "Discard edits and switch": "Descartar alterações e trocar",
                "Keep editing": "Continuar editando",
                "Reopen saved version": "Reabrir a versão salva",
                "Back to drafts": "Voltar aos rascunhos",
                "Untitled draft": "Rascunho sem título",
                "No account selected": "Nenhuma conta selecionada",
                "Unsaved": "Não salvo",
                "No drafts yet": "Ainda não há rascunhos",
                "Choose Compose above to begin.": "Clique em “Redigir” acima para começar.",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "Este rascunho responde no tópico original e inclui uma cópia citada. Escreva acima da citação, revise e confirme antes de enviar.",
                "Unsaved edits": "Alterações não salvas",
                "Send time: ": "Horário de envio: ",
                "Cancel schedule and return to draft": "Cancelar o agendamento e voltar ao rascunho",
                "Sending account": "Conta de envio",
                "Choose an account": "Escolha uma conta",
                "Schedule (optional, this device’s timezone)": "Agendar (opcional, fuso horário deste dispositivo)",
                "Scheduled send time": "Horário de envio agendado",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "Mantenha o DSH em execução. Horários perdidos enquanto ele estava fechado não são enviados ao reiniciar; envios incertos nunca são repetidos automaticamente.",
                "Body format": "Formato do corpo",
                "Plain text": "Texto simples",
                "Formatted HTML": "HTML formatado",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "Pré-visualize e envie formatação segura. O texto simples é gerado quando omitido. Scripts e imagens externas são removidos.",
                "Remove attachment ": "Remover o anexo ",
                "Remove": "Remover",
                "Add attachments (save edits first; up to 10 files / ": "Adicionar anexos (salve as alterações antes; até 10 arquivos / ",
                " total)": " no total)",
                "Add attachments": "Adicionar anexos",
                "Attachment exceeds ": "O anexo excede ",
                "Attachments added. Review before sending.": "Anexos adicionados. Revise antes de enviar.",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "Alguns endereços foram recusados. Este e-mail não será reenviado automaticamente. Aceitos pelo servidor: ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "Recibo do servidor salvo. Este rascunho não será enviado novamente. Aceitos pelo servidor: ",
                "none": "nenhum",
                "Server rejected: ": "Recusados pelo servidor: ",
                "This confirms the server response, not delivery to the recipient inbox.": "Isto confirma a resposta do servidor, não a entrega na caixa do destinatário.",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "Ainda sem recibo. Verifique sua caixa e atualize a lista. Não envie novamente.",
                "Copy to a new draft": "Copiar para um novo rascunho",
                "Delete local draft": "Excluir o rascunho local",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "Copia o conteúdo e os anexos para um novo rascunho não enviado. Verifique a caixa antes se o original foi enviado ou o resultado é incerto.",
                "Confirm copy": "Confirmar cópia",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "Exclui este rascunho local e as cópias enviadas pela extensão. Os arquivos originais e as mensagens da caixa permanecem.",
                "Confirm delete": "Confirmar exclusão",
                "Select a draft or create one to start editing.": "Selecione um rascunho ou crie um para começar a editar.",
                "Rules saved for this account.": "Regras salvas para esta conta.",
                "Trusted recipients": "Destinatários confiáveis",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "A confirmação é o padrão. Quando ativada, o email_send só dispensa a confirmação da extensão se todos os endereços To/Cc corresponderem às regras desta conta. As permissões do host continuam valendo e os rascunhos ainda exigem confirmação manual. Regras de domínio não incluem subdomínios.",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "Destinatários bloqueados têm precedência sobre regras de confiança, mesmo com a confirmação de envio desativada. Os bloqueios também valem para rascunhos, respostas e encaminhamentos. Domínios bloqueados exigem correspondência exata e não incluem subdomínios.",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "A dispensa para respostas confiáveis fica desativada por padrão e pode ser ativada nas configurações de conexão. Ela verifica todos os To/Cc reais em respostas, responder a todos e encaminhamentos; qualquer destinatário não correspondente ainda exige confirmação. Se o Full Access não puder exibir um aviso, use Rascunhos.",
                "Global send approval is off; blocked-recipient rules still apply.": "A confirmação global de envio está desativada; as regras de destinatários bloqueados continuam valendo.",
                "Account for these rules": "Conta destas regras",
                "Choose a configured account": "Escolha uma conta configurada",
                "Rules have unsaved edits.": "As regras têm alterações não salvas.",
                "Trusted email addresses (one per line)": "Endereços de e-mail confiáveis (um por linha)",
                "Trusted domains (one per line, all mailboxes in that domain)": "Domínios confiáveis (um por linha, todas as caixas do domínio)",
                "Blocked email addresses (one per line)": "Endereços de e-mail bloqueados (um por linha)",
                "Blocked domains (one per line)": "Domínios bloqueados (um por linha)",
                "Skip plugin approval for email_send when all addresses match": "Dispensar a confirmação da extensão para email_send quando todos os endereços corresponderem",
                "Save rules for this account": "Salvar as regras desta conta",
                "Reload rules": "Recarregar as regras",
                "Unsaved; matching uses the rules you are editing.": "Não salvo; a verificação usa as regras que você está editando.",
                "Only saved rules affect model-initiated sends.": "Apenas as regras salvas afetam os envios iniciados pelo modelo.",
                "Try recipients To": "Testar destinatários To",
                "Try copy Cc": "Testar cópia Cc",
                "A recipient is blocked; sending is refused.": "Há um destinatário bloqueado; o envio é recusado.",
                "All To/Cc match; plugin approval can be skipped.": "Todos os To/Cc correspondem; a confirmação da extensão pode ser dispensada.",
                "Plugin approval will remain.": "A confirmação da extensão continuará.",
                "Match: ": "Correspondência: ",
                "Task operation failed": "A operação da tarefa falhou",
                "Loading mail tasks…": "Carregando tarefas de e-mail…",
                "Each line: alias = absolute path to an existing folder": "Cada linha: alias = caminho absoluto para uma pasta existente",
                "Duplicate workspace alias": "Alias de área de trabalho duplicado",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "Salvo. A primeira verificação apenas define um ponto de partida; somente e-mails posteriores podem acionar tarefas.",
                "Starting": "Iniciando",
                "Running": "Em execução",
                "Waiting for your input in DSH": "Aguardando sua confirmação no DSH",
                "Completed": "Concluída",
                "Needs attention": "Requer atenção",
                "Submitting reply": "Enviando a resposta",
                "Replied": "Respondida",
                "Mail outcome uncertain; check sent mail": "Resultado do envio incerto; verifique os enviados",
                "Turn email into a DSH task": "Transformar e-mail em tarefa do DSH",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "Envie uma tarefa de uma caixa autorizada para um workspace aprovado e continue a mesma sessão por e-mail. Desativado por padrão. As tarefas usam seu modelo e podem gerar consumo; as permissões do DSH ainda exigem sua confirmação.",
                "Native task services are unavailable; update DSH to use this feature.": "Os serviços nativos de tarefas não estão disponíveis; atualize o DSH para usar este recurso.",
                "Task subject prefix": "Prefixo do assunto da tarefa",
                "Allowed senders (one per line; empty means the mailbox itself)": "Remetentes permitidos (um por linha; vazio significa a própria caixa)",
                "Workspace aliases (each line: alias = absolute folder path)": "Aliases de workspace (cada linha: alias = caminho absoluto de pasta)",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "As tarefas só podem usar os aliases salvos. As sessões existentes precisam pertencer a esse workspace.",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "A nova chave é exibida uma única vez; a antiga é inválida. Salve a configuração antes de ativar.",
                "Rotate task key (pauses tasks)": "Renovar a chave de tarefas (pausa as tarefas)",
                "Generate task key": "Gerar chave de tarefas",
                "Copy this email template and keep the key private": "Copie este modelo de e-mail e mantenha a chave em sigilo",
                "Write your task here": "Escreva sua tarefa aqui",
                "Hide key": "Ocultar a chave",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "Assunto: dsh:alias ou dsh:alias:sessionId. Comece o corpo com DSH-Key: sua-chave-de-tarefa e depois escreva a tarefa. A chave autoriza remetentes da lista de permissões a iniciar tarefas no seu workspace aprovado; mantenha-a em sigilo.",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "Enviar automaticamente o resultado final ao remetente autorizado (sem Cc; bloqueios de destinatários se aplicam)",
                "Poll interval (seconds)": "Intervalo de verificação (segundos)",
                "Advanced matching and extraction": "Correspondência e extração avançadas",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "As regras são executadas após a verificação do remetente e da chave. Use all / any, campos subject / body / from / to / cc e operadores contains / equals / regex. Capturas nomeadas funcionam como ${name} em workspace, session e prompt; ${body} é o corpo sem a chave e o histórico citado. O resultado do workspace precisa corresponder a um alias permitido.",
                "Rules (JSON array)": "Regras (array JSON)",
                "Check finished; see task records below.": "Verificação concluída; veja os registros de tarefas abaixo.",
                "Clear finished task records": "Limpar os registros de tarefas concluídas",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "Mantenha o DSH em execução. Tarefas em andamento não são repetidas após reiniciar. Trate aprovações, tempos esgotados ou assuma manualmente na sessão original.",
                "Session ID": "ID da sessão",
                "Open DSH session": "Abrir a sessão do DSH",
                "No tasks yet. The first check establishes a baseline.": "Ainda não há tarefas. A primeira verificação apenas define um ponto de partida.",
                "Retry save": "Tentar salvar novamente",
                "Show new-mail popups": "Mostrar avisos de novo e-mail",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "Desativar oculta o aviso e interrompe as verificações automáticas. Você ainda pode verificar e-mails em uma conversa. Ao reativar, começa de um novo ponto de partida.",
                "Reply quote language": "Idioma da citação nas respostas",
                "Follow interface; English if unknown": "Seguir a interface; inglês se desconhecido",
                "Allow trusted replies without confirmation (off by default)": "Permitir respostas confiáveis sem confirmação (desativado por padrão)",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "Quando ativado, todos os To/Cc reais de uma resposta, resposta a todos ou encaminhamento precisam corresponder às regras de confiança dessa conta. As regras de bloqueio e as permissões do host continuam valendo.",
                "Quote date timezone (optional)": "Fuso horário da data citada (opcional)",
                "These accounts are managed in the configuration file: ": "Estas contas são gerenciadas no arquivo de configuração: ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "Aqui você pode salvar as configurações gerais. As contas e credenciais são preservadas; adicione ou edite contas no mapa accounts da configuração.",
                " messages\n": " mensagens\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "Gerencie pastas IMAP personalizadas. O esvaziamento exige prévia e confirmação, afeta apenas as mensagens revisadas e requer UIDPLUS (até 2000 mensagens). Só pastas vazias podem ser excluídas. A exclusão permanente não pode ser desfeita.",
                "New folder": "Nova pasta",
                "e.g. Tenders": "ex.: Licitações",
                "Create": "Criar",
                "Save": "Salvar",
                "(System folder)": "(Pasta do sistema)",
                "Rename": "Renomear",
                "Empty permanently deletes every message in this folder. Continue?": "Esvaziar exclui permanentemente todas as mensagens desta pasta. Continuar?",
                "Empty": "Esvaziar",
                "Delete removes the folder and all its messages forever. Continue?": "Excluir remove a pasta e todas as suas mensagens para sempre. Continuar?",
                "Move to Trash": "Mover para a lixeira",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "Move as mensagens selecionadas para a pasta existente abaixo. Isso não as exclui permanentemente.",
                "Destination folder": "Pasta de destino",
                "Detect Trash automatically": "Detectar a lixeira automaticamente",
                "Checking messages and folders…": "Verificando mensagens e pastas…",
                "Move to: ": "Mover para: ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "A confirmação expira em 90 segundos e precisa ser renovada se a caixa mudar. Um desfazer de 5 minutos é oferecido quando o servidor retorna os UIDs de destino.",
                "Moving…": "Movendo…",
                "Confirm move: ": "Confirmar movimentação: ",
                "Email image": "Imagem do e-mail",
                "Failed to load; retry available": "Falha ao carregar; nova tentativa disponível",
                "External image blocked": "Imagem externa bloqueada",
                "Loading…": "Carregando…",
                "View formatted message": "Ver a mensagem formatada",
                "View plain text": "Ver texto simples",
                "External images allowed for this message": "Imagens externas permitidas para esta mensagem",
                "Load external images (": "Carregar imagens externas (",
                "Retry images": "Tentar imagens novamente",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "Imagens externas são bloqueadas por padrão. Carregá-las pode revelar ao remetente seu horário de leitura e endereço de rede. O consentimento vale apenas para esta mensagem.",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "O corpo ou a formatação excede o limite de exibição. Parte do conteúdo foi omitida; tente o texto simples ou seu cliente de e-mail.",
                "Message details": "Detalhes da mensagem",
                "Mark unread": "Marcar como não lido",
                "Mark read": "Marcar como lido",
                "Unstar": "Remover a estrela",
                "Star": "Destacar",
                "Edit the reply in Drafts. Review and confirm before sending.": "Edite a resposta em Rascunhos. Revise e confirme antes de enviar.",
                "AI mail workflow & quick prompts": "Fluxo de e-mail com IA e comandos rápidos",
                "Linked to open message": "Vinculado à mensagem aberta",
                "Expand for 1-click chat prompts": "Expandir para copiar comandos com 1 clique",
                "1. Connect → 2. Filter mail → 3. Copy prompt → 4. Review & send": "1. Conectar → 2. Filtrar e-mail → 3. Copiar comando → 4. Revisar e enviar",
                "Summarize unread & tasks": "Resumir não lidos e pendências",
                "Summarize important unread mail and list replies needed (do not send).": "Resuma os e-mails não lidos importantes e liste as respostas pendentes (sem enviar).",
                "Draft a polite reply": "Redigir resposta cordial",
                "Draft a polite reply to the selected email in Drafts without sending.": "Redija uma resposta cordial ao e-mail selecionado em Rascunhos sem enviar.",
                "Check the latest email needing a reply and save a polite draft only.": "Verifique o último e-mail que precisa de resposta e salve apenas um rascunho cordial.",
                "Extract key points & asks": "Extrair pontos-chave e pedidos",
                "Extract the core requests, deadlines, and open questions from this mail.": "Extraia os pedidos principais, prazos e questões em aberto deste e-mail.",
                "Summarize key requests and deadlines from recent mail in this folder.": "Resuma os pedidos principais e prazos dos e-mails recentes nesta pasta.",
                "Selected mail: ": "E-mail selecionado: ",
                "Prompt copied — paste in Chat": "Comando copiado — cole no chat",
                "Copy failed — check clipboard": "Falha ao copiar — verifique a área de transferência",
            },
            ru: {
                "System folders": "Системные папки",
                "Custom folders": "Пользовательские папки",
                "Confirm empty": "Подтвердить очистку",
                "Protected": "Защищённая",
                "Raw headers": "Исходные заголовки",
                "Header fields": "Поля заголовка",
                "Parsed fields from the mail service": "Поля, разобранные почтовой службой",
                "Message list": "Список писем",
                "With attachments on this page": "С вложениями на этой странице",
                "No messages with attachments on this page": "На этой странице нет писем с вложениями",
                "Safe preview": "Безопасный предпросмотр",
                "HTML body": "Текст HTML",
                "Plain-text alternative (optional)": "Текстовая версия (необязательно)",
                "Message": "Текст письма",
                "Subject": "Тема",
                "Recipients To": "Получатели (Кому)",
                "Copy Cc": "Копия (Cc)",
                "Discard edits and close": "Отменить изменения и закрыть",
                "Save and close": "Сохранить и закрыть",
                "Enter the custom proxy URL.": "Введите адрес собственного прокси.",
                "Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.": "Создайте в Google Cloud OAuth-клиент типа «Desktop app», включите согласие для Gmail и добавьте свой аккаунт в тестовые пользователи. Вход завершается в браузере; пароль от почтового ящика не требуется.",
                "Google client secret (if issued)": "Секрет клиента Google (если выдан)",
                "Saved; leave unchanged to keep": "Сохранено; оставьте без изменений, чтобы сохранить",
                "Open Google authorization; this panel updates after sign-in.": "Откройте страницу авторизации Google; после входа панель обновится.",
                "Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.": "Укажите идентификатор клиента вашего приложения Google для настольных систем. Пароли приложений остаются доступны, если это разрешает политика аккаунта.",
                "Sign in with Google": "Войти через Google",
                "API connected · ": "API подключён · ",
                "POP3 connected · ": "POP3 подключён · ",
                "; SMTP sending was not tested": "; отправка через SMTP не проверялась",
                "Incoming protocol": "Протокол получения",
                "POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.": "POP3 читает только входящие, а отправка идёт через SMTP. Флагов «прочитано»/«важное» и папки «Отправленные» на сервере нет; поиск сообщает охват.",
                "POP3 incoming server": "Сервер входящей почты POP3",
                "SMTP outgoing server (optional for receiving)": "Сервер исходящей почты SMTP (необязателен для получения)",
                "POP3 host": "Хост POP3",
                "SMTP host": "Хост SMTP",
                "POP3 port": "Порт POP3",
                "SMTP port": "Порт SMTP",
                "TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.": "TLS отключён: вход и содержимое POP3 передаются открытым текстом. Используйте только с доверенным сервером, где это предусмотрено. Это не STARTTLS.",
                "Google OAuth requires your own Desktop app client; app-password availability depends on account policy.": "Google OAuth требует собственного клиента приложения для настольных систем; доступность паролей приложений зависит от политики аккаунта.",
                "Connection routing": "Маршрут подключения",
                "Follow global or environment settings": "Следовать глобальным настройкам или переменным среды",
                "Connect directly (ignore proxies)": "Подключаться напрямую (без прокси)",
                "Custom proxy": "Свой прокси",
                "Custom proxy URL": "Адрес своего прокси",
                "Saved; leave blank to retain": "Сохранено; оставьте пустым, чтобы сохранить",
                "Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.": "Применяется к IMAP и SMTP. Поддерживаются HTTP CONNECT, HTTPS и SOCKS. Сохранённые адреса могут содержать пароли и не отображаются. Получение по POP3 по-прежнему идёт напрямую.",
                "API key; leave blank to retain saved key": "Ключ API; оставьте пустым, чтобы сохранить текущий",
                "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.": "Используйте ключ API из консоли AgentMail. Ключ хранится в локальной конфигурации аккаунта, а бэкенд DSH обращается к выбранному региону.",
                "Mailbox action failed": "Не удалось выполнить действие с почтовым ящиком",
                "Mailbox workbench": "Рабочая область почтового ящика",
                "Moved ": "Перемещено: ",
                " messages to ": " сообщений в ",
                "Undo move": "Отменить перемещение",
                "To restore, move the messages back in your mail client.": "Чтобы восстановить, переместите письма обратно в почтовом клиенте.",
                "Dismiss": "Скрыть",
                "Check account settings": "Проверить настройки аккаунта",
                "Loading accounts…": "Загрузка аккаунтов…",
                "Mailbox unavailable": "Почтовый ящик недоступен",
                "Connect your mailbox": "Подключите почтовый ящик",
                "Account settings": "Настройки аккаунта",
                "Add and test an email account to read and reply here.": "Добавьте и проверьте почтовый аккаунт, чтобы читать и отвечать здесь.",
                "Accounts and folders": "Аккаунты и папки",
                "Search current folder": "Искать в текущей папке",
                "Trash is unavailable for this protocol; delete in your mail client.": "Корзина недоступна для этого протокола; удаляйте письма в почтовом клиенте.",
                "POP3 inbox · Server read/star flags and a Sent folder are unavailable. Replies open in local Drafts and use SMTP after confirmation.": "Входящие POP3 · Флаги «прочитано»/«важное» и папка «Отправленные» недоступны. Ответы открываются в локальных черновиках и отправляются через SMTP после подтверждения.",
                "Select page": "Выбрать страницу",
                "Move to Trash (": "В корзину (",
                ")": ")",
                "Select message: ": "Выбрать письмо: ",
                "Unread": "Непрочитанное",
                "(No subject)": "(Без темы)",
                "Messages could not be loaded": "Не удалось загрузить письма",
                "No results in the current search window.": "В текущем диапазоне поиска ничего не найдено.",
                "This page: ": "На этой странице: ",
                " messages": " писем",
                " · Ranked by relevance": " · По релевантности",
                " · Mailbox arrival order": " · По порядку поступления",
                "Add and test an account in settings to browse mail.": "Добавьте и проверьте аккаунт в настройках, чтобы просматривать почту.",
                "Headers scanned: ": "Проверено заголовков: ",
                "; headers fully covered; body search has a separate limit.": "; заголовки охвачены полностью; у поиска по тексту свой лимит.",
                "; folder coverage is partial.": "; папка охвачена не полностью.",
                "Bodies scanned: ": "Проверено текстов: ",
                " messages; limit ": " писем; лимит ",
                "; bounded by the body display limit.": "; ограничено лимитом отображения текста.",
                "AgentMail ranks results by relevance and excludes spam, trash and other protected mail.": "AgentMail сортирует результаты по релевантности и исключает спам, корзину и другие защищённые письма.",
                "Page ": "Страница ",
                "": "",
                "Search older headers": "Искать более старые заголовки",
                "This message could not be loaded": "Не удалось загрузить это письмо",
                "Open a message to reply in drafts, mark its state or download attachments.": "Откройте письмо, чтобы ответить черновиком, изменить состояние или скачать вложения.",
                "Email action failed": "Не удалось выполнить действие с почтой",
                "View plain-text alternative": "Показать текстовую версию",
                "Submitting / check mailbox": "Отправляется / проверьте ящик",
                "Server receipt saved": "Отметка сервера сохранена",
                "Outcome uncertain, check mailbox": "Результат неизвестен, проверьте ящик",
                "Draft saved. No email was sent.": "Черновик сохранён. Письмо не отправлено.",
                "Scheduled for: ": "Запланировано на: ",
                "A recipient is blocked. Change the draft or recipient rules before sending.": "Один из получателей заблокирован. Измените черновик или правила получателей перед отправкой.",
                "Blocked: ": "Заблокирован: ",
                "Matches a trusted rule": "Соответствует доверенному правилу",
                "(Empty body)": "(Пустое письмо)",
                "Download to check": "Скачать для проверки",
                "Attachments are fixed to this preview. Review again after 10 minutes or when the draft, account or rules change.": "Вложения зафиксированы в этой версии предпросмотра. Проверьте снова через 10 минут или после изменения черновика, аккаунта либо правил.",
                "I checked the sender, all recipients, content and attachments": "Я проверил отправителя, всех получателей, текст и вложения",
                "Review cancelled. No email was sent.": "Проверка отменена. Письмо не отправлено.",
                "Drafts stay on this device. Ask the model to prepare one with email_draft, then edit, save and confirm here.": "Черновики остаются на этом устройстве. Попросите модель подготовить черновик через email_draft, затем отредактируйте, сохраните и подтвердите здесь.",
                "The current draft has unsaved edits.": "В текущем черновике есть несохранённые изменения.",
                "Save and switch": "Сохранить и переключить",
                "Discard edits and switch": "Отменить изменения и переключить",
                "Keep editing": "Продолжить редактирование",
                "Reopen saved version": "Открыть сохранённую версию",
                "Back to drafts": "Назад к черновикам",
                "Untitled draft": "Черновик без названия",
                "No account selected": "Аккаунт не выбран",
                "Unsaved": "Не сохранено",
                "No drafts yet": "Черновиков пока нет",
                "Choose Compose above to begin.": "Нажмите «Написать» выше, чтобы начать.",
                "This draft replies in the original thread and includes a quoted copy. Write above the quote, then review and confirm before sending.": "Этот черновик отвечает в исходной цепочке и содержит цитату. Пишите над цитатой, затем проверьте и подтвердите отправку.",
                "Unsaved edits": "Несохранённые изменения",
                "Send time: ": "Время отправки: ",
                "Cancel schedule and return to draft": "Отменить планирование и вернуться к черновику",
                "Sending account": "Аккаунт отправки",
                "Choose an account": "Выберите аккаунт",
                "Schedule (optional, this device’s timezone)": "Запланировать (необязательно, часовой пояс устройства)",
                "Scheduled send time": "Время запланированной отправки",
                "Keep DSH running. Missed times while closed are not sent on restart; uncertain submissions are never retried automatically.": "DSH должен быть запущен. Пропущенные за время остановки сроки не отправляются после перезапуска; при неясном результате автоматических повторов нет.",
                "Body format": "Формат текста",
                "Plain text": "Обычный текст",
                "Formatted HTML": "Форматированный HTML",
                "Preview and send safe formatting. Plain text is generated when omitted. Scripts and external images are removed.": "Просмотрите и отправьте безопасное форматирование. Если обычный текст не указан, он создаётся. Скрипты и внешние изображения удаляются.",
                "Remove attachment ": "Удалить вложение ",
                "Remove": "Удалить",
                "Add attachments (save edits first; up to 10 files / ": "Добавить вложения (сначала сохраните; до 10 файлов / ",
                " total)": " всего)",
                "Add attachments": "Добавить вложения",
                "Attachment exceeds ": "Вложение превышает ",
                "Attachments added. Review before sending.": "Вложения добавлены. Проверьте перед отправкой.",
                "Some addresses were rejected. This email will not retry automatically. Server accepted: ": "Часть адресов отклонена. Письмо не будет отправлено повторно автоматически. Сервер принял: ",
                "Server receipt saved. This draft will not send again. Server accepted: ": "Отметка сервера сохранена. Этот черновик больше не отправится. Сервер принял: ",
                "none": "нет",
                "Server rejected: ": "Сервер отклонил: ",
                "This confirms the server response, not delivery to the recipient inbox.": "Это подтверждает ответ сервера, а не доставку в ящик получателя.",
                "No receipt yet. Check your mailbox, then refresh the list. Do not send again.": "Отметки пока нет. Проверьте ящик и обновите список. Не отправляйте снова.",
                "Copy to a new draft": "Скопировать в новый черновик",
                "Delete local draft": "Удалить локальный черновик",
                "Copies content and attachments to a new unsent draft. Check the mailbox first if the original was submitted or its result is uncertain.": "Копирует содержимое и вложения в новый неотправленный черновик. Если исходное письмо отправлено или результат неясен, сначала проверьте ящик.",
                "Confirm copy": "Подтвердить копирование",
                "Deletes this local draft and plugin-uploaded copies. Original files and mailbox messages stay intact.": "Удаляет этот локальный черновик и копии, загруженные плагином. Исходные файлы и письма в ящике остаются.",
                "Confirm delete": "Подтвердить удаление",
                "Select a draft or create one to start editing.": "Выберите черновик или создайте новый, чтобы начать.",
                "Rules saved for this account.": "Правила для этого аккаунта сохранены.",
                "Trusted recipients": "Доверенные получатели",
                "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.": "По умолчанию требуется подтверждение. Если включено, email_send пропускает подтверждение плагина только когда все адреса To/Cc соответствуют правилам аккаунта. Разрешения хоста продолжают действовать, а черновики по-прежнему требуют ручного подтверждения. Правила домена не включают поддомены.",
                "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.": "Заблокированные получатели важнее доверенных правил, даже при отключённом подтверждении. Блокировки действуют и для черновиков, ответов и пересылок. Домены блокируются по точному совпадению, без поддоменов.",
                "Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.": "Пропуск подтверждения для доверенных ответов по умолчанию выключен и включается в настройках подключения. Проверяются все фактические To/Cc в ответах, ответах всем и пересылках; любой несовпадающий получатель требует подтверждения. Если Full Access не может показать запрос, используйте «Черновики».",
                "Global send approval is off; blocked-recipient rules still apply.": "Глобальное подтверждение отправки отключено; правила блокировки получателей действуют.",
                "Account for these rules": "Аккаунт для этих правил",
                "Choose a configured account": "Выберите настроенный аккаунт",
                "Rules have unsaved edits.": "В правилах есть несохранённые изменения.",
                "Trusted email addresses (one per line)": "Доверенные адреса (по одному в строке)",
                "Trusted domains (one per line, all mailboxes in that domain)": "Доверенные домены (по одному в строке, все ящики домена)",
                "Blocked email addresses (one per line)": "Заблокированные адреса (по одному в строке)",
                "Blocked domains (one per line)": "Заблокированные домены (по одному в строке)",
                "Skip plugin approval for email_send when all addresses match": "Пропускать подтверждение плагина для email_send, если все адреса совпадают",
                "Save rules for this account": "Сохранить правила для этого аккаунта",
                "Reload rules": "Перезагрузить правила",
                "Unsaved; matching uses the rules you are editing.": "Не сохранено; проверка использует редактируемые правила.",
                "Only saved rules affect model-initiated sends.": "На отправку по инициативе модели влияют только сохранённые правила.",
                "Try recipients To": "Проверить получателей To",
                "Try copy Cc": "Проверить копию Cc",
                "A recipient is blocked; sending is refused.": "Один из получателей заблокирован; отправка отклонена.",
                "All To/Cc match; plugin approval can be skipped.": "Все To/Cc совпадают; подтверждение плагина можно пропустить.",
                "Plugin approval will remain.": "Подтверждение плагина останется.",
                "Match: ": "Совпадение: ",
                "Task operation failed": "Не удалось выполнить действие с задачей",
                "Loading mail tasks…": "Загрузка почтовых задач…",
                "Each line: alias = absolute path to an existing folder": "Каждая строка: псевдоним = абсолютный путь к существующей папке",
                "Duplicate workspace alias": "Псевдоним рабочей области повторяется",
                "Saved. The first check establishes a baseline; only later mail can trigger tasks.": "Сохранено. Первая проверка только задаёт точку отсчёта; задачи запускает лишь последующая почта.",
                "Starting": "Запуск",
                "Running": "Выполняется",
                "Waiting for your input in DSH": "Ожидает вашего подтверждения в DSH",
                "Completed": "Завершена",
                "Needs attention": "Требует внимания",
                "Submitting reply": "Отправка ответа",
                "Replied": "Ответ отправлен",
                "Mail outcome uncertain; check sent mail": "Результат отправки неизвестен; проверьте отправленные",
                "Turn email into a DSH task": "Превратить письмо в задачу DSH",
                "Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.": "Отправьте задачу из разрешённого ящика в одобренную рабочую область и продолжайте ту же сессию по почте. По умолчанию выключено. Задачи используют вашу модель и могут расходовать квоту; разрешения DSH по-прежнему требуют вашего подтверждения.",
                "Native task services are unavailable; update DSH to use this feature.": "Встроенные сервисы задач недоступны; обновите DSH, чтобы использовать эту функцию.",
                "Task subject prefix": "Префикс темы задачи",
                "Allowed senders (one per line; empty means the mailbox itself)": "Разрешённые отправители (по одному в строке; пусто — сам ящик)",
                "Workspace aliases (each line: alias = absolute folder path)": "Псевдонимы рабочих областей (в строке: псевдоним = абсолютный путь к папке)",
                "work = /home/me/projects/my-project": "work = /home/me/projects/my-project",
                "Tasks can use only saved aliases. Existing sessions must belong to that workspace.": "Задачи используют только сохранённые псевдонимы. Существующие сессии должны относиться к этой рабочей области.",
                "New key shown once; the old key is invalid. Save your configuration before enabling.": "Новый ключ показывается один раз; старый уже недействителен. Сохраните настройки перед включением.",
                "Rotate task key (pauses tasks)": "Сменить ключ задач (приостанавливает задачи)",
                "Generate task key": "Создать ключ задач",
                "Copy this email template and keep the key private": "Скопируйте этот шаблон письма и храните ключ в тайне",
                "Write your task here": "Напишите здесь задачу",
                "Hide key": "Скрыть ключ",
                "Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.": "Тема: dsh:псевдоним или dsh:псевдоним:sessionId. Начните текст строкой DSH-Key: ваш-ключ-задачи, затем напишите задачу. Ключ разрешает отправителям из белого списка запускать задачи в одобренной рабочей области; храните его в тайне.",
                "Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)": "Автоматически отправлять итог авторизованному отправителю (без Cc; действуют блокировки получателей)",
                "Poll interval (seconds)": "Интервал проверки (секунды)",
                "Advanced matching and extraction": "Расширенное сопоставление и извлечение",
                "Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.": "Правила выполняются после проверки отправителя и ключа. Доступны all / any, поля subject / body / from / to / cc, операторы contains / equals / regex. Именованные группы подставляются как ${name} в workspace, session и prompt; ${body} — текст без ключа и цитируемой переписки. Результат рабочей области должен совпадать с разрешённым псевдонимом.",
                "Rules (JSON array)": "Правила (массив JSON)",
                "Check finished; see task records below.": "Проверка завершена; записи задач ниже.",
                "Clear finished task records": "Очистить записи завершённых задач",
                "Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.": "DSH должен быть запущен. Незавершённые задачи не повторяются после перезапуска. Подтверждения, тайм-ауты и ручную передачу обрабатывайте в исходной сессии.",
                "Session ID": "ID сессии",
                "Open DSH session": "Открыть сессию DSH",
                "No tasks yet. The first check establishes a baseline.": "Задач пока нет. Первая проверка только задаёт точку отсчёта.",
                "Retry save": "Повторить сохранение",
                "Show new-mail popups": "Показывать уведомления о новых письмах",
                "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.": "Отключение скрывает уведомление и останавливает автоматические проверки. Проверять почту в беседе по-прежнему можно. При повторном включении отсчёт начнётся заново.",
                "Reply quote language": "Язык цитаты в ответах",
                "Follow interface; English if unknown": "Как в интерфейсе; английский, если неизвестно",
                "Allow trusted replies without confirmation (off by default)": "Разрешать доверенные ответы без подтверждения (по умолчанию выключено)",
                "When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.": "Если включено, все фактические To/Cc в ответе, ответе всем или пересылке должны соответствовать доверенным правилам аккаунта. Правила блокировки и разрешения хоста продолжают действовать.",
                "Quote date timezone (optional)": "Часовой пояс даты цитаты (необязательно)",
                "These accounts are managed in the configuration file: ": "Эти аккаунты управляются в файле конфигурации: ",
                "You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.": "Здесь можно сохранить общие настройки. Аккаунты и учётные данные сохраняются; добавляйте и изменяйте аккаунты в карте accounts конфигурации.",
                " messages\n": " писем\n",
                "Manage custom IMAP folders. Purge requires preview and confirmation, affects reviewed messages only, and requires UIDPLUS (up to 2000 messages). Only empty folders can be deleted. Permanent deletion cannot be undone.": "Управление пользовательскими папками IMAP. Очистка требует предпросмотра и подтверждения, затрагивает только проверенные письма и требует UIDPLUS (до 2000 писем). Удалять можно только пустые папки. Окончательное удаление необратимо.",
                "New folder": "Новая папка",
                "e.g. Tenders": "напр. Тендеры",
                "Create": "Создать",
                "Save": "Сохранить",
                "(System folder)": "(Системная папка)",
                "Rename": "Переименовать",
                "Empty permanently deletes every message in this folder. Continue?": "Очистка окончательно удалит все письма в этой папке. Продолжить?",
                "Empty": "Очистить",
                "Delete removes the folder and all its messages forever. Continue?": "Удаление безвозвратно удалит папку и все её письма. Продолжить?",
                "Move to Trash": "В корзину",
                "Move the selected messages to the existing folder below. This does not permanently delete them.": "Перемещает выбранные письма в существующую папку ниже. Окончательного удаления не происходит.",
                "Destination folder": "Папка назначения",
                "Detect Trash automatically": "Определять корзину автоматически",
                "Checking messages and folders…": "Проверка писем и папок…",
                "Move to: ": "Переместить в: ",
                "Confirmation expires in 90 seconds and must be renewed if the mailbox changes. A 5-minute Undo is offered when the server returns destination UIDs.": "Подтверждение действует 90 секунд и требует обновления при изменении ящика. Отмена доступна 5 минут, если сервер вернул UID назначения.",
                "Moving…": "Перемещение…",
                "Confirm move: ": "Подтвердить перемещение: ",
                "Email image": "Изображение из письма",
                "Failed to load; retry available": "Не удалось загрузить; можно повторить",
                "External image blocked": "Внешнее изображение заблокировано",
                "Loading…": "Загрузка…",
                "View formatted message": "Показать форматированное письмо",
                "View plain text": "Показать обычный текст",
                "External images allowed for this message": "Внешние изображения разрешены для этого письма",
                "Load external images (": "Загрузить внешние изображения (",
                "Retry images": "Повторить загрузку изображений",
                "External images are blocked by default. Loading may reveal your reading time and network address to the sender. Consent applies only to this message.": "Внешние изображения по умолчанию блокируются. Их загрузка может раскрыть отправителю время прочтения и сетевой адрес. Согласие действует только для этого письма.",
                "Body or formatting exceeds the display limit. Some content was omitted; try plain text or your mail client.": "Текст или форматирование превышают лимит отображения. Часть содержимого опущена; попробуйте обычный текст или почтовый клиент.",
                "Message details": "Сведения о письме",
                "Mark unread": "Отметить как непрочитанное",
                "Mark read": "Отметить как прочитанное",
                "Unstar": "Снять отметку",
                "Star": "Пометить",
                "Edit the reply in Drafts. Review and confirm before sending.": "Отредактируйте ответ в «Черновиках». Проверьте и подтвердите перед отправкой.",
                "AI mail workflow & quick prompts": "ИИ-процесс почты и быстрые запросы",
                "Linked to open message": "Связано с открытым письмом",
                "Expand for 1-click chat prompts": "Разверните для копирования запросов в чат",
                "1. Connect → 2. Filter mail → 3. Copy prompt → 4. Review & send": "1. Подключить → 2. Отфильтровать → 3. Скопировать запрос → 4. Проверить и отправить",
                "Summarize unread & tasks": "Сводка непрочитанных и задач",
                "Summarize important unread mail and list replies needed (do not send).": "Сделай сводку важных непрочитанных писем и список нужных ответов (без отправки).",
                "Draft a polite reply": "Составить вежливый черновик",
                "Draft a polite reply to the selected email in Drafts without sending.": "Составь вежливый ответ на выбранное письмо в «Черновиках» без отправки.",
                "Check the latest email needing a reply and save a polite draft only.": "Проверь последнее письмо, требующее ответа, и сохрани только вежливый черновик.",
                "Extract key points & asks": "Выделить суть и вопросы",
                "Extract the core requests, deadlines, and open questions from this mail.": "Выдели ключевые просьбы, сроки и открытые вопросы из этого письма.",
                "Summarize key requests and deadlines from recent mail in this folder.": "Сделай сводку ключевых просьб и сроков по недавним письмам в этой папке.",
                "Selected mail: ": "Выбранное письмо: ",
                "Prompt copied — paste in Chat": "Запрос скопирован — вставьте в чат",
                "Copy failed — check clipboard": "Не удалось скопировать — проверьте буфер обмена",
            },
        };
        function inlineLocaleKeys() {
            const keys = new Set();
            for (const table of [INLINE_LOCALE_OVERRIDES, INLINE_LOCALE_COMPLETION])
                for (const language of Object.keys(table))
                    for (const english of Object.keys(table[language])) keys.add(english);
            return [...keys];
        }
        function emailLocaleDictionaries() {
            const dictionaries = {};
            const inlineKeys = inlineLocaleKeys();
            for (const language of ["zh", "en", "es", "fr", "de", "ja", "pt", "ru"]) {
                const table = language === "zh" ? UI.zh : UI[language] || UI.en;
                dictionaries[language] = Object.assign({}, table);
                // English carries an identity mapping for every phrase: it is the end of
                // the host's fallback chain, so a missing key here would surface as the
                // raw "inline:…" identifier instead of readable copy.
                const inline = language === "zh" ? null
                    : Object.assign({}, INLINE_LOCALE_OVERRIDES[language], INLINE_LOCALE_COMPLETION[language]);
                if (language === "en") for (const english of inlineKeys) dictionaries[language]["inline:" + english] = english;
                else if (inline) for (const [english, translated] of Object.entries(inline)) dictionaries[language]["inline:" + english] = translated;
            }
            return dictionaries;
        }
        const EMAIL_LOCALE_NAMESPACE = "dsh-email";
        const EMAIL_LOCALE_IDS = ["zh", "en", "es", "fr", "de", "ja", "pt", "ru"];
        const EMAIL_LOCALE_LABELS = {
            zh: "中文", en: "English", es: "Español", fr: "Français", de: "Deutsch",
            ja: "日本語", pt: "Português (Brasil)", ru: "Русский",
        };
        /**
         * uiLocalePreference controls interface copy. UI_LANG tracks a valid host locale
         * and keeps the legacy Chinese fallback when no active host language is available.
         */
        var UI_LANG = "zh";
        var uiLocalePreference = "auto";
        var activeLocaleService = null;
        var localeTranslate = null;
        const uiLocaleListeners = new Set();
        function normalizeUiLocale(value) {
            return value === "zh" || value === "en" || value === "auto" ? value : "auto";
        }
        function hostUiLanguage() {
            try {
                const active = activeLocaleService?.getSnapshot?.().active;
                if (active !== undefined && active !== null && String(active).trim() !== "") {
                    UI_LANG = localeToLang(active);
                    return UI_LANG;
                }
            }
            catch { /* older hosts may not expose a complete locale snapshot */ }
            UI_LANG = "zh";
            return UI_LANG;
        }
        function uiLanguage() {
            const preference = normalizeUiLocale(uiLocalePreference);
            return preference === "auto" ? hostUiLanguage() : preference;
        }
        function applyUiLocale(value) {
            const next = normalizeUiLocale(value);
            if (next === uiLocalePreference) return false;
            uiLocalePreference = next;
            for (const listener of [...uiLocaleListeners]) {
                try { listener(); }
                catch { /* one redraw failure cannot block other subscribers */ }
            }
            if (typeof relocalize === "function") {
                try { relocalize(); }
                catch { /* popup redraw failures do not affect settings */ }
            }
            return true;
        }
        function subscribeUiLocale(listener) {
            uiLocaleListeners.add(listener);
            return () => uiLocaleListeners.delete(listener);
        }
        function inlineText(zh, en) {
            const language = uiLanguage();
            if (language === "zh") return zh;
            if (language === "en") return en;
            const key = "inline:" + en;
            if (typeof localeTranslate === "function") {
                const localized = localeTranslate(key);
                if (localized !== key) return localized;
            }
            const table = Object.assign({}, INLINE_LOCALE_OVERRIDES[language], INLINE_LOCALE_COMPLETION[language]);
            return table && Object.prototype.hasOwnProperty.call(table, en) ? table[en] : en;
        }
        /**
         * Resolve the host language against the available UI dictionaries.
         * Unknown locales use English; hosts without a locale service keep the zh initial value.
         */
        function localeToLang(active) {
            const tag = String(active === undefined || active === null ? "" : active).toLowerCase();
            for (const language of ["zh", "en", "es", "fr", "de", "ja", "pt", "ru"])
                if (tag.indexOf(language) === 0)
                    return language;
            return "en";
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
                    if (viaGet !== undefined && viaGet !== null)
                        return viaGet;
                }
            }
            catch (e) { /* use the direct service when available */ }
            const direct = ctx.locale;
            return direct === undefined || direct === null ? null : direct;
        }
        function registerEmailLocale(service) {
            if (!service || typeof service.register !== "function" || typeof service.addLanguage !== "function") return () => { };
            const disposers = [];
            const snapshot = service.getSnapshot?.();
            const hasCatalog = Array.isArray(snapshot?.locales);
            if (!hasCatalog) return () => { };
            const available = new Set((snapshot.locales || []).map(locale => String(locale.id).toLowerCase()));
            if (typeof service.addLanguage === "function" && hasCatalog) {
                for (const language of EMAIL_LOCALE_IDS) {
                    if (language === "zh" || language === "en" || available.has(language)) continue;
                    try {
                        const dispose = service.addLanguage({ id: language, label: EMAIL_LOCALE_LABELS[language], fallback: "en" });
                        if (typeof dispose === "function") disposers.push(dispose);
                        available.add(language);
                    }
                    catch { /* an unavailable optional locale falls back to English */ }
                }
            }
            const dictionaries = emailLocaleDictionaries();
            for (const language of EMAIL_LOCALE_IDS) {
                if (hasCatalog && !available.has(language)) continue;
                try {
                    const dispose = service.register(EMAIL_LOCALE_NAMESPACE, language, dictionaries[language]);
                    if (typeof dispose === "function") disposers.push(dispose);
                }
                catch (error) {
                    // Baseline registrations must work on the supported DSH client API.
                    if (language === "zh" || language === "en") throw error;
                }
            }
            try { localeTranslate = service.bind?.(EMAIL_LOCALE_NAMESPACE) || null; }
            catch { localeTranslate = null; }
            return () => {
                localeTranslate = null;
                for (const dispose of disposers.reverse()) {
                    try { dispose(); }
                    catch { /* one stale locale registration must not block cleanup */ }
                }
            };
        }
        /** Subscribe to DSH's locale runtime and redraw the imperative popup on language changes. */
        function subscribeLocale(ctx) {
            const service = localeServiceOf(ctx);
            activeLocaleService = service;
            const disposeDictionaries = registerEmailLocale(service);
            const apply = () => {
                hostUiLanguage();
                if (typeof relocalize === "function") {
                    try { relocalize(); }
                    catch { /* popup redraw failures must not break locale subscribers */ }
                }
            };
            apply();
            let unsubscribe = () => { };
            try {
                if (typeof service?.subscribe === "function") {
                    const off = service.subscribe(apply);
                    if (typeof off === "function") unsubscribe = off;
                }
            }
            catch { /* service is optional on older hosts */ }
            return () => { unsubscribe(); disposeDictionaries(); activeLocaleService = null; };
        }
        /** 取一条界面文案。{name} 占位符按字面替换（不是正则、也不做 HTML 转义 ——
         * 这些文案全部进 DOM 文本节点或 textContent，从不拼成 HTML）。
         *
         * 回退只有一级：**语言表里没有 key、或整张语言表不存在，都返回 key 本身**。
         * 刻意不退回 zh —— 两张表理应逐键相同，真漏一条就露一条 'card.add'，漏译在界面
         * 上现形；静默退回中文会让「英文界面里混着中文」这种半成品看起来像做完了。
         */
        function t(key, params) {
            const language = uiLanguage();
            const table = UI[language] || UI.en;
            let raw = table && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : UI.en && Object.prototype.hasOwnProperty.call(UI.en, key) ? UI.en[key] : key;
            if (typeof localeTranslate === "function" && language !== "zh" && language !== "en") {
                const localized = localeTranslate(key);
                if (localized !== key) raw = localized;
            }
            if (typeof raw !== "string" || params === undefined || params === null)
                return raw;
            return raw.replace(/\{(\w+)\}/g, (whole, name) => Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : whole);
        }
        function formatDate(value) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return value;
            const locales = { zh: 'zh-CN', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ja: 'ja-JP', pt: 'pt-BR', ru: 'ru-RU' };
            return new Intl.DateTimeFormat(locales[uiLanguage()] || 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
        }
        const dt = inlineText;
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
                proxy: "", proxyMode: "inherit", hasProxy: false, proxyDirty: false,
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
            if (draft === null || draft === undefined)
                return false;
            if (draft.authKind === "oauth2")
                return true;
            if (draft.authKind === "password")
                return false;
            return authKindOf(draft.provider) === "oauth2";
        }
        /**
         * 服务端卡片（永不含密码明文）-> 草稿。user 为空表示「就留空」，不是未加载。
         * 卡片的 imap/smtp 是后端计算的生效端点，只用于显示，不写回 YAML。
         * 它们可能包含用户明确指定的服务器，不能用服务商默认值代替。
         * authKind/oauthState/oauthUser 是卡片的登录态投影，只用于显示与本地判定，
         * 不进 draftToInput（它们不是 YAML 的字段，后端认的是账号自己的 oauth 段）。
         */
        /**
         * 卡片对应的服务商取值：真实服务商名 / 自定义服务器哨兵 / 空（还没选）。
         * 没有 provider 但快照已经带着显式端点的卡片，是 YAML 里手写的自定义服务器
         * 账号，也可能是刚存下的自定义账号 —— 下拉要选中「自定义服务器」，
         * 端点才会以可编辑的输入框出现。
         */
        function providerOfCard(card) {
            const named = card.provider === undefined || card.provider === null ? "" : String(card.provider);
            if (named !== "")
                return named;
            const hasEndpoint = card.receiveProtocol === "pop3"
                ? String(card.pop3?.host || "").trim() !== ""
                : String(card.imap?.host || "").trim() !== "" || String(card.smtp?.host || "").trim() !== "";
            return hasEndpoint ? CUSTOM_SERVER_PROVIDER : "";
        }
        /**
         * 自定义服务器账号的端点齐了吗：POP3 只看 pop3.host，IMAP 只看 imap.host ——
         * 发信主机可以留空，draftToInput 会用收信主机补齐（与卡片标签「留空沿用收信
         * 服务器」一致）。
         */
        function customEndpointsPresent(draft) {
            if (draft.receiveProtocol === 'pop3')
                return String(draft.pop3?.host || "").trim() !== "";
            return String(draft.imap?.host || "").trim() !== "";
        }
        function draftFromCard(card) {
            return {
                proxy: "", proxyMode: card.proxyMode || "inherit", hasProxy: card.hasProxy === true, proxyDirty: false,
                name: String(card.name || ""),
                originalName: String(card.name || ""),
                imap: card.imap,
                receiveProtocol: card.receiveProtocol === 'pop3' ? 'pop3' : 'imap',
                pop3: card.pop3 || { host: '', port: 995, secure: true },
                smtp: card.smtp,
                provider: providerOfCard(card),
                user: card.user === undefined || card.user === null ? "" : String(card.user),
                password: "",
                // 登录密码与 password 同一套三态契约：卡片永远拿不到明文，只有"是否已存"。
                authPassword: "",
                hasAuthPassword: card.hasAuthPassword === true,
                senderName: card.senderName === undefined || card.senderName === null ? "" : String(card.senderName),
                authUser: card.authUser === undefined || card.authUser === null ? "" : String(card.authUser),
                clientId: card.clientId === undefined || card.clientId === null ? "" : String(card.clientId),
                clientSecret: "", hasClientSecret: card.hasClientSecret === true,
                oauthProvider: card.oauthProvider || (card.provider === 'gmail' ? 'google' : 'microsoft'),
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
                if (name === "" || Object.prototype.hasOwnProperty.call(map, name))
                    continue;
                map[name] = draftFromCard(card);
            }
            return map;
        }
        /**
         * 下拉的选项集合：内置服务商 + AgentMail + serverPresets 里的自定义名 +
         * 永远存在的「自定义服务器」。自定义预设项的显示文案取预设自己的 label
         * （预设编辑器里那个「显示名」），没写 label 才退回预设名。
         */
        function providerOptions(presets) {
            const out = PROVIDERS.map(([value, labelKey]) => ({ value, label: t(labelKey) }));
            out.push({ value: "agentmail", label: "AgentMail (US API)" }, { value: "agentmail-eu", label: "AgentMail (EU API)" });
            // 内网/自建服务器没有预设名可用：选中它以后端点在卡片里直接填，
            // 账号的 imap/smtp 段就是端点的存放处。
            out.push({ value: CUSTOM_SERVER_PROVIDER, label: t("provider.customServer") });
            const custom = (presets && presets.custom) || {};
            for (const name of Object.keys(custom)) {
                if (name === "" || name === CUSTOM_SERVER_PROVIDER)
                    continue;
                if (out.some((option) => option.value === name))
                    continue;
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
            if (out.some((option) => option.value === value))
                return out;
            const placeholder = { value, label: value === "" ? t("provider.noneInYaml") : value + t("provider.undefinedPresetSuffix") };
            return value === "" ? [placeholder].concat(out) : out.concat([placeholder]);
        }
        /**
         * 选服务商：大部分服务商只把 provider 键写进草稿 —— 端点不展开，账号在 YAML 里
         * 只记 provider id，host/port/secure 由后端在解析时从预设表展开，前端抄一份只会是
         * 一份会过期的副本（预设改了它不会跟着变，保存时还会把它写回 YAML）。
         * 预设名合不合法由后端裁定：它才是预设表的持有者。
         *
         * 「自定义服务器」是例外：它没有预设可展开，端点就存在账号自己的 imap/smtp 段
         * 里。所以选中它时把端点草稿清成空白、端口填默认值（993/465），交给用户填。
         *
         * 换服务商 = 换一套凭证：旧服务商的密码留着毫无意义（后端也不会拿它去连新主机），
         * 而 oauth2 的服务商本来就不要密码。所以这里顺手清掉 password 和登录态投影，
         * 免得「qq 的授权码」被当成 outlook 的密码交上去。
         */
        function applyPreset(draft, provider) {
            const next = provider === undefined || provider === null ? "" : String(provider);
            const custom = next === CUSTOM_SERVER_PROVIDER;
            return Object.assign({}, draft, {
                provider: next,
                receiveProtocol: custom || next.startsWith('agentmail')
                    ? (custom && draft.receiveProtocol === 'pop3' ? 'pop3' : 'imap')
                    : draft.receiveProtocol,
                imap: custom ? { host: "", port: 993, secure: true } : undefined,
                pop3: custom ? { host: "", port: 995, secure: true } : undefined,
                smtp: custom ? { host: "", port: 465, secure: true } : undefined,
                password: "",
                authKind: undefined,
                authKindSetting: '',
                oauthProvider: next === 'gmail' ? 'google' : 'microsoft',
                clientId: '', clientSecret: '', hasClientSecret: false,
                oauthState: "none",
                oauthUser: "",
            });
        }
        /**
         * 草稿 -> serializeAccounts 的输入。密码三态在这里定型：'' 或 untouched 都不带
         * password 键（继承已存密码），只有用户真的打了字才写进去。服务商账号的端点一概
         * 不带：账号只存 provider id，后端 resolveAccount() 在连接时从预设表展开。
         * 「自定义服务器」账号是唯一的例外：它没有预设，端点必须随卡片写进账号的
         * imap/smtp 段，否则后端没有任何地方能把它展开出来。
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
            const endpoint = value => ({host:String(value?.host || '').trim(),...(String(value?.port ?? '') !== '' ? {port:Number(value.port)} : {}),secure:value?.secure !== false});
            if (draft.receiveProtocol !== undefined) input.receiveProtocol = draft.receiveProtocol;
            if (draft.receiveProtocol === 'pop3') {
                input.pop3 = endpoint(draft.pop3);
                // Send an explicit blank host when the user clears the SMTP endpoint.
                if (draft.smtp) input.smtp = endpoint(draft.smtp);
            } else if (String(draft.provider || '') === CUSTOM_SERVER_PROVIDER) {
                // 自定义服务器：端点直接写进账号的 imap/smtp 段（后端 resolveAccount 的
                // 「省略 provider 直接填 imap.host 与 smtp.host」路径）。端口留空时把
                // 默认值显式写下去（IMAP 993 / SMTP 465），避免「文档说 993、YAML 里
                // 却没有 port、连接层只能靠隐式默认」的歧义。
                const endpointWithDefault = (value, defaultPort) => ({
                    host: String(value?.host || '').trim(),
                    port: String(value?.port ?? '') !== '' ? Number(value.port) : defaultPort,
                    secure: value?.secure !== false,
                });
                const imap = endpointWithDefault(draft.imap, 993);
                const smtp = endpointWithDefault(draft.smtp, 465);
                // 发信服务器主机留空时沿用收信服务器：内网/自建邮箱通常同一台机器，
                // 用户只需要填一次地址。
                if (smtp.host === '') smtp.host = imap.host;
                input.imap = imap;
                input.smtp = smtp;
            }
            if (draft.provider && draft.provider !== CUSTOM_SERVER_PROVIDER)
                input.provider = draft.provider;
            if (!isOauthDraft(draft) && draft.password)
                input.password = draft.password;
            // 显示名/登录名是普通三态字段（留空 = 清掉该键），密码与 password 同规：只有真打了字才写。
            if (draft.senderName !== undefined)
                input.senderName = String(draft.senderName || "").trim();
            if (!isOauthDraft(draft) && draft.authUser !== undefined)
                input.authUser = String(draft.authUser || "").trim();
            if (!isOauthDraft(draft) && draft.authPassword)
                input.authPassword = draft.authPassword;
            if (draft.proxyDirty) {
                if (draft.proxyMode === 'custom' && !draft.proxy.trim() && !draft.hasProxy) throw new Error(dt('请填写自定义代理地址。', 'Enter the custom proxy URL.'));
                if (draft.proxyMode !== 'custom' || draft.proxy.trim()) input.proxy = draft.proxyMode === 'direct' ? 'direct' : draft.proxyMode === 'custom' ? draft.proxy.trim() : '';
            }
            // Only an OAuth2 card models the application id; for any other account the
            // field stays undefined, which the backend reads as「没说」and leaves the
            // stored key alone. An empty string here is the user clearing it on purpose.
            if (isOauthDraft(draft))
                input.clientId = String(draft.clientId || "").trim();
            if (isOauthDraft(draft)) input.oauthProvider = draft.provider === 'gmail' ? 'google' : draft.oauthProvider || 'microsoft';
            if (isOauthDraft(draft) && draft.clientSecret !== undefined && (draft.clientSecret || draft.clientSecretDirty)) input.clientSecret = draft.clientSecret;
            // '' is a real value here, not an omission: it takes the pin off and returns
            // the account to the derivation. Only a draft that models the selector speaks.
            if (draft.authKindSetting !== undefined)
                input.authKind = String(draft.authKindSetting || "");
            return input;
        }
        /**
         * 半填账号：名字、邮箱地址、服务商三者缺一都算。服务商是账号的连接身份：
         * 没有服务商又没有完整的自定义服务器端点时，就没有端点可展开。
         * 「自定义服务器」账号没有预设可查，端点本身就在卡片里，按端点是否填齐判断。
         * OAuth2 账号不要密码：有 (name, provider, user) 就算填完了。
         */
        function accountIncomplete(draft) {
            if (String(draft.name || "").trim() === "" || String(draft.user || "").trim() === "")
                return true;
            const provider = String(draft.provider || "").trim();
            if (provider === CUSTOM_SERVER_PROVIDER)
                return !customEndpointsPresent(draft);
            return provider === "" && !customEndpointsPresent(draft);
        }
        /** 改过名字后草稿要跟着键走：旧键删掉，整份草稿（含 imap/smtp）搬到新键下。 */
        function renameDrafts(drafts, oldName, nextName) {
            if (nextName !== oldName && Object.prototype.hasOwnProperty.call(drafts, nextName)) {
                throw new Error(t("card.errDuplicateName"));
            }
            const next = {};
            for (const key of Object.keys(drafts)) {
                if (key === oldName)
                    continue;
                next[key] = drafts[key];
            }
            const entry = drafts[oldName];
            if (entry !== undefined)
                next[nextName] = Object.assign({}, entry, { name: nextName });
            return next;
        }
        /**
         * 卡片徽标：内置服务商用中文名，自定义预设用它自己的 label（没 label 用预设名），
         * 未知/未指定一律「自定义」。徽标只负责显示，provider 的键始终是预设名。
         * 「自定义」判据用 hasOwnProperty 而不是端点是否到位：刚存下的预设名会先一步进
         * presets.custom（值还是 undefined，端点要等下一次快照），它已经是合法预设了。
         */
        function accountSummary(draft, presets) {
            if (draft.provider === "agentmail" || draft.provider === "agentmail-eu")
                return { label: draft.provider === "agentmail-eu" ? "AgentMail EU" : "AgentMail US", isCustom: false };
            const provider = draft.provider || "";
            const entry = PROVIDERS.filter(([value]) => value === provider)[0];
            if (entry)
                return { label: t(entry[1]), isCustom: false };
            const custom = (presets && presets.custom) || {};
            if (provider !== "" && Object.prototype.hasOwnProperty.call(custom, provider)) {
                return { label: presetLabelOf(provider, custom[provider]), isCustom: true };
            }
            return { label: t("provider.custom"), isCustom: true };
        }
        /** 预设端点写成 host:port；主机没填就说没填，端口缺省不装成合法值。 */
        function presetEndpointText(endpoint) {
            const host = endpoint && typeof endpoint.host === "string" ? endpoint.host.trim() : "";
            if (host === "")
                return t("preset.endpointMissing");
            return host + ":" + portLabel(endpoint.port);
        }
        /**
         * 卡片显示后端的生效服务器，含手动覆盖；换服务商的未保存草稿才查预设。
         * 保存后的新快照优先，避免自定义预设更新后继续显示旧地址。
         */
        function providerMetaText(draft, presets, cards) {
            if (draft.provider === "agentmail" || draft.provider === "agentmail-eu")
                return draft.provider === "agentmail-eu" ? "AgentMail · api.agentmail.eu" : "AgentMail · api.agentmail.to";
            const provider = String(draft.provider || "").trim();
            const saved = (cards || []).find(card => card.name === draft.name)
                || (cards || []).find(card => card.name === draft.originalName);
            const actual = saved && String(saved.provider || "").trim() === provider ? saved : draft;
            const endpoints = fallback => ({
                imap: actual.imap && actual.imap.host ? actual.imap : fallback && fallback.imap,
                smtp: actual.smtp && actual.smtp.host ? actual.smtp : fallback && fallback.smtp,
            });
            const describe = (name, fallback) => {
                const target = endpoints(fallback);
                return name + t("card.builtinEndpoints", { imap: presetEndpointText(target.imap), smtp: presetEndpointText(target.smtp) });
            };
            if (provider === CUSTOM_SERVER_PROVIDER) {
                // POP3 自定义账号的端点存在 pop3/smtp 段，meta 行要按它自己的协议说。
                if (draft.receiveProtocol === 'pop3') {
                    const host = actual.pop3 && typeof actual.pop3.host === "string" ? actual.pop3.host.trim() : "";
                    const endpoint = host !== "" ? "POP3 " + host + ":" + portLabel(actual.pop3.port) : t("preset.endpointMissing");
                    return t("provider.custom") + t("card.customEndpoint", { endpoint });
                }
                return actual.imap?.host || actual.smtp?.host ? describe(t("provider.custom")) : t("provider.custom");
            }
            if (provider === "")
                return actual.imap?.host || actual.smtp?.host ? describe(t("provider.custom")) : t("card.noProvider");
            const entry = PROVIDERS.filter(([value]) => value === provider)[0];
            if (entry) {
                const builtin = (presets && presets.builtin && presets.builtin[provider]) || undefined;
                return describe(t(entry[1]), builtin);
            }
            const custom = (presets && presets.custom) || {};
            if (!Object.prototype.hasOwnProperty.call(custom, provider))
                return provider + t("provider.undefinedPresetSuffix");
            const preset = custom[provider] || undefined;
            return describe(presetLabelOf(provider, preset), preset);
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
            for (const name of Object.keys(custom || {}))
                map[name] = draftFromPreset(name, custom[name]);
            return map;
        }
        /** 端口前端拦：空 = 用默认（序列化不写这个键）；否则必须是 1-65535 的整数。 */
        function portTextProblem(value) {
            const text = String(value === undefined || value === null ? "" : value).trim();
            if (text === "")
                return "";
            if (!/^[0-9]+$/.test(text))
                return t("preset.portNumeric");
            const n = Number(text);
            if (n < 1 || n > 65535)
                return t("preset.portRange");
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
            if (text !== "" && plain.test(text) && !reserved.test(text))
                return text;
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
                if (draft === undefined)
                    continue;
                const name = String(draft.name === undefined || draft.name === null ? "" : draft.name).trim();
                if (name === "")
                    return { error: t("preset.errNoName") };
                if (Object.prototype.hasOwnProperty.call(seen, name)) {
                    return { error: t("preset.errDuplicate", { name }) };
                }
                // 哨兵值是服务商下拉里「自定义服务器」的选中值，预设不能用它当名字，
                // 否则两个下拉项会撞成同一个 value。
                if (name === CUSTOM_SERVER_PROVIDER) {
                    return { error: t("preset.errReservedName", { name: t("provider.customServer") }) };
                }
                seen[name] = true;
                const label = String(draft.label === undefined || draft.label === null ? "" : draft.label).trim();
                const imapHost = String(draft.imap.host || "").trim();
                const smtpHost = String(draft.smtp.host || "").trim();
                if (imapHost === "")
                    return { error: t("preset.errNoImapHost", { name }) };
                if (smtpHost === "")
                    return { error: t("preset.errNoSmtpHost", { name }) };
                const imapProblem = portTextProblem(draft.imap.port);
                if (imapProblem !== "")
                    return { error: t("preset.errImapPort", { name, problem: imapProblem }) };
                const smtpProblem = portTextProblem(draft.smtp.port);
                if (smtpProblem !== "")
                    return { error: t("preset.errSmtpPort", { name, problem: smtpProblem }) };
                const imapPort = String(draft.imap.port).trim();
                const smtpPort = String(draft.smtp.port).trim();
                lines.push(yamlScalar(name) + ":");
                if (label !== "")
                    lines.push("  label: " + yamlScalar(label));
                lines.push("  imap:");
                lines.push("    host: " + yamlScalar(imapHost));
                if (imapPort !== "")
                    lines.push("    port: " + portScalar(imapPort));
                lines.push("    secure: " + (draft.imap.secure === true ? "true" : "false"));
                lines.push("  smtp:");
                lines.push("    host: " + yamlScalar(smtpHost));
                if (smtpPort !== "")
                    lines.push("    port: " + portScalar(smtpPort));
                lines.push("    secure: " + (draft.smtp.secure === true ? "true" : "false"));
            }
            if (lines.length === 0)
                return { text: "" };
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
                if (match && names.indexOf(match[1]) < 0)
                    names.push(match[1]);
            }
            return names;
        }
        /**
         * 快照 presets + 父级刚解析出的名字：名字先到、端点随后（保存成功后由快照补齐）。
         * 只有快照的 custom 里没有的名字才补一个空位 —— 端点永远以快照为准。
         */
        function presetsWithNames(presets, names) {
            const base = presets || { builtin: {}, custom: {} };
            if (!names || names.length === 0)
                return base;
            const custom = Object.assign({}, base.custom || {});
            for (const name of names) {
                if (!Object.prototype.hasOwnProperty.call(custom, name))
                    custom[name] = undefined;
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
            if (session && session.state === "pending")
                return "pending";
            if (session && session.state === "error")
                return "error";
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
            const sameProvider = live !== null && providerOfCard(live) === String(draft.provider || "");
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
                hasAuthPassword: live !== null && live.hasAuthPassword === true,
                defaultClientId: sameProvider && typeof live.oauthDefaultClientId === "string"
                    ? live.oauthDefaultClientId : String(draft.defaultClientId || ""),
            };
        }
        /**
         * 轮询间隔（秒）。后端给的 interval 就是权威值，**0 也是合法值**（表示不用等，
         * 每 0.5 秒问一次）—— 只有缺失、非数字、或负数才退回兜底 5 秒。
         */
        function oauthIntervalSeconds(session) {
            const raw = session ? session.interval : undefined;
            if (typeof raw === "number")
                return isFinite(raw) && raw >= 0 ? raw : OAUTH_POLL_FALLBACK_MS / 1000;
            if (typeof raw === "string" && raw.trim() !== "") {
                const n = Number(raw);
                if (isFinite(n) && n >= 0)
                    return n;
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
            const google = draft.provider === 'gmail' || draft.oauthProvider === 'google';
            // 「用哪个应用登录」是账号自己的配置项，面板是用户唯一的常规入口。它不是机密
            // （公共客户端 ID 每次都随请求发出），因此可以直接回填、直接编辑。留空不是
            // 「没配置」：插件自带一份社区注册，所以这里必须说清生效的到底是哪个应用 ——
            // 同意屏上写的名字不是账号主人自己的，这件事不该等点了登录才发现。
            const builtInClientId = String(view.defaultClientId ?? draft.defaultClientId ?? "").trim();
            const clientIdField = () => h("div", { className: "dshe-field dshe-oauth-client" }, [
                h("label", null, t("oauth.clientIdLabel")),
                h("input", {
                    type: "text",
                    value: String(draft.clientId || ""),
                    disabled: disabled,
                    spellcheck: "false",
                    placeholder: google ? '…apps.googleusercontent.com' : builtInClientId !== "" ? builtInClientId : t("oauth.clientIdPlaceholder"),
                    onChange: (e) => { if (props.onClientId)
                        props.onClientId(e.target.value); },
                }),
                h("div", { className: "dshe-hint" }, google ? dt('在 Google Cloud 创建「桌面应用」OAuth 客户端，启用 Gmail 邮件授权并将自己的账号加入测试用户。登录会在浏览器完成，再自动回到本机；无需提供邮箱密码。','Create a Desktop app OAuth client in Google Cloud, enable Gmail mail consent and add your account as a test user. Complete sign-in in your browser; no mailbox password is needed.') : t("oauth.clientIdHint")),
                google ? h('label', null, dt('Google 客户端密钥（如注册信息提供）','Google client secret (if issued)')) : null,
                google ? h('input',{type:'password',autoComplete:'new-password',value:draft.clientSecret || '',placeholder:draft.hasClientSecret ? dt('已保存；留空保持','Saved; leave unchanged to keep') : '',disabled,onChange:e=>props.onClientSecret?.(e.target.value)}) : null,
                String(draft.clientId || "").trim() === "" && builtInClientId !== ""
                    ? h("div", { className: "dshe-hint dshe-oauth-builtin" }, t("oauth.clientIdBuiltIn", { id: builtInClientId }))
                    : null,
            ]);
            if (state === "pending") {
                const url = String(session.url || "");
                const code = String(session.code || "");
                const seconds = oauthIntervalSeconds(session);
                return h("div", { className: "dshe-oauth" }, [
                    h("div", { className: "dshe-oauth-head" }, google ? dt('打开 Google 授权页，完成后此处会自动显示登录状态。','Open Google authorization; this panel updates after sign-in.') : t("oauth.pendingHint")),
                    url === ""
                        ? h("div", { className: "dshe-oauth-url" }, t("oauth.noUrl"))
                        : h("div", { className: "dshe-oauth-url" }, h("a", { href: url, target: "_blank", rel: "noreferrer" }, url)),
                    code === "" ? null : h("div", { className: "dshe-oauth-code" }, code),
                    h("div", { className: "dshe-oauth-wait" }, t("oauth.polling", {
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
                    h("div", { className: "dshe-alert error" }, emailError(session.message || t("oauth.loginFailed"))),
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
                    h("div", { className: "dshe-oauth-head dshe-oauth-ok" }, t("oauth.loggedInAs", { user: view.oauthUser || String(draft.user || "") || t("oauth.unknownUser") })),
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
                h("div", { className: "dshe-oauth-head" }, t("oauth.passwordless", { label: label ? t("oauth.passwordlessLabel", { label }) : "" })),
                clientIdField(),
                String(draft.clientId || "").trim() === "" && builtInClientId === ""
                    ? h("div", { className: "dshe-alert warn" }, google ? dt('请先填写自己的 Google Desktop app 客户端 ID。也可切换为应用密码（是否可用取决于账号策略）。','Enter your Google Desktop app client ID. App passwords remain available where your account policy permits.') : t("oauth.clientIdMissing"))
                    : null,
                h("div", { className: "dshe-oauth-actions" }, [
                    h("button", {
                        type: "button",
                        className: "dshe-btn primary",
                        disabled: disabled,
                        onClick: () => props.onStart(),
                    }, props.starting === true ? t("oauth.requestingCode") : google ? dt('使用 Google 登录','Sign in with Google') : oauthSignInLabel(draft.provider)),
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
                if (typeof props.onAutoSave !== "function")
                    return null;
                const incomplete = (text) => {
                    setNotice({ kind: "error", text });
                    if (typeof props.onDraftStatus === "function")
                        props.onDraftStatus(true);
                };
                const names = orderNow.map((row) => row.key).filter((name) => Object.prototype.hasOwnProperty.call(draftsNow, name));
                let built;
                try {
                    built = names.map((name) => draftToInput(draftsNow[name]));
                }
                catch (e) {
                    incomplete(emailError(e));
                    return null;
                }
                if (built.some((card) => String(card.name || "").trim() === "")) {
                    incomplete(t("card.errNoName"));
                    return null;
                }
                if (names.some((name) => !draftsNow[name].provider && !(draftsNow[name].imap?.host && draftsNow[name].smtp?.host))) {
                    // 服务商就是账号的连接身份：没有它，后端写回时会把 provider 键删掉，这个账号
                    // 永远连不上。名字和它都属于「这还是一张半填的卡」，一起拦在这里。
                    incomplete(t("card.errNoProvider"));
                    return null;
                }
                if (names.some((name) => String(draftsNow[name].provider || "").trim() === CUSTOM_SERVER_PROVIDER && !customEndpointsPresent(draftsNow[name]))) {
                    // 自定义服务器账号没有预设可查，端点是它唯一的连接信息；端点没填齐之前
                    // 写进 YAML 也连不上。
                    incomplete(t("card.errNoCustomHost"));
                    return null;
                }
                if (built.some((card) => card.name === "defaultAccount")) {
                    incomplete(t("card.errReservedName"));
                    return null;
                }
                if (built.length > 1 && String(defaultNow || "") === "") {
                    incomplete(t("card.errNoDefault"));
                    return null;
                }
                setNotice(null);
                if (typeof props.onDraftStatus === "function")
                    props.onDraftStatus(false);
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
                    if (entry === null)
                        delete next[name];
                    else
                        next[name] = entry;
                    return next;
                });
            };
            const cancelOauth = (name) => {
                bumpOauth(name);
                setOauthOf(name, null);
                void apiOauth('oauthCancel',{account:name}).catch(()=>{});
            };
            /**
             * 登录前先把这张卡片落盘：oauthLogin 只认账号名，后端要从已保存的配置里读这个
             * 账号的 provider 与端点。草稿没写进 YAML 就点登录的话，后端根本找不到它。
             * 等这次落盘真的结束（成功或失败），别让 oauthLogin 和后端的写盘抢。
             */
            const ensureSaved = async () => {
                const pending = autoSave(draftsRef.current, orderRef.current, defaultAccount, true);
                if (pending && typeof pending.then === "function") {
                    try {
                        await pending;
                    }
                    catch (e) { /* 保存失败由父级的状态条报，这里不重复说 */ }
                }
            };
            const startOauth = async (name) => {
                const draft = draftsRef.current[name];
                if (draft === undefined)
                    return;
                const seq = bumpOauth(name);
                setRowStatus((cur) => Object.assign({}, cur, { [name]: { kind: "busy", text: t("oauth.requestingCode") } }));
                setOauthOf(name, { state: "starting" });
                await ensureSaved();
                if (seq !== oauthCurrent(name))
                    return;
                try {
                    const body = await apiOauth("oauthLogin", { account: name, force: draft.oauthState === 'logged-in' });
                    if (seq !== oauthCurrent(name))
                        return;
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
                }
                catch (e) {
                    if (seq !== oauthCurrent(name))
                        return;
                    setRowStatus((cur) => { const next = Object.assign({}, cur); delete next[name]; return next; });
                    setOauthOf(name, { state: "error", message: emailError(e) });
                }
            };
            /** 轮询一次。pending 就等下一轮（定时器由 effect 按会话自己排），ok 就收尾。 */
            const pollOauth = async (name) => {
                const seq = oauthCurrent(name);
                let body;
                try {
                    body = await apiOauth("oauthPoll", { account: name });
                }
                catch (e) {
                    if (seq !== oauthCurrent(name))
                        return;
                    setOauthOf(name, { state: "error", message: emailError(e) });
                    return;
                }
                if (seq !== oauthCurrent(name))
                    return;
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
                if (typeof props.onReload === "function")
                    await props.onReload();
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
                if (oauthPendingSig === "")
                    return undefined;
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
                try {
                    nextDrafts = renameDrafts(draftsRef.current, oldName, nextName);
                }
                catch (error) {
                    setNotice({ kind: "error", text: error.message });
                    return;
                }
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
                if (row === undefined)
                    return;
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
                // An empty card must not fall back to credentials in the hidden legacy form.
                if (String(draftsRef.current[draftName]?.user || "").trim() === "") {
                    setRowStatus((cur) => Object.assign({}, cur, {
                        [draftName]: { kind: "error", text: t("card.testMissingAddress") },
                    }));
                    return;
                }
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
                            text: result.apiHost ? dt("API 连接成功 · ", "API connected · ") + result.apiHost : result.protocol === 'POP3' ? dt('POP3 收信连接成功 · ', 'POP3 connected · ') + result.imapHost + ':' + result.imapPort + dt('；本次未测试 SMTP 发信', '; SMTP sending was not tested') : t("card.testOk", { ms: result.ms, host: result.imapHost, port: result.imapPort }),
                        },
                    }));
                }
                catch (e) {
                    setRowStatus((cur) => Object.assign({}, cur, {
                        [draftName]: { kind: "error", text: t("card.testFailed", { message: emailError(e) }) },
                    }));
                }
                finally {
                    setBusy("");
                }
            };
            /**
             * 自定义服务器账号的端点编辑行：主机 + 端口 + TLS 放在同一个单元格里。
             * 收信主机变化时同步发信主机（它为空、或还停在旧的收信主机上时）：内网/自建
             * 邮箱通常同一台机器，用户不必把地址抄两遍，后端要求 IMAP 账号两个 host 都在。
             */
            const endpointRow = (name, draft, kind, labelKey, placeholder) => {
                const value = draft[kind] || { host: "", port: kind === "imap" ? 993 : 465, secure: true };
                return h("div", { className: "dshe-field", style: { gridColumn: "1 / -1" } }, [
                    h("label", null, t(labelKey)),
                    h("div", { className: "dshe-endpoint-row" }, [
                        h("input", {
                            type: "text",
                            "aria-label": t(labelKey),
                            value: value.host || "",
                            placeholder,
                            disabled: busy !== "",
                            onChange: (e) => {
                                const host = e.target.value;
                                if (kind !== "imap") {
                                    patchDraft(name, { smtp: Object.assign({}, value, { host }) });
                                    return;
                                }
                                const smtp = draft.smtp || { host: "", port: 465, secure: true };
                                const follows = String(smtp.host || "").trim() === "" || String(smtp.host) === String(draft.imap?.host || "");
                                patchDraft(name, follows
                                    ? { imap: Object.assign({}, value, { host }), smtp: Object.assign({}, smtp, { host }) }
                                    : { imap: Object.assign({}, value, { host }) });
                            },
                        }),
                        h("input", {
                            type: "number", min: 1, max: 65535,
                            "aria-label": t("card.portLabel"),
                            value: value.port ?? "",
                            disabled: busy !== "",
                            onChange: (e) => {
                                const raw = String(e.target.value).trim();
                                patchDraft(name, { [kind]: Object.assign({}, value, { port: raw === "" ? undefined : Number(raw) }) });
                            },
                        }),
                        h("label", { className: "dshe-check" }, [
                            h("input", {
                                type: "checkbox",
                                "aria-label": t("card.tlsLabel"),
                                checked: value.secure !== false,
                                disabled: busy !== "",
                                onChange: (e) => patchDraft(name, { [kind]: Object.assign({}, value, { secure: e.target.checked }) }),
                            }),
                            t("card.tlsLabel"),
                        ]),
                    ]),
                    kind === "imap" && h("div", { className: "dshe-hint" }, t("card.customServerHint")),
                ]);
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
                        h("span", { className: "dshe-actions", style: { marginTop: 6 } }, order.map((row) => h("button", {
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
                    if (draft === undefined)
                        return null;
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
                    return h("div", { key: id, className: "dshe-acc-card", "data-dsh-card": "" }, [
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
                        h("div", { className: "dshe-acc-meta" }, t("card.meta", {
                            address: draft.user || t("card.noAddress"),
                            folder: draft.inboxFolder || "INBOX",
                            provider: providerMetaText(draft, presets, cards),
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
                                        h("div", { className: "dshe-hint" }, draft.name === "defaultAccount"
                                            ? h("span", { className: "dshe-acc-warn" }, t("card.reservedNameWarn"))
                                            : t("card.nameHint")),
                                    ]),
                                    h("div", { className: "dshe-field" }, [
                                        h("label", null, t("card.providerLabel")),
                                        h(W.SettingsChoice, null, h("select", {
                                            "aria-label": t("card.providerLabel"),
                                            value: draft.provider || "",
                                            onChange: (e) => changeProvider(name, e.target.value),
                                        }, providerOptionsFor(presets, draft.provider).map((option) => h("option", { key: option.value, value: option.value }, option.label)))),
                                    ]),
                                    h("div", { className: "dshe-field" }, [
                                        h("label", null, t("card.addressLabel")),
                                        fieldInput("text", draft.user, (v) => patchDraft(name, { user: v }), "you@example.com"),
                                    ]),
                                    !draft.provider?.startsWith('agentmail') && h('div', {className:'dshe-field'}, [
                                        h('label', null, dt('收信协议','Incoming protocol')),
                                        h(W.SettingsChoice, null, h('select', {'aria-label':dt('收信协议','Incoming protocol'),value:draft.receiveProtocol || 'imap',disabled:busy !== '',onChange:e=>patchDraft(name,{receiveProtocol:e.target.value,inboxFolder:'INBOX',pop3:draft.pop3 || {host:'',port:995,secure:true}})},[
                                            h('option',{value:'imap'},'IMAP'),h('option',{value:'pop3',disabled:oauthCard},'POP3')])),
                                        draft.receiveProtocol === 'pop3' && h('p',{className:'dshe-hint',role:'note'},dt('POP3 只读取收件箱，发送使用 SMTP。无服务器已读、星标或已发送文件夹；搜索会说明扫描范围。','POP3 reads the inbox and uses SMTP for sending. Server read/star flags and a Sent folder are unavailable; search shows its scan coverage.')),
                                    ]),
                                    // 自定义服务器账号的端点：没有预设可展开，直接写在卡片里。
                                    draft.provider === CUSTOM_SERVER_PROVIDER && draft.receiveProtocol !== 'pop3' && h(React.Fragment, null, [
                                        endpointRow(name, draft, "imap", "card.imapServerLabel", "imap.corp.example"),
                                        endpointRow(name, draft, "smtp", "card.smtpServerLabel", "smtp.corp.example"),
                                    ]),
                                    draft.receiveProtocol === 'pop3' && h(React.Fragment,null,['pop3','smtp'].map(kind=>{
                                        const value=draft[kind] || {host:'',port:kind==='pop3'?995:465,secure:true};
                                        const patch=fields=>patchDraft(name,{[kind]:Object.assign({},value,fields)});
                                        return h('div',{key:kind,className:'dshe-field'},[
                                            h('label',null,kind==='pop3'?dt('POP3 收信服务器','POP3 incoming server'):dt('SMTP 发信服务器（可稍后填写）','SMTP outgoing server (optional for receiving)')),
                                            h('input',{type:'text','aria-label':kind==='pop3'?dt('POP3 主机','POP3 host'):dt('SMTP 主机','SMTP host'),value:value.host || '',onChange:e=>patch({host:e.target.value}),placeholder:kind==='pop3'?'pop.example.com':'smtp.example.com'}),
                                            h('input',{type:'number',min:1,max:65535,'aria-label':kind==='pop3'?dt('POP3 端口','POP3 port'):dt('SMTP 端口','SMTP port'),value:value.port ?? '',onChange:e=>patch({port:e.target.value})}),
                                            h('label',{className:'dshe-check'},h('input',{type:'checkbox','aria-label':kind==='pop3'?'POP3 TLS':'SMTP TLS',checked:value.secure !== false,onChange:e=>patch({secure:e.target.checked})}),kind.toUpperCase()+' TLS'),
                                            kind==='pop3' && value.secure===false ? h('p',{className:'dshe-hint'},dt('未开启 TLS，POP3 登录与内容将以明文传输；仅用于明确允许明文的受信任服务器。此选项不是 STARTTLS。','TLS is off: POP3 login and content use plaintext. Use only with a trusted server where plaintext is intended. This is not STARTTLS.')) : null,
                                        ]);
                                    })),
                                    !draft.provider?.startsWith("agentmail") && h("div", { className: "dshe-field" }, [
                                        h("label", null, t("card.senderNameLabel")),
                                        fieldInput("text", draft.senderName, (v) => patchDraft(name, { senderName: v }), t("card.senderNamePlaceholder")),
                                        h("div", { className: "dshe-hint" }, t("card.senderNameHint")),
                                    ]),
                                    // 认证方式只在「可能是 OAuth2」的账号上出现：给 QQ/163 用户多一个
                                    // 下拉框只是噪音。它是那条逃生舱的唯一面板入口——仍能用应用密码连
                                    // Exchange Online 的租户（混合/本地部署、SMTP AUTH 未关）靠它才不用
                                    // 去手改 YAML。
                                    (oauthCard || authKindOf(draft.provider) === "oauth2" || draft.provider === 'gmail')
                                        ? h("div", { className: "dshe-field" }, [
                                            h("label", null, t("card.authKindLabel")),
                                            h(W.SettingsChoice, null, h("select", {
                                                "aria-label": t("card.authKindLabel"),
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
                                            ])),
                                            h("div", { className: "dshe-hint" }, draft.provider==='gmail'?dt('Google OAuth 需要自己的桌面应用客户端；应用密码是否可用取决于账号策略。','Google OAuth requires your own Desktop app client; app-password availability depends on account policy.'):t("card.authKindHint")),
                                        ])
                                        : null,
                                    !draft.provider?.startsWith('agentmail') && h('div', { className: 'dshe-field' },
                                      h('label', null, dt('连接方式', 'Connection routing')),
                                      h(W.SettingsChoice, null, h('select', { value: draft.proxyMode || 'inherit', 'aria-label': dt('连接方式', 'Connection routing'), disabled: busy !== '', onChange: e => patchDraft(name, { proxyMode: e.target.value, proxyDirty: true }) },
                                        h('option', { value: 'inherit' }, dt('跟随全局或环境设置', 'Follow global or environment settings')),
                                        h('option', { value: 'direct' }, dt('直接连接（不使用代理）', 'Connect directly (ignore proxies)')),
                                        h('option', { value: 'custom' }, dt('自定义代理', 'Custom proxy')))),
                                      draft.proxyMode === 'custom' && h('input', { type: 'password', autoComplete: 'new-password', value: draft.proxy || '', 'aria-label': dt('自定义代理地址', 'Custom proxy URL'), placeholder: draft.hasProxy ? dt('已保存，留空保持不变', 'Saved; leave blank to retain') : 'http://127.0.0.1:7897', disabled: busy !== '', onChange: e => patchDraft(name, { proxy: e.target.value, proxyDirty: true }) }),
                                      h('div', { className: 'dshe-hint' }, dt('用于 IMAP 和 SMTP，支持 HTTP CONNECT / HTTPS / SOCKS。代理地址可能含密码，保存后不会回显。POP3 收信仍直接连接。', 'Applies to IMAP and SMTP. Supports HTTP CONNECT, HTTPS and SOCKS. Saved URLs may contain passwords and are not displayed. POP3 receiving still connects directly.'))),
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
                                            onClientSecret: v=>patchDraft(name,{clientSecret:v,clientSecretDirty:true}),
                                        })
                                        : h(React.Fragment, null, [
                                            h("div", { className: "dshe-field" }, [
                                                h("label", null, draft.provider?.startsWith("agentmail") ? "AgentMail API Key" : t("card.passwordLabel")),
                                                h("input", {
                                                    type: "password",
                                                    value: draft.password,
                                                    disabled: busy !== "",
                                                    placeholder: draft.provider?.startsWith("agentmail") ? dt("输入 API Key；留空保留已存密钥", "API key; leave blank to retain saved key") : t("card.passwordPlaceholder"),
                                                    onChange: (e) => patchDraft(name, { password: e.target.value }),
                                                }),
                                                h("div", { className: "dshe-hint" }, view.hasPassword
                                                    ? t("card.passwordSaved")
                                                    : draft.provider?.startsWith("agentmail") ? dt("从 AgentMail 控制台取得 API Key。API Key 保存在本机账号配置中，由 DSH 后端调用所选区域的 API。", "Use an API key from the AgentMail console. The key is stored in the local account configuration; the DSH backend calls the selected region.") : t("card.passwordHint")),
                                            ]),
                                            // 别名/中继：登录名与登录密码都只在密码类账号上有意义（OAuth2 用 token 登录）。
                                            !draft.provider?.startsWith("agentmail") && h("div", { className: "dshe-field" }, [
                                                h("label", null, t("card.authUserLabel")),
                                                fieldInput("text", draft.authUser, (v) => patchDraft(name, { authUser: v }), t("card.authUserPlaceholder")),
                                                h("div", { className: "dshe-hint" }, t("card.authUserHint")),
                                            ]),
                                            !draft.provider?.startsWith("agentmail") && h("div", { className: "dshe-field" }, [
                                                h("label", null, t("card.authPasswordLabel")),
                                                h("input", {
                                                    type: "password",
                                                    value: draft.authPassword,
                                                    disabled: busy !== "",
                                                    placeholder: draft.provider?.startsWith("agentmail") ? dt("输入 API Key；留空保留已存密钥", "API key; leave blank to retain saved key") : t("card.passwordPlaceholder"),
                                                    onChange: (e) => patchDraft(name, { authPassword: e.target.value }),
                                                }),
                                                h("div", { className: "dshe-hint" }, view.hasAuthPassword
                                                    ? t("card.authPasswordSaved")
                                                    : t("card.authPasswordHint")),
                                            ]),
                                        ]),
                                    !draft.provider?.startsWith("agentmail") && draft.receiveProtocol !== 'pop3' && h("div", { className: "dshe-field" }, [
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
                h("div", { className: "dshe-hint" }, t("card.autoSaveHint") + (defaultMissing ? t("card.autoSaveHintNoDefault") : "")),
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
                if (typeof props.onAutoSave !== "function")
                    return;
                const result = serializePresetDrafts(nextOrder.map((row) => row.key), nextDrafts);
                if (result.error !== undefined) {
                    setNotice({ kind: "error", text: result.error });
                    if (typeof props.onDraftStatus === "function")
                        props.onDraftStatus(true);
                    return;
                }
                setNotice(null);
                if (typeof props.onDraftStatus === "function")
                    props.onDraftStatus(false);
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
                    if (key === oldKey)
                        continue;
                    next[key] = draftsRef.current[key];
                }
                const entry = draftsRef.current[oldKey];
                if (entry !== undefined)
                    next[nextName] = Object.assign({}, entry, { name: nextName });
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
                if (row === undefined)
                    return;
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
                        h("div", { className: "dshe-hint", style: { marginTop: 4 } }, t("preset.yamlParseFailedHint")),
                    ])
                    : null,
                order.length === 0
                    ? h("div", { className: "dshe-prst-empty" }, rebuiltCount === 0
                        ? t("preset.empty")
                        : t("preset.cleared", { count: rebuiltCount }))
                    : null,
                order.map((row) => {
                    const id = row.id;
                    const key = row.key;
                    const draft = drafts[key];
                    if (draft === undefined)
                        return null;
                    const name = String(draft.name === undefined || draft.name === null ? "" : draft.name);
                    const trimmed = name.trim();
                    const expanded = open === id;
                    const renamed = trimmed !== key;
                    const duplicate = trimmed !== "" && order.some((other) => other.key !== key && String((drafts[other.key] || {}).name || "").trim() === trimmed);
                    const empty = trimmed === "";
                    const label = String(draft.label || "").trim();
                    return h("div", { key: id, className: "dshe-prst-card", "data-dsh-card": "" }, [
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
                        h("div", { className: "dshe-prst-meta" }, t("preset.metaImap", { host: draft.imap.host || t("preset.noHost"), port: portLabel(draft.imap.port) })
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
                                        h("div", { className: "dshe-hint" }, duplicate
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
                h("div", { className: "dshe-hint" }, t("preset.footerHint") + t("card.autoSaveHint")),
                notice ? h("div", { className: "dshe-alert " + notice.kind }, notice.text) : null,
            ]);
        }
        let rulesUiCache = null, emailActiveTab = "mailbox", emailSettingsActiveTab = "accounts";
        function RecipientRules({ active, onSaved }) {
const fieldId=React.useId();
            const [data, setData] = useState(() => rulesUiCache && rulesUiCache.data), [account, setAccount] = useState(() => rulesUiCache && rulesUiCache.account || ""), [form, setForm] = useState(() => rulesUiCache && rulesUiCache.form || { addresses: "", domains: "", denyAddresses: "", denyDomains: "", skipApproval: false });
            const [base, setBase] = useState(() => rulesUiCache && rulesUiCache.base || ""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState(""), [pending, setPending] = useState(null), [to, setTo] = useState(() => rulesUiCache && rulesUiCache.to || ""), [cc, setCc] = useState(() => rulesUiCache && rulesUiCache.cc || ""), [match, setMatch] = useState(null);
            const operation = useRef(false), dirty = data && JSON.stringify(form) !== base;
// Update protection: dsh-email.rules
__stardustUpdatesGuard(React, "dsh-email.rules", { dirty: !!dirty, busy, retainOnClose: true });

            useEffect(() => { rulesUiCache = { data, account, form, base, to, cc }; }, [data, account, form, base, to, cc]);
            const choose = (next, name) => { const rule = next.policies[name] || { addresses: [], domains: [], skipApproval: false }, fields = { addresses: rule.addresses.join("\n"), domains: rule.domains.join("\n"), denyAddresses: (rule.denyAddresses || []).join("\n"), denyDomains: (rule.denyDomains || []).join("\n"), skipApproval: rule.skipApproval }; setAccount(name); setForm(fields); setBase(JSON.stringify(fields)); setMatch(null); setPending(null); };
            const run = async (fn) => { if (operation.current)
                return; operation.current = true; setBusy(true); setError(""); try {
                await fn();
            }
            catch (e) {
                setError(e.message || String(e));
            }
            finally {
                operation.current = false;
                setBusy(false);
            } };
            const load = async () => { const next = await draftApi("rules"); setData(next); choose(next, next.accounts.includes(account) ? account : next.accounts[0] || ""); };
            useEffect(() => { if (active && !dirty)
                run(load); }, [active]);
            useEffect(() => { const guard = event => { if (dirty) {
                event.preventDefault();
                event.returnValue = "";
            } }; window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard); }, [dirty]);
            const policy = () => ({ skipApproval: form.skipApproval, ...Object.fromEntries(['addresses', 'domains', 'denyAddresses', 'denyDomains'].map(key => [key, (form[key] || '').split(/\r?\n/).map(row => row.trim()).filter(Boolean)])) });
            const save = async () => { const next = await draftApi("saveRules", { account, policy: policy(), revision: data.revision }); setData(next); choose(next, account); onSaved(next.revision); setNotice(dt("此账号规则已保存。", "Rules saved for this account.")); return next; };
            const change = patch => { setForm(current => ({ ...current, ...patch })); setMatch(null); setNotice(""); };
            const request = target => { if (dirty)
                setPending(target);
            else if (target.kind === "reload")
                run(load);
            else
                choose(data, target.name); };
            return h("section", { className: "dshe-panel dshe-rule-panel", "aria-label": dt("可信收件人规则", "Trusted recipients") }, [
                h("p", { className: "dshe-hint" }, dt("默认每次确认。主动启用后，只有该账号的全部 To/Cc 都匹配时，email_send 才跳过插件确认；宿主权限仍然生效，草稿仍需手动确认。域名规则只匹配指定域名，不包含子域名。", "Approval is the default. When enabled, email_send skips this plugin's approval only if every To/Cc address matches this account's rules. Host permissions still apply, and drafts still need manual confirmation. Domain rules exclude subdomains.")),
                h("p", { className: "dshe-hint" }, dt("禁止规则优先于可信规则，关闭发信确认也不能绕过；同样适用于草稿、回复与转发。禁止域名也仅精确匹配，不包含子域名。", "Blocked recipients take precedence over trusted rules, even with send approval off. Blocks also apply to drafts, replies and forwards. Blocked domains match exactly and exclude subdomains.")),
                h('p', { className: 'dshe-hint' }, dt('可信回复免审默认关闭，可在连接设置中单独开启。开启后会读取原邮件并核对回复、回复全部或转发的所有实际 To/Cc；任何一位不可信都仍需确认。Full Access 无法显示确认时，可在草稿页预览并手动发送。', 'Trusted reply skipping is off by default and can be enabled in Connection settings. It checks every actual To/Cc for replies, reply-all and forwards; any unmatched recipient still needs confirmation. Use Drafts for manual review if Full Access cannot show a prompt.')),
                error ? h("div", { className: "dshe-alert error", role: "alert" }, error) : null,
                notice ? h("div", { className: "dshe-alert success", role: "status" }, notice) : null,
                data && data.sendApproval === false ? h("div", { className: "dshe-alert info" }, dt("全局发信确认目前已关闭；禁止规则仍然生效。", "Global send approval is off; blocked-recipient rules still apply.")) : null,
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-account' }, dt("规则所属账号", "Account for these rules")), h(W.SettingsChoice, null, h("select", { id: fieldId + '-dshe-rule-account', "aria-label": dt("规则所属账号", "Account for these rules"), value: account, disabled: busy, onChange: event => request({ kind: "account", name: event.target.value }) }, [h("option", { value: "", disabled: true }, dt("请选择已配置账号", "Choose a configured account")), ...(data ? data.accounts : []).map(name => h("option", { key: name, value: name }, name))]))]),
                pending ? h("div", { className: "dshe-alert info" }, [dt("规则还未保存。", "Rules have unsaved edits."), h("div", { className: "dshe-actions" }, [h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => run(async () => { const next = await save(); if (pending.kind === "reload")
                                await load();
                            else
                                choose(next, pending.name); }) }, dt("保存并切换", "Save and switch")), h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => { if (pending.kind === "reload")
                                run(load);
                            else
                                choose(data, pending.name); } }, dt("放弃编辑并切换", "Discard edits and switch")), h("button", { type: "button", className: "dshe-btn", onClick: () => setPending(null) }, dt("保留编辑", "Keep editing"))])]) : null,
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-addresses' }, dt("可信邮箱地址（每行一个）", "Trusted email addresses (one per line)")), h("textarea", { id: fieldId + '-dshe-rule-addresses', rows: 4, value: form.addresses, placeholder: "name@example.com", disabled: busy || !account, onChange: event => change({ addresses: event.target.value }) })]),
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-domains' }, dt("可信域名（每行一个，匹配该域所有邮箱）", "Trusted domains (one per line, all mailboxes in that domain)")), h("textarea", { id: fieldId + '-dshe-rule-domains', rows: 3, value: form.domains, placeholder: "example.com", disabled: busy || !account, onChange: event => change({ domains: event.target.value }) })]),
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-deny-addresses' }, dt("禁止邮箱地址（每行一个）", "Blocked email addresses (one per line)")), h("textarea", { id: fieldId + '-dshe-rule-deny-addresses', rows: 3, value: form.denyAddresses || '', placeholder: "blocked@example.com", disabled: busy || !account, onChange: event => change({ denyAddresses: event.target.value }) })]),
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-deny-domains' }, dt("禁止域名（每行一个）", "Blocked domains (one per line)")), h("textarea", { id: fieldId + '-dshe-rule-deny-domains', rows: 3, value: form.denyDomains || '', placeholder: "blocked.example.com", disabled: busy || !account, onChange: event => change({ denyDomains: event.target.value }) })]),
                h("label", { className: "dshe-check" }, [h("input", { type: "checkbox", checked: form.skipApproval, disabled: busy || !account, onChange: event => change({ skipApproval: event.target.checked }) }), dt("允许全部匹配时跳过 email_send 的插件确认", "Skip plugin approval for email_send when all addresses match")]),
                h("div", { className: "dshe-actions" }, [h("button", { type: "button", className: "dshe-btn primary", disabled: busy || !dirty || !account || data && !data.writable, onClick: () => run(save) }, dt("保存此账号规则", "Save rules for this account")), h("button", { type: "button", className: "dshe-btn", disabled: busy, onClick: () => request({ kind: "reload" }) }, dt("重新加载规则", "Reload rules"))]),
                h("div", { className: "dshe-hint", role: "status" }, dirty ? dt("未保存；匹配预览使用当前编辑的规则。", "Unsaved; matching uses the rules you are editing.") : dt("已保存的规则才会作用于模型发信。", "Only saved rules affect model-initiated sends.")),
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-to' }, dt("试填收件人 To", "Try recipients To")), h("input", { id: fieldId + '-dshe-rule-to', type: "text", value: to, disabled: busy, onChange: event => { setTo(event.target.value); setMatch(null); } })]),
                h("div", { className: "dshe-field" }, [h("label", { htmlFor: fieldId + '-dshe-rule-cc' }, dt("试填抄送 Cc", "Try copy Cc")), h("input", { id: fieldId + '-dshe-rule-cc', type: "text", value: cc, disabled: busy, onChange: event => { setCc(event.target.value); setMatch(null); } })]),
                h("button", { type: "button", className: "dshe-btn", disabled: busy || !account, onClick: () => run(async () => setMatch(await draftApi("matchRules", { account, policy: policy(), to, cc }))) }, dt("检查规则匹配（不发送）", "Check matches (no email sent)")),
                match ? h("div", { className: "dshe-review", role: "status" }, [h("p", null, match.blocked ? dt("收件人被禁止，无法发送。", "A recipient is blocked; sending is refused.") : match.skipsApproval ? dt("全部 To/Cc 匹配，可跳过插件确认。", "All To/Cc match; plugin approval can be skipped.") : dt("不会跳过插件确认。", "Plugin approval will remain.")), h("ul", { className: "dshe-match-list" }, match.rows.map((row, index) => h("li", { key: index }, row.field.toUpperCase() + ": " + row.address + " · " + (row.blocked ? dt("禁止：", "Blocked: ") + row.value : row.matched ? dt("匹配：", "Match: ") + row.value : dt("未匹配", "No match")))))]) : null,
            ]);
        }
        let emailWorkspace=null;
        async function mailTaskApi(action,payload={}) {
            const response=await fetch('/api/dsh-email/tasks',{credentials:'same-origin',method:'POST',headers:{'content-type':'application/json','x-dsh-email-tasks':'1'},body:JSON.stringify({action,...payload})});
            const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.message||dt('任务操作失败','Task operation failed'));return result.value;
        }
        function MailTaskWorkbench({active,accounts=[]}) {
            const [data,setData]=useState(null),[config,setConfig]=useState(null),[aliases,setAliases]=useState(''),[rules,setRules]=useState('[]'),[senders,setSenders]=useState(''),[key,setKey]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
            const adopt=value=>{setData(value);setConfig(value.config);setAliases(Object.entries(value.config.workspaces||{}).map(([name,path])=>name+' = '+path).join('\n'));setRules(JSON.stringify(value.config.rules||[],null,2));setSenders((value.config.senders||[]).join('\n'));};
            const run=async fn=>{setBusy(true);setError('');setNotice('');try{await fn()}catch(e){setError(emailError(e))}finally{setBusy(false)}};
            useEffect(()=>{if(active)run(async()=>adopt(await mailTaskApi('list')));return()=>setKey('')},[active]);
            if(!config)return h('p',{role:'status'},error||dt('正在加载邮件任务…','Loading mail tasks…'));
            const change=patch=>setConfig(old=>({...old,...patch}));
            const field=(label,node)=>h('label',{className:'dshe-field'},h('span',null,label),node);
            const save=async()=>{const workspaces={};for(const line of aliases.split('\n').filter(x=>x.trim())){const at=line.indexOf('=');if(at<1)throw new Error(dt('每行填写：别名 = 现有文件夹绝对路径','Each line: alias = absolute path to an existing folder'));const name=line.slice(0,at).trim();if(Object.hasOwn(workspaces,name))throw new Error(dt('工作区别名重复','Duplicate workspace alias'));workspaces[name]=line.slice(at+1).trim();}adopt(await mailTaskApi('save',{revision:data.revision,config:{...config,senders:senders.split('\n').map(x=>x.trim()).filter(Boolean),workspaces,rules:JSON.parse(rules)}}));setNotice(dt('已保存。首次检查只建立起点，之后的新邮件才会触发任务。','Saved. The first check establishes a baseline; only later mail can trigger tasks.'));};
            const states={dispatching:dt('正在创建任务','Starting'),running:dt('执行中','Running'),waiting:dt('等待你在 DSH 中确认','Waiting for your input in DSH'),completed:dt('已完成','Completed'),attention:dt('需要查看','Needs attention'),replying:dt('正在提交回复','Submitting reply'),replied:dt('已回复','Replied'),uncertain:dt('发送结果不确定，请核对','Mail outcome uncertain; check sent mail')};
            return h('section',{'aria-label':dt('邮件触发任务','Mail-triggered tasks'),className:clsx('dshe-global', settingsCss.tasks)},
                h('h3',null,dt('把邮件变成 DSH 任务','Turn email into a DSH task')),
                h('p',{className:'dshe-hint'},dt('从自己的邮箱发出任务，在指定工作区执行；可回复同一会话继续。默认关闭。任务使用你的模型，可能产生用量；权限请求仍需在 DSH 中确认。','Send a task from an authorized mailbox to an approved workspace, then continue the same session by email. Off by default. Tasks use your model and may incur usage; DSH permissions still require your input.')),
                !data.available?h('p',{className:'dshe-alert warn'},dt('当前 DSH 未提供原生任务服务，请升级 DSH 后使用。','Native task services are unavailable; update DSH to use this feature.')):null,
                error||data.error?h('p',{role:'alert',className:'dshe-alert error'},error||emailError(data.error)):null,
                notice?h('p',{role:'status'},notice):null,
                field(dt('接收任务的邮箱','Receiving account'),h(W.SettingsChoice, null, h('select',{'aria-label':dt('接收任务的邮箱','Receiving account'),value:config.account,disabled:busy,onChange:e=>change({account:e.target.value})},h('option',{value:''},dt('选择邮箱','Choose an account')),accounts.map(name=>h('option',{key:name,value:name},name))))),
                field(dt('接收文件夹','Receiving folder'),h('input',{value:config.folder,disabled:busy,onChange:e=>change({folder:e.target.value})})),
                field(dt('任务主题前缀','Task subject prefix'),h('input',{value:config.prefix||'dsh',disabled:busy,maxLength:32,onChange:e=>change({prefix:e.target.value})})),
                field(dt('允许的发件人（每行一个；留空仅允许邮箱本人）','Allowed senders (one per line; empty means the mailbox itself)'),h('textarea',{rows:3,value:senders,disabled:busy,placeholder:'you@example.com',onChange:e=>setSenders(e.target.value)})),
                field(dt('工作区别名（每行：别名 = 文件夹绝对路径）','Workspace aliases (each line: alias = absolute folder path)'),h('textarea',{rows:3,value:aliases,disabled:busy,placeholder:dt('work = E:\\projects\\my-project','work = /home/me/projects/my-project'),onChange:e=>setAliases(e.target.value)})),
                h('p',{className:'dshe-hint'},dt('任务只能选择这里保存的别名。现有会话也必须属于同一工作区；不会按邮件正文中的任意路径执行。','Tasks can use only saved aliases. Existing sessions must belong to that workspace.')),
                h('button',{type:'button',className:'dshe-btn',disabled:busy,onClick:()=>run(async()=>{const value=await mailTaskApi('rotateKey',{revision:data.revision});setData(value);setConfig(old=>({...old,enabled:false}));setKey(value.key);setNotice(dt('新口令只显示这一次，旧口令已失效。请保存后再启用。','New key shown once; the old key is invalid. Save your configuration before enabling.'));})},data.hasKey?dt('轮换任务口令（会暂停任务）','Rotate task key (pauses tasks)'):dt('生成任务口令','Generate task key')),
                key?h('div',{className:'dshe-review'},field(dt('复制以下邮件模板，妥善保存口令','Copy this email template and keep the key private'),h('textarea',{readOnly:true,rows:5,value:'Subject: '+(config.prefix||'dsh')+':'+(aliases.split('\n').find(x=>x.includes('='))?.split('=')[0].trim()||'work')+'\n\nDSH-Key: '+key+'\n'+dt('请在这里填写任务','Write your task here')})),h('button',{type:'button',className:'dshe-btn',onClick:()=>setKey('')},dt('隐藏口令','Hide key'))):null,
                h('p',{className:'dshe-hint'},dt('邮件主题：dsh:别名，或 dsh:别名:会话ID。正文第一行须为 DSH-Key: 任务口令；下一行起写任务。该口令授予白名单发件人在所选工作区发起任务的能力，请勿转发。','Subject: dsh:alias or dsh:alias:sessionId. Begin the body with DSH-Key: your-task-key, then write the task. The key authorizes whitelisted senders to start tasks in your approved workspace; keep it private.')),
                h('label',{className:'dshe-check'},h('input',{type:'checkbox',checked:config.autoReply,disabled:busy,onChange:e=>change({autoReply:e.target.checked})}),dt('自动回复最终结果给授权发件人（不抄送；沿用禁止收件人规则）','Automatically email the final result to the authorized sender (no Cc; recipient blocks apply)')),
                field(dt('检查间隔（秒）','Poll interval (seconds)'),h('input',{type:'number',min:30,max:3600,value:config.pollSeconds,disabled:busy,onChange:e=>change({pollSeconds:Number(e.target.value)})})),
                h('details',null,h('summary',null,dt('高级匹配与内容提取','Advanced matching and extraction')),h('p',{className:'dshe-hint'},dt('先核对发件人和口令，再匹配规则。支持 all / any、subject / body / from / to / cc、contains / equals / regex。命名分组可在 workspace、session、prompt 中用 ${name}；${body} 为已去除口令和引用的正文。工作区模板的结果仍须匹配允许别名。','Rules run after sender and key checks. Use all / any, fields subject / body / from / to / cc, operators contains / equals / regex. Named captures work as ${name} in workspace, session and prompt; ${body} is the body with the key and quoted history removed. Workspace results must match an allowed alias.')),field(dt('匹配规则（JSON 数组）','Rules (JSON array)'),h('textarea',{rows:8,value:rules,disabled:busy,spellCheck:false,onChange:e=>setRules(e.target.value)}))),
                h('label',{className:'dshe-check'},h('input',{type:'checkbox',checked:config.enabled,disabled:busy||!data.hasKey||!data.available,onChange:e=>change({enabled:e.target.checked})}),dt('启用邮件任务','Enable mail tasks')),
                h('div',{className:'dshe-actions'},h('button',{type:'button',className:'dshe-btn primary',disabled:busy,onClick:()=>run(save)},dt('保存任务设置','Save task settings')),h('button',{type:'button',className:'dshe-btn',disabled:busy,onClick:()=>run(async()=>{const value=await mailTaskApi('check');setData(value);setNotice(dt('检查完成；请查看下方任务记录。','Check finished; see task records below.'));})},dt('立即检查','Check now')),h('button',{type:'button',className:'dshe-btn',disabled:busy,onClick:()=>run(async()=>setData(await mailTaskApi('archive',{revision:data.revision})))},dt('清理已结束的任务记录','Clear finished task records'))),
                h('p',{className:'dshe-hint'},dt('DSH 需保持运行。重启后不重复执行进行中的任务；等待审批、超时或人工接手时请到原会话处理。','Keep DSH running. In-progress tasks are not replayed after restart. Handle approvals, timeouts or manual takeover in the original session.')),
                h('h4',null,dt('任务记录','Task records')),
                data.records?.length?h('ul',{className:'dshe-match-list'},data.records.map(row=>h('li',{key:row.id},h('strong',null,states[row.state]||row.state),' · '+row.sender+' · '+row.workspace+' · '+formatDate(row.createdAt),row.message?h('p',null,emailError(row.message)):null,row.sessionId?h('div',null,field(dt('会话 ID','Session ID'),h('input',{readOnly:true,value:row.sessionId})),emailWorkspace?h('button',{type:'button',className:'dshe-btn',onClick:()=>run(async()=>emailWorkspace.openSession(row.sessionId))},dt('打开 DSH 会话','Open DSH session')):null):null))):h('p',null,dt('暂无任务；首次检查仅建立起点。','No tasks yet. The first check establishes a baseline.'))
            );
        }
        function AttachmentLimitField({ bytes, disabled, onChange }) {
            const mib = 1024 * 1024;
            const presets = [20, 25, 30, 35, 40];
            const size = (bytes ?? 20 * mib) / mib;
            const [editCustom, setEditCustom] = useState(false);
            const [invalid, setInvalid] = useState(false);
            const custom = editCustom || !presets.includes(size);
            const id = React.useId();
            const label = t("global.attachmentLimit");

            return h("div", { className: "dshe-field" },
                h("label", { htmlFor: id }, label),
                h(W.ChoiceMenu, {
                    id, label, disabled, value: custom ? "custom" : String(size),
                    items: [...presets.map(n => ({ id: String(n), label: n + " MiB" })),
                        { id: "custom", label: t("global.attachmentCustom") }],
                    onChange: next => {
                        setInvalid(false);
                        setEditCustom(next === "custom");
                        if (next !== "custom") onChange(Number(next) * mib);
                    },
                }),
                custom ? h("input", {
                    key: size, type: "number", min: 1 / 1024, max: 512, step: "any", required: true, disabled,
                    defaultValue: size, "aria-label": t("global.attachmentCustom"),
                    "aria-invalid": invalid || undefined, "aria-describedby": id + "-hint",
                    onInput: () => setInvalid(false),
                    onBlur: event => {
                        const input = event.currentTarget;
                        setInvalid(!input.validity.valid);
                        if (!input.validity.valid) return;
                        const next = Math.round(input.valueAsNumber * mib);
                        if (next !== bytes) onChange(next);
                    },
                    onKeyDown: event => {
                        if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
                    },
                }) : null,
                h("div", { id: id + "-hint", className: "dshe-hint" },
                    invalid ? h("span", { role: "alert" }, t("global.attachmentRange")) : t("global.attachmentHint")),
            );
        }
        function EmailSettingsSection({workbench=false}={}) {
            const [composeAccount, setComposeAccount] = useState("");
            const [composeRequest, setComposeRequest] = useState(null);
            const requestId = useRef(0);
            const tabId = React.useId();
            const [, redrawLocale] = useState(0);
            useEffect(() => {
                const redraw = () => redrawLocale(n => n + 1);
                const offHost = activeLocaleService?.subscribe?.(redraw);
                const offUi = subscribeUiLocale(redraw);
                return () => {
                    if (typeof offHost === 'function') offHost();
                    offUi();
                };
            }, []);
            const [tab, setTab] = useState(workbench ? emailActiveTab : emailSettingsActiveTab);
            const openMailboxDraft = draftId => setComposeRequest({ id: ++requestId.current, draftId });
            const finishCompose = useCallback(() => setComposeRequest(null), []);
            useEffect(() => { if(workbench) emailActiveTab=tab;else emailSettingsActiveTab=tab; }, [tab]);
            useEffect(() => {
                openEmailInbox = () => setTab("mailbox");
                return () => { if (openEmailInbox) openEmailInbox = null; };
            }, []);
            const [draft, setDraft] = useState(null);
            useEffect(() => {
                if (draft === null)
                    return undefined;
                updateWhalePreference?.(draft.newMailPopup !== false);
                return () => updateWhalePreference?.(null);
            }, [draft?.newMailPopup]);
            const [snapshot, setSnapshot] = useState(undefined);
            const [busy, setBusy] = useState(false);
            const [error, setError] = useState("");
            /** 自动保存的可见状态：null 视同「已保存」（刚加载完、什么都没改）。 */
            const [saveState, setSaveState] = useState(null);
            const [incompleteDrafts, setIncompleteDrafts] = useState({ accounts: false, presets: false });
            const hasIncompleteDraft = incompleteDrafts.accounts || incompleteDrafts.presets;
// Update protection: dsh-email.settings
__stardustUpdatesGuard(React, "dsh-email.settings", { dirty: !!hasIncompleteDraft || !!saveState && saveState.kind !== "saved", busy: saveState?.kind === "saving" });

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
                setBusy(true);
                setError("");
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
                    applyUiLocale(value.uiLocale);
                    setDraft(next);
                    // 新快照 = 新的 accountsYaml 基线：卡片产物作废，签名对齐，免得回存一次。
                    savedYamlRef.current = next.accountsYaml || "";
                    accountsYamlRef.current = next.accountsYaml || "";
                    savedSignatureRef.current = signatureOf(next, next.accountsYaml || "");
                    setSaveState(null);
                    setIncompleteDrafts({ accounts: false, presets: false });
                    setCardsNotice(null);
                    setCustomNames(presetNamesOf(next.serverPresets));
                    setCardsDetail(snap.accountsDetail);
                    setPresetsAtLoad(snap.presets);
                }
                catch (e) {
                    setError(emailError(e));
                }
                finally {
                    setBusy(false);
                }
            }, []);
            useEffect(() => { load(); }, [load]);
            const update = (patch) => {
                if (Object.prototype.hasOwnProperty.call(patch, 'uiLocale')) applyUiLocale(patch.uiLocale);
                setDraft((cur) => Object.assign({}, cur, patch));
            };
            /**
             * 防抖排期。immediate = 明确动作（确认删除 / 登录前落盘），立刻落盘、不等那 800ms。
             * immediate 时把落盘的 promise 交出去，调用方要等「真的写完了」可以先 await 它；
             * 防抖那条路交不出 promise（定时器还没到点），返回 null。
             */
            const scheduleSave = (immediate) => {
                setSaveState({ kind: "busy" });
                // 用户又改了：还在飞的那次保存结果就作废，别拿旧结果盖住新状态。
                seqRef.current += 1;
                if (saveTimerRef.current)
                    clearTimeout(saveTimerRef.current);
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
                if (cur === null)
                    return;
                if (snapshotRef.current && snapshotRef.current.writable === false)
                    return;
                const seq = ++seqRef.current;
                const value = settingsValueOf(cur, accountsYamlRef.current === null ? (cur.accountsYaml || "") : accountsYamlRef.current);
                pendingSignatureRef.current = signatureOf(cur, value.accountsYaml);
                setSaveState({ kind: "busy" });
                try {
                    const rev = snapshotRef.current && snapshotRef.current.settings ? snapshotRef.current.settings.revision : 0;
                    let snap;
                    try {
                        snap = await api("save", { value, expectedRevision: rev });
                    }
                    catch (e) {
                        // Another writer moved the revision. Re-read it — and only it: the
                        // snapshot's draft fields are somebody else's truth, while the keystrokes
                        // in `value` are the user's. Retrying with the stale revision, which is
                        // what a bare retry button does, would conflict forever.
                        if (!e || e.code !== "settings-conflict")
                            throw e;
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
                }
                catch (e) {
                    if (seq !== seqRef.current)
                        return;
                    // 失败时清掉「正在飞」的签名，否则同一个值再也不会被重排（点重试即可再存）。
                    pendingSignatureRef.current = null;
                    setSaveState({ kind: "error", text: emailError(e) });
                }
            };
            // 唯一的自动保存触发点：draft 变了就排一次防抖（不含 revision，不会自激）。
            useEffect(() => {
                if (draft === null)
                    return undefined;
                if (snapshotRef.current && snapshotRef.current.writable === false)
                    return undefined;
                const text = accountsYamlRef.current === null ? (draft.accountsYaml || "") : accountsYamlRef.current;
                const signature = signatureOf(draft, text);
                // 已落盘、或正在飞的就是这份值 → 不重复提交。
                if (signature === savedSignatureRef.current)
                    return undefined;
                if (signature === pendingSignatureRef.current)
                    return undefined;
                scheduleSave(false);
                return undefined;
                // eslint-disable-next-line
            }, [draft]);
            useEffect(() => () => {
                if (saveTimerRef.current)
                    clearTimeout(saveTimerRef.current);
            }, []);
            // 有没落盘的内容（保存中或保存失败）才拦离开：这正是「编辑即保存」剩下的窗口。
            useEffect(() => {
                const guard = (e) => {
                    if (!hasIncompleteDraft && (saveState === null || saveState.kind === "saved"))
                        return undefined;
                    e.preventDefault();
                    e.returnValue = "";
                    return "";
                };
                window.addEventListener("beforeunload", guard);
                return () => window.removeEventListener("beforeunload", guard);
            }, [saveState, hasIncompleteDraft]);
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
                setSaveState({ kind: "busy" });
                try {
                    const result = await serializeCards(cards, defaultAccount);
                    if (seq !== cardsSeqRef.current)
                        return { ok: false, reason: "superseded" }; // 更晚的一次已经在路上，别用旧结果盖新状态
                    const text = result && typeof result.accountsYaml === "string" ? result.accountsYaml : "";
                    accountsYamlRef.current = text;
                    update({ accountsYaml: text });
                    setCardsNotice(result.commentsDropped || result.passwordsDropped
                        ? {
                            kind: "info",
                            text: (result.commentsDropped ? t("notice.commentsDropped") : "")
                                + (result.passwordsDropped ? t("notice.passwordsDropped") : "")
                                + t("notice.restSaved"),
                        }
                        : null);
                    // immediate 时 scheduleSave 把落盘的 promise 交出来，等它才算「写完了」。
                    const flushed = scheduleSave(immediate === true);
                    if (flushed && typeof flushed.then === "function")
                        await flushed;
                    return { ok: true };
                }
                catch (e) {
                    if (seq !== cardsSeqRef.current)
                        return { ok: false, reason: "superseded" };
                    const message = emailError(e);
                    setCardsNotice({ kind: "error", text: t("notice.cardsNotWritten", { message }) });
                    setSaveState({ kind: "error", text: message });
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
                return __stardustUpdatesInlinePage(React,h(W.Page, { workbench, lang: uiLanguage(), title: dt('邮件','Email'), className: settingsCss.root },h(W.Status,{tone:error?'error':'info'},error || t('common.loading')),error?h(W.Button,{disabled:busy,onClick:load},dt('重试','Retry')):null),"dsh-email");
            }
            const accounts = snapshot && snapshot.accounts ? snapshot.accounts : [];
            const presetsMerged = presetsWithNames((snapshot && snapshot.presets) || undefined, customNames);
            const statusText = hasIncompleteDraft ? t("status.draft") : saveState === null
                ? t("status.saved")
                : saveState.kind === "busy"
                    ? t("status.saving")
                    : saveState.kind === "saved"
                        ? t("status.saved")
                        : t("status.saveFailed", { message: saveState.text });
            const status = h("span", {
                role: "status",
                "aria-live": "polite",
                className: "dshe-auto-status" + (hasIncompleteDraft ? " is-draft" : saveState === null ? "" : " is-" + saveState.kind),
            }, statusText);
            const defaultAccount = snapshot?.accountsDetail?.defaultAccount || (accounts.length === 1 ? accounts[0] : "");
            const tabs = [
                { id: "mailbox", label: dt("收发邮件", "Mailbox") },
                { id: "drafts", label: dt("草稿", "Drafts") },
                { id: "accounts", label: dt("邮箱账号", "Accounts") },
                { id: "rules", label: dt("收件人规则", "Recipient rules") },
                { id: "tasks", label: dt("邮件任务", "Mail tasks") },
            ];
            const panel = value => ({
                role: "tabpanel", id: tabId + "-panel-" + value, "aria-labelledby": tabId + "-tab-" + value,
                hidden: tab !== value, className: emailUi.clsx(uiCss.panel, "dsh-tab-panel"),
            });
            const mailTourSteps = [
                {
                    id: "accounts",
                    selector: "#" + tabId + "-tab-accounts",
                    side: "bottom",
                    title: dt("先连接并测试邮箱账号", "Connect & test your account"),
                    desc: dt("首次使用点击「邮箱账号」添加 IMAP/SMTP 或企业邮箱并验证连接，密码仅在本地安全存储。", "Start in Accounts to configure and test IMAP/SMTP or work mail; credentials stay safely local."),
                },
                {
                    id: "filter",
                    selector: '[data-tour="mail-filter"]',
                    fallback: "#" + tabId + "-tab-mailbox",
                    side: "bottom",
                    title: dt("搜索与快速筛选来信", "Filter & inspect mail"),
                    desc: dt("在「收发邮件」按关键词、只看未读或本页有附件快速锁定重点来信，点开即可阅读与下载附件。", "Filter by keyword, Unread only, or Attachments in Mailbox to focus on priority messages."),
                },
                {
                    id: "ai-draft",
                    selector: "#" + tabId + "-tab-drafts",
                    side: "bottom",
                    title: dt("让 AI 汇总未读或起草回复", "Summarize or draft replies with AI"),
                    desc: dt("复制下方指令发到对话，助手会自动梳理待办或把回复草稿存进「草稿」页供你核对，绝不会未经确认擅自发信。", "Copy the prompt below into chat — AI summarizes mail or saves reply drafts in Drafts without sending automatically."),
                    prompt: dt("汇总未读重要邮件并列出待回复事项，先不要发送任何邮件。", "Summarize important unread mail and list replies needed (do not send)."),
                    promptLabel: dt("复制：汇总未读与待办", "Copy: Summarize unread"),
                },
                {
                    id: "compose",
                    selector: '[data-tour="mail-compose"]',
                    fallback: "#" + tabId + "-tab-rules",
                    side: "bottom",
                    title: dt("人工核对发送与发信规则", "Review before sending & recipient rules"),
                    desc: dt("点「写邮件」或在「草稿」确认收件人与附件后手动发送；还可在「收件人规则」配置白名单与确认策略。", "Compose or send from Drafts after checking recipients, and configure allowlists in Recipient rules."),
                },
            ];
            return __stardustUpdatesInlinePage(React,h(W.Page, { workbench, lang: uiLanguage(), title: dt("邮件", "Email"), className: settingsCss.root, showUpdates: tab === "accounts",
                tourSteps: mailTourSteps,
                onTourCopyPrompt: writeClipboardText,
                navigation: h(W.Tabs, { id: tabId, label: dt("邮件功能", "Email features"), value: tab, onChange: setTab, items: tabs }),
                actions: [
                    h(W.Button, { key: "courier", variant: "outline", icon: "star", "data-whale-trigger": "true",
                        onClick: () => { void toggleWhaleWidget?.(); } }, t("whale.summon")),
                    h(W.Button, { key: "compose", variant: "primary", icon: "edit", disabled: !!composeRequest, "data-tour": "mail-compose",
                        onClick: () => setComposeRequest({ id: ++requestId.current, account: accounts.includes(composeAccount) ? composeAccount : defaultAccount }) }, dt("写邮件", "Compose")),
                ],
            },
                h("div", panel("mailbox"), h(MailboxWorkbench, { active: tab === "mailbox", onConfigure: () => setTab("accounts"), onDraft: openMailboxDraft, onAccountChange: setComposeAccount })),
                h("div", panel("drafts"), h(DraftWorkbench, { active: tab === "drafts", defaultAccount, composeRequest, onComposeFinished: finishCompose })),
                h("div", panel("rules"), h("div", { className: settingsCss.content }, h(RecipientRules, { active: tab === "rules", onSaved: revision => { setSnapshot(old => ({ ...old, settings: { ...old.settings, revision } })); } }))),
                h("div", panel("tasks"), h("div", { className: settingsCss.content }, h(MailTaskWorkbench, { active: tab === "tasks", accounts }))),
                h("div", panel("accounts"), h("div", { className: settingsCss.content },
                    saveState !== null || hasIncompleteDraft ? h("div", { className: settingsCss.accountStatus }, status,
                        !hasIncompleteDraft && saveState?.kind === "error" ? h(W.Button, { onClick: () => flushSave() }, dt("重试保存", "Retry save")) : null) : null,
                    h("section", { className: "dshe-panel" },
                    // 全局设置：发信确认和下载目录对所有账号一视同仁，不属于任何一张卡片，
                    // 所以摆在卡片列表上方，而不是塞进某一张卡里。
                    h("div", { className: "dshe-global" }, [
                        h("label", { className: "dshe-check" }, [
                            h("input", {
                                type: "checkbox",
                                checked: draft.newMailPopup !== false,
                                disabled: snapshot?.writable === false,
                                onChange: (e) => update({ newMailPopup: e.target.checked }),
                            }),
                            dt("显示新邮件弹窗", "Show new-mail popups"),
                        ]),
                        h("div", { className: "dshe-hint" }, dt("关闭后立即隐藏弹窗并停止自动检查，不影响对话中手动查看邮件。重新开启时从当前邮件开始提醒。", "Turning this off hides the popup and stops automatic mail checks. You can still check mail in a conversation. Turning it back on starts with a fresh baseline.")),
                        h("label", { className: "dshe-check" }, [
                            h("input", {
                                type: "checkbox",
                                checked: draft.sendApproval === true,
                                disabled: snapshot?.writable === false,
                                "aria-describedby": draft.sendApproval === false ? "dshe-send-approval-risk" : undefined,
                                onChange: (e) => update({ sendApproval: e.target.checked }),
                            }),
                            t("global.sendApproval"),
                        ]),
                        draft.sendApproval === false
                            ? h("div", { id: "dshe-send-approval-risk", className: "dshe-alert info", role: "status" }, t("global.sendApprovalRisk"))
                            : null,
                        h('label',{className:'dshe-field'},dt('界面语言','Interface language'),h(W.SettingsChoice, null, h('select',{'aria-label':dt('界面语言','Interface language'),value:draft.uiLocale||'auto',disabled:snapshot?.writable===false,onChange:e=>update({uiLocale:e.target.value})},h('option',{value:'auto'},dt('跟随 DSH 语言（无可用语言时用中文）','Follow DSH language (Chinese if unavailable)')),h('option',{value:'zh'},'中文'),h('option',{value:'en'},'English')))),
                        h('label',{className:'dshe-field'},dt('回复引用语言','Reply quote language'),h(W.SettingsChoice, null, h('select',{'aria-label':dt('回复引用语言','Reply quote language'),value:draft.replyLocale||'auto',disabled:snapshot?.writable===false,onChange:e=>update({replyLocale:e.target.value})},h('option',{value:'auto'},dt('跟随 DSH 语言（无可用语言时用中文）','Follow DSH language (Chinese if unavailable)')),h('option',{value:'zh'},'中文'),h('option',{value:'en'},'English'),h('option',{value:'fr'},'Français')))),
                        h('label',{className:'dshe-check'},h('input',{type:'checkbox',checked:draft.allowTrustedReply===true,disabled:snapshot?.writable===false,onChange:e=>update({allowTrustedReply:e.target.checked})}),dt('允许可信回复免审（默认关闭）','Allow trusted replies without confirmation (off by default)')),
                        h('p',{className:'dshe-hint'},dt('开启后，仅当回复、回复全部或转发的所有实际 To/Cc 都匹配该账号可信规则时免审；禁止规则和宿主权限继续生效。','When enabled, every actual To/Cc in a reply, reply-all or forward must match that account’s trusted rules. Block rules and host permissions still apply.')),
                        h('label',{className:'dshe-field'},dt('引用日期时区（可选）','Quote date timezone (optional)'),h('input',{value:draft.replyTimeZone||'',placeholder:'Asia/Shanghai · Europe/Paris',disabled:snapshot?.writable===false,onChange:e=>update({replyTimeZone:e.target.value})})),
                        h("div", { className: "dshe-field" }, [
                            h("label", null, t("global.downloadDirLabel")),
                            fieldInput("text", draft.downloadDir, (v) => update({ downloadDir: v }), t("global.downloadDirPlaceholder")),
                        ]),
                        h(AttachmentLimitField, {
                            bytes: draft.maxAttachmentBytes,
                            disabled: snapshot?.writable === false,
                            onChange: maxAttachmentBytes => update({ maxAttachmentBytes }),
                        }),
                        h("div", { className: "dshe-hint" }, t("global.hint")),
                    ]),
                    snapshot?.configurationManagedAccounts?.length ? h('div', { className: 'dshe-alert info', role: 'status' },
                        h('p', null, dt('以下账号由配置文件管理：', 'These accounts are managed in the configuration file: '), snapshot.configurationManagedAccounts.join('、')),
                        h('p', null, dt('可以在这里保存通用设置。账号及其授权码保持原样；如需新增或编辑账号，请修改配置文件中的 accounts。', 'You can save general settings here. Accounts and credentials are preserved; add or edit accounts in the configuration accounts map.')))
                    : h(AccountCardsEditor, {
                        detail: cardsDetail,
                        presets: presetsMerged,
                        extraNotice: cardsNotice,
                        onAutoSave: onCardsAutoSave,
                        onDraftStatus: (blocked) => setIncompleteDrafts((current) => ({ ...current, accounts: blocked })),
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
                            onDraftStatus: (blocked) => setIncompleteDrafts((current) => ({ ...current, presets: blocked })),
                        }),
                    ]),
                    snapshot && snapshot.writable === false
                        ? h("div", { className: "dshe-alert info" }, t("section.readonly"))
                        : null,
                    ),
                    error ? h(W.Status, { tone: "error" }, error) : null,
                    accounts.length > 0 ? h("div", { className: "dshe-hint" }, t("section.activeAccounts", { accounts: accounts.join(t("common.listSeparator")) })) : null))),"dsh-email");
        }
        // Whale-girl courier popup: polls the same-origin watch route every 30s.
        // The first poll seeds the baseline silently; later polls pop a card only
        // when newCount > 0. The artwork URL/credit come from the settings snapshot
        // (skin artwork is served from the user's local dsh-deep-whale install with
        // its CC BY-NC-SA attribution chain; otherwise a built-in fallback is used).
        let updateWhalePreference = null;
        let toggleWhaleWidget = null;
        let openEmailInbox = null;
        function startWhaleWidget() {
            if (document.querySelector("#dsh-email-whale-root"))
                return () => { };
            const root = document.createElement("div");
            root.id = "dsh-email-whale-root";
            root.className = settingsCss.whaleRoot;
            root.setAttribute("data-whale", "root");
            root.setAttribute("aria-live", "polite");
            document.body.appendChild(root);
            let pollTimer = 0;
            let hideTimer = 0;
            let patTimer = 0;
            let moodTimer = 0;
            const particleTimers = new Set();
            let whaleUrl = "";
            let whaleCredit = "";
            let whaleSkin = false;
            let enabled = true;
            let localPreference = null;
            let disposed = false;
            let running = false;
            let generation = 0;
            let seedBaseline = true;
            let watchAbort = null;
            let patCount = 0;
            let patIndex = 0;
            let activeMood = "deliver";
            let lastBubbleText = "";
            /** 当前弹窗的数据。语言切了就靠它原样重画一遍，无需再拉一次接口。 */
            let current = null;
            const clearInteractiveTimers = () => {
                if (patTimer) {
                    clearTimeout(patTimer);
                    patTimer = 0;
                }
                if (moodTimer) {
                    clearTimeout(moodTimer);
                    moodTimer = 0;
                }
                particleTimers.forEach((id) => clearTimeout(id));
                particleTimers.clear();
            };
            const closePopup = () => {
                if (hideTimer) {
                    clearTimeout(hideTimer);
                    hideTimer = 0;
                }
                clearInteractiveTimers();
                root.replaceChildren();
                current = null;
                activeMood = "deliver";
            };
            const moodSrc = (mood) => {
                if (!whaleUrl || whaleSkin || mood === "deliver")
                    return whaleUrl;
                return whaleUrl + (whaleUrl.includes("?") ? "&" : "?") + "mood=" + mood;
            };
            const jumpToMailbox = () => {
                openEmailInbox?.();
                if (typeof emailWorkspace?.openPlugin === "function")
                    emailWorkspace.openPlugin("dsh-email.workbench");
                else if (typeof emailWorkspace?.openWorkbench === "function")
                    emailWorkspace.openWorkbench("dsh-email.workbench");
            };
            const showPopup = (value, opts = {}) => {
                const keepBubble = opts.preserveInteraction ? lastBubbleText : "";
                const keepMood = opts.preserveInteraction ? activeMood : "deliver";
                closePopup();
                if (disposed || (!enabled && !opts.force))
                    return;
                current = value;
                activeMood = keepMood;
                lastBubbleText = keepBubble;
                if (whaleUrl && !whaleSkin && typeof Image === "function") {
                    ["happy", "check"].forEach((m) => {
                        const pre = new Image();
                        pre.src = moodSrc(m);
                    });
                }
                const card = document.createElement("div");
                card.className = settingsCss.whaleCard;
                card.setAttribute("data-whale", "card");
                card.setAttribute("data-whale-skin", String(whaleSkin));
                card.setAttribute("data-whale-mood", activeMood);
                card.setAttribute("data-dsh-style", W.readStyle());
                card.setAttribute("data-dsh-font", W.readFont());
                card.setAttribute("data-dsh-portal-synced", "true");
                card.setAttribute("data-window-drag-exclude", "");
                card.setAttribute("role", "region");
                card.setAttribute("aria-labelledby", "dsh-email-whale-title");

                let imgEl = null;
                if (whaleUrl) {
                    const img = document.createElement("img");
                    img.className = settingsCss.whaleImg;
                    img.setAttribute("data-whale", "image");
                    img.setAttribute("data-whale-skin", String(whaleSkin));
                    if (!whaleSkin) {
                        img.setAttribute("width", "800");
                        img.setAttribute("height", "597");
                    }
                    img.src = moodSrc(activeMood);
                    img.alt = t("whale.imageAlt");
                    img.setAttribute("role", "button");
                    img.setAttribute("tabindex", "0");
                    img.onerror = () => { img.remove(); };
                    imgEl = img;
                    card.appendChild(img);
                }

                const body = document.createElement("div");
                body.className = settingsCss.whaleBody;
                body.setAttribute("data-whale", "body");
                const title = document.createElement("div");
                title.id = "dsh-email-whale-title";
                title.className = settingsCss.whaleTitle;
                title.setAttribute("data-whale", "title");
                title.textContent = value.newCount > 0
                    ? t("whale.title", { count: value.newCount })
                    : t("whale.summonedTitle");
                body.appendChild(title);
                (value.messages || []).slice(0, 3).forEach((m) => {
                    const row = document.createElement("div");
                    row.className = settingsCss.whaleItem;
                    row.setAttribute("data-whale", "item");
                    row.setAttribute("data-whale-clickable", "true");
                    const who = (m.from || []).map((a) => a.name || a.address).filter(Boolean).join(", ") || t("whale.unknownSender");
                    row.textContent = t("whale.row", { who, subject: m.subject || t("whale.noSubject") });
                    row.onclick = () => jumpToMailbox();
                    body.appendChild(row);
                });
                if (value.newCount > 3) {
                    const more = document.createElement("div");
                    more.className = settingsCss.whaleItem;
                    more.setAttribute("data-whale", "more");
                    more.textContent = t("whale.more", { count: value.newCount - 3 });
                    body.appendChild(more);
                }
                if (whaleCredit) {
                    const credit = document.createElement("div");
                    credit.className = settingsCss.whaleCredit;
                    credit.setAttribute("data-whale", "credit");
                    credit.textContent = whaleCredit;
                    body.appendChild(credit);
                }
                card.appendChild(body);

                const closeBtn = document.createElement("button");
                closeBtn.type = "button";
                closeBtn.className = settingsCss.whaleClose;
                closeBtn.setAttribute("data-whale", "close");
                closeBtn.textContent = "\u2715";
                closeBtn.setAttribute("aria-label", t("whale.close"));
                closeBtn.onclick = closePopup;
                card.appendChild(closeBtn);

                const bubble = document.createElement("div");
                bubble.className = settingsCss.whaleBubble;
                bubble.setAttribute("data-whale", "bubble");
                bubble.setAttribute("role", "status");
                const initialBubble = lastBubbleText || (value.manual ? t("whale.idleSubtitle") : "");
                if (initialBubble) {
                    bubble.textContent = initialBubble;
                } else {
                    bubble.setAttribute("hidden", "");
                }
                card.appendChild(bubble);

                const patBadge = document.createElement("div");
                patBadge.className = settingsCss.whalePatBadge;
                patBadge.setAttribute("data-whale", "pat-badge");
                if (patCount > 0) {
                    patBadge.textContent = "\u2665 " + t("whale.patCount", { count: patCount });
                } else {
                    patBadge.setAttribute("hidden", "");
                }
                card.appendChild(patBadge);

                const particles = document.createElement("div");
                particles.className = settingsCss.whaleParticles;
                particles.setAttribute("data-whale", "particles");
                particles.setAttribute("aria-hidden", "true");
                card.appendChild(particles);

                const controls = document.createElement("div");
                controls.className = settingsCss.whaleControls;
                controls.setAttribute("data-whale", "controls");

                const patBtn = document.createElement("button");
                patBtn.type = "button";
                patBtn.className = settingsCss.whaleAction;
                patBtn.setAttribute("data-whale", "pat");
                patBtn.textContent = "\u2661 " + t("whale.pat");

                const checkBtn = document.createElement("button");
                checkBtn.type = "button";
                checkBtn.className = settingsCss.whaleAction;
                checkBtn.setAttribute("data-whale", "check");
                checkBtn.textContent = "\uD83D\uDD0D " + t("whale.check");

                const openBtn = document.createElement("button");
                openBtn.type = "button";
                openBtn.className = settingsCss.whaleAction;
                openBtn.setAttribute("data-whale", "open");
                openBtn.textContent = "\u2709 " + t("whale.open");
                openBtn.onclick = () => jumpToMailbox();

                controls.appendChild(patBtn);
                controls.appendChild(checkBtn);
                controls.appendChild(openBtn);
                card.appendChild(controls);

                const setMood = (mood) => {
                    activeMood = mood;
                    card.setAttribute("data-whale-mood", mood);
                    if (imgEl && whaleUrl)
                        imgEl.src = moodSrc(mood);
                };
                const setBubble = (text) => {
                    lastBubbleText = text;
                    if (text) {
                        bubble.textContent = text;
                        bubble.removeAttribute?.("hidden");
                        if (!bubble.removeAttribute) bubble.attributes?.delete?.("hidden");
                    } else {
                        bubble.textContent = "";
                        bubble.setAttribute("hidden", "");
                    }
                };
                const spawnParticles = () => {
                    const glyphs = ["\u2665", "\u2728", "\u266A", "\u2B50", "\u2661"];
                    for (let i = 0; i < 5; i++) {
                        const p = document.createElement("span");
                        p.className = settingsCss.whaleParticle;
                        p.setAttribute("data-whale", "particle");
                        p.textContent = glyphs[(patCount + i) % glyphs.length];
                        p.style?.setProperty?.("left", (24 + ((i * 13 + patCount * 7) % 52)) + "%");
                        p.style?.setProperty?.("top", (18 + ((i * 11) % 30)) + "%");
                        p.style?.setProperty?.("--wp-dx", ((i - 2) * 10) + "px");
                        particles.appendChild(p);
                        const tid = setTimeout(() => {
                            particleTimers.delete(tid);
                            p.remove?.();
                        }, 940);
                        particleTimers.add(tid);
                    }
                };
                const dismissMs = value.manual ? 25000 : 12000;
                const armDismiss = () => {
                    if (hideTimer)
                        clearTimeout(hideTimer);
                    hideTimer = setTimeout(() => {
                        if (card.matches?.(":hover, :focus-within")) {
                            armDismiss();
                            return;
                        }
                        closePopup();
                    }, dismissMs);
                };
                const triggerPat = () => {
                    if (disposed) return;
                    patCount++;
                    patIndex = ((patIndex % 6) + 1);
                    patBadge.textContent = "\u2665 " + t("whale.patCount", { count: patCount });
                    patBadge.removeAttribute?.("hidden");
                    if (!patBadge.removeAttribute) patBadge.attributes?.delete?.("hidden");
                    setBubble(t("whale.pat" + patIndex));
                    setMood("happy");
                    card.setAttribute("data-whale-patting", "true");
                    spawnParticles();
                    if (patTimer) clearTimeout(patTimer);
                    patTimer = setTimeout(() => {
                        patTimer = 0;
                        card.setAttribute("data-whale-patting", "false");
                    }, 580);
                    if (moodTimer) clearTimeout(moodTimer);
                    moodTimer = setTimeout(() => {
                        moodTimer = 0;
                        if (activeMood === "happy") setMood("deliver");
                    }, 2800);
                    armDismiss();
                };
                const triggerCheckMail = async () => {
                    if (disposed || checkBtn.disabled) return;
                    if (moodTimer) { clearTimeout(moodTimer); moodTimer = 0; }
                    checkBtn.disabled = true;
                    checkBtn.textContent = t("whale.checking");
                    setMood("check");
                    armDismiss();
                    try {
                        const snap = await api();
                        if (disposed) return;
                        if (snap?.whale) {
                            whaleUrl = (snap.whale.url || "").replace(/^\/_dsh\//, "_dsh/");
                            whaleCredit = snap.whale.credit || "";
                            whaleSkin = Boolean(snap.whale.skin);
                        }
                        if (!snap?.accounts?.length) {
                            setBubble(t("whale.checkNoAccount"));
                            moodTimer = setTimeout(() => { moodTimer = 0; if (activeMood === "check") setMood("deliver"); }, 2400);
                            return;
                        }
                        const res = await api("watch", { limit: 5 });
                        if (disposed) return;
                        if (res && res.newCount > 0) {
                            const foundText = t("whale.checkFound", { count: res.newCount });
                            lastBubbleText = foundText;
                            activeMood = "deliver";
                            showPopup({ ...res, manual: value.manual }, { force: Boolean(opts.force), preserveInteraction: true });
                            return;
                        }
                        setBubble(t("whale.checkEmpty"));
                        moodTimer = setTimeout(() => { moodTimer = 0; if (activeMood === "check") setMood("deliver"); }, 2400);
                    } catch (err) {
                        if (!disposed) {
                            setBubble(t("whale.checkError", { message: err?.message || String(err || "unknown") }));
                            moodTimer = setTimeout(() => { moodTimer = 0; if (activeMood === "check") setMood("deliver"); }, 2400);
                        }
                    } finally {
                        if (!disposed) {
                            checkBtn.disabled = false;
                            checkBtn.textContent = "\uD83D\uDD0D " + t("whale.check");
                        }
                    }
                };
                if (imgEl) {
                    imgEl.onclick = triggerPat;
                    imgEl.onkeydown = (e) => {
                        if (e?.key === "Enter" || e?.key === " ") {
                            e.preventDefault?.();
                            triggerPat();
                        }
                    };
                }
                patBtn.onclick = triggerPat;
                checkBtn.onclick = () => { void triggerCheckMail(); };
                card.onpointermove = (e) => {
                    const rect = card.getBoundingClientRect?.();
                    if (!rect || !rect.width || !rect.height) return;
                    const nx = ((e.clientX - rect.left) / rect.width) - 0.5;
                    const ny = ((e.clientY - rect.top) / rect.height) - 0.5;
                    card.style?.setProperty?.("--whale-ry", (nx * 6).toFixed(2) + "deg");
                    card.style?.setProperty?.("--whale-rx", (-ny * 6).toFixed(2) + "deg");
                };
                card.onpointerleave = () => {
                    card.style?.setProperty?.("--whale-rx", "0deg");
                    card.style?.setProperty?.("--whale-ry", "0deg");
                };

                root.appendChild(card);
                armDismiss();
            };
            toggleWhaleWidget = async () => {
                if (disposed) return;
                if (root.childElementCount > 0) {
                    closePopup();
                    return;
                }
                if (!whaleUrl) {
                    try {
                        const snap = await api();
                        if (disposed) return;
                        if (snap?.whale) {
                            whaleUrl = (snap.whale.url || "").replace(/^\/_dsh\//, "_dsh/");
                            whaleCredit = snap.whale.credit || "";
                            whaleSkin = Boolean(snap.whale.skin);
                        }
                    } catch { /* fallback to card without image if offline */ }
                }
                if (disposed) return;
                showPopup({ newCount: 0, messages: [], manual: true }, { force: true });
            };
            // 轮询策略：页面不可见时完全不打扰邮箱服务器；失败指数退避（上限 10 分钟），
            // 成功立刻回到 30s；本地设置快照同样刷新，以便跨页面的通知开关生效。
            const POLL_MS = 30000;
            const MAX_BACKOFF_MS = 600000;
            let failures = 0;
            const setEnabled = (value) => {
                if (value === enabled)
                    return;
                enabled = value;
                generation++;
                seedBaseline = true;
                watchAbort?.abort();
                if (!enabled)
                    closePopup();
            };
            updateWhalePreference = value => {
                localPreference = value;
                if (value !== null)
                    setEnabled(value);
            };
            const tick = async () => {
                if (disposed || document.hidden || running)
                    return;
                running = true;
                try {
                    // Refresh the small local snapshot even when disabled so another tab's
                    // saved preference takes effect. This does not contact the mail server.
                    const snap = await api();
                    if (disposed)
                        return;
                    setEnabled(localPreference ?? (snap?.settings?.value?.newMailPopup !== false));
                    if (snap && snap.whale) {
                        whaleUrl = (snap.whale.url || "").replace(/^\/_dsh\//, "_dsh/");
                        whaleCredit = snap.whale.credit || "";
                        whaleSkin = Boolean(snap.whale.skin);
                    }
                    if (!enabled || !snap?.accounts?.length || document.hidden) {
                        failures = 0;
                        return;
                    }
                    const version = generation;
                    watchAbort = new AbortController();
                    const value = await api("watch", { limit: 5 }, watchAbort.signal);
                    if (disposed || !enabled || version !== generation || document.hidden)
                        return;
                    if (!seedBaseline && value && value.newCount > 0)
                        showPopup(value);
                    seedBaseline = false;
                    failures = 0;
                }
                catch (e) {
                    // Not configured or transient error: stay silent and back off.
                    failures = Math.min(failures + 1, 8);
                }
                finally {
                    running = false;
                    watchAbort = null;
                }
            };
            const schedule = () => {
                clearTimeout(pollTimer);
                if (disposed || document.hidden)
                    return;
                const delay = failures === 0 ? POLL_MS : Math.min(POLL_MS * Math.pow(2, failures - 1), MAX_BACKOFF_MS);
                pollTimer = setTimeout(() => { void tick().then(schedule); }, delay);
            };
            const onVisibility = () => {
                clearTimeout(pollTimer);
                if (disposed || document.hidden) {
                    watchAbort?.abort();
                    closePopup();
                    return;
                }
                failures = 0;
                void tick().then(schedule);
            };
            document.addEventListener("visibilitychange", onVisibility);
            const offStyle = W.subscribeStyle((next) => {
                const openCard = root.children && root.children[0];
                if (openCard) openCard.setAttribute("data-dsh-style", next);
            });
            const offFont = W.subscribeFont((next) => {
                const openCard = root.children && root.children[0];
                if (openCard) openCard.setAttribute("data-dsh-font", next);
            });
            void tick().then(schedule);
            // 弹窗是命令式 DOM，没有 React 那层重渲染：语言切换后自己重画一次（开着的才重画）。
            relocalize = () => { if (current !== null && root.childElementCount > 0)
                showPopup(current, { force: Boolean(current?.manual), preserveInteraction: true }); };
            return () => {
                disposed = true;
                generation++;
                watchAbort?.abort();
                clearTimeout(pollTimer);
                document.removeEventListener("visibilitychange", onVisibility);
                offStyle();
                offFont();
                if (hideTimer)
                    clearTimeout(hideTimer);
                clearInteractiveTimers();
                relocalize = null;
                updateWhalePreference = null;
                toggleWhaleWidget = null;
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
            ctx.inject?.(['uiWorkspace'],host=>{emailWorkspace=host.uiWorkspace;host.effect?.(()=>()=>{emailWorkspace=null})});
W.register(ctx,{id:'dsh-email.workbench',label:()=>dt('邮件','Email'),icon:'mail',component:EmailSettingsSection,order:54});

            // 语言要在任何 t() 之前定下来：槽位的 label thunk 和鲸鱼娘都在挂载时就取文案。
            ctx.effect(() => subscribeLocale(ctx), "dsh-email: locale");
            ctx.effect(() => {
                const id = "dsh-email/client";
                if (document.querySelector('style[data-plugin-css="' + id + '"]'))
                    return () => { };
                const style = document.createElement("style");
                style.dataset.plugin = "dsh-email";
                style.dataset.pluginCss = id;
                style.textContent = EMAIL_CSS;
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
    } },{"name":"dsh-email","version":"0.1.0","hasWorkbench":true,"packageVersion":"0.30.6","label":"邮件","labelEn":"Email","suiteComponent":true,"sectionIds":["dsh-email"],"iconData":"data:image/webp;base64,UklGRsZaAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSO4YAAABDMdtG0mSlH/Y3eNy7fmNiAngr/TeMyyZF5zuObL4fq5wGNlNvDOgME1sByAqIyMVN7CbuGQ/ACo8geUH7HJV5Qw4uKu8o2uv7QH7P0N2/P97VVWfZLMn2Thr27Zt27Ztb7K2bdu2bSs2ThbnnOLzurqrq3saMx9/IsIZbb1g82HRUDVVIrrW/tqNbdu1bQUNLgGATTJkgAepEAA2JqSArRPAwtWe1vDOnHNXcfceo8+xTgARAdG2lbrRqY6JTQzxAWgy/QBq+eb//cf/gAHjIhKC8ziliLOWGzcSmSUtRAvlCC+MD1lxpxOvuPPBRx669rRdl5ghyU+r5BBRz2UOvPXjSQ4Bo368fk1BgrU+X8SIem907Q8aDrBaShWbeD8HuI82Js5bG7hgxFe5ZjgAp6Q2Nmi0NHBXtxNvcb7Bh31oAJ2E5TFK4Yt5qGUlwWLfbEPHwZkgx2VZ040f52hVXsFp1ksmwykdLmjnsjyuG+/2ItaS9qLeJ02CDfni9FzKpPLh10OJq1oRiffa+ufYZ4L75zDpWG6dlmNZRLPeD6eMs5kmHxReJNZy0txtPJTK08rYvATrt5YEI+p9K5y24bI1RmsVG53rSDG5i0RLibb4V1Am5DNaShMQuK1SJhMaI/sRayFum6mQIa6WFrHpGvvTZx9+9MVvHQ6AUdl2o5ZBmKBjnFWhElUO8pvbj9xwoYEzMiLRe/bVD7l9eOJJyyAJJM4m0TLcmdAm1KJY/HnJ0m3pXKWurT5bPaMR7pIVHifRKtylUEGH8Qe1Jx1RJDiLfSw2cR6IaJXXoU0QnwQzz3hiWHM+Kl0SdgaPzk5M5ChCljBOMjZgNb7r4UfkUegw8RliTfeoJ6Wc39XiVGK5i05EtGOXM/44zMVoSyB4kvtBCyyx1CJz9fG/Cm+ubu8MZw8lkbfY4qR5D9pW+17ndLLhaWAWPeqBryf+I1VXx8iPHj5u+R7JAKaJhq7R6dckz1mzO0UsX9uUqks96VwoXwxTeJKSlmaTV7vgADhPSnHQ3w9dIqmNTTIFGvwLVLApPZTacg1HvVPB2/v27UHU6yvoVEJnxqdhnicBK6U2vtFSWkA+u3qz1M5yug8y6C6gKJePqMdKJz7++W8jhn/3zLkLbwljk/bZ6uWIVk2GKiY8NkkkVgt75xCKmiJvD+ige4DydDeC0yzHf2WRlsH1U2NhvHHXhB1nX2wcuvONzZXGiDVINEHe7CND0PiyL/E8QsmgoZPgrFQ6MUpamHTCmDoGKuyC0SU6d0p/C9a0JBJB14d4xqrVSOQZjO8w6rEOJbxytQY9/9/zHyneFt73ECIttzShSAtOhwnxLqQox4lpv83XQ41ALsVO3TQwXp36hJ/7UpQctu+iyy0+0JNQmg69wqMmNjHvixmJZWds0S+h9LO2Hzmumje0xEkJ2fr50dLoCe+cv0gi0DWX8CHjYdIw2JxEtlt6PKQNOMQi70NEg5HXn7PqvXBwNuaj6675KeJNhe4D5aXpXSSvZqfAac5fIa1LYYK0UmWAgfaFEiUNOg4izptJyJMJTCqVrTIpo17vBlUx7qDYhpHKqNBpUAYPzUS8eWwPHAudgsbXPTLDBQ2NXY4CzW5m5NKftMRbzcMKWtmTIExiJYZmUk4L/+1M7iK9a5bNxZRpyq6zEk9FxJoFdoVK72PcasHqwOPeso0uuf7ntekC2RutmhY8JJO4qVmQiE6EDKQ8vC+x8I01jNp/u4oiiiPj0TKkLazCriSaBM4J4qNgfaQFDrr1paeeVMjB0A8fRQtoRWOi7p5CYo2fepNoIh82gcKbKcpiYeMJT4/gTJugPY/pzWdMA0hUcjwJwZoF24+i8VnKcTq8E9abbfILkTFDwgyVZIgyMvbheZqBDM5pKeWMD4PJs3uE0ZXQKlSIqre0cztQNeNuCBJnDCbt1wT0MozoQ6hAQodRoi5MOpvQOEOCtC1mXB8cEJKvafDSPBSx2m8eCJmCxsh5SfSgjaFNoIAfnU1hqnKxCxQxstBaYexmtY/FqO1dyMCo+9tViNEbUDajH5XHTq9BWRuH9FPPuZzxugcvPAHdJlUTnH5jr92UzXTPhFUmqNxFdJKJzGcHkqi90n1cMiz0y8EAzmRfNI/E4gaaiGG6JL5bmKK627kfB5zPNElX64NpGFarK4YjdZjEmBXrbjmj9R6bFFC+mTyi4zaDVK5XQmxyJg5VmLZe7S0n1n/lj6EzpAzgNG+jk3XdKuaeFP7esPbzE2285w0xK7tgbHWmsE4mxXw0Ouo+P8Go/SVom7dkdowECiq+JKjzrMak5WptGeOPX/9FKsbk7L/BDHO99anWCxw+L/E6yx5XpFz3Ufomt+9iWmJJuymsxCd9idU3qZ1Sod58bvNMBWo/HU2zbLASucQ+UFvCaNDv0ANZBKuVTYA61gOMu8JpJOpKz4e08LFJgBkMltk5XqZrWuO2r6dlNHg0TL59jzELnF23OI2JCxKvJd0bqpApxAizxtsj2yAKrwtidcRdMfJ8tPeeON37hLufthNaiWH1ZH2C8I0DqyNmz0wW65wkuji3Qf0so96/hbEdUvy/MDS4jIdFFgWwuajGl+3EaocZfgyiOSPZaZvGpfnC+VsK51JUP6HzFY8txhXODL1ygQV2LGY1yRG6Vqldgm10OFTGJdVkUDhiHkoCIIJVeK+tblTQVomuxa6WrF3H0CP3lTjYF3UJ6ygS9Up1pqu1NTYMUGkPXFweTgV8DGyskVL5wOhZidXJLfw1Yl+GXLljlwP7qlZAD5CXLu9X4uoaEU6L/07POYxh1SNin3SqLbTo4s7aBWPlysTrc9fNd9f/Gk+uswxHjjJwP3eAS6vwPLHa4F78bzO7QlZ1BXNHMI9yHseCj8YmNWEJ2jrXHcOqkDANCKzbaFFc8nJNCKOXoeDguMvCXMUzSKfD1LTv5DLZohaE08qB/pa5BpDZsJq3SatFuV9H8Z6ox/bl/j6+pmdWzILlsY+7s4E/xdbYoR7B70EVUrQxZs2A2m2bzqiv3+d1CB8wFqaYqtU9x7jX7uaaCpBsXn3Cad7psIV9dHTW4asR6OQICk8Rrz7mmuYBqD59Pqim1KQrT1uMtatW3jJq/x3GyQS5mZOiG4EezYDmaGuYZfJQHcgzaYUTsKzOHOl0i+xl7diqsm6LcV1LVN4K2h86XzkohrAMoiPNBN6+MaaI2CKJy0lUfnOmX6BXnqMikFjBkg+mp5uiMWpg5aXviE6AstBqPULOWoFBGgreg0TlI74DnfGvMgeSmotJa4Pkhap/cLrYV7j6E7azRe9jIOkqg2wmiHF6OeLVdvN1wFg+3FgZMIpaq6ont487FX5nrJKfjElcVO3NiI6FTJ/nIJtHUbeqNjyvQq6nR6n/UqDxczuxSn88F/y9dCgTS1QC1wRPSlYwLtPovRZh+yoTRm3fQbtCYDYhJf5QSvdPs76hgyhuxMGPEa8y+o9FMZRPkT4Q5QZotuAyGnneQySDqXNSVOGQ06AyexskgtSnZHqidIy6jOmLgKriVhlJonAICSGqKnSv2gXTWG87pl5Rr7mLlaPRTcyG/qDm79+blxgXrKIzDtrvShZjTUb4YTVrRxjgFZt0PpCDDgzx1XHdUt7znzmrWip3Q2ZeSEihvl5bqhgDNloGlXgKGqHc/i3BQj23Wa/U3bERr06kXaHy61tE2fdeYkCG9YUYIKTCM8E9ty/wj5UW+PWqjWf1GmDGqsKbbTh0noISqYX3tptoW7xL8sAELrKEg26UATD161eef/aSuBWqCO+BEM97PaNrF8XynxhqM7xDgvRzvgFYjKzG3dmCtgvwQmky7mk6QmUiT05bdDUf2+hApVQnriJRBV7fH70U80LUcCZlM6wlnSDoTexnaSNfI14FeoZPzZqfSkHJq2Bn2StzAhL8g+ZrXqoAGM0yBiYT0gZAhsVtz9kFzy6E67PEFSQqQIdBBb7wLLuLmjWqsI49mQB2geKCaslgDRIVoONgQgOHHKOaKIDIOMD2pwwkniRWAXoCZO5yYTtIKhF39CLUM0RJ/zprEeLl0z4/waQujHS7m0nVDrxpm22B0IP2ZrTRm1cifHvoBi8KHoMdZB+E3lqARE4cDqSIKoC7U78xgjVdb0EghCAvI3XtXw2Z62t/vNq6l3iSfKwB/FMrY1AAsUKMxo/LV0IJ2UbfFo+aOLVOg/icJG0xTt0ykCKqAq/nj6/XESaPXlJUg2l/f/juNH5ashpPMY5oto+uEkbx+Q34czoAxooeSMkZD1NbBcYbPKJlfkZxp2DrTJ+lKR1E4oRKHIjTXn9Bc4tQIYqOykfVgfjHYGIV4LbfAGNyO/2gLFeNZ+1TFC3RuR6VzWOC0VrfZUyzwdk0RcxMbZVMDKOsw/C1SJT/5sRZrpFQphG3QczMc5lv1kJwv14wmETJ8RkNPGMSfGVvo5G8GTLTiCDzPhiM3n+1Gct+OBmnXuteN9Z7j1YhqDjHnfT1NTX+THy8ZEF7v18dnPKLsOENu4j24MzGuxDnaWUS5T9W2Bnp685S3QdUCwLsRM/CYMX0zWL+tb3gNeULHB+g2xTS/N9LX8yAc0ycfeK6Vyl5H+r3J3R5l0Dw13eq3har8UVf4qXfXGJdMZ1hVR+jSoX096/X3gFTeKpHqV5B14a1jEdcQfRe4sqN3jEDCcy5nulT5g6c5p8IVRwqMJVw9ZhesAHGnlNVJny+EEWsRLulhEpE5wy1BwuSmkgyXgT/rEdh0nYkeImsDUbDalX9PtxLei5eOJ6SBSlK6TGsLYYJEiXama+YBjfgBufknwcqWFKFbHG/zvnGPCUmwRnNdsjDv7tqPZX2uFoeKSf24BVH/a6qG1azS4xbt0ybVNpvXp/2I2GN3Fm1BXc/ZrDbkRJHoXuvMpNnEX3llx8OaPoYMMpk10KAlnEuaWC7arUuqQ1OLVUA4bT23zBKSVUWvHiiApEfDoTYBxRrNyKNxvEUlWqXfcXCAbphVMJ4+kBeqH4XQDi0ZC9f4aSbrr9Ba91gY3joAYNXwnKUUg1VxahlexuDncuVwbk3ErkGxrjcw6Twssr0FnUs5KOFK+35akxbvFwNrIhEJMQJk2BdrqSy5SYAAc/yJrsarfBm+fMPTNAb0ClVAtt8i52q23hzc1VM+t4VTiRR+tzbqdDWQ9+pmEcvWG6pOoLBxDmJlTzxvF1yuRd00o2XHUPOm2zOnFDw4++3Ao8mjGiNv6EbEr6RE7lpn1VEpviMfgOCaIzoT6xMt8JEaFscUp4TlC4+Xt5jnRNP9OMENyNRoltlAnRDghScaK4WHCl2HW7O6TKIxGWlgbXRZtOhGuhGB270TDJAnxEny96+wCm8W+Loc89ul1PqVqz6FT4qQce+ELba9HfTct7G6L7lBAjGLoDReTXNSQaEJPswTlfTFjf4ez7ipQy8Bz4JZcKdXgELkdAHdyWs3EQfDv3xxolFhdPLlAAmaLkfIY0N4N9KYmRDrhOjgtuiR+tzbyLA/m6sXaF4cE5HdQbTN/j1MaiM0ok9V12u03WL3VSe0jPP71ui1JDp7PhngcLBKboDgdG28aT3i9Gd1TscZ1oOScQ4Zlx/VaJvfp0ljbH9io7CaKZnAtG8mwvw7+CrIU1WlDBAvzytpRRpFdtVKvVzqNFT+IAKBqMB70GGS0vhCRoKmat6hHHBFIJ8D3+BAdsTooTHknJ6FN0Zna3E4bQ3ciogj3E3SDekVSOlgIptrWDWoaxnEgo6EjKzwLAGLdaVMRHj/MQ4VklkJ+p6DFoVPEBK3/04I7Fi/Yv9hUz1Fv6en+h1qIwyPHDSh6jA8aDOm7UzTLVaqnGicGDh9LaYZqJjLqJtYVyGzSNTHzzWd8v8aDXFaXwsik5xjskw2ehchHp+5vs0YQ7j6iFFiAkzigZePyYuQbxYul+eBlZhO6Kv/+h6kcXAHUxKCnercz/euJJR4w2iYnFzPtxKh/35Yk/81HXfYKVgDKkQcT40NiVR6MbreWAw/jW03i6LdPOykdqsSYZHc+1QeKTITUZt30DnKj/oUspDQrRlVQg8PJUS6cxGQLak0kyft0DLaIYfck406kzhWWLfoapKZXKdLUV7E4p/ZflHMQw6xiFLtGpkfteLkiJgs9b6NKeerJW4pEgIeihmKzxzB1Ra8i0WqWfQjzJQD5xx13gDCl/pUeRJ3RLnbnlj5t4RXDzKUA/BmGxX2nHGKbxCrNDfWU6CkbiA/fp69SyWDqqsLLlE1BIGR15siJeJU5Gb56Bb4WH6zlXDYO88nHv82Kv1aZPnrLUvds+jBQseM76NLkyZ/zM//JhogNDvAHGXeoNSRhu/q5dmSeLCYnfjNMsX6MQrX/iGmX+uXO4TrI2QXz5lo+tulzJobEuCirWzvgiLX/z8Co6nYwxlNEBeXW7GLzUYW/iPEDkTu37R2deJ12vi8s0gVt6Vsce5mZnEtSSKV7szuuP6b75uM+5WQhi2niaLlCorBaaU8XJKQSv8TfPytBF5xok7PCWKhohWCTQ+KOfnJy/kU7OaoEvpTzv/ucIXkfriHlnKPDPkkHgdhf9Mm4NY8XRDaGZquqzLlLX0pH8fGYIrZAVu6Q5RzjtpOD2ci2r88jpMtvht/ltHGcZycc3GzCEXFw5GM08IFLBMsfVbULmejXnIEM2wI5cuhDFSQVQJAYI2irc9CncP9iWx0EOAMgsh7HFNh83oQ0vn8WYNCn/2YERHp7ZN78ISy8Okq6NOqZAb1KUMXm5RRoX1pXXKjlivu+xIouiPy9JTDzp9l7ZJn45886TQfXYtg2BhC4rbR88SVxSPmyGza4/EabRzYMVRZd/BgFCDQZmJJGaErlFCKnxYPPvKAIT4CvvT1umYerHFWIBNHC3cDb27L0IJmruI6qQGU2YnVjD7KKigBGB9nE0rJzHKr7bqbAzoa8eZyaLdSsQL/lgn/WpRhXFyRzECOqV7i1gb8K0ba7alnjW6qNZoFFlPh2ntggMY9f4dWSK9Z3H83Z7coctIrK67P1oMr21yFRqU8NyLV4KGQvX4YOwUX+qW7BebOA3oNwYThhR/49GsY1ADgnKNTJJEgmPYmJ33+tQdiUeJl/GGqU+2EhoUsefAwoMzx0qoFNlUY50SbrzmqVWFhsvh9LHddtdgnYq32tDduKCU2245DYNVpnHcWyR1fJQ+XdchGGlwG2Ml/dpqn6mxp0FsuuRGRtBXZ02+FYLZ1Mph2pHEGZVk5762A9rsKlcRzDYlWfM873XNOL7DlGvmovJewiEYzXGVc586x+w0kahifZ6/6BthtQXM58fOUu6iFXmc5R3HX/P6VPv4OC5TwF1UY4PeDWuUAdyfV68aEQle+sMHZ/nuH66ZXgZlMkOXM/sjQSceKENLDYfRN63fTsSq8NqRmPnVb/3gV7UZTX6es7+MK57q83NRK5twbtuqH1FlVinHBTESb/rvG88Z1TKzx599OIa+uJYGsL/etFX/hjiHLFBboodv9KBqBBLsPHWg13YuK5VbJZOG9rvLV+9VFCfvh98I2chxgAYmLHzvM2RKgyaRL6C/unDVHsVzkq+jvQxpXMOdCZaL/UfBtOui4SLCTivtgK4Pz18xCvznCaqk7f0wjNQh6FAmrLaZzZq7UU4RNqcGvjwcOp4+ahFGxKq9dmnO+LEdcFoqfx25GnA6b/tJvgHqdijZmmxyGWm3TNLUOEx4ct85qXjOKT98/utGp9cRbPH+dZ9C5+1NIDhKv9MoF37Y17SwzgCjpdfUfH/jtoM88Yizmvy1hr6bDHvumz9H/PT2jTv1p75fptfXunc2Fhj94VwXnFS1U0F9L9fA4Z8PTl2+p8+p0YpbvD6oT9+e/o+yFx0ZtrYxKNVgm2qVcRh/2kIXToeDlrFROh+sSVoawI14cM/5udfJ8LotNj05yan2ndOi30Arm89qE86EtPBqlEm6SJ29aZSGw08nDyFO85zx3t/wjQllPZBB5eAw6aUz1+5DnlTNarrmtLQeg1Of6w2c0uG+1HhL7wdM+k+XSAfYR679Fy5doN56s9P/T0A7r+fYZobkZAoiNs9mh59zztGbHQXtzX34MEp6Yf98fMVWQyicbu2Xn7fqM11wsMq7VpKiNgDgvh+JgNHfX7kCowXPem98l+388anfkWX0L/ftMUdSlXm4EeF0EpySfifnfxn1xwO7zy+86180nm6tWqKFT3llvEPAuMnfPHj0yj0GrHfcTU+88MqL91160LI9U03WwIWXXKAX9Vnr5Hve/nHkxEkThn/z5v3Ddl9qBn+IH/y7PokRtPMf6arqMP2jm/dbqr3K/WvZz6YasMZBF1x3x923X3PeMbuvOXMeHW8k0qswp5QKNOo7ZJYhfZI61kDPIWimfR/54s/h379734mbzM1yXWxNI0KOh/vFjTNj3r8tSqVE4YV0MxGoOl4eGmg8k9yJ9vaegRafNbV/2xNfKN71Utj7XplnGslhxpq7vZPTqv+80711Wr75f//xv1VAVlA4ILJBAABwqQCdASoAAQABPjEUiEKiISEWPN1gIAMEszdwufh4K4/0vYcan8N+Wnsi1d+w/2z+8/6D++/uH8tev7sTyn+cP+b/gvzM+Zf+o/5vsf/Sf/b9wL9Yf+T/fPW29Wf7ffrf7g/6z/nP2b93X/cfuH7of7r/r/2X/4HyAf1H/G/+PsFf8v/zP//7gn7pemv+5nwa/2b/ffuV/z/kO/an/8+wB/6/UA/7vqAdbx6DfB/8j+WfnL+M/Mf2j+6fs5/cP/f/t/j9yv9S/+d6Hfx77YfhP75+3f+F/dT43/1/5I+bvxq/sfuW+QX8Z/lv92/u/7U/3/9vPrZ+v/YfvB9t/yP7Q+wL7H/Qv8r/fv8z/vf7n6SP+36FfYL/bfmv9AP8y/pX+h/Ob/OfPn/M/2Xiw/ev9r/z/9r8AP81/rH/C/xX70f7H6Xv5r/tf5n96P857Vvzr++f8r/Mfvn/n/sG/lH9J/1H95/zH/b/x//8/+X3i/+T3Gfth/zfdH/Wj/q/nw2Aklq5EYRiMIxGEYJ1qatNkX9j666RUlSZXrE/U8p4IL3UeIjCMQ/4F3V5e72Xi0X9zKgZCodUF1v7GTaWLTiC2MVUUxs44ESe2iy5hUf9+ZVPAELrq4xQoasJpn4CBh9nYh//peCjRHfJJbvKT8QSv6hSZaNRMeymppZd2BBTHO38bBQsPkR595z79xM6IGh7NPlPWZAmKuVo9L1qpJ/70nu5bJYUthiI8Cjh2OpsZZoMc6Qo7cA09Vsr9x2WOjguBJY8bJ2jVIkS3omZ+TwdMVODuuokUvAcR1F21qnTMa4CNE38OGIDBv+s+vSUgAeIC569MgQsE+D2f20B0S2LjEExtO0K0G46TCDkjc7OEuhBCq0KsmP73MRYMtdkeOL/hFTW1++etACqSSYvcOY40jxznNDzWLZMtRYYJjy0nWvK2nHeUfkPrSCBJ0FkS4QcK2P3PFiUaptY5Bv82nukhyn7OJ2FLmxUfawPidD5z4L1sYUa4M7QKAG9lDwv1RC0OCTtZHUjWnJ2pXXF8xKNSmmScPk49vLrV7A71Zf40xVF0S4TlL437xwsWT00h7RE3TnGZXv1iWciO1EJ58jegxuD9FL+wH6U10+cVKQN8aJggvU54V5LlQquePQEn8Rj1BHkcILRj2Ot7j9ncG3MUgoNxJAFIIoy4tf6aj5UJR1A/mUQ4yA8l1dS/LqXPr03y2TAubEKYOH3rLAc9p0k6FZtWwOATp+diqA0ddKDU7Qmv0s6kgUtJdrtOtgaJJ2VL+PEwjv71NfbV6PuuGakAeajm7krVCvCrhYVjlI7B9+36aG4dl40bUf55IbqETzR4KXVdf6NZm2fq3/kV7//dzZzGFZPvHlwdEHVQ13I01nmVu4BHvL7LC1dE8BDPb4wAxqnv4N8F8ODO8fENtmtb9zLJo32H2eyWRKIdmPi+emgzc33Q4h2m0F75/vNehWUB9LkY8/YSIXHX7iF5NBGoHks9viHYuI4ZEayMc1NaUPzZ/vBhH+4WABORkdxMm+oMiTVcMATG2F9cRGcoBwa1chDNJv1WikWd/wsuEOI3KlrkYVKuKkNn+pGvy45OqZA29vt9k+dd0DVDFxZxVc5EOcdcDDfxrQLbRRpz1hnn+98n9v7wyxgWjCVQ4TTS4Fks5J6pl+8IPa57w3IScdhp0HjeeMZBd485hZo5r+uwE4JqMlmW6we+A5GX/kbuC/wHKY8f086noErdX2yVdvJot1SpucKi/kh1+84Y/l4Mimcl+TPyR4/+xG8s4/96oy+NF3x/6EKKIVKYVH/fucKRJLQwAD+//KPAABvBn64UzH6j6FfYJFu2e6ElbF6s4GYiciVXLWJJnK1+il1HeO40dzkbblgiLDnpsWFpy+YkBgS9IIKej2GBt8DPbC6E0/Y6BTD40qOBWyz8p0ld6l0eYAz7hwuGITzY5vQgsa4+arKoK9KR3slKh+mhXs7v5yisVS49OvqDa7nZrBNC2SNI5BlWPmBUrFDPOWmMNAyTNYSOoBYPuOkqz/4MXncUtQBXj8TLMnvb34kiPlI66rm6K+wA0+IFr0yNijUaqyM/Lg7tuBrTlklFkWjeMd1IpwDYSCHVGw5L+QohwQpiVdQrlG1hJRWuh/n0HZy/7bepdDguRCGtfFPrBJzqSC18uPlvse4QAkbCin2RCO4+j7qCEEbi6Gwwk76RUaBV/OYXwPRDUpMyFYXVX/LcFkF5pPzwMKf2ZjP61f4H97LK9vMpknUHsy+Cz0/f/9i34heWRaP1YNbJvklOswKs/59pusp9dUi18SGh5HKUavN4mBOcfYkxm6Upp7ebsKtKSNzrtbZsl31MqtVJw/QIPe9prBZ+lpPY48H3lhVEy+f1Xr/mS/f5HbNCH2NsHrft+3zMd7f0jSn1mH5ixk0Q+SwbINGolf+FFxJ+ZvmRQvmuztc3MeLGS3PQ41XkzFuNXJQIePtgFPPa/1dg+3zvonllfndzaKcTeMxOXuWq+///xo5DKSM5ibPSBU2icNHDTnPNppf5XNDHBmYUTNYVnjnGjzCli87shmtrlLROWoTLGFVR4Om00O8brpNfONX8vmSYgvd/LqPaS/MSLFQm3wn6868KNZpoULquiTn/r3tZc8Q2qgHig6L1rDT/0L2D8eOddVcob/igJqwJNnOYvrT4DMA9AC6LWmCU3LYqOTHY8U7lWlCk6xFiucA+SC+Lz4LNWXtcvPn8sYlK/FL8nEQJEj/VCfA5bQnHAWaLzIDOFE4L8KY0MnBXrFTASq9cZNC4o0/KZPgnKDsSEVudj4eT2RoCYfBrDimiaPsHMhSXkr+7R8bSqTkKgW6eTHQ529/7b2P1qn4dgb97VrnmbJrZQZzyymbmnRl2ggN7qVCshFmSllcujylIpWKbajkuanKqK+LWegOPluyiEvm5VR2VkyEaunNO9tH5mjV0UO/HRmCZW/lOeodQmxnR3CUYUs/8epAVKNNtSi6mLQlLYG5r0927mq0KsN8HeiNsxRgoLFNRaR9vYeVjtoNKGPD0VSCCS/oXYxxbqMAUng2IKxJvsHREd/ecR6KjIrAfGj5jOJxojY/WDkp/2q1AUqhwT8ODjZaw7jtN8w1nluMi9WyLncXSZkvBV94NMSNk5h0ZbwvFcKoAEiopdhIOf0/OF4oKDsrZdxffP2qKChlYnOGO+sn4t4jOVYBb/OhDvPbjIT6VbFz5uHq7YZ48Jv4Fmbnwdj283Gw28jVBfPFSs198T8HYy4XymUMEg93pVrRZ38j36sUK2c0ToPMNJLawA85Er30VfVP4sBEu/S58dzCdjfYnowFFEEYzvc2JYfurIpq7iAJZfNmVKm2bh7nqQGAx3kCBB5pP314dBw0Pj+T1eOQYhhPu3q+ZckfuNJVLXx6vf0+W0sGw5XbzUFcpyqg003aFltyikGvFRCGelm0ji8ukyqu1OsCStM7ufPyv13CQ/F6L6rtOMF5eYu2ZM2siiQLV6cuI47t+F+wNeqk4AdN8oHNJvE7y84IyUH+BUPjhCAjj5+bOtui5P5rqVNvBFbXh+jlKbaqfv2HdujXbs9woLp8ize1/myobRdvbwUGxcclOjMAQfJctQk9k9LnGjPXpphNlK7ejQhO539mfDB8YkXait5eOzQVkyYcY9f90orwZoVis2IeoPQvqLRhuDwNrpH1FYQUGV84oBMa5a5NY9dkyAi6DA9km0y+zkZSqmjfU5sObPwCLR+KHRobg9FIUxzowy/u6u2/FoLNYLWIVyeg3gAtOnUpBfIS6+r4uzqrPy7T//R/vT8NC3ILP7q7uLXbB5twyg7dw6ezQJMMFX6/NaagXkmn82a+fVMOEa2/lTiTxk51XXeDe02sxsJjCtZukjMvIoHwfpG3RNEWYNCaDQAVDpGMz+Xodic+8k4Dqqst92RM/snJ7V8Rf8zmQ2xoEUwhu+PbnFV/sp6E8KqG74F2Jh0KNJHn0xn25ONM7hEddK+Kw6H9Mms6UHrHQ6fDKoaI3RwAMY0Ks+MQNKsZWDbG6eZFlnmFrQDueX53U54HV0ZsFOtTuyBzSO284CHfHeu7s5K0ZHO1s9uV6FRxFI/r/FTPWDm7wD5pX3cHrBAE00Y6qnQUvMiMJDVbkfnt+XTTYqQGxXpYJO+nUxPP6pRwGgb82hHqGqQe0YSIcPscObrl/QZ/WBrAi43GxMGp3lyUSxL/kgVK1+CIQ+fUXEOJ6gQBTudeglIpUuRGRCbSNMossDP0xOqFtKKt/9lRB5MxEXR7gk3z7tj4twgBa69CILzQ06q7SaXbRxjyB6Hnja/Op9+yRyEQG66E9KhRTqwPt9q6d2yFTovMTZ63ZecdnaYz5b67Vk6FNNq1qbWvU+UMd/MCDqb7ShYZtavkOEMvxtGzkvcR85T+94SeB/pNxF3IWnJSOaYCThpO7Ll9q/54Yl9dtX/uG+hPLBlbLe4rqZte6vTM/X8a487/PHlsn8FqS2YjVeWv5aMmMIPOctq3wZipNyBqBblFANwM3kTSjwL8/ZXlVjN9YmNuvBiGnHUQ/qf92Jj0xj3SK7er7IV+Ex+Le3wG/Xgrgecvk8UkQvjXOmEfMUPP5jQx1iXX52HQ5+wjx6Z/uN/gOo8F2euwkcnezyD8lrMphdB1OsjhkP8ZBU2DlNS89IAIGmkYhOcL8bVr5tmBpexd733sEPKPvxwFK8VP+QSAMsKsPf1L26vAq7BkAgLrXdoAnD1J03Ahrdz0D4T8oI96IDT8Y+35a197b8fp9YATTrYr+VR8N94wB8jvkS/BmhXMffm6GIFPPT3xnx9Q2OM8ClT183jlblhQDn09K21UP/s/IVuad+egvbPmHfATjMuj/Z/9rG6tqAB0jZYsK1W4LX3oy4bt+8t9Ec28x0YoyjsiD8QzqyxYobyBptGOjCfAZgtFJsL0P5Esi0OXqVh/C89rlN7a++y9uUNJBT0K8igghzp1XaEg93s7ZjdpJEgnEgqnsn6Es8MiTZzRuk6bn5jIB54h4e5tboMyaP4jP7feLw5orULrw3lEzKG02ytDiDV3R8uLx0+7XUc+uimNtj9OOjzWVl1vq2CnstLnjVrkhLyvaZGGpm3TK/ctUg3rfKVF7XUFpe/4vvzVbmvPPqiLGQ2SC00nmsJj3TCLGaIOtLaRJJk8hzvDPo6LAcD45Ld6fmp0tuiI1K2HEenX0Mhmk+ECmNKeDxfNcqW5n4FCb5UR/3ZYY7iOY1vbY06s9gVZzaN8W3eRy0Ns46MmaTa0LKOHxOZZ/g5gmp5hnxwySsdsHYLwpBYYJR2tywJj2hNWVunpM14GdzWIWRSVhHyw5WkY9KV6XaRsI6B/axuVGiG4ALRdIlS5EZcX3vOFpeCP0R7kUc3sO62vF43cO6i1/QgWo2WasjIuLqZu2IXZ8Z82D0wkGbXW7Gocqt6WwO1ZEspqMvbAwXJPPOIFqvwc81sEXd9Iv6JP0D0l2i/+eNY+tdODYMsarcMrSQLxuaroKrLrcTgjnLhWk24JAr4vB85HyxprnXmM3nkvT7IvCwBDKUGgPOX0+iNohjm/sCxhe66TP/NGWu/LVXSns8nGNe/qSgrJfKNT4DoM1a/RIbaEs9OP5+Twl+mO3bIJu4q4YDxibwThFj2E7PZ0LQdieXWSb+dOcyVL/o9jSBXvUmuu3oFCisud2Y2mPwTdl1qSg2IiKgMx8WIqyVVvJkaG7SEOZQnT3TwL5OQARqQmMi/bWyFHndVi5XvrqYLGbAOS3IKjPuo7qWM9sEXjwSzjMfirzzRI8/nkf+SrSOllCkNvxQGTYN+HX4fdbLuGZDdEZB+0mJruSJEdlGNbp8gLePoWgN2aBJqT4pLdH96uSmMWaJBWDCYrh/VwQaZg8nHjEFbpfwf0CYhC9u0PD+yn/9gvOzwwGNH9tHyOz+9V7ZWG+gDUVTaykNtHy1ZZG+T35vm5iTaeivy+64GoiO5L5zAU0/7HFb3RFmlmqexdX7o1UeTAjIFHN5rZdvOoC3jZhje2vOuc0JgJ4HPVsqb6qXVXVqAP0FRUVTPVmMFNHjpRN9Ecnh3vUClCQTxIZ/sXFKlPu0oW+WKarDRFMHLByMaJQnKA/bGqBaDmjCmW9PCos5Blgc1o08SCr8C05VyDNg4P/UPcZyCdbrYxeUIBe80E+bJfkmdgccjzKUI/wIwbFgfsLsQBBv/SKkMKuFGrwQ4ziE7FXhVZlnYiSwQKofrtD3eATvkcYkoEzDwkyEo4hQMWdPZUyf5jtP4sJy2IXmPN40t1AQXhbup98pTcGXIXmEoesjwnotwWM6DkKXFiTjMlG8EB+jUeC1eBor2MpxVj6hu+oxWe+3OmIOn+B3Xibn6Jskm9Q2mVBMKWDEXcEFi2V5c4YUioMfBoDrkcwmA4K15XnJ5MK0TtJ+oIN1sUU2qUVyqcRcEORR/1H1aWcESL3lDEvMWv6TLz37HeWPWXxfy2c7mJv7Wc4MtMcXnldFxTlL2+OjJx9x0wiMnxqdqM9gpi9E5ytoehbBhpD2lj7XwPuhmmnBZfkoU0KDZ3g5QPiYXNft/L+YcwYDunumtPvoYG1RahKHUQ5ncrMAEgemJu1DXaAUr9SsxRvExHHFyVM/BwjZZ37wwyXrcbBHcDRGOPrSxqqLKmAzRxgzeJGxvXn2KcBddxdh155fr3+uu0PvN8AnVSP5Y6sJg0xUVZeDiRoYS4eQCZIgTKHckuadMPgYsGBGF0wmRkxD83Dfqim7FOy0gzjNfMeeAHYlgRZAnusJFoq8N6M4eilGsaDLrFhiYoSKWAj4tfVDrZelBgYjNVgK9nyYs7ZspfSlVbtXebYlWfPvpjXIJuvgtmLWWkdt3B9BYrR6mUKzxGMLdrh3B8S5b66E1cLGrgR+gHdFvaOGX+JDTbM2EKYN1ZSoiDwTsXtl1zhRsHJwHHDIlEMeGI1kLjERHYu0AeWTiOnylvVfgnhcolnq0T3pG2YwWmL/+5D0R9DJPKQb9iWtLg9kpB+4NgxY2xnIWnwJBuEZbUbSz2shl67ndod1hZebvD0vsjLi/50G9s/DzlAYjW/3PwSb3JS3miVGfnFLn9nD77siXZz5tC8Qb19Nlwtv1g0YU/OuTojBnAMgOcP1FsLDcVN2RiwtXegfgyaqhBcBa7RTd+EXoMkvXHnrFlOBBuuZUKvSz5rwqGMpw+X1aMGDrgeFnSWP3JTvhGedYt/0k1Sfuza5TeXGh8syaTHO30gO7W4IcFqyhYkysFcFTEwRq4YH1CavXUWkJn2WapSxkevtuhNNP4W/FHJBaBCQDlPTJhWUmIfuhzuxrEz0Ff+1IPopXhnQ7YDWmmUGlAia85vxdOWNrhcW1H1Xoo6ptI7YAgvvvGSdC7Ley/+kepp22Qh2e1JIFO3NQYslRRkCj/syyul/vpPxzu54p3WBMYVcqr43hygkxwgLW/mrEEPpWA7oyLmLo+ftQcYfitBnu+sQLrv+iOJDK9lcpX1tm49feY9f+dgsXwZzPg5h7RR4uVH+oZGREl+lrEu9RMYj6y6NvpNbKTpr/lM5vCPk0T0K57F2LHWTdb6F1vEGeBwvd/qgs3MnqhVWkSdOAMBx8JkH7dr3uXMhqIDaGayZ0JZWGljS3oyGax8hO5p0GZ+NKXbuw2mhMFvKwrWTj6GzfruTxzGZj04xKPxmHehG57ewHAO9vyc67NmdniLloN2DwpVAHJj9mVxEl6wOqgj/yyfX09YL2yk0s9w3nNiHbxE13mK2iR+f8feiB5z9ej4mBSCawdM4pIjwnXGWZz0hxE6INEHZx8ve1HsS0yco4Fb2w03Eo4y6ugDuEyTqcZ49nwViTk266jIwhcThhoHEB0rJqMUN6CwIV3VtAfnWoIwxwkH3/gx5IhvSLAefG7xBIvMK5pvUh2tjkNMA98huJFwYyDaEPaQz6oyfQrf8f7dtFw4nelWDbsiUUSYnC87a0q92SyBUjX6lvJBxiHlgF5Zmf4yVHFwW8hKMQCkhRSrAzsWyeDiMwKhvRU2HXMNWzan3M2klVWDwE5R5KtGvZODWgyzEYfYkeutBYyT1GmuMAFsXddBVhWkIfZDLK+T0i5emfyrHP4HNexTd0LvDXOpaRvUP6q6rKJWdfxKLRTcLx3xETvNYJdt33yuZxW7K9Xs5A3HQSPbIV2UOGtlr0Vgb6BL9PEUeaQSANuem1huewNNjK/imnmCl+CFv9eRy1GQEXsSokP7eM01wNqQRhKKtj4PJ2msbPGP644vmMzbcRzqBr8xL/6HFWYnDd6zN0ky6KGjBev0bAcnlavCVwDDS+MvH0aBtp3PhLWGsc1/Ng9n5BfbsQEQlRrdLmlOOxXnP9gBTUN1CG3exK5mn1YHFB5IRHBVGxlrqRFh0yJw49CeqBD1yLAexr0JML1C5Wcq8VZaj1vlFxjYpYa09KzVCcmqLhVhT40PYDdd6yjLuVwBrFUpb5YS/kqyOtgJ9f0exV/r7yzzFpsnhy7D2tbyFI96L9Nur9LRDXi1mO+W0Xuwg++Sxj5wyReFBdcaRmN+sG0xQQtVvJeCKMzlHkifzYJynWt1izgptPyUFs/8aCUua3Vg5uxKE0hA57cv34LAoDXFQtYXuB4/Bkkj0L77ljKQZ40FCnnA7PMICtShhxhuqVSMdBi2B8AX4orkAPpkB5Hfhr6ypbzZbsA0yI096Xz8WhrGDQzzWWCzXqTnu3QDroZ7l/U/vyEEXKkFW7/qpyjHQlJZAPdLcEvX1i8OPafbkklCX9Y5Eo6o90jyOirAY5kmkG6vja0bW/6EMtmW0St2GoQtfU8PUkr6pkcCjuoteJXUCUk+szPRItcWauXQdn82JV0kW2YV25QtAzXb3rz/krVsat40tSNiFTkqXpJTcKwynk7J83Gcao5OZEHL6y/E49a6WceTqBB1AQlOD0iXKxGMqllf2977vY1b6zhHTxscVjLbwpAsQC8FtRcajjLsgiyRZFdMNBD816QvxgyDQxLR3Mlp7hlBTJeP+gw9o+Kq+c0x0Y9FMM8PsbvQx0zewE249SyaHuUSOdSOGyO9wpDrXOmYl+bPF47S4TjEyx3iSJTGJayazhxrrYGio4nDQkT7vxri/qisFGREUcsp+Kx0t/LJ0Dy11+0ue9SjTpCs6LkU2dOTloaH50w44I0p7GQSc34Qagb50fdeafpF32qsYqcsMxZxWQBj1Yq/7Ny/Za4XrLzWMF/dscOzO6ZZCjDiLItO9ixxXlcEnkn+wqo9N9aNhqAMCBiynwH4QJtRVS9YKgKBmEyWG/+g1UIHyffiRZw3X+w+f6ZxWBsQRBUSP+6LZFsg2mNQubkpB6Q7Mq5hkhuO3P9PobKjAkI95151WQWc31dkg1OEkUv+o2OeVRpLPYNeAncyHUCpQ8VdT8d/Re5Dx9sL7SDuAXXMX5ROlMeAQWiEsvES0x4muxx8aFhB7qJjWEapKrXQiSZkPniyEaCCQeQYbU8swtYD8s27VV1pfnoSDUybtZgWxB78mlR9nOe5E3pGGYIirm4r2iJ2yZP/ZaYNkzeKdcS1V478vbhb4+DRH9CC0aEsuNH3JS5vrBbxEp8IOfNR3deLlxTuIRi1gvsaUiV2qrgSpr4FUl11MZn5MgDKomTrzc/YgOhMXw+P2SIp9Tn3J4//IJkVEdODEaVbd7U8d2F/2R3S3t4JfFoRRcUjsn/0RiAU1YQ8uobo+MOcEcSerYSwrVFZG6ukYVkId2yWUadqnIAnQC0oixoKPxZ7Y2gsrNkQaDBZ1VDzMeJl7QcIeOTHAA65lQbXJNXBYbbXDZf8LkLHTFpZuYHvN+1EgbjDOd2tLBkaKkJrDijl2sBWuTmDct51YREjlHvw25BimAfRQNGjPHHUMnJxzCUDnYnBaTGZaJ2AsktoV3DYqd6OpPMgFZkSg7wervhw0dKKYLZZajQVLG7Ifn88jdCdvgTon0b5wQqB9Htu0FWCncyec3Iw9Ol+H5k29BAVHmrObTn17+4L2kc+nGnmfcb3Ja0+m6Cvj8psTo62otB9QjvQrjg5BicoRioeKHMBj2xHY9/aYbNxPPmrbdRT07T+3JOldqytOmDh0W1p0XsJzX4v5sMucE1WC9UjSx25oUhe8B+Iix7Uw/ENy/G5Heq0iZ9e/RvOGNGLfkSyc1tY/uuQL7f81dnQ4yGIzfbMVjyh25WADLyKqwKwM1DwXDVvb84Zi1mGsnlM7L08+RfzaWHbdWUHwL1QXMDzqjSgKdqbLdFqmZBCIseEaahXDLSSIYO9LDulxtvX4TddPwEzNaG2xTvHTlXzX9Ni50Q1J/wGeVVc2UWCHu/FjHZwdGFVVwnkk2gDbT77vo7LATey9nmL0fTNzlSbGjyF3AeMjrKcM42tlEbSoRGxt7OS66xQOOjDZCbEDbJQkFqYXO1dfnP4d6cHN0PCM4/lWt7HNAOsF4t9oApQRmZyhKlQ+Kvt6ej+vWcD7vRF38wvvTxwb/SNXkP3fn34W4IEZw1TrdzmFdBbbTmyFchh05/yXAVqqmvljMTL+OWIid1ZlM1JaTjw47RBi0W3eAFAepVncWdA6WRWwMGoewaoyBpUfQjgHDWey3T3Lc1sQb4IddfwG3RkoekI4t3T2zd6tk0Q2QpntQvX6mSzdkvx1zIrQjbFV8jZEecO3u97Z6o8Ijx4Dp6ITjEWuDz8XgIuwgdEzInV6GwJXZc6Ln+kfFDI0V2oV+fz9t1R9TPz5/ivZI7L3Z6tHv0lkF043HP6ClQA8jUSW9r38QnW36VQdFPjoBvqzYPXmj5yjGJroSOIU1IgIczGhf/lVgewCrLA2LJ+y06YSoteceKJoMS85yKQvfIqew69g4YE6ZDjE86JTXARGqzpTBN5zAXUKpdyzy9UL8jqQNDW4pxjTF51EQ6H/jDxmRt+lgyquJ+LlGu/hPsdCYJoIzvlS+3R2XFOtguikv/rzurYg2pnED4th07sN0n+FNtMfAAT7Ae3Z6wHhxjuOwmgSQ5rbXNdQoNq2gy0fp+ErLZ2qE39tMDhUl95pViFrztG1OdX0qTisDpAnYhYEqXe3atNmUOLVbZImuU4mT3EZIs7SU6xwEHZLkgzshbxAMYxpCirA0ykhhkl/9l3jORKXvyWSTfgfORWQAlIkD7xVFlJd320gDHPT68d+ZBKxrQNeSbezhbQiJAbaxejoGXVm6uFyFiqQQzPlKTZKXOd+rAkEZAG51jqFMFfRKCDt6YnUF+9/yPN0tJ4OdfRkxF9xuFc1hLPjzzHNzBBiBFLyPneM1b4WXt9rVvvsyL482CBIOqZolP/6XMAFE1c+Lta2P20RsExc/jnsHwLOpk12X257sDs9EEMw1kfeVTph/gnjOZ58nQdfuD4FTFnyd61XGSjOI/cOk3vBEIH3CQle1jf3aCrP+/n5JJv/Py4uBCGPocs/f6F2Mx/dum4vqrgABWPl6Y+Rx1/YgkA/P8adG8VNbQTLPlI1EnxbYBeVnUGnh1KEXKE2s3mMtsGt/YYZC9ZplipDOwlyEXx7ewATFqJSbt0UJvu6E2FXqUtMkGAV2s5JaIWr6fWyoG619LMUEootzyfM+UrdTl+Wu4PL6/NUlft20Ha+LTbDQjb50x8dCpJtUZ0XHRXopyO94OC7EmeVtZBcwkP7Kbfs9JXUsEwP3KJtKgJT3tNzUO+ygCgZFIycSAGSwhJ/a4q7Z04SoITP6O7S6oJcAj2MLsx2tYKyR0SQuXIDnneB802NDSwiQsBHF2jpqbHWH3NUj6QRSGMyUYI2EtPh0RAMKvK2M/YeGevVtZxBmT5j0hOlXGa0slSFTrnQutjxtYbdJiAvru1JjW8qOsJocbfkEuM/3ULxd3EwopY0pwiKcz5G6I6GbPJEkV6nDZpzBdydjj+vir6kqxjfhsDBSKtPbj+CahIhWJRjcroQG+MsB3N4rnSlARiZEpTEn4NUFKgPNaJ+vw1muHZeVEd+LfNzvvGsgIHsRtV60Cyk/4yWQvvcebT9Mg1waDqsdqxZAwRvKKFjAcN/eXvjefo4vNvD2SlqgaYeUq2soD8FyibOGbUDaavbmd+ZY45ukZpvIwlQ/8hzeI76xxjHGLDNcmeAotJCXnIKvviPSN54ZNHTnSLy2wfQfDnoBxFpOPJoT5J4QrVUmgdEkeIOQuTBcLDIGGKp05M8Lj8waNdnDBec2in4DhouuyCRx7oZxSYkJY8QXlXgW+tA6zoKvg9N9DwltkKorJaeZ/gzKCNC/ZgYTfE8jzjHGX3tEwhCaWDYEnBt98A+2tL9F7I8+fzkPb6rF+rpTFRTBxxHJRguNoRCfRXs0pFMOuGFwd1DsGbwt+IX4wX5OvI2FXdqpzhdLktmvNGco2Ng5dIqTdO1SXKCfbWja0BAJGYy+Wsc1sJqjTImzLLqgviweFFk98IVRHTqYgMdh1RcHe+SLwz3hWZeSMwVysMDUu663wKoFY4e1RcIykGoAkmktSksawCbfKzEUL7DO2derXHwQZx173VOYTAmQvEJbpEaejL/bdcJjefkyQWzL8tIAlnuB+8Jlf32eS7/9GPawv1DZh/yRigZwhm3BPHnCJSDbcuKUlWA4BSfNEQYXBVsuQl/agvgxZCzhFJt0EgG49a2EHTdqZRzkDfCJAxb2tO3yFHZE18aRPgvj6yvkG1bE6u0uGayU5ok5gVkCjhV2k9iPQlWmh2bL26n/IIdIBwuXzha53ZbHOSQXgpF0EpRAubrDsoimnyUNUJmxvLQOAFq5qMPAmcuFgX0nHZSd57m/BlT2ZXgBUTuUYsfOxbU8WpaGzsvGBu2BSiWFBYkcf8YNVTs+g8tPWVUpJMq4UVvJ3nmnZ8yAxmZPPdtJQCw3X5kWZ3wQ317Jt++qkm0GNBwkAi4BYvRIqt8ozD0jCyS97BkUyzGO9LosMm0Oa/psJwulN/6oOi1d5WGPycnNXMr/A2pj/mxl9UZamHxgHW+xGh6wmNkc+UhxkCT/TD3iww2Yu7JIGbO38iJyenEFhK6GaksF0i/BK0Jzd6XFGUX+XHZchqmlI4+cENThGP+zuxb7whCsugXc/MKA4HtFGBvIPZvUMRfftWzz1YJ/qV1NmioB9Fneps9VpRNtw1yfPw+GXK8lZfXdR+M/CcdzpNfq4+tvFvDx3UwXig5moZRshhg2ORXjRtRwIjMGlJnkhwsubPpG1ApMcHSm0Pf9yma2lqZR77b7KsvowBZwy449AodOr34V7Ixb/8hSISVB+zSlxHyDwGCc6WTurMnkZ6SgYC0Ul/aBV2b/bEWsuMGdG6xE6cZSDdKtfRX2lqLzttB5F+DHhHNTu7JF/XU16Q1NUJ5eZey6Ij2gGXXZQsmObj34494D0r8Hr+D6gPEMfqhnJC2CsGF1ydVOZSuL7je92Vd8S5XBI6vSkOH9aUMoTppQ+5ttonTgEcrpegVIvdG/eRBe1y0nD6XnFo/wRwU2mPQ6YFetmChFtJHqECH2VMfePFeImLeILK5x9Se0Uy5mkiM/vjA7xF5d5APvllD1CmUqA9ecl8QOEnC6OuUmbQMrkZjYBOlkeKfAbxrH1zWn0ppLos7MrzOmQGA02X7Djq59M6QqeYyVB+vhVH/Jt2cXbD+Wu18/hpDfYrH7E+aXIKoes2o4n7NpC4x59YSgUObRsXp0A4eCMluU9D6+MhK5Cmb9u9u4h6ofEbJyNiyyT9P07nmsHSfJLevafklxhOsjr68NaiEi45nMU2IcyrF9nGLgDqg9uTyKd2A9Utmb58z/0Txud6CNDybzHRTgRIEQILSIEyksp/SfQTAjRxrNiqGyfk+g16s8e4QsG8wHtpTcwyVI5rE4KHVgF5IRBd7EJcdKG+W0EAbuYDyglzMPjGLGHRFg9jXWR60ZFZgRqLbWDmuuOYT4GKC7JYmUqJdxpAMRYehres3Cj+PWMgViYeGDBbjheVgUvbZ2Ojhb9Af5QHDyUO7QhuyFvEPslHjWgnbXMEDpQTwULI2YYMLUaxoz2wH/TKC5JNaa1oFd6IxCc4mPJEp1AmH/5GAYqGbL0eip32+NmyS1VnfYwc4JC9XBXXE4RpmN1ztP4NsVFxQc5nS3Lboe84vXaddOlQD2NCGkbSGUhHa2dFwSZdYkSqlDQdBJeNLSExIJQX+rpBNNWw8cCJd5IbI6/RyTjcujGNg4hiNeXgiKIcMfslPVTYW2rs9FEu6YOH1Nex00EWEp/LT7zdrOdiEmW5Qwx2oq78kbsXl8lzjbiSqr9QMcpP6tJCWyVZIVz8ZdJbvM41F343OM5sWIa4nevJ1YMcMPF3bGWqvlwGDNtZu+1DKBYTDTlZBQlnP8Y73HwSC7QJWEDMhvNAJpN2rCI9lodFGDVJgUMqYVrGZGVa3o5UG7htyryCGwZIzRrAjlberqiym8WlUTEOmlIOcfn+p3Y4fj8vYwami8NOLr1zj2Xk9t2B9swger0txorgM6ZEwugB6WBNGQQN6nlUWOPwEU7xv/gWAenK6euUh9qba+AV8TVRQwCXo6d5dmugcJb8bT/9b0nm+ncEc98LNpWD/0vDAgjZr22azNxQBSAOQvIwk/cyUGUiHdZu6H8AplM3jjVC79UHXUMYUeMeRYDCfvIaesUNpJ7+qqJFXWxd5D8eEVhuQz/dSDj+Lj0l+MfJyJRhC5noGZeAW1joeSCxHyAVXi29C1rTIbKFL9sRf6QVapM/E+CA7QVt2yt+ChONFVEKmcX/hlmb/mit8cG/hXlW3UqfKes/ZBB8p4c9MoGyMKQBIm3lfYF4LgEyfYGjc7cF22pgXqb/nfLniMPWDMv5h6PZo63fbNlUdyJ1V2nD1edw69A4uUh3P3TORt2jRokLrJkUP2J0VZNv1ZKql2mdMW40IYlUf78gqa3sy3P3Srr+UpxK+Jv7F0bKFuwq+DF+1eqmtntlzuQOQ8fKr0HHkgmUN2Z5Sie3piLoLRBfEoQwNLWMRgxX+I3DnGDGnXk7DpaagStsoQATnc4MDy8q9Xw3wUAf5x/sD4InhwuIiSQGGVNJ7n7qBx8lF2hTkE1IC3+2ToPamW0rSujERvCNCeFVqK9QXeHKGGzlxLsh4PncJbVJrYfkUhrUcyZHaLuMX4Lq3wZWvnDKMgmS44pC8qBMxo6YcDMxAAZh/wnsGlBzhEXxAW7/acm4Fg1L6rhW3fzpI+20bus2HYQHsHpSombzERgfvBzEFAl7xL+dyhCY5E3ip9Fob2YZPNceLJHufoo/mLh4gsoLtg2++SjNrvDfeYfIBcrQBQ5EoHBArbKjfMC3/i9YwpMdSk+4dZVmGbP/BpfY2GEw3t6NcaoeG3MvtVjg3B/70tFB5JCyBqNA/I20szOZPyu1zrwqrrWlLExxiMrVtFAhM8WCJ1DoLAPDl9Y8llMrUVPq+K3npFjXi9Lh/M0SobHcC8nWF68G2X5R/9zBx9n6k1HmuyvbC2psJYc/xJceeT/E7zWmAG8zZItsqIF8wNf+wEjPN1ORSWwoXr/+u0ACV6F3QqKORtuveE/eb7z1jBHOg/VUBHOVB0SQRa8PbFIydhdYsMNoFyFtSqHgkv+7Gsvq3V1tPooWfafjp2oHiiD9i24MgbwLmlzsMrfEzUQifR4JF6tiTlVdz1LSey5QqpVGyKgMIWPKIO9xTNlLFYElE2Y+LDIGheqHvJRUXgoFn+z6siutyJXx6VzW/EAao1+yV3rGofUyYfZwOqMBxPDNGEJMwhilKLF0FANMFrQfX7j6EUCtcKcJfhzuvAsqR57Wgzkj0L0WmOlrhQMnIYeecxfFtmMFbEy62YJxpEIhpQ8m5afveJXjk009K7qxW3nF6AT9VQMkcXEVcbFarzhXHlVuMD1Jb6K8ZCwxW3g2bz556SoysvylBS0zKcL1YabncB6K+Tub+/9QfoPzNLz1k7EcNioqeRWSAZ8XTW9W3gK6l9zEBCnzmB4M7wBBVkbzr3Ol2zpu4ous/+FbW68l/BTsS2e3u1yeoZAwVU1t6bNGK0al3JisxeHaSIJr3rtBlGGnWvhVFDn2YBy248NFi/Odafe3dtMJYhH/atQS3GfBacZPnDejvczoWZt8U9DEgR4XUTdTil0WPlIBy39JdUL0tCdOfuifRZovGT+dCoopYmpw49gAMdHOouSs5Lqe41e2UxEN8lDdd5w804GetEMjrUaVfwX3U0Lj/7fmRMSySh3XfOE9m1cH26uLskQT3QHttdLlnj5EBuUEvRotgOtXBXl/n6NytWD/qj3WqXjjKmMOyjTepdhZ6JCvkz3VnZKdHB8IQzwQv540Vx2TX0Po0ya7sBOib+ocmsBZp4HFitPEy8m3vKf2gH6PcUDy9+ozG6r85ZD9l3UtD9IEWTlAwGwz/HWWcu4ur4t7EAzWL2bscbUweW7kRJByCQy42zy5bUwovgE3SkbmmRqt7/WnaY0rTKV2nX7q03zBLyhxiX/zcry94UtaB5PVsWBg8Mqv/FYo+tc6LBBTHm0Wt3aYrR2ld8pswKLWz2N78LC00JYcWRCltlOLWBW2QU/4VIJqskydMhbHWUNNSQiLHkKLSwDMlJW/w1zqhr2eCrtBVuExjqsAQN9+VbD5kyiOjquBCJDxiGu47zZdasDVjl/XTZJaTcsrE4fyoqi1pKIc8zB4eFPPywsbyTlUDy2HK5ASgyY7dmrDEkpHqIAdYhR139Yy4F9FzBgsatMs247RInOKTwj4OxVIbppEOzvgYXOZn3xcH7m38DBoj44EtHyql0QNPwct3iICH8nebDULEE5VeZ/t944ULLtxxlNXIv5WKvubJjz98aNSIJkvcvjwIGmTRtbNvdBA92e1OA/av2USn512vvssSive9whH6G1yYphdTKgIsIpabwr1c3aQiBoXrnUfyXjQTyVHEohDMmTVH11V6WTiZcJ1IsY2A7TUG/bfDV6Wo5ZRyijWceV2BQV/0jrIava3MboNAhikavmhyaxR1K+fVlWK9hMqTyMh3VtclaerKl0NudJO/W7ptCUVGkAKVZ2qSNFRFai7QDXd9kkEJz5npDxGbM2AefFZKeMe7SfhXTZOUcR7LMovpW3Nh+GwpM/VyyUc/pLQXA48Q3f31EpJbObV73N3du/4hAy+bRBqxACP8q+bRRFVmVXYyK6BwXBXm2XEpq72SNnL59r5UW2Q6SV0SR0nn+hxv/Bj7zqYqQL1XJiX/g1gXKvI3JEsErtk3j+oSZj5P2jEqY70IdoHF5BxXdrs2Khzuh66GkLaZdcZ1JXcu47dzSyGbMGInt9D83luSpQ0RNPmX4XSEQfNnZa9fnU4zyQh2MhwH+nL51JOLC9OBtndZYFzhZnwqsriHCRgW8zJG+U5dT9CFZk7l8ODZ0sKlC0QxJQ/zBDxYOi3e2U9/+RE99KEF6ugk6Lw8H/I2hyx1++SpS3DWOYpKJLlNZUOaC1b8OY3qEduAYNGjMPSFwlM+O2yQ9MJEto0OlsAAokikFNB4FOuJRp+GmOGgLoTgZsJ/5RbYf+jpNhSSi056/aDdQu0v6pX5Y6lGCwPmaEgJkPDU6K/TzqVz1HUhEIYJxRVoVNa0QtsahEnJP/AXO2+TPRQU820+h41O735a1toP+kZ9r1VasEUrm9xJV4R59cmnm7vbRE9Cz1jqzMSA5rlRzct/Gl+U5RnMtenX557OlmmVl8faB8SNJVhMd/xBvETzfQ21LKixgMaE7q2llQyajMKciiMrDDGOgZvu7MYiDceTmgzHidInD+UZwU1HV/OfcCcbT4mpeMObrmTqVvjqI7rX9TBCd1fCNF/u2CTIS+E0++OZF0jZjEEesY0XhdYGTEs9LBqy13rR1xksQRIUfjB1SRlgUtbpG7/jpY2cv/pDHbpyQ3iJOfijCKg6s595xRUtH3JgZI5d6fqDbsN8nmq84v+zJ5E92TjI20g4Hc5hpFllF7mq0oWGQudiqZD4ZXPnDeqWO7cGaPWGBhcnCXrsaZpTwRo7lbnjVbV4QucrwATilJfpDGyZh/He6JOxJtUkNRFxF6aH1rRkccCQeFPwLolwFUwKflcjzrXr510U4DvMsEPp7yktaF159kDNpG59Ig7BuJBDgiyVcjtsby75c/8IGNXGNoiPdjGn9eCgI7Y/m0JUwSUUYDtD+ohBG44saZeNeD1x4t8ZWsfI70QpdelEhRyIR7reOcilo0/5J5f3C35G6490Dfg5BqiJ/q6j+9tdDjTHNv5v8+SasfkyiwCrPa/hqyq/Wj5tvpnxPDHGe4fb/9taYbCbBcw/Mr+/otl7I+ok5Mz1/6+nm7YSO6OXcS/cDra4F/pl0mLCb83iTcj9O4OLUpVLa3tJjOXOdbsrTcPy24l5iKsWM92MyasX5CPaTA1MY4YkfckS7yM5cacd12Z9NN+gVKBoCobWmDgvoX3yvBGxBst7Kl/wFwPql9TGPCnkFDfXmYZnaE5+nmVKfp9WJw+M0AA/6Lk1992fu7Ul1ZjzNAdvUYKwve/urY0aWP2Mce9SYM4AcX8kPIqxbWKxLa+sIfE7dKjLsM0MwnGTQnDgF3PlaObNfNr8pfzxXIekRSi22YhMGIwYcwmZDMXuzIQIqT9xqLU8ZvR9NdJrbQBb7jQrRdkO58HMEUHPLakKKDwgIAcSOnZIMtswPAm9bmzWhQmpTM27hvyrvSJ/Erf1Bv3BRQOTmHUdF+pScTYupEk1dpEeKdws675phLe78Ww+9hcT0ZdJe3gVIw+PV8HUV1SaU3L9HRFnAL5fAYbxzT1uvh6Z1uBkclnNNHKnoxHjM56g8XmkseVTE+E5tamWRxrTf0XeaQhv3kf97XqN0QhqAZ2PeEzUbFj3gkd0gkiAZsbCsQnL0anE3mCvv5fRrS1crnjL+eLj9U2Pevt3LxdcpLO2fv4BQQgmGHic0e2PmVDqino7Wqy6xjRqlbPuI9mCevr3QJkRKZ4hPb9SW0SxZn5Vm/vscORIscGifRmOrzfDTIgZTrhRyiMsT+YCfFT9bd/EStnislkcOndJOXbc/CXouzq74ewdsjg/XRmy7arKGkK52aeMIBB13DkbkjBV82nhEhC9KuoWWf7PA3n/WFmEl+wFkjfni9bylziZ6SjI7GlWX3P/wvr6EP/0Khpz12yhHjTLRt3DSUrQEKKj0a3g37Guj63GOR99WWy6/Jr2GEe0/DkLMUzNWgqJuD34rKSCXX84tQFJEZH7ELC4b7uTh0pfpnhhR/nE4W0I4l3Fh26xmdmFhI5QQwLp2Gz2MSI2s5v+mb+k8r7JYCBMcI/2HXB68VBiPGubCK9hH0ws7VawvIgyMtCD4190lCO7sHgItJ8McbQdHBdl5xXEegNDemoK8EX7Ecp24M7CPzEV6rubtFX7/ShrSOCJO9pNNtQcw3d1yk+urcUl7Ss4DjUrkCmNqrh+Tajh+rvFSzQWr9Zi8GoD6A9Xw16ZXMUpwleYqa89N6TPtOmQyS+3LFrrHNWM8gOqqUtkO44HgbkqYx7K7Raq0WIuGm77BgShTNRULBK7mGCn2BWjpX9uUMED1dodtd00jRLIrrjtyaYvAjuTXNjiTTiF+jvAYwRf33MXsdoL8qAZdPm3RHi3nO9ZqQBWJqpbcuiPhDwWXb3UbdSuRIYGunbbbrVa/8ihWfgG6GjuBT6Kg+Yfza6kb+4ez16ZGRjfLv8eWIST4lvCLEu9yE6B4foi3CLA/oJZUhT/nDQLZv/JDglkjXQROizoLq//V9DIZUoLZnmFKt6uDHH2CRDMc8En9O/4KiFRhPTA2bQRHC0kgvKVM0GP2o3l200ehccXrUSzsYE84yHbxtr0jPUHMhKIjPoQ3XXEx2Uh8lNV0nyMZUiYH4hS5SBp+WvAS3suQdUflQMHZIz0kozsLAlvFc86x3pbglt8yVGssBv0Ieb/MgG8KpHtS2cDTV5Y7yv28ftZQfNnUZhhGshfpJsjZpPxaogVk/pagw6NurO2VXFjMgKqUls6jJV5QS2dOiPpT6jex/mk8nheEGKzyREniC++LrUBNItwoT7is7WvrDaDIOvxjHA7usk0DMZld7x2yiv+EfdFa8i4hlVm6Pp5ZvfyBNntNZciWwXN+30j4UdqWIFzmuzn1fD2av+qYyfl6qbYXzKQP8PSnZKYSJmTdG3ovFR4tYPDBWgUTV2hV/7UtGpPOnL/4drdEO7q/XS2RrsfiavcTAte403rfRrYjhi0X7SNl2HGXouvgZTlGzlzX4y+sFc0ofRjzaNe59RLGpXRUw/Xf9If90LkUcwQQREmBidFfIefUhJObNFOy76pz15Svfh3FV+XkX3S5aLXnSBwCJxPlbXdWYLEXB8yRfPzIMOOt6wsPYzPEeQPpF0viBOJLwbnBzFD5/us3aDYXgyfE0ZEKIAW08PLNZ0pwiDGD6EJX/XmUrUJvfobc7sTLzzj5eItoubgZE3h0ndalSAuo4MEDHPr5g6PLewokvL5U3dgsYOHme+6HHRgmvLW8+fRD95kTrHpgQei1rRg8EG6bu5dk7XTYKgG5cq0g2Gc5c6wYF4i7a91uP1CohJ95lsZvPFFX7PfN68TiQy5SxeOKgNZW3QPQ2UYurFHrR2ZMTdnloBfhoBRqsFMyz3f01+ORaTL6vC9omYxw7Z+e3pb7VI1rluMA6k93MGsBGYbfwCphea7bR5Vvasv7Ym5ZFhbzXjNw1zHNV+Vw2Rjkpx/01SoRV/dSkwMcKqPw224S2eYEpdu2bql3Q9CEPGbbnXlF/F+Zan+EcH9y4i29B30ey0zgyoPlFNskEEggh7CXD+1wQbf+boOsktwgQtNmOE0/KFSzrBNh3IP6bUf5jEOPHrulpe/4wLpX8nXHvJykBOkAJv0kBS89vESOmOEKUxEpIKnWxhWWiQYVg1jlz+Ejo8Vt1PoeHHPpYXkqVe50whttWUDtGgn/Fusfk7UB7IXnJWdsboq2h+nZSrOUc2qVSvqg+bBIjzjcydYOqcGM1VZjUkllrdt1ZP237CXleluTihHCOsfHOLzmGN9UUP5MPVZW8hArL+osg7NYMjdQ3AA1YCNoZDVKuvQEuSfth609/OloAEp67kUDblVepbRXBLX0RQJpz7adpo9sNyDZmS2K3a/t5zuYc8ZJCYMOKKwEMtS8a5i+CyFZw8/xkTePitxDU3xYkQxfOT8AH0+a2t7fq4WfRxh2b5vtW6Pns3MbvYim7rTyfEnk3HYCmMEveT33C8P1/ZIiR/IusiQu2zHGpsBM2o2GtyF+ZkChGO9rhGmyT9S3awg9YhlRByzbCQsy+V73jCH3enMJqfJ3fjeQzrxm/i2qe5U1wWtmzA+5PSKyZndTXNZz+ZYMmr4wp7eUJD45Uzs3AcNJfe4i2EnJUREO7xgFTCYRrK+NuHCbGBgJEBiWNusNcv2Q9JsDiWtoiP7l7b7tBZuQBs42MyHnfY2qJTb4sUZJaX8TV1LWZ7JtIA8UQ6xxDW4idMxo6A8zTa2i0CZKm5/bVOx85THDPtW/6Z2XHWFl7jtlRKkkR3ocdfvW0PRE061lWiInixuyWFWf2/qQxQKfdVcQmVGxLnVPVikC7RCaPwFqBOu3fhzRBqLyNhZJEqZ8j3ytcgQUqxEW0b7q3f3ITtWOjknDKR0Cmm5bU+HXhfBMYSzYYD7eeKmcfQKxq6/x3iK5TqgnJ2/YzmUKngkup6lg9OU4tHTvSOTRZrALr0BQo+iBo8/zfaOAR77fEQmMOFbKiKZqAA2NYNu9dNsjA/PW30IFJiGyPJqN+4GTpe3Bu6MMYUVL/WcsNpI2kRbriZgO+32JM18D18uIwcdn1s4m5FmsuOeIVxH59Em+uzv50ET0+Vfhmzz40NlKkHp4cscfrsAkm8U5B1Pm5xuDJopaygN6zDRoMwhFpsfsE8Cab4Ez5jcjBhKYMUgQvBrbm0Gs2+hxhZrPe1II+pQpOqmHv9h9CZRBK1ISK74ML9kNTuFx6EDbKl7D7MVpbNMvyzW5b2ZPNo7T+WGL/BtNDRGwo7REQzfryicrjyh3KpiOO73xxztWDk1c1kxgL6HaebVQ9APbZd7yWXINbS4SmDHkgqt514DkGR8UI3rA7AyZSVLXzlFzvnmNgsWt/OAebdZ118t3bALWyen3piHTcmTFRjT0MbISvBUGjuqmHWOteorUuT5+kC/tLRusyABEGwy9KspQeJ3Eg9y6PrkPpMr2fQq8PBhNF9RmOID8Ec1Kyb2QiaIre8Rki/i6Jgyz6TSHxtptvTNsXULfBtLP6DiuibFZ4BU1Y7B4ieFoGDVHVlzIir9Ul8L77lW89piqrnvkgY+POOR8hJoygNGK0kklxGEsqIT0IsdCmERDZzvla9u1eI58IfHkoPTpVC63i0UaM3vWTIOfdRpgT/aebAsIDP+w8pL68iAATBiaNuGJlCqL9iAAABhXodoUAAAA="}));

})();

/* STARDUSTLC_UPDATE_CLIENT_BODY_END */
})();
