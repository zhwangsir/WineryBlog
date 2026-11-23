import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Flame, FlaskConical, Layers, CalendarDays, Play, Award } from 'lucide-react';
import { SEO } from '../components/SEO';
import { fetchProgress, type ProgressData } from '../lib/progress';
import { useData } from '../context/DataContext';
import { CoverImage } from '../components/CoverImage';

const DAY = 86400000;

/** 连续学习天数：从今天（或昨天，容许今天还没学）往回连续有阅读记录的天数 */
function calcStreak(readMap: Record<string, string>): number {
  const days = new Set(Object.values(readMap).map(iso => iso.slice(0, 10)));
  if (days.size === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  let cursor = days.has(today) ? new Date() : new Date(Date.now() - DAY);
  let streak = 0;
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak++;
      cursor = new Date(cursor.getTime() - DAY);
    } else break;
  }
  return streak;
}

export const Report: React.FC = () => {
  const { posts } = useData();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  const [tutDomain, setTutDomain] = useState<Record<string, string>>({});
  const [tutTitle, setTutTitle] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProgress().then(setProgress).catch(() => {});
    fetch('/api/tutorials').then(r => r.json()).then((j) => {
      setDomains(j.domains || []);
      const dm: Record<string, string> = {};
      const tt: Record<string, string> = {};
      for (const t of j.tutorials || []) { dm[t.id] = t.domain; tt[t.id] = t.title; }
      setTutDomain(dm);
      setTutTitle(tt);
    }).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const read = progress?.read || {};
    const labs = progress?.labs || {};
    const entries = Object.entries(read); // [postId, iso]
    // 近 30 天每日阅读数
    const days: { key: string; label: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      days.push({ key: d.toISOString().slice(0, 10), label: `${d.getMonth() + 1}/${d.getDate()}`, count: 0 });
    }
    for (const [, iso] of entries) {
      const key = iso.slice(0, 10);
      const bucket = days.find(d => d.key === key);
      if (bucket) bucket.count++;
    }
    // 域分布
    const dist: Record<string, number> = {};
    for (const [pid] of entries) {
      const dm = tutDomain[pid] || '其它';
      dist[dm] = (dist[dm] || 0) + 1;
    }
    const domainRows = Object.entries(dist)
      .map(([id, count]) => ({ id, name: domains.find(d => d.id === id)?.name || id, count }))
      .sort((a, b) => b.count - a.count);
    // 最近已读（时间倒序）
    const recent = entries
      .sort((a, b) => b[1].localeCompare(a[1]))
      .slice(0, 8)
      .map(([pid, iso]) => ({
        pid,
        time: iso,
        title: posts.find(p => p.id === pid)?.title || tutTitle[pid] || pid,
        cover: posts.find(p => p.id === pid)?.cover,
      }));
    const coveredDomains = new Set(entries.map(([pid]) => tutDomain[pid]).filter(Boolean)).size;
    return {
      readCount: entries.length,
      labCount: Object.keys(labs).length,
      streak: calcStreak(read),
      days,
      domainRows,
      recent,
      coveredDomains,
      maxDay: Math.max(1, ...days.map(d => d.count)),
    };
  }, [progress, posts, tutDomain, tutTitle, domains]);

  const totalTutorials = 210;

  return (
    <>
      <SEO title="学习周报" description="我的学习进度与统计" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary flex items-center gap-3 mb-3">
              <CalendarDays className="w-9 h-9 text-accent" />
              学习周报
            </h1>
            <p className="text-lg text-text-secondary max-w-3xl">
              你在本站的学习足迹：已读、实验、连续天数与知识域覆盖，全部数据存于本站本地。
            </p>
          </div>
          <Link to="/tutorials" className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors">
            <Play className="w-4 h-4" />
            继续学习
          </Link>
        </header>

        {/* 统计卡 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: '已读文章', value: `${stats.readCount}`, sub: `占全站 ${Math.round((stats.readCount / totalTutorials) * 100)}%`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { icon: Flame, label: '连续学习', value: `${stats.streak} 天`, sub: stats.streak >= 3 ? '保持得很棒' : '今天学一篇就有火苗', color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { icon: FlaskConical, label: '完成实验', value: `${stats.labCount}`, sub: '动手才叫真的会', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { icon: Layers, label: '覆盖知识域', value: `${stats.coveredDomains} / ${domains.length || 14}`, sub: '广度也是一种深度', color: 'text-green-500', bg: 'bg-green-500/10' },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-bg-card border border-border rounded-2xl p-5"
              >
                <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm text-text-secondary">{c.label}</p>
                <p className="text-2xl font-bold text-text-primary mt-0.5">{c.value}</p>
                <p className="text-xs text-text-muted mt-1">{c.sub}</p>
              </motion.div>
            );
          })}
        </div>

        {/* 近 30 天柱状 */}
        <section className="bg-bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-text-primary mb-1">近 30 天学习节奏</h2>
          <p className="text-xs text-text-muted mb-5">每天阅读的篇数——细水长流比突击更有效</p>
          <div className="flex items-end gap-[3px] h-28">
            {stats.days.map((d, i) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className={`w-full rounded-t transition-all ${d.count > 0 ? 'bg-accent/80' : 'bg-bg-base'}`}
                  style={{ height: `${Math.max(6, (d.count / stats.maxDay) * 100)}%` }}
                  title={`${d.label}：${d.count} 篇`}
                />
                {(i % 5 === 24 || i === 29) && <span className="text-[10px] text-text-muted">{d.label}</span>}
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 域分布 */}
          <section className="bg-bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-text-primary mb-5">知识域分布</h2>
            {stats.domainRows.length === 0 ? (
              <p className="text-sm text-text-muted py-6 text-center">还没有阅读记录，从任意一篇教程开始吧。</p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.domainRows.map(row => {
                  const pct = Math.round((row.count / stats.readCount) * 100);
                  return (
                    <div key={row.id} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 text-text-secondary truncate">{row.name}</span>
                      <div className="flex-1 h-2.5 bg-bg-base rounded-full overflow-hidden">
                        <div className="h-full bg-accent/80 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs text-text-muted">{row.count} 篇 · {pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 最近已读 */}
          <section className="bg-bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold text-text-primary mb-5">最近读过</h2>
            {stats.recent.length === 0 ? (
              <p className="text-sm text-text-muted py-6 text-center">暂无记录。</p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats.recent.map(r => (
                  <Link key={r.pid} to={`/post/${r.pid}`} className="flex items-center gap-3 group">
                    <div className="w-16 h-11 rounded-lg overflow-hidden shrink-0 bg-bg-base">
                      <CoverImage post={{ id: r.pid, cover: r.cover }} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate group-hover:text-accent transition-colors">{r.title}</p>
                      <p className="text-xs text-text-muted">{new Date(r.time).toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 徽章墙（里程碑） */}
        <section className="bg-bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            里程碑
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '初来乍到', need: stats.readCount >= 1, desc: '读完第 1 篇' },
              { label: '渐入佳境', need: stats.readCount >= 10, desc: '累计 10 篇' },
              { label: '持之以恒', need: stats.streak >= 7, desc: '连续 7 天' },
              { label: '博学多识', need: stats.coveredDomains >= 7, desc: '覆盖 7 个域' },
            ].map(b => (
              <div
                key={b.label}
                className={`px-4 py-3 rounded-xl border text-center ${b.need ? 'bg-accent/10 border-accent/40' : 'bg-bg-base border-border opacity-45'}`}
              >
                <p className={`text-sm font-bold ${b.need ? 'text-accent' : 'text-text-muted'}`}>{b.need ? '🏅 ' : '🔒 '}{b.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    </>
  );
};
