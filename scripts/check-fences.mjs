// 检查所有 g- 文章的围栏配对状态 + verify 同款状态机复算
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'data', 'posts.json'), 'utf8'));

const gPosts = posts.filter(p => p.id.startsWith('g-'));
const broken = [];
for (const p of gPosts) {
  let inFence = false;
  const lines = String(p.content).split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('```')) { inFence = !inFence; if (!inFence === false && i === lines.length - 1) broken.push(`${p.id}: ends inside fence`); }
  }
  if (inFence) broken.push(`${p.id}: unclosed fence (last fence at line ${lines.length})`);
}

// verify 同款跨文章状态机复算（找状态错位点）
let inFence = false;
const leak = [];
posts.forEach((p, pi) => {
  const isG = p.id.startsWith('g-');
  String(p.content || '').split('\n').forEach((l, li) => {
    if (isG) return;  // 只诊断非 g- 文章与 g- 的交界
    if (l.trimStart().startsWith('```')) inFence = !inFence;
    if (pi === posts.length - 1 && inFence) leak.push(`ends in fence at end of corpus`);
  });
});
// 找第一个 fence 状态在 g- 文章开始时为 true 的位置
let st = false;
let leakPoint = null;
for (let pi = 0; pi < posts.length; pi++) {
  const p = posts[pi];
  const was = st;
  String(p.content || '').split('\n').forEach(l => { if (l.trimStart().startsWith('```')) st = !st; });
  if (!p.id.startsWith('g-') && was !== st) leakPoint = `state flipped across non-g post: ${p.id} (idx ${pi})`;
}
console.log('broken g- fences:', broken.length);
broken.slice(0, 10).forEach(b => console.log('  ' + b));
console.log('non-g leak point:', leakPoint || 'none');
console.log('final corpus fence state:', st ? 'INSIDE' : 'outside');
