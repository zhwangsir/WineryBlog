import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// JWT Secret (in production, use environment variable)
const JWT_SECRET = "wineryblog-secret-key-2026";
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// In-memory session store (in production, use Redis)
const sessions = new Map<string, { username: string; expiry: number }>();

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

  // Large limit: image uploads arrive as base64 JSON
  app.use(express.json({ limit: "20mb" }));

  const DATA_DIR = path.join(process.cwd(), "server", "data");
  const CONFIG_FILE = path.join(DATA_DIR, "config.json");
  const POSTS_FILE = path.join(DATA_DIR, "posts.json");
  const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

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
      // Sanitize original name; fall back to "file"
      const safeBase = (String(name || "file").replace(/\.[^.]+$/, "").replace(/[^\w\u4e00-\u9fa5-]+/g, "_").slice(0, 40)) || "file";
      const filename = `${Date.now().toString(36)}-${safeBase}.${ext}`;
      await fs.writeFile(path.join(UPLOAD_DIR, filename), buf);
      res.json({ url: `/uploads/${filename}`, size: buf.length });
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
    try {
      const { username, password } = req.body;
      const data = await fs.readFile(CONFIG_FILE, "utf-8");
      const config = JSON.parse(data);

      if (username === config.admin?.username && password === config.admin?.password) {
        const token = generateToken(username);
        res.json({ success: true, token, username });
      } else {
        res.status(401).json({ error: "Invalid username or password" });
      }
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
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

  app.get("/api/posts", async (req, res) => {
    try {
      const data = await fs.readFile(POSTS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read posts" });
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
        posts[index] = { ...posts[index], ...req.body };
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

  // RSS Feed endpoint
  app.get("/rss.xml", async (req, res) => {
    try {
      const [configData, postsData] = await Promise.all([
        fs.readFile(CONFIG_FILE, "utf-8"),
        fs.readFile(POSTS_FILE, "utf-8")
      ]);
      
      const config = JSON.parse(configData);
      const posts = JSON.parse(postsData);
      
      const siteUrl = `https://${config.domain || 'blog.wineryz.top'}`;
      const siteTitle = config.title || 'WineryBlog';
      const siteDescription = config.subtitle || '';
      
      // Build RSS XML
      const items = posts
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20)
        .map((post: any) => {
          const postUrl = `${siteUrl}/post/${post.id}`;
          const pubDate = new Date(post.date).toUTCString();
          return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
      <category>${post.category}</category>
    </item>`;
        }).join('');

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteTitle}</title>
    <link>${siteUrl}</link>
    <description>${siteDescription}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.send(rss);
    } catch (error) {
      res.status(500).send('Error generating RSS feed');
    }
  });

  // ===== Knowledge Graph (built from posts) =====
  app.get("/api/graph", async (req, res) => {
    try {
      const data = await fs.readFile(POSTS_FILE, "utf-8");
      const posts = JSON.parse(data);

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

  app.get("/api/tutorials", async (req, res) => {
    try {
      res.json(JSON.parse(await fs.readFile(TUTORIALS_FILE, "utf-8")));
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
  app.post("/api/ai", async (req, res) => {
    try {
      const body = req.body || {};
      const messages = Array.isArray(body.messages) ? body.messages : [];
      // 客户端旧 system（若有）替换为服务端统一人设，防两头打架
      const rest = messages.filter((m: any) => m.role !== "system");
      const librarianSystem = [
        HUTAO_PERSONA,
        "你同时是「winery-Library 自学图书馆」的 AI 馆员：站内有 170+ 篇计算机系统教程（11 大知识域）、12 条职业学习路线、知识图谱。",
        "客官问到学习路线/教程时，可以推荐他们去对应板块逛逛（如「教程中心」「学习路线」页）。",
        "回答保持胡桃的性格与严谨铁律：技术问题给准确答案，闲聊就陪客官愉快地唠。",
        "全程简体中文。",
      ].join("\n");
      body.messages = [{ role: "system", content: librarianSystem }, ...rest];

      const upModel = await getUpstreamModel();
      if (upModel) body.model = upModel;
      const r = await fetch(AI_UPSTREAM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await r.text();
      res.status(r.status).set("Content-Type", "application/json; charset=utf-8").send(text);
    } catch (e: any) {
      res.status(502).json({ error: "AI proxy failed", detail: e.message });
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
