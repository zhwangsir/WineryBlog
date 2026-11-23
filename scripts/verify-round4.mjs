import fs from 'fs';
import { execFileSync } from 'child_process';
const T = process.env.GITHUB_TOKEN || '';
function api(p) {
  return JSON.parse(execFileSync('curl', ['-sL', '--max-time', '60', '-H', 'Authorization: Bearer ' + T,
    `https://api.github.com${p}`], { maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' }));
}
function treeMd(repo, br) {
  const t = api(`/repos/${repo}/git/trees/${br}?recursive=1`);
  return (t.tree || []).filter(x => x.type === 'blob' && /\.md$/i.test(x.path)).map(x => x.path);
}
const out = [];
// ① Vue 3 中文文档真实仓库：vuejs-translations org 下找 zh
try {
  const repos = api('/orgs/vuejs-translations/repos?per_page=50');
  for (const r of repos) out.push(`vuejs-translations: ${r.name} (${r.stargazers_count}★, branch ${r.default_branch})`);
  const zh = repos.find(r => r.name === 'zh-docs');
  if (zh) {
    const files = treeMd(`vuejs-translations/zh-docs`, zh.default_branch);
    const srcMd = files.filter(f => f.startsWith('src/guide') || f.startsWith('src/'));
    out.push(`zh-docs md total ${files.length}, src/ 下 ${srcMd.length}`);
    out.push(srcMd.slice(0, 12).join('\n'));
  }
} catch (e) { out.push('vuezh ERR: ' + e.message.slice(0, 60)); }

// ② dunwu/blog 剩余目录：01.Java 与 00.笔记 的子结构
try {
  const files = treeMd('dunwu/blog', 'master');
  const java = files.filter(f => f.startsWith('source/_posts/01.Java/'));
  const notes = files.filter(f => f.startsWith('source/_posts/00.笔记/'));
  out.push(`\ndunwublog 01.Java (${java.length}):`);
  out.push(java.slice(0, 10).join('\n'));
  out.push(`dunwublog 00.笔记 (${notes.length}):`);
  out.push(notes.slice(0, 10).join('\n'));
} catch (e) { out.push('dunwublog ERR: ' + e.message.slice(0, 60)); }

fs.writeFileSync('scripts/.probe-r5.txt', out.join('\n'));
console.log('ok');
