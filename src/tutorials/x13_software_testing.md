---
title: 软件测试入门：从手工到自动化
category: 方法与工具
order: 10
tags: [软件测试, QA, 自动化测试, 测试用例]
summary: 测试思维、用例设计方法、接口与 UI 自动化——质量保障工程师的完整入门地图。
---

## 1. 什么是软件测试

测试不是为了"证明软件没有 bug"（不可能），而是**在有限成本内尽可能多地发现缺陷、给出质量信心**。

| 层级 | 测什么 | 谁来做 |
| --- | --- | --- |
| 单元测试 | 函数/类 | 开发 |
| 集成测试 | 模块之间接口 | 开发/测试 |
| 系统测试 | 完整功能 | 测试 |
| 验收测试 | 业务需求 | 测试/产品 |

测试金字塔：底层单元测试数量最多、运行最快；顶层手工探索测试最少。

## 2. 测试用例设计（核心手艺）

### 等价类划分
把输入分成若干"等价类"，每类取一个代表：

```
输入：年龄（18-60 有效）
有效等价类：25        → 1 条用例
无效等价类：10、70、-1、"abc" → 4 条用例
边界值：17、18、60、61        → 4 条用例
```

### 边界值分析
Bug 最爱藏在边界上。区间 `[1,100]` 必测：`0、1、2、99、100、101`。

### 判定表
多条件组合用表格穷举：

| 条件 | 已登录 | 有库存 | 动作 |
| --- | --- | --- | --- |
| 1 | 是 | 是 | 可下单 |
| 2 | 是 | 否 | 提示缺货 |
| 3 | 否 | - | 跳转登录 |

### 场景法
按用户路径走：`打开首页 → 搜索 → 加购 → 结算 → 支付`，每条路径的正向/异常分支都要覆盖。

## 3. 缺陷报告怎么写

一个好 Bug 单 = **一步复现**：

```
标题：【结算页】优惠券金额为 0 时下单报 500
环境：Chrome 120 / staging
前置：账号 A 持有满减券（门槛 100）
步骤：
1. 加购 100 元商品
2. 选择 0 元优惠券（异常数据）
3. 点击结算
期望：提示优惠券不可用，正常下单
实际：页面报 500，订单未创建
复现率：5/5
附件：截图 + 请求响应 + 订单号
```

## 4. 接口测试

UI 还没做就能测接口——**左移**是效率的关键：

```python
import requests

def test_login_ok():
    r = requests.post("https://api.demo.com/login", json={
        "username": "tester", "password": "right-pass"
    })
    assert r.status_code == 200
    assert "token" in r.json()
    assert r.elapsed.total_seconds() < 2      # 性能断言

def test_login_wrong_pass():
    r = requests.post("https://api.demo.com/login", json={
        "username": "tester", "password": "wrong"
    })
    assert r.status_code in (401, 403)        # 不能 500！
    assert "token" not in r.json()            # 不能泄漏 token
```

断言三板斧：**状态码**、**业务字段**、**响应时间**。

## 5. UI 自动化（Selenium 现代实践）

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_search(driver):
    driver.get("https://demo.com")
    box = driver.find_element(By.CSS_SELECTOR, "#search")
    box.send_keys("键盘")
    box.submit()

    # 显式等待：结果出现再断言（拒绝 sleep）
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "result-item"))
    )
    assert len(driver.find_elements(By.CLASS_NAME, "result-item")) > 0
```

五条军规：
1. **显式等待**替代 `time.sleep`
2. **选择器稳定**：优先 `data-testid`，避免脆的 CSS 路径
3. **一用例一断言主题**：一个用例只验证一件事
4. **测试数据自造自清**：不依赖别人留下的数据
5. **失败自动截图**：留现场

## 6. 测试策略：怎么决定测什么

- **风险驱动**：支付、登录这类高风险功能重点测
- **变更驱动**：回归测试聚焦本次改动影响面
- **80/20**：80% 的缺陷集中在 20% 的模块，历史 Bug 多的地方继续加测

## 7. 学习路径

1. 手工功能测试 → 用例设计方法（本文 §2）
2. SQL + HTTP（能查数据、能抓接口）
3. Python + pytest + Selenium 自动化
4. CI 集成：Git 提交触发自动化回归
5. 性能测试（JMeter）与安全测试（延伸）

## 延伸阅读

- 站内相关：《Python 自动化：Selenium 与 pyautogui》《SQL 快速入门》《HTTP/HTTPS 协议详解》
- 《Google 软件测试之道》——测试金字塔的出处
