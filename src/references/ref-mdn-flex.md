---
title: flex 布局的基本概念 - CSS：层叠样式表
category: 参考资料
source: `https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox`
summary: 本地镜像：flex 布局的基本概念 - CSS：层叠样式表（原文 developer.mozilla.org）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：`https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox`

# flex 布局的基本概念

Flexible Box 模型，通常被称为 flexbox，是一种一维的布局模型。它给 flexbox 的子元素之间提供了强大的空间分布和对齐能力。本文给出了 flexbox 的主要特性，更多的细节将在别的文档中探索。

我们说 flexbox 是一种一维的布局，是因为一个 flexbox 一次只能处理一个维度上的元素布局，一行或者一列。作为对比的是另外一个二维布局 CSS Grid Layout，可以同时处理行和列上的布局。

## 本文内容

*   flexbox 的两根轴线
*   起始线和终止线
*   Flex 容器
*   用 flex-wrap 实现多行 Flex 容器
*   简写属性 flex-flow
*   flex 元素上的属性
*   元素间的对齐和空间分配
*   下一步

## flexbox 的两根轴线

当使用 flex 布局时，首先想到的是两根轴线 — 主轴和交叉轴。主轴由 `flex-direction` 定义，另一根轴垂直于它。我们使用 flexbox 的所有属性都跟这两根轴线有关，所以有必要在一开始首先理解它。

### 主轴

主轴由 `flex-direction` 定义，可以取 4 个值：

*   `row`
*   `row-reverse`
*   `column`
*   `column-reverse`

如果你选择了 `row` 或者 `row-reverse`，你的主轴将沿着**行向**延伸。

（图：Image 8: 当主轴方向设置为 row 时，主轴沿着行向延伸）

选择 `column` 或者 `column-reverse` 时，你的主轴会沿着页面的上下方向延伸——也就是**块向**。

（图：Image 9: 当主轴方向设置为 column 时，主轴沿着块向延伸）

### 交叉轴

交叉轴垂直于主轴，所以如果你的`flex-direction`（主轴）设成了 `row` 或者 `row-reverse` 的话，交叉轴的方向就是沿着上下方向延伸的。

（图：Image 10: 当主轴方向设置为 row 时，交叉轴的方向沿着块向延伸）

如果主轴方向设成了 `column` 或者 `column-reverse`，交叉轴就是水平方向。

（图：Image 11: 当主轴方向设置为 column 时，交叉轴的方向沿着行向延伸）

理解主轴和交叉轴的概念对于对齐 flexbox 里面的元素是很重要的；flexbox 的特性是沿着主轴或者交叉轴对齐之中的元素。

## 起始线和终止线

另外一个需要理解的重点是 flexbox 不会对文档的书写模式提供假设。过去，CSS 的书写模式主要被认为是水平的，从左到右的。现代的布局方式涵盖了书写模式的范围，所以我们不再假设一行文字是从文档的左上角开始向右书写，新的行也不是必须出现在另一行的下面。

你可以在接下来的文章中学到更多 flexbox 和书写模式关系的详细说明。下面的描述是来帮助我们理解为什么不用上下左右来描述 flexbox 元素的方向。

如果 `flex-direction` 是 `row`，并且我是在书写英文，那么主轴的起始线是左边，终止线是右边。

（图：Image 12: 书写英文时，主轴的起始线是左边）

如果我在书写阿拉伯文，那么主轴的起始线是右边，终止线是左边。

（图：Image 13: 书写阿拉伯文时，主轴的起始线是右边）

在这两种情况下，交叉轴的起始线是 flex 容器的顶部，终止线是底部，因为两种语言都是水平书写模式。

之后，你会觉得用起始和终止来描述比左右更合适，这会对你理解其他相同模式的布局方法（例如：CSS Grid Layout）起到帮助的作用。

## Flex 容器

文档中采用了 flexbox 的区域就叫做 flex 容器。为了创建 flex 容器，我们把一个容器的 `display` 属性值改为 `flex` 或者 `inline-flex`。完成这一步之后，容器中的直系子元素就会变为 **flex 元素**。由于所有 CSS 属性都会有一个初始值，所以 flex 容器中的所有 flex 元素都会有下列行为：

*   元素排列为一行（`flex-direction` 属性的初始值是 `row`）。
*   元素从主轴的起始线开始。
*   元素不会在主维度方向拉伸，但是可以缩小。
*   元素被拉伸来填充交叉轴大小。
*   `flex-basis` 属性为 `auto`。
*   `flex-wrap` 属性为 `nowrap`。

这会让你的元素呈线形排列，并且把自己的大小作为主轴上的大小。如果有太多元素超出容器，它们会溢出而不会换行。如果一些元素比其他元素高，那么元素会沿交叉轴被拉伸来填满它的大小。

### 更改 flex 方向 flex-direction

在 flex 容器中添加 `flex-direction` 属性可以让我们更改 flex 元素的排列方向。设置 `flex-direction: row-reverse` 可以让元素沿着行的方向显示，但是起始线和终止线位置会交换。

把 flex 容器的属性 `flex-direction` 改为 `column`，主轴和交叉轴交换，元素沿着列的方向排列显示。改为 `column-reverse`，起始线和终止线交换。

下面的例子中，`flex-direction` 值为 `row-reverse`。尝试使用其他的值 `row` ，`column`，`column-reverse`，看看内容会发生什么改变。

## 用 flex-wrap 实现多行 Flex 容器

虽然`flexbox`是一维模型，但可以使我们的`flex`项目应用到多行中。在这样做的时候，你应该把每一行看作一个新的`flex`容器。任何空间分布都将在该行上发生，而不影响该空间分布的其他行。

为了实现多行效果，请为属性`flex-wrap`添加一个属性值`wrap`。现在，如果你的项目太大而无法全部显示在一行中，则会换行显示。下面的实时例子包含已给出宽度的项目，对于`flex`容器，项目的子元素总宽度大于容器最大宽度。由于`flex-wrap`的值设置为`wrap`，所以项目的子元素换行显示。若将其设置为`nowrap`，这也是初始值，它们将会缩小以适应容器，因为它们使用的是允许缩小的初始`Flexbox`值。如果项目的子元素无法缩小，使用`nowrap`会导致溢出，或者缩小程度还不够小。

参见掌握弹性物件的包装指南，以了解更多有关弹性物件包装的信息。

## 简写属性 flex-flow

你可以将两个属性 `flex-direction` 和 `flex-wrap` 组合为简写属性 `flex-flow`。第一个指定的值为 `flex-direction` ，第二个指定的值为 `flex-wrap`.

在下面的例子中，尝试将第一个值修改为 `flex-direction` 的允许取值之一，即 `row`, `row-reverse`, `column` 或 `column-reverse`, 并尝试将第二个指定值修改为 `wrap` 或 `nowrap`。

## flex 元素上的属性

为了更好地控制 flex 元素，有三个属性可以作用于它们：

*   `flex-grow`
*   `flex-shrink`
*   `flex-basis`

在这里，我们只会大概介绍一下它们的用法，更详细的细节请参阅其他的文章。

在考虑这几个属性的作用之前，需要先了解一下**可用空间**（available space）这个概念。这几个 flex 属性的作用其实就是改变了 flex 容器中的可用空间的行为。同时，可用空间对于 flex 元素的对齐行为也是很重要的。

