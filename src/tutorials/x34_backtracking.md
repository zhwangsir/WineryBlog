---
title: 回溯与剪枝：排列组合的系统化搜索
category: 数据结构与算法
order: 8
tags: [回溯, 剪枝, DFS, 算法]
summary: 回溯三要素模板、排列/组合/子集三大题型、剪枝四板斧——暴力搜索的艺术。
---

## 1. 回溯是什么

回溯（Backtracking）= **带撤销的 DFS**：一条路走到黑，走不通就退回上一个岔路口换条路。适合"枚举所有可能"类问题：

- 组合/排列/子集（全排列、子集和）
- 棋盘搜索（八皇后、数独、单词搜索）
- 划分问题（分割回文串）

它不保证高效（本质是暴力），但配合**剪枝**能通过绝大多数面试题——解空间的指数级大小，靠剪掉大半棵子树来活。

## 2. 回溯三要素模板

所有回溯题都是同一个骨架：

```python
def backtrack(路径, 选择列表):
    if 满足结束条件:
        结果.append(路径的拷贝)     # 注意拷贝！
        return
    for 选择 in 选择列表:
        if 剪枝条件: continue       # 剪枝：不合法的跳过
        做选择                      # 路径.append(选择)
        backtrack(路径, 选择列表)   # 递归下一层
        撤销选择                    # 路径.pop() ← 回溯的本义
```

**做选择 → 递归 → 撤销选择**，就是这三行的节奏。

## 3. 三大基础题型

### 全排列（顺序有关）
```python
def permute(nums):
    res, path, used = [], [], [False] * len(nums)
    def backtrack():
        if len(path) == len(nums):
            res.append(path[:])          # 拷贝！
            return
        for i in range(len(nums)):
            if used[i]: continue         # 剪枝：用过的不选
            used[i] = True; path.append(nums[i])     # 做选择
            backtrack()
            path.pop(); used[i] = False              # 撤销
    backtrack()
    return res
```

### 子集（顺序无关，每个元素选/不选）
```python
def subsets(nums):
    res, path = [], []
    def backtrack(start):
        res.append(path[:])              # 每个节点都是一个子集
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1)             # 从 i+1 开始 → 避免重复组合
            path.pop()
    backtrack(0)
    return res
```

**start 参数是组合去重的关键**：只往后选，保证 [1,3] 和 [3,1] 不同时出现。

### 组合总和（元素可重复选）
```python
def combinationSum(candidates, target):
    res, path = [], []
    def backtrack(start, remain):
        if remain == 0:
            res.append(path[:]); return
        for i in range(start, len(candidates)):
            if candidates[i] > remain: break         # 剪枝①：排序后可直接 break
            path.append(candidates[i])
            backtrack(i, remain - candidates[i])     # i 不 +1 → 可重复选
            path.pop()
    candidates.sort()                                # 剪枝的前提
    backtrack(0, target)
    return res
```

## 4. 剪枝四板斧

| 剪枝 | 做法 | 效果 |
| --- | --- | --- |
| 可行性剪枝 | 当前状态已不可能达成目标就 return | 砍掉非法分支 |
| 最优性剪枝 | 当前代价已 ≥ 已知最优就 return | 搜索最优解必备 |
| 排序预处理 | 先排序，让上面两条能直接 break | 往往砍掉 90%+ |
| 去重剪枝 | 同层跳过相同元素 | 排列/组合含重复元素必加 |

去重模板（重复元素的全排列，LeetCode 47）：

```python
nums.sort()
def backtrack():
    for i in range(len(nums)):
        if used[i]: continue
        if i > 0 and nums[i] == nums[i-1] and not used[i-1]:
            continue     # 同层相同元素，前一个没用过 → 这个分支已搜过
        ...
```

## 5. 实战：N 皇后（回溯的巅峰演示）

```python
def solveNQueens(n):
    cols, diag1, diag2 = set(), set(), set()   # 列/主对角线/副对角线占用
    res = []
    queens = []

    def backtrack(row):
        if row == n:
            res.append(queens[:]); return
        for col in range(n):
            if col in cols or (row - col) in diag1 or (row + col) in diag2:
                continue                        # O(1) 判断冲突（集合替代扫描）
            cols.add(col); diag1.add(row - col); diag2.add(row + col)
            queens.append(col)
            backtrack(row + 1)
            cols.remove(col); diag1.remove(row - col); diag2.remove(row + col)
            queens.pop()
    backtrack(0)
    return res
```

三个集合让"这个位置安不安全"从 O(n) 扫描降到 O(1)——**用空间换判断速度**是回溯优化的通用思路。

## 6. 回溯 vs 动态规划：怎么选

| | 回溯 | DP |
| --- | --- | --- |
| 要什么 | **所有**方案 / 只需判断存在 | 最优值/方案数 |
| 子问题 | 相互影响（路径依赖选择） | 无后效性 |
| 复杂度 | 指数级（剪枝救） | 多项式 |

问"列出所有 N 皇后解法"→ 只能回溯；问"爬楼梯最少步数"→ DP。有重叠子问题且无后效性 → DP；方案间强耦合 → 回溯。

## 延伸阅读

- 站内相关：《图与遍历算法（BFS/DFS/拓扑）》《动态规划入门：从递推到刷题套路》《哈希与字符串算法：从 Map 到 KMP》
- 《算法（第 4 版）》2.x 回溯章节
- LeetCode 回溯专题（按 46 → 78 → 39 → 51 顺序刷）
