// Step 1 的 if-else 原版保留在这里做对照：
// function finalPrice(type, price) {
//   if (type === 'full') return price >= 100 ? price - 20 : price;
//   if (type === 'percent') return price * 0.85;
//   if (type === 'vip') return price * 0.8 - 5;
//   return price;
// }

// Step 2：策略表——每种促销是一个函数，收进一张表
const strategies = {
  full: (p) => (p >= 100 ? p - 20 : p),
  percent: (p) => p * 0.85,
  vip: (p) => p * 0.8 - 5,
};

// 统一调用入口：查表分发；查不到就原价返回
function finalPrice(type, price) {
  return (strategies[type] ?? ((p) => p))(price);
}

// 与原版同样的输入，得到同样的输出
console.log(finalPrice('full', 120), finalPrice('percent', 100), finalPrice('vip', 100));   // 100 85 75

// Step 3：新增促销 = 表里加一行，finalPrice 零改动（开闭原则）
strategies.full200 = (p) => (p >= 200 ? p - 50 : p);
console.log(finalPrice('full200', 260));   // 210
