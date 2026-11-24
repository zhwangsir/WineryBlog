import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { CanvasTexture } from 'three';
import type { GraphModel, DomainNode } from '../../lib/graphModel';
import { layoutOverview, layoutDetail, GRAPH_FONT } from '../../lib/graphModel';
import type { GraphHover, Graph2DHandle, GraphInset } from './Graph2D';

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

/** 3D 布局用的参考画布：这个尺寸下全景层是 1:1 排开的，世界坐标的单位就是 CSS 像素 */
const REF_W = 1900, REF_H = 800;
const FOV_TAN = Math.tan((60 / 2) * Math.PI / 180);
const ACCENT = '#f27d26';
const isSolo = (d: DomainNode) => d.cw === 0 && d.ch === 0;
const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * 知识图谱 3D 引擎（3d-force-graph + three）。
 * 与 2D 共用同一套两级结构和同一个布局：全景层是按知识域成团的星体 + 星云 + 始终面向相机的文字精灵，
 * 专题层把文章沿阅读螺旋摆开。位置全部预先算好（不跑物理模拟），任何环境下一开场就是展开态。
 */
const Graph3D = forwardRef<Graph2DHandle, Props>(function Graph3D(props, ref) {
  const { model } = props;
  const elRef = useRef<HTMLDivElement | null>(null);
  const cfgRef = useRef(props);
  cfgRef.current = props;
  const apiRef = useRef<{ fit: () => void; fitDomain: (id: string) => void; fitRect: (ids: string[]) => void } | null>(null);
  useImperativeHandle(ref, () => ({
    fit: () => apiRef.current?.fit(),
    fitDomain: (id: string) => apiRef.current?.fitDomain(id),
    fitRect: (ids: string[]) => apiRef.current?.fitRect(ids),
  }), []);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let disposed = false;
    let teardown: (() => void) | null = null;
    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
    };
    el.addEventListener('pointermove', onMove);

    (async () => {
      const [{ default: ForceGraph3D }, THREE] = await Promise.all([import('3d-force-graph'), import('three')]);
      if (disposed || !elRef.current) return;
      const timers = new Set<number>();
      const later = (fn: () => void, ms: number) => {
        const t = window.setTimeout(() => { timers.delete(t); fn(); }, ms);
        timers.add(t);
      };
      const toWorld = (x: number, y: number, z = 0) => ({ x: x - REF_W / 2, y: REF_H / 2 - y, z });
      let level: 'overview' | 'detail' = 'overview';
      let current: any = null;
      let hoverNode: any = null;
      let focusDom: string | null = null;
      const domZ = new Map<string, number>();      // 各知识域的纵深
      const tmpV = new THREE.Vector3();
      const isDark = () => cfgRef.current.dark;

      // ── 文字精灵：画到 canvas 再贴到 Sprite 上，始终面向相机 ──
      const pill = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const r = h / 2;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.arcTo(w, 0, w, h, r); ctx.arcTo(w, h, 0, h, r);
        ctx.arcTo(0, h, 0, 0, r); ctx.arcTo(0, 0, w, 0, r);
        ctx.closePath();
      };
      const measure = (text: string, font: string) => {
        const c = document.createElement('canvas').getContext('2d')!;
        c.font = font;
        return c.measureText(text).width;
      };
      const sprite = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, scale = 1) => {
        const cv = document.createElement('canvas');
        const k = 2;
        cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k);
        const ctx = cv.getContext('2d')!;
        ctx.scale(k, k);
        draw(ctx, w, h);
        const tex = new THREE.CanvasTexture(cv);
        tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
        spr.scale.set(w * scale, h * scale, 1);
        spr.renderOrder = 20;
        return spr;
      };
      const textLabel = (text: string, o: { font: string; color: string; bg?: string; h?: number; scale?: number }) => {
        const w = Math.ceil(measure(text, o.font)) + (o.bg ? 16 : 4), h = o.h ?? 20;
        return sprite((ctx, W, H) => {
          if (o.bg) { ctx.fillStyle = o.bg; pill(ctx, W, H); ctx.fill(); }
          ctx.font = o.font; ctx.fillStyle = o.color; ctx.textBaseline = 'middle';
          ctx.fillText(text, o.bg ? 8 : 0, H / 2 + 0.5);
        }, w, h, o.scale);
      };
      // 光晕贴图：径向渐变，星云和星体光晕共用（按颜色缓存）
      const glowTexCache = new Map<string, CanvasTexture>();
      const glowTex = (color: string) => {
        let tex = glowTexCache.get(color);
        if (!tex) {
          const cv = document.createElement('canvas');
          cv.width = cv.height = 128;
          const ctx = cv.getContext('2d')!;
          const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
          g.addColorStop(0, color); g.addColorStop(0.45, `${color}88`); g.addColorStop(1, `${color}00`);
          ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
          tex = new THREE.CanvasTexture(cv);
          tex.colorSpace = THREE.SRGBColorSpace;
          glowTexCache.set(color, tex);
        }
        return tex;
      };
      const disposeMat = (c: any) => {
        const map = c.material?.map;
        // 光晕贴图按颜色共享，不跟着单个对象释放
        if (map && ![...glowTexCache.values()].includes(map)) map.dispose?.();
        c.material?.dispose?.();
        c.geometry?.dispose?.();
      };
      const disposeDeep = (o: any) => { o.traverse?.((c: any) => disposeMat(c)); };

      // kapsule 风格：导航方式（controlType）是构造参数，不是链式方法。
      // 官方写法是不带 new 的 F(config)(el)；不同版本的 kapsule 也可能要求带 new，两种都试
      let g: any;
      try { g = (ForceGraph3D as any)({ controlType: 'orbit' })(el); }
      catch { g = new ((ForceGraph3D as any)({ controlType: 'orbit' }) as any)(el); }
      g = g
        .backgroundColor('rgba(0,0,0,0)')
        .showNavInfo(false)
        .cooldownTime(0)                 // 位置全部预先算好，不跑物理模拟
        .enableNodeDrag(false)
        .nodeThreeObjectExtend(false)
        .nodeThreeObject((n: any) => n.__obj)
        .linkColor((l: any) => (l.__hot ? ACCENT : l.k === 'path' ? ACCENT : l.k === 'pre' ? 'rgba(242,125,38,0.34)' : isDark() ? 'rgba(160,174,192,0.2)' : 'rgba(90,108,125,0.3)'))
        .linkWidth((l: any) => (l.__hot ? 2.2 : l.k === 'path' ? 1.4 : 0.7))
        .linkCurvature((l: any) => (l.k === 'path' ? 0 : 0.16))
        .linkOpacity(0.9)
        .linkDirectionalParticles((l: any) => (l.__hot ? 3 : 0))
        .linkDirectionalParticleWidth(3)
        .linkDirectionalParticleSpeed(0.007)
        .linkDirectionalParticleColor(() => '#ffb878')
        .onNodeHover((n: any) => {
          if (hoverNode && hoverNode !== n) setHover(hoverNode, false);
          hoverNode = n || null;
          const p = cfgRef.current;
          if (n?.__proxy) {
            p.onHover({ kind: 'domain', id: n.__proxy, x: pointer.x, y: pointer.y });
            if (focusDom !== n.__proxy) { focusDom = n.__proxy; if (level === 'overview') applyFilter(current); }
          } else if (n) {
            setHover(n, true);
            p.onHover(level === 'detail' ? { kind: 'post', id: n.id, x: pointer.x, y: pointer.y } : { kind: 'series', id: n.id, x: pointer.x, y: pointer.y });
          } else {
            p.onHover(null);
            if (focusDom) { focusDom = null; if (level === 'overview') applyFilter(current); }
          }
          el.style.cursor = n ? 'pointer' : 'grab';
        })
        .onNodeClick((n: any) => {
          if (n.__proxy) { cfgRef.current.onSelectDomain(n.__proxy); fitDomain(n.__proxy); return; }
          if (level === 'detail') cfgRef.current.onOpenPost(n.id); else cfgRef.current.onDrill(n.id);
        })
        .onBackgroundClick(() => { if (level === 'overview') cfgRef.current.onSelectDomain(null); });

      const scene = g.scene();
      scene.add(new THREE.AmbientLight(0xffffff, 1.1));
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
      keyLight.position.set(300, 420, 620);
      scene.add(keyLight);

      // 背景星空：固定种子，铺得比地图大一圈
      const rnd = mulberry32(20261124);
      const N = 1600, starPos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        starPos[i * 3] = (rnd() - 0.5) * 3800; starPos[i * 3 + 1] = (rnd() - 0.5) * 2600; starPos[i * 3 + 2] = (rnd() - 0.5) * 2600 - 200;
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0.7, depthWrite: false });
      scene.add(new THREE.Points(starGeo, starMat));
      const paintStars = () => { starMat.color.set(isDark() ? 0xbfd0e6 : 0x5b6b84); starMat.opacity = isDark() ? 0.7 : 0.32; };
      paintStars();

      // 空闲时缓慢自转；一操作就停，停手 9 秒后恢复
      let idleTimer = 0;
      try {
        const controls = g.controls();
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
        controls.addEventListener('start', () => {
          controls.autoRotate = false;
          if (idleTimer) { window.clearTimeout(idleTimer); idleTimer = 0; }
        });
        controls.addEventListener('end', () => {
          if (idleTimer) window.clearTimeout(idleTimer);
          idleTimer = window.setTimeout(() => { controls.autoRotate = level === 'overview'; }, 9000);
        });
      } catch { /* 控制器不可用时只是没有自转 */ }

      function setHover(n: any, on: boolean) {
        if (!n || n.__proxy) return;
        n.__obj.scale.setScalar(on ? 1.24 : n.__base);
        n.__mesh.material.emissive.set(on ? ACCENT : n.__color);
      }

      // ── 相机 ──
      // 信息卡在右侧时，把画面中心往左让出半个卡宽
      const panelShift = (dist: number) => (cfgRef.current.inset.right / 2) * ((2 * dist * FOV_TAN) / Math.max(1, el.clientHeight));
      const flyTo = (look: { x: number; y: number; z: number }, dist: number, lift: number, ms: number) => {
        const sx = panelShift(dist);
        g.cameraPosition({ x: look.x + sx, y: look.y + dist * lift, z: look.z + dist }, { x: look.x + sx, y: look.y, z: look.z }, ms);
      };
      const fitDist = (spanX: number, spanY: number) => {
        const aspect = Math.max(0.4, el.clientWidth / Math.max(1, el.clientHeight));
        return Math.max(spanY, spanX / aspect) / (2 * FOV_TAN);
      };
      const fit = () => {
        if (level === 'detail' && current) flyTo({ x: 0, y: 0, z: 0 }, fitDist(current.spanX, current.spanY), 0.12, 750);
        else flyTo({ x: 0, y: 0, z: 0 }, fitDist(REF_W + 160, REF_H + 170), 0.2, 750);
      };
      const fitDomain = (id: string) => {
        const d = model.domains.find((x) => x.id === id);
        if (!d) return;
        const c = toWorld(d.cx, d.cy, domZ.get(id) || 0);
        const R = Math.max(d.cw, d.ch, d.box.w, 80);
        flyTo(c, Math.max(260, fitDist(R * 1.9, R * 2.1)), 0.24, 800);
      };
      const fitRect = (ids: string[]) => {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const id of ids) {
          const s = model.seriesById.get(id);
          if (!s) continue;
          x0 = Math.min(x0, s.x - s.r - 80); x1 = Math.max(x1, s.x + s.r + 80);
          y0 = Math.min(y0, s.y - s.r - 30); y1 = Math.max(y1, s.y + s.r + 30);
        }
        if (!Number.isFinite(x0)) return;
        const c = toWorld((x0 + x1) / 2, (y0 + y1) / 2, 0);
        flyTo(c, fitDist(x1 - x0 + 80, y1 - y0 + 80), 0.2, 800);
      };
      apiRef.current = { fit, fitDomain, fitRect };

      // ── 全景层：知识域星云 + 专题星体 ──
      const buildOverview = () => {
        level = 'overview'; hoverNode = null; focusDom = cfgRef.current.domainId;
        layoutOverview(model, REF_W, REF_H);
        const dark = isDark();
        const sub = dark ? '#d3dbe6' : '#2f3a48';
        const pillBg = dark ? 'rgba(12,16,24,0.66)' : 'rgba(255,255,255,0.8)';
        const blend = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        const nodes: any[] = [];
        model.domains.forEach((d, di) => {
          // 每个星团一点纵深，整张地图是一口浅浅的碟，斜着看有层次
          const dz = Math.sin((di + 1) * 2.39996) * 52;
          domZ.set(d.id, dz);
          d.seriesIds.forEach((id) => {
            const s = model.seriesById.get(id)!;
            const c = toWorld(s.x, s.y, dz + s.z);
            const mesh = new THREE.Mesh(
              new THREE.SphereGeometry(s.r, 28, 18),
              new THREE.MeshStandardMaterial({ color: d.color, roughness: 0.42, metalness: 0.08, emissive: new THREE.Color(d.color), emissiveIntensity: 0.24, transparent: true }),
            );
            const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(d.color), blending: blend, depthWrite: false, transparent: true, opacity: 0.5 }));
            halo.scale.set(s.r * 5.2, s.r * 5.2, 1);
            halo.position.z = -1;
            mesh.add(halo);
            // 单专题知识域：星体就是名字前的圆点，名字由知识域名精灵负责
            let lab: any = null;
            if (!isSolo(d)) {
              // 精灵可以比布局预留的盒子略大，但放大太多就会压到邻居（溢出要落在留白和间隙里）
              lab = textLabel(s.short, { font: `500 12px ${GRAPH_FONT}`, color: sub, bg: pillBg, scale: 1.22 });
              // 沿用 2D 布局给名字选的方位（右 / 左 / 上 / 下）：正视时和 2D 一样不互相压
              lab.center.set(s.side === 0 ? 0 : s.side === 1 ? 1 : 0.5, s.side === 2 ? 0 : s.side === 3 ? 1 : 0.5);
              lab.position.set(s.side === 0 ? s.r + 4 : s.side === 1 ? -(s.r + 4) : 0, s.side === 2 ? s.r + 5 : s.side === 3 ? -(s.r + 5) : 0, 2);
              mesh.add(lab);
            }
            nodes.push({ id: s.id, x: c.x, y: c.y, z: c.z, __obj: mesh, __mesh: mesh, __halo: halo, __label: lab, __dom: d.id, __color: d.color, __base: 1 });
          });
          // 代理节点：透明的球，接住「点在星团上但没点中星体」的悬停 / 点击 → 选中整个知识域。
          // 整个球要退到星体后面：它的半径比星团大，球心只退一点的话前表面会伸到星体前面，把射线全拦下来
          const R = Math.max(d.cw, d.ch, d.box.w, 70) / 2;
          const proxy = new THREE.Mesh(new THREE.SphereGeometry(R, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
          const pc = toWorld(d.cx, d.cy, dz - R - 46);
          nodes.push({ id: `__dom__${d.id}`, x: pc.x, y: pc.y, z: pc.z, __obj: proxy, __proxy: d.id });
        });
        const byId = new Map(nodes.filter((n) => !n.__proxy).map((n) => [n.id, n]));
        const links = model.edges
          .filter((e) => byId.has(e.from) && byId.has(e.to))
          .map((e) => ({ source: byId.get(e.from), target: byId.get(e.to), k: e.k, from: e.from, to: e.to }));
        // 星云与知识域名：不参与拾取，直接挂在场景里
        const deco: any[] = [];
        for (const d of model.domains) {
          const dz = domZ.get(d.id) || 0, solo = isSolo(d);
          const size = solo ? Math.max(d.box.w * 1.15, 100) : Math.max(d.cw, d.ch) * 1.8;
          const neb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(d.color), blending: blend, depthWrite: false, transparent: true, opacity: dark ? 0.5 : 0.36 }));
          const nc = toWorld(d.cx, d.cy, dz - 16);
          neb.position.set(nc.x, nc.y, nc.z);
          neb.scale.set(size, size * (solo ? 0.6 : Math.max(0.62, d.ch / Math.max(1, d.cw))), 1);
          neb.renderOrder = -1;
          neb.__dom = d.id; neb.__neb = true;
          // 知识域名：圆点 + 名字 + 篇数
          const nameFont = `600 15px ${GRAPH_FONT}`, countText = `${d.count} 篇`;
          const nw = measure(d.name, nameFont), cw = measure(countText, `500 12px ${GRAPH_FONT}`);
          const name = sprite((ctx, W, H) => {
            ctx.fillStyle = d.color;
            ctx.shadowColor = d.color; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(7, H / 2, 4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.font = nameFont; ctx.fillStyle = dark ? '#f3f6fa' : '#111827'; ctx.textBaseline = 'middle';
            ctx.fillText(d.name, 18, H / 2 + 0.5);
            ctx.font = `500 12px ${GRAPH_FONT}`; ctx.fillStyle = dark ? '#9aa6b6' : '#64748b';
            ctx.fillText(countText, 18 + nw + 8, H / 2 + 0.5);
          }, 18 + nw + 8 + cw, 22, 1.18);
          const tc = toWorld(d.title.x, d.title.y + d.title.h / 2, dz + 10);
          if (solo) { name.center.set(0, 0.5); }
          else name.center.set(0.5, 0.5);
          name.position.set(tc.x, tc.y, tc.z);
          name.__dom = d.id;
          deco.push(neb, name);
        }
        return { nodes, links, deco };
      };

      // ── 专题层：文章沿阅读螺旋 ──
      const buildDetail = (s: any) => {
        level = 'detail'; hoverNode = null;
        const p = cfgRef.current, dark = p.dark;
        const color = model.domains.find((x) => x.id === s.domain)?.color || '#9aa8bd';
        const dl = layoutDetail(s.count, REF_W, REF_H);
        const nodes = s.postIds.map((id: string, i: number) => {
          const pt = dl.points[i];
          const read = p.readSet.has(id);
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(7, 24, 16),
            new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05, emissive: new THREE.Color(color), emissiveIntensity: read ? 0.4 : 0.08, transparent: true }),
          );
          const title = model.postTitle.get(id) || id;
          // 标题朝螺旋外侧排（右 / 左 / 上 / 下），不会横穿内侧的圈；长度按相邻两篇的间距截断
          const side = Math.abs(pt.x) > Math.abs(pt.y) * 0.6 ? (pt.x >= 0 ? 0 : 1) : (pt.y < 0 ? 2 : 3);
          const max = side < 2 ? 9 : 7;
          const lab = textLabel(`${read ? '✓ ' : ''}${i + 1} · ${title.length > max ? `${title.slice(0, max - 1)}…` : title}`, {
            font: `${read ? 600 : 400} 12px ${GRAPH_FONT}`, color: read ? (dark ? '#f3f6fa' : '#111827') : dark ? '#d3dbe6' : '#2f3a48', scale: 1.12,
          });
          lab.center.set(side === 0 ? 0 : side === 1 ? 1 : 0.5, side === 2 ? 0 : side === 3 ? 1 : 0.5);
          lab.position.set(side === 0 ? 12 : side === 1 ? -12 : 0, side === 2 ? 12 : side === 3 ? -12 : 0, 2);
          mesh.add(lab);
          const base = id === p.focusPostId ? 1.3 : 1;
          mesh.scale.setScalar(base);
          return { id, x: pt.x, y: -pt.y, z: Math.sin(i * 0.9) * 6, __obj: mesh, __mesh: mesh, __label: lab, __color: color, __base: base };
        });
        const links = nodes.slice(1).map((n, i) => ({ source: nodes[i], target: n, k: 'path' }));
        // 中心圆：专题信息
        const hub = dl.hub, size = hub * 2;
        const hubSprite = sprite((ctx, W) => {
          ctx.fillStyle = dark ? 'rgba(26,31,46,0.95)' : 'rgba(255,255,255,0.97)';
          ctx.beginPath(); ctx.arc(hub, hub, dl.hub, 0, Math.PI * 2); ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = color; ctx.stroke();
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = color; ctx.font = `600 12px ${GRAPH_FONT}`;
          ctx.fillText(model.domains.find((x) => x.id === s.domain)?.name || '', hub, hub - 38);
          ctx.fillStyle = dark ? '#eef2f7' : '#1f2937'; ctx.font = `700 15px ${GRAPH_FONT}`;
          ctx.fillText(s.name.length > 10 ? `${s.name.slice(0, 9)}…` : s.name, hub, hub - 14);
          ctx.fillStyle = dark ? '#b9c3d0' : '#4b5563'; ctx.font = `500 12px ${GRAPH_FONT}`;
          ctx.fillText(`${s.count} 篇 · 已读 ${s.postIds.filter((id: string) => p.readSet.has(id)).length}`, hub, hub + 10);
        }, size, size);
        hubSprite.position.z = 4;
        hubSprite.renderOrder = 5;
        return { nodes, links, deco: [hubSprite], spanX: dl.radius * 2 + 260, spanY: dl.radius * 2 + 110 };
      };

      const applyFilter = (data: any) => {
        if (!data || level !== 'overview') return;
        const p = cfgRef.current;
        const route = p.routeId ? model.routes.find((r) => r.id === p.routeId) : null;
        const routeSet = new Set(route?.seriesSeq || []);
        const routeDoms = new Set<string>();
        routeSet.forEach((sid) => { const s = model.seriesById.get(sid); if (s) routeDoms.add(s.domain); });
        const domOn = (id: string) => (p.domainId ? id === p.domainId : route ? routeDoms.has(id) : true);
        const dim = (id: string) => (focusDom && focusDom !== id ? 0.22 : 1);
        data.nodes.forEach((n: any) => {
          if (n.__proxy) return;
          const on = domOn(n.__dom);
          const onRoute = routeSet.has(n.id);
          const focusable = dim(n.__dom) * (!route || onRoute ? 1 : 0.42);
          n.__on = on && focusable > 0.5;
          n.__base = onRoute ? 1.08 : 1;
          if (n.__mesh) {
            n.__mesh.material.opacity = on ? Math.max(0.14, focusable) : 0.1;
            n.__mesh.material.emissive.set(onRoute ? ACCENT : n.__color);
            n.__mesh.material.emissiveIntensity = on ? 0.26 : 0.04;
          }
          if (n.__halo) n.__halo.material.opacity = on ? 0.5 * focusable : 0.04;
          if (!hoverNode || hoverNode !== n) n.__obj.scale.setScalar(n.__base);
        });
        data.links.forEach((l: any) => {
          l.__hot = !!route && route.seriesSeq.some((sid, i) => sid === l.from && route.seriesSeq[i + 1] === l.to)
            || (!!hoverNode && !hoverNode.__proxy && (l.from === hoverNode.id || l.to === hoverNode.id));
        });
        data.deco.forEach((o: any) => {
          const v = domOn(o.__dom) ? dim(o.__dom) : 0.14;
          o.material.opacity = o.__neb ? (isDark() ? 0.5 : 0.36) * v : Math.max(0.16, v);
        });
        g.linkColor(g.linkColor()); g.linkWidth(g.linkWidth()); g.linkDirectionalParticles(g.linkDirectionalParticles());
      };

      const mount = (data: any) => {
        if (current) {
          current.nodes.forEach((n: any) => disposeDeep(n.__obj));
          current.deco.forEach((o: any) => { scene.remove(o); disposeDeep(o); });
        }
        current = data;
        g.graphData(data);
        data.deco.forEach((o: any) => scene.add(o));
        applyFilter(data);
      };

      // 进入 / 退出某个专题。applied 用 undefined 表示「还没挂过」：初始 want 和 applied 都是 null，不能当成「没变化」
      let applied: string | null | undefined;
      const sync = () => {
        const p = cfgRef.current;
        const want = p.level === 'detail' && p.seriesId ? p.seriesId : null;
        if (want === applied) return;
        applied = want;
        if (want) {
          const s = model.seriesById.get(want);
          if (!s) return;
          if (level === 'overview' && current) {
            const n = current.nodes.find((x: any) => x.id === want);
            const c = n ? { x: n.x, y: n.y, z: n.z } : { x: 0, y: 0, z: 0 };
            // 先把相机推向被点的星体，再切换到专题螺旋
            flyTo(c, 330, 0.16, 480);
            later(() => { if (disposed || applied !== want) return; mount(buildDetail(s)); fit(); }, 470);
          } else { mount(buildDetail(s)); fit(); }   // 还没有全景（深链接直接进专题）：直接落到专题层
        } else { mount(buildOverview()); fit(); }
      };

      const onResize = () => { if (el.clientWidth > 10) g.width(el.clientWidth).height(el.clientHeight); };
      const ro = new ResizeObserver(onResize);
      ro.observe(el);
      onResize();

      // 专题名按相机距离淡入淡出：复位视角下名字基本都在，拉远了只看知识域名，拉近了名字全出来
      g.onEngineTick(() => {
        if (!current) return;
        const cam = g.camera();
        const base = level === 'detail' && current ? fitDist(current.spanX, current.spanY) : fitDist(REF_W + 160, REF_H + 170);
        const far = base * 1.42, span = base * 0.5;
        for (const n of current.nodes) {
          const lab = n.__label;
          if (!lab) continue;
          const dist = cam.position.distanceTo(n.__obj.getWorldPosition(tmpV));
          const lod = Math.max(0, Math.min(1, (far - dist) / span));
          lab.material.opacity = (level === 'detail' || n.__on ? 1 : 0.06) * lod;
        }
      });

      const keyOf = () => {
        const p = cfgRef.current;
        return [String(p.dark), String(p.domainId), String(p.routeId), String(p.readSet.size), String(p.focusPostId)];
      };
      sync();
      let lastKey = keyOf();

      // 配置变化（主题 / 筛选 / 路线 / 阅读进度 / 信息卡开合）每 180ms 检查一次
      let lastRight = cfgRef.current.inset.right;
      const iv = window.setInterval(() => {
        sync();
        const p = cfgRef.current;
        if (!current) return;
        const key = keyOf();
        if (key.join('|') !== lastKey.join('|')) {
          const prev = lastKey;
          lastKey = key;
          if (level === 'overview') {
            // 主题变了要整套重建（精灵里的文字颜色是画上去的）
            if (prev[0] !== key[0]) { mount(buildOverview()); fit(); }
            else {
              if (prev[1] !== key[1]) { focusDom = p.domainId; if (p.domainId) fitDomain(p.domainId); else fit(); }
              if (prev[2] !== key[2]) {
                const r = p.routeId ? model.routes.find((x) => x.id === p.routeId) : null;
                if (r) fitRect(r.seriesSeq); else fit();
              }
              applyFilter(current);
            }
          } else if (applied) { mount(buildDetail(model.seriesById.get(applied)!)); fit(); }
        }
        if (p.inset.right !== lastRight) { lastRight = p.inset.right; fit(); }
      }, 180);

      teardown = () => {
        disposed = true;
        window.clearInterval(iv);
        timers.forEach((t) => window.clearTimeout(t));
        if (idleTimer) window.clearTimeout(idleTimer);
        ro.disconnect();
        apiRef.current = null;
        if (current) {
          current.nodes.forEach((n: any) => disposeDeep(n.__obj));
          current.deco.forEach((o: any) => { scene.remove(o); disposeDeep(o); });
        }
        starGeo.dispose(); starMat.dispose();
        glowTexCache.forEach((t) => t.dispose());
        try { g.pauseAnimation(); g._destructor(); } catch { /* 已释放 */ }
      };
    })();

    return () => {
      disposed = true;
      el.removeEventListener('pointermove', onMove);
      teardown?.();
      teardown = null;
    };
  }, [model]);

  return <div ref={elRef} className="absolute inset-0 cursor-grab touch-none select-none" />;
});

export default Graph3D;
