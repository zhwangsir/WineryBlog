// 一次性修复：早期收录批次里被截坏的摘要（「<u回溯…</u是一种」这类半个标签）用现有正文重新生成
// 用法：node scripts/repair-excerpts.mjs [--dry]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { excerptFrom } from './lib/md-sanitize.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsPath = path.join(ROOT, 'server', 'data', 'posts.json');
const tutPath = path.join(ROOT, 'server', 'data', 'tutorials.json');
const DRY = process.argv.includes('--dry');

const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
const tut = JSON.parse(fs.readFileSync(tutPath, 'utf8'));
const tutById = new Map(tut.tutorials.map((t) => [t.id, t]));

let fixed = 0;
for (const p of posts) {
  const bad = typeof p.excerpt !== 'string' || /<\/?[a-zA-Z][a-zA-Z0-9]*(?=[\u4e00-\u9fa5a-zA-Z（(])|<\/?[a-zA-Z][^<>\n]*$/.test(p.excerpt) || /<[a-zA-Z/]/.test(p.excerpt);
  if (!bad || !p.content || !p.source) continue;
  const next = excerptFrom(p.content);
  if (!next || next === p.excerpt) continue;
  if (DRY) { console.log(`${p.id}: ${p.excerpt.slice(0, 50)} → ${next.slice(0, 50)}`); }
  else {
    p.excerpt = next;
    const t = tutById.get(p.id);
    if (t) t.summary = next.slice(0, 60);
  }
  fixed++;
}
console.log(`${DRY ? 'would fix' : 'fixed'} excerpts: ${fixed} 篇`);

// 目录里的 href 一律带 /post/ 前缀（早期收录批次写的是裸 id，文章页上下篇按它跳转会跳错）
let hrefFixed = 0;
for (const t of tut.tutorials) {
  if (!/^\/post\//.test(String(t.href || ''))) {
    if (!DRY) t.href = `/post/${t.id}`;
    hrefFixed++;
  }
}
console.log(`${DRY ? 'would fix' : 'fixed'} hrefs: ${hrefFixed} 条`);
if (!DRY && (fixed || hrefFixed)) {
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
  fs.writeFileSync(tutPath, JSON.stringify(tut, null, 2));
}