假设在 1 个 500px 的容器中，我们有 3 个 100px 宽的元素，那么这 3 个元素需要占 300px 的宽，剩下 200px 的可用空间。在默认情况下，flexbox 的行为会把这 200px 的空间留在最后一个元素的后面。

（图：Image 14: 这个 Flex 容器在布置元素后还有可用空间）

如果期望这些元素能自动地扩展去填充满剩下的空间，那么我们需要去控制可用空间在这几个元素间如何分配，这就是元素上的那些 `flex` 属性要做的事。

### Flex 元素属性：`flex-basis`

`flex-basis` 定义了该元素的**空间大小**，flex 容器里除了元素所占的空间以外的富余空间就是**可用空间**。该属性的默认值是 `auto`。此时，浏览器会检测这个元素是否具有确定的尺寸。在上面的例子中，所有元素都设定了宽度（width）为 100px，所以 `flex-basis` 的值为 100px。

如果没有给元素设定尺寸，`flex-basis` 的值采用元素内容的尺寸。这就解释了：我们给只要给 Flex 元素的父元素声明 `display: flex`，所有子元素就会排成一行，且自动分配大小以充分展示元素的内容。

### Flex 元素属性：`flex-grow`

`flex-grow` 若被赋值为一个正整数，flex 元素会以 `flex-basis` 为基础，沿主轴方向增长尺寸。这会使该元素延展，并占据此方向轴上的可用空间（available space）。如果有其他元素也被允许延展，那么他们会各自占据可用空间的一部分。

如果我们给上例中的所有元素设定 `flex-grow` 值为 1，容器中的可用空间会被这些元素平分。它们会延展以填满容器主轴方向上的空间。

flex-grow 属性可以按比例分配空间。如果第一个元素 `flex-grow` 值为 2，其他元素值为 1，则第一个元素将占有 2/4（上例中，即为 200px 中的 100px）, 另外两个元素各占有 1/4（各 50px）。

### Flex 元素属性：`flex-shrink`

`flex-grow`属性是处理 flex 元素在主轴上增加空间的问题，相反`flex-shrink`属性是处理 flex 元素收缩的问题。如果我们的容器中没有足够排列 flex 元素的空间，那么可以把 flex 元素`flex-shrink`属性设置为正整数来缩小它所占空间到`flex-basis`以下。与`flex-grow`属性一样，可以赋予不同的值来控制 flex 元素收缩的程度——给`flex-shrink`属性赋予更大的数值可以比赋予小数值的同级元素收缩程度更大。

在计算 flex 元素收缩的大小时，它的最小尺寸也会被考虑进去，就是说实际上 flex-shrink 属性可能会和 flex-grow 属性表现的不一致。因此，我们可以在文章《控制 Flex 子元素在主轴上的比例》中更详细地看一下这个算法的原理。

**备注：**在给 `flex-grow` 和 `flex-shrink` 赋值时要注意比例。如果我们给所有 flex 元素的 flex 属性赋值为 `1 1 200px` ，并且希望其中一个元素可以增加到 2 倍，我们可以给该元素的 flex 属性赋值为`2 1 200px`。当然，你也可以选择赋值为 flex: `10 1 200px` 和 flex: `20 1 200px` 。

### Flex 属性的简写

你可能很少看到 `flex-grow`，`flex-shrink`，和 `flex-basis` 属性单独使用，而是混合着写在 `flex` 简写形式中。 `Flex` 简写形式允许你把三个数值按这个顺序书写 — `flex-grow`，`flex-shrink`，`flex-basis`。

你可以在下面的实例中尝试把 flex 简写形式中的数值更改为不同数值，但要记得第一个数值是 `flex-grow`。赋值为正数的话是让元素增加所占空间。第二个数值是`flex-shrink` — 正数可以让它缩小所占空间，但是只有在 flex 元素总和超出主轴才会生效。最后一个数值是 `flex-basis`；flex 元素是在这个基准值的基础上缩放的。

大多数情况下可以用预定义的简写形式。在这个教程中你可能经常会看到这种写法，许多情况下你都可以这么使用。下面是几种预定义的值：

*   `flex: initial`
*   `flex: auto`
*   `flex: none`
*   `flex: <positive-number>`

`flex: initial` 是把 flex 元素重置为 Flexbox 的初始值，它相当于 `flex: 0 1 auto`。在这里 `flex-grow` 的值为 0，所以 flex 元素不会超过它们 `flex-basis` 的尺寸。`flex-shrink` 的值为 1, 所以可以缩小 flex 元素来防止它们溢出。`flex-basis` 的值为 `auto`. Flex 元素尺寸可以是在主维度上设置的，也可以是根据内容自动得到的。

`flex: auto` 等同于 `flex: 1 1 auto`；和上面的 `flex:initial` 基本相同，但是这种情况下，flex 元素在需要的时候既可以拉伸也可以收缩。

`flex: none` 可以把 flex 元素设置为不可伸缩。它和设置为 `flex: 0 0 auto` 是一样的。元素既不能拉伸或者收缩，但是元素会按具有 `flex-basis: auto` 属性的 flexbox 进行布局。

你在教程中常看到的 `flex: 1` 或者 `flex: 2` 等等。它相当于`flex: 1 1 0` 或者 `flex: 2 1 0`。元素可以在 `flex-basis` 为 0 的基础上伸缩。

尝试在下面的实例中应用这些简写值。

## 元素间的对齐和空间分配

Flexbox 的一个关键特性是能够设置 flex 元素沿主轴方向和交叉轴方向的对齐方式，以及它们之间的空间分配。

### `align-items`

`align-items` 属性可以使元素在交叉轴方向对齐。

这个属性的初始值为`stretch`，这就是为什么 flex 元素会默认被拉伸到最高元素的高度。实际上，它们被拉伸来填满 flex 容器——最高的元素定义了容器的高度。

你也可以设置`align-items`的值为`flex-start`，使 flex 元素按 flex 容器的顶部对齐，`flex-end` 使它们按 flex 容器的下部对齐，或者`center`使它们居中对齐。在实例中尝试——我给出了 flex 容器的高度，以便你可以看到元素在容器中移动。看看如果更改 align-items 的值为下列值会发生什么：

*   `stretch`
*   `flex-start`
*   `flex-end`
*   `center`

### `justify-content`

`justify-content`属性用来使元素在主轴方向上对齐，主轴方向是通过 `flex-direction` 设置的方向。初始值是`flex-start`，元素从容器的起始线排列。但是你也可以把值设置为`flex-end`，从终止线开始排列，或者`center`，在中间排列。

你也可以把值设置为`space-between`，把元素排列好之后的剩余空间拿出来，平均分配到元素之间，所以元素之间间隔相等。或者使用`space-around`，使每个元素的左右空间相等。

在实例中尝试下列`justify-content`属性的值：

*   `stretch`
*   `flex-start`
*   `flex-end`
*   `center`
*   `space-around`
*   `space-between`

在以后的文章中，为了更好的理解它们怎么使用，我们会更深入的探索这些属性。然而，这些简单的例子对大多数应用都很有帮助。

## 下一步

