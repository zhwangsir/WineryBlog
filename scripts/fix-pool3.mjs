import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = path.join(ROOT, 'server', 'data', 'sources-candidates.json');
const pool = JSON.parse(fs.readFileSync(f, 'utf8'));
for (const c of pool.candidates) {
  if (c.id === 'dbtutorial') {
    c.status = 'pending';
    c.picks = [{ dir: 'docs/12.数据库', keywords: ['.md'], max: 14, recursive: true }];
  }
  if (c.id === 'javafamily') {
    c.status = 'pending';
    c.picks = [{ dir: 'docs/all', keywords: ['.md'], max: 16, recursive: true }];
  }
}
fs.writeFileSync(f, JSON.stringify(pool, null, 1));
console.log('pool fixed');
