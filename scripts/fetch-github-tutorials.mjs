// GitHub 教程大范围收录管线：拉取高质量开源教程仓库的 md → 转换为零外跳本地格式 → 注入 posts.json + tutorials.json
// 用法：node scripts/fetch-github-tutorials.mjs [--only sid1,sid2] [--refresh] [--pool N] [--dry]
// 规则：
//   - trees API 一次取全树 → 按 picks 规则（目录/关键词/上限）筛选 md
//   - raw.githubusercontent 下载内容
//   - 零外跳转换：剥离图片与 HTML、链接降级为纯文本、裸 URL 反引号包裹、mermaid 块删除
//   - 幂等：id 已存在跳过；--refresh 时原地更新已收录的文章（保留 id / 日期 / 阅读量 / 封面）
//   - --refresh 带「同 id 标题一致性校验」：picks 顺序变了导致 id 对不上别的文件时拒绝覆盖
import fs from 'fs';
import path from 'path';
import { execFile, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'server', 'data');
const TOKEN = process.env.GITHUB_TOKEN || '';   // 凭据走环境变量，不入仓库
const argv = process.argv.slice(2);
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1].split(',') : null;
const DRY = argv.includes('--dry');
const REFRESH = argv.includes('--refresh');
const POOL_N = argv.includes('--pool') ? parseInt(argv[argv.indexOf('--pool') + 1] || '2', 10) : null;
const POOL_FILE = path.join(DATA, 'sources-candidates.json');

function gh(path, accept = 'application/vnd.github+json') {
  return execFileSync('curl', ['-sL', '--max-time', '60',
    '-H', `Authorization: Bearer ${TOKEN}`, '-H', `Accept: ${accept}`,
    `https://api.github.com${path}`], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });
}
/** 下载内容文本 */
function raw(repo, branch, file) {
  const url = encodeURI(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`);
  return execFileSync('curl', ['-sL', '--max-time', '60', url],
    { maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' });
}

// ─── 并发下载 ───
// Windows 上起一个 curl 子进程要一两百毫秒，串行拉几百个文件要几十分钟；这里固定并发数跑。
const curlBin = (args) => new Promise((resolve) => {
  execFile('curl', ['-sSL', ...args], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
    (err, stdout) => resolve(err ? null : stdout));
});
async function pool(items, limit, worker) {
  let cursor = 0;
  const run = async () => {
    while (cursor < items.length) {
      await worker(items[cursor++]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
}
/** 并发预取一个仓库里选中的 md；失败的记为空串（调用方按「too short/missing」跳过） */
async function prefetchRaw(repo, branch, files) {
  const out = new Map();
  await pool(files, 8, async (file) => {
    const buf = await curlBin(['--max-time', '60', encodeURI(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`)]);
    out.set(file, buf && buf.length ? buf.toString('utf8') : '');
  });
  return out;
}

// ─── 配图本地化 ───
// 仓库相对路径从 raw.githubusercontent 取；外站图床（JavaGuide 的 oss.javaguide.cn 等）也直接抓——
// 「零外跳」约束的是读者点击，服务端抓取入库正是本地图床的用途。
// 抓不到的（404 / 超时 / 非图片）保留原文，清洗阶段转成「图示：说明」。
const FIG_ROOT = path.join(DATA, 'gallery', 'figures');
const FIG_MAX_BYTES = 8 * 1024 * 1024;
const IMG_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
let figsDownloaded = 0, figsReused = 0, figsFailed = 0;
const figKey = (src, relPath) => `${src.id}/${relPath.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-110)}`;
const onDisk = (key) => {
  try { return fs.statSync(path.join(FIG_ROOT, key)).size > 0; } catch { return false; }
};

// 有的作者后来重构了图床仓库，文章里的旧链接已经 404（dunwu/images 的 snap/ 目录被整体移走）。
// 把这类前缀固定到「移走前的最后一个提交」，历史里的图仍然取得到。
const IMAGE_PINS = [
  ['https://raw.githubusercontent.com/dunwu/images/master/', 'https://raw.githubusercontent.com/dunwu/images/30bd2f79334eaba5852f0d2008e0c8b57429202c/'],
];

