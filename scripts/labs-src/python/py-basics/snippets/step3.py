total = 0
for i in range(1, 101):
    total += i
print(total)  # 5050

day = 1
money = 1
while money < 100000000:
    day += 1
    money *= 2
print(day, money)  # 28 134217728
