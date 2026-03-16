import React, { useEffect } from 'react';
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
  const { config } = useData();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  // Don't apply layout to admin routes
  if (location.pathname.startsWith('/admin')) {
    return <Outlet />;
  }

  const theme = config?.theme;

  useEffect(() => {
    if (theme?.accentColor) {
      document.documentElement.style.setProperty('--accent', theme.accentColor);
      document.documentElement.style.setProperty('--accent-hover', theme.accentColor);
    }

    let styleEl: HTMLStyleElement | null = null;

    if (theme?.cursorUrl) {
      document.documentElement.style.setProperty('cursor', `url(${theme.cursorUrl}), auto`);
      styleEl = document.createElement('style');
      styleEl.innerHTML = `
        * { cursor: url(${theme.cursorUrl}), auto !important; }
      `;
      document.head.appendChild(styleEl);
    } else {
      document.documentElement.style.removeProperty('cursor');
    }

    return () => {
      if (styleEl && document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
    };
  }, [theme]);

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
      {/* Optional overlay if background image is set */}
      {theme?.globalBackground && (
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-[2px] z-[-1]" />
      )}

      {/* Sakura Effect - Firefly Style */}
      <Sakura 
        enabled={theme?.sakuraEnabled !== false}
        density={theme?.sakuraDensity || 50}
        speed={theme?.sakuraSpeed as 'slow' | 'normal' | 'fast' || 'normal'}
      />

      {/* Mascot - Firefly Style */}
      <Mascot 
        enabled={theme?.mascotEnabled !== false}
        avatar={config?.profile?.avatar}
        name={config?.profile?.name}
      />

      <Navbar />
      
      {/* Hero Section - No Wave */}
      {location.pathname === '/' && <Hero />}

      {/* Main Content Area - Firefly Style */}
      <main className={cn(
        "flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-8",
        location.pathname !== '/' && "pt-24 md:pt-32"
      )}>
        <div className="flex gap-6 lg:gap-8">
          {/* Left Sidebar */}
          <aside className="hidden lg:block w-[280px] shrink-0 space-y-6">
            <ProfileCard />
          </aside>

          {/* Center Content */}
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

          {/* Right Sidebar */}
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
