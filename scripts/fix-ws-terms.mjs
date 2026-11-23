// WebSocket 协议术语行修复：ws:// wss:// http:// https:// 作为术语提及，全部反引号包裹
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/posts.json'), 'utf8'));
let fixed = 0;
for (const p of posts) {
  if (!p.id.startsWith('g-jg-interview')) continue;
  const lines = String(p.content).split('\n');
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    if (/(ws|wss|https?):\/\//.test(lines[i]) && !lines[i].trimStart().startsWith('```')) {
      const next = lines[i].replace(/(^|[^`])\b((?:ws|wss|https?):\/\/[^\s，。；、））」」'"]{2,})/g, '$1`$2`');
      if (next !== lines[i]) { lines[i] = next; changed = true; }
    }
  }
  if (changed) { p.content = lines.join('\n'); fixed++; }
}
fs.writeFileSync(path.join(ROOT, 'server/data/posts.json'), JSON.stringify(posts, null, 1));
console.log(`fixed ${fixed} posts`);
