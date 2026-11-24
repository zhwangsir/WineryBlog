// 防抖：等用户「停下来」才执行
function debounce(fn, wait) {
  let timer = null;                   // 闭包变量：记着还没到点的那个定时器
  return function (...args) {
    clearTimeout(timer);              // 又触发了：上一次的「预约」作废
    timer = setTimeout(() => {
      fn.apply(this, args);           // 把 this 和参数原样转交
    }, wait);
  };
}

// 用法：5 次输入之间都只隔了 40ms，于是只有最后那一次（abcde）被执行
const search = debounce((text) => console.log('搜索：' + text), 150);
search('a');
search('ab');
search('abc');
search('abcd');
search('abcde');
