// 抓取随机壁纸到 public/wallpapers/（本地优先：读者只加载本地文件）
// 用法：node scripts/fetch-wallpapers.mjs [数量]
// 幂等：内容哈希去重；分类混搭：acg（二次元，契合胡桃主题）+ 随机风景
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'wallpapers');
const COUNT = parseInt(process.argv[2] || '10', 10);

fs.mkdirSync(OUT, { recursive: true });

const ENDPOINTS = [
  'https://uapis.cn/api/v1/random/image?category=acg',   // 二次元：契合胡桃主题
  'https://uapis.cn/api/v1/random/image',                // 全类随机
];

const seen = new Set();
const saved = [];
let attempts = 0;

function magicExt(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return '.jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50) return '.png';
  if (buf[0] === 0x52 && buf[1] === 0x49) return '.webp';
  return null;
}

while (saved.length < COUNT && attempts < COUNT * 3) {
  attempts++;
  try {
    const ep = ENDPOINTS[attempts % ENDPOINTS.length];
    const buf = execFileSync('curl', ['-sL', '--max-time', '90', '-o', '-', ep], {
      maxBuffer: 64 * 1024 * 1024,
      encoding: 'buffer',
    });
    const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
    const ext = magicExt(buf);
    if (!ext) { console.log(`skip attempt ${attempts}: not an image`); continue; }
    if (seen.has(hash)) { console.log(`skip attempt ${attempts}: duplicate`); continue; }
    seen.add(hash);
    const name = `wp-${String(saved.length + 1).padStart(2, '0')}${ext}`;
    fs.writeFileSync(path.join(OUT, name), buf);
    saved.push(name);
    console.log(`saved ${name} (${Math.round(buf.length / 1024)}KB)`);
  } catch (e) {
    console.log(`attempt ${attempts} failed: ${e.message.slice(0, 80)}`);
  }
}

const manifest = {
  updatedAt: new Date().toISOString(),
  wallpapers: saved,
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`\nmanifest: ${saved.length} wallpapers → public/wallpapers/manifest.json`);
