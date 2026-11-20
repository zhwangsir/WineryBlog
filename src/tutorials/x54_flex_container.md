---
title: Flexbox 容器属性逐个击破
category: Web 前端
order: 3
tags: [CSS, Flexbox, 前端, 布局]
summary: flex-direction、justify-content、align-items 等容器属性逐个深挖：每个值的行为、边界与陷阱。
---

## 0. 本文的前提

阅读本文前请先掌握 flexbox 的基本概念（见延伸阅读）。本文把容器上 6 个属性**逐个揉碎**：每个值到底怎么算、互相怎么影响、新人 99% 会踩的坑。建议打开 CodePen 边读边改。

```html
<!-- 全文共用这个骨架 -->
<div class="container">
  <div class="item a">A</div>
  <div class="item b">B</div>
  <div class="item c">C</div>
</div>
```

```css
.container { display: flex; width: 600px; height: 200px; }
.item { width: 100px; height: 50px; }
```

## 1. flex-direction：主轴在哪

这个属性决定一切——**其他所有属性的方向都以它定义的主轴/交叉轴为准**。

| 值 | 主轴 | 布局走向 |
| --- | --- | --- |
| `row`（默认） | 水平向右 | A B C 从左到右 |
| `row-reverse` | 水平向左 | C B A 从右到左 |
| `column` | 垂直向下 | A/B/C 从上到下 |
| `column-reverse` | 垂直向上 | C/B/A 从下到上 |

**陷阱 1：row-reverse / column-reverse 连带 justify-content 反转**。`row-reverse` + `justify-content: flex-start` 内容出现在**右侧**——flex-start 永远指主轴起点，主轴反了起点就反了。

**陷阱 2：column 下 height 的百分数失效**。`flex-direction: column` 的容器若没写显式高度，子项的 `height: 100%` 无法解析（百分比需要父级有确定高度）。移动端页面高度塌陷多源于此。

## 2. justify-content：主轴上的分配

容器内**有剩余空间**时怎么分配。5 个关键词 + 2 个安全值：

| 值 | 行为（主轴起点在左） |
| --- | --- |
| `flex-start`（默认） | 全部靠左，剩余空间在右 |
| `flex-end` | 全部靠右，剩余空间在左 |
| `center` | 居中 |
| `space-between` | 两端贴边，中间均分间隙 |
| `space-around` | 每项两侧等宽空隙（边缘空隙 = 中间的一半） |
| `space-evenly` | 所有空隙完全相等（含边缘） |

**核心辨析——space-around vs space-evenly**：`space-around` 每个元素的左右 margin 相等，相邻元素间隙 = 两个 margin 相加，所以中间大边缘小；`space-evenly` 是真正的等分。设计稿说"间距一致"用 evenly。

**空间不足时**：justify-content 无效（没有剩余空间可分配）——溢出行为由 flex-wrap 决定。

**陷阱：margin: auto 的优先级高于 justify-content**。子项设了 `margin-left: auto`，会吃掉所有剩余空间，justify-content 直接失效。这个"auto margin 吞空间"特性反而常被用来做"导航栏右侧推按钮"：

```css
.nav { display: flex; }
.nav .logout { margin-left: auto; }   /* 把登出按钮推到最右 */
```

## 3. align-items：交叉轴对齐

每个 flex 项在**交叉轴**上怎么放。理解它的钥匙是：**默认 stretch——交叉轴拉伸填满**。

| 值 | 行为（主轴水平时） |
| --- | --- |
| `stretch`（默认） | 高度拉伸填满容器（前提：没写 height！） |
| `flex-start` / `flex-end` / `center` | 顶 / 底 / 居中 |
| `baseline` | 按第一行文字基线对齐 |

**陷阱 1：写了 height 就看不到 stretch**。`align-items: stretch` 只拉伸"高度为 auto"的子项。布局错乱排查第一步：子项是不是被内容撑出了意料外的高度。

**陷阱 2：baseline 的判定源**。取每个子项**第一个行盒**的基线；子项内容为空时基线=盒底，会出现诡异的错位。给空元素留内容或改用其他对齐。

## 4. align-content：多行才生效的分配器

