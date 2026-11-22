// 生成 PWA 图标：从胡桃头像居中裁方 → 192/512 + maskable(带安全边距)
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'public', 'images', 'HuTao', 'hutao68.png');
const OUT = path.join(ROOT, 'public', 'images', 'pwa');

if (!fs.existsSync(SRC)) {
  console.log('source avatar missing:', SRC);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const square = await sharp(SRC)
  .resize(512, 512, { fit: 'cover', position: 'attention' })   // attention: 聚焦主体
  .toBuffer();

await sharp(square).resize(192, 192).png().toFile(path.join(OUT, 'icon-192.png'));
await sharp(square).png().toFile(path.join(OUT, 'icon-512.png'));
// maskable：80% 内容区 + 主题色底（安装后系统可安全裁圆）
await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 242, g: 125, b: 38, alpha: 1 } },
})
  .composite([{ input: await sharp(square).resize(410, 410).png().toBuffer(), top: 51, left: 51 }])
  .png()
  .toFile(path.join(OUT, 'maskable-512.png'));

console.log('pwa icons generated at public/images/pwa/');
