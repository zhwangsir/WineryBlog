class BankAccount:
    bank = "星衡银行"                       # 类属性：所有实例共用一份

    def __init__(self, owner, balance=0):   # 创建对象时自动执行
        self.owner = owner
        self.balance = balance              # 实例属性：每个对象各有一份

    def __repr__(self):                     # print(对象) 时显示的内容
        return f"BankAccount({self.owner!r}, {self.balance})"


print(BankAccount("林小满", 100))   # BankAccount('林小满', 100)
