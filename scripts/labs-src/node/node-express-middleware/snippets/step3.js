// 路由里：请求不合法就 next(err)，并标注状态码
if (!req.body.text) {
  const err = new Error('缺少 text 字段');
  err.status = 400;
  return next(err);
}

// 所有路由之后：错误处理中间件（固定四个参数，Express 靠参数个数识别它）
app.use((err, req, res, next) => {
  console.error(`[错误] ${err.message}`);
  res.status(err.status || 500).json({ error: err.message });
});

// 点「运行」后，在右侧终端里验证：
//   curl -i -X POST localhost:3000/api/notes -H "x-token: lab-token" -H "Content-Type: application/json" -d "{}"
//   → 400，响应体含「缺少 text 字段」；服务没有崩溃，之后的请求照常
