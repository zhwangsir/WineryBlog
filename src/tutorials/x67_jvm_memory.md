---
title: JVM 内存模型与垃圾回收
category: 编程语言
order: 17
tags: [JVM, 垃圾回收, 内存模型, Java]
summary: 运行时数据区五大区域、对象分配与逃逸、分代回收与 G1/ZGC——OOM 与 GC 调优的原理地图。
---

## 1. 运行时数据区：JVM 的五大房间

JVM 启动后把内存划分为五个区域（《Java 虚拟机规范》定义）：

| 区域 | 存什么 | 线程私有？ | 会 OOM 吗 |
| --- | --- | --- | --- |
| 程序计数器 | 当前线程执行的字节码行号 | 私有 | 不会 |
| 虚拟机栈 | 栈帧（局部变量表、操作数栈） | 私有 | 会（StackOverflow / OOM） |
| 本地方法栈 | native 方法 | 私有 | 会 |
| **堆（Heap）** | **对象实例**，GC 主战场 | 共享 | 会（OOM: Java heap space） |
| **方法区** | 类信息、常量、静态变量 | 共享 | 会（OOM: Metaspace） |

**栈与堆的分工**是理解一切 Java 内存问题的前提：方法局部变量（引用）在栈上，`new` 出来的对象实体在堆上——栈帧销毁后对象依然活在堆里，直到没有引用可达。

```java
void demo() {
    User u = new User();   // u（引用）在栈帧；new User() 对象在堆
}                          // 方法返回：栈帧弹出；堆上对象等 GC 回收
```

`StackOverflowError` 的现场：无限递归让栈帧压爆（默认栈 512KB-1MB，`-Xss` 可调）。`java.lang.OutOfMemoryError: Metaspace` 的现场：动态生成类过多（CGLib 代理滥用）撑爆方法区。

## 2. 对象的诞生：分配优先在 TLAB

新对象优先在 **Eden 区**分配，且每个线程在 Eden 里有自己的 **TLAB（Thread Local Allocation Buffer）**——分配就是移动一个指针，无锁无竞争，速度接近栈分配：

```
Eden 区：[线程1 的 TLAB][线程2 的 TLAB]...
```

**逃逸分析**（JIT 优化）：如果对象不会逃出方法外，JIT 可以：
- **栈上分配/标量替换**：把对象拆成基本类型放栈上，根本没有堆对象
- **锁消除**：局部 StringBuffer 的 append 无需加锁

这就是"Java 对象分配很便宜"的原因——大多数对象走 TLAB + 逃逸分析，远比 C 的 malloc 轻。

## 3. 对象的死活：可达性分析

JVM 判定对象死亡不用"引用计数"（循环引用问题），而用**可达性分析**：从 GC Roots 出发能走到的对象是活的，走不到的是垃圾。

GC Roots 包括：虚拟机栈中引用的对象、静态变量引用的对象、常量引用、JNI 引用等。

**四种引用强度**（java.lang.ref 包）：

| 引用 | 回收时机 | 典型用途 |
| --- | --- | --- |
| 强引用 | 永不回收（可达就活） | 普通 `new` |
| 软引用 SoftReference | 内存不足时回收 | 缓存 |
| 弱引用 WeakReference | 下次 GC 必回收 | WeakHashMap、ThreadLocalMap 的 key |
| 虚引用 PhantomReference | 回收时收到通知 | 堆外资源清理 |

**经典陷阱——ThreadLocal 内存泄漏**：ThreadLocalMap 的 key 是弱引用，value 是强引用。线程长期存活（线程池）时，key 被回收变 null，value 却被 Thread→Map→Entry 强引用链拽着无法回收。**修法：用完必须 `remove()`**。

## 4. 分代假说与垃圾回收算法

两个经验假说支撑分代设计：**大多数对象朝生夕死**；**熬过多次 GC 的对象趋于长寿**。于是堆被分为：

```
堆：[新生代 Eden | 两个 Survivor(S0/S1)] [老年代]
     默认比例 Eden:S0:S1 = 8:1:1，新生代:老年代 = 1:2
```

三种基础算法：

