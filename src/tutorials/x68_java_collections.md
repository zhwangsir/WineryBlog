---
title: Java 集合框架源码剖析
category: 编程语言
order: 18
tags: [Java, 集合, HashMap, ArrayList]
summary: ArrayList 扩容、HashMap 数组+链表+红黑树、ConcurrentHashMap 并发设计——面试高频的源码真相。
---

## 1. 集合框架全景图

```
Collection（单值）
├── List（有序可重复）: ArrayList / LinkedList / Vector
├── Set（不可重复）:   HashSet / LinkedHashSet / TreeSet
└── Queue（队列）:     ArrayDeque / PriorityQueue
Map（键值对，单独的接口体系）: HashMap / LinkedHashMap / TreeMap / ConcurrentHashMap
```

选型一句话：**随机访问多选 ArrayList，键值查选 HashMap，要排序选 TreeMap，并发写选 ConcurrentHashMap**。本文深挖三大核心：ArrayList、HashMap、ConcurrentHashMap。

## 2. ArrayList：数组 + 扩容策略

```java
public class ArrayList<E> extends AbstractList<E> {
    private transient Object[] elementData;   // 底层数组
    private int size;                         // 实际元素数（≠ 数组容量）
}
```

**add 流程**：先确保容量（`ensureCapacityInternal`）→ 数组末尾赋值 → size+1。O(1)。

**扩容机制**：当前容量不够时，**新容量 = 旧容量 × 1.5**（`oldCapacity + (oldCapacity >> 1)`），Arrays.copyOf 整体复制：

```java
// JDK 源码（节选）
private void grow(int minCapacity) {
    int oldCapacity = elementData.length;
    int newCapacity = oldCapacity + (oldCapacity >> 1);   // 1.5 倍
    elementData = Arrays.copyOf(elementData, newCapacity);
}
```

**为什么是 1.5 而不是 2**：2 倍会让增长曲线更陡，且 1.5 倍在新旧容量间留出复用空间（ArrayList 扩容后旧数组可能被后续小容量请求复用——内存友好的折中）。

**指定下标 add(i, e)** 是 O(n)（System.arraycopy 挪动后半段）——频繁中间插入选 LinkedList？不，见 §5 的反转。

## 3. ArrayList 陷阱速查

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| ConcurrentModificationException | 迭代中 remove 触发 modifiable 检查 | Iterator.remove() 或 removeIf |
| subList 后原列表改动报错 | subList 是视图不是副本 | 拷贝后再操作 |
| Arrays.asList 加元素报错 | 返回定长视图 | new ArrayList<>(Arrays.asList(...)) |
| 大量 add 触发多次扩容 | 未预估容量 | new ArrayList<>(expectedSize) |
| sort 后下标错乱 | sort 是原地变异 | 留意共享引用 |

**removeIf** 是删除的标准答案（它内部用位运算标记 + 一次压缩，比循环 remove 的 O(n²) 快一个数量级）。

## 4. HashMap：数组 + 链表 + 红黑树

JDK 8 后的桶结构：数组 + 链表，链长 ≥8 且数组容量 ≥64 时链表转**红黑树**（查找 O(n) → O(log n)）；树节点减到 6 退化回链表。

### put 的完整流程

```
1. hash(key) = (h = key.hashCode()) ^ (h >>> 16)    高 16 位异或扰动
2. index = hash & (n - 1)                            n 是 2 的幂 → 等价取模
3. 桶空 → 新节点直接放
4. 桶非空：
   key 相等（hash 相等且 equals）→ 覆盖 value
   是树节点 → 红黑树插入
   否则链表尾插 → 长度达 8 → 树化
5. ++size > threshold（容量 × 负载因子 0.75）→ resize 扩容翻倍
```

**为什么容量是 2 的幂**：`hash & (n-1)` 位运算替代 `%` 取模（CPU 快一个数量级），且 hash 扰动后低位分布均匀。

**为什么 (h >>> 16) 扰动**：只用低位做下标时，高位差异全部丢失——高位异或到低位，让 hashCode 高位也参与桶分配，减少碰撞。

