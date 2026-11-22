// Comprehensive outbound-link audit over ALL rendered content (posts.json covers
// every article incl. blog posts; patterns beyond inline md links included)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/posts.json'), 'utf-8'));

const findings = [];
let scanned = 0;

// strip code fences/inline code so example URLs don't count (not rendered as links)
function stripCode(text) {
  const parts = [];
  const re = /(```[\s\S]*?```|`[^`\n]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push('');                       // code → dropped (not clickable)
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return parts.join('');
}

for (const p of posts) {
  scanned++;
  const content = stripCode(p.content || '');
  const lines = content.split('\n');

  lines.forEach((line, li) => {
    const ln = li + 1;
    // ① inline markdown links
    for (const m of line.matchAll(/\[([^\]]*)\]\((\S+?)(?:\s+"[^"]*")?\)/g)) {
      const url = m[2];
      if (/^(https?:)?\/\//i.test(url)) {
        findings.push({ id: p.id, cat: p.category, ln, type: 'md-link', text: m[1].slice(0, 40), url: url.slice(0, 90) });
      } else if (/^\/(?!\/)/.test(url) === false && url.startsWith('#') === false && url.startsWith('mailto:') === false) {
        // relative weird links
        findings.push({ id: p.id, cat: p.category, ln, type: 'odd-rel', text: m[1].slice(0, 40), url: url.slice(0, 90) });
      }
    }
    // ② reference-style link definitions: [label]: https://url
    for (const m of line.matchAll(/^\s*\[[^\]]*\]:\s*(https?:\/\/\S+)/gm)) {
      findings.push({ id: p.id, cat: p.category, ln, type: 'ref-def', url: m[1].slice(0, 90) });
    }
    // ③ angle autolinks <https://...>
    for (const m of line.matchAll(/<https?:\/\/[^>]+>/g)) {
      findings.push({ id: p.id, cat: p.category, ln, type: 'angle-auto', url: m[0].slice(0, 90) });
    }
    // ④ raw HTML anchors
    for (const m of line.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)) {
      findings.push({ id: p.id, cat: p.category, ln, type: 'html-a', url: m[1].slice(0, 90) });
    }
    // ⑤ GFM bare autolinks (www./http in prose, remark-gfm renders these!)
    const stripped = line
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '')      // drop md links (counted above)
      .replace(/`[^`]+`/g, '')                    // drop inline code
      .replace(/https?:\/\/\S+/g, (u) => {        // bare http urls remain?
        findings.push({ id: p.id, cat: p.category, ln, type: 'bare-url', url: u.slice(0, 90) });
        return '';
      });
  });
}

fs.writeFileSync(path.join(ROOT, 'docs/outbound-audit.json'), JSON.stringify({ scanned, findings }, null, 1));

// 按类型汇总
const byType = {};
for (const f of findings) byType[f.type] = (byType[f.type] || 0) + 1;
console.log(`scanned ${scanned} posts, findings ${findings.length}`);
console.log('by type:', JSON.stringify(byType, null, 1));
// external-only summary (excluding internal /post /uploads # mailto)
const ext = findings.filter(f => /^https?:\/\//i.test(f.url || '') && !/127\.0\.0\.1|localhost/.test(f.url));
console.log(`external findings: ${ext.length}`);
ext.slice(0, 40).forEach(f => console.log(`  [${f.type}] ${f.id} L${f.ln} ${f.url}`));
