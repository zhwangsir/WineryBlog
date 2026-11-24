@property
def level(self):                # 像属性一样访问：account.level，不用加括号
    if self.balance >= 5000:
        return "金卡"
    if self.balance >= 200:
        return "银卡"
    return "普通"