在读完这篇文章之后，你应该掌握了 flexbox 的基本特性。在下一篇文章中，我们将会学习如何与其他 CSS 一起使用。

## 帮助改进 MDN

了解如何参与贡献
此页面最后更新于 2025年11月10日，由 MDN 贡献者更新。

在 GitHub 上查看此页面 • 报告此内容的问题

1.   CSS
2.   指南
3.   
模块
    1.   Anchor positioning
    2.   Animation triggers
    3.   CSS 动画
    4.   CSS 背景和边框
    5.   CSS Basic User Interface
    6.   Borders and box decorations
    7.   CSS 盒子对齐
    8.   CSS 基础框盒模型
    9.   Box sizing
    10.   Cascading and inheritance
    11.   CSS 颜色调整
    12.   CSS 颜色
    13.   Compositing and blending
    14.   Conditional rules
    15.   CSS 局限
    16.   CSS 计数器样式
    17.   CSS 对象模型视图
    18.   Custom functions and mixins
    19.   Custom highlight API
    20.   Custom properties for cascading variables
    21.   显示
    22.   Easing functions
    23.   Environment variables
    24.   Filter effects
    25.   CSS 弹性盒子布局
    26.   Font loading
    27.   CSS 字体
    28.   CSS 片段
    29.   Gaps
    30.   CSS 生成内容
    31.   网格布局
    32.   Images
    33.   Inline layout
    34.   CSS 列表与计数器
    35.   CSS 逻辑属性与逻辑值
    36.   CSS Masking
    37.   媒体查询
    38.   Motion path
    39.   CSS 多列布局
    40.   Namespaces
    41.   CSS 嵌套
    42.   Overflow
    43.   Overscroll behavior
    44.   CSS 分页媒体
    45.   CSS 定位布局
    46.   Properties and values API
    47.   Pseudo-elements
    48.   Round display
    49.   Ruby layout
    50.   Scoping
    51.   Scroll anchoring
    52.   CSS 滚动吸附
    53.   Scroll-driven animations
    54.   CSS Scrollbars
    55.   CSS 选择器
    56.   CSS 影子部件
    57.   CSS 形状
    58.   Syntax
    59.   CSS Table
    60.   CSS 文本
    61.   CSS 文本装饰
    62.   CSS Transforms
    63.   CSS 过渡
    64.   CSS 值和单位
    65.   CSS 视图过渡
    66.   Viewport
    67.   WebXR DOM overlays
    68.   Will change
    69.   CSS 书写模式

4.   
锚点定位
    1.   Using anchor positioning
    2.   Handling overflow
    3.   Anchored container queries

5.   
动画
    1.   动画性 CSS 属性
    2.   使用 CSS 动画

6.   
背景和边框
    1.   使用多个背景
    2.   调整背景图片的大小
    3.   SVG 背景缩放

7.   
Borders and box decorations
    1.   border-shape nav menu

8.   
盒对齐
    1.   Overview
    2.   区块、绝对定位和表格布局中的盒子对齐
    3.   弹性盒布局中的盒对齐方式
    4.   In grid layout
    5.   In multi-column layout

9.   
盒模型
    1.   CSS 基础框盒模型介绍
    2.   掌握外边距折叠

10.   
Box sizing
    1.   Aspect ratios

11.   
层叠
    1.   CSS 层叠
    2.   继承
    3.   优先级
    4.   属性值处理
    5.   CSS 的简写属性

12.   
Cascading variables
    1.   使用 CSS 自定义属性（变量）

13.   
颜色
    1.   使用 CSS 为 HTML 元素应用颜色
    2.   颜色值
    3.   Using relative colors
    4.   恰当运用颜色
    5.   无障碍：理解颜色和亮度
    6.   Web 无障碍：色彩对比度

14.   
多列
    1.   Basic Concepts of Multicol
    2.   多列布局的样式
    3.   使用 CSS 的多列布局
    4.   Spanning and balancing columns
    5.   处理 Multicol 中的溢出
    6.   Handling content breaks

15.   
条件规则
    1.   使用特性查询
    2.   Using container scroll-state queries

16.   
CSS 局限
    1.   CSS 容器查询
    2.   使用 CSS 局限
    3.   Using container size and style queries

17.   
计数器
    1.   使用 CSS 计数器

18.   
CSS 对象模型视图
    1.   Coordinate systems (API)
    2.   视口概念

19.   
Custom functions and mixins
    1.   Using CSS custom functions

20.   
流式布局
    1.   常规流中的块和内联布局
    2.   CSS 流式布局
    3.   流式布局和溢出
    4.   流式布局和书写模式
    5.   应用或脱离流式布局
    6.   布局和包含块
    7.   格式化上下文
    8.   区块格式化上下文
    9.   行内格式化上下文
    10.   Using multi-keyword syntax
    11.   视觉格式化模型

21.   
Environment variables
    1.   Using environment variables

22.   
滤镜效果
    1.   Using filter effects

23.   
弹性盒布局
    1.   _flex 布局的基本概念_
    2.   弹性盒子与其他布局方法的联系
    3.   对齐弹性容器中的项目
    4.   Flex 项排序
    5.   控制弹性元素在主轴上的比例
    6.   掌握弹性物件的包装
    7.   弹性盒子的典型用例

24.   
字体
    1.   OpenType 字体特性指南
    2.   Variable fonts guide
    3.   Web 开放字体格式（WOFF）

25.   
网格布局
    1.   网格布局的基本概念
    2.   网格布局和其他布局方法的联系
    3.   CSS 网格中基于线的定位
    4.   网格模板区域
    5.   使用具名网格线布局
    6.   CSS 网格布局中的自动定位
    7.   网格布局中的元素对齐
    8.   CSS 网格，逻辑值和书写模式
    9.   CSS 网格布局和无障碍
    10.   利用 CSS 网格布局实现常用布局
    11.   Subgrid
    12.   网格车道布局

26.   
图片
    1.   使用 CSS 渐变
    2.   Using object-view-box
    3.   可替换元素
    4.   在 CSS 中实现图像合并

27.   
列表
    1.   使列表缩进一致

28.   
逻辑属性
    1.   逻辑属性与逻辑值的基本概念
    2.   用于浮动和定位的逻辑属性
    3.   用于外边距、边框和内边距的逻辑属性
    4.   逻辑尺寸属性

29.   
Masking
    1.   Introduction
    2.   Clipping
    3.   Multiple masks
    4.   Mask properties

30.   
媒体查询
    1.   使用媒体查询
    2.   For accessibility
    3.   使用编程方法测试媒体查询
    4.   打印

31.   
嵌套样式规则
    1.   CSS at 规则嵌套
    2.   CSS 嵌套与优先级
    3.   使用 CSS 嵌套

32.   
溢出
    1.   Creating carousels

33.   
定位
    1.   层叠上下文
    2.   层叠与浮动
    3.   理解 CSS 的 z-index 属性
    4.   使用 z-index
    5.   堆叠时不使用 z-index 属性

34.   
Properties and Values API
    1.   CSS Houdini
    2.   Registering custom properties in CSS

35.   
滚动锚定
    1.   Overview

36.   
Scroll-driven animations
    1.   Scroll-driven animation timelines
    2.   Understanding timeline insets
    3.   Understanding timeline range names

37.   
滚动吸附
    1.   滚动吸附的基本概念
    2.   Using scroll snap events

