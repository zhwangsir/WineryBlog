// 探 JavaGuide / tstut 结构
import { execFileSync } from 'child_process';
import fs from 'fs';
const T = process.env.GITHUB_TOKEN || '';
function tree(repo, br) {
  const r = execFileSync('curl', ['-sL', '-H', 'Authorization: Bearer ' + T,
    `https://api.github.com/repos/${repo}/git/trees/${br}?recursive=1`], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });
  const j = JSON.parse(r);
  return (j.tree || []).filter(t => t.type === 'blob' && /\.md$/i.test(t.path)).map(t => t.path);
}
const out = [];
const jg = tree('Snailclimb/JavaGuide', 'main').filter(f => f.startsWith('docs/java/'));
out.push('== javaguide docs/java (' + jg.length + ') ==');
out.push(jg.slice(0, 30).join('\n'));
const ts = tree('wangdoc/typescript-tutorial', 'main');
out.push('\n== tstut main (' + ts.length + ') ==');
out.push(ts.slice(0, 12).join('\n'));
fs.writeFileSync('scripts/.probe2.txt', out.join('\n'));
console.log('ok');
