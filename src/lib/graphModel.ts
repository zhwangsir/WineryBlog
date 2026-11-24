import type { Post } from '../data/posts';
import type { ElementType } from 'react';
import { catalogIcon, type Career, type TutorialCatalog } from './catalog';

/**
 * 知识图谱的数据模型与布局（2D / 3D 共用）。
 *
 * 不再把 927 篇文章平铺成同等的点（那样只会得到一团没有文字的毛球），而是两级结构：
 *   全景层：知识域（14 个 + 参考资料 / 博客随笔）→ 专题（约 67 个，气泡大小 = 篇数）
 *   专题层：某个专题下的文章，按阅读顺序排在一条螺旋线上
 * 全景层的连线来自职业路线的阶段先后与教程先修关系。
 */

export interface SeriesNode {
  id: string;            // 即文章分类名
  name: string;
  short: string;         // 气泡旁的短标签
  domain: string;
  count: number;
  source: string;        // 收录来源仓库（自研教程为空）
  postIds: string[];     // 阅读顺序
  x: number;             // 全景层布局坐标（布局带内的 CSS 像素，scale = 1 的世界）
  y: number;
  z: number;
  r: number;             // 气泡半径（当前布局下的值）
  r0: number;            // 基准半径：只由篇数决定，布局每次从这里算起，不会被反复缩小
  side: number;          // 标签在气泡的哪一侧：0 右 1 左 2 上 3 下
  lx: number; ly: number; lw: number; lh: number;   // 标签盒子（世界坐标）
}
export interface DomainNode {
  id: string;
  name: string;
  color: string;
  icon: ElementType;
  anchor: [number, number];   // 语义位置（-1..1），布局时向它靠拢
  count: number;
  seriesIds: string[];
  box: { x: number; y: number; w: number; h: number };   // 整块（名字行 + 内容）的外接框，只用于排布与命中
  cx: number;                 // 内容中心（星云画在这里）
  cy: number;
  cw: number; ch: number;     // 内容的外接尺寸
  rc: number;                 // 内容外接框的半宽（取长边）
  title: { x: number; y: number; w: number; h: number };   // 知识域名的文字盒子（世界坐标）
  nameW: number;              // 知识域名的文字宽度
  lobe: [number, number];     // 星云里偏亮的一瓣相对内容中心的偏移（朝向地图中心）
}
export interface SeriesEdge { from: string; to: string; k: 'pre' | 'route'; w: number; routes: string[] }
export interface RouteInfo {
  id: string;
  name: string;
  stages: { name: string; seriesIds: string[] }[];
  seriesSeq: string[];        // 路线经过的专题（按阶段先后，已去重相邻重复）
}
export interface GraphModel {
  domains: DomainNode[];
  series: SeriesNode[];
  seriesById: Map<string, SeriesNode>;
  edges: SeriesEdge[];
  routes: RouteInfo[];
  postTitle: Map<string, string>;
  postHref: (id: string) => string;
}

/**
 * 知识域的配色与语义位置（x 向右、y 向下，范围 -1..1）。
 * 位置是人为约定的一张「知识地图」：基础在左下、后端居中、算法与语言在右、AI 与数据在上方。
 */
const DOMAIN_META: Record<string, { name: string; color: string; anchor: [number, number] }> = {
  basics:    { name: '编程基础与工具', color: '#9aa8bd', anchor: [-0.66, 0.44] },
  langs:     { name: '编程语言', color: '#f2c14e', anchor: [0.86, 0.26] },
  algo:      { name: '数据结构与算法', color: '#ff8a5b', anchor: [0.62, -0.24] },
  system:    { name: '计算机系统与网络', color: '#4fa3e3', anchor: [0.44, 0.5] },
  frontend:  { name: 'Web 前端', color: '#3ecf8e', anchor: [-0.52, -0.42] },
  backend:   { name: '后端开发', color: '#6e8bff', anchor: [-0.02, -0.12] },
  data:      { name: '数据库与大数据', color: '#2bbfae', anchor: [0.34, -0.68] },
  ai:        { name: '人工智能', color: '#b07cff', anchor: [0.02, -0.68] },
  security:  { name: '信息安全', color: '#f25767', anchor: [0.02, 0.76] },
  mobile:    { name: '移动与跨端', color: '#ff6fa8', anchor: [0.46, -0.7] },
  games:     { name: '游戏与图形', color: '#c5e34b', anchor: [-0.44, -0.7] },
  dist:      { name: '分布式与并行', color: '#8f7bff', anchor: [0.66, 0.88] },
  matht:     { name: '数学与理论', color: '#7cc4ff', anchor: [-0.36, 0.66] },
  swe:       { name: '软件工程', color: '#ffd166', anchor: [0.38, 0.9] },
  refs:      { name: '参考资料', color: '#8b8f98', anchor: [-0.85, -0.62] },
  blog:      { name: '博客随笔', color: '#c9a27e', anchor: [0.86, -0.74] },
};

