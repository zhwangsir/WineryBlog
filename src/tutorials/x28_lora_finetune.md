---
title: LoRA 微调入门：让开源模型学会你的领域
category: 人工智能
order: 13
tags: [LoRA, 微调, 大模型, PEFT]
summary: 全参微调 vs LoRA 原理、数据构造、一次真实微调全流程——消费级显卡定制自己的模型。
---

## 1. 微调解决什么问题

提示词工程（Prompt）是"临时教"，微调是"刻进模型"。三种定制的分界线：

| 手段 | 成本 | 适合 |
| --- | --- | --- |
| Prompt / RAG | 几乎为零 | 知识问答、风格示例（知识放外部，检索注入） |
| **LoRA 微调** | 一张 24G 显卡跑几小时 | 固定风格输出、领域话术、指令格式 |
| 全参微调 / 预训练 | 数卡-数百万卡 | 大幅改写模型能力 |

判断标准：**缺知识用 RAG（知识会更新），缺行为/风格/格式用微调**。想让模型学会"按我司模板写周报"→ 微调；想让它"回答我司产品手册内容"→ RAG。

## 2. LoRA 原理：冻结大矩阵，只训小矩阵

全参微调 7B 模型要更新 70 亿参数（需要数张 A100）。LoRA（Low-Rank Adaptation）的洞察：

> 权重更新 ΔW 在实践中是**低秩**的——可以分解成两个小矩阵的乘积。

```
W' = W + ΔW = W + B·A      W: [4096, 4096] 冻结
                            A: [4096, r]    B: [r, 4096]    r=8~64
```

可训练参数从 1600 万降到 3 万分之一。效果：**显存降一个数量级、训练快、产物只有几十 MB**（原模型不动，加载时叠加）。

关键超参：
- `r`（秩）：8 够用于风格/格式，复杂任务 16-64
- `alpha`：缩放系数，通常设 r 的 2 倍
- `target_modules`：注入哪些层（通常 q_proj/k_proj/v_proj/o_proj 全加）

## 3. 数据：微调成败的 80%

LoRA 需要**指令数据集**——JSONL 格式的对话样本：

```json
{"instruction": "把下面的需求转成周报格式", "input": "本周完成了登录模块...", "output": "【本周进展】\n1. 登录模块..."}
```

数据铁律：
1. **质量 > 数量**：500 条精标 > 5 万条脏数据（LLaMA 论文时代后共识）
2. **多样性**：覆盖真实场景的输入分布，否则只会过拟合到样例
3. **一致性**：输出格式、语气、术语全数据集统一——模型学到的是你的"模式"
4. 构造技巧：让强模型（GPT/deepseek）按 few-shot 批量生成初稿，人工抽检修正

## 4. 实战：LLaMA-Factory 全流程

推荐 [LLaMA-Factory](https://github.com/hiyouga/LLaMA-Factory)——零代码微调框架（也支持 YAML 配置）。

**① 数据注册**：把 JSONL 放 `data/my_data.json`，在 `data/dataset_info.json` 登记：

```json
"my_data": {
  "file_name": "my_data.json",
  "columns": { "prompt": "instruction", "query": "input", "response": "output" }
}
```

**② 训练配置**（单张 RTX 4090 / 3090 可跑 7B QLoRA）：

```yaml
model_name_or_path: Qwen/Qwen2.5-7B-Instruct
stage: sft
finetuning_type: lora
lora_rank: 16
lora_alpha: 32
lora_target: all
dataset: my_data
cutoff_len: 2048
per_device_train_batch_size: 2
gradient_accumulation_steps: 8
learning_rate: 5.0e-5          # LoRA 学习率比全参高 1-2 个数量级
num_train_epochs: 3
quantization_bit: 4            # QLoRA：4bit 量化加载底模，7B 只要 10G 显存
output_dir: saves/my-lora
```

**③ 启动与观察**：

```bash
llamafactory-cli train my_config.yaml
# 观察 loss：应在 0.5-2 区间平滑下降；epoch 2-3 后不再降就停（继续=过拟合）
```

**④ 合并与推理**：

```bash
# 导出合并后的完整模型（部署用）
llamafactory-cli export --adapter_name_or_path saves/my-lora ...
# 或不合并，vLLM/ollama 直接挂 adapter
ollama create my-model -f Modelfile     # Modelfile 里指定 adapter 路径
```

## 5. 评估：微调有没有用

三个层次（都要做）：
1. **训练集留出验证**：loss 降了只能说明"学会了样例"
2. ** held-out 真实任务对比**：基座 vs 微调 各跑 30 个真实 case，人工盲评
3. **检查灾难性遗忘**：通用问题（写诗、常识）还答得好吗？——数据里混 10-20% 通用样本可缓解

过拟合信号：输出机械复读训练集句式、通用能力明显下降、对没见过的表述完全不会泛化。

## 6. 进阶路线

- **DPO 偏好对齐**：在 SFT 之后用"好回答 vs 差回答"对进一步调行为
- **多任务混合**：一个 LoRA 同时学格式转换+翻译，注意任务标签区分
- **量化部署**：合并后 GGUF 量化（Q4_K_M）进 ollama，消费机也能跑

## 延伸阅读

- 站内相关：《本地大模型部署实战：Ollama 与 SGLang》《向量数据库实战：语义检索的基石》《大语言模型自学路线》
- LoRA 原论文（Edward Hu et al. 2021）
- LLaMA-Factory 官方文档
