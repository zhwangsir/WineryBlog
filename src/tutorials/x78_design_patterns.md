---
title: 设计模式：场景化精选与权衡
category: 软件工程
order: 1
tags: [设计模式, 软件工程, 架构, 代码质量]
summary: 不背 23 式目录——从真实场景出发讲清高价值模式的用法与代价，以及"不用模式"的时机。
---

## 1. 设计模式的正确定位

设计模式（GoF 23 式）是**前人面对反复出现的设计问题时，沉淀下来的命名解决方案与权衡记录**。两个价值：**团队共同语言**（说"这里用策略"比描述十分钟高效）与**设计权衡的数据库**。

一个反共识的提醒：**模式不是目标**。GoF 原书副标题是"可复用面向对象软件的基础"——它记录的是"当时语言能力下不得已的最佳实践"。现代语言（高阶函数、闭包、泛型）让一些模式消失了：策略模式在 JS 里就是一个函数参数，Visitor 的部分价值被模式匹配取代。**先理解问题，再看模式是否值得其复杂度代价**。

## 2. 创建型精选：对象的诞生控制

### 工厂方法 vs 抽象工厂

```java
// 工厂方法：一个产品等级的创建点
interface Payment { void pay(int cents); }
class AlipayPayment implements Payment { ... }
class WechatPayment implements Payment { ... }

interface PaymentFactory { Payment create(); }
class AlipayFactory implements PaymentFactory { public Payment create() { return new AlipayPayment(); } }
```

**场景**：新增支付渠道时只加一对类，不改动使用方（开闭原则）。**抽象工厂**适合"一族相关产品"（UI 工厂同时产 Button/Checkbox——换主题整体换）。**权衡**：工厂层级翻倍，简单场景用静态工厂方法（`Payment.of("alipay")`）足够——不要为两个实现建整个工厂体系。

### 单例：方便与代价并存

```java
class Config {
    private static final Config INSTANCE = new Config();   // 饿汉（类加载时创建，线程安全）
    private Config() {}
    public static Config getInstance() { return INSTANCE; }
}
```

**代价**：全局可变状态（测试互相污染、隐藏依赖）、多线程初始化需处理（饿汉天然安全/懒汉要 volatile+锁或枚举）。**现代替代**：依赖注入容器管理单例生命周期——可测试性大幅提升。Java 枚举单例是防反射/序列化攻击的最强形态。

### 建造者：多参数对象的优雅构造

```java
HttpRequest req = HttpRequest.builder()
    .url("https://api.example.com")
    .method("POST")
    .header("Content-Type", "application/json")
    .body(payload)
    .build();
```

**场景判据**：构造参数 ≥4 且多个可选 → 建造者（对比 telescoping constructor 重载地狱）。链式调用自文档化——每个 setter 名就是意图。

## 3. 结构型精选：组合的艺术

| 模式 | 解决什么 | 现代备注 |
| --- | --- | --- |
| **适配器** | 不兼容接口的桥接（胶水旧系统/三方库） | 最常用且低风险——隔离三方库变更 |
| **装饰器** | 运行时动态叠加职责 | Java IO 流的经典；对比继承爆炸（N 个特性 = 2^N 子类） |
| **代理** | 控制访问：延迟加载/远程/权限 | Spring AOP 的底层（动态代理） |
| **外观（Facade）** | 复杂子系统简化门面 | 最容易被低估的模式——给烂系统包一层干净接口 |

**适配器的实战价值**：第三方 SDK 直用 = 代码里到处是它的类型与调用风格——**包一层适配器后，换 SDK 只改一个文件**。防腐层（Anti-Corruption Layer，DDD 术语）就是这个思想在架构层的放大。

## 4. 行为型精选：职责与解耦

### 策略：消灭 if-else 火车

```java
// ✗ 每新增一种折扣改一处 switch（违反开闭）
double price(Order o) {
    switch (o.type()) {
        case VIP: return o.amount() * 0.7;
        case NEW: return o.amount() - 10;
        ...
    }
}

// ✓ 策略：新增折扣 = 新增一个实现
interface Discount { double apply(Order o); }
Map<String, Discount> discounts = Map.of("vip", new VipDiscount(), ...);
double price = discounts.get(o.type()).apply(o);
```

**现代简化**：Java 8+ 用 `Map<String, Function<Order, Double>>` 存 Lambda——不需要类爆炸。**权衡**：策略少（≤3）且稳定时，switch 更直白——**不要为消灭 if-else 而 if-else 工厂化**（过度设计重灾区）。

### 观察者：事件驱动的地基

```java
subject.addListener(evt -> { ... });   // 多方监听同一事件，互不感知
```

发布/订阅解耦"事件发生"与"事件响应"——GUI、消息队列、响应式框架的地基。**代价**：调用链隐式化（谁在监听？）、同步监听的异常会波及发布者——用异步事件总线（MQ）或事件循环规避。

### 模板方法与策略的辨析

模板方法用**继承**固定骨架、子类填步骤；策略用**组合**替换整个算法。选择：骨架稳定多变细节→模板方法；算法可整体替换→策略（组合优于继承）。

## 5. 状态机：被低估的行为模式

```java
enum State { IDLE, RUNNING, PAUSED }
// 事件驱动的状态转移表——替代满地的 boolean 标志位
```

订单状态（待支付/已支付/已发货/已完成/已取消）、游戏 AI（巡逻/追击/攻击，见站内《游戏开发概论》）、审批流——**凡是"对象行为随内部状态改变"的场景**，显式状态机消灭不可预测的标志位组合。框架化：Spring Statemachine、XState（前端）。

## 6. 模式滥用的代价（反模式警示）

| 症状 | 病因 | 后果 |
| --- | --- | --- |
| AbstractFactoryFactory 之类的套娃命名 | 为模式而模式 | 认知成本爆炸 |
| 100% 单例覆盖率 | 全局可变状态成瘾 | 测试无法隔离 |
| 每个类都有接口（只有一个实现） | "将来可能换实现"的想象 | 大量无意义间接层 |
| 为 3 个 if-else 建策略体系 | 模式洁癖 | 复杂度反噬 |

**判断标准**：引入模式前问"**现在**解决什么具体问题？没有它最坏会怎样？"——答案是"没有具体问题"就不要引入。重构的时机是"第二个、第三个重复出现时"（规则三法则）。

## 7. 自测五题

1. 工厂方法与抽象工厂的场景差异？
2. functools.wraps 与装饰器的关系对应哪个模式？
3. 策略模式的现代语言简化形式？
4. 适配器与外观（Facade）的差异？
5. 引入模式的判断标准？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《软件架构风格：分层、六边形与事件驱动》（架构层的模式）、《重构：代码坏味道与安全手法》《Python 装饰器与生成器》（装饰器模式的 Python 实现）
- 站内参考资料：《Refactoring Guru 设计模式》（本轮抓取 /post/ref-refactoring-guru——图解 23 式的最佳在线资源）
- 《设计模式：可复用面向对象软件的基础》（GoF 原典）、《Head First 设计模式》（入门友好）
