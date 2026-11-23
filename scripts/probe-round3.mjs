import fs from 'fs';
import { execFileSync } from 'child_process';
const T = process.env.GITHUB_TOKEN || '';
function tree(repo, br) {
  const r = execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
    `https://api.github.com/repos/${repo}/git/trees/${br}?recursive=1`], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });
  const j = JSON.parse(r);
  return (j.tree || []).filter(t => t.type === 'blob' && /\.md$/i.test(t.path)).map(t => t.path);
}
function defBranch(repo) {
  const r = JSON.parse(execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
    `https://api.github.com/repos/${repo}`], { maxBuffer: 8 * 1024 * 1024, encoding: 'utf8' }));
  return r.default_branch;
}
const out = [];
for (const [id, repo] of [
  ['vuezh', 'vuejs-translations/zh-docs'],
  ['reactzh', 'reactjs/zh-hans.react.dev'],
  ['leedl', 'datawhalechina/leedl-tutorial'],
  ['dunwublog', 'dunwu/blog'],
]) {
  try {
    const br = defBranch(repo);
    const files = tree(repo, br);
    out.push(`== ${id}（${repo}@${br}，${files.length} md）==`);
    out.push(files.slice(0, 14).join('\n'));
  } catch (e) { out.push(`== ${id} ERR: ${e.message.slice(0, 60)} ==`); }
}
fs.writeFileSync('scripts/.probe-r3.txt', out.join('\n'));
console.log('ok');
