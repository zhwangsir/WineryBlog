// 查全
app.get('/todos', (req, res) => res.json(todos));

// 新增：201 Created
app.post('/todos', (req, res) => {
  const t = { id: Date.now(), text: req.body.text, done: false };
  todos.push(t);
  res.status(201).json(t);
});

// 修改状态：找不到返回 404
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
