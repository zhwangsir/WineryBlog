import React from 'react';
import { motion } from 'motion/react';
import { useData } from '../context/DataContext';
import { Copyright, ChevronDown } from 'lucide-react';
import { Wave } from './Wave';

export const Hero: React.FC = () => {
  const { config: siteConfig } = useData();
  
  const scrollToContent = () => {
    const contentSection = document.getElementById('main-content');
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden group">
      {/* Background Image with Firefly style parallax */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${siteConfig?.hero.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Firefly style gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent" />
      </motion.div>

      {/* Content with Firefly style typography */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        className="relative z-10 text-center px-4"
      >
        <motion.h1 
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-6 drop-shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {siteConfig?.hero.title}
        </motion.h1>
        <motion.p 
          className="text-xl md:text-2xl lg:text-3xl text-white/90 font-medium drop-shadow-lg max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          {siteConfig?.hero.subtitle}
        </motion.p>
      </motion.div>

      {/* Credit Pill - Firefly style */}
      <motion.div 
        className="absolute bottom-24 right-6 z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white/80 text-xs font-medium hover:bg-black/50 transition-all cursor-pointer">
          <Copyright className="w-3 h-3" />
          {siteConfig?.hero.credit}
        </div>
      </motion.div>

      {/* Scroll indicator - Firefly style */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 cursor-pointer"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        onClick={scrollToContent}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
        >
          <span className="text-xs mb-2 font-medium">向下滚动</span>
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <Wave flip />
      </div>
    </div>
  );
};
