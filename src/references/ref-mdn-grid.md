---
title: 网格布局的基本概念 - CSS：层叠样式表
category: 参考资料
source: https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout
summary: 本地镜像：网格布局的基本概念 - CSS：层叠样式表（原文 developer.mozilla.org）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout

# 网格布局的基本概念

CSS 网格布局引入了二维网格布局系统，可用于布局页面主要的区域或小型用户界面元素。本文介绍了 CSS 网格布局与 CSS 网格布局规范第 1 版中的新术语。这篇简介中所展示的每种特性，将在本指南的其余部分中详细介绍。

## 本文内容

*   什么是网格？
*   网格容器
*   网格轨道
*   网格线
*   网格单元
*   网格区域
*   网格间距
*   嵌套网格
*   使用 z-index 控制层级
*   下一步

## 什么是网格？

网格是一组相交的水平线和垂直线，它定义了网格的列和行。我们可以将网格元素放置在与这些列和行相关的位置上。CSS 网格布局具有以下特点：

### 固定的位置和弹性的轨道的大小

你可以使用固定的轨道尺寸创建网格，比如使用像素单位。你也可以使用比如百分比或者专门为此目的创建的新单位 `fr` 来创建有弹性尺寸的网格。

### 网格项摆放

你可以使用行号、行名或者标定一个网格区域来精确定位元素。网格同时还使用一种算法来控制未给出明确网格位置的元素。

### 创建额外的轨道来包含内容

可以通过网格布局定义显式网格。网格布局规范非常灵活，可以在需要时添加额外的行和列。包括添加“一个容器能容纳的尽可能多的列”等特性。

### 对齐控制

网格包含对齐特性，因此我们可以控制项目放入网格区域后的对齐方式，以及整个网格的对齐方式。

### 控制重叠内容

多个项目可以放置在网格单元格中，或者区域可以部分地彼此重叠。然后可以使用 `z-index` 属性来控制重叠区域显示的优先级。

网格布局是一个强大的规范，当与 CSS 的其他部分（如弹性盒）结合使用时，可以帮助你创建以前不可能在 CSS 中构建的布局。这一切都是通过在**网格容器**上创建一个网格来开始的。

## 网格容器

我们通过在元素上声明 `display：grid` 或 `display：inline-grid` 来创建一个 _网格容器_。一旦我们这样做，这个元素的所有 _直系子元素_ 将成为 _网格项目_。

在这个示例中，有一个类名为 `wrapper` 的 `div` 元素作为容器，其内部有五个子元素。

我将 `.wrapper` 作为一个网格容器。

所有直系子元素现在都是网格项了。在 web 浏览器中，元素转为网格项前看不出什么差异，因为网格给这些元素创建了一个单列网格。此刻，Firefox 开发者版（Developer Edition）可能会助你一臂之力。此时，你可能会发现使用 Firefox 开发工具中的网格检查器非常有用。如果你在 Firefox 中查看此示例并检查网格，会看到 `grid` 值旁边有一个小图标。单击该图标后，该元素上的网格就会显示到浏览器窗口中。

（图：Image 7: 使用 DevTools 中的网格高亮器观察网格）

当你学习并且使用 CSS 网格布局时，这个工具能让你更好地了解到你的网格在视觉上发生了哪些变化。

如果我们想让这个示例更加“网格化”，我们需要使用列轨道。

## 网格轨道

我们使用 `grid-template-rows` 和 `grid-template-columns` 属性定义网格上的行和列。这些属性定义了网格轨道。_网格轨道_（grid track）是网格上任意两条相邻线之间的空间。下图显示了一个突出显示的轨道——这是网格中第一行的轨道。

（图：Image 8: 一个包含 3 个网格项的方框。在这三个项目的上方有一个浅绿色的实心区域，这就是轨道。）

通过使用 `grid-template-columns` 和 `grid-template-rows` 属性或简写的 `grid` 或 `grid-template` 属性，可在显式网格中定义网格轨道。在隐式网格中，也可以通过在显式网格中创建的轨道外定位网格项来创建轨道。

### 基本示例

我可以通过添加 `grid-template-columns` 属性将列轨道添加到之前的示例，然后定义列轨道的大小。

我现在创建了一个网格，包含了三个 200 像素宽的列轨道。子元素将在网格上每个网格单元中摆放。

