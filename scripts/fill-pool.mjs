// 填充候选池：6 个核实过的高星教程仓库
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const pool = JSON.parse(fs.readFileSync(f, 'utf8'));
const have = new Set(pool.candidates.map(c => c.id));
const add = [
  {
    id: 'jg-interview', repo: 'Snailclimb/JavaGuide-Interview', branch: 'master',
    category: 'JavaGuide 面试突击', domain: 'backend', tags: ['Java', '面试'],
    picks: [{ dir: '', keywords: ['.md'], max: 33, recursive: true }],
    status: 'pending'
  },
  {
    id: 'coding-interview', repo: 'doocs/coding-interview', branch: 'main',
    category: '大厂算法面试', domain: 'algo', tags: ['算法', '面试'],
    picks: [{ dir: 'docs', keywords: ['.md'], max: 10, recursive: true }],
    status: 'pending'
  },
  {
    id: 'ailearning', repo: 'apachecn/AiLearning', branch: 'master',
    category: 'AiLearning', domain: 'ai', tags: ['机器学习', 'AI 经典'],
    picks: [{ dir: 'docs/ml', keywords: ['.md'], max: 8, recursive: true }],
    status: 'pending'
  },
  {
    id: 'lcgo', repo: 'halfrost/LeetCode-Go', branch: 'master',
    category: 'LeetCode-Go 题解', domain: 'algo', tags: ['LeetCode', 'Go', '算法'],
    picks: [{ dir: 'LeetCode', keywords: ['README.md'], max: 14, recursive: true }],
    status: 'pending'
  },
  {
    id: 'dbtutorial', repo: 'dunwu/db-tutorial', branch: 'master',
    category: '数据库教程', domain: 'data', tags: ['MySQL', 'Redis', '数据库'],
    picks: [
      { dir: 'docs/mysql', keywords: ['.md'], max: 8, recursive: true },
      { dir: 'docs/redis', keywords: ['.md'], max: 6, recursive: true },
    ],
    status: 'pending'
  },
  {
    id: 'javafamily', repo: 'AobingJava/JavaFamily', branch: 'master',
    category: 'JavaFamily 图解', domain: 'backend', tags: ['Java', '网络', 'MySQL'],
    picks: [
      { dir: 'docs/.netty', keywords: ['.md'], max: 4, recursive: true },
      { dir: 'docs/mysql', keywords: ['.md'], max: 4, recursive: true },
      { dir: 'docs/jvm', keywords: ['.md'], max: 3, recursive: true },
      { dir: 'docs/concurrent', keywords: ['.md'], max: 3, recursive: true },
    ],
    status: 'pending'
  },
];
let added = 0;
for (const c of add) if (!have.has(c.id)) { pool.candidates.push(c); added++; }
pool.updatedAt = new Date().toISOString();
fs.writeFileSync(f, JSON.stringify(pool, null, 1));
const pend = pool.candidates.filter(c => c.status === 'pending');
console.log(`+${added} candidates (pool: ${pool.candidates.length}, pending: ${pend.map(c => c.id).join(', ')})`);
