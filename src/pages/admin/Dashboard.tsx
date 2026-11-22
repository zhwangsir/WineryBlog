import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, GraduationCap, FlaskConical, Eye, Users, BookOpen, HardDrive, Image, Clock, Cpu, ShieldCheck, MessageSquare, Plus, Download, RefreshCw, Loader2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { useData } from '../../context/DataContext';

interface AdminStats {
  posts: { total: number; words: number; views: number; pinned: number; categories: number };
  tutorials: { total: number; domains: number; domainsList: { id: string; name: string; count: number }[] };
  labs: { total: number };
  progress: { visitors: number; readEntries: number; labEntries: number };
  comments?: { total: number; hidden: number };
  uploads: { count: number; bytes: number };
  wallpapers: { count: number; bytes: number };
  system: { uptimeSec: number; rssMB: number; node: string; platform: string };
  gate?: { violations?: number; checked?: number; at?: string } | null;
}

function fmtBytes(b: number): string {
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(2)} GB`;
  if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
}

function fmtUptime(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}天 ${h}时` : h > 0 ? `${h}时 ${m}分` : `${m}分`;
}

function fmtWords(w: number): string {
  return w >= 10000 ? `${(w / 10000).toFixed(1)} 万` : String(w);
}

export const Dashboard: React.FC = () => {
  const { posts } = useData();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await apiFetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch { /* 服务未就绪时静默 */ }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const runGate = async () => {
    setBusy('gate');
    try {
      const res = await apiFetch('/api/admin/gate?force=1');
      const data = await res.json();
      flash(data.code === 0 ? `✅ 零外跳门禁通过：0 违规` : `❌ 门禁发现违规（exit ${data.code}），详情见「安全与系统」`);
    } catch { flash('门禁运行失败'); }
    setBusy(null);
  };

  const refreshWallpapers = async () => {
    setBusy('wallpaper');
    try {
      // 图床抓取：二次元 + 风景各 5 张（后台异步，完成后图床页可见）
      await apiFetch('/api/admin/gallery/fetch', {
        method: 'POST',
        body: JSON.stringify({ category: 'acg', count: 5 }),
      });
      await apiFetch('/api/admin/gallery/fetch', {
        method: 'POST',
        body: JSON.stringify({ category: 'scenery', count: 5 }),
      });
      flash('🖼️ 图床抓取已启动（二次元 + 风景各 5 张，约 1-2 分钟后到「图床」页查看）');
    } catch { flash('抓取任务启动失败'); }
    setBusy(null);
  };

  const downloadBackup = async () => {
    setBusy('backup');
    try {
      const res = await apiFetch('/api/admin/backup');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wineryblog-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flash('📦 备份已开始下载');
    } catch { flash('备份下载失败'); }
    setBusy(null);
  };

  const cards = stats ? [
    { label: '博客文章', value: String(stats.posts.total), sub: `${stats.posts.pinned} 篇置顶 · ${stats.posts.categories} 个分类`, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: '教程', value: String(stats.tutorials.total), sub: `${stats.tutorials.domains} 大领域全覆盖`, icon: GraduationCap, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: '配套实验', value: String(stats.labs.total), sub: `随教程逐步扩充`, icon: FlaskConical, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: '总字数', value: fmtWords(stats.posts.words), sub: `${stats.posts.views} 次阅读`, icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ] : [];

  const sysCards = stats ? [
    { label: '访客进度', value: `${stats.progress.visitors} 位`, sub: `${stats.progress.readEntries} 条已读 · ${stats.progress.labEntries} 次实验记录`, icon: Users },
    { label: '评论', value: `${stats.comments?.total ?? 0} 条`, sub: `${stats.comments?.hidden ?? 0} 条已隐藏`, icon: MessageSquare },
    { label: '图床', value: `${stats.wallpapers.count} 张`, sub: `${stats.uploads.count} 个上传媒体 · ${fmtBytes(stats.wallpapers.bytes)}`, icon: Image },
    { label: '服务运行', value: fmtUptime(stats.system.uptimeSec), sub: `Node ${stats.system.node} · 内存 ${stats.system.rssMB} MB`, icon: Clock },
  ] : [];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">仪表盘</h1>
          <p className="text-text-secondary">WineryBlog 内容与系统总览。</p>
        </div>
        <Link
          to="/admin/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          新建文章
        </Link>
      </header>

      {toast && (
        <div className="px-4 py-3 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-medium">
          {toast}
        </div>
      )}

      {/* 内容统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-bg-card border border-border rounded-2xl p-6 flex items-start gap-4 shadow-sm">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-text-secondary font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted mt-1 truncate">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 系统与互动 */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-4">系统与互动</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sysCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-bg-card border border-border rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-text-secondary text-sm font-medium mb-2">
                  <Icon className="w-4 h-4" />
                  {c.label}
                </div>
                <p className="text-xl font-bold text-text-primary">{c.value}</p>
                <p className="text-xs text-text-muted mt-1">{c.sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 快捷操作 */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={runGate}
            disabled={busy === 'gate'}
            className="flex items-center gap-3 px-5 py-4 bg-bg-card border border-border rounded-2xl hover:border-accent/50 transition-colors text-left disabled:opacity-60"
          >
            {busy === 'gate' ? <Loader2 className="w-5 h-5 text-accent animate-spin" /> : <ShieldCheck className="w-5 h-5 text-green-500" />}
            <div>
              <p className="font-medium text-text-primary text-sm">运行零外跳门禁</p>
              <p className="text-xs text-text-muted mt-0.5">全站扫描出站链接（约数秒）</p>
            </div>
          </button>
          <button
            onClick={refreshWallpapers}
            disabled={busy === 'wallpaper'}
            className="flex items-center gap-3 px-5 py-4 bg-bg-card border border-border rounded-2xl hover:border-accent/50 transition-colors text-left disabled:opacity-60"
          >
            {busy === 'wallpaper' ? <Loader2 className="w-5 h-5 text-accent animate-spin" /> : <RefreshCw className="w-5 h-5 text-blue-500" />}
            <div>
              <p className="font-medium text-text-primary text-sm">抓取图床图片</p>
              <p className="text-xs text-text-muted mt-0.5">二次元 + 风景各 5 张，自动分类去重入库</p>
            </div>
          </button>
          <button
            onClick={downloadBackup}
            disabled={busy === 'backup'}
            className="flex items-center gap-3 px-5 py-4 bg-bg-card border border-border rounded-2xl hover:border-accent/50 transition-colors text-left disabled:opacity-60"
          >
            {busy === 'backup' ? <Loader2 className="w-5 h-5 text-accent animate-spin" /> : <Download className="w-5 h-5 text-purple-500" />}
            <div>
              <p className="font-medium text-text-primary text-sm">下载数据备份</p>
              <p className="text-xs text-text-muted mt-0.5">配置 + 文章 + 进度整包 JSON</p>
            </div>
          </button>
        </div>
      </section>

      {/* 最近文章 */}
      <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">最近文章</h2>
          <Link to="/admin/posts" className="text-sm text-accent hover:text-accent-hover font-medium">
            管理全部 →
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {posts.slice(0, 6).map(post => (
            <div key={post.id} className="flex items-center justify-between p-3.5 rounded-xl bg-bg-base border border-border hover:border-accent/50 transition-colors">
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="font-medium text-text-primary truncate text-sm">
                  {post.pinned && <span className="text-accent mr-1.5">[置顶]</span>}
                  {post.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views || 0}</span>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <p className="text-text-secondary text-center py-4">还没有文章。</p>
          )}
        </div>
      </section>

      {/* 14 域覆盖 */}
      {stats?.tutorials.domainsList?.length ? (
        <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-primary mb-4">教程领域覆盖</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.tutorials.domainsList.map(d => (
              <Link
                key={d.id}
                to="/admin/tutorials"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg-base border border-border hover:border-accent/50 transition-colors"
              >
                <span className="text-sm text-text-primary truncate">{d.name}</span>
                <span className="text-sm font-bold text-accent shrink-0 ml-2">{d.count}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
