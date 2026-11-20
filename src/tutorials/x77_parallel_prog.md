---
title: 并行编程入门：OpenMP、CUDA 与并行模式
category: 分布式与并行
order: 3
tags: [并行编程, OpenMP, CUDA, 高性能计算]
summary: 并行与并发的辨析、Amdahl 定律、OpenMP 与 CUDA 编程模型——榨干多核与 GPU 的第一课。
---

## 1. 术语辨析：并行 / 并发 / 分布式

| 术语 | 定义 | 例 |
| --- | --- | --- |
| **并发（Concurrency）** | 多任务**交替**占用 CPU（单核也可并发） | 单核跑多线程、async/await |
| **并行（Parallelism）** | 多任务**同时**在多核/多设备上执行 | 多核科学计算、GPU |
| **分布式** | 多台机器通过网络协作 | 微服务、渲染农场 |

并发的核心问题是**正确性**（竞态/锁），并行的核心问题是**性能**（切分与通信开销）。二者经常重叠，但优化手段不同：并发靠锁与调度，并行靠切分与数据局部性。

## 2. 并行的四个层次

1. **位级并行**：字宽 8→32→64 位（硬件内部）
2. **指令级并行（ILP）**：流水线、超标量、乱序执行（CPU 硬件自动，见站内《指令流水线》）
3. **数据级并行（DLP/SIMD）**：一条指令处理多个数据（SIMD 向量单元、GPU 的 SIMT）
4. **任务级并行（TLP）**：多核跑多线程（OpenMP/线程池）

本文聚焦 3 与 4——**程序员能主动利用的两层**。

## 3. Amdahl 定律：可扩展性的天花板

**Amdahl 定律**：若程序有比例 p 可并行、(1-p) 必须串行，则 N 核加速比：

```
S(N) = 1 / ((1-p) + p/N)
```

推论：**串行部分是永久的天花板**。p=95% 时 N→∞，加速比上限 = 1/0.05 = 20 倍——不是加核就能无限快：

```
p=90%:  N=10 → 5.3x    N=100 → 9.2x    N=1000 → 9.9x（逼近 10x 天花板）
p=99%:  N=100 → 50x    N=1000 → 91x
```

**Gustafson 定律**的反视角：数据量随机器扩大而扩大时，加速比按"工作量缩放"计算——大规模并行科学计算的现实乐观版。**实践含义**：优化并行的第一步永远是**消灭/压缩串行段**（I/O、同步点、单线程汇总）。

## 4. OpenMP：共享内存并行的标准

OpenMP 用**编译指导语句（pragma）**给编译器下并行指令——C/C++/Fortran 的共享内存并行事实标准：

```c
#include <omp.h>
#include <stdio.h>

int main() {
    const int N = 1000000;
    long long sum = 0;

    #pragma omp parallel for reduction(+:sum)
    for (int i = 1; i <= N; i++) {
        sum += i;                       // reduction 自动合并各线程局部和
    }
    printf("%lld\n", sum);              // 500000500000
    return 0;
}
```

```bash
gcc -fopenmp demo.c -o demo && OMP_NUM_THREADS=8 ./demo
```

核心 pragma 速查：

| 指令 | 作用 |
| --- | --- |
| `#pragma omp parallel { }` | 生成线程团队执行块 |
| `#pragma omp for` | for 循环迭代分给线程团队 |
| `reduction(+:sum)` | 各线程私有变量，结束按操作合并 |
| `critical` | 临界区（互斥） |
| `schedule(dynamic)` | 动态分块（负载不均时） |
| `#pragma omp task` | 非规则并行（递归/图遍历） |

**纪律**：`parallel for` 里禁止对共享变量裸写（竞态）——需要合并用 reduction，需要互斥用 critical/atomic。

## 5. CUDA：GPU 并行编程模型

GPU 的设计哲学：**上千个简单核心 + 海量线程 + 数据并行**。CUDA 把问题写成"kernel：一个线程处理一个数据元素"：

```cuda
// kernel：每个线程算一个元素的加法
__global__ void vecAdd(const float* a, const float* b, float* c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;   // 全局线程编号
    if (i < n) c[i] = a[i] + b[i];
}

int main() {
    // ...分配/拷贝数据到 GPU（cudaMalloc/cudaMemcpy）...
    int blocks = (n + 255) / 256;
    vecAdd<<<blocks, 256>>>(d_a, d_b, d_c, n);       // 启动 kernel
    // ...拷回结果...
}
```

线程层次：**线程 → Block（共享共享内存）→ Grid**。内存层次决定性能：**全局内存慢（数百周期）**，把复用的数据搬进 **shared memory**（每 Block 私有，快如 L1）是 CUDA 优化的核心（矩阵乘法分块 + shared memory 可提速 10 倍以上）。

**SIMT 执行模型**：32 个线程为一组（warp）锁步执行——**同一 warp 内分支发散会串行化两条路径**（性能陷阱：kernel 里少写 if 分支）。

## 6. 常见并行模式

| 模式 | 定义 | 例 |
| --- | --- | --- |
| Map | 每元素独立变换 | 向量加法、滤镜逐像素 |
| Reduce | 归约出单值 | 求和/最大值（树形归约防竞态） |
| Scan（前缀和） | 前缀累积 | 排序分桶、流式统计 |
| 分治 | 递归切分再合并 | 快排序并行、归并 |
| 流水线 | 阶段间生产消费 | 渲染管线 |
| Stencil | 每元素依赖邻域 | 图像模糊、物理模拟（热传导） |

几乎所有的并行算法都能分解为这些模式的组合——模式识别是并行设计的第一步。

## 7. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| 加核不加速 | 串行段主导（Amdahl） | profile 找串行瓶颈 |
| 多线程结果随机错 | 共享变量竞态 | reduction/atomic/锁 |
| OpenMP 动态数组分配反而慢 | malloc 锁竞争 | 线程局部缓冲 |
| CUDA 程序慢在"计算" | PCIe 数据传输占大头 | 减少 host↔device 拷贝；合并传输 |
| warp 内 if 分支性能掉一半 | SIMT 分支发散 | 重构数据布局让同 warp 同分支 |
| 伪共享多核变慢 | 相邻变量同缓存行 | 缓存行对齐（见站内 Cache 篇） |

## 8. 自测五题

1. 并发与并行的本质区别？
2. Amdahl 定律下 p=95% 的加速比上限？
3. OpenMP 的 reduction 解决什么问题？
4. CUDA 中 shared memory 为什么重要？
5. 什么是 warp 分支发散？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《进程与线程》（OS 层的并行底座）、《指令流水线》（ILP 硬件层）、《Cache 层次结构》（伪共享根源）、《Redis 实战》（reduction 与 Redis 计数的对照）
- 站内参考资料：《MIT OCW 6.006 算法导论》（本地镜像 /post/ref-mit-ocw-6006）
- 《CUDA by Example》/ NVIDIA CUDA C Programming Guide、OpenMP 官方规范
