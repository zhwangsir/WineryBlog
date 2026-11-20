---
title: CSS Grid 容器全属性指南
category: Web 前端
order: 5
tags: [CSS, Grid, grid-template, 前端]
summary: grid-template-columns/rows/areas 逐值解析、隐式与显式网格、auto-fill 与 minmax 组合、对齐体系。
---

## 0. Grid vs Flex 的一句话分工

Flex 管一维（一行或一列），Grid 管二维（行和列同时定义）。页面骨架用 Grid，组件内部排列用 Flex。本文只深挖**容器属性**（子项属性在姊妹篇）。

## 1. grid-template-columns：列轨道的定义

轨道（track）= 一列或一行。列宽定义支持四种单位混合：

```css
.grid {
  display: grid;
  grid-template-columns: 240px 1fr 2fr;    /* 固定 + 弹性比例 */
  /* 240px 固定，剩余空间按 1:2 分给两列 */
}
```

| 单位 | 含义 | 例 |
| --- | --- | --- |
| px / % | 固定/百分比 | `240px` |
| `fr` | 剩余空间的份数（fraction） | `1fr 2fr` |
| `minmax(min, max)` | 尺寸区间 | `minmax(200px, 1fr)` |
| `auto` | 内容决定，吃剩余 | `auto 1fr` |
| `fit-content(400px)` | 收缩到内容，上限 400px | 长文本列 |

**fr 的关键理解**：fr 分的是**剩余空间**，不是整个宽度。`1fr 1fr` 等宽的前提是没有固定列；有 `240px` 固定列时两个 `1fr` 平分的是 600-240=360px。

`minmax` 是自适应的灵魂：

```css
grid-template-columns: minmax(150px, 1fr) minmax(250px, 2fr);
/* 两列都不会窄于下限，剩余再按 1:2 分 */
```

## 2. auto-fill vs auto-fit：响应式网格的自动魔法

