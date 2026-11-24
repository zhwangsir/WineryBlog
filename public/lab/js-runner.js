// JavaScript 实验的运行器：在后台线程里执行读者的代码，把输出回传给页面。
// 代码被包进一个 async 函数，所以支持顶层 await；函数的返回值（代码里最后一个表达式）也会回传。
// 这个文件由服务端带 CSP 响应头下发（connect-src 'none'），代码里发不出任何网络请求。

function post(type, text) {
  postMessage({ type, text });
}

/** 把任意值格式化成一行可读的文本（尽量接近开发者工具的显示） */
function fmt(v, depth) {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    return String(v);
  }
  if (typeof v === 'bigint') return v.toString() + 'n';
  if (typeof v === 'symbol') return v.toString();
  if (typeof v === 'function') return '[Function' + (v.name ? ': ' + v.name : ' (anonymous)') + ']';
  if (typeof v === 'string') return depth ? JSON.stringify(v) : v;
  if (v instanceof Error) return (v.name || 'Error') + ': ' + v.message;
  if (v instanceof Date) return v.toISOString();
  if (v instanceof Map) {
    const items = Array.from(v).slice(0, 12).map(function (e) { return fmt(e[0], 1) + ' => ' + fmt(e[1], 1); });
    return 'Map(' + v.size + ') { ' + items.join(', ') + (v.size > 12 ? ', …' : '') + ' }';
  }
  if (v instanceof Set) {
    const items = Array.from(v).slice(0, 12).map(function (x) { return fmt(x, 1); });
    return 'Set(' + v.size + ') { ' + items.join(', ') + (v.size > 12 ? ', …' : '') + ' }';
  }
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    const items = v.slice(0, 100).map(function (x) { return fmt(x, 1); });
    return '[ ' + items.join(', ') + (v.length > 100 ? ', … +' + (v.length - 100) + ' 项' : '') + ' ]';
  }
  try {
    const seen = new WeakSet();
    return JSON.stringify(v, function (k, val) {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      if (typeof val === 'bigint') return val.toString() + 'n';
      return val;
    }, depth ? 0 : 1) || String(v);
  } catch (e) {
    return String(v);
  }
}

const emit = (level) => function () {
  const args = Array.prototype.slice.call(arguments);
  post(level, args.map(function (a) { return fmt(a, 0); }).join(' '));
};
self.console = { log: emit('log'), info: emit('log'), debug: emit('log'), warn: emit('warn'), error: emit('error') };

self.addEventListener('error', function (e) {
  post('error', e.message + (e.lineno ? '（第 ' + e.lineno + ' 行）' : ''));
});
self.addEventListener('unhandledrejection', function (e) {
  post('error', '未捕获的 Promise 拒绝：' + fmt(e.reason, 0));
});

self.onmessage = function (e) {
  if (!e.data || e.data.type !== 'run') return;
  run(e.data.code);
};

/** 把代码包成 async 函数（支持顶层 await）。codeWrap 是对整段代码的改写，用来让最后一条表达式变成返回值 */
const wrap = (code) => new Function('return (async () => {\n' + code + '\n})');

/**
 * 找出最后一条表达式语句并改成 return，让交互式的「最后一个表达式的值」在顶层 await 的代码里也能用。
 * 只在换行处切分，且要求上一行以 ; 或 } 结尾（其它情况有没有分号会影响语义，不冒险）；
 * 每个候选都要整段代码能编译通过才算，全都编不过就不回显。
 */
function withLastReturn(code) {
  const starts = [];
  for (let i = 0; i < code.length; i++) {
    if (code.charCodeAt(i) === 10 && i + 1 < code.length) {
      // 这一行的第一个非空白字符，以及上一行最后一个非空白字符
      let j = i + 1;
      while (j < code.length && (code[j] === ' ' || code[j] === '\t' || code[j] === '\r')) j++;
      let k = i - 1;
      while (k >= 0 && (code[k] === ' ' || code[k] === '\t' || code[k] === '\r')) k--;
      if (k >= 0 && (code[k] === ';' || code[k] === '}')) starts.push(j);
    }
  }
  // 从最靠后的切分点往前试：越靠后，被 return 的越接近「最后一条语句」
  for (let s = starts.length - 1; s >= 0; s--) {
    const at = starts[s];
    const head = code.slice(0, at);
    // 结尾的分号和行尾注释不能被括进 return ( … ) 里
    const tail = code.slice(at)
      .replace(/\s*;\s*(?:\/\/[^\n]*)?$/, '')     // 末尾的 ; 以及跟在同一行的 // 注释
      .replace(/(?:\s*\/\/[^\n]*)+$/, '');         // 末尾整行的 // 注释
    if (!tail.trim() || /^\s*(\/\/|\/\*)/.test(tail)) continue;
    const candidate = head + 'return (' + tail + '\n);';
    try { wrap(candidate); return candidate; } catch (e) { /* 这个切分点不行，再往前 */ }
  }
  return null;
}

/** 只编译、不执行：语法不对返回 false，其它异常照常抛出 */
function compiles(make) {
  try { make(); return true; } catch (e) { if (e instanceof SyntaxError) return false; throw e; }
}

async function run(code) {
  // 报错栈里的行号与读者代码行号的差：eval 的行号就是读者的行号；
  // new Function 生成的函数自带两行函数头，再加上我们的 `return (async () => {` 一行
  let offset = 0;
  try {
    let result;
    // 代码用了顶层 await 时，按普通函数体编译不过、按 async 函数体能编过。
    // 不能靠报错信息里有没有「await」来判断：解析器把 await 当成标识符，报的是「缺少右括号」
    const plainOk = compiles(() => new Function(code));
    const asyncOk = plainOk || compiles(() => wrap(code));
    if (!plainOk && !asyncOk) {
      wrap(code);     // 抛出语法错误
    }
    if (plainOk) {
      // 直接 eval：完成值就是最后一条语句的值（和交互式解释器一样）
      result = await eval(code);
    } else {
      offset = 3;
      const transformed = withLastReturn(code);
      result = await wrap(transformed !== null ? transformed : code)()();
    }
    if (result !== undefined) post('result', fmt(result, 0));
  } catch (err) {
    report(err, offset);
  }
  // 运行结束后才发生的「未捕获的 Promise 拒绝」要再过一轮事件循环才会派发；等两拍再宣告结束
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
  post('done');
}

/** 报错：取读者代码里的行号（eval / new Function 的栈帧形如 <anonymous>:行:列） */
function report(err, offset) {
  const stack = String((err && err.stack) || '');
  const first = stack.split('\n')[0];
  const frame = stack.match(/<anonymous>:(\d+):\d+/);
  if (!frame) { post('error', (err instanceof SyntaxError ? '语法错误：' : '') + first); return; }
  const line = Number(frame[1]) - offset;
  post('error', first + (line > 0 ? '（第 ' + line + ' 行）' : ''));
}
