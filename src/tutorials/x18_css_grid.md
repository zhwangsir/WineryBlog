---
title: CSS Grid 与响应式布局
category: Web 前端
order: 2
tags: [CSS, Grid, 响应式布局, 前端]
summary: 二维网格布局系统、minmax/fr 自动化、媒体查询与容器查询——现代响应式布局的完整方案。
---

## 1. Flex 不够时用 Grid

Flex 是**一维**布局（一行或一列），Grid 是**二维**（行+列同时定义）。页面级骨架（侧边栏+主区+页脚）用 Grid，组件内部排列用 Flex——两者是搭档不是对手。

## 2. Grid 基本用法

```css
.page {
  display: grid;
  grid-template-columns: 240px 1fr;    /* 侧边栏固定，主区自适应 */
  grid-template-rows: auto 1fr auto;   /* 头/内容/尾 */
  gap: 16px;
  min-height: 100vh;
}
.header  { grid-column: 1 / -1; }     /* 从第 1 条线跨到最后 */
.sidebar { grid-row: 2 / 3; }
.main    { grid-column: 2; grid-row: 2; }
.footer  { grid-column: 1 / -1; }
```

核心坐标是**网格线**：`grid-column: 1 / 3` 表示从第 1 条线到第 3 条线（占 2 列）。

## 3. fr 与 minmax：自适应的精髓

`fr`（fraction）是剩余空间的份数；`minmax(min, max)` 限定尺寸范围：

```css
/* 三等分 */
grid-template-columns: repeat(3, 1fr);

/* 经典卡片布局：不写媒体查询就自动响应！ */
grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
```

这行的意思：每列至少 260px，能塞几列塞几列，多余空间均分。**容器变窄自动变两列/一列**——很多场景不再需要断点。

## 4. 命名区域：像画格子一样布局

```css
.page {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 220px 1fr;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }

/* 移动端重排：改一张图就够 */
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

可读性极强，布局即文档。

## 5. 媒体查询的正确姿势

```css
/* 移动优先：默认样式给小屏 */
.cards { grid-template-columns: 1fr; }

/* 逐渐增强，用 min-width 而非 max-width */
@media (min-width: 640px) { .cards { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1024px) { .cards { grid-template-columns: repeat(3, 1fr); } }
```

断点不必堆设备尺寸，3 个够了：`640 / 1024 / 1440`。

## 6. 容器查询：真正的组件级响应

媒体查询响应的是**视口**，组件响应的应该是**自己所在容器**——同一个卡片放进侧栏和放进主区应该不同表现：

```css
.card-wrap { container-type: inline-size; }

@container (min-width: 480px) {
  .card { display: flex; }              /* 容器够宽才横排 */
}
```

2023 年后所有现代浏览器已支持，设计系统组件的首选。

## 7. 实战检查清单

1. 先画格子草图（几行几列，哪里固定哪里自适应）
2. 骨架用 Grid + `grid-template-areas`
3. 卡片列表用 `repeat(auto-fill, minmax(...))`
4. 组件内部排列用 Flex
5. 移动优先写样式，`min-width` 逐级增强
6. 用 DevTools 的网格叠加层（点击 grid 标记）调试对齐

## 延伸阅读

- 站内相关：《CSS 基础与弹性布局》《前端工程化入门：npm、Vite 与构建部署》
- Grid Garden（游戏化学 Grid）
- MDN CSS Grid 完整指南
