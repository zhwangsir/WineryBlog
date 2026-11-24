// 节流：每 interval 毫秒最多执行一次
function throttle(fn, interval) {
  let last = 0;         // 上一次真正执行的时刻（初始 0 表示「很久没执行过了」）
  let timer = null;     // 「补执行」用的定时器
  let lastArgs = null;  // 被忽略期间，最后一次调用传进来的参数
  return function (...args) {
    lastArgs = args;
    const remaining = interval - (Date.now() - last);   // 距离「可以再次执行」还差多少毫秒
    if (remaining <= 0) {
      // 间隔已经够了：立即执行
      clearTimeout(timer);
      timer = null;
      last = Date.now();
      fn.apply(this, args);
    } else if (!timer) {
      // 间隔没到：先忍着，等间隔到点再补执行一次
      timer = setTimeout(() => {
        timer = null;
        last = Date.now();
        fn.apply(this, lastArgs);     // 用「最后一次的参数」，所以最后一次操作不会丢
      }, remaining);
    }
  };
}
