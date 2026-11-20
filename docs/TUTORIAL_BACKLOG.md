# 教程写作 Backlog（自动化任务驱动）

> 用法：每批次 3 篇。定时任务每次领取第一个 `status: pending` 的批次，
> 写入 `src/tutorials/<slug>.md`，把 status 改为 `done`，跑
> `scripts/build-tutorials.mjs`，git 提交推送。全部批次完成后
> 调用 CronPauseSelf 结束自动化。

## Batch 2 — 游戏域补强 — status: done
- x21_graphics_basics | 游戏与图形 | 图形学基础入门：从像素到管线
- x22_game_physics | 游戏与图形 | 游戏物理入门：碰撞、重力与轨迹
- x23_unity_platformer | 游戏与图形 | Unity 2D 平台跳跃实战

## Batch 3 — 后端与数据深水区 — status: done
- x24_jwt_oauth | 后端开发 | JWT 与 OAuth2：现代认证鉴权
- x25_message_queue | 后端开发 | 消息队列入门：RabbitMQ 与 Kafka
- x26_mongodb | 数据库 | MongoDB 入门：文档模型与聚合查询

## Batch 4 — AI 应用与移动 — status: done
- x27_vector_db | 人工智能 | 向量数据库实战：语义检索的基石
- x28_lora_finetune | 人工智能 | LoRA 微调入门：让开源模型学会你的领域
- x29_jetpack_compose | 移动与跨端 | Jetpack Compose 入门：声明式 Android UI

## Batch 5 — 跨端与算法 — status: done
- x30_react_native | 移动与跨端 | React Native 入门：用 React 写原生 App
- x31_hash_string | 数据结构与算法 | 哈希与字符串算法：从 Map 到 KMP
- x32_cocos_creator | 游戏与图形 | Cocos Creator 入门：国产引擎做 2D 游戏

## Batch 6 — 原理深挖 — status: done
- x33_mysql_index | 数据库 | MySQL 索引与查询优化实战
- x34_backtracking | 数据结构与算法 | 回溯与剪枝：排列组合的系统化搜索
- x35_compiler_intro | 计算机组成 | 编译原理入门：从源码到可执行

## Batch 7 — 语言与算法与游戏 — status: done
- x36_go_intro | 编程语言 | Go 入门：并发编程的轻量之道
- x37_sliding_window | 数据结构与算法 | 滑动窗口与双指针：线性时间的子串艺术
- x38_unity_animator | 游戏与图形 | Unity 动画系统：Animator 状态机

## Batch 8 — 智能与通信 — status: done
- x39_ai_agent | 人工智能 | AI Agent 开发：工具调用与规划循环
- x40_grpc_micro | 后端开发 | gRPC 与微服务通信
- x41_game_audio | 游戏与图形 | 游戏音效与资源管线

## Batch 9 — 移动与前端性能 — status: done
- x42_swiftui | 移动与跨端 | Swift 与 SwiftUI 入门
- x43_react_perf | Web 前端 | React 性能优化实战
- x44_tree_heap | 数据结构与算法 | 树与堆：优先队列的艺术

## Batch 10 — 数据与运维 — status: done
- x45_redis_ha | 数据库 | Redis 高可用：哨兵与集群
- x46_nginx_deep | 操作系统与运维 | Nginx 深入：反向代理与负载均衡
- x47_weapp | 移动与跨端 | 微信小程序开发入门

## Batch 11 — AI 与 Web 性能 — status: done
- x48_nlp_intro | 人工智能 | NLP 入门：从分词到大模型
- x49_web_perf | Web 前端 | Web 性能优化实战
- x50_cv_intro | 人工智能 | 计算机视觉入门：从像素到识别

## Batch 12 — 工具精通 — status: done
- x51_regex | 编程基础与工具 | 正则表达式精通
- x52_git_advanced | 编程基础与工具 | Git 高级技巧与团队工作流
- x53_flutter_state | 移动与跨端 | Flutter 状态管理进阶

## Batch 13 — CSS 深度拆分（知识粒度细化） — status: done
- x54_flex_container | Web 前端 | Flexbox 容器属性逐个击破
- x55_flex_items | Web 前端 | Flexbox 子项属性详解
- x56_grid_container | Web 前端 | CSS Grid 容器全属性指南

## Batch 14 — JS 异步深度 — status: done
- x57_promise_impl | Web 前端 | 手写 Promise：从规范到实现
- x58_event_loop | Web 前端 | 事件循环深度剖析：宏任务微任务与调度
- x59_async_await | Web 前端 | async/await 原理：生成器与协程

## Batch 15 — React 深度 — status: done
- x60_usestate_deep | Web 前端 | useState 深度剖析：闭包陷阱与批处理
- x61_useeffect_deep | Web 前端 | useEffect 完全指南：依赖、清理与时机
- x62_react_fiber | Web 前端 | React Fiber 架构：可中断渲染

