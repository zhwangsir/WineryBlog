---
title: 概述
category: 参考资料
source: `https://kubernetes.io/zh-cn/docs/concepts/overview/`
summary: 本地镜像：概述（原文 kubernetes.io）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：`https://kubernetes.io/zh-cn/docs/concepts/overview/`

# 概述

中文 (Chinese)
*   English
*   বাংলা (Bengali)
*   Français (French)
*   Deutsch (German)
*   हिन्दी (Hindi)
*   Bahasa Indonesia (Indonesian)
*   Italiano (Italian)
*   日本語 (Japanese)
*   한국어 (Korean)
*   فارسی (Persian)
*   Polski (Polish)
*   Português (Portuguese)
*   Русский (Russian)
*   Español (Spanish)
*   Українська (Ukrainian)
*   Tiếng Việt (Vietnamese)

*   Kubernetes 文档
    *   - [x] 文档 
        *   - [x] Kubernetes 文档支持的版本 

    *   - [x] 入门 
        *   - [x] 学习环境 
        *   - [x] 生产环境 
            *   - [x] 容器运行时 
            *   - [x] 使用部署工具安装 Kubernetes 
                *   - [x] 使用 kubeadm 引导集群 
                    *   - [x] 安装 kubeadm 
                    *   - [x] 对 kubeadm 进行故障排查 
                    *   - [x] 使用 kubeadm 创建集群 
                    *   - [x] 使用 kubeadm API 定制组件 
                    *   - [x] 高可用拓扑选项 
                    *   - [x] 利用 kubeadm 创建高可用集群 
                    *   - [x] 使用 kubeadm 创建一个高可用 etcd 集群 
                    *   - [x] 使用 kubeadm 配置集群中的每个 kubelet 
                    *   - [x] 使用 kubeadm 支持双协议栈 

            *   - [x] Turnkey 云解决方案 

        *   - [x] 最佳实践 
            *   - [x] 大规模集群的注意事项 
            *   - [x] 运行于多可用区环境 
            *   - [x] 校验节点设置 
            *   - [x] 强制实施 Pod 安全性标准 
            *   - [x] PKI 证书和要求 

    *   - [x] 概念 
        *   - [x] 概述 
            *   - [x] Kubernetes 组件 
            *   - [x] Kubernetes 对象 
                *   - [x] Kubernetes 对象管理 
                *   - [x] 对象名称和 ID 
                *   - [x] 标签和选择算符 
                *   - [x] 名字空间 
                *   - [x] 注解 
                *   - [x] 字段选择算符 
                *   - [x] Finalizers 
                *   - [x] 属主与附属 
                *   - [x] 推荐使用的标签 
                *   - [x] 存储版本 

            *   - [x] Kubernetes API 
            *   - [x] kubectl 命令行工具 

        *   - [x] Kubernetes 架构 
            *   - [x] 节点 
            *   - [x] 节点与控制面之间的通信 
            *   - [x] 控制器 
            *   - [x] 租约（Lease） 
            *   - [x] 云控制器管理器 
            *   - [x] Kubernetes 自我修复 
            *   - [x] 关于 CGroup v2 
            *   - [x] 垃圾收集 
            *   - [x] 混合版本代理 

        *   - [x] 容器 
            *   - [x] 镜像 
            *   - [x] 容器环境 
            *   - [x] 容器运行时类（Runtime Class） 
            *   - [x] 容器生命周期回调 
            *   - [x] 容器运行时接口（CRI） 

        *   - [x] 工作负载 
            *   - [x] Pod 
                *   - [x] Pod 的生命周期 
                *   - [x] Pod 状况 
                *   - [x] Init 容器 
                *   - [x] Termination of Pods(EN) 
                *   - [x] 边车容器 
                *   - [x] 临时容器 
                *   - [x] 存活、就绪和启动探针 
                *   - [x] 干扰（Disruptions） 
                *   - [x] Pod QoS 类 
                *   - [x] Pod 主机名 
                *   - [x] 调度组 
                *   - [x] 静态 Pod 
                *   - [x] 用户命名空间 
                *   - [x] Downward API 
                *   - [x] 高级 Pod 配置 

            *   - [x] Workload API 
                *   - [x] Pod 组干扰和优先级 
                *   - [x] PodGroup 调度策略 
                *   - [x] 拓扑感知工作负载调度 
                *   - [x] 调度构建块 API 与 workloadbuilder 库 

            *   - [x] 工作负载管理 
                *   - [x] Deployments 
                *   - [x] ReplicaSet 
                *   - [x] StatefulSet 
                *   - [x] DaemonSet 
                *   - [x] Job 
                *   - [x] 已完成 Job 的自动清理 
                *   - [x] CronJob 
                *   - [x] ReplicationController 

            *   - [x] CompositePodGroup API 
                *   - [x] CompositePodGroup 生命周期 

            *   - [x] PodGroup API 
                *   - [x] PodGroup 生命周期 

            *   - [x] 管理工作负载 
            *   - [x] 自动扩缩工作负载 
            *   - [x] Pod 水平自动扩缩 
            *   - [x] Vertical Pod Autoscaling(EN) 

        *   - [x] 服务、负载均衡和联网 
            *   - [x] 服务（Service） 
            *   - [x] Ingress 
            *   - [x] Ingress 控制器 
            *   - [x] Gateway API 
            *   - [x] EndpointSlice 
            *   - [x] 网络策略 
            *   - [x] Service 与 Pod 的 DNS 
            *   - [x] IPv4/IPv6 双协议栈 
            *   - [x] 拓扑感知路由 
            *   - [x] Windows 网络 
            *   - [x] Service ClusterIP 分配 
            *   - [x] 服务内部流量策略 

        *   - [x] 存储 
            *   - [x] 卷 
            *   - [x] 持久卷 
            *   - [x] 投射卷 
            *   - [x] 临时卷 
            *   - [x] 存储类（StorageClass） 
            *   - [x] 卷属性类 
            *   - [x] 动态卷制备 
            *   - [x] 卷快照 
            *   - [x] 卷快照类 
            *   - [x] CSI 卷克隆 
            *   - [x] 卷填充器（Populator）与数据源 
            *   - [x] 存储容量 
            *   - [x] 特定于节点的卷数限制 
            *   - [x] 本地临时存储 
            *   - [x] 卷健康监测 
            *   - [x] Windows 存储 

        *   - [x] 配置 
            *   - [x] ConfigMap 
            *   - [x] Secret 
            *   - [x] 为 Pod 和容器管理资源 
            *   - [x] 使用 kubeconfig 文件组织集群访问 
            *   - [x] Windows 节点的资源管理 

        *   - [x] 安全 
            *   - [x] 云原生安全 
            *   - [x] Pod 安全性标准 
            *   - [x] Pod 安全性准入 
            *   - [x] 服务账号 
            *   - [x] Pod 安全策略 
            *   - [x] Linux 节点的安全性 
            *   - [x] Windows 节点的安全性 
            *   - [x] Kubernetes API 访问控制 
            *   - [x] 基于角色的访问控制良好实践 
            *   - [x] Kubernetes Secret 良好实践 
            *   - [x] 多租户 
            *   - [x] Kubernetes API 服务器旁路风险 
            *   - [x] 加固指南 - 调度器配置 
            *   - [x] 加固指南 - 身份认证机制 
            *   - [x] 强化指南 - 动态资源分配 
            *   - [x] 安全检查清单 
            *   - [x] 针对 Pod 和容器的 Linux 内核安全约束 
            *   - [x] 应用安全检查清单 

        *   - [x] 策略 
            *   - [x] 限制范围（LimitRange） 
            *   - [x] 资源配额 
            *   - [x] 进程 ID 约束与预留 
            *   - [x] 节点资源管理器 

        *   - [x] 调度、抢占和驱逐 
            *   - [x] Kubernetes 调度器 
            *   - [x] 拓扑感知的工作负载调度 
            *   - [x] 运行多个调度器 
            *   - [x] 将 Pod 指派给节点 
            *   - [x] Pod 开销 
            *   - [x] Pod 调度就绪态 
            *   - [x] Pod 拓扑分布约束 
            *   - [x] 污点和容忍度 
            *   - [x] 调度框架 
            *   - [x] 编组调度（Gang Scheduling） 
            *   - [x] 调度器性能调优 
            *   - [x] PodGroup 调度 
            *   - [x] 工作负载感知的抢占 
            *   - [x] 资源装箱 
            *   - [x] Pod 优先级和抢占 
            *   - [x] 节点压力驱逐 
            *   - [x] API 发起的驱逐 
            *   - [x] 节点声明式特性 

        *   - [x] 资源管理 
            *   - [x] Effective Pod requests and limits(EN) 
            *   - [x] 资源管理器 
            *   - [x] 动态资源分配 
                *   - [x] DRA API 对象 
                *   - [x] DRA 的工作原理 
                *   - [x] 动态资源的可观测性 
                *   - [x] DRA 特性 
                *   - [x] 设备污点与容忍度 

            *   - [x] Pod 级资源管理器 

        *   - [x] 集群管理 
            *   - [x] 交换内存管理 
            *   - [x] 节点关闭 
            *   - [x] Node 自动扩缩容 
            *   - [x] 证书 
            *   - [x] 集群网络系统 
            *   - [x] 可观测性 
            *   - [x] Admission Webhook 良好实践 
            *   - [x] 集群管理员使用动态资源分配的良好实践 
            *   - [x] 日志架构 
            *   - [x] Kubernetes 控制平面组件的兼容版本 
            *   - [x] Kubernetes 系统组件指标 
            *   - [x] Kubernetes 对象状态的指标 
            *   - [x] 系统日志 
            *   - [x] 追踪 Kubernetes 系统组件 
            *   - [x] Kubernetes 中的代理 
            *   - [x] API 优先级和公平性 
            *   - [x] 安装扩展（Addon） 
            *   - [x] 协调领导者选举 

        *   - [x] Kubernetes 中的 Windows 
            *   - [x] Kubernetes 中的 Windows 容器 
            *   - [x] 在 Kubernetes 中运行 Windows 容器的指南 

        *   - [x] 扩展 Kubernetes 
            *   - [x] Operator 模式 
            *   - [x] 计算、存储和网络扩展 
                *   - [x] 网络插件 
                *   - [x] 设备插件 

            *   - [x] 扩展 Kubernetes API 
                *   - [x] 定制资源 
                *   - [x] Kubernetes API 聚合层 

    *   - [x] 任务 
        *   - [x] 安装工具 
            *   - [x] 在 Linux 系统中安装并设置 kubectl 
            *   - [x] 在 macOS 系统上安装和设置 kubectl 
            *   - [x] 在 Windows 上安装 kubectl 

        *   - [x] 管理集群 
            *   - [x] 为集群超配节点容量 
            *   - [x] 用 kubeadm 进行管理 
                *   - [x] 添加 Linux 工作节点 
                *   - [x] 添加 Windows 工作节点 
                *   - [x] 升级 kubeadm 集群 
                *   - [x] 升级 Linux 节点 
                *   - [x] 升级 Windows 节点 
                *   - [x] 使用 kubeadm 进行证书管理 
                *   - [x] 重新配置 kubeadm 集群 
                *   - [x] 更改 Kubernetes 软件包仓库 

            *   - [x] 从 Dockershim 迁移 
                *   - [x] 将节点上的容器运行时从 Docker Engine 改为 containerd 
                *   - [x] 查明节点上所使用的容器运行时 
                *   - [x] 排查 CNI 插件相关的错误 
                *   - [x] 检查移除 Dockershim 是否对你有影响 
                *   - [x] 从 dockershim 迁移遥测和安全代理 

            *   - [x] 手动生成证书 
            *   - [x] 管理内存、CPU 和 API 资源 
                *   - [x] 为命名空间配置默认的内存请求和限制 
                *   - [x] 为命名空间配置默认的 CPU 请求和限制 
                *   - [x] 配置命名空间的最小和最大内存约束 
                *   - [x] 为命名空间配置 CPU 最小和最大约束 
                *   - [x] 为命名空间配置内存和 CPU 配额 
                *   - [x] 配置命名空间下 Pod 配额 

            *   - [x] 安装网络策略驱动 
                *   - [x] 使用 Antrea 提供 NetworkPolicy 
                *   - [x] 使用 Calico 提供 NetworkPolicy 
                *   - [x] 使用 Cilium 提供 NetworkPolicy 
                *   - [x] 使用 kube-router 提供 NetworkPolicy 

            *   - [x] Shutting Down and Restarting Clusters(EN) 
            *   - [x] 启用或禁用特性门控 
            *   - [x] 使用 Kubernetes API 访问集群 
            *   - [x] 为节点发布扩展资源 
            *   - [x] 自动扩缩集群 DNS 服务 
            *   - [x] 从轮询切换为基于 CRI 事件的更新来获取容器状态 
            *   - [x] 改变默认 StorageClass 
            *   - [x] 将 PersistentVolume 的访问模式更改为 ReadWriteOncePod 
            *   - [x] 更改 PersistentVolume 的回收策略 
            *   - [x] Kubernetes 云管理控制器 
            *   - [x] 配置 kubelet 镜像凭据提供程序 
            *   - [x] 配置 API 对象配额 
            *   - [x] 控制节点上的 CPU 管理策略 
            *   - [x] 控制节点上的拓扑管理策略 
            *   - [x] 自定义 DNS 服务 
            *   - [x] 调试 DNS 问题 
            *   - [x] 声明网络策略 
            *   - [x] 开发云控制器管理器 
            *   - [x] 启用/禁用 Kubernetes API 
            *   - [x] 静态加密机密数据 
            *   - [x] 解密已静态加密的机密数据 
            *   - [x] 关键插件 Pod 的调度保证 
            *   - [x] IP Masquerade Agent 用户指南 
            *   - [x] 限制存储使用量 
            *   - [x] 迁移多副本的控制面以使用云控制器管理器 
            *   - [x] 操作 Kubernetes 中的 etcd 集群 
            *   - [x] 为系统守护进程预留计算资源 
            *   - [x] 以非 root 用户身份运行 Kubernetes 节点组件 
            *   - [x] 安全地清空一个节点 
            *   - [x] 保护集群 
            *   - [x] 通过配置文件设置 kubelet 参数 
            *   - [x] 在集群中强化动态资源分配（DRA） 
            *   - [x] 通过名字空间共享集群 
            *   - [x] 升级集群 
            *   - [x] 在集群中使用级联删除 
            *   - [x] 使用 KMS 驱动进行数据加密 
            *   - [x] 使用 CoreDNS 进行服务发现 
            *   - [x] 在 Kubernetes 集群中使用 NodeLocal DNSCache 
            *   - [x] 在 Kubernetes 集群中使用 sysctl 
            *   - [x] 控制节点上的内存管理策略 
            *   - [x] 验证已签名容器镜像 

        *   - [x] 配置 Pods 和容器 
            *   - [x] 为容器和 Pod 分配内存资源 
            *   - [x] 为容器和 Pods 分配 CPU 资源 
            *   - [x] 调整分配给 Pod 的 CPU 和内存资源 
            *   - [x] 调整分配给容器的 CPU 和内存资源 
            *   - [x] 分配 Pod 级别 CPU 和内存资源 
            *   - [x] 为 Windows Pod 和容器配置 GMSA 
            *   - [x] 向 Pod 和容器分配设备 
                *   - [x] 在集群中安装 DRA 
                *   - [x] 使用 DRA 为工作负载分配设备 
                *   - [x] 访问 DRA 设备元数据 

            *   - [x] 为 Windows 的 Pod 和容器配置 RunAsUserName 
            *   - [x] 创建 Windows HostProcess Pod 
            *   - [x] 配置 Pod 的服务质量 
            *   - [x] 为容器分派扩展资源 
            *   - [x] 配置 Pod 以使用卷进行存储 
            *   - [x] 配置 Pod 以使用 PersistentVolume 作为存储 
            *   - [x] 配置 Pod 使用投射卷作存储 
            *   - [x] 为 Pod 或容器配置安全上下文 
            *   - [x] 为 Pod 配置服务账号 
            *   - [x] 从私有仓库拉取镜像 
            *   - [x] 配置存活、就绪和启动探针 
            *   - [x] 将 Pod 分配给节点 
            *   - [x] 用节点亲和性把 Pod 分配到节点 
            *   - [x] 配置 Pod 初始化 
            *   - [x] 为容器的生命周期事件设置处理函数 
            *   - [x] 配置 Pod 使用 ConfigMap 
            *   - [x] 在 Pod 中的容器之间共享进程命名空间 
            *   - [x] Pod 使用镜像卷 
            *   - [x] 为 Pod 配置 user 名字空间 
            *   - [x] 在 emptyDir 卷上设置权限 
            *   - [x] 为卷挂载设置绑定挂载选项 
            *   - [x] 创建静态 Pod 
            *   - [x] 将 Docker Compose 文件转换为 Kubernetes 资源 
            *   - [x] 通过配置内置准入控制器实施 Pod 安全标准 
            *   - [x] 使用名字空间标签来实施 Pod 安全性标准 
            *   - [x] 从 PodSecurityPolicy 迁移到内置的 PodSecurity 准入控制器 

        *   - [x] 监控、日志和调试 
            *   - [x] Kubernetes 中的监控 
            *   - [x] Kubernetes 中的日志记录 
            *   - [x] 集群故障排查 
                *   - [x] kubectl 故障排查 
                *   - [x] 资源监控工具 
                *   - [x] 资源指标管道 
                *   - [x] 节点健康监测 
                *   - [x] 使用 crictl 对 Kubernetes 节点进行调试 
                *   - [x] 拓扑管理故障排查 
                *   - [x] Windows 调试技巧 
                *   - [x] 审计 
                *   - [x] 使用 telepresence 在本地开发和调试服务 
                *   - [x] 用 Kubectl 调试 Kubernetes 节点 

            *   - [x] 应用故障排除 
                *   - [x] 调试 Pod 
                *   - [x] 调试 Service 
                *   - [x] 调试 StatefulSet 
                *   - [x] 确定 Pod 失败的原因 
                *   - [x] 调试 Init 容器 
                *   - [x] 调试运行中的 Pod 
                *   - [x] 获取正在运行容器的 Shell 

        *   - [x] 管理 Kubernetes 对象 
            *   - [x] 使用配置文件对 Kubernetes 对象进行声明式管理 
            *   - [x] 使用 Kustomize 对 Kubernetes 对象进行声明式管理 
            *   - [x] 使用指令式命令管理 Kubernetes 对象 
            *   - [x] 使用配置文件对 Kubernetes 对象进行命令式管理 
            *   - [x] 使用 kubectl patch 更新 API 对象 
            *   - [x] 使用存储版本迁移功能来迁移 Kubernetes 对象 

        *   - [x] 管理 Secrets 
            *   - [x] 使用 kubectl 管理 Secret 
            *   - [x] 使用配置文件管理 Secret 
            *   - [x] 使用 Kustomize 管理 Secret 

        *   - [x] 给应用注入数据 
            *   - [x] 为容器设置启动时要执行的命令和参数 
            *   - [x] 定义相互依赖的环境变量 
            *   - [x] 为容器设置环境变量 
            *   - [x] 使用 Init 容器定义环境变量值 
            *   - [x] 通过环境变量将 Pod 信息呈现给容器 
            *   - [x] 通过文件将 Pod 信息呈现给容器 
            *   - [x] 使用 Secret 安全地分发凭据 

        *   - [x] 运行应用 
            *   - [x] 使用 Deployment 运行一个无状态应用 
            *   - [x] 手动水平扩缩 Deployment 
            *   - [x] 更新 Deployment 而不中断服务 
            *   - [x] 运行一个单实例有状态应用 
            *   - [x] 运行一个有状态的应用程序 
            *   - [x] 扩缩 StatefulSet 
            *   - [x] 删除 StatefulSet 
            *   - [x] 强制删除 StatefulSet 中的 Pod 
            *   - [x] HorizontalPodAutoscaler 演练 
            *   - [x] 为应用程序设置干扰预算（Disruption Budget） 
            *   - [x] 从 Pod 中访问 Kubernetes API 

        *   - [x] 运行 Jobs 
            *   - [x] 使用 CronJob 运行自动化任务 
            *   - [x] 使用工作队列进行粗粒度并行处理 
            *   - [x] 带 Pod 间通信的 Job 
            *   - [x] 使用工作队列进行精细的并行处理 
            *   - [x] 使用索引作业完成静态工作分配下的并行处理 
            *   - [x] 使用展开的方式进行并行处理 
            *   - [x] 使用 Pod 失效策略处理可重试和不可重试的 Pod 失效 

        *   - [x] 访问集群中的应用程序 
            *   - [x] 部署和访问 Kubernetes 仪表板（Dashboard） 
            *   - [x] 访问集群 
            *   - [x] Configure Access to a Single Cluster(EN) 
            *   - [x] 配置对多集群的访问 
            *   - [x] 使用端口转发来访问集群中的应用 
            *   - [x] 使用服务来访问集群中的应用 
            *   - [x] 使用 Service 把前端连接到后端 
            *   - [x] 创建外部负载均衡器 
            *   - [x] 列出集群中所有运行容器的镜像 
            *   - [x] 同 Pod 内的容器使用共享卷通信 
            *   - [x] 为集群配置 DNS 
            *   - [x] 访问集群上运行的服务 

        *   - [x] 扩展 Kubernetes 
            *   - [x] 配置聚合层 
            *   - [x] 使用自定义资源 
                *   - [x] 使用 CustomResourceDefinition 扩展 Kubernetes API 
                *   - [x] CustomResourceDefinition 的版本 

            *   - [x] 安装一个扩展的 API server 
            *   - [x] 配置多个调度器 
            *   - [x] 使用 HTTP 代理访问 Kubernetes API 
            *   - [x] 使用 SOCKS5 代理访问 Kubernetes API 
            *   - [x] 设置 Konnectivity 服务 

        *   - [x] TLS 
            *   - [x] 使用 CertificateSigningRequest 为 Kubernetes API 客户端颁发证书 
            *   - [x] 管理集群中的 TLS 认证 
            *   - [x] 手动轮换 CA 证书 
            *   - [x] 为 kubelet 配置证书轮换 

        *   - [x] 管理集群守护进程 
            *   - [x] 构建一个基本的 DaemonSet 
            *   - [x] 对 DaemonSet 执行滚动更新 
            *   - [x] 对 DaemonSet 执行回滚 
            *   - [x] 仅在某些节点上运行 Pod 

        *   - [x] 网络 
            *   - [x] 使用 HostAliases 向 Pod /etc/hosts 文件添加条目 
            *   - [x] 扩展 Service IP 范围 
            *   - [x] 验证 IPv4/IPv6 双协议栈 
            *   - [x] 重新配置 Kubernetes 默认的 ServiceCIDR 

        *   - [x] 调度 GPU 
        *   - [x] 管理巨页（HugePage） 
        *   - [x] 用插件扩展 kubectl 

    *   - [x] 教程 
        *   - [x] 你好，Minikube 
        *   - [x] 学习 Kubernetes 基础知识 
            *   - [x] 创建集群 
                *   - [x] 使用 Minikube 创建集群 

            *   - [x] 部署应用 
                *   - [x] 使用 kubectl 创建 Deployment 

            *   - [x] 了解你的应用 
                *   - [x] 查看 Pod 和节点 

            *   - [x] 公开地暴露你的应用 
                *   - [x] 使用 Service 公开你的应用 

            *   - [x] 扩缩你的应用 
                *   - [x] 运行多实例的应用 

            *   - [x] 更新你的应用 
                *   - [x] 执行滚动更新 

        *   - [x] 配置 
            *   - [x] 通过 ConfigMap 更新配置 
            *   - [x] 使用 ConfigMap 来配置 Redis 
            *   - [x] 使用边车（Sidecar）容器 
            *   - [x] 配置 Pod 以使用 PersistentVolume 作为存储 

        *   - [x] 安全 
            *   - [x] 在集群级别应用 Pod 安全标准 
            *   - [x] 在名字空间级别应用 Pod 安全标准 
            *   - [x] 使用 AppArmor 限制容器对资源的访问 
            *   - [x] 使用 seccomp 限制容器的系统调用 

        *   - [x] 无状态的应用 
            *   - [x] Deploy a Release Using a Canary Deployment(EN) 
            *   - [x] 公开外部 IP 地址以访问集群中的应用 
            *   - [x] 示例：使用 Redis 部署 PHP 留言板应用 

        *   - [x] 有状态的应用 
            *   - [x] StatefulSet 基础 
            *   - [x] 示例：使用持久卷部署 WordPress 和 MySQL 
            *   - [x] 示例：使用 StatefulSet 部署 Cassandra 
            *   - [x] 运行 ZooKeeper，一个分布式协调系统 

        *   - [x] 集群管理 
            *   - [x] 以独立模式运行 kubelet 
            *   - [x] 在 Kubernetes 节点上配置交换内存 
            *   - [x] 使用 Pod 级资源与 kubelet 资源管理器 
            *   - [x] Install Drivers and Allocate Devices with DRA(EN) 
            *   - [x] 探索验证与变更准入策略 
            *   - [x] 名字空间演练 

        *   - [x] Service 
            *   - [x] 使用 Service 连接到应用 
            *   - [x] 使用源 IP 
            *   - [x] 探索 Pod 及其端点的终止行为 

    *   - [x] 参考 
        *   - [x] 词汇表 
        *   - [x] API 概述 
            *   - [x] Kubernetes API 概念 
            *   - [x] 声明式 API 验证 
            *   - [x] 服务器端应用（Server-Side Apply） 
            *   - [x] 客户端库 
            *   - [x] Kubernetes 中的通用表达式语言 
            *   - [x] 已弃用 API 的迁移指南 
            *   - [x] Kubernetes API 健康端点 

        *   - [x] API 访问控制 
            *   - [x] 用户认证 
            *   - [x] 使用启动引导令牌（Bootstrap Tokens）认证 
            *   - [x] 鉴权 
            *   - [x] 使用 RBAC 鉴权 
            *   - [x] 使用 Node 鉴权 
            *   - [x] Webhook 模式 
            *   - [x] 使用 ABAC 鉴权 
            *   - [x] 准入控制 
            *   - [x] 动态准入控制 
            *   - [x] 管理服务账号 
            *   - [x] 用户伪装 
            *   - [x] 证书和证书签名请求 
            *   - [x] 从 PodSecurityPolicy 映射到 Pod 安全性标准 
            *   - [x] kubelet 认证/鉴权 
            *   - [x] TLS 启动引导 
            *   - [x] 验证和变更准入策略（Validating and Mutating Admission Policies） 
            *   - [x] 变更性准入策略 
            *   - [x] 基于清单的准入控制 
            *   - [x] 验证准入策略（ValidatingAdmissionPolicy） 

        *   - [x] Kubernetes 弃用策略 
        *   - [x] 常用的标签、注解和污点 
            *   - [x] 审计注解 

        *   - [x] Kubernetes API 
            *   - [x] 工作负载资源 
                *   - [x] Pod 
                *   - [x] Binding 
                *   - [x] PodTemplate 
                *   - [x] ReplicationController 
                *   - [x] ReplicaSet 
                *   - [x] Deployment 
                *   - [x] StatefulSet 
                *   - [x] ControllerRevision 
                *   - [x] DaemonSet 
                *   - [x] Job 
                *   - [x] CronJob 
                *   - [x] HorizontalPodAutoscaler 
                *   - [x] HorizontalPodAutoscaler 
                *   - [x] DeviceTaintRule v1alpha3 
                *   - [x] PriorityClass 
                *   - [x] ResourceClaim v1beta2 
                *   - [x] ResourceClaimTemplate v1beta2 
                *   - [x] ResourceSlice v1beta1 
                *   - [x] ResourceSlice v1alpha3 

            *   - [x] Service 资源 
                *   - [x] Service 
                *   - [x] Endpoints 
                *   - [x] EndpointSlice 
                *   - [x] Ingress 
                *   - [x] IngressClass 

            *   - [x] 配置和存储资源 
                *   - [x] ConfigMap 
                *   - [x] Secret 
                *   - [x] CSIDriver 
                *   - [x] CSINode 
                *   - [x] CSIStorageCapacity 
                *   - [x] PersistentVolumeClaim 
                *   - [x] PersistentVolume 
                *   - [x] StorageClass 
                *   - [x] StorageVersionMigration v1alpha1 
                *   - [x] Volume 
                *   - [x] VolumeAttachment 
                *   - [x] VolumeAttributesClass 

            *   - [x] 身份认证资源 
                *   - [x] ServiceAccount 
                *   - [x] TokenRequest 
                *   - [x] TokenReview 
                *   - [x] CertificateSigningRequest 
                *   - [x] ClusterTrustBundle v1beta1 
                *   - [x] SelfSubjectReview 

            *   - [x] 鉴权资源 
                *   - [x] LocalSubjectAccessReview 
                *   - [x] SelfSubjectAccessReview 
                *   - [x] SelfSubjectRulesReview 
                *   - [x] SubjectAccessReview 
                *   - [x] ClusterRole 
                *   - [x] ClusterRoleBinding 
                *   - [x] Role 
                *   - [x] RoleBinding 

            *   - [x] 策略资源 
                *   - [x] FlowSchema 
                *   - [x] LimitRange 
                *   - [x] ResourceQuota 
                *   - [x] NetworkPolicy 
                *   - [x] PodDisruptionBudget 
                *   - [x] PriorityLevelConfiguration v1 
                *   - [x] ValidatingAdmissionPolicy 
                *   - [x] ValidatingAdmissionPolicyBinding 

            *   - [x] 扩展资源 
                *   - [x] CustomResourceDefinition 
                *   - [x] DeviceClass 
                *   - [x] MutatingWebhookConfiguration 
                *   - [x] ValidatingWebhookConfiguration 

            *   - [x] 集群资源 
                *   - [x] APIService 
                *   - [x] ComponentStatus 
                *   - [x] Event 
                *   - [x] IPAddress 
                *   - [x] Lease 
                *   - [x] LeaseCandidate v1beta1 
                *   - [x] Namespace 
                *   - [x] Node 
                *   - [x] RuntimeClass 
                *   - [x] ServiceCIDR 

            *   - [x] 公共定义 
                *   - [x] DeleteOptions 
                *   - [x] LabelSelector 
                *   - [x] ListMeta 
                *   - [x] LocalObjectReference 
                *   - [x] NodeSelectorRequirement 
                *   - [x] ObjectFieldSelector 
                *   - [x] ObjectMeta 
                *   - [x] ObjectReference 
                *   - [x] Patch 
                *   - [x] Quantity 
                *   - [x] ResourceFieldSelector 
                *   - [x] Status 
                *   - [x] TypedLocalObjectReference 

            *   - [x] API Groups(EN) 
            *   - [x] 常用参数 
            *   - [x] Admissionregistration(EN) 
                *   - [x] MutatingAdmissionPolicy(EN) 
                *   - [x] MutatingAdmissionPolicyBinding(EN) 
                *   - [x] MutatingWebhookConfiguration(EN) 
                *   - [x] ValidatingAdmissionPolicy(EN) 
                *   - [x] ValidatingAdmissionPolicyBinding(EN) 
                *   - [x] ValidatingWebhookConfiguration(EN) 

            *   - [x] Apiextensions(EN) 
                *   - [x] CustomResourceDefinition(EN) 

            *   - [x] Apiregistration(EN) 
                *   - [x] APIService(EN) 

            *   - [x] Apiserverinternal(EN) 
                *   - [x] StorageVersion(EN) 

            *   - [x] Apps(EN) 
                *   - [x] ControllerRevision(EN) 
                *   - [x] DaemonSet(EN) 
                *   - [x] Deployment(EN) 
                *   - [x] ReplicaSet(EN) 
                *   - [x] StatefulSet(EN) 

            *   - [x] Autoscaling(EN) 
                *   - [x] HorizontalPodAutoscaler(EN) 

            *   - [x] Batch(EN) 
                *   - [x] CronJob(EN) 
                *   - [x] Job(EN) 

            *   - [x] Certificates(EN) 
                *   - [x] CertificateSigningRequest(EN) 
                *   - [x] ClusterTrustBundle(EN) 
                *   - [x] PodCertificateRequest(EN) 

            *   - [x] Coordination(EN) 
                *   - [x] Lease(EN) 
                *   - [x] LeaseCandidate(EN) 

            *   - [x] Discovery(EN) 
                *   - [x] EndpointSlice(EN) 

            *   - [x] Events(EN) 
                *   - [x] Event(EN) 

            *   - [x] Core(EN) 
                *   - [x] ComponentStatus(EN) 
                *   - [x] ConfigMap(EN) 
                *   - [x] Endpoints(EN) 
                *   - [x] Event(EN) 
                *   - [x] LimitRange(EN) 
                *   - [x] Namespace(EN) 
                *   - [x] Node(EN) 
                *   - [x] PersistentVolume(EN) 
                *   - [x] PersistentVolumeClaim(EN) 
                *   - [x] Pod(EN) 
                *   - [x] PodTemplate(EN) 
                *   - [x] ReplicationController(EN) 
                *   - [x] ResourceQuota(EN) 
                *   - [x] Secret(EN) 
                *   - [x] Service(EN) 
                *   - [x] ServiceAccount(EN) 

            *   - [x] Flowcontrol(EN) 
                *   - [x] FlowSchema(EN) 
                *   - [x] PriorityLevelConfiguration(EN) 

            *   - [x] Lifecycle(EN) 
                *   - [x] Eviction(EN) 
                *   - [x] EvictionRequest(EN) 

            *   - [x] Networking(EN) 
                *   - [x] IPAddress(EN) 
                *   - [x] Ingress(EN) 
                *   - [x] IngressClass(EN) 
                *   - [x] NetworkPolicy(EN) 
                *   - [x] ServiceCIDR(EN) 

            *   - [x] Node(EN) 
                *   - [x] RuntimeClass(EN) 

            *   - [x] Policy(EN) 
                *   - [x] PodDisruptionBudget(EN) 

            *   - [x] Rbac(EN) 
                *   - [x] ClusterRole(EN) 
                *   - [x] ClusterRoleBinding(EN) 
                *   - [x] Role(EN) 
                *   - [x] RoleBinding(EN) 

            *   - [x] Resource(EN) 
                *   - [x] DeviceClass(EN) 
                *   - [x] DeviceTaintRule(EN) 
                *   - [x] ResourceClaim(EN) 
                *   - [x] ResourceClaimTemplate(EN) 
                *   - [x] ResourcePoolStatusRequest(EN) 
                *   - [x] ResourceSlice(EN) 

            *   - [x] Scheduling(EN) 
                *   - [x] CompositePodGroup(EN) 
                *   - [x] PodGroup(EN) 
                *   - [x] PriorityClass(EN) 
                *   - [x] Workload(EN) 

            *   - [x] Storage(EN) 
                *   - [x] CSIDriver(EN) 
                *   - [x] CSINode(EN) 
                *   - [x] CSIStorageCapacity(EN) 
                *   - [x] StorageClass(EN) 
                *   - [x] VolumeAttachment(EN) 
                *   - [x] VolumeAttributesClass(EN) 

            *   - [x] Storagemigration(EN) 
                *   - [x] StorageVersionMigration(EN) 

        *   - [x] 插桩 
            *   - [x] 服务水平指示器指标 
            *   - [x] CRI Pod 和容器指标 
            *   - [x] 节点指标数据 
            *   - [x] 了解压力阻塞信息（PSI）指标 
            *   - [x] 原生直方图 
            *   - [x] Kubernetes z-pages 
            *   - [x] Kubernetes Metrics Reference(EN) 

        *   - [x] Kubernetes 问题和安全 
            *   - [x] Kubernetes 问题追踪 
            *   - [x] Kubernetes 安全和信息披露 
            *   - [x] CVE feed 

        *   - [x] 节点参考信息 
            *   - [x] Kubelet Checkpoint API 
            *   - [x] Linux 内核版本要求 
            *   - [x] 动态资源分配的标准设备属性 
            *   - [x] Kubelet Pods API 
            *   - [x] 关于 dockershim 移除和使用兼容 CRI 运行时的文章 
            *   - [x] Pod 级资源管理器参考 
            *   - [x] 由 kubelet 填充的节点标签 
            *   - [x] kubelet 所使用的本地文件和路径 
            *   - [x] Kubelet 同步循环 
            *   - [x] kubelet 配置目录合并 
            *   - [x] Kubelet 设备管理器 API 版本 
            *   - [x] kubelet systemd 看门狗 
            *   - [x] Seccomp 和 Kubernetes 
            *   - [x] 节点状态 
            *   - [x] 节点重启后会发生什么 
            *   - [x] Linux 节点的交换（Swap）行为 
            *   - [x]  

        *   - [x] 网络参考 
            *   - [x] Service 所用的协议 
            *   - [x] 端口和协议 
            *   - [x] 虚拟 IP 和服务代理 

        *   - [x] Storage Reference(EN) 
            *   - [x] Volume Types(EN) 

        *   - [x] 安装工具 
            *   - [x] Kubeadm 
                *   - [x] kubeadm init 
                *   - [x] kubeadm join 
                *   - [x] kubeadm upgrade 
                *   - [x] kubeadm upgrade phases 
                *   - [x] kubeadm config 
                *   - [x] kubeadm reset 
                *   - [x] kubeadm token 
                *   - [x] kubeadm version 
                *   - [x] kubeadm alpha 
                *   - [x] kubeadm certs 
                *   - [x] kubeadm init phase 
                *   - [x] kubeadm join phase 
                *   - [x] kubeadm kubeconfig 
                *   - [x] kubeadm reset phase 
                *   - [x] 实现细节 

        *   - [x] 编码 
            *   - [x] KYAML 参考 

        *   - [x] 命令行工具（kubectl） 
            *   - [x] kubectl 介绍 
            *   - [x] kubectl 参考 
                *   - [x] kubectl 
                *   - [x] kubectl annotate 
                *   - [x] kubectl api-resources 
                *   - [x] kubectl api-versions 
                *   - [x] kubectl apply 
                    *   - [x] kubectl apply edit-last-applied 
                    *   - [x] kubectl apply set-last-applied 
                    *   - [x] kubectl apply view-last-applied 

                *   - [x] kubectl attach 
                *   - [x] kubectl auth 
                    *   - [x] kubectl auth can-i 
                    *   - [x] kubectl auth reconcile 
                    *   - [x] kubectl auth whoami 

                *   - [x] kubectl autoscale 
                *   - [x] kubectl certificate 
                    *   - [x] kubectl certificate approve 
                    *   - [x] kubectl certificate deny 

                *   - [x] kubectl cluster-info 
                    *   - [x] kubectl cluster-info dump 

                *   - [x] kubectl completion 
                *   - [x] kubectl config 
                    *   - [x] kubectl config current-context 
                    *   - [x] kubectl config delete-cluster 
                    *   - [x] kubectl config delete-context 
                    *   - [x] kubectl config delete-user 
                    *   - [x] kubectl config get-clusters 
                    *   - [x] kubectl config get-contexts 
                    *   - [x] kubectl config get-users 
                    *   - [x] kubectl config rename-context 
                    *   - [x] kubectl config set 
                    *   - [x] kubectl config set-cluster 
                    *   - [x] kubectl config set-context 
                    *   - [x] kubectl config set-credentials 
                    *   - [x] kubectl config unset 
                    *   - [x] kubectl config use-context 
                    *   - [x] kubectl config view 

                *   - [x] kubectl cordon 
                *   - [x] kubectl cp 
                *   - [x] kubectl create 
                    *   - [x] kubectl create clusterrole 
                    *   - [x] kubectl create clusterrolebinding 
                    *   - [x] kubectl create configmap 
                    *   - [x] kubectl create cronjob 
                    *   - [x] kubectl create deployment 
                    *   - [x] kubectl create ingress 
                    *   - [x] kubectl create job 
                    *   - [x] kubectl create namespace 
                    *   - [x] kubectl create poddisruptionbudget 
                    *   - [x] kubectl create priorityclass 
                    *   - [x] kubectl create quota 
                    *   - [x] kubectl create role 
                    *   - [x] kubectl create rolebinding 
                    *   - [x] kubectl create secret 
                    *   - [x] kubectl create secret docker-registry 
                    *   - [x] kubectl create secret generic 
                    *   - [x] kubectl create secret tls 
                    *   - [x] kubectl create service 
                    *   - [x] kubectl create service clusterip 
                    *   - [x] kubectl create service externalname 
                    *   - [x] kubectl create service loadbalancer 
                    *   - [x] kubectl create service nodeport 
                    *   - [x] kubectl create serviceaccount 
                    *   - [x] kubectl create token 

                *   - [x] kubectl debug 
                *   - [x] kubectl delete 
                *   - [x] kubectl describe 
                *   - [x] kubectl diff 
                *   - [x] kubectl drain 
                *   - [x] kubectl edit 
                *   - [x] kubectl events 
                *   - [x] kubectl exec 
                *   - [x] kubectl explain 
                *   - [x] kubectl expose 
                *   - [x] kubectl get 
                *   - [x] kubectl kuberc 
                    *   - [x] kubectl kuberc set 
                    *   - [x] kubectl kuberc view 

                *   - [x] kubectl kustomize 
                *   - [x] kubectl label 
                *   - [x] kubectl logs 
                *   - [x] kubectl options 
                *   - [x] kubectl patch 
                *   - [x] kubectl plugin 
                    *   - [x] kubectl plugin list 

                *   - [x] kubectl port-forward 
                *   - [x] kubectl proxy 
                *   - [x] kubectl replace 
                *   - [x] kubectl rollout 
                    *   - [x] kubectl rollout history 
                    *   - [x] kubectl rollout pause 
                    *   - [x] kubectl rollout restart 
                    *   - [x] kubectl rollout resume 
                    *   - [x] kubectl rollout status 
                    *   - [x] kubectl rollout undo 

                *   - [x] kubectl run 
                *   - [x] kubectl scale 
                *   - [x] kubectl set 
                    *   - [x] kubectl set env 
                    *   - [x] kubectl set image 
                    *   - [x] kubectl set resources 
                    *   - [x] kubectl set selector 
                    *   - [x] kubectl set serviceaccount 
                    *   - [x] kubectl set subject 

                *   - [x] kubectl taint 
                *   - [x] kubectl top 
                    *   - [x] kubectl top node 
                    *   - [x] kubectl top pod 

                *   - [x] kubectl uncordon 
                *   - [x] kubectl version 
                *   - [x] kubectl wait 

            *   - [x] kubectl 快速参考 
            *   - [x] kubectl 命令 
            *   - [x] kubectl 
            *   - [x] JSONPath 支持 
            *   - [x] 适用于 Docker 用户的 kubectl 
            *   - [x] kubectl 的用法约定 
            *   - [x] kubectl 用户偏好设置（kuberc） 

        *   - [x] 调试集群 
            *   - [x] 流控 

        *   - [x] 组件工具 
            *   - [x] 特性门控 
            *   - [x] 特性门控（已移除） 
            *   - [x] kubelet 
            *   - [x] kube-apiserver 
            *   - [x] kube-controller-manager 
            *   - [x] kube-proxy 
            *   - [x] kube-scheduler 

        *   - [x] 配置 API 
            *   - [x] Event Rate Limit Configuration (v1alpha1) 
            *   - [x] Image Policy API (v1alpha1) 
            *   - [x] kube-apiserver Admission (v1) 
            *   - [x] kube-apiserver Audit 配置（v1） 
            *   - [x] kube-apiserver 配置 (v1) 
            *   - [x] kube-apiserver 配置（v1alpha1） 
            *   - [x] kube-apiserver 配置（v1beta1） 
            *   - [x] kube-controller-manager Configuration (v1alpha1) 
            *   - [x] kube-proxy 配置 (v1alpha1) 
            *   - [x] kube-scheduler 配置 (v1) 
            *   - [x] kubeadm 配置 (v1beta4) 
            *   - [x] kubeadm 配置（v1beta3） 
            *   - [x] kubeconfig (v1) 
            *   - [x] Kubelet CredentialProvider (v1) 
            *   - [x] kubelet 配置 (v1) 
            *   - [x] kubelet 配置 (v1alpha1) 
            *   - [x] Kubelet 配置 (v1beta1) 
            *   - [x] kuberc (v1alpha1) 
            *   - [x] kuberc (v1beta1) 
            *   - [x] WebhookAdmission 配置 (v1) 
            *   - [x] 客户端身份认证（Client Authentication）（v1） 
            *   - [x] 客户端身份认证（Client Authentication）（v1beta1） 

        *   - [x] 外部 API 
            *   - [x] Kubernetes Metrics (v1)(EN) 
            *   - [x] Kubernetes 外部指标（v1beta1） 
            *   - [x] Kubernetes 指标 (v1beta1) 
            *   - [x] Kubernetes 自定义指标 (v1beta2) 

        *   - [x] Kubelet APIs(EN) 
            *   - [x] Kubelet Summary API (v1alpha1)(EN) 

        *   - [x] 调度 
            *   - [x] 调度器配置 
            *   - [x] 调度策略 

        *   - [x] 其他工具 

    *   - [x] 贡献 
        *   - [x] 为 Kubernetes 文档出一份力 
        *   - [x] 为 Kubernetes 博客做贡献 
            *   - [x] 给 Kubernetes 博客提交文章 
            *   - [x] 博客指南 
            *   - [x] 博客文章镜像 
            *   - [x] 发布后沟通 
            *   - [x] 作为博客写作伙伴提供帮助 

        *   - [x] 提出内容改进建议 
        *   - [x] 贡献新内容 
            *   - [x] 发起拉取请求（PR） 
            *   - [x] 本地预览 
            *   - [x] 为发行版本撰写文档 
            *   - [x] 案例分析 

        *   - [x] 评阅变更 
            *   - [x] 评审 PR 
            *   - [x] 评阅人和批准人 

        *   - [x] 本地化 Kubernetes 文档 
        *   - [x] 参与 SIG Docs 
            *   - [x] 角色与责任 
            *   - [x] Issue 管理者 
            *   - [x] PR 管理者 

        *   - [x] 更新参考文档 
            *   - [x] Quickstart 
            *   - [x] 发行版本生成 
            *   - [x] 为上游 Kubernetes 代码库做出贡献 
            *   - [x] 为 Kubernetes API 生成参考文档 
            *   - [x] 为 Configuration API 生成参考文档 
            *   - [x] 为 kubectl 命令集生成参考文档 
            *   - [x] 为指标生成参考文档 
            *   - [x] 为 Kubernetes 组件和工具生成参考文档 
            *   - [x]  

        *   - [x] 文档样式概述 
            *   - [x] 内容指南 
            *   - [x] 样式指南 
            *   - [x] 图表指南 
            *   - [x] 撰写新主题 
            *   - [x] 页面内容类型 
            *   - [x] 内容组织 
            *   - [x] 定制 Hugo 短代码 

        *   - [x] 进阶贡献 
        *   - [x] 查看站点分析 
        *   - [x] 中文本地化样式指南 

    *   - [x] 测试页面（中文版） 

