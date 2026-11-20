// Build server/data/tutorials.json from posts.json + src/tutorials/*.md
// - x-series md tutorials are injected into posts.json (id: x-<slug>, idempotent)
// - tutorials.json carries domain/difficulty/minutes/prereqs metadata
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const POSTS_FILE = path.join(ROOT, 'server', 'data', 'posts.json');
const TUT_FILE = path.join(ROOT, 'server', 'data', 'tutorials.json');
const MD_DIR = path.join(ROOT, 'src', 'tutorials');

// ---- domain model -------------------------------------------------------
const DOMAINS = [
  { id: 'basics', name: '编程基础与工具', icon: 'Wrench', blurb: '工具链、计算机组成、效率方法——程序员的内功底盘' },
  { id: 'langs', name: '编程语言', icon: 'Code2', blurb: 'C/Java/Python/JS/Go/Rust——表达思想的语言' },
  { id: 'algo', name: '数据结构与算法', icon: 'GitBranch', blurb: '数据组织与算法思维，面试与功底的分水岭' },
  { id: 'system', name: '计算机系统与网络', icon: 'Server', blurb: '网络协议、操作系统、Linux 运维——理解机器如何运转' },
  { id: 'frontend', name: 'Web 前端', icon: 'Monitor', blurb: 'HTML/CSS/JS、React/Vue、工程化与性能' },
  { id: 'backend', name: '后端开发', icon: 'ServerCog', blurb: 'API 设计、框架、微服务、消息队列' },
  { id: 'data', name: '数据库与大数据', icon: 'HardDrive', blurb: 'SQL/NoSQL、Redis、Hadoop/Spark 生态' },
  { id: 'ai', name: '人工智能', icon: 'BrainCircuit', blurb: '机器学习、深度学习、LLM 应用与 RAG' },
  { id: 'security', name: '信息安全', icon: 'Shield', blurb: 'Web 安全、渗透测试、CTF、密码学' },
  { id: 'mobile', name: '移动与跨端', icon: 'Smartphone', blurb: 'Android、iOS、Flutter、跨平台方案' },
  { id: 'games', name: '游戏与图形', icon: 'Gamepad2', blurb: '游戏循环、物理与碰撞、Unity 引擎、图形编程' },
  { id: 'projects', name: '项目实战', icon: 'Rocket', blurb: '完整项目复盘：从需求到上线' },
];

const CATEGORY_TO_DOMAIN = {
  '方法与工具': 'basics',
  '计算机组成': 'basics',
  '编程语言': 'langs',
  '数据结构与算法': 'algo',
  '计算机网络': 'system',
  '操作系统与运维': 'system',
  'Web 前端': 'frontend',
  '后端开发': 'backend',
  '数据库': 'data',
  '大数据': 'data',
  '人工智能': 'ai',
  '信息安全': 'security',
  '移动与跨端': 'mobile',
  '游戏与图形': 'games',
  '项目实战': 'projects',
};

// blog categories stay on the home feed; everything else is tutorial content
const BLOG_CATEGORIES = new Set(['随笔', '项目实战']);

// local reference mirrors: kept in posts.json (searchable/archivable)
// but excluded from the tutorial catalog
const TUTORIAL_EXCLUDE = new Set(['参考资料']);
const REF_DIR = path.join(ROOT, 'src', 'references');

// curated prerequisites (same pairs the knowledge graph uses)
const PREREQ_PAIRS = [
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

// prerequisites for x-series md tutorials (by slug)
const MD_PREREQS = {
  'x01_java_syntax': ['JAVA程序基础'],
  'x02_java_oop': ['x-01_java_syntax'],
  'x03_java_arrays': ['x-02_java_oop'],
  'x04_graph_algorithms': ['排序与搜索算法全解'],
  'x05_bitwise_algorithms': ['排序与搜索算法全解'],
  'x06_ip_subnet': ['网络基础：IP 地址与访问流程'],
  'x07_dns_flow': ['网络基础：IP 地址与访问流程'],
  'x08_os_concepts': ['x-01_java_syntax'],
  'x09_grep_awk': ['Linux 常用命令与文本处理'],
  'x10_shell_script': ['Linux 常用命令与文本处理'],
  'x11_kotlin_coroutines': ['2.Kotlin 必知必会'],
  'x11_sql_advanced': ['SQL 快速入门'],
  'x12_python_automation': ['Python 基础入门'],
};

// ---- helpers ------------------------------------------------------------
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let [, k, v] = kv;
    if (k === 'tags') {
      v = v.replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(Boolean);
    } else if (/^\d+$/.test(v)) {
      v = parseInt(v, 10);
    }
    meta[k] = v;
  }
  return { meta, body: m[2] };
}

