import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useData } from '../context/DataContext';
import { Copyright } from 'lucide-react';

const HERO_BG_IMAGE = '/images/HuTao/hutao10.png';

interface TypewriterProps {
  text: string;
  speed?: number;
  loop?: boolean;
  className?: string;
}

const Typewriter: React.FC<TypewriterProps> = ({ 
  text, 
  speed = 100, 
  loop = false,
  className = ''
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const indexRef = useRef(0);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (!text) return;
    
    setDisplayText('');
    indexRef.current = 0;
    setIsTyping(true);

    const typeChar = () => {
      if (indexRef.current < text.length) {
        setDisplayText(text.slice(0, indexRef.current + 1));
        indexRef.current++;
        setTimeout(typeChar, speed + Math.random() * 50);
      } else {
        setIsTyping(false);
        if (loop) {
          setTimeout(() => {
            setDisplayText('');
            indexRef.current = 0;
            setIsTyping(true);
          }, 2000);
        }
      }
    };

    const startTimeout = setTimeout(typeChar, 500);
    return () => clearTimeout(startTimeout);
  }, [text, speed, loop]);

  return (
    <span className={className}>
      {displayText}
      <span className={`inline-block w-0.5 h-[0.9em] ml-0.5 align-middle bg-white ${showCursor ? 'animate-pulse' : 'opacity-0'}`} />
    </span>
  );
};

export const Hero: React.FC = () => {
  const { config: siteConfig } = useData();
  const [heroImage, setHeroImage] = useState<string>(HERO_BG_IMAGE);

  useEffect(() => {
    if (siteConfig?.hero.image) {
      setHeroImage(siteConfig.hero.image);
    } else {
      setHeroImage(HERO_BG_IMAGE);
    }
  }, [siteConfig?.hero.image]);

  return (
    <div className="relative w-full h-[400px] md:h-[450px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-bg-base" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="relative z-10 text-center px-4"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4 drop-shadow-lg min-h-[1.2em]">
          <Typewriter 
            text={siteConfig?.hero.title || ''} 
            speed={80}
            className="inline"
          />
        </h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="text-lg md:text-xl text-white/90 font-medium drop-shadow-md"
        >
          {siteConfig?.hero.subtitle}
        </motion.p>
      </motion.div>

      <div className="absolute bottom-4 right-4 z-10">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white/80 text-xs">
          <Copyright className="w-3 h-3" />
          {siteConfig?.hero.credit}
        </div>
      </div>
    </div>
  );
};
