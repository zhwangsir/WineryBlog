# ============================================================
# Python 基础：变量与类型、f-string、分支、循环
# 点右上角的「运行」（或按 Ctrl + Enter），输出显示在右侧
# ============================================================

# ── Step 1：变量、类型与 f-string ──────────────────────────────
# 变量不用事先声明类型：直接赋值，type() 可以查看它现在是哪种类型
name = "林小满"        # 字符串 str：用引号包起来
age = 24              # 整数 int
height = 1.68         # 浮点数 float：带小数点
is_student = True     # 布尔值 bool：只有 True / False 两个值

print(name, age, height, is_student)  # → 林小满 24 1.68 True
print(type(name), type(age), type(height), type(is_student))  # → <class 'str'> <class 'int'> <class 'float'> <class 'bool'>

# f-string：字符串前面加 f，花括号里可以放变量，也可以放算式
# TODO（Step 1-①）：输出「我叫林小满，今年 24 岁」——f"我叫{name}，今年 {age} 岁"
# TODO（Step 1-②）：输出「身高 1.68 米，明年 25 岁」，明年的岁数在花括号里用 age + 1 算出来

# 花括号里还能写「格式说明」：冒号后面的 .1f 表示保留 1 位小数，.2f 表示保留 2 位
price = 9.9
count = 3
print(f"身高保留 1 位小数：{height:.1f} 米")  # → 身高保留 1 位小数：1.7 米
# TODO（Step 1-③）：输出「3 杯奶茶一共 29.70 元」——金额是 price * count，用 :.2f 保留两位小数

# 类型转换：str()、int()、float()。int() 把小数部分直接砍掉，不是四舍五入
age_text = str(age)
price_int = int(price)
print(age_text + "岁", price_int, type(age_text).__name__)  # → 24岁 9 str

# ── Step 2：if / elif / else ──────────────────────────────────
# 行首的缩进表示「哪些行属于哪个分支」，同一个代码块里的缩进必须一致
score = 86

grade = "待判断"

# TODO（Step 2）：用 if / elif / else 给 grade 赋值：
#   90 分及以上 → "优秀"；80 分及以上 → "良好"；60 分及以上 → "及格"；否则 → "不及格"

print(f"{score} 分：{grade}")  # → 86 分：良好

# 条件从上往下依次判断，命中一个就不再看后面的分支
hour = 21
if hour < 12:
    greeting = "早上好"
elif hour < 18:
    greeting = "下午好"
else:
    greeting = "晚上好"

print(greeting)  # → 晚上好

# 多个条件用 and、or、not 连接；比较运算符是 >、<、>=、<=、==（等于）、!=（不等于）
has_ticket = True
bag_weight = 12

if has_ticket and bag_weight <= 10:
    result = "可以登机"
else:
    result = "行李超重，需要托运"

print(result, has_ticket or False, not has_ticket)  # → 行李超重，需要托运 True False

# ── Step 3：for、while 与 range ────────────────────────────────
# range(1, 101) 依次产生 1、2、…、100（含头不含尾），for 把每个数交给变量 i
total = 0
# TODO（Step 3-①）：用 for i in range(1, 101) 把 1 加到 100，每次 total += i
print(f"1 加到 100 = {total}")  # → 1 加到 100 = 5050

# 只写一个数：从 0 开始；写三个数：第三个是步长
print(list(range(5)))  # → [0, 1, 2, 3, 4]
print(list(range(2, 11, 3)))  # → [2, 5, 8]

# for 也可以直接遍历一组数据
for lang in ["Python", "Go", "Rust"]:
    print("我在学", lang)  # → 我在学 Python | 我在学 Go | 我在学 Rust

# while：只要条件还成立就一直循环。1 分钱每天翻倍，第几天能超过 100 万元（1 亿分）？
day = 1
money = 1
# TODO（Step 3-②）：只要 money < 100000000，就让 day 加 1、money 翻倍
print(f"第 {day} 天，一共有 {money} 分")  # → 第 28 天，一共有 134217728 分

# continue：跳过本轮循环剩下的部分（偶数被跳过，只累加了 1 到 10 里的奇数）
odd_total = 0
for i in range(1, 11):
    if i % 2 == 0:
        continue
    odd_total += i
print(f"1 到 10 的奇数之和 = {odd_total}")  # → 1 到 10 的奇数之和 = 25
