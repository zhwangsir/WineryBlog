---
title: 编译原理入门：从源码到可执行
category: 计算机组成
order: 3
tags: [编译原理, 词法分析, 语法分析, LLVM]
summary: 词法→语法→语义→中间代码→优化的完整旅程——看懂编译器的同时看懂 Babel/V8/SQL 引擎。
---

## 1. 编译器就是翻译官

```
源代码 → [前端] → 中间表示(IR) → [优化] → [后端] → 机器码
```

编译器的核心洞察：**把"翻译"拆成语言相关的前端和平台相关的后端，中间用统一的 IR 衔接**。C/C++/Rust 都编译到 LLVM IR，LLVM 再为 x86/ARM/RISC-V 各写一份后端——M×N 的翻译问题变成 M+N。

为什么前端工程师也要懂编译原理？因为你每天都在用编译器：**Babel**（JS→JS 编译）、**V8**（JS→字节码→机器码 JIT）、**TypeScript**（类型检查就是语义分析）、**SQL 引擎**（查询解析与计划）、**正则引擎**、甚至 Tailwind 的类名扫描。原理同源。

## 2. 词法分析：字符流 → Token 流

**词法分析器（Lexer/Scanner）**把源码切成最小语义单元：

```
输入: int answer = 40 + 2;
输出: [KEYWORD int] [IDENT answer] [OP =] [NUM 40] [OP +] [NUM 2] [SEMI ;]
```

实现靠**有限状态机（DFA）**：逐字符走状态图，走不动了吐出一个 token。正则表达式引擎的本质就是 DFA/NFA——学编译原理顺便打通正则。

手写一个迷你 Lexer（识别数字和加号）：

```javascript
function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ') { i++; continue; }
    if (/[0-9]/.test(c)) {
      let num = '';
      while (i < src.length && /[0-9]/.test(src[i])) num += src[i++];
      tokens.push({ type: 'NUM', value: parseInt(num) });
    } else if (c === '+') { tokens.push({ type: 'PLUS' }); i++; }
    else throw new Error(`意外字符 ${c} @${i}`);
  }
  return tokens;
}
// tokenize("40 + 2") → [{type:'NUM',value:40},{type:'PLUS'},{type:'NUM',value:2}]
```

## 3. 语法分析：Token 流 → 语法树（AST）

**Parser** 按**文法**把 token 组织成树：

```
     Add
    /   \
 Num    Num
 40      2
```

主流方法是**递归下降**——每条文法规则写成一个函数，直观且是现代编译器主流（LLVM 的 clang、TS、V8 都是）：

```javascript
// 文法: expr = num (PLUS num)*
function parseExpr() {
  let node = { type: 'Num', value: expectNum() };
  while (peek().type === 'PLUS') {
    consume();                                   // 吃掉 +
    node = { type: 'Add', left: node, right: { type: 'Num', value: expectNum() } };
  }
  return node;                                   // 左结合的加法树
}
```

**AST 是编译器的中枢产物**——Babel 转换 ES6→ES5 就是"解析成 AST → 按规则改写 AST → 重新生成代码"。ESLint、Prettier、TS 类型推导全在 AST 上工作。

## 4. 语义分析：这棵树合法吗

语法对≠语义对。检查器遍历 AST：

- **符号表**：变量声明过吗？`int x = x + 1;` 未定义先使用 → 报错
- **类型检查**：`"abc" + 1.5` 合法吗（TS 的核心工作就在这层）
- **作用域链**：内层能看见外层，反过来不行

类型检查的两大学派：静态（编译时查，C/Java/TS）vs 动态（运行时查，Python/JS）。TS 类型系统其实是"附在 JS 上的语义分析层"——编译后类型全部擦除。

## 5. 中间代码与优化

前端把 AST 降级成 **IR**（三地址码/SSA 形式），优化器在 IR 上做与语言/平台无关的变换：

```
优化前:              优化后（常量折叠 + 死代码消除）:
t1 = 40 + 2          t1 = 42
t2 = t1 * 0          （删除——结果恒 0 且未被使用）
print(t2)
```

经典优化清单：常量折叠、死代码消除、循环不变量外提、内联、尾调用优化。**你写 JS 时感觉不到这些，但 V8 的 JIT 每天都在做**——知道它们存在，才能解释"为什么这段代码快那段慢"。

## 6. 目标代码生成

后端做指令选择（IR→机器指令）、寄存器分配（变量塞进 CPU 的十几个寄存器）、指令重排（流水线友好）。这部分被 LLVM 之类的成熟后端垄断，自研编译器基本都接 LLVM。

## 7. 动手路径（强烈推荐）

1. **写一个计算器**（本文 Lexer + Parser + 求值器，~100 行 JS）——打通全流程
2. **手写 JSON.parse**——递归下降解析的经典练习
3. **the-super-tiny-compiler**（GitHub，200 行的 Lisp→C 编译器，自带逐行讲解）
4. 用 Babel 插件改 AST——从前端视角玩编译
5. SQL Parser（sql.js/SQLite 源码）——看工业级 parser 怎么组织

## 延伸阅读

- 站内相关：《汇编语言入门：CPU 在想什么》《计算机组成：硬件架构与各种处理单元》《操作系统核心概念》
- 《 Crafting Interpreters》（craftinginterpreters.com 免费在线）——手把手写两个完整解释器，强烈推荐
- 《编译原理》（龙书）——理论圣经，配合实践食用
