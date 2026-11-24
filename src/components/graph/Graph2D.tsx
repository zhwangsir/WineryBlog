import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import type { GraphModel, SeriesNode } from '../../lib/graphModel';
import {
  layoutOverview, layoutDetail, gfont, LABEL_PX, TITLE_PX, TITLE_H, COUNT_PX, TITLE_DOT,
  type DetailLayout,
} from '../../lib/graphModel';

export type GraphHover =
  | { kind: 'series'; id: string; x: number; y: number }
  | { kind: 'post'; id: string; x: number; y: number }
  | { kind: 'domain'; id: string; x: number; y: number }
  | null;

/** 画布上被工具栏 / 图例 / 信息卡遮住的区域（CSS 像素） */
export interface GraphInset { top: number; bottom: number; right: number }

export interface Graph2DHandle {
  fit: () => void;
  fitDomain: (id: string) => void;
  fitRect: (ids: string[]) => void;
}

interface Props {
  model: GraphModel;
  level: 'overview' | 'detail';
  seriesId: string | null;
  domainId: string | null;
  routeId: string | null;
  focusPostId: string | null;
  readSet: Set<string>;
  dark: boolean;
  inset: GraphInset;
  onHover: (info: GraphHover) => void;
  onDrill: (seriesId: string) => void;
  onSelectDomain: (id: string | null) => void;
  onOpenPost: (id: string) => void;
  onBack: () => void;
}

interface Cam { scale: number; x: number; y: number }
interface Rect { x: number; y: number; w: number; h: number }

/** 地图与画布边缘的留白 */
const PAD = 14;
const ease = (u: number) => 1 - Math.pow(1 - u, 3);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hex2rgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) || 0, parseInt(h.slice(3, 5), 16) || 0, parseInt(h.slice(5, 7), 16) || 0,
];
const mix = (a: string, b: string, t: number) => {
  const A = hex2rgb(a), B = hex2rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};
const rgba = (h: string, a: number) => {
  const [r, g, b] = hex2rgb(h);
  return `rgba(${r},${g},${b},${a})`;
};
const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};
/** 不依赖字体度量的宽度估算：汉字算 1、其它算 0.55 个字宽 */
const isWide = (ch: string) => /[\u4e00-\u9fa5（）：，、]/.test(ch);
const clipText = (s: string, maxUnits: number) => {
  let u = 0, out = '';
  for (const ch of s) {
    u += isWide(ch) ? 1 : 0.55;
    if (u > maxUnits - 0.8) return `${out}…`;
    out += ch;
  }
  return s;
};
const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * 知识图谱 2D 引擎（Canvas）。
 * 全景层：知识域星云 + 「气泡 + 名字」的专题星体，整张图是一个可以拖动缩放的世界。
 * 专题层：文章按阅读顺序排在螺旋线上。
 * 下钻 / 返回是一段相机动画：先推向被点的星体，再淡入专题螺旋。
 */
