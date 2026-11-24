// Express 中间件：请求日志、token 校验、统一错误处理
const express = require('express');
const app = express();
app.use(express.json());     // 解析 JSON 请求体（没有它 req.body 是 undefined）

// 接口约定的 token（练习用，直接写在代码里；真实项目应放到环境变量里）
const TOKEN = 'lab-token';

// 用数组模拟数据库
let notes = [{ id: 1, text: '学中间件' }];

// Step 1：请求日志中间件——注册在所有路由之前，每个请求都先路过它
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();                                   // 交给下一环；不调用 next，请求会一直挂起
});

// Step 2：token 校验中间件——只挂在 /api 下，首页不受影响
app.use('/api', (req, res, next) => {
  // 请求头在 req.headers 里统一是小写
  if (req.headers['x-token'] !== TOKEN) {
    return res.status(401).json({ error: '未授权：请带上 x-token 请求头' });
  }
  next();
});

// ---- 路由 ----
app.get('/', (req, res) => res.send('欢迎来到 WineryLab'));
app.get('/api/notes', (req, res) => res.json(notes));
app.post('/api/notes', (req, res, next) => {
  // Step 3：请求不合法就 next(err)，并标注状态码
  if (!req.body.text) {
    const err = new Error('缺少 text 字段');
    err.status = 400;
    return next(err);
  }
  const note = { id: notes.length + 1, text: req.body.text };
  notes.push(note);
  res.status(201).json(note);
});

// Step 3：错误处理中间件——固定四个参数，必须注册在所有路由之后
app.use((err, req, res, next) => {
  console.error(`[错误] ${err.message}`);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(3000, () => console.log('API on :3000'));
