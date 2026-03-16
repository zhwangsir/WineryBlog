import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PostCard } from '../components/PostCard';
import { motion } from 'motion/react';
import { Home as HomeIcon } from 'lucide-react';
import { cn } from '../utils/cn';
import { SEO } from '../components/SEO';

export const Home: React.FC = () => {
  const { posts, categories, config } = useData();
  return (
    <>
      <SEO 
        title={config?.title || 'WineryBlog'}
        description={config?.subtitle || '永远相信，美好的事情即将发生。'}
        author={config?.author}
        keywords={['博客', '技术', ...(config?.tags || [])]}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-6"
      >
      {/* Category Bar - Firefly Style */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
        {categories.map((cat) => {
          const isHome = cat.isHome;
          return (
            <Link
              key={cat.name}
              to={isHome ? '/' : `/archive?category=${encodeURIComponent(cat.name)}`}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                isHome 
                  ? "bg-accent text-white shadow-md" 
                  : "bg-bg-card text-text-secondary border border-border/50 hover:border-accent/30 hover:text-accent"
              )}
            >
              {isHome && <HomeIcon className="w-4 h-4" />}
              {!isHome && cat.name}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                isHome ? "bg-white/20 text-white" : "bg-bg-base text-text-muted"
              )}>
                {cat.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Posts Grid - Firefly Style */}
      <div className="grid grid-cols-1 gap-6">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </motion.div>
    </>
  );
};
