import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const pool = JSON.parse(fs.readFileSync(f, 'utf8'));
const have = new Set(pool.candidates.map(c => c.id));
const add = [
  {
    id: 'vuezhcn', repo: 'vuejs-translations/docs-zh-cn', branch: 'main',
    category: 'Vue 3 官方中文文档', domain: 'frontend', tags: ['Vue', '前端', '官方文档'],
    picks: [
      { dir: 'src/guide', keywords: ['.md'], max: 12, recursive: true },
      { dir: 'src/api', keywords: ['.md'], max: 8, recursive: true },
    ],
    status: 'pending'
  },
  {
    id: 'dunwujava', repo: 'dunwu/blog', branch: 'master',
    category: 'Java 核心笔记', domain: 'backend', tags: ['Java', '基础'],
    picks: [{ dir: 'source/_posts/01.Java/01.JavaCore', keywords: ['.md'], max: 14, recursive: true }],
    status: 'pending'
  },
  {
    id: 'dunwunotes2', repo: 'dunwu/blog', branch: 'master',
    category: '极客时间笔记 II', domain: 'backend', tags: ['架构', '运维', 'Java'],
    picks: [{ dir: 'source/_posts/00.笔记', keywords: ['.md'], max: 44, recursive: true, skip: 8 }],
    status: 'pending'
  },
];
let added = 0;
for (const c of add) if (!have.has(c.id)) { pool.candidates.push(c); added++; }
fs.writeFileSync(f, JSON.stringify(pool, null, 1));
console.log(`+${added} (pool total ${pool.candidates.length})`);
