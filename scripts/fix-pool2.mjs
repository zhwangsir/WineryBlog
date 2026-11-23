import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const pool = JSON.parse(fs.readFileSync(f, 'utf8'));
for (const c of pool.candidates) {
  if (c.id === 'cppthings2' || c.id === 'py100') {
    c.status = 'pending';
    if (c.picks?.[0]) c.picks[0].viaContents = true;
  }
  if (c.id === 'golang2') c.status = 'failed';
}
fs.writeFileSync(f, JSON.stringify(pool, null, 1));
console.log('pool:', pool.candidates.map(c => `${c.id}:${c.status}`).join(' '));
