---
title: useState 深度剖析：闭包陷阱与批处理
category: Web 前端
order: 12
tags: [React, useState, Hooks, 闭包]
summary: 状态快照、闭包陷阱、函数式更新、自动批处理——把 useState 背后的调度机制讲透。
---

## 1. useState 的本质：每次渲染一份"状态快照"

新手把 state 想成"组件身上的一个变量"——这是理解一切 useState 怪现象的错误起点。正确模型：

> **每次组件渲染，React 都会给这一次渲染拍一张"快照"：当时的 props、当时的 state、当时的所有事件处理函数，全部冻结在这一帧。**

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);          // 注意：用的是"这一次渲染"的 count
    console.log(count);           // 点 5 次后点击：打印的还是旧值！
  }

  return <button onClick={handleClick}>{count}</button>;
}
```

点击按钮 → React 记住"要把 count 改成 1"→ 触发重渲染 → **新的一次渲染**里 `useState(0)` 返回 1。原来的那次渲染（连同它的 count=0、handleClick）成为历史快照，永远不再变化。

**推论**：setCount 之后立刻读 count，读到的必然是旧值——因为那次渲染的快照不可变。

## 2. setXxx 做了什么：请求一次重渲染

`setCount(1)` 不是赋值语句，而是向 React 调度器发出一个**更新请求**：

```
setCount(1) ──→ 排队一个更新（update 对象）──→ 调度重渲染（可能批处理/延迟）──→ 组件用新 state 重新执行
```

三个要点：

1. **它是异步语义的**（不是同步赋值）——立即读 state 必是旧值
2. **相同的值可能跳过渲染**：`setCount(1)` 当 count 已是 1 时，React 用 `Object.is` 比较后**可能**跳过重渲染（bailout）
3. **React 等你的事件处理器跑完才渲染**——一次点击里连调三次 setCount，最终只渲染一次（批处理，见 §6）

## 3. 闭包陷阱：最经典的 useState Bug

```jsx
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);          // ✗ 闭包捕获的是"挂载那次渲染"的 count=0
    }, 1000);
    return () => clearInterval(id);
  }, []);                           // 空依赖：effect 只跑一次，闭包冻结

  return <div>{count}</div>;
}
// 结果：count 永远在 0 和 1 之间跳动！
```

**现象**：定时器每秒执行，但 count 从 1 再也涨不上去。
**原因**：`[]` 依赖让 effect 只在挂载时执行一次，那次执行的 handleClick/setInterval 回调捕获的 `count` 永远是挂载帧的快照 0。每秒 `setCount(0+1)`——永远是 1。
**修法**（两种，语义不同）：

```css
/* 修法 A：函数式更新（推荐）—— 不依赖外部快照 */
setCount(c => c + 1);

/* 修法 B：把 count 加入依赖 —— interval 每秒销毁重建（定时器周期被重置） */
useEffect(() => { ... }, [count]);
```

**闭包陷阱速查表**：

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| 定时器里 state 永远是初始值 | 空依赖闭包冻结快照 | 函数式更新 |
| 事件处理器读 state 是旧值 | setXxx 异步语义 | 函数式更新或读返回前的局部变量 |
| setTimeout 里 props 变了但读到旧的 | 同一闭包快照 | 用 ref 存最新值或调整依赖 |
| async 回调里 setState 用了旧值 | await 之后仍是旧渲染的闭包 | 函数式更新 |

## 4. 函数式更新：setState(prev => next)

```javascript
setCount(c => c + 1);
setCount(c => c + 1);
setCount(c => c + 1);
// 三次都生效：每次收到的是"队列里最新的值"，而非渲染快照
```

React 把更新函数排进更新队列，渲染时**依次执行**，每个函数的入参是前一个函数的输出——天然避开闭包快照问题。

**两个使用纪律**：
1. 更新函数必须**纯**：同样输入必须同样输出，不发起请求、不改外部变量（React 可能在 StrictMode 下调用它两次来帮你发现副作用）
2. 需要基于"当前值"计算时**永远用函数式**——哪怕你"确定"没有闭包问题

## 5. 对象与数组状态：引用比较下的更新纪律

React 用 `Object.is` 比较 state——**直接改对象属性 = 同一引用 = React 认为没变化**：

```javascript
// ✗ 变异（mutation）：引用没变，界面不更新
user.name = 'new';
setUser(user);

// ✓ 不可变更新：创建新对象
setUser({ ...user, name: 'new' });
setUser(u => ({ ...u, name: 'new' }));