/** 专题短标签：目录名有的很长，气泡旁只放得下几个字 */
const SHORT_NAMES: Record<string, string> = {
  '极客时间笔记精选': '极客笔记·精选', '极客时间笔记 II': '极客笔记 II',
  '极客时间笔记 III（网络与系统）': '极客笔记 III', '极客时间笔记 IV（数据库与算法）': '极客笔记 IV',
  '极客时间笔记 V（设计与工程）': '极客笔记 V',
  '剑指 Offer 题解': '剑指题解', '剑指 Offer 题解 II': '剑指题解 II',
  'JavaGuide 面试突击': 'JavaGuide 面试', '图解网络与OS': '图解网络/OS', 'labuladong 算法小抄': 'labuladong 小抄',
  '大厂面试内部参考': '大厂面试参考', 'Docker 官方教程': 'Docker 官方', 'Kubernetes 入门': 'K8s 入门',
  'React 官方中文文档': 'React 中文文档', 'Vue 3 官方中文文档': 'Vue 3 文档', 'TypeScript 教程': 'TS 教程',
  'JavaScript 教程': 'JS 教程', 'C++ Those Things': 'C++ Things', 'C/C++ 面试基础': 'C/C++ 面试',
  '中文文档排版指南': '排版指南', '强化学习教程': '强化学习', '编程基础与工具': '编程基础',
  'JavaFamily 图解': 'JavaFamily', 'JVM 核心知识': 'JVM 核心', '数据库与大数据': '数据库/大数据',
};
function shortName(name: string): string {
  if (SHORT_NAMES[name]) return SHORT_NAMES[name];
  // 一个汉字算 1、其它字符算 0.55，超过 8.5 个单位截断
  let units = 0;
  for (const ch of name) units += /[\u4e00-\u9fa5]/.test(ch) ? 1 : 0.55;
  if (units <= 8.5) return name;
  let out = '';
  units = 0;
  for (const ch of name) {
    units += /[\u4e00-\u9fa5]/.test(ch) ? 1 : 0.55;
    if (units > 7.5) break;
    out += ch;
  }
  return `${out}…`;
}

/** 教程先修关系（按标题，收录前人工整理；与 server.ts 的 curated pairs 同源） */
const PREREQ_PAIRS: [string, string][] = [
  ['CS 自学总纲', '数据结构与算法入门'],
  ['Python 基础入门', '深度学习与 PyTorch 入门'],
  ['深度学习与 PyTorch 入门', '大语言模型自学路线'],
  ['大语言模型自学路线', '本地大模型部署实战：Ollama 与 SGLang'],
  ['大语言模型自学路线', '本地知识库与 RAG 实战'],
  ['网络基础：IP 地址与访问流程', 'HTTP/HTTPS 协议详解'],
  ['HTTP/HTTPS 协议详解', 'SQL 注入实战进阶：Union、报错、盲注与防御'],
  ['JAVA程序基础', '面向对象编程'],
  ['面向对象编程', 'Java数组'],
  ['Java数组', 'Java 核心进阶：集合框架与并发编程入门'],
  ['Java 核心进阶：集合框架与并发编程入门', 'SpringMVC 与 MyBatis 入门'],
  ['Promise异步处理解决方案', 'JavaScript 异步编程全解：事件循环、Promise 与 async/await'],
  ['JavaScript 异步编程全解：事件循环、Promise 与 async/await', 'React 核心补充：Hooks 与状态管理'],
  ['TypeScript 进阶：泛型与类型体操入门', '前端工程化入门：npm、Vite 与构建部署'],
  ['数据结构与算法入门', '数据库系统导论'],
  ['docker的安装', 'Docker 常用命令与 Compose 实战'],
  ['Docker 常用命令与 Compose 实战', 'Linux 服务器运维清单：Nginx、防火墙与日常巡检'],
  ['git快速入门', 'Git 分支、合并与团队协作工作流'],
  ['排序与搜索算法全解', '动态规划入门：从递推到刷题套路'],
  ['MySQL 入门：从建库到查询', '数据库系统导论'],
  ['1.什么是机器学习', '深度学习与 PyTorch 入门'],
];