// 抓取失败的地址记下来（7 天内不再重试），免得每次重拉都对着几百个死链空等
const FAILED_FILE = path.join(FIG_ROOT, '.failed.json');
const FAILED_TTL = 7 * 24 * 60 * 60 * 1000;
let failedKeys = {};
try { failedKeys = JSON.parse(fs.readFileSync(FAILED_FILE, 'utf8')); } catch { /* 首次运行 */ }
let failedDirty = false;
const recentlyFailed = (key) => failedKeys[key] && Date.now() - failedKeys[key] < FAILED_TTL;

/** 按文件头判断图片类型并给出扩展名；不是图片返回空串（有些图床对失效链接返回 200 + HTML） */
function imageExt(buf) {
  if (!buf || buf.length < 12) return '';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return '.png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return '.gif';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return '.webp';
  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) return '.ico';
  const head = buf.subarray(0, 1024).toString('utf8').replace(/^\uFEFF/, '').trimStart();
  if (head.startsWith('<') && /<svg[\s>]/i.test(buf.subarray(0, 4096).toString('utf8'))) return '.svg';
  return '';
}
const hash8 = (s) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
};

/** 正文里的一个图片地址 → { url, key, sniff? }：外站绝对地址直接抓；相对路径（含 / 开头的站点根相对）按仓库根解析 */
function resolveImage(src, dir, rawUrl) {
  if (rawUrl.startsWith('/images/figures/') || /^data:/i.test(rawUrl)) return null;
  if (/^(https?:)?\/\//i.test(rawUrl)) {
    let u;
    try { u = new URL(rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl); } catch { return null; }
    let url = u.href;
    for (const [from, to] of IMAGE_PINS) if (url.startsWith(from)) url = to + url.slice(from.length);
    const pathname = u.pathname.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-90);
    if (/\.(png|jpe?g|gif|webp|svg)$/i.test(u.pathname)) {
      return { url, key: figKey(src, `ext/${u.host}/${pathname}`) };
    }
    // 没有扩展名的 CDN 地址（掘金 user-gold-cdn 的 ?imageView2/…/format/webp）：抓回来按文件头补扩展名
    return { url, key: figKey(src, `ext/${u.host}/${pathname}${u.search ? '-' + hash8(u.search) : ''}`), sniff: true };
  }
  let clean = '';
  try { clean = decodeURIComponent(rawUrl).split(/[?#]/)[0]; } catch { return null; }
  if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(clean)) return null;
  const rel = path.posix.normalize(clean.startsWith('/') ? clean.slice(1) : path.posix.join(dir, clean));
  return { url: encodeURI(`https://raw.githubusercontent.com/${src.repo}/${src.branch}/${rel}`), key: figKey(src, rel) };
}

/** 无扩展名地址落盘时才补扩展名：按前缀在目录里找已下载的那个文件 */
function resolveSniffedKey(key) {
  try {
    const dirPath = path.join(FIG_ROOT, path.posix.dirname(key));
    const base = path.posix.basename(key);
    const hit = fs.readdirSync(dirPath).find((f) => f.startsWith(base) && /\.[a-z0-9]+$/.test(f));
    return hit ? `${path.posix.dirname(key)}/${hit}` : key;
  } catch {
    return key;
  }
}

async function localizeImages(src, mdPath, md) {
  if (DRY) return md;
  const dir = path.posix.dirname(mdPath);
  // 还没下载过、也不在失败名单里的并发抓；已在图床里的直接复用（重跑不再走网络）
  const wanted = new Map();
  for (const m of md.matchAll(IMG_RE)) {
    const r = resolveImage(src, dir, m[2]);
    if (!r || wanted.has(r.key) || recentlyFailed(r.key)) continue;
    if (onDisk(r.sniff ? resolveSniffedKey(r.key) : r.key)) continue;
    wanted.set(r.key, r);
  }
  await pool([...wanted.values()], 8, async ({ url, key, sniff }) => {
    // -f：HTTP 错误直接失败，不把 404 页面落成图片；--max-filesize 防大文件
    const buf = await curlBin(['-f', '--max-time', '60', '--max-filesize', String(FIG_MAX_BYTES), url]);
    const ext = imageExt(buf);
    if (!ext || buf.length > FIG_MAX_BYTES) {
      failedKeys[key] = Date.now();
      failedDirty = true;
      figsFailed++;
      return;
    }
    try {
      const finalKey = sniff ? key + ext : key;
      fs.mkdirSync(path.join(FIG_ROOT, path.posix.dirname(finalKey)), { recursive: true });
      fs.writeFileSync(path.join(FIG_ROOT, finalKey), buf);
      figsDownloaded++;
    } catch {
      figsFailed++;
    }
  });
  return md.replace(IMG_RE, (m, alt, rawUrl) => {
    const r = resolveImage(src, dir, rawUrl);
    if (!r) return m;
    const key = r.sniff ? resolveSniffedKey(r.key) : r.key;
    if (!onDisk(key)) return m;
    figsReused++;
    return `![${alt}](/images/figures/${encodeURI(key)})`;
  });
}

// ─── 源码引用内联（hello-algo）───
// hello-algo 的正文不直接写代码，而是引用仓库 codes/ 目录里的源文件：
//   [file]{preorder_traversal_i_compact}-[class]{}-[func]{pre_order}
// 这里把引用解析成真实代码（Java 版）内联进围栏；解析不到就保留原样（前台会显示成说明卡）。
const codeCache = new Map();
let codeResolved = 0;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function fetchCodeFile(src, repoPath) {
  if (!codeCache.has(repoPath)) codeCache.set(repoPath, raw(src.repo, src.branch, repoPath));
  return codeCache.get(repoPath);
}
const normId = (s) => String(s).replace(/_/g, '').toLowerCase();

/** 声明行：标识符后紧跟 (、不以 ; 结尾、不是注释行；标识符与目标名忽略大小写和下划线后相等
 *  （引用名 pre_order ↔ Java 的 preOrder，min_path_sum_dfs_mem ↔ minPathSumDFSMem，max_heap ↔ MaxHeap） */
function findDeclLine(lines, names) {
  const want = new Set(names.map(normId));
  return lines.findIndex((l) => {
    if (/;\s*$/.test(l) || /^\s*(\/\/|\*|\/\*)/.test(l)) return false;
    for (const m of l.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) {
      if (want.has(normId(m[1]))) return true;
    }
    return false;
  });
}

/** 从源文件里截出某个方法 / 类：命中行 + 紧邻其上的注释与注解，按花括号配平到块尾，按最小缩进反缩进 */
function extractBlock(text, { cls, fn }) {
  let lines = text.split('\n');
  if (cls) {
    const ci = lines.findIndex((l) => {
      const m = /\bclass\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(l);
      return !!m && normId(m[1]) === normId(cls);
    });
    if (ci < 0) return '';
    lines = lines.slice(ci);
  }
  if (!fn) return lines.join('\n').trim();
  // __init__ 即构造函数，名字就是类名
  const idx = findDeclLine(lines, normId(fn) === 'init' && cls ? [cls] : [fn]);
  if (idx < 0) return '';
  let start = idx;
  while (start > 0 && /^\s*(\/\*\*?|\*|\/\/|@)/.test(lines[start - 1])) start--;
  let depth = 0, seen = false, end = idx;
  for (let i = idx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; seen = true; } else if (ch === '}') depth--;
    }
    if (seen && depth <= 0) { end = i; break; }
  }
  const block = lines.slice(start, end + 1);
  const indent = Math.min(...block.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length));
  return block.map((l) => l.slice(indent)).join('\n');
}
function resolveCodeRefs(src, md, tree, codeRoot) {
  const blobs = tree.tree.filter((t) => t.type === 'blob' && t.path.startsWith(codeRoot + '/'));
  return md.replace(/```src\n([\s\S]*?)\n```/g, (m, body) => {
    const parts = [];
    for (const line of body.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const r = /^\[file\]\{([^}]+)\}(?:-\[class\]\{([^}]*)\})?(?:-\[func\]\{([^}]*)\})?$/.exec(line);
      if (!r) return m;
      const [, file, cls, fn] = r;
      const cands = blobs.filter((t) => new RegExp(`/${escapeRe(file)}(?:/[^/]+)?\\.java$`).test(t.path));
      if (!cands.length) return m;
      const text = fetchCodeFile(src, cands[0].path);
      const code = extractBlock(text, { cls, fn });
      if (!code) return m;
      parts.push(code);
    }
    codeResolved++;
    return '```java\n' + parts.join('\n\n') + '\n```';
  });
}

