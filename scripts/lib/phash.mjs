// 图床感知哈希：dHash 差值哈希（9x8 灰度 → 64 位指纹）+ 汉明距离比对
// 依赖 sharp（可选）：不可用时 dHash 返回 null，调用方退回字节级去重
import fs from 'fs';

let sharpMod = null;
try {
  sharpMod = (await import('sharp')).default;
} catch {
  sharpMod = null;
}

export const phashAvailable = () => sharpMod !== null;

/**
 * 计算 dHash 64 位指纹，返回 16 字符 hex；解码失败或 sharp 不可用返回 null
 * 输入可为文件路径或 Buffer（推荐 Buffer：Windows 上路径输入会因 libvips
 * 句柄延迟释放导致后续 rename/unlink 撞 EBUSY 锁）
 */
export async function dHash(input) {
  if (!sharpMod) return null;
  try {
    // 9x8 灰度：每行 8 个相邻差值 × 8 行 = 64 位
    const { data, info } = await sharpMod(input)
      .resize(9, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let bits = 0n;
    let n = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width - 1; x++) {
        const left = data[y * info.width + x];
        const right = data[y * info.width + x + 1];
        if (left > right) bits |= 1n << BigInt(n);
        n++;
      }
    }
    return bits.toString(16).padStart(16, '0');
  } catch {
    return null;
  }
}

/** 汉明距离（hex 字符串对）；任一为 null 返回 Infinity（不可比） */
export function hamming(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { dist += x & 1; x >>= 1; }
  }
  return dist;
}

/** 感知重复判定阈值：64 位指纹中不同位数 ≤ 6（≈90% 相似）视为同一张图的变体 */
export const SIMILAR_THRESHOLD = 6;

/**
 * 在 meta.images 里查找与 (sha256hex16, phash) 感知/字节重复的已有条目。
 * 字节命中优先（完全相同），其次感知命中（汉明 ≤ 阈值）。
 * 返回 { hash, info, kind: 'exact' | 'similar' } 或 null。
 */
export function findDuplicate(meta, hash16, phash) {
  if (meta.images?.[hash16]) {
    return { hash: hash16, info: meta.images[hash16], kind: 'exact' };
  }
  if (phash) {
    for (const [h, info] of Object.entries(meta.images || {})) {
      if (!info.phash) continue;
      if (hamming(phash, info.phash) <= SIMILAR_THRESHOLD) {
        return { hash: h, info, kind: 'similar' };
      }
    }
  }
  return null;
}

/** 图片魔数 → 扩展名（与 fetch-gallery 一致） */
export function magicExt(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return '.jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50) return '.png';
  if (buf[0] === 0x52 && buf[1] === 0x49) return '.webp';
  if (buf[0] === 0x47 && buf[1] === 0x49) return '.gif';
  return null;
}

/** 从文件读取并计算 phash 的便捷封装 */
export function dHashFromFile(filePath) {
  return dHash(filePath);
}
