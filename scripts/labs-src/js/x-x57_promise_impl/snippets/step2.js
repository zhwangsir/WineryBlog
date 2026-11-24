// 用例①：乱序完成但结果保序
myAll([
  new Promise((r) => setTimeout(() => r('A'), 300)),
  new Promise((r) => setTimeout(() => r('B'), 100)),
]).then(console.log);            // 期望 [ 'A', 'B' ]（不是 [ 'B', 'A' ]）

// 用例②：普通值混入
myAll([1, Promise.resolve(2), 3]).then(console.log);   // [ 1, 2, 3 ]

// 用例③：任一失败
myAll([Promise.reject(new Error('boom')), 1])
  .catch((e) => console.log('caught:', e.message));    // caught: boom
