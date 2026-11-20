---
title: useEffect 完全指南：依赖、清理与时机
category: Web 前端
order: 13
tags: [React, useEffect, Hooks, 副作用]
summary: effect 的执行时机、依赖数组的精确语义、清理函数、竞态处理——把最容易被误用的 Hook 讲透。
---

## 1. useEffect 是什么：渲染之后的"逃逸舱"

React 的渲染函数应该是**纯函数**——同样的 props/state 输出同样的 JSX，不做任何外部世界的事。但真实组件需要：订阅数据流、操作 DOM 节点、起定时器、发请求。这些"与外部系统同步"的逻辑，就是 useEffect 的领域：

```jsx
function ChatRoom({ roomId }) {
  useEffect(() => {
    const conn = createConnection(roomId);   // 与外部系统（服务器）同步
    conn.connect();
    return () => conn.disconnect();          // 停止同步
  }, [roomId]);
  return <h1>欢迎来到 {roomId} 房间！</h1>;
}
```

心智模型：**effect 让你把组件"连接"到某个外部系统，并在离开时断开连接**。它是同步逻辑的逃逸舱，不是"组件生命周期的钩子"——这个定位差异是几乎所有误用的根源。

## 2. 执行时机：与 useLayoutEffect 的分界

```
渲染（render：执行组件函数，算出 JSX）
  ↓
提交（commit：React 更新 DOM）
  ↓
[异步] useEffect 执行              ← paint 之后，用户大概率已看到界面
[同步] useLayoutEffect 执行        ← paint 之前，DOM 已更新但还没绘制
  ↓
浏览器绘制
```

| | useEffect | useLayoutEffect |
| --- | --- | --- |
| 时机 | paint 之后异步 | DOM 更新后、paint 前同步 |
| 阻塞绘制 | 否 | 是 |
| 用途 | 数据订阅、事件监听、定时器 | 测量 DOM 后立刻改布局（如 tooltip 定位） |
| SSR | 不执行 | 服务端也不执行，但会告警 |

默认用 useEffect；只有"**改完 DOM 会闪一下**"（先渲染再跳位置）才换 useLayoutEffect。

## 3. 依赖数组：精确语义

```jsx
useEffect(fn, deps)
```

| deps | 语义 |
| --- | --- |
| 不传 | 每次渲染后都执行（默认） |
| `[]` | 只在挂载后执行一次（卸载前跑清理） |
| `[a, b]` | 挂载后执行 + **a 或 b 的 Object.is 比较变化后**执行 |

三个精确语义：

1. **比较是 Object.is 浅比较**：依赖数组里的对象/数组每次渲染都是新引用 → 每次都触发。依赖里只能放"原始值或稳定引用"
2. **"每次渲染有自己的 effect"**：第 3 次渲染创建的 effect 闭包看到的是第 3 次渲染的 props/state——effect 不是"一个函数"，是"每次渲染各一份"
3. **清理函数在下次 effect 执行前 + 卸载时执行**：保证新旧 effect 不重叠

## 4. 竞态条件：数据请求的头号 bug

```jsx
// ✗ 有竞态的版本
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(setUser);           // 快速切换 userId 时，慢的旧请求后返回，覆盖新数据！
  }, [userId]);
}
```

**现象**：快速点击切换用户，界面显示的却是上一个用户的数据。
**原因**：userId=1 的请求还没返回，userId=2 的请求已发出并先返回；随后 userId=1 的迟到响应把新数据覆盖。
**修法**——cleanup 里立 ignore 标志（或 AbortController 取消）：

```jsx
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    let ignore = false;
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(u => { if (!ignore) setUser(u); });
    return () => { ignore = true; };   // 下一次 effect 前，旧的被标记作废
  }, [userId]);
}
```

语义：cleanup 在"这次 effect 对应的订阅作废"时运行——**它是 effect 的"撤销键"**。写任何 effect 前先问：我的操作如何撤销？

## 5. 不要用 effect 做"能算出来的事"

