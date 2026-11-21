// Diagnostic: find real improvement opportunities
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = {};

// 1. Code blocks with copy buttons? (check a tutorial + PostDetail component)
const postDetail = fs.readFileSync(path.join(ROOT, 'src/pages/PostDetail.tsx'), 'utf8');
out.copyButton = postDetail.includes('copy') || postDetail.includes('Copy') || postDetail.includes('clipboard');

// 2. Sitemap / robots.txt
out.sitemap = fs.existsSync(path.join(ROOT, 'public', 'sitemap.xml'));
out.robots = fs.existsSync(path.join(ROOT, 'public', 'robots.txt'));

// 3. 404 page handling
const app = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
out.notFoundRoute = app.includes('NotFound') || app.includes('*');

// 4. Archive page: 246 posts - animation delay pattern (already fixed?) + virtualization
const archive = fs.readFileSync(path.join(ROOT, 'src/pages/Archive.tsx'), 'utf8');
out.archiveDelayCapped = archive.includes('Math.min') && archive.includes('delay');
out.archiveVirtualized = archive.includes('virtual') || archive.includes('Virtual');

// 5. Tutorial count vs career route coverage
const tuts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/tutorials.json'), 'utf8'));
out.tutorialCount = tuts.tutorials.length;
out.domains = tuts.domains.length;

// 6. Reference mirrors with thin content (< 1500 chars in md body)
const REF_DIR = path.join(ROOT, 'src', 'references');
const thin = [];
for (const f of fs.readdirSync(REF_DIR)) {
  const c = fs.readFileSync(path.join(REF_DIR, f), 'utf8');
  const body = c.split('---').slice(2).join('---').trim();
  if (body.length < 1500) thin.push(`${f} (${body.length})`);
}
out.thinReferences = thin;

// 7. Tutorials without prerequisite links (prereqs empty)
const noPrereq = tuts.tutorials.filter(t => (t.prereqs || []).length === 0).length;
out.tutorialsWithoutPrereqs = noPrereq;

// 8. Search modal exists?
const navbar = fs.readFileSync(path.join(ROOT, 'src/components/Navbar.tsx'), 'utf8');
out.searchModal = navbar.includes('SearchModal');

// 9. Meta description for SEO on tutorials
const hasMeta = tuts.tutorials.every(t => t.summary && t.summary.length > 10);
out.allHaveSummaries = hasMeta;

console.log(JSON.stringify(out, null, 1));
