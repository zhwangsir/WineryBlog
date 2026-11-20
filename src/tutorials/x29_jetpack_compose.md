---
title: Jetpack Compose 入门：声明式 Android UI
category: 移动与跨端
order: 6
tags: [Jetpack Compose, Android, Kotlin, 声明式UI]
summary: 从 XML 到声明式：Composable 函数、状态驱动、列表与导航——Android UI 的现代写法。
---

## 1. 命令式 vs 声明式：范式转变

传统 Android View 体系是**命令式**：拿到控件引用，手动改它的状态：

```kotlin
// XML 体系：UI 定义和逻辑分离，更新靠手动同步
val tv = findViewById<TextView>(R.id.count)
tv.text = "$count"          // 每次变化都要自己记得更新
tv.visibility = if (loading) View.VISIBLE else View.GONE
```

Compose 是**声明式**：UI = f(state)。描述"状态是什么样"，框架负责把界面变成那个样子：

```kotlin
@Composable
fun Counter() {
    var count by remember { mutableStateOf(0) }   // 状态
    Button(onClick = { count++ }) {               // UI 是状态的函数
        Text("点了 $count 次")
    }
}
```

没有 findViewById、没有手动 setText——**状态一变，引用它的界面自动重算**。React/Flutter/SwiftUI 全是这套思想，学一次通吃。

## 2. Composable 函数：组合优于继承

所有 UI 都是 `@Composable` 函数，嵌套组合成树：

```kotlin
@Composable
fun UserProfile(name: String, online: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Avatar(name)                       // 自定义组件即函数
        Column {
            Text(name, style = MaterialTheme.typography.titleMedium)
            Text(if (online) "在线" else "离线",
                 color = if (online) Color(0xFF4CAF50) else Color.Gray)
        }
    }
}

@Composable
fun Avatar(name: String) {
    Box(
        modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFFF27D26)),
        contentAlignment = Alignment.Center
    ) {
        Text(name.take(1), color = Color.White, fontSize = 20.sp)
    }
}
```

**Modifier** 是组件的能力插件链：`.size().clip().background().padding().clickable()`——和 CSS class 思路一致，链式叠加。

## 3. 状态管理：remember 与状态提升

```kotlin
// remember：重组时保住状态；mutableStateOf：变化触发重组
var text by remember { mutableStateOf("") }

// 跨组件共享：状态提升到最近公共父级（和 React 相同）
@Composable
fun TodoScreen() {
    var items by remember { mutableStateOf(listOf<String>()) }
    TodoInput(onAdd = { items = items + it })     // 子组件回调修改父状态
    TodoList(items)                               // 数据单向流下
}

@Composable
fun TodoInput(onAdd: (String) -> Unit) {
    var draft by remember { mutableStateOf("") }
    Row {
        TextField(value = draft, onValueChange = { draft = it })
        Button(onClick = { onAdd(draft); draft = "" }) { Text("添加") }
    }
}
```

记住两条规则：**状态往下传（参数）、事件往上传（回调）**；状态放"谁用谁持有，多人用提父级"。

生命周期版本（旋转屏幕不丢）：

```kotlin
var count by rememberSaveable { mutableStateOf(0) }
```

## 4. 列表：LazyColumn

RecyclerView 的现代替代品，只渲染可见项：

```kotlin
@Composable
fun TodoList(items: List<String>) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        items(items, key = { it }) { item ->        // key 保证动画与状态正确
            Text(item, modifier = Modifier.fillMaxWidth().padding(12.dp))
        }
    }
}
```

带动画的增删（自动处理 item 位移）：

```kotlin
animateItem()   // 在 item 内容上链上这个 modifier
```

## 5. 导航：Navigation Compose

```kotlin
val navController = rememberNavController()
NavHost(navController, startDestination = "list") {
    composable("list") {
        TodoScreen(onOpenDetail = { id -> navController.navigate("detail/$id") })
    }
    composable("detail/{id}") { backStackEntry ->
        DetailScreen(id = backStackEntry.arguments?.getString("id"))
    }
}
```

路由即字符串模板，参数从 backStackEntry 取——和 Web 路由一个思路。

## 6. 实战检查单（毕业项目预演）

- [ ] 全程 Compose 无 XML 布局（Activity 里 `setContent { }`）
- [ ] 状态提升架构清晰：无状态组件可单独预览
- [ ] `@Preview` 注解为关键组件写预览（不用跑模拟器调 UI）
- [ ] 列表带 key + 动画
- [ ] 主题化：Color/Type/Shape 走 MaterialTheme，不硬编码颜色
- [ ] Loading/Error/Empty 三态都有界面

## 7. 与旧体系的关系

Compose 与 View 可以共存（`ComposeView` 嵌入、`AndroidView` 反向嵌入），老项目可渐进迁移。新项目 2024 年后官方默认 Compose——Kotlin-first 的所有新 API（CameraX Compose、Compose Maps）都在这边。

## 延伸阅读

- 站内相关：《Kotlin 快速上手》《Kotlin 协程与 Flow》《Android 四大组件与生命周期》
- 官方 Compose 路径：developer.android.com/courses/jetpack-compose/course
- 《Jetpack Compose 从入门到实战》
