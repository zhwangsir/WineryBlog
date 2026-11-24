names = ["林小满", "陈大文", "周小雨"]
points = [92, 85, 96]
for rank, (name, point) in enumerate(zip(names, points), start=1):
    print(f"第 {rank} 名：{name} {point} 分")
# 第 1 名：林小满 92 分
# 第 2 名：陈大文 85 分
# 第 3 名：周小雨 96 分
