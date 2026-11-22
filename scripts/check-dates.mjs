import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/posts.json'), 'utf-8'));
const counts = {};
let mubu = 0, minDate = '9999', maxDate = '0000';
for (const x of posts) {
  const y = x.date.slice(0, 4);
  counts[y] = (counts[y] || 0) + 1;
  if (/幕布|mubu/i.test(JSON.stringify(x))) mubu++;
  if (x.date < minDate) minDate = x.date;
  if (x.date > maxDate) maxDate = x.date;
}
const result = { counts, mubu, minDate, maxDate, total: posts.length };
fs.writeFileSync(path.join(ROOT, 'docs/date-check.json'), JSON.stringify(result, null, 1));
console.log('written docs/date-check.json');
