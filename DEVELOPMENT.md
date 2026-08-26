# DEVELOPMENT.md — WineryBlog

> 合并自旧 PROJECT_INIT / docs / 根目录散文档。原文在 `ALLProject/.archive/docs-legacy-20260827/`。
> 最后更新：2026-08-27

# 原 PROJECT_INIT

# WineryBlog · 项目初始化文档

> 由项目管理中枢自动生成 | 更新日期: 2026-07-12 | 负责人: zhwangsir

## 一、项目基本信息

| 字段 | 值 |
|------|----|
| 项目名称 | WineryBlog |
| 当前版本 | 0.0.0（package.json） |
| 创建日期 | 未明确记录（仓库提交历史可追溯） |
| 负责人 | zhwangsir |
| 项目路径 | /Users/wangzhenyu/Desktop/ALLProject/WineryBlog |
| 远程仓库 | https://github.com/zhwangsir/WineryBlog |
| 仓库可见性 | 公开（Public，约 290MB） |
| 线上地址 | https://blog.wineryz.top（见 server/data/config.json `domain` 字段） |

## 二、项目概述与核心功能

### 2.1 项目定位

WineryBlog 是一个**功能完整的个人博客系统**，采用前后端一体化架构（React 19 + Express + TypeScript），使用 **JSON 文件作为轻量级数据存储**（无数据库），融合二次元美学与现代 Web 设计理念，UI 界面参考 Firefly 主题模板，灵感来自原神胡桃主题。

### 2.2 核心功能列表

- **现代化 UI**：胡桃主题、粒子动画、萤火虫背景、波浪过渡、自定义鼠标样式。
- **Markdown 文章**：完整的富文本编辑器（`@uiw/react-md-editor`）、Tailwind Typography 样式、代码高亮。
- **文章密码保护**：`isLocked` + `password` 字段，支持单篇文章加密。
- **主题定制**：`accentColor`、`cursorUrl`、`globalBackground` 可配置。
- **响应式设计**：适配各种设备。
- **背景音乐播放器**：可配置的 `MusicPlayer` 组件。
- **后台管理系统**：仪表盘、文章管理（CRUD）、网站设置。
- **RSS Feed**：`/rss.xml` 自动生成（最新 20 篇）。
- **统计卡片**：文章数、分类数、标签数、字数、运行天数、最后活跃。

### 2.3 目标用户

个人博客作者，偏好二次元 / 胡桃主题美学，希望一个**轻量、无数据库、易部署**的博客系统。线上地址 `blog.wineryz.top`。

## 三、技术架构

### 3.1 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19, TypeScript ~5.8, React Router v7, Tailwind CSS v4, Tailwind Typography, Motion（framer-motion）, Lucide React, react-markdown, remark-gfm |
| 后端 | Express 4, Vite（开发中间件 + 构建）, tsx（TS 直接运行 server.ts） |
| 数据存储 | JSON 文件（`server/data/config.json` + `server/data/posts.json`） |
| 认证 | 自实现 SHA256 token + 内存 session Map（24h 过期） |
| AI 集成 | `@google/genai`（已声明依赖，可能用于 AI 辅助写作） |
| 构建 | Vite 6, `@vitejs/plugin-react` 5 |

### 3.2 架构说明

```
浏览器（React 19 SPA）
    │ HTTP
    ▼
Express (:3000，server.ts)
    ├─ /api/auth/{login,logout,verify}   认证（SHA256 token）
    ├─ /api/config       GET 公开 / PUT 鉴权
    ├─ /api/posts        GET 公开 / POST/PUT/DELETE 鉴权
    ├─ /api/posts/:id/view  POST 公开（浏览计数）
    ├─ /rss.xml          GET 公开（RSS 2.0）
    ├─ 开发模式：Vite middleware（middlewareMode: true, appType: "spa"）
    └─ 生产模式：express.static(dist) + SPA fallback
            ▼
JSON 文件存储
    ├─ server/data/config.json   博客配置 + admin 凭证
    └─ server/data/posts.json    文章数组
```

### 3.3 核心依赖

- **前端**：`react@^19`, `react-dom@^19`, `react-router-dom@^7.13`, `motion@^12.23`, `lucide-react@^0.546`, `react-markdown@^10`, `remark-gfm@^4`, `@uiw/react-md-editor@^4`, `clsx`, `tailwind-merge`, `@google/genai@^1.29`。
- **后端**：`express@^4.21`, `dotenv@^17.2`, `tsx@^4.21`（运行 server.ts）。
- **构建/样式**：`vite@^6.2`, `@vitejs/plugin-react@^5`, `tailwindcss@^4.1`, `@tailwindcss/vite`, `@tailwindcss/typography`, `autoprefixer`, `typescript@~5.8`。

## 四、目录结构

