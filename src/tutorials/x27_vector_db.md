---
title: 向量数据库实战：语义检索的基石
category: 人工智能
order: 12
tags: [向量数据库, Embedding, RAG, 语义检索]
summary: Embedding 原理、相似度度量、Milvus/pgvector 选型与实战——让机器"理解"语义的检索系统。
---

## 1. 从关键词到语义

传统搜索是关键词匹配：搜"怎么让电脑不死机"，含"卡顿解决"的文档永远搜不到。**向量检索**把文本变成高维空间中的点——语义相近的内容在空间中距离就近：

```
"如何解决电脑卡顿"  ──→ [0.12, -0.34, 0.56, ...]  （1536 维）
"电脑死机怎么办"    ──→ [0.11, -0.31, 0.58, ...]  ← 距离很近
"红烧肉的做法"      ──→ [-0.45, 0.77, -0.2, ...]  ← 距离很远
```

这个转换由 **Embedding 模型**完成（如 bge-m3、text-embedding-3）。向量数据库负责的是：**在海量向量里找最近的 K 个**（KNN/ANN 检索）。

## 2. 相似度度量：三种距离

| 度量 | 公式直觉 | 用途 |
| --- | --- | --- |
| 余弦相似度 | 向量夹角，无视长度 | 文本语义（最常用） |
| 欧氏距离 L2 | 空间直线距离 | 图像特征 |
| 内积 IP | 点积 | 已归一化的向量（等价余弦） |

注意：换度量必须重新对齐 Embedding 模型的训练度量——bge 系列用余弦。

## 3. 选型：三种档次

| 方案 | 适合 | 量级 |
| --- | --- | --- |
| **pgvector**（Postgres 插件） | 已有 PG、几十万级、想要事务 | ≤ 百万 |
| **Milvus / Qdrant** | 专业向量场景、亿级、高并发 | 千万-亿 |
| **Faiss（库）** | 嵌入应用进程、研究原型 | 内存可容纳即可 |

原则：**数据量不到千万、团队没运维过分布式系统，直接 pgvector**。RAG 场景的瓶颈几乎从来不在向量库，而在切块与检索质量。

## 4. pgvector 实战（最短路径）

```sql
CREATE EXTENSION vector;
CREATE TABLE docs (
  id bigserial PRIMARY KEY,
  content text,
  embedding vector(1024)          -- 维度 = 模型输出维度
);
CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);
-- 查最近 5 条
SELECT content FROM docs ORDER BY embedding <=> '[0.12,-0.34,...]' LIMIT 5;
```

**HNSW 索引**原理一句话：把向量组织成多层跳表式图，查询从顶层粗跳到底层精查——牺牲一点召回率换 100 倍速度（ANN 近似最近邻）。

## 5. Embedding + 检索完整管线（Python）

```python
from sentence_transformers import SentenceTransformer
import psycopg

model = SentenceTransformer('BAAI/bge-m3')          # 本地开源 Embedding

def embed(text: str):
    return model.encode(text).tolist()

# 入库：切块 → 向量化 → 插入
chunks = split_text(long_doc, size=500, overlap=50)  # 500字/块，50字重叠
with psycopg.connect(DSN) as conn:
    for c in chunks:
        conn.execute("INSERT INTO docs (content, embedding) VALUES (%s, %s)",
                     (c, embed(c)))

# 检索：问题向量化 → 最近邻
def search(query: str, k: int = 5):
    v = embed(query)
    with psycopg.connect(DSN) as conn:
        return conn.execute(
            "SELECT content FROM docs ORDER BY embedding <=> %s LIMIT %s",
            (v, k)).fetchall()
```

这就是 RAG 的"R"（检索）。接入 LLM 就是《本地知识库与 RAG 实战》的内容。

## 6. 检索质量的四个杀手与解药

| 问题 | 现象 | 解药 |
| --- | --- | --- |
| 切块太碎 | 每块缺上下文，检索到碎片 | 语义切块（按标题/段落），块间重叠 |
| 切块太大 | 一块多主题，向量语义模糊 | 300-800 字/块 |
| 只搜文本 | 表格、代码检索差 | 混合检索：向量 + BM25 关键词，结果融合 |
| 排序不准 | 最相关的没排前面 | 加 Reranker（bge-reranker 对候选精排） |

**混合检索 + Rerank** 是生产 RAG 的标配两件套，能把召回质量提升一个档次。

## 7. 评估：不量化就是玄学

建一个 20-50 条的评测集（问题 → 应命中的文档块），每次改动后跑：
- **Recall@K**：前 K 条里命中了多少
- **MRR**：第一名命中位置的倒数平均

有数字才能迭代，否则每次改切块策略都是感觉流。

## 延伸阅读

- 站内相关：《本地知识库与 RAG 实战》《大语言模型自学路线》《LoRA 微调入门：让开源模型学会你的领域》
- pgvector GitHub（README 即教程）
- 《向量数据库实战》专栏 / Milvus 官方文档