编辑此页添加子页面登记一个问题整节打印

*   为什么需要 Kubernetes，它能做什么？
*   Kubernetes 不是什么
*   Kubernetes 的历史背景
*   接下来

1.   Kubernetes 文档
2.   概念
3.   概述

# 概述

Kubernetes 是一个可移植、可扩展的开源平台，用于管理容器化的工作负载和服务，方便进行声明式配置和自动化。Kubernetes 拥有一个庞大且快速增长的生态系统，其服务、支持和工具的使用范围广泛。

此页面是 Kubernetes 的概述。

**Kubernetes** 这个名字源于希腊语，意为“舵手”或“飞行员”。K8s 这个缩写是因为 K 和 s 之间有 8 个字符的关系。 Google 在 2014 年开源了 Kubernetes 项目。 Kubernetes 建立在 Google 大规模运行生产工作负载十几年经验的基础上， 结合了社区中最优秀的想法和实践。

## 为什么需要 Kubernetes，它能做什么？ 

容器是打包和运行应用程序的好方式。在生产环境中， 你需要管理运行着应用程序的容器，并确保服务不会下线。 例如，如果一个容器发生故障，则你需要启动另一个容器。 如果此行为交由给系统处理，是不是会更容易一些？

这就是 Kubernetes 要来做的事情！ Kubernetes 为你提供了一个可弹性运行分布式系统的框架。 Kubernetes 会满足你的扩展要求、故障转移你的应用、提供部署模式等。 例如，Kubernetes 可以轻松管理系统的 Canary (金丝雀) 部署。

