// Step 1：暴力递归——加一个计数器，看看 f 被调用了多少次
let calls = 0;
function f(n) {
  calls++;
  if (n <= 2) return n;
  return f(n - 1) + f(n - 2);
}
console.log('f(30) =', f(30));
console.log('暴力递归调用次数 =', calls);

// TODO（Step 2）：加一个 memo 缓存——算过的直接返回，再数一次调用次数
// TODO（Step 3）：改成递推 DP，只保留最近两个状态，把空间压到 O(1)
