import React, { useEffect, useState } from 'react';
import { X, Loader2, Image } from 'lucide-react';
import { apiFetch } from '../../utils/api';

interface GalleryImage {
  name: string;
  category: string;
  url: string;
  bytes: number;
}
interface GalleryCategory {
  id: string;
  label: string;
  count: number;
}

/**
 * 图床选图器：从自有图床挑一张图，onSelect 返回站内 URL（/uploads/... 或 /images/...）。
 * 供文章编辑器插入图片、封面选择等场景复用。
 */
export const GalleryPicker: React.FC<{
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}> = ({ open, onClose, onSelect }) => {
  const [cats, setCats] = useState<GalleryCategory[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [active, setActive] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch('/api/admin/gallery')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('load failed'))))
      .then((data: any) => {
        setCats(data.categories || []);
        setImages(data.images || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;
  const shown = images.filter(i => active === 'all' || i.category === active);

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-8" onClick={onClose}>
      <div className="w-[860px] max-w-[92vw] h-[70vh] bg-bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-text-primary flex items-center gap-2">
            <Image className="w-5 h-5 text-accent" />
            从图床选择图片
          </h3>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-base transition-colors" title="关闭">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-border">
          {cats.map(c => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${active === c.id ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-bg-base border-border text-text-secondary hover:border-accent/40'}`}
            >
              {c.label} ({c.count})
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 text-accent animate-spin" /></div>
          ) : shown.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-12">该分类暂无图片，可先到「图床」页上传或抓取</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {shown.map(img => (
                <button
                  key={img.url}
                  className="aspect-[4/3] rounded-xl overflow-hidden border border-border hover:border-accent hover:scale-[1.03] transition-all bg-bg-base"
                  onClick={() => { onSelect(img.url); onClose(); }}
                  title={`插入 ${img.name}`}
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
