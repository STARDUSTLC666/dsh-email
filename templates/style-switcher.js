/**
 * DeepSeek Harness (>=0.2.2-rc.3) Unified Style Switcher, Layout & Motion Primitives v3
 * Shared across STARDUSTLC666 workbench plugins:
 *   dsh-email, dsh-calendar, dsh-cite, dsh-dream, dsh-code-security,
 *   dsh-rss, dsh-ppt, dsh-remotion, dsh-hyperframes
 *
 * Zero external runtime imports: accepts `React` and optional `require` so this
 * module can be bundled via esbuild IIFE or inlined into classic DSH client
 * scripts without requiring `react` in plugin `node_modules` or triggering
 * eager UI `require()` calls during `window.__ModuleLoader__.load`.
 */

export const DSH_STYLE_STORAGE_KEY = 'dsh-stardust:ui-style';
export const DSH_STYLE_EVENT = 'dsh-stardust-style';
export const DSH_DEFAULT_STYLE = 'harness';

export const DSH_FONT_STORAGE_KEY = 'dsh-stardust:ui-font';
export const DSH_FONT_EVENT = 'dsh-stardust-font';
export const DSH_DEFAULT_FONT = 'arcade';

export const DSH_FONTS = Object.freeze([
  Object.freeze({
    id: 'arcade',
    zh: '幼圆等宽（默认）',
    zhShort: '幼圆',
    en: 'YouYuan Mono (Default)',
    enShort: 'YouYuan',
  }),
  Object.freeze({
    id: 'auto',
    zh: '跟随风格专属字',
    zhShort: '专属字',
    en: 'Match Style Font',
    enShort: 'Style Font',
  }),
  Object.freeze({
    id: 'songkai',
    zh: '中宋+楷书',
    zhShort: '中宋楷',
    en: 'Song + Kai',
    enShort: 'Song+Kai',
  }),
  Object.freeze({
    id: 'fangsong',
    zh: '工程仿宋',
    zhShort: '仿宋',
    en: 'Blueprint FangSong',
    enShort: 'FangSong',
  }),
  Object.freeze({
    id: 'poster',
    zh: '重磅画报黑',
    zhShort: '画报黑',
    en: 'Poster Sans',
    enShort: 'Poster',
  }),
  Object.freeze({
    id: 'retro98',
    zh: '千禧新宋',
    zhShort: '新宋98',
    en: 'Retro 98 SimSun',
    enShort: 'Retro 98',
  }),
  Object.freeze({
    id: 'serif',
    zh: '思源书宋',
    zhShort: '书宋',
    en: 'Book Serif',
    enShort: 'Serif',
  }),
  Object.freeze({
    id: 'modern',
    zh: '现代思源黑',
    zhShort: '思源黑',
    en: 'Modern Sans',
    enShort: 'Modern',
  }),
]);

export const DSH_STYLES = Object.freeze([
  Object.freeze({
    id: 'harness',
    zh: '原生清透',
    zhShort: '原生',
    en: 'Native Airy',
    enShort: 'Native',
    swatch: '#4176e6',
    surface: '#f8fafc',
  }),
  Object.freeze({
    id: 'cream',
    zh: '米白纸感',
    zhShort: '米白色',
    en: 'Warm Cream',
    enShort: 'Cream',
    swatch: '#9e5829',
    surface: '#faf7f0',
  }),
  Object.freeze({
    id: 'claude',
    zh: 'Claude 暖书卷',
    zhShort: 'Claude风',
    en: 'Claude Warmth',
    enShort: 'Claude',
    swatch: '#c96442',
    surface: '#f5f4ed',
  }),
  Object.freeze({
    id: 'pixel8bit',
    zh: '8-Bit 掌机',
    zhShort: '8-Bit',
    en: 'Bright 8-Bit',
    enShort: '8-Bit',
    swatch: '#2e7d5b',
    surface: '#f4f6e8',
  }),
  Object.freeze({
    id: 'mint',
    zh: '晴空薄荷',
    zhShort: '薄荷',
    en: 'Airy Mint',
    enShort: 'Mint',
    swatch: '#0f766e',
    surface: '#f5fafb',
  }),
  Object.freeze({
    id: 'glass',
    zh: '晴昼琉璃',
    zhShort: '琉璃',
    en: 'Daylight Glass',
    enShort: 'Glass',
    swatch: '#4f6df5',
    surface: '#f3f7ff',
  }),
  Object.freeze({
    id: 'eink',
    zh: '护眼墨水屏',
    zhShort: '墨水屏',
    en: 'E-Ink Paper',
    enShort: 'E-Ink',
    swatch: '#171716',
    surface: '#f2f1ec',
  }),
  Object.freeze({
    id: 'blueprint',
    zh: '工程晒图',
    zhShort: '晒图',
    en: 'Blueprint',
    enShort: 'Blueprint',
    swatch: '#0d3b66',
    surface: '#eaf3fb',
  }),
  Object.freeze({
    id: 'risograph',
    zh: '波普孔版',
    zhShort: '孔版',
    en: 'Riso Zine',
    enShort: 'Riso',
    swatch: '#ff3e7f',
    surface: '#faf6ee',
  }),
  Object.freeze({
    id: 'win98',
    zh: '千禧复古',
    zhShort: '复古98',
    en: 'Retro 98',
    enShort: 'Retro 98',
    swatch: '#1b4f9c',
    surface: '#dcdcdc',
  }),
  Object.freeze({
    id: 'songhui',
    zh: '宋韵朱砂',
    zhShort: '宋韵',
    en: 'Song Xuan',
    enShort: 'Song',
    swatch: '#b83b2a',
    surface: '#f7f3e8',
  }),
  Object.freeze({
    id: 'frutiger',
    zh: '晴空水晶',
    zhShort: '水晶',
    en: 'Aqua Gloss',
    enShort: 'Aqua',
    swatch: '#0ea5e9',
    surface: '#eaf7ff',
  }),
  Object.freeze({
    id: 'gazette',
    zh: '铅字晨报',
    zhShort: '晨报',
    en: 'Gazette',
    enShort: 'Gazette',
    swatch: '#9b1c1c',
    surface: '#f6f3ec',
  }),
]);

const VALID_STYLE_IDS = new Set(DSH_STYLES.map(preset => preset.id));
const VALID_FONT_IDS = new Set(DSH_FONTS.map(preset => preset.id));

