---
title: MySQL 索引与查询优化实战
category: 数据库
order: 5
tags: [MySQL, 索引, 查询优化, EXPLAIN]
summary: B+ 树为什么快、最左前缀与覆盖索引、EXPLAIN 全字段解读——让慢查询从 3 秒到 30 毫秒。
---

## 1. 索引为什么是 B+ 树

InnoDB 索引的数据结构是 **B+ 树**，它是三种方案的优胜者：

| 结构 | 为什么不行/行 |
| --- | --- |
| 哈希表 | 等值快，但**不支持范围查询**（WHERE age > 20） |
| 二叉搜索树 | 100 万数据树高 20 层 = 20 次磁盘 IO，太慢 |
| B+ 树 | **矮胖**：单节点存几十上百个 key，千万行数据树高只有 3-4 层 |

**3-4 层 = 3-4 次磁盘 IO**，且上层节点常驻内存。这是所有 OLTP 数据库索引设计的核心权衡。

两种索引形态：
- **聚簇索引**（主键）：叶子节点直接存整行数据——表本身就是这棵树
- **二级索引**（普通索引）：叶子存主键值 → 查完还要**回表**（拿主键去聚簇索引再查一次）

## 2. 最左前缀：联合索引的宪法

```sql
CREATE INDEX idx_user_date ON orders (user_id, created_at, status);
```

| 查询条件 | 能否命中 |
| --- | --- |
| `user_id = 1` | ✓ 全用 |
| `user_id = 1 AND created_at > ?` | ✓ 用两列 |
| `created_at > ?` | ✗ 缺最左列，全表扫 |
| `user_id = 1 AND status = ?` | 半命中（只 user_id，跳列断链） |
| `user_id = 1 ORDER BY created_at` | ✓ 排序也走索引（免 filesort） |

设计口诀：**等值列在前，范围列在后，排序列放范围前**。

## 3. 覆盖索引：免回表的提速魔法

```sql
-- 查询列全在索引里 → 不回表（Extra: Using index）
SELECT user_id, created_at FROM orders WHERE user_id = 1;

-- SELECT * 必须回表，除非表很窄，别写 SELECT *
```

常见优化：把高频查询的最后加一列进联合索引，让查询完全被索引覆盖。

## 4. EXPLAIN：慢查询的诊断书

任何优化前先跑 `EXPLAIN SELECT ...`，看五个字段：

| 字段 | 好值 | 坏值 |
| --- | --- | --- |
| type | const > eq_ref > ref > **range** > index | **ALL**（全表扫，必须优化） |
| key | 实际命中的索引名 | NULL |
| rows | 预估扫描行数（越少越好） | 接近总行数 |
| Extra | Using index（覆盖） | Using filesort / Using temporary |

实例：一条 3 秒的慢查询优化实录

```sql
-- 优化前：type=ALL, rows=120万
SELECT * FROM orders WHERE user_name = 'bob' AND created_at > '2026-01-01';

-- 病因：user_name 没索引
CREATE INDEX idx_name_date ON orders (user_name, created_at);

-- 优化后：type=range, rows=320, 30ms
-- 再进一步：SELECT * 改成只取需要的列 → Extra 出现 Using index
```

## 5. 索引失效的六大现场

```sql
-- 1. 对索引列做函数/运算
WHERE YEAR(created_at) = 2026        ✗
WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'   ✓

-- 2. 隐式类型转换（user_phone 是 varchar）
WHERE user_phone = 13800138000       ✗（数字与字符串比，转全表）
WHERE user_phone = '13800138000'     ✓

-- 3. 前导模糊
WHERE name LIKE '%bob'               ✗
WHERE name LIKE 'bob%'               ✓

-- 4. OR 两侧有未索引列
WHERE indexed = 1 OR unindexed = 2   ✗（改 UNION 或都建索引）

-- 5. NOT IN / != （选择性差时优化器直接放弃）
-- 6. 数据量太小，优化器认为全表扫更快（别拿 100 行的表练索引）
```

## 6. 分页深翻页优化

```sql
-- LIMIT 1000000, 20：先取前 1000020 行再丢弃 → 越翻越慢
SELECT * FROM orders ORDER BY id LIMIT 1000000, 20;    ✗

-- 游标分页：记住上一页最后一个 id
SELECT * FROM orders WHERE id > 1000000 ORDER BY id LIMIT 20;   ✓ 恒定速度
```

## 7. 其他高频优化

- **COUNT(\*) 慢**：大表统计走近似值（`EXPLAIN` rows）或计数表/Redis
- **JOIN 小表驱动大表**：`STRAIGHT_JOIN` 或调整 SQL 顺序，被驱动表的连接列必须有索引
- **长字段**：`CREATE INDEX idx ON t (url(64))` 前缀索引，或存 hash 列
- **写多读少的表少建索引**：每个索引都是写放大

## 延伸阅读

- 站内相关：《事务与隔离级别》《数据库系统导论》《SQL 快速入门》
- 《高性能 MySQL（第 4 版）》——必读
- 阿里巴巴《Java 开发手册》MySQL 索引规约
