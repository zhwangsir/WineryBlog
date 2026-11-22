// 上传查重实测：字节级重复 + 感知级重复（重压缩变体）
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const ROOT = 'C:/workspace/WineryBlog';
const API = 'http://127.0.0.1:3000';

async function api(url, options = {}) {
  return fetch(API + url, options);
}

// 登录
const loginRes = await api('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' }),
});
const { token } = await loginRes.json();

async function upload(buf, name, mime) {
  const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
  const res = await api('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data: dataUrl }),
  });
  return { status: res.status, body: await res.json() };
}

const src = path.join(ROOT, 'server/data/gallery/scenery/0cd651f3082c1a1b.jpg');
const orig = fs.readFileSync(src);

// ① 字节级完全相同
const r1 = await upload(orig, 'test-exact.jpg', 'image/jpeg');
console.log('① 字节重复:', r1.status, JSON.stringify(r1.body));

// ② 同图重压缩（quality 55）——字节不同，视觉相同 → 应命中感知查重
const recompressed = await sharp(src).jpeg({ quality: 55 }).toBuffer();
console.log('② 变体字节:', crypto.createHash('sha256').update(recompressed).digest('hex').slice(0, 16), '(与原图不同)');
const r2 = await upload(recompressed, 'test-similar.jpg', 'image/jpeg');
console.log('② 感知重复:', r2.status, JSON.stringify(r2.body));

// ③ 真正的新图（裁剪出不同构图）→ 应该入库成功
const cropped = await sharp(src).extract({ left: 0, top: 0, width: 800, height: 600 }).toBuffer();
const r3 = await upload(cropped, 'test-new.jpg', 'image/jpeg');
console.log('③ 新图:', r3.status, JSON.stringify({ ...r3.body, url: r3.body.url }));
console.log('③ 落盘验证:', fs.existsSync(path.join(ROOT, 'server/data/uploads', path.basename(r3.body.url || 'x'))));

// 清理③（不留测试图）
if (r3.body.url) {
  const del = await api(`/api/admin/gallery/uploads/${encodeURIComponent(path.basename(r3.body.url))}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('③ 清理:', del.status);
}
