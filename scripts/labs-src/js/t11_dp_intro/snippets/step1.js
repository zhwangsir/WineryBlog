let calls = 0;
function f(n) {
  calls++;
  if (n <= 2) return n;          // f(1) = 1，f(2) = 2
  return f(n - 1) + f(n - 2);
}
console.log(f(30), calls);       // 1346269  1664079
