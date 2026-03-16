import React from 'react';
import { useData } from '../context/DataContext';

export const Footer: React.FC = () => {
  const { config } = useData();
  const footer = config?.footer;

  if (!footer) return null;

  return (
    <footer className="w-full border-t border-border bg-bg-base py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col items-center justify-center gap-2 text-sm text-text-secondary">
        <p>{footer.copyright}</p>
        {footer.icp && (
          <a 
            href="https://beian.miit.gov.cn/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
          >
            {footer.icp}
          </a>
        )}
        <p className="text-xs text-text-muted mt-2">
          Powered by React & Tailwind CSS
        </p>
      </div>
    </footer>
  );
};
