// 准备 Pyodide（浏览器里的 CPython）核心文件到 public/vendor/pyodide/。
// 一共 5 个文件约 13 MB，属于二进制依赖，不进 git：新环境首次使用 Python 实验前执行一次
//   npm run labs:pyodide      （或 node scripts/fetch-pyodide.mjs）
// 优先从 npm 取（走本机配置的 registry / 镜像，快），失败再回退到 jsDeliv 逐个下载（国内很慢）。
// 站内运行时全部读本地文件，不回源到 CDN。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const VERSION = '0.27.7';
const CDN = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'vendor', 'pyodide');
const FILES = [
  'pyodide.js',            // 浏览器里的加载入口（运行器的 Worker 用 importScripts 加载它）
  'pyodide.mjs',           // Node 里的入口：scripts/test-labs.mjs 用它在 Node 里真实执行 Python 实验
  'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json',
];
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

fs.mkdirSync(OUT, { recursive: true });
const have = FILES.filter((f) => fs.existsSync(path.join(OUT, f)) && fs.statSync(path.join(OUT, f)).size > 0);
if (have.length === FILES.length) {
  console.log(`Pyodide ${VERSION} 已经就绪：${path.relative(ROOT, OUT)}`);
  process.exit(0);
}

/** 从 npm 取包并解出需要的文件 */
function viaNpm() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pyodide-'));
  try {
    // 找 npm-cli.js：npm run 执行时 npm_execpath 直接给出；否则看当前 node 旁边的 npm
    //（标准发行版与便携版都是 <node 目录>/node_modules/npm/bin/npm-cli.js）；都没有再退回到 PATH 里的 npm
    //（Windows 上 PATH 里的 npm 是 .cmd，不能直接 spawn，要经由 cmd /c）
    const candidates = [
      process.env.npm_execpath,
      path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    ].filter(Boolean);
    const npmCli = candidates.find((p) => fs.existsSync(p));
    const args = ['pack', `pyodide@${VERSION}`, '--pack-destination', tmp, '--silent'];
    const io = { stdio: ['ignore', 'ignore', 'inherit'] };
    const r = npmCli
      ? spawnSync(process.execPath, [npmCli, ...args], io)
      : process.platform === 'win32'
        ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'npm', ...args], io)
        : spawnSync('npm', args, io);
    if (r.error) throw new Error(`无法启动 npm：${r.error.message}`);
    if (r.status !== 0) throw new Error(`npm pack 退出码 ${r.status}`);
    const tgz = path.join(tmp, `pyodide-${VERSION}.tgz`);
    if (!fs.existsSync(tgz)) throw new Error('npm pack 没有生成压缩包');
    const x = spawnSync('tar', ['-xzf', tgz, '-C', tmp], { stdio: 'inherit' });
    if (x.status !== 0) throw new Error('解压失败（需要 tar 命令）');
    for (const f of FILES) {
      const src = path.join(tmp, 'package', f);
      if (!fs.existsSync(src)) throw new Error(`压缩包里没有 ${f}`);
      fs.copyFileSync(src, path.join(OUT, f));
      console.log(`✓ ${f}（${mb(fs.statSync(src).size)}）`);
    }
    return true;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** 回退：从 CDN 逐个下载 */
async function viaCdn() {
  for (const f of FILES) {
    if (have.includes(f)) { console.log(`· ${f} 已存在`); continue; }
    process.stdout.write(`↓ 从 CDN 下载 ${f} … `);
    const res = await fetch(CDN + f);
    if (!res.ok) { console.error(`✗ HTTP ${res.status}`); process.exit(1); }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(OUT, f), buf);
    console.log(`${mb(buf.length)}`);
  }
}

try {
  viaNpm();
  console.log('来源：npm');
} catch (e) {
  console.warn(`npm 方式不可用（${e.message}），改为从 CDN 下载，可能较慢…`);
  await viaCdn();
}
fs.writeFileSync(path.join(OUT, 'VERSION'), VERSION);
console.log(`Pyodide ${VERSION} 就绪：${path.relative(ROOT, OUT)}`);
