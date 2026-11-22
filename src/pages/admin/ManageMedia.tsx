import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Copy, Trash2, RefreshCw, Image, Loader2, Check, HardDrive } from 'lucide-react';
import { apiFetch } from '../../utils/api';

interface UploadItem {
  url: string;
  name: string;
  size: number;
  mtime: number;
}
interface WpItem {
  name: string;
  url: string;
  bytes: number;
  mtime: number;
}

function fmtBytes(b: number): string {
  if (b >= 1048576) return `${(b / 1048576).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
}

function fmtDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const ManageMedia: React.FC = () => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [wallpapers, setWallpapers] = useState<WpItem[]>([]);
  const [wpUpdatedAt, setWpUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [upRes, wpRes] = await Promise.all([
        apiFetch('/api/uploads'),
        apiFetch('/api/admin/wallpapers'),
      ]);
      if (upRes.ok) setItems(await upRes.json());
      if (wpRes.ok) {
        const data = await wpRes.json();
        setWallpapers(data.items || []);
        setWpUpdatedAt(data.manifest?.updatedAt || null);
      }
    } catch { /* 静默 */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
          alert(`上传失败：${(err as any).error || res.status}`);
        }
      }
      await load();
    } catch (e) {
      console.error(e);
      alert('上传失败');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(window.location.origin + url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 1500);
    } catch { /* 剪贴板不可用 */ }
  };

  const handleDelete = async (name: string) => {
    if (confirmDelete !== name) { setConfirmDelete(name); return; }
    setConfirmDelete(null);
    try {
      await apiFetch(`/api/uploads/${encodeURIComponent(name)}`, { method: 'DELETE' });
      await load();
    } catch { alert('删除失败'); }
  };

  const refreshWallpapers = async () => {
    setRefreshing(true);
    try {
      await apiFetch('/api/admin/wallpapers/refresh', { method: 'POST' });
      window.setTimeout(load, 90000);   // 抓取约 1-2 分钟后自动刷新列表
    } catch { /* 静默 */ }
    setRefreshing(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">媒体库</h1>
          <p className="text-text-secondary">
            {items.length} 个上传文件 · {wallpapers.length} 张壁纸
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
            {uploading ? '上传中…' : '上传媒体'}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-12 text-center">
          <HardDrive className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary mb-1">还没有上传任何媒体文件</p>
          <p className="text-xs text-text-muted">上传的图片 / 音频可在文章封面、头像、背景等设置中引用（/uploads/…）</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => {
            const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(item.name);
            return (
              <div key={item.name} className="bg-bg-card border border-border rounded-2xl overflow-hidden group">
                <div className="h-36 bg-bg-base flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <HardDrive className="w-8 h-8 text-text-muted" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-text-primary truncate" title={item.name}>{item.name}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{fmtBytes(item.size)} · {fmtDate(item.mtime)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      onClick={() => copyUrl(item.url)}
                      title="复制链接"
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-bg-base border border-border text-[11px] text-text-secondary hover:border-accent hover:text-accent transition-colors"
                    >
                      {copied === item.url ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copied === item.url ? '已复制' : '复制链接'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.name)}
                      title={confirmDelete === item.name ? '再次点击确认删除' : '删除'}
                      className={`p-1.5 rounded-lg border transition-colors ${confirmDelete === item.name ? 'border-red-400 text-red-500 bg-red-500/10' : 'border-border text-text-secondary hover:border-red-400 hover:text-red-500'}`}
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

      {/* 壁纸池 */}
      <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-500" />
              随机壁纸池
            </h2>
            <p className="text-xs text-text-muted mt-1">
              {wpUpdatedAt ? `更新于 ${fmtDate(new Date(wpUpdatedAt).getTime())} · 每日按日种子轮换一张，文字遮罩自适应壁纸亮度` : '暂无壁纸'}
            </p>
          </div>
          <button
            onClick={refreshWallpapers}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            抓取 10 张新壁纸
          </button>
        </div>
        {wallpapers.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
            {wallpapers.map(wp => (
              <div key={wp.name} className="aspect-[3/4] rounded-xl overflow-hidden border border-border bg-bg-base">
                <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" loading="lazy" title={`${wp.name} · ${fmtBytes(wp.bytes)}`} />
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-text-muted mt-3">
          抓取约需 1-2 分钟，完成后清单自动更新；前台「站点设置 → 全局背景」留空时才会启用随机壁纸。
        </p>
      </section>
    </div>
  );
};
