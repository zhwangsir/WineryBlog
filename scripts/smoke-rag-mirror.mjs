// RAG mirror test: ask about MDN Flexbox docs — expect local mirror recommendation
const r = await fetch('http://127.0.0.1:3000/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'auto',
    messages: [{ role: 'user', content: 'MDN 上有 Flexbox 的文档吗？给我看看' }],
  }),
});
const j = await r.json();
const c = j?.choices?.[0]?.message?.content || '';
console.log('status:', r.status);
console.log('reply head:', c.slice(0, 350).replace(/\n+/g, ' | '));
console.log('cites local mirror:', c.includes('/post/ref-mdn-flex') || c.includes('ref-mdn-flex'));
console.log('external http links in reply:', (c.match(/\]\(https?:/g) || []).length + (c.match(/https?:\/\//gi) || []).length);