function resolveWindow(win) {
  if (win && typeof win === 'object') return win;
  return typeof window !== 'undefined' ? window : null;
}

function resolveReact(explicitReact) {
  if (explicitReact && typeof explicitReact.createElement === 'function') return explicitReact;
  if (typeof globalThis !== 'undefined' && globalThis.React && typeof globalThis.React.createElement === 'function') {
    return globalThis.React;
  }
  return null;
}

function clampNumber(value, min, max) {
  const lo = Number.isFinite(min) ? min : 0;
  const hi = Number.isFinite(max) ? Math.max(lo, max) : lo;
  const num = Number(value);
  if (!Number.isFinite(num)) return lo;
  return Math.min(hi, Math.max(lo, num));
}

export function normalizeDshStyle(value) {
  const key = typeof value === 'string' ? value.trim() : '';
  return VALID_STYLE_IDS.has(key) ? key : DSH_DEFAULT_STYLE;
}

export function getDshStylePreset(value) {
  const id = normalizeDshStyle(value);
  return DSH_STYLES.find(preset => preset.id === id) || DSH_STYLES[0];
}

export function readDshStyle(win) {
  const target = resolveWindow(win);
  if (!target) return DSH_DEFAULT_STYLE;
  try {
    const raw = target.localStorage?.getItem(DSH_STYLE_STORAGE_KEY);
    return normalizeDshStyle(raw);
  } catch {
    return DSH_DEFAULT_STYLE;
  }
}

export function normalizeDshFont(value) {
  const key = typeof value === 'string' ? value.trim() : '';
  return VALID_FONT_IDS.has(key) ? key : DSH_DEFAULT_FONT;
}

export function getDshFontPreset(value) {
  const id = normalizeDshFont(value);
  return DSH_FONTS.find(preset => preset.id === id) || DSH_FONTS[0];
}

export function readDshFont(win) {
  const target = resolveWindow(win);
  if (!target) return DSH_DEFAULT_FONT;
  try {
    const raw = target.localStorage?.getItem(DSH_FONT_STORAGE_KEY);
    return normalizeDshFont(raw);
  } catch {
    return DSH_DEFAULT_FONT;
  }
}

/**
 * Stamps `[data-dsh-style]`, `[data-dsh-font]`, and `[data-window-drag-exclude]` onto
 * any currently open portaled `[role="dialog"]` / `[role="menu"]` surfaces in
 * `document.body` that were synced via `createOverlaySyncRef` or carry
 * `[data-dsh-portal-synced]`, plus `[data-dsh-font]` onto `document.documentElement`.
 */
export function syncPortaledOverlays(style, doc, font) {
  const normalized = normalizeDshStyle(style);
  const normalizedFont = normalizeDshFont(font ?? readDshFont());
  const targetDoc = doc || (typeof document !== 'undefined' ? document : null);
  if (!targetDoc) return;
  if (targetDoc.documentElement && typeof targetDoc.documentElement.setAttribute === 'function') {
    targetDoc.documentElement.setAttribute('data-dsh-font', normalizedFont);
  }
  if (typeof targetDoc.querySelectorAll !== 'function') return;
  for (const el of targetDoc.querySelectorAll('[data-dsh-portal-synced]')) {
    el.setAttribute('data-dsh-style', normalized);
    el.setAttribute('data-dsh-font', normalizedFont);
    if (!el.hasAttribute('data-window-drag-exclude')) {
      el.setAttribute('data-window-drag-exclude', '');
    }
  }
}

export function syncPortaledFont(font, doc) {
  const normalizedFont = normalizeDshFont(font);
  const targetDoc = doc || (typeof document !== 'undefined' ? document : null);
  if (!targetDoc) return;
  if (targetDoc.documentElement && typeof targetDoc.documentElement.setAttribute === 'function') {
    targetDoc.documentElement.setAttribute('data-dsh-font', normalizedFont);
  }
  if (typeof targetDoc.querySelectorAll !== 'function') return;
  for (const el of targetDoc.querySelectorAll('[data-dsh-portal-synced], [data-dsh-style]')) {
    el.setAttribute('data-dsh-font', normalizedFont);
  }
}

export function writeDshStyle(nextStyle, win) {
  const normalized = normalizeDshStyle(nextStyle);
  const target = resolveWindow(win);
  if (target) {
    try {
      target.localStorage?.setItem(DSH_STYLE_STORAGE_KEY, normalized);
    } catch {
      // Restricted storage: keep in-memory + custom event sync working.
    }
    syncPortaledOverlays(normalized, target.document, readDshFont(target));
    if (typeof target.dispatchEvent === 'function') {
      try {
        const CustomEventCtor = target.CustomEvent || (typeof CustomEvent === 'function' ? CustomEvent : null);
        if (CustomEventCtor) {
          target.dispatchEvent(new CustomEventCtor(DSH_STYLE_EVENT, { detail: { style: normalized } }));
        } else if (typeof Event === 'function') {
          const ev = new Event(DSH_STYLE_EVENT);
          ev.detail = { style: normalized };
          target.dispatchEvent(ev);
        }
      } catch {
        // Ignore synthetic event errors in minimal VM environments.
      }
    }
  }
  return normalized;
}

export function writeDshFont(nextFont, win) {
  const normalized = normalizeDshFont(nextFont);
  const target = resolveWindow(win);
  if (target) {
    try {
      target.localStorage?.setItem(DSH_FONT_STORAGE_KEY, normalized);
    } catch {
      // Restricted storage: keep in-memory + custom event sync working.
    }
    syncPortaledFont(normalized, target.document);
    if (typeof target.dispatchEvent === 'function') {
      try {
        const CustomEventCtor = target.CustomEvent || (typeof CustomEvent === 'function' ? CustomEvent : null);
        if (CustomEventCtor) {
          target.dispatchEvent(new CustomEventCtor(DSH_FONT_EVENT, { detail: { font: normalized } }));
        } else if (typeof Event === 'function') {
          const ev = new Event(DSH_FONT_EVENT);
          ev.detail = { font: normalized };
          target.dispatchEvent(ev);
        }
      } catch {
        // Ignore synthetic event errors in minimal VM environments.
      }
    }
  }
  return normalized;
}

