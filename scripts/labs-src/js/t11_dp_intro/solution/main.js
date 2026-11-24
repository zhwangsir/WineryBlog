// Step 1：暴力递归——重叠子问题被反复计算
let calls = 0;
function f(n) {
  calls++;
  if (n <= 2) return n;
  return f(n - 1) + f(n - 2);
}
console.log('暴力递归 f(30) =', f(30), '调用次数 =', calls);      // 832040，约 269 万次

// Step 2：记忆化递归——算过的直接返回（自顶向下的动态规划）
let calls2 = 0;
const memo = {};
function fMemo(n) {
  calls2++;
  if (n <= 2) return n;
  if (memo[n]) return memo[n];
  return (memo[n] = fMemo(n - 1) + fMemo(n - 2));
}
console.log('记忆化   f(30) =', fMemo(30), '调用次数 =', calls2); // 832040，57 次

// Step 3：递推 DP——只依赖前两项，用两个变量滚动（自底向上，空间 O(1)）
function climb(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) [a, b] = [b, a + b];
  return b;
}
console.log('递推     f(30) =', climb(30), '空间 O(1)');           // 832040

// 三种写法结果一致：状态转移方程都是 f(n) = f(n-1) + f(n-2)，f(1) = 1，f(2) = 2