```jsx
// ✗ 反模式：用 effect 同步派生状态（双份真相 + 额外渲染）
const [fullName, setFullName] = useState('');
useEffect(() => { setFullName(first + ' ' + last); }, [first, last]);

// ✓ 直接在渲染时计算
const fullName = first + ' ' + last;
```

```jsx
// ✗ 用 effect 响应 props 变化重置 state
useEffect(() => { setItems(props.items); }, [props.items]);

// ✓ 用 key 重置整个组件（React 惯用法）
<Profile key={userId} userId={userId} />
```

判断口诀：**如果某个值能从现有 props/state 算出来，它就不该是 state，更不该用 effect 同步**。effect 的合法用途只有三类：与外部系统同步、订阅、带副作用的初始化。

## 6. 依赖数组 lint 与"撒谎"的代价

`react-hooks/exhaustive-deps` 规则要求依赖列出 effect 内引用的所有响应式值。绕过它的两种"撒谎"及其代价：

```javascript
// 谎言 1：故意少写依赖（如只想挂载时跑一次）
useEffect(() => { track(page); }, []);        // lint 警告 page 缺失
// 代价：track 读到的是挂载帧的旧 page（闭包陷阱复活）
```

正确姿势——**先改代码结构让依赖自然减少**，而不是压制警告：

```javascript
// 改法 1：函数式更新消除对 state 的依赖
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);  // 不再依赖 count
  return () => clearInterval(id);
}, []);

// 改法 2：把"会变的值"用 useReducer/useRef 管理
// 改法 3：把不稳定的函数移进 effect 内部定义
```

## 7. 清理函数的三种标准形态

```jsx
// ① 订阅类：断开连接
useEffect(() => {
  const conn = createConnection(roomId);
  conn.connect();
  return () => conn.disconnect();
}, [roomId]);

// ② 定时器类：清除
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);

// ③ 请求类：作废/中止
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then(setData).catch(e => {
    if (e.name !== 'AbortError') setError(e);
  });
  return () => ctrl.abort();
}, [url]);
```

**严格模式（StrictMode）下 effect 会执行两次**（挂载 → 清理 → 再挂载）——这是故意帮你提前暴露"清理函数写漏了"的 bug。开发时别关它。

## 8. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| effect 死循环刷接口 | deps 里有每次渲染新建的对象/函数 | 依赖收敛为原始值；函数移入 effect |
| 读到旧 state/props | 闭包快照 + 依赖撒谎 | 函数式更新 / 补依赖 |
| 请求结果互相覆盖 | 竞态 | ignore 标志 / AbortController |
| 用 effect 同步 props 到 state | 派生状态反模式 | 渲染时计算 / key 重置 |
| 事件处理器里 effect 没更新 | effect 是旧快照闭包 | 数据用 ref 最新值或重设依赖 |
| StrictMode 下请求发两次 | 开发模式挂载-卸载-挂载 | 写好 cleanup，生产只执行一次 |

## 9. 与 class 生命周期的对照（迁移用）

| class 写法 | Hooks 写法 |
| --- | --- |
| componentDidMount | useEffect(fn, []) |
| componentDidUpdate | useEffect(fn, [deps])（含首次） |
| componentWillUnmount | useEffect 返回的清理函数 |
| shouldComponentUpdate | memo + 组件级判断（语义不同，见性能篇） |

**不要一对一翻译生命周期**——Hooks 的正确心智是"**按同步的外部系统拆分 effect**"：一个 effect 只管一件事（订阅就订阅、定时器就定时器），哪怕 class 时代它们挤在同一个 componentDidUpdate 里。

## 延伸阅读

- 站内：《useState 深度剖析：闭包陷阱与批处理》（姊妹篇）、《React Fiber 架构：可中断渲染》（effect 在 commit 阶段的执行位置）、《React 核心补充：Hooks 与状态管理》
- 站内参考资料：《React 官方：用 React 思考》（本地镜像 /post/ref-react-thinking）
- react.dev 官方《You Might Not Need an Effect》——本文 §5 的完整手册
