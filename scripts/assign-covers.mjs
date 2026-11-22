// 文章封面固定分配：把图床图片稳定绑定到文章 cover 字段
// 规则：图床全量图片 URL 按 hash 排序（稳定），对无 cover 的文章按 id FNV 哈希取模分配
// 已有 cover 的文章不覆盖——一旦分配即固定，重跑只补空缺
// 用法：node scripts/assign-covers.mjs [--clear]   （--clear 清空全部封面重新分配）
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY = path.join(ROOT, 'server', 'data', 'gallery');
const POSTS_FILE = path.join(ROOT, 'server', 'data', 'posts.json');
const CLEAR = process.argv.includes('--clear');

function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const meta = JSON.parse(fs.readFileSync(path.join(GALLERY, 'meta.json'), 'utf8'));
// 稳定排序的图床图片 URL 池（不含 uploads——上传媒体是配置素材不是壁纸）
const urls = Object.entries(meta.images || {})
  .filter(([, info]) => info.category && info.category !== 'uploads')
  .map(([hash, info]) => `/images/${info.category}/${hash}${info.ext}`)
  .sort();

if (urls.length === 0) {
  console.log('gallery is empty: nothing to assign');
  process.exit(1);
}

const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
let assigned = 0;
let kept = 0;
let cleared = 0;

for (const p of posts) {
  if (CLEAR) {
    delete p.cover;
    cleared++;
  }
  if (p.cover) {
    kept++;
    continue;
  }
  p.cover = urls[fnv1a(String(p.id)) % urls.length];
  assigned++;
}

fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
console.log(`pool=${urls.length} assigned=${assigned} kept=${kept}${CLEAR ? ` cleared=${cleared}` : ''} total=${posts.length}`);
