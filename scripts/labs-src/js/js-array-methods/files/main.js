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
// TODO：补全 map 的回调，让每一项变成「编号 商品 ×数量 = 金额」，例如「A101 赤霞珠干红 ×2 = 256」
// 提示：用模板字符串（反引号）拼起来：`${o.id} ${o.product} ×${o.qty} = ${amountOf(o)}`
const lines = orders.map((o) => `${o.id} ${o.product}`);   // 占位：现在只有编号和商品
lines.forEach((line) => console.log(line));

// ───── Step 2 · filter：筛出符合条件的订单 ─────
// TODO：把回调改成「这笔订单已付款」——o.paid 本身就是 true / false，直接返回它即可
const paidOrders = orders.filter(() => true);       // 占位：现在把所有订单都放了进来
console.log('已付款：' + paidOrders.map((o) => o.id).join(', '));

// TODO：筛出金额超过 300 元的订单（用 amountOf(o) > 300）
const bigOrders = orders.filter(() => false);       // 占位：现在一个都没筛出来
console.log('超过 300 元：' + bigOrders.map((o) => o.id).join(', '));

// ───── Step 3 · reduce：求总额与分组统计 ─────
// TODO：把已付款订单的金额累加起来（sum 加上 amountOf(o)；初始值 0 别漏）
const total = paidOrders.reduce((sum, o) => sum, 0);    // 占位：现在一直是 0
console.log('已付款总额：' + total);

// TODO：按品类统计卖出的件数，得到形如 { 红酒: 9, 白酒: 2, 起泡酒: 2 } 的对象
// 提示：acc[o.category] = (acc[o.category] || 0) + o.qty;   然后 return acc
const byCategory = orders.reduce((acc, o) => acc, {});   // 占位：现在是空对象 {}
for (const [name, qty] of Object.entries(byCategory)) console.log(`${name}：${qty} 件`);
