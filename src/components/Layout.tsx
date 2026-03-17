import React, { useEffect, useMemo, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { ProfileCard } from './ProfileCard';
import { StatsCard } from './StatsCard';
import { Calendar } from './Calendar';
import { Footer } from './Footer';
import { MusicPlayer } from './MusicPlayer';
import { Sakura } from './Sakura';
import { Mascot } from './Mascot';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { config, loading } = useData();
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const theme = configRef.current?.theme;
    if (theme?.accentColor) {
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
  }, [loading]);

  if (location.pathname.startsWith('/admin')) {
    return <Outlet />;
  }

  const theme = config?.theme;

  return (
    <div 
      className="min-h-screen bg-bg-base text-text-primary font-sans selection:bg-accent/30 selection:text-white flex flex-col relative"
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
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-[2px] z-[-1]" />
      )}

      <Sakura 
        enabled={theme?.sakuraEnabled !== false}
        density={theme?.sakuraDensity || 50}
        speed={theme?.sakuraSpeed as 'slow' | 'normal' | 'fast' || 'normal'}
      />

      <Mascot 
        enabled={theme?.mascotEnabled !== false}
        avatar={config?.profile?.avatar}
        name={config?.profile?.name}
      />

      <Navbar />
      
      {location.pathname === '/' && <Hero />}

      <main className={cn(
        "flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-8",
        location.pathname !== '/' && "pt-24 md:pt-32"
      )}>
        <div className="flex gap-6 lg:gap-8">
          <aside className="hidden lg:block w-[280px] shrink-0 space-y-6">
            <ProfileCard />
          </aside>

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>

          <aside className="hidden xl:block w-[280px] shrink-0 space-y-6">
            <StatsCard />
            <Calendar />
          </aside>
        </div>
      </main>

      <Footer />
      <MusicPlayer />
    </div>
  );
};
