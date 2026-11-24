import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar, Tag, ArrowLeft, ArrowRight, Lock, Loader2, Eye as ViewIcon, Eye, EyeOff,
  GraduationCap, Share2, FlaskConical, CheckCircle2, Circle, Clock, AlertTriangle, Search,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { TutorPanel } from '../components/TutorPanel';
import { fetchProgress, markRead } from '../lib/progress';
import { useLabsData } from '../lib/labs';
import { CoverImage } from '../components/CoverImage';
import { CommentSection } from '../components/CommentSection';
import { ReadingProgress } from '../components/ReadingProgress';
import { SharePoster } from '../components/SharePoster';
import { SEO } from '../components/SEO';
import { TableOfContents } from '../components/TableOfContents';
import { MarkdownView } from '../components/markdown/MarkdownView';
import { fetchPost, unlockPost, UnlockError } from '../lib/postStore';
import { readingMinutes, type Post } from '../data/posts';
import type { TocItem } from '../lib/markdown';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'missing' }
  | { status: 'ready'; post: Post };

interface CatalogItem { id: string; domain: string; title: string; href: string }
let catalogCache: CatalogItem[] | null = null;

const formatWords = (n: number) => (n >= 10000 ? `${(n / 10000).toFixed(1)} 万字` : `${n} 字`);

/** 只留文字（去掉 HTML 标签、Markdown 符号与空白），用于比较文本是否相同 */
const plain = (s: string) => s.replace(/<[^>]+>/g, '').replace(/[^\p{Script=Han}\p{L}\p{N}]/gu, '');

/** 收录文章的标题取自正文首个一级标题，页面头图已有大标题，正文里的这份去掉 */
const stripDuplicateTitle = (md: string, title: string) => {
  const m = /^\s*#\s+(.+?)\s*\n/.exec(md);
  if (!m) return md;
  const t = plain(title);
  const h = plain(m[1]);
  if (!t || !h) return md;
  if (t === h || (h.length >= 6 && (t.includes(h) || h.includes(t)))) {
    return md.slice(m[0].length).replace(/^\s*\n/, '');
  }
  return md;
};

