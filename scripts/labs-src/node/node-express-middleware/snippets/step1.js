// 请求日志中间件——必须注册在所有路由之前
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();                                   // 交给下一环；不调用 next，请求会一直挂起
});

// 点「运行」后，在右侧终端里验证：
//   curl -s localhost:3000/              终端里应多出一行日志：… GET /
//   curl -s localhost:3000/api/notes     再多出一行：… GET /api/notes
