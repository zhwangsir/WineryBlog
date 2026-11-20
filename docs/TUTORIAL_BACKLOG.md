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

## 完成判据
Batch 2-12 全部 `done` 且 build 脚本输出 167 篇教程 → 任务结束（CronPauseSelf）。
