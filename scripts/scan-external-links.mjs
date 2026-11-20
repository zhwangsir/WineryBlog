// Report every external link in src/tutorials and src/references
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function scan(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const c = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of c.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)) {
      out.push({ file: f, text: m[1], url: m[2] });
    }
  }
  return out;
}

const t = scan(path.join(ROOT, 'src', 'tutorials'));
const r = scan(path.join(ROOT, 'src', 'references'));
const all = [...t, ...r];
console.log(`tutorials: ${t.length} external links in ${new Set(t.map(x => x.file)).size} files`);
console.log(`references: ${r.length} external links in ${new Set(r.map(x => x.file)).size} files`);

const hosts = {};
for (const x of all) {
  try { const h = new URL(x.url).host; hosts[h] = (hosts[h] || 0) + 1; } catch {}
}
console.log('hosts:', JSON.stringify(hosts, null, 1));

// dump per-file link lists for localization work
const byFile = {};
for (const x of t) (byFile[x.file] ||= []).push(x);
fs.writeFileSync(path.join(ROOT, 'docs', 'EXTERNAL_LINKS.json'), JSON.stringify(byFile, null, 1));
console.log(`\nwritten docs/EXTERNAL_LINKS.json (${Object.keys(byFile).length} files)`);
