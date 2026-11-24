fruits = ["苹果", "香蕉", "橙子"]
fruits.append("葡萄")        # 加到末尾
fruits.insert(1, "西瓜")     # 插到下标 1 的位置
fruits[0] = "梨"             # 改：直接给下标赋值
print(fruits)                # ['梨', '西瓜', '香蕉', '橙子', '葡萄']

scores = [88, 92, 75, 60, 92, 98]
scores.sort(reverse=True)    # 原地降序
print(scores)                # [98, 92, 92, 88, 75, 60]