Kubernetes 为你提供：

*   **服务发现和负载均衡**

Kubernetes 可以使用 DNS 名称或自己的 IP 地址来暴露容器。 如果进入容器的流量很大， Kubernetes 可以负载均衡并分配网络流量，从而使部署稳定。

*   **存储编排**

Kubernetes 允许你自动挂载你选择的存储系统，例如本地存储、公共云提供商等。

*   **自动部署和回滚**

你可以使用 Kubernetes 描述已部署容器的所需状态， 它可以以受控的速率将实际状态更改为期望状态。 例如，你可以自动化 Kubernetes 来为你的部署创建新容器， 删除现有容器并将它们的所有资源用于新容器。

*   **自动完成装箱计算**

你为 Kubernetes 提供许多节点组成的集群，在这个集群上运行容器化的任务。 你告诉 Kubernetes 每个容器需要多少 CPU 和内存 (RAM)。 Kubernetes 可以将这些容器按实际情况调度到你的节点上，以最佳方式利用你的资源。

*   **自我修复**

Kubernetes 将重新启动失败的容器、替换容器、杀死不响应用户定义的运行状况检查的容器， 并且在准备好服务之前不将其通告给客户端。

*   **密钥与配置管理**

Kubernetes 允许你存储和管理敏感信息，例如密码、OAuth 令牌和 SSH 密钥。 你可以在不重建容器镜像的情况下部署和更新密钥和应用程序配置，也无需在堆栈配置中暴露密钥。

