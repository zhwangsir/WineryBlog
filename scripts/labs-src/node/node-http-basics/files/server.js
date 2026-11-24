// 不用框架：用 Node.js 自带的 http 模块写一个带路由的小服务
// 点右上角的「运行」相当于在终端里执行 node server.js；之后用 curl 请求 localhost:3000
const http = require('http');

// 路由表：「方法 路径」→ 处理函数。这一条已经写好：访问首页，返回一段纯文本
const routes = {
  'GET /': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('欢迎来到 WineryLab');
  },
};

const server = http.createServer((req, res) => {
  // 每来一个请求，这个回调就被调用一次：req 是请求（方法 req.method、路径 req.url），res 用来写响应
  // TODO（Step 1）：用 `${req.method} ${req.url}` 拼出 key，到 routes 里查出处理函数并调用它
  //   （查不到时先让请求落到下面的占位响应）
  // TODO（Step 2）：在 routes 里加一条 'GET /api/time'，返回 JSON
  // TODO（Step 3）：查不到处理函数时，把下面这段占位响应换成 404

  // 占位：路由表接上之前，所有请求都先回这一句
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('路由表还没接上');
});

server.listen(3000, () => console.log('服务已启动：localhost:3000'));
