name = "林小满"
age = 24
height = 1.68

# f-string：字符串前面加 f，花括号里可以放变量和算式
print(f"我叫{name}，今年 {age} 岁")          # 我叫林小满，今年 24 岁
print(f"身高 {height} 米，明年 {age + 1} 岁")  # 身高 1.68 米，明年 25 岁

price = 9.9
count = 3
print(f"{count} 杯奶茶一共 {price * count:.2f} 元")  # 3 杯奶茶一共 29.70 元
