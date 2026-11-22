// 自有图床抓取：按分类保存到 server/data/gallery/<category>/，内容哈希去重，meta 索引
// 用法：node scripts/fetch-gallery.mjs <category> [count]
//   category: acg(二次元) | scenery(风景→uapis landscape) | wallpaper(综合→uapis 随机)
// 迁移：node scripts/fetch-gallery.mjs --migrate   （旧 public/wallpapers 并入 gallery/wallpaper）
// 图片本体不入 git（.gitignore），meta/manifest 索引在 server/data/gallery/ 下随目录一起忽略
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dHash, phashAvailable, hamming, SIMILAR_THRESHOLD } from './lib/phash.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY = path.join(ROOT, 'server', 'data', 'gallery');
const META_FILE = path.join(GALLERY, 'meta.json');
const MANIFEST_FILE = path.join(GALLERY, 'manifest.json');
const LEGACY_WP_DIR = path.join(ROOT, 'public', 'wallpapers');

const CATEGORIES = {
  acg: { label: '二次元', endpoint: 'https://uapis.cn/api/v1/random/image?category=acg' },
  scenery: { label: '风景', endpoint: 'https://uapis.cn/api/v1/random/image?category=landscape' },
  wallpaper: { label: '综合壁纸', endpoint: 'https://uapis.cn/api/v1/random/image' },
};

function magicExt(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return '.jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50) return '.png';
  if (buf[0] === 0x52 && buf[1] === 0x49) return '.webp';
  if (buf[0] === 0x47 && buf[1] === 0x49) return '.gif';
  return null;
}

function loadMeta() {
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  } catch {
    return { images: {} };
  }
}

function saveMeta(meta) {
  fs.mkdirSync(GALLERY, { recursive: true });
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 1));
}

/** 重算 manifest：所有分类图片 URL 扁平列表（前台随机壁纸背景池） */
function rebuildManifest(meta) {
  const byCat = {};
  for (const [hash, info] of Object.entries(meta.images)) {
    (byCat[info.category] ||= []).push({
      url: `/images/${info.category}/${hash}${info.ext}`,
      mtime: info.fetchedAt,
    });
  }
  const wallpapers = Object.values(byCat)
    .flat()
    .sort((a, b) => String(b.mtime).localeCompare(String(a.mtime)))
    .map(w => w.url);
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify({ updatedAt: new Date().toISOString(), wallpapers }, null, 1));
  return wallpapers.length;
}

function deleteImage(meta, category, hash) {
  const info = meta.images[hash];
  if (!info || info.category !== category) return false;
  const file = path.join(GALLERY, category, `${hash}${info.ext}`);
  try { fs.unlinkSync(file); } catch { /* 已不存在 */ }
  delete meta.images[hash];
  return true;
}

// ---- 存量图回填感知哈希（--backfill）：只补 phash，不做删除 ----
if (process.argv[2] === '--backfill') {
  const meta = loadMeta();
  if (!phashAvailable()) {
    console.log('sharp unavailable: cannot backfill perceptual hashes');
    process.exit(1);
  }
  let done = 0;
  const pairs = [];
  for (const [hash, info] of Object.entries(meta.images)) {
    if (info.phash) continue;
    const file = path.join(GALLERY, info.category, `${hash}${info.ext}`);
    if (!fs.existsSync(file)) continue;
    info.phash = await dHash(file);
    if (info.phash) done++;
  }
  // 报告感知相似对（不自动删除，人工在图床页决定）
  const entries = Object.entries(meta.images);
  for (let i = 0; i < entries.length; i++) {
    const [, a] = entries[i];
    if (!a.phash) continue;
    for (let j = i + 1; j < entries.length; j++) {
      const [bh, b] = entries[j];
      if (!b.phash) continue;
      if (hamming(a.phash, b.phash) <= SIMILAR_THRESHOLD) {
        pairs.push(`${a.category}/${entries[i][0]} ↔ ${b.category}/${bh}`);
      }
    }
  }
  saveMeta(meta);
  console.log(`backfill: ${done} images hashed; similar pairs: ${pairs.length}`);
  pairs.slice(0, 20).forEach(p => console.log('  ' + p));
  process.exit(0);
}

