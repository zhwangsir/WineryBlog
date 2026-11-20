---
title: React Fiber 架构：可中断渲染
category: Web 前端
order: 14
tags: [React, Fiber, 并发, 架构]
summary: FiberNode 结构、双缓冲树、可中断渲染与优先级——React 16 重写背后的问题与解法。
---

## 1. 为什么 React 16 推翻重写

React 15 的渲染是**同步递归**：`ReactDOM.render` 一旦开始，就把整棵组件树递归渲染到 DOM，中途不可暂停。当树很大（几千个组件）时，一次渲染占用主线程几十上百毫秒：

```
旧架构：渲染 200ms 不间断 → 期间用户点击/输入全部排队 → 掉帧卡顿
```

浏览器每帧只有 **16.7ms**（60fps），超出的时间片里的渲染就是"长任务"。2016 年 React 团队立项 Fiber：**把渲染拆成一个个小工作单元，可以暂停、可以中断、可以按优先级丢弃**——为并发特性（时间切片、Suspense、transition）铺路。

一句话定义：**Fiber 是对组件树中每个组件的"工作单元"抽象 + 一套可中断的调度算法**。

## 2. FiberNode：链表化的组件

旧架构用递归栈表示组件树——中断就丢栈。Fiber 把树改写成**链表结构**，每个节点是个 JS 对象（FiberNode）：

```javascript
{
  type: 'div' | function Component,   // 组件类型
  key: '...',
  stateNode: DOM 节点或类组件实例,      // 真实 DOM
  child: Fiber | null,                // 第一个子节点
  sibling: Fiber | null,              // 下一个兄弟
  return: Fiber,                      // 父节点（链表里叫 return）
  memoizedProps: {...},               // 上次/本次渲染的 props
  memoizedState: {...},               // hooks 链表头（useState 存这）
  lanes: 0,                           // 本次更新的优先级位图
  alternate: Fiber,                   // 双缓冲的另一棵树上的自己
  flags: 插入/更新/删除 标记,
}
```

**为什么从递归改链表**：递归的中断点依赖调用栈（不可保存）；链表的"当前处理到哪个节点"就是 `child/sibling` 指针——**中断后可以从任何节点恢复**。这就是可中断渲染的数据结构基础。

## 3. 双缓冲树（Double Buffering）

Fiber 架构同时维护两棵树：

| 树 | 名字 | 角色 |
| --- | --- | --- |
| current | 当前展示的树 | 与真实 DOM 一一对应 |
| workInProgress | 正在构建的树 | 本次更新的"草稿" |

渲染时在 workInProgress 上算出新状态（DOM 操作先"记账"为 flags，不真改），全部算完后**一次性 commit**（真正更新 DOM）。两棵树通过 `alternate` 指针互指，commit 完成后 workInProgress 变成新的 current——下一轮更新就在另一棵树上打草稿。

**为什么双缓冲而不是原地改**：可中断渲染意味着"算了一半的状态"会存在于内存中；如果原地改 current，用户此刻看到的就是半成品。双缓冲保证 current 永远完整可用。

## 4. 渲染两阶段：可中断与不可中断的分界

```
┌── render 阶段（可中断）──────────────┐   ┌── commit 阶段（同步不可中断）┐
│ beginWork：处理每个 Fiber，算出变化   │ → │ beforeMutation / Mutation：   │
│ completeWork：收集 flags，生成副作用列表│   │ DOM 插入/更新/删除             │
└──────────────────────────────────┘   │ Layout：useLayoutEffect        │
                                       └──────────────────────────────┘
```

- **render 阶段**：纯计算（执行组件函数、diff），可以被暂停、恢复、放弃重来。这就是为什么**组件函数必须是纯函数**——被打断重跑，副作用会执行多次
- **commit 阶段**：真实操作 DOM，必须一气呵成（半更新的 DOM 不能给用户看）——不可中断。useEffect 排在 commit 之后异步执行，useLayoutEffect 在 commit 内同步执行

