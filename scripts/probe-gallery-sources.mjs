// 实测候选图源：返回类型/可用性/耗时
import { execFileSync } from 'child_process';

const SOURCES = [
  { id: 'yeqing-pc', url: 'https://api.yppp.net/pc', type: 'binary' },
  { id: 'yeqing-pe', url: 'https://api.yppp.net/pe', type: 'binary' },
  { id: 'yeqing-pc-json', url: 'https://api.yppp.net/pc?return=json', type: 'json' },
  { id: 'imlcd-acg', url: 'https://api.imlcd.cn/bg/acg.php?return=img', type: 'binary' },
  { id: 'imlcd-gq', url: 'https://api.imlcd.cn/bg/gq.php?return=img', type: 'binary' },
  { id: 'imlcd-high', url: 'https://api.imlcd.cn/bg/high.php?return=img', type: 'binary' },
  { id: 'imlcd-mc', url: 'https://api.imlcd.cn/bg/mc.php?return=img', type: 'binary' },
  { id: 'uapis-acg', url: 'https://uapis.cn/api/v1/random/image?category=acg', type: 'binary' },
];

const isImg = (buf) => buf.length > 10000 && (
  (buf[0] === 0xff && buf[1] === 0xd8) || (buf[0] === 0x89 && buf[1] === 0x50) ||
  (buf[0] === 0x52 && buf[1] === 0x49) || (buf[0] === 0x47 && buf[1] === 0x49)
);

for (const s of SOURCES) {
  const t0 = Date.now();
  try {
    const buf = execFileSync('curl', ['-sL', '--max-time', '30', '-o', '-', s.url], { maxBuffer: 64 * 1024 * 1024, encoding: 'buffer' });
    const ms = Date.now() - t0;
    if (s.type === 'json') {
      const text = buf.toString('utf8').slice(0, 200);
      console.log(`${s.id}: JSON ${ms}ms -> ${text}`);
    } else {
      console.log(`${s.id}: ${isImg(buf) ? 'IMAGE-OK' : 'NOT-IMAGE'} ${Math.round(buf.length / 1024)}KB ${ms}ms head=${buf.slice(0, 3).toString('hex')}`);
    }
  } catch (e) {
    console.log(`${s.id}: FAIL ${String(e.message).slice(0, 60)}`);
  }
}
