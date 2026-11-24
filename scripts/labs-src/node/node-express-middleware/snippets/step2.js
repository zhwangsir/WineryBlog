// token 校验中间件——只挂在 /api 路径下，首页不受影响
app.use('/api', (req, res, next) => {
  // 请求头在 req.headers 里统一是小写
  if (req.headers['x-token'] !== TOKEN) {
    return res.status(401).json({ error: '未授权：请带上 x-token 请求头' });
  }
  next();
});

// 点「运行」后，在右侧终端里验证：
//   curl -i localhost:3000/api/notes                                  没有 token：401
//   curl -i -H "x-token: lab-token" localhost:3000/api/notes          带对 token：200
//   curl -i localhost:3000/                                           首页不需要 token：200
