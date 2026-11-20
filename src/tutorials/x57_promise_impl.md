---
title: 手写 Promise：从规范到实现
category: Web 前端
order: 9
tags: [Promise, 异步编程, 源码实现, JavaScript]
summary: 按 Promises/A+ 规范逐条实现 Promise：三态机、then 链、值穿透、微任务与静态方法。
---

## 0. 为什么要手写

手写 Promise 不是面试表演——它逼你读懂 **Promises/A+ 规范**，而这份规范解释了你在日常使用中遇到的一切"怪现象"：为什么 then 回调总是异步执行、为什么链中间不写回调值也能穿透、为什么返回 Promise 会被"展开"。读完本文，`then` 链对你不再是黑盒。

规范原文结构：术语（1）→ 状态（2.1）→ then 方法（2.2）→ 解决过程（2.3）。我们的实现完全按这个骨架走。

## 1. 三态机：状态只能单向流动

规范 §2.1：Promise 有 pending（等待）、fulfilled（完成）、rejected（拒绝）三态，转换**不可逆且只能发生一次**：

```
pending ──resolve(value)──→ fulfilled   （值凝固为 value）
pending ──reject(reason)──→ rejected    （原因凝固为 reason）
```

"凝固"意味着：之后再调用 resolve/reject **静默无效**（不报错、不生效）。这就是为什么构造器里 `resolve()` 后再 `throw` 不会产生任何外部可见效果。

实现状态机：

```javascript
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    this.state = PENDING;
    this.value = undefined;          // fulfilled 的值 或 rejected 的原因
    this.callbacks = [];             // pending 期间收集的 {onFulfilled, onRejected}

    const resolve = (value) => {
      if (this.state !== PENDING) return;          // 不可逆
      this.state = FULFILLED;
      this.value = value;
      this.callbacks.forEach(cb => this.schedule(cb));
    };
    const reject = (reason) => {
      if (this.state !== PENDING) return;
      this.state = REJECTED;
      this.value = reason;
      this.callbacks.forEach(cb => this.schedule(cb));
    };

    try {
      executor(resolve, reject);     // executor 同步执行
    } catch (e) {
      reject(e);                     // 规范暗示：构造器抛错 → reject
    }
  }
}
```

**为什么需要 callbacks 队列**：Promise 可能已经 fulfilled 之后才有人调 then（比如先 resolve 再 then）——此时要直接用存好的 value 调回调；也可能 pending 时 then——回调必须先存起来。队列统一处理两种时序。

## 2. then 的异步保证：规范 §2.2.4

规范明确规定：`onFulfilled` / `onRejected` **必须在执行上下文栈清空之后**才被调用。这就是"then 回调总是异步"的规范依据——不是实现细节，是**必须**。

我们用 `queueMicrotask`（浏览器/Node 原生微任务 API）实现：

```javascript
schedule({ onFulfilled, onRejected }) {
  queueMicrotask(() => {
    if (this.state === FULFILLED) onFulfilled(this.value);
    else if (this.state === REJECTED) onRejected(this.value);
    // pending？不可能——schedule 只在状态凝固后调用
  });
}

then(onFulfilled, onRejected) {
  // 存入队列（pending 时）或立即调度（已凝固时）
  const cb = { onFulfilled, onRejected };
  if (this.state === PENDING) this.callbacks.push(cb);
  else this.schedule(cb);
  return ???;    // 见下一节：必须返回新 Promise
}
```

验证异步性：

```javascript
console.log('1');
new MyPromise(resolve => {
  console.log('2');        // executor 同步执行
  resolve();
}).then(() => console.log('4'));
console.log('3');
// 输出 1 2 3 4 —— then 回调永远在同步代码之后
```

## 3. then 必须返回新 Promise（§2.2.7）

`then` 返回**一个全新的 Promise**——这是链式调用的根基。新 Promise 的结果由回调的返回值决定（§2.2.7.1）：

| 回调行为 | 新 Promise 状态 |
| --- | --- |
| 返回普通值 x | fulfilled: x |
| 抛出异常 e | rejected: e |
| 返回 Promise p | 采用 p 的最终状态（展开，见 §5） |
| onFulfilled 不是函数（值穿透） | 透传上一个 value |
| onRejected 不是函数（异常穿透） | 透传上一个 reason |

```javascript
then(onFulfilled, onRejected) {
  const next = new MyPromise((resolve, reject) => {
    const schedule = () => queueMicrotask(() => {
      try {
        // 值穿透（§2.2.7.3）：非函数回调直接透传
        const real = this.state === FULFILLED
          ? (typeof onFulfilled === 'function' ? onFulfilled : v => v)
          : (typeof onRejected === 'function' ? onRejected : e => { throw e; });
        const result = real(this.value);
        resolvePromise(next, result, resolve, reject);   // 展开逻辑，见 §5
      } catch (e) {
        reject(e);
      }
    });

    if (this.state === PENDING) this.callbacks.push(schedule);
    else schedule();
  });
  return next;
}
```

**为什么是"新" Promise 而不是返回 this**：如果 then 返回自身，链式 `p.then(f).then(g)` 的两个回调会注册到同一个状态机上，f 的返回值永远到不了 g——链就断了。A+ 规范强制新实例。

## 4. 循环引用陷阱：x 不能是自己

`const p = p.then(() => p)` 会死循环——规范 §2.3.1 明确要求：**resolve 的值是 promise 自身时必须 reject TypeError**。这就是为什么 resolvePromise 需要拿到 next 自己做检查：

