---
title: TypeScript 泛型进阶：约束、推断与工具类型实现
category: Web 前端
order: 16
tags: [TypeScript, 泛型, 类型体操, 工具类型]
summary: 泛型约束、keyof/typeof、映射类型、条件类型与 infer——手写全部内置工具类型，读懂类型体操。
---

## 1. 泛型的本质：类型的"函数"

泛型参数就是**类型层面的形参**：`identity<T>(x: T): T` 接收一个类型 T，返回与它关联的类型。调用时"传类型"（显式）或"由实参推断"（隐式）：

```typescript
function identity<T>(x: T): T { return x; }

identity<string>('a');       // 显式传类型
identity('a');               // 推断：T = string
```

泛型的核心价值：**在保持类型信息的前提下复用逻辑**。`any` 也能"什么都能接"，但返回值类型信息丢失——泛型是类型安全的 any。

## 2. 泛型约束 extends：给类型参数立规矩

裸 T 太自由——"任何 T 都有 .length"是错的。用 extends 声明**最低要求**：

```typescript
function logLength<T extends { length: number }>(x: T): T {
  console.log(x.length);       // ✓ T 保证有 length
  return x;
}
logLength('abc');              // ✓ string 有 length
logLength([1, 2]);             // ✓ array 有 length
logLength(123);                // ✗ number 没有

// 约束 + keyof：安全取属性
function pick<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];             // ✓ K 保证是 T 的键
}
pick({ a: 1, b: 2 }, 'c');     // ✗ 'c' 不是键——编译期拦截！
```

`K extends keyof T` 是全 TS 最有用的约束模式：**key 只能是 obj 的真实键，返回值类型精确到 T[K]**——没有它，属性名拼错只能靠运行时发现。

## 3. keyof / typeof / 索引访问：三个取类型的操作符

```typescript
const config = { host: 'localhost', port: 3000, debug: true };

type Config = typeof config;            // 从"值"取类型：{ host: string; port: number; debug: boolean }
type Keys = keyof Config;               // 'host' | 'port' | 'debug'
type HostType = Config['host'];         // 索引访问：string
type AllValues = Config[keyof Config];  // string | number | boolean
```

| 操作符 | 输入 | 输出 |
| --- | --- | --- |
| `typeof v` | 一个**值** | 它的类型 |
| `keyof T` | 类型 | 其全部键的字面量联合 |
| `T['k']` | 类型 + 键 | 那个键的类型 |

三者的组合是所有高级类型操作的原语——工具类型、类型体操都建立在这上面。

## 4. 映射类型：批量改造类型的"循环"

```typescript
type MyPartial<T> = {
  [K in keyof T]?: T[K];       // 遍历 T 的每个键，值变为可选
};
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

`[K in keyof T]` 就是类型层面的 for 循环。再加**修饰符操作**（`?` 可加可减 `-?`、`readonly` 可加可减 `-readonly`）：

```typescript
type MyRequired<T> = { [K in keyof T]-?: T[K] };      // -? 移除可选
type MyMutable<T> = { -readonly [K in keyof T]: T[K] };  // 移除只读
```

## 5. 手写内置工具类型（全部主流工具类型实现）

```typescript
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyOmit<T, K extends keyof any> = MyPick<T, Exclude<keyof T, K>>;
type MyRecord<K extends keyof any, V> = { [P in K]: V };
type MyExclude<T, U> = T extends U ? never : T;
type MyExtract<T, U> = T extends U ? T : never;
type MyNonNullable<T> = T extends null | undefined ? never : T;
type MyReturnType<T extends (...a: any) => any> =
  T extends (...a: any) => infer R ? R : never;
type MyParameters<T extends (...a: any) => any> =
  T extends (...a: infer P) => any ? P : never;
type MyAwaited<T extends PromiseLike<any>> =
  T extends PromiseLike<infer U> ? MyAwaited<U> : T;      // 递归展开嵌套 Promise
```

逐个读懂：Omit = Pick 掉 Exclude 后的键；Exclude 用条件类型过滤联合成员；ReturnType 用 infer 从函数类型里"抽出"返回值类型。

## 6. 条件类型与 infer：类型层面的三元表达式

```typescript
type IsString<T> = T extends string ? true : false;
type A = IsString<'x'>;      // true
type B = IsString<42>;       // false
```

**infer 在 extends 右侧声明一个"待推断占位"**，编译器从匹配中反解出它：

```typescript
type Unpack<T> = T extends Array<infer Item> ? Item : T;
type X = Unpack<string[]>;       // string
type Y = Unpack<number>;         // number（不匹配 → 原样）

type ElementType<P> = P extends React.ComponentType<infer Props> ? Props : never;
```

infer 可以出现在几乎任何位置——元组解构、函数参数、Promise 链：

```typescript
type First<T extends unknown[]> = T extends [infer F, ...unknown[]] ? F : never;
type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;
```

## 7. 分布式条件类型：联合传入的"幽灵"行为

**裸类型参数**的条件类型（`T extends U ? X : Y`，T 是裸的泛型参数）遇到联合类型会**分布式展开**：

```typescript
type ToArray<T> = T extends any ? T[] : never;
type R = ToArray<string | number>;
// 不是 (string|number)[]！而是 string[] | number[]
// （联合每个成员分别通过条件，再联合结果）
```

需要"整体判断"时用 `[T] extends [U]` 禁用分布：

```typescript
type IsEqual<A, B> = [A] extends [B] ? true : false;   // 不分布的整体比较
```

还有一个著名陷阱：**never 在分布式条件下直接消失**（空联合没有成员可遍历）：

```typescript
type IsNever<T> = [T] extends [never] ? true : false;  // 必须包一层禁分布
type N1 = IsNever<never>;     // true —— 不包层会得到 never 而非 true
```

**分布式是绝大多数类型体操"看不懂"现象的元凶**——先问自己：这里分布了吗？

## 8. 模板字面量类型：字符串层面的类型运算

```typescript
type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<'click'>;          // 'onClick'

type Path = `/${string}/${string}`;
type Concat<A extends string, B extends string> = `${A}${B}`;
```

配合映射类型的 as 重映射，可以系统性转换键名：

```typescript
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
type G = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }
```

`string & K`（取交集转成 string）是 as 重映射中处理非 string 键的标准手法。

## 9. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| 条件类型结果和预期差一个联合 | 分布式展开 | `[T] extends [U]` 禁分布 |
| IsNever<never> 得到 never | 空联合分布消失 | 同上包层 |
| 泛型函数返回值变宽 | 推断到宽类型 | 泛型化函数或 as const |
| Omit 后仍可传多余键 | excess check 只对字面量 | 接口层用类型约束 |
| infer 匹配不到 | 类型不满足 extends 模式 | 检查结构，加辅助约束 |
| 递归类型爆栈 | 深层递归条件类型 | 拆步骤或降级为显式类型 |

## 延伸阅读

- 站内：《TypeScript 类型系统基础：结构化类型与收窄》（前置篇）、《TypeScript 进阶：泛型与类型体操入门》、《React 核心补充：Hooks 与状态管理》（泛型组件）
- 站内参考资料：《TS Handbook：泛型》（本轮抓取 /post/ref-ts-generics）、《TS Handbook：Everyday Types》（本地镜像 /post/ref-ts-handbook）
- 《Effective TypeScript》（Dan Vanderkam）——类型体操与设计权衡
