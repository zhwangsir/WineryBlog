import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Copy, Trash2, RefreshCw, Image, Loader2, Check, HardDrive, X, Camera, Sparkles, Mountain, LayoutGrid, ExternalLink } from 'lucide-react';
import { apiFetch } from '../../utils/api';

interface GalleryImage {
  name: string;
  category: string;
  url: string;
  bytes: number;
  time: string;
  source: string;
}
interface GalleryCategory {
  id: string;
  label: string;
  count: number;
  bytes: number;
}
interface GalleryData {
  categories: GalleryCategory[];
  images: GalleryImage[];
  fetchable: Record<string, string>;
  manifestUpdatedAt: string | null;
}

const CAT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  acg: Sparkles,
  scenery: Mountain,
  wallpaper: LayoutGrid,
  uploads: HardDrive,
};

function fmtBytes(b: number): string {
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(2)} GB`;
  if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const ManageMedia: React.FC = () => {
  const [data, setData] = useState<GalleryData | null>(null);
  const [active, setActive] = useState('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [preview, setPreview] = useState<GalleryImage | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/gallery');
      if (res.ok) setData(await res.json());
    } catch { /* 静默 */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote(null), 4000);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await apiFetch('/api/upload', {
          method: 'POST',
          body: JSON.stringify({ name: file.name, data: dataUrl }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          flash(`上传失败：${(err as any).error || res.status}`);
        }
      }
      await load();
      flash('✅ 上传完成，已入「上传媒体」分类');
    } catch (e) {
      console.error(e);
      flash('上传失败');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFetch = async (category: string) => {
    if (fetching) return;
    setFetching(category);
    try {
      await apiFetch('/api/admin/gallery/fetch', {
        method: 'POST',
        body: JSON.stringify({ category, count: 10 }),
      });
      flash(`🖼️ 正在抓取 10 张「${data?.fetchable[category] || category}」图片入库（约 1-2 分钟），完成后自动刷新`);
      window.setTimeout(load, 90000);
    } catch { flash('抓取任务启动失败'); }
    setFetching(null);
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(window.location.origin + url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 1500);
    } catch { /* 剪贴板不可用 */ }
  };

  const handleDelete = async (img: GalleryImage) => {
    const key = `${img.category}/${img.name}`;
    if (confirmDelete !== key) { setConfirmDelete(key); return; }
    setConfirmDelete(null);
    setPreview(null);
    try {
      await apiFetch(`/api/admin/gallery/${img.category}/${encodeURIComponent(img.name)}`, { method: 'DELETE' });
      await load();
    } catch { flash('删除失败'); }
  };

  const shown = data?.images.filter(i => active === 'all' || i.category === active) || [];
  const activeCat = data?.categories.find(c => c.id === active);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">图床</h1>
          <p className="text-text-secondary">
            {data ? `${data.categories[0].count} 张图片 · 占用 ${fmtBytes(data.categories[0].bytes)} · 全部本地存储，站内引用零外跳` : '加载中…'}
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,audio/*,.ico,.cur"
            multiple
            hidden
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-medium shadow-sm disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {uploading ? '上传中…' : '上传图片'}
          </button>
        </div>
      </header>

      {note && (
        <div className="px-4 py-3 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-medium">
          {note}
        </div>
      )}

      {/* 分类 tabs + 抓取 */}
      <div className="flex flex-wrap items-center gap-2">
        {(data?.categories || []).map(c => {
          const Icon = CAT_ICON[c.id] || Image;
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${active === c.id ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-bg-card border-border text-text-secondary hover:border-accent/40'}`}
            >
              <Icon className="w-4 h-4" />
              {c.label} ({c.count})
            </button>
          );
        })}
        <div className="flex-1" />
        {/* 抓取按钮：壁纸三类 */}
        {data && active !== 'uploads' && (
          <div className="flex items-center gap-2">
            {(active === 'all' ? ['acg', 'scenery', 'wallpaper'] : [active]).map(cat => (
              <button
                key={cat}
                onClick={() => handleFetch(cat)}
                disabled={!!fetching}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs text-text-secondary hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
              >
                {fetching === cat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                抓取 10 张{data.fetchable[cat] ? `「${data.fetchable[cat]}」` : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-12 text-center">
          <Image className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary mb-1">
            {activeCat?.id === 'uploads' ? '还没有上传任何图片' : '该分类暂无图片'}
          </p>
          <p className="text-xs text-text-muted">
            {activeCat?.id === 'uploads'
              ? '上传的图片可在文章封面、头像、背景等设置中引用，也可在写文章时从图床插入'
              : '点击上方「抓取」按钮，从图源抓取 10 张图片自动入库去重'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {shown.map(img => {
            const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(img.name);
            const CatIcon = CAT_ICON[img.category] || Image;
            return (
              <div key={img.url} className="bg-bg-card border border-border rounded-2xl overflow-hidden group">
                <button
                  className="block w-full h-36 bg-bg-base cursor-zoom-in overflow-hidden"
                  onClick={() => setPreview(img)}
                  title="点击放大预览"
                >
                  {isImage ? (
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center"><HardDrive className="w-8 h-8 text-text-muted" /></span>
                  )}
                </button>
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-bold shrink-0">
                      {data?.categories.find(c => c.id === img.category)?.label || img.category}
                    </span>
                    <span className="text-[10px] text-text-muted truncate">{fmtBytes(img.bytes)} · {fmtDate(img.time)}</span>
                  </div>
                  <p className="text-xs font-medium text-text-primary truncate" title={img.name}>{img.name}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      onClick={() => copyUrl(img.url)}
                      title="复制站内链接"
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-bg-base border border-border text-[11px] text-text-secondary hover:border-accent hover:text-accent transition-colors"
                    >
                      {copied === img.url ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copied === img.url ? '已复制' : '复制链接'}
                    </button>
                    <button
                      onClick={() => setPreview(img)}
                      title="预览"
                      className="p-1.5 rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(img)}
                      title={confirmDelete === `${img.category}/${img.name}` ? '再次点击确认删除' : '删除'}
                      className={`p-1.5 rounded-lg border transition-colors ${confirmDelete === `${img.category}/${img.name}` ? 'border-red-400 text-red-500 bg-red-500/10' : 'border-border text-text-secondary hover:border-red-400 hover:text-red-500'}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-text-muted px-1">
        <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
        抓取图片按内容哈希命名并全局去重，存放于本地 server/data/gallery/（不入 git），通过 /images/ 站内路径服务——读者任何加载都不出站。
      </div>

      {/* 大图预览 lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => { setPreview(null); setConfirmDelete(null); }}
        >
          <div className="max-w-[90vw] max-h-[88vh] flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <img src={preview.url} alt={preview.name} className="max-w-full max-h-[76vh] object-contain rounded-2xl shadow-2xl" />
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2 text-white/80 min-w-0">
                <span className="px-2 py-0.5 bg-accent/20 text-accent rounded text-xs font-bold shrink-0">
                  {data?.categories.find(c => c.id === preview.category)?.label}
                </span>
                <span className="truncate">{preview.name}</span>
                <span className="text-white/50 shrink-0">{fmtBytes(preview.bytes)} · {fmtDate(preview.time)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyUrl(preview.url)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  {copied === preview.url ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === preview.url ? '已复制' : '复制站内链接'}
                </button>
                <button
                  onClick={() => handleDelete(preview)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-colors ${confirmDelete === `${preview.category}/${preview.name}` ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-red-500/80'}`}
                >
                  <Trash2 className="w-4 h-4" />
                  {confirmDelete === `${preview.category}/${preview.name}` ? '确认删除？' : '删除'}
                </button>
                <button
                  onClick={() => { setPreview(null); setConfirmDelete(null); }}
                  className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                  title="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
