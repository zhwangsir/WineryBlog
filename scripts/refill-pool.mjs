// 候选池自动补充：池里的 pending 少于 --min 时补新候选，先精选清单、再用 GitHub 搜索发现。
// 用法：node scripts/refill-pool.mjs [--min 2] [--discover 2] [--max-add 4] [--curated-only] [--force] [--dry]
// 候选条目与 fetch-github-tutorials.mjs --pool 模式完全同构：
//   { id, repo, branch, category, domain, tags, status: 'pending', note }
//   - branch 不写死：逐个经 /repos API 校验存在性，并写入真实默认分支
//   - 精选候选：校验存在 / 未归档 / 非 fork / 星数 ≥ 50
//   - 搜索发现：星数 ≥ 300、一年半内活跃、README 里 CJK 字符达标（站内是中文内容）
// 凭据与代理沿用环境变量：GITHUB_TOKEN、https_proxy（curl 自动走代理）
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { CURATED } from './lib/pool-catalog.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const POOL_FILE = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const FETCH_SCRIPT = path.join(ROOT, 'scripts', 'fetch-github-tutorials.mjs');
const TOKEN = process.env.GITHUB_TOKEN || '';
const DOMAIN_IDS = new Set(['basics', 'langs', 'algo', 'system', 'frontend', 'backend', 'data', 'ai', 'security', 'mobile', 'games', 'dist', 'matht', 'swe']);

const argv = process.argv.slice(2);
const argNum = (flag, dflt) => {
  const i = argv.indexOf(flag);
  const v = i >= 0 ? parseInt(argv[i + 1] || '', 10) : NaN;
  return Number.isInteger(v) && v >= 0 ? v : dflt;
};
const MIN_PENDING = argNum('--min', 2);      // pending 少于这个数才补
const MAX_CURATED = argNum('--max-add', 4);  // 每轮最多补几个精选
const MAX_DISCOVER = argNum('--discover', 2);// 每轮最多发现几个
const CURATED_ONLY = argv.includes('--curated-only');
const FORCE = argv.includes('--force');
const DRY = argv.includes('--dry');

function gh(pathname, accept = 'application/vnd.github+json') {
  return execFileSync('curl', ['-sL', '--max-time', '60', '-w', '\n%{http_code}',
    '-H', `Authorization: Bearer ${TOKEN}`, '-H', `Accept: ${accept}`,
    `https://api.github.com${pathname}`], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });
}
/** 返回 { code, body }；非 200 不抛错（404 是正常的候选淘汰路径） */
function ghJson(pathname) {
  const out = gh(pathname);
  const i = out.lastIndexOf('\n');
  return { code: Number(out.slice(i + 1).trim()) || 0, body: out.slice(0, i) };
}
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g;
const cjkCount = (s) => (String(s || '').match(CJK) || []).length;
// 描述截断成分类名时：先剥掉开头的 emoji / 装饰符号，再截断、清理尾部残缺的半个括号 / 悬空连接符
const cleanCategory = (s) => String(s || '')
  .replace(/^[\s\p{Extended_Pictographic}\p{So}•●★☆🎯→✅️]+/u, '')
  .replace(/\s+/g, ' ').trim()
  .slice(0, 16)
  .replace(/[（(【\[][^\)）\]】]*$/, '')
  .replace(/[\s,，、;；:：·\-—]+$/, '')
  .trim();
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);

// ── 已知来源：池子全部条目 + 收录脚本内置 SOURCES（按 repo 字符串提取，避免两处清单漂移）──
const pool = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
const candidates = pool.candidates || [];
const knownRepos = new Set(candidates.map((c) => String(c.repo || '').toLowerCase()));
const knownIds = new Set(candidates.map((c) => c.id));
const fetchSrc = fs.readFileSync(FETCH_SCRIPT, 'utf8');
for (const m of fetchSrc.matchAll(/repo:\s*'([^']+)'/g)) knownRepos.add(m[1].toLowerCase());

const pending = candidates.filter((c) => c.status === 'pending');
console.log(`pool: ${candidates.length} entries, ${pending.length} pending (min=${MIN_PENDING})`);
if (pending.length >= MIN_PENDING && !FORCE) {
  console.log('no refill needed');
  process.exit(0);
}

