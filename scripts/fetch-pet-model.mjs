// Download Live2D pet models into public/live2d/
// - hutao: zeankundev/HuTao-Live2D (community, miHoYo asset — internal use)
// - haru:  guansss/pixi-live2d-display test asset (official Live2D sample "Haru", with motions)
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'live2d');
const PROXY = process.env.FETCH_PROXY || 'http://127.0.0.1:33210';

function curl(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    execFileSync('curl', ['-sL', '--max-time', '120', '--proxy', PROXY, '-o', dest, url], { stdio: 'pipe' });
  } catch {
    execFileSync('curl', ['-sL', '--max-time', '120', '-o', dest, url], { stdio: 'pipe' });
  }
  const size = fs.statSync(dest).size;
  if (size < 50) throw new Error(`too small: ${path.basename(dest)} (${size}B)`);
  return size;
}

function ghList(repo, dir) {
  const url = `https://api.github.com/repos/${repo}/contents/${dir}`;
  const out = path.join(OUT, '.tmp-list.json');
  try {
    execFileSync('curl', ['-sL', '--max-time', '60', '--proxy', PROXY, '-o', out, url], { stdio: 'pipe' });
  } catch {
    execFileSync('curl', ['-sL', '--max-time', '60', '-o', out, url], { stdio: 'pipe' });
  }
  const j = JSON.parse(fs.readFileSync(out, 'utf-8'));
  return Array.isArray(j) ? j : [];
}

// ---- hutao (skip if already present) ----
const hutaoJson = path.join(OUT, 'hutao', 'HuTao.model3.json');
if (fs.existsSync(hutaoJson)) {
  console.log('hutao: already present, skip');
} else {
  const BASE = 'https://raw.githubusercontent.com/zeankundev/HuTao-Live2D/main';
  const FILES = {
    'Hu Tao.model3.json': 'HuTao.model3.json',
    'Hu Tao.moc3': 'HuTao.moc3',
    'Hu Tao.physics3.json': 'HuTao.physics3.json',
    'Hu Tao.2048/texture_00.png': 'textures/texture_00.png',
  };
  for (const [remote, local] of Object.entries(FILES)) {
    const size = curl(`${BASE}/${remote.replace(/ /g, '%20')}`, path.join(OUT, 'hutao', local));
    console.log(`hutao ok ${local} (${(size / 1024).toFixed(0)}KB)`);
  }
  fs.writeFileSync(path.join(OUT, 'hutao', 'HuTao.model3.json'), JSON.stringify({
    Version: 3,
    FileReferences: {
      Moc: 'HuTao.moc3',
      Textures: ['textures/texture_00.png'],
      Physics: 'HuTao.physics3.json',
    },
    Groups: [{ Target: 'Parameter', Name: 'EyeBlink', Ids: ['ParamEyeLOpen', 'ParamEyeROpen'] }],
    HitAreas: [{ Id: 'Head', Name: 'head' }, { Id: 'Body', Name: 'body' }],
  }, null, 2));
  fs.writeFileSync(path.join(OUT, 'hutao', 'CREDITS.md'),
    '# 胡桃 Live2D 模型\n\n- 来源: https://github.com/zeankundev/HuTao-Live2D\n- 版权: 原神角色资产 © miHoYo / HoYoverse，仅限本站内网自用，禁止分发\n');
  console.log('hutao done');
}

// ---- haru (official Live2D sample, with motions — more lively than hutao) ----
const HARU_REPO = 'guansss/pixi-live2d-display';
const HARU_DIR = 'test/assets/haru';
const haruOut = path.join(OUT, 'haru');
const entries = ghList(HARU_REPO, HARU_DIR);

function downloadDir(dir, localDir) {
  for (const e of ghList(HARU_REPO, dir)) {
    if (e.type === 'file') {
      const local = path.join(haruOut, localDir, e.name);
      if (fs.existsSync(local) && fs.statSync(local).size === e.size) continue;
      const size = curl(`https://raw.githubusercontent.com/${HARU_REPO}/master/${dir}/${e.name.replace(/ /g, '%20')}`, local);
      console.log(`haru ok ${localDir}/${e.name} (${(size / 1024).toFixed(0)}KB)`);
    } else if (e.type === 'dir') {
      downloadDir(`${dir}/${e.name}`, path.join(localDir, e.name));
    }
  }
}

let model3File = null;
for (const e of entries) {
  if (e.type === 'file') {
    const local = path.join(haruOut, e.name);
    const size = curl(`https://raw.githubusercontent.com/${HARU_REPO}/master/${HARU_DIR}/${e.name.replace(/ /g, '%20')}`, local);
    if (e.name.endsWith('.model3.json')) model3File = e.name;
    console.log(`haru ok ${e.name} (${(size / 1024).toFixed(0)}KB)`);
  } else if (e.type === 'dir') {
    downloadDir(`${HARU_DIR}/${e.name}`, e.name);
  }
}
console.log('haru done, model3:', model3File);

console.log('\nall models ready');
