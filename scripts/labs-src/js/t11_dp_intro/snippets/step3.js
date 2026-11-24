function climb(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;              // a = f(i-2)，b = f(i-1)
  for (let i = 3; i <= n; i++) [a, b] = [b, a + b];
  return b;
}
console.log(climb(30));          // 1346269
