import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Clock, GraduationCap, Route as RouteIcon, Play, CheckCircle2, Search, X, Layers,
  ArrowLeft, ChevronDown,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { fetchProgress, type ProgressData } from '../lib/progress';
import { useData } from '../context/DataContext';
import { CoverImage } from '../components/CoverImage';
import { LoadError } from '../components/ListState';
import { catalogIcon, DIFF_STYLE, useCareers, useTutorials, type Career, type Domain, type Tutorial } from '../lib/catalog';
import { cn } from '../utils/cn';

type View = 'domains' | 'routes' | 'series';
type Difficulty = '' | '入门' | '进阶' | '高级';

const VIEWS: { id: View; label: string }[] = [
  { id: 'domains', label: '知识域' },
  { id: 'routes', label: '职业路线' },
  { id: 'series', label: '专题系列' },
];

/** 教程行：难度 / 标题 / 摘要 / 分类 / 时长（compact：卡片内部的轻量行） */
const TutorialRow: React.FC<{ t: Tutorial; showCategory?: boolean; compact?: boolean }> = ({ t, showCategory, compact }) => (
  <Link
    to={t.href}
    className={cn(
      'group flex items-center gap-3 px-3.5 py-2 transition-colors duration-200',
      compact ? 'rounded-lg hover:bg-bg-base' : 'rounded-xl border border-border/60 bg-bg-card py-2.5 hover:border-accent/50 hover:bg-bg-card-hover'
    )}
  >
    <span className={cn('w-9 shrink-0 rounded text-center py-0.5 text-[11px] font-medium', DIFF_STYLE[t.difficulty] || DIFF_STYLE['进阶'])}>
      {t.difficulty || '进阶'}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold text-text-primary transition-colors group-hover:text-accent">{t.title}</span>
      {t.summary && !compact && <span className="block truncate text-xs text-text-muted">{t.summary}</span>}
    </span>
    {showCategory && t.category && (
      <span className="hidden max-w-[30%] shrink-0 truncate text-xs text-text-muted lg:inline">{t.category}</span>
    )}
    {t.minutes > 0 && (
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-text-muted">
        <Clock className="h-3 w-3" />{t.minutes}m
      </span>
    )}
  </Link>
);

/** 难度筛选 */
const DifficultyFilter: React.FC<{ value: Difficulty; onChange: (d: Difficulty) => void; counts: Record<string, number> }> = ({ value, onChange, counts }) => (
  <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="按难度筛选">
    {(['', '入门', '进阶', '高级'] as Difficulty[]).map((d) => (
      <button
        key={d}
        type="button"
        onClick={() => onChange(d)}
        aria-pressed={value === d}
        className={cn(
          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
          value === d ? 'border-accent bg-accent/15 text-accent' : 'border-border/60 bg-bg-card text-text-secondary hover:border-accent/40 hover:text-accent'
        )}
      >
        {d || '全部'} <span className="text-text-muted">{d ? counts[d] || 0 : counts.all}</span>
      </button>
    ))}
  </div>
);

/** 知识域卡片：封面 + 名称 + 前 N 篇 */
const DomainCard: React.FC<{ domain: Domain; tutorials: Tutorial[]; coverMap: Record<string, string>; onOpen: () => void }> = ({
  domain, tutorials, coverMap, onOpen,
}) => {
  const Icon = catalogIcon(domain.icon);
  const cover = tutorials.map((t) => coverMap[t.id]).find(Boolean);
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-bg-card transition-all duration-300 hover:border-accent/40 hover:shadow-md">
      <button type="button" onClick={onOpen} className="group relative h-24 shrink-0 text-left" aria-label={`查看 ${domain.name} 全部教程`}>
        {cover && <CoverImage post={{ id: domain.id, cover }} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <span className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/55 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold text-text-primary transition-colors group-hover:text-accent">{domain.name}</span>
            <span className="block text-xs text-text-muted">{domain.count} 篇教程</span>
          </span>
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-4 pt-1">
        <p className="mb-1 text-xs leading-relaxed text-text-secondary">{domain.blurb}</p>
        {tutorials.slice(0, 5).map((t) => <TutorialRow key={t.id} t={t} compact />)}
        {tutorials.length > 5 && (
          <button type="button" onClick={onOpen} className="mt-1 text-left text-xs font-medium text-accent hover:underline">
            还有 {tutorials.length - 5} 篇 → 查看全部
          </button>
        )}
      </div>
    </div>
  );
};

