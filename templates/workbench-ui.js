// Email-specific layout around the primitives shared by the Harness Web shell.
function createWorkbenchUI(React, require) {
  const h = React.createElement;
  const { useId, useState } = React;
  const { clsx, ui, styleKit } = emailUi;
  const {
    DSH_STYLES,
    DSH_STYLE_STORAGE_KEY,
    DSH_STYLE_EVENT,
    DSH_ICON_PATHS,
    useDshStyle,
    readDshStyle,
    writeDshStyle,
    subscribeDshStyle,
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
      className: clsx(ui.button, variant === 'primary' && ui.primary, variant === 'outline' && ui.outline, variant === 'danger' && ui.danger, className),
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
  function CoachmarkTour({ rootRef, steps = [], step = 0, manual = false, style = 'harness', lang = 'zh', layout: rawLayout, setLayout, onStep, onClose, onCopyPrompt }) {
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
      function measure() {
        const scope = rootRef?.current || (typeof document !== 'undefined' ? document : null);
        if (!scope || typeof scope.querySelector !== 'function') return;
        const target = (current.selector && scope.querySelector(current.selector))
          || (current.fallback && scope.querySelector(current.fallback))
          || null;
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

    return h('section', { ref: rootRef, className: clsx(ui.page, !workbench && ui.embedded, className), 'data-dsh-style': style },
      h('header', { className: ui.pageHeader },
        h('h1', { className: ui.title }, h('span', { className: ui.brand }, h(Icon, { name: 'mail' })), title),
        navigation,
        h('div', { className: ui.headerActions },
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
          h(StyleSwitcher, { style, onChange: setStyle, lang, compact: true }),
          actions)),
      h('div', { className: ui.pageBody, 'data-show-updates': showUpdates }, children),
      hasTour && tour.open ? h(CoachmarkTour, {
        rootRef,
        steps: tourSteps,
        step: tour.step,
        manual: tour.manual,
        style,
        lang,
        layout: tourLayout,
        setLayout: setTourLayout,
        onStep: (next, isManual) => setTour({ open: true, step: next, manual: Boolean(isManual) }),
        onClose: closeTour,
        onCopyPrompt: onTourCopyPrompt,
      }) : null);
  }
  function Tabs({ items, value, onChange, label, id }) {
    function onKeyDown(event, index) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + step + items.length) % items.length;
      onChange(items[next].id);
      event.currentTarget.parentElement?.querySelectorAll('[role=tab]')[next]?.focus();
    }
    return h('div', { className: ui.tabs, role: 'tablist', 'aria-label': label }, items.map((item, index) =>
      h(Button, { variant: 'ghost', key: item.id, className: ui.tab, role: 'tab', id: id + '-tab-' + item.id,
        'aria-controls': id + '-panel-' + item.id, 'aria-selected': item.id === value, tabIndex: item.id === value ? 0 : -1,
        onClick: () => onChange(item.id), onKeyDown: event => onKeyDown(event, index) }, item.label)));
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
    const P = primitives();
    const selected = items.find(item => item.id === value);
    return h(P.Menu, {
      open: open && !disabled, selectedId: value, dshStyle: style, items, align, portal: !P.isFallback, autoFocus: true, minWidthFromAnchor: true,
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
    const titleId = typeof useId === 'function' ? useId() : 'dsh-email-dialog-title';
    const P = primitives();
    const close = () => { if (!busy) onClose(); };
    return h(P.Modal, { open: true, headless: true, title, onClose: close, backdropBlur: false, className: clsx(ui.dialog, className) },
      h('div', { ref: createOverlaySyncRef(style), className: ui.dialogFrame, 'data-dsh-style': style, 'data-window-drag-exclude': '' },
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
  return {
    Button, IconButton, Input, Checkbox, Icon, Page, Tabs, Status, Empty,
    ChoiceMenu, SettingsChoice, Dialog, StyleSwitcher, CoachmarkTour, register, primitives,
    styles: DSH_STYLES, styleKey: DSH_STYLE_STORAGE_KEY, styleEvent: DSH_STYLE_EVENT,
    useStyle: () => useDshStyle(React), readStyle: readDshStyle, writeStyle: writeDshStyle, subscribeStyle: subscribeDshStyle,
  };
}
