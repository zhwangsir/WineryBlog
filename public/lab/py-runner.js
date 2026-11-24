// Python 实验的运行器：在后台线程里加载 Pyodide（浏览器里的 CPython），执行读者的代码。
// 引擎文件全部来自站内的 /vendor/pyodide/，不回源到 CDN。
// 这个文件由服务端带 CSP 响应头下发（connect-src 'self'），代码里发不出站外请求。

let pyodide = null;

function post(type, text) {
  postMessage({ type, text });
}

try {
  importScripts('/vendor/pyodide/pyodide.js');
} catch (e) {
  post('fatal', 'Python 引擎没有加载成功：站内缺少 /vendor/pyodide/ 目录。请在项目根目录执行一次 node scripts/fetch-pyodide.mjs');
}

if (typeof loadPyodide === 'function') {
  loadPyodide({ indexURL: '/vendor/pyodide/' }).then(function (py) {
    pyodide = py;
    // Pyodide 默认会把包管理器的下载源指向公网 CDN，改回站内目录
    try { py.setCdnUrl('/vendor/pyodide/'); } catch (e) { /* 旧版本没有这个接口 */ }
    const sink = function (type) {
      return { batched: function (lines) {
        (Array.isArray(lines) ? lines : [lines]).forEach(function (s) { post(type, String(s)); });
      } };
    };
    py.setStdout(sink('log'));
    py.setStderr(sink('error'));
    post('ready', '');
  }).catch(function (e) {
    post('fatal', 'Python 引擎启动失败：' + (e && e.message ? e.message : e));
  });
}

self.onmessage = async function (e) {
  const msg = e.data || {};
  if (msg.type === 'status') { post(pyodide ? 'ready' : 'loading', ''); return; }
  if (msg.type !== 'run' || !pyodide) return;
  try {
    const value = await pyodide.runPythonAsync(msg.code);
    // 和交互式解释器一样：最后一个表达式的值会被显示出来
    if (value !== undefined) {
      pyodide.globals.set('__lab_last', value);
      post('result', pyodide.runPython('repr(__lab_last)'));
      if (value && typeof value.destroy === 'function') value.destroy();
    }
  } catch (err) {
    post('error', String(err));
  }
  post('done', String(msg.id || ''));
};
