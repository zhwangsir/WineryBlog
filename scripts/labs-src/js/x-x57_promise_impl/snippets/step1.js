function myAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let done = 0;
    // TODO: 处理空数组
    // TODO: 遍历 promises，逐个 Promise.resolve(p).then(...)
    //   成功: results[i] = v; done++; 若 done === promises.length 则 resolve(results)
    //   失败: reject(e)
  });
}
