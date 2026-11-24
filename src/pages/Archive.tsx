import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, Tag, Search, X, ChevronDown, Eye, Clock, Archive as ArchiveIcon } from 'lucide-react';
import { useData } from '../context/DataContext';
import { SEO } from '../components/SEO';
import { ListSkeleton, LoadError } from '../components/ListState';
import { readingMinutes, type Post } from '../data/posts';
import { cn } from '../utils/cn';

const STEP = 60;
const PREVIEW = 5;

/** 同一收录批次日期相同：这类专题按 id 的自然顺序排（题号 / 章节号），阅读顺序才对 */
const natural = (a: Post, b: Post) =>
  a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });

const PostRow: React.FC<{ post: Post; showCategory?: boolean; showDate?: boolean }> = ({ post, showCategory, showDate }) => (
  <Link
    to={`/post/${post.id}`}
    className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-bg-card"
  >
    {showDate && <time dateTime={post.date} className="w-[5.5rem] shrink-0 text-xs text-text-muted tabular-nums">{post.date}</time>}
    <span className="min-w-0 flex-1 truncate text-sm text-text-primary transition-colors group-hover:text-accent">{post.title}</span>
    {showCategory && (
      <span className="hidden max-w-[34%] shrink-0 truncate rounded bg-accent/10 px-2 py-0.5 text-xs text-accent sm:inline">{post.category}</span>
    )}
    <span className="hidden shrink-0 items-center gap-1 text-xs text-text-muted md:inline-flex">
      <Clock className="h-3 w-3" />{readingMinutes(post)} 分钟
    </span>
    {!!post.views && (
      <span className="hidden w-12 shrink-0 items-center justify-end gap-1 text-xs text-text-muted sm:inline-flex">
        <Eye className="h-3 w-3" />{post.views}
      </span>
    )}
  </Link>
);

/** 按专题分节：默认只渲染前几篇，展开才渲染其余（927 篇不再一次性铺开） */
const CategorySection: React.FC<{ name: string; posts: Post[] }> = ({ name, posts }) => {
  const [open, setOpen] = useState(false);
  const sameDay = posts.every((p) => p.date === posts[0].date);
  const ordered = useMemo(
    () => (sameDay ? [...posts].sort(natural) : [...posts].sort((a, b) => b.date.localeCompare(a.date))),
    [posts, sameDay]
  );
  const shown = open ? ordered : ordered.slice(0, PREVIEW);

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-bg-card/50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-card"
      >
        <Folder className="h-4 w-4 shrink-0 text-accent" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{name}</span>
        <span className="shrink-0 text-xs text-text-muted">{posts.length} 篇</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-text-muted transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <div className="border-t border-border/40 py-1">
        {shown.map((p) => <PostRow key={p.id} post={p} showDate={!sameDay} />)}
        {posts.length > PREVIEW && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full px-3 py-2 text-left text-xs font-medium text-accent transition-colors hover:bg-bg-card"
          >
            展开其余 {posts.length - PREVIEW} 篇 →
          </button>
        )}
      </div>
    </section>
  );
};

