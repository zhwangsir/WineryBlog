---
title: Flutter 状态管理进阶
category: 移动与跨端
order: 10
tags: [Flutter, 状态管理, Riverpod, Provider]
summary: setState 的局限、Provider/Riverpod/Bloc 三大方案对比、不可变状态与单向数据流——跨过 Flutter 的第一道坎。
---

## 1. setState 的边界

入门时一切用 `setState`，但它有两条硬边界：

1. **只在本 State 类内有效**——跨页面/深层组件共享状态时，要么层层传参（prop drilling），要么用全局变量（失控）
2. **粗粒度刷新**——`setState` 重跑整个 build，列表页顶部一个计数器变化会重建整页

```dart
// 状态提升的痛苦： fourthLevelWidget 需要层层穿针引线
Page(state) → Section(state) → Card(state) → FourthLevel(state, onChanged)
```

状态管理的本质 = **把状态从组件树里解放出来，放到可被任意层级精确订阅的地方**。

## 2. Provider：官方推荐的入门方案

InheritedWidget 的封装（简化版，理解概念用）：

```dart
// 1. 状态模型：不可变 + copyWith
@immutable
class TodoState {
  final List<String> items;
  const TodoState(this.items);
  TodoState copyWith({List<String>? items}) =>
      TodoState(items ?? this.items);
}

// 2. ChangeNotifier：状态容器 + 变更通知
class TodoStore extends ChangeNotifier {
  TodoState _state = TodoState([]);
  TodoState get state => _state;

  void add(String item) {
    _state = _state.copyWith(items: [..._state.items, item]);
    notifyListeners();                 // 广播给所有监听者
  }
}

// 3. 注入到组件树顶部
runApp(ChangeNotifierProvider(
  create: (_) => TodoStore(),
  child: MyApp(),
));

// 4. 任意深度精确订阅：只有用到的部分重建
class TodoBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final count = context.select<TodoStore, int>((s) => s.state.items.length);
    return Badge(count);               // items 变化时只有这里重建
  }
}
```

`context.select` 是关键——**按字段粒度订阅**，避免"任何变化全员重建"。

## 3. Riverpod：现代主流（推荐新项目）

Provider 的进化版，编译期安全、无需 context、天然支持异步：

```dart
// 1. 定义 Provider（全局、可组合）
final todoProvider = NotifierProvider<TodoNotifier, List<Todo>>(() => TodoNotifier());

class TodoNotifier extends Notifier<List<Todo>> {
  @override
  List<Todo> build() => [];

  void add(String title) => state = [...state, Todo(title: title)];
  void toggle(String id) => state = [
    for (final t in state)
      if (t.id == id) t.copyWith(done: !t.done) else t
  ];
}

// 2. 异步数据：FutureProvider 把"请求中/成功/失败"建模成状态
final userProvider = FutureProvider.autoDispose.family<User, String>((ref, id) {
  return api.fetchUser(id);
});

// 3. UI 消费
class UserView extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider('u1'));     // watch = 订阅
    return user.when(
      loading: () => CircularProgressIndicator(),
      error: (e, _) => Text('出错了 $e'),
      data: (u) => Text(u.name),
    );
  }
}
```

三态建模（loading/error/data）让异步 UI 不再手写 if-else。`autoDispose` 在无监听时自动释放——内存管理白送。

## 4. Bloc：大团队与强规范

Bloc（Business Logic Component）走**事件驱动**路线：UI 只发事件，Bloc 收事件吐状态，严格单向数据流：

```dart
// 事件与状态都是不可变类
sealed class CartEvent {}
class CartItemAdded extends CartEvent { final Product p; CartItemAdded(this.p); }

class CartBloc extends Bloc<CartEvent, CartState> {
  CartBloc() : super(CartEmpty()) {
    on<CartItemAdded>((event, emit) {
      emit(CartLoaded([...current.items, event.p]));
    });
  }
}

// UI 只能发事件，永远不直接改状态
context.read<CartBloc>().add(CartItemAdded(product));
```

强约束 = 大团队协作不失控 + 事件流可追溯（每个状态变化都有事件原因）。代价是样板代码多。**小项目 Riverpod，大团队/严格审计需求 Bloc**。

## 5. 选型决策树

```
练手小 Demo          → setState + 简单传参
个人/中小项目         → Riverpod（现代、灵活、异步友好）
维护老项目            → 已有 Provider 就继续 Provider
大团队/需要严格审计    → Bloc
```

无论哪个框架，**架构原则不变**：
1. **状态不可变**：更新 = 创建新对象（copyWith），绝不原地改
2. **单向数据流**：状态往下走，事件往上走
3. **UI 是状态的纯函数**：build 里没有任何业务逻辑
4. **按粒度订阅**：只有真正依赖某状态的组件才重建

## 6. 实战检查单（记账 App 场景）

- [ ] 账目列表/统计/设置拆成独立 Provider
- [ ] 列表页用 `select` 只订阅自己的切片
- [ ] 异步加载走 AsyncValue 三态
- [ ] 删除/修改操作走不可变更新（copyWith / 列表展开）
- [ ] 旋转屏幕状态不丢（Provider 生命周期在 widget 树之外）

## 延伸阅读

- 站内相关：《Flutter 入门：环境搭建与第一个应用》《Flutter 与 uni-app：跨端开发入门》《Jetpack Compose 入门：声明式 Android UI》
- 《Riverpod 官方文档》（[本地镜像](/post/ref-riverpod-docs)）——质量极高
- 《Flutter 实战·第二版》（免费在线电子书）
