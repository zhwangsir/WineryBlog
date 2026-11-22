import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Monitor, ServerCog, Terminal, Layers, BrainCircuit, Sigma, HardDrive,
  Shield, Smartphone, Bug, Gamepad2, Settings, Wrench, Code2, GitBranch,
  Server, ArrowRight, BookOpen, Clock, GraduationCap, Route, Play, CheckCircle2,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { fetchProgress, type ProgressData } from '../lib/progress';
import { useData } from '../context/DataContext';
import { CoverImage } from '../components/CoverImage';

interface Tutorial {
  id: string; title: string; summary: string; domain: string;
  difficulty: '入门' | '进阶' | '高级'; minutes: number; href: string;
}
interface Domain {
  id: string; name: string; icon: string; blurb: string; count: number;
}
interface Career {
  id: string; name: string; icon: string; tagline: string;
  stages: unknown[]; skills: string[];
}

const ICONS: Record<string, React.ElementType> = {
  Monitor, ServerCog, Terminal, Layers, BrainCircuit, Sigma, HardDrive,
  Shield, Smartphone, Bug, Gamepad2, Settings, Wrench, Code2, GitBranch,
  Server, Route,
};

const DIFF_STYLE: Record<string, string> = {
  入门: 'bg-green-500/10 text-green-500',
  进阶: 'bg-amber-500/10 text-amber-500',
  高级: 'bg-red-500/10 text-red-500',
};

export const Tutorials: React.FC = () => {
  const [data, setData] = useState<{ domains: Domain[]; tutorials: Tutorial[] } | null>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const { posts } = useData();
  // 教程 id → 图床封面映射（posts.json 已由 assign-covers 稳定分配 cover）
  const coverMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of posts) if (p.cover) m[p.id] = p.cover;
    return m;
  }, [posts]);

  useEffect(() => {
    fetch('/api/tutorials').then(r => r.json()).then(setData).catch(() => {});
    fetch('/api/careers').then(r => r.json()).then(j => setCareers(j.careers || [])).catch(() => {});
    fetchProgress().then(setProgress).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-32 text-text-secondary">
        <BookOpen className="w-6 h-6 animate-pulse mr-2" /> 加载教程目录中…
      </div>
    );
  }

  const shownDomains = activeDomain ? data.domains.filter(d => d.id === activeDomain) : data.domains;
  const totalMinutes = data.tutorials.reduce((s, t) => s + t.minutes, 0);

  return (
    <>
      <SEO title="教程中心" description="按知识域与职业路线组织的完整计算机自学教程" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col gap-10">
        {/* hero */}
        <header className="flex flex-col gap-4 border-b border-border pb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary flex items-center gap-3">
              <GraduationCap className="w-9 h-9 text-accent" /> 教程中心
            </h1>
            {progress && Object.keys(progress.read).length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">
                    已学 {Object.keys(progress.read).length} / {data.tutorials.length}
                  </span>
                </div>
                {progress.lastRead && (
                  <Link
                    to={`/post/${progress.lastRead}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" /> 继续学习
                  </Link>
                )}
              </div>
            )}
          </div>
          <p className="text-lg text-text-secondary max-w-3xl">
            {data.tutorials.length} 篇系统教程 · {data.domains.length} 大知识域 · 约 {Math.round(totalMinutes / 60)} 小时阅读量。
            每篇教程都配有 <span className="text-accent font-medium">AI 助教</span>：引导式提问、讲解、检验、实操四种模式陪你学。
          </p>
        </header>

        {/* career routes */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary">职业路线</h2>
            <span className="text-sm text-text-muted">选一条路线，按阶段走到底</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {careers.map((c, i) => {
              const Icon = ICONS[c.icon] || Route;
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link
                    to={`/routes/${c.id}`}
                    className="group flex flex-col gap-2.5 h-full bg-bg-card border border-border/60 rounded-2xl p-5 hover:border-accent/50 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="font-bold text-text-primary group-hover:text-accent transition-colors">{c.name}</div>
                      <ArrowRight className="w-4 h-4 ml-auto text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{c.tagline}</p>
                    <p className="text-xs text-text-muted mt-auto">
                      {c.stages.length} 个阶段 · 结业 {c.skills.length} 项能力
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* domains */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary">知识域</h2>
            {activeDomain && (
              <button onClick={() => setActiveDomain(null)} className="text-sm text-accent hover:underline">
                ← 显示全部域
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {shownDomains.map((d, i) => {
              const Icon = ICONS[d.icon] || BookOpen;
              const tuts = data.tutorials.filter(t => t.domain === d.id);
              // 域封面：取域内第一篇有图床封面的教程（coverMap 以 posts.id 为键）
              const coverPost = tuts.map(t => coverMap[t.id]).find(Boolean);
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-bg-card border border-border/60 rounded-2xl flex flex-col overflow-hidden"
                >
                  {coverPost && (
                    <div className="h-28 shrink-0">
                      <CoverImage post={{ id: d.id, cover: coverPost }} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                  <button onClick={() => setActiveDomain(d.id === activeDomain ? null : d.id)} className="flex items-center gap-3 text-left group">
                    <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="font-bold text-text-primary group-hover:text-accent transition-colors">{d.name}</div>
                      <div className="text-xs text-text-muted">{d.count} 篇教程</div>
                    </div>
                  </button>
                  <p className="text-xs text-text-secondary leading-relaxed">{d.blurb}</p>
                  <div className="flex flex-col gap-1.5">
                    {tuts.slice(0, activeDomain ? 99 : 4).map(t => (
                      <Link key={t.id} to={t.href} className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors min-w-0">
                        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${DIFF_STYLE[t.difficulty]}`}>{t.difficulty}</span>
                        <span className="truncate">{t.title}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-text-muted flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />{t.minutes}m
                        </span>
                      </Link>
                    ))}
                    {!activeDomain && tuts.length > 4 && (
                      <button onClick={() => setActiveDomain(d.id)} className="text-xs text-accent hover:underline text-left">
                        还有 {tuts.length - 4} 篇 → 查看全部
                      </button>
                    )}
                  </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </motion.div>
    </>
  );
};
