// 手写防抖与节流，并用「模拟输入」验证效果
//
// 这里没有输入框，所以用 sleep(ms) 按时间表一次次地调用被保护过的函数，
// 就像用户在搜索框里一个字一个字地敲。每一行都按真实发生的先后顺序打印出来。

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ───── 防抖：等用户「停下来」才执行 ─────
// 每次触发都清掉上一次的定时器、重新计时；只有连续 wait 毫秒不再触发，才真正执行一次。
function debounce(fn, wait) {
  let timer = null;   // 闭包变量：记着还没到点的那个定时器
  return function (...args) {
    clearTimeout(timer);                 // 又触发了：上一次的「预约」作废
    timer = setTimeout(() => {
      fn.apply(this, args);              // 把 this 和参数原样转交
    }, wait);
  };
}

// ───── 节流：每 interval 毫秒最多执行一次 ─────
// 首次立即执行；间隔没到的触发先忽略；如果忽略期间有过触发，间隔到点时用最后一次的参数补执行一次。
function throttle(fn, interval) {
  let last = 0;         // 上一次真正执行的时刻（初始 0 表示「很久没执行过了」）
  let timer = null;     // 「补执行」用的定时器
  let lastArgs = null;  // 被忽略期间，最后一次调用传进来的参数
  return function (...args) {
    lastArgs = args;
    const remaining = interval - (Date.now() - last);   // 距离「可以再次执行」还差多少毫秒
    if (remaining <= 0) {
      // 间隔已经够了：立即执行（顺便取消可能还挂着的补执行定时器）
      clearTimeout(timer);
      timer = null;
      last = Date.now();
      fn.apply(this, args);
    } else if (!timer) {
      // 间隔没到：先忍着，等间隔到点再补执行一次
      timer = setTimeout(() => {
        timer = null;
        last = Date.now();
        fn.apply(this, lastArgs);
      }, remaining);
    }
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
// 输入 1、2 一直被推迟；输入 3 之后停够了 150ms → 执行「abc」；输入 4、5 之后 → 执行「abcde」
await simulate('防抖 debounce（wait = 150）', [makeGuard('防抖', debounce, 150)], [
  { gap: 0, text: 'a' },
  { gap: 40, text: 'ab' },
  { gap: 40, text: 'abc' },
  { gap: 300, text: 'abcd' },
  { gap: 40, text: 'abcde' },
]);   // 小结：触发 5 次，防抖执行了 2 次

// 场景二：一口气打 5 个字，停 500ms，再一口气打 5 个字
// 每一阵：第 1 次输入立即执行；之后的输入被忽略，间隔到点时补执行这一阵的最后一次（第 5 次 / 第 10 次）
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
]);   // 小结：触发 10 次，节流执行了 4 次

// 场景三：同一串连续的输入，同时交给防抖和节流
// 防抖一路被推迟，只在最后执行 1 次；节流第 1 次立即执行，间隔到点再补 1 次，共 2 次
await simulate('对比：连续输入 5 次，每次间隔 20ms', [
  makeGuard('防抖', debounce, 150),
  makeGuard('节流', throttle, 200),
], [
  { gap: 0, text: 'a' },
  { gap: 20, text: 'aa' },
  { gap: 20, text: 'aaa' },
  { gap: 20, text: 'aaaa' },
  { gap: 20, text: 'aaaaa' },
]);   // 小结：触发 5 次，防抖执行了 1 次，节流执行了 2 次

console.log('\n脚本结束。记法：防抖等用户「停下来」才执行，节流控制「多久最多执行一次」。');
