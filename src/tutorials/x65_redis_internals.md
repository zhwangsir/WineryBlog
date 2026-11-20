---
title: Redis 数据结构底层实现
category: 数据库
order: 7
tags: [Redis, SDS, 跳表, 底层实现]
summary: SDS、dict 渐进式 rehash、listpack、skiplist——懂了底层结构，每条 O(1)/O(logN) 命令都有依据。
---

## 1. 为什么懂底层结构很重要

Redis 对每条命令的复杂度承诺，全部来自其**精心设计的内存结构**。知道底层，才能回答：

- 为什么 `STRLEN` 是 O(1) 而 C 字符串 strlen 是 O(n)？
- 为什么 ZSet 能同时 O(logN) 排序 + O(1) 查分？
- 为什么 10 万级的 Hash 建议改用编码、小 Hash 反而更省内存？

类型-编码映射（`OBJECT ENCODING key` 可查）：

| 类型 | 小数据编码 | 大数据编码 |
| --- | --- | --- |
| String | int / embstr | raw（SDS） |
| List | listpack | quicklist（链表+listpack 节点） |
| Hash | listpack | dict（双哈希表） |
| Set | intset（全整数时） | dict |
| ZSet | listpack | skiplist + dict |

Redis 7 起 ziplist 全面替换为 **listpack**（解决了级联更新问题）。

## 2. SDS：简单动态字符串

C 字符串的三大缺陷及 SDS 的对策：

| C 字符串问题 | SDS 方案 | 收益 |
| --- | --- | --- |
| strlen 要遍历 O(n) | 头部存 len 字段 | O(1) 取长度 |
| 拼接可能缓冲区溢出 | 记录 alloc 总容量 | 写前检查，自动扩容 |
| 频繁修改频繁 realloc | **空间预分配**（翻倍）+ **惰性释放**（缩短不还） | 减少内存重分配次数 |

```c
struct sdshdr {
    int len;        // 已用长度 → O(1) strlen
    int alloc;      // 分配总长度
    char buf[];     // 字节数组
};
```

**空间预分配的倍数策略**：修改后 < 1MB 预分配翻倍；≥ 1MB 每次多分 1MB——既减少重分配又防止翻倍失控。

**embstr 优化**：≤44 字节的短字符串把 RedisObject 头和 SDS 分配在**同一块连续内存**（一次分配，缓存友好）；超长转 raw（两次分配）。

## 3. dict：渐进式 rehash 的教科书

Redis 的键空间（所有 key）和一个 Hash 类型都靠 dict——**两个哈希表**的结构：

```c
typedef struct dict {
    dictht ht[2];        // ht[0] 常用，ht[1] 仅 rehash 期间使用
    int rehashidx;       // -1 = 未在 rehash；≥0 = 正在迁移的桶下标
} dict;
```

### 渐进式 rehash：为什么不能一次性搬

百万级 key 的扩容若一次搬完，主线程阻塞数百毫秒——缓存雪崩级事故。Redis 的做法：

1. 扩容时分配新表 ht[1]，`rehashidx = 0`，此后**两个表同时生效**（查找先 ht[0] 再 ht[1]；写入只进 ht[1]）
2. 每次字典操作顺带**迁移 ht[0] 的一个桶**（rehashidx++）；空闲时也有定时任务批量迁
3. 迁完释放 ht[0]，ht[1] 转正为 ht[0]

**推论**：rehash 期间的内存占用是平时的约 2 倍——大容量规划要留余量。这也是"线上 Redis 突然内存翻倍"的经典排查项。

## 4. listpack：紧凑列表

小体量 List/Hash/ZSet 用 listpack（连续内存块，元素紧挨着存）：

```
[totalBytes][numElem][entry][entry]...[end]
entry = [encoding][data][backlen]
```

优点：内存零碎片、CPU 缓存友好、比每个元素一个对象省 10 倍以上内存。**阈值**（可配）：

- Hash：元素 ≤128 且值 ≤64 字节 → listpack
- ZSet：元素 ≤128 且值 ≤64 字节 → listpack

超过阈值转 dict/skiplist——**"小数据省内存、大数据保性能"的编码自动切换**是 Redis 内存优化的核心抓手。

## 5. skiplist：跳表，ZSet 的排序引擎

跳表 = 多层有序链表，每个节点以 1/2 概率晋升到上一层，形成"高速公路"：

```
Level 3:  head ──────────────────────→ 50 ─────────→ nil
Level 2:  head ────────→ 30 ──────────→ 50 ─────────→ nil
Level 1:  head → 10 → 30 → 40 → 50 → 70 → nil
```

查找 40：L3 直接跳到 50（比 40 大，回退）→ L2 到 30 → L1 步进到 40。期望复杂度 **O(log n)**——与平衡树同阶。

**为什么 ZSet 用跳表不用红黑树**（antirez 的经典回答）：
1. 实现简单（红黑树插入删除的旋转逻辑复杂数倍）
2. **范围查询更自然**：找到起点后沿 L1 链表顺序遍历即可；红黑树需要中序遍历
3. 概率平衡，无需旋转；并发语义更简单

ZSet 同时维护 dict（member → score，O(1) 查分）和 skiplist（按 score 排序）——**空间换双维度查询**。

## 6. quicklist：List 的混合体

大 List 不是朴素链表——是 **quicklist：双向链表，每个节点是一个 listpack**：

```
quicklist → [listpack节点1] ⇄ [listpack节点2] ⇄ [listpack节点3]
              8 个元素          8 个元素          8 个元素
```

折中设计：纯链表内存碎片多、指针开销大；纯 listpack 大列表插入要整体挪动。quicklist 兼得两端（每个 listpack 默认 -2 表示 8KB 阈值，满了分裂出新节点）。

## 7. intset 与 Set 的小数据优化

全整数的 Set 用 **intset**（有序整数数组）：

- 二分查找 O(logN)，内存极省
- 插入非整数或超过上限（默认 512）→ 转 dict

这个"小转大"模式贯穿所有类型——**Set 存了 1 个非整数就永久退出 intset**（不会转回来），批量灌数据时注意先纯整数后其他。

## 8. 内存优化实战（基于底层结构）

| 手段 | 依据 |
| --- | --- |
| 短字符串/小对象靠拢编码阈值 | listpack/intset/embstr 比大编码省数倍 |
| Hash 拆大 Key 为多个小 Hash | dict 编码内存高；小 hash 走 listpack |
| 控制 key 长度（业务前缀可读即可） | SDS 头部固定开销 + key 本身占内存 |
| `OBJECT ENCODING key` 巡检 | 直接看编码是否符合预期 |
| 避免值只增不减的大集合 | 底层结构只扩不缩（缩要主动重建） |

## 9. 自测五题

1. SDS 的 len 字段带来哪三个收益？
2. 渐进式 rehash 期间查找和写入分别怎么走？
3. skiplist 相比红黑树对 ZSet 的两个优势？
4. Hash 从 listpack 转 dict 的默认阈值？
5. 为什么 ZSet 要同时维护 dict 和 skiplist？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《Redis 实战：缓存三大问题与数据结构选型》《Redis 高可用：哨兵与集群》《Redis 入门》
- 站内参考资料：《Redis 官方数据类型教程》（本地镜像 /post/ref-redis-doc）
- 《Redis 设计与实现》（黄健宏）——本文所有结构的一手详解
