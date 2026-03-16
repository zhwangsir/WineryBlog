import React from 'react';
import { useData } from '../context/DataContext';
import { motion } from 'motion/react';
import { Github, Mail, MessageCircle, Link as LinkIcon } from 'lucide-react';

export const ProfileCard: React.FC = () => {
  const { config: siteConfig } = useData();
  const socials = siteConfig?.social || [];

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'github': return <Github className="w-4 h-4" />;
      case 'mail': return <Mail className="w-4 h-4" />;
      case 'qq': return <MessageCircle className="w-4 h-4" />;
      default: return <LinkIcon className="w-4 h-4" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-bg-card rounded-2xl p-6 card-shadow border border-border/50 flex flex-col items-center gap-4 sticky top-24 group"
    >
      {/* Avatar with Firefly style */}
      <div className="relative">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-bg-base shadow-lg group-hover:scale-105 transition-transform duration-300">
          <img 
            src={siteConfig?.profile.avatar} 
            alt={siteConfig?.profile.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        {/* Online indicator */}
        <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-bg-card" />
      </div>

      {/* Name & Bio with Firefly style */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2 group-hover:text-accent transition-colors duration-300">
          {siteConfig?.profile.name}
        </h2>
        <div className="w-12 h-1 bg-gradient-to-r from-accent to-accent-hover mx-auto rounded-full mb-3 group-hover:w-20 transition-all duration-500" />
        <p className="text-sm text-text-secondary leading-relaxed">
          {siteConfig?.profile.bio}
        </p>
      </div>

      {/* Social Links with Firefly style */}
      {socials.length > 0 && (
        <div className="flex items-center gap-3 mt-2">
          {socials.map((social, index) => (
            <motion.a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-bg-base flex items-center justify-center text-text-secondary hover:bg-accent hover:text-white transition-all duration-300 border border-border/50 hover:border-accent hover:shadow-md"
              title={social.platform}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {getSocialIcon(social.platform)}
            </motion.a>
          ))}
        </div>
      )}
    </motion.div>
  );
};
