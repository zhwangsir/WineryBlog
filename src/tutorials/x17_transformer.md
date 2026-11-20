---
title: Transformer 原理：从注意力到 GPT
category: 人工智能
order: 11
tags: [Transformer, Attention, GPT, 深度学习]
summary: 注意力机制的直觉与公式、位置编码、Decoder 逐词生成——看懂大模型的架构基因。
---

## 1. 为什么需要注意力

RNN 逐词处理长文本，词越远记忆越稀薄；Transformer（2017《Attention Is All You Need》）用**注意力**让每个词**直接看到所有词**，且全部并行计算——这是 LLM 时代的架构基石。

## 2. 注意力的直觉

句子「小明把书放在桌上，然后他打开了**它**」——「它」指书还是桌？人脑会**回头看**相关词。注意力就是可微分的"回头看"：

每个词生成三个向量：
- **Q（Query）**：我在找什么
- **K（Key）**：我是什么（可被检索的标签）
- **V（Value）**：我的实际内容

```
Attention(Q, K, V) = softmax(QKᵀ / √d) V
```

用人话翻译：`Q·K` 算出"每个词与我的相关度" → softmax 变成权重（和为 1）→ 加权求和 V，得到"融合了上下文的新表示"。`√d` 缩放防止点积过大导致 softmax 饱和。

## 3. 多头注意力

一次注意力只够捕捉一种关系。**多头** = 并行 8-64 组独立 Q/K/V 投影：

- 头 1 可能学会"语法关系"（主语-谓语）
- 头 2 学会"指代关系"（它 → 书）
- 头 3 学会"位置相邻关系"

最后拼接各头输出再线性融合。

## 4. 位置编码

注意力本身**无视顺序**（把句子打乱结果一样）。要理解语序，必须注入位置信息：

- 原版：正弦位置编码
- 现代主流：**RoPE**（旋转位置编码，LLaMA/Qwen 系标配），把相对位置信息旋转进 Q/K

## 5. 三种 Transformer

| 结构 | 代表 | 擅长 |
| --- | --- | --- |
| Encoder-only | BERT | 理解类：分类、检索、相似度 |
| Decoder-only | **GPT** | 生成类：对话、写作、代码 |
| Encoder-Decoder | T5 | 翻译、摘要（输入→输出映射） |

现代 LLM 几乎都是 **Decoder-only**，核心机制是**因果注意力（causal mask）**：每个词只能看左边的词（不能偷看未来），训练目标只有一个——**预测下一个词**。

```
输入:  我 爱 北 京
预测:  爱   北  京  天
```

## 6. 逐词生成与采样

推理时模型一次只产出一个词，然后自回归地喂回去：

```
输出概率分布 → 采样策略：
- temperature：温度越高越随机（0 = 总选最高概率，答案确定但呆板）
- top-p：只在累计概率前 p 的候选里采样，兼顾多样与合理
```

这就是你在 WebUI 调 temperature 滑条时实际发生的事。

## 7. 从 GPT 到 Chat：预训练 + 对齐

1. **预训练**：海量文本学"预测下一词"——获得知识与世界模型
2. **SFT**：人工标注问答对，学会"对话格式"
3. **RLHF/DPO**：人类偏好排序反馈，学会"有帮助、无害"

所以原始 GPT 会接龙而不是回答问题——对齐阶段赋予了它助手行为。

## 8. 动手感受

用 PyTorch 写一个迷你因果自注意力（约 15 行）：

```python
import torch, torch.nn.functional as F

x = torch.randn(1, 5, 64)                     # batch, seq, dim
Q, K, V = x, x, x                              # 简化：自投影
scores = Q @ K.transpose(-2, -1) / (64 ** 0.5)
mask = torch.triu(torch.ones(5, 5), diagonal=1).bool()
scores.masked_fill_(mask, float('-inf'))       # 因果掩码：只看左边
out = F.softmax(scores, dim=-1) @ V
print(out.shape)                               # torch.Size([1, 5, 64])
```

跑一遍，打印 `softmax(scores)` 看看每个位置"看向"了谁——注意力不再抽象。

## 延伸阅读

- 站内相关：《深度学习与 PyTorch 入门》《大语言模型自学路线》《本地大模型部署实战：Ollama 与 SGLang》
- The Illustrated Transformer（Jay Alammar 图解系列）
- 《Attention Is All You Need》原始论文
