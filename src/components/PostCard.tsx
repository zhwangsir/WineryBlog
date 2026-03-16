import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../data/posts';
import { Calendar, Folder, Lock, Clock, Eye, Pin } from 'lucide-react';
import { motion } from 'motion/react';

interface PostCardProps {
  post: Post;
  index: number;
}

// HuTao images for random cover
const huTaoImages = [
  '/images/HuTao/hutao1.png',
  '/images/HuTao/hutao2.png',
  '/images/HuTao/hutao3.png',
  '/images/HuTao/hutao4.png',
  '/images/HuTao/hutao5.png',
  '/images/HuTao/hutao6.png',
  '/images/HuTao/hutao7.png',
  '/images/HuTao/hutao8.png',
  '/images/HuTao/hutao9.png',
  '/images/HuTao/hutao10.png',
];

// Get a random image based on post id (consistent for same post)
const getRandomImage = (id: string): string => {
  // Use post id to generate consistent random index
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % huTaoImages.length;
  return huTaoImages[index];
};

export const PostCard: React.FC<PostCardProps> = ({ post, index }) => {
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Use post cover if specified, otherwise use random HuTao image
  const coverImage = post.cover || getRandomImage(post.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-bg-card rounded-xl overflow-hidden border border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-lg relative"
    >
      {/* Pinned Badge */}
      {post.pinned && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-white text-xs font-medium shadow-lg">
          <Pin className="w-3 h-3" />
          置顶
        </div>
      )}

      {/* Cover Image */}
      <Link to={`/post/${post.id}`} className="block relative aspect-[16/9] overflow-hidden">
        <img
          src={coverImage}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Lock badge */}
        {post.isLocked && (
          <div className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <Link to={`/post/${post.id}`}>
          <h2 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors duration-300 line-clamp-2 mb-3">
            {post.title}
          </h2>
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {post.date}
          </span>
          <Link 
            to={`/archive?category=${encodeURIComponent(post.category)}`}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            <Folder className="w-3.5 h-3.5" />
            {post.category}
          </Link>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {readingTime} 分钟
          </span>
          {post.views !== undefined && post.views > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {post.views}
            </span>
          )}
        </div>

        {/* Excerpt */}
        <p className="text-sm text-text-secondary line-clamp-2 mb-4">
          {post.excerpt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <Link
              key={tag}
              to={`/archive?tag=${encodeURIComponent(tag)}`}
              className="text-xs px-2 py-1 rounded-md bg-bg-base text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
            >
              #{tag}
            </Link>
          ))}
          {post.tags.length > 3 && (
            <span className="text-xs px-2 py-1 text-text-muted">
              +{post.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
};