export function subscribeDshStyle(onChange, win) {
  const target = resolveWindow(win);
  if (!target || typeof target.addEventListener !== 'function' || typeof onChange !== 'function') {
    return () => {};
  }
  const onCustom = event => {
    const next = normalizeDshStyle(event?.detail?.style ?? readDshStyle(target));
    syncPortaledOverlays(next, target.document, readDshFont(target));
    onChange(next);
  };
  const onStorage = event => {
    if (event && event.key !== null && event.key !== undefined && event.key !== DSH_STYLE_STORAGE_KEY) {
      return;
    }
    const next = normalizeDshStyle(event?.newValue ?? readDshStyle(target));
    syncPortaledOverlays(next, target.document, readDshFont(target));
    onChange(next);
  };
  target.addEventListener(DSH_STYLE_EVENT, onCustom);
  target.addEventListener('storage', onStorage);
  return () => {
    target.removeEventListener(DSH_STYLE_EVENT, onCustom);
    target.removeEventListener('storage', onStorage);
  };
}

export function subscribeDshFont(onChange, win) {
  const target = resolveWindow(win);
  if (!target || typeof target.addEventListener !== 'function' || typeof onChange !== 'function') {
    return () => {};
  }
  const onCustom = event => {
    const next = normalizeDshFont(event?.detail?.font ?? readDshFont(target));
    syncPortaledFont(next, target.document);
    onChange(next);
  };
  const onStorage = event => {
    if (event && event.key !== null && event.key !== undefined && event.key !== DSH_FONT_STORAGE_KEY) {
      return;
    }
    const next = normalizeDshFont(event?.newValue ?? readDshFont(target));
    syncPortaledFont(next, target.document);
    onChange(next);
  };
  target.addEventListener(DSH_FONT_EVENT, onCustom);
  target.addEventListener('storage', onStorage);
  return () => {
    target.removeEventListener(DSH_FONT_EVENT, onCustom);
    target.removeEventListener('storage', onStorage);
  };
}

/**
 * React hook returning `[style, setStyle]`, synced across plugins, tabs, and
 * portaled dialogs via `localStorage['dsh-stardust:ui-style']` + `dsh-stardust-style`.
 * Safe in minimal VM registration tests where `React.useState` may be absent.
 */
export function useDshStyle(React, win) {
  if (!React || typeof React.useState !== 'function') {
    return [readDshStyle(win), next => writeDshStyle(next, win)];
  }
  const [style, setStyleState] = React.useState(() => readDshStyle(win));
  if (typeof React.useEffect === 'function') {
    React.useEffect(() => {
      const current = readDshStyle(win);
      setStyleState(prev => (prev === current ? prev : current));
      syncPortaledOverlays(current, resolveWindow(win)?.document, readDshFont(win));
      return subscribeDshStyle(next => {
        setStyleState(prev => (prev === next ? prev : next));
      }, win);
    }, [win]);
  }
  const setStyle = next => {
    const resolved = typeof next === 'function' ? next(style) : next;
    const applied = writeDshStyle(resolved, win);
    setStyleState(applied);
    return applied;
  };
  return [style, setStyle];
}

/**
 * React hook returning `[font, setFont]`, synced via `localStorage['dsh-stardust:ui-font']`
 * + `dsh-stardust-font` and applied via `[data-dsh-font]`.
 */
export function useDshFont(React, win) {
  if (!React || typeof React.useState !== 'function') {
    return [readDshFont(win), next => writeDshFont(next, win)];
  }
  const [font, setFontState] = React.useState(() => readDshFont(win));
  if (typeof React.useEffect === 'function') {
    React.useEffect(() => {
      const current = readDshFont(win);
      setFontState(prev => (prev === current ? prev : current));
      syncPortaledFont(current, resolveWindow(win)?.document);
      return subscribeDshFont(next => {
        setFontState(prev => (prev === next ? prev : next));
      }, win);
    }, [win]);
  }
  const setFont = next => {
    const resolved = typeof next === 'function' ? next(font) : next;
    const applied = writeDshFont(resolved, win);
    setFontState(applied);
    return applied;
  };
  return [font, setFont];
}

/**
 * Callback ref for elements rendered inside host `@deepseek-ai/dsh-client-ui-primitives`
 * `Modal` or `Menu` portals (`createPortal(..., document.body)`).
 * Host `Modal` and `Menu` do not spread arbitrary `data-*` props onto their outer
 * `<div role="dialog">` / `<div role="menu">` wrapper, so attaching this ref to an
 * inner header/body wrapper promotes `data-dsh-style`, `data-dsh-font`, and
 * `data-window-drag-exclude` onto the portaled overlay frame itself.
 */
export function createOverlaySyncRef(style, font) {
  const normalized = normalizeDshStyle(style);
  const normalizedFont = normalizeDshFont(font ?? readDshFont());
  return node => {
    if (!node || typeof node.setAttribute !== 'function') return;
    node.setAttribute('data-dsh-style', normalized);
    node.setAttribute('data-dsh-font', normalizedFont);
    node.setAttribute('data-window-drag-exclude', '');
    node.setAttribute('data-dsh-portal-synced', 'true');
    if (typeof node.closest === 'function') {
      const overlay = node.closest('[role="dialog"], [role="alertdialog"], [role="menu"], dialog');
      if (overlay) {
        overlay.setAttribute('data-dsh-style', normalized);
        overlay.setAttribute('data-dsh-font', normalizedFont);
        overlay.setAttribute('data-window-drag-exclude', '');
        overlay.setAttribute('data-dsh-portal-synced', 'true');
      }
    }
  };
}

/**
 * Shared crisp 24x24 stroke icons for workbench headers, buttons, and micro-animations.
 */
export const DSH_ICON_PATHS = Object.freeze({
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
  copy: ['M9 9h10v11H9z', 'M5 15H4V4h10v1'],
  external: ['M14 4h6v6', 'M10 14 20 4', 'M18 13v6H5V6h6'],
  link: ['M10 13a5 5 0 0 0 7.1 0l2.8-2.8a5 5 0 0 0-7.1-7.1L11 4.9', 'M14 11a5 5 0 0 0-7.1 0l-2.8 2.8a5 5 0 0 0 7.1 7.1L13 19.1'],
  play: ['m7 5 12 7-12 7Z'],
  palette: ['M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1 0-4h4a5 5 0 0 0 5-5c0-2.2-4-4-9-4Z', 'M7.5 10.5h.01M10.5 7.5h.01M14.5 7.5h.01'],
  sparkles: ['m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z', 'M19 15v4M17 17h4'],
  calendar: ['M4 6h16v14H4z', 'M8 3v4M16 3v4M4 10h16'],
  shield: ['M12 3 5 6v6c0 5 3.4 8.3 7 9 3.6-.7 7-4 7-9V6Z'],
  rss: ['M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', 'M4 11a9 9 0 0 1 9 9', 'M4 5a15 15 0 0 1 15 15'],
  grip: ['M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01'],
});

