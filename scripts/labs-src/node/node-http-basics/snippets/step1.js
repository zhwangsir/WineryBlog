const server = http.createServer((req, res) => {
  const key = `${req.method} ${req.url}`;   // 例如 "GET /"
  const handler = routes[key];              // 拿 key 去路由表里查

  if (handler) {
    handler(req, res);                      // 查到了：交给对应的处理函数
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('路由表还没接上');               // 占位响应，Step 3 会把这里换成 404
  }
});

server.listen(3000, () => console.log('服务已启动：localhost:3000'));

// 点「运行」后，在右侧终端里验证：
//   curl -i localhost:3000/      状态行 HTTP/1.1 200 OK，响应体是「欢迎来到 WineryLab」
