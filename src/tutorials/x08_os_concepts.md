---
title: 操作系统核心概念
category: 计算机组成/操作系统
order: 1
tags: [操作系统, 进程, 内存, 调度]
summary: 进程与线程、虚拟内存、调度算法、系统调用——OS 核心概念速览。
---

## 1. 进程与线程

- **进程**：资源分配的基本单位（独立地址空间、文件描述符、信号处理）
- **线程**：CPU 调度的基本单位（共享进程地址空间，有自己的栈和寄存器）

```bash
ps aux | head -5          # 进程列表
ps -eLf | wc -l           # 含线程数
top -H                    # 按线程查看
```

**进程间通信（IPC）**：管道、消息队列、共享内存、信号量、Socket。
**线程同步**：互斥锁、条件变量、读写锁、信号量。

## 2. 虚拟内存

每个进程有独立的虚拟地址空间（64 位系统 256TB），通过页表映射到物理内存：

```
虚拟地址 → 页表查找 → 物理地址
                ↓ 未命中
           Page Fault → 从磁盘调入
```

- **页面置换**：LRU（最近最少使用）、Clock（时钟算法）
- **TLB**：页表缓存，加速地址转换
- **Swap**：物理内存不足时换出到磁盘（`swapon --show` 查看）

## 3. CPU 调度

Linux 使用 **CFS（Completely Fair Scheduler）**：

- 每个进程有 vruntime（虚拟运行时间）
- 调度器选择 vruntime 最小的进程运行
- 优先级通过 nice 值（-20 ~ 19）影响 vruntime 增长速度

```bash
nice -n 10 command        # 低优先级运行
renice -n 5 -p <pid>      # 修改运行中进程优先级
chrt                      # 实时调度策略查看
```

## 4. 系统调用（System Call）

用户态 → 内核态的接口：

```bash
strace ls                 # 追踪系统调用
strace -c ls              # 统计调用次数
```

常用：`open/read/write/close`（文件）、`fork/exec`（进程）、`mmap`（内存映射）、`socket/bind/listen`（网络）。

## 5. 中断

硬件打断 CPU 当前执行——中断处理程序（ISR）响应：

- **硬件中断**：网卡收包、定时器到期、磁盘完成
- **软中断**：`softirq` 处理延迟任务（网络收包后半部）
- 查看：`cat /proc/interrupts`、`vmstat` 的 in 列

## 6. 性能监控

```bash
vmstat 1                  # 每秒系统状态（r/b/wa 列最重要）
iostat -x 1               # 磁盘 IO
mpstat -P ALL 1           # 每核 CPU
sar -n DEV 1              # 网络流量
```

高 load 排查流程：`uptime` 看负载 → `top` 看 CPU → `vmstat` 看 IO → `iostat -x` 看磁盘 → `pidstat` 定位进程。

## 延伸阅读

- 站内相关：《Linux 入门与文件系统》《Linux 常用命令与文本处理》《Linux 进阶》
- 《深入理解计算机系统（CSAPP）》第 8-9 章——进程与虚拟内存
