# ============================================================
# 推导式：列表推导式、字典推导式、生成器表达式、enumerate / zip
# 点右上角的「运行」（或按 Ctrl + Enter），输出显示在右侧
# ============================================================

nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
words = ["python", "java", "go", "rust"]

# ── Step 1：列表推导式 ────────────────────────────────────────
# 三行 for 循环做的事，一行推导式就能写完：[表达式 for 变量 in 可迭代对象]
squares = []
for n in nums:
    squares.append(n * n)
print(squares)                               # → [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
print([n * n for n in nums])                 # → [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]

# for 的末尾加 if 表示筛选：只要满足条件的元素
evens = [n for n in nums if n % 2 == 0]
print(evens)                                 # → [2, 4, 6, 8, 10]

# if … else 写在 for 的前面，表示「每个元素按条件转换」
labels = ["偶数" if n % 2 == 0 else "奇数" for n in nums]
print(labels)                                # → ['奇数', '偶数', '奇数', '偶数', '奇数', '偶数', '奇数', '偶数', '奇数', '偶数']

# 不只数字可以推导：算出每个单词的长度
lengths = [len(w) for w in words]
print(lengths)                               # → [6, 4, 2, 4]

# ── Step 2：字典推导式 ────────────────────────────────────────
# {键: 值 for …}，常用来从列表造查找表、反转字典
word_len = {w: len(w) for w in words}
print(word_len)                              # → {'python': 6, 'java': 4, 'go': 2, 'rust': 4}

inverted = {length: w for w, length in word_len.items()}
print(inverted)                              # → {6: 'python', 4: 'rust', 2: 'go'}

scores = {"语文": 92, "数学": 88, "英语": 95, "物理": 76}
passed = {subject: score for subject, score in scores.items() if score >= 90}
print(passed)                                # → {'语文': 92, '英语': 95}

# ── Step 3：生成器表达式、enumerate 与 zip ────────────────────
# 把方括号换成圆括号就是生成器表达式：不一次性造出整个列表，边算边取
total = sum(n * n for n in nums)
print(total)                                 # → 385
print(max(len(w) for w in words))            # → 6

# enumerate：同时拿到下标和元素（start=1 让下标从 1 开始）
for i, w in enumerate(words, start=1):
    print(i, w)                              # → 1 python | 2 java | 3 go | 4 rust

# zip：把多个列表「拉」在一起，逐组遍历
names = ["林小满", "陈大文", "周小雨"]
points = [92, 85, 96]
for rank, (name, point) in enumerate(zip(names, points), start=1):
    print(f"第 {rank} 名：{name} {point} 分")   # → 第 1 名：林小满 92 分 | 第 2 名：陈大文 85 分 | 第 3 名：周小雨 96 分
