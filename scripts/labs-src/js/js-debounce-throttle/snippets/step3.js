// 同一串连续的输入（每次间隔 20ms），分别经过防抖和节流：
const debounced = debounce(log, 150);
const throttled = throttle(log, 200);
debounced('a');        // 防抖：只是开始计时
throttled('a');        // 节流：立即执行  ①
debounced('aa');
throttled('aa');       // 节流：间隔没到，登记「稍后补一次」
debounced('aaa');
throttled('aaa');      // 节流：忽略
debounced('aaaa');
throttled('aaaa');     // 节流：忽略
debounced('aaaaa');
throttled('aaaaa');    // 节流：忽略（但它成了「最后一次的参数」）
// ……大约 200ms 后：节流补执行 ②（aaaaa）
// ……大约 150ms 后：防抖执行   ③（aaaaa）——它一直在被推迟，直到输入停下来

// 结论：防抖执行 1 次（最后一次），节流执行 2 次（第一次 + 一次补执行）
//
// 怎么选：
//   等「做完再响应」        → 防抖：搜索联想、输入时校验表单、窗口 resize 结束后重算布局
//   过程中「持续但限频」    → 节流：滚动加载、拖拽时跟随、按钮防连点
