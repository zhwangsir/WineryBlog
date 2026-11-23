import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const pool = JSON.parse(fs.readFileSync(f, 'utf8'));
const have = new Set(pool.candidates.map(c => c.id));
const add = [
  {
    id: 'reactzh', repo: 'reactjs/zh-hans.react.dev', branch: 'main',
    category: 'React 官方中文文档', domain: 'frontend', tags: ['React', '前端', '官方文档'],
    picks: [
      { dir: 'src/content/learn', keywords: ['.md'], max: 12, recursive: true },
      { dir: 'src/content/reference/react', keywords: ['.md'], max: 8, recursive: true },
    ],
    status: 'pending'
  },
  {
    id: 'dunwublog', repo: 'dunwu/blog', branch: 'master',
    category: '极客时间笔记精选', domain: 'backend', tags: ['Java', 'JVM', 'Spring', '架构'],
    picks: [
      { dir: 'source/_posts/00.笔记/01.Java', keywords: ['.md'], max: 7, recursive: true },
      { dir: 'source/_posts/00.笔记/03.设计', keywords: ['.md'], max: 3, recursive: true },
      { dir: 'source/_posts/00.笔记/02.存储', keywords: ['.md'], max: 3, recursive: true },
      { dir: 'source/_posts/00.笔记/04.网络', keywords: ['.md'], max: 3, recursive: true },
    ],
    status: 'pending'
  },
];
let added = 0;
for (const c of add) if (!have.has(c.id)) { pool.candidates.push(c); added++; }
fs.writeFileSync(f, JSON.stringify(pool, null, 1));
console.log(`+${added} (pool total ${pool.candidates.length})`);
