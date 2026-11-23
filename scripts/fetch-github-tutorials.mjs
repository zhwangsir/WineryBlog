// GitHub 教程大范围收录管线：拉取高质量开源教程仓库的 md → 转换为零外跳本地格式 → 注入 posts.json + tutorials.json
// 用法：node scripts/fetch-github-tutorials.mjs [--only sid1,sid2] [--dry]
// 规则：
//   - trees API 一次取全树 → 按 picks 规则（目录/关键词/上限）筛选 md
//   - raw.githubusercontent 下载内容
//   - 零外跳转换：剥离图片与 HTML、链接降级为纯文本、裸 URL 反引号包裹、mermaid 块删除
//   - 幂等：id 已存在跳过（--refresh 可覆盖更新）
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'server', 'data');
const TOKEN = process.env.GITHUB_TOKEN || '';   // 凭据走环境变量，不入仓库
const argv = process.argv.slice(2);
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1].split(',') : null;
const DRY = argv.includes('--dry');

function gh(path, accept = 'application/vnd.github+json') {
  return execFileSync('curl', ['-sL', '--max-time', '60',
    '-H', `Authorization: Bearer ${TOKEN}`, '-H', `Accept: ${accept}`,
    `https://api.github.com${path}`], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });
}
function raw(repo, branch, file) {
  const url = encodeURI(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`);
  return execFileSync('curl', ['-sL', '--max-time', '60', url],
    { maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' });
}

// ─── 零外跳转换（共享模块） ───
import { sanitize } from './lib/md-sanitize.mjs';

function titleFrom(md, fallback) {
  const m = md.match(/^#\s+(.+)$/m);
  return (m ? m[1] : fallback).replace(/[*_`]/g, '').trim().slice(0, 80);
}

// ─── 仓库收录策划（14 域映射）───
const SOURCES = [
  {
    id: 'helloalgo', repo: 'krahets/hello-algo', branch: 'main',
    category: 'Hello 算法', domain: 'algo', tags: ['算法', '数据结构', '图解'],
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
      { dir: 'notes', max: 26, sortNumeric: true },
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
      { dir: 'docs/chapter9', files: ['chapter9.md'] },
      { dir: 'docs/chapter12', files: ['chapter12.md'] },
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
];

// ─── 数据加载 ───
const postsPath = path.join(DATA, 'posts.json');
const tutPath = path.join(DATA, 'tutorials.json');
const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
const tut = JSON.parse(fs.readFileSync(tutPath, 'utf8'));
const existingIds = new Set(posts.map(p => p.id));
const today = '2026-11-23';

function words(text) {
  const c = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const e = (text.match(/[a-zA-Z]+/g) || []).length;
  return c + e;
}

let addedTotal = 0, failedRepos = [];
const report = [];

for (const src of SOURCES) {
  if (only && !only.includes(src.id)) continue;
  try {
    // 全树一次拿
    const treeRaw = gh(`/repos/${src.repo}/git/trees/${src.branch}?recursive=1`);
    const tree = JSON.parse(treeRaw);
    if (!tree.tree) throw new Error('tree api failed: ' + treeRaw.slice(0, 120));
    const allMd = tree.tree.filter(t =>
      t.type === 'blob' && /\.md$/i.test(t.path) && !/node_modules|\.github|CHANGELOG|CODE_OF|_style|_coverpage|_404|ISSUE_TEMPLATE|PULL_REQUEST/i.test(t.path)
    );

    // 按 picks 选文件
    const chosen = new Set();
    for (const pick of src.picks) {
      const dirPrefix = pick.dir ? (pick.dir + '/') : '';
      let candidates = allMd
        .map(t => t.path)
        .filter(p => p.startsWith(dirPrefix) && !p.endsWith('README.md'));
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
      // 排序取前 max（路径稳定排序；sortNumeric 按文件名前导数字排序，如剑指题解编号）
      if (pick.sortNumeric) {
        const num = (p) => parseFloat(path.basename(p).match(/^(\d+)/)?.[1] ?? '9999');
        candidates.sort((a, b) => num(a) - num(b));
      } else {
        candidates.sort();
      }
      for (const p of candidates.slice(0, pick.max || 5)) chosen.add(p);
    }

    let addedRepo = 0, idx = 0;
    for (const file of [...chosen].sort()) {
      idx++;
      const id = `g-${src.id}-${idx}`;
      if (existingIds.has(id)) { continue; }
      let content;
      try { content = raw(src.repo, src.branch, file); }
      catch (e) { report.push(`skip ${file}: ${e.message.slice(0, 50)}`); continue; }
      if (!content || content.length < 800) { report.push(`skip ${file}: too short/missing`); continue; }
      if (/^\s*<!DOCTYPE|<html/i.test(content)) { report.push(`skip ${file}: html page`); continue; }

      const clean = sanitize(content);
      if (clean.length < 500) { report.push(`skip ${file}: post-sanitize too short`); continue; }
      const title = titleFrom(clean, path.basename(file, '.md'));
      const excerpt = clean
        .replace(/^#+\s+.*$/gm, '')
        .replace(/[`>#*\-\[\]]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 90);
      const minutes = Math.max(5, Math.round(words(clean) / 400));

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

      // tutorials.json 同步（14 域归位）
      tut.tutorials.push({
        id, kind: 'collection', title, summary: excerpt.slice(0, 60),
        domain: src.domain, category: src.category,
        difficulty: '进阶', minutes,
        tags: [...src.tags], prereqs: [], href: id,
      });
      const dom = tut.domains.find(d => d.id === src.domain);
      if (dom) dom.count = (dom.count || 0) + 1;
      existingIds.add(id);
      addedRepo++;
    }
    addedTotal += addedRepo;
    report.push(`✔ ${src.id}: +${addedRepo}/${chosen.size}（${src.category}）`);
  } catch (e) {
    failedRepos.push(src.id);
    report.push(`✘ ${src.id}: ${e.message.slice(0, 100)}`);
  }
}

if (!DRY) {
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 1));
  fs.writeFileSync(tutPath, JSON.stringify(tut, null, 1));
}

console.log(`\n=== 收录报告（${DRY ? 'DRY' : '写入'}）===`);
report.forEach(r => console.log(r));
console.log(`\n新增: ${addedTotal} 篇  失败仓库: ${failedRepos.join(',') || '无'}  posts 总量: ${posts.length}`);
