// ═════════════ 第 1 步：闭包计数器 ═════════════
// 闭包 = 一个函数 + 它被创建时所能看到的外层变量。
// count 住在 createCounter 里，按理说函数执行完它就该消失；
// 但返回的那个函数还「抓着」它——于是 count 活了下来，而且只有这个函数碰得到它。

function createCounter() {
  let count = 0;
  // TODO（第 1 步）：把占位换成真正的实现——返回一个函数：调用时让 count 加 1，并返回新的 count
  // 提示：return function () { ... }   或者箭头函数   return () => { ... }
  return function () {
    return count;   // 占位：只是把 count 原样返回，所以现在输出的是 0、0、0
  };
}

const counter = createCounter();
console.log('连续调用三次：' + [counter(), counter(), counter()].join('、'));   // 期望：1、2、3
const another = createCounter();
console.log('另一个计数器第一次：' + another());                             // 期望：1
console.log('原来的计数器：' + counter());                                   // 期望：4

// ═════════════ 第 2 步：用闭包实现私有变量 ═════════════
// balance 被关在闭包里：外面既读不到、也改不了，只能通过返回的对象上的三个方法来操作。
// 「余额不够就不能花钱」这条规则因此不可能被绕过。

function createWallet() {
  let balance = 0;
  // TODO（第 2 步）：把三个占位的方法换成真正的实现
  //   deposit(amount)：往 balance 里加钱，没有返回值
  //   spend(amount)：余额不够（amount > balance）就返回 false，并且不扣钱；够就扣钱并返回 true
  //   getBalance()：返回当前的 balance
  return {
    deposit() {},                 // 占位：什么都没做
    spend() { return false; },    // 占位：永远失败
    getBalance() { return 0; },   // 占位：永远是 0
  };
}

const wallet = createWallet();
wallet.deposit(100);
console.log('存入 100，余额：' + wallet.getBalance());                            // 期望：100
console.log('花 30：' + wallet.spend(30) + '，余额：' + wallet.getBalance());     // 期望：true，70
console.log('想花 500：' + wallet.spend(500) + '，余额：' + wallet.getBalance()); // 期望：false，70
wallet.balance = 999999;   // 从外面偷改：只是在返回的那个对象上多了一个属性，闭包里的 balance 纹丝不动
console.log('偷改 balance 之后，余额：' + wallet.getBalance());                   // 期望：70

// ═════════════ 第 3 步：经典的 for 循环变量问题 ═════════════
// 想把 0、1、2 分别存进三个函数，结果却是 3, 3, 3。
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(function () { return i; });
}
console.log('有问题版本：' + fns.map((f) => f()).join(', '));                    // 3, 3, 3

// TODO（第 3 步 · 修法一）：在下面用 let 再写一遍这个循环（数组名换成 fnsLet），输出「let 修法：0, 1, 2」
// TODO（第 3 步 · 修法二）：不用 let，用「立即执行函数」把每一轮的 i 复制到形参里（数组名换成 fnsIife），输出「IIFE 修法：0, 1, 2」
// 注意：保留上面有问题的版本，方便对比
