# ============================================================
# 字符串与列表：常用方法、增删改、切片、遍历
# 点右上角的「运行」（或按 Ctrl + Enter），输出显示在右侧
# ============================================================

# ── Step 1：字符串的常用方法 ──────────────────────────────────
# 字符串不能被修改：每个方法都返回一个「新的字符串」，原来的不变
msg = "  Hello, Python 世界  "
clean = msg.strip()                          # strip：去掉两端的空白字符
print(clean)                                 # → Hello, Python 世界
print(clean.lower(), clean.upper())          # → hello, python 世界 HELLO, PYTHON 世界
print("hello world python".title())          # → Hello World Python

sentence = "python java go rust"
print(sentence.split())                      # → ['python', 'java', 'go', 'rust']
print(sentence.replace("go", "golang"))      # → python java golang rust
print(sentence.find("java"), sentence.find("c++"))  # → 7 -1
print(sentence.count("o"))                   # → 2
print("java" in sentence, "c++" in sentence)  # → True False
print(sentence.startswith("py"), sentence.startswith("java"))  # → True False

filename = "report.pdf"
print(filename.endswith(".pdf"), filename[0:6])  # → True report
print("-".join(["python", "java", "go"]))    # → python-java-go

# ── Step 2：列表的增、删、改 ──────────────────────────────────
# 列表 list：一串按顺序排好的值，用方括号表示；和字符串不同，列表可以修改
fruits = ["苹果", "香蕉", "橙子"]
print(fruits, len(fruits))                   # → ['苹果', '香蕉', '橙子'] 3

fruits.append("葡萄")                         # append：加到末尾
fruits.insert(1, "西瓜")                      # insert：插到下标 1 的位置（下标从 0 开始）
print(fruits)                                # → ['苹果', '西瓜', '香蕉', '橙子', '葡萄']

fruits[0] = "梨"                              # 改：直接给某个下标赋值
print(fruits[0], fruits[-1])                 # → 梨 葡萄

last = fruits.pop()                           # pop：删掉最后一个并返回它
print(last, fruits)                          # → 葡萄 ['梨', '西瓜', '香蕉', '橙子']

fruits.remove("西瓜")                         # remove：按值删除
del fruits[0]                                # del：按下标删除
print(fruits)                                # → ['香蕉', '橙子']

scores = [88, 92, 75, 60, 92, 98]
print(sorted(scores))                        # → [60, 75, 88, 92, 92, 98]
print(scores)                                # → [88, 92, 75, 60, 92, 98]
scores.sort(reverse=True)                    # sort：原地修改列表本身，reverse=True 表示降序
print(scores)                                # → [98, 92, 92, 88, 75, 60]
print(max(scores), min(scores), sum(scores), scores.index(75), scores.count(92))  # → 98 60 505 4 2

# ── Step 3：切片与遍历 ────────────────────────────────────────
# 切片 [起点:终点:步长]：含起点、不含终点；起点省略表示从头，终点省略表示到尾
week = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
print(week[0], week[2], week[-1])            # → 周一 周三 周日
print(week[0:5])                             # → ['周一', '周二', '周三', '周四', '周五']
print(week[5:])                              # → ['周六', '周日']
print(week[:3])                              # → ['周一', '周二', '周三']
print(week[::2])                             # → ['周一', '周三', '周五', '周日']
print(week[::-1])                            # → ['周日', '周六', '周五', '周四', '周三', '周二', '周一']

# 遍历：for 直接拿到每个元素
for day in week[:5]:
    print("上班：", day)                      # → 上班： 周一 | 上班： 周二 | 上班： 周三 | 上班： 周四 | 上班： 周五

# 边遍历边统计
scores = [88, 92, 75, 60, 92, 98]
passed = 0
for score in scores:
    if score >= 90:
        passed += 1
print(f"90 分以上的有 {passed} 人")            # → 90 分以上的有 3 人

# 需要下标时：range(len(...))，i 是下标，scores[i] 是对应的元素
for i in range(len(scores)):
    print(f"第 {i + 1} 个：{scores[i]}")        # → 第 1 个：88 | 第 2 个：92 | 第 3 个：75 | 第 4 个：60 | 第 5 个：92 | 第 6 个：98

# break：找到就立刻跳出整个循环
for score in scores:
    if score >= 90:
        first = score
        break
print("第一个 90 分以上的：", first)            # → 第一个 90 分以上的： 92
