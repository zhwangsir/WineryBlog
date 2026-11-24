async function main() {
  say('① 进入 main');    // await 之前：同步执行
  await wait(0);         // 让位：后面的代码被挂起，等这个 Promise 完成后再继续
  say('③ await 之后');   // 作为微任务执行
}
main();                  // 调用后立刻返回，主线程接着往下执行
say('② main 之后');      // 函数外面的同步代码先执行

// 顺序：① 进入 main → ② main 之后 → ③ await 之后
//
// 对比：main 是普通函数（没有 async / await）时，两行 say 会连着执行，顺序是 ① → ③ → ②