```javascript
function resolvePromise(promise2, x, resolve, reject) {
  if (x === promise2) {
    return reject(new TypeError('Chaining cycle detected'));
  }
  // …后续展开逻辑
}
```

## 5. 解决过程（The Promise Resolution Procedure §2.3）

then 回调返回值可能是：普通值、另一个 Promise、甚至 thenable（有 then 方法的对象）。处理优先级：

```
x 是 MyPromise 实例      → 采纳其状态（x.then(v => resolve(v), e => reject(e))）
x 是对象/函数且有 then   → thenable：调用 x.then，且只允许调用一次
其他                     → 直接 fulfill x
```

thenable 处理要防两个恶意模式：**多次调用 then 回调**（只认第一次）和 **反复变卦**（进入处理过程后锁定）。完整实现：

```javascript
function resolvePromise(promise2, x, resolve, reject) {
  if (x === promise2) return reject(new TypeError('Chaining cycle'));

  if (x instanceof MyPromise) {
    x.then(resolve, reject);                    // 采纳状态
    return;
  }

  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let called = false;                         // §2.3.3.3.3 只调用一次
    try {
      const then = x.then;                      // §2.3.3.1 取 then 可能抛错
      if (typeof then === 'function') {
        try {
          then.call(x,                          // this 绑定回 x
            y => {                              // y 又可能是 promise → 递归
              if (called) return; called = true;
              resolvePromise(promise2, y, resolve, reject);
            },
            r => {
              if (called) return; called = true;
              reject(r);
            });
        } catch (e) {
          if (called) return; called = true;
          reject(e);
        }
      } else {
        resolve(x);                             // 普通 object → 直接 fulfill
      }
    } catch (e) {
      if (called) return; called = true;
      reject(e);
    }
    return;
  }

  resolve(x);                                   // 基础类型
}
```

**为什么要递归处理 y**：thenable 的回调可能又返回 thenable——规范要求一直展开直到得到非 thenable 值。

## 6. catch / finally：全部是 then 的语法糖

```javascript
catch(onRejected) {
  return this.then(null, onRejected);
}

finally(callback) {
  return this.then(
    v => MyPromise.resolve(callback()).then(() => v),     // 等回调的 promise 落定，但透传原值
    e => MyPromise.resolve(callback()).then(() => { throw e; })
  );
}
```

finally 的语义要点：**回调返回值被忽略**（透传原值/原因），但**回调若返回 pending 的 Promise，会等它**——这就是"finally 里的清理动作是异步的也会被等待"的原因。

## 7. 静态方法：all / race / allSettled / any

```javascript
static resolve(v) {
  return v instanceof MyPromise ? v : new MyPromise(r => r(v));
}
static reject(e) { return new MyPromise((_, rej) => rej(e)); }

static all(promises) {
  return new MyPromise((resolve, reject) => {
    const list = Array.from(promises);
    const results = new Array(list.length);        // 结果按位置保序！
    let count = 0;
    if (list.length === 0) return resolve([]);
    list.forEach((p, i) => {
      MyPromise.resolve(p).then(v => {             // 兼容普通值混入
        results[i] = v;
        if (++count === list.length) resolve(results);
      }, reject);                                   // 任一失败 → 整体失败
    });
  });
}

static race(promises) {
  return new MyPromise((resolve, reject) => {
    for (const p of promises) {
      MyPromise.resolve(p).then(resolve, reject);   // 第一个落定的赢
    }
  });
}

static allSettled(promises) {
  return new MyPromise(resolve => {
    const list = Array.from(promises);
    const results = new Array(list.length);
    let count = 0;
    const settle = (i, status) => v => {
      results[i] = status === 'fulfilled'
        ? { status, value: v }
        : { status, reason: v };
      if (++count === list.length) resolve(results);
    };
    list.forEach((p, i) => MyPromise.resolve(p).then(settle(i, 'fulfilled'), settle(i, 'rejected')));
  });
}
```

**all 的两个细节**：结果数组**按下标保序**（与完成顺序无关）；空数组**同步立即 resolve([])**（规范行为，别忘特判）。race 的陷阱：空数组永远 pending——没有赢家。

## 8. 测试：与 A+ 官方测试套件对齐

社区有官方合规测试套件 promises-aplus/promises-tests（872 个用例）。接线方式——暴露适配器：

```javascript
MyPromise.deferred = function () {
  const dfd = {};
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
};
```

常见扣分点自查：then 回调没走微任务（§2.2.4 失败）；值穿透没实现；thenable 只展开一层；resolve 后状态仍可变。

## 9. 与原生 Promise 的差异边界

本文实现覆盖 A+ 规范全部要求，但原生 Promise 还有规范外能力：`Promise.any`（ES2021，首个 fulfilled 赢，全败抛 AggregateError）、`try`（ES2025 提案）、以及引擎级优化。手写版的 `queueMicrotask` 也与原生的微任务队列共享同一调度——顺序语义完全一致。

## 延伸阅读

- 站内：《事件循环深度剖析：宏任务微任务与调度》（姊妹篇：Promise 回调跑在哪个队列）、《async/await 原理：生成器与协程》（await 就是 then 的语法糖）
- 站内参考资料：《MDN 并发模型与事件循环》（本地镜像 /post/ref-mdn-eventloop）
- 《JavaScript 高级程序设计（第 4 版）》第 11 章——Promise 与异步的完整脉络
