---
title: Java 数组与字符串
category: 编程语言/Java 基础
order: 3
tags: [Java, 数组, 字符串]
summary: 数组声明与操作、多维数组、String 常用方法与 StringBuilder。
---

## 1. 数组

```java
// 声明与初始化
int[] arr = new int[5];               // 动态：长度 5，默认值 0
int[] arr2 = {1, 2, 3, 4, 5};         // 静态：直接赋值

// 访问与修改
arr[0] = 100;
int first = arr2[0];                   // 1
int len = arr2.length;                 // 长度（不是方法，无括号）

// 遍历
for (int i = 0; i < arr2.length; i++) { System.out.println(arr2[i]); }
for (int x : arr2) { System.out.println(x); }   // for-each

// 多维数组
int[][] matrix = new int[3][4];        // 3 行 4 列
int[][] grid = {{1, 2}, {3, 4}};
```

**工具类 Arrays**：

```java
import java.util.Arrays;
Arrays.sort(arr);                     // 排序
Arrays.fill(arr, 0);                  // 填充
int[] copy = Arrays.copyOf(arr, 10);  // 复制（扩容）
int idx = Arrays.binarySearch(arr, 42);  // 二分查找
String s = Arrays.toString(arr);      // 打印
```

## 2. String：不可变对象

```java
String s = "Hello World";
s.length();                    // 长度
s.charAt(0);                   // 取字符 → 'H'
s.substring(0, 5);             // 截取 → "Hello"
s.indexOf("World");            // 查找位置 → 6
s.toUpperCase();               // 转大写（返回新串）
s.trim();                      // 去首尾空格
s.replace("World", "Java");    // 替换（返回新串）
s.split(" ");                  // 分割 → String[]
String.join("-", "a", "b");    // 拼接 → "a-b"
String.format("%s is %d", name, age);   // 格式化
s.equals("Hello World");       // 内容比较
s.equalsIgnoreCase("hello world");      // 忽略大小写比较
s.contains("World");           // 包含
s.startsWith("Hello");         // 前缀
```

**String 不可变**：每次修改返回新对象，原对象不变。频繁拼接用 StringBuilder：

```java
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 100; i++) {
    sb.append(i).append(",");
}
String result = sb.toString();
```

## 3. 类型转换

```java
// 字符串 ↔ 数字
int n = Integer.parseInt("42");
double d = Double.parseDouble("3.14");
String s = String.valueOf(42);

// char ↔ int
char c = 'A';
int code = c;                 // 65
char back = (char)(code + 1); // 'B'

// 格式化
String formatted = String.format("%.2f", 3.14159);   // "3.14"
```

## 4. 下一步

- 《面向对象编程》→ 《Java 核心进阶：集合框架与并发编程入门》
- 《算法入门》——用 Java 实现排序与搜索

## 延伸阅读

- [Oracle String 文档](/post/ref-docs-oracle-com-javase-8-docs-api-java-lang-string-html)
- 站内相关：《JAVA 程序基础》《面向对象编程》《算法入门》
