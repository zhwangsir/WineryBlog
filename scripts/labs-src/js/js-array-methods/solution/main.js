// 一组订单：编号、商品、品类、单价（元）、数量、是否已付款
const orders = [
  { id: 'A101', product: '赤霞珠干红', category: '红酒', price: 128, qty: 2, paid: true },
  { id: 'A102', product: '霞多丽', category: '白酒', price: 98, qty: 1, paid: false },
  { id: 'A103', product: '黑皮诺', category: '红酒', price: 168, qty: 3, paid: true },
  { id: 'A104', product: '桃红起泡酒', category: '起泡酒', price: 88, qty: 2, paid: true },
  { id: 'A105', product: '雷司令', category: '白酒', price: 139, qty: 1, paid: false },
  { id: 'A106', product: '梅洛', category: '红酒', price: 99, qty: 4, paid: true },
];

// 一笔订单的金额 = 单价 × 数量（后面会反复用到，所以单独写成函数）
const amountOf = (o) => o.price * o.qty;

// ───── Step 1 · map：把每个订单变成一行摘要 ─────
// map：对每一项调用回调，把返回值按顺序收成一个新数组（原数组不变）
const lines = orders.map((o) => `${o.id} ${o.product} ×${o.qty} = ${amountOf(o)}`);
lines.forEach((line) => console.log(line));
// A101 赤霞珠干红 ×2 = 256
// A102 霞多丽 ×1 = 98
// A103 黑皮诺 ×3 = 504
// A104 桃红起泡酒 ×2 = 176
// A105 雷司令 ×1 = 139
// A106 梅洛 ×4 = 396

// ───── Step 2 · filter：筛出符合条件的订单 ─────
// filter：回调返回 true 的留下，返回 false 的丢掉
const paidOrders = orders.filter((o) => o.paid);
console.log('已付款：' + paidOrders.map((o) => o.id).join(', '));          // 已付款：A101, A103, A104, A106

const bigOrders = orders.filter((o) => amountOf(o) > 300);
console.log('超过 300 元：' + bigOrders.map((o) => o.id).join(', '));      // 超过 300 元：A103, A106

// ───── Step 3 · reduce：求总额与分组统计 ─────
// reduce：把数组「压缩」成一个值。sum 是上一次累计的结果，0 是它的初始值
const total = paidOrders.reduce((sum, o) => sum + amountOf(o), 0);
console.log('已付款总额：' + total);                                       // 已付款总额：1332（256 + 504 + 176 + 396）

// 分组统计：让累计值 acc 是一个对象，每遇到一笔订单就给对应品类加上件数
const byCategory = orders.reduce((acc, o) => {
  acc[o.category] = (acc[o.category] || 0) + o.qty;   // 这个品类第一次出现时还不存在，用 || 0 兜底
  return acc;                                         // 必须返回 acc，它会被带到下一轮
}, {});
for (const [name, qty] of Object.entries(byCategory)) console.log(`${name}：${qty} 件`);
// 红酒：9 件
// 白酒：2 件
// 起泡酒：2 件

// 选做：filter → map → reduce 串成一条链——先筛出已付款的，再取出每笔的金额，最后求和
const chained = orders.filter((o) => o.paid).map(amountOf).reduce((sum, amount) => sum + amount, 0);
console.log('链式写法：' + chained);                                       // 链式写法：1332
