// express.json() 是解析 JSON 请求体的中间件
const express = require('express');
const app = express();
app.use(express.json());

let todos = [{ id: 1, text: '买牛奶', done: false }];
app.listen(3000, () => console.log('API on :3000'));
