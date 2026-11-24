function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);
}
// 一个 500ms 才完成的任务，超时设 200ms → 应 reject(new Error('timeout'))
withTimeout(new Promise((r) => setTimeout(() => r('ok'), 500)), 200)
  .catch((e) => console.log('timeout caught:', e.message));
