---
title: Docker 镜像原理：分层、UnionFS 与 Dockerfile 优化
category: 操作系统与运维
order: 16
tags: [Docker, 镜像分层, UnionFS, 容器]
summary: 镜像分层与 overlay2、写时复制与 whiteout、Dockerfile 缓存规则与体积优化——容器的文件系统真相。
---

## 1. 镜像是什么：只读分层的堆叠

Docker 镜像 ≠ 一个大文件，而是**一组只读层（layer）的堆叠清单**：

```
镜像 nginx:latest
├── layer N:  COPY nginx.conf /etc/nginx/     （几 KB）
├── layer 3:  RUN apt-get install nginx       （几十 MB）
├── layer 2:  RUN apt-get update              （几 MB）
└── layer 1:  FROM debian:bookworm            （基础层，~120MB）
```

每层是一个 tar 包（含文件变化）+ 一段元数据；manifest 清单描述层序列与配置。**层内容寻址**（sha256 摘要）——内容相同的层在整台机器/整个仓库中只存一份。这就是"多个容器共享基础层、拉取镜像只需下载缺失层"的原理。

## 2. overlay2：容器看到的合并视图

容器启动时，Docker 在镜像层之上加一个**可写层**（容器层），用 overlay2 联合文件系统合并出统一视图：

```
merged（容器内看到的）= upperdir（可写层）+ lowerdir（镜像各层，从上到下）
```

三条读写规则：

| 操作 | 行为 |
| --- | --- |
| 读文件 | 从 upper 向下逐层找，找到即返回 |
| **写文件** | 若在 lower——先 copy-up 到 upper，再改（**写时复制 CoW**）；若在 upper——直接改 |
| 删文件 | 在 upper 写一个 **whiteout** 标记文件（遮住 lower 的同名文件） |

**CoW 的性能含义**：首次写大文件（如 lower 层里几百 MB 的数据库文件）会整份复制——数据库容器把数据放容器层是灾难，**必须挂 volume**（volume 完全绕过 overlay）。

**whiteout 的继承语义**：`RUN rm /app/big.tar` 不会让镜像变小！删除只是在上层写了 whiteout 遮住下层——下层的大文件仍在镜像里。**"删除不减肥"是 Dockerfile 优化的第一课**。

## 3. Dockerfile 缓存规则：构建提速的钥匙

构建时每条指令生成一层，命中缓存的判定：

```
1. 指令文本不变 且
2. 输入不变（COPY 的文件 checksum 未变 / ADD 的 URL 内容未变）
→ 复用该层缓存
→ 但该层一旦失效，其后所有层全部失效（链条断裂）！
```

**推论——Dockerfile 的排列原则：从最稳定到最易变**：

```dockerfile
FROM node:20-alpine              # ① 极少变
WORKDIR /app
COPY package*.json ./            # ② 依赖清单先拷（只有依赖变化才失效）
RUN npm ci                       # ③ 依赖安装（package.json 不变就吃缓存）
COPY . .                         # ④ 源码（最常变）
RUN npm run build                # ⑤ 跟着源码失效
```

若把 `COPY . .` 放在 `npm ci` 之前——任何源码改动都会让依赖安装层失效，重装几分钟的依赖。

## 4. Dockerfile 体积优化五式

```dockerfile
# ① 合并 RUN 并清理（删除不减肥，删必须在同一层）
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
 && rm -rf /var/lib/apt/lists/*

# ② 多阶段构建：编译环境不进最终镜像
FROM golang:1.22 AS builder
WORKDIR /src
COPY . .
RUN go build -o /app/server .

FROM alpine:3.20                  # 最终镜像只含二进制 + 运行时
COPY --from=builder /app/server /app/server
ENTRYPOINT ["/app/server"]
# Go 项目可从 1.2GB → 20MB

# ③ 选小基础镜像
FROM alpine / distroless / scratch   # scratch：静态编译的二进制直接裸跑

# ④ .dockerignore 排除 node_modules、.git（COPY . . 的瘦身前提）
# ⑤ 包管理器禁缓存（--no-cache / --no-install-recommends）
```

**体积对比参考**：同一 Node 应用——单阶段 node:20 ≈ 1.1GB → 多阶段 node:20-alpine ≈ 180MB；Go 单阶段 ≈ 1.2GB → 多阶段 alpine ≈ 20MB → scratch ≈ 8MB。

## 5. 层与安全：镜像里藏着什么

每层都是明文 tar——**你以为删掉的敏感信息还躺在旧层里**：

```dockerfile
RUN echo "PASSWORD=secret" > /app/.env && rm /app/.env   # ✗ 危险！
# .env 在上一层里完好保存，docker history / 解包镜像即可提取
```

规则：**敏感信息永远走环境变量/secret 挂载/BuildKit 的 --mount=type=secret**，绝不写进任何一层的文件。镜像提交前用 `docker history` 与 `trivy`（漏洞扫描）自查。

`docker history nginx:latest` 可视化每层的指令与大小——排查"镜像为什么这么大"的第一工具。

## 6. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| rm 删了大文件镜像没变小 | whiteout 只遮不删 | 合并 RUN 同层清理；或多阶段 |
| 源码一改依赖全重装 | COPY 顺序错误 | 依赖清单先 COPY |
| 容器里写文件巨慢 | 容器层 CoW 大文件复制 | 数据放 volume |
| 两个容器改同一基础层文件互不影响 | 各自 CoW 出独立 upper | 理解 CoW 隔离（共享只读） |
| 镜像里翻出"已删除"的密钥 | 敏感信息进了历史层 | 换密钥 + secret 挂载重建 |
| apk add 后镜像大了几十 MB | apt/apk 缓存留在层里 | 同层 rm 缓存或 --no-cache |

## 7. 自测五题

1. overlay2 的三层（lower/upper/merged）读写规则各是什么？
2. 为什么 `RUN rm big.tar` 不减小镜像？
3. Dockerfile 缓存失效的传导规则？
4. 多阶段构建的最终镜像包含哪些内容？
5. 为什么数据库数据必须放 volume 而不是容器层？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《docker的安装》《Docker 常用命令与 Compose 实战》《Linux 入门与文件系统》（overlay 的底层是文件系统）、《Nginx 配置实战》
- Docker 官方文档 Best practices for writing Dockerfiles
- 《Docker——容器与容器云》——镜像与运行时详解
