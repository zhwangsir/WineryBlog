---
title: Unity 动画系统：Animator 状态机
category: 游戏与图形
order: 7
tags: [Unity, Animator, 动画状态机, 游戏开发]
summary: Animation Clip → Animator Controller → 代码驱动切换——让角色会跑、会跳、会摔的完整动画管线。
---

## 1. 动画系统的三层结构

Unity 角色动画由三层组成，别混淆：

| 层 | 是什么 | 类比 |
| --- | --- | --- |
| Animation Clip | 单段动画（跑/跳/待机的关键帧序列） | 一帧素材 |
| Animator Controller | 状态机：什么时候播哪段、怎么过渡 | 播放列表的导演 |
| Animator 组件 | 挂在角色上，引用 Controller | 播放器 |

## 2. 准备素材与 Clip

导入角色素材（Asset Store 免费：Sunny Land / Kaykit），Sprite Mode 选 **Multiple** → Slice 拆帧。Window → Animation → Animation 窗口：

1. 选中角色 GameObject
2. Animation 窗口点 Create → 保存为 `Idle.anim`
3. 把待机的几帧 Sprite 拖进时间轴（每帧 0.1s 左右）
4. 同法创建 `Run.anim`、`Jump.anim`

每创建一个 Clip，Unity 自动生成一个 Animator Controller（角色上自动挂了 Animator 组件）。

## 3. Animator Controller：搭状态机

双击 Controller 打开 **Animator 窗口**：

1. 右键 → Create State → Empty，或直接把 Clip 拖进去
2. **Entry**（入口）连线到默认状态（待机）——橙色状态
3. 右键状态 → Make Transition 拉到另一个状态

过渡（Transition）有方向：Idle→Run 和 Run→Idle 是两条独立的线。

## 4. 参数与条件：让代码控制切换

Animator 窗口左上角 Parameters → 加参数：

- **Bool** `isRunning`（是否在移动）
- **Bool** `isGrounded`（是否在地面）

给每条 Transition 设置条件：

| 过渡 | 条件 | 设置 |
| --- | --- | --- |
| Idle → Run | isRunning = true | Has Exit Time **取消勾选**（立即切换） |
| Run → Idle | isRunning = false | 同上 |
| 任意 → Jump | isGrounded = false | 取消 Has Exit Time |
| Jump → Idle | isGrounded = true | 勾选 Fixed Duration 0.15s 过渡时间 |

**Has Exit Time 是新手头号坑**：勾着它，动画播完才会切换——跑步变待机会"卡半秒"。玩家输入驱动的切换一律取消勾选。

## 5. 代码驱动

```csharp
public class PlayerAnimator : MonoBehaviour
{
    private Animator anim;
    private Rigidbody2D rb;
    private PlayerController ctrl;      // 上节课的控制器（有 isGrounded）

    void Start()
    {
        anim = GetComponent<Animator>();
        rb = GetComponent<Rigidbody2D>();
        ctrl = GetComponent<PlayerController>();
    }

    void Update()
    {
        bool running = Mathf.Abs(rb.linearVelocity.x) > 0.1f;
        anim.SetBool("isRunning", running);
        anim.SetBool("isGrounded", ctrl.isGrounded);

        // 面朝方向：翻转 Sprite
        if (rb.linearVelocity.x != 0)
            transform.localScale = new Vector3(Mathf.Sign(rb.linearVelocity.x), 1, 1);
    }
}
```

代码永远只写**事实**（"我在跑"），Animator 自己决定播什么——这就是状态机的价值：切换逻辑集中在可视化面板，代码不散落 `if (xxx) play("run")`。

## 6. 混合树：速度渐变动画

走→跑不该是生硬切换。Parameters → 加 **Float** `speed`，右键 → Create State → **From New Blend Tree**：

```
Blend Tree (2D/1D)
  参数: speed
  0.0  → Walk 动画
  0.7  → Jog 动画
  1.0  → Sprint 动画
```

代码里只改 `anim.SetFloat("speed", rb.linearVelocity.x / maxSpeed)`——引擎自动按速度插值混合，脚步动画丝滑过渡。

## 7. 动画事件与根运动（进阶速览）

- **动画事件**：在 Clip 时间轴上插回调（跳跃动画第 3 帧触发音效；挥剑第 5 帧判定伤害）——Animation 窗口 Add Event，绑定到组件的 public 方法
- **Root Motion**：动画自带位移（翻滚的位移感）。平台游戏建议关闭 `Apply Root Motion`，位移全交给物理；动作游戏开启让动画驱动
- **动画层**（Layers）：上半身挥枪 + 下半身跑步分开混合——FPS 游戏标配

## 8. 毕业自测

1. Idle/Run/Jump/Fall 四态状态机能跑通（无 Has Exit Time 卡顿）
2. 混合树按速度渐变走路跑步
3. 跳跃动画带事件：起跳瞬间播音效
4. 用 SetFloat/SetBool 全部从代码驱动，无一处动画硬编码

## 延伸阅读

- 站内相关：《Unity 2D 平台跳跃实战》《Unity 游戏开发入门：场景、组件与第一个游戏》《游戏物理入门：碰撞、重力与轨迹》
- Unity 官方文档 Animator Controller
- GDC 演讲《Animation Bootcamp》系列——状态机之外：程序化动画思想
