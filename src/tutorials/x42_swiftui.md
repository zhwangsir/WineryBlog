---
title: Swift 与 SwiftUI 入门
category: 移动与跨端
order: 8
tags: [Swift, SwiftUI, iOS, 声明式UI]
summary: Swift 语法要点、SwiftUI 声明式界面、状态绑定与导航——iOS 原生开发的现代入口。
---

## 1. 环境：Xcode 与 Playgrounds

iOS 开发必须 macOS + **Xcode**（App Store 免费）。学习期可以不碰真机：Playgrounds 或 Xcode Preview 实时预览界面。

Swift 语法 5 分钟速览（面向已有 JS/TS/Kotlin 经验者）：

```swift
// 常量与变量
let name = "Winery"          // let = const
var age = 20                 // var = let

// 可选值 Optional：一切可能为空的值都用 ? 包裹
var nickname: String? = nil

// 安全解包三种方式
if let nick = nickname { print(nick) }          // 1. if let
print(nickname ?? "无名")                        // 2. ?? 默认值
// nickname!                                    // 3. 强解包（为 nil 直接崩，慎用）

// 结构体（Swift 主角，类只在需要继承时用）
struct User: Identifiable {
    let id = UUID()
    var name: String
    var level: Int
}

// 枚举带值（比大多数语言的枚举强）
enum Status {
    case loading
    case loaded(items: [String])
    case failed(reason: String)
}
```

**Optional 是 Swift 的灵魂**：编译器强制你处理 nil，空指针崩溃在 Swift 里几乎绝迹。

## 2. SwiftUI：声明式界面的苹果实现

会 React/Compose 就会 SwiftUI——同一套思想：**UI = f(state)**：

```swift
import SwiftUI

struct ContentView: View {
    @State private var count = 0           // 状态

    var body: some View {                  // body = 渲染函数
        VStack(spacing: 16) {              // 垂直布局
            Text("点了 \(count) 次")
                .font(.system(size: 48, weight: .bold))

            Button("点我") {
                count += 1                 // 改状态 → UI 自动更新
            }
            .buttonStyle(.borderedProminent)
        }
    }
}
```

修饰符链（`.font().padding().background()`）与 Modifier 概念和 Compose 一模一样：

```swift
Text("Hello")
    .font(.title)
    .foregroundStyle(.orange)
    .background(.orange.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
    .padding()
```

## 3. 列表与导航

```swift
struct TodoListView: View {
    let items = ["学 Swift", "写 App", "上架"]

    var body: some View {
        NavigationStack {
            List(items, id: \.self) { item in
                NavigationLink(value: item) {     // 有箭头的可点击行
                    Text(item)
                }
            }
            .navigationTitle("待办")
            .navigationDestination(for: String.self) { item in
                DetailView(item: item)
            }
        }
    }
}
```

`List` = LazyColumn/FlatList 的对应物（自带虚拟化）；`NavigationStack` 声明式导航路由。

## 4. 状态管理三件套

| 工具 | 作用 | 类比 |
| --- | --- | --- |
| `@State` | 视图私有状态 | useState |
| `@Binding` | 把状态"引用"传给子组件（子可写） | setState 回调 |
| `@Observable` | 共享模型对象（全局状态） | zustand/store |

```swift
// 全局状态模型（iOS 17+ 的 @Observable 宏）
@Observable
class AppStore {
    var todos: [String] = []
}

// 注入环境
ContentView().environment(appStore)

// 任意深层子视图直接取用
struct BadgeView: View {
    @Environment(AppStore.self) var store
    var body: some View { Text("\(store.todos.count) 项") }
}
```

## 5. 网络请求 + 异步：async/await 原生支持

```swift
struct UserResponse: Codable {           // Codable = JSON 自动映射
    let name: String
    let level: Int
}

func fetchUser() async throws -> UserResponse {
    let (data, _) = try await URLSession.shared
        .data(from: URL(string: "https://api.example.com/me")!)
    return try JSONDecoder().decode(UserResponse.self, from: data)
}

// 视图里用 task 修饰符：视图出现时执行，消失时自动取消
DetailView()
    .task {
        user = try? await fetchUser()
    }
```

`async/await`、`Codable` 自动 JSON 映射、`.task` 自动取消——现代感不输任何语言。

## 6. 上架流程速览

1. Apple Developer 账号（$99/年）
2. Xcode 签名 → Archive → 上传 App Store Connect
3. 填写截图/描述/隐私清单 → 审核（通常 1-3 天）
4. TestFlight 内测（最多 1 万人）先于正式发布

## 7. 学习路线图

1. 本文语法 + SwiftUI 基础 → 苹果官方 SwiftUI Tutorials（Hacking with Swift 的 100 Days of SwiftUI 免费课程极佳）
2. 表单输入、Tab 导航、数据持久化（SwiftData）
3. 网络 + async 并发（TaskGroup）
4. 完整项目：记账/天气 App → TestFlight → 上架

## 延伸阅读

- 站内相关：《Jetpack Compose 入门：声明式 Android UI》《React Native 入门：用 React 写原生 App》《移动与跨端》域其他教程
- Hacking with Swift — 100 Days of SwiftUI（免费，公认最佳入门）
- Apple 官方 SwiftUI Tutorials
