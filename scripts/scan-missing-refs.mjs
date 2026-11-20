// Scan career routes for refs missing from tutorial catalog
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const careers = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/careers.json'), 'utf8')).careers;
const tuts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/tutorials.json'), 'utf8')).tutorials;
const titles = new Set(tuts.map(t => t.title));

const out = { routes: [], total: 0 };
for (const c of careers) {
  const refs = [
    ...(c.stages || []).flatMap(s => (s.items || []).map(i => i.ref)),
    ...(c.extras || []).map(i => i.ref),
  ];
  const miss = [...new Set(refs.filter(r => !titles.has(r)))];
  if (miss.length) out.routes.push({ career: c.name, missing: miss });
  out.total += miss.length;
}
fs.writeFileSync(path.join(ROOT, 'docs', 'missing-refs.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
