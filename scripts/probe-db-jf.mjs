import fs from 'fs';
import { execFileSync } from 'child_process';
const T = process.env.GITHUB_TOKEN || '';
function tree(repo, br) {
  const r = execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
    `https://api.github.com/repos/${repo}/git/trees/${br}?recursive=1`], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });
  const j = JSON.parse(r);
  return (j.tree || []).filter(t => t.type === 'blob' && /\.md$/i.test(t.path)).map(t => t.path);
}
const out = [];
const db = tree('dunwu/db-tutorial', 'master');
out.push(`== dbtutorial (${db.length}) ==`);
out.push(db.slice(0, 22).join('\n'));
const jf = tree('AobingJava/JavaFamily', 'master');
out.push(`\n== javafamily (${jf.length}) ==`);
out.push(jf.slice(0, 22).join('\n'));
fs.writeFileSync('scripts/.probe-db-jf.txt', out.join('\n'));
console.log('ok');
