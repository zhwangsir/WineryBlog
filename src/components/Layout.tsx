import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { ProfileCard } from './ProfileCard';
import { StatsCard } from './StatsCard';
import { Footer } from './Footer';
import { MusicPlayer } from './MusicPlayer';
import { Wave } from './Wave';
import { ParticleWave } from './ParticleWave';
import { ParticleBackground } from './ParticleBackground';
import { FireflyBackground } from './FireflyBackground';
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
      // Simple hover color calculation (just slightly lighter/darker, or same for simplicity)
      document.documentElement.style.setProperty('--accent-hover', theme.accentColor);
    }

    let styleEl: HTMLStyleElement | null = null;

    if (theme?.cursorUrl) {
      document.documentElement.style.setProperty('cursor', `url(${theme.cursorUrl}), auto`);
      // Also apply to common interactive elements to ensure it overrides defaults
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
      {/* Optional overlay if background image is set, to ensure readability */}
      {theme?.globalBackground && (
        <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-[2px] z-[-1]" />
      )}

      {/* Background Effects */}
      <FireflyBackground />
      <ParticleBackground />

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
      
      {/* Hero Section with Wave */}
      {location.pathname === '/' && (
        <div className="relative">
          <Hero />
          {/* Wave at bottom of Hero */}
          {theme?.waveEnabled !== false && (
            <div className="absolute bottom-0 left-0 right-0 z-10">
              {theme?.waveStyle === 'dynamic' ? (
                <ParticleWave />
              ) : (
                <Wave 
                  style={theme?.waveStyle as 'smooth' | 'dynamic' || 'smooth'}
                  speed={theme?.waveSpeed as 'slow' | 'normal' | 'fast' || 'normal'}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main id="main-content" className={cn(
        "flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 flex gap-6 lg:gap-8 relative z-0",
        location.pathname !== '/' && "pt-24 md:pt-32"
      )}>
        
        {/* Left Sidebar (Profile) */}
        <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
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

        {/* Right Sidebar (Stats) */}
        <aside className="hidden xl:block w-64 shrink-0 relative">
          <StatsCard />
        </aside>
        
      </main>

      {/* Bottom Wave - before Footer */}
      {theme?.waveEnabled !== false && (
        <div className="relative">
          {theme?.waveStyle === 'dynamic' ? (
            <ParticleWave flip />
          ) : (
            <Wave 
              flip
              style={theme?.waveStyle as 'smooth' | 'dynamic' || 'smooth'}
              speed={theme?.waveSpeed as 'slow' | 'normal' | 'fast' || 'normal'}
            />
          )}
        </div>
      )}

      <Footer />
      <MusicPlayer />
    </div>
  );
};