`align-content` 管**多根轴线**（flex-wrap: wrap 产生多行）之间在交叉轴怎么分配。**单行 flex（默认 nowrap）时它完全无效**——这是新人第二大坑："我设置了 align-content: center 为什么没反应？"

因为单行时没有"行间空间"，应该用 `align-items: center`。

```css
/* 期望垂直居中却失败的反例 */
.container {
  display: flex;
  flex-wrap: wrap;
  align-content: center;    /* 只有一行 → 无效 */
}

/* 正解 */
.container {
  display: flex;
  align-items: center;      /* 单行用 items */
}
```

## 5. flex-wrap：换行

| 值 | 行为 |
| --- | --- |
| `nowrap`（默认） | 挤在一行：子项收缩（见子项 flex-shrink）也不换行 |
| `wrap` | 放不下就换行 |
| `wrap-reverse` | 换行但新行放在上方（反转交叉轴方向） |

**陷阱：默认 nowrap 下图片会溢出**。`display: flex` 容器里的图片默认不会收缩（img 有固有宽度），会横向溢出容器。修法：

```css
.container img {
  max-width: 100%;      /* 或 min-width: 0 / flex-shrink: 1 显式声明 */
}
```

还有一个更隐蔽的坑：**flex 子项默认 `min-width: auto`**——子项内容的固有最小宽度会阻止收缩（长单词/长 URL 撑破布局）。修法：

```css
.item { min-width: 0; }   /* 允许收缩到小于内容宽度，配合 overflow 处理 */
```

## 6. gap：间隙的最佳实践

```css
.container {
  gap: 16px;            /* 行列都 16px */
  gap: 8px 24px;        /* row-gap 8px, column-gap 24px */
}
```

gap 取代了历史遗留的 `margin` 技巧（`.item + .item { margin-left: 16px }` 或 `margin: 0 -8px` 负边距）。三个优点：

1. **不用处理首尾**：第一项左、最后一项右天然无边距
2. **换行安全**：wrap 换行后行与行之间也有 gap（margin 技巧需要额外处理）
3. **语义清晰**：间隙就是间隙，不是 margin 的副作用

兼容性：Chrome 84+/Safari 14.1+ 起完整支持 flex gap，2021 年后的项目可以放心用。

## 7. flex-flow：简写

`flex-flow: row wrap` = `flex-direction: row; flex-wrap: wrap;`。写简写可以让意图更紧凑，但团队协作建议全写展开——**显式比简短可读**。

## 8. 陷阱大赏（复盘速查）

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| `justify-content: center` 没居中 | 子项有 margin: auto / 容器没宽度 | 去掉 auto / 给宽度 |
| `align-content` 没反应 | 单行无行间空间 | 用 align-items |
| 长文本撑破 flex 布局 | 子项 min-width: auto | `min-width: 0` + overflow |
| 图片在 flex 里溢出 | img 固有宽度不收缩 | `img { max-width: 100% }` |
| column 里 height:100% 失效 | 父无显式高度 | 父给 height 或用 flex 拉伸 |
| 内容跑到了右边 | row-reverse + flex-start | 认清主轴方向 |

## 9. 组合练习：三个高频布局

```css
/* ① 完美居中（单元素） */
.center { display: flex; justify-content: center; align-items: center; }

/* ② 圣杯布局：头/侧栏/主/尾 */
.holy { display: flex; flex-direction: column; min-height: 100vh; }
.holy .body { display: flex; flex: 1; }
.holy aside { width: 240px; }
.holy main { flex: 1; }

/* ③ 卡片底部分页器：左对齐页码 + 右对齐跳页 */
.pager { display: flex; align-items: center; gap: 8px; }
.pager .jump { margin-left: auto; }
```

## 延伸阅读

- 站内相关：《Flexbox 子项属性详解》（姊妹篇：grow/shrink/basis 三兄弟）、《CSS Grid 容器全属性指南》《CSS 基础与弹性布局》
- 站内参考资料：《MDN Flexbox 基本概念》（本地镜像 /post/ref-ref-mdn-flex）
- Flexbox Froggy（游戏化练习，24 关通关即入门）