export function renderDshIcon(React, { name = 'file', size = 16, paths = DSH_ICON_PATHS, ...props } = {}) {
  const h = React.createElement;
  const segments = paths[name] || DSH_ICON_PATHS[name] || DSH_ICON_PATHS.file;
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.65,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true',
      focusable: 'false',
      'data-dsh-icon': name,
      ...props,
    },
    segments.map((d, index) => h('path', { key: index, d })),
  );
}

/**
 * Measures the active `[role="tab"][aria-selected="true"]` inside a `[role="tablist"]`
 * and drives CSS variables `--dsh-tab-x` / `--dsh-tab-w` for `.dsh-tab-indicator`.
 * Falls back cleanly to static `::after` border underline when layout is unavailable (jsdom)
 * or under `@media (forced-colors: active)`.
 */
export function useSlidingTabIndicator(React, activeValue, options = {}) {
  const tablistRef = typeof React?.useRef === 'function' ? React.useRef(null) : { current: null };
  const [metrics, setMetrics] = typeof React?.useState === 'function'
    ? React.useState({ x: 0, width: 0, ready: false })
    : [{ x: 0, width: 0, ready: false }, () => {}];

  const syncIndicator = () => {
    const list = tablistRef.current;
    if (!list || typeof list.querySelector !== 'function') return;
    const activeTab = list.querySelector('[role="tab"][aria-selected="true"]');
    if (!activeTab) {
      list.setAttribute?.('data-indicator-ready', 'false');
      setMetrics(prev => (prev.ready ? { x: 0, width: 0, ready: false } : prev));
      return;
    }
    let x = typeof activeTab.offsetLeft === 'number' ? activeTab.offsetLeft : 0;
    let width = typeof activeTab.offsetWidth === 'number' ? activeTab.offsetWidth : 0;
    if (!width && typeof activeTab.getBoundingClientRect === 'function' && typeof list.getBoundingClientRect === 'function') {
      const tabRect = activeTab.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      if (tabRect && listRect && tabRect.width > 0) {
        width = tabRect.width;
        x = tabRect.left - listRect.left + (list.scrollLeft || 0);
      }
    }
    const ready = width > 0;
    if (list.style && typeof list.style.setProperty === 'function') {
      list.style.setProperty('--dsh-tab-x', `${Math.round(x)}px`);
      list.style.setProperty('--dsh-tab-w', `${Math.round(width)}px`);
    }
    list.setAttribute?.('data-indicator-ready', ready ? 'true' : 'false');
    setMetrics(prev => (
      prev.x === Math.round(x) && prev.width === Math.round(width) && prev.ready === ready
        ? prev
        : { x: Math.round(x), width: Math.round(width), ready }
    ));
  };

  const effectHook = typeof React?.useLayoutEffect === 'function'
    ? React.useLayoutEffect
    : (typeof React?.useEffect === 'function' ? React.useEffect : null);

  if (effectHook) {
    const deps = Array.isArray(options?.deps) ? [activeValue, ...options.deps] : [activeValue];
    effectHook(() => {
      syncIndicator();
      const list = tablistRef.current;
      const win = resolveWindow(options?.win);
      let ro = null;
      if (list && typeof win?.ResizeObserver === 'function') {
        try {
          ro = new win.ResizeObserver(() => syncIndicator());
          ro.observe(list);
        } catch {
          ro = null;
        }
      }
      if (win && typeof win.addEventListener === 'function') {
        win.addEventListener('resize', syncIndicator);
      }
      return () => {
        ro?.disconnect?.();
        if (win && typeof win.removeEventListener === 'function') {
          win.removeEventListener('resize', syncIndicator);
        }
      };
    }, deps);
  }

  const indicatorStyle = {
    '--dsh-tab-x': `${metrics.x}px`,
    '--dsh-tab-w': `${metrics.width}px`,
  };

  return {
    tablistRef,
    ready: metrics.ready,
    indicatorStyle,
    tablistProps: {
      ref: tablistRef,
      'data-dsh-tablist': '',
      'data-indicator-ready': metrics.ready ? 'true' : 'false',
    },
    indicatorProps: {
      className: 'dsh-tab-indicator',
      'aria-hidden': 'true',
      style: indicatorStyle,
    },
    syncIndicator,
  };
}

/**
 * Resizable split-pane hook with `localStorage` persistence, clamping, reset,
 * and ready-to-spread `resizerProps` for `DshSplitResizer`.
 */
export function useResizableSplit(
  React,
  { key, initial = 320, min = 220, max = 560, orientation = 'vertical', reverse = false, win } = {},
) {
  const clampedInitial = clampNumber(initial, min, max);
  const readStored = () => {
    const target = resolveWindow(win);
    if (!key || !target) return clampedInitial;
    try {
      const raw = target.localStorage?.getItem(key);
      if (raw == null || raw === '') return clampedInitial;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? clampNumber(parsed, min, max) : clampedInitial;
    } catch {
      return clampedInitial;
    }
  };

  const writeStored = nextSize => {
    const clamped = Math.round(clampNumber(nextSize, min, max));
    const target = resolveWindow(win);
    if (key && target) {
      try {
        target.localStorage?.setItem(key, String(clamped));
      } catch {
        // Ignore restricted storage errors.
      }
    }
    return clamped;
  };

  const hasHooks = Boolean(React && typeof React.useState === 'function');
  const [size, setSizeState] = hasHooks ? React.useState(() => readStored()) : [readStored(), () => {}];
  const [isDragging, setIsDragging] = hasHooks ? React.useState(false) : [false, () => {}];

  const setSize = next => {
    const resolved = typeof next === 'function' ? next(size) : next;
    const applied = writeStored(resolved);
    setSizeState(applied);
    return applied;
  };

  const reset = () => {
    const applied = writeStored(clampedInitial);
    setSizeState(applied);
    return applied;
  };

  return {
    size,
    width: size,
    setSize,
    reset,
    isDragging,
    setIsDragging,
    paneStyle: { '--dsh-split-size': `${size}px` },
    resizerProps: {
      value: size,
      initial: clampedInitial,
      min,
      max,
      orientation,
      reverse,
      onChange: setSize,
      onReset: reset,
      onDraggingChange: setIsDragging,
    },
  };
}

