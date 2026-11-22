// One-off: build riverpod mirror from fetched content + update checklist URL
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REF_DIR = path.join(ROOT, 'src', 'references');

// r.jina.ai output: "Title: ...\nURL Source: ...\nMarkdown Content:\n<md>"
let raw = fs.readFileSync('C:/workspace/riverpod_test.md', 'utf8');
const marker = 'Markdown Content:';
const idx = raw.indexOf(marker);
let body = idx >= 0 ? raw.slice(idx + marker.length).trim() : raw;
const titleM = raw.match(/^Title:\s*(.+)$/m);
const title = (titleM?.[1] || 'Riverpod 官方文档').trim().split('|')[0].slice(0, 60);

// clean: strip pre-H1 chrome, links, bare urls
const h1 = body.search(/^#\s/m);
if (h1 > 0) body = body.slice(h1);
const fences = [];
body = body.replace(/```[\s\S]*?```/g, m => { fences.push(m); return `\u0000F${fences.length - 1}\u0000`; });
body = body.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt) => (alt ? `\n（图：${alt.trim()}）\n` : ''));
body = body.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
body = body.replace(/\u0000F(\d+)\u0000/g, (_, i) => fences[+i]);
body = body.replace(/(?<![<`\\])https?:\/\/[^\s)>\]]+/g, u => '`' + u + '`');
body = body.replace(/^\s*[-*]\s*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();

const SOURCE = 'https://riverpod.dev/docs/introduction/getting_started';
const head = `---\ntitle: ${title}\ncategory: 参考资料\nsource: ${SOURCE}\nsummary: 本地镜像：Riverpod 官方文档概览（原文 riverpod.dev）\n---\n\n> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：\`${SOURCE}\`\n\n`;
fs.writeFileSync(path.join(REF_DIR, 'ref-riverpod-docs.md'), head + body + '\n');

// update checklist entry URL (old 404 url -> working one)
const cl = path.join(ROOT, 'docs', 'REFERENCES.md');
let c = fs.readFileSync(cl, 'utf-8');
c = c.replace('https://riverpod.dev/docs/introduction/why_riverpod', SOURCE);
c = c.replace('- [ ] ref-riverpod-docs |', '- [x] ref-riverpod-docs |');
fs.writeFileSync(cl, c);

console.log(`riverpod mirror: ${body.length} chars, title "${title}"`);
