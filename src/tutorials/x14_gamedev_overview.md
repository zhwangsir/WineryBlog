---
title: 游戏开发概论：循环、实体与玩法
category: 游戏与图形
order: 1
tags: [游戏开发, 游戏循环, ECS, 游戏设计]
summary: 游戏如何运转：游戏循环、实体系统、碰撞与状态机——一切引擎背后的共同骨架。
---

## 1. 游戏的本质是一个循环

所有游戏（不管 2D 手游还是 3A 大作）每秒都在重复同一件事：

```
while (游戏运行中) {
    处理输入();      // 键盘、鼠标、手柄
    更新逻辑();      // 移动、碰撞、AI、动画进度
    渲染画面();      // 把世界画到屏幕上
}                    // 目标：每秒 60 次（60 FPS）
```

这就是**游戏循环（Game Loop）**。帧率 60 FPS 意味着每帧预算只有 **16.7ms**——超了就掉帧卡顿。

```javascript
// 浏览器里的游戏循环
let last = 0;
function loop(t) {
  const dt = (t - last) / 1000;   // 距上帧秒数
  last = t;
  update(dt);                      // 逻辑用 dt 缩放，不同帧率速度一致
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

**关键概念：dt（delta time）**。移动速度永远乘以 dt，否则高刷屏游戏会变快：

```javascript
player.x += speed * dt;   // ✓ 任何帧率下每秒移动 speed 像素
player.x += speed;        // ✗ 144Hz 屏会比 60Hz 快 2.4 倍
```

## 2. 实体：游戏世界的基本单位

游戏里的每个"东西"——玩家、子弹、敌人、金币——都是实体。两种组织方式：

### 继承式（OOP 直觉）
```
Entity → Player → PlayerWithJetpack
       → Enemy → FlyingEnemy → Boss
```
问题：能力一多，类爆炸。`会飞的Boss亡灵马`要怎么继承？

### 组合式（ECS 思想，业界主流）
实体 = 一组组件的容器：

```javascript
player = {
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  sprite: 'hero.png',
  health: { hp: 100, maxHp: 100 },
  collider: { w: 32, h: 48 },
};
```

系统遍历处理：`移动系统`处理所有有 position+velocity 的实体；`渲染系统`画所有有 sprite 的。**能力和实体解耦**，给新实体加"飞行"只需挂一个 velocity 组件。

Unity 的 GameObject + Component、Cocos、Godot 全是这个思路。

## 3. 让东西动起来：运动与碰撞

### 速度与加速度（Verlet/欧拉积分）
```javascript
// 每帧
velocity.y += gravity * dt;      // 重力加速度
position.x += velocity.x * dt;
position.y += velocity.y * dt;
```

### AABB 碰撞检测（轴对齐包围盒）
2D 游戏最常用的碰撞：两个矩形是否重叠

```javascript
function aabb(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}
```

碰到后怎么办 → **碰撞响应**：子弹消失+扣血（触发器）、角色停在墙上（物理阻挡）。

## 4. 让敌人会思考：状态机（FSM）

敌人 AI 的标准做法——有限状态机：

```
   巡逻 ──发现玩家──→ 追击
    ↑                  │
    │ 走到巡逻点        │ 进入攻击距离
    │                  ↓
   ←──丢失目标      攻击 ──玩家离开──→ 追击
```

```javascript
const state = { PATROL: 0, CHASE: 1, ATTACK: 2 };

function updateEnemy(e, dt) {
  switch (e.state) {
    case state.PATROL:
      moveTo(e, e.patrolTarget);
      if (canSee(e, player)) e.state = state.CHASE;
      break;
    case state.CHASE:
      moveTo(e, player.position);
      if (dist(e, player) < 50) e.state = state.ATTACK;
      if (!canSee(e, player)) e.state = state.PATROL;
      break;
    case state.ATTACK:
      attack(e, player);
      if (dist(e, player) > 80) e.state = state.CHASE;
      break;
  }
}
```

## 5. 什么让游戏"好玩"

技术只是载体，玩法设计才是灵魂。三个可操作的设计原则：

1. **即时反馈**：每个输入 0.1 秒内要有视听反馈（跳跃有音效+挤压动画）
2. **心流区间**：难度略高于当前能力，玩家就进入沉浸状态——好的难度曲线是"刚死的次数够多但不想砸键盘"
3. **易学难精**：30 秒学会核心操作，100 小时还在精进（超级马里奥：跑跳两层操作，速通选手练上万次）

## 6. 你的第一个游戏该做什么

**弹球（Pong/Breakout）**是公认的最佳起点，麻雀虽小五脏俱全：

- 输入：键盘/鼠标控制挡板
- 物理：球的匀速运动 + AABB 碰撞（挡板/砖块/墙）
- 游戏状态：得分、游戏结束、重新开始
- 渲染：纯 Canvas 2D

做完弹球，再挑战：贪吃蛇 → Flappy Bird → 平台跳跃。

## 延伸阅读

- 站内相关：《Unity 游戏开发入门：场景、组件与第一个游戏》《Three.js 与 Canvas 2d 入门》《图与遍历算法（BFS/DFS/拓扑）》
- 《游戏设计艺术》（The Art of Game Design）——玩法设计圣经
- 《游戏编程模式》（[本地镜像](/post/ref-game-programming-patterns)）——免费在线全文
