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
    if (!/WebSocket 使用/.test(lines[i])) continue;
    // 无条件包裹行内所有协议前缀 token（术语提及场景，URL 已无实际链接意义）
    const next = lines[i].replace(/(wss?|https?):\/\//g, '`$1://`');
    if (next !== lines[i]) { lines[i] = next; changed = true; }
  }
  if (changed) { p.content = lines.join('\n'); fixed++; }
}
fs.writeFileSync(path.join(ROOT, 'server/data/posts.json'), JSON.stringify(posts, null, 1));
console.log(`fixed ${fixed} posts`);
