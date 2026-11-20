---
title: Web 性能优化实战
category: Web 前端
order: 8
tags: [性能优化, Core Web Vitals, CDN, 首屏]
summary: 加载瀑布图解读、Core Web Vitals 三指标、缓存与 CDN 策略——从 3 秒到 1 秒的完整手段库。
---

## 1. 先学会测量：瀑布图与三指标

打开 Chrome DevTools → Network → 刷新，**瀑布图**每一行都是一个请求：横条 = 时间，灰色段 = 等待（TTFB），蓝色 = 下载。首屏慢的元凶一眼可见（通常是几条 2MB 的 JS 与无缓存的图片）。

**Core Web Vitals**（Google 官方三指标，也影响 SEO 排名）：

| 指标 | 含义 | 良好线 | 常见病因 |
| --- | --- | --- | --- |
| LCP | 最大内容元素出现 | ≤ 2.5s | 大图/慢接口/阻塞 JS |
| INP | 交互响应延迟 | ≤ 200ms | 长任务阻塞主线程 |
| CLS | 布局偏移 | ≤ 0.1 | 图片无宽高/动态插入内容 |

测量工具：Lighthouse（实验室数据）+ `web-vitals` 库上报真实用户数据（现场数据）。**优化前先拿到基线数字**。

## 2. 网络层三板斧

### ① 减少字节：压缩与图片

```nginx
# Nginx 侧 gzip/brotli（站点配置，见站内 Nginx 教程）
gzip on; gzip_types application/javascript text/css application/json;
```

图片是首屏字节的大头（常占 60%+）：
- 格式升级：PNG → **WebP**（-30%）/ AVIF（-50%），图标用 SVG
- 尺寸对齐：手机上加载 4000px 原图是最常见浪费——`srcset` 多分辨率：

```html
<img srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1600.webp 1600w"
     sizes="(max-width: 600px) 400px, 800px"
     src="hero-800.webp" width="800" height="400"   <!-- 宽高防 CLS -->
     loading="lazy" decoding="async">
```

### ② 减少往返：合并域名、预连接

```html
<!-- 提前与关键第三方握手（CDN、字体、API） -->
<link rel="preconnect" href="https://cdn.example.com">
<link rel="dns-prefetch" href="https://api.example.com">
```

HTTP/2 下"合并文件/雪碧图"已过时——现在追求**多路复用下的合理拆分**（变化频繁的与不变的分开缓存）。

### ③ 缩短路径：CDN

静态资源全部上 CDN（见站内《CDN 内容分发网络》），动态接口慢就上边缘缓存或换更近的机房。国内访海外服务器的 300ms RTT 是物理规律，选节点比改代码有效。

## 3. 缓存体系：四层各司其职

| 层 | 手段 | 关键配置 |
| --- | --- | --- |
| 浏览器 | 强缓存 | 带 hash 的文件 `Cache-Control: max-age=31536000, immutable` |
| 浏览器 | 协商缓存 | HTML 用 `ETag`/`Last-Modified`（304） |
| CDN | 边缘缓存 | 静态长 TTL + 主动刷新 API |
| 服务端 | 内存/Redis | 热点接口结果缓存 |

**带 hash 文件名的意义**：`app.a3f9.js` 内容变 → 文件名变 → 强缓存永不失效也不会旧。HTML 必须不缓存或短缓存（它引用 hash 文件名）。

## 4. JS 交付优化

```html
<!-- 关键脚本不阻塞解析 -->
<script src="app.js" defer></script>       <!-- defer：下载不阻塞，按序执行 -->
<script src="analytics.js" async></script> <!-- async：下载不阻塞，好就执行 -->
```

- 路由级代码分割（见站内《React 性能优化实战》）
- 包分析：`vite-bundle-visualizer`，干掉 moment/lodash 全量
- 骨架屏 + 非关键内容延迟：首屏只交付"看得见"的部分

## 5. 渲染层：别饿死主线程

- **长任务拆分**：>50ms 的任务用 `scheduler.yield()`/setTimeout 分片，或 `requestIdleCallback` 做低优工作
- **字体闪白**：`font-display: swap` + 字体子集化（中文字体必须子集化！全量中文字体 3-10MB，按需子集后几十 KB）
- **CLS 防治**：所有 img/canvas 写 width/height；动态插入内容预留空间；字体用尺寸相近的 fallback

## 6. 服务端与首屏路径

首屏的关键路径是：`DNS → TCP+TLS → HTML(白屏) → CSS → JS → API → 渲染`。压缩路径的手段：

1. **HTML 流式/SSR**：接口慢时先用骨架响应（TTFB 变好，感知快）
2. **接口聚合**：首屏发一个聚合请求而不是 5 个串行请求
3. **预加载关键 API**：HTML 里 `<link rel="preload" as="fetch">`
4. **SSR/SSG**（Next.js）：内容型站点直接服务端吐 HTML——LCP 杀手锏

## 7. 优化套路总结（按 ROI 排序）

1. 图片压缩/懒加载/新格式（一小时改完，收益最大）
2. 静态资源上 CDN + immutable 强缓存
3. JS 拆包 + defer/async
4. 接口聚合与缓存
5. 字体子集化
6. SSR/骨架屏（工程量大，前面做完再做）

每做完一步跑一次 Lighthouse 对比数字——**优化是工程，不是玄学**。

## 延伸阅读

- 站内相关：《浏览器渲染原理与事件循环》《React 性能优化实战》《Nginx 深入：反向代理与负载均衡》
- web.dev（Google 官方性能文档，Core Web Vitals 出处）
- 《High Performance Browser Networking》——网络层原理（免费在线）