### fr 单位

轨道可以使用任何长度单位进行定义。网格还引入了一个另外的长度单位来帮助我们创建灵活的网格轨道。新的 `fr` 单位代表网格容器中可用空间的一部分。下一个网格定义将创建三个等宽的轨道，并根据可用空间的大小进行增减。

### 不同尺寸

在下面的这个示例中，我们定义了一个 `2fr` 轨道和两个 `1fr` 轨道。可用空间被四等分。其中两份给了第一个轨道，剩下两个轨道各占一份。

### 混合弹性尺寸和绝对尺寸

在最后一个示例中，我们将绝对大小的轨道与 `fr` 单位混合使用。第一条轨道是 500 像素，因此从可用空间中扣除了固定宽度。剩下的空间被一分为三，并按比例分配给两个灵活的轨道。

### 在轨道列表中使用 repeat() 标记

包含多个轨道的大型网格可使用 `repeat()` 标记来重复部分或整个轨道列表。如下方的网格定义：

也可写成：

Repeat 标记可以用于重复轨道列表中的一部分。在下面的示例中我创建了一个网格，其起始轨道为 20 像素，接着重复了 6 个 `1fr` 的轨道，最后再添加了一个 20 像素的轨道。

Repeat 标记可以传入一个轨道列表，因此你可以用它来创建一个多轨道模式的重复轨道列表。在下一个示例中，网格将有共计 10 个轨道，为 1 个 `1fr` 轨道后面跟着 1 个 `2fr` 轨道，该模式重复 5 次。

### 隐式和显式网格

在创建示例网格时，我们使用 `grid-template-columns` 属性专门定义了列轨道，但网格也会自行创建行。这些行是隐式网格的一部分。而显式网格由使用 `grid-template-columns` 或 `grid-template-rows` 定义的任何行和列组成。

如果你在定义的网格外放置内容，或者由于内容太多，需要更多的网格轨道，那么网格就会在隐式网格中创建行和列。默认情况下，这些轨道会自动调整大小，因此它们的大小取决于轨道内的内容。

你还可以使用 `grid-auto-rows` 和 `grid-auto-columns` 属性为在隐式网格中创建的轨道定义设定大小。

在下面的示例中我们用 `grid-auto-rows` 属性来确保在隐式网格中创建的轨道是 200 像素高。

### 轨道大小和 minmax

在设置显式网格或定义自动创建的行或列的大小时，我们可能希望给轨迹一个最小尺寸，但也要确保它们能扩展以适应添加的任何内容。例如，我可能希望我的行永远不会缩小到 100 像素以下，但如果我的内容高度扩展到 300 像素，那么我希望行也能扩展到这个高度。

网格布局提供了 `minmax()` 函数来解决这个问题。在下一个示例中，我在 `grid-auto-rows` 的值中使用了 `minmax()`。这意味着自动创建的行高度最小为 100 像素，最大为 `auto`。使用 `auto` 表示大小将取决于内容的大小，并将拉伸以在该行中为单元格中最高的项目留出空间。

## 网格线

应该注意的是，当我们定义网格时，我们定义的是网格轨道，而不是网格线。网格布局会为我们创建编号的网格线来让我们来定位每一个网格元素。例如下面这个三列两行的网格中，就拥有四条纵向的网格线。

（图：Image 9: 显示编号网格线的示意图。）

网格线的编号顺序取决于文章的书写模式。在从左至右书写的语言中，编号为 1 的网格线位于最左边。在从右至左书写的语言中，编号为 1 的网格线位于最右边。网格线也可以被命名，我们将在稍后的教程中看到如何完成这一操作。

### 跨轨道放置网格项目

我们将在以后的文章中详细探讨基于行的放置。下面的示例以简单的方式演示了这一点。放置项目时，我们的目标是网格线而不是网格轨道。

在下面的示例中，我使用 `grid-column-start`、`grid-column-end`、`grid-row-start` 和 `grid-row-end` 属性，将前两个项目放置在三列轨道网格上。从左到右，第一个项目放置在第 1 列，并跨越到第 4 列，在我们的示例中，第 4 列是网格的最右边一行。它开始于第 1 行，结束于第 3 行，因此跨越了两条行轨。

第二个项目从网格列第 1 行开始，跨越一个轨道。这是默认设置，因此我不需要指定终止行。它还跨越了从第 3 行到第 5 行的两条行轨道。其他项目将放置在网格的空白处。