38.   
选择器
    1.   Selectors and combinators
    2.   Selector structure
    3.   隐私与:visited 选择器
    4.   使用 :target

39.   
形状
    1.   CSS 的图形（Shape）概览
    2.   使用 box 值指定形状
    3.   Image-based shapes
    4.   Using shape-outside
    5.   形状生成器

40.   
语法
    1.   语法
    2.   CSS 注释
    3.   At 规则
    4.   Error handling

41.   
文本
    1.   Wrapping and breaking text
    2.   处理空白字符

42.   
Text decoration
    1.   Text shadows

43.   
变换
    1.   使用 CSS 变换

44.   
过渡
    1.   使用 CSS 过渡

45.   
值和单位
    1.   CSS 属性值定义语法
    2.   Numeric data types
    3.   Textual data types
    4.   Using math functions
    5.   Using typed arithmetic

46.   
Writing modes
    1.   Introduction
    2.   Vertical form controls

47.   How to
48.   
Layout cookbook
    1.   指南：媒体对象
    2.   列布局
    3.   居中一个元素
    4.   粘性页脚
    5.   分离式导航菜单
    6.   面包屑导航
    7.   List group with badges
    8.   Pagination
    9.   卡片
    10.   Grid wrapper
    11.   
Contribute a recipe
        1.   手册模版

49.   工具
50.       1.   Border-image 生成器
    2.   圆角边框生成器
    3.   Box-shadow 生成器
    4.   颜色格式转换器
    5.   颜色混合器
    6.   形状生成器

51.   CSS 参考
52.   
属性
    1.   
-moz-*
        1.   `-moz-float-edge`
        2.   `-moz-force-broken-image-icon`
        3.   `-moz-orient`
        4.   `-moz-user-focus`
        5.   `-moz-user-input`

    2.   
-webkit-*
        1.   `-webkit-border-before`
        2.   `-webkit-box-reflect`
        3.   `-webkit-mask-box-image`
        4.   `-webkit-mask-composite`
        5.   `-webkit-mask-position-x`
        6.   `-webkit-mask-position-y`
        7.   `-webkit-mask-repeat-x`
        8.   `-webkit-mask-repeat-y`
        9.   `-webkit-tap-highlight-color`
        10.   `-webkit-text-fill-color`
        11.   `-webkit-text-security`
        12.   `-webkit-text-stroke`
        13.   `-webkit-text-stroke-color`
        14.   `-webkit-text-stroke-width`
        15.   `-webkit-touch-callout`

    3.   `自定义属性（--*）：CSS 变量`
    4.   `accent-color`
    5.   
align-*
        1.   `align-content`
        2.   `align-items`
        3.   `align-self`

    6.   `alignment-baseline`
    7.   `all`
    8.   `anchor-name`
    9.   `anchor-scope CSS 属性`
    10.   
animation-*
        1.   `animation-composition`
        2.   `animation-delay`
        3.   `animation-direction`
        4.   `animation-duration`
        5.   `animation-fill-mode`
        6.   `animation-iteration-count`
        7.   `animation-name`
        8.   `animation-play-state`
        9.   `animation-range`
        10.   `animation-range-end`
        11.   `animation-range-start`
        12.   `animation-timeline`
        13.   `animation-timing-function`
        14.   `animation-trigger`

    11.   `animation`
    12.   `appearance`
    13.   `aspect-ratio`
    14.   `backdrop-filter`
    15.   `backface-visibility`
    16.   
background-*
        1.   `background-attachment`
        2.   `background-blend-mode`
        3.   `background-clip`
        4.   `background-color`
        5.   `background-image`
        6.   `background-origin`
        7.   `background-position`
        8.   `background-position-x`
        9.   `background-position-y`
        10.   `background-repeat`
        11.   `background-repeat-x`
        12.   `background-repeat-y`
        13.   `background-size`

    17.   `background`
    18.   `baseline-shift`
    19.   `baseline-source`
    20.   `block-size`
    21.   
border-*
        1.   `border-block`
        2.   `border-block-color`
        3.   `border-block-end`
        4.   `border-block-end-color`
        5.   `border-block-end-style`
        6.   `border-block-end-width`
        7.   `border-block-start`
        8.   `border-block-start-color`
        9.   `border-block-start-style`
        10.   `border-block-start-width`
        11.   `border-block-style`
        12.   `border-block-width`
        13.   `border-bottom`
        14.   `border-bottom-color`
        15.   `border-bottom-left-radius`
        16.   `border-bottom-right-radius`
        17.   `border-bottom-style`
        18.   `border-bottom-width`
        19.   `border-collapse`
        20.   `border-color`
        21.   `border-end-end-radius`
        22.   `border-end-start-radius`
        23.   `border-image`
        24.   `border-image-outset`
        25.   `border-image-repeat`
        26.   `border-image-slice`
        27.   `border-image-source`
        28.   `border-image-width`
        29.   `border-inline`
        30.   `border-inline-color`
        31.   `border-inline-end`
        32.   `border-inline-end-color`
        33.   `border-inline-end-style`
        34.   `border-inline-end-width`
        35.   `border-inline-start`
        36.   `border-inline-start-color`
        37.   `border-inline-start-style`
        38.   `border-inline-start-width`
        39.   `border-inline-style`
        40.   `border-inline-width`
        41.   `border-left`
        42.   `border-left-color`
        43.   `border-left-style`
        44.   `border-left-width`
        45.   `border-radius`
        46.   `border-right`
        47.   `border-right-color`
        48.   `border-right-style`
        49.   `border-right-width`
        50.   `border-shape`
        51.   `border-spacing`
        52.   `border-start-end-radius`
        53.   `border-start-start-radius`
        54.   `border-style`
        55.   `border-top`
        56.   `border-top-color`
        57.   `border-top-left-radius`
        58.   `border-top-right-radius`
        59.   `border-top-style`
        60.   `border-top-width`
        61.   `border-width`

    22.   `border`
    23.   `bottom`
    24.   
box-*
        1.   `box-align`
        2.   `box-decoration-break`
        3.   `box-direction`
        4.   `box-flex`
        5.   `box-flex-group`
        6.   `box-lines`
        7.   `box-ordinal-group`
        8.   `box-orient`
        9.   `box-pack`
        10.   `box-shadow`
        11.   `box-sizing`

    25.   
break-*
        1.   `break-after`
        2.   `break-before`
        3.   `break-inside`

    26.   `caption-side`
    27.   
caret-*
        1.   `caret-animation`
        2.   `caret-color`
        3.   `caret-shape`

    28.   `caret`
    29.   `clear`
    30.   `clip-path`
    31.   `clip-rule`
    32.   `clip`
    33.   
color-*
        1.   `color-interpolation`
        2.   `color-interpolation-filters`
        3.   `color-scheme`

    34.   `color`
    35.   
column-*
        1.   `column-count`
        2.   `column-fill`
        3.   `column-gap`
        4.   `column-height`
        5.   `column-rule`
        6.   `column-rule-break`
        7.   `column-rule-color`
        8.   `column-rule-inset-cap`
        9.   `column-rule-inset-cap-end`
        10.   `column-rule-inset-cap-start`
        11.   `column-rule-inset-junction`
        12.   `column-rule-inset-junction-end`
        13.   `column-rule-inset-junction-start`
        14.   `column-rule-style`
        15.   `column-rule-visibility-items`
        16.   `column-rule-width`
        17.   `column-span`
        18.   `column-width`
        19.   `column-wrap`

    36.   `columns`
    37.   
