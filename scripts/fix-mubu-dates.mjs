// 1) 抹除 2 处幕布残留（改中性表述）
// 2) 全站文章日期重排：2021-01 → 2026-11 均匀分布
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_FILE = path.join(ROOT, 'server', 'data', 'posts.json');
const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));

// ---- ① s13: Intent 示例里的 mubu.com → 中性演示 URL ----
{
  const p = posts.find(x => x.id === 's13_android_components');
  if (p) {
    p.content = p.content.replace(
      'Intent(Intent.ACTION_VIEW, Uri.parse("https://mubu.com"))',
      'Intent(Intent.ACTION_VIEW, Uri.parse("https://developer.android.com/guide"))'
    );
    console.log('s13 intent url fixed');
  }
}

// ---- ② t09: 幕布备份表述 → 通用笔记备份表述 ----
{
  const p = posts.find(x => x.id === 't09_projects');
  if (p) {
    p.content = p.content.replace(
      /（本站就是案例：从幕布备份需求长成完整知识库）/g,
      '（本站就是案例：从一份个人笔记备份需求长成完整知识库）'
    );
    console.log('t09 phrase fixed');
  }
}

// ---- ③ 日期重排：2021-01-04 → 2026-11-20 均匀分布（保持内容叙事顺序）----
const START = new Date('2021-01-04T00:00:00Z').getTime();
const END = new Date('2026-11-20T00:00:00Z').getTime();
const N = posts.length;
const span = END - START;

const fmt = d => d.toISOString().slice(0, 10);
posts.forEach((p, i) => {
  const offset = Math.round((i * span) / (N - 1));
  p.date = fmt(new Date(START + offset));
});

fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));

// 汇总
const counts = {};
for (const p of posts) { const y = p.date.slice(0, 4); counts[y] = (counts[y] || 0) + 1; }
console.log('dates redistributed:', JSON.stringify(counts));

// 幕布残留复查
let remain = 0;
for (const p of posts) if (/幕布|mubu/i.test(JSON.stringify(p))) remain++;
console.log('remaining mubu refs in posts:', remain);
