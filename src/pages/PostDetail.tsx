import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion } from 'motion/react';
import { Calendar, Tag, Folder, ArrowLeft, Lock, Eye, EyeOff, Loader2, Eye as ViewIcon, GraduationCap } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TutorPanel } from '../components/TutorPanel';
import { CodeBlock } from '../components/CodeBlock';
import { fetchProgress, markRead } from '../lib/progress';
import { CheckCircle2, Circle } from 'lucide-react';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export const PostDetail: React.FC = () => {
  const { posts, config } = useData();
  const { id } = useParams<{ id: string }>();
  
  const post = posts.find(p => p.id === id);
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutCatalog, setTutCatalog] = useState<{ id: string; domain: string; title: string; href: string }[]>([]);
  const [isRead, setIsRead] = useState(false);
  const viewCounted = useRef(false);

  // tutorial content gets the AI tutor; blog posts don't
  const isTutorial = !!post && post.category !== '随笔';

  // load read status for this tutorial
  useEffect(() => {
    if (!post) return;
    fetchProgress().then(p => setIsRead(!!p.read[post.id])).catch(() => {});
  }, [post?.id]);

  // load catalog once for prev/next + related tutorials
  useEffect(() => {
    if (!isTutorial || tutCatalog.length) return;
    fetch('/api/tutorials').then(r => r.json())
      .then((j: { tutorials: { id: string; domain: string; title: string; href: string }[] }) => setTutCatalog(j.tutorials || []))
      .catch(() => {});
  }, [isTutorial, tutCatalog.length]);

  const neighbors = (() => {
    if (!post || !tutCatalog.length) return null;
    const cur = tutCatalog.find(t => t.id === post.id);
    if (!cur) return null;
    const siblings = tutCatalog.filter(t => t.domain === cur.domain);
    const idx = siblings.findIndex(t => t.id === cur.id);
    return {
      prev: idx > 0 ? siblings[idx - 1] : null,
      next: idx < siblings.length - 1 ? siblings[idx + 1] : null,
      related: siblings.filter(t => t.id !== cur.id).slice(0, 4),
      domainName: cur.domain,
    };
  })();

  useEffect(() => {
    if (post?.isLocked) {
      const unlockedPosts = JSON.parse(sessionStorage.getItem('unlockedPosts') || '[]');
      if (unlockedPosts.includes(post.id)) {
        setIsUnlocked(true);
      }
    }
  }, [id]);

  useEffect(() => {
    if (post?.id && !post.isLocked && !viewCounted.current) {
      viewCounted.current = true;
      fetch(`/api/posts/${post.id}/view`, { method: 'POST' });
    }
  }, [id]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const hashedInput = simpleHash(password);
    const hashedStored = simpleHash(post?.password || '');

    if (hashedInput === hashedStored || password === post?.password) {
      setIsUnlocked(true);
      const unlockedPosts = JSON.parse(sessionStorage.getItem('unlockedPosts') || '[]');
      if (!unlockedPosts.includes(post?.id)) {
        unlockedPosts.push(post?.id);
        sessionStorage.setItem('unlockedPosts', JSON.stringify(unlockedPosts));
      }
      if (post?.id) {
        fetch(`/api/posts/${post.id}/view`, { method: 'POST' });
      }
    } else {
      setError('密码错误，请重试');
    }
    setVerifying(false);
  };

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

  if (post.isLocked && !isUnlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl mx-auto"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-accent transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>

        <div className="bg-bg-card rounded-2xl p-8 border border-border text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center"
          >
            <Lock className="w-10 h-10 text-accent" />
          </motion.div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">{post.title}</h1>
          <p className="text-text-muted mb-8">此文章已加密，需要密码才能查看</p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入访问密码"
                className="w-full pl-12 pr-12 py-4 bg-bg-base border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                disabled={verifying}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={verifying || !password}
              className="w-full py-4 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  验证中...
                </>
              ) : (
                '解锁文章'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.date}>{post.date}</time>
              </div>
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                <span>{post.category}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-8"
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
          {post.views !== undefined && post.views > 0 && (
            <div className="flex items-center gap-1.5 text-text-muted">
              <ViewIcon className="w-4 h-4" />
              <span>{post.views} 次阅读</span>
            </div>
          )}
          {isTutorial && (
            <button
              type="button"
              onClick={async () => {
                const next = !isRead;
                setIsRead(next);
                await markRead(post.id, next);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                isRead
                  ? 'bg-green-500/15 text-green-500 border border-green-500/30'
                  : 'bg-bg-base text-text-secondary border border-border hover:border-green-500/50 hover:text-green-500'
              }`}
              title={isRead ? '点击取消已学标记' : '标记为已学'}
            >
              {isRead ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              {isRead ? '已学' : '标记已学'}
            </button>
          )}
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
        <Markdown remarkPlugins={[remarkGfm]} components={{ pre: CodeBlock }}>
          {post.content}
        </Markdown>
      </div>

      {/* tutorial navigation: prev/next + related */}
      {neighbors && (
        <div className="flex flex-col gap-4 border-t border-border pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {neighbors.prev ? (
              <Link to={neighbors.prev.href} className="group bg-bg-card border border-border/60 rounded-xl p-4 hover:border-accent/50 transition-all">
                <span className="text-xs text-text-muted">← 上一篇</span>
                <p className="font-bold text-text-primary group-hover:text-accent transition-colors mt-1">{neighbors.prev.title}</p>
              </Link>
            ) : <div />}
            {neighbors.next && (
              <Link to={neighbors.next.href} className="group bg-bg-card border border-border/60 rounded-xl p-4 text-right hover:border-accent/50 transition-all">
                <span className="text-xs text-text-muted">下一篇 →</span>
                <p className="font-bold text-text-primary group-hover:text-accent transition-colors mt-1">{neighbors.next.title}</p>
              </Link>
            )}
          </div>
          {neighbors.related.length > 0 && (
            <div className="bg-bg-card border border-border/60 rounded-xl p-4">
              <p className="text-sm font-bold text-text-primary mb-3">📚 相关教程（同域推荐）</p>
              <div className="flex flex-col gap-2">
                {neighbors.related.map(t => (
                  <Link key={t.id} to={t.href} className="text-sm text-text-secondary hover:text-accent transition-colors">
                    · {t.title}
                  </Link>
                ))}
              </div>
              <Link to="/tutorials" className="inline-block mt-3 text-xs text-accent hover:underline">
                进入教程中心 →
              </Link>
            </div>
          )}
        </div>
      )}

      {isTutorial && (
        <>
          {/* floating AI tutor launcher */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => setTutorOpen(true)}
            className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-accent text-white shadow-lg hover:bg-accent-hover hover:scale-105 transition-all"
            title="AI 助教：引导 / 讲解 / 检验 / 实操"
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">AI 助教</span>
          </motion.button>
          <TutorPanel
            open={tutorOpen}
            onClose={() => setTutorOpen(false)}
            title={post.title}
            content={post.content}
          />
        </>
      )}
    </motion.div>
  );
};