contain-*
        1.   `contain-intrinsic-block-size`
        2.   `contain-intrinsic-height`
        3.   `contain-intrinsic-inline-size`
        4.   `contain-intrinsic-size`
        5.   `contain-intrinsic-width`

    38.   `contain`
    39.   `container-name`
    40.   `container-type`
    41.   `container`
    42.   `content-visibility`
    43.   `content`
    44.   
corner-*
        1.   `corner-block-end-shape`
        2.   `corner-block-start-shape`
        3.   `corner-bottom-left-shape`
        4.   `corner-bottom-right-shape`
        5.   `corner-bottom-shape`
        6.   `corner-end-end-shape`
        7.   `corner-end-start-shape`
        8.   `corner-inline-end-shape`
        9.   `corner-inline-start-shape`
        10.   `corner-left-shape`
        11.   `corner-right-shape`
        12.   `corner-shape`
        13.   `corner-start-end-shape`
        14.   `corner-start-start-shape`
        15.   `corner-top-left-shape`
        16.   `corner-top-right-shape`
        17.   `corner-top-shape`

    45.   
counter-*
        1.   `counter-increment`
        2.   `counter-reset`
        3.   `counter-set`

    46.   `cursor`
    47.   `cx`
    48.   `cy`
    49.   `d`
    50.   `direction`
    51.   `display`
    52.   `dominant-baseline`
    53.   `dynamic-range-limit`
    54.   `empty-cells`
    55.   `field-sizing`
    56.   `fill-opacity`
    57.   `fill-rule`
    58.   `fill`
    59.   `filter`
    60.   
flex-*
        1.   `flex-basis`
        2.   `flex-direction`
        3.   `flex-flow`
        4.   `flex-grow`
        5.   `flex-line-count`
        6.   `flex-shrink`
        7.   `flex-wrap`

    61.   `flex`
    62.   `float`
    63.   `flood-color`
    64.   `flood-opacity`
    65.   
font-*
        1.   `font-family`
        2.   `font-feature-settings`
        3.   `font-kerning`
        4.   `font-language-override`
        5.   `font-optical-sizing`
        6.   `font-palette`
        7.   `font-size`
        8.   `font-size-adjust`
        9.   `font-smooth`
        10.   `font-stretch`
        11.   `font-style`
        12.   `font-synthesis`
        13.   `font-synthesis-position`
        14.   `font-synthesis-small-caps`
        15.   `font-synthesis-style`
        16.   `font-synthesis-weight`
        17.   `font-variant`
        18.   `font-variant-alternates`
        19.   `font-variant-caps`
        20.   `font-variant-east-asian`
        21.   `font-variant-emoji`
        22.   `font-variant-ligatures`
        23.   `font-variant-numeric`
        24.   `font-variant-position`
        25.   `font-variation-settings`
        26.   `font-weight`
        27.   `font-width`

    66.   `font`
    67.   `forced-color-adjust`
    68.   `frame-sizing`
    69.   `gap`
    70.   
grid-*
        1.   `grid-area`
        2.   `grid-auto-columns`
        3.   `grid-auto-flow`
        4.   `grid-auto-rows`
        5.   `grid-column`
        6.   `grid-column-end`
        7.   `grid-column-start`
        8.   `grid-row`
        9.   `grid-row-end`
        10.   `grid-row-start`
        11.   `grid-template`
        12.   `grid-template-areas`
        13.   `grid-template-columns`
        14.   `grid-template-rows`

    71.   `grid`
    72.   `hanging-punctuation`
    73.   `height`
    74.   `hyphenate-character`
    75.   `hyphenate-limit-chars`
    76.   `hyphens`
    77.   
image-*
        1.   `image-orientation`
        2.   `image-rendering`
        3.   `image-resolution`

    78.   `initial-letter`
    79.   `inline-size`
    80.   
inset-*
        1.   `inset-block`
        2.   `inset-block-end`
        3.   `inset-block-start`
        4.   `inset-inline`
        5.   `inset-inline-end`
        6.   `inset-inline-start`

    81.   `inset`
    82.   `interactivity`
    83.   
interest-*
        1.   `interest-delay`
        2.   `interest-delay-end`
        3.   `interest-delay-start`

    84.   `interpolate-size`
    85.   `isolation`
    86.   
justify-*
        1.   `justify-content`
        2.   `justify-items`
        3.   `justify-self`

    87.   `left`
    88.   `letter-spacing`
    89.   `lighting-color`
    90.   
line-*
        1.   `line-break`
        2.   `line-clamp`
        3.   `line-height`
        4.   `line-height-step`

    91.   `link-parameters`
    92.   
list-*
        1.   `list-style`
        2.   `list-style-image`
        3.   `list-style-position`
        4.   `list-style-type`

    93.   
margin-*
        1.   `margin-block`
        2.   `margin-block-end`
        3.   `margin-block-start`
        4.   `margin-bottom`
        5.   `margin-inline`
        6.   `margin-inline-end`
        7.   `margin-inline-start`
        8.   `margin-left`
        9.   `margin-right`
        10.   `margin-top`
        11.   `margin-trim`

    94.   `margin`
    95.   
marker-*
        1.   `marker-end`
        2.   `marker-mid`
        3.   `marker-start`

    96.   `marker`
    97.   
mask-*
        1.   `mask-border`
        2.   `mask-border-mode`
        3.   `mask-border-outset`
        4.   `mask-border-repeat`
        5.   `mask-border-slice`
        6.   `mask-border-source`
        7.   `mask-border-width`
        8.   `mask-clip`
        9.   `mask-composite`
        10.   `mask-image`
        11.   `mask-mode`
        12.   `mask-origin`
        13.   `mask-position`
        14.   `mask-repeat`
        15.   `mask-size`
        16.   `mask-type`

    98.   `mask`
    99.   
math-*
        1.   `math-depth`
        2.   `math-shift`
        3.   `math-style`

    100.   
max-*
        1.   `max-block-size`
        2.   `max-height`
        3.   `max-inline-size`
        4.   `max-width`

    101.   
min-*
        1.   `min-block-size`
        2.   `min-height`
        3.   `min-inline-size`
        4.   `min-width`

    102.   `mix-blend-mode`
    103.   
object-*
        1.   `object-fit`
        2.   `object-position`
        3.   `object-view-box`

    104.   
offset-*
        1.   `offset-anchor`
        2.   `offset-distance`
        3.   `offset-path`
        4.   `offset-position`
        5.   `offset-rotate`

    105.   `offset`
    106.   `opacity`
    107.   `order`
    108.   `orphans`
    109.   
outline-*
        1.   `outline-color`
        2.   `outline-offset`
        3.   `outline-style`
        4.   `outline-width`

    110.   `outline`
    111.   
overflow-*
        1.   `overflow-anchor`
        2.   `overflow-block`
        3.   `overflow-clip-margin`
        4.   `overflow-inline`
        5.   `overflow-wrap`
        6.   `overflow-x`
        7.   `overflow-y`

    112.   `overflow`
    113.   `overlay`
    114.   
