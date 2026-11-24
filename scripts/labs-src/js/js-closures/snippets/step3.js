// 有问题的写法：var 只有一个 i，三个函数共享它
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(function () { return i; });
}
console.log(fns.map((f) => f()).join(', '));   // 3, 3, 3

// 修法一：let —— 每一轮循环都有一个全新的 i
const fnsLet = [];
for (let i = 0; i < 3; i++) {
  fnsLet.push(function () { return i; });
}
console.log(fnsLet.map((f) => f()).join(', '));   // 0, 1, 2

// 修法二：立即执行函数（IIFE）—— 用函数作用域把「这一轮的 i」复制一份到形参 k
const fnsIife = [];
for (var j = 0; j < 3; j++) {
  (function (k) {
    fnsIife.push(function () { return k; });
  })(j);
}
console.log(fnsIife.map((f) => f()).join(', '));   // 0, 1, 2
