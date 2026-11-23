import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Focus } from 'lucide-react';
import { useData } from '../context/DataContext';

interface GraphNode { id: string; t: string; s: string; href: string; x?: number; y?: number; vx?: number; vy?: number }
interface GraphEdge { a: number; b: number; k: string }

const SHELF_COLORS: Record<string, string> = {
  "参考资料": "#8a8577", "编程语言": "#d4694f", "数据结构与算法": "#c28a2e",
  "计算机网络": "#3a7d8c", "计算机组成": "#7a8b3a", "计算机系统与网络": "#4a5fb0",
  "数据库与大数据": "#2e8b74", "Web 前端": "#e0a13e", "后端开发": "#5a4fa0",
  "编程基础与工具": "#6fae5c", "移动与跨端": "#b05a8c", "人工智能": "#e0662e",
  "信息安全": "#6e3a8c", "游戏与图形": "#3a9aa5", "分布式与并行": "#3a6ea5",
  "数学与理论": "#a0a050", "软件工程": "#5090b0", "项目实战": "#4a8c5c", "随笔": "#7a8b7a",
};

/** 分类颜色：预设表优先，未命中按名称哈希生成稳定 HSL（避免大面积 fallback 同色） */
function shelfColor(s: string): string {
  if (SHELF_COLORS[s]) return SHELF_COLORS[s];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(h) % 360} 42% 50%)`;
}

export const KnowledgeGraph: React.FC = () => {
  const { posts } = useData();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [filterShelf, setFilterShelfState] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const engine3Ref = useRef<any>(null);
  // 滤镜走 ref：避免引擎因 state 变化整体重建（布局会丢）
  const filterRef = useRef<string | null>(null);
  const searchRef = useRef<string>('');

  // 从 posts 构建图谱数据
  const graphData = React.useMemo(() => {
    if (!posts.length) return null;
    const nodes = posts.map((p) => ({
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
    const idxOf = new Map(nodes.map((n, i) => [n.id, i]));
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
        const ai = idxOf.get(numbered[i].p.id);
        const bi = idxOf.get(numbered[i + 1].p.id);
        if (ai !== undefined && bi !== undefined) addEdge(ai, bi, 'next');
      }
    });
    // 标签重叠（同分类且共享 ≥2 标签）
    const tagSets = posts.map(p => new Set(p.tags || []));
    posts.forEach((p, i) => {
      posts.forEach((q, j) => {
        if (j <= i || p.category !== q.category) return;
        let shared = 0;
        tagSets[i].forEach(t => { if (tagSets[j].has(t)) shared++; });
        if (shared >= 2) addEdge(i, j, 'rel');
      });
    });
    // 同目录短链
    byCat.forEach(arr => {
      if (arr.length > 2) {
        arr.forEach((p: any, i: number) => {
          for (const off of [1, 2]) {
            const pi = idxOf.get(p.id);
            const qi = idxOf.get(arr[(i + off) % arr.length].id);
            if (pi !== undefined && qi !== undefined) addEdge(pi, qi, 'rel');
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
    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    // 视图定义在 CSS 像素域：screen = world * scale + offset
    const view = { x: 0, y: 0, scale: 1 };
    let W = 0, H = 0;
    let hoverNode: any = null, dragN: any = null, pan = false, lastPan: [number, number] | null = null;
    let running = true;
    let autoFit = true;         // 布局初期自动取景；用户手动缩放/平移后关闭
    let frames = 0;

    const nodes = graphData.nodes.map(n => ({ ...n }));
    const edges = graphData.edges;
    const adj: Record<string, string[]> = {};
    edges.forEach(e => {
      (adj[nodes[e.a].id] = adj[nodes[e.a].id] || []).push(nodes[e.b].id);
      (adj[nodes[e.b].id] = adj[nodes[e.b].id] || []).push(nodes[e.a].id);
    });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const show = (n: any) =>
      (!filterRef.current || n.s === filterRef.current) &&
      (!searchRef.current || n.t.toLowerCase().includes(searchRef.current.toLowerCase()));

    function resize() {
      const d = dpr();
      const r = canvas.getBoundingClientRect();
      if (r.width === 0) return;
      W = r.width; H = r.height;
      canvas.width = Math.round(W * d); canvas.height = Math.round(H * d);
    }

    // 初始分区布局：按书架扇形铺满视口（而不是挤在原点附近的小半径）
    let layouted = false;
    function initLayout() {
      if (layouted || !W || !H) return;
      const cx = W / 2, cy = H / 2;
      const shelfList = [...new Set(nodes.map(n => n.s))];
      const rBase = Math.min(W, H) * 0.28;
      nodes.forEach((n, i) => {
        const si = shelfList.indexOf(n.s);
        const ang = (si / shelfList.length) * Math.PI * 2 + (i % 19) * 0.41;
        const r = rBase * (0.35 + ((i * 7) % 23) / 23 * 0.9);
        n.x = cx + Math.cos(ang) * r;
        n.y = cy + Math.sin(ang) * r * 0.92;
      });
      layouted = true;
      view.scale = 1;
      view.x = 0; view.y = 0;
    }

    const ro = new ResizeObserver(() => { resize(); initLayout(); });
    ro.observe(canvas);
    resize(); initLayout();

    function step() {
      const cx = W / 2, cy = H / 2;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy + 0.01;
          if (d2 < 90000) {
            const d = Math.sqrt(d2);
            const f = Math.min(5200 / d2, 9);
            a.vx += dx / d * f; a.vy += dy / d * f;
            b.vx -= dx / d * f; b.vy -= dy / d * f;
          }
        }
      }
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const f = (d - 78) * 0.022;
        a.vx += dx / d * f; a.vy += dy / d * f;
        b.vx -= dx / d * f; b.vy -= dy / d * f;
      });
      nodes.forEach(n => {
        if (n === dragN) return;
        n.vx += (cx - n.x) * 0.006; n.vy += (cy - n.y) * 0.006;
        n.vx *= 0.84; n.vy *= 0.84;
        n.x += n.vx; n.y += n.vy;
      });
    }

    // 自适应取景：显示节点的包围盒 → 缓动到适配视图
    function fitTargets() {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let any = false;
      nodes.forEach(n => {
        if (!show(n)) return;
        any = true;
        if (n.x < minX) minX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.x > maxX) maxX = n.x;
        if (n.y > maxY) maxY = n.y;
      });
      if (!any || !W) return;
      const pad = 70;
      const s = Math.max(0.2, Math.min(2.2, Math.min((W - pad * 2) / Math.max(60, maxX - minX), (H - pad * 2) / Math.max(60, maxY - minY))));
      view.scale += (s - view.scale) * 0.06;
      view.x += (W / 2 - (minX + maxX) / 2 * s - view.x) * 0.06;
      view.y += (H / 2 - (minY + maxY) / 2 * s - view.y) * 0.06;
    }

    function draw() {
      const d = dpr();
      const cs = getComputedStyle(document.documentElement);
      ctx.setTransform(d * view.scale, 0, 0, d * view.scale, d * view.x, d * view.y);
      // 清除整个可视世界区域（screen(0,0)-(W,H) 对应的世界坐标）
      const vx0 = -view.x / view.scale - 10, vy0 = -view.y / view.scale - 10;
      ctx.clearRect(vx0, vy0, W / view.scale + 20, H / view.scale + 20);
      const inv = 1 / view.scale;
      ctx.lineWidth = 1 * inv;
      ctx.strokeStyle = cs.getPropertyValue('--border') || '#ddd';
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        if (!a || !b) return;
        if (!show(a) && !show(b)) return;
        if (show(a) !== show(b)) ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.globalAlpha = 1;
      });
      const ink = cs.getPropertyValue('--text-primary') || '#333';
      const R = 5;
      nodes.forEach(n => {
        const visible = show(n);
        const isHi = hoverNode === n || (hoverNode && isConnected(n.id, hoverNode.id));
        if (!visible && !isHi) return;
        ctx.beginPath(); ctx.arc(n.x, n.y, isHi ? R * 1.7 : R, 0, Math.PI * 2);
        ctx.fillStyle = shelfColor(n.s);
        ctx.globalAlpha = visible ? (hoverNode && !isHi ? 0.25 : 1) : 0.08;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (visible && (view.scale > 0.9 || isHi)) {
          ctx.fillStyle = ink;
          ctx.globalAlpha = hoverNode && !isHi ? 0.3 : 1;
          ctx.font = `${12 * inv}px sans-serif`;
          ctx.fillText(n.t.slice(0, 16), n.x + R + 4 * inv, n.y + 4 * inv);
          ctx.globalAlpha = 1;
        }
      });
    }
    function isConnected(a: string, b: string) {
      return (adj[a] || []).includes(b);
    }

    function loop() {
      if (!running) return;
      frames++;
      if (layouted) {
        if (!reduceMotion) { step(); if (frames % 3 === 0) step(); }
        if (autoFit && frames < 900) fitTargets();
      }
      draw();
      requestAnimationFrame(loop);
    }
    if (reduceMotion && layouted) { for (let i = 0; i < 400; i++) step(); autoFit = false; }
    loop();

    // 交互（全部使用 CSS 像素域）
    function screenToWorld(mx: number, my: number): [number, number] {
      return [(mx - view.x) / view.scale, (my - view.y) / view.scale];
    }
    function pick(mx: number, my: number) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (!show(n)) continue;
        const dx = mx - n.x, dy = my - n.y;
        const r = 7 / view.scale + 4;
        if (dx * dx + dy * dy < r * r) return n;
      }
      return null;
    }
    function localXY(e: MouseEvent): [number, number] {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }
    const onMouseMove = (e: MouseEvent) => {
      const [mx, my] = localXY(e);
      if (dragN) { const w = screenToWorld(mx, my); dragN.x = w[0]; dragN.y = w[1]; dragN.vx = 0; dragN.vy = 0; return; }
      if (pan && lastPan) {
        view.x += mx - lastPan[0];
        view.y += my - lastPan[1];
        lastPan = [mx, my]; return;
      }
      hoverNode = pick(mx, my);
      canvas.style.cursor = hoverNode ? 'pointer' : 'grab';
    };
    const onMouseDown = (e: MouseEvent) => {
      const [mx, my] = localXY(e);
      dragN = pick(mx, my);
      if (!dragN) { pan = true; lastPan = [mx, my]; }
      autoFit = false;
      canvas.style.cursor = dragN ? 'grabbing' : 'grab';
    };
    const onMouseUp = () => { dragN = null; pan = false; lastPan = null; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const [mx, my] = localXY(e);
      const k = e.deltaY > 0 ? 0.9 : 1.1;
      const ns = Math.max(0.2, Math.min(3.5, view.scale * k));
      // 以光标为缩放锚点
      view.x = mx - (mx - view.x) * (ns / view.scale);
      view.y = my - (my - view.y) * (ns / view.scale);
      view.scale = ns;
      autoFit = false;
    };
    const onClick = (e: MouseEvent) => {
      const [mx, my] = localXY(e);
      const n = pick(mx, my);
      if (n && n.href) navigate(n.href);
    };
    // 复位视角按钮：恢复自动取景（重新开始缓动适配全图）
    const onRefit = () => { autoFit = true; frames = 0; };
    window.addEventListener('graph-refit', onRefit);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', onClick);

    return () => {
      running = false;
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('graph-refit', onRefit);
    };
  }, [graphData, mode, navigate]);

  // 同步滤镜 ref（引擎每帧读取，避免重建布局）
  useEffect(() => { filterRef.current = filterShelf; }, [filterShelf]);
  useEffect(() => { searchRef.current = searchQ; }, [searchQ]);

  // ---------- 3D 引擎（3d-force-graph） ----------
  const el3dRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mode !== '3d' || !graphData || !el3dRef.current) return;
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
      // 重复进入：只更新尺寸与滤镜
      if (engine3Ref.current) {
        const g = engine3Ref.current;
        g.width(el3dRef.current.clientWidth).height(el3dRef.current.clientHeight);
        applyNodeColor(g);
        try { g.zoomToFit(600, 60); } catch {}
        return;
      }
      const el = el3dRef.current;
      const total = graphData.nodes.length;
      // 关键①：显式黄金角螺线初始分布。若所有节点从 (0,0,0) 出发，对称斥力互相抵消，
      // 图永远不展开，zoomToFit 会把相机怼到单个节点脸上糊满屏幕
      const nodes = graphData.nodes.map((n, i) => {
        const a = i * 2.39996;   // 黄金角
        const r = 520 * Math.sqrt((i + 0.5) / total);
        return { ...n, x: r * Math.cos(a), y: r * Math.sin(a) * 0.65, z: Math.sin(a * 1.7) * 260 };
      });
      // 关键②：预布局 120 轮简化力迭代——不依赖引擎 tick。
      // 嵌入式 webview 的 rAF 节流会让 d3 timer 驱动的布局完全停滞（实测坐标零变化），
      // 本地预迭代保证任何环境下开局即是展开态；引擎后续 tick 只做微调
      {
        const kRep = 8000;
        for (let iter = 0; iter < 120; iter++) {
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const a = nodes[i], b = nodes[j];
              const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
              const d2 = dx * dx + dy * dy + dz * dz + 0.01;
              const d = Math.sqrt(d2);
              const f = Math.min(kRep / d2, 14) * 0.05;
              const ux = dx / d, uy = dy / d, uz = dz / d;
              a.x += ux * f; a.y += uy * f; a.z += uz * f;
              b.x -= ux * f; b.y -= uy * f; b.z -= uz * f;
            }
          }
          graphData.edges.forEach(e => {
            const a = nodes[e.a], b = nodes[e.b];
            const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;
            const f = (d - 115) * 0.014;
            const ux = dx / d, uy = dy / d, uz = dz / d;
            a.x += ux * f; a.y += uy * f; a.z += uz * f;
            b.x -= ux * f; b.y -= uy * f; b.z -= uz * f;
          });
        }
      }
      // 度数预计算（布局后 3d-force-graph 会把 link.source 替换为节点对象，届时按 id 比较失效）
      const degree: Record<string, number> = {};
      graphData.edges.forEach(e => {
        degree[nodes[e.a].id] = (degree[nodes[e.a].id] || 0) + 1;
        degree[nodes[e.b].id] = (degree[nodes[e.b].id] || 0) + 1;
      });
      const links = graphData.edges.map(e => ({ source: e.a, target: e.b, k: e.k }));
      const g = w.ForceGraph3D()(el)
        .graphData({ nodes, links })
        .backgroundColor('rgba(0,0,0,0)')
        .showNavInfo(false)
        .nodeColor((n: any) => {
          const c = shelfColor(n.s);
          return filterRef.current && n.s !== filterRef.current ? c + '22' : c;
        })
        .nodeVal((n: any) => 2.5 + Math.sqrt(degree[n.id] || 0) * 1.5)
        .nodeLabel((n: any) => `<div style="font:600 13px sans-serif">${n.t}<br><span style="opacity:.6;font-weight:400">${n.s}</span></div>`)
        .nodeOpacity(0.92)
        .linkColor((l: any) => l.k === 'next' ? 'rgba(242,125,38,0.55)' : 'rgba(170,180,195,0.32)')
        .linkWidth((l: any) => l.k === 'next' ? 1.2 : 0.4)
        .linkOpacity(0.55)
        .width(el.clientWidth)
        .height(el.clientHeight)
        .onNodeClick((n: any) => { if (n.href) navigate(n.href); });
      // 力参数与预布局一致：强斥力对抗链接收缩（528 条边的拉力会压过弱斥力导致坍缩）
      try {
        (g.d3Force('charge') as any)?.strength(-8000);
        const link = g.d3Force('link');
        if (link) { (link as any).distance(115); (link as any).strength(0.5); }
      } catch {}
      // 相机放远；预布局已展开，取景一次即可（zoomToFit 失效的 environments 由距离兜底）
      g.cameraPosition({ x: 0, y: 0, z: 2100 });

      // 兜底：嵌入式 webview 的 rAF 节流会让引擎 tick（含 mesh 位置同步）停滞——
      // 定期手动把 mesh 对齐到数据坐标，并在初始窗口内自动取景（用户操作即退出窗口）
      const syncMeshes = () => {
        let n = 0;
        g.scene().traverse((o: any) => {
          if (o.__data && typeof o.__data.x === 'number') {
            if (o.position.x !== o.__data.x || o.position.y !== o.__data.y || o.position.z !== o.__data.z) {
              o.position.set(o.__data.x, o.__data.y, o.__data.z);
              n++;
            }
          }
        });
        return n;
      };
      let autoCam = true;
      let controls: any = null;
      try { controls = g.controls?.(); controls?.addEventListener?.('start', () => { autoCam = false; }); } catch {}
      syncMeshes();
      const iv = window.setInterval(() => {
        if (!engine3Ref.current) { window.clearInterval(iv); return; }
        syncMeshes();
        if (!autoCam) return;
        const ns = (g.graphData() as any).nodes as any[];
        if (!ns.length || typeof ns[0].x !== 'number') return;
        let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        ns.forEach(n => {
          if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
          if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
          if (n.z < minZ) minZ = n.z; if (n.z > maxZ) maxZ = n.z;
        });
        const radius = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 || 1;
        const target = Math.max(900, Math.min(3400, radius * 2.4));
        const cam = g.cameraPosition();
        g.cameraPosition({ x: cam.x, y: cam.y, z: cam.z + (target - cam.z) * 0.18 });
      }, 1500);
      const stopWindow = window.setTimeout(() => { autoCam = false; window.clearInterval(iv); }, 20000);
      (g as any).__iv = iv;
      (g as any).__stopWindow = stopWindow;
      (g as any).__onControlsStart = () => { autoCam = false; };
      const onResize = () => {
        if (!el3dRef.current) return;
        try { g.width(el3dRef.current.clientWidth).height(el3dRef.current.clientHeight); } catch {}
      };
      window.addEventListener('resize', onResize);
      engine3Ref.current = g;
      (g as any).__onResize = onResize;
      (window as any).__g3 = g;   // 调试钩子：节点坐标分布 / 相机位置
    }
    function applyNodeColor(g: any) {
      g.nodeColor((n: any) => {
        const c = shelfColor(n.s);
        return filterRef.current && n.s !== filterRef.current ? c + '22' : c;
      });
    }
  }, [mode, graphData, navigate]);

  // 卸载/切模式时清理 3D 定时器与 resize 监听
  useEffect(() => () => {
    const g = engine3Ref.current as any;
    if (g?.__onResize) window.removeEventListener('resize', g.__onResize);
    if (g?.__iv) window.clearInterval(g.__iv);
    if (g?.__stopWindow) window.clearTimeout(g.__stopWindow);
  }, [mode]);

  const applyFilter = (s: string | null) => {
    setFilterShelfState(s);
    filterRef.current = s;
    if (engine3Ref.current?.nodeColor) {
      engine3Ref.current.nodeColor((n: any) => {
        const c = shelfColor(n.s);
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
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {graphData ? <><span className="text-accent font-medium">{graphData.nodes.length}</span> 篇 · <span className="text-accent font-medium">{graphData.edges.length}</span> 条连接</> : '…'}
          {mode === '2d' && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('graph-refit'))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/40 hover:border-accent hover:text-accent transition-colors"
              title="拖动/缩放会关闭自动取景，点此恢复全图视角"
            >
              <Focus className="w-3.5 h-3.5" /> 复位视角
            </button>
          )}
        </div>
      </div>

      {/* 画布区 */}
      <div className="relative rounded-xl overflow-hidden border border-border/30" style={{ height: 'min(72vh, 720px)' }}>
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
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: shelfColor(s) }} />
            {s} · {shelfCounts[s] || 0}
          </button>
        ))}
        <button className={`px-3 py-1 rounded-full text-xs border ${!filterShelf ? 'border-accent text-accent bg-accent/10' : 'border-border/30 text-text-secondary'}`} onClick={() => applyFilter(null)}>全部</button>
      </div>
    </div>
  );
};