overscroll-*
        1.   `overscroll-behavior`
        2.   `overscroll-behavior-block`
        3.   `overscroll-behavior-inline`
        4.   `overscroll-behavior-x`
        5.   `overscroll-behavior-y`

    115.   
padding-*
        1.   `padding-block`
        2.   `padding-block-end`
        3.   `padding-block-start`
        4.   `padding-bottom`
        5.   `padding-inline`
        6.   `padding-inline-end`
        7.   `padding-inline-start`
        8.   `padding-left`
        9.   `padding-right`
        10.   `padding-top`

    116.   `padding`
    117.   
page-*
        1.   `page-break-after`
        2.   `page-break-before`
        3.   `page-break-inside`

    118.   `page`
    119.   `paint-order`
    120.   `path-length`
    121.   `perspective-origin`
    122.   `perspective`
    123.   
place-*
        1.   `place-content`
        2.   `place-items`
        3.   `place-self`

    124.   `pointer-events`
    125.   
position-*
        1.   `position-anchor`
        2.   `position-area`
        3.   `position-try`
        4.   `position-try-fallbacks`
        5.   `position-try-order`
        6.   `position-visibility`

    126.   `position`
    127.   `print-color-adjust`
    128.   `quotes`
    129.   `r`
    130.   `reading-flow`
    131.   `reading-order`
    132.   `resize`
    133.   `right`
    134.   `rotate`
    135.   
row-*
        1.   `row-gap`
        2.   `row-rule`
        3.   `row-rule-break`
        4.   `row-rule-color`
        5.   `row-rule-inset-cap`
        6.   `row-rule-inset-cap-end`
        7.   `row-rule-inset-cap-start`
        8.   `row-rule-inset-junction`
        9.   `row-rule-inset-junction-end`
        10.   `row-rule-inset-junction-start`
        11.   `row-rule-style`
        12.   `row-rule-visibility-items`
        13.   `row-rule-width`

    136.   
ruby-*
        1.   `ruby-align`
        2.   `ruby-overhang`
        3.   `ruby-position`

    137.   
rule-*
        1.   `rule-break`
        2.   `rule-color`
        3.   `rule-inset-cap`
        4.   `rule-inset-junction`
        5.   `rule-overlap`
        6.   `rule-style`
        7.   `rule-visibility-items`
        8.   `rule-width`

    138.   `rule`
    139.   `rx`
    140.   `ry`
    141.   `scale`
    142.   
scroll-*
        1.   `scroll-behavior`
        2.   `scroll-initial-target`
        3.   `scroll-margin`
        4.   `scroll-margin-block`
        5.   `scroll-margin-block-end`
        6.   `scroll-margin-block-start`
        7.   `scroll-margin-bottom`
        8.   `scroll-margin-inline`
        9.   `scroll-margin-inline-end`
        10.   `scroll-margin-inline-start`
        11.   `scroll-margin-left`
        12.   `scroll-margin-right`
        13.   `scroll-margin-top`
        14.   `scroll-marker-group`
        15.   `scroll-padding`
        16.   `scroll-padding-block`
        17.   `scroll-padding-block-end`
        18.   `scroll-padding-block-start`
        19.   `scroll-padding-bottom`
        20.   `scroll-padding-inline`
        21.   `scroll-padding-inline-end`
        22.   `scroll-padding-inline-start`
        23.   `scroll-padding-left`
        24.   `scroll-padding-right`
        25.   `scroll-padding-top`
        26.   `scroll-snap-align`
        27.   `scroll-snap-stop`
        28.   `scroll-snap-type`
        29.   `scroll-target-group`
        30.   `scroll-timeline`
        31.   `scroll-timeline-axis`
        32.   `scroll-timeline-name`

    143.   
scrollbar-*
        1.   `scrollbar-color`
        2.   `scrollbar-gutter`
        3.   `scrollbar-width`

    144.   
shape-*
        1.   `shape-image-threshold`
        2.   `shape-margin`
        3.   `shape-outside`
        4.   `shape-rendering`

    145.   `speak-as`
    146.   `stop-color`
    147.   `stop-opacity`
    148.   
stroke-*
        1.   `stroke-dasharray`
        2.   `stroke-dashoffset`
        3.   `stroke-linecap`
        4.   `stroke-linejoin`
        5.   `stroke-miterlimit`
        6.   `stroke-opacity`
        7.   `stroke-width`

    149.   `stroke`
    150.   `tab-size`
    151.   `table-layout`
    152.   
text-*
        1.   `text-align`
        2.   `text-align-last`
        3.   `text-anchor`
        4.   `text-autospace`
        5.   `text-box`
        6.   `text-box-edge`
        7.   `text-box-trim`
        8.   `text-combine-upright`
        9.   `text-decoration`
        10.   `text-decoration-color`
        11.   `text-decoration-inset`
        12.   `text-decoration-line`
        13.   `text-decoration-skip`
        14.   `text-decoration-skip-ink`
        15.   `text-decoration-style`
        16.   `text-decoration-thickness`
        17.   `text-emphasis`
        18.   `text-emphasis-color`
        19.   `text-emphasis-position`
        20.   `text-emphasis-style`
        21.   `text-fit`
        22.   `text-indent`
        23.   `text-justify`
        24.   `text-orientation`
        25.   `text-overflow`
        26.   `text-rendering`
        27.   `text-shadow`
        28.   `text-size-adjust`
        29.   `text-spacing-trim`
        30.   `text-transform`
        31.   `text-underline-offset`
        32.   `text-underline-position`
        33.   `text-wrap`
        34.   `text-wrap-mode`
        35.   `text-wrap-style`

    153.   
timeline-*
        1.   `timeline-scope`
        2.   `timeline-trigger`
        3.   `timeline-trigger-activation-range`
        4.   `timeline-trigger-activation-range-end`
        5.   `timeline-trigger-activation-range-start`
        6.   `timeline-trigger-active-range`
        7.   `timeline-trigger-active-range-end`
        8.   `timeline-trigger-active-range-start`
        9.   `timeline-trigger-name`
        10.   `timeline-trigger-source`

    154.   `top`
    155.   `touch-action`
    156.   
transform-*
        1.   `transform-box`
        2.   `transform-origin`
        3.   `transform-style`

    157.   `transform`
    158.   
transition-*
        1.   `transition-behavior`
        2.   `transition-delay`
        3.   `transition-duration`
        4.   `transition-property`
        5.   `transition-timing-function`

    159.   `transition`
    160.   `translate`
    161.   `trigger-scope`
    162.   `unicode-bidi`
    163.   `user-modify`
    164.   `user-select`
    165.   `vector-effect`
    166.   `vertical-align`
    167.   
view-*
        1.   `view-timeline`
        2.   `view-timeline-axis`
        3.   `view-timeline-inset`
        4.   `view-timeline-name`
        5.   `view-transition-class`
        6.   `view-transition-name`
        7.   `view-transition-scope`

    168.   `visibility`
    169.   `white-space`
    170.   `white-space-collapse`
    171.   `widows`
    172.   `width`
    173.   `will-change`
    174.   `word-break`
    175.   `word-spacing`
    176.   `writing-mode`
    177.   `x`
    178.   `y`
    179.   `z-index`
    180.   `zoom`

