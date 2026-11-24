import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PostCard } from '../components/PostCard';
import { WaterfallGrid } from '../components/WaterfallGrid';
import { CoverImage } from '../components/CoverImage';
import { SEO } from '../components/SEO';
import { ListSkeleton, LoadError } from '../components/ListState';
import { SectionTitle } from '../components/SectionTitle';
import { catalogIcon, useCareers, useLabs, useTutorials, type Domain } from '../lib/catalog';
import { readingMinutes, type Post } from '../data/posts';
import {
  GraduationCap, FlaskConical, Waypoints, Bot, ArrowRight, Feather, Compass, Shuffle, Clock,
} from 'lucide-react';

// 首页信息流是博客：随笔与项目实录单独成区；
// 系统教程内容通过下方的知识域 / 职业路线 / 精选推荐导流到教程中心
const BLOG_CATEGORIES = new Set(['随笔', '项目实战']);
const isTutorialPost = (p: Post) => !BLOG_CATEGORIES.has(p.category);

/** 精选推荐：每个专题轮流各取一篇，保证 8 张卡来自不同专题（offset 用于换一批） */
function pickFeatured(posts: Post[], offset: number, n = 8): Post[] {
  const byCat = new Map<string, Post[]>();
  for (const p of posts) {
    if (!isTutorialPost(p)) continue;
    const arr = byCat.get(p.category);
    if (arr) arr.push(p);
    else byCat.set(p.category, [p]);
  }
  const out: Post[] = [];
  for (let round = 0; round < 12 && out.length < n; round++) {
    for (const arr of byCat.values()) {
      const p = arr[(round + offset) % arr.length];
      if (p && !out.includes(p)) out.push(p);
      if (out.length >= n) break;
    }
  }
  return out;
}

const FeatureCard: React.FC<{ to: string; icon: React.ElementType; name: string; desc: string; stat?: string }> =
  ({ to, icon: Icon, name, desc, stat }) => (
    <Link
      to={to}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary transition-colors group-hover:text-accent">
          {name}
          <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">{desc}</p>
      </div>
      {stat && <span className="mt-auto text-xs font-medium text-text-muted">{stat}</span>}
    </Link>
  );

const DomainCard: React.FC<{ domain: Domain }> = ({ domain }) => {
  const Icon = catalogIcon(domain.icon);
  return (
    <Link
      to={`/tutorials?domain=${encodeURIComponent(domain.id)}`}
      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-bg-card p-3.5 transition-all duration-300 hover:border-accent/50 hover:bg-bg-card-hover"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-text-primary transition-colors group-hover:text-accent">{domain.name}</span>
          <span className="shrink-0 text-xs text-text-muted">{domain.count} 篇</span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-text-muted">{domain.blurb}</span>
      </span>
    </Link>
  );
};

const FeaturedCard: React.FC<{ post: Post }> = ({ post }) => (
  <Link
    to={`/post/${post.id}`}
    className="group flex gap-3 rounded-xl border border-border/60 bg-bg-card p-3 transition-all duration-300 hover:border-accent/50 hover:shadow-md"
  >
    <span className="block h-[72px] w-[108px] shrink-0 overflow-hidden rounded-lg bg-bg-base">
      <CoverImage post={post} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
    </span>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary transition-colors group-hover:text-accent [text-wrap:balance]">
        {post.title}
      </span>
      <span className="mt-auto flex items-center gap-2 pt-1.5 text-xs text-text-muted">
        <span className="max-w-[45%] truncate text-accent">{post.category}</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{readingMinutes(post)} 分钟</span>
      </span>
    </span>
  </Link>
);

