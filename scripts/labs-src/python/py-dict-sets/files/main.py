# ============================================================
# 字典与集合：读写、遍历、统计、去重与交并差
# 点右上角的「运行」（或按 Ctrl + Enter），输出显示在右侧
# ============================================================

# ── Step 1：字典的读与写 ──────────────────────────────────────
# 字典 dict：键值对的集合，用花括号；靠「键」取「值」，键通常用字符串
student = {"name": "林小满", "age": 24, "city": "杭州"}
print(student["name"], student["age"])       # → 林小满 24

# TODO（Step 1-①）：把 age 改成 25——键已经存在，赋值就是修改
student["major"] = "计算机"                   # 键不存在：新增
print(student)                               # → {'name': '林小满', 'age': 25, 'city': '杭州', 'major': '计算机'}

print("city" in student, "phone" in student)  # → True False
print(student.get("phone"))                  # → None
print(student.get("phone"))            # TODO（Step 1-②）：给 get 加上默认值 "未填写"

city = student.pop("city")                   # pop：删掉这个键值对，并返回它的值
del student["major"]                         # del：直接删除
print(city, student)                         # → 杭州 {'name': '林小满', 'age': 25}
print(len(student), list(student))           # → 2 ['name', 'age']
print(student.keys())                        # → dict_keys(['name', 'age'])
print(student.values())                      # → dict_values(['林小满', 25])
print(student.items())                       # → dict_items([('name', '林小满'), ('age', 25)])

# ── Step 2：遍历字典，用字典做统计 ────────────────────────────
scores = {"语文": 92, "数学": 88, "英语": 95, "物理": 76}

for subject in scores:                       # 直接遍历字典，拿到的是「键」
    print(subject, scores[subject])          # → 语文 92 | 数学 88 | 英语 95 | 物理 76

for subject, score in scores.items():        # items()：一次拿到键和值
    print(f"{subject}：{score}")              # → 语文：92 | 数学：88 | 英语：95 | 物理：76

print(sum(scores.values()), max(scores.values()) - min(scores.values()))  # → 351 19

# 统计出现次数（词频）：get 的默认值正好派上用场
text = "苹果 香蕉 苹果 橙子 苹果 香蕉"
counter = {}
for word in text.split():
    pass                                # TODO（Step 2）：counter[word] = counter.get(word, 0) + 1，没出现过先当作 0
print(counter)                               # → {'苹果': 3, '香蕉': 2, '橙子': 1}

# 嵌套：字典的值可以是列表，也可以是另一个字典
classroom = {
    "name": "三班",
    "students": ["林小满", "陈大文", "周小雨"],
    "teacher": {"name": "王老师", "subject": "数学"},
}
print(classroom["students"][1], classroom["teacher"]["subject"])  # → 陈大文 数学

# ── Step 3：集合：去重与交、并、差 ────────────────────────────
# 集合 set：没有重复元素，也没有先后顺序（所以打印之前先 sorted() 排一下，结果才稳定）
nums = [3, 1, 3, 2, 1, 4, 2]
unique = set(nums)
print(sorted(unique), len(unique))           # → [1, 2, 3, 4] 4
print(3 in unique, 9 in unique)              # → True False

a = {1, 2, 3, 4, 5}
b = {4, 5, 6, 7}
print(a, b)                        # TODO（Step 3-①）：改成 sorted(a & b)，两个集合的交集
print(a, b)                        # TODO（Step 3-②）：改成 sorted(a | b)，并集
print(a, b)                        # TODO（Step 3-③）：改成 sorted(a - b) 和 sorted(b - a)，两个方向的差集
print(sorted(a ^ b))                         # → [1, 2, 3, 6, 7]

a.add(6)                                     # add：加入元素；已经有了就什么都不做
a.add(6)
a.discard(1)                                 # discard：移除元素；不存在也不报错
a.discard(99)
print(sorted(a))                             # → [2, 3, 4, 5, 6]
print({4, 5} <= a, {1, 2} <= a)              # → True False

tags = ["python", "sql", "python", "go", "sql", "python"]
print(len(tags), len(set(tags)))             # → 6 3
print(sorted(set(tags)))                     # → ['go', 'python', 'sql']
print(type({}).__name__, type(set()).__name__)  # → dict set
