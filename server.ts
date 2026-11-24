import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import compression from "compression";
import { ensureSourcesFile } from "./scripts/lib/gallery-sources.mjs";
import { buildRssFeed } from "./scripts/lib/rss-feed.mjs";
import { execFile } from "child_process";

// 会话签名密钥：首次启动随机生成，保存在本地 server/data/.session-secret（已 gitignore）。
// 不再用写死在代码里的固定值——进了仓库的密钥等于公开。
let JWT_SECRET = "";
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// In-memory session store (in production, use Redis)
const sessions = new Map<string, { username: string; expiry: number }>();

// ===== 管理员密码：scrypt 加盐哈希存储（兼容迁移前的明文配置，首次登录成功后自动升级）=====
const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt:${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
};
const verifyPassword = (password: unknown, stored: unknown): boolean => {
  if (typeof password !== "string" || typeof stored !== "string" || !stored) return false;
  if (stored.startsWith("scrypt:")) {
    const [salt, hex] = stored.slice(7).split(":");
    const expect = Buffer.from(hex || "", "hex");
    if (!salt || expect.length === 0) return false;
    const got = crypto.scryptSync(password, salt, expect.length);
    return got.length === expect.length && crypto.timingSafeEqual(got, expect);
  }
  const a = Buffer.from(password);
  const b = Buffer.from(stored);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// ===== 登录 / 解锁限频：同一来源在窗口内失败达到上限后暂时拒绝 =====
const failures = new Map<string, number[]>();
const pruneFailures = (key: string, windowMs: number): number[] => {
  const now = Date.now();
  const list = (failures.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length) failures.set(key, list);
  else failures.delete(key);
  return list;
};
const isBlocked = (key: string, max: number, windowMs: number) =>
  pruneFailures(key, windowMs).length >= max;
const recordFailure = (key: string) => {
  failures.set(key, [...(failures.get(key) || []), Date.now()]);
  // 兜底清理，避免被大量不同来源刷爆内存
  if (failures.size > 5000) {
    const now = Date.now();
    for (const [k, v] of failures) {
      if (!v.length || now - v[v.length - 1] > 15 * 60 * 1000) failures.delete(k);
    }
  }
};
const LOGIN_WINDOW = 15 * 60 * 1000;
const LOGIN_MAX = 8;
const UNLOCK_WINDOW = 60 * 1000;
const UNLOCK_MAX = 10;

// Generate simple token
function generateToken(username: string): string {
  const timestamp = Date.now();
  const data = `${username}:${timestamp}:${JWT_SECRET}`;
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  return `${username}:${timestamp}:${hash}`;
}

// Verify token
function verifyToken(token: string): { valid: boolean; username?: string } {
  const parts = token.split(":");
  if (parts.length !== 3) return { valid: false };

  const [username, timestamp, hash] = parts;
  const data = `${username}:${timestamp}:${JWT_SECRET}`;
  const expectedHash = crypto.createHash("sha256").update(data).digest("hex");

  if (hash !== expectedHash) return { valid: false };

  // Check expiry
  const tokenTime = parseInt(timestamp);
  if (Date.now() - tokenTime > SESSION_EXPIRY) return { valid: false };

  return { valid: true, username };
}

// Auth middleware
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const result = verifyToken(token);
  if (!result.valid) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  (req as any).user = { username: result.username };
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // gzip：/api/posts 约 1.7MB → 传输约 400KB
  app.use(compression());
  // Large limit: image uploads arrive as base64 JSON
  app.use(express.json({ limit: "20mb" }));

  // 基础安全响应头
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  const DATA_DIR = path.join(process.cwd(), "server", "data");
  const CONFIG_FILE = path.join(DATA_DIR, "config.json");
  const POSTS_FILE = path.join(DATA_DIR, "posts.json");
  const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

  // 会话签名密钥：本地文件里取，没有就生成一份（重启后会话保持；文件丢失则所有登录态失效）
  const SECRET_FILE = path.join(DATA_DIR, ".session-secret");
  try {
    JWT_SECRET = (await fs.readFile(SECRET_FILE, "utf-8")).trim();
  } catch {
    JWT_SECRET = crypto.randomBytes(48).toString("hex");
    await fs.writeFile(SECRET_FILE, JWT_SECRET, { mode: 0o600 });
  }
  if (JWT_SECRET.length < 32) throw new Error("session secret is corrupted: server/data/.session-secret");

  // 自有图床：server/data/gallery/<分类>/ 存图片本体（.gitignore 不入库），
  // /images/<分类>/<hash>.<ext> 静态服务；meta.json 记录来源/去重/感知哈希
  const GALLERY_DIR = path.join(process.cwd(), "server", "data", "gallery");
  const GALLERY_META = path.join(GALLERY_DIR, "meta.json");
  const GALLERY_MANIFEST = path.join(GALLERY_DIR, "manifest.json");
  const LEGACY_WALLPAPER_DIR = path.join(process.cwd(), "public", "wallpapers");
  const GALLERY_FETCH_CATS: Record<string, string> = { acg: "二次元", scenery: "风景", wallpaper: "综合壁纸" };

  const readGalleryMeta = async (): Promise<any> => {
    try {
      return JSON.parse(await fs.readFile(GALLERY_META, "utf-8"));
    } catch {
      return { images: {} };
    }
  };

  // ===== Media uploads (avatar / backgrounds / covers) =====
  const IMAGE_EXT: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
  };

  // Uploaded media, served at /uploads/*
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "1h" }));

  app.post("/api/upload", authMiddleware, async (req, res) => {
    try {
      const { name, data } = req.body || {};
      if (typeof data !== "string" || !data.startsWith("data:")) {
        res.status(400).json({ error: "data must be a base64 data URL" });
        return;
      }
      const m = data.match(/^data:([^;]+);base64,(.+)$/s);
      if (!m) {
        res.status(400).json({ error: "Malformed data URL" });
        return;
      }
      const mime = m[1].toLowerCase();
      const ext = IMAGE_EXT[mime];
      if (!ext) {
        res.status(415).json({ error: `Unsupported file type: ${mime}` });
        return;
      }
      const buf = Buffer.from(m[2], "base64");
      if (buf.length === 0) {
        res.status(400).json({ error: "Empty file" });
        return;
      }
      if (buf.length > 8 * 1024 * 1024) {
        res.status(413).json({ error: "File too large (max 8MB)" });
        return;
      }
      // 双层查重（与图床抓取同一体系）：字节级 SHA-256 + 感知级 dHash
      const hash16 = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
      const meta = await readGalleryMeta();
      const existing = meta.images?.[hash16];
      let phash: string | null = null;
      if (ext !== "mp3" && ext !== "wav" && ext !== "ogg" && ext !== "ico") {
        // sharp 直接解码内存 Buffer（不落临时文件——Windows 上 libvips 句柄延迟释放会撞锁）
        const { dHash } = await import("./scripts/lib/phash.mjs");
        phash = await dHash(buf as any);
      }
      if (!existing && phash) {
        for (const [h, info] of Object.entries(meta.images || {}) as any[]) {
          if (!info.phash) continue;
          const { hamming, SIMILAR_THRESHOLD } = await import("./scripts/lib/phash.mjs");
          if (hamming(phash, info.phash) <= SIMILAR_THRESHOLD) {
            // 感知重复：复用已有图片，不再落盘
            const url = info.category === "uploads"
              ? `/uploads/${h}${info.ext}`
              : `/images/${info.category}/${h}${info.ext}`;
            res.json({ url, size: info.bytes || buf.length, duplicate: true, kind: "similar", of: h });
            return;
          }
        }
      }
      if (existing) {
        // 字节级重复：直接复用
        const url = existing.category === "uploads"
          ? `/uploads/${hash16}${existing.ext}`
          : `/images/${existing.category}/${hash16}${existing.ext}`;
        res.json({ url, size: existing.bytes || buf.length, duplicate: true, kind: "exact", of: hash16 });
        return;
      }
      // 新图：哈希命名落盘（uploads 分类），写入图床 meta
      const filename = `${hash16}.${ext}`;
      await fs.writeFile(path.join(UPLOAD_DIR, filename), buf);
      meta.images[hash16] = {
        category: "uploads",
        ext: `.${ext}`,
        bytes: buf.length,
        fetchedAt: new Date().toISOString(),
        source: "upload",
        ...(phash ? { phash } : {}),
      };
      await fs.mkdir(GALLERY_DIR, { recursive: true });
      await fs.writeFile(GALLERY_META, JSON.stringify(meta, null, 1));
      res.json({ url: `/uploads/${filename}`, size: buf.length, duplicate: false });
    } catch (error: any) {
      res.status(500).json({ error: "Upload failed", detail: error.message });
    }
  });

  app.get("/api/uploads", authMiddleware, async (req, res) => {
    try {
      const files = await fs.readdir(UPLOAD_DIR);
      const items = await Promise.all(
        files
          .filter((f) => !f.startsWith("."))
          .map(async (f) => {
            const st = await fs.stat(path.join(UPLOAD_DIR, f));
            return { url: `/uploads/${f}`, name: f, size: st.size, mtime: st.mtimeMs };
          })
      );
      items.sort((a: any, b: any) => b.mtime - a.mtime);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to list uploads" });
    }
  });

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    // 限频按直连地址算（不信任可伪造的 X-Forwarded-For）
    const key = `login:${req.socket.remoteAddress || "unknown"}`;
    if (isBlocked(key, LOGIN_MAX, LOGIN_WINDOW)) {
      res.status(429).json({ error: "登录尝试过于频繁，请 15 分钟后再试" });
      return;
    }
    try {
      const username = String(req.body?.username ?? "");
      const password = req.body?.password;
      const config = JSON.parse(await fs.readFile(CONFIG_FILE, "utf-8"));
      const admin = config.admin || {};
      // 无论用户名是否匹配都走一遍哈希校验，避免用响应时间探测用户名
      const passwordOk = verifyPassword(password, admin.passwordHash ?? admin.password);
      if (username === admin.username && passwordOk) {
        // 旧的明文配置：登录成功后升级为哈希存储
        if (!admin.passwordHash) {
          admin.passwordHash = hashPassword(String(password));
          delete admin.password;
          await fs.writeFile(CONFIG_FILE, JSON.stringify({ ...config, admin }, null, 2));
        }
        const token = generateToken(username);
        res.json({ success: true, token, username });
      } else {
        recordFailure(key);
        res.status(401).json({ error: "用户名或密码不正确" });
      }
    } catch (error) {
      res.status(500).json({ error: "登录失败" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  app.get("/api/auth/verify", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }
    const result = verifyToken(token);
    if (result.valid) {
      res.json({ valid: true, username: result.username });
    } else {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Public Routes
  app.get("/api/config", async (req, res) => {
    try {
      const data = await fs.readFile(CONFIG_FILE, "utf-8");
      const config = JSON.parse(data);
      // Remove sensitive admin info from public config
      const { admin, ...publicConfig } = config;
      res.json(publicConfig);
    } catch (error) {
      res.status(500).json({ error: "Failed to read config" });
    }
  });

  // GET 接口一律 no-cache：浏览器可留存但每次必须带 ETag 回源校验，
  // 数据未变时 304 复用本地副本（列表 280KB 不再反复传输）
  app.use("/api", (req, res, next) => {
    if (req.method === "GET") res.setHeader("Cache-Control", "no-cache");
    next();
  });

  // ===== 文章数据层：按文件 (mtime,size) 失效的进程内缓存 =====
  // 前台列表只下发摘要（正文按需 GET /api/posts/:id），/api/posts 从 ~14MB 降到 ~280KB。
  // cron 会定期重写 posts.json：读到半截文件时沿用上一份完整数据。
  type PostRec = Record<string, any>;
  interface PostsCache {
    key: string;
    raw: PostRec[];
    sorted: PostRec[];
    summaries: PostRec[];
    search: null | { post: PostRec; title: string; excerpt: string; tags: string[]; category: string; content: string }[];
  }
  // 内部字段不下发：password 仅管理端可见；_words/_shelfPath 等是早期转换遗留
  const META_FIELDS = ["password", "_words", "_source", "_shelfPath", "shelfPath", "words2"];
  // 摘要列表 / 搜索结果在此基础上再去掉正文
  const INTERNAL_FIELDS = [...META_FIELDS, "content"];
  const stripFields = (src: PostRec, fields: string[]): PostRec => {
    const out: PostRec = { ...src };
    for (const f of fields) delete out[f];
    return out;
  };
  const countWords = (text: unknown): number => {
    if (typeof text !== "string" || !text) return 0;
    return (text.match(/[\u4e00-\u9fa5]/g) || []).length + (text.match(/[a-zA-Z]+/g) || []).length;
  };
  const wordsOf = (p: PostRec) => countWords(p.title) + countWords(p.excerpt) + countWords(p.content);
  // 摘要是早期收录时从正文截的：HTML 标签被截掉了 > 只剩半个（<u回溯…</u是一种），这里就地清掉
  const cleanExcerpt = (s: unknown): string => {
    if (typeof s !== "string" || !s.includes("<")) return String(s ?? "");
    return s
      .replace(/<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^<>]*)?>/g, "")
      .replace(/<\/?[a-zA-Z][a-zA-Z0-9]*(?=[\u4e00-\u9fa5a-zA-Z（(“"《])/g, "")
      .replace(/<[a-zA-Z][a-zA-Z0-9]*\s[^<>]*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };
  const byOrder = (a: PostRec, b: PostRec) =>
    (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
    String(b.date || "").localeCompare(String(a.date || ""));
  let postsCache: PostsCache | null = null;
  let postsLoading: Promise<PostsCache> | null = null;

  async function loadPosts(): Promise<PostsCache> {
    let key = "";
    try {
      const st = await fs.stat(POSTS_FILE);
      key = `${st.mtimeMs}:${st.size}`;
    } catch { /* 文件暂不可读：尝试沿用缓存 */ }
    if (postsCache && postsCache.key === key) return postsCache;
    if (postsLoading) return postsLoading;
    postsLoading = (async () => {
      try {
        const raw = JSON.parse(await fs.readFile(POSTS_FILE, "utf-8")) as PostRec[];
        if (!Array.isArray(raw)) throw new Error("posts.json is not an array");
        const sorted = [...raw].sort(byOrder);
        const summaries = sorted.map((p) => ({ ...stripFields(p, INTERNAL_FIELDS), excerpt: cleanExcerpt(p.excerpt), words: wordsOf(p) }));
        postsCache = { key, raw, sorted, summaries, search: null };
        return postsCache;
      } catch (e) {
        if (postsCache) return postsCache;
        throw e;
      } finally {
        postsLoading = null;
      }
    })();
    return postsLoading;
  }

  // 携带有效管理令牌的请求（不强制）：管理端取单篇时需要正文与密码原文
  const hasAdmin = (req: express.Request) => {
    const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;
    return !!token && verifyToken(token).valid;
  };

  // 加密文章的解锁令牌：HMAC(id:过期时间)，12 小时有效，服务端不再把密码与正文发给未解锁的访客
  const UNLOCK_TTL = 12 * 60 * 60 * 1000;
  const signUnlock = (id: string) => {
    const exp = Date.now() + UNLOCK_TTL;
    return `${exp}.${crypto.createHmac("sha256", JWT_SECRET).update(`${id}:${exp}`).digest("base64url")}`;
  };
  const verifyUnlock = (id: string, token: string) => {
    const [exp, sig] = String(token || "").split(".");
    if (!exp || !sig || !(Number(exp) > Date.now())) return false;
    const expect = crypto.createHmac("sha256", JWT_SECRET).update(`${id}:${exp}`).digest();
    const got = Buffer.from(sig, "base64url");
    return got.length === expect.length && crypto.timingSafeEqual(got, expect);
  };

  app.get("/api/posts", async (_req, res) => {
    try {
      // 摘要列表：置顶优先，其余按日期倒序（前台与后台共用同一顺序）
      res.json((await loadPosts()).summaries);
    } catch (error) {
      res.status(500).json({ error: "Failed to read posts" });
    }
  });

  // 单篇：正文按需获取。加密文章在校验密码前不下发正文（?unlock= 为 /unlock 签发的令牌）
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = (await loadPosts()).sorted.find((p) => p.id === req.params.id);
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }
      if (hasAdmin(req)) { res.json(post); return; }
      const pub: PostRec = { ...stripFields(post, META_FIELDS), excerpt: cleanExcerpt(post.excerpt), words: wordsOf(post) };
      if (post.isLocked && !verifyUnlock(post.id, String(req.query.unlock || ""))) {
        pub.content = "";
        pub.locked = true;
      }
      res.json(pub);
    } catch (error) {
      res.status(500).json({ error: "Failed to read post" });
    }
  });

  // 加密文章解锁：服务端比对密码，成功签发限时令牌
  app.post("/api/posts/:id/unlock", async (req, res) => {
    const key = `unlock:${req.socket.remoteAddress || "unknown"}`;
    if (isBlocked(key, UNLOCK_MAX, UNLOCK_WINDOW)) {
      res.status(429).json({ error: "尝试次数过多，请稍后再试" });
      return;
    }
    try {
      const post = (await loadPosts()).sorted.find((p) => p.id === req.params.id);
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }
      if (!post.isLocked) { res.json({ token: "" }); return; }
      const stored = String(post.password || "");
      const given = String(req.body?.password || "");
      const ok = stored.length > 0 && given.length === stored.length &&
        crypto.timingSafeEqual(Buffer.from(given), Buffer.from(stored));
      if (!ok) {
        recordFailure(key);
        res.status(401).json({ error: "密码错误" });
        return;
      }
      res.json({ token: signUnlock(post.id) });
    } catch (error) {
      res.status(500).json({ error: "Failed to unlock post" });
    }
  });

  // ===== 全文搜索：列表不再携带正文，标题/正文/标签/分类的检索改在服务端缓存上完成 =====
  const makeSnippet = (content: string, word: string) => {
    const idx = content.toLowerCase().indexOf(word);
    if (idx < 0) return "";
    const start = Math.max(0, idx - 46);
    const raw = content.slice(start, Math.min(content.length, idx + word.length + 70));
    const plain = raw
      .replace(/```[a-z0-9]*|`+/gi, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/^[ \t>#*-]+/gm, "")
      .replace(/\s+/g, " ")
      .trim();
    return (start > 0 ? "…" : "") + plain + (start + raw.length < content.length ? "…" : "");
  };

  app.get("/api/search", async (req, res) => {
    try {
      const q = String(req.query.q || "").trim().slice(0, 80);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      if (!q) { res.json({ results: [], total: 0 }); return; }
      const cache = await loadPosts();
      if (!cache.search) {
        const lower = (s: unknown) => String(s ?? "").toLowerCase();
        cache.search = cache.sorted.map((p) => ({
          post: p, title: lower(p.title), excerpt: lower(p.excerpt),
          tags: (Array.isArray(p.tags) ? p.tags : []).map(lower), category: lower(p.category), content: lower(p.content),
        }));
      }
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      const results = [];
      for (const row of cache.search) {
        let score = 0;
        const matches = { title: false, excerpt: false, content: false, tags: false, category: false };
        for (const w of words) {
          if (row.title.includes(w)) { score += 100; matches.title = true; if (row.title === w) score += 50; }
          if (row.category.includes(w)) { score += 80; matches.category = true; }
          if (row.tags.some((t) => t.includes(w))) { score += 60; matches.tags = true; }
          if (row.excerpt.includes(w)) { score += 40; matches.excerpt = true; }
          if (row.content.includes(w)) { score += 20; matches.content = true; }
        }
        if (score <= 0) continue;
        const post = { ...stripFields(row.post, INTERNAL_FIELDS), excerpt: cleanExcerpt(row.post.excerpt) };
        const snippetWord = words.find((w) => row.content.includes(w)) || words[0];
        results.push({ post: { ...post, words: wordsOf(row.post) }, score, matches, snippet: makeSnippet(row.post.content || "", snippetWord) });
      }
      results.sort((a, b) => b.score - a.score);
      res.json({ results: results.slice(0, limit), total: results.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to search" });
    }
  });

  // Protected Routes
  app.put("/api/config", authMiddleware, async (req, res) => {
    try {
      // Preserve admin credentials when updating config
      const currentData = await fs.readFile(CONFIG_FILE, "utf-8");
      const currentConfig = JSON.parse(currentData);
      const newConfig = { ...req.body, admin: currentConfig.admin };
      await fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save config" });
    }
  });

  app.post("/api/posts", authMiddleware, async (req, res) => {
    try {
      const data = await fs.readFile(POSTS_FILE, "utf-8");
      const posts = JSON.parse(data);
      const newPost = { ...req.body, id: Date.now().toString(), views: 0 };
      posts.push(newPost);
      await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
      res.json(newPost);
    } catch (error) {
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.put("/api/posts/:id", authMiddleware, async (req, res) => {
    try {
      const data = await fs.readFile(POSTS_FILE, "utf-8");
      let posts = JSON.parse(data);
      const index = posts.findIndex((p: any) => p.id === req.params.id);
      if (index !== -1) {
        const next: PostRec = { ...posts[index], ...req.body };
        // 加密文章提交空密码 = 沿用原密码（避免误清空后永远无法解锁）
        if (next.isLocked && req.body?.password === "" && posts[index].password) {
          next.password = posts[index].password;
        }
        posts[index] = next;
        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
        res.json(posts[index]);
      } else {
        res.status(404).json({ error: "Post not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", authMiddleware, async (req, res) => {
    try {
      const data = await fs.readFile(POSTS_FILE, "utf-8");
      let posts = JSON.parse(data);
      posts = posts.filter((p: any) => p.id !== req.params.id);
      await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // View count endpoint (public)
  app.post("/api/posts/:id/view", async (req, res) => {
    try {
      const data = await fs.readFile(POSTS_FILE, "utf-8");
      let posts = JSON.parse(data);
      const index = posts.findIndex((p: any) => p.id === req.params.id);
      if (index !== -1) {
        posts[index].views = (posts[index].views || 0) + 1;
        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
        res.json({ views: posts[index].views });
      } else {
        res.status(404).json({ error: "Post not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update view count" });
    }
  });

  // ===== 音乐歌单卡片：本地 JSON 歌单 + 音频复用 uploads 目录 =====
  const MUSIC_FILE = path.join(DATA_DIR, "music.json");
  const readMusic = async (): Promise<any[]> => {
    try { return JSON.parse(await fs.readFile(MUSIC_FILE, "utf-8")); }
    catch { return []; }
  };

  // 公开：歌单（前台播放卡）
  app.get("/api/music", async (_req, res) => {
    try { res.json(await readMusic()); }
    catch { res.json([]); }
  });

  // 管理：整表保存歌单（管理端编辑器提交完整数组）
  app.put("/api/music", authMiddleware, async (req, res) => {
    try {
      const list = req.body;
      if (!Array.isArray(list)) { res.status(400).json({ error: "歌单必须是数组" }); return; }
      const clean = list.slice(0, 100).map((m: any, i: number) => ({
        id: String(m.id || `m-${Date.now().toString(36)}-${i}`),
        title: String(m.title || "未命名").slice(0, 60),
        artist: String(m.artist || "未知歌手").slice(0, 40),
        cover: String(m.cover || ""),
        url: String(m.url || ""),
      })).filter(m => m.url);
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(MUSIC_FILE, JSON.stringify(clean, null, 1));
      res.json({ success: true, count: clean.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ===== 网易云官方播放器遥控（ncm-cli 实名授权，JSON 输出）=====
  const NCM_CLI_JS = path.join(
    path.dirname(process.execPath), "node_modules", "@music163", "ncm-cli", "dist", "index.js"
  );
  const NCM_ENV_PATH = process.env.NCM_MPV_DIR
    ? `${process.env.NCM_MPV_DIR};${process.env.PATH}`
    : process.env.PATH;
  const stateCache: { at: number; data: any } = { at: 0, data: null };

  const ncmRun = (args: string[]): Promise<any> =>
    new Promise((resolve) => {
      try {
        // 直接以 node 执行 CLI 的 dist/index.js（execFile 直跑 .cmd 在 Node 20.11+ 抛 EINVAL）
        execFile(process.execPath, [NCM_CLI_JS, ...args], {
          timeout: 15000,
          encoding: "utf8",
          env: { ...process.env, PATH: NCM_ENV_PATH },
        }, (err, stdout) => {
          if (err && !stdout) { resolve({ success: false, message: err.message }); return; }
          try { resolve(JSON.parse(stdout)); }
          catch { resolve({ success: true, raw: stdout }); }
        });
      } catch (e: any) {
        resolve({ success: false, message: e?.message || "spawn failed" });
      }
    });

  // 公开：播放器状态（5s 缓存——前台卡片 2.5s 轮询，避免高频 spawn）
  app.get("/api/netease/state", async (_req, res) => {
    if (Date.now() - stateCache.at > 5000) {
      stateCache.data = await ncmRun(["state", "--output", "json"]);
      stateCache.at = Date.now();
    }
    res.json(stateCache.data);
  });

  // 公开：播放控制（白名单动作，防注入）
  app.post("/api/netease/control", async (req, res) => {
    const { action, value } = req.body || {};
    const map: Record<string, string[]> = {
      pause: ["pause"],
      resume: ["resume"],
      next: ["next"],
      prev: ["prev"],
      stop: ["stop"],
      seek: ["seek", String(Math.max(0, Number(value) || 0))],
      volume: ["volume", String(Math.min(100, Math.max(0, Number(value) || 0)))],
    };
    const args = map[String(action || "")];
    if (!args) { res.status(400).json({ error: "unknown action" }); return; }
    res.json(await ncmRun(args));
  });

  // ===== 评论系统：本地 JSON 存储，先发先显 + 后台可隐藏/删除 =====
  const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
  const readComments = async (): Promise<any> => {
    try {
      return JSON.parse(await fs.readFile(COMMENTS_FILE, "utf-8"));
    } catch {
      return { byPost: {}, rate: {} };
    }
  };

  // 公开：文章评论列表（仅正常状态，倒序，不暴露 ip）
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const data = await readComments();
      const list = (data.byPost?.[req.params.id] || [])
        .filter((c: any) => c.status !== "hidden")
        .sort((a: any, b: any) => String(b.time).localeCompare(String(a.time)))
        .map(({ ip, status, ...pub }: any) => pub);
      res.json(list);
    } catch {
      res.status(500).json({ error: "Failed to read comments" });
    }
  });

  // 公开：发表评论（昵称 1-20 字、内容 2-500 字、同 IP 60 秒限一条）
  app.post("/api/posts/:id/comments", async (req, res) => {
    try {
      const nameS = String(req.body?.name || "").trim();
      const contentS = String(req.body?.content || "").trim();
      if (nameS.length < 1 || nameS.length > 20) {
        res.status(400).json({ error: "昵称需 1-20 个字符" });
        return;
      }
      if (contentS.length < 2 || contentS.length > 500) {
        res.status(400).json({ error: "内容需 2-500 个字符" });
        return;
      }
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";
      const data = await readComments();
      const now = Date.now();
      if (data.rate?.[ip] && now - data.rate[ip] < 60_000) {
        res.status(429).json({ error: "评论太频繁啦，喝口水稍再来" });
        return;
      }
      (data.rate ||= {})[ip] = now;
      const comment = {
        id: `${now.toString(36)}-${crypto.randomBytes(3).toString("hex")}`,
        name: nameS,
        content: contentS,
        time: new Date().toISOString(),
        status: "approved",
        ip,
      };
      (data.byPost ||= {})[req.params.id] = (data.byPost[req.params.id] || []).concat(comment);
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(COMMENTS_FILE, JSON.stringify(data, null, 1));
      const { ip: _ip, status: _status, ...pub } = comment;
      res.json({ success: true, comment: pub });
    } catch {
      res.status(500).json({ error: "Failed to save comment" });
    }
  });

  // 后台：全量评论（附文章标题，按时间倒序）
  app.get("/api/admin/comments", authMiddleware, async (_req, res) => {
    try {
      const [cdata, postsData] = await Promise.all([
        readComments(),
        fs.readFile(POSTS_FILE, "utf-8").catch(() => "[]"),
      ]);
      const posts = JSON.parse(postsData);
      const titleMap: Record<string, string> = {};
      for (const p of posts) titleMap[p.id] = p.title;
      const rows: any[] = [];
      for (const [pid, list] of Object.entries(cdata.byPost || {}) as any[]) {
        for (const c of list) {
          rows.push({ ...c, postId: pid, postTitle: titleMap[pid] || pid });
        }
      }
      rows.sort((a, b) => String(b.time).localeCompare(String(a.time)));
      res.json({
        rows,
        total: rows.length,
        hidden: rows.filter((r) => r.status === "hidden").length,
      });
    } catch {
      res.status(500).json({ error: "Failed to read comments" });
    }
  });

  // 后台：切换评论状态（approved / hidden）
  app.put("/api/admin/comments/:postId/:commentId", authMiddleware, async (req, res) => {
    try {
      const status = req.body?.status === "hidden" ? "hidden" : "approved";
      const data = await readComments();
      const list = data.byPost?.[req.params.postId] || [];
      const c = list.find((x: any) => x.id === req.params.commentId);
      if (!c) {
        res.status(404).json({ error: "Comment not found" });
        return;
      }
      c.status = status;
      await fs.writeFile(COMMENTS_FILE, JSON.stringify(data, null, 1));
      res.json({ success: true, status });
    } catch {
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  // 后台：删除评论
  app.delete("/api/admin/comments/:postId/:commentId", authMiddleware, async (req, res) => {
    try {
      const data = await readComments();
      const list = data.byPost?.[req.params.postId] || [];
      const next = list.filter((x: any) => x.id !== req.params.commentId);
      if (next.length === list.length) {
        res.status(404).json({ error: "Comment not found" });
        return;
      }
      data.byPost[req.params.postId] = next;
      await fs.writeFile(COMMENTS_FILE, JSON.stringify(data, null, 1));
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // ===== Admin: 统计 / 安全 / 备份 / 门禁 / 图床 =====

  await fs.mkdir(path.join(GALLERY_DIR, "wallpaper"), { recursive: true });
  app.use("/images", express.static(GALLERY_DIR, { maxAge: "1d" }));

  // 公开 manifest：前台随机壁纸背景池（图床全分类；回落旧壁纸池）
  app.get("/api/gallery/manifest", async (_req, res) => {
    try {
      const m = JSON.parse(await fs.readFile(GALLERY_MANIFEST, "utf-8"));
      res.json(m);
    } catch {
      try {
        const legacy = JSON.parse(await fs.readFile(path.join(LEGACY_WALLPAPER_DIR, "manifest.json"), "utf-8"));
        res.json(legacy);
      } catch {
        res.json({ updatedAt: null, wallpapers: [] });
      }
    }
  });

  // 图床列表：meta 驱动（含 uploads 新上传）；uploads 目录里的孤儿文件（历史遗留）兜底并入
  app.get("/api/admin/gallery", authMiddleware, async (_req, res) => {
    try {
      const meta = await readGalleryMeta();
      const images: any[] = [];
      const catStats: Record<string, { count: number; bytes: number }> = {};
      const bump = (cat: string, bytes: number) => {
        const c = (catStats[cat] ||= { count: 0, bytes: 0 });
        c.count++;
        c.bytes += bytes || 0;
      };
      const metaUploadNames = new Set<string>();
      for (const [hash, info] of Object.entries(meta.images || {}) as any[]) {
        const cat = info.category || "wallpaper";
        const url = cat === "uploads"
          ? `/uploads/${hash}${info.ext || ""}`
          : `/images/${cat}/${hash}${info.ext || ""}`;
        images.push({
          name: `${hash}${info.ext || ""}`,
          category: cat,
          url,
          bytes: info.bytes || 0,
          time: info.fetchedAt || "",
          source: info.source || "",
        });
        bump(cat, info.bytes || 0);
        if (cat === "uploads") metaUploadNames.add(`${hash}${info.ext || ""}`);
      }
      // 孤儿兜底：uploads 目录中不在 meta 的旧文件（时间戳命名时期）
      const uploadFiles = await fs.readdir(UPLOAD_DIR).catch(() => [] as string[]);
      for (const f of uploadFiles) {
        if (f.startsWith(".") || metaUploadNames.has(f)) continue;
        try {
          const st = await fs.stat(path.join(UPLOAD_DIR, f));
          images.push({
            name: f,
            category: "uploads",
            url: `/uploads/${f}`,
            bytes: st.size,
            time: st.mtime.toISOString(),
            source: "upload-legacy",
          });
          bump("uploads", st.size);
        } catch { /* 并发删除窗口 */ }
      }
      images.sort((a, b) => String(b.time).localeCompare(String(a.time)));
      const totalBytes = Object.values(catStats).reduce((s, c) => s + c.bytes, 0);
      const totalCount = images.length;
      const categories = [
        { id: "all", label: "全部", count: totalCount, bytes: totalBytes },
        { id: "acg", label: "二次元", ...(catStats.acg || { count: 0, bytes: 0 }) },
        { id: "scenery", label: "风景", ...(catStats.scenery || { count: 0, bytes: 0 }) },
        { id: "wallpaper", label: "综合壁纸", ...(catStats.wallpaper || { count: 0, bytes: 0 }) },
        { id: "uploads", label: "上传媒体", ...(catStats.uploads || { count: 0, bytes: 0 }) },
      ];
      res.json({
        categories,
        images,
        fetchable: GALLERY_FETCH_CATS,
        manifestUpdatedAt: await fs.readFile(GALLERY_MANIFEST, "utf-8").then(JSON.parse).then((m: any) => m.updatedAt).catch(() => null),
      });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to list gallery", detail: e.message });
    }
  });

  // 抓取入库：后台异步执行 fetch-gallery.mjs（按图源；兼容按分类取第一个启用源）
  app.post("/api/admin/gallery/fetch", authMiddleware, async (req, res) => {
    try {
      const { source, category, count } = req.body || {};
      const sources = ensureSourcesFile(GALLERY_DIR);
      let src: any = null;
      if (source) {
        src = sources.find((s: any) => s.id === String(source) && s.enabled !== false);
        if (!src) {
          res.status(400).json({ error: `图源不存在或已停用：${source}` });
          return;
        }
      } else if (category) {
        if (!GALLERY_FETCH_CATS[String(category)]) {
          res.status(400).json({ error: `未知分类：${category}` });
          return;
        }
        src = sources.find((s: any) => s.category === String(category) && s.enabled !== false);
        if (!src) {
          res.status(400).json({ error: `分类 ${category} 没有启用的图源` });
          return;
        }
      } else {
        res.status(400).json({ error: "需要 source 或 category" });
        return;
      }
      const n = Math.min(30, Math.max(1, parseInt(String(count || 10), 10) || 10));
      const { spawn } = await import("child_process");
      const child = spawn(process.execPath, ["scripts/fetch-gallery.mjs", "--source", src.id, String(n)], {
        cwd: process.cwd(),
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      res.json({ started: true, source: src.id, name: src.name, category: src.category, count: n });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ===== 图源管理：CRUD（sources.json；内置源可启停不可删） =====
  app.get("/api/admin/gallery/sources", authMiddleware, async (_req, res) => {
    try {
      const sources = ensureSourcesFile(GALLERY_DIR);
      res.json({ sources, categories: GALLERY_FETCH_CATS });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/gallery/sources", authMiddleware, async (req, res) => {
    try {
      const { name, category, endpoint, type, jsonPath } = req.body || {};
      if (!name || !endpoint) {
        res.status(400).json({ error: "名称与接口地址必填" });
        return;
      }
      if (!GALLERY_FETCH_CATS[String(category)]) {
        res.status(400).json({ error: `分类必须是：${Object.keys(GALLERY_FETCH_CATS).join("/")}` });
        return;
      }
      if (!/^https?:\/\//.test(String(endpoint))) {
        res.status(400).json({ error: "接口地址需以 http(s):// 开头" });
        return;
      }
      const srcType = type === "json" ? "json" : "binary";
      const sources = ensureSourcesFile(GALLERY_DIR);
      const slug = String(name).toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "src";
      const id = `custom-${slug}-${Date.now().toString(36)}`;
      const entry: any = {
        id,
        name: String(name).slice(0, 40),
        category: String(category),
        endpoint: String(endpoint).slice(0, 500),
        type: srcType,
        enabled: true,
        builtin: false,
      };
      if (srcType === "json" && jsonPath) entry.jsonPath = String(jsonPath).slice(0, 60);
      sources.push(entry);
      await fs.mkdir(GALLERY_DIR, { recursive: true });
      await fs.writeFile(path.join(GALLERY_DIR, "sources.json"), JSON.stringify({ updatedAt: new Date().toISOString(), sources }, null, 1));
      res.json({ success: true, source: entry });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/gallery/sources/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const sources = ensureSourcesFile(GALLERY_DIR);
      const src = sources.find((s: any) => s.id === id);
      if (!src) {
        res.status(404).json({ error: "图源不存在" });
        return;
      }
      const { name, category, endpoint, type, jsonPath, enabled } = req.body || {};
      if (enabled !== undefined) src.enabled = !!enabled;
      if (!src.builtin) {
        // 自定义源可全改；内置源仅允许启停（保护初始配置）
        if (name) src.name = String(name).slice(0, 40);
        if (category && GALLERY_FETCH_CATS[String(category)]) src.category = String(category);
        if (endpoint && /^https?:\/\//.test(String(endpoint))) src.endpoint = String(endpoint).slice(0, 500);
        if (type) src.type = type === "json" ? "json" : "binary";
        if (jsonPath !== undefined) src.jsonPath = jsonPath ? String(jsonPath).slice(0, 60) : undefined;
      }
      await fs.writeFile(path.join(GALLERY_DIR, "sources.json"), JSON.stringify({ updatedAt: new Date().toISOString(), sources }, null, 1));
      res.json({ success: true, source: src });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/admin/gallery/sources/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const sources = ensureSourcesFile(GALLERY_DIR);
      const idx = sources.findIndex((s: any) => s.id === id);
      if (idx === -1) {
        res.status(404).json({ error: "图源不存在" });
        return;
      }
      if (sources[idx].builtin) {
        res.status(400).json({ error: "内置图源不可删除，可停用" });
        return;
      }
      sources.splice(idx, 1);
      await fs.writeFile(path.join(GALLERY_DIR, "sources.json"), JSON.stringify({ updatedAt: new Date().toISOString(), sources }, null, 1));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 删除图床图片（gallery 分类删文件+meta+manifest；uploads 分类删上传目录）
  app.delete("/api/admin/gallery/:category/:name", authMiddleware, async (req, res) => {
    try {
      const category = String(req.params.category || "");
      const name = path.basename(String(req.params.name || ""));
      if (!name || name.startsWith(".")) {
        res.status(400).json({ error: "Invalid filename" });
        return;
      }
      if (category === "uploads") {
        await fs.unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
        // 同步清理 meta 条目（哈希命名的新上传有记录；旧孤儿文件无记录，跳过）
        const hash = name.replace(/\.[^.]+$/, "");
        const meta = await readGalleryMeta();
        if (meta.images?.[hash]?.category === "uploads") {
          delete meta.images[hash];
          await fs.writeFile(GALLERY_META, JSON.stringify(meta, null, 1));
        }
        res.json({ success: true });
        return;
      }
      if (!GALLERY_FETCH_CATS[category]) {
        res.status(400).json({ error: "未知分类" });
        return;
      }
      const meta = await readGalleryMeta();
      const hash = name.replace(/\.[^.]+$/, "");
      const info = meta.images?.[hash];
      if (!info || info.category !== category) {
        res.status(404).json({ error: "Image not found" });
        return;
      }
      await fs.unlink(path.join(GALLERY_DIR, category, name)).catch(() => {});
      delete meta.images[hash];
      await fs.mkdir(GALLERY_DIR, { recursive: true });
      await fs.writeFile(GALLERY_META, JSON.stringify(meta, null, 1));
      // manifest 重建（与脚本同逻辑：全分类扁平列表）
      const wallpapers = Object.entries(meta.images)
        .map(([h, i]: any) => ({ url: `/images/${i.category}/${h}${i.ext}`, mtime: i.fetchedAt }))
        .sort((a: any, b: any) => String(b.mtime).localeCompare(String(a.mtime)))
        .map((w: any) => w.url);
      await fs.writeFile(GALLERY_MANIFEST, JSON.stringify({ updatedAt: new Date().toISOString(), wallpapers }, null, 1));
      res.json({ success: true });
    } catch {
      res.status(404).json({ error: "Image not found" });
    }
  });

  // 仪表盘统计：内容量 / 互动 / 上传占用 / 系统 / 门禁最近结果
  app.get("/api/admin/stats", authMiddleware, async (_req, res) => {
    try {
      const countWords = (t: unknown) => {
        const s = String(t || "");
        return (s.match(/[\u4e00-\u9fa5]/g) || []).length + (s.match(/[a-zA-Z]+/g) || []).length;
      };
      const [postsData, tutData, labData, progData] = await Promise.all([
        fs.readFile(POSTS_FILE, "utf-8"),
        fs.readFile(path.join(DATA_DIR, "tutorials.json"), "utf-8").catch(() => "{}"),
        fs.readFile(path.join(DATA_DIR, "labs.json"), "utf-8").catch(() => "{}"),
        fs.readFile(path.join(DATA_DIR, "progress.json"), "utf-8").catch(() => "{}"),
      ]);
      const posts = JSON.parse(postsData);
      const words = posts.reduce((s: number, p: any) => s + countWords(p.title) + countWords(p.excerpt) + countWords(p.content), 0);
      const views = posts.reduce((s: number, p: any) => s + (p.views || 0), 0);

      const tut = JSON.parse(tutData || "{}");
      const tutorials = Array.isArray(tut.tutorials) ? tut.tutorials : [];
      const domains = Array.isArray(tut.domains) ? tut.domains : [];
      const labs = JSON.parse(labData || "{}");
      const progress = JSON.parse(progData || "{}");
      let readEntries = 0;
      let labEntries = 0;
      for (const v of Object.values(progress as Record<string, any>)) {
        readEntries += Object.keys(v?.read || {}).length;
        labEntries += Object.keys(v?.lab || {}).length;
      }
      // 评论统计
      let commentTotal = 0;
      let commentHidden = 0;
      try {
        const cdata = JSON.parse(await fs.readFile(path.join(DATA_DIR, "comments.json"), "utf-8"));
        for (const list of Object.values(cdata.byPost || {}) as any[][]) {
          commentTotal += list.length;
          commentHidden += list.filter((c: any) => c.status === "hidden").length;
        }
      } catch { /* 无评论文件 */ }

      let uploadCount = 0;
      let uploadBytes = 0;
      const uploadFiles = await fs.readdir(UPLOAD_DIR).catch(() => [] as string[]);
      for (const f of uploadFiles) {
        if (f.startsWith(".")) continue;
        try {
          const st = await fs.stat(path.join(UPLOAD_DIR, f));
          uploadCount++;
          uploadBytes += st.size;
        } catch { /* 并发删除窗口 */ }
      }

      let wallpaperCount = 0;
      let wallpaperBytes = 0;
      const meta = await readGalleryMeta();
      for (const info of Object.values(meta.images || {}) as any[]) {
        wallpaperCount++;
        wallpaperBytes += info.bytes || 0;
      }

      let gate: any = null;
      try {
        gate = JSON.parse(await fs.readFile(path.join(process.cwd(), "docs", "outbound-audit.json"), "utf-8"));
      } catch { /* 无审计文件 */ }

      res.json({
        posts: {
          total: posts.length,
          words,
          views,
          pinned: posts.filter((p: any) => p.pinned).length,
          categories: new Set(posts.map((p: any) => p.category)).size,
        },
        tutorials: {
          total: tutorials.length,
          domains: domains.length,
          domainsList: domains.map((d: any) => ({ id: d.id, name: d.name, count: d.count })),
        },
        labs: { total: Object.keys(labs.labs || labs).length },
        progress: { visitors: Object.keys(progress).length, readEntries, labEntries },
        comments: { total: commentTotal, hidden: commentHidden },
        uploads: { count: uploadCount, bytes: uploadBytes },
        wallpapers: { count: wallpaperCount, bytes: wallpaperBytes },
        system: {
          uptimeSec: Math.round(process.uptime()),
          rssMB: +(process.memoryUsage().rss / 1048576).toFixed(1),
          node: process.version,
          platform: process.platform,
        },
        gate,
      });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to collect stats", detail: e.message });
    }
  });

  // 删除上传的媒体文件（basename 防路径穿越）
  app.delete("/api/uploads/:name", authMiddleware, async (req, res) => {
    try {
      const name = path.basename(String(req.params.name));
      if (!name || name.startsWith(".") || name.includes("/")) {
        res.status(400).json({ error: "Invalid filename" });
        return;
      }
      await fs.unlink(path.join(UPLOAD_DIR, name));
      res.json({ success: true });
    } catch {
      res.status(404).json({ error: "File not found" });
    }
  });

  // 修改管理员密码（需验证当前密码；新密码只存哈希）
  app.post("/api/auth/change-password", authMiddleware, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body || {};
      const config = JSON.parse(await fs.readFile(CONFIG_FILE, "utf-8"));
      if (!config.admin || !verifyPassword(currentPassword, config.admin.passwordHash ?? config.admin.password)) {
        res.status(401).json({ error: "当前密码不正确" });
        return;
      }
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        res.status(400).json({ error: "新密码至少需要 8 位" });
        return;
      }
      config.admin = { ...config.admin, passwordHash: hashPassword(newPassword) };
      delete config.admin.password;
      await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "修改密码失败" });
    }
  });

  // 数据备份：配置 + 全量文章 + 学习进度 + 教程元数据，整包 JSON 下载
  app.get("/api/admin/backup", authMiddleware, async (_req, res) => {
    try {
      const [configData, postsData, progData, tutData] = await Promise.all([
        fs.readFile(CONFIG_FILE, "utf-8").catch(() => "{}"),
        fs.readFile(POSTS_FILE, "utf-8").catch(() => "[]"),
        fs.readFile(path.join(DATA_DIR, "progress.json"), "utf-8").catch(() => "{}"),
        fs.readFile(path.join(DATA_DIR, "tutorials.json"), "utf-8").catch(() => "{}"),
      ]);
      const bundle = {
        exportedAt: new Date().toISOString(),
        config: JSON.parse(configData),
        posts: JSON.parse(postsData),
        progress: JSON.parse(progData),
        tutorials: JSON.parse(tutData),
      };
      const body = Buffer.from(JSON.stringify(bundle, null, 1), "utf-8");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=wineryblog-backup-${new Date().toISOString().slice(0, 10)}.json`);
      res.send(body);
    } catch {
      res.status(500).json({ error: "Backup failed" });
    }
  });

  // 零外跳门禁：运行 verify-no-outbound 脚本（结果缓存 5 分钟，?force=1 强制）
  let gateCache: { at: number; code: number; output: string } | null = null;
  app.get("/api/admin/gate", authMiddleware, async (req, res) => {
    const force = req.query.force === "1";
    if (!force && gateCache && Date.now() - gateCache.at < 5 * 60 * 1000) {
      res.json({ ...gateCache, cached: true });
      return;
    }
    const { execFile } = await import("child_process");
    execFile(
      process.execPath,
      ["scripts/verify-no-outbound.mjs"],
      { cwd: process.cwd(), timeout: 60000, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const code = typeof (err as any)?.code === "number" ? (err as any).code : err ? 1 : 0;
        const output = String(stdout || "") + (stderr ? `\n${stderr}` : "");
        gateCache = { at: Date.now(), code, output };
        res.json({ ...gateCache, cached: false });
      }
    );
  });

  // RSS Feed endpoint
  app.get("/rss.xml", async (req, res) => {
    try {
      const [configData, postsRaw] = await Promise.all([
        fs.readFile(CONFIG_FILE, "utf-8"),
        loadPosts().then((c) => c.raw)
      ]);
      
      const config = JSON.parse(configData);

      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.send(buildRssFeed({
        siteUrl: `https://${config.domain || 'blog.wineryz.top'}`,
        siteTitle: config.title || 'WineryBlog',
        siteDescription: config.subtitle || '',
        posts: postsRaw
      }));
    } catch (error) {
      res.status(500).send('Error generating RSS feed');
    }
  });

  // ===== Knowledge Graph (built from posts) =====
  app.get("/api/graph", async (req, res) => {
    try {
      const posts = (await loadPosts()).raw;

      const PREREQ_PAIRS: [string, string][] = [
        ["CS 自学总纲", "数据结构与算法入门"],
        ["Python 基础入门", "深度学习与 PyTorch 入门"],
        ["深度学习与 PyTorch 入门", "大语言模型自学路线"],
        ["大语言模型自学路线", "本地大模型部署实战：Ollama 与 SGLang"],
        ["大语言模型自学路线", "本地知识库与 RAG 实战"],
        ["网络基础：IP 地址与访问流程", "HTTP/HTTPS 协议详解"],
        ["HTTP/HTTPS 协议详解", "SQL 注入实战进阶：Union、报错、盲注与防御"],
        ["JAVA程序基础", "面向对象编程"],
        ["面向对象编程", "Java数组"],
        ["Java数组", "Java 核心进阶：集合框架与并发编程入门"],
        ["Java 核心进阶：集合框架与并发编程入门", "SpringMVC 与 MyBatis 入门"],
        ["Promise异步处理解决方案", "JavaScript 异步编程全解：事件循环、Promise 与 async/await"],
        ["JavaScript 异步编程全解：事件循环、Promise 与 async/await", "React 核心补充：Hooks 与状态管理"],
        ["TypeScript 进阶：泛型与类型体操入门", "前端工程化入门：npm、Vite 与构建部署"],
        ["数据结构与算法入门", "数据库系统导论"],
        ["docker的安装", "Docker 常用命令与 Compose 实战"],
        ["Docker 常用命令与 Compose 实战", "Linux 服务器运维清单：Nginx、防火墙与日常巡检"],
        ["git快速入门", "Git 分支、合并与团队协作工作流"],
        ["排序与搜索算法全解", "动态规划入门：从递推到刷题套路"],
        ["MySQL 入门：从建库到查询", "数据库系统导论"],
        ["1.什么是机器学习", "深度学习与 PyTorch 入门"],
      ];

      const nodes = posts.map((p: any) => ({
        id: p.id,
        t: p.title,
        s: p.category,
        href: `/post/${p.id}`,
      }));
      const seqOf = new Map<string, number>();
      nodes.forEach((n: any, i: number) => seqOf.set(n.id, i));

      const edgeSet = new Set<string>();
      const edges: { a: number; b: number; k: string }[] = [];
      function addEdge(aId: string, bId: string, k: string) {
        const a = seqOf.get(aId), b = seqOf.get(bId);
        if (a === undefined || b === undefined || a === b) return;
        const lo = Math.min(a, b), hi = Math.max(a, b);
        const key = `${lo}-${hi}`;
        if (edgeSet.has(key)) return;
        edgeSet.add(key);
        edges.push({ a: lo, b: hi, k });
      }

      // 1) curated prerequisites
      for (const [from, to] of PREREQ_PAIRS) {
        const a = posts.find((p: any) => p.title === from);
        const b = posts.find((p: any) => p.title === to);
        if (a && b) addEdge(a.id, b.id, "pre");
      }
      // 2) series chains (titles like "1.xxx" in same category)
      const byCat = new Map<string, any[]>();
      posts.forEach((p: any) => {
        const arr = byCat.get(p.category) || [];
        arr.push(p);
        byCat.set(p.category, arr);
      });
      byCat.forEach((arr: any[], cat: string) => {
        const numbered = arr
          .filter((p: any) => /^(\d+)[\.、]/.test(p.title))
          .map((p: any) => ({ p, num: parseFloat(p.title.match(/^(\d+)[\.、]/)[1]) }))
          .sort((x: any, y: any) => x.num - y.num);
        for (let i = 0; i < numbered.length - 1; i++) {
          addEdge(numbered[i].p.id, numbered[i + 1].p.id, "next");
        }
      });
      // 3) same-category ring (related)
      byCat.forEach((arr: any[], cat: string) => {
        if (arr.length > 2) {
          arr.forEach((p: any, i: number) => {
            for (const off of [1, 2]) {
              const q = arr[(i + off) % arr.length];
              if (q !== p) addEdge(p.id, q.id, "rel");
            }
          });
        }
      });
      // 4) shared tags (strong overlap)
      posts.forEach((p: any, i: number) => {
        posts.forEach((q: any, j: number) => {
          if (j <= i || p.category !== q.category) return;
          const shared = (p.tags || []).filter((t: string) => (q.tags || []).includes(t));
          if (shared.length >= 2) addEdge(p.id, q.id, "rel");
        });
      });

      const shelfColors: Record<string, string> = {
        "方法与工具": "#8a8577", "编程语言": "#a63d2a", "数据结构与算法": "#c28a2e",
        "计算机网络": "#3a7d8c", "计算机组成": "#7a8b3a", "操作系统与运维": "#4a5fb0",
        "数据库": "#2e8b74", "Web 前端": "#d4694f", "后端开发": "#5a4fa0",
        "移动与跨端": "#b05a8c", "大数据": "#3a6ea5", "人工智能": "#8c5a2e",
        "信息安全": "#6e3a8c", "项目实战": "#4a8c5c", "随笔": "#7a8b7a", "技术": "#3a7d8c",
      };

      res.json({ nodes, edges, colors: shelfColors });
    } catch (error) {
      res.status(500).json({ error: "Failed to build graph" });
    }
  });

  // ===== Tutorial catalog & career routes =====
  const TUTORIALS_FILE = path.join(DATA_DIR, "tutorials.json");
  const CAREERS_FILE = path.join(DATA_DIR, "careers.json");
  let tutFileCache: { key: string; data: any } | null = null;

  // 教程目录：收录批次的 href 是裸 id（缺 /post/ 前缀，文章页上下篇会跳错），这里统一补全；
  // summary 是早期从正文截的，顺手清掉被截成半个的 HTML 标签
  async function loadTutorials(): Promise<any> {
    let key = "";
    try {
      const st = await fs.stat(TUTORIALS_FILE);
      key = `${st.mtimeMs}:${st.size}`;
    } catch { /* 读不到则回落缓存 */ }
    if (tutFileCache && tutFileCache.key === key) return tutFileCache.data;
    try {
      const data = JSON.parse(await fs.readFile(TUTORIALS_FILE, "utf-8"));
      data.tutorials = (data.tutorials || []).map((t: any) => ({
        ...t,
        href: String(t.href || "").startsWith("/post/") ? t.href : `/post/${t.id}`,
        summary: cleanExcerpt(t.summary),
      }));
      tutFileCache = { key, data };
      return data;
    } catch (e) {
      if (tutFileCache) return tutFileCache.data;
      throw e;
    }
  }

  app.get("/api/tutorials", async (req, res) => {
    try {
      res.json(await loadTutorials());
    } catch (error) {
      res.status(500).json({ error: "Failed to load tutorials" });
    }
  });

  app.get("/api/careers", async (req, res) => {
    try {
      res.json(JSON.parse(await fs.readFile(CAREERS_FILE, "utf-8")));
    } catch (error) {
      res.status(500).json({ error: "Failed to load careers" });
    }
  });

  // ===== 学习进度（匿名访客维度，X-Visitor-Id 头） =====
  const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");
  const VIS_ID_RE = /^[a-f0-9-]{36}$/;

  async function loadProgress(): Promise<Record<string, any>> {
    try { return JSON.parse(await fs.readFile(PROGRESS_FILE, "utf-8")); }
    catch { return {}; }
  }

  function getVid(req: express.Request): string | null {
    const vid = String(req.headers["x-visitor-id"] || "");
    return VIS_ID_RE.test(vid) ? vid : null;
  }

  app.get("/api/progress", async (req, res) => {
    const vid = getVid(req);
    if (!vid) return res.status(400).json({ error: "bad visitor id" });
    const all = await loadProgress();
    res.json(all[vid] || { read: {}, lastRead: null });
  });

  app.post("/api/progress/read", async (req, res) => {
    const vid = getVid(req);
    if (!vid) return res.status(400).json({ error: "bad visitor id" });
    const { tutorialId, read } = req.body || {};
    if (typeof tutorialId !== "string" || !tutorialId || typeof read !== "boolean") {
      return res.status(400).json({ error: "bad payload" });
    }
    const all = await loadProgress();
    const p = all[vid] || { read: {}, lastRead: null };
    if (read) {
      p.read[tutorialId] = new Date().toISOString();
      p.lastRead = tutorialId;
    } else {
      delete p.read[tutorialId];
      if (p.lastRead === tutorialId) {
        const keys = Object.keys(p.read);
        p.lastRead = keys.length ? keys[keys.length - 1] : null;
      }
    }
    all[vid] = p;
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(all, null, 1));
    res.json(p);
  });


  // ===== 实验室（labs）：环境 + 实验 =====
  // server/data/labs.json 由 scripts/build-labs.mjs 从 scripts/labs-src/ 汇编，按文件修改时间自动重新加载。
  // 格式：{ v: 2, defaultSeed, envs: [...], labs: { <实验 id>: {...} } }
  const LABS_FILE = path.join(DATA_DIR, "labs.json");
  let labsCache: { key: string; data: any } | null = null;
  async function loadLabs(): Promise<any> {
    const st = await fs.stat(LABS_FILE).catch(() => null);
    if (!st) return { v: 2, defaultSeed: "", envs: [], labs: {} };
    const key = `${st.mtimeMs}:${st.size}`;
    if (!labsCache || labsCache.key !== key) {
      const data = JSON.parse(await fs.readFile(LABS_FILE, "utf-8"));
      if (!data.labs || !Array.isArray(data.envs)) throw new Error("labs.json 不是 v2 格式，请执行 node scripts/build-labs.mjs");
      labsCache = { key, data };
    }
    return labsCache.data;
  }

  app.get("/api/labs", async (req, res) => {
    try {
      res.set("Cache-Control", "no-cache");
      res.json(await loadLabs());
    } catch (e: any) {
      res.status(503).json({ error: e.message, envs: [], labs: {} });
    }
  });

  // 实验室的运行器跑在 Worker 里。Worker 的 CSP 由脚本文件的响应头下发。
  // 两个运行器都要用 new Function / eval 来执行读者写的代码，所以需要 unsafe-eval；
  // 「不能联网」由 connect-src 把守：JavaScript 运行器完全不通，Python 运行器只允许读站内的引擎文件
  //（wasm 编译需要 wasm-unsafe-eval）。
  app.use((req, res, next) => {
    if (req.path === "/lab/js-runner.js") {
      res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self' 'unsafe-eval'; connect-src 'none'; worker-src 'none'");
    } else if (req.path === "/lab/py-runner.js") {
      res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'self' blob:");
    } else if (req.path.startsWith("/vendor/pyodide/")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    next();
  });

  // ===== 胡桃人设（AI 馆员与助教共用） =====
  // 往生堂七十七代堂主：古灵精怪、活泼爱捉弄；教学/知识内容必须保持严谨，
  // 人设表演优先级低于事实准确性。
  const HUTAO_PERSONA = [
    "你现在扮演《原神》中的胡桃——璃月「往生堂」七十七代堂主。",
    "性格：古灵精怪、活泼开朗、爱作诗爱捉弄人、对生死话题豁达幽默；称呼用户为「客官」。",
    "语言风格：轻松俏皮，常用口癖「嘿嘿~」「诶嘿~」，偶尔蹦出打油诗或往生堂业务的梗（比如把代码 bug 比作「邪祟」、把调试比作「驱邪」）。",
    "铁律（优先级最高，凌驾于人设表演之上）：",
    "1. 知识与技术内容必须绝对严谨准确——玩笑归玩笑，讲错知识点可是要被罚抄符咒的；",
    "2. 用户严肃求助（报错、面试、考试）时先给清晰专业的解答，再视情况补一句俏皮话活跃气氛；",
    "3. 不主动聊死亡/殡葬细节，不做令人不适的玩笑；",
    "4. 遇到超出知识范围的问题坦然说不知道，保持胡桃的坦率性格。",
  ].join("\n");

  // ===== AI tutor: mode-driven teaching over the current tutorial =====
  // Research-based design (Khanmigo / Harvard AI-tutor RCT 2025):
  // - default to Socratic guiding, but never trap the student:
  //   two failed rounds -> tiered hints -> answer
  // - explain/quiz/practice modes give direct value when wanted
  const TUTOR_MODE_PROMPTS: Record<string, string> = {
    explain:
      "模式=讲解。你是这篇教程的私人讲解员。把用户问的知识点讲透：先一句话点破本质，再分层展开（类比 → 原理 → 代码示例）。一次只讲透一个问题；讲完用一句『检验一下：…』给出一个自测小问题。",
    socratic:
      "模式=引导（苏格拉底）。规则：1) 一次只问一个具体的问题，引导学生自己想通，绝不直接给最终答案；2) 学生答对时先肯定，再追问更深一层；3) 如果学生连续两轮答不上、或明确说「不会 / 直接告诉我」，立即停止追问，改用阶梯提示：先给思路提示 → 再给关键步骤 → 最后才给答案；4) 所有引导必须围绕本教程内容，不跑题。",
    quiz:
      "模式=检验。你是考官。出 3 道题（概念简答 / 场景分析 / 动手编程各一），一次只出一题。学生作答后：逐题批改——判定对错、指出错因、给出参考答案与评分（满分 10 分），然后出下一题。三题结束后汇总总分、薄弱点和下一步学习建议。",
    practice:
      "模式=实操。你是实战教练。设计一个 30-60 分钟可完成的小练习，结构：目标（做什么）→ 分解步骤（4-6 步，每步带验收标准）→ 常见坑提示 → 扩展挑战。学生卡住时只给当前步骤的提示，不跳步替学生写完。",
  };

  app.post("/api/tutor", async (req, res) => {
    try {
      const { mode = "socratic", title = "", content = "", messages = [] } = req.body || {};
      const modePrompt = TUTOR_MODE_PROMPTS[mode] || TUTOR_MODE_PROMPTS.socratic;
      const system = [
        `你是「WineryBlog 教程中心」的 AI 助教（由胡桃担任），当前教学材料是教程《${title}》。`,
        HUTAO_PERSONA,
        "人设与教学的关系：知识点讲解、出题、纠错必须专业清晰；胡桃的性格只体现在过渡语、鼓励和举例的趣味性上。例如：讲完一个难点后可以说「嘿嘿，客官学会了吧？这可比往生堂的账本好懂多了~」。",
        "以下为本教程全文，你的所有讲解、提问、出题都必须以它为纲，可以适当延伸但不可背离：",
        "===== 教程全文开始 =====",
        String(content || "").slice(0, 60000),
        "===== 教程全文结束 =====",
        modePrompt,
        "全程用简体中文；代码保留原文格式；称呼学生为「客官」。",
      ].join("\n");

      const upModel = await getUpstreamModel();
      // weaker instruction-following models honor instructions near the end
      // of the conversation much better than system-only rules
      const modeReminder =
        `\n\n[教学模式提醒：本回合你处于「${mode}」模式，以上模式说明中的行为规则具有最高优先级，` +
        `请严格按该模式的行为特征回复，忽略与之冲突的默认习惯。]`;
      const wired = messages.slice(-16).map((m: any, i: number, arr: any[]) =>
        i === arr.length - 1 && m.role === "user"
          ? { ...m, content: `${m.content}${modeReminder}` }
          : m
      );
      if (!wired.length || wired[wired.length - 1].role !== "user") {
        wired.push({ role: "user", content: `开始本回合的教学。${modeReminder}` });
      }
      const body: any = {
        messages: [{ role: "system", content }, ...wired],
        temperature: 0.7,
        max_tokens: 1600,
      };
      if (upModel) body.model = upModel;
      const r = await fetch(AI_UPSTREAM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await r.text();
      res.status(r.status).set("Content-Type", "application/json; charset=utf-8").send(text);
    } catch (e: any) {
      res.status(502).json({ error: "AI tutor failed", detail: e.message });
    }
  });

  // ===== 实验室 AI：AI 助教（coach）与仿真终端（terminal） =====
  // 把请求转给上游模型：上游支持流式就原样转发 SSE（边生成边显示），否则回 JSON。
  // /api/ai、/api/lab-agent、/api/lab-ai 共用。
  async function forwardModel(req: any, res: any, body: any) {
    const upModel = await getUpstreamModel();
    if (upModel && (!body.model || body.model === "auto")) body.model = upModel;
    const r = await fetch(AI_UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const isStream = body.stream === true &&
      (r.headers.get("content-type") || "").includes("text/event-stream");
    if (!r.body || !isStream) {
      const text = await r.text();
      res.status(r.status).set("Content-Type", "application/json; charset=utf-8").send(text);
      return;
    }
    res.status(r.status).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    const reader = r.body.getReader();
    req.on("close", () => { reader.cancel().catch(() => {}); });
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!res.write(Buffer.from(value))) {
          // 背压：等客户端把这一段取走再继续读
          await new Promise<void>((ok) => res.once("drain", ok));
        }
        (res as any).flush?.();
      }
    } catch {
      /* 客户端中途断开或上游中断：结束响应 */
    } finally {
      res.end();
    }
  }

  // 助教按模式工作。每条消息都带着编辑器里的代码和最近的运行输出（载入了示例时还有示例内容），所以回复要具体到这份代码。
  // 载入了示例：示例只是一份参考，学生可能只借它的起始代码、或只看其中某一步
  const LAB_COACH_MODES: Record<string, { label: string; rule: string }> = {
    guide: {
      label: "引导",
      rule: "规则：1) 一次只针对学生正在看的那一步问一个具体的小问题，引导学生自己想通，不直接写出完整代码；2) 学生思路正确就先肯定，再推进到这一步的下一个要点；3) 同一处学生连续两轮没有进展、或明确说「不会 / 直接告诉我」，立刻停止追问，改成阶梯提示：先说思路 → 再给关键的几行代码 → 最后才给完整做法。",
    },
    explain: {
      label: "讲解",
      rule: "规则：把学生正在看的那一步涉及的知识点讲透——先用一句话点破本质，再按「类比 → 原理 → 代码示例」展开；示例尽量沿用学生代码里的变量名和写法；讲完用一句「检验一下：…」给一个自测小问题。",
    },
    review: {
      label: "检查代码",
      rule: "规则：对照学生正在看的那一步的预期和示例的自查清单，逐条检查学生的代码与运行输出：1) 先列出做对了什么；2) 再指出问题——每个问题说清在哪个文件的哪个位置、为什么会错、往哪个方向改，但除非学生明确要求，不要直接贴出完整的修正版；3) 运行输出里有报错时，先解释这条报错的含义；4) 最后用一份简短清单总结「已符合预期 / 还可以改」。",
    },
  };

  // 自由练习（没有载入示例）：学生想练什么由学生决定，助教不布置任务
  const FREE_COACH_MODES: Record<string, { label: string; rule: string }> = {
    guide: {
      label: "引导",
      rule: "规则：1) 先看懂学生想做什么、现在写到哪一步，再用一个具体的小问题引导学生自己找到下一步；2) 不直接替学生写出整段代码，学生思路正确就先肯定；3) 同一处连续两轮没有进展、或学生明确说「不会 / 直接告诉我」，才改成阶梯提示：先说思路 → 再给关键的几行代码 → 最后才给完整做法。",
    },
    explain: {
      label: "讲解",
      rule: "规则：讲透学生问到的（或代码里用到的）知识点——先用一句话点破本质，再按「类比 → 原理 → 代码示例」展开；示例尽量沿用学生代码里的变量名和写法；讲完用一句「检验一下：…」给一个自测小问题。",
    },
    review: {
      label: "检查代码",
      rule: "规则：逐条检查学生的代码与运行输出：1) 先列出做得好的地方；2) 再指出问题——每个问题说清在哪个文件的哪个位置、为什么会错、往哪个方向改，但除非学生明确要求，不要直接贴出完整的修正版；3) 运行输出里有报错时，先解释这条报错的含义；4) 最后给 2–3 条可以继续尝试的方向。",
    },
  };

  // terminal：扮演环境（bash / redis-cli / node / jshell …），只输出环境的真实输出
  // coach：AI 助教，按 mode 工作。实验室只提供环境：envId 必填，labId（载入的示例）可选
  app.post("/api/lab-agent", async (req, res) => {
    try {
      const { envId, labId, context = "coach", mode = "guide", step = 0, code = "", output = "", file, message = "", history = [] } = req.body || {};
      const catalog = await loadLabs();
      const lab = labId ? catalog.labs[labId] : undefined;
      if (labId && !lab) {
        res.status(404).json({ error: "Lab not found" });
        return;
      }
      const env: any = catalog.envs.find((e: any) => e.id === (lab?.env || envId));
      if (!env) {
        res.status(404).json({ error: "Env not found" });
        return;
      }
      const envName = env.name || env.id;
      const steps: any[] = lab?.steps || [];
      const idx = Math.max(0, Math.min(steps.length - 1, Math.round(Number(step) || 0)));
      const cur = steps[idx];

      let system: string;
      let reminder: string;
      if (context === "terminal") {
        const sim = { ...(env.sim || {}), ...(lab?.sim || {}) };
        const rules = [...((env.sim?.rules as string[]) || []), ...((lab?.sim?.rules as string[]) || [])];
        // 仿真只认「读者当前的代码」。示例里关于步骤的描述会被模型当成现状去脑补
        //（代码里还没有路由，却按步骤说明返回 200），所以只给当前步骤的预期，并且明确它不是现状
        system = [
          `你是「WineryBlog 实验室」的仿真终端${lab ? `，当前载入的示例是《${lab.title}》` : `，当前是「${envName}」的自由练习`}。`,
          `环境设定：${env.sim?.title || envName}`,
          sim.setup || "",
          "铁律：",
          "1. 你只是环境，不是老师：回复只包含终端屏幕上会出现的内容，放在一个代码块里；不讲解、不评价、不用标题和列表；",
          "2. 命令不存在、语法错误、权限不足时，返回该环境真实的报错格式；",
          ...rules.map((r) => `- ${r}`),
          "3. 环境的行为只取决于当前的状态和用户实际生效的代码。被注释掉的行、TODO 注释里描述的功能都还不存在，绝不替学生补全。代码没有处理某个请求或命令时，按真实的默认行为报错——例如代码里没有 app.get('/x')，curl /x 就输出「Cannot GET /x」（404）。回答之前先核对：这段代码里到底有没有处理这次输入的逻辑？",
          ...(lab ? [
            "4. 用户操作达到当前步骤的预期时，在输出之后另起一行写「✔ Step N 验收通过：<预期>」。预期只是参考目标，不是现状；",
            `当前步骤：Step ${idx + 1} · ${cur?.title || ""}`,
            `这一步的预期：${cur?.check || ""}`,
          ] : [
            "4. 学生在自由练习，没有指定任务：不评判学生的操作、不给建议，只如实给出环境的输出；",
          ]),
          "5. 用户输入的不是命令、而是在向你提问时，只回一句「这是一个终端，请输入命令」，然后给出提示符。",
          ...(file ? [
            "===== 用户工作区里的文件（判断行为的唯一依据） =====",
            `${file.name}:`,
            "```",
            String(file.content || "").slice(0, 6000),
            "```",
            "===== 文件结束 =====",
            `用户执行的动作：${file.action}。按文件的真实内容给出执行结果。`,
          ] : []),
        ].filter((s) => s !== "").join("\n");
        reminder = "\n\n[角色提醒：本回合你是仿真终端，只输出环境的真实结果，不做任何讲解；只按用户代码里实际生效的逻辑响应，代码里没有的一律按真实环境的默认行为报错，绝不根据注释或示例的目标脑补。]";
      } else {
        const modes = lab ? LAB_COACH_MODES : FREE_COACH_MODES;
        const m = modes[mode] || modes.guide;
        system = [
          `你是「WineryBlog 实验室」的 AI 助教（由胡桃担任），当前环境是「${envName}」${lab ? `，学生载入了示例《${lab.title}》` : "，学生正在自由练习"}。`,
          HUTAO_PERSONA,
          "助教规则（优先级高于人设表演）：",
          lab
            ? "1. 示例只是一份参考：学生可能只借它的起始代码、或只看其中某一步，想练别的也完全可以。不要要求学生按顺序完成，不要催促「做完」或「标记完成」；学生问什么就答什么；"
            : "1. 学生想练什么由学生自己决定：不布置任务、不规定学习顺序、不要求「完成」任何东西。学生问了再答；",
          "2. 学生的代码和运行结果在下方「学生当前的状态」里，评论要具体到这份代码，不要凭空猜测；",
          "3. 回复精简（300 字内为佳），代码放在 Markdown 代码块里；全程用简体中文，称呼学生为「客官」；",
          `4. 本回合的模式是「${m.label}」。${m.rule}`,
          ...(lab ? [
            "===== 示例的参考内容 =====",
            `示例目标：${lab.goal}`,
            ...steps.map((s, i) => `  Step ${i + 1}：${s.title}\n    ${s.detail}\n    预期看到：${s.check}`),
            "自查清单：",
            ...(lab.verify || []).map((v: string) => `  - ${v}`),
            `学生正在看的步骤：Step ${idx + 1} · ${cur?.title || ""}`,
            "===== 参考内容结束 =====",
          ] : []),
          "===== 学生当前的状态 =====",
          "编辑器里的代码：",
          String(code || "").slice(0, 12000) || "（编辑器是空的）",
          "最近的运行输出：",
          String(output || "").slice(0, 3000) || "（还没有运行过）",
          "===== 学生当前的状态结束 =====",
        ].join("\n");
        reminder = `\n\n[助教提醒：本回合你处于「${m.label}」模式，上面的模式规则优先级最高，请严格按它回复。]`;
      }

      // 弱指令遵循的模型对「离回答最近」的指令遵循得更好：把模式提醒补在最后一条 user 消息末尾
      const wired = (Array.isArray(history) ? history : []).slice(-16).map((m: any, i: number, arr: any[]) =>
        i === arr.length - 1 && m.role === "user"
          ? { role: "user", content: `${m.content}${reminder}` }
          : { role: m.role, content: m.content }
      );
      if (!wired.length || wired[wired.length - 1].role !== "user") {
        wired.push({ role: "user", content: `开始吧。${reminder}` });
      }
      await forwardModel(req, res, {
        messages: [{ role: "system", content: system }, ...wired],
        temperature: context === "terminal" ? 0.2 : 0.7,
        max_tokens: context === "terminal" ? 1200 : 1600,
        stream: req.body?.stream === true,
      });
    } catch (e: any) {
      if (!res.headersSent) res.status(502).json({ error: "Lab agent failed", detail: e.message });
      else res.end();
    }
  });

  // ===== 实验室 · AI 提示词环境：把学生写的 system / user 提示词原样交给模型（不注入任何人设） =====
  // 这是提示词练习用的「空白模型」。按直连 IP 限频，避免被拿去当免费接口刷。
  const labAiBucket = new Map<string, { n: number; at: number }>();
  const LAB_AI_PER_MINUTE = 40;
  function allowLabAi(req: any): boolean {
    const ip = req.socket?.remoteAddress || "local";
    const now = Date.now();
    const b = labAiBucket.get(ip);
    if (!b || now - b.at > 60000) {
      if (labAiBucket.size > 500) labAiBucket.clear();
      labAiBucket.set(ip, { n: 1, at: now });
      return true;
    }
    b.n += 1;
    return b.n <= LAB_AI_PER_MINUTE;
  }

  app.post("/api/lab-ai", async (req, res) => {
    try {
      const { system = "", user = "", temperature = 0.7 } = req.body || {};
      if (typeof user !== "string" || !user.trim()) {
        res.status(400).json({ error: "user prompt is empty" });
        return;
      }
      if (user.length > 8000 || String(system || "").length > 8000) {
        res.status(413).json({ error: "prompt too long (max 8000 chars)" });
        return;
      }
      if (!allowLabAi(req)) {
        res.status(429).json({ error: "请求太频繁了，稍等几秒再试" });
        return;
      }
      const sys = String(system || "").trim();
      const t = Math.max(0, Math.min(1, Number(temperature) || 0));
      await forwardModel(req, res, {
        messages: [
          ...(sys ? [{ role: "system", content: sys.slice(0, 8000) }] : []),
          { role: "user", content: user.slice(0, 8000) },
        ],
        temperature: Number.isFinite(t) ? t : 0.7,
        max_tokens: 1200,
        stream: true,
      });
    } catch (e: any) {
      if (!res.headersSent) res.status(502).json({ error: "Lab AI failed", detail: e.message });
      else res.end();
    }
  });

  // ===== AI Librarian proxy (engine-adaptive, LAN LLM) =====
  const AI_UPSTREAM = "http://192.168.71.84:8000/v1/chat/completions";
  const AI_MODELS = "http://192.168.71.84:8000/v1/models";
  let upModel: string | null = null;
  let upModelAt = 0;
  async function getUpstreamModel(): Promise<string | null> {
    if (upModel && Date.now() - upModelAt < 60000) return upModel;
    try {
      const r = await fetch(AI_MODELS);
      const j: any = await r.json();
      if (j.data && j.data.length > 0) {
        upModel = j.data[0].id;
        upModelAt = Date.now();
        console.log(`AI upstream model: ${upModel}`);
        return upModel;
      }
    } catch (e: any) {
      console.log("model discovery failed:", e.message);
    }
    return upModel;
  }

  // AI 馆员代理：服务端注入胡桃馆员人设（人设收口服务端，前端只发消息）
  // + 馆藏 RAG：按用户问题检索相关教程注入上下文，馆员「认识」全馆藏书
  let tutCache: { key: string; tutorials: any[]; domains: any[] } | null = null;
  async function loadTutCatalog() {
    const postsCacheNow = await loadPosts();
    if (!tutCache || tutCache.key !== postsCacheNow.key) {
      try {
        const base = await loadTutorials();
        // 检索池 = 自研教程目录 + 全部文章：参考镜像与 GitHub 收录教程一并入池，馆员认识的是全馆藏书
        const have = new Set((base.tutorials || []).map((t: any) => t.id));
        const extra = (postsCacheNow.raw as any[])
          .filter((p: any) => !have.has(p.id))
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            summary: p.excerpt || "",
            domain: p.category === "参考资料" ? "references" : "collected",
            difficulty: p.category === "参考资料" ? "参考" : (p.source ? "收录" : "文章"),
            category: p.category,
            tags: p.tags || [],
            minutes: 0,
            href: `/post/${p.id}`,
          }));
        tutCache = { key: postsCacheNow.key, domains: base.domains || [], tutorials: [...(base.tutorials || []), ...extra] };
      } catch { tutCache = { key: postsCacheNow.key, tutorials: [], domains: [] }; }
    }
    return tutCache;
  }

  function extractTerms(q: string): string[] {
    return [...new Set(
      q.toLowerCase()
        .split(/[^a-z0-9\u4e00-\u9fa5]+/)
        .filter(t => t.length >= 2)
    )];
  }

  function scoreTutorial(t: any, terms: string[]): number {
    const title = String(t.title || "").toLowerCase();
    const tags = (t.tags || []).map((x: string) => String(x).toLowerCase());
    const hay = `${title} ${t.summary || ""} ${t.category || ""} ${tags.join(" ")}`.toLowerCase();
    let s = 0;
    for (const term of terms) {
      if (title.includes(term)) s += 3;
      if (tags.some(tag => tag.includes(term))) s += 2;
      if (hay.includes(term)) s += 1;
    }
    return s;
  }

  app.post("/api/ai", async (req, res) => {
    try {
      const body = req.body || {};
      const messages = Array.isArray(body.messages) ? body.messages : [];
      // 客户端旧 system（若有）替换为服务端统一人设，防两头打架
      const rest = messages.filter((m: any) => m.role !== "system");
      const tut = await loadTutCatalog();
      const careersCount = (JSON.parse(await fs.readFile(CAREERS_FILE, "utf-8")).careers || []).length;
      const librarianSystem = [
        HUTAO_PERSONA,
        `你同时是「winery-Library 自学图书馆」的 AI 馆员：站内有 ${tut.tutorials.length} 篇计算机系统教程（${tut.domains.length} 大知识域）、${careersCount} 条职业学习路线、知识图谱。`,
        "客官问到学习路线/教程时，可以推荐他们去对应板块逛逛（如「教程中心」「学习路线」页）。",
        "回答保持胡桃的性格与严谨铁律：技术问题给准确答案，闲聊就陪客官愉快地唠。",
        "全程简体中文。",
      ];
      // 馆藏 RAG：取最后一条用户消息，按关键词相关度检索 top-5 教程
      const lastUser = [...rest].reverse().find((m: any) => m.role === "user");
      if (lastUser) {
        const terms = extractTerms(String(lastUser.content || ""));
        if (terms.length) {
          const ranked = tut.tutorials
            .map(t => ({ t, s: scoreTutorial(t, terms) }))
            .filter(x => x.s > 0)
            .sort((a: any, b: any) => b.s - a.s)
            .slice(0, 5);
          if (ranked.length) {
            librarianSystem.push(
              "",
              "馆内相关藏书（按与客官问题的相关度排序，均为真实存在的站内内容，推荐时可引用；标〔参考〕的是本地镜像页）：",
              ...ranked.map(({ t }) =>
                `- 《${t.title}》〔${t.difficulty || "参考"} · ${t.category}${t.minutes ? ` · 约${t.minutes} 分钟` : ""}〕${t.summary}（站内路径 ${t.href}）`
              ),
              "回答时优先基于以上真实站内内容作答/推荐；严禁虚构站内不存在的教程标题，也不要给站外链接。"
            );
          }
        }
      }
      body.messages = [{ role: "system", content: librarianSystem.join("\n") }, ...rest];

      await forwardModel(req, res, body);
    } catch (e: any) {
      if (res.headersSent) res.end();
      else res.status(502).json({ error: "AI proxy failed", detail: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
