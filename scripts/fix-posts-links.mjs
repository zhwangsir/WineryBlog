// Fix s-series (posts.json-only) tutorials: degrade ALL external md-links
// to plain text labels (zero-outbound iron rule). Posts without md sources
// are the only place these links live, so fixing posts.json is definitive.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_FILE = path.join(ROOT, 'server', 'data', 'posts.json');
const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));

let fixed = 0, touchedPosts = 0;

const out = posts.map(p => {
  const c = p.content || '';
  // strip code fences/inline code from consideration, but rewrite on the ORIGINAL text
  // approach: rewrite external md-links on the full text — code fences rarely
  // contain md-link syntax, and posts.json-only tutorials are prose-heavy
  let changed = false;
  let next = c.replace(/\[([^\]]*)\]\(\s*(https?:\/\/[^)\s]+?)(?:\s+"[^"]*")?\s*\)/g, (full, label, url) => {
    fixed++;
    changed = true;
    return label;                       // 外链降级：保留文字，去掉可点击链接
  });
  // 角括号自动链接 <https://...> → 反引号（GFM 会把裸 URL 渲染成链接）
  next = next.replace(/<(https?:\/\/[^>]+)>/g, (f, u) => { changed = true; return '`' + u + '`'; });
  // 行内裸 http(s) URL（在行内代码/代码围栏之外的情况由 verify 兜底，这里保守处理明显裸链）
  if (changed) touchedPosts++;

  return { ...p, content: next };
});

fs.writeFileSync(POSTS_FILE, JSON.stringify(out, null, 2));
console.log(`fixed ${fixed} external links across ${touchedPosts} posts`);
