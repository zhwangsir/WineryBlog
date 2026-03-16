# WineryBlog

一个功能完整的个人博客系统，基于 React + Express + TypeScript 构建。

## 项目简介

WineryBlog 是一个现代化的高性能个人博客系统，采用前后端一体化架构，使用 JSON 文件作为轻量级数据存储。主题以《原神》中的角色胡桃（Hutao）为设计灵感，融合了二次元美学与现代 Web 设计理念。

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

### 特色功能
- **Markdown 文章支持** - 完整的 Markdown 渲染
- **后台管理系统** - 完整的文章与配置管理
- **音乐播放器** - 可自定义的背景音乐
- **主题定制** - 自定义主题色与光标
- **响应式设计** - 完美适配各种设备

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
│   ├── pages/             # 页面组件
│   │   └── admin/         # 管理后台
│   ├── context/           # 状态管理
│   └── utils/             # 工具函数
├── public/images/         # 静态资源
├── package.json           # 依赖配置
├── vite.config.ts         # Vite 配置
└── server.ts              # 主入口
```

## 功能特性

### 公共功能
- 📖 文章列表展示
- 📁 文章归档
- 👤 关于页面
- 📝 Markdown 文章详情
- 🔍 搜索功能

### 后台管理
- 📊 数据仪表盘
- ✏️ 文章管理（增删改）
- ⚙️ 网站配置管理
- 🎨 主题自定义

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

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/config` | 获取博客配置 |
| PUT | `/api/config` | 更新博客配置 |
| GET | `/api/posts` | 获取所有文章 |
| POST | `/api/posts` | 创建文章 |
| PUT | `/api/posts/:id` | 更新文章 |
| DELETE | `/api/posts/:id` | 删除文章 |

## 配置说明

博客配置存储在 `server/data/config.json`，包括：

- 博客标题、作者信息
- 导航菜单
- 主题颜色
- 音乐播放器配置
- 社交链接
- 页脚信息

## 许可证

MIT License
