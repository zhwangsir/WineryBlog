---
title: async/await 原理：生成器与协程
category: Web 前端
order: 11
tags: [async, await, 生成器, 协程]
summary: 从生成器到自动执行器到 async 函数——JavaScript 协程演进的完整链条与 await 的全部行为细节。
---

## 1. 异步编写的演进：为什么最后长成这样

```
回调时代       doA(() => doB(() => doC(...)))          嵌套地狱
Promise 时代   doA().then(doB).then(doC)               链式但仍"声明式异类"
生成器时代     co(function*(){ yield doA(); yield doB() })  同步写法但需运行器
async/await    await doA(); await doB()                 语法糖最终形态
```

async/await 不是新机制——**它是"生成器 + Promise + 自动执行器"的语法糖**。理解这个等式，await 的一切行为（暂停、恢复、错误传播）都能推导出来。

## 2. 生成器：可暂停的函数

`function*` 声明生成器，`yield` 是暂停点。调用生成器**不执行函数体**，返回一个迭代器，每次 `next()` 执行到下一个 yield：

```javascript
function* gen() {
  console.log('start');                 // 第一次 next() 才执行
  const received = yield '第一步';       // 暂停；yield 右侧值"吐出"给 next()
  console.log('收到:', received);       // next(x) 的 x "注入"回 yield 表达式的值
  return 'done';
}

const it = gen();
console.log(it.next());                 // { value: '第一步', done: false }
console.log(it.next('注入的值'));        // 打印"收到: 注入的值"，返回 {value:'done', done:true}
```

**双向通信**是关键：`yield` 既向外吐值，`next(x)` 又向内传值——`yield` 表达式的求值结果就是注入的 x。这正好匹配异步：yield 出一个 Promise，异步完成后把结果注入回来。

## 3. 用生成器写"同步风格"的异步（2015 年 co 的原理）

```javascript
function run(genFn) {
  const it = genFn();
  function step(nextVal) {
    const { value, done } = it.next(nextVal);
    if (done) return value;
    // yield 出的是 Promise → 落定后把结果注入回去，继续驱动
    return Promise.resolve(value).then(
      v => step(v),
      e => it.throw(e)                   // Promise 失败 → 在 yield 处抛出
    );
  }
  return Promise.resolve(step());
}

run(function* () {
  const a = yield fetchA();              // 写法同步，实际异步
  const b = yield fetchB(a.id);
  return [a, b];
});
```

这就是 2015 年前后的 **co 库**。它证明了"同步风格写异步"可行，剩下的只差把这套机制内置到语言里。

## 4. async 函数 = 语法糖的对应关系

| async/await 写法 | 生成器等价物 |
| --- | --- |
| `async function f()` | `function* f()` + 自动运行 |
| `await p` | `yield p` |
| async 函数**必定返回 Promise** | run() 返回 Promise |
| await 处抛错 → reject | it.throw(e) → 生成器内捕获/抛出 |

```javascript
async function f() {
  const a = await fetchA();
  return a;                    // return 的值成为 resolve 值
}
// 严格等价于
function f() {
  return run(function* () {
    const a = yield fetchA();
    return a;
  });
}
```

**语言内置自动执行器后，不再需要 co**——每次调用 async 函数就隐式启动一个"微型协程"。

## 5. await 的行为细节（逐条揉碎）

### ① await 非 Promise 值也会让出控制权
```javascript
async function f() {
  console.log('1');
  await 42;                    // 不是 promise！
  console.log('2');
}
f();
console.log('3');
// 输出 1 → 3 → 2
```
await 右侧**先同步求值**，然后包装成已 resolve 的 Promise，续体（后面的代码）进**微任务队列**——即使值是普通常量，控制权也让出一次。

### ② await 一个 thenable 会展开
```javascript
await { then(res) { setTimeout(() => res('延迟 1s'), 1000); } }
// await 等它 1 秒后才继续 —— thenable 与 Promise 同等对待
```

### ③ 错误传播：try/catch 完全生效
```javascript
async function f() {
  try {
    await Promise.reject(new Error('炸了'));     // 相当于在 await 处 throw
    return '不会到这';
  } catch (e) {
    return '捕获: ' + e.message;
  }
}
```
await 处 reject = **在 await 位置 throw**。没有 try/catch → async 函数返回的 Promise 变 rejected → 调用方继续传播。

### ④ 并行陷阱：顺序 await = 串行
```javascript
// ✗ 串行：总耗时 = t1 + t2
const a = await fetchA();
const b = await fetchB();

// ✓ 并行：总耗时 = max(t1, t2)
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```
两条 await 之间**没有依赖**时必须并行——这是生产代码最常见的性能浪费点。

### ⑤ forEach 里的 await 不等待
```javascript
// ✗ 全部并发发出，forEach 不等 await
items.forEach(async item => await save(item));

// ✓ 要串行：for...of；要并发受控：Promise.all / map + all
for (const item of items) await save(item);              // 串行
await Promise.all(items.map(item => save(item)));        // 并行
```

## 6. 顶层 await（ES2022）

模块顶层（不在函数里）也可以 await——整个模块成为异步协程：

```javascript
// config.mjs
const config = await fetch('/config.json').then(r => r.json());
export default config;      // 导入本模块的其他模块会等它完成
```

导入者会被**阻塞**到顶层 await 完成——适合"必须先加载配置"的场景，但注意形成模块级串行链。

## 7. async/await vs .then 链：怎么选

| 维度 | async/await | .then 链 |
| --- | --- | --- |
| 可读性 | 同步线性，有 try/catch | 链式，嵌套深了难读 |
| 中间值传递 | 普通变量 | 需要闭包传值（链上取） |
| 条件分支/循环 | 自然（if/for 随便写） | 链中分支很别扭 |
| 错误处理 | try/catch | .catch |
| 并发表达 | Promise.all 包 await | then([a, b] => ...) |
| 过度使用 await 的风险 | 串行化本可并行的调用 | — |

默认用 async/await；已知无依赖的多步任务显式 Promise.all；then 链保留在简单一次性转换（`fetch().then(r => r.json())`）。

## 8. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| 顺序 await 导致接口变慢 | 无依赖却串行 | Promise.all 并行 |
| forEach + await 不生效 | forEach 不感知 Promise | for...of（串行）/ map+all（并行） |
| async 函数抛错没被捕获 | 调用方没 await 也没 catch | 调用方必须处理返回的 Promise |
| await 循环里依次请求很慢 | 串行化 | 收集 Promise 后 Promise.all |
| 忘记 await 导致拿到 Promise 对象 | async 函数返回值永远是 Promise | 调用处 await 或 .then |
| 顶层用 await 报错 | 非模块环境 | 改 .mjs / module script，或包一层 async IIFE |

## 9. 自测五题

1. `await 42` 后面的代码在哪个队列执行？
2. async 函数同步段抛错和 await 处抛错，捕获方式有区别吗？
3. `for...of + await` 与 `Promise.all(map)` 的语义差异？
4. await 一个普通对象 `{}` 会怎样？（提示：thenable 判定）
5. 为什么说 async 函数是"生成器 + co"的语法糖？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《手写 Promise：从规范到实现》《事件循环深度剖析：宏任务微任务与调度》《JavaScript 异步编程全解：事件循环、Promise 与 async/await》
- 站内参考资料：《MDN 并发模型与事件循环》（本地镜像 /post/ref-mdn-eventloop）
- 《深入理解 ES6》（Nicholas Zakas）第 8 章——生成器与 Promise
