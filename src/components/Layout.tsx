import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { ProfileCard } from './ProfileCard';
import { StatsCard } from './StatsCard';
import { Calendar } from './Calendar';
import { Footer } from './Footer';
import { Sakura } from './Sakura';
import { Mascot } from './Mascot';
import { PetMascot } from './PetMascot';
import { PetChatPanel } from './PetChatPanel';
import { WallpaperBackground } from './WallpaperBackground';
import { BackToTop } from './BackToTop';
import { MusicCard } from './MusicCard';
import { cn } from '../utils/cn';
import { useData } from '../context/DataContext';
import { getStoredAccent } from '../lib/theme';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { config } = useData();
  const configRef = useRef(config);
  configRef.current = config;
  const [petChatOpen, setPetChatOpen] = useState(false);
  const scrollMap = useRef(new Map<string, number>());
  const lastKeyRef = useRef<string | null>(null);

  const pet = (config as any)?.theme?.pet as
    | { enabled?: boolean; model?: 'hutao' | 'fallback'; voiceEnabled?: boolean; size?: number; opacity?: number }
    | undefined;
  const petOn = pet ? pet.enabled !== false : true; // 默认启用胡桃桌宠

  const p = location.pathname;
  // 宽屏专注模式：文章 / 知识图谱 / 实验室 / AI 馆员 隐藏左右侧栏
  const isImmersive = p.startsWith('/post/') || p.startsWith('/graph') || p.startsWith('/lab') || p === '/ai';

  // 滚动位置：站内新跳转回顶部；浏览器前进/后退回到离开时的位置
  const navType = useNavigationType();
  useLayoutEffect(() => {
    const prevKey = lastKeyRef.current;
    lastKeyRef.current = location.key;
    if (prevKey) scrollMap.current.set(prevKey, window.scrollY);
    const restore = navType === 'POP' ? scrollMap.current.get(location.key) : undefined;
    if (restore === undefined) {
      window.scrollTo(0, 0);
      return;
    }
    const jump = () => window.scrollTo(0, restore);
    const raf = window.requestAnimationFrame(jump);
    // 懒加载页面 / 按需取的正文会晚一拍才有高度
    const timer = window.setTimeout(jump, 180);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [location.key, navType, location.pathname]);

  useEffect(() => {
    const theme = configRef.current?.theme;
    // 站点配置的强调色；访客自选过则以其选择为准（见 lib/theme.ts）
    if (theme?.accentColor && !getStoredAccent()) {
      document.documentElement.style.setProperty('--accent', theme.accentColor);
    }

    let styleEl: HTMLStyleElement | null = null;

    if (theme?.cursorUrl) {
      styleEl = document.createElement('style');
      styleEl.innerHTML = `* { cursor: url(${theme.cursorUrl}), auto !important; }`;
      document.head.appendChild(styleEl);
    }

    return () => {
      if (styleEl && document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
    };
  }, [config?.theme?.accentColor, config?.theme?.cursorUrl]);

  if (p.startsWith('/admin')) {
    return <Outlet />;
  }

  const theme = config?.theme;

  return (
    <div
      className="relative flex min-h-screen flex-col bg-bg-base font-sans text-text-primary selection:bg-accent/30 selection:text-white"
      style={{
        ...(theme?.globalBackground && {
          backgroundImage: `url(${theme.globalBackground})`,
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center'
        })
      }}
    >
      {theme?.globalBackground && (
        <div className="fixed inset-0 z-[-1] bg-bg-base/80 backdrop-blur-[2px]" />
      )}

      {/* 随机壁纸背景：未配置自定义背景时启用（图片池本地化，自适应遮罩保文字可读） */}
      {!theme?.globalBackground && theme?.wallpaperEnabled !== false && (
        <WallpaperBackground />
      )}

      <Sakura
        enabled={theme?.sakuraEnabled !== false}
        density={theme?.sakuraDensity || 50}
        speed={theme?.sakuraSpeed as 'slow' | 'normal' | 'fast' || 'normal'}
      />

      {petOn ? (
        <PetMascot
          voiceEnabled={pet?.voiceEnabled === true}
          model={(pet?.model as 'hutao' | 'fallback') || 'hutao'}
          size={pet?.size || 1}
          opacity={pet?.opacity || 1}
          fallbackAvatar={config?.profile?.avatar}
          name={config?.profile?.name}
          onOpenChat={() => setPetChatOpen(true)}
        />
      ) : (
        <Mascot
          enabled={theme?.mascotEnabled !== false}
          avatar={config?.profile?.avatar}
          name={config?.profile?.name}
        />
      )}
      <PetChatPanel open={petOn && petChatOpen} onClose={() => setPetChatOpen(false)} />

      <Navbar />

      {p === '/' && <Hero />}

      {/* 跳到正文：键盘用户免于每次 Tab 过导航 */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        跳到正文
      </a>

      <main
        id="main"
        className={cn(
          'mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 md:px-6 lg:px-8',
          p !== '/' && 'pt-24 md:pt-28'
        )}
      >
        <div className={cn('flex gap-6 lg:gap-8', isImmersive && !p.startsWith('/graph') && !p.startsWith('/lab') && 'justify-center')}>
          {!isImmersive && (
            <aside className="hidden w-[260px] shrink-0 space-y-6 lg:block">
              <ProfileCard />
              <MusicCard />
            </aside>
          )}

          <div
            className={cn(
              'min-w-0 flex-1',
              isImmersive && !p.startsWith('/graph') && !p.startsWith('/lab') && 'mx-auto w-full max-w-[1080px]'
            )}
          >
            {/* 入场动效走纯 CSS：按时间推进，即使渲染帧被节流也不会把内容留在透明状态 */}
            <div key={p} className="page-enter">
              <Outlet />
            </div>
          </div>

          {!isImmersive && (
            <aside className="hidden w-[260px] shrink-0 space-y-6 2xl:block">
              <StatsCard />
              <Calendar />
            </aside>
          )}
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};
