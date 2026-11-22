// Full scan: mubu + homepage banner source + date distribution
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/posts.json'), 'utf-8'));

const hits = [];
for (const p of posts) {
  const s = JSON.stringify(p);
  if (/幕布|mubu/i.test(s)) {
    hits.push({ id: p.id, title: p.title });
  }
}

const results = { postHits: hits, src: [], home: null };

const walk = (d, prefix) => {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { walk(p, prefix + f.name + '/'); continue; }
    if (!/\.(tsx|ts|mjs|md|json|html)$/.test(f.name)) continue;
    const c = fs.readFileSync(p, 'utf8');
    if (/幕布|mubu/i.test(c)) results.src.push(prefix + f.name);
  }
};
walk(path.join(ROOT, 'src'), 'src/');
walk(path.join(ROOT, 'public'), 'public/');
if (/幕布|mubu/i.test(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'))) results.src.push('index.html');
if (/幕布|mubu/i.test(fs.readFileSync(path.join(ROOT, 'server/data/config.json'), 'utf8'))) results.src.push('config.json');

// homepage banner text search
const home = fs.readFileSync(path.join(ROOT, 'src/pages/Home.tsx'), 'utf8');
results.homeBannerSource = home.slice(0, 400);
if (/幕布|知识库/.test(home)) results.homeBannerFound = true;

// date distribution
const dates = posts.map(p => p.date).sort();
const counts = {};
for (const d of dates) { const y = d.slice(0, 4); counts[y] = (counts[y] || 0) + 1; }
results.dateRange = [dates[0], dates[dates.length - 1]];
results.perYear = counts;

fs.writeFileSync(path.join(ROOT, 'docs/mubu-scan.json'), JSON.stringify(results, null, 1));
console.log(JSON.stringify(results, null, 1));
