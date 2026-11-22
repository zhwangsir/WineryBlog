import React, { useEffect, useState } from 'react';

interface WpManifest {
  wallpapers: string[];
  updatedAt?: string;
}

/**
 * 随机壁纸背景层：无自定义背景时启用（每日种子——同一天稳定同一张）。
 * 文字保护：canvas 采样壁纸平均亮度 → 自适应暗色遮罩浓度
 * （亮壁纸加重遮罩、暗壁纸轻遮罩，正文永远可读）。
 * 壁纸池来自自有图床（server/data/gallery，scripts/fetch-gallery.mjs 抓取），
 * 服务端 /api/gallery/manifest 公开；旧 public/wallpapers 清单回落兼容。
 */
export const WallpaperBackground: React.FC = () => {
  const [src, setSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [scrim, setScrim] = useState(0.5);

  // 取清单（图床池） + 按日种子选图
  useEffect(() => {
    let dead = false;
    fetch('/api/gallery/manifest')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('no manifest'))))
      .then((m: WpManifest) => {
        if (dead) return;
        const list: string[] = m.wallpapers || [];
        if (!list.length) return;
        // 日种子：同一天稳定同一张
        let h = 2166136261;
        const day = new Date().toISOString().slice(0, 10);
        for (let i = 0; i < day.length; i++) {
          h ^= day.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        setSrc(list[Math.abs(h) % list.length]);
      })
      .catch(() => {});
    return () => { dead = true; };
  }, []);

  // 亮度采样 → 自适应遮罩浓度
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        const w = 48;
        c.width = w;
        c.height = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth));
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let lum = 0;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) {
          lum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
          n++;
        }
        const avg = lum / n;   // 0 暗 ~ 1 亮
        // 暗主题：亮壁纸加重遮罩，暗壁纸轻遮罩（正文永远可读）
        setScrim(Math.min(0.72, Math.max(0.38, 0.28 + avg * 0.42)));
      } catch { /* canvas 不可用时用默认遮罩 */ }
    };
    img.src = src;
  }, [src]);

  if (!src) return null;

  return (
    <>
      {/* 壁纸层（加载后 1.1s 淡入） */}
      <div
        aria-hidden
        className={cnMerge(
          'fixed inset-0 z-[-2] bg-cover bg-center transition-opacity duration-[1100ms] ease-out',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        style={{ backgroundImage: `url(${src})` }}
      />
      {/* 自适应暗色遮罩（保文字可读）+ 底部渐隐 */}
      <div
        aria-hidden
        className={cnMerge(
          'fixed inset-0 z-[-2] transition-opacity duration-[1100ms] ease-out',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background: `linear-gradient(180deg,
            rgba(11, 15, 20, ${scrim * 0.85}) 0%,
            rgba(11, 15, 20, ${scrim}) 55%,
            rgba(11, 15, 20, ${Math.min(0.95, scrim + 0.25)}) 100%)`,
        }}
      />
    </>
  );
};

// 极简 className 合并（避免引入依赖）
function cnMerge(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(' ');
}
