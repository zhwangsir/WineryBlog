// Extract candidate endpoints from the uapis wallpaper API doc page
import fs from 'fs';
const c = fs.readFileSync('C:/workspace/WineryBlog/public/wp-api-doc.html', 'utf8');
console.log('len:', c.length);
const urls = [...new Set(
  [...c.matchAll(/https?:\/\/[^\s"'<>()\\]{4,140}/g)].map(m => m[0])
)].filter(u => /wallpaper|image|img|photo|api\.|bing/i.test(u) && !/uapis\.cn\/(en\/)?(og\/)?/.test(u) && !/_next|favicon|google|fonts|umami/i.test(u));
console.log('candidate urls:');
urls.slice(0, 30).forEach(u => console.log('  ', u));
// 也找标题与描述，确认文档页说的调用方式
const title = c.match(/<title>([^<]+)<\/title>/);
console.log('page title:', title?.[1]);
const h1s = [...c.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
console.log('h1:', h1s[0]);
