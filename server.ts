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

  app.use(express.json());

  const DATA_DIR = path.join(process.cwd(), "server", "data");
  const CONFIG_FILE = path.join(DATA_DIR, "config.json");
  const POSTS_FILE = path.join(DATA_DIR, "posts.json");

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
