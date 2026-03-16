import React from 'react';
import { useData } from '../context/DataContext';
import { motion } from 'motion/react';
import { Github, Twitter, Mail, Link as LinkIcon } from 'lucide-react';

export const ProfileCard: React.FC = () => {
  const { config: siteConfig } = useData();
  const socials = siteConfig?.social || [];

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'github': return <Github className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'mail': return <Mail className="w-4 h-4" />;
      default: return <LinkIcon className="w-4 h-4" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-bg-card rounded-2xl p-6 shadow-lg border border-border flex flex-col items-center gap-4 sticky top-24 group"
    >
      {/* Avatar */}
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-bg-base shadow-inner group-hover:scale-105 transition-transform duration-300">
        <img 
          src={siteConfig?.profile.avatar} 
          alt={siteConfig?.profile.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Name & Bio */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary mb-1 group-hover:text-accent transition-colors">
          {siteConfig?.profile.name}
        </h2>
        <div className="w-8 h-1 bg-accent mx-auto rounded-full mb-3 group-hover:w-16 transition-all duration-300" />
        <p className="text-sm text-text-secondary leading-relaxed">
          {siteConfig?.profile.bio}
        </p>
      </div>

      {/* Social Links */}
      {socials.length > 0 && (
        <div className="flex items-center gap-3 mt-2">
          {socials.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-bg-base flex items-center justify-center text-text-secondary hover:bg-accent hover:text-white transition-colors border border-border"
              title={social.platform}
            >
              {getSocialIcon(social.platform)}
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );
};
