---
title: Python 装饰器与生成器：闭包的两种应用
category: 编程语言
order: 5
tags: [Python, 装饰器, 生成器, 闭包]
summary: 闭包是地基，装饰器是包装，生成器是流动——一条主线讲透 Python 两大高级特性。
---

## 1. 地基：闭包（Closure）

闭包 = **内层函数 + 它捕获的外层作用域变量**。内层函数"记住"了定义时的环境，即使外层函数已经返回：

```python
def make_counter():
    count = 0
    def counter():
        nonlocal count           # 声明修改外层变量（不加则视为新建局部变量）
        count += 1
        return count
    return counter               # 返回内层函数，count 随它一起"活着"

c = make_counter()
print(c(), c(), c())             # 1 2 3 —— 状态藏在闭包里
```

`__closure__` 属性可以窥见被捕获的变量（cell 对象）。**装饰器和生成器都是闭包思想的不同延伸**：前者把"函数的加工"封装成闭包，后者把"值的暂停与恢复"用迭代器协议表达。

## 2. 装饰器：函数的包装流水线

装饰器 = **接收函数、返回新函数的可调用对象**。`@` 语法只是糖：

```python
@decorator
def foo(): ...

# 等价于
def foo(): ...
foo = decorator(foo)
```

最小可用示例——计时装饰器：

```python
import time, functools

def timed(func):
    @functools.wraps(func)                     # 保住原函数的 __name__/__doc__（关键！）
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)         # 调用原函数
        cost = time.perf_counter() - start
        print(f'{func.__name__} 耗时 {cost:.3f}s')
        return result
    return wrapper

@timed
def slow_work():
    time.sleep(0.5)

slow_work()   # slow_work 耗时 0.501s
```

**`functools.wraps` 是必写项**：不写它，被装饰后的函数 `__name__` 变成 'wrapper'——调试器、日志、API 文档全部错乱。这是装饰器使用第一名坑。

## 3. 带参数的装饰器：三层嵌套

`@retry(times=3)` 中的 `retry(times=3)` **先执行**，返回真正的装饰器——所以是三层函数：

```python
def retry(times=3, delay=0.5):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == times:
                        raise
                    print(f'第 {attempt} 次失败: {e}，{delay}s 后重试')
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(times=3, delay=1)
def fetch_api():
    ...        # 自动获得重试能力
```

记忆口诀：**@ 后面跟什么，就先执行什么**——`@retry(times=3)` 先执行 `retry(times=3)` 得到装饰器。

## 4. 经典应用三件套

```python
# ① 注册器（框架路由的本质）
ROUTES = {}
def route(path):
    def decorator(func):
        ROUTES[path] = func
        return func
    return decorator

@route('/users')
def list_users(): ...

# ② 缓存（标准库 lru_cache 就是现成的）
import functools
@functools.lru_cache(maxsize=1024)
def fib(n):
    return n if n < 2 else fib(n-1) + fib(n-2)
# fib(200) 瞬间完成——无缓存则指数爆炸

# ③ 权限校验（Web 框架的 @login_required）
def login_required(func):
    @functools.wraps(func)
    def wrapper(user, *args, **kwargs):
        if not user.is_login:
            raise PermissionError('请先登录')
        return func(user, *args, **kwargs)
    return wrapper
```

lru_cache 附带 `cache_info()`（命中率/淘汰数）与 `cache_clear()`——递归优化第一工具。

## 5. 类装饰器与装饰器类的区别

```python
class CountCalls:
    def __init__(self, func):          # 装饰时执行一次
        functools.update_wrapper(self, func)
        self.func = func
        self.calls = 0

    def __call__(self, *args, **kwargs):   # 每次调用执行
        self.calls += 1
        return self.func(*args, **kwargs)

@CountCalls
def greet(): ...
greet(); greet()
print(greet.calls)     # 2 —— 状态存在实例上，比闭包更易检查
```

函数装饰器（闭包存状态）vs 类装饰器（实例存状态）：功能等价，类版本状态可读可断言，测试更友好。

## 6. 生成器：惰性的值序列

`yield` 把函数变成生成器——**执行到 yield 暂停，下次 next() 从暂停点恢复**：

```python
def countdown(n):
    while n > 0:
        yield n              # 暂停并吐出一个值
        n -= 1

gen = countdown(3)
next(gen)   # 3
next(gen)   # 2
next(gen)   # 1
next(gen)   # StopIteration
```

核心收益：**惰性求值**。读一个 10GB 日志文件，列表要全量载入内存，生成器一次只在内存里放一行：

```python
def grep(pattern, path):
    with open(path, encoding='utf-8') as f:
        for line in f:               # 逐行惰性读
            if pattern in line:
                yield line.rstrip()

# 生成器可以链式组合——全程惰性，内存恒定
error_lines = grep('ERROR', 'app.log')
first_10 = list(itertools.islice(error_lines, 10))
```

## 7. yield 的进阶形态

```python
# yield from：委托子生成器（生成器版的 extend）
def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)      # 递归展开
        else:
            yield item
list(flatten([1, [2, [3, 4]], 5]))        # [1, 2, 3, 4, 5]

# 协程式双向通信：send() 向 yield 注入值
def averager():
    total, count = 0.0, 0
    avg = None
    while True:
        v = yield avg                     # yield 既吐出 avg，也接收 send 的 v
        total += v; count += 1
        avg = total / count

g = averager()
next(g)               # 预激（推进到第一个 yield）
print(g.send(10))     # 10.0
print(g.send(20))     # 15.0
```

双向通信让生成器成为"协程"——这正是 Go 的 goroutine、JS 的 async/await 同源的机制（JS 版详见站内《async/await 原理：生成器与协程》）。

## 8. 陷阱速查表

| 现象 | 原因 | 修法 |
| --- | --- | --- |
| 装饰后 __name__ 变 wrapper | 没加 functools.wraps | 装饰器内必加 @functools.wraps |
| 带 @ 装饰器参数在导入时报错 | 三层结构写错层级 | 记住 @ 后的表达式先执行 |
| 生成器只能遍历一次 | 惰性耗尽后 StopIteration | 重新创建生成器或 list() 物化 |
| 装饰 async 函数后返回协程没执行 | wrapper 里没 await | 装饰器内也写成 async 并 await 原函数 |
| lru_cache 缓存了可变参数结果 | dict 参数不可哈希/对象可变 | 参数改为不可变；可变状态不缓存 |
| 闭包变量意外不更新 | 漏了 nonlocal | 内层修改外层变量必须 nonlocal |

## 9. 装饰器 vs 生成器：闭包的两条岔路对比

| | 装饰器 | 生成器 |
| --- | --- | --- |
| 闭包的角色 | 包装逻辑（前置/后置增强） | 暂停执行位置 + 局部变量 |
| 输出 | 通常返回原函数结果 | 流式吐出值序列 |
| 内存 | 无关 | 惰性，恒定内存 |
| 典型场景 | 增强行为（缓存/重试/鉴权） | 大文件、无限序列、流水线 |

## 延伸阅读

- 站内：《Python 基础入门》（函数与作用域前置）、《并发、并行与异步编程概念》（协程思想总览）、《async/await 原理：生成器与协程》（JS 的同构实现）
- 站内参考资料：《Redis 官方数据类型教程》（本地镜像 /post/ref-redis-doc，lru_cache 思想同源）
- 《Fluent Python（第 2 版）》第 7、14 章——装饰器与生成器的权威讲解
