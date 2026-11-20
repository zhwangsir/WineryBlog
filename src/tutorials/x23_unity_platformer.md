---
title: Unity 2D 平台跳跃实战：从白盒到可玩关卡
category: 游戏与图形
order: 5
tags: [Unity, 2D, 平台跳跃, 游戏开发]
summary: 角色控制器、Tilemap 关卡、摄像机跟随与死亡重生——做出第一个完整可玩的平台跳跃游戏。
---

## 1. 目标与工程准备

本课终点：一个**可玩、可死、可重开**的 2D 平台跳跃关卡——角色跑跳、平台碰撞、摄像机跟随、掉坑重生、收集金币。

新建工程：2D 模板 → `Assets` 下建四个文件夹 `Scripts / Sprites / Prefabs / Scenes`。养成第一天就管理目录的习惯。

## 2. 角色：Rigidbody vs 手写控制器

平台跳跃的移动**不要用** Rigidbody 的物理力（会滑、会抖），标准做法是**自己算速度，物理引擎只做碰撞**：

```csharp
public class PlayerController : MonoBehaviour
{
    public float moveSpeed = 8f;
    public float jumpForce = 16f;
    public Transform groundCheck;          // 脚底空物体
    public LayerMask groundLayer;          // 哪些层算地面
    private Rigidbody2D rb;
    private bool isGrounded;

    void Start() => rb = GetComponent<Rigidbody2D>();

    void Update()
    {
        float input = Input.GetAxisRaw("Horizontal");   // -1/0/1，干脆无斜坡
        rb.linearVelocity = new Vector2(input * moveSpeed, rb.linearVelocity.y);

        isGrounded = Physics2D.OverlapCircle(groundCheck.position, 0.1f, groundLayer);
        if (Input.GetButtonDown("Jump") && isGrounded)
            rb.linearVelocity = new Vector2(rb.linearVelocity.x, jumpForce);
    }
}
```

组件配置：
- Rigidbody2D：`Gravity Scale = 3`（手感更脆）、`Collision Detection = Continuous`（防穿平台）
- Collider2D：Box Collider 2D
- 脚底放子物体 `GroundCheck`（空 Transform），Layer 设为 Player，地面放 Ground 层

**OverlapCircle 检测**：在脚底画个小圆，碰到 Ground 层 = 站在地上。比 `OnCollisionStay` 计数法可靠得多。

## 3. 手感三件套（上过物理课就能懂）

```csharp
[Header("手感调校")]
public float coyoteTime = 0.1f;      // 土狼时间
public float jumpBuffer = 0.1f;      // 输入缓冲
private float coyoteCounter, bufferCounter;

void Update()
{
    if (isGrounded) coyoteCounter = coyoteTime;
    else coyoteCounter -= Time.deltaTime;

    if (Input.GetButtonDown("Jump")) bufferCounter = jumpBuffer;
    else bufferCounter -= Time.deltaTime;

    if (bufferCounter > 0 && coyoteCounter > 0)
    {
        rb.linearVelocity = new Vector2(rb.linearVelocity.x, jumpForce);
        bufferCounter = 0;
    }

    // 变高跳：松键截断上升
    if (Input.GetButtonUp("Jump") && rb.linearVelocity.y > 0)
        rb.linearVelocity = new Vector2(rb.linearVelocity.x, rb.linearVelocity.y * 0.5f);
}
```

调参原则：先在 Inspector 里试到爽，再回写代码默认值。

## 4. Tilemap 搭关卡

Window → 2D → Tile Palette：
1. Hierarchy 右键 → 2D Object → Tilemap → Rectangular
2. 导入素材（免费：Unity Asset Store 的 pixel adventure），Sprite Mode 改 **Multiple** → Slice
3. Palette 里拖入瓦片，笔刷手绘关卡
4. Tilemap Renderer 加 **Tilemap Collider 2D**，再挂 **Composite Collider 2D**（合并碎片碰撞体，性能好且墙面不卡）

## 5. 摄像机跟随（带死区）

```csharp
public class CameraFollow : MonoBehaviour
{
    public Transform target;
    public float smooth = 0.15f;
    public Vector3 offset = new(0, 1.5f, -10);
    private Vector3 velocity;

    void LateUpdate()     // 等玩家先动完
    {
        Vector3 want = target.position + offset;
        transform.position = Vector3.SmoothDamp(transform.position, want, ref velocity, smooth);
    }
}
```

限制摄像机不出地图边界：加 `Mathf.Clamp` 或用 Cinemachine Confiner（组件方案，推荐）。

## 6. 金币、死亡与重生

**金币（触发器）**：
```csharp
public class Coin : MonoBehaviour
{
    void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Player"))
        {
            GameManager.Instance.AddCoin();
            Destroy(gameObject);
        }
    }
}
```

**死亡区 + 重生**：
```csharp
public class KillZone : MonoBehaviour
{
    private void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Player"))
            other.GetComponent<PlayerRespawn>()?.Die();
    }
}

public class PlayerRespawn : MonoBehaviour
{
    private Vector3 spawnPoint;

    void Start() => spawnPoint = transform.position;
    public void Die()
    {
        transform.position = spawnPoint;
        GetComponent<Rigidbody2D>().linearVelocity = Vector2.zero;
    }
}
```

死亡区就是一个大 Box Collider（Is Trigger）铺在地图底部。

## 7. 完成度清单（毕业项目的最小标准）

- [ ] 跑/跳手感调校过（土狼时间 + 输入缓冲 + 变高跳）
- [ ] ≥1 个完整关卡：起点、挑战段、终点旗
- [ ] 金币计分 UI（TextMeshPro + GameManager 事件）
- [ ] 死亡重生无 bug（掉坑/尖刺）
- [ ] 背景音乐 + 跳跃音效
- [ ] Build WebGL 发布

## 延伸阅读

- 站内相关：《Unity 游戏开发入门：场景、组件与第一个游戏》《游戏物理入门：碰撞、重力与轨迹》《游戏开发概论：循环、实体与玩法》
- Unity 官方教程 2D Platformer Microgame
- 《蔚蓝》（Celeste）开发者 GDC 演讲——手感设计的巅峰案例