/** 职业路线卡：图标独占一行，标题整行排布（窄卡片里不再出现「前端工程/师」这种孤字断行） */
const CareerCard: React.FC<{ career: Career }> = ({ career }) => {
  const Icon = catalogIcon(career.icon, RouteIcon);
  return (
    <Link
      to={`/routes/${career.id}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-border/60 bg-bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-base font-bold leading-snug text-text-primary transition-colors [text-wrap:balance] group-hover:text-accent">
        {career.name}
      </span>
      <span className="text-sm leading-relaxed text-text-secondary">{career.tagline}</span>
      <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-text-muted">
        <span>{career.stages.length} 个阶段</span>
        <span>·</span>
        <span>结业 {career.skills.length} 项能力</span>
      </span>
    </Link>
  );
};

/** 专题系列：按来源仓库分组的收录教程目录（像一套分册电子书） */
const SeriesSection: React.FC<{ posts: any[] }> = ({ posts }) => {
  const groups = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const p of posts) {
      if (!p.source || !p.category) continue;
      const arr = m.get(p.category) || [];
      arr.push(p);
      m.set(p.category, arr);
    }
    return [...m.entries()]
      .map(([category, list]) => ({
        category,
        repo: list[0].source || '',
        list: list.sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.id.localeCompare(b.id)),
      }))
      .sort((a, b) => b.list.length - a.list.length);
  }, [posts]);

  if (groups.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {groups.map((g) => {
        const cover = g.list.map((p) => p.cover).find(Boolean);
        return (
          <article key={g.category} className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-bg-card transition-all duration-300 hover:border-accent/40 hover:shadow-md">
            {cover && (
              <div className="relative h-20 shrink-0">
                <CoverImage post={{ id: g.list[0].id, cover }} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-card to-transparent" />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base leading-snug font-bold text-text-primary [text-wrap:balance]">{g.category}</h3>
                <span className="shrink-0 rounded bg-accent/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-accent">{g.list.length} 篇</span>
              </div>
              <div className="flex flex-col gap-1">
                {g.list.slice(0, 6).map((p) => (
                  <Link key={p.id} to={`/post/${p.id}`} className="truncate text-sm text-text-secondary transition-colors hover:text-accent">
                    · {p.title}
                  </Link>
                ))}
              </div>
              {g.list.length > 6 && (
                <details className="group/details text-sm">
                  <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-accent select-none [&::-webkit-details-marker]:hidden">
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-open/details:rotate-180" />
                    展开全部 {g.list.length} 篇
                  </summary>
                  <div className="custom-scrollbar mt-1.5 flex max-h-72 flex-col gap-1 overflow-y-auto pl-1.5">
                    {g.list.slice(6).map((p) => (
                      <Link key={p.id} to={`/post/${p.id}`} className="truncate text-sm text-text-secondary transition-colors hover:text-accent">
                        · {p.title}
                      </Link>
                    ))}
                  </div>
                </details>
              )}
              <p className="mt-auto truncate pt-1 text-[11px] text-text-muted">来源：{g.repo}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export const Tutorials: React.FC = () => {
  const { data, error } = useTutorials();
  const { data: careers } = useCareers();
  const { posts } = useData();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('');
  const [domainDiff, setDomainDiff] = useState<Difficulty>('');

  const view = (VIEWS.find((v) => v.id === searchParams.get('view'))?.id || 'domains') as View;
  const activeDomain = searchParams.get('domain');
  const setView = (next: View) => {
    const sp = new URLSearchParams(searchParams);
    sp.delete('domain');
    if (next === 'domains') sp.delete('view'); else sp.set('view', next);
    setSearchParams(sp, { replace: true });
  };
  const openDomain = (id: string | null) => {
    const sp = new URLSearchParams(searchParams);
    sp.delete('view');
    if (id) sp.set('domain', id); else sp.delete('domain');
    setDomainDiff('');
    setSearchParams(sp);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchProgress().then(setProgress).catch(() => {});
  }, []);

  // 教程 id → 图床封面映射（posts.json 已由 assign-covers 稳定分配 cover）
  const coverMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of posts) if (p.cover) m[p.id] = p.cover;
    return m;
  }, [posts]);

  const byDomain = useMemo(() => {
    const m: Record<string, Tutorial[]> = {};
    for (const t of data?.tutorials || []) (m[t.domain] ||= []).push(t);
    return m;
  }, [data]);

  const difficultyCounts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    for (const t of data?.tutorials || []) {
      c.all++;
      c[t.difficulty] = (c[t.difficulty] || 0) + 1;
    }
    return c;
  }, [data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const words = q.split(/\s+/).filter(Boolean);
    return (data?.tutorials || [])
      .map((t) => {
        const hay = `${t.title} ${t.summary || ''} ${t.category || ''} ${(t.tags || []).join(' ')}`.toLowerCase();
        let score = 0;
        for (const w of words) {
          if (t.title.toLowerCase().includes(w)) score += 10;
          if ((t.tags || []).some((tag) => tag.toLowerCase().includes(w))) score += 4;
          if (hay.includes(w)) score += 1;
        }
        return { t, score };
      })
      .filter((x) => x.score > 0 && (!difficulty || x.t.difficulty === difficulty))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.t);
  }, [data, query, difficulty]);

  if (!data) {
    return error ? (
      <LoadError message={`教程目录加载失败（${error}）`} onRetry={() => window.location.reload()} />
    ) : (
      <div className="flex items-center justify-center py-32 text-text-secondary">
        <BookOpen className="mr-2 h-6 w-6 animate-pulse" /> 加载教程目录中…
      </div>
    );
  }

  const totalMinutes = data.tutorials.reduce((s, t) => s + t.minutes, 0);
  const readCount = Object.keys(progress?.read || {}).length;
  const seriesCount = new Set(posts.filter((p) => p.source && p.category).map((p) => p.category)).size;
  const viewCounts: Record<View, number> = { domains: data.domains.length, routes: careers?.length || 0, series: seriesCount };
  const current = activeDomain ? data.domains.find((d) => d.id === activeDomain) : undefined;
  const searching = query.trim().length > 0;
  const CurrentIcon = current ? catalogIcon(current.icon) : null;

  return (
    <>
      <SEO title="教程中心" description="按知识域与职业路线组织的完整计算机自学教程，每篇配 AI 助教" />
      <div className="flex flex-col gap-7">
        <header className="flex flex-col gap-4 border-b border-border pb-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
              <GraduationCap className="h-9 w-9 text-accent" /> 教程中心
            </h1>
            {progress && readCount > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">已学 {readCount} / {data.tutorials.length}</span>
                </div>
                {progress.lastRead && (
                  <Link
                    to={`/post/${progress.lastRead}`}
                    className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    <Play className="h-3.5 w-3.5" /> 继续学习
                  </Link>
                )}
              </div>
            )}
          </div>
          <p className="max-w-3xl text-base leading-relaxed text-text-secondary md:text-lg">
            {data.tutorials.length} 篇系统教程 · {data.domains.length} 大知识域 · {careers?.length || 0} 条职业路线 · {seriesCount} 个专题系列 · 约 {Math.round(totalMinutes / 60)} 小时阅读量。
            每篇教程都配有 <span className="font-medium text-accent">AI 助教</span>：引导式提问、讲解、检验、实操四种模式陪你学。
          </p>

          {/* 分区切换 */}
          <div role="tablist" aria-label="教程中心分区" className="flex w-fit flex-wrap gap-1 rounded-xl border border-border/60 bg-bg-card p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                role="tab"
                type="button"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                  view === v.id ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:bg-bg-base hover:text-accent'
                )}
              >
                {v.label}
                <span className={cn('ml-1.5 text-xs', view === v.id ? 'text-white/80' : 'text-text-muted')}>{viewCounts[v.id]}</span>
              </button>
            ))}
          </div>

          {/* 站内教程检索 */}
          <div className="flex flex-col gap-3">
            <label className="relative block max-w-2xl">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`在 ${data.tutorials.length} 篇教程里找：标题、标签、专题…（如：动态规划、Redis、React）`}
                aria-label="搜索教程"
                className="w-full rounded-xl border border-border/60 bg-bg-card py-2.5 pr-24 pl-10 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="清空搜索"
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-bg-base hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            {query.trim() && <DifficultyFilter value={difficulty} onChange={setDifficulty} counts={difficultyCounts} />}
          </div>
        </header>

        {/* 搜索结果：跨分区 */}
        {searching && (
          <section className="flex flex-col gap-2" aria-live="polite">
            <p className="text-sm text-text-secondary">
              找到 <strong className="text-text-primary">{results.length}</strong> 篇与「{query.trim()}」相关的教程
            </p>
            {results.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-bg-card/60 py-10 text-center text-sm text-text-muted">
                没有匹配的教程，换个关键词或清除难度筛选试试。
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {results.map((t) => <TutorialRow key={t.id} t={t} showCategory />)}
              </div>
            )}
          </section>
        )}

        {!searching && view === 'domains' && (
          <section className="flex flex-col gap-5">
            {current ? (
              <>
                <div className="flex flex-wrap items-center gap-4">
                  <button type="button" onClick={() => openDomain(null)} className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent">
                    <ArrowLeft className="h-4 w-4" /> 全部知识域
                  </button>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    {CurrentIcon && <CurrentIcon className="h-5 w-5" />}
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary">{current.name}</h2>
                    <p className="text-sm text-text-muted">{current.blurb}</p>
                  </div>
                </div>
                <DifficultyFilter value={domainDiff} onChange={setDomainDiff} counts={
                  (byDomain[current.id] || []).reduce((c: Record<string, number>, t) => { c.all++; c[t.difficulty] = (c[t.difficulty] || 0) + 1; return c; }, { all: 0 })
                } />
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                  {(byDomain[current.id] || [])
                    .filter((t) => !domainDiff || t.difficulty === domainDiff)
                    .map((t) => <TutorialRow key={t.id} t={t} showCategory />)}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
                    <Layers className="h-6 w-6 text-accent" /> 知识域
                  </h2>
                  <span className="text-sm text-text-muted">点任意知识域查看该域全部教程</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {data.domains.map((d) => (
                    <DomainCard
                      key={d.id}
                      domain={{ ...d, count: d.count || (byDomain[d.id]?.length || 0) }}
                      tutorials={byDomain[d.id] || []}
                      coverMap={coverMap}
                      onOpen={() => openDomain(d.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {!searching && view === 'routes' && (
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
                <RouteIcon className="h-6 w-6 text-accent" /> 职业路线
              </h2>
              <span className="text-sm text-text-muted">选一条路线，按阶段走到底</span>
            </div>
            {careers && careers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {careers.map((c) => <CareerCard key={c.id} career={c} />)}
              </div>
            ) : (
              <p className="text-sm text-text-muted">路线加载中…</p>
            )}
          </section>
        )}

        {!searching && view === 'series' && (
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
                <BookOpen className="h-6 w-6 text-accent" /> 专题系列
              </h2>
              <span className="text-sm text-text-muted">GitHub 高质量教程仓库收录 · 目录化整理 · 全文本地化零外跳</span>
            </div>
            <SeriesSection posts={posts} />
          </section>
        )}
      </div>
    </>
  );
};