*   **批处理执行** 除了服务外，Kubernetes 还可以管理你的批处理和 CI（持续集成）工作负载，如有需要，可以替换失败的容器。
*   **水平扩缩** 使用简单的命令、用户界面或根据 CPU 使用率自动对你的应用进行扩缩。
*   **IPv4/IPv6 双栈** 为 Pod（容器组）和 Service（服务）分配 IPv4 和 IPv6 地址。
*   **为可扩展性设计** 在不改变上游源代码的情况下为你的 Kubernetes 集群添加功能。

## Kubernetes 不是什么 

Kubernetes 不是传统的、包罗万象的 PaaS（平台即服务）系统。 由于 Kubernetes 是在容器级别运行，而非在硬件级别，它提供了 PaaS 产品共有的一些普遍适用的功能， 例如部署、扩展、负载均衡，允许用户集成他们的日志记录、监控和警报方案。 但是，Kubernetes 不是单体式（monolithic）系统，那些默认解决方案都是可选、可插拔的。 Kubernetes 为构建开发人员平台提供了基础，但是在重要的地方保留了用户选择权，能有更高的灵活性。

Kubernetes：

*   不限制支持的应用程序类型。 Kubernetes 旨在支持极其多种多样的工作负载，包括无状态、有状态和数据处理工作负载。 如果应用程序可以在容器中运行，那么它应该可以在 Kubernetes 上很好地运行。
*   不部署源代码，也不构建你的应用程序。 持续集成（CI）、交付和部署（CI/CD）工作流取决于组织的文化和偏好以及技术要求。
*   不提供应用程序级别的服务作为内置服务，例如中间件（例如消息中间件）、 数据处理框架（例如 Spark）、数据库（例如 MySQL）、缓存、集群存储系统 （例如 Ceph）。这样的组件可以在 Kubernetes 上运行，并且/或者可以由运行在 Kubernetes 上的应用程序通过可移植机制（例如开放服务代理）来访问。

