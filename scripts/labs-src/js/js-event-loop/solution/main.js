// 事件循环：先猜输出顺序，再运行验证
//
// 玩法：下面有三道小题。先把你预测的顺序填进 guess1 / guess2 / guess3，再点「运行」——
// 脚本会真的执行这三段代码，并且自动判卷。没填答案的题不会揭晓结果。
// 填写规则：把题目里输出的那几个词，按「谁先输出谁在前」排进数组，文字要一模一样。

// ───── 答案 ─────
// 规则只有一条：先跑完同步代码 → 再清空微任务（Promise.then、await 之后的代码）→ 最后才轮到定时器
const guess1 = ['脚本开始', '脚本结束', '定时器'];
const guess2 = ['开始', '结束', 'then', '定时器'];
const guess3 = ['① 进入 main', '② main 之后', '③ await 之后'];

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
// setTimeout 只是把回调「登记」进任务队列，必须等当前这段同步代码全部跑完才会执行
await question(1, '同步代码 vs setTimeout', guess1, async () => {
  say('脚本开始');
  setTimeout(() => say('定时器'), 0);   // 延迟写 0 也不会「马上」执行
  say('脚本结束');
});                                    // 脚本开始 → 脚本结束 → 定时器

// ───── 第 2 题：Promise.then 与微任务 ─────
// 同步代码一结束，引擎先清空微任务队列（then 的回调），然后才去取任务队列里的定时器
await question(2, 'Promise.then 与微任务', guess2, async () => {
  say('开始');
  setTimeout(() => say('定时器'), 0);
  Promise.resolve().then(() => say('then'));
  say('结束');
});                                    // 开始 → 结束 → then → 定时器

// ───── 第 3 题：async/await ─────
// async 函数遇到 await 就让位：后面的代码被挂起，等 Promise 完成后作为微任务继续执行
await question(3, 'async/await', guess3, async () => {
  async function main() {
    say('① 进入 main');    // await 之前：同步执行
    await wait(0);         // 让位：函数外面的同步代码先跑
    say('③ await 之后');   // 微任务：排在函数外面的同步代码之后
  }
  main();
  say('② main 之后');
});                                    // ① 进入 main → ② main 之后 → ③ await 之后

// ───── 总评 ─────
function summary() {
  if (answered === 0) return '三道题都还没填答案：先在心里排好顺序，填进 guess1 / guess2 / guess3，再点「运行」';
  if (wrong > 0) return `有 ${wrong} 道题猜错了：对照实际顺序想一想为什么，改一改再运行`;
  if (answered < 3) return `填了答案的题都猜对了！还有 ${3 - answered} 道题没填答案`;
  return '3 题全部猜对！你已经摸清事件循环的基本顺序了';
}
console.log(summary());
