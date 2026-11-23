// 第二批候选仓库路径探查
import fs from 'fs';
import { execFileSync } from 'child_process';
const T = process.env.GITHUB_TOKEN || '';
function tree(repo, br) {
  try {
    const r = execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
      `https://api.github.com/repos/${repo}/git/trees/${br}?recursive=1`], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });
    const j = JSON.parse(r);
    const files = (j.tree || []).filter(t => t.type === 'blob' && /\.md$/i.test(t.path)).map(t => t.path);
    return { files, truncated: !!j.truncated };
  } catch (e) { return { files: ['ERR: ' + e.message.slice(0, 60)], truncated: false }; }
}
const probes = [
  ['csbase', 'xiaolincoder/CS-Base', 'main', ''],
  ['dlbook', 'fengdu78/deeplearning_ai_book', 'main', ''],
  ['happyllm', 'datawhalechina/happy-llm', 'main', ''],
  ['k8s', 'guangzhengli/k8s-tutorials', 'main', ''],
  ['ctfwiki', 'ctf-wiki/ctf-wiki', 'master', 'docs/'],
  ['advjava-bd', 'doocs/advanced-java', 'main', 'docs/big-data/'],
];
const out = [];
for (const [id, repo, br, dir] of probes) {
  const { files, truncated } = tree(repo, br);
  const inDir = dir ? files.filter(f => f.startsWith(dir)) : files;
  out.push(`\n== ${id}（${inDir.length}${truncated ? ' TRUNCATED' : ''}）==`);
  out.push(inDir.slice(0, r(16)).join('\n'));
}
function r(n) { return n; }
fs.writeFileSync('scripts/.probe-b2.txt', out.join('\n'));
console.log('ok');
