function entropy(ps) {
  // TODO（Step 1）：实现 H = -Σ p·log2(p)，p = 0 时贡献按 0 处理
  return 0;
}
console.log('均匀分布 [0.5,0.5] →', entropy([0.5, 0.5]));   // 期望 1
console.log('一边倒 [0.9,0.1] →', entropy([0.9, 0.1]));     // 期望 ≈0.469
console.log('确定事件 [1,0] →', entropy([1, 0]));           // 期望 0


function textEntropy(text) {
  // TODO（Step 2）：统计字符频率 → 归一化成概率 → 交给 entropy
  return 0;
}
console.log('重复文本熵:', textEntropy('哈哈哈哈哈哈'));
console.log('多样文本熵:', textEntropy('信息熵度量不确定性'));
