// Step 1：香农熵 H = -Σ p·log2(p)，单位 bit。p = 0 时按约定贡献为 0
function entropy(ps) {
  return -ps.reduce((s, p) => (p === 0 ? s : s + p * Math.log2(p)), 0) || 0;   // || 0：避免出现 -0
}
console.log('均匀分布 [0.5,0.5] →', entropy([0.5, 0.5]));   // 1
console.log('一边倒 [0.9,0.1] →', entropy([0.9, 0.1]).toFixed(3));   // 0.469
console.log('确定事件 [1,0] →', entropy([1, 0]));           // 0

// Step 2：统计字符频率并归一化为概率，再算熵
function textEntropy(text) {
  const freq = {};
  for (const ch of text) freq[ch] = (freq[ch] || 0) + 1;
  const ps = Object.values(freq).map((c) => c / text.length);
  return entropy(ps);
}
console.log('重复文本熵:', textEntropy('哈哈哈哈哈哈').toFixed(3));        // 0 —— 全是同一个字
console.log('多样文本熵:', textEntropy('信息熵度量不确定性').toFixed(3));   // 3.170 —— 9 个字各出现一次，等于 log2(9)

// Step 3：熵与压缩——最优压缩后平均每字符至少需要 H 位
// 8 个等概率字符：H = 3 bit，定长编码恰好 3 bit/字符，压不动；
// 概率为 [0.5, 0.25, 0.125, 0.125] 时 H ≈ 1.75 bit，哈夫曼变长编码可以逼近它。
// 「哈哈哈哈」分布尖锐、熵低，所以极易压缩；随机数据熵高，压不动。
console.log('4 符号不等概 [0.5,0.25,0.125,0.125] →', entropy([0.5, 0.25, 0.125, 0.125]));   // 1.75
