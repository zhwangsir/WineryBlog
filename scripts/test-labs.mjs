// 实验内容的运行校验：把起始代码和参考答案真正跑一遍（构建校验只查结构与字段）。
//   js     → 在 Node 里按 ES 模块执行（支持顶层 await，与页面里的运行器一致），超时或报错即失败
//   sql    → 用 sql.js（与页面同一个引擎）先灌入练习库，再执行查询，报错即失败
//   python → 用站内的 Pyodide 在 Node 里执行；参考答案还会逐行对照注释里的「# → 预期输出」
// 前端 / AI 提示词 / 仿真终端的实验需要在页面上人工验收，这里不覆盖。
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'scripts', 'labs-src');
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const dirs = (d) => (fs.existsSync(d) ? fs.readdirSync(d).sort() : []);

let failed = 0;
const bad = (msg) => { failed += 1; console.error('  ✗ ' + msg); };
const ok = (msg) => console.log('  ✓ ' + msg);

// ── JavaScript ──
console.log('JavaScript');
for (const id of dirs(path.join(SRC, 'js'))) {
  for (const kind of ['files', 'solution']) {
    const file = path.join(SRC, 'js', id, kind, 'main.js');
    if (!fs.existsSync(file)) continue;
    const r = spawnSync(process.execPath, ['--input-type=module'], { input: read(file), encoding: 'utf8', timeout: 6000 });
    if (r.error && r.error.code === 'ETIMEDOUT') bad(`${id} · ${kind}：6 秒内没有结束（页面上的运行器 8 秒后会强制终止）`);
    else if (r.status !== 0) bad(`${id} · ${kind}：执行出错\n${(r.stderr || '').trim().split('\n').slice(0, 4).join('\n')}`);
    else ok(`${id} · ${kind}${kind === 'solution' ? ' → ' + (r.stdout || '').trim().replace(/\s+/g, ' ').slice(0, 110) : ''}`);
  }
}

// ── SQL ──
const SQLlabs = dirs(path.join(SRC, 'sql'));
if (SQLlabs.length) {
  console.log('SQLite');
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const defaultSeed = fs.existsSync(path.join(SRC, 'sql', 'seed.sql')) ? read(path.join(SRC, 'sql', 'seed.sql')) : '';
  for (const id of SQLlabs) {
    const seedFile = path.join(SRC, 'sql', id, 'seed.sql');
    const seed = fs.existsSync(seedFile) ? read(seedFile) : defaultSeed;
    const run = (sql, label) => {
      const db = new SQL.Database();
      try {
        db.exec(seed);
        const res = db.exec(sql);
        const rows = res.reduce((a, r) => a + r.values.length, 0);
        ok(`${id} · ${label} → ${res.length} 个结果集，共 ${rows} 行`);
      } catch (e) {
        bad(`${id} · ${label}：${e.message}`);
      } finally { db.close(); }
    };
    for (const kind of ['files', 'solution']) {
      const file = path.join(SRC, 'sql', id, kind, 'query.sql');
      if (fs.existsSync(file)) run(read(file), kind);
    }
  }
}

// ── Python ──
// 用站内 public/vendor/pyodide/ 里的 Pyodide（npm run labs:pyodide 下载的那份）在 Node 里真实执行
const PYlabs = dirs(path.join(SRC, 'python'));
console.log('Python');
if (!PYlabs.length) console.log('  · 没有实验');
else {
  const pyEntry = path.join(ROOT, 'public', 'vendor', 'pyodide', 'pyodide.mjs');
  if (!fs.existsSync(pyEntry)) {
    failed += 1;
    console.error('  ✗ 找不到 Python 引擎：先执行 npm run labs:pyodide');
  } else {
    // pyodide.asm.js 的 Node 胶水是按 CommonJS 写的（直接用 require 和 __dirname），在 ES 模块里先补上这两个全局
    const pyDir = path.join(ROOT, 'public', 'vendor', 'pyodide');
    globalThis.require ??= require;
    globalThis.__dirname ??= pyDir;
    const { loadPyodide } = await import(pathToFileURL(path.join(pyDir, 'pyodide.mjs')).href);
    const py = await loadPyodide();
    let printed = [];
    py.setStdout({ batched: (s) => printed.push(String(s)) });
    for (const id of PYlabs) {
      for (const kind of ['files', 'solution']) {
        const file = path.join(SRC, 'python', id, kind, 'main.py');
        if (!fs.existsSync(file)) continue;
        const src = read(file);
        printed = [];
        const ns = py.globals.get('dict')();          // 每个实验用独立的命名空间
        try {
          await py.runPythonAsync(src, { globals: ns });
          // 参考答案里的「# → 预期输出」逐行对照（多行输出用 | 分隔）；起始代码只要求能跑
          const expect = [];
          if (kind === 'solution') {
            for (const line of src.split('\n')) {
              const m = line.match(/#\s*→\s*(.*)$/);
              if (m) expect.push(...m[1].split(' | ').map((s) => s.replace(/（[^（）]*）$/, '').trim()));
            }
          }
          const real = printed.map((s) => s.replace(/\n$/, '')).flatMap((s) => s.split('\n'));
          const mism = [];
          for (let i = 0; i < Math.max(expect.length, real.length); i++) if (expect[i] !== undefined && expect[i] !== real[i]) mism.push(`第 ${i + 1} 行  注释: ${expect[i]}  实际: ${real[i]}`);
          if (mism.length) bad(`${id} · ${kind}：注释里的预期输出与实际不一致\n${mism.slice(0, 5).map((m) => '      ' + m).join('\n')}`);
          else ok(`${id} · ${kind}${expect.length ? ` → ${expect.length} 行输出与注释一致` : ' → 运行无报错'}`);
        } catch (e) {
          bad(`${id} · ${kind}：执行出错\n${String(e.message || e).split('\n').filter(Boolean).slice(-3).join('\n')}`);
        } finally { ns.destroy(); }
      }
    }
  }
}

if (failed) { console.error(`\n${failed} 项未通过`); process.exit(1); }
console.log('\n全部通过');
