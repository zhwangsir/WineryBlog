---
title: Flexbox 子项属性详解
category: Web 前端
order: 4
tags: [CSS, Flexbox, flex-grow, 前端]
summary: flex-grow/shrink/basis 三兄弟的完整算法、flex 简写陷阱、align-self 与 order——子项层的全部规则。
---

## 0. 本文定位

容器属性（上一篇）管"往哪摆"，**子项属性管"占多大、挤不挤、缩不缩"**。本文核心是 `flex` 简写背后的三兄弟——`flex-grow / flex-shrink / flex-basis`，把官方算法（flexbox spec §7.1.1）翻译成人话。

## 1. flex-basis：分配前的"基准尺寸"

`flex-basis` 决定子项在**分配剩余空间之前**的主轴尺寸：

```css
.item { flex-basis: 200px; }   /* 主轴基准 200px（flex-direction: row 时=宽度） */
.item { flex-basis: auto; }    /* 默认：看 width/height（内容尺寸） */
.item { flex-basis: 0; }       /* 当作没有基准，全部空间按 grow 分 */
```

计算顺序：`flex-basis` 优先于 `width`；`flex-basis: auto` 时回落到 `width`；`width: auto` 时回落到内容（max-content）。

## 2. flex-grow：剩余空间的分配权重

容器有剩余空间时，按 grow 的**比例**分配。公式：

```
每项获得 = 剩余空间 × (自己的 grow / 所有 grow 之和)
```

```css
/* 容器 600px，三个子项 basis 100px → 剩余 300px */
.a { flex-grow: 1; }   /* 分 300 × 1/3 = 100 → 最终 200px */
.b { flex-grow: 2; }   /* 分 300 × 2/3 = 200 → 最终 300px */
.c { flex-grow: 1; }   /* 分 100 → 200px */
```

**要点**：grow 分配的是**剩余空间**，不是整个容器。`flex: 1` 之所以能做"等分全宽"，是因为它同时把 basis 设为 0（见 §4）——三兄弟要一起理解。

## 3. flex-shrink：溢出时的收缩权重

空间不足（子项 basis 总和 > 容器）时按 shrink 收缩。**算法比 grow 复杂**：按"基准尺寸 × shrink"加权收缩（大元素多收缩，避免小元素被压没）：

```css
/* 容器 600px，三子项各 300px，总 900px → 溢出 300px */
/* 全部 shrink=1（默认）：加权 = 300×1，各收缩 300×(300/900) = 100 → 各 200px */
```

**为什么我的内容被压碎了？**——上一课的 `min-width: auto` 问题在 shrink 场景同样触发：子项收缩的极限不是 0，而是其内容的最小宽度（min-content）。长文本/表格会撑住不让缩：

```css
.item { min-width: 0; }              /* 允许压过内容宽度 */
.item p { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

**shrink: 0 的用途**：固定尺寸元素（图标、按钮、头像）显式设 `flex-shrink: 0`，防止被挤变形。这是真实项目里最高频的 flex 修复之一。

## 4. flex 简写：三个值的组合约定

```css
flex: 1            = flex-grow:1 flex-shrink:1 flex-basis:0%    ← 等分全宽
flex: auto         = flex-grow:1 flex-shrink:1 flex-basis:auto  ← 吃剩余但保内容基准
flex: none         = flex-grow:0 flex-shrink:0 flex-basis:auto  ← 完全不参与伸缩
flex: 0 0 200px    = 固定 200px，不伸不缩                        ← 固定尺寸
flex: 1 1 auto     = 默认（可伸可缩，以内容为基准）              ← 显式默认
```

**最著名的陷阱**：`flex: 1` 与 `flex: auto` 的区别——

```css
/* flex: 1（basis 0）：内容多少不影响分配，三项严格等宽 */
/* flex: auto（basis auto）：内容长的项分得更多 */

/* 场景：三栏等宽 → flex: 1
   场景：侧栏固定 + 主区自适应 → 侧栏 flex: none / 主区 flex: 1 */
```

**简写省略值的补全规则**（容易背错）：省略 grow=1、省略 shrink=1、省略 basis=0%。所以 `flex: 2` = `2 1 0%`——**不是** `2 1 auto`。

## 5. 完整分配算法（一次讲清）

浏览器计算 flex 布局的步骤（row 方向）：

```
1. 算基准：每项 basis（0%/auto/定值）
2. 汇总：sum(basis) vs 容器宽
3. 剩余空间 = 容器 - sum(basis)
   ├── 剩余 > 0 → 按 grow 加权分配剩余
   └── 剩余 < 0 → 按 shrink × basis 加权收缩（受 min-width 限制）
4. 交叉轴按 align-items/self 对齐或拉伸
```

记住这个流程，任何 flex 尺寸问题都能手推出来。

## 6. align-self：子项级别的对齐覆写

```css
.special { align-self: flex-end; }   /* 单个子项不跟容器 align-items 走 */
```

取值与 align-items 相同，外加 `auto`（默认，继承容器设置）。场景：一组顶对齐卡片里，某一张要垂直居中。

## 7. order：视觉重排

```css
.item { order: -1; }     /* 默认 order: 0，越小越靠前（同值按 DOM 顺序） */
```

**用途与警告**：
- 用途：无障碍/DOM 顺序保持语义（HTML 里按钮在标题后），视觉上按钮提前
- 警告：Tab 键焦点顺序**跟随 DOM 而非视觉**——order 重排会造成键盘导航乱序，无障碍审查会挂。仅用于纯视觉微调

## 8. 综合案例：聊天页面布局

```css
.chat { display: flex; flex-direction: column; height: 100vh; }

.chat .toolbar { flex: none; }               /* 工具栏固定高度 */
.chat .messages { flex: 1; overflow-y: auto; min-height: 0; }  /* 消息区吃剩余+可滚动 */
.chat .composer { flex: none; }

.chat .toolbar .settings { margin-left: auto; flex-shrink: 0; }  /* 推到右侧且不被压缩 */
```

四个决策点：谁固定（none）、谁伸缩（1）、哪里能滚（min-height: 0）、谁靠右（margin auto）。**"min-height: 0 + overflow"组合是 flex 滚动区能否生效的命门**——少了它，消息区会把整个页面撑高而不是内部滚动。

## 9. 自测十问

1. `flex: 1` 三个值分别是什么？
2. basis 为 0 和 auto 的分配差异？
3. 为什么 shrink 的收缩量不是纯比例？
4. min-width: auto 阻塞收缩怎么修？
5. order 对键盘导航的影响？
6. 单行容器 align-content 有效吗？
7. 图片在 flex 里溢出的原因？
8. 固定侧栏 + 自适应主区怎么写？
9. `flex: 2` 补全后的三个值？
10. margin: auto 和 justify-content 谁赢？

（答案全在上文，答不上来就回去重读对应小节。）

## 延伸阅读

- 站内相关：《Flexbox 容器属性逐个击破》《CSS Grid 容器全属性指南》《CSS 基础与弹性布局》
- 站内参考资料：《MDN Flexbox 基本概念》（本地镜像 /post/ref-ref-mdn-flex）
- Flexbox Zombies（游戏化深入课程）
