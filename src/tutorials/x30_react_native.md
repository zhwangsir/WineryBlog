---
title: React Native 入门：用 React 写原生 App
category: 移动与跨端
order: 7
tags: [React Native, 跨端, 移动开发, React]
summary: 已会 React 的一步跨进移动端：核心组件差异、导航、原生能力与渲染原理。
---

## 1. 为什么前端工程师选 RN

RN 的核心承诺：**你写的还是 React（JSX + hooks + 状态流），编译出来的是原生移动 App**。Web 技能复用度 70%+，剩余 30% 是移动端差异：

| Web | RN | 差异点 |
| --- | --- | --- |
| `<div>` | `<View>` | 布局容器 |
| `<p>/<span>/<h1>` | `<Text>` | **一切文字必须在 Text 里** |
| `<img>` | `<Image>` | 必须写尺寸或 flex |
| `<input>` | `<TextInput>` | 无受控/非受控之分 |
| `<button>` | `<Pressable>/<TouchableOpacity>` | 手势反馈自己做 |
| CSS class | `StyleSheet` 对象 / 内联样式 | 只支持 flex 布局的子集 |

## 2. 第一个 App

```bash
npx create-expo-app MyApp          # Expo：RN 的官方脚手架与云构建
cd MyApp && npx expo start         # 手机装 Expo Go 扫码即可真机预览
```

Expo 是 RN 的事实标准开发方式（官方已把路由、构建、推送全包了）。新项目一律 Expo。

```jsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <View style={styles.container}>
      <Text style={styles.count}>{count}</Text>
      <Pressable style={styles.btn} onPress={() => setCount(c => c + 1)}>
        <Text style={styles.btnText}>+1</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  count: { fontSize: 64, fontWeight: '700' },
  btn: { backgroundColor: '#F27D26', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 18 },
});
```

**布局注意**：RN 里 flex 默认 `flexDirection: 'column'`（Web 是 row）；尺寸单位是无单位数字（逻辑像素 dp）；没有 vw/vh，用百分比字符串或 Dimensions。

## 3. 导航：Expo Router（文件即路由）

会 Next.js 就会它——`app/` 目录即路由：

```
app/
  _layout.tsx        # 根布局（包导航器）
  index.tsx          # /
  detail/[id].tsx    # /detail/123
```

```tsx
// index.tsx
import { Link, router } from 'expo-router';
<Link href={{ pathname: '/detail/[id]', params: { id: '42' } }}>看详情</Link>
router.push('/detail/42');
```

```tsx
// detail/[id].tsx
import { useLocalSearchParams } from 'expo-router';
const { id } = useLocalSearchParams();
```

## 4. 网络与状态：和 Web 完全一样

fetch/axios、React Query、zustand——Web 上用的 RN 全通用。唯一差异：

```jsx
// 图片要写 style 尺寸（没有自动尺寸）
<Image source={{ uri: url }} style={{ width: 64, height: 64 }} />
```

## 5. 原生能力：Expo SDK

相机、定位、通知、文件系统都是包：

```jsx
import * as Location from 'expo-location';
const { status } = await Location.requestForegroundPermissionsAsync();  // 权限先行
const pos = await Location.getCurrentPositionAsync({});
```

遇到 Expo 没覆盖的原生功能（如特定蓝牙协议）→ 写/装 **Expo Module 或裸 RN 原生模块**（Kotlin/Swift 桥接）——这是 RN 深水区，也是它和 Flutter 的核心差距所在。

## 6. 性能三律

1. **列表用 FlatList/FlashList**，别用 map 渲染长列表（没有虚拟化的 ScrollView 会卡爆）
2. **减少 JS 桥流量**：大列表数据分页、图片用 expo-image（缓存 + 渐进加载）
3. **动画用 Reanimated**（跑在 UI 线程），别用 setState 驱动逐帧动画（跑 JS 线程会掉帧）

## 7. RN vs Flutter 怎么选

| | React Native | Flutter |
| --- | --- | --- |
| 语言 | JS/TS（前端直接上） | Dart（要新学） |
| UI 方案 | 原生控件桥接（新架构 JSI） | 自绘引擎（Skia/Impeller） |
| 一致性 | 平台差异自然存在 | 双端像素级一致 |
| 生态 | npm 全家桶 | pub.dev（质量高但量少） |
| 团队 | 前端团队首选 | 专职移动团队/极致体验 |

前端团队做 App：**RN 默认选项**；追求极端一致 UI 与性能的重交互 App：Flutter。

## 延伸阅读

- 站内相关：《React 核心补充：Hooks 与状态管理》《Flutter 入门：环境搭建与第一个应用》《Flutter 与 uni-app：跨端开发入门》
- React Native 官方文档 / Expo 文档
- 《React Native 移动开发实战》
