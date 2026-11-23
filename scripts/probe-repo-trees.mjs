// 探查仓库树结构（校正收录清单用）
import { execFileSync } from 'child_process';
const TOKEN = process.env.GITHUB_TOKEN || '';
function tree(repo, branch) {
  const raw = execFileSync('curl', ['-sL', '--max-time', '60',
    '-H', `Authorization: Bearer ${TOKEN}`,
    `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`],
    { maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' });
  return JSON.parse(raw).tree.filter(t => t.type === 'blob' && /\.md$/i.test(t.path)).map(t => t.path);
}
const repos = JSON.parse(process.argv[2]);
for (const r of repos) {
  try {
    const files = tree(r.repo, r.branch);
    const filtered = r.dir ? files.filter(f => f.startsWith(r.dir)) : files;
    console.log(`\n== ${r.id}（${filtered.length} md in ${r.dir || '/'}）==`);
    filtered.slice(0, r.n || 20).forEach(f => console.log('  ' + f));
  } catch (e) { console.log(`\n== ${r.id} FAIL: ${e.message.slice(0, 80)}`); }
}
