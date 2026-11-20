---
title: Unity 游戏开发入门：场景、组件与第一个游戏
category: 游戏与图形
order: 2
tags: [Unity, C#, 游戏开发, GameObject]
summary: 从安装到发布：认识 Unity 编辑器、GameObject-Component 心智模型，亲手做出可玩的小游戏。
---

## 1. 安装与工程创建

1. 下载 [Unity Hub](https://unity.com/download)，登录免费个人版
2. 安装 LTS 长期支持版（勾选 **Windows Build Support** 和 IDE）
3. Hub → New Project → 选 **2D (Built-in)** 模板 → 命名 `Pong`

首次打开编辑器，五大窗口：

| 窗口 | 作用 |
| --- | --- |
| Scene | 搭建关卡的工作台 |
| Game | 玩家看到的画面（点 Play 预览） |
| Hierarchy | 当前场景所有对象的层级树 |
| Inspector | 选中对象的组件属性 |
| Project | 工程文件（Assets 资源库） |

## 2. 核心心智模型：GameObject + Component

Unity 里**一切皆 GameObject**（空的容器），行为全部来自**组件**：

```
GameObject "Player"
 ├─ Transform   （必有：位置/旋转/缩放）
 ├─ SpriteRenderer（画个图）
 ├─ Rigidbody2D （物理体：重力/碰撞）
 └─ PlayerController（你写的 C# 脚本）
```

这和前端给 div 挂 class、后端给类注入依赖是同一种组合思想。**加能力 = 挂组件，去掉能力 = 移除组件。**

## 3. 第一个脚本：控制角色移动

Project → 右键 Create → C# Script → 命名 `PlayerController`（文件名必须与类名一致）：

```csharp
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float speed = 5f;          // Inspector 里可调

    void Update()                      // 每帧调用一次
    {
        float x = Input.GetAxis("Horizontal");   // A/D 或 ←/→
        float y = Input.GetAxis("Vertical");

        Vector3 pos = transform.position;
        pos.x += x * speed * Time.deltaTime;     // deltaTime = dt
        pos.y += y * speed * Time.deltaTime;
        transform.position = pos;
    }
}
```

把脚本拖到 Player 对象上 → Play，WASD 可以动了。`Time.deltaTime` 就是上一课的 dt，Unity 帮你算好了。

生命周期三兄弟：

| 函数 | 调用时机 |
| --- | --- |
| `Awake()` | 对象初始化（不管脚本是否启用） |
| `Start()` | 第一帧 Update 前 |
| `Update()` | 每帧（放输入与逻辑） |
| `FixedUpdate()` | 固定物理步频（放物理力） |

## 4. 碰撞：让物理引擎干活

给球加 **Rigidbody2D**（受物理控制）+ **Circle Collider 2D**（形状）；给墙加 **Box Collider 2D**（静态碰撞体）。碰撞回调写脚本里：

```csharp
public class Ball : MonoBehaviour
{
    void OnCollisionEnter2D(Collision2D col)     // 物理碰撞
    {
        Debug.Log("撞到 " + col.gameObject.name);
    }

    void OnTriggerEnter2D(Collider2D other)      // 触发器（勾选 Is Trigger）
    {
        if (other.CompareTag("Coin"))
        {
            Destroy(other.gameObject);           // 吃金币
            Score.Add(10);
        }
    }
}
```

区分：**碰撞**=有物理阻挡（墙）；**触发器**=只通知不阻挡（金币、陷阱区域）。

## 5. 游戏管理：单例与状态

新建 `GameManager` 管分数和游戏结束：

```csharp
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    public int score;

    void Awake() { Instance = this; }          // 单例模式

    public void GameOver()
    {
        Debug.Log("得分: " + score);
        Time.timeScale = 0;                    // 暂停游戏世界
    }
}
```

## 6. 预制体（Prefab）：复用游戏对象

把调好的对象从 Hierarchy **拖回 Project 窗口** → 变成 Prefab 资产。之后：

- 代码动态生成：`Instantiate(prefab, pos, Quaternion.identity)`
- 改一处，所有实例同步更新

子弹、敌人、金币都做成 Prefab，用 `Instantiate` 生成。

## 7. 发布 WebGL

File → Build Settings → 选 **WebGL** → Build。产出网页版，部署到任意静态服务器即可在线游玩（也是毕业项目要求的发布形态）。

## 8. 学习路线图

1. 本文：移动 + 碰撞 + Prefab → 做完 Pong
2. Tilemap 关卡编辑 + 2D 光照 → 平台跳跃
3. Animator 状态机 → 角色动画（待机/跑/跳）
4. ScriptableObject 数据配置 → 伤害表、关卡表
5. 对象池 → 优化大量子弹的生成销毁

## 延伸阅读

- 站内相关：《游戏开发概论：循环、实体与玩法》《数据结构与算法入门》
- Unity 官方 Learn 平台：learn.unity.com（免费路径 Ruby's Adventure）
- 《Unity 游戏开发实战》
