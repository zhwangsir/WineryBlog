// Probe uapis wallpaper page for its internal image fetch URL
import fs from 'fs';
const c = fs.readFileSync('C:/workspace/WineryBlog/public/wallpapers-test.jpg', 'utf8');
console.log('len:', c.length);
// 找所有 http(s) 链接
const urls = [...new Set([...c.matchAll(/https?:\/\/[^\s"'<>()\\,;]{4,160}/g)].map(m => m[0]))];
console.log('all urls found:', urls.length);
urls.filter(u => !/_next|\.css|\.js\b|favicon|uapis\.cn\/(en\/)?(random-wallpaper|og|favicon)/.test(u)).slice(0, 40).forEach(u => console.log('  ', u));
// 找 JSON 数据块里的图片字段
const imgFields = [...c.matchAll(/"(?:url|image|img|src|wallpaper|background|cover)":\s*"[^"]+"/gi)].map(m => m[0]);
console.log('image-ish fields:', imgFields.slice(0, 10));
