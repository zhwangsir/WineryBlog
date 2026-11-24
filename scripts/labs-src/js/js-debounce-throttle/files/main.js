// 手写防抖与节流，并用「模拟输入」验证效果
//
// 这里没有输入框，所以用 sleep(ms) 按时间表一次次地调用被保护过的函数，
// 就像用户在搜索框里一个字一个字地敲。每一行都按真实发生的先后顺序打印出来。
// 整个脚本大约 2 秒跑完。

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO（第 1 步）：实现防抖。要求：wait 毫秒内又触发了新的调用，就重新计时；
//   只有「连续 wait 毫秒不再触发」之后，才真正执行一次（执行的是最后一次调用的参数）
//   提示：用一个闭包变量 timer 保存定时器编号；每次触发先 clearTimeout(timer)，再重新 setTimeout
//   提示：用 fn.apply(this, args) 把 this 和参数原样转交给 fn
function debounce(fn, wait) {
  return function (...args) {
    fn.apply(this, args);   // 占位：每次触发都直接执行——所以现在「触发几次就执行几次」
  };
}

// TODO（第 2 步）：实现节流。要求：每 interval 毫秒最多执行一次——
//   第一次触发立即执行；间隔没到的触发先忽略；如果忽略期间又有过触发，
//   就在间隔到点时用「最后一次的参数」补执行一次（这样用户最后一次操作不会丢）
//   提示：需要三个闭包变量——上一次执行的时刻 last、补执行用的定时器 timer、最后一次的参数 lastArgs
//   提示：用 Date.now() 拿到当前时间，算出距离「可以再次执行」还剩多少毫秒
function throttle(fn, interval) {
  return function (...args) {
    fn.apply(this, args);   // 占位：每次触发都直接执行
  };
}

// ───── 下面是模拟输入用的工具（已写好，不用改）─────
// makeGuard：给「真正要做的事」套上一层保护，并帮它记执行了几次
//   name 写在输出里；protect 是 debounce 或 throttle；wait 是时间参数
function makeGuard(name, protect, wait) {
  const guard = { name, executed: 0, fn: null };
  guard.fn = protect((text, n) => {
    guard.executed += 1;
    console.log(`  [执行] ${name}搜索：「${text}」（第 ${n} 次输入的内容）`);
  }, wait);
  return guard;
}

// simulate：按 plan 模拟用户输入。每一项的 gap 是「距上一次输入隔了多少毫秒」，text 是输入框里的内容
async function simulate(title, guards, plan, tail = 350) {
  console.log(`\n【${title}】`);
  let fired = 0;                     // 触发了几次
  for (const step of plan) {
    await sleep(step.gap);
    fired += 1;
    console.log(`  输入 ${fired}：「${step.text}」`);
    for (const g of guards) g.fn(step.text, fired);
  }
  await sleep(tail);                 // 等还挂着的定时器都执行完，再小结
  const summary = guards.map((g) => `${g.name}执行了 ${g.executed} 次`).join('，');
  console.log(`  小结：触发 ${fired} 次，${summary}`);
}

// ───── 三个场景 ─────
// 场景一：打了 3 个字，停了 300ms（够久），又打了 2 个字
await simulate('防抖 debounce（wait = 150）', [makeGuard('防抖', debounce, 150)], [
  { gap: 0, text: 'a' },
  { gap: 40, text: 'ab' },
  { gap: 40, text: 'abc' },
  { gap: 300, text: 'abcd' },
  { gap: 40, text: 'abcde' },
]);

// 场景二：一口气打 5 个字，停 500ms，再一口气打 5 个字
await simulate('节流 throttle（interval = 200）', [makeGuard('节流', throttle, 200)], [
  { gap: 0, text: 'a' },
  { gap: 20, text: 'ab' },
  { gap: 20, text: 'abc' },
  { gap: 20, text: 'abcd' },
  { gap: 20, text: 'abcde' },
  { gap: 500, text: 'abcdef' },
  { gap: 20, text: 'abcdefg' },
  { gap: 20, text: 'abcdefgh' },
  { gap: 20, text: 'abcdefghi' },
  { gap: 20, text: 'abcdefghij' },
]);

// 场景三（第 3 步）：同一串连续的输入，同时交给防抖和节流，对比执行次数
await simulate('对比：连续输入 5 次，每次间隔 20ms', [
  makeGuard('防抖', debounce, 150),
  makeGuard('节流', throttle, 200),
], [
  { gap: 0, text: 'a' },
  { gap: 20, text: 'aa' },
  { gap: 20, text: 'aaa' },
  { gap: 20, text: 'aaaa' },
  { gap: 20, text: 'aaaaa' },
]);

console.log('\n脚本结束。记法：防抖等用户「停下来」才执行，节流控制「多久最多执行一次」。');
