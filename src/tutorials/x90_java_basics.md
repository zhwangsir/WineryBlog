---
title: JAVA程序基础
category: 编程语言
order: 1
tags: [Java, JDK, 入门, 编译运行]
summary: 从安装 JDK 到跑通第一个程序：Java 的编译运行机制、基本结构与学习路线起点。
---

## 1. Java 是什么，为什么值得学

Java 是企业级后端的**事实标准**：银行、电商、政务系统的主流语言。三个核心特质：

| 特质 | 含义 | 收益 |
| --- | --- | --- |
| 一次编写，到处运行 | 源码编译成字节码，跑在 JVM 上 | 跨平台 |
| 自动内存管理 | 垃圾回收（GC） | 不用手动 malloc/free |
| 强类型 + 静态检查 | 编译期拦截大量错误 | 大团队协作可靠 |

**学习成本**：语法偏啰嗦（对比 Python），但正因结构严谨，是理解"类型系统、面向对象、内存模型"的最佳教学语言。

## 2. 安装 JDK 与选择版本

- **JDK**（Java Development Kit）= 编译器 + 运行时 + 工具
- 版本选择：**LTS 版**（17 或 21）——长期支持，企业主流

```bash
# 验证安装
java -version      # 运行时
javac -version     # 编译器（JRE 里没有这个，必须装 JDK）
```

常见发行版：Oracle JDK、Eclipse Temurin（推荐，免费开源）、Amazon Corretto。装完配置 `JAVA_HOME` 环境变量（IDE 会自动探测）。

## 3. 第一个程序：HelloWorld 完整解剖

```java
public class HelloWorld {                    // 类：Java 代码必须住在类里
    public static void main(String[] args) { // 程序入口（固定签名）
        System.out.println("Hello, World!"); // 打印一行
    }
}
```

逐部分拆解（每一段都有含义）：

| 片段 | 含义 |
| --- | --- |
| `public` | 访问修饰符：对外公开 |
| `class HelloWorld` | 类声明；**文件名必须与类名一致**（HelloWorld.java） |
| `static` | 属于类而非实例——JVM 无需创建对象即可调用 |
| `void` | 无返回值 |
| `String[] args` | 命令行参数（启动时传入） |
| `System.out.println` | 标准输出打印 |

**编译运行两步**（理解 Java 与脚本语言的本质差异）：

```bash
javac HelloWorld.java    # 编译 → 生成 HelloWorld.class（字节码）
java HelloWorld          # JVM 执行字节码
```

**字节码是 Java 跨平台的秘密**：`.class` 不是机器码，是 JVM 的"汇编"；每种平台有对应的 JVM 把字节码翻译成本地指令——"一次编写，到处运行"。

## 4. 开发环境：IDEA 与项目结构

- **IntelliJ IDEA Community**（免费）——Java 事实标准 IDE
- 项目结构（Maven 约定）：

```
project/
  src/main/java/       源码（包路径 = 目录层级）
  src/main/resources   资源文件
  pom.xml              依赖与构建配置（见 Maven 教程）
```

**包（package）**：类的命名空间，`package com.winery.demo;` 对应目录 `com/winery/demo/`——全大写类名、全小写包名是铁律规范。

## 5. 基本语法速览（与后续教程的衔接地图）

```java
int age = 20;                       // 强类型：变量必须声明类型
final double PI = 3.14;             // final = 常量不可改
String name = "Winery";             // String 是引用类型（注意大写 S）
boolean active = true;

if (age >= 18) {                    // 条件
    System.out.println("成年");
} else {
    System.out.println("未成年");
}

for (int i = 0; i < 5; i++) {       // 计数循环
    System.out.println(i);
}

int[] nums = {1, 2, 3};             // 数组
for (int x : nums) {                // 增强循环
    System.out.println(x);
}
```

后续深入：变量与运算符细节 → 面向对象（类/继承/接口）→ 集合与泛型——见延伸阅读的学习顺序。

## 6. 编译运行机制：JDK/JRE/JVM 三者关系

```
.java 源码 ──javac──→ .class 字节码 ──JVM──→ 机器码
        JDK = JRE + 编译器工具      JRE = JVM + 核心类库
```

- **JDK**：开发者用（含 javac）
- **JRE**：仅运行（用户机器）
- **JVM**：执行字节码的虚拟机（GC、内存管理都在这层）

**为什么理解这个很重要**：`UnsupportedClassVersionError`（高版本编译、低版本运行）、内存 OOM 排查、GC 调优——全部建立在这套分层认知上（深入见站内《JVM 内存模型与垃圾回收》）。

## 7. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| 找不到或无法加载主类 | 类名与文件名不一致 / 包路径错 | 文件名=类名；在正确目录执行 |
| javac 不是内部命令 | 只装了 JRE 或 PATH 未配 | 装 JDK 并配 JAVA_HOME/PATH |
| `int x = "abc"` 编译错误 | 强类型不匹配 | 类型一致或转换 |
| 中文输出乱码 | 编码不一致（GBK vs UTF-8） | javac -encoding UTF-8；IDE 统一 UTF-8 |
| 大小写写错 | `system` ≠ `System` | Java 严格区分大小写 |

## 8. 自测五题

1. JDK、JRE、JVM 的包含关系？
2. 为什么文件名必须与 public 类名一致？
3. 字节码如何实现"一次编写，到处运行"？
4. main 方法的固定签名是什么？每个部分的含义？
5. `javac` 与 `java` 命令分别做什么？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《Java 基础：语法、程序结构与数组》（语法主线，本篇的下一段旅程）、《Java 基础语法与程序结构》（对照补漏）、《Java 面向对象编程》（OOP 灵魂）、《Maven 构建工具入门》（工程化第一步）
- 站内参考资料：《Java 官方教程》（本地镜像 /post/ref-docs-oracle-com-javase-tutorial）
- 《Java 核心技术·卷 1》（Core Java）——入门到进阶的标准教材