// 数组同理
setItems([...items, newItem]);          // 追加
setItems(items.filter(i => i.id !== id));  // 删除
setItems(items.map(i => i.id === id ? { ...i, done: true } : i));  // 更新
```

深层嵌套对象更新很繁琐——这是 immer 这类库存在的原因（写变异语法，产出不可变结果）。但先掌握展开运算符，别急着上库。

**对象状态的陷阱速查表**：

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| 改了属性界面不动 | 同引用，Object.is 相等 | 展开创建新对象 |
| 展开后嵌套字段丢了 | 浅拷贝只复制一层 | 逐层展开 `{ ...a, b: { ...a.b, c: 1 } }` |
| 数组 sort 后界面异常 | sort 原地变异原数组 | 先 `[...items].sort()` |
| 表单只更新最后一个字段 | 事件闭包共用旧对象 | 函数式更新 `setForm(f => ({...f, [k]: v}))` |

## 6. 自动批处理：React 18 的沉默优化

```jsx
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  setName('bob');
  // 三个更新合并为一次重渲染 —— 批处理
}
```

批处理把多次 setState 合并成**一次**重渲染（性能优化）。React 18 之前只有 React 事件处理器里批处理；**18 起在 setTimeout、Promise、原生事件里全部自动批处理**：

```javascript
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React 18：一次渲染 ✓
  // React 17：两次渲染
}, 0);
```

需要"立即强制渲染"（如测量 DOM）时用 `flushSync` 退出批处理：

```javascript
import { flushSync } from 'react-dom';
flushSync(() => setCount(1));
console.log(domRef.current.offsetHeight);   // 此时 DOM 已更新
```

**警告**：flushSync 是性能杀手，仅在"必须同步读到新 DOM"的场景使用（一帧内多次调用会逐帧强制渲染）。

## 7. 惰性初始化：昂贵的初始值只算一次

`useState(expensiveFn())` 的问题：**expensiveFn 在每次渲染都会执行**（哪怕结果被丢弃）：

```javascript
// ✗ 每次渲染都 filter 一万条
const [list] = useState(hugeData.filter(x => x.active));

// ✓ 传函数：React 只在首次挂载调用它
const [list] = useState(() => hugeData.filter(x => x.active));
```

判定标准：初始值是**直接常量**就直传；需要**计算/读取 localStorage/拼接**就用惰性函数。惰性初始化函数也必须纯。

## 8. state 放哪里：三条决策规则

1. **能算出来的不做 state**：`fullName = first + last` 直接在渲染时计算（派生状态进 state = 双份真相 = 同步 bug）
2. **找最近公共父级**：两个兄弟组件都需要 → 提升到父组件（状态提升）
3. **放得越低越好**：只在子树用就别提到顶——状态越局部，重渲染范围越小

## 9. 与 Vue ref 的心智差异

| | React useState | Vue ref |
| --- | --- | --- |
| 更新方式 | 调 set 函数请求重渲染 | 直接 `.value = x`（Proxy 拦截） |
| 状态可变性 | 不可变快照（创建新对象） | 可变（直接改属性也响应） |
| 粒度 | 组件级重渲染 | 精确依赖追踪，只更新用到的地方 |
| 读取时机 | 本次渲染的快照 | 永远读最新值 |

React 的不可变模型换来**时间旅行调试、并发渲染安全**（一次渲染期间状态不漂移）；Vue 的可变模型换来**更少的样板代码**。两者都对，心智模型不能混用——在 React 里"改属性"就是 bug。

## 10. 陷阱总复习

1. set 后立即读 state → 读到旧快照（§1）
2. 空依赖定时器读旧 state → 函数式更新（§3）
3. 直接改对象属性不刷新 → 不可变更新（§5）
4. 连续 set 计数只 +1 → 函数式更新
5. 昂贵初始化每次渲染都跑 → 惰性初始化（§7）
6. setTimeout/Promise 里没批处理？ → React 18 已全面批处理（§6）
7. 派生值存 state → 改为渲染时计算（§8）

## 延伸阅读

- 站内：《React 核心补充：Hooks 与状态管理》《React 性能优化实战》（重渲染的度量与治理）、《useEffect 完全指南：依赖、清理与时机》
- 站内参考资料：《React 官方：用 React 思考》（本地镜像 /post/ref-react-thinking）
- 《React 官方文档 Learn》（[本地镜像](/post/ref-react-learn)）——State as a Snapshot 等