```
WineryBlog/
├── README.md                       # 项目说明（特性、技术栈、快速开始、API、配置、部署）
├── package.json                    # name=react-example, version=0.0.0, scripts={dev,build,preview,lint,start}
├── server.ts                       # ★ Express + Vite 中间件 主入口（:3000）
├── vite.config.ts                  # Vite 配置
├── tsconfig.json                   # TS 配置
├── index.html                      # SPA 入口
├── metadata.json                   # 元数据
├── .env.example                    # 环境变量模板
├── .gitignore
├── package-lock.json
├── server/
│   └── data/
│       ├── config.json             # 博客配置（domain/title/author/hero/theme/footer/admin）
│       └── posts.json              # 文章数据数组
└── src/
    ├── App.tsx                     # ★ 路由根（AuthProvider + DataProvider + Routes）
    ├── main.tsx                    # React 入口
    ├── index.css                   # 全局样式
    ├── components/
    │   ├── Layout.tsx              # 公共布局
    │   ├── Navbar.tsx, Footer.tsx, Sidebar.tsx
    │   ├── Hero.tsx                # 首页 Hero
    │   ├── PostCard.tsx, ProfileCard.tsx, StatsCard.tsx
    │   ├── TableOfContents.tsx, SearchModal.tsx, WaterfallGrid.tsx
    │   ├── Calendar.tsx, ColorPicker.tsx, Mascot.tsx, SEO.tsx
    │   ├── MusicPlayer.tsx         # 背景音乐
    │   ├── ParticleBackground.tsx, FireflyBackground.tsx, Sakura.tsx  # 动画背景
    │   └── MarkdownRenderer（隐含，基于 react-markdown）
    ├── context/
    │   ├── AuthContext.tsx         # 认证上下文（token + user）
    │   └── DataContext.tsx         # 数据上下文（config + posts）
    ├── data/
    │   ├── config.ts               # 前端默认 siteConfig（title/author/hero/profile/stats/nav）
    │   └── posts.ts                # 前端文章数据/类型
    ├── pages/
    │   ├── Home.tsx                # 首页
    │   ├── About.tsx               # 关于
    │   ├── Archive.tsx             # 归档
    │   ├── Friends.tsx             # 友链
    │   ├── PostDetail.tsx          # 文章详情（含密码保护）
    │   └── admin/
    │       ├── AdminLayout.tsx     # 后台布局
    │       ├── Login.tsx           # 登录
    │       ├── Dashboard.tsx       # 仪表盘
    │       ├── ManagePosts.tsx     # 文章管理
    │       ├── EditPost.tsx        # 编辑/新建文章
    │       └── ManageConfig.tsx    # 网站设置
    └── utils/
        └── cn.ts                   # className 合并（clsx + tailwind-merge）
```

### 关键文件功能说明

| 路径 | 功能 |
|------|------|
| `server.ts` | Express 主入口；JWT 风格 token 生成/验证、authMiddleware、auth/config/posts CRUD、浏览计数、RSS、Vite 中间件 |
| `package.json` | 依赖配置；scripts: dev/build/preview/clean/lint/start（均基于 tsx/vite） |
| `vite.config.ts` | Vite 构建配置 |
| `tsconfig.json` | TypeScript 配置 |
| `index.html` | SPA 入口 |
| `.env.example` | 环境变量模板 |
| `metadata.json` | 项目元数据 |
| `server/data/config.json` | 博客配置（domain/title/author/hero/theme/footer/admin 凭证） |
| `server/data/posts.json` | 文章数据数组（id/title/date/category/tags/excerpt/content/isLocked/password/views） |
| `src/App.tsx` | 路由根：`<AuthProvider><DataProvider><Router>` + 公开路由 + `/admin/*` 后台路由 |
| `src/main.tsx` | React 渲染入口 |
| `src/data/config.ts` | 前端默认 `siteConfig`（title/author/hero/profile/stats/nav） |
| `src/data/posts.ts` | 前端文章数据与类型定义 |
| `src/context/AuthContext.tsx` | 认证上下文（token 存储、登录/登出/验证） |
| `src/context/DataContext.tsx` | 数据上下文（拉取 config + posts） |
| `src/components/MusicPlayer.tsx` | 背景音乐播放器 |
| `src/components/ParticleBackground.tsx` 等 | 粒子/萤火虫/樱花动画背景 |
| `src/utils/cn.ts` | `clsx` + `tailwind-merge` 合并 className |

## 五、环境搭建

### 5.1 前置环境要求

- Node.js（建议 18+，依赖 React 19 / Vite 6）
- npm（或 pnpm/yarn，但 `package-lock.json` 表明使用 npm）

### 5.2 依赖安装步骤

```bash
npm install
```

### 5.3 环境变量配置

参考 `.env.example`。生产部署需设置：

| 变量 | 说明 |
|------|------|
| `NODE_ENV` | `production` 时启用静态文件服务，关闭 Vite 中间件 |
| （其他见 .env.example） | — |

> 注意：`server.ts` 中 `JWT_SECRET = "wineryblog-secret-key-2026"` **硬编码**，生产环境应改为环境变量读取。

## 六、启动与运行

### 6.1 开发模式启动

```bash
npm run dev      # tsx server.ts，启动 Express + Vite 中间件
```

