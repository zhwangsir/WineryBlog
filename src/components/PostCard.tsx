import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../data/posts';
import { Calendar, Folder, Lock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PostCardProps {
  post: Post;
  index: number;
}

export const PostCard: React.FC<PostCardProps> = ({ post, index }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative flex flex-col md:flex-row gap-4 p-5 rounded-2xl bg-bg-card border border-border shadow-md hover:shadow-xl hover:bg-bg-card-hover transition-all duration-300 overflow-hidden"
    >
      {/* Left Accent Bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent transform origin-left scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-out" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-3 pl-2">
        {/* Title */}
        <Link to={`/post/${post.id}`} className="flex items-center gap-2 group/title">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary group-hover/title:text-accent transition-colors line-clamp-2">
            {post.title}
          </h2>
          {post.isLocked && <Lock className="w-4 h-4 text-text-secondary shrink-0" />}
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-text-secondary">
          <div className="flex items-center gap-1.5 bg-bg-base/50 px-2 py-1 rounded-md border border-border/50">
            <Calendar className="w-3.5 h-3.5" />
            <time dateTime={post.date}>{post.date}</time>
          </div>
          <div className="flex items-center gap-1.5 bg-bg-base/50 px-2 py-1 rounded-md border border-border/50">
            <Folder className="w-3.5 h-3.5" />
            <Link to={`/archive?category=${encodeURIComponent(post.category)}`} className="hover:text-accent transition-colors">
              {post.category}
            </Link>
          </div>
        </div>

        {/* Excerpt */}
        <p className="text-text-secondary leading-relaxed text-sm md:text-base line-clamp-2 mt-1">
          {post.excerpt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              to={`/archive?tag=${encodeURIComponent(tag)}`}
              className="text-xs px-2 py-1 rounded bg-bg-base/80 text-text-muted hover:text-accent hover:bg-bg-base transition-colors border border-border/50"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Right Action Area */}
      <Link 
        to={`/post/${post.id}`} 
        className="hidden md:flex items-center justify-center w-12 shrink-0 rounded-xl bg-bg-base/30 border border-border/30 group-hover:bg-accent/10 group-hover:border-accent/30 transition-colors"
      >
        <ChevronRight className="w-6 h-6 text-text-muted group-hover:text-accent transform group-hover:translate-x-1 transition-all" />
      </Link>
    </motion.article>
  );
};
