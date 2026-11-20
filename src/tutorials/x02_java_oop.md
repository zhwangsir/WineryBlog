---
title: Java 面向对象编程（精要）
category: 编程语言/Java 基础
order: 2
tags: [Java, OOP, 类, 接口]
summary: 类与对象、封装继承多态、抽象类与接口、static 与 final——OOP 全景。
---

## 1. 类与对象

```java
public class Student {
    // 属性（成员变量）
    private String name;
    private int score;

    // 构造器
    public Student(String name, int score) {
        this.name = name;
        this.score = score;
    }

    // 方法
    public void study() {
        this.score += 10;
    }

    // getter/setter
    public String getName() { return name; }
    public void setScore(int score) { this.score = score; }
}

Student s = new Student("winery", 60);   // 创建对象
s.study();
```

`new` 在堆内存创建对象，`s` 是栈上的引用。成员变量有默认值（数值 0、布尔 false、引用 null）。

## 2. 封装

属性 `private` + 公共 getter/setter，控制访问并加入校验逻辑：

```java
public void setScore(int score) {
    if (score < 0 || score > 100) throw new IllegalArgumentException("分数范围 0-100");
    this.score = score;
}
```

## 3. 继承

```java
public class GradStudent extends Student {
    private String topic;

    public GradStudent(String name, int score, String topic) {
        super(name, score);           // 调用父类构造器
        this.topic = topic;
    }

    @Override                          // 重写父类方法
    public void study() {
        super.study();                 // 先执行父类逻辑
        System.out.println("研究方向：" + topic);
    }
}
```

Java **单继承**（一个类只能 extends 一个父类），但可以实现多个接口。

## 4. 多态

```java
Student s = new GradStudent("困", 90, "AI");
s.study();    // 运行时调用 GradStudent 的 study（动态绑定）
```

父类引用指向子类对象 → 调用方法时执行子类重写版本。这是策略模式和模板方法的基础。

## 5. 抽象类与接口

```java
// 抽象类：不能实例化，可以有构造器和成员变量
public abstract class Animal {
    protected String name;
    public Animal(String name) { this.name = name; }
    public abstract void makeSound();       // 抽象方法：子类必须实现
    public void sleep() { System.out.println(name + " 睡觉"); }   // 具体方法
}

// 接口：纯行为契约（Java 8+ 可有 default 方法）
public interface Comparable<T> {
    int compareTo(T other);
}
```

## 6. static 与 final

```java
public class Counter {
    private static int count = 0;          // 类变量（所有实例共享）
    private final String id;               // 实例常量（构造后不可变）
    public static final int MAX = 100;     // 类常量

    public Counter(String id) { this.id = id; count++; }
    public static int getCount() { return count; }   // 静态方法
}
```

## 7. 常用 Object 方法

```java
obj.toString()       // 打印表示（建议重写）
obj.equals(other)    // 内容比较（建议重写 + hashCode）
obj.hashCode()       // 哈希码（equals 和 hashCode 必须成对重写）
obj instanceof Type  // 类型检查
```

## 8. 下一步

- 《Java 核心进阶：集合框架与并发编程入门》——集合是对象的容器
- 《SpringMVC》——面向对象在 Web 框架中的应用

## 延伸阅读

- [Oracle Java 教程 · OOP](/post/ref-docs-oracle-com-javase-tutorial-java-concepts)
- 《Head First Java》——入门最佳
