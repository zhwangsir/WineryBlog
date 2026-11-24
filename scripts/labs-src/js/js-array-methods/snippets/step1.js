// map：对每一项调用回调，把返回值按顺序收成一个新数组（原数组不变）
const lines = orders.map((o) => `${o.id} ${o.product} ×${o.qty} = ${amountOf(o)}`);
lines.forEach((line) => console.log(line));

// 等价的 for 循环写法——对比一下哪个更能看出「意图」
const lines2 = [];
for (const o of orders) {
  lines2.push(`${o.id} ${o.product} ×${o.qty} = ${amountOf(o)}`);
}
