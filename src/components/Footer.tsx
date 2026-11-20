import React from 'react';
import { useData } from '../context/DataContext';
import { Rss, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        <div className="flex items-center gap-4 mt-2">
          <a
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-text-muted hover:text-accent transition-colors text-xs"
            title="RSS 订阅"
          >
            <Rss className="w-4 h-4" />
            RSS
          </a>
          <Link
            to="/admin"
            className="flex items-center gap-1 text-text-muted hover:text-accent transition-colors text-xs"
            title="后台管理"
          >
            <Settings className="w-4 h-4" />
            管理
          </Link>
        </div>
        <p className="text-xs text-text-muted mt-2">
          Powered by React & Tailwind CSS
        </p>
      </div>
    </footer>
  );
};
