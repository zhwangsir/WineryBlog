import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useData } from '../context/DataContext';
import { Copyright } from 'lucide-react';

// Fixed background image
const HERO_BG_IMAGE = '/images/HuTao/hutao10.png';

export const Hero: React.FC = () => {
  const { config: siteConfig } = useData();
  const [heroImage, setHeroImage] = useState<string>(HERO_BG_IMAGE);

  useEffect(() => {
    // Use config hero image if specified, otherwise use fixed HuTao image
    if (siteConfig?.hero.image) {
      setHeroImage(siteConfig.hero.image);
    } else {
      setHeroImage(HERO_BG_IMAGE);
    }
  }, [siteConfig?.hero.image]);

  return (
    <div className="relative w-full h-[400px] md:h-[450px] flex items-center justify-center overflow-hidden">
      {/* Background Image - Firefly Style */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-bg-base" />
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="relative z-10 text-center px-4"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4 drop-shadow-lg">
          {siteConfig?.hero.title}
        </h1>
        <p className="text-lg md:text-xl text-white/90 font-medium drop-shadow-md">
          {siteConfig?.hero.subtitle}
        </p>
      </motion.div>

      {/* Credit Badge */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white/80 text-xs">
          <Copyright className="w-3 h-3" />
          {siteConfig?.hero.credit}
        </div>
      </div>
    </div>
  );
};