const natural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

export function buildGraphModel(posts: Post[], catalog: TutorialCatalog | null, careers: Career[]): GraphModel {
  const postTitle = new Map<string, string>();
  const categoryOfPost = new Map<string, string>();
  const postHref = (id: string) => `/post/${id}`;
  const domainOfPost = new Map<string, string>();
  const catalogOrder = new Map<string, number>();
  catalog?.tutorials.forEach((t, i) => {
    domainOfPost.set(t.id, t.domain);
    catalogOrder.set(t.id, i);
    categoryOfPost.set(t.id, t.category);
  });

  // ── 专题：按文章分类聚合 ──
  const seriesById = new Map<string, SeriesNode>();
  const domainVotes = new Map<string, Map<string, number>>();
  const isBlog = (c: string) => c === '随笔' || c === '项目实战';
  for (const p of posts) {
    postTitle.set(p.id, p.title);
    const domain = domainOfPost.get(p.id) || (p.category === '参考资料' ? 'refs' : isBlog(p.category) ? 'blog' : 'basics');
    domainOfPost.set(p.id, domain);
    let s = seriesById.get(p.category);
    if (!s) {
      s = {
        id: p.category, name: p.category, short: shortName(p.category), domain, count: 0, source: p.source || '',
        postIds: [], x: 0, y: 0, z: 0, r: 0, r0: 0, side: 0, lx: 0, ly: 0, lw: 0, lh: 0,
      };
      seriesById.set(p.category, s);
      domainVotes.set(p.category, new Map());
    }
    if (!s.source && p.source) s.source = p.source;
    s.postIds.push(p.id);
    const votes = domainVotes.get(p.category)!;
    votes.set(domain, (votes.get(domain) || 0) + 1);
  }
  const series: SeriesNode[] = [...seriesById.values()];
  for (const s of series) {
    s.count = s.postIds.length;
    // 领域归属取多数票（同一分类的文章领域一致，这里只是兜底）
    let best = s.domain, bestN = -1;
    domainVotes.get(s.id)!.forEach((n, d) => { if (n > bestN) { bestN = n; best = d; } });
    s.domain = best;
    // 阅读顺序：收录专题按编号（g-xxx-2 排在 g-xxx-10 前），自研教程按目录顺序
    s.postIds.sort((a, b) => (s.source ? natural(a, b) : 0) || (catalogOrder.get(a) ?? 1e6) - (catalogOrder.get(b) ?? 1e6) || natural(a, b));
    // 面积正比于篇数
    s.r = s.r0 = Math.max(9, Math.min(28, 8 + 1.9 * Math.sqrt(s.count)));
  }
  series.sort((a, b) => b.count - a.count);

  // ── 知识域 ──
  const domainIds = new Set<string>([...Object.keys(DOMAIN_META), ...series.map((s) => s.domain)]);
  const domains: DomainNode[] = [];
  for (const id of domainIds) {
    const own = series.filter((s) => s.domain === id).map((s) => s.id);
    const meta = DOMAIN_META[id] || { name: id, color: '#9aa8bd', anchor: [0, 0] as [number, number] };
    domains.push({
      id, name: meta.name, color: meta.color,
      icon: catalogIcon(id === 'refs' || id === 'blog' ? 'BookOpen' : id),
      anchor: meta.anchor, count: own.reduce((a, sid) => a + seriesById.get(sid)!.count, 0),
      seriesIds: own, box: { x: 0, y: 0, w: 0, h: 0 }, cx: 0, cy: 0, cw: 0, ch: 0, rc: 0,
      title: { x: 0, y: 0, w: 0, h: 0 }, nameW: 0, lobe: [0, 0],
    });
  }

  // ── 职业路线：阶段先后 → 专题序列 ──
  const seriesByTitle = new Map<string, string>();
  for (const p of posts) seriesByTitle.set(p.title, p.category);
  const routes: RouteInfo[] = careers.map((c) => {
    const stages = c.stages.map((st) => {
      const ids: string[] = [];
      st.items.forEach((it) => {
        const sid = seriesByTitle.get(it.ref);
        if (sid && !ids.includes(sid)) ids.push(sid);
      });
      return { name: st.name, seriesIds: ids };
    });
    const seq: string[] = [];
    stages.forEach((st) => st.seriesIds.forEach((sid) => { if (seq[seq.length - 1] !== sid) seq.push(sid); }));
    return { id: c.id, name: c.name, stages, seriesSeq: seq };
  });

  // ── 专题层的连线：路线先后 + 先修关系 ──
  const edgeMap = new Map<string, SeriesEdge>();
  const addEdge = (from: string, to: string, k: SeriesEdge['k'], route?: string) => {
    if (!from || !to || from === to) return;
    const key = `${k}|${from}>${to}`;
    let e = edgeMap.get(key);
    if (!e) { e = { from, to, k, w: 0, routes: [] }; edgeMap.set(key, e); }
    e.w += 1;
    if (route && !e.routes.includes(route)) e.routes.push(route);
  };
  for (const r of routes) for (let i = 0; i < r.seriesSeq.length - 1; i++) addEdge(r.seriesSeq[i], r.seriesSeq[i + 1], 'route', r.id);
  for (const t of catalog?.tutorials || []) {
    for (const pid of t.prereqs || []) {
      const from = categoryOfPost.get(pid);
      if (from && from !== t.category) addEdge(from, t.category, 'pre');
    }
  }
  for (const [from, to] of PREREQ_PAIRS) {
    const a = seriesByTitle.get(from), b = seriesByTitle.get(to);
    if (a && b) addEdge(a, b, 'pre');
  }

  return { domains, series, seriesById, edges: [...edgeMap.values()], routes, postTitle, postHref };
}