**本篇最重要的组合**——不写媒体查询实现自适应卡片网格：

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
```

逐层拆解：
- `repeat(N, X)`：重复定义 N 个轨道
- `auto-fill`：**按容器宽度尽可能多地放下** minmax 下限的列，放不下就换行（空轨道也保留占位）
- `auto-fit`：同 auto-fill，但**把空轨道折叠为 0**，让现有轨道拉伸填满整行

区别演示：容器 800px，卡片最小 260px，只有 2 个卡片
- `auto-fill`：生成 3 个轨道（800/260≈3），2 张卡片占前两格，第三格空
- `auto-fit`：生成后折叠空轨道 → 2 个轨道拉伸填满 800px（卡片变宽）

**选型**：卡片列表用 `auto-fill`（保持一致卡片宽度、右侧留白）；需要撑满的均分布局用 `auto-fit`。

## 3. grid-template-rows 与隐式网格

```css
.grid {
  grid-template-rows: 64px 1fr;        /* 显式定义 2 行 */
  grid-auto-rows: minmax(120px, auto); /* 第 3+ 行（隐式）的高度 */
}
```

**显式网格** = template 里写出来的轨道；**隐式网格** = 内容超出显式定义时自动生成的轨道。隐式行高默认 `auto`（由内容撑），用 `grid-auto-rows` 统一控制——瀑布流/看板每行固定高度全靠它：

```css
.kanban {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 160px;          /* 所有自动生成的行 160px */
}
```

同理 `grid-auto-flow` 控制自动放置方向（`row` 默认按行填充 / `column` 按列填充 / `dense` 回填空洞）。

## 4. grid-template-areas：像画格子一样布局

```css
.page {
  display: grid;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr 48px;
  gap: 16px;
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
```

规则：
- 每个字符串是一行，引号内每段是一个格子（列数必须一致）
- 同名区域可以是**矩形组合**（跨行跨列），但必须是矩形——L 形非法
- `.` 表示空格子

**响应式只需改一张图**：

```css
@media (max-width: 768px) {
  .page {
    grid-template-areas:
      "header"
      "main"
      "sidebar"
      "footer";
    grid-template-columns: 1fr;
  }
}
```

## 5. 子项跨行跨列（简写篇）

不用 areas 时用线号或 span：

```css
.span2col { grid-column: 1 / 3; }          /* 从第 1 条线到第 3 条线（跨 2 列） */
.span2row { grid-row: 2 / span 2; }        /* 从第 2 条线开始跨 2 行 */
.auto-place { grid-column: auto / span 2; }/* 自动放置 + 跨 2 列 */
```

**线号心智模型**：n 列网格有 n+1 条**列线**（1 到 n+1），线在格子之间不在格子上。`grid-column: 2 / 4` = 占第 2、3 格。

## 6. 对齐体系：Grid 与 Flex 同名不同层

Grid 的对齐分**三组**，比 Flex 多一层"轨道内部"：

| 组 | 属性 | 管 |
| --- | --- | --- |
| 容器级（轨道间） | `align-content` / `justify-content` | 所有轨道整体在容器里的分布（轨道总尺寸小于容器时） |
| 容器级（项目内） | `align-items` / `justify-items` | 每个项目在自己格子里的默认对齐 |
| 项目级 | `align-self` / `justify-self` | 单个项目覆写 |

```css
.grid {
  place-items: center;           /* align-items + justify-items 简写 —— 单行居中神器 */
}
.cell { place-self: center; }    /* 项目级简写 */
```

`justify-*` 管行内方向（水平），`align-*` 管块方向（垂直）。**Grid 里 center 一个元素只需 place-items: center**——比 Flex 的两行写法还简洁，面试常考的"完美居中"Grid 版答案。

## 7. gap 与间距

```css
.grid {
  gap: 16px;               /* 行列同距 */
  gap: 8px 24px;           /* row-gap column-gap */
  /* row-gap: 行与行之间；column-gap: 列与列之间 */
}
```

Grid 的 gap 语义比 Flex 更强（天然多行多列的间距系统）。轨道间视觉分隔线可用 1px gap + 背景色技巧：

```css
.table { display: grid; gap: 1px; background: #333; }
.table > * { background: #fff; }     /* 格子盖住背景，露出 1px 网格线 */
```

## 8. 陷阱大赏

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| `1fr 1fr` 不等宽 | 某列内容 min-content 超过 fr 计算 | 轨道改 `minmax(0, 1fr)` |
| 卡片内容溢出格子 | 网格项默认 `min-width: auto`（同 Flex） | `min-width: 0` + overflow |
| gap 后尺寸溢出容器 | 以为 fr 含 gap：gap 占额外空间 | 容器加 `box-sizing` 与溢出排查 / 少一条轨道 |
| areas 报错不生效 | 每行格子数不一致 / 区域非矩形 | 数格子；拆 L 形区域 |
| auto-fill 卡片宽不一致 | 嵌套容器宽度不同 | 统一容器宽度或用 minmax 上限 |

**`minmax(0, 1fr)`** 是 Grid 世界的 `min-width: 0`——等宽列被长内容撑爆时第一反应就是它。

## 9. 实战模板三则

```css
/* ① 自适应卡片墙（无媒体查询） */
.cards { display: grid; gap: 16px;
         grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

/* ② 文档站布局：侧栏/正文/目录，正文定宽居中 */
.docs { display: grid;
        grid-template-columns: 220px minmax(0, 1fr) 220px; }

/* ③ 仪表盘：不规则拼贴 */
.dash { display: grid; gap: 12px;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(3, 120px); }
.dash .big { grid-column: span 2; grid-row: span 2; }
```

## 延伸阅读

- 站内相关：《Flexbox 容器属性逐个击破》《Flexbox 子项属性详解》《CSS Grid 与响应式布局》（上一代的总览篇）
- 站内参考资料：《MDN Grid 布局核心概念》（本地镜像 /post/ref-mdn-grid）
- Grid Garden（游戏化练习）
