function createCounter() {
  let count = 0;                 // 这个变量只属于下面返回的那个函数
  return function () {
    count += 1;                  // 每次调用，改的都是同一个 count
    return count;
  };
}

const counter = createCounter(); // counter 和 count 一起构成了闭包
console.log(counter());           // 1
console.log(counter());           // 2
console.log(counter());           // 3

const another = createCounter(); // 再造一个：它有自己独立的 count
console.log(another());           // 1（和 counter 互不干扰）
