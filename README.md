# WineryBlog

个人博客：React 19 + Express + TypeScript，JSON 文件存配置与文章（无独立数据库）。UI 参考 Firefly，灵感来自胡桃主题。

> **路径**：`ALLProject/WineryBlog`  
> **状态**：维护  
> **最后更新**：2026-08-27

## 身份与远程

| 项 | 值 |
|----|----|
| origin（Gitee） | https://gitee.com/Winery_z/WineryBlog.git |
| github（备份） | https://github.com/zhwangsir/WineryBlog.git |
| 分支 | main 跟踪 origin/main |
| package.json | name 仍为 `react-example`，version `0.0.0`（与产品名不一致） |
| 配置域名 | blog.wineryz.top（server/data/config.json 的 domain 字段） |

集群真相源：**[`../ToIV/AGENTS.md`](../ToIV/AGENTS.md)**。

## 文档五件套

README.md / AGENTS.md / DEVELOPMENT.md / STATE.json / TEST_LOG.md。

## 特性（代码里有）

- Markdown 文章（@uiw/react-md-editor、react-markdown、remark-gfm）
- 文章锁（isLocked + password 字段）
- 主题：accentColor、自定义鼠标、背景、波浪、樱花、吉祥物开关
- MusicPlayer、粒子 / 萤火虫 / 樱花背景
- 后台：/admin 登录、仪表盘、文章 CRUD、网站设置
- RSS：/rss.xml（最新 20 篇）

## 技术栈

React 19、React Router 7、Tailwind 4、Motion、lucide-react、Express、tsx、Vite 6。可选依赖 @google/genai（已声明）。脚本：npm run dev / build / preview / lint / start（dev 与 start 都是 tsx server.ts）。

## 端口

`server.ts` 内硬编码 **PORT = 3000**。端口规划建议 4101，**代码尚未改**。

## 启动

```
npm install
npm run dev
```

访问 http://localhost:3000 。生产：`npm run build` 后 `NODE_ENV=production npm start`。

## 数据与配置

- `server/data/config.json`：站点标题、作者、hero、theme、footer、nav 等
- `server/data/posts.json`：文章数组
- `.env.example` 只有 GEMINI_API_KEY / APP_URL 模板说明

公开配置字段示例：domain=blog.wineryz.top，title=WineryBlog，author=Winery。**admin 凭证存在 config.json 内，不要把真实口令写进 README 或公开仓库**；DEVELOPMENT.md 已提示应改哈希或移出 git。

## API（摘要）

- POST /api/auth/login|logout，GET /api/auth/verify
- GET/PUT /api/config（PUT 需鉴权；GET 会剥离 admin）
- GET/POST/PUT/DELETE /api/posts，POST /api/posts/:id/view
- GET /rss.xml

前端路由：/、/archive、/about、/friends、/post/:id；后台 /admin/*。

## 已知问题（来自 DEVELOPMENT.md）

- JWT 相关密钥在 server.ts 硬编码，生产应改环境变量
- session 存内存，重启失效
- package name / version 占位
- 文章锁若只在前端校验可被绕过
- 旧 README 写「部署到 js.org」仅为历史建议，当前以自有域名配置为准

push：`origin` 与 `github` 都要推。
