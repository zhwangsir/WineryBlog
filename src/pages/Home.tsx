import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PostCard } from '../components/PostCard';
import { motion } from 'motion/react';
import { Home as HomeIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export const Home: React.FC = () => {
  const { posts, categories } = useData();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6"
    >
      {/* Category Bar */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
        {categories.map((cat, index) => {
          const isHome = cat.isHome;
          return (
            <Link
              key={cat.name}
              to={isHome ? '/' : `/archive?category=${encodeURIComponent(cat.name)}`}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border",
                isHome 
                  ? "bg-accent/20 text-accent border-accent/30" 
                  : "bg-bg-card text-text-secondary border-border hover:bg-bg-card-hover hover:text-text-primary"
              )}
            >
              {isHome && <HomeIcon className="w-4 h-4" />}
              {!isHome && cat.name}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-md",
                isHome ? "bg-accent/20 text-accent" : "bg-bg-base text-text-muted"
              )}>
                {cat.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Posts List */}
      <div className="flex flex-col gap-4">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </motion.div>
  );
};

