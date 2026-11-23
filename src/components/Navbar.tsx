import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MapPin, Search, Moon, Sun, Menu, X, Home, Archive, FileText, User, Route as RouteIcon,
  Waypoints, Bot, GraduationCap, FlaskConical, RotateCcw, Check,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';
import { AnimatePresence, motion } from 'motion/react';
import { SearchModal } from './SearchModal';
import { applyAccent, applyTheme, clearAccent, currentTheme, getStoredAccent, type ThemeMode } from '../lib/theme';

const iconMap: Record<string, React.ElementType> = {
  Home, Archive, FileText, User, Route: RouteIcon, Waypoints, Bot, GraduationCap, FlaskConical
};

/** 可选强调色（访问者自选，持久化；站点默认色为管理端配置的 accentColor） */
const ACCENTS = [
  { name: '珊瑚橙', value: '#F27D26', hover: '#f59a4d' },
  { name: '赤红', value: '#ff6b81', hover: '#ff8598' },
  { name: '靛蓝', value: '#4c6ef5', hover: '#3b5bdb' },
  { name: '青绿', value: '#40c057', hover: '#2f9e44' },
  { name: '紫藤', value: '#8b5cf6', hover: '#a78bfa' },
];

const ColorPicker: React.FC = () => {
  const { config } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [stored, setStored] = useState<{ value: string; hover: string } | null>(null);
  const siteAccent = config?.theme?.accentColor || ACCENTS[0].value;

  useEffect(() => {
    // 站点默认色随配置变化时应用（访客自选过则不动）
    setStored(getStoredAccent());
  }, [config?.theme?.accentColor]);

  useEffect(() => {
    if (!isOpen) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-color-picker]')) setIsOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isOpen]);

  const pick = (value: string, hover: string) => {
    applyAccent(value, hover);
    setStored({ value, hover });
    setIsOpen(false);
  };
  const reset = () => {
    clearAccent();
    if (siteAccent) {
      document.documentElement.style.setProperty('--accent', siteAccent);
      document.documentElement.style.setProperty('--accent-hover', siteAccent);
    }
    setStored(null);
    setIsOpen(false);
  };

  return (
    <div className="relative" data-color-picker>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="主题颜色"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="rounded-lg p-2 text-text-primary transition-colors hover:bg-black/5 hover:text-accent dark:hover:bg-white/10"
      >
        <span className="block h-4 w-4 rounded-full border-2 border-white/70 bg-[var(--accent)] shadow-sm dark:border-white/30" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full right-0 z-50 mt-2 flex items-center gap-2 rounded-xl border border-border bg-bg-card p-3 shadow-xl"
            role="menu"
            aria-label="选择主题颜色"
          >
            {ACCENTS.map((color) => {
              const active = stored ? stored.value === color.value : color.value.toLowerCase() === siteAccent.toLowerCase();
              return (
                <button
                  key={color.value}
                  type="button"
                  role="menuitem"
                  onClick={() => pick(color.value, color.hover)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110',
                    active ? 'border-accent' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  aria-label={color.name}
                  aria-checked={active}
                >
                  {active && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              );
            })}
            {stored && (
              <button
                type="button"
                role="menuitem"
                onClick={reset}
                title="恢复站点默认色"
                aria-label="恢复站点默认色"
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-base hover:text-accent"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { config: siteConfig } = useData();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState<ThemeMode>(() => currentTheme());
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    // 直接写入状态：React 对相同值会跳过重渲染。不借助 requestAnimationFrame 节流——
    // 后台 / 被遮挡的窗口里渲染帧会被浏览器暂停，那样导航栏会停在未滚动的透明态
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 路由变化时收起移动端菜单；打开期间锁住背景滚动
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    const next: ThemeMode = isDark === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setIsDark(next);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K or / to open search
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !searchOpen)) {
        // Don't trigger if user is typing in an input
        const t = e.target as HTMLElement;
        if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable) {
          return;
        }
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const navItems = siteConfig?.nav || [];

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-border/40 bg-bg-base/95 py-2.5 shadow-sm backdrop-blur-xl backdrop-saturate-150'
            : 'bg-gradient-to-b from-black/30 to-transparent py-5'
        )}
        aria-label="主导航"
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="group flex shrink-0 items-center gap-2" aria-label={`${siteConfig?.title || 'WineryBlog'} 首页`}>
            <MapPin className="h-5 w-5 text-accent transition-colors group-hover:text-accent-hover" />
            <span className="text-lg font-bold text-accent transition-colors group-hover:text-accent-hover">
              {siteConfig?.title}
            </span>
          </Link>

          {/* Desktop Nav：7 个入口放不下中等宽度，lg 起才平铺 */}
          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon];
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`));

              if (item.external) {
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-black/5 hover:text-accent dark:hover:bg-white/10"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.name}
                  </a>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-primary hover:bg-black/5 hover:text-accent dark:hover:bg-white/10'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="搜索（快捷键 Ctrl+K）"
              className="group flex items-center rounded-full border border-black/5 bg-black/5 py-1.5 pr-2 text-text-secondary transition-all hover:bg-black/10 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20"
            >
              <Search className="ml-2.5 h-4 w-4 text-text-secondary transition-colors group-hover:text-text-primary" />
              <span className="hidden w-28 text-left text-sm xl:inline">搜索</span>
              <kbd className="ml-1.5 hidden rounded border border-border bg-bg-card px-1.5 py-0.5 font-mono text-[10px] text-text-muted xl:inline">Ctrl K</kbd>
            </button>
            <ColorPicker />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
              title={isDark === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
              className="rounded-lg p-2 text-text-primary transition-colors hover:bg-black/5 hover:text-accent dark:hover:bg-white/10"
            >
              {isDark === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="rounded-lg p-2 text-text-primary transition-colors hover:bg-black/5 dark:hover:bg-white/10 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-bg-base px-4 pt-24 pb-8"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(`${item.path}/`));
                const inner = (
                  <>
                    {Icon && <Icon className="h-5 w-5" />}
                    {item.name}
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
                  </>
                );
                return item.external ? (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('flex items-center gap-3 rounded-xl bg-bg-card p-4 text-text-primary', isActive && 'text-accent')}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border bg-bg-card p-4 transition-colors',
                      isActive ? 'border-accent/50 text-accent' : 'border-transparent text-text-primary'
                    )}
                  >
                    {inner}
                  </Link>
                );
              })}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSearchOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-card p-3 text-text-primary"
                >
                  <Search className="h-5 w-5" /> 搜索文章
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-card p-3 text-text-primary"
                >
                  {isDark === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  {isDark === 'dark' ? '亮色模式' : '暗色模式'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
