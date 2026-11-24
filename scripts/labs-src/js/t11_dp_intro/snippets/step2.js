let calls = 0;
const memo = {};
function f(n) {
  calls++;
  if (n <= 2) return n;
  if (memo[n]) return memo[n];             // 算过：直接返回
  return (memo[n] = f(n - 1) + f(n - 2));  // 没算过：算完再存起来
}
console.log(f(30), calls);       // 1346269  57
