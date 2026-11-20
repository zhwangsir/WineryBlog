---
title: TypeScript 类型系统基础：结构化类型与收窄
category: Web 前端
order: 15
tags: [TypeScript, 类型收窄, 结构化类型, 前端]
summary: 结构化类型的兼容规则、联合与收窄的全部手段、unknown 与 any 的边界——类型系统的地基篇。
---

## 1. 结构化类型：TS 类型兼容的根本规则

TypeScript 是**结构化类型系统（structural typing）**——判断两个类型是否兼容，看的是"形状"，不是名字：

```typescript
interface Point { x: number; y: number }
class Coord { x = 0; y = 0 }

const p: Point = new Coord();      // ✓ 合法！Coord 的形状满足 Point
```

`Coord` 没有 `implements Point`，但它的**结构**包含 x/y 数字字段——类型检查通过。这与 Java/C# 的名义类型（nominal，必须显式声明实现关系）根本不同。

**推论**：多的不碍事，少的才报错：

```typescript
type Id = { id: number };
const user = { id: 1, name: 'bob', level: 3 };
const id: Id = user;               // ✓ user 的形状 ⊇ Id
```

这个规则解释了大量"TS 为什么让我过"的疑惑——**兼容判断永远看成员，不看来源**。

## 2. 基础标注速览

```typescript
let n: number = 1;
let s: string = 'x';
let b: boolean = true;
let arr: number[] = [1, 2];
let tup: [string, number] = ['age', 18];      // 元组：定长定型
let obj: { name: string; age?: number } = { name: 'x' };   // ? 可选
let fn: (a: string, b?: number) => boolean;   // 函数签名
let u: undefined; let nul: null;
```

`strictNullChecks`（必须开启）下 `null`/`undefined` 不能赋给其他类型——空安全的地基。可空标注用联合：`string | null`。

## 3. 联合与交叉：类型的组合代数

```typescript
type A = { a: () => void };
type B = { b: () => void };
type Union = A | B;     // 或：满足 A 或满足 B
type Inter = A & B;     // 且：同时满足两者

const u: Union = { a() {} };                       // ✓ 只要有 a
const i: Inter = { a() {}, b() {} };               // ✓ 两者都要
```

**交叉类型的陷阱**：把两个不兼容的类型交叉，得到的是 `never`：

```typescript
type Never = number & string;     // 没有值能同时是数字和字符串 → never
```

**联合类型的访问限制**：只能访问所有成员**共有**的属性——这正是收窄（narrowing）要解决的问题：

```typescript
function area(shape: Circle | Square) {
  shape.radius;   // ✗ Square 没有 radius——TS 只保证 shape 是两者之一
  // 必须先收窄
}
```

## 4. 类型收窄：让联合变具体的全部手段

| 收窄手段 | 适用 | 例 |
| --- | --- | --- |
| `typeof` | 原始类型 | `typeof x === 'string'` |
| 真值收窄 | null/undefined | `if (x)` / `x ?? 默认` |
| `in` | 对象属性存在性 | `'radius' in shape` |
| `instanceof` | 类实例 | `x instanceof Date` |
| 判别联合 | 带 tag 的对象联合（最常用！） | `shape.kind === 'circle'` |
| 自定义谓词 | 复杂判断复用 | `function isFish(x): x is Fish` |
| `as` 断言 | 你比 TS 更懂（慎用） | `x as HTMLElement` |

### 判别联合（discriminated union）——工程首选

给联合的每个成员加一个字面量 tag 字段：

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number };

function area(shape: Shape): number {
  switch (shape.kind) {                 // tag 收窄
    case 'circle': return Math.PI * shape.radius ** 2;   // shape: circle 分支
    case 'square': return shape.size ** 2;               // shape: square 分支
  }
}
```

好处：新增成员时 switch 走到 default 缺分支，配合 `never` 检查编译期报错：

```typescript
default: {
  const _exhaustive: never = shape;     // 漏分支 → 编译错误
  return _exhaustive;
}
```

### 自定义类型谓词

```typescript
function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every(i => typeof i === 'string');
}
if (isStringArray(data)) data.push('ok');   // 收窄生效
```

谓词函数体内必须是可靠的判断——**谎报类型会骗过编译器直达运行时错误**。

## 5. unknown vs any：两种"什么都可以"

| | any | unknown |
| --- | --- | --- |
| 可赋给任何类型 | ✓（双向自由） | 只能赋给 unknown/any |
| 直接调用方法/访问属性 | ✓ 无检查 | ✗ 必须先收窄 |
| 安全性 | 关闭检查（毒药） | 安全的 Top 类型 |

```typescript
let v: unknown = JSON.parse(input);
v.toFixed(2);            // ✗ 编译错误：先收窄
if (typeof v === 'number') v.toFixed(2);   // ✓

let a: any = JSON.parse(input);
a.anything.x.y;          // ✓ 编译通过——运行时炸雷
```

**纪律**：新代码禁止 any（团队 lint 强制）；第三方无类型的库返回值标 unknown，在使用点收窄。

## 6. 类型断言 as：你向编译器立军令状

```typescript
const el = document.getElementById('app') as HTMLDivElement;
el.addEventListener('click', handler);     // 没断言时 HTMLElement 缺该方法
```

断言不是转换——它**什么都不做**，只是让编译器闭嘴。断言错误 = 运行时错误（编译器不再保护）。两条红线：

1. `as any` 是类型系统开关——禁止出现于业务代码（一次性胶水除外，且要注释原因）
2. 双重断言 `x as unknown as SomeType` 说明类型设计有问题，回到建模层解决

## 7. 字面量类型与 const 断言

```typescript
let s = 'hello';            // 推断为 string（let 可变 → 放宽）
const c = 'hello';          // 推断为 'hello'（const 不可变 → 保留字面量）

const config = {            // 对象里的属性默认放宽为 string
  mode: 'production',
};                          // config.mode: string —— 传给字面量参数会报错！

const config2 = {           // ✓ as const 深度冻结字面量
  mode: 'production',
} as const;                 // config2.mode: 'production'
```

`as const` 是字面量联合、只读数组（`readonly [1, 2]`）的标配，常用于事件名、动作类型（Redux action type）。

## 8. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| 联合类型访问属性报错 | 只能访问共有成员 | 判别联合收窄 |
| 对象字面量多了属性报错 | 严格对象字面量检查（excess property check） | 变量中转或修类型定义 |
| `number & string` 处处报错 | 交叉出 never | 改联合或重新建模 |
| JSON.parse 后直接用 | 返回 any | 标 unknown + 收窄，或运行时校验库 |
| as 断言后运行时崩 | 谎报类型 | 用类型守卫代替断言 |
| 字面量传参报"string 不可赋给 'a'|'b'" | 对象属性推断放宽 | as const 或显式标注 |

## 9. 自测五题

1. TS 判断类型兼容的依据是什么？
2. 判别联合比 typeof 收窄好在哪？
3. `x is Fish` 谓词的意义与风险？
4. any 与 unknown 的赋值方向差异？
5. 对象属性为什么需要 as const 才保留字面量？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《TypeScript 进阶：泛型与类型体操入门》《TypeScript 泛型进阶：约束、推断与工具类型实现》《React 核心补充：Hooks 与状态管理》
- 站内参考资料：《TS Handbook：Everyday Types》（本地镜像 /post/ref-ts-handbook）、《TS Handbook：类型收窄》（本轮抓取 /post/ref-ts-narrowing）
- 《Programming TypeScript》（Boris Cherny）——类型系统设计思想
