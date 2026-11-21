// Generate public/sitemap.xml from tutorial catalog + core routes
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOMAIN = 'https://blog.wineryz.top';
const tuts = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/tutorials.json'), 'utf8'));

const urls = [
  { loc: '/', priority: '1.0' },
  { loc: '/tutorials', priority: '0.9' },
  { loc: '/graph', priority: '0.8' },
  { loc: '/ai', priority: '0.7' },
  { loc: '/archive', priority: '0.7' },
  { loc: '/about', priority: '0.5' },
];
for (const t of tuts.tutorials) urls.push({ loc: t.href, priority: '0.6' });

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${DOMAIN}${u.loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), xml);

const robots = `User-agent: *
Allow: /
Sitemap: ${DOMAIN}/sitemap.xml
`;
fs.writeFileSync(path.join(ROOT, 'public', 'robots.txt'), robots);

console.log(`sitemap.xml: ${urls.length} urls (incl ${tuts.tutorials.length} tutorials)`);
console.log('robots.txt written');