export const Home: React.FC = () => {
  const { posts, config, loading, error, refreshData } = useData();
  const { data: catalog } = useTutorials();
  const { data: careers } = useCareers();
  const { data: labs } = useLabs();
  const [batch, setBatch] = useState(0);

  const blogPosts = useMemo(() => posts.filter(p => BLOG_CATEGORIES.has(p.category)), [posts]);
  const featured = useMemo(() => pickFeatured(posts, batch), [posts, batch]);
  const domains = useMemo(() => [...(catalog?.domains || [])].sort((a, b) => b.count - a.count), [catalog]);

  const totalMinutes = useMemo(
    () => (catalog?.tutorials || []).reduce((s, t) => s + (t.minutes || 0), 0),
    [catalog]
  );

  const features = [
    { to: '/tutorials', icon: GraduationCap, name: '教程中心', desc: '按知识域与职业路线组织的系统教程，每篇都配 AI 助教陪学。', stat: catalog ? `${catalog.tutorials.length} 篇 · ${catalog.domains.length} 大知识域` : '加载中…' },
    { to: '/lab', icon: FlaskConical, name: '实验室', desc: '浏览器里的真沙箱：写完即运行，AI 教练按验收标准陪你把实验做完。', stat: labs ? `${labs.length} 个配套实验` : undefined },
    { to: '/graph', icon: Waypoints, name: '知识图谱', desc: '全站内容的关系网络，2D / 3D 自由切换，顺着脉络找下一本。', stat: `${posts.length} 个节点` },
    { to: '/ai', icon: Bot, name: 'AI 馆员', desc: '本地大模型驱动的胡桃馆员，认识全馆藏书，帮你规划路线、答疑解惑。', stat: '数据不出内网' },
  ];

  return (
    <>
      <SEO
        title={`${config?.title || 'WineryBlog'} · ${config?.subtitle || ''}`.trim().replace(/ ·$/, '')}
        description="集系统教程、职业路线、知识图谱、实验室与 AI 馆员于一体的个人自学图书馆：全站内容本地化，点击不出站。"
        author={config?.author}
        keywords={['教程', '知识图谱', '自学', '计算机', ...(config?.tags || [])]}
      />
      <div className="flex flex-col gap-12">
        {/* 探索本站：四大功能入口 */}
        <section className="flex flex-col gap-5">
          <SectionTitle icon={Compass} title="探索本站" subtitle="教程、实验、图谱与 AI 馆员，都在站内" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((f) => <FeatureCard key={f.to} {...f} />)}
          </div>
        </section>

        {loading && posts.length === 0 ? (
          <ListSkeleton />
        ) : error && posts.length === 0 ? (
          <LoadError message={error} onRetry={() => void refreshData()} />
        ) : (
          <>
            {/* 知识域 */}
            {domains.length > 0 && (
              <section className="flex flex-col gap-5">
                <SectionTitle
                  icon={GraduationCap}
                  title="知识域"
                  subtitle={`${domains.length} 大知识域 · ${catalog?.tutorials.length || 0} 篇教程 · 约 ${Math.round(totalMinutes / 60)} 小时阅读量`}
                  to="/tutorials"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {domains.map((d) => <DomainCard key={d.id} domain={d} />)}
                </div>
              </section>
            )}

            {/* 职业路线 */}
            {careers && careers.length > 0 && (
              <section className="flex flex-col gap-5">
                <SectionTitle
                  icon={Waypoints}
                  title="职业路线"
                  subtitle={`${careers.length} 条路线，选一条按阶段走到底`}
                  to="/tutorials"
                />
                <div className="custom-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2">
                  {careers.map((c) => {
                    const Icon = catalogIcon(c.icon);
                    return (
                      <Link
                        key={c.id}
                        to={`/routes/${c.id}`}
                        className="group flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-bg-card py-2 pr-4 pl-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent/50 hover:text-accent"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-medium whitespace-nowrap">{c.name}</span>
                        <span className="text-xs text-text-muted">{c.stages.length} 阶段</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 精选推荐 */}
            {featured.length > 0 && (
              <section className="flex flex-col gap-5">
                <SectionTitle
                  icon={Feather}
                  title="精选推荐"
                  subtitle="每个专题各挑一篇，换一批看看别的方向"
                  to="/archive"
                  action={
                    <button
                      type="button"
                      onClick={() => setBatch((b) => b + 1)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"
                    >
                      <Shuffle className="h-3.5 w-3.5" /> 换一批
                    </button>
                  }
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {featured.map((p) => <FeaturedCard key={p.id} post={p} />)}
                </div>
              </section>
            )}

            {/* 随笔与项目 */}
            <section className="flex flex-col gap-5">
              <SectionTitle
                icon={Feather}
                title="随笔与项目"
                subtitle="教程之外，记录一些折腾过程与日常"
                to="/archive?category=项目实战"
              />
              {blogPosts.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-bg-card py-20 text-center">
                  <Feather className="h-10 w-10 text-text-muted" />
                  <p className="text-text-secondary">博客暂时还在沉淀，去教程中心看看吧。</p>
                  <Link
                    to="/tutorials"
                    className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    <GraduationCap className="h-5 w-5" /> 进入教程中心 <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <WaterfallGrid gap={20} minColumnWidth={280} maxColumns={3}>
                  {blogPosts.map((post, index) => (
                    <PostCard key={post.id} post={post} index={index} />
                  ))}
                </WaterfallGrid>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
};
