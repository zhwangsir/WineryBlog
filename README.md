# WineryBlog

个人博客 + 自学图书馆：React 19 + Express + TypeScript，JSON 文件存配置与文章（无独立数据库）。UI 参考 Firefly，灵感来自胡桃主题。全站内容本地化，读者点击不出站。

> **路径**：`ALLProject/WineryBlog`  
> **状态**：维护  
> **最后更新**：2026-11-24

## 身份与远程

| 项 | 值 |
|----|----|
| origin（Gitee） | https://gitee.com/Winery_z/WineryBlog.git |
| github（备份） | https://github.com/zhwangsir/WineryBlog.git |
| 分支 | main 跟踪 origin/main |
| 配置域名 | blog.wineryz.top（server/data/config.json 的 domain 字段） |

集群真相源：**[`../ToIV/AGENTS.md`](../ToIV/AGENTS.md)**。

## 文档五件套

README.md / AGENTS.md / DEVELOPMENT.md / STATE.json / TEST_LOG.md。

## 特性（代码里有）

- 教程中心（知识域 / 职业路线 / 专题系列三分区 + 检索）、实验室（只提供环境：按方向分类，打开即练，可选示例 + 可开关的 AI 助教）、知识图谱（2D/3D）、AI 馆员（流式）
- 文章渲染（`src/components/markdown/`）：Prism 代码高亮、提示卡（mkdocs / VuePress 容器、GitHub 警示块、`<details>`）、KaTeX 公式（按需加载）、目录与锚点、配图图注
- 数据层：`/api/posts` 只下发摘要，正文按需取（`GET /api/posts/:id`），服务端进程内缓存 + 全文搜索（`/api/search`）
- 自有图床（多图源、字节级 + 感知级去重）；收录教程的配图存 `server/data/gallery/figures/`（不入库）
- 评论、PWA、分享海报、阅读进度、Live2D 桌宠、音乐卡（网易云官方播放器遥控 + 本地歌单）
- 文章锁：密码在服务端校验，解锁后签发限时令牌
- 后台：/admin 登录、仪表盘、文章 CRUD、教程、图床与歌单、评论、安全与系统、站点设置

## 技术栈

React 19、React Router 7、Tailwind 4、Motion、lucide-react、Express、tsx、Vite 6；react-markdown + remark-gfm、prismjs、katex；字体 @fontsource（本地打包，不外链 Google Fonts）。脚本：npm run dev / build / preview / lint / start（dev 与 start 都是 tsx server.ts）。

## 端口

`server.ts` 内硬编码 **PORT = 3000**。

## 启动

```
npm install
npm run dev
```

访问 http://localhost:3000 。生产：`npm run build` 后 `NODE_ENV=production npm start`。改了 `server.ts` 必须手动重启（tsx 非 watch）。

## 数据与配置

- `server/data/config.json`：站点标题、作者、hero、theme、footer、nav 等
- `server/data/posts.json`：文章数组（约 14MB）；`tutorials.json`：教程目录；`careers.json`：职业路线
- `server/data/labs.json`：实验数据（由 `scripts/build-labs.mjs` 从 `scripts/labs-src/` 生成，不要手改）
- `server/data/.session-secret`：管理会话签名密钥，首次启动自动生成（已 gitignore）
- `server/data/gallery/`：自有图床与教程配图（已 gitignore，只在本机磁盘）

管理员口令以 scrypt 哈希存在 `config.json` 的 `admin.passwordHash`；公开的 `GET /api/config` 会剥离整个 `admin` 字段。**不要把真实口令或任何凭据写进 README / 脚本 / 仓库**，凭据只走环境变量。

## API（摘要）

