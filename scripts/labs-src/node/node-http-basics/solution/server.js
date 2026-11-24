// 不用框架：用 Node.js 自带的 http 模块写一个带路由的小服务
const http = require('http');

// 路由表：「方法 路径」→ 处理函数
const routes = {
  // 首页：纯文本
  'GET /': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('欢迎来到 WineryLab');
  },
  // Step 2：JSON 接口——对象先用 JSON.stringify 变成字符串，Content-Type 设为 application/json
  'GET /api/time': (req, res) => {
    const body = JSON.stringify({ now: new Date().toISOString() });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(body);
  },
};

const server = http.createServer((req, res) => {
  // Step 3：req.url 可能带着查询串（如 /api/time?tz=8），只取 ? 前面的路径
  const path = req.url.split('?')[0];
  // Step 1：拼出「方法 路径」作为 key，去路由表里查
  const key = `${req.method} ${path}`;
  const handler = routes[key];

  if (handler) {
    handler(req, res);
  } else {
    // Step 3：路由表里没有的（路径不对，或者方法不对）统一 404
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(3000, () => console.log('服务已启动：localhost:3000'));