| 算法 | 过程 | 缺陷 | 用于 |
| --- | --- | --- | --- |
| 标记-清除 | 标记活对象→清除死对象 | **内存碎片** | CMS |
| 标记-复制 | 活对象在两块内存间复制 | 浪费一半空间 | 新生代（Eden+S0→S1） |
| 标记-整理 | 活对象向一端移动 | 移动成本高 | 老年代（G1/ZGC） |

**Minor GC 过程**：Eden 满 → 触发 Minor GC → Eden + 一块 Survivor 的活对象复制到另一块 Survivor → 年龄 +1 → 达到阈值（默认 15）晋升老年代。**为什么新生代用复制算法**：朝生夕死假说下存活对象极少，复制成本远低于清除整理。

## 5. 收集器演进：从 STW 到并发

| 收集器 | 算法 | 特点 |
| --- | --- | --- |
| Serial/ParNew | 复制 | STW 明显，单核/小内存时代 |
| Parallel Scavenge | 复制 | 吞吐量优先（`-XX:MaxGCPauseMillis`） |
| **CMS**（已废弃） | 标记清除 | 首次并发，但碎片 + 浮动垃圾 |
| **G1**（JDK9+ 默认） | 标记整理+复制 | Region 化分堆，可预测停顿（`-XX:MaxGCPauseMillis=200`） |
| **ZGC**（JDK15+ 正式） | 着色指针 | 停顿 < 1ms（亚毫秒级），TB 级堆 |

**G1 的核心创新**：把堆划分为 2048 个等大 **Region**（1-32MB），每个 Region 可动态扮演 Eden/Survivor/Old/Humongous（大对象）。GC 时**按 Region 回收价值排序**（垃圾最多的先收）——"垃圾优先"（Garbage First）名字的由来。

**ZGC 的杀手锏——着色指针**：把 GC 元信息存进 64 位指针的几个位里，配合读屏障实现"并发移动对象"——回收期间应用线程几乎不停。

## 6. GC 日志与调优三板斧

```bash
# JDK11+ 统一日志
java -Xlog:gc*:file=gc.log -jar app.jar
```

调优决策树：
1. **先看现象**：GC 频率？单次停顿？还是直接 OOM？
2. **OOM: heap space** → dump 分析（`-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=.`），MAT/jvisualvm 找大对象与泄漏链
3. **GC 停顿长** → 换收集器（低延迟上 ZGC/G1）→ 再调堆比例
4. **频繁 Full GC** → 老年代增长过快 = 内存泄漏（查静态集合、缓存无淘汰）或堆太小

**调优真相**：绝大多数服务的 GC 问题源于**内存泄漏或堆配置与业务不符**，换收集器是最后一步而不是第一步。

## 7. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| StackOverflowError | 无限递归/栈太小 | 检查递归出口；-Xss 调大 |
| OOM: Java heap space | 泄漏或堆不足 | dump 分析 MAT；修泄漏 |
| OOM: Metaspace | 动态类生成失控 | 检查 CGLib/热部署；-XX:MaxMetaspaceSize |
| 线程池+ThreadLocal 拿到脏数据 | 线程复用未清理 | finally 中 remove() |
| 大对象直接进老年代 | -XX:PretenureSizeThreshold / Humongous | 数组拆分；G1 调 Region 大小 |
| CMS 碎片导致 Full GC | 标记清除的碎片 | 迁移 G1 |

## 8. 自测五题

1. 栈和堆分别存什么？两者的引用关系如何？
2. 为什么新生代用复制算法、老年代用整理算法？
3. ThreadLocal 泄漏的完整引用链是什么？
4. G1 的 Region 与 Humongous 对象是什么？
5. 线上频繁 Full GC 的排查步骤？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《Java 核心进阶：集合框架与并发编程入门》《Java 面向对象编程》《面向对象编程》
- 站内参考资料：《Java 官方教程》（本地镜像 /post/ref-docs-oracle-com-javase-tutorial）、《Oracle Java 教程 · OOP》（本地镜像 /post/ref-docs-oracle-com-javase-tutorial-java-concepts）
- 《深入理解 Java 虚拟机（第 3 版）》（周志明）——第 2、3 章即本文范围