export const Graph2D = forwardRef<Graph2DHandle, Props>(function Graph2D(props, ref) {
  const { model } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // 配置与回调都走 ref：引擎只在数据模型变化时重建，父组件重渲染不会丢布局
  const cfgRef = useRef(props);
  cfgRef.current = props;
  const apiRef = useRef<{ fit: () => void; fitDomain: (id: string) => void; fitRect: (ids: string[]) => void } | null>(null);
  useImperativeHandle(ref, () => ({
    fit: () => apiRef.current?.fit(),
    fitDomain: (id: string) => apiRef.current?.fitDomain(id),
    fitRect: (ids: string[]) => apiRef.current?.fitRect(ids),
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, dpr = 1;
    const view = { x: 0, y: 0, w: 0, h: 0 };      // 画布上没被遮住的区域
    const world = { k: 1, w: 0, h: 0 };           // 全景层的世界（= 布局带）
    const cam: Cam = { scale: 1, x: 0, y: 0 };        // 当前相机
    const camT: Cam = { scale: 1, x: 0, y: 0 };       // 目标相机（平移 / 缩放 / 复位）
    const now: Cam = { scale: 1, x: 0, y: 0 };        // 本帧实际使用的相机
    // 下钻过渡：t ∈ [0, 0.4] 推向星体并淡出全景；(0.4, 1] 相机移到螺旋中心并淡入专题
    // dir = 0 表示空闲：不主动开始过渡，否则一挂载就会把全景淡出成空白
    const anim = {
      t: 0, dir: 0,
      from: { scale: 1, x: 0, y: 0 } as Cam,     // 过渡起点（下钻前的全景相机）
      zoom: { scale: 1, x: 0, y: 0 } as Cam,     // 推向星体
      detail: { scale: 1, x: 0, y: 0 } as Cam,   // 专题层的适配相机
    };
    const homeCam: Cam = { scale: 1, x: 0, y: 0 };   // 最近一次停在全景时的相机：返回全景回到这里
    let seenOverview = false;
    let appliedDetail: string | null = null;     // 已经开始过渡到的专题
    let detail: DetailLayout | null = null;
    let detailSeries: SeriesNode | null = null;
    let hover: GraphHover = null;
    const pointer = { x: -999, y: -999, inside: false };
    let theme = { ink: '#e8ecf0', sub: '#a0aec0', mute: '#64748b', accent: '#F27D26' };

    // 字宽缓存：字体加载完成后要清一次（加载前量到的是回退字体的宽度）
    const widthCache = new Map<string, number>();
    const measure = (text: string, font: string) => {
      const key = `${font}|${text}`;
      let w = widthCache.get(key);
      if (w === undefined) { ctx.font = font; w = ctx.measureText(text).width; widthCache.set(key, w); }
      return w;
    };
    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      const g = (n: string, f: string) => (cs.getPropertyValue(n) || '').trim() || f;
      theme = { ink: g('--text-primary', '#e8ecf0'), sub: g('--text-secondary', '#a0aec0'), mute: g('--text-muted', '#64748b'), accent: g('--accent', '#F27D26') };
    };
    readTheme();
    // 字体加载完成后字宽会变（加载前量到的是回退字体），要重新排一次
    let fontsDone = false;
    document.fonts?.ready.then(() => { fontsDone = true; });

    const domainOf = new Map(model.domains.map((d) => [d.id, d]));
    const colorOf = (s: SeriesNode) => domainOf.get(s.domain)?.color || '#9aa8bd';
    const adj = new Map<string, Set<string>>();
    for (const e of model.edges) {
      if (!adj.has(e.from)) adj.set(e.from, new Set());
      if (!adj.has(e.to)) adj.set(e.to, new Set());
      adj.get(e.from)!.add(e.to); adj.get(e.to)!.add(e.from);
    }
    const linked = (a: string, b: string) => !!adj.get(a)?.has(b);

    // 背景星空：固定种子，铺得比地图大一圈
    const rnd = mulberry32(20261124);
    const stars = Array.from({ length: 260 }, () => ({
      x: (rnd() - 0.5) * 2.7, y: (rnd() - 0.5) * 2.7, r: 0.5 + rnd() * 0.9,
      a: 0.2 + rnd() * 0.5, p: rnd() * Math.PI * 2, f: 0.4 + rnd() * 1.3,
    }));

    // ───────────────────────── 布局与相机 ─────────────────────────
    let layoutDirty = true, layoutAt = 0, fontsApplied = false;
    let intro = reduceMotion ? 1 : 0;      // 首次进入的浮现动画进度
    const relayout = () => {
      if (!W || !H) return;
      if (fontsDone && !fontsApplied) { fontsApplied = true; widthCache.clear(); }
      const p = cfgRef.current;
      view.x = PAD; view.y = p.inset.top + PAD;
      view.w = Math.max(60, W - PAD * 2);
      view.h = Math.max(60, H - p.inset.top - p.inset.bottom - PAD * 2);
      const r = layoutOverview(model, view.w, view.h, measure);
      world.k = r.k; world.w = r.w; world.h = r.h;
      if (detailSeries) {
        detail = layoutDetail(detailSeries.count, Math.max(60, W - p.inset.right - PAD * 2), view.h);
        anim.detail = detailCam();
        if (appliedDetail && anim.t >= 1) Object.assign(camT, anim.detail);
      }
      layoutDirty = false;
      layoutAt = 0;
      // 保持当前意图：复位过就继续复位，选了知识域就继续对准它
      if (!appliedDetail) {
        if (p.domainId) fitDomain(p.domainId); else fit();
      }
    };
    /** 信息卡左侧的空白区中心：下钻、选中知识域时都往这里对 */
    const freeCenter = () => {
      const p = cfgRef.current;
      return { x: (W - p.inset.right) / 2, y: (p.inset.top + H - p.inset.bottom) / 2 };
    };
    const freeSize = () => {
      const p = cfgRef.current;
      return { w: Math.max(120, W - p.inset.right - PAD * 2), h: Math.max(120, H - p.inset.top - p.inset.bottom - PAD * 2) };
    };
    const detailCam = (): Cam => {
      const f = freeCenter(), s = detail?.scale || 1;
      return { scale: s, x: f.x - (world.w / 2) * s, y: f.y - (world.h / 2) * s };
    };
    const fit = () => {
      if (appliedDetail && anim.t >= 1 && detail) { Object.assign(camT, anim.detail); return; }
      // 地图比画布窄就按宽度铺满（文字保持可读），比画布高就让用户上下拖动
      const s = Math.min(1, view.w / world.w, world.h <= view.h ? view.h / world.h : 1);
      Object.assign(camT, { scale: s, x: view.x + (view.w - world.w * s) / 2, y: view.y + (view.h - world.h * s) / 2 });
    };
    const fitDomain = (id: string) => {
      const d = domainOf.get(id);
      if (!d || !d.box.w) return;
      const f = freeCenter(), fs = freeSize(), b = d.box;
      const s = clamp(Math.min((fs.w - 56) / b.w, (fs.h - 56) / b.h), 0.6, 1.75);
      Object.assign(camT, { scale: s, x: f.x - (b.x + b.w / 2) * s, y: f.y - (b.y + b.h / 2) * s });
    };
    const fitRect = (ids: string[]) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const id of ids) {
        const s = model.seriesById.get(id);
        if (!s) continue;
        x0 = Math.min(x0, s.x - s.r); x1 = Math.max(x1, s.x + s.r);
        y0 = Math.min(y0, s.y - s.r); y1 = Math.max(y1, s.y + s.r);
        if (s.lw > 0) { x0 = Math.min(x0, s.lx); x1 = Math.max(x1, s.lx + s.lw); y0 = Math.min(y0, s.ly); y1 = Math.max(y1, s.ly + s.lh); }
      }
      if (!Number.isFinite(x0)) return;
      const f = freeCenter(), fs = freeSize();
      const s = Math.min(1, (fs.w - 90) / (x1 - x0), (fs.h - 90) / (y1 - y0));
      Object.assign(camT, { scale: s, x: f.x - ((x0 + x1) / 2) * s, y: f.y - ((y0 + y1) / 2) * s });
    };
    apiRef.current = { fit, fitDomain, fitRect };

    const startDrill = (s: SeriesNode) => {
      detailSeries = s;
      detail = layoutDetail(s.count, freeSize().w, view.h);
      const f = freeCenter(), z = clamp(Math.max(cam.scale * 1.7, 1.5), 1.5, 2.6);
      anim.dir = 1;
      anim.from = { ...cam };
      anim.zoom = { scale: z, x: f.x - s.x * z, y: f.y - s.y * z };
      anim.detail = detailCam();
      // 还没在全景上停过（深链接直接进专题）：不做过渡，直接落到专题
      if (reduceMotion || !seenOverview) { anim.t = 1; Object.assign(cam, anim.detail); Object.assign(camT, anim.detail); }
      hover = null; cfgRef.current.onHover(null);
    };
    const startBack = () => {
      anim.dir = -1;
      anim.detail = { ...cam };
      anim.from = { ...homeCam };
      Object.assign(camT, homeCam);
      if (reduceMotion || !seenOverview) anim.t = 0;
      hover = null; cfgRef.current.onHover(null);
    };

    // 位图必须始终等于 CSS 尺寸 × 当前像素比。像素比会单独变化（页面缩放、窗口拖到另一块屏），
    // 这时 ResizeObserver 不一定触发；若只改 dpr 不重建位图，新帧只盖住左上角一块，旧帧残留成重影。
    // 只换位图、不重新布局：布局按 CSS 像素算，与像素比无关，用户的缩放也不该被重置
    const syncBitmap = () => {
      const nd = Math.min(window.devicePixelRatio || 1, 2);
      const bw = Math.max(1, Math.round(W * nd)), bh = Math.max(1, Math.round(H * nd));
      if (nd === dpr && canvas.width === bw && canvas.height === bh) return;
      dpr = nd;
      canvas.width = bw; canvas.height = bh;
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) return;
      if (Math.abs(r.width - W) >= 1 || Math.abs(r.height - H) >= 1) {
        W = r.width; H = r.height;
        layoutDirty = true; layoutAt = performance.now() + 140;     // 拖动窗口时等尺寸稳定下来再重排
      }
      syncBitmap();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('resize', resize);
    resize();
    fit();

    // ───────────────────────── 全景层绘制 ─────────────────────────
    const arrow = (x1: number, y1: number, x2: number, y2: number, size: number) => {
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(a - 0.45) * size, y2 - Math.sin(a - 0.45) * size);
      ctx.lineTo(x2 - Math.cos(a + 0.45) * size, y2 - Math.sin(a + 0.45) * size);
      ctx.closePath(); ctx.fill();
    };
    /** 椭圆状的柔光：在单位圆里建渐变，再拉伸成椭圆 */
    const glow = (cx: number, cy: number, rx: number, ry: number, color: string, a: number) => {
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(rx, ry);
      const g = ctx.createRadialGradient(0, 0, 0.05, 0, 0, 1);
      g.addColorStop(0, rgba(color, 1)); g.addColorStop(0.5, rgba(color, 0.42)); g.addColorStop(1, rgba(color, 0));
      ctx.globalAlpha = a; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawStars = (c: Cam, time: number) => {
      const p = cfgRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = p.dark ? '#dfe7f3' : '#5b6b84';
      const hw = world.w / 2, hh = world.h / 2, spanY = Math.max(world.h, 760);
      for (const st of stars) {
        const sx = (hw + st.x * world.w) * c.scale + c.x, sy = (hh + st.y * spanY) * c.scale + c.y;
        if (sx < -4 || sx > W + 4 || sy < -4 || sy > H + 4) continue;
        ctx.globalAlpha = st.a * (0.55 + 0.45 * Math.sin(time * 0.0012 * st.f + st.p)) * (p.dark ? 1 : 0.5);
        ctx.beginPath(); ctx.arc(sx, sy, st.r, 0, Math.PI * 2); ctx.fill();
      }
    };

    const drawOverview = (alpha: number, c: Cam, time: number) => {
      const p = cfgRef.current, dark = p.dark, k = world.k;
      const route = p.routeId ? model.routes.find((r) => r.id === p.routeId) : null;
      const onRoute = new Set(route?.seriesSeq || []);
      const routeDoms = new Set<string>();
      onRoute.forEach((id) => { const s = model.seriesById.get(id); if (s) routeDoms.add(s.domain); });
      const domOn = (id: string) => (p.domainId ? id === p.domainId : route ? routeDoms.has(id) : true);
      const hoverS = hover?.kind === 'series' ? hover.id : null;
      const hoverD = hover?.kind === 'domain' ? hover.id : null;
      const focusDom = hoverD || (hoverS ? model.seriesById.get(hoverS)?.domain : null);   // 被强调的知识域
      // 悬停 / 筛选强调某个知识域时，别的星团整体变淡
      const domA = (id: string) => alpha * (domOn(id) ? 1 : 0.13) * (focusDom && focusDom !== id ? 0.38 : 1);
      // 首次进入：星团依次浮现
      const introOf = (id: string) => (intro >= 1 ? 1 : ease(clamp(intro * 1.9 - model.domains.findIndex((d) => d.id === id) * 0.05, 0, 1)));

      ctx.setTransform(dpr * c.scale, 0, 0, dpr * c.scale, dpr * c.x, dpr * c.y);

      // ── 星云：贴着内容的椭圆，朝地图中心的一侧更亮 ──
      for (const d of model.domains) {
        const a = domA(d.id) * introOf(d.id);
        if (a < 0.01) continue;
        const solo = d.cw === 0 && d.ch === 0;
        const rx = (solo ? d.box.w / 2 + 18 : d.cw / 2 + 34) , ry = solo ? d.box.h / 2 + 14 : d.ch / 2 + 30;
        glow(d.cx, d.cy, rx, ry, d.color, a * (dark ? 0.24 : 0.2));
        glow(d.cx + d.lobe[0], d.cy + d.lobe[1], rx * 0.6, ry * 0.6, d.color, a * 0.16);
      }

      // ── 连线：职业路线的先后 + 先修关系 ──
      ctx.lineCap = 'round';
      for (const e of model.edges) {
        const a = model.seriesById.get(e.from), b = model.seriesById.get(e.to);
        if (!a || !b) continue;
        const litRoute = false;     // 选中路线时由路线路径统一画，不再逐边高亮
        const litHover = hoverS !== null && (e.from === hoverS || e.to === hoverS);
        if (!litHover && p.domainId) continue;     // 只看某一域时不再画穿过来的线
        const lit = litRoute || litHover;
        const base = Math.min(domA(a.domain), domA(b.domain)) * Math.min(introOf(a.domain), introOf(b.domain));
        ctx.globalAlpha = lit ? alpha * 0.95 : base * (dark ? 0.14 : 0.22);
        ctx.strokeStyle = lit ? theme.accent : mix(theme.sub, theme.ink, 0.2);
        ctx.lineWidth = (lit ? 1.5 : 0.9) / c.scale;
        ctx.setLineDash(litRoute ? [7 / c.scale, 6 / c.scale] : lit && e.k === 'pre' ? [5 / c.scale, 4 / c.scale] : []);
        ctx.lineDashOffset = litRoute ? (-time * 0.03) / c.scale : 0;
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const x1 = a.x + (dx / len) * (a.r + 3), y1 = a.y + (dy / len) * (a.r + 3);
        const x2 = b.x - (dx / len) * (b.r + 11), y2 = b.y - (dy / len) * (b.r + 11);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const cxp = mx - (dy / len) * len * 0.13, cyp = my + (dx / len) * len * 0.13;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cxp, cyp, x2, y2); ctx.stroke();
        if (lit) {
          ctx.fillStyle = ctx.strokeStyle;
          const t = 0.84, u = 1 - t;
          const ex = u * u * x1 + 2 * u * t * cxp + t * t * x2, ey = u * u * y1 + 2 * u * t * cyp + t * t * y2;
          arrow(ex, ey, x2, y2, 6 / c.scale);
        }
        ctx.setLineDash([]);
      }

      // ── 专题星体 + 名字 ──
      ctx.textBaseline = 'middle';
      for (const s of model.series) {
        const color = colorOf(s);
        const isHover = s.id === hoverS;
        const isRoute = onRoute.has(s.id) && !!route;
        const rel = hoverS !== null && linked(s.id, hoverS);
        const grow = introOf(s.domain);
        const base = domA(s.domain) * grow * (route && !isRoute ? 0.42 : 1) * (hoverS !== null && s.id !== hoverS && !rel ? 0.5 : 1);
        if (base < 0.01) continue;
        // 浮现时从知识域中心长出来
        const d = domainOf.get(s.domain);
        const x = d ? d.cx + (s.x - d.cx) * (0.6 + 0.4 * grow) : s.x;
        const y = d ? d.cy + (s.y - d.cy) * (0.6 + 0.4 * grow) : s.y;
        const R = s.r * (isHover ? 1.07 : isRoute ? 1.04 : 1) * (0.5 + 0.5 * grow);
        // 光晕
        const g = ctx.createRadialGradient(x, y, R * 0.5, x, y, R * 2.2);
        g.addColorStop(0, rgba(color, isHover ? 0.55 : 0.11)); g.addColorStop(1, rgba(color, 0));
        ctx.globalAlpha = base; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, R * 2.2, 0, Math.PI * 2); ctx.fill();
        // 星体
        const g2 = ctx.createRadialGradient(x - R * 0.32, y - R * 0.36, R * 0.08, x, y, R);
        g2.addColorStop(0, mix(color, '#ffffff', dark ? 0.55 : 0.72));
        g2.addColorStop(0.6, color);
        g2.addColorStop(1, mix(color, '#000000', dark ? 0.45 : 0.2));
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 0.8; ctx.strokeStyle = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'; ctx.stroke();
        if (isHover || isRoute || rel) {
          ctx.globalAlpha = base * (rel && !isHover && !isRoute ? 0.75 : 1);
          ctx.lineWidth = (isHover || isRoute ? 2 : 1.2) / c.scale;
          ctx.strokeStyle = isHover || isRoute ? theme.accent : color;
          const ring = R + 3.5 / c.scale + (isRoute ? (Math.sin(time * 0.004) + 1) * 1.2 / c.scale : 0);
          ctx.beginPath(); ctx.arc(x, y, ring, 0, Math.PI * 2); ctx.stroke();
        }
        // 大一些的星体里写篇数（单专题知识域的星体是名字前的圆点，篇数跟在名字后面，不重复写）
        if (s.r >= 15 && !(d && d.cw === 0 && d.ch === 0)) {
          ctx.globalAlpha = base * 0.95;
          ctx.fillStyle = dark ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.97)';
          ctx.font = gfont(700, Math.max(9, Math.min(12, s.r * 0.5)) * (0.5 + 0.5 * grow));
          ctx.textAlign = 'center';
          ctx.fillText(String(s.count), x, y + 0.5);
        }
        // 名字（整张图缩小时字号有下限：再小就看不清了，下限字号仍在预留的标签盒子里）
        if (s.lw > 0) {
          ctx.globalAlpha = base;
          ctx.font = gfont(isHover || rel ? 600 : 500, Math.max(10, LABEL_PX * k) * (0.7 + 0.3 * grow));
          ctx.fillStyle = isHover ? theme.accent : rel || isRoute ? theme.ink : theme.sub;
          const side = s.side;
          ctx.textAlign = side === 0 ? 'left' : side === 1 ? 'right' : 'center';
          const lx = x + (s.lx - s.x) * (0.6 + 0.4 * grow), ly = y + (s.ly - s.y) * (0.6 + 0.4 * grow);
          ctx.fillText(s.short, side === 0 ? lx : side === 1 ? lx + s.lw : lx + s.lw / 2, ly + s.lh / 2);
        }
      }

      // ── 知识域名 ──
      for (const d of model.domains) {
        const grow = introOf(d.id);
        const a = domA(d.id) * grow;
        if (a < 0.01) continue;
        const t = d.title, active = p.domainId === d.id, solo = d.cw === 0 && d.ch === 0;
        ctx.globalAlpha = a;
        if (!solo) {
          ctx.fillStyle = d.color;
          ctx.shadowColor = rgba(d.color, 0.9); ctx.shadowBlur = 9;
          ctx.beginPath(); ctx.arc(t.x - (TITLE_DOT - 5) * k, t.y + t.h / 2, 3.5 * k, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.font = gfont(600, Math.max(11.5, TITLE_PX * k) * (0.7 + 0.3 * grow));
        ctx.fillStyle = active || hoverD === d.id ? theme.accent : theme.ink;
        ctx.textAlign = 'left';
        ctx.fillText(d.name, t.x, t.y + t.h / 2 + 0.5);
        // 知识域名字号有下限，篇数跟着名字的实际宽度往后排
        ctx.font = gfont(500, Math.max(10, COUNT_PX * k) * (0.7 + 0.3 * grow));
        ctx.fillStyle = theme.mute;
        ctx.fillText(`${d.count} 篇`, t.x + measure(d.name, gfont(600, Math.max(11.5, TITLE_PX * k) * (0.7 + 0.3 * grow))) + 8 * k, t.y + t.h / 2 + 0.5);
      }

      // ── 职业路线：把经过的星体按阶段先后串起来 ──
      if (route) {
        const pts = route.seriesSeq.map((id) => model.seriesById.get(id)).filter((v): v is SeriesNode => !!v);
        ctx.lineJoin = 'round';
        if (pts.length > 1) {
          ctx.globalAlpha = alpha * 0.92;
          ctx.strokeStyle = theme.accent; ctx.lineWidth = 2.2 / Math.sqrt(c.scale);
          ctx.setLineDash([9, 7]); ctx.lineDashOffset = -time * 0.045;
          ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 1; i++) {
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
          }
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.stroke(); ctx.setLineDash([]);
        }
        // 阶段序号：标在每个阶段的第一个专题上；一个专题跨了几个阶段就写成 1-2
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const stageOf = new Map<string, number[]>();
        route.stages.forEach((st, i) => {
          const sid = st.seriesIds[0];
          if (sid) { if (!stageOf.has(sid)) stageOf.set(sid, []); stageOf.get(sid)!.push(i + 1); }
        });
        stageOf.forEach((nums, sid) => {
          const s = model.seriesById.get(sid);
          if (!s) return;
          const R = Math.max(9, s.r * 0.8);
          const label = nums.length === 1 ? String(nums[0]) : nums.every((v, i) => i === 0 || v === nums[i - 1] + 1) ? `${nums[0]}-${nums[nums.length - 1]}` : nums.join('·');
          ctx.globalAlpha = alpha;
          ctx.fillStyle = theme.accent;
          ctx.beginPath(); ctx.arc(s.x, s.y, R, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = gfont(700, Math.max(10, R * (nums.length > 1 ? 0.82 : 1.05)));
          ctx.fillText(label, s.x, s.y + 0.5);
        });
      }
      ctx.globalAlpha = 1;
    };

    // ───────────────────────── 专题层绘制 ─────────────────────────
    /** 标题在屏幕上的盒子（固定字号） */
    const labelRect = (x: number, y: number, side: number, w: number) => {
      const R = 12, g = 6, h = 16;
      if (side === 0) return { x: x + R + g, y: y - h / 2, w, h };
      if (side === 1) return { x: x - R - g - w, y: y - h / 2, w, h };
      if (side === 2) return { x: x - w / 2, y: y - R - g - h, w, h };
      return { x: x - w / 2, y: y + R + g, w, h };
    };
    // 文章标题的排布（哪个标题放哪一侧）只跟缩放有关，按缩放缓存
    let sideCache: { scale: number; sides: number[]; widths: number[] } | null = null;
    /**
     * 给每个文章标题挑一侧：朝外的横排 → 朝外的竖排 → 另一侧竖排 → 朝内的横排，
     * 要求不压已放好的标题、也不压别的节点；都放不下就不显示（悬停时另有完整提示）。
     * 相邻两圈、同一条射线上的两篇，朝外的标题会撞在一起，所以必须有这一步碰撞检测。
     */
    const detailSides = (dl: DetailLayout, s: number) => {
      if (sideCache && Math.abs(sideCache.scale / s - 1) < 0.02) return sideCache;
      const srs = detailSeries!;
      const n = srs.count, ox = world.w / 2, oy = world.h / 2;
      const units = clamp((128 * s - 26) / 12, 0, 12);
      const maxU = Math.min(units, 10);
      const widths = srs.postIds.map((id) => {
        let u = 0;
        for (const ch of model.postTitle.get(id) || id) { u += isWide(ch) ? 1 : 0.55; if (u > maxU) break; }
        return Math.min(u, maxU) * 12 + 4;
      });
      const placed: Rect[] = [];
      const sides = new Array<number>(n).fill(-1);
      const order = Array.from({ length: n }, (_, i) => i)
        .sort((a, b) => Math.hypot(dl.points[a].x, dl.points[a].y) - Math.hypot(dl.points[b].x, dl.points[b].y));   // 里圈的先挑（外圈外面更空）
      for (const i of order) {
        const pt = dl.points[i], x = (ox + pt.x) * s, y = (oy + pt.y) * s;
        const horiz = Math.abs(pt.x) > Math.abs(pt.y) * 0.75;
        const pref = horiz ? (pt.x >= 0 ? 0 : 1) : (pt.y < 0 ? 2 : 3);
        const cands = [
          pref,
          pref < 2 ? (pt.y < 0 ? 2 : 3) : (pt.x >= 0 ? 0 : 1),
          pref < 2 ? (pref === 0 ? 1 : 0) : (pref === 2 ? 3 : 2),
          pref < 2 ? (pt.y < 0 ? 3 : 2) : (pt.x >= 0 ? 1 : 0),
        ];
        for (const side of cands) {
          const r = labelRect(x, y, side, widths[i]);
          if (placed.some((p) => r.x < p.x + p.w + 3 && r.x + r.w + 3 > p.x && r.y < p.y + p.h + 2 && r.y + r.h + 2 > p.y)) continue;
          let hitNode = false;
          for (let j = 0; j < n && !hitNode; j++) {
            if (j === i) continue;
            const q = dl.points[j];
            const nx = Math.max(r.x, Math.min((ox + q.x) * s, r.x + r.w)), ny = Math.max(r.y, Math.min((oy + q.y) * s, r.y + r.h));
            if (Math.hypot((ox + q.x) * s - nx, (oy + q.y) * s - ny) < 12) hitNode = true;
          }
          if (hitNode) continue;
          // 中心圆（专题名、进度）也是障碍
          const hx = ox * s, hy = oy * s;
          const cx = Math.max(r.x, Math.min(hx, r.x + r.w)), cy = Math.max(r.y, Math.min(hy, r.y + r.h));
          if (Math.hypot(hx - cx, hy - cy) < dl.hub * s + 4) continue;
          sides[i] = side; placed.push(r); break;
        }
      }
      sideCache = { scale: s, sides, widths };
      return sideCache;
    };

    const drawDetail = (alpha: number, c: Cam, reveal: number, time: number) => {
      const s = detailSeries, dl = detail;
      if (!s || !dl) return;
      const p = cfgRef.current, dark = p.dark;
      const d = domainOf.get(s.domain);
      const color = d?.color || '#9aa8bd';
      const ox = world.w / 2, oy = world.h / 2;      // 螺旋中心 = 世界的中心
      const hoverPost = hover?.kind === 'post' ? hover.id : null;
      const shown = Math.max(2, Math.floor(dl.path.length * reveal));
      // 相邻两篇在屏幕上的弧长里放得下几个字：标题长度跟着它走，放不下就淡出只留编号（标题看右侧列表或放大）
      const units = clamp((128 * c.scale - 26) / 12, 0, 12);
      const lod = clamp((units - 3.2) / 1.2, 0, 1);

      ctx.setTransform(dpr * c.scale, 0, 0, dpr * c.scale, dpr * c.x, dpr * c.y);
      glow(ox, oy, dl.radius + 170, dl.radius + 170, color, alpha * (dark ? 0.11 : 0.1));

      // 螺旋阅读路径
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = theme.accent; ctx.lineWidth = 1.5 / c.scale; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < shown; i++) { const q = dl.path[i]; if (!i) ctx.moveTo(ox + q.x, oy + q.y); else ctx.lineTo(ox + q.x, oy + q.y); }
      ctx.stroke();
      const last = dl.path[shown - 1], prev = dl.path[Math.max(0, shown - 5)];
      ctx.globalAlpha = alpha * 0.8; ctx.fillStyle = theme.accent;
      arrow(ox + prev.x, oy + prev.y, ox + last.x, oy + last.y, 8 / c.scale);

      // 中心圆：专题信息
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dark ? 'rgba(26,31,46,0.95)' : 'rgba(255,255,255,0.97)';
      ctx.strokeStyle = color; ctx.lineWidth = 2 / c.scale;
      ctx.beginPath(); ctx.arc(ox, oy, dl.hub, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = color; ctx.font = gfont(600, 11);
      ctx.fillText(clipText(d?.name || '', 9), ox, oy - 38);
      ctx.fillStyle = theme.ink; ctx.font = gfont(700, 15);
      ctx.fillText(clipText(s.name, 10), ox, oy - 14);
      ctx.fillStyle = theme.sub; ctx.font = gfont(500, 12);
      ctx.fillText(`${s.count} 篇 · 已读 ${s.postIds.filter((id) => p.readSet.has(id)).length}`, ox, oy + 10);
      if (s.source) { ctx.font = gfont(400, 10.5); ctx.fillStyle = theme.mute; ctx.fillText(clipText(`来源 ${s.source}`, 15), ox, oy + 32); }
      ctx.textAlign = 'left';

      // 文章节点（已读的用领域色实心 + 对勾）
      const cache = detailSides(dl, c.scale);
      s.postIds.forEach((id, i) => {
        if (i / s.count > reveal * 1.05) return;
        const pt = dl.points[i], x = ox + pt.x, y = oy + pt.y;
        const read = p.readSet.has(id);
        const isHover = id === hoverPost, isFocus = id === p.focusPostId;
        const R = (isHover ? 12 : 9.5) / Math.min(1, c.scale);
        ctx.globalAlpha = alpha;
        if (isFocus) {
          ctx.strokeStyle = theme.accent; ctx.lineWidth = 2 / c.scale;
          ctx.beginPath(); ctx.arc(x, y, R + 5 + Math.sin(time * 0.006) * 2, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = read ? color : dark ? '#0f1419' : '#ffffff';
        ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2 / c.scale; ctx.strokeStyle = isHover || isFocus ? theme.accent : color; ctx.stroke();
        ctx.fillStyle = read ? '#fff' : color;
        ctx.font = gfont(700, (isHover ? 10.5 : 9.5) / Math.min(1, c.scale));
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(read ? '✓' : String(i + 1), x, y + 0.5);
        // 标题：屏幕空间固定字号；哪一侧由 detailSides 按碰撞检测挑好；缩小时淡出
        const la = alpha * lod * (hoverPost !== null && !isHover ? 0.42 : 1);
        const side = cache.sides[i] >= 0 ? cache.sides[i] : isHover ? 2 : -1;
        if (la > 0.01 && side >= 0) {
          const off = 6 / c.scale;
          const maxU = isHover ? 17 : Math.min(units, side < 2 ? 10 : 8.5);
          const title = clipText(model.postTitle.get(id) || id, maxU);
          ctx.font = gfont(isHover ? 600 : 400, 12 / c.scale);
          ctx.fillStyle = isHover ? theme.accent : read ? theme.ink : theme.sub;
          ctx.textAlign = side === 0 ? 'left' : side === 1 ? 'right' : 'center';
          const tx = x + (side === 0 ? 12 / c.scale + off : side === 1 ? -12 / c.scale - off : 0);
          const ty = y + (side === 2 ? -12 / c.scale - off : side === 3 ? 12 / c.scale + off : 0);
          ctx.globalAlpha = la;
          if (isHover) {
            // 悬停的标题垫一块底色，压在其它标题上面也读得清
            const tw = measure(title, ctx.font) + 12 / c.scale, th = 20 / c.scale;
            const bx = side === 0 ? tx - 6 / c.scale : side === 1 ? tx - tw + 6 / c.scale : tx - tw / 2;
            const by = ty - th / 2;
            ctx.save();
            ctx.globalAlpha = alpha * 0.96;
            ctx.fillStyle = dark ? 'rgba(15,20,25,0.95)' : 'rgba(255,255,255,0.97)';
            roundRect(ctx, bx, by, tw, th, 6 / c.scale); ctx.fill();
            ctx.strokeStyle = theme.accent; ctx.lineWidth = 1 / c.scale; ctx.stroke();
            ctx.restore();
            ctx.globalAlpha = la;
          }
          ctx.fillText(title, tx, ty);
        }
      });
      ctx.globalAlpha = 1;
    };

    // ───────────────────────── 命中检测 ─────────────────────────
    const hitTest = (mx: number, my: number, c: Cam): GraphHover => {
      const wx = (mx - c.x) / c.scale, wy = (my - c.y) / c.scale;
      if (appliedDetail && anim.t > 0.5) {
        if (!detailSeries || !detail) return null;
        const r = 13 / c.scale, ox = world.w / 2, oy = world.h / 2;
        for (let i = detailSeries.count - 1; i >= 0; i--) {
          const pt = detail.points[i];
          if (Math.hypot(ox + pt.x - wx, oy + pt.y - wy) <= r) return { kind: 'post', id: detailSeries.postIds[i], x: mx, y: my };
        }
        return null;
      }
      const pad = 4 / c.scale;
      for (const s of model.series) {
        if (Math.hypot(s.x - wx, s.y - wy) <= s.r + pad) return { kind: 'series', id: s.id, x: mx, y: my };
        if (s.lw > 0 && wx >= s.lx - pad && wx <= s.lx + s.lw + pad && wy >= s.ly - pad && wy <= s.ly + s.lh + pad) {
          return { kind: 'series', id: s.id, x: mx, y: my };
        }
      }
      for (const d of model.domains) {
        const b = d.box;
        if (b.w && wx >= b.x - pad && wx <= b.x + b.w + pad && wy >= b.y - pad && wy <= b.y + b.h + pad) {
          return { kind: 'domain', id: d.id, x: mx, y: my };
        }
      }
      return null;
    };

    // ───────────────────────── 主循环 ─────────────────────────
    let raf = 0, last = performance.now(), wasU = 0, lastDark = cfgRef.current.dark;
    let lastDomain: string | null = null, lastRoute: string | null = null, lastRight = -1;
    let errors = 0;
    const sameHover = (a: GraphHover, b: GraphHover) => a?.kind === b?.kind && a?.id === b?.id;
    /** 全景层把地图限制在可视区内：地图比可视区小就居中，大就允许拖到贴边 */
    const clampCam = () => {
      const p = cfgRef.current;
      if (appliedDetail || p.domainId) return;
      const left = PAD - 8, right = W - p.inset.right - PAD + 8, top = p.inset.top + PAD - 8, bottom = H - p.inset.bottom - PAD + 8;
      const bw = world.w * camT.scale, bh = world.h * camT.scale;
      camT.x = bw <= right - left ? left + (right - left - bw) / 2 : clamp(camT.x, right - bw, left);
      camT.y = bh <= bottom - top ? top + (bottom - top - bh) / 2 : clamp(camT.y, bottom - bh, top);
    };
    const frame = (t: number) => {
      const dt = Math.min(50, Math.max(0, t - last)); last = t;
      const p = cfgRef.current;
      syncBitmap();
      if (layoutDirty && t >= layoutAt) relayout();
      if (p.dark !== lastDark) { lastDark = p.dark; readTheme(); }
      if (intro < 1) intro = Math.min(1, intro + dt / 900);

      // 选中知识域 / 路线、信息卡开合：相机跟着对准
      if (!appliedDetail) {
        if (p.domainId !== lastDomain) {
          lastDomain = p.domainId;
          if (p.domainId) fitDomain(p.domainId); else fit();
        } else if (p.inset.right !== lastRight && p.domainId) fitDomain(p.domainId);
        if (p.routeId !== lastRoute) {
          lastRoute = p.routeId;
          const r = p.routeId ? model.routes.find((x) => x.id === p.routeId) : null;
          if (r) fitRect(r.seriesSeq);
        }
      } else if (p.inset.right !== lastRight && detail) {
        anim.detail = detailCam();
        if (anim.t >= 1) Object.assign(camT, anim.detail);
      }
      lastRight = p.inset.right;

      // 进入 / 退出某个专题
      const want = p.level === 'detail' && p.seriesId ? p.seriesId : null;
      if (want !== appliedDetail) {
        const target = want ? model.seriesById.get(want) : null;
        if (target) { appliedDetail = want; sideCache = null; startDrill(target); }
        else { appliedDetail = null; startBack(); }
      }
      // 过渡进度
      if (anim.dir > 0 && anim.t < 1) anim.t = Math.min(1, anim.t + dt / 900);
      else if (anim.dir < 0 && anim.t > 0) anim.t = Math.max(0, anim.t - dt / 760);
      // 相机
      const u = anim.t;
      if (u > 0 && u < 1) {
        if (u <= 0.4) { const e = ease(u / 0.4); now.scale = lerp(anim.from.scale, anim.zoom.scale, e); now.x = lerp(anim.from.x, anim.zoom.x, e); now.y = lerp(anim.from.y, anim.zoom.y, e); }
        else { const e = ease((u - 0.4) / 0.6); now.scale = lerp(anim.zoom.scale, anim.detail.scale, e); now.x = lerp(anim.zoom.x, anim.detail.x, e); now.y = lerp(anim.zoom.y, anim.detail.y, e); }
      } else {
        // 过渡刚结束的那一帧：把相机落定到终点，之后交给用户自由平移缩放
        if (u >= 1 && wasU < 1) Object.assign(cam, anim.detail);
        if (u <= 0 && wasU > 0) { Object.assign(cam, anim.from); detailSeries = null; detail = null; }
        const k = 1 - Math.pow(0.002, dt / 1000);    // 与帧率无关的缓动
        clampCam();
        cam.scale = lerp(cam.scale, camT.scale, k); cam.x = lerp(cam.x, camT.x, k); cam.y = lerp(cam.y, camT.y, k);
        Object.assign(now, cam);
        if (u <= 0) { Object.assign(homeCam, cam); seenOverview = true; }
      }
      wasU = u;

      // 悬停：相机自己动的时候（动画 / 缩放）在循环里重算；鼠标移动时的更新在 onMove 里做
      const transitioning = u > 0 && u < 1;
      if (pointer.inside && !transitioning && pointers.size <= 1 && !dragging) {
        const h = hitTest(pointer.x, pointer.y, now);
        if (!sameHover(h, hover)) { hover = h; cfgRef.current.onHover(h); }
        canvas.style.cursor = h ? 'pointer' : 'grab';
      }

      // 不依赖当前变换：按设备像素清掉整张位图
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawStars(now, t);
      const ovAlpha = u <= 0.4 ? 1 - u / 0.4 : 0;
      const reveal = u <= 0.4 ? 0 : (u - 0.4) / 0.6;
      if (ovAlpha > 0) drawOverview(ovAlpha, now, t);
      if (reveal > 0) drawDetail(reveal, now, reveal, t);
    };
    // 绘制出错不能让循环死掉：否则画布会永远停在出错的那半帧上
    const loop = (t: number) => {
      if (t < last) last = t - 16;
      try { frame(t); errors = 0; }
      catch (err) { errors += 1; console.error('[graph2d]', err); }
      // 连续出错就停，避免每帧刷屏
      if (errors < 3) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // ───────────────────────── 交互 ─────────────────────────
    const pointers = new Map<number, { x: number; y: number }>();
    let dragging = false;
    let down: { x: number; y: number; cx: number; cy: number; moved: number } | null = null;
    let pinch = { d: 0, scale: 1 };
    const local = (e: PointerEvent | WheelEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const zoomAt = (mx: number, my: number, next: number) => {
      const fitS = Math.min(1, view.w / world.w);
      const ns = clamp(next, Math.min(0.4, fitS * 0.8), 3.4);
      camT.x = mx - (mx - camT.x) * (ns / camT.scale);
      camT.y = my - (my - camT.y) * (ns / camT.scale);
      camT.scale = ns;
    };
    const onDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, local(e));
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), scale: camT.scale };
        down = null; dragging = false;
        return;
      }
      canvas.setPointerCapture?.(e.pointerId);
      const pt = local(e);
      down = { x: pt.x, y: pt.y, cx: camT.x, cy: camT.y, moved: 0 };
      dragging = false;
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      const pt = local(e);
      pointer.x = pt.x; pointer.y = pt.y; pointer.inside = true;
      // 提示框跟随鼠标（只在确实悬停在同一节点上时）
      if (hover && pointers.size <= 1 && !dragging && !(anim.t > 0 && anim.t < 1)) {
        const h = hitTest(pt.x, pt.y, now);
        if (h && sameHover(h, hover)) { hover = h; cfgRef.current.onHover(h); }
      }
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, pt);
      if (pointers.size === 2 && pinch.d) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const ns = clamp(pinch.scale * (dist / pinch.d), 0.4, 3.4);
        camT.x = mid.x - (mid.x - camT.x) * (ns / camT.scale);
        camT.y = mid.y - (mid.y - camT.y) * (ns / camT.scale);
        camT.scale = ns;
        return;
      }
      if (down) {
        down.moved = Math.max(down.moved, Math.hypot(pt.x - down.x, pt.y - down.y));
        if (down.moved > 4) dragging = true;
        if (dragging) { camT.x = down.cx + (pt.x - down.x); camT.y = down.cy + (pt.y - down.y); }
      }
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch.d = 0;
      canvas.style.cursor = 'grab';
      if (down && !dragging && !(anim.t > 0 && anim.t < 1)) {
        const pt = local(e);
        const h = hitTest(pt.x, pt.y, now);
        if (h?.kind === 'series') cfgRef.current.onDrill(h.id);
        else if (h?.kind === 'post') cfgRef.current.onOpenPost(h.id);
        else if (h?.kind === 'domain') { cfgRef.current.onSelectDomain(h.id); fitDomain(h.id); }
        else if (cfgRef.current.domainId) cfgRef.current.onSelectDomain(null);
      }
      down = null; dragging = false;
    };
    const onDbl = (e: MouseEvent) => {
      if (appliedDetail) { zoomAt(e.clientX - canvas.getBoundingClientRect().left, e.clientY - canvas.getBoundingClientRect().top, camT.scale * 1.6); return; }
      const pt = local(e);
      const h = hitTest(pt.x, pt.y, now);
      if (h?.kind === 'domain') fitDomain(h.id);
      else zoomAt(pt.x, pt.y, camT.scale * 1.6);
    };
    const onLeave = () => {
      pointer.inside = false;
      if (hover) { hover = null; cfgRef.current.onHover(null); }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const pt = local(e);
      zoomAt(pt.x, pt.y, camT.scale * Math.exp(-e.deltaY * 0.0016));
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && cfgRef.current.level === 'detail') cfgRef.current.onBack(); };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('dblclick', onDbl);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      apiRef.current = null;
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('dblclick', onDbl);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, [model]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-grab touch-none select-none" />;
});
