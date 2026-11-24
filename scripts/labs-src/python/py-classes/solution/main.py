# ============================================================
# 类与对象：class、__init__、实例方法、@property、__repr__
# 点右上角的「运行」（或按 Ctrl + Enter），输出显示在右侧
# ============================================================

# ── Step 1：定义类：class、__init__、__repr__ ──────────────────
# class 是「图纸」，对象是照着图纸造出来的「实例」。类名习惯用大驼峰：每个单词的首字母大写
class BankAccount:
    bank = "星衡银行"                         # 类属性：所有实例共用一份

    def __init__(self, owner, balance=0):      # 构造方法：创建对象时自动执行
        self.owner = owner                    # self 指「正在创建的这个对象」
        self.balance = balance                # 实例属性：每个对象各有一份

    def __repr__(self):                       # 规定 print(对象) 时显示什么
        return f"BankAccount({self.owner!r}, {self.balance})"

    # ── Step 2：实例方法 ──────────────────────────────────────
    def deposit(self, amount):                # 方法的第一个参数固定是 self，调用时不用传
        if amount <= 0:                       # 金额不合法：不修改余额
            return False
        self.balance += amount
        return True

    def withdraw(self, amount):
        if amount <= 0 or amount > self.balance:   # 余额不足
            return False
        self.balance -= amount
        return True

    def transfer(self, other, amount):        # 从自己这里扣款，存入另一个账户
        if not self.withdraw(amount):         # 扣款失败（金额不合法或余额不足）就直接返回 False
            return False
        other.deposit(amount)
        return True

    # ── Step 3：@property ────────────────────────────────────
    @property
    def level(self):                          # 像属性一样访问：account.level，不用加括号
        if self.balance >= 5000:
            return "金卡"
        if self.balance >= 200:
            return "银卡"
        return "普通"


account = BankAccount("林小满", 100)            # 类名加括号：创建一个实例，参数交给 __init__
other = BankAccount("陈大文")                  # balance 用默认值 0
print(account.owner, account.balance)         # → 林小满 100
print(account)                                # → BankAccount('林小满', 100)
print(other)                                  # → BankAccount('陈大文', 0)
print(account.bank, other.bank, BankAccount.bank)  # → 星衡银行 星衡银行 星衡银行
print(type(account).__name__, account.owner == other.owner)  # → BankAccount False

# ── Step 2：实例方法 ──────────────────────────────────────────
# account.deposit(50) 等价于 BankAccount.deposit(account, 50)
print(account.deposit(50), account.balance)   # → True 150
print(account.deposit(-10), account.balance)  # → False 150
print(account.withdraw(1000), account.balance)  # → False 150
print(account.withdraw(60), account.balance)  # → True 90
print(account.transfer(other, 30), account.balance, other.balance)  # → True 60 30
print(BankAccount.deposit(account, 10) == account.deposit(10), account.balance)  # → True 80

# 实例属性只属于各自的对象：给 account 加的属性，other 没有
account.remark = "老客户"
print(account.remark, other.__dict__)         # → 老客户 {'owner': '陈大文', 'balance': 30}

# ── Step 3：@property：像属性一样访问的方法 ───────────────────
vip = BankAccount("周小雨", 5000)
silver = BankAccount("赵铁柱", 200)
print(vip.level, silver.level, account.level)  # → 金卡 银卡 普通
print(f"{vip.owner} 是{vip.level}，余额 {vip.balance} 元")  # → 周小雨 是金卡，余额 5000 元


# property 还能带 setter，在赋值时做检查
class Temperature:
    def __init__(self, celsius=0):
        self.celsius = celsius                # 这一行其实调用了下面的 setter

    @property
    def celsius(self):                        # 读取 t.celsius 时执行
        return self._celsius

    @celsius.setter
    def celsius(self, value):                 # 给 t.celsius 赋值时执行：先检查，再保存
        if value < -273.15:
            raise ValueError(f"{value} 低于绝对零度")
        self._celsius = value                 # 约定：名字以单个下划线开头表示「内部使用」

    @property
    def fahrenheit(self):                     # 只读的计算属性：由摄氏度换算而来
        return self._celsius * 9 / 5 + 32


t = Temperature(25)
print(t.celsius, f"{t.fahrenheit:.1f}")       # → 25 77.0
t.celsius = 100
print(t.celsius, f"{t.fahrenheit:.1f}")       # → 100 212.0