export function renderDshSplitResizer(
  React,
  {
    value = 320,
    initial,
    min = 220,
    max = 560,
    orientation = 'vertical',
    reverse = false,
    step = 16,
    label = 'Resize pane',
    onChange,
    onReset,
    onDraggingChange,
    className,
    style,
    ...rest
  } = {},
) {
  const R = resolveReact(React);
  if (!R) return null;
  const h = R.createElement;
  const dragRef = typeof R.useRef === 'function' ? R.useRef(null) : { current: null };
  const [dragging, setDragging] = typeof R.useState === 'function' ? R.useState(false) : [false, () => {}];

  const isHorizontal = orientation === 'horizontal';
  const clampedValue = Math.round(clampNumber(value, min, max));

  const setDragActive = active => {
    setDragging(active);
    onDraggingChange?.(active);
  };

  const cleanupWindowListeners = () => {
    const drag = dragRef.current;
    if (drag?.cleanup) {
      drag.cleanup();
    }
    dragRef.current = null;
  };

  if (typeof R.useEffect === 'function') {
    R.useEffect(() => cleanupWindowListeners, []);
  }

  const updateFromClientPos = (clientX, clientY) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rawDelta = isHorizontal ? (clientY - drag.startY) : (clientX - drag.startX);
    const delta = reverse ? -rawDelta : rawDelta;
    const next = Math.round(clampNumber(drag.startValue + delta, min, max));
    onChange?.(next);
  };

  const handlePointerDown = event => {
    if (event?.button !== undefined && event.button !== 0) return;
    event?.preventDefault?.();
    const targetEl = event?.currentTarget;
    const pointerId = event?.pointerId;
    const startX = Number(event?.clientX ?? 0);
    const startY = Number(event?.clientY ?? 0);

    cleanupWindowListeners();

    let captured = false;
    if (targetEl && typeof targetEl.setPointerCapture === 'function' && pointerId !== undefined) {
      try {
        targetEl.setPointerCapture(pointerId);
        captured = true;
      } catch {
        captured = false;
      }
    }

    const win = resolveWindow();
    let cleanup = null;
    if (!captured && win && typeof win.addEventListener === 'function') {
      const onWinMove = moveEvent => updateFromClientPos(Number(moveEvent.clientX ?? 0), Number(moveEvent.clientY ?? 0));
      const onWinUp = () => {
        cleanupWindowListeners();
        setDragActive(false);
      };
      win.addEventListener('pointermove', onWinMove);
      win.addEventListener('mousemove', onWinMove);
      win.addEventListener('pointerup', onWinUp);
      win.addEventListener('mouseup', onWinUp);
      win.addEventListener('pointercancel', onWinUp);
      cleanup = () => {
        win.removeEventListener('pointermove', onWinMove);
        win.removeEventListener('mousemove', onWinMove);
        win.removeEventListener('pointerup', onWinUp);
        win.removeEventListener('mouseup', onWinUp);
        win.removeEventListener('pointercancel', onWinUp);
      };
    }

    dragRef.current = { startX, startY, startValue: clampedValue, pointerId, captured, cleanup };
    setDragActive(true);
  };

  const handlePointerMove = event => {
    if (!dragRef.current) return;
    updateFromClientPos(Number(event?.clientX ?? 0), Number(event?.clientY ?? 0));
  };

  const handlePointerEnd = event => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.captured && event?.currentTarget && typeof event.currentTarget.releasePointerCapture === 'function' && drag.pointerId !== undefined) {
      try {
        event.currentTarget.releasePointerCapture(drag.pointerId);
      } catch {
        // Ignore release errors when pointer already detached.
      }
    }
    cleanupWindowListeners();
    setDragActive(false);
  };

  const handleKeyDown = event => {
    const key = event?.key;
    const deltaStep = event?.shiftKey ? step * 2 : step;
    const dir = reverse ? -1 : 1;
    let next = null;
    if ((!isHorizontal && key === 'ArrowLeft') || (isHorizontal && key === 'ArrowUp')) {
      next = clampNumber(clampedValue - deltaStep * dir, min, max);
    } else if ((!isHorizontal && key === 'ArrowRight') || (isHorizontal && key === 'ArrowDown')) {
      next = clampNumber(clampedValue + deltaStep * dir, min, max);
    } else if (key === 'Home') {
      next = min;
    } else if (key === 'End') {
      next = max;
    }
    if (next !== null) {
      event?.preventDefault?.();
      onChange?.(Math.round(next));
    }
  };

  const handleDoubleClick = () => {
    if (typeof onReset === 'function') {
      onReset();
    } else if (initial !== undefined) {
      onChange?.(Math.round(clampNumber(initial, min, max)));
    }
  };

  return h('div', {
    ...rest,
    role: 'separator',
    tabIndex: 0,
    'aria-orientation': orientation,
    'aria-label': label,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': clampedValue,
    'data-dsh-resizer': '',
    'data-dragging': dragging ? 'true' : 'false',
    'data-window-drag-exclude': '',
    className: ['dsh-split-resizer', className].filter(Boolean).join(' '),
    style,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
    onLostPointerCapture: handlePointerEnd,
    onKeyDown: handleKeyDown,
    onDoubleClick: handleDoubleClick,
  });
}

export function createSplitResizerComponent(React) {
  return function DshSplitResizerWithReact(props) {
    return renderDshSplitResizer(React, props);
  };
}

export function DshSplitResizer(props = {}) {
  const { React: explicitReact, ...rest } = props;
  return renderDshSplitResizer(resolveReact(explicitReact), rest);
}

/**
 * Theme-tinted shimmer skeleton helper (`DshSkeleton` / `createSkeletonComponent` / `renderDshSkeleton`).
 * Honors `prefers-reduced-motion: reduce` and `eink` zero-distraction mode automatically via CSS.
 */
