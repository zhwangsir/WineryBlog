---
title: 游戏物理入门：碰撞、重力与轨迹
category: 游戏与图形
order: 4
tags: [游戏物理, 碰撞检测, 重力, 游戏开发]
summary: 欧拉积分、AABB 与圆形碰撞、斜面反弹与惯性——用初等数学实现可信的游戏物理。
---

## 1. 游戏物理 ≠ 真实物理

游戏物理的目标是**可信与可控**，不是精确。NASA 用数值方法算轨道，游戏用**欧拉积分**三行代码糊弄出"感觉对"——这就是游戏物理的全部哲学：每帧步进，误差在视觉上不可见就行。

```javascript
// 半隐式欧拉积分（游戏标配）：先更新速度再更新位置
vy += gravity * dt;
x  += vx * dt;
y  += vy * dt;
```

> 为什么先速度后位置？这叫半隐式欧拉，比"先位置后速度"的朴素欧拉**能量稳定**——不会越跳越高飞出屏幕。

## 2. 重力与跳跃的手感调校

平台跳跃游戏的跳跃手感由三个参数决定：

```javascript
const GRAVITY      = 2000;   // 下落加速度 px/s²
const JUMP_SPEED   = -700;   // 起跳初速度（负 = 向上）
const JUMP_CUTOFF  = 0.5;    // 松开跳跃键时速度衰减

function jump(player) {
  player.vy = JUMP_SPEED;
  player.jumping = true;
}

function update(player, dt) {
  player.vy += GRAVITY * dt;

  // 短按小跳：松键瞬间截断上升速度
  if (player.jumping && !input.jumpHeld && player.vy < 0) {
    player.vy *= JUMP_CUTOFF;
  }
  player.x += player.vx * dt;
  player.y += player.vy * dt;
}
```

**手感铁律**：
- 上升慢、下落快（`vy > 0` 时重力 ×1.5）更接近马里奥的"漂浮感"
- 土狼时间（coyote time）：离开平台后 0.1s 内仍允许起跳，宽容输入
- 输入缓冲：落地前 0.1s 按跳，落地瞬间自动起跳

物理诚实 + 手感作弊，才是好跳跃。

## 3. 碰撞检测：从圆到 AABB

### 圆 vs 圆（弹球、分子）
比较圆心距与半径和：

```javascript
function circleHit(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  const dist = Math.hypot(dx, dy);
  return dist < a.r + b.r;         // 重叠 = 碰撞
}
```

### AABB vs AABB（平台、箱子）
```javascript
function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}
```

### 分离轴定理 SAT（旋转矩形，进阶）
投影两个凸多边形到所有法线轴，任一轴上投影不重叠 → 不碰撞。 Unity 的 BoxCollider、Cocos 全是 SAT 变体。

## 4. 碰撞响应：反弹与摩擦

球撞地怎么弹？**分解速度，翻转法向分量，乘弹性系数**：

```javascript
function bounce(ball, restitution = 0.8, friction = 0.99) {
  if (ball.y + ball.r > groundY) {
    ball.y = groundY - ball.r;        // 位置修正：别陷进地面
    ball.vy = -Math.abs(ball.vy) * restitution;   // 法向反弹
    ball.vx *= friction;                          // 切向摩擦
    if (Math.abs(ball.vy) < 30) ball.vy = 0;      // 阈值以下停止抖动
  }
}
```

三件套缺一不可：**位置修正**（防穿透）、**速度反射**（反弹）、**静止阈值**（防抖）。

## 5. 抛物线与瞄准：预判弹道

炮弹/投篮的抛物线由初速度和重力唯一确定：

```
给定发射点 P、目标点 T、飞行时间 t：
vx = (T.x - P.x) / t
vy = (T.y - P.y) / t - 0.5 * G * t
```

敌人的"完美投篮 AI"就是解这个方程。要让玩家有机可乘，给目标位置加噪声（误差 5%）。

## 6. 穿墙问题：连续碰撞检测

速度快时一帧能跨过 20px 的薄墙（**隧穿**）。解法从简到繁：

1. **限制最大速度**（大多数游戏够用）
2. **子步进**：一帧拆 4 步，每步 dt/4 做 AABB
3. **射线检测**：从旧位置向新位置发射线（raycast），命中线段即命中
4. 引擎级 CCD（Continuous Collision Detection）——Unity Rigidbody 开关

## 7. 什么时候该用物理引擎

- 2-5 个刚体的平台跳跃 → 手写积分 + AABB，完全可控
- 堆箱子、布娃娃、车辆 → 用引擎（Matter.js / Box2D / Unity PhysX）
- 强手感平台游戏（如蔚蓝）→ 手写物理，引擎物理反而碍事

**手写 = 可控手感；引擎 = 真实感堆叠。** 按需求选。

## 延伸阅读

- 站内相关：《游戏开发概论：循环、实体与玩法》《Unity 2D 平台跳跃实战》《图形学基础入门：从像素到管线》
- 《Game Physics Engine Design》——物理引擎架构
- 《The Nature of Code》——用 p5.js 讲物理模拟（免费在线）