**备注：**别忘了你可以使用 Firefox 开发者工具中的网格检查器查看这些元素是如何被摆放在网格中的。

### 网格线定位简写

对于列，可以使用 `grid-column` 将上面使用的完整值压缩到一行，对于行，可以使用 `grid-row` 将其压缩到一行。下面的示例将提供与前面代码相同的定位，但 CSS 内容要少得多。斜线字符（`/`）前面的值为起始网格线，斜线字符（`/`）后面的值为终止网格线。

如果网格项只跨越了一个轨道，可以省略终止值。

## 网格单元

_网格单元_（grid cell）是网格项中最小的单位，从概念上来讲其实它和表格的一个单元格很像。现在再看回我们前面的一个例子，一旦一个网格元素被定义为父级元素，那么它的子级元素将会排列在每个事先定义好的网格单元中。在下面的图中，我会将第一个网格单元作高亮处理。

（图：Image 10: 网格的第一个单元格突出显示）

## 网格区域

项目可以按行或列跨越一个或多个单元格，这样就形成了一个 _网格区域_（grid area）。网格区域必须是矩形的（例如不能创建 L 形区域）。突出显示的网格区域跨越了两条行轨道和两条列轨道。

（图：Image 11: 一个网格区域）

## 网格间距

网格单元格之间的 _横向间距_（gutter）或 _纵向间距_（alley）可以使用 `column-gap` 和 `row-gap` 属性或简写 `gap` 来创建。在下面的示例中，我在列与列之间创建了 10 像素的间隙，在行与行之间创建了 1em 的间隙。

**备注：**当网格布局首次在浏览器中使用时，`column-gap`、`row-gap` 和 `gap` 都带有 `grid-` 前缀，分别称为 `grid-column-gap`、`grid-row-gap` 和 `grid-gap`。现在，所有浏览器都支持无前缀值，但前缀版本将作为别名保留，以便安全使用。

网格间距使用的任何空间都会在分配给灵活长度的 `fr` 轨道之前计算在内，而且网格间距的大小与常规网格轨道相同，但不能在间距中放置任何东西。就基于行的定位而言，网格间距就像一条粗线。

## 嵌套网格

网格项可以也成为一个网格容器。在下面的示例中，我使用了之前创建的三栏网格，并放置了两个项目。在本例中，第一个项目有一些子项目。由于这些项目不是网格的直接子项，它们不参与网格布局，因此显示在正常的文档流中。

（图：Image 12: 文档流中的嵌套网格）

### 不使用子网格的嵌套

如果我将 `box1` 设置为 `display: grid`，我就可以给它一个轨道定义，它也会变成一个网格项。然后，项目就会排列在这个新网格上。

在这种情况下，嵌套网格与父网格没有任何关系。正如你在示例中看到的，它没有继承父网格的 `gap`，嵌套网格中的行也没有与父网格中的行对齐。

### 子网格

除了常规网格外，_子网格_（subgrid）还能让我们创建嵌套网格，使用父网格的轨道定义。

要使用它们，我们可以编辑上述嵌套网格示例，将 `grid-template-columns: repeat(3,1fr)` 的轨道定义更改为 `grid-template-columns: subgrid`。嵌套网格就会沿用父网格轨道来布局项目。

## 使用 z-index 控制层级

网格项可以占据同一单元格，在这种情况下，我们可以使用 `z-index` 属性来控制重叠项的堆叠顺序。

### 不使用 z-index 的重叠

如果我们回到按行号定位项目的示例，就可以改变这种方法，使两个项目重叠。

网格项目 `box2` 现在覆盖于 `box1` 之上，因为它在源文件顺序中排在后面。

### 控制顺序

我们可以在网格项目发生重叠时使用 `z-index` 属性控制重叠的顺序——就像放置网格项目一样。如果我们给 `box2` 设定一个低于 `box1` 的 `z-index` 值的话，`box2` 将会显示在 `box1` 的下方。

## 下一步

在本文中，我们快速了解了网格布局的各种可能性。探索并玩转代码示例，然后进入本指南的下一部分，在这里我们将真正开始挖掘 CSS 网格布局的细节。

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
    1.   flex 布局的基本概念
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
    1.   _网格布局的基本概念_
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
