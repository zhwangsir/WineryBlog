import React, { useMemo } from 'react';
import { FileText, Folder, Tag, Type, Layers, CalendarDays } from 'lucide-react';
import { useData } from '../context/DataContext';

/** 站点统计：主指标取配置（随文章数据实时算出），辅助指标从列表推导 */
export const StatsCard: React.FC = () => {
  const { config: siteConfig, posts } = useData();
  const stats = siteConfig?.stats;

  // 专题系列数（带来源仓库的分类）与最近一篇文章的日期
  const meta = useMemo(() => {
    const series = new Set<string>();
    let latest = '';
    for (const p of posts) {
      if (p.source && p.category) series.add(p.category);
      if (p.date && p.date > latest) latest = p.date;
    }
    return { series: series.size, latest };
  }, [posts]);

  if (!stats) return null;

  const statItems = [
    { label: '文章', value: stats.articles, icon: FileText },
    { label: '分类', value: stats.categories, icon: Folder },
    { label: '标签', value: stats.tags, icon: Tag },
    { label: '总字数', value: stats.words, icon: Type },
  ];

  const metaItems = [
    { label: '专题系列', value: `${meta.series} 个`, icon: Layers },
    { label: '最近更新', value: meta.latest || '—', icon: CalendarDays },
    ...(stats.runningDays > 0 ? [{ label: '运行时长', value: `${stats.runningDays} 天`, icon: CalendarDays }] : []),
  ];

  return (
    <div className="rounded-xl border border-border/50 bg-bg-card p-5">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-accent" />
        <h3 className="font-bold text-text-primary">站点统计</h3>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-lg border border-transparent bg-bg-base p-3 transition-all hover:border-accent/30">
              <div className="mb-1 flex items-center gap-2 text-text-muted">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{item.label}</span>
              </div>
              <span className="text-lg font-bold text-text-primary">{item.value}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 border-t border-border/50 pt-3">
        {metaItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </div>
              <span className="text-text-secondary tabular-nums">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
