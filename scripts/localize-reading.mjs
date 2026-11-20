// Localize every external link in tutorials & references so the site never
// sends readers off-site.
//
// Classification:
//   STRIP hosts (video/social/bookstore — not mirrorable) -> plain text, URL dropped
//   everything else -> registered in docs/REFERENCES.md checklist;
//                      once fetched (src/references exists) rewritten to /post/ref-<slug>
// Bare https:// URLs in prose (outside code fences/inline code) get backticked
// so remark-gfm does not autolink them.
//
// Idempotent: safe to run before and after scripts/fetch-references.mjs.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TUT_DIR = path.join(ROOT, 'src', 'tutorials');
const REF_DIR = path.join(ROOT, 'src', 'references');
const CHECKLIST = path.join(ROOT, 'docs', 'REFERENCES.md');

const STRIP_HOSTS = [
  'youtube.com', 'youtu.be', 'bilibili.com', 'player.bilibili.com',
  'x.com', 'twitter.com', 'facebook.com', 'linkedin.com', 'instagram.com',
  'amazon.com', 'amazon.cn', 'douban.com', 'book.douban.com', 'jd.com',
  'taobao.com', 'tmall.com', 'weibo.com', 'zhihu.com', 'mp.weixin.qq.com',
  'space.bilibili.com', 'v.qq.com', 'youku.com',
];

function hostOf(url) {
  try { return new URL(url).host.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}

function isStripHost(url) {
  const h = hostOf(url);
  return STRIP_HOSTS.some(s => h === s || h.endsWith('.' + s));
}

/** ref-<host>-<path> slug, safe & short */
function slugFor(url) {
  const u = new URL(url);
  const seg = (u.host.replace(/^www\./, '') + u.pathname)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return ('ref-' + seg).slice(0, 70).replace(/-+$/g, '');
}

function slugExists(slug, checklist) {
  return checklist.includes(`| ${slug} |`) || checklist.includes(`] ${slug} `) ||
    checklist.match(new RegExp(`\\b${slug}\\b`)) !== null;
}

/** Split text into fenced code / inline code / normal segments */
function splitCode(text) {
  const parts = [];
  const re = /(```[\s\S]*?```|`[^`\n]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ code: false, s: text.slice(last, m.index) });
    parts.push({ code: true, s: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ code: false, s: text.slice(last) });
  return parts;
}

/** Rewrite markdown links + bare urls in a non-code text segment */
function localizeSegment(text, { fetchedByHost, stats, finalize }) {
  // 1) markdown links [text](url) — tolerate one level of nested brackets
  //    in link text (e.g. `valueOf(char[], int)` or `[[zh-cn]...]`)
  text = text.replace(/\[((?:[^\[\]]|\[[^\]]*\])*)\]\((https?:\/\/[^)\s]+)\)/g, (full, label, url) => {
    if (isStripHost(url)) { stats.stripped++; return label; }
    const local = fetchedByHost.get(url);
    if (local) { stats.rewritten++; return `[${label}](${local})`; }
    // not fetched yet — keep URL unless finalize (post-fetch failed = strip to text)
    if (finalize) { stats.stripped++; return label; }
    stats.pending++;
    return full;
  });
  // 2) bare urls in prose -> backtick (GFM would autolink them otherwise).
  //    Lookbehind only protects autolink <...>, inline code and escapes —
  //    parenthesized prose urls like (https://...) must be ticked too.
  text = text.replace(/(?<![<`\\])https?:\/\/[^\s)>\]]+/g, (u) => {
    stats.bareTicked++;
    return '`' + u + '`';
  });
  return text;
}

function processDir(dir, opts) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const p = path.join(dir, f);
    const orig = fs.readFileSync(p, 'utf-8');
    const parts = splitCode(orig);
    const out = parts.map(pt => pt.code ? pt.s : localizeSegment(pt.s, opts)).join('');
    if (out !== orig) fs.writeFileSync(p, out);
  }
}

// ---------- build fetched map: url -> /post/ref-<slug> ----------
const checklist = fs.readFileSync(CHECKLIST, 'utf-8');
const entries = [...checklist.matchAll(/^- \[( |x)\] (ref-[\w-]+) \| (.+?) \| (\S+)\s*$/gm)]
  .map(m => ({ done: m[1] === 'x', slug: m[2], title: m[3].trim(), url: m[4] }));

const fetchedByHost = new Map();   // url -> local post path
const unfetched = [];
for (const e of entries) {
  const file = path.join(REF_DIR, `${e.slug}.md`);
  if (fs.existsSync(file)) fetchedByHost.set(e.url, `/post/${e.slug.startsWith('ref-') ? e.slug : 'ref-' + e.slug}`);
  else unfetched.push(e);
}

// ---------- pass A: scan tutorials for new URLs needing mirrors ----------
let checklistAdditions = '';
const stats = { stripped: 0, rewritten: 0, pending: 0, bareTicked: 0, added: 0 };
const seen = new Set(entries.map(e => e.url));
for (const f of fs.existsSync(TUT_DIR) ? fs.readdirSync(TUT_DIR) : []) {
  if (!f.endsWith('.md')) continue;
  const c = fs.readFileSync(path.join(TUT_DIR, f), 'utf-8');
  for (const m of c.matchAll(/\[((?:[^\[\]]|\[[^\]]*\])*)\]\((https?:\/\/[^)\s]+)\)/g)) {
    const [, label, url] = m;
    if (isStripHost(url) || seen.has(url)) continue;
    seen.add(url);
    const slug = slugFor(url);
    if (slugExists(slug, checklist)) continue;
    checklistAdditions += `- [ ] ${slug} | ${label.replace(/\|/g, ' ').trim().slice(0, 60)} | ${url}\n`;
    stats.added++;
  }
}
if (checklistAdditions) {
  fs.appendFileSync(CHECKLIST, `\n## Auto-added（延伸阅读本地化）\n${checklistAdditions}`);
}

// ---------- pass B: localize both dirs ----------
// --finalize: run AFTER fetch-references; links still pending = fetch failed
//             → degrade to plain text so zero outbound links is guaranteed
const FINALIZE = process.argv.includes('--finalize');
const dirOpts = { fetchedByHost, stats, finalize: FINALIZE };
processDir(TUT_DIR, dirOpts);
processDir(REF_DIR, dirOpts);

console.log(`localize${FINALIZE ? ' (finalize)' : ''}: stripped=${stats.stripped} rewritten=${stats.rewritten} bareTicked=${stats.bareTicked} newChecklist=${stats.added} pendingFetch=${unfetched.length}`);
if (stats.pending) console.log(`  (links awaiting fetch: ${stats.pending} — run fetch-references.mjs then rerun with --finalize)`);