export function renderDshSkeleton(
  React,
  {
    variant = 'text',
    lines = 3,
    width,
    height,
    radius,
    animated = true,
    label,
    className,
    style,
    ...rest
  } = {},
) {
  const R = resolveReact(React);
  if (!R) return null;
  const h = R.createElement;
  const a11yProps = label
    ? { role: 'status', 'aria-busy': 'true', 'aria-label': label }
    : { 'aria-hidden': 'true' };

  const baseBar = (barWidth, barHeight, key) =>
    h('span', {
      key,
      className: 'dsh-skeleton',
      'data-dsh-skeleton': variant,
      'data-animated': animated ? 'true' : 'false',
      style: {
        width: barWidth ?? width,
        height: barHeight ?? height,
        borderRadius: radius,
      },
    });

  if (variant === 'circle') {
    return h('span', {
      ...a11yProps,
      ...rest,
      className: ['dsh-skeleton', 'dsh-skeleton-circle', className].filter(Boolean).join(' '),
      'data-dsh-skeleton': 'circle',
      'data-animated': animated ? 'true' : 'false',
      style: { width, height, ...style },
    });
  }

  if (variant === 'rect') {
    return h('span', {
      ...a11yProps,
      ...rest,
      className: ['dsh-skeleton', className].filter(Boolean).join(' '),
      'data-dsh-skeleton': 'rect',
      'data-animated': animated ? 'true' : 'false',
      style: { width, height: height ?? '80px', borderRadius: radius, ...style },
    });
  }

  if (variant === 'row') {
    return h(
      'div',
      {
        ...a11yProps,
        ...rest,
        className: ['dsh-skeleton-row', className].filter(Boolean).join(' '),
        style,
      },
      h('span', {
        className: 'dsh-skeleton dsh-skeleton-circle',
        'data-dsh-skeleton': 'circle',
        'data-animated': animated ? 'true' : 'false',
      }),
      h(
        'div',
        { className: 'dsh-skeleton-group' },
        baseBar('58%', '12px', 'r1'),
        baseBar('84%', '10px', 'r2'),
      ),
    );
  }

  if (variant === 'card') {
    return h(
      'div',
      {
        ...a11yProps,
        ...rest,
        className: ['dsh-skeleton-card', className].filter(Boolean).join(' '),
        style,
      },
      baseBar('46%', '14px', 'c1'),
      baseBar('100%', '11px', 'c2'),
      baseBar('74%', '11px', 'c3'),
    );
  }

  const count = Math.max(1, Math.round(Number(lines) || 1));
  if (count === 1) {
    return h('span', {
      ...a11yProps,
      ...rest,
      className: ['dsh-skeleton', className].filter(Boolean).join(' '),
      'data-dsh-skeleton': 'text',
      'data-animated': animated ? 'true' : 'false',
      style: { width, height, borderRadius: radius, ...style },
    });
  }

  const bars = [];
  for (let i = 0; i < count; i += 1) {
    const isLast = i === count - 1;
    bars.push(baseBar(isLast ? '68%' : '100%', height, `l-${i}`));
  }
  return h(
    'div',
    {
      ...a11yProps,
      ...rest,
      className: ['dsh-skeleton-group', className].filter(Boolean).join(' '),
      style,
    },
    bars,
  );
}

export function createSkeletonComponent(React) {
  return function DshSkeletonWithReact(props) {
    return renderDshSkeleton(React, props);
  };
}

export function DshSkeleton(props = {}) {
  const { React: explicitReact, ...rest } = props;
  return renderDshSkeleton(resolveReact(explicitReact), rest);
}

/**
 * Lazily resolves `@deepseek-ai/dsh-client-ui-primitives` on render and supplies
 * semantic, accessible HTML fallbacks when running in standalone `jsdom` or `node:vm`
 * tests where host UI primitives are not mounted.
 *
 * IMPORTANT: Call ONLY inside component render paths — never eagerly inside
 * `window.__ModuleLoader__.load({ factory })` or `apply(ctx)`.
 */
// React uses function identity to reconcile components. Keep wrappers and
// fallback controls stable across renders so a form update cannot remount a
// modal and repeat its initial autofocus. Resolve the host before consulting
// the cache so late loading, unloading and replacement still take effect.
const hostPrimitivesByReact = new WeakMap();

