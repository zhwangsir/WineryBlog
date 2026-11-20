---
title: Redis 实战：缓存三大问题与数据结构选型
category: 数据库
order: 3
tags: [Redis, 缓存, 高并发, 数据结构]
summary: 五大基础数据结构的业务映射、缓存穿透/击穿/雪崩的成因与对策、分布式锁与过期策略。
---

## 1. Redis 在系统里的位置

Redis = 基于内存的键值数据库，单线程事件循环（命令执行无并发竞争），读写 10 万+ QPS。三大典型用途：

1. **缓存**：挡在数据库前面，热点数据毫秒级返回
2. **分布式协调**：锁、限流、排行榜
3. **数据结构服务**：计数、队列、签到、去重

## 2. 数据结构选型（背下这张表）

| 结构 | 业务映射 | 例 |
| --- | --- | --- |
| String | 缓存、计数器、分布式锁 | `SET post:123:title "标题" EX 3600` |
| Hash | 对象缓存 | `HSET user:1 name a age 20` |
| List | 简单队列、最新列表 | `LPUSH + BRPOP`（阻塞消费） |
| Set | 去重、共同关注 | `SADD viewed:1 post:9`；`SINTER` 算交集 |
| ZSet | 排行榜、延迟队列 | `ZADD rank 98.5 player:1`；`ZREVRANGE` 取前10 |

## 3. 缓存三大问题（面试与事故高发区）

### 穿透：查不存在的数据，每次都打到 DB
```
请求 id=-1（恶意）→ 缓存无 → DB 无 → 不回写缓存 → 每次都穿透
```
对策：
- **空值缓存**：DB 查无也写 `SET id:-1 "" EX 60`（短 TTL）
- **布隆过滤器**：在缓存前加一层"可能存在"判断，不存在的直接拒绝

### 击穿：热点 key 过期瞬间，并发全部打到 DB
对策：
- **互斥重建**：拿到分布式锁的那 1 个请求查 DB 回写，其余等待
- **逻辑过期**：value 里带过期时间，发现逻辑过期后异步刷新，旧值先顶上

### 雪崩：大批 key 同时过期 / Redis 宕机
对策：
- TTL 加随机抖动：`EX 3600 + random(0, 300)`
- 多级缓存（本地 Caffeine + Redis）
- Redis 高可用（哨兵/集群）+ 熔断降级

## 4. 分布式锁的正确姿势

```bash
# 加锁：原子 SET NX（不存在才设置）+ 过期时间（防死锁）+ 唯一值（防误删）
SET lock:order:123 "uuid-a" NX EX 10
```

```python
import uuid, redis

r = redis.Redis()
def acquire(key, ttl=10):
    token = str(uuid.uuid4())
    if r.set(f"lock:{key}", token, nx=True, ex=ttl):
        return token
    return None

def release(key, token):
    # Lua 保证"判断+删除"原子性，避免删掉别人的锁
    lua = """
    if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
    end
    """
    r.eval(lua, 1, f"lock:{key}", token)
```

生产环境直接用 **Redisson（Java）/ redlock-py**：自动续期（看门狗）、可重入。

## 5. 过期与淘汰策略

- **主动过期**：key 过期后惰性删除（访问时）+ 定期随机抽检删除
- **内存满时**：`maxmemory-policy` 决定淘汰谁
  - `allkeys-lru`（最常用）：整库 LRU 淘汰
  - `volatile-lru`：只淘汰设置了 TTL 的
  - 缓存场景选 `allkeys-lru`；绝不能丢的数据（如购物车）别只存 Redis

## 6. 持久化：RDB 与 AOF

| 方式 | 原理 | 特点 |
| --- | --- | --- |
| RDB | 定时全量快照 | 恢复快，可能丢最后几分钟 |
| AOF | 每条写命令追加日志 | 丢数据少（每秒刷盘），文件大恢复慢 |

生产标配：**RDB + AOF 混合**（4.0+），重启先载 RDB 骨架再重放 AOF 增量。

## 7. 缓存一致性：先更新库还是先删缓存？

经典方案 **Cache Aside**：
```
读：先读缓存，未命中读 DB 并回写
写：先更新 DB，再删除缓存（不是更新缓存！）
```
删除而非更新：避免并发写覆盖、避免写后没人读的浪费。残余不一致窗口极小，要求再高则用延迟双删或订阅 binlog（Canal）异步刷新。

## 延伸阅读

- 站内相关：《Redis 入门》《事务与隔离级别》《MySQL 入门：从建库到查询》
- 《Redis 设计与实现》——数据结构内部实现
