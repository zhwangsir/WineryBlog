import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const pool = JSON.parse(fs.readFileSync(f, 'utf8'));
const have = new Set(pool.candidates.map(c => c.id));
const add = [
  {
    id: 'dunwublog3', repo: 'dunwu/blog', branch: 'master',
    category: '极客时间笔记 III（网络与系统）', domain: 'system', tags: ['网络', '操作系统'],
    picks: [
      { dir: 'source/_posts/13.网络', keywords: ['.md'], max: 10, recursive: true },
      { dir: 'source/_posts/14.操作系统', keywords: ['.md'], max: 10, recursive: true },
    ],
    status: 'pending'
  },
  {
    id: 'dunwublog4', repo: 'dunwu/blog', branch: 'master',
    category: '极客时间笔记 IV（数据库与算法）', domain: 'data', tags: ['数据库', '算法'],
    picks: [
      { dir: 'source/_posts/12.数据库', keywords: ['.md'], max: 8, recursive: true },
      { dir: 'source/_posts/16.大数据', keywords: ['.md'], max: 6, recursive: true },
      { dir: 'source/_posts/11.算法', keywords: ['.md'], max: 6, recursive: true },
    ],
    status: 'pending'
  },
  {
    id: 'dunwublog5', repo: 'dunwu/blog', branch: 'master',
    category: '极客时间笔记 V（设计与工程）', domain: 'backend', tags: ['设计', 'DevOps', '软件工程'],
    picks: [
      { dir: 'source/_posts/03.设计', keywords: ['.md'], max: 8, recursive: true },
      { dir: 'source/_posts/04.DevOps', keywords: ['.md'], max: 5, recursive: true },
      { dir: 'source/_posts/21.软件工程', keywords: ['.md'], max: 2, recursive: true },
    ],
    status: 'pending'
  },
  {
    id: 'javaguide3', repo: 'Snailclimb/JavaGuide', branch: 'main',
    category: 'JavaGuide III（JVM 深度）', domain: 'backend', tags: ['Java', 'JVM'],
    picks: [{ dir: 'docs/java/jvm', keywords: ['.md'], max: 8, recursive: true, skip: 3 }],
    status: 'pending'
  },
];
let added = 0;
for (const c of add) if (!have.has(c.id)) { pool.candidates.push(c); added++; }
fs.writeFileSync(f, JSON.stringify(pool, null, 1));
console.log(`+${added} (pool total ${pool.candidates.length})`);
