# ============================================================
# 函数：默认参数、关键字参数、*args / **kwargs、lambda 与 sorted 的 key
# 点右上角的「运行」（或按 Ctrl + Enter），输出显示在右侧
# ============================================================

# ── Step 1：默认参数与关键字参数 ──────────────────────────────
# def 定义函数，return 把结果交还给调用者。调用时参数可以按位置传，也可以写成「参数名=值」
def greet(name, greeting="你好"):             # greeting 有默认值，调用时可以不传
    return f"{greeting}，{name}！"

print(greet("林小满"))                         # → 你好，林小满！
print(greet("林小满", "早上好"))                # → 早上好，林小满！
print(greet(name="陈大文", greeting="晚上好"))  # → 晚上好，陈大文！
print(greet(greeting="欢迎", name="周小雨"))    # → 欢迎，周小雨！

def add(a, b):
    return a + b

result = add(3, 5)
print(result)                                 # → 8

def reset():                                 # 没有 return 的函数，返回 None
    count = 0                                # 这里的 count 是局部变量，只在函数内部存在

print(reset())                               # → None

# 经典的坑：默认值只在 def 执行时创建一次，可变的默认值会被多次调用共享
def append_bad(item, target=[]):
    target.append(item)
    return target

print(append_bad(1))                          # → [1]
print(append_bad(2))                          # → [1, 2]

# 正确写法：默认值用 None，在函数体里新建列表
def append_good(item, target=None):
    if target is None:
        target = []
    target.append(item)
    return target

print(append_good(1), append_good(2))         # → [1] [2]

# ── Step 2：*args 与 **kwargs ─────────────────────────────────
# *args 把多出来的「位置参数」收成一个元组；**kwargs 把「关键字参数」收成一个字典
def total(*args):
    return sum(args)

print(total(1, 2, 3))                         # → 6
print(total())                                # → 0

def kinds(*args, **kwargs):
    return f"{type(args).__name__} {args}；{type(kwargs).__name__} {kwargs}"

print(kinds(1, 2, 3, a=4, b=5))               # → tuple (1, 2, 3)；dict {'a': 4, 'b': 5}

def describe(**kwargs):
    parts = []
    for key, value in kwargs.items():
        parts.append(f"{key}={value}")
    return ", ".join(parts)

print(describe(name="林小满", age=24, city="杭州"))  # → name=林小满, age=24, city=杭州

def report(title, *args, **kwargs):          # 固定参数在最前，然后是 *args，最后是 **kwargs
    return f"【{title}】{len(args)} 个数，合计 {sum(args)}；{describe(**kwargs)}"

print(report("季度销量", 120, 135, 98, unit="件", region="华东"))  # → 【季度销量】3 个数，合计 353；unit=件, region=华东

# 调用时反过来：* 把列表「拆开」按位置传，** 把字典「拆开」按关键字传
nums = [120, 135, 98]
info = {"unit": "件", "region": "华东"}
print(report("季度销量", *nums, **info))       # → 【季度销量】3 个数，合计 353；unit=件, region=华东
print(total(*nums))                           # → 353

# ── Step 3：lambda 与 sorted 的 key ──────────────────────────
# lambda 是「一行的小函数」：lambda 参数: 返回值，常用来当「只用一次」的函数
print((lambda a, b: a + b)(3, 5))             # → 8

students = [("林小满", 92), ("陈大文", 85), ("周小雨", 96), ("赵铁柱", 78)]
print(sorted(students))                       # → [('周小雨', 96), ('林小满', 92), ('赵铁柱', 78), ('陈大文', 85)]

# key 指定「按什么排」：每个元素交给这个函数，用函数的返回值来比较大小
by_score = sorted(students, key=lambda s: s[1])
print(by_score)                               # → [('赵铁柱', 78), ('陈大文', 85), ('林小满', 92), ('周小雨', 96)]
print(sorted(students, key=lambda s: s[1], reverse=True))  # → [('周小雨', 96), ('林小满', 92), ('陈大文', 85), ('赵铁柱', 78)]
print(max(students, key=lambda s: s[1]))      # → ('周小雨', 96)
print(min(students, key=lambda s: s[1])[0])   # → 赵铁柱

employees = [
    {"name": "林小满", "salary": 18000, "dept": "研发部"},
    {"name": "陈大文", "salary": 25000, "dept": "产品部"},
    {"name": "周小雨", "salary": 21000, "dept": "研发部"},
]
for emp in sorted(employees, key=lambda emp: emp["salary"], reverse=True):
    print(emp["name"], emp["salary"])         # → 陈大文 25000 | 周小雨 21000 | 林小满 18000

words = ["banana", "Apple", "cherry", "apple"]
print(sorted(words))                         # → ['Apple', 'apple', 'banana', 'cherry']
print(sorted(words, key=str.lower))          # → ['Apple', 'apple', 'banana', 'cherry']
print(sorted(words, key=len, reverse=True))  # → ['banana', 'cherry', 'Apple', 'apple']
