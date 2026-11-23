// 探 dlbook 默认分支 + cppthings contents 列举
import fs from 'fs';
import { execFileSync } from 'child_process';
const T = process.env.GITHUB_TOKEN || '';
function api(p) {
  return JSON.parse(execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
    `https://api.github.com${p}`], { maxBuffer: 16 * 1024 * 1024, encoding: 'utf8' }));
}
const out = [];
try {
  const repo = api('/repos/fengdu78/deeplearning_ai_book');
  out.push(`dlbook default_branch: ${repo.default_branch}, size: ${repo.size}KB`);
  const files = tree('fengdu78/deeplearning_ai_book', repo.default_branch);
  out.push(`dlbook md (${files.length}): ${files.slice(0, 10).join(' | ')}`);
} catch (e) { out.push('dlbook ERR: ' + e.message.slice(0, 80)); }
try {
  const cnt = api('/repos/Light-City/CPlusPlusThings/contents/basic_content');
  const dirs = cnt.filter(x => x.type === 'dir').map(x => x.name);
  out.push(`cppthings basic_content dirs (${dirs.length}): ${dirs.slice(0, 15).join(', ')}`);
  // 列第一个子目录的文件
  if (dirs.length) {
    const sub = api(`/repos/Light-City/CPlusPlusThings/contents/basic_content/${dirs[0]}`);
    out.push(`sample ${dirs[0]}: ` + sub.filter(x => x.type === 'file').map(x => x.path).join(' | ').slice(0, 200));
  }
} catch (e) { out.push('cppthings ERR: ' + e.message.slice(0, 80)); }
fs.writeFileSync('scripts/.probe-fix2.txt', out.join('\n'));
console.log('ok');
function tree(repo, br) {
  const r = execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
    `https://api.github.com/repos/${repo}/git/trees/${br}?recursive=1`], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });
  return JSON.parse(r).tree.filter(t => t.type === 'blob' && /\.md$/i.test(t.path)).map(t => t.path);
}
