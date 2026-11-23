// 重洗已入库的 g- 系列文章（应用增强版 sanitize）
// 用法：node scripts/fix-g-posts.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitize } from './lib/md-sanitize.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = path.join(ROOT, 'server', 'data', 'posts.json');
const posts = JSON.parse(fs.readFileSync(POSTS, 'utf8'));
let fixed = 0;
for (const p of posts) {
  if (!p.id.startsWith('g-') || !p.content) continue;
  const next = sanitize(p.content);
  if (next !== p.content) { p.content = next; fixed++; }
}
fs.writeFileSync(POSTS, JSON.stringify(posts, null, 1));
console.log(`re-sanitized ${fixed} g- posts (total ${posts.length})`);
