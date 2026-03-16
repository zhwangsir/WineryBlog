import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../data/posts';
import { Calendar, Folder, Lock, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface PostCardProps {
  post: Post;
  index: number;
}

export const PostCard: React.FC<PostCardProps> = ({ post, index }) => {
  // Calculate reading time (approx 200 words per minute)
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="group relative flex flex-col md:flex-row gap-5 p-6 rounded-2xl bg-bg-card border border-border/50 card-shadow overflow-hidden"
    >
      {/* Firefly style left accent bar with gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-accent via-accent-hover to-accent transform origin-left scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-out" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 pl-3">
        {/* Title with Firefly style */}
        <Link to={`/post/${post.id}`} className="flex items-start gap-3 group/title">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary group-hover/title:text-accent transition-colors duration-300 line-clamp-2 leading-tight">
            {post.title}
          </h2>
          {post.isLocked && (
            <div className="shrink-0 p-1.5 rounded-full bg-bg-base border border-border">
              <Lock className="w-4 h-4 text-text-secondary" />
            </div>
          )}
        </Link>

        {/* Meta with Firefly style pills */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-base border border-border/50 hover:border-accent/30 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <time dateTime={post.date} className="font-medium">{post.date}</time>
          </div>
          <Link 
            to={`/archive?category=${encodeURIComponent(post.category)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-base border border-border/50 hover:border-accent/30 hover:text-accent transition-all"
          >
            <Folder className="w-3.5 h-3.5" />
            <span className="font-medium">{post.category}</span>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-base border border-border/50">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">{readingTime} 分钟</span>
          </div>
        </div>

        {/* Excerpt with better typography */}
        <p className="text-text-secondary leading-relaxed line-clamp-2">
          {post.excerpt}
        </p>

        {/* Tags with Firefly style */}
        <div className="flex flex-wrap items-center gap-2 mt-auto">
          {post.tags.slice(0, 5).map((tag) => (
            <Link
              key={tag}
              to={`/archive?tag=${encodeURIComponent(tag)}`}
              className="text-xs px-3 py-1.5 rounded-full bg-accent/5 text-text-secondary hover:text-accent hover:bg-accent/10 transition-all duration-300 border border-transparent hover:border-accent/20"
            >
              #{tag}
            </Link>
          ))}
          {post.tags.length > 5 && (
            <span className="text-xs px-2 py-1 text-text-muted">
              +{post.tags.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Right Action Area - Firefly style */}
      <Link 
        to={`/post/${post.id}`} 
        className="hidden md:flex items-center justify-center w-14 shrink-0 rounded-xl bg-gradient-to-br from-bg-base to-bg-card border border-border/50 group-hover:from-accent/5 group-hover:to-accent/10 group-hover:border-accent/30 transition-all duration-300"
      >
        <ChevronRight className="w-6 h-6 text-text-muted group-hover:text-accent transform group-hover:translate-x-1 transition-all duration-300" />
      </Link>
    </motion.article>
  );
};
