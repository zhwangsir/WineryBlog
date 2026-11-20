// Fetch external reference articles into src/references/*.md
// Uses r.jina.ai (returns clean markdown) as primary channel, direct HTML as fallback.
// Checklist lives in docs/REFERENCES.md, lines:  - [ ] ref-slug | Title | URL
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'references');
const LIST = path.join(ROOT, 'docs', 'REFERENCES.md');
const PROXY = process.env.FETCH_PROXY || 'http://127.0.0.1:33210';

const checklist = fs.readFileSync(LIST, 'utf-8');
const entries = [...checklist.matchAll(/^- \[( |x)\] (ref-[\w-]+) \| (.+?) \| (\S+)\s*$/gm)]
  .map(m => ({ done: m[1] === 'x', slug: m[2], title: m[3].trim(), url: m[4] }));

fs.mkdirSync(OUT, { recursive: true });

function curl(url, { jina = false, useProxy = false } = {}) {
  const args = ['-sL', '--max-time', '60', '-o', '-', useProxy ? '--proxy' : null, useProxy ? PROXY : null, jina ? `https://r.jina.ai/${url}` : url].filter(Boolean);
  return execFileSync('curl', args, { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });
}

function extractMarkdown(jinaText, url) {
  // r.jina.ai output: "Title: ...\nURL Source: ...\nMarkdown Content:\n<md>"
  const marker = 'Markdown Content:';
  const idx = jinaText.indexOf(marker);
  let body = idx >= 0 ? jinaText.slice(idx + marker.length).trim() : jinaText;
  const titleMatch = jinaText.match(/^Title:\s*(.+)$/m);
  let pageTitle = (titleMatch?.[1] || '').trim();
  return { body: cleanMarkdown(body), pageTitle };
}

/** Clean scraped markdown for offline in-site use. */
function cleanMarkdown(md) {
  // 1) drop everything before the first H1 (site nav chrome)
  const h1 = md.search(/^#\s/m);
  if (h1 > 0) md = md.slice(h1);
  // 2) strip code-fence content from link/image rewriting below (protect later)
  const fences = [];
  md = md.replace(/```[\s\S]*?```/g, (m) => { fences.push(m); return `\u0000F${fences.length - 1}\u0000`; });
  // 3) images → placeholder (remote assets stay remote)
  md = md.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt) => (alt ? `\n（图：${alt.trim()}）\n` : ''));
  // 4) links → plain text (user never leaves the site)
  md = md.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // 5) collapse junk
  md = md.replace(/\u0000F(\d+)\u0000/g, (_, i) => fences[+i]);
  md = md.replace(/^\s*[-*]\s*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
  return md;
}

let ok = 0, skipped = 0, failed = [];
for (const e of entries) {
  const outPath = path.join(OUT, `${e.slug}.md`);
  if (e.done && fs.existsSync(outPath)) { skipped++; continue; }

  let md = null, via = '';
  // channel 1: r.jina.ai direct
  try {
    const { body, pageTitle } = extractMarkdown(curl(e.url, { jina: true }), e.url);
    if (body && body.length > 500) { md = body; via = 'jina'; if (pageTitle) e.title = pageTitle.split('|')[0].trim() || e.title; }
  } catch { /* fall through */ }
  // channel 2: direct via proxy (raw HTML stripped crudely)
  if (!md) {
    try {
      const html = curl(e.url, { useProxy: true });
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '').replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, l, t) => `\n${'#'.repeat(+l)} ${t.replace(/<[^>]+>/g, '').trim()}\n`)
        .replace(/<li[^>]*>/gi, '\n- ').replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n').trim();
      if (text.length > 500) { md = text; via = 'html'; }
    } catch { /* fall through */ }
  }

  if (!md) { failed.push(`${e.slug} ${e.url}`); continue; }

  const cleanTitle = (via === 'jina' ? e.title : e.title).replace(/\s+/g, ' ').replace(/[|#]/g, ' ').trim() || e.slug;
  const head = `---\ntitle: ${cleanTitle}\ncategory: 参考资料\nsource: ${e.url}\nsummary: 本地镜像：${cleanTitle}（原文 ${new URL(e.url).host}）\n---\n\n> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：${e.url}\n\n`;
  fs.writeFileSync(outPath, head + md + '\n');
  ok++;
  console.log(`[${via}] ${e.slug} (${(md.length / 1024).toFixed(0)}KB) "${cleanTitle.slice(0, 30)}"`);
}

console.log(`\nfetch ok=${ok} skipped=${skipped} failed=${failed.length}`);
failed.forEach(f => console.log('  FAIL: ' + f));

// mark fetched entries done in checklist
if (failed.length < entries.length) {
  let updated = checklist;
  for (const e of entries) {
    if (fs.existsSync(path.join(OUT, `${e.slug}.md`))) {
      updated = updated.replace(`- [ ] ${e.slug} |`, `- [x] ${e.slug} |`);
    }
  }
  fs.writeFileSync(LIST, updated);
}
