---
title: 事件循环深度剖析：宏任务微任务与调度
category: Web 前端
order: 10
tags: [事件循环, 微任务, 宏任务, JavaScript]
summary: 调用栈、任务队列、微任务清空规则、Node 阶段模型——从规范层面解释所有输出顺序题。
---

## 1. 单线程与事件循环的必然性

JavaScript 是**单线程**的：一个调用栈（call stack），同一时刻只执行一段代码。为什么不让它多线程？因为 DOM 的并发修改会让程序不可推理。单线程换来确定性，代价是异步——**耗时的 I/O 不能阻塞唯一的主线程**，所以需要宿主（浏览器/Node）提供任务队列，等主线程空闲时再回来执行回调。

**事件循环（Event Loop）**就是宿主环境里那个"永不停歇的调度器"：

```
while (true) {
  取一个宏任务（队首）→ 同步执行它
  清空全部微任务队列（执行期间新产生的微任务也插队清空）
  [浏览器] 必要时渲染（rAF 回调 → style → layout → paint）
}
```

调用栈空 ≠ 一轮结束——**微任务清空才算一轮结束**。

## 2. 宏任务与微任务：两种队列，两种时机

| | 宏任务（Task） | 微任务（Microtask） |
| --- | --- | --- |
| 来源 | setTimeout / setInterval、I/O、UI 事件回调、script（首段代码本身）、setImmediate(Node) | Promise.then/catch/finally、queueMicrotask、MutationObserver、process.nextTick(Node) |
| 执行时机 | 每轮循环只取**一个** | 本轮宏任务结束后**全部清空** |
| 队列 | 宏任务队列（多个源可能分队列） | 单一微任务队列 |
| 期间产生新任务 | 排到下一轮 | **插队：本轮清空时一并执行** |

**微任务插队规则的推论**：`then` 回调里再 `then`，后面的也会在同一轮全部执行完——直到微任务队列真正空了，浏览器才考虑渲染。这就是规范说的 "perform a microtask checkpoint"。

**setTimeout(fn, 0) 的真相**：0 并不意味着立即——HTML 规范规定嵌套层级 ≥5 后最小间隔钳制到 **4ms**；且它至少要等当前同步代码 + 全部微任务跑完。所以 `setTimeout(0)` 实际语义是"下一个宏任务轮"。

## 3. 经典输出题：一次讲清

```javascript
setTimeout(() => console.log('A'), 0);

Promise.resolve()
  .then(() => console.log('B'))
  .then(() => console.log('C'));

console.log('D');

// 输出：D → B → C → A
```

逐轮推演（脑子里画两个队列）：

```
同步阶段（本身就是首轮宏任务）：
  setTimeout 入宏任务队列 [A]
  Promise.then 入微任务队列 [B]
  console.log('D') 打印 D
同步结束 → 清空微任务：
  打印 B → 这个 then 返回新 promise，第二个 then 入微任务 [C]
  打印 C → 队列空
微任务空 → 取宏任务：打印 A
```

**进阶版**（微任务里产生宏任务 + 宏任务里产生微任务）：

```javascript
setTimeout(() => {
  console.log('A');
  Promise.resolve().then(() => console.log('B'));   // 宏任务里产生微任务
}, 0);

Promise.resolve().then(() => {
  console.log('C');
  setTimeout(() => console.log('D'), 0);            // 微任务里产生宏任务
});

// 输出：C → A → B → D
// C（微任务）注册 D 到宏任务队列；A 先在队列里所以先执行；
// A 执行后清微任务打 B；最后才是新宏任务 D
```

## 4. 渲染时机：rAF 与"每轮最多渲染一次"

浏览器的事件循环里，**渲染不是每个宏任务后都发生**（显示器 60Hz 时候至多每 16.7ms 一次）。渲染前有一站 **requestAnimationFrame（rAF）** 回调：

```
…清空微任务 → [若本轮决定渲染] rAF 回调 → style 计算 → layout → paint
```

两个工程要点：
1. **微任务会阻塞渲染**：微任务无限自喂（一个微任务里不断生成新微任务）会让渲染永远排不上——页面冻死。宏任务不会（每个宏任务后都有机会渲染）。
2. **连续多次修改 DOM 再读取布局**（读写交错）会触发强制同步 layout（layout thrashing）。把多次写合并、读取合并，或用 rAF 把读写分到不同帧。

