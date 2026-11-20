---
title: 滑动窗口与双指针：线性时间的子串艺术
category: 数据结构与算法
order: 9
tags: [滑动窗口, 双指针, 算法, 优化]
summary: 同向/相向/快慢双指针、可变长滑动窗口模板——把 O(n²) 暴力降到 O(n) 的通用心法。
---

## 1. 什么时候想到双指针

特征识别：**数组/字符串 + 连续区间 + 暴力解是两层循环枚举子数组/子串**。双指针的本质：**利用单调性，让左右指针各自只走一遍**——两层循环变一层。

三兄弟：
1. **快慢指针**：同向不同速（链表找中点、判环）
2. **同向双指针**：读写分离（原地删除重复项）
3. **相向双指针**：两端夹逼（二分、回文、接雨水）
4. **滑动窗口**：同向的特例——右指针扩张、左指针按条件收缩

## 2. 滑动窗口万能模板

记住这个骨架，90% 的滑动窗口题都往里套：

```javascript
function slidingWindow(s) {
  const window = {};                    // 窗口内的状态（计数/集合）
  let left = 0, ans = 0;

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    window[c] = (window[c] || 0) + 1;   // 1. 右指针元素进窗

    while (/* 窗口不合法 */) {           // 2. 不合法就收缩左端
      window[s[left]]--;
      left++;
    }

    ans = Math.max(ans, right - left + 1);  // 3. 此时窗口合法，更新答案
  }
  return ans;
}
```

关键理解：**right 每步前进一格，left 最多前进 n 格**——总操作数 ≤ 2n，所以是 O(n)。

## 3. 例一：无重复字符的最长子串（LeetCode 3）

```javascript
function lengthOfLongestSubstring(s) {
  const window = new Set();
  let left = 0, ans = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    while (window.has(c)) {             // 重复了 → 收缩直到挤出去
      window.delete(s[left++]);
    }
    window.add(c);
    ans = Math.max(ans, right - left + 1);
  }
  return ans;
}
// "abcabcbb" → 3 ("abc")
```

## 4. 例二：最小覆盖子串（LeetCode 76，Hard 模板题）

找 s 中包含 t 全部字符的**最短**子串。注意这题求的是"最小窗口"——更新答案的时机在**收缩过程中**：

```javascript
function minWindow(s, t) {
  const need = {}, window = {};
  for (const c of t) need[c] = (need[c] || 0) + 1;
  let left = 0, valid = 0, start = 0, len = Infinity;

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (need[c]) {
      window[c] = (window[c] || 0) + 1;
      if (window[c] === need[c]) valid++;           // 一个字符凑够数量
    }
    while (valid === Object.keys(need).length) {    // 窗口已覆盖全部字符
      if (right - left + 1 < len) { start = left; len = right - left + 1; }
      const d = s[left++];
      if (need[d]) {
        if (window[d] === need[d]) valid--;         // 收缩导致不足
        window[d]--;
      }
    }
  }
  return len === Infinity ? '' : s.slice(start, start + len);
}
// minWindow("ADOBECODEBANC", "ABC") → "BANC"
```

**求最长**：答案在每步 right 前进后更新；**求最短**：答案在收缩过程中更新。方向别搞反。

## 5. 相向双指针两道经典

### 对撞：盛最多水的容器（LeetCode 11）
```javascript
function maxArea(height) {
  let l = 0, r = height.length - 1, ans = 0;
  while (l < r) {
    ans = Math.max(ans, (r - l) * Math.min(height[l], height[r]));
    // 短板移动才可能更优：移动长板宽度变小高度不增 → 必亏
    height[l] < height[r] ? l++ : r--;
  }
  return ans;
}
```

**正确性论证**（双指针题的核心）：每次移动短板，跳过的所有状态都不可能更优——这就是"指针不回头依然正确"的证明模板。

### 归并：合并两个有序数组（原地，LeetCode 88）
从后往前填，避免覆盖：

```javascript
function merge(nums1, m, nums2, n) {
  let i = m - 1, j = n - 1, k = m + n - 1;
  while (j >= 0) {
    nums1[k--] = (i >= 0 && nums1[i] > nums2[j]) ? nums1[i--] : nums2[j--];
  }
}
```

## 6. 快慢指针：链表三板斧

```javascript
// 找中点：快 2 倍速，慢指针停在中间
function middle(head) {
  let slow = head, fast = head;
  while (fast && fast.next && fast.next.next) {
    slow = slow.next; fast = fast.next.next;
  }
  return slow;
}

// 判环：快指针追上慢指针 = 有环（Floyd 判圈）
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

## 7. 滑动窗口maximum 题变形速查

| 题目 | 窗口条件 | 求什么 |
| --- | --- | --- |
| LC3 无重复最长子串 | 窗口内无重复 | 最长 |
| LC76 最小覆盖子串 | 覆盖 t 全字符 | 最短 |
| LC209 长度最小的子数组 | 和 ≥ target | 最短 |
| LC424 替换后的最长重复字符 | 窗口内非众数字符数 ≤ k | 最长 |
| LC567 字符串的排列 | 计数匹配 | 存在性 |

全是同一个模板换条件——刷题时把模板肌肉记忆化。

## 延伸阅读

- 站内相关：《哈希与字符串算法：从 Map 到 KMP》《排序与搜索算法全解》《回溯与剪枝：排列组合的系统化搜索》
- 《算法（第 4 版）》——双指针与排序章节
- labuladong 的算法小抄（滑动窗口章节，模板同源）
