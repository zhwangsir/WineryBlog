// 填充候选池第二批：5 个核实过的高星教程仓库
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const pool = JSON.parse(fs.readFileSync(f, 'utf8'));
const have = new Set(pool.candidates.map(c => c.id));
const add = [
  {
    id: 'interviewguide', repo: 'forthespada/InterviewGuide', branch: 'main',
    category: '阿秀面试笔记', domain: 'basics', tags: ['面试', 'C++', '计算机基础'],
    picks: [{ dir: 'doc/basics', keywords: ['.md'], max: 14, recursive: true }],
    status: 'pending'
  },
  {
    id: 'huihut-interview', repo: 'huihut/interview', branch: 'master',
    category: 'C/C++ 面试基础', domain: 'langs', tags: ['C++', '面试'],
    picks: [{ dir: '', keywords: ['.md'], max: 16, recursive: true }],
    status: 'pending'
  },
  {
    id: 'interview-ref', repo: '0voice/interview_internal_reference', branch: 'master',
    category: '大厂面试内部参考', domain: 'basics', tags: ['面试', '大厂'],
    picks: [{ dir: '', keywords: ['.md'], max: 20, recursive: true }],
    status: 'pending'
  },
  {
    id: 'docstyle', repo: 'ruanyf/document-style-guide', branch: 'master',
    category: '中文文档排版指南', domain: 'basics', tags: ['文档', '写作规范'],
    picks: [{ dir: 'docs', keywords: ['.md'], max: 8, recursive: true }],
    status: 'pending'
  },
];
let added = 0;
for (const c of add) if (!have.has(c.id)) { pool.candidates.push(c); added++; }
pool.updatedAt = new Date().toISOString();
fs.writeFileSync(f, JSON.stringify(pool, null, 1));
const pend = pool.candidates.filter(c => c.status === 'pending');
console.log(`+${added} candidates (pool: ${pool.candidates.length}, pending: ${pend.map(c => c.id).join(', ')})`);