// ───────────────────────── 布局 ─────────────────────────

export const GRAPH_FONT = '"Inter Variable", system-ui, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
export const gfont = (weight: number, px: number) => `${weight} ${px}px ${GRAPH_FONT}`;
/** 全景层字号：专题标签 12px、知识域名 13px；整张图缩放时文字跟着缩放 */
export const LABEL_PX = 12, LABEL_H = 17, TITLE_PX = 13, TITLE_H = 22, COUNT_PX = 11, LEAD = 7;

export type Measure = (text: string, font: string) => number;

const isWideChar = (ch: string) => /[\u2e80-\u9fff\uff00-\uffef（）：，、]/.test(ch);
export const textUnits = (s: string) => {
  let u = 0;
  for (const ch of s) u += isWideChar(ch) ? 1 : 0.55;
  return u;
};
/** 没有 canvas 时按字宽估算：汉字 1 个字宽，其它 0.55 */
export const estimateMeasure: Measure = (text, font) => {
  const px = Number(font.match(/([\d.]+)px/)?.[1]) || 12;    // 字体串形如 "500 12px …"，要取的是 px 前面的数
  return textUnits(text) * px + 2;
};

/** 「圆 ∪ 矩形」：一个专题 = 气泡 + 一侧的标签；一个知识域 = 星团 + 正上方的名字 */
interface Shape { x: number; y: number; r: number; lx: number; ly: number; lw: number; lh: number; side: number }
const SIDE_DIR: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, -1], [0, 1]];   // 右 左 上 下
const shapeAt = (x: number, y: number, r: number, side: number, lw: number, lh: number, lead: number): Shape => {
  if (side === 0) return { x, y, r, lx: x + r + lead, ly: y - lh / 2, lw, lh, side };
  if (side === 1) return { x, y, r, lx: x - r - lead - lw, ly: y - lh / 2, lw, lh, side };
  if (side === 2) return { x, y, r, lx: x - lw / 2, ly: y - r - lead - lh, lw, lh, side };
  return { x, y, r, lx: x - lw / 2, ly: y + r + lead, lw, lh, side };
};
const circleHitsRect = (cx: number, cy: number, cr: number, b: Shape, g: number) => {
  const nx = Math.max(b.lx, Math.min(cx, b.lx + b.lw)), ny = Math.max(b.ly, Math.min(cy, b.ly + b.lh));
  return Math.hypot(cx - nx, cy - ny) < cr + g;
};
const hit = (a: Shape, b: Shape, g: number) =>
  Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + g
  || circleHitsRect(a.x, a.y, a.r, b, g) || circleHitsRect(b.x, b.y, b.r, a, g)
  || (a.lx < b.lx + b.lw + g && a.lx + a.lw + g > b.lx && a.ly < b.ly + b.lh + g && a.ly + a.lh + g > b.ly);
/** 形状上离原点最远的距离 */
const reach = (s: Shape) => {
  let m = Math.hypot(s.x, s.y) + s.r;
  for (const [px, py] of [[s.lx, s.ly], [s.lx + s.lw, s.ly], [s.lx, s.ly + s.lh], [s.lx + s.lw, s.ly + s.lh]]) {
    m = Math.max(m, Math.hypot(px, py));
  }
  return m;
};

