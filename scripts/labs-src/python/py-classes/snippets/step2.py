def deposit(self, amount):            # 第一个参数固定是 self
    if amount <= 0:
        return False
    self.balance += amount
    return True

def withdraw(self, amount):
    if amount <= 0 or amount > self.balance:
        return False
    self.balance -= amount
    return True

def transfer(self, other, amount):
    if not self.withdraw(amount):     # 先从自己这里扣款
        return False
    other.deposit(amount)
    return True