// ─── 零外跳转换（共享模块） ───
import { sanitize, excerptFrom } from './lib/md-sanitize.mjs';

function titleFrom(md, fallback) {
  const m = md.match(/^#\s+(.+)$/m);
  return (m ? m[1] : fallback).replace(/[*_`]/g, '').trim().slice(0, 80);
}

/** --refresh 的身份校验：同一 id 的新旧标题是否指同一篇文章 */
function sameTitle(a, b) {
  const norm = (s) => String(s || '').replace(/[^\p{Script=Han}\p{L}\p{N}]/gu, '');
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const grams = (s) => { const g = new Set(); for (let i = 0; i < s.length - 1; i++) g.add(s.slice(i, i + 2)); return g; };
  const gx = grams(x), gy = grams(y);
  let hit = 0;
  for (const g of gx) if (gy.has(g)) hit++;
  return hit / Math.max(1, Math.min(gx.size, gy.size)) >= 0.6;
}

// ─── 仓库收录策划（14 域映射）───
const SOURCES = [
  {
    id: 'helloalgo', repo: 'krahets/hello-algo', branch: 'main',
    category: 'Hello 算法', domain: 'algo', tags: ['算法', '数据结构', '图解'],
    codeRefs: 'codes/java',   // 正文里的 [file]{…}-[func]{…} 引用从这个目录取源码内联
    picks: [
      { dir: 'docs/chapter_data_structure', keywords: [], max: 5 },
      { dir: 'docs/chapter_tree', keywords: [], max: 3 },
      { dir: 'docs/chapter_heap', keywords: [], max: 2 },
      { dir: 'docs/chapter_graph', keywords: [], max: 2 },
      { dir: 'docs/chapter_searching', keywords: [], max: 3 },
      { dir: 'docs/chapter_sorting', keywords: [], max: 4 },
      { dir: 'docs/chapter_backtracking', keywords: [], max: 2 },
      { dir: 'docs/chapter_dynamic_programming', keywords: [], max: 3 },
      { dir: 'docs/chapter_greedy', keywords: [], max: 2 },
    ],
  },
  {
    id: 'csnotes', repo: 'CyC2018/CS-Notes', branch: 'master',
    category: '剑指 Offer 题解', domain: 'algo', tags: ['算法', '题解', '面试'],
    picks: [
      { dir: 'notes', max: 60, sortNumeric: true },
    ],
  },
  {
    id: 'javaguide', repo: 'Snailclimb/JavaGuide', branch: 'main',
    category: 'JavaGuide', domain: 'backend', tags: ['Java', '后端'],
    picks: [
      { dir: 'docs/java/basis', keywords: ['java-basic-questions'], max: 3 },
      { dir: 'docs/java/collection', keywords: ['collection-questions'], max: 2 },
      { dir: 'docs/java/jvm', max: 3 },
      { dir: 'docs/java/concurrent', keywords: ['concurrent-questions'], max: 2 },
    ],
  },
  {
    id: 'advjava', repo: 'doocs/advanced-java', branch: 'main',
    category: '后端进阶', domain: 'backend', tags: ['高并发', '分布式', '架构'],
    picks: [
      { dir: 'docs/distributed-system', keywords: ['cap', 'transaction', 'lock', 'idempotency', 'session'], max: 5 },
      { dir: 'docs/high-availability', keywords: ['hystrix'], max: 3 },
      { dir: 'docs/high-concurrency', keywords: ['cache', 'current-limit', 'message-queue'], max: 4 },
      { dir: 'docs/big-data', keywords: ['.md'], max: 11 },
    ],
  },
  {
    id: 'easyrl', repo: 'datawhalechina/easy-rl', branch: 'master',
    category: '强化学习教程', domain: 'ai', tags: ['强化学习', '机器学习'],
    picks: [
      { dir: 'docs/chapter1', files: ['chapter1.md'] },
      { dir: 'docs/chapter2', files: ['chapter2.md'] },
      { dir: 'docs/chapter3', files: ['chapter3.md'] },
      { dir: 'docs/chapter4', files: ['chapter4.md'] },
      { dir: 'docs/chapter5', files: ['chapter5.md'] },
      { dir: 'docs/chapter6', files: ['chapter6.md'] },
      { dir: 'docs/chapter7', files: ['chapter7.md'] },
      { dir: 'docs/chapter8', files: ['chapter8.md'] },
      { dir: 'docs/chapter9', files: ['chapter9.md'] },
      { dir: 'docs/chapter10', files: ['chapter10.md'] },
      { dir: 'docs/chapter11', files: ['chapter11.md'] },
      { dir: 'docs/chapter12', files: ['chapter12.md'] },
      { dir: 'docs/chapter13', files: ['chapter13.md'] },
      { dir: 'docs/chapter16', files: ['chapter16.md'] },
    ],
  },
  {
    id: 'rustcourse', repo: 'sunface/rust-course', branch: 'main',
    category: 'Rust 语言圣经', domain: 'langs', tags: ['Rust', '系统编程'],
    picks: [
      { dir: 'src/basic', keywords: ['ownership', 'borrowing', 'struct', 'enum', 'string', 'slice'], max: 6 },
      { dir: 'src/advance', keywords: ['lifetime', 'pattern-match'], max: 2 },
    ],
  },
  {
    id: 'cppthings', repo: 'Light-City/CPlusPlusThings', branch: 'master',
    category: 'C++ Those Things', domain: 'langs', tags: ['C++'],
    picks: [
      { dir: 'basic_content', keywords: ['const', 'static', 'inline', 'virtual', 'sizeof'], max: 5, recursive: true },
    ],
  },
  {
    id: 'jstut', repo: 'wangdoc/javascript-tutorial', branch: 'master',
    category: 'JavaScript 教程', domain: 'frontend', tags: ['JavaScript', '前端'],
    picks: [
      { dir: 'docs', keywords: ['grammar', 'types', 'function', 'stdlib', 'async', 'dom', 'oop'], max: 10, recursive: true },
    ],
  },
  {
    id: 'tstut', repo: 'wangdoc/typescript-tutorial', branch: 'main',
    category: 'TypeScript 教程', domain: 'frontend', tags: ['TypeScript', '前端'],
    picks: [
      { dir: 'docs', keywords: [], max: 10, recursive: true },
    ],
  },
  {
    id: 'gittut', repo: 'wangdoc/git-tutorial', branch: 'master',
    category: 'Git 教程', domain: 'basics', tags: ['Git', '版本控制'],
    picks: [
      { dir: 'docs', keywords: [], max: 10, recursive: true },
    ],
  },
  {
    id: 'py100', repo: 'jackfrued/Python-100-Days', branch: 'master',
    category: 'Python 100 天', domain: 'langs', tags: ['Python'],
    picks: [
      { dir: 'Day01-15', keywords: ['.md'], max: 8, recursive: true },
    ],
  },
  {
    id: 'linuxcmd', repo: 'jaywcjlove/linux-command', branch: 'master',
    category: 'Linux 命令大全', domain: 'system', tags: ['Linux', '命令行'],
    picks: [
      { dir: 'command', files: ['ls.md', 'grep.md', 'find.md', 'awk.md', 'sed.md', 'curl.md', 'ssh.md', 'tar.md', 'chmod.md', 'ps.md', 'top.md', 'systemctl.md', 'docker.md', 'netstat.md'] },
    ],
  },
  {
    id: 'docker', repo: 'yeasy/docker_practice', branch: 'master',
    category: 'Docker 实战', domain: 'system', tags: ['Docker', '容器', '部署'],
    picks: [
      { dir: '02_basic_concept', keywords: ['.md'], max: 3 },
      { dir: '03_image', keywords: ['.md'], max: 2 },
      { dir: '04_container', keywords: ['.md'], max: 2 },
      { dir: '07_dockerfile', keywords: ['instructions', 'README'], max: 2 },
      { dir: '09_network', keywords: ['.md'], max: 2 },
    ],
  },
  {
    id: 'dockeroff', repo: 'docker/getting-started', branch: 'master',
    category: 'Docker 官方教程', domain: 'system', tags: ['Docker', '容器'],
    picks: [
      { dir: 'docs/tutorial', keywords: ['index.md'], max: 8, recursive: true },
    ],
  },
  {
    id: 'csbase', repo: 'xiaolincoder/CS-Base', branch: 'main',
    category: '图解系统', domain: 'system', tags: ['MySQL', '操作系统', '网络', '图解'],
    picks: [
      { dir: 'mysql', keywords: ['index', 'transaction', 'buffer', 'log', 'lock'], max: 6, recursive: true },
      { dir: 'network', keywords: [], max: 5, recursive: true },
      { dir: 'os', keywords: [], max: 5, recursive: true },
    ],
  },
  {
    id: 'happyllm', repo: 'datawhalechina/happy-llm', branch: 'main',
    category: 'Happy-LLM', domain: 'ai', tags: ['LLM', '大模型', 'NLP'],
    picks: [
      { dir: 'docs/chapter1', files: ['第一章 NLP基础概念.md'] },
      { dir: 'docs/chapter2', files: ['第二章 Transformer架构.md'] },
      { dir: 'docs/chapter3', files: ['第三章 预训练语言模型.md'] },
      { dir: 'docs/chapter4', files: ['第四章 大语言模型.md'] },
      { dir: 'Extra-Chapter/transformer-architecture', files: ['readme.md'] },
    ],
  },
  {
    id: 'k8s', repo: 'guangzhengli/k8s-tutorials', branch: 'main',
    category: 'Kubernetes 入门', domain: 'system', tags: ['Kubernetes', '云原生', '部署'],
    picks: [
      { dir: 'docs', files: ['pod.md', 'deployment.md', 'service.md', 'ingress.md', 'configmap.md', 'secret.md', 'helm.md', 'namespace.md', 'job.md', 'container.md'] },
    ],
  },
  {
    id: 'ctfwiki', repo: 'ctf-wiki/ctf-wiki', branch: 'master',
    category: 'CTF Wiki', domain: 'security', tags: ['CTF', '安全', '渗透'],
    picks: [
      { dir: 'docs/zh/docs', keywords: ['pwn/', 'reverse/', 'crypto/', 'web/', 'misc/'], max: 12, recursive: true },
    ],
  },
];

// ─── 数据加载 ───
const postsPath = path.join(DATA, 'posts.json');
const tutPath = path.join(DATA, 'tutorials.json');
const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
const tut = JSON.parse(fs.readFileSync(tutPath, 'utf8'));
const existingIds = new Set(posts.map(p => p.id));
const today = new Date().toISOString().slice(0, 10);   // 新收录文章的日期取运行当天

function words(text) {
  const c = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const e = (text.match(/[a-zA-Z]+/g) || []).length;
  return c + e;
}

let addedTotal = 0, refreshedTotal = 0, changedTotal = 0, failedRepos = [];
const report = [];

// --pool 模式：从候选池取前 N 个 pending 仓库（定时任务每轮消耗，池空则无操作）
let sourceList = SOURCES;
let poolEntries = null;
if (POOL_N !== null) {
  try {
    poolEntries = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
  } catch { poolEntries = { candidates: [] }; }
  const pending = (poolEntries.candidates || []).filter(c => c.status === 'pending');
  if (!pending.length) {
    console.log('pool: no pending candidates');
    process.exit(0);
  }
  const batch = pending.slice(0, POOL_N);
  sourceList = batch.map(c => ({ ...c, picks: c.picks || [{ dir: c.dir || '', keywords: c.keywords || ['.md'], max: c.max || 8, recursive: c.recursive !== false }] }));
  console.log(`pool batch: ${sourceList.map(s => s.id).join(', ')}`);
}

// --refresh：候选池里已消费的条目也能重拉——不带 --only 时全量，带 --only 时按 id 单独取
if (REFRESH && POOL_N === null) {
  let pool = { candidates: [] };
  try { pool = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8')); } catch { /* 无候选池 */ }
  const fromPool = (pool.candidates || [])
    .filter(c => c.repo && c.status !== 'pending' && !SOURCES.some(s => s.id === c.id) && (!only || only.includes(c.id)))
    .map(c => ({ ...c, picks: c.picks || [{ dir: c.dir || '', keywords: c.keywords || ['.md'], max: c.max || 8, recursive: c.recursive !== false }] }));
  sourceList = [...SOURCES, ...fromPool];
  if (!only) console.log(`refresh-all: ${sourceList.length} 个来源`);
}

for (const src of sourceList) {
  if (only && !only.includes(src.id)) continue;
  try {
    // 全树一次拿
    const treeRaw = gh(`/repos/${src.repo}/git/trees/${src.branch}?recursive=1`);
    const tree = JSON.parse(treeRaw);
    if (!tree.tree) throw new Error('tree api failed: ' + treeRaw.slice(0, 120));
    const allMd = tree.tree.filter(t =>
      t.type === 'blob' && /\.md$/i.test(t.path) && !/node_modules|\.github|\.claude|\.cursor|\.vscode|CHANGELOG|CODE_OF|LICENSE|_style|_coverpage|_404|ISSUE_TEMPLATE|PULL_REQUEST|README|_FR|french|errata|勘误|\.en\.md|(^|\/)index\.md$/i.test(t.path)
    );

    // 按 picks 选文件
    const chosen = new Set();
    for (const pick of src.picks) {
      const dirPrefix = pick.dir ? (pick.dir + '/') : '';
      let candidates;
      if (pick.viaContents) {
        // viaContents 模式：树 truncated 的大仓库改用 contents API 逐子目录列举
        candidates = [];
        try {
          const subs = JSON.parse(gh(`/repos/${src.repo}/contents/${pick.dir}`))
            .filter(x => x.type === 'dir' && !/img|image|assets|picture/i.test(x.name));
          for (const sub of subs) {
            try {
              const subFiles = JSON.parse(gh(`/repos/${src.repo}/contents/${sub.path}`));
              for (const f of subFiles) {
                if (f.type === 'file' && /\.md$/i.test(f.name)) candidates.push(f.path);
              }
            } catch { /* 子目录跳过 */ }
          }
        } catch (e) { report.push(`✘ ${src.id} contents list failed: ${e.message.slice(0, 60)}`); }
      } else {
        candidates = allMd
          .map(t => t.path)
          .filter(p => p.startsWith(dirPrefix) && !p.endsWith('README.md'));
      }
      if (pick.recursive === false) candidates = candidates.filter(p => path.dirname(p) === (pick.dir || '.'));
      if (pick.files) {
        for (const f of pick.files) {
          const full = dirPrefix + f;
          if (allMd.some(t => t.path === full)) chosen.add(full);
        }
        continue;
      }
      if (pick.keywords && pick.keywords.length) {
        candidates = candidates.filter(p => pick.keywords.some(k => p.toLowerCase().includes(k.toLowerCase())));
      }
      // 排序取前 max（路径稳定排序；sortNumeric 按文件名前导数字排序，如剑指题解编号；skip 跳过已收前缀）
      if (pick.sortNumeric) {
        const num = (p) => parseFloat(path.basename(p).match(/^(\d+)/)?.[1] ?? '9999');
        candidates.sort((a, b) => num(a) - num(b));
      } else {
        candidates.sort();
      }
      const skipN = pick.skip || 0;
      for (const p of candidates.slice(skipN, skipN + (pick.max || 5))) chosen.add(p);
    }

    let addedRepo = 0, refreshedRepo = 0, changedRepo = 0, idx = 0;
    const refreshedIds = new Set();
    const files = [...chosen].sort();
    // 先并发把选中的 md 拉回来，再按顺序处理（id 依赖顺序，处理本身必须串行）
    const prefetched = await prefetchRaw(src.repo, src.branch, files);
    for (const file of files) {
      idx++;
      const id = `g-${src.id}-${idx}`;
      const existIdx = posts.findIndex((p) => p.id === id);
      if (existIdx !== -1 && !REFRESH) { continue; }
      let content = prefetched.get(file) || '';
      if (!content || content.length < 800) { report.push(`skip ${file}: too short/missing`); continue; }
      if (/^\s*<!DOCTYPE|<html/i.test(content)) { report.push(`skip ${file}: html page`); continue; }

      content = await localizeImages(src, file, content);
      if (src.codeRefs) content = resolveCodeRefs(src, content, tree, src.codeRefs);

      const clean = sanitize(content);
      if (clean.length < 500) { report.push(`skip ${file}: post-sanitize too short`); continue; }
      const title = titleFrom(clean, path.basename(file, '.md'));
      const excerpt = excerptFrom(clean);
      const minutes = Math.max(5, Math.round(words(clean) / 400));

      // --refresh：原地更新已收录的文章（id / 日期 / 阅读量 / 封面不变）。
      // 先按 id 找；id 对应的标题对不上（早期收录顺序与现在的 picks 不同，id 会漂移）时，
      // 改为在同一来源里按标题找——找到就更新那一篇，找不到才跳过
      if (REFRESH) {
        let target = existIdx !== -1 ? posts[existIdx] : undefined;
        if (!target || !sameTitle(target.title, title)) {
          target = posts.find((p) => p.source === src.repo && !refreshedIds.has(p.id) && sameTitle(p.title, title));
        }
        if (target && sameTitle(target.title, title)) {
          const changed = target.content !== clean;
          Object.assign(target, { title, excerpt, content: clean, tags: [...src.tags], source: src.repo });
          const t = tut.tutorials.find((x) => x.id === target.id);
          if (t) Object.assign(t, { title, summary: excerpt.slice(0, 60), minutes, href: `/post/${target.id}` });
          refreshedIds.add(target.id);
          refreshedRepo++;
          if (changed) changedRepo++;
          continue;
        }
        if (existIdx !== -1) {
          report.push(`~ ${id}: 找不到对应旧文，保留旧内容（${posts[existIdx].title.slice(0, 20)}）`);
        }
        // --refresh 只更新、不新增：没有对应的旧文就跳过
        continue;
      }

      if (existIdx !== -1) continue;

      posts.push({
        id,
        title: `${title}`,
        date: today,
        category: src.category,
        tags: [...src.tags],
        excerpt,
        content: clean,
        source: src.repo,
        views: 0,
      });

      // tutorials.json 同步（14 域归位）；href 一律带 /post/ 前缀（文章页上下篇按它跳转）
      tut.tutorials.push({
        id, kind: 'collection', title, summary: excerpt.slice(0, 60),
        domain: src.domain, category: src.category,
        difficulty: '进阶', minutes,
        tags: [...src.tags], prereqs: [], href: `/post/${id}`,
      });
      const dom = tut.domains.find(d => d.id === src.domain);
      if (dom) dom.count = (dom.count || 0) + 1;
      existingIds.add(id);
      addedRepo++;
    }
    addedTotal += addedRepo;
    refreshedTotal += refreshedRepo;
    changedTotal += changedRepo;
    report.push(`✔ ${src.id}: +${addedRepo}/${chosen.size}（${src.category}）${REFRESH ? ` 刷新 ${refreshedRepo} 篇（内容有变化 ${changedRepo}）` : ''}`);
  } catch (e) {
    failedRepos.push(src.id);
    report.push(`✘ ${src.id}: ${e.message.slice(0, 100)}`);
  }
}

if (!DRY) {
  // 缩进与服务端写回保持一致（2 空格），避免每次收录 / 阅读计数交替改写时整文件抖动
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
  fs.writeFileSync(tutPath, JSON.stringify(tut, null, 2));
}

// --pool：回写候选状态
if (poolEntries && !DRY) {
  for (const src of sourceList) {
    const failed = failedRepos.includes(src.id);
    const ent = (poolEntries.candidates || []).find(c => c.id === src.id);
    if (ent) ent.status = failed ? 'failed' : 'done';
  }
  fs.writeFileSync(POOL_FILE, JSON.stringify(poolEntries, null, 1));
}

console.log(`\n=== 收录报告（${DRY ? 'DRY' : '写入'}）===`);
report.forEach(r => console.log(r));
console.log(`\n新增: ${addedTotal} 篇${REFRESH ? `  刷新: ${refreshedTotal} 篇（内容有变化 ${changedTotal}）` : ''}  失败仓库: ${failedRepos.join(',') || '无'}  posts 总量: ${posts.length}`);
if (!DRY) console.log(`配图: 新下载 ${figsDownloaded} / 复用 ${figsReused} / 失败 ${figsFailed}  源码引用内联: ${codeResolved}`);

// 抓取失败的图片地址落盘（下次运行 TTL 内直接跳过）
if (!DRY && failedDirty) {
  const now = Date.now();
  const kept = Object.fromEntries(Object.entries(failedKeys).filter(([, t]) => now - t < FAILED_TTL));
  fs.mkdirSync(FIG_ROOT, { recursive: true });
  fs.writeFileSync(FAILED_FILE, JSON.stringify(kept));
}
