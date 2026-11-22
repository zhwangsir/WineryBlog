// RAG smoke test: ask the librarian about Rust tutorials — expect REAL titles
const q = '站里有哪些 Rust 教程？';
const r = await fetch('http://127.0.0.1:3000/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'auto',
    messages: [{ role: 'user', content: q }],
  }),
});
const j = await r.json();
const c = j?.choices?.[0]?.message?.content || JSON.stringify(j).slice(0, 200);
console.log('status:', r.status);
console.log('reply head:', c.slice(0, 400).replace(/\n+/g, ' | '));
// 验证回复引用了真实存在的教程标题
const tuts = JSON.parse(await (await fetch('http://127.0.0.1:3000/api/tutorials')).json() && (await fetch('http://127.0.0.1:3000/api/tutorials')).text());
const realTitles = tuts.tutorials.filter(t => t.title.includes('Rust')).map(t => t.title);
const cited = realTitles.filter(t => c.includes(t.split('：')[0].slice(0, 6)));
console.log('real Rust tutorials:', JSON.stringify(realTitles));
console.log('cited-in-reply:', cited.length, 'of', realTitles.length);
