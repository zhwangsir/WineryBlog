// 批量探仓库树 → 输出到文件（UTF-8）
import fs from 'fs';
import { execFileSync } from 'child_process';
const T = process.env.GITHUB_TOKEN || '';
function tree(repo, br) {
  try {
    const r = execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
      `https://api.github.com/repos/${repo}/git/trees/${br}?recursive=1`], { maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' });
    const j = JSON.parse(r);
    return (j.tree || []).filter(t => t.type === 'blob' && /\.md$/i.test(t.path)).map(t => t.path);
  } catch (e) { return ['ERR: ' + e.message.slice(0, 60)]; }
}
const out = [];
const probes = [
  ['leedl', 'datawhalechina/leedl-tutorial', 'main', ''],
  ['easyrl', 'datawhalechina/easy-rl', 'master', 'docs/'],
  ['py100', 'jackfrued/Python-100-Days', 'master', 'Day01-15/'],
  ['flutteria', 'flutterchina/flutter-in-action', 'master', 'docs/'],
  ['promguru', 'datawhalechina/pumpkin-book', 'main', ''],
  ['linuxcmd', 'jaywcjlove/linux-command', 'master', 'command/'],
  ['docker', 'yeasy/docker_practice', 'master', ''],
  ['golang', 'draveness/golang', 'master', 'src/'],
  ['cppthings', 'Light-City/CPlusPlusThings', 'master', 'basic_content/'],
  ['jstut', 'wangdoc/javascript-tutorial', 'master', 'docs/'],
  ['dockeroff', 'docker/getting-started', 'master', ''],
];
for (const [id, repo, br, dir] of probes) {
  const files = tree(repo, br);
  const inDir = dir ? files.filter(f => f.startsWith(dir) && !f.endsWith('README.md')) : files;
  out.push(`\n== ${id}（${inDir.length}）==`);
  out.push(inDir.slice(0, r(15)).join('\n'));
}
function r(n) { return n; }
fs.writeFileSync(process.env.OUT || 'probe-out.txt', out.join('\n'));
