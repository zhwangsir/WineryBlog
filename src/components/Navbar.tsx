import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Search, Moon, Sun, Menu, X, Home, Archive, FileText, User } from 'lucide-react';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'motion/react';
import { SearchModal } from './SearchModal';
import { ColorPicker } from './ColorPicker';

const iconMap: Record<string, React.ElementType> = {
  Home, Archive, FileText, User
};

export const Navbar: React.FC = () => {
  const { config: siteConfig } = useData();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check initial theme
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-bg-base/90 backdrop-blur-md shadow-md py-3" : "bg-transparent py-5"
      )}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <MapPin className="w-5 h-5 text-accent group-hover:text-accent-hover transition-colors" />
            <span className="font-bold text-lg text-accent group-hover:text-accent-hover transition-colors">
              {siteConfig?.title}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {siteConfig?.nav.map((item) => {
              const Icon = iconMap[item.icon];
              const isActive = location.pathname === item.path;
              
              if (item.external) {
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-text-primary hover:text-accent transition-colors"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.name}
                  </a>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors",
                    isActive ? "text-accent" : "text-text-primary hover:text-accent"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => setSearchOpen(true)}
              className="relative group flex items-center"
            >
              <Search className="w-4 h-4 absolute left-3 text-text-secondary group-hover:text-text-primary transition-colors" />
              <div className="bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm text-text-secondary group-hover:bg-black/10 dark:group-hover:bg-white/20 transition-all w-48 text-left">
                搜索
              </div>
            </button>
            <ColorPicker />
            <button onClick={toggleTheme} className="text-text-primary hover:text-accent transition-colors">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-text-primary p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-bg-base pt-20 px-4"
          >
            <div className="flex flex-col gap-4">
              {siteConfig?.nav.map((item) => {
                const Icon = iconMap[item.icon];
                return item.external ? (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-bg-card text-text-primary"
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center gap-3 p-3 rounded-lg bg-bg-card text-text-primary"
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    {item.name}
                  </Link>
                );
              })}
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="flex items-center gap-3 p-3 rounded-lg bg-bg-card text-text-primary mt-4 border border-border"
              >
                <Search className="w-5 h-5" />
                搜索文章
              </button>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-card text-text-primary border border-border">
                <ColorPicker />
                <span>主题颜色</span>
              </div>
              <button 
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 p-3 rounded-lg bg-bg-card text-text-primary border border-border"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                {isDark ? '切换到亮色模式' : '切换到暗色模式'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
