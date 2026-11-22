import React, { useEffect, useMemo, useState } from 'react';
import { Search, ExternalLink, Clock, Layers, GraduationCap, Loader2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';

interface TutItem {
  id: string;
  kind?: string;
  title: string;
  summary?: string;
  domain: string;
  difficulty?: string;
  minutes?: number;
  tags?: string[];
  prereqs?: string[];
  href?: string;
}
interface Domain {
  id: string;
  name: string;
  icon?: string;
  blurb?: string;
  count: number;
}

const DIFF_COLOR: Record<string, string> = {
  '入门': 'bg-green-500/10 text-green-500',
  '初级': 'bg-green-500/10 text-green-500',
  '进阶': 'bg-blue-500/10 text-blue-500',
  '中级': 'bg-blue-500/10 text-blue-500',
  '高级': 'bg-purple-500/10 text-purple-500',
  '高级+': 'bg-purple-500/10 text-purple-500',
};

export const ManageTutorials: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [tutorials, setTutorials] = useState<TutItem[]>([]);
  const [activeDomain, setActiveDomain] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tutorials');
        if (res.ok) {
          const data = await res.json();
          setDomains(Array.isArray(data.domains) ? data.domains : []);
          setTutorials(Array.isArray(data.tutorials) ? data.tutorials : []);
        }
      } catch { /* 静默 */ }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return tutorials.filter(t =>
      (activeDomain === 'all' || t.domain === activeDomain) &&
      (!kw || t.title.toLowerCase().includes(kw) || (t.tags || []).some(tag => tag.toLowerCase().includes(kw)))
    );
  }, [tutorials, activeDomain, searchTerm]);

  const domainName = (id: string) => domains.find(d => d.id === id)?.name || id;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-text-primary mb-2">教程管理</h1>
        <p className="text-text-secondary">
          {loading ? '加载中…' : `${tutorials.length} 篇教程 · ${domains.length} 大领域 · 与博客文章同库存储`}
        </p>
      </header>

      {/* 域选择 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setActiveDomain('all'); setSearchTerm(''); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${activeDomain === 'all' ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-bg-card border-border text-text-secondary hover:border-accent/40'}`}
        >
          全部 ({tutorials.length})
        </button>
        {domains.map(d => (
          <button
            key={d.id}
            onClick={() => { setActiveDomain(d.id); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${activeDomain === d.id ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-bg-card border-border text-text-secondary hover:border-accent/40'}`}
          >
            {d.name} ({d.count})
          </button>
        ))}
      </div>

      {/* 搜索 */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="搜索教程标题 / 标签…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-bg-card border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-base/50 text-text-secondary text-sm">
                  <th className="p-4 font-medium">教程标题</th>
                  <th className="p-4 font-medium whitespace-nowrap">领域</th>
                  <th className="p-4 font-medium whitespace-nowrap">难度</th>
                  <th className="p-4 font-medium whitespace-nowrap">时长</th>
                  <th className="p-4 font-medium whitespace-nowrap">先修</th>
                  <th className="p-4 font-medium text-right whitespace-nowrap">查看</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.slice(0, 100).map(t => (
                  <tr key={t.id} className="hover:bg-bg-base/50 transition-colors">
                    <td className="p-4 max-w-[420px]">
                      <div className="font-medium text-text-primary truncate" title={t.title}>{t.title}</div>
                      {t.summary && <div className="text-xs text-text-muted truncate mt-1">{t.summary}</div>}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-md text-xs font-medium whitespace-nowrap">
                        {domainName(t.domain)}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {t.difficulty ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFF_COLOR[t.difficulty] || 'bg-bg-base text-text-secondary'}`}>
                          {t.difficulty}
                        </span>
                      ) : <span className="text-text-muted text-xs">—</span>}
                    </td>
                    <td className="p-4 text-sm text-text-secondary whitespace-nowrap">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{t.minutes ? `${t.minutes} 分钟` : '—'}</span>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">
                      {t.prereqs?.length ? (
                        <span className="flex items-center gap-1 whitespace-nowrap"><Layers className="w-3.5 h-3.5" />{t.prereqs.length} 篇</span>
                      ) : <span className="text-text-muted text-xs">无</span>}
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href={`/post/${t.href || t.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title="前台查看"
                        className="inline-flex p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-secondary">
                      没有匹配的教程。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 100 && (
            <div className="p-4 border-t border-border text-xs text-text-muted text-center">
              匹配 {filtered.length} 篇，当前显示前 100 篇（可按领域或搜索缩小范围）
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-text-muted px-1">
        <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" />
        教程由自动化流水线生成（Markdown 源文件注入 posts.json），如需修改内容请编辑对应源文件后重新构建；此处仅作元数据浏览与跳转。
      </div>
    </div>
  );
};