*   不是日志记录、监视或警报的解决方案。 它集成了一些功能作为概念证明，并提供了收集和导出指标的机制。
*   不提供也不要求配置用的语言、系统（例如 jsonnet），它提供了声明性 API， 该声明性 API 可以由任意形式的声明性规范所构成。
*   不提供也不采用任何全面的机器配置、维护、管理或自我修复系统。
*   此外，Kubernetes 不仅仅是一个编排系统，实际上它消除了编排的需要。 编排的技术定义是执行已定义的工作流程：首先执行 A，然后执行 B，再执行 C。 而 Kubernetes 包含了一组独立可组合的控制过程，可以持续地将当前状态驱动到所提供的预期状态。 你不需要在乎如何从 A 移动到 C，也不需要集中控制，这使得系统更易于使用且功能更强大、 系统更健壮，更为弹性和可扩展。

## Kubernetes 的历史背景 

让我们回顾一下为何 Kubernetes 能够裨益四方。

（图：Image 2: 部署演进）

**传统部署时代：**

早期，各个组织是在物理服务器上运行应用程序。 由于无法限制在物理服务器中运行的应用程序资源使用，因此会导致资源分配问题。 例如，如果在同一台物理服务器上运行多个应用程序， 则可能会出现一个应用程序占用大部分资源的情况，而导致其他应用程序的性能下降。 一种解决方案是将每个应用程序都运行在不同的物理服务器上， 但是当某个应用程序资源利用率不高时，剩余资源无法被分配给其他应用程序， 而且维护许多物理服务器的成本很高。

