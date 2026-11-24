// RSS 输出的回归检查：node scripts/test-rss.mjs
// 1) 极端输入（& < > " '、控制字符、正文里的 ]]>、缺字段）→ 逐字符扫描确认是合法 XML，且内容能原样还原
// 2) server/data 里的真实文章全量生成一遍，同样扫描 + 还原（收录的文章标题 / 摘要里带 & < > 的不少）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRssFeed } from './lib/rss-feed.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const bad = (msg) => { failed += 1; console.error('  ✗ ' + msg); };
const ok = (msg) => console.log('  ✓ ' + msg);
const check = (label, fn) => { try { fn(); ok(label); } catch (e) { bad(`${label}：${e.message}`); } };

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (s) => s.replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ENTITIES[e]);
// 与 rss-feed.mjs 一致：XML 1.0 不收的控制字符会被丢弃
const stripControl = (s) => String(s ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
const byDateDesc = (posts) => posts.filter((p) => p && p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// 极简 XML 扫描（不依赖解析器）：标签配对、CDATA 之外不许出现裸的 & <、文本里不许出现 ]]>
// 返回 { cdataBodies: 每一节 CDATA 的正文, categories: <category> 的文本 }
function scanXml(xml) {
  const stack = [];
  const cdataBodies = [];
  const categories = [];
  const checkText = (s, where) => {
    if (s.includes('<')) throw new Error(`${where}里出现 <`);
    if (s.includes(']]>')) throw new Error(`${where}里出现 ]]>`);
    for (let p = 0; p < s.length; p++) {
      if (s[p] !== '&') continue;
      const m = /^&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/.exec(s.slice(p));
      if (!m) throw new Error(`${where}里有裸的 &`);
      p += m[0].length - 1;
    }
  };
  let i = 0;
  while (i < xml.length) {
    if (xml.startsWith('<![CDATA[', i)) {
      const end = xml.indexOf(']]>', i + 9);
      if (end < 0) throw new Error('CDATA 没有闭合');
      cdataBodies.push(xml.slice(i + 9, end));
      i = end + 3;
    } else if (xml.startsWith('<?', i)) {
      const end = xml.indexOf('?>', i);
      if (end < 0) throw new Error('XML 声明没有闭合');
      i = end + 2;
    } else if (xml.startsWith('</', i)) {
      const end = xml.indexOf('>', i);
      const name = xml.slice(i + 2, end);
      if (stack.pop() !== name) throw new Error(`标签不配对：${name}`);
      i = end + 1;
    } else if (xml[i] === '<') {
      const end = xml.indexOf('>', i);
      const raw = xml.slice(i + 1, end);
      if ((raw.match(/"/g) || []).length % 2) throw new Error('属性值的引号没有闭合');
      const selfClose = raw.endsWith('/');
      const body = selfClose ? raw.slice(0, -1) : raw;
      const name = /^[^\s/>]+/.exec(body)?.[0];
      if (!name) throw new Error('空标签');
      for (const m of body.slice(name.length).matchAll(/=\s*("[^"]*"|'[^']*')/g)) checkText(m[1].slice(1, -1), '属性值');
      if (!selfClose) stack.push(name);
      i = end + 1;
    } else {
      const next = xml.indexOf('<', i);
      const stop = next < 0 ? xml.length : next;
      const chunk = xml.slice(i, stop);
      checkText(chunk, '文本');
      if (stack[stack.length - 1] === 'category') categories.push(decode(chunk));
      i = stop;
    }
  }
  if (stack.length) throw new Error(`有标签没有闭合：${stack.join(', ')}`);
  return { cdataBodies, categories };
}

// 每个字段被 ]]> 切成几节，节数 = 出现次数 + 1；依次拼回去必须与原文一致
function roundTrip(bodies, posts) {
  let p = 0;
  const take = (expected) => {
    const n = expected.split(']]>').length;
    const got = bodies.slice(p, p + n).join('');
    p += n;
    if (got !== expected) throw new Error(`还原后与原文不一致：${JSON.stringify(expected.slice(0, 40))}`);
  };
  for (const post of posts) {
    take(stripControl(post.title));
    take(stripControl(post.excerpt));
  }
  if (p !== bodies.length) throw new Error('CDATA 节数与字段数对不上');
}

// ── 极端输入 ──
console.log('极端输入');
const SITE = 'https://blog.wineryz.top';
const nasty = {
  id: 'a-b_1.2~x',
  date: '2026-11-25T08:00:00+08:00',
  category: 'C & C++ <系统> "双引号" \'单引号\'',
  title: 'a ]]> b & <tag> "q" \'s\'\x01控制字符',
  excerpt: 'x ]]> y ]]> z',
};
const bare = { id: 'bare', date: '2026-11-24T00:00:00Z' };
const site = { siteUrl: SITE, siteTitle: 'Winery & 笔记 <站>', siteDescription: '摘要 & "说明"' };
const feed = buildRssFeed({ ...site, posts: [bare, nasty], builtAt: new Date(0) });
let scanned = null;
check('生成的 feed 是合法 XML', () => { scanned = scanXml(feed); });
check('标题 / 摘要能原样还原（含 ]]> 与控制字符）', () => roundTrip(scanned.cdataBodies, [nasty, bare]));
check('分类转义正确', () => {
  if (scanned.categories.length !== 1 || scanned.categories[0] !== nasty.category) throw new Error(JSON.stringify(scanned.categories));
});
check('站点标题与描述转义正确', () => {
  if (!feed.includes('<title>Winery &amp; 笔记 &lt;站&gt;</title>')) throw new Error('站点标题');
  if (!feed.includes('<description>摘要 &amp; &quot;说明&quot;</description>')) throw new Error('站点描述');
});
check('缺分类 / 摘要的文章不留 undefined 与空标签', () => {
  if (feed.includes('undefined')) throw new Error('出现了 undefined');
  if (!feed.includes('<description><![CDATA[]]></description>')) throw new Error('空摘要的写法变了');
});
check('按时间倒序，limit 生效', () => {
  const links = [...feed.matchAll(/<guid>(.*?)<\/guid>/g)].map((m) => m[1]);
  if (links.join() !== `${SITE}/post/a-b_1.2~x,${SITE}/post/bare`) throw new Error(links.join());
  const one = buildRssFeed({ ...site, posts: [bare, nasty], limit: 1 });
  if ((one.match(/<item>/g) || []).length !== 1 || !one.includes('/post/a-b_1.2~x')) throw new Error('limit');
});

// ── 真实文章 ──
console.log('真实文章');
const postsFile = path.join(ROOT, 'server', 'data', 'posts.json');
if (!fs.existsSync(postsFile)) {
  console.log('  - server/data/posts.json 不存在，跳过');
} else {
  const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
  let config = {};
  try { config = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'data', 'config.json'), 'utf8')); } catch { config = {}; }
  const feed = buildRssFeed({
    siteUrl: `https://${config.domain || 'blog.wineryz.top'}`,
    siteTitle: config.title || 'WineryBlog',
    siteDescription: config.subtitle || '',
    posts,
    limit: posts.length,
    builtAt: new Date(0),
  });
  const ordered = byDateDesc(posts);
  let scanned = null;
  check(`${posts.length} 篇全量生成：合法 XML`, () => { scanned = scanXml(feed); });
  check('标题 / 摘要全部能原样还原', () => roundTrip(scanned.cdataBodies, ordered));
  check('分类与原文一致', () => {
    const want = ordered.filter((p) => p.category).map((p) => p.category);
    if (scanned.categories.length !== want.length || scanned.categories.some((c, i) => c !== want[i])) throw new Error('分类文本对不上');
  });
  check('每篇都有可解析的发布时间', () => {
    const badDates = ordered.filter((p) => Number.isNaN(new Date(p.date).getTime())).length;
    if (badDates) throw new Error(`${badDates} 篇日期无法解析（feed 里会写成 Invalid Date）`);
  });
}

console.log(failed ? `\n${failed} 项未通过` : '\n全部通过');
process.exit(failed ? 1 : 0);
