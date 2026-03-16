# WineryBlog

一个功能完整的个人博客系统，基于 React + Express + TypeScript 构建。

## 项目简介

WineryBlog 是一个现代化的高性能个人博客系统，采用前后端一体化架构，使用 JSON 文件作为轻量级数据存储。主题以《原神》中的角色胡桃（Hutao）为设计灵感，融合了二次元美学与现代 Web 设计理念。

## 特性

- ✨ 现代化 UI 设计，灵感来自原神胡桃主题
- 📝 Markdown 文章支持，完整的富文本编辑器
- 🔒 文章密码保护功能
- 🎨 丰富的主题定制选项
- 📱 响应式设计，完美适配各种设备
- 🎵 可配置的背景音乐播放器
- ✨ 粒子动画和萤火虫效果
- 🌊 波浪过渡动画
- 🖱️ 自定义鼠标样式
- 📊 完整的后台管理系统

## 技术栈

### 前端
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **React Router v7** - 路由管理
- **Tailwind CSS v4** - 原子化 CSS 框架
- **Tailwind Typography** - Markdown 文章样式
- **Motion** - 动画库
- **Lucide React** - 图标库

### 后端
- **Express** - Node.js Web 框架
- **Vite** - 开发服务器与构建工具

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

服务运行在 http://localhost:3000

### 生产构建

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 项目结构

```
wineryblog/
├── server/                 # Express 后端服务
│   ├── data/
│   │   ├── config.json    # 博客配置
│   │   └── posts.json     # 文章数据
│   └── server.ts          # 服务入口
├── src/                    # React 前端
│   ├── components/        # UI 组件
│   │   ├── Wave.tsx              # 波浪组件
│   │   ├── ParticleBackground.tsx # 粒子背景
│   │   ├── FireflyBackground.tsx  # 萤火虫效果
│   │   └── ...
│   ├── pages/             # 页面组件
│   │   └── admin/         # 管理后台
│   ├── context/           # 状态管理
│   └── utils/             # 工具函数
├── public/images/         # 静态资源
├── package.json           # 依赖配置
├── vite.config.ts         # Vite 配置
└── server.ts              # 主入口
```

## 配置说明

### 基础配置 (server/data/config.json)

```json
{
  "domain": "blog.wineryz.top",
  "title": "WineryBlog",
  "author": "Winery",
  "subtitle": "永远相信，美好的事情即将发生。",
  "hero": {
    "title": "Lovely HuTao!",
    "subtitle": "逗留采血色，伴君眠花房。",
    "image": "/images/hero.svg",
    "credit": "Pixiv - 水菜カステラ"
  },
  "theme": {
    "accentColor": "#F27D26",
    "cursorUrl": "",
    "globalBackground": ""
  },
  "footer": {
    "copyright": "© 2026 WineryBlog. All rights reserved.",
    "icp": "豫ICP备xxxxxxxx号-x"
  }
}
```

### 文章配置

文章存储在 `server/data/posts.json`，支持以下字段：

```json
{
  "id": "1",
  "title": "文章标题",
  "date": "2026-03-16",
  "category": "分类",
  "tags": ["标签1", "标签2"],
  "excerpt": "文章摘要",
  "content": "Markdown 内容",
  "isLocked": false,
  "password": ""
}
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/config` | 获取博客配置 |
| PUT | `/api/config` | 更新博客配置 |
| GET | `/api/posts` | 获取所有文章 |
| POST | `/api/posts` | 创建文章 |
| PUT | `/api/posts/:id` | 更新文章 |
| DELETE | `/api/posts/:id` | 删除文章 |

## 后台管理

访问 `/admin` 进入后台管理系统：

- **仪表盘** - 查看博客统计数据
- **文章管理** - 创建、编辑、删除文章
- **网站设置** - 配置博客各项参数

## 主题定制

### 主题色

在设置中修改 `accentColor` 来调整主题色。

### 自定义鼠标

设置 `theme.cursorUrl` 为自定义光标图片路径。

### 背景图片

设置 `theme.globalBackground` 为背景图片 URL。

## 部署

### 构建生产版本

```bash
npm run build
```

### 部署到服务器

1. 构建项目：`npm run build`
2. 设置环境变量 `NODE_ENV=production`
3. 运行：`npm start`

### 部署到 js.org 免费域名

1. 将代码推送到 GitHub
2. 创建名为 `username.github.io` 的仓库（如需自定义域名可跳过）
3. 在 GitHub 仓库设置中添加你的 js.org 子域名

## 许可证

MIT License
