// Append Batch 21-27 (missing CS2023 directions) before the 完成判据 section
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = path.join(ROOT, 'docs', 'TUTORIAL_BACKLOG.md');
const c = fs.readFileSync(p, 'utf-8');

if (c.includes('Batch 21')) {
  console.log('batches 21+ already present, skip');
} else {
  const marker = '## 完成判据';
  const idx = c.indexOf(marker);
  if (idx < 0) throw new Error('marker not found');
  const add = `## Batch 21 — 操作系统深水区 — status: pending
- x69_process_thread | 操作系统与运维 | 进程与线程：调度、上下文切换与通信
- x70_virtual_memory | 操作系统与运维 | 虚拟内存与分页：MMU、页表与缺页处理
- x71_filesystem | 操作系统与运维 | 文件系统实现：inode、日志与崩溃一致性

## Batch 22 — 计算机体系结构 — status: pending
- x72_pipeline | 计算机组成 | 指令流水线：冒险、转发与分支预测
- x73_cache | 计算机组成 | Cache 层次结构：局部性原理、映射与替换策略
- x74_bus_io | 计算机组成 | 总线、中断与 I/O 系统

## Batch 23 — 分布式与并行（CS2023 PDC） — status: pending
- x75_dist_basics | 分布式与并行 | 分布式系统基础：CAP 定理与一致性模型
- x76_consensus | 分布式与并行 | 共识算法：Paxos 与 Raft
- x77_parallel_prog | 分布式与并行 | 并行编程入门：OpenMP、CUDA 与并行模式

## Batch 24 — 软件工程深水区（CS2023 SE） — status: pending
- x78_design_patterns | 软件工程 | 设计模式：场景化精选与权衡
- x79_refactoring | 软件工程 | 重构：代码坏味道与安全手法
- x80_arch_styles | 软件工程 | 软件架构风格：分层、六边形与事件驱动

## Batch 25 — 数学与计算理论（CS2023 MSF/AL） — status: pending
- x81_discrete_math | 数学基础 | 离散数学：集合、逻辑、数论与图论
- x82_computation_theory | 计算理论 | 计算理论：自动机、可计算性与 NP 完全
- x83_probability | 数学基础 | 概率统计与信息论：贝叶斯、假设检验与熵

## Batch 26 — AI 前沿与人机交互 — status: pending
- x84_hci | 人机交互 | 人机交互与可用性设计（CS2023 HCI）
- x85_knowledge_graph | 人工智能 | 知识图谱：本体建模与图谱构建
- x86_reinforcement | 人工智能 | 强化学习入门：MDP、Q-Learning 与策略梯度

## Batch 27 — 扩展方向补齐 — status: pending
- x87_cloud_native | 分布式与并行 | 云原生基础：服务网格与可观测性
- x88_func_programming | 编程语言 | 函数式编程入门：Haskell 思维与 Monad
- x89_digital_logic | 计算机组成 | 数字逻辑设计：门电路、组合与时序逻辑

`;
  const out = c.slice(0, idx) + add + c.slice(idx);
  fs.writeFileSync(p, out);
  console.log('appended batches 21-27');
}

// update completion criteria: >=185 -> >=203
let c2 = fs.readFileSync(p, 'utf-8');
c2 = c2.replace('≥185 篇教程', '≥203 篇教程');
c2 = c2.replace('Batch 2-20 全部', 'Batch 2-27 全部');
fs.writeFileSync(p, c2);
console.log('completion criteria updated');
