---
title: Vue 响应式原理：从 defineProperty 到 Proxy
category: Web 前端
order: 17
tags: [Vue, 响应式, Proxy, 前端]
summary: 数据变→视图自动更新的机制全貌：defineProperty 的局限、Proxy 的全面拦截、依赖收集与派发。
---

## 1. 响应式要解决的根本问题

```javascript
const state = { count: 0 };
state.count = 1;               // 数据变了
// 视图凭什么知道要更新？
```

普通对象赋值只是一个内存写操作——**视图层毫无感知**。响应式系统要在"数据被读写"时自动执行副作用（重新渲染/重新计算）。两条技术路线：

| | Vue 2 | Vue 3 |
| --- | --- | --- |
| 拦截手段 | `Object.defineProperty` 逐属性 getter/setter | `Proxy` 代理整个对象 |
| 拦截范围 | 已存在的属性（读/写） | 全部 13 种操作（读写/删除/新增/in/遍历） |
| 数组 | 重写 7 个变异方法（hack） | 原生支持 |
| 动态新增属性 | 无法侦测（需 `$set`） | 原生支持 |

## 2. Vue 2：defineProperty 的能力与死角

```javascript
Object.defineProperty(obj, 'count', {
  get() { track(); return value; },      // 读取时收集依赖
  set(v) { value = v; trigger(); },      // 写入时派发更新
});
```

defineProperty 只能拦截**已声明属性**的读写。四大死角：

1. **新增属性**：`obj.newKey = 1` 无 setter → 不响应（需 `Vue.set(obj, 'newKey', 1)`）
2. **删除属性**：`delete obj.key` 无 delete 拦截（需 `Vue.delete`）
3. **数组下标赋值**：`arr[0] = x` 走的是索引操作不是属性 setter（需重写 push/splice 等 7 个方法）
4. **初始化成本**：递归遍历整个 data 树逐个 defineProperty——大对象初始化慢

Vue 2 对数组的 hack：劫持原型链——把数组实例的原型指向"重写了 push/pop/splice/shift/unshift/sort/reverse 的对象"（这 7 个恰好是会改变数组长度的变异方法），拦截后手动派发更新。`arr[3] = x` 这类下标写法依然无法拦截——**这就是 Vue 2 文档反复强调"不要用下标改数组"的底层原因**。

## 3. Vue 3：Proxy 的全面拦截

```javascript
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      track(target, key);                        // 读取时收集依赖
      const res = Reflect.get(target, key, receiver);
      return isObject(res) ? reactive(res) : res; // 惰性深代理
    },
    set(target, key, value, receiver) {
      const old = target[key];
      const ok = Reflect.set(target, key, value, receiver);
      if (ok && old !== value) trigger(target, key);  // 写入时派发更新
      return ok;
    },
    deleteProperty(target, key) {
      const ok = Reflect.deleteProperty(target, key);
      if (ok) trigger(target, key, 'delete');
      return ok;
    },
    has(target, key) { track(target, key); return Reflect.has(target, key); },
    ownKeys(target) { track(target, ITERATE_KEY); return Reflect.ownKeys(target); },
  });
}
```

Proxy 拦截的是**对对象的操作本身**——新增/删除/下标/遍历全覆盖，四大死角全解。`Reflect.*` 保证 receiver 正确传递（继承场景的 getter this 指向）。

**惰性深代理**：`reactive(res)` 只在属性被读取时才包装嵌套对象——初始化成本从 O(全树) 降到 O(1)（对比 Vue 2 的递归observe）。

## 4. 依赖收集与派发：三级存储

```javascript
// WeakMap → Map → Set
// targetMap: 原始对象 → (key → 依赖集合)
let activeEffect = null;          // 当前正在运行的副作用

function track(target, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Map()));
  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, (dep = new Set()));
  dep.add(activeEffect);          // 建立联系：这个 key 被 activeEffect 读取过
}

function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key);
  dep?.forEach(effect => effect());   // 通知所有读过这个 key 的副作用
}
```

**为什么用 WeakMap 存 targetMap**：键是原始对象（弱引用）——对象销毁时依赖记录自动被 GC，无泄漏。

**effect 嵌套问题**：effect A 内运行 effect B，B 结束后 activeEffect 若不恢复，A 后续的读取会错误收集到 B。解法：**effect 栈**——进入 push，退出 pop，track 永远取栈顶。这是源码里的经典细节。

## 5. 与 React 不可变模型的对比辨析

| | Vue 响应式 | React setState |
| --- | --- | --- |
| 更新方式 | 直接改对象（Proxy 拦截） | 不可变替换（创建新对象） |
| 精确度 | 属性级依赖追踪，只更新订阅者 | 组件级，state 变则整个组件重跑 |
| 心智负担 | 无需展开拷贝 | 必须 `...spread`（漏了不更新） |
| 底层 | 运行时拦截 | 快照 + 重新执行 |

React 选不可变的原因：**并发渲染**需要"状态可回放、可比较"（快照模型天然支持）；Vue 用追踪模型换更少的样板代码。两套模型不能混——在 Vue 里做不可变展开是浪费，在 React 里直接改属性是 bug。

## 6. 编译优化：静态提升与 Patch Flag

Vue 3 的编译器在模板编译期做静态分析，把优化信息写进渲染函数：

```html
<div>
  <h1>标题</h1>                        <!-- 静态节点 → 提升到 render 外，diff 时跳过 -->
  <p :class="cls">{{ msg }}</p>        <!-- 动态：class + text → patch flag = CLASS|TEXT -->
</div>
```

- **静态提升**：纯静态节点只创建一次
- **Patch Flags**：给动态节点打位图标记——diff 时**只比对 flag 声明的字段**（class/text/props...），跳过其余属性比较
- **Block Tree**：动态节点被收集进扁平 block 数组——diff 从"整树递归"变成"遍历动态节点数组"，节点数从 O(全树) 降到 O(动态节点数)

这套编译期优化是 Vue 3 性能飞跃的第二支柱（第一是 Proxy）。

## 7. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| Vue2 新增属性不更新 | defineProperty 无法侦测新增 | $set / 换 Vue3 / 整体替换对象 |
| Vue2 下标赋值不更新 | 索引写法绕过 setter | splice / 换 Vue3 |
| 解构 reactive 后失去响应 | 解构拿到的是原始值 | `toRefs(state)` 保持链接 |
| reactive 对象整体替换失效 | Proxy 引用被换掉 | 逐字段赋值或用 ref |
| ref 在模板自动解包、在 JS 要 .value | 模板编译器自动 unwrap | JS 侧统一 `.value` 访问 |
| Vue3 watch 数组整组变化 | watch 默认浅比较 | `{ deep: true }` 或监听 getter |

## 8. 自测五题

1. defineProperty 的四大死角分别是什么？
2. Proxy 拦截了哪些 defineProperty 做不到的操作？（至少三个）
3. targetMap 为什么用 WeakMap？
4. Vue 3 的惰性深代理省了什么成本？
5. Patch Flag 让 diff 的复杂度从什么变成什么？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《React Fiber 架构：可中断渲染》（响应式 vs 快照模型的另一半）、《一文懂 Proxy》《React 核心补充：Hooks 与状态管理》
- Vue 官方文档《深入响应式系统》（源码级讲解）
- 《Vue.js 设计与实现》（霍春阳）——本文的完整展开版