// ---- 迁移旧壁纸池 ----
if (process.argv[2] === '--migrate') {
  const meta = loadMeta();
  let moved = 0;
  try {
    const legacy = JSON.parse(fs.readFileSync(path.join(LEGACY_WP_DIR, 'manifest.json'), 'utf8'));
    for (const name of legacy.wallpapers || []) {
      const src = path.join(LEGACY_WP_DIR, name);
      if (!fs.existsSync(src)) continue;
      const buf = fs.readFileSync(src);
      const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
      const ext = magicExt(buf) || path.extname(name) || '.jpg';
      const cat = 'wallpaper';
      fs.mkdirSync(path.join(GALLERY, cat), { recursive: true });
      fs.writeFileSync(path.join(GALLERY, cat, `${hash}${ext}`), buf);
      meta.images[hash] = { category: cat, ext, bytes: buf.length, fetchedAt: new Date().toISOString(), source: 'legacy-pool' };
      fs.unlinkSync(src);
      moved++;
    }
    try { fs.unlinkSync(path.join(LEGACY_WP_DIR, 'manifest.json')); } catch {}
    saveMeta(meta);
    const total = rebuildManifest(meta);
    console.log(`migrated ${moved} legacy wallpapers; manifest now ${total}`);
  } catch (e) {
    console.log(`migrate failed: ${e.message}`);
  }
  process.exit(0);
}

// ---- 分类抓取 ----
const category = process.argv[2] || 'acg';
const COUNT = parseInt(process.argv[3] || '10', 10);
if (!CATEGORIES[category]) {
  console.log(`unknown category: ${category} (use: ${Object.keys(CATEGORIES).join('|')})`);
  process.exit(1);
}
const OUT_DIR = path.join(GALLERY, category);
fs.mkdirSync(OUT_DIR, { recursive: true });

const meta = loadMeta();

const saved = [];
let attempts = 0;
while (saved.length < COUNT && attempts < COUNT * 4) {
  attempts++;
  try {
    const buf = execFileSync('curl', ['-sL', '--max-time', '90', '-o', '-', CATEGORIES[category].endpoint], {
      maxBuffer: 64 * 1024 * 1024,
      encoding: 'buffer',
    });
    const ext = magicExt(buf);
    if (!ext || buf.length < 5000) { console.log(`skip attempt ${attempts}: not an image`); continue; }
    const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
    // 双层查重：字节级（哈希已在库）+ 感知级（dHash 汉明距离，拦同图不同尺寸/压缩变体）
    if (meta.images[hash]) { console.log(`skip attempt ${attempts}: exact duplicate of ${hash}`); continue; }
    // 感知查重需要先落盘解码——写入临时名再判定
    const tmpFile = path.join(OUT_DIR, `._tmp-${hash}${ext}`);
    fs.writeFileSync(tmpFile, buf);
    const imgPhash = await dHash(tmpFile);
    let similarOf = null;
    if (imgPhash) {
      for (const [h, info] of Object.entries(meta.images)) {
        if (!info.phash) continue;
        if (hamming(imgPhash, info.phash) <= SIMILAR_THRESHOLD) { similarOf = h; break; }
      }
    }
    if (similarOf) {
      fs.unlinkSync(tmpFile);
      console.log(`skip attempt ${attempts}: perceptual duplicate of ${similarOf}`);
      continue;
    }
    fs.renameSync(tmpFile, path.join(OUT_DIR, `${hash}${ext}`));
    meta.images[hash] = {
      category,
      ext,
      bytes: buf.length,
      fetchedAt: new Date().toISOString(),
      source: `uapis:${category}`,
      ...(imgPhash ? { phash: imgPhash } : {}),
    };
    saved.push(hash);
    console.log(`saved ${hash}${ext} (${Math.round(buf.length / 1024)}KB)`);
  } catch (e) {
    console.log(`attempt ${attempts} failed: ${e.message.slice(0, 80)}`);
  }
}

saveMeta(meta);
const total = rebuildManifest(meta);
console.log(`\ncategory=${category} saved=${saved.length} total-in-gallery=${Object.keys(meta.images).length} manifest=${total}`);
