/**
 * 明暗主题与强调色的持久化。
 * 首屏防闪烁的预应用脚本在 index.html 里（渲染前读取 localStorage）。
 */

export type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'winery-theme';
const ACCENT_KEY = 'winery-accent';

export const getStoredTheme = (): ThemeMode | null => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
};

export const currentTheme = (): ThemeMode =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

export const applyTheme = (mode: ThemeMode) => {
  document.documentElement.classList.toggle('dark', mode === 'dark');
  // PWA 状态栏 / 标题栏颜色跟随主题
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#0f1419' : '#f8f9fa');
  try { localStorage.setItem(THEME_KEY, mode); } catch { /* 隐私模式 */ }
};

interface StoredAccent { value: string; hover: string }

export const getStoredAccent = (): StoredAccent | null => {
  try {
    const raw = localStorage.getItem(ACCENT_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw);
    return a && typeof a.value === 'string' ? { value: a.value, hover: String(a.hover || a.value) } : null;
  } catch {
    return null;
  }
};

/** 访客自选的强调色优先于站点配置 */
export const applyAccent = (value: string, hover?: string) => {
  const h = hover || value;
  document.documentElement.style.setProperty('--accent', value);
  document.documentElement.style.setProperty('--accent-hover', h);
  try { localStorage.setItem(ACCENT_KEY, JSON.stringify({ value, hover: h })); } catch { /* ignore */ }
};

export const clearAccent = () => {
  document.documentElement.style.removeProperty('--accent');
  document.documentElement.style.removeProperty('--accent-hover');
  try { localStorage.removeItem(ACCENT_KEY); } catch { /* ignore */ }
};
