// 核实新候选仓库（存在性 + md 数量 + 默认分支）
import fs from 'fs';
import { execFileSync } from 'child_process';
const T = process.env.GITHUB_TOKEN || '';
function check(repo) {
  try {
    const r = JSON.parse(execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
      `https://api.github.com/repos/${repo}`], { maxBuffer: 8 * 1024 * 1024, encoding: 'utf8' }));
    if (!r.default_branch) return { repo, err: r.message || 'not found' };
    const t = JSON.parse(execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
      `https://api.github.com/repos/${repo}/git/trees/${r.default_branch}?recursive=1`], { maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' }));
    const mds = (t.tree || []).filter(x => x.type === 'blob' && /\.md$/i.test(x.path)).length;
    return { repo, branch: r.default_branch, stars: r.stargazers_count, mds, truncated: !!t.truncated };
  } catch (e) { return { repo, err: e.message.slice(0, 60) }; }
}
const cands = [
  'Snailclimb/JavaGuide-Interview',
  'doocs/coding-interview',
  'datawhalechina/dop-tutorial',
  'apachecn/AiLearning',
  'halfrost/LeetCode-Go',
  'dunwu/db-tutorial',
  'justauth? ',
  'AobingJava/JavaFamily',
];
const out = [];
for (const c of cands.filter(x => !x.includes('?'))) {
  out.push(JSON.stringify(check(c)));
}
fs.writeFileSync('scripts/.cand-check.txt', out.join('\n'));
console.log('ok');
