import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, Trash2, EyeOff, Eye, Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

interface CommentRow {
  id: string;
  postId: string;
  postTitle: string;
  name: string;
  content: string;
  time: string;
  status: string;
  ip: string;
}

export const ManageComments: React.FC = () => {
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [stats, setStats] = useState({ total: 0, hidden: 0 });
  const [filter, setFilter] = useState<'all' | 'approved' | 'hidden'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/comments');
      if (res.ok) {
        const d = await res.json();
        setRows(d.rows || []);
        setStats({ total: d.total || 0, hidden: d.hidden || 0 });
      }
    } catch { /* 静默 */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const kw = search.toLowerCase();
    return rows.filter(r =>
      (filter === 'all' || r.status === filter) &&
      (!kw || r.name.toLowerCase().includes(kw) || r.content.toLowerCase().includes(kw) || r.postTitle.toLowerCase().includes(kw))
    );
  }, [rows, filter, search]);

  const toggleStatus = async (r: CommentRow) => {
    try {
      await apiFetch(`/api/admin/comments/${r.postId}/${r.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: r.status === 'hidden' ? 'approved' : 'hidden' }),
      });
      await load();
    } catch { /* 静默 */ }
  };

  const remove = async (r: CommentRow) => {
    const key = `${r.postId}/${r.id}`;
    if (confirmDelete !== key) { setConfirmDelete(key); return; }
    setConfirmDelete(null);
    try {
      await apiFetch(`/api/admin/comments/${r.postId}/${r.id}`, { method: 'DELETE' });
      await load();
    } catch { /* 静默 */ }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-text-primary mb-2">评论管理</h1>
        <p className="text-text-secondary">
          共 {stats.total} 条 · {stats.hidden} 条已隐藏 · 先发先显，违规内容可隐藏或删除
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索昵称 / 内容 / 文章标题…"
            className="w-full pl-10 pr-4 py-2 bg-bg-card border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        {([['all', '全部'], ['approved', '正常'], ['hidden', '已隐藏']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${filter === id ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-bg-card border-border text-text-secondary hover:border-accent/40'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-12 text-center">
          <MessageSquare className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">还没有评论。读者在文章页发表的评论会出现在这里。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map(r => (
            <div key={`${r.postId}/${r.id}`} className="bg-bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-sm mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'hidden' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                      {r.status === 'hidden' ? '已隐藏' : '正常'}
                    </span>
                    <span className="font-bold text-text-primary">{r.name}</span>
                    <span className="text-xs text-text-muted">{new Date(r.time).toLocaleString()}</span>
                    <span className="text-xs text-text-muted">IP {r.ip}</span>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap break-words leading-relaxed">{r.content}</p>
                  <Link to={`/post/${r.postId}`} className="mt-2 inline-block text-xs text-text-muted hover:text-accent transition-colors truncate max-w-full">
                    评于：《{r.postTitle}》
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleStatus(r)}
                    title={r.status === 'hidden' ? '恢复显示' : '隐藏'}
                    className={`p-2 rounded-lg border transition-colors ${r.status === 'hidden' ? 'border-green-500/40 text-green-500 hover:bg-green-500/10' : 'border-border text-text-secondary hover:border-amber-400 hover:text-amber-500'}`}
                  >
                    {r.status === 'hidden' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => remove(r)}
                    title={confirmDelete === `${r.postId}/${r.id}` ? '再次点击确认删除' : '删除'}
                    className={`p-2 rounded-lg border transition-colors ${confirmDelete === `${r.postId}/${r.id}` ? 'border-red-400 text-red-500 bg-red-500/10' : 'border-border text-text-secondary hover:border-red-400 hover:text-red-500'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
