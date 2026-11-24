// TODO：不借助 Promise.all，手写一个行为兼容的 myAll
// 要求：全部成功 → 按输入的顺序返回结果数组；任一失败 → 立刻 reject
function myAll(promises) {
  return new Promise((resolve, reject) => {
    // TODO（Step 1）：
    // 1. 空数组：直接 resolve([])
    // 2. 遍历 promises，对每一项调用 Promise.resolve(p).then(成功回调, 失败回调)
    //    成功：results[i] = v   —— 必须按下标写入，push 会变成「完成顺序」
    //          全部完成后 resolve(results)
    //    失败：reject(e)
    resolve([]);   // 这只是占位，让下面的用例能先跑起来——改成真正等待所有 Promise
  });
}
// 占位版不会去等待传入的 Promise：先给它们各挂一个空的 catch，免得用例③ 里那个失败的 Promise 变成「未捕获异常」
const quiet = (list) => { for (const p of list) Promise.resolve(p).catch(() => {}); return list; };

// 用例①：乱序完成但结果保序（B 先完成，结果仍应是 A、B）
console.log('①', await myAll([
  new Promise((r) => setTimeout(() => r('A'), 300)),
  new Promise((r) => setTimeout(() => r('B'), 100)),
]));                                    // 期望 [ 'A', 'B' ]

// 用例②：普通值混入
console.log('②', await myAll([1, Promise.resolve(2), 3]));   // 期望 [ 1, 2, 3 ]

// 用例③：任一失败
await myAll(quiet([Promise.reject(new Error('boom')), 1]))
  .catch((e) => console.log('③ caught:', e.message));         // 期望 ③ caught: boom

// TODO（Step 3）：实现 withTimeout(p, ms)——超时未完成则整体 reject
