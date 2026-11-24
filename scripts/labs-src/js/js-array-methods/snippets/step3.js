// 求和：sum 是上一次累计的结果，第二个参数 0 是 sum 的初始值（千万别漏）
const total = paidOrders.reduce((sum, o) => sum + amountOf(o), 0);
console.log(total);   // 1332

// 分组统计：让累计值 acc 是一个对象
const byCategory = orders.reduce((acc, o) => {
  acc[o.category] = (acc[o.category] || 0) + o.qty;   // 这个品类第一次出现时还不存在，用 || 0 兜底
  return acc;                                         // 必须返回 acc，它会被带到下一轮
}, {});
console.log(byCategory);   // { 红酒: 9, 白酒: 2, 起泡酒: 2 }

// 三个方法串成一条链
const chained = orders.filter((o) => o.paid).map(amountOf).reduce((sum, n) => sum + n, 0);
console.log(chained);     // 1332
