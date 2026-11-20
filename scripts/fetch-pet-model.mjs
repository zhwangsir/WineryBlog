// Download the HuTao Live2D (Cubism 3) model into public/live2d/hutao/
// Source: zeankundev/HuTao-Live2D (community model, miHoYo asset — internal use only)
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'live2d', 'hutao');
const BASE = 'https://raw.githubusercontent.com/zeankundev/HuTao-Live2D/main';
const PROXY = process.env.FETCH_PROXY || 'http://127.0.0.1:33210';

// remote path -> local path (spaces stripped for URL safety)
const FILES = {
  'Hu Tao.model3.json': 'HuTao.model3.json',
  'Hu Tao.moc3': 'HuTao.moc3',
  'Hu Tao.physics3.json': 'HuTao.physics3.json',
  'Hu Tao.2048/texture_00.png': 'textures/texture_00.png',
};

function fetchBin(remote, local) {
  const dest = path.join(OUT, local);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const url = `${BASE}/${remote.replace(/ /g, '%20')}`;
  try {
    execFileSync('curl', ['-sL', '--max-time', '120', '--proxy', PROXY, '-o', dest, url], { stdio: 'pipe' });
  } catch {
    // direct without proxy as fallback
    execFileSync('curl', ['-sL', '--max-time', '120', '-o', dest, url], { stdio: 'pipe' });
  }
  const size = fs.statSync(dest).size;
  if (size < 50) throw new Error(`too small: ${local} (${size}B)`);
  console.log(`ok ${local} (${(size / 1024).toFixed(0)}KB)`);
}

fs.mkdirSync(OUT, { recursive: true });
for (const [remote, local] of Object.entries(FILES)) fetchBin(remote, local);

// rewrite the model3.json: clean references + enable standard eye-blink params
const model3 = {
  Version: 3,
  FileReferences: {
    Moc: 'HuTao.moc3',
    Textures: ['textures/texture_00.png'],
    Physics: 'HuTao.physics3.json',
  },
  Groups: [
    { Target: 'Parameter', Name: 'EyeBlink', Ids: ['ParamEyeLOpen', 'ParamEyeROpen'] },
  ],
  HitAreas: [{ Id: 'Head', Name: 'head' }, { Id: 'Body', Name: 'body' }],
};
fs.writeFileSync(path.join(OUT, 'HuTao.model3.json'), JSON.stringify(model3, null, 2));
console.log('written HuTao.model3.json (rewritten refs + eyeblink)');

// credits
fs.writeFileSync(path.join(OUT, 'CREDITS.md'),
  `# 胡桃 Live2D 模型\n\n- 来源: https://github.com/zeankundev/HuTao-Live2D\n- 版权: 原神角色资产 © miHoYo / HoYoverse，仅限本站内网自用，禁止分发\n`);
console.log('done');