这也解释了渲染函数纯函数纪律的**底层原因**：不是风格问题，是并发正确性问题。

## 5. 时间切片与协作调度

调度器（scheduler 包）把 render 阶段的活切成小片，每片之间问一句："主线程还有时间吗？"

```javascript
// 简化的调度伪代码
function workLoop(deadline) {
  while (workInProgress && deadline.timeRemaining() > 1) {
    workInProgress = performUnitOfWork(workInProgress);   // 处理一个 Fiber
  }
  if (workInProgress) {
    scheduleCallback(workLoop);      // 没做完 → 让出主线程，下个空闲期继续
  } else {
    commitRoot();                    // 全部算完 → 进入 commit
  }
}
requestIdleCallback / MessageChannel   // 空闲期调度的底层
```

实际实现用的是 **MessageChannel 宏任务**（而非 requestIdleCallback——它的触发频率不可控）。中断点选在"完整处理完一个 Fiber 单元"之后，保证每个单元的中间状态不暴露。

## 6. 优先级：Lanes 位图模型

不是所有更新都平等——输入框回显必须立即，列表刷新可以稍后。React 18 用 **31 位二进制位（lanes）** 表示优先级：

| 优先级 | 典型来源 | 行为 |
| --- | --- | --- |
| SyncLane | 离散事件（点击/输入） | 同步渲染，不切片 |
| DefaultLane | 数据更新后的渲染 | 可切片 |
| TransitionLane | startTransition 包裹 | 可中断、可丢弃，被更高优先级打断后重做 |
| IdleLane | 离屏内容 | 空闲才做 |

```javascript
import { startTransition } from 'react';

function SearchBox() {
  const [input, setInput] = useState('');        // 高优先级：打字必须跟手
  const [list, setList] = useState([]);

  function onChange(e) {
    setInput(e.target.value);                    // 立即更新
    startTransition(() => {                      // 标记为低优先级
      setList(filter(hugeData, e.target.value)); // 可被打断的渲染
    });
  }
}
```

**startTransition 的价值**：大列表过滤会触发长渲染——标记为 transition 后，用户继续打字时 React **丢弃**进行中的渲染，基于最新输入重算。旧架构里这是"输入卡顿"的根源。

## 7. 对开发者的实际影响

1. **渲染函数必须纯**（并发正确性，§4）——StrictMode 双调用就是在检测不纯
2. **不能用渲染期间的外部可变状态**——并发下一次渲染可能被多次执行/丢弃
3. **UI 不会"撕裂"**（tearing）：同一时刻所有组件读到的 state 版本一致——React 用 lanes + 订阅协调保证
4. **长列表大树的卡顿 → startTransition** 是官方解法
5. 想手动控制优先级用 `useTransition`（拿到 isPending 标志给 loading UI）

## 8. Fiber 相关名词速查

| 名词 | 一句话 |
| --- | --- |
| FiberNode | 组件的工作单元对象（链表节点） |
| 双缓冲 | current + workInProgress 两棵树 |
| beginWork / completeWork | render 阶段的两个处理函数 |
| lanes | 优先级位图 |
| render / commit | 可中断阶段 / 同步提交阶段 |
| 调度器 scheduler | 独立包，管时间切片与优先级队列 |
| Concurrent | 建立在 Fiber 上的特性总称（transition/Suspense/useDeferredValue） |

## 延伸阅读

- 站内：《useState 深度剖析：闭包陷阱与批处理》（更新排队与批处理的 Fiber 视角）、《useEffect 完全指南》（commit 阶段两类 effect 的时机）、《React 性能优化实战》（startTransition 落地）
- 站内参考资料：《React 官方：用 React 思考》（本地镜像 /post/ref-react-thinking）
- React 源码 ReactFiberWorkLoop.js / ReactFiberBeginWork.js（配官方 fiber 论文）
