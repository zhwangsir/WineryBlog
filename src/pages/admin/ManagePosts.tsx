import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Edit, Trash2, Search, Pin, PinOff, Eye, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const PAGE_SIZE = 15;

type SortKey = 'date' | 'views' | 'words';

export const ManagePosts: React.FC = () => {
  const { posts, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(posts.map(p => p.category))).sort(),
    [posts]
  );

  const filtered = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    let list = posts.filter(p =>
      (!kw || p.title.toLowerCase().includes(kw) || p.category.toLowerCase().includes(kw) || p.tags.some(t => t.toLowerCase().includes(kw))) &&
      (!category || p.category === category)
    );
    // 字数由服务端随摘要下发（列表不再携带正文）
    if (sortKey === 'views') list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (sortKey === 'words') list = [...list].sort((a, b) => (b.words || 0) - (a.words || 0));
    // date 排序沿用服务端返回顺序（置顶优先 + 日期倒序）
    return list;
  }, [posts, searchTerm, category, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`确定删除《${title.slice(0, 30)}…》？此操作不可恢复。`)) return;
    setBusyId(id);
    try {
      await apiFetch(`/api/posts/${id}`, { method: 'DELETE' });
      await refreshData();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
    setBusyId(null);
  };

  const togglePin = async (post: any) => {
    setBusyId(post.id);
    try {
      await apiFetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ pinned: !post.pinned }),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
    setBusyId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">文章管理</h1>
          <p className="text-text-secondary">共 {posts.length} 篇 · 筛选后 {filtered.length} 篇</p>
        </div>
        <Link
          to="/admin/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          新建文章
        </Link>
      </header>

      <div className="bg-bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* 工具栏 */}
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="搜索标题 / 分类 / 标签…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-bg-base border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-bg-base border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="">全部分类</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-3 py-2 bg-bg-base border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="date">按日期（置顶优先）</option>
            <option value="views">按阅读量</option>
            <option value="words">按字数</option>
          </select>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-base/50 text-text-secondary text-sm">
                <th className="p-4 font-medium">标题</th>
                <th className="p-4 font-medium whitespace-nowrap">分类</th>
                <th className="p-4 font-medium whitespace-nowrap">日期</th>
                <th className="p-4 font-medium whitespace-nowrap">字数</th>
                <th className="p-4 font-medium whitespace-nowrap">阅读</th>
                <th className="p-4 font-medium text-right whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageItems.map(post => (
                <tr key={post.id} className="hover:bg-bg-base/50 transition-colors">
                  <td className="p-4 max-w-[360px]">
                    <div className="flex items-center gap-2">
                      {post.pinned && (
                        <span className="px-1.5 py-0.5 bg-accent/15 text-accent rounded text-[10px] font-bold shrink-0">置顶</span>
                      )}
                      <div className="font-medium text-text-primary truncate" title={post.title}>{post.title}</div>
                    </div>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {post.tags?.slice(0, 3).map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 bg-bg-base text-text-muted rounded text-[10px]">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-md text-xs font-medium whitespace-nowrap">
                      {post.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text-secondary whitespace-nowrap">{post.date}</td>
                  <td className="p-4 text-sm text-text-secondary whitespace-nowrap">{((post.words || 0) / 10000).toFixed(1)} 万</td>
                  <td className="p-4 text-sm text-text-secondary">
                    <span className="flex items-center gap-1 whitespace-nowrap"><Eye className="w-3.5 h-3.5" />{post.views || 0}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => togglePin(post)}
                        disabled={busyId === post.id}
                        title={post.pinned ? '取消置顶' : '置顶'}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${post.pinned ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-accent hover:bg-accent/10'}`}
                      >
                        {post.pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                      </button>
                      <a
                        href={`/post/${post.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title="前台查看"
                        className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Link
                        to={`/admin/posts/edit/${post.id}`}
                        title="编辑"
                        className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        disabled={busyId === post.id}
                        title="删除"
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-secondary">
                    没有匹配的文章。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              第 {safePage} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-2 rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
                return start + i;
              }).filter(p => p <= totalPages).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === safePage ? 'bg-accent text-white' : 'border border-border text-text-secondary hover:border-accent hover:text-accent'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-2 rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
