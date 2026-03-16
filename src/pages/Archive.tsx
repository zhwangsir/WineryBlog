import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion } from 'motion/react';
import { Calendar, Tag, Folder } from 'lucide-react';

export const Archive: React.FC = () => {
  const { posts } = useData();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const tagFilter = searchParams.get('tag');

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (categoryFilter && post.category !== categoryFilter) return false;
      if (tagFilter && !post.tags.includes(tagFilter)) return false;
      return true;
    });
  }, [categoryFilter, tagFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-12"
    >
      <header className="flex flex-col gap-4 border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
          归档
        </h1>
        {categoryFilter && (
          <p className="text-lg text-text-secondary flex items-center gap-2">
            <Folder className="w-5 h-5 text-accent" />
            分类：<span className="font-medium text-text-primary">{categoryFilter}</span>
          </p>
        )}
        {tagFilter && (
          <p className="text-lg text-text-secondary flex items-center gap-2">
            <Tag className="w-5 h-5 text-accent" />
            标签：<span className="font-medium text-text-primary">{tagFilter}</span>
          </p>
        )}
        {!categoryFilter && !tagFilter && (
          <p className="text-lg text-text-secondary">
            共计 {posts.length} 篇文章。
          </p>
        )}
      </header>

      <div className="flex flex-col gap-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {filteredPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-bg-base bg-bg-card text-accent shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform duration-300 group-hover:scale-110">
              <Calendar className="w-4 h-4" />
            </div>
            
            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-bg-card shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col gap-2">
                <time className="text-sm font-medium text-accent">{post.date}</time>
                <Link to={`/post/${post.id}`} className="text-xl font-bold text-text-primary hover:text-accent transition-colors">
                  {post.title}
                </Link>
                <div className="flex items-center gap-3 text-sm text-text-secondary mt-2">
                  <span className="flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5" />
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    {post.tags[0]}
                    {post.tags.length > 1 && ` +${post.tags.length - 1}`}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {filteredPosts.length === 0 && (
        <div className="text-center py-20 text-text-secondary">
          没有找到相关的文章。
        </div>
      )}
    </motion.div>
  );
};
