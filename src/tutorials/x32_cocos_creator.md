---
title: Cocos Creator 入门：国产引擎做 2D 游戏
category: 游戏与图形
order: 6
tags: [Cocos Creator, TypeScript, 2D游戏, 游戏引擎]
summary: 组件化工作流、Node 树与 UITransform、生命周期能力——用 TypeScript 上手的轻量 2D 引擎。
---

## 1. Cocos 的定位

Cocos Creator 是国产游戏引擎（触控科技），2D/轻 3D 场景的事实标准之一：

| 对比项 | Cocos Creator | Unity |
| --- | --- | --- |
| 语言 | **TypeScript**（前端友好） | C# |
| 2D 小游戏 | 主场（微信小游戏生态） | 偏重 |
| 包体积 | MB 级 | 几十 MB 起 |
| 生态 | 国内小游戏/教育游戏 | 全球 3A/独立 |

前端工程师转游戏开发的最短路径：TypeScript 直接复用，开发体验接近写 React/Vue（组件化 + 数据驱动）。

## 2. 安装与工程结构

1. 官网下载 **Cocos Dashboard** → 安装 Creator 3.8.x LTS
2. 新建项目 → 选 **2D** 模板

目录职责：

```
assets/
  scenes/     场景文件（.scene）
  scripts/    TypeScript 组件
  prefabs/    预制体
  textures/   图片资源
  resources/  运行时动态加载的资源（resources.load）
```

## 3. 心智模型：Node 树 + 组件

和 Unity 几乎同构：场景是 **Node 树**，行为来自挂在 Node 上的**组件**（CC 类）：

```typescript
import { _decorator, Component, Node, Vec3, input, Input, EventKeyboard, KeyCode } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property                 // 编辑器 Inspector 里可见可调
    speed = 200;

    private dir = new Vec3();

    onLoad() {                // 节点加载（注册全局监听放这）
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    update(dt: number) {      // 每帧；dt = 距上帧秒数
        const pos = this.node.position;
        this.node.setPosition(pos.x + this.dir.x * this.speed * dt, pos.y, pos.z);
    }

    onDestroy() {             // 必须成对解绑，防止泄漏
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKeyDown(e: EventKeyboard) {
        if (e.keyCode === KeyCode.KEY_A) this.dir.x = -1;
        if (e.keyCode === KeyCode.KEY_D) this.dir.x = 1;
    }
    private onKeyUp(e: EventKeyboard) {
        if (e.keyCode === KeyCode.KEY_A || e.keyCode === KeyCode.KEY_D) this.dir.x = 0;
    }
}
```

生命周期对照（已会 Unity 的直接映射）：`onLoad`=Awake、`start`=Start、`update`=Update、`onDestroy`=OnDestroy。

## 4. UI：Label 与 Button

Cocos 的 UI 是 2D 游戏常客——做一款"答题小游戏"的核心代码：

```typescript
import { _decorator, Component, Label, Button } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('QuizUI')
export class QuizUI extends Component {
    @property(Label)
    questionLabel: Label = null!;

    @property(Label)
    scoreLabel: Label = null!;

    private score = 0;

    start() {
        this.refresh();
        // 编辑器里把 Button 的 ClickEvents 绑到下面这些方法
    }

    onAnswerRight() {
        this.score += 10;
        this.refresh();
    }

    private refresh() {
        this.scoreLabel.string = `得分：${this.score}`;
    }
}
```

注意：Cocos 组件属性用 `@property` 装饰器暴露，编辑器里拖引用绑定——和 Unity 的 public 字段一个作用。

## 5. 碰撞系统（2D）

分组与回调：

1. Project Settings → Physics → 把节点设进 `player` / `coin` 分组
2. 节点加 **BoxCollider2D**（金币勾 `isTrigger`）
3. 挂脚本监听：

```typescript
import { _decorator, Component, ITriggerEvent } from 'cc';
const { ccclass } = _decorator;

@ccclass('CoinCollector')
export class CoinCollector extends Component {
    onBeginTrigger(selfCollider: any, otherCollider: any) {
        if (otherCollider.node.group === 'coin') {
            otherCollider.node.destroy();          // 吃掉金币
        }
    }
}
```

## 6. 预制体与动态生成

把节点拖进 assets/prefabs 生成预制体，代码实例化：

```typescript
import { instantiate, Prefab, instantiate } from 'cc';
@property(Prefab)
bulletPrefab: Prefab = null!;

fire() {
    const bullet = instantiate(this.bulletPrefab);
    this.node.scene.addChild(bullet);
    bullet.setPosition(this.node.position);
}
```

## 7. 发布微信小游戏（Cocos 的主场）

Build → Platform 选 **WeChat Mini Game** → 构建 → 用微信开发者工具打开 `build/wechatgame`。一次构建，包体直接符合小游戏限制（首包 4MB，资源走 CDN 远程加载）。

## 8. 学习路线图

1. 本文：Node/组件/碰撞/UI → 做完打飞机或答题游戏
2. 动画系统（Animation 编辑器 + 代码 tween）
3. 音效（AudioSource + AudioClip）
4. 屏幕适配（Canvas + Widget 对齐多分辨率）
5. 网络对战（WebSocket + 帧同步入门）

## 延伸阅读

- 站内相关：《Unity 游戏开发入门：场景、组件与第一个游戏》《游戏开发概论：循环、实体与玩法》《WebSocket 即时通讯》
- Cocos Creator 官方文档（中文一手资料，质量高）
- 《Cocos Creator 游戏开发实战》
