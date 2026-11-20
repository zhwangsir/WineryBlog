---
title: Go 入门：并发编程的轻量之道
category: 编程语言
order: 4
tags: [Go, Goroutine, Channel, 并发]
summary: 语法速览、goroutine 与 channel、sync 包——为什么云原生世界选择了 Go。
---

## 1. Go 是什么，为什么学

Go = **C 的执行效率 + 垃圾回收 + 一等公民并发**。Docker、Kubernetes、etcd、Prometheus——整个云原生生态都是 Go 写的。后端招聘里 Go 岗位持续增长，且语法极简（规范不到 50 页，一周可上手）。

设计哲学：少即是多。没有类（用 struct+方法）、没有继承（用组合）、没有异常（返回 error）、没有三元运算符——**强制所有人写出同一种风格的代码**（gofmt 自动格式化，历史上第一次在语言层面终结缩进圣战）。

## 2. 五分钟语法速览

```go
package main

import "fmt"

// 结构体代替类
type User struct {
    Name string
    Age  int
}

// 方法：接收者挂在函数名前
func (u User) Greet() string {
    return "Hello, " + u.Name
}

// 多返回值：Go 的错误处理基石
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, fmt.Errorf("除数不能为零")
    }
    return a / b, nil
}

func main() {
    u := User{Name: "Winery", Age: 20}      // := 声明并推断类型
    fmt.Println(u.Greet())

    result, err := divide(10, 0)
    if err != nil {                          // if err != nil 是 Go 的日常
        fmt.Println("出错了:", err)
        return
    }
    fmt.Println(result)
}
```

三个特征记牢：**大写开头 = 导出（public）**、**错误是返回值不是异常**、**未使用的变量/导入会编译报错**（强迫代码干净）。

## 3. Goroutine：两 KB 的"线程"

传统线程 8MB 栈，OS 调度，开 1 万个就爆。**Goroutine** 初始栈 2KB、用户态调度（Go runtime 的 GMP 模型），轻轻松松开百万个：

```go
func main() {
    for i := 0; i < 100000; i++ {
        go func(n int) {          // go 关键字一加，函数并发执行
            _ = fmt.Sprintf("task %d", n)
        }(i)
    }
    time.Sleep(time.Second)       // 等等它们（生产中用 WaitGroup）
}
```

没有 `go` 关键字的并发语法糖，也没有 async/await 的颜色函数问题——**同步的代码，并发的执行**，这是 Go 最优雅的设计。

## 4. Channel：不要通过共享内存来通信

Go 的并发哲学写在口号里：**用通信共享内存，而不是用共享内存通信**。Channel 就是 goroutine 之间的管道：

```go
// 生产者-消费者
func producer(ch chan<- int) {     // chan<- 只发送
    for i := 1; i <= 5; i++ {
        ch <- i                    // 发送（队列满则阻塞）
    }
    close(ch)                      // 关闭表示不再发送
}

func main() {
    ch := make(chan int, 3)        // 缓冲 3 的 channel
    go producer(ch)

    for v := range ch {            // 自动在 close 后结束
        fmt.Println("收到", v)
    }
}
```

经典并发模式——**worker pool**（干活的 goroutine 池）：

```go
func worker(id int, jobs <-chan int, results chan<- string) {
    for j := range jobs {
        results <- fmt.Sprintf("worker-%d 处理 job-%d", id, j)
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan string, 100)

    for w := 1; w <= 3; w++ {      // 3 个 worker
        go worker(w, jobs, results)
    }
    for j := 1; j <= 9; j++ {
        jobs <- j
    }
    close(jobs)
    for i := 0; i < 9; i++ {
        fmt.Println(<-results)
    }
}
```

## 5. sync 包：必须共享时的兜底

```go
var (
    counter int
    mu      sync.Mutex            // 互斥锁
    wg      sync.WaitGroup        // 等待一组 goroutine 完成
)

func main() {
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            mu.Lock()
            counter++              // 没有锁的话：读-改-写竞态，结果 < 1000
            mu.Unlock()
        }()
    }
    wg.Wait()                      // 阻塞到全部 Done
    fmt.Println(counter)           // 稳定输出 1000
}
```

数据竞态检测器：`go run -race main.go`——内置工具直接指出哪两行在竞争，并发调试神器。

## 6. 接口：隐式实现的鸭子类型

```go
type Speaker interface {
    Speak() string
}

type Dog struct{}
func (d Dog) Speak() string { return "汪" }

type Robot struct{}
func (r Robot) Speak() string { return "哔" }

// 不需要 implements 声明——实现了方法就自动满足接口
func makeSound(s Speaker) { fmt.Println(s.Speak()) }
```

没有 implements 关键字，**小接口**（1-2 个方法）组合出大能力（io.Reader/io.Writer 就是典范）。依赖注入、mock 测试因此异常简单。

## 7. 上手路线图

1. 本文语法 + 并发 → A Tour of Go（官方交互教程，浏览器里跑）
2. 标准库：net/http（30 行写完一个 Web 服务）、encoding/json
3. 工程化：go mod 依赖管理、go test 表驱动测试
4. 泛型（1.18+）：`func Map[T, U any](s []T, f func(T) U) []U`
5. 项目：CLI 工具 → REST API（gin/chi）→ 读 Kubernetes 源码

## 延伸阅读

- 站内相关：《并发、并行与异步编程概念》《FastAPI：用 Python 写现代后端接口》《Docker 常用命令与 Compose 实战》
- 《Go 程序设计语言》（Go 圣经，Donovan & Kernighan）
- Go by Example（gobyexample.com）——按例子学标准库