53.   
选择器
    1.   & 嵌套选择器
    2.   属性选择器
    3.   类选择器
    4.   ID 选择器
    5.   Keyframe selectors
    6.   命名空间分隔符
    7.   选择器列表
    8.   类型选择器
    9.   通配选择器

54.   
关系选择器
    1.   子组合器
    2.   列组合器
    3.   后代选择器
    4.   接续兄弟组合器
    5.   后续兄弟选择器

55.   
伪类
    1.   
:-moz-*
        1.   `:-moz-broken`
        2.   `:-moz-drag-over`
        3.   `:-moz-first-node`
        4.   `:-moz-handler-blocked`
        5.   `:-moz-handler-crashed`
        6.   `:-moz-handler-disabled`
        7.   `:-moz-last-node`
        8.   `:-moz-loading`
        9.   `:-moz-locale-dir(ltr)`
        10.   `:-moz-locale-dir(rtl)`
        11.   `:blank`
        12.   `:-moz-submit-invalid`
        13.   `:-moz-suppressed`
        14.   `:-moz-user-disabled`
        15.   `:-moz-window-inactive`

    2.   `:active-view-transition`
    3.   `:active-view-transition-type()`
    4.   `:active`
    5.   `:any-link`
    6.   `:autofill`
    7.   `:blank`
    8.   `:buffering`
    9.   `:checked`
    10.   `:current`
    11.   `:default`
    12.   `:defined`
    13.   `:dir()`
    14.   `:disabled`
    15.   `:empty`
    16.   `:enabled`
    17.   `:first-child`
    18.   `:first-of-type`
    19.   `:first`
    20.   `:focus-visible`
    21.   `:focus-within`
    22.   `:focus`
    23.   `:fullscreen`
    24.   `:future`
    25.   `:has-slotted`
    26.   `:has()`
    27.   `:heading`
    28.   `:heading()`
    29.   `:host-context()`
    30.   `:host`
    31.   `:host()`
    32.   `:hover`
    33.   `:in-range`
    34.   `:indeterminate`
    35.   `:interest-source`
    36.   `:interest-target`
    37.   `:invalid`
    38.   `:is()`
    39.   `:lang()`
    40.   `:last-child`
    41.   `:last-of-type`
    42.   `:left`
    43.   `:link`
    44.   `:local-link`
    45.   `:modal`
    46.   `:muted`
    47.   `:not()`
    48.   
:nth-*
        1.   `:nth-child()`
        2.   `:nth-last-child`
        3.   `:nth-last-of-type`
        4.   `:nth-of-type`

    49.   `:only-child`
    50.   `:only-of-type`
    51.   `:open`
    52.   `:optional`
    53.   `:out-of-range`
    54.   `:past`
    55.   `:paused`
    56.   `:picture-in-picture`
    57.   `:placeholder-shown`
    58.   `:playing`
    59.   `:popover-open`
    60.   `:read-only`
    61.   `:read-write`
    62.   `:required`
    63.   `:right`
    64.   `:root`
    65.   `:scope`
    66.   `:seeking`
    67.   `:stalled`
    68.   `:state()`
    69.   
:target-*
        1.   `:target-after`
        2.   `:target-before`
        3.   `:target-current`

    70.   `:target`
    71.   `:user-invalid`
    72.   `:user-valid`
    73.   `:valid`
    74.   `:visited`
    75.   `:volume-locked`
    76.   `:where()`
    77.   `:xr-overlay`

56.   
伪元素
    1.   
::-moz-*
        1.   `::-moz-color-swatch`
        2.   `::-moz-focus-inner`
        3.   `::-moz-list-bullet`
        4.   `::-moz-list-number`
        5.   `::-moz-meter-bar`
        6.   `::-moz-progress-bar`
        7.   `::-moz-range-progress`
        8.   `::-moz-range-thumb`
        9.   `::-moz-range-track`

    2.   
::-webkit-*
        1.   `::-webkit-inner-spin-button`
        2.   `::-webkit-meter-bar`
        3.   `::-webkit-meter-even-less-good-value`
        4.   `::-webkit-meter-inner-element`
        5.   `::-webkit-meter-optimum-value`
        6.   `::-webkit-meter-suboptimum-value`
        7.   `::-webkit-progress-bar`
        8.   `::-webkit-progress-inner-element`
        9.   `::-webkit-progress-value`
        10.   `::-webkit-scrollbar`
        11.   `::-webkit-search-cancel-button`
        12.   `::-webkit-search-results-button`
        13.   `::-webkit-slider-runnable-track`
        14.   `::-webkit-slider-thumb`

    3.   `::after`
    4.   `::backdrop`
    5.   `::before`
    6.   `::checkmark`
    7.   `::column`
    8.   `::cue (:cue)`
    9.   `::details-content`
    10.   `::file-selector-button`
    11.   `::first-letter`
    12.   `::first-line (:first-line)`
    13.   `::grammar-error`
    14.   `::highlight()`
    15.   `::marker`
    16.   `::part()`
    17.   `::picker-icon`
    18.   `::picker()`
    19.   `::placeholder`
    20.   
::scroll-*
        1.   `::scroll-button()`
        2.   `::scroll-marker`
        3.   `::scroll-marker-group`

    21.   `::search-text`
    22.   `::selection`
    23.   `::slotted()`
    24.   `::spelling-error`
    25.   `::target-text`
    26.   
::view-*
        1.   `::view-transition`
        2.   `::view-transition-group`
        3.   `::view-transition-image-pair`
        4.   `::view-transition-new`
        5.   `::view-transition-old`

57.   
At 规则
    1.   `@charset`
    2.   `@color-profile`
    3.   `@container`
    4.   
`@counter-style`
        1.   `additive-symbols`
        2.   `fallback`
        3.   `negative`
        4.   `pad`
        5.   `prefix`
        6.   `range`
        7.   `speak-as`
        8.   `suffix`
        9.   `symbols`
        10.   `system`

    5.   `@custom-media`
    6.   `@document`
    7.   
`@font-face`
        1.   `ascent-override`
        2.   `descent-override`
        3.   `font-display`
        4.   `font-family`
        5.   `font-feature-settings`
        6.   `font-stretch`
        7.   `font-style`
        8.   `font-variation-settings`
        9.   `font-weight`
        10.   `font-width`
        11.   `line-gap-override`
        12.   `size-adjust`
        13.   `src`
        14.   `unicode-range`

    8.   
`@font-feature-values`
        1.   `font-display`

    9.   
`@font-palette-values`
        1.   `base-palette`
        2.   `font-family`
        3.   `override-colors`

    10.   `@function`
    11.   `@import`
    12.   `@keyframes`
    13.   `@layer`
    14.   
