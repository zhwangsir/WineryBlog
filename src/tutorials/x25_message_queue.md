---
title: 消息队列入门：RabbitMQ 与 Kafka
category: 后端开发
order: 7
tags: [消息队列, RabbitMQ, Kafka, 异步解耦]
summary: 为什么要消息队列、RabbitMQ 路由模型、Kafka 分区与消费组——异步解耦的两种世界观。
---

## 1. 没有消息队列的世界

订单服务下单后要发短信、加积分、更新推荐——同步串行调用：

```
下单(200ms) → 发短信(500ms) → 积分(100ms) → 推荐(300ms) = 1.1s 才返回
```

三宗罪：**慢**（用户等所有下游）、**脆**（短信服务挂了订单也失败）、**耦合**（加一个下游就要改订单代码）。

消息队列（MQ）把"发起"和"处理"解耦：

```
下单(200ms) → 投一条"order.created"消息 → 立即返回
                 ↓
   短信服务 / 积分服务 / 推荐服务 各自订阅，各自消费，挂了重启续上
```

三大价值：**异步**（主流程只做核心事）、**解耦**（生产者不关心消费者）、**削峰**（秒杀洪峰先进队列，后端按自己的节奏消费）。

## 2. RabbitMQ：交换机路由模型

AMQP 协议代表。核心概念：生产者 → **Exchange（交换机）** → 按规则路由 → Queue → 消费者。

四种交换机：

| 类型 | 路由规则 | 场景 |
| --- | --- | --- |
| Direct | routing key 精确匹配 | 点对点任务 |
| Topic | `*` 匹配一段、`#` 匹配多段（如 `order.*.created`） | 按主题订阅 |
| Fanout | 广播给所有绑定队列 | 配置刷新广播 |
| Headers | 按消息头匹配 | 少用 |

```javascript
// Node.js amqplib：Topic 交换机示例
const ch = await conn.createChannel();
await ch.assertExchange('events', 'topic', { durable: true });
await ch.assertQueue('sms_queue', { durable: true });
await ch.bindQueue('sms_queue', 'events', 'order.#');     // 订阅所有订单事件

ch.publish('events', 'order.created', Buffer.from(JSON.stringify(order)));
ch.consume('sms_queue', msg => {
  sendSms(JSON.parse(msg.content.toString()));
  ch.ack(msg);                                            // 处理完才确认
});
```

**可靠性三件套**：生产者 confirm（到达确认）、消息持久化（durable + persistent）、手动 ack（处理完再确认，消费者崩溃消息会重投）。注意 ack 语义：**at-least-once**，消费者要做幂等（比如用订单号去重）。

## 3. Kafka：日志流世界观

Kafka 不是"队列"而是**分布式提交日志**：消息按主题（Topic）追加到分区（Partition）日志里，消费者自己维护"读到哪"（offset），读过的消息不删除（保留期内可重读）。

```
Topic: orders
  Partition 0: [m0, m1, m4, m7...]   ← 每个分区内部严格有序
  Partition 1: [m2, m3, m5, m6...]
```

**消费组（Consumer Group）**：同组消费者分摊分区（一个分区同一时刻只被组内一个消费者处理）→ 天然水平扩展 + 负载均衡。不同组各自独立消费全量数据（一份订单流同时喂给实时大屏和风控）。

```bash
# 命令行体验完整流程
kafka-topics.sh --create --topic orders --partitions 3 --bootstrap-server localhost:9092
kafka-console-producer.sh --topic orders --bootstrap-server localhost:9092
kafka-console-consumer.sh --topic orders --group analytics --from-beginning
```

关键参数：`acks=all`（所有副本落盘才算成功）、`enable.idempotence=true`（生产端幂等，不重不丢）。

## 4. 怎么选

| 维度 | RabbitMQ | Kafka |
| --- | --- | --- |
| 心智 | 消息逐条处理，处理完即走 | 持久日志，流式重放 |
| 顺序 | 队列内有序 | 分区内有序（按 key 分区保序） |
| 吞吐 | 万级/秒 | 百万级/秒 |
| 延迟 | 微秒级，低延迟优先 | 毫秒级，吞吐优先 |
| 典型 | 任务分发、RPC、复杂路由 | 事件溯源、日志管道、流计算 |
| 重放 | 不支持（ack 即删） | 天然支持（重置 offset） |

经验法则：**业务任务分发选 RabbitMQ，事件流/大数据管道选 Kafka**。

## 5. 避坑清单

1. **消息丢失**：生产端没 confirm / 没持久化 / 自动 ack 后消费者崩溃——三端都要设防
2. **重复消费**：网络重试必然带来 at-least-once，消费逻辑必须幂等（唯一键去重表）
3. **顺序性**：多消费者并行会打乱顺序，需要顺序的消息按业务 key 发到同一分区/队列
4. **积压**：监控队列深度，积压 = 消费能力不足，扩消费者或批量消费

## 延伸阅读

- 站内相关：《Spring Boot 快速上手：从 Hello 到 CRUD》《FastAPI：用 Python 写现代后端接口》《HDFS 读写流程详解》
- 《Kafka 权威指南》
- RabbitMQ 官方教程（六种交换机演练）
