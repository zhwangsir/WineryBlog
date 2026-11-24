function myAll(promises) {
  return new Promise((resolve, reject) => {
    const list = Array.from(promises);
    const results = new Array(list.length);
    let done = 0;
    if (list.length === 0) return resolve([]);       // 空数组：立刻完成
    list.forEach((p, i) => {
      // Promise.resolve：普通值也能统一按 Promise 处理
      Promise.resolve(p).then((v) => {
        results[i] = v;                              // 按下标写入 → 保持输入顺序
        if (++done === list.length) resolve(results); // 全部到齐才 resolve
      }, reject);                                    // 任一失败：立刻 reject（只有第一次生效）
    });
  });
}

function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);
}

// 用例①：乱序完成但结果保序
console.log('①', await myAll([
  new Promise((r) => setTimeout(() => r('A'), 300)),
  new Promise((r) => setTimeout(() => r('B'), 100)),
]));                                    // [ 'A', 'B' ]

// 用例②：普通值混入
console.log('②', await myAll([1, Promise.resolve(2), 3]));   // [ 1, 2, 3 ]

// 用例③：任一失败
await myAll([Promise.reject(new Error('boom')), 1])
  .catch((e) => console.log('③ caught:', e.message));         // ③ caught: boom

// 用例④：超时保护——一个 500ms 才完成的任务，200ms 就不再等了
await withTimeout(new Promise((r) => setTimeout(() => r('ok'), 500)), 200)
  .catch((e) => console.log('④ timeout caught:', e.message)); // ④ timeout caught: timeout