const ITEM_GAP = 8;              // 星团内专题之间的缝
const CLUSTER_GAP = 22;          // 星团之间的缝
const CLUSTER_PAD = 12;   // 星团内容四周的留白（只用于排布与命中，不绘制）
const TITLE_GAP = 8;             // 知识域名与下面内容的间距
export const TITLE_DOT = 16;     // 知识域名前圆点占的宽度

interface Cluster {
  d: DomainNode; solo: boolean;
  cw: number; ch: number;        // 内容的外接尺寸（基准）
  tw: number; nameW: number;     // 知识域名整行 / 仅名字的宽度（基准）
  w: number; h: number;          // 整块（名字行 + 内容 + 留白）的尺寸（基准）
  x: number; y: number;          // 整块左上角
  tx: number; ty: number;        // 语义落点（整块中心）
  placed: boolean;
}
/**
 * 把各星团排进布局带，分三步：
 *   1. 疏散落点：语义位置挤在一起时，按「重叠的互相推开、小的让大的」让出一臂之距；
 *   2. 贪心落位：大的先放，从疏散后的落点向外找第一个放得下的位置（同一圈里挑贴得最紧的，少留碎片）；
 *   3. 微调：能互换的互换、能靠近落点的靠近（每一步都验证放得下）。
 * 所以结果一定互不重叠、都在带内。
 */
