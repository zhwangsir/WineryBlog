// 事件循环：先猜输出顺序，再运行验证
//
// 玩法：下面有三道小题。先把你预测的顺序填进 guess1 / guess2 / guess3，再点「运行」——
// 脚本会真的执行这三段代码，并且自动判卷。没填答案的题不会揭晓结果。
// 填写规则：把题目里输出的那几个词，按「谁先输出谁在前」排进数组，文字要一模一样。

// ───── 你的答案 ─────
// TODO：先在心里把三道题的输出顺序想清楚，再填下面三个数组，例如  const guess1 = ['甲', '乙', '丙'];
const guess1 = [];   // 第 1 题的三个词：脚本开始 / 脚本结束 / 定时器
const guess2 = [];   // 第 2 题的四个词：开始 / 结束 / then / 定时器
const guess3 = [];   // 第 3 题的三个词：① 进入 main / ② main 之后 / ③ await 之后

// ───── 出题和判卷用的小工具（不用改）─────
// wait(ms)：返回一个「ms 毫秒后才完成」的 Promise
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let record = [];    // 按真实执行的先后，记下「当前这道题」输出过的词
const say = (word) => { record.push(word); console.log(word); };
let answered = 0;   // 填了答案的题数
let wrong = 0;      // 猜错的题数

// question：出一道题。guess 是你的答案，run 是题目代码；没填答案就不揭晓
async function question(no, title, guess, run) {
  console.log(`【第 ${no} 题】${title}`);
  if (guess.length === 0) {
    console.log(`还没填答案：把你的预测写进 guess${no}，再点「运行」`);
    return;
  }
  answered += 1;
  record = [];
  await run();
  await wait(20);                     // 等还没执行的异步代码跑完，再判卷
  if (guess.join(' → ') === record.join(' → ')) console.log(`第 ${no} 题判卷：猜对了！`);
  else {
    wrong += 1;
    console.log(`第 ${no} 题判卷：猜错了，实际顺序是 ${record.join(' → ')}`);
  }
}

// ───── 第 1 题：同步代码 vs setTimeout ─────
await question(1, '同步代码 vs setTimeout', guess1, async () => {
  say('脚本开始');
  setTimeout(() => say('定时器'), 0);   // 延迟写 0 也不会「马上」执行
  say('脚本结束');
});

// ───── 第 2 题：Promise.then 与微任务 ─────
await question(2, 'Promise.then 与微任务', guess2, async () => {
  say('开始');
  setTimeout(() => say('定时器'), 0);
  Promise.resolve().then(() => say('then'));
  say('结束');
});

// ───── 第 3 题：async/await ─────
// TODO（第 3 步）：
//   1. 先照现在的写法猜一遍（填 guess3，运行）
//   2. 把 main 改成 async 函数，在两行 say 之间加一句 await wait(0);
//   3. 输出顺序会因此改变——重新想一遍，改 guess3，再运行
await question(3, 'async/await', guess3, async () => {
  function main() {
    say('① 进入 main');
    say('③ await 之后');
  }
  main();
  say('② main 之后');
});

// ───── 总评 ─────
function summary() {
  if (answered === 0) return '三道题都还没填答案：先在心里排好顺序，填进 guess1 / guess2 / guess3，再点「运行」';
  if (wrong > 0) return `有 ${wrong} 道题猜错了：对照实际顺序想一想为什么，改一改再运行`;
  if (answered < 3) return `填了答案的题都猜对了！还有 ${3 - answered} 道题没填答案`;
  return '3 题全部猜对！你已经摸清事件循环的基本顺序了';
}
console.log(summary());
