// Express 中间件：请求日志、token 校验、统一错误处理
// 点右上角的「运行」相当于在终端里执行 node server.js；之后用 curl 请求 localhost:3000
const express = require('express');
const app = express();
app.use(express.json());     // 解析 JSON 请求体（没有它 req.body 是 undefined）

// 接口约定的 token（练习用，直接写在代码里；真实项目应放到环境变量里）
const TOKEN = 'lab-token';

// 用数组模拟数据库
let notes = [{ id: 1, text: '学中间件' }];

// ---- 路由（已写好） ----
app.get('/', (req, res) => res.send('欢迎来到 WineryLab'));
app.get('/api/notes', (req, res) => res.json(notes));
app.post('/api/notes', (req, res, next) => {
  // TODO（Step 3）：请求体里没有 text 时，创建一个 Error（message 为「缺少 text 字段」）、
  //   给它设 status = 400，然后 return next(err)，交给错误处理中间件
  const note = { id: notes.length + 1, text: req.body.text };
  notes.push(note);
  res.status(201).json(note);
});

// TODO（Step 1）：请求日志中间件——必须用 app.use 注册在所有路由之前
//   用 console.log 打印「ISO 格式的当前时间 请求方法 路径」，然后调用 next()

// TODO（Step 2）：token 校验中间件——用 app.use 只挂在 /api 路径下：
//   请求头 x-token 与 TOKEN 不一致就回 401 的 JSON（记得 return，不再往下走），一致才 next()

// TODO（Step 3）：在所有路由之后注册错误处理中间件（固定四个参数：err、req、res、next）
//   用 console.error 打印错误信息，再按 err.status（没有就是 500）返回 { error: err.message }

app.listen(3000, () => console.log('API on :3000'));
