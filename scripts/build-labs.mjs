// 汇编实验内容：scripts/labs-src/<环境>/<实验>/ → server/data/labs.json
//
// 每个实验一个目录（目录名 = 实验 id）：
//   lab.json      元数据 + 步骤 + 验收清单（格式见 scripts/labs-src/README.md）
//   files/        起始代码，文件扩展名决定语言
//   solution/     参考答案（真实运行的环境必须有）
//   seed.sql      可选（sql 环境）：这一实验专用的建表与数据，覆盖环境默认库
//   snippets/     步骤里引用的示例代码（"snippet": "snippets/step1.js"）
//
// 构建时校验：字段齐全、id 与目录一致、真实运行的实验有起始代码和参考答案、
// 任何文件里都不允许出现站外地址（实验内容必须在本地、读者任何点击都不出站）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'scripts', 'labs-src');
const OUT = path.join(ROOT, 'server', 'data', 'labs.json');

const LANG = {
  html: 'html', htm: 'html', css: 'css', js: 'javascript', mjs: 'javascript', ts: 'typescript',
  py: 'python', sql: 'sql', md: 'markdown', sh: 'shell', bash: 'shell', java: 'java', jsh: 'java', kt: 'kotlin', kts: 'kotlin',
  json: 'json', yaml: 'yaml', yml: 'yaml', txt: 'text',
};
const LEVELS = ['入门', '进阶', '挑战'];
const REAL = new Set(['web', 'js', 'python', 'sql', 'ai']);

const errors = [];
const fail = (id, msg) => errors.push(`${id}: ${msg}`);

/** 站外地址：只放行本机地址 */
const OUTBOUND = /(?:https?:)?\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+|www\.[a-z0-9-]+\.[a-z]+/i;
const hasOutbound = (text) => {
  const local = /(?:https?:)?\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?![a-z0-9.-])/gi;
  return OUTBOUND.test(String(text).replace(local, '//LOCALHOST'));
};

const readDir = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []);
/**
 * 环境目录下的示例子目录。目录里的文件（如 sql/seed.sql）和以 _ 开头的目录
 * （_starter：空白练习的起步代码）不是示例
 */
const labDirs = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_')).map((d) => d.name).sort() : []);
const ext = (name) => LANG[(name.split('.').pop() || '').toLowerCase()] || 'text';
const readText = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const collect = (dir) => readDir(dir).filter((f) => !f.startsWith('.')).map((name) => ({ name, lang: ext(name), content: readText(path.join(dir, name)) }));

const envs = JSON.parse(readText(path.join(SRC, 'envs.json')));
const envById = new Map(envs.map((e) => [e.id, e]));
for (const e of envs) {
  if (!e.id || !e.name || !e.runner) fail(`envs.json/${e.id}`, '环境缺 id / name / runner');
}
if (envById.size !== envs.length) fail('envs.json', '环境 id 重复');