/** 首屏骨架：头图 + 标题 + 正文行 */
const PostSkeleton: React.FC = () => (
  <div className="animate-pulse" aria-busy="true" aria-label="文章加载中">
    <div className="mb-4 h-4 w-16 rounded bg-bg-card" />
    <div className="h-48 rounded-2xl border border-border/40 bg-bg-card sm:h-60 md:h-72" />
    <div className="mt-5 flex gap-3">
      {[24, 16, 20].map((w) => (
        <div key={w} className="h-4 rounded bg-bg-card" style={{ width: `${w * 4}px` }} />
      ))}
    </div>
    <div className="mt-10 flex flex-col gap-3">
      <div className="h-6 w-2/5 rounded bg-bg-card" />
      {[100, 96, 92, 60].map((w, i) => (
        <div key={i} className="h-4 rounded bg-bg-card" style={{ width: `${w}%` }} />
      ))}
      <div className="mt-4 h-40 rounded-xl bg-bg-card" />
    </div>
  </div>
);

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { config, posts } = useData();
  // 这篇文章的配套实验（实验 id 就是文章 id，或实验的 post 字段指向它）
  const { data: labsData } = useLabsData();

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const viewCounted = useRef('');
  const hashHandled = useRef('');

  const post = state.status === 'ready' ? state.post : undefined;
  const locked = post?.locked === true;
  // 教程（非随笔）才有 AI 助教、已学标记与配套实验
  const isTutorial = !!post && post.category !== '随笔';
  const labFor = post && labsData ? Object.values(labsData.labs).find((l) => l.id === post.id || l.post === post.id) : undefined;
  const labEnv = labFor && labsData ? labsData.envs.find((e) => e.id === labFor.env) : undefined;

  const body = useMemo(
    () => stripDuplicateTitle(post?.content || '', post?.title || ''),
    [post?.id, post?.content, post?.title]
  );

  // 正文渲染组件解析完标题后回传（目录用）；内容没变就不触发重渲染
  const onHeadings = useCallback((items: TocItem[]) => {
    setHeadings((prev) =>
      prev.length === items.length && prev.every((h, i) => h.id === items[i].id) ? prev : items
    );
  }, []);

  // 正文按需获取（列表接口不再携带正文）
  useEffect(() => {
    if (!id) return;
    let dead = false;
    setState({ status: 'loading' });
    setPassword('');
    setUnlockError('');
    setHeadings([]);
    setTutorOpen(false);
    fetchPost(id)
      .then((p) => {
        if (dead) return;
        setState(p ? { status: 'ready', post: p } : { status: 'missing' });
      })
      .catch(() => {
        if (!dead) setState({ status: 'error' });
      });
    return () => {
      dead = true;
    };
  }, [id]);

  // 阅读计数（加密文章解锁后才计）
  useEffect(() => {
    if (!post || locked || viewCounted.current === post.id) return;
    viewCounted.current = post.id;
    fetch(`/api/posts/${post.id}/view`, { method: 'POST' }).catch(() => {});
  }, [post?.id, locked]);

  // 已学标记
  useEffect(() => {
    if (!post) return;
    let dead = false;
    fetchProgress()
      .then((p) => { if (!dead) setIsRead(!!p.read[post.id]); })
      .catch(() => {});
    return () => { dead = true; };
  }, [post?.id]);

  // 教程目录：上一篇/下一篇与同域推荐
  useEffect(() => {
    if (!post || !isTutorial) return;
    if (catalogCache) return;
    fetch('/api/tutorials')
      .then((r) => r.json())
      .then((j: { tutorials?: CatalogItem[] }) => {
        catalogCache = j.tutorials || [];
        // 目录到达后再算一次上下篇
        setState((s) => (s.status === 'ready' ? { ...s } : s));
      })
      .catch(() => {});
  }, [post?.id, isTutorial]);

  // 带 #锚点 进入时定位到对应小节
  useEffect(() => {
    if (!hash || !headings.length || hashHandled.current === hash) return;
    const targetId = decodeURIComponent(hash.slice(1));
    if (!headings.some((h) => h.id === targetId)) return;
    hashHandled.current = hash;
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [hash, headings]);

  const goBack = () => {
    // 站内跳转过来的就回上一页；直接打开链接的回首页
    if (window.history.length > 2 && document.referrer.startsWith(location.origin)) navigate(-1);
    else navigate('/');
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    setVerifying(true);
    try {
      const full = await unlockPost(id!, password);
      setState({ status: 'ready', post: full });
    } catch (err) {
      setUnlockError(err instanceof UnlockError ? err.message : '解锁失败，请稍后重试');
    } finally {
      setVerifying(false);
    }
  };

  // 上一篇 / 下一篇：教程按同域顺序，随笔按同分类日期
  const neighbors = (() => {
    if (!post) return null;
    if (isTutorial && catalogCache) {
      const cur = catalogCache.find((t) => t.id === post.id);
      if (cur) {
        const siblings = catalogCache.filter((t) => t.domain === cur.domain);
        const idx = siblings.findIndex((t) => t.id === cur.id);
        return {
          prev: idx > 0 ? siblings[idx - 1] : null,
          next: idx < siblings.length - 1 ? siblings[idx + 1] : null,
          related: siblings.filter((t) => t.id !== cur.id).slice(0, 4),
          domainName: cur.domain,
        };
      }
    }
    if (isTutorial) return null;
    const siblings = posts.filter((p) => p.category === post.category).sort((a, b) => a.date.localeCompare(b.date));
    const idx = siblings.findIndex((p) => p.id === post.id);
    if (idx < 0) return null;
    const toCatalog = (p: Post): CatalogItem => ({ id: p.id, domain: p.category, title: p.title, href: `/post/${p.id}` });
    return {
      prev: idx > 0 ? toCatalog(siblings[idx - 1]) : null,
      next: idx < siblings.length - 1 ? toCatalog(siblings[idx + 1]) : null,
      related: [],
      domainName: post.category,
    };
  })();

  if (state.status === 'loading') {
    return (
      <div>
        <ReadingProgress />
        <PostSkeleton />
      </div>
    );
  }

  if (state.status === 'missing' || state.status === 'error') {
    const isMissing = state.status === 'missing';
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        {isMissing ? (
          <Search className="h-12 w-12 text-text-muted" strokeWidth={1.2} />
        ) : (
          <AlertTriangle className="h-12 w-12 text-amber-500" strokeWidth={1.2} />
        )}
        <h1 className="text-3xl font-bold text-text-primary">{isMissing ? '文章未找到' : '文章加载失败'}</h1>
        <p className="text-text-secondary">
          {isMissing ? '这一页被往生堂超度了——站内没有这篇文章。' : '服务暂时没有响应，稍后重试一下。'}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {!isMissing && (
            <button
              onClick={() => {
                setState({ status: 'loading' });
                fetchPost(id!)
                  .then((p) => setState(p ? { status: 'ready', post: p } : { status: 'missing' }))
                  .catch(() => setState({ status: 'error' }));
              }}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              重试
            </button>
          )}
          <button onClick={goBack} className="rounded-xl border border-border bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/50 hover:text-accent">
            <ArrowLeft className="mr-1 inline h-4 w-4" /> 返回
          </button>
          <Link to="/tutorials" className="rounded-xl border border-border bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/50 hover:text-accent">
            去教程中心
          </Link>
        </div>
      </div>
    );
  }

  const words = post!.words || 0;
  const views = post!.views || 0;
  const siteName = config?.title || 'WineryBlog';
  const canonical = `${window.location.origin}/post/${post!.id}`;
  // 收录文章的摘要就是正文开头截出来的，和首段重复时不单独展示
  const excerptKey = plain(post!.excerpt || '').slice(0, 20);
  const showExcerpt = excerptKey.length >= 8 && !plain(body).startsWith(excerptKey);

  // 加密文章：密码交给服务端校验，通过后才下发正文
  if (locked) {
    return (
      <div className="mx-auto max-w-xl">
        <button onClick={goBack} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-accent transition-colors">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <div className="rounded-2xl border border-border bg-bg-card p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            <Lock className="h-10 w-10 text-accent" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-text-primary">{post!.title}</h1>
          <p className="mb-8 text-text-muted">{post!.excerpt || '此文章已加密，需要密码才能查看'}</p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入访问密码"
                autoFocus
                autoComplete="off"
                className="w-full rounded-xl border border-border bg-bg-base py-4 pl-12 pr-12 text-text-primary transition-all placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
                disabled={verifying}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {unlockError && <p role="alert" className="text-sm text-red-500">{unlockError}</p>}
            <button
              type="submit"
              disabled={verifying || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-medium text-white transition-all duration-300 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying ? <><Loader2 className="h-5 w-5 animate-spin" /> 验证中...</> : '解锁文章'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ReadingProgress />
      <SEO
        title={`${post!.title} - ${siteName}`}
        description={post!.excerpt}
        author={config?.author}
        keywords={post!.tags}
        ogType="article"
        ogImage={post!.cover ? `${window.location.origin}${post!.cover}` : undefined}
        canonical={canonical}
      />

      <header>
        <div className="mb-4 flex items-center justify-between">
          <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-accent">
            <ArrowLeft className="h-4 w-4" /> 返回
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"
          >
            <Share2 className="h-4 w-4" /> 分享海报
          </button>
        </div>

        {/* 头图：封面压成横幅，标题叠在底部的渐变上——正文更早进入视野 */}
        <div className="relative h-48 overflow-hidden rounded-2xl border border-border/50 bg-bg-card sm:h-60 md:h-72">
          <CoverImage post={post!} alt="" loading="eager" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/80 to-bg-base/10" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                to={`/archive?category=${encodeURIComponent(post!.category)}`}
                className="rounded-full bg-accent/15 px-2.5 py-1 font-medium text-accent backdrop-blur-sm transition-colors hover:bg-accent/25"
              >
                {post!.category}
              </Link>
              {post!.source && <span className="text-text-muted">收录自 {post!.source}</span>}
            </div>
            <h1 className="mt-3 text-3xl leading-[1.2] font-bold text-text-primary [text-wrap:balance] sm:text-4xl md:text-[2.75rem]">
              {post!.title}
            </h1>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-accent" />
            <time dateTime={post!.date}>{post!.date}</time>
          </span>
          {views > 0 && (
            <span className="inline-flex items-center gap-1.5 text-text-muted">
              <ViewIcon className="h-4 w-4" /> {views} 次阅读
            </span>
          )}
          {words > 0 && (
            <span className="inline-flex items-center gap-1.5 text-text-muted">
              <Clock className="h-4 w-4" /> {formatWords(words)} · 约 {readingMinutes(post!)} 分钟
            </span>
          )}
          {isTutorial && (
            <button
              type="button"
              onClick={async () => {
                const next = !isRead;
                setIsRead(next);
                await markRead(post!.id, next);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all ${
                isRead
                  ? 'border-green-500/30 bg-green-500/15 text-green-500'
                  : 'border-border bg-bg-card text-text-secondary hover:border-green-500/50 hover:text-green-500'
              }`}
              title={isRead ? '点击取消已学标记' : '标记为已学'}
            >
              {isRead ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              {isRead ? '已学' : '标记已学'}
            </button>
          )}
        </div>
        {post!.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {post!.tags.map((tag) => (
              <Link
                key={tag}
                to={`/archive?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-bg-card px-2 py-0.5 text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-accent"
              >
                <Tag className="h-3 w-3" /> {tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* 正文 + 目录 */}
      <div className="mt-8 flex items-start gap-8">
        <article className="min-w-0 flex-1">
          <div className="mb-6 xl:hidden">
            <TableOfContents items={headings} collapsible />
          </div>
          <div className="prose prose-lg dark:prose-invert max-w-none text-text-secondary leading-relaxed">
            {showExcerpt && (
              <p className="mb-8 border-l-4 border-accent pl-4 text-lg not-italic text-text-muted leading-relaxed">
                {post!.excerpt}
              </p>
            )}
            <MarkdownView content={body} onHeadings={onHeadings} />
          </div>
        </article>
        <aside className="sticky top-24 hidden w-[240px] shrink-0 xl:block">
          <TableOfContents items={headings} />
        </aside>
      </div>

      {/* 实验室入口：有配套示例就直接进对应环境并载入它，没有就带去实验室选环境 */}
      {isTutorial && (labFor ? (
        <Link
          to={`/lab?env=${labFor.env}&exp=${labFor.id}`}
          className="group mt-10 flex items-center gap-4 rounded-2xl border border-border bg-bg-card px-5 py-4 transition-colors hover:border-accent/50"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
            <FlaskConical className="h-5 w-5 text-accent" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-widest text-accent uppercase">配套示例 · 可选</p>
            <p className="text-base font-bold text-text-primary transition-colors group-hover:text-accent">{labFor.title}</p>
            <p className="mt-0.5 text-xs text-text-muted">
              {labEnv?.name} · {labFor.level} · 约 {labFor.minutes} 分钟 · {labEnv?.runner === 'sim' ? 'AI 仿真终端' : '浏览器里真实运行'} · 也可以直接在这个环境里自由练习
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium text-accent">打开环境</span>
          <ArrowRight className="ml-1 h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <Link
          to="/lab"
          className="group mt-10 flex items-center gap-3 rounded-2xl border border-border bg-bg-card px-5 py-4 transition-colors hover:border-accent/50"
        >
          <FlaskConical className="h-5 w-5 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-primary transition-colors group-hover:text-accent">实验室 · 按方向选择的实验环境</p>
            <p className="mt-0.5 text-xs text-text-muted">前端、JavaScript、Python、SQL、AI 提示词都能在浏览器里直接运行，想练什么由你决定</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
        </Link>
      ))}

      {neighbors && (
        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {neighbors.prev ? (
              <Link to={neighbors.prev.href} className="group rounded-xl border border-border/60 bg-bg-card p-4 transition-all hover:border-accent/50">
                <span className="text-xs text-text-muted">← 上一篇</span>
                <p className="mt-1 line-clamp-2 font-bold text-text-primary transition-colors group-hover:text-accent">{neighbors.prev.title}</p>
              </Link>
            ) : <div />}
            {neighbors.next && (
              <Link to={neighbors.next.href} className="group rounded-xl border border-border/60 bg-bg-card p-4 text-right transition-all hover:border-accent/50">
                <span className="text-xs text-text-muted">下一篇 →</span>
                <p className="mt-1 line-clamp-2 font-bold text-text-primary transition-colors group-hover:text-accent">{neighbors.next.title}</p>
              </Link>
            )}
          </div>
          {neighbors.related.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-bg-card p-4">
              <p className="mb-3 text-sm font-bold text-text-primary">
                <GraduationCap className="mr-1.5 inline h-4 w-4 text-accent" />
                同域推荐 · {neighbors.domainName}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {neighbors.related.map((t) => (
                  <Link key={t.id} to={t.href} className="truncate text-sm text-text-secondary transition-colors hover:text-accent">
                    · {t.title}
                  </Link>
                ))}
              </div>
              <Link to="/tutorials" className="mt-3 inline-block text-xs text-accent hover:underline">
                进入教程中心 →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="mt-10">
        <CommentSection postId={post!.id} />
      </div>

      {isTutorial && (
        <>
          {/* 悬浮 AI 助教入口（右下角，桌宠按钮上方） */}
          <button
            onClick={() => setTutorOpen(true)}
            className="fixed right-4 bottom-[4.5rem] z-30 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-accent-hover"
            title="AI 助教：引导 / 讲解 / 检验 / 实操"
          >
            <GraduationCap className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:inline">AI 助教</span>
          </button>
          <TutorPanel open={tutorOpen} onClose={() => setTutorOpen(false)} title={post!.title} content={post!.content || ''} />
        </>
      )}

      <SharePoster
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        post={{ id: post!.id, title: post!.title, cover: post!.cover, date: post!.date }}
        siteName={siteName}
      />
    </div>
  );
};
