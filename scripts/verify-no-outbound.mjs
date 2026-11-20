// Strict verification: zero clickable outbound links & zero bare URLs in prose
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const violations = [];

for (const dir of ['src/tutorials', 'src/references']) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    if (!f.endsWith('.md')) continue;
    const lines = fs.readFileSync(path.join(abs, f), 'utf8').split('\n');
    let inFence = false;
    lines.forEach((l, i) => {
      if (l.trimStart().startsWith('```')) { inFence = !inFence; return; }
      if (inFence) return;
      // remove inline code spans and markdown link targets, then look for urls
      const s = l.replace(/`[^`]+`/g, '').replace(/\[[^\]]*\]\([^)]*\)/g, '');
      if (/https?:\/\//.test(s)) violations.push(`${dir}/${f}:${i + 1}: ${s.trim().slice(0, 100)}`);
      // markdown links to http(s) at all (clickable)
      for (const m of l.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)) {
        violations.push(`${dir}/${f}:${i + 1}: LINK ${m[1]}`);
      }
    });
  }
}
console.log(`violations: ${violations.length}`);
violations.slice(0, 20).forEach(v => console.log('  ' + v));
process.exit(violations.length ? 1 : 0);
