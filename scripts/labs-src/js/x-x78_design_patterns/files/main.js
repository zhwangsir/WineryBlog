// Step 1：会腐烂的 if-else 原版——每新增一种促销都要进来改这个函数
function finalPrice(type, price) {
  if (type === 'full') return price >= 100 ? price - 20 : price;
  if (type === 'percent') return price * 0.85;
  if (type === 'vip') return price * 0.8 - 5;
  return price;
}
console.log(finalPrice('full', 120), finalPrice('percent', 100));   // 100 85

// TODO（Step 2）：重构为策略表
//   const strategies = { full: p => ..., percent: p => ..., vip: p => ... };
//   function finalPrice(type, price) { return (strategies[type] ?? (p => p))(price); }
// TODO（Step 3）：新增一种「满 200 减 50」的促销 full200——只往表里加一行，finalPrice 一行不改
