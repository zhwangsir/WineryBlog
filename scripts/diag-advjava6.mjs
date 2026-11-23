// 精确诊断单篇文章的围栏状态
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'data', 'posts.json'), 'utf8'));
const target = process.argv[2] || 'g-advjava-6';
const p = posts.find(x => x.id === target);
const lines = String(p.content).split('\n');
let inFence = false;
const fenceLines = [];
lines.forEach((l, i) => {
  if (l.trimStart().startsWith('```')) {
    fenceLines.push(`${i + 1}: [${l.trim().slice(0, 30)}] → inFence 变为 ${!inFence}`);
    inFence = !inFence;
  }
});
console.log(`== ${target} 围栏行（共 ${fenceLines.length}）==`);
fenceLines.forEach(f => console.log('  ' + f));
console.log('行 121 状态:', (() => {
  let f = false;
  for (let i = 0; i < 120; i++) if (lines[i].trimStart().startsWith('```')) f = !f;
  return f ? 'fence 内' : 'fence 外';
})());
console.log('行 121 原文:', lines[120]);
