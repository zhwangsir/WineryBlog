nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
print([n * n for n in nums])                            # [1, 4, 9, …, 100]
print([n for n in nums if n % 2 == 0])                  # 筛选：[2, 4, 6, 8, 10]
print(["偶数" if n % 2 == 0 else "奇数" for n in nums][:3])  # 转换：['奇数', '偶数', '奇数']
