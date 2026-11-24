// filter：回调返回 true 的留下，返回 false 的丢掉，结果是一个新数组
const paidOrders = orders.filter((o) => o.paid);
console.log(paidOrders.map((o) => o.id).join(', '));   // A101, A103, A104, A106

// 回调里不用写 if...else，直接写一个判断表达式
const bigOrders = orders.filter((o) => amountOf(o) > 300);
console.log(bigOrders.map((o) => o.id).join(', '));    // A103, A106

// 两个条件可以拼在一起：已付款、并且金额超过 300
const paidBig = orders.filter((o) => o.paid && amountOf(o) > 300);
