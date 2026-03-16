import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const colors = [
  { name: 'Red', value: '#ff6b81', hover: '#ff8598' },
  { name: 'Blue', value: '#4c6ef5', hover: '#3b5bdb' },
  { name: 'Green', value: '#40c057', hover: '#2f9e44' },
  { name: 'Purple', value: '#8b5cf6', hover: '#a78bfa' },
  { name: 'Orange', value: '#fd7e14', hover: '#e8590c' },
];

export const ColorPicker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeColor = (color: typeof colors[0]) => {
    document.documentElement.style.setProperty('--accent', color.value);
    document.documentElement.style.setProperty('--accent-hover', color.hover);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-text-primary hover:text-accent transition-colors p-2 md:p-0"
        title="主题颜色"
      >
        <Palette className="w-4 h-4 md:w-4 md:h-4 w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 p-3 bg-bg-card border border-border rounded-xl shadow-xl z-50 flex gap-2"
          >
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => changeColor(color)}
                className="w-6 h-6 rounded-full border-2 border-transparent hover:scale-110 transition-transform focus:outline-none focus:border-text-primary"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