**虚拟化部署时代：**

因此，虚拟化技术被引入了。虚拟化技术允许你在单个物理服务器的 CPU 上运行多台虚拟机（VM）。 虚拟化能使应用程序在不同 VM 之间被彼此隔离，且能提供一定程度的安全性， 因为一个应用程序的信息不能被另一应用程序随意访问。

虚拟化技术能够更好地利用物理服务器的资源，并且因为可轻松地添加或更新应用程序， 而因此可以具有更高的可扩缩性，以及降低硬件成本等等的好处。 通过虚拟化，你可以将一组物理资源呈现为可丢弃的虚拟机集群。

每个 VM 是一台完整的计算机，在虚拟化硬件之上运行所有组件，包括其自己的操作系统。

**容器部署时代：**

容器类似于 VM，但是更宽松的隔离特性，使容器之间可以共享操作系统（OS）。 因此，容器比起 VM 被认为是更轻量级的。且与 VM 类似，每个容器都具有自己的文件系统、CPU、内存、进程空间等。 由于它们与基础架构分离，因此可以跨云和 OS 发行版本进行移植。

容器因具有许多优势而变得流行起来，例如：

*   敏捷应用程序的创建和部署：与使用 VM 镜像相比，提高了容器镜像创建的简便性和效率。
*   持续开发、集成和部署：通过快速简单的回滚（由于镜像不可变性）， 提供可靠且频繁的容器镜像构建和部署。
*   关注开发与运维的分离：在构建、发布时创建应用程序容器镜像，而不是在部署时， 从而将应用程序与基础架构分离。
*   可观察性：不仅可以显示 OS 级别的信息和指标，还可以显示应用程序的运行状况和其他指标信号。