/** 校验一个仓库可收录：存在、未归档、非 fork、星数达标；返回 { ok, repo info } */
function validateRepo(repo, minStars) {
  const { code, body } = ghJson(`/repos/${repo}`);
  if (code !== 200) return { ok: false, why: `repos api ${code}` };
  const info = JSON.parse(body);
  if (info.archived) return { ok: false, why: 'archived' };
  if (info.fork) return { ok: false, why: 'fork' };
  if ((info.stargazers_count || 0) < minStars) return { ok: false, why: `stars ${info.stargazers_count} < ${minStars}` };
  // md 贫矿淘汰：仓库里可用的 md 正文不足（如只有 README/勘误表、内容全是 PDF 的补充材料仓库）
  // trees 查询失败也拒绝（fail-closed）：宁可这轮漏掉下轮重新发现，不让没核过的仓库入池
  const md = usableMdCount(repo, info.default_branch);
  if (md === -1) return { ok: false, why: 'trees api 失败' };
  if (md < 5) return { ok: false, why: `仅 ${md} 个可用 md` };
  return { ok: true, info };
}

/** 仓库里「可用正文」md 数（与收录脚本的 junk 过滤同规则）；失败重试一次，仍失败返回 -1 */
function usableMdCount(repo, branch) {
  for (let i = 0; i < 2; i++) {
    const { code, body } = ghJson(`/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
    if (code !== 200) { if (code === 404) return 0; continue; }
    try {
      const tree = JSON.parse(body).tree || [];
      return tree.filter((t) => t.type === 'blob' && /\.md$/i.test(t.path)
        && !/node_modules|\.github|\.claude|\.cursor|\.vscode|CHANGELOG|CODE_OF|LICENSE|_style|_coverpage|_404|ISSUE_TEMPLATE|PULL_REQUEST|README|_FR|french|errata|勘误|\.en\.md|(^|\/)index\.md$/i.test(t.path)).length;
    } catch { /* 再试 */ }
  }
  return -1;
}

/** README 是否中文内容：API 取 README（base64），数 CJK 字符 */
function readmeIsChinese(repo) {
  const { code, body } = ghJson(`/repos/${repo}/readme`);
  if (code !== 200) return false;
  try {
    const text = Buffer.from(JSON.parse(body).content || '', 'base64').toString('utf8').slice(0, 4000);
    return cjkCount(text) >= 40;
  } catch { return false; }
}

function makeEntry({ id, repo, branch, category, domain, tags }, note) {
  const entry = { id, repo, branch, category, domain, tags, status: 'pending', addedAt: new Date().toISOString(), note };
  if (!knownIds.has(id)) return entry;
  return { ...entry, id: `${id}-${slug(branch || 'x')}` };
}

const added = [], discovered = [], skipped = [], discoverSkipped = [];
let pendingNow = pending.length;

// ── 1) 精选清单 ──
for (const c of CURATED) {
  if (added.length >= MAX_CURATED) break;
  if (knownRepos.has(c.repo.toLowerCase())) { skipped.push(`${c.id}(已收录)`); continue; }
  if (!DOMAIN_IDS.has(c.domain)) { skipped.push(`${c.id}(非法 domain ${c.domain})`); continue; }
  const v = validateRepo(c.repo, 50);
  if (!v.ok) { skipped.push(`${c.id}(${v.why})`); continue; }
  const entry = makeEntry({ ...c, branch: v.info.default_branch }, 'curated');
  added.push({ ...entry, stars: v.info.stargazers_count });
  knownRepos.add(c.repo.toLowerCase());
  knownIds.add(entry.id);
}
console.log(`curated: +${added.length}${skipped.length ? `，跳过 ${skipped.join('、')}` : ''}`);
for (const e of added) console.log(`  + ${e.repo} → ${e.domain} / ${e.category}（★${e.stars}，branch ${e.branch}）`);

// ── 2) GitHub 搜索发现 ──
// 按域分桶的查询轮换：每天从不同桶开始，避免每轮都撞同一批仓库
const DISCOVER_MIN_STARS = 300;
const PUSHED_WITHIN = 545 * 24 * 60 * 60 * 1000; // 一年半内活跃
const BUCKETS = [
  { q: 'topic:chinese topic:tutorial', domain: 'basics' },
  { q: '中文 教程 in:name,description topic:frontend', domain: 'frontend' },
  { q: '中文 教程 in:name,description topic:python', domain: 'langs' },
  { q: '中文 in:name,description topic:deep-learning', domain: 'ai' },
  { q: '中文 in:name,description topic:algorithm', domain: 'algo' },
  { q: '中文 in:name,description topic:kubernetes', domain: 'system' },
  { q: '中文 in:name,description topic:mysql', domain: 'data' },
  { q: '中文 in:name,description topic:go topic:tutorial', domain: 'langs' },
  { q: '面试 in:name,description topic:interview', domain: 'swe' },
];
// 技术内容信号：名称/描述/topics 至少命中一个才算教程类仓库
//（「topic:tutorial + 中文」会捞到人生指南这类站外货，语言字段也救不了——byoungd/up 的 language 是 JavaScript）
const TECH_SIGNAL = new RegExp([
  'javascript|typescript|python|golang|go语言|rust|c\\+\\+|c语言|kotlin|swift|php|ruby|scala|dart|lua|sql|shell|bash|汇编|wasm',
  '前端|后端|全栈|web开发|浏览器|css|html|react|vue|angular|node|jquery',
  '数据库|mysql|postgres|redis|mongodb|大数据|hadoop|spark|flink|clickhouse|etcd',
  '机器学习|深度学习|强化学习|神经网络|人工智能|大模型|llm|nlp|transformer|pytorch|tensorflow|计算机视觉|扩散模型',
  '算法|数据结构|leetcode|剑指|题解|动态规划',
  '操作系统|linux|unix|计算机网络|tcp|http|docker|kubernetes|k8s|云原生|devops|运维|nginx|编译原理|编译器|计算机组成|嵌入式|单片机',
  '渗透|ctf|信息安全|网络安全|密码学|web安全|漏洞',
  '分布式|微服务|消息队列|kafka|rocketmq|zookeeper|高并发|架构|设计模式|重构|软件工程',
  'spring|jvm|tomcat|netty|grpc|rpc|api网关',
  'flutter|android|ios|swiftui|uniapp|小程序|微信开发',
  'unity|游戏开发|图形学|opengl|godot|cocos|threejs|渲染|shader|pbr|vulkan',
  '面试|校招|秋招|八股文|编程|程序设计|教程|实战|入门|手册|笔记|指南|学习路线|roadmap|文档|agent|智能体|语音识别|语音|爬虫|正则|解释器|提示词',
].join('|'), 'i');
// domain 细化：搜索桶只给个粗方向，按名称/描述/topics 的关键词落到 14 域里更准的那个
const DOMAIN_HINTS = [
  ['security', /渗透|ctf|信息安全|网络安全|密码学|web安全|漏洞|exploit|hacking/i],
  ['games', /unity|游戏开发|图形学|opengl|godot|cocos|threejs/i],
  ['mobile', /flutter|android|ios|swiftui|uniapp|小程序|微信开发|移动开发/i],
  ['ai', /机器学习|深度学习|强化学习|神经网络|人工智能|大模型|llm|nlp|transformer|pytorch|tensorflow|计算机视觉|扩散模型/i],
  ['data', /数据库|mysql|postgres|redis|mongodb|大数据|hadoop|spark|flink|clickhouse|sql/i],
  ['dist', /分布式|微服务|消息队列|kafka|rocketmq|zookeeper|高并发/i],
  ['algo', /算法|数据结构|leetcode|剑指|题解|动态规划/i],
  ['system', /操作系统|linux|unix|计算机网络|tcp|http|docker|kubernetes|k8s|云原生|devops|运维|nginx|编译原理|编译器|计算机组成|嵌入式|单片机/i],
  ['backend', /后端|spring|jvm|tomcat|netty|grpc|rpc|java/i],
  ['frontend', /前端|javascript|typescript|react|vue|angular|node|css|html|浏览器|web开发/i],
  ['langs', /python|golang|go语言|rust|c\+\+|c语言|php|ruby|scala|dart|lua|编程|程序设计|vim|emacs/i],
];
const refineDomain = (text, fallback) => {
  for (const [dom, re] of DOMAIN_HINTS) if (re.test(text)) return dom;
  return fallback;
};
// 非技术内容的负面信号：命中即拒（「人生进阶指南」这类靠「指南」扩词后会重新溜进来）
const LIFE_SIGNAL = /(人生|职场|创业|财富|爱情|情感|心理|成长|副业|搞钱)/;
let discoverAdded = 0;
if (!CURATED_ONLY && MAX_DISCOVER > 0) {
  // 按「小时」轮换起始桶（池每 20 分钟补一次，按天轮换会同一天反复撞同一批桶）
  const slot = Math.floor(Date.now() / 3600000) % BUCKETS.length;
  const order = BUCKETS.map((b, i) => BUCKETS[(i + slot) % BUCKETS.length]);
  // 同时翻页轮换：星数排序的前 30 名会耗尽，不同轮次下钻到第 2~3 页
  const pageNo = 1 + (slot % 3);
  for (const bucket of order) {
    if (discoverAdded >= MAX_DISCOVER) break;
    const { code, body } = ghJson(`/search/repositories?q=${encodeURIComponent(bucket.q)}&sort=stars&order=desc&per_page=30&page=${pageNo}`);
    if (code !== 200) { console.log(`discover: 查询失败 ${code}（${bucket.q}）`); continue; }
    let items = [];
    try { items = JSON.parse(body).items || []; } catch { /* 空 */ }
    for (const r of items) {
      if (discoverAdded >= MAX_DISCOVER) break;
      const full = r.full_name;
      if (!full || knownRepos.has(full.toLowerCase())) continue;
      if (r.archived || r.fork || (r.stargazers_count || 0) < DISCOVER_MIN_STARS) continue;
      if (Date.now() - new Date(r.pushed_at).getTime() > PUSHED_WITHIN) continue;
      const desc = String(r.description || '').trim();
      const signalText = [r.name, desc, (r.topics || []).join(' ')].join(' ');
      if (LIFE_SIGNAL.test(signalText)) { discoverSkipped.push(`${full}(非技术内容)`); continue; }
      if (!TECH_SIGNAL.test(signalText)) { discoverSkipped.push(`${full}(非技术内容)`); continue; }
      if (!readmeIsChinese(full)) { discoverSkipped.push(`${full}(README 非中文)`); continue; }
      // md 贫矿淘汰（发现路径同样要查：Awesome 清单 / 代码工程 / notebook 仓库都过不了这一关）
      const md = usableMdCount(full, r.default_branch);
      if (md === -1) { discoverSkipped.push(`${full}(trees api 失败)`); continue; }
      if (md < 5) { discoverSkipped.push(`${full}(仅 ${md} 个可用 md)`); continue; }
      const id = `auto-${slug(full)}`;
      if (knownIds.has(id)) continue;
      const entry = makeEntry({
        id,
        repo: full,
        branch: r.default_branch,
        category: cleanCategory(desc || r.name),
        domain: refineDomain(signalText, bucket.domain),
        tags: (r.topics || []).filter((t) => /^[\w\u4e00-\u9fff-]+$/.test(t)).slice(0, 3),
      }, 'auto-discovered');
      if (!entry.tags.length) entry.tags = ['教程'];
      added.push({ ...entry, stars: r.stargazers_count });
      discovered.push({ ...entry, stars: r.stargazers_count });
      knownRepos.add(full.toLowerCase());
      knownIds.add(id);
      discoverAdded += 1;
    }
  }
  console.log(`discover: +${discoverAdded}（每轮上限 ${MAX_DISCOVER}，起始桶 ${slot + 1}/${BUCKETS.length}，第 ${pageNo} 页）${discoverSkipped.length ? `，跳过 ${discoverSkipped.join('、')}` : '，无候选'}`);
  for (const e of discovered) console.log(`  ? ${e.repo} → ${e.domain} / ${e.category}（★${e.stars}，branch ${e.branch}）`);
}

if (!added.length) {
  console.log('nothing to add');
  process.exit(0);
}

// ── 写回池子（保持 1 空格缩进的现有格式）──
const starsByRepo = new Map(added.map((e) => [e.repo, e.stars]));
const clean = added.map(({ stars, ...e }) => e);
if (!DRY) {
  pool.updatedAt = new Date().toISOString();
  pool.candidates = [...candidates, ...clean];
  fs.writeFileSync(POOL_FILE, JSON.stringify(pool, null, 1) + '\n');
  console.log(`pool saved: ${clean.length} added → pending ${pendingNow + clean.length}`);
} else {
  console.log(`dry run: 未写回（将加 ${clean.length} 条）`);
}
