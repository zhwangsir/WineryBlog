---
title: Redis 高可用：哨兵与集群
category: 数据库
order: 6
tags: [Redis, 高可用, 哨兵, Cluster]
summary: 主从复制原理、哨兵自动故障转移、Cluster 分片——缓存服务不宕机的完整方案。
---

## 1. 单点 Redis 的三宗罪

单机 Redis 的问题：**宕机服务全停**（可用性）、**内存上限就是数据上限**（容量）、**单核吃满一个键**（性能）。解法按演进来：

```
主从复制（读写分离+冗余） → 哨兵（自动故障转移） → Cluster（数据分片）
```

## 2. 主从复制：数据冗余的基石

```
master ──写──┐
   │ 命令传播（异步）
   ├──→ replica1 ──读──┐
   └──→ replica2 ──读──┘
```

- 首次同步：从库发 `PSYNC` → 主库 bgsave 生成 RDB 全量传给从库 → 再补发缓冲区增量
- 日常同步：主库写命令异步传播给从库

**关键认知：复制是异步的**——主库写成功不代表从库已同步。主库宕机时最后几条命令可能丢失。写读分离方案要接受"从库读到旧数据"（最终一致）。

```bash
# 最小实验：一个 master + 两个 replica
redis-server --port 6379
redis-server --port 6380 --replicaof 127.0.0.1 6379
redis-server --port 6381 --replicaof 127.0.0.1 6379
# 6379 写入，6380/6381 能读到
```

## 3. 哨兵（Sentinel）：自动换主

主库半夜宕机怎么办？总不能叫运维爬起来 `replicaof no one`。**哨兵集群**（至少 3 个，奇数）盯住主库：

```
1. 每秒 ping 主库 → 某哨兵发现超时 = 主观下线（SDOWN）
2. 询问其他哨兵 → 多数派同意 = 客观下线（ODOWN）
3. 选举一个哨兵 Leader 执行故障转移：
   a. 从从库里选数据最全/优先级高的提升为新主（replicaof no one）
   b. 其余从库改挂新主（replicaof 新主）
   c. 通知客户端新地址
```

为什么哨兵要 3 个起？**故障转移需要多数派投票**（2 个的话挂 1 个就凑不齐多数，会脑裂僵持）。

客户端接入用哨兵协议而非直连：

```python
from redis.sentinel import Sentinel
sentinel = Sentinel([('s1', 26379), ('s2', 26379), ('s3', 26379)])
master = sentinel.master_for('mymaster', socket_timeout=0.5)   # 自动发现并跟随换主
master.set('k', 'v')
```

## 4. Cluster：16384 个槽的分片世界

数据超过单机内存 → **Cluster 模式**把数据切到多台：

- 全槽空间 16384 个，每个节点负责一段：`key → CRC16(key) mod 16384 → 槽 → 节点`
- 客户端直连任意节点，key 不在本节点会返回 `MOVED` 重定向（智能客户端本地缓存槽位表，免重定向）
- 每个分片内部仍是主从（主挂了它的从顶上）——**高可用 + 水平扩展二合一**

```bash
# 6 节点集群（3 主 3 从）
redis-cli --cluster create 127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 \
  127.0.0.1:7004 127.0.0.1:7005 127.0.0.1:7006 --cluster-replicas 1
```

**Cluster 的两大约束**：
1. **多键操作必须同槽**：`MGET k1 k2` 跨槽直接报错。解法：**hash tag**——`{user:1}.profile` 与 `{user:1}.orders` 大括号里的部分参与计算，强制同槽
2. 不支持跨槽事务/Lua——需要多键事务的设计先想想能不能合并成一个 key

## 5. 一致性小抄：为什么可能丢数据

哨兵切换瞬间的窗口：主库收到写命令还没传播就宕机 → 这几条写丢失。缓解：
- `min-replicas-to-write 1` + `min-replicas-max-lag 10`：从库断连超时主库拒绝写入
- 真正要求强一致的写不进 Redis（Redis 的定位就是可容忍少量丢失的缓存/队列）

## 6. 选型决策树

```
数据 < 25GB 且能接受分钟级不可用？
  ├─ 只想读写分离/读扩容 → 主从（手动切换）
  └─ 想自动故障转移 → 哨兵（大多数公司的标准答案）
数据 > 25GB 或写入超过单机
  → Cluster（记得规划 hash tag）
```

## 7. 实验清单（亲手搭一遍）

- [ ] 一主两从，写主读从
- [ ] kill 主库 → 观察哨兵日志的 SDOWN/ODOWN/failover 全过程
- [ ] Cluster 6 节点建群 → `cluster info` 看槽分布
- [ ] 验证跨槽 MGET 报错 → 用 hash tag 解决
- [ ] 用 `-race` 式的压测（redis-benchmark）对比单机与集群吞吐

## 延伸阅读

- 站内相关：《Redis 实战：缓存三大问题与数据结构选型》《Redis 入门》《Linux 服务器运维清单：Nginx、防火墙与日常巡检》
- 《Redis 设计与实现》——复制与哨兵内部机制
- Redis 官网 Replication/Sentinel/Cluster 三篇文档
