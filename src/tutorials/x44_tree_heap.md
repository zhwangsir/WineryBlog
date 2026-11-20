---
title: 树与堆：优先队列的艺术
category: 数据结构与算法
order: 10
tags: [二叉树, 堆, 优先队列, 算法]
summary: 遍历四式、BST 性质、堆的插入与弹出——排行榜、任务调度、Top-K 问题的结构答案。
---

## 1. 树： hierarchical 数据的通用形态

文件系统、DOM、组织架构、JSON——都是树。二叉树的四种遍历先背熟：

```javascript
// 前序：根左右（复制树/序列化）
function preorder(node, res = []) {
  if (!node) return res;
  res.push(node.val);
  preorder(node.left, res);
  preorder(node.right, res);
  return res;
}
// 中序：左根右（BST 中序 = 升序！）
// 后序：左右根（自底向上计算，如求树高）
// 层序：BFS + 队列（按层处理）
function levelOrder(root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const size = queue.length;                 // 锁定本层节点数
    const level = [];
    for (let i = 0; i < size; i++) {
      const n = queue.shift();
      level.push(n.val);
      n.left && queue.push(n.left);
      n.right && queue.push(n.right);
    }
    res.push(level);
  }
  return res;
}
```

**递归遍历的心智模型**：把"整棵树的问题"分解为"根 + 左子树 + 右子树"，剩下的交给递归。求树高一行：`1 + Math.max(height(l), height(r))`。

## 2. 二叉搜索树：有序性换速度

BST 性质：**左子树所有节点 < 根 < 右子树所有节点**。查找/插入/删除平均 O(log n)——每次比较砍一半，就是二分思想长在树上：

```javascript
function search(node, target) {
  while (node) {
    if (target === node.val) return node;
    node = target < node.val ? node.left : node.right;
  }
  return null;
}
```

BST 的坑：**退化**。有序数据依次插入会变成链表（O(n)）——所以工程里用的是自平衡树（AVL、红黑树）。Java TreeMap、C++ map 底层就是红黑树：**有序 Map**，range 查询 O(log n)。

## 3. 堆：只需要"最快拿最大/最小"时

完整二叉树 + 堆性质（父 ≥ 子叫大顶堆）。**用数组存树**（下标计算免指针）：

```
索引 i 的：左孩子 = 2i+1，右孩子 = 2i+2，父 = (i-1)/2

数组: [50, 30, 40, 10, 20]          树形:
       0  1   2   3   4                  50
                                       30    40
                                     10  20
```

核心操作（以大顶堆为例）：

```javascript
class MaxHeap {
  constructor() { this.a = []; }

  push(v) {                       // 插入 O(log n)：上浮
    this.a.push(v);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p] >= this.a[i]) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];   // 交换父子
      i = p;
    }
  }

  pop() {                         // 弹出最大 O(log n)：下沉
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length) {
      this.a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let big = i;
        if (l < this.a.length && this.a[l] > this.a[big]) big = l;
        if (r < this.a.length && this.a[r] > this.a[big]) big = r;
        if (big === i) break;
        [this.a[i], this.a[big]] = [this.a[big], this.a[i]];
        i = big;
      }
    }
    return top;
  }

  get size() { return this.a.length; }
  get max() { return this.a[0]; }       // O(1) 看最大
}
```

优先队列 = 堆 + 业务优先级比较器。**任务调度、Dijkstra 最短路、定时器**底层全是它。

## 4. Top-K 问题：堆的标准战场

"100 万个数找最大的 10 个"——全排序 O(n log n)，**堆只需要 O(n log k)**：

```javascript
function topK(nums, k) {
  const heap = new MaxHeap();              // 反向：用小顶堆维护"当前前 k 大"
  // 用小顶堆：堆里始终只有 k 个，堆顶 = 前 k 大里最小的
  const minHeap = new MinHeap();
  for (const n of nums) {
    if (minHeap.size < k) {
      minHeap.push(n);
    } else if (n > minHeap.min) {          // 比"守门员"大 → 挤掉守门员
      minHeap.pop();
      minHeap.push(n);
    }
  }
  return minHeap.toArray();                // k 个最大的
}
```

记忆口诀：**找最大 K 用小顶堆（守门员是门槛），找最小 K 用大顶堆**。

## 5. 工程映射

| 场景 | 结构 |
| --- | --- |
| 延迟任务队列（超时重试） | 小顶堆按时间戳 |
| 游戏伤害排序/排行榜 | ZSet（Redis 的跳表+哈希）或堆 |
| 事件循环的定时器 | 小顶堆（Node setTimeout 内部） |
| 搜索引擎 Top-N 结果 | 小顶堆流式维护 |
| DOM 事件委托查找、React Fiber 树 | 树遍历 |

## 6. 刷题矩阵

- LC104/111 树的最大/最小深度（递归入门）
- LC102 层序遍历（BFS 模板）
- LC236 最近公共祖先（后序遍历经典）
- LC215 数组第 K 大（快速选择 or 小顶堆）
- LC23 合并 K 个升序链表（k 路归并 + 堆）
- LC295 数据流的中位数（对顶堆：大顶堆 + 小顶堆）

对顶堆值得一提：两个堆各持一半数据，中位数 = 大顶堆堆顶 / 两堆顶均值——动态中位数 O(log n) 维护。

## 延伸阅读

- 站内相关：《排序与搜索算法全解》《数据结构与算法入门》《滑动窗口与双指针：线性时间的子串艺术》
- 《算法（第 4 版）》3.4 堆与优先队列
- visualgo.net——树与堆的可视化动画（直观理解上浮下沉）