- POST /api/auth/login（按来源限频）、POST /api/auth/logout，GET /api/auth/verify，POST /api/auth/change-password
- GET/PUT /api/config（PUT 需鉴权；GET 会剥离 admin）
- GET /api/posts（摘要列表，不带正文）、GET /api/posts/:id（单篇，带正文）、POST /api/posts/:id/unlock、POST /api/posts/:id/view
- POST/PUT/DELETE /api/posts（需鉴权）
- GET /api/search?q=（标题 / 正文 / 标签 / 分类全文检索）
- GET /api/tutorials、/api/careers、/api/labs、/api/graph、/api/progress
- POST /api/ai（支持 `stream: true`，返回 SSE）、/api/tutor、/api/lab-agent（AI 助教与仿真终端，支持 `stream: true`）、/api/lab-ai（提示词实验用的空白模型，流式）
- GET /rss.xml

前端路由：/、/tutorials、/routes/:career、/lab、/graph、/ai、/archive、/about、/friends、/post/:id；后台 /admin/*。

## 实验室

`/lab` **只提供环境**：按方向分成若干实验环境，点开一个环境就是工作台——左边代码编辑器、右边运行结果，右上角的 **AI 助教随时开关**（看得见编辑器里的代码和运行结果）。想练什么由读者决定，没有任何完成度追踪。

| 环境 | 运行方式 |
|------|----------|
| 前端环境 | HTML / CSS / JS 实时渲染到沙箱 iframe（不联网、不跳转） |
| JavaScript | Web Worker 真实执行，支持顶层 await，死循环 8 秒后终止 |
| Python | Pyodide（浏览器里的 CPython） |
| 数据库 SQL | 浏览器里的 SQLite（sql.js）+ 一套练习库 |
| AI 提示词 | 把 system / user 提示词发给站内大模型，流式输出、逐次记录便于对比 |
| 服务器与运维 / Node.js 后端 / Java·Kotlin | 浏览器里跑不了真实环境，由站内大模型扮演终端（页面里明确标注为「AI 仿真」） |

每个环境附带几个**可选的示例练习**（`/lab?env=web&exp=<示例 id>`）：一键载入起始代码和一份分步参考，不用示例也完全不影响练习。示例内容用「目录即内容」的格式写在 `scripts/labs-src/<环境>/<示例>/`（`lab.json` + `files/` 起始代码 + `solution/` 参考答案），每个环境的空白起步代码在 `scripts/labs-src/<环境>/_starter/`。格式见 [`scripts/labs-src/README.md`](scripts/labs-src/README.md)。

```
npm run labs:build     # 汇编成 server/data/labs.json，并做结构校验（字段、站外地址零容忍）
npm run labs:test      # 真实执行 JS / SQL / Python 示例的起始代码与参考答案
npm run labs:pyodide   # 下载 Python 引擎到 public/vendor/pyodide/（约 14MB，不入 git，新环境执行一次）
```

## 收录管线

`scripts/fetch-github-tutorials.mjs` 把 GitHub 教程仓库的 Markdown 收录为站内文章：

```
GITHUB_TOKEN=<PAT> node scripts/fetch-github-tutorials.mjs --pool 2        # 定时任务：从候选池取 2 个
GITHUB_TOKEN=<PAT> node scripts/fetch-github-tutorials.mjs --refresh --only helloalgo,csnotes   # 原地重拉指定来源
GITHUB_TOKEN=<PAT> node scripts/fetch-github-tutorials.mjs --refresh       # 重拉全部已收录来源（只更新不新增）
```

重拉保留 id / 日期 / 阅读量 / 封面，并做标题一致性校验；配图下载进图床，hello-algo 的 `[file]{…}` 源码引用内联为代码块。收录后依次跑 `scripts/fix-violations.mjs` 与 `scripts/verify-no-outbound.mjs`（零外跳门禁，含「本地图片必须存在」检查）。

## 已知问题

- 管理会话存内存，服务重启后需重新登录
- `server/data/gallery/` 不入库：换机器部署需另行同步，否则封面与教程配图缺失（前台会回落成文字说明）
- `public/vendor/pyodide/` 不入库：换机器部署后执行一次 `npm run labs:pyodide`，否则 Python 实验会提示引擎缺失
- 历史提交里曾有明文口令与固定的会话密钥，建议尽快修改管理员密码
- 旧 README 写「部署到 js.org」仅为历史建议，当前以自有域名配置为准

push：`origin` 与 `github` 都要推。
