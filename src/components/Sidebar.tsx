import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Archive, FileText, User, Music, ExternalLink } from 'lucide-react';
import { categories, tags } from '../data/posts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: '主页', path: '/', icon: Home },
  { name: '归档', path: '/archive', icon: Archive },
  { name: 'Memos', path: '/memos', icon: FileText, external: true, href: 'https://715654.xyz/' },
  { name: '关于我', path: '/about', icon: User },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col gap-8 py-8 px-4 md:px-6 border-r border-gray-200/50 bg-white/50 backdrop-blur-sm min-h-screen sticky top-0 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col items-center md:items-start gap-2">
        <Link to="/" className="text-2xl font-bold tracking-tight text-gray-900 hover:text-indigo-600 transition-colors">
          WineryBlog
        </Link>
        <p className="text-sm text-gray-500 italic">永远相信，美好的事情即将发生。</p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          if (item.external) {
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all group"
              >
                <Icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                <span className="text-sm font-medium">{item.name}</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </a>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group",
                isActive 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className={cn(
                "w-4 h-4",
                isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
              )} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Music Player Placeholder */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
          <Music className="w-4 h-4" />
          <h3>音乐</h3>
        </div>
        <p className="text-xs text-gray-500">暂未播放</p>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">分类</h3>
        <ul className="flex flex-col gap-1">
          {categories.map((cat) => (
            <li key={cat.name}>
              <Link 
                to={`/archive?category=${encodeURIComponent(cat.name)}`}
                className="flex items-center justify-between px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <span>{cat.name}</span>
                <span className="text-xs bg-gray-200/60 text-gray-500 px-2 py-0.5 rounded-full">{cat.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">标签</h3>
        <div className="flex flex-wrap gap-2 px-3">
          {tags.slice(0, 20).map((tag) => (
            <Link
              key={tag}
              to={`/archive?tag=${encodeURIComponent(tag)}`}
              className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors border border-gray-200/50"
            >
              {tag}
            </Link>
          ))}
          {tags.length > 20 && (
            <Link to="/archive" className="text-xs px-2.5 py-1 rounded-md text-gray-400 hover:text-gray-600 transition-colors">
              ...更多
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
};