export function resolveHostPrimitives(React, requireFn) {
  const h = React.createElement;
  let host = null;
  if (typeof requireFn === 'function') {
    try {
      host = requireFn('@deepseek-ai/dsh-client-ui-primitives') || null;
    } catch {
      host = null;
    }
  }

  let cached = hostPrimitivesByReact.get(React);
  if (!cached) {
    cached = new Map();
    hostPrimitivesByReact.set(React, cached);
  }
  if (cached.has(host)) return cached.get(host);

  function FallbackButton({ variant = 'ghost', size = 'md', icon, className, children, type = 'button', ...rest }) {
    const cls = ['dsh-btn', `dsh-btn-${variant}`, `dsh-btn-${size}`, className].filter(Boolean).join(' ');
    return h(
      'button',
      { type, className: cls, ...rest },
      icon != null ? h('span', { className: 'dsh-fallback-btn-icon' }, icon) : null,
      children,
    );
  }

  function FallbackInput({ icon, className, ...rest }) {
    const cls = ['dsh-fallback-input-wrap', className].filter(Boolean).join(' ');
    return h(
      'span',
      { className: cls },
      icon != null ? h('span', { className: 'dsh-fallback-input-icon' }, icon) : null,
      h('input', rest),
    );
  }

  function FallbackCheckbox({ checked = false, onChange, label, disabled = false, title, className, ...rest }) {
    return h(
      'label',
      { className, title },
      h('input', {
        type: 'checkbox',
        checked: Boolean(checked),
        disabled,
        onChange: event => onChange?.(Boolean(event?.target?.checked)),
        ...rest,
      }),
      h('span', null, label),
    );
  }

  function FallbackSwitch({ checked = false, onChange, label, disabled = false, title, className }) {
    return h(
      'button',
      {
        type: 'button',
        role: 'switch',
        'aria-checked': Boolean(checked),
        'aria-label': label,
        title,
        disabled,
        className,
        onClick: () => onChange?.(!checked),
      },
      h('span', null),
    );
  }

  function FallbackSegmentedControl({ id, value, options = [], onChange, label, disabled = false, className }) {
    return h(
      'div',
      { role: 'tablist', 'aria-label': label, className },
      options.map(opt => {
        const selected = opt.value === value;
        return h(
          'button',
          {
            key: opt.value,
            id: id ? `${id}-${opt.value}` : undefined,
            type: 'button',
            role: 'tab',
            'aria-selected': selected,
            tabIndex: selected ? 0 : -1,
            disabled: disabled || Boolean(opt.disabled),
            onClick: () => {
              if (!disabled && !opt.disabled && opt.value !== value) onChange?.(opt.value);
            },
          },
          opt.label,
        );
      }),
    );
  }

  function renderPortalSyncNode(styleValue, fontValue) {
    const syncStyle = normalizeDshStyle(styleValue ?? readDshStyle());
    const syncFont = normalizeDshFont(fontValue ?? readDshFont());
    return h('span', {
      key: '__dsh_portal_sync__',
      ref: createOverlaySyncRef(syncStyle, syncFont),
      hidden: true,
      'aria-hidden': 'true',
      'data-dsh-style': syncStyle,
      'data-dsh-font': syncFont,
    });
  }

  function FallbackMenu({
    open = false,
    anchor,
    items = [],
    children,
    selectedId,
    onSelect,
    onClose,
    footer,
    className,
    listClassName,
    dshStyle,
    dshFont,
  }) {
    const style = normalizeDshStyle(dshStyle ?? readDshStyle());
    const font = normalizeDshFont(dshFont ?? readDshFont());
    return h(
      'div',
      { className: ['dsh-style-fallback-wrap', className].filter(Boolean).join(' ') },
      anchor,
      open
        ? h(
            'div',
            {
              role: 'menu',
              'data-dsh-style': style,
              'data-dsh-font': font,
              'data-window-drag-exclude': '',
              'data-dsh-portal-synced': 'true',
              className: ['dsh-style-fallback-menu', listClassName].filter(Boolean).join(' '),
              onKeyDown: event => {
                if (event?.key === 'Escape') {
                  event.stopPropagation?.();
                  onClose?.();
                }
              },
            },
            items.map(item => {
              const stylePreset = VALID_STYLE_IDS.has(item.id) ? getDshStylePreset(item.id) : null;
              return h(
                'button',
                {
                  key: item.id,
                  type: 'button',
                  role: 'menuitemradio',
                  'aria-checked': item.id === selectedId,
                  disabled: Boolean(item.disabled),
                  className: 'dsh-style-fallback-item',
                  onClick: () => {
                    if (!item.disabled) {
                      onSelect?.(item.id);
                      onClose?.();
                    }
                  },
                },
                h(
                  'span',
                  { className: 'dsh-style-fallback-item-leading' },
                  stylePreset
                    ? h('span', {
                        className: 'dsh-style-swatch',
                        'aria-hidden': 'true',
                        style: { '--dsh-swatch-color': stylePreset.swatch },
                      })
                    : null,
                  h('span', null, item.label),
                ),
                item.id === selectedId ? h('span', { 'aria-hidden': 'true' }, '✓') : null,
              );
            }),
            children,
            footer,
          )
        : null,
    );
  }

  function FallbackModal({
    open = true,
    onClose,
    title,
    closeLabel = 'Close',
    children,
    footer,
    className,
    contentClassName,
    onKeyDownCapture,
    headless = false,
    dshStyle,
    dshFont,
  }) {
    if (!open) return null;
    const style = normalizeDshStyle(dshStyle ?? readDshStyle());
    const font = normalizeDshFont(dshFont ?? readDshFont());
    return h(
      'div',
      {
        className: 'dsh-fallback-modal-root',
        role: 'presentation',
        'data-dsh-style': style,
        'data-dsh-font': font,
        'data-window-drag-exclude': '',
        'data-dsh-portal-synced': 'true',
        onKeyDownCapture: event => {
          onKeyDownCapture?.(event);
          if (!event?.defaultPrevented && event?.key === 'Escape') {
            onClose?.();
          }
        },
      },
      h('div', { className: 'dsh-fallback-modal-mask', 'aria-hidden': 'true', onClick: onClose }),
      h(
        'div',
        {
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': title,
          tabIndex: -1,
          'data-dsh-style': style,
          'data-dsh-font': font,
          'data-window-drag-exclude': '',
          'data-dsh-portal-synced': 'true',
          className: ['dsh-fallback-modal-dialog', className].filter(Boolean).join(' '),
        },
        headless
          ? children
          : h(
              React.Fragment || 'div',
              null,
              h(
                'header',
                null,
                h('h2', null, title),
                h('button', { type: 'button', 'aria-label': closeLabel, onClick: onClose }, '×'),
              ),
              h('div', { className: contentClassName }, children),
              footer ? h('footer', null, footer) : null,
            ),
      ),
    );
  }

  const WrappedMenu = host?.Menu
    ? function HostMenuWithStyle({ dshStyle, dshFont, children, ...menuProps }) {
        if (!menuProps.open) {
          return children !== undefined ? h(host.Menu, menuProps, children) : h(host.Menu, menuProps);
        }
        const syncNode = renderPortalSyncNode(dshStyle, dshFont);
        return children !== undefined && children !== null
          ? h(host.Menu, menuProps, children, syncNode)
          : h(host.Menu, menuProps, syncNode);
      }
    : FallbackMenu;

  const WrappedModal = host?.Modal
    ? function HostModalWithStyle({ dshStyle, dshFont, children, ...modalProps }) {
        if (!modalProps.open) {
          return children !== undefined ? h(host.Modal, modalProps, children) : h(host.Modal, modalProps);
        }
        const syncNode = renderPortalSyncNode(dshStyle, dshFont);
        return children !== undefined && children !== null
          ? h(host.Modal, modalProps, children, syncNode)
          : h(host.Modal, modalProps, syncNode);
      }
    : FallbackModal;

  const resolved = {
    ...(host || {}),
    isFallback: !host,
    Button: host?.Button || FallbackButton,
    Input: host?.Input || FallbackInput,
    Checkbox: host?.Checkbox || FallbackCheckbox,
    Switch: host?.Switch || FallbackSwitch,
    SegmentedControl: host?.SegmentedControl || FallbackSegmentedControl,
    Menu: WrappedMenu,
    Modal: WrappedModal,
  };
  cached.set(host, resolved);
  return resolved;
}

/**
 * Compact standalone Font Pairing Switcher (`FontSwitcher`), synced via
 * `localStorage['dsh-stardust:ui-font']` + `dsh-stardust-font` and `[data-dsh-font]`.
 */