```javascript
// 反模式：每帧读写交错 → n 次强制 layout
items.forEach(el => { el.style.height = el.scrollHeight + 1 + 'px'; });

// 正解：先读后写
const heights = items.map(el => el.scrollHeight);
items.forEach((el, i) => el.style.height = heights[i] + 1 + 'px');
```

## 5. Node 的事件循环：阶段模型

Node 的事件循环不是"一个宏任务队列"，而是**多个阶段按固定顺序轮转**：

```
┌ timers        ── 到期的 setTimeout / setInterval
├ pending       ── 上轮遗留的 I/O 回调
├ idle/prepare  ── 内部使用
├ poll          ── 取 I/O 事件（阻塞等待直到有任务或 timer 到期）
├ check         ── setImmediate 回调
└ close         ── 关闭回调（socket.on('close')）
```

Node 特有的两个"插队者"，优先级高于普通微任务：

- **process.nextTick**：每完成一个操作后**优先清空 nextTick 队列**（可能饿死 I/O，官方限制了深度）
- **Promise 微任务**：nextTick 队列清完后执行

```javascript
Promise.resolve().then(() => console.log('p1'));
process.nextTick(() => console.log('n1'));
Promise.resolve().then(() => console.log('p2'));

// 输出：n1 → p1 → p2   （nextTick 优先于 promise 微任务）
```

setTimeout vs setImmediate 的经典题：**主模块里 setTimeout(cb,0) 先于 setImmediate(cb)**（进 timers 阶段要等循环转回来，时序不定？不——主模块里 setTimeout 赢，因为 timers 阶段在 check 之前且 setImmediate 要等 poll）；但**在 I/O 回调内部 setImmediate 必赢**（poll 之后立即 check，无需等 timers 阈值）。这是 Node 面试的高频陷阱。

## 6. async/await 在事件循环中的位置

`await` 之后的代码 ≈ 包在 `Promise.resolve(值).then(续体)` 里——**await 暂停函数，续体进微任务队列**：

```javascript
async function f() {
  console.log('a');
  await null;                    // await 非 promise 值也要让出控制权
  console.log('b');              // b 在微任务里
}
f();
console.log('c');
// a → c → b
```

**"await 让出控制权"是理解一切 async 输出题的钥匙**：`await` 那一行的右侧表达式先同步求值，然后函数挂起，控制权交回调用者，续体排队。详见站内《async/await 原理：生成器与协程》。

## 7. 排查工具：让队列看得见

```javascript
// 打点法：区分宏/微任务时序
function trace(label) {
  queueMicrotask(() => console.log('micro:', label));
  setTimeout(() => console.log('task:', label), 0);
}

// Performance 面板：Main 线程看 Task（宏任务）粒度与 Long Task 警示
// console 里：
performance.mark('start');
// …被测代码…
performance.mark('end');
performance.measure('seg', 'start', 'end');
```

Chrome DevTools → Performance → 勾选 Screenshots，看每帧渲染时机；Tasks 轨道里 >50ms 会有 Long Task 标记（交互卡顿的直接证据）。

## 8. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| setTimeout 回调"慢了" | 前面有大量微任务/长任务 | 缩短同步段，任务分片 |
| 页面点不动但 CPU 不满 | 微任务自喂死循环 | 改宏任务分片（await 一次） |
| Promise.then 里 setState 后界面立即更新了？ | React 的自动批处理在微任务边界 flush | 无需处理，理解即可 |
| Node 里 nextTick 递归饿死 I/O | nextTick 队列优先级最高 | 换 setImmediate 分片 |
| rAF 里改样式又被读回 | 读写交错强制 layout | 先读后写分离 |

## 延伸阅读

- 站内：《手写 Promise：从规范到实现》（then 回调为什么进微任务）、《async/await 原理：生成器与协程》、《浏览器渲染原理与事件循环》（渲染管线细节）
- 站内参考资料：《MDN 并发模型与事件循环》（本地镜像 /post/ref-mdn-eventloop）
- Node 官方文档 The Event Loop, Timers, and process.nextTick()
