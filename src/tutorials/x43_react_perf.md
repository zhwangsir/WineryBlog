---
title: React 性能优化实战
category: Web 前端
order: 7
tags: [React, 性能优化, useMemo, 虚拟列表]
summary: 重组渲染的成因与测量、memo 体系、虚拟列表与代码分割——让大列表页面如丝般顺滑。
---

## 1. 先测量，再优化

React 性能问题的根源只有一个词：**不必要的重新渲染（re-render）**。状态变化时，持有该状态的组件及其**全部子树**都会重新执行。先看哪里在乱渲染：

```jsx
// React Developer Tools → Profiler → Record
// 高亮 re-render 的组件，看"why did this render?"
```

原则：**没有 Profiler 证据不动手**。下面的手法按"病因→处方"组织。

## 2. 病因一：父组件渲染拖累子组件

列表页顶部有个搜索框，每敲一个字整个列表重渲染：

```jsx
function Page() {
  const [query, setQuery] = useState('');
  return (
    <>
      <SearchBox value={query} onChange={setQuery} />
      <ExpensiveList data={hugeData} />   {/* query 变化它也重渲染！ */}
    </>
  );
}
```

**处方：状态下放**。把 query 状态挪进 SearchBox 内部，或用组合模式把 children 当静态 props 传（children 引用不变则不重渲染）：

```jsx
// 组合模式：children 是早就创建好的元素，Page 重渲染时 children 引用不变
function Layout() {
  const [query, setQuery] = useState('');
  return (
    <>
      <SearchBox value={query} onChange={setQuery} />
      <ExpensiveList />     {/* 自身有 memo 才彻底，或拆成独立组件由 Suspense 包裹 */}
    </>
  );
}
```

## 3. 病因二：引用类型的 props 每次都"变"

`memo` 包住子组件后依然重渲染？因为 props 里的对象/函数每次都是新引用：

```jsx
// 三件套：memo + useMemo + useCallback
const Row = memo(function Row({ item, onSelect }) {     // ① props 浅比较
  return <div onClick={() => onSelect(item.id)}>{item.title}</div>;
});

function List() {
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(                              // ② 数据缓存
    () => hugeData.filter(x => x.active),
    [hugeData]
  );

  const onSelect = useCallback((id) => {                 // ③ 函数引用稳定
    setSelected(id);
  }, []);

  return filtered.map(item => (
    <Row key={item.id} item={item} onSelect={onSelect} />
  ));
}
```

**useMemo/useCallback 不是默认加的糖**：只在有 memo 隔离层或依赖开销大时才加，到处乱加反而增加缓存成本。

## 4. 病因三：超大列表渲染几千个 DOM

1 万行列表 = 1 万个 DOM 节点，浏览器渲染直接卡死。**虚拟列表**只渲染视口内的行：

```jsx
// react-window（成熟库）
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={10000}
  itemSize={48}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>第 {index} 行</div>   // 只有 ~20 个真实 DOM
  )}
</FixedSizeList>
```

原理：外层容器滚动 + 内层用 padding/transform 撑起总高度，DOM 只保留可见区 ±buffer。10 万行也只渲染 20 个节点。

## 5. 病因四：首屏加载 2MB 的 JS 包

**代码分割**：路由级 lazy + Suspense：

```jsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));      // 访问才加载

<Suspense fallback={<Spin />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

配合 Vite 的 `rollup-plugin-visualizer` 分析包构成——常见大头：moment.js（换 dayjs）、lodash 全量引入（改 `lodash-es` 按需）、图表库（按需注册组件）。

## 6. 长任务与交互卡顿

主线程被长任务占住 → 点击无响应。解法按序：

1. **防抖/节流**：搜索输入 300ms 防抖、滚动 100ms 节流
2. **useDeferredValue**：React 18+ 内置"低优先级渲染"——输入立即响应，列表结果延迟渲染：

```jsx
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => filter(deferredQuery), [deferredQuery]);
```

3. **Web Worker**：真正重的计算（大 JSON 解析、复杂排序）丢 worker 线程

## 7. 优化清单（按收益排序）

1. [ ] Profiler 找出渲染热点（不猜）
2. [ ] 状态下放，缩小状态影响的组件范围
3. [ ] 长列表虚拟化
4. [ ] 路由级代码分割 + 包体分析
5. [ ] memo/useMemo/useCallback 精准使用（有测量支撑）
6. [ ] 图片：WebP + 懒加载 `loading="lazy"` + 固定宽高防 CLS
7. [ ] Lighthouse 跑分对比优化前后

## 延伸阅读

- 站内相关：《React 核心补充：Hooks 与状态管理》《Web 性能优化实战》《浏览器渲染原理与事件循环》
- react.dev 官方文档《Rendering List》《Escape Hatches》章节
- 《高性能 React》（第 2 版）
