students = [("林小满", 92), ("陈大文", 85), ("周小雨", 96)]

by_score = sorted(students, key=lambda s: s[1])   # 按分数升序
print(by_score)                                   # [('陈大文', 85), ('林小满', 92), ('周小雨', 96)]
print(max(students, key=lambda s: s[1]))          # ('周小雨', 96)
