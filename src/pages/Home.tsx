import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PostCard } from '../components/PostCard';
import { WaterfallGrid } from '../components/WaterfallGrid';
import { motion } from 'motion/react';
import { Home as HomeIcon, GraduationCap, ArrowRight, Feather } from 'lucide-react';
import { cn } from '../utils/cn';
import { SEO } from '../components/SEO';

// home feed is a blog: essays & project write-ups only.
// systematic tutorial content lives in /tutorials
const BLOG_CATEGORIES = new Set(['随笔', '项目实战']);

export const Home: React.FC = () => {
  const { posts, categories, config } = useData();

  const blogPosts = posts.filter(p => BLOG_CATEGORIES.has(p.category));
  const sortedPosts = [...blogPosts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });
  const blogCategories = categories.filter(c => c.isHome || BLOG_CATEGORIES.has(c.name));
  
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
        {blogCategories.map((cat) => {
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

      {/* Blog empty state: guide readers to the tutorial center */}
      {sortedPosts.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center bg-bg-card border border-dashed border-border rounded-2xl">
          <Feather className="w-10 h-10 text-text-muted" />
          <p className="text-text-secondary">博客暂时还在沉淀，去教程中心看看吧。</p>
          <Link
            to="/tutorials"
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-medium"
          >
            <GraduationCap className="w-5 h-5" /> 进入教程中心 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Posts Waterfall Grid - Masonry Layout */}
      <WaterfallGrid gap={24} minColumnWidth={280} maxColumns={3}>
        {sortedPosts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </WaterfallGrid>
    </motion.div>
    </>
  );
};