*   跨开发、测试和生产的环境一致性：在笔记本计算机上也可以和在云中运行一样的应用程序。
*   跨云和操作系统发行版本的可移植性：可在 Ubuntu、RHEL、CoreOS、本地、 Google Kubernetes Engine 和其他任何地方运行。
*   以应用程序为中心的管理：提高抽象级别，从在虚拟硬件上运行 OS 到使用逻辑资源在 OS 上运行应用程序。
*   松散耦合、分布式、弹性、解放的微服务：应用程序被分解成较小的独立部分， 并且可以动态部署和管理 - 而不是在一台大型单机上整体运行。
*   资源隔离：可预测的应用程序性能。
*   资源利用：高效率和高密度。

## 接下来

*   查阅 Kubernetes 组件
*   查阅 Kubernetes API
*   请查看 kubectl：Kubernetes 的主要命令行工具。
*   查阅 Cluster 架构
*   开始 Kubernetes 的建置吧！

## 反馈

此页是否对你有帮助？

是 否
感谢反馈。如果你有一个关于如何使用 Kubernetes 的具体问题需要答案，可以访问 Stack Overflow. 如果需要，请在 GitHub 仓库 上登记新的问题 报告问题 或者 提出改进建议.

最后修改 June 18, 2026 at 11:33 AM PST: sync overview/_index components (2ef2f60d15)

© 2026 The Kubernetes 作者 | 文档发布基于 CC BY 4.0 授权许可

© 2026 Linux 基金会®。保留所有权利。Linux 基金会已注册并使用商标。如需了解 Linux 基金会的商标列表，请访问商标使用页面

ICP 许可： 京ICP备17074266号-3

*   Kubernetes
*   文档
*   博客
*   培训
*   合作伙伴
*   社区
*   职业
*   版本列表
*   发布信息
*   v1.37
*   v1.36
*   v1.35
*   v1.34
*   v1.33
*   中文 (Chinese)
*   English
*   বাংলা (Bengali)
*   Français (French)
*   Deutsch (German)
*   हिन्दी (Hindi)
*   Bahasa Indonesia (Indonesian)
*   Italiano (Italian)
*   日本語 (Japanese)
*   한국어 (Korean)
*   Polski (Polish)
*   Português (Portuguese)
*   Русский (Russian)
*   Español (Spanish)
*   Українська (Ukrainian)
*   Tiếng Việt (Vietnamese)
*   Theme fixed for this page