`@media`
        1.   `-moz-device-pixel-ratio`
        2.   `-webkit-animation`
        3.   `-webkit-device-pixel-ratio`
        4.   `-webkit-transform-2d`
        5.   `-webkit-transform-3d`
        6.   `-webkit-transition`
        7.   `any-hover`
        8.   `any-pointer`
        9.   `aspect-ratio`
        10.   `color`
        11.   `color-gamut`
        12.   `color-index`
        13.   `device-aspect-ratio`
        14.   `device-height`
        15.   `device-posture`
        16.   `device-width`
        17.   `display-mode`
        18.   `dynamic-range`
        19.   `forced-colors`
        20.   `grid`
        21.   `height`
        22.   `horizontal-viewport-segments`
        23.   `hover`
        24.   `inverted-colors`
        25.   `monochrome`
        26.   `orientation`
        27.   `overflow-block`
        28.   `overflow-inline`
        29.   `pointer`
        30.   `prefers-color-scheme`
        31.   `prefers-contrast`
        32.   `prefers-reduced-data`
        33.   `prefers-reduced-motion`
        34.   `prefers-reduced-transparency`
        35.   `resolution`
        36.   `scan`
        37.   `scripting`
        38.   `shape`
        39.   `update`
        40.   `vertical-viewport-segments`
        41.   `video-dynamic-range`
        42.   `width`

    15.   `@namespace`
    16.   
`@page`
        1.   `page-orientation`
        2.   `size`

    17.   `@position-try`
    18.   
`@property`
        1.   `inherits`
        2.   `初始值`
        3.   `syntax`

    19.   `@scope`
    20.   `@starting-style`
    21.   `@supports`
    22.   `@view-transition`

58.   
Values
    1.   `!important`
    2.   `fit-content`
    3.   `inherit`
    4.   `initial`
    5.   `max-content`
    6.   `min-content`
    7.   `revert`
    8.   `revert-layer`
    9.   `revert-rule`
    10.   `unset`

59.   
类型
    1.   `<absolute-size>`
    2.   `<alpha-value>`
    3.   `<angle-percentage>`
    4.   `<angle>`
    5.   `<animation-action>`
    6.   `<axis>`
    7.   `<baseline-position>`
    8.   `<basic-shape>`
    9.   `<blend-mode>`
    10.   `<box-edge>`
    11.   `<calc-keyword>`
    12.   `<calc-sum>`
    13.   `<color-interpolation-method>`
    14.   `<color>`
    15.   `<content-distribution>`
    16.   `<content-position>`
    17.   `<corner-shape-value>`
    18.   `<custom-ident>`
    19.   `<dashed-function>`
    20.   `<dashed-ident>`
    21.   `dimension`
    22.   `<display-box>`
    23.   `<display-inside>`
    24.   `<display-internal>`
    25.   `<display-legacy>`
    26.   `<display-listitem>`
    27.   `<display-outside>`
    28.   `<easing-function>`
    29.   `<filter-function>`
    30.   `<flex>`
    31.   `<frequency-percentage>`
    32.   `<frequency>`
    33.   `<generic-family>`
    34.   `<gradient>`
    35.   `<hex-color>`
    36.   `<hue-interpolation-method>`
    37.   `<hue>`
    38.   `<ident>`
    39.   `<image>`
    40.   `<integer>`
    41.   `<length-percentage>`
    42.   `<length>`
    43.   `<line-style>`
    44.   `<line-width>`
    45.   `<named-color>`
    46.   `<number>`
    47.   `<overflow-position>`
    48.   `<overflow>`
    49.   `<percentage>`
    50.   `<position-area>`
    51.   `<position>`
    52.   `<ratio>`
    53.   `<relative-size>`
    54.   `<resolution>`
    55.   `<rule-list>`
    56.   `<self-position>`
    57.   `<shape>`
    58.   `<string>`
    59.   `<system-color>`
    60.   `<text-edge>`
    61.   `<time-percentage>`
    62.   `<time>`
    63.   `<timeline-range-name>`
    64.   `transform-function`
    65.   `<url>`

60.   
函数
    1.   `-moz-image-rect`
    2.   `abs()`
    3.   `acos()`
    4.   `alpha()`
    5.   `anchor-size()`
    6.   `anchor()`
    7.   `asin()`
    8.   `atan()`
    9.   `atan2()`
    10.   `attr()`
    11.   `blur()`
    12.   `brightness()`
    13.   `calc-size()`
    14.   `calc()`
    15.   `circle()`
    16.   `clamp()`
    17.   `color-mix()`
    18.   `color()`
    19.   `conic-gradient()`
    20.   `contrast-color()`
    21.   `contrast()`
    22.   `cos()`
    23.   `counter()`
    24.   `counters()`
    25.   `cross-fade()`
    26.   `cubic-bezier()`
    27.   `device-cmyk()`
    28.   `drop-shadow()`
    29.   `dynamic-range-limit-mix()`
    30.   `element()`
    31.   `ellipse()`
    32.   `env()`
    33.   `exp()`
    34.   `fit-content()`
    35.   `grayscale()`
    36.   `hsl()`
    37.   `hue-rotate()`
    38.   `hwb()`
    39.   `hypot()`
    40.   `if()`
    41.   `image-set()`
    42.   `image()`
    43.   `inset()`
    44.   `invert()`
    45.   `lab()`
    46.   `lch()`
    47.   `light-dark()`
    48.   `linear-gradient()`
    49.   `linear()`
    50.   `log()`
    51.   `matrix()`
    52.   `matrix3d()`
    53.   `max()`
    54.   `min()`
    55.   `minmax()`
    56.   `mod()`
    57.   `oklab()`
    58.   `oklch()`
    59.   `opacity()`
    60.   `paint()`
    61.   `param()`
    62.   `path()`
    63.   `perspective()`
    64.   `polygon()`
    65.   `pow()`
    66.   `progress()`
    67.   `radial-gradient()`
    68.   `random()`
    69.   `ray()`
    70.   `rect()`
    71.   `rem()`
    72.   `repeat()`
    73.   `repeating-conic-gradient()`
    74.   `repeating-linear-gradient()`
    75.   `repeating-radial-gradient()`
    76.   `rgb()`
    77.   `rotate()`
    78.   `rotate3d()`
    79.   `rotateX()`
    80.   `rotateY()`
    81.   `rotateZ()`
    82.   `round()`
    83.   `saturate()`
    84.   `scale()`
    85.   `scale3d()`
    86.   `scaleX()`
    87.   `scaleY()`
    88.   `scaleZ()`
    89.   `sepia()`
    90.   `shape()`
    91.   `sibling-count()`
    92.   `sibling-index()`
    93.   `sign()`
    94.   `sin()`
    95.   `skew()`
    96.   `skewX()`
    97.   `skewY()`
    98.   `sqrt()`
    99.   `steps()`
    100.   `superellipse()`
    101.   `symbols()`
    102.   `tan()`
    103.   `translate()`
    104.   `translate3d()`
    105.   `translateX()`
    106.   `translateY()`
    107.   `translateZ()`
    108.   `type()`
    109.   `url()`
    110.   `var()`
    111.   `xywh()`

构建更美好互联网的蓝图。

MDN
*   关于
*   博客
*   Mozilla 招聘
*   与我们合作投放广告
*   MDN Plus
*   产品帮助

参与贡献
*   MDN 社区
*   社区资源
*   写作指南
*   MDN Discord
*   MDN GitHub 主页

开发者
*   Web 技术
*   学习 Web 开发
*   指南
*   教程
*   术语表
*   Hacks 博客

*   网站隐私声明
*   遥测设置
*   法律声明
*   社区参与准则

本内容的部分版权归 mozilla.org 贡献者所有，©1998–2026。内容依据知识共享许可协议提供。
