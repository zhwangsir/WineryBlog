---
title: NLP 入门：从分词到大模型
category: 人工智能
order: 15
tags: [NLP, 分词, 词向量, Transformer]
summary: 文本如何变成机器能算的向量：分词、TF-IDF、词向量、注意力——NLP 半个世纪的演进主线。
---

## 1. NLP 的根本难题：文字是离散符号

"苹果"和"Apple"语义相同，但在计算机眼里是两个毫无关系的字符串。NLP 的全部历史就是回答一个问题：

> **如何把文字变成能做数学运算的向量？**

## 2. 第一步永远是分词

英文天然有空格，中文没有——"研究生命起源"是"研究生/命/起源"还是"研究/生命/起源"？

```python
import jieba

print(jieba.lcut("研究生命起源"))
# ['研究', '生命', '起源']  —— jieba 用词典+HMM 处理歧义

# 大模型时代：子词切分（BPE）——不依赖词典，统计高频片段
# "unhappiness" → "un" + "happi" + "ness"
```

现代 LLM 用 **BPE（字节对编码）**：从字符开始，贪心合并语料中最高频的相邻对。"token" 就是一个子词——你调 API 时按 token 计费的就是它。英文 1 token ≈ 0.75 词，中文 1 字 ≈ 0.6-1 token。

## 3. 经典路线一：TF-IDF + 机器学习

把文档表示成"词频向量"，用传统分类器：

```
TF-IDF(t, d) = 词频(t, d) × log(总文档数 / 含 t 的文档数)
```

直觉：在这篇文档里出现多（TF↑）、又在全网罕见（IDF↑）的词最能代表文档。"的"TF 很高但 IDF 极低 → 权重趋零。

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

vec = TfidfVectorizer()
X = vec.fit_transform(train_texts)          # 稀疏矩阵：每文档一个 vocab 维向量
clf = LogisticRegression().fit(X, y)        # 垃圾邮件分类，传统方案依然能打
```

局限：**每个词一个孤立的向量**——" king" 和 "queen" 没有任何关系。

## 4. 经典路线二：词向量（Word2Vec）

2013 年的突破：**用上下文预测词**，训练后的词向量自动携带语义。著名的向量算术：

```
vector(国王) - vector(男人) + vector(女人) ≈ vector(女王)
```

```python
from gensim.models import Word2Vec
model = Word2Vec(corpus, vector_size=100, window=5, min_count=5)
model.wv.most_similar("手机")     # ['电话', '平板', ...] —— 语义近邻
```

局限：一词一向量——"苹果手机"和"吃苹果"里的"苹果"共享同一个向量（多义词问题）。

## 5. 现代：预训练 + Transformer

2018 年 BERT/GPT 之后，路线收敛为一套：

1. **预训练**：海量文本自监督（掩码预测/下一词预测）→ 模型学到语法、常识、推理
2. **微调/指令对齐**：适配具体任务
3. 词向量升级为**上下文相关表示**：同一个"苹果"在不同句子里向量不同

**今天做 NLP 任务的默认姿势**：

```python
from transformers import pipeline

# 分类/抽取/摘要——拿来就用
clf = pipeline("text-classification", model="uer/roberta-base-finetuned-jd-binary-chinese")
clf("这家店服务太差了")                    # [{'label': 'negative', 'score': 0.98}]

summarizer = pipeline("summarization")
summarizer(long_text, max_length=50)

# 超过模型能力的任务 → RAG 或微调（见站内对应教程）
```

## 6. NLP 任务地图

| 任务 | 输入→输出 | 主流方案 |
| --- | --- | --- |
| 文本分类 | 文本→标签 | BERT 微调 / TF-IDF+LR（轻量） |
| 命名实体识别 | 文本→(实体,类型) | BERT+CRF |
| 机器翻译 | 语种→语种 | Transformer seq2seq |
| 问答/对话 | 问题+知识→答案 | RAG / LLM |
| 信息抽取 | 文档→结构化 JSON | LLM + Function Calling |

**选型原则**：小数据+简单分类，TF-IDF+传统 ML 又快又稳；有领域术语、要可控成本，BERT 微调；要理解与生成，直接 LLM。

## 7. 中文处理工具箱

- 分词：jieba（轻量）、HanLP（工业级全功能）
- 预训练模型：HuggingFace 上的 chinese-roberta-wwm、Qwen/BERT 系列
- 拼音/繁简：pypinyin、opencc

## 延伸阅读

- 站内相关：《Transformer 原理：从注意力到 GPT》《Prompt 工程入门：与大模型高效协作的方法》《本地知识库与 RAG 实战》
- 《Speech and Language Processing》（Jurafsky & Martin，免费在线）——NLP 圣经
- HuggingFace NLP Course（免费）
