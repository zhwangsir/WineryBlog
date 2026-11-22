// Catalog every 延伸阅读 entry across all tutorials, classify crawl-ability
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TUT = path.join(ROOT, 'src', 'tutorials');
const REF_DIR = path.join(ROOT, 'src', 'references');

const refs = fs.existsSync(REF_DIR) ? fs.readdirSync(REF_DIR).filter(f => f.endsWith('.md')) : [];
const refTitles = refs.map(f => {
  const c = fs.readFileSync(path.join(REF_DIR, f), 'utf8');
  return (c.match(/^title:\s*(.+)$/m) || [])[1]?.trim() || f;
});

const catalog = { books: [], sites: [], tools: [], alreadyMirrored: [], tutorials: [], uncategorized: [] };
const siteSet = new Set();

for (const f of fs.readdirSync(TUT)) {
  if (!f.endsWith('.md')) continue;
  const c = fs.readFileSync(path.join(TUT, f), 'utf8');
  const idx = c.indexOf('## 延伸阅读');
  if (idx < 0) continue;
  const section = c.slice(idx);
  for (const line of section.split('\n').slice(1)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    // book reference
    if (/《.+》/.test(t)) {
      const book = t.match(/《(.+?)》/)?.[1];
      catalog.books.push({ file: f, book, line: t.slice(0, 80) });
      continue;
    }
    // site reference (name mention without URL)
    const siteMatch = t.match(/([a-z0-9.-]+\.(?:com|org|net|dev|io|cn|wiki|app|gg))\b/i);
    if (siteMatch) {
      const host = siteMatch[1].toLowerCase();
      siteSet.add(host);
      catalog.sites.push({ file: f, host, line: t.slice(0, 80) });
      continue;
    }
    catalog.tools.push({ file: f, line: t.slice(0, 80) });
  }
}

// unique site hosts
catalog.uniqueHosts = [...siteSet].sort();
console.log(JSON.stringify({
  books: catalog.books.length,
  siteMentions: catalog.sites.length,
  uniqueHosts: catalog.uniqueHosts,
  mirroredCount: refs.length,
}, null, 1));
fs.writeFileSync(path.join(ROOT, 'docs', 'reading-catalog.json'), JSON.stringify(catalog, null, 1));
