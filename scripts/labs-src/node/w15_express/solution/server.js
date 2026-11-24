const express = require('express');
const app = express();
app.use(express.json());          // Step 1：解析 JSON 请求体（没有它 req.body 是 undefined）

// 用数组模拟数据库
let todos = [{ id: 1, text: '买牛奶', done: false }];

// 查全
app.get('/todos', (req, res) => res.json(todos));

// 新增：201 Created
app.post('/todos', (req, res) => {
  const t = { id: Date.now(), text: req.body.text, done: false };
  todos.push(t);
  res.status(201).json(t);
});

// 修改状态：找不到返回 404（注意 req.params.id 是字符串，与数字 id 比较要先转换）
app.patch('/todos/:id', (req, res) => {
  const t = todos.find((x) => x.id == req.params.id);
  if (!t) return res.status(404).json({ error: 'not found' });
  Object.assign(t, req.body);
  res.json(t);
});

// 删除：204 No Content
app.delete('/todos/:id', (req, res) => {
  todos = todos.filter((x) => x.id != req.params.id);
  res.status(204).end();
});

app.listen(3000, () => console.log('API on :3000'));
