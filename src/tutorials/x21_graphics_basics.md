---
title: 图形学基础入门：从像素到管线
category: 游戏与图形
order: 3
tags: [图形学, GPU, 渲染管线, WebGL]
summary: 像素、三角形与光栅化——GPU 渲染管线的全景地图，看懂屏幕上每一帧是怎么画出来的。
---

## 1. 屏幕就是一个像素矩阵

1080p 屏幕 = 1920×570 万个**像素**格子，每格存一个 RGB 颜色。图形学的根本问题只有一个：

> **给定相机的位置和场景里的物体，每个像素该显示什么颜色？**

这个问题每秒要回答 60 次 × 200 万像素 = 每秒 1.2 亿次颜色判定。CPU 算不过来，所以有了 GPU——几千万个小核同时算不同像素。

## 2. 渲染管线：一条工厂流水线

GPU 把"3D 场景 → 2D 像素"拆成标准流水线：

```
顶点数据 → [1] 顶点着色器 → [2] 光栅化 → [3] 片元着色器 → [4] 输出合并 → 屏幕
```

### ① 顶点着色器（Vertex Shader）
输入场景里的顶点（位置、法线、UV），输出**裁剪空间坐标**。所有物体的移动、旋转、投影变换都在这里发生：

```glsl
// WebGL/GLSL 顶点着色器
attribute vec3 position;
uniform mat4 modelViewProjection;   // 模型×相机×投影矩阵
void main() {
  gl_Position = modelViewProjection * vec4(position, 1.0);
}
```

### ② 光栅化（Rasterization）
把三角形"盖章"成像素片元，并对三角形内部的像素做**插值**（颜色、UV、法线都是插值出来的）。这一步固定不可编程，但纯硬件极快。

### ③ 片元着色器（Fragment Shader）
对**每个像素**执行——光照、纹理采样、特效全在这：

```glsl
precision mediump float;
uniform vec3 lightDir;
varying vec3 normal;               // 插值后的法线
void main() {
  float lambert = max(dot(normalize(normal), lightDir), 0.0);  // 兰伯特光照
  gl_FragColor = vec4(vec3(1.0, 0.6, 0.2) * lambert, 1.0);
}
```

这一行 `dot(normal, lightDir)` 就是「亮度 = 法线与光线夹角」——你在任何游戏里看到的漫反射光照，本质都是这个公式（或它的升级版 PBR）。

### ④ 输出合并
**深度测试**（Z-buffer：只留离相机最近的）+ **透明混合**（alpha blend）→ 写入屏幕。

## 3. 为什么是三角形

- 三点必共面（永远不会"翻面"）
- 任意曲面都能剖分成三角网格（游戏角色的几十万顶点就是三角剖分结果）
- 光栅化三角形在硬件上有高效算法（边缘函数扫描）

## 4. 变换矩阵：三个矩阵走完全程

顶点从"建模时"到"屏幕上"经历三段旅程：

```
局部坐标 --模型矩阵--> 世界坐标 --视图矩阵--> 相机坐标 --投影矩阵--> 裁剪坐标
```

- **模型矩阵**：物体自己的移动/旋转/缩放
- **视图矩阵**：相机的逆变换（"相机不动世界动"）
- **投影矩阵**：透视投影（近大远小）或正交投影（工程图）

Three.js 里你永远不用手算——`camera.updateProjectionMatrix()`、`mesh.matrixWorld` 都替你做了。但引擎面试和 Shader 调试时必须懂这个流程。

## 5. 光照模型速览

| 模型 | 公式直觉 | 观感 |
| --- | --- | --- |
| 兰伯特（漫反射） | `dot(N, L)` | 哑光塑料 |
| Blinn-Phong | 漫反射 + `pow(dot(N, H), shininess)` | 高光塑料球 |
| PBR | 基于物理的能量守恒 + 金属度/粗糙度 | 现代 3A 观感 |

纹理（贴图）的本质：把表面参数存成图片，片元着色器按 UV 坐标采样——法线贴图骗过光照计算，让 1000 面的低模看起来像 10 万面高模。

## 6. 动手路径

1. **Canvas 2D**（已在《Three.js 与 Canvas 2d 入门》）：理解扫描与填充
2. **WebGL 裸写一个旋转三角形**：亲手过一遍完整管线（强烈推荐，代码 <100 行）
3. **Three.js**：站在引擎肩膀上做东西
4. **Shader 特效**：Shadertoy 上玩片元着色器（SDF 图形、噪声、后处理）

## 延伸阅读

- 站内相关：《Three.js 与 Canvas 2d 入门》《游戏开发概论：循环、实体与玩法》《Unity 2D 平台跳跃实战》
- 《Real-Time Rendering》——渲染管线圣经
- LearnOpenGL（中文版）：WebGL/OpenGL 最佳实践教程
- Shadertoy.com ——片元着色器创意社区
