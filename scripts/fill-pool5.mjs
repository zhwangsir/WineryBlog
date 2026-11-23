import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const T = process.env.GITHUB_TOKEN || '';
function defBranch(repo) {
  try {
    const r = JSON.parse(execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
      `https://api.github.com/repos/${repo}`], { maxBuffer: 8 * 1024 * 1024, encoding: 'utf8' }));
    return r.default_branch;
  } catch { return 'main'; }
}
const pool = JSON.parse(fs.readFileSync(f, 'utf8'));
const have = new Set(pool.candidates.map(c => c.id));
const vueBranch = defBranch('vuejs-translations/zh-docs');
const add = [
  {
    id: 'vuezh2', repo: 'vuejs-translations/zh-docs', branch: vueBranch,
    category: 'Vue 3 官方中文文档', domain: 'frontend', tags: ['Vue', '前端', '官方文档'],
    picks: [{ dir: 'src/guide', keywords: ['.md'], max: 14, recursive: true }],
    status: 'pending'
  },
  {
    id: 'dunwublog2', repo: 'dunwu/blog', branch: 'master',
    category: '极客时间笔记 II', domain: 'backend', tags: ['分布式', '中间件', '架构'],
    picks: [{ dir: 'source/_posts', keywords: ['分布式', '中间件', '微服务', 'Docker', 'Kubernetes', '设计模式'], max: 16, recursive: true }],
    status: 'pending'
  },
  {
    id: 'advjava3', repo: 'doocs/advanced-java', branch: 'main',
    category: '后端进阶 III', domain: 'backend', tags: ['Zookeeper', '高并发'],
    picks: [{ dir: 'docs/distributed-system', keywords: ['zookeeper', 'dubbo-operating', 'why-dubbo', 'rpc-design'], max: 7, recursive: true }],
    status: 'pending'
  },
  {
    id: 'javaguide2', repo: 'Snailclimb/JavaGuide', branch: 'main',
    category: 'JavaGuide II', domain: 'backend', tags: ['Java', '集合源码'],
    picks: [
      { dir: 'docs/java/collection', keywords: ['source-code'], max: 5, recursive: true },
      { dir: 'docs/java/basis', keywords: ['proxy', 'reflection', 'serialization', 'spi', 'unsafe'], max: 5, recursive: true },
    ],
    status: 'pending'
  },
];
let added = 0;
for (const c of add) if (!have.has(c.id)) { pool.candidates.push(c); added++; }
fs.writeFileSync(f, JSON.stringify(pool, null, 1));
console.log(`+${added} (vuezh branch: ${vueBranch}, pool total ${pool.candidates.length})`);