### resize 与 JDK 7 的死亡循环

扩容时每个节点**要么留在原位，要么挪到"原下标 + 旧容量"**（判定依据：hash 新增的那一位是 0 还是 1）——不需要重新计算 hash。

**JDK 7 的著名事故**：头插法 + 并发扩容导致链表成环 → get 死循环 CPU 100%。JDK 8 改尾插修复了成环，但 **HashMap 依然线程不安全**（数据覆盖/丢失）——并发场景唯一正解是 ConcurrentHashMap。

## 5. equals 与 hashCode 的契约

```java
// 契约：equals 相等 ⇒ hashCode 必须相等；hashCode 相等 ⇒ equals 可以不等
```

违反契约的现场：

```java
class User {
    String name;
    // 只重写 equals 不重写 hashCode
}
map.put(new User("bob"), data);       // 存入桶 3
map.get(new User("bob"));             // 新对象 hashCode 不同 → 查到别的桶 → null！
```

**修法**：重写 equals 必同时重写 hashCode（IDE 一键生成）；Objects.hash(...) 一行搞定。**作为 key 的类必须不可变**——key 放进去后改字段，hash 变了就再也取不出来。

## 6. ConcurrentHashMap：并发安全的正确姿势

JDK 7：分段锁（Segment，默认 16 段）。**JDK 8 起放弃分段**，改为 CAS + synchronized 锁单个桶头节点：

```
put 流程：
1. 桶为空 → CAS 放入新节点（无锁）
2. 桶头是 ForwardingNode（正在扩容）→ 协助迁移（helping）
3. 否则 synchronized 锁桶头 → 链表/树插入
4. size 用 CounterCell 数组分散计数（避免单点竞争）
```

锁粒度从"段"细化到"桶"——并发度等于桶数量，远超 16。

**为什么拒绝 null**：`get(key)` 返回 null 时无法区分"键不存在"还是"值就是 null"——并发环境下无法用 containsKey 补判（中间可能被改）。这是刻意设计。

## 7. HashMap vs TreeMap vs ConcurrentHashMap 选型

| | HashMap | TreeMap | ConcurrentHashMap |
| --- | --- | --- | --- |
| 底层 | 数组+链表+红黑树 | 红黑树 | CAS+synchronized |
| 有序 | 无 | 按 key 排序（range 查询） | 无 |
| null key/value | 允许一个 null key | 禁止 | 全禁止 |
| 并发 | 不安全 | 不安全 | 安全 |
| 复杂度 | O(1) 均摊 | O(log n) | O(1) 均摊 |

## 8. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| get 返回 null 但 key 存在 | equals/hashCode 契约破坏 | 两者成对重写；key 不可变 |
| 遍历时 remove 抛异常 | fail-fast（modCount 检查） | iterator.remove / removeIf / CopyOnWriteArrayList |
| 数字 key 与 Long key 互查失败 | equals 类型不匹配 | 统一 key 类型 |
| collections.synchronizedMap 性能差 | 全表一把锁 | 换 ConcurrentHashMap |
| 树化后链表遍历行为变化 | 树化是内部优化 | 不要依赖桶内顺序 |
| asList 返回的列表不可改 | 视图对象 | new ArrayList<>(asList(...)) |

## 9. 自测五题

1. HashMap 扰动函数解决什么问题？
2. 树化的两个阈值分别是什么？
3. JDK 7 HashMap 并发死循环的机制？
4. ConcurrentHashMap 为什么不允许 null？
5. ArrayList 扩容为什么是 1.5 倍？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《Java 核心进阶：集合框架与并发编程入门》《Java 数组与字符串》《JVM 内存模型与垃圾回收》（对象分配与 GC 的底层）
- 站内参考资料：《Java 官方教程》（本地镜像 /post/ref-docs-oracle-com-javase-tutorial）、《Oracle String 文档》（本地镜像 /post/ref-docs-oracle-com-javase-8-docs-api-java-lang-string-html）
- 《Effective Java（第 3 版）》条目 11（hashCode）与条目 74——集合使用的规范
