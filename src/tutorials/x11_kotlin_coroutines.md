---
title: Kotlin 协程与 Flow
category: 移动与跨端/Android/Kotlin
order: 2
tags: [Kotlin, 协程, Flow, 异步]
summary: 挂起函数、协程作用域、Flow 数据流——Kotlin 异步编程的核心。
---

## 1. 协程：轻量级异步

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    launch {                        // 启动协程
        delay(1000L)                // 非阻塞挂起 1 秒
        println("World!")
    }
    print("Hello, ")
}
```

协程比线程轻量万倍：可启动十万级协程而只占几 MB 内存。`delay` 不阻塞线程——线程让给其他协程。

## 2. 协程作用域

| 作用域 | 生命周期 | Android 场景 |
| --- | --- | --- |
| `GlobalScope` | 全局 | ⚠️ 不推荐（泄漏） |
| `lifecycleScope` | Activity/Fragment | UI 相关 |
| `viewModelScope` | ViewModel | 数据加载 |

```kotlin
class MyViewModel : ViewModel() {
    fun loadData() {
        viewModelScope.launch {     // ViewModel 销毁时自动取消
            val data = fetchFromNetwork()
            _uiState.value = data
        }
    }
}
```

## 3. 挂起函数

```kotlin
suspend fun fetchUser(id: Int): User {
    delay(1000)                    // 模拟网络请求
    return User("winery", 3)
}

// 串行调用（总耗时 = 各次之和）
val user = fetchUser(1)
val orders = fetchOrders(user.id)

// 并行调用（总耗时 = 最长的那个）
val userDeferred = async { fetchUser(1) }
val ordersDeferred = async { fetchOrders(1) }
val user = userDeferred.await()
val orders = ordersDeferred.await()
```

## 4. 异常处理

```kotlin
try {
    viewModelScope.launch {
        val data = fetchData()
    }
} catch (e: Exception) {
    _error.value = e.message
}

// CoroutineExceptionHandler
val handler = CoroutineExceptionHandler { _, e ->
    println("捕获: $e")
}
launch(handler) { throw Exception("崩了") }
```

## 5. Flow：响应式数据流

```kotlin
fun fetchData(): Flow<String> = flow {
    emit("开始加载")
    delay(1000)
    emit("数据块1")
    delay(500)
    emit("数据块2")
}

// 收集
lifecycleScope.launch {
    fetchData().collect { value ->
        println("收到: $value")
    }
}
```

Flow 操作符链：

```kotlin
flowOf(1, 2, 3)
    .map { it * 2 }
    .filter { it > 2 }
    .onEach { println("收到 $it") }
    .collect()
```

## 6. StateFlow 与 SharedFlow

```kotlin
// StateFlow：状态持有（总是有值）
private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
val uiState: StateFlow<UiState> = _uiState.asStateFlow()

// SharedFlow：事件广播
private val _events = MutableSharedFlow<Event>()
val events = _events.asSharedFlow()

fun sendEvent(e: Event) { _events.emit(e) }
```

## 7. Android 实战模式

```kotlin
class MyViewModel : ViewModel() {
    private val _items = MutableStateFlow<List<Item>>(emptyList())
    val items: StateFlow<List<Item>> = _items.asStateFlow()

    fun refresh() {
        viewModelScope.launch {
            _items.value = repository.fetchItems()
        }
    }
}
```

## 延伸阅读

- [Kotlin 协程官方指南](/post/ref-kotlinlang-org-docs-coroutines-guide-html)
- 站内相关：《2.Kotlin 必知必会》《Android 四大组件与生命周期》《OkHttp 使用指南》
