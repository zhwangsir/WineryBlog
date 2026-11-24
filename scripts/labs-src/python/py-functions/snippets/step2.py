def total(*args):                   # 多出来的位置参数收成一个元组
    return sum(args)

def report(title, *args, **kwargs):  # **kwargs 把关键字参数收成一个字典
    return f"【{title}】{len(args)} 个数，合计 {sum(args)}"

print(total(1, 2, 3))           # 6
print(report("销量", 120, 98))  # 【销量】2 个数，合计 218
