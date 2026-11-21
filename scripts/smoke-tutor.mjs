// Smoke test: /api/tutor quiz mode one-shot
const tutorial = {
  title: 'Shell 脚本入门',
  content: '变量：NAME="winery"。条件判断：if [ "$1" -gt 10 ]。循环：for i in {1..10}; do echo $i; done',
};
const r = await fetch('http://127.0.0.1:3000/api/tutor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'quiz', title: tutorial.title, content: tutorial.content, messages: [{ role: 'user', content: '开始' }] }),
});
const j = await r.json();
const c = j?.choices?.[0]?.message?.content;
console.log('status:', r.status);
console.log('head:', String(c || JSON.stringify(j)).slice(0, 150).replace(/\n+/g, ' | '));
