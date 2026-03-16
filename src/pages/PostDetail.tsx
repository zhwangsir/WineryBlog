import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion } from 'motion/react';
import { Calendar, Tag, Folder, ArrowLeft } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const PostDetail: React.FC = () => {
  const { posts } = useData();
  const { id } = useParams<{ id: string }>();
  const post = posts.find(p => p.id === id);

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <h1 className="text-4xl font-bold text-text-primary">文章未找到</h1>
        <p className="text-text-secondary">抱歉，您访问的文章不存在。</p>
        <Link to="/" className="text-accent hover:text-accent-hover font-medium mt-4">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-12"
    >
      <header className="flex flex-col gap-6 border-b border-border pb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-accent transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary leading-tight">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-6 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            <time dateTime={post.date}>{post.date}</time>
          </div>
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-accent" />
            <Link to={`/archive?category=${encodeURIComponent(post.category)}`} className="hover:text-accent transition-colors">
              {post.category}
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-accent" />
            {post.tags.map((tag, i) => (
              <React.Fragment key={tag}>
                <Link to={`/archive?tag=${encodeURIComponent(tag)}`} className="hover:text-accent transition-colors">
                  {tag}
                </Link>
                {i < post.tags.length - 1 && <span className="text-border">,</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none text-text-secondary leading-relaxed">
        <p className="text-xl text-text-muted italic border-l-4 border-accent pl-4 mb-8">
          {post.excerpt}
        </p>
        <Markdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </Markdown>
      </div>
    </motion.article>
  );
};
