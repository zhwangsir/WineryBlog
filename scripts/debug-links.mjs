// Precise per-file link accounting; writes ASCII-only JSON to docs/debug-links.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function splitCodeLineBased(text) {
  // returns array of {code, s}; line-by-line fence tracking + per-line inline pairing
  const lines = text.split('\n');
  const parts = [];
  let inFence = false, buf = [], bufCode = null;
  const flush = () => {
    if (buf.length) { parts.push({ code: bufCode, s: buf.join('\n') + (bufCode === false ? '\n' : '\n') }); buf = []; }
  };
  for (const line of lines) {
    const t = line.trimStart();
    if (t.startsWith('```')) {
      flush();
      parts.push({ code: true, s: line + '\n' });
      inFence = !inFence;
      bufCode = null;
      continue;
    }
    const code = inFence;
    if (bufCode === null) bufCode = code;
    if (bufCode !== code) { flush(); bufCode = code; }
    buf.push(line);
  }
  flush();
  // now split prose parts by inline-code pairs
  const out = [];
  for (const p of parts) {
    if (p.code) { out.push(p); continue; }
    const segs = p.s.split(/(`[^`\n]+`)/g);
    for (const s of segs) out.push({ code: s.startsWith('`') && s.endsWith('`') && s.length > 1, s });
  }
  return out;
}

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const report = {};
let totals = { links: 0, inCode: 0, inText: 0 };

for (const dir of ['src/tutorials', 'src/references']) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    if (!f.endsWith('.md')) continue;
    const c = fs.readFileSync(path.join(abs, f), 'utf-8');
    const raw = [...c.matchAll(LINK_RE)];
    if (!raw.length) continue;
    const parts = splitCodeLineBased(c);
    let inCode = 0;
    for (const p of parts) if (p.code) inCode += [...p.s.matchAll(LINK_RE)].length;
    const inText = raw.length - inCode;
    totals.links += raw.length; totals.inCode += inCode; totals.inText += inText;
    report[`${dir}/${f}`] = { raw: raw.length, inCode, inText, fences: (c.match(/```/g) || []).length };
  }
}
report.__totals = totals;
fs.writeFileSync(path.join(ROOT, 'docs', 'debug-links.json'), JSON.stringify(report, null, 1));
console.log('written docs/debug-links.json', JSON.stringify(totals));
