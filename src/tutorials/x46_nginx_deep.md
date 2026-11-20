---
title: Nginx 深入：反向代理与负载均衡
category: 操作系统与运维
order: 8
tags: [Nginx, 反向代理, 负载均衡, 运维]
summary: 反代原理、upstream 五种策略、限流与 HTTPS——一台 Nginx 撑起整站流量的完整配置手册。
---

## 1. 正向代理 vs 反向代理：谁躲在谁后面

- **正向代理**代理**客户端**（翻墙工具）：服务器不知道真实客户端是谁
- **反向代理**代理**服务端**（Nginx 的本职）：用户不知道后面有几台服务器

反向代理四大用途：**负载均衡**（流量分摊）、**SSL 终结**（证书集中一处）、**缓存加速**、**安全屏障**（隐藏后端拓扑、统一限流）。

## 2. 核心配置手册

```nginx
# /etc/nginx/nginx.conf 主结构
user www-data;
worker_processes auto;              # 进程数 = CPU 核数
events {
    worker_connections 1024;        # 每进程连接数
}
http {
    include /etc/nginx/conf.d/*.conf;   # 站点配置拆文件
}
```

一个完整的站点配置（反代 + HTTPS + 静态资源分离）：

```nginx
# /etc/nginx/conf.d/blog.conf
upstream blog_backend {
    server 127.0.0.1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 backup;             # 备机：主力全挂才顶上
    keepalive 64;                              # 与后端的长连接池
}

server {
    listen 80;
    server_name blog.example.com;
    return 301 https://$host$request_uri;      # 全量 301 到 HTTPS
}

server {
    listen 443 ssl http2;
    server_name blog.example.com;

    ssl_certificate     /etc/letsencrypt/live/blog.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blog.example.com/privkey.pem;

    # 静态资源直接由 Nginx 服务（不走后端）
    location /static/ {
        alias /var/www/blog/static/;
        expires 30d;                           # 浏览器缓存 30 天
        add_header Cache-Control "public, immutable";
    }

    # 动态请求反代到后端
    location / {
        proxy_pass http://blog_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;          # WebSocket 升级
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;                     # 传真实域名
        proxy_set_header X-Real-IP $remote_addr;         # 传真实客户端 IP
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

**新手三坑**：
1. `proxy_pass` 忘传 `Host` → 后端 `req.host` 永远是 upstream 名
2. 忘配 `X-Real-IP` → 后端日志全是 127.0.0.1
3. WebSocket 没配 Upgrade 头 → 连接 30 秒必断

## 3. 负载均衡五种策略

```nginx
upstream api {
    # ① 轮询（默认）：按顺序一人一次
    server a:8000; server b:8000;

    # ② weight：加权轮询（机器配置不均时）
    # server a:8000 weight=3; server b:8000 weight=1;

    # ③ ip_hash：同一客户端固定打到同一台（会话保持，代价是负载可能偏斜）
    # ip_hash;  server a:8000; server b:8000;

    # ④ least_conn：谁连接少给谁（长连接业务优选）
    # least_conn;  server a:8000; server b:8000;

    # ⑤ hash：按自定义 key 一致性分发（如按 user_id 保持会话）
    # hash $arg_user_id consistent;
}
```

健康检查：`max_fails=3 fail_timeout=30s`——连续失败 3 次拉黑 30 秒。主动健康检查（定期探测）是 Nginx Plus 商业版功能，开源方案用 `nginx_upstream_check_module` 或外挂探测脚本。

## 4. 限流：高并发时的第一道闸

```nginx
# http 块定义限流区：每个 IP 每秒 10 个请求，突发容忍 20
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    limit_req_status 429;                # 超限返回 429 而不是默认 503
}
```

`burst + nodelay` 组合的含义：平时 10/s，允许瞬间突发 20 个（不排队直接放行），第 21 个开始拒绝——对前端友好（快速失败好过排队超时）。

连接数限制（防单 IP 吃满连接）：

```nginx
limit_conn_zone $binary_remote_addr zone=conn:10m;
location /download/ {
    limit_conn conn 5;                   # 每 IP 最多 5 个并发下载
}
```

## 5. gzip 与缓存头

```nginx
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
gzip_min_length 1k;
gzip_comp_level 5;                        # 5 是性价比拐点
gzip_vary on;                             # 告知 CDN 有压缩版本

location ~* \.(?:js|css|png|jpg|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";   # 内容带 hash 的资源可 immutable
}
```

## 6. 排障三板斧

```bash
nginx -t                                   # 改配置后必跑：语法检查
tail -f /var/log/nginx/error.log           # 第一现场
tail -f /var/log/nginx/access.log          # 每个请求的状态/耗时/IP

# 状态统计
curl http://127.0.0.1/nginx_status         # 活跃连接数（需配 stub_status）
awk '{print $9}' access.log | sort | uniq -c | sort -rn   # 状态码分布
```

502 = 后端挂/端口不通（先 curl 后端端口）；504 = 后端超时（调 proxy_read_timeout 或查后端慢日志）；499 = 客户端等不及主动断开（后端太慢的信号）。

## 7. 性能与安全清单

- [ ] `worker_processes auto` + `worker_connections` 按内存调（连接数上限 = 进程 × 连接）
- [ ] `keepalive_timeout 65` 复用连接
- [ ] 安全头：`add_header X-Frame-Options DENY; add_header X-Content-Type-Options nosniff;`
- [ ] 隐藏版本号：`server_tokens off;`
- [ ] 大上传：`client_max_body_size 20m;`（默认 1MB，传图就 413）
- [ ] 证书自动续期：`certbot renew --dry-run` 写进 cron

## 延伸阅读

- 站内相关：《Linux 服务器运维清单：Nginx、防火墙与日常巡检》《HTTP/HTTPS 协议详解》《CDN 内容分发网络》
- 《深入理解 Nginx》——模块与内核机制
- nginx.org 官方文档（每个指令的语义都有精确说明）
