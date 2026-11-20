---
title: AI Agent 开发：工具调用与规划循环
category: 人工智能
order: 14
tags: [AI Agent, Function Calling, ReAct, LLM应用]
summary: Agent = LLM + 工具 + 循环。从 Function Calling 原理到手写一个能查库算数的迷你 Agent。
---

## 1. Agent 到底是什么

LLM 本身只会"接话"——你问它今天天气，它只能编。**Agent = LLM + 工具（Tools）+ 循环（Loop）**：

```
用户问题 → LLM 思考 → 需要查资料吗？
                        ↓ 是
                    调用工具（查天气 API / 查数据库 / 搜网页）
                        ↓
                    把工具结果喂回 LLM → 再思考 → 再调工具 …
                        ↓ 直到
                    生成最终回答
```

一句话定义：**Agent 是让模型把"动手做"变成"说话说自己要做什么"，由程序代为执行再把结果喂回去的循环**。

## 2. Function Calling：一切的地基

现代模型 API 原生支持工具调用。你告诉模型"有哪些工具可用"（JSON Schema 描述），模型在需要时返回一个**结构化的调用请求**而不是自然语言：

```python
tools = [{
    "type": "function",
    "function": {
        "name": "query_orders",
        "description": "按用户名查询订单列表",       # 描述写得好坏直接决定模型用不用得对
        "parameters": {
            "type": "object",
            "properties": {
                "user": {"type": "string"},
                "limit": {"type": "integer", "default": 10}
            },
            "required": ["user"]
        }
    }
}]

resp = client.chat.completions.create(
    model="deepseek", messages=messages, tools=tools)

msg = resp.choices[0].message
if msg.tool_calls:
    call = msg.tool_calls[0]
    # 模型只给参数 JSON，执行是"你"的事
    print(call.function.name)       # "query_orders"
    print(call.function.arguments)  # '{"user": "bob", "limit": 5}'
```

**职责分界**：模型负责"决定调什么、传什么参数"；你的代码负责"真的执行、处理异常、返回结果"。模型永远不直接碰你的数据库。

## 3. 手写迷你 Agent（60 行看懂全部）

```python
import json
from openai import OpenAI

client = OpenAI(base_url="http://192.168.71.84:8000/v1", api_key="none")

# ---- 工具实现 ----
def get_weather(city: str) -> str:
    fake = {"北京": "晴 3°C", "上海": "小雨 12°C"}
    return fake.get(city, f"{city}：暂无数据")

TOOLS_IMPL = {"get_weather": get_weather}

TOOLS_SPEC = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "查询指定城市当前天气",
        "parameters": {"type": "object", "properties": {
            "city": {"type": "string"}}, "required": ["city"]}
    }
}]

# ---- Agent 循环 ----
def agent(question: str, max_turns: int = 5):
    messages = [{"role": "user", "content": question}]
    for _ in range(max_turns):                      # 循环上限防失控
        resp = client.chat.completions.create(
            model="deepseek", messages=messages, tools=TOOLS_SPEC)
        msg = resp.choices[0].message

        if not msg.tool_calls:                      # 没有工具调用 = 最终回答
            return msg.content

        messages.append(msg)                        # 记下"我要调工具"
        for tc in msg.tool_calls:
            fn = TOOLS_IMPL[tc.function.name]
            result = fn(**json.loads(tc.function.arguments))
            messages.append({                       # 结果喂回去
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result,
            })
    return "达到最大轮数，任务未完成。"

print(agent("北京和上海今天哪个更暖和？"))
# 模型会：调 get_weather(北京) → 调 get_weather(上海) → 对比后回答
```

这就是全部骨架——生产框架（LangChain/LangGraph、OpenAI Assistants）只是把这个循环包得更好用。

## 4. ReAct：让思考可见

弱一点的模型直接给工具调用容易瞎调。**ReAct 模式**强制它先推理：

```
Thought: 用户问两城温度对比，我需要先查北京天气
Action: get_weather(city="北京")
Observation: 晴 3°C
Thought: 再查上海
Action: get_weather(city="上海")
Observation: 小雨 12°C
Thought: 上海 12°C > 北京 3°C，可以回答了
Final Answer: 上海更暖和……
```

实现：不传 tools 参数，把工具清单写进 system prompt，要求按固定格式输出，然后**正则解析** Action 行。兼容一切模型（包括不支持 function calling 的开源模型）。

## 5. 生产级 Agent 的四个必备件

| 组件 | 为什么需要 |
| --- | --- |
| **系统提示（人设+边界）** | 定义能力范围："只能用这些工具，禁止虚构数据" |
| **循环上限 & 超时** | 防止模型陷入无限调用（烧钱+失控） |
| **工具结果裁剪** | 大结果（整页网页）截断/摘要后再喂回，防上下文爆炸 |
| **人工确认点** | 危险操作（转账/删库）前中断问人——Agent 的安全带 |

外加可观测性：每次 Thought/Action/Observation 落日志，出了问题能回放。

## 6. 多 Agent 与框架选型

- **单 Agent + 多工具**：95% 场景的最优解，先做这个
- **多 Agent 协作**（写手/审稿者/测试者互相传话）：只在任务能自然分工时用，通信成本高
- 框架：LangGraph（状态机式，可控性强）、OpenAI Agents SDK、AutoGen（对话式）。**自己手写循环 < 用框架**——循环就 60 行，框架的抽象未必比你的业务直白

## 7. 评测：Agent 怎么验收

1. **任务成功率**：100 个标准任务跑通率（对比调 Prompt 前后）
2. **工具调用准确率**：该调的调了吗？参数对吗？不该调的多调了吗？
3. **轮数与成本**：平均几轮收敛，token 花了多少——Agent 的"延迟与价格"
4. **红线测试**：故意诱导它越权/编造，看护栏是否兜住

## 延伸阅读

- 站内相关：《本地知识库与 RAG 实战》《Prompt 工程入门：与大模型高效协作的方法》《本地大模型部署实战：Ollama 与 SGLang》
- 《AI Engineering》（Chip Huyen，2025）——Agent 设计章节
- Anthropic《Building effective agents》——少抽象、多循环的工程哲学
