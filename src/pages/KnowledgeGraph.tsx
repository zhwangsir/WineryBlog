import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useData } from '../context/DataContext';

interface GraphNode { id: string; t: string; s: string; href: string; x?: number; y?: number; vx?: number; vy?: number }
interface GraphEdge { a: number; b: number; k: string }

const SHELF_COLORS: Record<string, string> = {
  "方法与工具": "#8a8577", "编程语言": "#a63d2a", "数据结构与算法": "#c28a2e",
  "计算机网络": "#3a7d8c", "计算机组成": "#7a8b3a", "操作系统与运维": "#4a5fb0",
  "数据库": "#2e8b74", "Web 前端": "#d4694f", "后端开发": "#5a4fa0",
  "移动与跨端": "#b05a8c", "大数据": "#3a6ea5", "人工智能": "#8c5a2e",
  "信息安全": "#6e3a8c", "项目实战": "#4a8c5c", "随笔": "#7a8b7a",
};

export const KnowledgeGraph: React.FC = () => {
  const { posts } = useData();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [loading, setLoading] = useState(true);
  const [filterShelf, setFilterShelfState] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const engine2Ref = useRef<any>(null);
  const engine3Ref = useRef<any>(null);
  const rafRef = useRef(0);

  // 从 posts 构建图谱数据
  const graphData = React.useMemo(() => {
    if (!posts.length) return null;
    const nodes = posts.map((p, i) => ({
      id: p.id, t: p.title, s: p.category, href: `/post/${p.id}`,
      x: 0, y: 0, vx: 0, vy: 0,
    }));
    const edgeSet = new Set<string>();
    const edges: { a: number; b: number; k: string }[] = [];
    const addEdge = (a: number, b: number, k: string) => {
      if (a === b) return;
      const lo = Math.min(a, b), hi = Math.max(a, b);
      const key = `${lo}-${hi}`;
      if (edgeSet.has(key)) return;
      edgeSet.add(key); edges.push({ a: lo, b: hi, k });
    };
    // 系列链
    const byCat = new Map<string, any[]>();
    posts.forEach(p => {
      const arr = byCat.get(p.category) || []; arr.push(p); byCat.set(p.category, arr);
    });
    byCat.forEach(arr => {
      const numbered = arr
        .filter((p: any) => /^(\d+)[\.、]/.test(p.title))
        .map((p: any) => ({ p, num: parseFloat(p.title.match(/^(\d+)[\.、]/)[1]) }))
        .sort((a, b) => a.num - b.num);
      for (let i = 0; i < numbered.length - 1; i++) {
        const ai = nodes.findIndex(n => n.id === numbered[i].p.id);
        const bi = nodes.findIndex(n => n.id === numbered[i + 1].p.id);
        if (ai >= 0 && bi >= 0) addEdge(ai, bi, 'next');
      }
    });
    // 标签重叠
    posts.forEach((p, i) => {
      posts.forEach((q, j) => {
        if (j <= i || p.category !== q.category) return;
        const shared = (p.tags || []).filter((t: string) => (q.tags || []).includes(t));
        if (shared.length >= 2) addEdge(i, j, 'rel');
      });
    });
    // 同目录环形
    byCat.forEach(arr => {
      if (arr.length > 2) {
        arr.forEach((p: any, i: number) => {
          for (const off of [1, 2]) {
            const q = arr[(i + off) % arr.length];
            const pi = nodes.findIndex(n => n.id === p.id), qi = nodes.findIndex(n => n.id === q.id);
            if (pi >= 0 && qi >= 0) addEdge(pi, qi, 'rel');
          }
        });
      }
    });
    return { nodes, edges };
  }, [posts]);

  // ---------- 2D Canvas 引擎 ----------
  useEffect(() => {
    if (mode !== '2d' || !graphData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    function dpr() { return Math.min(devicePixelRatio || 1, 2); }
    let view = { x: 0, y: 0, scale: 1 };
    let hoverNode: any = null, dragN: any = null, dragging = false, moved = false, pan = false, lastPan: [number, number] | null = null;
    let running = true;
    let filter = filterShelf;

    const nodes = graphData.nodes.map(n => ({ ...n }));
    const edges = graphData.edges;
    const adj: Record<string, string[]> = {};
    edges.forEach(e => {
      (adj[nodes[e.a].id] = adj[nodes[e.a].id] || []).push(nodes[e.b].id);
      (adj[nodes[e.b].id] = adj[nodes[e.b].id] || []).push(nodes[e.a].id);
    });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 初始分区布局
    const shelfList = [...new Set(nodes.map(n => n.s))];
    nodes.forEach((n, i) => {
      const si = shelfList.indexOf(n.s);
      const ang = (si / shelfList.length) * Math.PI * 2 + (i % 17) * 0.37;
      const r = 80 + (i % 23) * 15;
      n.x = Math.cos(ang) * r; n.y = Math.sin(ang) * r;
    });

    function resize() {
      const d = dpr();
      const r = canvas.getBoundingClientRect();
      if (r.width === 0) return;
      canvas.width = r.width * d; canvas.height = r.height * d;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function step() {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy + 0.01;
          if (d2 < 100000) {
            const d = Math.sqrt(d2);
            const f = Math.min(6800 / d2, 5);
            a.vx += dx / d * f; a.vy += dy / d * f;
            b.vx -= dx / d * f; b.vy -= dy / d * f;
          }
        }
      }
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const f = (d - 64) * 0.028;
        a.vx += dx / d * f; a.vy += dy / d * f;
        b.vx -= dx / d * f; b.vy -= dy / d * f;
      });
      nodes.forEach(n => {
        if (n === dragN) return;
        n.vx -= n.x * 0.009; n.vy -= n.y * 0.009;
        n.vx *= 0.8; n.vy *= 0.8;
        n.x += n.vx; n.y += n.vy;
      });
    }

    function draw() {
      const d = dpr();
      const cs = getComputedStyle(document.documentElement);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = d;
      ctx.strokeStyle = cs.getPropertyValue('--border') || '#ddd';
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        if (!a || !b) return;
        if (filter && a.s !== filter && b.s !== filter) return;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      const ink = cs.getPropertyValue('--text-primary') || '#333';
      const R = 5 * d;
      nodes.forEach(n => {
        if (filter && n.s !== filter) return;
        const isHi = hoverNode === n || (hoverNode && isConnected(n.id, hoverNode.id));
        ctx.beginPath(); ctx.arc(n.x, n.y, isHi ? R * 1.6 : R, 0, Math.PI * 2);
        ctx.fillStyle = SHELF_COLORS[n.s] || '#a63d2a';
        ctx.globalAlpha = hoverNode && !isHi ? 0.22 : 1;
        ctx.fill();
        if (view.scale > 0.85 || isHi) {
          ctx.fillStyle = ink;
          ctx.font = `${11 * d}px sans-serif`;
          ctx.fillText(n.t.slice(0, 15), n.x * view.scale + view.x + R + 3, n.y * view.scale + view.y + 4);
        }
      });
    }
    function isConnected(a: string, b: string) {
      return (adj[a] || []).includes(b);
    }
    function w2s(n: any) {
      return [n.x * view.scale + view.x, n.y * view.scale + view.y];
    }

    function loop() {
      if (!running) return;
      if (!reduceMotion) { step(); step(); }
      draw(); requestAnimationFrame(loop);
    }
    if (reduceMotion) { for (let i = 0; i < 400; i++) step(); }
    loop();

    // 交互
    function screenToWorld(mx: number, my: number) {
      const r = canvas.getBoundingClientRect();
      const d = dpr();
      return [(mx - r.left) * d / view.scale + view.x, (my - r.top) * d / view.scale + view.y];
    }
    function pick(mx: number, my: number) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (filter && n.s !== filter) continue;
        const p = w2s(n);
        const R = 5 * dpr();
        const dx = mx - p[0], dy = my - p[1];
        if (dx * dx + dy * dy < (R + 4) * (R + 4)) return n;
      }
      return null;
    }
    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const d = dpr();
      const mx = (e.clientX - r.left) * d, my = (e.clientY - r.top) * d;
      if (dragN) { const w = screenToWorld(mx, my); dragN.x = w[0]; dragN.y = w[1]; moved = true; return; }
      if (pan && lastPan) {
        view.x -= (e.clientX - lastPan[0]) / view.scale * d;
        view.y -= (e.clientY - lastPan[1]) / view.scale * d;
        lastPan = [e.clientX, e.clientY]; return;
      }
      hoverNode = pick(mx, my);
      canvas.style.cursor = hoverNode ? 'pointer' : 'default';
      draw();
    };
    const onMouseDown = (e: MouseEvent) => { dragN = pick(e.offsetX, e.offsetY); dragging = !!dragN; moved = false; };
    const onMouseUp = () => { dragN = null; dragging = false; pan = false; lastPan = null; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      view.scale *= e.deltaY > 0 ? 0.92 : 1.08;
      view.scale = Math.max(0.3, Math.min(3.5, view.scale));
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', e => { dragN = pick(e.offsetX, e.offsetY); dragging = !!dragN; moved = false; });
    window.addEventListener('mouseup', () => { dragN = null; dragging = false; pan = false; lastPan = null; });
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      running = false;
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [graphData, mode, filterShelf]);

  // ---------- 3D 引擎（3d-force-graph） ----------
  const el3dRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mode !== '3d' || !graphData || !el3dRef.current || engine3Ref.current) return;
    const w = window as any;
    if (!w.ForceGraph3D) {
      const s = document.createElement('script');
      s.src = '/vendor/3d-force-graph.min.js';
      s.onload = () => init3D();
      document.head.appendChild(s);
    } else {
      init3D();
    }
    function init3D() {
      if (!w.ForceGraph3D || !el3dRef.current) return;
      const el = el3dRef.current;
      const nodes = graphData.nodes.map(n => ({ ...n }));
      const links = graphData.edges.map(e => ({ source: e.a, target: e.b, k: e.k }));
      const g = w.ForceGraph3D()(el)
        .graphData({ nodes, links })
        .backgroundColor('rgba(0,0,0,0)')
        .showNavInfo(false)
        .nodeColor((n: any) => {
          const c = SHELF_COLORS[n.s] || '#a63d2a';
          return filterShelf && n.s !== filterShelf ? c + '22' : c;
        })
        .nodeVal((n: any) => 3 + Math.sqrt(links.filter((l: any) => l.source === n.id || l.target === n.id).length) * 1.6)
        .nodeLabel((n: any) => `<div style="font:600 13px sans-serif">${n.t}<br><span style="opacity:.6;font-weight:400">${n.s}</span></div>`)
        .nodeOpacity(0.92)
        .linkColor((l: any) => l.k === 'pre' ? 'rgba(166,61,42,0.4)' : 'rgba(140,132,120,0.2)')
        .linkWidth((l: any) => l.k === 'pre' ? 1.2 : 0.4)
        .linkOpacity(0.5)
        .width(el.clientWidth).height(el.clientHeight)
        .onNodeClick((n: any) => { if (n.href) window.location.href = n.href; });
      g.cameraPosition({ z: 620 });
      [2200, 4500, 7500].forEach(t => setTimeout(() => { try { g.zoomToFit(700, 70); } catch {} }, t));
      engine3Ref.current = g;
    }
  }, [mode, graphData, filterShelf]);

  // ---------- 滤镜 ----------
  const applyFilter = (s: string | null) => {
    setFilterShelfState(s);
    if (engine3Ref.current?.nodeColor) {
      engine3Ref.current.nodeColor((n: any) => {
        const c = SHELF_COLORS[n.s] || '#a63d2a';
        return s && n.s !== s ? c + '22' : c;
      });
    }
  };

  const shelves = graphData ? [...new Set(graphData.nodes.map(n => n.s))] : [];
  const shelfCounts: Record<string, number> = {};
  if (graphData) graphData.nodes.forEach(n => { shelfCounts[n.s] = (shelfCounts[n.s] || 0) + 1; });

  return (
    <div className="flex flex-col gap-4">
      {/* 控制台 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex p-1 gap-1 rounded-full border border-border/30 bg-bg-card/80">
          <button className={`px-4 py-1.5 rounded-full text-sm font-medium ${mode === '2d' ? 'bg-accent text-white' : 'text-text-secondary hover:text-accent'}`} onClick={() => setMode('2d')}>2D 平面</button>
          <button className={`px-4 py-1.5 rounded-full text-sm font-medium ${mode === '3d' ? 'bg-accent text-white' : 'text-text-secondary hover:text-accent'}`} onClick={() => setMode('3d')}>3D 星域</button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input className="w-52 h-8 pl-9 pr-3 rounded-full border border-border/30 bg-bg-card text-xs outline-none focus:border-accent" placeholder="定位文章…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
        <div className="text-xs text-text-muted">
          {graphData ? <><span className="text-accent font-medium">{graphData.nodes.length}</span> 篇 · <span className="text-accent font-medium">{graphData.edges.length}</span> 条连接</> : '…'}
        </div>
      </div>

      {/* 画布区 */}
      <div ref={wrapRef} className="relative rounded-xl overflow-hidden border border-border/30" style={{ minHeight: 500 }}>
        {mode === '2d' ? (
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-bg-card" />
        ) : (
          <div ref={el3dRef} className="absolute inset-0 w-full h-full" style={{ background: 'radial-gradient(120% 90% at 50% 30%, #1d1913 0%, #0f0d0a 70%)' }} />
        )}
      </div>

      {/* 书架滤镜 */}
      <div className="flex flex-wrap gap-2">
        {shelves.map(s => (
          <button key={s} className={`px-3 py-1 rounded-full text-xs border ${filterShelf === s ? 'border-accent text-accent bg-accent/10' : 'border-border/30 text-text-secondary bg-bg-card hover:border-accent/50'}`} onClick={() => applyFilter(filterShelf === s ? null : s)}>
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: SHELF_COLORS[s] || '#888' }} />
            {s} · {shelfCounts[s] || 0}
          </button>
        ))}
        <button className={`px-3 py-1 rounded-full text-xs border ${!filterShelf ? 'border-accent text-accent bg-accent/10' : 'border-border/30 text-text-secondary'}`} onClick={() => applyFilter(null)}>全部</button>
      </div>
    </div>
  );
};
