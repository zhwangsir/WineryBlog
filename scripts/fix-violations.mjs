// 违规行修复器：复算 verify 逻辑定位违规行，对行内 URL 加行内代码包裹，循环至归零
// 用法：node scripts/fix-violations.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsPath = path.join(ROOT, 'server', 'data', 'posts.json');

function findViolations(posts) {
  const v = [];
  for (const p of posts) {
    let inFence = false;
    const lines = String(p.content || '').split('\n');
    lines.forEach((l, i) => {
      if (l.trimStart().startsWith('```')) { inFence = !inFence; return; }
      if (inFence) return;
      if (/^\s{4,}\S/.test(l)) return;   // 缩进代码块豁免
      const s = l.replace(/`[^`]+`/g, '').replace(/\[[^\]]*\]\([^)]*\)/g, '');
      if (/https?:\/\//.test(s)) v.push({ p, i, l });
      for (const m of l.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)) {
        v.push({ p, i, l, link: m[1] });
      }
    });
  }
  return v;
}

const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
let rounds = 0;
for (let round = 1; round <= 4; round++) {
  const v = findViolations(posts);
  if (!v.length) { console.log(`round ${round}: clean`); break; }
  rounds = round;
  // 按 post 分组，逐行修复（行内全部 URL 加反引号，含引号内形态）
  const byPost = new Map();
  for (const item of v) {
    const key = item.p.id;
    if (!byPost.has(key)) byPost.set(key, { p: item.p, lines: new Set() });
    byPost.get(key).lines.add(item.i);
  }
  for (const { p, lines } of byPost.values()) {
    const arr = String(p.content).split('\n');
    for (const li of lines) {
      // 清除行内已有成对反引号包裹（避免嵌套错位），再统一包裹所有 URL
      let l = arr[li].replace(/`([^`]+)`/g, '$1');
      l = l.replace(/https?:\/\/[^\s'"`<>\)）]+/g, (m) => '`' + m.replace(/`+$/, '') + '`');
      arr[li] = l;
    }
    p.content = arr.join('\n');
  }
  console.log(`round ${round}: fixed lines in ${byPost.size} posts`);
}
fs.writeFileSync(postsPath, JSON.stringify(posts, null, 1));
console.log(`done (${rounds} rounds)`);