服务运行在 `http://localhost:3000`。开发模式下 Vite 以 middlewareMode 接管 HMR。

### 6.2 生产构建

```bash
npm run build    # vite build，输出到 dist/
npm run lint     # tsc --noEmit 类型检查
```

### 6.3 部署方式

**生产部署**：

```bash
npm run build
NODE_ENV=production npm start    # tsx server.ts，静态服务 dist/ + SPA fallback
```

**部署到 js.org 免费域名**（README 推荐）：
1. 将代码推送到 GitHub
2. 创建名为 `username.github.io` 的仓库（或自定义域名）
3. 在 GitHub 仓库设置中添加 js.org 子域名

**线上地址**：`https://blog.wineryz.top`（见 `server/data/config.json` 的 `domain` 字段）。

## 七、主要接口说明

### 认证接口

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | 公开 | 登录（username + password → token） |
| POST | `/api/auth/logout` | 公开 | 登出 |
| GET | `/api/auth/verify` | Bearer token | 验证 token 有效性 |

### 配置接口

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/config` | 公开 | 获取博客配置（剥离 admin 字段） |
| PUT | `/api/config` | authMiddleware | 更新配置（保留原 admin 凭证） |

### 文章接口

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/posts` | 公开 | 获取所有文章 |
| POST | `/api/posts` | authMiddleware | 创建文章（自动生成 id + views=0） |
| PUT | `/api/posts/:id` | authMiddleware | 更新文章 |
| DELETE | `/api/posts/:id` | authMiddleware | 删除文章 |
| POST | `/api/posts/:id/view` | 公开 | 浏览计数 +1 |

### RSS

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/rss.xml` | RSS 2.0 Feed（最新 20 篇，按日期降序） |

### 前端路由（`src/App.tsx`）

**公开路由**（`<Layout />` 内）：
- `/` — 首页
- `/archive` — 归档
- `/about` — 关于我
- `/friends` — 友链
- `/post/:id` — 文章详情

**后台路由**（`<AdminLayout />` 内）：
- `/admin/login` — 登录
- `/admin` — 仪表盘
- `/admin/posts` — 文章管理
- `/admin/posts/new` — 新建文章
- `/admin/posts/edit/:id` — 编辑文章
- `/admin/settings` — 网站设置

## 八、已知问题与注意事项

- **JWT_SECRET 硬编码**：`server.ts` 第 8 行 `const JWT_SECRET = "wineryblog-secret-key-2026"`，生产环境应改为 `process.env.JWT_SECRET`。
- **Session 存内存**：`const sessions = new Map()`，重启即失效，且不支持多实例；生产建议改 Redis。
- **admin 凭证明文存 config.json**：`server/data/config.json` 的 `admin.username` + `admin.password` 为明文，JSON 文件可被 git 跟踪，**务必加入 `.gitignore` 或改哈希存储**。
- **数据存储无并发控制**：`posts.json` / `config.json` 全文读写，高并发下存在丢数据风险（适合个人博客低流量场景）。
- **`package.json` name 为 `react-example`**：与项目名 WineryBlog 不一致，发布 npm 时需改名（当前 `private: true` 不影响）。
- **版本号 `0.0.0`**：未做语义化版本管理。
- **仓库 290MB**：可能含大量图片资源（`public/images/`），clone 较慢，建议用 Git LFS 或清理历史。
- **`@google/genai` 依赖**：已声明但 README 未提及 AI 功能，可能用于未来的 AI 辅助写作。
- **文章密码保护为前端实现**：`isLocked` + `password` 字段存于 posts.json，若前端校验则可被绕过；建议后端在 `GET /api/posts` 时对 locked 文章剥离 content。
- **RSS `category` 标签未转义**：`server.ts` 第 230 行 `<category>${post.category}</category>` 未做 XML 转义，含特殊字符的 category 会破坏 RSS。

## 九、与其他项目的关系

- **WineryBlog 是 ALLProject 体系中的"个人博客"**：独立运行，与 WeBrain / LoveStar / test 无代码依赖。
- **与 LoveStar 风格相近**：均为个人内容展示型网站，但 WineryBlog 用 React 19 + Express + TS，LoveStar 用原生 JS + Express + SQLite。
- **技术栈与 test 项目相近**：两者均用 React + Vite + Tailwind，但 WineryBlog 用 React 19 + Tailwind v4，test 用 React 18 + Tailwind v3；WineryBlog 是功能性博客，test 是设计 Showcase。
- **线上地址独立**：`blog.wineryz.top`，不依赖其他项目的基础设施。
- **可被 WeBrain 作为工具数据源**（理论）：WineryBlog 暴露的 `/api/*` 与 `/rss.xml` 可被 WeBrain 副脑作为博客内容工具调用。


## 已归档文档索引

- `Gitee上传方法.md` — Gitee 上传方法（全项目统一）
- `PROJECT_INIT.md` — WineryBlog · 项目初始化文档
- `设备说明.md` — 集群设备说明（单一真相源）
