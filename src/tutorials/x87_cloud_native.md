---
title: 云原生基础：服务网格与可观测性
category: 分布式与并行
order: 4
tags: [云原生, Kubernetes, 服务网格, 可观测性]
summary: 容器编排、声明式 API、服务网格与可观测性三支柱——云原生技术栈的概念地图与工程实践。
---

## 1. 云原生的定义：不只是"跑在云上"

CNCF 的定义：云原生技术让应用**构建在容器中、以微服务运行、用声明式 API 管理**，具备容错与弹性。四个支柱：

1. **容器化**：应用与依赖打包成不可变镜像（环境一致性）
2. **微服务化**：按服务边界拆分（独立演进）
3. **声明式 API**：描述"期望状态"而非"操作步骤"（系统自动收敛）
4. **可观测性**：从外部信号推断内部健康（黑盒调试能力）

**声明式 API 是云原生的灵魂**：命令式（"启动一个容器"）执行一次就结束；声明式（"保持 3 个副本运行"）由**控制循环**持续对比期望与实际并自动纠正——机器挂了重启、副本少了补齐，全是控制循环的自动行为（Kubernetes 的 reconcile loop）。

## 2. Kubernetes 核心对象速览

| 对象 | 角色 | 类比 |
| --- | --- | --- |
| Pod | 最小部署单元（1+ 容器共享网络/存储） | 一组共生进程 |
| Deployment | 管理 Pod 副本集与滚动更新 | "保持 3 副本运行"的声明 |
| Service | 一组 Pod 的稳定虚拟 IP + 负载均衡 | Pod 会死会换 IP，Service 不变 |
| ConfigMap/Secret | 配置与敏感信息注入 | 配置与镜像分离 |
| Ingress | 七层路由入口（域名→Service） | 集群大门 |

```yaml
# Deployment 声明式示例
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 3                          # 期望：3 个副本
  selector: { matchLabels: { app: web } }
  template:
    spec:
      containers:
      - name: web
        image: myapp:1.2.3
        resources: { limits: { memory: "512Mi" } }
```

`kubectl apply` 提交后，控制循环持续把实际状态收敛到声明状态——挂掉自动重启、扩容自动拉起。**回滚 = 重新 apply 旧清单**。

## 3. 服务网格：把网络逻辑从代码中抽走

微服务的网络需求：重试、超时、熔断、mTLS 加密、灰度流量切分——这些写进每个服务 = 每种语言重复实现。

**Sidecar 模式**：每个 Pod 注入一个代理容器（Envoy），所有进出流量经代理——**应用代码与网络逻辑彻底解耦**：

```
[服务A容器] ←localhost→ [Envoy sidecar] ──mTLS──→ [Envoy sidecar] ←localhost→ [服务B容器]
```

- **流量管理**：按比例灰度（95% 旧版 + 5% 新版）、按 header 路由、故障注入（混沌测试）
- **mTLS**：服务间通信自动双向加密 + 身份认证（零信任网络的地基）
- **代价**：每跳多两次代理转发（延迟 + 资源）——Istio 全网格注入约增加 10-30% 延迟

**取舍**：服务多（>10）、多语言、强安全要求 → 上网格；小集群直接用 SDK/框架的网络能力。

## 4. 可观测性三支柱

可观测性 ≠ 监控——监控回答"**已知问题**发生了吗"；可观测性回答"**未知问题**是什么、为什么"：

| 支柱 | 回答 | 工具生态 |
| --- | --- | --- |
| **日志（Logs）** | 事件发生了什么（离散文本） | Loki、ELK |
| **指标（Metrics）** | 系统状态的数值时间序列 | **Prometheus** + Grafana |
| **追踪（Traces）** | 一次请求跨服务的完整路径 | OpenTelemetry + Jaeger |

**OpenTelemetry（OTel）** 是统一标准：一套 API 产出三种信号，厂商中立（CNCF 主推）。

**指标四黄金信号**（Google SRE）：**延迟**（请求耗时）、**流量**（QPS）、**错误**（错误率）、**饱和度**（资源使用率）——告警优先围绕这四个。**RED 法**（微服务）：Rate/Errors/Duration 每服务三面板。

**追踪的火花**：trace-id 从入口一路透传（HTTP header）→ 每个服务记录 span → 按 trace-id 串起完整调用树——分布式排障从"猜"变成"看"。

## 5. GitOps：声明式的极致

```
Git 仓库 = 系统期望状态的唯一事实源
→ CI 改镜像 tag 提交到 Git
→ Flux/ArgoCD 检测 Git 变化 → 自动 apply 到集群
→ 集群漂移（有人手动改了集群）→ 自动恢复成 Git 声明的状态
```

**收益**：变更全审计（git log）、回滚 = git revert、环境一致性（dev/staging/prod 同流程）。**纪律**：所有变更走 PR（禁止 kubectl 直接改集群）——"集群即代码"。

## 6. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| Pod 反复重启 CrashLoopBackOff | 启动即崩/健康检查失败 | kubectl logs + describe 查事件 |
| OOMKilled | 内存超 limits | 调 limits 或查内存泄漏 |
| Service 访问不通 | 标签选择器不匹配 | 检查 selector 与 Pod labels |
| 数据库连接耗尽 | 滚动更新新旧版本叠加连接 | maxSurge 控制 + 连接池上限 |
| 网格延迟明显增加 | Sidecar 每跳两次转发 | 评估必要性；ambient mesh 减 Sidecar |
| 告警疲劳 | 告警太多没人看 | 只对"需人工介入"的告警；分级 |

## 7. 自测五题

1. 声明式 API 与命令式的本质差异？控制循环的作用？
2. Service 为什么需要（Pod 不是有 IP 吗）？
3. Sidecar 模式解决什么问题、代价是什么？
4. 可观测性三支柱分别回答什么问题？
5. GitOps 的"唯一事实源"是什么？漂移如何处理？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《Docker 镜像原理：分层、UnionFS 与 Dockerfile 优化》（容器前置）、《分布式系统基础：CAP 定理与一致性模型》《云原生基础》（本文）、《Linux 服务器运维清单》
- Kubernetes 官方文档（ Concepts 章节）、CNCF Landscape 全景图
- 《Kubernetes in Action》（Marko Lukša）
