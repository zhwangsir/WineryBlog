// One-off: re-fetch thin reference mirrors with better source URLs,
// overwriting the same slug files so existing /post/ref-* links keep working.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'references');

function curl(url, jina) {
  const args = ['-sL', '--max-time', '60', '-o', '-'];
  if (jina) args.push(`https://r.jina.ai/${url}`); else args.push(url);
  return execFileSync('curl', args, { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });
}

function extractJina(text) {
  const marker = 'Markdown Content:';
  const idx = text.indexOf(marker);
  let body = idx >= 0 ? text.slice(idx + marker.length).trim() : text;
  const t = text.match(/^Title:\s*(.+)$/m);
  return { body, title: (t?.[1] || '').trim() };
}

function clean(md) {
  const h1 = md.search(/^#\s/m);
  if (h1 > 0) md = md.slice(h1);
  const fences = [];
  md = md.replace(/```[\s\S]*?```/g, m => { fences.push(m); return `\u0000F${fences.length - 1}\u0000`; });
  md = md.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt) => (alt ? `\n（图：${alt.trim()}）\n` : ''));
  md = md.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  md = md.replace(/\u0000F(\d+)\u0000/g, (_, i) => fences[+i]);
  return md.replace(/(?<![<`\\])https?:\/\/[^\s)>\]]+/g, u => '`' + u + '`')
    .replace(/^\s*[-*]\s*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
}

const jobs = [
  {
    slug: 'ref-gnu-org-software-gawk-manual-gawk-html',
    title: 'GNU awk 手册',
    source: 'https://www.gnu.org/software/gawk/manual/html_node/Getting-Started.html',
    summary: '本地镜像：GNU awk 手册 Getting Started（原文 gnu.org）',
  },
  {
    slug: 'ref-github-com-hiyouga-llama-factory',
    title: 'LLaMA-Factory README',
    source: 'https://raw.githubusercontent.com/hiyouga/LLaMA-Factory/main/README.md',
    summary: '本地镜像：LLaMA-Factory 项目 README（原文 GitHub）',
  },
];

for (const j of jobs) {
  try {
    let body, title = j.title;
    if (j.source.endsWith('.md')) {
      body = curl(j.source, false);          // raw md 直接拿
    } else {
      const r = extractJina(curl(j.source, true));
      body = clean(r.body);
      if (r.title) title = r.title.split('|')[0].trim().slice(0, 60) || j.title;
    }
    if (!body || body.length < 300) throw new Error(`too thin: ${body?.length}`);
    const head = `---\ntitle: ${title}\ncategory: 参考资料\nsource: ${j.source}\nsummary: ${j.summary}\n---\n\n> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：\`${j.source}\`\n\n`;
    fs.writeFileSync(path.join(OUT, `${j.slug}.md`), head + body.trim() + '\n');
    console.log(`OK ${j.slug} (${body.length} chars) "${title}"`);
  } catch (e) {
    console.log(`FAIL ${j.slug}: ${e.message}`);
  }
}
