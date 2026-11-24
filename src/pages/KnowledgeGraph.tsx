import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, X, ChevronLeft, RotateCcw, ArrowUpRight, Route as RouteIcon, Box, Map as MapIcon,
  ChevronRight, BookOpen, Layers, Sparkles, Check,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { Graph2D, type Graph2DHandle, type GraphHover, type GraphInset } from '../components/graph/Graph2D';
import { buildGraphModel, type GraphModel, type RouteInfo, type SeriesNode } from '../lib/graphModel';
import { useCareers, useTutorials } from '../lib/catalog';
import { useData } from '../context/DataContext';
import { fetchProgress } from '../lib/progress';
import { cn } from '../utils/cn';

const Graph3D = React.lazy(() => import('../components/graph/Graph3D'));

type GraphHandle = Graph2DHandle | null;
/** 右侧信息卡连外边距占的宽度 */
const PANEL_W = 316;

/** 全站搜索：标题 / 专题名，回车在图里定位，右侧按钮直接打开文章 */
const GraphSearch: React.FC<{ model: GraphModel; onLocate: (postId: string) => void; onOpen: (postId: string) => void }> = ({ model, onLocate, onOpen }) => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return [] as { kind: 'series' | 'post'; id: string; title: string; sub: string; sid: string }[];
    const out: { kind: 'series' | 'post'; id: string; title: string; sub: string; sid: string }[] = [];
    for (const s of model.series) {
      if (s.name.toLowerCase().includes(kw)) out.push({ kind: 'series', id: s.id, title: s.name, sub: `${s.count} 篇 · 专题`, sid: s.id });
    }
    for (const s of model.series) {
      for (const pid of s.postIds) {
        const title = model.postTitle.get(pid) || pid;
        if (title.toLowerCase().includes(kw)) out.push({ kind: 'post', id: pid, title, sub: s.short, sid: s.id });
      }
    }
    return out.slice(0, 12);
  }, [model, q]);

  useEffect(() => { setIdx(0); }, [q]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (r: (typeof results)[number] | undefined) => {
    if (!r) return;
    if (r.kind === 'series') onLocate(`series:${r.sid}`);
    else onLocate(r.id);
    setOpen(false);
  };

  const highlight = (text: string) => {
    const kw = q.trim();
    if (!kw) return text;
    const i = text.toLowerCase().indexOf(kw.toLowerCase());
    if (i < 0) return text;
    return <>{text.slice(0, i)}<mark className="rounded bg-accent/30 text-accent px-0.5">{text.slice(i, i + kw.length)}</mark>{text.slice(i + kw.length)}</>;
  };

  return (
    <div ref={boxRef} className="relative w-full sm:w-auto">
      <div className="flex h-10 w-full items-center gap-2 rounded-full border border-border/60 bg-bg-card/85 px-3.5 backdrop-blur-md transition-colors focus-within:border-accent sm:w-72">
        <Search className="h-4 w-4 shrink-0 text-text-muted" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
            else if (e.key === 'Enter') pick(results[idx]);
            else if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="搜索教程或专题…"
          aria-label="搜索教程或专题"
          className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        {q && (
          <button type="button" onClick={() => { setQ(''); }} aria-label="清空搜索" className="text-text-muted hover:text-text-primary">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && q.trim() && (
        <div className="absolute top-11 right-0 z-30 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-border/60 bg-bg-card/95 shadow-2xl backdrop-blur-md">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-text-muted">没有找到与「{q.trim()}」相关的内容</p>
          ) : (
            <ul role="listbox" className="max-h-[46vh] overflow-y-auto p-1.5">
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.id}`} role="option" aria-selected={i === idx}>
                  <div
                    onMouseEnter={() => setIdx(i)}
                    className={cn('flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 transition-colors', i === idx ? 'bg-accent/10' : 'hover:bg-bg-base')}
                  >
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => pick(r)}>
                      <span className="block truncate text-sm text-text-primary">{highlight(r.title)}</span>
                      <span className="block truncate text-[11px] text-text-muted">{r.sub}</span>
                    </button>
                    {r.kind === 'post' && (
                      <button type="button" onClick={() => { onOpen(r.id); setOpen(false); }} title="直接打开文章" className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-bg-base hover:text-accent">
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export const KnowledgeGraph: React.FC = () => {
  const { posts } = useData();
  const { data: catalog } = useTutorials();
  const { data: careers } = useCareers();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const seriesId = sp.get('series');
  const domainId = sp.get('domain');
  const routeId = sp.get('route');
  const focusPostId = sp.get('post');
  const level = seriesId ? 'detail' : 'overview';

  const update = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) { if (v) next.set(k, v); else next.delete(k); }
    setSp(next, { replace: true });
  }, [sp, setSp]);

  const model = useMemo(
    () => (catalog && careers && posts.length ? buildGraphModel(posts, catalog, careers) : null),
    [posts, catalog, careers],
  );

  const [mode, setMode] = useState<'2d' | '3d'>(() => (localStorage.getItem('winery-graph-mode') === '3d' ? '3d' : '2d'));
  const [hover, setHover] = useState<GraphHover>(null);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [inset, setInset] = useState<GraphInset>({ top: 68, bottom: 16, right: 0 });
  const [tall, setTall] = useState(() => window.innerHeight >= 800);
  const [wide, setWide] = useState(() => window.innerWidth >= 768);
  const graphRef = useRef<GraphHandle>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchProgress().then((p) => setReadSet(new Set(Object.keys(p.read || {})))).catch(() => {}); }, []);
  useEffect(() => {
    const el = document.documentElement;
    const ob = new MutationObserver(() => setDark(el.classList.contains('dark')));
    ob.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => ob.disconnect();
  }, []);
  useEffect(() => { localStorage.setItem('winery-graph-mode', mode); }, [mode]);

  const current = seriesId ? model?.seriesById.get(seriesId) : null;
  const route = routeId ? model?.routes.find((r) => r.id === routeId) : null;
  const panelOpen = !!(current || route || (domainId && !seriesId));
  // 图例条要占 60–90px 高：矮视口上不显示（地图里每个星团本来就写着名字），把高度让给地图；窄屏开着信息卡时也让位
  const showLegend = !!model && tall && wide && (!panelOpen || window.innerWidth >= 640);

  // 量出工具栏 / 图例 / 贴底信息卡的实际高度，地图避开它们；宽屏上信息卡打开时把右侧也让出来（相机往左对准）
  useEffect(() => {
    const bar = barRef.current, lg = legendRef.current, sheet = sheetRef.current;
    if (!bar) return;
    const calc = () => setInset((prev) => {
      const narrow = window.innerWidth < 640;
      const next: GraphInset = {
        top: bar.offsetHeight + 28,
        bottom: lg ? lg.offsetHeight + 28 : narrow && sheet ? sheet.offsetHeight + 20 : 16,
        right: panelOpen && !narrow ? PANEL_W : 0,
      };
      return prev.top === next.top && prev.bottom === next.bottom && prev.right === next.right ? prev : next;
    });
    const ro = new ResizeObserver(calc);
    ro.observe(bar);
    if (lg) ro.observe(lg);
    if (sheet) ro.observe(sheet);
    const onWin = () => { setTall(window.innerHeight >= 800); setWide(window.innerWidth >= 768); calc(); };
    window.addEventListener('resize', onWin);
    calc();
    return () => { ro.disconnect(); window.removeEventListener('resize', onWin); };
  }, [panelOpen, showLegend, model]);

  const drill = useCallback((sid: string) => update({ series: sid, post: null, domain: null, route: null }), [update]);
  const back = useCallback(() => update({ series: null, post: null }), [update]);
  const selectDomain = useCallback((id: string | null) => update({ domain: id, route: null }), [update]);
  const selectRoute = useCallback((id: string | null) => update({ route: id, domain: null, series: null, post: null }), [update]);
  const selectMode = (m: '2d' | '3d') => setMode(m);

  // 搜索：定位到某篇文章所在的专题（或某个专题）
  const locate = useCallback((key: string) => {
    if (key.startsWith('series:')) { update({ series: key.slice(7), post: null }); return; }
    const s = model?.series.find((x) => x.postIds.includes(key));
    if (s) update({ series: s.id, post: key, domain: null, route: null });
  }, [model, update]);
  const openPost = useCallback((id: string) => navigate(`/post/${id}`), [navigate]);

  const hoverSeries = hover?.kind === 'series' && !current ? model?.seriesById.get(hover.id) : null;
  const hoverDomain = hoverSeries ? model?.domains.find((d) => d.id === hoverSeries.domain) : null;

  if (!model) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-sm text-text-muted">
        <SEO title="知识图谱" description="按知识域、专题与职业路线组织的全站知识图谱" />
        <Layers className="mr-2 h-4 w-4 animate-pulse" /> 正在整理知识图谱…
      </div>
    );
  }

  const total = model.series.reduce((a, s) => a + s.count, 0);

  return (
    <>
      <SEO title="知识图谱" description={`${model.domains.length} 个知识域、${model.series.length} 个专题、${total} 篇内容的关系网络，支持 2D / 3D 切换`} />
      <div
        className="relative h-[calc(100vh-4rem)] min-h-[480px] w-full overflow-hidden"
        style={{ background: dark ? 'radial-gradient(120% 90% at 50% 20%, #171c2b 0%, #0f1419 62%, #0b0e14 100%)' : 'radial-gradient(120% 90% at 50% 20%, #ffffff 0%, #f3f5f8 60%, #e9edf2 100%)' }}
      >
        {mode === '2d' ? (
          <Graph2D
            ref={graphRef as React.Ref<Graph2DHandle>}
            model={model}
            level={level}
            seriesId={seriesId}
            domainId={domainId}
            routeId={routeId}
            focusPostId={focusPostId}
            readSet={readSet}
            dark={dark}
            inset={inset}
            onHover={setHover}
            onDrill={drill}
            onSelectDomain={selectDomain}
            onOpenPost={openPost}
            onBack={back}
          />
        ) : (
          <React.Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-sm text-text-muted"><Box className="mr-2 h-4 w-4 animate-pulse" /> 正在加载 3D 引擎…</div>}>
            <Graph3D
              ref={graphRef as React.Ref<Graph2DHandle>}
              model={model}
              level={level}
              seriesId={seriesId}
              domainId={domainId}
              routeId={routeId}
              focusPostId={focusPostId}
              readSet={readSet}
              dark={dark}
              inset={inset}
              onHover={setHover}
              onDrill={drill}
              onSelectDomain={selectDomain}
              onOpenPost={openPost}
              onBack={back}
            />
          </React.Suspense>
        )}

        {/* 顶部工具栏 */}
        <div ref={barRef} className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap items-center gap-2 sm:inset-x-4 sm:top-4">
          <div className="pointer-events-auto flex h-10 items-center gap-1 rounded-full border border-border/60 bg-bg-card/85 pr-1 pl-1.5 backdrop-blur-md">
            {level === 'detail' ? (
              <button type="button" onClick={back} className="flex h-8 items-center gap-1 rounded-full px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-base hover:text-accent" title="返回全景（Esc）">
                <ChevronLeft className="h-4 w-4" /> 返回全景
              </button>
            ) : (
              <span className="flex h-8 items-center gap-2 pl-2.5 pr-3 text-sm font-semibold text-text-primary">
                <Layers className="h-4 w-4 text-accent" /> 知识图谱
              </span>
            )}
            <span className="hidden h-5 w-px bg-border md:block" />
            <span className="hidden items-center gap-1.5 px-3 text-xs text-text-muted md:flex">
              <span className="text-text-primary">{model.domains.length}</span> 知识域
              <span className="text-border">·</span>
              <span className="text-text-primary">{model.series.length}</span> 专题
              <span className="text-border">·</span>
              <span className="text-text-primary">{total}</span> 篇
            </span>
          </div>

          <div className="pointer-events-auto min-w-0 flex-1 sm:flex-none"><GraphSearch model={model} onLocate={locate} onOpen={openPost} /></div>

          {/* 职业路线 */}
          <div className="pointer-events-auto relative min-w-0 flex-1 sm:flex-none">
            <select
              value={routeId || ''}
              onChange={(e) => selectRoute(e.target.value || null)}
              aria-label="按职业路线查看"
              className="h-10 w-full cursor-pointer appearance-none truncate rounded-full border border-border/60 bg-bg-card/85 pr-8 pl-9 text-sm text-text-primary backdrop-blur-md transition-colors focus:border-accent focus:outline-none sm:w-auto"
            >
              <option value="">按职业路线查看</option>
              {model.routes.map((r) => <option key={r.id} value={r.id}>{r.name}（{r.stages.length} 阶段）</option>)}
            </select>
            <RouteIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-muted" />
          </div>

          <div className="pointer-events-auto ml-auto flex h-10 items-center gap-1 rounded-full border border-border/60 bg-bg-card/85 p-1 backdrop-blur-md">
            <button type="button" onClick={() => selectMode('2d')} className={cn('flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors', mode === '2d' ? 'bg-accent text-white' : 'text-text-secondary hover:text-accent')} title="平面地图">
              <MapIcon className="h-4 w-4" /> <span className="hidden sm:inline">2D 平面</span>
            </button>
            <button type="button" onClick={() => selectMode('3d')} className={cn('flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors', mode === '3d' ? 'bg-accent text-white' : 'text-text-secondary hover:text-accent')} title="三维星域">
              <Box className="h-4 w-4" /> <span className="hidden sm:inline">3D 星域</span>
            </button>
            <span className="h-5 w-px bg-border" />
            <button type="button" onClick={() => (graphRef.current as Graph2DHandle)?.fit()} className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-base hover:text-accent" title="复位视角" aria-label="复位视角">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 悬停提示：专题星体（地图上已有短名，这里给全名、篇数和去向） */}
        {hoverSeries && hoverDomain && hover && (
          <div className="pointer-events-none absolute z-30 w-max max-w-[280px] rounded-xl border border-border/60 bg-bg-card/95 px-3 py-2 text-xs leading-relaxed text-text-primary shadow-xl backdrop-blur-md" style={{ left: Math.min(hover.x + 18, window.innerWidth - 300), top: hover.y + 18 }}>
            <span className="block text-[13px] font-semibold">{hoverSeries.name}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: hoverDomain.color }} />
              {hoverSeries.count} 篇 · {hoverDomain.name} · 点击进入专题
            </span>
          </div>
        )}
        {/* 悬停提示：文章节点 */}
        {hover && hover.kind === 'post' && (
          <div className="pointer-events-none absolute z-30 w-max max-w-[260px] rounded-xl border border-border/60 bg-bg-card/95 px-3 py-2 text-xs leading-relaxed text-text-primary shadow-xl backdrop-blur-md" style={{ left: Math.min(hover.x + 16, window.innerWidth - 280), top: hover.y + 16 }}>
            <span className="line-clamp-3">{model.postTitle.get(hover.id)}</span>
            <span className="mt-1 block text-[11px] text-text-muted">{readSet.has(hover.id) ? '已读' : '未读'} · 点击阅读</span>
          </div>
        )}

        {/* 信息卡：进入专题 = 阅读顺序全表；选中知识域 / 路线 = 该域的专题清单。
            窄屏上是一张贴底的卡片，宽屏上靠右，地图相机会自动对准它左侧的空白 */}
        {panelOpen && (
          <div ref={sheetRef} className="absolute inset-x-3 bottom-3 z-20 sm:top-16 sm:right-4 sm:bottom-auto sm:left-auto sm:w-[300px]">
            <div className="max-h-[40vh] overflow-y-auto rounded-2xl border border-border/60 bg-bg-card/92 shadow-2xl backdrop-blur-md sm:max-h-[calc(100vh-11.5rem)]">
              {current ? (
                <SeriesCard series={current} readSet={readSet} model={model} onOpen={openPost} onDrill={drill} onBack={back} focus={!!focusPostId} />
              ) : route ? (
                <RouteCard model={model} route={route} readSet={readSet} onDrill={drill} onClear={() => selectRoute(null)} />
              ) : domainId ? (
                <DomainCard model={model} domainId={domainId} onDrill={drill} onClear={() => selectDomain(null)} />
              ) : null}
            </div>
          </div>
        )}

        {/* 底部图例：知识域（点击只看这一域）。矮视口不显示，地图里的星团名就是图例 */}
        {showLegend && (
          <div ref={legendRef} className="absolute inset-x-3 bottom-3 z-10 sm:inset-x-4 sm:bottom-4">
            <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border/60 bg-bg-card/80 p-2 backdrop-blur-md">
              <span className="hidden shrink-0 items-center pr-1 text-[11px] text-text-muted xl:flex">拖动平移 · 滚轮缩放 · 点击星团只看这一域</span>
              {model.domains.map((d) => {
                const active = domainId === d.id;
                const onRoute = route ? route.seriesSeq.some((sid) => model.seriesById.get(sid)?.domain === d.id) : false;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      // 在专题层里点图例：回到全景并只看这一域
                      if (active) selectDomain(null);
                      else {
                        update({ domain: d.id, route: null, series: null, post: null });
                        (graphRef.current as Graph2DHandle)?.fitDomain(d.id);
                      }
                    }}
                    title={`${d.name}：${d.seriesIds.length} 个专题 · ${d.count} 篇`}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap transition-colors',
                      active ? 'border-accent bg-accent/10 text-accent' : onRoute ? 'border-accent/40 text-text-primary' : 'border-border/40 text-text-secondary hover:border-accent/50 hover:text-text-primary',
                      !active && !onRoute && (domainId || route) && 'opacity-50',
                    )}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                    <span className="text-text-muted">{d.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {!showLegend && !panelOpen && (
          <p className="pointer-events-none absolute bottom-2 left-4 z-10 text-[11px] text-text-muted/80">拖动平移 · 滚轮 / 双指缩放 · 点击星团只看这一域</p>
        )}
      </div>
    </>
  );
};

/** 专题信息卡：专题名、进度、阅读顺序全表 */
const SeriesCard: React.FC<{
  series: SeriesNode; readSet: Set<string>; model: GraphModel; onOpen: (id: string) => void; onDrill: (id: string) => void;
  onBack: () => void; focus: boolean;
}> = ({ series, readSet, model, onOpen, onDrill, onBack, focus }) => {
  const domain = model.domains.find((d) => d.id === series.domain);
  const readCount = series.postIds.filter((id) => readSet.has(id)).length;
  const next = series.postIds.find((id) => !readSet.has(id)) || series.postIds[0];
  const into = model.edges.filter((e) => e.to === series.id).map((e) => model.seriesById.get(e.from)).filter(Boolean) as SeriesNode[];
  const outOf = model.edges.filter((e) => e.from === series.id).map((e) => model.seriesById.get(e.to)).filter(Boolean) as SeriesNode[];
  const onRoutes = model.routes.filter((r) => r.seriesSeq.includes(series.id));

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 rounded-t-2xl border-b border-border/60 bg-bg-card/95 px-4 pt-4 pb-3 backdrop-blur-md">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${domain?.color}22`, color: domain?.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: domain?.color }} />
          {domain?.name}
        </span>
        <h3 className="mt-2 text-base leading-snug font-bold text-text-primary">{series.name}</h3>
        <p className="mt-1 text-xs text-text-muted">
          {series.count} 篇 · 已读 {readCount}{series.source ? ` · 收录自 ${series.source}` : ' · 站内自研'}
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => onOpen(next)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
            <BookOpen className="h-4 w-4" /> {readCount === 0 ? '从第一篇开始' : readCount >= series.count ? '再读一遍' : '继续阅读'}
          </button>
          <button type="button" onClick={onBack} className="rounded-xl border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-accent/50 hover:text-accent">全景</button>
        </div>
        {focus && <p className="mt-2 flex items-center gap-1 text-[11px] text-accent"><Sparkles className="h-3.5 w-3.5" /> 已在图上标出你搜索的那篇文章</p>}
      </div>

      <div className="p-2">
        <p className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-text-muted">阅读顺序</p>
        <ol className="flex flex-col gap-0.5">
          {series.postIds.map((id, i) => {
            const read = readSet.has(id);
            const hot = id === next && readCount < series.count;
            return (
              <li key={id}>
                <button type="button" onClick={() => onOpen(id)} className={cn('group flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-bg-base', hot && 'bg-accent/5')}>
                  <span className={cn('mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', read ? 'bg-green-500/20 text-green-500' : hot ? 'bg-accent text-white' : 'bg-bg-base text-text-muted')}>
                    {read ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className={cn('line-clamp-2 text-[13px] leading-snug text-text-secondary group-hover:text-accent', read && 'text-text-muted line-through decoration-border')}>{model.postTitle.get(id)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {(into.length > 0 || outOf.length > 0) && (
        <div className="flex flex-col gap-3 border-t border-border/60 p-4">
          {into.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-medium tracking-wide text-text-muted">建议先学</p>
              <div className="flex flex-wrap gap-1.5">
                {into.slice(0, 5).map((s) => (
                  <button key={s.id} type="button" onClick={() => onDrill(s.id)} className="rounded-full border border-border/60 bg-bg-base px-2.5 py-0.5 text-[11px] text-text-secondary transition-colors hover:border-accent/50 hover:text-accent">{s.short}</button>
                ))}
              </div>
            </div>
          )}
          {outOf.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-medium tracking-wide text-text-muted">学完可以去</p>
              <div className="flex flex-wrap gap-1.5">
                {outOf.slice(0, 5).map((s) => (
                  <button key={s.id} type="button" onClick={() => onDrill(s.id)} className="rounded-full border border-border/60 bg-bg-base px-2.5 py-0.5 text-[11px] text-text-secondary transition-colors hover:border-accent/50 hover:text-accent">{s.short}</button>
                ))}
              </div>
            </div>
          )}
          {onRoutes.length > 0 && (
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-text-muted">
              <RouteIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              出现在路线：{onRoutes.map((r) => r.name).join('、')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/** 知识域信息卡：这一域的全部专题 */
const DomainCard: React.FC<{ model: GraphModel; domainId: string; onDrill: (id: string) => void; onClear: () => void }> = ({ model, domainId, onDrill, onClear }) => {
  const d = model.domains.find((x) => x.id === domainId);
  if (!d) return null;
  const own = d.seriesIds.map((id) => model.seriesById.get(id)!).sort((a, b) => b.count - a.count);
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-text-primary">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            {d.name}
          </h3>
          <p className="mt-1 text-xs text-text-muted">{own.length} 个专题 · {d.count} 篇</p>
        </div>
        <button type="button" onClick={onClear} className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-base hover:text-text-primary" aria-label="取消筛选"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex flex-col gap-1">
        {own.map((s) => (
          <button key={s.id} type="button" onClick={() => onDrill(s.id)} className="group flex items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-bg-base">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="min-w-0 flex-1 truncate text-[13px] text-text-secondary group-hover:text-accent">{s.name}</span>
            <span className="text-[11px] text-text-muted">{s.count} 篇</span>
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-text-muted">点击任意专题进入；点地图空白处或右上角取消筛选。</p>
    </div>
  );
};

/** 职业路线信息卡：分阶段列出经过的专题 */
const RouteCard: React.FC<{ model: GraphModel; route: RouteInfo; readSet: Set<string>; onDrill: (id: string) => void; onClear: () => void }> = ({ model, route, readSet, onDrill, onClear }) => {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-base leading-snug font-bold text-text-primary">
            <RouteIcon className="h-4 w-4 shrink-0 text-accent" />
            {route.name}
          </h3>
          <p className="mt-1 text-xs text-text-muted">{route.stages.length} 个阶段 · {route.seriesSeq.length} 个专题</p>
        </div>
        <button type="button" onClick={onClear} className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-base hover:text-text-primary" aria-label="取消路线"><X className="h-4 w-4" /></button>
      </div>
      <ol className="flex flex-col gap-3">
        {route.stages.map((st, i) => (
          <li key={`${st.name}-${i}`} className="flex gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text-primary">{st.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {st.seriesIds.map((sid) => {
                  const s = model.seriesById.get(sid);
                  if (!s) return null;
                  const read = s.postIds.filter((id) => readSet.has(id)).length;
                  return (
                    <button key={sid} type="button" onClick={() => onDrill(sid)} title={`${s.count} 篇`} className="rounded-full border border-border/60 bg-bg-base px-2.5 py-0.5 text-[11px] text-text-secondary transition-colors hover:border-accent/50 hover:text-accent">
                      {s.short} <span className="text-text-muted">{read}/{s.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
