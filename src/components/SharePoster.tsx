import React, { useEffect, useRef, useState } from 'react';
import { Share2, X, Download, Loader2 } from 'lucide-react';

interface SharePosterProps {
  open: boolean;
  onClose: () => void;
  post: { id: string; title: string; cover?: string; date: string };
  siteName: string;
}

const W = 1200;
const H = 630;

/**
 * 文章分享海报：canvas 绘制 1200×630 分享卡（封面 + 标题 + 二维码 + 品牌），
 * 生成 PNG 下载。二维码指向站内文章路由，零外跳。
 */
export const SharePoster: React.FC<SharePosterProps> = ({ open, onClose, post, siteName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) { setDone(false); return; }
    setRendering(true);
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { default: QRCode } = await import('qrcode');

      // 背景
      ctx.fillStyle = '#0b0f14';
      ctx.fillRect(0, 0, W, H);
      // 右下角品牌渐变圆（裁剪在画布内）
      const grad = ctx.createRadialGradient(W - 60, H + 40, 20, W - 60, H + 40, 360);
      grad.addColorStop(0, 'rgba(242,125,38,0.55)');
      grad.addColorStop(1, 'rgba(242,125,38,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // 顶部 accent 细条
      ctx.fillStyle = '#f27d26';
      ctx.fillRect(0, 0, W, 6);

      // 封面横带（cover crop，失败则画渐变替代）
      const COVER_H = 300;
      await new Promise<void>((resolve) => {
        if (!post.cover) { resolve(); return; }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // 等比裁剪铺满 1200×300
          const scale = Math.max(W / img.naturalWidth, COVER_H / img.naturalHeight);
          const sw = W / scale;
          const sh = COVER_H / scale;
          ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, W, COVER_H);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = post.cover!;
      });
      // 封面被 404 时补渐变
      if (post.cover) {
        // 检测是否画上（无像素级检测，简单补一层半透明以统一色调）
        ctx.fillStyle = 'rgba(11,15,20,0.10)';
        ctx.fillRect(0, 0, W, COVER_H);
      } else {
        const cg = ctx.createLinearGradient(0, 0, W, COVER_H);
        cg.addColorStop(0, '#1a2230');
        cg.addColorStop(1, '#2b1d14');
        ctx.fillStyle = cg;
        ctx.fillRect(0, 0, W, COVER_H);
      }
      // 封面底部渐隐入内容区
      const fade = ctx.createLinearGradient(0, COVER_H - 80, 0, COVER_H);
      fade.addColorStop(0, 'rgba(11,15,20,0)');
      fade.addColorStop(1, 'rgba(11,15,20,1)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, COVER_H - 80, W, 80);

      // 标题（最多两行，超长截断）
      ctx.fillStyle = '#f5f0e8';
      ctx.font = 'bold 44px "Microsoft YaHei", "PingFang SC", sans-serif';
      const title = post.title.length > 26 ? post.title.slice(0, 25) + '…' : post.title;
      // 简易按宽度断行
      const lines: string[] = [];
      let line = '';
      for (const ch of title) {
        if (ctx.measureText(line + ch).width > 760) { lines.push(line); line = ch; if (lines.length === 2) break; }
        else line += ch;
      }
      if (lines.length < 2 && line) lines.push(line);
      lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 64, COVER_H + 96 + i * 58));

      // 日期与站名
      ctx.fillStyle = '#9aa4b0';
      ctx.font = '24px "Microsoft YaHei", sans-serif';
      ctx.fillText(`${post.date}  ·  ${siteName}`, 64, COVER_H + 232);

      // 二维码（白色圆角卡 + 站内文章链接）
      const qrText = window.location.origin + '/post/' + post.id;
      const qrData = await QRCode.toDataURL(qrText, { width: 360, margin: 1, color: { dark: '#0b0f14', light: '#ffffff' } });
      const qrImg = new Image();
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.src = qrData;
      });
      const qs = 180;
      const qx = W - qs - 72;
      const qy = H - qs - 72;
      // 白卡
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qx - 14, qy - 14, qs + 28, qs + 28, 16);
      ctx.fill();
      ctx.drawImage(qrImg, qx, qy, qs, qs);
      ctx.fillStyle = '#9aa4b0';
      ctx.font = '20px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('扫码阅读全文', qx + qs / 2, qy + qs + 44);
      ctx.textAlign = 'left';

      setRendering(false);
      setDone(true);
    })();
  }, [open, post, siteName]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `share-${post.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <canvas ref={canvasRef} width={W} height={H} className="max-w-[92vw] max-h-[74vh] rounded-2xl shadow-2xl" />
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={download}
            disabled={!done}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            下载分享图
          </button>
          <button onClick={onClose} className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors" title="关闭">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ShareIcon = Share2;
