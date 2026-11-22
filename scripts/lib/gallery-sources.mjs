// 图床图源定义（共享）：内置源 + sources.json 读写
// 实测记录（2026-11-22）：以下端点均验证返回图片；yeqing 限流 20 次/10s（抓取节流 800ms）
import fs from 'fs';

export const BUILTIN_SOURCES = [
  { id: 'uapis-acg',     name: 'Uapis·二次元',    category: 'acg',       endpoint: 'https://uapis.cn/api/v1/random/image?category=acg',       type: 'binary', enabled: true, builtin: true },
  { id: 'uapis-scenery', name: 'Uapis·风景',      category: 'scenery',   endpoint: 'https://uapis.cn/api/v1/random/image?category=landscape', type: 'binary', enabled: true, builtin: true },
  { id: 'uapis-random',  name: 'Uapis·综合随机',  category: 'wallpaper', endpoint: 'https://uapis.cn/api/v1/random/image',                     type: 'binary', enabled: true, builtin: true },
  { id: 'yeqing-pc',     name: '叶清·二次元横图', category: 'acg',       endpoint: 'https://api.yppp.net/pc',                                  type: 'binary', enabled: true, builtin: true },
  { id: 'yeqing-pe',     name: '叶清·二次元竖图', category: 'acg',       endpoint: 'https://api.yppp.net/pe',                                  type: 'binary', enabled: true, builtin: true },
  { id: 'imlcd-acg',     name: '忆梦云·二次元',   category: 'acg',       endpoint: 'https://api.imlcd.cn/bg/acg.php?return=img',               type: 'binary', enabled: true, builtin: true },
  { id: 'imlcd-gq',      name: '忆梦云·高清风景', category: 'scenery',   endpoint: 'https://api.imlcd.cn/bg/gq.php?return=img',                type: 'binary', enabled: true, builtin: true },
  { id: 'imlcd-high',    name: '忆梦云·必应每日', category: 'wallpaper', endpoint: 'https://api.imlcd.cn/bg/high.php?return=img',              type: 'binary', enabled: true, builtin: true },
  { id: 'imlcd-mc',      name: '忆梦云·MC 风景',  category: 'wallpaper', endpoint: 'https://api.imlcd.cn/bg/mc.php?return=img',                type: 'binary', enabled: true, builtin: true },
];

export const GALLERY_CATS = { acg: '二次元', scenery: '风景', wallpaper: '综合壁纸' };

/**
 * 读取 sources.json；不存在则写入内置源；存在则补齐缺失的内置源（不覆盖用户改动）
 */
export function ensureSourcesFile(galleryDir) {
  const file = `${galleryDir}/sources.json`;
  let existing = null;
  try {
    existing = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    existing = null;
  }
  const list = Array.isArray(existing?.sources) ? existing.sources : [];
  const haveIds = new Set(list.map(s => s.id));
  let changed = false;
  for (const b of BUILTIN_SOURCES) {
    if (!haveIds.has(b.id)) {
      list.push({ ...b });
      changed = true;
    }
  }
  if (!existing || changed) {
    fs.mkdirSync(galleryDir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ updatedAt: new Date().toISOString(), sources: list }, null, 1));
  }
  return list;
}
