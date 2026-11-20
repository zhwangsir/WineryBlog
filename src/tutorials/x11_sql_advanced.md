---
title: 事务与隔离级别
category: 数据库/原理
order: 2
tags: [事务, ACID, 隔离级别, MVCC]
summary: ACID 四特性、隔离级别与并发问题、MVCC 原理——数据库事务全景。
---

## 1. 事务的 ACID

- **原子性（Atomicity）**：全成或全不做（undo log 回滚）
- **一致性（Consistency）**：约束不被破坏
- **隔离性（Isolation）**：并发事务互不干扰（锁 + MVCC）
- **持久性（Durability）**：提交后数据不丢（redo log + WAL）

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;    -- 或 ROLLBACK 撤销
```

## 2. 并发问题

| 问题 | 描述 | 示例 |
|------|------|------|
| 脏读 | 读到未提交的数据 | A 改了但未提交，B 读到了 |
| 不可重复读 | 同一行两次读取值不同 | A 读两次，B 中间改了 |
| 幻读 | 同条件两次查询行数不同 | A 查两次，B 中间插入了 |

## 3. 隔离级别

```sql
SET GLOBAL TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

| 级别 | 脏读 | 不可重复读 | 幻读 |
|------|------|------|------|
| READ UNCOMMITTED | 有 | 有 | 有 |
| READ COMMITTED | 无 | 有 | 有 |
| REPEATABLE READ（MySQL 默认）| 无 | 无 | InnoDB 基本避免 |
| SERIALIZABLE | 无 | 无 | 无 |

## 4. MVCC：多版本并发控制

InnoDB 每行有隐藏列：`trx_id`（最后修改的事务）+ `roll_pointer`（undo log 链）。

读操作不加锁，通过 Read View 判断版本可见性：
- REPEATABLE READ：整个事务期间使用同一个 Read View
- READ COMMITTED：每次 SELECT 生成新 Read View

这就是 InnoDB 能做到"读写不阻塞"的原因。

## 5. 锁机制

```sql
-- 行锁（InnoDB）：锁定索引记录
SELECT * FROM users WHERE id = 1 FOR UPDATE;   -- 排他锁
SELECT * FROM users WHERE id = 1 LOCK IN SHARE MODE;  -- 共享锁

-- 间隙锁（REPEATABLE READ）：锁住索引间隙，防幻读
-- 意向锁：表级锁，表示表内有行锁
```

死锁：两个事务互相等待对方持有的锁。InnoDB 自动检测并回滚代价小的事务。`SHOW ENGINE INNODB STATUS` 查看最近死锁。

## 6. 索引优化实战

```sql
-- B+ 树索引
CREATE INDEX idx_user_created ON orders(user_id, created_at);

-- 联合索引最左前缀
WHERE user_id = 1                    → 命中
WHERE user_id = 1 AND created_at > x → 命中
WHERE created_at > x                 → 不命中（缺最左列）

-- 覆盖索引：查询列全在索引中，不回表
SELECT user_id FROM orders WHERE user_id = 1;    -- 覆盖索引，不回表

-- EXPLAIN 分析
EXPLAIN SELECT * FROM orders WHERE user_id = 1;
-- type: ref（索引）/ ALL（全表扫 = 优化）
-- rows: 预估扫描行数
-- Extra: Using index（覆盖索引）/ Using filesort（需优化）
```

## 延伸阅读

- 站内相关：《数据库系统导论》《SQL 快速入门》《SQL 进阶：JOIN、聚合与索引》《Redis 入门》
- 《高性能 MySQL》——进阶必读
