// ═════════════ 第 1 步：闭包计数器 ═════════════
// 闭包 = 一个函数 + 它被创建时所能看到的外层变量。
// count 住在 createCounter 里，按理说函数执行完它就该消失；
// 但返回的那个函数还「抓着」它——于是 count 活了下来，而且只有这个函数碰得到它。

function createCounter() {
  let count = 0;
  // 返回的函数和 count 一起构成闭包：每调用一次，改的都是同一个 count
  return function () {
    count += 1;
    return count;
  };
}

const counter = createCounter();
console.log('连续调用三次：' + [counter(), counter(), counter()].join('、'));   // 连续调用三次：1、2、3
const another = createCounter();
console.log('另一个计数器第一次：' + another());                             // 另一个计数器第一次：1（各有各的 count）
console.log('原来的计数器：' + counter());                                   // 原来的计数器：4（没受另一个影响）

// ═════════════ 第 2 步：用闭包实现私有变量 ═════════════
// balance 被关在闭包里：外面既读不到、也改不了，只能通过返回的对象上的三个方法来操作。
// 「余额不够就不能花钱」这条规则因此不可能被绕过。

function createWallet() {
  let balance = 0;
  return {
    deposit(amount) {
      balance += amount;
    },
    spend(amount) {
      if (amount > balance) return false;   // 余额不够：拒绝，并且不扣钱
      balance -= amount;
      return true;
    },
    getBalance() {
      return balance;
    },
  };
}

const wallet = createWallet();
wallet.deposit(100);
console.log('存入 100，余额：' + wallet.getBalance());                            // 存入 100，余额：100
console.log('花 30：' + wallet.spend(30) + '，余额：' + wallet.getBalance());     // 花 30：true，余额：70
console.log('想花 500：' + wallet.spend(500) + '，余额：' + wallet.getBalance()); // 想花 500：false，余额：70
wallet.balance = 999999;   // 从外面偷改：只是在返回的那个对象上多了一个属性，闭包里的 balance 纹丝不动
console.log('偷改 balance 之后，余额：' + wallet.getBalance());                   // 偷改 balance 之后，余额：70

// ═════════════ 第 3 步：经典的 for 循环变量问题 ═════════════
// var 声明的 i 属于整个外层作用域：三个函数共享的是同一个 i。
// 调用它们时循环早已结束，i 停在 3——闭包记住的是「变量本身」，而不是创建那一刻的值。
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(function () { return i; });
}
console.log('有问题版本：' + fns.map((f) => f()).join(', '));                    // 有问题版本：3, 3, 3

// 修法一：let——每一轮循环都会创建一个全新的 i，三个闭包各自记住自己那一轮的值
const fnsLet = [];
for (let i = 0; i < 3; i++) {
  fnsLet.push(function () { return i; });
}
console.log('let 修法：' + fnsLet.map((f) => f()).join(', '));                  // let 修法：0, 1, 2

// 修法二：立即执行函数（IIFE）——每轮循环立刻调用一个函数，把「这一轮的 i」复制到形参 k 里
const fnsIife = [];
for (var j = 0; j < 3; j++) {
  (function (k) {
    fnsIife.push(function () { return k; });
  })(j);
}
console.log('IIFE 修法：' + fnsIife.map((f) => f()).join(', '));                // IIFE 修法：0, 1, 2
