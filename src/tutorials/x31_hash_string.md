---
title: 哈希与字符串算法：从 Map 到 KMP
category: 数据结构与算法
order: 7
tags: [哈希表, KMP, 字符串算法, 算法]
summary: 哈希冲突与扩容、字符串匹配从暴力到 KMP、滚动哈希——高频面试题背后的原理。
---

## 1. 哈希表：O(1) 从哪来

数组靠下标 O(1) 定位；哈希表的魔法是**把 key 算成下标**：

```
hash("apple") = 34512  →  index = 34512 % capacity = 7   → 存到桶 7
```

查、增、删都是 O(1)——前提是 hash 足够均匀。但不同 key 可能算到同一格：**哈希冲突**。

### 冲突解决两种流派

1. **链地址法**（Java HashMap/Python dict）：每个桶挂链表，冲突就往链上挂。链太长退化成 O(n) → Java 8 在链长 ≥8 且表长 ≥64 时转**红黑树**（O(log n)）
2. **开放寻址**（Redis/Python 旧版）：冲突就往后找下一个空位。缓存友好（数据连续内存），Redis 字典扩容用渐进式 rehash（新旧两表并存，慢慢搬迁）

### 负载因子与扩容

`负载因子 = 元素数 / 桶数`。超过阈值（Java 默认 0.75）就扩容翻倍 + 全量 rehash。**均摊 O(1)** 的"均摊"就来自偶尔一次 O(n) 的 rehash 被摊薄。

面试高频：为什么容量是 2 的幂？——`hash % capacity` 可以优化成 `hash & (capacity-1)`，位运算比取模快；同时让高位也参与扰动，减少碰撞。

## 2. 用哈希表解题的三个套路

```javascript
// ① 计数：字母异位词
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const cnt = {};
  for (const c of s) cnt[c] = (cnt[c] || 0) + 1;
  for (const c of t) if (!cnt[c]--) return false;
  return true;
}

// ② 已见集合：两数之和（一次遍历）
function twoSum(nums, target) {
  const seen = new Map();                 // value → index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
}

// ③ 前缀和哈希：和为 K 的子数组个数
function subarraySum(nums, k) {
  const pre = new Map([[0, 1]]);          // 前缀和 → 出现次数
  let sum = 0, ans = 0;
  for (const n of nums) {
    sum += n;
    ans += pre.get(sum - k) || 0;         // sum[j]-sum[i]=k 的组合数
    pre.set(sum, (pre.get(sum) || 0) + 1);
  }
  return ans;
}
```

识别特征：题目问"是否存在/出现过/配对/个数"，且只需 O(1) 判断 key → **哈希表**。

## 3. 字符串匹配：暴力 → KMP

### 暴力 O(n·m)
主串每个位置对齐模式串逐个比对——失配就回退主串指针重来。

### KMP 的洞察：失配信息不要浪费
模式串自己最了解自己。**next 数组**（失配函数）预处理出：在第 j 位失配后，模式串应该跳到哪个位置继续比，而主串指针**永不回退**：

```javascript
function buildNext(p) {
  const next = [0];
  let k = 0;                              // 当前最长相等前后缀长度
  for (let i = 1; i < p.length; i++) {
    while (k > 0 && p[i] !== p[k]) k = next[k - 1];   // 失配递归回退
    if (p[i] === p[k]) k++;
    next.push(k);
  }
  return next;                            // next[i] = p[0..i] 的最长相等前后缀
}

function kmp(s, p) {
  const next = buildNext(p);
  let k = 0;
  for (let i = 0; i < s.length; i++) {
    while (k > 0 && s[i] !== p[k]) k = next[k - 1];
    if (s[i] === p[k]) k++;
    if (k === p.length) return i - k + 1; // 命中
  }
  return -1;
}
```

直觉："abcabx" 在 x 失配 → 已匹配的 "abcab" 前缀 "ab" = 后缀 "ab" → 直接把模式串滑到从 "ab" 后继续，主串不动。预处理 O(m)，匹配 O(n)。

## 4. 滚动哈希（Rabin-Karp）：字符串变数字比较

把字符串看成进制数取模——**窗口滑动时 O(1) 更新哈希**：

```javascript
function rabinKarp(s, p) {
  const base = 131, MOD = 1e9 + 7;
  const m = p.length;
  let ph = 0, wh = 0, pw = 1;
  for (let i = 0; i < m; i++) {
    ph = (ph * base + p.charCodeAt(i)) % MOD;
    wh = (wh * base + s.charCodeAt(i)) % MOD;
    if (i) pw = (pw * base) % MOD;
  }
  for (let i = m; i <= s.length; i++) {
    if (wh === ph && s.slice(i - m, i) === p) return i - m;  // 哈希相等再真比（防碰撞）
    if (i < s.length)
      wh = ((wh - s.charCodeAt(i - m) * pw) * base + s.charCodeAt(i)) % MOD;  // O(1) 滑动
  }
  return -1;
}
```

应用：多篇文档查重、找最长重复子串（配合二分）、字符串去重。

## 5. 现实工程里的字符串算法

- **每天在用**：语言内置的 dict/map（哈希）、路由匹配（前缀树 Trie）、git commit id（SHA 哈希）
- **搜索引擎**：倒排索引 = 分词 + 哈希/ Trie + 排序
- **生物信息**：基因序列匹配就是 Rabin-Karp 的原生场景
- **面试矩阵**：两数之和（哈希）、无重复最长子串（滑动窗口+哈希）、实现 strStr（KMP）、单词搜索（Trie+回溯）

## 延伸阅读

- 站内相关：《排序与搜索算法全解》《数据结构与算法入门》《动态规划入门：从递推到刷题套路》
- 《算法（第 4 版）》第 3、5 章——哈希与字符串
- OI Wiki 字符串篇（KMP/Z 函数/AC 自动机进阶）