export function createFontSwitcherComponent(React, requireFn) {
  const h = React.createElement;
  return function FontSwitcher({
    font: controlledFont,
    style: controlledStyle,
    onChange,
    lang = 'zh',
    id = 'dsh-font-switcher',
    compact = true,
    disabled = false,
    align = 'end',
    className,
    open: controlledOpen,
    onOpenChange,
  } = {}) {
    const [syncedFont, setSyncedFont] = useDshFont(React);
    const [syncedStyle] = useDshStyle(React);
    const activeFont = normalizeDshFont(controlledFont ?? syncedFont);
    const activeStyle = normalizeDshStyle(controlledStyle ?? syncedStyle);
    const [internalOpen, setInternalOpen] = typeof React.useState === 'function' ? React.useState(false) : [false, () => {}];
    const open = controlledOpen !== undefined ? Boolean(controlledOpen) : internalOpen;
    const setOpen = next => {
      const resolved = typeof next === 'function' ? next(open) : Boolean(next);
      if (controlledOpen === undefined) setInternalOpen(resolved);
      onOpenChange?.(resolved);
    };
    const isZh = String(lang || '').toLowerCase().startsWith('zh');
    const preset = getDshFontPreset(activeFont);
    const P = resolveHostPrimitives(React, requireFn);
    const triggerLabel = isZh ? `字体搭配：${preset.zh}` : `Font pairing: ${preset.en}`;
    const visibleText = compact
      ? (isZh ? preset.zhShort : preset.enShort)
      : (isZh ? preset.zh : preset.en);
    const items = DSH_FONTS.map(option => ({
      id: option.id,
      label: isZh ? `${option.zh} (${option.enShort})` : `${option.en}`,
    }));
    const selectFont = nextId => {
      const applied = writeDshFont(nextId);
      setSyncedFont(applied);
      onChange?.(applied);
      setOpen(false);
    };

    return h(P.Menu, {
      open: open && !disabled,
      selectedId: activeFont,
      dshStyle: activeStyle,
      dshFont: activeFont,
      items,
      align,
      portal: !P.isFallback,
      autoFocus: true,
      minWidthFromAnchor: true,
      className,
      onClose: () => setOpen(false),
      onSelect: selectFont,
      anchor: h(
        P.Button,
        {
          id,
          variant: 'outline',
          size: 'sm',
          disabled,
          className: 'dsh-font-trigger',
          'aria-label': triggerLabel,
          'aria-haspopup': 'menu',
          'aria-expanded': Boolean(open && !disabled),
          title: triggerLabel,
          onClick: () => setOpen(prev => !prev),
          onKeyDown: event => {
            if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              event.preventDefault?.();
              setOpen(true);
            }
          },
        },
        h('span', { className: 'dsh-font-glyph', 'aria-hidden': 'true' }, isZh ? '字' : 'Aa'),
        h('span', { className: 'dsh-font-label' }, visibleText),
        renderDshIcon(React, { name: 'down', size: 13 }),
      ),
    });
  };
}

/**
 * Ready-made 13-preset Style Switcher + compact Font Pairing Switcher (`StyleSwitcher`).
 * Renders the style menu trigger with a live color swatch alongside the compact
 * font-pairing trigger (`showFontSwitcher = true` by default), syncing via
 * `localStorage['dsh-stardust:ui-style']` / `['dsh-stardust:ui-font']` and custom events.
 */
export function createStyleSwitcherComponent(React, requireFn) {
  const h = React.createElement;
  const FontSwitcher = createFontSwitcherComponent(React, requireFn);
  return function StyleSwitcher({
    style: controlledStyle,
    font: controlledFont,
    onChange,
    onFontChange,
    showFontSwitcher = true,
    lang = 'zh',
    id = 'dsh-style-switcher',
    compact = false,
    disabled = false,
    align = 'end',
    className,
  } = {}) {
    const [syncedStyle, setSyncedStyle] = useDshStyle(React);
    const [syncedFont] = useDshFont(React);
    const activeStyle = normalizeDshStyle(controlledStyle ?? syncedStyle);
    const activeFont = normalizeDshFont(controlledFont ?? syncedFont);
    const [open, setOpen] = typeof React.useState === 'function' ? React.useState(false) : [false, () => {}];
    const [fontOpen, setFontOpen] = typeof React.useState === 'function' ? React.useState(false) : [false, () => {}];
    const isZh = String(lang || '').toLowerCase().startsWith('zh');
    const preset = getDshStylePreset(activeStyle);
    const P = resolveHostPrimitives(React, requireFn);
    const triggerLabel = isZh ? `界面风格：${preset.zh}` : `UI style: ${preset.en}`;
    const visibleText = compact
      ? (isZh ? preset.zhShort : preset.enShort)
      : (isZh ? preset.zh : preset.en);
    const items = DSH_STYLES.map(option => ({
      id: option.id,
      label: isZh ? `${option.zh} (${option.enShort})` : `${option.en}`,
    }));
    const selectStyle = nextId => {
      const applied = writeDshStyle(nextId);
      setSyncedStyle(applied);
      onChange?.(applied);
      setOpen(false);
    };

    return h(
      'div',
      {
        className: ['dsh-style-switcher', className].filter(Boolean).join(' '),
        'data-window-drag-exclude': '',
      },
      h(P.Menu, {
        open: open && !disabled,
        selectedId: activeStyle,
        dshStyle: activeStyle,
        dshFont: activeFont,
        items,
        align,
        portal: !P.isFallback,
        autoFocus: true,
        minWidthFromAnchor: true,
        onClose: () => setOpen(false),
        onSelect: selectStyle,
        anchor: h(
          P.Button,
          {
            id,
            variant: 'outline',
            size: 'sm',
            disabled,
            className: 'dsh-style-trigger',
            'aria-label': triggerLabel,
            'aria-haspopup': 'menu',
            'aria-expanded': Boolean(open && !disabled),
            title: triggerLabel,
            onClick: () => {
              setFontOpen(false);
              setOpen(prev => !prev);
            },
            onKeyDown: event => {
              if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                event.preventDefault?.();
                setFontOpen(false);
                setOpen(true);
              }
            },
          },
          h('span', {
            className: 'dsh-style-swatch',
            'aria-hidden': 'true',
            style: { '--dsh-swatch-color': preset.swatch },
          }),
          h('span', { className: 'dsh-style-label' }, visibleText),
          renderDshIcon(React, { name: 'down', size: 14 }),
        ),
      }),
      showFontSwitcher
        ? h(FontSwitcher, {
            id: `${id}-font`,
            font: controlledFont,
            style: activeStyle,
            onChange: onFontChange,
            lang,
            compact: true,
            disabled,
            align,
            open: fontOpen && !disabled,
            onOpenChange: next => {
              if (next) setOpen(false);
              setFontOpen(next);
            },
          })
        : null,
    );
  };
}