function packClusters(cs: Cluster[], bandW: number, bandH: number, k: number): boolean {
  const m = 4, gap = CLUSTER_GAP * k, n = cs.length;
  const area = cs.reduce((a, c) => a + (c.w * k + gap) * (c.h * k + gap), 0);
  if (area > 0.94 * bandW * bandH) return false;     // 面积明显不够：不用白费力气搜
  const w = cs.map((c) => c.w * k), h = cs.map((c) => c.h * k);
  const mass = cs.map((c, i) => w[i] * h[i]);
  const px = new Array<number>(n), py = new Array<number>(n);
  // 语义位置 → 布局带内的落点（整块的中心）
  for (let i = 0; i < n; i++) {
    px[i] = bandW / 2 + cs[i].d.anchor[0] * Math.max(0, bandW / 2 - w[i] / 2 - m);
    py[i] = bandH / 2 + cs[i].d.anchor[1] * Math.max(0, bandH / 2 - h[i] / 2 - m);
  }
  for (let it = 0; it < 160; it++) {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = px[j] - px[i], dy = py[j] - py[i];
      const ox = (w[i] + w[j]) / 2 + gap - Math.abs(dx);
      const oy = (h[i] + h[j]) / 2 + gap - Math.abs(dy);
      if (ox <= 0 || oy <= 0) continue;
      const si = mass[j] / (mass[i] + mass[j]), sj = mass[i] / (mass[i] + mass[j]);     // 小的让大的
      if (ox < oy) {
        const s = dx < 0 || (dx === 0 && (i + j) % 2) ? -1 : 1;
        px[i] -= s * ox * si; px[j] += s * ox * sj;
      } else {
        const s = dy < 0 || (dy === 0 && (i + j) % 2) ? -1 : 1;
        py[i] -= s * oy * si; py[j] += s * oy * sj;
      }
    }
    for (let i = 0; i < n; i++) {
      px[i] = Math.max(m + w[i] / 2, Math.min(bandW - m - w[i] / 2, px[i]));
      py[i] = Math.max(m + h[i] / 2, Math.min(bandH - m - h[i] / 2, py[i]));
    }
  }
  for (let i = 0; i < n; i++) { cs[i].tx = px[i]; cs[i].ty = py[i]; cs[i].placed = false; }

  const order = [...cs].sort((a, b) => b.w * b.h - a.w * a.h || (a.d.id < b.d.id ? -1 : 1));
  const diag = Math.hypot(bandW, bandH);
  const fits = (c: Cluster, x: number, y: number) => {
    const cw = c.w * k, ch = c.h * k;
    if (x < m || y < m || x + cw > bandW - m || y + ch > bandH - m) return false;
    return cs.every((o) => o === c || !o.placed
      || x + cw + gap <= o.x || o.x + o.w * k + gap <= x || y + ch + gap <= o.y || o.y + o.h * k + gap <= y);
  };
  for (let i = 0; i < order.length; i++) {
    const c = order[i];
    const cw = w[cs.indexOf(c)], ch = h[cs.indexOf(c)];
    let ok = false;
    const phase = i * 2.39996;    // 黄金角：每个星团从不同方向开始找
    for (let dd = 0; dd <= diag && !ok; dd += 6) {
      const rings = Math.max(12, Math.round((Math.PI * 2 * dd) / 18));
      // 同一圈里可能有好几个放得下的位置：挑与已放置星团（或布局带边缘）贴得最紧的那个
      let best: { x: number; y: number; touch: number } | null = null;
      for (let j = 0; j < rings; j++) {
        const a = phase + (j / rings) * Math.PI * 2;
        const x = c.tx + Math.cos(a) * dd - cw / 2, y = c.ty + Math.sin(a) * dd - ch / 2;
        if (!fits(c, x, y)) continue;
        let touch = 0;
        for (const o of cs) {
          if (o === c || !o.placed) continue;
          const ow = o.w * k, oh = o.h * k;
          const gx = Math.max(o.x - (x + cw), x - (o.x + ow));    // 两个块的间隙（< 0 表示在这个方向上有重叠）
          const gy = Math.max(o.y - (y + ch), y - (o.y + oh));
          if (gx > gap + 2 || gy > gap + 2) continue;
          const along = gx < 0 ? Math.min(y + ch, o.y + oh) - Math.max(y, o.y) : Math.min(x + cw, o.x + ow) - Math.max(x, o.x);
          touch += 1 + Math.min(along, 240) / 120;
        }
        if (x <= m + 2) touch += 0.6;
        if (x + cw >= bandW - m - 2) touch += 0.6;
        if (y <= m + 2) touch += 0.6;
        if (!best || touch > best.touch) best = { x, y, touch };
      }
      if (best) { c.x = best.x; c.y = best.y; c.placed = true; ok = true; }
    }
    if (!ok) return false;
  }
  // 互换：两个星团换位后各自都更靠近自己的落点、并且放得下，就换
  const off = (c: Cluster, x: number, y: number) => Math.hypot(x + (c.w * k) / 2 - c.tx, y + (c.h * k) / 2 - c.ty);
  for (let pass = 0; pass < 8; pass++) {
    let improved = false;
    for (let i = 0; i < order.length; i++) for (let j = i + 1; j < order.length; j++) {
      const a = order[i], b = order[j];
      // 以对方当前的中心为中心
      const ax = b.x + (b.w * k) / 2 - (a.w * k) / 2, ay = b.y + (b.h * k) / 2 - (a.h * k) / 2;
      const bx = a.x + (a.w * k) / 2 - (b.w * k) / 2, by = a.y + (a.h * k) / 2 - (b.h * k) / 2;
      if (off(a, ax, ay) + off(b, bx, by) >= off(a, a.x, a.y) + off(b, b.x, b.y) - 1) continue;
      const oa = { x: a.x, y: a.y }, ob = { x: b.x, y: b.y };
      a.placed = false; b.placed = false;
      let ok = fits(a, ax, ay);
      if (ok) { a.x = ax; a.y = ay; a.placed = true; ok = fits(b, bx, by); }
      if (ok) { b.x = bx; b.y = by; b.placed = true; improved = true; }
      else { a.x = oa.x; a.y = oa.y; a.placed = true; b.x = ob.x; b.y = ob.y; b.placed = true; }
    }
    if (!improved) break;
  }
  for (let pass = 0; pass < 4; pass++) {
    for (const c of order) {
      const from = { x: c.x, y: c.y }, cw = c.w * k, ch = c.h * k;
      for (let t = 0.05; t <= 1.0001; t += 0.025) {
        const x = from.x + (c.tx - cw / 2 - from.x) * t, y = from.y + (c.ty - ch / 2 - from.y) * t;
        if (fits(c, x, y)) { c.x = x; c.y = y; }
      }
    }
  }
  return true;
}
/** 给定缩放级别，二分找出最矮的、排得下的布局带高度；返回 null 表示放大到离谱也排不下 */
function shortestBand(cs: Cluster[], W: number, minH: number, k: number): number | null {
  const gap = CLUSTER_GAP * k;
  const area = cs.reduce((a, c) => a + (c.w * k + gap) * (c.h * k + gap), 0);
  const tryPack = (h: number) => {
    for (const c of cs) c.placed = false;
    return packClusters(cs, W, h, k);
  };
  let lo = Math.max(200, Math.round(minH), Math.ceil(area / (0.94 * W)));
  if (tryPack(lo)) return lo;
  let hi = Math.ceil(lo * 1.3);
  while (!tryPack(hi)) {
    lo = hi; hi = Math.ceil(hi * 1.7);
    if (hi > 16000) return null;
  }
  for (let it = 0; it < 7; it++) {
    const mid = Math.round((lo + hi) / 2);
    if (mid <= lo || mid >= hi) break;
    if (tryPack(mid)) hi = mid; else lo = mid;
  }
  return hi;
}

