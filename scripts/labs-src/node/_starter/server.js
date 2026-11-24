// Node.js 后端环境：写好服务端代码后点「在终端运行」启动，再在终端里用 curl 调接口
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('你好，Express'));

app.listen(3000, () => console.log('API on :3000'));
