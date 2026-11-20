import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Route as RouteIcon, Flag, CheckCircle2, Clock, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';
import { SEO } from '../components/SEO';
import { cn } from '../utils/cn';

interface Tutorial {
  id: string; title: string; summary: string; domain: string;
  difficulty: '入门' | '进阶' | '高级'; minutes: number; href: string; prereqs: string[];
}
interface StageItem { ref: string; why: string }
interface Stage { name: string; goal: string; items: StageItem[]; checkpoint: string }
interface Career {
  id: string; name: string; icon: string; tagline: string; skills: string[];
  stages: Stage[]; capstone: { title: string; desc: string };
  extras: StageItem[];
}

const DIFF_STYLE: Record<string, string> = {
  入门: 'bg-green-500/10 text-green-500',
  进阶: 'bg-amber-500/10 text-amber-500',
  高级: 'bg-red-500/10 text-red-500',
};

export const CareerRoute: React.FC = () => {
  const { career } = useParams();
  const [data, setData] = useState<{ c: Career; tuts: Tutorial[] } | null>(null);
  const [notFound, setNotFound] = useState(false);
  // learning progress persists across visits, keyed per career route
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`route-progress:${career}`) || '{}');
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem(`route-progress:${career}`, JSON.stringify(done));
  }, [done, career]);

  useEffect(() => {
    Promise.all([
      fetch('/api/careers').then(r => r.json()),
      fetch('/api/tutorials').then(r => r.json()),
    ]).then(([cj, tj]) => {
      const c = (cj.careers || []).find((x: Career) => x.id === career);
      if (!c) { setNotFound(true); return; }
      setData({ c, tuts: tj.tutorials || [] });
    }).catch(() => setNotFound(true));
  }, [career]);

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-text-secondary">
        <RouteIcon className="w-8 h-8" />
        <p>没有找到这条路线</p>
        <Link to="/tutorials" className="text-accent hover:underline">← 返回教程中心</Link>
      </div>
    );
  }
  if (!data) {
    return <div className="flex items-center justify-center py-32 text-text-secondary"><BookOpen className="w-6 h-6 animate-pulse mr-2" /> 加载路线中…</div>;
  }

  const { c, tuts } = data;
  const find = (ref: string) => tuts.find(t => t.title === ref);
  const stageDone = (s: Stage) => s.items.every(it => !find(it.ref) || done[it.ref]);
  const allRefs = c.stages.flatMap(s => s.items.map(i => i.ref)).filter(ref => find(ref));
  const progress = allRefs.length ? Math.round(allRefs.filter(r => done[find(r)!.id]).length / allRefs.length * 100) : 0;

  return (
    <>
      <SEO title={`${c.name} 学习路线`} description={c.tagline} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col gap-10">
        {/* header */}
        <header className="flex flex-col gap-4 border-b border-border pb-8">
          <Link to="/tutorials" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> 教程中心
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary flex items-center gap-3">
            <RouteIcon className="w-9 h-9 text-accent" /> {c.name}
          </h1>
          <p className="text-lg text-text-secondary max-w-3xl">{c.tagline}</p>
          {/* progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full bg-bg-base overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm font-medium text-accent w-12 text-right">{progress}%</span>
          </div>
          {/* skills */}
          <div className="flex flex-wrap gap-2">
            {c.skills.map(s => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent">✓ {s}</span>
            ))}
          </div>
        </header>

        {/* stages */}
        <div className="relative flex flex-col gap-8">
          {c.stages.map((s, si) => (
            <motion.section
              key={s.name}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.06 }}
              className={cn(
                'relative pl-6 pb-2',
                si < c.stages.length - 1 && 'before:absolute before:left-[7px] before:top-8 before:bottom-[-32px] before:w-0.5 before:bg-border'
              )}
            >
              <span className={cn(
                'absolute left-0 top-1.5 w-4 h-4 rounded-full border-2',
                stageDone(s) ? 'bg-accent border-accent' : 'bg-bg-base border-accent/50'
              )} />
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{s.name}</h2>
                  <p className="text-sm text-text-secondary mt-1">🎯 {s.goal}</p>
                </div>

                <div className="flex flex-col gap-3">
                  {s.items.map((it, ii) => {
                    const t = find(it.ref);
                    if (!t) {
                      return (
                        <div key={ii} className="bg-bg-card border border-dashed border-border rounded-xl p-4 text-sm text-text-muted">
                          《{it.ref}》 — 教程撰写中，敬请期待
                        </div>
                      );
                    }
                    return (
                      <div key={ii} className="group bg-bg-card border border-border/60 rounded-xl p-4 hover:border-accent/50 transition-all">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => setDone(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                            className={cn(
                              'mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-md border-2 transition-colors',
                              done[t.id] ? 'bg-accent border-accent text-white' : 'border-border hover:border-accent'
                            )}
                            title="标记为已学"
                          >
                            {done[t.id] && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link to={t.href} className="font-bold text-text-primary group-hover:text-accent transition-colors">
                                {t.title}
                              </Link>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded', DIFF_STYLE[t.difficulty])}>{t.difficulty}</span>
                              <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />{t.minutes} 分钟
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">💡 {it.why}</p>
                            {t.prereqs.length > 0 && (
                              <p className="text-[11px] text-text-muted">先修：{t.prereqs.map(id => tuts.find(x => x.id === id)?.title).filter(Boolean).join('、')}</p>
                            )}
                          </div>
                          <Link to={t.href} className="shrink-0 text-xs text-accent hover:underline self-center">开始学 →</Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-start gap-2 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
                  <Flag className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-text-primary"><span className="font-bold text-accent">自测：</span>{s.checkpoint}</p>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        {/* capstone */}
        <section className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/30 rounded-2xl p-6 flex flex-col gap-3">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" /> {c.capstone.title}
          </h2>
          <p className="text-text-secondary leading-relaxed">{c.capstone.desc}</p>
        </section>

        {/* extras */}
        {c.extras.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-text-primary">选修拓展</h2>
            <div className="flex flex-col gap-2">
              {c.extras.map((it, i) => {
                const t = find(it.ref);
                return t ? (
                  <Link key={i} to={t.href} className="text-sm text-text-secondary hover:text-accent transition-colors">
                    · {t.title} <span className="text-text-muted">— {it.why}</span>
                  </Link>
                ) : (
                  <span key={i} className="text-sm text-text-muted">· 《{it.ref}》 撰写中</span>
                );
              })}
            </div>
          </section>
        )}
      </motion.div>
    </>
  );
};
