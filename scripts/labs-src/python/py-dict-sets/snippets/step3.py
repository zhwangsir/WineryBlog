a = {1, 2, 3, 4, 5}
b = {4, 5, 6, 7}
print(sorted(a & b))   # 交集 [4, 5]
print(sorted(a | b))   # 并集 [1, 2, 3, 4, 5, 6, 7]
print(sorted(a - b))   # 差集 [1, 2, 3]
