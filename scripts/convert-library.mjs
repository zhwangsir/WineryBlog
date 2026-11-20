// 将 winery-library/src/tutorials 的 126 篇教程转换为 WineryBlog Post 格式，并入 posts.json
import fs from "node:fs";
import path from "node:path";

const TUT = "C:\\workspace\\winery-library\\src\\tutorials";
const POSTS = "C:\\workspace\\WineryBlog\\server\\data\\posts.json";

const existing = JSON.parse(fs.readFileSync(POSTS, "utf8"));
const keepOld = existing.filter(p => p.id === "welcome" || p.category === "随笔");

function parseFrontMatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const meta = {};
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (kv) {
        const v = kv[2].trim();
        meta[kv[1]] = /^\[/.test(v) ? v.replace(/^\[|\]$/g, "").split(",").map(x => x.trim()).filter(Boolean) : v;
      }
    }
    return { meta, body: m[2] };
  }
  return { meta: {}, body: md };
}

const posts = [...keepOld];
let converted = 0;
for (const f of fs.readdirSync(TUT).filter(f => f.endsWith(".md")).sort()) {
  const raw = fs.readFileSync(path.join(TUT, f), "utf8");
  const { meta, body } = parseFrontMatter(raw);
  const title = meta.title || f.replace(/\.md$/, "");
  let content = body.replace(/^# .*?\r?\n/, "").trim();   // 去掉与标题重复的首行
  content = content.replace(/^\*？（原文件为空，仅存目）\*?\n?/gm, "").trim();
  const shelf = String(meta.category || "未分类").split("/")[0].trim();
  const mtime = fs.statSync(path.join(TUT, f)).mtimeMs;
  const words = Math.round(content.replace(/\s/g, "").length / 1.6);
  const excerpt = meta.summary || stripMd(content).slice(0, 90);
  posts.push({
    id: f.replace(/\.md$/, "").toLowerCase(),
    title,
    date: new Date(mtime).toISOString().slice(0, 10),
    category: shelf,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    excerpt,
    content,
    isLocked: false,
    password: "",
    views: 0,
    _words: words,
    _source: meta.source || "",
    _shelfPath: String(meta.category || shelf),
  });
  converted++;
}
function stripMd(s) {
  return s.replace(/```[\s\S]*?```/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#>*`|-]/g, " ").replace(/\s+/g, " ").trim();
}

// 追加扩展字段（保持 Post 兼容 + 扩展信息）
for (const p of posts) {
  if (p._shelfPath) p.shelfPath = p._shelfPath;
  if (p._words) p.words2 = p._words;
  if (p._source) p.source = p._source;
}

fs.writeFileSync(POSTS, JSON.stringify(posts, null, 2), "utf8");
console.log(`converted=${converted} total=${posts.length}`);
