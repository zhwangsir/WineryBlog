import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const pool = JSON.parse(fs.readFileSync(f, 'utf8'));
for (const c of pool.candidates) {
  if (c.id === 'interviewguide') {
    c.status = 'pending';
    c.picks = [
      { dir: 'docs/cs-basics', keywords: ['.md'], max: 14, recursive: true },
      { dir: 'docs/database', keywords: ['.md'], max: 4, recursive: true },
      { dir: 'docs/network', keywords: ['.md'], max: 4, recursive: true },
      { dir: 'docs/linux', keywords: ['.md'], max: 3, recursive: true },
    ];
  }
}
fs.writeFileSync(f, JSON.stringify(pool, null, 1));
console.log('pool fixed');
