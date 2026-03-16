import React from 'react';
import { motion } from 'motion/react';
import { useData } from '../context/DataContext';
import { Copyright } from 'lucide-react';

export const Hero: React.FC = () => {
  const { config: siteConfig } = useData();
  return (
    <div className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden group">
      {/* Background Image */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${siteConfig?.hero.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-bg-base" />
      </motion.div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="relative z-10 text-center px-4 mt-16"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4 drop-shadow-lg">
          {siteConfig?.hero.title}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 font-medium drop-shadow-md">
          {siteConfig?.hero.subtitle}
        </p>
      </motion.div>

      {/* Credit Pill */}
      <div className="absolute bottom-6 right-6 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 text-xs font-medium hover:bg-black/60 transition-colors cursor-pointer">
          <Copyright className="w-3 h-3" />
          {siteConfig?.hero.credit}
        </div>
      </div>

      {/* Bottom gradient fade into background */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-base to-transparent z-0" />
    </div>
  );
};
