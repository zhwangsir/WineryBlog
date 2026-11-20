---
title: MongoDB 入门：文档模型与聚合查询
category: 数据库
order: 4
tags: [MongoDB, NoSQL, 聚合管道, 文档数据库]
summary: 文档模型与场景取舍、CRUD 与索引、聚合管道五阶段——最流行的文档数据库实战入门。
---

## 1. 什么时候选 MongoDB

MongoDB 存 **BSON 文档**（类 JSON），无固定表结构。先想清楚它擅长什么：

| 适合 | 不适合 |
| --- | --- |
| 字段多变的商品/内容（不同 SKU 属性不同） | 强事务多表联动（银行转账） |
| 一坨整体读写的聚合根（博客文章+评论） | 大量跨文档 JOIN（关系密集） |
| 快速迭代，schema 经常演进 | 复杂多维度报表 SQL |

一条博客文章在 MySQL 要拆 3 张表（文章/评论/标签），在 MongoDB 就是一个文档——**聚合根内嵌**是文档库的灵魂：

```json
{
  "_id": "post-1",
  "title": "MongoDB 入门",
  "tags": ["数据库", "NoSQL"],
  "comments": [
    { "user": "bob", "text": "写得真好", "at": "2026-01-01" }
  ],
  "author": { "name": "Winery", "level": 5 }
}
```

## 2. CRUD 快速上手

```javascript
import { MongoClient } from 'mongodb';
const db = client.db('blog');
const posts = db.collection('posts');

// 增
await posts.insertOne({ title: 'Hello', views: 0, tags: ['x'] });

// 查：条件运算符与 SQL 对应
//  $gt= >   $in= IN   $ne= !=   $and/$or
await posts.find({ views: { $gt: 100 }, tags: { $in: ['db'] } })
           .sort({ views: -1 })       // ORDER BY views DESC
           .limit(10)
           .toArray();

// 模糊搜索：/正则/ 相当于 LIKE
await posts.find({ title: /入门$/ }).toArray();

// 改：$set 只改字段；$inc 原子自增；$push 往数组追加
await posts.updateOne({ _id: 'post-1' }, { $inc: { views: 1 }, $push: { tags: 'hot' } });

// 删
await posts.deleteMany({ views: { $lt: 10 } });
```

数组元素精准更新用**位置操作符**：`$set: { "comments.0.likes": 3 }`。

## 3. 索引：没有它查询就是全表扫

```javascript
await posts.createIndex({ title: 1 });                  // 单字段升序
await posts.createIndex({ views: -1, date: -1 });       // 复合索引（最左前缀同 MySQL）
await posts.createIndex({ title: 'text' });             // 文本索引（$text 搜索）
await posts.createIndex({ location: '2dsphere' });      // 地理索引
await posts.explain('executionStats').find({ title: 'x' });  // 看是否 IXSCAN
```

唯一约束：`createIndex({ email: 1 }, { unique: true })`。TTL 索引自动过期删除（会话/日志）：`createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 })`。

## 4. 聚合管道：MongoDB 的"GROUP BY 超集"

聚合管道（Aggregation Pipeline）= 文档流经一系列阶段加工。五阶段记住一个例子就懂——**标签使用排行**：

```javascript
await posts.aggregate([
  { $unwind: '$tags' },                          // 1. 数组拆行：一条文档 3 个标签变 3 条
  { $group: {                                    // 2. 分组计数
      _id: '$tags',
      count: { $sum: 1 },
      avgViews: { $avg: '$views' }
  }},
  { $match: { count: { $gte: 5 } } },            // 3. 过滤（HAVING）
  { $sort: { count: -1 } },                      // 4. 排序
  { $limit: 10 },                                // 5. 截断
]).toArray();
```

对照 SQL：`$match`=WHERE、`$group`=GROUP BY、`$sort`=ORDER BY、`$unwind`=没有（文档库特有）、`$lookup`=JOIN。

**$lookup 跨集合关联**（少用但要知道）：

```javascript
{ $lookup: {
    from: 'users',            // 关联集合
    localField: 'authorId',   // 本集合字段
    foreignField: '_id',
    as: 'author'              // 结果数组
}},
{ $unwind: '$author' }        // 一对一拆开
```

## 5. 事务与一致性

MongoDB 4.0+ 支持**多文档事务**（副本集），用法和 SQL 一样：

```javascript
const session = client.startSession();
await session.withTransaction(async () => {
  await accounts.updateOne({ _id: 'a' }, { $inc: { balance: -100 } }, { session });
  await accounts.updateOne({ _id: 'b' }, { $inc: { balance: 100 } }, { session });
});
```

但能不用就不用——文档库的正道是**单文档原子性**（把强一致的数据设计进同一个文档）。

## 6. 原则总结

1. **按访问模式设计**：一起查的数据放一个文档（反范式），而不是按关系拆表
2. 文档上限 16MB，无限增长的数组（评论）拆成独立集合 + $lookup
3. 查询先行建索引，explain 确认 IXSCAN
4. 写入热点（自增 ID）避免——用 ObjectId 默认值

## 延伸阅读

- 站内相关：《SQL 快速入门》《数据库系统导论》《Redis 入门》
- 《MongoDB 实战（第 2 版）》
- MongoDB 官方 University 免费课程（M001）
