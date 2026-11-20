---
title: HTTP 缓存完全指南
category: Web 前端
order: 16
tags: [HTTP, 缓存, 强缓存, 协商缓存]
summary: 强缓存与协商缓存的两级判定、Cache-Control 全指令、CDN 与浏览器缓存的分层协作。
---

## 1. 缓存的两级判定流程

浏览器收到一个"可缓存"的资源请求时，判定顺序固定：

```
请求资源
  ↓
① 强缓存命中？（Cache-Control: max-age 未过期 / Expires 未到期）
   ├─ 是 → 直接用本地副本，不发请求（200 from disk/memory cache）
   └─ 否 ↓
② 协商缓存：发条件请求到服务器
   If-None-Match: ETag  /  If-Modified-Since: Last-Modified
   ├─ 未变 → 304 Not Modified（无 body，只回 header）→ 用本地副本
   └─ 变了 → 200 + 新内容 + 新缓存头
```

**强缓存省掉整个往返**（最快）；协商缓存省掉响应体（仍需一次 RTT）。两级设计让"新鲜期内的零请求"与"过期后的低成本校验"兼得。

## 2. Cache-Control 指令全表

```http
Cache-Control: public, max-age=31536000, immutable
```

| 指令 | 作用对象 | 语义 |
| --- | --- | --- |
| `max-age=N` | 全部 | 新鲜期 N 秒 |
| `no-cache` | 全部 | **可以存但每次必须协商**（不是不缓存！） |
| `no-store` | 全部 | 彻底不存（敏感数据） |
| `public` | 共享缓存 | CDN/代理可缓存（含带鉴权的响应） |
| `private` | 浏览器 | 仅本机缓存（CDN 不存） |
| `immutable` | 浏览器 | 新鲜期内永不协商（即使用户刷新） |
| `max-stale` / `min-fresh` | 请求 | 容忍过期多久 / 至少还要新鲜多久 |
| `stale-while-revalidate=N` | CDN/浏览器 | 过期后可先回旧内容，后台异步更新 |
| `must-revalidate` | 全部 | 过期后必须协商，不得用过期内容救急 |

**高频误解**：`no-cache` ≠ 不缓存（它只是强制协商）；`no-store` 才是"别存"。Ctrl+F5 与 F5 的差异：F5 给所有请求带 `max-age=0`（强制协商），Ctrl+F5 带 `no-cache`（且可能跳过缓存直接取）。

## 3. ETag 与 Last-Modified：协商凭据

| 凭据 | 依据 | 优缺点 |
| --- | --- | --- |
| `Last-Modified` / `If-Modified-Since` | 文件修改时间（秒级） | 简单；秒内多次修改检测不到；时钟依赖 |
| `ETag` / `If-None-Match` | 内容指纹（哈希/版本号） | 精确；集群间需一致算法，否则误判 |

优先级：请求同时带两组时，**ETag 优先**（If-None-Match 优先于 If-Modified-Since）。ETag 生成建议：内容哈希或版本号；**Nginx 集群注意**——默认 ETag 含 mtime+size，多机不一致会导致协商永远 200，需统一或关闭。

**ETag 的一个妙用**：HTML 页面本身也可协商缓存（`no-cache` + ETag）——内容没变的页面返回 304，既新鲜又省流量。

## 4. 分层缓存策略（生产标配）

| 资源 | 策略 | 理由 |
| --- | --- | --- |
| 带 hash 的 JS/CSS/图片 | `max-age=31536000, immutable` | 内容变 = 文件名变，永不过期 |
| HTML | `no-cache`（+ ETag） | 必须每次校验，保证引用最新资源 |
| API JSON | `no-store` 或 `private, max-age=0` | 数据实时性 |
| 用户敏感数据 | `no-store, private` | 防共享缓存泄漏 |

**HTML 与 hash 文件的配合**是整个体系的心脏：HTML（不缓存/短缓存）→ 引用带 hash 的静态资源（一年强缓存）。发布新版 = 新 hash 文件 + 新 HTML，旧资源自然淘汰，零缓存事故。

## 5. 缓存的常见失效场景与诊断

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| 改了代码用户看不到 | HTML 被强缓存 | HTML 改 no-cache；静态资源文件名加 hash |
| 静态资源每次都 304 | 没配强缓存 | 加 immutable 长缓存 |
| 集群下 ETag 304 失效 | 各机 ETag 算法不一致 | 统一生成或关闭 ETag 用 Last-Modified |
| CDN 回源风暴 | 大量缓存同时过期 | TTL 加抖动；stale-while-revalidate |
| 登录态接口被 CDN 缓存 | 响应缺 private/no-store | API 网关统一加头 |
| DevTools 看 200 但秒回 | 强缓存命中（disk/memory cache） | 正常，非问题 |

诊断路径：DevTools → Network → 勾 Disable cache 前后对比 → 看 Response Headers 的缓存指令与 Size 列（`(disk cache)`/`(memory cache)`/304/200）。

## 6. 与 CDN/代理缓存的协作

共享缓存（CDN）有额外的"多用户"维度：

- `public/private` 决定能否进共享缓存；带 `Authorization` 的响应默认不可被共享缓存（除非显式 public）
- CDN 层的 `s-maxage` **只对共享缓存生效**且优先级高于 max-age——典型用法：`max-age=60, s-maxage=86400`（浏览器 1 分钟校验，CDN 缓存一天）
- **缓存击穿**（热点 key 同时过期回源）→ `stale-while-revalidate` 或 CDN 预热（见站内《CDN 内容分发网络》）
- **Vary: Accept-Encoding** 必须随压缩响应携带——否则 gzip 版本可能发给不支持压缩的客户端

## 7. 与 Service Worker 的关系

Service Worker 是"可编程的缓存代理"——拦截请求后自行决定策略（Cache-first、Network-first、stale-while-revalidate 等模式可按路由组合）。它位于 HTTP 缓存之上，二者可叠加（SW 里也可以让请求继续走 HTTP 缓存）。PWA 离线能力的地基。

## 8. 自测五题

1. no-cache 与 no-store 的本质区别？
2. 强缓存与协商缓存分别省掉了什么？
3. ETag 与 Last-Modified 同时存在时谁优先？
4. hash 文件名 + immutable 为什么是静态资源的终极答案？
5. s-maxage 与 max-age 的生效对象差异？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《Web 性能优化实战》（缓存在优化体系中的位置）、《Nginx 深入：反向代理与负载均衡》（服务端缓存头配置）、《CDN 内容分发网络》《HTTP/HTTPS 协议详解》
- 站内参考资料：《MDN HTTP 概述》（本地镜像 /post/ref-http-mdn）
- MDN HTTP Caching 指南（站内后续可镜像收录）
