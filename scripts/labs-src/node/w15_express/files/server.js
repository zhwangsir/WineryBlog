const express = require('express');
const app = express();

// TODO（Step 1）：挂上 JSON 解析中间件——没有它 req.body 就是 undefined
// app.use(express.json());

// 用数组模拟数据库
let todos = [{ id: 1, text: '买牛奶', done: false }];

// TODO（Step 2）：实现四个路由
//   GET    /todos       → 返回全部
//   POST   /todos       → 新增一条，返回 201
//   PATCH  /todos/:id   → 修改状态；找不到返回 404
//   DELETE /todos/:id   → 删除；返回 204

app.listen(3000, () => console.log('API on :3000'));
