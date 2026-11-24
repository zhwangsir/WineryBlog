// 加到 routes 对象里（和 'GET /' 并列）
'GET /api/time': (req, res) => {
  const body = JSON.stringify({ now: new Date().toISOString() });   // 对象 → JSON 字符串
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
},

// 点「运行」后，在右侧终端里验证：
//   curl -i localhost:3000/api/time      200，Content-Type 是 application/json，响应体含 now 字段