## Batch 16 — TS 与 Redis 深度 — status: done
- x63_ts_typesystem | Web 前端 | TypeScript 类型系统基础：结构化类型与收窄
- x64_ts_generics | Web 前端 | TypeScript 泛型进阶：约束、推断与工具类型实现
- x65_redis_internals | 数据库 | Redis 数据结构底层实现

## Batch 17 — Python 与 Java 深度 — status: done
- x66_python_decorators | 编程语言 | Python 装饰器与生成器：闭包的两种应用
- x67_jvm_memory | 编程语言 | JVM 内存模型与垃圾回收
- x68_java_collections | 编程语言 | Java 集合框架源码剖析

## Batch 18 — 网络深度 — status: done
- x69_tcp_deep | 计算机网络 | TCP 深入：三次握手、四次挥手与状态机
- x70_http_cache | Web 前端 | HTTP 缓存完全指南
- x71_tls_handshake | 计算机网络 | TLS 握手与证书体系

## Batch 19 — 框架与工具深度 — status: pending
- x72_vue_reactivity | Web 前端 | Vue 响应式原理：从 defineProperty 到 Proxy
- x73_docker_image | 操作系统与运维 | Docker 镜像原理：分层与优化
- x74_shell_params | 操作系统与运维 | Shell 参数扩展完整语法

## Batch 20 — 参考资料（本地化外链内容） — status: done
> 用 scripts/fetch-references.mjs 抓取下方清单 → src/references/*.md
- [ ] ref-mdn-flex | MDN Flexbox 基本概念 | https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox
- [ ] ref-mdn-grid | MDN Grid 布局核心概念 | https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout
- [ ] ref-react-thinking | React 官方：用 React 思考 | https://react.dev/learn/thinking-in-react
- [ ] ref-mdn-eventloop | MDN 并发模型与事件循环 | https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Event_loop

## Batch 21 — 操作系统深水区 — status: done
- x69_process_thread | 操作系统与运维 | 进程与线程：调度、上下文切换与通信
- x70_virtual_memory | 操作系统与运维 | 虚拟内存与分页：MMU、页表与缺页处理
- x71_filesystem | 操作系统与运维 | 文件系统实现：inode、日志与崩溃一致性

## Batch 22 — 计算机体系结构 — status: done
- x72_pipeline | 计算机组成 | 指令流水线：冒险、转发与分支预测
- x73_cache | 计算机组成 | Cache 层次结构：局部性原理、映射与替换策略
- x74_bus_io | 计算机组成 | 总线、中断与 I/O 系统

## Batch 23 — 分布式与并行（CS2023 PDC） — status: done
- x75_dist_basics | 分布式与并行 | 分布式系统基础：CAP 定理与一致性模型
- x76_consensus | 分布式与并行 | 共识算法：Paxos 与 Raft
- x77_parallel_prog | 分布式与并行 | 并行编程入门：OpenMP、CUDA 与并行模式

## Batch 24 — 软件工程深水区（CS2023 SE） — status: done
- x78_design_patterns | 软件工程 | 设计模式：场景化精选与权衡
- x79_refactoring | 软件工程 | 重构：代码坏味道与安全手法
- x80_arch_styles | 软件工程 | 软件架构风格：分层、六边形与事件驱动

## Batch 25 — 数学与计算理论（CS2023 MSF/AL） — status: done
- x81_discrete_math | 数学基础 | 离散数学：集合、逻辑、数论与图论
- x82_computation_theory | 计算理论 | 计算理论：自动机、可计算性与 NP 完全
- x83_probability | 数学基础 | 概率统计与信息论：贝叶斯、假设检验与熵

## Batch 26 — AI 前沿与人机交互 — status: done
- x84_hci | 人机交互 | 人机交互与可用性设计（CS2023 HCI）
- x85_knowledge_graph | 人工智能 | 知识图谱：本体建模与图谱构建
- x86_reinforcement | 人工智能 | 强化学习入门：MDP、Q-Learning 与策略梯度

## Batch 27 — 扩展方向补齐 — status: pending
- x87_cloud_native | 分布式与并行 | 云原生基础：服务网格与可观测性
- x88_func_programming | 编程语言 | 函数式编程入门：Haskell 思维与 Monad
- x89_digital_logic | 计算机组成 | 数字逻辑设计：门电路、组合与时序逻辑

## 完成判据
Batch 2-27 全部 `done` 且 build 脚本输出 ≥203 篇教程 → 任务结束（CronPauseSelf）。

### 细化写作新标准（Batch 13 起生效）
正文 250-400 行；每个知识点独立小节：定义 → 语法逐项表格 → 边界行为与陷阱 → 可运行示例 → 与相邻知识点的对比。深度要求：讲透"为什么这样设计"，不止"怎么用"。
