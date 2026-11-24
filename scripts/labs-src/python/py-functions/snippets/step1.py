def greet(name, greeting="你好"):     # greeting 有默认值，调用时可以不传
    return f"{greeting}，{name}！"

print(greet("林小满"))                          # 你好，林小满！
print(greet(name="陈大文", greeting="晚上好"))   # 晚上好，陈大文！
