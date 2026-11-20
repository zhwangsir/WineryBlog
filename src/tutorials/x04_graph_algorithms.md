---
title: 图与遍历算法（BFS/DFS/拓扑）
category: 数据结构与算法/图算法
order: 1
tags: [图, BFS, DFS, 拓扑排序, 算法]
summary: 图的表示、BFS/DFS 遍历、拓扑排序与最短路径——图论算法的核心骨架。
---

## 1. 图的表示

```python
# 邻接表（最常用）
from collections import defaultdict
graph = defaultdict(list)
graph[0].append(1)
graph[0].append(2)
graph[1].append(3)

# 邻接矩阵
matrix = [[0]*5 for _ in range(5)]
matrix[0][1] = 1    # 0 → 1 有边
```

## 2. BFS：广度优先搜索

按"层"遍历——先访问起始节点，再访问所有距离 1 的节点，然后距离 2……适合**最短路径**（无权图）。

```python
from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        print(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```

LC 题型：二叉树层序遍历（LC102）、岛屿数量（LC200）、单词接龙（LC127）。

## 3. DFS：深度优先搜索

沿着一条路径走到底再回溯——适合**连通性、路径搜索、拓扑排序**。

```python
def dfs(graph, node, visited):
    visited.add(node)
    print(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
```

递归DFS 注意递归深度（Python 默认 1000），大图改用显式栈：

```python
def dfs_iterative(graph, start):
    visited = set()
    stack = [start]
    while stack:
        node = stack.pop()
        if node in visited: continue
        visited.add(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                stack.append(neighbor)
```

## 4. 拓扑排序：DAG 的线性顺序

有向无环图（DAG）的拓扑排序——依赖关系的线性化（课程表 LC210）。

```python
def topo_sort(graph, n):
    in_degree = [0] * n
    for u in range(n):
        for v in graph[u]:
            in_degree[v] += 1
    queue = deque([i for i in range(n) if in_degree[i] == 0])
    result = []
    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    return result if len(result) == n else []   # 空 = 有环
```

## 5. 最短路径算法对比

| 算法 | 适用 | 复杂度 |
| --- | --- | --- |
| BFS | 无权图 | O(V+E) |
| Dijkstra | 非负权图 | O((V+E)logV) |
| Bellman-Ford | 可检测负环 | O(VE) |
| Floyd-Warshall | 全源最短路径 | O(V³) |

Dijkstra 核心（优先队列优化）：

```python
import heapq
def dijkstra(graph, start):
    dist = {start: 0}
    heap = [(0, start)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]: continue    # 剪枝
        for v, w in graph[u]:
            if dist[u] + w < dist.get(v, float('inf')):
                dist[v] = dist[u] + w
                heapq.heappush(heap, (dist[v], v))
    return dist
```

## 6. 并查集（Union-Find）

动态连通性问题（LC 547 省份数量）：

```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # 路径压缩
            x = self.parent[x]
        return x
    def union(self, x, y):
        self.parent[self.find(x)] = self.find(y)
```

## 延伸阅读

- 站内相关：《数据结构与算法入门》《排序与搜索算法全解》
- [LeetCode 图论题单](/post/ref-leetcode-cn-tag-graph)