export interface OverviewLayout { k: number; w: number; h: number }

/**
 * 全景层布局：知识域 → 星团，星团里每个专题占「气泡 + 标签」一个整体。
 * 坐标是布局带内的 CSS 像素（scale = 1 的世界），原点在布局带左上角。
 * bandW × minH 是画布上不被工具栏 / 图例遮挡的区域；
 * 实在放不下时布局带会变高（返回值的 h），由调用方让用户拖动查看。
 */
export function layoutOverview(
  model: GraphModel, bandW: number, minH: number, measure: Measure = estimateMeasure,
): OverviewLayout {
  const W = Math.max(220, Math.round(bandW));
  const cs: Cluster[] = [];

  // ── 星团内部：按基准尺寸排一次，之后整体缩放 ──
  for (const d of model.domains) {
    const own = d.seriesIds.map((id) => model.seriesById.get(id)!);
    // 只有一个专题的知识域：专题名就是知识域名，名字行里直接放气泡，不再单独标一遍
    const solo = own.length === 1;
    const nameW = measure(d.name, gfont(600, TITLE_PX)), countW = measure(`${d.count} 篇`, gfont(500, COUNT_PX));
    const placed: Shape[] = [];
    const order = [...own].sort((a, b) => b.r0 - a.r0 || (a.id < b.id ? -1 : 1));
    order.forEach((s, i) => {
      s.lw = solo ? 0 : measure(s.short, gfont(500, LABEL_PX)) + 6;
      s.lh = LABEL_H;
      let shape: Shape;
      if (!i) shape = shapeAt(0, 0, s.r0, 0, s.lw, s.lh, LEAD);
      else {
        // 从中心向外找第一个放得下的位置；标签优先朝星团外侧 → 气泡聚在中间，名字围成一圈
        const phase = i * 2.39996;
        let right = 0;
        for (const p of placed) right = Math.max(right, p.x + p.r, p.lx + p.lw);
        let found: Shape | null = null;
        search: for (let dd = 0; dd <= right + s.r0 + s.lw + LABEL_H * 2 + 60; dd += 3) {
          const n = Math.max(1, Math.round((Math.PI * 2 * dd) / 5));
          for (let j = 0; j < n; j++) {
            const a = phase + (j / n) * Math.PI * 2;
            const cx = Math.cos(a) * dd, cy = Math.sin(a) * dd * 0.92;
            const len = Math.hypot(cx, cy) || 1;
            const sides = [0, 1, 2, 3].sort((p, q) =>
              (SIDE_DIR[q][0] * cx + SIDE_DIR[q][1] * cy) / len - (SIDE_DIR[p][0] * cx + SIDE_DIR[p][1] * cy) / len || p - q);
            for (const side of sides) {
              const cand = shapeAt(cx, cy, s.r0, side, s.lw, s.lh, LEAD);
              if (placed.every((p) => !hit(cand, p, ITEM_GAP))) { found = cand; break search; }
            }
          }
        }
        shape = found || shapeAt(right + ITEM_GAP + s.r0, 0, s.r0, 0, s.lw, s.lh, LEAD);   // 兜底：排到最右边
      }
      placed.push(shape);
      s.x = shape.x; s.y = shape.y; s.side = shape.side;
    });
    // 内容外接框，原点挪到框的中心
    let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
    if (!solo) {
      x0 = y0 = Infinity; x1 = y1 = -Infinity;
      for (const p of placed) {
        x0 = Math.min(x0, p.x - p.r, p.lx); x1 = Math.max(x1, p.x + p.r, p.lx + p.lw);
        y0 = Math.min(y0, p.y - p.r, p.ly); y1 = Math.max(y1, p.y + p.r, p.ly + p.lh);
      }
    }
    const cw = x1 - x0, ch = y1 - y0;
    for (const s of own) { s.x -= (x0 + x1) / 2; s.y -= (y0 + y1) / 2; }
    const tw = solo ? 2 * own[0].r0 + LEAD + nameW + 8 + countW : TITLE_DOT + nameW + 8 + countW;
    cs.push({
      d, solo, cw, ch, tw, nameW,
      w: (solo ? tw : Math.max(cw, tw)) + CLUSTER_PAD * 2,
      h: (solo ? Math.max(TITLE_H, 2 * own[0].r0) : TITLE_H + TITLE_GAP + ch) + CLUSTER_PAD * 2,
      x: 0, y: 0, tx: 0, ty: 0, placed: false,
    });
  }

  // ── 整体缩放：缩放级别从大到小试，第一个排得进给定高度的就用它；
  //    全都排不进时取「需要的高度最矮」的那个，布局带比画布高，由调用方让用户拖动查看 ──
  const ks = [1, 0.92, 0.85, 0.78];
  const minBand = Math.max(200, Math.round(minH));
  let best: { k: number; h: number } | null = null;
  for (const kk of ks) {
    const need = shortestBand(cs, W, minBand, kk);
    if (need === null) continue;
    if (!best || need < best.h) best = { k: kk, h: need };
    if (need <= minBand) break;
  }
  const k = best?.k ?? 0.78, bandH = best?.h ?? minBand;
  if (best) {
    for (const c of cs) c.placed = false;
    packClusters(cs, W, bandH, k);     // 二分的最后一步可能是失败的那次，按选定的参数重排一遍拿到坐标
  }

  // ── 落位：布局带坐标 ──
  for (const c of cs) {
    const d = c.d, pad = CLUSTER_PAD * k, th = TITLE_H * k;
    const w = c.w * k, h = c.h * k;
    d.box = { x: c.x, y: c.y, w, h };
    d.nameW = c.nameW * k;
    d.cw = c.cw * k; d.ch = c.ch * k;
    if (c.solo) {
      const s = model.seriesById.get(d.seriesIds[0])!;
      s.r = s.r0 * k; s.x = c.x + pad + s.r; s.y = c.y + h / 2;
      s.lx = s.x; s.ly = s.y; s.lw = 0; s.lh = 0; s.z = 0;
      d.title = { x: s.x + s.r + LEAD * k, y: c.y + (h - th) / 2, w: (c.tw - 2 * s.r0 - LEAD) * k, h: th };
      d.cx = c.x + w / 2; d.cy = c.y + h / 2;
    } else {
      d.title = { x: c.x + (w - c.tw * k) / 2, y: c.y + pad, w: c.tw * k, h: th };
      const left = c.x + (w - d.cw) / 2, top = c.y + pad + th + TITLE_GAP * k;
      d.seriesIds.forEach((id, i) => {
        const s = model.seriesById.get(id)!;
        s.r = s.r0 * k;
        s.x = left + (s.x + c.cw / 2) * k; s.y = top + (s.y + c.ch / 2) * k;
        s.lw *= k; s.lh *= k;
        const sh = shapeAt(s.x, s.y, s.r, s.side, s.lw, s.lh, LEAD * k);
        s.lx = sh.lx; s.ly = sh.ly;
        s.z = Math.sin((i + 1) * 2.39996) * Math.min(34, Math.max(d.cw, d.ch) * 0.2);   // 3D 用：轻微的纵深
      });
      d.cx = left + d.cw / 2; d.cy = top + d.ch / 2;
    }
    d.rc = Math.max(d.cw, d.ch) / 2 + pad;
    const la = Math.atan2(-d.anchor[1], -d.anchor[0]);
    d.lobe = [Math.cos(la) * d.rc * 0.3, Math.sin(la) * d.rc * 0.3];
  }
  return { k, w: W, h: bandH };
}
export interface DetailLayout {
  points: { id: string; x: number; y: number }[];
  path: { x: number; y: number }[];
  radius: number;       // 螺旋最外圈半径
  hub: number;          // 中心圆半径
  scale: number;        // 适配画布的缩放
}

/**
 * 专题层布局：文章按阅读顺序排在一条阿基米德螺旋线上，从中心向外顺时针展开。
 * 每个标签右侧留出固定弧长，所以标签之间永远不会重叠。
 */
export function layoutDetail(count: number, W: number, H: number, maxLabel = 128): DetailLayout {
  const hub = 92;
  const pitch = 27;
  const b = pitch / (Math.PI * 2);
  let ang = -Math.PI / 2;
  let r = hub + 16;
  const points: { id: string; x: number; y: number }[] = [];
  const path: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    points.push({ id: '', x: Math.cos(ang) * r, y: Math.sin(ang) * r });
    // 沿螺旋走一小步，供路径使用
    for (let k = 0; k < 6; k++) {
      path.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
      const step = (maxLabel / r) / 6;
      ang += step; r = hub + 16 + b * (ang + Math.PI / 2);
    }
  }
  const radius = r;
  const scale = Math.max(0.35, Math.min(1.2, (W - 60) / (2 * radius + maxLabel + 40), (H - 40) / (2 * radius + 30)));
  return { points, path, radius, hub, scale };
}
