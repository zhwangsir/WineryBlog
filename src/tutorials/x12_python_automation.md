---
title: Python 自动化：Selenium 与 pyautogui
category: 编程语言/Python 自动化
order: 1
tags: [Python, Selenium, pyautogui, 自动化]
summary: 浏览器自动化与桌面 GUI 自动化——让重复工作自动完成的两大利器。
---

## 1. Selenium：浏览器自动化

```bash
pip install selenium webdriver-manager
```

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()     # 自动下载 ChromeDriver
driver.get("https://www.baidu.com")

# 查找元素（8 种定位方式）
search = driver.find_element(By.ID, "kw")
search = driver.find_element(By.NAME, "wd")
search = driver.find_element(By.CSS_SELECTOR, "#kw")
search = driver.find_element(By.XPATH, "//input[@id='kw']")

# 操作
search.send_keys("Python 自动化")
search.submit()

# 等待元素出现（显式等待）
WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "#results"))
)

# 获取数据
results = driver.find_elements(By.CSS_SELECTOR, ".result h3")
for r in results: print(r.text)

driver.quit()
```

## 2. 显式等待 vs 隐式等待

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 显式等待：最多等 10 秒直到条件满足
el = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.ID, "submit"))
)

# 常用条件
EC.presence_of_element_located((By.ID, "id"))     # 存在
EC.visibility_of_element_located((By.ID, "id"))   # 可见
EC.element_to_be_clickable((By.ID, "id"))          # 可点击
EC.url_contains("/page")                           # URL 包含
EC.title_is("标题")                                # 页面标题
```

## 3. pyautogui：桌面 GUI 自动化

```bash
pip install pyautogui
```

```python
import pyautogui
import time

pyautogui.click(100, 200)          # 点击坐标
pyautogui.typewrite("hello", interval=0.05)  # 打字
pyautogui.hotkey("ctrl", "c")      # 快捷键
pyautogui.screenshot("screen.png") # 截屏

# 安全模式：鼠标甩到左上角立即停止
pyautogui.FAILSAFE = True
```

## 4. 实战：自动填表提交

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

driver = webdriver.Chrome()
driver.get("http://target.com/form")

# 填写表单
driver.find_element(By.NAME, "username").send_keys("winery")
driver.find_element(By.NAME, "password").send_keys("secret")
driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()

time.sleep(2)
print("URL:", driver.current_url)

driver.quit()
```

## 5. Headless 模式（无浏览器窗口）

```python
options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
driver = webdriver.Chrome(options=options)
```

适合服务器定时任务（CI/CD、爬虫、监控），不需要显示浏览器窗口。

## 6. 最佳实践

1. **优先 CSS 选择器**（比 XPath 快且可读）
2. **显式等待**代替 `time.sleep()`
3. **Page Object 模式**：页面封装成类，测试脚本只调方法
4. **Headless 测试** + 截图断言
5. **日志和重试**：失败自动截图保存现场

## 延伸阅读

- [Selenium 官方文档](/post/ref-selenium-dev-documentation)
- [pyautogui 官方文档](/post/ref-pyautogui-readthedocs-io)
- 站内相关：《Python 基础入门》《gui 自动化操作》《Web 安全学习路线总纲》
