// Find exact mubu context + the banner phrase source
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/posts.json'), 'utf-8'));

const out = { contexts: [], bannerSearch: [] };

for (const p of posts) {
  const s = JSON.stringify(p);
  if (/幕布|mubu/i.test(s)) {
    const lines = String(p.content).split('\n');
    const ctx = [];
    lines.forEach((l, i) => {
      if (/幕布|mubu/i.test(l)) ctx.push({ ln: i + 1, line: l.slice(0, 160) });
    });
    out.contexts.push({ id: p.id, title: p.title, ctx });
  }
}

// banner phrase search across all source + config
const phrase = /从幕布备份|完整知识库|本站就是案例/g;
const walk = (d, prefix) => {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { walk(p, prefix + f.name + '/'); continue; }
    if (!/\.(tsx?|mjs|md|json|html|css)$/.test(f.name)) continue;
    const c = fs.readFileSync(p, 'utf8');
    const lines = c.split('\n');
    lines.forEach((l, i) => {
      if (phrase.test(l)) out.bannerSearch.push(`${prefix}${f.name}:${i + 1}: ${l.trim().slice(0, 120)}`);
    });
  }
};
walk(path.join(ROOT, 'src'), 'src/');
walk(path.join(ROOT, 'server'), 'server/');
walk(path.join(ROOT, 'public'), 'public/');

fs.writeFileSync(path.join(ROOT, 'docs/mubu-context.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