function estimateMinutes(content) {
  const prose = content.replace(/```[\s\S]*?```/g, '').replace(/\s/g, '');
  const code = (content.match(/```/g) || []).length / 2;
  return Math.max(2, Math.round(prose.length / 400 + code * 1.5));
}

function difficultyOf(title) {
  if (/入门|基础|快速|初探|认识|初识|第一|什么是/.test(title)) return '入门';
  if (/进阶|深入|高级|原理|源码|性能|优化|全解|实战|体操|内核|底层/.test(title)) return '高级';
  return '进阶';
}

// ---- inject md tutorials into posts -------------------------------------
const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
const mdFiles = fs.readdirSync(MD_DIR).filter(f => f.endsWith('.md'));
const today = new Date().toISOString().slice(0, 10);
const injected = [];

for (const file of mdFiles) {
  const slug = file.replace(/\.md$/, '');
  const id = 'x-' + slug;
  const raw = fs.readFileSync(path.join(MD_DIR, file), 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  const cat = String(meta.category || '').split('/')[0].trim() || '方法与工具';
  const post = {
    id,
    title: meta.title || slug,
    date: today,
    category: cat,
    tags: meta.tags || [],
    excerpt: meta.summary || '',
    content: body.trim(),
    views: 0,
  };
  const idx = posts.findIndex(p => p.id === id);
  if (idx >= 0) posts[idx] = post; else posts.push(post);
  injected.push(id);
}

// ---- inject local reference mirrors into posts --------------------------
const refFiles = fs.existsSync(REF_DIR) ? fs.readdirSync(REF_DIR).filter(f => f.endsWith('.md')) : [];
const refInjected = [];
for (const file of refFiles) {
  const slug = file.replace(/\.md$/, '');
  const id = 'ref-' + slug;
  const raw = fs.readFileSync(path.join(REF_DIR, file), 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  const post = {
    id,
    title: meta.title || slug,
    date: today,
    category: '参考资料',
    tags: [...(meta.tags || []), '参考资料'],
    excerpt: meta.summary || '',
    content: body.trim(),
    views: 0,
  };
  const idx = posts.findIndex(p => p.id === id);
  if (idx >= 0) posts[idx] = post; else posts.push(post);
  refInjected.push(id);
}

fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));

// ---- build tutorials.json ------------------------------------------------
const titleToId = new Map(posts.map(p => [p.title, p.id]));
const prereqMap = new Map();
for (const [from, to] of PREREQ_PAIRS) {
  const a = titleToId.get(from), b = titleToId.get(to);
  if (a && b) {
    if (!prereqMap.has(b)) prereqMap.set(b, []);
    prereqMap.get(b).push(a);
  }
}

const tutorials = posts
  .filter(p => !BLOG_CATEGORIES.has(p.category) && !TUTORIAL_EXCLUDE.has(p.category))
  .map(p => {
    const cat = CATEGORY_TO_DOMAIN[p.category] ? p.category : p.category.split('/')[0].trim();
    const domain = CATEGORY_TO_DOMAIN[cat] || 'basics';
    const prereqs = prereqMap.get(p.id) || MD_PREREQS[p.id] || [];
    return {
      id: p.id,
      kind: p.id.startsWith('x-') ? 'md' : 'post',
      title: p.title,
      summary: p.excerpt || (p.content || '').slice(0, 80),
      domain,
      category: p.category,
      difficulty: difficultyOf(p.title),
      minutes: estimateMinutes(p.content || ''),
      tags: p.tags || [],
      prereqs,
      href: `/post/${p.id}`,
    };
  });

// keep reading order sensible inside each domain: difficulty then title
// plain code-point compare keeps ASCII titles before CJK ones deterministically
const byTitle = (a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0);
tutorials.sort((a, b) =>
  a.domain === b.domain
    ? ['入门', '进阶', '高级'].indexOf(a.difficulty) - ['入门', '进阶', '高级'].indexOf(b.difficulty) || byTitle(a, b)
    : a.domain.localeCompare(b.domain)
);

const domains = DOMAINS.map(d => ({
  ...d,
  count: tutorials.filter(t => t.domain === d.id).length,
})).filter(d => d.count > 0);

const out = {
  generatedAt: new Date().toISOString(),
  blogCategories: [...BLOG_CATEGORIES],
  domains,
  tutorials,
};
fs.writeFileSync(TUT_FILE, JSON.stringify(out, null, 2));

console.log(`posts: ${posts.length} (injected ${injected.length} md tutorials, ${refInjected.length} references)`);
console.log(`tutorials: ${tutorials.length} across ${domains.length} domains`);
for (const d of domains) console.log(`  ${d.name}: ${d.count}`);