export const Archive: React.FC = () => {
  const { posts, tags, config, loading, error, refreshData } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState(STEP);

  const categoryFilter = searchParams.get('category') || '';
  const tagFilter = searchParams.get('tag') || '';
  const filtered = !!(categoryFilter || tagFilter || keyword.trim());

  useEffect(() => { setLimit(STEP); }, [categoryFilter, tagFilter, keyword]);

  // 全部文章：归档页自身的标题/标签/分类关键词过滤（全文检索走顶部搜索）
  const matches = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!filtered) return [];
    return posts
      .filter((p) => {
        if (categoryFilter && p.category !== categoryFilter) return false;
        if (tagFilter && !p.tags.includes(tagFilter)) return false;
        if (kw) {
          const hay = `${p.title} ${p.category} ${p.tags.join(' ')}`.toLowerCase();
          if (!kw.split(/\s+/).every((w) => hay.includes(w))) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || natural(a, b));
  }, [posts, categoryFilter, tagFilter, keyword, filtered]);

  const sections = useMemo(() => {
    const m = new Map<string, Post[]>();
    for (const p of posts) {
      const arr = m.get(p.category);
      if (arr) arr.push(p);
      else m.set(p.category, [p]);
    }
    // 博客类（随笔 / 项目实战）排最前，其余按各专题最新一篇的日期、再按篇数排
    const blogFirst = (name: string) => (name === '随笔' ? 0 : name === '项目实战' ? 1 : 2);
    return [...m.entries()]
      .map(([name, list]) => ({ name, list, latest: list.reduce((a, p) => (p.date > a ? p.date : a), ''), blog: blogFirst(name) }))
      .sort((a, b) => a.blog - b.blog || b.latest.localeCompare(a.latest) || b.list.length - a.list.length);
  }, [posts]);

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of posts) m.set(p.category, (m.get(p.category) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'));
  }, [posts]);

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of posts) for (const t of p.tags) m.set(t, (m.get(t) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN')).slice(0, 48);
  }, [posts]);

  const setParam = (key: string, value: string) => {
    const sp = new URLSearchParams(searchParams);
    if (value) sp.set(key, value); else sp.delete(key);
    setSearchParams(sp);
  };
  const clearFilters = () => {
    setSearchParams({});
    setKeyword('');
  };

  const pageTitle = categoryFilter
    ? `${categoryFilter} - 归档`
    : tagFilter
      ? `#${tagFilter} - 归档`
      : '归档';

  return (
    <>
      <SEO
        title={`${pageTitle} - ${config?.title || 'WineryBlog'}`}
        description={`归档目录：共 ${posts.length} 篇文章、${categoryCounts.length} 个专题分类`}
        author={config?.author}
      />
      <div className="flex flex-col gap-7">
        <header className="flex flex-col gap-4 border-b border-border pb-7">
          <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
            <ArchiveIcon className="h-9 w-9 text-accent" /> 归档
          </h1>
          <p className="text-base text-text-secondary md:text-lg">
            共 <strong className="text-text-primary">{posts.length}</strong> 篇文章 · {categoryCounts.length} 个专题分类 · {tags.length} 个标签
          </p>
          <label className="relative block max-w-2xl">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="按标题 / 分类 / 标签筛选…"
              aria-label="筛选归档"
              className="w-full rounded-xl border border-border/60 bg-bg-card py-2.5 pr-10 pl-10 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
            />
            {keyword && (
              <button type="button" onClick={() => setKeyword('')} aria-label="清空" className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-text-muted hover:text-text-primary">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
        </header>

        {loading && posts.length === 0 ? (
          <ListSkeleton rows={4} />
        ) : error && posts.length === 0 ? (
          <LoadError message={error} onRetry={() => void refreshData()} />
        ) : (
          <div className="flex items-start gap-6">
            {/* 左栏：分类与标签 */}
            <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-[220px] shrink-0 flex-col gap-5 overflow-y-auto custom-scrollbar lg:flex">
              <div>
                <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-text-muted uppercase">分类</p>
                <nav aria-label="分类筛选" className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => setParam('category', '')}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors',
                      !categoryFilter && !tagFilter && !keyword ? 'bg-accent/10 font-medium text-accent' : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                    )}
                  >
                    <span>全部</span><span className="text-xs text-text-muted">{posts.length}</span>
                  </button>
                  {categoryCounts.map(([name, count]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setParam('category', name)}
                      title={name}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors',
                        categoryFilter === name ? 'bg-accent/10 font-medium text-accent' : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                      )}
                    >
                      <span className="truncate">{name}</span><span className="shrink-0 text-xs text-text-muted">{count}</span>
                    </button>
                  ))}
                </nav>
              </div>
              {tagCounts.length > 0 && (
                <div>
                  <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-text-muted uppercase">标签</p>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {tagCounts.map(([tag, count]) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setParam('tag', tag === tagFilter ? '' : tag)}
                        className={cn(
                          'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                          tag === tagFilter ? 'border-accent bg-accent/15 text-accent' : 'border-border/60 bg-bg-card text-text-secondary hover:border-accent/40 hover:text-accent'
                        )}
                      >
                        {tag}<span className="ml-1 text-text-muted">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* 右栏：筛选结果或按专题分节的全量目录 */}
            <div className="min-w-0 flex-1">
              {filtered ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-text-secondary">
                      筛选出 <strong className="text-text-primary">{matches.length}</strong> 篇
                    </span>
                    {categoryFilter && (
                      <button type="button" onClick={() => setParam('category', '')} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent hover:bg-accent/20">
                        <Folder className="h-3 w-3" />{categoryFilter}<X className="h-3 w-3" />
                      </button>
                    )}
                    {tagFilter && (
                      <button type="button" onClick={() => setParam('tag', '')} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent hover:bg-accent/20">
                        <Tag className="h-3 w-3" />#{tagFilter}<X className="h-3 w-3" />
                      </button>
                    )}
                    <button type="button" onClick={clearFilters} className="text-xs text-text-muted hover:text-accent">清除筛选</button>
                  </div>
                  {matches.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border bg-bg-card/60 py-16 text-center text-text-secondary">
                      没有找到相关的文章。
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-col gap-0.5 rounded-2xl border border-border/60 bg-bg-card/40 py-2">
                        {matches.slice(0, limit).map((p) => <PostRow key={p.id} post={p} showCategory={!categoryFilter} showDate />)}
                      </div>
                      {matches.length > limit && (
                        <button
                          type="button"
                          onClick={() => setLimit((n) => n + STEP)}
                          className="rounded-xl border border-border/60 bg-bg-card py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"
                        >
                          加载更多（还有 {matches.length - limit} 篇）
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-text-muted">按专题分节 · 点击专题名展开全部</p>
                  <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-2">
                    {sections.map((s) => <CategorySection key={s.name} name={s.name} posts={s.list} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
