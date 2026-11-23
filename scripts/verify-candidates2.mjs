import fs from 'fs';
import { execFileSync } from 'child_process';
const T = process.env.GITHUB_TOKEN || '';
function check(repo) {
  try {
    const r = JSON.parse(execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
      `https://api.github.com/repos/${repo}`], { maxBuffer: 8 * 1024 * 1024, encoding: 'utf8' }));
    if (!r.default_branch) return `${repo}: ${r.message || 'not found'}`;
    const t = JSON.parse(execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
      `https://api.github.com/repos/${repo}/git/trees/${r.default_branch}?recursive=1`], { maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' }));
    const mds = (t.tree || []).filter(x => x.type === 'blob' && /\.md$/i.test(x.path)).length;
    return `${repo}: ✓ ${r.stargazers_count}★ / ${mds} md / branch ${r.default_branch}`;
  } catch (e) { return `${repo}: ERR ${e.message.slice(0, 40)}`; }
}
const out = [
  check('forthespada/InterviewGuide'),
  check('huihut/interview'),
  check('xingshaocheng/architect-awesome'),
  check('0voice/interview_internal_reference'),
  check('ruanyf/document-style-guide'),
].join('\n');
fs.writeFileSync('scripts/.cand2.txt', out);
console.log('ok');
