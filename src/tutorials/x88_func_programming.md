---
title: 函数式编程入门：Haskell 思维与 Monad
category: 编程语言
order: 19
tags: [函数式编程, Haskell, Monad, 不可变]
summary: 纯函数、不可变、代数数据类型、Monad——从 Haskell 视角建立函数式的思维模型并反哺多范式编程。
---

## 1. 函数式的两大支柱：纯函数与不可变

**纯函数**：同样输入永远同样输出，且无副作用（不改外部状态、不做 I/O）：

```haskell
add :: Int -> Int -> Int     -- 类型签名：Int → Int → Int（Curry 化）
add a b = a + b              -- 纯：只依赖参数，无任何隐藏状态
```

纯函数的三重收益：**可推理**（不读源码就知道行为只由输入决定）、**可测试**（无需 mock 环境）、**可组合**（函数像积木随意拼装）。并发安全是白送的——不可变数据没有竞态（对比站内《useState 深度剖析》的 React 快照模型，思想同源）。

**不可变**：数据一旦创建不再修改——"改变"意味着创建新副本。这也是 React/Vue/Redux 状态管理的思想来源（不可变模型跨界通用）。

## 2. 一等函数与高阶函数：函数是值

函数可以当参数、当返回值——**高阶函数**是函数式的基本武器：

```haskell
-- map/filter/fold：数据处理三件套
map (*2) [1,2,3]                          -- [2,4,6]
filter (>1) [1,2,3]                       -- [2,3]
foldr (+) 0 [1,2,3]                       -- 6（折叠：用运算符把列表缩成一个值）
```

```javascript
// JS 等价——多范式语言的函数式工具
[1,2,3].map(x => x*2).filter(x => x>1);   // [2,4,6]
[1,2,3].reduce((acc,x) => acc+x, 0);      // 6
```

**组合优于配置**：小函数像管道一样拼装 `process = sort . filter . parse`——每段独立可测，整体行为一目了然。

## 3. 代数数据类型（ADT）：类型系统的积木

Haskell 的类型只有两种组合方式——**积类型（同时拥有）**与**和类型（二选一）**：

```haskell
-- 积类型：字段"相乘"（同时具备）
data Point = Point { x :: Double, y :: Double }

-- 和类型：可能"是其中之一"（用 | 分隔变体）
data Shape = Circle Double            -- 半径
           | Rectangle Double Double  -- 宽高

area :: Shape -> Double
area (Circle r)      = pi * r * r     -- 模式匹配：按变体分别处理
area (Rectangle w h) = w * h
```

**和类型是普通语言缺失的表达力**：JS 里"结果是字符串或错误"只能用返回 null/throw 约定；Haskell 用 `Either Error String` 把可能性写进类型——编译器强制你处理每个变体（漏分支 = 编译错误）。TypeScript 的联合类型 + 判别联合、Rust 的 enum 就是同构思想（见站内《TS 类型系统基础》）。

## 4. 模式匹配：按形状解构数据

```haskell
describeList :: [a] -> String
describeList []     = "空列表"
describeList [x]    = "只有一个: " ++ show x
describeList (x:xs) = "头部 " ++ show x ++ "，还有 " ++ show (length xs) ++ " 个"
-- 按数据形状分支处理，编译器检查覆盖完整性
```

模式匹配 + ADT = **把非法状态堵在编译期**：`data Maybe a = Nothing | Just a`——"可能没有值"显式建模，忘记处理 Nothing 直接编译报错（对比 null 在运行时炸裂， Tony Hoare 自称"十亿美元错误"的发明者）。

## 5. Monad：处理"上下文中的值"

Monad 解决的问题：**如何在"带有上下文的值"上做函数组合**。上下文可能是：可能失败（Maybe）、可能有多个结果（列表）、依赖 IO 时序、依赖状态……

```haskell
-- Maybe Monad：链式计算中任意一步失败，整体短路为 Nothing
safeDivide :: Double -> Double -> Maybe Double
safeDivide _ 0 = Nothing
safeDivide a b = Just (a / b)

calc = do
  x <- safeDivide 10 2      -- Just 5
  y <- safeDivide x 0       -- Nothing → 整个 do 短路
  return (y + 1)            -- 不会执行
-- calc = Nothing
```

**bind（>>=）的定义**就是这种短路链式的抽象：

```haskell
(>>=) :: Maybe a -> (a -> Maybe b) -> Maybe b
Nothing >>= _ = Nothing
Just x  >>= f = f x
```

**Monad 定律**（左单位元、右单位元、结合律）保证链式组合的合理行为。**理解口诀**：Monad = "可编程的分号"——每次 `x <- expr` 之间自动插入上下文的处理逻辑（Maybe 处理失败、IO 处理时序、List 处理多值分支）。

**降维理解**：JS 的 `Promise.then` 链、`Array.flatMap`、Python 的 `Optional` 处理——都是 Monad 思想的方言。学会 Maybe，`?.` 与 `??` 的设计意图全部看懂。

## 6. 函数式在多范式语言中的应用

| 语言 | 函数式特性 | 典型应用 |
| --- | --- | --- |
| JavaScript/TS | map/filter/reduce、不可变 Redux、可选链 | Redux reducer、RxJS |
| Java | Stream API、Optional、record | 数据管道 |
| Python | 生成器、functools、itertools | 数据处理流 |
| Rust | enum + match（ADT）、Option/Result、迭代器 | 全语言风格即 FP |

**反哺价值**：即便不写 Haskell，函数式原则——**纯逻辑与副作用分离**（核心纯、外壳处理 I/O）、**不可变优先**、**显式建模可能失败**——在任何语言都能提升代码质量。

## 7. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| Haskell 学不下去 | 抽象太早，缺"为什么" | 先写纯函数+ADT，最后才碰 Monad |
| JS reduce 嵌套难读 | 把 reduce 当 for 用 | 链式 map/filter 组合 |
| Python 默认参数用可变对象 | `def f(x=[])` 共享同一个列表 | 默认 None + 函数内新建 |
| 不可变导致性能差 | 频繁拷贝大集合 | 持久化数据结构（结构共享） |
| Monad 教程看不懂 | 都从范畴论讲起 | 从 Maybe 的失败短路入手（本文路径） |

## 8. 自测五题

1. 纯函数的两条定义与三重收益？
2. 和类型与积类型的区别？各自解决什么表达问题？
3. Maybe Monad 的短路链式如何消灭 if-null 判断？
4. Monad 定律保证什么？
5. "纯逻辑与副作用分离"如何在 JS 项目落地？

（答案均在正文对应小节。）

## 延伸阅读

- 站内：《Python 装饰器与生成器：闭包的两种应用》（闭包与惰性对照）、《TS 类型系统基础：结构化类型与收窄》《React 核心补充：Hooks 与状态管理》（不可变模型应用）
- 《Learn You a Haskell for Great Good!》（免费在线）——入门友好
- 《Functional Programming in Scala》红皮书——深度版
