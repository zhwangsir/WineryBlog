---
title: Java 基础语法与程序结构
category: 编程语言/Java 基础
order: 1
tags: [Java, 语法, 基础]
summary: main 方法、变量与类型、运算符、流程控制——Java 程序的最小骨架。
---

## 1. 程序入口

```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
```

- `public class Hello`：类名必须与文件名一致（Hello.java）
- `public static void main(String[] args)`：JVM 入口，固定签名
- `System.out.println`：标准输出

编译运行：`javac Hello.java` → `java Hello`

## 2. 变量与数据类型

```java
int age = 20;                    // 整数（4 字节）
long bigNum = 3000000000L;       // 长整数（8 字节，加 L 后缀）
double price = 9.99;             // 双精度浮点
float rate = 0.5f;               // 单精度浮点（加 f 后缀）
boolean active = true;           // 布尔
char grade = 'A';                // 字符（单引号）
String name = "winery";          // 字符串（引用类型，双引号）
```

类型转换：

```java
int x = (int) 3.99;              // 强制转换 → 3（截断）
long big = x;                    // 自动提升（小→大）
String s = String.valueOf(x);    // 转字符串
int n = Integer.parseInt("42");  // 字符串转整数
```

## 3. 运算符

```java
int a = 10, b = 3;
a + b;  a - b;  a * b;  a / b;      // 算术（整数除法截断：10/3=3）
a % b;                               // 取余 → 1
a++;  b--;  a += 5;                  // 自增自减复合赋值
a == b;  a != b;  a > b;             // 比较（返回 boolean）
&&  ||  !                            // 逻辑与/或/非（短路求值）
&  |  ^  ~  <<  >>  >>>             // 位运算
```

**字符串比较用 `.equals()` 不用 `==`**：

```java
String s1 = "hello";
String s2 = new String("hello");
s1 == s2;          // false（比较引用）
s1.equals(s2);     // true（比较内容）
```

## 4. 流程控制

```java
// if-else
if (score >= 90) { grade = "A"; }
else if (score >= 80) { grade = "B"; }
else { grade = "C"; }

// switch（Java 14+ 箭头语法）
switch (day) {
    case 1 -> System.out.println("周一");
    case 2 -> System.out.println("周二");
    default -> System.out.println("其他");
}

// while / do-while
while (count < 10) { count++; }

// for / for-each
for (int i = 0; i < 10; i++) { ... }
for (String s : names) { System.out.println(s); }

// break / continue
for (int i = 0; i < 100; i++) {
    if (i % 2 == 0) continue;    // 跳过偶数
    if (i > 50) break;           // 提前退出
    System.out.println(i);
}
```

## 5. 方法

```java
// 修饰符 返回类型 方法名(参数列表)
public static int add(int a, int b) {
    return a + b;
}

// 可变参数
public static int sum(int... nums) {
    int total = 0;
    for (int n : nums) total += n;
    return total;
}

// 方法重载：同名不同参数
public static double add(double a, double b) { return a + b; }
```

## 6. 下一步

- 《面向对象编程》——类与对象、封装继承多态
- 《Java 核心进阶：集合框架与并发编程入门》——集合与并发
- 《SpringMVC》——Java Web 框架

## 延伸阅读

- 站内相关：《Java 核心进阶：集合框架与并发编程入门》《Spring Boot 快速上手》
- [Java 官方教程](https://docs.oracle.com/javase/tutorial/)
