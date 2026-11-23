import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/posts.json'), 'utf8'));
let removed = 0;
for (const p of posts) {
  if (!p.id.startsWith('g-jg-interview')) continue;
  const lines = String(p.content).split('\n');
  const before = lines.length;
  const kept = lines.filter(l => !/WebSocket 使用/.test(l));
  if (kept.length !== before) { p.content = kept.join('\n'); removed++; }
}
fs.writeFileSync(path.join(ROOT, 'server/data/posts.json'), JSON.stringify(posts, null, 1));
console.log(`removed lines in ${removed} posts`);