const labs = {};
for (const env of envs) {
  const envDir = path.join(SRC, env.id);

  // 空白练习的起步代码：打开环境时编辑器里的初始内容。想练什么由读者决定，这里只给一个能跑通的最简示例
  const blank = collect(path.join(envDir, '_starter'));
  if (!blank.length) fail(`envs.json/${env.id}`, '环境缺少 _starter/ 起步代码');
  for (const f of blank) {
    if (hasOutbound(f.content)) fail(`envs.json/${env.id}`, `_starter/${f.name} 里出现了站外地址（实验内容必须在本地）`);
  }
  env.blank = blank;

  for (const dir of labDirs(envDir)) {
    const id = dir;
    const labDir = path.join(envDir, dir);
    const metaFile = path.join(labDir, 'lab.json');
    if (!fs.existsSync(metaFile)) { fail(id, `缺少 lab.json`); continue; }
    let meta;
    try { meta = JSON.parse(readText(metaFile)); }
    catch (e) { fail(id, `lab.json 不是合法 JSON：${e.message}`); continue; }

    if (meta.id !== id) fail(id, `lab.json 的 id（${meta.id}）必须与目录名（${id}）一致`);
    for (const k of ['title', 'summary', 'goal']) {
      if (typeof meta[k] !== 'string' || !meta[k].trim()) fail(id, `缺少 ${k}`);
    }
    if (typeof meta.minutes !== 'number' || meta.minutes <= 0) fail(id, 'minutes 必须是正数');
    if (!LEVELS.includes(meta.level)) fail(id, `level 必须是 ${LEVELS.join(' / ')}`);
    if (meta.sim !== undefined && (typeof meta.sim !== 'object' || meta.sim === null || Array.isArray(meta.sim))) fail(id, 'sim 必须是对象，例如 { "setup": "…" }');
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    if (!Array.isArray(meta.tags)) fail(id, 'tags 必须是数组');
    if (tags.some((t) => typeof t !== 'string' || !t.trim())) fail(id, 'tags 里不能有空值');

    const steps = Array.isArray(meta.steps) ? meta.steps : [];
    if (steps.length < 2) fail(id, '至少要有 2 个步骤');
    steps.forEach((s, i) => {
      for (const k of ['title', 'detail', 'check']) {
        if (typeof s[k] !== 'string' || !s[k].trim()) fail(id, `步骤 ${i + 1} 缺少 ${k}`);
      }
      if (s.snippet) {
        const f = path.join(labDir, s.snippet);
        if (!fs.existsSync(f)) fail(id, `步骤 ${i + 1} 引用的 snippet 不存在：${s.snippet}`);
        else s.code = readText(f);
      }
    });
    const verify = Array.isArray(meta.verify) ? meta.verify : [];
    if (verify.length < 2) fail(id, '验收清单至少要有 2 条');
    verify.forEach((v, i) => { if (typeof v !== 'string' || !v.trim()) fail(id, `验收清单第 ${i + 1} 条为空`); });

    const files = collect(path.join(labDir, 'files'));
    const solution = collect(path.join(labDir, 'solution'));
    if (REAL.has(env.id) && !files.length) fail(id, '真实运行的实验必须提供 files/ 起始代码');
    if (REAL.has(env.id) && !solution.length) fail(id, '真实运行的实验必须提供 solution/ 参考答案');
    for (const f of [...files, ...solution]) {
      if (hasOutbound(f.content)) fail(id, `${f.name} 里出现了站外地址（实验内容必须在本地）`);
    }
    if (env.id === 'web' && files.length && !files.some((f) => f.lang === 'html')) fail(id, '前端实验的起始代码要包含 index.html');

    const seedFile = path.join(labDir, 'seed.sql');
    const seed = fs.existsSync(seedFile) ? readText(seedFile) : undefined;

    // 示例代码与仿真环境设定里的文字同样不能出现站外地址
    for (const [i, s] of steps.entries()) {
      if (s.code && hasOutbound(s.code)) fail(id, `步骤 ${i + 1} 的示例代码里出现了站外地址`);
    }
    const texts = [meta.title, meta.summary, meta.goal, meta.hint, ...tags,
      ...steps.flatMap((s) => [s.title, s.detail, s.check, s.hint]), ...verify,
      ...Object.values(meta.sim || {}).flatMap((v) => (Array.isArray(v) ? v : [v]))];
    for (const t of texts) {
      if (typeof t === 'string' && hasOutbound(t)) fail(id, `文字里出现了站外地址：「${t.slice(0, 40)}…」`);
    }

    if (labs[id]) fail(id, '实验 id 重复');
    labs[id] = {
      id,
      env: env.id,
      ...(meta.post ? { post: meta.post } : {}),
      title: meta.title.trim(),
      summary: meta.summary.trim(),
      goal: meta.goal.trim(),
      minutes: meta.minutes,
      level: meta.level,
      tags,
      order: typeof meta.order === 'number' ? meta.order : 100,
      ...(files.length ? { files } : {}),
      ...(solution.length ? { solution } : {}),
      ...(meta.solutionNotes ? { solutionNotes: meta.solutionNotes } : {}),
      steps: steps.map(({ snippet, ...s }) => s),
      verify,
      ...(seed ? { seed } : {}),
      ...(meta.sim ? { sim: meta.sim } : {}),
      ...(env.sim ? { simEnv: env.sim.title } : {}),
    };
  }
}

// 环境默认的 SQL 练习库
const seedDefault = path.join(SRC, 'sql', 'seed.sql');
const defaultSeed = fs.existsSync(seedDefault) ? readText(seedDefault) : '';

if (errors.length) {
  console.error(`labs 构建失败，共 ${errors.length} 处：`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

const orderOf = (lab) => envById.get(lab.env).order * 1000 + lab.order;
const sorted = Object.values(labs).sort((a, b) => orderOf(a) - orderOf(b) || a.id.localeCompare(b.id));
const out = {
  v: 2,
  builtAt: new Date().toISOString(),
  defaultSeed,
  envs: envs.map(({ sim, ...e }) => ({ ...e, sim, labCount: sorted.filter((l) => l.env === e.id).length })),
  labs: Object.fromEntries(sorted.map((l) => [l.id, l])),
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const perEnv = envs.map((e) => `${e.name} ${sorted.filter((l) => l.env === e.id).length}`).join(' · ');
console.log(`labs.json 已生成：${envs.length} 个环境 / ${sorted.length} 个可选示例（${perEnv}）`);
