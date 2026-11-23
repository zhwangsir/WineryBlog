import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const pool = JSON.parse(fs.readFileSync(f, 'utf8'));
const have = new Set(pool.candidates.map(c => c.id));
const add = [
  {
    id: 'rustadv', repo: 'sunface/rust-course', branch: 'main',
    category: 'Rust 进阶篇', domain: 'langs', tags: ['Rust', '进阶'],
    picks: [{ dir: 'src/advance', keywords: ['async', 'box', 'rc', 'arc', 'deref', 'channel', 'mutex', 'move', 'smart'], max: 10, recursive: true }],
    status: 'pending'
  },
  {
    id: 'lcgo2', repo: 'halfrost/LeetCode-Go', branch: 'master',
    category: 'LeetCode-Go 精选', domain: 'algo', tags: ['LeetCode', 'Go'],
    picks: [{ dir: 'LeetCode', keywords: ['README.md'], max: 14, recursive: true }],
    status: 'pending'
  },
  {
    id: 'ctfwiki2', repo: 'ctf-wiki/ctf-wiki', branch: 'master',
    category: 'CTF Wiki 深层', domain: 'security', tags: ['CTF', '安全'],
    picks: [{ dir: 'docs/zh/docs', keywords: ['crypto/', 'pwn/', 'web/', 'misc/'], max: 14, recursive: true }],
    status: 'pending'
  },
];
let added = 0;
for (const c of add) if (!have.has(c.id)) { pool.candidates.push(c); added++; }
pool.updatedAt = new Date().toISOString();
fs.writeFileSync(f, JSON.stringify(pool, null, 1));
console.log(`+${added} (pool total ${pool.candidates.length})`);
